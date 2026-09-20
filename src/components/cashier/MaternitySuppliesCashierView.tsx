import React, { useState } from 'react';
import { 
  Baby, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Receipt, 
  Printer, 
  X, 
  ArrowUpRight, 
  DollarSign, 
  RefreshCw, 
  User, 
  BedDouble, 
  AlertCircle,
  PackageCheck,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

export interface MaternityHandoverRecord {
  id: string;
  admission_id: string;
  patient_id?: string;
  patient_name: string;
  hospital_number?: string;
  ward: string;
  bed?: string;
  total_amount: number;
  items_billed_count?: number;
  items?: Array<{
    id: string;
    section: 'mother_baby' | 'delivery';
    name: string;
    status: 'brought' | 'missing';
    amount: number;
    price?: number;
    default_price?: number;
  }>;
  checklist?: Record<string, { status: 'brought' | 'missing'; amount: number }>;
  nurse_name: string;
  handed_over_at: string;
  status: 'Pending Handover' | 'Balanced & Received';
  balanced_by?: string;
  balanced_at?: string;
  created_at: string;
}

interface MaternitySuppliesCashierViewProps {
  records: MaternityHandoverRecord[];
  isLoading: boolean;
  onRefresh: () => void;
  onBalanceSuccess?: () => void;
}

export default function MaternitySuppliesCashierView({
  records,
  isLoading,
  onRefresh,
  onBalanceSuccess
}: MaternitySuppliesCashierViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending Handover' | 'Balanced & Received'>('ALL');
  const [selectedRecordForReceipt, setSelectedRecordForReceipt] = useState<MaternityHandoverRecord | null>(null);
  const [isBalancingId, setIsBalancingId] = useState<string | null>(null);
  const [balanceModalRecord, setBalanceModalRecord] = useState<MaternityHandoverRecord | null>(null);
  const [cashierNotes, setCashierNotes] = useState('');

  // Calculations
  const pendingRecords = records.filter(r => r.status === 'Pending Handover');
  const balancedRecords = records.filter(r => r.status === 'Balanced & Received');

  const totalPendingAmount = pendingRecords.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
  const totalBalancedAmount = balancedRecords.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
  const grandTotalAmount = records.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

  // Filtered list
  const filteredRecords = records.filter(record => {
    const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      !query ||
      (record.patient_name || '').toLowerCase().includes(query) ||
      (record.hospital_number || '').toLowerCase().includes(query) ||
      (record.nurse_name || '').toLowerCase().includes(query) ||
      (record.ward || '').toLowerCase().includes(query) ||
      (record.items || []).some(item => item.name.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  // Handle balance cash handover
  const handleConfirmBalance = async () => {
    if (!balanceModalRecord) return;

    try {
      setIsBalancingId(balanceModalRecord.id);
      const userRaw = localStorage.getItem('zmc_user');
      const currentUser = userRaw ? JSON.parse(userRaw) : null;
      const cashierName = currentUser?.name || currentUser?.username || 'Cashier Staff';

      const res = await apiFetch(`/nursing/maternity-supplies/${balanceModalRecord.id}/balance`, {
        method: 'POST',
        body: JSON.stringify({
          cashier_name: cashierName,
          notes: cashierNotes
        })
      });

      if (res && res.success) {
        setBalanceModalRecord(null);
        setCashierNotes('');
        onRefresh();
        if (onBalanceSuccess) onBalanceSuccess();
      } else {
        alert(res?.error || 'Failed to balance cash handover.');
      }
    } catch (err: any) {
      alert('Error balancing cash handover: ' + err.message);
    } finally {
      setIsBalancingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 rounded-3xl p-6 border border-pink-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20 shrink-0">
              <Baby className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                  Maternity Ward Supplies & Cash Handover Desk
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-100 text-pink-800 border border-pink-200">
                  Ward Inventory
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                When maternity patients do not bring their required delivery and baby supplies, ward nurses collect cash at the bedside. Use this desk to receive the cash handovers, balance the hospital supplies inventory, and issue official receipts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#2A758C] ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Census</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-pink-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Cash Handover
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                {pendingRecords.length} Pending
              </span>
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2 font-mono">
              ₦{totalPendingAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Physical cash collected at Maternity Ward awaiting handover
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-pink-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Balanced & Reconciled
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-200">
                {balancedRecords.length} Reconciled
              </span>
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2 font-mono">
              ₦{totalBalancedAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cash received and inventory balanced in hospital treasury
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-pink-100 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Supplies Billed
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-pink-100 text-pink-900 border border-pink-200">
                {records.length} Admissions
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
              ₦{grandTotalAmount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Cumulative ward delivery items & consumables billed
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, ID, nurse, ward, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'Pending Handover', label: `Pending (${pendingRecords.length})` },
            { id: 'Balanced & Received', label: `Balanced (${balancedRecords.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#E11D48] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Records Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-pink-600" />
            <span>Loading maternity supplies records...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-20 text-center p-8">
            <Baby className="h-10 w-10 mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-800">No maternity supply handovers found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When nurses record missing supplies and cash in the Maternity Checklist tab, the handovers will populate here automatically.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((record) => {
              const isPending = record.status === 'Pending Handover';
              const itemsList = record.items || [];
              const missingItems = itemsList.filter(i => i.status === 'missing');

              return (
                <div 
                  key={record.id}
                  id={`maternity-handover-card-${record.id}`}
                  className="p-5 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Patient & Nurse Information */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                          <User className="h-4 w-4 text-pink-600" />
                          <span>{record.patient_name}</span>
                        </h4>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#2A758C]/10 text-[#2A758C]">
                          {record.hospital_number || record.admission_id}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                          {record.ward} {record.bed ? `• ${record.bed}` : ''}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isPending 
                            ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}>
                          {record.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span>
                          <span className="font-semibold text-slate-700">Handover Nurse:</span> {record.nurse_name}
                        </span>
                        <span>•</span>
                        <span>
                          <span className="font-semibold text-slate-700">Handover Time:</span> {record.handed_over_at}
                        </span>
                        {record.balanced_by && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">
                              Balanced by: {record.balanced_by} ({record.balanced_at})
                            </span>
                          </>
                        )}
                      </div>

                      {/* Items Billed Breakdown Pills */}
                      <div className="pt-2">
                        <p className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                          <PackageCheck className="h-3.5 w-3.5 text-pink-600" />
                          <span>Billed Supplies & Consumables ({missingItems.length} items):</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 max-w-2xl">
                          {missingItems.length > 0 ? (
                            missingItems.map((item, idx) => (
                              <span 
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50 text-slate-800 border border-pink-200 text-[11px] font-medium"
                              >
                                <span className="truncate max-w-[240px]">{item.name}</span>
                                <span className="font-black font-mono text-pink-700 bg-white px-1.5 py-0.2 rounded border border-pink-100">
                                  ₦{(Number(item.amount) || Number(item.price) || 0).toLocaleString()}
                                </span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No missing items billed.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount & Actions Column */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                      <div className="lg:text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Total Cash Handover
                        </span>
                        <span className="text-2xl font-black text-[#E11D48] font-mono">
                          ₦{(Number(record.total_amount) || 0).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 block">
                          Physical Cash at Desk
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending ? (
                          <button
                            id={`balance-btn-${record.id}`}
                            onClick={() => setBalanceModalRecord(record)}
                            disabled={isBalancingId === record.id}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                          >
                            <DollarSign className="h-4 w-4" />
                            <span>Balance & Receive Cash</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Balanced in Treasury</span>
                          </span>
                        )}

                        <button
                          onClick={() => setSelectedRecordForReceipt(record)}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Receipt className="h-3.5 w-3.5 text-slate-600" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BALANCE CASH CONFIRMATION MODAL                                           */}
      {/* ========================================================================= */}
      {balanceModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Receive Cash Handover & Balance Inventory
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Reconcile Maternity Ward cash handover with physical cash
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBalanceModalRecord(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-900">{balanceModalRecord.patient_name} ({balanceModalRecord.hospital_number || balanceModalRecord.admission_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ward & Bed:</span>
                <span className="font-bold text-slate-800">{balanceModalRecord.ward} • {balanceModalRecord.bed || 'Bed M-3'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Handover Nurse:</span>
                <span className="font-bold text-slate-800">{balanceModalRecord.nurse_name}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-700 font-bold">Physical Cash Amount:</span>
                <span className="font-black text-emerald-600 text-sm font-mono">
                  ₦{(Number(balanceModalRecord.total_amount) || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Cashier Reconciliation Notes (Optional)
              </label>
              <textarea
                value={cashierNotes}
                onChange={(e) => setCashierNotes(e.target.value)}
                placeholder="e.g. Physical cash counted and verified. Ward delivery inventory updated."
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                By clicking <strong>Confirm & Balance Cash</strong>, you certify that the nurse has physically handed over ₦{(Number(balanceModalRecord.total_amount) || 0).toLocaleString()} in cash to the cashier desk and that the Maternity inventory ledger is balanced.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBalanceModalRecord(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBalance}
                disabled={isBalancingId === balanceModalRecord.id}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                {isBalancingId === balanceModalRecord.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Balancing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Balance Cash</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RECEIPT VIEW & PRINT MODAL                                                */}
      {/* ========================================================================= */}
      {selectedRecordForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-pink-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Maternity Ward Supplies Official Receipt
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordForReceipt(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Printable Receipt Paper Container */}
            <div 
              id="maternity-receipt-print-area"
              className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-5 text-slate-900 space-y-4"
            >
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-3">
                <h2 className="text-base font-black tracking-tight text-slate-900">
                  ZIKOBYTE MEDICAL CENTRE
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                  Maternity & Delivery Ward Cash Reconciled Receipt
                </p>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Receipt Ref: MAT-REC-{selectedRecordForReceipt.id.slice(-6).toUpperCase()}
                </div>
              </div>

              {/* Patient & Admission Info */}
              <div className="grid grid-cols-2 gap-2 text-xs border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Patient Name:</span>
                  <span className="font-black text-slate-900">{selectedRecordForReceipt.patient_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Hospital ID:</span>
                  <span className="font-bold text-[#2A758C] font-mono">{selectedRecordForReceipt.hospital_number || selectedRecordForReceipt.admission_id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Ward & Bed:</span>
                  <span className="font-semibold text-slate-700">{selectedRecordForReceipt.ward} • {selectedRecordForReceipt.bed || 'Bed M-3'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Handover Date:</span>
                  <span className="font-semibold text-slate-700">{selectedRecordForReceipt.handed_over_at}</span>
                </div>
              </div>

              {/* Supplies Itemized Table */}
              <div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-1.5">Billed Supply Item</th>
                      <th className="py-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedRecordForReceipt.items || [])
                      .filter(i => i.status === 'missing')
                      .map((item, idx) => (
                        <tr key={idx} className="text-[11px]">
                          <td className="py-1.5 font-medium text-slate-800 pr-2">{item.name}</td>
                          <td className="py-1.5 text-right font-mono font-bold text-slate-900">
                            ₦{(Number(item.amount) || Number(item.price) || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-900 font-black text-sm">
                      <td className="pt-2 text-slate-900">TOTAL CASH COLLECTED:</td>
                      <td className="pt-2 text-right text-[#E11D48] font-mono">
                        ₦{(Number(selectedRecordForReceipt.total_amount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Reconciliation Status */}
              <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Handed Over By Nurse:</span>
                  <span className="font-bold text-slate-900">{selectedRecordForReceipt.nurse_name}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Treasury Reconciliation:</span>
                  <span className="font-bold text-emerald-700">
                    {selectedRecordForReceipt.status === 'Balanced & Received'
                      ? `Reconciled by ${selectedRecordForReceipt.balanced_by || 'Cashier'}`
                      : 'Pending Physical Handover'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedRecordForReceipt(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#2A758C] hover:bg-[#236376] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
