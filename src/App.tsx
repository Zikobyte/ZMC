/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import LoginScreen from './components/LoginScreen';
import DashboardLayout from './components/DashboardLayout';
import DashboardView from './components/DashboardView';
import OPDRegistrationView from './components/OPDRegistrationView';
import EyeClinicView from './components/EyeClinicView';
import DoctorView from './components/DoctorView';
import UserManagementView from './components/UserManagementView';
import CashierView from './components/CashierView';
import LaboratoryView from './components/LaboratoryView';
import PharmacyView from './components/PharmacyView';
import HRDashboardView from './components/HRDashboardView';
import NursingView from './components/NursingView';
import NotificationCenter from './components/NotificationCenter';
import { isTokenExpired, socketManager } from './utils/api';
import { isNavigationAllowed } from './config/navigation';

const tabToPathMap: Record<string, string> = {
  dashboard: '/dashboard',
  overview: '/overview',
  'hr-dashboard': '/hr/dashboard',
  'hr-employees': '/hr/employees',
  'hr-absences': '/hr/absences',
  'hr-recruitment': '/hr/recruitment',
  'hr-procurement': '/hr/procurement',
  'hr-discounts': '/hr/discounts',
  employees: '/hr/employees',
  absences: '/hr/absences',
  recruitment: '/hr/recruitment',
  patients: '/opd',
  'patients-reception': '/opd/reception',
  'patients-returning': '/opd/returning',
  'patients-admissions': '/opd/admissions',
  nursing: '/nursing',
  'admitted-patients': '/nursing/admitted',
  'detained-patients': '/nursing/detained',
  'nurse-dispensing': '/nursing/dispensing',
  'injection-records': '/nursing/injections',
  triage: '/nursing',
  cashier: '/cashier',
  consult: '/doctors',
  doctors: '/doctors',
  'standard-cards': '/doctors/standard-cards',
  'specialized-care': '/doctors/specialized-care',
  lab: '/lab',
  'lab-walkin': '/lab/walkin',
  'lab-technicians': '/lab',
  pharmacy: '/pharmacy',
  pharmacists: '/pharmacy',
  procurement: '/procurement',
  outstanding: '/outstanding',
  discounts: '/discounts',
  'eye-clinic': '/eyeclinic',
  'registered-patients': '/eyeclinic/register',
  'consultation': '/eyeclinic/consultation',
  'all-records': '/eyeclinic/records',
  records: '/records',
  users: '/users',
  maintenance: '/maintenance',
  'activity-log': '/activity-log',
  it: '/it',
  settings: '/settings',
  widgets: '/widgets',
};

