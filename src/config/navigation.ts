import { User } from '../types';

export const ALL_NAVIGATION_IDS = [
  'dashboard', 'patients', 'records', 'widgets', 'consult', 'nursing', 'lab', 'pharmacy',
  'pharmacy-stock', 'procurement', 'cashier', 'cashier-outstanding', 'cashier-pv',
  'cashier-no-charge', 'cashier-maternity-supplies', 'cashier-discounts', 'cashier-lab-payments',
  'cashier-walkin-verify', 'cashier-iclinic-registrations', 'overview',
  'doctors', 'lab-technicians', 'pharmacists', 'outstanding', 'discounts', 'lab-walkin',
  'registered-patients', 'consultation', 'all-records', 'admitted-patients',
  'detained-patients', 'nurse-dispensing', 'injection-records', 'hr-dashboard',
  'hr-employees', 'hr-absences', 'hr-recruitment', 'hr-procurement', 'hr-discounts',
  'users', 'maintenance', 'activity-log', 'settings',
] as const;

export type NavigationId = (typeof ALL_NAVIGATION_IDS)[number];

const navigationByDepartment: Record<string, readonly NavigationId[]> = {
  opd: ['dashboard', 'patients', 'records', 'widgets'],
  doctor: ['consult', 'patients', 'nursing', 'records', 'lab', 'pharmacy', 'widgets'],
  nurse: ['admitted-patients', 'detained-patients', 'nurse-dispensing', 'injection-records', 'dashboard'],
  laboratory: ['lab', 'lab-walkin', 'widgets'],
  pharmacy: ['pharmacy', 'pharmacy-stock', 'procurement', 'widgets'],
  cashier: ['cashier', 'cashier-lab-payments', 'cashier-iclinic-registrations', 'cashier-walkin-verify', 'cashier-outstanding', 'cashier-pv', 'cashier-no-charge', 'cashier-maternity-supplies', 'cashier-discounts'],
  finance: ['overview', 'doctors', 'lab-technicians', 'pharmacists', 'procurement', 'outstanding', 'discounts'],
  eye: ['registered-patients', 'consultation', 'all-records', 'dashboard'],
  hr: ['hr-dashboard', 'hr-employees', 'hr-absences', 'hr-recruitment', 'hr-procurement', 'hr-discounts', 'dashboard'],
  it: ['users', 'maintenance', 'activity-log', 'dashboard', 'settings'],
};

function getDepartmentKey(user: User): keyof typeof navigationByDepartment | 'all' {
  const role = user.role.trim().toLowerCase();
  const department = user.department.trim().toLowerCase();

  if (role === 'administrator' || role === 'management') return 'all';
  if (role === 'it administrator' || department === 'it') return 'it';
  if (role.includes('cashier') || department.includes('cashier')) return 'cashier';
  if (role === 'account officer' || role === 'accountant' || department === 'accounts' || department === 'finance') return 'finance';
  if (role === 'hr manager' || role === 'human resources' || department === 'human resources' || department === 'hr') return 'hr';
  if (role === 'eye clinic' || department === 'eye clinic') return 'eye';
  if (role === 'laboratory scientist' || role === 'lab technician' || role === 'scientist' || department === 'laboratory') return 'laboratory';
  if (role === 'pharmacist' || department === 'pharmacy') return 'pharmacy';
  if (role === 'nurse' || department === 'nursing') return 'nurse';
  if (role === 'doctor') return 'doctor';
  if (role === 'receptionist' || role === 'records officer' || role === 'opd clerk' || department === 'opd') return 'opd';

  return 'opd';
}

export function getAllowedNavigationIds(user: User): ReadonlySet<string> {
  const key = getDepartmentKey(user);
  return new Set(key === 'all' ? ALL_NAVIGATION_IDS : navigationByDepartment[key]);
}

export function isNavigationAllowed(user: User, navigationId: string): boolean {
  const aliases: Record<string, string> = {
    'patients-reception': 'patients',
    'patients-returning': 'patients',
    'patients-admissions': 'patients',
    triage: 'nursing',
    'cashier-billing': 'cashier',
    'cashier-lab-payments': 'cashier',
    'cashier-walkin-verify': 'cashier',
    'iclinic-registrations': 'cashier-iclinic-registrations',
    'cashier-vitae': 'cashier-pv',
    'pharmacy-procurement': 'procurement',
    dispensing: 'pharmacy',
    admitted: 'pharmacy',
    stock: 'pharmacy-stock',
  };

  return getAllowedNavigationIds(user).has(aliases[navigationId] || navigationId);
}