import { Router } from 'express';
import { query, generateUUID } from '../../database/db.repo';
import { authenticateJWT, authorizeRoles } from '../../middleware/auth.middleware';
import { broadcastNotification } from '../../utils/ws.util';

const router = Router();

router.use(authenticateJWT as any);

// Helper to verify encounter_id and invoice_id exist in DB before inserting into zmc_payments
async function sanitizeEncounterAndInvoice(encounterId?: any, invoiceId?: any) {
  let validEncounterId: string | null = null;
  let validInvoiceId: string | null = null;

  if (encounterId && typeof encounterId === 'string' && encounterId.trim() !== '' && encounterId !== 'null' && encounterId !== 'undefined') {
    try {
      const encCheck = await query('SELECT id FROM zmc_encounters WHERE id = $1', [encounterId.trim()]);
      if (encCheck.rows.length > 0) {
        validEncounterId = encounterId.trim();
      }
    } catch (e) {
      console.warn('Encounter validation check failed:', e);
    }
  }

  if (invoiceId && typeof invoiceId === 'string' && invoiceId.trim() !== '' && invoiceId !== 'null' && invoiceId !== 'undefined') {
    try {
      const invCheck = await query('SELECT id FROM zmc_invoices WHERE id = $1', [invoiceId.trim()]);
      if (invCheck.rows.length > 0) {
        validInvoiceId = invoiceId.trim();
      }
    } catch (e) {
      console.warn('Invoice validation check failed:', e);
    }
  }

  return { validEncounterId, validInvoiceId };
}

