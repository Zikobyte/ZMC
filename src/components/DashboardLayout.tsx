import React, { useState, useEffect } from 'react';
import { removeAuthToken, socketManager, apiFetch } from '../utils/api';
import { User } from '../types';
import { getAllowedNavigationIds } from '../config/navigation';
import { 
  Shield, 
  LogOut, 
  Users, 
  HeartHandshake, 
  Search, 
  Bell, 
  Settings, 
  Maximize, 
  LayoutDashboard, 
  ChevronDown, 
  Menu, 
  UserCheck, 
  BookOpen, 
  Folder, 
  Compass, 
  HelpCircle,
  FileText,
  Activity,
  Layers,
  Sparkles,
  X,
  Info,
  CheckCheck,
  Eye,
  Coins,
  FlaskConical,
  Pill,
  BedDouble,
  ClipboardList,
  ChevronRight,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Stethoscope,
  ShoppingBag,
  Boxes,
  CreditCard,
  Percent,
  Syringe,
  Baby
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardLayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles: string[];
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export default function DashboardLayout({
  user,
  onLogout,
  activeTab,
  setActiveTab,
  children,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [opdSubMenuOpen, setOpdSubMenuOpen] = useState(false);
  const [isOpdHovered, setIsOpdHovered] = useState(false);
  const [cashierSubMenuOpen, setCashierSubMenuOpen] = useState(false);
  const [isCashierHovered, setIsCashierHovered] = useState(false);
  const [pharmacySubMenuOpen, setPharmacySubMenuOpen] = useState(false);
  const [isPharmacyHovered, setIsPharmacyHovered] = useState(false);
  const [eyeSubMenuOpen, setEyeSubMenuOpen] = useState(false);
  const [isEyeHovered, setIsEyeHovered] = useState(false);
  const [nurseSubMenuOpen, setNurseSubMenuOpen] = useState(false);
  const [isNurseHovered, setIsNurseHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchDbNotifications = async () => {
    try {
      const res = await apiFetch('/notifications');
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data.map(r => ({
          id: r.id,
          type: r.type,
          message: r.message,
          timestamp: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: r.read
        })));
      }
    } catch (err) {
      console.error("Failed to load persistent notifications:", err);
    }
  };

  useEffect(() => {
    fetchDbNotifications();

    const unsubscribe = socketManager.subscribe((msg: any) => {
      if (
        msg.type === 'PATIENT_REGISTERED' ||
        msg.type === 'VITALS_RECORDED' ||
        msg.type === 'PATIENT_UPDATED' ||
        msg.type === 'AUTH_SUCCESS'
      ) {
        // Refetch from database to keep persistent sync
        fetchDbNotifications();
      }
    });
    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/audit-logs', {
        method: 'POST',
        body: JSON.stringify({
          action: 'Logout',
          details: '—',
          userId: user?.id,
          userName: user?.name,
          userRole: user?.role
        })
      }).catch(() => {});
    } catch (e) {}
    removeAuthToken();
    onLogout();
  };

  const menuGroups: MenuGroup[] = [
    {
      title: 'Dashboard',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
          icon: <LayoutDashboard className="h-4.5 w-4.5" />,
          allowedRoles: ['Administrator', 'IT Administrator', 'Management', 'Receptionist', 'Records Officer', 'OPD Clerk', 'Accountant', 'Account Officer'],
        },
        {
          id: 'patients',
          label: 'OPD Reception',
          icon: <HeartHandshake className="h-4.5 w-4.5" />,
          allowedRoles: ['Receptionist', 'Records Officer', 'OPD Clerk', 'Administrator', 'IT Administrator', 'Management', 'Doctor'],
        },
        {
          id: 'nursing',
          label: 'Nursing Department',
          icon: <Activity className="h-4.5 w-4.5" />,
          allowedRoles: ['Nurse', 'Doctor', 'Administrator', 'IT Administrator', 'Management'],
        },
        { id: 'consult', label: 'Consultations', icon: <UserCheck className="h-4.5 w-4.5" />, allowedRoles: ['Doctor', 'Administrator', 'IT Administrator', 'Management'] },
        { id: 'records', label: 'Medical Reports', icon: <FileText className="h-4.5 w-4.5" />, allowedRoles: ['Receptionist', 'Records Officer', 'OPD Clerk', 'Nurse', 'Doctor', 'Administrator', 'IT Administrator', 'Management', 'Eye Clinic'] },
        { id: 'cashier', label: 'Billing & Cashier', icon: <Coins className="h-4.5 w-4.5" />, allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'] },
        { id: 'lab', label: 'Laboratory Desk', icon: <FlaskConical className="h-4.5 w-4.5" />, badge: 'Pathology', allowedRoles: ['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Administrator', 'IT Administrator', 'Management', 'Doctor'] },
        { id: 'pharmacy', label: 'Pharmacy Desk', icon: <Pill className="h-4.5 w-4.5" />, badge: 'Dispensing', allowedRoles: ['Pharmacist', 'Administrator', 'IT Administrator', 'Management', 'Doctor'] },
        {
          id: 'eye-clinic',
          label: 'Eye Clinic Desk',
          icon: <Eye className="h-4.5 w-4.5" />,
          allowedRoles: ['Administrator', 'IT Administrator', 'Management', 'Eye Clinic'],
        },
        {
          id: 'users',
          label: 'Staff Directory',
          icon: <Users className="h-4.5 w-4.5" />,
          allowedRoles: ['Administrator', 'IT Administrator', 'Management'],
        }
      ]
    },
    {
      title: 'Human Resources',
      items: [
        {
          id: 'hr-dashboard',
          label: 'HR Dashboard',
          icon: <LayoutDashboard className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'hr-employees',
          label: 'Employees',
          icon: <Users className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'hr-absences',
          label: 'Absences',
          icon: <ClipboardList className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'hr-recruitment',
          label: 'Recruitment',
          icon: <UserCheck className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'hr-procurement',
          label: 'Procurement',
          icon: <Boxes className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'hr-discounts',
          label: 'Discounts',
          icon: <Percent className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management'],
        }
      ]
    },
    {
      title: 'IT Department',
      items: [
        {
          id: 'users',
          label: 'User Management',
          icon: <Users className="h-4.5 w-4.5" />,
          allowedRoles: ['Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'maintenance',
          label: 'Maintenance',
          icon: <Settings className="h-4.5 w-4.5" />,
          allowedRoles: ['Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'activity-log',
          label: 'Activity Log',
          icon: <Activity className="h-4.5 w-4.5" />,
          allowedRoles: ['Administrator', 'IT Administrator', 'Management'],
        }
      ]
    },
    {
      title: 'System Settings',
      items: [
        { id: 'widgets', label: 'Reference Modules', icon: <Layers className="h-4.5 w-4.5" />, allowedRoles: ['Administrator', 'IT Administrator', 'Management', 'Doctor', 'Nurse', 'Pharmacist', 'Laboratory Scientist', 'Lab Technician', 'Cashier', 'Receptionist', 'Records Officer', 'OPD Clerk'] },
        { id: 'settings', label: 'System Settings', icon: <Settings className="h-4.5 w-4.5" />, allowedRoles: ['Administrator', 'IT Administrator', 'Management'] },
      ]
    }
  ];

  const isITStaff = 
    (user.role as string) === 'IT Administrator' || 
    user.department === 'IT';

  const itDepartmentMenuGroups: MenuGroup[] = [
    {
      title: 'IT Department',
      items: [
        {
          id: 'users',
          label: 'User Management',
          icon: <Users className="h-4.5 w-4.5" />,
          allowedRoles: ['IT Administrator', 'Administrator', 'Management', 'Account Officer', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        },
        {
          id: 'maintenance',
          label: 'Maintenance',
          icon: <Settings className="h-4.5 w-4.5" />,
          allowedRoles: ['IT Administrator', 'Administrator', 'Management', 'Account Officer', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        },
        {
          id: 'activity-log',
          label: 'Activity Log',
          icon: <Activity className="h-4.5 w-4.5" />,
          allowedRoles: ['IT Administrator', 'Administrator', 'Management', 'Account Officer', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        }
      ]
    },
    {
      title: 'Hospital Navigation',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
          icon: <LayoutDashboard className="h-4.5 w-4.5" />,
          allowedRoles: ['IT Administrator', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        }
      ]
    }
  ];

  const isEyeClinicStaff = (user.role as string) === 'Eye Clinic' || user.department === 'Eye Clinic';
  const isAccountOfficerStaff = 
    (user.role as string) === 'Account Officer' || 
    (user.role as string) === 'Accountant' ||
    user.department === 'Account Officer' || 
    user.department === 'Accounts';

  const accountOfficerMenuGroups: MenuGroup[] = [
    {
      title: 'Account Officer Department',
      items: [
        {
          id: 'overview',
          label: 'overview',
          icon: <LayoutDashboard className="h-4.5 w-4.5" />,
          allowedRoles: ['Account Officer', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        },
        {
          id: 'doctors',
          label: 'Doctors',
          icon: <Stethoscope className="h-4.5 w-4.5" />,
          allowedRoles: ['Account Officer', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        },
        {
          id: 'lab-technicians',
          label: 'Lab technicians',
          icon: <FlaskConical className="h-4.5 w-4.5" />,
          allowedRoles: ['Account Officer', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        },
        {
          id: 'pharmacists',
          label: 'pharmacists',
          icon: <Pill className="h-4.5 w-4.5" />,
          allowedRoles: ['Account Officer', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        },
        {
          id: 'procurement',
          label: 'Procurement',
          icon: <Boxes className="h-4.5 w-4.5" />,
          allowedRoles: ['Account Officer', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        },
        {
          id: 'outstanding',
          label: 'Outstanding',
          icon: <CreditCard className="h-4.5 w-4.5" />,
          allowedRoles: ['Account Officer', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        },
        {
          id: 'discounts',
          label: 'Discounts',
          icon: <Percent className="h-4.5 w-4.5" />,
          allowedRoles: ['Account Officer', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Eye Clinic'],
        }
      ]
    }
  ];

  const eyeClinicMenuGroups: MenuGroup[] = [
    {
      title: 'Eye Clinic Department',
      items: [
        {
          id: 'registered-patients',
          label: 'Register Patient',
          icon: <Users className="h-4.5 w-4.5" />,
          allowedRoles: ['Eye Clinic', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant'],
          badge: undefined as string | undefined
        },
        {
          id: 'consultation',
          label: 'Consultation',
          icon: <Stethoscope className="h-4.5 w-4.5" />,
          allowedRoles: ['Eye Clinic', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant'],
          badge: undefined as string | undefined
        },
        {
          id: 'all-records',
          label: 'All Records',
          icon: <ClipboardList className="h-4.5 w-4.5" />,
          allowedRoles: ['Eye Clinic', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant'],
          badge: undefined as string | undefined
        }
      ]
    },
    {
      title: 'Hospital Navigation',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
          icon: <LayoutDashboard className="h-4.5 w-4.5" />,
          allowedRoles: ['Eye Clinic', 'Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant'],
        }
      ]
    }
  ];

  const isHRStaff = 
    (user.role as string) === 'HR Manager' || 
    (user.role as string) === 'Human Resources' ||
    user.department === 'Human Resources' || 
    user.department === 'HR';

  const hrMenuGroups: MenuGroup[] = [
    {
      title: 'Human Resources & Procurement',
      items: [
        {
          id: 'hr-dashboard',
          label: 'Dashboard',
          icon: <LayoutDashboard className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'Eye Clinic'],
        },
        {
          id: 'hr-employees',
          label: 'Employees',
          icon: <Users className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'Eye Clinic'],
        },
        {
          id: 'hr-absences',
          label: 'Absences',
          icon: <ClipboardList className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'Eye Clinic'],
        },
        {
          id: 'hr-recruitment',
          label: 'Recruitment',
          icon: <UserCheck className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'Eye Clinic'],
        },
        {
          id: 'hr-procurement',
          label: 'Procurement',
          icon: <Boxes className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'Eye Clinic'],
        },
        {
          id: 'hr-discounts',
          label: 'Discounts',
          icon: <Percent className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'Eye Clinic'],
        }
      ]
    },
    {
      title: 'Hospital Navigation',
      items: [
        {
          id: 'dashboard',
          label: 'Hospital Overview',
          icon: <LayoutDashboard className="h-4.5 w-4.5" />,
          allowedRoles: ['HR Manager', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Nurse', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'Eye Clinic'],
        }
      ]
    }
  ];

  const isNurseStaff = 
    (user.role as string) === 'Nurse' || 
    user.department === 'Nursing';

  const nurseMenuGroups: MenuGroup[] = [
    {
      title: 'Nursing Department',
      items: [
        {
          id: 'admitted-patients',
          label: 'Admitted patients',
          icon: <BedDouble className="h-4.5 w-4.5" />,
          allowedRoles: ['Nurse', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'HR Manager', 'Eye Clinic'],
        },
        {
          id: 'detained-patients',
          label: 'Detained patients',
          icon: <Activity className="h-4.5 w-4.5" />,
          allowedRoles: ['Nurse', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'HR Manager', 'Eye Clinic'],
        },
        {
          id: 'nurse-dispensing',
          label: 'Nurse dispensing',
          icon: <Pill className="h-4.5 w-4.5" />,
          allowedRoles: ['Nurse', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'HR Manager', 'Eye Clinic'],
        },
        {
          id: 'injection-records',
          label: 'Injection records',
          icon: <Syringe className="h-4.5 w-4.5" />,
          allowedRoles: ['Nurse', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'HR Manager', 'Eye Clinic'],
        },
      ]
    },
    {
      title: 'Hospital Navigation',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Overview',
          icon: <LayoutDashboard className="h-4.5 w-4.5" />,
          allowedRoles: ['Nurse', 'Administrator', 'IT Administrator', 'Management', 'Doctor', 'Receptionist', 'Records Officer', 'Cashier', 'Pharmacist', 'Laboratory Scientist', 'Accountant', 'Account Officer', 'HR Manager', 'Eye Clinic'],
        }
      ]
    }
  ];

  const isCashierStaff = 
    (user.role as string) === 'Cashier' || 
    (user.role as string).toLowerCase().includes('cashier') ||
    (user.department as string).toLowerCase().includes('cashier') || 
    user.department === 'Finance';

  const cashierMenuGroups: MenuGroup[] = [
    {
      title: 'Cashier Department',
      items: [
        {
          id: 'cashier',
          label: 'Billing & Cashier Desk',
          icon: <Coins className="h-4.5 w-4.5" />,
          allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'cashier-outstanding',
          label: 'Outstanding Balances',
          icon: <CreditCard className="h-4.5 w-4.5" />,
          allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'cashier-lab-payments',
          label: 'Doctor Lab Requests',
          icon: <FlaskConical className="h-4.5 w-4.5" />,
          allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'cashier-iclinic-registrations',
          label: 'Eye Clinic Registrations',
          icon: <Eye className="h-4.5 w-4.5" />,
          allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'cashier-walkin-verify',
          label: 'Walk-in Lab Verification',
          icon: <ClipboardList className="h-4.5 w-4.5" />,
          allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'cashier-pv',
          label: 'Payment Vitae (PV)',
          icon: <FileText className="h-4.5 w-4.5" />,
          allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'cashier-no-charge',
          label: 'No Charge Patient',
          icon: <CheckCircle className="h-4.5 w-4.5" />,
          allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'cashier-maternity-supplies',
          label: 'Maternity Supplies',
          icon: <HeartHandshake className="h-4.5 w-4.5" />,
          allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'cashier-discounts',
          label: 'Discounts',
          icon: <Percent className="h-4.5 w-4.5" />,
          allowedRoles: ['Cashier', 'Accountant', 'Account Officer', 'Administrator', 'IT Administrator', 'Management'],
        }
      ]
    }
  ];

  const isLabStaff = 
    (user.role as string) === 'Laboratory Scientist' || 
    (user.role as string) === 'Lab Technician' || 
    (user.role as string) === 'Scientist' || 
    user.department === 'Laboratory';

  const labMenuGroups: MenuGroup[] = [
    {
      title: 'Laboratory Department',
      items: [
        {
          id: 'lab',
          label: 'Laboratory Desk',
          icon: <FlaskConical className="h-4.5 w-4.5" />,
          badge: 'Pathology',
          allowedRoles: ['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'lab-walkin',
          label: 'Walk-in Diagnostics',
          icon: <UserCheck className="h-4.5 w-4.5" />,
          allowedRoles: ['Laboratory Scientist', 'Lab Technician', 'Scientist', 'Administrator', 'IT Administrator', 'Management'],
        }
      ]
    }
  ];

  const isPharmacyStaff = 
    (user.role as string) === 'Pharmacist' || 
    user.department === 'Pharmacy';

  const pharmacyMenuGroups: MenuGroup[] = [
    {
      title: 'Pharmacy Department',
      items: [
        {
          id: 'pharmacy',
          label: 'Pharmacy Desk',
          icon: <Pill className="h-4.5 w-4.5" />,
          badge: 'Dispensing',
          allowedRoles: ['Pharmacist', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'pharmacy-stock',
          label: 'Medication Inventory',
          icon: <Boxes className="h-4.5 w-4.5" />,
          allowedRoles: ['Pharmacist', 'Administrator', 'IT Administrator', 'Management'],
        },
        {
          id: 'procurement',
          label: 'Procurement',
          icon: <ClipboardList className="h-4.5 w-4.5" />,
          allowedRoles: ['Pharmacist', 'Administrator', 'IT Administrator', 'Management'],
        }
      ]
    }
  ];

  const effectiveMenuGroups = isITStaff
    ? itDepartmentMenuGroups
    : isEyeClinicStaff 
      ? eyeClinicMenuGroups 
      : isHRStaff
        ? hrMenuGroups
        : isAccountOfficerStaff 
          ? accountOfficerMenuGroups 
          : isNurseStaff
            ? nurseMenuGroups
            : isCashierStaff
              ? cashierMenuGroups
              : isLabStaff
                ? labMenuGroups
                : isPharmacyStaff
                  ? pharmacyMenuGroups
                  : menuGroups;

  const allowedNavigationIds = getAllowedNavigationIds(user);

  const handleNavClick = (id: string) => {
    setActiveTab(id);
  };

  return (
    <div className="reference-shell min-h-screen bg-[#F4F6F8] flex font-sans text-slate-700">
      
      {/* 1. LEFT SIDEBAR: Ultra-clean modern sidebar with smooth rounded active pills */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-[#181D27] text-slate-300 transition-all duration-300 ease-in-out shrink-0 flex flex-col justify-between border-r border-[#121620] relative z-30 select-none hidden md:flex h-screen sticky top-0 shadow-sm`}
      >
        <div>
          {/* Logo Branding */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-[#222836]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#2A758C] to-[#38bdf8] flex items-center justify-center text-white font-black text-base shadow-sm">
                Z
              </div>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-white font-black tracking-tight text-base leading-none">Zikora HMS</span>
                  <span className="text-[10px] text-[#38bdf8] font-mono tracking-widest mt-1.5 uppercase font-bold">Clinical Intranet</span>
                </div>
              )}
            </div>
          </div>

          {/* User Profile Card */}
          <div className="p-4 mx-3 my-3 bg-[#222834] rounded-2xl border border-[#2e3646]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-[#2A758C]/20 border border-[#2A758C]/40 flex items-center justify-center font-black text-[#38bdf8] text-xs">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#181D27] rounded-full"></span>
              </div>

              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-white truncate">{user.name}</p>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-white transition-colors" onClick={() => setUserDropdownOpen(!userDropdownOpen)} />
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">{user.role} Dept</p>
                </div>
              )}
            </div>

            {/* Collapsible Quick Profile actions */}
            {userDropdownOpen && sidebarOpen && (
              <div className="mt-3 bg-slate-950/50 rounded-xl p-2.5 text-xs space-y-2 border border-[#2e3646]">
                <div className="px-2 py-0.5 text-[9px] text-slate-400 font-mono font-bold tracking-wider">SYSTEM STATUS</div>
                <div className="flex justify-between px-2 text-slate-300 text-[11px]">
                  <span>Server IP:</span>
                  <span className="font-mono text-[#38bdf8] font-bold">192.168.1.1</span>
                </div>
                <div className="flex justify-between px-2 text-slate-300 text-[11px]">
                  <span>Audit Sync:</span>
                  <span className="text-emerald-400 font-bold">ACTIVE</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-1.5 hover:bg-rose-500/10 hover:text-rose-400 rounded-lg transition-colors flex items-center gap-1.5 font-bold text-slate-300 text-xs cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out Session
                </button>
              </div>
            )}
          </div>

          {/* Navigation Menu Links */}
          <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-none">
            {effectiveMenuGroups.map((group) => {
              const visibleItems = group.items.filter((item) => {
                return allowedNavigationIds.has(item.id);
              });

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  {sidebarOpen && (
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-2 font-mono">
                      {group.title}
                    </h4>
                  )}
                    {visibleItems.map((item) => {
                      const isActive = activeTab === item.id || 
                                      (item.id === 'overview' && (activeTab === 'overview' || activeTab === 'dashboard')) ||
                                      (item.id === 'dashboard' && (activeTab === 'overview' || activeTab === 'dashboard')) ||
                                      (item.id === 'doctors' && (activeTab === 'doctors' || activeTab === 'consult')) ||
                                      (item.id === 'consult' && (activeTab === 'doctors' || activeTab === 'consult')) ||
                                      (item.id === 'lab-technicians' && (activeTab === 'lab-technicians' || activeTab === 'lab')) ||
                                      (item.id === 'lab' && (activeTab === 'lab-technicians' || activeTab === 'lab')) ||
                                      (item.id === 'pharmacists' && (activeTab === 'pharmacists' || activeTab === 'pharmacy')) ||
                                      (item.id === 'pharmacy' && (activeTab === 'pharmacists' || activeTab === 'pharmacy')) ||
                                      (item.id === 'procurement' && (activeTab === 'procurement' || activeTab === 'pharmacy-procurement')) ||
                                      (item.id === 'outstanding' && (activeTab === 'outstanding' || activeTab === 'cashier-outstanding')) ||
                                      (item.id === 'discounts' && (activeTab === 'discounts' || activeTab === 'cashier-discounts')) ||
                                      (item.id === 'registered-patients' && activeTab === 'eye-clinic') ||
                                      (item.id === 'eye-clinic' && (activeTab === 'registered-patients' || activeTab === 'consultation' || activeTab === 'all-records')) ||
                                      (item.id === 'nursing' && (activeTab === 'nursing' || activeTab === 'triage' || activeTab === 'admitted-patients' || activeTab === 'detained-patients' || activeTab === 'nurse-dispensing' || activeTab === 'injection-records')) ||
                                      (item.id === 'triage' && (activeTab === 'nursing' || activeTab === 'triage' || activeTab === 'admitted-patients' || activeTab === 'detained-patients' || activeTab === 'nurse-dispensing' || activeTab === 'injection-records'));

                    if (item.id === 'patients') {
                      const isOpdActive = activeTab === 'patients' || activeTab.startsWith('patients');
                      const isSubMenuVisible = isOpdHovered || opdSubMenuOpen || isOpdActive;

                      const opdSubItems = [
                        { id: 'patients-reception', label: 'Reception desk', icon: <ClipboardList className="h-3.5 w-3.5" /> },
                        { id: 'patients-returning', label: 'Returning patients', icon: <UserCheck className="h-3.5 w-3.5" /> },
                        { id: 'patients-admissions', label: 'Admissions and balancing', icon: <BedDouble className="h-3.5 w-3.5" /> }
                      ];

                      return (
                        <div 
                          key={item.id} 
                          onMouseEnter={() => setIsOpdHovered(true)} 
                          onMouseLeave={() => setIsOpdHovered(false)}
                          className="relative space-y-1"
                        >
                          {/* Main OPD Reception Link Button */}
                          <button
                            onClick={() => {
                              setOpdSubMenuOpen(!opdSubMenuOpen);
                              handleNavClick('patients-reception');
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                              isOpdActive
                                ? 'bg-[#2A758C] text-white shadow-md shadow-[#2A758C]/30 font-black scale-[1.02]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={isOpdActive ? 'text-white' : 'text-slate-400'}>
                                {item.icon}
                              </span>
                              {sidebarOpen && <span>{item.label}</span>}
                            </div>
                            {sidebarOpen && (
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isSubMenuVisible ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                            )}
                          </button>

                          {/* Expanded Sub-Menu (when sidebar is open) */}
                          <AnimatePresence>
                            {sidebarOpen && isSubMenuVisible && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pl-3 pr-1 space-y-1 overflow-hidden"
                              >
                                <div className="border-l-2 border-[#2e3646] pl-2 space-y-1 py-1">
                                  {opdSubItems.map((sub) => {
                                    const isSubActive = (activeTab === 'patients' && sub.id === 'patients-reception') || activeTab === sub.id;
                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={() => handleNavClick(sub.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                          isSubActive
                                            ? 'bg-[#2A758C]/30 text-[#38bdf8] font-black border border-[#2A758C]/50'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                      >
                                        <span className={isSubActive ? 'text-[#38bdf8]' : 'text-slate-400'}>
                                          {sub.icon}
                                        </span>
                                        <span className="truncate">{sub.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Collapsed Sidebar Flyout Popover (when sidebar is closed) */}
                          <AnimatePresence>
                            {!sidebarOpen && isOpdHovered && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="absolute left-full top-0 ml-3 w-56 bg-[#181D27] border border-[#2e3646] rounded-2xl p-2.5 shadow-2xl z-50 text-white space-y-1.5"
                              >
                                <div className="px-2 py-1 text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider border-b border-[#2e3646]">
                                  OPD Reception Menu
                                </div>
                                {opdSubItems.map((sub) => {
                                  const isSubActive = (activeTab === 'patients' && sub.id === 'patients-reception') || activeTab === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => handleNavClick(sub.id)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isSubActive
                                          ? 'bg-[#2A758C] text-white font-black'
                                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                                      }`}
                                    >
                                      <span>{sub.icon}</span>
                                      <span className="truncate">{sub.label}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    if (item.id === 'cashier' && !isCashierStaff) {
                      const isCashierActive = activeTab === 'cashier' || activeTab.startsWith('cashier');
                      const isSubMenuVisible = isCashierHovered || cashierSubMenuOpen || isCashierActive;

                      const cashierSubItems = [
                        { id: 'cashier-billing', label: 'Billing Desk', icon: <Coins className="h-3.5 w-3.5" /> },
                        { id: 'cashier-lab-payments', label: 'Doctor Lab Request', icon: <FlaskConical className="h-3.5 w-3.5" /> },
                        { id: 'cashier-walkin-verify', label: 'Walk-in Lab Verification', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
                        { id: 'cashier-outstanding', label: 'Outstanding Balances', icon: <AlertTriangle className="h-3.5 w-3.5" /> },
                        { id: 'cashier-vitae', label: 'Payment Vitae', icon: <Receipt className="h-3.5 w-3.5" /> },
                        { id: 'cashier-no-charge', label: 'No Charge Patients', icon: <UserCheck className="h-3.5 w-3.5" /> },
                        { id: 'cashier-maternity-supplies', label: 'Maternity Ward Supplies', icon: <Baby className="h-3.5 w-3.5 text-pink-600" /> }
                      ];

                      return (
                        <div 
                          key={item.id} 
                          onMouseEnter={() => setIsCashierHovered(true)} 
                          onMouseLeave={() => setIsCashierHovered(false)}
                          className="relative space-y-1"
                        >
                          {/* Main Billing & Cashier Link Button */}
                          <button
                            onClick={() => {
                              setCashierSubMenuOpen(!cashierSubMenuOpen);
                              handleNavClick('cashier-billing');
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                              isCashierActive
                                ? 'bg-[#2A758C] text-white shadow-md shadow-[#2A758C]/30 font-black scale-[1.02]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={isCashierActive ? 'text-white' : 'text-slate-400'}>
                                {item.icon}
                              </span>
                              {sidebarOpen && <span>{item.label}</span>}
                            </div>
                            {sidebarOpen && (
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isSubMenuVisible ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                            )}
                          </button>

                          {/* Expanded Sub-Menu (when sidebar is open) */}
                          <AnimatePresence>
                            {sidebarOpen && isSubMenuVisible && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pl-3 pr-1 space-y-1 overflow-hidden"
                              >
                                <div className="border-l-2 border-[#2e3646] pl-2 space-y-1 py-1">
                                  {cashierSubItems.map((sub) => {
                                    const isSubActive = (activeTab === 'cashier' && sub.id === 'cashier-billing') || activeTab === sub.id;
                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={() => handleNavClick(sub.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                          isSubActive
                                            ? 'bg-[#2A758C]/30 text-[#38bdf8] font-black border border-[#2A758C]/50'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                      >
                                        <span className={isSubActive ? 'text-[#38bdf8]' : 'text-slate-400'}>
                                          {sub.icon}
                                        </span>
                                        <span className="truncate">{sub.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Collapsed Sidebar Flyout Popover (when sidebar is closed) */}
                          <AnimatePresence>
                            {!sidebarOpen && isCashierHovered && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="absolute left-full top-0 ml-3 w-56 bg-[#181D27] border border-[#2e3646] rounded-2xl p-2.5 shadow-2xl z-50 text-white space-y-1.5"
                              >
                                <div className="px-2 py-1 text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider border-b border-[#2e3646]">
                                  Billing & Cashier Menu
                                </div>
                                {cashierSubItems.map((sub) => {
                                  const isSubActive = (activeTab === 'cashier' && sub.id === 'cashier-billing') || activeTab === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => handleNavClick(sub.id)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isSubActive
                                          ? 'bg-[#2A758C] text-white font-black'
                                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                                      }`}
                                    >
                                      <span>{sub.icon}</span>
                                      <span className="truncate">{sub.label}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    if (item.id === 'pharmacy') {
                      const isPharmacyActive = activeTab === 'pharmacy' || activeTab.startsWith('pharmacy') || activeTab === 'dispensing' || activeTab === 'admitted' || activeTab === 'procurement' || activeTab === 'stock';
                      const isSubMenuVisible = isPharmacyHovered || pharmacySubMenuOpen || isPharmacyActive;

                      const pharmacySubItems = [
                        { id: 'pharmacy-dispensing', label: 'Dispensing', icon: <Pill className="h-3.5 w-3.5" /> },
                        { id: 'pharmacy-admitted', label: 'Admitted Orders', icon: <BedDouble className="h-3.5 w-3.5" /> },
                        { id: 'pharmacy-procurement', label: 'Procurement Request', icon: <ShoppingBag className="h-3.5 w-3.5" /> },
                        { id: 'pharmacy-stock', label: 'Stock Log', icon: <Boxes className="h-3.5 w-3.5" /> }
                      ];

                      return (
                        <div 
                          key={item.id} 
                          onMouseEnter={() => setIsPharmacyHovered(true)} 
                          onMouseLeave={() => setIsPharmacyHovered(false)}
                          className="relative space-y-1"
                        >
                          {/* Main Pharmacy Link Button */}
                          <button
                            onClick={() => {
                              setPharmacySubMenuOpen(!pharmacySubMenuOpen);
                              handleNavClick('pharmacy-dispensing');
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                              isPharmacyActive
                                ? 'bg-[#2A758C] text-white shadow-md shadow-[#2A758C]/30 font-black scale-[1.02]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={isPharmacyActive ? 'text-white' : 'text-slate-400'}>
                                {item.icon}
                              </span>
                              {sidebarOpen && <span>{item.label}</span>}
                            </div>
                            {sidebarOpen && (
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isSubMenuVisible ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                            )}
                          </button>

                          {/* Expanded Sub-Menu (when sidebar is open) */}
                          <AnimatePresence>
                            {sidebarOpen && isSubMenuVisible && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pl-3 pr-1 space-y-1 overflow-hidden"
                              >
                                <div className="border-l-2 border-[#2e3646] pl-2 space-y-1 py-1">
                                  {pharmacySubItems.map((sub) => {
                                    const isSubActive = (activeTab === 'pharmacy' && sub.id === 'pharmacy-dispensing') || activeTab === sub.id;
                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={() => handleNavClick(sub.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                          isSubActive
                                            ? 'bg-[#2A758C]/30 text-[#38bdf8] font-black border border-[#2A758C]/50'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                      >
                                        <span className={isSubActive ? 'text-[#38bdf8]' : 'text-slate-400'}>
                                          {sub.icon}
                                        </span>
                                        <span className="truncate">{sub.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Collapsed Sidebar Flyout Popover (when sidebar is closed) */}
                          <AnimatePresence>
                            {!sidebarOpen && isPharmacyHovered && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="absolute left-full top-0 ml-3 w-56 bg-[#181D27] border border-[#2e3646] rounded-2xl p-2.5 shadow-2xl z-50 text-white space-y-1.5"
                              >
                                <div className="px-2 py-1 text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider border-b border-[#2e3646]">
                                  Pharmacy Menu
                                </div>
                                {pharmacySubItems.map((sub) => {
                                  const isSubActive = (activeTab === 'pharmacy' && sub.id === 'pharmacy-dispensing') || activeTab === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => handleNavClick(sub.id)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isSubActive
                                          ? 'bg-[#2A758C] text-white font-black'
                                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                                      }`}
                                    >
                                      <span>{sub.icon}</span>
                                      <span className="truncate">{sub.label}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    if (item.id === 'eye-clinic') {
                      const isEyeActive = activeTab === 'eye-clinic' || activeTab === 'registered-patients' || activeTab === 'consultation' || activeTab === 'all-records';
                      const isSubMenuVisible = isEyeHovered || eyeSubMenuOpen || isEyeActive;

                      const eyeSubItems = [
                        { id: 'registered-patients', label: 'Register Patient', icon: <Users className="h-3.5 w-3.5" /> },
                        { id: 'consultation', label: 'Consultation', icon: <Stethoscope className="h-3.5 w-3.5" /> },
                        { id: 'all-records', label: 'All Records', icon: <ClipboardList className="h-3.5 w-3.5" /> }
                      ];

                      return (
                        <div 
                          key={item.id} 
                          onMouseEnter={() => setIsEyeHovered(true)} 
                          onMouseLeave={() => setIsEyeHovered(false)}
                          className="relative space-y-1"
                        >
                          {/* Main Eye Clinic Link Button */}
                          <button
                            onClick={() => {
                              setEyeSubMenuOpen(!eyeSubMenuOpen);
                              handleNavClick('eye-clinic');
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                              isEyeActive
                                ? 'bg-[#2A758C] text-white shadow-md shadow-[#2A758C]/30 font-black scale-[1.02]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={isEyeActive ? 'text-white' : 'text-slate-400'}>
                                {item.icon}
                              </span>
                              {sidebarOpen && <span>{item.label}</span>}
                            </div>
                            {sidebarOpen && (
                              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isSubMenuVisible ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                            )}
                          </button>

                          {/* Expanded Sub-Menu (when sidebar is open) */}
                          <AnimatePresence>
                            {sidebarOpen && isSubMenuVisible && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pl-3 pr-1 space-y-1 overflow-hidden"
                              >
                                <div className="border-l-2 border-[#2e3646] pl-2 space-y-1 py-1">
                                  {eyeSubItems.map((sub) => {
                                    const isSubActive = (activeTab === 'eye-clinic' && sub.id === 'registered-patients') || activeTab === sub.id;
                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={() => handleNavClick(sub.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                          isSubActive
                                            ? 'bg-[#2A758C]/30 text-[#38bdf8] font-black border border-[#2A758C]/50'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                      >
                                        <span className={isSubActive ? 'text-[#38bdf8]' : 'text-slate-400'}>
                                          {sub.icon}
                                        </span>
                                        <span className="truncate">{sub.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Collapsed Sidebar Flyout Popover (when sidebar is closed) */}
                          <AnimatePresence>
                            {!sidebarOpen && isEyeHovered && (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="absolute left-full top-0 ml-3 w-56 bg-[#181D27] border border-[#2e3646] rounded-2xl p-2.5 shadow-2xl z-50 text-white space-y-1.5"
                              >
                                <div className="px-2 py-1 text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider border-b border-[#2e3646]">
                                  Eye Clinic Menu
                                </div>
                                {eyeSubItems.map((sub) => {
                                  const isSubActive = (activeTab === 'eye-clinic' && sub.id === 'registered-patients') || activeTab === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => handleNavClick(sub.id)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isSubActive
                                          ? 'bg-[#2A758C] text-white font-black'
                                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                                      }`}
                                    >
                                      <span>{sub.icon}</span>
                                      <span className="truncate">{sub.label}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    if (item.id === 'nursing' || item.id === 'triage') {
                      const isNurseActive = 
                        activeTab === 'nursing' || 
                        activeTab === 'triage' ||
                        activeTab === 'admitted-patients' || 
                        activeTab === 'detained-patients' || 
                        activeTab === 'nurse-dispensing' || 
                        activeTab === 'injection-records';
                      const isSubMenuVisible = isNurseHovered || nurseSubMenuOpen || isNurseActive;

                      const nurseSubItems = [
                        { id: 'admitted-patients', label: 'Admitted patients', icon: <BedDouble className="h-3.5 w-3.5" /> },
                        { id: 'detained-patients', label: 'Detained patients', icon: <Activity className="h-3.5 w-3.5" /> },
                        { id: 'nurse-dispensing', label: 'Nurse dispensing', icon: <Pill className="h-3.5 w-3.5" /> },
                        { id: 'injection-records', label: 'Injection records', icon: <Syringe className="h-3.5 w-3.5" /> }
                      ];

                      return (
                        <div 
                          key={item.id} 
                          className="relative"
                          onMouseEnter={() => setIsNurseHovered(true)}
                          onMouseLeave={() => setIsNurseHovered(false)}
                        >
                          <button
                            onClick={() => {
                              setNurseSubMenuOpen(!nurseSubMenuOpen);
                              handleNavClick('admitted-patients');
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                              isNurseActive
                                ? 'bg-[#2A758C] text-white shadow-md shadow-[#2A758C]/30 font-black scale-[1.02]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={isNurseActive ? 'text-white' : 'text-slate-400'}>
                                {item.icon}
                              </span>
                              {sidebarOpen && <span>{item.label}</span>}
                            </div>
                            {sidebarOpen && (
                              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isSubMenuVisible ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                            )}
                          </button>

                          {/* Submenu for expanded sidebar */}
                          {sidebarOpen && (
                            <AnimatePresence>
                              {isSubMenuVisible && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="pl-4 pr-1 py-1 space-y-1 overflow-hidden"
                                >
                                  {nurseSubItems.map((sub) => {
                                    const isSubActive = activeTab === sub.id;
                                    return (
                                      <button
                                        key={sub.id}
                                        onClick={() => handleNavClick(sub.id)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                          isSubActive
                                            ? 'bg-white/10 text-white font-black'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                      >
                                        <span className={isSubActive ? 'text-white' : 'text-slate-400'}>{sub.icon}</span>
                                        <span>{sub.label}</span>
                                      </button>
                                    );
                                  })}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}

                          {/* Flyout Submenu for collapsed sidebar */}
                          <AnimatePresence>
                            {!sidebarOpen && isNurseHovered && (
                              <motion.div
                                initial={{ opacity: 0, x: 10, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 10, scale: 0.95 }}
                                className="absolute left-full top-0 ml-2 w-48 bg-[#181D27] border border-[#2e3646] rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 backdrop-blur-md"
                              >
                                <div className="px-2 py-1 text-[10px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider border-b border-[#2e3646]">
                                  Nursing Menu
                                </div>
                                {nurseSubItems.map((sub) => {
                                  const isSubActive = activeTab === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => handleNavClick(sub.id)}
                                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        isSubActive
                                          ? 'bg-[#2A758C] text-white font-black'
                                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                                      }`}
                                    >
                                      <span>{sub.icon}</span>
                                      <span className="truncate">{sub.label}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold tracking-tight transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#2A758C] text-white shadow-md shadow-[#2A758C]/30 font-black scale-[1.02]'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={isActive ? 'text-white' : 'text-slate-400'}>
                            {item.icon}
                          </span>
                          {sidebarOpen && <span>{item.label}</span>}
                        </div>
                        {item.badge && sidebarOpen && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                            isActive ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with sign out and system link status */}
        <div className="p-4 border-t border-[#222836] space-y-3">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              sidebarOpen 
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20' 
                : 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20'
            }`}
            title="Sign Out Session"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Sign Out Session</span>}
          </button>

          {sidebarOpen && (
            <div className="text-center space-y-2 pt-1">
              <p className="text-[9px] text-slate-400 font-medium">© 2026 Zikora Medical HMS</p>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        
        {/* TOP BAR: Header search panel, icons & user profile matching references */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 shrink-0 relative z-20 shadow-2xs">
          {/* Left Area: Toggle Menu and Pill Search bar */}
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-slate-100/80 text-slate-600 rounded-xl transition-all cursor-pointer"
              title="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Custom rounded pill search bar from reference images */}
            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients, invoices, tests, or doctors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/70 border border-slate-200/70 focus:border-[#2A758C] focus:ring-2 focus:ring-[#2A758C]/15 focus:bg-white rounded-full py-2 pl-10 pr-4 text-xs font-semibold text-slate-700 placeholder-slate-400 transition-all outline-none"
              />
            </div>
          </div>

          {/* Right Area: Action tools and user status matching video precisely */}
          <div className="flex items-center gap-4 shrink-0">
            
            {/* Notification bell & Dropdown (Commented out per user request) */}
            {/*
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 hover:bg-slate-100/80 rounded-2xl text-slate-600 transition-all cursor-pointer relative" 
                title="Hospital Broadcasts"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse border-2 border-white"></span>
                )}
              </button>

              {notificationsOpen && (
                <div className="fixed inset-0 z-30" onClick={() => setNotificationsOpen(false)} />
              )}

              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl z-40 overflow-hidden flex flex-col text-white"
                  >
                    <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
                      <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                        <Bell className="h-4.5 w-4.5 text-[#A3D1E0]" /> In-App Notification Center
                      </span>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[10px] text-[#A3D1E0] hover:text-[#82bdcf] font-bold hover:underline cursor-pointer bg-transparent border-none outline-none"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="flex-grow overflow-y-auto divide-y divide-slate-800/60 max-h-80">
                      {notifications.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-xs font-medium">
                          <Bell className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                          No active notifications
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          let iconBg = 'bg-slate-800/80 text-slate-300';
                          let icon = <Bell className="h-4 w-4" />;
                          let accentColor = 'bg-slate-500';

                          if (notif.type === 'PATIENT_REGISTERED') {
                            iconBg = 'bg-[#A3D1E0]/20 text-[#A3D1E0]';
                            icon = <Activity className="h-4 w-4" />;
                            accentColor = 'bg-[#A3D1E0]';
                          } else if (notif.type === 'VITALS_RECORDED') {
                            iconBg = 'bg-emerald-500/20 text-emerald-400';
                            icon = <Activity className="h-4 w-4" />;
                            accentColor = 'bg-emerald-400';
                          } else if (notif.type === 'SECURITY' || notif.type === 'SYSTEM') {
                            iconBg = 'bg-blue-500/20 text-blue-400';
                            icon = <Shield className="h-4 w-4" />;
                            accentColor = 'bg-blue-400';
                          } else if (notif.type === 'BROADCAST') {
                            iconBg = 'bg-purple-500/20 text-purple-400';
                            icon = <Sparkles className="h-4 w-4" />;
                            accentColor = 'bg-purple-400';
                          }

                          return (
                            <div 
                              key={notif.id} 
                              onClick={() => handleNotificationClick(notif.id)}
                              className={`p-3.5 flex gap-3 hover:bg-slate-800/40 transition-all cursor-pointer relative text-left border-l-3 ${!notif.read ? 'border-l-[#A3D1E0] bg-slate-800/20' : 'border-l-transparent'}`}
                            >
                              {!notif.read && (
                                <span className={`absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 ${accentColor} rounded-full`}></span>
                              )}
                              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-sm`}>
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0 pl-1">
                                <p className={`text-xs text-slate-100 leading-normal ${!notif.read ? 'font-bold' : 'font-medium'}`}>
                                  {notif.message}
                                </p>
                                <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                                  {notif.timestamp}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 bg-slate-950/40 border-t border-slate-800 flex justify-between items-center">
                        <button 
                          onClick={handleClearAll}
                          className="text-[10px] text-slate-400 hover:text-slate-300 font-semibold cursor-pointer bg-transparent border-none outline-none"
                        >
                          Clear All
                        </button>
                        <button 
                          onClick={() => setNotificationsOpen(false)}
                          className="text-[10px] text-slate-300 hover:text-white font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/50 transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            */}

            <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

            {/* Profile mini representation & Sign Out shortcut */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-[#4a8ca0] shadow-inner">
                  {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-800 hidden md:block">
                  {user.name.split(' ')[0]}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs animate-fade-in"
                title="Sign Out Session"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* 3. DYNAMIC CONTENT AREA */}
        <main className="reference-main flex-1 p-4 overflow-y-auto max-w-none mx-0 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-100 py-3.5 text-center text-[10px] font-mono text-slate-400">
          Zikora Medical Centre Intranet HMS (Hospital Management System) • Phase 1 Core Deployment • Developer Console
        </footer>
      </div>
      
    </div>
  );
}
