import React, { useState, useEffect } from 'react';
import { apiFetch, socketManager } from '../utils/api';
import { 
  Pill, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User as UserIcon,
  Loader2,
  RefreshCw,
  ShoppingBag,
  BedDouble,
  FileText,
  Plus,
  Minus,
  Trash2,
  Download,
  Building2,
  Box,
  PackagePlus,
  Boxes,
  ChevronRight,
  Send,
  Printer,
  Check,
  CheckCircle,
  XCircle,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

// Interfaces
interface PrescribedItem {
  name: string;
  quantity: number;
  price: number;
}

interface PatientQueueItem {
  id: string;
  patientId: string;
  patientName: string;
  hospitalNumber: string;
  phoneNumber: string;
  prescribedMeds: PrescribedItem[];
  totalBill: number;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  status: 'Pending' | 'Dispensed';
  date: string;
}

interface AdmittedOrder {
  id: string;
  patientName: string;
  patientId: string;
  ward: string;
  bedNumber: string;
  medications: { name: string; quantity: number; unitPrice: number; doseSchedule: string }[];
  totalBill: number;
  paymentStatus: 'PAID' | 'UNPAID';
  status: 'Pending Ward Release' | 'Dispensed';
  admittedDate: string;
}

interface ProcurementFormRow {
  id: string;
  name: string;
  quantity: string;
  unitPrice: string;
}

interface ProcurementRequestItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface ProcurementRequest {
  id: string;
  timestamp: string;
  status: 'Pending' | 'Approved' | 'Funds Released';
  items: ProcurementRequestItem[];
  total: number;
}

interface StockItem {
  id: string;
  drugName: string;
  quantity: number;
  lastReceivedQty: number;
  lastReceivedDate: string;
}

interface PharmacyViewProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function PharmacyView({ activeTab: parentActiveTab, onTabChange }: PharmacyViewProps = {}) {
  // Active Sub-Tab Navigation
  const [activeTab, setActiveTab] = useState<'dispensing' | 'admitted' | 'procurement' | 'stock'>(() => {
    if (parentActiveTab) {
      if (parentActiveTab.includes('admitted')) return 'admitted';
      if (parentActiveTab.includes('procurement')) return 'procurement';
      if (parentActiveTab.includes('stock')) return 'stock';
      return 'dispensing';
    }
    return (localStorage.getItem('zmc_pharmacy_subtab') as any) || 'dispensing';
  });

  useEffect(() => {
    if (parentActiveTab) {
      if (parentActiveTab.includes('admitted')) setActiveTab('admitted');
      else if (parentActiveTab.includes('procurement')) setActiveTab('procurement');
      else if (parentActiveTab.includes('stock')) setActiveTab('stock');
      else setActiveTab('dispensing');
    }
  }, [parentActiveTab]);

  const handleTabChange = (tab: 'dispensing' | 'admitted' | 'procurement' | 'stock') => {
    setActiveTab(tab);
    localStorage.setItem('zmc_pharmacy_subtab', tab);
    if (onTabChange) {
      onTabChange(`pharmacy-${tab}`);
    }
  };

  // State: Dispensing
  const [patientQueue, setPatientQueue] = useState<PatientQueueItem[]>(() => {
    const saved = localStorage.getItem('zmc_pharmacy_queue');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      {
        id: 'DISP-101',
        patientId: 'PAT-2011',
        patientName: 'Chinwe Onwuka',
        hospitalNumber: 'PAT-2011',
        phoneNumber: '08091234567',
        prescribedMeds: [
          { name: 'OMEPRAZOLE 20mg', quantity: 28, price: 4200 },
          { name: 'ANTACID SUSPENSION', quantity: 1, price: 1250 }
        ],
        totalBill: 5450,
        paymentStatus: 'PAID',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: 'DISP-102',
        patientId: 'PAT-2012',
        patientName: 'Emeka Adeleke',
        hospitalNumber: 'PAT-2012',
        phoneNumber: '08031122334',
        prescribedMeds: [
          { name: 'CEFTRIAXONE 1g Injection', quantity: 2, price: 6000 },
          { name: 'PARACETAMOL 500mg', quantity: 20, price: 1000 }
        ],
        totalBill: 7000,
        paymentStatus: 'PAID',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: 'DISP-103',
        patientId: 'PAT-2015',
        patientName: 'Amina Bello',
        hospitalNumber: 'PAT-2015',
        phoneNumber: '07055443322',
        prescribedMeds: [
          { name: 'CIPROFLOXACIN 500mg', quantity: 14, price: 3800 }
        ],
        totalBill: 3800,
        paymentStatus: 'UNPAID',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      }
    ];
  });

  const [selectedPatientId, setSelectedPatientId] = useState<string>('DISP-101');
  const [dispensingSearch, setDispensingSearch] = useState('');
  const [dispenseSuccess, setDispenseSuccess] = useState('');
  const [dispenseError, setDispenseError] = useState('');

  // State: Admitted Orders
  const [admittedOrders, setAdmittedOrders] = useState<AdmittedOrder[]>(() => {
    const saved = localStorage.getItem('zmc_pharmacy_admitted');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      {
        id: 'ADM-801',
        patientName: 'Emeka Okonkwo',
        patientId: 'PAT-1082',
        ward: 'Male Surgical Ward',
        bedNumber: 'Bed 04',
        medications: [
          { name: 'CEFTRIAXONE 1g Injection', quantity: 5, unitPrice: 2500, doseSchedule: '1g IV BD x 5 days' },
          { name: 'IV NORMAL SALINE 0.9% 1000ml', quantity: 2, unitPrice: 1500, doseSchedule: '1L IV x 24 hrs' },
          { name: 'PARACETAMOL 1g IV Infusion', quantity: 3, unitPrice: 1500, doseSchedule: '1g IV TDS x 3 days' }
        ],
        totalBill: 20000,
        paymentStatus: 'PAID',
        status: 'Pending Ward Release',
        admittedDate: '08/08/2026'
      },
      {
        id: 'ADM-802',
        patientName: 'Fatima Yusuf',
        patientId: 'PAT-1094',
        ward: 'Maternity Ward',
        bedNumber: 'Bed 02',
        medications: [
          { name: 'OXYTOCIN 10 IU Injection', quantity: 2, unitPrice: 1200, doseSchedule: '10 IU IM stat' },
          { name: 'CEFUROXIME 500mg', quantity: 14, unitPrice: 250, doseSchedule: '500mg BD x 7 days' }
        ],
        totalBill: 5900,
        paymentStatus: 'PAID',
        status: 'Pending Ward Release',
        admittedDate: '09/08/2026'
      }
    ];
  });
  const [admittedSearch, setAdmittedSearch] = useState('');

  // State: Procurement
  const [procurementFormRows, setProcurementFormRows] = useState<ProcurementFormRow[]>([
    { id: '1', name: '', quantity: '', unitPrice: '' }
  ]);

  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>(() => {
    const saved = localStorage.getItem('zmc_pharmacy_procurement');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      {
        id: 'PROC-003',
        timestamp: '07/08/2026, 08:00:00',
        status: 'Pending',
        items: [
          { name: 'INSULIN GLARGINE (10 vials)', quantity: 5, unitPrice: 22000, totalPrice: 110000 },
          { name: 'CEFTRIAXONE 1g (box of 10)', quantity: 4, unitPrice: 18000, totalPrice: 72000 },
          { name: 'MAGNESIUM SULPHATE injection', quantity: 4, unitPrice: 4000, totalPrice: 16000 }
        ],
        total: 198000
      }
    ];
  });
  const [procurementSuccess, setProcurementSuccess] = useState('');

  // State: Stock Log
  const [stockDrugName, setStockDrugName] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [stockLogs, setStockLogs] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem('zmc_pharmacy_stock');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      { id: 'STK-01', drugName: 'PARACETAMOL 500mg', quantity: 250, lastReceivedQty: 100, lastReceivedDate: '07/08/2026' },
      { id: 'STK-02', drugName: 'OMEPRAZOLE 20mg', quantity: 85, lastReceivedQty: 50, lastReceivedDate: '06/08/2026' },
      { id: 'STK-03', drugName: 'ANTACID SUSPENSION', quantity: 42, lastReceivedQty: 20, lastReceivedDate: '05/08/2026' },
      { id: 'STK-04', drugName: 'CEFTRIAXONE 1g', quantity: 60, lastReceivedQty: 30, lastReceivedDate: '04/08/2026' }
    ];
  });
  const [stockSuccess, setStockSuccess] = useState('');
  const [stockError, setStockError] = useState('');

  // Save to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('zmc_pharmacy_queue', JSON.stringify(patientQueue));
  }, [patientQueue]);

  useEffect(() => {
    localStorage.setItem('zmc_pharmacy_admitted', JSON.stringify(admittedOrders));
  }, [admittedOrders]);

  useEffect(() => {
    localStorage.setItem('zmc_pharmacy_procurement', JSON.stringify(procurementRequests));
  }, [procurementRequests]);

  useEffect(() => {
    localStorage.setItem('zmc_pharmacy_stock', JSON.stringify(stockLogs));
  }, [stockLogs]);

  // Sync API queue if available
  useEffect(() => {
    const fetchApiQueue = async () => {
      try {
        const res = await apiFetch('/patients/opd/queue');
        if (res.success && Array.isArray(res.data)) {
          const pharmItems = res.data.filter((q: any) => q.queue_type === 'Pharmacy' && q.status === 'Waiting');
          if (pharmItems.length > 0) {
            setPatientQueue(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newItems: PatientQueueItem[] = pharmItems
                .filter((q: any) => !existingIds.has(q.id))
                .map((q: any) => ({
                  id: q.id || `DISP-${Math.floor(100 + Math.random() * 900)}`,
                  patientId: q.patient_id || 'PAT-000',
                  patientName: q.patient_name || 'Patient',
                  hospitalNumber: q.hospital_number || 'PAT-000',
                  phoneNumber: q.phone_number || '08000000000',
                  prescribedMeds: [
                    { name: 'PARACETAMOL 500mg', quantity: 20, price: 1000 },
                    { name: 'AMOXICILLIN 500mg', quantity: 21, price: 2500 }
                  ],
                  totalBill: 3500,
                  paymentStatus: 'PAID',
                  status: 'Pending',
                  date: new Date().toISOString().split('T')[0]
                }));
              return [...prev, ...newItems];
            });
          }
        }
      } catch (err) {
        // Fallback to local state seamlessly
      }
    };

    fetchApiQueue();
    const interval = setInterval(fetchApiQueue, 6000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Queues
  const pendingQueue = patientQueue.filter(p => p.status === 'Pending');
  const filteredQueue = pendingQueue.filter(p => {
    const q = dispensingSearch.toLowerCase();
    return p.patientName.toLowerCase().includes(q) ||
           p.hospitalNumber.toLowerCase().includes(q) ||
           p.phoneNumber.includes(q);
  });

  const selectedPatient = patientQueue.find(p => p.id === selectedPatientId) || filteredQueue[0] || pendingQueue[0];

  // Handler: Dispense Medications
  const handleDispenseMeds = (patientId: string) => {
    const patient = patientQueue.find(p => p.id === patientId);
    if (!patient) return;

    if (patient.paymentStatus !== 'PAID') {
      setDispenseError(`Payment status is ${patient.paymentStatus}. Only paid prescriptions can be dispensed.`);
      return;
    }

    setDispenseError('');
    setDispenseSuccess(`Medications successfully dispensed to ${patient.patientName}! HMS status updated.`);

    // Deduct stock levels for prescribed meds
    setStockLogs(prev => prev.map(stock => {
      const matchedMed = patient.prescribedMeds.find(m => m.name.toLowerCase().includes(stock.drugName.toLowerCase()));
      if (matchedMed) {
        return {
          ...stock,
          quantity: Math.max(0, stock.quantity - matchedMed.quantity)
        };
      }
      return stock;
    }));

    // Update patient status to Dispensed
    setPatientQueue(prev => prev.map(p => p.id === patientId ? { ...p, status: 'Dispensed' } : p));

    setTimeout(() => setDispenseSuccess(''), 5000);
  };

  // Handler: Simulate Payment for testing
  const handleSimulatePayment = (patientId: string) => {
    setPatientQueue(prev => prev.map(p => p.id === patientId ? { ...p, paymentStatus: 'PAID' } : p));
    setDispenseSuccess(`Payment clearance confirmed for patient! Prescriptions now unlocked.`);
    setTimeout(() => setDispenseSuccess(''), 4000);
  };

  // Handler: Download HMS Transcript
  const handleDownloadHMS = (patient: PatientQueueItem) => {
    const lines = [
      '==========================================================',
      '        ZIKORA MEDICAL CENTER - PHARMACY HMS RECORD       ',
      '==========================================================',
      `Date: ${new Date().toLocaleString()}`,
      `Patient Name: ${patient.patientName}`,
      `Hospital ID: ${patient.hospitalNumber}`,
      `Phone Number: ${patient.phoneNumber}`,
      `Payment Status: ${patient.paymentStatus}`,
      '----------------------------------------------------------',
      'PRESCRIBED MEDICATIONS:',
      'Medication Name                   Qty      Price (NGN)',
      '----------------------------------------------------------',
      ...patient.prescribedMeds.map(m => 
        `${m.name.padEnd(32)} ${m.quantity.toString().padEnd(8)} ₦${m.price.toLocaleString()}`
      ),
      '----------------------------------------------------------',
      `TOTAL BILL: ₦${patient.totalBill.toLocaleString()}`,
      `DISPENSING STATUS: ${patient.status === 'Dispensed' ? 'FULFILLED & DISPENSED' : 'CLEARED FOR DISPENSING'}`,
      '----------------------------------------------------------',
      'Dispensed By: Resident Clinical Pharmacist',
      'Zikora HMS Intranet Portal Verification Code: ZMC-HMS-' + Math.floor(100000 + Math.random() * 900000),
      '=========================================================='
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `HMS_Prescription_${patient.patientName.replace(/\s+/g, '_')}_${patient.hospitalNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handler: Procurement Form Row Actions
  const handleAddProcurementRow = () => {
    setProcurementFormRows(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', quantity: '', unitPrice: '' }
    ]);
  };

  const handleRemoveProcurementRow = (id: string) => {
    if (procurementFormRows.length <= 1) return;
    setProcurementFormRows(prev => prev.filter(r => r.id !== id));
  };

  const handleUpdateProcurementRow = (id: string, field: keyof ProcurementFormRow, value: string) => {
    setProcurementFormRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSubmitProcurement = (e: React.FormEvent) => {
    e.preventDefault();
    setProcurementSuccess('');

    // Validate rows
    const validItems: ProcurementRequestItem[] = [];
    for (const row of procurementFormRows) {
      if (!row.name.trim()) continue;
      const qty = parseInt(row.quantity) || 1;
      const price = parseFloat(row.unitPrice) || 0;
      validItems.push({
        name: row.name.trim(),
        quantity: qty,
        unitPrice: price,
        totalPrice: qty * price
      });
    }

    if (validItems.length === 0) {
      alert('Please fill in at least one medication item name.');
      return;
    }

    const nextNumber = procurementRequests.length + 3;
    const reqId = `PROC-${nextNumber.toString().padStart(3, '0')}`;
    const totalCalc = validItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-GB')}, ${now.toLocaleTimeString()}`;

    const newRequest: ProcurementRequest = {
      id: reqId,
      timestamp: formattedDate,
      status: 'Pending',
      items: validItems,
      total: totalCalc
    };

    setProcurementRequests(prev => [newRequest, ...prev]);
    setProcurementFormRows([{ id: Date.now().toString(), name: '', quantity: '', unitPrice: '' }]);
    setProcurementSuccess(`Procurement request ${reqId} successfully submitted to Account Office & HR!`);
    setTimeout(() => setProcurementSuccess(''), 5000);
  };

  // Handler: Stock Log Submit
  const handleAddStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStockError('');
    setStockSuccess('');

    if (!stockDrugName.trim()) {
      setStockError('Drug name is required.');
      return;
    }
    const qtyVal = parseInt(stockQty);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setStockError('Please enter a valid quantity from bulk.');
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB');

    setStockLogs(prev => {
      const existingIdx = prev.findIndex(s => s.drugName.toLowerCase() === stockDrugName.trim().toLowerCase());
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + qtyVal,
          lastReceivedQty: qtyVal,
          lastReceivedDate: formattedDate
        };
        return updated;
      } else {
        return [
          {
            id: `STK-${Math.floor(10 + Math.random() * 90)}`,
            drugName: stockDrugName.trim().toUpperCase(),
            quantity: qtyVal,
            lastReceivedQty: qtyVal,
            lastReceivedDate: formattedDate
          },
          ...prev
        ];
      }
    });

    setStockSuccess(`Received ${qtyVal} units of ${stockDrugName.toUpperCase()} into pharmacy store.`);
    setStockDrugName('');
    setStockQty('');
    setTimeout(() => setStockSuccess(''), 4000);
  };

  // Dispense Admitted Order
  const handleDispenseAdmittedOrder = (id: string) => {
    setAdmittedOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Dispensed' } : o));
  };

  return (
    <div className="space-y-6" id="pharmacy_department_root">
      
      {/* 1. TOP DEPARTMENT HEADER & SUB-NAVIGATION TABS */}
      <div className="bg-white p-5 md:p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-700">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Pharmacy Department</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Clinical dispensing, inpatient ward requisitions, medication procurement, & bulk store stock control.
              </p>
            </div>
          </div>
        </div>

        {/* Active Section Badge */}
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 bg-amber-500/10 text-amber-800 rounded-xl font-mono text-xs font-bold border border-amber-500/20 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {activeTab === 'dispensing' && 'Dispensing Desk'}
            {activeTab === 'admitted' && 'Admitted Ward Orders'}
            {activeTab === 'procurement' && 'Procurement Requests'}
            {activeTab === 'stock' && 'Bulk Store Stock Log'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: DISPENSING PAGE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'dispensing' && (
        <div className="space-y-6">
          
          {/* Header Summary Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Total Pending Prescriptions:
              </span>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-xl font-mono font-black text-sm border border-amber-200">
                {pendingQueue.length}
              </span>
            </div>
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name, PAT-ID..."
                value={dispensingSearch}
                onChange={e => setDispensingSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {dispenseSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 font-medium flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{dispenseSuccess}</span>
              </div>
              <button onClick={() => setDispenseSuccess('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">Dismiss</button>
            </div>
          )}

          {dispenseError && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs text-rose-800 font-medium flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{dispenseError}</span>
              </div>
              <button onClick={() => setDispenseError('')} className="text-rose-700 hover:text-rose-900 text-xs font-bold">Dismiss</button>
            </div>
          )}

          {/* Grid Layout: Left Queue vs Right Patient Info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Pending Prescriptions Queue */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Pending Queue ({filteredQueue.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Select to view prescription</span>
              </h3>

              {filteredQueue.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                  <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No Pending Prescriptions</p>
                  <p className="text-[10px] text-slate-400 mt-1">All pharmacy orders have been completed.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {filteredQueue.map(item => {
                    const isSelected = selectedPatient?.id === item.id;
                    const isPaid = item.paymentStatus === 'PAID';

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedPatientId(item.id);
                          setDispenseError('');
                        }}
                        className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {item.patientName}
                          </p>
                          <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                            ID: {item.hospitalNumber} | Phone: {item.phoneNumber}
                          </p>
                          <p className={`text-[10px] mt-1 font-medium ${isSelected ? 'text-amber-100' : 'text-slate-600'}`}>
                            {item.prescribedMeds.length} Prescribed Item(s) • Total: ₦{item.totalBill.toLocaleString()}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold block ${
                            isPaid
                              ? (isSelected ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800')
                              : (isSelected ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-800')
                          }`}>
                            {item.paymentStatus}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Selected Patient Information Details (Exact Format Requested) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              {selectedPatient ? (
                selectedPatient.paymentStatus === 'PAID' ? (
                  /* ONLY Patients That Have Paid Display Information On This Page */
                  <div className="space-y-6">
                    
                    {/* Patient Header Box */}
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="text-lg font-black text-slate-900">{selectedPatient.patientName}</h2>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        ID: <strong className="text-slate-800">{selectedPatient.hospitalNumber}</strong> | Phone: <strong className="text-slate-800">{selectedPatient.phoneNumber}</strong>
                      </p>
                    </div>

                    {/* Prescribed Medications Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide font-mono">
                        Prescribed Medications
                      </h3>

                      <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600">
                              <th className="py-2.5 px-4">Medication</th>
                              <th className="py-2.5 px-4 text-center">Quantity</th>
                              <th className="py-2.5 px-4 text-right">Price</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {selectedPatient.prescribedMeds.map((med, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4 font-bold text-slate-800">{med.name}</td>
                                <td className="py-3 px-4 text-center text-slate-600">{med.quantity}</td>
                                <td className="py-3 px-4 text-right font-bold text-slate-900">
                                  ₦{med.price.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Total Amount Row */}
                      <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono">
                        <span className="text-xs font-bold text-slate-700">Total:</span>
                        <span className="text-base font-black text-amber-900">
                          ₦{selectedPatient.totalBill.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Payment Status Row */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-500">Payment Status:</p>
                      <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-mono font-bold text-xs rounded-lg border border-emerald-200">
                        PAID
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                      <button
                        onClick={() => handleDispenseMeds(selectedPatient.id)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Dispense Medications
                      </button>

                      <button
                        onClick={() => handleDownloadHMS(selectedPatient)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="h-4 w-4 text-slate-600" />
                        Download HMS
                      </button>
                    </div>

                  </div>
                ) : (
                  /* IF PATIENT IS NOT PAID: Restricted Access Notice */
                  <div className="py-16 text-center space-y-4">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{selectedPatient.patientName}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        ID: {selectedPatient.hospitalNumber} | Phone: {selectedPatient.phoneNumber}
                      </p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-800 max-w-md mx-auto">
                      <p className="font-bold">Payment Status: UNPAID</p>
                      <p className="mt-1 text-[11px] text-rose-700">
                        Only patients that have paid can have their prescription details & dispensing enabled on this page.
                      </p>
                    </div>
                    <button
                      onClick={() => handleSimulatePayment(selectedPatient.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Simulate Payment Clearance (Mark Paid)
                    </button>
                  </div>
                )
              ) : (
                <div className="py-24 text-center text-xs text-slate-400">
                  <UserIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-500">No Patient Selected</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select a patient from the queue on the left to view prescription details.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: ADMITTED ORDERS PAGE                                            */}
      {/* ========================================================================= */}
      {activeTab === 'admitted' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-amber-600" />
                  Inpatient Admitted Ward Orders
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review and fulfill medication orders for patients currently admitted in hospital wards.
                </p>
              </div>
              <div className="relative min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter ward orders..."
                  value={admittedSearch}
                  onChange={e => setAdmittedSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pl-9 pr-3 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {admittedOrders.map(order => (
                <div key={order.id} className="bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        {order.ward} • {order.bedNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5">{order.patientName}</h3>
                      <p className="text-[11px] font-mono text-slate-500">ID: {order.patientId} | Date: {order.admittedDate}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                      order.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <p className="text-[11px] font-bold text-slate-500 font-mono uppercase">Ward Regimen Items:</p>
                    {order.medications.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-800 font-mono">
                        <div>
                          <p className="font-bold">{m.name}</p>
                          <p className="text-[10px] text-slate-500">{m.doseSchedule}</p>
                        </div>
                        <span className="font-bold">x{m.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-100 pt-2 flex justify-between font-mono font-bold text-slate-900">
                      <span>Total:</span>
                      <span>₦{order.totalBill.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    {order.status === 'Pending Ward Release' ? (
                      <button
                        onClick={() => handleDispenseAdmittedOrder(order.id)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="h-3.5 w-3.5" /> Dispense to Ward Nurse
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Fulfilled & Released to Ward
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: PROCUREMENT PAGE                                                */}
      {/* ========================================================================= */}
      {activeTab === 'procurement' && (
        <div className="space-y-6">
          
          {procurementSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{procurementSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Request Medication Procurement Form */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-800">Request Medication Procurement</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Submit a medication request. It will be sent to the Account Office and HR for approval and fund release.
                </p>
              </div>

              <form onSubmit={handleSubmitProcurement} className="space-y-5">
                <div className="space-y-4">
                  {procurementFormRows.map((row, idx) => {
                    const qtyVal = parseInt(row.quantity) || 0;
                    const priceVal = parseFloat(row.unitPrice) || 0;
                    const rowTotal = qtyVal * priceVal;

                    return (
                      <div key={row.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700 font-mono">
                            Item #{idx + 1}
                          </span>
                          {procurementFormRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProcurementRow(row.id)}
                              className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-0.5 rounded hover:bg-rose-50 cursor-pointer"
                            >
                              —
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-6 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Medication name</label>
                            <input
                              type="text"
                              placeholder="e.g. CEFTRIAXONE 1g (box of 10)"
                              value={row.name}
                              onChange={e => handleUpdateProcurementRow(row.id, 'name', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                              required
                            />
                          </div>

                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Qty</label>
                            <input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={row.quantity}
                              onChange={e => handleUpdateProcurementRow(row.id, 'quantity', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                              required
                            />
                          </div>

                          <div className="sm:col-span-3 space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Price/unit (₦)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={row.unitPrice}
                              onChange={e => handleUpdateProcurementRow(row.id, 'unitPrice', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                              required
                            />
                          </div>
                        </div>

                        {rowTotal > 0 && (
                          <div className="text-right text-[11px] font-mono font-bold text-amber-900">
                            Subtotal: ₦{rowTotal.toLocaleString()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleAddProcurementRow}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Item
                  </button>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Submit Request to Account Office & HR
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: My Procurement Requests Cards */}
            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3">
                My Procurement Requests
              </h2>

              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {procurementRequests.map(req => (
                  <div key={req.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 font-mono">{req.id}</h3>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">{req.timestamp}</p>
                      </div>
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-[10px] rounded-md font-mono">
                        {req.status}
                      </span>
                    </div>

                    <div className="overflow-x-auto border-t border-b border-slate-200/80 my-2">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 text-[10px] font-black text-slate-600 uppercase tracking-wider font-mono">
                            <th className="py-2 px-3">Item</th>
                            <th className="py-2 px-3">Category</th>
                            <th className="py-2 px-3 text-center">Quantity</th>
                            <th className="py-2 px-3 text-right">Price/Unit</th>
                            <th className="py-2 px-3 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {req.items.map((item: any, idx: number) => {
                            const unitPrice = item.unitPrice || (item.totalPrice && item.quantity ? Math.round(item.totalPrice / item.quantity) : 0);
                            const category = item.category || 'Pharmaceuticals';
                            return (
                              <tr key={idx} className="hover:bg-slate-100/50">
                                <td className="py-2 px-3 font-sans font-bold text-slate-800">{item.name}</td>
                                <td className="py-2 px-3 text-[11px] text-slate-600">{category}</td>
                                <td className="py-2 px-3 text-center font-bold text-slate-700">{item.quantity}</td>
                                <td className="py-2 px-3 text-right text-slate-600">₦{unitPrice.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right font-black text-slate-900">₦{item.totalPrice.toLocaleString()}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-center text-xs font-mono pt-1">
                      <span className="font-bold text-slate-600">Total:</span>
                      <span className="font-black text-sm text-slate-900">₦{req.total.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 4: STOCK LOG PAGE                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          
          {/* Receive New Stock Form Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Stock Log – Receive New Stock</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Record medications received from the bulk room into the pharmacy store.
              </p>
            </div>

            {stockSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{stockSuccess}</span>
              </div>
            )}

            {stockError && (
              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{stockError}</span>
              </div>
            )}

            <form onSubmit={handleAddStockSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-6 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Drug Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. PARACETAMOL 500mg"
                  value={stockDrugName}
                  onChange={e => setStockDrugName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Qty from Bulk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="100"
                  value={stockQty}
                  onChange={e => setStockQty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add Stock
                </button>
              </div>
            </form>
          </div>

          {/* Current Stock Table / List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-800">Current Stock</h2>

            {stockLogs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <Boxes className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-600">No stock entries yet</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Drug Name</th>
                      <th className="py-3 px-4 text-center">Store Qty</th>
                      <th className="py-3 px-4 text-center">Last Received Qty</th>
                      <th className="py-3 px-4 text-right">Last Date Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {stockLogs.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.drugName}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            item.quantity > 50
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.quantity > 10
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {item.quantity} units
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">+{item.lastReceivedQty}</td>
                        <td className="py-3 px-4 text-right text-slate-500">{item.lastReceivedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