const pathToTabMap: Record<string, string> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/overview': 'overview',
  '/hr': 'hr-dashboard',
  '/hr/dashboard': 'hr-dashboard',
  '/hr/employees': 'hr-employees',
  '/hr/absences': 'hr-absences',
  '/hr/recruitment': 'hr-recruitment',
  '/hr/procurement': 'hr-procurement',
  '/hr/discounts': 'hr-discounts',
  '/employees': 'hr-employees',
  '/absences': 'hr-absences',
  '/recruitment': 'hr-recruitment',
  '/opd': 'patients-reception',
  '/opd/reception': 'patients-reception',
  '/opd/returning': 'patients-returning',
  '/opd/admissions': 'patients-admissions',
  '/nursing': 'admitted-patients',
  '/nursing/admitted': 'admitted-patients',
  '/nursing/detained': 'detained-patients',
  '/nursing/dispensing': 'nurse-dispensing',
  '/nursing/injections': 'injection-records',
  '/admitted-patients': 'admitted-patients',
  '/detained-patients': 'detained-patients',
  '/nurse-dispensing': 'nurse-dispensing',
  '/injection-records': 'injection-records',
  '/triage': 'triage',
  '/cashier': 'cashier',
  '/doctors': 'doctors',
  '/consult': 'consult',
  '/doctors/standard-cards': 'standard-cards',
  '/doctors/specialized-care': 'specialized-care',
  '/standard-cards': 'standard-cards',
  '/specialized-care': 'specialized-care',
  '/lab': 'lab',
  '/lab/walkin': 'lab-walkin',
  '/lab-technicians': 'lab-technicians',
  '/pharmacy': 'pharmacy',
  '/pharmacists': 'pharmacists',
  '/procurement': 'procurement',
  '/outstanding': 'outstanding',
  '/discounts': 'discounts',
  '/eyeclinic': 'eye-clinic',
  '/eye-clinic': 'eye-clinic',
  '/eyeclinic/register': 'registered-patients',
  '/eyeclinic/consultation': 'consultation',
  '/eyeclinic/records': 'all-records',
  '/registered-patients': 'registered-patients',
  '/consultation': 'consultation',
  '/all-records': 'all-records',
  '/records': 'records',
  '/users': 'users',
  '/it/users': 'users',
  '/maintenance': 'maintenance',
  '/it/maintenance': 'maintenance',
  '/activity-log': 'activity-log',
  '/it/activity-log': 'activity-log',
  '/it': 'users',
  '/settings': 'settings',
  '/widgets': 'widgets',
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  
  // Initialize tab based on initial path
  const getInitialTab = () => {
    const path = window.location.pathname;
    return pathToTabMap[path] || 'dashboard';
  };

  const [activeTab, setActiveTabState] = useState(getInitialTab);
  const [openPatientRegistration, setOpenPatientRegistration] = useState(false);

  // Custom setter that updates both the tab state and browser URL path
  const handleSetActiveTab = (tab: string) => {
    if (user && !isNavigationAllowed(user, tab)) {
      return;
    }

    setActiveTabState(tab);
    const targetPath = tabToPathMap[tab];
    if (targetPath && window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  useEffect(() => {
    // Check if user session already exists in localStorage
    const savedUser = localStorage.getItem('zmc_user');
    const token = localStorage.getItem('zmc_token');
    
    if (savedUser && token) {
      if (isTokenExpired(token)) {
        localStorage.removeItem('zmc_user');
        localStorage.removeItem('zmc_token');
        setUser(null);
      } else {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          localStorage.removeItem('zmc_user');
          localStorage.removeItem('zmc_token');
        }
      }
    }

    // Handle back/forward navigation in the browser
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const matchedTab = pathToTabMap[currentPath] || 'dashboard';
      setActiveTabState(matchedTab);
    };

    // Handle logout event triggered by expired tokens or API 401s
    const handleLogoutEvent = () => {
      handleLogout();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('zmc-logout', handleLogoutEvent);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('zmc-logout', handleLogoutEvent);
    };
  }, []);

  const getDefaultTabForUser = (u: User): string => {
    if (u.role === 'Laboratory Scientist' || u.role === 'Lab Technician' || u.department === 'Laboratory') return 'lab';
    if (u.role === 'Doctor') return u.department === 'Eye Clinic' ? 'registered-patients' : 'consult';
    if (u.role === 'Cashier' || u.department === 'Cashier' || u.department === 'Finance') return 'cashier';
    if (u.role === 'Pharmacist' || u.department === 'Pharmacy') return 'pharmacy';
    if (u.role === 'Nurse' || u.department === 'Nursing') return 'admitted-patients';
    if (u.role === 'OPD Clerk' || u.role === 'Receptionist') return 'patients';
    if (u.role === 'Account Officer' || u.role === 'Accountant' || u.department === 'Accounts') return 'overview';
    if (u.role === 'HR Manager' || u.role === 'Human Resources' || u.department === 'Human Resources' || u.department === 'HR') return 'hr-dashboard';
    if (u.role === 'Eye Clinic' || u.department === 'Eye Clinic') return 'registered-patients';
    if (u.role === 'IT Administrator' || u.department === 'IT' || u.username === 'admin') return 'users';
    return 'dashboard';
  };

  useEffect(() => {
    if (user && !isNavigationAllowed(user, activeTab)) {
      handleSetActiveTab(getDefaultTabForUser(user));
    }
  }, [user, activeTab]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('zmc_user', JSON.stringify(loggedInUser));
    
    // Always navigate to the user's specific department desk on login
    const defaultTab = getDefaultTabForUser(loggedInUser);
    handleSetActiveTab(defaultTab);
    
    socketManager.reconnect();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('zmc_user');
    localStorage.removeItem('zmc_token');
    // Clear URL so previous department view does not linger for next login
    window.history.pushState(null, '', '/');
    setActiveTabState('dashboard');
    socketManager.reconnect();
  };

  if (!user) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
        <NotificationCenter />
      </>
    );
  }

  return (
    <>
      <DashboardLayout
        user={user}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={handleSetActiveTab}
      >
        {(activeTab === 'dashboard' || activeTab === 'overview') && (
          <DashboardView 
            user={user}
            onNavigateToPatients={() => {
              if (user.role === 'Doctor') {
                handleSetActiveTab('consult');
              } else {
                handleSetActiveTab('patients');
              }
            }} 
            onOpenRegisterPatient={() => {
              setOpenPatientRegistration(true);
              handleSetActiveTab('patients');
            }}
            onNavigateToEyeClinic={() => {
              handleSetActiveTab('eye-clinic');
            }}
            onNavigateToStandardCards={() => {
              handleSetActiveTab('standard-cards');
            }}
            onNavigateToSpecializedCare={() => {
              handleSetActiveTab('specialized-care');
            }}
          />
        )}
        {(activeTab === 'patients' || activeTab.startsWith('patients')) && (
          <OPDRegistrationView 
            activeTab={activeTab} 
            initialOpenRegister={openPatientRegistration}
            onRegisterModalClose={() => setOpenPatientRegistration(false)}
          />
        )}
        {(activeTab === 'admitted-patients' ||
          activeTab === 'detained-patients' ||
          activeTab === 'nurse-dispensing' ||
          activeTab === 'injection-records' ||
          activeTab === 'nursing') && (
          <NursingView activeTab={activeTab} onTabChange={handleSetActiveTab} />
        )}
        {activeTab === 'triage' && <OPDRegistrationView activeTab={activeTab} />}
        {(activeTab === 'eye-clinic' || activeTab === 'registered-patients' || activeTab === 'consultation' || activeTab === 'all-records') && (
          <EyeClinicView activeTab={activeTab} onTabChange={handleSetActiveTab} />
        )}
        {(activeTab === 'consult' || activeTab === 'doctors' || activeTab === 'standard-cards' || activeTab === 'specialized-care') && (
          <DoctorView 
            activeSubTab={
              activeTab === 'standard-cards' ? 'standard' :
              activeTab === 'specialized-care' ? 'specialized' :
              'outpatients'
            }
            onNavigateTab={handleSetActiveTab}
          />
        )}
        {(activeTab === 'lab' || activeTab === 'lab-technicians' || activeTab === 'lab-walkin') && <LaboratoryView activeTab={activeTab} />}
        {(activeTab === 'pharmacy' || activeTab.startsWith('pharmacy') || activeTab === 'pharmacists' || activeTab === 'dispensing' || activeTab === 'admitted' || activeTab === 'stock') && (
          <PharmacyView activeTab={activeTab} onTabChange={handleSetActiveTab} />
        )}
        {activeTab === 'procurement' && (
          <PharmacyView activeTab="procurement" onTabChange={handleSetActiveTab} />
        )}
        {activeTab === 'records' && <OPDRegistrationView activeTab={activeTab} />}
        {activeTab === 'settings' && <OPDRegistrationView activeTab={activeTab} />}
        {(activeTab === 'users' || activeTab === 'maintenance' || activeTab === 'activity-log' || activeTab === 'it') && (
          <UserManagementView
            activeSubTab={activeTab}
            onTabChange={handleSetActiveTab}
            currentUser={user}
          />
        )}
        {(activeTab.startsWith('hr-') || 
          activeTab === 'employees' || 
          activeTab === 'absences' || 
          activeTab === 'recruitment' || 
          ((user.role === 'HR Manager' || user.department === 'Human Resources' || user.department === 'HR') && (activeTab === 'procurement' || activeTab === 'discounts'))) && (
          <HRDashboardView
            activeSubTab={activeTab}
            onTabChange={handleSetActiveTab}
            currentUser={user}
          />
        )}
        {(activeTab === 'cashier' || activeTab.startsWith('cashier') || activeTab === 'outstanding' || (activeTab === 'discounts' && user.role !== 'HR Manager' && user.department !== 'Human Resources')) && (
          <CashierView activeTab={activeTab} />
        )}
      </DashboardLayout>
      <NotificationCenter />
    </>
  );
}
