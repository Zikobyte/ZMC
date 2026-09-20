import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Plus, 
  Search, 
  Calendar, 
  Check, 
  FileText, 
  Activity, 
  User, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  DollarSign, 
  Clock, 
  Sliders, 
  Bookmark, 
  BookOpen, 
  Printer, 
  PlusCircle, 
  CreditCard, 
  Download, 
  Users, 
  Briefcase, 
  ChevronRight, 
  List, 
  ShoppingCart, 
  RefreshCw,
  Stethoscope,
  ClipboardList,
  Filter,
  ArrowRight,
  Menu,
  ChevronDown,
  UserCheck,
  EyeOff,
  Phone,
  MapPin,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/api';

// Pricing Catalogs
const EYE_TESTS = [
  { name: 'Visual Acuity', price: 1000 },
  { name: 'Ophthalmoscopy', price: 1000 },
  { name: 'Auto Refraction', price: 5000 },
  { name: 'C.V.F (Colour Vision Field)', price: 10000 },
  { name: 'Tonometry', price: 5000 },
  { name: 'Slit Lamp Biomicroscopy', price: 10000 }
];

const PROCEDURES = [
  { name: 'Eye Irrigation', price: 5000 },
  { name: 'Foreign Body Removal', price: 10000 },
  { name: 'Dilation', price: 2000 }
];

const FRAMES = [
  { name: 'Designer Frames', price: 35000 },
  { name: 'Semi Designer Frames', price: 20000 },
  { name: 'Plastic Frames', price: 15000 },
  { name: 'Children Frames', price: 13000 }
];

const LENSES = [
  { name: 'Single Vision / Simple Bifocal Lens', price: 15000 },
  { name: 'High Minus/Plus Single Vision', price: 20000 },
  { name: 'Minus Addition Lens', price: 20000 },
  { name: 'Single Vision Transition', price: 25000 },
  { name: 'Simple Bifocal / Varilux Transition', price: 30000 },
  { name: 'Single Bluecut', price: 35000 },
  { name: 'Bifocal Bluecut', price: 40000 },
  { name: 'Special Order White', price: 30000 },
  { name: 'Special Order Transition', price: 45000 },
  { name: 'Special Order Bluecut', price: 60000 }
];

const ACCESSORIES = [
  { name: 'Ropes', price: 1500 },
  { name: 'Lens Cleaner', price: 2500 },
  { name: 'Purse', price: 2000 }
];

interface EyeClinicViewProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function EyeClinicView({ activeTab: propActiveTab, onTabChange }: EyeClinicViewProps = {}) {
  const [internalTab, setInternalTab] = useState<'registered-patients' | 'consultation' | 'all-records'>('registered-patients');

  const activeTab = (propActiveTab && propActiveTab !== 'eye-clinic'
    ? propActiveTab
    : internalTab) as 'registered-patients' | 'consultation' | 'all-records';

