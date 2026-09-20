import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Patient, Vitals, MaternityDetails, EmergencyDetails } from '../types';
import ExportButton from './ExportButton';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Heart, 
  Activity, 
  FileText, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Stethoscope, 
  Pill, 
  FlaskConical, 
  BedDouble, 
  Printer, 
  Loader2, 
  Building2, 
  ShieldAlert, 
  CreditCard, 
  Clock, 
  UserCheck, 
  HeartHandshake,
  ChevronRight,
  Sparkles,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | any | null;
}

export default function PatientDetailModal({ isOpen, onClose, patient }: PatientDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'demographics' | 'vitals' | 'clinical' | 'pharmacy_lab' | 'billing'>('demographics');
  const [history, setHistory] = useState<any | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && patient?.id) {
      fetchPatientHistory(patient.id);
    } else {
      setHistory(null);
    }
  }, [isOpen, patient?.id]);

  const handlePrintEMRSummary = async () => {
    setIsPrinting(true);
    try {
      const pid = patient?.id || patient?.hospital_number || patient?.hospitalNumber;
      if (!pid) {
        window.print();
        return;
      }
      const token = localStorage.getItem('zmc_auth_token');
      const res = await fetch(`/api/exports?type=medical-records&format=pdf&patientId=${encodeURIComponent(pid)}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `EMR_Summary_${(patient.name || 'Patient').replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('Print EMR fallback:', e);
      try { window.print(); } catch (err) {}
    } finally {
      setIsPrinting(false);
    }
  };

  const fetchPatientHistory = async (patientId: string) => {
    setLoadingHistory(true);
    try {
      const res = await apiFetch(`/patients/${patientId}/history`);
      if (res.success) {
        setHistory(res.data);
      }
    } catch (err) {
      console.error('Error fetching patient history for modal:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !patient) return null;

  // Derive display values from patient or history patient record
  const patData = history?.patient || patient;
  const hospitalNum = patData.hospital_number || patData.hospitalNumber || 'ZMC-2026-000';
  const fullName = patData.name || patient.name || 'Outpatient';
  const cardType = patData.card_type || patData.cardType || 'Standard';
  const status = patData.status || patient.status || 'Active';
  const phone = patData.phone_number || patData.phoneNumber || 'N/A';
  const address = patData.address || patient.address || 'N/A';
  const gender = patData.gender || patient.gender || 'Not Specified';
  const dob = patData.date_of_birth || patData.dateOfBirth || 'N/A';
  const marital = patData.marital_status || patData.maritalStatus || 'Single';
  const regDate = patData.registration_date || patData.registrationDate || 'N/A';
  const registeredBy = patData.registered_by || patData.registeredBy || 'Receptionist';
  
  const balance = parseFloat((patData.outstanding_balance ?? patData.outstandingBalance ?? patData.balance ?? 0).toString());
  const cardFee = parseFloat((patData.card_fee ?? patData.cardFee ?? 3000).toString());

  // Vitals from history or patient object
  const vitalsList = history?.vitals || [];
  const latestVitals = vitalsList.length > 0 ? vitalsList[0] : (patient.vitals || null);

  // Encounters / Consultations
  const encounters = history?.encounters || [];
  const consultations = history?.consultations || [];
  const labOrders = history?.labOrders || [];
  const pharmacyOrders = history?.pharmacyOrders || [];
  const invoices = history?.invoices || [];

  // Card color badge helper
  const getCardBadge = (type: string) => {
    switch (type) {
      case 'Maternity':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Emergency':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-200';
    }
  };

  // Status badge helper
  const getStatusBadge = (st: string) => {
    if (st.includes('Doctor') || st.includes('Waiting') || st.includes('Pending')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (st.includes('Discharged') || st.includes('Approved') || st.includes('Completed') || st.includes('Cleared')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (st.includes('Admitted') || st.includes('Ward')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        >
          {/* Top Modal Header */}
          <div className="bg-[#181D27] text-white p-6 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#2A758C] text-white flex items-center justify-center text-xl font-black shadow-lg border border-white/20">
                {fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black tracking-tight text-white">{fullName}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase font-mono border ${getCardBadge(cardType)}`}>
                    {cardType} Card
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(status)}`}>
                    {status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-mono mt-1">
                  <span>Hospital ID: <strong className="text-[#38bdf8]">{hospitalNum}</strong></span>
                  <span>•</span>
                  <span>Gender: <strong>{gender}</strong></span>
                  <span>•</span>
                  <span>DOB: <strong>{dob}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-2xl border border-white/10">
              <div>
                <p className="text-[10px] text-slate-400 font-mono uppercase">Outstanding Balance</p>
                <p className={`text-base font-black font-mono ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ₦{balance.toLocaleString()}
                </p>
              </div>
              {balance > 0 ? (
                <ShieldAlert className="h-5 w-5 text-rose-400 animate-pulse ml-2" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 ml-2" />
              )}
            </div>
          </div>

          {/* KPI Strip */}
          <div className="bg-slate-50 border-b border-slate-100 p-3 px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#2A758C]" />
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">PHONE CONTACT</span>
                <span className="font-extrabold text-slate-800">{phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#2A758C]" />
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">RESIDENCE ADDRESS</span>
                <span className="font-extrabold text-slate-800 truncate max-w-[160px]" title={address}>{address}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#2A758C]" />
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">REGISTRATION DATE</span>
                <span className="font-extrabold text-slate-800">{regDate ? new Date(regDate).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-[#2A758C]" />
              <div>
                <span className="text-[10px] text-slate-400 block font-mono">REGISTERED BY</span>
                <span className="font-extrabold text-slate-800">{registeredBy}</span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex border-b border-slate-100 px-6 pt-3 bg-white gap-2 overflow-x-auto">
            {[
              { id: 'demographics', label: 'Patient Profile & Contacts', icon: <User className="h-3.5 w-3.5" /> },
              { id: 'vitals', label: 'Vitals & Triage', icon: <Activity className="h-3.5 w-3.5" /> },
              { id: 'clinical', label: 'Consultations & Encounters', icon: <Stethoscope className="h-3.5 w-3.5" /> },
              { id: 'pharmacy_lab', label: 'Lab & Pharmacy', icon: <FlaskConical className="h-3.5 w-3.5" /> },
              { id: 'billing', label: 'Billing & Ledger', icon: <CreditCard className="h-3.5 w-3.5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-2xl text-xs font-bold transition-all cursor-pointer border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#2A758C] text-[#2A758C] bg-teal-50/40 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Modal Content Area */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/30">
            {loadingHistory && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-[#2A758C] bg-teal-50/50 rounded-2xl border border-teal-100">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading live patient clinical records and historical ledgers...</span>
              </div>
            )}

            {/* TAB 1: Patient Profile & Contacts */}
            {activeTab === 'demographics' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Basic Information Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                    <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <User className="h-4 w-4 text-[#2A758C]" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Full Name:</span>
                        <span className="font-extrabold text-slate-800">{fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Hospital Number:</span>
                        <span className="font-mono font-bold text-[#2A758C]">{hospitalNum}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Gender:</span>
                        <span className="font-bold text-slate-800">{gender}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Date of Birth:</span>
                        <span className="font-bold text-slate-800">{dob}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Marital Status:</span>
                        <span className="font-bold text-slate-800">{marital}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Card Type:</span>
                        <span className="font-bold text-slate-800">{cardType} (₦{cardFee.toLocaleString()})</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact & ID Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                    <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Phone className="h-4 w-4 text-[#2A758C]" /> Contact & Identification
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Primary Phone:</span>
                        <span className="font-extrabold text-slate-800">{phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ID Document Type:</span>
                        <span className="font-bold text-slate-800">{patData.id_type || patData.idType || 'NIN / National ID'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">ID Document Number:</span>
                        <span className="font-mono font-bold text-slate-800">{patData.id_number || patData.idNumber || 'Not Uploaded'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Residential Address:</span>
                        <span className="font-semibold text-slate-800">{address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next of Kin & Emergency Contacts */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                  <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <HeartHandshake className="h-4 w-4 text-[#2A758C]" /> Next of Kin & Guarantor Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Next of Kin Name:</span>
                      <span className="font-extrabold text-slate-800">{patData.next_of_kin_name || patData.nextOfKinName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Next of Kin Phone:</span>
                      <span className="font-extrabold text-slate-800">{patData.next_of_kin_phone || patData.nextOfKinPhone || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Relationship:</span>
                      <span className="font-bold text-slate-800">{patData.next_of_kin_relationship || patData.nextOfKinRelationship || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Brought in details if emergency */}
                  {(patData.brought_in_by_name || patData.broughtInByName) && (
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                      <div>
                        <span className="text-amber-800 font-bold block text-[10px]">Brought in By:</span>
                        <span className="font-black text-slate-900">{patData.brought_in_by_name || patData.broughtInByName}</span>
                      </div>
                      <div>
                        <span className="text-amber-800 font-bold block text-[10px]">Phone Number:</span>
                        <span className="font-bold text-slate-900">{patData.brought_in_by_phone || patData.broughtInByPhone}</span>
                      </div>
                      <div>
                        <span className="text-amber-800 font-bold block text-[10px]">Relationship / Identity:</span>
                        <span className="font-bold text-slate-900">{patData.brought_in_by_relationship || patData.broughtInByRelationship || 'Good Samaritan'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Specialized Maternity Details if applicable */}
                {cardType === 'Maternity' && (
                  <div className="bg-rose-50/60 p-5 rounded-2xl border border-rose-100 shadow-2xs space-y-3">
                    <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-rose-800 flex items-center gap-2 border-b border-rose-200 pb-2">
                      <Heart className="h-4 w-4 text-rose-600" /> Antenatal & Maternity Record
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-rose-700 block text-[10px]">Gravida / Para:</span>
                        <span className="font-black text-slate-900">G{patData.gravida || '1'} P{patData.para || '0'}</span>
                      </div>
                      <div>
                        <span className="text-rose-700 block text-[10px]">LMP:</span>
                        <span className="font-bold text-slate-900">{patData.lmp || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-rose-700 block text-[10px]">EDD:</span>
                        <span className="font-bold text-slate-900">{patData.edd || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-rose-700 block text-[10px]">Gestational Age:</span>
                        <span className="font-bold text-slate-900">{patData.gestational_age || patData.gestationalAge || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Vitals & Triage History */}
            {activeTab === 'vitals' && (
              <div className="space-y-4">
                {latestVitals ? (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                    <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#2A758C]" /> Latest Triage Vitals
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 font-mono">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 block">BLOOD PRESSURE</span>
                        <span className="text-sm font-black text-slate-900">{latestVitals.blood_pressure || latestVitals.bloodPressure || '120/80'}</span>
                        <span className="text-[9px] text-slate-400 block">mmHg</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 block">TEMPERATURE</span>
                        <span className="text-sm font-black text-amber-600">{latestVitals.temperature || 36.8}°C</span>
                        <span className="text-[9px] text-slate-400 block">Celsius</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 block">PULSE RATE</span>
                        <span className="text-sm font-black text-rose-600">{latestVitals.pulse_rate || latestVitals.pulseRate || 72}</span>
                        <span className="text-[9px] text-slate-400 block">bpm</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 block">RESPIRATION</span>
                        <span className="text-sm font-black text-sky-600">{latestVitals.respiratory_rate || latestVitals.respiratoryRate || 18}</span>
                        <span className="text-[9px] text-slate-400 block">cpm</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 block">SPO2 SATURATION</span>
                        <span className="text-sm font-black text-emerald-600">{latestVitals.spo2 || 98}%</span>
                        <span className="text-[9px] text-slate-400 block">Oxygen</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 block">WEIGHT / HEIGHT</span>
                        <span className="text-sm font-black text-slate-900">{latestVitals.weight || 70} kg</span>
                        <span className="text-[9px] text-slate-400 block">{latestVitals.height || 170} cm</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold bg-white rounded-2xl border border-dashed border-slate-200">
                    No triage vitals recorded for this patient yet.
                  </div>
                )}

                {/* Vitals History List */}
                {vitalsList.length > 1 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                    <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-500">
                      Historical Vitals Logs ({vitalsList.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 font-mono">
                            <th className="p-2">Date / Time</th>
                            <th className="p-2">BP</th>
                            <th className="p-2">Temp</th>
                            <th className="p-2">Pulse</th>
                            <th className="p-2">Weight</th>
                            <th className="p-2">Recorded By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-mono">
                          {vitalsList.map((v: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 text-slate-500">{new Date(v.recorded_at || Date.now()).toLocaleString()}</td>
                              <td className="p-2 font-bold">{v.blood_pressure || '120/80'}</td>
                              <td className="p-2 font-bold text-amber-600">{v.temperature}°C</td>
                              <td className="p-2 font-bold text-rose-600">{v.pulse_rate} bpm</td>
                              <td className="p-2 font-bold">{v.weight} kg</td>
                              <td className="p-2 text-slate-400">{v.recorded_by || 'Nurse'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Consultations & Encounters */}
            {activeTab === 'clinical' && (
              <div className="space-y-4">
                {encounters.length === 0 && consultations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-bold bg-white rounded-2xl border border-dashed border-slate-200">
                    No clinical consultations or physician encounter notes recorded yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {consultations.map((c: any, idx: number) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-[#2A758C]" />
                            <span>Dr. {c.doctor_name || 'Attending Physician'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <div className="text-xs space-y-1">
                          <p className="text-slate-700"><strong>Chief Complaint:</strong> {c.chief_complaint || c.symptoms || 'General Checkup'}</p>
                          <p className="text-slate-700"><strong>Clinical Notes:</strong> {c.clinical_notes || c.treatment_plan || c.notes || 'Patient evaluated and stable.'}</p>
                          <p className="text-[#2A758C] font-bold"><strong>Diagnosis:</strong> {c.diagnosis || 'Routine Outpatient Consultation'}</p>
                          {c.prescriptions && (
                            <p className="text-slate-600 text-[11px] font-mono"><strong>Prescriptions:</strong> {typeof c.prescriptions === 'string' ? c.prescriptions : JSON.stringify(c.prescriptions)}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {encounters.map((e: any, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-1 text-xs">
                        <div className="flex justify-between items-center text-slate-500 font-mono text-[10px]">
                          <span>Visit Reason: {e.visit_reason || 'OPD Intake'}</span>
                          <span>{new Date(e.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="font-bold text-slate-800">Destination Clinic: {e.destination_clinic || 'GOPD'}</p>
                        <p className="text-slate-500 text-[11px]">Priority: {e.priority || 'Standard'} • Status: {e.clinical_status || e.status}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: Lab & Pharmacy */}
            {activeTab === 'pharmacy_lab' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Laboratory Tests */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                    <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <FlaskConical className="h-4 w-4 text-[#2A758C]" /> Laboratory Investigations ({labOrders.length})
                    </h3>
                    {labOrders.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No lab tests requested yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {labOrders.map((lab: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{lab.test_name || lab.testName || 'Lab Investigation'}</span>
                              <span className="font-mono text-[#2A758C]">{lab.cost ? `₦${parseFloat(lab.cost).toLocaleString()}` : ''}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Status: <span className="font-bold">{lab.status || 'Pending'}</span> 
                              {lab.findings && <span> • Findings: <strong className="text-slate-800">{lab.findings}</strong></span>}
                              {lab.result_details && <span> • Value: <strong className="text-slate-800 font-mono">{lab.result_details}</strong></span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pharmacy Prescriptions */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                    <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Pill className="h-4 w-4 text-[#2A758C]" /> Pharmacy Prescriptions ({pharmacyOrders.length})
                    </h3>
                    {pharmacyOrders.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No pharmacy prescriptions ordered yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {pharmacyOrders.map((rx: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                            <div className="flex justify-between font-bold text-slate-800">
                              <span>{rx.medication_name || rx.drugName || 'Medication'}</span>
                              <span className="font-mono text-emerald-600">₦{parseFloat(rx.cost || 0).toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">Dosage: {rx.dosage || 'As prescribed'} • Status: {rx.status || 'Dispensed'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: Billing & Ledger */}
            {activeTab === 'billing' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                  <h3 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <CreditCard className="h-4 w-4 text-[#2A758C]" /> Financial Summary & Ledger
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">CARD REGISTRATION FEE</span>
                      <span className="text-base font-black text-slate-800">₦{cardFee.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">TOTAL INVOICED BILLS</span>
                      <span className="text-base font-black text-slate-800">₦{(invoices.reduce((a: number, b: any) => a + parseFloat(b.amount || 0), cardFee)).toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">OUTSTANDING DEBT</span>
                      <span className={`text-base font-black ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>₦{balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {invoices.length > 0 && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs space-y-3">
                    <h4 className="text-xs font-extrabold uppercase font-mono tracking-wider text-slate-500">Invoices & Service Charges</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase font-mono">
                            <th className="p-2">Purpose</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Payment Status</th>
                            <th className="p-2">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-mono">
                          {invoices.map((inv: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2 font-bold text-slate-800">{inv.description || inv.purpose || 'Hospital Service'}</td>
                              <td className="p-2 font-black">₦{parseFloat(inv.amount || 0).toLocaleString()}</td>
                              <td className="p-2">
                                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {inv.status || 'Paid'}
                                </span>
                              </td>
                              <td className="p-2 text-slate-400">{new Date(inv.created_at || Date.now()).toLocaleDateString()}</td>
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

          {/* Modal Footer Actions */}
          <div className="bg-white p-4 px-6 border-t border-slate-100 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPrinting}
                onClick={handlePrintEMRSummary}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                <span>Print EMR Summary</span>
              </button>

              <ExportButton
                exportType="medical-records"
                patientId={patData.hospital_number || patData.id || patData.hospitalNumber}
                label="Export HMS (PDF/Word/Excel)"
                className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-extrabold shadow-none"
              />
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#2A758C] hover:bg-[#205b6d] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-[#2A758C]/20 cursor-pointer"
            >
              Close Patient Record
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
