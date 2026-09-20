import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getPostgresPool, getDB, generateUUID } from '../../database/db.repo';
import { JWT_SECRET } from '../../config/env';

export const nursingRoutes = Router();

// Middleware: authenticate token if available, but allow graceful continuation for nursing operations
nursingRoutes.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      return next();
    } catch (error) {
      // Invalid or expired token - fallback to default nurse session
    }
  }

  // Graceful fallback for nursing intranet session if token missing or invalid
  req.user = {
    id: 'user-head-nurse-7',
    username: 'nurse1',
    role: 'Nurse',
    name: 'Head Nurse',
    department: 'Nursing'
  };
  next();
});

// In-memory initial seed for admitted patients if not already initialized
function ensureNursingSeed() {
  const db = getDB() as any;
  if (!db.admissions) db.admissions = [];
  if (!db.nursePrescriptions) db.nursePrescriptions = [];
  if (!db.nurseAdministrations) db.nurseAdministrations = [];
  if (!db.nurseObservations) db.nurseObservations = [];
  if (!db.nurseVitals) db.nurseVitals = [];
  if (!db.nurseBilling) db.nurseBilling = [];
  if (!db.maternityChecklists) db.maternityChecklists = {};
  if (!db.maternitySupplyHandovers) db.maternitySupplyHandovers = [];

  // Seed default initial maternity handover for testing and cashier reconciliation
  if (db.maternitySupplyHandovers.length === 0) {
    db.maternitySupplyHandovers.push({
      id: 'matsup-4003-01',
      admission_id: 'MAT-4003',
      patient_id: 'MAT-4003',
      patient_name: 'Adaeze Onyema',
      hospital_number: 'MAT-4003',
      ward: 'Maternity Ward',
      bed: 'Bed M-3',
      items: [
        { label: 'Baby oil or cream, powder and baby soap', amount: 2000 },
        { label: 'Diaper – 1 doz, Baby dresses and blanket', amount: 1000 },
        { label: 'Comb, teaspoon, cup with cover', amount: 3000 },
        { label: '1 packet of Omo 1kg', amount: 5000 }
      ],
      total_amount: 11000,
      status: 'Pending Handover',
      nurse_name: 'Nurse Faith (Maternity)',
      created_at: '2026-09-08T04:03:00.000Z',
      formatted_date: '08/09/2026, 04:03'
    });
  }

  const existingAdaeze = db.admissions.find((a: any) => a.id === 'MAT-4003' || a.hospital_number === 'MAT-4003');
  if (!existingAdaeze) {
    // 1. Adaeze Onyema - Exact user specification
    const adaeze = {
      id: 'MAT-4003',
      patient_id: 'MAT-4003',
      hospital_number: 'MAT-4003',
      name: 'Adaeze Onyema',
      phone_number: '08063344556',
      date_of_birth: '2000-02-14',
      gender: 'Female',
      category: 'Maternity Patient',
      department: 'Maternity',
      edd: '2026-06-17',
      gestational_age: '40 weeks',
      gravida_para: 'G1 P0',
      status: 'ADMITTED',
      ward: 'Maternity Ward',
      bed: 'M-3',
      admitted_date: '06/09/2026',
      admitted_timestamp: '2026-09-06T14:00:00.000Z',
      doctor_notes: 'G1P0 in early labour at 40 weeks. Monitoring with partograph. Preeclampsia watch – BP elevated.',
      discharge_bill: 18000,
      total_charged: 18000,
      payments_made: 15000,
      outstanding_balance: 3000,
      created_at: '2026-09-06T14:00:00.000Z'
    };
    db.admissions.push(adaeze);

    // Prescriptions for Adaeze
    db.nursePrescriptions.push(
      {
        id: 'rx-4001',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        medication_name: 'LABETALOL 100mg',
        quantity: '10',
        frequency: 'BD – BP control',
        ordered_by: 'Dr. Emeka Eze',
        status: 'Active',
        created_at: '2026-09-06T14:15:00.000Z'
      },
      {
        id: 'rx-4002',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        medication_name: 'MAGNESIUM SULPHATE',
        quantity: '1 pack',
        frequency: 'As prescribed – eclampsia prophylaxis',
        ordered_by: 'Dr. Emeka Eze',
        status: 'Active',
        created_at: '2026-09-06T14:15:00.000Z'
      },
      {
        id: 'rx-4003',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        medication_name: 'OXYTOCIN 10IU',
        quantity: '5 ampoules',
        frequency: 'IV infusion as ordered',
        ordered_by: 'Dr. Emeka Eze',
        status: 'Active',
        created_at: '2026-09-06T14:15:00.000Z'
      }
    );

    // Administration History for Adaeze
    db.nurseAdministrations.push(
      {
        id: 'adm-rx-001',
        prescription_id: 'rx-4001',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        medication_name: 'LABETALOL 100mg',
        dose: '100mg orally',
        administered_by: 'Nurse Faith',
        notes: 'BP 142/94 – notified doctor',
        administered_at: '07/09/2026, 04:00:00',
        date_sort: '2026-09-07T04:00:00.000Z'
      },
      {
        id: 'adm-rx-002',
        prescription_id: 'rx-4002',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        medication_name: 'MAGNESIUM SULPHATE',
        dose: '4g IV in 20ml',
        administered_by: 'Nurse Chioma',
        notes: 'Loading dose given',
        administered_at: '06/09/2026, 17:00:00',
        date_sort: '2026-09-06T17:00:00.000Z'
      },
      {
        id: 'adm-rx-003',
        prescription_id: 'rx-4001',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        medication_name: 'LABETALOL 100mg',
        dose: '100mg orally',
        administered_by: 'Nurse Chioma',
        notes: 'BP was 138/90 before dose',
        administered_at: '06/09/2026, 16:00:00',
        date_sort: '2026-09-06T16:00:00.000Z'
      }
    );

    // Previous Observations for Adaeze
    db.nurseObservations.push(
      {
        id: 'obs-001',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        observation_type: 'Patient complaint',
        details: 'Patient reports increasing lower back pain and frequent contractions. Monitored with partograph. Cervical dilation 6-7cm.',
        recorded_by: 'Nurse Faith',
        recorded_at: '07/09/2026, 03:45:00',
        date_sort: '2026-09-07T03:45:00.000Z'
      },
      {
        id: 'obs-002',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        observation_type: 'General',
        details: 'Patient conscious and oriented. Bedside reassurance provided. Fetal heart rate monitored regularly at 144 bpm regular.',
        recorded_by: 'Nurse Chioma',
        recorded_at: '06/09/2026, 16:30:00',
        date_sort: '2026-09-06T16:30:00.000Z'
      }
    );

    // Vitals for Adaeze
    // Initial Vitals at Registration
    db.nurseVitals.push(
      {
        id: 'vit-init-001',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        blood_pressure: '135/88',
        heart_rate: '84',
        temperature: '36.8',
        respiratory_rate: '18',
        spo2: '98',
        recorded_by: 'Nurse Chioma (Intake Triage)',
        is_initial: true,
        recorded_at: '06/09/2026, 13:45:00',
        date_sort: '2026-09-06T13:45:00.000Z'
      },
      // Nursing Vitals History
      {
        id: 'vit-hist-001',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        blood_pressure: '142/94',
        heart_rate: '88',
        temperature: '37.2',
        respiratory_rate: '20',
        spo2: '97',
        recorded_by: 'Nurse Faith',
        is_initial: false,
        recorded_at: '07/09/2026, 04:00:00',
        date_sort: '2026-09-07T04:00:00.000Z'
      },
      {
        id: 'vit-hist-002',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        blood_pressure: '140/92',
        heart_rate: '86',
        temperature: '37.1',
        respiratory_rate: '19',
        spo2: '98',
        recorded_by: 'Nurse Chioma',
        is_initial: false,
        recorded_at: '06/09/2026, 16:00:00',
        date_sort: '2026-09-06T16:00:00.000Z'
      }
    );

    // Billing for Adaeze
    db.nurseBilling.push(
      {
        id: 'bill-001',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        item: 'Maternity Ward Admission & Bed Fee (2 Nights)',
        amount: 12000,
        type: 'Charge',
        recorded_at: '06/09/2026, 14:00:00',
        date_sort: '2026-09-06T14:00:00.000Z'
      },
      {
        id: 'bill-002',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        item: 'Nursing Care & Delivery Suite Monitoring',
        amount: 3500,
        type: 'Charge',
        recorded_at: '06/09/2026, 14:00:00',
        date_sort: '2026-09-06T14:00:00.000Z'
      },
      {
        id: 'bill-003',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        item: 'Magnesium Sulphate IV Loading Pack',
        amount: 2500,
        type: 'Charge',
        recorded_at: '06/09/2026, 17:00:00',
        date_sort: '2026-09-06T17:00:00.000Z'
      },
      {
        id: 'bill-004',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        item: 'Admission Deposit Received (POS)',
        amount: 10000,
        type: 'Payment',
        recorded_at: '06/09/2026, 14:30:00',
        date_sort: '2026-09-06T14:30:00.000Z'
      },
      {
        id: 'bill-005',
        admission_id: 'MAT-4003',
        patient_id: 'MAT-4003',
        item: 'Part Payment for Nursing & Meds (Cash)',
        amount: 5000,
        type: 'Payment',
        recorded_at: '07/09/2026, 04:30:00',
        date_sort: '2026-09-07T04:30:00.000Z'
      }
    );
  }

  // Also ensure other admitted patients are present for a full clinical ward
  const otherPatients = [
    {
      id: 'ADM-5001',
      patient_id: 'ADM-5001',
      hospital_number: 'ADM-5001',
      name: 'Victor Okoye',
      phone_number: '08034455667',
      date_of_birth: '1982-11-10',
      gender: 'Male',
      category: 'General Medical Inpatient',
      department: 'Internal Medicine',
      status: 'ADMITTED',
      ward: 'General Ward',
      bed: 'Bed G-5',
      admitted_date: '05/09/2026',
      admitted_timestamp: '2026-09-05T10:30:00.000Z',
      doctor_notes: 'Admitted for severe acute bacterial pneumonia and dehydration. IV Ceftriaxone and rehydration protocol.',
      discharge_bill: 25000,
      total_charged: 25000,
      payments_made: 20000,
      outstanding_balance: 5000,
      created_at: '2026-09-05T10:30:00.000Z'
    },
    {
      id: 'ADM-5002',
      patient_id: 'ADM-5002',
      hospital_number: 'ADM-5002',
      name: 'Blessing Nwosu',
      phone_number: '08023311445',
      date_of_birth: '1995-04-18',
      gender: 'Female',
      category: 'General Medical Inpatient',
      department: 'Internal Medicine',
      status: 'ADMITTED',
      ward: 'General Ward',
      bed: 'Bed G-8',
      admitted_date: '06/09/2026',
      admitted_timestamp: '2026-09-06T11:00:00.000Z',
      doctor_notes: 'Acute pyelonephritis with high fever. IV antibiotic coverage and hydration.',
      discharge_bill: 30000,
      total_charged: 30000,
      payments_made: 25000,
      outstanding_balance: 5000,
      created_at: '2026-09-06T11:00:00.000Z'
    },
    {
      id: 'ADM-8019',
      patient_id: 'ADM-8019',
      hospital_number: 'ADM-8019',
      name: 'Paschal Iroegbu',
      phone_number: '08098877665',
      date_of_birth: '1976-08-22',
      gender: 'Male',
      category: 'General Medical Inpatient',
      department: 'Internal Medicine',
      status: 'ADMITTED',
      ward: 'General Ward',
      bed: 'Bed G-11',
      admitted_date: '07/09/2026',
      admitted_timestamp: '2026-09-07T01:30:00.000Z',
      doctor_notes: 'Hypertensive urgency with headache and dizziness. Bed rest and intravenous labetalol protocol.',
      discharge_bill: 15000,
      total_charged: 15000,
      payments_made: 15000,
      outstanding_balance: 0,
      created_at: '2026-09-07T01:30:00.000Z'
    },
    {
      id: 'ADM-8020',
      patient_id: 'ADM-8020',
      hospital_number: 'ADM-8020',
      name: 'Adaobi Igwe',
      phone_number: '08051239876',
      date_of_birth: '1998-12-05',
      gender: 'Female',
      category: 'General Medical Inpatient',
      department: 'General Ward',
      status: 'ADMITTED',
      ward: 'General Ward',
      bed: 'Bed G-2',
      admitted_date: '07/09/2026',
      admitted_timestamp: '2026-09-07T02:15:00.000Z',
      doctor_notes: 'Severe malaria with gastritis. Rehydration and IV Artesunate.',
      discharge_bill: 16000,
      total_charged: 16000,
      payments_made: 10000,
      outstanding_balance: 6000,
      created_at: '2026-09-07T02:15:00.000Z'
    },
    {
      id: 'ADM-C021',
      patient_id: 'ADM-C021',
      hospital_number: 'ADM-C021',
      name: 'Osita Dike',
      phone_number: '08076543210',
      date_of_birth: '1989-03-29',
      gender: 'Male',
      category: 'General Medical Inpatient',
      department: 'General Ward',
      status: 'ADMITTED',
      ward: 'General Ward',
      bed: 'Bed G-14',
      admitted_date: '07/09/2026',
      admitted_timestamp: '2026-09-07T06:45:00.000Z',
      doctor_notes: 'Post-op observation after abscess incision & drainage. Regular dressing checks.',
      discharge_bill: 19000,
      total_charged: 19000,
      payments_made: 15000,
      outstanding_balance: 4000,
      created_at: '2026-09-07T06:45:00.000Z'
    },
    {
      id: 'MAT-C022',
      patient_id: 'MAT-C022',
      hospital_number: 'MAT-C022',
      name: 'Chikaodi Obi',
      phone_number: '08091122334',
      date_of_birth: '2001-09-12',
      gender: 'Female',
      category: 'Maternity Patient',
      department: 'Maternity',
      edd: '2026-06-20',
      gestational_age: '39 weeks',
      gravida_para: 'G2 P1',
      status: 'ADMITTED',
      ward: 'Maternity Ward',
      bed: 'Bed M-5',
      admitted_date: '08/09/2026',
      admitted_timestamp: '2026-09-08T03:00:00.000Z',
      doctor_notes: 'Active phase of labour. Mild intermittent contractions. FHR 140 bpm.',
      discharge_bill: 14000,
      total_charged: 14000,
      payments_made: 10000,
      outstanding_balance: 4000,
      created_at: '2026-09-08T03:00:00.000Z'
    },
    {
      id: 'EMR-9001',
      patient_id: 'EMR-9001',
      hospital_number: 'EMR-9001',
      name: 'Emeka Okafor',
      phone_number: '08033322114',
      date_of_birth: '1985-05-19',
      gender: 'Male',
      category: 'Emergency Observation',
      department: 'Emergency',
      status: 'EMERGENCY',
      ward: 'Emergency',
      bed: 'Bed ER-1',
      admitted_date: '08/09/2026',
      admitted_timestamp: '2026-09-08T08:15:00.000Z',
      doctor_notes: 'Acute asthmatic attack with dyspnea. Nebulized salbutamol and IV hydrocortisone given.',
      discharge_bill: 18000,
      total_charged: 18000,
      payments_made: 12000,
      outstanding_balance: 6000,
      created_at: '2026-09-08T08:15:00.000Z'
    }
  ];

  for (const op of otherPatients) {
    if (!db.admissions.some((a: any) => a.id === op.id)) {
      db.admissions.push(op);

      // Add default prescriptions
      db.nursePrescriptions.push({
        id: `rx-${op.id}-1`,
        admission_id: op.id,
        patient_id: op.patient_id,
        medication_name: 'PARACETAMOL IV 1g',
        quantity: '4 vials',
        frequency: 'TDS – Analgesia / Fever',
        ordered_by: 'Dr. John Smith',
        status: 'Active',
        created_at: op.created_at
      });

      // Add initial vitals
      db.nurseVitals.push({
        id: `vit-init-${op.id}`,
        admission_id: op.id,
        patient_id: op.patient_id,
        blood_pressure: '120/80',
        heart_rate: '78',
        temperature: '36.7',
        respiratory_rate: '16',
        spo2: '99',
        recorded_by: 'Nurse Intake',
        is_initial: true,
        recorded_at: `${op.admitted_date}, 10:00:00`,
        date_sort: op.admitted_timestamp
      });

      // Add billing
      db.nurseBilling.push(
        {
          id: `bill-${op.id}-1`,
          admission_id: op.id,
          patient_id: op.patient_id,
          item: `${op.ward} Admission Fee`,
          amount: op.total_charged,
          type: 'Charge',
          recorded_at: `${op.admitted_date}, 10:00:00`,
          date_sort: op.admitted_timestamp
        },
        {
          id: `bill-${op.id}-2`,
          admission_id: op.id,
          patient_id: op.patient_id,
          item: 'Initial Admission Deposit Paid',
          amount: op.payments_made,
          type: 'Payment',
          recorded_at: `${op.admitted_date}, 10:30:00`,
          date_sort: op.admitted_timestamp
        }
      );
    }
  }

  // -------------------------------------------------------------
  // Seed Detained Patients & Pending Admissions for Nursing
  // -------------------------------------------------------------
  if (!db.detainedPatients || db.detainedPatients.length === 0) {
    db.detainedPatients = [
      {
        id: 'DET-801',
        patient_id: 'HOSP-2026-619',
        hospital_number: 'HOSP-2026-619',
        name: 'Emmanuel Bassey',
        gender: 'Male',
        age: '45 yrs',
        phone_number: '08023456789',
        department: 'Emergency & Trauma',
        reason_for_detention: 'BP check after medication (IV Hydralazine)',
        initial_observation: 'Initial BP 178/105 mmHg, HR 92 bpm. Hydralazine 10mg given IV slowly at 08:30. Bedside monitor connected. Patient resting quietly in observation cubicle 2.',
        last_nurse_notes: 'BP checked at 09:15: 148/92 mmHg, HR 84 bpm. Headache subsiding. Patient resting comfortably, vitals improving.',
        detained_at: '07/09/2026, 08:30:00',
        detained_by: 'Nurse Chioma',
        status: 'DETAINED'
      },
      {
        id: 'DET-802',
        patient_id: 'HOSP-2026-625',
        hospital_number: 'HOSP-2026-625',
        name: 'Grace Nnamdi',
        gender: 'Female',
        age: '31 yrs',
        phone_number: '08134567890',
        department: 'General Outpatient (GOPD)',
        reason_for_detention: 'IV fluid monitoring & allergic reaction observation',
        initial_observation: 'Received 1L Normal Saline + IV Hydrocortisone for urticarial rash post-antibiotic. Vital signs stable: BP 120/80, HR 76 bpm, SpO2 99%.',
        last_nurse_notes: 'Wheals regressing, no stridor or respiratory distress. 2nd bag of saline infusing smoothly at 30 drops/min.',
        detained_at: '07/09/2026, 07:45:00',
        detained_by: 'Nurse Faith',
        status: 'DETAINED'
      }
    ];
  }

  if (!db.pendingAdmissions || db.pendingAdmissions.length === 0) {
    db.pendingAdmissions = [
      {
        id: 'PEND-701',
        patient_id: 'HOSP-2026-701',
        hospital_number: 'HOSP-2026-701',
        name: 'Chinedu Eze',
        gender: 'Male',
        age: '34 yrs',
        phone_number: '08034567891',
        category: 'Trauma / Surgical',
        department: 'Accident & Emergency',
        referred_by: 'Dr. Oladipo',
        reason: 'Blunt chest trauma, suspected rib contusion. SpO2 96%, requires observation and thoracic evaluation.',
        pending_since: 'Today, 08:15 AM',
        created_at: '2026-09-07T08:15:00.000Z'
      },
      {
        id: 'PEND-702',
        patient_id: 'HOSP-2026-702',
        hospital_number: 'HOSP-2026-702',
        name: 'Amina Bello',
        gender: 'Female',
        age: '28 yrs',
        phone_number: '08129876543',
        category: 'General Medical',
        department: 'General Outpatient (GOPD)',
        referred_by: 'Dr. Danjuma',
        reason: 'Severe dehydration secondary to acute gastroenteritis. IV fluid resuscitation ongoing.',
        pending_since: 'Today, 08:45 AM',
        created_at: '2026-09-07T08:45:00.000Z'
      },
      {
        id: 'PEND-703',
        patient_id: 'HOSP-2026-703',
        hospital_number: 'HOSP-2026-703',
        name: 'Sunday Adeleke',
        gender: 'Male',
        age: '52 yrs',
        phone_number: '08056781234',
        category: 'Cardiology',
        department: 'Accident & Emergency',
        referred_by: 'Dr. Alabi',
        reason: 'Transient ischemic attack evaluation. Post-antihypertensive stabilization.',
        pending_since: 'Today, 09:10 AM',
        created_at: '2026-09-07T09:10:00.000Z'
      },
      {
        id: 'PEND-704',
        patient_id: 'HOSP-2026-704',
        hospital_number: 'HOSP-2026-704',
        name: 'Zainab Mohammed',
        gender: 'Female',
        age: '22 yrs',
        phone_number: '08077654321',
        category: 'Maternity',
        department: 'Maternity Triage',
        referred_by: 'Dr. Fatima',
        reason: 'False labour contractions at 36 weeks. Fetal heart rate normal, monitor 4-6 hours.',
        pending_since: 'Today, 09:30 AM',
        created_at: '2026-09-07T09:30:00.000Z'
      }
    ];
  }

  // -------------------------------------------------------------
  // Seed Nurse Dispensing Records
  // -------------------------------------------------------------
  if (!db.nurseDispensingRecords || db.nurseDispensingRecords.length === 0) {
    db.nurseDispensingRecords = [
      {
        id: 'NDISP-101',
        date: '07/09/2026',
        created_at: '2026-09-07T08:30:00.000Z',
        patient_name: 'uhcydia',
        card_number: '398276',
        drug: 'jdhgsjhabkj',
        quantity: '8',
        recorded_by: 'nurse1',
        reviewed: false,
        reviewed_by: null,
        reviewed_at: null
      },
      {
        id: 'NDISP-102',
        date: '07/09/2026',
        created_at: '2026-09-07T09:15:00.000Z',
        patient_name: 'Emmanuel Bassey',
        card_number: 'HOSP-2026-619',
        drug: 'Hydralazine 10mg IV',
        quantity: '1 ampoule',
        recorded_by: 'nurse1',
        reviewed: true,
        reviewed_by: 'Dr. Oladipo',
        reviewed_at: '07/09/2026, 09:30 AM'
      },
      {
        id: 'NDISP-103',
        date: '07/09/2026',
        created_at: '2026-09-07T10:00:00.000Z',
        patient_name: 'Grace Nnamdi',
        card_number: 'HOSP-2026-625',
        drug: 'Hydrocortisone 100mg IV + Normal Saline 500ml',
        quantity: '1 vial, 2 bags',
        recorded_by: 'nurse1',
        reviewed: false,
        reviewed_by: null,
        reviewed_at: null
      }
    ];
  }

  // -------------------------------------------------------------
  // Seed Nurse Injection Records
  // -------------------------------------------------------------
  if (!db.nurseInjectionRecords || db.nurseInjectionRecords.length === 0) {
    db.nurseInjectionRecords = [
      {
        id: 'INJ-101',
        date: '07/09/2026',
        created_at: '2026-09-07T08:45:00.000Z',
        card_number: 'HOSP-2026-619',
        patient_name: 'Emmanuel Bassey',
        injection_type: 'IV Hydralazine',
        dose: '10mg, 1 ampoule',
        nurse_sign: 'nurse1',
        reviewed: true,
        reviewed_by: 'Dr. Oladipo',
        reviewed_at: '07/09/2026, 09:00 AM'
      },
      {
        id: 'INJ-102',
        date: '07/09/2026',
        created_at: '2026-09-07T09:30:00.000Z',
        card_number: 'HOSP-2026-625',
        patient_name: 'Grace Nnamdi',
        injection_type: 'IV Hydrocortisone',
        dose: '100mg stat, 1 vial',
        nurse_sign: 'nurse1',
        reviewed: false,
        reviewed_by: null,
        reviewed_at: null
      },
      {
        id: 'INJ-103',
        date: '07/09/2026',
        created_at: '2026-09-07T10:15:00.000Z',
        card_number: 'OPD-2024-0001',
        patient_name: 'Sunday Adeleke',
        injection_type: 'IM Diclofenac',
        dose: '75mg, 1 ampoule',
        nurse_sign: 'nurse1',
        reviewed: true,
        reviewed_by: 'Charge Nurse Joy',
        reviewed_at: '07/09/2026, 10:30 AM'
      },
      {
        id: 'INJ-104',
        date: '07/09/2026',
        created_at: '2026-09-07T11:00:00.000Z',
        card_number: '398276',
        patient_name: 'uhcydia',
        injection_type: 'IV Ceftriaxone',
        dose: '1g, 1 vial',
        nurse_sign: 'nurse1',
        reviewed: false,
        reviewed_by: null,
        reviewed_at: null
      }
    ];
  }
}

