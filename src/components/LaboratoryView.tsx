import React, { useState, useEffect } from 'react';
import { apiFetch, socketManager } from '../utils/api';
import { 
  FlaskConical, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User as UserIcon,
  Loader2,
  RefreshCw,
  FlaskRound,
  UserPlus,
  DollarSign,
  FileText,
  Send,
  Phone,
  Calendar,
  CheckSquare,
  Square,
  ArrowRight,
  ClipboardList,
  Sparkles,
  ChevronRight,
  X,
  Calculator,
  Trash2
} from 'lucide-react';

// Categorized test catalog with exact names and prices from specifications
const WALK_IN_LAB_CATALOG = [
  {
    category: 'Parasitology',
    tests: [
      { id: 'mp_std', name: 'MP – Malaria Parasite (Standard)', price: 3000 },
      { id: 'mp_comp', name: 'MP – Malaria Parasite (Comprehensive)', price: 5000 },
    ]
  },
  {
    category: 'Serology',
    tests: [
      { id: 'widal', name: 'Widal Test', price: 5000 },
      { id: 'rvs', name: 'RVS – Retroviral Screening (HIV)', price: 5000 },
      { id: 'hbsag', name: 'HbsAg – Hepatitis B Surface Antigen', price: 3500 },
      { id: 'vdrl', name: 'VDRL – Syphilis Test', price: 3500 },
      { id: 'blood_grp_gen', name: 'Blood Group & Genotype', price: 3000 },
      { id: 'genotype', name: 'Genotype', price: 10000 },
      { id: 'cross_match', name: 'Cross Matching', price: 10000 },
      { id: 'hp_pylori', name: 'HP – Helicobacter Pylori', price: 5000 },
    ]
  },
  {
    category: 'Hematology',
    tests: [
      { id: 'fbc', name: 'FBC – Full Blood Count', price: 7000 },
      { id: 'hb', name: 'Hb – Haemoglobin', price: 3000 },
    ]
  },
  {
    category: 'Biochemistry',
    tests: [
      { id: 'ua', name: 'Urinalysis (UA)', price: 3000 },
      { id: 'lft_std', name: 'LFT – Liver Function Test (Standard)', price: 12000 },
      { id: 'lft_comp', name: 'LFT – Liver Function Test (Comprehensive)', price: 15000 },
      { id: 'seuc_std', name: 'SEUC – Serum Electrolytes, Urea & Creatinine (Standard)', price: 12000 },
      { id: 'seuc_comp', name: 'SEUC – Serum Electrolytes, Urea & Creatinine (Comprehensive)', price: 15000 },
      { id: 'psa', name: 'PSA – Prostate Specific Antigen', price: 15000 },
      { id: 'hba1c', name: 'HBA1c – Glycated Haemoglobin', price: 10500 },
      { id: 'hormonal', name: 'Hormonal Profile', price: 90000 },
      { id: 'fbs_rbs', name: 'FBS/RBS – Fasting/Random Blood Sugar', price: 2000 },
      { id: 'cholesterol', name: 'Cholesterol', price: 10000 },
      { id: 'bilirubin', name: 'Total Bilirubin', price: 7000 },
    ]
  },
  {
    category: 'Microbiology',
    tests: [
      { id: 'culture_sens', name: 'Culture & Sensitivity', price: 18000 },
      { id: 'sputum', name: 'Sputum Analysis', price: 18000 },
    ]
  }
];

