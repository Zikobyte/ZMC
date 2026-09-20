import React, { useState, useEffect } from 'react';
import { 
  BedDouble, 
  Search, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  FileText, 
  Pill, 
  Activity, 
  Receipt, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Check, 
  ChevronRight, 
  Heart, 
  Thermometer, 
  Wind, 
  Droplet, 
  RefreshCw, 
  X, 
  Filter, 
  ShieldAlert,
  Baby,
  Building2,
  Stethoscope
} from 'lucide-react';
import { apiFetch } from '../../utils/api';
import MaternityChecklistView from './MaternityChecklistView';

interface AdmittedPatient {
  id: string;
  patient_id: string;
  hospital_number: string;
  name: string;
  phone_number: string;
  date_of_birth: string;
  gender: string;
  category: string;
  department: string;
  edd?: string;
  gestational_age?: string;
  gravida_para?: string;
  status: string;
  ward: string;
  bed: string;
  admitted_date: string;
  doctor_notes?: string;
  total_charged: number;
  payments_made: number;
  outstanding_balance: number;
}

interface PrescribedMedication {
  id: string;
  medication_name: string;
  quantity: string;
  frequency: string;
  ordered_by?: string;
  status?: string;
}

interface AdministrationRecord {
  id: string;
  prescription_id?: string;
  medication_name: string;
  dose?: string;
  administered_by: string;
  notes?: string;
  administered_at: string;
}

interface ObservationRecord {
  id: string;
  observation_type: 'General' | 'Wound' | 'Patient complaint' | 'Other' | string;
  details: string;
  recorded_by: string;
  recorded_at: string;
}

interface VitalRecord {
  id: string;
  blood_pressure?: string;
  heart_rate?: string;
  temperature?: string;
  respiratory_rate?: string;
  spo2?: string;
  recorded_by: string;
  recorded_at: string;
  is_initial?: boolean;
}

interface BillingItem {
  id: string;
  item: string;
  amount: number;
  type: 'Charge' | 'Payment';
  recorded_at: string;
}

interface PatientDetailsResponse {
  patient: AdmittedPatient;
  prescriptions: PrescribedMedication[];
  administrationHistory: AdministrationRecord[];
  observations: ObservationRecord[];
  vitals: {
    initialVitals: VitalRecord | null;
    vitalHistory: VitalRecord[];
  };
  billing: {
    totalCharged: number;
    totalPaid: number;
    outstandingBalance: number;
    items: BillingItem[];
  };
}

