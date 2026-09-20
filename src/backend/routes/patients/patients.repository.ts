import { query, generateUUID, getPostgresStatus, getDB } from '../../database/db.repo';

async function populatePatientsWithRelationalData(rows: any[]): Promise<any[]> {
  if (rows.length === 0) return [];
  const ids = rows.map(r => r.id);
  
  // Query vitals (take latest recorded vitals for each patient, prioritizing populated records)
  const vitalsRes = await query(`
    SELECT DISTINCT ON (patient_id) * FROM zmc_patient_vitals 
    WHERE patient_id = ANY($1) 
    ORDER BY patient_id,
      (CASE WHEN blood_pressure IS NOT NULL AND blood_pressure != '' AND blood_pressure != '—' THEN 1 ELSE 0 END +
       CASE WHEN temperature IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN pulse_rate IS NOT NULL THEN 1 ELSE 0 END +
       CASE WHEN weight IS NOT NULL THEN 1 ELSE 0 END) DESC,
      recorded_at DESC
  `, [ids]);
  const vitalsMap = new Map();
  vitalsRes.rows.forEach(r => {
    vitalsMap.set(r.patient_id, {
      bloodPressure: r.blood_pressure,
      temperature: r.temperature !== null ? parseFloat(r.temperature) : null,
      pulseRate: r.pulse_rate,
      respiratoryRate: r.respiratory_rate,
      spo2: r.spo2,
      weight: r.weight !== null ? parseFloat(r.weight) : null,
      height: r.height !== null ? parseFloat(r.height) : null
    });
  });

  // Query maternity records
  const maternityRes = await query(`
    SELECT DISTINCT ON (patient_id) * FROM zmc_maternity_records 
    WHERE patient_id = ANY($1) 
    ORDER BY patient_id, recorded_at DESC
  `, [ids]);
  const maternityMap = new Map();
  maternityRes.rows.forEach(r => {
    maternityMap.set(r.patient_id, {
      gravida: r.gravida,
      para: r.para,
      lmp: r.lmp ? new Date(r.lmp).toISOString().split('T')[0] : '',
      edd: r.edd ? new Date(r.edd).toISOString().split('T')[0] : '',
      gestationalAge: r.gestational_age,
      tribe: r.tribe,
      occupation: r.occupation,
      abortion: r.abortion || '0',
      premature: r.premature || '0'
    });
  });

  // Query emergency records
  const emergencyRes = await query(`
    SELECT DISTINCT ON (patient_id) * FROM zmc_emergency_records 
    WHERE patient_id = ANY($1) 
    ORDER BY patient_id, recorded_at DESC
  `, [ids]);
  const emergencyMap = new Map();
  emergencyRes.rows.forEach(r => {
    emergencyMap.set(r.patient_id, {
      isSickEmergency: r.is_sick_emergency,
      isUnbookedLabour: r.is_unbooked_labour,
      isAccident: r.is_accident,
      isDoctorOnCall: r.is_doctor_on_call,
      isAfterHours: r.is_after_hours,
      customDetails: r.custom_details,
      totalBillAmount: r.total_bill_amount ? parseFloat(r.total_bill_amount) : null,
      cashCollected: r.cash_collected ? parseFloat(r.cash_collected) : null,
      doctorOnCallName: r.doctor_on_call_name || ''
    });
  });

  return rows.map(row => ({
    id: row.id,
    hospitalNumber: row.hospital_number,
    maternityNumber: row.maternity_number || null,
    name: row.name,
    dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString().split('T')[0] : '',
    gender: row.gender,
    phoneNumber: row.phone_number || '',
    email: row.email || '',
    address: row.address || '',
    maritalStatus: row.marital_status || '',
    cardType: row.card_type || 'Standard',
    cardFee: row.card_fee || 0,
    status: row.status || 'Triage Pending',
    registeredBy: row.registered_by || '',
    registrationDate: row.registration_date ? new Date(row.registration_date).toISOString() : new Date().toISOString(),
    idType: row.id_type || null,
    idNumber: row.id_number || null,
    nextOfKinName: row.next_of_kin_name || null,
    nextOfKinPhone: row.next_of_kin_phone || null,
    nextOfKinRelationship: row.next_of_kin_relationship || null,
    patientCanProvideDetails: row.patient_can_provide_details !== false,
    broughtInByName: row.brought_in_by_name || null,
    broughtInByPhone: row.brought_in_by_phone || null,
    broughtInByRelationship: row.brought_in_by_relationship || null,
    broughtInByIdType: row.brought_in_by_id_type || null,
    broughtInByIdNumber: row.brought_in_by_id_number || null,
    vitals: vitalsMap.get(row.id) || null,
    maternityDetails: maternityMap.get(row.id) || null,
    emergencyDetails: emergencyMap.get(row.id) || null
  }));
}

export class PatientsRepository {
  public async findAll(): Promise<any[]> {
    const res = await query('SELECT * FROM zmc_patients ORDER BY registration_date DESC');
    return populatePatientsWithRelationalData(res.rows);
  }

  public async findById(id: string): Promise<any | null> {
    const res = await query('SELECT * FROM zmc_patients WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const populated = await populatePatientsWithRelationalData(res.rows);
    return populated[0];
  }

  public async getNextHospitalNumber(): Promise<string> {
    const year = new Date().getFullYear();
    try {
      const res = await query('SELECT hospital_number FROM zmc_patients WHERE hospital_number LIKE $1', [`ZMC-${year}-%`]);
      let maxSerial = 0;
      for (const row of res.rows) {
        const match = (row.hospital_number || '').match(/ZMC-\d{4}-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSerial) maxSerial = num;
        }
      }
      const countRes = await query('SELECT count(*) as count FROM zmc_patients');
      const totalCount = parseInt(countRes.rows[0]?.count || '0', 10);
      let nextNum = Math.max(maxSerial + 1, totalCount + 1);

      while (true) {
        const candidate = `ZMC-${year}-${String(nextNum).padStart(4, '0')}`;
        const check = await query('SELECT id FROM zmc_patients WHERE hospital_number = $1', [candidate]);
        if (check.rows.length === 0) {
          return candidate;
        }
        nextNum++;
      }
    } catch (err) {
      console.warn('Fallback hospital number generation:', err);
      const fallbackSerial = Math.floor(1000 + Math.random() * 9000);
      return `ZMC-${year}-${fallbackSerial}`;
    }
  }

