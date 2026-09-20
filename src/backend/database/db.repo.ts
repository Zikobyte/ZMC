import bcrypt from 'bcrypt';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export interface Database {
  users: any[];
  patients: any[];
  departments: any[];
  roles: string[];
  permissions: any[];
  appointments: any[];
  consultations: any[];
  laboratoryOrders: any[];
  laboratoryResults: any[];
  pharmacyOrders: any[];
  payments: any[];
  invoices: any[];
  wards: any[];
  beds: any[];
  admissions: any[];
  discharges: any[];
  employees: any[];
  attendance: any[];
  inventory: any[];
  suppliers: any[];
  procurements: any[];
  absences: any[];
  jobOpenings: any[];
  candidates: any[];
  discounts: any[];
  notifications: any[];
  auditLogs: any[];
}

export function createInitialDatabase(): Database {
  return {
    users: [
      { id: "user-it-admin-1", username: "admin", password: "admin123", name: "IT Administrator", role: "IT Administrator", department: "IT", email: "admin@zmc.com", status: "Active", created_at: "2026-02-19 08:00:00", created_by: "system" },
      { id: "user-opd-clerk-2", username: "opd.clerk", password: "opd123", name: "OPD Clerk", role: "OPD Clerk", department: "OPD", email: "opd.clerk@zmc.com", status: "Active", created_at: "2026-04-20 08:00:00", created_by: "admin" },
      { id: "user-cashier-3", username: "cashier1", password: "cash123", name: "Cashier Officer", role: "Cashier", department: "Finance", email: "cashier1@zmc.com", status: "Active", created_at: "2026-04-20 08:00:00", created_by: "admin" },
      { id: "user-doctor-smith-4", username: "dr.smith", password: "doc123", name: "Dr. John Smith", role: "Doctor", department: "Medical", email: "dr.smith@zmc.com", status: "Active", created_at: "2026-05-20 08:00:00", created_by: "admin" },
      { id: "user-lab-tech-5", username: "lab.tech", password: "lab123", name: "Lab Technician", role: "Lab Technician", department: "Laboratory", email: "lab.tech@zmc.com", status: "Active", created_at: "2026-05-20 08:00:00", created_by: "admin" },
      { id: "user-pharmacist-6", username: "pharmacist1", password: "pharm123", name: "Pharmacist", role: "Pharmacist", department: "Pharmacy", email: "pharmacist1@zmc.com", status: "Active", created_at: "2026-05-20 08:00:00", created_by: "admin" },
      { id: "user-head-nurse-7", username: "nurse1", password: "nurse123", name: "Head Nurse", role: "Nurse", department: "Nursing", email: "nurse1@zmc.com", status: "Active", created_at: "2026-05-20 08:00:00", created_by: "admin" },
      { id: "user-accounts-8", username: "accounts", password: "acc123", name: "Account Officer", role: "Account Officer", department: "Finance", email: "accounts@zmc.com", status: "Active", created_at: "2026-05-20 08:00:00", created_by: "admin" },
      { id: "user-hr-manager-9", username: "hr.manager", password: "hr123", name: "HR Manager", role: "HR Manager", department: "Human Resources", email: "hr.manager@zmc.com", status: "Active", created_at: "2026-05-20 08:00:00", created_by: "admin" },
      { id: "user-eye-clinic-10", username: "eye.clinic", password: "eye123", name: "Eye Clinic Specialist", role: "Eye Clinic", department: "Eye Clinic", email: "eye.clinic@zmc.com", status: "Active", created_at: "2026-05-20 08:00:00", created_by: "admin" },
      { id: "compat-user-accountant", username: "accountant", password: "accountant123", name: "Account Officer", role: "Account Officer", department: "Finance", email: "accountant@zmc.com", status: "Active" },
      { id: "compat-user-dr-smith-legacy", username: "dr_smith", password: "password", name: "Dr. Alan Smith", role: "Doctor", department: "Medical", email: "dr_smith@zmc.com", status: "Active" },
      { id: "compat-user-nurse-jane", username: "nurse_jane", password: "password", name: "Nurse Jane Doe", role: "Nurse", department: "Nursing", email: "jane@zmc.com", status: "Active" },
      { id: "compat-user-lab-tech", username: "lab_tech", password: "password", name: "John Doe (Lab Tech)", role: "Lab Technician", department: "Laboratory", email: "lab@zmc.com", status: "Active" },
      { id: "compat-user-pharmacist", username: "pharmacist", password: "password", name: "Mary Green (Pharmacist)", role: "Pharmacist", department: "Pharmacy", email: "pharm@zmc.com", status: "Active" },
      { id: "compat-user-opd-reg", username: "opd_registrar", password: "password", name: "Grace Okafor (OPD Registrar)", role: "OPD Clerk", department: "OPD", email: "opd@zmc.com", status: "Active" },
      { id: "compat-user-iclinic", username: "iclinic", password: "password", name: "Dr. Clara Vance (Eye Clinic)", role: "Eye Clinic", department: "Eye Clinic", email: "iclinic@zmc.com", status: "Active" }
    ],
    patients: [],
    departments: [
      { id: "dept-1", name: "OPD", description: "Out-Patient Department & Reception" },
      { id: "dept-2", name: "Nursing", description: "Inpatient and Triage Nursing Care" },
      { id: "dept-3", name: "Medical", description: "General & Specialist Consultations" },
      { id: "dept-4", name: "Laboratory", description: "Diagnostic Pathology & Specimen Analysis" },
      { id: "dept-5", name: "Pharmacy", description: "Medication Dispensation & Inventory" },
      { id: "dept-6", name: "Finance", description: "Billing, Cashier & Accounts" },
      { id: "dept-7", name: "Human Resources", description: "Staff Management & Personnel" },
      { id: "dept-8", name: "IT", description: "System Administration & Infrastructure" },
      { id: "dept-9", name: "Eye Clinic", description: "Ophthalmology Clinic & Diagnostics" }
    ],
    roles: ["Administrator", "IT Administrator", "Management", "Doctor", "Nurse", "Pharmacist", "Laboratory Scientist", "Lab Technician", "Cashier", "Receptionist", "Records Officer", "OPD Clerk", "Accountant", "Account Officer", "HR Manager", "Eye Clinic"],
    permissions: [],
    appointments: [],
    consultations: [],
    laboratoryOrders: [],
    laboratoryResults: [],
    pharmacyOrders: [],
    payments: [],
    invoices: [],
    wards: [],
    beds: [],
    admissions: [],
    discharges: [],
    employees: [
      { id: "emp-001", name: "Dr. John Smith", role: "Doctor", department: "Medical", email: "dr.smith@zmc.com", phone: "+234 803 111 2222", shift: "Day", status: "Active", salary: 750000, hire_date: "2024-01-15", date_joined: "2024-01-15", documents_count: 3 },
      { id: "emp-002", name: "Dr. Alan Smith", role: "Doctor", department: "Medical", email: "dr_smith@zmc.com", phone: "+234 803 222 3333", shift: "Day", status: "Active", salary: 720000, hire_date: "2024-03-10", date_joined: "2024-03-10", documents_count: 2 },
      { id: "emp-003", name: "Dr. Clara Vance", role: "Doctor", department: "Eye Clinic", email: "iclinic@zmc.com", phone: "+234 803 333 4444", shift: "Day", status: "Active", salary: 800000, hire_date: "2023-11-01", date_joined: "2023-11-01", documents_count: 4 },
      { id: "emp-004", name: "Dr. Emeka Obi", role: "Doctor", department: "Emergency", email: "dr.obi@zmc.com", phone: "+234 803 444 5555", shift: "Night", status: "Active", salary: 780000, hire_date: "2024-06-01", date_joined: "2024-06-01", documents_count: 2 },
      { id: "emp-005", name: "Dr. Zainab Ahmed", role: "Doctor", department: "Obstetrics", email: "dr.ahmed@zmc.com", phone: "+234 803 555 6666", shift: "Day", status: "Active", salary: 760000, hire_date: "2025-01-10", date_joined: "2025-01-10", documents_count: 1 },
      { id: "emp-006", name: "Head Nurse Mary Green", role: "Nurse", department: "Nursing", email: "nurse1@zmc.com", phone: "+234 802 111 7777", shift: "Day", status: "Active", salary: 380000, hire_date: "2023-08-15", date_joined: "2023-08-15", documents_count: 3 },
      { id: "emp-007", name: "Nurse Jane Doe", role: "Nurse", department: "Nursing", email: "jane@zmc.com", phone: "+234 802 222 8888", shift: "Day", status: "Active", salary: 320000, hire_date: "2024-02-20", date_joined: "2024-02-20", documents_count: 2 },
      { id: "emp-008", name: "Nurse Ngozi Okafor", role: "Nurse", department: "Pediatrics", email: "ngozi.nurse@zmc.com", phone: "+234 802 333 9999", shift: "Day", status: "Active", salary: 310000, hire_date: "2024-05-12", date_joined: "2024-05-12", documents_count: 1 },
      { id: "emp-009", name: "Nurse Patricia Mensah", role: "Nurse", department: "Emergency", email: "patricia.nurse@zmc.com", phone: "+234 802 444 1122", shift: "Night", status: "Active", salary: 340000, hire_date: "2024-07-01", date_joined: "2024-07-01", documents_count: 2 },
      { id: "emp-010", name: "Nurse Emmanuel Eze", role: "Nurse", department: "ICU", email: "emmanuel.nurse@zmc.com", phone: "+234 802 555 2233", shift: "Night", status: "Active", salary: 350000, hire_date: "2024-09-15", date_joined: "2024-09-15", documents_count: 0 },
      { id: "emp-011", name: "Pharmacist David Adeleke", role: "Pharmacist", department: "Pharmacy", email: "pharmacist1@zmc.com", phone: "+234 806 111 3344", shift: "Day", status: "Active", salary: 420000, hire_date: "2023-10-01", date_joined: "2023-10-01", documents_count: 3 },
      { id: "emp-012", name: "Pharmacist Mary Green", role: "Pharmacist", department: "Pharmacy", email: "pharm@zmc.com", phone: "+234 806 222 4455", shift: "Day", status: "Active", salary: 400000, hire_date: "2024-04-10", date_joined: "2024-04-10", documents_count: 2 },
      { id: "emp-013", name: "Pharmacist Chinedu Aliyu", role: "Pharmacist", department: "Pharmacy", email: "chinedu.pharm@zmc.com", phone: "+234 806 333 5566", shift: "Night", status: "Active", salary: 440000, hire_date: "2025-02-01", date_joined: "2025-02-01", documents_count: 1 },
      { id: "emp-014", name: "Officer Samuel Adewale", role: "Security", department: "Security", email: "samuel.sec@zmc.com", phone: "+234 809 111 6677", shift: "Day", status: "Active", salary: 180000, hire_date: "2023-05-01", date_joined: "2023-05-01", documents_count: 2 },
      { id: "emp-015", name: "Officer Ibrahim Musa", role: "Security", department: "Security", email: "ibrahim.sec@zmc.com", phone: "+234 809 222 7788", shift: "Night", status: "Active", salary: 200000, hire_date: "2023-06-15", date_joined: "2023-06-15", documents_count: 1 },
      { id: "emp-016", name: "Officer Kingsley Okon", role: "Security", department: "Security", email: "kingsley.sec@zmc.com", phone: "+234 809 333 8899", shift: "Day", status: "Active", salary: 180000, hire_date: "2024-01-20", date_joined: "2024-01-20", documents_count: 1 },
      { id: "emp-017", name: "Guard Peter Bassey", role: "Security", department: "Security", email: "peter.guard@zmc.com", phone: "+234 809 444 9900", shift: "Night", status: "Active", salary: 200000, hire_date: "2024-08-01", date_joined: "2024-08-01", documents_count: 0 },
      { id: "emp-018", name: "Grace Okafor (OPD Registrar)", role: "Day Worker", department: "OPD", email: "opd@zmc.com", phone: "+234 805 111 0011", shift: "Day", status: "Active", salary: 220000, hire_date: "2024-03-01", date_joined: "2024-03-01", documents_count: 2 },
      { id: "emp-019", name: "Chioma Nnadi (Ward Assistant)", role: "Day Worker", department: "Nursing", email: "chioma.ward@zmc.com", phone: "+234 805 222 0022", shift: "Day", status: "Active", salary: 160000, hire_date: "2024-04-15", date_joined: "2024-04-15", documents_count: 1 },
      { id: "emp-020", name: "Tolu Oladipo (Facility Porter)", role: "Day Worker", department: "Facilities", email: "tolu.porter@zmc.com", phone: "+234 805 333 0033", shift: "Day", status: "Active", salary: 150000, hire_date: "2024-05-10", date_joined: "2024-05-10", documents_count: 0 },
      { id: "emp-021", name: "Amaka Eze (Sanitation Lead)", role: "Day Worker", department: "Housekeeping", email: "amaka.clean@zmc.com", phone: "+234 805 444 0044", shift: "Day", status: "Active", salary: 150000, hire_date: "2024-06-01", date_joined: "2024-06-01", documents_count: 1 },
      { id: "emp-022", name: "Yusuf Haruna (Night Patrol)", role: "Night Worker", department: "Security", email: "yusuf.night@zmc.com", phone: "+234 807 111 0055", shift: "Night", status: "Active", salary: 210000, hire_date: "2024-02-15", date_joined: "2024-02-15", documents_count: 1 },
      { id: "emp-023", name: "Usman Danladi (Night Lab Assistant)", role: "Night Worker", department: "Laboratory", email: "usman.lab@zmc.com", phone: "+234 807 222 0066", shift: "Night", status: "Active", salary: 230000, hire_date: "2024-07-20", date_joined: "2024-07-20", documents_count: 2 },
      { id: "emp-024", name: "Binta Bello (Night Ward Orderly)", role: "Night Worker", department: "Nursing", email: "binta.ward@zmc.com", phone: "+234 807 333 0077", shift: "Night", status: "Active", salary: 170000, hire_date: "2024-08-10", date_joined: "2024-08-10", documents_count: 0 },
      { id: "emp-025", name: "John Doe (Lab Tech)", role: "Lab Technician", department: "Laboratory", email: "lab@zmc.com", phone: "+234 808 111 0088", shift: "Day", status: "Active", salary: 350000, hire_date: "2023-12-01", date_joined: "2023-12-01", documents_count: 2 },
      { id: "emp-026", name: "Cashier Officer Beatrice", role: "Cashier", department: "Finance", email: "cashier1@zmc.com", phone: "+234 808 222 0099", shift: "Day", status: "Active", salary: 250000, hire_date: "2024-04-20", date_joined: "2024-04-20", documents_count: 1 },
      { id: "emp-027", name: "HR Manager", role: "HR Manager", department: "Human Resources", email: "hr.manager@zmc.com", phone: "+234 808 333 0100", shift: "Day", status: "Active", salary: 600000, hire_date: "2023-01-10", date_joined: "2023-01-10", documents_count: 5 },
      { id: "emp-028", name: "Nurse Faith Okafor", role: "Nurse", department: "Nursing", email: "faith.nurse@zmc.com", phone: "+234 802 333 4455", shift: "Day", status: "Active", salary: 340000, hire_date: "2024-05-10", date_joined: "2024-05-10", documents_count: 2 },
      { id: "emp-029", name: "Obi Kelechi", role: "Day Worker", department: "Administration", email: "obi.kelechi@zmc.com", phone: "+234 803 777 8899", shift: "Day", status: "Active", salary: 200000, hire_date: "2024-02-15", date_joined: "2024-02-15", documents_count: 1 },
      { id: "emp-030", name: "Emeka Udoh", role: "Security", department: "Security", email: "emeka.udoh@zmc.com", phone: "+234 809 555 6677", shift: "Day", status: "Active", salary: 180000, hire_date: "2024-03-20", date_joined: "2024-03-20", documents_count: 1 },
      { id: "emp-031", name: "Chiamaka Okoro", role: "Pharmacist", department: "Pharmacy", email: "chiamaka.okoro@zmc.com", phone: "+234 806 888 9900", shift: "Day", status: "Active", salary: 410000, hire_date: "2023-11-01", date_joined: "2023-11-01", documents_count: 3 },
      { id: "emp-032", name: "Lab Tech James Ibe", role: "Day Worker", department: "Laboratory", email: "james.ibe@zmc.com", phone: "+234 808 444 3322", shift: "Day", status: "Active", salary: 260000, hire_date: "2023-09-12", date_joined: "2023-09-12", documents_count: 2 },
      { id: "emp-033", name: "Dr. Amara Obi", role: "Doctor", department: "Medical", email: "dr.amara@zmc.com", phone: "+234 803 666 5544", shift: "Day", status: "Active", salary: 780000, hire_date: "2023-07-01", date_joined: "2023-07-01", documents_count: 4 },
      { id: "emp-034", name: "Taiwo Adesanya", role: "Night Worker", department: "Emergency", email: "taiwo.adesanya@zmc.com", phone: "+234 807 999 1122", shift: "Night", status: "Active", salary: 220000, hire_date: "2024-06-10", date_joined: "2024-06-10", documents_count: 1 }
    ],
    attendance: [],
    inventory: [],
    suppliers: [
      { id: "sup-001", name: "MedEquip Solutions Ltd", contact_person: "Engr. Patrick", phone: "+234 802 999 1100", email: "sales@medequip.ng", address: "14 Medical Avenue, Ikeja, Lagos" },
      { id: "sup-002", name: "PharmaCare Direct Hub", contact_person: "Hajiya Bilkisu", phone: "+234 803 888 2200", email: "orders@pharmacare.ng", address: "8 Commercial Boulevard, Victoria Island, Lagos" },
      { id: "sup-003", name: "Sanitas Healthcare Supplies", contact_person: "David Okoye", phone: "+234 806 777 3300", email: "contact@sanitas.ng", address: "22 Industrial Estate, Port Harcourt" }
    ],
    procurements: [
      { id: "proc-001", item_name: "Digital BP Monitors & Pulse Oximeters", items: "Digital BP Monitors (x10), Pulse Oximeters (x20)", quantity: 30, unit_price: 15000, amount: 450000, department: "Nursing & OPD", supplier_name: "MedEquip Solutions Ltd", requested_by: "Head Nurse Mary Green", status: "Delivered", date_ordered: "2026-08-15 10:00:00", date: "2026-08-15", category: "Diagnostic Equipment" },
      { id: "proc-002", item_name: "Sterile Surgical Gloves & N95 Masks", items: "Sterile Surgical Gloves (500 boxes), N95 Masks (200 boxes)", quantity: 700, unit_price: 457, amount: 320000, department: "Emergency & Maternity", supplier_name: "Sanitas Healthcare Supplies", requested_by: "HR / Procurement", status: "Delivered", date_ordered: "2026-08-12 14:30:00", date: "2026-08-12", category: "Consumables" },
      { id: "proc-003", item_name: "Amoxicillin & IV Infusion Fluids", items: "Amoxicillin 250mg (1000 packs), IV Normal Saline 500ml (500 bags)", quantity: 1500, unit_price: 566, amount: 850000, department: "Pharmacy", supplier_name: "PharmaCare Direct Hub", requested_by: "Pharmacist David Adeleke", status: "Ordered", date_ordered: "2026-08-10 09:15:00", date: "2026-08-10", category: "Pharmaceuticals" },
      { id: "proc-004", item_name: "Ultrasound Gel & ECG Thermal Paper", items: "Ultrasound Acoustic Gel (50 Gallons), ECG Thermal Paper Rolls (100)", quantity: 150, unit_price: 1200, amount: 180000, department: "Radiology & OPD", supplier_name: "MedEquip Solutions Ltd", requested_by: "Dr. Alan Smith", status: "Approved", date_ordered: "2026-08-05 11:00:00", date: "2026-08-05", category: "Medical Supplies" },
      { id: "proc-005", item_name: "Hospital Bed Linen & Patient Gowns", items: "Antimicrobial Bed Sheets (100 pcs), Patient Gowns (100 pcs)", quantity: 200, unit_price: 1300, amount: 260000, department: "Wards & Inpatient", supplier_name: "Sanitas Healthcare Supplies", requested_by: "HR Facilities", status: "Pending", date_ordered: "2026-08-02 16:45:00", date: "2026-08-02", category: "Facility & Linen" }
    ],
    absences: [
      { id: "abs-001", employee_id: "emp-028", employee_name: "Nurse Faith Okafor", department: "Nursing", leave_type: "Sick Leave", date: "2026-08-17", start_date: "2026-08-17", end_date: "2026-08-17", days_count: 1, reason: "Flu symptoms – mild fever", status: "Sick Leave", applied_at: "2026-08-17 08:30:00" },
      { id: "abs-002", employee_id: "emp-029", employee_name: "Obi Kelechi", department: "Administration", leave_type: "Personal Leave", date: "2026-08-16", start_date: "2026-08-16", end_date: "2026-08-16", days_count: 1, reason: "Family bereavement", status: "Personal Leave", applied_at: "2026-08-16 09:15:00" },
      { id: "abs-003", employee_id: "emp-030", employee_name: "Emeka Udoh", department: "Security", leave_type: "Unauthorized", date: "2026-08-15", start_date: "2026-08-15", end_date: "2026-08-15", days_count: 1, reason: "No show – not contactable", status: "Unauthorized", applied_at: "2026-08-15 10:00:00" },
      { id: "abs-004", employee_id: "emp-031", employee_name: "Chiamaka Okoro", department: "Pharmacy", leave_type: "Vacation", date: "2026-08-13", start_date: "2026-08-13", end_date: "2026-08-13", days_count: 1, reason: "Annual leave approved", status: "Vacation", applied_at: "2026-08-13 08:00:00" },
      { id: "abs-005", employee_id: "emp-032", employee_name: "Lab Tech James Ibe", department: "Laboratory", leave_type: "Personal Leave", date: "2026-08-11", start_date: "2026-08-11", end_date: "2026-08-11", days_count: 1, reason: "Medical appointment", status: "Personal Leave", applied_at: "2026-08-11 11:30:00" },
      { id: "abs-006", employee_id: "emp-033", employee_name: "Dr. Amara Obi", department: "Medical", leave_type: "Vacation", date: "2026-08-08", start_date: "2026-08-08", end_date: "2026-08-08", days_count: 1, reason: "Attending CME conference in Lagos", status: "Vacation", applied_at: "2026-08-08 07:45:00" },
      { id: "abs-007", employee_id: "emp-034", employee_name: "Taiwo Adesanya", department: "Emergency", leave_type: "Sick Leave", date: "2026-08-14", start_date: "2026-08-14", end_date: "2026-08-14", days_count: 1, reason: "Sick – certified by GP", status: "Sick Leave", applied_at: "2026-08-14 08:10:00" }
    ],
    jobOpenings: [
      { id: "job-001", title: "Senior Resident Doctor (General / Internal Medicine)", department: "Medical", openings_count: 2, employment_type: "Full-time", status: "Open", experience_required: "5+ years post-residency", description: "Lead daily rounds, inpatient consultations, and emergency triage oversight.", posted_date: "2026-08-01" },
      { id: "job-002", title: "Critical Care / ICU Nurse", department: "Nursing", openings_count: 3, employment_type: "Shift / Night", status: "Open", experience_required: "3+ years ICU/ER experience", description: "Deliver 24/7 high-dependency nursing care and intensive hemodynamic monitoring.", posted_date: "2026-08-05" },
      { id: "job-003", title: "Registered Hospital Pharmacist", department: "Pharmacy", openings_count: 1, employment_type: "Full-time", status: "Open", experience_required: "2+ years hospital dispensing", description: "Manage medication compounding, inventory reconciliation, and clinical consultations.", posted_date: "2026-08-08" },
      { id: "job-004", title: "Night Security Patrol Officer", department: "Security", openings_count: 2, employment_type: "Shift / Night", status: "Open", experience_required: "2+ years security enforcement", description: "Ensure safety, perimeter control, and visitor credential logging during night shifts.", posted_date: "2026-08-10" },
      { id: "job-005", title: "Laboratory Scientist (Microbiology & Hematology)", department: "Laboratory", openings_count: 1, employment_type: "Full-time", status: "Open", experience_required: "3+ years clinical pathology", description: "Execute automated hematology, culture screening, and rapid biochemistry assays.", posted_date: "2026-08-12" }
    ],
    candidates: [
      { id: "cand-001", job_id: "job-001", job_title: "Senior Resident Doctor", candidate_name: "Dr. Kelechi Nwosu", email: "dr.kelechi@email.com", phone: "+234 803 777 4411", role_applied: "Doctor", stage: "Interview", experience_years: 6, applied_date: "2026-08-04", notes: "Impressive background at National Hospital; scheduled for panel interview.", rating: 5 },
      { id: "cand-002", job_id: "job-002", job_title: "Critical Care / ICU Nurse", candidate_name: "Nurse Blessing Adebayo", email: "blessing.nurse@email.com", phone: "+234 802 888 5522", role_applied: "Nurse", stage: "Offered", experience_years: 4, applied_date: "2026-08-07", notes: "Passed practical skills evaluation with distinction; offer letter issued.", rating: 5 },
      { id: "cand-003", job_id: "job-003", job_title: "Registered Hospital Pharmacist", candidate_name: "Pharm. Tunde Bakare", email: "tunde.bakare@email.com", phone: "+234 806 999 6633", role_applied: "Pharmacist", stage: "Screening", experience_years: 3, applied_date: "2026-08-11", notes: "Valid PCN license verified; reviewing background checks.", rating: 4 },
      { id: "cand-004", job_id: "job-004", job_title: "Night Security Patrol Officer", candidate_name: "Yakubu Danjuma", email: "yakubu.d@email.com", phone: "+234 809 111 7744", role_applied: "Security", stage: "Interview", experience_years: 5, applied_date: "2026-08-13", notes: "Former paramilitary experience; excellent physical fitness.", rating: 4 },
      { id: "cand-005", job_id: "job-005", job_title: "Laboratory Scientist", candidate_name: "Florence Uche", email: "florence.uche@email.com", phone: "+234 808 222 8855", role_applied: "Laboratory Scientist", stage: "Applied", experience_years: 2, applied_date: "2026-08-16", notes: "Recent MLSCN registration; portfolio under review.", rating: 3 }
    ],
    discounts: [
      { id: "disc-001", title: "Hospital Staff Medical Welfare Benefit", discount_code: "STAFF50", category: "Staff Benefit", percentage: 50, fixed_amount: 0, applicable_service: "All Consultations, Routine Diagnostics & In-House Pharmacy", authorized_by: "HR Management", status: "Active", description: "Subsidized healthcare for full-time hospital employees and direct dependants." },
      { id: "disc-002", title: "Immediate Dependant / Family Care Scheme", discount_code: "FAMILY30", category: "Family & Dependent", percentage: 30, fixed_amount: 0, applicable_service: "Ward Admissions & Specialized Surgeries", authorized_by: "HR Management & Medical Director", status: "Active", description: "Tiered discount for registered spouses and children of confirmed staff." },
      { id: "disc-003", title: "Senior Citizen Compassionate Subsidy", discount_code: "SENIOR20", category: "Compassionate", percentage: 20, fixed_amount: 0, applicable_service: "General OPD Visits & Chronic Disease Management", authorized_by: "Medical Director", status: "Active", description: "Community geriatric support program for patients aged 65 and above." },
      { id: "disc-004", title: "Hospital Staff Optical Care Concession", discount_code: "EYE40", category: "Staff Benefit", percentage: 40, fixed_amount: 0, applicable_service: "Eye Clinic Comprehensive Diagnostics & Refraction", authorized_by: "Eye Clinic Lead & HR", status: "Active", description: "Discount on routine optical tests and frames for hospital staff." },
      { id: "disc-005", title: "Corporate Partner Health Coverage", discount_code: "CORP15", category: "Corporate Partner", percentage: 15, fixed_amount: 0, applicable_service: "Executive Health Checkups & Routine Care", authorized_by: "Finance & HR", status: "Active", description: "Special corporate rate for contracted corporate employees." }
    ],
    notifications: [],
    auditLogs: []
  };
}

