import React, { useState, useEffect, useMemo } from 'react';
import { 
  Pill, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  FileText, 
  RefreshCw, 
  X, 
  Check, 
  Plus, 
  AlertCircle,
  ClipboardList, 
  Calendar,
  Filter,
  Trash2,
  Eye,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface DispensingRecord {
  id: string;
  date: string;
  created_at: string;
  patient_name: string;
  card_number: string;
  drug: string;
  quantity: string;
  recorded_by: string;
  reviewed: boolean;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export default function NurseDispensingView() {
  const [records, setRecords] = useState<DispensingRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [commonDrugs, setCommonDrugs] = useState<string[]>([]);

  // Registered patients for autocomplete
  const [registeredPatients, setRegisteredPatients] = useState<Array<{ name: string; hospital_number: string }>>([]);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState<boolean>(false);
  const [showDrugSuggestions, setShowDrugSuggestions] = useState<boolean>(false);

  // Form State
  const [patientName, setPatientName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [drugDispensed, setDrugDispensed] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<string>('nurse1');

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    patientName?: string;
    cardNumber?: string;
    drugDispensed?: string;
    quantity?: string;
  }>({});

  // Success Feedback Modal
  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    record?: DispensingRecord;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('zmc_token') || localStorage.getItem('token') || localStorage.getItem('zmc_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Fetch initial dispensing records and common drugs
  const fetchDispensingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nursing/dispensing', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        if (data.commonDrugs) {
          setCommonDrugs(data.commonDrugs);
        }
      }
    } catch (err: any) {
      console.error('Error fetching dispensing data:', err);
      setError('Could not load dispensing records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered patients for smart autocomplete
  const fetchPatients = async () => {
    try {
      const res = await fetch('/api/nursing/patient-cards', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.patients)) {
          setRegisteredPatients(data.patients);
          return;
        }
      }

      const fallbackRes = await fetch('/api/patients', {
        headers: getAuthHeaders()
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        const pts = (data.patients || data || []).map((p: any) => ({
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Patient',
          hospital_number: p.hospital_number || p.patient_id || p.card_number || p.id || ''
        }));
        setRegisteredPatients(pts);
      }
    } catch (err) {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchDispensingData();
    fetchPatients();

    // Check logged in user to default recordedBy if available
    const savedUser = localStorage.getItem('zmc_user') || localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.username) {
          setRecordedBy(parsed.username);
        }
      } catch (e) {
        // keep default 'nurse1'
      }
    }
  }, []);

  // Form submission handler
  const handleSaveDispensingRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const errors: typeof formErrors = {};
    if (!patientName.trim()) {
      errors.patientName = 'Patient Name is required';
    }
    if (!cardNumber.trim()) {
      errors.cardNumber = 'Card Number is required';
    }
    if (!drugDispensed.trim()) {
      errors.drugDispensed = 'Drug Dispensed is required';
    }
    if (!quantity.trim()) {
      errors.quantity = 'Quantity is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);

    try {
      const payload = {
        patientName: patientName.trim(),
        cardNumber: cardNumber.trim(),
        drug: drugDispensed.trim(),
        quantity: quantity.trim(),
        recordedBy: recordedBy.trim() || 'nurse1'
      };

      const res = await fetch('/api/nursing/dispensing', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save dispensing record');
      }

      // Update table state
      if (data.records) {
        setRecords(data.records);
      } else if (data.record) {
        setRecords(prev => [data.record, ...prev]);
      }

      // Open success dialog
      setSuccessDialog({
        isOpen: true,
        title: 'Dispensing Record Saved',
        message: `Drug dispensing record for patient "${payload.patientName}" (${payload.drug}, Qty: ${payload.quantity}) has been saved to the database.`,
        record: data.record
      });

      // Clear input fields (keep recordedBy as nurse1)
      setPatientName('');
      setCardNumber('');
      setDrugDispensed('');
      setQuantity('');
      setShowPatientSuggestions(false);
      setShowDrugSuggestions(false);
    } catch (err: any) {
      console.error('Error saving dispensing record:', err);
      alert(`Error saving record: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle review status
  const handleToggleReview = async (recordId: string) => {
    try {
      const res = await fetch(`/api/nursing/dispensing/${recordId}/toggle-review`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && data.record) {
        setRecords(prev => prev.map(r => r.id === recordId ? data.record : r));
      }
    } catch (err) {
      console.error('Error toggling review:', err);
    }
  };

  // Delete record
  const handleDeleteRecord = async (recordId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the dispensing entry for ${name}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/nursing/dispensing/${recordId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setRecords(prev => prev.filter(r => r.id !== recordId));
      }
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  // Filtered patients for dropdown suggestions
  const filteredPatientSuggestions = useMemo(() => {
    if (!patientName.trim()) return [];
    const q = patientName.toLowerCase();
    return registeredPatients
      .filter(p => p.name.toLowerCase().includes(q) || p.hospital_number.toLowerCase().includes(q))
      .slice(0, 5);
  }, [patientName, registeredPatients]);

  // Filtered drugs for dropdown suggestions
  const filteredDrugSuggestions = useMemo(() => {
    if (!drugDispensed.trim()) return commonDrugs.slice(0, 6);
    const q = drugDispensed.toLowerCase();
    return commonDrugs
      .filter(d => d.toLowerCase().includes(q))
      .slice(0, 6);
  }, [drugDispensed, commonDrugs]);

  // Filtered records for table
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesSearch = 
        (rec.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.card_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.drug || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.recorded_by || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.date || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'reviewed') return rec.reviewed === true;
      if (statusFilter === 'pending') return !rec.reviewed;
      return true;
    });
  }, [records, searchQuery, statusFilter]);

  // Metrics
  const totalCount = records.length;
  const pendingCount = records.filter(r => !r.reviewed).length;
  const reviewedCount = records.filter(r => r.reviewed).length;

  return (
    <div className="space-y-8">
      {/* Top Banner & Department KPIs */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Nurse Dispensing</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Ward Register
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
                Point-of-care medication administration, emergency ward drug dispensing, and clinical card accountability.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-stretch sm:self-auto overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/70 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-slate-200/60 flex items-center justify-center text-slate-700 font-bold text-xs">
                {totalCount}
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-600">Total Entries</div>
                <div className="text-xs font-bold text-slate-800">All Records</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                {pendingCount}
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-800">Pending</div>
                <div className="text-xs font-bold text-amber-900">Awaiting Sign-off</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                {reviewedCount}
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800">Reviewed</div>
                <div className="text-xs font-bold text-emerald-900">Doctor/Charge Nurse</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. RECORD DRUG DISPENSED FORM CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A758C]/10 border border-[#2A758C]/20 flex items-center justify-center text-[#2A758C]">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Drug Dispensed</h3>
              <p className="text-xs text-slate-500">
                Enter bedside dispensing details to log medication administration on the patient's card.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Fields marked with</span>
            <span className="text-rose-500 font-bold text-sm">*</span>
            <span className="text-xs text-slate-500 font-medium">are required</span>
          </div>
        </div>

        <form onSubmit={handleSaveDispensingRecord} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Patient Name * */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Patient Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value);
                    setShowPatientSuggestions(true);
                    if (formErrors.patientName) {
                      setFormErrors(prev => ({ ...prev, patientName: undefined }));
                    }
                  }}
                  onFocus={() => setShowPatientSuggestions(true)}
                  placeholder="Patient full name"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                    formErrors.patientName 
                      ? 'border-rose-400 bg-rose-50/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                />
                {patientName && (
                  <button
                    type="button"
                    onClick={() => {
                      setPatientName('');
                      setShowPatientSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {formErrors.patientName && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.patientName}
                </p>
              )}

              {/* Patient Autocomplete Suggestions */}
              {showPatientSuggestions && filteredPatientSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden py-1 max-h-48 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                    Suggested Patients
                  </div>
                  {filteredPatientSuggestions.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPatientName(p.name);
                        setCardNumber(p.hospital_number);
                        setShowPatientSuggestions(false);
                        setFormErrors(prev => ({ ...prev, patientName: undefined, cardNumber: undefined }));
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#2A758C]/5 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                    >
                      <span className="text-xs font-semibold text-slate-800">{p.name}</span>
                      <span className="text-[11px] font-mono text-[#2A758C] bg-[#2A758C]/10 px-2 py-0.5 rounded-md">
                        {p.hospital_number}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Card Number * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Card Number <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => {
                  setCardNumber(e.target.value);
                  if (formErrors.cardNumber) {
                    setFormErrors(prev => ({ ...prev, cardNumber: undefined }));
                  }
                }}
                placeholder="e.g. OPD-2024-0001"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                  formErrors.cardNumber 
                    ? 'border-rose-400 bg-rose-50/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              />
              {formErrors.cardNumber && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.cardNumber}
                </p>
              )}
            </div>

            {/* Drug Dispensed * */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Drug Dispensed <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={drugDispensed}
                  onChange={(e) => {
                    setDrugDispensed(e.target.value);
                    setShowDrugSuggestions(true);
                    if (formErrors.drugDispensed) {
                      setFormErrors(prev => ({ ...prev, drugDispensed: undefined }));
                    }
                  }}
                  onFocus={() => setShowDrugSuggestions(true)}
                  placeholder="Search drug..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                    formErrors.drugDispensed 
                      ? 'border-rose-400 bg-rose-50/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                />
                {drugDispensed && (
                  <button
                    type="button"
                    onClick={() => {
                      setDrugDispensed('');
                      setShowDrugSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {formErrors.drugDispensed && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.drugDispensed}
                </p>
              )}

              {/* Drug Autocomplete Suggestions */}
              {showDrugSuggestions && filteredDrugSuggestions.length > 0 && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden py-1 max-h-48 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span>Common Ward Medications</span>
                    <span className="text-[9px] text-slate-500 lowercase">click to select</span>
                  </div>
                  {filteredDrugSuggestions.map((d, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setDrugDispensed(d);
                        setShowDrugSuggestions(false);
                        setFormErrors(prev => ({ ...prev, drugDispensed: undefined }));
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-emerald-50/60 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0"
                    >
                      <span className="text-xs font-semibold text-slate-800">{d}</span>
                      <Pill className="h-3 w-3 text-emerald-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quantity <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (formErrors.quantity) {
                    setFormErrors(prev => ({ ...prev, quantity: undefined }));
                  }
                }}
                placeholder="e.g. 1 card, 2 bottles"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                  formErrors.quantity 
                    ? 'border-rose-400 bg-rose-50/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              />
              {formErrors.quantity && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.quantity}
                </p>
              )}
            </div>

            {/* Recorded By */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Recorded By
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(e) => setRecordedBy(e.target.value)}
                  placeholder="nurse1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all"
                />
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Nurse username or staff identification logged on shift.
              </p>
            </div>

            {/* Action Buttons Column */}
            <div className="flex items-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-5 py-2.5 rounded-xl bg-[#2A758C] hover:bg-[#236377] text-white text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[3]" />
                    <span>Save Dispensing Record</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPatientName('');
                  setCardNumber('');
                  setDrugDispensed('');
                  setQuantity('');
                  setFormErrors({});
                  setShowPatientSuggestions(false);
                  setShowDrugSuggestions(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Quick Selection Shortcuts */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Quick Drugs:</span>
            {['Paracetamol 500mg Tabs', 'Amoxicillin 500mg Caps', 'IV Normal Saline 500ml', 'Ibuprofen 400mg Tabs', 'Coartem (AL)'].map((drugItem, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setDrugDispensed(drugItem);
                  setShowDrugSuggestions(false);
                  if (!quantity) setQuantity('1 card');
                  setFormErrors(prev => ({ ...prev, drugDispensed: undefined }));
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 transition-all"
              >
                + {drugItem}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. ALL DISPENSING RECORDS TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900">All Dispensing Records</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2A758C]/10 text-[#2A758C] border border-[#2A758C]/20">
                {filteredRecords.length} {filteredRecords.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit register of medications dispensed by the nursing staff at bedside or triage.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-medium text-slate-600">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                All ({records.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('reviewed')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'reviewed' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                Reviewed ({reviewedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, card, drug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchDispensingData}
              disabled={loading}
              title="Refresh dispensing records"
              className="p-2 text-slate-500 hover:text-[#2A758C] hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shrink-0 self-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#2A758C]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dispensing Records Table */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Card No</th>
                <th className="py-3.5 px-4">Drug</th>
                <th className="py-3.5 px-4">Qty</th>
                <th className="py-3.5 px-4">Recorded By</th>
                <th className="py-3.5 px-4 text-center">Reviewed?</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-[#2A758C]" />
                      <span className="font-medium text-slate-500">Loading dispensing logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ClipboardList className="h-8 w-8 text-slate-300" />
                      <span className="font-medium text-slate-600">No dispensing records found</span>
                      <span className="text-[11px] text-slate-400">
                        {searchQuery ? 'Try adjusting your search criteria' : 'Fill out the form above to record drug dispensing'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr 
                    key={rec.id} 
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 font-semibold font-mono">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{rec.date}</span>
                      </div>
                    </td>

                    {/* Patient Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{rec.patient_name}</span>
                    </td>

                    {/* Card No */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {rec.card_number}
                      </span>
                    </td>

                    {/* Drug */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                          <Pill className="h-3 w-3" />
                        </div>
                        <span className="font-semibold text-slate-800">{rec.drug}</span>
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                        {rec.quantity}
                      </span>
                    </td>

                    {/* Recorded By */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="font-medium">{rec.recorded_by}</span>
                      </div>
                    </td>

                    {/* Reviewed? */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {rec.reviewed ? (
                        <button
                          type="button"
                          onClick={() => handleToggleReview(rec.id)}
                          title={`Click to toggle. Reviewed by ${rec.reviewed_by || 'Staff'} on ${rec.reviewed_at || 'record'}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Reviewed</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleReview(rec.id)}
                          title="Click to sign off as Reviewed"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>Pending</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleReview(rec.id)}
                          className="p-1 text-slate-400 hover:text-[#2A758C] hover:bg-slate-100 rounded-lg transition-colors"
                          title={rec.reviewed ? 'Mark as Unreviewed' : 'Mark as Reviewed'}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.id, rec.patient_name)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info notice */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>All dispensing transactions are cryptographically logged for pharmacy inventory reconciliation.</span>
          </div>
          <div>
            Showing <strong className="text-slate-700">{filteredRecords.length}</strong> of <strong className="text-slate-700">{records.length}</strong> total dispensing logs
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SUCCESS / CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {successDialog.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{successDialog.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    {successDialog.message}
                  </p>
                </div>

                {successDialog.record && (
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-600">Date:</span>
                      <span className="font-semibold text-slate-800 font-mono">{successDialog.record.date}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-600">Patient:</span>
                      <span className="font-bold text-slate-900">{successDialog.record.patient_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-600">Card Number:</span>
                      <span className="font-mono text-slate-800 font-semibold">{successDialog.record.card_number}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-600">Drug Dispensed:</span>
                      <span className="font-semibold text-emerald-700">{successDialog.record.drug}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-600">Quantity:</span>
                      <span className="font-bold text-slate-800">{successDialog.record.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Recorded By:</span>
                      <span className="font-medium text-slate-800">{successDialog.record.recorded_by}</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSuccessDialog({ isOpen: false, title: '', message: '' })}
                  className="w-full py-2.5 rounded-xl bg-[#2A758C] hover:bg-[#236377] text-white text-sm font-bold shadow-xs transition-colors"
                >
                  Done & Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