export default function AdmittedPatientsView() {
  // Left Container State
  const [patients, setPatients] = useState<AdmittedPatient[]>([]);
  const [totalAdmittedCount, setTotalAdmittedCount] = useState<number>(0);
  const [wardStats, setWardStats] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWardFilter, setSelectedWardFilter] = useState('all');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('MAT-4003');
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  // Right Container State
  const [activeSubLink, setActiveSubLink] = useState<'medications' | 'observations' | 'vitals' | 'billing' | 'maternity-checklist'>('medications');
  const [recordsDateFilter, setRecordsDateFilter] = useState<string>('');
  const [patientDetails, setPatientDetails] = useState<PatientDetailsResponse | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Medications Administration Form State
  const [selectedPrescription, setSelectedPrescription] = useState<PrescribedMedication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isAdministering, setIsAdministering] = useState(false);

  // Observation Form State
  const [observationType, setObservationType] = useState<'General' | 'Wound' | 'Patient complaint' | 'Other'>('General');
  const [observationDetails, setObservationDetails] = useState('');
  const [isRecordingObservation, setIsRecordingObservation] = useState(false);

  // Vitals Form State
  const [vitalBP, setVitalBP] = useState('');
  const [vitalHR, setVitalHR] = useState('');
  const [vitalTemp, setVitalTemp] = useState('');
  const [vitalRR, setVitalRR] = useState('');
  const [vitalSPO2, setVitalSPO2] = useState('');
  const [isRecordingVitals, setIsRecordingVitals] = useState(false);

  // Success Modal Dialog State
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  // 1. Fetch Admitted Patients List
  const fetchAdmissions = async (keepSelection = true) => {
    try {
      setIsLoadingPatients(true);
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (selectedWardFilter !== 'all') queryParams.append('ward', selectedWardFilter);

      const res = await apiFetch(`/nursing/admissions?${queryParams.toString()}`);
      if (res && res.success) {
        setPatients(res.data || []);
        setTotalAdmittedCount(res.totalAdmitted || res.data?.length || 0);
        setWardStats(res.stats || {});

        // If no patient is selected or current selected patient not in list, select first
        if ((!selectedPatientId || !keepSelection) && res.data && res.data.length > 0) {
          setSelectedPatientId(res.data[0].id);
        } else if (res.data && res.data.length > 0 && !res.data.some((p: any) => p.id === selectedPatientId)) {
          // If MAT-4003 exists in data, prefer MAT-4003
          const defaultP = res.data.find((p: any) => p.id === 'MAT-4003') || res.data[0];
          setSelectedPatientId(defaultP.id);
        }
      }
    } catch (err) {
      console.error('Failed to load admitted patients:', err);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchAdmissions(true);
  }, [searchQuery, selectedWardFilter]);

  // 2. Fetch Selected Patient Full Details
  const fetchPatientDetails = async (patientId: string, dateFilter = recordsDateFilter) => {
    if (!patientId) return;
    try {
      setIsLoadingDetails(true);
      const queryParams = new URLSearchParams();
      if (dateFilter) queryParams.append('dateFilter', dateFilter);

      const res = await apiFetch(`/nursing/admissions/${patientId}?${queryParams.toString()}`);
      if (res && res.success) {
        setPatientDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to load patient details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientDetails(selectedPatientId, recordsDateFilter);
      setSelectedPrescription(null);
      setAdminNotes('');

      const p = patients.find((x) => x.id === selectedPatientId);
      const isMat = p && ((p.ward || '').toLowerCase().includes('maternity') || (p.category || '').toLowerCase().includes('maternity'));
      if (!isMat && activeSubLink === 'maternity-checklist') {
        setActiveSubLink('medications');
      }
    }
  }, [selectedPatientId, recordsDateFilter, patients]);

  // Handle Medication Selection
  const handleSelectPrescription = (med: PrescribedMedication) => {
    setSelectedPrescription(med);
    // Scroll or focus to confirmation area smoothly
  };

  // Handle Confirm Medication Administration
  const handleConfirmAdministration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrescription || !selectedPatientId) return;

    try {
      setIsAdministering(true);
      const userRaw = localStorage.getItem('zmc_user');
      const currentUser = userRaw ? JSON.parse(userRaw) : null;
      const nurseName = currentUser?.name || currentUser?.username || 'Nurse Staff';

      const res = await apiFetch(`/nursing/admissions/${selectedPatientId}/medications/administer`, {
        method: 'POST',
        body: JSON.stringify({
          prescriptionId: selectedPrescription.id,
          medicationName: selectedPrescription.medication_name,
          dose: selectedPrescription.frequency,
          notes: adminNotes,
          administeredBy: nurseName
        })
      });

      if (res && res.success) {
        setModalMessage(`Medication ${selectedPrescription.medication_name} has been administered successfully.`);
        setSelectedPrescription(null);
        setAdminNotes('');
        // Refresh details
        await fetchPatientDetails(selectedPatientId);
      } else {
        alert(res?.error || 'Failed to record medication administration.');
      }
    } catch (err: any) {
      alert('Error administering medication: ' + err.message);
    } finally {
      setIsAdministering(false);
    }
  };

  // Handle Record Observation
  const handleRecordObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationDetails.trim() || !selectedPatientId) return;

    try {
      setIsRecordingObservation(true);
      const userRaw = localStorage.getItem('zmc_user');
      const currentUser = userRaw ? JSON.parse(userRaw) : null;
      const nurseName = currentUser?.name || currentUser?.username || 'Nurse Staff';

      const res = await apiFetch(`/nursing/admissions/${selectedPatientId}/observations`, {
        method: 'POST',
        body: JSON.stringify({
          observationType,
          details: observationDetails,
          recordedBy: nurseName
        })
      });

      if (res && res.success) {
        setModalMessage('Observation has been recorded successfully.');
        setObservationDetails('');
        setObservationType('General');
        // Refresh details
        await fetchPatientDetails(selectedPatientId);
      } else {
        alert(res?.error || 'Failed to record observation.');
      }
    } catch (err: any) {
      alert('Error recording observation: ' + err.message);
    } finally {
      setIsRecordingObservation(false);
    }
  };

  // Handle Record Vitals
  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    if (!vitalBP && !vitalHR && !vitalTemp && !vitalRR && !vitalSPO2) {
      alert('Please provide at least one vital sign value before submitting.');
      return;
    }

    try {
      setIsRecordingVitals(true);
      const userRaw = localStorage.getItem('zmc_user');
      const currentUser = userRaw ? JSON.parse(userRaw) : null;
      const nurseName = currentUser?.name || currentUser?.username || 'Nurse Staff';

      const res = await apiFetch(`/nursing/admissions/${selectedPatientId}/vitals`, {
        method: 'POST',
        body: JSON.stringify({
          bloodPressure: vitalBP,
          heartRate: vitalHR,
          temperature: vitalTemp,
          respiratoryRate: vitalRR,
          oxygenSaturation: vitalSPO2,
          recordedBy: nurseName
        })
      });

      if (res && res.success) {
        setModalMessage('Vitals recorded successfully.');
        setVitalBP('');
        setVitalHR('');
        setVitalTemp('');
        setVitalRR('');
        setVitalSPO2('');
        // Refresh details
        await fetchPatientDetails(selectedPatientId);
      } else {
        alert(res?.error || 'Failed to record vitals.');
      }
    } catch (err: any) {
      alert('Error recording vitals: ' + err.message);
    } finally {
      setIsRecordingVitals(false);
    }
  };

  const selectedPatient = patientDetails?.patient || patients.find(p => p.id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* TWO-CONTAINER SPLIT LAYOUT: LEFT CONTAINER & RIGHT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* LEFT CONTAINER: TOTAL AMOUNT OF ADMITTED PATIENTS & PATIENT SELECTION LIST */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col space-y-4">
          
          {/* Left Container Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Admitted Patients</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-[#2A758C]/10 text-[#2A758C]">
                  {totalAdmittedCount}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Select an admitted patient to view complete clinical records
              </p>
            </div>

            <button
              onClick={() => fetchAdmissions(true)}
              title="Refresh Inpatient Census"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPatients ? 'animate-spin text-[#2A758C]' : ''}`} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, ward, bed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:bg-white transition-all"
            />
          </div>

          {/* Ward Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {[
              { id: 'all', label: 'All Wards' },
              { id: 'Maternity', label: 'Maternity Ward' },
              { id: 'General', label: 'General Ward' },
              { id: 'Emergency', label: 'Emergency' },
              { id: 'Female', label: 'Female Ward' },
              { id: 'Male', label: 'Male Ward' }
            ].map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWardFilter(w.id)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedWardFilter === w.id
                    ? 'bg-[#2A758C] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Patient Cards List */}
          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {isLoadingPatients ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin text-[#2A758C]" />
                <span>Loading admitted patient census...</span>
              </div>
            ) : patients.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
                <BedDouble className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">No admitted patients found</p>
                <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search query or filter</p>
              </div>
            ) : (
              patients.map((p) => {
                const isSelected = p.id === selectedPatientId;
                const isMaternity = (p.ward || '').toLowerCase().includes('maternity') || (p.category || '').toLowerCase().includes('maternity');
                const isEmergency = (p.ward || '').toLowerCase().includes('emergency') || (p.status || '').toLowerCase().includes('emergency');
                const admittedStatus = isMaternity ? 'MATERNITY WARD' : isEmergency ? 'EMERGENCY' : (p.ward ? p.ward.toUpperCase() : 'GENERAL WARD');
                const statusBadgeColor = isMaternity 
                  ? 'bg-pink-100 text-pink-800 border-pink-200' 
                  : isEmergency 
                    ? 'bg-rose-100 text-rose-800 border-rose-200' 
                    : 'bg-blue-100 text-blue-800 border-blue-200';

                return (
                  <div
                    key={p.id}
                    id={`admitted-patient-card-${p.id}`}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-[#2A758C] bg-[#2A758C]/5 shadow-sm ring-2 ring-[#2A758C]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          {p.name}
                          {isMaternity && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-pink-100 text-pink-700">
                              Maternity
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] font-bold text-[#2A758C] mt-0.5">
                          ID: {p.hospital_number || p.id}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${statusBadgeColor}`}>
                        {admittedStatus}
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Ward & Bed:</span>
                        <span className="font-bold text-slate-800">{p.ward} • {p.bed}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Admitted:</span>
                        <span className="font-semibold text-slate-700">{p.admitted_date}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-2 text-[10px] font-bold text-[#2A758C] flex items-center gap-1">
                        <span>Selected Inpatient</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT CONTAINER: COMPLETE INFORMATION OF THE SELECTED ADMITTED PATIENT */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col space-y-6">
          
          {isLoadingDetails && !patientDetails ? (
            <div className="py-24 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-6 w-6 animate-spin text-[#2A758C]" />
              <span>Loading patient clinical file...</span>
            </div>
          ) : !selectedPatient ? (
            <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 p-8">
              <User className="h-10 w-10 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Patient Selected</h3>
              <p className="text-xs text-slate-500 mt-1">Please select an admitted patient from the left container to view clinical records.</p>
            </div>
          ) : (
            <>
              {/* ------------------------------------------------------------- */}
              {/* 1. PATIENT DEMOGRAPHIC & ADMISSION PROFILE CARD */}
              {/* ------------------------------------------------------------- */}
              <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        {selectedPatient.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {selectedPatient.status || 'ADMITTED'}
                      </span>
                      {selectedPatient.category && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-pink-100 text-pink-700 border border-pink-200">
                          {selectedPatient.category}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                      <span className="font-black text-[#2A758C]">
                        ID: {selectedPatient.hospital_number || selectedPatient.id}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        Phone: {selectedPatient.phone_number || '08063344556'}
                      </span>
                      <span>•</span>
                      <span>
                        DOB: {selectedPatient.date_of_birth || '2000-02-14'} | {selectedPatient.gender || 'Female'}
                      </span>
                    </div>

                    {/* EDD & GA for Maternity patients */}
                    {(selectedPatient.edd || selectedPatient.gestational_age || (selectedPatient.category || '').toLowerCase().includes('maternity')) && (
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700 pt-1">
                        <span className="flex items-center gap-1.5 text-pink-700">
                          <Baby className="h-3.5 w-3.5" />
                          EDD: {selectedPatient.edd || '2026-06-17'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-700">
                          GA: {selectedPatient.gestational_age || '40 weeks'}
                        </span>
                        {selectedPatient.gravida_para && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600">{selectedPatient.gravida_para}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ward & Bed Allocation Pill */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs self-start text-right min-w-[170px]">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ward & Bed Allocation</div>
                    <div className="text-sm font-black text-slate-900 mt-0.5">
                      {selectedPatient.ward}
                    </div>
                    <div className="text-xs font-bold text-[#2A758C]">
                      Bed: {selectedPatient.bed}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Admitted: {selectedPatient.admitted_date}
                    </div>
                  </div>
                </div>

                {/* Doctor's Notes / Orders */}
                <div className="mt-4 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1">
                    <Stethoscope className="h-3.5 w-3.5 text-[#2A758C]" />
                    <span>Doctor's Notes / Orders:</span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs font-medium text-amber-900 leading-relaxed">
                    {selectedPatient.doctor_notes || 'G1P0 in early labour at 40 weeks. Monitoring with partograph. Preeclampsia watch – BP elevated.'}
                  </div>
                </div>

                {/* View records for date: Filter */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#2A758C]" />
                    <label htmlFor="view-records-date-filter" className="font-bold text-slate-700">
                      View records for date:
                    </label>
                    <input
                      id="view-records-date-filter"
                      type="date"
                      value={recordsDateFilter}
                      onChange={(e) => setRecordsDateFilter(e.target.value)}
                      placeholder="dd/mm/yyyy"
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#2A758C]"
                    />
                    {recordsDateFilter && (
                      <button
                        onClick={() => setRecordsDateFilter('')}
                        className="text-[11px] font-bold text-[#2A758C] hover:underline cursor-pointer"
                      >
                        Clear date filter
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Showing records for: <span className="font-bold text-slate-700">{recordsDateFilter || 'All Recorded Dates'}</span>
                  </div>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* 2. CLINICAL RECORD LINKS / TABS */}
              {/* ------------------------------------------------------------- */}
              {(() => {
                const isMaternity =
                  (selectedPatient?.ward || '').toLowerCase().includes('maternity') ||
                  (selectedPatient?.category || '').toLowerCase().includes('maternity');

                const tabs = [
                  { id: 'medications', label: 'Medications', icon: Pill, count: patientDetails?.prescriptions?.length },
                  { id: 'observations', label: 'Observations', icon: ClipboardList, count: patientDetails?.observations?.length },
                  { id: 'vitals', label: 'Vitals', icon: Activity, count: (patientDetails?.vitals?.vitalHistory?.length || 0) + (patientDetails?.vitals?.initialVitals ? 1 : 0) },
                  { id: 'billing', label: 'Billing', icon: Receipt, count: patientDetails?.billing?.items?.length },
                  ...(isMaternity
                    ? [{ id: 'maternity-checklist', label: 'Maternity Checklist', icon: Baby, count: undefined, isMaternity: true }]
                    : [])
                ];

                return (
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                    {tabs.map((tab: any) => {
                      const Icon = tab.icon;
                      const isActive = activeSubLink === tab.id;
                      return (
                        <button
                          key={tab.id}
                          id={`nurse-patient-tab-${tab.id}`}
                          onClick={() => setActiveSubLink(tab.id as any)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                              ? tab.isMaternity
                                ? 'bg-[#E11D48] text-white shadow-xs font-black ring-2 ring-pink-300'
                                : 'bg-[#2A758C] text-white shadow-xs font-black'
                              : tab.isMaternity
                                ? 'text-pink-700 bg-pink-50 hover:bg-pink-100 hover:text-pink-900 border border-pink-200 font-bold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                          {tab.count !== undefined && tab.count > 0 && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                              isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* ========================================================================= */}
              {/* TAB 1: MEDICATIONS (Prescribed Medications & Administration History)       */}
              {/* ========================================================================= */}
              {activeSubLink === 'medications' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Prescribed Medications Container */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Pill className="h-4 w-4 text-[#2A758C]" />
                          <span>Prescribed Medications</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Doctor-prescribed medication orders. Select a medication to record bedside administration.
                        </p>
                      </div>
                    </div>

                    {/* Prescribed Medications List */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(patientDetails?.prescriptions || []).map((med) => {
                        const isSelected = selectedPrescription?.id === med.id;
                        return (
                          <div
                            key={med.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-[#2A758C] bg-[#2A758C]/5 ring-2 ring-[#2A758C]/20 shadow-xs'
                                : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-1">
                                <h4 className="text-xs font-black text-slate-900 uppercase leading-snug">
                                  {med.medication_name}
                                </h4>
                                {isSelected && (
                                  <span className="w-2 h-2 rounded-full bg-[#2A758C]"></span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-600 space-y-1">
                                <div>
                                  <span className="font-semibold text-slate-500">Quantity: </span>
                                  <span className="font-bold text-slate-800">{med.quantity}</span>
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-500">Frequency: </span>
                                  <span className="font-bold text-slate-800">{med.frequency}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-2 border-t border-slate-200/80">
                              <button
                                type="button"
                                id={`select-medication-${med.id}`}
                                onClick={() => handleSelectPrescription(med)}
                                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-[#2A758C] text-white shadow-xs'
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Selected</span>
                                  </>
                                ) : (
                                  <span>Select</span>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* CONFIRM ADMINISTRATION FORM (WHEN SELECT IS CLICKED) */}
                    {selectedPrescription && (
                      <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200 animate-fade-in space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#2A758C]" />
                            <h4 className="text-xs font-black text-slate-900">
                              Confirm Administration: <span className="text-[#2A758C] font-black">{selectedPrescription.medication_name}</span>
                            </h4>
                          </div>
                          <button
                            onClick={() => setSelectedPrescription(null)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-600">
                          Scheduled Dose: <strong>{selectedPrescription.frequency}</strong> • Ordered Qty: <strong>{selectedPrescription.quantity}</strong>
                        </p>

                        <form onSubmit={handleConfirmAdministration} className="space-y-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Administration Notes <span className="text-slate-400 font-normal">(Optional)</span>:
                            </label>
                            <input
                              type="text"
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="e.g. BP 142/94 – notified doctor, given with water, patient tolerated well..."
                              className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C]"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedPrescription(null)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              id="confirm-administration-btn"
                              disabled={isAdministering}
                              className="px-4 py-1.5 rounded-lg text-xs font-black bg-[#2A758C] text-white hover:bg-[#236376] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              {isAdministering ? (
                                <>
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  <span>Administering...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Confirm Administration</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Administration History Section */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#2A758C]" />
                          <span>Administration History</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Log of doses administered by nursing staff for {selectedPatient.name}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {patientDetails?.administrationHistory?.length || 0} Doses Recorded
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {(patientDetails?.administrationHistory || []).length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl p-4 text-xs text-slate-500">
                          No medication administration history recorded for this date.
                        </div>
                      ) : (
                        (patientDetails?.administrationHistory || []).map((adm) => (
                          <div
                            key={adm.id}
                            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900 uppercase">
                                  {adm.medication_name}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Administered
                                </span>
                              </div>
                              <div className="text-xs text-slate-700 font-medium">
                                <span className="font-bold text-slate-900">By: {adm.administered_by}</span>
                                {adm.notes && (
                                  <span className="text-slate-600 block sm:inline sm:ml-2">
                                    • {adm.notes}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs font-bold text-slate-500 sm:text-right shrink-0">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                {adm.administered_at}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: OBSERVATIONS (Record New Observation & Previous Observations)       */}
              {/* ========================================================================= */}
              {activeSubLink === 'observations' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Container: Record New Observation */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-[#2A758C]" />
                        <span>Record New Observation</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Log clinical observations, patient symptoms, wound care notes, or bedside feedback.
                      </p>
                    </div>

                    <form onSubmit={handleRecordObservation} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Observation Type:
                          </label>
                          <select
                            value={observationType}
                            onChange={(e) => setObservationType(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2A758C] focus:bg-white"
                          >
                            <option value="General">General</option>
                            <option value="Wound">Wound</option>
                            <option value="Patient complaint">Patient complaint</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Observation Details:
                        </label>
                        <textarea
                          rows={3}
                          value={observationDetails}
                          onChange={(e) => setObservationDetails(e.target.value)}
                          placeholder="Write observation details here..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:bg-white transition-all"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          id="record-observation-btn"
                          disabled={isRecordingObservation || !observationDetails.trim()}
                          className="px-5 py-2 rounded-xl text-xs font-black bg-[#2A758C] text-white hover:bg-[#236376] transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                        >
                          {isRecordingObservation ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>Recording...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Record Observation</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Container: Previous Observations */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#2A758C]" />
                          <span>Previous Observations</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Observations previously recorded for this particular patient
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {patientDetails?.observations?.length || 0} Entries
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(patientDetails?.observations || []).length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl p-4 text-xs text-slate-500">
                          No previous observations recorded for this patient.
                        </div>
                      ) : (
                        (patientDetails?.observations || []).map((obs) => {
                          const isComplaint = obs.observation_type === 'Patient complaint';
                          const isWound = obs.observation_type === 'Wound';
                          return (
                            <div
                              key={obs.id}
                              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                    isComplaint 
                                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                      : isWound
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}>
                                    {obs.observation_type}
                                  </span>
                                  <span className="text-xs font-bold text-slate-700">
                                    By: {obs.recorded_by}
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  {obs.recorded_at}
                                </span>
                              </div>

                              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                                {obs.details}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 3: VITALS (Record Current Vitals, Initial Vitals & Vital History)      */}
              {/* ========================================================================= */}
              {activeSubLink === 'vitals' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Form: Record Current Vitals */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#2A758C]" />
                        <span>Record Current Vitals</span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Fill in current bedside vital signs for {selectedPatient.name} to log directly into clinical records.
                      </p>
                    </div>

                    <form onSubmit={handleRecordVitals} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        
                        {/* Blood Pressure */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-rose-500" />
                            <span>Blood Pressure:</span>
                          </label>
                          <input
                            type="text"
                            value={vitalBP}
                            onChange={(e) => setVitalBP(e.target.value)}
                            placeholder="e.g. 140/90"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:bg-white"
                          />
                        </div>

                        {/* Heart Rate */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Activity className="h-3.5 w-3.5 text-red-500" />
                            <span>Heart Rate (bpm):</span>
                          </label>
                          <input
                            type="text"
                            value={vitalHR}
                            onChange={(e) => setVitalHR(e.target.value)}
                            placeholder="e.g. 86"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:bg-white"
                          />
                        </div>

                        {/* Temperature */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                            <span>Temperature (°C):</span>
                          </label>
                          <input
                            type="text"
                            value={vitalTemp}
                            onChange={(e) => setVitalTemp(e.target.value)}
                            placeholder="e.g. 37.1"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:bg-white"
                          />
                        </div>

                        {/* Respiratory Rate */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Wind className="h-3.5 w-3.5 text-teal-500" />
                            <span>Respiratory Rate (cpm):</span>
                          </label>
                          <input
                            type="text"
                            value={vitalRR}
                            onChange={(e) => setVitalRR(e.target.value)}
                            placeholder="e.g. 19"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:bg-white"
                          />
                        </div>

                        {/* Oxygen Saturation */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Droplet className="h-3.5 w-3.5 text-blue-500" />
                            <span>Oxygen Saturation (%):</span>
                          </label>
                          <input
                            type="text"
                            value={vitalSPO2}
                            onChange={(e) => setVitalSPO2(e.target.value)}
                            placeholder="e.g. 98"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:bg-white"
                          />
                        </div>

                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          id="record-vitals-btn"
                          disabled={isRecordingVitals}
                          className="px-5 py-2 rounded-xl text-xs font-black bg-[#2A758C] text-white hover:bg-[#236376] transition-all shadow-xs cursor-pointer flex items-center gap-2"
                        >
                          {isRecordingVitals ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>Recording Vitals...</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>Record Vitals</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Section: Initial Vitals at Registration */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-emerald-600" />
                        <span>Initial Vitals at Registration</span>
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                        Baseline Registration Triage
                      </span>
                    </div>

                    {patientDetails?.vitals?.initialVitals ? (
                      <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                          <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                            <span className="text-[10px] text-slate-500 font-bold block">Blood Pressure</span>
                            <span className="text-sm font-black text-slate-900">
                              {patientDetails.vitals.initialVitals.blood_pressure || '135/88'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                            <span className="text-[10px] text-slate-500 font-bold block">Heart Rate</span>
                            <span className="text-sm font-black text-slate-900">
                              {patientDetails.vitals.initialVitals.heart_rate || '84'} <span className="text-[10px] font-normal text-slate-500">bpm</span>
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                            <span className="text-[10px] text-slate-500 font-bold block">Temperature</span>
                            <span className="text-sm font-black text-slate-900">
                              {patientDetails.vitals.initialVitals.temperature || '36.8'} <span className="text-[10px] font-normal text-slate-500">°C</span>
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                            <span className="text-[10px] text-slate-500 font-bold block">Resp. Rate</span>
                            <span className="text-sm font-black text-slate-900">
                              {patientDetails.vitals.initialVitals.respiratory_rate || '18'} <span className="text-[10px] font-normal text-slate-500">cpm</span>
                            </span>
                          </div>
                          <div className="p-2.5 rounded-lg bg-white border border-emerald-100">
                            <span className="text-[10px] text-slate-500 font-bold block">SpO2</span>
                            <span className="text-sm font-black text-slate-900">
                              {patientDetails.vitals.initialVitals.spo2 || '98'} <span className="text-[10px] font-normal text-slate-500">%</span>
                            </span>
                          </div>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-slate-600">
                          <span>Recorded By: <strong>{patientDetails.vitals.initialVitals.recorded_by}</strong></span>
                          <span>Timestamp: <strong>{patientDetails.vitals.initialVitals.recorded_at}</strong></span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
                        No initial registration vitals found.
                      </div>
                    )}
                  </div>

                  {/* Section: Vital History from Nursing Records */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#2A758C]" />
                          <span>Vital History from Nursing Records</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Chronological vital readings taken during ward rounds and monitoring
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {patientDetails?.vitals?.vitalHistory?.length || 0} Recorded Rounds
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(patientDetails?.vitals?.vitalHistory || []).length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl p-4 text-xs text-slate-500">
                          No nursing vitals history recorded yet for this date.
                        </div>
                      ) : (
                        (patientDetails?.vitals?.vitalHistory || []).map((v) => (
                          <div
                            key={v.id}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-800">
                                Recorded By: <span className="text-[#2A758C] font-black">{v.recorded_by}</span>
                              </span>
                              <span className="text-slate-500 font-bold flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {v.recorded_at}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                              <div className="p-2 rounded-lg bg-white border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-semibold">BP</span>
                                <span className="font-black text-slate-900">{v.blood_pressure || '—'}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-semibold">HR</span>
                                <span className="font-black text-slate-900">{v.heart_rate ? `${v.heart_rate} bpm` : '—'}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-semibold">Temp</span>
                                <span className="font-black text-slate-900">{v.temperature ? `${v.temperature} °C` : '—'}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-semibold">RR</span>
                                <span className="font-black text-slate-900">{v.respiratory_rate ? `${v.respiratory_rate} cpm` : '—'}</span>
                              </div>
                              <div className="p-2 rounded-lg bg-white border border-slate-200">
                                <span className="text-[10px] text-slate-400 block font-semibold">SpO2</span>
                                <span className="font-black text-slate-900">{v.spo2 ? `${v.spo2} %` : '—'}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 4: BILLING (Total Charged, Total Paid, Outstanding Balance & Ledger)   */}
              {/* ========================================================================= */}
              {activeSubLink === 'billing' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Three Billing Summary Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Total Amount Charged */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Total Amount Charged
                      </span>
                      <div className="text-2xl font-black text-slate-900">
                        ₦{(patientDetails?.billing?.totalCharged || selectedPatient.total_charged || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">Inpatient ward, care & meds</span>
                    </div>

                    {/* Total Amount Paid */}
                    <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
                        Total Amount Paid
                      </span>
                      <div className="text-2xl font-black text-emerald-800">
                        ₦{(patientDetails?.billing?.totalPaid || selectedPatient.payments_made || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-emerald-700 font-medium">Deposits & verified payments</span>
                    </div>

                    {/* Outstanding Balance */}
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">
                        Outstanding Balance
                      </span>
                      <div className="text-2xl font-black text-amber-800">
                        ₦{(patientDetails?.billing?.outstandingBalance !== undefined ? patientDetails.billing.outstandingBalance : selectedPatient.outstanding_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[11px] text-amber-700 font-medium">Current balance due</span>
                    </div>

                  </div>

                  {/* Itemized Billing Table / List */}
                  <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-[#2A758C]" />
                          <span>Patient Inpatient Ledger</span>
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          All hospital fees, bed accommodation charges, and payments on record for {selectedPatient.name}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="py-2.5 px-3">Description / Item</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3 text-right">Amount (₦)</th>
                            <th className="py-2.5 px-3 text-right">Recorded Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(patientDetails?.billing?.items || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-slate-500">
                                No billing records found for this patient.
                              </td>
                            </tr>
                          ) : (
                            (patientDetails?.billing?.items || []).map((bill) => {
                              const isPayment = bill.type === 'Payment';
                              return (
                                <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-3 px-3 font-semibold text-slate-800">
                                    {bill.item}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                      isPayment ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {bill.type}
                                    </span>
                                  </td>
                                  <td className={`py-3 px-3 text-right font-black ${
                                    isPayment ? 'text-emerald-700' : 'text-slate-900'
                                  }`}>
                                    {isPayment ? '-' : ''}₦{Number(bill.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-3 px-3 text-right text-slate-500 font-medium">
                                    {bill.recorded_at}
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

              {/* ========================================================================= */}
              {/* TAB 5: MATERNITY CHECKLIST (FOR MOTHER & BABY, FOR DELIVERY, CHARGES)     */}
              {/* ========================================================================= */}
              {activeSubLink === 'maternity-checklist' && selectedPatient && (
                <div className="space-y-6 animate-fade-in">
                  <MaternityChecklistView
                    patient={selectedPatient}
                    onBillingUpdated={() => {
                      fetchPatientDetails(selectedPatientId);
                    }}
                  />
                </div>
              )}

            </>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* SUCCESS CONFIRMATION MODAL                                                */}
      {/* ========================================================================= */}
      {modalMessage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Success</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">
                {modalMessage}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                id="modal-close-btn"
                onClick={() => setModalMessage(null)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-[#2A758C] text-white hover:bg-[#236376] transition-all shadow-xs cursor-pointer"
              >
                Okay, Continue
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