// Confirm/Approve a pending unconfirmed payment - Cashier, Administrator, Management
router.post(
  '/:id/confirm',
  authorizeRoles(['Cashier', 'Administrator', 'Management']) as any,
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      // Fetch current payment record
      const paymentCheck = await query('SELECT * FROM zmc_payments WHERE id = $1', [id]);
      if (paymentCheck.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Payment record not found' });
      }

      const payment = paymentCheck.rows[0];
      if (payment.status === 'Completed') {
        return res.status(400).json({ success: false, error: 'Payment is already confirmed and completed' });
      }

      // Update payment status to Completed
      await query(`
        UPDATE zmc_payments
        SET status = 'Completed', date_paid = NOW(), collected_by = $1
        WHERE id = $2
      `, [req.user?.id || payment.collected_by, id]);

      const patientId = payment.patient_id;
      const encounterId = payment.encounter_id;
      const invoiceId = payment.invoice_id;

      // Always mark all unpaid invoices for this patient as Paid
      await query(`
        UPDATE zmc_invoices
        SET status = 'Paid'
        WHERE patient_id = $1 OR id = $2
      `, [patientId, invoiceId || null]);

      // Always mark all encounters for this patient as Paid
      await query(`
        UPDATE zmc_encounters
        SET payment_status = 'Paid'
        WHERE patient_id = $1 OR id = $2
      `, [patientId, encounterId || null]);

      // --- STAGE TRANSITION AUTOMATION ON HANDOVER CONFIRMATION ---
      
      // 1. Check for active queue item of type 'Cashier Consultation Payment'
      const consultQueueCheck = await query(`
        SELECT * FROM zmc_patient_queue
        WHERE patient_id = $1 AND queue_type = 'Cashier Consultation Payment' AND status = 'Waiting'
        LIMIT 1
      `, [patientId]);

      if (consultQueueCheck.rows.length > 0) {
        const qItem = consultQueueCheck.rows[0];
        // Complete the cashier payment queue item
        await query(`
          UPDATE zmc_patient_queue
          SET status = 'Completed', processed_at = NOW(), processed_by = $1
          WHERE id = $2
        `, [req.user?.username || 'Cashier', qItem.id]);

        // Update encounter status to 'Pending Consultation'
        await query(`
          UPDATE zmc_encounters
          SET clinical_status = 'Pending Consultation', payment_status = 'Paid'
          WHERE id = $1
        `, [qItem.encounter_id]);

        // Queue to Doctor Consultation!
        await query(`
          INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
          VALUES ($1, $2, $3, 'Doctor Consultation', $4, 'Waiting', NOW())
        `, [generateUUID(), qItem.encounter_id, patientId, qItem.priority]);

        // Set patient status
        await query("UPDATE zmc_patients SET status = 'Waiting for Doctor' WHERE id = $1", [patientId]);
      }

      // 2. Check for active queue item of type 'Cashier Lab Payment'
      const labQueueCheck = await query(`
        SELECT * FROM zmc_patient_queue
        WHERE patient_id = $1 AND (queue_type = 'Cashier Lab Payment' OR queue_type = 'Cashier Desk') AND (status = 'Waiting' OR status = 'Processing')
        LIMIT 1
      `, [patientId]);

      if (labQueueCheck.rows.length > 0) {
        const qItem = labQueueCheck.rows[0];
        // Complete the cashier lab payment queue item
        await query(`
          UPDATE zmc_patient_queue
          SET status = 'Completed', processed_at = NOW(), processed_by = $1
          WHERE id = $2
        `, [req.user?.username || 'Cashier', qItem.id]);

        // Queue to Laboratory queue!
        await query(`
          INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
          VALUES ($1, $2, $3, 'Laboratory', $4, 'Waiting', NOW())
        `, [generateUUID(), qItem.encounter_id, patientId, qItem.priority || 'Routine']);

        // Set patient status
        await query("UPDATE zmc_patients SET status = 'Waiting for Laboratory' WHERE id = $1", [patientId]);
        await query("UPDATE zmc_encounters SET clinical_status = 'Waiting for Laboratory' WHERE id = $1", [qItem.encounter_id]);

        // Broadcast to Laboratory Scientist
        const patRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
        const patName = patRes.rows[0]?.name || 'Patient';
        broadcastNotification({
          type: 'PATIENT_ROUTED_TO_LAB',
          targetRole: 'Laboratory Scientist',
          message: `Payment confirmed for ${patName}! Patient routed to Laboratory under Regular Lab Queue.`,
          patientId
        });
        broadcastNotification({
          type: 'LAB_ORDER_CREATED',
          targetRole: 'Laboratory Scientist',
          message: `New lab tests paid for ${patName}.`,
          patientId
        });
      } else {
        // Fallback: Check if patient has an encounter waiting for lab payment or a lab invoice
        const openLabEnc = await query(`
          SELECT e.id, e.priority FROM zmc_encounters e
          JOIN zmc_invoices i ON i.encounter_id = e.id
          WHERE e.patient_id = $1 AND (e.clinical_status = 'Waiting for Lab Payment' OR i.description ILIKE '%Laboratory%')
          ORDER BY e.created_at DESC LIMIT 1
        `, [patientId]);

        if (openLabEnc.rows.length > 0) {
          const encId = openLabEnc.rows[0].id;
          const prio = openLabEnc.rows[0].priority || 'Routine';

          const existingLabQ = await query(`
            SELECT id FROM zmc_patient_queue
            WHERE encounter_id = $1 AND queue_type = 'Laboratory' AND (status = 'Waiting' OR status = 'Processing')
          `, [encId]);

          if (existingLabQ.rows.length === 0) {
            await query(`
              INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
              VALUES ($1, $2, $3, 'Laboratory', $4, 'Waiting', NOW())
            `, [generateUUID(), encId, patientId, prio]);

            await query("UPDATE zmc_patients SET status = 'Waiting for Laboratory' WHERE id = $1", [patientId]);
            await query("UPDATE zmc_encounters SET clinical_status = 'Waiting for Laboratory' WHERE id = $1", [encId]);

            const patRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
            const patName = patRes.rows[0]?.name || 'Patient';
            broadcastNotification({
              type: 'PATIENT_ROUTED_TO_LAB',
              targetRole: 'Laboratory Scientist',
              message: `Payment confirmed for ${patName}! Patient routed to Laboratory under Regular Lab Queue.`,
              patientId
            });
          }
        }
      }

      // 3. Check for active queue item of type 'Cashier Pharmacy Payment'
      const pharmQueueCheck = await query(`
        SELECT * FROM zmc_patient_queue
        WHERE patient_id = $1 AND queue_type = 'Cashier Pharmacy Payment' AND status = 'Waiting'
        LIMIT 1
      `, [patientId]);

      if (pharmQueueCheck.rows.length > 0) {
        const qItem = pharmQueueCheck.rows[0];
        // Complete the cashier pharmacy payment queue item
        await query(`
          UPDATE zmc_patient_queue
          SET status = 'Completed', processed_at = NOW(), processed_by = $1
          WHERE id = $2
        `, [req.user?.username || 'Cashier', qItem.id]);

        // Queue to Pharmacy queue!
        await query(`
          INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
          VALUES ($1, $2, $3, 'Pharmacy', $4, 'Waiting', NOW())
        `, [generateUUID(), qItem.encounter_id, patientId, qItem.priority]);

        // Set patient status
        await query("UPDATE zmc_patients SET status = 'Waiting for Pharmacy' WHERE id = $1", [patientId]);
        await query("UPDATE zmc_encounters SET clinical_status = 'Waiting for Pharmacy' WHERE id = $1", [qItem.encounter_id]);
      }

      // Cleanup any remaining waiting Cashier queue items for this patient
      await query(`
        UPDATE zmc_patient_queue
        SET status = 'Completed', processed_at = NOW(), processed_by = $1
        WHERE patient_id = $2 AND (queue_type LIKE 'Cashier%' OR queue_type = 'Cashier Desk') AND status = 'Waiting'
      `, [req.user?.username || 'Cashier', patientId]);

      // Fetch patient details for notification
      const patientRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
      const patientName = patientRes.rows[0]?.name || 'Outpatient';

      broadcastNotification({
        type: 'PAYMENT_HANDOVER_CONFIRMED',
        targetRole: 'Cashier',
        message: `Handover confirmed! ₦${parseFloat(payment.amount).toLocaleString()} collected for ${patientName} is now balanced.`,
        patientId,
        data: { paymentId: id }
      });

      res.json({ success: true, message: 'Payment successfully confirmed and balanced.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Register a walk-in / outside doctor lab outpatient
router.post(
  '/lab/walk-in',
  authorizeRoles(['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Administrator', 'IT Administrator', 'Management', 'Cashier']) as any,
  async (req: any, res: any) => {
    try {
      const {
        patientName,
        dob,
        age,
        gender,
        maritalStatus,
        phoneNumber,
        address,
        referringDoctor,
        tests,
        totalAmount: reqTotal,
        paymentMethod
      } = req.body;

      if (!patientName || (!dob && !age) || !gender || !tests || tests.length === 0) {
        return res.status(400).json({ success: false, error: 'Missing required walk-in registration details.' });
      }

      // Calculate total if missing
      const calculatedTotal = (tests || []).reduce((sum: number, t: any) => sum + Number(t.price || 0), 0);
      const totalAmount = reqTotal !== undefined ? Number(reqTotal) : calculatedTotal;

      // 1. Create Patient Record
      const patientId = generateUUID();
      const hospitalNumber = `HOSP-LAB-${Math.floor(100000 + Math.random() * 900000)}`;

      // Parse DOB string or age estimate
      let parsedDob = '1990-01-01';
      if (dob && dob.trim()) {
        const parts = dob.trim().split('/');
        if (parts.length === 3) {
          // dd/mm/yyyy -> yyyy-mm-dd
          parsedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else {
          parsedDob = dob;
        }
      } else if (age) {
        const ageNum = parseInt(age, 10) || 30;
        const birthYear = new Date().getFullYear() - ageNum;
        parsedDob = `${birthYear}-01-01`;
      }

      await query(`
        INSERT INTO zmc_patients (
          id, hospital_number, name, date_of_birth, gender, phone_number, address, marital_status, card_type, status, card_fee, registered_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Standard', 'Waiting for Cashier (Walk-In Lab)', 0, $9)
      `, [
        patientId,
        hospitalNumber,
        patientName,
        parsedDob,
        gender,
        phoneNumber || null,
        address || null,
        maritalStatus || 'Single',
        req.user?.username || 'Scientist'
      ]);

      // 2. Create Encounter Record
      const encounterId = generateUUID();
      const visitReason = `Outside doctor lab request. Referring Doctor: ${referringDoctor || 'Outside Doctor'}`;
      await query(`
        INSERT INTO zmc_encounters (
          id, patient_id, visit_number, visit_type, destination_clinic, priority, priority_reason, payment_status, clinical_status, created_by
        ) VALUES ($1, $2, 1, 'Laboratory Walk-In', 'Laboratory', 'Routine', $3, 'Unconfirmed', 'Waiting for Cashier Payment', $4)
      `, [encounterId, patientId, visitReason, req.user?.username || 'Scientist']);

      // 1. Calculate precise total amount from test prices
      const calcSum = (tests || []).reduce((sum: number, t: any) => sum + (Number(t.price) || 0), 0);
      const finalTotalAmount = calcSum > 0 ? calcSum : Number(totalAmount || 0);

      // Create Unpaid Invoice
      const invoiceId = generateUUID();
      const invoiceNum = `INV-WALK-${Math.floor(100000 + Math.random() * 900000)}`;
      const testNamesSummary = (tests || []).map((t: any) => `${t.name} (₦${Number(t.price || 0).toLocaleString()})`).join('; ');

      await query(`
        INSERT INTO zmc_invoices (
          id, invoice_number, patient_id, encounter_id, amount, description, status, date_issued
        ) VALUES ($1, $2, $3, $4, $5, $6, 'Unpaid', NOW())
      `, [
        invoiceId,
        invoiceNum,
        patientId,
        encounterId,
        finalTotalAmount,
        `Walk-In Lab: ${testNamesSummary}`
      ]);

      // 4. Create Unconfirmed Payment Record
      const paymentId = generateUUID();
      await query(`
        INSERT INTO zmc_payments (
          id, patient_id, encounter_id, invoice_id, amount, status, date_paid, payment_method, collected_by
        ) VALUES ($1, $2, $3, $4, $5, 'Unconfirmed', NOW(), $6, $7)
      `, [paymentId, patientId, encounterId, invoiceId, finalTotalAmount, paymentMethod || 'Cash', req.user?.id || null]);

      // 5. Create Laboratory Orders for Selected Tests
      for (const test of tests) {
        await query(`
          INSERT INTO zmc_laboratory_orders (id, patient_id, encounter_id, test_name, status, date_ordered)
          VALUES ($1, $2, $3, $4, 'Pending', NOW())
        `, [generateUUID(), patientId, encounterId, test.name]);
      }

      // 6. Create Queue Item for Cashier Collection
      await query(`
        INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
        VALUES ($1, $2, $3, 'Cashier Lab Payment', 'Routine', 'Waiting', NOW())
      `, [generateUUID(), encounterId, patientId]);

      // Broadcast alert
      broadcastNotification({
        type: 'LAB_WALK_IN_REGISTERED',
        targetRole: 'Cashier',
        message: `Walk-In outpatient ${patientName} registered for lab tests (₦${totalAmount.toLocaleString()}). Sent to Cashier for payment collection.`,
        patientId
      });

      res.status(201).json({
        success: true,
        message: 'Walk-in outpatient registered successfully and sent to Cashier.',
        data: { patientId, encounterId, hospitalNumber, totalAmount, testsCount: tests.length }
      });
    } catch (err: any) {
      console.error('Error registering walk-in patient:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Get list of walk-in lab patients divided into Pending Payment and Paid/Ready for Testing
router.get(
  '/lab/walk-in',
  authorizeRoles(['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Cashier', 'Account Officer', 'Administrator', 'IT Administrator', 'Management', 'Doctor']) as any,
  async (req: any, res: any) => {
    try {
      // 1. Fetch walk-in encounters with invoice and payment amounts
      const resEnc = await query(`
        SELECT DISTINCT ON (e.id)
               e.id as encounter_id, e.patient_id, e.payment_status, e.created_at, e.priority_reason,
               p.name as patient_name, p.phone_number, p.hospital_number, p.gender, p.date_of_birth, p.address, p.marital_status, p.status as patient_status,
               i.id as invoice_id, i.amount as invoice_amount, i.description as invoice_desc, i.status as invoice_status,
               pay.amount as payment_amount
        FROM zmc_encounters e
        JOIN zmc_patients p ON e.patient_id = p.id
        LEFT JOIN zmc_invoices i ON i.encounter_id = e.id
        LEFT JOIN zmc_payments pay ON pay.encounter_id = e.id
        WHERE e.visit_type = 'Laboratory Walk-In'
        ORDER BY e.id, e.created_at DESC
        LIMIT 150
      `);

      const pendingPayment: any[] = [];
      const paidReadyForTesting: any[] = [];

      for (const row of resEnc.rows) {
        // Fetch orders for test count
        const ordersRes = await query(`
          SELECT test_name, status FROM zmc_laboratory_orders WHERE encounter_id = $1
        `, [row.encounter_id]);

        const tests = ordersRes.rows;
        const pendingTestsCount = tests.filter(t => t.status === 'Pending').length;
        const totalTestsCount = tests.length || 1;

        const summary = row.invoice_desc ? row.invoice_desc.replace('Walk-In Lab: ', '') : `${totalTestsCount} test(s)`;
        const isPaid = row.payment_status === 'Paid' || row.invoice_status === 'Paid' || row.patient_status === 'Waiting for Laboratory';

        // Extract referring doctor from priority_reason
        let referringDoctor = 'Outside Doctor / Self';
        if (row.priority_reason && row.priority_reason.includes('Referring Doctor: ')) {
          const parts = row.priority_reason.split('Referring Doctor: ');
          referringDoctor = (parts[1] || 'Outside Doctor').split(' [Sent to Cashier]')[0] || 'Outside Doctor';
        }

        const isSentToCashier = row.priority_reason ? row.priority_reason.includes('[Sent to Cashier]') : false;

        let calculatedAmount = Number(row.invoice_amount || row.payment_amount || 0);
        if (calculatedAmount === 0 && row.invoice_desc) {
          const priceMatches = row.invoice_desc.match(/₦([\d,]+)/g);
          if (priceMatches) {
            calculatedAmount = priceMatches.reduce((acc: number, str: string) => {
              const val = parseFloat(str.replace(/[^\d.]/g, ''));
              return acc + (isNaN(val) ? 0 : val);
            }, 0);
          }
        }

        const itemObj = {
          encounterId: row.encounter_id,
          patientId: row.patient_id,
          patientName: row.patient_name,
          phoneNumber: row.phone_number || '—',
          hospitalNumber: row.hospital_number,
          gender: row.gender,
          dob: row.date_of_birth ? new Date(row.date_of_birth).toISOString().split('T')[0] : '',
          address: row.address || '—',
          maritalStatus: row.marital_status || 'Single',
          referringDoctor: referringDoctor,
          isSentToCashier: isSentToCashier,
          totalAmount: calculatedAmount,
          testsList: tests.map((t: any) => t.test_name),
          testCount: totalTestsCount,
          pendingTestCount: pendingTestsCount,
          testsSummary: summary,
          invoiceId: row.invoice_id,
          dateRegistered: row.created_at,
          paymentStatus: isPaid ? 'Paid' : 'Unconfirmed',
          statusText: isPaid ? 'Paid - Ready for Testing' : 'Waiting for cashier payment verification'
        };

        if (!isPaid) {
          pendingPayment.push(itemObj);
        } else if (pendingTestsCount > 0) {
          paidReadyForTesting.push(itemObj);
        }
      }

      res.json({
        success: true,
        data: {
          pendingPayment,
          paidReadyForTesting
        }
      });
    } catch (err: any) {
      console.error('Error fetching walk-in lab queue:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Mark walk-in patient as sent to cashier
router.post(
  '/lab/mark-sent-to-cashier',
  authorizeRoles(['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Cashier', 'Account Officer', 'Administrator', 'IT Administrator', 'Management']) as any,
  async (req: any, res: any) => {
    try {
      const { encounterId } = req.body;
      if (!encounterId) {
        return res.status(400).json({ success: false, error: 'encounterId is required' });
      }

      await query(`
        UPDATE zmc_encounters
        SET priority_reason = COALESCE(priority_reason, '') || ' [Sent to Cashier]'
        WHERE id = $1 AND (priority_reason IS NULL OR priority_reason NOT LIKE '%[Sent to Cashier]%')
      `, [encounterId]);

      res.json({ success: true, message: 'Patient marked as sent to cashier' });
    } catch (err: any) {
      console.error('Error marking walk-in as sent to cashier:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Confirm walk-in patient payment manually or from Cashier
router.post(
  '/lab/confirm-walk-in',
  authorizeRoles(['Cashier', 'Account Officer', 'Laboratory Scientist', 'Lab Technician', 'Scientist', 'Administrator', 'IT Administrator', 'Management']) as any,
  async (req: any, res: any) => {
    try {
      const { patientId, encounterId, invoiceId, amount, paymentMethod } = req.body;
      if (!patientId) {
        return res.status(400).json({ success: false, error: 'patientId is required' });
      }

      const { validEncounterId, validInvoiceId } = await sanitizeEncounterAndInvoice(encounterId, invoiceId);

      // Update or insert payment
      const payUpdate = await query(`
        UPDATE zmc_payments
        SET status = 'Completed', amount = $1, date_paid = NOW(), payment_method = $2, collected_by = $3
        WHERE (encounter_id IS NOT NULL AND encounter_id = $4) OR (patient_id = $5 AND status = 'Unconfirmed')
      `, [amount || 0, paymentMethod || 'Cash', req.user?.username || 'Cashier', validEncounterId, patientId]);

      if (payUpdate.rowCount === 0) {
        await query(`
          INSERT INTO zmc_payments (id, patient_id, encounter_id, invoice_id, amount, status, date_paid, payment_method, collected_by)
          VALUES ($1, $2, $3, $4, $5, 'Completed', NOW(), $6, $7)
        `, [generateUUID(), patientId, validEncounterId, validInvoiceId, amount || 0, paymentMethod || 'Cash', req.user?.username || 'Cashier']);
      }

      // Update invoice
      if (invoiceId) {
        await query("UPDATE zmc_invoices SET status = 'Paid' WHERE id = $1", [invoiceId]);
      } else {
        await query("UPDATE zmc_invoices SET status = 'Paid' WHERE encounter_id = $1", [encounterId]);
      }

      // Update encounter & patient status
      await query("UPDATE zmc_encounters SET payment_status = 'Paid', clinical_status = 'Waiting for Laboratory' WHERE id = $1", [encounterId]);
      await query("UPDATE zmc_patients SET status = 'Waiting for Laboratory' WHERE id = $1", [patientId]);

      // Move queue item from Cashier Lab Payment -> Laboratory
      await query(`
        UPDATE zmc_patient_queue
        SET queue_type = 'Laboratory', status = 'Waiting', arrival_time = NOW()
        WHERE encounter_id = $1
      `, [encounterId]);

      // Record permanent lab payment entry in zmc_lab_payments
      const patRes = await query('SELECT name, hospital_number, card_type FROM zmc_patients WHERE id = $1', [patientId]);
      const pat = patRes.rows[0] || {};
      const invRes = invoiceId ? await query('SELECT description FROM zmc_invoices WHERE id = $1', [invoiceId]) : { rows: [] };
      const invDesc = invRes.rows[0]?.description || 'Walk-In Laboratory Investigations';

      await query(`
        INSERT INTO zmc_lab_payments (id, patient_id, patient_name, hospital_number, card_type, tests_summary, amount, payment_method, date_paid, collected_by, encounter_id, invoice_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11)
      `, [
        generateUUID(),
        patientId,
        pat.name || 'Walk-In Outpatient',
        pat.hospital_number || '—',
        pat.card_type || 'Standard',
        invDesc,
        amount || 0,
        paymentMethod || 'Cash',
        req.user?.username || 'Cashier',
        encounterId,
        invoiceId || null
      ]);

      const totalB = req.body.totalBill ? parseFloat(req.body.totalBill) : parseFloat(amount || 0);
      const paidAmt = parseFloat(amount || 0);
      if (totalB > paidAmt) {
        const bal = totalB - paidAmt;
        await query(`
          INSERT INTO zmc_outstanding_balances (id, patient_id, patient_name, hospital_number, encounter_id, invoice_id, purpose, department, total_bill, amount_paid, balance, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'Laboratory', $8, $9, $10, 'Owing', NOW(), NOW())
        `, [generateUUID(), patientId, pat.name || 'Walk-In Outpatient', pat.hospital_number || '—', encounterId, invoiceId || null, invDesc || 'Walk-In Laboratory Investigations', totalB, paidAmt, bal]);

        const sumRes = await query(`
          SELECT COALESCE(SUM(balance), 0) as remaining_total
          FROM zmc_outstanding_balances
          WHERE patient_id = $1 AND status = 'Owing'
        `, [patientId]);
        const remainingTotal = parseFloat(sumRes.rows[0].remaining_total || '0');
        await query('UPDATE zmc_patients SET outstanding_balance = $1 WHERE id = $2', [remainingTotal, patientId]);
      }

      broadcastNotification({
        type: 'LAB_WALK_IN_PAID',
        targetRole: 'Laboratory Scientist',
        message: `Walk-in patient ${pat.name || ''} payment confirmed (₦${(amount || 0).toLocaleString()}). Ready for lab testing.`,
        patientId
      });

      res.json({
        success: true,
        message: 'Walk-in payment confirmed successfully. Moved to Paid - Ready for Testing.'
      });
    } catch (err: any) {
      console.error('Error confirming walk-in payment:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Create a payment - all clinical staff (forced to Unconfirmed unless Cashier/Admin/Mgmt)
router.post(
  '/',
  authorizeRoles(['Cashier', 'Administrator', 'Management', 'Laboratory Scientist', 'Nurse', 'Receptionist', 'Doctor']) as any,
  async (req: any, res: any) => {
    try {
      const { patientId, invoiceId, amount, paymentMethod, status, encounterId } = req.body;
      const { validEncounterId, validInvoiceId } = await sanitizeEncounterAndInvoice(encounterId, invoiceId);

      const id = generateUUID();
      const datePaid = new Date().toISOString();

      const userRole = req.user?.role;
      const isCashierAuthorized = (userRole === 'Cashier' || userRole === 'Administrator' || userRole === 'Management');
      const finalStatus = isCashierAuthorized ? (status || 'Completed') : 'Unconfirmed';

      const result = await query(`
        INSERT INTO zmc_payments (
          id, patient_id, encounter_id, invoice_id, amount, status, date_paid, payment_method, collected_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        id,
        patientId,
        validEncounterId,
        validInvoiceId,
        amount,
        finalStatus,
        datePaid,
        paymentMethod || 'Cash',
        req.user?.id || null
      ]);

      // If an invoice is associated and we're completing it, mark it as Paid
      if (invoiceId && finalStatus === 'Completed') {
        await query(`
          UPDATE zmc_invoices
          SET status = 'Paid'
          WHERE id = $1
        `, [invoiceId]);
      }

      // If we are recording an unconfirmed payment, trigger alert to cashier
      if (finalStatus === 'Unconfirmed') {
        // Fetch patient details for notification
        const patientRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
        const patientName = patientRes.rows[0]?.name || 'Outpatient';

        broadcastNotification({
          type: 'DEPARTMENTAL_CASH_COLLECTED',
          targetRole: 'Cashier',
          message: `${userRole} collected ₦${parseFloat(amount).toLocaleString()} in cash/POS for patient ${patientName}. Awaiting handover confirmation.`,
          patientId
        });
      }

      // --- STAGE TRANSITION AUTOMATION ON PAYMENT (ONLY IF COMPLETED!) ---
      if (finalStatus === 'Completed') {
        // Mark all unpaid invoices for this patient as Paid
        await query(`
          UPDATE zmc_invoices
          SET status = 'Paid'
          WHERE patient_id = $1 OR id = $2
        `, [patientId, invoiceId || null]);

        // Mark all encounters for this patient as Paid
        await query(`
          UPDATE zmc_encounters
          SET payment_status = 'Paid'
          WHERE patient_id = $1 OR id = $2
        `, [patientId, encounterId || null]);

        // 1. Check for active queue item of type 'Cashier Consultation Payment'
        const consultQueueCheck = await query(`
          SELECT * FROM zmc_patient_queue
          WHERE patient_id = $1 AND queue_type = 'Cashier Consultation Payment' AND status = 'Waiting'
          LIMIT 1
        `, [patientId]);

        if (consultQueueCheck.rows.length > 0) {
          const qItem = consultQueueCheck.rows[0];
          // Complete the cashier payment queue item
          await query(`
            UPDATE zmc_patient_queue
            SET status = 'Completed', processed_at = NOW(), processed_by = $1
            WHERE id = $2
          `, [req.user?.username || 'Cashier', qItem.id]);

          // Update encounter status to 'Pending Consultation'
          await query(`
            UPDATE zmc_encounters
            SET clinical_status = 'Pending Consultation', payment_status = 'Paid'
            WHERE id = $1
          `, [qItem.encounter_id]);

          // Queue to Doctor Consultation!
          await query(`
            INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
            VALUES ($1, $2, $3, 'Doctor Consultation', $4, 'Waiting', NOW())
          `, [generateUUID(), qItem.encounter_id, patientId, qItem.priority]);

          // Set patient status
          await query("UPDATE zmc_patients SET status = 'Waiting for Doctor' WHERE id = $1", [patientId]);
        } else {
          // Fallback: If payment was processed via account lookup, move open encounter to Doctor Consultation queue
          const openEncounter = await query(`
            SELECT id, priority FROM zmc_encounters
            WHERE patient_id = $1 AND (clinical_status = 'Open' OR clinical_status = 'Waiting for Consultation Payment' OR clinical_status = 'Triage Completed' OR clinical_status = 'Pending Registration')
            ORDER BY created_at DESC LIMIT 1
          `, [patientId]);

          if (openEncounter.rows.length > 0) {
            const encId = openEncounter.rows[0].id;
            const prio = openEncounter.rows[0].priority || 'Routine';
            await query(`
              UPDATE zmc_encounters
              SET clinical_status = 'Pending Consultation', payment_status = 'Paid'
              WHERE id = $1
            `, [encId]);
            await query(`
              INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
              VALUES ($1, $2, $3, 'Doctor Consultation', $4, 'Waiting', NOW())
            `, [generateUUID(), encId, patientId, prio]);
            await query("UPDATE zmc_patients SET status = 'Waiting for Doctor' WHERE id = $1", [patientId]);
          }
        }

        // 2. Check for active queue item of type 'Cashier Lab Payment'
        const labQueueCheck = await query(`
          SELECT * FROM zmc_patient_queue
          WHERE patient_id = $1 AND (queue_type = 'Cashier Lab Payment' OR queue_type = 'Cashier Desk') AND (status = 'Waiting' OR status = 'Processing')
          LIMIT 1
        `, [patientId]);

        if (labQueueCheck.rows.length > 0) {
          const qItem = labQueueCheck.rows[0];
          // Complete the cashier lab payment queue item
          await query(`
            UPDATE zmc_patient_queue
            SET status = 'Completed', processed_at = NOW(), processed_by = $1
            WHERE id = $2
          `, [req.user?.username || 'Cashier', qItem.id]);

          // Queue to Laboratory queue!
          await query(`
            INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
            VALUES ($1, $2, $3, 'Laboratory', $4, 'Waiting', NOW())
          `, [generateUUID(), qItem.encounter_id, patientId, qItem.priority || 'Routine']);

          // Record permanent lab payment entry in zmc_lab_payments database table
          const patRes = await query('SELECT name, hospital_number, card_type FROM zmc_patients WHERE id = $1', [patientId]);
          const pat = patRes.rows[0] || {};
          const invRes = invoiceId ? await query('SELECT description FROM zmc_invoices WHERE id = $1', [invoiceId]) : { rows: [] };
          const invDesc = invRes.rows[0]?.description || 'Laboratory Investigations Fee';

          await query(`
            INSERT INTO zmc_lab_payments (id, patient_id, patient_name, hospital_number, card_type, tests_summary, amount, payment_method, date_paid, collected_by, encounter_id, invoice_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9, $10, $11)
          `, [
            generateUUID(),
            patientId,
            pat.name || 'Outpatient',
            pat.hospital_number || '—',
            pat.card_type || 'Standard',
            invDesc,
            amount || 0,
            paymentMethod || 'Cash',
            req.user?.username || 'Cashier',
            qItem.encounter_id || encounterId || null,
            invoiceId || null
          ]);

          // Set patient status
          await query("UPDATE zmc_patients SET status = 'Waiting for Laboratory' WHERE id = $1", [patientId]);
          await query("UPDATE zmc_encounters SET clinical_status = 'Waiting for Laboratory' WHERE id = $1", [qItem.encounter_id]);

          // Broadcast to Laboratory Scientist
          broadcastNotification({
            type: 'PATIENT_ROUTED_TO_LAB',
            targetRole: 'Laboratory Scientist',
            message: `Payment confirmed for ${pat.name || 'Outpatient'}! Patient routed to Laboratory under Regular Lab Queue.`,
            patientId
          });
          broadcastNotification({
            type: 'LAB_ORDER_CREATED',
            targetRole: 'Laboratory Scientist',
            message: `New lab tests paid for ${pat.name || 'Outpatient'}.`,
            patientId
          });
        } else {
          // Fallback: Check if patient has an encounter waiting for lab payment or a lab invoice
          const openLabEnc = await query(`
            SELECT e.id, e.priority FROM zmc_encounters e
            JOIN zmc_invoices i ON i.encounter_id = e.id
            WHERE e.patient_id = $1 AND (e.clinical_status = 'Waiting for Lab Payment' OR i.description ILIKE '%Laboratory%')
            ORDER BY e.created_at DESC LIMIT 1
          `, [patientId]);

          if (openLabEnc.rows.length > 0) {
            const encId = openLabEnc.rows[0].id;
            const prio = openLabEnc.rows[0].priority || 'Routine';

            const existingLabQ = await query(`
              SELECT id FROM zmc_patient_queue
              WHERE encounter_id = $1 AND queue_type = 'Laboratory' AND (status = 'Waiting' OR status = 'Processing')
            `, [encId]);

            if (existingLabQ.rows.length === 0) {
              await query(`
                INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
                VALUES ($1, $2, $3, 'Laboratory', $4, 'Waiting', NOW())
              `, [generateUUID(), encId, patientId, prio]);

              await query("UPDATE zmc_patients SET status = 'Waiting for Laboratory' WHERE id = $1", [patientId]);
              await query("UPDATE zmc_encounters SET clinical_status = 'Waiting for Laboratory' WHERE id = $1", [encId]);

              const patRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
              const patName = patRes.rows[0]?.name || 'Patient';
              broadcastNotification({
                type: 'PATIENT_ROUTED_TO_LAB',
                targetRole: 'Laboratory Scientist',
                message: `Payment confirmed for ${patName}! Patient routed to Laboratory under Regular Lab Queue.`,
                patientId
              });
            }
          }
        }

        // 3. Check for active queue item of type 'Cashier Pharmacy Payment'
        const pharmQueueCheck = await query(`
          SELECT * FROM zmc_patient_queue
          WHERE patient_id = $1 AND queue_type = 'Cashier Pharmacy Payment' AND status = 'Waiting'
          LIMIT 1
        `, [patientId]);

        if (pharmQueueCheck.rows.length > 0) {
          const qItem = pharmQueueCheck.rows[0];
          // Complete the cashier pharmacy payment queue item
          await query(`
            UPDATE zmc_patient_queue
            SET status = 'Completed', processed_at = NOW(), processed_by = $1
            WHERE id = $2
          `, [req.user?.username || 'Cashier', qItem.id]);

          // Queue to Pharmacy queue!
          await query(`
            INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
            VALUES ($1, $2, $3, 'Pharmacy', $4, 'Waiting', NOW())
          `, [generateUUID(), qItem.encounter_id, patientId, qItem.priority]);

          // Set patient status
          await query("UPDATE zmc_patients SET status = 'Waiting for Pharmacy' WHERE id = $1", [patientId]);
          await query("UPDATE zmc_encounters SET clinical_status = 'Waiting for Pharmacy' WHERE id = $1", [qItem.encounter_id]);
        }

        // Cleanup any remaining waiting Cashier/Billing queue items for this patient or encounter
        await query(`
          UPDATE zmc_patient_queue
          SET status = 'Completed', processed_at = NOW(), processed_by = $1
          WHERE (patient_id = $2 OR (encounter_id IS NOT NULL AND encounter_id = $3))
            AND (queue_type LIKE 'Cashier%' OR queue_type LIKE '%Billing%' OR queue_type = 'Cashier Desk' OR queue_type = 'Emergency')
            AND (status = 'Waiting' OR status = 'Processing')
        `, [req.user?.username || 'Cashier', patientId, validEncounterId]);

        broadcastNotification({
          type: 'PATIENT_PAYMENT_COMPLETED',
          message: `Payment confirmed and collected for patient. Removed from billing queue.`,
          patientId
        });
        broadcastNotification({
          type: 'BILLING_QUEUE_UPDATED',
          message: `Billing queue updated.`,
          patientId
        });
      }

      res.status(201).json({
        success: true,
        data: {
          id: result.rows[0].id,
          patientId: result.rows[0].patient_id,
          invoiceId: result.rows[0].invoice_id,
          amount: parseFloat(result.rows[0].amount),
          status: result.rows[0].status,
          datePaid: result.rows[0].date_paid,
          paymentMethod: result.rows[0].payment_method,
          collectedBy: result.rows[0].collected_by
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Independent Revenue Verification & Audit Reconciliation endpoint
router.get('/revenue-verification', async (req, res) => {
  try {
    // 1. Total completed revenue
    const revenueRes = await query("SELECT SUM(amount) as total, COUNT(*) as count FROM zmc_payments WHERE status = 'Completed'");
    const totalRevenue = parseFloat(revenueRes.rows[0]?.total || '0');
    const totalTransactions = parseInt(revenueRes.rows[0]?.count || '0', 10);

    // 2. Breakdown by payment method
    const methodRes = await query(`
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM zmc_payments
      WHERE status = 'Completed'
      GROUP BY payment_method
      ORDER BY total DESC
    `);
    const paymentMethods = methodRes.rows.map(r => ({
      method: r.payment_method || 'Cash',
      count: parseInt(r.count, 10),
      total: parseFloat(r.total || '0')
    }));

    // 3. Breakdown by category / clinical service type
    const categoryRes = await query(`
      SELECT 
        CASE 
          WHEN inv.description ILIKE '%card%' OR inv.description ILIKE '%registration%' THEN 'Registration & Card Fees'
          WHEN inv.description ILIKE '%consult%' THEN 'Doctor Consultations'
          WHEN inv.description ILIKE '%lab%' THEN 'Laboratory Diagnostics'
          WHEN inv.description ILIKE '%pharmacy%' OR inv.description ILIKE '%drug%' OR inv.description ILIKE '%medication%' THEN 'Pharmacy & Dispensary'
          WHEN inv.description ILIKE '%admission%' OR inv.description ILIKE '%ward%' OR inv.description ILIKE '%bed%' THEN 'Inpatient Ward & Admissions'
          ELSE 'General Clinical Direct Services'
        END as category,
        COUNT(pay.id) as count,
        SUM(pay.amount) as total
      FROM zmc_payments pay
      LEFT JOIN zmc_invoices inv ON pay.invoice_id = inv.id
      WHERE pay.status = 'Completed'
      GROUP BY 1
      ORDER BY total DESC
    `);
    const categories = categoryRes.rows.map(r => ({
      category: r.category,
      count: parseInt(r.count, 10),
      total: parseFloat(r.total || '0')
    }));

    // 4. Detailed audit ledger of verified payments
    const ledgerRes = await query(`
      SELECT pay.*, p.name as patient_name, p.hospital_number, p.card_type, inv.description as invoice_desc
      FROM zmc_payments pay
      LEFT JOIN zmc_patients p ON pay.patient_id = p.id
      LEFT JOIN zmc_invoices inv ON pay.invoice_id = inv.id
      WHERE pay.status = 'Completed'
      ORDER BY pay.date_paid DESC
      LIMIT 150
    `);

    res.json({
      success: true,
      data: {
        verified: true,
        verificationTimestamp: new Date().toISOString(),
        auditorSystem: 'ZMC Cashier & Financial Ledger Reconciliation Engine',
        databaseEngine: 'PostgreSQL Active Journal',
        totalRevenue,
        totalTransactions,
        paymentMethods,
        categories,
        transactions: ledgerRes.rows.map(r => ({
          id: r.id,
          patientId: r.patient_id,
          patientName: r.patient_name || 'Outpatient / Walk-In',
          hospitalNumber: r.hospital_number || '—',
          cardType: r.card_type || 'Standard',
          amount: parseFloat(r.amount),
          paymentMethod: r.payment_method || 'Cash',
          status: r.status,
          datePaid: r.date_paid,
          collectedBy: r.collected_by || 'Cashier',
          description: r.invoice_desc || 'Clinical Service Payment'
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Read payments - all authenticated staff
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT pay.*, p.name as patient_name, p.hospital_number
      FROM zmc_payments pay
      LEFT JOIN zmc_patients p ON pay.patient_id = p.id
      ORDER BY pay.date_paid DESC
    `);
    res.json({
      success: true,
      data: result.rows.map(r => ({
        id: r.id,
        patientId: r.patient_id,
        patientName: r.patient_name || 'Outpatient',
        hospitalNumber: r.hospital_number || '—',
        invoiceId: r.invoice_id,
        amount: parseFloat(r.amount),
        status: r.status,
        datePaid: r.date_paid,
        paymentMethod: r.payment_method,
        collectedBy: r.collected_by
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- PAYMENT VITAE (DAILY EXPENSES PV) ENDPOINTS ---

// Fetch all Daily Expenses (PV)
router.get(
  '/vitae',
  authorizeRoles(['Cashier', 'Administrator', 'Management']) as any,
  async (req, res) => {
    try {
      const result = await query('SELECT * FROM zmc_payment_vitae ORDER BY created_at DESC');
      res.json({
        success: true,
        data: result.rows.map(r => ({
          id: r.id,
          personName: r.person_name,
          description: r.description,
          amount: parseFloat(r.amount),
          approvedByDoctor: r.approved_by_doctor,
          createdAt: r.created_at
        }))
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Record a new Daily Expense (PV)
router.post(
  '/vitae',
  authorizeRoles(['Cashier', 'Administrator', 'Management']) as any,
  async (req, res) => {
    try {
      const { personName, description, amount, approvedByDoctor } = req.body;
      if (!personName || !description || !amount || !approvedByDoctor) {
        return res.status(400).json({ success: false, error: 'Missing required PV fields.' });
      }
      const id = generateUUID();
      const result = await query(`
        INSERT INTO zmc_payment_vitae (id, person_name, description, amount, approved_by_doctor)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [id, personName, description, amount, approvedByDoctor]);

      res.status(201).json({
        success: true,
        data: {
          id: result.rows[0].id,
          personName: result.rows[0].person_name,
          description: result.rows[0].description,
          amount: parseFloat(result.rows[0].amount),
          approvedByDoctor: result.rows[0].approved_by_doctor,
          createdAt: result.rows[0].created_at
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// --- NO CHARGE RECORDS ENDPOINTS ---

// Fetch all No Charge Patient Logs
router.get(
  '/no-charge',
  authorizeRoles(['Cashier', 'Administrator', 'Management']) as any,
  async (req, res) => {
    try {
      const result = await query(`
        SELECT nc.*, p.name as patient_name, p.hospital_number
        FROM zmc_no_charge_records nc
        LEFT JOIN zmc_patients p ON nc.patient_id = p.id
        ORDER BY nc.created_at DESC
      `);
      res.json({
        success: true,
        data: result.rows.map(r => ({
          id: r.id,
          staffName: r.staff_name,
          relationship: r.relationship,
          patientId: r.patient_id,
          patientName: r.patient_name,
          hospitalNumber: r.hospital_number,
          treatmentCost: parseFloat(r.treatment_cost),
          treatmentDescription: r.treatment_description,
          approvedByDoctor: r.approved_by_doctor,
          createdAt: r.created_at
        }))
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Record a new No Charge Patient Treatment
router.post(
  '/no-charge',
  authorizeRoles(['Cashier', 'Administrator', 'Management']) as any,
  async (req, res) => {
    try {
      const { staffName, relationship, patientId, treatmentCost, treatmentDescription, approvedByDoctor } = req.body;
      if (!staffName || !relationship || !treatmentCost || !treatmentDescription || !approvedByDoctor) {
        return res.status(400).json({ success: false, error: 'Missing required No Charge fields.' });
      }
      const id = generateUUID();
      const result = await query(`
        INSERT INTO zmc_no_charge_records (id, staff_name, relationship, patient_id, treatment_cost, treatment_description, approved_by_doctor)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [id, staffName, relationship, patientId || null, treatmentCost, treatmentDescription, approvedByDoctor]);

      // If a patient is selected, optionally transition their queue status if any active cashier consultation is waiting
      if (patientId) {
        const consultQueueCheck = await query(`
          SELECT * FROM zmc_patient_queue
          WHERE patient_id = $1 AND queue_type = 'Cashier Consultation Payment' AND status = 'Waiting'
          LIMIT 1
        `, [patientId]);

        if (consultQueueCheck.rows.length > 0) {
          const qItem = consultQueueCheck.rows[0];
          await query(`
            UPDATE zmc_patient_queue
            SET status = 'Completed', processed_at = NOW(), processed_by = $1
            WHERE id = $2
          `, [(req as any).user?.username || 'Cashier', qItem.id]);

          await query(`
            UPDATE zmc_encounters
            SET clinical_status = 'Pending Consultation', payment_status = 'No Charge (Approved)'
            WHERE id = $1
          `, [qItem.encounter_id]);

          await query(`
            INSERT INTO zmc_patient_queue (id, encounter_id, patient_id, queue_type, priority, status, arrival_time)
            VALUES ($1, $2, $3, 'Doctor Consultation', $4, 'Waiting', NOW())
          `, [generateUUID(), qItem.encounter_id, patientId, qItem.priority]);

          await query("UPDATE zmc_patients SET status = 'Waiting for Doctor' WHERE id = $1", [patientId]);
        }
      }

      res.status(201).json({
        success: true,
        data: {
          id: result.rows[0].id,
          staffName: result.rows[0].staff_name,
          relationship: result.rows[0].relationship,
          patientId: result.rows[0].patient_id,
          treatmentCost: parseFloat(result.rows[0].treatment_cost),
          treatmentDescription: result.rows[0].treatment_description,
          approvedByDoctor: result.rows[0].approved_by_doctor,
          createdAt: result.rows[0].created_at
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Get all permanent lab payment records from database
router.get(
  '/lab-history',
  authorizeRoles(['Cashier', 'Account Officer', 'Administrator', 'IT Administrator', 'Management', 'Laboratory', 'Laboratory Scientist', 'Lab Technician', 'Scientist']) as any,
  async (req: any, res: any) => {
    try {
      const result = await query(`
        SELECT lp.*, COALESCE(p.name, lp.patient_name) as patient_name, COALESCE(p.hospital_number, lp.hospital_number) as hospital_number, COALESCE(p.card_type, lp.card_type) as card_type
        FROM zmc_lab_payments lp
        LEFT JOIN zmc_patients p ON p.id = lp.patient_id
        ORDER BY lp.date_paid DESC
        LIMIT 300
      `);
      return res.json({ success: true, data: result.rows });
    } catch (error: any) {
      console.error('Error fetching lab payment history:', error);
      return res.status(500).json({ success: false, error: 'Failed to fetch lab payment history' });
    }
  }
);

// Get all active outstanding balance records across hospital
router.get(
  '/outstanding',
  async (req: any, res: any) => {
    try {
      const result = await query(`
        SELECT ob.*, 
          COALESCE(p.name, ob.patient_name) as patient_name, 
          COALESCE(p.hospital_number, ob.hospital_number) as hospital_number,
          p.phone_number, p.card_type,
          COALESCE(
            ob.department,
            CASE 
              WHEN LOWER(ob.purpose) LIKE '%lab%' THEN 'Laboratory'
              WHEN LOWER(ob.purpose) LIKE '%pharm%' OR LOWER(ob.purpose) LIKE '%drug%' THEN 'Pharmacy'
              WHEN LOWER(ob.purpose) LIKE '%eye%' OR LOWER(ob.purpose) LIKE '%opt%' THEN 'Eye Clinic'
              WHEN LOWER(ob.purpose) LIKE '%ward%' OR LOWER(ob.purpose) LIKE '%admiss%' OR LOWER(ob.purpose) LIKE '%bed%' THEN 'Inpatient Ward'
              WHEN LOWER(ob.purpose) LIKE '%card%' OR LOWER(ob.purpose) LIKE '%reg%' THEN 'OPD Reception'
              ELSE 'Consultation / OPD'
            END
          ) as department_owed,
          COALESCE(
            (
              SELECT date_paid 
              FROM zmc_payments 
              WHERE patient_id = ob.patient_id 
                AND (invoice_id = ob.invoice_id OR encounter_id = ob.encounter_id)
              ORDER BY date_paid DESC 
              LIMIT 1
            ),
            (
              SELECT date_paid 
              FROM zmc_payments 
              WHERE patient_id = ob.patient_id 
              ORDER BY date_paid DESC 
              LIMIT 1
            ),
            ob.updated_at,
            ob.created_at
          ) as last_payment_date
        FROM zmc_outstanding_balances ob
        LEFT JOIN zmc_patients p ON p.id = ob.patient_id
        WHERE ob.status = 'Owing' AND ob.balance > 0
        ORDER BY ob.created_at DESC
      `);
      res.json({ success: true, data: result.rows });
    } catch (err: any) {
      console.error('Error fetching outstanding balances:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Get outstanding balance for a specific patient
router.get(
  '/outstanding/patient/:patientId',
  async (req: any, res: any) => {
    try {
      const { patientId } = req.params;
      const result = await query(`
        SELECT ob.*, 
          COALESCE(p.name, ob.patient_name) as patient_name, 
          COALESCE(p.hospital_number, ob.hospital_number) as hospital_number
        FROM zmc_outstanding_balances ob
        LEFT JOIN zmc_patients p ON p.id = ob.patient_id
        WHERE ob.patient_id = $1 AND ob.status = 'Owing' AND ob.balance > 0
        ORDER BY ob.created_at DESC
      `, [patientId]);
      
      const patientRes = await query('SELECT outstanding_balance FROM zmc_patients WHERE id = $1', [patientId]);
      const totalOwing = patientRes.rows[0]?.outstanding_balance || 0;

      res.json({ success: true, data: result.rows, totalOwing: parseFloat(totalOwing) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Settle or clear an outstanding balance - Cashier Only
router.post(
  '/outstanding/settle',
  authorizeRoles(['Cashier', 'Administrator', 'Management']) as any,
  async (req: any, res: any) => {
    try {
      const { id, patientId, paymentAmount, paymentMethod } = req.body;
      if (!id || !patientId || !paymentAmount) {
        return res.status(400).json({ success: false, error: 'id, patientId and paymentAmount are required' });
      }

      const checkOb = await query('SELECT * FROM zmc_outstanding_balances WHERE id = $1', [id]);
      if (checkOb.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Outstanding balance record not found' });
      }

      const record = checkOb.rows[0];
      const currentBalance = parseFloat(record.balance);
      const paid = parseFloat(paymentAmount);
      const newAmountPaid = parseFloat(record.amount_paid) + paid;
      const newBalance = Math.max(0, currentBalance - paid);
      const cashierName = req.user?.username || 'Cashier';

      const { validEncounterId, validInvoiceId } = await sanitizeEncounterAndInvoice(record.encounter_id, record.invoice_id);

      if (newBalance <= 0) {
        await query(`
          UPDATE zmc_outstanding_balances
          SET amount_paid = $1, balance = 0, status = 'Settled', cleared_by = $2, cleared_at = NOW(), updated_at = NOW()
          WHERE id = $3
        `, [newAmountPaid, cashierName, id]);
      } else {
        await query(`
          UPDATE zmc_outstanding_balances
          SET amount_paid = $1, balance = $2, updated_at = NOW()
          WHERE id = $3
        `, [newAmountPaid, newBalance, id]);
      }

      // Log payment record
      await query(`
        INSERT INTO zmc_payments (id, patient_id, encounter_id, invoice_id, amount, total_bill, balance, status, date_paid, payment_method, collected_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Completed', NOW(), $8, $9)
      `, [generateUUID(), patientId, validEncounterId, validInvoiceId, paid, record.total_bill, newBalance, paymentMethod || 'Cash', cashierName]);

      // Recalculate patient outstanding balance
      const sumRes = await query(`
        SELECT COALESCE(SUM(balance), 0) as remaining_total
        FROM zmc_outstanding_balances
        WHERE patient_id = $1 AND status = 'Owing'
      `, [patientId]);
      const remainingTotal = parseFloat(sumRes.rows[0].remaining_total || '0');

      await query('UPDATE zmc_patients SET outstanding_balance = $1 WHERE id = $2', [remainingTotal, patientId]);

      // Broadcast notification
      const patRes = await query('SELECT name FROM zmc_patients WHERE id = $1', [patientId]);
      const patName = patRes.rows[0]?.name || 'Patient';

      broadcastNotification({
        type: 'OUTSTANDING_BALANCE_SETTLED',
        message: `Outstanding payment of N${paid.toLocaleString()} settled for ${patName} by Cashier. Remaining balance: N${remainingTotal.toLocaleString()}`,
        patientId
      });

      res.json({
        success: true,
        message: newBalance <= 0 ? 'Outstanding balance cleared successfully!' : 'Partial payment applied to outstanding balance.',
        remainingBalance: newBalance,
        totalPatientBalance: remainingTotal
      });
    } catch (err: any) {
      console.error('Error settling outstanding balance:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Record partial payment or register outstanding balance during checkout/registration
router.post(
  '/partial',
  authorizeRoles(['Cashier', 'Receptionist', 'Records Officer', 'Administrator', 'Management']) as any,
  async (req: any, res: any) => {
    try {
      const { patientId, encounterId, invoiceId, totalBill, amountPaid, paymentMethod, purpose } = req.body;
      if (!patientId || totalBill === undefined || amountPaid === undefined) {
        return res.status(400).json({ success: false, error: 'patientId, totalBill, and amountPaid are required' });
      }

      // Verify patient exists
      const patRes = await query('SELECT name, hospital_number FROM zmc_patients WHERE id = $1', [patientId]);
      if (patRes.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Patient record not found' });
      }
      const pat = patRes.rows[0] || {};

      const total = parseFloat(totalBill);
      const paid = parseFloat(amountPaid);
      const balance = Math.max(0, total - paid);
      const cashierName = req.user?.username || 'Cashier';

      const { validEncounterId, validInvoiceId } = await sanitizeEncounterAndInvoice(encounterId, invoiceId);

      // Record payment entry
      const payId = generateUUID();
      await query(`
        INSERT INTO zmc_payments (id, patient_id, encounter_id, invoice_id, amount, total_bill, balance, status, date_paid, payment_method, collected_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'Completed', NOW(), $8, $9)
      `, [payId, patientId, validEncounterId, validInvoiceId, paid, total, balance, paymentMethod || 'Cash', cashierName]);

      // If balance > 0, log outstanding balance
      if (balance > 0) {
        const dept = req.body.department || (
          purpose?.toLowerCase().includes('lab') ? 'Laboratory' :
          purpose?.toLowerCase().includes('pharm') ? 'Pharmacy' :
          purpose?.toLowerCase().includes('eye') ? 'Eye Clinic' :
          purpose?.toLowerCase().includes('emergency') ? 'Emergency Desk' : 'OPD Reception'
        );

        await query(`
          INSERT INTO zmc_outstanding_balances (id, patient_id, patient_name, hospital_number, encounter_id, invoice_id, purpose, department, total_bill, amount_paid, balance, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'Owing', NOW(), NOW())
        `, [generateUUID(), patientId, pat.name || 'Outpatient', pat.hospital_number || '—', validEncounterId, validInvoiceId, purpose || 'Hospital Registration / Services', dept, total, paid, balance]);

        // Update patient overall outstanding balance
        const sumRes = await query(`
          SELECT COALESCE(SUM(balance), 0) as remaining_total
          FROM zmc_outstanding_balances
          WHERE patient_id = $1 AND status = 'Owing'
        `, [patientId]);
        const remainingTotal = parseFloat(sumRes.rows[0].remaining_total || '0');

        await query('UPDATE zmc_patients SET outstanding_balance = $1 WHERE id = $2', [remainingTotal, patientId]);
      }

      if (balance <= 0) {
        await query(`UPDATE zmc_invoices SET status = 'Paid' WHERE patient_id = $1 OR (id IS NOT NULL AND id = $2)`, [patientId, validInvoiceId]);
      } else {
        await query(`UPDATE zmc_invoices SET status = 'Paid' WHERE patient_id = $1 OR (id IS NOT NULL AND id = $2)`, [patientId, validInvoiceId]);
      }

      // Complete active Cashier/Billing queue items for this patient
      await query(`
        UPDATE zmc_patient_queue
        SET status = 'Completed', processed_at = NOW(), processed_by = $1
        WHERE (patient_id = $2 OR (encounter_id IS NOT NULL AND encounter_id = $3))
          AND (queue_type LIKE 'Cashier%' OR queue_type LIKE '%Billing%' OR queue_type = 'Cashier Desk' OR queue_type = 'Emergency')
          AND (status = 'Waiting' OR status = 'Processing')
      `, [cashierName, patientId, validEncounterId]);

      broadcastNotification({
        type: 'PATIENT_PAYMENT_COMPLETED',
        message: `Payment collected for patient. Removed from billing queue.`,
        patientId
      });
      broadcastNotification({
        type: 'BILLING_QUEUE_UPDATED',
        message: `Billing queue updated.`,
        patientId
      });

      res.json({
        success: true,
        message: balance > 0 ? `Partial payment of N${paid.toLocaleString()} recorded. N${balance.toLocaleString()} pending balance logged.` : 'Payment collected in full!',
        balance
      });
    } catch (err: any) {
      console.error('Error recording partial payment:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Submit a discount request (Cashier or Receptionist) -> Requires HR Approval
router.post(
  '/discount-request',
  authorizeRoles(['Cashier', 'Receptionist', 'Records Officer', 'Administrator', 'Management', 'Doctor', 'Nurse']) as any,
  async (req: any, res: any) => {
    try {
      const {
        patientId,
        patientName,
        hospitalNumber,
        invoiceId,
        encounterId,
        originalAmount,
        discountType,
        discountValue,
        reason
      } = req.body;

      if (!patientId || !patientName || originalAmount === undefined || !discountType || discountValue === undefined || !reason) {
        return res.status(400).json({ success: false, error: 'All fields including discountType, discountValue, and reason are required' });
      }

      const origAmt = parseFloat(originalAmount);
      const val = parseFloat(discountValue);
      let calculatedDiscount = 0;

      if (discountType === 'Percentage') {
        calculatedDiscount = (origAmt * val) / 100;
      } else {
        calculatedDiscount = val;
      }

      const finalAmount = Math.max(0, origAmt - calculatedDiscount);
      const reqId = generateUUID();
      const requestedBy = req.user?.name || req.user?.username || 'Cashier';

      await query(`
        INSERT INTO zmc_discount_requests (
          id, patient_id, patient_name, hospital_number, invoice_id, encounter_id,
          original_amount, discount_type, discount_value, calculated_discount, final_amount,
          reason, status, requested_by, requested_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'Pending', $13, NOW())
      `, [
        reqId, patientId, patientName, hospitalNumber || '—', invoiceId || null, encounterId || null,
        origAmt, discountType, val, calculatedDiscount, finalAmount,
        reason, requestedBy
      ]);

      // Broadcast notification to HR / Management / Admin
      broadcastNotification({
        type: 'DISCOUNT_REQUEST_SUBMITTED',
        targetRole: 'Human Resources',
        message: `New discount request submitted for ${patientName} (${discountType === 'Percentage' ? `${val}%` : `₦${val.toLocaleString()}`}). Reason: ${reason}. HR approval required.`,
        patientId
      });

      broadcastNotification({
        type: 'DISCOUNT_REQUEST_SUBMITTED',
        targetRole: 'Management',
        message: `New discount request submitted for ${patientName} by ${requestedBy}. HR approval required.`,
        patientId
      });

      res.json({
        success: true,
        message: 'Discount request submitted successfully! HR approval is now required.',
        discountRequestId: reqId,
        calculatedDiscount,
        finalAmount
      });
    } catch (err: any) {
      console.error('Error submitting discount request:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// Get discount requests (all authenticated roles)
router.get(
  '/discount-requests',
  async (req: any, res: any) => {
    try {
      const result = await query(`
        SELECT * FROM zmc_discount_requests
        ORDER BY requested_at DESC
      `);
      res.json({
        success: true,
        discountRequests: result.rows
      });
    } catch (err: any) {
      console.error('Error fetching discount requests:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// HR / Admin Approve Discount Request
router.post(
  '/discount-requests/:id/approve',
  authorizeRoles(['Human Resources', 'Administrator', 'Management', 'Human Resource Manager', 'Cashier']) as any,
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const approverName = req.user?.name || req.user?.username || 'HR Manager';

      const check = await query('SELECT * FROM zmc_discount_requests WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Discount request not found' });
      }

      const discReq = check.rows[0];
      await query(`
        UPDATE zmc_discount_requests
        SET status = 'Approved', approved_by = $1, approved_at = NOW()
        WHERE id = $2
      `, [approverName, id]);

      // If there's a matching invoice, update invoice amount
      if (discReq.invoice_id) {
        await query(`
          UPDATE zmc_invoices
          SET amount = $1
          WHERE id = $2
        `, [discReq.final_amount, discReq.invoice_id]);
      }

      // Broadcast notification to Cashier
      broadcastNotification({
        type: 'DISCOUNT_APPROVED',
        targetRole: 'Cashier',
        message: `Discount approved by HR for ${discReq.patient_name}! New payable bill: ₦${parseFloat(discReq.final_amount).toLocaleString()}.`,
        patientId: discReq.patient_id
      });

      res.json({
        success: true,
        message: `Discount request for ${discReq.patient_name} approved by HR!`,
        finalAmount: discReq.final_amount
      });
    } catch (err: any) {
      console.error('Error approving discount request:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// HR / Admin Reject Discount Request
router.post(
  '/discount-requests/:id/reject',
  authorizeRoles(['Human Resources', 'Administrator', 'Management', 'Human Resource Manager', 'Cashier']) as any,
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const approverName = req.user?.name || req.user?.username || 'HR Manager';

      const check = await query('SELECT * FROM zmc_discount_requests WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Discount request not found' });
      }

      const discReq = check.rows[0];
      await query(`
        UPDATE zmc_discount_requests
        SET status = 'Rejected', approved_by = $1, approved_at = NOW(), rejection_reason = $2
        WHERE id = $3
      `, [approverName, rejectionReason || 'Not approved', id]);

      // Broadcast notification to Cashier
      broadcastNotification({
        type: 'DISCOUNT_REJECTED',
        targetRole: 'Cashier',
        message: `Discount request rejected by HR for ${discReq.patient_name}. Reason: ${rejectionReason || 'No reason specified'}.`,
        patientId: discReq.patient_id
      });

      res.json({
        success: true,
        message: `Discount request for ${discReq.patient_name} rejected.`
      });
    } catch (err: any) {
      console.error('Error rejecting discount request:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

export default router;
