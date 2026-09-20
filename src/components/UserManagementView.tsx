import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../utils/api';
import { User, UserRole } from '../types';
import { 
  Users, 
  Plus, 
  Shield, 
  Search, 
  Trash2, 
  Key, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus, 
  X, 
  Activity, 
  Settings, 
  Database, 
  RefreshCw, 
  Download, 
  Server, 
  Check, 
  Lock, 
  Clock, 
  Eye, 
  EyeOff,
  Sliders,
  HardDrive,
  Cpu,
  Globe,
  Layers,
  RotateCcw,
  AlertTriangle,
  FileSpreadsheet,
  FileJson,
  Filter,
  LogIn,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ROLES: UserRole[] = [
  'IT Administrator',
  'OPD Clerk',
  'Cashier',
  'Doctor',
  'Lab Technician',
  'Pharmacist',
  'Nurse',
  'Accountant',
  'HR Manager',
  'Eye Clinic',
  'Administrator',
  'Laboratory Scientist',
  'Management'
];

const DEPARTMENTS = [
  'IT',
  'OPD',
  'Finance',
  'Medical',
  'Laboratory',
  'Pharmacy',
  'Nursing',
  'Accounts',
  'HR',
  'Eye Clinic',
  'Administration'
];

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  details: string;
  timestamp: string;
  ip_address?: string;
}

interface DataStoreItem {
  id: string;
  key: string;
  name: string;
  category: 'Clinical' | 'Billing' | 'System' | 'Inventory' | 'Queue';
  description: string;
  count: number;
  sizeBytes: number;
  serverKey?: string;
  isProtected?: boolean;
}

interface UserManagementViewProps {
  activeSubTab?: string;
  onTabChange?: (tab: string) => void;
  currentUser?: User | null;
}

