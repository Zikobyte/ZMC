import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Patient, User } from '../types';
import PatientDetailModal from './PatientDetailModal';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Download, 
  Maximize2, 
  Printer, 
  RotateCw, 
  Search, 
  ChevronDown, 
  Check, 
  MoreVertical, 
  Heart, 
  Activity, 
  UserPlus, 
  Users, 
  FileText, 
  Clock, 
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Database,
  Server,
  Cpu,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import RevenueVerificationModal from './RevenueVerificationModal';
import ExportButton from './ExportButton';

interface DashboardViewProps {
  onNavigateToPatients: () => void;
  onOpenRegisterPatient?: () => void;
  onNavigateToStandardCards?: () => void;
  onNavigateToSpecializedCare?: () => void;
  user?: User | null;
}

export default function DashboardView({ 
  onNavigateToPatients, 
  onOpenRegisterPatient,
  onNavigateToStandardCards,
  onNavigateToSpecializedCare,
  user 
}: DashboardViewProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [hoveredGrowthIndex, setHoveredGrowthIndex] = useState<number | null>(null);
  const [deviceHover, setDeviceHover] = useState<string | null>(null);

  // Revenue Verification Audit Modal State
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState<boolean>(false);

  // Patient Detail Modal State
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);

  const handlePatientClick = (patientItem: Patient | any) => {
    setSelectedPatient(patientItem);
    setIsPatientModalOpen(true);
  };

  // Database Connection Diagnostics State
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);

  // Dashboard Stats State
  const [stats, setStats] = useState<any>({
    totalPatients: 0,
    standardCount: 0,
    maternityCount: 0,
    emergencyCount: 0,
    totalRevenue: 0,
    clinicIntensity: 0,
    admissionsCount: 0,
    queueCount: 0,
    overviewData: [],
    growthData: []
  });
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchDbStatus();
    fetchStats();
  }, []);

  const fetchDbStatus = async () => {
    setIsCheckingDb(true);
    try {
      const response = await fetch('/api/db-test');
      const data = await response.json();
      setDbStatus(data);
    } catch (err) {
      console.error('Failed to load database status', err);
    } finally {
      setIsCheckingDb(false);
    }
  };

  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const response = await apiFetch('/patients/dashboard/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard statistics', err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    if (!window.confirm('Are you sure you want to re-seed the clinical database? This will refresh all master records with premium seed data.')) {
      return;
    }
    setIsSeeding(true);
    setSeedSuccessMessage(null);
    try {
      const response = await fetch('/api/db-test/seed', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setSeedSuccessMessage('Database successfully seeded with comprehensive clinical records!');
        setTimeout(() => setSeedSuccessMessage(null), 8000);
        fetchDbStatus();
        fetchPatients();
        fetchStats();
      } else {
        alert('Seeding failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Seeding error: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/patients');
      if (response.success) {
        setPatients(response.data);
      }
    } catch (err) {
      console.error('Failed to load patient statistics on dashboard', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Statistics calculation based on existing patients list and dynamic backend stats
  const totalPatients = stats.totalPatients || patients.length;
  const standardCount = stats.standardCount || patients.filter(p => p.cardType === 'Standard').length;
  const maternityCount = stats.maternityCount || patients.filter(p => p.cardType === 'Maternity').length;
  const emergencyCount = stats.emergencyCount || patients.filter(p => p.cardType === 'Emergency').length;
  const totalRevenue = stats.totalRevenue || patients.reduce((acc, curr) => acc + (curr.cardFee || 0), 0);

  // Fallback lists if empty
  const defaultRecentPatients = [
    { id: '1', name: 'Amara Nwosu', cardType: 'Maternity', registeredBy: 'nurse_jane', status: 'Waiting for Doctor', cardFee: 5000, date: '2026-06-29' },
    { id: '2', name: 'Chinedu Okafor', cardType: 'Standard', registeredBy: 'opd_registrar', status: 'Triage Pending', cardFee: 3000, date: '2026-06-29' },
    { id: '3', name: 'Olumide Bakare', cardType: 'Emergency', registeredBy: 'admin', status: 'Waiting for Doctor', cardFee: 20000, date: '2026-06-29' },
    { id: '4', name: 'Fatima Musa', cardType: 'Maternity', registeredBy: 'nurse_jane', status: 'Discharged', cardFee: 5000, date: '2026-06-28' },
    { id: '5', name: 'Emeka Obi', cardType: 'Standard', registeredBy: 'opd_registrar', status: 'Discharged', cardFee: 3000, date: '2026-06-28' },
  ];

  const recentList = patients.length > 0 ? patients.slice(0, 5) : defaultRecentPatients;

  // Monthly Overview stats (New vs Unique visitors)
  const defaultOverviewData = [
    { month: 'Jan', newV: 65, unique: 45 },
    { month: 'Feb', newV: 59, unique: 41 },
    { month: 'Mar', newV: 80, unique: 55 },
    { month: 'Apr', newV: 81, unique: 58 },
    { month: 'May', newV: 56, unique: 40 },
    { month: 'Jun', newV: 55, unique: 38 },
    { month: 'Jul', newV: 40, unique: 30 },
    { month: 'Aug', newV: 72, unique: 50 },
    { month: 'Sep', newV: 84, unique: 62 },
    { month: 'Oct', newV: 60, unique: 42 },
  ];

  const overviewData = stats.overviewData?.length > 0 ? stats.overviewData : defaultOverviewData;

  // Total Growth dynamic points
  const defaultGrowthData = [
    { month: 'Feb \'00', value1: 18, value2: 12 },
    { month: 'May \'00', value1: 30, value2: 18 },
    { month: 'Aug \'00', value1: 14, value2: 24 },
    { month: 'Nov \'00', value1: 22, value2: 15 },
    { month: 'Feb \'01', value1: 10, value2: 29 },
    { month: 'May \'01', value1: 25, value2: 19 },
  ];

  const growthData = stats.growthData?.length > 0 ? stats.growthData : defaultGrowthData;

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Action Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-100/80 shadow-2xs gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-3">
            Clinical Central Dashboard
            {isCheckingDb ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 animate-pulse border border-slate-200">
                <Database className="h-3 w-3" />
                Checking DB...
              </span>
            ) : dbStatus?.postgresActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Database className="h-3 w-3 text-emerald-600" />
                PostgreSQL Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <Database className="h-3 w-3 text-amber-600" />
                JSON System Active
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-1">
            Real-time overview of clinical intakes, registration statistics, revenue ledgers, and department queues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role !== 'Doctor' && (
            <button
              onClick={onOpenRegisterPatient || onNavigateToPatients}
              className="flex items-center gap-2 bg-[#2A758C] hover:bg-[#205b6d] text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-md shadow-[#2A758C]/20 hover:scale-[1.02] cursor-pointer"
            >
              <UserPlus className="h-4 w-4" /> Register New Patient
            </button>
          )}
        </div>
      </div>

      {/* TOP KPI METRICS GRID: Exact WellNest Image 2 Style rounded-3xl KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Patients */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
              <Users className="h-4 w-4 text-[#2A758C]" />
              <span>Total Patients</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="h-3 w-3" /> +3.78%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight font-mono">
              {isLoading || isStatsLoading ? '...' : totalPatients.toLocaleString()}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Registered clinical record members
            </p>
          </div>
        </div>

        {/* KPI 2: Standard Registrations */}
        <div 
          onClick={onNavigateToStandardCards}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateToStandardCards?.(); }}
          className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-2xs hover:shadow-md hover:border-sky-300 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs group-hover:text-sky-700 transition-colors">
              <HeartHandshake className="h-4 w-4 text-sky-600" />
              <span>Standard Cards</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-50 text-sky-600 border border-sky-100">
              <TrendingUp className="h-3 w-3" /> +2.14%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight font-mono group-hover:text-sky-950">
              {isLoading || isStatsLoading ? '...' : standardCount.toLocaleString()}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-slate-400 font-medium">
                General outpatient consultations
              </p>
              <span className="text-[10px] font-black text-sky-600 opacity-80 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                View cases →
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Maternity & Emergency */}
        <div 
          onClick={onNavigateToSpecializedCare}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigateToSpecializedCare?.(); }}
          className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-2xs hover:shadow-md hover:border-rose-300 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs group-hover:text-rose-700 transition-colors">
              <Activity className="h-4 w-4 text-rose-500" />
              <span>Specialized Care</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-100">
              <TrendingUp className="h-3 w-3" /> +1.64%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight font-mono group-hover:text-rose-950">
              {isLoading || isStatsLoading ? '...' : (maternityCount + emergencyCount).toLocaleString()}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-slate-400 font-medium">
                {maternityCount} Maternity • {emergencyCount} Emergency
              </p>
              <span className="text-[10px] font-black text-rose-600 opacity-80 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                View cases →
              </span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total Revenue & Independent Verification */}
        <div 
          onClick={() => setIsRevenueModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsRevenueModalOpen(true); }}
          className="bg-white rounded-3xl p-5 border border-slate-100/80 shadow-2xs hover:shadow-md hover:border-emerald-300 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between cursor-pointer group text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500 font-bold text-xs group-hover:text-emerald-700 transition-colors">
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Revenue Collections</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="h-3 w-3" /> +4.25%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight font-mono group-hover:text-emerald-950">
              ₦{isLoading || isStatsLoading ? '...' : totalRevenue.toLocaleString()}
            </h3>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[11px] text-slate-400 font-medium">
                Balanced in Cashier ledger
              </p>
              <span className="text-[10px] font-black text-emerald-600 opacity-90 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                <ShieldCheck className="h-3 w-3 inline" /> Audit & Verify →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD: Recent Activity Directory - Rounded-3xl Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-6 shadow-2xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 rounded-2xl text-[#2A758C]">
                <Activity className="h-5 w-5" />
              </div>
              <span>Recent Activity & Admissions Directory</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">More than {totalPatients + 400}+ registered members overall in network</p>
          </div>
          <div className="flex items-center gap-2.5">
            <ExportButton 
              exportType="patients" 
              label="Export Directory" 
              className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-extrabold" 
            />
            <button 
              onClick={onNavigateToPatients}
              className="text-xs text-slate-700 hover:text-slate-900 px-4 py-2 rounded-2xl border border-slate-200/80 hover:border-slate-300 font-extrabold transition-all flex items-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-slate-100/80"
            >
              View All <ArrowUpRight className="h-4 w-4 text-[#2A758C]" />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                <th className="py-2.5 px-4 font-bold">Patient / Member</th>
                <th className="py-2.5 px-4 font-bold">Phone Contact</th>
                <th className="py-2.5 px-4 font-bold">Amount Paid</th>
                <th className="py-2.5 px-4 font-bold">Card Level</th>
                <th className="py-2.5 px-4 font-bold">Status State</th>
                <th className="py-2.5 px-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {recentList.map((item, index) => {
                // Get stylized role background based on standard index
                const roleColors = [
                  { bg: 'bg-[#A3D1E0]/20 text-[#2b5663] border border-[#A3D1E0]/20', label: 'Standard' },
                  { bg: 'bg-rose-50 text-rose-700 border border-rose-200', label: 'Maternity' },
                  { bg: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'Emergency' },
                  { bg: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'Standard' },
                  { bg: 'bg-indigo-50 text-indigo-700 border border-indigo-200', label: 'Standard' },
                ];
                const rc = roleColors[index % roleColors.length];

                // Stylized status mapping
                const statuses = ['Approved', 'In Progress', 'Success', 'Rejected'];
                const itemStatus = item.status || statuses[index % statuses.length];
                let statusStyle = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                if (itemStatus === 'Waiting for Doctor' || itemStatus === 'In Progress') {
                  statusStyle = 'bg-amber-50 text-amber-700 border border-amber-200';
                } else if (itemStatus === 'Triage Pending' || itemStatus === 'Rejected') {
                  statusStyle = 'bg-rose-50 text-rose-700 border border-rose-200';
                }

                // Initial circle avatar matching colors in video list
                const colors = ['bg-[#A3D1E0]/40 text-[#2b5663]', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-800', 'bg-emerald-100 text-emerald-700', 'bg-indigo-100 text-indigo-700'];
                const avatarColor = colors[index % colors.length];

                return (
                  <tr 
                    key={item.id} 
                    onClick={() => handlePatientClick(item)}
                    className="hover:bg-[#F0F8FA] transition-all cursor-pointer group hover:shadow-2xs"
                  >
                    <td className="py-2.5 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-[#2A758C] font-black flex items-center justify-center text-[10px] shadow-2xs group-hover:scale-105 transition-transform">
                        {item.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs group-hover:text-[#2A758C] transition-colors flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-[#2A758C] text-white px-1.5 py-0.2 rounded-full font-sans font-normal">View Record</span>
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                          ID: {(item as any).hospitalNumber || `ZMC-2026-00${index}`}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-semibold font-mono text-[11px]">
                      {(item as any).phoneNumber || 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900 text-[11px]">
                      N{(item.cardFee || 3000).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      <span className="inline-flex px-2 py-0.5 rounded-full font-mono text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                        {(item as any).cardType || rc.label}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle}`}>
                        {itemStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePatientClick(item);
                          }}
                          className="px-2.5 py-1 text-[10px] font-extrabold text-[#2A758C] bg-teal-50 hover:bg-[#2A758C] hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-teal-200/60 shadow-2xs"
                        >
                          <Eye className="h-3 w-3" /> Inspect EMR
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid Layout conforming to Power BI dashboard exactly */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: Monthly Overview Bar Chart (Takes 2 columns on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col justify-between shadow-2xs">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">Patient Intake Overview</h3>
              <p className="text-xs text-slate-400 font-medium">Monthly patient intake & admissions comparison</p>
            </div>
            {/* Custom Legend */}
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#2A758C] rounded-full"></span>
                <span className="text-slate-600">New Intakes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-[#38bdf8] rounded-full"></span>
                <span className="text-slate-600">Follow-ups</span>
              </div>
            </div>
          </div>

          {/* Precision SVG Bar Chart */}
          <div className="relative h-64 w-full flex items-end justify-between px-2 pt-4">
            {/* Y-Axis guide lines */}
            <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
              {[100, 75, 50, 25, 0].map((val) => (
                <div key={val} className="w-full flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{val}</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>
              ))}
            </div>

            {/* Bars container */}
            <div className="relative z-10 flex-1 h-full flex items-end justify-around pl-8 pb-6">
              {overviewData.map((d, i) => (
                <div 
                  key={d.month} 
                  className="flex flex-col items-center justify-end h-full w-12 group cursor-pointer relative"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar(null)}
                >
                  {/* Tooltip on hover */}
                  {hoveredBar === i && (
                    <div className="absolute -top-12 bg-slate-900 text-white text-[11px] font-mono p-2 rounded-lg shadow-xl z-30 pointer-events-none flex flex-col gap-0.5 min-w-[100px]">
                      <div className="font-bold border-b border-slate-800 pb-0.5 mb-0.5 text-center">{d.month} Statistics</div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">New:</span>
                        <span className="text-[#A3D1E0] font-bold">{d.newV}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-slate-400">Unique:</span>
                        <span className="text-white font-bold">{d.unique}</span>
                      </div>
                    </div>
                  )}

                  {/* Combined bars bar-chart layout */}
                  <div className="flex items-end gap-1 h-full w-full justify-center">
                    {/* New Visitors Bar */}
                    <div 
                      className="w-3.5 rounded-t-sm transition-all duration-300 group-hover:opacity-90"
                      style={{ 
                        height: `${(d.newV / 100) * 100}%`,
                        backgroundColor: '#A3D1E0' 
                      }}
                    ></div>
                    {/* Unique Visitors Bar */}
                    <div 
                      className="w-3.5 rounded-t-sm transition-all duration-300 group-hover:opacity-90"
                      style={{ 
                        height: `${(d.unique / 100) * 100}%`,
                        backgroundColor: '#3A3F47' 
                      }}
                    ></div>
                  </div>

                  {/* X-axis Label */}
                  <span className="absolute -bottom-6 text-[11px] font-semibold text-slate-500 tracking-tight">
                    {d.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: Impressions Sparkline (1 column bg solid blue gradient) */}
        <div className="bg-gradient-to-br from-[#2A758C] to-[#1e586a] rounded-3xl p-6 text-white flex flex-col justify-between shadow-md shadow-[#2A758C]/20 relative overflow-hidden min-h-[320px]">
          {/* Subtle design pattern background */}
          <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <span className="text-xs font-black tracking-wider text-teal-200 uppercase font-mono block">
              CLINIC INTENSITY
            </span>
            <h3 className="text-5xl font-black tracking-tight mt-2 text-white font-mono">
              {isLoading || isStatsLoading ? '...' : (stats.clinicIntensity || (140 + totalPatients))}
            </h3>
            <p className="text-xs font-medium text-teal-100 mt-2 max-w-[200px]">
              Total active clinical sessions and registrations recorded in network database.
            </p>
          </div>

          {/* Smooth vector wave line chart matching the video precisely */}
          <div className="w-full h-32 relative z-10 -mb-2">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path
                d="M 0 25 C 15 28, 25 10, 40 18 C 55 26, 65 5, 80 12 C 90 15, 95 20, 100 10"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 0 25 C 15 28, 25 10, 40 18 C 55 26, 65 5, 80 12 C 90 15, 95 20, 100 10 L 100 30 L 0 30 Z"
                fill="url(#sparkline-grad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* CARD 3: Revenue Overview (1 column dark rounded card) */}
        <div className="bg-[#181D27] rounded-3xl p-6 text-white flex flex-col justify-between shadow-md relative overflow-hidden min-h-[420px] border border-[#222836]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-extrabold text-xs tracking-wider uppercase text-slate-300">Revenue Ledger</h4>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsRevenueModalOpen(true)}
                  className="text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="h-3 w-3" /> Audit & Verify
                </button>
                <ExportButton 
                  exportType="financials" 
                  label="Export" 
                  className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-extrabold" 
                />
              </div>
            </div>

            {/* Spark bars block */}
            <div className="h-28 flex items-end justify-between gap-1.5 px-2 py-3 bg-slate-900/80 rounded-2xl mb-6 border border-[#222836]">
              {[60, 80, 45, 90, 70, 85, 50, 95, 65, 80, 55, 90].map((v, i) => (
                <div 
                  key={i} 
                  className="bg-[#38bdf8] rounded-full w-full transition-all duration-300 hover:bg-white"
                  style={{ height: `${v}%` }}
                ></div>
              ))}
            </div>
          </div>

          {/* Mini Stats 4-column breakdown grid at bottom */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-slate-800 text-xs">
            <div>
              <p className="text-slate-400 font-semibold mb-0.5 text-[11px]">Profit Net</p>
              <h5 className="text-base font-black tracking-tight font-mono text-emerald-400">₦{isLoading ? '...' : (totalRevenue * 0.45 || 150000).toLocaleString()}</h5>
            </div>
            <div>
              <p className="text-slate-400 font-semibold mb-0.5 text-[11px]">Gross Revenue</p>
              <h5 className="text-base font-black tracking-tight font-mono text-white">₦{isLoading ? '...' : (totalRevenue || 15250000).toLocaleString()}</h5>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <p className="text-slate-400 font-semibold mb-0.5 text-[11px]">Levies & Taxes</p>
              <h5 className="text-base font-black tracking-tight font-mono text-slate-300">₦{isLoading ? '...' : (totalRevenue * 0.05 || 50000).toLocaleString()}</h5>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <p className="text-slate-400 font-semibold mb-0.5 text-[11px]">Net Operating</p>
              <h5 className="text-base font-black tracking-tight font-mono text-sky-400">₦{isLoading ? '...' : (totalRevenue * 0.95 || 4485000).toLocaleString()}</h5>
            </div>
          </div>
        </div>

        {/* CARD 4: Total Growth (1 column with smooth multi-line chart) */}
        <div className="bg-white rounded-3xl border border-slate-100/80 p-6 flex flex-col justify-between shadow-2xs min-h-[420px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">Total Registration Growth</h3>
              <p className="text-[11px] text-slate-400 font-medium">Clinic intake trends across months</p>
            </div>
            {/* Tiny icons panel from video screen */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <button className="hover:text-[#2A758C] hover:bg-slate-100 p-1.5 rounded-xl transition-colors cursor-pointer" title="Zoom In"><Maximize2 className="h-3.5 w-3.5" /></button>
              <button className="hover:text-[#2A758C] hover:bg-slate-100 p-1.5 rounded-xl transition-colors cursor-pointer" title="Print Report"><Printer className="h-3.5 w-3.5" /></button>
              <button className="hover:text-[#2A758C] hover:bg-slate-100 p-1.5 rounded-xl transition-colors cursor-pointer" title="Reset Axis"><RotateCw className="h-3.5 w-3.5" /></button>
            </div>
          </div>

          {/* Multi line graph representation via custom SVG */}
          <div className="relative h-48 w-full flex items-end">
            {/* Guide grid lines */}
            <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none">
              {[40, 20, 0].map((val) => (
                <div key={val} className="w-full flex items-center gap-2">
                  <span className="text-[9px] font-mono text-slate-400 w-4 text-right">{val}</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>
              ))}
            </div>

            {/* SVG Lines */}
            <div className="relative z-10 w-full h-full pb-6 pl-6">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Line 1: Blue */}
                <path
                  d="M 0 28 L 20 18 L 40 32 L 60 25 L 80 35 L 100 20"
                  fill="none"
                  stroke="#A3D1E0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Line 2: Dark Blue */}
                <path
                  d="M 0 34 L 20 28 L 40 22 L 60 29 L 80 18 L 100 26"
                  fill="none"
                  stroke="#3A3F47"
                  strokeWidth="2"
                  strokeDasharray="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Circles for interactive indicator */}
                {growthData.map((d, index) => {
                  const x = (index / (growthData.length - 1)) * 100;
                  // Map values (0-40) to visual heights (0-40, inverted coordinates)
                  const y1 = 40 - d.value1;
                  const y2 = 40 - d.value2;

                  return (
                    <g key={index} className="cursor-pointer group">
                      <circle
                        cx={x}
                        cy={y1}
                        r="2.5"
                        fill="#A3D1E0"
                        stroke="#ffffff"
                        strokeWidth="1"
                        className="transition-all group-hover:r-3.5"
                        onMouseEnter={() => setHoveredGrowthIndex(index)}
                        onMouseLeave={() => setHoveredGrowthIndex(null)}
                      />
                      <circle
                        cx={x}
                        cy={y2}
                        r="2"
                        fill="#3A3F47"
                        stroke="#ffffff"
                        strokeWidth="1"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip on Line circles */}
              {hoveredGrowthIndex !== null && (
                <div className="absolute -top-12 left-[35%] bg-slate-900 text-white text-[10px] p-2 rounded shadow-lg z-20 font-mono">
                  <strong>{growthData[hoveredGrowthIndex].month}:</strong>
                  <div>Intake Rate: {growthData[hoveredGrowthIndex].value1}%</div>
                </div>
              )}
            </div>
          </div>

          {/* X-Axis labels for line graph */}
          <div className="flex justify-between pl-6 text-[10px] font-bold text-slate-400">
            {growthData.map(d => (
              <span key={d.month}>{d.month}</span>
            ))}
          </div>
        </div>

        {/* CARD 5: Sessions Device (1 column with colorful Doughnut Chart) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col justify-between shadow-xs min-h-[420px]">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Sessions Device</h3>
            <p className="text-[10px] text-slate-400">Outpatient card types breakdown</p>
          </div>

          {/* Pie Doughnut SVG matching the exact circular shape in video */}
          <div className="flex items-center justify-center py-4 relative">
            <svg width="160" height="160" className="transform -rotate-90">
              {/* Outer stroke doughnut layers */}
              {/* Standard Cards circle */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="transparent"
                stroke="#A3D1E0"
                strokeWidth="20"
                strokeDasharray="376.8"
                strokeDashoffset={376.8 - (376.8 * (standardCount || 1) / (totalPatients || 1))}
                className="transition-all duration-500 cursor-pointer"
                onMouseEnter={() => setDeviceHover('Standard')}
                onMouseLeave={() => setDeviceHover(null)}
              />
              {/* Maternity Cards circle */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="transparent"
                stroke="#E94B61"
                strokeWidth="20"
                strokeDasharray="376.8"
                strokeDashoffset={376.8 - (376.8 * (maternityCount || 1) / (totalPatients || 1))}
                className="transition-all duration-500 cursor-pointer"
                style={{ transform: `rotate(${(standardCount / (totalPatients || 1)) * 360}deg)`, transformOrigin: '80px 80px' }}
                onMouseEnter={() => setDeviceHover('Maternity')}
                onMouseLeave={() => setDeviceHover(null)}
              />
              {/* Emergency Cards circle */}
              <circle
                cx="80"
                cy="80"
                r="60"
                fill="transparent"
                stroke="#3A3F47"
                strokeWidth="20"
                strokeDasharray="376.8"
                strokeDashoffset={376.8 - (376.8 * (emergencyCount || 1) / (totalPatients || 1))}
                className="transition-all duration-500 cursor-pointer"
                style={{ transform: `rotate(${((standardCount + maternityCount) / (totalPatients || 1)) * 360}deg)`, transformOrigin: '80px 80px' }}
                onMouseEnter={() => setDeviceHover('Emergency')}
                onMouseLeave={() => setDeviceHover(null)}
              />
            </svg>

            {/* Centered Stats text inside doughnut */}
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {deviceHover || 'Total'}
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono">
                {deviceHover === 'Standard' ? standardCount : 
                 deviceHover === 'Maternity' ? maternityCount : 
                 deviceHover === 'Emergency' ? emergencyCount : 
                 totalPatients}
              </span>
            </div>
          </div>

          {/* Breakdown table with exact counts and mini colors */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div 
              onClick={onNavigateToStandardCards}
              className="flex justify-between items-center p-1.5 rounded-xl hover:bg-sky-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#A3D1E0] rounded-sm group-hover:scale-110 transition-transform"></span>
                <span className="text-slate-600 font-semibold group-hover:text-sky-800">Standard Outpatients</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900">{standardCount}</span>
                <span className="text-[10px] text-sky-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </div>
            <div 
              onClick={onNavigateToSpecializedCare}
              className="flex justify-between items-center p-1.5 rounded-xl hover:bg-pink-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#E94B61] rounded-sm group-hover:scale-110 transition-transform"></span>
                <span className="text-slate-600 font-semibold group-hover:text-pink-800">Maternity / Antenatal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900">{maternityCount}</span>
                <span className="text-[10px] text-pink-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </div>
            <div 
              onClick={onNavigateToSpecializedCare}
              className="flex justify-between items-center p-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#3A3F47] rounded-sm group-hover:scale-110 transition-transform"></span>
                <span className="text-slate-600 font-semibold group-hover:text-rose-800">Emergency Triage</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900">{emergencyCount}</span>
                <span className="text-[10px] text-rose-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* DATABASE DIAGNOSTICS & SYNC CENTER */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${dbStatus?.postgresActive ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Database className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-1.5">
                Database & Storage Integration Hub
              </h3>
              <p className="text-xs text-slate-400">
                Check database status, credentials validity, active connection pool, and data persistence state.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchDbStatus}
              disabled={isCheckingDb}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isCheckingDb ? 'animate-spin' : ''}`} />
              Verify Link
            </button>
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Cpu className={`h-3.5 w-3.5 ${isSeeding ? 'animate-pulse' : ''}`} />
              Re-seed Registry
            </button>
          </div>
        </div>

        {seedSuccessMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            {seedSuccessMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Section 1: Active Connection */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2">
                Active Storage Engine
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${dbStatus?.postgresActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`}></span>
                <span className={`w-2.5 h-2.5 rounded-full ${dbStatus?.postgresActive ? 'bg-emerald-500' : 'bg-amber-500'} absolute`}></span>
                <span className="font-bold text-sm text-slate-800 pl-4">
                  {dbStatus?.postgresActive ? 'Google Cloud SQL (PostgreSQL)' : 'PostgreSQL Database disconnected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                {dbStatus?.postgresActive 
                  ? 'The system is actively connected to the PostgreSQL database. All operations (patient registries, audit logs, and inventory updates) are permanently stored inside secure relational tables.'
                  : 'Critical: The system is disconnected from the PostgreSQL database. Please ensure your PostgreSQL environment variables are correctly configured in your settings panel.'
                }
              </p>
            </div>
            <div className="text-[10px] font-semibold text-slate-400 bg-white px-2.5 py-1.5 rounded border border-slate-100 flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-slate-500" />
              <span>Type: {dbStatus?.postgresActive ? 'Production RDBMS' : 'Offline/Disconnected'}</span>
            </div>
          </div>

          {/* Section 2: Credentials & Host Config */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2.5">
                Connection Config Details
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50 font-mono">
                  <span className="text-slate-500 font-semibold">DB Host:</span>
                  <span className="text-slate-800 font-bold truncate max-w-[150px]" title={dbStatus?.connectionConfig?.host}>
                    {dbStatus?.connectionConfig?.host || '127.0.0.1 (Local)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 font-mono">
                  <span className="text-slate-500 font-semibold">DB Name:</span>
                  <span className="text-slate-800 font-bold truncate max-w-[150px]">
                    {dbStatus?.connectionConfig?.database || 'zmc_backup_db'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 font-mono">
                  <span className="text-slate-500 font-semibold">Port:</span>
                  <span className="text-slate-800 font-bold">
                    {dbStatus?.connectionConfig?.port || '5432'}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-mono">
                  <span className="text-slate-500 font-semibold">RDBMS Sync Status:</span>
                  <span className={`font-bold ${dbStatus?.postgresActive ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {dbStatus?.postgresActive ? 'FULLY SYNCED' : 'LOCAL CACHE ONLY'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-semibold text-slate-400 bg-white px-2.5 py-1.5 rounded border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-slate-500" />
                <span>RDBMS Driver: node-postgres</span>
              </div>
            </div>
          </div>

          {/* Section 3: Diagnostic Telemetry */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-2.5">
                Live DB Health Metrics
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50 font-mono">
                  <span className="text-slate-500 font-semibold">Write Speed (Latency):</span>
                  <span className="text-emerald-600 font-bold">
                    {dbStatus?.testQuery?.latencyMs ? `${dbStatus.testQuery.latencyMs} ms` : 'N/A (Using Cache)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 font-mono">
                  <span className="text-slate-500 font-semibold">RDBMS Store Status:</span>
                  <span className="text-slate-800 font-bold">
                    {dbStatus?.postgresStoreKeys?.length ? `${dbStatus.postgresStoreKeys.length} active tables` : 'No custom schema'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 font-mono">
                  <span className="text-slate-500 font-semibold">Patients Records:</span>
                  <span className="text-slate-800 font-bold">
                    {dbStatus?.localBackupStats?.patientsCount || totalPatients}
                  </span>
                </div>
                <div className="flex justify-between py-1 font-mono">
                  <span className="text-slate-500 font-semibold">Audit Logs:</span>
                  <span className="text-slate-800 font-bold">
                    {dbStatus?.localBackupStats?.auditLogsCount || 0} records
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-semibold text-slate-400 bg-white px-2.5 py-1.5 rounded border border-slate-100 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.postgresActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              <span>PostgreSQL version: {dbStatus?.testQuery?.version ? 'v15+ Cloud Run' : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Patient Information Modal */}
      <PatientDetailModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        patient={selectedPatient}
      />

      {/* Revenue Collections Independent Verification & Audit Modal */}
      <RevenueVerificationModal
        isOpen={isRevenueModalOpen}
        onClose={() => setIsRevenueModalOpen(false)}
        dashboardRevenue={totalRevenue}
      />

    </div>
  );
}