  const handleTabSwitch = (tab: 'registered-patients' | 'consultation' | 'all-records') => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration States & Modals
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regConfirmModalPatient, setRegConfirmModalPatient] = useState<any | null>(null);
  const [registeredSearch, setRegisteredSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Partial' | 'Unpaid' | 'Awaiting Consult' | 'Consulted'>('all');
  const [selectedPatientForView, setSelectedPatientForView] = useState<any | null>(null);

  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDOB, setRegDOB] = useState('');
  const [regOccupation, setRegOccupation] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regNextOfKin, setRegNextOfKin] = useState('');
  const [regComplaint, setRegComplaint] = useState('');
  const [regHistory, setRegHistory] = useState('');
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  const [cardType, setCardType] = useState<'new' | 'returning'>('new');
  const [cardCategoryType, setCardCategoryType] = useState('Eye Clinic');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search inside Consultation Queue
  const [queueSearch, setQueueSearch] = useState('');

  // Saved clinical record logs
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [selectedRecordToView, setSelectedRecordToView] = useState<any | null>(null);
  const [recordsSearch, setRecordsSearch] = useState('');

  // Fetch from database API
  const fetchEyeClinicData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Patients
      const pRes = await apiFetch('/patients/eye-clinic/patients');
      if (pRes && pRes.success && Array.isArray(pRes.data)) {
        setPatients(pRes.data);
        localStorage.setItem('zmc_eye_patients_new', JSON.stringify(pRes.data));
      } else {
        const saved = localStorage.getItem('zmc_eye_patients_new');
        if (saved) setPatients(JSON.parse(saved));
      }

      // 2. Fetch Consultations
      const cRes = await apiFetch('/patients/eye-clinic/consultations');
      if (cRes && cRes.success && Array.isArray(cRes.data)) {
        setSavedRecords(cRes.data);
        localStorage.setItem('zmc_eye_consultations_new', JSON.stringify(cRes.data));
      } else {
        const savedRecs = localStorage.getItem('zmc_eye_consultations_new');
        if (savedRecs) setSavedRecords(JSON.parse(savedRecs));
      }
    } catch (err: any) {
      console.warn('Could not fetch from backend API, using cached data:', err);
      const saved = localStorage.getItem('zmc_eye_patients_new');
      if (saved) {
        try { setPatients(JSON.parse(saved)); } catch (e) {}
      }
      const savedRecs = localStorage.getItem('zmc_eye_consultations_new');
      if (savedRecs) {
        try { setSavedRecords(JSON.parse(savedRecs)); } catch (e) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEyeClinicData();
    const interval = setInterval(fetchEyeClinicData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Selection of patient
  const selectPatientForConsult = (pat: any) => {
    const initializedPatient = {
      ...pat,
      bloodPressure: pat.bloodPressure || '120/80',
      bloodGlucose: pat.bloodGlucose || '5.4',
      onset: pat.onset || 'Gradual',
      duration: pat.duration || '3 months',
      laterality: pat.laterality || 'Both',
      pain: pat.pain || 'No',
      visionChanges: pat.visionChanges || 'Blurred',
      redness: pat.redness || 'No',
      discharge: pat.discharge || 'No',
      photophobia: pat.photophobia || 'No',
      trauma: pat.trauma || 'No',
      previousEyeSurgery: pat.previousEyeSurgery || 'No',
      aggravatingFactors: pat.aggravatingFactors || 'Bright lights, reading',
      associatedSymptoms: pat.associatedSymptoms || 'None',
      
      pastOcularRefractive: pat.pastOcularRefractive || 'None',
      pastOcularCataract: pat.pastOcularCataract || 'None',
      pastOcularGlaucoma: pat.pastOcularGlaucoma || 'None',
      pastOcularDiabetic: pat.pastOcularDiabetic || 'None',
      pastOcularTrauma: pat.pastOcularTrauma || 'None',
      pastOcularSurgery: pat.pastOcularSurgery || '',

      medDiabetes: pat.medDiabetes || 'No',
      medHypertension: pat.medHypertension || 'No',
      medAsthma: pat.medAsthma || 'No',
      medOthers: pat.medOthers || '',

      allergiesNone: pat.allergiesNone !== undefined ? pat.allergiesNone : true,
      allergiesDrug: pat.allergiesDrug || '',

      famGlaucoma: pat.famGlaucoma || 'No',
      famBlindness: pat.famBlindness || 'No',
      famDiabetes: pat.famDiabetes || 'No',
      famHypertension: pat.famHypertension || 'No',

      socSmoking: pat.socSmoking || 'No',
      socAlcohol: pat.socAlcohol || 'No',

      vaUnaidedOD: pat.vaUnaidedOD || '6/6',
      vaUnaidedOS: pat.vaUnaidedOS || '6/9',
      vaPinholeOD: pat.vaPinholeOD || '6/6',
      vaPinholeOS: pat.vaPinholeOS || '6/6',
      vaAidedOD: pat.vaAidedOD || '6/6',
      vaAidedOS: pat.vaAidedOS || '6/6',
      vaNvaOu: pat.vaNvaOu || 'N6',

      iopOD: pat.iopOD || '14',
      iopOS: pat.iopOS || '15',
      iopMethod: pat.iopMethod || 'Non-contact',

      pupilEquality: pat.pupilEquality || 'Equal',
      pupilReaction: pat.pupilReaction || 'Brisk',
      pupilRAPD: pat.pupilRAPD || 'Absent',

      lidOD: pat.lidOD || 'Normal',
      lidOS: pat.lidOS || 'Normal',
      conjunctivaOD: pat.conjunctivaOD || 'Clear',
      conjunctivaOS: pat.conjunctivaOS || 'Clear',
      corneaOD: pat.corneaOD || 'Clear and smooth',
      corneaOS: pat.corneaOS || 'Clear and smooth',
      chamberOD: pat.chamberOD || 'Deep and quiet',
      chamberOS: pat.chamberOS || 'Deep and quiet',
      lensOD: pat.lensOD || 'Clear',
      lensOS: pat.lensOS || 'Clear',

      vitreousOD: pat.vitreousOD || 'Clear',
      vitreousOS: pat.vitreousOS || 'Clear',
      discOD: pat.discOD || 'Pink, well defined',
      discOS: pat.discOS || 'Pink, well defined',
      cupOD: pat.cupOD || '0.3',
      cupOS: pat.cupOS || '0.3',
      maculaOD: pat.maculaOD || 'Healthy foveal reflex',
      maculaOS: pat.maculaOS || 'Healthy foveal reflex',
      vesselsOD: pat.vesselsOD || 'A/V ratio 2:3, normal calibre',
      vesselsOS: pat.vesselsOS || 'A/V ratio 2:3, normal calibre',
      peripheryOD: pat.peripheryOD || 'Flat, no tears',
      peripheryOS: pat.peripheryOS || 'Flat, no tears',

      specRefractionOD: pat.specRefractionOD || 'Sph: 0.00, Cyl: 0.00, Axis: 0',
      specRefractionOS: pat.specRefractionOS || 'Sph: 0.00, Cyl: 0.00, Axis: 0',
      specRefractionAdd: pat.specRefractionAdd || '+1.50 D',
      specVisualField: pat.specVisualField || 'Not ordered',
      specOCT: pat.specOCT || 'Not ordered',
      specFundusPhoto: pat.specFundusPhoto || 'Not ordered',
      specFluorescein: pat.specFluorescein || 'Not ordered',

      chiefComplaint: pat.chiefComplaint || '',
      history: pat.history || '',
      routineExam: pat.routineExam || '',
      externalExam: pat.externalExam || '',
      diagnosis: pat.diagnosis || '',
      treatmentPlan: pat.treatmentPlan || '',

      planMeds: pat.planMeds || 'Lubricating Eye Drops BID OU',
      planProcedures: pat.planProcedures || 'None',
      planInvestigations: pat.planInvestigations || 'None',
      planCounseling: pat.planCounseling || 'Avoid prolonged blue screen time without rest',
      planFollowUp: pat.planFollowUp || '1 month',
      planPrognosis: pat.planPrognosis || 'Good',

      selectedServices: pat.selectedServices || [],
      recordedPaymentsHistory: pat.recordedPaymentsHistory || [],
      subTab: pat.subTab || 'all'
    };
    setSelectedPatient(initializedPatient);
  };

  // Registering logic with full validation & duplicate protection
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!regName || !regName.trim()) {
      errors.name = 'Full Name is required.';
    } else if (regName.trim().length < 3) {
      errors.name = 'Full Name must be at least 3 characters.';
    }

    const cleanPhone = (regPhone || '').trim().replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      errors.phone = 'Valid Phone Number (at least 7 digits) is required.';
    }

    if (!regDOB || !regDOB.trim()) {
      errors.dob = 'Date of Birth is required.';
    } else {
      const dobDate = new Date(regDOB);
      if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
        errors.dob = 'Valid Date of Birth is required (cannot be future date).';
      }
    }

    if (!regAddress || !regAddress.trim()) {
      errors.address = 'Residential Address is required.';
    }

    if (!regNextOfKin || !regNextOfKin.trim()) {
      errors.nextOfKin = 'Next of Kin name and relationship are required.';
    }

    if (!regComplaint || !regComplaint.trim()) {
      errors.complaint = 'Chief Complaint is required for clinical ocular intake.';
    }

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      showError('Please complete all required fields highlighted in red.');
      return;
    }

    setRegErrors({});
    setIsSubmittingReg(true);

    try {
      const res = await apiFetch('/patients/eye-clinic/patients', {
        method: 'POST',
        body: JSON.stringify({
          name: regName.trim(),
          phoneNumber: cleanPhone,
          dateOfBirth: regDOB,
          occupation: regOccupation.trim(),
          address: regAddress.trim(),
          nextOfKin: regNextOfKin.trim(),
          chiefComplaint: regComplaint.trim(),
          history: regHistory.trim(),
          cardType,
          cardCategoryType
        })
      });

      if (res && res.success) {
        const createdPatient = res.data;
        showSuccess(res.message || `Successfully registered ${regName}! Assigned Card ID: ${createdPatient.hospitalNumber}.`);
        
        // Clear fields
        setRegName('');
        setRegPhone('');
        setRegDOB('');
        setRegOccupation('');
        setRegAddress('');
        setRegNextOfKin('');
        setRegComplaint('');
        setRegHistory('');
        setIsRegisterModalOpen(false);

        // Open Cashier Routing modal
        setRegConfirmModalPatient(createdPatient);

        // Refresh live list
        await fetchEyeClinicData();
      } else {
        showError(res.error || 'Failed to register patient.');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      showError(err.message || 'Error communicating with database server.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleVerifyCashierPayment = async (patientId: string) => {
    try {
      const res = await apiFetch('/patients/eye-clinic/verify-payment', {
        method: 'POST',
        body: JSON.stringify({ patientId })
      });

      if (res && res.success) {
        showSuccess(res.message || 'Payment verified! Patient sent to Eye Clinic Consultations.');
        setRegConfirmModalPatient(null);
        await fetchEyeClinicData();

        const updatedPat = res.data;
        if (updatedPat) {
          selectPatientForConsult(updatedPat);
          handleTabSwitch('consultation');
        }
      } else {
        showError(res.error || 'Failed to verify payment');
      }
    } catch (err: any) {
      showError(err.message || 'Error processing payment verification');
    }
  };

  // Search returning patient
  const handleSearchReturning = () => {
    if (!searchQuery) return;
    const match = patients.find(
      p => (p.hospitalNumber && p.hospitalNumber.toLowerCase() === searchQuery.trim().toLowerCase()) ||
           (p.phoneNumber && p.phoneNumber.includes(searchQuery.trim())) ||
           (p.name && p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    );

    if (match) {
      showSuccess(`Retrieved clinical file for ${match.name} (${match.hospitalNumber})!`);
      selectPatientForConsult(match);
      setIsRegisterModalOpen(false);
      handleTabSwitch('consultation');
    } else {
      showError('No registered eye patient found matching this ID, Name or Phone.');
    }
  };

  const handleServiceToggle = (item: any, category: string) => {
    if (!selectedPatient) return;
    const isAlreadySelected = selectedPatient.selectedServices?.some((s: any) => s.name === item.name);
    let updatedServices = [];
    if (isAlreadySelected) {
      updatedServices = selectedPatient.selectedServices.filter((s: any) => s.name !== item.name);
    } else {
      updatedServices = [...(selectedPatient.selectedServices || []), { ...item, category }];
    }

    const updatedPatient = { ...selectedPatient, selectedServices: updatedServices };
    setSelectedPatient(updatedPatient);
  };

  const getSelectedServicesTotal = () => {
    if (!selectedPatient) return 0;
    const servicesSum = selectedPatient.selectedServices?.reduce((acc: number, item: any) => acc + item.price, 0) || 0;
    const cardFee = selectedPatient.cardFee || 0;
    return servicesSum + cardFee;
  };

  const handleRecordPayment = (amountStr: string) => {
    if (!selectedPatient) return;
    const amount = parseFloat(amountStr);
    const total = getSelectedServicesTotal() || selectedPatient.totalBill || 3000;
    const alreadyPaid = selectedPatient.recordedPaymentsHistory?.reduce((acc: number, p: any) => acc + p.amount, 0) || (selectedPatient.paidAmount || 0);
    const remaining = Math.max(0, total - alreadyPaid);

    if (isNaN(amount) || amount <= 0) {
      showError('Please specify a valid payment amount.');
      return;
    }
    if (amount > remaining) {
      showError(`Amount exceeds remaining outstanding balance of ₦${remaining.toLocaleString()}.`);
      return;
    }

    const newPayment = {
      amount,
      date: new Date().toISOString().split('T')[0],
      reference: `PAY-${Math.floor(100000 + Math.random() * 900000)}`
    };

    const updatedPayments = [...(selectedPatient.recordedPaymentsHistory || []), newPayment];
    const totalPaidNow = alreadyPaid + amount;

    let newPaymentStatus = 'UNPAID';
    if (totalPaidNow >= total) {
      newPaymentStatus = 'Paid';
    } else if (totalPaidNow > 0) {
      newPaymentStatus = 'Part Paid';
    }

    const newBalance = Math.max(0, total - totalPaidNow);

    const updatedPatient = {
      ...selectedPatient,
      recordedPaymentsHistory: updatedPayments,
      paidAmount: totalPaidNow,
      paymentStatus: newPaymentStatus,
      balance: newBalance
    };

    setSelectedPatient(updatedPatient);
    showSuccess(`Payment of ₦${amount.toLocaleString()} recorded! Ref: ${newPayment.reference}`);
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    if (!selectedPatient.diagnosis || !selectedPatient.diagnosis.trim()) {
      showError('Assessment / Clinical Diagnosis is required to complete consultation!');
      setSelectedPatient({ ...selectedPatient, subTab: 'exams' });
      return;
    }

    const total = getSelectedServicesTotal() || selectedPatient.totalBill || 3000;
    const paidSum = selectedPatient.recordedPaymentsHistory?.reduce((acc: number, p: any) => acc + p.amount, 0) || (selectedPatient.paidAmount || 0);
    const currentBalance = Math.max(0, total - paidSum);

    try {
      const res = await apiFetch('/patients/eye-clinic/consultations', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatient.id,
          patientName: selectedPatient.name,
          hospitalNumber: selectedPatient.hospitalNumber,
          phoneNumber: selectedPatient.phoneNumber,
          occupation: selectedPatient.occupation || '',
          chiefComplaint: selectedPatient.chiefComplaint || '',
          history: selectedPatient.history || '',
          routineExam: selectedPatient.routineExam || '',
          externalExam: selectedPatient.externalExam || '',
          diagnosis: selectedPatient.diagnosis.trim(),
          treatmentPlan: selectedPatient.treatmentPlan || selectedPatient.planMeds || '',
          vitals: {
            bp: selectedPatient.bloodPressure,
            sugar: selectedPatient.bloodGlucose
          },
          services: selectedPatient.selectedServices || [],
          totalBill: total,
          totalPaid: paidSum,
          balance: currentBalance,
          paymentStatus: selectedPatient.paymentStatus || (currentBalance === 0 ? 'Paid' : 'UNPAID')
        })
      });

      if (res && res.success) {
        showSuccess(res.message || `Consultation saved and bill of ₦${total.toLocaleString()} logged for Cashier!`);
        setSelectedPatient({ ...selectedPatient, status: 'Consulted', totalBill: total, paidAmount: paidSum, balance: currentBalance });
        await fetchEyeClinicData();
      } else {
        showError(res.error || 'Failed to save consultation.');
      }
    } catch (err: any) {
      showError(err.message || 'Error connecting to database to save encounter.');
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  // Filtered lists
  const filteredQueue = patients.filter(p => {
    const q = queueSearch.toLowerCase();
    return (
      (p.name || '').toLowerCase().includes(q) || 
      (p.hospitalNumber || '').toLowerCase().includes(q) ||
      (p.phoneNumber || '').includes(q)
    );
  });

  const registeredFilteredPatients = patients.filter(p => {
    const q = registeredSearch.toLowerCase();
    const matchesSearch = (p.name || '').toLowerCase().includes(q) ||
                          (p.hospitalNumber || '').toLowerCase().includes(q) ||
                          (p.phoneNumber || '').includes(q) ||
                          (p.occupation && p.occupation.toLowerCase().includes(q)) ||
                          (p.chiefComplaint && p.chiefComplaint.toLowerCase().includes(q)) ||
                          (p.diagnosis && p.diagnosis.toLowerCase().includes(q));
    
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;

    const totalBillVal = Number(p.totalBill ?? (p.balance ? p.balance + (p.paidAmount || 0) : 3000));
    const paidVal = Number(p.paidAmount ?? (p.paymentStatus === 'Paid' ? totalBillVal : 0));

    if (statusFilter === 'Paid') return totalBillVal > 0 && paidVal >= totalBillVal;
    if (statusFilter === 'Unpaid') return !totalBillVal || paidVal <= 0;
    if (statusFilter === 'Partial') return paidVal > 0 && paidVal < totalBillVal;

    return p.status === statusFilter;
  });

  const renderPaymentStatusBadge = (totalBill: number, paid: number) => {
    const safeTotal = Math.max(0, totalBill || 0);
    const safePaid = Math.max(0, paid || 0);

    if (!safeTotal || safePaid <= 0) {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse"></span>
          Unpaid
        </span>
      );
    }

    if (safePaid >= safeTotal) {
      return (
        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1 shadow-2xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
          Paid
        </span>
      );
    }

    const pct = Math.round((safePaid / safeTotal) * 100);
    return (
      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-yellow-100 text-amber-900 border border-yellow-300 inline-flex items-center gap-1 shadow-2xs">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
        Partial ({pct}%)
      </span>
    );
  };

  const recordsToDisplay = savedRecords.filter(r => {
    const q = recordsSearch.toLowerCase();
    return (
      (r.patientName || r.name || '').toLowerCase().includes(q) ||
      (r.hospitalNumber || r.patientId || '').toLowerCase().includes(q) ||
      (r.diagnosis || '').toLowerCase().includes(q) ||
      (r.chiefComplaint || '').toLowerCase().includes(q)
    );
  });

  const totalRecords = patients.length;
  const waitingConsultations = patients.filter(p => p.status === 'Awaiting Consult' || p.status === 'Awaiting Cashier Verification').length;
  const paymentPending = patients.filter(p => p.paymentStatus === 'UNPAID' || p.paymentStatus === 'Part Paid' || (typeof p.balance === 'number' && p.balance > 0)).length;
  const completedToday = patients.filter(p => p.status === 'Consulted').length;

  return (
    <div className="w-full bg-slate-50 font-sans space-y-5" id="eye-clinic-module">
      
      {/* =========================================================
          MAIN WORKSPACE CONTENT AREA
         ========================================================= */}
      <main className="w-full space-y-5 min-w-0 overflow-x-hidden">
        
        {/* Notifications & Dynamic Alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="flex-1">{successMsg}</div>
              <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-center gap-3 text-xs font-semibold shadow-xs">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
              <div className="flex-1">{errorMsg}</div>
              <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global Eye Clinic Department Navigation Header */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-100/80 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0 shadow-2xs">
              <Eye className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Eye Clinic Department</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
                  Ophthalmology & Optometry
                </span>
              </div>
              <p className="text-slate-500 text-xs font-medium mt-0.5">
                Authoritative ocular database, clinical intake validations, diagnostic examination desk & cashier synchronization.
              </p>
            </div>
          </div>

          <div className="department-page-nav flex flex-wrap items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => handleTabSwitch('registered-patients')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'registered-patients'
                  ? 'bg-[#2A758C] text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>1. Patient Directory</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'registered-patients' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {patients.length}
              </span>
            </button>

            <button
              onClick={() => handleTabSwitch('consultation')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'consultation'
                  ? 'bg-[#2A758C] text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>2. Consultation Desk</span>
              {waitingConsultations > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono font-black animate-pulse">
                  {waitingConsultations}
                </span>
              )}
            </button>

            <button
              onClick={() => handleTabSwitch('all-records')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'all-records'
                  ? 'bg-[#2A758C] text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>3. All Records</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                activeTab === 'all-records' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {savedRecords.length}
              </span>
            </button>
          </div>
        </div>

        {/* Global Eye Clinic Summary Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Total Records</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-slate-900 font-mono">{totalRecords}</p>
              <span className="text-[10px] text-slate-500 font-medium">Eye Clinic Database</span>
            </div>
          </div>

          <div className="bg-amber-50/70 p-4.5 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-amber-700 uppercase tracking-wider">Waiting Consultations</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-amber-800 font-mono">{waitingConsultations}</p>
              <span className="text-[10px] text-amber-700 font-medium">Active Ocular Queue</span>
            </div>
          </div>

          <div className="bg-rose-50/70 p-4.5 rounded-2xl border border-rose-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-rose-700 uppercase tracking-wider">Payment Pending</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-800">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-rose-800 font-mono">{paymentPending}</p>
              <span className="text-[10px] text-rose-700 font-medium">Awaiting Settlement</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 p-4.5 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">Completed Consultations</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-black text-emerald-800 font-mono">{completedToday}</p>
              <span className="text-[10px] text-emerald-700 font-medium">Encounter Logs</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            PAGE 1: REGISTERED PATIENTS VIEW
           ========================================================= */}
        {activeTab === 'registered-patients' && (
          <div className="space-y-5">
            
            {/* Top Bar Header */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#2A758C]" />
                  Registered Eye Patients Directory
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage registered eye care cards, search records, and assign patients to consultation
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRegErrors({});
                    setIsRegisterModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-[#A3D1E0] hover:bg-[#8bc3d4] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Eye Patient</span>
                </button>
              </div>
            </div>

            {/* Patient Search & Filter Section */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, Hospital ID (EC-100...), phone number..."
                  value={registeredSearch}
                  onChange={e => setRegisteredSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-[#A3D1E0] outline-none text-slate-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-600">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">All Patients ({patients.length})</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Awaiting Consult">Awaiting Consult</option>
                  <option value="Consulted">Consulted</option>
                </select>
              </div>
            </div>

            {/* Patients Directory Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900">Patient Directory Table</h3>
                <span className="text-xs text-slate-500 font-mono">
                  Showing {registeredFilteredPatients.length} of {patients.length} entries
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase bg-slate-50/80">
                      <th className="py-3 px-3">Card number</th>
                      <th className="py-3 px-3">Patient</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Chief complaint</th>
                      <th className="py-3 px-3">Diagnosis</th>
                      <th className="py-3 px-3">Total bill</th>
                      <th className="py-3 px-3">Paid</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {registeredFilteredPatients.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-400">
                          <EyeOff className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold">No registered eye patients found matching your search criteria.</p>
                        </td>
                      </tr>
                    ) : (
                      registeredFilteredPatients.map(p => {
                        const cardNo = p.hospitalNumber || p.id;
                        const patientName = p.name;
                        const phone = p.phoneNumber;
                        const dateVal = p.dateIssued || p.date || p.createdAt?.slice(0,10) || '2026-08-24';
                        const complaintVal = p.chiefComplaint || 'Routine Eye Examination';
                        const diagnosisVal = p.diagnosis || (p.status === 'Consulted' ? 'Presbyopia / Refractive Error' : 'Awaiting Examination');
                        const totalBillVal = Number(p.totalBill ?? (p.balance ? p.balance + (p.paidAmount || 0) : 3000));
                        const paidVal = Number(p.paidAmount ?? (p.paymentStatus === 'Paid' ? totalBillVal : 0));

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-[#2A758C]">{cardNo}</td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{patientName}</div>
                              {phone && <div className="text-[10px] text-slate-400 font-mono">{phone}</div>}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">{dateVal}</td>
                            <td className="py-3 px-3 text-slate-600 max-w-[150px] truncate" title={complaintVal}>
                              {complaintVal}
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-medium max-w-[170px] truncate" title={diagnosisVal}>
                              {diagnosisVal}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              ₦{totalBillVal.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                              ₦{paidVal.toLocaleString()}
                            </td>
                            <td className="py-3 px-3">
                              {renderPaymentStatusBadge(totalBillVal, paidVal)}
                            </td>
                            <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedPatientForView(p)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[10px] transition-all cursor-pointer"
                              >
                                Details
                              </button>
                              {p.status === 'Awaiting Cashier Verification' || p.paymentStatus === 'UNPAID' ? (
                                <button
                                  onClick={() => setRegConfirmModalPatient(p)}
                                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-2xs"
                                >
                                  Send to Cashier
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    selectPatientForConsult(p);
                                    handleTabSwitch('consultation');
                                  }}
                                  className="px-3 py-1 bg-[#A3D1E0] hover:bg-[#82bdcf] text-slate-950 font-bold rounded-lg text-[10px] transition-all cursor-pointer shadow-2xs"
                                >
                                  Proceed for Consultation
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* =========================================================
            PAGE 2: CONSULTATION VIEW
           ========================================================= */}
        {activeTab === 'consultation' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
            
            {/* Waiting Queue List Panel */}
            <div className="lg:col-span-1 bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Clinical Queue</h3>
                  <p className="text-[10px] text-slate-500">Waiting & Consulted list</p>
                </div>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold font-mono">
                  {patients.length} total
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name/ID..."
                  value={queueSearch}
                  onChange={e => setQueueSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1 pl-8 pr-3 text-[11px] text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                {filteredQueue.map(p => {
                  const isSelected = selectedPatient?.id === p.id;
                  const isAwaiting = p.status === 'Awaiting Consult';
                  const totalB = Number(p.totalBill ?? (p.balance ? p.balance + (p.paidAmount || 0) : 3000));
                  const paidB = Number(p.paidAmount ?? (p.paymentStatus === 'Paid' ? totalB : 0));
                  
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectPatientForConsult(p)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                        isSelected 
                          ? 'border-[#2A758C] bg-[#A3D1E0]/10 shadow-2xs' 
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                          {p.name}
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#2A758C]" />}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">ID: {p.hospitalNumber}</div>
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                            isAwaiting ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {p.status}
                          </span>
                          {renderPaymentStatusBadge(totalB, paidB)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Consultation Active Workspace */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs">
              {selectedPatient ? (
                <form onSubmit={handleSaveConsultation} className="space-y-6 text-slate-700 text-xs">
                  
                  {/* Workspace Header Card */}
                  <div className="border border-slate-200 bg-slate-50/70 p-4 rounded-xl space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-extrabold text-slate-900">{selectedPatient.name}</h2>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            selectedPatient.status === 'Awaiting Consult' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}>
                            {selectedPatient.status}
                          </span>
                          {renderPaymentStatusBadge(
                            getSelectedServicesTotal() || selectedPatient.totalBill || 3000,
                            (selectedPatient.recordedPaymentsHistory?.reduce((acc: number, item: any) => acc + item.amount, 0) ?? 0) + (selectedPatient.paidAmount || (selectedPatient.paymentStatus === 'Paid' ? (selectedPatient.totalBill || 3000) : 0))
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                          Card ID: <strong className="text-[#2A758C]">{selectedPatient.hospitalNumber}</strong> | Phone: <strong className="text-slate-800">{selectedPatient.phoneNumber}</strong>
                        </p>
                      </div>

                      <div className="text-right text-[11px] text-slate-600">
                        <div>Date: <strong className="font-mono text-slate-800">{selectedPatient.dateIssued || selectedPatient.date || new Date().toISOString().split('T')[0]}</strong></div>
                        <div>Occupation: <strong className="text-slate-800 capitalize">{selectedPatient.occupation || 'N/A'}</strong></div>
                      </div>
                    </div>

                    {/* Section Switcher Tabs */}
                    <div className="flex gap-1.5 pt-1 overflow-x-auto">
                      {[
                        { id: 'all', label: 'Full Encounter File' },
                        { id: 'clinical', label: 'Chief Complaint & History' },
                        { id: 'exams', label: 'Examinations & Diagnosis' },
                        { id: 'billing', label: 'Bill Services & Payment' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSelectedPatient({ ...selectedPatient, subTab: tab.id })}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                            (selectedPatient.subTab || 'all') === tab.id 
                              ? 'bg-[#2A758C] text-white shadow-2xs' 
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 1: CHIEF COMPLAINT & HISTORY */}
                  {((selectedPatient.subTab || 'all') === 'all' || selectedPatient.subTab === 'clinical') && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[#2A758C] flex items-center gap-1.5">
                        <FileText className="h-4 w-4" /> Chief Complaint & History
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Chief Complaint *</label>
                          <input
                            type="text"
                            value={selectedPatient.chiefComplaint ?? ''}
                            onChange={e => setSelectedPatient({ ...selectedPatient, chiefComplaint: e.target.value })}
                            placeholder="e.g. Blurred vision, eye pain, redness..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Occupation / Job</label>
                          <input
                            type="text"
                            value={selectedPatient.occupation ?? ''}
                            onChange={e => setSelectedPatient({ ...selectedPatient, occupation: e.target.value })}
                            placeholder="e.g. Engineer, Student, Teacher..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Patient History Questionnaire / Notes</label>
                        <textarea
                          rows={2}
                          value={selectedPatient.history ?? ''}
                          onChange={e => setSelectedPatient({ ...selectedPatient, history: e.target.value })}
                          placeholder="Previous eye conditions, glasses, surgeries, systemic diseases (DM, HTN), medications..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  )}

                  {/* SECTION 2: EXAMINATIONS, DIAGNOSIS & TREATMENT PLAN */}
                  {((selectedPatient.subTab || 'all') === 'all' || selectedPatient.subTab === 'exams') && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[#2A758C] flex items-center gap-1.5">
                        <Activity className="h-4 w-4" /> Clinical Examinations & Treatment Plan
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Routine Examination</label>
                          <textarea
                            rows={2}
                            value={selectedPatient.routineExam ?? ''}
                            onChange={e => setSelectedPatient({ ...selectedPatient, routineExam: e.target.value })}
                            placeholder="VA OD/OS, refraction, cover test, pupils, motility..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">External Examination</label>
                          <textarea
                            rows={2}
                            value={selectedPatient.externalExam ?? ''}
                            onChange={e => setSelectedPatient({ ...selectedPatient, externalExam: e.target.value })}
                            placeholder="Lids, lashes, conjunctiva, cornea, lens, fundus..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Clinical Diagnosis *</label>
                          <input
                            type="text"
                            required
                            value={selectedPatient.diagnosis ?? ''}
                            onChange={e => setSelectedPatient({ ...selectedPatient, diagnosis: e.target.value })}
                            placeholder="e.g. Presbyopia, Allergic Conjunctivitis, Myopia..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Treatment Plan</label>
                          <textarea
                            rows={2}
                            value={selectedPatient.treatmentPlan ?? ''}
                            onChange={e => setSelectedPatient({ ...selectedPatient, treatmentPlan: e.target.value })}
                            placeholder="Glasses prescription, medication, follow-up..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 3: BILL SERVICES (5 CATEGORIES) */}
                  {((selectedPatient.subTab || 'all') === 'all' || selectedPatient.subTab === 'billing') && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div>
                          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[#2A758C] flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4" /> Bill Services & Optical Store Catalog
                          </h3>
                          <p className="text-[10px] text-slate-500">Select required eye tests, procedures, frames, lenses, and accessories</p>
                        </div>
                        <span className="text-xs font-bold font-mono text-[#2A758C] bg-[#A3D1E0]/20 px-2.5 py-1 rounded-lg">
                          Items Total: ₦{(selectedPatient.selectedServices?.reduce((acc: number, s: any) => acc + s.price, 0) || 0).toLocaleString()}
                        </span>
                      </div>

                      {/* 1. Eye Tests */}
                      <div className="space-y-1.5 border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                        <h4 className="text-[10px] font-extrabold text-[#2A758C] uppercase tracking-wider">Eye Tests</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {EYE_TESTS.map((item) => {
                            const isSel = selectedPatient.selectedServices?.some((s: any) => s.name === item.name);
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => handleServiceToggle(item, 'Eye Tests')}
                                className={`flex justify-between items-center p-2 rounded-lg text-[11px] border transition-all cursor-pointer ${
                                  isSel ? 'bg-[#2A758C] text-white border-[#2A758C] font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span>{item.name}</span>
                                <span className="font-mono text-[10px]">₦{item.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Procedures */}
                      <div className="space-y-1.5 border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                        <h4 className="text-[10px] font-extrabold text-[#2A758C] uppercase tracking-wider">Procedures</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {PROCEDURES.map((item) => {
                            const isSel = selectedPatient.selectedServices?.some((s: any) => s.name === item.name);
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => handleServiceToggle(item, 'Procedures')}
                                className={`flex justify-between items-center p-2 rounded-lg text-[11px] border transition-all cursor-pointer ${
                                  isSel ? 'bg-[#2A758C] text-white border-[#2A758C] font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span>{item.name}</span>
                                <span className="font-mono text-[10px]">₦{item.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. Frames */}
                      <div className="space-y-1.5 border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                        <h4 className="text-[10px] font-extrabold text-[#2A758C] uppercase tracking-wider">Frames</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                          {FRAMES.map((item) => {
                            const isSel = selectedPatient.selectedServices?.some((s: any) => s.name === item.name);
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => handleServiceToggle(item, 'Frames')}
                                className={`flex justify-between items-center p-2 rounded-lg text-[11px] border transition-all cursor-pointer ${
                                  isSel ? 'bg-[#2A758C] text-white border-[#2A758C] font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span>{item.name}</span>
                                <span className="font-mono text-[10px]">₦{item.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4. Lenses */}
                      <div className="space-y-1.5 border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                        <h4 className="text-[10px] font-extrabold text-[#2A758C] uppercase tracking-wider">Lenses</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                          {LENSES.map((item) => {
                            const isSel = selectedPatient.selectedServices?.some((s: any) => s.name === item.name);
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => handleServiceToggle(item, 'Lenses')}
                                className={`flex justify-between items-center p-2 rounded-lg text-[11px] border transition-all cursor-pointer ${
                                  isSel ? 'bg-[#2A758C] text-white border-[#2A758C] font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span>{item.name}</span>
                                <span className="font-mono text-[10px]">₦{item.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 5. Accessories */}
                      <div className="space-y-1.5 border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                        <h4 className="text-[10px] font-extrabold text-[#2A758C] uppercase tracking-wider">Accessories</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {ACCESSORIES.map((item) => {
                            const isSel = selectedPatient.selectedServices?.some((s: any) => s.name === item.name);
                            return (
                              <button
                                key={item.name}
                                type="button"
                                onClick={() => handleServiceToggle(item, 'Accessories')}
                                className={`flex justify-between items-center p-2 rounded-lg text-[11px] border transition-all cursor-pointer ${
                                  isSel ? 'bg-[#2A758C] text-white border-[#2A758C] font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                <span>{item.name}</span>
                                <span className="font-mono text-[10px]">₦{item.price.toLocaleString()}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 4: PAYMENT STATUS & RECORD PAYMENT */}
                  <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Payment Status</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            selectedPatient.paymentStatus === 'Paid' 
                              ? 'bg-emerald-500 text-white' 
                              : selectedPatient.paymentStatus === 'Part Paid' 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-rose-500 text-white'
                          }`}>
                            {selectedPatient.paymentStatus || 'UNPAID'}
                          </span>
                          <span className="text-xs text-slate-300 font-mono">
                            Outstanding Balance: ₦{(typeof selectedPatient.balance === 'number' ? selectedPatient.balance : 3000).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Total Bill Services</div>
                        <div className="text-lg font-black font-mono text-[#A3D1E0]">
                          ₦{getSelectedServicesTotal().toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount to record (e.g. 3000)..."
                        id="custom-payment-input"
                        className="bg-slate-800 border border-slate-700 text-white px-3 py-2 rounded-lg text-xs font-mono flex-1 focus:outline-none focus:border-[#A3D1E0]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('custom-payment-input') as HTMLInputElement;
                          if (el && el.value) {
                            handleRecordPayment(el.value);
                            el.value = '';
                          }
                        }}
                        className="px-4 py-2 bg-[#A3D1E0] text-slate-950 font-bold rounded-lg text-xs hover:bg-[#82bdcf] cursor-pointer transition-all"
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>

                  {/* Primary Action Button */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Encounter Status: <strong className="text-slate-800">{selectedPatient.status}</strong>
                    </span>

                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#2A758C] hover:bg-[#205d70] text-white font-extrabold rounded-xl flex items-center justify-center gap-2 cursor-pointer text-xs shadow-md transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#A3D1E0]" />
                      <span>Save Consultation & Generate Bill</span>
                    </button>
                  </div>

                </form>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                  <Sliders className="h-11 w-11 text-slate-200 mb-3" />
                  <p className="text-xs font-semibold">Please select a patient file from the left Clinical Queue panel</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* =========================================================
            PAGE 3: ALL RECORDS VIEW
           ========================================================= */}
        {activeTab === 'all-records' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-[#2A758C]" />
                  All Eye Clinic Records & Encounters
                </h1>
                <p className="text-xs text-slate-500">View, search, and print completed clinical history files & spectacle cards</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search records by card #, name, diagnosis..."
                    value={recordsSearch}
                    onChange={e => setRecordsSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs focus:ring-2 focus:ring-[#A3D1E0] outline-none text-slate-900"
                  />
                </div>
                <div className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-700 whitespace-nowrap">
                  Total Logs: {recordsToDisplay.length}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase bg-slate-50/80">
                    <th className="py-3 px-3">Card number</th>
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Chief complaint</th>
                    <th className="py-3 px-3">Diagnosis</th>
                    <th className="py-3 px-3">Total bill</th>
                    <th className="py-3 px-3">Paid</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recordsToDisplay.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-slate-400 text-[11px]">
                        <EyeOff className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        No completed consultation logs recorded yet matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    recordsToDisplay.map(r => {
                      const cardNo = r.hospitalNumber || r.patientId || 'EC-100000';
                      const name = r.patientName || r.name || 'Patient';
                      const phone = r.phoneNumber || '';
                      const dateVal = r.date || r.createdAt?.slice(0,10) || '2026-08-24';
                      const complaintVal = r.chiefComplaint || 'Ocular Check';
                      const diagnosisVal = r.diagnosis || 'Clinical Assessment';
                      const totalBillVal = Number(r.totalBill ?? 15000);
                      const paidVal = Number(r.totalPaid ?? (r.paidAmount ?? (r.paymentStatus === 'Paid' ? totalBillVal : 0)));

                      return (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-[#2A758C]">{cardNo}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{name}</div>
                            {phone && <div className="text-[10px] text-slate-400 font-mono">{phone}</div>}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">{dateVal}</td>
                          <td className="py-3 px-3 text-slate-600 max-w-[150px] truncate" title={complaintVal}>
                            {complaintVal}
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-medium max-w-[170px] truncate" title={diagnosisVal}>
                            {diagnosisVal}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            ₦{totalBillVal.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                            ₦{paidVal.toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            {renderPaymentStatusBadge(totalBillVal, paidVal)}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedRecordToView(r)}
                              className="px-2.5 py-1 bg-[#A3D1E0]/20 hover:bg-[#A3D1E0]/30 text-[#2a758c] font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                            >
                              Print / View Card
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* =========================================================
          REGISTER NEW EYE PATIENT MODAL WITH VALIDATION FEEDBACK
         ========================================================= */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative text-slate-800 text-xs">
              
              <button 
                onClick={() => setIsRegisterModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-[#2A758C]" />
                  Register Eye Patient
                </h3>
                <p className="text-[11px] text-slate-500">Create new ocular patient file or retrieve returning card</p>
              </div>

              {/* Card Mode Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCardType('new')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    cardType === 'new' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  New Patient (₦3,000 Card)
                </button>
                <button
                  type="button"
                  onClick={() => setCardType('returning')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    cardType === 'returning' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Retrieve Returning Card
                </button>
              </div>

              {cardType === 'new' ? (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={regName}
                        onChange={e => {
                          setRegName(e.target.value);
                          if (regErrors.name) setRegErrors({ ...regErrors, name: '' });
                        }}
                        placeholder="e.g. Chioma Okafor"
                        className={`w-full bg-slate-50 border rounded-lg p-2 text-xs text-slate-900 ${
                          regErrors.name ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                      />
                      {regErrors.name && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{regErrors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Phone Number *</label>
                      <input
                        type="text"
                        value={regPhone}
                        onChange={e => {
                          setRegPhone(e.target.value);
                          if (regErrors.phone) setRegErrors({ ...regErrors, phone: '' });
                        }}
                        placeholder="08031000001"
                        className={`w-full bg-slate-50 border rounded-lg p-2 text-xs text-slate-900 ${
                          regErrors.phone ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                      />
                      {regErrors.phone && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{regErrors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        value={regDOB}
                        onChange={e => {
                          setRegDOB(e.target.value);
                          if (regErrors.dob) setRegErrors({ ...regErrors, dob: '' });
                        }}
                        className={`w-full bg-slate-50 border rounded-lg p-2 text-xs text-slate-900 ${
                          regErrors.dob ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                      />
                      {regErrors.dob && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{regErrors.dob}</p>}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Occupation</label>
                      <input
                        type="text"
                        value={regOccupation}
                        onChange={e => setRegOccupation(e.target.value)}
                        placeholder="Teacher, Engineer..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Card Category Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={cardCategoryType}
                        onChange={e => setCardCategoryType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-[#2A758C]"
                      >
                        <option value="Eye Clinic">Eye Clinic Card (₦3,000)</option>
                        <option value="Standard">Standard Card (₦3,000)</option>
                        <option value="Maternity">Maternity Card (₦5,000)</option>
                        <option value="Emergency">Emergency Card</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Next of Kin *</label>
                      <input
                        type="text"
                        value={regNextOfKin}
                        onChange={e => {
                          setRegNextOfKin(e.target.value);
                          if (regErrors.nextOfKin) setRegErrors({ ...regErrors, nextOfKin: '' });
                        }}
                        placeholder="e.g. Spouse / Sibling name and relationship"
                        className={`w-full bg-slate-50 border rounded-lg p-2 text-xs text-slate-900 ${
                          regErrors.nextOfKin ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                      />
                      {regErrors.nextOfKin && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{regErrors.nextOfKin}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Residential Address *</label>
                      <input
                        type="text"
                        value={regAddress}
                        onChange={e => {
                          setRegAddress(e.target.value);
                          if (regErrors.address) setRegErrors({ ...regErrors, address: '' });
                        }}
                        placeholder="Residential address (Street, City)"
                        className={`w-full bg-slate-50 border rounded-lg p-2 text-xs text-slate-900 ${
                          regErrors.address ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                      />
                      {regErrors.address && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{regErrors.address}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Chief Complaint *</label>
                      <input
                        type="text"
                        value={regComplaint}
                        onChange={e => {
                          setRegComplaint(e.target.value);
                          if (regErrors.complaint) setRegErrors({ ...regErrors, complaint: '' });
                        }}
                        placeholder="e.g. Blurred vision, eye pain, redness, irritation..."
                        className={`w-full bg-slate-50 border rounded-lg p-2 text-xs text-slate-900 ${
                          regErrors.complaint ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                        }`}
                      />
                      {regErrors.complaint && <p className="text-[10px] text-rose-600 font-bold mt-0.5">{regErrors.complaint}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Patient History Questionnaire</label>
                      <textarea
                        rows={2}
                        value={regHistory}
                        onChange={e => setRegHistory(e.target.value)}
                        placeholder="Previous eye conditions, glasses, surgeries, systemic diseases (DM, HTN), medications..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      disabled={isSubmittingReg}
                      className="px-5 py-2.5 bg-[#2A758C] hover:bg-[#1f5869] disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2"
                    >
                      <UserCheck className="h-4 w-4 text-[#A3D1E0]" />
                      <span>{isSubmittingReg ? 'Registering...' : 'Register & Proceed to Consultation'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 py-2">
                  <label className="block text-xs font-bold text-slate-700">Hospital Card ID or Phone</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. EC-100001 or 08031..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleSearchReturning}
                      className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 cursor-pointer"
                    >
                      Retrieve Card
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          REGISTRATION CONFIRMATION & CASHIER ROUTING MODAL
         ========================================================= */}
      <AnimatePresence>
        {regConfirmModalPatient && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-slate-800 text-xs">
              <button 
                onClick={() => setRegConfirmModalPatient(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">I-Clinic Patient Registered</h3>
                  <p className="text-[11px] text-slate-500">Registration details and card fee invoice generated</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Patient Name:</span>
                  <span className="font-bold text-slate-900">{regConfirmModalPatient.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Assigned Card Number:</span>
                  <span className="font-mono font-bold text-[#2A758C]">{regConfirmModalPatient.hospitalNumber}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">New Patient Card Fee:</span>
                  <span className="font-mono font-bold text-emerald-700">₦3,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Billing Destination:</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                    Cashier &rarr; I Clinic Registrations
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  Cashier Verification Required
                </p>
                <p className="text-[10px] text-amber-800 leading-relaxed">
                  The I-Clinic patient has been registered and routed to the Cashier desk under <strong>I Clinic Registrations</strong>. Once verified, the patient moves immediately into the consultation queue.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => setRegConfirmModalPatient(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Close Modal
                </button>
                <button
                  onClick={() => handleVerifyCashierPayment(regConfirmModalPatient.id)}
                  className="flex-1 py-2.5 bg-[#2A758C] hover:bg-[#1f5869] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#A3D1E0]" />
                  <span>Verify Payment & Send to Consult</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          PATIENT CARD / DETAILS MODAL
         ========================================================= */}
      <AnimatePresence>
        {selectedPatientForView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative text-slate-800 text-xs">
              <button 
                onClick={() => setSelectedPatientForView(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-mono text-[#2A758C] font-bold uppercase">{selectedPatientForView.hospitalNumber}</span>
                <h3 className="text-base font-bold text-slate-900">{selectedPatientForView.name}</h3>
                <p className="text-xs text-slate-500">Registered Ocular Health File</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Phone</span>
                  <p className="font-semibold text-slate-800">{selectedPatientForView.phoneNumber}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">DOB</span>
                  <p className="font-semibold text-slate-800">{selectedPatientForView.dateOfBirth || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Occupation</span>
                  <p className="font-semibold text-slate-800">{selectedPatientForView.occupation || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Address</span>
                  <p className="font-semibold text-slate-800">{selectedPatientForView.address || 'N/A'}</p>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Chief Complaint</span>
                <p className="font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1">
                  {selectedPatientForView.chiefComplaint}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    const pat = selectedPatientForView;
                    setSelectedPatientForView(null);
                    selectPatientForConsult(pat);
                    handleTabSwitch('consultation');
                  }}
                  className="px-4 py-2 bg-[#A3D1E0] hover:bg-[#82bdcf] text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Proceed to Consultation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          PRINT / VIEW RECORD MODAL OVERLAY
         ========================================================= */}
      <AnimatePresence>
        {selectedRecordToView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative text-slate-800 text-xs">
              
              <button 
                onClick={() => setSelectedRecordToView(null)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="border-b-2 border-slate-200 pb-3 flex justify-between items-start">
                <div>
                  <h2 className="text-base font-black text-slate-950 flex items-center gap-1.5 uppercase font-sans">
                    <Eye className="h-5 w-5 text-[#2A758C]" />
                    Zikora Specialised Eye Services Card
                  </h2>
                  <p className="text-[9px] font-mono text-slate-400 tracking-wider">OFFICIAL CLINICAL ENCOUNTER LOG</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-[#2A758C] bg-[#A3D1E0]/20 px-3 py-1 rounded">
                    ID: {selectedRecordToView.hospitalNumber}
                  </span>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">Record Ref: {selectedRecordToView.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-y-2 gap-x-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Patient Name</p>
                  <p className="font-bold text-slate-900">{selectedRecordToView.patientName}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Date of Encounter</p>
                  <p className="font-bold font-mono">{selectedRecordToView.date}</p>
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Vitals BP / Glucose</p>
                  <p className="font-bold font-mono text-slate-900">{selectedRecordToView.vitals?.bp || '120/80'} mmHg | {selectedRecordToView.vitals?.sugar || '5.4'} mmol/L</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#2A758C] uppercase tracking-wider border-b border-slate-100 pb-1">1. Chief Complaint & History</h4>
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Chief Complaint:</span>
                    <p className="font-semibold text-slate-800">{selectedRecordToView.chiefComplaint || 'None recorded'}</p>
                  </div>
                  {selectedRecordToView.history && (
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Medical/Ocular History:</span>
                      <p className="text-slate-700">{selectedRecordToView.history}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-[#2A758C] uppercase tracking-wider border-b border-slate-100 pb-1">2. Clinical Assessment & Plan</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Clinical Diagnosis</span>
                    <p className="font-bold text-slate-900">{selectedRecordToView.diagnosis}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Treatment Plan / Prescription</span>
                    <p className="font-bold text-slate-800">{selectedRecordToView.treatmentPlan || selectedRecordToView.planMeds || 'Prescription provided'}</p>
                  </div>
                </div>

                {selectedRecordToView.services && selectedRecordToView.services.length > 0 && (
                  <div className="pt-2 border-t border-dashed border-slate-200">
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Services, Frames & Lenses Ordered</span>
                    <div className="space-y-1 mt-1 font-mono">
                      {selectedRecordToView.services.map((s: any, index: number) => (
                        <div key={index} className="flex justify-between text-[11px] text-slate-600">
                          <span>• {s.name} ({s.category || 'Eye Service'})</span>
                          <span className="font-bold">₦{Number(s.price).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-slate-200 pt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Issued by Zikora Eye Clinic Department</span>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print / PDF Receipt
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
