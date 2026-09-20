import React, { useState, useEffect } from 'react';
import { apiFetch, socketManager } from '../utils/api';
import ExportButton from './ExportButton';
import { 
  UserCheck, 
  Search, 
  Activity, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  Layers, 
  PlusCircle, 
  Printer, 
  HeartHandshake,
  Check,
  Building2,
  Bookmark,
  ChevronRight,
  Users,
  Loader2,
  FlaskConical,
  Lock,
  History,
  Eye,
  Pill,
  Stethoscope,
  Receipt,
  LogOut,
  Save,
  BedDouble,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DoctorSpecializedDirectory from './DoctorSpecializedDirectory';

// Lab tests catalog matching exact user requests & pricing spec
const CHEMISTRY_TESTS = [
  { name: 'Liver Function Test (LFT)', price: 15000 },
  { name: 'Electrolyte, Urea, Creatinine (E/U/C)', price: 15000 },
  { name: 'Lipid Profile', price: 15000 },
  { name: 'Prostate Specific Antigen (PSA)', price: 18000 },
  { name: 'Cholesterol', price: 7000 },
  { name: 'Random Blood Sugar (RBS)', price: 1500 },
  { name: 'Fasting Blood Sugar (FBS)', price: 1500 },
  { name: 'Full Blood Count (FBC)', price: 7000 },
  { name: 'Hormonal Assay', price: 60000 },
  { name: 'HbA1c (Glycated Sugar)', price: 7000 },
  { name: 'Urine Analysis (UA)', price: 2500 },
  { name: 'Faecal Occult Blood Test (FOB)', price: 3000 },
  { name: 'Pregnancy Test – PT (HCG)', price: 2500 }
];

const SEROLOGY_TESTS = [
  { name: 'Widal Test', price: 7000 },
  { name: 'Hepatitis B (HBsAg)', price: 3500 },
  { name: 'Hepatitis C (HCV)', price: 3500 },
  { name: 'VDRL (Syphilis)', price: 3500 },
  { name: 'Retroviral Screening (RVS)', price: 5000 }
];

const HAEMATOLOGY_TESTS = [
  { name: 'Blood Percentage (HB)', price: 1500 },
  { name: 'Blood Group (BG)', price: 4000 },
  { name: 'Genotype (GT)', price: 8000 }
];

const MICROBIOLOGY_TESTS = [
  { name: 'EAR SWAB M/C/S', price: 7000 },
  { name: 'HVS M/C/S', price: 7000 },
  { name: 'Urine M/C/S', price: 7000 },
  { name: 'Pus Swab M/C/S', price: 10000 },
  { name: 'Semen Culture M/C/S', price: 15000 },
  { name: 'Urethral Swab M/C/S', price: 7000 },
  { name: 'Stool Culture M/C/S', price: 15000 },
  { name: 'Sputum M/C/S', price: 10000 },
  { name: 'H. pylori (HP)', price: 5000 }
];

const PARASITOLOGY_TESTS = [
  { name: 'Stool Analysis', price: 5000 },
  { name: 'Microfilaria (MF)', price: 5000 },
  { name: 'Malaria Parasite (MP)', price: 3000 }
];

// Medications Catalog
const MEDICATIONS_CATALOG = [
  'Paracetamol 500mg',
  'Amoxicillin 500mg',
  'Ciprofloxacin 500mg',
  'Artemether/Lumefantrine (Coartem)',
  'Ibuprofen 400mg',
  'Metronidazole 400mg',
  'Multivitamin caps',
  'Folic Acid 5mg',
  'Labetalol 100mg',
  'Methyldopa 250mg'
];

// Injections Catalog
const INJECTIONS_CATALOG = [
  'Ceftriaxone IV 1g',
  'Magnesium Sulphate 50% inj',
  'Artesunate IV 60mg',
  'Hydralazine IV 20mg',
  'Oxytocin 10 IU',
  'Diclofenac IM 75mg',
  'Promethazine IM 50mg'
];

// Initial outpatient list
const INITIAL_OUTPATIENTS = [];

// Initial Admitted Patients list
const INITIAL_ADMITTED = [
  {
    id: 'MAT-4003',
    name: 'Adaeze Onyema',
    hospitalNumber: 'MAT-4003',
    gender: 'Female',
    dateOfBirth: '2000-02-14',
    ward: 'Maternity Ward',
    bed: 'M-3',
    admittedDate: '12/07/2026, 14:00:00',
    dischargeBill: 18000,
    totalCharged: 18000,
    paymentsMade: 15000,
    since: '12/07/2026',
    department: 'Maternity',
    religion: 'Christianity',
    edd: '2026-06-17',
    gravidaPara: 'G1 P0',
    notes: 'G1P0 in active phase of labour at 40 weeks gestation. Monitoring with partograph. Mild pre-eclampsia watch – BP elevated.',
    doctorOrders: '1. Strict 4-hourly blood pressure and maternal pulse charting.\n2. Continue IV Magnesium Sulphate maintenance infusion.\n3. Continuous fetal heart rate auscultation every 30 minutes.\n4. Call Obstetrician on-call if diastolic BP exceeds 100 mmHg.',
    doctorOrdersHistory: [
      {
        id: 'DORD-001',
        orderText: 'Loading dose of IV Magnesium Sulphate 4g slowly over 15 mins. Check deep tendon reflexes before maintenance.',
        doctorName: 'Dr. Emeka Eze',
        timestamp: '12/07/2026, 16:30:00'
      },
      {
        id: 'DORD-002',
        orderText: 'Maintain strict fluid balance chart. Monitor urinary output hourly (>30ml/hr).',
        doctorName: 'Dr. Emeka Eze',
        timestamp: '13/07/2026, 04:15:00'
      }
    ],
    vitalsRecords: [
      {
        timestamp: '13/07/2026, 04:00:00',
        recordedBy: 'Nurse Faith',
        bp: '142/94',
        hr: '88',
        temp: '37.2°C',
        rr: '20',
        spo2: '97%'
      },
      {
        timestamp: '12/07/2026, 14:30:00',
        recordedBy: 'Nurse Chioma',
        bp: '140/92',
        hr: '86',
        temp: '37.1°C',
        rr: '19',
        spo2: '98%'
      }
    ],
    medicationsRecords: [
      {
        id: 'MED-401',
        name: 'LABETALOL 100mg',
        dose: '100mg',
        quantity: '1 tab',
        frequency: 'BD',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Faith',
        administeredAt: '13/07/2026, 04:10:00',
        timestamp: '13/07/2026, 04:00:00',
        note: 'BP 142/94 – administered orally with water'
      },
      {
        id: 'MED-402',
        name: 'MAGNESIUM SULPHATE',
        dose: '4g IV in 20ml',
        quantity: '1 vial',
        frequency: 'STAT',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Chioma',
        administeredAt: '12/07/2026, 17:05:00',
        timestamp: '12/07/2026, 17:00:00',
        note: 'Loading dose given slow IV'
      },
      {
        id: 'MED-403',
        name: 'LABETALOL 100mg',
        dose: '100mg',
        quantity: '1 tab',
        frequency: 'BD',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Chioma',
        administeredAt: '12/07/2026, 16:15:00',
        timestamp: '12/07/2026, 16:00:00',
        note: 'BP was 138/90 before dose'
      }
    ],
    observationsRecords: [
      {
        id: 'OBS-401',
        category: 'Complaint',
        timestamp: '13/07/2026, 04:30:00',
        note: 'Patient reports increasing lower back pain. Cervical dilation now 7cm. Contractions every 3 minutes.',
        recordedBy: 'Nurse Faith'
      },
      {
        id: 'OBS-402',
        category: 'General',
        timestamp: '12/07/2026, 16:30:00',
        note: 'Patient anxious. Explained procedure and provided reassurance. Fetal heart rate 142 bpm, regular.',
        recordedBy: 'Nurse Chioma'
      }
    ],
    chargesList: [
      { item: 'Maternity Ward Admission & Bed Fee (2 Nights)', amount: 12000, timestamp: '12/07/2026, 14:00:00' },
      { item: 'Nursing Care & Delivery Suite Monitoring', amount: 3500, timestamp: '12/07/2026, 14:00:00' },
      { item: 'Med: Magnesium Sulphate IV Loading', amount: 2500, timestamp: '12/07/2026, 17:00:00' }
    ],
    newOrdersList: [
      {
        id: 'ORD-901',
        type: 'Medication',
        target: 'PHARMACY',
        description: 'Medications: LABETALOL 100mg (100mg) - Qty: 6 tabs, Freq: BD. Notes: Maternal antihypertensive cover',
        notes: 'Maternal antihypertensive cover',
        status: 'Accepted',
        timestamp: '12/07/2026, 15:30:00'
      }
    ]
  },
  {
    id: 'ADM-5001',
    name: 'Victor Okoye',
    hospitalNumber: 'ADM-5001',
    gender: 'Male',
    dateOfBirth: '1982-11-10',
    ward: 'General Ward',
    bed: 'G-5',
    admittedDate: '10/07/2026, 10:30:00',
    dischargeBill: 25000,
    totalCharged: 25000,
    paymentsMade: 20000,
    since: '10/07/2026',
    department: 'General Medicine',
    religion: 'Christianity',
    edd: '—',
    gravidaPara: '—',
    notes: 'Severe acute Plasmodium falciparum malaria under treatment with IV Artesunate. General symptoms improving, afebrile.',
    doctorOrders: '1. Complete full 3-dose course of IV Artesunate (0h, 12h, 24h).\n2. Switch to oral ACT (Artemether/Lumefantrine) when tolerating orally.\n3. Repeat blood film for malaria parasites in 48 hours.\n4. Encourage high fluid intake and light diet.',
    doctorOrdersHistory: [
      {
        id: 'DORD-011',
        orderText: 'Start IV Artesunate 60mg STAT then at 12h and 24h. Rehydrate with 1L Normal Saline.',
        doctorName: 'Dr. Emeka Eze',
        timestamp: '10/07/2026, 10:45:00'
      }
    ],
    vitalsRecords: [
      {
        timestamp: '13/07/2026, 08:00:00',
        recordedBy: 'Nurse Faith',
        bp: '120/80',
        hr: '76',
        temp: '36.9°C',
        rr: '18',
        spo2: '99%'
      },
      {
        timestamp: '11/07/2026, 08:00:00',
        recordedBy: 'Nurse Chioma',
        bp: '122/82',
        hr: '84',
        temp: '38.4°C',
        rr: '20',
        spo2: '97%'
      }
    ],
    medicationsRecords: [
      {
        id: 'MED-501',
        name: 'Artesunate IV 60mg',
        dose: '60mg',
        quantity: '1 vial',
        frequency: 'STAT',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Chioma',
        administeredAt: '10/07/2026, 11:15:00',
        timestamp: '10/07/2026, 11:00:00',
        note: 'First dose administered STAT'
      },
      {
        id: 'MED-502',
        name: 'Paracetamol IV 1g',
        dose: '1g',
        quantity: '1 bottle',
        frequency: 'TDS',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Chioma',
        administeredAt: '10/07/2026, 11:30:00',
        timestamp: '10/07/2026, 11:15:00',
        note: 'For high grade pyrexia'
      }
    ],
    observationsRecords: [
      {
        id: 'OBS-501',
        category: 'General',
        timestamp: '11/07/2026, 09:00:00',
        note: 'Patient sleeping comfortably. Fever settled.',
        recordedBy: 'Nurse Chioma'
      },
      {
        id: 'OBS-502',
        category: 'Doctor Round',
        timestamp: '12/07/2026, 11:00:00',
        note: 'Jaundice regressing, appetite improving. Patient ambulating well without dizziness.',
        recordedBy: 'Dr. Emeka Eze'
      }
    ],
    chargesList: [
      { item: 'General Ward Bed Fee (3 Nights)', amount: 15000, timestamp: '10/07/2026, 10:30:00' },
      { item: 'Nursing Care & Daily Rounds', amount: 4500, timestamp: '10/07/2026, 10:30:00' },
      { item: 'Lab Test: Malaria MP & Full Blood Count', amount: 5500, timestamp: '10/07/2026, 11:00:00' }
    ],
    newOrdersList: [
      {
        id: 'ORD-902',
        type: 'Medication',
        target: 'PHARMACY',
        description: 'Medications: Artemether/Lumefantrine (20/120mg) - Qty: 24 tabs, Freq: BD for 3 days.',
        notes: 'Transition to oral therapy',
        status: 'Processing',
        timestamp: '12/07/2026, 14:00:00'
      }
    ]
  },
  {
    id: 'ADM-5002',
    name: 'Blessing Nwosu',
    hospitalNumber: 'ADM-5002',
    gender: 'Female',
    dateOfBirth: '1995-04-04',
    ward: 'General Ward',
    bed: 'G-8',
    admittedDate: '11/07/2026, 11:15:00',
    dischargeBill: 15000,
    totalCharged: 15000,
    paymentsMade: 15000,
    since: '11/07/2026',
    department: 'Surgery',
    religion: 'Christianity',
    edd: '—',
    gravidaPara: '—',
    notes: 'Post-appendectomy Day 2. Patient tolerating sips of water and light porridge. Surgical wound is clean, dry, and healing well.',
    doctorOrders: '1. Continue post-op IV Ceftriaxone 1g daily.\n2. Oral Tramadol 50mg PRN for pain.\n3. Mobilize out of bed with nursing assistance.\n4. Check wound site daily for erythema or discharge.',
    doctorOrdersHistory: [
      {
        id: 'DORD-021',
        orderText: 'Strict NPO until bowel sounds return. Maintain IV 5% Dextrose Saline 1L 8-hourly.',
        doctorName: 'Dr. Emeka Eze',
        timestamp: '11/07/2026, 12:00:00'
      }
    ],
    vitalsRecords: [
      {
        timestamp: '13/07/2026, 06:00:00',
        recordedBy: 'Nurse Faith',
        bp: '115/75',
        hr: '72',
        temp: '36.7°C',
        rr: '16',
        spo2: '98%'
      },
      {
        timestamp: '12/07/2026, 06:00:00',
        recordedBy: 'Nurse Chioma',
        bp: '118/78',
        hr: '76',
        temp: '36.8°C',
        rr: '18',
        spo2: '99%'
      }
    ],
    medicationsRecords: [
      {
        id: 'MED-601',
        name: 'Ceftriaxone IV 1g',
        dose: '1g',
        quantity: '1 vial',
        frequency: 'OD',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Chioma',
        administeredAt: '12/07/2026, 08:30:00',
        timestamp: '12/07/2026, 08:00:00',
        note: 'Post-op antibiotic cover'
      },
      {
        id: 'MED-602',
        name: 'Metronidazole IV 500mg',
        dose: '500mg',
        quantity: '1 bottle',
        frequency: 'TDS',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Chioma',
        administeredAt: '12/07/2026, 09:00:00',
        timestamp: '12/07/2026, 08:00:00',
        note: 'Anaerobic prophylaxis cover'
      }
    ],
    observationsRecords: [
      {
        id: 'OBS-601',
        category: 'Complaint',
        timestamp: '12/07/2026, 18:00:00',
        note: 'Complains of mild surgical site pain on movement. Administered oral analgesics.',
        recordedBy: 'Nurse Chioma'
      },
      {
        id: 'OBS-602',
        category: 'Nursing Round',
        timestamp: '13/07/2026, 07:00:00',
        note: 'Dressing intact, no soakage. Passed flatus this morning. Bowel sounds present and active.',
        recordedBy: 'Nurse Faith'
      }
    ],
    chargesList: [
      { item: 'Surgical Ward Bed Fee (2 Nights)', amount: 10000, timestamp: '11/07/2026, 11:15:00' },
      { item: 'Post-Operative Nursing Care & Dressing', amount: 3000, timestamp: '11/07/2026, 11:15:00' },
      { item: 'Med: Ceftriaxone & Metronidazole Infusions', amount: 2000, timestamp: '11/07/2026, 12:00:00' }
    ],
    newOrdersList: [
      {
        id: 'ORD-903',
        type: 'Injection',
        target: 'NURSING',
        description: 'Injections: Diclofenac 75mg (75mg) - Qty: 1 ampoule. Notes: Give deep IM for acute pain relief',
        notes: 'Give deep IM for acute pain relief',
        status: 'Completed',
        timestamp: '12/07/2026, 18:15:00'
      }
    ]
  },
  {
    id: 'ADM-8019',
    name: 'Paschal Iroegbu',
    hospitalNumber: 'ADM-8019',
    gender: 'Male',
    dateOfBirth: '1974-08-28',
    ward: 'General Ward',
    bed: 'G-11',
    admittedDate: '13/07/2026, 16:30:00',
    dischargeBill: 30000,
    totalCharged: 30000,
    paymentsMade: 10000,
    since: '13/07/2026',
    department: 'General Medicine',
    religion: 'Christianity',
    edd: '—',
    gravidaPara: '—',
    notes: 'Hypertensive Emergency with severe throbbing headache and grade II hypertensive retinopathy. Blood pressure monitored hourly.',
    doctorOrders: '1. Strict hourly BP and HR chart. Target reduction of MAP by no more than 20% in first 24 hours.\n2. Hydralazine IV 10mg slow bolus PRN if systolic BP > 190 mmHg.\n3. Request urgent Serum Electrolytes, Urea, Creatinine, and 12-lead ECG.\n4. Low salt, cardiac diet.',
    doctorOrdersHistory: [
      {
        id: 'DORD-031',
        orderText: 'Administer IV Labetalol 20mg over 2 mins. Recheck BP in 10 mins. Repeat 40mg if needed.',
        doctorName: 'Dr. Emeka Eze',
        timestamp: '13/07/2026, 16:45:00'
      }
    ],
    vitalsRecords: [
      {
        timestamp: '13/07/2026, 17:00:00',
        recordedBy: 'Nurse Faith',
        bp: '180/110',
        hr: '94',
        temp: '36.8°C',
        rr: '22',
        spo2: '96%'
      },
      {
        timestamp: '13/07/2026, 18:00:00',
        recordedBy: 'Nurse Faith',
        bp: '165/100',
        hr: '88',
        temp: '36.7°C',
        rr: '20',
        spo2: '97%'
      }
    ],
    medicationsRecords: [
      {
        id: 'MED-801',
        name: 'Labetalol IV 20mg',
        dose: '20mg',
        quantity: '1 ampoule',
        frequency: 'STAT',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Faith',
        administeredAt: '13/07/2026, 17:10:00',
        timestamp: '13/07/2026, 17:00:00',
        note: 'Administered slow IV push. BP dropped to 165/100.'
      },
      {
        id: 'MED-802',
        name: 'Amlodipine 10mg',
        dose: '10mg',
        quantity: '1 tab',
        frequency: 'Daily (Nocte)',
        status: 'Pending',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: '',
        administeredAt: '',
        timestamp: '13/07/2026, 17:30:00',
        note: 'To start tonight at 20:00'
      }
    ],
    observationsRecords: [
      {
        id: 'OBS-801',
        category: 'Doctor Round',
        timestamp: '13/07/2026, 17:15:00',
        note: 'Headache settling following IV Labetalol. No focal neurological deficit detected.',
        recordedBy: 'Dr. Emeka Eze'
      }
    ],
    chargesList: [
      { item: 'High Dependency Admission & Bed Fee (1 Night)', amount: 20000, timestamp: '13/07/2026, 16:30:00' },
      { item: 'Critical Care Nursing & Hourly Monitoring', amount: 6000, timestamp: '13/07/2026, 16:30:00' },
      { item: 'Med: Emergency IV Antihypertensive Ampoules', amount: 4000, timestamp: '13/07/2026, 17:00:00' }
    ],
    newOrdersList: [
      {
        id: 'ORD-904',
        type: 'Lab Test',
        target: 'LABORATORY',
        description: 'Labs Ordered: CHEMISTRY: Electrolytes, Urea & Creatinine, HAEMATOLOGY: Full Blood Count. Notes: Urgent emergency workup',
        notes: 'Urgent emergency workup',
        status: 'Pending',
        timestamp: '13/07/2026, 17:05:00'
      }
    ]
  },
  {
    id: 'ADM-8020',
    name: 'Adaobi Igwe',
    hospitalNumber: 'ADM-8020',
    gender: 'Female',
    dateOfBirth: '1989-12-12',
    ward: 'General Ward',
    bed: 'G-2',
    admittedDate: '09/07/2026, 09:00:00',
    dischargeBill: 12000,
    totalCharged: 12000,
    paymentsMade: 12000,
    since: '09/07/2026',
    department: 'General Medicine',
    religion: 'Islam',
    edd: '—',
    gravidaPara: '—',
    notes: 'Acute Gastroenteritis with moderate dehydration. Successfully rehydrated with IV fluids, vomiting and diarrhea resolved.',
    doctorOrders: '1. Continue Oral Rehydration Salts (ORS) 200ml after each loose stool.\n2. Bland diet (pap, rice water, toast).\n3. Discharge on oral Ciprofloxacin 500mg BD for 5 days.',
    doctorOrdersHistory: [
      {
        id: 'DORD-041',
        orderText: 'Start 2L IV Ringer Lactate over 4 hours. IV Ondansetron 4mg STAT for emesis.',
        doctorName: 'Dr. Emeka Eze',
        timestamp: '09/07/2026, 09:15:00'
      }
    ],
    vitalsRecords: [
      {
        timestamp: '12/07/2026, 08:00:00',
        recordedBy: 'Nurse Chioma',
        bp: '110/70',
        hr: '68',
        temp: '36.5°C',
        rr: '16',
        spo2: '100%'
      },
      {
        timestamp: '09/07/2026, 09:00:00',
        recordedBy: 'Nurse Chioma',
        bp: '95/60',
        hr: '104',
        temp: '37.8°C',
        rr: '20',
        spo2: '98%'
      }
    ],
    medicationsRecords: [
      {
        id: 'MED-901',
        name: 'Ringer Lactate 1L IV',
        dose: '1L',
        quantity: '2 bags',
        frequency: 'STAT Infusion',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Chioma',
        administeredAt: '09/07/2026, 09:30:00',
        timestamp: '09/07/2026, 09:15:00',
        note: 'Rehydration bolus'
      },
      {
        id: 'MED-902',
        name: 'Ondansetron IV 4mg',
        dose: '4mg',
        quantity: '1 ampoule',
        frequency: 'STAT',
        status: 'Administered',
        orderedBy: 'Dr. Emeka Eze',
        administeredBy: 'Nurse Chioma',
        administeredAt: '09/07/2026, 09:20:00',
        timestamp: '09/07/2026, 09:15:00',
        note: 'Given for severe nausea and vomiting'
      }
    ],
    observationsRecords: [
      {
        id: 'OBS-901',
        category: 'Nursing Round',
        timestamp: '12/07/2026, 09:00:00',
        note: 'Skin turgor restored, moist mucous membranes. Patient cheerful and tolerating oral fluids.',
        recordedBy: 'Nurse Chioma'
      }
    ],
    chargesList: [
      { item: 'Ward Bed Fee (3 Nights)', amount: 8000, timestamp: '09/07/2026, 09:00:00' },
      { item: 'Nursing Care & IV Therapy Administration', amount: 2500, timestamp: '09/07/2026, 09:00:00' },
      { item: 'Med: IV Fluids & Antiemetic therapy', amount: 1500, timestamp: '09/07/2026, 09:30:00' }
    ],
    newOrdersList: []
  }
];

// Utility function to format vitals cleanly without showing minus signs on empty/dash values
const formatVital = (value: any, unit: string = '') => {
  if (value === null || value === undefined) return '—';
  const str = String(value).trim();
  if (str === '' || str === '—' || str === '-' || str === '-/-' || str === '--') return '—';
  return unit ? `${str} ${unit}` : str;
};

interface DoctorViewProps {
  activeSubTab?: 'outpatients' | 'admitted' | 'standard' | 'specialized';
  onNavigateTab?: (tab: string) => void;
}

export default function DoctorView({ activeSubTab, onNavigateTab }: DoctorViewProps = {}) {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('zmc_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (err) {
        console.error("Error parsing logged in user:", err);
      }
    }
  }, []);

  const [currentTab, setCurrentTab] = useState<'outpatients' | 'admitted' | 'standard' | 'specialized'>(() => {
    return activeSubTab || 'outpatients';
  });

  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for outpatients
  const [outpatients, setOutpatients] = useState<any[]>([]);
  const [selectedPatientLabResults, setSelectedPatientLabResults] = useState<any[]>([]);
  const [isLoadingLabResults, setIsLoadingLabResults] = useState(false);
  const [selectedOutpatientId, setSelectedOutpatientId] = useState<string | null>(null);
  const [patientPastConsultations, setPatientPastConsultations] = useState<any[]>([]);
  const [isLoadingPastHistory, setIsLoadingPastHistory] = useState(false);
  const [isStartingConsultation, setIsStartingConsultation] = useState(false);
  const [isExitingConsultation, setIsExitingConsultation] = useState(false);
  
  // Medical History Modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [patientHistoryData, setPatientHistoryData] = useState<any>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'consultations' | 'vitals' | 'labs' | 'prescriptions' | 'invoices'>('consultations');

  const handleOpenPatientHistory = async (patientId: string) => {
    if (!patientId) return;
    setPatientHistoryData(null);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await apiFetch(`/patients/${patientId}/history`);
      if (res.success && res.data) {
        setPatientHistoryData(res.data);
      } else {
        setPatientHistoryData(null);
      }
    } catch (e) {
      console.error("Error fetching patient history:", e);
      setPatientHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Date filter matcher helper
  const matchesDateFilter = (timestampStr: string, filterDateStr: string) => {
    if (!filterDateStr) return true;
    if (!timestampStr) return false;
    const parts = filterDateStr.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      const dd_mm_yyyy = `${dd}/${mm}/${yyyy}`;
      const yyyy_mm_dd = `${yyyy}-${mm}-${dd}`;
      const dd_mm = `${dd}/${mm}`;
      return timestampStr.includes(dd_mm_yyyy) || timestampStr.includes(yyyy_mm_dd) || timestampStr.includes(dd_mm);
    }
    return timestampStr.includes(filterDateStr);
  };
  
  // State for admitted patients
  const [admittedPatients, setAdmittedPatients] = useState<any[]>(() => {
    const saved = localStorage.getItem('zmc_doc_admitted');
    return saved ? JSON.parse(saved) : INITIAL_ADMITTED;
  });

  // Sync admitted patients to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('zmc_doc_admitted', JSON.stringify(admittedPatients));
    } catch (e) {
      console.error('Failed to sync admitted patients to localStorage:', e);
    }
  }, [admittedPatients]);

  const [selectedAdmittedId, setSelectedAdmittedId] = useState<string | null>(null);

  // Tabs for active Admitted Patient
  const [admittedSubTab, setAdmittedSubTab] = useState<'overview' | 'vitals' | 'medications' | 'observations' | 'charges' | 'new_orders'>('overview');
  // Filters and values for Admitted record view
  const [recordDateFilter, setRecordDateFilter] = useState('');

  // Active outpatient
  const selectedOutpatient = outpatients.find(p => p.id === selectedOutpatientId);
  // Active admitted patient
  const selectedAdmitted = admittedPatients.find(p => p.id === selectedAdmittedId);

  // Synchronized inputs for Notes and Doctor Orders
  const [admittedNotesInput, setAdmittedNotesInput] = useState('');
  const [admittedDoctorOrdersInput, setAdmittedDoctorOrdersInput] = useState('');

  useEffect(() => {
    if (selectedAdmitted) {
      setAdmittedNotesInput(selectedAdmitted.notes || '');
      setAdmittedDoctorOrdersInput(selectedAdmitted.doctorOrders || '');
    } else {
      setAdmittedNotesInput('');
      setAdmittedDoctorOrdersInput('');
    }
  }, [selectedAdmittedId, selectedAdmitted?.notes, selectedAdmitted?.doctorOrders]);

  // Observations Modal & Error States
  const [obsModalOpen, setObsModalOpen] = useState(false);
  const [obsCategory, setObsCategory] = useState<'General' | 'Complaint' | 'Nursing Round' | 'Doctor Round' | 'Vitals Alert'>('Doctor Round');
  const [obsNote, setObsNote] = useState('');
  const [obsLoading, setObsLoading] = useState(false);
  const [obsError, setObsError] = useState<string | null>(null);

  // Administer Medication Modal State
  const [administerModalOpen, setAdministerModalOpen] = useState(false);
  const [selectedMedToAdminister, setSelectedMedToAdminister] = useState<any>(null);
  const [administerNote, setAdministerNote] = useState('');

  // Add Medication Log Modal State
  const [addMedLogModalOpen, setAddMedLogModalOpen] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedQuantity, setNewMedQuantity] = useState('1');
  const [newMedFrequency, setNewMedFrequency] = useState('OD');
  const [newMedStatus, setNewMedStatus] = useState<'Administered' | 'Pending' | 'Dispensed'>('Administered');
  const [newMedNote, setNewMedNote] = useState('');

  // Discharge Patient Modal State
  const [dischargeModalOpen, setDischargeModalOpen] = useState(false);
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState('');
  const [dischargeCondition, setDischargeCondition] = useState('Clinically Improved');
  const [dischargeInstructions, setDischargeInstructions] = useState('');
  const [dischargeFollowUp, setDischargeFollowUp] = useState('');

  // New Orders inputs
  const [orderType, setOrderType] = useState<'Medication' | 'Injection' | 'Lab Test'>('Medication');
  const [medOrderItems, setMedOrderItems] = useState<Array<{ name: string; dose: string; quantity: string; frequency: string }>>([
    { name: '', dose: '', quantity: '', frequency: '' }
  ]);
  const [injOrderItems, setInjOrderItems] = useState<Array<{ name: string; dose: string; quantity: string }>>([
    { name: '', dose: '', quantity: '' }
  ]);
  const [labOrderTests, setLabOrderTests] = useState<{ [key: string]: string }>({
    CHEMISTRY: '',
    SEROLOGY: '',
    HAEMATOLOGY: '',
    MICROBIOLOGY: '',
    PARASITOLOGY: ''
  });
  const [orderNotes, setOrderNotes] = useState('');

  // Outpatient prescription inputs as dynamic rows
  const [prescriptionRows, setPrescriptionRows] = useState<Array<{
    id: string;
    name: string;
    dose: string;
    frequency: string;
    duration: string;
  }>>([
    { id: 'initial-1', name: '', dose: '', frequency: '', duration: '' }
  ]);

  useEffect(() => {
    if (selectedOutpatientId) {
      const p = outpatients.find(pat => pat.id === selectedOutpatientId);
      if (p && p.prescribedMedications && p.prescribedMedications.length > 0) {
        setPrescriptionRows(p.prescribedMedications.map((m: any) => ({
          id: m.id || Math.random().toString(),
          name: m.name || '',
          dose: m.dose || '',
          frequency: m.frequency || '',
          duration: m.duration || ''
        })));
      } else {
        setPrescriptionRows([{ id: Math.random().toString(), name: '', dose: '', frequency: '', duration: '' }]);
      }
    } else {
      setPrescriptionRows([{ id: Math.random().toString(), name: '', dose: '', frequency: '', duration: '' }]);
    }
  }, [selectedOutpatientId]);

  const handleAddMedicationRow = () => {
    setPrescriptionRows(prev => [
      ...prev,
      { id: Math.random().toString(), name: '', dose: '', frequency: '', duration: '' }
    ]);
  };

  const handleRemoveMedicationRow = (id: string) => {
    setPrescriptionRows(prev => {
      const updated = prev.filter(row => row.id !== id);
      const final = updated.length > 0 ? updated : [{ id: Math.random().toString(), name: '', dose: '', frequency: '', duration: '' }];
      
      if (selectedOutpatientId) {
        const validMeds = final
          .filter(row => row.name.trim() !== '')
          .map(row => ({
            id: row.id,
            name: row.name,
            dose: row.dose || '',
            frequency: row.frequency || '',
            duration: row.duration || '',
            timestamp: new Date().toLocaleString()
          }));

        setOutpatients(old => old.map(p => {
          if (p.id === selectedOutpatientId) {
            return {
              ...p,
              prescribedMedications: validMeds
            };
          }
          return p;
        }));
      }
      
      return final;
    });
  };

  const handleUpdateMedicationRow = (id: string, field: 'name' | 'dose' | 'frequency' | 'duration', value: string) => {
    setPrescriptionRows(prev => {
      const updated = prev.map(row => row.id === id ? { ...row, [field]: value } : row);
      
      if (selectedOutpatientId) {
        const validMeds = updated
          .filter(row => row.name.trim() !== '')
          .map(row => ({
            id: row.id,
            name: row.name,
            dose: row.dose || '',
            frequency: row.frequency || '',
            duration: row.duration || '',
            timestamp: new Date().toLocaleString()
          }));

        setOutpatients(old => old.map(p => {
          if (p.id === selectedOutpatientId) {
            return {
              ...p,
              prescribedMedications: validMeds
            };
          }
          return p;
        }));
      }
      
      return updated;
    });
  };

  const [isCompleting, setIsCompleting] = useState(false);
  const [isRefreshingQueue, setIsRefreshingQueue] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  const fetchDbQueue = async () => {
    setIsRefreshingQueue(true);
    try {
      const response = await apiFetch('/patients/opd/queue');
      if (response.success) {
        const rawFiltered = response.data.filter((q: any) => 
          (q.queue_type === 'Doctor Consultation' || 
           q.queue_type === 'Cashier Consultation Payment' || 
           q.queue_type === 'Nursing Front-Desk' || 
           q.queue_type === 'Eye Clinic Consultation') && 
          (q.status === 'Waiting' || q.status === 'Processing')
        );

        // Deduplicate items by patient_id, prioritizing Doctor Consultation > Processing
        const getPriorityScore = (q: any) => {
          let score = 0;
          if (q.queue_type === 'Doctor Consultation' || q.queue_type === 'Eye Clinic Consultation') score += 10;
          if (q.status === 'Processing') score += 5;
          return score;
        };

        const uniqueByPatientMap = new Map<string, any>();
        for (const item of rawFiltered) {
          const pid = item.patient_id;
          if (!uniqueByPatientMap.has(pid)) {
            uniqueByPatientMap.set(pid, item);
          } else {
            const existing = uniqueByPatientMap.get(pid);
            if (getPriorityScore(item) > getPriorityScore(existing)) {
              uniqueByPatientMap.set(pid, item);
            }
          }
        }
        const deduplicatedQueue = Array.from(uniqueByPatientMap.values());

        const dbOutpatients = deduplicatedQueue.map((q: any) => {
            let age = '';
            if (q.date_of_birth) {
              const birth = new Date(q.date_of_birth);
              const ageDiff = Date.now() - birth.getTime();
              const ageDate = new Date(ageDiff);
              age = String(Math.abs(ageDate.getUTCFullYear() - 1970));
            }

            const isAwaitingPayment = q.queue_type === 'Cashier Consultation Payment';
            const isNursingQueue = q.queue_type === 'Nursing Front-Desk';

            return {
              id: q.patient_id,
              encounterId: q.encounter_id,
              queueId: q.id,
              isDbPatient: true,
              name: q.patient_name,
              hospitalNumber: q.hospital_number,
              gender: q.gender || 'Unknown',
              phoneNumber: q.phone_number || '—',
              email: q.email || '—',
              address: q.address || '—',
              maritalStatus: q.marital_status || '—',
              cardType: q.card_type || 'Standard',
              patientCategory: q.patient_category || 'Individual',
              dateOfBirth: q.date_of_birth ? new Date(q.date_of_birth).toISOString().split('T')[0] : '—',
              registeredAt: q.registered_at ? new Date(q.registered_at).toLocaleString() : '—',
              age: age || '—',
              attendingDoctor: q.doctor_on_call_name || currentUser?.username || 'Consulting Doctor',
              nextOfKinName: q.next_of_kin_name || '—',
              nextOfKinPhone: q.next_of_kin_phone || '—',
              nextOfKinRelationship: q.next_of_kin_relationship || '—',
              vitals: {
                bloodPressure: q.blood_pressure || null,
                pulseRate: q.pulse_rate || null,
                temperature: q.temperature || null,
                weight: q.weight || null,
                respiratoryRate: q.respiratory_rate || null,
                spo2: q.spo2 || null,
                height: q.height || null,
              },
              maternityDetails: q.card_type === 'Maternity' || q.gravida ? {
                gravida: q.gravida || '0',
                para: q.para || '0',
                lmp: q.lmp ? new Date(q.lmp).toISOString().split('T')[0] : '—',
                edd: q.edd ? new Date(q.edd).toISOString().split('T')[0] : '—',
                gestationalAge: q.gestational_age || '—',
                tribe: q.tribe || '—',
                occupation: q.occupation || '—',
                abortion: q.abortion || '0',
                premature: q.premature || '0',
              } : null,
              emergencyDetails: q.card_type === 'Emergency' || q.is_sick_emergency ? {
                isSickEmergency: q.is_sick_emergency,
                isUnbookedLabour: q.is_unbooked_labour,
                isAccident: q.is_accident,
                totalBillAmount: q.total_bill_amount,
                cashCollected: q.cash_collected,
                doctorOnCallName: q.doctor_on_call_name,
                customDetails: q.custom_details,
                broughtInByName: q.brought_in_by_name || '—',
                broughtInByPhone: q.brought_in_by_phone || '—',
                broughtInByRelationship: q.brought_in_by_relationship || '—',
                broughtInByIdType: q.brought_in_by_id_type || '—',
                broughtInByIdNumber: q.brought_in_by_id_number || '—',
              } : null,
              status: isAwaitingPayment 
                ? 'IN CASHIER DEPT' 
                : isNursingQueue
                ? 'AWAITING CONSULTATION (Vitals Pending)'
                : (q.clinical_status?.includes('Lab Results Ready') || q.status === 'Lab Results Ready')
                ? 'LAB RESULTS READY'
                : (q.status === 'Processing' ? 'IN CONSULTATION' : 'AWAITING CONSULTATION'),
              isLabResultsReady: Boolean(q.clinical_status?.includes('Lab Results Ready') || q.status === 'Lab Results Ready'),
              isAwaitingPayment,
              processedBy: q.processed_by || null,
              isEmergency: q.priority === 'Emergency' || q.card_type === 'Emergency',
              department: q.destination_clinic || (isAwaitingPayment ? 'Cashier Dept (Payment Pending)' : 'General Outpatient'),
              notes: q.doctor_notes || q.treatment_plan || q.doctor_diagnosis || '',
              orderedTests: [] as any[],
              prescribedMedications: [] as any[],
            };
          });

        setOutpatients(prevOutpatients => {
          const prevMap = new Map(prevOutpatients.map(p => [p.id, p]));
          return dbOutpatients.map(dbP => {
            const existing: any = prevMap.get(dbP.id);
            const locallySavedNotes = localStorage.getItem(`zmc_doc_notes_${dbP.id}`);
            // Note priority: in-memory local edits > DB persisted notes > localStorage
            const notesToUse = (existing?.notes !== undefined && existing?.notes !== '')
              ? existing.notes
              : (dbP.notes || locallySavedNotes || '');

            if (existing) {
              return {
                ...dbP,
                // Preserve doctor notes typed locally or loaded from DB
                notes: notesToUse,
                // Preserve ordered lab tests selected locally
                orderedTests: existing.orderedTests && existing.orderedTests.length > 0 ? existing.orderedTests : dbP.orderedTests,
                // Preserve prescribed medications added locally
                prescribedMedications: existing.prescribedMedications && existing.prescribedMedications.length > 0 ? existing.prescribedMedications : dbP.prescribedMedications,
              };
            }
            return {
              ...dbP,
              notes: notesToUse
            };
          });
        });
      }
    } catch (err) {
      console.error('Failed to load DB queue in DoctorView:', err);
    } finally {
      setIsRefreshingQueue(false);
    }
  };

  useEffect(() => {
    fetchDbQueue();
    
    // Poll every 10 seconds for real-time queue updates
    const timer = setInterval(fetchDbQueue, 10000);

    // Subscribe to WebSocket events for real-time queue transitions
    const unsubscribe = socketManager.subscribe((msg: any) => {
      if ([
        'PAYMENT_HANDOVER_CONFIRMED',
        'PATIENT_PAYMENT_COMPLETED',
        'PATIENT_REGISTERED',
        'PATIENT_ROUTED_TO_DOCTOR',
        'LAB_RESULTS_READY'
      ].includes(msg.type)) {
        fetchDbQueue();
      }
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedOutpatient && selectedOutpatient.id) {
      const currentPatId = selectedOutpatient.id;
      setPatientPastConsultations([]);
      setSelectedPatientLabResults([]);
      setIsLoadingLabResults(true);
      setIsLoadingPastHistory(true);

      // Check if local storage or current state has notes for this patient
      const cachedLocalNote = localStorage.getItem(`zmc_doc_notes_${currentPatId}`);
      if (cachedLocalNote && (!selectedOutpatient.notes || selectedOutpatient.notes.trim() === '')) {
        setOutpatients(prev => prev.map(p => p.id === currentPatId && (!p.notes || p.notes.trim() === '') ? { ...p, notes: cachedLocalNote } : p));
      }

      // 1. Fetch patient previous history and doctor notes
      apiFetch(`/patients/${currentPatId}/history`)
        .then(res => {
          if (selectedOutpatientId !== currentPatId) return;
          if (res.success && res.data) {
            const pastConsults = res.data.consultations || [];
            setPatientPastConsultations(pastConsults);

            // If active outpatient notes is currently empty, initialize from latest consultation
            if (pastConsults.length > 0) {
              const latestConsult = pastConsults[0];
              const latestSavedNote = latestConsult.clinical_notes || latestConsult.treatment_plan || latestConsult.notes || '';
              if (latestSavedNote) {
                setOutpatients(prev => prev.map(p => {
                  if (p.id === currentPatId && (!p.notes || p.notes.trim() === '')) {
                    return { ...p, notes: latestSavedNote };
                  }
                  return p;
                }));
              }
            }

            // Also collect any completed lab results from history
            const orders = res.data.labOrders || [];
            const results = orders.filter((o: any) => o.findings || o.result_details || o.status === 'Completed');
            if (results.length > 0) {
              setSelectedPatientLabResults(results.map((r: any) => ({
                id: r.id,
                test_name: r.test_name,
                result_details: r.result_details || 'Completed',
                findings: r.findings || 'Report issued',
                date_completed: r.date_completed || r.date_ordered,
                doctor_name: r.doctor_name
              })));
            } else {
              setSelectedPatientLabResults([]);
            }
          } else {
            setPatientPastConsultations([]);
            setSelectedPatientLabResults([]);
          }
        })
        .catch(err => {
          console.error("Error loading patient history:", err);
          if (selectedOutpatientId === currentPatId) {
            setPatientPastConsultations([]);
            setSelectedPatientLabResults([]);
          }
        })
        .finally(() => {
          if (selectedOutpatientId === currentPatId) {
            setIsLoadingPastHistory(false);
            setIsLoadingLabResults(false);
          }
        });
    } else {
      setPatientPastConsultations([]);
      setSelectedPatientLabResults([]);
    }
  }, [selectedOutpatientId]);

  const handleStartConsultation = async (patient: any) => {
    if (!patient || !patient.queueId) return;
    setIsStartingConsultation(true);
    const docName = currentUser?.name || currentUser?.username || 'Doctor';
    try {
      const res = await apiFetch(`/patients/opd/queue/${patient.queueId}/select`, {
        method: 'POST',
        body: JSON.stringify({ doctorName: docName })
      });
      if (res.success) {
        showToast(`Active consultation started with ${patient.name}.`, 'success');
        fetchDbQueue();
      } else {
        showToast(res.error || res.message || 'Failed to start consultation.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error starting consultation', 'error');
    } finally {
      setIsStartingConsultation(false);
    }
  };

  const handleExitConsultation = async (patient: any) => {
    if (!patient || !patient.queueId) return;
    setIsExitingConsultation(true);
    const docName = currentUser?.name || currentUser?.username || 'Doctor';
    try {
      // Auto-save any notes entered before pausing consultation
      if (patient.notes && patient.notes.trim() !== '') {
        await apiFetch('/patients/opd/consultations/save-notes', {
          method: 'POST',
          body: JSON.stringify({
            patientId: patient.id,
            encounterId: patient.encounterId,
            notes: patient.notes,
            doctorName: docName
          })
        }).catch(() => {});
      }

      const res = await apiFetch(`/patients/opd/queue/${patient.queueId}/exit`, {
        method: 'POST',
        body: JSON.stringify({ doctorName: docName })
      });
      if (res.success) {
        showToast(`Consultation for ${patient.name} paused and returned to queue.`, 'success');
        fetchDbQueue();
      } else {
        showToast(res.error || 'Failed to exit consultation', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error exiting consultation', 'error');
    } finally {
      setIsExitingConsultation(false);
    }
  };

  const handleSendLabsToCashierDb = async () => {
    if (!selectedOutpatient) return;
    if (!selectedOutpatient.orderedTests || selectedOutpatient.orderedTests.length === 0) {
      showToast('Please select at least one laboratory test to send to Cashier.', 'error');
      return;
    }

    setIsCompleting(true);
    try {
      const response = await apiFetch('/patients/opd/queue/order-labs', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedOutpatient.id,
          encounterId: selectedOutpatient.encounterId,
          orderedTests: selectedOutpatient.orderedTests || [],
          doctorName: currentUser?.name || currentUser?.username || 'Doctor'
        })
      });

      if (response.success) {
        showToast(`Laboratory tests successfully sent to Cashier for payment verification. Consultation remains active.`, 'success');
        // Refresh queue status without clearing selected patient
        fetchDbQueue();
      } else {
        showToast(response.error || 'Failed to route laboratory orders', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error routing lab orders to cashier', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  const getMedicationPrice = (medName: string): number => {
    const priceMap: Record<string, number> = {
      'Paracetamol 500mg tab': 800,
      'Ibuprofen 400mg tab': 1200,
      'Diclofenac 50mg tab': 1500,
      'Artemether/Lumefantrine (Coartem)': 2800,
      'Dihydroartemisinin/Piperaquine': 3200,
      'Amoxicillin 500mg cap': 2500,
      'Amoxicillin/Clavulanate (Augmentin) 625mg': 4800,
      'Ciprofloxacin 500mg tab': 2200,
      'Azithromycin 500mg tab': 3500,
      'Metronidazole 400mg tab': 1000,
      'Cefuroxime 500mg tab': 4500,
      'Erythromycin 500mg tab': 2500,
      'Ampiclox cap': 2200,
      'Omeprazole 20mg cap': 2000,
      'Antacid Suspension (Mist Mag)': 1500,
      'Hyoscine Butylbromide (Buscopan)': 1800,
      'Metoclopramide 10mg tab': 800,
      'Oral Rehydration Salts (ORS)': 600,
      'Loperamide 2mg cap': 1000,
      'Cetirizine 10mg tab': 1200,
      'Loratadine 10mg tab': 1500,
      'Chlorpheniramine 4mg tab': 500,
      'Hydrocortisone 100mg inj': 2500,
      'Dexamethasone 4mg inj': 1800,
      'Vitamin C 100mg tab': 500,
      'Vitamin B-Complex tab': 800,
      'Folic Acid 5mg tab': 600,
      'Ferrous Sulphate 200mg tab': 800,
      'Multivitamin syrup': 2000,
      'Zinc Sulfate 20mg tab': 1000,
      'Amlodipine 5mg tab': 2000,
      'Lisinopril 5mg tab': 2500,
      'Lisinopril 10mg tab': 3000,
      'Metformin 500mg tab': 1800,
      'Glibenclamide 5mg tab': 1500,
      'Labetalol 100mg': 3500,
      'Methyldopa 250mg': 3000,
      'Ceftriaxone IV 1g': 4500,
      'Magnesium Sulphate 50% inj': 3500,
      'Artesunate IV 60mg': 4000,
      'Hydralazine IV 20mg': 3500,
      'Oxytocin 10 IU': 2500,
      'Diclofenac IM 75mg': 1500,
      'Promethazine IM 50mg': 1200
    };
    return priceMap[medName] || 1500;
  };

  const handleSendMedsToCashierDb = async () => {
    if (!selectedOutpatient) return;
    const validMeds = prescriptionRows
      .filter(row => row.name && row.name.trim() !== '')
      .map(row => ({
        name: row.name.trim(),
        dose: row.dose?.trim() || 'Standard Dose',
        frequency: row.frequency?.trim() || 'Daily',
        duration: row.duration?.trim() || '5 days',
        price: getMedicationPrice(row.name.trim())
      }));

    if (validMeds.length === 0) {
      showToast('Please specify at least one medication drug name to send to Cashier.', 'error');
      return;
    }

    setIsCompleting(true);
    try {
      const response = await apiFetch('/patients/opd/queue/order-medications', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedOutpatient.id,
          encounterId: selectedOutpatient.encounterId,
          prescribedMedications: validMeds,
          doctorName: currentUser?.name || currentUser?.username || 'Doctor'
        })
      });

      if (response.success) {
        showToast(`Prescriptions (₦${(response.totalAmount || 0).toLocaleString()}) successfully sent to Cashier for payment. Consultation remains active.`, 'success');
        fetchDbQueue();
      } else {
        showToast(response.error || 'Failed to route medication orders', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error routing medication orders to cashier', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCompleteConsultationDb = async (routeTo: 'lab' | 'pharmacy') => {
    if (!selectedOutpatient) return;
    
    setIsCompleting(true);
    try {
      // Map prescriptionRows to prescribedMedications format
      const validMeds = prescriptionRows
        .filter(row => row.name.trim() !== '')
        .map(row => ({
          name: row.name,
          dose: row.dose,
          frequency: row.frequency,
          duration: row.duration
        }));

      const response = await apiFetch('/patients/opd/queue/consultation-complete', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedOutpatient.id,
          encounterId: selectedOutpatient.encounterId,
          notes: selectedOutpatient.notes || 'Routine consultation',
          orderedTests: selectedOutpatient.orderedTests || [],
          prescribedMedications: validMeds,
          routeTo: routeTo
        })
      });

      if (response.success) {
        showToast(`Consultation completed for ${selectedOutpatient.name}. Routed to Cashier for ${routeTo === 'lab' ? 'Laboratory' : 'Pharmacy'} Payment.`, 'success');
        
        // Remove from list
        setOutpatients(prev => prev.filter(p => p.id !== selectedOutpatientId));
        setSelectedOutpatientId(null);
        
        // Refresh
        fetchDbQueue();
      } else {
        showToast(response.error || 'Failed to complete consultation', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error completing consultation', 'error');
    } finally {
      setIsCompleting(false);
    }
  };

  // Toast notifications state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Persistent storage hooks
  useEffect(() => {
    localStorage.setItem('zmc_doc_outpatients', JSON.stringify(outpatients));
  }, [outpatients]);

  useEffect(() => {
    localStorage.setItem('zmc_doc_admitted', JSON.stringify(admittedPatients));
  }, [admittedPatients]);

  // Set default selection when switching tab
  useEffect(() => {
    if (currentTab === 'outpatients' && outpatients.length > 0 && !selectedOutpatientId) {
      setSelectedOutpatientId(outpatients[0].id);
    } else if (currentTab === 'admitted' && admittedPatients.length > 0 && !selectedAdmittedId) {
      setSelectedAdmittedId(admittedPatients[0].id);
    }
  }, [currentTab]);

  // Handle outpatient notes update
  const handleOutpatientNotesChange = (id: string, text: string) => {
    localStorage.setItem(`zmc_doc_notes_${id}`, text);
    setOutpatients(prev => prev.map(p => p.id === id ? { ...p, notes: text } : p));
  };

  const handleSaveOutpatientNotes = async (patientId: string, encounterId?: string, notesText?: string) => {
    if (!patientId) return;
    const pat = outpatients.find(p => p.id === patientId);
    const currentNotes = notesText !== undefined ? notesText : (pat?.notes || '');
    const encId = encounterId || pat?.encounterId;
    setIsSavingNote(true);
    try {
      localStorage.setItem(`zmc_doc_notes_${patientId}`, currentNotes);
      const res = await apiFetch('/patients/opd/consultations/save-notes', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          encounterId: encId,
          notes: currentNotes,
          doctorName: currentUser?.name || currentUser?.username || 'Doctor'
        })
      });
      if (res.success) {
        setIsNoteSaved(true);
        showToast('Doctor consultation notes saved successfully.');
        setTimeout(() => setIsNoteSaved(false), 3000);
      } else {
        showToast(res.error || 'Failed to save notes', 'error');
      }
    } catch (err: any) {
      console.error('Error saving doctor notes:', err);
      showToast(err.message || 'Error saving notes', 'error');
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleRemoveOutpatientPrescription = (prescId: string) => {
    setOutpatients(prev => prev.map(p => {
      if (p.id === selectedOutpatientId) {
        return {
          ...p,
          prescribedMedications: p.prescribedMedications.filter((pr: any) => pr.id !== prescId)
        };
      }
      return p;
    }));
    setPrescriptionRows(prev => {
      const updated = prev.filter(row => row.id !== prescId);
      return updated.length > 0 ? updated : [{ id: Math.random().toString(), name: '', dose: '', frequency: '', duration: '' }];
    });
  };

  // Order Lab Test for Outpatient
  const handleOrderOutpatientLabTest = (category: string, testName: string, price: number) => {
    if (!selectedOutpatientId || !testName) return;
    
    // Check if test is already ordered
    const currentOrders = selectedOutpatient?.orderedTests || [];
    if (currentOrders.some((t: any) => t.name === testName)) {
      showToast('This lab test is already ordered', 'error');
      return;
    }

    const newTest = {
      category,
      name: testName,
      price,
      timestamp: new Date().toLocaleString()
    };

    setOutpatients(prev => prev.map(p => {
      if (p.id === selectedOutpatientId) {
        return {
          ...p,
          orderedTests: [...(p.orderedTests || []), newTest]
        };
      }
      return p;
    }));

    showToast(`Ordered lab test: ${testName}`);
  };

  const handleRemoveOutpatientLabTest = (testName: string) => {
    setOutpatients(prev => prev.map(p => {
      if (p.id === selectedOutpatientId) {
        return {
          ...p,
          orderedTests: p.orderedTests.filter((t: any) => t.name !== testName)
        };
      }
      return p;
    }));
  };

  // Admit Outpatient to ward
  const handleAdmitOutpatient = () => {
    if (!selectedOutpatient) return;
    
    // Create new admitted patient record
    const newAdmission = {
      id: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      name: selectedOutpatient.name,
      hospitalNumber: selectedOutpatient.id,
      gender: selectedOutpatient.gender,
      dateOfBirth: selectedOutpatient.dateOfBirth,
      ward: selectedOutpatient.department === 'Maternity Clinic' ? 'Maternity Ward' : 'General Ward',
      bed: selectedOutpatient.department === 'Maternity Clinic' ? 'M-TBD' : 'G-TBD',
      admittedDate: new Date().toLocaleString(),
      dischargeBill: 15000,
      totalCharged: 15000,
      paymentsMade: 0,
      since: new Date().toLocaleDateString('en-GB'),
      department: selectedOutpatient.department === 'Maternity Clinic' ? 'Maternity' : 'General Medicine',
      religion: '—',
      edd: selectedOutpatient.department === 'Maternity Clinic' ? '2026-06-17' : '—',
      gravidaPara: selectedOutpatient.department === 'Maternity Clinic' ? 'G1 P0' : '—',
      notes: selectedOutpatient.notes || 'Admitted from Outpatient Clinic.',
      vitalsRecords: [
        {
          timestamp: new Date().toLocaleString(),
          recordedBy: `Dr. ${selectedOutpatient.attendingDoctor}`,
          bp: selectedOutpatient.vitals?.bloodPressure || '—',
          hr: selectedOutpatient.vitals?.pulseRate?.toString() || '—',
          temp: selectedOutpatient.vitals?.temperature?.toString() + '°F' || '—',
          rr: '18',
          spo2: '98%'
        }
      ],
      medicationsRecords: [] as any[],
      observationsRecords: [] as any[],
      chargesList: [] as any[],
      newOrdersList: [] as any[]
    };

    // Add to admitted list
    setAdmittedPatients(prev => [newAdmission, ...prev]);
    
    // Remove or update status of outpatient
    setOutpatients(prev => prev.filter(p => p.id !== selectedOutpatientId));
    
    // De-select
    setSelectedOutpatientId(null);

    // Socket alert logic simulation
    try {
      const event = new CustomEvent('zmc-notification', {
        detail: {
          type: 'PATIENT_UPDATED',
          message: `${selectedOutpatient.name} has been admitted. OPD Overview & Nursing notified.`
        }
      });
      window.dispatchEvent(event);
    } catch(e) {}

    showToast(`Admitted ${selectedOutpatient.name} successfully. OPD Overview and Nursing have been notified.`);
  };

  // Complete Consultation
  const handleCompleteConsultation = () => {
    if (!selectedOutpatient) return;
    showToast(`Consultation for ${selectedOutpatient.name} completed successfully. HMS updated.`);
    setOutpatients(prev => prev.filter(p => p.id !== selectedOutpatientId));
    setSelectedOutpatientId(null);
  };

  // Save Notes for Admitted patient (Current Notes / Diagnosis only)
  const handleSaveAdmittedNotes = (newNotes: string) => {
    if (!selectedAdmittedId) return;
    const finalNotes = newNotes !== undefined ? newNotes : admittedNotesInput;
    setAdmittedPatients(prev => prev.map(p => p.id === selectedAdmittedId ? { ...p, notes: finalNotes } : p));
    setAdmittedNotesInput(finalNotes);
    showToast('Current Notes & Diagnosis saved successfully.');
  };

  // Save Doctor's Orders for Admitted patient (Separate from Notes)
  const handleSaveDoctorOrders = (newOrders: string) => {
    if (!selectedAdmittedId) return;
    const finalOrders = newOrders !== undefined ? newOrders : admittedDoctorOrdersInput;
    const newHistoryEntry = {
      id: `DORD-${Date.now().toString().slice(-4)}`,
      orderText: finalOrders,
      doctorName: currentUser?.name || 'Doctor on duty',
      timestamp: new Date().toLocaleString()
    };

    setAdmittedPatients(prev => prev.map(p => {
      if (p.id === selectedAdmittedId) {
        return {
          ...p,
          doctorOrders: finalOrders,
          doctorOrdersHistory: [newHistoryEntry, ...(p.doctorOrdersHistory || [])]
        };
      }
      return p;
    }));
    setAdmittedDoctorOrdersInput(finalOrders);
    showToast("Doctor's Orders updated and appended to clinical history.");
  };

  // Open Discharge Modal
  const handleOpenDischargeModal = () => {
    if (!selectedAdmitted) return;
    setDischargeDiagnosis(selectedAdmitted.notes || '');
    setDischargeCondition('Clinically Improved');
    setDischargeInstructions('Continue prescribed discharge medications. Rest and adequate hydration.');
    setDischargeFollowUp('In 2 weeks at Outpatient Clinic');
    setDischargeModalOpen(true);
  };

  // Confirm Discharge Patient
  const handleConfirmDischarge = () => {
    if (!selectedAdmitted) return;
    const outstanding = Math.max(0, Number(selectedAdmitted.totalCharged || 0) - Number(selectedAdmitted.paymentsMade || 0));
    
    if (outstanding > 0) {
      showToast(`Warning: Outstanding balance of ₦${outstanding.toLocaleString()}. Billing clearance advised before exit.`, 'error');
    }

    const dischargeRecord = {
      ...selectedAdmitted,
      status: 'Discharged',
      dischargedAt: new Date().toLocaleString(),
      dischargedBy: currentUser?.name || 'Attending Physician',
      dischargeDiagnosis,
      dischargeCondition,
      dischargeInstructions,
      dischargeFollowUp
    };

    // Store in discharged history if needed
    try {
      const existingDischarged = JSON.parse(localStorage.getItem('zmc_doc_discharged_history') || '[]');
      localStorage.setItem('zmc_doc_discharged_history', JSON.stringify([dischargeRecord, ...existingDischarged]));
    } catch (e) {}

    // Remove from active admitted list
    setAdmittedPatients(prev => prev.filter(p => p.id !== selectedAdmittedId));
    setSelectedAdmittedId(null);
    setDischargeModalOpen(false);
    showToast(`${selectedAdmitted.name} has been successfully discharged from ${selectedAdmitted.ward}. Bed ${selectedAdmitted.bed} is now vacant.`);
  };

  // Update Status of Sent Order
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    if (!selectedAdmittedId) return;

    setAdmittedPatients(prev => prev.map(p => {
      if (p.id === selectedAdmittedId) {
        const targetOrder = (p.newOrdersList || []).find((o: any) => o.id === orderId);
        const updatedOrders = (p.newOrdersList || []).map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o);
        
        let updatedMeds = [...(p.medicationsRecords || [])];
        let updatedCharges = p.totalCharged;
        let updatedChargesList = [...(p.chargesList || [])];

        // If completed and was medication/injection, update med record to Administered or Dispensed
        if (newStatus === 'Completed') {
          updatedMeds = updatedMeds.map((m: any) => {
            if (m.orderId === orderId || (targetOrder && targetOrder.description.includes(m.name))) {
              return {
                ...m,
                status: targetOrder?.type === 'Injection' ? 'Administered' : 'Dispensed',
                administeredBy: currentUser?.name || 'Staff Nurse',
                administeredAt: new Date().toLocaleString()
              };
            }
            return m;
          });
        }

        // If cancelled, update med record to Cancelled and reverse charge
        if (newStatus === 'Cancelled') {
          updatedMeds = updatedMeds.map((m: any) => {
            if (m.orderId === orderId || (targetOrder && targetOrder.description.includes(m.name))) {
              return { ...m, status: 'Cancelled' };
            }
            return m;
          });

          // Remove charge item
          const chargeIdx = updatedChargesList.findIndex((c: any) => c.orderId === orderId);
          if (chargeIdx !== -1) {
            const removedAmount = updatedChargesList[chargeIdx].amount || 0;
            updatedCharges = Math.max(0, updatedCharges - removedAmount);
            updatedChargesList.splice(chargeIdx, 1);
          }
        }

        return {
          ...p,
          newOrdersList: updatedOrders,
          medicationsRecords: updatedMeds,
          chargesList: updatedChargesList,
          totalCharged: updatedCharges,
          dischargeBill: updatedCharges
        };
      }
      return p;
    }));

    showToast(`Order ${orderId} updated to ${newStatus}.`);
  };

  // Mark Medication Administered
  const handleAdministerMedication = (medId: string, customNote?: string) => {
    if (!selectedAdmittedId) return;

    setAdmittedPatients(prev => prev.map(p => {
      if (p.id === selectedAdmittedId) {
        const updatedMeds = (p.medicationsRecords || []).map((m: any) => {
          if (m.id === medId) {
            return {
              ...m,
              status: 'Administered',
              administeredBy: currentUser?.name || 'Nurse on Duty',
              administeredAt: new Date().toLocaleString(),
              note: customNote ? `${m.note ? m.note + ' | ' : ''}${customNote}` : m.note
            };
          }
          return m;
        });
        return { ...p, medicationsRecords: updatedMeds };
      }
      return p;
    }));

    setAdministerModalOpen(false);
    setSelectedMedToAdminister(null);
    setAdministerNote('');
    showToast('Medication marked as administered.');
  };

  // Cancel Medication
  const handleCancelMedication = (medId: string) => {
    if (!selectedAdmittedId) return;

    setAdmittedPatients(prev => prev.map(p => {
      if (p.id === selectedAdmittedId) {
        const updatedMeds = (p.medicationsRecords || []).map((m: any) => {
          if (m.id === medId) {
            return { ...m, status: 'Cancelled' };
          }
          return m;
        });
        return { ...p, medicationsRecords: updatedMeds };
      }
      return p;
    }));

    showToast('Medication cancelled.');
  };

  // Add Manual Medication Log
  const handleAddMedicationLog = () => {
    if (!selectedAdmittedId || !newMedName.trim()) {
      showToast('Please specify a medication name', 'error');
      return;
    }

    const newMedRecord = {
      id: `MED-${Date.now().toString().slice(-4)}`,
      name: newMedName.trim(),
      dose: newMedDose.trim() || 'Standard Dose',
      quantity: newMedQuantity || '1',
      frequency: newMedFrequency || 'OD',
      status: newMedStatus,
      orderedBy: currentUser?.name || 'Dr. Emeka Eze',
      administeredBy: newMedStatus === 'Administered' ? (currentUser?.name || 'Staff Nurse') : '',
      administeredAt: newMedStatus === 'Administered' ? new Date().toLocaleString() : '',
      timestamp: new Date().toLocaleString(),
      note: newMedNote.trim()
    };

    setAdmittedPatients(prev => prev.map(p => {
      if (p.id === selectedAdmittedId) {
        return {
          ...p,
          medicationsRecords: [newMedRecord, ...(p.medicationsRecords || [])]
        };
      }
      return p;
    }));

    setNewMedName('');
    setNewMedDose('');
    setNewMedQuantity('1');
    setNewMedFrequency('OD');
    setNewMedStatus('Administered');
    setNewMedNote('');
    setAddMedLogModalOpen(false);
    showToast('Medication log recorded successfully.');
  };

  // Add Clinical Observation
  const handleAddObservation = () => {
    if (!selectedAdmittedId || !obsNote.trim()) {
      showToast('Please enter clinical observation notes', 'error');
      return;
    }

    const newObs = {
      id: `OBS-${Date.now().toString().slice(-4)}`,
      category: obsCategory,
      note: obsNote.trim(),
      timestamp: new Date().toLocaleString(),
      recordedBy: currentUser?.name || 'Dr. Emeka Eze'
    };

    setAdmittedPatients(prev => prev.map(p => {
      if (p.id === selectedAdmittedId) {
        return {
          ...p,
          observationsRecords: [newObs, ...(p.observationsRecords || [])]
        };
      }
      return p;
    }));

    setObsNote('');
    setObsCategory('Doctor Round');
    setObsModalOpen(false);
    showToast('Clinical observation saved.');
  };

  // Send Order to Pharmacy/Nursing/Laboratory for Admitted Patient
  const handleSendOrder = () => {
    if (!selectedAdmitted) return;

    let targetDept = '';
    let description = '';
    const orderId = `ORD-${Math.floor(100 + Math.random() * 900)}`;
    const nowStr = new Date().toLocaleString();
    let orderTotalPrice = 0;
    const newMedRecordsToAdd: any[] = [];
    const newChargeItemsToAdd: any[] = [];

    if (orderType === 'Medication') {
      targetDept = 'PHARMACY';
      const validItems = medOrderItems.filter(item => item.name && item.name.trim() !== '');
      
      if (validItems.length === 0) {
        showToast('Please add at least one medication item', 'error');
        return;
      }

      description = `Medications: ${validItems.map(i => `${i.name} (${i.dose || 'std'}) - Qty: ${i.quantity || 1}, Freq: ${i.frequency || 'OD'}`).join(', ')}. ${orderNotes ? 'Notes: ' + orderNotes : ''}`;

      validItems.forEach((item, i) => {
        const qtyNum = parseInt(item.quantity || '1', 10) || 1;
        const itemPrice = 1500 * qtyNum;
        orderTotalPrice += itemPrice;

        newMedRecordsToAdd.push({
          id: `MED-ORD-${Date.now().toString().slice(-3)}-${i}`,
          orderId,
          name: item.name,
          dose: item.dose || 'As directed',
          quantity: item.quantity || '1',
          frequency: item.frequency || 'OD',
          status: 'Pending',
          orderedBy: currentUser?.name || 'Dr. Emeka Eze',
          administeredBy: '',
          administeredAt: '',
          timestamp: nowStr,
          note: orderNotes || 'Inpatient prescription order'
        });

        newChargeItemsToAdd.push({
          orderId,
          item: `Medication: ${item.name} (${item.dose || 'std'}) x${qtyNum}`,
          amount: itemPrice,
          timestamp: nowStr
        });
      });

    } else if (orderType === 'Injection') {
      targetDept = 'NURSING';
      const validItems = injOrderItems.filter(item => item.name && item.name.trim() !== '');
      
      if (validItems.length === 0) {
        showToast('Please add at least one injection item', 'error');
        return;
      }

      description = `Injections: ${validItems.map(i => `${i.name} (${i.dose || 'std'}) - Qty: ${i.quantity || 1}`).join(', ')}. ${orderNotes ? 'Notes: ' + orderNotes : ''}`;

      validItems.forEach((item, i) => {
        const qtyNum = parseInt(item.quantity || '1', 10) || 1;
        const itemPrice = 2000 * qtyNum;
        orderTotalPrice += itemPrice;

        newMedRecordsToAdd.push({
          id: `INJ-ORD-${Date.now().toString().slice(-3)}-${i}`,
          orderId,
          name: item.name,
          dose: item.dose || 'STAT',
          quantity: item.quantity || '1',
          frequency: 'STAT / As Ordered',
          status: 'Pending',
          orderedBy: currentUser?.name || 'Dr. Emeka Eze',
          administeredBy: '',
          administeredAt: '',
          timestamp: nowStr,
          note: `Injection order: ${orderNotes || 'Administer per protocol'}`
        });

        newChargeItemsToAdd.push({
          orderId,
          item: `Injection: ${item.name} (${item.dose || 'std'}) x${qtyNum}`,
          amount: itemPrice,
          timestamp: nowStr
        });
      });

    } else {
      targetDept = 'LABORATORY';
      const activeLabs = (Object.entries(labOrderTests) as [string, string][]).filter(([category, testName]) => testName && testName.trim() !== '');
      
      if (activeLabs.length === 0) {
        showToast('Please select at least one laboratory test', 'error');
        return;
      }

      description = `Labs Ordered: ${activeLabs.map(([cat, tName]) => `${cat}: ${tName}`).join(', ')}. ${orderNotes ? 'Notes: ' + orderNotes : ''}`;

      activeLabs.forEach(([cat, testName]) => {
        // Price lookup from test catalogs
        let testPrice = 2500;
        const foundTest = [...CHEMISTRY_TESTS, ...SEROLOGY_TESTS, ...HAEMATOLOGY_TESTS, ...MICROBIOLOGY_TESTS, ...PARASITOLOGY_TESTS].find(t => t.name === testName);
        if (foundTest && foundTest.price) {
          testPrice = foundTest.price;
        }
        orderTotalPrice += testPrice;

        newChargeItemsToAdd.push({
          orderId,
          item: `Lab Test (${cat}): ${testName}`,
          amount: testPrice,
          timestamp: nowStr
        });
      });
    }

    const newOrder = {
      id: orderId,
      type: orderType,
      target: targetDept,
      description,
      notes: orderNotes,
      status: 'Pending',
      timestamp: nowStr
    };

    setAdmittedPatients(prev => prev.map(p => {
      if (p.id === selectedAdmittedId) {
        const updatedOrdersList = [newOrder, ...(p.newOrdersList || [])];
        const updatedMeds = [...newMedRecordsToAdd, ...(p.medicationsRecords || [])];
        const updatedChargesList = [...newChargeItemsToAdd, ...(p.chargesList || [])];
        const newTotalCharged = (Number(p.totalCharged) || 0) + orderTotalPrice;

        return {
          ...p,
          newOrdersList: updatedOrdersList,
          medicationsRecords: updatedMeds,
          chargesList: updatedChargesList,
          totalCharged: newTotalCharged,
          dischargeBill: newTotalCharged
        };
      }
      return p;
    }));

    // Reset inputs
    setMedOrderItems([{ name: '', dose: '', quantity: '', frequency: '' }]);
    setInjOrderItems([{ name: '', dose: '', quantity: '' }]);
    setLabOrderTests({
      CHEMISTRY: '',
      SEROLOGY: '',
      HAEMATOLOGY: '',
      MICROBIOLOGY: '',
      PARASITOLOGY: ''
    });
    setOrderNotes('');
    
    showToast(`Order ${orderId} sent successfully to ${targetDept}!`);
  };

  // Generate & Download Comprehensive HMS Document
  const handleDownloadHMS = (patient: any) => {
    try {
      const hmsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hospital Management System Record - ${patient.name} (${patient.hospitalNumber || patient.id})</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 24px; }
    .header { border-bottom: 3px solid #0284c7; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
    .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
    .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
    .badge { background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; font-family: monospace; }
    .section { margin-bottom: 24px; page-break-inside: avoid; }
    .section-title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #0369a1; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 12px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 12px; }
    .label { color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px; }
    .val { font-weight: 600; color: #0f172a; }
    .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 8px; }
    th { background: #f1f5f9; text-align: left; padding: 8px; font-weight: 700; color: #475569; border-bottom: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; }
    td { padding: 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    .status-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; font-family: monospace; }
    .status-Administered { background: #dcfce7; color: #166534; }
    .status-Pending { background: #fef3c7; color: #92400e; }
    .status-Dispensed { background: #e0f2fe; color: #075985; }
    .status-Cancelled { background: #ffe4e6; color: #9f1239; }
    .footer { font-size: 10px; color: #94a3b8; text-align: center; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-family: monospace; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">ZIKORA MEDICAL CENTRE</h1>
      <div class="subtitle">Hospital Management System (HMS) Summary</div>
      <div style="font-size: 11px; color: #0284c7; font-weight: 700; margin-top: 6px;">Hospital No: ${patient.hospitalNumber || patient.id}</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">${patient.ward || 'INPATIENT'} • Bed ${patient.bed || '—'}</span>
      <div class="subtitle" style="margin-top: 6px;">Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">1. Patient Demographics & Admission Overview</div>
    <div class="grid-4 box">
      <div><div class="label">Patient Full Name</div><div class="val">${patient.name}</div></div>
      <div><div class="label">Gender / DOB</div><div class="val">${patient.gender} | ${patient.dateOfBirth || '—'}</div></div>
      <div><div class="label">Ward & Bed</div><div class="val">${patient.ward || '—'} / ${patient.bed || '—'}</div></div>
      <div><div class="label">Admitted Since</div><div class="val">${patient.admittedDate || patient.since || '—'}</div></div>
      <div><div class="label">Department</div><div class="val">${patient.department || 'General'}</div></div>
      <div><div class="label">Religion</div><div class="val">${patient.religion || '—'}</div></div>
      <div><div class="label">Obstetric Details</div><div class="val">EDD: ${patient.edd || '—'} | ${patient.gravidaPara || '—'}</div></div>
      <div><div class="label">Account Status</div><div class="val">Total: ₦${Number(patient.totalCharged || 0).toLocaleString()} | Paid: ₦${Number(patient.paymentsMade || 0).toLocaleString()}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. Current Clinical Notes & Diagnosis</div>
    <div class="box" style="white-space: pre-wrap; font-family: monospace;">${patient.notes || 'No primary notes recorded.'}</div>
  </div>

  <div class="section">
    <div class="section-title">3. Doctor's Orders & Directives</div>
    <div class="box" style="white-space: pre-wrap; font-family: monospace;">${patient.doctorOrders || 'No current directives specified.'}</div>
  </div>

  <div class="section">
    <div class="section-title">4. Vital Signs History</div>
    ${patient.vitalsRecords && patient.vitalsRecords.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Date / Time</th>
          <th>BP (mmHg)</th>
          <th>HR (Pulse)</th>
          <th>Temp (°C)</th>
          <th>RR (/min)</th>
          <th>SpO₂ (%)</th>
          <th>Recorded By</th>
        </tr>
      </thead>
      <tbody>
        ${patient.vitalsRecords.map((v: any) => `
        <tr>
          <td>${v.timestamp || '—'}</td>
          <td><b>${v.bp || '—'}</b></td>
          <td>${v.hr || '—'}</td>
          <td>${v.temp || '—'}</td>
          <td>${v.rr || '—'}</td>
          <td>${v.spo2 || '—'}</td>
          <td>${v.recordedBy || 'Nurse'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<div class="box">No vital signs logs available.</div>'}
  </div>

  <div class="section">
    <div class="section-title">5. Inpatient Medications & Injection Logs</div>
    ${patient.medicationsRecords && patient.medicationsRecords.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Medication / Item</th>
          <th>Dose & Qty</th>
          <th>Frequency</th>
          <th>Status</th>
          <th>Ordered By</th>
          <th>Administration Log</th>
          <th>Clinical Notes</th>
        </tr>
      </thead>
      <tbody>
        ${patient.medicationsRecords.map((m: any) => `
        <tr>
          <td><b>${m.name}</b></td>
          <td>${m.dose || '—'} (${m.quantity || '1'})</td>
          <td>${m.frequency || '—'}</td>
          <td><span class="status-badge status-${m.status || 'Pending'}">${m.status || 'Pending'}</span></td>
          <td>${m.orderedBy || 'Dr. Emeka Eze'}</td>
          <td>${m.administeredAt ? `${m.administeredAt} by ${m.administeredBy || 'Nurse'}` : 'Awaiting admin'}</td>
          <td style="font-style: italic;">${m.note || '—'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<div class="box">No medication records available.</div>'}
  </div>

  <div class="section">
    <div class="section-title">6. Clinical Observations History</div>
    ${patient.observationsRecords && patient.observationsRecords.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Date / Time</th>
          <th>Category</th>
          <th>Observation Details</th>
          <th>Clinician / Nurse</th>
        </tr>
      </thead>
      <tbody>
        ${patient.observationsRecords.map((obs: any) => `
        <tr>
          <td>${obs.timestamp || '—'}</td>
          <td><b style="color: #0369a1;">${obs.category || 'General'}</b></td>
          <td style="font-family: monospace;">${obs.note || '—'}</td>
          <td>${obs.recordedBy || 'Clinician'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<div class="box">No observation logs recorded.</div>'}
  </div>

  <div class="section">
    <div class="section-title">7. Placed Inpatient Orders</div>
    ${patient.newOrdersList && patient.newOrdersList.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Target Dept</th>
          <th>Order Description & Tests</th>
          <th>Status</th>
          <th>Order Date</th>
        </tr>
      </thead>
      <tbody>
        ${patient.newOrdersList.map((ord: any) => `
        <tr>
          <td><b>${ord.id}</b></td>
          <td>${ord.target || ord.type}</td>
          <td style="font-family: monospace;">${ord.description}</td>
          <td><span class="status-badge status-${ord.status}">${ord.status}</span></td>
          <td>${ord.timestamp}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : '<div class="box">No additional orders placed.</div>'}
  </div>

  <div class="section">
    <div class="section-title">8. Inpatient Financial & Charges Breakdown</div>
    <div class="grid-4 box">
      <div><div class="label">Total Incurred</div><div class="val">₦${Number(patient.totalCharged || 0).toLocaleString()}</div></div>
      <div><div class="label">Payments Made</div><div class="val" style="color: #166534;">₦${Number(patient.paymentsMade || 0).toLocaleString()}</div></div>
      <div><div class="label">Outstanding Balance</div><div class="val" style="color: #dc2626;">₦${Math.max(0, Number(patient.totalCharged || 0) - Number(patient.paymentsMade || 0)).toLocaleString()}</div></div>
      <div><div class="label">Discharge Bill</div><div class="val">₦${Number(patient.dischargeBill || patient.totalCharged || 0).toLocaleString()}</div></div>
    </div>
    ${patient.chargesList && patient.chargesList.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Item / Service Description</th>
          <th>Date Incurred</th>
          <th style="text-align: right;">Amount (₦)</th>
        </tr>
      </thead>
      <tbody>
        ${patient.chargesList.map((c: any) => `
        <tr>
          <td>${c.item}</td>
          <td>${c.timestamp || '—'}</td>
          <td style="text-align: right; font-weight: 700;">₦${Number(c.amount || 0).toLocaleString()}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}
  </div>

  <div class="footer">
    Zikora Medical Centre • Confidential Hospital Management System Record • Validated by Attending Medical Officer
  </div>
</body>
</html>`;

      const blob = new Blob([hmsHtml], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `HMS_${patient.hospitalNumber || patient.id}_${patient.name.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      showToast(`HMS clinical file downloaded for ${patient.name}`);
    } catch (e: any) {
      console.error('Error downloading HMS:', e);
      showToast('Failed to download HMS record. Please try again.', 'error');
    }
  };

  // Filters patients list based on search bar
  const filteredOutpatients = outpatients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAdmittedPatients = admittedPatients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      
      {/* Toast Alert Header */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-white flex items-center gap-2.5 max-w-md ${
              toastType === 'success' ? 'bg-[#2A758C] border-[#1f596b]' : 'bg-rose-600 border-rose-500'
            }`}
          >
            {toastType === 'success' ? <CheckCircle2 className="h-5 w-5 text-[#A3D1E0]" /> : <AlertCircle className="h-5 w-5" />}
            <span className="text-xs font-bold font-sans">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Module Tabs & Search Header */}
      <div className="bg-[#1D222B] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#151921] shrink-0">
        <div>
          <h2 className="text-white text-lg font-black tracking-tight flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#A3D1E0]" />
            Doctor Clinical Portal
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Manage outpatient consultations & admitted patients ward rounds</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tabs */}
          <div className="flex bg-slate-800/60 p-1 border border-slate-700/50 rounded-xl flex-wrap gap-1">
            <button
              onClick={() => {
                setCurrentTab('outpatients');
                setSearchQuery('');
                if (onNavigateTab) onNavigateTab('consult');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'outpatients' 
                  ? 'bg-[#A3D1E0] text-slate-950 font-black shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Stethoscope className="h-3.5 w-3.5" />
              <span>Out-Patients consultations</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('standard');
                setSearchQuery('');
                if (onNavigateTab) onNavigateTab('standard-cards');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'standard' 
                  ? 'bg-sky-400 text-slate-950 font-black shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              <span>Standard Cards</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('specialized');
                setSearchQuery('');
                if (onNavigateTab) onNavigateTab('specialized-care');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'specialized' 
                  ? 'bg-rose-500 text-white font-black shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Specialized Care</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('admitted');
                setSearchQuery('');
                if (onNavigateTab) onNavigateTab('admitted');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'admitted' 
                  ? 'bg-[#A3D1E0] text-slate-950 font-black shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BedDouble className="h-3.5 w-3.5" />
              <span>Admitted Patients</span>
            </button>
          </div>

          {/* Search box (shown on outpatients & admitted views) */}
          {(currentTab === 'outpatients' || currentTab === 'admitted') && (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-1.5 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-[#A3D1E0]"
              />
            </div>
          )}
        </div>
      </div>

      {currentTab === 'standard' || currentTab === 'specialized' ? (
        <div className="flex-1 overflow-hidden">
          <DoctorSpecializedDirectory
            initialCategory={currentTab === 'standard' ? 'standard' : 'specialized'}
            currentUser={currentUser}
            onSelectPatientForConsultation={(patientId) => {
              setSelectedOutpatientId(patientId);
              setCurrentTab('outpatients');
              if (onNavigateTab) onNavigateTab('consult');
            }}
            onBackToQueue={() => {
              setCurrentTab('outpatients');
              if (onNavigateTab) onNavigateTab('consult');
            }}
          />
        </div>
      ) : (
        /* Main Grid View */
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side: Patient Queue/List */}
        <div className="w-full lg:w-80 border-r border-slate-200 bg-white flex flex-col shrink-0 h-64 lg:h-auto overflow-y-auto">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">
              {currentTab === 'outpatients' ? 'Waiting Patients' : 'Admitted Patients'}
            </span>
            <span className="px-2 py-0.5 bg-slate-200/60 rounded-full text-[10px] font-bold text-slate-600">
              {currentTab === 'outpatients' ? filteredOutpatients.length : filteredAdmittedPatients.length} Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto">
            {currentTab === 'outpatients' ? (
              filteredOutpatients.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No waiting patients found.</div>
              ) : (
                filteredOutpatients.map((p, idx) => {
                  const isSelected = selectedOutpatientId === p.id;
                  return (
                    <div
                      key={p.queueId ? `q-${p.queueId}` : `outpatient-${p.id}-${idx}`}
                      onClick={() => {
                        setSelectedOutpatientId(p.id);
                      }}
                      className={`p-4 cursor-pointer transition-all hover:bg-slate-50/80 relative ${
                        isSelected ? 'bg-slate-50 border-l-4 border-[#2A758C]' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{p.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {p.isAwaitingPayment ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold tracking-wider bg-amber-100 text-amber-900 border border-amber-300 font-mono flex items-center gap-1">
                              <Lock className="h-2.5 w-2.5 text-amber-700" /> IN CASHIER DEPT
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider font-mono ${
                              p.status === 'IN CONSULTATION' 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200/50' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200/50'
                            }`}>
                              {p.status === 'IN CONSULTATION' && p.processedBy ? `IN CONSULTATION (${p.processedBy})` : p.status}
                            </span>
                          )}
                          {p.isEmergency && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider bg-rose-100 text-rose-800 border border-rose-200 font-mono uppercase">
                              EMERGENCY
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded">{p.department}</span>
                        <span>BP: {p.vitals?.bloodPressure || '—'}</span>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              filteredAdmittedPatients.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No admitted patients found.</div>
              ) : (
                filteredAdmittedPatients.map((p, idx) => {
                  const isSelected = selectedAdmittedId === p.id;
                  return (
                    <div
                      key={p.queueId ? `admitted-q-${p.queueId}` : `admitted-${p.id}-${idx}`}
                      onClick={() => setSelectedAdmittedId(p.id)}
                      className={`p-4 cursor-pointer transition-all hover:bg-slate-50/80 relative ${
                        isSelected ? 'bg-slate-50 border-l-4 border-[#2A758C]' : 'border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{p.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono mt-0.5">{p.id}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-800 text-[9px] font-bold rounded uppercase tracking-wider font-mono">
                          {p.department || 'General'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 font-medium">
                        {p.ward} – Bed {p.bed}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Since {p.since}</span>
                        <span className="text-[#2A758C] font-bold">₦{Number(p.dischargeBill || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Right Side: Active Patient File View */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {currentTab === 'outpatients' ? (
            selectedOutpatient ? (
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header Profile Info card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-xl font-black text-slate-900">{selectedOutpatient.name}</h3>
                        {selectedOutpatient.cardType && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-blue-50 text-blue-800 border border-blue-200 font-mono uppercase">
                            {selectedOutpatient.cardType} Card
                          </span>
                        )}
                        {selectedOutpatient.patientCategory && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono uppercase">
                            {selectedOutpatient.patientCategory}
                          </span>
                        )}
                        {selectedOutpatient.isEmergency && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-rose-100 text-rose-800 border border-rose-200 font-mono uppercase animate-pulse">
                            EMERGENCY
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono mt-1.5">
                        <span>Hospital ID: <strong className="text-slate-800">{selectedOutpatient.hospitalNumber || selectedOutpatient.id}</strong></span>
                        <span>•</span>
                        <span>Queue Dept: <strong className="text-slate-800">{selectedOutpatient.department}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      {/* Active Consultation Action Buttons */}
                      {selectedOutpatient.isDbPatient && !selectedOutpatient.isAwaitingPayment && (
                        selectedOutpatient.status === 'IN CONSULTATION' ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-black font-mono">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                              IN CONSULTATION ({selectedOutpatient.processedBy || 'YOU'})
                            </span>
                            <button
                              type="button"
                              disabled={isExitingConsultation}
                              onClick={() => handleExitConsultation(selectedOutpatient)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                              title="Pause consultation and return patient to queue"
                            >
                              {isExitingConsultation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
                              <span>Hold / Exit</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isStartingConsultation}
                            onClick={() => handleStartConsultation(selectedOutpatient)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2A758C] hover:bg-[#1f5869] text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                            title="Start consultation with this patient"
                          >
                            {isStartingConsultation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Stethoscope className="h-3.5 w-3.5" />}
                            <span>Start Consultation</span>
                          </button>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenPatientHistory(selectedOutpatient.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
                        title="View patient history, previous consultations, vitals & lab records"
                      >
                        <History className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Patient History</span>
                      </button>
                      <ExportButton
                        exportType="medical-records"
                        patientId={selectedOutpatient.id}
                        label="Download HMS"
                        className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-extrabold"
                        onSuccess={(msg) => showToast(msg)}
                        onFailure={(msg) => showToast(msg)}
                      />
                    </div>
                  </div>

                  {/* Profile Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">DOB & Age</span>
                      <span className="text-xs font-bold text-slate-800">{selectedOutpatient.dateOfBirth} ({selectedOutpatient.age} yrs)</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Gender</span>
                      <span className="text-xs font-bold text-slate-800">{selectedOutpatient.gender}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Marital Status</span>
                      <span className="text-xs font-bold text-slate-800">{selectedOutpatient.maritalStatus}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Phone Number</span>
                      <span className="text-xs font-bold text-slate-800">{selectedOutpatient.phoneNumber}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Email Address</span>
                      <span className="text-xs font-bold text-slate-800 truncate block">{selectedOutpatient.email || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Home Address</span>
                      <span className="text-xs font-bold text-slate-800">{selectedOutpatient.address}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Attending Doctor</span>
                      <span className="text-xs font-bold text-[#2A758C] font-mono">@{selectedOutpatient.attendingDoctor}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Next of Kin</span>
                      <span className="text-xs font-bold text-slate-800">
                        {selectedOutpatient.nextOfKinName} ({selectedOutpatient.nextOfKinRelationship}) • {selectedOutpatient.nextOfKinPhone}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Registered Date & Time</span>
                      <span className="text-xs font-bold text-slate-800 font-mono">{selectedOutpatient.registeredAt || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Maternity Profile Details (If Maternity Card) */}
                {(selectedOutpatient.cardType === 'Maternity' || selectedOutpatient.maternityDetails) && (
                  <div className="bg-emerald-50/40 rounded-2xl border border-emerald-200/80 p-6 shadow-sm">
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-emerald-700" />
                      Maternity & Obstetric Profile
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase font-mono">Gravida / Para</span>
                        <span className="font-extrabold text-slate-800">
                          G{selectedOutpatient.maternityDetails?.gravida || '0'} P{selectedOutpatient.maternityDetails?.para || '0'}
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase font-mono">LMP</span>
                        <span className="font-extrabold text-slate-800">{selectedOutpatient.maternityDetails?.lmp || '—'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase font-mono">EDD</span>
                        <span className="font-extrabold text-slate-800">{selectedOutpatient.maternityDetails?.edd || '—'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase font-mono">Gestational Age</span>
                        <span className="font-extrabold text-slate-800">{selectedOutpatient.maternityDetails?.gestationalAge || '—'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase font-mono">Tribe</span>
                        <span className="font-extrabold text-slate-800">{selectedOutpatient.maternityDetails?.tribe || '—'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase font-mono">Occupation</span>
                        <span className="font-extrabold text-slate-800">{selectedOutpatient.maternityDetails?.occupation || '—'}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-emerald-100 col-span-2">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase font-mono">Abortion / Premature History</span>
                        <span className="font-extrabold text-slate-800">
                          Abortion: {selectedOutpatient.maternityDetails?.abortion || '0'} | Premature: {selectedOutpatient.maternityDetails?.premature || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Emergency Intake Details (If Emergency Card) */}
                {(selectedOutpatient.cardType === 'Emergency' || selectedOutpatient.emergencyDetails) && (
                  <div className="bg-rose-50/40 rounded-2xl border border-rose-200/80 p-6 shadow-sm">
                    <h4 className="text-xs font-black text-rose-900 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-rose-700" />
                      Emergency Trauma Intake Protocols
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-white p-3.5 rounded-xl border border-rose-100">
                        <span className="block text-[10px] font-bold text-rose-600 uppercase font-mono">Brought In By</span>
                        <span className="font-extrabold text-slate-800 block mt-0.5">
                          {selectedOutpatient.emergencyDetails?.broughtInByName || 'Self Presenting'}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {selectedOutpatient.emergencyDetails?.broughtInByRelationship || ''} • {selectedOutpatient.emergencyDetails?.broughtInByPhone || ''}
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-xl border border-rose-100">
                        <span className="block text-[10px] font-bold text-rose-600 uppercase font-mono">Brought In ID</span>
                        <span className="font-extrabold text-slate-800 block mt-0.5">
                          {selectedOutpatient.emergencyDetails?.broughtInByIdType || 'N/A'}: {selectedOutpatient.emergencyDetails?.broughtInByIdNumber || '—'}
                        </span>
                      </div>
                      <div className="bg-white p-3.5 rounded-xl border border-rose-100">
                        <span className="block text-[10px] font-bold text-rose-600 uppercase font-mono">Doctor on Call / Cash</span>
                        <span className="font-extrabold text-slate-800 block mt-0.5">
                          {selectedOutpatient.emergencyDetails?.doctorOnCallName || selectedOutpatient.attendingDoctor || '—'}
                        </span>
                        <span className="text-[11px] text-emerald-700 font-bold block mt-0.5 font-mono">
                          Collected: ₦{Number(selectedOutpatient.emergencyDetails?.cashCollected || 0).toLocaleString()}
                        </span>
                      </div>
                      {selectedOutpatient.emergencyDetails?.customDetails && (
                        <div className="bg-white p-3.5 rounded-xl border border-rose-100 md:col-span-3">
                          <span className="block text-[10px] font-bold text-rose-600 uppercase font-mono">Incident Intake Note</span>
                          <p className="text-slate-700 font-medium text-xs mt-1">{selectedOutpatient.emergencyDetails.customDetails}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Patient Vitals Card (Adult: T - P - R - BP - W - H - SpO2) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-[#2A758C]" />
                      Vital Signs Records (Adult: T – P – R – BP – W)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium uppercase">Recorded at Intake/Triage</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">BP (mmHg)</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono mt-0.5 block">{formatVital(selectedOutpatient.vitals?.bloodPressure)}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Temp (°C)</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono mt-0.5 block">
                        {formatVital(selectedOutpatient.vitals?.temperature, '°C')}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Pulse (bpm)</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono mt-0.5 block">
                        {formatVital(selectedOutpatient.vitals?.pulseRate, 'bpm')}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Resp (/min)</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono mt-0.5 block">
                        {formatVital(selectedOutpatient.vitals?.respiratoryRate, '/min')}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Weight (kg)</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono mt-0.5 block">
                        {formatVital(selectedOutpatient.vitals?.weight, 'kg')}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Height (cm)</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono mt-0.5 block">
                        {formatVital(selectedOutpatient.vitals?.height, 'cm')}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">SpO2 (%)</span>
                      <span className="text-xs font-extrabold text-slate-800 font-mono mt-0.5 block">
                        {formatVital(selectedOutpatient.vitals?.spo2, '%')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Laboratory Results Section */}
                {selectedPatientLabResults.length > 0 && (
                  <div className="bg-white rounded-2xl border border-emerald-200/80 bg-emerald-50/10 p-6 shadow-sm">
                    <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
                      <FlaskConical className="h-4 w-4 text-emerald-600 animate-pulse" />
                      Laboratory Test Results (READY)
                    </h4>
                    <div className="space-y-3">
                      {selectedPatientLabResults.map((result, idx) => (
                        <div key={result.id || idx} className="bg-white p-4 rounded-xl border border-emerald-100/80 shadow-xs">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-slate-800">{result.test_name}</span>
                            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Validated</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mt-2">
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="block text-[10px] text-slate-400 font-mono font-bold uppercase">Result Value</span>
                              <p className="font-mono font-bold text-slate-800 mt-0.5">{result.result_details}</p>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-lg">
                              <span className="block text-[10px] text-slate-400 font-mono font-bold uppercase">Reference / Findings</span>
                              <p className="text-slate-700 mt-0.5">{result.findings}</p>
                            </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono mt-2">
                            Tested on: {result.date_completed ? new Date(result.date_completed).toLocaleString() : '—'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Doctor Clinical Notes or Lock Box */}
                {selectedOutpatient.isAwaitingPayment ? (
                  <div className="bg-amber-50/80 border-2 border-dashed border-amber-300 p-8 rounded-3xl text-center space-y-4 my-6 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
                      <Lock className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-amber-950">Consultation Locked: Payment Verification Pending</h3>
                      <p className="text-xs text-amber-800 max-w-lg mx-auto font-medium leading-relaxed">
                        <strong>{selectedOutpatient.name}</strong> ({selectedOutpatient.id}) has been registered at the OPD and sent to the <strong>Cashier Department</strong> for card/consultation fee payment verification.
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border border-amber-200/80 max-w-md mx-auto text-left text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-medium">Current Location:</span>
                        <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-mono text-[10px]">CASHIER DEPARTMENT</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="font-medium">Doctor Access:</span>
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-mono text-[10px]">LOCKED UNTIL PAYMENT CONFIRMED</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-700 font-mono italic">
                      ⚡ This consultation workspace will automatically unlock as soon as the Cashier verifies or collects payment.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Previous Patient Clinical History & Doctor Notes */}
                    {patientPastConsultations.length > 0 && (
                      <div className="bg-white rounded-2xl border border-indigo-100 bg-indigo-50/20 p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-indigo-100/80 pb-3">
                          <h4 className="text-xs font-black text-indigo-950 uppercase tracking-wider font-mono flex items-center gap-2">
                            <History className="h-4 w-4 text-indigo-600" />
                            Previous Medical History & Doctor's Notes ({patientPastConsultations.length})
                          </h4>
                          <span className="text-[10px] font-bold text-indigo-600 font-mono bg-indigo-100/60 px-2 py-0.5 rounded-full">
                            Patient HMS History
                          </span>
                        </div>

                        <div className="space-y-3">
                          {patientPastConsultations.map((past, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 border border-indigo-100 shadow-2xs space-y-2 text-xs">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-2 text-[11px]">
                                <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                                  <Stethoscope className="h-3.5 w-3.5 text-[#2A758C]" />
                                  <span>Dr. {past.doctor_name || 'Attending Physician'}</span>
                                </span>
                                <span className="font-mono text-slate-400 text-[10px]">
                                  {past.created_at ? new Date(past.created_at).toLocaleString() : 'Previous Visit'}
                                </span>
                              </div>
                              <div className="space-y-1 text-slate-700">
                                {past.chief_complaint && (
                                  <p><strong className="text-slate-900 font-mono text-[11px]">Chief Complaint:</strong> {past.chief_complaint}</p>
                                )}
                                <p><strong className="text-[#2A758C] font-mono text-[11px]">Diagnosis:</strong> <span className="font-bold text-slate-900">{past.diagnosis || 'Clinical evaluation'}</span></p>
                                <p><strong className="text-slate-900 font-mono text-[11px]">Doctor's Notes & Plan:</strong> {past.clinical_notes || past.treatment_plan || past.notes || 'Routine consultation'}</p>
                                {past.prescriptions && (
                                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono">
                                    <strong>Prescriptions:</strong> {typeof past.prescriptions === 'string' ? past.prescriptions : JSON.stringify(past.prescriptions)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Doctor Clinical Notes */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-[#2A758C]" />
                      Doctor's Notes
                    </h4>
                    {isNoteSaved && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Saved to HMS
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={selectedOutpatient.notes || ''}
                    onChange={(e) => handleOutpatientNotesChange(selectedOutpatient.id, e.target.value)}
                    onBlur={() => handleSaveOutpatientNotes(selectedOutpatient.id, selectedOutpatient.encounterId, selectedOutpatient.notes)}
                    placeholder="Diagnosis, observations, treatment plan..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2A758C] font-mono leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isSavingNote ? 'Saving notes to medical record...' : 'Auto-saves on blur or click Save Notes'}
                    </span>
                    <button
                      type="button"
                      disabled={isSavingNote}
                      onClick={() => handleSaveOutpatientNotes(selectedOutpatient.id, selectedOutpatient.encounterId, selectedOutpatient.notes)}
                      className="px-3.5 py-1.5 bg-[#2A758C] hover:bg-[#205d70] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isSavingNote ? 'Saving...' : 'Save Notes'}</span>
                    </button>
                  </div>
                </div>

                {/* Order Lab Tests Section */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#2A758C]" />
                    Order Lab Tests
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                    {/* Chemistry */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">CHEMISTRY</span>
                      <select
                        onChange={(e) => {
                          const test = CHEMISTRY_TESTS.find(t => t.name === e.target.value);
                          if (test) handleOrderOutpatientLabTest('CHEMISTRY', test.name, test.price);
                          e.target.value = '';
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                      >
                        <option value="">Select test...</option>
                        {CHEMISTRY_TESTS.map(t => (
                          <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>

                    {/* Serology */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">SEROLOGY</span>
                      <select
                        onChange={(e) => {
                          const test = SEROLOGY_TESTS.find(t => t.name === e.target.value);
                          if (test) handleOrderOutpatientLabTest('SEROLOGY', test.name, test.price);
                          e.target.value = '';
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                      >
                        <option value="">Select test...</option>
                        {SEROLOGY_TESTS.map(t => (
                          <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>

                    {/* Haematology */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">HAEMATOLOGY</span>
                      <select
                        onChange={(e) => {
                          const test = HAEMATOLOGY_TESTS.find(t => t.name === e.target.value);
                          if (test) handleOrderOutpatientLabTest('HAEMATOLOGY', test.name, test.price);
                          e.target.value = '';
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                      >
                        <option value="">Select test...</option>
                        {HAEMATOLOGY_TESTS.map(t => (
                          <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>

                    {/* Microbiology */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">MICROBIOLOGY</span>
                      <select
                        onChange={(e) => {
                          const test = MICROBIOLOGY_TESTS.find(t => t.name === e.target.value);
                          if (test) handleOrderOutpatientLabTest('MICROBIOLOGY', test.name, test.price);
                          e.target.value = '';
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                      >
                        <option value="">Select test...</option>
                        {MICROBIOLOGY_TESTS.map(t => (
                          <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>

                    {/* Parasitology */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">PARASITOLOGY</span>
                      <select
                        onChange={(e) => {
                          const test = PARASITOLOGY_TESTS.find(t => t.name === e.target.value);
                          if (test) handleOrderOutpatientLabTest('PARASITOLOGY', test.name, test.price);
                          e.target.value = '';
                        }}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                      >
                        <option value="">Select test...</option>
                        {PARASITOLOGY_TESTS.map(t => (
                          <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Active orders view */}
                  {selectedOutpatient.orderedTests && selectedOutpatient.orderedTests.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 mt-4 space-y-3">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Selected Lab Orders</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedOutpatient.orderedTests.map((t: any, idx: number) => (
                          <div key={t.name || idx} className="flex items-center gap-1.5 bg-[#A3D1E0]/20 border border-[#A3D1E0]/40 px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800">
                            <span>[{t.category}] {t.name} – ₦{Number(t.price || 0).toLocaleString()}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOutpatientLabTest(t.name)}
                              className="text-rose-500 hover:text-rose-700 font-extrabold ml-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-sm font-black text-slate-800 font-mono">
                          Total: <span className="text-[#2A758C]">₦{selectedOutpatient.orderedTests.reduce((sum: number, item: any) => sum + Number(item.price || 0), 0).toLocaleString()}</span>
                        </div>
                        <button
                          type="button"
                          disabled={isCompleting}
                          onClick={handleSendLabsToCashierDb}
                          className="flex items-center justify-center gap-2 bg-[#2A758C] hover:bg-[#1f5869] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
                          <span>Send to Cashier for Lab Payment</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Prescribe Medications Section */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <PlusCircle 
                        className="h-4.5 w-4.5 text-[#2A758C] cursor-pointer hover:scale-110 active:scale-95 transition-all" 
                        onClick={handleAddMedicationRow}
                        title="Add medication row"
                      />
                      Prescribe Medications
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddMedicationRow}
                      className="text-xs font-bold text-[#2A758C] hover:text-[#1f596b] flex items-center gap-1 bg-[#2A758C]/5 px-2.5 py-1 rounded-lg border border-[#2A758C]/10 hover:bg-[#2A758C]/10 transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Drug Row
                    </button>
                  </div>

                  <div className="space-y-3">
                    {prescriptionRows.map((row, index) => (
                      <div key={row.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div className="space-y-1">
                          {index === 0 && (
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Drug Name</label>
                          )}
                          <input
                            type="text"
                            list="meds-list"
                            value={row.name}
                            onChange={e => handleUpdateMedicationRow(row.id, 'name', e.target.value)}
                            placeholder="e.g. Paracetamol"
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                          />
                          {index === 0 && (
                            <datalist id="meds-list">
                              {MEDICATIONS_CATALOG.map(m => (
                                <option key={m} value={m} />
                              ))}
                            </datalist>
                          )}
                        </div>

                        <div className="space-y-1">
                          {index === 0 && (
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Dosage</label>
                          )}
                          <input
                            type="text"
                            placeholder="e.g. 500mg, 1g"
                            value={row.dose}
                            onChange={e => handleUpdateMedicationRow(row.id, 'dose', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          {index === 0 && (
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Frequency</label>
                          )}
                          <select
                            value={row.frequency}
                            onChange={e => handleUpdateMedicationRow(row.id, 'frequency', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2A758C] cursor-pointer"
                          >
                            <option value="">Select frequency...</option>
                            <option value="OD (Once Daily)">OD (Once Daily)</option>
                            <option value="BD (Twice Daily)">BD (Twice Daily)</option>
                            <option value="TDS (Three Times Daily)">TDS (Three Times Daily)</option>
                            <option value="QDS (Four Times Daily)">QDS (Four Times Daily)</option>
                            <option value="STAT (Immediately)">STAT (Immediately)</option>
                            <option value="PRN (As Needed)">PRN (As Needed)</option>
                            <option value="Nocte (At Bedtime)">Nocte (At Bedtime)</option>
                            <option value="q4h (Every 4 Hours)">q4h (Every 4 Hours)</option>
                            <option value="q6h (Every 6 Hours)">q6h (Every 6 Hours)</option>
                            <option value="q8h (Every 8 Hours)">q8h (Every 8 Hours)</option>
                            <option value="q12h (Every 12 Hours)">q12h (Every 12 Hours)</option>
                            <option value="Weekly">Weekly</option>
                            {row.frequency && ![
                              'OD (Once Daily)',
                              'BD (Twice Daily)',
                              'TDS (Three Times Daily)',
                              'QDS (Four Times Daily)',
                              'STAT (Immediately)',
                              'PRN (As Needed)',
                              'Nocte (At Bedtime)',
                              'q4h (Every 4 Hours)',
                              'q6h (Every 6 Hours)',
                              'q8h (Every 8 Hours)',
                              'q12h (Every 12 Hours)',
                              'Weekly'
                            ].includes(row.frequency) && (
                              <option value={row.frequency}>{row.frequency}</option>
                            )}
                          </select>
                        </div>

                        <div className="space-y-1">
                          {index === 0 && (
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Duration</label>
                          )}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="e.g. 5 days, 1 week"
                              value={row.duration}
                              onChange={e => handleUpdateMedicationRow(row.id, 'duration', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                            />
                            <div className="flex gap-1 shrink-0">
                              {prescriptionRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMedicationRow(row.id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl font-bold cursor-pointer border border-rose-100 flex items-center justify-center transition-all"
                                  title="Remove medication"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              {index === prescriptionRows.length - 1 && (
                                <button
                                  type="button"
                                  onClick={handleAddMedicationRow}
                                  className="bg-[#2A758C] hover:bg-[#1f596b] text-white p-2 rounded-xl font-bold cursor-pointer flex items-center justify-center transition-all"
                                  title="Add another medication"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Real-time calculated price total & Send to Cashier button for prescribed medications */}
                  {prescriptionRows.some(r => r.name && r.name.trim() !== '') && (
                    <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-sm font-black text-slate-800 font-mono">
                        Total: <span className="text-[#2A758C]">₦{prescriptionRows.filter(r => r.name && r.name.trim() !== '').reduce((sum, r) => sum + getMedicationPrice(r.name.trim()), 0).toLocaleString()}</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-2">({prescriptionRows.filter(r => r.name && r.name.trim() !== '').length} drug{prescriptionRows.filter(r => r.name && r.name.trim() !== '').length > 1 ? 's' : ''})</span>
                      </div>
                      <button
                        type="button"
                        disabled={isCompleting}
                        onClick={handleSendMedsToCashierDb}
                        className="flex items-center justify-center gap-2 bg-[#2A758C] hover:bg-[#1f5869] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pill className="w-4 h-4" />}
                        <span>Send to Cashier for Pharmacy Payment</span>
                      </button>
                    </div>
                  )}

                  {/* Active prescriptions summary view */}
                  {selectedOutpatient.prescribedMedications && selectedOutpatient.prescribedMedications.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Prescribed Medicines Summary</span>
                      <div className="space-y-2">
                        {selectedOutpatient.prescribedMedications.map((m: any) => (
                          <div key={m.id} className="flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-150">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{m.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.dose} — {m.frequency} — for {m.duration}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOutpatientPrescription(m.id)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Consultation Actions Section */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Consultation Actions</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Admit Patient to Ward Card */}
                    <div className="border border-amber-200 bg-amber-50/30 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                      <div>
                        <h5 className="text-xs font-extrabold text-amber-900 uppercase tracking-wide font-mono flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" />
                          Admit Patient to Ward
                        </h5>
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                          Use when patient requires inpatient care. OPD overview and Nursing will be notified to assign a ward and bed.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAdmitOutpatient}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        Admit Patient → Nursing
                      </button>
                    </div>

                    {/* Complete Consultation Card */}
                    <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                      <div>
                        <h5 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide font-mono flex items-center gap-1.5">
                          <Check className="h-4 w-4" />
                          Complete Consultation
                        </h5>
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                          Saves clinical consultation notes, orders, and diagnostic data to the central HMS (Hospital Management System). Discharges patient from waiting list.
                        </p>
                      </div>

                      {selectedOutpatient.isDbPatient ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            disabled={isCompleting}
                            onClick={() => handleCompleteConsultationDb('lab')}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {isCompleting ? (
                              <Loader2 className="animate-spin h-4 w-4 text-white" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            )}
                            Order Labs & Route to Cashier (YES)
                          </button>
                          
                          <button
                            type="button"
                            disabled={isCompleting}
                            onClick={() => handleCompleteConsultationDb('pharmacy')}
                            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                          >
                            {isCompleting ? (
                              <Loader2 className="animate-spin h-4 w-4 text-white" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-[#A3D1E0]" />
                            )}
                            Prescribe & Route to Cashier (NO)
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCompleteConsultation}
                          className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-[#A3D1E0]" />
                          Complete Consultation
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Select an outpatient from the queue to start clinical consultations.
              </div>
            )
          ) : (
            selectedAdmitted ? (
              <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header Profile Info card for Admitted Patients */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl font-black text-slate-900">{selectedAdmitted.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest bg-sky-100 text-sky-800 border border-sky-200 font-mono uppercase">
                          ADMITTED
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        {selectedAdmitted.id} | {selectedAdmitted.gender} | DOB: {selectedAdmitted.dateOfBirth}
                      </p>
                      <p className="text-xs text-[#2A758C] font-semibold mt-2">
                        {selectedAdmitted.ward} – Bed {selectedAdmitted.bed}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">
                        Admitted: {selectedAdmitted.admittedDate}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-3.5 text-right justify-between sm:justify-end">
                        <div>
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Discharge bill</span>
                          <span className="text-sm font-extrabold text-slate-800">₦{Number(selectedAdmitted.dischargeBill || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenPatientHistory(selectedAdmitted.hospitalNumber || selectedAdmitted.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
                        title="View patient history, previous consultations, vitals & lab records"
                      >
                        <History className="h-3.5 w-3.5 text-indigo-600" />
                        <span>History</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPatientHistory(selectedAdmitted.hospitalNumber || selectedAdmitted.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs"
                        title="View patient history, previous consultations, vitals & lab records"
                      >
                        <History className="h-3.5 w-3.5 text-indigo-600" />
                        <span>History</span>
                      </button>

                      <ExportButton
                        exportType="medical-records"
                        patientId={selectedAdmitted.hospitalNumber || selectedAdmitted.id}
                        label="Download HMS"
                        className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-extrabold shadow-xs"
                        onSuccess={(msg) => showToast(msg)}
                        onFailure={(msg) => showToast(msg)}
                      />

                      <button 
                        type="button"
                        onClick={handleOpenDischargeModal}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <LogOut className="h-3.5 w-3.5 text-white" />
                        <span>Discharge Patient</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter records for specific date */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#2A758C]" />
                        View records for:
                      </span>
                      <div className="relative">
                        <input
                          type="date"
                          value={recordDateFilter}
                          onChange={e => setRecordDateFilter(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2A758C]"
                        />
                      </div>
                      {recordDateFilter && (
                        <button 
                          type="button"
                          onClick={() => setRecordDateFilter('')}
                          className="text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Clear Filter
                        </button>
                      )}
                    </div>
                    {recordDateFilter && (
                      <span className="text-[11px] font-mono text-[#2A758C] bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 font-semibold">
                        Filtering records for: {recordDateFilter}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub Tab selection for Admitted Patient details */}
                <div className="flex border-b border-slate-200 bg-white p-1 rounded-xl border">
                  {[
                    { id: 'overview', label: 'Overview & Notes' },
                    { id: 'vitals', label: 'Vitals' },
                    { id: 'medications', label: 'Medications' },
                    { id: 'observations', label: 'Observations' },
                    { id: 'charges', label: 'Charges' },
                    { id: 'new_orders', label: 'New Orders' }
                  ].map((subTab) => (
                    <button
                      key={subTab.id}
                      onClick={() => setAdmittedSubTab(subTab.id as any)}
                      className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                        admittedSubTab === subTab.id
                          ? 'bg-[#A3D1E0] text-slate-950 font-black shadow-xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {subTab.label}
                    </button>
                  ))}
                </div>

                {/* Inner tab contents */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm min-h-[300px]">
                  
                  {/* OVERVIEW TAB */}
                  {admittedSubTab === 'overview' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        <div className="md:col-span-2 space-y-6">
                          {/* 1. Clinical Notes / Diagnosis */}
                          <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-[#2A758C]" />
                                Current Notes / Diagnosis
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">Admission diagnosis</span>
                            </div>
                            <textarea
                              rows={3}
                              value={admittedNotesInput}
                              onChange={(e) => setAdmittedNotesInput(e.target.value)}
                              onBlur={() => handleSaveAdmittedNotes(admittedNotesInput)}
                              placeholder="Clinical diagnosis and current status notes..."
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2A758C] font-mono leading-relaxed"
                            />
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[10px] text-slate-400 font-mono">Auto-saves on blur</span>
                              <button
                                type="button"
                                onClick={() => handleSaveAdmittedNotes(admittedNotesInput)}
                                className="px-3.5 py-1.5 bg-[#2A758C] hover:bg-[#205d70] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Notes</span>
                              </button>
                            </div>
                          </div>

                          {/* 2. Doctor's Orders & Directives (Separated) */}
                          <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <Stethoscope className="h-4 w-4 text-indigo-600" />
                                Doctor's Orders / Clinical Directives
                              </span>
                              <span className="text-[10px] text-indigo-600 font-mono font-bold">Nursing & Ward Directives</span>
                            </div>
                            <textarea
                              rows={3}
                              value={admittedDoctorOrdersInput}
                              onChange={(e) => setAdmittedDoctorOrdersInput(e.target.value)}
                              placeholder="Directives for nursing team: IV fluid rate, positioning, monitoring intervals..."
                              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed"
                            />
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[10px] text-slate-400 font-mono">Appends to clinical orders history</span>
                              <button
                                type="button"
                                onClick={() => handleSaveDoctorOrders(admittedDoctorOrdersInput)}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Doctor's Orders</span>
                              </button>
                            </div>
                          </div>

                          {/* 3. Doctor's Orders History Log */}
                          {selectedAdmitted.doctorOrdersHistory && selectedAdmitted.doctorOrdersHistory.length > 0 && (
                            <div className="space-y-2">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Doctor's Directives History</span>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {selectedAdmitted.doctorOrdersHistory.map((h: any, idx: number) => (
                                  <div key={h.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pb-1 border-b border-slate-200/50 mb-1">
                                      <span className="font-bold text-slate-700">{h.doctorName || 'Doctor'}</span>
                                      <span>{h.timestamp}</span>
                                    </div>
                                    <p className="text-slate-800 font-mono whitespace-pre-wrap">{h.orderText}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4 h-fit">
                          <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">Inpatient Profile Details</h5>
                          
                          <div className="space-y-3.5 divide-y divide-slate-100 text-xs">
                            <div className="flex justify-between py-1">
                              <span className="text-slate-400">Ward / Bed</span>
                              <span className="font-bold text-slate-800">{selectedAdmitted.ward} / {selectedAdmitted.bed}</span>
                            </div>
                            <div className="flex justify-between pt-2.5">
                              <span className="text-slate-400">Religion</span>
                              <span className="font-bold text-slate-800">{selectedAdmitted.religion || '—'}</span>
                            </div>
                            <div className="flex justify-between pt-2.5">
                              <span className="text-slate-400">EDD</span>
                              <span className="font-bold text-slate-800 font-mono">{selectedAdmitted.edd || '—'}</span>
                            </div>
                            <div className="flex justify-between pt-2.5">
                              <span className="text-slate-400">Gravida / Para</span>
                              <span className="font-bold text-slate-800">{selectedAdmitted.gravidaPara || '—'}</span>
                            </div>
                            <div className="flex justify-between pt-2.5">
                              <span className="text-slate-400">Total Charged</span>
                              <span className="font-black text-slate-900 font-mono">₦{Number(selectedAdmitted.totalCharged || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between pt-2.5">
                              <span className="text-slate-400">Payments Made</span>
                              <span className="font-black text-emerald-700 font-mono">₦{Number(selectedAdmitted.paymentsMade || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* VITALS TAB */}
                  {admittedSubTab === 'vitals' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Vitals Logs History</h4>
                        {recordDateFilter && (
                          <span className="text-[10px] text-slate-400 font-mono">Showing entries matching date: {recordDateFilter}</span>
                        )}
                      </div>
                      
                      {(() => {
                        const filteredVitals = (selectedAdmitted.vitalsRecords || []).filter((rec: any) => 
                          matchesDateFilter(rec.timestamp, recordDateFilter)
                        );

                        if (selectedAdmitted.vitalsRecords?.length === 0) {
                          return <p className="text-xs text-slate-400 font-medium py-8 text-center">No vitals logs recorded for this admission session.</p>;
                        }

                        if (filteredVitals.length === 0) {
                          return (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <p className="text-xs text-slate-500 font-bold">No records found for the selected date.</p>
                              <button 
                                onClick={() => setRecordDateFilter('')}
                                className="mt-2 text-xs text-[#2A758C] font-bold hover:underline cursor-pointer"
                              >
                                View all vitals logs
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-4">
                            {filteredVitals.map((rec: any, idx: number) => (
                              <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-150">
                                <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/50 mb-3 text-[11px] font-mono text-slate-400">
                                  <span className="font-bold text-slate-700">{rec.timestamp}</span>
                                  <span>By: <span className="text-[#2A758C] font-bold">{rec.recordedBy}</span></span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                  <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">BP</span>
                                    <span className="text-xs font-black text-slate-800">{rec.bp}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">HR (Pulse)</span>
                                    <span className="text-xs font-black text-slate-800">{rec.hr}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Temp</span>
                                    <span className="text-xs font-black text-slate-800">{rec.temp}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">RR</span>
                                    <span className="text-xs font-black text-slate-800">{rec.rr}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">SpO₂</span>
                                    <span className="text-xs font-black text-slate-800">{rec.spo2}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* MEDICATIONS TAB */}
                  {admittedSubTab === 'medications' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Inpatient Medications & Administration Logs</h4>
                        <button
                          type="button"
                          onClick={() => setAddMedLogModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A758C] hover:bg-[#1f5869] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Medication Log</span>
                        </button>
                      </div>
                      
                      {(() => {
                        const filteredMeds = (selectedAdmitted.medicationsRecords || []).filter((rec: any) => 
                          matchesDateFilter(rec.timestamp, recordDateFilter)
                        );

                        if (selectedAdmitted.medicationsRecords?.length === 0) {
                          return <p className="text-xs text-slate-400 font-medium py-8 text-center">No medications logs recorded for this admission session.</p>;
                        }

                        if (filteredMeds.length === 0) {
                          return (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <p className="text-xs text-slate-500 font-bold">No records found for the selected date.</p>
                              <button 
                                onClick={() => setRecordDateFilter('')}
                                className="mt-2 text-xs text-[#2A758C] font-bold hover:underline cursor-pointer"
                              >
                                View all medication logs
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {filteredMeds.map((rec: any, idx: number) => {
                              const isPending = rec.status === 'Pending';
                              const isDispensed = rec.status === 'Dispensed';
                              const isAdministered = rec.status === 'Administered';
                              const isCancelled = rec.status === 'Cancelled';

                              return (
                                <div key={rec.id || idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-wide">{rec.name}</p>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                          isAdministered ? 'bg-emerald-100 text-emerald-800' :
                                          isDispensed ? 'bg-sky-100 text-sky-800' :
                                          isCancelled ? 'bg-rose-100 text-rose-800' :
                                          'bg-amber-100 text-amber-800'
                                        }`}>
                                          {rec.status || 'Pending'}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                        Dose: <strong className="text-slate-700">{rec.dose || '—'}</strong> | Qty: {rec.quantity || '1'} | Freq: {rec.frequency || 'OD'}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      {(isPending || isDispensed) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedMedToAdminister(rec);
                                            setAdministerModalOpen(true);
                                          }}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                                        >
                                          <Check className="h-3 w-3" /> Administer
                                        </button>
                                      )}
                                      {isPending && (
                                        <button
                                          type="button"
                                          onClick={() => handleCancelMedication(rec.id)}
                                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold cursor-pointer transition-all"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono text-slate-400 gap-1 pt-1">
                                    <span>Ordered: {rec.timestamp} by <strong className="text-slate-600">{rec.orderedBy || 'Doctor'}</strong></span>
                                    {rec.administeredAt && (
                                      <span className="text-emerald-700 font-semibold">
                                        Administered at {rec.administeredAt} by {rec.administeredBy || 'Nurse'}
                                      </span>
                                    )}
                                  </div>

                                  {rec.note && (
                                    <p className="text-xs text-slate-600 bg-white border border-slate-100 rounded-lg p-2 font-mono italic">
                                      "{rec.note}"
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* OBSERVATIONS TAB */}
                  {admittedSubTab === 'observations' && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Clinical Observations & Ward Round Logs</h4>
                        <button
                          type="button"
                          onClick={() => setObsModalOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A758C] hover:bg-[#1f5869] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Observation</span>
                        </button>
                      </div>
                      
                      {(() => {
                        const filteredObs = (selectedAdmitted.observationsRecords || []).filter((rec: any) => 
                          matchesDateFilter(rec.timestamp, recordDateFilter)
                        );

                        if (selectedAdmitted.observationsRecords?.length === 0) {
                          return <p className="text-xs text-slate-400 font-medium py-8 text-center">No clinical observation logs recorded for this admission session.</p>;
                        }

                        if (filteredObs.length === 0) {
                          return (
                            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <p className="text-xs text-slate-500 font-bold">No records found for the selected date.</p>
                              <button 
                                onClick={() => setRecordDateFilter('')}
                                className="mt-2 text-xs text-[#2A758C] font-bold hover:underline cursor-pointer"
                              >
                                View all observations
                              </button>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {filteredObs.map((rec: any, idx: number) => (
                              <div key={rec.id || idx} className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-2">
                                <div className="flex justify-between items-center border-b border-slate-200/50 pb-2 text-[11px] font-mono text-slate-400">
                                  <span className="font-bold text-[#2A758C] uppercase bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                                    {rec.category || 'Clinical Note'}
                                  </span>
                                  <span>{rec.timestamp}</span>
                                </div>
                                <p className="text-xs text-slate-800 leading-relaxed font-mono whitespace-pre-wrap">
                                  {rec.note}
                                </p>
                                <div className="text-[10px] text-right font-mono text-slate-400">
                                  Recorded by: <span className="font-bold text-slate-700">{rec.recordedBy}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* CHARGES TAB */}
                  {admittedSubTab === 'charges' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Total Charged</span>
                          <span className="text-lg font-black text-slate-800 font-mono">₦{Number(selectedAdmitted.totalCharged || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Payments Made</span>
                          <span className="text-lg font-black text-emerald-700 font-mono">₦{Number(selectedAdmitted.paymentsMade || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Outstanding Balance</span>
                          <span className={`text-lg font-black font-mono ${Number(selectedAdmitted.totalCharged || 0) - Number(selectedAdmitted.paymentsMade || 0) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                            ₦{Math.max(0, Number(selectedAdmitted.totalCharged || 0) - Number(selectedAdmitted.paymentsMade || 0)).toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Discharge Bill</span>
                          <span className="text-lg font-black text-indigo-700 font-mono">₦{Number(selectedAdmitted.dischargeBill || selectedAdmitted.totalCharged || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Detailed Invoice Breakdown</h5>
                          {recordDateFilter && (
                            <span className="text-[10px] text-slate-400 font-mono">Filtered for: {recordDateFilter}</span>
                          )}
                        </div>
                        
                        {(() => {
                          const filteredCharges = (selectedAdmitted.chargesList || []).filter((charge: any) => 
                            matchesDateFilter(charge.timestamp, recordDateFilter)
                          );

                          if (selectedAdmitted.chargesList?.length === 0) {
                            return (
                              <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl">
                                <p className="text-xs text-slate-400 font-medium">No specific secondary charges recorded yet.</p>
                                <p className="text-[10px] text-slate-400 mt-1">Core room fee applies at discharge.</p>
                              </div>
                            );
                          }

                          if (filteredCharges.length === 0) {
                            return (
                              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-xs text-slate-500 font-bold">No records found for the selected date.</p>
                                <button 
                                  onClick={() => setRecordDateFilter('')}
                                  className="mt-2 text-xs text-[#2A758C] font-bold hover:underline cursor-pointer"
                                >
                                  View all charges
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl overflow-hidden">
                              {filteredCharges.map((charge: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 text-xs">
                                  <div>
                                    <p className="font-bold text-slate-800">{charge.item}</p>
                                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{charge.timestamp}</p>
                                  </div>
                                  <span className="font-bold text-slate-700 font-mono">₦{Number(charge.amount || 0).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* NEW ORDERS TAB */}
                  {admittedSubTab === 'new_orders' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-150 pb-3">
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider font-mono">Place New Inpatient Order</h4>
                        
                        {/* Selector for new order type */}
                        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                          {['Medication', 'Injection', 'Lab Test'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setOrderType(type as any)}
                              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                                orderType === type 
                                  ? 'bg-[#A3D1E0] text-slate-950 font-black shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Header notification details on target */}
                      <p className="text-xs text-[#2A758C] font-bold flex items-center gap-1.5 bg-sky-50/50 p-2.5 rounded-xl border border-sky-100">
                        <ArrowRight className="h-4 w-4" />
                        {orderType === 'Medication' && '→ Sends to PHARMACY — Pharmacist prepares and Nursing picks up for patient'}
                        {orderType === 'Injection' && '→ Sends to NURSING — Nurse administers injection to patient'}
                        {orderType === 'Lab Test' && '→ Sends to LABORATORY — Lab runs test and reports results back'}
                      </p>

                      <form onSubmit={(e) => { e.preventDefault(); handleSendOrder(); }} className="space-y-4">
                        
                        {/* 1. MEDICATION ORDER INPUTS */}
                        {orderType === 'Medication' && (
                          <div className="space-y-3">
                            {medOrderItems.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-150 relative">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Item {idx + 1}</label>
                                  <select
                                    value={item.name}
                                    onChange={(e) => {
                                      const updated = [...medOrderItems];
                                      updated[idx].name = e.target.value;
                                      setMedOrderItems(updated);
                                    }}
                                    className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                                  >
                                    <option value="">-- Select medication --</option>
                                    {MEDICATIONS_CATALOG.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Dose</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 1g, 2 ampoules"
                                    value={item.dose}
                                    onChange={(e) => {
                                      const updated = [...medOrderItems];
                                      updated[idx].dose = e.target.value;
                                      setMedOrderItems(updated);
                                    }}
                                    className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none font-mono"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Quantity</label>
                                  <input
                                    type="text"
                                    placeholder="Quantity"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const updated = [...medOrderItems];
                                      updated[idx].quantity = e.target.value;
                                      setMedOrderItems(updated);
                                    }}
                                    className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Frequency</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="e.g. BD, TDS"
                                      value={item.frequency}
                                      onChange={(e) => {
                                        const updated = [...medOrderItems];
                                        updated[idx].frequency = e.target.value;
                                        setMedOrderItems(updated);
                                      }}
                                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                                    />
                                    {medOrderItems.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setMedOrderItems(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => setMedOrderItems(prev => [...prev, { name: '', dose: '', quantity: '', frequency: '' }])}
                              className="text-xs text-[#2A758C] hover:text-[#1f596b] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add another item
                            </button>
                          </div>
                        )}

                        {/* 2. INJECTION ORDER INPUTS */}
                        {orderType === 'Injection' && (
                          <div className="space-y-3">
                            {injOrderItems.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-150 relative">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Item {idx + 1}</label>
                                  <select
                                    value={item.name}
                                    onChange={(e) => {
                                      const updated = [...injOrderItems];
                                      updated[idx].name = e.target.value;
                                      setInjOrderItems(updated);
                                    }}
                                    className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                                  >
                                    <option value="">-- Select injection --</option>
                                    {INJECTIONS_CATALOG.map(m => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Dose</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 1g, 2 ampoules"
                                    value={item.dose}
                                    onChange={(e) => {
                                      const updated = [...injOrderItems];
                                      updated[idx].dose = e.target.value;
                                      setInjOrderItems(updated);
                                    }}
                                    className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none font-mono"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Quantity</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="Quantity"
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const updated = [...injOrderItems];
                                        updated[idx].quantity = e.target.value;
                                        setInjOrderItems(updated);
                                      }}
                                      className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                                    />
                                    {injOrderItems.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => setInjOrderItems(prev => prev.filter((_, i) => i !== idx))}
                                        className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => setInjOrderItems(prev => [...prev, { name: '', dose: '', quantity: '' }])}
                              className="text-xs text-[#2A758C] hover:text-[#1f596b] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add another item
                            </button>
                          </div>
                        )}

                        {/* 3. LAB TEST ORDER INPUTS */}
                        {orderType === 'Lab Test' && (
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                            {/* Chemistry */}
                            <div className="space-y-1.5">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">CHEMISTRY</span>
                              <select
                                value={labOrderTests.CHEMISTRY}
                                onChange={(e) => setLabOrderTests({ ...labOrderTests, CHEMISTRY: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                              >
                                <option value="">Select test...</option>
                                {CHEMISTRY_TESTS.map(t => (
                                  <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                                ))}
                              </select>
                            </div>

                            {/* Serology */}
                            <div className="space-y-1.5">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">SEROLOGY</span>
                              <select
                                value={labOrderTests.SEROLOGY}
                                onChange={(e) => setLabOrderTests({ ...labOrderTests, SEROLOGY: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                              >
                                <option value="">Select test...</option>
                                {SEROLOGY_TESTS.map(t => (
                                  <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                                ))}
                              </select>
                            </div>

                            {/* Haematology */}
                            <div className="space-y-1.5">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">HAEMATOLOGY</span>
                              <select
                                value={labOrderTests.HAEMATOLOGY}
                                onChange={(e) => setLabOrderTests({ ...labOrderTests, HAEMATOLOGY: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                              >
                                <option value="">Select test...</option>
                                {HAEMATOLOGY_TESTS.map(t => (
                                  <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                                ))}
                              </select>
                            </div>

                            {/* Microbiology */}
                            <div className="space-y-1.5">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">MICROBIOLOGY</span>
                              <select
                                value={labOrderTests.MICROBIOLOGY}
                                onChange={(e) => setLabOrderTests({ ...labOrderTests, MICROBIOLOGY: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                              >
                                <option value="">Select test...</option>
                                {MICROBIOLOGY_TESTS.map(t => (
                                  <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                                ))}
                              </select>
                            </div>

                            {/* Parasitology */}
                            <div className="space-y-1.5">
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">PARASITOLOGY</span>
                              <select
                                value={labOrderTests.PARASITOLOGY}
                                onChange={(e) => setLabOrderTests({ ...labOrderTests, PARASITOLOGY: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl text-slate-800 focus:outline-none"
                              >
                                <option value="">Select test...</option>
                                {PARASITOLOGY_TESTS.map(t => (
                                  <option key={t.name} value={t.name}>{t.name} - ₦{t.price.toLocaleString()}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}

                        {/* Order Notes (optional) */}
                        <div className="space-y-1 pt-2">
                          <label className="block text-[10px] font-bold text-slate-400 font-mono uppercase">Order Notes (optional)</label>
                          <textarea
                            rows={2}
                            value={orderNotes}
                            onChange={e => setOrderNotes(e.target.value)}
                            placeholder="e.g. Give before meals, STAT, continue until further notice…"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2A758C] font-mono leading-relaxed"
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-3">
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl flex items-center gap-1.5 cursor-pointer text-xs shadow-sm"
                          >
                            Send Order → {orderType === 'Medication' ? 'Pharmacy' : orderType === 'Injection' ? 'Nursing' : 'Laboratory'}
                          </button>
                        </div>

                      </form>

                      {/* Display already sent orders with interactive status tracking */}
                      {selectedAdmitted.newOrdersList && selectedAdmitted.newOrdersList.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Sent Orders Tracking History</span>
                            <span className="text-[10px] text-slate-400 font-mono">{selectedAdmitted.newOrdersList.length} orders</span>
                          </div>

                          <div className="space-y-3">
                            {selectedAdmitted.newOrdersList.map((ord: any) => (
                              <div key={ord.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 shadow-2xs">
                                <div className="flex flex-wrap justify-between items-center gap-2 pb-2 border-b border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-[#2A758C] font-mono">{ord.id}</span>
                                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono uppercase font-bold">
                                      {ord.type} → {ord.target}
                                    </span>
                                  </div>

                                  {/* Status selector buttons */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-mono">Status:</span>
                                    <select
                                      value={ord.status}
                                      onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                                        ord.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                        ord.status === 'In Progress' ? 'bg-sky-50 text-sky-800 border-sky-200' :
                                        ord.status === 'Accepted' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                                        ord.status === 'Cancelled' ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                        'bg-amber-50 text-amber-800 border-amber-200'
                                      }`}
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Accepted">Accepted</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Completed">Completed</option>
                                      <option value="Cancelled">Cancelled</option>
                                    </select>
                                  </div>
                                </div>

                                <p className="text-slate-700 font-mono leading-relaxed">{ord.description}</p>
                                <p className="text-[10px] text-slate-400 text-right font-mono">Placed on: {ord.timestamp}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Select an admitted patient to review history logs and place orders.
              </div>
            )
          )}
        </div>

      </div>
      )}

      {/* PATIENT MEDICAL HISTORY MODAL */}
      <AnimatePresence>
        {historyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                    <History className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold flex items-center gap-2">
                      <span>Central HMS Patient Medical History</span>
                      {patientHistoryData?.patient?.hospital_number && (
                        <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded font-mono">
                          {patientHistoryData.patient.hospital_number}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {patientHistoryData?.patient?.name || 'Patient'} • {patientHistoryData?.patient?.gender || '—'} • Age: {patientHistoryData?.patient?.age || patientHistoryData?.patient?.date_of_birth || '—'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 overflow-x-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('consultations')}
                  className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeHistoryTab === 'consultations'
                      ? 'border-[#2A758C] text-[#2A758C]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Stethoscope className="h-3.5 w-3.5" />
                  <span>Consultations ({patientHistoryData?.consultations?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('vitals')}
                  className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeHistoryTab === 'vitals'
                      ? 'border-[#2A758C] text-[#2A758C]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" />
                  <span>Vitals Logs ({patientHistoryData?.vitals?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('labs')}
                  className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeHistoryTab === 'labs'
                      ? 'border-[#2A758C] text-[#2A758C]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  <span>Laboratory ({patientHistoryData?.labOrders?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('prescriptions')}
                  className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeHistoryTab === 'prescriptions'
                      ? 'border-[#2A758C] text-[#2A758C]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Pill className="h-3.5 w-3.5" />
                  <span>Prescriptions ({patientHistoryData?.pharmacyOrders?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveHistoryTab('invoices')}
                  className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeHistoryTab === 'invoices'
                      ? 'border-[#2A758C] text-[#2A758C]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Invoices & Payments ({patientHistoryData?.invoices?.length || 0})</span>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                {historyLoading ? (
                  <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-[#2A758C]" />
                    <p className="text-xs font-bold">Querying PostgreSQL Central HMS Database...</p>
                  </div>
                ) : !patientHistoryData ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No medical history records available for this patient.
                  </div>
                ) : (
                  <>
                    {/* CONSULTATIONS TAB */}
                    {activeHistoryTab === 'consultations' && (
                      <div className="space-y-4">
                        {patientHistoryData.consultations?.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-8">No prior consultation records recorded.</p>
                        ) : (
                          patientHistoryData.consultations.map((c: any) => (
                            <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-black text-slate-900 block">
                                    {c.diagnosis || 'Clinical Consultation'}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Encounter: {c.encounter_id || '—'} • Doctor: <strong className="text-slate-700">{c.doctor_name || c.doctor_id || 'Doctor'}</strong>
                                  </span>
                                </div>
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                                  {c.created_at ? new Date(c.created_at).toLocaleString() : '—'}
                                </span>
                              </div>
                              {c.chief_complaint && (
                                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 font-mono">
                                  <strong className="text-slate-700">Complaint:</strong> {c.chief_complaint}
                                </p>
                              )}
                              {c.clinical_notes && (
                                <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-100 font-mono">
                                  <strong className="text-slate-700">Doctor Notes:</strong> {c.clinical_notes}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* VITALS TAB */}
                    {activeHistoryTab === 'vitals' && (
                      <div className="space-y-3">
                        {patientHistoryData.vitals?.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-8">No vitals logs recorded.</p>
                        ) : (
                          patientHistoryData.vitals.map((v: any) => (
                            <div key={v.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                              <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-200/60 text-[11px] font-mono text-slate-500">
                                <span>Recorded: <strong className="text-slate-700">{v.recorded_at ? new Date(v.recorded_at).toLocaleString() : '—'}</strong></span>
                                <span>By: <strong className="text-[#2A758C]">{v.nurse_name || v.recorded_by || 'Nurse'}</strong></span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-center">
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="block text-[9px] text-slate-400 font-bold uppercase">BP</span>
                                  <span className="text-xs font-black text-slate-800">{v.blood_pressure || '—'}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Pulse</span>
                                  <span className="text-xs font-black text-slate-800">{v.pulse_rate ? `${v.pulse_rate} bpm` : '—'}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Temp</span>
                                  <span className="text-xs font-black text-slate-800">{v.temperature ? `${v.temperature}°C` : '—'}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Weight</span>
                                  <span className="text-xs font-black text-slate-800">{v.weight ? `${v.weight} kg` : '—'}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Height</span>
                                  <span className="text-xs font-black text-slate-800">{v.height ? `${v.height} cm` : '—'}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Resp Rate</span>
                                  <span className="text-xs font-black text-slate-800">{v.respiratory_rate || '—'}</span>
                                </div>
                                <div className="bg-white p-2 rounded-lg border border-slate-100">
                                  <span className="block text-[9px] text-slate-400 font-bold uppercase">SpO₂</span>
                                  <span className="text-xs font-black text-slate-800">{v.spo2 ? `${v.spo2}%` : '—'}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* LAB ORDERS TAB */}
                    {activeHistoryTab === 'labs' && (
                      <div className="space-y-3">
                        {patientHistoryData.labOrders?.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-8">No laboratory orders or results found.</p>
                        ) : (
                          patientHistoryData.labOrders.map((lo: any) => (
                            <div key={lo.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-extrabold text-slate-900 block">
                                    [{lo.category || 'LAB'}] {lo.test_name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Order ID: {lo.id} • Status: <strong className="text-slate-700">{lo.status}</strong>
                                  </span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                  lo.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {lo.status}
                                </span>
                              </div>
                              {lo.result_value && (
                                <div className="bg-white p-2.5 rounded-lg border border-slate-100 text-xs font-mono">
                                  <span className="text-slate-500 font-bold">Result: </span>
                                  <strong className="text-emerald-700">{lo.result_value}</strong>
                                  {lo.reference_range && <span className="text-slate-400 ml-2">(Ref: {lo.reference_range})</span>}
                                </div>
                              )}
                              {lo.technician_notes && (
                                <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100 font-mono italic">
                                  "{lo.technician_notes}"
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* PRESCRIPTIONS TAB */}
                    {activeHistoryTab === 'prescriptions' && (
                      <div className="space-y-3">
                        {patientHistoryData.pharmacyOrders?.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-8">No pharmacy prescription records found.</p>
                        ) : (
                          patientHistoryData.pharmacyOrders.map((po: any) => (
                            <div key={po.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-extrabold text-slate-900 block">
                                    Order #{po.id}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Date: {po.created_at ? new Date(po.created_at).toLocaleString() : '—'}
                                  </span>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                                  po.status === 'Dispensed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {po.status}
                                </span>
                              </div>
                              {po.items && Array.isArray(po.items) && (
                                <div className="space-y-1.5">
                                  {po.items.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-2 rounded-lg border border-slate-100 text-xs flex justify-between">
                                      <span className="font-bold text-slate-800">{item.name || item.drug_name}</span>
                                      <span className="text-slate-500 font-mono">{item.dose || item.dosage} • {item.frequency} • {item.duration}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* INVOICES TAB */}
                    {activeHistoryTab === 'invoices' && (
                      <div className="space-y-3">
                        {patientHistoryData.invoices?.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-8">No invoice records found.</p>
                        ) : (
                          patientHistoryData.invoices.map((inv: any) => (
                            <div key={inv.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex justify-between items-center">
                              <div>
                                <span className="text-xs font-extrabold text-slate-900 block">
                                  Invoice #{inv.invoice_number || inv.id}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {inv.created_at ? new Date(inv.created_at).toLocaleString() : '—'} • {inv.notes || 'Medical services'}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-black text-[#2A758C] block font-mono">
                                  ₦{Number(inv.total_amount || 0).toLocaleString()}
                                </span>
                                <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded ${
                                  inv.payment_status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {inv.payment_status || 'Pending'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[11px] text-slate-500 font-mono">
                  Zikora Central HMS Database Verified
                </span>
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Close History
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DISCHARGE PATIENT MODAL */}
      <AnimatePresence>
        {dischargeModalOpen && selectedAdmitted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200"
            >
              <div className="p-5 bg-rose-600 text-white flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <LogOut className="h-5 w-5" />
                  <div>
                    <h3 className="text-sm font-extrabold">Discharge Inpatient</h3>
                    <p className="text-[11px] text-rose-100">{selectedAdmitted.name} ({selectedAdmitted.ward} - Bed {selectedAdmitted.bed})</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDischargeModalOpen(false)}
                  className="text-rose-100 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
                {/* Financial Summary */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Incurred:</span>
                    <span className="font-bold text-slate-800">₦{Number(selectedAdmitted.totalCharged || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payments Made:</span>
                    <span className="font-bold text-emerald-700">₦{Number(selectedAdmitted.paymentsMade || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-700 font-bold">Outstanding Balance:</span>
                    <span className={`font-black ${Number(selectedAdmitted.totalCharged || 0) - Number(selectedAdmitted.paymentsMade || 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      ₦{Math.max(0, Number(selectedAdmitted.totalCharged || 0) - Number(selectedAdmitted.paymentsMade || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Discharge Diagnosis / Summary</label>
                  <textarea
                    rows={2}
                    value={dischargeDiagnosis}
                    onChange={(e) => setDischargeDiagnosis(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Patient Condition on Discharge</label>
                  <select
                    value={dischargeCondition}
                    onChange={(e) => setDischargeCondition(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Clinically Improved">Clinically Improved / Stable</option>
                    <option value="Recovered / Resolved">Recovered / Resolved</option>
                    <option value="Transferred to Specialist Facility">Transferred to Specialist Facility</option>
                    <option value="Discharged Against Medical Advice (DAMA)">Discharged Against Medical Advice (DAMA)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Discharge Instructions & Take-Home Meds</label>
                  <textarea
                    rows={2}
                    value={dischargeInstructions}
                    onChange={(e) => setDischargeInstructions(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Follow-up Appointment</label>
                  <input
                    type="text"
                    value={dischargeFollowUp}
                    onChange={(e) => setDischargeFollowUp(e.target.value)}
                    placeholder="e.g. 2 weeks at Outpatient Clinic"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDischargeModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDischarge}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Confirm Discharge & Vacate Bed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADMINISTER MEDICATION MODAL */}
      <AnimatePresence>
        {administerModalOpen && selectedMedToAdminister && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
            >
              <div className="p-4 bg-emerald-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  <h3 className="text-sm font-bold">Administer Medication</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAdministerModalOpen(false)}
                  className="text-emerald-100 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                  <p className="font-extrabold text-emerald-900 text-sm">{selectedMedToAdminister.name}</p>
                  <p className="text-emerald-700 font-mono mt-0.5">Dose: {selectedMedToAdminister.dose} | Frequency: {selectedMedToAdminister.frequency || 'STAT'}</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Administration Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={administerNote}
                    onChange={(e) => setAdministerNote(e.target.value)}
                    placeholder="e.g. Tolerated well, IV site clear..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdministerModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAdministerMedication(selectedMedToAdminister.id, administerNote)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Mark as Administered
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD MEDICATION LOG MODAL */}
      <AnimatePresence>
        {addMedLogModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
            >
              <div className="p-4 bg-[#2A758C] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  <h3 className="text-sm font-bold">Add Medication Administration Log</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAddMedLogModalOpen(false)}
                  className="text-sky-100 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Medication Name</label>
                  <input
                    type="text"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="e.g. Paracetamol IV 1g, Ceftriaxone 1g"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Dose</label>
                    <input
                      type="text"
                      value={newMedDose}
                      onChange={(e) => setNewMedDose(e.target.value)}
                      placeholder="e.g. 1g"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Quantity</label>
                    <input
                      type="text"
                      value={newMedQuantity}
                      onChange={(e) => setNewMedQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Frequency</label>
                    <input
                      type="text"
                      value={newMedFrequency}
                      onChange={(e) => setNewMedFrequency(e.target.value)}
                      placeholder="e.g. TDS"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Status</label>
                  <select
                    value={newMedStatus}
                    onChange={(e) => setNewMedStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Administered">Administered</option>
                    <option value="Pending">Pending</option>
                    <option value="Dispensed">Dispensed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Clinical Note (optional)</label>
                  <textarea
                    rows={2}
                    value={newMedNote}
                    onChange={(e) => setNewMedNote(e.target.value)}
                    placeholder="Clinical notes or patient reaction..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddMedLogModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddMedicationLog}
                  className="px-4 py-1.5 bg-[#2A758C] hover:bg-[#1f5869] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Save Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD OBSERVATION MODAL */}
      <AnimatePresence>
        {obsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
            >
              <div className="p-4 bg-[#2A758C] text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <h3 className="text-sm font-bold">Add Clinical Observation</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setObsModalOpen(false)}
                  className="text-sky-100 hover:text-white p-1 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Category</label>
                  <select
                    value={obsCategory}
                    onChange={(e) => setObsCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none"
                  >
                    <option value="Doctor Round">Doctor Round</option>
                    <option value="Nursing Evaluation">Nursing Evaluation</option>
                    <option value="Surgical / Wound Check">Surgical / Wound Check</option>
                    <option value="Dietary / Fluid Charting">Dietary / Fluid Charting</option>
                    <option value="General Progress">General Progress</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase font-mono">Observation Notes</label>
                  <textarea
                    rows={4}
                    value={obsNote}
                    onChange={(e) => setObsNote(e.target.value)}
                    placeholder="Detail patient clinical status, response to treatment, examination findings..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2A758C] font-mono leading-relaxed"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setObsModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddObservation}
                  className="px-4 py-1.5 bg-[#2A758C] hover:bg-[#1f5869] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Save Observation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
