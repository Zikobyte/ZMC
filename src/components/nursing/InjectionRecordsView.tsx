import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Syringe, 
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
  ShieldCheck,
  CheckCheck,
  Activity,
  Database,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface InjectionRecord {
  id: string;
  date: string;
  created_at: string;
  card_number: string;
  patient_name: string;
  injection_type: string;
  dose: string;
  nurse_sign: string;
  reviewed: boolean;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
}

export interface RegisteredPatientCard {
  hospital_number: string;
  name: string;
  phone_number?: string;
  category?: string;
  gender?: string;
}

export default function InjectionRecordsView() {
  const [records, setRecords] = useState<InjectionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed'>('all');
  const [commonInjections, setCommonInjections] = useState<string[]>([]);

  // Registered patients from database for card number lookup & autocomplete
  const [registeredPatients, setRegisteredPatients] = useState<RegisteredPatientCard[]>([]);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(false);
  const [showCardSuggestions, setShowCardSuggestions] = useState<boolean>(false);
  const [selectedPatientCard, setSelectedPatientCard] = useState<RegisteredPatientCard | null>(null);

  // References for card number input and dropdown handling
  const cardInputContainerRef = useRef<HTMLDivElement>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);

  // Form State matching user instructions:
  // Date * (07/09/2026)
  // Card Number * (Search by card ID, name or phone…)
  // Patient Name * (Auto-filled when card selected, or type manually)
  // Injection Type * (-- Select injection -- / Type injection name...)
  // Dose * (e.g. 500mg, 1 ampoule)
  // Nurse Sign (nurse1)
  const [date, setDate] = useState<string>('07/09/2026');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [selectedInjectionType, setSelectedInjectionType] = useState<string>('');
  const [customInjectionType, setCustomInjectionType] = useState<string>('');
  const [isCustomInjection, setIsCustomInjection] = useState<boolean>(false);
  const [dose, setDose] = useState<string>('');
  const [nurseSign, setNurseSign] = useState<string>('nurse1');

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    date?: string;
    cardNumber?: string;
    patientName?: string;
    injectionType?: string;
    dose?: string;
  }>({});

  // Success Feedback Modal
  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    record?: InjectionRecord;
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

  // Fetch initial injection records & suggestions
  const fetchInjectionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nursing/injections', {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        if (data.commonInjections) {
          setCommonInjections(data.commonInjections);
        }
      }
    } catch (err: any) {
      console.error('Error fetching injection records:', err);
      setError('Could not load injection records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered patients for lookup
  const fetchPatients = async (query = '') => {
    setLoadingPatients(true);
    try {
      const url = query
        ? `/api/nursing/patient-cards?search=${encodeURIComponent(query)}`
        : '/api/nursing/patient-cards';
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.patients)) {
          setRegisteredPatients(data.patients);
          return;
        }
      }

      // Fallback to /api/patients if needed
      const fallbackRes = await fetch('/api/patients', {
        headers: getAuthHeaders()
      });
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        const pts: RegisteredPatientCard[] = (fbData.patients || fbData || []).map((p: any) => ({
          name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.name || 'Patient',
          hospital_number: p.hospital_number || p.patient_id || p.card_number || p.id || '',
          phone_number: p.phone_number || p.phone || '',
          category: p.card_type || p.category || 'Outpatient',
          gender: p.gender || ''
        }));
        setRegisteredPatients(pts);
      }
    } catch (err) {
      console.warn('Could not load patient cards from database:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchInjectionData();
    fetchPatients();

    // Set today's date formatted if available
    const today = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    if (today) {
      setDate(today);
    }

    // Default nurse sign from saved user if available
    const savedUser = localStorage.getItem('zmc_user') || localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.username) {
          setNurseSign(parsed.username);
        }
      } catch (e) {
        // keep default 'nurse1'
      }
    }

    // Outside click & escape listener to close suggestions dropdown
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (cardInputContainerRef.current && !cardInputContainerRef.current.contains(e.target as Node)) {
        setShowCardSuggestions(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCardSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Form submit handler
  const handleSaveInjectionRecord = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeInjectionType = isCustomInjection ? customInjectionType.trim() : selectedInjectionType.trim();

    // Validate required fields
    const errors: typeof formErrors = {};
    if (!date.trim()) {
      errors.date = 'Date is required';
    }
    if (!cardNumber.trim()) {
      errors.cardNumber = 'Card Number is required';
    }
    if (!patientName.trim()) {
      errors.patientName = 'Patient Name is required';
    }
    if (!activeInjectionType) {
      errors.injectionType = 'Injection Type is required';
    }
    if (!dose.trim()) {
      errors.dose = 'Dose is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setSaving(true);

    try {
      const payload = {
        date: date.trim(),
        cardNumber: cardNumber.trim(),
        patientName: patientName.trim(),
        injectionType: activeInjectionType,
        dose: dose.trim(),
        nurseSign: nurseSign.trim() || 'nurse1'
      };

      const res = await fetch('/api/nursing/injections', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save injection record');
      }

      // Update state
      if (data.records) {
        setRecords(data.records);
      } else if (data.record) {
        setRecords(prev => [data.record, ...prev]);
      }

      // Open confirmation dialog
      setSuccessDialog({
        isOpen: true,
        title: 'Injection Record Saved',
        message: `Injection administration for "${payload.patientName}" (${payload.injectionType}, Dose: ${payload.dose}) has been recorded in the database.`,
        record: data.record
      });

      // Reset form fields
      setCardNumber('');
      setPatientName('');
      setSelectedPatientCard(null);
      setSelectedInjectionType('');
      setCustomInjectionType('');
      setIsCustomInjection(false);
      setDose('');
      setShowCardSuggestions(false);
    } catch (err: any) {
      console.error('Error saving injection record:', err);
      alert(`Error saving record: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Toggle review/verify status
  const handleToggleReview = async (recordId: string) => {
    try {
      const res = await fetch(`/api/nursing/injections/${recordId}/toggle-review`, {
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
    if (!window.confirm(`Are you sure you want to remove the injection record for ${name}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/nursing/injections/${recordId}`, {
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

  // Filtered card/patient suggestions from database
  const filteredCardSuggestions = useMemo(() => {
    if (!cardNumber.trim()) {
      // When input is selected/focused without typing, show all available patients from the database
      return registeredPatients;
    }
    const q = cardNumber.toLowerCase().trim();
    return registeredPatients.filter(p => 
      (p.hospital_number || '').toLowerCase().includes(q) || 
      (p.name || '').toLowerCase().includes(q) || 
      (p.phone_number && p.phone_number.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [cardNumber, registeredPatients]);

  // Handle patient selection from dropdown: auto-fills card number and patient name
  const handleSelectPatient = (p: RegisteredPatientCard) => {
    setCardNumber(p.hospital_number);
    setPatientName(p.name);
    setSelectedPatientCard(p);
    setShowCardSuggestions(false);
    setFormErrors(prev => ({
      ...prev,
      cardNumber: undefined,
      patientName: undefined
    }));
  };

  // Filtered table records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const matchesSearch = 
        (rec.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.card_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.injection_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.dose || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.nurse_sign || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.date || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'reviewed') return rec.reviewed === true;
      if (statusFilter === 'pending') return !rec.reviewed;
      return true;
    });
  }, [records, searchQuery, statusFilter]);

  // Quick stats
  const totalCount = records.length;
  const pendingCount = records.filter(r => !r.reviewed).length;
  const reviewedCount = records.filter(r => r.reviewed).length;

  return (
    <div className="space-y-8">
      {/* Top Banner & Department KPIs */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0">
              <Syringe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Injection Records</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  Ward Injection Registry
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
                Parenteral administration log, dosage tracking, syringe verification, and bedside clinical accountability.
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
                <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-600">Total Injections</div>
                <div className="text-xs font-bold text-slate-800">All Records</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">
                {pendingCount}
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-800">Pending Review</div>
                <div className="text-xs font-bold text-amber-900">Awaiting Sign-off</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                {reviewedCount}
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-800">Reviewed</div>
                <div className="text-xs font-bold text-emerald-900">Physician Verified</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. LOG INJECTION FORM CARD */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A758C]/10 border border-[#2A758C]/20 flex items-center justify-center text-[#2A758C]">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Log Injection</h3>
              <p className="text-xs text-slate-500">
                Record injectable medication administration and link directly to the patient's card.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Fields marked with</span>
            <span className="text-rose-500 font-bold text-sm">*</span>
            <span className="text-xs text-slate-500 font-medium">are required</span>
          </div>
        </div>

        <form onSubmit={handleSaveInjectionRecord} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Date * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (formErrors.date) {
                      setFormErrors(prev => ({ ...prev, date: undefined }));
                    }
                  }}
                  placeholder="07/09/2026"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                    formErrors.date 
                      ? 'border-rose-400 bg-rose-50/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                />
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              {formErrors.date && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.date}
                </p>
              )}
            </div>

            {/* Card Number * */}
            <div className="relative" ref={cardInputContainerRef}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Card Number <span className="text-rose-500 font-bold">*</span>
                </label>
                {registeredPatients.length > 0 && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Database className="h-3 w-3 text-[#2A758C]" />
                    <span>{registeredPatients.length} hospital patients</span>
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  ref={cardInputRef}
                  type="text"
                  value={cardNumber}
                  onChange={(e) => {
                    setCardNumber(e.target.value);
                    setShowCardSuggestions(true);
                    setSelectedPatientCard(null);
                    if (formErrors.cardNumber) {
                      setFormErrors(prev => ({ ...prev, cardNumber: undefined }));
                    }
                  }}
                  onFocus={() => {
                    setShowCardSuggestions(true);
                    if (registeredPatients.length === 0) {
                      fetchPatients();
                    }
                  }}
                  onClick={() => {
                    setShowCardSuggestions(true);
                  }}
                  placeholder="Search by card ID, name or phone…"
                  className={`w-full pl-3.5 pr-16 py-2.5 rounded-xl border text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                    formErrors.cardNumber 
                      ? 'border-rose-400 bg-rose-50/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                />
                
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {loadingPatients && (
                    <RefreshCw className="h-3.5 w-3.5 text-[#2A758C] animate-spin" />
                  )}
                  {cardNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        setCardNumber('');
                        setSelectedPatientCard(null);
                        setShowCardSuggestions(true);
                        cardInputRef.current?.focus();
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                      title="Clear card number"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowCardSuggestions(prev => !prev)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors"
                    title={showCardSuggestions ? "Close patient dropdown" : "Show patient dropdown"}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showCardSuggestions ? 'rotate-180 text-[#2A758C]' : ''}`} />
                  </button>
                </div>
              </div>

              {formErrors.cardNumber && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.cardNumber}
                </p>
              )}

              {/* Selected Patient Verification Pill */}
              {selectedPatientCard && (
                <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-[11px] text-emerald-800">
                  <div className="flex items-center gap-1.5 font-medium truncate">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Auto-linked: <strong>{selectedPatientCard.name}</strong></span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-100/70 text-emerald-900 px-1.5 py-0.5 rounded shrink-0">
                    {selectedPatientCard.hospital_number}
                  </span>
                </div>
              )}

              {/* Card Database Query & Autocomplete Dropdown */}
              {showCardSuggestions && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden py-1 max-h-64 flex flex-col">
                  <div className="px-3.5 py-2 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#2A758C]">
                      <Database className="h-3.5 w-3.5" />
                      <span>Hospital Patients ({filteredCardSuggestions.length})</span>
                    </div>
                    <span className="text-[10px] font-normal text-slate-400">Click to select & auto-fill</span>
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-100/80">
                    {filteredCardSuggestions.length > 0 ? (
                      filteredCardSuggestions.map((p, idx) => (
                        <button
                          key={`${p.hospital_number}-${idx}`}
                          type="button"
                          onClick={() => handleSelectPatient(p)}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-[#2A758C]/5 transition-colors flex items-center justify-between group"
                        >
                          <div className="min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-[#2A758C] transition-colors truncate">
                                {p.name}
                              </span>
                              {p.gender && (
                                <span className="text-[10px] text-slate-400">({p.gender})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              {p.category && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                  {p.category}
                                </span>
                              )}
                              {p.phone_number && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {p.phone_number}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 text-right">
                            <span className="text-xs font-mono font-bold text-[#2A758C] bg-[#2A758C]/10 group-hover:bg-[#2A758C] group-hover:text-white px-2.5 py-1 rounded-lg transition-colors border border-[#2A758C]/20">
                              {p.hospital_number}
                            </span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-xs text-slate-600 font-medium">
                          No registered patient matches &ldquo;{cardNumber}&rdquo;
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          You can still use this card number and type the patient&apos;s name manually.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCardSuggestions(false)}
                          className="mt-2 text-xs font-semibold text-[#2A758C] hover:underline"
                        >
                          Use &ldquo;{cardNumber}&rdquo; as manual card
                        </button>
                      </div>
                    )}
                  </div>

                  {filteredCardSuggestions.length > 0 && (
                    <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Showing {filteredCardSuggestions.length} registered patient{filteredCardSuggestions.length !== 1 ? 's' : ''}</span>
                      <span className="text-slate-500 font-medium">Press Esc to close</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Patient Name * */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Patient Name <span className="text-rose-500 font-bold">*</span>
                </label>
                {selectedPatientCard && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium border border-emerald-200/60">
                    Auto-filled from database
                  </span>
                )}
              </div>
              <input
                type="text"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  if (formErrors.patientName) {
                    setFormErrors(prev => ({ ...prev, patientName: undefined }));
                  }
                }}
                placeholder="Auto-filled when card selected, or type manually"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                  formErrors.patientName 
                    ? 'border-rose-400 bg-rose-50/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              />
              {formErrors.patientName && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.patientName}
                </p>
              )}
            </div>

            {/* Injection Type * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Injection Type <span className="text-rose-500 font-bold">*</span>
              </label>
              {!isCustomInjection ? (
                <div className="space-y-1.5">
                  <select
                    value={selectedInjectionType}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setIsCustomInjection(true);
                        setSelectedInjectionType('');
                      } else {
                        setSelectedInjectionType(val);
                      }
                      if (formErrors.injectionType) {
                        setFormErrors(prev => ({ ...prev, injectionType: undefined }));
                      }
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                      formErrors.injectionType 
                        ? 'border-rose-400 bg-rose-50/20' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <option value="">-- Select injection --</option>
                    {commonInjections.map((inj, idx) => (
                      <option key={idx} value={inj}>
                        {inj}
                      </option>
                    ))}
                    <option value="__custom__">Type injection name...</option>
                  </select>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={customInjectionType}
                    onChange={(e) => {
                      setCustomInjectionType(e.target.value);
                      if (formErrors.injectionType) {
                        setFormErrors(prev => ({ ...prev, injectionType: undefined }));
                      }
                    }}
                    placeholder="Type injection name..."
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                      formErrors.injectionType 
                        ? 'border-rose-400 bg-rose-50/20' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomInjection(false);
                      setCustomInjectionType('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#2A758C] hover:underline font-semibold"
                  >
                    Select list
                  </button>
                </div>
              )}
              {formErrors.injectionType && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.injectionType}
                </p>
              )}
            </div>

            {/* Dose * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dose <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={dose}
                onChange={(e) => {
                  setDose(e.target.value);
                  if (formErrors.dose) {
                    setFormErrors(prev => ({ ...prev, dose: undefined }));
                  }
                }}
                placeholder="e.g. 500mg, 1 ampoule"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all ${
                  formErrors.dose 
                    ? 'border-rose-400 bg-rose-50/20' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              />
              {formErrors.dose && (
                <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {formErrors.dose}
                </p>
              )}
            </div>

            {/* Nurse Sign */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nurse Sign
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nurseSign}
                  onChange={(e) => setNurseSign(e.target.value)}
                  placeholder="nurse1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2A758C]/20 transition-all"
                />
                <User className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Administering nurse signature or identification identifier.
              </p>
            </div>

            {/* Action Buttons Column */}
            <div className="flex items-end gap-3 pt-2 md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#2A758C] hover:bg-[#236377] text-white text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Syringe className="h-4 w-4 stroke-[2.5]" />
                    <span>Save Injection Record</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCardNumber('');
                  setPatientName('');
                  setSelectedInjectionType('');
                  setCustomInjectionType('');
                  setIsCustomInjection(false);
                  setDose('');
                  setFormErrors({});
                  setShowCardSuggestions(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium transition-colors"
              >
                Clear Form
              </button>
            </div>
          </div>

          {/* Quick Selection Shortcuts */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Quick Injections:</span>
            {[
              { name: 'IV Hydralazine 10mg', dose: '10mg, 1 ampoule' },
              { name: 'IM Diclofenac 75mg', dose: '75mg, 1 ampoule' },
              { name: 'IV Ceftriaxone 1g', dose: '1g, 1 vial' },
              { name: 'IV Hydrocortisone 100mg', dose: '100mg stat' },
              { name: 'Tetanus Toxoid (TT)', dose: '0.5ml IM' }
            ].map((inj, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setSelectedInjectionType(inj.name);
                  setIsCustomInjection(false);
                  if (!dose) setDose(inj.dose);
                  setFormErrors(prev => ({ ...prev, injectionType: undefined }));
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 text-slate-700 transition-all"
              >
                + {inj.name}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. ALL INJECTION RECORDS TABLE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900">All Injection Records</h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {filteredRecords.length} {filteredRecords.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit register of administered intramuscular, intravenous, and subcutaneous injections.
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
                placeholder="Search patient, card, injection..."
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
              onClick={fetchInjectionData}
              disabled={loading}
              title="Refresh injection records"
              className="p-2 text-slate-500 hover:text-[#2A758C] hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shrink-0 self-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#2A758C]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Injection Records Table */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Card Number</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Injection Type</th>
                <th className="py-3.5 px-4">Dose</th>
                <th className="py-3.5 px-4">Nurse Sign</th>
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
                      <span className="font-medium text-slate-500">Loading injection registry...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ClipboardList className="h-8 w-8 text-slate-300" />
                      <span className="font-medium text-slate-600">No injection records found</span>
                      <span className="text-[11px] text-slate-400">
                        {searchQuery ? 'Try adjusting your search query' : 'Fill out the form above to log injection administration'}
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

                    {/* Card Number */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {rec.card_number}
                      </span>
                    </td>

                    {/* Patient Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{rec.patient_name}</span>
                    </td>

                    {/* Injection Type */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                          <Syringe className="h-3 w-3" />
                        </div>
                        <span className="font-semibold text-slate-800">{rec.injection_type}</span>
                      </div>
                    </td>

                    {/* Dose */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-800 bg-purple-50/60 text-purple-900 border border-purple-100 px-2 py-0.5 rounded-md">
                        {rec.dose}
                      </span>
                    </td>

                    {/* Nurse Sign */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="font-medium">{rec.nurse_sign}</span>
                      </div>
                    </td>

                    {/* Reviewed? */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {rec.reviewed ? (
                        <button
                          type="button"
                          onClick={() => handleToggleReview(rec.id)}
                          title={`Click to toggle. Verified by ${rec.reviewed_by || 'Staff'} on ${rec.reviewed_at || 'record'}`}
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
                          title="Delete injection entry"
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
            <ShieldCheck className="h-4 w-4 text-purple-600" />
            <span>All injection records are strictly governed under hospital medication administration and safety protocols.</span>
          </div>
          <div>
            Showing <strong className="text-slate-700">{filteredRecords.length}</strong> of <strong className="text-slate-700">{records.length}</strong> injection records
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
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center mx-auto">
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
                      <span className="text-slate-600">Card Number:</span>
                      <span className="font-mono text-slate-800 font-semibold">{successDialog.record.card_number}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-600">Patient Name:</span>
                      <span className="font-bold text-slate-900">{successDialog.record.patient_name}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-600">Injection Type:</span>
                      <span className="font-semibold text-purple-700">{successDialog.record.injection_type}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-1.5">
                      <span className="text-slate-600">Dose:</span>
                      <span className="font-bold text-slate-800">{successDialog.record.dose}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Nurse Sign:</span>
                      <span className="font-medium text-slate-800">{successDialog.record.nurse_sign}</span>
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
