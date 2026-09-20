import React, { useState, useEffect } from 'react';
import { 
  Baby, 
  Check, 
  X, 
  Send, 
  AlertTriangle, 
  Receipt, 
  CheckCircle2, 
  Package, 
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Heart
} from 'lucide-react';
import { apiFetch } from '../../utils/api';

export interface ChecklistItem {
  id: string;
  category: 'mother_baby' | 'delivery';
  number: number;
  label: string;
  status: 'brought' | 'missing';
  amount: number;
}

interface MaternityChecklistViewProps {
  patient: {
    id: string;
    patient_id?: string;
    hospital_number?: string;
    name: string;
    ward?: string;
    bed?: string;
  };
  onBillingUpdated?: () => void;
}

export const DEFAULT_DELIVERY_ITEMS = [
  '4 Packets of sanitary pads (Lady sept.)',
  'Two toilet rolls',
  '1 packet of Omo 1kg',
  'Olive Oil – 1 Rubber',
  'Methylated spirit (Mother care)',
  'Viva soap ×3',
  'Dettol or Purit (Medium)',
  '1 (One) Big Hypo',
  '2 Delivery pack',
  'Gloves (1 pkt)',
  'Mucus Extractor',
];

export default function MaternityChecklistView({ patient, onBillingUpdated }: MaternityChecklistViewProps) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Initialize or fetch saved checklist for this patient
  const loadChecklist = async () => {
    try {
      setIsLoading(true);
      const res = await apiFetch(`/nursing/admissions/${patient.id}/maternity-checklist`);
      if (res && res.success && res.data && res.data.length > 0) {
        setItems(res.data);
      } else {
        // Build initial items: Mother & Baby starts empty (custom items), Delivery has 11 default items
        const initialDeliveryList: ChecklistItem[] = DEFAULT_DELIVERY_ITEMS.map((label, idx) => ({
          id: `del-${idx + 1}`,
          category: 'delivery' as const,
          number: idx + 1,
          label,
          status: 'missing' as const,
          amount: 0
        }));
        setItems(initialDeliveryList);
      }
    } catch (err) {
      console.error('Failed to load maternity checklist:', err);
      const initialDeliveryList: ChecklistItem[] = DEFAULT_DELIVERY_ITEMS.map((label, idx) => ({
        id: `del-${idx + 1}`,
        category: 'delivery' as const,
        number: idx + 1,
        label,
        status: 'missing' as const,
        amount: 0
      }));
      setItems(initialDeliveryList);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (patient?.id) {
      loadChecklist();
      setSubmitSuccess(null);
    }
  }, [patient?.id]);

  // Mother & Baby: Add dynamic item
  const handleAddMotherBabyItem = () => {
    const currentMotherBaby = items.filter(i => i.category === 'mother_baby');
    const newItem: ChecklistItem = {
      id: `mb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: 'mother_baby',
      number: currentMotherBaby.length + 1,
      label: '',
      status: 'missing',
      amount: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  // Mother & Baby: Update label / item name
  const handleUpdateMotherBabyLabel = (id: string, label: string) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, label } : item)));
  };

  // Mother & Baby: Update amount
  const handleUpdateMotherBabyAmount = (id: string, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
    setItems(prev => prev.map(item => (item.id === id ? { ...item, amount: num } : item)));
  };

  // Mother & Baby: Remove / cancel item by X button & renumber
  const handleRemoveMotherBabyItem = (idToRemove: string) => {
    setItems(prev => {
      const remaining = prev.filter(item => item.id !== idToRemove);
      let mbCount = 1;
      return remaining.map(item => {
        if (item.category === 'mother_baby') {
          const updated = { ...item, number: mbCount };
          mbCount++;
          return updated;
        }
        return item;
      });
    });
  };

  // Delivery: Mark Brought
  const handleMarkBrought = (id: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, status: 'brought', amount: 0 };
        }
        return item;
      })
    );
  };

  // Delivery: Mark Missing
  const handleMarkMissing = (id: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, status: 'missing' };
        }
        return item;
      })
    );
  };

  // Delivery: Amount change
  const handleAmountChange = (id: string, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const num = cleaned === '' ? 0 : parseInt(cleaned, 10);
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, amount: num };
        }
        return item;
      })
    );
  };

  // Segregated items
  const motherBabyItems = items.filter(i => i.category === 'mother_baby');
  const deliveryItems = items.filter(i => i.category === 'delivery');

  // Calculated Metrics (matching screenshot)
  const broughtCount = deliveryItems.filter(i => i.status === 'brought').length;
  const missingCount = deliveryItems.filter(i => i.status === 'missing').length;

  const billedMotherBabyItems = motherBabyItems
    .filter(i => i.amount > 0)
    .map(i => ({
      id: i.id,
      label: i.label.trim() ? i.label.trim() : `Item #${i.number}`,
      amount: i.amount
    }));

  const billedDeliveryItems = deliveryItems
    .filter(i => i.status === 'missing' && i.amount > 0)
    .map(i => ({
      id: i.id,
      label: i.label,
      amount: i.amount
    }));

  const billedItems = [...billedMotherBabyItems, ...billedDeliveryItems];
  const totalToBill = billedItems.reduce((sum, i) => sum + i.amount, 0);

  // Submit Bill to Cashier
  const handleSubmitBill = async () => {
    try {
      setIsSubmitting(true);
      const res = await apiFetch(`/nursing/admissions/${patient.id}/maternity-checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          billedItems: billedItems.map(i => ({ label: i.label, amount: i.amount })),
          totalAmount: totalToBill
        })
      });

      if (res && res.success) {
        setSubmitSuccess(
          `Maternity Checklist saved! ₦${totalToBill.toLocaleString()} supply bill submitted to Cashier portal for cash handover and inventory balancing.`
        );
        if (onBillingUpdated) {
          onBillingUpdated();
        }
      } else {
        alert(res?.error || 'Failed to submit bill to cashier');
      }
    } catch (err: any) {
      console.error('Error submitting maternity bill:', err);
      alert(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
        <RefreshCw className="h-6 w-6 animate-spin text-pink-600" />
        <span>Loading Maternity Admission Checklist...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* 1. Header Card with Summary Counters (Exact Screenshot Match)       */}
      {/* ------------------------------------------------------------------ */}
      <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 shrink-0 mt-0.5">
              <Baby className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-pink-950 tracking-tight">
                Maternity Admission Checklist
              </h3>
              <p className="text-xs text-pink-700/90 font-medium mt-0.5">
                Mark each item as Brought or Not Brought. For missing items, enter the supply charge to bill the patient.
              </p>
            </div>
          </div>
        </div>

        {/* Top Right Counters (0 Brought | 11 Missing | ₦0 To Bill) */}
        <div className="flex items-center gap-6 self-end sm:self-center pr-2">
          <div className="text-center">
            <div className="text-lg font-black text-emerald-600 leading-tight">{broughtCount}</div>
            <div className="text-xs font-semibold text-slate-500">Brought</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-black text-rose-600 leading-tight">{missingCount}</div>
            <div className="text-xs font-semibold text-slate-500">Missing</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-black text-[#BE185D] leading-tight">₦{totalToBill.toLocaleString()}</div>
            <div className="text-xs font-semibold text-slate-500">To Bill</div>
          </div>
        </div>
      </div>

      {submitSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">{submitSuccess}</p>
            <p className="text-[11px] text-emerald-700 mt-0.5">
              The Cashier can now review this patient's supplied inventory and reconcile the cash handover in the Cashier Portal.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* 2. SECTION 1: FOR MOTHER & BABY (Dynamic Add Item + Amount + X)    */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-pink-200 overflow-hidden shadow-xs bg-white">
        {/* Banner Header */}
        <div className="bg-[#E11D48] text-white px-4 py-2.5 flex items-center gap-2 font-black text-xs uppercase tracking-wider">
          <Baby className="h-4 w-4 text-white" />
          <span>FOR MOTHER & BABY</span>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-3">
          {motherBabyItems.length === 0 ? (
            <p className="text-xs text-slate-500 italic">
              No items added yet. Use the fields below to enter items and amounts, or skip to FOR DELIVERY.
            </p>
          ) : (
            <div className="space-y-2.5">
              {motherBabyItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  {/* Number Badge / Box */}
                  <div className="w-8 h-9 shrink-0 flex items-center justify-center border border-slate-300 rounded-lg text-xs font-bold text-slate-600 bg-slate-50">
                    {item.number}.
                  </div>

                  {/* Item Name Input */}
                  <input
                    type="text"
                    placeholder="Item name"
                    value={item.label}
                    onChange={(e) => handleUpdateMotherBabyLabel(item.id, e.target.value)}
                    className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  />

                  {/* Currency + Amount Input */}
                  <div className="relative w-28 sm:w-32 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₦
                    </span>
                    <input
                      type="text"
                      placeholder="Amount"
                      value={item.amount > 0 ? item.amount : ''}
                      onChange={(e) => handleUpdateMotherBabyAmount(item.id, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2.5 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>

                  {/* Cancel / Remove Button (X) */}
                  <button
                    type="button"
                    onClick={() => handleRemoveMotherBabyItem(item.id)}
                    title="Cancel item"
                    className="w-9 h-9 shrink-0 flex items-center justify-center border border-slate-300 rounded-lg text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* + Add item Button */}
          <div>
            <button
              type="button"
              onClick={handleAddMotherBabyItem}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-pink-500 text-pink-600 hover:bg-pink-50 text-xs font-bold transition-colors cursor-pointer"
            >
              <span className="text-sm leading-none">+</span>
              <span>Add item</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 3. SECTION 2: FOR DELIVERY (11 Fixed Delivery Items)               */}
      {/* ------------------------------------------------------------------ */}
      <div className="rounded-2xl border border-pink-200 overflow-hidden shadow-xs bg-white">
        {/* Banner Header */}
        <div className="bg-[#E11D48] text-white px-4 py-2.5 flex items-center gap-2 font-black text-xs uppercase tracking-wider">
          <Package className="h-4 w-4 text-white" />
          <span>FOR DELIVERY</span>
        </div>

        {/* Items List */}
        <div className="divide-y divide-slate-100">
          {deliveryItems.map((item) => {
            const isBrought = item.status === 'brought';
            const isMissing = item.status === 'missing';

            return (
              <div 
                key={item.id}
                className={`p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                  isBrought ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Item Number & Description */}
                <div className="flex items-start gap-2.5 flex-1 pr-2">
                  <span className="text-xs text-slate-400 font-medium min-w-[20px] pt-0.5">
                    {item.number}.
                  </span>
                  <span 
                    className={`text-xs ${
                      isBrought 
                        ? 'line-through text-slate-400 font-medium' 
                        : 'text-slate-800 font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Right Controls: Pill buttons and Charge box */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {/* Brought Pill Button */}
                  <button
                    type="button"
                    onClick={() => handleMarkBrought(item.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      isBrought
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <Check className="h-3 w-3" />
                    <span>Brought</span>
                  </button>

                  {/* Missing Pill Button */}
                  <button
                    type="button"
                    onClick={() => handleMarkMissing(item.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                      isMissing
                        ? 'bg-[#E11D48] text-white shadow-xs'
                        : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    <X className="h-3 w-3" />
                    <span>Missing</span>
                  </button>

                  {/* Amount Field */}
                  <div className="relative w-28 shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                      ₦
                    </span>
                    <input
                      type="text"
                      placeholder="Charge"
                      disabled={isBrought}
                      value={item.amount > 0 ? item.amount : ''}
                      onChange={(e) => handleAmountChange(item.id, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Supply Charge Summary Card                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-pink-50/40 border border-pink-200/90 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-pink-100 border border-pink-200 flex items-center justify-center text-pink-700">
            <Receipt className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-black text-pink-900 tracking-tight">
            Supply Charge Summary
          </h4>
        </div>

        {/* Billed Items Breakdown */}
        {billedItems.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No supplies charged yet. Mark missing items provided by the ward and enter the cash amounts above.
          </p>
        ) : (
          <div className="space-y-1.5 divide-y divide-pink-100">
            {billedItems.map((bi) => (
              <div key={bi.id} className="pt-1.5 flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium pr-4">{bi.label}</span>
                <span className="font-black text-slate-900 whitespace-nowrap">
                  ₦{bi.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TOTAL TO BILL */}
        <div className="pt-3 border-t border-pink-200 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            TOTAL TO BILL
          </span>
          <span className="text-lg font-black text-pink-900">
            ₦{totalToBill.toLocaleString()}
          </span>
        </div>

        {/* Cash Notice Banner */}
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Cash collected at the Maternity Ward will be flagged for the Cashier to verify and balance. Include only items the ward is providing on the patient's behalf.
          </span>
        </div>

        {/* Submit to Cashier Button */}
        <button
          type="button"
          onClick={handleSubmitBill}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl bg-[#E11D48] hover:bg-[#BE185D] active:scale-[0.99] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Submitting to Cashier...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Submit ₦{totalToBill.toLocaleString()} Bill to Cashier</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