export default function UserManagementView({
  activeSubTab = 'users',
  onTabChange,
  currentUser
}: UserManagementViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'maintenance' | 'activity-log'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Store Clear & System Reset Modals
  const [storeToClear, setStoreToClear] = useState<DataStoreItem | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isClearLogsModalOpen, setIsClearLogsModalOpen] = useState(false);

  // Add User Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('OPD Clerk');
  const [department, setDepartment] = useState('OPD');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password Reset Form Fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Newly Created User Credential (Top of table card)
  const [newlyCreatedCredential, setNewlyCreatedCredential] = useState<{
    name: string;
    username: string;
    role: string;
    department: string;
    password: string;
    createdAt: string;
  } | null>(null);
  const [showCredentialPassword, setShowCredentialPassword] = useState(false);
  const [copiedCredential, setCopiedCredential] = useState(false);

  // Maintenance State
  const [maintenanceLoading, setMaintenanceLoading] = useState<string | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [serverStats, setServerStats] = useState<any>({});

  // Sync internal activeTab with activeSubTab prop
  useEffect(() => {
    if (activeSubTab === 'maintenance') {
      setActiveTab('maintenance');
    } else if (activeSubTab === 'activity-log') {
      setActiveTab('activity-log');
    } else {
      setActiveTab('users');
    }
  }, [activeSubTab]);

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
    fetchServerStats();
  }, []);

  const handleTabSwitch = (tab: 'users' | 'maintenance' | 'activity-log') => {
    setActiveTab(tab);
    if (onTabChange) {
      if (tab === 'users') onTabChange('users');
      else if (tab === 'maintenance') onTabChange('maintenance');
      else if (tab === 'activity-log') onTabChange('activity-log');
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/users');
      if (response.success && Array.isArray(response.data)) {
        let fetchedList: User[] = response.data;
        // Keep newly created user pinned at index 0 if present in active session
        if (newlyCreatedCredential) {
          const matchIdx = fetchedList.findIndex(
            u => u.username?.toLowerCase() === newlyCreatedCredential.username.toLowerCase()
          );
          if (matchIdx > 0) {
            const [pinned] = fetchedList.splice(matchIdx, 1);
            fetchedList = [pinned, ...fetchedList];
          }
        }
        setUsers(fetchedList);
      }
    } catch (err: any) {
      console.error('Failed to fetch user directory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await apiFetch('/audit-logs');
      if (res.success && Array.isArray(res.data)) {
        setAuditLogs(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    }
  };

  const fetchServerStats = async () => {
    try {
      const res = await apiFetch('/maintenance/vacuum', { method: 'POST' }).catch(() => null);
      if (res && res.stats) {
        setServerStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  };

  // Browser Information
  const browserInfo = useMemo(() => {
    if (typeof navigator === 'undefined') {
      return { browser: 'Web Browser', os: 'Cloud Container', engine: 'Standard Engine' };
    }
    const ua = navigator.userAgent;
    let browser = 'Chrome';
    let os = 'Linux / Web';
    let engine = 'Blink / V8';

    if (ua.includes('Firefox')) {
      browser = 'Mozilla Firefox';
      engine = 'Gecko';
    } else if (ua.includes('Edg/')) {
      browser = 'Microsoft Edge';
      engine = 'Blink / Chromium';
    } else if (ua.includes('Chrome')) {
      const match = ua.match(/Chrome\/([0-9.]+)/);
      browser = match ? `Google Chrome ${match[1].split('.')[0]}` : 'Google Chrome';
      engine = 'Blink / V8';
    } else if (ua.includes('Safari')) {
      browser = 'Apple Safari';
      engine = 'WebKit';
    }

    if (ua.includes('Win')) os = 'Windows NT';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux x86_64';
    else if (ua.includes('Android')) os = 'Android OS';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Safari';

    return { browser, os, engine };
  }, []);

  // System Data Stores List with live counts & byte calculations
  const dataStores = useMemo<DataStoreItem[]>(() => {
    const calcStorage = (key: string, defaultItems: number = 0): { count: number; bytes: number } => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return { count: defaultItems, bytes: defaultItems > 0 ? defaultItems * 420 : 0 };
        const bytes = new Blob([item]).size;
        let count = defaultItems;
        try {
          const parsed = JSON.parse(item);
          if (Array.isArray(parsed)) count = parsed.length;
          else if (typeof parsed === 'object' && parsed !== null) count = Object.keys(parsed).length;
          else count = 1;
        } catch {
          count = 1;
        }
        return { count, bytes };
      } catch {
        return { count: defaultItems, bytes: defaultItems > 0 ? defaultItems * 420 : 0 };
      }
    };

    const patientsCalc = calcStorage('zmc_patients', serverStats.patients || 0);
    const encountersCalc = calcStorage('zmc_encounters', serverStats.encounters || 0);
    const vitalsCalc = calcStorage('zmc_patient_vitals', 0);
    const queueCalc = calcStorage('zmc_patient_queue', 0);
    const consultCalc = calcStorage('zmc_consultations', 0);
    const maternityCalc = calcStorage('zmc_maternity_records', 0);
    const emergencyCalc = calcStorage('zmc_emergency_records', 0);
    const labCalc = calcStorage('zmc_laboratory_orders', 0);
    const pharmacyCalc = calcStorage('zmc_pharmacy_orders', 0);
    const inventoryCalc = calcStorage('zmc_inventory', 42);
    const invoicesCalc = calcStorage('zmc_invoices', 0);
    const paymentsCalc = calcStorage('zmc_payments', serverStats.payments || 0);
    const outstandingCalc = calcStorage('zmc_outstanding_balances', 0);
    const auditCalc = {
      count: auditLogs.length,
      bytes: new Blob([JSON.stringify(auditLogs)]).size
    };
    const notificationsCalc = calcStorage('zmc_notifications', 0);
    const usersCalc = {
      count: users.length,
      bytes: new Blob([JSON.stringify(users)]).size
    };
    const tokenCalc = calcStorage('zmc_token', 1);

    return [
      {
        id: 'patients',
        key: 'zmc_patients',
        serverKey: 'patients',
        name: 'Patient Demographics',
        category: 'Clinical',
        description: 'Hospital folder numbers, names, contact details, card types, and registrations',
        count: patientsCalc.count,
        sizeBytes: patientsCalc.bytes
      },
      {
        id: 'encounters',
        key: 'zmc_encounters',
        serverKey: 'encounters',
        name: 'Clinical Encounters',
        category: 'Clinical',
        description: 'Hospital visits, triage timestamps, destination clinics, and visit statuses',
        count: encountersCalc.count,
        sizeBytes: encountersCalc.bytes
      },
      {
        id: 'vitals',
        key: 'zmc_patient_vitals',
        serverKey: 'vitals',
        name: 'Triage & Vital Signs',
        category: 'Clinical',
        description: 'Blood pressure, pulse, temperature, SPO2, weight, and respiratory records',
        count: vitalsCalc.count,
        sizeBytes: vitalsCalc.bytes
      },
      {
        id: 'queue',
        key: 'zmc_patient_queue',
        serverKey: 'queue',
        name: 'Departmental Routing Queue',
        category: 'Queue',
        description: 'Live patient queues for Nurse Desk, Doctor Clinics, Eye Clinic, Lab, and Pharmacy',
        count: queueCalc.count,
        sizeBytes: queueCalc.bytes
      },
      {
        id: 'consultations',
        key: 'zmc_consultations',
        serverKey: 'consultations',
        name: 'Doctor Consultations',
        category: 'Clinical',
        description: 'Clinical examination notes, provisional diagnoses, and physician treatment plans',
        count: consultCalc.count,
        sizeBytes: consultCalc.bytes
      },
      {
        id: 'maternity',
        key: 'zmc_maternity_records',
        serverKey: 'maternity',
        name: 'Maternity & ANC Records',
        category: 'Clinical',
        description: 'Gravida, Para, LMP, EDD, gestational age, and antenatal booking profiles',
        count: maternityCalc.count,
        sizeBytes: maternityCalc.bytes
      },
      {
        id: 'emergency',
        key: 'zmc_emergency_records',
        serverKey: 'emergency',
        name: 'Accident & Emergency Records',
        category: 'Clinical',
        description: 'Trauma intake, sick emergencies, unbooked labour, and doctor-on-call logs',
        count: emergencyCalc.count,
        sizeBytes: emergencyCalc.bytes
      },
      {
        id: 'lab_orders',
        key: 'zmc_laboratory_orders',
        serverKey: 'lab_orders',
        name: 'Laboratory Orders & Results',
        category: 'Clinical',
        description: 'Diagnostic investigation orders, specimen status, and lab pathology reports',
        count: labCalc.count,
        sizeBytes: labCalc.bytes
      },
      {
        id: 'pharmacy',
        key: 'zmc_pharmacy_orders',
        serverKey: 'pharmacy',
        name: 'Pharmacy Prescriptions',
        category: 'Inventory',
        description: 'Prescription orders, dispensing statuses, and medication regimens',
        count: pharmacyCalc.count,
        sizeBytes: pharmacyCalc.bytes
      },
      {
        id: 'inventory',
        key: 'zmc_inventory',
        serverKey: 'inventory',
        name: 'Pharmacy Stock & Inventory',
        category: 'Inventory',
        description: 'Hospital medication catalog, unit pricing, batch tracking, and stock levels',
        count: inventoryCalc.count,
        sizeBytes: inventoryCalc.bytes
      },
      {
        id: 'invoices',
        key: 'zmc_invoices',
        serverKey: 'invoices',
        name: 'Invoices & Billing Accounts',
        category: 'Billing',
        description: 'Hospital fees, service charges, lab/pharmacy billing, and outstanding accounts',
        count: invoicesCalc.count,
        sizeBytes: invoicesCalc.bytes
      },
      {
        id: 'payments',
        key: 'zmc_payments',
        serverKey: 'payments',
        name: 'Cashier Receipts & Payments',
        category: 'Billing',
        description: 'Validated payment receipts, cashier reconciliation, and payment methods',
        count: paymentsCalc.count,
        sizeBytes: paymentsCalc.bytes
      },
      {
        id: 'outstanding',
        key: 'zmc_outstanding_balances',
        serverKey: 'outstanding',
        name: 'Outstanding Balances Ledger',
        category: 'Billing',
        description: 'Accounts receivable tracking, patient owed balances, and credit clearance',
        count: outstandingCalc.count,
        sizeBytes: outstandingCalc.bytes
      },
      {
        id: 'audit_logs',
        key: 'zmc_audit_logs',
        serverKey: 'audit_logs',
        name: 'Security Audit Trail',
        category: 'System',
        description: 'Authentication events, administrative modifications, and security actions',
        count: auditCalc.count,
        sizeBytes: auditCalc.bytes
      },
      {
        id: 'notifications',
        key: 'zmc_notifications',
        serverKey: 'notifications',
        name: 'System Notifications',
        category: 'System',
        description: 'Inter-departmental patient alerts, order routing, and system status updates',
        count: notificationsCalc.count,
        sizeBytes: notificationsCalc.bytes
      },
      {
        id: 'users',
        key: 'zmc_users',
        serverKey: 'users',
        name: 'Staff Accounts & Credentials',
        category: 'System',
        description: 'Hospital user accounts, department assignments, and bcrypt-hashed keys',
        count: usersCalc.count,
        sizeBytes: usersCalc.bytes,
        isProtected: true
      },
      {
        id: 'token',
        key: 'zmc_token',
        name: 'Active Session Token',
        category: 'System',
        description: 'Authenticated JSON Web Token (JWT) authorizing intranet access',
        count: tokenCalc.count,
        sizeBytes: tokenCalc.bytes,
        isProtected: true
      }
    ];
  }, [auditLogs, users, serverStats]);

  // Storage Used calculation
  const totalStorageBytes = useMemo(() => {
    return dataStores.reduce((sum, item) => sum + item.sizeBytes, 0);
  }, [dataStores]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Activity Log Summary Counts
  const logCounts = useMemo(() => {
    let login = 0;
    let logout = 0;
    let userCreated = 0;
    let passwordReset = 0;

    auditLogs.forEach(l => {
      const act = (l.action || '').toLowerCase();
      if (act.includes('login') || act === 'user_login') login++;
      else if (act.includes('logout') || act === 'user_logout') logout++;
      else if (act.includes('user created') || act.includes('user_created') || act.includes('registered')) userCreated++;
      else if (act.includes('password reset') || act.includes('password_reset') || act.includes('password')) passwordReset++;
    });

    return { login, logout, userCreated, passwordReset };
  }, [auditLogs]);

  // Action Filter Options
  const actionOptions = [
    'All Actions',
    'Login',
    'Logout',
    'User Created',
    'Password Reset',
    'User Reactivated',
    'User Deactivated',
    'Data Export',
    'Data Clear',
    'System Reset',
    'User Deleted'
  ];

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((l) => {
      const q = logSearch.toLowerCase();
      const matchesSearch = 
        (l.user_name || '').toLowerCase().includes(q) ||
        (l.user_id || '').toLowerCase().includes(q) ||
        (l.user_role || '').toLowerCase().includes(q) ||
        (l.action || '').toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (actionFilter === 'All Actions') return true;

      const act = (l.action || '').toLowerCase();
      const target = actionFilter.toLowerCase();

      if (target === 'login') return act.includes('login');
      if (target === 'logout') return act.includes('logout');
      if (target === 'user created') return act.includes('user created') || act.includes('user_created');
      if (target === 'password reset') return act.includes('password reset') || act.includes('password');
      if (target === 'user reactivated') return act.includes('reactivated');
      if (target === 'user deactivated') return act.includes('deactivated');
      if (target === 'data export') return act.includes('export');
      if (target === 'data clear') return act.includes('clear');
      if (target === 'system reset') return act.includes('reset');
      if (target === 'user deleted') return act.includes('deleted');

      return act === target;
    });
  }, [auditLogs, logSearch, actionFilter]);

  // Normalize Action for Badge Display
  const getNormalizedAction = (rawAction: string): { label: string; bg: string; text: string; border: string } => {
    const act = (rawAction || '').toLowerCase();

    if (act.includes('reactivated')) {
      return { label: 'User Reactivated', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    }
    if (act.includes('deactivated')) {
      return { label: 'User Deactivated', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    }
    if (act.includes('login')) {
      return { label: 'Login', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' };
    }
    if (act.includes('logout')) {
      return { label: 'Logout', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    }
    if (act.includes('user created') || act.includes('user_created')) {
      return { label: 'User Created', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    }
    if (act.includes('password')) {
      return { label: 'Password Reset', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    }
    if (act.includes('export')) {
      return { label: 'Data Export', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
    }
    if (act.includes('clear')) {
      return { label: 'Data Clear', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    }
    if (act.includes('reset')) {
      return { label: 'System Reset', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    }
    if (act.includes('deleted')) {
      return { label: 'User Deleted', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    }

    return { label: rawAction || 'System Event', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' };
  };

  // Download Full Backup logic
  const handleDownloadFullBackup = async () => {
    setMaintenanceLoading('backup');
    try {
      // Gather all client localStorage keys
      const clientStorage: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            clientStorage[key] = JSON.parse(localStorage.getItem(key) || '""');
          } catch {
            clientStorage[key] = localStorage.getItem(key);
          }
        }
      }

      // Fetch server snapshot as well
      let serverDatabase: any = {};
      try {
        const res = await fetch('/api/maintenance/backup');
        if (res.ok) {
          serverDatabase = await res.json();
        }
      } catch (e) {
        console.warn('Could not fetch server db for backup:', e);
      }

      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      const filename = `ZMC_HMS_Backup_${dateString}.json`;

      const fullBackupPayload = {
        metadata: {
          system: 'Zikora Medical Complex (ZMC) HMS (Hospital Management System)',
          exportType: 'Full System Backup',
          exportedAt: now.toISOString(),
          exportedBy: currentUser?.username || 'admin',
          recordCount: {
            users: users.length,
            auditLogs: auditLogs.length,
            dataStores: dataStores.length
          }
        },
        localStorage: clientStorage,
        database: serverDatabase
      };

      const jsonStr = JSON.stringify(fullBackupPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log Data Export in audit logs
      await apiFetch('/audit-logs', {
        method: 'POST',
        body: JSON.stringify({
          action: 'Data Export',
          details: `Exported full backup ${filename}`,
          userId: currentUser?.id || 'it-admin',
          userName: currentUser?.name || 'IT Administrator',
          userRole: currentUser?.role || 'IT Administrator'
        })
      }).catch(() => {});

      await fetchAuditLogs();
      setSuccess(`Backup ${filename} downloaded successfully.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(`Failed to download full backup: ${err.message}`);
      setTimeout(() => setError(''), 4000);
    } finally {
      setMaintenanceLoading(null);
    }
  };

  // Clear Individual Data Store
  const handleConfirmClearStore = async () => {
    if (!storeToClear) return;
    setMaintenanceLoading(`clear-${storeToClear.id}`);
    setError('');
    setSuccess('');

    try {
      // Clear client storage
      localStorage.removeItem(storeToClear.key);

      // Clear server tables if mapped
      if (storeToClear.serverKey) {
        await apiFetch('/maintenance/clear-store', {
          method: 'POST',
          body: JSON.stringify({
            storeKey: storeToClear.serverKey,
            storeName: storeToClear.name,
            actorName: currentUser?.name || 'IT Administrator',
            actorRole: currentUser?.role || 'IT Administrator'
          })
        });
      } else {
        // Record audit log for local store clear
        await apiFetch('/audit-logs', {
          method: 'POST',
          body: JSON.stringify({
            action: 'Data Clear',
            details: `Cleared data store: ${storeToClear.name}`,
            userId: currentUser?.id || 'it-admin',
            userName: currentUser?.name || 'IT Administrator',
            userRole: currentUser?.role || 'IT Administrator'
          })
        }).catch(() => {});
      }

      setSuccess(`Data store "${storeToClear.name}" has been cleared.`);
      setStoreToClear(null);
      await fetchUsers();
      await fetchAuditLogs();
      await fetchServerStats();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(`Failed to clear store: ${err.message}`);
      setStoreToClear(null);
      setTimeout(() => setError(''), 4000);
    } finally {
      setMaintenanceLoading(null);
    }
  };

  // Full System Reset execution (Double confirmed)
  const handleExecuteSystemReset = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      setError('Please type "RESET" in capital letters to confirm full system reset.');
      return;
    }

    setMaintenanceLoading('reset');
    setError('');
    setSuccess('');

    try {
      // Clear operational localStorage keys
      const operationalKeys = [
        'zmc_patients',
        'zmc_encounters',
        'zmc_patient_vitals',
        'zmc_patient_queue',
        'zmc_consultations',
        'zmc_maternity_records',
        'zmc_emergency_records',
        'zmc_laboratory_orders',
        'zmc_pharmacy_orders',
        'zmc_invoices',
        'zmc_payments',
        'zmc_outstanding_balances',
        'zmc_notifications'
      ];

      operationalKeys.forEach(k => localStorage.removeItem(k));

      // Call backend system-reset endpoint
      const res = await apiFetch('/maintenance/system-reset', {
        method: 'POST',
        body: JSON.stringify({
          actorName: currentUser?.name || 'IT Administrator',
          actorRole: currentUser?.role || 'IT Administrator'
        })
      });

      setIsResetModalOpen(false);
      setResetConfirmText('');
      setSuccess('Full system reset completed. Operational data stores cleared.');
      await fetchUsers();
      await fetchAuditLogs();
      await fetchServerStats();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(`System reset error: ${err.message}`);
      setIsResetModalOpen(false);
      setTimeout(() => setError(''), 5000);
    } finally {
      setMaintenanceLoading(null);
    }
  };

  // Clear Activity Logs
  const handleConfirmClearLogs = async () => {
    setMaintenanceLoading('clear-logs');
    try {
      await apiFetch('/audit-logs/clear', { method: 'POST' });
      setAuditLogs([]);
      setIsClearLogsModalOpen(false);
      setSuccess('All activity logs have been cleared successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(`Failed to clear activity logs: ${err.message}`);
      setIsClearLogsModalOpen(false);
      setTimeout(() => setError(''), 4000);
    } finally {
      setMaintenanceLoading(null);
    }
  };

  // User Management Actions
  const handleOpenCreateModal = () => {
    setFullName('');
    setUsername('');
    setRole('OPD Clerk');
    setDepartment('OPD');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    setSuccess('');
    setIsCreateModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fullName.trim() || !username.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    try {
      const currentUserName = currentUser?.username || 'admin';
      const cleanUsername = username.trim().toLowerCase();
      const cleanName = fullName.trim();
      const rawPassword = password;
      const body = {
        name: cleanName,
        username: cleanUsername,
        password: rawPassword,
        role,
        department,
        status: 'Active',
        created_by: currentUserName
      };

      const response = await apiFetch('/users', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response.success) {
        const createdUser: User = response.data || {
          id: `user-${Date.now()}`,
          name: cleanName,
          username: cleanUsername,
          role,
          department,
          status: 'Active',
          created_at: new Date().toISOString(),
          created_by: currentUserName
        };

        // Pin newly created user immediately to top of user list
        setUsers(prev => [createdUser, ...prev.filter(u => u.username?.toLowerCase() !== cleanUsername && u.id !== createdUser.id)]);

        // Record credential for top of table banner
        setNewlyCreatedCredential({
          name: cleanName,
          username: cleanUsername,
          role,
          department,
          password: rawPassword,
          createdAt: new Date().toISOString()
        });
        setShowCredentialPassword(true);
        setCopiedCredential(false);

        // Switch to users tab and clear search so the new record is visible
        setActiveTab('users');
        setSearch('');

        setSuccess(`User @${cleanUsername} registered successfully and placed at the top of the table.`);
        setIsCreateModalOpen(false);
        await fetchUsers();
        await fetchAuditLogs();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleOpenPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setError('');
    setSuccess('');
    setIsPasswordModalOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setSuccess('');

    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (newPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    try {
      const response = await apiFetch(`/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.success) {
        setSuccess(`Password for @${selectedUser.username} has been updated successfully.`);
        setIsPasswordModalOpen(false);
        await fetchUsers();
        await fetchAuditLogs();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.success) {
        setSuccess(`User @${user.username} is now ${nextStatus}.`);
        await fetchUsers();
        await fetchAuditLogs();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const handleOpenDeleteModal = (user: User) => {
    if (currentUser && currentUser.username === user.username) {
      setError('You cannot delete your own active administrator account.');
      setTimeout(() => setError(''), 4000);
      return;
    }
    setSelectedUser(user);
    setError('');
    setSuccess('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setError('');
    setSuccess('');

    try {
      const response = await apiFetch(`/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (response.success) {
        setSuccess(`User @${selectedUser.username} was permanently removed.`);
        setIsDeleteModalOpen(false);
        await fetchUsers();
        await fetchAuditLogs();
        setTimeout(() => setSuccess(''), 4000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
      setIsDeleteModalOpen(false);
    }
  };

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Never';
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Subtitle */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2A758C]/15 border border-[#2A758C]/30 flex items-center justify-center text-[#2A758C]">
                <Shield className="h-5 w-5" />
              </div>
              <span>IT Administration & Systems</span>
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              Zikora Medical Complex (ZMC) — Access Control, Maintenance & Security Audit
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              PostgreSQL Relational DB Active
            </span>
          </div>
        </div>

        {/* Tab Navigation Navigation Strip */}
        <div className="department-page-nav flex items-center gap-2 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => handleTabSwitch('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#2A758C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>User Management</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {users.length}
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('maintenance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'maintenance'
                ? 'bg-[#2A758C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Maintenance</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${activeTab === 'maintenance' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {dataStores.length} Stores
            </span>
          </button>

          <button
            onClick={() => handleTabSwitch('activity-log')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'activity-log'
                ? 'bg-[#2A758C] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Activity Log</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${activeTab === 'activity-log' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {auditLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* Notifications and Alerts Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs font-semibold shadow-xs">
          <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-xs">
          <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-100 rounded-lg cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. USER MANAGEMENT TAB */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Newly Created User Credentials Card (Top of Table) */}
          <AnimatePresence>
            {newlyCreatedCredential && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                className="bg-gradient-to-r from-emerald-50 via-teal-50/70 to-sky-50 border-2 border-emerald-300 rounded-2xl p-5 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-emerald-200/80">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                          Newly Created User Credential
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-white/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Placed at Top of Table
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 mt-1">
                        {newlyCreatedCredential.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const copyPayload = `ZMC Staff Account Credential:\nName: ${newlyCreatedCredential.name}\nUsername: ${newlyCreatedCredential.username}\nPassword: ${newlyCreatedCredential.password}\nRole: ${newlyCreatedCredential.role}\nDepartment: ${newlyCreatedCredential.department || 'Hospital General'}`;
                        navigator.clipboard.writeText(copyPayload);
                        setCopiedCredential(true);
                        setTimeout(() => setCopiedCredential(false), 3000);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      {copiedCredential ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copied All!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy Credentials</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setNewlyCreatedCredential(null)}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white/80 rounded-xl transition-all border border-slate-200/60 cursor-pointer"
                      title="Dismiss Credential Card"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3.5">
                  <div className="bg-white/95 border border-emerald-200/80 rounded-xl p-3 shadow-2xs">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Username</div>
                    <div className="text-xs font-black text-slate-900 font-mono mt-0.5 select-all">
                      @{newlyCreatedCredential.username}
                    </div>
                  </div>

                  <div className="bg-white/95 border border-emerald-200/80 rounded-xl p-3 shadow-2xs flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Password</div>
                      <div className="text-xs font-black text-emerald-800 font-mono mt-0.5 select-all">
                        {showCredentialPassword ? newlyCreatedCredential.password : '••••••••••••'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCredentialPassword(!showCredentialPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      title={showCredentialPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showCredentialPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="bg-white/95 border border-emerald-200/80 rounded-xl p-3 shadow-2xs">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Role & Desk</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {newlyCreatedCredential.role}
                    </div>
                  </div>

                  <div className="bg-white/95 border border-emerald-200/80 rounded-xl p-3 shadow-2xs">
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Department</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">
                      {newlyCreatedCredential.department || 'Hospital General'}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff directory by name, username, department, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchUsers}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className={`h-4 w-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="flex items-center justify-center gap-2 bg-[#2A758C] hover:bg-[#236073] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer shrink-0"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-5">Staff Member</th>
                    <th className="py-3.5 px-5">Role</th>
                    <th className="py-3.5 px-5">Department</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Last Login</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.map((u) => {
                    const isNewlyCreated = newlyCreatedCredential && u.username?.toLowerCase() === newlyCreatedCredential.username.toLowerCase();
                    return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        isNewlyCreated
                          ? 'bg-emerald-50/70 hover:bg-emerald-50/90'
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isNewlyCreated
                              ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                              : 'bg-[#2A758C]/15 border border-[#2A758C]/30 text-[#2A758C]'
                          }`}>
                            {u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{u.name}</span>
                              {isNewlyCreated && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white animate-pulse">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-600">
                        {u.department || 'Hospital General'}
                      </td>
                      <td className="py-3.5 px-5">
                        {u.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">
                        {formatDate(u.last_login)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Reset Password"
                            onClick={() => handleOpenPasswordModal(u)}
                            className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200 cursor-pointer"
                          >
                            <Key className="h-4 w-4" />
                          </button>

                          <button
                            title={u.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition-colors border border-transparent cursor-pointer ${
                              u.status === 'Active'
                                ? 'text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200'
                                : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200'
                            }`}
                          >
                            {u.status === 'Active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>

                          <button
                            title="Delete User"
                            onClick={() => handleOpenDeleteModal(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAINTENANCE TAB */}
      {/* ========================================================================= */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          {/* 3 System Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Browser Info */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Browser & Client</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
                    <Globe className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-slate-900 mt-2 tracking-tight">
                  {browserInfo.browser}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                  <span>{browserInfo.os}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-400">{browserInfo.engine}</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Intranet TLS Enforced</span>
                <span className="text-emerald-600 font-bold font-mono">Secure HTTPS</span>
              </div>
            </div>

            {/* Card 2: Storage Used */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Storage Used</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                    <HardDrive className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                  {formatBytes(totalStorageBytes)}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
                  <span>Calculated local state & records size</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Browser Storage Quota</span>
                <span className="text-slate-700 font-bold font-mono">~5.0 MB Allocated</span>
              </div>
            </div>

            {/* Card 3: Data Stores Count */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Data Stores</span>
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-slate-900 mt-2 font-mono tracking-tight">
                  {dataStores.length} Stores Active
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  Relational PostgreSQL + Local storage synchronizer
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Core Database Status</span>
                <span className="text-emerald-600 font-bold font-mono">100% Synced</span>
              </div>
            </div>
          </div>

          {/* Download Full Backup Card */}
          <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/10 text-emerald-400 border border-white/10">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-base font-black tracking-tight">Download Full Backup</h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Export all localStorage data stores and relational database tables as a single, timestamped{' '}
                <span className="font-mono text-emerald-400 font-bold">ZMC_HMS_Backup_{new Date().toISOString().split('T')[0]}.json</span> backup archive.
              </p>
            </div>

            <button
              onClick={handleDownloadFullBackup}
              disabled={maintenanceLoading !== null}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer shrink-0 active:scale-98"
            >
              {maintenanceLoading === 'backup' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Download Full Backup</span>
            </button>
          </div>

          {/* Data Stores Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Server className="h-4 w-4 text-[#2A758C]" />
                  <span>Data Stores Directory</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Inspect record count, byte volume, and clear individual operational stores
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchServerStats}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Recalculate Sizes</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-5">Data Store / Key</th>
                    <th className="py-3.5 px-5">Category</th>
                    <th className="py-3.5 px-5">Description</th>
                    <th className="py-3.5 px-5 text-right font-mono">Record Count</th>
                    <th className="py-3.5 px-5 text-right font-mono">Byte Size</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {dataStores.map((store) => (
                    <tr key={store.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">{store.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{store.key}</div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          store.category === 'Clinical' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                          store.category === 'Billing' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          store.category === 'Inventory' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          store.category === 'Queue' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {store.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate">
                        {store.description}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-slate-800">
                        {store.count}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-600 font-medium">
                        {formatBytes(store.sizeBytes)}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {store.isProtected ? (
                          <span className="text-[11px] font-mono text-slate-400 font-semibold italic">
                            Protected
                          </span>
                        ) : (
                          <button
                            onClick={() => setStoreToClear(store)}
                            disabled={maintenanceLoading !== null}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Clear</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full System Reset Box */}
          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-900 font-black text-sm">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <span>Full System Reset (Danger Zone)</span>
              </div>
              <p className="text-xs text-rose-700 max-w-2xl leading-relaxed">
                Purge all patient visits, vital sign readings, queue routing, billing invoices, and lab orders to factory state. Requires double-confirmation.
              </p>
            </div>

            <button
              onClick={() => {
                setResetConfirmText('');
                setIsResetModalOpen(true);
              }}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-black px-5 py-2.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Full System Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACTIVITY LOG TAB */}
      {/* ========================================================================= */}
      {activeTab === 'activity-log' && (
        <div className="space-y-5">
          {/* Summary Mini-Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {/* 1. Login */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Login</span>
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center">
                  <LogIn className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {logCounts.login}
              </div>
            </div>

            {/* 2. Logout */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Logout</span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {logCounts.logout}
              </div>
            </div>

            {/* 3. User Created */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">User Created</span>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
                  <UserPlus className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {logCounts.userCreated}
              </div>
            </div>

            {/* 4. Password Reset */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Password Reset</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Key className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                {logCounts.passwordReset}
              </div>
            </div>
          </div>

          {/* Search, Action Filter & Clear Logs Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by username, name, or details…"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all"
              />
            </div>

            {/* Filter Dropdown + Clear Logs button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* All Actions Dropdown */}
              <div className="relative">
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl py-2.5 px-3 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all appearance-none cursor-pointer"
                >
                  {actionOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Clear Logs Button */}
              <button
                onClick={() => setIsClearLogsModalOpen(true)}
                disabled={auditLogs.length === 0}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear Logs</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={fetchAuditLogs}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer shrink-0"
              >
                <RefreshCw className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Activity Log Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">
                No activity logs match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-3.5 px-5">Timestamp</th>
                      <th className="py-3.5 px-5">User</th>
                      <th className="py-3.5 px-5">Role</th>
                      <th className="py-3.5 px-5">Action</th>
                      <th className="py-3.5 px-5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredLogs.map((log) => {
                      const badge = getNormalizedAction(log.action);
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-5 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                            {formatDate(log.timestamp)}
                          </td>
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-900">{log.user_name || 'IT Administrator'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {log.user_id && log.user_id.startsWith('audit-') ? 'admin' : (log.user_id || 'admin')}
                            </div>
                          </td>
                          <td className="py-3.5 px-5 font-medium text-slate-600">
                            {log.user_role || 'IT Administrator'}
                          </td>
                          <td className="py-3.5 px-5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-slate-700 font-medium max-w-md">
                            {log.details || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="text-right text-[11px] font-mono text-slate-400 pr-2">
            Showing {filteredLogs.length} of {auditLogs.length} audit trail entries (Max 500 retained)
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS */}
      {/* ========================================================================= */}

      {/* A. ADD NEW USER MODAL */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-800"
            >
              <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#2A758C]/15 rounded-xl text-[#2A758C]">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-black text-base">Add New User</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Create staff account with role credentials</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Alan Smith"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. dr.smith or opd.clerk"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                      Role <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#2A758C] hover:bg-[#236073] text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Create User Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* B. PASSWORD RESET MODAL */}
      <AnimatePresence>
        {isPasswordModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-800"
            >
              <div className="bg-slate-50 px-6 py-4.5 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-slate-900 font-black text-base">Reset Password</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Update password for @{selectedUser.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-9 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 transition-all font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* C. DELETE USER MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-800"
            >
              <div className="bg-rose-50 px-6 py-4.5 border-b border-rose-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-xl text-rose-600 border border-rose-200">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-rose-900 font-black text-base">Delete User Account</h3>
                    <p className="text-[11px] text-rose-600 font-medium">Permanent removal</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete user <strong className="text-slate-900 font-bold">@{selectedUser.username}</strong> ({selectedUser.name})? This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* D. CLEAR DATA STORE CONFIRMATION MODAL */}
      <AnimatePresence>
        {storeToClear && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-800"
            >
              <div className="bg-rose-50 px-6 py-4.5 border-b border-rose-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-xl text-rose-600 border border-rose-200">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-rose-900 font-black text-base">Clear Data Store</h3>
                    <p className="text-[11px] text-rose-600 font-medium">{storeToClear.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setStoreToClear(null)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Are you sure you want to clear <strong className="text-slate-900 font-bold">{storeToClear.name}</strong>?
                </p>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Store Key:</span>
                    <span className="text-slate-800 font-bold">{storeToClear.key}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Records to remove:</span>
                    <span className="text-rose-600 font-bold">{storeToClear.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Storage Freed:</span>
                    <span className="text-slate-800 font-bold">{formatBytes(storeToClear.sizeBytes)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStoreToClear(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClearStore}
                    disabled={maintenanceLoading !== null}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {maintenanceLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                    <span>Yes, Clear Store</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* E. FULL SYSTEM RESET DOUBLE-CONFIRMATION MODAL */}
      <AnimatePresence>
        {isResetModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-rose-200 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-800"
            >
              <div className="bg-rose-600 px-6 py-4.5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-base">Full System Reset Confirmation</h3>
                    <p className="text-[11px] text-rose-100 font-medium">Double-confirmed destructive operation</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResetModalOpen(false)}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-rose-800 leading-relaxed font-medium">
                  <strong>Warning:</strong> This will erase all registered patients, triage vitals, clinical encounters, pharmacy orders, lab orders, invoices, and payments. Administrator accounts and system schemas will remain intact.
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">
                    Type <span className="font-mono text-rose-600 font-black">RESET</span> to confirm execution:
                  </label>
                  <input
                    type="text"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder="RESET"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 uppercase"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={resetConfirmText.trim().toUpperCase() !== 'RESET' || maintenanceLoading !== null}
                    onClick={handleExecuteSystemReset}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                  >
                    {maintenanceLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                    <span>Execute Full Reset</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* F. CLEAR ACTIVITY LOGS CONFIRMATION MODAL */}
      <AnimatePresence>
        {isClearLogsModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-800"
            >
              <div className="bg-rose-50 px-6 py-4.5 border-b border-rose-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-xl text-rose-600 border border-rose-200">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-rose-900 font-black text-base">Clear Activity Logs</h3>
                    <p className="text-[11px] text-rose-600 font-medium">Audit trail truncation</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsClearLogsModalOpen(false)}
                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-600 leading-relaxed">
                  Are you sure you want to clear all <strong>{auditLogs.length}</strong> activity log entries? This will permanently wipe the security audit trail.
                </p>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsClearLogsModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmClearLogs}
                    disabled={maintenanceLoading !== null}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {maintenanceLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : null}
                    <span>Yes, Clear All Logs</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
