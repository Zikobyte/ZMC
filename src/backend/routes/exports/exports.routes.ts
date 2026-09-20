import { Router, Response } from 'express';
import { query, generateUUID } from '../../database/db.repo';
import { authenticateJWT, AuthenticatedRequest } from '../../middleware/auth.middleware';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, BorderStyle, WidthType } from 'docx';
import { jsPDF } from 'jspdf';

const router = Router();

router.use(authenticateJWT as any);

// Define Helper: Audit Log Recorder
async function logExport(req: AuthenticatedRequest, type: string, format: string, reference: string, details: string) {
  try {
    const userId = req.user?.id || 'unknown';
    const userName = req.user?.username || 'unknown';
    const userRole = req.user?.role || 'unknown';
    await query(`
      INSERT INTO zmc_audit_logs (id, user_id, user_name, user_role, action, details)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      generateUUID(),
      userId,
      userName,
      userRole,
      'DATA_EXPORT',
      `Export: ${type} as ${format.toUpperCase()}. Ref: ${reference}. Details: ${details}`
    ]);
  } catch (err) {
    console.error('Failed to log export audit:', err);
  }
}

// Check role permission
function checkExportPermission(role: string, type: string): boolean {
  if (!role) return false;
  const normalizedRole = role.trim().toLowerCase();
  const adminRoles = ['administrator', 'it administrator', 'management', 'super admin', 'admin', 'medical director', 'chief medical director'];
  if (adminRoles.includes(normalizedRole)) return true;

  if (type === 'patients' || type === 'card-replacements') {
    return ['receptionist', 'records officer', 'nurse', 'doctor', 'opd clerk', 'staff'].includes(normalizedRole);
  }
  if (type === 'financials' || type === 'invoice' || type === 'receipt') {
    return ['cashier', 'accountant', 'records officer'].includes(normalizedRole);
  }
  if (type === 'medical-records' || type === 'consultations') {
    return ['doctor', 'nurse', 'records officer', 'receptionist', 'opd clerk', 'pharmacist', 'lab scientist', 'staff'].includes(normalizedRole);
  }
  if (type === 'audit-logs') {
    return false; // Only adminRoles can export audit logs
  }
  return true;
}

// -------------------------------------------------------------
// MAIN EXPORT ENDPOINT
// -------------------------------------------------------------
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type, format, patientId, invoiceId, paymentId, search, status, startDate, endDate } = req.query as any;

    if (!type || !format) {
      res.status(400).json({ success: false, error: 'Export type and format (excel, word, pdf) are required.' });
      return;
    }

    const userRole = req.user?.role || '';
    if (!checkExportPermission(userRole, type)) {
      res.status(403).json({ success: false, error: 'Unauthorized: Your role does not have permission to export this data.' });
      return;
    }

    const formatLower = format.toLowerCase();
    if (!['excel', 'word', 'pdf'].includes(formatLower)) {
      res.status(400).json({ success: false, error: 'Unsupported format. Use excel, word, or pdf.' });
      return;
    }

    // 1. FETCH DATA BASED ON TYPE & FILTERS
    let dataRows: any[] = [];
    let title = 'Report';
    let reference = 'N/A';
    let extraInfo: Record<string, any> = {};

    if (type === 'patients') {
      let q = 'SELECT * FROM zmc_patients';
      const params: any[] = [];
      const conds: string[] = [];

      if (search) {
        params.push(`%${search}%`);
        conds.push(`(name ILIKE $${params.length} OR hospital_number ILIKE $${params.length} OR phone_number ILIKE $${params.length})`);
      }
      if (status) {
        params.push(status);
        conds.push(`status = $${params.length}`);
      }
      if (startDate) {
        params.push(startDate);
        conds.push(`registration_date >= $${params.length}`);
      }
      if (endDate) {
        params.push(endDate);
        conds.push(`registration_date <= $${params.length}`);
      }

      if (conds.length > 0) {
        q += ' WHERE ' + conds.join(' AND ');
      }
      q += ' ORDER BY registration_date DESC';

      const dbRes = await query(q, params);
      dataRows = dbRes.rows;
      title = 'Patient Registry Database Report';
      reference = `FILTERS-${search || 'None'}-${status || 'All'}`;

    } else if (type === 'financials') {
      let q = `
        SELECT p.*, pat.name as patient_name, pat.hospital_number, inv.description as invoice_desc
        FROM zmc_payments p
        JOIN zmc_patients pat ON p.patient_id = pat.id
        LEFT JOIN zmc_invoices inv ON p.invoice_id = inv.id
      `;
      const params: any[] = [];
      const conds: string[] = [];

      if (startDate) {
        params.push(startDate);
        conds.push(`p.date_paid >= $${params.length}`);
      }
      if (endDate) {
        params.push(endDate);
        conds.push(`p.date_paid <= $${params.length}`);
      }
      if (status) {
        params.push(status);
        conds.push(`p.status = $${params.length}`);
      }

      if (conds.length > 0) {
        q += ' WHERE ' + conds.join(' AND ');
      }
      q += ' ORDER BY p.date_paid DESC';

      const dbRes = await query(q, params);
      dataRows = dbRes.rows;
      title = 'Financial Payments & Income Report';
      reference = `FIN-${startDate || 'Start'}-to-${endDate || 'End'}`;

    } else if (type === 'medical-records') {
      if (!patientId) {
        res.status(400).json({ success: false, error: 'Patient ID is required for medical records export.' });
        return;
      }
      const patRes = await query('SELECT * FROM zmc_patients WHERE id = $1 OR hospital_number = $1 LIMIT 1', [patientId]);
      let patient = patRes.rows[0];
      
      if (!patient) {
        // Fallback for admitted demo patient IDs
        patient = {
          id: patientId,
          hospital_number: patientId,
          name: patientId.startsWith('MAT') ? 'Adaeze Onyema' : patientId.startsWith('ADM-5001') ? 'Victor Okoye' : patientId.startsWith('ADM-5002') ? 'Blessing Nwosu' : 'Admitted Inpatient',
          gender: patientId.startsWith('MAT') || patientId.startsWith('ADM-5002') ? 'Female' : 'Male',
          date_of_birth: '1995-04-04',
          phone_number: '+234 803 000 1122',
          address: 'Enugu, Nigeria',
          status: 'Admitted',
          registration_date: new Date().toISOString()
        };
      }
      
      const realId = patient.id;
      const hospNum = patient.hospital_number || realId;
      extraInfo.patient = patient;
      reference = hospNum;
      title = `Hospital Management System (HMS) Record - ${patient.name}`;

      // Fetch admissions
      try {
        const admRes = await query(`
          SELECT * FROM zmc_admissions 
          WHERE patient_id = $1 OR patient_id = $2 
          ORDER BY admitted_date DESC
        `, [realId, hospNum]);
        extraInfo.admissions = admRes.rows;
      } catch (e) {
        extraInfo.admissions = [];
      }

      // Fetch consultations
      try {
        const consults = await query(`
          SELECT c.*, u.name as doctor_name 
          FROM zmc_consultations c 
          LEFT JOIN zmc_users u ON c.doctor_id = u.id 
          WHERE c.patient_id = $1 OR c.patient_id = $2
          ORDER BY c.date DESC
        `, [realId, hospNum]);
        extraInfo.consultations = consults.rows;
      } catch (e) {
        extraInfo.consultations = [];
      }

      // Fetch vital signs logs
      try {
        const vitals = await query(`
          SELECT * FROM zmc_patient_vitals 
          WHERE patient_id = $1 OR patient_id = $2 
          ORDER BY recorded_at DESC
        `, [realId, hospNum]);
        extraInfo.vitals = vitals.rows;
      } catch (e) {
        extraInfo.vitals = [];
      }

      // Fetch prescriptions / pharmacy orders
      try {
        const meds = await query(`
          SELECT * FROM zmc_pharmacy_orders 
          WHERE patient_id = $1 OR patient_id = $2 
          ORDER BY date_ordered DESC
        `, [realId, hospNum]);
        extraInfo.medications = meds.rows;
      } catch (e) {
        extraInfo.medications = [];
      }

      // Fetch lab tests
      try {
        const labs = await query(`
          SELECT * FROM zmc_laboratory_orders 
          WHERE patient_id = $1 OR patient_id = $2 
          ORDER BY date_ordered DESC
        `, [realId, hospNum]);
        extraInfo.labs = labs.rows;
      } catch (e) {
        extraInfo.labs = [];
      }

      // Fetch invoices / charges
      try {
        const inv = await query(`
          SELECT * FROM zmc_invoices 
          WHERE patient_id = $1 OR patient_id = $2 
          ORDER BY date_issued DESC
        `, [realId, hospNum]);
        extraInfo.invoices = inv.rows;
      } catch (e) {
        extraInfo.invoices = [];
      }

    } else if (type === 'invoice') {
      if (!invoiceId) {
        res.status(400).json({ success: false, error: 'Invoice ID is required for invoice export.' });
        return;
      }
      const invRes = await query(`
        SELECT i.*, p.name as patient_name, p.hospital_number, p.phone_number
        FROM zmc_invoices i
        JOIN zmc_patients p ON i.patient_id = p.id
        WHERE i.id = $1
      `, [invoiceId]);
      if (invRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Invoice not found.' });
        return;
      }
      const invoice = invRes.rows[0];
      extraInfo.invoice = invoice;
      reference = invoiceId;
      title = `Patient Billing Invoice - ${invoice.patient_name}`;

    } else if (type === 'receipt') {
      if (!paymentId) {
        res.status(400).json({ success: false, error: 'Payment ID is required for receipt export.' });
        return;
      }
      const payRes = await query(`
        SELECT pay.*, p.name as patient_name, p.hospital_number, inv.id as invoice_id, inv.description as invoice_desc
        FROM zmc_payments pay
        JOIN zmc_patients p ON pay.patient_id = p.id
        LEFT JOIN zmc_invoices inv ON pay.invoice_id = inv.id
        WHERE pay.id = $1
      `, [paymentId]);
      if (payRes.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Receipt not found.' });
        return;
      }
      const payment = payRes.rows[0];
      extraInfo.payment = payment;
      reference = paymentId;
      title = `Official Income Receipt - ${payment.patient_name}`;

    } else if (type === 'audit-logs') {
      const dbRes = await query('SELECT * FROM zmc_audit_logs ORDER BY timestamp DESC LIMIT 500');
      dataRows = dbRes.rows;
      title = 'System Activity Security Audit Log';
      reference = 'AUDIT';
    }

    // 2. CHECK EMPTY SETS
    if (dataRows.length === 0 && !extraInfo.patient && !extraInfo.invoice && !extraInfo.payment) {
      res.status(400).json({ success: false, error: 'There is no information available to export for the selected filters.' });
      return;
    }

    // 3. GENERATE BINARY FILE RESPONSES BY FORMAT
    const currentDateStr = new Date().toISOString().split('T')[0];
    const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50);
    const fileName = `${sanitizedTitle}-${currentDateStr}.${formatLower === 'excel' ? 'xlsx' : formatLower === 'word' ? 'docx' : 'pdf'}`;

    if (formatLower === 'excel') {
      // EXCEL GENERATION
      const wb = XLSX.utils.book_new();

      if (type === 'patients') {
        const formatted = dataRows.map(p => ({
          'Hospital Number': p.hospital_number,
          'Full Name': p.name,
          'Gender': p.gender,
          'Date of Birth': p.date_of_birth ? p.date_of_birth.split('T')[0] : 'N/A',
          'Phone Number': p.phone_number || 'N/A',
          'Amount Paid (₦)': parseFloat(p.card_fee || p.amount_paid || 3000),
          'Amount Paid': `₦${parseFloat(p.card_fee || p.amount_paid || 3000).toLocaleString()}`,
          'Email': p.email || 'N/A',
          'Marital Status': p.marital_status || 'Single',
          'Card Type': p.card_type,
          'Current Status': p.status,
          'Registered By': p.registered_by || 'Staff',
          'Registration Date': p.registration_date ? p.registration_date.split('T')[0] : 'N/A'
        }));
        const ws = XLSX.utils.json_to_sheet(formatted);
        ws['!cols'] = [ {wch: 15}, {wch: 25}, {wch: 10}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 25}, {wch: 12}, {wch: 12}, {wch: 20}, {wch: 15}, {wch: 15} ];
        XLSX.utils.book_append_sheet(wb, ws, 'Patients Registry');

      } else if (type === 'financials') {
        const formatted = dataRows.map(p => ({
          'Payment ID': p.id,
          'Patient Name': p.patient_name,
          'Hospital Number': p.hospital_number,
          'Amount Paid (₦)': parseFloat(p.amount || 0),
          'Payment Method': p.payment_method,
          'Collection Date': p.date_paid ? p.date_paid.replace('T', ' ').substring(0, 19) : 'N/A',
          'Status': p.status,
          'Description/Details': p.invoice_desc || 'General Card Fee'
        }));
        const ws = XLSX.utils.json_to_sheet(formatted);
        ws['!cols'] = [ {wch: 36}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 12}, {wch: 35} ];
        XLSX.utils.book_append_sheet(wb, ws, 'Financial History');

      } else if (type === 'medical-records') {
        const p = extraInfo.patient;
        // Profile Sheet
        const wsProfile = XLSX.utils.json_to_sheet([{
          'Hospital Number': p.hospital_number || p.id,
          'Patient Name': p.name,
          'Gender': p.gender || 'N/A',
          'DOB': p.date_of_birth ? p.date_of_birth.split('T')[0] : 'N/A',
          'Phone': p.phone_number || 'N/A',
          'Address': p.address || 'N/A',
          'Current Status': p.status || 'Active',
          'Registration Date': p.registration_date ? p.registration_date.split('T')[0] : 'N/A',
        }]);
        wsProfile['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsProfile, 'Patient Profile');

        // Consultations Sheet
        const consultsData = (extraInfo.consultations && extraInfo.consultations.length > 0)
          ? extraInfo.consultations.map((c: any) => ({
              'Doctor': c.doctor_name || 'Medical Officer',
              'Date': c.date ? c.date.substring(0, 10) : (c.created_at ? c.created_at.substring(0, 10) : 'N/A'),
              'Chief Complaint': c.chief_complaint || 'None',
              'Diagnosis': c.diagnosis || c.diagnoses || 'None Listed',
              'Treatment Plan / Notes': c.treatment_plan || c.notes || 'None',
              'Prescriptions': typeof c.prescriptions === 'string' ? c.prescriptions : JSON.stringify(c.prescriptions || 'None')
            }))
          : [{ 'Doctor': 'N/A', 'Date': 'N/A', 'Chief Complaint': 'No recorded consultations', 'Diagnosis': 'None', 'Treatment Plan / Notes': 'None', 'Prescriptions': 'None' }];
        const wsConsults = XLSX.utils.json_to_sheet(consultsData);
        wsConsults['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 25 }, { wch: 35 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, wsConsults, 'Doctor Consultations');

        // Vitals Sheet
        const vitalsData = (extraInfo.vitals && extraInfo.vitals.length > 0)
          ? extraInfo.vitals.map((v: any) => ({
              'Recorded Date': v.recorded_at ? v.recorded_at.substring(0, 10) : (v.checked_at ? v.checked_at.substring(0, 10) : 'N/A'),
              'BP': v.blood_pressure || 'N/A',
              'Temp (°C)': parseFloat(v.temperature || 0),
              'Pulse (bpm)': parseInt(v.pulse_rate || 0),
              'Resp (bpm)': parseInt(v.respiratory_rate || 0),
              'SPO2 (%)': parseInt(v.spo2 || 0),
              'Weight (kg)': parseFloat(v.weight || 0),
              'Height (cm)': parseFloat(v.height || 0)
            }))
          : [{ 'Recorded Date': 'N/A', 'BP': 'N/A', 'Temp (°C)': 0, 'Pulse (bpm)': 0, 'Resp (bpm)': 0, 'SPO2 (%)': 0, 'Weight (kg)': 0, 'Height (cm)': 0 }];
        const wsVitals = XLSX.utils.json_to_sheet(vitalsData);
        wsVitals['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, wsVitals, 'Vitals Logs');

        // Prescriptions Sheet
        const medsData = (extraInfo.medications && extraInfo.medications.length > 0)
          ? extraInfo.medications.map((m: any) => ({
              'Medication': m.medication_name || m.name || 'Drug',
              'Dosage': m.dosage || m.dose || 'Standard',
              'Frequency': m.frequency || 'N/A',
              'Duration': m.duration || 'N/A',
              'Status': m.status || 'Ordered',
              'Date Ordered': m.date_ordered ? m.date_ordered.substring(0, 10) : 'N/A'
            }))
          : [{ 'Medication': 'No pharmacy orders recorded', 'Dosage': 'N/A', 'Frequency': 'N/A', 'Duration': 'N/A', 'Status': 'N/A', 'Date Ordered': 'N/A' }];
        const wsMeds = XLSX.utils.json_to_sheet(medsData);
        wsMeds['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsMeds, 'Pharmacy Medications');

        // Lab Tests Sheet
        const labsData = (extraInfo.labs && extraInfo.labs.length > 0)
          ? extraInfo.labs.map((l: any) => ({
              'Test Name': l.test_name || l.name || 'Lab Test',
              'Category': l.category || 'Laboratory',
              'Status': l.status || 'Ordered',
              'Result': l.results || l.result || 'Pending',
              'Date Ordered': l.date_ordered ? l.date_ordered.substring(0, 10) : 'N/A'
            }))
          : [{ 'Test Name': 'No laboratory orders recorded', 'Category': 'N/A', 'Status': 'N/A', 'Result': 'N/A', 'Date Ordered': 'N/A' }];
        const wsLabs = XLSX.utils.json_to_sheet(labsData);
        wsLabs['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsLabs, 'Laboratory Tests');

      } else if (type === 'audit-logs') {
        const formatted = dataRows.map(a => ({
          'Log ID': a.id,
          'Timestamp': a.timestamp ? a.timestamp.replace('T', ' ').substring(0, 19) : 'N/A',
          'User ID': a.user_id,
          'User Name': a.user_name,
          'User Role': a.user_role,
          'Action Type': a.action,
          'Detailed Logs Description': a.details
        }));
        const ws = XLSX.utils.json_to_sheet(formatted);
        ws['!cols'] = [ {wch: 36}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 20}, {wch: 60} ];
        XLSX.utils.book_append_sheet(wb, ws, 'System Audit Logs');

      } else {
        // Fallback for single records (Invoice/Receipt) in Excel
        const items = type === 'invoice' ? [extraInfo.invoice] : [extraInfo.payment];
        const ws = XLSX.utils.json_to_sheet(items);
        XLSX.utils.book_append_sheet(wb, ws, 'Details');
      }

      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      await logExport(req, type, 'excel', reference, `Successfully generated ${fileName}`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(excelBuffer);

    } else if (formatLower === 'word') {
      // WORD GENERATION
      let sections: any[] = [];

      if (type === 'patients') {
        const headerRow = new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Hospital No', bold: true, color: 'FFFFFF' })] })], shading: { fill: '2A758C' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Patient Name', bold: true, color: 'FFFFFF' })] })], shading: { fill: '2A758C' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Gender', bold: true, color: 'FFFFFF' })] })], shading: { fill: '2A758C' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Phone Number', bold: true, color: 'FFFFFF' })] })], shading: { fill: '2A758C' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount Paid', bold: true, color: 'FFFFFF' })] })], shading: { fill: '2A758C' } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF' })] })], shading: { fill: '2A758C' } }),
          ]
        });

        const rows = dataRows.map(p => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(p.hospital_number)] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: p.name, bold: true })] })] }),
            new TableCell({ children: [new Paragraph(p.gender)] }),
            new TableCell({ children: [new Paragraph(p.phone_number || 'N/A')] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `₦${parseFloat(p.card_fee || p.amount_paid || 3000).toLocaleString()}`, bold: true })] })] }),
            new TableCell({ children: [new Paragraph(p.status)] }),
          ]
        }));

        const table = new Table({
          rows: [headerRow, ...rows],
          width: { size: 100, type: WidthType.PERCENTAGE }
        });

        sections.push({
          properties: {},
          children: [
            new Paragraph({ text: 'ZIKORA MEDICAL CENTER', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: 'PATIENT REGISTRY SYSTEM DATABASE REPORT', heading: HeadingLevel.HEADING_3, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Generated on: ${new Date().toLocaleString()}`, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Total Patient Records: ${dataRows.length}`, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: '' }), // Spacer
            table,
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'This is an official document of Zikora Medical Center. Confidentiality rules apply.', alignment: AlignmentType.CENTER })
          ]
        });

      } else if (type === 'medical-records') {
        const p = extraInfo.patient;
        
        const docSectionsChildren: any[] = [
          new Paragraph({ text: 'ZIKORA MEDICAL CENTER', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: 'COMPREHENSIVE HOSPITAL MANAGEMENT SYSTEM (HMS) RECORD', heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: `Date Generated: ${new Date().toLocaleString()}`, alignment: AlignmentType.CENTER }),
          new Paragraph({ text: '' }),
          
          new Paragraph({ text: '1. PATIENT DEMOGRAPHICS & PROFILE', heading: HeadingLevel.HEADING_3 }),
          new Paragraph({ children: [new TextRun({ text: 'Patient Full Name: ', bold: true }), new TextRun(p.name || 'N/A')] }),
          new Paragraph({ children: [new TextRun({ text: 'Hospital Number: ', bold: true }), new TextRun(p.hospital_number || p.id || 'N/A')] }),
          new Paragraph({ children: [new TextRun({ text: 'Gender / DOB: ', bold: true }), new TextRun(`${p.gender || 'N/A'} / ${p.date_of_birth ? p.date_of_birth.split('T')[0] : 'N/A'}`)] }),
          new Paragraph({ children: [new TextRun({ text: 'Phone Number: ', bold: true }), new TextRun(p.phone_number || 'N/A')] }),
          new Paragraph({ children: [new TextRun({ text: 'Residential Address: ', bold: true }), new TextRun(p.address || 'N/A')] }),
          new Paragraph({ children: [new TextRun({ text: 'Registration Date / Officer: ', bold: true }), new TextRun(`${p.registration_date ? p.registration_date.split('T')[0] : 'N/A'} / ${p.registered_by || 'Staff'}`)] }),
          new Paragraph({ children: [new TextRun({ text: 'Clinical Status: ', bold: true }), new TextRun(p.status || 'Active')] }),
          new Paragraph({ text: '' }),

          new Paragraph({ text: '2. DOCTOR CONSULTATIONS HISTORY', heading: HeadingLevel.HEADING_3 })
        ];

        if (extraInfo.consultations && extraInfo.consultations.length > 0) {
          extraInfo.consultations.forEach((c: any) => {
            docSectionsChildren.push(
              new Paragraph({ children: [new TextRun({ text: `Date: ${c.date ? c.date.substring(0, 10) : (c.created_at ? c.created_at.substring(0, 10) : 'N/A')} — Attending Doctor: ${c.doctor_name || 'Medical Officer'}`, bold: true, color: '2A758C' })] }),
              new Paragraph({ children: [new TextRun({ text: '  • Chief Complaint: ', bold: true }), new TextRun(c.chief_complaint || 'None')] }),
              new Paragraph({ children: [new TextRun({ text: '  • Primary Diagnosis: ', bold: true }), new TextRun(c.diagnosis || c.diagnoses || 'None Listed')] }),
              new Paragraph({ children: [new TextRun({ text: '  • Clinical Plan & Notes: ', bold: true }), new TextRun(c.treatment_plan || c.notes || 'None')] }),
              new Paragraph({ children: [new TextRun({ text: '  • Prescriptions: ', bold: true }), new TextRun(typeof c.prescriptions === 'string' ? c.prescriptions : JSON.stringify(c.prescriptions || 'None'))] }),
              new Paragraph({ text: '' })
            );
          });
        } else {
          docSectionsChildren.push(new Paragraph({ children: [new TextRun({ text: 'No prior clinical consultations logged on file.', italics: true })] }));
          docSectionsChildren.push(new Paragraph({ text: '' }));
        }

        // Vitals Section in Word
        docSectionsChildren.push(new Paragraph({ text: '3. RECENT VITAL SIGNS LOGS', heading: HeadingLevel.HEADING_3 }));
        if (extraInfo.vitals && extraInfo.vitals.length > 0) {
          extraInfo.vitals.forEach((v: any) => {
            docSectionsChildren.push(
              new Paragraph({ children: [new TextRun({ text: `Recorded: ${v.recorded_at ? v.recorded_at.substring(0, 19).replace('T', ' ') : 'N/A'} — BP: ${v.blood_pressure || 'N/A'} | Temp: ${v.temperature || 'N/A'}°C | Pulse: ${v.pulse_rate || 'N/A'} bpm | SPO2: ${v.spo2 || 'N/A'}% | Weight: ${v.weight || 'N/A'}kg`, bold: false })] })
            );
          });
        } else {
          docSectionsChildren.push(new Paragraph({ children: [new TextRun({ text: 'No vital signs history on record.', italics: true })] }));
        }
        docSectionsChildren.push(new Paragraph({ text: '' }));

        sections.push({
          properties: {},
          children: docSectionsChildren
        });

      } else {
        // Simple/general Word document formatting
        sections.push({
          properties: {},
          children: [
            new Paragraph({ text: 'ZIKORA MEDICAL CENTER', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: title.toUpperCase(), heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `Date Generated: ${new Date().toLocaleString()}`, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: `This document contains the official records for ${type}. Generated by the system securely.`, alignment: AlignmentType.LEFT }),
            new Paragraph({ text: '' }),
            new Paragraph({ children: [new TextRun({ text: `Reference Identifier: ${reference}`, bold: true })] }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Report details can be visualized in the spreadsheet or PDF format.', alignment: AlignmentType.CENTER })
          ]
        });
      }

      const doc = new Document({ sections });
      const wordBuffer = await Packer.toBuffer(doc);
      await logExport(req, type, 'word', reference, `Successfully generated ${fileName}`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(wordBuffer);

    } else if (formatLower === 'pdf') {
      // PDF GENERATION
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Simple, beautiful, professionally structured PDF drawing using coordinates
      doc.setFillColor(42, 117, 140);
      doc.rect(0, 0, 210, 8, 'F'); // Top colored ribbon

      doc.setTextColor(42, 117, 140);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('ZIKORA MEDICAL CENTER', 15, 20);

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('OUT-PATIENT & CLINICAL SYSTEMS INTEGRATION PORTAL', 15, 25);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15, 28, 195, 28);

      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(title.toUpperCase(), 15, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 41);
      doc.text(`Doc Ref: ${reference}`, 195, 41, { align: 'right' });

      let currentY = 50;

      if (type === 'patients') {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, 180, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        
        doc.text('Hospital Number', 16, currentY + 5.5);
        doc.text('Patient Name', 48, currentY + 5.5);
        doc.text('Gender', 100, currentY + 5.5);
        doc.text('Phone Number', 118, currentY + 5.5);
        doc.text('Amount Paid', 148, currentY + 5.5);
        doc.text('Status', 174, currentY + 5.5);

        currentY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        dataRows.forEach((p, idx) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
            // Draw brief header on new page
            doc.setTextColor(42, 117, 140);
            doc.setFont('helvetica', 'bold');
            doc.text('ZIKORA MEDICAL CENTER - PATIENT REGISTRY (CONTINUED)', 15, currentY);
            currentY += 8;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
          }

          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, currentY, 180, 7.5, 'F');
          }
          doc.setTextColor(51, 65, 85);
          doc.text(p.hospital_number, 16, currentY + 5);
          doc.setFont('helvetica', 'bold');
          doc.text(p.name.substring(0, 26), 48, currentY + 5);
          doc.setFont('helvetica', 'normal');
          doc.text(p.gender, 100, currentY + 5);
          doc.text(p.phone_number || 'N/A', 118, currentY + 5);
          doc.setFont('helvetica', 'bold');
          doc.text(`₦${parseFloat(p.card_fee || p.amount_paid || 3000).toLocaleString()}`, 148, currentY + 5);
          doc.setFont('helvetica', 'normal');
          doc.text(p.status, 174, currentY + 5);

          currentY += 7.5;
        });

      } else if (type === 'financials') {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, 180, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        
        doc.text('Date', 18, currentY + 5.5);
        doc.text('Patient Name', 55, currentY + 5.5);
        doc.text('Method', 115, currentY + 5.5);
        doc.text('Status', 140, currentY + 5.5);
        doc.text('Amount Paid', 165, currentY + 5.5);

        currentY += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        let grandTotal = 0;

        dataRows.forEach((p, idx) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 20;
          }

          if (idx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, currentY, 180, 7.5, 'F');
          }
          const amt = parseFloat(p.amount || 0);
          grandTotal += amt;

          doc.setTextColor(51, 65, 85);
          doc.text(p.date_paid ? p.date_paid.split('T')[0] : 'N/A', 18, currentY + 5);
          doc.setFont('helvetica', 'bold');
          doc.text(p.patient_name, 55, currentY + 5);
          doc.setFont('helvetica', 'normal');
          doc.text(p.payment_method, 115, currentY + 5);
          doc.text(p.status, 140, currentY + 5);
          doc.text(`₦${amt.toLocaleString()}`, 165, currentY + 5);

          currentY += 7.5;
        });

        currentY += 5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(42, 117, 140);
        doc.text(`GRAND TOTAL ACCUMULATED: ₦${grandTotal.toLocaleString()}`, 15, currentY);

      } else if (type === 'medical-records') {
        const p = extraInfo.patient;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(42, 117, 140);
        doc.text('PATIENT DEMOGRAPHICS & PROFILE', 15, currentY);
        currentY += 5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(`Full Name: ${p.name}`, 15, currentY);
        doc.text(`Hospital Number: ${p.hospital_number}`, 120, currentY);
        currentY += 5;
        doc.text(`Gender: ${p.gender}`, 15, currentY);
        doc.text(`Date of Birth: ${p.date_of_birth ? p.date_of_birth.split('T')[0] : 'N/A'}`, 120, currentY);
        currentY += 5;
        doc.text(`Phone Number: ${p.phone_number || 'N/A'}`, 15, currentY);
        doc.text(`Residential Address: ${p.address || 'N/A'}`, 120, currentY);
        currentY += 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(42, 117, 140);
        doc.text('CLINICAL CONSULTATIONS SUMMARY LOGS', 15, currentY);
        currentY += 6;

        if (extraInfo.consultations && extraInfo.consultations.length > 0) {
          extraInfo.consultations.forEach((c: any) => {
            if (currentY > 260) {
              doc.addPage();
              currentY = 20;
            }
            doc.setFillColor(248, 250, 252);
            doc.rect(15, currentY, 180, 25, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(42, 117, 140);
            const cDate = c.date ? c.date.substring(0, 10) : (c.created_at ? c.created_at.substring(0, 10) : 'N/A');
            doc.text(`Date: ${cDate} - Attending Doctor: ${c.doctor_name || 'Medical Officer'}`, 18, currentY + 5);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(51, 65, 85);
            doc.text(`Chief Complaint: ${c.chief_complaint || 'None'}`, 18, currentY + 10);
            doc.text(`Primary Diagnosis: ${c.diagnosis || c.diagnoses || 'None Listed'}`, 18, currentY + 15);
            const treatmentText = (c.treatment_plan || c.notes || 'None');
            doc.text(`Treatment Plan / Notes: ${treatmentText.length > 95 ? treatmentText.substring(0, 95) + '...' : treatmentText}`, 18, currentY + 20);
            const prescStr = typeof c.prescriptions === 'string' ? c.prescriptions : (c.prescriptions ? JSON.stringify(c.prescriptions) : 'None');
            doc.text(`Prescriptions: ${prescStr.length > 95 ? prescStr.substring(0, 95) + '...' : prescStr}`, 18, currentY + 25);
            
            currentY += 30;
          });
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text('No prior doctor consultation entries logged.', 18, currentY + 3);
          currentY += 10;
        }

        // Vitals signs in PDF
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(42, 117, 140);
        doc.text('RECENT VITAL SIGNS READINGS', 15, currentY);
        currentY += 6;

        if (extraInfo.vitals && extraInfo.vitals.length > 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, currentY, 180, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          doc.text('Date', 18, currentY + 5);
          doc.text('BP', 55, currentY + 5);
          doc.text('Temp', 85, currentY + 5);
          doc.text('Pulse', 115, currentY + 5);
          doc.text('SPO2', 145, currentY + 5);
          doc.text('Weight', 170, currentY + 5);
          currentY += 7;

          extraInfo.vitals.slice(0, 5).forEach((v: any) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(71, 85, 105);
            doc.text(v.recorded_at ? v.recorded_at.substring(0, 10) : 'N/A', 18, currentY + 4.5);
            doc.text(v.blood_pressure || '—', 55, currentY + 4.5);
            doc.text(`${v.temperature || '—'}°C`, 85, currentY + 4.5);
            doc.text(`${v.pulse_rate || '—'} bpm`, 115, currentY + 4.5);
            doc.text(`${v.spo2 || '—'}%`, 145, currentY + 4.5);
            doc.text(`${v.weight || '—'} kg`, 170, currentY + 4.5);
            currentY += 6;
          });
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text('No vital signs recorded.', 18, currentY + 3);
          currentY += 10;
        }
      } else {
        // Fallback drawing for PDF
        doc.text(`This is a fallback PDF document for ${type}.`, 15, currentY);
        currentY += 10;
        doc.text(`Ref ID: ${reference}`, 15, currentY);
      }

      // Draw footer on A4 page
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
        doc.text('Zikora Medical Center — Official Clinical Document — Unauthorized reproduction is strictly prohibited.', 105, 291, { align: 'center' });
      }

      const pdfArrayBuffer = doc.output('arraybuffer');
      const pdfBuffer = Buffer.from(pdfArrayBuffer);
      await logExport(req, type, 'pdf', reference, `Successfully generated ${fileName}`);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(pdfBuffer);
    }

  } catch (error: any) {
    console.error('Export Error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate export file. Please try again.' });
  }
});

export default router;
