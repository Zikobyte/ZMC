import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { 
  BedDouble, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShieldAlert, 
  User, 
  Loader2, 
  DollarSign, 
  RefreshCw,
  Building2,
  Stethoscope,
  Eye
} from 'lucide-react';
import PendingBalanceModal from './PendingBalanceModal';
import PatientDetailModal from './PatientDetailModal';

interface AdmissionsViewProps {
  userRole?: string;
}

export default function AdmissionsView({ userRole = 'Receptionist' }: AdmissionsViewProps) {
  const [loading, setLoading] = useState(false);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [outstandingRecords, setOutstandingRecords] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'Admitted' | 'Emergency' | 'Maternity' | 'Owing'>('ALL');

  // Modal state
  const [selectedDebtPatient, setSelectedDebtPatient] = useState<{ id: string; name: string; hospitalNumber: string } | null>(null);
  const [selectedModalPatient, setSelectedModalPatient] = useState<any | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  useEffect(() => {
    fetchAdmissionsData();
  }, []);

  const fetchAdmissionsData = async () => {
    setLoading(true);
    try {
      const [queueRes, outstandingRes, patientsRes] = await Promise.all([
        apiFetch('/patients/opd/queue').catch(() => ({ success: true, data: [] })),
        apiFetch('/payments/outstanding').catch(() => ({ success: true, data: [] })),
        apiFetch('/patients').catch(() => ({ success: true, data: [] }))
      ]);

      if (queueRes.success) setQueueItems(queueRes.data || []);
      if (outstandingRes.success) setOutstandingRecords(outstandingRes.data || []);
      if (patientsRes.success) setPatients(patientsRes.data || []);
    } catch (err) {
      console.error('Error loading admissions data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter queue for admissions / emergency / ward encounters
  const admissionPatients = queueItems.filter(item => {
    const isEmergency = item.priority === 'Emergency' || item.visit_type === 'Emergency Care';
    const isAdmitted = item.status === 'Admitted' || item.destination_clinic?.includes('Ward') || item.queue_type === 'Nursing Front-Desk';
    return isEmergency || isAdmitted;
  });

  const totalOutstandingAmount = outstandingRecords.reduce((acc, curr) => acc + (parseFloat(curr.balance) || 0), 0);
  const totalOwingCount = new Set(outstandingRecords.map(r => r.patient_id)).size;

  const filteredList = admissionPatients.filter(item => {
    if (filterType === 'Emergency' && item.priority !== 'Emergency') return false;
    if (filterType === 'Maternity' && item.card_type !== 'Maternity') return false;
    if (filterType === 'Owing') {
      const pat = patients.find(p => p.id === item.patient_id);
      if (!pat || !(pat.outstanding_balance > 0 || pat.outstandingBalance > 0)) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (item.patient_name || '').toLowerCase().includes(q);
      const matchNum = (item.hospital_number || '').toLowerCase().includes(q);
      return matchName || matchNum;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BedDouble className="h-6 w-6 text-[#2A758C]" /> Holistic OPD Admissions & Cash Verification
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time directory of admitted, emergency, and ward patients awaiting cash verification or holding active balances.
          </p>
        </div>
        <button
          onClick={fetchAdmissionsData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Admissions
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">Admitted / Ward Patients</span>
            <BedDouble className="h-4 w-4 text-[#2A758C]" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">{admissionPatients.length}</p>
          <p className="text-[10px] text-slate-500 font-medium">Currently active in ward/OPD</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">Pending Balance Patients</span>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">{totalOwingCount}</p>
          <p className="text-[10px] text-slate-500 font-medium">Hold active outstanding debts</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">Total Outstanding Debt</span>
            <DollarSign className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-mono">₦{totalOutstandingAmount.toLocaleString()}</p>
          <p className="text-[10px] text-slate-500 font-medium">Uncollected hospital balance</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-extrabold uppercase font-mono tracking-wider">Ward Capacity</span>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono">18 / 30</p>
          <p className="text-[10px] text-slate-500 font-medium">Beds occupied in General/Maternity</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter admitted patient by name or hospital ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2A758C]"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl shrink-0 w-full md:w-auto">
          {(['ALL', 'Emergency', 'Maternity', 'Owing'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filterType === type ? 'bg-[#2A758C] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Admitted Patients List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider font-mono">
          Admissions & Emergency Encounters ({filteredList.length})
        </h3>

        {loading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#2A758C]" />
            <p className="text-xs font-bold">Loading admissions directory...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            No admitted patients match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-3">Hospital No</th>
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Ward / Clinic</th>
                  <th className="p-3">Doctor in Charge</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3 text-right">Outstanding Debt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredList.map((item) => {
                  const pat = patients.find(p => p.id === item.patient_id) || {};
                  const debt = parseFloat((pat.outstanding_balance || pat.outstandingBalance || 0).toString());

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => {
                        const patObj = patients.find(p => p.id === item.patient_id) || { id: item.patient_id, name: item.patient_name, hospitalNumber: item.hospital_number };
                        setSelectedModalPatient(patObj);
                        setIsPatientModalOpen(true);
                      }}
                      className="text-xs hover:bg-[#F0F8FA] transition-all cursor-pointer group"
                    >
                      <td className="p-3 font-mono font-bold text-[#2A758C]">{item.hospital_number}</td>
                      <td className="p-3">
                        <p className="font-extrabold text-slate-900 group-hover:text-[#2A758C] transition-colors">{item.patient_name}</p>
                        <p className="text-[10px] text-slate-400">Card: {item.card_type || 'Standard'}</p>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-[10px] font-bold">
                          {item.destination_clinic || 'Inpatient Ward'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>Dr. Okonkwo (Attending)</span>
                      </td>
                      <td className="p-3">
                        {debt > 0 ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-full border border-amber-200 inline-flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-600 animate-pulse" />
                            Pending Balance
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Verified Paid
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {debt > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDebtPatient({
                                id: item.patient_id,
                                name: item.patient_name,
                                hospitalNumber: item.hospital_number
                              });
                            }}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl border border-rose-200 transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                            ₦{debt.toLocaleString()} (View)
                          </button>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">₦0 (Clear)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Balance Modal */}
      {selectedDebtPatient && (
        <PendingBalanceModal
          isOpen={!!selectedDebtPatient}
          onClose={() => setSelectedDebtPatient(null)}
          patientId={selectedDebtPatient.id}
          patientName={selectedDebtPatient.name}
          hospitalNumber={selectedDebtPatient.hospitalNumber}
          userRole={userRole}
          onCleared={() => {
            fetchAdmissionsData();
          }}
        />
      )}

      {/* Comprehensive Patient Detail Modal */}
      <PatientDetailModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patient={selectedModalPatient}
      />
    </div>
  );
}
