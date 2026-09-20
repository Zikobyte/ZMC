import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, socketManager } from '../utils/api';
import { Patient, User } from '../types';
import ExportButton from './ExportButton';
import { 
  Search, 
  CreditCard, 
  DollarSign, 
  Coins, 
  Receipt, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  User as UserIcon,
  Clock, 
  ArrowUpRight,
  Filter,
  CheckCircle,
  X,
  Loader2,
  Calculator,
  ShieldAlert,
  Printer,
  Sparkles,
  FlaskConical,
  ClipboardList,
  AlertTriangle,
  Users,
  LogOut,
  Percent,
  Send,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Baby
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MaternitySuppliesCashierView from './cashier/MaternitySuppliesCashierView';

interface Payment {
  id: string;
  patientId: string;
  invoiceId?: string;
  amount: number;
  status: string;
  datePaid: string;
  paymentMethod: string;
  collectedBy?: string;
  purpose?: string;
}

export default function CashierView({ activeTab: propActiveTab }: { activeTab?: string } = {}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  
  // Tab states
  const [activeTab, setActiveTab] = useState<'billing' | 'lab-payments' | 'iclinic-registrations' | 'walkin-verify' | 'outstanding' | 'vitae' | 'no-charge' | 'discounts' | 'maternity-supplies'>(() => {
    if (propActiveTab === 'cashier-outstanding' || propActiveTab === 'outstanding') return 'outstanding';
    if (propActiveTab === 'cashier-discounts' || propActiveTab === 'discounts') return 'discounts';
    if (propActiveTab === 'cashier-lab-payments') return 'lab-payments';
    if (propActiveTab === 'cashier-walkin-verify') return 'walkin-verify';
    if (propActiveTab === 'cashier-vitae') return 'vitae';
    if (propActiveTab === 'cashier-no-charge') return 'no-charge';
    if (propActiveTab === 'cashier-maternity-supplies' || propActiveTab === 'maternity-supplies') return 'maternity-supplies';
    return 'billing';
  });
  const [maternitySupplies, setMaternitySupplies] = useState<any[]>([]);
  const [isLoadingMaternitySupplies, setIsLoadingMaternitySupplies] = useState(false);
  const [eyeRegistrationsList, setEyeRegistrationsList] = useState<any[]>([]);
  const [eyePayMethods, setEyePayMethods] = useState<Record<string, string>>({});
  const [eyePayAmounts, setEyePayAmounts] = useState<Record<string, string>>({});
  const [pendingQueueTab, setPendingQueueTab] = useState<'emergency' | 'walkin' | 'regular'>('emergency');
  const [outstandingList, setOutstandingList] = useState<any[]>([]);
  const [settleItemId, setSettleItemId] = useState<string | null>(null);
  const [settlePayAmount, setSettlePayAmount] = useState<string>('');
  const [settlePayMethod, setSettlePayMethod] = useState<string>('Cash');
  const [isSettling, setIsSettling] = useState<boolean>(false);
  const [rowPaymentAmounts, setRowPaymentAmounts] = useState<Record<string, string>>({});
  const [rowPaymentMethods, setRowPaymentMethods] = useState<Record<string, string>>({});
  const [recordingRowId, setRecordingRowId] = useState<string | null>(null);
  const [labSubTab, setLabSubTab] = useState<'pending' | 'history'>('pending');
  const [labPayMethods, setLabPayMethods] = useState<Record<string, string>>({});
  const [labCategoryFilter, setLabCategoryFilter] = useState<'ALL' | 'Standard' | 'Maternity' | 'Emergency'>('ALL');
  const [labHistoryRecords, setLabHistoryRecords] = useState<any[]>([]);
  
  // Custom payment amounts state for partial payments
  const [selectedTotalBill, setSelectedTotalBill] = useState<number>(0);
  const [labCustomAmounts, setLabCustomAmounts] = useState<Record<string, string>>({});
  const [walkInCustomAmounts, setWalkInCustomAmounts] = useState<Record<string, string>>({});

  // Discount Request States (HR Approval Required)
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string>('');
  const [discountTarget, setDiscountTarget] = useState<{
    patientId: string;
    patientName: string;
    hospitalNumber?: string;
    invoiceId?: string;
    encounterId?: string;
    originalAmount: number;
  } | null>(null);
  const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false);
  const [discountRequestsList, setDiscountRequestsList] = useState<any[]>([]);

  useEffect(() => {
    if (propActiveTab) {
      if (propActiveTab === 'cashier-lab-payments') setActiveTab('lab-payments');
      else if (propActiveTab === 'cashier-walkin-verify') setActiveTab('walkin-verify');
      else if (propActiveTab === 'cashier-outstanding' || propActiveTab === 'outstanding') setActiveTab('outstanding');
      else if (propActiveTab === 'cashier-discounts' || propActiveTab === 'discounts') setActiveTab('discounts');
      else if (propActiveTab === 'cashier-vitae') setActiveTab('vitae');
      else if (propActiveTab === 'cashier-no-charge') setActiveTab('no-charge');
      else if (propActiveTab === 'cashier-maternity-supplies' || propActiveTab === 'maternity-supplies') setActiveTab('maternity-supplies');
      else if (propActiveTab === 'cashier-billing' || propActiveTab === 'cashier') setActiveTab('billing');
    }
  }, [propActiveTab]);

  // Walk-In Verification States
  const [walkInPending, setWalkInPending] = useState<any[]>([]);
  const [walkInPaid, setWalkInPaid] = useState<any[]>([]);
  const [selectedWalkInVerify, setSelectedWalkInVerify] = useState<any | null>(null);
  const [walkInVerifyPayMethod, setWalkInVerifyPayMethod] = useState<string>('Cash');
  const [isVerifyingWalkIn, setIsVerifyingWalkIn] = useState<boolean>(false);
  const [viewTestsModal, setViewTestsModal] = useState<any | null>(null);

  // Action Confirmation Modal State across all cashier tasks
  const [actionFeedbackModal, setActionFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    patientName?: string;
    hospitalNumber?: string;
    amount?: number;
    badgeText?: string;
    details?: { label: string; value: string }[];
  } | null>(null);
  
  // PV & No-Charge states
  const [paymentVitae, setPaymentVitae] = useState<any[]>([]);
  const [noChargeRecords, setNoChargeRecords] = useState<any[]>([]);

  // UI states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Recording payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payPurpose, setPayPurpose] = useState('Registration Fee');

  // PV form states
  const [pvPersonName, setPvPersonName] = useState('');
  const [pvDescription, setPvDescription] = useState('');
  const [pvAmount, setPvAmount] = useState('');
  const [pvApprovedByDoctor, setPvApprovedByDoctor] = useState('Dr. Alan Smith');

  // No-Charge form states
  const [ncStaffName, setNcStaffName] = useState('');
  const [ncRelationship, setNcRelationship] = useState('Self');
  const [ncPatientId, setNcPatientId] = useState('');
  const [ncTreatmentCost, setNcTreatmentCost] = useState('');
  const [ncTreatmentDescription, setNcTreatmentDescription] = useState('');
  const [ncApprovedByDoctor, setNcApprovedByDoctor] = useState('Dr. Alan Smith');

  // Day Revenue Balance Modal State
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [isConfirmingHandover, setIsConfirmingHandover] = useState<string | null>(null);
  const initialDataLoaded = useRef(false);

  useEffect(() => {
    if (initialDataLoaded.current) return;
    initialDataLoaded.current = true;
    fetchInitialData();
  }, []);

  const handleConfirmHandover = async (paymentId: string) => {
    setIsConfirmingHandover(paymentId);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`/payments/${paymentId}/confirm`, {
        method: 'POST'
      });
      if (res.success) {
        setSuccess('Departmental cash handover successfully confirmed & balanced! Patient payment completed.');
        // Instantly update local state to remove patient from pending queues and unconfirmed handovers
        const targetPayment = payments.find(p => p.id === paymentId);
        if (targetPayment) {
          const pid = targetPayment.patientId;
          setQueueItems(prev => prev.filter(q => q.patient_id !== pid));
          setInvoices(prev => prev.map(inv => inv.patient_id === pid ? { ...inv, status: 'Paid' } : inv));
          setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'Completed' } : p));
        }
        await fetchInitialData();

        setActionFeedbackModal({
          isOpen: true,
          title: 'Departmental Handover Confirmed',
          message: 'Departmental cash collection has been successfully verified and balanced into the Cashier ledger.',
          amount: targetPayment?.amount || 0,
          badgeText: 'Handover Completed',
          details: [
            { label: 'Payment Method', value: targetPayment?.paymentMethod || 'Cash' },
            { label: 'Ledger Status', value: 'Completed & Balanced' }
          ]
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to confirm cash handover.');
    } finally {
      setIsConfirmingHandover(null);
    }
  };

  const handleConfirmLabPayment = async (qItem: any, totalAmount: number, invoiceId?: string) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const enteredStr = labCustomAmounts[qItem.id];
      const collectedAmount = enteredStr !== undefined && enteredStr !== '' ? parseFloat(enteredStr) : totalAmount;
      const totalB = totalAmount > 0 ? totalAmount : collectedAmount;

      let response;
      if (collectedAmount < totalB) {
        response = await apiFetch('/payments/partial', {
          method: 'POST',
          body: JSON.stringify({
            patientId: qItem.patient_id,
            encounterId: qItem.encounter_id,
            invoiceId: invoiceId || `INV-LAB-${Date.now()}`,
            totalBill: totalB,
            amountPaid: collectedAmount,
            paymentMethod: labPayMethods[qItem.id] || 'Cash',
            purpose: 'Doctor Lab Request Investigation',
            department: 'Laboratory'
          })
        });
        // Route queue item to Laboratory
        await apiFetch(`/patients/opd/queue/${qItem.id}/route`, {
          method: 'POST',
          body: JSON.stringify({ targetQueueType: 'Laboratory', status: 'Waiting' })
        }).catch(() => {});
      } else {
        response = await apiFetch('/payments', {
          method: 'POST',
          body: JSON.stringify({
            patientId: qItem.patient_id,
            amount: collectedAmount,
            paymentMethod: labPayMethods[qItem.id] || 'Cash',
            status: 'Completed',
            invoiceId: invoiceId || `INV-LAB-${Date.now()}`
          })
        });
      }

      if (response.success) {
        const remainingBal = Math.max(0, totalB - collectedAmount);
        if (remainingBal > 0) {
          setSuccess(`Lab payment of ₦${collectedAmount.toLocaleString()} confirmed for ${qItem.patient_name || 'Patient'}! Remaining ₦${remainingBal.toLocaleString()} sent to Outstanding Balances.`);
        } else {
          setSuccess(`Lab payment of ₦${collectedAmount.toLocaleString()} confirmed for ${qItem.patient_name || 'Patient'}! Patient routed to Laboratory.`);
        }
        // Instantly remove patient from queue state
        setQueueItems(prev => prev.filter(q => q.id !== qItem.id));
        setInvoices(prev => prev.map(inv => inv.patient_id === qItem.patient_id ? { ...inv, status: 'Paid' } : inv));
        fetchInitialData();

        setActionFeedbackModal({
          isOpen: true,
          title: remainingBal > 0 ? 'Partial Lab Payment Collected' : 'Laboratory Fee Collected & Settled',
          message: `Laboratory investigation payment of ₦${collectedAmount.toLocaleString()} was confirmed for ${qItem.patient_name || 'Patient'}.${remainingBal > 0 ? ` Unpaid balance of ₦${remainingBal.toLocaleString()} sent to Outstanding Balances.` : ''}`,
          patientName: qItem.patient_name || 'Patient',
          hospitalNumber: qItem.hospital_number || '—',
          amount: collectedAmount,
          badgeText: 'Routed to Laboratory Workstation',
          details: [
            { label: 'Payment Method', value: labPayMethods[qItem.id] || 'Cash' },
            { label: 'Amount Collected Now', value: `₦${collectedAmount.toLocaleString()}` },
            { label: 'Total Payable Bill', value: `₦${totalB.toLocaleString()}` },
            { label: 'Remaining Balance', value: remainingBal > 0 ? `₦${remainingBal.toLocaleString()} (Logged)` : 'Cleared' },
            { label: 'Destination Queue', value: 'Laboratory Testing Workstation' }
          ]
        });
      } else {
        setError(response.error || 'Failed to process lab payment');
      }
    } catch (err: any) {
      setError(err.message || 'Error processing lab payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDiscountModal = (target: {
    patientId: string;
    patientName: string;
    hospitalNumber?: string;
    invoiceId?: string;
    encounterId?: string;
    originalAmount: number;
  }) => {
    setDiscountTarget(target);
    setDiscountType('Percentage');
    setDiscountValue('');
    setDiscountReason('');
    setDiscountModalOpen(true);
  };

  const handleDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountTarget || !discountValue || !discountReason) return;

    setIsSubmittingDiscount(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/payments/discount-request', {
        method: 'POST',
        body: JSON.stringify({
          patientId: discountTarget.patientId,
          patientName: discountTarget.patientName,
          hospitalNumber: discountTarget.hospitalNumber,
          invoiceId: discountTarget.invoiceId,
          encounterId: discountTarget.encounterId,
          originalAmount: discountTarget.originalAmount,
          discountType,
          discountValue: parseFloat(discountValue),
          reason: discountReason
        })
      });

      if (res.success) {
        setSuccess(`Discount request submitted for ${discountTarget.patientName}! HR approval is now required.`);
        setDiscountModalOpen(false);
        
        setActionFeedbackModal({
          isOpen: true,
          title: 'Discount Request Sent to HR',
          message: `Discount request for ${discountTarget.patientName} has been transmitted to Human Resources & Management for formal authorization.`,
          patientName: discountTarget.patientName,
          hospitalNumber: discountTarget.hospitalNumber,
          amount: res.finalAmount,
          badgeText: 'HR Approval Pending',
          details: [
            { label: 'Discount Type', value: discountType },
            { label: 'Value Requested', value: discountType === 'Percentage' ? `${discountValue}%` : `₦${parseFloat(discountValue).toLocaleString()}` },
            { label: 'Calculated Discount', value: `₦${(res.calculatedDiscount || 0).toLocaleString()}` },
            { label: 'Final Payable After Approval', value: `₦${(res.finalAmount || 0).toLocaleString()}` },
            { label: 'Reason', value: discountReason }
          ]
        });

        await fetchInitialData();
      } else {
        setError(res.error || 'Failed to submit discount request');
      }
    } catch (err: any) {
      setError(err.message || 'Error submitting discount request');
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleApproveDiscount = async (requestId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/payments/discount-requests/${requestId}/approve`, {
        method: 'POST'
      });
      if (res.success) {
        setSuccess(`Discount request approved by HR! Final bill updated.`);
        await fetchInitialData();
      } else {
        setError(res.error || 'Failed to approve discount request');
      }
    } catch (err: any) {
      setError(err.message || 'Error approving discount request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectDiscount = async (requestId: string) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/payments/discount-requests/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: 'Declined by HR/Management' })
      });
      if (res.success) {
        setSuccess(`Discount request rejected.`);
        await fetchInitialData();
      } else {
        setError(res.error || 'Failed to reject discount request');
      }
    } catch (err: any) {
      setError(err.message || 'Error rejecting discount request');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    setIsLoadingQueue(true);
    setError('');
    try {
      const [patientsRes, paymentsRes, usersRes, queueRes, vitaeRes, noChargeRes, invoicesRes, labHistRes, walkInRes, outstandingRes, discRes, matSuppliesRes] = await Promise.all([
        apiFetch('/patients'),
        apiFetch('/payments'),
        apiFetch('/users').catch(() => ({ success: true, data: [] })),
        apiFetch('/patients/opd/queue').catch(() => ({ success: true, data: [] })),
        apiFetch('/payments/vitae').catch(() => ({ success: true, data: [] })),
        apiFetch('/payments/no-charge').catch(() => ({ success: true, data: [] })),
        apiFetch('/patients/opd/invoices').catch(() => ({ success: true, data: [] })),
        apiFetch('/payments/lab-history').catch(() => ({ success: true, data: [] })),
        apiFetch('/payments/lab/walk-in').catch(() => ({ success: true, data: { pendingPayment: [], paidReadyForTesting: [] } })),
        apiFetch('/payments/outstanding').catch(() => ({ success: true, data: [] })),
        apiFetch('/payments/discount-requests').catch(() => ({ success: true, discountRequests: [] })),
        apiFetch('/nursing/maternity-supplies').catch(() => ({ success: true, data: [] }))
      ]);

      if (patientsRes.success) setPatients(patientsRes.data);
      if (paymentsRes.success) setPayments(paymentsRes.data);
      if (usersRes.success) setUsers(usersRes.data);
      if (queueRes.success) setQueueItems(queueRes.data);
      if (vitaeRes.success) setPaymentVitae(vitaeRes.data);
      if (noChargeRes.success) setNoChargeRecords(noChargeRes.data);
      if (invoicesRes.success) setInvoices(invoicesRes.data);
      if (labHistRes.success) setLabHistoryRecords(labHistRes.data);
      if (outstandingRes.success) setOutstandingList(outstandingRes.data || []);
      if (discRes?.success) setDiscountRequestsList(discRes.discountRequests || []);
      if (matSuppliesRes?.success && Array.isArray(matSuppliesRes.data)) {
        setMaternitySupplies(matSuppliesRes.data);
      }
      if (walkInRes.success && walkInRes.data) {
        setWalkInPending(walkInRes.data.pendingPayment || []);
        setWalkInPaid(walkInRes.data.paidReadyForTesting || []);
      }

      // Sync Eye Clinic Registration queue items from backend DB
      try {
        const eyeRes = await apiFetch('/patients/eye-clinic/patients');
        if (eyeRes && eyeRes.success && Array.isArray(eyeRes.data)) {
          const pendingEye = eyeRes.data.filter((p: any) => p.status === 'Awaiting Cashier Verification' || p.paymentStatus === 'UNPAID' || (p.balance && p.balance > 0));
          setEyeRegistrationsList(pendingEye);
        } else {
          const eyePats = JSON.parse(localStorage.getItem('zmc_eye_patients_new') || '[]');
          const pendingEye = eyePats.filter((p: any) => p.status === 'Awaiting Cashier Verification' || p.paymentStatus === 'UNPAID');
          setEyeRegistrationsList(pendingEye);
        }
      } catch (e) {
        console.error('Error loading eye registrations in cashier', e);
      }
    } catch (err: any) {
      console.error('Failed to load cashier data', err);
      setError(err.message || 'Error loading cashier dashboard data.');
    } finally {
      setIsLoading(false);
      setIsLoadingQueue(false);
    }
  };

  const fetchMaternitySupplies = async () => {
    try {
      setIsLoadingMaternitySupplies(true);
      const res = await apiFetch('/nursing/maternity-supplies');
      if (res && res.success && Array.isArray(res.data)) {
        setMaternitySupplies(res.data);
      }
    } catch (err) {
      console.error('Failed to load maternity supplies:', err);
    } finally {
      setIsLoadingMaternitySupplies(false);
    }
  };

  const handleVerifyEyeRegistration = async (patient: any) => {
    try {
      const payMethodStr = eyePayMethods[patient.id] || 'Cash';
      const amtStr = eyePayAmounts[patient.id];
      const paidAmount = (amtStr && !isNaN(parseFloat(amtStr))) ? parseFloat(amtStr) : (patient.balance || 3000);

      // 1. Call Backend API to verify payment in PostgreSQL
      try {
        await apiFetch('/patients/eye-clinic/verify-payment', {
          method: 'POST',
          body: JSON.stringify({
            patientId: patient.id || patient.hospitalNumber,
            amount: paidAmount,
            paymentMethod: payMethodStr
          })
        });
      } catch (apiErr) {
        console.warn('Could not update eye patient via backend API, falling back to local store:', apiErr);
      }

      const eyePats = JSON.parse(localStorage.getItem('zmc_eye_patients_new') || '[]');
      const updatedEyePats = eyePats.map((p: any) => {
        if (p.id === patient.id) {
          const currentBal = typeof p.balance === 'number' ? p.balance : 3000;
          const newBal = Math.max(0, currentBal - paidAmount);
          return {
            ...p,
            status: 'Awaiting Consult',
            paymentStatus: newBal === 0 ? 'Paid' : 'Part Paid',
            balance: newBal
          };
        }
        return p;
      });
      localStorage.setItem('zmc_eye_patients_new', JSON.stringify(updatedEyePats));

      const eyeQueue = JSON.parse(localStorage.getItem('zmc_eye_registrations_queue') || '[]');
      const updatedQueue = eyeQueue.filter((q: any) => q.id !== patient.id);
      localStorage.setItem('zmc_eye_registrations_queue', JSON.stringify(updatedQueue));

      const newPayment: Payment = {
        id: `PAY-EYE-${Date.now()}`,
        patientId: patient.id,
        amount: paidAmount,
        status: 'Completed',
        datePaid: new Date().toISOString(),
        paymentMethod: payMethodStr,
        purpose: 'New Patient - Eye Clinic Card ₦3,000',
        collectedBy: 'Cashier Desk'
      };
      setPayments(prev => [newPayment, ...prev]);

      setSuccess(`Verified payment of ₦${paidAmount.toLocaleString()} for ${patient.name} (${patient.hospitalNumber}). Patient routed to I-Clinic Consultations!`);
      
      await fetchInitialData();
    } catch (e: any) {
      setError(`Error processing Eye Clinic registration payment: ${e.message}`);
    }
  };

  const handleSettleOutstanding = async (item: any) => {
    const pAmt = parseFloat(settlePayAmount);
    if (isNaN(pAmt) || pAmt <= 0) {
      setError('Please specify a valid payment amount.');
      return;
    }
    setIsSettling(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiFetch('/payments/outstanding/settle', {
        method: 'POST',
        body: JSON.stringify({
          id: item.id,
          patientId: item.patient_id,
          paymentAmount: pAmt,
          paymentMethod: settlePayMethod || 'Cash'
        })
      });

      if (response.success) {
        setSuccess(response.message || 'Outstanding balance payment processed successfully!');
        setSettleItemId(null);
        setSettlePayAmount('');
        await fetchInitialData();

        setActionFeedbackModal({
          isOpen: true,
          title: 'Outstanding Balance Payment Received',
          message: `Successfully received ₦${pAmt.toLocaleString()} via ${settlePayMethod} for ${item.patient_name || 'Patient'}!`,
          patientName: item.patient_name,
          hospitalNumber: item.hospital_number,
          amount: pAmt,
          badgeText: 'Balance Cleared / Reduced',
          details: [
            { label: 'Payment Method', value: settlePayMethod },
            { label: 'Debt Purpose', value: item.purpose || 'Hospital Services' },
            { label: 'Original Total', value: `₦${parseFloat(item.total_bill).toLocaleString()}` },
            { label: 'New Outstanding Balance', value: `₦${Math.max(0, parseFloat(item.balance) - pAmt).toLocaleString()}` }
          ]
        });
      } else {
        setError(response.error || 'Failed to settle balance');
      }
    } catch (err: any) {
      setError(err.message || 'Error settling outstanding balance');
    } finally {
      setIsSettling(false);
    }
  };

  const handleRecordRowPayment = async (item: any) => {
    const rawAmt = rowPaymentAmounts[item.id];
    const pAmt = rawAmt !== undefined && rawAmt !== '' ? parseFloat(rawAmt) : parseFloat(item.balance);
    const payMethod = rowPaymentMethods[item.id] || 'Cash';

    if (isNaN(pAmt) || pAmt <= 0) {
      setError('Please enter a valid payment amount to record.');
      return;
    }

    if (pAmt > parseFloat(item.balance)) {
      setError(`Amount typed (₦${pAmt.toLocaleString()}) exceeds remaining balance owed (₦${parseFloat(item.balance).toLocaleString()}).`);
      return;
    }

    setRecordingRowId(item.id);
    setError('');
    setSuccess('');
    try {
      const response = await apiFetch('/payments/outstanding/settle', {
        method: 'POST',
        body: JSON.stringify({
          id: item.id,
          patientId: item.patient_id,
          paymentAmount: pAmt,
          paymentMethod: payMethod
        })
      });

      if (response.success) {
        setSuccess(`Payment of ₦${pAmt.toLocaleString()} recorded via ${payMethod} for ${item.patient_name || 'Patient'}!`);
        setRowPaymentAmounts(prev => ({ ...prev, [item.id]: '' }));
        await fetchInitialData();

        setActionFeedbackModal({
          isOpen: true,
          title: 'Payment Recorded',
          message: `Successfully recorded ₦${pAmt.toLocaleString()} payment via ${payMethod} for ${item.patient_name || 'Patient'}.`,
          patientName: item.patient_name,
          hospitalNumber: item.hospital_number,
          amount: pAmt,
          badgeText: pAmt >= parseFloat(item.balance) ? 'Debt Fully Cleared' : 'Partial Payment Recorded',
          details: [
            { label: 'Department Owed', value: item.department_owed || item.department || 'Hospital Services' },
            { label: 'Payment Method', value: payMethod },
            { label: 'Original Total Owed', value: `₦${parseFloat(item.total_bill).toLocaleString()}` },
            { label: 'New Remaining Owed', value: `₦${Math.max(0, parseFloat(item.balance) - pAmt).toLocaleString()}` }
          ]
        });
      } else {
        setError(response.error || 'Failed to record payment');
      }
    } catch (err: any) {
      setError(err.message || 'Error recording payment for outstanding balance');
    } finally {
      setRecordingRowId(null);
    }
  };

  const handleConfirmWalkInVerification = async (patient: any) => {
    setIsVerifyingWalkIn(true);
    setError('');
    setSuccess('');

    try {
      const totalAmount = Number(patient.totalAmount) || 0;
      const enteredStr = walkInCustomAmounts[patient.encounterId];
      const collectedAmount = enteredStr !== undefined && enteredStr !== '' ? parseFloat(enteredStr) : totalAmount;

      const response = await apiFetch('/payments/lab/confirm-walk-in', {
        method: 'POST',
        body: JSON.stringify({
          patientId: patient.patientId,
          encounterId: patient.encounterId,
          invoiceId: patient.invoiceId,
          totalBill: totalAmount > 0 ? totalAmount : collectedAmount,
          amount: collectedAmount,
          paymentMethod: walkInVerifyPayMethod || 'Cash'
        })
      });

      if (response.success) {
        const remainingBal = Math.max(0, totalAmount - collectedAmount);
        setSuccess(`Walk-in Lab Payment of ₦${collectedAmount.toLocaleString()} for ${patient.patientName} verified! ${remainingBal > 0 ? `Remaining balance of ₦${remainingBal.toLocaleString()} logged to Outstanding Balances.` : 'Patient ready for testing.'}`);
        setSelectedWalkInVerify(null);
        await fetchInitialData();

        setActionFeedbackModal({
          isOpen: true,
          title: remainingBal > 0 ? 'Partial Walk-In Payment Verified' : 'Walk-In Payment Verified & Confirmed',
          message: `Walk-in Lab Payment of ₦${collectedAmount.toLocaleString()} for ${patient.patientName} was verified!${remainingBal > 0 ? ` Remaining ₦${remainingBal.toLocaleString()} recorded in Outstanding Balances.` : ''}`,
          patientName: patient.patientName,
          hospitalNumber: patient.hospitalNumber || 'Walk-In Outpatient',
          amount: collectedAmount,
          badgeText: 'Updated: Ready for Laboratory Testing',
          details: [
            { label: 'Payment Method', value: walkInVerifyPayMethod || 'Cash' },
            { label: 'Amount Collected Now', value: `₦${collectedAmount.toLocaleString()}` },
            { label: 'Total Payable Bill', value: `₦${totalAmount.toLocaleString()}` },
            { label: 'Outstanding Balance', value: remainingBal > 0 ? `₦${remainingBal.toLocaleString()} (Logged)` : 'Cleared' },
            { label: 'Department Routing', value: 'Laboratory Department (Active Queue)' }
          ]
        });
      } else {
        setError(response.error || 'Failed to confirm walk-in payment');
      }
    } catch (err: any) {
      setError(err.message || 'Error confirming walk-in payment');
    } finally {
      setIsVerifyingWalkIn(false);
    }
  };

  const handleSelectQueueItem = (q: any) => {
    const pat = patients.find(p => p.id === q.patient_id);
    if (!pat) return;
    
    setSelectedPatient(pat);
    
    // Check if there is an active/unpaid invoice for this encounter in the database!
    const activeInvoice = invoices.find(inv => inv.encounter_id === q.encounter_id && inv.status === 'Unpaid');
    
    let totalB = 0;
    if (activeInvoice) {
      totalB = Number(activeInvoice.amount) || 0;
      setPayAmount(String(activeInvoice.amount));
      setPayPurpose(activeInvoice.description);
      setPayRef(activeInvoice.id);
    } else {
      if (q.queue_type === 'Cashier Consultation Payment') {
        totalB = 5000;
        setPayAmount('5000');
        setPayPurpose('Consultation Fee');
        setPayRef('');
      } else if (q.queue_type === 'Cashier Lab Payment') {
        totalB = 8500;
        setPayAmount('8500'); // Seed a high fidelity suggested lab package fee
        setPayPurpose('Laboratory Investigations Fee');
        setPayRef('');
      } else if (q.queue_type === 'Cashier Pharmacy Payment') {
        totalB = 5000;
        setPayAmount('5000'); // Seed a high fidelity suggested pharmacy fee
        setPayPurpose('Prescribed Pharmacy Dispensing Fee');
        setPayRef('');
      } else {
        totalB = getPendingBalanceSuggested(pat);
        setPayAmount(String(totalB));
        setPayPurpose('Registration Card Fee');
        setPayRef('');
      }
    }
    setSelectedTotalBill(totalB);
  };

  const handleSelectWalkInForBilling = (item: any) => {
    const totalB = Number(item.totalAmount) || 0;
    setSelectedPatient({
      id: item.patientId || item.encounterId || `WALKIN-${Date.now()}`,
      name: item.patientName,
      hospitalNumber: item.hospitalNumber || 'Walk-In Patient',
      cardType: 'Standard',
      patientCategory: 'Walk-In Diagnostic',
      phoneNumber: item.phoneNumber,
      dateOfBirth: item.registrationDate
    } as Patient);
    setPayAmount(String(totalB));
    setSelectedTotalBill(totalB);
    setPayPurpose(item.testsSummary ? `Walk-in Lab: ${item.testsSummary}` : 'Walk-in Laboratory Request');
    setPayRef(item.encounterId || item.invoiceId || '');
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please select a patient first.');
      return;
    }

    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please specify a valid payment amount.');
      return;
    }

    const totalB = selectedTotalBill > 0 ? selectedTotalBill : amt;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      const isWalkIn = selectedPatient.patientCategory === 'Walk-In Diagnostic' || payPurpose.toLowerCase().includes('walk-in');

      if (amt < totalB) {
        response = await apiFetch('/payments/partial', {
          method: 'POST',
          body: JSON.stringify({
            patientId: selectedPatient.id,
            encounterId: payRef || null,
            invoiceId: payRef || null,
            totalBill: totalB,
            amountPaid: amt,
            paymentMethod: payMethod,
            purpose: payPurpose || 'Outpatient Services',
            department: isWalkIn ? 'Laboratory' : (selectedPatient.cardType === 'Emergency' ? 'Emergency Desk' : 'OPD Reception')
          })
        });
      } else if (isWalkIn && payRef) {
        response = await apiFetch('/payments/lab/confirm-walk-in', {
          method: 'POST',
          body: JSON.stringify({
            encounterId: payRef,
            amount: amt,
            totalAmount: totalB,
            paymentMethod: payMethod
          })
        });
      } else {
        response = await apiFetch('/payments', {
          method: 'POST',
          body: JSON.stringify({
            patientId: selectedPatient.id,
            amount: amt,
            paymentMethod: payMethod,
            status: 'Completed',
            invoiceId: payRef || `PAY-${Math.floor(100000 + Math.random() * 900000)}`
          })
        });
      }

      if (response.success) {
        const remainingBal = Math.max(0, totalB - amt);
        if (remainingBal > 0) {
          setSuccess(`Partial payment of ₦${amt.toLocaleString()} processed for ${selectedPatient.name}! Remaining balance of ₦${remainingBal.toLocaleString()} sent to Outstanding Balances.`);
        } else {
          setSuccess(`Successfully processed payment of ₦${amt.toLocaleString()} via ${payMethod} for ${selectedPatient.name}! Patient has been automatically routed to the queue.`);
        }
        setPayAmount('');
        setPayRef('');
        setSelectedTotalBill(0);
        
        // Optimistically remove patient's queue items & mark unpaid invoices as Paid
        const pid = selectedPatient.id;
        setQueueItems(prev => prev.filter(q => q.patient_id !== pid));
        setInvoices(prev => prev.map(inv => inv.patient_id === pid ? { ...inv, status: 'Paid' } : inv));

        await fetchInitialData();
        
        const targetPatName = selectedPatient.name;
        const targetHnum = selectedPatient.hospitalNumber;
        setSelectedPatient(null);

        setActionFeedbackModal({
          isOpen: true,
          title: remainingBal > 0 ? 'Partial Payment Processed' : 'Payment Settlement Processed',
          message: remainingBal > 0 
            ? `Partial payment of ₦${amt.toLocaleString()} via ${payMethod} processed for ${targetPatName}. Unpaid balance of ₦${remainingBal.toLocaleString()} sent to Outstanding Balances!`
            : `Successfully processed payment of ₦${amt.toLocaleString()} via ${payMethod} for ${targetPatName}!`,
          patientName: targetPatName,
          hospitalNumber: targetHnum,
          amount: amt,
          badgeText: remainingBal > 0 ? 'Logged to Outstanding Balances' : 'Routed to Clinical Queue',
          details: [
            { label: 'Payment Method', value: payMethod },
            { label: 'Amount Collected Now', value: `₦${amt.toLocaleString()}` },
            { label: 'Total Payable Bill', value: `₦${totalB.toLocaleString()}` },
            { label: 'Remaining Balance', value: remainingBal > 0 ? `₦${remainingBal.toLocaleString()} (Logged to Debt Table)` : 'Cleared' },
            { label: 'Purpose', value: payPurpose || 'Consultation / Registration' }
          ]
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record payment transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordPVSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(pvAmount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please specify a valid expense amount.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiFetch('/payments/vitae', {
        method: 'POST',
        body: JSON.stringify({
          personName: pvPersonName,
          description: pvDescription,
          amount: amt,
          approvedByDoctor: pvApprovedByDoctor
        })
      });
      if (response.success) {
        setSuccess(`Payment Vitae recorded! ₦${amt.toLocaleString()} dispensed to ${pvPersonName} for ${pvDescription}.`);
        setPvPersonName('');
        setPvDescription('');
        setPvAmount('');
        // Refresh vitae list
        const vitaeRes = await apiFetch('/payments/vitae');
        if (vitaeRes.success) setPaymentVitae(vitaeRes.data);

        setActionFeedbackModal({
          isOpen: true,
          title: 'Payment Vitae (PV) Recorded',
          message: `Payment Vitae voucher of ₦${amt.toLocaleString()} recorded and dispensed to ${pvPersonName}.`,
          amount: amt,
          badgeText: 'PV Expense Recorded',
          details: [
            { label: 'Recipient Name', value: pvPersonName },
            { label: 'Expense Reason', value: pvDescription },
            { label: 'Approved By', value: pvApprovedByDoctor || 'Management' }
          ]
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record Payment Vitae.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordNoChargeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(ncTreatmentCost);
    if (isNaN(cost) || cost < 0) {
      setError('Please specify a valid treatment cost.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await apiFetch('/payments/no-charge', {
        method: 'POST',
        body: JSON.stringify({
          staffName: ncStaffName,
          relationship: ncRelationship,
          patientId: ncPatientId || null,
          treatmentCost: cost,
          treatmentDescription: ncTreatmentDescription,
          approvedByDoctor: ncApprovedByDoctor
        })
      });
      if (response.success) {
        setSuccess(`No-Charge patient treatment logged successfully! Approved by ${ncApprovedByDoctor}.`);
        setNcStaffName('');
        setNcRelationship('Self');
        setNcPatientId('');
        setNcTreatmentCost('');
        setNcTreatmentDescription('');
        // Refresh lists
        const [noChargeRes, queueRes, patientsRes] = await Promise.all([
          apiFetch('/payments/no-charge'),
          apiFetch('/patients/opd/queue').catch(() => ({ success: true, data: [] })),
          apiFetch('/patients').catch(() => ({ success: true, data: [] }))
        ]);
        if (noChargeRes.success) setNoChargeRecords(noChargeRes.data);
        if (queueRes.success) setQueueItems(queueRes.data);
        if (patientsRes.success) setPatients(patientsRes.data);

        setActionFeedbackModal({
          isOpen: true,
          title: 'No-Charge Treatment Exemption Logged',
          message: `No-Charge exemption of ₦${cost.toLocaleString()} logged for ${ncStaffName}.`,
          amount: cost,
          badgeText: 'Staff Exemption Active',
          details: [
            { label: 'Staff / Beneficiary', value: ncStaffName },
            { label: 'Relationship', value: ncRelationship },
            { label: 'Treatment Details', value: ncTreatmentDescription },
            { label: 'Approved By', value: ncApprovedByDoctor }
          ]
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record No-Charge patient.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to map patientId to name & hospital number
  const getPatientDetails = (patId: string) => {
    const pat = patients.find(p => p.id === patId);
    if (pat) return { name: pat.name, hNum: pat.hospitalNumber };
    const payRec = payments.find(p => p.patientId === patId && (p as any).patientName);
    if (payRec && (payRec as any).patientName) {
      return { name: (payRec as any).patientName, hNum: (payRec as any).hospitalNumber || '—' };
    }
    return { name: 'Walk-In Outpatient', hNum: '—' };
  };

  // Helper to get staff member username
  const getCollectorName = (userId?: string) => {
    if (!userId) return 'System / Auto';
    const found = users.find(u => u.id === userId);
    return found ? found.name || found.username : 'Cashier Desk';
  };

  // Filtered patients for search
  const filteredPatients = searchQuery.trim() === '' ? [] : patients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.hospitalNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.phoneNumber && p.phoneNumber.includes(searchQuery))
  );

  // Filtered payments history
  const filteredPayments = filterMethod === 'ALL' 
    ? payments 
    : payments.filter(p => p.paymentMethod.toUpperCase() === filterMethod);

  // Financial KPIs - calculate totals from completed/paid payments
  const completedPayments = payments.filter(p => p.status === 'Completed' || p.status === 'Paid' || !p.status);
  const totalCollected = completedPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const cashTotal = completedPayments.filter(p => p.paymentMethod === 'Cash').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const posTotal = completedPayments.filter(p => p.paymentMethod === 'POS').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const transferTotal = completedPayments.filter(p => p.paymentMethod === 'Transfer').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  // Dynamic Database KPI summary metrics
  const pendingLabCount = queueItems.filter((q: any) => q.queue_type === 'Cashier Lab Payment' && (q.status === 'Waiting' || q.status === 'Processing')).length + walkInPending.length;
  const billingQueueCount = queueItems.filter((q: any) => q.queue_type === 'Billing' && (q.status === 'Waiting' || q.status === 'Processing')).length;
  const unpaidInvoices = invoices.filter((i: any) => i.status === 'Unpaid' || i.status === 'Pending');
  const pendingPaymentsCount = pendingLabCount + billingQueueCount + unpaidInvoices.length;
  const pendingPaymentsSum = unpaidInvoices.reduce((acc, i) => acc + (Number(i.amount) || Number(i.total) || 0), 0);

  const dischargeInvoices = invoices.filter((i: any) => (i.status === 'Unpaid' || i.status === 'Pending') && (
    (i.description && i.description.toLowerCase().includes('discharge')) ||
    (i.service_type && i.service_type.toLowerCase().includes('discharge')) ||
    (i.purpose && i.purpose.toLowerCase().includes('discharge'))
  ));
  const dischargeBillsCount = dischargeInvoices.length;
  const dischargeBillsSum = dischargeInvoices.reduce((acc, i) => acc + (Number(i.amount) || Number(i.total) || 0), 0);

  const outstandingBalancesCount = outstandingList.length;
  const outstandingTotalOwed = outstandingList.reduce((acc, item) => acc + (Number(item.balance) || 0), 0);
  const totalPatientsCount = patients.length;

  // PV KPIs
  const totalPVExpensed = paymentVitae.reduce((acc, v) => acc + v.amount, 0);
  const largestPVExpense = paymentVitae.reduce((max, v) => v.amount > max ? v.amount : max, 0);
  const totalPVCount = paymentVitae.length;

  // No Charge KPIs
  const totalNoChargeSettle = noChargeRecords.reduce((acc, r) => acc + r.treatmentCost, 0);
  const totalNoChargeCount = noChargeRecords.length;
  const noChargeStaffSelfCount = noChargeRecords.filter(r => r.relationship === 'Self').length;

  // Suggested pending fee based on patient's state
  const getPendingBalanceSuggested = (pat: Patient) => {
    // Check card fee or explicit balance
    if (pat.cardType === 'Maternity' && pat.status === 'Triage Pending') {
      return 5000;
    }
    if (pat.cardType === 'Emergency' && pat.status === 'Emergency Dispatched') {
      return pat.cardFee || 5000;
    }
    // Check general card fees or category
    if (pat.balance !== undefined && pat.balance > 0) {
      return pat.balance;
    }
    return pat.cardFee || 2000;
  };

  const handleSelectPatient = (pat: Patient) => {
    setSelectedPatient(pat);
    const suggested = getPendingBalanceSuggested(pat);
    setPayAmount(String(suggested));
    
    // Set appropriate purpose based on status
    if (pat.cardType === 'Maternity') {
      setPayPurpose('Maternity Card Registration');
    } else if (pat.cardType === 'Emergency') {
      setPayPurpose('Emergency Trauma Care Ticket');
    } else {
      setPayPurpose('OPD Registration & Card Fee');
    }
  };

  // Lab Queue Items
  const pendingLabQueueItems = queueItems.filter(
    (q: any) => q.queue_type === 'Cashier Lab Payment' && (q.status === 'Waiting' || q.status === 'Processing')
  );

  const filteredLabItems = pendingLabQueueItems.filter((q: any) => {
    const pat = patients.find(p => p.id === q.patient_id) || {};
    const cardType = pat.cardType || q.card_type || 'Standard';
    
    if (labCategoryFilter !== 'ALL') {
      if (labCategoryFilter === 'Standard' && cardType !== 'Standard' && cardType !== 'Regular') return false;
      if (labCategoryFilter === 'Maternity' && cardType !== 'Maternity') return false;
      if (labCategoryFilter === 'Emergency' && cardType !== 'Emergency' && q.priority !== 'Emergency') return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = (q.patient_name || pat.name || '').toLowerCase().includes(query);
      const hNumMatch = (q.hospital_number || pat.hospitalNumber || '').toLowerCase().includes(query);
      return nameMatch || hNumMatch;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6 text-[#2A758C]" /> Billing & Cashier Desk
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Accept card fees, settle bills, log daily PV expenses, and manage No Charge treatments.
          </p>
        </div>
          <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBalanceModalOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-white bg-[#2A758C] hover:bg-[#1f5869] px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Calculator className="h-4 w-4" />
            <span>Balance Day's Revenue</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
            <Clock className="h-4 w-4 text-[#2A758C]" />
            <span>Intranet Active Gateway</span>
          </div>
        </div>
      </div>

      {/* 2. Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Maternity Handover Alert Banner */}
      {maternitySupplies.filter((r: any) => r.status === 'Pending Handover').length > 0 && activeTab === 'billing' && (
        <div className="p-4 bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-pink-200 text-pink-900 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 border border-pink-300 flex items-center justify-center text-pink-700 shrink-0">
              <Baby className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900">
                  Maternity Ward Cash Handover Awaiting Reconcile
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#E11D48] text-white">
                  {maternitySupplies.filter((r: any) => r.status === 'Pending Handover').length} Pending
                </span>
              </div>
              <p className="text-[11px] text-pink-800 font-medium mt-0.5">
                Ward nurses collected bedside cash for delivery and baby supplies. Total pending physical cash:{' '}
                <strong className="font-mono text-pink-950 font-black">
                  ₦{maternitySupplies.filter((r: any) => r.status === 'Pending Handover').reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0).toLocaleString()}
                </strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('maternity-supplies')}
            className="px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE185D] text-white text-xs font-black shrink-0 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <span>Review & Balance Cash</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 3. KPI stats cards */}
      {activeTab === 'billing' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Pending Payments */}
          <div 
            onClick={() => setActiveTab('lab-payments')}
            className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5 hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="h-11 w-11 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono truncate">Pending Payments</span>
              <span className="text-lg font-black text-slate-900 block leading-tight">{pendingPaymentsCount}</span>
              <span className="text-[10px] font-mono font-bold text-amber-600 block truncate mt-0.5">
                ₦{pendingPaymentsSum.toLocaleString()} due
              </span>
            </div>
          </div>

          {/* Card 2: Discharge Bills */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group">
            <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
              <LogOut className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono truncate">Discharge Bills</span>
              <span className="text-lg font-black text-slate-900 block leading-tight">{dischargeBillsCount}</span>
              <span className="text-[10px] font-mono font-bold text-indigo-600 block truncate mt-0.5">
                ₦{dischargeBillsSum.toLocaleString()} due
              </span>
            </div>
          </div>

          {/* Card 3: Outstanding Balances */}
          <div 
            onClick={() => setActiveTab('outstanding')}
            className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5 hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="h-11 w-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 group-hover:scale-105 transition-transform">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono truncate">Outstanding Balances</span>
              <span className="text-lg font-black text-slate-900 block leading-tight">{outstandingBalancesCount}</span>
              <span className="text-[10px] font-mono font-bold text-rose-600 block truncate mt-0.5">
                ₦{outstandingTotalOwed.toLocaleString()} owed
              </span>
            </div>
          </div>

          {/* Card 4: Total Patients */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5 hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer group">
            <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono truncate">Total Patients</span>
              <span className="text-lg font-black text-slate-900 block leading-tight">{totalPatientsCount}</span>
              <span className="text-[10px] font-bold text-slate-400 block truncate mt-0.5">
                Registered in System
              </span>
            </div>
          </div>

          {/* Card 5: Revenue Collected */}
          <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3.5 hover:border-emerald-200 hover:shadow-sm transition-all cursor-pointer group">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono truncate">Revenue Collected</span>
              <span className="text-lg font-black text-emerald-700 block leading-tight">₦{totalCollected.toLocaleString()}</span>
              <span className="text-[10px] font-mono font-bold text-slate-500 block truncate mt-0.5">
                Cash ₦{cashTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      ) : activeTab === 'lab-payments' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#2A758C]/10 border border-[#2A758C]/20 flex items-center justify-center text-[#2A758C] shrink-0">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Pending Lab Requests</span>
              <span className="text-lg font-black text-slate-800">{pendingLabQueueItems.length} Patients</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Pending Lab Fee Sum</span>
              <span className="text-lg font-black text-slate-800">
                ₦{pendingLabQueueItems.reduce((acc: number, q: any) => {
                  const inv = invoices.find(i => i.patient_id === q.patient_id && i.status === 'Unpaid');
                  return acc + (inv ? Number(inv.amount || 0) : 0);
                }, 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Gateway Status</span>
              <span className="text-xs font-bold text-emerald-700">Ready for Cashier Collection</span>
            </div>
          </div>
        </div>
      ) : activeTab === 'vitae' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Total PV Expensed</span>
              <span className="text-lg font-black text-slate-800">₦{totalPVExpensed.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Largest PV Disbursement</span>
              <span className="text-lg font-black text-slate-800">₦{largestPVExpense.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#2A758C] shrink-0">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Disbursements Count</span>
              <span className="text-lg font-black text-slate-800">{totalPVCount} Receipts</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">No-Charge Total Absorbed</span>
              <span className="text-lg font-black text-slate-800">₦{totalNoChargeSettle.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <UserIcon className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Staff & Dependents Served</span>
              <span className="text-lg font-black text-slate-800">{totalNoChargeCount} Patients</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#2A758C] shrink-0">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Self (Staff) Treatments</span>
              <span className="text-lg font-black text-slate-800">{noChargeStaffSelfCount} Sessions</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Cashier Interactive Core */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          
          {/* Top Row: Search Lookup & Departmental Handovers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Section A: Search & Lookup */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3">1. Patient Account Lookup</h3>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Name, Hospital # or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 font-medium placeholder-slate-400"
                />
              </div>

              {/* Live Search dropdown results */}
              <AnimatePresence>
                {searchQuery && filteredPatients.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="mt-3 max-h-48 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-50 bg-white"
                  >
                    {filteredPatients.map((pat) => (
                      <button
                        key={pat.id}
                        onClick={() => {
                          handleSelectPatient(pat);
                          setSearchQuery('');
                        }}
                        className="w-full p-2.5 text-left text-xs hover:bg-slate-50 flex items-center justify-between transition-all"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{pat.name}</p>
                          <p className="text-[10px] text-[#2A758C] font-mono mt-0.5">{pat.hospitalNumber}</p>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase">
                          {pat.cardType || 'Patient'}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}

                {searchQuery && filteredPatients.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400 mt-2">
                    No matching patients found.
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Section B1: Departmental Cash Handovers */}
            {payments.filter(p => p.status === 'Unconfirmed').length > 0 ? (
              <div className="lg:col-span-1 bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-600" /> Departmental Handovers
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-200 text-amber-900 rounded-full animate-pulse">
                    {payments.filter(p => p.status === 'Unconfirmed').length} Unconfirmed
                  </span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Cash collected by OPD Nurses or Lab Scientists. Confirm receipt to balance revenue.
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {payments.filter(p => p.status === 'Unconfirmed').map(p => {
                    const pat = getPatientDetails(p.patientId);
                    return (
                      <div key={p.id} className="p-3 bg-white rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{pat.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{pat.hNum}</p>
                          </div>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            ₦{p.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Method: <strong className="text-slate-700">{p.paymentMethod}</strong></span>
                          <span className="font-mono text-slate-400">{p.datePaid ? p.datePaid.split('T')[0] : 'Today'}</span>
                        </div>
                        <button
                          onClick={() => handleConfirmHandover(p.id)}
                          disabled={isConfirmingHandover === p.id}
                          className="w-full mt-1 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          {isConfirmingHandover === p.id ? (
                            <Loader2 className="animate-spin h-3.5 w-3.5" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Confirm & Settle Handover</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Status Indicator</span>
                <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  All Departmental Handovers Settled
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Ready for active billing processing.</p>
              </div>
            )}
          </div>

          {/* SIDE-BY-SIDE INTERACTIVE BILLING WORKSPACE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LEFT COLUMN: Pending Billing Queues */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#2A758C]" /> 2. Pending Billing Queues
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                    3 Queue Categories
                  </span>
                </div>

                {/* THREE CATEGORIZED QUEUE TABS */}
                {(() => {
                  const emergencyList = queueItems.filter(q => q.status === 'Waiting' && (q.priority === 'Emergency' || q.cardType === 'Emergency' || q.patientCategory === 'Emergency' || (q.queue_type && q.queue_type.toLowerCase().includes('emergency'))));
                  const emergencyInvs = invoices.filter(inv => inv.status === 'Unpaid' && (inv.cardType === 'Emergency' || (inv.description && inv.description.toLowerCase().includes('emergency'))));
                  const regularList = queueItems.filter(q => q.status === 'Waiting' && q.priority !== 'Emergency' && q.cardType !== 'Emergency' && q.patientCategory !== 'Emergency' && (q.queue_type === 'Cashier Consultation Payment' || q.queue_type === 'Cashier Lab Payment' || q.queue_type === 'Cashier Pharmacy Payment' || q.queue_type === 'Cashier'));
                  const regularInvs = invoices.filter(inv => inv.status === 'Unpaid' && inv.cardType !== 'Emergency' && (!inv.description || !inv.description.toLowerCase().includes('emergency')));

                  return (
                    <>
                      <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl mb-3 border border-slate-200/60">
                        <button
                          type="button"
                          onClick={() => setPendingQueueTab('emergency')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            pendingQueueTab === 'emergency'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>Emergency</span>
                          {(emergencyList.length + emergencyInvs.length) > 0 && (
                            <span className={`px-1.5 py-0.2 text-[9px] font-black rounded-full ${pendingQueueTab === 'emergency' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'}`}>
                              {emergencyList.length + emergencyInvs.length}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPendingQueueTab('walkin')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            pendingQueueTab === 'walkin'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Walk-In</span>
                          {walkInPending.length > 0 && (
                            <span className={`px-1.5 py-0.2 text-[9px] font-black rounded-full ${pendingQueueTab === 'walkin' ? 'bg-white text-amber-800' : 'bg-amber-100 text-amber-900'}`}>
                              {walkInPending.length}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPendingQueueTab('regular')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            pendingQueueTab === 'regular'
                              ? 'bg-[#2A758C] text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Regular</span>
                          {(regularList.length + regularInvs.length) > 0 && (
                            <span className={`px-1.5 py-0.2 text-[9px] font-black rounded-full ${pendingQueueTab === 'regular' ? 'bg-white text-[#2A758C]' : 'bg-sky-100 text-sky-900'}`}>
                              {regularList.length + regularInvs.length}
                            </span>
                          )}
                        </button>
                      </div>

                      {isLoadingQueue ? (
                        <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin h-4 w-4 text-[#2A758C]" />
                          <span>Refreshing active billing queues...</span>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                          {/* TAB 1: EMERGENCY QUEUE */}
                          {pendingQueueTab === 'emergency' && (
                            <div>
                              {(emergencyList.length === 0 && emergencyInvs.length === 0) ? (
                                <div className="py-10 text-center text-xs text-slate-400 font-medium border border-dashed border-rose-200 rounded-xl bg-rose-50/30">
                                  <ShieldAlert className="h-7 w-7 text-rose-400 mx-auto mb-1.5" />
                                  <p className="font-bold text-rose-800">No emergency patients pending payment</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Emergency triage queues are completely clear.</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider font-mono flex items-center justify-between">
                                    <span>🚨 Priority Emergency Billing Queue</span>
                                    <span>{emergencyList.length + emergencyInvs.length} Pending</span>
                                  </p>
                                  {emergencyList.map(q => (
                                    <button
                                      key={q.id}
                                      onClick={() => handleSelectQueueItem(q)}
                                      className="w-full text-left p-3 rounded-xl text-xs bg-rose-50 hover:bg-rose-100/80 border border-rose-200 flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
                                    >
                                      <div className="truncate pr-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="px-1.5 py-0.2 text-[9px] font-black bg-rose-600 text-white rounded-md uppercase">EMERGENCY</span>
                                          <p className="font-bold text-slate-800 truncate group-hover:text-rose-950">{q.patient_name}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{q.hospital_number || '—'}</p>
                                      </div>
                                      <span className="text-[10px] bg-rose-600 text-white font-black px-3 py-1.5 rounded-lg shrink-0 shadow-2xs group-hover:scale-105 transition-all">
                                        Select & Pay
                                      </span>
                                    </button>
                                  ))}
                                  {emergencyInvs.map(inv => (
                                    <button
                                      key={inv.id}
                                      onClick={() => {
                                        const pat = patients.find(p => p.id === inv.patient_id);
                                        if (pat) {
                                          setSelectedPatient(pat);
                                          setPayAmount(String(inv.amount));
                                          setSelectedTotalBill(Number(inv.amount) || 0);
                                          setPayPurpose(inv.description || 'Emergency Treatment Bill');
                                          setPayRef(inv.id);
                                        }
                                      }}
                                      className="w-full text-left p-3 rounded-xl text-xs bg-rose-50/70 hover:bg-rose-100 border border-rose-200 flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
                                    >
                                      <div className="truncate pr-2">
                                        <p className="font-bold text-slate-800 truncate">{inv.patient_name}</p>
                                        <p className="text-[10px] text-rose-700 font-mono mt-0.5 truncate">{inv.description}</p>
                                      </div>
                                      <span className="text-[10px] bg-rose-600 text-white font-bold px-2.5 py-1 rounded-lg shrink-0 font-mono">
                                        ₦{parseFloat(inv.amount).toLocaleString()}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 2: WALK-IN PATIENTS */}
                          {pendingQueueTab === 'walkin' && (
                            <div>
                              {walkInPending.length === 0 ? (
                                <div className="py-10 text-center text-xs text-slate-400 font-medium border border-dashed border-amber-200 rounded-xl bg-amber-50/30">
                                  <Users className="h-7 w-7 text-amber-400 mx-auto mb-1.5" />
                                  <p className="font-bold text-amber-800">No walk-in laboratory patients pending verification</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">Direct walk-in lab registrations will appear here immediately.</p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono flex items-center justify-between">
                                    <span>🚶 Direct Walk-In Lab Patients</span>
                                    <span>{walkInPending.length} Waiting</span>
                                  </p>
                                  {walkInPending.map(item => (
                                    <button
                                      key={item.encounterId}
                                      onClick={() => handleSelectWalkInForBilling(item)}
                                      className="w-full text-left p-3 rounded-xl text-xs bg-amber-50/60 hover:bg-amber-100/80 border border-amber-200 flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
                                    >
                                      <div className="truncate pr-2">
                                        <p className="font-bold text-slate-800 truncate group-hover:text-amber-950">{item.patientName}</p>
                                        <p className="text-[10px] text-amber-800 font-medium truncate mt-0.5">{item.testsSummary || 'Laboratory Panel'}</p>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-xs font-black text-slate-900 font-mono block">₦{(item.totalAmount || 0).toLocaleString()}</span>
                                        <span className="text-[9px] bg-amber-600 text-white font-bold px-2 py-0.5 rounded-md mt-0.5 inline-block">
                                          Select & Pay
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TAB 3: REGULAR PENDING PAYMENTS */}
                          {pendingQueueTab === 'regular' && (
                            <div>
                              {(regularList.length === 0 && regularInvs.length === 0) ? (
                                <div className="py-10 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                  <CheckCircle2 className="h-7 w-7 text-emerald-400 mx-auto mb-1.5" />
                                  <p className="font-bold text-slate-700">No regular pending payments</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">OPD consultation & routine billing queues are clear.</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Consultation Group */}
                                  {regularList.filter(q => q.queue_type === 'Cashier Consultation Payment').length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 font-mono">
                                        ● OPD Consultation Fee (₦5,000)
                                      </p>
                                      <div className="space-y-1.5">
                                        {regularList.filter(q => q.queue_type === 'Cashier Consultation Payment').map(q => (
                                          <button
                                            key={q.id}
                                            onClick={() => handleSelectQueueItem(q)}
                                            className="w-full text-left p-2.5 rounded-xl text-xs bg-emerald-50/50 hover:bg-emerald-100/60 border border-emerald-100 flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
                                          >
                                            <div className="truncate pr-2">
                                              <p className="font-bold text-slate-800 truncate group-hover:text-emerald-950">{q.patient_name}</p>
                                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{q.hospital_number}</p>
                                            </div>
                                            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg shrink-0 shadow-2xs group-hover:scale-105 transition-all">
                                              Select & Pay
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Lab Group */}
                                  {regularList.filter(q => q.queue_type === 'Cashier Lab Payment').length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-[#2A758C] uppercase tracking-wider mb-1.5 font-mono">
                                        ● Doctor Lab Request Payment
                                      </p>
                                      <div className="space-y-1.5">
                                        {regularList.filter(q => q.queue_type === 'Cashier Lab Payment').map(q => (
                                          <button
                                            key={q.id}
                                            onClick={() => handleSelectQueueItem(q)}
                                            className="w-full text-left p-2.5 rounded-xl text-xs bg-sky-50/50 hover:bg-sky-100/60 border border-sky-100 flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
                                          >
                                            <div className="truncate pr-2">
                                              <p className="font-bold text-slate-800 truncate group-hover:text-sky-950">{q.patient_name}</p>
                                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{q.hospital_number}</p>
                                            </div>
                                            <span className="text-[10px] bg-[#2A758C] text-white font-bold px-2.5 py-1 rounded-lg shrink-0 shadow-2xs group-hover:scale-105 transition-all">
                                              Select & Pay
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Pharmacy Group */}
                                  {regularList.filter(q => q.queue_type === 'Cashier Pharmacy Payment').length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5 font-mono">
                                        ● Pharmacy Prescriptions
                                      </p>
                                      <div className="space-y-1.5">
                                        {regularList.filter(q => q.queue_type === 'Cashier Pharmacy Payment').map(q => (
                                          <button
                                            key={q.id}
                                            onClick={() => handleSelectQueueItem(q)}
                                            className="w-full text-left p-2.5 rounded-xl text-xs bg-amber-50/50 hover:bg-amber-100/60 border border-amber-100 flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
                                          >
                                            <div className="truncate pr-2">
                                              <p className="font-bold text-slate-800 truncate group-hover:text-amber-950">{q.patient_name}</p>
                                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{q.hospital_number}</p>
                                            </div>
                                            <span className="text-[10px] bg-amber-600 text-white font-bold px-2.5 py-1 rounded-lg shrink-0 shadow-2xs group-hover:scale-105 transition-all">
                                              Select & Pay
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Unpaid Regular Invoices */}
                                  {regularInvs.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 font-mono">
                                        ● Unpaid Outpatient Invoices
                                      </p>
                                      <div className="space-y-1.5">
                                        {regularInvs.map(inv => (
                                          <button
                                            key={inv.id}
                                            onClick={() => {
                                              const pat = patients.find(p => p.id === inv.patient_id);
                                              if (pat) {
                                                setSelectedPatient(pat);
                                                setPayAmount(String(inv.amount));
                                                setSelectedTotalBill(Number(inv.amount) || 0);
                                                setPayPurpose(inv.description);
                                                setPayRef(inv.id);
                                              }
                                            }}
                                            className="w-full text-left p-2.5 rounded-xl text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between transition-all group cursor-pointer shadow-2xs"
                                          >
                                            <div className="truncate pr-2">
                                              <p className="font-bold text-slate-800 truncate">{inv.patient_name}</p>
                                              <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{inv.description}</p>
                                            </div>
                                            <span className="text-[10px] bg-slate-800 text-white font-bold px-2.5 py-1 rounded-lg shrink-0 font-mono">
                                              ₦{parseFloat(inv.amount).toLocaleString()}
                                            </span>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* RIGHT COLUMN: Process Card / Bill Settlement Form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">3. Process Card / Bill Settlement</h3>
              
              {selectedPatient ? (
                <div className="space-y-4">
                  {/* Selected Patient info summary */}
                  <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl relative space-y-2">
                    <button 
                      onClick={() => setSelectedPatient(null)}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-all cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{selectedPatient.name}</p>
                      <p className="text-[10px] text-[#2A758C] font-mono mt-0.5">{selectedPatient.hospitalNumber}</p>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-100/60 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block font-medium">Category:</span>
                        <span className="font-bold text-slate-700">{selectedPatient.patientCategory || 'Individual'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Card Category:</span>
                        <span className={`font-bold uppercase ${
                          selectedPatient.cardType === 'Emergency' 
                            ? 'text-rose-600' 
                            : selectedPatient.cardType === 'Maternity'
                            ? 'text-purple-600'
                            : 'text-emerald-600'
                        }`}>
                          {selectedPatient.cardType || 'Standard'} Card
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Gender / DOB:</span>
                        <span className="font-semibold text-slate-700">{selectedPatient.gender || 'N/A'}, {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Phone:</span>
                        <span className="font-mono text-slate-700">{selectedPatient.phoneNumber || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Discount Request / HR Approval Section */}
                  {(() => {
                    const approvedDisc = discountRequestsList.find(d => d.patient_id === selectedPatient.id && d.status === 'Approved');
                    const pendingDisc = discountRequestsList.find(d => d.patient_id === selectedPatient.id && d.status === 'Pending');

                    if (approvedDisc) {
                      return (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5 text-emerald-800">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> HR Approved Discount Applied
                            </span>
                            <span className="bg-emerald-200 text-emerald-950 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                              HR Authorized
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800">
                            Original: <strong className="line-through">₦{parseFloat(approvedDisc.original_amount).toLocaleString()}</strong> → Discount: <strong>-₦{parseFloat(approvedDisc.calculated_discount).toLocaleString()} ({approvedDisc.discount_type === 'Percentage' ? `${approvedDisc.discount_value}%` : `₦${parseFloat(approvedDisc.discount_value).toLocaleString()}`})</strong>
                          </p>
                          <div className="font-mono font-black text-xs text-emerald-900 flex justify-between pt-1 border-t border-emerald-200/80">
                            <span>Discounted Payable:</span>
                            <span>₦{parseFloat(approvedDisc.final_amount).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    }

                    if (pendingDisc) {
                      return (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center justify-between shadow-2xs">
                          <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                            <Clock className="h-4 w-4 text-amber-600 animate-spin" /> Discount Request Pending HR Approval
                          </span>
                          <span className="font-mono text-[11px] font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md">
                            {pendingDisc.discount_type === 'Percentage' ? `${pendingDisc.discount_value}%` : `₦${parseFloat(pendingDisc.discount_value).toLocaleString()}`} Requested
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => handleOpenDiscountModal({
                          patientId: selectedPatient.id,
                          patientName: selectedPatient.name,
                          hospitalNumber: selectedPatient.hospitalNumber,
                          invoiceId: payRef || undefined,
                          originalAmount: selectedTotalBill || parseFloat(payAmount) || 0
                        })}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Percent className="h-4 w-4 text-amber-100" />
                        <span>Request Discount → HR Approval Required</span>
                      </button>
                    );
                  })()}

                  {/* Form to process */}
                  <form onSubmit={handleRecordPaymentSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Purpose</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Registration Card Fee"
                        value={payPurpose}
                        onChange={(e) => setPayPurpose(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {selectedPatient?.cardType === 'Emergency' || selectedPatient?.patientCategory === 'Emergency' ? 'Amount Collected Now (₦)' : 'Amount to Collect (₦)'}
                          </label>
                          {selectedTotalBill > 0 && (
                            <span className="text-[10px] font-mono font-bold text-[#2A758C] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                              Max: ₦{selectedTotalBill.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          required
                          placeholder="0.00"
                          max={selectedTotalBill > 0 ? selectedTotalBill : undefined}
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                        <select
                          value={payMethod}
                          onChange={(e) => setPayMethod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                        >
                          <option value="Cash">Cash</option>
                          <option value="POS">POS Terminal</option>
                          <option value="Transfer">Bank Transfer</option>
                          <option value="Insurance">Insurance Claim</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Receipt Ref / Invoice # (Optional)</label>
                      <input
                        type="text"
                        placeholder="Auto-generated if left blank"
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
                      />
                    </div>

                    {selectedTotalBill > 0 && parseFloat(payAmount) < selectedTotalBill && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center justify-between font-medium">
                        <span>Remaining Balance:</span>
                        <span className="font-mono font-bold text-amber-900">₦{Math.max(0, selectedTotalBill - (parseFloat(payAmount) || 0)).toLocaleString()} → Outstanding Balances</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#2A758C] hover:bg-[#1f5869] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4 text-white" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Collect Amount {payAmount ? `(₦${parseFloat(payAmount || '0').toLocaleString()})` : ''}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                  <UserIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No patient account selected</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs mx-auto">
                    Select a patient from the Pending Billing Queue on the left, or search using the account lookup box above.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* FULL-WIDTH TRANSACTIONS LOG LEDGER */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-[#2A758C]" /> 4. Transactions Log Ledger
              </h3>
              
              <div className="flex flex-wrap items-center gap-3">
                <ExportButton
                  exportType="financials"
                  label="Download Ledger"
                  className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-extrabold"
                  onSuccess={(msg) => setSuccess(msg)}
                  onFailure={(msg) => setError(msg)}
                />

                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setFilterMethod('ALL')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${filterMethod === 'ALL' ? 'bg-[#2A758C] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    All Payments
                  </button>
                  <button
                    onClick={() => setFilterMethod('CASH')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${filterMethod === 'CASH' ? 'bg-[#2A758C] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => setFilterMethod('POS')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${filterMethod === 'POS' ? 'bg-[#2A758C] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    POS
                  </button>
                  <button
                    onClick={() => setFilterMethod('TRANSFER')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${filterMethod === 'TRANSFER' ? 'bg-[#2A758C] text-white shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Transfer
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-mono text-[10px] font-bold uppercase">
                    <th className="pb-3">Patient Details</th>
                    <th className="pb-3">Reference ID</th>
                    <th className="pb-3">Payment Method</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Date / Clerk</th>
                    <th className="pb-3 text-right">Status & Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700">
                  {filteredPayments.length > 0 ? (
                    filteredPayments.map((p) => {
                      const details = getPatientDetails(p.patientId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 transition-all">
                          <td className="py-3">
                            <p className="font-bold text-slate-800">{details.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{details.hNum}</p>
                          </td>
                          <td className="py-3 font-mono text-[10px] text-[#2A758C] font-semibold">
                            {p.invoiceId || 'PAY-ONLINE'}
                          </td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase ${
                              p.paymentMethod === 'Cash' 
                                ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                : p.paymentMethod === 'POS'
                                ? 'bg-indigo-50 text-indigo-800 border border-indigo-200/60'
                                : 'bg-blue-50 text-blue-800 border border-blue-200/60'
                            }`}>
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 font-mono font-black text-slate-800">
                            ₦{p.amount.toLocaleString()}
                          </td>
                          <td className="py-3">
                            <p className="text-[10px] text-slate-600 font-semibold">{new Date(p.datePaid).toLocaleDateString()}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Clerk: {getCollectorName(p.collectedBy)}</p>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold text-[9px] px-2.5 py-1 rounded-full uppercase border border-emerald-200/60 shrink-0">
                                <CheckCircle className="h-3 w-3 text-emerald-500" /> Completed
                              </span>
                              <ExportButton
                                exportType="receipt"
                                paymentId={p.id}
                                label="Receipt"
                                className="!py-1 !px-2.5 bg-slate-100 border border-slate-300 font-black text-[10px] h-7 flex items-center justify-center rounded-lg text-black hover:bg-slate-200 shrink-0 cursor-pointer"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Receipt className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-xs">No recorded transactions found</p>
                        <p className="text-[10px] text-slate-400 mt-1">Try switching the method filters above or process a new bill settlement.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 4b. Doctor Lab Requests Tab Layout */}
      {activeTab === 'lab-payments' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-[#2A758C]" /> Doctor Laboratory Payment Requests
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage live lab collection queue and access permanent database records of all settled laboratory transactions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Sub-tab Switcher */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setLabSubTab('pending')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    labSubTab === 'pending' ? 'bg-[#2A758C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Pending Requests</span>
                  {pendingLabQueueItems.length > 0 && (
                    <span className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                      labSubTab === 'pending' ? 'bg-white text-[#2A758C]' : 'bg-rose-500 text-white'
                    }`}>
                      {pendingLabQueueItems.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLabSubTab('history')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    labSubTab === 'history' ? 'bg-[#2A758C] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Stored Payment Records</span>
                  <span className={`px-1.5 py-0.2 text-[10px] font-black rounded-full ${
                    labSubTab === 'history' ? 'bg-white text-[#2A758C]' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {labHistoryRecords.length}
                  </span>
                </button>
              </div>

              <select
                value={labCategoryFilter}
                onChange={(e) => setLabCategoryFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Card Types</option>
                <option value="Standard">Regular / Standard Card</option>
                <option value="Maternity">Maternity Card</option>
                <option value="Emergency">Emergency Card</option>
              </select>
            </div>
          </div>

          {labSubTab === 'pending' ? (
            filteredLabItems.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
                <FlaskConical className="h-10 w-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Pending Lab Requests</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  There are currently no doctor lab payment requests waiting for cashier collection. Switch to <strong>Stored Payment Records</strong> to view completed transactions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLabItems.map((q: any) => {
                  const pat = patients.find(p => p.id === q.patient_id) || {};
                  const inv = invoices.find(i => (i.encounter_id === q.encounter_id || i.patient_id === q.patient_id) && i.status === 'Unpaid');
                  const cardType = pat.cardType || q.card_type || 'Standard';
                  const totalAmount = inv ? Number(inv.amount || 0) : 0;
                  const invDesc = inv?.description || 'Laboratory Investigations Fee';

                  let testList: string[] = [];
                  if (invDesc.includes(':')) {
                    const testsPart = invDesc.split(':')[1];
                    if (testsPart) {
                      testList = testsPart.split(',').map(s => s.trim()).filter(Boolean);
                    }
                  }

                  return (
                    <div key={q.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between hover:border-[#2A758C]/40 transition-all">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-black text-slate-800 text-sm">{q.patient_name || pat.name || 'Outpatient'}</h4>
                            <span className="text-[11px] font-mono text-[#2A758C] font-semibold">{q.hospital_number || pat.hospitalNumber || '—'}</span>
                          </div>
                          {cardType === 'Emergency' || q.priority === 'Emergency' ? (
                            <span className="px-2.5 py-1 text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 rounded-lg uppercase tracking-wider">
                              Emergency Card
                            </span>
                          ) : cardType === 'Maternity' ? (
                            <span className="px-2.5 py-1 text-[10px] font-black bg-pink-100 text-pink-800 border border-pink-200 rounded-lg uppercase tracking-wider">
                              Maternity Card
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-200 rounded-lg uppercase tracking-wider">
                              Regular Card
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                          <p><strong>Ordering Doctor:</strong> {q.processed_by || 'Consulting Doctor'}</p>
                          <p className="font-mono text-[10px] text-slate-400">Request Time: {q.arrival_time ? new Date(q.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}</p>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Requested Lab Tests</span>
                          {testList.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {testList.map((t, idx) => (
                                <span key={idx} className="bg-slate-100 text-slate-800 text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-slate-200/80">
                                  {t}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">{invDesc}</p>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider font-mono">Total Fee:</span>
                          <span className="text-base font-black text-slate-800">₦{totalAmount.toLocaleString()}</span>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                {cardType === 'Emergency' || q.priority === 'Emergency' ? 'Amount Collected Now (₦)' : 'Amount to Collect (₦)'}
                              </label>
                              <span className="text-[10px] font-mono font-bold text-[#2A758C] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                Max: ₦{totalAmount.toLocaleString()}
                              </span>
                            </div>
                            <input
                              type="number"
                              placeholder={String(totalAmount)}
                              value={labCustomAmounts[q.id] !== undefined ? labCustomAmounts[q.id] : String(totalAmount)}
                              onChange={(e) => setLabCustomAmounts(prev => ({ ...prev, [q.id]: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-mono font-bold focus:ring-2 focus:ring-[#2A758C] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={labPayMethods[q.id] || 'Cash'}
                              onChange={(e) => setLabPayMethods(prev => ({ ...prev, [q.id]: e.target.value }))}
                              className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-2.5 py-2.5 text-slate-800 focus:outline-none flex-1 cursor-pointer"
                            >
                              <option value="Cash">Cash</option>
                              <option value="POS">POS Terminal</option>
                              <option value="Transfer">Bank Transfer</option>
                            </select>

                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={() => handleConfirmLabPayment(q, totalAmount, inv?.id)}
                              className="bg-[#2A758C] hover:bg-[#1f5869] text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                              <span>Collect Amount</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Stored Payment Records Sub-Tab */
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Total Stored Lab Revenue</h4>
                  <span className="text-xl font-black text-slate-800">
                    ₦{labHistoryRecords.reduce((sum: number, rec: any) => sum + Number(rec.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Records Count</span>
                  <p className="text-lg font-black text-[#2A758C]">{labHistoryRecords.length} Saved Entries</p>
                </div>
              </div>

              {labHistoryRecords.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center space-y-3">
                  <Receipt className="h-10 w-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">No Stored Lab Payment Records</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When cashier collects lab payments, permanent records will be automatically logged and retrieved here.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider font-mono">
                          <th className="p-4">Date & Time</th>
                          <th className="p-4">Patient Name</th>
                          <th className="p-4">Hospital #</th>
                          <th className="p-4">Card Type</th>
                          <th className="p-4">Lab Investigations Summary</th>
                          <th className="p-4">Amount</th>
                          <th className="p-4">Method</th>
                          <th className="p-4">Cashier</th>
                          <th className="p-4 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {labHistoryRecords
                          .filter((rec: any) => {
                            if (labCategoryFilter !== 'ALL') {
                              if (labCategoryFilter === 'Standard' && rec.card_type !== 'Standard' && rec.card_type !== 'Regular') return false;
                              if (labCategoryFilter === 'Maternity' && rec.card_type !== 'Maternity') return false;
                              if (labCategoryFilter === 'Emergency' && rec.card_type !== 'Emergency') return false;
                            }
                            if (searchQuery) {
                              const q = searchQuery.toLowerCase();
                              const nameMatch = (rec.patient_name || '').toLowerCase().includes(q);
                              const hNumMatch = (rec.hospital_number || '').toLowerCase().includes(q);
                              const testsMatch = (rec.tests_summary || '').toLowerCase().includes(q);
                              return nameMatch || hNumMatch || testsMatch;
                            }
                            return true;
                          })
                          .map((rec: any) => (
                            <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="p-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {rec.date_paid ? new Date(rec.date_paid).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                              </td>
                              <td className="p-4 font-extrabold text-slate-800">{rec.patient_name || 'Outpatient'}</td>
                              <td className="p-4 font-mono font-bold text-[#2A758C]">{rec.hospital_number || '—'}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-wider ${
                                  rec.card_type === 'Emergency' ? 'bg-rose-100 text-rose-800' :
                                  rec.card_type === 'Maternity' ? 'bg-pink-100 text-pink-800' :
                                  'bg-sky-100 text-sky-800'
                                }`}>
                                  {rec.card_type || 'Standard'}
                                </span>
                              </td>
                              <td className="p-4 text-slate-600 max-w-xs truncate" title={rec.tests_summary}>
                                {rec.tests_summary || 'Laboratory Investigations'}
                              </td>
                              <td className="p-4 font-black text-slate-900 font-mono">₦{Number(rec.amount || 0).toLocaleString()}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200/80">
                                  {rec.payment_method || 'Cash'}
                                </span>
                              </td>
                              <td className="p-4 text-slate-500 font-bold text-[11px]">{rec.collected_by || 'Cashier'}</td>
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => window.print()}
                                  className="p-1.5 text-slate-400 hover:text-[#2A758C] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Print Receipt"
                                >
                                  <Printer className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4.1. Eye Clinic Registrations Tab */}
      {activeTab === 'iclinic-registrations' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Eye className="h-6 w-6 text-[#A3D1E0]" />
                <h3 className="text-lg font-bold">Eye Clinic - Patient Registration Billing</h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Process New Patient Eye Clinic Card Fees (₦3,000) or approved outstanding bills before patients proceed to Eye Clinic consultation.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-right">
              <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">Pending Registrations</span>
              <span className="text-2xl font-black text-[#A3D1E0] font-mono">{eyeRegistrationsList.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-[#2A758C]" />
                Queue of Eye Clinic Registrations Awaiting Payment / Verification
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                Auto-synced with Eye Clinic Registration Desk
              </span>
            </div>

            {eyeRegistrationsList.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mx-auto mb-2" />
                <p className="text-xs font-semibold">No pending Eye Clinic registrations in queue.</p>
                <p className="text-[11px] text-slate-400 mt-1">When a patient registers in the Eye Clinic, they will appear here instantly for billing.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eyeRegistrationsList.map(pat => {
                  const payAmt = eyePayAmounts[pat.id] || '3000';
                  const payMeth = eyePayMethods[pat.id] || 'Cash';
                  return (
                    <div key={pat.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3 relative hover:shadow-sm transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 bg-[#2A758C]/10 text-[#2A758C] font-mono text-[10px] font-bold rounded-md">
                            {pat.hospitalNumber}
                          </span>
                          <h5 className="text-sm font-bold text-slate-900 mt-1">{pat.name}</h5>
                          <p className="text-[11px] text-slate-500">{pat.phoneNumber} • {pat.dateOfBirth || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg block">
                            ₦3,000 Card Fee
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">Eye Clinic</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                        <div><strong className="text-slate-700">Chief Complaint:</strong> {pat.chiefComplaint || 'N/A'}</div>
                        <div><strong className="text-slate-700">Next of Kin:</strong> {pat.nextOfKin || 'N/A'}</div>
                        <div><strong className="text-slate-700">Address:</strong> {pat.address || 'N/A'}</div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Amount Collecting (₦)</label>
                          <input
                            type="number"
                            value={payAmt}
                            onChange={e => setEyePayAmounts({ ...eyePayAmounts, [pat.id]: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Payment Method</label>
                          <select
                            value={payMeth}
                            onChange={e => setEyePayMethods({ ...eyePayMethods, [pat.id]: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold"
                          >
                            <option value="Cash">Cash</option>
                            <option value="POS">POS Terminal</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Approved Outstanding Bill">Approved Outstanding Bill</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => handleVerifyEyeRegistration(pat)}
                        className="w-full py-2.5 bg-[#2A758C] hover:bg-[#1f5869] text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="h-4 w-4 text-[#A3D1E0]" />
                        <span>Verify Payment & Send Patient to Consultations</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4.5. Walk-In Lab Payment Verification Tab */}
      {activeTab === 'walkin-verify' && (
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#2A758C]" />
                  Walk-in Lab Payment Verification
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 uppercase font-mono">
                  Forwarded from Laboratory
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Review complete registration forms and verify payments for walk-in patients registered in the Laboratory department. Once confirmed, patients are automatically routed to Laboratory for testing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl text-center">
                <span className="block text-[10px] font-black text-amber-800 uppercase tracking-widest font-mono">Pending Verification</span>
                <span className="text-lg font-black text-amber-900">{walkInPending.length} Patients</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl text-center">
                <span className="block text-[10px] font-black text-emerald-800 uppercase tracking-widest font-mono">Verified & Paid</span>
                <span className="text-lg font-black text-emerald-900">{walkInPaid.length} Patients</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search walk-in patient name, hospital ID, phone, referring doctor, or test name..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2A758C]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Grid of Walk-in Pending Verification Cards */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Awaiting Cashier Payment Verification ({walkInPending.filter(p => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  (p.patientName || '').toLowerCase().includes(q) ||
                  (p.hospitalNumber || '').toLowerCase().includes(q) ||
                  (p.phoneNumber || '').toLowerCase().includes(q) ||
                  (p.referringDoctor || '').toLowerCase().includes(q) ||
                  (p.testsSummary || '').toLowerCase().includes(q)
                );
              }).length})</span>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                ● Forwarded from Laboratory
              </span>
            </h4>

            {walkInPending.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                <h5 className="text-sm font-bold text-slate-800">All Forwarded Walk-In Payments Verified</h5>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  There are currently no walk-in laboratory patient registrations awaiting cashier payment verification.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {walkInPending
                  .filter(p => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (p.patientName || '').toLowerCase().includes(q) ||
                      (p.hospitalNumber || '').toLowerCase().includes(q) ||
                      (p.phoneNumber || '').toLowerCase().includes(q) ||
                      (p.referringDoctor || '').toLowerCase().includes(q) ||
                      (p.testsSummary || '').toLowerCase().includes(q)
                    );
                  })
                  .map((item: any, index: number) => {
                    const isSelected = selectedWalkInVerify?.encounterId === item.encounterId;

                    return (
                      <div
                        key={item.encounterId || index}
                        className={`bg-white rounded-3xl border transition-all p-6 space-y-5 flex flex-col justify-between shadow-xs ${
                          isSelected ? 'border-[#2A758C] ring-2 ring-[#2A758C]/20' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Top Header */}
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-black text-slate-900">{item.patientName}</h4>
                                <span className="px-2 py-0.5 text-[9px] font-extrabold bg-amber-100 text-amber-800 rounded-md font-mono border border-amber-200">
                                  UNCONFIRMED
                                </span>
                              </div>
                              <p className="text-xs font-mono text-[#2A758C] font-extrabold mt-0.5">
                                ID: {item.hospitalNumber || 'HOSP-LAB-NEW'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="block text-[10px] font-mono text-slate-400 uppercase font-bold">Forwarded At</span>
                              <span className="text-xs font-bold text-slate-600">
                                {item.dateRegistered ? new Date(item.dateRegistered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                              </span>
                            </div>
                          </div>

                          {/* Patient Registration Form Details Grid */}
                          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs space-y-2.5">
                            <div className="grid grid-cols-2 gap-2 text-slate-700">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">DOB / Gender</span>
                                <span className="font-semibold text-slate-900">{item.dob || '—'} ({item.gender || '—'})</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Marital Status</span>
                                <span className="font-semibold text-slate-900">{item.maritalStatus || 'Single'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Phone Number</span>
                                <span className="font-semibold text-slate-900">{item.phoneNumber || '—'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Referring Doctor</span>
                                <span className="font-semibold text-indigo-700">{item.referringDoctor || 'Outside Doctor'}</span>
                              </div>
                            </div>
                            <div className="pt-2 border-t border-slate-200/60">
                              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Residential Address</span>
                              <span className="font-medium text-slate-800">{item.address || 'Not Provided'}</span>
                            </div>
                          </div>

                          {/* Selected Lab Tests Modal Trigger Button */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => setViewTestsModal(item)}
                              className="w-full px-4 py-2.5 bg-[#2A758C]/10 hover:bg-[#2A758C]/20 text-[#2A758C] border border-[#2A758C]/30 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                            >
                              <FlaskConical className="h-4 w-4" />
                              <span>View Ordered Tests ({item.testCount || (item.testsList?.length || 1)})</span>
                            </button>
                          </div>
                        </div>

                        {/* Payment Verification Controls */}
                        <div className="pt-4 border-t border-slate-100 space-y-3 bg-slate-50/50 p-4 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider font-mono">Total Payable Fee:</span>
                            <span className="text-xl font-black text-[#2A758C] font-mono">
                              ₦{(item.totalAmount || 0).toLocaleString()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Amount Collected Now (₦)
                                </label>
                                <span className="text-[10px] font-mono font-bold text-[#2A758C] bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                                  Max: ₦{(item.totalAmount || 0).toLocaleString()}
                                </span>
                              </div>
                              <input
                                type="number"
                                placeholder={String(item.totalAmount || 0)}
                                value={walkInCustomAmounts[item.encounterId] !== undefined ? walkInCustomAmounts[item.encounterId] : String(item.totalAmount || 0)}
                                onChange={(e) => setWalkInCustomAmounts(prev => ({ ...prev, [item.encounterId]: e.target.value }))}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-mono font-bold focus:ring-2 focus:ring-[#2A758C] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={isSelected ? walkInVerifyPayMethod : 'Cash'}
                                onChange={(e) => {
                                  setSelectedWalkInVerify(item);
                                  setWalkInVerifyPayMethod(e.target.value);
                                }}
                                className="bg-white border border-slate-200 text-xs font-bold rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none flex-1 cursor-pointer"
                              >
                                <option value="Cash">Cash</option>
                                <option value="POS">POS Terminal</option>
                                <option value="Transfer">Bank Transfer</option>
                              </select>

                              <button
                                type="button"
                                disabled={isVerifyingWalkIn}
                                onClick={() => {
                                  setSelectedWalkInVerify(item);
                                  handleConfirmWalkInVerification(item);
                                }}
                                className="bg-[#2A758C] hover:bg-[#1f5869] text-white text-xs font-black px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                              >
                                {isVerifyingWalkIn && isSelected ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                                )}
                                <span>Collect Amount</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Verified / Paid Walk-In History Ledger */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                Verified & Confirmed Walk-In Payments ({walkInPaid.length})
              </h4>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Ready / In Progress in Laboratory
              </span>
            </div>

            {walkInPaid.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No confirmed walk-in lab payments recorded yet today.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-mono text-[10px] font-bold uppercase">
                      <th className="pb-3">Patient Name & ID</th>
                      <th className="pb-3">Contact & Address</th>
                      <th className="pb-3">Referring Doctor</th>
                      <th className="pb-3">Lab Tests</th>
                      <th className="pb-3">Amount Paid</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {walkInPaid.map((p, idx) => (
                      <tr key={p.encounterId || idx} className="hover:bg-slate-50">
                        <td className="py-3">
                          <p className="font-bold text-slate-800">{p.patientName}</p>
                          <p className="text-[10px] text-[#2A758C] font-mono mt-0.5">{p.hospitalNumber}</p>
                        </td>
                        <td className="py-3">
                          <p className="font-semibold text-slate-800">{p.phoneNumber}</p>
                          <p className="text-[10px] text-slate-400">{p.address}</p>
                        </td>
                        <td className="py-3 text-indigo-700 font-medium">
                          {p.referringDoctor || 'Outside Doctor'}
                        </td>
                        <td className="py-3">
                          <p className="font-semibold text-slate-800">{p.testsSummary}</p>
                        </td>
                        <td className="py-3 font-mono font-black text-slate-900">
                          ₦{p.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 text-right">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Verified & Sent to Lab
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Payment Vitae (Daily Expenses PV) Tab Layout */}
      {activeTab === 'vitae' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Log Daily Expense (Payment Vitae)
              </h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Record and dispense cash for immediate clinic operating costs as approved by the physician on duty.
              </p>
              
              <form onSubmit={handleRecordPVSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe (Cleaner)"
                    value={pvPersonName}
                    onChange={(e) => setPvPersonName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expense Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Purchased 5L liquid antiseptic soap"
                    value={pvDescription}
                    onChange={(e) => setPvDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount Dispensed (₦)</label>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={pvAmount}
                      onChange={(e) => setPvAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Approving Doctor</label>
                    <select
                      value={pvApprovedByDoctor}
                      onChange={(e) => setPvApprovedByDoctor(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                    >
                      <option value="Dr. Alan Smith">Dr. Alan Smith</option>
                      <option value="Dr. Michael Johnson">Dr. Michael Johnson</option>
                      <option value="Dr. Clara Vance">Dr. Clara Vance</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2A758C] hover:bg-[#1f5869] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" /> Disburse Approved Cash
                </button>
              </form>
            </div>
          </div>

          {/* Ledger Column */}
          <div className="lg:col-span-2">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-[#2A758C]" /> Daily Payment Vitae (PV) Ledger
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-mono text-[10px] font-bold uppercase">
                      <th className="pb-2.5">Recipient Details</th>
                      <th className="pb-2.5">Purpose / Description</th>
                      <th className="pb-2.5">Amount Disbursed</th>
                      <th className="pb-2.5">Approved By</th>
                      <th className="pb-2.5 text-right">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {paymentVitae.length > 0 ? (
                      paymentVitae.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-3">
                            <p className="font-bold text-slate-800">{v.personName}</p>
                          </td>
                          <td className="py-3 text-slate-600 font-medium">
                            {v.description}
                          </td>
                          <td className="py-3 font-mono font-bold text-rose-600">
                            - ₦{v.amount.toLocaleString()}
                          </td>
                          <td className="py-3 font-semibold text-slate-600 text-[11px]">
                            {v.approvedByDoctor}
                          </td>
                          <td className="py-3 text-right text-[10px] text-slate-400 font-mono">
                            {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400">
                          <Receipt className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                          <p className="font-medium text-xs">No Payment Vitae logged today</p>
                          <p className="text-[10px] text-slate-400 mt-1">Dispense approved expenditures to seed the log ledger.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. No Charge Patient approvals Layout */}
      {activeTab === 'no-charge' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Log No-Charge Staff Treatment
              </h3>
              <p className="text-[11px] text-[#2A758C] font-semibold leading-normal">
                Authorized for clinic staff, their dependents, and relatives of the Medical Director.
              </p>
              
              <form onSubmit={handleRecordNoChargeSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Staff Beneficiary Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nurse Jane Doe"
                    value={ncStaffName}
                    onChange={(e) => setNcStaffName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Relationship</label>
                    <select
                      value={ncRelationship}
                      onChange={(e) => setNcRelationship(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                    >
                      <option value="Self">Self (Staff)</option>
                      <option value="Child">Child / Dependent</option>
                      <option value="Spouse">Spouse / Dependent</option>
                      <option value="MD Relative">MD Relative</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Estimated Cost (₦)</label>
                    <input
                      type="number"
                      required
                      placeholder="0"
                      value={ncTreatmentCost}
                      onChange={(e) => setNcTreatmentCost(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Link Registered Patient (Optional)
                  </label>
                  <select
                    value={ncPatientId}
                    onChange={(e) => setNcPatientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                  >
                    <option value="">-- No linked EMR profile --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.hospitalNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Treatment Details</label>
                  <textarea
                    required
                    placeholder="e.g. Free malaria therapy treatment and pharmacy dispensing"
                    value={ncTreatmentDescription}
                    onChange={(e) => setNcTreatmentDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Approving Doctor</label>
                  <select
                    value={ncApprovedByDoctor}
                    onChange={(e) => setNcApprovedByDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                  >
                    <option value="Dr. Alan Smith">Dr. Alan Smith</option>
                    <option value="Dr. Michael Johnson">Dr. Michael Johnson</option>
                    <option value="Dr. Clara Vance">Dr. Clara Vance</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#2A758C] hover:bg-[#1f5869] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" /> Log Approved Treatment
                </button>
              </form>
            </div>
          </div>

          {/* Ledger Column */}
          <div className="lg:col-span-2">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <UserIcon className="h-4 w-4 text-[#2A758C]" /> No-Charge Patient Records Ledger
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-mono text-[10px] font-bold uppercase">
                      <th className="pb-2.5">Beneficiary / Staff</th>
                      <th className="pb-2.5">Relationship</th>
                      <th className="pb-2.5">Treatment Details</th>
                      <th className="pb-2.5">Settle Cost</th>
                      <th className="pb-2.5">Approved By</th>
                      <th className="pb-2.5 text-right">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    {noChargeRecords.length > 0 ? (
                      noChargeRecords.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-3">
                            <p className="font-bold text-slate-800">{r.staffName}</p>
                            {r.patientName && (
                              <p className="text-[10px] text-[#2A758C] font-mono mt-0.5">
                                EMR: {r.patientName} ({r.hospitalNumber})
                              </p>
                            )}
                          </td>
                          <td className="py-3">
                            <span className="px-2 py-0.5 bg-sky-50 text-[#2A758C] border border-sky-100 rounded-full text-[9px] font-bold uppercase">
                              {r.relationship}
                            </span>
                          </td>
                          <td className="py-3 text-slate-600 font-medium">
                            {r.treatmentDescription}
                          </td>
                          <td className="py-3 font-mono font-bold text-slate-700">
                            ₦{r.treatmentCost.toLocaleString()}
                          </td>
                          <td className="py-3 font-semibold text-slate-600 text-[11px]">
                            {r.approvedByDoctor}
                          </td>
                          <td className="py-3 text-right text-[10px] text-slate-400 font-mono">
                            {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <UserIcon className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                          <p className="font-medium text-xs">No No-Charge patient treatments logged</p>
                          <p className="text-[10px] text-slate-400 mt-1">Authorized zero-charge entries will be catalogued here.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Outstanding Balances Section */}
      {activeTab === 'outstanding' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" /> Active Outstanding Balances & Patient Debts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Patients holding pending balances or partial payments. Cashiers can record payments directly and update balances.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 bg-rose-50 text-rose-700 font-mono font-bold text-xs rounded-xl border border-rose-200 shadow-2xs">
                Total Hospital Outstanding Debt: ₦{outstandingList.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-3">Hospital Number</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Fee Purpose</th>
                    <th className="p-3">What is owed</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {outstandingList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-8 text-xs text-slate-400 font-medium">
                        No active outstanding balances recorded. All patient bills are fully settled!
                      </td>
                    </tr>
                  ) : (
                    outstandingList.map((item) => (
                      <tr key={item.id} className="text-xs hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#2A758C] align-top pt-4">
                          {item.hospital_number}
                        </td>
                        <td className="p-3 font-extrabold text-slate-900 align-top pt-4">
                          <div>{item.patient_name}</div>
                          {item.phone_number && (
                            <div className="text-[10px] text-slate-400 font-normal font-mono">{item.phone_number}</div>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 font-medium align-top pt-4">
                          <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg text-[11px] font-semibold inline-block">
                            {item.purpose || 'Hospital Fee'}
                          </span>
                        </td>
                        
                        {/* What is owed Column */}
                        <td className="p-3 align-top">
                          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 space-y-1.5 min-w-[240px]">
                            {/* Department Owed */}
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Department:</span>
                              <span className="font-extrabold text-[#2A758C] bg-[#2A758C]/10 border border-[#2A758C]/20 px-2 py-0.5 rounded-md">
                                {item.department_owed || item.department || 'Hospital Services'}
                              </span>
                            </div>

                            {/* Total Amount Owed */}
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">Total Amount Owed:</span>
                              <span className="font-mono font-extrabold text-slate-800">
                                ₦{parseFloat(item.total_bill || 0).toLocaleString()}
                              </span>
                            </div>

                            {/* Total Remaining Owed */}
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                              <span className="text-rose-600 font-bold">Total Remaining Owed:</span>
                              <span className="font-mono font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                ₦{parseFloat(item.balance || 0).toLocaleString()}
                              </span>
                            </div>

                            {/* Last Payment Made */}
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              <span className="font-medium">Last Payment:</span>
                              <span className="font-mono font-semibold text-slate-600">
                                {item.last_payment_date ? new Date(item.last_payment_date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No prior payment'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td className="p-3 text-right align-top pt-4">
                          <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
                            {/* Payment Method Selector */}
                            <select
                              value={rowPaymentMethods[item.id] || 'Cash'}
                              onChange={(e) => setRowPaymentMethods(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:ring-2 focus:ring-[#2A758C] focus:outline-none"
                            >
                              <option value="Cash">💵 Cash</option>
                              <option value="POS">💳 POS Card</option>
                              <option value="Transfer">🏦 Bank Transfer</option>
                            </select>

                            {/* Input Field: Amount */}
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-xs">₦</span>
                              <input
                                type="number"
                                placeholder="Amount"
                                value={rowPaymentAmounts[item.id] !== undefined ? rowPaymentAmounts[item.id] : ''}
                                onChange={(e) => setRowPaymentAmounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="w-32 bg-white border border-slate-200 rounded-xl pl-7 pr-2.5 py-2 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#2A758C] focus:border-[#2A758C] focus:outline-none shadow-2xs placeholder:text-slate-400 placeholder:font-sans [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>

                            {/* Record Payment Button */}
                            <button
                              type="button"
                              onClick={() => handleRecordRowPayment(item)}
                              disabled={recordingRowId === item.id}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95"
                            >
                              {recordingRowId === item.id ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5" /> Collect Amount
                                </>
                              )}
                            </button>
                          </div>

                          <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px]">
                            <span className="text-slate-400 font-medium">Quick fill:</span>
                            <button
                              type="button"
                              onClick={() => setRowPaymentAmounts(prev => ({ ...prev, [item.id]: item.balance.toString() }))}
                              className="text-[#2A758C] hover:underline font-bold font-mono bg-[#2A758C]/5 px-1.5 py-0.5 rounded border border-[#2A758C]/20"
                            >
                              Full Balance (₦{parseFloat(item.balance || 0).toLocaleString()})
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Discount Requests & HR Approvals Tab */}
      {activeTab === 'discounts' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Percent className="h-5 w-5 text-amber-600" /> Patient Discount Requests (HR Approval Required)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, authorize, or decline patient discount requests submitted for HR / Management review.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1.5 bg-amber-50 text-amber-900 font-mono font-bold text-xs rounded-xl border border-amber-200 shadow-2xs">
                Pending HR Approvals: {discountRequestsList.filter(d => d.status === 'Pending').length} Request(s)
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-3">Patient Name / Hospital #</th>
                    <th className="p-3">Requested By & Date</th>
                    <th className="p-3">Original Bill</th>
                    <th className="p-3">Discount Type & Value</th>
                    <th className="p-3">Calculated Discount</th>
                    <th className="p-3">Payable After HR Approval</th>
                    <th className="p-3">Reason for Discount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {discountRequestsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-12 text-xs text-slate-400 font-medium">
                        <Percent className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        No discount requests submitted yet.
                      </td>
                    </tr>
                  ) : (
                    discountRequestsList.map((d) => (
                      <tr key={d.id} className="text-xs hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-extrabold text-slate-900 align-top">
                          <div>{d.patient_name}</div>
                          <div className="text-[10px] text-[#2A758C] font-mono">{d.hospital_number || 'Outpatient'}</div>
                        </td>
                        <td className="p-3 text-slate-600 align-top">
                          <div className="font-semibold text-slate-800">{d.requested_by}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(d.requested_at).toLocaleDateString()} {new Date(d.requested_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-700 align-top">
                          ₦{parseFloat(d.original_amount).toLocaleString()}
                        </td>
                        <td className="p-3 align-top">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-mono font-bold text-xs">
                            {d.discount_type === 'Percentage' ? `${d.discount_value}%` : `₦${parseFloat(d.discount_value).toLocaleString()}`}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-700 align-top">
                          -₦{parseFloat(d.calculated_discount).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono font-black text-emerald-700 text-sm align-top">
                          ₦{parseFloat(d.final_amount).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-700 max-w-xs align-top font-medium">
                          <p className="line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[11px] text-slate-800">
                            "{d.reason}"
                          </p>
                        </td>
                        <td className="p-3 align-top">
                          {d.status === 'Approved' ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[10px] inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> HR Approved ({d.approved_by || 'HR'})
                            </span>
                          ) : d.status === 'Rejected' ? (
                            <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-bold text-[10px] inline-flex items-center gap-1">
                              <X className="h-3 w-3 text-rose-600" /> HR Rejected
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 font-bold text-[10px] inline-flex items-center gap-1 animate-pulse">
                              <Clock className="h-3 w-3 text-amber-600" /> Pending HR Review
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right align-top">
                          {d.status === 'Pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveDiscount(d.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <ThumbsUp className="h-3.5 w-3.5 text-emerald-200" /> Approve → HR
                              </button>
                              <button
                                onClick={() => handleRejectDiscount(d.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] px-2.5 py-1.5 rounded-lg border border-rose-200 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">
                              Processed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 9. MATERNITY WARD SUPPLIES & CASH HANDOVER TAB */}
      {activeTab === 'maternity-supplies' && (
        <MaternitySuppliesCashierView
          records={maternitySupplies}
          isLoading={isLoadingMaternitySupplies}
          onRefresh={fetchMaternitySupplies}
          onBalanceSuccess={() => {
            fetchInitialData();
          }}
        />
      )}

      {/* DISCOUNT REQUEST MODAL */}
      <AnimatePresence>
        {discountModalOpen && discountTarget && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl space-y-4"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Percent className="h-5 w-5 text-amber-600" /> Discount Request → HR Approval Required
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Submit discount authorization request to Human Resources / Management.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDiscountModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer hover:bg-slate-100 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Patient Summary Badge */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-xs flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-slate-800">{discountTarget.patientName}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{discountTarget.hospitalNumber || 'Outpatient'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Original Bill</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    ₦{(discountTarget.originalAmount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <form onSubmit={handleDiscountSubmit} className="space-y-4">
                {/* Discount Type Selector */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setDiscountType('Percentage')}
                      className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        discountType === 'Percentage'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      <Percent className="h-3.5 w-3.5" />
                      <span>Percentage (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('Fixed')}
                      className={`py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        discountType === 'Fixed'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      <Coins className="h-3.5 w-3.5" />
                      <span>Fixed Amount (₦)</span>
                    </button>
                  </div>
                </div>

                {/* Value Input */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                    {discountType === 'Percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₦)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    placeholder={discountType === 'Percentage' ? 'e.g. 10' : 'e.g. 5000'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Reason Input */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">
                    Reason for Discount *
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g. Staff dependent, financial hardship, MD directive..."
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Realtime Calculation Summary */}
                {discountValue && parseFloat(discountValue) > 0 && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1">
                    <div className="flex justify-between font-medium text-[11px]">
                      <span>Original Bill:</span>
                      <span className="font-mono font-bold">₦{(discountTarget.originalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium text-[11px] text-amber-700">
                      <span>Calculated Discount:</span>
                      <span className="font-mono font-bold">
                        -₦{(
                          discountType === 'Percentage'
                            ? ((discountTarget.originalAmount || 0) * parseFloat(discountValue)) / 100
                            : parseFloat(discountValue)
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-amber-200/80 text-amber-900">
                      <span>Final Payable After HR Approval:</span>
                      <span className="font-mono text-sm">
                        ₦{Math.max(
                          0,
                          (discountTarget.originalAmount || 0) - (
                            discountType === 'Percentage'
                              ? ((discountTarget.originalAmount || 0) * parseFloat(discountValue)) / 100
                              : parseFloat(discountValue)
                          )
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDiscountModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDiscount}
                    className="flex-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold py-2.5 rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingDiscount ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>Submit Discount Request → HR</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Day Revenue Balancing Modal */}
      <AnimatePresence>
        {isBalanceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 overflow-hidden space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#2A758C]/10 border border-[#2A758C]/20 flex items-center justify-center text-[#2A758C]">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight">Day's Revenue Balancing & Shift Settlement</h3>
                    <p className="text-xs text-slate-400">Official Daily Financial Summary & Balance Reconciliation</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBalanceModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Unconfirmed Handovers Alert Banner */}
              {payments.filter(p => p.status === 'Unconfirmed').length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <p className="font-bold">Unconfirmed Handovers Pending ({payments.filter(p => p.status === 'Unconfirmed').length})</p>
                    <p className="text-[11px] text-amber-800">
                      There is <strong>₦{payments.filter(p => p.status === 'Unconfirmed').reduce((acc, p) => acc + p.amount, 0).toLocaleString()}</strong> in unconfirmed cash collected by OPD/Lab. Please confirm receipt on the Billing Desk before closing shift.
                    </p>
                  </div>
                </div>
              )}

              {/* Revenue Breakdown Matrix */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">1. Confirmed Gross Income</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Cash Income</span>
                    <span className="font-black text-slate-800 font-mono mt-1 block">₦{cashTotal.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">POS Terminal</span>
                    <span className="font-black text-slate-800 font-mono mt-1 block">₦{posTotal.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-medium">Bank Transfer</span>
                    <span className="font-black text-slate-800 font-mono mt-1 block">₦{transferTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Total Confirmed Gross Revenue:</span>
                  <span className="font-mono text-sm text-emerald-600">₦{totalCollected.toLocaleString()}</span>
                </div>
              </div>

              {/* Disbursements Deductions Matrix */}
              <div className="space-y-2 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/60">
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest font-mono">2. Less: Payment Vitae (PV) Expenses</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Total PV Receipts ({totalPVCount}):</span>
                  <span className="font-bold text-rose-700 font-mono">- ₦{totalPVExpensed.toLocaleString()}</span>
                </div>
              </div>

              {/* Net Balanced Revenue Box */}
              <div className="p-4 bg-[#2A758C]/10 border border-[#2A758C]/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-[#2A758C] uppercase tracking-widest block font-mono">Net Balanced Revenue (After PV)</span>
                  <span className="text-xs text-slate-500">Net Cash In Till: <strong>₦{(cashTotal - totalPVExpensed).toLocaleString()}</strong></span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#2A758C] font-mono">₦{(totalCollected - totalPVExpensed).toLocaleString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsBalanceModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSuccess("Day's Revenue Balance sheet logged and printed successfully!");
                    setIsBalanceModalOpen(false);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#2A758C] hover:bg-[#1f5869] rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print & Lock Day's Balance Sheet</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: View Ordered Lab Tests Breakdown */}
      {viewTestsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <FlaskConical className="h-5 w-5 text-[#2A758C]" /> Ordered Laboratory Tests
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Patient: <span className="font-extrabold text-slate-800">{viewTestsModal.patientName}</span> ({viewTestsModal.hospitalNumber || 'Walk-In'})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewTestsModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tests List Table */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Ordered Investigations Breakdown
              </p>
              <div className="divide-y divide-slate-100 bg-slate-50/70 rounded-2xl border border-slate-100 p-3">
                {viewTestsModal.testsList && viewTestsModal.testsList.length > 0 ? (
                  viewTestsModal.testsList.map((testName: string, tIdx: number) => (
                    <div key={tIdx} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#2A758C]"></span>
                        {testName}
                      </span>
                      <span className="font-mono font-bold text-slate-600">Included in Order</span>
                    </div>
                  ))
                ) : viewTestsModal.testsSummary ? (
                  viewTestsModal.testsSummary.split('; ').map((testStr: string, tIdx: number) => (
                    <div key={tIdx} className="py-2.5 flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#2A758C]"></span>
                        {testStr}
                      </span>
                      <span className="font-mono font-bold text-slate-600">Ordered</span>
                    </div>
                  ))
                ) : (
                  <div className="py-3 text-xs font-bold text-slate-700">Laboratory Investigations Package</div>
                )}
              </div>
            </div>

            {/* Total Payable Fee Summary Bar */}
            <div className="bg-[#2A758C]/10 p-4 rounded-2xl border border-[#2A758C]/20 flex items-center justify-between">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider font-mono">Total Payable Fee:</span>
              <span className="text-xl font-black text-[#2A758C] font-mono">
                ₦{(viewTestsModal.totalAmount || 0).toLocaleString()}
              </span>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewTestsModal(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL ACTION SUCCESS & VERIFICATION MODAL */}
      {actionFeedbackModal && actionFeedbackModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">{actionFeedbackModal.title}</h3>
                  <p className="text-xs text-emerald-700 font-bold mt-0.5">{actionFeedbackModal.badgeText || 'Action Successfully Completed'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionFeedbackModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-2">
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                {actionFeedbackModal.message}
              </p>
              {actionFeedbackModal.patientName && (
                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Patient:</span>
                  <span className="font-extrabold text-slate-900">{actionFeedbackModal.patientName} ({actionFeedbackModal.hospitalNumber || '—'})</span>
                </div>
              )}
              {actionFeedbackModal.amount !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Amount Verified:</span>
                  <span className="font-mono font-black text-emerald-800 text-sm">₦{actionFeedbackModal.amount.toLocaleString()}</span>
                </div>
              )}
            </div>

            {actionFeedbackModal.details && actionFeedbackModal.details.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Departmental Execution Details</p>
                <div className="divide-y divide-slate-100 bg-slate-50/80 rounded-2xl border border-slate-100 p-3 space-y-2">
                  {actionFeedbackModal.details.map((item, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">{item.label}</span>
                      <span className="font-bold text-slate-800 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActionFeedbackModal(null)}
                className="w-full py-3 bg-[#2A758C] hover:bg-[#1f5869] text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer text-center"
              >
                Acknowledge & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
