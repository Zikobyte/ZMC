import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Patient } from '../types';
import { 
  Search, 
  UserCheck, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Activity, 
  Calendar, 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  ShieldAlert,
  CreditCard,
  User,
  History
} from 'lucide-react';
import PendingBalanceModal from './PendingBalanceModal';

interface ReturningPatientViewProps {
  userRole?: string;
  onReQueueSuccess?: () => void;
}

export default function ReturningPatientView({ userRole = 'Receptionist', onReQueueSuccess }: ReturningPatientViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [history, setHistory] = useState<any | null>(null);
  
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isReQueueing, setIsReQueueing] = useState(false);

  const [destinationClinic, setDestinationClinic] = useState('GOPD Room 1');
  const [visitReason, setVisitReason] = useState('Follow-up / Returning Visit');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pending balance modal state
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoadingSearch(true);
    setFeedback(null);
    setSelectedPatient(null);
    setHistory(null);

    try {
      const res = await apiFetch(`/patients/search/returning?query=${encodeURIComponent(searchQuery.trim())}`);
      if (res.success) {
        setSearchResults(res.data || []);
        if (res.data.length === 0) {
          setFeedback({ type: 'error', message: 'No returning patient record found with that name, ID, or phone number.' });
        }
      } else {
        setFeedback({ type: 'error', message: res.error || 'Search failed' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error executing search' });
    } finally {
      setIsLoadingSearch(false);
    }
  };

  const handleSelectPatient = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsLoadingHistory(true);
    setFeedback(null);

    try {
      const res = await apiFetch(`/patients/${patient.id}/history`);
      if (res.success) {
        setHistory(res.data);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to load patient history' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error loading clinical history' });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleReQueue = async () => {
    if (!selectedPatient) return;
    setIsReQueueing(true);
    setFeedback(null);

    try {
      const res = await apiFetch(`/patients/${selectedPatient.id}/re-queue`, {
        method: 'POST',
        body: JSON.stringify({
          visitReason,
          destinationClinic
        })
      });

      if (res.success) {
        setFeedback({ 
          type: 'success', 
          message: `Patient ${selectedPatient.name} (${selectedPatient.hospitalNumber}) successfully re-queued to ${destinationClinic}!` 
        });
        if (onReQueueSuccess) onReQueueSuccess();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to re-queue patient' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error re-queueing patient' });
    } finally {
      setIsReQueueing(false);
    }
  };

  const totalOwing = selectedPatient 
    ? parseFloat((selectedPatient.outstandingBalance || selectedPatient.outstanding_balance || 0).toString()) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-[#2A758C]" /> Returning Patient Directory & History
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search returning medical records, review outstanding balances, view past clinical history, and re-queue for doctors.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search returning patient by Name, Hospital ID (e.g. ZMC-2026-001), or Phone Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2A758C]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoadingSearch}
          className="px-6 py-3 bg-[#2A758C] hover:bg-[#1f5768] text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-xs shrink-0"
        >
          {isLoadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search Record
        </button>
      </form>

      {/* Feedback Messages */}
      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Search Results List */}
      {searchResults.length > 0 && !selectedPatient && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-mono">
            Search Results ({searchResults.length} Match{searchResults.length > 1 ? 'es' : ''})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((pat) => {
              const debt = parseFloat((pat.outstandingBalance || pat.outstanding_balance || 0).toString());
              return (
                <div
                  key={pat.id}
                  onClick={() => handleSelectPatient(pat)}
                  className="bg-slate-50 hover:bg-slate-100/80 p-4 rounded-2xl border border-slate-200/80 transition-all cursor-pointer space-y-3 group hover:border-[#2A758C]"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#2A758C] bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">
                        {pat.hospitalNumber}
                      </span>
                      <h4 className="font-extrabold text-slate-900 text-sm mt-1 group-hover:text-[#2A758C]">
                        {pat.name}
                      </h4>
                    </div>
                    {debt > 0 ? (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-600 animate-pulse" />
                        ₦{debt.toLocaleString()}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                        Clear
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 font-medium">
                    <p>Gender: {pat.gender} • Category: {pat.cardType}</p>
                    <p>Phone: {pat.phoneNumber || 'N/A'}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex justify-end text-xs font-extrabold text-[#2A758C] items-center gap-1">
                    <span>View History & Re-Queue</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Returning Patient History Dashboard */}
      {selectedPatient && (
        <div className="space-y-6">
          {/* Patient Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-lg space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                  <User className="h-8 w-8 text-[#A3D1E0]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-[#A3D1E0]/20 text-[#A3D1E0] text-xs font-mono font-bold rounded-md">
                      {selectedPatient.hospitalNumber}
                    </span>
                    <span className="px-2.5 py-0.5 bg-white/10 text-slate-300 text-xs font-bold rounded-md">
                      {selectedPatient.cardType}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">{selectedPatient.name}</h3>
                  <p className="text-xs text-slate-300">
                    Gender: {selectedPatient.gender} • Phone: {selectedPatient.phoneNumber || 'N/A'} • Address: {selectedPatient.address || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Outstanding Balance Alert Button */}
              <div className="self-stretch md:self-auto">
                {totalOwing > 0 ? (
                  <button
                    onClick={() => setIsBalanceModalOpen(true)}
                    className="w-full md:w-auto px-5 py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer animate-bounce"
                    style={{ animationDuration: '3s' }}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>Pending Balance Alert: ₦{totalOwing.toLocaleString()}</span>
                  </button>
                ) : (
                  <div className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>No Pending Balance</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setHistory(null);
                }}
                className="text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ← Back to search results
              </button>
              <span className="text-slate-400 font-mono">
                Reg Date: {new Date(selectedPatient.registrationDate || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Re-Queue Action Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#2A758C]" /> Re-Queue Returning Patient for Consultation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Clinic / Doctor Room *</label>
                <select
                  value={destinationClinic}
                  onChange={(e) => setDestinationClinic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2A758C]"
                >
                  <option value="GOPD Room 1">General OPD Room 1 (Dr. Okonkwo)</option>
                  <option value="GOPD Room 2">General OPD Room 2 (Dr. Alan Smith)</option>
                  <option value="Antenatal Clinic">Antenatal / Obstetric Clinic</option>
                  <option value="Pediatrics Clinic">Pediatrics Room</option>
                  <option value="Emergency Room">Emergency Trauma Unit</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reason for Visit *</label>
                <input
                  type="text"
                  placeholder="e.g. Doctor Follow-up, Medication refill, Lab review"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2A758C]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleReQueue}
                disabled={isReQueueing}
                className="px-6 py-3 bg-[#2A758C] hover:bg-[#1e5768] text-white font-extrabold text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-2 shadow-xs"
              >
                {isReQueueing && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm & Re-Queue Patient
              </button>
            </div>
          </div>

          {/* Clinical History Section */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-6">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-[#2A758C]" /> Complete Clinical History & Invoices
            </h3>

            {isLoadingHistory ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2A758C]" />
                <p className="text-xs font-bold">Retrieving patient medical history records...</p>
              </div>
            ) : !history ? (
              <p className="text-xs text-slate-400">Select a patient to view history.</p>
            ) : (
              <div className="space-y-6">
                {/* Outstanding Balance Ledger */}
                {history.outstanding && history.outstanding.length > 0 && (
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-3">
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-600" /> Outstanding Balances Ledger
                    </h4>
                    <div className="space-y-2">
                      {history.outstanding.map((debt: any) => (
                        <div key={debt.id} className="bg-white p-3 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="font-extrabold text-slate-900">{debt.purpose}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Date: {new Date(debt.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-rose-600 font-extrabold">Bal: ₦{parseFloat(debt.balance).toLocaleString()}</span>
                            <span className="text-slate-400 text-[10px] block">Total Bill: ₦{parseFloat(debt.total_bill).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Encounters History */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Past Encounters ({history.encounters?.length || 0})
                  </h4>
                  {history.encounters && history.encounters.length > 0 ? (
                    <div className="space-y-2">
                      {history.encounters.map((enc: any) => (
                        <div key={enc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-800">{enc.visit_type || 'General Consultation'} - {enc.destination_clinic}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Priority: {enc.priority} • Status: {enc.status}</p>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(enc.created_at).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No past encounters logged.</p>
                  )}
                </div>

                {/* Past Invoices & Billings */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                    Past Invoices & Payments ({history.invoices?.length || 0})
                  </h4>
                  {history.invoices && history.invoices.length > 0 ? (
                    <div className="space-y-2">
                      {history.invoices.map((inv: any) => (
                        <div key={inv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-800">Invoice #{inv.invoice_number || inv.id.substring(0, 8)}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Total: ₦{parseFloat(inv.total_amount || 0).toLocaleString()} • Paid: ₦{parseFloat(inv.amount_paid || 0).toLocaleString()}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.payment_status || 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No invoice history available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Balance Modal */}
      {selectedPatient && (
        <PendingBalanceModal
          isOpen={isBalanceModalOpen}
          onClose={() => setIsBalanceModalOpen(false)}
          patientId={selectedPatient.id}
          patientName={selectedPatient.name}
          hospitalNumber={selectedPatient.hospitalNumber}
          userRole={userRole}
          onCleared={() => {
            // refresh history
            handleSelectPatient(selectedPatient);
          }}
        />
      )}
    </div>
  );
}