let dbCache: Database = createInitialDatabase();
let pool: pg.Pool | null = null;
let isPostgresActive = false;

export function generateUUID(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}

export function getPostgresStatus(): { isPostgresActive: boolean; hasPool: boolean } {
  return { isPostgresActive, hasPool: pool !== null };
}

export function getPostgresPool(): pg.Pool | null {
  return pool;
}

export async function query(text: string, params?: any[]): Promise<any> {
  if (!pool) {
    throw new Error('PostgreSQL pool has not been initialized.');
  }
  return pool.query(text, params);
}

export function getDB(): Database {
  if (!dbCache) {
    dbCache = createInitialDatabase();
  }
  return dbCache;
}

export function writeDB(db: Database): void {
  dbCache = db;
}

export async function refreshCache(): Promise<void> {
  if (!pool) return;
  try {
    // Repair/ensure queue items routed to doctor clinics are set to 'Doctor Consultation'
    await pool.query(`
      UPDATE zmc_patient_queue 
      SET queue_type = 'Doctor Consultation' 
      WHERE queue_type = 'Nursing Front-Desk' AND status = 'Waiting' 
      AND encounter_id IN (
        SELECT id FROM zmc_encounters 
        WHERE destination_clinic = 'General OPD Out-Patient Clinic' 
        OR destination_clinic LIKE '%Doctor%' 
        OR destination_clinic LIKE '%Out-Patient%' 
        OR destination_clinic LIKE '%Consultation%'
      )
    `);

    await pool.query(`
      UPDATE zmc_patients 
      SET status = 'Waiting for Doctor' 
      WHERE id IN (
        SELECT patient_id FROM zmc_patient_queue 
        WHERE queue_type = 'Doctor Consultation' AND status = 'Waiting'
      )
    `);

    const usersRes = await pool.query('SELECT * FROM zmc_users');
    const patientsRes = await pool.query('SELECT * FROM zmc_patients');
    const departmentsRes = await pool.query('SELECT * FROM zmc_departments');
    const rolesRes = await pool.query('SELECT * FROM zmc_roles');
    const permissionsRes = await pool.query('SELECT * FROM zmc_permissions');
    const appointmentsRes = await pool.query('SELECT * FROM zmc_appointments');
    const consultationsRes = await pool.query('SELECT * FROM zmc_consultations');
    const labOrdersRes = await pool.query('SELECT * FROM zmc_laboratory_orders');
    const labResultsRes = await pool.query('SELECT * FROM zmc_laboratory_results');
    const pharmacyOrdersRes = await pool.query('SELECT * FROM zmc_pharmacy_orders');
    const paymentsRes = await pool.query('SELECT * FROM zmc_payments');
    const invoicesRes = await pool.query('SELECT * FROM zmc_invoices');
    const wardsRes = await pool.query('SELECT * FROM zmc_wards');
    const bedsRes = await pool.query('SELECT * FROM zmc_beds');
    const admissionsRes = await pool.query('SELECT * FROM zmc_admissions');
    const dischargesRes = await pool.query('SELECT * FROM zmc_discharges');
    const employeesRes = await pool.query('SELECT * FROM zmc_employees ORDER BY name ASC');
    const absencesRes = await pool.query('SELECT * FROM zmc_absences ORDER BY applied_at DESC');
    const jobOpeningsRes = await pool.query('SELECT * FROM zmc_job_openings ORDER BY posted_date DESC');
    const candidatesRes = await pool.query('SELECT * FROM zmc_candidates ORDER BY applied_date DESC');
    const procurementsRes = await pool.query('SELECT * FROM zmc_procurements ORDER BY date_ordered DESC, date DESC');
    const discountsRes = await pool.query('SELECT * FROM zmc_discounts ORDER BY created_at DESC');
    const attendanceRes = await pool.query('SELECT * FROM zmc_attendance');
    const inventoryRes = await pool.query('SELECT * FROM zmc_inventory');
    const suppliersRes = await pool.query('SELECT * FROM zmc_suppliers');
    const notificationsRes = await pool.query('SELECT * FROM zmc_notifications');
    const auditLogsRes = await pool.query('SELECT * FROM zmc_audit_logs');

    // Fetch vitals relationally (latest for each patient)
    const vitalsRes = await pool.query('SELECT DISTINCT ON (patient_id) * FROM zmc_patient_vitals ORDER BY patient_id, recorded_at DESC');
    const vitalsMap = new Map();
    vitalsRes.rows.forEach(r => {
      vitalsMap.set(r.patient_id, {
        bloodPressure: r.blood_pressure,
        temperature: r.temperature !== null ? parseFloat(r.temperature) : null,
        pulseRate: r.pulse_rate,
        respiratoryRate: r.respiratory_rate,
        spo2: r.spo2,
        weight: r.weight !== null ? parseFloat(r.weight) : null,
        height: r.height !== null ? parseFloat(r.height) : null
      });
    });

    // Fetch maternity records relationally
    const maternityRes = await pool.query('SELECT DISTINCT ON (patient_id) * FROM zmc_maternity_records ORDER BY patient_id, recorded_at DESC');
    const maternityMap = new Map();
    maternityRes.rows.forEach(r => {
      maternityMap.set(r.patient_id, {
        gravida: r.gravida,
        para: r.para,
        lmp: r.lmp ? new Date(r.lmp).toISOString().split('T')[0] : '',
        edd: r.edd ? new Date(r.edd).toISOString().split('T')[0] : '',
        gestationalAge: r.gestational_age,
        tribe: r.tribe,
        occupation: r.occupation,
        abortion: r.abortion || '0',
        premature: r.premature || '0'
      });
    });

    // Fetch emergency records relationally
    const emergencyRes = await pool.query('SELECT DISTINCT ON (patient_id) * FROM zmc_emergency_records ORDER BY patient_id, recorded_at DESC');
    const emergencyMap = new Map();
    emergencyRes.rows.forEach(r => {
      emergencyMap.set(r.patient_id, {
        isSickEmergency: r.is_sick_emergency,
        isUnbookedLabour: r.is_unbooked_labour,
        isAccident: r.is_accident,
        isDoctorOnCall: r.is_doctor_on_call,
        isAfterHours: r.is_after_hours,
        customDetails: r.custom_details,
        totalBillAmount: r.total_bill_amount ? parseFloat(r.total_bill_amount) : null,
        cashCollected: r.cash_collected ? parseFloat(r.cash_collected) : null,
        doctorOnCallName: r.doctor_on_call_name || ''
      });
    });

    dbCache = {
      users: usersRes.rows.map(row => ({
        id: row.id,
        username: row.username,
        password: row.password,
        name: row.name,
        role: row.role,
        department: row.department || '',
        email: row.email || '',
        status: row.status || 'Active'
      })),
      patients: patientsRes.rows.map(row => ({
        id: row.id,
        hospitalNumber: row.hospital_number,
        maternityNumber: row.maternity_number || null,
        name: row.name,
        dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth).toISOString().split('T')[0] : '',
        gender: row.gender,
        phoneNumber: row.phone_number || '',
        email: row.email || '',
        address: row.address || '',
        maritalStatus: row.marital_status || '',
        cardType: row.card_type || 'Standard',
        cardFee: row.card_fee || 0,
        status: row.status || 'Triage Pending',
        registeredBy: row.registered_by || '',
        registrationDate: row.registration_date ? new Date(row.registration_date).toISOString() : new Date().toISOString(),
        vitals: vitalsMap.get(row.id) || null,
        maternityDetails: maternityMap.get(row.id) || null,
        emergencyDetails: emergencyMap.get(row.id) || null
      })),
      departments: departmentsRes.rows,
      roles: rolesRes.rows.map(r => r.name),
      permissions: permissionsRes.rows,
      appointments: appointmentsRes.rows,
      consultations: consultationsRes.rows,
      laboratoryOrders: labOrdersRes.rows,
      laboratoryResults: labResultsRes.rows,
      pharmacyOrders: pharmacyOrdersRes.rows,
      payments: paymentsRes.rows,
      invoices: invoicesRes.rows,
      wards: wardsRes.rows,
      beds: bedsRes.rows,
      admissions: admissionsRes.rows,
      discharges: dischargesRes.rows,
      employees: employeesRes.rows,
      absences: absencesRes.rows,
      jobOpenings: jobOpeningsRes.rows,
      candidates: candidatesRes.rows,
      discounts: discountsRes.rows,
      attendance: attendanceRes.rows,
      inventory: inventoryRes.rows.map(row => ({
        id: row.id,
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        price: row.price
      })),
      suppliers: suppliersRes.rows,
      procurements: procurementsRes.rows,
      notifications: notificationsRes.rows,
      auditLogs: auditLogsRes.rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
        userId: row.user_id,
        userName: row.user_name,
        userRole: row.user_role,
        action: row.action,
        details: row.details,
        ipAddress: row.ip_address
      }))
    };
  } catch (err: any) {
    console.error('❌ Failed to refresh dbCache from PostgreSQL:', err.message);
  }
}

