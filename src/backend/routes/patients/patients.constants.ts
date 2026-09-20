export const CARD_FEES = {
  STANDARD: 3000,
  MATERNITY: 5000,
  EMERGENCY: 0, // Emergency card fee is purely computed from components
} as const;

export const EMERGENCY_FEE_SCHEDULE = {
  SICK_EMERGENCY: 25000,
  UNBOOKED_LABOUR: 50000,
  ACCIDENT: 50000,
  DOCTOR_ON_CALL: 5000,
} as const;

export const PATIENT_STATUS = {
  TRIAGE_PENDING: 'Triage Pending',
  BILLING_PENDING: 'Billing Pending',
  WAITING_DOCTOR: 'Waiting for Doctor',
  IN_CONSULTATION: 'In Consultation',
  LAB_PENDING: 'Lab Pending',
  PHARMACY_PENDING: 'Pharmacy Pending',
  ADMITTED: 'Admitted',
  DISCHARGED: 'Discharged',
} as const;

export const PATIENT_MESSAGES = {
  CREATE_SUCCESS: 'Patient registered successfully',
  UPDATE_SUCCESS: 'Patient records updated successfully',
  NOT_FOUND: 'Patient not found',
  VITALS_ADDED: 'Vitals recorded successfully',
  MATERNITY_ADDED: 'Maternity details registered successfully',
};