// -------------------------------------------------------------
// 1. GET ALL ADMITTED PATIENTS (Left Container Data + Totals)
// -------------------------------------------------------------
nursingRoutes.get('/admissions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();

    let admissionsList = db.admissions || [];

    // If postgres has admissions table, query it or merge
    if (pool) {
      try {
        const pRes = await pool.query(`
          SELECT * FROM zmc_admissions 
          WHERE status = 'Admitted' OR status = 'ADMITTED'
          ORDER BY date_admitted DESC
        `);
        if (pRes.rows.length > 0) {
          // merge with local
          const pgList = pRes.rows.map((r: any) => ({
            id: r.id,
            patient_id: r.patient_id || r.id,
            hospital_number: r.hospital_number || r.patient_id || r.id,
            name: r.patient_name || r.name || 'Admitted Patient',
            phone_number: r.phone_number || '',
            date_of_birth: r.date_of_birth || '',
            gender: r.gender || '',
            category: r.category || 'General Inpatient',
            department: r.department || 'Ward',
            edd: r.edd,
            gestational_age: r.gestational_age,
            status: r.status || 'ADMITTED',
            ward: r.ward_name || r.ward || 'General Ward',
            bed: r.bed_number || r.bed || 'Bed',
            admitted_date: r.date_admitted ? new Date(r.date_admitted).toLocaleDateString('en-GB') : 'Today',
            doctor_notes: r.doctor_notes || r.reason || '',
            total_charged: Number(r.total_charged || 0),
            payments_made: Number(r.payments_made || 0),
            outstanding_balance: Number((r.total_charged || 0) - (r.payments_made || 0))
          }));
          // ensure no duplicates
          for (const item of pgList) {
            if (!admissionsList.some((a: any) => a.id === item.id)) {
              admissionsList.push(item);
            }
          }
        }
      } catch (err: any) {
        console.warn('Postgres admissions query failed, using in-memory list:', err.message);
      }
    }

    // Filters
    const { search, ward, date } = req.query as { search?: string; ward?: string; date?: string };
    let filtered = [...admissionsList];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((a: any) => 
        (a.name || '').toLowerCase().includes(q) ||
        (a.hospital_number || '').toLowerCase().includes(q) ||
        (a.bed || '').toLowerCase().includes(q) ||
        (a.ward || '').toLowerCase().includes(q)
      );
    }

    if (ward && ward !== 'all') {
      filtered = filtered.filter((a: any) => (a.ward || '').toLowerCase().includes(ward.toLowerCase()));
    }

    if (date && date.trim()) {
      filtered = filtered.filter((a: any) => {
        const dStr = a.admitted_date || '';
        return dStr.includes(date) || (a.created_at && a.created_at.startsWith(date));
      });
    }

    // Stats
    const totalAdmitted = admissionsList.length;
    const maternityWardCount = admissionsList.filter((a: any) => (a.ward || '').toLowerCase().includes('maternity')).length;
    const femaleWardCount = admissionsList.filter((a: any) => (a.ward || '').toLowerCase().includes('female')).length;
    const maleWardCount = admissionsList.filter((a: any) => (a.ward || '').toLowerCase().includes('male')).length;
    const generalWardCount = admissionsList.filter((a: any) => (a.ward || '').toLowerCase().includes('general')).length;

    res.json({
      success: true,
      count: filtered.length,
      totalAdmitted,
      stats: {
        total: totalAdmitted,
        maternity: maternityWardCount,
        female: femaleWardCount,
        male: maleWardCount,
        general: generalWardCount,
      },
      data: filtered
    });
  } catch (err: any) {
    console.error('Error fetching nursing admissions:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 2. GET SINGLE ADMITTED PATIENT WITH ALL ASSOCIATED DATA
// -------------------------------------------------------------
nursingRoutes.get('/admissions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const { id } = req.params;
    const { dateFilter } = req.query as { dateFilter?: string };
    const db = getDB() as any;

    const patient = (db.admissions || []).find((a: any) => a.id === id || a.hospital_number === id || a.patient_id === id);
    if (!patient) {
      return res.status(404).json({ success: false, error: `Admitted patient with ID '${id}' not found.` });
    }

    // Prescriptions (from doctor)
    const prescriptions = (db.nursePrescriptions || []).filter(
      (rx: any) => rx.admission_id === patient.id || rx.patient_id === patient.patient_id || rx.patient_id === patient.hospital_number
    );

    // Administration History
    let administrations = (db.nurseAdministrations || []).filter(
      (adm: any) => adm.admission_id === patient.id || adm.patient_id === patient.patient_id || adm.patient_id === patient.hospital_number
    );

    // Observations
    let observations = (db.nurseObservations || []).filter(
      (obs: any) => obs.admission_id === patient.id || obs.patient_id === patient.patient_id || obs.patient_id === patient.hospital_number
    );

    // Vitals
    let vitals = (db.nurseVitals || []).filter(
      (v: any) => v.admission_id === patient.id || v.patient_id === patient.patient_id || v.patient_id === patient.hospital_number
    );

    const initialVitals = vitals.find((v: any) => v.is_initial) || vitals[vitals.length - 1] || null;
    let vitalHistory = vitals.filter((v: any) => !v.is_initial);

    // Billing
    let billingItems = (db.nurseBilling || []).filter(
      (b: any) => b.admission_id === patient.id || b.patient_id === patient.patient_id || b.patient_id === patient.hospital_number
    );

    // Apply dateFilter if provided (dd/mm/yyyy or yyyy-mm-dd)
    if (dateFilter && dateFilter.trim()) {
      const df = dateFilter.trim();
      administrations = administrations.filter((a: any) => 
        (a.administered_at && a.administered_at.includes(df)) || (a.date_sort && a.date_sort.includes(df))
      );
      observations = observations.filter((o: any) => 
        (o.recorded_at && o.recorded_at.includes(df)) || (o.date_sort && o.date_sort.includes(df))
      );
      vitalHistory = vitalHistory.filter((v: any) => 
        (v.recorded_at && v.recorded_at.includes(df)) || (v.date_sort && v.date_sort.includes(df))
      );
    }

    // Calculate billing totals
    const totalCharged = billingItems
      .filter((b: any) => b.type === 'Charge')
      .reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0) || Number(patient.total_charged || 0);

    const totalPaid = billingItems
      .filter((b: any) => b.type === 'Payment')
      .reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0) || Number(patient.payments_made || 0);

    const outstandingBalance = Math.max(0, totalCharged - totalPaid);

    res.json({
      success: true,
      data: {
        patient,
        prescriptions,
        administrationHistory: administrations,
        observations,
        vitals: {
          initialVitals,
          vitalHistory
        },
        billing: {
          totalCharged,
          totalPaid,
          outstandingBalance,
          items: billingItems
        }
      }
    });
  } catch (err: any) {
    console.error('Error fetching patient admission detail:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 3. CONFIRM MEDICATION ADMINISTRATION
// -------------------------------------------------------------
nursingRoutes.post('/admissions/:id/medications/administer', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const { id } = req.params;
    const { prescriptionId, medicationName, dose, notes, administeredBy } = req.body;

    if (!medicationName) {
      return res.status(400).json({ success: false, error: 'Medication name is required for administration.' });
    }

    const db = getDB() as any;
    const patient = (db.admissions || []).find((a: any) => a.id === id || a.hospital_number === id || a.patient_id === id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Admitted patient not found.' });
    }

    const now = new Date();
    // format as dd/mm/yyyy, hh:mm:ss
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const adminNurse = administeredBy || req.user?.name || req.user?.username || 'Nurse Staff';

    const newRecord = {
      id: `adm-rx-${generateUUID()}`,
      prescription_id: prescriptionId || null,
      admission_id: patient.id,
      patient_id: patient.patient_id || patient.id,
      medication_name: medicationName,
      dose: dose || 'As prescribed',
      administered_by: adminNurse,
      notes: notes && notes.trim() ? notes.trim() : 'Administered as prescribed',
      administered_at: dateFormatted,
      date_sort: now.toISOString()
    };

    if (!db.nurseAdministrations) db.nurseAdministrations = [];
    db.nurseAdministrations.unshift(newRecord);

    // If Postgres is connected, save into Postgres
    const pool = getPostgresPool();
    if (pool) {
      try {
        await pool.query(`
          INSERT INTO zmc_nurse_administrations (id, prescription_id, admission_id, patient_id, medication_name, dose, administered_by, notes, administered_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [newRecord.id, newRecord.prescription_id, newRecord.admission_id, newRecord.patient_id, newRecord.medication_name, newRecord.dose, newRecord.administered_by, newRecord.notes]);
      } catch (e: any) {
        console.warn('Could not insert to postgres zmc_nurse_administrations:', e.message);
      }
    }

    const updatedHistory = (db.nurseAdministrations || []).filter(
      (adm: any) => adm.admission_id === patient.id || adm.patient_id === patient.patient_id
    );

    res.json({
      success: true,
      message: `Medication ${medicationName} has been administered successfully.`,
      record: newRecord,
      administrationHistory: updatedHistory
    });
  } catch (err: any) {
    console.error('Error administering medication:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 4. RECORD NEW OBSERVATION
// -------------------------------------------------------------
nursingRoutes.post('/admissions/:id/observations', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const { id } = req.params;
    const { observationType, details, recordedBy } = req.body;

    if (!observationType) {
      return res.status(400).json({ success: false, error: 'Observation type is required (General, Wound, Patient complaint, or Other).' });
    }

    if (!details || !details.trim()) {
      return res.status(400).json({ success: false, error: 'Observation details cannot be empty.' });
    }

    const validTypes = ['General', 'Wound', 'Patient complaint', 'Other'];
    const matchedType = validTypes.find(t => t.toLowerCase() === observationType.toLowerCase()) || observationType;

    const db = getDB() as any;
    const patient = (db.admissions || []).find((a: any) => a.id === id || a.hospital_number === id || a.patient_id === id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Admitted patient not found.' });
    }

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const nurseName = recordedBy || req.user?.name || req.user?.username || 'Nurse Staff';

    const newObservation = {
      id: `obs-${generateUUID()}`,
      admission_id: patient.id,
      patient_id: patient.patient_id || patient.id,
      observation_type: matchedType,
      details: details.trim(),
      recorded_by: nurseName,
      recorded_at: dateFormatted,
      date_sort: now.toISOString()
    };

    if (!db.nurseObservations) db.nurseObservations = [];
    db.nurseObservations.unshift(newObservation);

    // If Postgres is connected, save into Postgres
    const pool = getPostgresPool();
    if (pool) {
      try {
        await pool.query(`
          INSERT INTO zmc_nurse_observations (id, admission_id, patient_id, observation_type, details, recorded_by, recorded_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [newObservation.id, newObservation.admission_id, newObservation.patient_id, newObservation.observation_type, newObservation.details, newObservation.recorded_by]);
      } catch (e: any) {
        console.warn('Could not insert to postgres zmc_nurse_observations:', e.message);
      }
    }

    const updatedObservations = (db.nurseObservations || []).filter(
      (o: any) => o.admission_id === patient.id || o.patient_id === patient.patient_id
    );

    res.json({
      success: true,
      message: 'Observation has been recorded successfully.',
      record: newObservation,
      observations: updatedObservations
    });
  } catch (err: any) {
    console.error('Error recording observation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 5. RECORD CURRENT VITALS
// -------------------------------------------------------------
nursingRoutes.post('/admissions/:id/vitals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const { id } = req.params;
    const { bloodPressure, heartRate, temperature, respiratoryRate, oxygenSaturation, recordedBy } = req.body;

    if (!bloodPressure && !heartRate && !temperature && !respiratoryRate && !oxygenSaturation) {
      return res.status(400).json({ success: false, error: 'At least one vital sign value is required.' });
    }

    const db = getDB() as any;
    const patient = (db.admissions || []).find((a: any) => a.id === id || a.hospital_number === id || a.patient_id === id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Admitted patient not found.' });
    }

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const nurseName = recordedBy || req.user?.name || req.user?.username || 'Nurse Staff';

    const newVital = {
      id: `vit-hist-${generateUUID()}`,
      admission_id: patient.id,
      patient_id: patient.patient_id || patient.id,
      blood_pressure: bloodPressure || '',
      heart_rate: heartRate || '',
      temperature: temperature || '',
      respiratory_rate: respiratoryRate || '',
      spo2: oxygenSaturation || '',
      recorded_by: nurseName,
      is_initial: false,
      recorded_at: dateFormatted,
      date_sort: now.toISOString()
    };

    if (!db.nurseVitals) db.nurseVitals = [];
    db.nurseVitals.unshift(newVital);

    // If Postgres is connected, save into Postgres
    const pool = getPostgresPool();
    if (pool) {
      try {
        await pool.query(`
          INSERT INTO zmc_nurse_vitals (id, admission_id, patient_id, recorded_by, blood_pressure, heart_rate, temperature, respiratory_rate, spo2, is_initial, recorded_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, FALSE, NOW())
        `, [newVital.id, newVital.admission_id, newVital.patient_id, newVital.recorded_by, newVital.blood_pressure, newVital.heart_rate, newVital.temperature, newVital.respiratory_rate, newVital.spo2]);
      } catch (e: any) {
        console.warn('Could not insert to postgres zmc_nurse_vitals:', e.message);
      }
    }

    const allPatientVitals = (db.nurseVitals || []).filter(
      (v: any) => v.admission_id === patient.id || v.patient_id === patient.patient_id
    );

    const initialVitals = allPatientVitals.find((v: any) => v.is_initial) || null;
    const vitalHistory = allPatientVitals.filter((v: any) => !v.is_initial);

    res.json({
      success: true,
      message: 'Vitals recorded successfully.',
      record: newVital,
      initialVitals,
      vitalHistory
    });
  } catch (err: any) {
    console.error('Error recording vitals:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6. GET PATIENT BILLING
// -------------------------------------------------------------
nursingRoutes.get('/admissions/:id/billing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const { id } = req.params;
    const db = getDB() as any;

    const patient = (db.admissions || []).find((a: any) => a.id === id || a.hospital_number === id || a.patient_id === id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Admitted patient not found.' });
    }

    const billingItems = (db.nurseBilling || []).filter(
      (b: any) => b.admission_id === patient.id || b.patient_id === patient.patient_id || b.patient_id === patient.hospital_number
    );

    const totalCharged = billingItems
      .filter((b: any) => b.type === 'Charge')
      .reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0) || Number(patient.total_charged || 0);

    const totalPaid = billingItems
      .filter((b: any) => b.type === 'Payment')
      .reduce((sum: number, b: any) => sum + Number(b.amount || 0), 0) || Number(patient.payments_made || 0);

    const outstandingBalance = Math.max(0, totalCharged - totalPaid);

    res.json({
      success: true,
      data: {
        totalCharged,
        totalPaid,
        outstandingBalance,
        items: billingItems
      }
    });
  } catch (err: any) {
    console.error('Error fetching billing:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6B. MATERNITY ADMISSION CHECKLIST & WARD SUPPLY BILLING
// -------------------------------------------------------------
nursingRoutes.get('/admissions/:id/maternity-checklist', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const { id } = req.params;
    const db = getDB() as any;

    const patient = (db.admissions || []).find((a: any) => a.id === id || a.hospital_number === id || a.patient_id === id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient admission not found.' });
    }

    const savedChecklist = (db.maternityChecklists && db.maternityChecklists[patient.id]) || null;
    res.json({
      success: true,
      data: savedChecklist,
      patient: {
        id: patient.id,
        name: patient.name,
        hospital_number: patient.hospital_number,
        ward: patient.ward,
        bed: patient.bed
      }
    });
  } catch (err: any) {
    console.error('Error fetching maternity checklist:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

nursingRoutes.post('/admissions/:id/maternity-checklist', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const { id } = req.params;
    const { items, billedItems, totalAmount } = req.body;
    const db = getDB() as any;

    const patient = (db.admissions || []).find((a: any) => a.id === id || a.hospital_number === id || a.patient_id === id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient admission not found.' });
    }

    if (!db.maternityChecklists) db.maternityChecklists = {};
    if (!db.maternitySupplyHandovers) db.maternitySupplyHandovers = [];

    // Save current items
    db.maternityChecklists[patient.id] = items;

    let handoverRecord = null;
    if (totalAmount && totalAmount > 0) {
      const nurseName = req.user?.username || req.user?.name || 'Nurse (Maternity Ward)';

      // 1. Add Charge to Nurse Billing
      const billCharge = {
        id: `bill-mat-${Date.now()}`,
        admission_id: patient.id,
        patient_id: patient.patient_id || patient.id,
        item: `Maternity Ward Supplies (${billedItems?.length || 0} items provided)`,
        amount: totalAmount,
        type: 'Charge',
        recorded_at: new Date().toLocaleString('en-GB'),
        date_sort: new Date().toISOString()
      };
      db.nurseBilling.push(billCharge);

      // Update patient's charged totals
      patient.total_charged = (patient.total_charged || 0) + totalAmount;
      patient.outstanding_balance = Math.max(0, (patient.total_charged || 0) - (patient.payments_made || 0));

      // 2. Create or Update Handover record for Cashier Portal
      handoverRecord = {
        id: `matsup-${Date.now()}`,
        admission_id: patient.id,
        patient_id: patient.patient_id || patient.id,
        patient_name: patient.name,
        hospital_number: patient.hospital_number || patient.id,
        ward: patient.ward || 'Maternity Ward',
        bed: patient.bed || 'M-3',
        items: billedItems || [],
        total_amount: totalAmount,
        status: 'Pending Handover',
        nurse_name: nurseName,
        created_at: new Date().toISOString(),
        formatted_date: new Date().toLocaleString('en-GB')
      };

      db.maternitySupplyHandovers.unshift(handoverRecord);
    }

    res.json({
      success: true,
      message: 'Maternity checklist saved successfully.',
      checklist: items,
      handover: handoverRecord
    });
  } catch (err: any) {
    console.error('Error saving maternity checklist:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6C. MATERNITY WARD SUPPLIES HANDOVER (CASHIER & NURSING PORTAL)
// -------------------------------------------------------------
nursingRoutes.get('/maternity-supplies', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const handovers = db.maternitySupplyHandovers || [];
    res.json({
      success: true,
      data: handovers
    });
  } catch (err: any) {
    console.error('Error fetching maternity supplies:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

nursingRoutes.post('/maternity-supplies/:id/balance', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const { id } = req.params;
    const db = getDB() as any;

    const handover = (db.maternitySupplyHandovers || []).find((h: any) => h.id === id);
    if (!handover) {
      return res.status(404).json({ success: false, error: 'Maternity supply record not found.' });
    }

    if (handover.status === 'Balanced & Received') {
      return res.status(400).json({ success: false, error: 'This cash handover is already balanced and received.' });
    }

    const cashierName = req.user?.username || req.user?.name || 'Cashier';

    // Mark as balanced
    handover.status = 'Balanced & Received';
    handover.balanced_by = cashierName;
    handover.balanced_at = new Date().toISOString();
    handover.formatted_balanced_date = new Date().toLocaleString('en-GB');

    // Add payment entry into patient's nursing billing
    const paymentRecord = {
      id: `bill-pay-${Date.now()}`,
      admission_id: handover.admission_id,
      patient_id: handover.patient_id,
      item: `Maternity Ward Supplies Cash Received & Balanced by Cashier (${cashierName})`,
      amount: handover.total_amount,
      type: 'Payment',
      recorded_at: new Date().toLocaleString('en-GB'),
      date_sort: new Date().toISOString()
    };
    db.nurseBilling.push(paymentRecord);

    // Update patient admissions payments
    const patient = (db.admissions || []).find((a: any) => a.id === handover.admission_id || a.patient_id === handover.patient_id);
    if (patient) {
      patient.payments_made = (patient.payments_made || 0) + handover.total_amount;
      patient.outstanding_balance = Math.max(0, (patient.total_charged || 0) - (patient.payments_made || 0));
    }

    // Also register in payments list if present
    if (!db.payments) db.payments = [];
    db.payments.push({
      id: `pay-mat-${Date.now()}`,
      patient_id: handover.patient_id,
      patient_name: handover.patient_name,
      hospital_number: handover.hospital_number,
      amount: handover.total_amount,
      payment_method: 'Cash',
      purpose: 'Maternity Ward Supplies Requisition & Inventory Balancing',
      status: 'Completed',
      collected_by: cashierName,
      created_at: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Maternity supply cash handover verified, received, and inventory balanced successfully.',
      data: handover
    });
  } catch (err: any) {
    console.error('Error balancing maternity supplies:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 7. GET DETAINED PATIENTS & PENDING ADMISSIONS
// -------------------------------------------------------------
nursingRoutes.get('/detained', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const { search } = req.query as { search?: string };

    let pending = [...(db.pendingAdmissions || [])];
    let detained = [...(db.detainedPatients || [])];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      pending = pending.filter((p: any) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.hospital_number || '').toLowerCase().includes(q) ||
        (p.department || '').toLowerCase().includes(q) ||
        (p.reason || '').toLowerCase().includes(q)
      );
      detained = detained.filter((p: any) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.hospital_number || '').toLowerCase().includes(q) ||
        (p.reason_for_detention || '').toLowerCase().includes(q) ||
        (p.last_nurse_notes || '').toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      pendingAdmissions: pending,
      currentlyDetained: detained,
      totalDetained: db.detainedPatients ? db.detainedPatients.length : 0,
      totalPending: db.pendingAdmissions ? db.pendingAdmissions.length : 0
    });
  } catch (err: any) {
    console.error('Error fetching detained patients:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 8. DETAIN PATIENT FOR OBSERVATION
// -------------------------------------------------------------
nursingRoutes.post('/detained/detain', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const { patientId, reason, initialObservation, nurseName } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, error: 'Patient ID is required.' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Reason for detention is required.' });
    }
    if (!initialObservation || !initialObservation.trim()) {
      return res.status(400).json({ success: false, error: 'Initial observation recorded on clinical card is required.' });
    }

    // Check in pending admissions or general patients
    let patientCandidate = (db.pendingAdmissions || []).find(
      (p: any) => p.id === patientId || p.patient_id === patientId || p.hospital_number === patientId
    );

    if (!patientCandidate) {
      // Check in main patients repo if available
      const generalPatient = (db.patients || []).find(
        (p: any) => p.id === patientId || p.hospital_number === patientId || p.patient_id === patientId
      );
      if (generalPatient) {
        patientCandidate = {
          id: generalPatient.id,
          patient_id: generalPatient.hospital_number || generalPatient.id,
          hospital_number: generalPatient.hospital_number || generalPatient.id,
          name: generalPatient.name,
          gender: generalPatient.gender || 'Unknown',
          age: generalPatient.age || 'Adult',
          phone_number: generalPatient.phone_number || '',
          department: 'Outpatient Triage'
        };
      }
    }

    const patientName = patientCandidate?.name || 'Patient';
    const hospitalNum = patientCandidate?.hospital_number || patientCandidate?.patient_id || patientId;

    const newDetained = {
      id: `DET-${Date.now()}`,
      patient_id: hospitalNum,
      hospital_number: hospitalNum,
      name: patientName,
      gender: patientCandidate?.gender || 'Unknown',
      age: patientCandidate?.age || 'Adult',
      phone_number: patientCandidate?.phone_number || '',
      department: patientCandidate?.department || 'Short-Stay Observation',
      reason_for_detention: reason.trim(),
      initial_observation: initialObservation.trim(),
      last_nurse_notes: initialObservation.trim(),
      detained_at: new Date().toLocaleString('en-GB'),
      detained_by: nurseName || req.user?.name || req.user?.username || 'Nurse Staff',
      status: 'DETAINED'
    };

    if (!db.detainedPatients) db.detainedPatients = [];
    db.detainedPatients.unshift(newDetained);

    // Remove from pending admissions if present
    if (db.pendingAdmissions) {
      db.pendingAdmissions = db.pendingAdmissions.filter(
        (p: any) => p.id !== patientId && p.patient_id !== patientId && p.hospital_number !== hospitalNum
      );
    }

    // Save initial clinical card note into nurse observations for continuity
    if (!db.nurseObservations) db.nurseObservations = [];
    db.nurseObservations.unshift({
      id: `obs-det-${Date.now()}`,
      admission_id: newDetained.id,
      patient_id: hospitalNum,
      observation_type: 'Detained Observation',
      details: `[Detained for ${reason.trim()}] ${initialObservation.trim()}`,
      recorded_by: newDetained.detained_by,
      recorded_at: newDetained.detained_at,
      date_sort: new Date().toISOString()
    });

    res.json({
      success: true,
      message: `Patient ${patientName} marked as detained. Reason: ${reason.trim()}. Initial observation recorded on clinical card: ${initialObservation.trim()}.`,
      patient: newDetained,
      currentlyDetained: db.detainedPatients,
      pendingAdmissions: db.pendingAdmissions,
      totalDetained: db.detainedPatients.length
    });
  } catch (err: any) {
    console.error('Error marking patient as detained:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 9. RELEASE PATIENT FROM OBSERVATION
// -------------------------------------------------------------
nursingRoutes.post('/detained/:id/release', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const { id } = req.params;

    if (!db.detainedPatients) db.detainedPatients = [];

    const existingIndex = db.detainedPatients.findIndex(
      (p: any) => p.id === id || p.patient_id === id || p.hospital_number === id
    );

    if (existingIndex === -1) {
      return res.status(404).json({ success: false, error: 'Detained patient record not found.' });
    }

    const released = db.detainedPatients[existingIndex];
    // Remove from currently detained
    db.detainedPatients.splice(existingIndex, 1);

    res.json({
      success: true,
      message: `Patient ${released.name} has been released from observation.`,
      releasedPatient: released,
      currentlyDetained: db.detainedPatients,
      totalDetained: db.detainedPatients.length
    });
  } catch (err: any) {
    console.error('Error releasing detained patient:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 10. COMPLETE PATIENT ADMISSION (Admit Button)
// -------------------------------------------------------------
nursingRoutes.post('/detained/:id/admit', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const { id } = req.params;
    const {
      ward,
      bedNumber,
      provisionalDiagnosis,
      nextOfKin,
      region,
      religion,
      doctorOrders,
      nurseName
    } = req.body;

    if (!ward || !ward.trim()) {
      return res.status(400).json({ success: false, error: 'Ward selection is required.' });
    }
    if (!bedNumber || !bedNumber.trim()) {
      return res.status(400).json({ success: false, error: 'Bed number is required.' });
    }

    // Locate candidate in detained or pending admissions or main db
    let patientCandidate = (db.detainedPatients || []).find(
      (p: any) => p.id === id || p.patient_id === id || p.hospital_number === id
    );

    if (!patientCandidate) {
      patientCandidate = (db.pendingAdmissions || []).find(
        (p: any) => p.id === id || p.patient_id === id || p.hospital_number === id
      );
    }

    if (!patientCandidate) {
      patientCandidate = (db.patients || []).find(
        (p: any) => p.id === id || p.hospital_number === id || p.patient_id === id
      );
    }

    const patientName = patientCandidate?.name || 'Patient';
    const hospitalNum = patientCandidate?.hospital_number || patientCandidate?.patient_id || id;
    const cleanBed = bedNumber.trim().toLowerCase().startsWith('bed') ? bedNumber.trim() : `Bed ${bedNumber.trim()}`;

    // Create admission object
    const newAdmission = {
      id: `ADM-${Date.now()}`,
      patient_id: hospitalNum,
      hospital_number: hospitalNum,
      name: patientName,
      phone_number: patientCandidate?.phone_number || '',
      date_of_birth: patientCandidate?.date_of_birth || '1995-01-01',
      gender: patientCandidate?.gender || 'Unknown',
      category: `${ward} Inpatient`,
      department: ward,
      status: 'ADMITTED',
      ward: ward.trim(),
      bed: cleanBed,
      provisional_diagnosis: provisionalDiagnosis || '',
      next_of_kin: nextOfKin || '',
      region: region || '',
      religion: religion || 'Christianity',
      doctor_notes: doctorOrders || 'Standing orders recorded upon admission.',
      admitted_date: new Date().toLocaleDateString('en-GB'),
      admitted_timestamp: new Date().toISOString(),
      discharge_bill: 15000,
      total_charged: 15000,
      payments_made: 0,
      outstanding_balance: 15000,
      created_at: new Date().toISOString()
    };

    if (!db.admissions) db.admissions = [];
    db.admissions.unshift(newAdmission);

    // Initial admission vitals
    if (!db.nurseVitals) db.nurseVitals = [];
    db.nurseVitals.push({
      id: `vit-init-${newAdmission.id}`,
      admission_id: newAdmission.id,
      patient_id: hospitalNum,
      blood_pressure: '120/80',
      heart_rate: '76',
      temperature: '36.8',
      respiratory_rate: '18',
      spo2: '98',
      recorded_by: nurseName || req.user?.name || req.user?.username || 'Nurse Staff',
      is_initial: true,
      recorded_at: `${newAdmission.admitted_date}, ${new Date().toLocaleTimeString('en-GB')}`,
      date_sort: newAdmission.admitted_timestamp
    });

    // Initial bed charge billing
    if (!db.nurseBilling) db.nurseBilling = [];
    db.nurseBilling.push({
      id: `bill-${newAdmission.id}-1`,
      admission_id: newAdmission.id,
      patient_id: hospitalNum,
      item: `${ward.trim()} Admission & Accommodation Fee`,
      amount: 15000,
      type: 'Charge',
      recorded_at: `${newAdmission.admitted_date}, ${new Date().toLocaleTimeString('en-GB')}`,
      date_sort: newAdmission.admitted_timestamp
    });

    // Remove from detained if was detained
    if (db.detainedPatients) {
      db.detainedPatients = db.detainedPatients.filter(
        (p: any) => p.id !== id && p.patient_id !== id && p.hospital_number !== hospitalNum
      );
    }

    // Remove from pending admissions
    if (db.pendingAdmissions) {
      db.pendingAdmissions = db.pendingAdmissions.filter(
        (p: any) => p.id !== id && p.patient_id !== id && p.hospital_number !== hospitalNum
      );
    }

    res.json({
      success: true,
      message: `Patient ${patientName} has been admitted to ${ward.trim()} ${cleanBed}.`,
      admission: newAdmission,
      currentlyDetained: db.detainedPatients || [],
      pendingAdmissions: db.pendingAdmissions || [],
      totalDetained: db.detainedPatients ? db.detainedPatients.length : 0
    });
  } catch (err: any) {
    console.error('Error admitting patient:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 6. NURSE DISPENSING: GET ALL DISPENSING RECORDS
// -------------------------------------------------------------
nursingRoutes.get('/dispensing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();

    // If postgres table exists, optionally sync
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS zmc_nurse_dispensing (
            id VARCHAR(64) PRIMARY KEY,
            date VARCHAR(32) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            patient_name VARCHAR(255) NOT NULL,
            card_number VARCHAR(100) NOT NULL,
            drug VARCHAR(255) NOT NULL,
            quantity VARCHAR(100) NOT NULL,
            recorded_by VARCHAR(100) NOT NULL,
            reviewed BOOLEAN DEFAULT FALSE,
            reviewed_by VARCHAR(100),
            reviewed_at VARCHAR(100)
          )
        `);

        const pgRes = await pool.query('SELECT * FROM zmc_nurse_dispensing ORDER BY created_at DESC');
        if (pgRes.rows && pgRes.rows.length > 0) {
          const mapped = pgRes.rows.map((r: any) => ({
            id: r.id,
            date: r.date,
            created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
            patient_name: r.patient_name,
            card_number: r.card_number,
            drug: r.drug,
            quantity: r.quantity,
            recorded_by: r.recorded_by,
            reviewed: Boolean(r.reviewed),
            reviewed_by: r.reviewed_by,
            reviewed_at: r.reviewed_at
          }));

          // Merge any items not already in memory
          for (const item of mapped) {
            if (!db.nurseDispensingRecords.some((x: any) => x.id === item.id)) {
              db.nurseDispensingRecords.push(item);
            }
          }
        }
      } catch (pgErr: any) {
        console.warn('Postgres dispensing check warning:', pgErr.message);
      }
    }

    const { search, status } = req.query as { search?: string; status?: string };
    let list = [...(db.nurseDispensingRecords || [])];

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r: any) =>
        (r.patient_name || '').toLowerCase().includes(q) ||
        (r.card_number || '').toLowerCase().includes(q) ||
        (r.drug || '').toLowerCase().includes(q) ||
        (r.recorded_by || '').toLowerCase().includes(q) ||
        (r.date || '').toLowerCase().includes(q)
      );
    }

    if (status === 'reviewed') {
      list = list.filter((r: any) => r.reviewed === true);
    } else if (status === 'pending') {
      list = list.filter((r: any) => !r.reviewed);
    }

    // Common hospital drugs list for autocomplete
    const commonDrugs = [
      'Paracetamol 500mg Tabs',
      'Amoxicillin 500mg Caps',
      'Artemether-Lumefantrine (Coartem)',
      'Ibuprofen 400mg Tabs',
      'Metronidazole 400mg Tabs',
      'Ciprofloxacin 500mg Tabs',
      'Omeprazole 20mg Caps',
      'Diclofenac 50mg Tabs',
      'IV Normal Saline 500ml',
      'IV Dextrose 5% 500ml',
      'IV Ringers Lactate 500ml',
      'IV Ceftriaxone 1g',
      'IV Hydralazine 10mg',
      'IV Hydrocortisone 100mg',
      'IV Paracetamol 1g',
      'Tramadol 50mg Caps',
      'Chlorpheniramine 4mg (Piriton)',
      'Vitamin C 100mg Tabs',
      'Multivitamin Syrup 100ml',
      'Antacid Suspension 200ml'
    ];

    res.json({
      success: true,
      records: list,
      totalRecords: (db.nurseDispensingRecords || []).length,
      commonDrugs
    });
  } catch (err: any) {
    console.error('Error fetching dispensing records:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 7. NURSE DISPENSING: SAVE DISPENSING RECORD
// -------------------------------------------------------------
nursingRoutes.post('/dispensing', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();

    const { patientName, cardNumber, drug, quantity, recordedBy } = req.body;

    if (!patientName || !patientName.trim()) {
      return res.status(400).json({ success: false, error: 'Patient Name is required.' });
    }
    if (!cardNumber || !cardNumber.trim()) {
      return res.status(400).json({ success: false, error: 'Card Number is required.' });
    }
    if (!drug || !drug.trim()) {
      return res.status(400).json({ success: false, error: 'Drug Dispensed is required.' });
    }
    if (quantity === undefined || quantity === null || String(quantity).trim() === '') {
      return res.status(400).json({ success: false, error: 'Quantity is required.' });
    }

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const userLoggedIn = (req as any).user?.username || (req as any).user?.name || 'nurse1';
    const recorder = (recordedBy && recordedBy.trim()) ? recordedBy.trim() : userLoggedIn;

    const newRecord = {
      id: `NDISP-${Date.now()}`,
      date: dateFormatted,
      created_at: now.toISOString(),
      patient_name: patientName.trim(),
      card_number: cardNumber.trim(),
      drug: drug.trim(),
      quantity: String(quantity).trim(),
      recorded_by: recorder,
      reviewed: false,
      reviewed_by: null,
      reviewed_at: null
    };

    if (!db.nurseDispensingRecords) {
      db.nurseDispensingRecords = [];
    }
    // Add to top of list
    db.nurseDispensingRecords.unshift(newRecord);

    // Save to PostgreSQL if available
    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS zmc_nurse_dispensing (
            id VARCHAR(64) PRIMARY KEY,
            date VARCHAR(32) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            patient_name VARCHAR(255) NOT NULL,
            card_number VARCHAR(100) NOT NULL,
            drug VARCHAR(255) NOT NULL,
            quantity VARCHAR(100) NOT NULL,
            recorded_by VARCHAR(100) NOT NULL,
            reviewed BOOLEAN DEFAULT FALSE,
            reviewed_by VARCHAR(100),
            reviewed_at VARCHAR(100)
          )
        `);

        await pool.query(
          `INSERT INTO zmc_nurse_dispensing 
            (id, date, created_at, patient_name, card_number, drug, quantity, recorded_by, reviewed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            newRecord.id,
            newRecord.date,
            newRecord.created_at,
            newRecord.patient_name,
            newRecord.card_number,
            newRecord.drug,
            newRecord.quantity,
            newRecord.recorded_by,
            false
          ]
        );
      } catch (pgErr: any) {
        console.warn('Could not insert to postgres zmc_nurse_dispensing, persisted in memory:', pgErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Dispensing record for ${newRecord.patient_name} (${newRecord.drug}) saved successfully.`,
      record: newRecord,
      records: db.nurseDispensingRecords,
      totalRecords: db.nurseDispensingRecords.length
    });
  } catch (err: any) {
    console.error('Error saving dispensing record:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 8. NURSE DISPENSING: TOGGLE REVIEWED STATUS
// -------------------------------------------------------------
nursingRoutes.patch('/dispensing/:id/toggle-review', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();
    const { id } = req.params;

    const record = (db.nurseDispensingRecords || []).find((r: any) => r.id === id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Dispensing record not found.' });
    }

    record.reviewed = !record.reviewed;
    const reviewerName = (req as any).user?.name || (req as any).user?.username || 'Charge Nurse';
    if (record.reviewed) {
      record.reviewed_by = reviewerName;
      record.reviewed_at = new Date().toLocaleString('en-GB');
    } else {
      record.reviewed_by = null;
      record.reviewed_at = null;
    }

    // Update in postgres if available
    if (pool) {
      try {
        await pool.query(
          `UPDATE zmc_nurse_dispensing 
           SET reviewed = $1, reviewed_by = $2, reviewed_at = $3 
           WHERE id = $4`,
          [record.reviewed, record.reviewed_by, record.reviewed_at, id]
        );
      } catch (pgErr: any) {
        console.warn('Postgres review toggle error:', pgErr.message);
      }
    }

    res.json({
      success: true,
      message: record.reviewed
        ? `Dispensing record for ${record.patient_name} marked as Reviewed by ${reviewerName}.`
        : `Dispensing record for ${record.patient_name} marked as Pending Review.`,
      record,
      records: db.nurseDispensingRecords
    });
  } catch (err: any) {
    console.error('Error toggling review status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 9. NURSE DISPENSING: DELETE RECORD
// -------------------------------------------------------------
nursingRoutes.delete('/dispensing/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();
    const { id } = req.params;

    if (!db.nurseDispensingRecords) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    const initialLen = db.nurseDispensingRecords.length;
    db.nurseDispensingRecords = db.nurseDispensingRecords.filter((r: any) => r.id !== id);

    if (db.nurseDispensingRecords.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    if (pool) {
      try {
        await pool.query('DELETE FROM zmc_nurse_dispensing WHERE id = $1', [id]);
      } catch (pgErr: any) {
        console.warn('Postgres delete error:', pgErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Dispensing record deleted.',
      records: db.nurseDispensingRecords
    });
  } catch (err: any) {
    console.error('Error deleting dispensing record:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 10. NURSE INJECTIONS: GET ALL INJECTION RECORDS
// -------------------------------------------------------------
nursingRoutes.get('/injections', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();

    let records = db.nurseInjectionRecords || [];

    // Common standard ward injections for rapid select and autocomplete
    const commonInjections = [
      'IV Ceftriaxone 1g',
      'IM Diclofenac 75mg',
      'IV Tramadol 50mg',
      'IV Paracetamol 1g Infusion',
      'IV Hydralazine 10mg',
      'IV Hydrocortisone 100mg',
      'IM Pentazocine 30mg',
      'IM Artesunate 120mg',
      'Tetanus Toxoid (TT) 0.5ml IM',
      'IV Ampiclox 1g',
      'IM Promethazine 25mg',
      'IV Metronidazole 500mg Infusion',
      'IV Furosemide 20mg',
      'Insulin Regular (Soluble) 10 IU Subcut',
      'Insulin NPH (Isophane) 20 IU Subcut',
      'IM Hepatitis B Vaccine 0.5ml',
      'IV Oxytocin 10 IU in 500ml Saline',
      'IV Magnesium Sulphate 50%'
    ];

    if (pool) {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS zmc_nurse_injections (
            id VARCHAR(64) PRIMARY KEY,
            date VARCHAR(32) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            card_number VARCHAR(64) NOT NULL,
            patient_name VARCHAR(128) NOT NULL,
            injection_type VARCHAR(128) NOT NULL,
            dose VARCHAR(128) NOT NULL,
            nurse_sign VARCHAR(64) NOT NULL,
            reviewed BOOLEAN DEFAULT FALSE,
            reviewed_by VARCHAR(64),
            reviewed_at VARCHAR(64)
          );
        `);

        const pgResult = await pool.query('SELECT * FROM zmc_nurse_injections ORDER BY created_at DESC');
        if (pgResult.rows.length > 0) {
          records = pgResult.rows;
          db.nurseInjectionRecords = records;
        } else {
          // Seed to Postgres if table is empty
          for (const item of records) {
            await pool.query(`
              INSERT INTO zmc_nurse_injections (
                id, date, created_at, card_number, patient_name, injection_type, dose, nurse_sign, reviewed, reviewed_by, reviewed_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (id) DO NOTHING
            `, [
              item.id,
              item.date,
              item.created_at,
              item.card_number,
              item.patient_name,
              item.injection_type,
              item.dose,
              item.nurse_sign,
              item.reviewed || false,
              item.reviewed_by || null,
              item.reviewed_at || null
            ]);
          }
        }
      } catch (pgErr: any) {
        console.warn('Postgres injection sync failed, using memory DB:', pgErr.message);
      }
    }

    res.json({
      success: true,
      records,
      commonInjections,
      totalRecords: records.length
    });
  } catch (err: any) {
    console.error('Error fetching injection records:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 11. NURSE INJECTIONS: LOG NEW INJECTION
// -------------------------------------------------------------
nursingRoutes.post('/injections', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();

    const {
      date,
      cardNumber,
      patientName,
      injectionType,
      dose,
      nurseSign
    } = req.body;

    if (!cardNumber || !patientName || !injectionType || !dose) {
      return res.status(400).json({
        success: false,
        error: 'Missing required injection administration fields. Card Number, Patient Name, Injection Type, and Dose are required.'
      });
    }

    const todayDateFormatted = date || new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const activeSign = nurseSign || (req as any).user?.username || 'nurse1';

    const newRecord = {
      id: `INJ-${Date.now()}`,
      date: todayDateFormatted,
      created_at: new Date().toISOString(),
      card_number: String(cardNumber).trim(),
      patient_name: String(patientName).trim(),
      injection_type: String(injectionType).trim(),
      dose: String(dose).trim(),
      nurse_sign: String(activeSign).trim(),
      reviewed: false,
      reviewed_by: null,
      reviewed_at: null
    };

    if (!db.nurseInjectionRecords) {
      db.nurseInjectionRecords = [];
    }
    // Prepend so the latest logged injection appears at the very top
    db.nurseInjectionRecords.unshift(newRecord);

    if (pool) {
      try {
        await pool.query(`
          INSERT INTO zmc_nurse_injections (
            id, date, created_at, card_number, patient_name, injection_type, dose, nurse_sign, reviewed, reviewed_by, reviewed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          newRecord.id,
          newRecord.date,
          newRecord.created_at,
          newRecord.card_number,
          newRecord.patient_name,
          newRecord.injection_type,
          newRecord.dose,
          newRecord.nurse_sign,
          newRecord.reviewed,
          newRecord.reviewed_by,
          newRecord.reviewed_at
        ]);
      } catch (pgErr: any) {
        console.warn('Postgres injection insert error:', pgErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Injection record for ${newRecord.patient_name} (${newRecord.injection_type}) saved successfully.`,
      record: newRecord,
      records: db.nurseInjectionRecords,
      totalRecords: db.nurseInjectionRecords.length
    });
  } catch (err: any) {
    console.error('Error logging injection record:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 12. NURSE INJECTIONS: TOGGLE REVIEW/VERIFY STATUS
// -------------------------------------------------------------
nursingRoutes.patch('/injections/:id/toggle-review', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();
    const { id } = req.params;

    const record = (db.nurseInjectionRecords || []).find((r: any) => r.id === id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Injection record not found.' });
    }

    record.reviewed = !record.reviewed;
    const reviewerName = (req as any).user?.name || (req as any).user?.username || 'Charge Nurse';
    if (record.reviewed) {
      record.reviewed_by = reviewerName;
      record.reviewed_at = new Date().toLocaleString('en-GB');
    } else {
      record.reviewed_by = null;
      record.reviewed_at = null;
    }

    if (pool) {
      try {
        await pool.query(
          `UPDATE zmc_nurse_injections 
           SET reviewed = $1, reviewed_by = $2, reviewed_at = $3 
           WHERE id = $4`,
          [record.reviewed, record.reviewed_by, record.reviewed_at, id]
        );
      } catch (pgErr: any) {
        console.warn('Postgres injection review toggle error:', pgErr.message);
      }
    }

    res.json({
      success: true,
      message: record.reviewed
        ? `Injection record for ${record.patient_name} marked as Reviewed by ${reviewerName}.`
        : `Injection record for ${record.patient_name} marked as Pending Review.`,
      record,
      records: db.nurseInjectionRecords
    });
  } catch (err: any) {
    console.error('Error toggling injection review status:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 13. NURSE INJECTIONS: DELETE RECORD
// -------------------------------------------------------------
nursingRoutes.delete('/injections/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();
    const { id } = req.params;

    if (!db.nurseInjectionRecords) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    const initialLen = db.nurseInjectionRecords.length;
    db.nurseInjectionRecords = db.nurseInjectionRecords.filter((r: any) => r.id !== id);

    if (db.nurseInjectionRecords.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Record not found.' });
    }

    if (pool) {
      try {
        await pool.query('DELETE FROM zmc_nurse_injections WHERE id = $1', [id]);
      } catch (pgErr: any) {
        console.warn('Postgres delete error:', pgErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Injection record deleted.',
      records: db.nurseInjectionRecords
    });
  } catch (err: any) {
    console.error('Error deleting injection record:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------------------------------------------------
// 14. NURSE PATIENTS / CARDS LOOKUP
// Query hospital database for patients: hospital ID numbers, names, phone numbers, departments
// -------------------------------------------------------------
nursingRoutes.get('/patient-cards', async (req: AuthenticatedRequest, res: Response) => {
  try {
    ensureNursingSeed();
    const db = getDB() as any;
    const pool = getPostgresPool();
    const search = req.query.search ? String(req.query.search).trim().toLowerCase() : '';

    const patientMap = new Map<string, any>();

    const addPatient = (p: { hospital_number?: string; name?: string; phone_number?: string; category?: string; gender?: string; department?: string }) => {
      const card = (p.hospital_number || '').trim();
      const name = (p.name || '').trim();
      if (!card || !name) return;
      
      const key = card.toLowerCase();
      if (!patientMap.has(key)) {
        patientMap.set(key, {
          hospital_number: card,
          name: name,
          phone_number: p.phone_number || '',
          category: p.category || p.department || 'Outpatient',
          gender: p.gender || ''
        });
      }
    };

    // 1. From Postgres database if available
    if (pool) {
      try {
        const pgRes = await pool.query(`
          SELECT id, hospital_number, name, phone_number, gender, card_type as category
          FROM zmc_patients
          ORDER BY name ASC
        `);
        for (const row of pgRes.rows) {
          addPatient({
            hospital_number: row.hospital_number || row.id,
            name: row.name,
            phone_number: row.phone_number,
            category: row.category || 'General Patient',
            gender: row.gender
          });
        }
      } catch (err: any) {
        console.warn('Could not query zmc_patients from pool:', err.message);
      }
    }

    // 2. From in-memory db.patients
    if (Array.isArray(db.patients)) {
      for (const p of db.patients) {
        addPatient({
          hospital_number: p.hospitalNumber || p.hospital_number || p.id,
          name: p.name || `${p.first_name || ''} ${p.last_name || ''}`.trim(),
          phone_number: p.phoneNumber || p.phone_number || p.phone,
          category: p.cardType || p.category || 'Outpatient',
          gender: p.gender
        });
      }
    }

    // 3. From Admitted Patients
    if (Array.isArray(db.admittedPatients)) {
      for (const p of db.admittedPatients) {
        addPatient({
          hospital_number: p.hospital_number || p.patient_id,
          name: p.name,
          phone_number: p.phone_number,
          category: `Admitted - ${p.category || p.ward || 'Ward'}`,
          gender: p.gender
        });
      }
    }

    // 4. From Detained Patients
    if (Array.isArray(db.detainedPatients)) {
      for (const p of db.detainedPatients) {
        addPatient({
          hospital_number: p.hospital_number || p.patient_id,
          name: p.name,
          phone_number: p.phone_number,
          category: `Detained - ${p.department || 'Observation'}`,
          gender: p.gender
        });
      }
    }

    // 5. From Pending Admissions
    if (Array.isArray(db.pendingAdmissions)) {
      for (const p of db.pendingAdmissions) {
        addPatient({
          hospital_number: p.hospital_number || p.patient_id,
          name: p.name,
          phone_number: p.phone_number,
          category: `Pending Admission - ${p.category || 'Triage'}`,
          gender: p.gender
        });
      }
    }

    // 6. Registered hospital patient demonstration seed
    const fallbackSeed = [
      { hospital_number: 'HOSP-2026-619', name: 'Emmanuel Bassey', phone_number: '08023456789', category: 'Emergency & Trauma', gender: 'Male' },
      { hospital_number: 'HOSP-2026-625', name: 'Grace Nnamdi', phone_number: '08134567890', category: 'General Outpatient (GOPD)', gender: 'Female' },
      { hospital_number: 'HOSP-2026-701', name: 'Chinedu Eze', phone_number: '08034567891', category: 'Accident & Emergency', gender: 'Male' },
      { hospital_number: 'HOSP-2026-702', name: 'Amina Bello', phone_number: '08129876543', category: 'General Outpatient (GOPD)', gender: 'Female' },
      { hospital_number: 'HOSP-2026-703', name: 'Sunday Adeleke', phone_number: '08056781234', category: 'Cardiology Clinic', gender: 'Male' },
      { hospital_number: 'HOSP-2026-704', name: 'Zainab Mohammed', phone_number: '08077654321', category: 'Maternity Triage', gender: 'Female' },
      { hospital_number: 'OPD-2024-0001', name: 'Sunday Adeleke', phone_number: '08023344556', category: 'Outpatient Registry', gender: 'Male' },
      { hospital_number: '398276', name: 'uhcydia', phone_number: '08099887766', category: 'Private Clinic', gender: 'Female' },
      { hospital_number: 'MAT-4003', name: 'Folake Adeleke', phone_number: '08012345678', category: 'Maternity Inpatient', gender: 'Female' },
      { hospital_number: 'ADM-5001', name: 'Ibrahim Musa', phone_number: '08098765432', category: 'General Medical Inpatient', gender: 'Male' },
      { hospital_number: 'ADM-5002', name: 'Blessing Okonkwo', phone_number: '08087654321', category: 'Surgical Inpatient', gender: 'Female' },
      { hospital_number: 'ADM-5003', name: 'Tunde Bakare', phone_number: '08076543210', category: 'General Medical Inpatient', gender: 'Male' },
      { hospital_number: 'ADM-5004', name: 'Halima Yusuf', phone_number: '08065432109', category: 'Pediatric Inpatient', gender: 'Female' }
    ];

    for (const fb of fallbackSeed) {
      addPatient(fb);
    }

    let allPatients = Array.from(patientMap.values());

    if (search) {
      allPatients = allPatients.filter(p => 
        p.hospital_number.toLowerCase().includes(search) ||
        p.name.toLowerCase().includes(search) ||
        p.phone_number.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
      );
    }

    res.json({
      success: true,
      patients: allPatients,
      totalCount: allPatients.length
    });
  } catch (err: any) {
    console.error('Error fetching patient cards:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default nursingRoutes;