export async function initializeDatabase(): Promise<void> {
  const host = process.env.PGHOST || process.env.DB_HOST || '';
  const portStr = process.env.PGPORT || process.env.DB_PORT || '5432';
  const database = process.env.PGDATABASE || process.env.DB_NAME || process.env.DB_DATABASE || '';
  const user = process.env.PGUSER || process.env.DB_USER || process.env.DB_USERNAME || '';
  const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || '';

  if (host && user && database) {
    console.log(`🏥 PostgreSQL config detected. Connecting to ${user}@${host}:${portStr}/${database}...`);
    try {
      pool = new Pool({
        host,
        port: parseInt(portStr, 10),
        database,
        user,
        password,
        ssl: host === 'localhost' || host === '127.0.0.1' ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      await pool.query('SELECT 1');
      isPostgresActive = true;
      console.log('✅ Connected to PostgreSQL database successfully.');

      // Execute all normalized DDL schema table setups and migrations in a single multi-statement batch
      const batchDDL = `
        -- 1. Users table
        CREATE TABLE IF NOT EXISTS zmc_users (
          id VARCHAR(100) PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(100) NOT NULL,
          department VARCHAR(100),
          email VARCHAR(255),
          status VARCHAR(50) DEFAULT 'Active',
          last_login TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100) DEFAULT 'admin'
        );
        ALTER TABLE zmc_users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
        ALTER TABLE zmc_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE zmc_users ADD COLUMN IF NOT EXISTS created_by VARCHAR(100) DEFAULT 'admin';

        -- 2. Departments table
        CREATE TABLE IF NOT EXISTS zmc_departments (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL
        );

        -- 3. Roles table
        CREATE TABLE IF NOT EXISTS zmc_roles (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL
        );

        -- 4. Permissions table
        CREATE TABLE IF NOT EXISTS zmc_permissions (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL
        );

        -- 5. Patients table
        CREATE TABLE IF NOT EXISTS zmc_patients (
          id VARCHAR(100) PRIMARY KEY,
          hospital_number VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          date_of_birth DATE NOT NULL,
          gender VARCHAR(20) NOT NULL,
          phone_number VARCHAR(50),
          email VARCHAR(255),
          address TEXT,
          marital_status VARCHAR(50),
          card_type VARCHAR(50),
          card_fee INT DEFAULT 0,
          status VARCHAR(100),
          registered_by VARCHAR(100),
          registration_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          id_type VARCHAR(50),
          id_number VARCHAR(100),
          next_of_kin_name VARCHAR(255),
          next_of_kin_phone VARCHAR(50),
          next_of_kin_relationship VARCHAR(100),
          patient_can_provide_details BOOLEAN DEFAULT TRUE,
          brought_in_by_name VARCHAR(255),
          brought_in_by_phone VARCHAR(50),
          brought_in_by_relationship VARCHAR(100),
          brought_in_by_id_type VARCHAR(50),
          brought_in_by_id_number VARCHAR(100),
          maternity_number VARCHAR(100)
        );
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS maternity_number VARCHAR(100);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS email VARCHAR(255);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS id_type VARCHAR(50);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS id_number VARCHAR(100);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS next_of_kin_name VARCHAR(255);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS next_of_kin_phone VARCHAR(50);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS next_of_kin_relationship VARCHAR(100);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS patient_can_provide_details BOOLEAN DEFAULT TRUE;
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS brought_in_by_name VARCHAR(255);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS brought_in_by_phone VARCHAR(50);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS brought_in_by_relationship VARCHAR(100);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS brought_in_by_id_type VARCHAR(50);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS brought_in_by_id_number VARCHAR(100);
        ALTER TABLE zmc_patients DROP COLUMN IF EXISTS vitals;
        ALTER TABLE zmc_patients DROP COLUMN IF EXISTS maternity_details;
        ALTER TABLE zmc_patients DROP COLUMN IF EXISTS emergency_details;

        -- 5.1 Encounters table
        CREATE TABLE IF NOT EXISTS zmc_encounters (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL REFERENCES zmc_patients(id) ON DELETE CASCADE,
          visit_number INT NOT NULL,
          visit_type VARCHAR(100) NOT NULL,
          destination_clinic VARCHAR(100) NOT NULL,
          priority VARCHAR(50) DEFAULT 'Normal',
          priority_reason TEXT,
          payment_status VARCHAR(50) DEFAULT 'Unpaid',
          clinical_status VARCHAR(50) DEFAULT 'Pending Vitals',
          created_by VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          closed_at TIMESTAMP
        );
        ALTER TABLE zmc_encounters ADD COLUMN IF NOT EXISTS clinic VARCHAR(100);
        ALTER TABLE zmc_encounters ADD COLUMN IF NOT EXISTS destination_clinic VARCHAR(100) DEFAULT 'General Consultation';

        -- 5a. Patient Vitals table
        CREATE TABLE IF NOT EXISTS zmc_patient_vitals (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL REFERENCES zmc_patients(id) ON DELETE CASCADE,
          encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE,
          recorded_by VARCHAR(100),
          blood_pressure VARCHAR(50),
          temperature NUMERIC(4,1),
          pulse_rate INT,
          respiratory_rate INT,
          spo2 INT,
          weight NUMERIC(5,2),
          height NUMERIC(5,2),
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE zmc_patient_vitals ADD COLUMN IF NOT EXISTS encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE;
        ALTER TABLE zmc_patient_vitals ADD COLUMN IF NOT EXISTS recorded_by VARCHAR(100);

        -- 5b. Maternity Records table
        CREATE TABLE IF NOT EXISTS zmc_maternity_records (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL REFERENCES zmc_patients(id) ON DELETE CASCADE,
          gravida VARCHAR(50),
          para VARCHAR(50),
          lmp DATE,
          edd DATE,
          gestational_age VARCHAR(50),
          tribe VARCHAR(100),
          occupation VARCHAR(255),
          abortion VARCHAR(50),
          premature VARCHAR(50),
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE zmc_maternity_records ADD COLUMN IF NOT EXISTS abortion VARCHAR(50);
        ALTER TABLE zmc_maternity_records ADD COLUMN IF NOT EXISTS premature VARCHAR(50);

        -- 5c. Emergency Records table
        CREATE TABLE IF NOT EXISTS zmc_emergency_records (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL REFERENCES zmc_patients(id) ON DELETE CASCADE,
          is_sick_emergency BOOLEAN DEFAULT FALSE,
          is_unbooked_labour BOOLEAN DEFAULT FALSE,
          is_accident BOOLEAN DEFAULT FALSE,
          is_doctor_on_call BOOLEAN DEFAULT FALSE,
          is_after_hours BOOLEAN DEFAULT FALSE,
          custom_details TEXT,
          total_bill_amount NUMERIC(12,2),
          cash_collected NUMERIC(12,2),
          doctor_on_call_name VARCHAR(255),
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE zmc_emergency_records ADD COLUMN IF NOT EXISTS total_bill_amount NUMERIC(12,2);
        ALTER TABLE zmc_emergency_records ADD COLUMN IF NOT EXISTS cash_collected NUMERIC(12,2);
        ALTER TABLE zmc_emergency_records ADD COLUMN IF NOT EXISTS doctor_on_call_name VARCHAR(255);

        -- 6. Appointments table
        CREATE TABLE IF NOT EXISTS zmc_appointments (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          doctor_id VARCHAR(100) REFERENCES zmc_users(id) ON DELETE SET NULL,
          date DATE NOT NULL,
          time VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'Scheduled',
          reason TEXT,
          type VARCHAR(50)
        );

        -- 7. Consultations table
        CREATE TABLE IF NOT EXISTS zmc_consultations (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE,
          doctor_id VARCHAR(100) REFERENCES zmc_users(id) ON DELETE SET NULL,
          date DATE NOT NULL,
          chief_complaint TEXT,
          history TEXT,
          diagnosis TEXT,
          treatment_plan TEXT,
          prescriptions JSONB
        );
        ALTER TABLE zmc_consultations ADD COLUMN IF NOT EXISTS encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE;
        ALTER TABLE zmc_consultations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE zmc_consultations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        -- 8. Laboratory Orders table
        CREATE TABLE IF NOT EXISTS zmc_laboratory_orders (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE,
          doctor_id VARCHAR(100) REFERENCES zmc_users(id) ON DELETE SET NULL,
          test_name VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'Pending',
          date_ordered TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE zmc_laboratory_orders ADD COLUMN IF NOT EXISTS encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE;
        ALTER TABLE zmc_laboratory_orders ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2) DEFAULT 0;
        ALTER TABLE zmc_laboratory_orders ADD COLUMN IF NOT EXISTS category VARCHAR(100);

        -- 9. Laboratory Results table
        CREATE TABLE IF NOT EXISTS zmc_laboratory_results (
          id VARCHAR(100) PRIMARY KEY,
          order_id VARCHAR(100) REFERENCES zmc_laboratory_orders(id) ON DELETE CASCADE,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          test_name VARCHAR(255) NOT NULL,
          result_details TEXT,
          findings TEXT,
          status VARCHAR(50) DEFAULT 'Completed',
          date_completed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 10. Pharmacy Orders table
        CREATE TABLE IF NOT EXISTS zmc_pharmacy_orders (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE,
          prescribed_by VARCHAR(100) REFERENCES zmc_users(id) ON DELETE SET NULL,
          status VARCHAR(50) DEFAULT 'Pending',
          date_ordered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          items JSONB
        );
        ALTER TABLE zmc_pharmacy_orders ADD COLUMN IF NOT EXISTS encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE;
        ALTER TABLE zmc_pharmacy_orders ADD COLUMN IF NOT EXISTS doctor_id VARCHAR(100) REFERENCES zmc_users(id) ON DELETE SET NULL;
        ALTER TABLE zmc_pharmacy_orders ADD COLUMN IF NOT EXISTS medication_name VARCHAR(255);
        ALTER TABLE zmc_pharmacy_orders ADD COLUMN IF NOT EXISTS dosage VARCHAR(100);
        ALTER TABLE zmc_pharmacy_orders ADD COLUMN IF NOT EXISTS frequency VARCHAR(100);
        ALTER TABLE zmc_pharmacy_orders ADD COLUMN IF NOT EXISTS duration VARCHAR(100);

        -- 11. Invoices table
        CREATE TABLE IF NOT EXISTS zmc_invoices (
          id VARCHAR(100) PRIMARY KEY,
          invoice_number VARCHAR(100),
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE,
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'Unpaid',
          date_issued TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          description TEXT
        );
        ALTER TABLE zmc_invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
        ALTER TABLE zmc_invoices ADD COLUMN IF NOT EXISTS encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE CASCADE;

        -- 12. Payments table
        CREATE TABLE IF NOT EXISTS zmc_payments (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE SET NULL,
          invoice_id VARCHAR(100) REFERENCES zmc_invoices(id) ON DELETE SET NULL,
          amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'Pending',
          date_paid TIMESTAMP,
          payment_method VARCHAR(50),
          collected_by VARCHAR(255)
        );
        ALTER TABLE zmc_payments ADD COLUMN IF NOT EXISTS encounter_id VARCHAR(100) REFERENCES zmc_encounters(id) ON DELETE SET NULL;
        ALTER TABLE zmc_payments DROP CONSTRAINT IF EXISTS zmc_payments_collected_by_fkey;
        ALTER TABLE zmc_payments ALTER COLUMN collected_by TYPE VARCHAR(255);

        -- 12b. Dedicated Lab Payments Record Table
        CREATE TABLE IF NOT EXISTS zmc_lab_payments (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          patient_name VARCHAR(255),
          hospital_number VARCHAR(100),
          card_type VARCHAR(50) DEFAULT 'Standard',
          tests_summary TEXT,
          amount DECIMAL(10,2) NOT NULL,
          payment_method VARCHAR(50) DEFAULT 'Cash',
          date_paid TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          collected_by VARCHAR(100),
          encounter_id VARCHAR(100),
          invoice_id VARCHAR(100)
        );

        -- 12c. Outstanding Balances Table
        CREATE TABLE IF NOT EXISTS zmc_outstanding_balances (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL REFERENCES zmc_patients(id) ON DELETE CASCADE,
          patient_name VARCHAR(255),
          hospital_number VARCHAR(100),
          encounter_id VARCHAR(100),
          invoice_id VARCHAR(100),
          purpose TEXT,
          total_bill DECIMAL(10,2) NOT NULL DEFAULT 0,
          amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
          balance DECIMAL(10,2) NOT NULL DEFAULT 0,
          status VARCHAR(50) DEFAULT 'Owing',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          cleared_by VARCHAR(255),
          cleared_at TIMESTAMP
        );
        ALTER TABLE zmc_outstanding_balances ADD COLUMN IF NOT EXISTS department VARCHAR(100);
        ALTER TABLE zmc_patients ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE zmc_invoices ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE zmc_invoices ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE zmc_payments ADD COLUMN IF NOT EXISTS total_bill DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE zmc_payments ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;

        -- 13. Wards table
        CREATE TABLE IF NOT EXISTS zmc_wards (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          type VARCHAR(50) NOT NULL,
          capacity INT DEFAULT 10
        );

        -- 14. Beds table
        CREATE TABLE IF NOT EXISTS zmc_beds (
          id VARCHAR(100) PRIMARY KEY,
          ward_id VARCHAR(100) REFERENCES zmc_wards(id) ON DELETE CASCADE,
          number VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'Available'
        );

        -- 15. Admissions table
        CREATE TABLE IF NOT EXISTS zmc_admissions (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          ward_id VARCHAR(100) REFERENCES zmc_wards(id) ON DELETE SET NULL,
          bed_id VARCHAR(100) REFERENCES zmc_beds(id) ON DELETE SET NULL,
          date_admitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reason TEXT,
          status VARCHAR(50) DEFAULT 'Admitted'
        );

        -- 16. Discharges table
        CREATE TABLE IF NOT EXISTS zmc_discharges (
          id VARCHAR(100) PRIMARY KEY,
          admission_id VARCHAR(100) REFERENCES zmc_admissions(id) ON DELETE CASCADE,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          date_discharged TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          summary TEXT,
          status VARCHAR(50) DEFAULT 'Discharged'
        );

        -- 17. Employees table
        CREATE TABLE IF NOT EXISTS zmc_employees (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(100) NOT NULL,
          department VARCHAR(100),
          email VARCHAR(255),
          phone VARCHAR(50),
          shift VARCHAR(50) DEFAULT 'Day',
          status VARCHAR(50) DEFAULT 'Active',
          salary DECIMAL(10,2) DEFAULT 0,
          hire_date DATE DEFAULT CURRENT_DATE,
          date_joined DATE DEFAULT CURRENT_DATE,
          documents_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE zmc_employees ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
        ALTER TABLE zmc_employees ADD COLUMN IF NOT EXISTS shift VARCHAR(50) DEFAULT 'Day';
        ALTER TABLE zmc_employees ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE zmc_employees ADD COLUMN IF NOT EXISTS hire_date DATE DEFAULT CURRENT_DATE;
        ALTER TABLE zmc_employees ADD COLUMN IF NOT EXISTS date_joined DATE DEFAULT CURRENT_DATE;
        ALTER TABLE zmc_employees ADD COLUMN IF NOT EXISTS documents_count INT DEFAULT 0;
        ALTER TABLE zmc_employees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

        -- 17b. Absences table
        CREATE TABLE IF NOT EXISTS zmc_absences (
          id VARCHAR(100) PRIMARY KEY,
          employee_id VARCHAR(100) REFERENCES zmc_employees(id) ON DELETE CASCADE,
          employee_name VARCHAR(255) NOT NULL,
          department VARCHAR(100),
          leave_type VARCHAR(100),
          date DATE DEFAULT CURRENT_DATE,
          start_date DATE,
          end_date DATE,
          days_count INT DEFAULT 1,
          reason TEXT,
          status VARCHAR(100) DEFAULT 'Sick Leave',
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reviewed_by VARCHAR(255),
          reviewed_at TIMESTAMP,
          comments TEXT
        );
        ALTER TABLE zmc_absences ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
        ALTER TABLE zmc_absences ALTER COLUMN leave_type DROP NOT NULL;
        ALTER TABLE zmc_absences ALTER COLUMN start_date DROP NOT NULL;
        ALTER TABLE zmc_absences ALTER COLUMN end_date DROP NOT NULL;
        ALTER TABLE zmc_absences ALTER COLUMN status TYPE VARCHAR(100);

        -- 17c. Job Openings table
        CREATE TABLE IF NOT EXISTS zmc_job_openings (
          id VARCHAR(100) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          department VARCHAR(100) NOT NULL,
          openings_count INT DEFAULT 1,
          employment_type VARCHAR(50) DEFAULT 'Full-time',
          status VARCHAR(50) DEFAULT 'Open',
          experience_required VARCHAR(100),
          description TEXT,
          posted_date DATE DEFAULT CURRENT_DATE
        );

        -- 17d. Candidates table
        CREATE TABLE IF NOT EXISTS zmc_candidates (
          id VARCHAR(100) PRIMARY KEY,
          job_id VARCHAR(100) REFERENCES zmc_job_openings(id) ON DELETE SET NULL,
          job_title VARCHAR(255),
          candidate_name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          role_applied VARCHAR(100),
          stage VARCHAR(50) DEFAULT 'Applied',
          experience_years INT DEFAULT 0,
          applied_date DATE DEFAULT CURRENT_DATE,
          notes TEXT,
          rating INT DEFAULT 3
        );

        -- 17e. Discounts & Staff Welfare table
        CREATE TABLE IF NOT EXISTS zmc_discounts (
          id VARCHAR(100) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          discount_code VARCHAR(100),
          category VARCHAR(100) DEFAULT 'Staff Benefit',
          percentage INT DEFAULT 0,
          fixed_amount DECIMAL(10,2) DEFAULT 0,
          applicable_service VARCHAR(255) DEFAULT 'All Consultations & Pharmacy',
          authorized_by VARCHAR(255) DEFAULT 'HR & Management',
          status VARCHAR(50) DEFAULT 'Active',
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 18. Attendance table
        CREATE TABLE IF NOT EXISTS zmc_attendance (
          id VARCHAR(100) PRIMARY KEY,
          employee_id VARCHAR(100) REFERENCES zmc_employees(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'Present',
          check_in VARCHAR(50),
          check_out VARCHAR(50)
        );

        -- 19. Suppliers table
        CREATE TABLE IF NOT EXISTS zmc_suppliers (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          contact_person VARCHAR(255),
          phone VARCHAR(50),
          email VARCHAR(255),
          address TEXT
        );

        -- 20. Procurements table
        CREATE TABLE IF NOT EXISTS zmc_procurements (
          id VARCHAR(100) PRIMARY KEY,
          item_name VARCHAR(255) NOT NULL,
          items TEXT,
          quantity INT DEFAULT 1,
          unit_price DECIMAL(10,2) DEFAULT 0,
          amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          department VARCHAR(100) DEFAULT 'Hospital General',
          supplier_name VARCHAR(255),
          requested_by VARCHAR(255) DEFAULT 'HR / Procurement',
          status VARCHAR(50) DEFAULT 'Delivered',
          date_ordered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          date DATE DEFAULT CURRENT_DATE,
          category VARCHAR(100) DEFAULT 'Medical Supplies'
        );
        ALTER TABLE zmc_procurements ADD COLUMN IF NOT EXISTS items TEXT;
        ALTER TABLE zmc_procurements ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;
        ALTER TABLE zmc_procurements ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Hospital General';
        ALTER TABLE zmc_procurements ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
        ALTER TABLE zmc_procurements ADD COLUMN IF NOT EXISTS requested_by VARCHAR(255) DEFAULT 'HR / Procurement';
        ALTER TABLE zmc_procurements ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
        ALTER TABLE zmc_procurements ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Medical Supplies';

        -- 21. Notifications table
        CREATE TABLE IF NOT EXISTS zmc_notifications (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) REFERENCES zmc_users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          read BOOLEAN DEFAULT FALSE,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 22. Inventory table
        CREATE TABLE IF NOT EXISTS zmc_inventory (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category VARCHAR(100),
          quantity INT DEFAULT 0,
          price INT DEFAULT 0
        );

        -- 23. Audit Logs table
        CREATE TABLE IF NOT EXISTS zmc_audit_logs (
          id VARCHAR(100) PRIMARY KEY,
          timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          user_id VARCHAR(100),
          user_name VARCHAR(255),
          user_role VARCHAR(100),
          action VARCHAR(100),
          details TEXT,
          ip_address VARCHAR(50)
        );

        -- 24. Price Catalogue table
        CREATE TABLE IF NOT EXISTS zmc_price_catalogue (
          id VARCHAR(100) PRIMARY KEY,
          item_code VARCHAR(100) UNIQUE NOT NULL,
          item_name VARCHAR(255) NOT NULL,
          price NUMERIC(12,2) NOT NULL,
          category VARCHAR(100) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 26. Patient Queue table
        CREATE TABLE IF NOT EXISTS zmc_patient_queue (
          id VARCHAR(100) PRIMARY KEY,
          encounter_id VARCHAR(100) NOT NULL REFERENCES zmc_encounters(id) ON DELETE CASCADE,
          patient_id VARCHAR(100) NOT NULL REFERENCES zmc_patients(id) ON DELETE CASCADE,
          queue_type VARCHAR(100) NOT NULL,
          priority VARCHAR(50) DEFAULT 'Normal',
          status VARCHAR(50) DEFAULT 'Waiting',
          arrival_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          processed_at TIMESTAMP,
          processed_by VARCHAR(100)
        );

        -- 27. Clinical Cards table
        CREATE TABLE IF NOT EXISTS zmc_clinical_cards (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL REFERENCES zmc_patients(id) ON DELETE CASCADE,
          card_number VARCHAR(100) UNIQUE NOT NULL,
          card_fee INT DEFAULT 3000,
          issue_date DATE NOT NULL,
          status VARCHAR(50) DEFAULT 'Active',
          category VARCHAR(50) DEFAULT 'Individual'
        );

        -- 28. Clinical Card Replacements table
        CREATE TABLE IF NOT EXISTS zmc_clinical_card_replacements (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL REFERENCES zmc_patients(id) ON DELETE CASCADE,
          old_card_number VARCHAR(100) NOT NULL,
          new_card_number VARCHAR(100) NOT NULL,
          approved_by VARCHAR(100) NOT NULL,
          last_office_seen VARCHAR(255) NOT NULL,
          reason TEXT NOT NULL,
          history_refreshed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 29. Family Accounts table
        CREATE TABLE IF NOT EXISTS zmc_family_accounts (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          balance NUMERIC(12,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 30. Family Members table
        CREATE TABLE IF NOT EXISTS zmc_family_members (
          id VARCHAR(100) PRIMARY KEY,
          family_id VARCHAR(100) NOT NULL REFERENCES zmc_family_accounts(id) ON DELETE CASCADE,
          patient_id VARCHAR(100) NOT NULL UNIQUE REFERENCES zmc_patients(id) ON DELETE CASCADE,
          relationship VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 31. Family Transactions table
        CREATE TABLE IF NOT EXISTS zmc_family_transactions (
          id VARCHAR(100) PRIMARY KEY,
          family_id VARCHAR(100) NOT NULL REFERENCES zmc_family_accounts(id) ON DELETE CASCADE,
          amount NUMERIC(12,2) NOT NULL,
          type VARCHAR(50) NOT NULL,
          description TEXT,
          created_by VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 32. Company Accounts table
        CREATE TABLE IF NOT EXISTS zmc_company_accounts (
          id VARCHAR(100) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(50) UNIQUE NOT NULL,
          billing_cycle VARCHAR(50) DEFAULT 'Monthly',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 33. Company Members table
        CREATE TABLE IF NOT EXISTS zmc_company_members (
          id VARCHAR(100) PRIMARY KEY,
          company_id VARCHAR(100) NOT NULL REFERENCES zmc_company_accounts(id) ON DELETE CASCADE,
          patient_id VARCHAR(100) NOT NULL UNIQUE REFERENCES zmc_patients(id) ON DELETE CASCADE,
          employee_id VARCHAR(100),
          designation VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 34. Company Authorizations table
        CREATE TABLE IF NOT EXISTS zmc_company_authorizations (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL REFERENCES zmc_patients(id) ON DELETE CASCADE,
          company_id VARCHAR(100) NOT NULL REFERENCES zmc_company_accounts(id) ON DELETE CASCADE,
          letter_reference VARCHAR(150) NOT NULL,
          verified_by VARCHAR(100) NOT NULL,
          verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 35. Company Invoices table
        CREATE TABLE IF NOT EXISTS zmc_company_invoices (
          id VARCHAR(100) PRIMARY KEY,
          company_id VARCHAR(100) NOT NULL REFERENCES zmc_company_accounts(id) ON DELETE CASCADE,
          amount NUMERIC(12,2) NOT NULL,
          billing_period VARCHAR(100) NOT NULL,
          status VARCHAR(50) DEFAULT 'Pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 36. Payment Vitae table
        CREATE TABLE IF NOT EXISTS zmc_payment_vitae (
          id VARCHAR(100) PRIMARY KEY,
          person_name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          amount NUMERIC(12,2) NOT NULL,
          approved_by_doctor VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 37. No Charge Records table
        CREATE TABLE IF NOT EXISTS zmc_no_charge_records (
          id VARCHAR(100) PRIMARY KEY,
          staff_name VARCHAR(255) NOT NULL,
          relationship VARCHAR(100) NOT NULL,
          patient_id VARCHAR(100) REFERENCES zmc_patients(id) ON DELETE CASCADE,
          treatment_cost NUMERIC(12,2) NOT NULL,
          treatment_description TEXT NOT NULL,
          approved_by_doctor VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 38. Discount Requests table
        CREATE TABLE IF NOT EXISTS zmc_discount_requests (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          hospital_number VARCHAR(100),
          invoice_id VARCHAR(100),
          encounter_id VARCHAR(100),
          original_amount NUMERIC(12,2) NOT NULL,
          discount_type VARCHAR(50) NOT NULL,
          discount_value NUMERIC(12,2) NOT NULL,
          calculated_discount NUMERIC(12,2) NOT NULL,
          final_amount NUMERIC(12,2) NOT NULL,
          reason TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'Pending',
          requested_by VARCHAR(255) NOT NULL,
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          approved_by VARCHAR(255),
          approved_at TIMESTAMP,
          rejection_reason TEXT
        );

        -- 39. Eye Clinic Patients table
        CREATE TABLE IF NOT EXISTS zmc_eye_patients (
          id VARCHAR(100) PRIMARY KEY,
          hospital_number VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          phone_number VARCHAR(50) NOT NULL,
          date_of_birth VARCHAR(50),
          occupation VARCHAR(100),
          address TEXT,
          next_of_kin VARCHAR(255),
          status VARCHAR(100) DEFAULT 'Awaiting Consult',
          payment_status VARCHAR(100) DEFAULT 'UNPAID',
          chief_complaint TEXT,
          history TEXT,
          routine_exam TEXT,
          external_exam TEXT,
          diagnosis TEXT,
          treatment_plan TEXT,
          total_bill NUMERIC(12,2) DEFAULT 3000.00,
          paid_amount NUMERIC(12,2) DEFAULT 0.00,
          balance NUMERIC(12,2) DEFAULT 3000.00,
          card_fee NUMERIC(12,2) DEFAULT 3000.00,
          date_issued DATE DEFAULT CURRENT_DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 40. Eye Clinic Consultations table
        CREATE TABLE IF NOT EXISTS zmc_eye_consultations (
          id VARCHAR(100) PRIMARY KEY,
          patient_id VARCHAR(100) NOT NULL,
          patient_name VARCHAR(255) NOT NULL,
          hospital_number VARCHAR(100) NOT NULL,
          phone_number VARCHAR(50),
          occupation VARCHAR(100),
          date DATE DEFAULT CURRENT_DATE,
          chief_complaint TEXT,
          history TEXT,
          routine_exam TEXT,
          external_exam TEXT,
          diagnosis TEXT NOT NULL,
          treatment_plan TEXT,
          vitals JSONB,
          services JSONB,
          total_bill NUMERIC(12,2) DEFAULT 0.00,
          total_paid NUMERIC(12,2) DEFAULT 0.00,
          balance NUMERIC(12,2) DEFAULT 0.00,
          payment_status VARCHAR(100) DEFAULT 'UNPAID',
          status VARCHAR(100) DEFAULT 'Consulted',
          doctor_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await pool.query(batchDDL);
      console.log('✅ PostgreSQL relational database tables verified and initialized in batch.');

      // If database is completely unpopulated, seed it instantly with high-quality clinical records
      const usersCheck = await pool.query('SELECT count(*) as count FROM zmc_users');
      if (parseInt(usersCheck.rows[0].count, 10) === 0) {
        console.log('🌱 Database zmc_users is empty. Auto-seeding pristine, normalized relational dataset...');
        await seedDatabase();
      } else {
        // Ensure eye clinic users exist in zmc_users
        const iclinicCheck = await pool.query("SELECT id FROM zmc_users WHERE username = 'iclinic'");
        if (iclinicCheck.rows.length === 0) {
          const hashed = bcrypt.hashSync('password', 10);
          await pool.query(`
            INSERT INTO zmc_users (id, username, password, name, role, department, email, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, department = EXCLUDED.department
          `, ['test-user-eye-clinic-iclinic', 'iclinic', hashed, 'Dr. Clara Vance (Eye Clinic)', 'Eye Clinic', 'Eye Clinic', 'iclinic@zmc.com', 'Active']);
        }

        // Ensure price catalogue exists and is seeded if empty
        const priceCheck = await pool.query('SELECT count(*) as count FROM zmc_price_catalogue');
        if (parseInt(priceCheck.rows[0].count, 10) === 0) {
          console.log('🌱 Price catalogue is empty. Seeding prices...');
          const initialPrices = [
            { id: 'pc-1', item_code: 'CLINICAL_CARD_STANDARD', item_name: 'Standard Clinical Card Registration Fee', price: 3000.00, category: 'Clinical Card' },
            { id: 'pc-2', item_code: 'CLINICAL_CARD_MATERNITY', item_name: 'Maternity/Antenatal Registration Card Fee', price: 5000.00, category: 'Clinical Card' },
            { id: 'pc-3', item_code: 'EMERGENCY_SICK', item_name: 'Sick Emergency Registration Fee', price: 25000.00, category: 'Clinical Card' },
            { id: 'pc-4', item_code: 'EMERGENCY_UNBOOKED_LABOUR', item_name: 'Unbooked Labour/Pregnancy Complications Fee', price: 50000.00, category: 'Clinical Card' },
            { id: 'pc-5', item_code: 'EMERGENCY_ACCIDENT', item_name: 'Emergency Accident Registration Fee', price: 50000.00, category: 'Clinical Card' },
            { id: 'pc-6', item_code: 'EMERGENCY_DOCTOR_ON_CALL', item_name: 'Emergency Doctor On Call Surcharge', price: 5000.00, category: 'Service' },
            { id: 'pc-7', item_code: 'ANTENATAL_VISIT_FEE', item_name: 'Antenatal Visit Fee (Tue/Thu)', price: 1000.00, category: 'Service' },
            { id: 'pc-8', item_code: 'ANTENATAL_FIRST_LAB_PACKAGE', item_name: 'Antenatal First Visit Lab Package (VDRL, HP, MP, RVS, UA)', price: 8500.00, category: 'Laboratory' },
            { id: 'pc-9', item_code: 'CONSULTATION_GENERAL', item_name: 'General Outpatient Consultation Fee', price: 2000.00, category: 'Service' },
            { id: 'pc-10', item_code: 'CONSULTATION_MATERNITY', item_name: 'Maternity Consultation Fee', price: 3000.00, category: 'Service' },

            // CHEMISTRY
            { id: 'pc-lab-1', item_code: 'LAB_LFT', item_name: 'Liver Function Test (LFT)', price: 15000.00, category: 'Laboratory' },
            { id: 'pc-lab-2', item_code: 'LAB_EUC', item_name: 'Electrolyte, Urea, Creatinine (E/U/C)', price: 15000.00, category: 'Laboratory' },
            { id: 'pc-lab-3', item_code: 'LAB_LIPID', item_name: 'Lipid Profile', price: 15000.00, category: 'Laboratory' },
            { id: 'pc-lab-4', item_code: 'LAB_PSA', item_name: 'Prostate Specific Antigen (PSA)', price: 18000.00, category: 'Laboratory' },
            { id: 'pc-lab-5', item_code: 'LAB_CHOLESTEROL', item_name: 'Cholesterol', price: 7000.00, category: 'Laboratory' },
            { id: 'pc-lab-6', item_code: 'LAB_RBS', item_name: 'Random Blood Sugar (RBS)', price: 1500.00, category: 'Laboratory' },
            { id: 'pc-lab-7', item_code: 'LAB_FBS', item_name: 'Fasting Blood Sugar (FBS)', price: 1500.00, category: 'Laboratory' },
            { id: 'pc-lab-8', item_code: 'LAB_FBC_CHEM', item_name: 'Full Blood Count (FBC)', price: 7000.00, category: 'Laboratory' },
            { id: 'pc-lab-9', item_code: 'LAB_HORMONAL_ASSAY', item_name: 'Hormonal Assay', price: 60000.00, category: 'Laboratory' },
            { id: 'pc-lab-10', item_code: 'LAB_HBA1C', item_name: 'HbA1c (Glycated Sugar)', price: 7000.00, category: 'Laboratory' },
            { id: 'pc-lab-11', item_code: 'LAB_UA_CHEM', item_name: 'Urine Analysis (UA)', price: 2500.00, category: 'Laboratory' },
            { id: 'pc-lab-12', item_code: 'LAB_FOB', item_name: 'Faecal Occult Blood Test (FOB)', price: 3000.00, category: 'Laboratory' },
            { id: 'pc-lab-13', item_code: 'LAB_PT_HCG', item_name: 'Pregnancy Test – PT (HCG)', price: 2500.00, category: 'Laboratory' },

            // SEROLOGY
            { id: 'pc-lab-14', item_code: 'LAB_WIDAL', item_name: 'Widal Test', price: 7000.00, category: 'Laboratory' },
            { id: 'pc-lab-15', item_code: 'LAB_HBSAG', item_name: 'Hepatitis B (HBsAg)', price: 3500.00, category: 'Laboratory' },
            { id: 'pc-lab-16', item_code: 'LAB_HCV', item_name: 'Hepatitis C (HCV)', price: 3500.00, category: 'Laboratory' },
            { id: 'pc-lab-17', item_code: 'LAB_VDRL', item_name: 'VDRL (Syphilis)', price: 3500.00, category: 'Laboratory' },
            { id: 'pc-lab-18', item_code: 'LAB_RVS', item_name: 'Retroviral Screening (RVS)', price: 5000.00, category: 'Laboratory' },

            // HAEMATOLOGY
            { id: 'pc-lab-19', item_code: 'LAB_HB', item_name: 'Blood Percentage (HB)', price: 1500.00, category: 'Laboratory' },
            { id: 'pc-lab-20', item_code: 'LAB_BG', item_name: 'Blood Group (BG)', price: 4000.00, category: 'Laboratory' },
            { id: 'pc-lab-21', item_code: 'LAB_GT', item_name: 'Genotype (GT)', price: 8000.00, category: 'Laboratory' },

            // MICROBIOLOGY
            { id: 'pc-lab-22', item_code: 'LAB_EAR_SWAB_MCS', item_name: 'EAR SWAB M/C/S', price: 7000.00, category: 'Laboratory' },
            { id: 'pc-lab-23', item_code: 'LAB_HVS_MCS', item_name: 'HVS M/C/S', price: 7000.00, category: 'Laboratory' },
            { id: 'pc-lab-24', item_code: 'LAB_URINE_MCS', item_name: 'Urine M/C/S', price: 7000.00, category: 'Laboratory' },
            { id: 'pc-lab-25', item_code: 'LAB_PUS_SWAB_MCS', item_name: 'Pus Swab M/C/S', price: 10000.00, category: 'Laboratory' },
            { id: 'pc-lab-26', item_code: 'LAB_SEMEN_MCS', item_name: 'Semen Culture M/C/S', price: 15000.00, category: 'Laboratory' },
            { id: 'pc-lab-27', item_code: 'LAB_URETHRAL_SWAB_MCS', item_name: 'Urethral Swab M/C/S', price: 7000.00, category: 'Laboratory' },
            { id: 'pc-lab-28', item_code: 'LAB_STOOL_MCS', item_name: 'Stool Culture M/C/S', price: 15000.00, category: 'Laboratory' },
            { id: 'pc-lab-29', item_code: 'LAB_SPUTUM_MCS', item_name: 'Sputum M/C/S', price: 10000.00, category: 'Laboratory' },
            { id: 'pc-lab-30', item_code: 'LAB_HP', item_name: 'H. pylori (HP)', price: 5000.00, category: 'Laboratory' },

            // PARASITOLOGY
            { id: 'pc-lab-31', item_code: 'LAB_STOOL_ANALYSIS', item_name: 'Stool Analysis', price: 5000.00, category: 'Laboratory' },
            { id: 'pc-lab-32', item_code: 'LAB_MICRO_FILIARIASIS', item_name: 'Microfilaria (MF)', price: 5000.00, category: 'Laboratory' },
            { id: 'pc-lab-33', item_code: 'LAB_MALARIA_PARASITE', item_name: 'Malaria Parasite (MP)', price: 3000.00, category: 'Laboratory' },
          ];
          for (const item of initialPrices) {
            await pool.query(`
              INSERT INTO zmc_price_catalogue (id, item_code, item_name, price, category)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (item_code) DO NOTHING
            `, [item.id, item.item_code, item.item_name, item.price, item.category]);
          }
        }

        // Ensure IT and other departments exist in zmc_departments
        const standardDepartments = [
          { id: 'd1', name: 'IT' },
          { id: 'd2', name: 'OPD' },
          { id: 'd3', name: 'Medical' },
          { id: 'd4', name: 'Laboratory' },
          { id: 'd5', name: 'Pharmacy' },
          { id: 'd6', name: 'Nursing' },
          { id: 'd7', name: 'Finance' },
          { id: 'd8', name: 'Human Resources' },
          { id: 'd9', name: 'Eye Clinic' },
          { id: 'd10', name: 'Administration' },
          { id: 'd11', name: 'Consultation' },
          { id: 'd12', name: 'Accounts' }
        ];
        for (const dep of standardDepartments) {
          const byName = await pool.query("SELECT id FROM zmc_departments WHERE name = $1", [dep.name]);
          if (byName.rows.length === 0) {
            const byId = await pool.query("SELECT id FROM zmc_departments WHERE id = $1", [dep.id]);
            if (byId.rows.length > 0) {
              await pool.query("INSERT INTO zmc_departments (id, name) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING", [generateUUID(), dep.name]);
            } else {
              await pool.query("INSERT INTO zmc_departments (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [dep.id, dep.name]);
            }
          }
        }
        
        // Ensure 10 standard seeded users exist in zmc_users with designated credentials
        const standardUsers = [
          { id: 'user-it-admin-1', username: 'admin', password: 'admin123', name: 'IT Administrator', role: 'IT Administrator', department: 'IT', email: 'admin@zmc.com', status: 'Active', created_at: '2026-02-19 08:00:00', created_by: 'system', last_login: '2026-08-18 00:18:00' },
          { id: 'user-opd-clerk-2', username: 'opd.clerk', password: 'opd123', name: 'OPD Clerk', role: 'OPD Clerk', department: 'OPD', email: 'opd.clerk@zmc.com', status: 'Active', created_at: '2026-04-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'user-cashier-3', username: 'cashier1', password: 'cash123', name: 'Cashier Officer', role: 'Cashier', department: 'Finance', email: 'cashier1@zmc.com', status: 'Active', created_at: '2026-04-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'user-doctor-smith-4', username: 'dr.smith', password: 'doc123', name: 'Dr. John Smith', role: 'Doctor', department: 'Medical', email: 'dr.smith@zmc.com', status: 'Active', created_at: '2026-05-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'user-lab-tech-5', username: 'lab.tech', password: 'lab123', name: 'Lab Technician', role: 'Lab Technician', department: 'Laboratory', email: 'lab.tech@zmc.com', status: 'Active', created_at: '2026-05-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'user-pharmacist-6', username: 'pharmacist1', password: 'pharm123', name: 'Pharmacist', role: 'Pharmacist', department: 'Pharmacy', email: 'pharmacist1@zmc.com', status: 'Active', created_at: '2026-05-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'user-head-nurse-7', username: 'nurse1', password: 'nurse123', name: 'Head Nurse', role: 'Nurse', department: 'Nursing', email: 'nurse1@zmc.com', status: 'Active', created_at: '2026-05-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'user-accounts-8', username: 'accounts', password: 'acc123', name: 'Account Officer', role: 'Account Officer', department: 'Finance', email: 'accounts@zmc.com', status: 'Active', created_at: '2026-06-19 08:00:00', created_by: 'admin', last_login: null },
          { id: 'user-hr-manager-9', username: 'hr.manager', password: 'hr123', name: 'HR Manager', role: 'HR Manager', department: 'Human Resources', email: 'hr.manager@zmc.com', status: 'Active', created_at: '2026-06-19 08:00:00', created_by: 'admin', last_login: null },
          { id: 'user-eye-clinic-10', username: 'eye.clinic', password: 'eye123', name: 'Eye Clinic Specialist', role: 'Eye Clinic', department: 'Eye Clinic', email: 'eye.clinic@zmc.com', status: 'Active', created_at: '2026-06-19 08:00:00', created_by: 'admin', last_login: null },
          
          // Compatibility accounts for existing test suites
          { id: 'compat-user-accountant', username: 'accountant', password: 'accountant123', name: 'Account Officer', role: 'Account Officer', department: 'Finance', email: 'accountant@zmc.com', status: 'Active', created_at: '2026-06-19 08:00:00', created_by: 'admin', last_login: null },
          { id: 'compat-user-dr-smith-legacy', username: 'dr_smith', password: 'password', name: 'Dr. Alan Smith', role: 'Doctor', department: 'Medical', email: 'dr_smith@zmc.com', status: 'Active', created_at: '2026-05-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'compat-user-nurse-jane', username: 'nurse_jane', password: 'password', name: 'Nurse Jane Doe', role: 'Nurse', department: 'Nursing', email: 'jane@zmc.com', status: 'Active', created_at: '2026-05-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'compat-user-lab-tech', username: 'lab_tech', password: 'password', name: 'John Doe (Lab Tech)', role: 'Lab Technician', department: 'Laboratory', email: 'lab@zmc.com', status: 'Active', created_at: '2026-05-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'compat-user-pharmacist', username: 'pharmacist', password: 'password', name: 'Mary Green (Pharmacist)', role: 'Pharmacist', department: 'Pharmacy', email: 'pharm@zmc.com', status: 'Active', created_at: '2026-05-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'compat-user-opd-reg', username: 'opd_registrar', password: 'password', name: 'Grace Okafor (OPD Registrar)', role: 'OPD Clerk', department: 'OPD', email: 'opd@zmc.com', status: 'Active', created_at: '2026-04-20 08:00:00', created_by: 'admin', last_login: null },
          { id: 'compat-user-iclinic', username: 'iclinic', password: 'password', name: 'Dr. Clara Vance (Eye Clinic)', role: 'Eye Clinic', department: 'Eye Clinic', email: 'iclinic@zmc.com', status: 'Active', created_at: '2026-06-19 08:00:00', created_by: 'admin', last_login: null }
        ];

        for (const u of standardUsers) {
          const hashed = bcrypt.hashSync(u.password, 10);
          const userCheck = await pool.query("SELECT id, password FROM zmc_users WHERE LOWER(username) = LOWER($1)", [u.username]);
          if (userCheck.rows.length === 0) {
            await pool.query(`
              INSERT INTO zmc_users (id, username, password, name, role, department, email, status, created_at, created_by, last_login)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [u.id, u.username, hashed, u.name, u.role, u.department, u.email, u.status, u.created_at, u.created_by, u.last_login]);
          } else {
            // Update password hash, role, department, and active status to guarantee exact synchronization
            await pool.query(`
              UPDATE zmc_users 
              SET password = $1, role = $2, department = $3, name = $4, status = 'Active'
              WHERE LOWER(username) = LOWER($5)
            `, [hashed, u.role, u.department, u.name, u.username]);
          }
        }
        // Synchronize initial employees if empty
        const empCount = await pool.query('SELECT COUNT(*) FROM zmc_employees');
        if (parseInt(empCount.rows[0].count, 10) === 0) {
          const initEmps = createInitialDatabase().employees;
          for (const e of initEmps) {
            await pool.query(`
              INSERT INTO zmc_employees (id, name, role, department, email, phone, shift, status, salary, hire_date, date_joined, documents_count)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT (id) DO NOTHING
            `, [e.id, e.name, e.role, e.department, e.email, e.phone, e.shift, e.status, e.salary, e.hire_date, e.date_joined || e.hire_date, e.documents_count || 0]);
          }
        }

        // Synchronize initial absences if empty
        const absCount = await pool.query('SELECT COUNT(*) FROM zmc_absences');
        if (parseInt(absCount.rows[0].count, 10) === 0) {
          const initAbs = createInitialDatabase().absences;
          for (const a of initAbs) {
            await pool.query(`
              INSERT INTO zmc_absences (id, employee_id, employee_name, department, leave_type, date, start_date, end_date, days_count, reason, status, applied_at)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT (id) DO NOTHING
            `, [a.id, a.employee_id, a.employee_name, a.department, a.leave_type, a.date || a.start_date, a.start_date, a.end_date, a.days_count, a.reason, a.status, a.applied_at || new Date().toISOString()]);
          }
        }

        // Synchronize initial Eye Clinic Patients if empty
        const eyeCount = await pool.query('SELECT COUNT(*) FROM zmc_eye_patients');
        if (parseInt(eyeCount.rows[0].count, 10) === 0) {
          const initialEyePatients = [
            {
              id: 'EC-100001',
              hospital_number: 'EC-100001',
              name: 'Chioma Okeke',
              phone_number: '08031000001',
              date_of_birth: '1988-04-12',
              occupation: 'High School Teacher',
              address: 'Plot 14, Independence Layout, Enugu',
              next_of_kin: 'Emeka Okeke (Husband)',
              status: 'Awaiting Consult',
              payment_status: 'Paid',
              chief_complaint: 'Progressive difficulty reading fine prints in books and prolonged screen glare',
              history: 'Reports mild eye strain when grading papers for >2 hours. No history of ocular trauma or previous ocular surgery. Mild systemic hypertension managed on Amlodipine 5mg.',
              routine_exam: 'VA OD: 6/9, OS: 6/9. Near Vision: N8 at 33cm. Refraction: OD +1.25DS, OS +1.25DS with +1.50 Add. Pupils equal and reactive.',
              external_exam: 'Lids clear, conjunctiva quiet, cornea transparent, anterior chamber deep and quiet, lens clear bilateral.',
              diagnosis: 'Presbyopia with Bilateral Asthenopia',
              treatment_plan: 'Prescription of progressive anti-reflective lenses. 20-20-20 screen hygiene rule advised. Follow-up in 6 months.',
              total_bill: 35000,
              paid_amount: 35000,
              balance: 0,
              card_fee: 3000,
              date_issued: '2026-07-13'
            },
            {
              id: 'EC-100002',
              hospital_number: 'EC-100002',
              name: 'Ibrahim Musa',
              phone_number: '08031000002',
              date_of_birth: '1975-09-20',
              occupation: 'Civil Servant',
              address: '18 Garden Avenue, Enugu',
              next_of_kin: 'Amina Musa (Wife)',
              status: 'Consulted',
              payment_status: 'Paid',
              chief_complaint: 'Chronic bilateral ocular itching, gritty sensation, foreign body sensation',
              history: 'Allergic rhinitis history. Regular exposure to dust. Uses over-the-counter soothing drops with temporary relief.',
              routine_exam: 'VA OD: 6/6, OS: 6/6. IOP: OD 14 mmHg, OS 15 mmHg. Slit lamp: Papillary reaction on upper tarsal conjunctiva.',
              external_exam: 'Mild conjunctival hyperemia bilateral. Tear breakup time 8 seconds. Cornea clear.',
              diagnosis: 'Allergic Conjunctivitis with Mild Dry Eye Syndrome',
              treatment_plan: 'Olopatadine 0.1% eye drops 1 drop BD x 4 weeks. Preservative-free lubricating tear drops QDS. Sunglasses outdoors.',
              total_bill: 18000,
              paid_amount: 18000,
              balance: 0,
              card_fee: 3000,
              date_issued: '2026-07-12'
            },
            {
              id: 'EC-100003',
              hospital_number: 'EC-100003',
              name: 'Ngozi Adeleke',
              phone_number: '08031000003',
              date_of_birth: '1992-11-05',
              occupation: 'Software Developer',
              address: '5 Ogui Road, Enugu',
              next_of_kin: 'Kunle Adeleke (Brother)',
              status: 'Consulted',
              payment_status: 'Paid',
              chief_complaint: 'Blurred distant vision, frequent frontal headaches following intense computer use',
              history: 'Computer usage >10 hours daily. No family history of glaucoma. No prior spectacles.',
              routine_exam: 'VA OD: 6/18, OS: 6/12. Refraction: OD -1.50/-0.75 x 90 (6/6), OS -1.00/-0.50 x 85 (6/6). IOP OD 15, OS 16.',
              external_exam: 'Normal anterior segment. Clear media. Fundus exam normal with healthy neuroretinal rim and CDR 0.3.',
              diagnosis: 'Myopic Astigmatism with Computer Vision Syndrome',
              treatment_plan: 'Prescribed blue-cut anti-reflective spectacles. Artificial tears PRN. Advised ergonomic monitor positioning.',
              total_bill: 42000,
              paid_amount: 42000,
              balance: 0,
              card_fee: 3000,
              date_issued: '2026-07-10'
            },
            {
              id: 'EC-100004',
              hospital_number: 'EC-100004',
              name: 'Emmanuel Nwachukwu',
              phone_number: '08031000004',
              date_of_birth: '1960-03-15',
              occupation: 'Retired Principal',
              address: '22 Chime Avenue, New Haven, Enugu',
              next_of_kin: 'Obinna Nwachukwu (Son)',
              status: 'Awaiting Consult',
              payment_status: 'Part Paid',
              chief_complaint: 'Gradual painless deterioration of distance and near vision, halos around headlights at night',
              history: 'Known type 2 diabetic for 8 years on Metformin. HbA1c 6.8%. No diabetic retinopathy on last year screening.',
              routine_exam: 'VA OD: 6/24 (pinhole 6/18), OS: 6/18 (pinhole 6/12). IOP: OD 17 mmHg, OS 16 mmHg.',
              external_exam: 'Nuclear sclerosis grade 2+ bilateral lens. Fundus view slightly hazy but macula flat and vessels normal.',
              diagnosis: 'Age-related Nuclear Cataract (Bilateral, OD > OS)',
              treatment_plan: 'Phacoemulsification with Foldable IOL counseling. Pre-op biometry and cardiology clearance scheduled.',
              total_bill: 25000,
              paid_amount: 10000,
              balance: 15000,
              card_fee: 3000,
              date_issued: '2026-07-14'
            },
            {
              id: 'EC-100005',
              hospital_number: 'EC-100005',
              name: 'Fatima Danjuma',
              phone_number: '08031000005',
              date_of_birth: '2001-08-30',
              occupation: 'University Undergraduate',
              address: 'Enugu Campus Hostel B, UNN',
              next_of_kin: 'Usman Danjuma (Father)',
              status: 'Awaiting Cashier Verification',
              payment_status: 'UNPAID',
              chief_complaint: 'Acute right eye pain, redness, photophobia and watery discharge after studying with contact lenses',
              history: 'Soft contact lens wearer for 2 years. Admits to sleeping with lenses on two nights ago.',
              routine_exam: 'VA OD: 6/12, OS: 6/6. Slit lamp OD: Circumcorneal ciliary flush, small 1mm epithelial defect at 4 o clock paracentral cornea with fluorescein staining.',
              external_exam: 'No corneal stromal infiltrate or hypopyon. Anterior chamber quiet. OS anterior segment unremarkable.',
              diagnosis: 'Contact Lens-Induced Corneal Epithelial Abrasion (OD)',
              treatment_plan: 'Strict contact lens cessation. Moxifloxacin 0.5% eye drops 1 drop QDS OD x 7 days. Preservative-free tears. Review in 48 hours.',
              total_bill: 3000,
              paid_amount: 0,
              balance: 3000,
              card_fee: 3000,
              date_issued: '2026-07-14'
            }
          ];

          for (const p of initialEyePatients) {
            await pool.query(`
              INSERT INTO zmc_eye_patients (
                id, hospital_number, name, phone_number, date_of_birth, occupation, address, next_of_kin,
                status, payment_status, chief_complaint, history, routine_exam, external_exam, diagnosis,
                treatment_plan, total_bill, paid_amount, balance, card_fee, date_issued
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
              ON CONFLICT (id) DO NOTHING
            `, [
              p.id, p.hospital_number, p.name, p.phone_number, p.date_of_birth, p.occupation, p.address, p.next_of_kin,
              p.status, p.payment_status, p.chief_complaint, p.history, p.routine_exam, p.external_exam, p.diagnosis,
              p.treatment_plan, p.total_bill, p.paid_amount, p.balance, p.card_fee, p.date_issued
            ]);
          }

          // Also seed initial consultation logs
          const initialConsultations = [
            {
              id: 'REC-EC-90001',
              patient_id: 'EC-100002',
              patient_name: 'Ibrahim Musa',
              hospital_number: 'EC-100002',
              phone_number: '08031000002',
              occupation: 'Civil Servant',
              date: '2026-07-12',
              chief_complaint: 'Chronic bilateral ocular itching, gritty sensation, foreign body sensation',
              history: 'Allergic rhinitis history. Regular exposure to dust. Uses over-the-counter soothing drops with temporary relief.',
              routine_exam: 'VA OD: 6/6, OS: 6/6. IOP: OD 14 mmHg, OS 15 mmHg. Slit lamp: Papillary reaction on upper tarsal conjunctiva.',
              external_exam: 'Mild conjunctival hyperemia bilateral. Tear breakup time 8 seconds. Cornea clear.',
              diagnosis: 'Allergic Conjunctivitis with Mild Dry Eye Syndrome',
              treatment_plan: 'Olopatadine 0.1% eye drops 1 drop BD x 4 weeks. Preservative-free lubricating tear drops QDS. Sunglasses outdoors.',
              vitals: { bp: '120/80', sugar: '5.4' },
              services: [
                { name: 'Slit Lamp Biomicroscopy', category: 'Eye Tests', price: 5000 },
                { name: 'Non-Contact Tonometry (IOP)', category: 'Eye Tests', price: 4000 },
                { name: 'Dry Eye Evaluation & TBUT', category: 'Eye Tests', price: 6000 }
              ],
              total_bill: 18000,
              total_paid: 18000,
              balance: 0,
              payment_status: 'Paid',
              status: 'Consulted',
              doctor_name: 'Dr. Clara Vance (Optometrist)'
            },
            {
              id: 'REC-EC-90002',
              patient_id: 'EC-100003',
              patient_name: 'Ngozi Adeleke',
              hospital_number: 'EC-100003',
              phone_number: '08031000003',
              occupation: 'Software Developer',
              date: '2026-07-10',
              chief_complaint: 'Blurred distant vision, frequent frontal headaches following intense computer use',
              history: 'Computer usage >10 hours daily. No family history of glaucoma. No prior spectacles.',
              routine_exam: 'VA OD: 6/18, OS: 6/12. Refraction: OD -1.50/-0.75 x 90 (6/6), OS -1.00/-0.50 x 85 (6/6). IOP OD 15, OS 16.',
              external_exam: 'Normal anterior segment. Clear media. Fundus exam normal with healthy neuroretinal rim and CDR 0.3.',
              diagnosis: 'Myopic Astigmatism with Computer Vision Syndrome',
              treatment_plan: 'Prescribed blue-cut anti-reflective spectacles. Artificial tears PRN. Advised ergonomic monitor positioning.',
              vitals: { bp: '115/75', sugar: '4.9' },
              services: [
                { name: 'Comprehensive Refraction Examination', category: 'Eye Tests', price: 7000 },
                { name: 'Designer TR90 Flexible Frame', category: 'Frames', price: 18000 },
                { name: 'Blue-Cut Digital Protective Lenses', category: 'Lenses', price: 14000 }
              ],
              total_bill: 42000,
              total_paid: 42000,
              balance: 0,
              payment_status: 'Paid',
              status: 'Consulted',
              doctor_name: 'Dr. Clara Vance (Optometrist)'
            }
          ];

          for (const c of initialConsultations) {
            await pool.query(`
              INSERT INTO zmc_eye_consultations (
                id, patient_id, patient_name, hospital_number, phone_number, occupation, date,
                chief_complaint, history, routine_exam, external_exam, diagnosis, treatment_plan,
                vitals, services, total_bill, total_paid, balance, payment_status, status, doctor_name
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
              ON CONFLICT (id) DO NOTHING
            `, [
              c.id, c.patient_id, c.patient_name, c.hospital_number, c.phone_number, c.occupation, c.date,
              c.chief_complaint, c.history, c.routine_exam, c.external_exam, c.diagnosis, c.treatment_plan,
              JSON.stringify(c.vitals), JSON.stringify(c.services), c.total_bill, c.total_paid, c.balance,
              c.payment_status, c.status, c.doctor_name
            ]);
          }
        }

        await refreshCache();
      }

      console.log('✅ PostgreSQL database relational schema initialized & synchronized.');
    } catch (err: any) {
      console.error('❌ PostgreSQL connection/initialization failed:', err.message);
      isPostgresActive = false;
    }
  } else {
    console.error('❌ Critical: No PostgreSQL connection variables configured.');
    isPostgresActive = false;
  }
}