export default function LaboratoryView({ activeTab: propActiveTab }: { activeTab?: string } = {}) {
  // Page Tab state: 'regular' | 'walkin'
  const [activeTab, setActiveTab] = useState<'regular' | 'walkin'>(propActiveTab === 'lab-walkin' ? 'walkin' : 'regular');

  useEffect(() => {
    if (propActiveTab) setActiveTab(propActiveTab === 'lab-walkin' ? 'walkin' : 'regular');
  }, [propActiveTab]);

  // Regular Queue state
  const [regularQueue, setRegularQueue] = useState<any[]>([]);
  const [selectedRegularPatient, setSelectedRegularPatient] = useState<any | null>(null);
  const [isLoadingRegular, setIsLoadingRegular] = useState(false);
  const [isSubmittingRegular, setIsSubmittingRegular] = useState(false);
  const [regularResultsInput, setRegularResultsInput] = useState('');
  const [orderedLabTests, setOrderedLabTests] = useState<any[]>([]);
  const [doctorNotes, setDoctorNotes] = useState('');

  // Walk-In state
  const [walkInPendingPayment, setWalkInPendingPayment] = useState<any[]>([]);
  const [walkInPaidReady, setWalkInPaidReady] = useState<any[]>([]);
  const [isLoadingWalkIn, setIsLoadingWalkIn] = useState(false);
  const [selectedPaidWalkIn, setSelectedPaidWalkIn] = useState<any | null>(null);
  const [walkInResultsInput, setWalkInResultsInput] = useState('');
  const [isSubmittingWalkInResults, setIsSubmittingWalkInResults] = useState(false);

  // Walk-In Registration Form state
  const [patientName, setPatientName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [selectedTests, setSelectedTests] = useState<{ id: string; name: string; price: number; category: string }[]>([]);
  const [isRegisteringWalkIn, setIsRegisteringWalkIn] = useState(false);

  // Feedback messages
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Action Confirmation Modal State across all laboratory tasks
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    patientName?: string;
    hospitalNumber?: string;
    badgeText?: string;
    details?: { label: string; value: string }[];
  } | null>(null);

  useEffect(() => {
    fetchRegularQueue();
    fetchWalkInQueue();

    // Auto-poll walk-in queue every 4 seconds to catch Cashier payment confirmations automatically
    const interval = setInterval(() => {
      fetchWalkInQueue();
    }, 4000);

    // Subscribe to WebSocket events for live real-time synchronization
    const unsubscribe = socketManager.subscribe((msg: any) => {
      if ([
        'LAB_ORDER_CREATED',
        'PATIENT_ROUTED_TO_LAB',
        'LAB_RESULTS_READY',
        'LAB_WALK_IN_REGISTERED',
        'LAB_WALK_IN_PAID',
        'PAYMENT_HANDOVER_CONFIRMED'
      ].includes(msg.type)) {
        fetchRegularQueue();
        fetchWalkInQueue();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // Mark walk-in patient as sent to cashier
  const handleMarkSentToCashier = async (encounterId: string, pName: string) => {
    try {
      const res = await apiFetch('/payments/lab/mark-sent-to-cashier', {
        method: 'POST',
        body: JSON.stringify({ encounterId })
      });
      if (res.success) {
        setSuccess(`Walk-in patient ${pName} marked as "Sent to Cashier"! Awaiting payment confirmation.`);
        fetchWalkInQueue();
      } else {
        setError(res.error || 'Failed to mark as sent to cashier.');
      }
    } catch (err: any) {
      setError(err.message || 'Error marking as sent to cashier.');
    }
  };

  // Fetch Regular Lab Queue (patients sent from Doctor)
  const fetchRegularQueue = async () => {
    setIsLoadingRegular(true);
    try {
      const res = await apiFetch('/patients/opd/queue');
      if (res.success) {
        const labItems = (res.data || []).filter((q: any) => q.queue_type === 'Laboratory' && (q.status === 'Waiting' || q.status === 'Processing'));
        setRegularQueue(labItems);
        if (!selectedRegularPatient && labItems.length > 0) {
          handleSelectRegularPatient(labItems[0]);
        } else if (labItems.length === 0) {
          setSelectedRegularPatient(null);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch regular lab queue:', err);
      setRegularQueue([]);
      setSelectedRegularPatient(null);
    } finally {
      setIsLoadingRegular(false);
    }
  };

  // Fetch Walk-In Queue (Pending Payment & Paid - Ready for Testing)
  const fetchWalkInQueue = async () => {
    setIsLoadingWalkIn(true);
    try {
      const res = await apiFetch('/payments/lab/walk-in');
      if (res.success && res.data) {
        setWalkInPendingPayment(res.data.pendingPayment || []);
        setWalkInPaidReady(res.data.paidReadyForTesting || []);
      } else {
        setWalkInPendingPayment([]);
        setWalkInPaidReady([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch walk-in queue:', err);
      setWalkInPendingPayment([]);
      setWalkInPaidReady([]);
    } finally {
      setIsLoadingWalkIn(false);
    }
  };

  // Select patient from Regular Lab Queue
  const handleSelectRegularPatient = async (patient: any) => {
    setSelectedRegularPatient(patient);
    setRegularResultsInput('');
    setError('');
    setSuccess('');

    setDoctorNotes(patient.doctor_notes || '');

    if (patient.ordered_tests && patient.ordered_tests.length > 0) {
      setOrderedLabTests(patient.ordered_tests);
    } else {
      try {
        const res = await apiFetch(`/patients/opd/queue/lab-orders?encounterId=${patient.encounter_id}`);
        if (res.success && res.data && res.data.length > 0) {
          const mapped = res.data.map((t: any) => ({
            category: t.category || (t.test_name.includes('HP') || t.test_name.includes('Widal') ? 'Serology' : 'Hematology'),
            name: t.test_name,
            price: Number(t.price) || (t.test_name.includes('HP') ? 5000 : 3000)
          }));
          setOrderedLabTests(mapped);
        } else {
          setOrderedLabTests([]);
        }
      } catch (e) {
        setOrderedLabTests([]);
      }
    }
  };

  // Submit results for Regular Lab Queue patient
  const handleSubmitResultsToDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegularPatient) return;
    if (!regularResultsInput.trim()) {
      setError('Please enter detailed lab test results.');
      return;
    }

    setIsSubmittingRegular(true);
    setError('');
    setSuccess('');

    try {
      const testResults = orderedLabTests.length > 0 
        ? orderedLabTests.map(t => ({ name: t.name, result: regularResultsInput, findings: 'Completed' }))
        : [{ name: 'Pathology Panel', result: regularResultsInput, findings: 'Completed' }];

      const res = await apiFetch('/patients/opd/queue/lab-complete', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedRegularPatient.patient_id || selectedRegularPatient.hospital_number,
          encounterId: selectedRegularPatient.encounter_id,
          testResults
        })
      });

      if (res.success) {
        const pName = selectedRegularPatient.patient_name || selectedRegularPatient.name;
        const hNum = selectedRegularPatient.hospital_number || '—';

        setSuccess(`Laboratory results for ${pName} submitted successfully! Patient routed back to Doctor Consultation department.`);
        
        fetchRegularQueue();
        setSelectedRegularPatient(null);
        setRegularResultsInput('');

        setActionModal({
          isOpen: true,
          title: 'Laboratory Results Published & Sent to Doctor',
          message: `Test results for ${pName} have been finalized and published. Patient file updated and routed to Clinical Doctor Consultation.`,
          patientName: pName,
          hospitalNumber: hNum,
          badgeText: 'Routed to Doctor Consultation Queue',
          details: [
            { label: 'Status', value: 'Completed & Published' },
            { label: 'Routing', value: 'Doctor / Clinical Department' }
          ]
        });
      } else {
        setError(res.error || 'Failed to submit laboratory results to doctor.');
      }
    } catch (err: any) {
      setError('Failed to submit laboratory results. Please check database connection.');
    } finally {
      setIsSubmittingRegular(false);
    }
  };

  // Toggle test selection in Walk-In Form
  const handleToggleTest = (test: { id: string; name: string; price: number }, category: string) => {
    setSelectedTests(prev => {
      const exists = prev.some(t => t.id === test.id);
      if (exists) {
        return prev.filter(t => t.id !== test.id);
      } else {
        return [...prev, { ...test, category }];
      }
    });
  };

  // Calculate total price of walk-in selected tests
  const totalWalkInPrice = selectedTests.reduce((sum, t) => sum + t.price, 0);

  // Register Walk-In Patient
  const handleRegisterWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Please enter Patient Name.');
      return;
    }
    if (!dob.trim()) {
      setError('Please enter Date of Birth.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter Phone Number.');
      return;
    }
    if (selectedTests.length === 0) {
      setError('Please select at least 1 laboratory test.');
      return;
    }

    setIsRegisteringWalkIn(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/payments/lab/walk-in', {
        method: 'POST',
        body: JSON.stringify({
          patientName,
          dob,
          gender,
          maritalStatus,
          phoneNumber,
          address,
          referringDoctor,
          tests: selectedTests,
          totalAmount: totalWalkInPrice,
          paymentMethod: 'Cash'
        })
      });

      if (res.success) {
        const registeredName = patientName;
        const totalFee = totalWalkInPrice;
        const testCount = selectedTests.length;

        setSuccess(`Walk-in patient ${patientName} registered! Info sent to Cashier for payment processing (₦${totalWalkInPrice.toLocaleString()}).`);
        
        // Reset form
        setPatientName('');
        setDob('');
        setGender('Male');
        setMaritalStatus('Single');
        setPhoneNumber('');
        setAddress('');
        setReferringDoctor('');
        setSelectedTests([]);
        setError('');

        // Refresh lists
        fetchWalkInQueue();

        setActionModal({
          isOpen: true,
          title: 'Walk-In Patient Registered Successfully',
          message: `Walk-in patient ${registeredName} registered for ${testCount} lab test(s). Order details sent directly to Cashier Desk for payment verification.`,
          patientName: registeredName,
          hospitalNumber: 'Walk-In Patient',
          badgeText: 'Awaiting Cashier Payment Verification',
          details: [
            { label: 'Total Payable Fee', value: `₦${totalFee.toLocaleString()}` },
            { label: 'Selected Tests', value: `${testCount} Investigation(s)` },
            { label: 'Routing Department', value: 'Cashier Department (Awaiting Cash Payment)' }
          ]
        });
      } else {
        setError(res.error || 'Failed to register walk-in patient.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register walk-in patient on database.');
    } finally {
      setIsRegisteringWalkIn(false);
    }
  };

  // Submit results for Paid Walk-In Patient
  const handleProcessPaidWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaidWalkIn) return;
    if (!walkInResultsInput.trim()) {
      setError('Please enter test results.');
      return;
    }

    setIsSubmittingWalkInResults(true);
    setError('');
    setSuccess('');

    try {
      const res = await apiFetch('/patients/opd/queue/lab-complete', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPaidWalkIn.patientId,
          encounterId: selectedPaidWalkIn.encounterId,
          testResults: [{ name: selectedPaidWalkIn.testsSummary || 'Walk-In Lab Test', result: walkInResultsInput, findings: 'Completed' }]
        })
      });

      if (res.success) {
        const pName = selectedPaidWalkIn.patientName;

        setSuccess(`Laboratory results for walk-in patient ${pName} processed and finalized!`);
        fetchWalkInQueue();
        setSelectedPaidWalkIn(null);
        setWalkInResultsInput('');

        setActionModal({
          isOpen: true,
          title: 'Walk-In Laboratory Results Published',
          message: `Laboratory test results for walk-in patient ${pName} have been finalized and printed/archived.`,
          patientName: pName,
          hospitalNumber: 'Walk-In Patient',
          badgeText: 'Investigation Completed & Finalized',
          details: [
            { label: 'Status', value: 'Completed & Printed' },
            { label: 'Investigation Summary', value: selectedPaidWalkIn.testsSummary || 'Lab Tests' }
          ]
        });
      } else {
        setError(res.error || 'Failed to process laboratory results.');
      }
    } catch (err: any) {
      setError('Failed to process laboratory results. Please check database connection.');
    } finally {
      setIsSubmittingWalkInResults(false);
    }
  };

  // Search query filter for laboratory patient lists
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate total costs for selected regular patient
  const totalRegularCost = orderedLabTests.reduce((sum, item) => sum + (item.price || 0), 0);

  // Group ordered tests by category
  const groupedOrderedByCategory = orderedLabTests.reduce((acc: any, item: any) => {
    const cat = item.category || 'General Laboratory';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Filtered queues based on search query
  const filteredRegularQueue = regularQueue.filter((patient) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (patient.patient_name || patient.name || '').toLowerCase();
    const id = (patient.hospital_number || patient.patient_id || patient.id || '').toLowerCase();
    const phone = (patient.phone_number || '').toLowerCase();
    const notes = (patient.doctor_notes || '').toLowerCase();
    const tests = (patient.ordered_tests || []).map((t: any) => t.name || '').join(' ').toLowerCase();
    return name.includes(q) || id.includes(q) || phone.includes(q) || notes.includes(q) || tests.includes(q);
  });

  const filteredWalkInPending = walkInPendingPayment.filter((patient) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (patient.patientName || '').toLowerCase();
    const phone = (patient.phoneNumber || '').toLowerCase();
    const summary = (patient.testsSummary || '').toLowerCase();
    const id = (patient.patientId || patient.encounterId || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || summary.includes(q) || id.includes(q);
  });

  const filteredWalkInPaid = walkInPaidReady.filter((patient) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (patient.patientName || '').toLowerCase();
    const phone = (patient.phoneNumber || '').toLowerCase();
    const summary = (patient.testsSummary || '').toLowerCase();
    const id = (patient.patientId || patient.encounterId || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || summary.includes(q) || id.includes(q);
  });

  return (
    <div className="space-y-6" id="laboratory_department_root">
      {/* Top Department Header & Page Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#2A758C]/10 flex items-center justify-center text-[#2A758C]">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">
              Laboratory Department
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Manage doctor-referred pathology queues, walk-in registrations, and result submissions.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchRegularQueue();
            fetchWalkInQueue();
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
          title="Refresh Laboratory Queues"
        >
          <RefreshCw className={`h-4 w-4 ${(isLoadingRegular || isLoadingWalkIn) ? 'animate-spin' : ''}`} />
          <span>Refresh Queues</span>
        </button>
      </div>

      {/* Prominent Page Selection Tabs */}
      <div className="department-page-nav grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('regular')}
          className={`p-4 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'regular'
              ? 'bg-[#2A758C] text-white shadow-md ring-2 ring-[#2A758C]/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${activeTab === 'regular' ? 'bg-white/20 text-white' : 'bg-[#2A758C]/10 text-[#2A758C]'}`}>
              <FlaskRound className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight">Regular Lab Queue</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'regular' ? 'bg-white/20 text-white' : 'bg-[#2A758C] text-white'
                }`}>
                  {regularQueue.length} Patient(s) Waiting
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-medium ${activeTab === 'regular' ? 'text-cyan-100' : 'text-slate-500'}`}>
                Doctor-referred patients with confirmed payment waiting for tests
              </p>
            </div>
          </div>
          <ChevronRight className={`h-5 w-5 ${activeTab === 'regular' ? 'text-white' : 'text-slate-400'}`} />
        </button>

        <button
          onClick={() => setActiveTab('walkin')}
          className={`p-4 rounded-2xl text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'walkin'
              ? 'bg-[#2A758C] text-white shadow-md ring-2 ring-[#2A758C]/20'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${activeTab === 'walkin' ? 'bg-white/20 text-white' : 'bg-[#2A758C]/10 text-[#2A758C]'}`}>
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight">Walk-in Lab Patient</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'walkin' ? 'bg-white/20 text-white' : 'bg-[#2A758C] text-white'
                }`}>
                  {walkInPaidReady.length + walkInPendingPayment.length} Total
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-medium ${activeTab === 'walkin' ? 'text-cyan-100' : 'text-slate-500'}`}>
                Direct Walk-in Patient Registration, Pending Payment & Paid Testing
              </p>
            </div>
          </div>
          <ChevronRight className={`h-5 w-5 ${activeTab === 'walkin' ? 'text-white' : 'text-slate-400'}`} />
        </button>
      </div>

      {/* Laboratory Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#2A758C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lab patients by name, hospital ID, phone number, or ordered test..."
            className="w-full pl-11 pr-10 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-semibold text-slate-900 rounded-2xl border border-slate-200/80 focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/20 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full bg-slate-200/60 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Clear search filter"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {searchQuery.trim() && (
          <div className="px-3.5 py-2.5 bg-[#2A758C]/10 text-[#2A758C] rounded-2xl text-xs font-bold shrink-0 flex items-center justify-between sm:justify-start gap-2 border border-[#2A758C]/20">
            <span>SearchResults:</span>
            <span className="font-extrabold font-mono">
              {activeTab === 'regular' 
                ? `${filteredRegularQueue.length} patient(s)` 
                : `${filteredWalkInPending.length + filteredWalkInPaid.length} patient(s)`}
            </span>
          </div>
        )}
      </div>

      {/* Global Toast Feedback */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PAGE 1: REGULAR LAB QUEUE */}
      {activeTab === 'regular' && (
        <div className="space-y-6">
          {/* Summary Metric Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#2A758C] shrink-0 border border-white/10">
                <FlaskConical className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Department Queue Summary</span>
                <h2 className="text-xl font-black tracking-tight">Pending Lab Test Page</h2>
              </div>
            </div>
            <div className="bg-white/10 px-5 py-3 rounded-2xl border border-white/10 backdrop-blur-md">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Total Patients Waiting</span>
              <span className="text-2xl font-black text-white">{regularQueue.length} Patient(s)</span>
            </div>
          </div>

          {/* Two-Column Grid: Left = Waiting List, Right = Patient Details & Test Execution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Waiting Queue List */}
            <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#2A758C]" />
                  Patients Waiting in Dept ({filteredRegularQueue.length})
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Pending Lab Test
                </span>
              </div>

              {isLoadingRegular ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="animate-spin h-7 w-7 text-[#2A758C]" />
                  <span>Loading waiting patients...</span>
                </div>
              ) : regularQueue.length === 0 ? (
                <div className="py-16 text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Patients Waiting</p>
                  <p className="text-[11px] text-slate-400">All referred laboratory tests have been processed.</p>
                </div>
              ) : filteredRegularQueue.length === 0 ? (
                <div className="py-16 text-center p-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 space-y-2">
                  <Search className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No Matching Patients</p>
                  <p className="text-[11px] text-slate-400">No patients match "{searchQuery}" in Regular Queue.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {filteredRegularQueue.map((patient) => {
                    const isSelected = selectedRegularPatient?.id === patient.id;
                    const name = patient.patient_name || patient.name || 'Patient';
                    const id = patient.hospital_number || patient.patient_id || patient.id;
                    const phone = patient.phone_number || '08035006005';

                    return (
                      <button
                        key={patient.id}
                        onClick={() => handleSelectRegularPatient(patient)}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#2A758C]/5 border-[#2A758C] shadow-sm'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm">{name}</h4>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {id}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              {phone}
                            </p>
                          </div>
                          <ChevronRight className={`h-5 w-5 mt-1 transition-transform ${isSelected ? 'text-[#2A758C] translate-x-0.5' : 'text-slate-300'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Selected Patient Details & Results Form */}
            <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
              {!selectedRegularPatient ? (
                <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center space-y-3 p-8">
                  <FlaskRound className="h-12 w-12 text-slate-300" />
                  <h3 className="text-sm font-bold text-slate-700">Select a Patient from the Pending Lab Queue</h3>
                  <p className="text-xs text-slate-400 max-w-md">
                    Click on any patient listed on the left to view doctor notes, ordered tests breakdown, and submit laboratory test results.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Patient Info Header */}
                  <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{selectedRegularPatient.patient_name || selectedRegularPatient.name || 'Chiamaka Ike'}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium mt-1">
                        <span className="font-mono bg-slate-200/70 px-2 py-0.5 rounded-md font-bold text-slate-800">
                          ID: {selectedRegularPatient.hospital_number || selectedRegularPatient.patient_id || 'PAT-8005'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {selectedRegularPatient.phone_number || '08035006005'}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0 self-start sm:self-auto">
                      Awaiting Lab Processing
                    </span>
                  </div>

                  {/* Doctor's Notes */}
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 space-y-1">
                    <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider font-mono block">Doctor's Notes</span>
                    <p className="text-xs text-amber-950 font-medium leading-relaxed">
                      {doctorNotes || 'Suspected H. Pylori infection and possible anaemia. Order HP and Hb.'}
                    </p>
                  </div>

                  {/* Categorized Ordered Tests & Cost Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-mono">
                      Ordered Tests
                    </h4>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                      {Object.keys(groupedOrderedByCategory).map((catKey) => (
                        <div key={catKey} className="space-y-2">
                          <span className="text-[11px] font-black text-[#2A758C] uppercase tracking-wider block font-mono border-b border-slate-200/80 pb-1">
                            {catKey}
                          </span>
                          <div className="space-y-1.5 pl-2">
                            {groupedOrderedByCategory[catKey].map((testItem: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-800">
                                <span>{testItem.name}</span>
                                <span className="font-mono text-slate-900 font-bold">₦{(testItem.price || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Total Lab Cost */}
                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-black text-sm text-slate-900">
                        <span>Total Lab Cost:</span>
                        <span className="text-[#2A758C] text-base font-mono">₦{totalRegularCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Results Form */}
                  <form onSubmit={handleSubmitResultsToDoctor} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-extrabold text-slate-800">
                        Lab Results <span className="text-rose-500">*</span>
                      </label>

                      <textarea
                        rows={6}
                        required
                        value={regularResultsInput}
                        onChange={(e) => setRegularResultsInput(e.target.value)}
                        placeholder={`Enter detailed lab test results here...\n\nExample:\nMalaria Parasite: Negative\nBlood Group: O+\nHemoglobin: 14.5 g/dL`}
                        className="w-full p-4 text-xs font-mono text-slate-800 bg-white rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C] focus:border-transparent transition-all placeholder:text-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingRegular}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#2A758C] hover:bg-[#1f5869] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingRegular ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4" />
                          <span>Submitting Results to Doctor...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit Results to Doctor</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 2: WALK-IN LAB PATIENT */}
      {activeTab === 'walkin' && (
        <div className="space-y-8">
          {/* Top Registration Form Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-[#2A758C]" />
                Register Walk-in Patient
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Fill this form for direct walk-in patients requesting laboratory tests without prior internal doctor consultation.
              </p>
            </div>

            <form onSubmit={handleRegisterWalkIn} className="space-y-6">
              {/* Personal Details Inputs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Patient Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Patient Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]"
                  />
                </div>

                {/* Date of Birth */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C] text-slate-900 font-medium cursor-pointer"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C] cursor-pointer"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Marital Status */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Marital Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C] cursor-pointer"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="08012345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Address</label>
                  <input
                    type="text"
                    placeholder="Street address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]"
                  />
                </div>

                {/* Referring Doctor (Optional) */}
                <div className="space-y-1 sm:col-span-2 md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700">Referring Doctor (Optional)</label>
                  <input
                    type="text"
                    placeholder="Dr. External Name"
                    value={referringDoctor}
                    onChange={(e) => setReferringDoctor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]"
                  />
                </div>
              </div>

              {/* Select Lab Tests Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-black text-slate-700 uppercase font-mono">
                    Total Payable Fee:
                  </span>
                  <span className="text-base font-black text-[#2A758C] font-mono">
                    ₦{totalWalkInPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
                    Select Lab Tests <span className="text-rose-500">*</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
                  {WALK_IN_LAB_CATALOG.map((catGroup) => (
                    <div key={catGroup.category} className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 shadow-2xs">
                      <h4 className="text-xs font-black text-[#2A758C] uppercase tracking-wider font-mono border-b border-slate-100 pb-1.5">
                        {catGroup.category}
                      </h4>
                      <div className="space-y-1.5 pt-1">
                        {catGroup.tests.map((test) => {
                          const isChecked = selectedTests.some(t => t.id === test.id);

                          return (
                            <button
                              type="button"
                              key={test.id}
                              onClick={() => handleToggleTest(test, catGroup.category)}
                              className={`w-full flex items-center justify-between text-left p-2 rounded-lg transition-all text-xs cursor-pointer ${
                                isChecked
                                  ? 'bg-[#2A758C]/10 border border-[#2A758C]/30 text-slate-900 font-bold'
                                  : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2 pr-2">
                                {isChecked ? (
                                  <CheckSquare className="h-4 w-4 text-[#2A758C] shrink-0" />
                                ) : (
                                  <Square className="h-4 w-4 text-slate-300 shrink-0" />
                                )}
                                <span>{test.name}</span>
                              </div>
                              <span className="font-mono text-slate-800 font-bold shrink-0">
                                ₦{test.price.toLocaleString()}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Form Button */}
              <button
                type="submit"
                disabled={isRegisteringWalkIn || selectedTests.length === 0 || !patientName.trim() || !dob.trim() || !phoneNumber.trim()}
                className="w-full py-3.5 rounded-2xl bg-[#2A758C] hover:bg-[#1f5869] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegisteringWalkIn ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>Registering & Sending to Cashier...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>
                      {selectedTests.length > 0 
                        ? `Register & Send to Cashier (₦${totalWalkInPrice.toLocaleString()})`
                        : 'Register & Send to Cashier'
                      }
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Lower Grid: Pending Payment vs Paid - Ready for Testing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Card: Pending Payment (X) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Pending Payment ({filteredWalkInPending.length})
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Awaiting Cashier
                </span>
              </div>

              {walkInPendingPayment.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                  No walk-in patients pending payment.
                </div>
              ) : filteredWalkInPending.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                  No pending payment matches "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {filteredWalkInPending.map((patient, idx) => (
                    <div
                      key={patient.encounterId || idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">{patient.patientName}</h4>
                            <span className="text-[10px] font-mono text-[#2A758C] font-bold">
                              {patient.hospitalNumber || 'NEW'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-500 mt-0.5">
                            📞 {patient.phoneNumber} • {patient.gender} ({patient.dob || '—'})
                          </p>
                          {patient.referringDoctor && (
                            <p className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                              Ref: {patient.referringDoctor}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-[#2A758C] font-mono block">
                            ₦{(patient.totalAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {patient.testCount || 1} test(s)
                          </span>
                        </div>
                      </div>

                      {/* Selected Tests Tags */}
                      {patient.testsList && patient.testsList.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {patient.testsList.map((testName: string, tIdx: number) => (
                            <span
                              key={tIdx}
                              className="px-2 py-0.5 bg-white border border-slate-200 text-[10px] font-extrabold text-slate-700 rounded-lg"
                            >
                              {testName}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] gap-2">
                        <span className="text-amber-800 font-bold italic flex items-center gap-1.5 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                          {patient.isSentToCashier ? 'Sent to Cashier — Awaiting Payment' : 'Pending Payment'}
                        </span>

                        {patient.isSentToCashier ? (
                          <span className="px-3 py-1 text-[10px] font-black rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Sent to Cashier
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMarkSentToCashier(patient.encounterId, patient.patientName)}
                            className="px-3 py-1.5 text-[10px] font-black rounded-xl bg-[#2A758C] hover:bg-[#1f5869] text-white transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
                          >
                            <Send className="h-3 w-3" />
                            <span>Mark as "Sent to Cashier"</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Card: Paid - Ready for Testing (Y) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Paid - Ready for Testing ({filteredWalkInPaid.length})
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ready to Process
                </span>
              </div>

              {walkInPaidReady.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                  No paid walk-in patients ready for testing.
                </div>
              ) : filteredWalkInPaid.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-100 rounded-2xl">
                  No ready walk-in matches "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {filteredWalkInPaid.map((patient, idx) => (
                    <button
                      key={patient.encounterId || idx}
                      onClick={() => setSelectedPaidWalkIn(patient)}
                      className="w-full text-left p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-[#2A758C] transition-colors">
                            {patient.patientName}
                          </h4>
                          <p className="text-xs font-mono text-slate-500">{patient.phoneNumber}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                          {patient.testCount || 1} test(s) - Click to process
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Modal/Drawer when processing a Paid Walk-In Patient */}
          {selectedPaidWalkIn && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Process Lab Test: {selectedPaidWalkIn.patientName}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Phone: {selectedPaidWalkIn.phoneNumber}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPaidWalkIn(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <span className="font-bold text-slate-700">Requested Tests:</span>
                  <p className="text-slate-600 font-mono">{selectedPaidWalkIn.testsSummary || 'Laboratory Panel'}</p>
                </div>

                <form onSubmit={handleProcessPaidWalkIn} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-extrabold text-slate-800">
                      Enter Laboratory Test Results <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={walkInResultsInput}
                      onChange={(e) => setWalkInResultsInput(e.target.value)}
                      placeholder="Enter findings and values (e.g. MP: Negative, Widal: 1:80, FBC: Normal)..."
                      className="w-full p-3.5 text-xs font-mono bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPaidWalkIn(null)}
                      className="px-4 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingWalkInResults}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-[#2A758C] hover:bg-[#1f5869] rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingWalkInResults ? (
                        <>
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                          <span>Saving Results...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Complete & Finalize Test</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GLOBAL LABORATORY ACTION CONFIRMATION MODAL */}
      {actionModal && actionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-teal-100 text-[#2A758C] flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">{actionModal.title}</h3>
                  <p className="text-xs text-[#2A758C] font-bold mt-0.5">{actionModal.badgeText || 'Laboratory Task Executed'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 bg-teal-50/70 border border-teal-100 rounded-2xl space-y-2">
              <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                {actionModal.message}
              </p>
              {actionModal.patientName && (
                <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Patient Name:</span>
                  <span className="font-extrabold text-slate-900">{actionModal.patientName} ({actionModal.hospitalNumber || 'Walk-In'})</span>
                </div>
              )}
            </div>

            {actionModal.details && actionModal.details.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Departmental Processing Log</p>
                <div className="divide-y divide-slate-100 bg-slate-50/80 rounded-2xl border border-slate-100 p-3 space-y-2">
                  {actionModal.details.map((item, idx) => (
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
                onClick={() => setActionModal(null)}
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
