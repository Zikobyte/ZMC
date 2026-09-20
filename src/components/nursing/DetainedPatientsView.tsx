import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  BedDouble, 
  LogOut, 
  RefreshCw, 
  X, 
  Check, 
  Sparkles, 
  ClipboardList, 
  Stethoscope, 
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Building2,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PendingPatient {
  id: string;
  patient_id: string;
  hospital_number: string;
  name: string;
  gender: string;
  age: string;
  phone_number?: string;
  category?: string;
  department?: string;
  referred_by?: string;
  reason?: string;
  pending_since?: string;
  created_at?: string;
}

export interface DetainedPatient {
  id: string;
  patient_id: string;
  hospital_number: string;
  name: string;
  gender: string;
  age: string;
  phone_number?: string;
  department?: string;
  reason_for_detention: string;
  initial_observation: string;
  last_nurse_notes: string;
  detained_at: string;
  detained_by: string;
  status: string;
}

export default function DetainedPatientsView() {
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>([]);
  const [detainedPatients, setDetainedPatients] = useState<DetainedPatient[]>([]);
  const [totalDetainedCount, setTotalDetainedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedForDetention, setSelectedForDetention] = useState<PendingPatient | null>(null);
  const [detentionReason, setDetentionReason] = useState<string>('');
  const [clinicalCardObservation, setClinicalCardObservation] = useState<string>('');
  const [isSubmittingDetention, setIsSubmittingDetention] = useState<boolean>(false);

  // Admission Modal State
  const [selectedForAdmission, setSelectedForAdmission] = useState<PendingPatient | DetainedPatient | null>(null);
  const [admissionForm, setAdmissionForm] = useState({
    ward: 'General Ward Abuja',
    bedNumber: '',
    provisionalDiagnosis: '',
    nextOfKin: '',
    region: 'South West',
    religion: 'Christianity',
    doctorOrders: ''
  });
  const [isSubmittingAdmission, setIsSubmittingAdmission] = useState<boolean>(false);

  // Confirmation / Success Feedback Modal
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'detained' | 'admitted' | 'released' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('zmc_token') || localStorage.getItem('token') || localStorage.getItem('zmc_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchDetainedData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/nursing/detained?search=${encodeURIComponent(searchQuery)}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPendingPatients(data.pendingAdmissions || []);
          setDetainedPatients(data.currentlyDetained || []);
          setTotalDetainedCount(data.totalDetained ?? (data.currentlyDetained || []).length);
        }
      }
    } catch (err) {
      console.error('Failed to fetch detained patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetainedData();
  }, [searchQuery]);

  // Open Detain Modal
  const handleOpenDetainModal = (patient: PendingPatient) => {
    setSelectedForDetention(patient);
    setDetentionReason('BP check after medication');
    setClinicalCardObservation(`Patient conscious and alert. Initial vitals checked: BP 145/95 mmHg, HR 82 bpm, SpO2 98%. Commencing close bedside observation.`);
  };

  // Submit Detain Patient
  const handleConfirmDetain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForDetention) return;
    if (!detentionReason.trim()) {
      alert('Please provide the reason for detention.');
      return;
    }
    if (!clinicalCardObservation.trim()) {
      alert('Please record the initial observation on the clinical card.');
      return;
    }

    try {
      setIsSubmittingDetention(true);
      const res = await fetch('/api/nursing/detained/detain', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          patientId: selectedForDetention.id || selectedForDetention.hospital_number,
          reason: detentionReason.trim(),
          initialObservation: clinicalCardObservation.trim(),
          nurseName: 'Nurse On-Duty'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Success dialog with exact message requested
        setConfirmationDialog({
          isOpen: true,
          title: 'Patient Marked as Detained',
          message: `Patient ${selectedForDetention.name} marked as detained. Reason: ${detentionReason.trim()}. Initial observation recorded on clinical card: ${clinicalCardObservation.trim()}.`,
          type: 'detained'
        });

        setSelectedForDetention(null);
        setDetentionReason('');
        setClinicalCardObservation('');
        fetchDetainedData();
      } else {
        alert(data.error || 'Failed to mark patient as detained');
      }
    } catch (err: any) {
      console.error('Error detaining patient:', err);
      alert('Network error while detaining patient');
    } finally {
      setIsSubmittingDetention(false);
    }
  };

  // Release Detained Patient
  const handleReleasePatient = async (patient: DetainedPatient) => {
    if (!window.confirm(`Are you sure you want to release ${patient.name} from observation? The patient will no longer be detained.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/nursing/detained/${encodeURIComponent(patient.id)}/release`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmationDialog({
          isOpen: true,
          title: 'Patient Released from Observation',
          message: data.message || `Patient ${patient.name} has been released from observation.`,
          type: 'released'
        });
        fetchDetainedData();
      } else {
        alert(data.error || 'Failed to release patient');
      }
    } catch (err: any) {
      console.error('Error releasing patient:', err);
      alert('Network error while releasing patient');
    }
  };

  // Open Admission Modal
  const handleOpenAdmitModal = (patient: PendingPatient | DetainedPatient) => {
    setSelectedForAdmission(patient);
    setAdmissionForm({
      ward: 'General Ward Abuja',
      bedNumber: 'Bed 847',
      provisionalDiagnosis: (patient as any).reason || (patient as any).reason_for_detention || 'Observation and medical stabilization',
      nextOfKin: 'Immediate Relative (Contact verified)',
      region: 'South West',
      religion: 'Christianity',
      doctorOrders: 'Full bed rest, continuous vital monitoring, intake/output charting, and medication as charted.'
    });
  };

  // Submit Admission
  const handleConfirmAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForAdmission) return;
    if (!admissionForm.bedNumber.trim()) {
      alert('Please specify a bed number.');
      return;
    }

    try {
      setIsSubmittingAdmission(true);
      const res = await fetch(`/api/nursing/detained/${encodeURIComponent(selectedForAdmission.id)}/admit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ward: admissionForm.ward,
          bedNumber: admissionForm.bedNumber.trim(),
          provisionalDiagnosis: admissionForm.provisionalDiagnosis.trim(),
          nextOfKin: admissionForm.nextOfKin.trim(),
          region: admissionForm.region,
          religion: admissionForm.religion,
          doctorOrders: admissionForm.doctorOrders.trim(),
          nurseName: 'Nurse On-Duty'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Confirmation dialogue:
        // "Once you click on complete admission, it will say patient has been admitted to private room bed 847 or whatever information that was filled in on the form."
        setConfirmationDialog({
          isOpen: true,
          title: 'Admission Completed Successfully',
          message: data.message || `Patient ${selectedForAdmission.name} has been admitted to ${admissionForm.ward} ${admissionForm.bedNumber.trim().toLowerCase().startsWith('bed') ? admissionForm.bedNumber.trim() : `Bed ${admissionForm.bedNumber.trim()}`}.`,
          type: 'admitted'
        });

        setSelectedForAdmission(null);
        fetchDetainedData();
      } else {
        alert(data.error || 'Failed to complete patient admission');
      }
    } catch (err: any) {
      console.error('Error admitting patient:', err);
      alert('Network error while completing admission');
    } finally {
      setIsSubmittingAdmission(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* 1. TOP NOTICE / INFORMATION BANNER */}
      {/* Exact required text: "These patients are held for observation only. No formal admission sheet required. Observations recorded on clinical card." */}
      <div 
        id="detained-patients-notice-banner"
        className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-amber-950 shadow-xs"
      >
        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
          <Activity className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900">
              Short-Stay Clinical Protocol
            </span>
            <span className="text-xs font-bold text-amber-900">Observation Guidelines</span>
          </div>
          <p className="text-sm sm:text-base font-semibold text-amber-900 leading-snug">
            These patients are held for observation only. No formal admission sheet required. Observations recorded on clinical card.
          </p>
        </div>
      </div>

      {/* 2. TABLE CONTAINER: "Mark patient as detained from pending admissions" */}
      <div 
        id="pending-admissions-container" 
        className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5"
      >
        {/* Table Header with Title, Total Detained Badge, and Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <ClipboardList className="h-5 w-5 text-[#2A758C]" />
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Mark patient as detained from pending admissions
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select any pending patient to detain for observation or complete formal ward admission.
            </p>
          </div>

          {/* Metrics & Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Total Detained Patients Count Badge */}
            <div 
              id="total-detained-metric-badge"
              className="bg-amber-50 border border-amber-200/80 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xs"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block leading-none">
                  Total Detained
                </span>
                <span className="text-base font-black text-amber-950 leading-tight">
                  {totalDetainedCount} {totalDetainedCount === 1 ? 'Patient' : 'Patients'}
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name, ID..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20 focus:border-[#2A758C] text-slate-800 font-medium transition-all"
              />
            </div>

            <button
              onClick={fetchDetainedData}
              title="Refresh Data"
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-[#2A758C]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Pending Admissions Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3.5">Patient Details</th>
                <th scope="col" className="px-4 py-3.5">Demographics</th>
                <th scope="col" className="px-4 py-3.5">Department / Referred By</th>
                <th scope="col" className="px-4 py-3.5">Observation / Admission Reason</th>
                <th scope="col" className="px-4 py-3.5">Time Logged</th>
                <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium">
              {pendingPatients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30 text-[#2A758C]" />
                    <p className="font-semibold text-slate-600">No pending admissions found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">All triage candidates have either been detained or admitted to wards.</p>
                  </td>
                </tr>
              ) : (
                pendingPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#2A758C]/10 border border-[#2A758C]/20 text-[#2A758C] flex items-center justify-center font-black text-xs shrink-0">
                          {patient.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block text-sm leading-snug">
                            {patient.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {patient.hospital_number || patient.patient_id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className="text-slate-800 font-semibold block">
                          {patient.gender} • {patient.age}
                        </span>
                        {patient.phone_number && (
                          <span className="text-[10px] text-slate-500 block flex items-center gap-1">
                            <Phone className="h-2.5 w-2.5" />
                            {patient.phone_number}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                          {patient.department || 'Outpatient'}
                        </span>
                        {patient.referred_by && (
                          <span className="text-[10px] text-slate-500 block">
                            Ref: {patient.referred_by}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {patient.reason || 'Pending clinical assessment'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <span>{patient.pending_since || 'Recent'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Detain Button */}
                        <button
                          id={`detain-btn-${patient.id}`}
                          onClick={() => handleOpenDetainModal(patient)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          <span>Detain</span>
                        </button>

                        {/* Admit Button */}
                        <button
                          id={`admit-btn-${patient.id}`}
                          onClick={() => handleOpenAdmitModal(patient)}
                          className="px-3 py-1.5 rounded-xl bg-[#2A758C] hover:bg-[#225f72] text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <BedDouble className="h-3.5 w-3.5" />
                          <span>Admit</span>
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

      {/* 3. CURRENTLY DETAINED SECTION */}
      {/* "Once you do that, there will be an automatic section that will be created underneath or by the side that will say currently detained. It will have the patient's information and the reason for the detainment and the last notes that was written by the nurse while the patient was detained. There will be a release button by the side. If you click on that release button, it will release the patient from that section. The patient will no longer be detained." */}
      <div 
        id="currently-detained-section" 
        className="bg-white border-2 border-amber-500/20 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Currently Detained</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                  {detainedPatients.length} Active Observation{detainedPatients.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Patients under active clinical card observation. Observation entries are maintained without formal admission sheets.
              </p>
            </div>
          </div>
        </div>

        {detainedPatients.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-amber-50/40 border border-amber-200/50">
            <Activity className="h-8 w-8 mx-auto text-amber-500/40 mb-2" />
            <p className="font-bold text-slate-700">No Patients Currently Detained</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              When you mark a patient as detained from the pending admissions list above, they will automatically appear here with their clinical card observations.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detainedPatients.map((detained) => (
              <div
                key={detained.id}
                id={`detained-card-${detained.id}`}
                className="bg-white border-2 border-amber-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Header Row of Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 flex items-center justify-center font-black text-sm">
                        {detained.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-base leading-tight">
                          {detained.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-slate-700">{detained.hospital_number}</span>
                          <span>•</span>
                          <span>{detained.gender}, {detained.age}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                      Under Observation
                    </span>
                  </div>

                  {/* Reason for Detainment */}
                  <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block mb-0.5">
                      Reason for Detainment
                    </span>
                    <p className="text-xs font-bold text-amber-950 leading-snug">
                      {detained.reason_for_detention}
                    </p>
                  </div>

                  {/* Last Notes Written by the Nurse while the Patient was Detained */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <FileText className="h-3 w-3 text-[#2A758C]" />
                        Last Notes Written by Nurse (Clinical Card)
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {detained.detained_by}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                      "{detained.last_nurse_notes || detained.initial_observation}"
                    </p>
                  </div>

                  {/* Detained Timestamp */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Detained: {detained.detained_at}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {detained.department || 'Observation Unit'}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Buttons: Release Button by the side */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    id={`detained-admit-btn-${detained.id}`}
                    onClick={() => handleOpenAdmitModal(detained)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <BedDouble className="h-3.5 w-3.5 text-[#2A758C]" />
                    <span>Admit to Ward</span>
                  </button>

                  {/* The requested Release button */}
                  <button
                    id={`release-btn-${detained.id}`}
                    onClick={() => handleReleasePatient(detained)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Release</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. MODAL: DETAIN PATIENT FOR OBSERVATION */}
      {/* 
        "If you click on the detain button, it will say detain patient for observation. 
        It will write out the name of the patient, the patient's ID number, and reason for detention. 
        You write the reason for detention, e.g., BP check after medication, IV fluid monitoring, or any other thing. 
        When you fill it in, you also fill in the initial observation recorded on clinical card. 
        Then there is a mark as detained button or cancel button. 
        If you click as mark as detained, it will say patient marked as detained, the reason, and the observation recorded on clinical card."
      */}
      <AnimatePresence>
        {selectedForDetention && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Detain Patient for Observation
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Record short-stay observation parameters on the patient clinical card.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedForDetention(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Patient Identification Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#2A758C]/15 border border-[#2A758C]/30 text-[#2A758C] flex items-center justify-center font-black text-base">
                    {selectedForDetention.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Patient Name
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      {selectedForDetention.name}
                    </h4>
                  </div>
                </div>

                <div className="sm:text-right pl-2 sm:pl-0 border-l sm:border-l-0 border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Patient ID Number
                  </span>
                  <span className="text-sm font-mono font-black text-[#2A758C]">
                    {selectedForDetention.hospital_number || selectedForDetention.patient_id}
                  </span>
                </div>
              </div>

              {/* Detain Form */}
              <form onSubmit={handleConfirmDetain} className="space-y-4">
                {/* Reason for detention */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    Reason for Detention <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={detentionReason}
                    onChange={(e) => setDetentionReason(e.target.value)}
                    placeholder="e.g., BP check after medication, IV fluid monitoring..."
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 bg-white"
                  />
                  {/* Quick Select Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Quick Select:</span>
                    {[
                      'BP check after medication',
                      'IV fluid monitoring',
                      'Post-nebulization asthma observation',
                      'Allergic reaction monitoring',
                      'Blood sugar check post-insulin'
                    ].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDetentionReason(preset)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          detentionReason === preset
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Initial observation recorded on clinical card */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    Initial Observation Recorded on Clinical Card <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={clinicalCardObservation}
                    onChange={(e) => setClinicalCardObservation(e.target.value)}
                    placeholder="Record baseline vitals, patient orientation, pain score, or bedside nursing triage details on clinical card..."
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900 bg-white leading-relaxed"
                  ></textarea>
                  <p className="text-[11px] text-slate-400">
                    This will be stamped on the patient's observation log and maintained for clinical handover.
                  </p>
                </div>

                {/* Modal Buttons: Cancel and Mark as Detained */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedForDetention(null)}
                    disabled={isSubmittingDetention}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingDetention}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingDetention ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Activity className="h-4 w-4" />
                    )}
                    <span>Mark as Detained</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL: COMPLETE PATIENT ADMISSION */}
      {/* 
        "If you click on the admit button, there will be a form that will open, and that form will say complete patient admission. 
        The patient's name will be there, patient ID will be there, then the ward. 
        You will select the ward, whether General Ward Abuja, Maternity Ward Lagos, ICU, Pediatric Ward, or Private Room. 
        Then you put the bed number, then provisional diagnosis, next of kin, region, religion, whether Christianity, Islam, Traditional, or Other, 
        then the doctor's orders or standing orders. You type in that, then click on complete admission. 
        Once you click on complete admission, it will say patient has been admitted to private room bed 847 or whatever information that was filled in on the form."
      */}
      <AnimatePresence>
        {selectedForAdmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#2A758C]/15 border border-[#2A758C]/30 flex items-center justify-center text-[#2A758C]">
                    <BedDouble className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Complete Patient Admission
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assign ward bed, register clinical diagnosis, next of kin, and formal doctor's orders.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedForAdmission(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Patient Name & Patient ID Number Banner */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#2A758C] text-white flex items-center justify-center font-black text-base shadow-xs">
                    {selectedForAdmission.name.charAt(0)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Patient Name
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      {selectedForAdmission.name}
                    </h4>
                  </div>
                </div>

                <div className="sm:text-right pl-2 sm:pl-0 border-l sm:border-l-0 border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Patient ID
                  </span>
                  <span className="text-sm font-mono font-black text-[#2A758C]">
                    {selectedForAdmission.hospital_number || selectedForAdmission.patient_id}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleConfirmAdmission} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ward Dropdown */}
                  {/* Options: General Ward Abuja, Maternity Ward Lagos, ICU, Pediatric Ward, Private Room */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      Ward <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={admissionForm.ward}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, ward: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20 focus:border-[#2A758C] text-slate-900 bg-white"
                    >
                      <option value="General Ward Abuja">General Ward Abuja</option>
                      <option value="Maternity Ward Lagos">Maternity Ward Lagos</option>
                      <option value="ICU">ICU</option>
                      <option value="Pediatric Ward">Pediatric Ward</option>
                      <option value="Private Room">Private Room</option>
                    </select>
                  </div>

                  {/* Bed Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      Bed Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bed 847, M-3, Bed 12..."
                      value={admissionForm.bedNumber}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, bedNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20 focus:border-[#2A758C] text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* Provisional Diagnosis */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    Provisional Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter provisional medical diagnosis..."
                    value={admissionForm.provisionalDiagnosis}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, provisionalDiagnosis: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20 focus:border-[#2A758C] text-slate-900 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Next of Kin */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      Next of Kin <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Full name & relationship..."
                      value={admissionForm.nextOfKin}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, nextOfKin: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20 focus:border-[#2A758C] text-slate-900 bg-white"
                    />
                  </div>

                  {/* Region */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      Region <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={admissionForm.region}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, region: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20 focus:border-[#2A758C] text-slate-900 bg-white"
                    >
                      <option value="South West">South West</option>
                      <option value="North Central">North Central</option>
                      <option value="South East">South East</option>
                      <option value="South South">South South</option>
                      <option value="North West">North West</option>
                      <option value="North East">North East</option>
                    </select>
                  </div>

                  {/* Religion */}
                  {/* Options: Christianity, Islam, Traditional, Other */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                      Religion <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={admissionForm.religion}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, religion: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20 focus:border-[#2A758C] text-slate-900 bg-white"
                    >
                      <option value="Christianity">Christianity</option>
                      <option value="Islam">Islam</option>
                      <option value="Traditional">Traditional</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Doctor's orders or standing orders */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    Doctor's Orders or Standing Orders <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter physician orders, medication schedules, activity instructions, and observation intervals..."
                    value={admissionForm.doctorOrders}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, doctorOrders: e.target.value })}
                    className="w-full px-4 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20 focus:border-[#2A758C] text-slate-900 bg-white leading-relaxed"
                  ></textarea>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedForAdmission(null)}
                    disabled={isSubmittingAdmission}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingAdmission}
                    className="px-5 py-2.5 rounded-xl bg-[#2A758C] hover:bg-[#225f72] text-white font-black text-xs shadow-xs hover:shadow transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingAdmission ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Complete Admission</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. SUCCESS CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmationDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-4"
            >
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
                confirmationDialog.type === 'detained'
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : confirmationDialog.type === 'admitted'
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                  : 'bg-blue-100 text-blue-700 border border-blue-300'
              }`}>
                {confirmationDialog.type === 'detained' ? (
                  <Activity className="h-7 w-7" />
                ) : confirmationDialog.type === 'admitted' ? (
                  <BedDouble className="h-7 w-7" />
                ) : (
                  <CheckCircle2 className="h-7 w-7" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">
                  {confirmationDialog.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-md mx-auto">
                  {confirmationDialog.message}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setConfirmationDialog({ ...confirmationDialog, isOpen: false })}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
