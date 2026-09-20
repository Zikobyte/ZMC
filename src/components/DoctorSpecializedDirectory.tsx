import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../utils/api';
import { Patient, User } from '../types';
import PatientDetailModal from './PatientDetailModal';
import ExportButton from './ExportButton';
import {
  HeartHandshake,
  Activity,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Phone,
  MapPin,
  Calendar,
  User as UserIcon,
  Filter,
  ArrowRight,
  ChevronRight,
  Baby,
  Flame,
  ShieldAlert,
  CreditCard,
  FileText,
  Printer,
  Sparkles,
  Lock,
  ArrowLeft,
  SlidersHorizontal,
  ExternalLink,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DoctorSpecializedDirectoryProps {
  initialCategory?: 'standard' | 'specialized' | 'maternity' | 'emergency';
  onSelectPatientForConsultation?: (patientId: string) => void;
  onBackToQueue?: () => void;
  currentUser?: User | null;
}

export default function DoctorSpecializedDirectory({
  initialCategory = 'standard',
  onSelectPatientForConsultation,
  onBackToQueue,
  currentUser
}: DoctorSpecializedDirectoryProps) {
  // Main Category: 'standard' or 'specialized'
  const [activeCategory, setActiveCategory] = useState<'standard' | 'specialized'>(() => {
    if (initialCategory === 'specialized' || initialCategory === 'maternity' || initialCategory === 'emergency') {
      return 'specialized';
    }
    return 'standard';
  });

  // Sub-category for specialized: 'all', 'maternity', 'emergency'
  const [specializedSubFilter, setSpecializedSubFilter] = useState<'all' | 'maternity' | 'emergency'>(() => {
    if (initialCategory === 'maternity') return 'maternity';
    if (initialCategory === 'emergency') return 'emergency';
    return 'all';
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [queueEncounters, setQueueEncounters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync initialCategory changes if prop updates
  useEffect(() => {
    if (initialCategory === 'specialized' || initialCategory === 'maternity' || initialCategory === 'emergency') {
      setActiveCategory('specialized');
      if (initialCategory === 'maternity') setSpecializedSubFilter('maternity');
      else if (initialCategory === 'emergency') setSpecializedSubFilter('emergency');
      else setSpecializedSubFilter('all');
    } else if (initialCategory === 'standard') {
      setActiveCategory('standard');
    }
  }, [initialCategory]);

  // Load authoritative clinical patients & live queue
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [patientsRes, queueRes] = await Promise.all([
        apiFetch('/patients'),
        apiFetch('/patients/opd/queue').catch(() => ({ success: false, data: [] }))
      ]);

      if (patientsRes.success && Array.isArray(patientsRes.data)) {
        setPatients(patientsRes.data);
      }
      if (queueRes.success && Array.isArray(queueRes.data)) {
        setQueueEncounters(queueRes.data);
      }
    } catch (err) {
      console.error('Failed to load clinical directory data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Merge live queue info (real-time clinical status, queue ID, vitals updates) with patient record
  const enrichedPatients = useMemo(() => {
    const queueMap = new Map();
    queueEncounters.forEach(q => {
      queueMap.set(q.patient_id, q);
    });

    return patients.map(p => {
      const queueItem = queueMap.get(p.id);
      const effectiveStatus = queueItem?.status 
        ? (queueItem.status === 'Processing' ? 'IN CONSULTATION' : queueItem.status)
        : p.status || 'Active';

      const effectiveVitals = queueItem?.blood_pressure ? {
        bloodPressure: queueItem.blood_pressure,
        temperature: queueItem.temperature ? parseFloat(queueItem.temperature) : p.vitals?.temperature || null,
        pulseRate: queueItem.pulse_rate ? parseInt(queueItem.pulse_rate, 10) : p.vitals?.pulseRate || null,
        respiratoryRate: queueItem.respiratory_rate ? parseInt(queueItem.respiratory_rate, 10) : p.vitals?.respiratoryRate || null,
        spo2: queueItem.spo2 ? parseInt(queueItem.spo2, 10) : p.vitals?.spo2 || null,
        weight: queueItem.weight ? parseFloat(queueItem.weight) : p.vitals?.weight || null,
        height: queueItem.height ? parseFloat(queueItem.height) : p.vitals?.height || null,
      } : p.vitals;

      return {
        ...p,
        queueItem,
        effectiveStatus,
        effectiveVitals,
      };
    });
  }, [patients, queueEncounters]);

  // Separate pools
  const standardPatients = useMemo(() => {
    return enrichedPatients.filter(p => p.cardType === 'Standard' || (!p.cardType && p.gender));
  }, [enrichedPatients]);

  const maternityPatients = useMemo(() => {
    return enrichedPatients.filter(p => p.cardType === 'Maternity' || Boolean(p.maternityDetails?.gravida) || Boolean(p.maternityNumber));
  }, [enrichedPatients]);

  const emergencyPatients = useMemo(() => {
    return enrichedPatients.filter(p => p.cardType === 'Emergency' || Boolean(p.emergencyDetails?.isSickEmergency) || Boolean(p.broughtInByName));
  }, [enrichedPatients]);

  const specializedPatients = useMemo(() => {
    return enrichedPatients.filter(p => p.cardType === 'Maternity' || p.cardType === 'Emergency' || Boolean(p.maternityDetails) || Boolean(p.emergencyDetails));
  }, [enrichedPatients]);

  // Determine current active list based on selection
  const currentPool = useMemo(() => {
    if (activeCategory === 'standard') {
      return standardPatients;
    }
    if (specializedSubFilter === 'maternity') {
      return maternityPatients;
    }
    if (specializedSubFilter === 'emergency') {
      return emergencyPatients;
    }
    return specializedPatients;
  }, [activeCategory, specializedSubFilter, standardPatients, maternityPatients, emergencyPatients, specializedPatients]);

  // Apply search query & status filter
  const filteredPatients = useMemo(() => {
    return currentPool.filter(p => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        p.name?.toLowerCase().includes(query) ||
        p.hospitalNumber?.toLowerCase().includes(query) ||
        (p as any).maternityNumber?.toLowerCase().includes(query) ||
        p.phoneNumber?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query) ||
        p.broughtInByName?.toLowerCase().includes(query) ||
        p.emergencyDetails?.customDetails?.toLowerCase().includes(query);

      // Status match
      let matchesStatus = true;
      if (statusFilter !== 'all') {
        const s = (p.effectiveStatus || '').toUpperCase();
        if (statusFilter === 'waiting') {
          matchesStatus = s.includes('WAITING') || s.includes('PENDING') || s.includes('QUEUED') || s.includes('TRIAGE');
        } else if (statusFilter === 'consulting') {
          matchesStatus = s.includes('CONSULTATION') || s.includes('PROCESSING');
        } else if (statusFilter === 'lab') {
          matchesStatus = s.includes('LAB') || s.includes('RESULTS');
        } else if (statusFilter === 'completed') {
          matchesStatus = s.includes('COMPLETED') || s.includes('DISCHARGED') || s.includes('DONE');
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [currentPool, searchQuery, statusFilter]);

  // Clinical helper: calculate age
  const calculateAge = (dobString: string) => {
    if (!dobString) return '—';
    try {
      const birthDate = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age > 0 ? `${age} yrs` : '< 1 yr';
    } catch {
      return '—';
    }
  };

  // Helper: BMI calculation
  const calculateBMI = (weightKg: number | null | undefined, heightM: number | null | undefined) => {
    if (!weightKg || !heightM || heightM <= 0) return null;
    const heightInMeters = heightM > 3 ? heightM / 100 : heightM;
    const bmi = weightKg / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10;
  };

  // Helper: Blood pressure categorization
  const getBPCategory = (bpStr: string | null | undefined) => {
    if (!bpStr || !bpStr.includes('/')) return null;
    const parts = bpStr.split('/');
    const sys = parseInt(parts[0], 10);
    const dia = parseInt(parts[1], 10);
    if (isNaN(sys) || isNaN(dia)) return null;

    if (sys >= 140 || dia >= 90) {
      return { label: 'Hypertensive (High)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    if ((sys >= 120 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return { label: 'Pre-hypertensive', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    if (sys < 90 || dia < 60) {
      return { label: 'Hypotensive (Low)', color: 'text-sky-700 bg-sky-50 border-sky-200' };
    }
    return { label: 'Optimal Normal', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      {/* Top Banner & Context Header */}
      <div className="bg-[#1D222B] px-6 py-5 border-b border-[#151921] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToQueue && (
              <button
                onClick={onBackToQueue}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold mr-1"
                title="Return to Consultation Desk"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div className="p-2.5 bg-[#2A758C]/20 border border-[#2A758C]/40 rounded-2xl text-[#A3D1E0]">
              {activeCategory === 'standard' ? (
                <HeartHandshake className="h-6 w-6 text-sky-400" />
              ) : (
                <Activity className="h-6 w-6 text-rose-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg md:text-xl font-black text-white tracking-tight">
                  {activeCategory === 'standard' 
                    ? 'Standard Cards Clinical Registry' 
                    : 'Specialized Clinical Care Directory'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  Doctor Access
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeCategory === 'standard'
                  ? 'Authoritative general outpatient medical dossiers, vital histories, and active consultation statuses'
                  : 'Maternity obstetric tracking, gestational monitoring, and emergency acute trauma clinical intake protocols'}
              </p>
            </div>
          </div>

          {/* Quick Category Switcher */}
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setActiveCategory('standard');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeCategory === 'standard'
                  ? 'bg-sky-500 text-slate-950 shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HeartHandshake className="h-4 w-4" />
              <span>Standard Cards</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                activeCategory === 'standard' ? 'bg-slate-950 text-white font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {standardPatients.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveCategory('specialized');
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeCategory === 'specialized'
                  ? 'bg-rose-500 text-white shadow-md scale-[1.02]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Specialized Care</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                activeCategory === 'specialized' ? 'bg-rose-950 text-rose-200 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {specializedPatients.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">

        {/* Sub-Filters / Metric Ribbons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-2xs">
          
          {/* If Specialized: sub-tabs */}
          {activeCategory === 'specialized' ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono mr-1">
                Filter Category:
              </span>
              <button
                onClick={() => setSpecializedSubFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  specializedSubFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>All Specialized</span>
                <span className="text-[10px] opacity-75 font-mono">({specializedPatients.length})</span>
              </button>

              <button
                onClick={() => setSpecializedSubFilter('maternity')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  specializedSubFilter === 'maternity'
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200/50'
                }`}
              >
                <Baby className="h-3.5 w-3.5" />
                <span>Maternity Care (Obstetrics)</span>
                <span className="text-[10px] font-mono">({maternityPatients.length})</span>
              </button>

              <button
                onClick={() => setSpecializedSubFilter('emergency')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  specializedSubFilter === 'emergency'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50'
                }`}
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Emergency & Acute Trauma</span>
                <span className="text-[10px] font-mono">({emergencyPatients.length})</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold text-slate-500 font-mono uppercase tracking-wider">
                Category Scope:
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 text-xs font-extrabold">
                <HeartHandshake className="h-3.5 w-3.5 text-sky-600" />
                Standard Registrations ({standardPatients.length} records)
              </span>
            </div>
          )}

          {/* Quick Refresh and Export */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Refresh database records"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#2A758C]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <ExportButton
              exportType="patients"
              label="Export HMS Data"
              className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 py-2.5 px-3.5 text-xs font-black rounded-xl"
            />
          </div>
        </div>

        {/* Search & Quick Status Filters */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  activeCategory === 'standard'
                    ? "Search standard patients by name, hospital no (ZMC-2026-xxx), phone, or address..."
                    : "Search specialized cases by name, maternity no, emergency type, escort/informant, or notes..."
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20 focus:border-[#2A758C] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4 text-slate-400 shrink-0 hidden sm:block" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full sm:w-48 bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20"
              >
                <option value="all">All Statuses ({currentPool.length})</option>
                <option value="waiting">Awaiting Doctor / Triage</option>
                <option value="consulting">In Consultation</option>
                <option value="lab">Lab Results Pending/Ready</option>
                <option value="completed">Completed / Discharged</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-2xs space-y-3">
            <RefreshCw className="h-8 w-8 text-[#2A758C] animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-700">Loading authoritative patient records...</p>
            <p className="text-xs text-slate-400">Verifying relational database models and clinical queues</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-2xs space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">No Patient Records Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery
                ? `No matches found for query "${searchQuery}". Try searching with a different term.`
                : `There are currently no patients categorized under ${
                    activeCategory === 'standard' ? 'Standard Cards' : specializedSubFilter.toUpperCase()
                  }.`}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          /* Patient Dossiers Grid */
          <div className="grid grid-cols-1 gap-5">
            {filteredPatients.map(patient => {
              const vitals = patient.effectiveVitals;
              const bpCategory = getBPCategory(vitals?.bloodPressure);
              const bmi = calculateBMI(vitals?.weight, vitals?.height);
              const isMaternity = patient.cardType === 'Maternity' || Boolean(patient.maternityDetails);
              const isEmergency = patient.cardType === 'Emergency' || Boolean(patient.emergencyDetails);
              const isStandard = !isMaternity && !isEmergency;

              return (
                <div
                  key={patient.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Card Header Bar */}
                  <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Monospace Hospital ID badge */}
                      <span className="px-3 py-1 bg-slate-900 text-white rounded-xl text-xs font-black font-mono tracking-wider shadow-2xs">
                        {patient.hospitalNumber || patient.id}
                      </span>

                      {/* Maternity Number if applicable */}
                      {(patient as any).maternityNumber && (
                        <span className="px-2.5 py-1 bg-pink-100 text-pink-800 border border-pink-200 rounded-xl text-xs font-black font-mono flex items-center gap-1">
                          <Baby className="h-3.5 w-3.5 text-pink-600" />
                          {(patient as any).maternityNumber}
                        </span>
                      )}

                      {/* Card Type Tag */}
                      {isEmergency ? (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-black font-mono flex items-center gap-1">
                          <Flame className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
                          EMERGENCY CARE
                        </span>
                      ) : isMaternity ? (
                        <span className="px-2.5 py-1 bg-pink-50 text-pink-700 border border-pink-200 rounded-xl text-xs font-black font-mono flex items-center gap-1">
                          <Baby className="h-3.5 w-3.5 text-pink-600" />
                          MATERNITY
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-xl text-xs font-black font-mono flex items-center gap-1">
                          <HeartHandshake className="h-3.5 w-3.5 text-sky-600" />
                          STANDARD CARD
                        </span>
                      )}

                      {/* Real-time Status Badge */}
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-extrabold font-mono tracking-wider flex items-center gap-1.5 ${
                          patient.effectiveStatus?.includes('IN CONSULTATION')
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : patient.effectiveStatus?.includes('LAB')
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : patient.effectiveStatus?.includes('WAITING') || patient.effectiveStatus?.includes('PENDING')
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {patient.effectiveStatus}
                      </span>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2.5">
                      {onSelectPatientForConsultation && (
                        <button
                          onClick={() => onSelectPatientForConsultation(patient.id)}
                          className="flex items-center gap-2 bg-[#2A758C] hover:bg-[#205b6d] active:scale-95 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer"
                        >
                          <Stethoscope className="h-4 w-4" />
                          <span>Consult Patient</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedPatientForModal(patient);
                          setIsModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 text-xs font-extrabold px-3.5 py-2.5 rounded-2xl transition-all shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#2A758C]" />
                        <span>Full EMR File</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Main Body */}
                  <div className="p-5 sm:p-6 space-y-6">
                    
                    {/* Patient Basic Identity & Demographics Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-[11px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                          Patient Name & Profile
                        </p>
                        <h2 className="text-lg font-black text-slate-900 mt-0.5 flex items-center gap-2">
                          <span>{patient.name}</span>
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                            {patient.gender}
                          </span>
                        </h2>
                        <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                          <span>DOB: {patient.dateOfBirth || '—'}</span>
                          <span>•</span>
                          <span>Age: {calculateAge(patient.dateOfBirth)}</span>
                          <span>•</span>
                          <span>Marital: {patient.maritalStatus || 'Single'}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                          Contact & Address
                        </p>
                        <div className="mt-1 space-y-1 text-xs text-slate-700">
                          <p className="flex items-center gap-1.5 font-bold font-mono">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {patient.phoneNumber ? (
                              <a href={`tel:${patient.phoneNumber}`} className="hover:text-[#2A758C] hover:underline">
                                {patient.phoneNumber}
                              </a>
                            ) : (
                              'No phone provided'
                            )}
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-500 truncate">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{patient.address || 'Address unrecorded'}</span>
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-[11px] font-extrabold uppercase text-slate-400 font-mono tracking-wider">
                          Registration & Department
                        </p>
                        <div className="mt-1 space-y-1 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            Registered: {patient.registrationDate ? new Date(patient.registrationDate).toLocaleDateString() : '—'}
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                            <UserIcon className="h-3 w-3 text-slate-400" />
                            By: {patient.registeredBy || 'Clinical Staff'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vitals Matrix Section (Real-Time Accurate) */}
                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-[#2A758C]" />
                          Clinical Vital Signs Matrix
                        </span>
                        {bpCategory && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${bpCategory.color}`}>
                            {bpCategory.label}
                          </span>
                        )}
                      </div>

                      {vitals && (vitals.bloodPressure || vitals.pulseRate || vitals.temperature || vitals.weight) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                          {/* BP */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Blood Pressure</p>
                            <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                              {vitals.bloodPressure || '—'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">mmHg</p>
                          </div>

                          {/* Heart Rate / Pulse */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Pulse Rate</p>
                            <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                              {vitals.pulseRate ? `${vitals.pulseRate} bpm` : '—'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">Resting HR</p>
                          </div>

                          {/* Temperature */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Temperature</p>
                            <p className={`text-sm font-black font-mono mt-0.5 ${
                              vitals.temperature && vitals.temperature >= 38 ? 'text-rose-600' : 'text-slate-900'
                            }`}>
                              {vitals.temperature ? `${vitals.temperature} °C` : '—'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">Axillary / Core</p>
                          </div>

                          {/* Respiratory Rate */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Resp. Rate</p>
                            <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                              {vitals.respiratoryRate ? `${vitals.respiratoryRate} /min` : '—'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">Cycles / min</p>
                          </div>

                          {/* SpO2 */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Oxygen (SpO₂)</p>
                            <p className={`text-sm font-black font-mono mt-0.5 ${
                              vitals.spo2 && vitals.spo2 < 95 ? 'text-amber-600' : 'text-slate-900'
                            }`}>
                              {vitals.spo2 ? `${vitals.spo2} %` : '—'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">Pulse Oximetry</p>
                          </div>

                          {/* Weight & BMI */}
                          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                            <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">Weight / BMI</p>
                            <p className="text-sm font-black text-slate-900 font-mono mt-0.5">
                              {vitals.weight ? `${vitals.weight} kg` : '—'}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium">
                              {bmi ? `BMI: ${bmi}` : 'No height recorded'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-white rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                          Vital signs not yet recorded for this patient. Ready for nursing intake triage.
                        </div>
                      )}
                    </div>

                    {/* Specialized Clinical Data: Maternity Details (if Maternity) */}
                    {isMaternity && (
                      <div className="bg-pink-50/50 rounded-2xl p-4 border border-pink-200/70 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-pink-900 uppercase tracking-wider font-mono flex items-center gap-2">
                            <Baby className="h-4 w-4 text-pink-600" />
                            Accurate Obstetric & Antenatal Dossier
                          </span>
                          <span className="text-[10px] font-bold text-pink-700 font-mono">
                            Maternity Protocol Active
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                          <div className="bg-white p-2.5 rounded-xl border border-pink-100">
                            <p className="text-[10px] font-bold text-slate-400 font-mono">Gravida (Total)</p>
                            <p className="text-sm font-black text-pink-950 font-mono mt-0.5">
                              {patient.maternityDetails?.gravida || (patient as any).gravida || '0'}
                            </p>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-pink-100">
                            <p className="text-[10px] font-bold text-slate-400 font-mono">Para (Viable Births)</p>
                            <p className="text-sm font-black text-pink-950 font-mono mt-0.5">
                              {patient.maternityDetails?.para || (patient as any).para || '0'}
                            </p>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-pink-100">
                            <p className="text-[10px] font-bold text-slate-400 font-mono">Last Menstrual (LMP)</p>
                            <p className="text-xs font-black text-slate-900 font-mono mt-0.5">
                              {patient.maternityDetails?.lmp || (patient as any).lmp || '—'}
                            </p>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-pink-100">
                            <p className="text-[10px] font-bold text-slate-400 font-mono">Estimated Due (EDD)</p>
                            <p className="text-xs font-black text-rose-600 font-mono mt-0.5">
                              {patient.maternityDetails?.edd || (patient as any).edd || '—'}
                            </p>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-pink-100">
                            <p className="text-[10px] font-bold text-slate-400 font-mono">Gestational Age</p>
                            <p className="text-xs font-black text-slate-900 font-mono mt-0.5">
                              {patient.maternityDetails?.gestationalAge || (patient as any).gestationalAge || 'Calculated at exam'}
                            </p>
                          </div>

                          <div className="bg-white p-2.5 rounded-xl border border-pink-100">
                            <p className="text-[10px] font-bold text-slate-400 font-mono">Tribe / Ethnicity</p>
                            <p className="text-xs font-black text-slate-900 font-mono mt-0.5">
                              {patient.maternityDetails?.tribe || (patient as any).tribe || '—'}
                            </p>
                          </div>
                        </div>

                        {/* Next of Kin / Partner */}
                        <div className="bg-white p-3 rounded-xl border border-pink-100 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-600">
                          <div>
                            <span className="font-bold text-slate-700">Spouse / Next of Kin: </span>
                            <span>{patient.nextOfKinName || '—'} ({patient.nextOfKinRelationship || 'Partner'})</span>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Phone: </span>
                            <span className="font-mono">{patient.nextOfKinPhone || '—'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Specialized Clinical Data: Emergency Details (if Emergency) */}
                    {isEmergency && (
                      <div className="bg-rose-50/50 rounded-2xl p-4 border border-rose-200/70 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-rose-900 uppercase tracking-wider font-mono flex items-center gap-2">
                            <Flame className="h-4 w-4 text-rose-600 animate-pulse" />
                            Accurate Emergency Triage & Incident Intake Protocol
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 bg-rose-600 text-white rounded-md uppercase font-mono">
                            Priority Red
                          </span>
                        </div>

                        {/* Emergency Incident Nature */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white p-3 rounded-xl border border-rose-100">
                            <p className="text-[10px] font-bold text-slate-400 font-mono">Emergency Category</p>
                            <p className="text-xs font-black text-rose-700 uppercase font-mono mt-0.5">
                              {patient.emergencyDetails?.isAccident 
                                ? 'Road Traffic Accident (RTA)'
                                : patient.emergencyDetails?.isUnbookedLabour
                                ? 'Unbooked Labour'
                                : patient.emergencyDetails?.isSickEmergency
                                ? 'Acute Sick Emergency'
                                : 'Acute Emergency Intake'}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-rose-100">
                            <p className="text-[10px] font-bold text-slate-400 font-mono">Doctor on Call</p>
                            <p className="text-xs font-black text-slate-900 font-mono mt-0.5">
                              {(patient as any).doctorOnCallName || (patient as any).doctor_on_call_name || currentUser?.name || 'On-Call Medical Officer'}
                            </p>
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-rose-100">
                            <p className="text-[10px] font-bold text-slate-400 font-mono">Emergency Deposit / Bill</p>
                            <p className="text-xs font-black text-emerald-700 font-mono mt-0.5">
                              Cash: ₦{Number((patient as any).cashCollected || patient.emergencyDetails?.cashCollected || 0).toLocaleString()} 
                              {Number((patient as any).totalBillAmount || patient.emergencyDetails?.totalBillAmount || 0) > 0 && 
                                ` / Total: ₦${Number((patient as any).totalBillAmount || patient.emergencyDetails?.totalBillAmount || 0).toLocaleString()}`}
                            </p>
                          </div>
                        </div>

                        {/* Informant / Brought In By */}
                        <div className="bg-white p-3 rounded-xl border border-rose-100 text-xs text-slate-700 space-y-1">
                          <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                            <span>Brought In By (Informant / Escort):</span>
                            <span className="font-bold text-[#2A758C]">
                              {patient.broughtInByName || (patient as any).brought_in_by_name || 'Unaccompanied / Self'}
                            </span>
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-slate-500 font-mono text-[11px] pt-0.5">
                            <span>Phone: {patient.broughtInByPhone || (patient as any).brought_in_by_phone || '—'}</span>
                            <span>•</span>
                            <span>Rel: {patient.broughtInByRelationship || (patient as any).brought_in_by_relationship || 'Good Samaritan'}</span>
                            <span>•</span>
                            <span>ID: {patient.broughtInByIdType || 'National ID'} ({patient.broughtInByIdNumber || '—'})</span>
                          </div>
                        </div>

                        {/* Custom Details / Incident Notes */}
                        {(patient.emergencyDetails?.customDetails || (patient as any).custom_details) && (
                          <div className="bg-white p-3 rounded-xl border border-rose-100 text-xs">
                            <p className="text-[10px] font-bold text-slate-400 font-mono uppercase">Arrival Incident Notes:</p>
                            <p className="text-slate-800 font-mono text-xs mt-1 bg-slate-50 p-2 rounded-lg">
                              {patient.emergencyDetails?.customDetails || (patient as any).custom_details}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Standard Clinical Directives & Notes (if Standard) */}
                    {isStandard && (
                      <div className="bg-sky-50/40 rounded-2xl p-4 border border-sky-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                            <span>General Outpatient Consultation Protocol</span>
                          </p>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Patient eligible for standard specialist review, routine diagnostic orders, and pharmacy prescriptions.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-white border border-sky-200 rounded-xl text-sky-900 font-mono font-bold text-[11px]">
                            Account Balance: ₦{Number(patient.balance || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Patient Detail Modal for full EMR view */}
      {selectedPatientForModal && (
        <PatientDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPatientForModal(null);
          }}
          patient={selectedPatientForModal}
        />
      )}
    </div>
  );
}
