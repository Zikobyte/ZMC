import { Router } from 'express';
import { PatientsController } from './patients.controller';
import { PatientsRepository } from './patients.repository';
import { validateCreatePatient, validateRecordVitals } from './patients.validator';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware';
import { query } from '../../database/db.repo';

const router = Router();
const controller = new PatientsController();
const patientRepository = new PatientsRepository();

router.use(authenticateJWT as any);

// OPD Relational Workflows (Must be declared before /:id parameter)
router.get('/opd/prices', controller.getPrices as any);
router.post('/opd/prices', authorizeRoles(['Administrator', 'IT Administrator', 'Management']) as any, controller.updatePrice as any);
router.get('/opd/invoices', controller.getInvoices as any);
router.get('/opd/companies', controller.getCompanies as any);
router.get('/opd/families', controller.getFamilies as any);
router.post('/opd/families/deposit', controller.addFamilyDeposit as any);
router.post('/opd/encounters', controller.createEncounter as any);
router.get('/opd/encounters', controller.getEncounters as any);
router.get('/opd/queue', controller.getQueue as any);
router.post('/opd/consultations/save-notes', controller.saveDoctorNotes as any);
router.post('/opd/queue/save-notes', controller.saveDoctorNotes as any);

// Select / Start Consultation for a patient (strictly patient-specific, prevents multiple active consultations under same doctor)
router.post('/opd/queue/:id/select', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const doctorName = req.body.doctorName || req.user?.username || 'Doctor';
    
    // 1. Check if target queue item exists
    const qItemCheck = await query('SELECT * FROM zmc_patient_queue WHERE id = $1', [id]);
    if (qItemCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Queue item not found.' });
    }
    const qItem = qItemCheck.rows[0];

    // 2. Check if doctor already has an active consultation with a DIFFERENT patient
    const activeDoctorQueue = await query(`
      SELECT q.*, p.name as patient_name 
      FROM zmc_patient_queue q
      LEFT JOIN zmc_patients p ON q.patient_id = p.id
      WHERE q.processed_by = $1 
        AND q.status = 'Processing' 
        AND q.queue_type = 'Doctor Consultation'
        AND q.id != $2
    `, [doctorName, id]);

    if (activeDoctorQueue.rows.length > 0) {
      const activeP = activeDoctorQueue.rows[0];
      return res.status(400).json({
        success: false,
        code: 'ACTIVE_CONSULTATION_EXISTS',
        activePatientName: activeP.patient_name || 'another patient',
        activeQueueId: activeP.id,
        error: `You already have an active consultation in progress with ${activeP.patient_name || 'another patient'}. Please complete or exit that consultation before starting a new one.`
      });
    }

    // 3. Check if target patient is already in consultation with ANOTHER doctor
    if (qItem.status === 'Processing' && qItem.processed_by && qItem.processed_by !== doctorName) {
      return res.status(400).json({
        success: false,
        error: `This patient is currently in active consultation with Dr. ${qItem.processed_by}.`
      });
    }

    // 4. Update queue item to Processing for this doctor
    await query(`
      UPDATE zmc_patient_queue
      SET status = 'Processing', processed_by = $1, processed_at = NOW()
      WHERE id = $2
    `, [doctorName, id]);

    // Update encounter status
    await query(`
      UPDATE zmc_encounters
      SET clinical_status = 'In Consultation'
      WHERE id = $1
    `, [qItem.encounter_id]);

    // Update patient status
    await query(`
      UPDATE zmc_patients
      SET status = 'In Consultation'
      WHERE id = $1
    `, [qItem.patient_id]);

    // Get patient details for broadcast
    const patientRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [qItem.patient_id]);
    const patientName = patientRes.rows[0]?.name || 'Outpatient';

    const { broadcastNotification } = await import('../../utils/ws.util');
    broadcastNotification({
      type: 'PATIENT_IN_CONSULTATION',
      targetRole: 'Doctor',
      message: `${patientName} is now in consultation with Dr. ${doctorName}.`,
      patientId: qItem.patient_id,
      data: { queueId: id, doctorName }
    });

    res.json({ success: true, message: 'Patient consultation started.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Exit / Hold Consultation for a patient
router.post('/opd/queue/:id/exit', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const doctorName = req.body.doctorName || req.user?.username || 'Doctor';

    const qItemCheck = await query('SELECT * FROM zmc_patient_queue WHERE id = $1', [id]);
    if (qItemCheck.rows.length > 0) {
      const qItem = qItemCheck.rows[0];

      await query(`
        UPDATE zmc_patient_queue
        SET status = 'Waiting', processed_by = NULL, processed_at = NULL
        WHERE id = $1
      `, [id]);

      await query(`
        UPDATE zmc_encounters
        SET clinical_status = 'Awaiting Doctor'
        WHERE id = $1
      `, [qItem.encounter_id]);

      await query(`
        UPDATE zmc_patients
        SET status = 'Waiting for Doctor'
        WHERE id = $1
      `, [qItem.patient_id]);

      const patientRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [qItem.patient_id]);
      const patientName = patientRes.rows[0]?.name || 'Outpatient';

      const { broadcastNotification } = await import('../../utils/ws.util');
      broadcastNotification({
        type: 'CONSULTATION_ON_HOLD',
        targetRole: 'Doctor',
        message: `Consultation for ${patientName} exited by Dr. ${doctorName}. Returned to queue.`,
        patientId: qItem.patient_id,
        data: { queueId: id }
      });
    }

    res.json({ success: true, message: 'Consultation exited successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route Laboratory Orders to Cashier without completing or ending the active consultation
router.post('/opd/queue/order-labs', async (req: any, res: any) => {
  try {
    const { patientId, encounterId, orderedTests } = req.body;
    const doctorName = req.user?.username || req.body.doctorName || 'Doctor';

    if (!orderedTests || orderedTests.length === 0) {
      return res.status(400).json({ success: false, error: 'No laboratory tests provided.' });
    }

    let totalLabAmount = 0;
    const testNames: string[] = [];
    const priceMap: { [key: string]: number } = {
      'Liver Function Test (LFT)': 15000,
      'Electrolyte, Urea, Creatinine (E/U/C)': 15000,
      'Lipid Profile': 15000,
      'Prostate Specific Antigen (PSA)': 18000,
      'Cholesterol': 7000,
      'Random Blood Sugar (RBS)': 1500,
      'Fasting Blood Sugar (FBS)': 1500,
      'Full Blood Count (FBC)': 7000,
      'Hormonal Assay': 60000,
      'HbA1c (Glycated Sugar)': 7000,
      'Urine Analysis (UA)': 2500,
      'Faecal Occult Blood Test (FOB)': 3000,
      'Pregnancy Test – PT (HCG)': 2500,
      'Widal Test': 7000,
      'Hepatitis B (HBsAg)': 3500,
      'Hepatitis C (HCV)': 3500,
      'VDRL (Syphilis)': 3500,
      'Retroviral Screening (RVS)': 5000,
      'Blood Percentage (HB)': 1500,
      'Blood Group (BG)': 4000,
      'Genotype (GT)': 8000,
      'EAR SWAB M/C/S': 7000,
      'HVS M/C/S': 7000,
      'Urine M/C/S': 7000,
      'Pus Swab M/C/S': 10000,
      'Semen Culture M/C/S': 15000,
      'Urethral Swab M/C/S': 7000,
      'Stool Culture M/C/S': 15000,
      'Sputum M/C/S': 10000,
      'H. pylori (HP)': 5000,
      'Stool Analysis': 5000,
      'Microfilaria (MF)': 5000,
      'Malaria Parasite (MP)': 3000
    };

    const { generateUUID } = await import('../../database/db.repo');

    for (const test of orderedTests) {
      const testName = test.name || (typeof test === 'string' ? test : 'General Pathology Test');
      let testPrice = Number(test.price);
      if (isNaN(testPrice) || testPrice <= 0) {
        testPrice = priceMap[testName] || 5000;
      }
      totalLabAmount += testPrice;
      testNames.push(`${testName} (₦${testPrice.toLocaleString()})`);

      // Check if this pending order already exists to avoid duplicates
      const existingOrder = await query(`
        SELECT id FROM zmc_laboratory_orders 
        WHERE patient_id = $1 AND encounter_id = $2 AND test_name = $3 AND status = 'Pending'
      `, [patientId, encounterId, testName]);

      if (existingOrder.rows.length === 0) {
        await query(`
          INSERT INTO zmc_laboratory_orders (id, patient_id, encounter_id, doctor_id, test_name, status, date_ordered)
          VALUES ($1, $2, $3, (SELECT id FROM zmc_users WHERE username = $4 LIMIT 1), $5, 'Pending', NOW())
        `, [generateUUID(), patientId, encounterId, doctorName, testName]);
      }
    }

    // Create unpaid invoice for the Cashier
    const invoiceDescription = `Laboratory Investigations Fee: ${testNames.join(', ')}`;
    await query(`
      INSERT INTO zmc_invoices (id, patient_id, encounter_id, amount, status, description, date_issued)
      VALUES ($1, $2, $3, $4, 'Unpaid', $5, NOW())
    `, [generateUUID(), patientId, encounterId, totalLabAmount, invoiceDescription]);

    // Queue for Cashier payment (Lab Payment) if not already queued
    const existingCashierQ = await query(`
      SELECT id FROM zmc_patient_queue
      WHERE encounter_id = $1 AND queue_type = 'Cashier Lab Payment' AND status = 'Waiting'
    `, [encounterId]);

    if (existingCashierQ.rows.length === 0) {
      await query(`
        INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
        SELECT $1, id, patient_id, 'Cashier Lab Payment', priority, 'Waiting', NOW()
        FROM zmc_encounters WHERE id = $2
      `, [generateUUID(), encounterId]);
    }

    // Broadcast notification to Cashier
    const patientRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
    const patientName = patientRes.rows[0]?.name || 'Outpatient';

    const { broadcastNotification } = await import('../../utils/ws.util');
    broadcastNotification({
      type: 'LAB_ORDER_SENT_TO_CASHIER',
      targetRole: 'Cashier',
      message: `Lab investigations (₦${totalLabAmount.toLocaleString()}) ordered for ${patientName}. Awaiting cashier payment.`,
      patientId,
      sender: doctorName,
    });

    res.json({
      success: true,
      message: `Laboratory orders (₦${totalLabAmount.toLocaleString()}) sent to Cashier. Consultation remains active.`,
      totalAmount: totalLabAmount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route Prescriptions / Medications to Cashier without ending the active consultation
router.post('/opd/queue/order-medications', async (req: any, res: any) => {
  try {
    const { patientId, encounterId, prescribedMedications } = req.body;
    const doctorName = req.user?.username || req.body.doctorName || 'Doctor';

    if (!prescribedMedications || prescribedMedications.length === 0) {
      return res.status(400).json({ success: false, error: 'No medications provided.' });
    }

    const priceMap: { [key: string]: number } = {
      'Paracetamol 500mg tab': 800,
      'Ibuprofen 400mg tab': 1200,
      'Diclofenac 50mg tab': 1500,
      'Artemether/Lumefantrine (Coartem)': 2800,
      'Dihydroartemisinin/Piperaquine': 3200,
      'Amoxicillin 500mg cap': 2500,
      'Amoxicillin/Clavulanate (Augmentin) 625mg': 4800,
      'Ciprofloxacin 500mg tab': 2200,
      'Azithromycin 500mg tab': 3500,
      'Metronidazole 400mg tab': 1000,
      'Cefuroxime 500mg tab': 4500,
      'Erythromycin 500mg tab': 2500,
      'Ampiclox cap': 2200,
      'Omeprazole 20mg cap': 2000,
      'Antacid Suspension (Mist Mag)': 1500,
      'Hyoscine Butylbromide (Buscopan)': 1800,
      'Metoclopramide 10mg tab': 800,
      'Oral Rehydration Salts (ORS)': 600,
      'Loperamide 2mg cap': 1000,
      'Cetirizine 10mg tab': 1200,
      'Loratadine 10mg tab': 1500,
      'Chlorpheniramine 4mg tab': 500,
      'Hydrocortisone 100mg inj': 2500,
      'Dexamethasone 4mg inj': 1800,
      'Vitamin C 100mg tab': 500,
      'Vitamin B-Complex tab': 800,
      'Folic Acid 5mg tab': 600,
      'Ferrous Sulphate 200mg tab': 800,
      'Multivitamin syrup': 2000,
      'Zinc Sulfate 20mg tab': 1000,
      'Amlodipine 5mg tab': 2000,
      'Lisinopril 5mg tab': 2500,
      'Lisinopril 10mg tab': 3000,
      'Metformin 500mg tab': 1800,
      'Glibenclamide 5mg tab': 1500,
      'Labetalol 100mg': 3500,
      'Methyldopa 250mg': 3000,
      'Ceftriaxone IV 1g': 4500,
      'Magnesium Sulphate 50% inj': 3500,
      'Artesunate IV 60mg': 4000,
      'Hydralazine IV 20mg': 3500,
      'Oxytocin 10 IU': 2500,
      'Diclofenac IM 75mg': 1500,
      'Promethazine IM 50mg': 1200
    };

    let totalMedAmount = 0;
    const medNames: string[] = [];
    const { generateUUID } = await import('../../database/db.repo');

    for (const med of prescribedMedications) {
      const drugName = med.name || (typeof med === 'string' ? med : 'Prescribed Medicine');
      let drugPrice = Number(med.price);
      if (isNaN(drugPrice) || drugPrice <= 0) {
        drugPrice = priceMap[drugName] || 1500;
      }
      totalMedAmount += drugPrice;
      const details = `${drugName} (${med.dose || 'Standard Dose'}${med.frequency ? ` - ${med.frequency}` : ''}${med.duration ? ` for ${med.duration}` : ''})`;
      medNames.push(`${details} - ₦${drugPrice.toLocaleString()}`);

      // Insert pharmacy order with status Pending Payment
      await query(`
        INSERT INTO zmc_pharmacy_orders (id, patient_id, encounter_id, doctor_id, medication_name, dosage, frequency, duration, status, date_ordered)
        VALUES ($1, $2, $3, (SELECT id FROM zmc_users WHERE username = $4 LIMIT 1), $5, $6, $7, $8, 'Pending Payment', NOW())
      `, [generateUUID(), patientId, encounterId, doctorName, drugName, med.dose || '', med.frequency || '', med.duration || '']);
    }

    // Create unpaid invoice for the Cashier
    const invoiceDescription = `Prescribed Pharmacy Medications: ${medNames.join(', ')}`;
    await query(`
      INSERT INTO zmc_invoices (id, patient_id, encounter_id, amount, status, description, date_issued)
      VALUES ($1, $2, $3, $4, 'Unpaid', $5, NOW())
    `, [generateUUID(), patientId, encounterId, totalMedAmount, invoiceDescription]);

    // Queue for Cashier payment (Pharmacy Payment) if not already queued
    const existingCashierQ = await query(`
      SELECT id FROM zmc_patient_queue
      WHERE encounter_id = $1 AND queue_type = 'Cashier Pharmacy Payment' AND status = 'Waiting'
    `, [encounterId]);

    if (existingCashierQ.rows.length === 0) {
      await query(`
        INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
        SELECT $1, id, patient_id, 'Cashier Pharmacy Payment', priority, 'Waiting', NOW()
        FROM zmc_encounters WHERE id = $2
      `, [generateUUID(), encounterId]);
    }

    // Broadcast notification to Cashier
    const patientRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
    const patientName = patientRes.rows[0]?.name || 'Outpatient';

    const { broadcastNotification } = await import('../../utils/ws.util');
    broadcastNotification({
      type: 'PRESCRIPTION_SENT_TO_CASHIER',
      targetRole: 'Cashier',
      message: `Prescriptions (₦${totalMedAmount.toLocaleString()}) ordered for ${patientName}. Awaiting cashier pharmacy payment.`,
      patientId,
      sender: doctorName,
    });

    res.json({
      success: true,
      message: `Prescriptions (₦${totalMedAmount.toLocaleString()}) sent to Cashier for pharmacy payment. Consultation remains active.`,
      totalAmount: totalMedAmount
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/opd/queue/lab-orders', controller.getLabOrders as any);
router.get('/opd/queue/lab-results', controller.getLabResults as any);
router.get('/opd/queue/pharmacy-orders', controller.getPharmacyOrders as any);
router.post('/opd/queue/vitals', controller.recordOPDVitals as any);
router.post('/opd/queue/consultation-complete', controller.completeConsultation as any);
router.post('/opd/queue/lab-complete', controller.completeLaboratoryTest as any);
router.post('/opd/queue/pharmacy-complete', controller.completePharmacyDispense as any);
router.post('/opd/queue/priority', controller.updateEncounterPriority as any);
router.post('/opd/cards/replace', controller.requestCardReplacement as any);
router.get('/opd/cards/replacements', controller.getCardReplacements as any);
router.get('/opd/duplicates', controller.checkDuplicates as any);
router.get('/dashboard/stats', controller.getDashboardStats as any);

// Search patients by name, hospital_number, phone, or id_number (for Returning Patients)
router.get('/search/returning', async (req: any, res: any) => {
  try {
    const q = req.query.q || req.query.query;
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      const allPatients = await query(`
        SELECT p.*, COALESCE(p.outstanding_balance, 0) as outstanding_balance
        FROM zmc_patients p
        ORDER BY p.registration_date DESC
        LIMIT 50
      `);
      return res.json({ success: true, data: allPatients.rows });
    }

    const searchTerm = `%${q.trim()}%`;
    const searchRes = await query(`
      SELECT p.*, COALESCE(p.outstanding_balance, 0) as outstanding_balance
      FROM zmc_patients p
      WHERE p.name ILIKE $1 
         OR p.hospital_number ILIKE $1 
         OR p.phone_number ILIKE $1 
         OR p.id_number ILIKE $1
         OR p.maternity_number ILIKE $1
      ORDER BY p.name ASC
      LIMIT 50
    `, [searchTerm]);

    res.json({ success: true, data: searchRes.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get comprehensive history of a returning patient
router.get('/:id/history', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Fetch patient info by ID or hospital_number
    const pRes = await query('SELECT * FROM zmc_patients WHERE id = $1 OR hospital_number = $1 LIMIT 1', [id]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    const patient = pRes.rows[0];
    const patientId = patient.id;
    const hospNo = patient.hospital_number || patientId;

    // Fetch Encounters
    let encounters: any[] = [];
    try {
      const encRes = await query(`
        SELECT * FROM zmc_encounters
        WHERE patient_id = $1 OR patient_id = $2
        ORDER BY created_at DESC
      `, [patientId, hospNo]);
      encounters = encRes.rows;
    } catch (e: any) {
      console.warn('History fetch warning - encounters:', e.message);
    }

    // Fetch Vitals
    let vitals: any[] = [];
    try {
      const vitRes = await query(`
        SELECT v.*, u.name as nurse_name
        FROM zmc_patient_vitals v
        LEFT JOIN zmc_users u ON v.recorded_by = u.name OR v.recorded_by = u.username
        WHERE v.patient_id = $1 OR v.patient_id = $2
        ORDER BY v.recorded_at DESC
      `, [patientId, hospNo]);
      vitals = vitRes.rows;
    } catch (e: any) {
      try {
        const vitRes = await query(`
          SELECT * FROM zmc_patient_vitals
          WHERE patient_id = $1 OR patient_id = $2
          ORDER BY recorded_at DESC
        `, [patientId, hospNo]);
        vitals = vitRes.rows;
      } catch (e2: any) {
        console.warn('History fetch warning - vitals:', e2.message);
      }
    }

    // Fetch Consultations with doctor details and notes
    let consultations: any[] = [];
    try {
      const consRes = await query(`
        SELECT c.*, 
               COALESCE(c.treatment_plan, c.diagnosis, '') as clinical_notes,
               u.name as doctor_name
        FROM zmc_consultations c
        LEFT JOIN zmc_users u ON c.doctor_id = u.id OR c.doctor_id = u.username
        WHERE c.patient_id = $1 OR c.patient_id = $2
        ORDER BY c.date DESC, c.created_at DESC
      `, [patientId, hospNo]);
      consultations = consRes.rows;
    } catch (e: any) {
      try {
        const consRes = await query(`
          SELECT c.*, 
                 COALESCE(c.treatment_plan, c.diagnosis, '') as clinical_notes
          FROM zmc_consultations c
          WHERE c.patient_id = $1 OR c.patient_id = $2
          ORDER BY c.date DESC
        `, [patientId, hospNo]);
        consultations = consRes.rows;
      } catch (e2: any) {
        console.warn('History fetch warning - consultations:', e2.message);
      }
    }

    // Fetch Lab Orders with Results
    let labOrders: any[] = [];
    try {
      const labRes = await query(`
        SELECT o.*, r.result_details, r.result_details as result_value, r.findings, r.findings as technician_notes, r.date_completed, u.name as doctor_name
        FROM zmc_laboratory_orders o
        LEFT JOIN zmc_laboratory_results r ON o.id = r.order_id
        LEFT JOIN zmc_users u ON o.doctor_id = u.id OR o.doctor_id = u.username
        WHERE o.patient_id = $1 OR o.patient_id = $2
        ORDER BY o.date_ordered DESC
      `, [patientId, hospNo]);
      labOrders = labRes.rows;
    } catch (e: any) {
      try {
        const labRes = await query(`SELECT * FROM zmc_laboratory_orders WHERE patient_id = $1 OR patient_id = $2`, [patientId, hospNo]);
        labOrders = labRes.rows;
      } catch (e2: any) {
        console.warn('History fetch warning - labOrders:', e2.message);
      }
    }

    // Fetch Pharmacy Orders
    let pharmacyOrders: any[] = [];
    try {
      const pharmRes = await query(`
        SELECT * FROM zmc_pharmacy_orders WHERE patient_id = $1 OR patient_id = $2 ORDER BY date_ordered DESC
      `, [patientId, hospNo]);
      pharmacyOrders = pharmRes.rows;
    } catch (e: any) {
      console.warn('History fetch warning - pharmacyOrders:', e.message);
    }

    // Fetch Invoices / Payments
    let invoices: any[] = [];
    try {
      const invRes = await query(`
        SELECT * FROM zmc_invoices WHERE patient_id = $1 OR patient_id = $2 ORDER BY date_issued DESC
      `, [patientId, hospNo]);
      invoices = invRes.rows;
    } catch (e: any) {
      console.warn('History fetch warning - invoices:', e.message);
    }

    // Fetch Outstanding Balances
    let outstandingBalances: any[] = [];
    try {
      const obRes = await query(`
        SELECT * FROM zmc_outstanding_balances WHERE patient_id = $1 OR patient_id = $2 ORDER BY created_at DESC
      `, [patientId, hospNo]);
      outstandingBalances = obRes.rows;
    } catch (e: any) {
      console.warn('History fetch warning - outstandingBalances:', e.message);
    }

    // Fetch Admissions if any
    let admissions: any[] = [];
    try {
      const admRes = await query(`
        SELECT * FROM zmc_admissions WHERE patient_id = $1 OR patient_id = $2 ORDER BY admitted_date DESC
      `, [patientId, hospNo]);
      admissions = admRes.rows;
    } catch (e: any) {
      console.warn('History fetch warning - admissions:', e.message);
    }

    res.json({
      success: true,
      data: {
        patient,
        encounters,
        vitals,
        consultations,
        labOrders,
        pharmacyOrders,
        invoices,
        outstandingBalances,
        admissions
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// EYE CLINIC SPECIALIZED RELATIONAL ROUTES
// ==========================================

// 1. Get all Eye Clinic Patients
router.get('/eye-clinic/patients', async (req: any, res: any) => {
  try {
    const result = await query(`
      SELECT 
        id, 
        hospital_number as "hospitalNumber", 
        name, 
        phone_number as "phoneNumber", 
        date_of_birth as "dateOfBirth", 
        occupation, 
        address, 
        next_of_kin as "nextOfKin", 
        status, 
        payment_status as "paymentStatus", 
        chief_complaint as "chiefComplaint", 
        history, 
        routine_exam as "routineExam", 
        external_exam as "externalExam", 
        diagnosis, 
        treatment_plan as "treatmentPlan", 
        CAST(total_bill AS FLOAT) as "totalBill", 
        CAST(paid_amount AS FLOAT) as "paidAmount", 
        CAST(balance AS FLOAT) as balance, 
        CAST(card_fee AS FLOAT) as "cardFee", 
        TO_CHAR(date_issued, 'YYYY-MM-DD') as "dateIssued",
        created_at as "createdAt"
      FROM zmc_eye_patients 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    console.error('Error fetching eye clinic patients:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Register New Eye Clinic Patient with Strict Validation & Duplicate Prevention
router.post('/eye-clinic/patients', async (req: any, res: any) => {
  try {
    const {
      name,
      phoneNumber,
      dateOfBirth,
      occupation,
      address,
      nextOfKin,
      chiefComplaint,
      history,
      cardType = 'new'
    } = req.body;

    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      errors.name = 'Full Name is required and must not be empty.';
    } else if (name.trim().length < 3) {
      errors.name = 'Full Name must be at least 3 characters.';
    }

    const cleanPhone = (phoneNumber || '').toString().trim().replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      errors.phoneNumber = 'A valid Phone Number with at least 7 digits is required.';
    }

    if (!dateOfBirth || !dateOfBirth.toString().trim()) {
      errors.dateOfBirth = 'Date of Birth is required.';
    } else {
      const dobDate = new Date(dateOfBirth);
      if (isNaN(dobDate.getTime())) {
        errors.dateOfBirth = 'Please provide a valid date for Date of Birth.';
      } else if (dobDate > new Date()) {
        errors.dateOfBirth = 'Date of Birth cannot be in the future.';
      }
    }

    if (!address || typeof address !== 'string' || !address.trim()) {
      errors.address = 'Residential Address is required.';
    }

    if (!nextOfKin || typeof nextOfKin !== 'string' || !nextOfKin.trim()) {
      errors.nextOfKin = 'Next of Kin name and relationship are required.';
    }

    if (!chiefComplaint || typeof chiefComplaint !== 'string' || !chiefComplaint.trim()) {
      errors.chiefComplaint = 'Chief Complaint is required for clinical ocular intake.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed. Please correct all highlighted fields.',
        errors
      });
    }

    // Duplicate Check: Check by exact phone number or exact (name + DOB)
    const duplicateCheck = await query(`
      SELECT id, hospital_number, name, phone_number, date_of_birth, status 
      FROM zmc_eye_patients 
      WHERE phone_number = $1 
         OR (LOWER(TRIM(name)) = LOWER(TRIM($2)) AND date_of_birth = $3)
    `, [cleanPhone, name.trim(), dateOfBirth.toString().trim()]);

    if (duplicateCheck.rows.length > 0) {
      const dup = duplicateCheck.rows[0];
      return res.status(409).json({
        success: false,
        error: `A patient with matching record already exists (${dup.name}, Card: ${dup.hospital_number}).`,
        code: 'DUPLICATE_PATIENT_FOUND',
        existingPatient: {
          id: dup.id,
          hospitalNumber: dup.hospital_number,
          name: dup.name,
          phoneNumber: dup.phone_number,
          dateOfBirth: dup.date_of_birth,
          status: dup.status
        }
      });
    }

    // Generate consecutive Hospital Card ID
    const countRes = await query('SELECT COUNT(*) as count FROM zmc_eye_patients');
    const nextSeq = 100000 + parseInt(countRes.rows[0].count, 10) + 1;
    const newId = `EC-${nextSeq}`;
    const isNew = cardType === 'new';

    const status = isNew ? 'Awaiting Cashier Verification' : 'Awaiting Consult';
    const paymentStatus = isNew ? 'UNPAID' : 'Paid';
    const cardFee = isNew ? 3000.00 : 0.00;
    const totalBill = cardFee;
    const paidAmount = isNew ? 0.00 : cardFee;
    const balance = isNew ? cardFee : 0.00;
    const dateIssued = new Date().toISOString().split('T')[0];

    const insertRes = await query(`
      INSERT INTO zmc_eye_patients (
        id, hospital_number, name, phone_number, date_of_birth, occupation, address, next_of_kin,
        status, payment_status, chief_complaint, history, total_bill, paid_amount, balance, card_fee, date_issued
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING 
        id, 
        hospital_number as "hospitalNumber", 
        name, 
        phone_number as "phoneNumber", 
        date_of_birth as "dateOfBirth", 
        occupation, 
        address, 
        next_of_kin as "nextOfKin", 
        status, 
        payment_status as "paymentStatus", 
        chief_complaint as "chiefComplaint", 
        history, 
        CAST(total_bill AS FLOAT) as "totalBill", 
        CAST(paid_amount AS FLOAT) as "paidAmount", 
        CAST(balance AS FLOAT) as balance, 
        CAST(card_fee AS FLOAT) as "cardFee", 
        TO_CHAR(date_issued, 'YYYY-MM-DD') as "dateIssued"
    `, [
      newId,
      newId,
      name.trim(),
      cleanPhone,
      dateOfBirth.toString().trim(),
      (occupation || '').trim(),
      address.trim(),
      nextOfKin.trim(),
      status,
      paymentStatus,
      chiefComplaint.trim(),
      (history || '').trim(),
      totalBill,
      paidAmount,
      balance,
      cardFee,
      dateIssued
    ]);

    const createdPatient = insertRes.rows[0];

    // Create billing invoice entry for Cashier queue
    if (isNew) {
      try {
        const invId = `INV-EC-${Date.now().toString().slice(-6)}`;
        await query(`
          INSERT INTO zmc_invoices (
            id, patient_id, encounter_id, items, total_amount, paid_amount, balance, status, department, created_by
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (id) DO NOTHING
        `, [
          invId,
          newId,
          newId,
          JSON.stringify([{ code: 'CLINICAL_CARD_EYE', description: 'Eye Clinic Patient Registration & Card Fee', quantity: 1, unitPrice: 3000, totalPrice: 3000, category: 'Clinical Card' }]),
          3000.00,
          0.00,
          3000.00,
          'Pending',
          'Eye Clinic',
          req.user?.name || req.user?.username || 'Eye Clinic Front Desk'
        ]);
      } catch (invErr) {
        console.warn('Could not record invoice in zmc_invoices:', invErr);
      }
    }

    res.status(201).json({
      success: true,
      message: `Eye patient ${name.trim()} successfully registered with card ${newId}.`,
      data: createdPatient
    });
  } catch (err: any) {
    console.error('Error registering eye clinic patient:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get All Completed Eye Clinic Consultations / Encounter Logs
router.get('/eye-clinic/consultations', async (req: any, res: any) => {
  try {
    const result = await query(`
      SELECT 
        id, 
        patient_id as "patientId", 
        patient_name as "patientName", 
        hospital_number as "hospitalNumber", 
        phone_number as "phoneNumber", 
        occupation, 
        TO_CHAR(date, 'YYYY-MM-DD') as date, 
        chief_complaint as "chiefComplaint", 
        history, 
        routine_exam as "routineExam", 
        external_exam as "externalExam", 
        diagnosis, 
        treatment_plan as "treatmentPlan", 
        vitals, 
        services, 
        CAST(total_bill AS FLOAT) as "totalBill", 
        CAST(total_paid AS FLOAT) as "totalPaid", 
        CAST(balance AS FLOAT) as balance, 
        payment_status as "paymentStatus", 
        status, 
        doctor_name as "doctorName",
        created_at as "createdAt"
      FROM zmc_eye_consultations 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    console.error('Error fetching eye clinic consultations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Save Eye Clinic Consultation & Generate Bill for Cashier
router.post('/eye-clinic/consultations', async (req: any, res: any) => {
  try {
    const {
      patientId,
      patientName,
      hospitalNumber,
      phoneNumber,
      occupation,
      chiefComplaint,
      history,
      routineExam,
      externalExam,
      diagnosis,
      treatmentPlan,
      vitals,
      services = [],
      totalBill = 0,
      totalPaid = 0,
      balance = 0,
      paymentStatus = 'UNPAID',
      doctorName
    } = req.body;

    if (!diagnosis || !diagnosis.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Clinical Diagnosis is required to complete and save an eye consultation.'
      });
    }

    const consultId = `REC-EC-${Date.now().toString().slice(-6)}`;
    const doc = doctorName || req.user?.name || req.user?.username || 'Dr. Clara Vance (Eye Clinic)';
    const dateToday = new Date().toISOString().split('T')[0];

    // 1. Insert into zmc_eye_consultations
    await query(`
      INSERT INTO zmc_eye_consultations (
        id, patient_id, patient_name, hospital_number, phone_number, occupation, date,
        chief_complaint, history, routine_exam, external_exam, diagnosis, treatment_plan,
        vitals, services, total_bill, total_paid, balance, payment_status, status, doctor_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
    `, [
      consultId,
      patientId,
      patientName || 'Eye Patient',
      hospitalNumber || patientId,
      phoneNumber || '',
      occupation || '',
      dateToday,
      chiefComplaint || '',
      history || '',
      routineExam || '',
      externalExam || '',
      diagnosis.trim(),
      treatmentPlan || '',
      JSON.stringify(vitals || {}),
      JSON.stringify(services || []),
      totalBill,
      totalPaid,
      balance,
      paymentStatus,
      'Consulted',
      doc
    ]);

    // 2. Update zmc_eye_patients
    await query(`
      UPDATE zmc_eye_patients 
      SET 
        status = 'Consulted',
        diagnosis = $1,
        treatment_plan = $2,
        total_bill = $3,
        balance = $4,
        chief_complaint = COALESCE(NULLIF($5, ''), chief_complaint),
        history = COALESCE(NULLIF($6, ''), history),
        routine_exam = COALESCE(NULLIF($7, ''), routine_exam),
        external_exam = COALESCE(NULLIF($8, ''), external_exam)
      WHERE id = $9 OR hospital_number = $9
    `, [
      diagnosis.trim(),
      treatmentPlan || '',
      totalBill,
      balance,
      chiefComplaint || '',
      history || '',
      routineExam || '',
      externalExam || '',
      patientId
    ]);

    // 3. Create / Update Cashier Invoice for Optical Store & Clinical Services
    if (Array.isArray(services) && services.length > 0) {
      const invId = `INV-EC-${Date.now().toString().slice(-6)}`;
      const invoiceItems = services.map((s: any) => ({
        code: (s.name || '').replace(/\s+/g, '_').toUpperCase(),
        description: `${s.name} (${s.category || 'Eye Clinic'})`,
        quantity: 1,
        unitPrice: s.price,
        totalPrice: s.price,
        category: s.category || 'Eye Clinic'
      }));

      await query(`
        INSERT INTO zmc_invoices (
          id, patient_id, encounter_id, items, total_amount, paid_amount, balance, status, department, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        invId,
        patientId,
        consultId,
        JSON.stringify(invoiceItems),
        totalBill,
        totalPaid,
        balance,
        paymentStatus === 'Paid' ? 'Paid' : (totalPaid > 0 ? 'Partially Paid' : 'Pending'),
        'Eye Clinic',
        doc
      ]);
    }

    res.status(201).json({
      success: true,
      message: `Consultation saved successfully and bill of ₦${Number(totalBill).toLocaleString()} logged for cashier.`,
      data: {
        id: consultId,
        patientId,
        hospitalNumber,
        diagnosis,
        totalBill,
        totalPaid,
        balance,
        status: 'Consulted'
      }
    });
  } catch (err: any) {
    console.error('Error saving eye consultation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Verify Cashier Payment for Eye Clinic Patient
router.post('/eye-clinic/verify-payment', async (req: any, res: any) => {
  try {
    const { patientId, amount, paymentMethod = 'Cash' } = req.body;
    
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Patient ID is required' });
    }

    const pRes = await query('SELECT * FROM zmc_eye_patients WHERE id = $1 OR hospital_number = $1', [patientId]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const p = pRes.rows[0];
    const totalBill = parseFloat(p.total_bill || '3000');
    const existingPaid = parseFloat(p.paid_amount || '0');
    const payAmt = amount ? parseFloat(amount) : (totalBill - existingPaid);

    const newPaid = Math.min(totalBill, existingPaid + payAmt);
    const newBalance = Math.max(0, totalBill - newPaid);
    const newPaymentStatus = newPaid >= totalBill ? 'Paid' : (newPaid > 0 ? 'Part Paid' : 'UNPAID');
    const newStatus = p.status === 'Awaiting Cashier Verification' ? 'Awaiting Consult' : p.status;

    const updated = await query(`
      UPDATE zmc_eye_patients 
      SET 
        status = $1,
        payment_status = $2,
        paid_amount = $3,
        balance = $4
      WHERE id = $5
      RETURNING 
        id, 
        hospital_number as "hospitalNumber", 
        name, 
        status, 
        payment_status as "paymentStatus", 
        CAST(total_bill AS FLOAT) as "totalBill", 
        CAST(paid_amount AS FLOAT) as "paidAmount", 
        CAST(balance AS FLOAT) as balance
    `, [newStatus, newPaymentStatus, newPaid, newBalance, p.id]);

    res.json({
      success: true,
      message: `Payment verified for ${p.name}. Payment status: ${newPaymentStatus}.`,
      data: updated.rows[0]
    });
  } catch (err: any) {
    console.error('Error verifying eye clinic payment:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Eye Clinic Stats Summary
router.get('/eye-clinic/stats', async (req: any, res: any) => {
  try {
    const patientsRes = await query('SELECT status, payment_status, balance FROM zmc_eye_patients');
    const patients = patientsRes.rows;

    const totalRecords = patients.length;
    const waitingConsultations = patients.filter((p: any) => p.status === 'Awaiting Consult' || p.status === 'Awaiting Cashier Verification').length;
    const paymentPending = patients.filter((p: any) => p.payment_status === 'UNPAID' || p.payment_status === 'Part Paid' || parseFloat(p.balance || '0') > 0).length;
    const completedToday = patients.filter((p: any) => p.status === 'Consulted').length;

    res.json({
      success: true,
      data: {
        totalRecords,
        waitingConsultations,
        paymentPending,
        completedToday
      }
    });
  } catch (err: any) {
    console.error('Error fetching eye clinic stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Re-queue returning patient for new consultation or visit
router.post('/:id/re-queue', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { visitType, priority, reason, visitReason, destinationClinic } = req.body;

    const pRes = await query('SELECT * FROM zmc_patients WHERE id = $1', [id]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    const patient = pRes.rows[0];

    const vType = visitType || visitReason || 'Returning Patient Consultation';
    const destClinic = destinationClinic || 'Doctor Consultation Room 1';
    const prio = priority || 'Normal';
    const prioReason = reason || visitReason || 'Returning patient routine visit';
    const createdBy = req.user?.username || req.user?.name || 'Reception Desk';

    const encounter = await patientRepository.createEncounter(id, vType, destClinic, prio, prioReason, createdBy);

    res.json({ 
      success: true, 
      message: `Returning patient ${patient.name} queued successfully.`,
      data: encounter
    });
  } catch (err: any) {
    console.error('Error re-queueing patient:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Retrieve all patients or specific patient
router.get('/', controller.getAll as any);
router.get('/:id', controller.getById as any);

// Register patient - OPD Clerk, Receptionist, Records Officer, IT Administrator, Administrator, Management, Doctor, Nurse, Cashier, Eye Clinic
router.post(
  '/',
  authorizeRoles([
    'OPD Clerk',
    'Receptionist',
    'Records Officer',
    'IT Administrator',
    'Administrator',
    'Management',
    'Doctor',
    'Nurse',
    'Head Nurse',
    'Cashier',
    'Eye Clinic',
    'Account Officer'
  ]) as any,
  validateCreatePatient,
  controller.create as any
);

// Update patient - Doctor, Nurse, Head Nurse, OPD Clerk, Receptionist, Records Officer, IT Administrator, Administrator, Management, Cashier, Eye Clinic
router.patch(
  '/:id',
  authorizeRoles([
    'OPD Clerk',
    'Doctor',
    'Nurse',
    'Head Nurse',
    'Receptionist',
    'Records Officer',
    'IT Administrator',
    'Administrator',
    'Management',
    'Cashier',
    'Eye Clinic'
  ]) as any,
  controller.update as any
);

// Record vitals - Nurse, Head Nurse, Doctor, OPD Clerk, Receptionist, Administrator, IT Administrator
router.post(
  '/:id/vitals',
  authorizeRoles([
    'Nurse',
    'Head Nurse',
    'Doctor',
    'OPD Clerk',
    'Receptionist',
    'Records Officer',
    'Administrator',
    'IT Administrator',
    'Management'
  ]) as any,
  validateRecordVitals,
  controller.recordVitals as any
);

export default router;
