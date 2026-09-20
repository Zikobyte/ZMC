export type UserRole =
  | 'Administrator'
  | 'IT Administrator'
  | 'OPD Clerk'
  | 'Doctor'
  | 'Nurse'
  | 'Pharmacist'
  | 'Laboratory Scientist'
  | 'Lab Technician'
  | 'Cashier'
  | 'Receptionist'
  | 'Records Officer'
  | 'Account Officer'
  | 'Accountant'
  | 'HR Manager'
  | 'Eye Clinic'
  | 'Management'
  | string;

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  department: string;
  email?: string;
  status: 'Active' | 'Inactive';
  last_login?: string | null;
  created_at?: string;
  created_by?: string;
}

export interface Vitals {
  bloodPressure: string;
  temperature: number; // °C
  pulseRate: number; // bpm
  respiratoryRate?: number; // cpm
  spo2?: number; // %
  weight: number; // kg
  height?: number; // cm
}

export interface MaternityDetails {
  gravida: string;
  para: string;
  lmp: string;
  edd: string;
  gestationalAge: string;
  tribe?: string;
  occupation?: string;
}

export interface EmergencyDetails {
  isSickEmergency?: boolean;
  isUnbookedLabour?: boolean;
  isAccident?: boolean;
  isDoctorOnCall?: boolean;
  isAfterHours?: boolean;
  customDetails?: string;
}

export interface Patient {
  id: string;
  hospitalNumber: string;
  name: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  phoneNumber: string;
  address: string;
  maritalStatus: string;
  cardType: 'Standard' | 'Maternity' | 'Emergency';
  cardFee: number;
  status: string;
  registeredBy: string;
  registrationDate: string;
  idType?: string | null;
  idNumber?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinRelationship?: string | null;
  patientCanProvideDetails?: boolean;
  broughtInByName?: string | null;
  broughtInByPhone?: string | null;
  broughtInByRelationship?: string | null;
  broughtInByIdType?: string | null;
  broughtInByIdNumber?: string | null;
  vitals?: Vitals | null;
  maternityDetails?: MaternityDetails | null;
  emergencyDetails?: EmergencyDetails | null;
  balance?: number;
  patientCategory?: string;
  recordedPaymentsHistory?: any[];
}

export interface NotificationMsg {
  id: string;
  type: string;
  targetRole?: string;
  message: string;
  patientId?: string;
  sender?: string;
  timestamp: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email?: string;
  phone?: string;
  shift: 'Day' | 'Night' | 'Rotational' | string;
  status: 'Active' | 'On Leave' | 'Suspended' | 'Inactive' | string;
  salary?: number;
  hire_date?: string;
  date_joined?: string;
  documents_count?: number;
  created_at?: string;
}

export interface Absence {
  id: string;
  employee_id: string;
  employee_name: string;
  department?: string;
  leave_type?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  days_count?: number;
  reason?: string;
  status: 'Sick Leave' | 'Personal Leave' | 'Unauthorized' | 'Vacation' | 'Pending' | 'Approved' | 'Rejected' | string;
  applied_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  comments?: string;
}

export interface JobOpening {
  id: string;
  title: string;
  department: string;
  openings_count: number;
  employment_type: string;
  status: 'Open' | 'Closed' | 'Filled' | 'Draft';
  experience_required?: string;
  description?: string;
  posted_date: string;
}

export interface Candidate {
  id: string;
  job_id?: string;
  job_title?: string;
  candidate_name: string;
  email?: string;
  phone?: string;
  role_applied?: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offered' | 'Hired' | 'Rejected';
  experience_years: number;
  applied_date: string;
  notes?: string;
  rating?: number;
}

export interface Procurement {
  id: string;
  item_name: string;
  items?: string;
  quantity?: number;
  unit_price?: number;
  amount: number;
  department?: string;
  supplier_name?: string;
  requested_by?: string;
  status: 'Pending' | 'Approved' | 'Ordered' | 'Delivered' | 'Cancelled' | string;
  date_ordered?: string;
  date: string;
  category?: string;
}

export interface DiscountPolicy {
  id: string;
  title: string;
  discount_code?: string;
  category: string;
  percentage?: number;
  fixed_amount?: number;
  applicable_service?: string;
  authorized_by?: string;
  status: 'Active' | 'Suspended' | 'Expired';
  description?: string;
  created_at?: string;
}

export interface HRDashboardStats {
  totalEmployees: number;
  openPositions: number;
  totalCandidates: number;
  totalProcurements: number;
  roleDistribution: {
    doctors: number;
    nurses: number;
    pharmacists: number;
    security: number;
    dayWorkers: number;
    nightWorkers: number;
  };
  recentProcurements: Procurement[];
}