export async function seedDatabase(): Promise<any> {
  if (!pool) {
    throw new Error('Database connection pool is not available for seeding.');
  }

  // Clear existing records to ensure perfect referential integrity
  const tablesToTruncate = [
    'zmc_price_catalogue', 'zmc_patient_queue', 'zmc_clinical_card_replacements', 'zmc_clinical_cards',
    'zmc_family_transactions', 'zmc_family_members', 'zmc_family_accounts',
    'zmc_company_invoices', 'zmc_company_authorizations', 'zmc_company_members', 'zmc_company_accounts',
    'zmc_payment_vitae', 'zmc_no_charge_records', 'zmc_discount_requests',
    'zmc_audit_logs', 'zmc_notifications', 'zmc_payments', 'zmc_lab_payments', 'zmc_outstanding_balances',
    'zmc_invoices', 'zmc_discharges', 'zmc_admissions', 'zmc_beds', 'zmc_wards',
    'zmc_pharmacy_orders', 'zmc_laboratory_results', 'zmc_laboratory_orders', 'zmc_consultations',
    'zmc_appointments', 'zmc_patient_vitals', 'zmc_maternity_records', 'zmc_emergency_records',
    'zmc_encounters', 'zmc_patients', 'zmc_permissions', 'zmc_roles', 'zmc_departments', 'zmc_users',
    'zmc_inventory', 'zmc_attendance', 'zmc_absences', 'zmc_candidates', 'zmc_job_openings',
    'zmc_discounts', 'zmc_procurements', 'zmc_suppliers', 'zmc_employees'
  ];
  for (const t of tablesToTruncate) {
    try {
      await pool.query(`TRUNCATE TABLE ${t} CASCADE`);
    } catch {
      // Table may not exist yet or already empty, skip gracefully
    }
  }

  console.log('Seeding price catalogue...');
  const priceCatalogue = [
    { id: 'pc-1', item_code: 'CLINICAL_CARD_STANDARD', item_name: 'Standard Clinical Card Registration Fee', price: 3000.00, category: 'Clinical Card' },
    { id: 'pc-2', item_code: 'CLINICAL_CARD_MATERNITY', item_name: 'Maternity/Antenatal Registration Card Fee', price: 5000.00, category: 'Clinical Card' },
    { id: 'pc-3', item_code: 'EMERGENCY_SICK', item_name: 'Sick Emergency Registration Fee', price: 25000.00, category: 'Clinical Card' },
    { id: 'pc-4', item_code: 'EMERGENCY_UNBOOKED_LABOUR', item_name: 'Unbooked Labour/Pregnancy Complications Fee', price: 50000.00, category: 'Clinical Card' },
    { id: 'pc-5', item_code: 'EMERGENCY_ACCIDENT', item_name: 'Emergency Accident Registration Fee', price: 50000.00, category: 'Clinical Card' },
    { id: 'pc-6', item_code: 'EMERGENCY_DOCTOR_ON_CALL', item_name: 'Emergency Doctor On Call Surcharge', price: 5000.00, category: 'Service' },
    { id: 'pc-7', item_code: 'ANTENATAL_VISIT_FEE', item_name: 'Antenatal Visit Fee (Tue/Thu)', price: 1000.00, category: 'Service' },
    { id: 'pc-8', item_code: 'ANTENATAL_FIRST_LAB_PACKAGE', item_name: 'Antenatal First Visit Lab Package (VDRL, HP, MP, RVS, UA)', price: 8500.00, category: 'Laboratory' },
    { id: 'pc-9', item_code: 'CONSULTATION_GENERAL', item_name: 'General Outpatient Consultation Fee', price: 2000.00, category: 'Service' },
    { id: 'pc-10', item_code: 'CONSULTATION_MATERNITY', item_name: 'Maternity Consultation Fee', price: 3000.00, category: 'Service' },

    // CHEMISTRY
    { id: 'pc-lab-1', item_code: 'LAB_LFT', item_name: 'Liver Function Test (LFT)', price: 15000.00, category: 'Laboratory' },
    { id: 'pc-lab-2', item_code: 'LAB_EUC', item_name: 'Electrolyte, Urea, Creatinine (E/U/C)', price: 15000.00, category: 'Laboratory' },
    { id: 'pc-lab-3', item_code: 'LAB_LIPID', item_name: 'Lipid Profile', price: 15000.00, category: 'Laboratory' },
    { id: 'pc-lab-4', item_code: 'LAB_PSA', item_name: 'Prostate Specific Antigen (PSA)', price: 18000.00, category: 'Laboratory' },
    { id: 'pc-lab-5', item_code: 'LAB_CHOLESTEROL', item_name: 'Cholesterol', price: 7000.00, category: 'Laboratory' },
    { id: 'pc-lab-6', item_code: 'LAB_RBS', item_name: 'Random Blood Sugar (RBS)', price: 1500.00, category: 'Laboratory' },
    { id: 'pc-lab-7', item_code: 'LAB_FBS', item_name: 'Fasting Blood Sugar (FBS)', price: 1500.00, category: 'Laboratory' },
    { id: 'pc-lab-8', item_code: 'LAB_FBC_CHEM', item_name: 'Full Blood Count (FBC)', price: 7000.00, category: 'Laboratory' },
    { id: 'pc-lab-9', item_code: 'LAB_HORMONAL_ASSAY', item_name: 'Hormonal Assay', price: 60000.00, category: 'Laboratory' },
    { id: 'pc-lab-10', item_code: 'LAB_HBA1C', item_name: 'HbA1c (Glycated Sugar)', price: 7000.00, category: 'Laboratory' },
    { id: 'pc-lab-11', item_code: 'LAB_UA_CHEM', item_name: 'Urine Analysis (UA)', price: 2500.00, category: 'Laboratory' },
    { id: 'pc-lab-12', item_code: 'LAB_FOB', item_name: 'Faecal Occult Blood Test (FOB)', price: 3000.00, category: 'Laboratory' },
    { id: 'pc-lab-13', item_code: 'LAB_PT_HCG', item_name: 'Pregnancy Test – PT (HCG)', price: 2500.00, category: 'Laboratory' },

    // SEROLOGY
    { id: 'pc-lab-14', item_code: 'LAB_WIDAL', item_name: 'Widal Test', price: 7000.00, category: 'Laboratory' },
    { id: 'pc-lab-15', item_code: 'LAB_HBSAG', item_name: 'Hepatitis B (HBsAg)', price: 3500.00, category: 'Laboratory' },
    { id: 'pc-lab-16', item_code: 'LAB_HCV', item_name: 'Hepatitis C (HCV)', price: 3500.00, category: 'Laboratory' },
    { id: 'pc-lab-17', item_code: 'LAB_VDRL', item_name: 'VDRL (Syphilis)', price: 3500.00, category: 'Laboratory' },
    { id: 'pc-lab-18', item_code: 'LAB_RVS', item_name: 'Retroviral Screening (RVS)', price: 5000.00, category: 'Laboratory' },

    // HAEMATOLOGY
    { id: 'pc-lab-19', item_code: 'LAB_HB', item_name: 'Blood Percentage (HB)', price: 1500.00, category: 'Laboratory' },
    { id: 'pc-lab-20', item_code: 'LAB_BG', item_name: 'Blood Group (BG)', price: 4000.00, category: 'Laboratory' },
    { id: 'pc-lab-21', item_code: 'LAB_GT', item_name: 'Genotype (GT)', price: 8000.00, category: 'Laboratory' },

    // MICROBIOLOGY
    { id: 'pc-lab-22', item_code: 'LAB_EAR_SWAB_MCS', item_name: 'EAR SWAB M/C/S', price: 7000.00, category: 'Laboratory' },
    { id: 'pc-lab-23', item_code: 'LAB_HVS_MCS', item_name: 'HVS M/C/S', price: 7000.00, category: 'Laboratory' },
    { id: 'pc-lab-24', item_code: 'LAB_URINE_MCS', item_name: 'Urine M/C/S', price: 7000.00, category: 'Laboratory' },
    { id: 'pc-lab-25', item_code: 'LAB_PUS_SWAB_MCS', item_name: 'Pus Swab M/C/S', price: 10000.00, category: 'Laboratory' },
    { id: 'pc-lab-26', item_code: 'LAB_SEMEN_MCS', item_name: 'Semen Culture M/C/S', price: 15000.00, category: 'Laboratory' },
    { id: 'pc-lab-27', item_code: 'LAB_URETHRAL_SWAB_MCS', item_name: 'Urethral Swab M/C/S', price: 7000.00, category: 'Laboratory' },
    { id: 'pc-lab-28', item_code: 'LAB_STOOL_MCS', item_name: 'Stool Culture M/C/S', price: 15000.00, category: 'Laboratory' },
    { id: 'pc-lab-29', item_code: 'LAB_SPUTUM_MCS', item_name: 'Sputum M/C/S', price: 10000.00, category: 'Laboratory' },
    { id: 'pc-lab-30', item_code: 'LAB_HP', item_name: 'H. pylori (HP)', price: 5000.00, category: 'Laboratory' },

    // PARASITOLOGY
    { id: 'pc-lab-31', item_code: 'LAB_STOOL_ANALYSIS', item_name: 'Stool Analysis', price: 5000.00, category: 'Laboratory' },
    { id: 'pc-lab-32', item_code: 'LAB_MICRO_FILIARIASIS', item_name: 'Microfilaria (MF)', price: 5000.00, category: 'Laboratory' },
    { id: 'pc-lab-33', item_code: 'LAB_MALARIA_PARASITE', item_name: 'Malaria Parasite (MP)', price: 3000.00, category: 'Laboratory' },
  ];
  for (const item of priceCatalogue) {
    await pool.query(`
      INSERT INTO zmc_price_catalogue (id, item_code, item_name, price, category)
      VALUES ($1, $2, $3, $4, $5)
    `, [item.id, item.item_code, item.item_name, item.price, item.category]);
  }

  console.log('Seeding corporate company accounts...');
  const companyAccounts = [
    { id: 'comp-1', name: 'Chevron Nigeria Limited', code: 'CHEV-001', billing_cycle: 'Monthly' },
    { id: 'comp-2', name: 'Shell Petroleum Development Company', code: 'SHEL-002', billing_cycle: 'Monthly' },
    { id: 'comp-3', name: 'Nigerian Ports Authority', code: 'NPA-003', billing_cycle: 'Monthly' }
  ];
  for (const comp of companyAccounts) {
    await pool.query(`
      INSERT INTO zmc_company_accounts (id, name, code, billing_cycle)
      VALUES ($1, $2, $3, $4)
    `, [comp.id, comp.name, comp.code, comp.billing_cycle]);
  }

  console.log('Seeding family deposit accounts...');
  const familyAccounts = [
    { id: 'fam-1', name: 'The Nwachukwu Family', balance: 45000.00 },
    { id: 'fam-2', name: 'The Okoro Family', balance: 15000.00 },
    { id: 'fam-3', name: 'The Adeleke Family', balance: 1200.00 } // low balance
  ];
  for (const fam of familyAccounts) {
    await pool.query(`
      INSERT INTO zmc_family_accounts (id, name, balance)
      VALUES ($1, $2, $3)
    `, [fam.id, fam.name, fam.balance]);

    // Add initial deposit transaction
    await pool.query(`
      INSERT INTO zmc_family_transactions (id, family_id, amount, type, description, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [generateUUID(), fam.id, fam.balance, 'Deposit', 'Initial Activation Deposit', 'admin']);
  }

  console.log('Seeding departments, roles, and permissions...');
  const departments = [
    { id: "d1", name: "Administration" },
    { id: "d2", name: "OPD" },
    { id: "d3", name: "Consultation" },
    { id: "d4", name: "Laboratory" },
    { id: "d5", name: "Pharmacy" },
    { id: "d6", name: "Nursing" },
    { id: "d7", name: "Cashier" },
    { id: "d8", name: "Records" },
    { id: "d9", name: "Accounts" },
    { id: "d10", name: "Management" },
    { id: "d11", name: "Eye Clinic" }
  ];
  for (const d of departments) {
    await pool.query('INSERT INTO zmc_departments (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name', [d.id, d.name]);
  }

  const roles = [
    "Administrator", "Doctor", "Nurse", "Pharmacist", "Laboratory Scientist", "Cashier", "Receptionist", "Records Officer", "Accountant", "Management"
  ];
  for (let i = 0; i < roles.length; i++) {
    await pool.query('INSERT INTO zmc_roles (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name', [`r${i + 1}`, roles[i]]);
  }

  const permissions = [
    "register_patient", "record_vitals", "add_consultation", "order_lab", "fill_pharmacy", "collect_payment", "admin_portal"
  ];
  for (let i = 0; i < permissions.length; i++) {
    await pool.query('INSERT INTO zmc_permissions (id, name) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name', [`p${i + 1}`, permissions[i]]);
  }

  console.log('Seeding baseline users...');
  const defaultUsers = [
    {
      id: "user-it-admin-1",
      username: "admin",
      password: "admin123",
      name: "IT Administrator",
      role: "IT Administrator",
      department: "IT",
      email: "admin@zmc.com",
      status: "Active",
      created_at: "2026-02-19 08:00:00",
      created_by: "system",
      last_login: "2026-08-18 00:18:00"
    },
    {
      id: "user-opd-clerk-2",
      username: "opd.clerk",
      password: "opd123",
      name: "OPD Clerk",
      role: "OPD Clerk",
      department: "OPD",
      email: "opd.clerk@zmc.com",
      status: "Active",
      created_at: "2026-04-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "user-cashier-3",
      username: "cashier1",
      password: "cash123",
      name: "Cashier Officer",
      role: "Cashier",
      department: "Finance",
      email: "cashier1@zmc.com",
      status: "Active",
      created_at: "2026-04-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "user-doctor-smith-4",
      username: "dr.smith",
      password: "doc123",
      name: "Dr. John Smith",
      role: "Doctor",
      department: "Medical",
      email: "dr.smith@zmc.com",
      status: "Active",
      created_at: "2026-05-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "user-lab-tech-5",
      username: "lab.tech",
      password: "lab123",
      name: "Lab Technician",
      role: "Lab Technician",
      department: "Laboratory",
      email: "lab.tech@zmc.com",
      status: "Active",
      created_at: "2026-05-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "user-pharmacist-6",
      username: "pharmacist1",
      password: "pharm123",
      name: "Pharmacist",
      role: "Pharmacist",
      department: "Pharmacy",
      email: "pharmacist1@zmc.com",
      status: "Active",
      created_at: "2026-05-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "user-head-nurse-7",
      username: "nurse1",
      password: "nurse123",
      name: "Head Nurse",
      role: "Nurse",
      department: "Nursing",
      email: "nurse1@zmc.com",
      status: "Active",
      created_at: "2026-05-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "user-accounts-8",
      username: "accounts",
      password: "acc123",
      name: "Account Officer",
      role: "Account Officer",
      department: "Finance",
      email: "accounts@zmc.com",
      status: "Active",
      created_at: "2026-06-19 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "user-hr-manager-9",
      username: "hr.manager",
      password: "hr123",
      name: "HR Manager",
      role: "HR Manager",
      department: "Human Resources",
      email: "hr.manager@zmc.com",
      status: "Active",
      created_at: "2026-06-19 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "user-eye-clinic-10",
      username: "eye.clinic",
      password: "eye123",
      name: "Eye Clinic Specialist",
      role: "Eye Clinic",
      department: "Eye Clinic",
      email: "eye.clinic@zmc.com",
      status: "Active",
      created_at: "2026-06-19 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "compat-user-accountant",
      username: "accountant",
      password: "accountant123",
      name: "Account Officer",
      role: "Account Officer",
      department: "Finance",
      email: "accountant@zmc.com",
      status: "Active",
      created_at: "2026-06-19 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "compat-user-dr-smith-legacy",
      username: "dr_smith",
      password: "password",
      name: "Dr. Alan Smith",
      role: "Doctor",
      department: "Medical",
      email: "dr_smith@zmc.com",
      status: "Active",
      created_at: "2026-05-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "compat-user-nurse-jane",
      username: "nurse_jane",
      password: "password",
      name: "Nurse Jane Doe",
      role: "Nurse",
      department: "Nursing",
      email: "jane@zmc.com",
      status: "Active",
      created_at: "2026-05-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "compat-user-lab-tech",
      username: "lab_tech",
      password: "password",
      name: "John Doe (Lab Tech)",
      role: "Lab Technician",
      department: "Laboratory",
      email: "johnson@zmc.com",
      status: "Active",
      created_at: "2026-05-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "compat-user-pharmacist",
      username: "pharmacist",
      password: "password",
      name: "Mary Green (Pharmacist)",
      role: "Pharmacist",
      department: "Pharmacy",
      email: "mary@zmc.com",
      status: "Active",
      created_at: "2026-05-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "compat-user-opd-reg",
      username: "opd_registrar",
      password: "password",
      name: "Grace Okafor (OPD Registrar)",
      role: "OPD Clerk",
      department: "OPD",
      email: "opd@zmc.com",
      status: "Active",
      created_at: "2026-04-20 08:00:00",
      created_by: "admin",
      last_login: null
    },
    {
      id: "compat-user-iclinic",
      username: "iclinic",
      password: "password",
      name: "Dr. Clara Vance (Eye Clinic)",
      role: "Eye Clinic",
      department: "Eye Clinic",
      email: "iclinic@zmc.com",
      status: "Active",
      created_at: "2026-06-19 08:00:00",
      created_by: "admin",
      last_login: null
    }
  ];

  for (const u of defaultUsers) {
    const hashed = bcrypt.hashSync(u.password, 10);
    await pool.query(`
      INSERT INTO zmc_users (id, username, password, name, role, department, email, status, created_at, created_by, last_login)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, department = EXCLUDED.department, status = 'Active', name = EXCLUDED.name
    `, [u.id, u.username, hashed, u.name, u.role, u.department, u.email, u.status, u.created_at, u.created_by, u.last_login]);
  }

  console.log('Seeding patients...');
  const patients = [
    {
      id: "p-001",
      hospitalNumber: "ZMC-2026-0001",
      name: "Chinedu Okafor",
      dateOfBirth: "1988-05-12",
      gender: "Male",
      phoneNumber: "08031234567",
      address: "12 Ogbor Hill Road, Aba",
      maritalStatus: "Married",
      cardType: "Standard",
      cardFee: 3000,
      status: "Discharged",
      registeredBy: "opd_registrar",
      registrationDate: "2026-06-29T08:00:00.000Z",
      vitals: {
        bloodPressure: "120/80",
        temperature: 36.8,
        pulseRate: 72,
        respiratoryRate: 18,
        spo2: 98,
        weight: 74,
        height: 180
      },
      maternityDetails: null,
      emergencyDetails: null
    },
    {
      id: "p-002",
      hospitalNumber: "ZMC-2026-0002",
      name: "Amara Nwachukwu",
      dateOfBirth: "1994-11-23",
      gender: "Female",
      phoneNumber: "08169876543",
      address: "45 Azikiwe Road, Aba",
      maritalStatus: "Single",
      cardType: "Maternity",
      cardFee: 5000,
      status: "Waiting for Doctor",
      registeredBy: "opd_registrar",
      registrationDate: "2026-06-29T08:30:00.000Z",
      vitals: {
        bloodPressure: "115/75",
        temperature: 37.1,
        pulseRate: 78,
        respiratoryRate: 19,
        spo2: 99,
        weight: 68,
        height: 165
      },
      maternityDetails: {
        gravida: "2",
        para: "1",
        lmp: "2025-10-15",
        edd: "2026-07-22",
        gestationalAge: "36 weeks",
        tribe: "Igbo",
        occupation: "Teacher"
      },
      emergencyDetails: null
    },
    {
      id: "p-003",
      hospitalNumber: "ZMC-2026-0003",
      name: "Olumide Bakare",
      dateOfBirth: "1982-03-15",
      gender: "Male",
      phoneNumber: "08055551234",
      address: "88 Herbert Macaulay Way, Yaba, Lagos",
      maritalStatus: "Married",
      cardType: "Emergency",
      cardFee: 22000,
      status: "Waiting for Doctor",
      registeredBy: "opd_registrar",
      registrationDate: "2026-06-29T09:15:00.000Z",
      vitals: {
        bloodPressure: "145/95",
        temperature: 36.5,
        pulseRate: 98,
        respiratoryRate: 24,
        spo2: 95,
        weight: 85,
        height: 178
      },
      maternityDetails: null,
      emergencyDetails: {
        isSickEmergency: false,
        isUnbookedLabour: false,
        isAccident: true,
        isDoctorOnCall: true,
        isAfterHours: false,
        customDetails: "RTA (Road Traffic Accident) victim with multiple soft tissue lacerations and suspected clavicle fracture."
      }
    },
    {
      id: "p-004",
      hospitalNumber: "ZMC-2026-0004",
      name: "Fatima Musa",
      dateOfBirth: "1997-07-04",
      gender: "Female",
      phoneNumber: "07039998811",
      address: "10 Gombe Street, Wuse II, Abuja",
      maritalStatus: "Married",
      cardType: "Maternity",
      cardFee: 5000,
      status: "Triage Pending",
      registeredBy: "nurse_jane",
      registrationDate: "2026-06-29T09:40:00.000Z",
      vitals: null,
      maternityDetails: {
        gravida: "3",
        para: "2",
        lmp: "2025-12-05",
        edd: "2026-09-11",
        gestationalAge: "29 weeks",
        tribe: "Hausa",
        occupation: "Trader"
      },
      emergencyDetails: null
    },
    {
      id: "p-005",
      hospitalNumber: "ZMC-2026-0005",
      name: "Emeka Obi",
      dateOfBirth: "1991-09-30",
      gender: "Male",
      phoneNumber: "08064443322",
      address: "14 Milverton Avenue, Aba",
      maritalStatus: "Single",
      cardType: "Standard",
      cardFee: 3000,
      status: "Triage Pending",
      registeredBy: "opd_registrar",
      registrationDate: "2026-06-29T10:10:00.000Z",
      vitals: null,
      maternityDetails: null,
      emergencyDetails: null
    },
    {
      id: "p-006",
      hospitalNumber: "ZMC-2026-0006",
      name: "Chioma Uzor",
      dateOfBirth: "1993-02-18",
      gender: "Female",
      phoneNumber: "08123334455",
      address: "33 Faulks Road, Aba",
      maritalStatus: "Married",
      cardType: "Maternity",
      cardFee: 5000,
      status: "Discharged",
      registeredBy: "opd_registrar",
      registrationDate: "2026-06-28T14:20:00.000Z",
      vitals: {
        bloodPressure: "110/70",
        temperature: 36.7,
        pulseRate: 74,
        respiratoryRate: 16,
        spo2: 100,
        weight: 71,
        height: 162
      },
      maternityDetails: {
        gravida: "1",
        para: "0",
        lmp: "2025-09-10",
        edd: "2026-06-17",
        gestationalAge: "41 weeks",
        tribe: "Igbo",
        occupation: "Civil Servant"
      },
      emergencyDetails: null
    }
  ];

  for (const p of patients) {
    await pool.query(`
      INSERT INTO zmc_patients (
        id, hospital_number, name, date_of_birth, gender, phone_number, address,
        marital_status, card_type, card_fee, status, registered_by, registration_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      p.id, p.hospitalNumber, p.name, p.dateOfBirth, p.gender, p.phoneNumber, p.address,
      p.maritalStatus, p.cardType, p.cardFee, p.status, p.registeredBy, p.registrationDate
    ]);

    if (p.vitals) {
      await pool.query(`
        INSERT INTO zmc_patient_vitals (
          id, patient_id, blood_pressure, temperature, pulse_rate, respiratory_rate, spo2, weight, height
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        generateUUID(),
        p.id,
        p.vitals.bloodPressure || null,
        p.vitals.temperature !== undefined ? p.vitals.temperature : null,
        p.vitals.pulseRate !== undefined ? p.vitals.pulseRate : null,
        p.vitals.respiratoryRate !== undefined ? p.vitals.respiratoryRate : null,
        p.vitals.spo2 !== undefined ? p.vitals.spo2 : null,
        p.vitals.weight !== undefined ? p.vitals.weight : null,
        p.vitals.height !== undefined ? p.vitals.height : null
      ]);
    }

    if (p.maternityDetails) {
      await pool.query(`
        INSERT INTO zmc_maternity_records (
          id, patient_id, gravida, para, lmp, edd, gestational_age, tribe, occupation
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        generateUUID(),
        p.id,
        p.maternityDetails.gravida || null,
        p.maternityDetails.para || null,
        p.maternityDetails.lmp || null,
        p.maternityDetails.edd || null,
        p.maternityDetails.gestationalAge || null,
        p.maternityDetails.tribe || null,
        p.maternityDetails.occupation || null
      ]);
    }

    if (p.emergencyDetails) {
      await pool.query(`
        INSERT INTO zmc_emergency_records (
          id, patient_id, is_sick_emergency, is_unbooked_labour, is_accident, is_doctor_on_call, is_after_hours, custom_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        generateUUID(),
        p.id,
        !!p.emergencyDetails.isSickEmergency,
        !!p.emergencyDetails.isUnbookedLabour,
        !!p.emergencyDetails.isAccident,
        !!p.emergencyDetails.isDoctorOnCall,
        !!p.emergencyDetails.isAfterHours,
        p.emergencyDetails.customDetails || null
      ]);
    }
  }

  console.log('Seeding wards and beds...');
  const wards = [
    { id: "w1", name: "Male Ward", type: "General" },
    { id: "w2", name: "Female Ward", type: "General" },
    { id: "w3", name: "Pediatric Ward", type: "Specialized" },
    { id: "w4", name: "Maternity Ward", type: "Specialized" }
  ];
  for (const w of wards) {
    await pool.query('INSERT INTO zmc_wards (id, name, type) VALUES ($1, $2, $3)', [w.id, w.name, w.type]);
  }

  const beds = [
    { id: "b1", wardId: "w1", number: "M-01", status: "Available" },
    { id: "b2", wardId: "w1", number: "M-02", status: "Available" },
    { id: "b3", wardId: "w2", number: "F-01", status: "Available" },
    { id: "b4", wardId: "w2", number: "F-02", status: "Available" }
  ];
  for (const b of beds) {
    await pool.query('INSERT INTO zmc_beds (id, ward_id, number, status) VALUES ($1, $2, $3, $4)', [b.id, b.wardId, b.number, b.status]);
  }

  console.log('Seeding clinical inventory...');
  const inventoryItems = [
    { id: "i1", name: "Paracetamol 500mg Tablets", category: "Drug", quantity: 1500, price: 50 },
    { id: "i2", name: "Amoxicillin 250mg Capsules", category: "Drug", quantity: 950, price: 120 },
    { id: "i3", name: "Artemether/Lumefantrine (ACT)", category: "Drug", quantity: 600, price: 800 },
    { id: "i4", name: "Metronidazole 400mg Tablets", category: "Drug", quantity: 1000, price: 80 },
    { id: "i5", name: "Ciprofloxacin 500mg Tablets", category: "Drug", quantity: 450, price: 250 }
  ];
  for (const i of inventoryItems) {
    await pool.query('INSERT INTO zmc_inventory (id, name, category, quantity, price) VALUES ($1, $2, $3, $4, $5)', [i.id, i.name, i.category, i.quantity, i.price]);
  }

  console.log('Seeding clinical audit logs...');
  const baseTime = new Date();
  const auditLogs = [
    {
      id: "LOG-SEED-01",
      timestamp: new Date(baseTime.getTime() - 1000 * 60 * 180).toISOString(),
      userId: "admin",
      userName: "System Administrator",
      userRole: "Administrator",
      action: "DATABASE_SEED",
      details: "Clinical database successfully initialized and populated with comprehensive master data, baseline users, and medical registries.",
      ipAddress: "127.0.0.1"
    },
    {
      id: "LOG-SEED-02",
      timestamp: new Date(baseTime.getTime() - 1000 * 60 * 150).toISOString(),
      userId: "opd_registrar",
      userName: "OPD Registrar Sarah",
      userRole: "OPD",
      action: "USER_LOGIN",
      details: "OPD Staff session initiated successfully from desktop workstation 04.",
      ipAddress: "192.168.1.104"
    },
    {
      id: "LOG-SEED-03",
      timestamp: new Date(baseTime.getTime() - 1000 * 60 * 140).toISOString(),
      userId: "opd_registrar",
      userName: "OPD Registrar Sarah",
      userRole: "OPD",
      action: "PATIENT_REGISTERED",
      details: "Registered Maternity patient 'Amara Nwachukwu' with hospital number ZMC-2026-0002. Collected Maternity card fee (N5,000).",
      ipAddress: "192.168.1.104"
    }
  ];

  for (const l of auditLogs) {
    await pool.query(`
      INSERT INTO zmc_audit_logs (id, timestamp, user_id, user_name, user_role, action, details, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [l.id, l.timestamp, l.userId, l.userName, l.userRole, l.action, l.details, l.ipAddress]);
  }

  console.log('Seeding clinical invoices, payments, and appointments...');
  // Seed invoices
  const invoices = [
    {
      id: "inv-001",
      patientId: "p-001",
      amount: 3000.00,
      status: "Paid",
      description: "Standard OPD Card Fee + Consult"
    },
    {
      id: "inv-002",
      patientId: "p-002",
      amount: 5000.00,
      status: "Paid",
      description: "Maternity Registration Card Fee"
    }
  ];
  for (const inv of invoices) {
    await pool.query(`
      INSERT INTO zmc_invoices (id, patient_id, amount, status, description)
      VALUES ($1, $2, $3, $4, $5)
    `, [inv.id, inv.patientId, inv.amount, inv.status, inv.description]);
  }

  // Seed payments
  const payments = [
    {
      id: "pay-001",
      patientId: "p-001",
      invoiceId: "inv-001",
      amount: 3000.00,
      status: "Completed",
      datePaid: new Date(baseTime.getTime() - 1000 * 60 * 180).toISOString(),
      paymentMethod: "Cash",
      collectedBy: "6f08da62-6666-4444-8888-666666666666" // Beatrice Cashier
    },
    {
      id: "pay-002",
      patientId: "p-002",
      invoiceId: "inv-002",
      amount: 5000.00,
      status: "Completed",
      datePaid: new Date(baseTime.getTime() - 1000 * 60 * 120).toISOString(),
      paymentMethod: "POS",
      collectedBy: "user-cashier-3" // Cashier Officer
    }
  ];
  for (const pay of payments) {
    await pool.query(`
      INSERT INTO zmc_payments (id, patient_id, invoice_id, amount, status, date_paid, payment_method, collected_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [pay.id, pay.patientId, pay.invoiceId, pay.amount, pay.status, pay.datePaid, pay.paymentMethod, pay.collectedBy]);
  }

  // Seed appointments
  const appointments = [
    {
      id: "apt-001",
      patientId: "p-001",
      doctorId: "user-doctor-smith-4", // Dr. John Smith
      date: "2026-06-29",
      time: "10:30",
      status: "Completed",
      reason: "Severe fever and body pain",
      type: "First Visit"
    },
    {
      id: "apt-002",
      patientId: "p-002",
      doctorId: "user-doctor-smith-4", // Dr. John Smith
      date: "2026-06-30",
      time: "09:00",
      status: "Scheduled",
      reason: "Maternity Routine Prenatal Checkup",
      type: "Follow-up"
    }
  ];
  for (const apt of appointments) {
    await pool.query(`
      INSERT INTO zmc_appointments (id, patient_id, doctor_id, date, time, status, reason, type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [apt.id, apt.patientId, apt.doctorId, apt.date, apt.time, apt.status, apt.reason, apt.type]);
  }

  await refreshCache();

  return {
    success: true,
    patientsCount: patients.length,
    inventoryCount: inventoryItems.length,
    auditLogsCount: auditLogs.length,
    postgresSynced: true
  };
}
