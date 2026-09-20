import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { AlertTriangle, X, CheckCircle2, DollarSign, Clock, ShieldAlert, Loader2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PendingBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  userRole?: string;
  onCleared?: () => void;
}

export default function PendingBalanceModal({
  isOpen,
  onClose,
  patientId,
  patientName,
  hospitalNumber,
  userRole = '',
  onCleared
}: PendingBalanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [outstandingRecords, setOutstandingRecords] = useState<any[]>([]);
  const [totalOwing, setTotalOwing] = useState<number>(0);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientBalances();
    }
  }, [isOpen, patientId]);

  const fetchPatientBalances = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await apiFetch(`/payments/outstanding/patient/${patientId}`);
      if (res.success) {
        setOutstandingRecords(res.data || []);
        setTotalOwing(res.totalOwing || 0);
      }
    } catch (err: any) {
      console.error('Error fetching patient outstanding balance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (recordId: string) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await apiFetch('/payments/outstanding/settle', {
        method: 'POST',
        body: JSON.stringify({
          id: recordId,
          patientId,
          paymentAmount: parseFloat(paymentAmount),
          paymentMethod
        })
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message || 'Payment applied successfully!' });
        setSettlingId(null);
        setPaymentAmount('');
        fetchPatientBalances();
        if (onCleared) onCleared();
      } else {
        setFeedback({ type: 'error', message: res.error || 'Failed to settle balance' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Server error settling balance' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isCashierUser = ['Cashier', 'Administrator', 'Management'].includes(userRole);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden"
        >
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 p-5 text-white flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl">
                <AlertTriangle className="h-6 w-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white tracking-tight">Pending Balance Alert</h3>
                <p className="text-xs text-amber-100 font-medium">
                  Patient record retains unverified / outstanding payment
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl transition-colors cursor-pointer text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Patient Overview Strip */}
          <div className="bg-amber-50/80 border-b border-amber-200/60 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-900">{patientName}</p>
              <p className="text-[11px] font-mono text-amber-700">Hospital ID: {hospitalNumber}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 font-mono block">
                Total Debt
              </span>
              <span className="text-lg font-black text-rose-600 font-mono">
                ₦{totalOwing.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {feedback && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}

            {loading ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-amber-500" />
                <p className="text-xs font-semibold">Retrieving outstanding ledger records...</p>
              </div>
            ) : outstandingRecords.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-extrabold text-slate-800 text-sm">No Active Outstanding Debts!</h4>
                <p className="text-xs text-slate-500 mt-1">This patient does not owe any pending balances.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  Outstanding Payment Items ({outstandingRecords.length})
                </p>

                {outstandingRecords.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 hover:border-amber-300 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-extrabold text-slate-900 text-xs">{item.purpose || 'Hospital Services'}</h5>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Incurred: {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] font-black rounded-full uppercase tracking-wider font-mono border border-rose-200">
                        Owing
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-100 text-center font-mono">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Total Bill</p>
                        <p className="text-xs font-black text-slate-800">₦{parseFloat(item.total_bill).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Paid So Far</p>
                        <p className="text-xs font-black text-emerald-600">₦{parseFloat(item.amount_paid).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Balance</p>
                        <p className="text-xs font-black text-rose-600">₦{parseFloat(item.balance).toLocaleString()}</p>
                      </div>
                    </div>

                    {isCashierUser ? (
                      <div>
                        {settlingId === item.id ? (
                          <div className="mt-2 bg-white p-3 rounded-xl border border-amber-300 space-y-2">
                            <p className="text-[11px] font-extrabold text-amber-900">Process Balance Settlement</p>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder={`Max ₦${parseFloat(item.balance)}`}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                              />
                              <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                              >
                                <option value="Cash">Cash</option>
                                <option value="POS">POS</option>
                                <option value="Transfer">Transfer</option>
                              </select>
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                              <button
                                onClick={() => setSettlingId(null)}
                                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 font-bold"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSettle(item.id)}
                                disabled={isSubmitting}
                                className="px-4 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                              >
                                {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                                Confirm Payment
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSettlingId(item.id);
                              setPaymentAmount(item.balance.toString());
                            }}
                            className="w-full mt-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Settle / Clear Balance
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-100 rounded-xl text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Only Cashier can receive and clear pending balance payments.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
            >
              Close Alert
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
