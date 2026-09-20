import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { PatientsService } from './patients.service';
import { broadcastNotification } from '../../utils/ws.util';

export class PatientsController {
  private service = new PatientsService();

  public getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const patients = await this.service.getAllPatients();
      res.status(200).json({
        success: true,
        data: patients,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  };

  public getById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const patient = await this.service.getPatientById(id);
      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      });
    }
  };

  public create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const registrarUsername = req.user?.username || 'unknown';
      const newPatient = await this.service.registerPatient(req.body, registrarUsername);

      // Broadcast real-time notification to Nurses and Cashiers
      broadcastNotification({
        type: 'PATIENT_REGISTERED',
        targetRole: 'Nurse',
        message: `New patient: ${newPatient.name} registered. Vitals entry pending.`,
        patientId: newPatient.id,
        sender: registrarUsername,
        data: newPatient,
      });

      broadcastNotification({
        type: 'PATIENT_REGISTERED',
        targetRole: 'Cashier',
        message: `New patient card issued: ${newPatient.name}. Card Fee: N${newPatient.cardFee.toLocaleString()}`,
        patientId: newPatient.id,
        sender: registrarUsername,
        data: newPatient,
      });

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: newPatient,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  public update = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedPatient = await this.service.updatePatient(id, req.body);

      // Broadcast update
      broadcastNotification({
        type: 'PATIENT_UPDATED',
        message: `Patient records updated for ${updatedPatient.name}`,
        patientId: id,
        sender: req.user?.username,
        data: updatedPatient,
      });

      res.status(200).json({
        success: true,
        message: 'Patient updated successfully',
        data: updatedPatient,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  public recordVitals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedPatient = await this.service.recordVitals(id, req.body);

      // Broadcast to Doctor
      broadcastNotification({
        type: 'VITALS_RECORDED',
        targetRole: 'Doctor',
        message: `Vitals recorded for ${updatedPatient.name}. Patient is ready for consultation.`,
        patientId: id,
        sender: req.user?.username,
        data: updatedPatient,
      });

      res.status(200).json({
        success: true,
        message: 'Vitals recorded successfully',
        data: updatedPatient,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  // ==========================================
  // OPD Controller Handlers
  // ==========================================

  public getPrices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getPrices();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public updatePrice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { itemCode, price } = req.body;
      await this.service.updatePrice(itemCode, price);
      res.status(200).json({ success: true, message: 'Price updated successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public getCompanies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getCompanies();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public getFamilies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getFamilies();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public addFamilyDeposit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { familyId, amount, description } = req.body;
      const username = req.user?.username || 'unknown';
      const data = await this.service.addFamilyDeposit(familyId, amount, username, description);
      res.status(200).json({ success: true, message: 'Deposit successful', data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public createEncounter = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { patientId, visitType, destinationClinic, priority, priorityReason } = req.body;
      const username = req.user?.username || 'unknown';
      const data = await this.service.createEncounter(patientId, visitType, destinationClinic, priority, priorityReason, username);

      broadcastNotification({
        type: 'ENCOUNTER_CREATED',
        targetRole: destinationClinic === 'Eye Clinic' ? 'Doctor' : 'Nurse',
        message: `New encounter created for patient: ${patientId}. Placed in queue.`,
        patientId,
        sender: username,
        data,
      });

      broadcastNotification({
        type: 'PATIENT_ROUTED_TO_DOCTOR',
        targetRole: 'Doctor',
        message: `Patient routed to doctor consultation queue.`,
        patientId,
        sender: username,
        data,
      });

      res.status(201).json({ success: true, message: 'Encounter created and patient queued successfully', data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public getEncounters = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getEncounters();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public getQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getQueue();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public recordOPDVitals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { patientId, encounterId, vitals } = req.body;
      const username = req.user?.username || 'unknown';
      await this.service.recordOPDVitals(patientId, encounterId, vitals, username);

      broadcastNotification({
        type: 'VITALS_RECORDED',
        targetRole: 'Doctor',
        message: `Vitals recorded for encounter ${encounterId}. Patient is ready for doctor consultation.`,
        patientId,
        sender: username,
      });

      res.status(200).json({ success: true, message: 'Vitals recorded and patient routed to consultation queue' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public updateEncounterPriority = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { encounterId, priority, reason } = req.body;
      const username = req.user?.username || 'unknown';
      await this.service.updateEncounterPriority(encounterId, priority, reason, username);

      broadcastNotification({
        type: 'PRIORITY_UPDATED',
        message: `Encounter priority escalated/modified to ${priority}`,
        sender: username,
      });

      res.status(200).json({ success: true, message: 'Encounter priority updated successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public requestCardReplacement = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { patientId, oldCardNumber, newCardNumber, lastOfficeSeen, reason } = req.body;
      const username = req.user?.username || 'unknown';
      await this.service.requestCardReplacement(patientId, oldCardNumber, newCardNumber, username, lastOfficeSeen, reason);

      res.status(200).json({ success: true, message: 'Card replaced and patient medical history refreshed successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public getCardReplacements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getCardReplacements();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public checkDuplicates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { name, phoneNumber } = req.query;
      const data = await this.service.checkDuplicates(String(name || ''), String(phoneNumber || ''));
      res.status(200).json({ success: true, duplicateCount: data.length, duplicates: data });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public getDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getDashboardStats();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public saveDoctorNotes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { patientId, encounterId, notes } = req.body;
      if (!patientId) {
        res.status(400).json({ success: false, error: 'patientId is required' });
        return;
      }
      const username = req.user?.username || req.body.doctorName || 'Doctor';
      const result = await this.service.saveDoctorNotes(patientId, encounterId, notes, username);
      res.status(200).json({ success: true, message: 'Doctor notes saved successfully', data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public completeConsultation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { patientId, encounterId, notes, orderedTests, prescribedMedications, routeTo } = req.body;
      const username = req.user?.username || 'unknown';
      await this.service.completeConsultation(patientId, encounterId, notes, orderedTests, prescribedMedications, routeTo, username);

      broadcastNotification({
        type: 'CONSULTATION_COMPLETED',
        targetRole: 'Cashier',
        message: `Consultation completed for patient ${patientId}. Routed to Cashier for ${routeTo === 'lab' ? 'Laboratory' : 'Pharmacy'} Payment.`,
        patientId,
        sender: username,
      });

      res.status(200).json({ success: true, message: 'Consultation completed successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public getLabOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { encounterId } = req.query;
      if (!encounterId) {
        res.status(400).json({ success: false, error: 'encounterId is required' });
        return;
      }
      const data = await this.service.getLabOrders(String(encounterId));
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public getLabResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { encounterId, patientId } = req.query;
      if (!encounterId && !patientId) {
        res.status(400).json({ success: false, error: 'encounterId or patientId is required' });
        return;
      }
      const data = await this.service.getLabResults(
        encounterId ? String(encounterId) : undefined,
        patientId ? String(patientId) : undefined
      );
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public getPharmacyOrders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { encounterId } = req.query;
      if (!encounterId) {
        res.status(400).json({ success: false, error: 'encounterId is required' });
        return;
      }
      const data = await this.service.getPharmacyOrders(String(encounterId));
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };

  public completeLaboratoryTest = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { patientId, encounterId, testResults } = req.body;
      const username = req.user?.username || 'unknown';
      await this.service.completeLaboratoryTest(patientId, encounterId, testResults, username);

      broadcastNotification({
        type: 'LAB_RESULTS_READY',
        targetRole: 'Doctor',
        message: `Laboratory results ready for patient ${patientId}. Sent back to Doctor.`,
        patientId,
        sender: username,
      });

      res.status(200).json({ success: true, message: 'Laboratory results recorded successfully' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public completePharmacyDispense = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { patientId, encounterId } = req.body;
      const username = req.user?.username || 'unknown';
      await this.service.completePharmacyDispense(patientId, encounterId, username);

      broadcastNotification({
        type: 'MEDICATION_DISPENSED',
        targetRole: 'Doctor',
        message: `Medications fully dispensed for patient ${patientId}. Flow complete.`,
        patientId,
        sender: username,
      });

      res.status(200).json({ success: true, message: 'Medications dispensed and patient completed' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  };

  public getInvoices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const data = await this.service.getInvoices();
      res.status(200).json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  };
}
