import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  UserCheck, 
  Boxes, 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  Clock3, 
  AlertCircle, 
  Building2, 
  Stethoscope, 
  Pill, 
  ShieldCheck, 
  Sun, 
  Moon, 
  DollarSign, 
  Percent, 
  FileText, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ChevronRight, 
  TrendingUp, 
  ArrowUpRight,
  Sparkles,
  Phone,
  Mail,
  UserPlus,
  Lock,
  Unlock,
  Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch } from '../utils/api';
import { User, HRDashboardStats, Employee, Absence, JobOpening, Candidate, Procurement, DiscountPolicy } from '../types';

interface HRDashboardViewProps {
  activeSubTab: string;
  onTabChange: (tab: string) => void;
  currentUser?: User | null;
}

export default function HRDashboardView({ activeSubTab, onTabChange, currentUser }: HRDashboardViewProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dashboard Stats
  const [stats, setStats] = useState<HRDashboardStats | null>(null);

  // Sub-modules state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [discounts, setDiscounts] = useState<DiscountPolicy[]>([]);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddAbsenceModal, setShowAddAbsenceModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [showAddProcurementModal, setShowAddProcurementModal] = useState(false);
  const [showAddDiscountModal, setShowAddDiscountModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: 'Nurse',
    department: 'Nursing',
    email: '',
    phone: '',
    shift: 'Day',
    status: 'Active',
    salary: 350000,
    hire_date: new Date().toISOString().split('T')[0],
    date_joined: new Date().toISOString().split('T')[0],
    documents_count: 0
  });

  const [absenceTimeframe, setAbsenceTimeframe] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Yearly'>('Monthly');
  const [absenceForm, setAbsenceForm] = useState({
    employee_name: '',
    employee_id: '',
    department: 'Medical',
    date: '2026-08-18',
    status: 'Sick Leave',
    reason: ''
  });

  const [jobStatusFilter, setJobStatusFilter] = useState<'All' | 'Open' | 'Closed'>('All');
  const [jobForm, setJobForm] = useState({
    title: '',
    department: 'Medical',
    openings_count: 1,
    employment_type: 'Full-time',
    status: 'Open',
    experience_required: '2+ years',
    description: ''
  });

  const [candidateForm, setCandidateForm] = useState({
    job_id: '',
    job_title: '',
    candidate_name: '',
    email: '',
    phone: '',
    role_applied: 'Doctor',
    stage: 'Applied',
    experience_years: 3,
    notes: '',
    rating: 4
  });

  const [procurementForm, setProcurementForm] = useState({
    item_name: '',
    items: '',
    quantity: 1,
    unit_price: 10000,
    amount: 10000,
    department: 'General Hospital',
    supplier_name: 'MedEquip Solutions Ltd',
    requested_by: currentUser?.name || 'HR Department',
    status: 'Ordered',
    date: new Date().toISOString().split('T')[0],
    category: 'Medical Supplies'
  });

  const [discountForm, setDiscountForm] = useState({
    title: '',
    discount_code: '',
    category: 'Staff Benefit',
    percentage: 50,
    fixed_amount: 0,
    applicable_service: 'All Consultations & In-House Pharmacy',
    authorized_by: 'HR & Management',
    status: 'Active',
    description: ''
  });

  // Fetch HR Dashboard data
  const fetchDashboardStats = async () => {
    try {
      setError(null);
      const res = await apiFetch('/hr/dashboard');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load HR dashboard:', err);
      setError(err.message || 'Failed to load HR metrics from database');
    }
  };

  // Fetch Specific Module Data
  const fetchEmployees = async () => {
    try {
      const res = await apiFetch('/hr/employees');
      if (res.success && Array.isArray(res.data)) {
        setEmployees(res.data);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const fetchAbsences = async () => {
    try {
      const res = await apiFetch('/hr/absences');
      if (res.success && Array.isArray(res.data)) {
        setAbsences(res.data);
      }
    } catch (err) {
      console.error('Failed to load absences:', err);
    }
  };

  const fetchRecruitment = async () => {
    try {
      const [jobsRes, candsRes] = await Promise.all([
        apiFetch('/hr/recruitment/jobs'),
        apiFetch('/hr/recruitment/candidates')
      ]);
      if (jobsRes.success && Array.isArray(jobsRes.data)) setJobOpenings(jobsRes.data);
      if (candsRes.success && Array.isArray(candsRes.data)) setCandidates(candsRes.data);
    } catch (err) {
      console.error('Failed to load recruitment data:', err);
    }
  };

  const fetchProcurements = async () => {
    try {
      const res = await apiFetch('/hr/procurements');
      if (res.success && Array.isArray(res.data)) {
        setProcurements(res.data);
      }
    } catch (err) {
      console.error('Failed to load procurements:', err);
    }
  };

  const fetchDiscounts = async () => {
    try {
      const res = await apiFetch('/hr/discounts');
      if (res.success && Array.isArray(res.data)) {
        setDiscounts(res.data);
      }
    } catch (err) {
      console.error('Failed to load discounts:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardStats(),
      fetchEmployees(),
      fetchAbsences(),
      fetchRecruitment(),
      fetchProcurements(),
      fetchDiscounts()
    ]);
    setLoading(false);
  };

  const refreshCurrentView = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardStats(),
      fetchEmployees(),
      fetchAbsences(),
      fetchRecruitment(),
      fetchProcurements(),
      fetchDiscounts()
    ]);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Handlers for Employee
  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const res = await apiFetch(`/hr/employees/${editingEmployee.id}`, {
          method: 'PATCH',
          body: JSON.stringify(employeeForm)
        });
        if (res.success) {
          showNotification(`Updated employee ${employeeForm.name}`);
          setEditingEmployee(null);
          setShowAddEmployeeModal(false);
          await refreshCurrentView();
        }
      } else {
        const res = await apiFetch('/hr/employees', {
          method: 'POST',
          body: JSON.stringify(employeeForm)
        });
        if (res.success) {
          showNotification(`Successfully added ${employeeForm.name} to the ${employeeForm.role} table`);
          setShowAddEmployeeModal(false);
          setEmployeeForm({
            name: '',
            role: 'Nurse',
            department: 'Nursing',
            email: '',
            phone: '',
            shift: 'Day',
            status: 'Active',
            salary: 350000,
            hire_date: new Date().toISOString().split('T')[0],
            date_joined: new Date().toISOString().split('T')[0],
            documents_count: 0
          });
          await refreshCurrentView();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save employee');
    }
  };

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the database?`)) return;
    try {
      const res = await apiFetch(`/hr/employees/${id}`, { method: 'DELETE' });
      if (res.success) {
        showNotification(`Removed employee ${name}`);
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee');
    }
  };

  // Handlers for Absence
  const handleSaveAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!absenceForm.employee_name) {
      setError('Please select an employee');
      return;
    }
    try {
      const res = await apiFetch('/hr/absences', {
        method: 'POST',
        body: JSON.stringify({
          ...absenceForm,
          leave_type: absenceForm.status,
          start_date: absenceForm.date,
          end_date: absenceForm.date
        })
      });
      if (res.success) {
        showNotification(`Absence recorded for ${absenceForm.employee_name}`);
        setShowAddAbsenceModal(false);
        setAbsenceForm({
          employee_name: '',
          employee_id: '',
          department: 'Medical',
          date: '2026-08-18',
          status: 'Sick Leave',
          reason: ''
        });
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record absence');
    }
  };

  const handleDeleteAbsence = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the absence record for ${name}?`)) return;
    try {
      const res = await apiFetch(`/hr/absences/${id}`, { method: 'DELETE' });
      if (res.success) {
        showNotification(`Deleted absence record for ${name}`);
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete absence record');
    }
  };

  const handleUpdateAbsenceStatus = async (id: string, status: 'Approved' | 'Rejected', employeeName: string) => {
    try {
      const res = await apiFetch(`/hr/absences/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, comments: `${status} by ${currentUser?.name || 'HR Manager'}` })
      });
      if (res.success) {
        showNotification(`Leave request ${status.toLowerCase()} for ${employeeName}`);
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update leave status');
    }
  };

  // Handlers for Job Openings & Candidates
  const handleToggleJobStatus = async (job: JobOpening) => {
    const newStatus = job.status === 'Open' ? 'Closed' : 'Open';
    try {
      const res = await apiFetch(`/hr/recruitment/jobs/${job.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success) {
        showNotification(`Job vacancy "${job.title}" has been ${newStatus === 'Open' ? 'opened' : 'closed'}`);
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update job status');
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the job vacancy for "${title}"?`)) return;
    try {
      const res = await apiFetch(`/hr/recruitment/jobs/${id}`, { method: 'DELETE' });
      if (res.success) {
        showNotification(`Deleted job opening "${title}"`);
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete job opening');
    }
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/hr/recruitment/jobs', {
        method: 'POST',
        body: JSON.stringify(jobForm)
      });
      if (res.success) {
        showNotification(`Job opening "${jobForm.title}" published`);
        setShowAddJobModal(false);
        setJobForm({
          title: '',
          department: 'Medical',
          openings_count: 1,
          employment_type: 'Full-time',
          status: 'Open',
          experience_required: '2+ years',
          description: ''
        });
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create job opening');
    }
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/hr/recruitment/candidates', {
        method: 'POST',
        body: JSON.stringify(candidateForm)
      });
      if (res.success) {
        showNotification(`Candidate "${candidateForm.candidate_name}" recorded`);
        setShowAddCandidateModal(false);
        setCandidateForm({
          job_id: '',
          job_title: '',
          candidate_name: '',
          email: '',
          phone: '',
          role_applied: 'Doctor',
          stage: 'Applied',
          experience_years: 3,
          notes: '',
          rating: 4
        });
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add candidate');
    }
  };

  const handleUpdateCandidateStage = async (id: string, stage: string, candidateName: string) => {
    try {
      const res = await apiFetch(`/hr/recruitment/candidates/${id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage })
      });
      if (res.success) {
        showNotification(`Candidate ${candidateName} moved to ${stage}`);
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update candidate stage');
    }
  };

  // Handlers for Procurement
  const handleSaveProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalAmount = procurementForm.quantity * procurementForm.unit_price;
      const res = await apiFetch('/hr/procurements', {
        method: 'POST',
        body: JSON.stringify({
          ...procurementForm,
          amount: totalAmount,
          item_name: procurementForm.item_name || procurementForm.items,
          items: procurementForm.items || procurementForm.item_name
        })
      });
      if (res.success) {
        showNotification(`Procurement requisition recorded`);
        setShowAddProcurementModal(false);
        setProcurementForm({
          item_name: '',
          items: '',
          quantity: 1,
          unit_price: 10000,
          amount: 10000,
          department: 'General Hospital',
          supplier_name: 'MedEquip Solutions Ltd',
          requested_by: currentUser?.name || 'HR Department',
          status: 'Ordered',
          date: new Date().toISOString().split('T')[0],
          category: 'Medical Supplies'
        });
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save procurement');
    }
  };

  const handleUpdateProcurementStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/hr/procurements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.success) {
        showNotification(`Procurement status updated to ${status}`);
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update procurement');
    }
  };

  const handleDeleteProcurement = async (id: string, itemName: string) => {
    if (!window.confirm(`Are you sure you want to delete the procurement order for "${itemName}"?`)) return;
    try {
      const res = await apiFetch(`/hr/procurements/${id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        showNotification(`Procurement record deleted`);
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete procurement');
    }
  };

  // Handlers for Discounts
  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/hr/discounts', {
        method: 'POST',
        body: JSON.stringify(discountForm)
      });
      if (res.success) {
        showNotification(`Discount policy "${discountForm.title}" activated`);
        setShowAddDiscountModal(false);
        setDiscountForm({
          title: '',
          discount_code: '',
          category: 'Staff Benefit',
          percentage: 50,
          fixed_amount: 0,
          applicable_service: 'All Consultations & In-House Pharmacy',
          authorized_by: 'HR & Management',
          status: 'Active',
          description: ''
        });
        await refreshCurrentView();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save discount policy');
    }
  };

  // Tab mapping
  const normalizedSubTab = 
    activeSubTab === 'hr-employees' || activeSubTab === 'employees' ? 'employees' :
    activeSubTab === 'hr-absences' || activeSubTab === 'absences' ? 'absences' :
    activeSubTab === 'hr-recruitment' || activeSubTab === 'recruitment' ? 'recruitment' :
    activeSubTab === 'hr-procurement' || activeSubTab === 'procurement' ? 'procurement' :
    activeSubTab === 'hr-discounts' || activeSubTab === 'discounts' ? 'discounts' :
    'dashboard';

  // Role distribution calculated from stats or live list
  const roleDist = stats?.roleDistribution || {
    doctors: employees.filter(e => e.role?.toLowerCase().includes('doctor')).length,
    nurses: employees.filter(e => e.role?.toLowerCase().includes('nurse')).length,
    pharmacists: employees.filter(e => e.role?.toLowerCase().includes('pharmacist')).length,
    security: employees.filter(e => e.role?.toLowerCase().includes('security') || e.role?.toLowerCase().includes('guard')).length,
    dayWorkers: employees.filter(e => e.shift?.toLowerCase() === 'day' || e.role?.toLowerCase().includes('day')).length,
    nightWorkers: employees.filter(e => e.shift?.toLowerCase() === 'night' || e.role?.toLowerCase().includes('night')).length,
  };

  const totalEmployeesCount = stats?.totalEmployees ?? employees.length;
  const openPositionsCount = stats?.openPositions ?? jobOpenings.filter(j => j.status === 'Open').length;
  const totalCandidatesCount = stats?.totalCandidates ?? candidates.length;
  const totalProcurementsCount = stats?.totalProcurements ?? procurements.length;

  const renderEmployeeCategoryTable = (
    title: string,
    icon: React.ReactNode,
    categoryEmployees: Employee[],
    badgeBg: string
  ) => {
    const filtered = categoryEmployees.filter(e => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        e.name?.toLowerCase().includes(term) ||
        e.phone?.toLowerCase().includes(term) ||
        e.email?.toLowerCase().includes(term) ||
        e.role?.toLowerCase().includes(term)
      );
    });

    return (
      <div key={title} className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        {/* Table Category Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${badgeBg}`}>
              {icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">{title}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {filtered.length} {filtered.length === 1 ? 'Employee' : 'Employees'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Hospital database records for {title.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Phone</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Date Joined</th>
                <th className="py-3.5 px-6">Documents</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <p className="font-semibold text-slate-600">No {title.toLowerCase()} found</p>
                      <p className="text-[11px] text-slate-400">
                        {searchTerm ? 'No results matched your search query.' : `No employees currently registered under ${title.toLowerCase()} in the database.`}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Name */}
                    <td className="py-4 px-6">
                      <div className="font-black text-slate-900">{emp.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">ID: {emp.id.substring(0, 8)}</div>
                    </td>

                    {/* Phone */}
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {emp.phone || '—'}
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 text-slate-600">
                      {emp.email || '—'}
                    </td>

                    {/* Date Joined */}
                    <td className="py-4 px-6 text-slate-700 font-medium">
                      {emp.date_joined || emp.hire_date || '—'}
                    </td>

                    {/* Documents */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        {emp.documents_count ?? 0} {emp.documents_count === 1 ? 'doc' : 'docs'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={`Delete ${emp.name}`}
                          aria-label={`Delete ${emp.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12" id="hr-dashboard-container">
      
      {/* 1. Header & Navigation Pills */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Human Resources & Procurement</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  Live Database
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Hospital workforce analytics, staffing distribution, leave management & procurement logs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshCurrentView}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
              Sync Data
            </button>

            {normalizedSubTab === 'employees' && (
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setShowAddEmployeeModal(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
            )}

            {normalizedSubTab === 'absences' && (
              <button
                onClick={() => setShowAddAbsenceModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Log Leave Request
              </button>
            )}

            {normalizedSubTab === 'recruitment' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddJobModal(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Post Job Opening
                </button>
                <button
                  onClick={() => setShowAddCandidateModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Candidate
                </button>
              </div>
            )}

            {normalizedSubTab === 'procurement' && (
              <button
                onClick={() => setShowAddProcurementModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Record Procurement
              </button>
            )}

            {normalizedSubTab === 'discounts' && (
              <button
                onClick={() => setShowAddDiscountModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Discount Scheme
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="department-page-nav flex items-center gap-1.5 mt-4 overflow-x-auto pt-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboardIcon className="w-4 h-4" /> },
            { id: 'employees', label: 'Employees', icon: <Users className="w-4 h-4" /> },
            { id: 'absences', label: 'Absences', icon: <Calendar className="w-4 h-4" /> },
            { id: 'recruitment', label: 'Recruitment', icon: <UserCheck className="w-4 h-4" /> },
            { id: 'procurement', label: 'Procurement', icon: <Boxes className="w-4 h-4" /> },
            { id: 'discounts', label: 'Discounts', icon: <Percent className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = normalizedSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id === 'dashboard' ? 'hr-dashboard' : `hr-${tab.id}`)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Success / Error Alerts */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800 font-bold text-xs">Dismiss</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUBTAB: HR DASHBOARD (MAIN VIEW SPECIFIED BY USER)                     */}
      {/* ========================================================================= */}
      {normalizedSubTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Employees */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Employees</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{totalEmployeesCount}</span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Active Staff
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Verified records in database</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-600" />
            </div>

            {/* Open Positions */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Positions</span>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{openPositionsCount}</span>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Hiring
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Active vacancy requisitions</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
            </div>

            {/* Total Candidates */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Candidates</span>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{totalCandidatesCount}</span>
                <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                  Applicants
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">In recruitment pipeline</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600" />
            </div>

            {/* Total Procurements */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Procurements</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Boxes className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 tracking-tight">{totalProcurementsCount}</span>
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Requisitions
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Supply & equipment orders</p>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
            </div>

          </div>

          {/* Employee Distribution by Role */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-2">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Employee Distribution by Role</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Breakdown across clinical, nursing, pharmacy, security, day and night staff directly from database
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {totalEmployeesCount} Total Registered
              </span>
            </div>

            {/* Role Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-5">
              
              {/* Doctors */}
              <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Doctors</span>
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">{roleDist.doctors}</div>
                  <div className="text-[10px] font-bold text-sky-700 mt-0.5">
                    {totalEmployeesCount > 0 ? ((roleDist.doctors / totalEmployeesCount) * 100).toFixed(0) : 0}% of staff
                  </div>
                </div>
                <div className="w-full bg-sky-200/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-sky-600 h-full rounded-full" 
                    style={{ width: `${totalEmployeesCount > 0 ? (roleDist.doctors / totalEmployeesCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Nurses */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Nurses</span>
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">{roleDist.nurses}</div>
                  <div className="text-[10px] font-bold text-emerald-700 mt-0.5">
                    {totalEmployeesCount > 0 ? ((roleDist.nurses / totalEmployeesCount) * 100).toFixed(0) : 0}% of staff
                  </div>
                </div>
                <div className="w-full bg-emerald-200/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full rounded-full" 
                    style={{ width: `${totalEmployeesCount > 0 ? (roleDist.nurses / totalEmployeesCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Pharmacists */}
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Pharmacists</span>
                  <Pill className="w-4 h-4 text-purple-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">{roleDist.pharmacists}</div>
                  <div className="text-[10px] font-bold text-purple-700 mt-0.5">
                    {totalEmployeesCount > 0 ? ((roleDist.pharmacists / totalEmployeesCount) * 100).toFixed(0) : 0}% of staff
                  </div>
                </div>
                <div className="w-full bg-purple-200/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-purple-600 h-full rounded-full" 
                    style={{ width: `${totalEmployeesCount > 0 ? (roleDist.pharmacists / totalEmployeesCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Security */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Security</span>
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">{roleDist.security}</div>
                  <div className="text-[10px] font-bold text-amber-700 mt-0.5">
                    {totalEmployeesCount > 0 ? ((roleDist.security / totalEmployeesCount) * 100).toFixed(0) : 0}% of staff
                  </div>
                </div>
                <div className="w-full bg-amber-200/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-amber-600 h-full rounded-full" 
                    style={{ width: `${totalEmployeesCount > 0 ? (roleDist.security / totalEmployeesCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Day Workers */}
              <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">Day Workers</span>
                  <Sun className="w-4 h-4 text-orange-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">{roleDist.dayWorkers}</div>
                  <div className="text-[10px] font-bold text-orange-700 mt-0.5">
                    Day Shift Personnel
                  </div>
                </div>
                <div className="w-full bg-orange-200/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-orange-600 h-full rounded-full" 
                    style={{ width: `${totalEmployeesCount > 0 ? (roleDist.dayWorkers / totalEmployeesCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Night Workers */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Night Workers</span>
                  <Moon className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-slate-900">{roleDist.nightWorkers}</div>
                  <div className="text-[10px] font-bold text-indigo-700 mt-0.5">
                    Night Shift Coverage
                  </div>
                </div>
                <div className="w-full bg-indigo-200/60 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full" 
                    style={{ width: `${totalEmployeesCount > 0 ? (roleDist.nightWorkers / totalEmployeesCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Recent Procurement Table (Required by user) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Procurement</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest supply requisitions, pharmaceutical deliveries, and diagnostic equipment orders
                </p>
              </div>
              <button
                onClick={() => onTabChange('hr-procurement')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                View Full Procurement Ledger
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Items</th>
                    <th className="py-3.5 px-6">Amount</th>
                    <th className="py-3.5 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {((stats?.recentProcurements && stats.recentProcurements.length > 0) 
                    ? stats.recentProcurements 
                    : procurements.slice(0, 5)).map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60 transition-colors">
                      {/* Date */}
                      <td className="py-4 px-6 font-mono text-slate-700 whitespace-nowrap">
                        {item.date || new Date().toISOString().split('T')[0]}
                      </td>

                      {/* Items */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{item.items || item.item_name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.department || 'Hospital General'} • Supplier: {item.supplier_name || 'Vendor'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-6 font-black text-slate-900 whitespace-nowrap">
                        ₦{(item.amount || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          item.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'Ordered' || item.status === 'Approved'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : item.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {item.status || 'Delivered'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {(!stats?.recentProcurements || stats.recentProcurements.length === 0) && procurements.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No procurement records found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUBTAB: EMPLOYEES DIRECTORY (EMPLOYEE MANAGEMENT)                      */}
      {/* ========================================================================= */}
      {normalizedSubTab === 'employees' && (
        <div className="space-y-6" id="employee-management-view">
          {/* Employee Management Heading & Add Employee Action */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Employee Management</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  {employees.length} Total Staff
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Role-categorized hospital workforce registry with contact info, registration dates, and document metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="add-employee-top-btn"
                onClick={() => {
                  setEditingEmployee(null);
                  setEmployeeForm({
                    name: '',
                    role: 'Nurse',
                    department: 'Nursing',
                    email: '',
                    phone: '',
                    shift: 'Day',
                    status: 'Active',
                    salary: 350000,
                    hire_date: new Date().toISOString().split('T')[0],
                    date_joined: new Date().toISOString().split('T')[0],
                    documents_count: 0
                  });
                  setShowAddEmployeeModal(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </button>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, phone, email across all role tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* 1. DOCTORS TABLE */}
          {renderEmployeeCategoryTable(
            "Doctors",
            <Stethoscope className="w-4 h-4 text-sky-600" />,
            employees.filter(e => (e.role || '').toLowerCase().includes('doctor')),
            "bg-sky-50 border border-sky-100"
          )}

          {/* 2. NURSES TABLE */}
          {renderEmployeeCategoryTable(
            "Nurses",
            <Building2 className="w-4 h-4 text-emerald-600" />,
            employees.filter(e => (e.role || '').toLowerCase().includes('nurse')),
            "bg-emerald-50 border border-emerald-100"
          )}

          {/* 3. PHARMACISTS TABLE */}
          {renderEmployeeCategoryTable(
            "Pharmacists",
            <Pill className="w-4 h-4 text-amber-600" />,
            employees.filter(e => (e.role || '').toLowerCase().includes('pharmacist')),
            "bg-amber-50 border border-amber-100"
          )}

          {/* 4. SECURITIES TABLE */}
          {renderEmployeeCategoryTable(
            "Securities",
            <ShieldCheck className="w-4 h-4 text-purple-600" />,
            employees.filter(e => (e.role || '').toLowerCase().includes('security') || (e.role || '').toLowerCase().includes('guard')),
            "bg-purple-50 border border-purple-100"
          )}

          {/* 5. DAY WORKERS TABLE */}
          {renderEmployeeCategoryTable(
            "Day workers",
            <Sun className="w-4 h-4 text-amber-500" />,
            employees.filter(e => {
              const role = (e.role || '').toLowerCase();
              const shift = (e.shift || '').toLowerCase();
              if (role.includes('day worker') || role === 'day') return true;
              if (shift === 'day' && !role.includes('doctor') && !role.includes('nurse') && !role.includes('pharmacist') && !role.includes('security') && !role.includes('guard')) {
                return true;
              }
              return false;
            }),
            "bg-amber-50/80 border border-amber-200/60"
          )}

          {/* 6. NIGHT WORKERS TABLE */}
          {renderEmployeeCategoryTable(
            "Night workers",
            <Moon className="w-4 h-4 text-indigo-600" />,
            employees.filter(e => {
              const role = (e.role || '').toLowerCase();
              const shift = (e.shift || '').toLowerCase();
              if (role.includes('night worker') || role === 'night') return true;
              if (shift === 'night' && !role.includes('doctor') && !role.includes('nurse') && !role.includes('pharmacist') && !role.includes('security') && !role.includes('guard')) {
                return true;
              }
              return false;
            }),
            "bg-indigo-50 border border-indigo-100"
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUBTAB: ABSENCES & LEAVE REQUESTS                                     */}
      {/* ========================================================================= */}
      {normalizedSubTab === 'absences' && (
        <div className="space-y-6">
          {/* Header & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Absence Tracker</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track staff absence frequency, category reasons, and record daily shift attendance status
              </p>
            </div>
            <button
              onClick={() => {
                setAbsenceForm({
                  employee_name: '',
                  employee_id: '',
                  department: 'Medical',
                  date: '2026-08-18',
                  status: 'Sick Leave',
                  reason: ''
                });
                setShowAddAbsenceModal(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Record Absence
            </button>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl w-fit border border-slate-200/60">
            {(['Daily', 'Weekly', 'Monthly', 'Yearly'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setAbsenceTimeframe(tf)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  absenceTimeframe === tf
                    ? 'bg-white text-sky-700 shadow-xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Absences */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Absences</span>
                <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-black text-slate-900">
                {absences.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">All logged staff records</div>
            </div>

            {/* Sick Leave */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Sick Leave</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-black text-amber-600">
                {absences.filter(a => (a.status || a.leave_type || '').toLowerCase().includes('sick')).length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Medical & GP certified</div>
            </div>

            {/* Personal Leave */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Personal Leave</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-black text-blue-600">
                {absences.filter(a => {
                  const s = (a.status || a.leave_type || '').toLowerCase();
                  return s.includes('personal') || s.includes('casual');
                }).length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Bereavement & personal</div>
            </div>

            {/* Unauthorized */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Unauthorized</span>
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-black text-rose-600">
                {absences.filter(a => (a.status || a.leave_type || '').toLowerCase().includes('unauthorized')).length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">No-show & unexcused</div>
            </div>
          </div>

          {/* Absence Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">Absence Records</h3>
                <p className="text-xs text-slate-500 mt-0.5">Chronological log of staff absences across hospital departments</p>
              </div>
              <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                {absences.length} Total Records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Employee</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Reason</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {absences.map((abs) => {
                    const displayDate = (() => {
                      const d = abs.date || abs.start_date || abs.applied_at;
                      if (!d) return '—';
                      if (d.includes('/')) return d;
                      const parts = d.split('T')[0].split('-');
                      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                      return d;
                    })();

                    const statusStr = abs.status || abs.leave_type || 'Sick Leave';
                    const isSick = statusStr.toLowerCase().includes('sick');
                    const isPersonal = statusStr.toLowerCase().includes('personal') || statusStr.toLowerCase().includes('casual');
                    const isUnauthorized = statusStr.toLowerCase().includes('unauthorized');
                    const isVacation = statusStr.toLowerCase().includes('vacation') || statusStr.toLowerCase().includes('annual');

                    return (
                      <tr key={abs.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6 font-mono font-medium text-slate-700 whitespace-nowrap">
                          {displayDate}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">{abs.employee_name}</div>
                          {abs.department && (
                            <div className="text-[11px] text-slate-400 font-medium">{abs.department}</div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                            isSick
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isPersonal
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : isUnauthorized
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isVacation
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {statusStr}
                          </span>
                        </td>
                        <td className="py-4 px-6 max-w-sm text-slate-700 font-medium">
                          {abs.reason || '—'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteAbsence(abs.id, abs.employee_name)}
                            title="Delete absence record"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {absences.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                        No absence records logged in the database. Click "Record Absence" to add a new record.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUBTAB: RECRUITMENT & CANDIDATES                                       */}
      {/* ========================================================================= */}
      {normalizedSubTab === 'recruitment' && (
        <div className="space-y-6">
          {/* Job Openings Section */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Job Openings & Vacancies ({jobOpenings.length})</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage clinical, nursing, technical and administrative vacancies</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Status Filter Tabs */}
                <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 text-xs font-bold">
                  {(['All', 'Open', 'Closed'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setJobStatusFilter(filter)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        jobStatusFilter === filter
                          ? 'bg-white text-sky-700 shadow-xs font-extrabold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                      }`}
                    >
                      {filter} {filter === 'Open' ? `(${jobOpenings.filter(j => j.status === 'Open').length})` : filter === 'Closed' ? `(${jobOpenings.filter(j => j.status === 'Closed').length})` : `(${jobOpenings.length})`}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddJobModal(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Post New Opening
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {jobOpenings
                .filter((job) => {
                  if (jobStatusFilter === 'Open') return job.status === 'Open';
                  if (jobStatusFilter === 'Closed') return job.status === 'Closed';
                  return true;
                })
                .map((job) => {
                  const isOpen = job.status === 'Open';
                  return (
                    <div 
                      key={job.id} 
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isOpen 
                          ? 'border-slate-200/80 bg-white shadow-xs hover:shadow-md' 
                          : 'border-slate-200 bg-slate-50/70 opacity-90'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200/60">
                            {job.department}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isOpen
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              {isOpen ? 'Open Vacancy' : 'Closed'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {job.openings_count} Slot{job.openings_count > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-black text-slate-900 text-sm mt-3.5 leading-snug">{job.title}</h3>
                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {job.description || 'General hospital clinical position and departmental staff opening.'}
                        </p>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                          <span>Exp: <strong className="text-slate-800">{job.experience_required || 'Not specified'}</strong></span>
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">{job.employment_type}</span>
                        </div>
                      </div>

                      {/* Action buttons including Open/Close Vacancy */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleToggleJobStatus(job)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                            isOpen
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                          }`}
                        >
                          {isOpen ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              Close Vacancy
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              Open Vacancy
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          title="Delete vacancy"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {jobOpenings.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-medium">
                No job openings recorded. Click "Post New Opening" to add a vacancy.
              </div>
            )}
          </div>

          {/* Candidates Pipeline Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Recruitment Applicants & Pipeline ({candidates.length})</h2>
                <p className="text-xs text-slate-500 mt-0.5">Track candidate screening, interview rounds, and job offers</p>
              </div>
              <button
                onClick={() => setShowAddCandidateModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Applicant Record
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Candidate Name</th>
                    <th className="py-3.5 px-6">Role Applied</th>
                    <th className="py-3.5 px-6">Contact Info</th>
                    <th className="py-3.5 px-6">Experience</th>
                    <th className="py-3.5 px-6">Stage</th>
                    <th className="py-3.5 px-6 text-right">Advance Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {candidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{cand.candidate_name}</div>
                        <div className="text-[11px] text-slate-500">Applied: {cand.applied_date}</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {cand.job_title || cand.role_applied}
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        <div>{cand.phone}</div>
                        <div className="text-[11px] text-slate-400">{cand.email}</div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-700">
                        {cand.experience_years} years
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          cand.stage === 'Offered' || cand.stage === 'Hired'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : cand.stage === 'Interview'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : cand.stage === 'Screening'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {cand.stage}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <select
                          value={cand.stage}
                          onChange={(e) => handleUpdateCandidateStage(cand.id, e.target.value, cand.candidate_name)}
                          className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 font-bold focus:outline-none"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Screening">Screening</option>
                          <option value="Interview">Interview</option>
                          <option value="Offered">Offered</option>
                          <option value="Hired">Hired</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SUBTAB: PROCUREMENTS LEDGER                                           */}
      {/* ========================================================================= */}
      {normalizedSubTab === 'procurement' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Requisitions</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{procurements.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tracked hospital orders</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Spend</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                ₦{procurements.reduce((sum, p) => sum + (Number(p.amount) || ((p.quantity || 1) * (p.unit_price || 0))), 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-0.5">Procurement budget</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Delivered & Stocked</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {procurements.filter(p => p.status === 'Delivered').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Completed deliveries</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Progress / Pending</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {procurements.filter(p => p.status !== 'Delivered' && p.status !== 'Cancelled').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Active fulfillment</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Hospital Procurement & Supplies Ledger ({procurements.length})</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Itemized procurement history per order with category breakdown, unit pricing, and fulfillment state
                </p>
              </div>
              <button
                onClick={() => setShowAddProcurementModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Procurement Order
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Item</th>
                    <th className="py-3.5 px-6">Category</th>
                    <th className="py-3.5 px-6">Quantity</th>
                    <th className="py-3.5 px-6">Price/Unit</th>
                    <th className="py-3.5 px-6">Total</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {procurements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Boxes className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                        No procurement records found in the database.
                      </td>
                    </tr>
                  ) : (
                    procurements.map((proc) => (
                      <tr key={proc.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-[13px]">{proc.item_name || proc.items}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {proc.date ? `Date: ${proc.date}` : ''} {proc.supplier_name ? `• ${proc.supplier_name}` : ''} {proc.department ? `• ${proc.department}` : ''}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                            {proc.category || 'Medical Supplies'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800 whitespace-nowrap">
                          {proc.quantity || 1}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700 whitespace-nowrap">
                          ₦{Number(proc.unit_price || (proc.amount && proc.quantity ? proc.amount / proc.quantity : proc.amount) || 0).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-black text-slate-900 whitespace-nowrap">
                          ₦{Number(proc.amount || ((proc.quantity || 1) * (proc.unit_price || 0))).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            proc.status === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : proc.status === 'Ordered' || proc.status === 'Approved'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : proc.status === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {proc.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <select
                              value={proc.status}
                              onChange={(e) => handleUpdateProcurementStatus(proc.id, e.target.value)}
                              className="px-2.5 py-1 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700 font-bold focus:outline-none cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Approved">Approved</option>
                              <option value="Ordered">Ordered</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => handleDeleteProcurement(proc.id, proc.item_name || proc.items)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SUBTAB: DISCOUNTS & STAFF SCHEMES                                      */}
      {/* ========================================================================= */}
      {normalizedSubTab === 'discounts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Staff & Patient Welfare Discount Policies ({discounts.length})</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Standardized hospital subsidy schemes, staff medical benefits, and compassionate fee waivers
                </p>
              </div>
              <button
                onClick={() => setShowAddDiscountModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Discount Policy
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {discounts.map((disc) => (
                <div key={disc.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      {disc.category}
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {disc.percentage}% OFF
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-sm mt-3">{disc.title}</h3>
                  <div className="mt-1 font-mono text-xs text-slate-500 font-bold">Code: {disc.discount_code || 'N/A'}</div>
                  <p className="text-xs text-slate-600 mt-2">{disc.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-500 flex flex-col gap-1">
                    <div><strong className="text-slate-700">Applies to:</strong> {disc.applicable_service}</div>
                    <div><strong className="text-slate-700">Authorized by:</strong> {disc.authorized_by}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* ADD EMPLOYEE MODAL */}
      <AnimatePresence>
        {showAddEmployeeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter the staff details to register in the hospital database.
                  </p>
                </div>
                <button onClick={() => setShowAddEmployeeModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEmployee} className="space-y-4 mt-5">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    placeholder="Employee name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors cursor-pointer"
                  >
                    <option value="Nurse">Nurse</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Security">Security</option>
                    <option value="Day Worker">Day Worker</option>
                    <option value="Night Worker">Night Worker</option>
                  </select>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    placeholder="080XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    placeholder="employee@hospital.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors"
                  />
                </div>

                {/* Modal Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddEmployeeModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors shadow-sm cursor-pointer"
                  >
                    {editingEmployee ? 'Save Changes' : 'Add Employee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RECORD NEW ABSENCE MODAL */}
      <AnimatePresence>
        {showAddAbsenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Record New Absence</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Record a staff member absence or leave event in the system</p>
                </div>
                <button onClick={() => setShowAddAbsenceModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAbsence} className="space-y-4 mt-4">
                {/* Employee Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Employee *</label>
                  <select
                    required
                    value={absenceForm.employee_name}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      const emp = employees.find(x => x.name === selectedName);
                      setAbsenceForm({
                        ...absenceForm,
                        employee_name: selectedName,
                        employee_id: emp ? emp.id : '',
                        department: emp ? emp.department : absenceForm.department
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="">Select employee...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.role} {emp.department ? `· ${emp.department}` : ''})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={absenceForm.date}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                {/* Status Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status *</label>
                  <select
                    required
                    value={absenceForm.status}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal Leave">Personal Leave</option>
                    <option value="Unauthorized">Unauthorized</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Study Leave">Study Leave</option>
                  </select>
                </div>

                {/* Reason Textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Reason *</label>
                  <textarea
                    required
                    rows={3}
                    value={absenceForm.reason}
                    onChange={(e) => setAbsenceForm({ ...absenceForm, reason: e.target.value })}
                    placeholder="Reason for absence"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddAbsenceModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-colors cursor-pointer shadow-xs"
                  >
                    Record Absence
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD JOB OPENING MODAL */}
      <AnimatePresence>
        {showAddJobModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Publish New Job Opening</h3>
                <button onClick={() => setShowAddJobModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveJob} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Position Title *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    placeholder="e.g. Senior Pediatrician"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={jobForm.department}
                      onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Openings Count</label>
                    <input
                      type="number"
                      value={jobForm.openings_count}
                      onChange={(e) => setJobForm({ ...jobForm, openings_count: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={jobForm.employment_type}
                      onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Shift / Night">Shift / Night</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Experience Required</label>
                    <input
                      type="text"
                      value={jobForm.experience_required}
                      onChange={(e) => setJobForm({ ...jobForm, experience_required: e.target.value })}
                      placeholder="e.g. 3+ years"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Job Description & Responsibilities</label>
                  <textarea
                    rows={3}
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    placeholder="Key responsibilities and qualifications..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddJobModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700"
                  >
                    Post Opening
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD CANDIDATE MODAL */}
      <AnimatePresence>
        {showAddCandidateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Add Applicant / Candidate</h3>
                <button onClick={() => setShowAddCandidateModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCandidate} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Candidate Full Name *</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.candidate_name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, candidate_name: e.target.value })}
                    placeholder="e.g. Dr. Kelechi Nwosu"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Role / Position Applied</label>
                    <input
                      type="text"
                      value={candidateForm.role_applied}
                      onChange={(e) => setCandidateForm({ ...candidateForm, role_applied: e.target.value })}
                      placeholder="Doctor, ICU Nurse, Pharmacist"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={candidateForm.experience_years}
                      onChange={(e) => setCandidateForm({ ...candidateForm, experience_years: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone</label>
                    <input
                      type="text"
                      value={candidateForm.phone}
                      onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                      placeholder="+234 803 000 0000"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={candidateForm.email}
                      onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                      placeholder="candidate@email.com"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddCandidateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700"
                  >
                    Save Candidate Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD PROCUREMENT MODAL */}
      <AnimatePresence>
        {showAddProcurementModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Record Procurement Requisition</h3>
                <button onClick={() => setShowAddProcurementModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProcurement} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Item(s) Name / Description *</label>
                    <input
                      type="text"
                      required
                      value={procurementForm.items}
                      onChange={(e) => setProcurementForm({ ...procurementForm, items: e.target.value, item_name: e.target.value })}
                      placeholder="e.g. Digital BP Monitors (x10)"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={procurementForm.category}
                      onChange={(e) => setProcurementForm({ ...procurementForm, category: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
                    >
                      <option value="Medical Supplies">Medical Supplies</option>
                      <option value="Diagnostic Equipment">Diagnostic Equipment</option>
                      <option value="Pharmaceuticals">Pharmaceuticals</option>
                      <option value="Consumables">Consumables</option>
                      <option value="Facility & Linen">Facility & Linen</option>
                      <option value="Surgical Equipment">Surgical Equipment</option>
                      <option value="Laboratory Reagents">Laboratory Reagents</option>
                      <option value="Office & Admin">Office & Admin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={procurementForm.quantity}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value, 10) || 1;
                        setProcurementForm({ ...procurementForm, quantity: qty, amount: qty * procurementForm.unit_price });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price (₦)</label>
                    <input
                      type="number"
                      value={procurementForm.unit_price}
                      onChange={(e) => {
                        const unit = parseFloat(e.target.value) || 0;
                        setProcurementForm({ ...procurementForm, unit_price: unit, amount: procurementForm.quantity * unit });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Amount (₦)</label>
                    <input
                      type="number"
                      value={procurementForm.amount}
                      onChange={(e) => setProcurementForm({ ...procurementForm, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black text-sky-700 bg-sky-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={procurementForm.status}
                      onChange={(e) => setProcurementForm({ ...procurementForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="Ordered">Ordered</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Supplier Name</label>
                    <input
                      type="text"
                      value={procurementForm.supplier_name}
                      onChange={(e) => setProcurementForm({ ...procurementForm, supplier_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={procurementForm.department}
                      onChange={(e) => setProcurementForm({ ...procurementForm, department: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddProcurementModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700"
                  >
                    Record Requisition
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD DISCOUNT MODAL */}
      <AnimatePresence>
        {showAddDiscountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="text-lg font-black text-slate-900">Define Staff / Welfare Discount Policy</h3>
                <button onClick={() => setShowAddDiscountModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveDiscount} className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Policy Title *</label>
                  <input
                    type="text"
                    required
                    value={discountForm.title}
                    onChange={(e) => setDiscountForm({ ...discountForm, title: e.target.value })}
                    placeholder="e.g. Hospital Staff Medical Welfare Benefit"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Discount Code</label>
                    <input
                      type="text"
                      value={discountForm.discount_code}
                      onChange={(e) => setDiscountForm({ ...discountForm, discount_code: e.target.value.toUpperCase() })}
                      placeholder="e.g. STAFF50"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Percentage (% OFF)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountForm.percentage}
                      onChange={(e) => setDiscountForm({ ...discountForm, percentage: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Applicable Hospital Services</label>
                  <input
                    type="text"
                    value={discountForm.applicable_service}
                    onChange={(e) => setDiscountForm({ ...discountForm, applicable_service: e.target.value })}
                    placeholder="All Consultations, Routine Diagnostics & In-House Pharmacy"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={discountForm.description}
                    onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                    placeholder="Details about eligibility and authorization requirements..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddDiscountModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700"
                  >
                    Activate Policy
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Icon helper
function LayoutDashboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