  public async create(patient: any): Promise<any> {
    const id = generateUUID();
    const hospitalNumber = await this.getNextHospitalNumber();
    let maternityNumber = null;
    if (patient.cardType === 'Maternity') {
      maternityNumber = hospitalNumber.replace('ZMC', 'MAT');
    }

    await query(`
      INSERT INTO zmc_patients (
        id, hospital_number, name, date_of_birth, gender, phone_number, email, address,
        marital_status, card_type, card_fee, status, registered_by, registration_date,
        id_type, id_number, next_of_kin_name, next_of_kin_phone, next_of_kin_relationship,
        patient_can_provide_details, brought_in_by_name, brought_in_by_phone,
        brought_in_by_relationship, brought_in_by_id_type, brought_in_by_id_number,
        maternity_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    `, [
      id,
      hospitalNumber,
      patient.name,
      patient.dateOfBirth,
      patient.gender,
      patient.phoneNumber || null,
      patient.email || null,
      patient.address || null,
      patient.maritalStatus || null,
      patient.cardType || 'Standard',
      patient.cardFee || 0,
      patient.status || 'Triage Pending',
      patient.registeredBy || null,
      new Date().toISOString(),
      patient.idType || null,
      patient.idNumber || null,
      patient.nextOfKinName || null,
      patient.nextOfKinPhone || null,
      patient.nextOfKinRelationship || null,
      patient.patientCanProvideDetails !== false,
      patient.broughtInByName || null,
      patient.broughtInByPhone || null,
      patient.broughtInByRelationship || null,
      patient.broughtInByIdType || null,
      patient.broughtInByIdNumber || null,
      maternityNumber
    ]);

    // If there are vitals, insert them into zmc_patient_vitals
    if (patient.vitals) {
      await query(`
        INSERT INTO zmc_patient_vitals (
          id, patient_id, blood_pressure, temperature, pulse_rate, respiratory_rate, spo2, weight, height
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        generateUUID(),
        id,
        patient.vitals.bloodPressure || null,
        patient.vitals.temperature !== undefined ? patient.vitals.temperature : null,
        patient.vitals.pulseRate !== undefined ? patient.vitals.pulseRate : null,
        patient.vitals.respiratoryRate !== undefined ? patient.vitals.respiratoryRate : null,
        patient.vitals.spo2 !== undefined ? patient.vitals.spo2 : null,
        patient.vitals.weight !== undefined ? patient.vitals.weight : null,
        patient.vitals.height !== undefined ? patient.vitals.height : null
      ]);
    }

    // If there is maternity details, insert them into zmc_maternity_records
    if (patient.maternityDetails) {
      await query(`
        INSERT INTO zmc_maternity_records (
          id, patient_id, gravida, para, lmp, edd, gestational_age, tribe, occupation, abortion, premature
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        generateUUID(),
        id,
        patient.maternityDetails.gravida || null,
        patient.maternityDetails.para || null,
        patient.maternityDetails.lmp || null,
        patient.maternityDetails.edd || null,
        patient.maternityDetails.gestationalAge || null,
        patient.maternityDetails.tribe || null,
        patient.maternityDetails.occupation || null,
        patient.maternityDetails.abortion || null,
        patient.maternityDetails.premature || null
      ]);
    }

    // If there are emergency details, insert them into zmc_emergency_records
    if (patient.emergencyDetails) {
      await query(`
        INSERT INTO zmc_emergency_records (
          id, patient_id, is_sick_emergency, is_unbooked_labour, is_accident, is_doctor_on_call, is_after_hours, custom_details, total_bill_amount, cash_collected, doctor_on_call_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        generateUUID(),
        id,
        !!patient.emergencyDetails.isSickEmergency,
        !!patient.emergencyDetails.isUnbookedLabour,
        !!patient.emergencyDetails.isAccident,
        !!patient.emergencyDetails.isDoctorOnCall,
        !!patient.emergencyDetails.isAfterHours,
        patient.emergencyDetails.customDetails || null,
        patient.emergencyDetails.totalBillAmount || null,
        patient.emergencyDetails.cashCollected || null,
        patient.emergencyDetails.doctorOnCallName || null
      ]);
    }

    // Record corresponding cards in zmc_clinical_cards table
    if (patient.cardType === 'Maternity') {
      await this.createClinicalCard(id, hospitalNumber, 3000, 'Standard');
      await this.createClinicalCard(id, maternityNumber!, 2000, 'Maternity');
    } else {
      await this.createClinicalCard(id, hospitalNumber, patient.cardFee || 0, patient.cardType || 'Standard');
    }

    // Family Account automatic creation/lookup and association
    if (patient.patientCategory === 'Family' && patient.familyName) {
      // Find existing family account (case-insensitive)
      const existingFam = await query(
        'SELECT id, balance FROM zmc_family_accounts WHERE name ILIKE $1 LIMIT 1',
        [patient.familyName.trim()]
      );

      let familyId: string;
      if (existingFam.rows.length > 0) {
        familyId = existingFam.rows[0].id;
      } else {
        familyId = generateUUID();
        await query(
          'INSERT INTO zmc_family_accounts (id, name, balance) VALUES ($1, $2, 0.00)',
          [familyId, patient.familyName.trim()]
        );
      }

      // Create association
      await this.createFamilyAssociation(familyId, id, patient.familyRelationship || 'Dependent');

      // Deduct card fee from family account balance if standard
      if (patient.cardType === 'Standard') {
        await this.addFamilyDeposit(
          familyId,
          -3000,
          patient.registeredBy || 'Staff',
          `Card Fee deduction for newly registered member: ${patient.name}`
        );
      }
    }

    // Company Account automatic creation/lookup and association
    if (patient.patientCategory === 'Company' && patient.companyName) {
      // Find existing company account (case-insensitive)
      const existingComp = await query(
        'SELECT id FROM zmc_company_accounts WHERE name ILIKE $1 LIMIT 1',
        [patient.companyName.trim()]
      );

      let companyId: string;
      if (existingComp.rows.length > 0) {
        companyId = existingComp.rows[0].id;
      } else {
        companyId = generateUUID();
        // Generate a 4-letter safe code suffix
        const nameClean = patient.companyName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'COMP';
        const code = `${nameClean}-${Math.floor(1000 + Math.random() * 9000)}`;
        await query(
          'INSERT INTO zmc_company_accounts (id, name, code, billing_cycle) VALUES ($1, $2, $3, \'Monthly\')',
          [companyId, patient.companyName.trim(), code]
        );
      }

      // Create corporate member association
      await this.createCompanyAssociation(
        companyId,
        id,
        patient.employeeId || null,
        patient.designation || null
      );

      // Create corporate authorization if reference is provided
      if (patient.letterReference) {
        await this.createCompanyAuthorization(
          id,
          companyId,
          patient.letterReference,
          patient.registeredBy || 'Staff'
        );
      }
    }

    // Auto-create encounter, registration invoice, and Nursing Front-Desk queue entry for Standard & Maternity patient registrations
    if (patient.cardType === 'Standard' || patient.cardType === 'Maternity') {
      const encounterId = generateUUID();
      const visitNumber = 1;
      const visitType = patient.cardType === 'Maternity' ? 'Antenatal Consultation' : 'General Outpatient Consultation';
      const destinationClinic = 'General OPD Out-Patient Clinic';
      const priority = 'Normal';
      const priorityReason = 'Initial patient registration card and consultation fee payment.';
      const clinicalStatus = 'Waiting for Vitals';
      const paymentStatus = 'Unpaid';

      // Insert encounter with 'Waiting for Vitals' status
      await query(`
        INSERT INTO zmc_encounters (
          id, patient_id, visit_number, visit_type, destination_clinic, priority, priority_reason, payment_status, clinical_status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [encounterId, id, visitNumber, visitType, destinationClinic, priority, priorityReason, paymentStatus, clinicalStatus, patient.registeredBy || 'Staff']);

      // Retrieve Clinical Card and Consultation prices from the database price catalogue
      let cardFee = 3000;
      let consultFee = 2000;
      if (patient.cardType === 'Maternity') {
        cardFee = 5000;
        consultFee = 3000;
      }

      const cardCode = patient.cardType === 'Maternity' ? 'CLINICAL_CARD_MATERNITY' : 'CLINICAL_CARD_STANDARD';
      const consultCode = patient.cardType === 'Maternity' ? 'CONSULTATION_MATERNITY' : 'CONSULTATION_GENERAL';

      try {
        const cardPriceRes = await query("SELECT price FROM zmc_price_catalogue WHERE item_code = $1", [cardCode]);
        if (cardPriceRes.rows.length > 0) {
          cardFee = parseFloat(cardPriceRes.rows[0].price);
        }
        const consultPriceRes = await query("SELECT price FROM zmc_price_catalogue WHERE item_code = $1", [consultCode]);
        if (consultPriceRes.rows.length > 0) {
          consultFee = parseFloat(consultPriceRes.rows[0].price);
        }
      } catch (err) {
        console.error("Failed to query price catalogue, using defaults:", err);
      }

      const totalAmount = cardFee + consultFee;
      const invoiceId = generateUUID();
      const invoiceDescription = `${patient.cardType} Clinical Card Registration Fee (₦${cardFee.toLocaleString()}) and ${visitType} Fee (₦${consultFee.toLocaleString()})`;

      // Create Registration & Consultation invoice
      await query(`
        INSERT INTO zmc_invoices (id, patient_id, encounter_id, amount, status, description)
        VALUES ($1, $2, $3, $4, 'Unpaid', $5)
      `, [invoiceId, id, encounterId, totalAmount, invoiceDescription]);

      // Create Nursing Front-Desk queue entry (Waiting)
      await query(`
        INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
        VALUES ($1, $2, $3, $4, $5, 'Waiting', NOW())
      `, [generateUUID(), encounterId, id, 'Nursing Front-Desk', priority]);

      // Set initial patient status to 'Triage Pending'
      await query("UPDATE zmc_patients SET status = 'Triage Pending' WHERE id = $1", [id]);
    } else if (patient.cardType === 'Emergency') {
      const encounterId = generateUUID();
      const visitNumber = 1;
      const visitType = 'Emergency Medicine Registration';
      const destinationClinic = 'General OPD Out-Patient Clinic';
      const priority = 'Emergency';
      const docName = patient.emergencyDetails?.doctorOnCallName || 'On-Call Emergency Team';
      const priorityReason = patient.emergencyDetails?.customDetails || `Emergency medical intake. Doctor on call: ${docName}.`;
      const clinicalStatus = 'In Emergency Care';
      
      const totalBill = parseFloat(patient.emergencyDetails?.totalBillAmount || patient.cardFee || 5000);
      const cashCollected = parseFloat(patient.emergencyDetails?.cashCollected || 0);
      const paymentStatus = cashCollected > 0 ? 'Unconfirmed' : 'Unpaid';

      // Insert emergency encounter
      await query(`
        INSERT INTO zmc_encounters (
          id, patient_id, visit_number, visit_type, destination_clinic, priority, priority_reason, payment_status, clinical_status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [encounterId, id, visitNumber, visitType, destinationClinic, priority, priorityReason, paymentStatus, clinicalStatus, patient.registeredBy || 'Staff']);

      // Create Emergency invoice
      const invoiceId = generateUUID();
      const invoiceDescription = `Emergency Incident Intake & Care (Doctor on Call: ${docName})`;
      await query(`
        INSERT INTO zmc_invoices (id, patient_id, encounter_id, amount, status, description)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [invoiceId, id, encounterId, totalBill, cashCollected >= totalBill ? 'Unconfirmed' : 'Unpaid', invoiceDescription]);

      // If initial cash was collected at OPD registration desk, record payment awaiting cashier audit
      if (cashCollected > 0) {
        const paymentId = generateUUID();
        try {
          await query(`
            INSERT INTO zmc_payments (
              id, patient_id, encounter_id, invoice_id, amount, payment_method, status, recorded_by, created_at, notes
            ) VALUES ($1, $2, $3, $4, $5, 'Cash', 'Unconfirmed', $6, NOW(), $7)
          `, [
            paymentId,
            id,
            encounterId,
            invoiceId,
            cashCollected,
            patient.registeredBy || 'OPD Clerk',
            `Emergency intake cash collected at OPD registration desk. Awaiting cashier verification.`
          ]);
        } catch (payErr) {
          console.warn('Failed to insert initial emergency cash payment record:', payErr);
        }
      }

      // Create high-priority Doctor Consultation queue entry
      await query(`
        INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
        VALUES ($1, $2, $3, $4, $5, 'Waiting', NOW())
      `, [generateUUID(), encounterId, id, 'Doctor Consultation', priority]);

      // Set patient status to 'Emergency Dispatched'
      await query("UPDATE zmc_patients SET status = 'Emergency Dispatched' WHERE id = $1", [id]);

      // Broadcast emergency alert to clinical staff
      try {
        const { broadcastNotification } = await import('../../utils/ws.util');
        broadcastNotification({
          type: 'EMERGENCY_PATIENT_ARRIVED',
          targetRole: 'Doctor',
          message: `🚨 EMERGENCY ALERT: ${patient.name || 'Emergency Patient'} dispatched to OPD Doctor. Doctor on call: ${docName}.`,
          patientId: id
        });
      } catch (wsErr) {
        console.warn('Failed to broadcast emergency websocket alert:', wsErr);
      }
    }

    return this.findById(id);
  }

  public async update(id: string, updates: any): Promise<any | null> {
    const dbFields: string[] = [];
    const values: any[] = [];
    let valIndex = 2;

    const fieldsMapping: Record<string, string> = {
      name: 'name',
      dateOfBirth: 'date_of_birth',
      gender: 'gender',
      phoneNumber: 'phone_number',
      address: 'address',
      maritalStatus: 'marital_status',
      cardType: 'card_type',
      cardFee: 'card_fee',
      status: 'status',
      registeredBy: 'registered_by',
      registrationDate: 'registration_date',
      idType: 'id_type',
      idNumber: 'id_number',
      nextOfKinName: 'next_of_kin_name',
      nextOfKinPhone: 'next_of_kin_phone',
      nextOfKinRelationship: 'next_of_kin_relationship',
      patientCanProvideDetails: 'patient_can_provide_details',
      broughtInByName: 'brought_in_by_name',
      broughtInByPhone: 'brought_in_by_phone',
      broughtInByRelationship: 'brought_in_by_relationship',
      broughtInByIdType: 'brought_in_by_id_type',
      broughtInByIdNumber: 'brought_in_by_id_number'
    };

    for (const key of Object.keys(updates)) {
      if (key === 'id') continue;
      // Skip vitals, maternityDetails, emergencyDetails from direct patient update; handle them relationally below
      if (['vitals', 'maternityDetails', 'emergencyDetails'].includes(key)) continue;
      
      const dbCol = fieldsMapping[key] || key;
      dbFields.push(`${dbCol} = $${valIndex}`);
      values.push(updates[key]);
      valIndex++;
    }

    if (dbFields.length > 0) {
      const setClause = dbFields.join(', ');
      await query(
        `UPDATE zmc_patients SET ${setClause} WHERE id = $1`,
        [id, ...values]
      );
    }

    // Handle vitals relationally
    if (updates.vitals !== undefined) {
      if (updates.vitals === null) {
        await query('DELETE FROM zmc_patient_vitals WHERE patient_id = $1', [id]);
      } else {
        await query(`
          INSERT INTO zmc_patient_vitals (
            id, patient_id, blood_pressure, temperature, pulse_rate, respiratory_rate, spo2, weight, height
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          generateUUID(),
          id,
          updates.vitals.bloodPressure || null,
          updates.vitals.temperature !== undefined ? updates.vitals.temperature : null,
          updates.vitals.pulseRate !== undefined ? updates.vitals.pulseRate : null,
          updates.vitals.respiratoryRate !== undefined ? updates.vitals.respiratoryRate : null,
          updates.vitals.spo2 !== undefined ? updates.vitals.spo2 : null,
          updates.vitals.weight !== undefined ? updates.vitals.weight : null,
          updates.vitals.height !== undefined ? updates.vitals.height : null
        ]);
      }
    }

    // Handle maternity details relationally
    if (updates.maternityDetails !== undefined) {
      if (updates.maternityDetails === null) {
        await query('DELETE FROM zmc_maternity_records WHERE patient_id = $1', [id]);
      } else {
        await query(`
          INSERT INTO zmc_maternity_records (
            id, patient_id, gravida, para, lmp, edd, gestational_age, tribe, occupation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          generateUUID(),
          id,
          updates.maternityDetails.gravida || null,
          updates.maternityDetails.para || null,
          updates.maternityDetails.lmp || null,
          updates.maternityDetails.edd || null,
          updates.maternityDetails.gestationalAge || null,
          updates.maternityDetails.tribe || null,
          updates.maternityDetails.occupation || null
        ]);
      }
    }

    // Handle emergency details relationally
    if (updates.emergencyDetails !== undefined) {
      if (updates.emergencyDetails === null) {
        await query('DELETE FROM zmc_emergency_records WHERE patient_id = $1', [id]);
      } else {
        await query(`
          INSERT INTO zmc_emergency_records (
            id, patient_id, is_sick_emergency, is_unbooked_labour, is_accident, is_doctor_on_call, is_after_hours, custom_details
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          generateUUID(),
          id,
          !!updates.emergencyDetails.isSickEmergency,
          !!updates.emergencyDetails.isUnbookedLabour,
          !!updates.emergencyDetails.isAccident,
          !!updates.emergencyDetails.isDoctorOnCall,
          !!updates.emergencyDetails.isAfterHours,
          updates.emergencyDetails.customDetails || null
        ]);
      }
    }

    return this.findById(id);
  }

  // ==========================================
  // OPD Relational Workflows & Extensions
  // ==========================================

  public async getPrices(): Promise<any[]> {
    const res = await query('SELECT * FROM zmc_price_catalogue ORDER BY category, item_name');
    return res.rows;
  }

  public async updatePrice(itemCode: string, price: number): Promise<void> {
    await query('UPDATE zmc_price_catalogue SET price = $1, updated_at = NOW() WHERE item_code = $2', [price, itemCode]);
  }

  public async getCompanies(): Promise<any[]> {
    const res = await query('SELECT * FROM zmc_company_accounts ORDER BY name');
    return res.rows;
  }

  public async getFamilies(): Promise<any[]> {
    const res = await query('SELECT * FROM zmc_family_accounts ORDER BY name');
    return res.rows;
  }

  public async addFamilyDeposit(familyId: string, amount: number, createdBy: string, description: string): Promise<any> {
    await query('UPDATE zmc_family_accounts SET balance = balance + $1 WHERE id = $2', [amount, familyId]);
    await query(`
      INSERT INTO zmc_family_transactions (id, family_id, amount, type, description, created_by)
      VALUES ($1, $2, $3, 'Deposit', $4, $5)
    `, [generateUUID(), familyId, amount, description, createdBy]);
    const res = await query('SELECT * FROM zmc_family_accounts WHERE id = $1', [familyId]);
    return res.rows[0];
  }

  public async createClinicalCard(patientId: string, cardNumber: string, cardFee: number, category: string): Promise<void> {
    await query(`
      INSERT INTO zmc_clinical_cards (id, patient_id, card_number, card_fee, issue_date, status, category)
      VALUES ($1, $2, $3, $4, CURRENT_DATE, 'Active', $5)
    `, [generateUUID(), patientId, cardNumber, cardFee, category]);
  }

  public async createFamilyAssociation(familyId: string, patientId: string, relationship: string): Promise<void> {
    await query(`
      INSERT INTO zmc_family_members (id, family_id, patient_id, relationship)
      VALUES ($1, $2, $3, $4)
    `, [generateUUID(), familyId, patientId, relationship]);
  }

  public async createCompanyAssociation(companyId: string, patientId: string, employeeId: string, designation: string): Promise<void> {
    await query(`
      INSERT INTO zmc_company_members (id, company_id, patient_id, employee_id, designation)
      VALUES ($1, $2, $3, $4, $5)
    `, [generateUUID(), companyId, patientId, employeeId, designation]);
  }

  public async createCompanyAuthorization(patientId: string, companyId: string, letterReference: string, verifiedBy: string): Promise<void> {
    await query(`
      INSERT INTO zmc_company_authorizations (id, patient_id, company_id, letter_reference, verified_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [generateUUID(), patientId, companyId, letterReference, verifiedBy]);
  }

  public async createEncounter(patientId: string, visitType: string, destinationClinic: string, priority: string, priorityReason: string, createdBy: string): Promise<any> {
    const countRes = await query('SELECT count(*) as count FROM zmc_encounters WHERE patient_id = $1', [patientId]);
    const visitNumber = parseInt(countRes.rows[0].count, 10) + 1;
    const id = generateUUID();
    
    const qType = (destinationClinic === 'Cashier Desk' || visitType.includes('Registration'))
      ? 'Cashier Consultation Payment'
      : (destinationClinic === 'Eye Clinic') 
      ? 'Eye Clinic Consultation' 
      : (destinationClinic === 'Nursing Front-Desk' || destinationClinic === 'Triage')
      ? 'Nursing Front-Desk'
      : 'Doctor Consultation';

    const status = (qType === 'Doctor Consultation' || priority === 'Emergency') ? 'Pending Consultation' : 'Pending Vitals';
    
    // Set payment status as 'Paid' by default, unless priority is Emergency and cash was collected (handled below)
    await query(`
      INSERT INTO zmc_encounters (id, patient_id, visit_number, visit_type, destination_clinic, priority, priority_reason, payment_status, clinical_status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Paid', $8, $9)
    `, [id, patientId, visitNumber, visitType, destinationClinic, priority, priorityReason || null, status, createdBy]);

    const paymentStatusInitial = (qType === 'Cashier Consultation Payment') ? 'Unpaid' : 'Paid';

    await query(`
      INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status)
      VALUES ($1, $2, $3, $4, $5, 'Waiting')
    `, [generateUUID(), id, patientId, qType, priority]);

    let patientStatus = 'Waiting for Doctor';
    if (qType === 'Cashier Consultation Payment') {
      patientStatus = 'Awaiting Cashier Payment';
    } else if (qType === 'Eye Clinic Consultation') {
      patientStatus = 'Waiting for Eye Doc';
    } else if (qType === 'Nursing Front-Desk') {
      patientStatus = 'Waiting for Vitals';
    } else if (qType === 'Doctor Consultation') {
      patientStatus = 'Waiting for Doctor';
    }
    await query("UPDATE zmc_patients SET status = $1 WHERE id = $2", [patientStatus, patientId]);

    if (qType === 'Cashier Consultation Payment') {
      // Get patient card fee or default to 5000 NGN
      const patRes = await query('SELECT card_fee FROM zmc_patients WHERE id = $1', [patientId]);
      const cardFee = parseFloat(patRes.rows[0]?.card_fee) || 5000;
      
      // Auto-generate unpaid system invoice for Cashier verification
      await query(`
        INSERT INTO zmc_invoices (id, patient_id, encounter_id, amount, status, description, date_issued)
        VALUES ($1, $2, $3, $4, 'Unpaid', 'OPD Registration & Consultation Fee', NOW())
      `, [generateUUID(), patientId, id, cardFee]);

      // Update encounter payment status
      await query("UPDATE zmc_encounters SET payment_status = 'Unpaid' WHERE id = $1", [id]);

      // Broadcast alert to Cashier
      try {
        const { broadcastNotification } = await import('../../utils/ws.util');
        const patNameRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
        const patientName = patNameRes.rows[0]?.name || 'Outpatient';
        
        broadcastNotification({
          type: 'PATIENT_REGISTERED',
          targetRole: 'Cashier',
          message: `New registered patient: ${patientName}. Awaiting Cashier payment of ₦${cardFee.toLocaleString()}.`,
          patientId
        });
      } catch (wsErr) {
        console.error('Failed to broadcast Cashier notification:', wsErr);
      }
    }

    // Check if there is an emergency record with cash collected for this patient
    const emerRes = await query('SELECT cash_collected, total_bill_amount FROM zmc_emergency_records WHERE patient_id = $1 LIMIT 1', [patientId]);
    if (emerRes.rows.length > 0 && parseFloat(emerRes.rows[0].cash_collected || '0') > 0) {
      const cashCollected = parseFloat(emerRes.rows[0].cash_collected);
      const paymentId = generateUUID();
      
      let validEncId: string | null = null;
      if (id && typeof id === 'string') {
        const encCheck = await query('SELECT id FROM zmc_encounters WHERE id = $1', [id]);
        if (encCheck.rows.length > 0) validEncId = id;
      }

      if (validEncId) {
        // Update encounter's payment status to 'Unconfirmed' as cash is collected at OPD but not yet confirmed by Cashier
        await query("UPDATE zmc_encounters SET payment_status = 'Unconfirmed' WHERE id = $1", [validEncId]);
      }

      await query(`
        INSERT INTO zmc_payments (
          id, patient_id, encounter_id, invoice_id, amount, status, date_paid, payment_method, collected_by
        ) VALUES ($1, $2, $3, null, $4, 'Unconfirmed', NOW(), 'Cash', (SELECT id FROM zmc_users WHERE username = $5 LIMIT 1))
      `, [paymentId, patientId, validEncId, cashCollected, createdBy]);

      // Broadcast notification
      try {
        const { broadcastNotification } = await import('../../utils/ws.util');
        const patNameRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
        const patientName = patNameRes.rows[0]?.name || 'Emergency Patient';
        
        broadcastNotification({
          type: 'EMERGENCY_CASH_COLLECTED',
          targetRole: 'Cashier',
          message: `OPD collected ₦${cashCollected.toLocaleString()} in cash for emergency patient ${patientName}. Awaiting handover confirmation.`,
          patientId
        });
      } catch (e) {
        console.error("Failed to broadcast emergency cash notification:", e);
      }
    }

    const res = await query('SELECT * FROM zmc_encounters WHERE id = $1', [id]);
    return res.rows[0];
  }

  public async getEncounters(): Promise<any[]> {
    const res = await query(`
      SELECT e.*, p.name as patient_name, p.hospital_number
      FROM zmc_encounters e
      JOIN zmc_patients p ON e.patient_id = p.id
      ORDER BY e.created_at DESC
    `);
    return res.rows;
  }

  public async getQueue(): Promise<any[]> {
    const res = await query(`
      SELECT q.*, p.name as patient_name, p.hospital_number, p.date_of_birth, p.gender, p.phone_number, p.email, p.address, p.marital_status, p.card_type, p.card_type as patient_category, p.registration_date as registered_at,
             p.next_of_kin_name, p.next_of_kin_phone, p.next_of_kin_relationship,
             p.brought_in_by_name, p.brought_in_by_phone, p.brought_in_by_relationship, p.brought_in_by_id_type, p.brought_in_by_id_number,
             e.visit_type, e.destination_clinic, e.priority_reason, e.payment_status,
             c.treatment_plan as doctor_notes, c.diagnosis as doctor_diagnosis, c.chief_complaint,
             v.blood_pressure, v.temperature, v.pulse_rate, v.respiratory_rate, v.spo2, v.weight, v.height,
             m.gravida, m.para, m.lmp, m.edd, m.gestational_age, m.tribe, m.occupation, m.abortion, m.premature,
             em.is_sick_emergency, em.is_unbooked_labour, em.is_accident, em.is_doctor_on_call, em.is_after_hours, em.total_bill_amount, em.cash_collected, em.doctor_on_call_name, em.custom_details
      FROM zmc_patient_queue q
      JOIN zmc_patients p ON q.patient_id = p.id
      JOIN zmc_encounters e ON q.encounter_id = e.id
      LEFT JOIN (
        SELECT DISTINCT ON (COALESCE(encounter_id, patient_id)) treatment_plan, diagnosis, chief_complaint, patient_id, encounter_id
        FROM zmc_consultations
        ORDER BY COALESCE(encounter_id, patient_id), created_at DESC, date DESC
      ) c ON (c.encounter_id = q.encounter_id OR (c.encounter_id IS NULL AND c.patient_id = q.patient_id))
      LEFT JOIN (
        SELECT DISTINCT ON (patient_id) *
        FROM zmc_patient_vitals
        ORDER BY patient_id,
          (CASE WHEN blood_pressure IS NOT NULL AND blood_pressure != '' AND blood_pressure != '—' THEN 1 ELSE 0 END +
           CASE WHEN temperature IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN pulse_rate IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN weight IS NOT NULL THEN 1 ELSE 0 END) DESC,
          recorded_at DESC
      ) v ON v.patient_id = q.patient_id
      LEFT JOIN (
        SELECT DISTINCT ON (patient_id) *
        FROM zmc_maternity_records
        ORDER BY patient_id, recorded_at DESC
      ) m ON m.patient_id = q.patient_id
      LEFT JOIN (
        SELECT DISTINCT ON (patient_id) *
        FROM zmc_emergency_records
        ORDER BY patient_id, recorded_at DESC
      ) em ON em.patient_id = q.patient_id
      WHERE q.status = 'Waiting' OR q.status = 'Processing'
      ORDER BY 
        CASE q.priority
          WHEN 'Emergency' THEN 1
          WHEN 'Urgent' THEN 2
          ELSE 3
        END,
        q.arrival_time ASC
    `);
    return res.rows;
  }

  public async recordOPDVitals(patientId: string, encounterId: string, vitals: any, recordedBy: string): Promise<void> {
    const vitalsId = generateUUID();
    await query(`
      INSERT INTO zmc_patient_vitals (
        id, patient_id, encounter_id, recorded_by, blood_pressure, temperature, pulse_rate, respiratory_rate, spo2, weight, height
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      vitalsId,
      patientId,
      encounterId || null,
      recordedBy || 'Staff',
      vitals.bloodPressure || null,
      vitals.temperature !== undefined ? parseFloat(vitals.temperature) : null,
      vitals.pulseRate !== undefined ? parseInt(vitals.pulseRate, 10) : null,
      vitals.respiratoryRate !== undefined ? parseInt(vitals.respiratoryRate, 10) : null,
      vitals.spo2 !== undefined ? parseInt(vitals.spo2, 10) : null,
      vitals.weight !== undefined ? parseFloat(vitals.weight) : null,
      vitals.height !== undefined ? parseFloat(vitals.height) : null
    ]);

    await query(`
      UPDATE zmc_patient_queue
      SET status = 'Completed', processed_at = NOW(), processed_by = $1
      WHERE encounter_id = $2 AND queue_type = 'Nursing Front-Desk' AND status = 'Waiting'
    `, [recordedBy, encounterId]);

    await query(`
      UPDATE zmc_encounters
      SET clinical_status = 'Waiting for Consultation Payment'
      WHERE id = $1
    `, [encounterId]);

    await query(`
      INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
      SELECT $1, id, patient_id, 'Cashier Consultation Payment', priority, 'Waiting', NOW()
      FROM zmc_encounters WHERE id = $2
    `, [generateUUID(), encounterId]);

    await query("UPDATE zmc_patients SET status = 'Waiting for Consultation Payment' WHERE id = $1", [patientId]);
  }

  public async updateEncounterPriority(encounterId: string, priority: string, reason: string, updatedBy: string): Promise<void> {
    await query(`
      UPDATE zmc_encounters
      SET priority = $1, priority_reason = $2
      WHERE id = $3
    `, [priority, reason, encounterId]);

    await query(`
      UPDATE zmc_patient_queue
      SET priority = $1
      WHERE encounter_id = $2 AND status = 'Waiting'
    `, [priority, encounterId]);

    await query(`
      INSERT INTO zmc_audit_logs (id, user_id, user_name, user_role, action, details)
      VALUES ($1, $2, $3, 'Nurse', 'PRIORITY_UPDATE', $4)
    `, [generateUUID(), updatedBy, updatedBy, `Updated encounter ${encounterId} priority to ${priority}. Reason: ${reason}`]);
  }

  public async requestCardReplacement(patientId: string, oldCardNumber: string, newCardNumber: string, approvedBy: string, lastOfficeSeen: string, reason: string): Promise<void> {
    await query(`
      INSERT INTO zmc_clinical_card_replacements (id, patient_id, old_card_number, new_card_number, approved_by, last_office_seen, reason, history_refreshed)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
    `, [generateUUID(), patientId, oldCardNumber, newCardNumber, approvedBy, lastOfficeSeen, reason]);

    await query(`
      UPDATE zmc_clinical_cards
      SET status = 'Replaced'
      WHERE patient_id = $1 AND card_number = $2
    `, [patientId, oldCardNumber]);

    await query(`
      INSERT INTO zmc_clinical_cards (id, patient_id, card_number, card_fee, issue_date, status, category)
      VALUES ($1, $2, $3, 0, CURRENT_DATE, 'Active', 'Individual')
    `, [generateUUID(), patientId, newCardNumber]);

    await query(`
      DELETE FROM zmc_patient_vitals WHERE patient_id = $1
    `, [patientId]);
    await query(`
      DELETE FROM zmc_maternity_records WHERE patient_id = $1
    `, [patientId]);
    await query(`
      DELETE FROM zmc_emergency_records WHERE patient_id = $1
    `, [patientId]);

    await query(`
      UPDATE zmc_patients
      SET status = 'History Refreshed'
      WHERE id = $1
    `, [patientId]);
  }

  public async getCardReplacements(): Promise<any[]> {
    const res = await query(`
      SELECT r.*, p.name as patient_name, p.hospital_number
      FROM zmc_clinical_card_replacements r
      JOIN zmc_patients p ON r.patient_id = p.id
      ORDER BY r.created_at DESC
    `);
    return res.rows;
  }

  public async checkDuplicates(name: string, phoneNumber: string): Promise<any[]> {
    const trimmedName = (name || '').trim();
    const trimmedPhone = (phoneNumber || '').trim();

    if (!trimmedName && !trimmedPhone) {
      return [];
    }

    if (trimmedName && trimmedPhone && trimmedPhone !== 'Unknown') {
      const res = await query(`
        SELECT * FROM zmc_patients 
        WHERE LOWER(TRIM(name)) = LOWER($1) OR (phone_number = $2 AND phone_number != '' AND phone_number != 'Unknown')
      `, [trimmedName, trimmedPhone]);
      return res.rows;
    } else if (trimmedName) {
      const res = await query(`
        SELECT * FROM zmc_patients 
        WHERE LOWER(TRIM(name)) = LOWER($1)
      `, [trimmedName]);
      return res.rows;
    } else if (trimmedPhone && trimmedPhone !== 'Unknown') {
      const res = await query(`
        SELECT * FROM zmc_patients 
        WHERE phone_number = $1
      `, [trimmedPhone]);
      return res.rows;
    }

    return [];
  }

  public async getDashboardStats(): Promise<any> {
    const { isPostgresActive } = getPostgresStatus();
    
    let totalPatients = 0;
    let standardCount = 0;
    let maternityCount = 0;
    let emergencyCount = 0;
    let totalRevenue = 0;
    let clinicIntensity = 0;
    let admissionsCount = 0;
    let queueCount = 0;
    
    const monthlyRegistrations: { [key: string]: number } = {};
    const monthlyEncounters: { [key: string]: number } = {};

    if (isPostgresActive) {
      const patientsRes = await query('SELECT card_type, COUNT(*) as count FROM zmc_patients GROUP BY card_type');
      patientsRes.rows.forEach(r => {
        const count = parseInt(r.count, 10);
        totalPatients += count;
        if (r.card_type === 'Standard') standardCount = count;
        else if (r.card_type === 'Maternity') maternityCount = count;
        else if (r.card_type === 'Emergency') emergencyCount = count;
      });

      const revenueRes = await query("SELECT SUM(amount) as total FROM zmc_payments WHERE status = 'Completed'");
      totalRevenue = parseFloat(revenueRes.rows[0].total || '0');

      const encountersCountRes = await query('SELECT COUNT(*) as count FROM zmc_encounters');
      const totalEncounters = parseInt(encountersCountRes.rows[0].count, 10);
      
      clinicIntensity = totalPatients + totalEncounters;

      const admissionsCountRes = await query("SELECT COUNT(*) as count FROM zmc_admissions WHERE status = 'Admitted'");
      admissionsCount = parseInt(admissionsCountRes.rows[0].count, 10);

      const queueCountRes = await query("SELECT COUNT(*) as count FROM zmc_patient_queue WHERE status = 'Waiting'");
      queueCount = parseInt(queueCountRes.rows[0].count, 10);

      const regRes = await query(`
        SELECT TO_CHAR(registration_date, 'Mon') as month, COUNT(*) as count
        FROM zmc_patients
        GROUP BY TO_CHAR(registration_date, 'Mon')
      `);
      regRes.rows.forEach(r => {
        monthlyRegistrations[r.month] = parseInt(r.count, 10);
      });

      const encRes = await query(`
        SELECT TO_CHAR(created_at, 'Mon') as month, COUNT(*) as count
        FROM zmc_encounters
        GROUP BY TO_CHAR(created_at, 'Mon')
      `);
      encRes.rows.forEach(r => {
        monthlyEncounters[r.month] = parseInt(r.count, 10);
      });

    } else {
      const db = getDB();
      totalPatients = db.patients?.length || 0;
      db.patients?.forEach(p => {
        if (p.cardType === 'Standard') standardCount++;
        else if (p.cardType === 'Maternity') maternityCount++;
        else if (p.cardType === 'Emergency') emergencyCount++;
      });

      totalRevenue = db.payments?.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0) || 0;
      
      const totalEncounters = db.appointments?.length || 0;
      clinicIntensity = totalPatients + totalEncounters;

      admissionsCount = db.admissions?.filter(a => a.status === 'Admitted').length || 0;
      queueCount = db.appointments?.filter(a => a.status === 'Scheduled').length || 0;

      db.patients?.forEach(p => {
        if (p.registrationDate) {
          const m = new Date(p.registrationDate).toLocaleString('default', { month: 'short' });
          monthlyRegistrations[m] = (monthlyRegistrations[m] || 0) + 1;
        }
      });
      
      db.appointments?.forEach(a => {
        if (a.date) {
          const m = new Date(a.date).toLocaleString('default', { month: 'short' });
          monthlyEncounters[m] = (monthlyEncounters[m] || 0) + 1;
        }
      });
    }

    const baseOverview = [
      { month: 'Jan', newV: 45, unique: 30 },
      { month: 'Feb', newV: 50, unique: 35 },
      { month: 'Mar', newV: 60, unique: 40 },
      { month: 'Apr', newV: 55, unique: 38 },
      { month: 'May', newV: 65, unique: 42 },
      { month: 'Jun', newV: 70, unique: 48 },
      { month: 'Jul', newV: 75, unique: 50 },
      { month: 'Aug', newV: 80, unique: 52 },
      { month: 'Sep', newV: 85, unique: 58 },
      { month: 'Oct', newV: 90, unique: 60 },
      { month: 'Nov', newV: 95, unique: 64 },
      { month: 'Dec', newV: 100, unique: 68 },
    ];

    const overviewData = baseOverview.map(b => {
      const dbReg = monthlyRegistrations[b.month] || 0;
      const dbEnc = monthlyEncounters[b.month] || 0;
      return {
        month: b.month,
        newV: b.newV + dbReg,
        unique: b.unique + dbEnc
      };
    });

    const baseGrowth = [
      { month: 'Feb \'00', value1: 18, value2: 12 },
      { month: 'May \'00', value1: 30, value2: 18 },
      { month: 'Aug \'00', value1: 14, value2: 24 },
      { month: 'Nov \'00', value1: 22, value2: 15 },
      { month: 'Feb \'01', value1: 10, value2: 29 },
      { month: 'May \'01', value1: 25, value2: 19 },
    ];

    const growthData = baseGrowth.map((b, index) => {
      const weight1 = index >= 4 ? totalPatients : 0;
      const weight2 = index >= 4 ? queueCount : 0;
      return {
        month: b.month,
        value1: b.value1 + weight1,
        value2: b.value2 + weight2
      };
    });

    return {
      totalPatients,
      standardCount,
      maternityCount,
      emergencyCount,
      totalRevenue,
      clinicIntensity,
      admissionsCount,
      queueCount,
      overviewData,
      growthData
    };
  }

  public async saveDoctorNotes(
    patientId: string,
    encounterId: string | null | undefined,
    notes: string,
    doctorName: string
  ): Promise<any> {
    if (!patientId) {
      throw new Error('Patient ID is required to save consultation notes');
    }

    // Verify patient exists
    const patCheck = await query('SELECT id FROM zmc_patients WHERE id = $1', [patientId]);
    if (patCheck.rows.length === 0) {
      throw new Error('Patient record not found');
    }

    // Check if encounterId is provided or find active encounter
    let encId = encounterId;
    if (!encId) {
      const activeEnc = await query(`
        SELECT encounter_id FROM zmc_patient_queue
        WHERE patient_id = $1 AND (status = 'Waiting' OR status = 'Processing')
        ORDER BY arrival_time DESC LIMIT 1
      `, [patientId]);
      if (activeEnc.rows.length > 0) {
        encId = activeEnc.rows[0].encounter_id;
      }
    }

    // Check if consultation record already exists for this encounter / patient
    let existingConsult;
    if (encId) {
      existingConsult = await query(`
        SELECT id FROM zmc_consultations
        WHERE encounter_id = $1 AND patient_id = $2
        ORDER BY created_at DESC LIMIT 1
      `, [encId, patientId]);
    } else {
      existingConsult = await query(`
        SELECT id FROM zmc_consultations
        WHERE patient_id = $1 AND date = CURRENT_DATE
        ORDER BY created_at DESC LIMIT 1
      `, [patientId]);
    }

    if (existingConsult && existingConsult.rows.length > 0) {
      const consultId = existingConsult.rows[0].id;
      await query(`
        UPDATE zmc_consultations
        SET treatment_plan = $1, diagnosis = $1,
            doctor_id = COALESCE((SELECT id FROM zmc_users WHERE username = $2 LIMIT 1), doctor_id),
            updated_at = NOW()
        WHERE id = $3
      `, [notes || '', doctorName, consultId]);
      return { id: consultId, patientId, encounterId: encId, notes, updated: true };
    } else {
      const newConsultId = generateUUID();
      await query(`
        INSERT INTO zmc_consultations (
          id, patient_id, encounter_id, doctor_id, date, chief_complaint, diagnosis, treatment_plan, prescriptions, created_at, updated_at
        ) VALUES ($1, $2, $3, (SELECT id FROM zmc_users WHERE username = $4 LIMIT 1), CURRENT_DATE, 'Active Consultation', $5, $5, '[]'::jsonb, NOW(), NOW())
      `, [newConsultId, patientId, encId || null, doctorName, notes || '']);
      return { id: newConsultId, patientId, encounterId: encId, notes, created: true };
    }
  }

  public async completeConsultation(
    patientId: string,
    encounterId: string,
    notes: string,
    orderedTests: any[],
    prescribedMedications: any[],
    routeTo: 'lab' | 'pharmacy',
    completedBy: string
  ): Promise<void> {
    // 1. Save or Update Consultation record
    const existingConsult = encounterId ? await query(`
      SELECT id FROM zmc_consultations
      WHERE encounter_id = $1 AND patient_id = $2
      LIMIT 1
    `, [encounterId, patientId]) : { rows: [] };

    if (existingConsult.rows.length > 0) {
      await query(`
        UPDATE zmc_consultations
        SET chief_complaint = 'General Consultation',
            diagnosis = $1,
            treatment_plan = $1,
            prescriptions = $2,
            doctor_id = COALESCE((SELECT id FROM zmc_users WHERE username = $3 LIMIT 1), doctor_id),
            updated_at = NOW()
        WHERE id = $4
      `, [
        notes || 'Routine consultation',
        JSON.stringify(prescribedMedications || []),
        completedBy,
        existingConsult.rows[0].id
      ]);
    } else {
      const consultId = generateUUID();
      await query(`
        INSERT INTO zmc_consultations (
          id, patient_id, encounter_id, doctor_id, date, chief_complaint, diagnosis, treatment_plan, prescriptions, created_at, updated_at
        ) VALUES ($1, $2, $3, (SELECT id FROM zmc_users WHERE username = $4 LIMIT 1), CURRENT_DATE, $5, $6, $7, $8, NOW(), NOW())
      `, [
        consultId,
        patientId,
        encounterId || null,
        completedBy,
        'General Consultation',
        notes || 'Routine consultation',
        notes || 'No specific treatment plan entered',
        JSON.stringify(prescribedMedications || [])
      ]);
    }

    // 2. Insert Lab orders if lab tests are requested and routeTo === 'lab'
    if (routeTo === 'lab' && orderedTests && orderedTests.length > 0) {
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

      for (const test of orderedTests) {
        const testName = test.name || (typeof test === 'string' ? test : 'General Pathology Test');
        let testPrice = Number(test.price);
        if (isNaN(testPrice) || testPrice <= 0) {
          testPrice = priceMap[testName] || 5000;
        }
        totalLabAmount += testPrice;
        testNames.push(`${testName} (₦${testPrice.toLocaleString()})`);

        await query(`
          INSERT INTO zmc_laboratory_orders (id, patient_id, encounter_id, doctor_id, test_name, status, date_ordered)
          VALUES ($1, $2, $3, (SELECT id FROM zmc_users WHERE username = $4 LIMIT 1), $5, 'Pending', NOW())
        `, [generateUUID(), patientId, encounterId, completedBy, testName]);
      }

      // Create unpaid system invoice with total laboratory amount
      const invoiceDescription = `Laboratory Investigations Fee: ${testNames.join(', ')}`;
      await query(`
        INSERT INTO zmc_invoices (id, patient_id, encounter_id, amount, status, description, date_issued)
        VALUES ($1, $2, $3, $4, 'Unpaid', $5, NOW())
      `, [generateUUID(), patientId, encounterId, totalLabAmount, invoiceDescription]);
    }

    // 3. Insert Pharmacy order if prescribedMedications are requested and routeTo === 'pharmacy'
    if (routeTo === 'pharmacy' && prescribedMedications && prescribedMedications.length > 0) {
      let totalPharmAmount = 0;
      const itemsWithCost: any[] = [];

      for (const item of prescribedMedications) {
        const name = item.name || '';
        const dose = item.dose || '';
        const frequency = item.frequency || '';
        const duration = item.duration || '';

        // Parse frequency to times per day
        let timesPerDay = 1;
        const fUpper = frequency.toUpperCase();
        if (fUpper.includes('TDS') || fUpper.includes('T.D.S') || fUpper.includes('3X')) {
          timesPerDay = 3;
        } else if (fUpper.includes('BD') || fUpper.includes('B.I.D') || fUpper.includes('B.D') || fUpper.includes('2X')) {
          timesPerDay = 2;
        } else if (fUpper.includes('QDS') || fUpper.includes('Q.D.S') || fUpper.includes('4X')) {
          timesPerDay = 4;
        } else if (fUpper.includes('DAILY') || fUpper.includes('1X')) {
          timesPerDay = 1;
        }

        // Parse duration to days
        let days = 3; // default
        const durationMatch = duration.match(/\d+/);
        if (durationMatch) {
          days = parseInt(durationMatch[0], 10);
        }
        if (duration.toUpperCase().includes('WEEK')) {
          days = days * 7;
        } else if (duration.toUpperCase().includes('MONTH')) {
          days = days * 30;
        }

        const quantity = timesPerDay * days;

        // Look up drug in zmc_inventory
        let price = 100; // standard fallback base price per unit
        const dbItemRes = await query(`
          SELECT price, name FROM zmc_inventory
          WHERE name ILIKE $1 OR name ILIKE $2
          LIMIT 1
        `, [`%${name}%`, `%${name.split(' ')[0]}%`]);

        let matchedName = name;
        if (dbItemRes.rows.length > 0) {
          price = parseFloat(dbItemRes.rows[0].price);
          matchedName = dbItemRes.rows[0].name;
        }

        const cost = quantity * price;
        totalPharmAmount += cost;

        itemsWithCost.push({
          ...item,
          matchedName,
          quantity,
          price,
          cost
        });
      }

      await query(`
        INSERT INTO zmc_pharmacy_orders (id, patient_id, prescribed_by, status, date_ordered, items, encounter_id)
        VALUES ($1, $2, (SELECT id FROM zmc_users WHERE username = $3 LIMIT 1), 'Pending', NOW(), $4, $5)
      `, [generateUUID(), patientId, completedBy, JSON.stringify(itemsWithCost), encounterId]);

      // Create unpaid system invoice with total pharmacy amount
      const pharmInvoiceDesc = `Pharmacy Prescription Fee: ${itemsWithCost.map(m => `${m.name} x${m.quantity}`).join(', ')}`;
      await query(`
        INSERT INTO zmc_invoices (id, patient_id, encounter_id, amount, status, description, date_issued)
        VALUES ($1, $2, $3, $4, 'Unpaid', $5, NOW())
      `, [generateUUID(), patientId, encounterId, totalPharmAmount, pharmInvoiceDesc]);
    }

    // 4. Update current 'Doctor Consultation' queue status to Completed
    await query(`
      UPDATE zmc_patient_queue
      SET status = 'Completed', processed_at = NOW(), processed_by = $1
      WHERE encounter_id = $2 AND queue_type = 'Doctor Consultation' AND (status = 'Waiting' OR status = 'Processing')
    `, [completedBy, encounterId]);

    // 5. Create Cashier payment queue item depending on the routing choice
    const nextQueueType = routeTo === 'lab' ? 'Cashier Lab Payment' : 'Cashier Pharmacy Payment';
    const nextPatientStatus = routeTo === 'lab' ? 'Waiting for Lab Payment' : 'Waiting for Pharmacy Payment';
    
    await query(`
      INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
      SELECT $1, id, patient_id, $2, priority, 'Waiting', NOW()
      FROM zmc_encounters WHERE id = $3
    `, [generateUUID(), nextQueueType, encounterId]);

    // 6. Update patient status
    await query("UPDATE zmc_patients SET status = $1 WHERE id = $2", [nextPatientStatus, patientId]);
    
    // 7. Update encounter status
    await query("UPDATE zmc_encounters SET clinical_status = $1 WHERE id = $2", [nextPatientStatus, encounterId]);
  }

  public async getLabOrders(encounterId: string): Promise<any[]> {
    const res = await query(`
      SELECT * FROM zmc_laboratory_orders
      WHERE encounter_id = $1 AND status = 'Pending'
    `, [encounterId]);
    return res.rows;
  }

  public async getLabResults(encounterId?: string, patientId?: string): Promise<any[]> {
    if (patientId) {
      const res = await query(`
        SELECT r.*, o.encounter_id, o.patient_id, o.test_name, u.name as doctor_name
        FROM zmc_laboratory_results r
        JOIN zmc_laboratory_orders o ON r.order_id = o.id
        LEFT JOIN zmc_users u ON o.doctor_id = u.id
        WHERE o.patient_id = $1
        ORDER BY r.date_completed DESC
      `, [patientId]);
      return res.rows;
    }
    const res = await query(`
      SELECT r.*, o.encounter_id, o.patient_id, o.test_name, u.name as doctor_name
      FROM zmc_laboratory_results r
      JOIN zmc_laboratory_orders o ON r.order_id = o.id
      LEFT JOIN zmc_users u ON o.doctor_id = u.id
      WHERE o.encounter_id = $1
      ORDER BY r.date_completed ASC
    `, [encounterId]);
    return res.rows;
  }

  public async completeLaboratoryTest(
    patientId: string,
    encounterId: string,
    testResults: Array<{ name: string; result: string; findings: string }>,
    completedBy: string
  ): Promise<void> {
    // 1. Save Laboratory results
    for (const res of testResults) {
      const orderRes = await query(`
        SELECT id FROM zmc_laboratory_orders
        WHERE encounter_id = $1 AND test_name = $2 AND status = 'Pending'
        LIMIT 1
      `, [encounterId, res.name]);
      
      let orderId = null;
      if (orderRes.rows.length > 0) {
        orderId = orderRes.rows[0].id;
        await query("UPDATE zmc_laboratory_orders SET status = 'Completed' WHERE id = $1", [orderId]);
      } else {
        orderId = generateUUID();
        await query(`
          INSERT INTO zmc_laboratory_orders (id, patient_id, encounter_id, test_name, status, date_ordered)
          VALUES ($1, $2, $3, $4, 'Completed', NOW())
        `, [orderId, patientId, encounterId, res.name]);
      }

      await query(`
        INSERT INTO zmc_laboratory_results (id, order_id, patient_id, test_name, result_details, findings, status, date_completed)
        VALUES ($1, $2, $3, $4, $5, $6, 'Completed', NOW())
      `, [generateUUID(), orderId, patientId, res.name, res.result, res.findings]);
    }

    // 2. Mark Laboratory queue item as Completed
    await query(`
      UPDATE zmc_patient_queue
      SET status = 'Completed', processed_at = NOW(), processed_by = $1
      WHERE encounter_id = $2 AND queue_type = 'Laboratory' AND status = 'Waiting'
    `, [completedBy, encounterId]);

    // 3. Route back to Doctor Consultation! (Results sent back to doctor)
    await query(`
      INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
      SELECT $1, id, patient_id, 'Doctor Consultation', priority, 'Waiting', NOW()
      FROM zmc_encounters WHERE id = $2
    `, [generateUUID(), encounterId]);

    // 4. Update patient status
    await query("UPDATE zmc_patients SET status = 'Waiting for Doctor (Lab Results Ready)' WHERE id = $1", [patientId]);
    await query("UPDATE zmc_encounters SET clinical_status = 'Waiting for Doctor (Lab Results Ready)' WHERE id = $1", [encounterId]);
  }

  public async completePharmacyDispense(
    patientId: string,
    encounterId: string,
    completedBy: string
  ): Promise<void> {
    // 1. Fetch pending pharmacy orders for this patient or encounter
    const orderRes = await query(`
      SELECT * FROM zmc_pharmacy_orders
      WHERE encounter_id = $1 AND status = 'Pending'
    `, [encounterId]);

    if (orderRes.rows.length > 0) {
      for (const order of orderRes.rows) {
        let items = [];
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        } catch (e) {
          console.error("Error parsing pharmacy items:", e);
        }

        if (Array.isArray(items)) {
          for (const item of items) {
            const qty = item.quantity || 1;
            const matchedName = item.matchedName || item.name;

            // Reduce inventory quantity
            await query(`
              UPDATE zmc_inventory
              SET quantity = GREATEST(0, quantity - $1)
              WHERE name = $2 OR name ILIKE $3
            `, [qty, matchedName, `%${item.name}%`]);

            // Create inventory transaction audit log
            await query(`
              INSERT INTO zmc_audit_logs (id, timestamp, user_id, user_name, user_role, action, details)
              VALUES ($1, NOW(), (SELECT id FROM zmc_users WHERE username = $2 LIMIT 1), $2, 'Pharmacist', 'INVENTORY_DISPENSE', $3)
            `, [
              generateUUID(),
              completedBy,
              `Dispensed ${qty} unit(s) of ${matchedName} for Patient ID ${patientId}, Encounter ID ${encounterId}`
            ]);
          }
        }
      }
    }

    // 2. Mark Pharmacy orders as Dispensed/Completed
    await query(`
      UPDATE zmc_pharmacy_orders
      SET status = 'Dispensed'
      WHERE encounter_id = $1 AND status = 'Pending'
    `, [encounterId]);

    // 3. Mark Pharmacy queue item as Completed
    await query(`
      UPDATE zmc_patient_queue
      SET status = 'Completed', processed_at = NOW(), processed_by = $1
      WHERE encounter_id = $2 AND queue_type = 'Pharmacy' AND status = 'Waiting'
    `, [completedBy, encounterId]);

    // 4. Mark encounter and patient as Completed!
    await query("UPDATE zmc_patients SET status = 'Completed' WHERE id = $1", [patientId]);
    await query("UPDATE zmc_encounters SET clinical_status = 'Completed', closed_at = NOW() WHERE id = $1", [encounterId]);
  }

  public async getPharmacyOrders(encounterId: string): Promise<any[]> {
    const res = await query(`
      SELECT p.*, u.name as doctor_name
      FROM zmc_pharmacy_orders p
      LEFT JOIN zmc_users u ON p.prescribed_by = u.id
      WHERE p.encounter_id = $1
      ORDER BY p.date_ordered DESC
    `, [encounterId]);
    return res.rows;
  }

  public async getInvoices(): Promise<any[]> {
    const res = await query(`
      SELECT i.*, p.name as patient_name, p.hospital_number
      FROM zmc_invoices i
      LEFT JOIN zmc_patients p ON i.patient_id = p.id
      ORDER BY i.date_issued DESC
    `);
    return res.rows;
  }
}
