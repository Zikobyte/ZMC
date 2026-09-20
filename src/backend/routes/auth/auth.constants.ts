export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  INVALID_CREDENTIALS: 'Invalid username or password',
  USER_INACTIVE: 'Your account is inactive. Please contact the administrator.',
  TOKEN_EXPIRED: 'Session expired, please login again',
  UNAUTHORIZED: 'Unauthorized access. Authentication token is missing or invalid.',
  FORBIDDEN: 'Access denied. You do not have permission for this department or action.',
};

export const ROLES = {
  ADMINISTRATOR: 'Administrator',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  PHARMACIST: 'Pharmacist',
  LABORATORY_SCIENTIST: 'Laboratory Scientist',
  CASHIER: 'Cashier',
  RECEPTIONIST: 'Receptionist',
  RECORDS_OFFICER: 'Records Officer',
  ACCOUNTANT: 'Accountant',
  MANAGEMENT: 'Management',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export const JWT_EXPIRY = '7d';
