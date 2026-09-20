import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { apiFetch } from '../utils/api';
import { Patient, Vitals, MaternityDetails, EmergencyDetails } from '../types';
import { 
  HeartHandshake, 
  Plus, 
  Search, 
  Calendar, 
  Phone, 
  Activity, 
  User, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  PlusCircle, 
  CreditCard,
  Clock,
  Settings,
  DollarSign,
  Layers,
  ChevronRight,
  RefreshCw,
  FileText,
  Check,
  Briefcase,
  Users,
  MapPin,
  UserPlus,
  Eye,
  Trash2,
  AlertTriangle,
  Info,
  Baby,
  Download,
  FileSpreadsheet,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ExportButton from './ExportButton';
import ReturningPatientView from './ReturningPatientView';
import AdmissionsView from './AdmissionsView';
import PatientDetailModal from './PatientDetailModal';

interface OPDRegistrationViewProps {
  activeTab?: string;
  initialOpenRegister?: boolean;
  onRegisterModalClose?: () => void;
}

export default function OPDRegistrationView({ 
  activeTab,
  initialOpenRegister,
  onRegisterModalClose
}: OPDRegistrationViewProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'reception' | 'returning' | 'admissions' | 'nursing' | 'catalog' | 'records' | 'replacements'>('reception');
  const [selectedDetailPatient, setSelectedDetailPatient] = useState<any | null>(null);

  // Core Patients & Queue States
  const [patients, setPatients] = useState<Patient[]>([]);
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [replacements, setReplacements] = useState<any[]>([]);

  // Search, Loading, Errors
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isSavingVitals, setIsSavingVitals] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isSavingReplacement, setIsSavingReplacement] = useState(false);
  const [isSavingDeposit, setIsSavingDeposit] = useState(false);
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals & Form States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEncounterOpen, setIsEncounterOpen] = useState(false);
  const [isVitalsOpen, setIsVitalsOpen] = useState(false);
  const [isReplacementOpen, setIsReplacementOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isPriceEditOpen, setIsPriceEditOpen] = useState(false);
  const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);
  const [isHeaderDownloadOpen, setIsHeaderDownloadOpen] = useState(false);
  const [activeDownloadPatientId, setActiveDownloadPatientId] = useState<string | null>(null);

  // Registration modal sub-tabs and success modal
  const [regTab, setRegTab] = useState<'standard' | 'maternity' | 'emergency'>('standard');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);
  const [successCheckedFolder, setSuccessCheckedFolder] = useState(false);
  const [successCheckedCards, setSuccessCheckedCards] = useState(false);
  const [successCheckedReceipt, setSuccessCheckedReceipt] = useState(false);
  const [successCheckedTriage, setSuccessCheckedTriage] = useState(false);

  // New Registration Vitals fields (Standard/Maternity/Emergency)
  const [regBP, setRegBP] = useState('');
  const [regHR, setRegHR] = useState('');
  const [regTemp, setRegTemp] = useState('');
  const [regRR, setRegRR] = useState('');
  const [regSpo2, setRegSpo2] = useState('');
  const [regWeight, setRegWeight] = useState('');
  const [regHeight, setRegHeight] = useState('');

  // New fields for Maternity
  const [abortion, setAbortion] = useState('0');
  const [premature, setPremature] = useState('0');
  const [email, setEmail] = useState('');

  // New fields for Emergency
  const [emergencyGender, setEmergencyGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [emergencyMaritalStatus, setEmergencyMaritalStatus] = useState('Single');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [emergencyTotalBill, setEmergencyTotalBill] = useState('25000');
  const [emergencyCashCollected, setEmergencyCashCollected] = useState('25000');
  const [emergencyDoctorName, setEmergencyDoctorName] = useState('');

  // Identification & Next of Kin states
  const [regIdType, setRegIdType] = useState('');
  const [regIdNumber, setRegIdNumber] = useState('');
  const [regNextOfKinName, setRegNextOfKinName] = useState('');
  const [regNextOfKinPhone, setRegNextOfKinPhone] = useState('');
  const [regNextOfKinRelationship, setRegNextOfKinRelationship] = useState('Spouse');

  // Emergency "Brought In By" states
  const [patientCanProvideDetails, setPatientCanProvideDetails] = useState(true);
  const [broughtInByName, setBroughtInByName] = useState('');
  const [broughtInByPhone, setBroughtInByPhone] = useState('');
  const [broughtInByRelationship, setBroughtInByRelationship] = useState('Good Samaritan');
  const [broughtInByIdType, setBroughtInByIdType] = useState('');
  const [broughtInByIdNumber, setBroughtInByIdNumber] = useState('');

  // ID Biometric Verification states
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [verifiedFirstName, setVerifiedFirstName] = useState('');
  const [verifiedLastName, setVerifiedLastName] = useState('');
  const [verifiedDob, setVerifiedDob] = useState('');
  const [useIdVerification, setUseIdVerification] = useState(false);

  // Selected Items
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<any | null>(null);
  const [selectedPriceItem, setSelectedPriceItem] = useState<any | null>(null);

  // Patient Registration Form Fields
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  const [cardType, setCardType] = useState<'Standard' | 'Maternity' | 'Emergency' | 'Eye Clinic'>('Standard');

  // Account Categories for Registration
  const [patientCategory, setPatientCategory] = useState<'Individual' | 'Family' | 'Company'>('Individual');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [familyRelationship, setFamilyRelationship] = useState('Spouse');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [designation, setDesignation] = useState('');
  const [letterReference, setLetterReference] = useState('');
  const [letterVerified, setLetterVerified] = useState(false);

  // Duplicate Check Warning
  const [duplicatesFound, setDuplicatesFound] = useState<any[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  // Maternity Specific Fields (Reception)
  const [gravida, setGravida] = useState('');
  const [para, setPara] = useState('');
  const [lmp, setLmp] = useState('');
  const [edd, setEdd] = useState('');
  const [gestationalAge, setGestationalAge] = useState('');
  const [tribe, setTribe] = useState('');
  const [occupation, setOccupation] = useState('');

  // Emergency Specific Fields (Reception)
  const [isSickEmergency, setIsSickEmergency] = useState(false);
  const [isUnbookedLabour, setIsUnbookedLabour] = useState(false);
  const [isAccident, setIsAccident] = useState(false);
  const [isDoctorOnCall, setIsDoctorOnCall] = useState(false);
  const [isAfterHours, setIsAfterHours] = useState(false);

  // Create Encounter Fields
  const [encounterPatientId, setEncounterPatientId] = useState('');
  const [encounterVisitType, setEncounterVisitType] = useState('New Patient Consultation');
  const [encounterClinic, setEncounterClinic] = useState('General OPD Out-Patient Clinic');
  const [encounterPriority, setEncounterPriority] = useState('Routine');
  const [encounterReason, setEncounterReason] = useState('');

  // Nursing Vitals Form Fields
  const [vitalsBP, setVitalsBP] = useState('');
  const [vitalsTemp, setVitalsTemp] = useState('');
  const [vitalsPulse, setVitalsPulse] = useState('');
  const [vitalsResp, setVitalsResp] = useState('');
  const [vitalsSpo2, setVitalsSpo2] = useState('');
  const [vitalsWeight, setVitalsWeight] = useState('');
  const [vitalsHeight, setVitalsHeight] = useState('');

  // Priority Escalation State
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);
  const [escalatePriority, setEscalatePriority] = useState('Urgent');
  const [escalateReason, setEscalateReason] = useState('');

  // Card Replacement State
  const [replacementPatientId, setReplacementPatientId] = useState('');
  const [replacementOldCard, setReplacementOldCard] = useState('');
  const [replacementNewCard, setReplacementNewCard] = useState('');
  const [replacementOffice, setReplacementOffice] = useState('Nursing Front-Desk');
  const [replacementReason, setReplacementReason] = useState('Lost Card');

  // Deposit Form State
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('Family account top up');

  // Price Edit State
  const [editPriceVal, setEditPriceVal] = useState('');

  // Sync activeSubTab when parent activeTab changes
  useEffect(() => {
    if (activeTab) {
      if (activeTab === 'patients' || activeTab === 'patients-reception') {
        setActiveSubTab('reception');
      } else if (activeTab === 'patients-returning') {
        setActiveSubTab('returning');
      } else if (activeTab === 'patients-admissions') {
        setActiveSubTab('admissions');
      } else if (activeTab === 'triage') {
        setActiveSubTab('nursing');
      } else if (activeTab === 'records' || activeTab === 'medical-reports') {
        setActiveSubTab('records');
      } else if (activeTab === 'settings') {
        setActiveSubTab('catalog');
      }
    }
  }, [activeTab]);

  useEffect(() => {
    // 1. Get Logged in User
    const saved = localStorage.getItem('zmc_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentUser(parsed);
        // Set default view based on role
        if (parsed.role === 'Nurse') {
          setActiveSubTab('nursing');
        } else if (parsed.role === 'Receptionist' || parsed.role === 'Records Officer') {
          setActiveSubTab('reception');
        } else {
          setActiveSubTab('reception');
        }
      } catch (e) {
        // Fallback
      }
    }

    // 2. Load data
    fetchPatients();
    fetchQueue();
    fetchPrices();
    fetchCompanies();
    fetchFamilies();
    fetchReplacements();
  }, []);

  // Dynamic Emergency Charge calculation effect
  useEffect(() => {
    if (regTab === 'emergency') {
      let total = 0;
      if (isSickEmergency) total += 25000;
      if (isUnbookedLabour) total += 50000;
      if (isAccident) total += 50000;
      if (isDoctorOnCall || isAfterHours) total += 5000;
      setEmergencyTotalBill(String(total));
      setEmergencyCashCollected(String(total));
    }
  }, [isSickEmergency, isUnbookedLabour, isAccident, isDoctorOnCall, isAfterHours, regTab]);

  const fetchPatients = async () => {
    try {
      const res = await apiFetch('/patients');
      if (res.success) setPatients(res.data);
    } catch (err: any) {
      console.error('Failed to load patients', err);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await apiFetch('/patients/opd/queue');
      if (res.success) setQueueItems(res.data);
    } catch (err: any) {
      console.error('Failed to load queue', err);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await apiFetch('/patients/opd/prices');
      if (res.success) setPrices(res.data);
    } catch (err: any) {
      console.error('Failed to load prices', err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await apiFetch('/patients/opd/companies');
      if (res.success) setCompanies(res.data);
    } catch (err: any) {
      console.error('Failed to load companies', err);
    }
  };

  const fetchFamilies = async () => {
    try {
      const res = await apiFetch('/patients/opd/families');
      if (res.success) setFamilies(res.data);
    } catch (err: any) {
      console.error('Failed to load families', err);
    }
  };

  const fetchReplacements = async () => {
    try {
      const res = await apiFetch('/patients/opd/cards/replacements');
      if (res.success) setReplacements(res.data);
    } catch (err: any) {
      console.error('Failed to load card replacements', err);
    }
  };

  // Duplicate Check Handler
  const triggerDuplicateCheck = async (nameVal: string, phoneVal: string) => {
    if (!nameVal || nameVal.trim().length < 4) return;
    try {
      const res = await apiFetch(`/patients/opd/duplicates?name=${encodeURIComponent(nameVal)}&phoneNumber=${encodeURIComponent(phoneVal)}`);
      if (res.success && res.duplicateCount > 0) {
        setDuplicatesFound(res.duplicates);
        setShowDuplicateWarning(true);
      } else {
        setShowDuplicateWarning(false);
      }
    } catch (err) {
      // ignore
    }
  };

  // Helper to calculate total dynamic card fee
  const getCalculatedCardFee = (): number => {
    if (cardType === 'Standard' || cardType === 'Eye Clinic') return 3000;
    if (cardType === 'Maternity') return 5000;
    
    let total = 0; // Emergency Base
    if (isSickEmergency) total += 25000;
    if (isUnbookedLabour) total += 50000;
    if (isAccident) total += 50000;
    if (isDoctorOnCall || isAfterHours) total += 5000;
    return total;
  };

  const handleOpenRegister = (initialTab: 'standard' | 'maternity' | 'emergency' = 'standard') => {
    setRegTab(initialTab);
    setCardType(initialTab === 'standard' ? 'Standard' : initialTab === 'maternity' ? 'Maternity' : 'Emergency');
    setName('');
    setDateOfBirth('');
    setGender(initialTab === 'maternity' ? 'Female' : 'Male');
    setPhoneNumber('');
    setEmail('');
    setAddress('');
    setMaritalStatus(initialTab === 'maternity' ? 'Married' : 'Single');
    setPatientCategory('Individual');
    setSelectedFamilyId('');
    setSelectedCompanyId('');
    setEmployeeId('');
    setDesignation('');
    setLetterReference('');
    setLetterVerified(false);
    
    // Maternity reset
    setGravida('');
    setPara('');
    setLmp('');
    setEdd('');
    setGestationalAge('');
    setTribe('');
    setOccupation('');
    setAbortion('0');
    setPremature('0');

    // Emergency reset
    setIsSickEmergency(initialTab === 'emergency');
    setIsUnbookedLabour(false);
    setIsAccident(false);
    setIsDoctorOnCall(false);
    setIsAfterHours(false);
    setEmergencyGender('Male');
    setEmergencyMaritalStatus('Single');
    setEmergencyEmail('');
    setEmergencyTotalBill('25000');
    setEmergencyCashCollected('25000');
    setEmergencyDoctorName('');

    // Vitals reset
    setRegBP('120/80');
    setRegHR('72');
    setRegTemp('37.0');
    setRegRR('18');
    setRegSpo2('98');
    setRegWeight('65');
    setRegHeight('165');

    // Identification & Next of Kin reset
    setRegIdType('');
    setRegIdNumber('');
    setRegNextOfKinName('');
    setRegNextOfKinPhone('');
    setRegNextOfKinRelationship('Spouse');

    // Emergency "Brought in by" reset
    setPatientCanProvideDetails(true);
    setBroughtInByName('');
    setBroughtInByPhone('');
    setBroughtInByRelationship('Good Samaritan');
    setBroughtInByIdType('');
    setBroughtInByIdNumber('');

    // ID verification reset
    setIsIdVerified(false);
    setVerifiedFirstName('');
    setVerifiedLastName('');
    setVerifiedDob('');
    setUseIdVerification(false);

    setError('');
    setSuccess('');
    setDuplicatesFound([]);
    setShowDuplicateWarning(false);
    setIsRegisterOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsRegisterOpen(false);
    setShowDuplicateWarning(false);
    setDuplicatesFound([]);
    onRegisterModalClose?.();
  };

  useEffect(() => {
    if (initialOpenRegister) {
      handleOpenRegister('standard');
    }
  }, [initialOpenRegister]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Strict duplicate check block: If duplicate warning is displayed or duplicates were found, strictly block submission
    if (duplicatesFound.length > 0) {
      const existing = duplicatesFound[0];
      const hospNum = existing.hospital_number || existing.hospitalNumber || 'Existing';
      setError(`REGISTRATION BLOCKED: Patient record already exists for "${existing.name}" (Hospital Number: ${hospNum}). Duplicate registration is strictly prohibited.`);
      return;
    }

    // Strict Validation for Standard and Maternity registrations, and emergency when details provided
    if (regTab !== 'emergency' || patientCanProvideDetails) {
      const trimmedName = (name || '').trim();
      if (!trimmedName || trimmedName.length < 2) {
        setError('Please enter a valid, complete patient name (minimum 2 characters).');
        return;
      }

      // Check duplicate against active patients list immediately as an extra hard safeguard
      const localDup = patients.find(p => 
        (p.name && p.name.trim().toLowerCase() === trimmedName.toLowerCase()) || 
        (phoneNumber && p.phoneNumber && p.phoneNumber.trim() !== '' && p.phoneNumber.trim() !== 'Unknown' && p.phoneNumber.replace(/\D/g, '') === phoneNumber.replace(/\D/g, ''))
      );
      if (localDup) {
        setDuplicatesFound([localDup]);
        setShowDuplicateWarning(true);
        setError(`REGISTRATION BLOCKED: Patient file already exists for "${localDup.name}" (Hospital Number: ${localDup.hospitalNumber}). Duplicate registration is not permitted. Please open their existing file.`);
        return;
      }
      if (!dateOfBirth) {
        setError('Please select a valid Date of Birth.');
        return;
      }
      const dobDate = new Date(dateOfBirth);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (dobDate > today) {
        setError('Date of Birth cannot be in the future. Please select a valid birth date.');
        return;
      }
      if (dobDate < new Date('1900-01-01')) {
        setError('Date of Birth cannot be earlier than year 1900.');
        return;
      }
      const phoneDigits = (phoneNumber || '').replace(/\D/g, '');
      if (!phoneNumber || phoneDigits.length < 7 || phoneDigits.length > 15) {
        setError('Please enter a valid, complete phone number (7 to 15 digits).');
        return;
      }
    }

    let calculatedFee = 0;
    let body: any = {
      registeredBy: currentUser?.username || 'Receptionist',
    };

    const finalName = name;
    const finalDob = dateOfBirth;

    if (regTab === 'standard') {
      calculatedFee = 3000;
      body = {
        ...body,
        name: finalName,
        dateOfBirth: finalDob,
        gender,
        phoneNumber,
        email,
        address,
        maritalStatus,
        cardType: cardType === 'Eye Clinic' ? 'Eye Clinic' : 'Standard',
        cardFee: calculatedFee,
        status: 'Triage Pending',
        idType: regIdType || null,
        idNumber: regIdNumber || null,
        nextOfKinName: regNextOfKinName || null,
        nextOfKinPhone: regNextOfKinPhone || null,
        nextOfKinRelationship: regNextOfKinRelationship || null,
        patientCategory,
        ...(patientCategory === 'Family' && {
          familyName: selectedFamilyId,
          familyRelationship
        }),
        ...(patientCategory === 'Company' && {
          companyName: selectedCompanyId,
          employeeId: employeeId || null,
          designation: designation || null,
          letterReference: letterReference || null,
          letterVerified
        }),
        vitals: {
          bloodPressure: regBP,
          temperature: parseFloat(regTemp) || null,
          pulseRate: parseInt(regHR, 10) || null,
          respiratoryRate: parseInt(regRR, 10) || null,
          spo2: parseInt(regSpo2, 10) || null,
          weight: parseFloat(regWeight) || null,
          height: parseFloat(regHeight) || null,
        }
      };
    } else if (regTab === 'maternity') {
      calculatedFee = 5000;
      body = {
        ...body,
        name: finalName,
        dateOfBirth: finalDob,
        gender: 'Female', // Expectant mothers are female
        phoneNumber,
        email,
        address,
        maritalStatus,
        cardType: 'Maternity',
        cardFee: calculatedFee,
        status: 'Triage Pending',
        idType: regIdType || null,
        idNumber: regIdNumber || null,
        nextOfKinName: regNextOfKinName || null,
        nextOfKinPhone: regNextOfKinPhone || null,
        nextOfKinRelationship: regNextOfKinRelationship || null,
        maternityDetails: {
          gravida,
          para,
          lmp: lmp || null,
          edd: edd || null,
          gestationalAge,
          tribe,
          occupation,
          abortion,
          premature,
        },
        vitals: {
          bloodPressure: regBP,
          temperature: parseFloat(regTemp) || null,
          pulseRate: parseInt(regHR) || null,
          respiratoryRate: parseInt(regRR) || null,
          spo2: parseInt(regSpo2) || null,
          weight: parseFloat(regWeight) || null,
          height: parseFloat(regHeight) || null,
        }
      };
    } else if (regTab === 'emergency') {
      calculatedFee = getCalculatedCardFee(); // calculated dynamic fee based on checkboxes
      const cashCol = parseFloat(emergencyCashCollected) || 0;
      if (cashCol < 5000) {
        setError('Minimum cash collected at OPD registration for emergency must be ₦5,000.');
        return;
      }

      const finalBroughtInName = broughtInByName;

      body = {
        ...body,
        name: patientCanProvideDetails ? finalName : (name || 'Unidentified Emergency Patient'),
        dateOfBirth: patientCanProvideDetails ? finalDob : (dateOfBirth || new Date().toISOString().split('T')[0]),
        gender: emergencyGender,
        phoneNumber: patientCanProvideDetails ? phoneNumber : (phoneNumber || 'Unknown'),
        email: emergencyEmail,
        address: patientCanProvideDetails ? address : (address || 'Emergency Trauma Scene'),
        maritalStatus: emergencyMaritalStatus,
        cardType: 'Emergency',
        cardFee: calculatedFee,
        status: 'Emergency Dispatched',
        idType: patientCanProvideDetails ? (regIdType || null) : null,
        idNumber: patientCanProvideDetails ? (regIdNumber || null) : null,
        nextOfKinName: regNextOfKinName || null,
        nextOfKinPhone: regNextOfKinPhone || null,
        nextOfKinRelationship: regNextOfKinRelationship || null,
        patientCanProvideDetails,
        broughtInByName: !patientCanProvideDetails ? finalBroughtInName : (broughtInByName || null),
        broughtInByPhone: !patientCanProvideDetails ? broughtInByPhone : (broughtInByPhone || null),
        broughtInByRelationship: !patientCanProvideDetails ? broughtInByRelationship : (broughtInByRelationship || null),
        broughtInByIdType: !patientCanProvideDetails ? (broughtInByIdType || null) : null,
        broughtInByIdNumber: !patientCanProvideDetails ? (broughtInByIdNumber || null) : null,
        emergencyDetails: {
          isSickEmergency,
          isUnbookedLabour,
          isAccident,
          isDoctorOnCall,
          isAfterHours,
          totalBillAmount: parseFloat(emergencyTotalBill) || calculatedFee,
          cashCollected: cashCol,
          doctorOnCallName: emergencyDoctorName,
          customDetails: `Emergency incident intake. Total dynamic fee: ₦${calculatedFee}. Doctor on Call: ${emergencyDoctorName}.${
            !patientCanProvideDetails ? ` Brought in by: ${finalBroughtInName} (${broughtInByRelationship}, Phone: ${broughtInByPhone}).` : ''
          }`,
        },
        vitals: {
          bloodPressure: regBP,
          temperature: parseFloat(regTemp) || null,
          pulseRate: parseInt(regHR) || null,
          respiratoryRate: parseInt(regRR) || null,
          spo2: parseInt(regSpo2) || null,
          weight: parseFloat(regWeight) || null,
          height: parseFloat(regHeight) || null,
        }
      };
    }

    try {
      setIsRegistering(true);
      const response = await apiFetch('/patients', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response && response.success) {
        const patientData = response.data;
        setSuccess(`${regTab.toUpperCase()} Patient registered successfully!`);
        setIsRegisterOpen(false);
        onRegisterModalClose?.();
        setRegisteredPatient(patientData);
        setIsSuccessModalOpen(true); // Open success modal with card & receipt
        fetchPatients();
        fetchQueue();
        fetchFamilies();
      } else {
        setError(response?.error || response?.message || 'Registration failed. Please check form details.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check all fields.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleOpenEncounter = (patient: Patient) => {
    setSelectedPatient(patient);
    setEncounterPatientId(patient.id);
    setEncounterVisitType('New Patient Consultation');
    setEncounterClinic('General OPD Out-Patient Clinic');
    setEncounterPriority('Routine');
    setEncounterReason('');
    setError('');
    setSuccess('');
    setIsEncounterOpen(true);
  };

  const handleEncounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setIsQueueing(true);
      const response = await apiFetch('/patients/opd/encounters', {
        method: 'POST',
        body: JSON.stringify({
          patientId: encounterPatientId,
          visitType: encounterVisitType,
          destinationClinic: encounterClinic,
          priority: encounterPriority,
          priorityReason: encounterReason,
        }),
      });

      if (response.success) {
        setSuccess('Visit encounter created successfully! Patient has been placed in the waiting queue.');
        setIsEncounterOpen(false);
        fetchQueue();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create encounter');
    } finally {
      setIsQueueing(false);
    }
  };

  const handleOpenVitals = (item: any) => {
    setSelectedQueueItem(item);
    setVitalsBP('120/80');
    setVitalsTemp('37.0');
    setVitalsPulse('75');
    setVitalsResp('18');
    setVitalsSpo2('98');
    setVitalsWeight('70');
    setVitalsHeight('175');
    setError('');
    setSuccess('');
    setIsVitalsOpen(true);
  };

  const handleVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueItem) return;
    setError('');
    setSuccess('');

    try {
      setIsSavingVitals(true);
      const response = await apiFetch('/patients/opd/queue/vitals', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedQueueItem.patient_id,
          encounterId: selectedQueueItem.encounter_id,
          vitals: {
            bloodPressure: vitalsBP || '120/80',
            temperature: parseFloat(vitalsTemp) || 36.5,
            pulseRate: parseInt(vitalsPulse, 10) || 72,
            respiratoryRate: parseInt(vitalsResp, 10) || 16,
            spo2: parseInt(vitalsSpo2, 10) || 98,
            weight: parseFloat(vitalsWeight) || 70,
            height: parseFloat(vitalsHeight) || 170,
          },
        }),
      });

      if (response.success) {
        setSuccess('Nursing vitals recorded! Patient routed to Doctor Consultation queue.');
        setIsVitalsOpen(false);
        fetchQueue();
        fetchPatients();
      }
    } catch (err: any) {
      setError(err.message || 'Vitals submission failed');
    } finally {
      setIsSavingVitals(false);
    }
  };

  const handleOpenEscalate = (item: any) => {
    setSelectedQueueItem(item);
    setEscalatePriority('Urgent');
    setEscalateReason('');
    setIsEscalateOpen(true);
  };

  const handleEscalateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueItem) return;

    try {
      setIsEscalating(true);
      const response = await apiFetch('/patients/opd/queue/priority', {
        method: 'POST',
        body: JSON.stringify({
          encounterId: selectedQueueItem.encounter_id,
          priority: escalatePriority,
          reason: escalateReason,
        }),
      });

      if (response.success) {
        setSuccess(`Encounter priority successfully escalated to ${escalatePriority}!`);
        setIsEscalateOpen(false);
        fetchQueue();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update priority');
    } finally {
      setIsEscalating(false);
    }
  };

  const handleOpenReplacement = (patient: Patient) => {
    setSelectedPatient(patient);
    setReplacementPatientId(patient.id);
    setReplacementOldCard(patient.hospitalNumber); // assuming hospital number has historical card link
    setReplacementNewCard(`ZMC-CARD-${Math.floor(1000 + Math.random() * 9000)}`);
    setReplacementOffice('Nursing Front-Desk');
    setReplacementReason('Lost Card');
    setError('');
    setSuccess('');
    setIsReplacementOpen(true);
  };

  const handleReplacementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setIsSavingReplacement(true);
      const response = await apiFetch('/patients/opd/cards/replace', {
        method: 'POST',
        body: JSON.stringify({
          patientId: replacementPatientId,
          oldCardNumber: replacementOldCard,
          newCardNumber: replacementNewCard,
          lastOfficeSeen: replacementOffice,
          reason: replacementReason,
        }),
      });

      if (response.success) {
        setSuccess('Lost card replacement approved! Medical history refreshed successfully.');
        setIsReplacementOpen(false);
        fetchReplacements();
        fetchPatients();
      }
    } catch (err: any) {
      setError(err.message || 'Replacement logging failed');
    } finally {
      setIsSavingReplacement(false);
    }
  };

  const handleOpenDeposit = (family: any) => {
    setSelectedFamily(family);
    setDepositAmount('');
    setDepositDescription('Family account top up');
    setError('');
    setSuccess('');
    setIsDepositOpen(true);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamily) return;

    try {
      setIsSavingDeposit(true);
      const response = await apiFetch('/patients/opd/families/deposit', {
        method: 'POST',
        body: JSON.stringify({
          familyId: selectedFamily.id,
          amount: parseFloat(depositAmount),
          description: depositDescription,
        }),
      });

      if (response.success) {
        setSuccess('Deposit completed successfully! Balance updated.');
        setIsDepositOpen(false);
        fetchFamilies();
      }
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
    } finally {
      setIsSavingDeposit(false);
    }
  };

  const handleOpenPriceEdit = (priceItem: any) => {
    setSelectedPriceItem(priceItem);
    setEditPriceVal(String(priceItem.price));
    setIsPriceEditOpen(true);
  };

  const handlePriceEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriceItem) return;

    try {
      setIsSavingPrice(true);
      const response = await apiFetch('/patients/opd/prices', {
        method: 'POST',
        body: JSON.stringify({
          itemCode: selectedPriceItem.item_code,
          price: parseFloat(editPriceVal),
        }),
      });

      if (response.success) {
        setSuccess('Catalogue price modified successfully!');
        setIsPriceEditOpen(false);
        fetchPrices();
      }
    } catch (err: any) {
      setError(err.message || 'Price edit failed');
    } finally {
      setIsSavingPrice(false);
    }
  };

  // Filter Patients List based on Search bar
  const filteredPatients = patients.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.hospitalNumber.toLowerCase().includes(q) ||
      p.phoneNumber.includes(q) ||
      p.cardType.toLowerCase().includes(q)
    );
  });

  const getAge = (dobString: string): number => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleDownloadSingleExcel = (p: any) => {
    const headers = ['Card / Hospital ID', 'Patient Name', 'Gender', 'Date of Birth', 'Age', 'Card Category', 'Card Category Type', 'Card Fee (NGN)', 'Phone Number', 'Status', 'Registration Date', 'Maternity/Expiry Note'];
    const rowsToExport: any[][] = [];

    const dobStr = p.dateOfBirth ? p.dateOfBirth.split('T')[0] : 'N/A';
    const ageVal = getAge(p.dateOfBirth);
    const regStr = p.registrationDate ? p.registrationDate.split('T')[0] : 'N/A';

    if (p.cardType === 'Maternity') {
      // Row 1: Standard card details (₦3000)
      rowsToExport.push([
        p.hospitalNumber,
        p.name,
        p.gender,
        dobStr,
        ageVal,
        'Standard',
        'Standard Card (₦3,000)',
        3000,
        p.phoneNumber || 'N/A',
        p.status,
        regStr,
        'Permanent hospital card for non-maternity clinical visits.'
      ]);
      // Row 2: Maternity card details (₦2000)
      rowsToExport.push([
        p.maternityNumber || p.hospitalNumber.replace('ZMC', 'MAT'),
        p.name,
        p.gender,
        dobStr,
        ageVal,
        'Maternity',
        'Maternity Card (₦2,000)',
        2000,
        p.phoneNumber || 'N/A',
        p.status,
        regStr,
        'Temporary maternity card. Expires as soon as the baby is born.'
      ]);
    } else {
      const cardCatType = p.cardType === 'Emergency'
        ? 'Emergency Card'
        : p.cardType === 'Maternity'
          ? 'Maternity Card (₦5,000)'
          : p.cardType === 'Eye Clinic'
            ? 'Eye Clinic Card (₦3,000)'
            : 'Standard Card (₦3,000)';

      const expiryNote = p.cardType === 'Emergency'
        ? 'Emergency clinical card.'
        : p.cardType === 'Eye Clinic'
          ? 'Specialized ocular services card.'
          : 'Permanent hospital card for non-maternity clinical visits.';

      rowsToExport.push([
        p.hospitalNumber,
        p.name,
        p.gender,
        dobStr,
        ageVal,
        p.cardType || 'Standard',
        cardCatType,
        p.cardFee || (p.cardType === 'Standard' || p.cardType === 'Eye Clinic' ? 3000 : 0),
        p.phoneNumber || 'N/A',
        p.status,
        regStr,
        expiryNote
      ]);
    }

    const csvRows = [headers.join(',')];
    rowsToExport.forEach(row => {
      const escaped = row.map(val => {
        const cleaned = String(val).replace(/"/g, '""');
        return `"${cleaned}"`;
      });
      csvRows.push(escaped.join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ZMC_Patient_Card_${p.hospitalNumber}_${p.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess(`Downloaded Excel CSV for ${p.name}`);
  };

  const handleDownloadSingleDoc = (p: any) => {
    const isMaternity = p.cardType === 'Maternity';
    const matId = p.maternityNumber || (p.hospitalNumber ? p.hospitalNumber.replace('ZMC', 'MAT') : 'N/A');

    const card1Html = `
      <div class="card-container">
        <div class="card-title">Card 1: Permanent Hospital Clinical Card</div>
        <table class="info-table">
          <tr>
            <td class="label">Hospital ID / Number:</td>
            <td><span class="hospital-id">${p.hospitalNumber}</span></td>
          </tr>
          <tr>
            <td class="label">Patient Name:</td>
            <td class="value">${p.name}</td>
          </tr>
          <tr>
            <td class="label">Gender / Sex:</td>
            <td class="value">${p.gender}</td>
          </tr>
          <tr>
            <td class="label">Date of Birth:</td>
            <td class="value">${p.dateOfBirth ? p.dateOfBirth.split('T')[0] : 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Current Age:</td>
            <td class="value">${getAge(p.dateOfBirth)} Years</td>
          </tr>
          <tr>
            <td class="label">Card Category:</td>
            <td class="value" style="color: #0369a1;">Standard</td>
          </tr>
          <tr>
            <td class="label">Card Fee Paid:</td>
            <td class="value">₦3,000 NGN</td>
          </tr>
          <tr>
            <td class="label">Phone Number:</td>
            <td class="value">${p.phoneNumber || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Usage & Validity:</td>
            <td class="value" style="color: #16a34a; font-weight: bold;">PERMANENT - Use this card for all regular, non-maternity clinic visits.</td>
          </tr>
        </table>
      </div>
    `;

    const card2Html = isMaternity ? `
      <div class="card-container" style="margin-top: 30px; border-color: #ec4899; background-color: #fdf2f8;">
        <div class="card-title" style="color: #db2777; border-bottom-color: #fbcfe8;">Card 2: Temporary Maternity ID Card</div>
        <table class="info-table">
          <tr>
            <td class="label" style="color: #db2777;">Maternity ID / Number:</td>
            <td><span class="hospital-id" style="background-color: #fce7f3; color: #db2777; border-color: #fbcfe8;">${matId}</span></td>
          </tr>
          <tr>
            <td class="label">Patient Name:</td>
            <td class="value">${p.name}</td>
          </tr>
          <tr>
            <td class="label">Gender / Sex:</td>
            <td class="value">${p.gender}</td>
          </tr>
          <tr>
            <td class="label">Card Category:</td>
            <td class="value" style="color: #db2777;">Maternity</td>
          </tr>
          <tr>
            <td class="label">Card Fee Paid:</td>
            <td class="value">₦2,000 NGN</td>
          </tr>
          <tr>
            <td class="label">LMP Date:</td>
            <td class="value">${p.maternityDetails?.lmp || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">EDD Date:</td>
            <td class="value">${p.maternityDetails?.edd || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">Usage & Validity:</td>
            <td class="value" style="color: #be185d; font-weight: bold;">TEMPORARY - This ID expires as soon as the baby is born. Non-maternity visits require the Standard Hospital ID.</td>
          </tr>
        </table>
      </div>
    ` : '';

    const docHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Patient Medical Registry Card - ${p.name}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #334155; margin: 40px; }
          .header { text-align: center; border-bottom: 3px double #2A758C; padding-bottom: 15px; margin-bottom: 30px; }
          .title { font-size: 26px; font-weight: bold; color: #2A758C; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 13px; color: #64748b; margin: 5px 0 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
          .card-container { border: 2px solid #2A758C; padding: 25px; border-radius: 15px; background-color: #f8fafc; margin-top: 20px; }
          .card-title { font-size: 18px; font-weight: bold; color: #2A758C; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
          .info-table { width: 100%; border-collapse: collapse; }
          .info-table td { padding: 10px; font-size: 12px; }
          .label { font-weight: bold; color: #64748b; width: 30%; text-transform: uppercase; font-size: 10px; }
          .value { color: #0f172a; font-size: 13px; font-weight: 600; }
          .hospital-id { font-family: Courier, monospace; font-size: 18px; font-weight: bold; color: #2A758C; background-color: #e0f2fe; padding: 5px 10px; border-radius: 5px; display: inline-block; }
          .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">Zikora Medical Center</p>
          <p class="subtitle">Official Patient Registry Card / Demographics Record</p>
        </div>

        ${card1Html}
        ${card2Html}

        <p class="footer">
          This is an official document generated from the Zikora Medical Center Out-Patient Department. Confidentiality of patient medical records is protected by clinical policy.
        </p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ZMC_Patient_Card_${p.hospitalNumber}_${p.name.replace(/\s+/g, '_')}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccess(`Downloaded Word document for ${p.name}`);
  };

  const handleDownloadSinglePdf = (p: any) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const isMaternity = p.cardType === 'Maternity';
    const matId = p.maternityNumber || (p.hospitalNumber ? p.hospitalNumber.replace('ZMC', 'MAT') : 'N/A');

    const drawCardPage = (cardNumber: string, category: string, isMatPage: boolean) => {
      // Background light slate color for the page
      doc.setFillColor(isMatPage ? 253 : 248, isMatPage ? 244 : 250, isMatPage ? 245 : 252);
      doc.rect(0, 0, 210, 297, 'F');

      // Draw card container in the center
      const cardX = 30;
      const cardY = 40;
      const cardW = 150;
      const cardH = 200;

      // Draw card border
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(isMatPage ? 244 : 226, isMatPage ? 180 : 232, isMatPage ? 200 : 240);
      doc.roundedRect(cardX, cardY, cardW, cardH, 5, 5, 'FD');

      // Draw colored card header bar (Pink for maternity, Teal for standard)
      if (isMatPage) {
        doc.setFillColor(219, 39, 119); // Pink #db2777
      } else {
        doc.setFillColor(42, 117, 140); // Teal #2A758C
      }
      doc.rect(cardX, cardY, cardW, 25, 'F');

      // Header Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('ZIKORA MEDICAL CENTER', cardX + cardW / 2, cardY + 11, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(isMatPage ? 'OFFICIAL MATERNITY CLINICAL CARD' : 'OFFICIAL PATIENT REGISTRY CARD', cardX + cardW / 2, cardY + 18, { align: 'center' });

      // Draw dynamic initial circle avatar
      doc.setFillColor(isMatPage ? 253 : 241, isMatPage ? 242 : 245, isMatPage ? 248 : 249);
      if (isMatPage) {
        doc.setDrawColor(219, 39, 119);
      } else {
        doc.setDrawColor(42, 117, 140);
      }
      doc.setLineWidth(1);
      doc.circle(cardX + cardW / 2, cardY + 50, 18, 'FD');

      // Avatar initial letter
      if (isMatPage) {
        doc.setTextColor(219, 39, 119);
      } else {
        doc.setTextColor(42, 117, 140);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text((p.name || 'P').charAt(0).toUpperCase(), cardX + cardW / 2, cardY + 52, { align: 'center' });

      // Patient Name
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(p.name || 'N/A', cardX + cardW / 2, cardY + 78, { align: 'center' });

      // Card category badge
      if (isMatPage) {
        doc.setFillColor(252, 231, 243); // pink-100
        doc.roundedRect(cardX + cardW / 2 - 25, cardY + 84, 50, 7, 3, 3, 'F');
        doc.setTextColor(190, 24, 74); // pink-700
      } else {
        doc.setFillColor(224, 242, 254); // blue-100
        doc.roundedRect(cardX + cardW / 2 - 25, cardY + 84, 50, 7, 3, 3, 'F');
        doc.setTextColor(3, 105, 161); // blue-700
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`${category} Access`.toUpperCase(), cardX + cardW / 2, cardY + 89, { align: 'center' });

      // Hospital Number Container
      if (isMatPage) {
        doc.setFillColor(253, 242, 248);
        doc.setDrawColor(244, 180, 200);
      } else {
        doc.setFillColor(240, 249, 255);
        doc.setDrawColor(186, 230, 253);
      }
      doc.roundedRect(cardX + 15, cardY + 100, cardW - 30, 22, 4, 4, 'FD');

      doc.setTextColor(isMatPage ? 190 : 3, isMatPage ? 24 : 105, isMatPage ? 74 : 161);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(isMatPage ? 'TEMPORARY MATERNITY FILE ID' : 'HOSPITAL FILE NUMBER', cardX + cardW / 2, cardY + 106, { align: 'center' });

      doc.setTextColor(isMatPage ? 219 : 42, isMatPage ? 39 : 117, isMatPage ? 119 : 140);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(cardNumber, cardX + cardW / 2, cardY + 117, { align: 'center' });

      // Detail fields
      const startFieldY = cardY + 132;
      const colW = (cardW - 30) / 2;
      const leftColX = cardX + 15;
      const rightColX = cardX + 15 + colW;

      const drawField = (x: number, y: number, label: string, value: string) => {
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(label.toUpperCase(), x, y);

        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(value, x, y + 6);
      };

      const age = getAge(p.dateOfBirth);
      const dobFormatted = p.dateOfBirth ? p.dateOfBirth.split('T')[0] : 'N/A';

      if (isMatPage) {
        drawField(leftColX, startFieldY, 'LMP Date', p.maternityDetails?.lmp || 'Not Recorded');
        drawField(rightColX, startFieldY, 'Estimated EDD', p.maternityDetails?.edd || 'Not Calculated');

        drawField(leftColX, startFieldY + 16, 'Gravida / Para', `G: ${p.maternityDetails?.gravida || '0'} / P: ${p.maternityDetails?.para || '0'}`);
        drawField(rightColX, startFieldY + 16, 'Obstetric Status', p.maternityDetails?.gestationalAge || 'Antenatal Client');
      } else {
        drawField(leftColX, startFieldY, 'Gender', p.gender || 'N/A');
        drawField(rightColX, startFieldY, 'Age / DOB', `${age} Yrs (${dobFormatted})`);

        drawField(leftColX, startFieldY + 16, 'Contact Phone', p.phoneNumber || 'N/A');
        const regFormatted = p.registrationDate ? p.registrationDate.split('T')[0] : 'N/A';
        drawField(rightColX, startFieldY + 16, 'Registration Date', regFormatted);
      }

      // Status block across full width
      doc.setFillColor(isMatPage ? 253 : 248, isMatPage ? 242 : 250, isMatPage ? 248 : 252);
      doc.roundedRect(cardX + 15, startFieldY + 28, cardW - 30, 12, 2, 2, 'F');
      
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(isMatPage ? 'MATERNITY ID VALIDITY NOTICE:' : 'CURRENT CLINICAL STATUS:', cardX + 20, startFieldY + 36);

      doc.setTextColor(isMatPage ? 190 : 42, isMatPage ? 24 : 117, isMatPage ? 74 : 140);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(isMatPage ? 'EXPIRES PROMPTLY ON BIRTH' : (p.status || 'Active Registry'), cardX + 75, startFieldY + 36);

      // Card Footer
      doc.setDrawColor(241, 245, 249);
      doc.line(cardX + 10, cardY + 185, cardX + cardW - 10, cardY + 185);

      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      if (isMatPage) {
        doc.text('Temporary maternity ID. Expires post-delivery. Regular visits require Standard ID card.', cardX + cardW / 2, cardY + 192, { align: 'center' });
      } else {
        doc.text('Confidential medical ID. If found, return to Zikora Medical Center OPD Reception.', cardX + cardW / 2, cardY + 192, { align: 'center' });
      }
    };

    // Draw Standard card on page 1
    drawCardPage(p.hospitalNumber, isMaternity ? 'Standard' : (p.cardType || 'Standard'), false);

    // If Maternity, add page 2 and draw Maternity card
    if (isMaternity) {
      doc.addPage();
      drawCardPage(matId, 'Maternity', true);
    }

    doc.save(`ZMC_Patient_Card_${p.hospitalNumber}_${p.name.replace(/\s+/g, '_')}.pdf`);
    setSuccess(`Downloaded PDF card for ${p.name}`);
  };

  const handleDownloadExcel = () => {
    const headers = ['Hospital Number', 'Patient Name', 'Gender', 'Date of Birth', 'Age', 'Card Category', 'Phone Number', 'Status', 'Registration Date'];
    const rows = filteredPatients.map(p => [
      p.hospitalNumber,
      p.name,
      p.gender,
      p.dateOfBirth ? p.dateOfBirth.split('T')[0] : 'N/A',
      getAge(p.dateOfBirth),
      p.cardType,
      p.phoneNumber,
      p.status,
      p.registrationDate ? p.registrationDate.split('T')[0] : 'N/A'
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(row => row.map(val => {
      const cleaned = String(val).replace(/"/g, '""');
      return `"${cleaned}"`;
    }).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ZMC_Patients_List_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloadDropdownOpen(false);
    setSuccess('Downloaded Excel CSV registry successfully.');
  };

  const handleDownloadDoc = () => {
    const rowsHtml = filteredPatients.map((p, idx) => `
      <tr style="${idx % 2 === 0 ? 'background-color: #fcfcfc;' : ''}">
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-family: Courier, monospace; font-weight: bold; color: #2A758C;">${p.hospitalNumber}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1e293b;">${p.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${p.gender}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${getAge(p.dateOfBirth)} yrs</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">${p.cardType}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${p.phoneNumber}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${p.status}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">${p.registrationDate ? p.registrationDate.split('T')[0] : 'N/A'}</td>
      </tr>
    `).join('');

    const docHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>Zikora Medical Center Patient Registry</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #334155; margin: 40px; }
          .header { text-align: center; border-bottom: 3px double #2A758C; padding-bottom: 15px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #2A758C; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin: 5px 0 0 0; font-weight: 600; }
          .meta-info { font-size: 11px; color: #64748b; margin-bottom: 20px; }
          .stats-grid { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
          .stats-cell { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: center; width: 25%; }
          .stats-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #64748b; }
          .stats-value { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 2px; }
          .table-container { width: 100%; }
          table { width: 100%; border-collapse: collapse; }
          th { background-color: #2A758C; color: #ffffff; padding: 12px 10px; text-align: left; font-size: 11px; font-weight: bold; text-transform: uppercase; border: 1px solid #2A758C; }
          td { font-size: 11px; border: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">Zikora Medical Center</p>
          <p class="subtitle">Official Patient Registry Database Report</p>
        </div>
        
        <table class="meta-info" style="width: 100%; margin-bottom: 15px;">
          <tr>
            <td><strong>Export Date:</strong> ${new Date().toLocaleString()}</td>
            <td style="text-align: right;"><strong>Filtered Search:</strong> ${search ? search : 'None (All Records)'}</td>
          </tr>
        </table>

        <table class="stats-grid">
          <tr>
            <td class="stats-cell"><div class="stats-label">Total Selected</div><div class="stats-value">${filteredPatients.length}</div></td>
            <td class="stats-cell"><div class="stats-label">Standard Card</div><div class="stats-value">${filteredPatients.filter(p => p.cardType === 'Standard').length}</div></td>
            <td class="stats-cell"><div class="stats-label">Maternity Card</div><div class="stats-value">${filteredPatients.filter(p => p.cardType === 'Maternity').length}</div></td>
            <td class="stats-cell"><div class="stats-label">Emergency Card</div><div class="stats-value">${filteredPatients.filter(p => p.cardType === 'Emergency').length}</div></td>
          </tr>
        </table>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Hospital No</th>
                <th>Patient Name</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Card Category</th>
                <th>Phone Number</th>
                <th>Status</th>
                <th>Reg Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
        
        <p style="margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px;">
          This is an official document generated from the Zikora Medical Center Out-Patient Department. Confidentiality of patient medical records is protected by clinical policy.
        </p>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ZMC_Patients_Registry_${new Date().toISOString().split('T')[0]}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloadDropdownOpen(false);
    setSuccess('Downloaded Google Doc registry report successfully.');
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header Title
    doc.setTextColor(42, 117, 140);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('ZIKORA MEDICAL CENTER', 15, 20);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('OFFICIAL PATIENT REGISTRY DATABASE REPORT', 15, 26);

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 30, 195, 30);

    // Metadata block
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Export Date: ${new Date().toLocaleString()}`, 15, 36);
    const searchTxt = search ? search : 'None (All Records)';
    doc.text(`Filtered Search: ${searchTxt}`, 195, 36, { align: 'right' });

    // Stats cards strip
    const statsW = 41;
    const statsH = 14;
    const statsY = 41;
    const statsX = [15, 60, 105, 150];

    const drawStatBox = (x: number, label: string, value: string) => {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, statsY, statsW, statsH, 2, 2, 'FD');

      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(label.toUpperCase(), x + statsW / 2, statsY + 5, { align: 'center' });

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(value, x + statsW / 2, statsY + 11, { align: 'center' });
    };

    drawStatBox(statsX[0], 'Total Selected', String(filteredPatients.length));
    drawStatBox(statsX[1], 'Standard Card', String(filteredPatients.filter(p => p.cardType === 'Standard').length));
    drawStatBox(statsX[2], 'Maternity Card', String(filteredPatients.filter(p => p.cardType === 'Maternity').length));
    drawStatBox(statsX[3], 'Emergency Card', String(filteredPatients.filter(p => p.cardType === 'Emergency').length));

    // Table Headers
    const tableY = 62;
    doc.setFillColor(42, 117, 140);
    doc.rect(15, tableY, 180, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);

    const colX = {
      hNo: 17,
      name: 45,
      gender: 95,
      age: 110,
      card: 122,
      phone: 150,
      status: 175
    };

    doc.text('HOSPITAL NO', colX.hNo, tableY + 5.5);
    doc.text('PATIENT NAME', colX.name, tableY + 5.5);
    doc.text('GENDER', colX.gender, tableY + 5.5);
    doc.text('AGE', colX.age, tableY + 5.5);
    doc.text('CARD CATEGORY', colX.card, tableY + 5.5);
    doc.text('PHONE NUMBER', colX.phone, tableY + 5.5);
    doc.text('STATUS', colX.status, tableY + 5.5);

    // Draw rows
    let currentY = tableY + 8;
    const rowH = 8;
    const pageHeight = 297;

    filteredPatients.forEach((p, idx) => {
      // Check pagination
      if (currentY + rowH > pageHeight - 20) {
        doc.addPage();
        currentY = 20;

        // Draw minimal header on new page
        doc.setFillColor(42, 117, 140);
        doc.rect(15, currentY, 180, 8, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('HOSPITAL NO', colX.hNo, currentY + 5.5);
        doc.text('PATIENT NAME', colX.name, currentY + 5.5);
        doc.text('GENDER', colX.gender, currentY + 5.5);
        doc.text('AGE', colX.age, currentY + 5.5);
        doc.text('CARD CATEGORY', colX.card, currentY + 5.5);
        doc.text('PHONE NUMBER', colX.phone, currentY + 5.5);
        doc.text('STATUS', colX.status, currentY + 5.5);

        currentY += 8;
      }

      // Row zebra background
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, 180, rowH, 'F');
      }

      // Border line at bottom
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.3);
      doc.line(15, currentY + rowH, 195, currentY + rowH);

      // Text cells
      doc.setTextColor(42, 117, 140);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(p.hospitalNumber || 'N/A', colX.hNo, currentY + 5);

      doc.setTextColor(30, 41, 59);
      doc.text(p.name || 'N/A', colX.name, currentY + 5);

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(p.gender || 'N/A', colX.gender, currentY + 5);
      doc.text(`${getAge(p.dateOfBirth)} yrs`, colX.age, currentY + 5);

      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text(p.cardType || 'N/A', colX.card, currentY + 5);

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.text(p.phoneNumber || 'N/A', colX.phone, currentY + 5);

      doc.text(p.status || 'Active', colX.status, currentY + 5);

      currentY += rowH;
    });

    // Footer at the end of report
    if (currentY + 25 > pageHeight) {
      doc.addPage();
      currentY = 20;
    }
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, currentY + 10, 195, currentY + 10);

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('This is an official document generated from the Zikora Medical Center Out-Patient Department.', 15, currentY + 16);
    doc.text('Confidentiality of patient medical records is protected by clinical policy.', 15, currentY + 20);

    doc.save(`ZMC_Patients_Registry_${new Date().toISOString().split('T')[0]}.pdf`);
    setIsDownloadDropdownOpen(false);
    setSuccess('Downloaded PDF registry database report.');
  };

  // Daily registration statistics (Today)
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysRegistrations = patients.filter(p => {
    if (!p.registrationDate) return false;
    return p.registrationDate.split('T')[0] === todayStr;
  });
  const totalToday = todaysRegistrations.length;
  const standardToday = todaysRegistrations.filter(p => p.cardType === 'Standard').length;
  const maternityToday = todaysRegistrations.filter(p => p.cardType === 'Maternity').length;
  const emergencyToday = todaysRegistrations.filter(p => p.cardType === 'Emergency').length;

  const renderBillingCategoryProfileStep = (formTypeTheme: 'standard' | 'maternity' | 'emergency') => {
    const isMaternity = formTypeTheme === 'maternity';
    const isEmergency = formTypeTheme === 'emergency';

    const themeBorder = isEmergency ? 'border-rose-200 bg-rose-50/30' : isMaternity ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50/60';
    const headerColor = isEmergency ? 'text-rose-800' : isMaternity ? 'text-emerald-800' : 'text-slate-800';

    return (
      <div className={`space-y-4 p-4.5 rounded-2xl border ${themeBorder}`}>
        <h4 className={`text-xs font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 ${headerColor}`}>
          <CreditCard className="h-4 w-4 text-[#2A758C]" /> 1. Billing Category Profile
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
            patientCategory === 'Individual'
              ? 'border-[#2A758C] bg-white shadow-2xs ring-2 ring-[#2A758C]/20'
              : 'border-slate-200 bg-white/80 hover:bg-white'
          }`}>
            <input type="radio" name={`pCat_${formTypeTheme}`} value="Individual" checked={patientCategory === 'Individual'} onChange={() => setPatientCategory('Individual')} className="sr-only" />
            <User className="h-5 w-5 text-[#2A758C]" />
            <div className="mt-3">
              <h5 className="text-xs font-bold text-slate-800">Individual</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">Cash / Transfer / POS Direct Payments</p>
            </div>
          </label>

          <label className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
            patientCategory === 'Family'
              ? 'border-[#2A758C] bg-white shadow-2xs ring-2 ring-[#2A758C]/20'
              : 'border-slate-200 bg-white/80 hover:bg-white'
          }`}>
            <input type="radio" name={`pCat_${formTypeTheme}`} value="Family" checked={patientCategory === 'Family'} onChange={() => setPatientCategory('Family')} className="sr-only" />
            <Users className="h-5 w-5 text-emerald-600" />
            <div className="mt-3">
              <h5 className="text-xs font-bold text-slate-800">Family Account</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">Deduct from Family Deposit Pool</p>
            </div>
          </label>

          <label className={`p-3.5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
            patientCategory === 'Company'
              ? 'border-[#2A758C] bg-white shadow-2xs ring-2 ring-[#2A758C]/20'
              : 'border-slate-200 bg-white/80 hover:bg-white'
          }`}>
            <input type="radio" name={`pCat_${formTypeTheme}`} value="Company" checked={patientCategory === 'Company'} onChange={() => setPatientCategory('Company')} className="sr-only" />
            <Briefcase className="h-5 w-5 text-indigo-600" />
            <div className="mt-3">
              <h5 className="text-xs font-bold text-slate-800">Company / HMO Invoice</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">Corporate Retainership / HMO Coverage</p>
            </div>
          </label>
        </div>

        {patientCategory === 'Family' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Family Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Williams Family"
                  value={selectedFamilyId}
                  onChange={(e) => setSelectedFamilyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-[#2A758C]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Relationship to Head of Family</label>
                <select
                  value={familyRelationship}
                  onChange={(e) => setFamilyRelationship(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-[#2A758C]"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Dependent">Dependent</option>
                  <option value="Principal">Principal / Head of Family</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {patientCategory === 'Company' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company / HMO Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shell Petroleum / Hygeia HMO"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-[#2A758C]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Staff / Policy ID</label>
                <input type="text" placeholder="e.g. EMP-449" value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-[#2A758C]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Designation</label>
                <input type="text" placeholder="e.g. Senior Officer" value={designation} onChange={e => setDesignation(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-[#2A758C]" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Authorization Ref / HMO Code</label>
                <input type="text" placeholder="e.g. Ref: ZMC-AUTH-882" value={letterReference} onChange={e => setLetterReference(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs outline-hidden focus:border-[#2A758C]" />
              </div>
              <div className="md:col-span-3">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <input type="checkbox" checked={letterVerified} onChange={e => setLetterVerified(e.target.checked)} className="rounded text-[#2A758C]" />
                  <span className="text-[11px] font-bold text-slate-700">Corporate authorization / HMO coverage confirmed.</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" id="opd-workflow-panel">
      {/* 1. HEADER SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#A3D1E0]/20 rounded-2xl flex items-center justify-center text-[#2A758C] font-black">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Out-Patient Department (OPD)</h1>
            <p className="text-xs text-slate-500 font-medium">Official Zikora Medical Center Intake & Nurse Triage Desk</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* TOP LEVEL VIEW SELECTOR FOR ADMINS/DOCTORS */}
          <div className="department-page-nav flex bg-slate-50 border border-slate-100 p-1.5 rounded-2xl gap-1">
            {currentUser?.role !== 'Nurse' && (
              <>
                <button
                  onClick={() => setActiveSubTab('reception')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'reception'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Reception Desk
                </button>

                <button
                  onClick={() => setActiveSubTab('returning')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'returning'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Returning Patient
                </button>

                <button
                  onClick={() => setActiveSubTab('admissions')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === 'admissions'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Admissions & Balances
                </button>
              </>
            )}

            {currentUser?.role !== 'Receptionist' && currentUser?.role !== 'Records Officer' && (
              <button
                onClick={() => setActiveSubTab('nursing')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'nursing'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Nursing Front-Desk
              </button>
            )}

            <button
              onClick={() => setActiveSubTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'catalog'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Price Catalogue
            </button>

            <button
              onClick={() => setActiveSubTab('records')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === 'records'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Medical Reports & HMS
            </button>

            {['Administrator', 'Management', 'Records Officer'].includes(currentUser?.role) && (
              <button
                onClick={() => setActiveSubTab('replacements')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'replacements'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Card Replacements
              </button>
            )}
          </div>

          {/* Prominent header-level Export / Download Registry button */}
          <div className="relative">
            <button
              id="header-export-btn"
              onClick={() => setIsHeaderDownloadOpen(!isHeaderDownloadOpen)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black shadow-sm rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer border border-slate-300 shrink-0"
              title="Download / Export Patient Data"
            >
              <Download className="h-4 w-4 text-black shrink-0" />
              <span>Export Patient Registry</span>
            </button>

            {isHeaderDownloadOpen && (
              <>
                {/* Backdrop to close dropdown */}
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsHeaderDownloadOpen(false)}
                />
                
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-20 py-1.5 overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Download Data ({filteredPatients.length} rows)</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleDownloadExcel();
                      setIsHeaderDownloadOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/excel.png" className="h-4 w-4 object-contain shrink-0" referrerPolicy="no-referrer" alt="Excel" />
                    <span>Excel Spreadsheet (.csv)</span>
                  </button>

                  <button
                    onClick={() => {
                      handleDownloadDoc();
                      setIsHeaderDownloadOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/google.png" className="h-4 w-4 object-contain shrink-0" referrerPolicy="no-referrer" alt="Google Doc" />
                    <span>Google Doc / Word (.doc)</span>
                  </button>

                  <button
                    onClick={() => {
                      handleDownloadPdf();
                      setIsHeaderDownloadOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/pdf1.png" className="h-4 w-4 object-contain shrink-0" referrerPolicy="no-referrer" alt="PDF" />
                    <span>Print Report / PDF (.pdf)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Alerts */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 text-sm font-medium"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="flex-1">{success}</div>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-600">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex items-center gap-3 text-sm font-medium"
          >
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          SUBTAB 1: RECEPTION WORKSPACE
          ========================================== */}
      {activeSubTab === 'reception' && (
        <div className="space-y-6">
          {/* Daily Registration Counts Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="daily-intake-stats">
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 bg-[#A3D1E0]/15 rounded-xl flex items-center justify-center text-[#2A758C] shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Total Today</p>
                <p className="text-lg font-bold text-slate-800 font-mono">{totalToday}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Standard Card</p>
                <p className="text-lg font-bold text-slate-800 font-mono">{standardToday}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <Baby className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Maternity Card</p>
                <p className="text-lg font-bold text-slate-800 font-mono">{maternityToday}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">Emergency Card</p>
                <p className="text-lg font-bold text-slate-800 font-mono">{emergencyToday}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Patients Intake & Registrations Log - Now Full Width */}
            <div className="w-full bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Registered Patient Files</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Search, queue visits, or replace clinical cards</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    id="opd-regular-intake-btn"
                    onClick={() => handleOpenRegister('standard')}
                    className="px-4 py-2 bg-[#2A758C] hover:bg-[#205b6d] text-white font-black rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95 border border-[#1f5869]"
                    title="Register a new regular out-patient"
                  >
                    <Plus className="h-4 w-4 text-white stroke-[2.5]" />
                    <span>Regular Intake</span>
                  </button>
                  <button
                    id="opd-maternity-intake-btn"
                    onClick={() => handleOpenRegister('maternity')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border border-emerald-200/60"
                  >
                    <Plus className="h-3 w-3" />
                    Maternity Intake
                  </button>
                  <button
                    id="opd-emergency-intake-btn"
                    onClick={() => handleOpenRegister('emergency')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold rounded-xl text-[11px] flex items-center gap-1.5 transition-all cursor-pointer border border-rose-200/60"
                  >
                    <Plus className="h-3 w-3" />
                    Emergency Intake
                  </button>
                </div>
              </div>

            {/* Search Input & Download/Export Dropdown */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search patient file by Name, Hospital No, Phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 focus:border-[#A3D1E0] focus:ring-1 focus:ring-[#A3D1E0] focus:bg-white rounded-xl py-2 pl-9 pr-4 text-[11px] font-semibold text-slate-700 placeholder-slate-400 transition-all outline-none"
                />
              </div>

              {/* Export/Download Button */}
              <ExportButton
                exportType="patients"
                search={search}
                label="Download Registry"
                className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-extrabold"
                onSuccess={(msg) => setSuccess(msg)}
                onFailure={(msg) => setError(msg)}
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                    <th className="p-2.5">Hospital Number</th>
                    <th className="p-2.5">Patient Name</th>
                    <th className="p-2.5">Card Category</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-xs text-slate-400 font-medium">
                        No registered patients found. Click "New Registration" to start.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient, idx) => {
                      const age = getAge(patient.dateOfBirth);
                      return (
                        <tr key={`${patient.id}-${idx}`} className="text-[11px] hover:bg-slate-50/50 transition-colors">
                          <td className="p-2.5 font-mono font-bold text-[#2A758C]">{patient.hospitalNumber}</td>
                          <td className="p-2.5">
                            <p className="font-bold text-slate-800">{patient.name}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{patient.gender}, {age} Years</p>
                          </td>
                          <td className="p-2.5 font-semibold text-slate-600">{patient.cardType}</td>
                          <td className="p-2.5 text-slate-600 font-mono text-[10px]">{patient.phoneNumber}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              patient.status === 'History Refreshed'
                                ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                : 'bg-slate-50 text-slate-700 border border-slate-100'
                            }`}>
                              {patient.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-right space-x-1.5 flex items-center justify-end">
                            <button
                              onClick={() => handleOpenEncounter(patient)}
                              className="px-2.5 py-1 bg-[#A3D1E0]/15 hover:bg-[#A3D1E0]/30 text-[#2a758c] font-bold rounded-lg text-[10px] transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <PlusCircle className="h-2.5 w-2.5" /> Queue Visit
                            </button>
                            <button
                              onClick={() => handleOpenReplacement(patient)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[10px] transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Replace Lost Card"
                            >
                              <CreditCard className="h-2.5 w-2.5" /> Replace Card
                            </button>
                            <div className="relative inline-block text-left">
                              <button
                                onClick={() => setActiveDownloadPatientId(activeDownloadPatientId === patient.id ? null : patient.id)}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] transition-all cursor-pointer inline-flex items-center gap-1 border border-emerald-100 shadow-2xs hover:scale-105"
                                title="Download Patient Data / Medical Card"
                              >
                                <Download className="h-3 w-3 text-emerald-600" />
                                <span>Download</span>
                              </button>

                              {activeDownloadPatientId === patient.id && (
                                <>
                                  <div className="fixed inset-0 z-30" onClick={() => setActiveDownloadPatientId(null)} />
                                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-slate-100 rounded-xl shadow-xl z-40 py-1 overflow-hidden text-left">
                                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Download options</p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        handleDownloadSingleExcel(patient);
                                        setActiveDownloadPatientId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/excel.png" className="h-4 w-4 object-contain shrink-0" referrerPolicy="no-referrer" alt="Excel" />
                                      <span>Excel / CSV (.csv)</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDownloadSingleDoc(patient);
                                        setActiveDownloadPatientId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/google.png" className="h-4 w-4 object-contain shrink-0" referrerPolicy="no-referrer" alt="Google Doc" />
                                      <span>Word Document (.doc)</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDownloadSinglePdf(patient);
                                        setActiveDownloadPatientId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                    >
                                      <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/pdf1.png" className="h-4 w-4 object-contain shrink-0" referrerPolicy="no-referrer" alt="PDF" />
                                      <span>Print Card / PDF (.pdf)</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Accounts Profile Directory Panel - Now relocated below the main table for full section width support */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Family Deposit accounts panel */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#A3D1E0]" />
                  Family Deposit Balances
                </h3>
                <p className="text-[10px] text-slate-500">Shared family cards deducting from centralized balances</p>
              </div>

              <div className="space-y-2.5">
                {families.map((fam) => (
                  <div key={fam.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800">{fam.name} Account</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5"> مرکزی ڈپازٹ کھاتہ</p>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <span className="text-[11px] font-mono font-bold text-slate-950">₦{parseFloat(fam.balance).toLocaleString()}</span>
                      </div>
                      <button
                        onClick={() => handleOpenDeposit(fam)}
                        className="p-1 text-[#2A758C] hover:bg-[#A3D1E0]/20 rounded-lg transition-colors cursor-pointer"
                        title="Top Up Deposit Balance"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Corporate Billing account panel */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#A3D1E0]" />
                  Corporate Company Accounts
                </h3>
                <p className="text-[10px] text-slate-500">Authorized monthly corporate billings</p>
              </div>

              <div className="space-y-2.5">
                {companies.map((comp) => (
                  <div key={comp.id} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800">{comp.name}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5">Code: {comp.code}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-bold uppercase rounded-lg border border-emerald-100">
                      Monthly Invoice
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* ==========================================
          SUBTAB: RETURNING PATIENTS DIRECTORY
          ========================================== */}
      {activeSubTab === 'returning' && (
        <ReturningPatientView
          userRole={currentUser?.role}
          onReQueueSuccess={() => {
            fetchQueue();
          }}
        />
      )}

      {/* ==========================================
          SUBTAB: ADMISSIONS & BALANCE MANAGEMENT
          ========================================== */}
      {activeSubTab === 'admissions' && (
        <AdmissionsView userRole={currentUser?.role} />
      )}

      {/* ==========================================
          SUBTAB 2: NURSING FRONT-DESK WORKSPACE (QUEUE)
          ========================================== */}
      {activeSubTab === 'nursing' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Nursing Triage Active Queue</h2>
            <p className="text-[11px] text-slate-500 font-medium">Prioritized clinical queue of incoming patient encounters</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-2.5">Priority</th>
                  <th className="p-2.5">Hospital Number</th>
                  <th className="p-2.5">Patient Name</th>
                  <th className="p-2.5">Visit Type</th>
                  <th className="p-2.5">Clinic Room</th>
                  <th className="p-2.5">Queue Status</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {queueItems.filter(q => q.queue_type === 'Nursing Front-Desk').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-xs text-slate-400 font-medium">
                      No patients currently waiting at the Nursing desk.
                    </td>
                  </tr>
                ) : (
                  queueItems.filter(q => q.queue_type === 'Nursing Front-Desk').map((item) => {
                    const age = getAge(item.date_of_birth);
                    const isEmergency = item.priority === 'Emergency';
                    const isUrgent = item.priority === 'Urgent';
                    return (
                      <tr key={item.id} className={`text-[11px] hover:bg-slate-50/50 transition-colors ${
                        isEmergency ? 'bg-rose-50/30' : isUrgent ? 'bg-amber-50/20' : ''
                      }`}>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isEmergency 
                              ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' 
                              : isUrgent 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono font-bold text-[#2A758C]">{item.hospital_number}</td>
                        <td className="p-2.5">
                          <p className="font-bold text-slate-800">{item.patient_name}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{item.gender}, {age} Years</p>
                        </td>
                        <td className="p-2.5 text-slate-600 font-medium">{item.visit_type}</td>
                        <td className="p-2.5 text-slate-600 font-medium">{item.destination_clinic}</td>
                        <td className="p-2.5">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {item.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right space-x-1.5">
                          <button
                            onClick={() => handleOpenVitals(item)}
                            className="px-2.5 py-1.5 bg-[#A3D1E0] text-slate-900 font-bold rounded-lg text-[10px] transition-all hover:bg-[#82bdcf] cursor-pointer"
                          >
                            Take Vitals & Route
                          </button>
                          <button
                            onClick={() => handleOpenEscalate(item)}
                            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                          >
                            Escalate Priority
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 3: PRICE CATALOGUE PANEL
          ========================================== */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-6">
          {/* ZMC Access Points Guide */}
          <div className="bg-gradient-to-br from-slate-900 via-[#1E4D5B] to-[#14353F] rounded-3xl p-6 text-white border border-slate-800 shadow-lg space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <span className="text-[10px] bg-[#A3D1E0]/20 text-[#A3D1E0] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                  Official Intake Protocol
                </span>
                <h2 className="text-xl font-bold text-white mt-1.5">ZMC Hospital Access Points</h2>
                <p className="text-xs text-slate-300 font-medium max-w-2xl font-sans">
                  Authorized regulatory pathways, billing schedules, and access codes for clinical intake at Zenith Medical Center.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl border border-white/5 self-start md:self-auto">
                <Shield className="h-4 w-4 text-[#A3D1E0]" />
                <span className="text-[11px] font-bold text-[#A3D1E0] font-mono">SECURE INTEGRATION</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Emergency */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/20 text-rose-300 rounded-xl">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">a. Emergency (Unbooked)</h3>
                    <p className="text-[10px] text-slate-300">24/7 Priority Emergency Intake</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-200 space-y-2 leading-relaxed font-medium">
                  <p>
                    Immediate, unbooked admissions for trauma, complications, or acute illness. 
                    After-hours doctors are on-call <strong>(6:00 PM – 8:00 AM)</strong>.
                  </p>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 space-y-1.5 font-mono text-rose-200">
                    <div className="flex justify-between">
                      <span>Sick Emergency:</span>
                      <span className="font-bold">₦25,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unbooked Labour:</span>
                      <span className="font-bold">₦50,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accidents / Trauma:</span>
                      <span className="font-bold">₦50,000</span>
                    </div>
                    <div className="border-t border-rose-500/20 pt-1 flex justify-between text-xs font-bold text-rose-300">
                      <span>On-Call Doctor Surcharge:</span>
                      <span>₦5,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Antenatal */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#A3D1E0]/20 text-[#A3D1E0] rounded-xl">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">b. Antenatal Visits</h3>
                    <p className="text-[10px] text-slate-300">Weekly Scheduled Obstetric Care</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-200 space-y-2 leading-relaxed font-medium font-sans">
                  <p>
                    Booked pregnant women are expected weekly on <strong>Tuesdays or Thursdays</strong>. Card expires automatically upon childbirth.
                  </p>
                  <div className="bg-[#2A758C]/20 border border-[#2A758C]/30 rounded-xl p-3 space-y-1.5 font-mono text-[#A3D1E0]">
                    <div className="flex justify-between">
                      <span>Card Bundle (One-time):</span>
                      <span className="font-bold">₦5,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Per-Visit Fee:</span>
                      <span className="font-bold">₦1,000</span>
                    </div>
                    <div className="flex justify-between text-white border-t border-[#2A758C]/30 pt-1.5">
                      <span>First Visit Lab Package:</span>
                      <span className="font-bold">₦8,500</span>
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-2 text-[10px] text-slate-300 border border-white/5">
                    <strong className="text-white">Included Lab Tests:</strong> VDRL (Syphilis), HP (H. Pylori), MP (Malaria), RVS (Retroviral), UA (Urinalysis).
                  </div>
                </div>
              </div>

              {/* Regular Sick */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">c. Regular Sick Patients</h3>
                    <p className="text-[10px] text-slate-300">Outpatient Consultation Paths</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-200 space-y-2 leading-relaxed font-medium font-sans">
                  <p>
                    Standard clinical registration path for new symptoms, general consultations, or revisits.
                  </p>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1.5 font-mono text-emerald-200">
                    <div className="flex justify-between">
                      <span>New Patient Card:</span>
                      <span className="font-bold">₦3,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Revisiting Patient:</span>
                      <span className="font-bold">₦0 (Active Card)</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-300 italic">
                    Revisiting patients bypass card creation fees and go straight to clinical queuing upon showing an active registration card.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Catalog */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-sans">Clinical Pricing Catalog</h2>
                <p className="text-xs text-slate-500 font-medium font-sans">Dynamic, verified prices synced with live PostgreSQL database records</p>
              </div>
              <button 
                onClick={fetchPrices}
                className="p-2 hover:bg-slate-50 rounded-xl border border-slate-100 text-slate-500 transition-all cursor-pointer"
                title="Sync from Database"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {prices.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 font-medium text-xs">
                  No prices returned. Syncing with the backend...
                </div>
              ) : (
                prices.map((item) => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between hover:border-slate-200 transition-all shadow-3xs">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-bold text-[#2A758C] bg-[#A3D1E0]/20 px-2 py-0.5 rounded-md uppercase font-mono">
                          {item.category}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono font-medium">{item.item_code}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-2 line-clamp-2">{item.item_name}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5">ZMC Official Price Schedule</p>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                      <span className="text-xs font-mono font-black text-slate-950">₦{parseFloat(item.price).toLocaleString()}</span>
                      
                      {['Administrator', 'Management'].includes(currentUser?.role) && (
                        <button
                          onClick={() => handleOpenPriceEdit(item)}
                          className="px-2 py-1 bg-slate-200/60 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[9px] transition-colors cursor-pointer"
                        >
                          Modify
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB: MEDICAL REPORTS & HMS ARCHIVE
          ========================================== */}
      {activeSubTab === 'records' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#2A758C]" />
                Medical Records & Clinical HMS Archive
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Search patients, export clinical health summaries (PDF/Word/Excel), and inspect medical histories
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ExportButton
                exportType="patients"
                label="Export Patient Registry"
                className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-extrabold"
              />
            </div>
          </div>

          {/* Search bar and Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient name, hospital number (e.g. ZMC-2026-001), or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2A758C]/20"
              />
            </div>
            <div className="text-xs font-bold text-slate-400 px-3 py-2 bg-slate-50 rounded-xl font-mono shrink-0">
              Total Records: {filteredPatients.length}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50/80">
                  <th className="p-3.5">Hospital No.</th>
                  <th className="p-3.5">Patient Full Name</th>
                  <th className="p-3.5">Gender / Age</th>
                  <th className="p-3.5">Phone / Contact</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Medical Report Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-10 text-xs text-slate-400 font-medium">
                      No matching patient medical records found.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => (
                    <tr key={p.id} className="text-xs hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#2A758C]">
                        {p.hospital_number || p.hospitalNumber || p.id}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {p.name}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {p.gender} • {p.age ? `${p.age} yrs` : (p.date_of_birth ? p.date_of_birth.split('T')[0] : 'N/A')}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono">
                        {p.phone_number || p.phoneNumber || 'N/A'}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase font-mono">
                          {p.card_type || p.cardType || 'Standard'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                          p.status?.includes('Admitted')
                            ? 'bg-sky-100 text-sky-800'
                            : p.status?.includes('Emergency')
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {p.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedDetailPatient(p)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Open full HMS Patient Record"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-600" />
                            <span>View HMS</span>
                          </button>

                          <ExportButton
                            exportType="medical-records"
                            patientId={p.hospital_number || p.hospitalNumber || p.id}
                            label="Download HMS"
                            className="bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 font-extrabold py-1.5 px-3 text-xs rounded-xl"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          SUBTAB 4: CARD REPLACEMENTS LOG
          ========================================== */}
      {activeSubTab === 'replacements' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Card Replacement & History Refresh Logs</h2>
            <p className="text-xs text-slate-500 font-medium">Audit records of reissued cards and automated clinical cleanup events</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-3">Patient Name</th>
                  <th className="p-3">Old Number</th>
                  <th className="p-3">New Reissue</th>
                  <th className="p-3">Approved By</th>
                  <th className="p-3">Office Claimed</th>
                  <th className="p-3">History Reset?</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {replacements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-xs text-slate-400 font-medium">
                      No card replacement records recorded yet.
                    </td>
                  </tr>
                ) : (
                  replacements.map((r) => (
                    <tr key={r.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{r.patient_name}</td>
                      <td className="p-3 font-mono text-slate-500">{r.old_card_number}</td>
                      <td className="p-3 font-mono font-bold text-[#2A758C]">{r.new_card_number}</td>
                      <td className="p-3 text-slate-600 font-medium">{r.approved_by}</td>
                      <td className="p-3 text-slate-600 font-medium">{r.last_office_seen}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-100">
                          {r.history_refreshed ? 'YES (RESET)' : 'NO'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{r.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: NEW PATIENT REGISTRATION FORM
          ========================================== */}
      <AnimatePresence>
        {isRegisterOpen && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-3xl p-6 w-full max-w-2xl border border-slate-100 max-h-[90vh] overflow-y-auto shadow-xl space-y-6"
                >
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <UserPlus className="h-5 w-5 text-[#2A758C]" />
                      <h3 className="text-base font-bold text-slate-900">ZMC OPD Patient File Intake</h3>
                    </div>
                    <button onClick={handleCloseRegisterModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Duplicate warnings inside registration modal */}
                  {showDuplicateWarning && duplicatesFound.length > 0 && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xs text-rose-800 uppercase tracking-wide">
                          <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
                          DUPLICATE PATIENT FILE DETECTED — REGISTRATION BLOCKED
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-800 font-mono">
                          Existing File Exists
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-rose-800">
                        The system found {duplicatesFound.length} existing patient record(s) matching this Name or Phone Number. 
                        <strong>Duplicate patient registration is blocked</strong> to avoid splitting medical records. Please click below to open the existing file.
                      </p>
                      <div className="space-y-2 bg-white/90 p-3 rounded-xl border border-rose-200">
                        {duplicatesFound.map(dup => (
                          <div key={dup.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="font-mono">
                              <span className="font-bold text-[#2A758C] bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded mr-2">
                                {dup.hospital_number || dup.hospitalNumber}
                              </span>
                              <span className="font-bold text-slate-800">{dup.name}</span>
                              <span className="text-slate-500 text-[11px] ml-2 font-sans">({dup.phone_number || dup.phoneNumber})</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleCloseRegisterModal();
                                setSelectedDetailPatient(dup);
                              }}
                              className="px-3 py-1.5 bg-[#2A758C] hover:bg-[#205b6d] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                            >
                              Open Existing Patient File →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mandatory fields indication banner */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 rounded-xl text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="text-rose-600 font-black text-sm leading-none">*</span>
                      <span>Fields marked with a red asterisk are <strong>mandatory</strong> for patient file creation.</span>
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-bold">
                      EMR Requirement
                    </span>
                  </div>

                  {/* Dynamic Registration Tabs at the top */}
                  <div className="flex bg-slate-100/80 border border-slate-200/80 p-1.5 rounded-2xl gap-1.5" id="intake-form-tabs">
                    <button
                      id="intake-tab-regular"
                      type="button"
                      onClick={() => {
                        setRegTab('standard');
                        setCardType('Standard');
                        setGender('Male');
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        regTab === 'standard'
                          ? 'bg-[#2A758C] text-white shadow-sm font-black'
                          : 'bg-white/90 text-slate-700 hover:bg-white border border-slate-200/60 shadow-2xs'
                      }`}
                    >
                      Regular Intake Form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegTab('maternity');
                        setCardType('Maternity');
                        setGender('Female');
                        setMaritalStatus('Married');
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        regTab === 'maternity'
                          ? 'bg-emerald-600 text-white shadow-sm font-black'
                          : 'bg-white/90 text-emerald-800 hover:bg-white border border-emerald-200/60 shadow-2xs'
                      }`}
                    >
                      Maternity Form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegTab('emergency');
                        setCardType('Emergency');
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        regTab === 'emergency'
                          ? 'bg-rose-600 text-white shadow-sm font-black'
                          : 'bg-white/90 text-rose-800 hover:bg-white border border-rose-200/60 shadow-2xs'
                      }`}
                    >
                      Emergency Intake
                    </button>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-6 text-slate-700">
                    {/* 1. STANDARD REGISTRATION FORM */}
                    {regTab === 'standard' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {renderBillingCategoryProfileStep('standard')}

                        <div className="space-y-4 pt-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">2. Demographics & Card Info</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Full Name <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. John Doe"
                                value={name}
                                onChange={(e) => {
                                  setName(e.target.value);
                                  triggerDuplicateCheck(e.target.value, phoneNumber);
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Date of Birth <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                min="1900-01-01"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Phone Number <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                placeholder="e.g. +2348000000"
                                value={phoneNumber}
                                onChange={(e) => {
                                  setPhoneNumber(e.target.value);
                                  triggerDuplicateCheck(name, e.target.value);
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Gender <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Email Address <span className="text-slate-400 font-normal text-[10px] normal-case">(Optional)</span>
                              </label>
                              <input
                                type="email"
                                placeholder="e.g. patient@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Residential Address <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. No 12 Wuse II, Abuja"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Marital Status <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <select
                                value={maritalStatus}
                                onChange={(e) => setMaritalStatus(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              >
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Card Category Type <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <select
                                value={cardType}
                                onChange={(e) => {
                                  const val = e.target.value as 'Standard' | 'Maternity' | 'Emergency' | 'Eye Clinic';
                                  setCardType(val);
                                  if (val === 'Maternity') {
                                    setRegTab('maternity');
                                    setGender('Female');
                                    setMaritalStatus('Married');
                                  } else if (val === 'Emergency') {
                                    setRegTab('emergency');
                                  } else if (val === 'Eye Clinic') {
                                    setCardType('Eye Clinic');
                                  } else {
                                    setRegTab('standard');
                                    setCardType('Standard');
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-[#2A758C]"
                              >
                                <option value="Standard">Standard Card (₦3,000)</option>
                                <option value="Maternity">Maternity Card (₦5,000)</option>
                                <option value="Emergency">Emergency Card</option>
                                <option value="Eye Clinic">Eye Clinic Card (₦3,000)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Identification & Next of Kin */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">3. Identification & Next of Kin</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Government ID Type</label>
                              <select
                                value={regIdType}
                                onChange={(e) => setRegIdType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium font-sans"
                              >
                                <option value="">-- None --</option>
                                <option value="NIN">National Identification Number (NIN)</option>
                                <option value="BVN">Bank Verification Number (BVN)</option>
                                <option value="Drivers License">Driver's License</option>
                                <option value="Passport">International Passport</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID / Document Number</label>
                              <input
                                type="text"
                                placeholder="Enter selected ID number"
                                value={regIdNumber}
                                onChange={(e) => setRegIdNumber(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Next of Kin Name</label>
                              <input
                                type="text"
                                placeholder="Full name of next of kin"
                                value={regNextOfKinName}
                                onChange={(e) => setRegNextOfKinName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Relationship</label>
                                <select
                                  value={regNextOfKinRelationship}
                                  onChange={(e) => setRegNextOfKinRelationship(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-sans"
                                >
                                  <option value="Spouse">Spouse</option>
                                  <option value="Parent">Parent</option>
                                  <option value="Sibling">Sibling</option>
                                  <option value="Child">Child</option>
                                  <option value="Friend">Friend</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Next of Kin Phone</label>
                                <input
                                  type="tel"
                                  placeholder="Phone number"
                                  value={regNextOfKinPhone}
                                  onChange={(e) => setRegNextOfKinPhone(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Vital Signs fields (Adult: T - P - R - BP - W - H - SpO2) */}
                        <div className="space-y-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-[#2A758C]" /> 3. Vital Signs Record (Adult: T – P – R – BP – W)
                          </h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Temperature (°C)</label>
                              <input type="text" placeholder="36.5" value={regTemp} onChange={e => setRegTemp(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Pulse Rate (bpm)</label>
                              <input type="text" placeholder="72" value={regHR} onChange={e => setRegHR(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Respiration (/min)</label>
                              <input type="text" placeholder="16" value={regRR} onChange={e => setRegRR(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Blood Pressure (mmHg)</label>
                              <input type="text" placeholder="120/80" value={regBP} onChange={e => setRegBP(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Weight (kg)</label>
                              <input type="text" placeholder="70" value={regWeight} onChange={e => setRegWeight(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Height (cm)</label>
                              <input type="text" placeholder="170" value={regHeight} onChange={e => setRegHeight(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">SpO2 (%)</label>
                              <input type="text" placeholder="98" value={regSpo2} onChange={e => setRegSpo2(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 2. MATERNITY PATIENT REGISTRATION FORM */}
                    {regTab === 'maternity' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        {renderBillingCategoryProfileStep('maternity')}

                        <div className="space-y-4 pt-2">
                          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> 2. Expectant Mother Demographics
                          </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Full Name (Mother) <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Grace Amadi"
                            value={name}
                            onChange={(e) => {
                              setName(e.target.value);
                              triggerDuplicateCheck(e.target.value, phoneNumber);
                            }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Date of Birth <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="date"
                            required
                            max={new Date().toISOString().split('T')[0]}
                            min="1900-01-01"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Phone Number <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. +2348035555"
                            value={phoneNumber}
                            onChange={(e) => {
                              setPhoneNumber(e.target.value);
                              triggerDuplicateCheck(name, e.target.value);
                            }}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Email Address <span className="text-slate-400 font-normal text-[10px] normal-case">(Optional)</span>
                          </label>
                          <input
                            type="email"
                            placeholder="e.g. mother@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Residential Address <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. No 44 Gwarinpa, Abuja"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Marital Status <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <select
                            value={maritalStatus}
                            onChange={(e) => setMaritalStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                          >
                            <option value="Married">Married</option>
                            <option value="Single">Single</option>
                            <option value="Widowed">Widowed</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Gender <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input
                            type="text"
                            value="Female"
                            disabled
                            className="w-full bg-slate-100 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-500 font-bold cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Card Category Type <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <select
                            value={cardType}
                            onChange={(e) => {
                              const val = e.target.value as 'Standard' | 'Maternity' | 'Emergency' | 'Eye Clinic';
                              setCardType(val);
                              if (val === 'Standard') {
                                setRegTab('standard');
                              } else if (val === 'Emergency') {
                                setRegTab('emergency');
                              } else if (val === 'Eye Clinic') {
                                setRegTab('standard');
                                setCardType('Eye Clinic');
                              } else {
                                setRegTab('maternity');
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-emerald-600"
                          >
                            <option value="Standard">Standard Card (₦3,000)</option>
                            <option value="Maternity">Maternity Card (₦5,000)</option>
                            <option value="Emergency">Emergency Card</option>
                            <option value="Eye Clinic">Eye Clinic Card (₦3,000)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Identification & Next of Kin */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <UserPlus className="h-4 w-4" /> 3. Identification & Next of Kin
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Government ID Type</label>
                          <select
                            value={regIdType}
                            onChange={(e) => setRegIdType(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium font-sans"
                          >
                            <option value="">-- None --</option>
                            <option value="NIN">National Identification Number (NIN)</option>
                            <option value="BVN">Bank Verification Number (BVN)</option>
                            <option value="Drivers License">Driver's License</option>
                            <option value="Passport">International Passport</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID / Document Number</label>
                          <input
                            type="text"
                            placeholder="Enter selected ID number"
                            value={regIdNumber}
                            onChange={(e) => setRegIdNumber(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Next of Kin Name</label>
                          <input
                            type="text"
                            placeholder="Full name of next of kin"
                            value={regNextOfKinName}
                            onChange={(e) => setRegNextOfKinName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Relationship</label>
                            <select
                              value={regNextOfKinRelationship}
                              onChange={(e) => setRegNextOfKinRelationship(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-sans"
                            >
                              <option value="Spouse">Spouse</option>
                              <option value="Parent">Parent</option>
                              <option value="Sibling">Sibling</option>
                              <option value="Child">Child</option>
                              <option value="Friend">Friend</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Next of Kin Phone</label>
                            <input
                              type="tel"
                              placeholder="Phone number"
                              value={regNextOfKinPhone}
                              onChange={(e) => setRegNextOfKinPhone(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Clinical obstetric history */}
                    <div className="space-y-4 bg-emerald-50/40 p-4.5 rounded-2xl border border-emerald-100">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Layers className="h-4 w-4" /> 4. Maternity & Obstetric History
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Gravida (G) <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input type="text" placeholder="e.g. 2" required value={gravida} onChange={e => setGravida(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Para (P) <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input type="text" placeholder="e.g. 1" required value={para} onChange={e => setPara(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Abortion (A) <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input type="text" placeholder="e.g. 0" required value={abortion} onChange={e => setAbortion(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">
                            Premature (Pr) <span className="text-rose-500 font-bold">*</span>
                          </label>
                          <input type="text" placeholder="e.g. 0" required value={premature} onChange={e => setPremature(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Last Menstrual Period (LMP)</label>
                          <input type="date" value={lmp} onChange={e => setLmp(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Expected Delivery Date (EDD)</label>
                          <input type="date" value={edd} onChange={e => setEdd(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Gestational Age (weeks)</label>
                          <input type="text" placeholder="e.g. 14 weeks" value={gestationalAge} onChange={e => setGestationalAge(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Tribe / Ethnic group</label>
                          <input type="text" placeholder="e.g. Igbo" value={tribe} onChange={e => setTribe(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Occupation</label>
                          <input type="text" placeholder="e.g. Teacher" value={occupation} onChange={e => setOccupation(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs" />
                        </div>
                      </div>
                    </div>

                    {/* Vitals fields */}
                    <div className="space-y-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Activity className="h-4 w-4" /> 5. Current Admission Vitals Check
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Blood Pressure (BP)</label>
                          <input type="text" placeholder="120/80" value={regBP} onChange={e => setRegBP(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Temperature (°C)</label>
                          <input type="text" placeholder="36.5" value={regTemp} onChange={e => setRegTemp(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Heart Rate (bpm)</label>
                          <input type="text" placeholder="72" value={regHR} onChange={e => setRegHR(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Resp Rate (bpm)</label>
                          <input type="text" placeholder="16" value={regRR} onChange={e => setRegRR(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">SpO2 (%)</label>
                          <input type="text" placeholder="98" value={regSpo2} onChange={e => setRegSpo2(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Weight (kg)</label>
                          <input type="text" placeholder="70" value={regWeight} onChange={e => setRegWeight(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Height (cm)</label>
                          <input type="text" placeholder="170" value={regHeight} onChange={e => setRegHeight(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 3. EMERGENCY INTENSIVE INTAKE FORM */}
                {regTab === 'emergency' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-900 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold">CRITICAL PROTOCOL:</span> Register and immediately collect cash or process. Dispatch patient IMMEDIATELY to the doctor on-call. Do not keep emergency patients waiting at the reception lobby!
                      </div>
                    </div>

                    {renderBillingCategoryProfileStep('emergency')}

                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <User className="h-4 w-4" /> 2. Emergency Trauma Case Profile
                      </h4>

                      {/* Conscious / Personal Details Provider Toggle */}
                      <div className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="patientCanProvideDetails"
                          checked={patientCanProvideDetails}
                          onChange={(e) => {
                            const conscious = e.target.checked;
                            setPatientCanProvideDetails(conscious);
                            setIsIdVerified(false);
                            setUseIdVerification(false);
                            setRegIdType('');
                            setRegIdNumber('');
                            if (!conscious) {
                              setName('Unidentified Emergency Patient');
                              setPhoneNumber('Unknown');
                              setAddress('Emergency Trauma Scene');
                            } else {
                              setName('');
                              setPhoneNumber('');
                              setAddress('');
                            }
                          }}
                          className="rounded text-rose-600 focus:ring-rose-500 cursor-pointer h-4 w-4"
                        />
                        <label htmlFor="patientCanProvideDetails" className="text-xs font-bold text-rose-900 cursor-pointer select-none">
                          Patient is conscious and able to provide their own personal/identification details
                        </label>
                      </div>

                      {patientCanProvideDetails ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Patient Full Name (or Unidentified alias) <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. John Doe or Trauma Male 1"
                                value={name}
                                onChange={(e) => {
                                  setName(e.target.value);
                                  triggerDuplicateCheck(e.target.value, phoneNumber);
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Approx Date of Birth <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                max={new Date().toISOString().split('T')[0]}
                                min="1900-01-01"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Phone Number <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="tel"
                                required
                                placeholder="e.g. +23480..."
                                value={phoneNumber}
                                onChange={(e) => {
                                  setPhoneNumber(e.target.value);
                                  triggerDuplicateCheck(name, e.target.value);
                                }}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Gender <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <select
                                value={emergencyGender}
                                onChange={(e) => setEmergencyGender(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Marital Status <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <select
                                value={emergencyMaritalStatus}
                                onChange={(e) => setEmergencyMaritalStatus(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              >
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Email Address <span className="text-slate-400 font-normal text-[10px] normal-case">(Optional)</span>
                              </label>
                              <input
                                type="email"
                                placeholder="e.g. unknown@gmail.com"
                                value={emergencyEmail}
                                onChange={(e) => setEmergencyEmail(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Card Category Type <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <select
                                value={cardType}
                                onChange={(e) => {
                                  const val = e.target.value as 'Standard' | 'Maternity' | 'Emergency' | 'Eye Clinic';
                                  setCardType(val);
                                  if (val === 'Standard') {
                                    setRegTab('standard');
                                  } else if (val === 'Maternity') {
                                    setRegTab('maternity');
                                    setGender('Female');
                                    setMaritalStatus('Married');
                                  } else if (val === 'Eye Clinic') {
                                    setRegTab('standard');
                                    setCardType('Eye Clinic');
                                  } else {
                                    setRegTab('emergency');
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-rose-600"
                              >
                                <option value="Standard">Standard Card (₦3,000)</option>
                                <option value="Maternity">Maternity Card (₦5,000)</option>
                                <option value="Emergency">Emergency Card</option>
                                <option value="Eye Clinic">Eye Clinic Card (₦3,000)</option>
                              </select>
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Residential / Scene Address <span className="text-rose-500 font-bold">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Accident spot, Airport road"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-2">
                          <div className="flex gap-2 items-center text-rose-700 font-bold text-xs">
                            <span className="inline-block w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse" />
                            <span>Patient Unconscious / Identification Unavailable</span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">
                            The patient's personal profile will be registered as <strong className="font-semibold text-slate-900">Unidentified Emergency Patient</strong>. You may update their details later from their folder once conscious. Please verify the details of the bystander or person who brought them in below.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* DYNAMIC: PATIENT ID & NEXT OF KIN OR BROUGHT IN BY DETAILS */}
                    {patientCanProvideDetails ? (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <UserPlus className="h-4 w-4" /> 3. Patient Identification & Next of Kin
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Government ID Type</label>
                            <select
                              value={regIdType}
                              onChange={(e) => setRegIdType(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium font-sans"
                            >
                              <option value="">-- None --</option>
                              <option value="NIN">National Identification Number (NIN)</option>
                              <option value="BVN">Bank Verification Number (BVN)</option>
                              <option value="Drivers License">Driver's License</option>
                              <option value="Passport">International Passport</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID / Document Number</label>
                            <input
                              type="text"
                              placeholder="Enter patient ID number"
                              value={regIdNumber}
                              onChange={(e) => setRegIdNumber(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Next of Kin Full Name</label>
                            <input
                              type="text"
                              placeholder="Full name of next of kin"
                              value={regNextOfKinName}
                              onChange={(e) => setRegNextOfKinName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Relationship</label>
                              <select
                                value={regNextOfKinRelationship}
                                onChange={(e) => setRegNextOfKinRelationship(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-sans"
                              >
                                <option value="Spouse">Spouse</option>
                                <option value="Parent">Parent</option>
                                <option value="Sibling">Sibling</option>
                                <option value="Child">Child</option>
                                <option value="Friend">Friend</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Next of Kin Phone</label>
                              <input
                                type="tel"
                                placeholder="Phone number"
                                value={regNextOfKinPhone}
                                onChange={(e) => setRegNextOfKinPhone(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-4 border-t border-slate-100 bg-rose-50/10 p-4 rounded-2xl border border-rose-100/40">
                        <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Users className="h-4 w-4" /> 3. Details of Person Who Brought Patient In
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Brought In By (Full Name) <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Full name of person who brought them in"
                              value={broughtInByName}
                              onChange={(e) => {
                                setBroughtInByName(e.target.value);
                                if (broughtInByRelationship === 'Next of Kin') {
                                  setRegNextOfKinName(e.target.value);
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Brought In By Phone Number <span className="text-rose-500 font-bold">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="Phone number of person bringing them in"
                              value={broughtInByPhone}
                              onChange={(e) => {
                                  setBroughtInByPhone(e.target.value);
                                  if (broughtInByRelationship === 'Next of Kin') {
                                    setRegNextOfKinPhone(e.target.value);
                                  }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Relationship to Patient</label>
                            <select
                              value={broughtInByRelationship}
                              onChange={(e) => {
                                setBroughtInByRelationship(e.target.value);
                                setRegNextOfKinRelationship(e.target.value);
                                if (e.target.value === 'Next of Kin') {
                                  setRegNextOfKinName(broughtInByName);
                                  setRegNextOfKinPhone(broughtInByPhone);
                                }
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-sans"
                            >
                              <option value="Next of Kin">Next of Kin</option>
                              <option value="Good Samaritan">Good Samaritan</option>
                              <option value="Friend">Friend / Colleague</option>
                              <option value="Police Officer">Police Officer</option>
                              <option value="Paramedic">Paramedic / EMT</option>
                              <option value="Other">Other Bystander</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID Type of Person</label>
                              <select
                                value={broughtInByIdType}
                                onChange={(e) => setBroughtInByIdType(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-sans"
                              >
                                <option value="">-- None --</option>
                                <option value="NIN">NIN</option>
                                <option value="BVN">BVN</option>
                                <option value="Drivers License">Driver's License</option>
                                <option value="Passport">Passport</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">ID / Document Number</label>
                              <input
                                type="text"
                                placeholder="ID format (Id number)"
                                value={broughtInByIdNumber}
                                onChange={(e) => setBroughtInByIdNumber(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Multi-charges checkboxes */}
                    <div className="space-y-4 bg-rose-50/40 p-4.5 rounded-2xl border border-rose-100">
                      <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <CreditCard className="h-4 w-4" /> 4. Emergency Incident Multi-Charges & Doctor on-Call
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                        <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 cursor-pointer text-xs font-semibold">
                          <input type="checkbox" checked={isSickEmergency} onChange={e => setIsSickEmergency(e.target.checked)} className="rounded" />
                          <span>Sick Emergency Care (+₦25,000)</span>
                        </label>
                        <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 cursor-pointer text-xs font-semibold">
                          <input type="checkbox" checked={isUnbookedLabour} onChange={e => setIsUnbookedLabour(e.target.checked)} className="rounded" />
                          <span>Unbooked cases / Labour (+₦50,000)</span>
                        </label>
                        <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 cursor-pointer text-xs font-semibold col-span-1">
                          <input type="checkbox" checked={isAccident} onChange={e => setIsAccident(e.target.checked)} className="rounded" />
                          <span>Accident Case (+₦50,000)</span>
                        </label>
                        <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 cursor-pointer text-xs font-semibold col-span-1">
                          <input type="checkbox" checked={isDoctorOnCall || isAfterHours} onChange={e => {
                            const val = e.target.checked;
                            setIsDoctorOnCall(val);
                            setIsAfterHours(val);
                          }} className="rounded" />
                          <span>Doctor On-Call (+₦5,000)</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-rose-100/60 text-slate-700">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Assigned Doctor On-Call Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dr. Okafor"
                            value={emergencyDoctorName}
                            onChange={e => setEmergencyDoctorName(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Total Bill (₦)</label>
                          <input
                            type="text"
                            required
                            value={emergencyTotalBill}
                            onChange={e => setEmergencyTotalBill(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Cash Collected (₦)</label>
                          <input
                            type="text"
                            required
                            placeholder="Minimum ₦5,000"
                            value={emergencyCashCollected}
                            onChange={e => setEmergencyCashCollected(e.target.value)}
                            className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-bold text-emerald-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vitals fields */}
                    <div className="space-y-4 bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Activity className="h-4 w-4" /> 5. Fast Triage Vitals Check
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Blood Pressure (BP)</label>
                          <input type="text" placeholder="120/80" value={regBP} onChange={e => setRegBP(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Temperature (°C)</label>
                          <input type="text" placeholder="36.5" value={regTemp} onChange={e => setRegTemp(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Heart Rate (bpm)</label>
                          <input type="text" placeholder="72" value={regHR} onChange={e => setRegHR(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Resp Rate (bpm)</label>
                          <input type="text" placeholder="16" value={regRR} onChange={e => setRegRR(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">SpO2 (%)</label>
                          <input type="text" placeholder="98" value={regSpo2} onChange={e => setRegSpo2(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Weight (kg)</label>
                          <input type="text" placeholder="70" value={regWeight} onChange={e => setRegWeight(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Height (cm)</label>
                          <input type="text" placeholder="170" value={regHeight} onChange={e => setRegHeight(e.target.value)} className="w-full bg-white border border-slate-100 rounded-lg p-2 text-xs font-mono" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Footer and Submit Area */}
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Assigned Registration Fee</p>
                    <p className="text-base font-mono font-black text-slate-900">₦{getCalculatedCardFee().toLocaleString()}</p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCloseRegisterModal}
                      className="px-4.5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isRegistering || (showDuplicateWarning && duplicatesFound.length > 0)}
                      className="px-5 py-2.5 bg-[#A3D1E0] hover:bg-[#82bdcf] disabled:bg-rose-100 disabled:text-rose-700 text-slate-900 font-bold rounded-xl text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      {isRegistering && <Loader2 className="h-3 w-3 animate-spin" />}
                      {isRegistering
                        ? 'Registering...'
                        : (showDuplicateWarning && duplicatesFound.length > 0)
                        ? 'Blocked: Duplicate File Exists'
                        : 'Register Patient Profile'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: REGISTRATION SUCCESS CHECKLIST
          ========================================== */}
      <AnimatePresence>
        {isSuccessModalOpen && registeredPatient && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-4xl w-full p-6 text-slate-800"
            >
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-5">
                <div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold font-mono text-[10px] rounded-full uppercase tracking-wider">
                    Registration Completed Successfully
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mt-1">
                    OPD Clerk Checklist & File Setup
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    setSuccessCheckedFolder(false);
                    setSuccessCheckedCards(false);
                    setSuccessCheckedReceipt(false);
                    setSuccessCheckedTriage(false);
                  }}
                  className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Column: Patient Profile & Card Downloads */}
                <div className="md:col-span-7 space-y-4">
                  
                  {/* Image-Style Alert Card */}
                  <div className="bg-[#1C1613] text-[#F3E8E2] p-5 rounded-2xl shadow-lg border border-neutral-800 space-y-3 font-sans">
                    <p className="text-sm font-bold tracking-wide">
                      Patient registered! ID: <span className="text-[#E6C5B3] font-mono select-all">{registeredPatient.hospitalNumber}</span>
                    </p>
                    <p className="text-sm font-bold">
                      Consultation Fee: <span className="text-[#E6C5B3]">₦5,000</span>
                    </p>
                    <p className="text-xs text-neutral-300 font-medium leading-relaxed">
                      Please direct patient to <strong className="text-white underline decoration-wavy decoration-[#E6C5B3] underline-offset-4">CASHIER</strong> for payment.
                    </p>
                    <div className="flex justify-end pt-1">
                      <span 
                        onClick={() => {
                          setSuccessCheckedReceipt(true);
                        }}
                        className="px-3 py-1 bg-[#F3E8E2] text-neutral-950 text-[10px] font-black rounded-lg uppercase tracking-wider shadow-xs hover:bg-neutral-200 transition-colors cursor-pointer select-none"
                      >
                        OK
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                      Registered Profile Summary
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Patient Name:</span>
                        <span className="font-bold text-slate-900">{registeredPatient.name}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Date of Birth:</span>
                        <span className="font-mono text-slate-800">
                          {registeredPatient.dateOfBirth ? registeredPatient.dateOfBirth.split('T')[0] : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Gender / Sex:</span>
                        <span className="font-semibold text-slate-800">{registeredPatient.gender || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Card Category:</span>
                        <span className="font-bold text-sky-700">{registeredPatient.cardType || 'Standard'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 1: Standard ID details */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono block">CARD TYPE 1</span>
                        <span className="text-xs font-bold text-slate-900">Standard Clinical Card</span>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded-lg border border-blue-100">
                        {registeredPatient.hospitalNumber}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mb-4">
                      Permanent clinical folder ID for non-maternity outpatient visits. Cost: <strong>₦3,000 NGN</strong>.
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleDownloadSinglePdf(registeredPatient)}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Download standard card PDF"
                      >
                        <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/pdf1.png" className="h-3.5 w-3.5 object-contain" referrerPolicy="no-referrer" alt="PDF" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={() => handleDownloadSingleDoc(registeredPatient)}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Download standard card Word Doc"
                      >
                        <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/google.png" className="h-3.5 w-3.5 object-contain" referrerPolicy="no-referrer" alt="Google Doc" />
                        <span>Word</span>
                      </button>
                      <button
                        onClick={() => handleDownloadSingleExcel(registeredPatient)}
                        className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Download standard card Excel CSV"
                      >
                        <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/excel.png" className="h-3.5 w-3.5 object-contain" referrerPolicy="no-referrer" alt="Excel" />
                        <span>Excel</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Maternity Card (if applicable) */}
                  {registeredPatient.cardType === 'Maternity' && (
                    <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-4 shadow-2xs">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className="text-[9px] font-bold text-pink-400 uppercase tracking-wider font-mono block">CARD TYPE 2</span>
                          <span className="text-xs font-bold text-pink-900 font-sans">Temporary Maternity ID</span>
                        </div>
                        <span className="px-2 py-0.5 bg-pink-100 text-pink-700 font-mono text-[10px] font-bold rounded-lg border border-pink-200">
                          {registeredPatient.maternityNumber || registeredPatient.hospitalNumber?.replace('ZMC', 'MAT')}
                        </span>
                      </div>

                      <p className="text-[11px] text-pink-700/80 mb-3 leading-relaxed">
                        Temporary Obstetric/Antenatal file card. Cost: <strong>₦2,000 NGN</strong>. Expires immediately upon delivery. 
                        Non-maternity clinical visits require Standard ID card.
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => {
                            handleDownloadSinglePdf(registeredPatient);
                          }}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-pink-50 border border-pink-200 text-pink-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                          title="Download both cards in a 2-page PDF document"
                        >
                          <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/pdf1.png" className="h-3.5 w-3.5 object-contain" referrerPolicy="no-referrer" alt="PDF" />
                          <span>PDF (Both)</span>
                        </button>
                        <button
                          onClick={() => handleDownloadSingleDoc(registeredPatient)}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-pink-50 border border-pink-200 text-pink-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                          title="Download word document with both cards formatted"
                        >
                          <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/google.png" className="h-3.5 w-3.5 object-contain" referrerPolicy="no-referrer" alt="Google Doc" />
                          <span>Word</span>
                        </button>
                        <button
                          onClick={() => handleDownloadSingleExcel(registeredPatient)}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-pink-50 border border-pink-200 text-pink-700 rounded-lg text-[11px] font-semibold transition-all cursor-pointer"
                          title="Download Excel CSV with dual rows"
                        >
                          <img src="https://kelechieze.wordpress.com/wp-content/uploads/2026/07/excel.png" className="h-3.5 w-3.5 object-contain" referrerPolicy="no-referrer" alt="Excel" />
                          <span>Excel</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Automated System Routing Pipeline */}
                <div className="md:col-span-5 bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono block">AUTOMATED PIPELINE</span>
                        <h4 className="text-xs font-bold text-slate-900">System Workflow & Patient Dispatch</h4>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-200 shadow-2xs">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
                        Transferred to Cashier
                      </span>
                    </div>

                    {/* Step-by-step Automated Pipeline */}
                    <div className="space-y-3 pt-1">
                      {/* Step 1: OPD Registration (Done) */}
                      <div className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                        <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-900">1. OPD Registration Completed</p>
                            <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">DONE</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            Profile & Hospital ID <span className="font-mono font-bold text-slate-700">{registeredPatient.hospitalNumber}</span> stored in PostgreSQL EMR.
                          </p>
                        </div>
                      </div>

                      {/* Step 2: Cashier Verification (Active Queue) */}
                      <div className="flex items-start gap-3 p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/80 shadow-2xs">
                        <div className="h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                          <CreditCard className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-amber-950">2. Cashier Department Queue</p>
                            <span className="text-[9px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded animate-pulse">AWAITING PAYMENT</span>
                          </div>
                          <p className="text-[10px] text-amber-900/80 font-medium mt-0.5">
                            Information sent to Cashier. Awaiting payment verification (Cash, POS, or Transfer) for ₦{registeredPatient.cardFee ? registeredPatient.cardFee.toLocaleString() : '5,000'}.
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Doctor Consultation (Next Step) */}
                      <div className="flex items-start gap-3 p-2.5 bg-white/60 rounded-xl border border-slate-200/60 opacity-75">
                        <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-700">3. Doctor's Waiting Room</p>
                            <span className="text-[9px] font-mono font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">NEXT STEP</span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                            The system will automatically forward the patient to the Doctor's clinic queue as soon as Cashier confirms payment.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 font-medium leading-relaxed flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>No manual clerk action required:</strong> The Cashier will see {registeredPatient.name} under pending registration payments.
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsSuccessModalOpen(false);
                      setSuccessCheckedFolder(false);
                      setSuccessCheckedCards(false);
                      setSuccessCheckedReceipt(false);
                      setSuccessCheckedTriage(false);
                      setSuccess(`OPD registration completed! ${registeredPatient.name} moved to Cashier queue.`);
                    }}
                    className="w-full mt-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white transition-colors text-xs font-bold rounded-xl shadow-xs cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <span>Done & Return to Registry</span>
                  </button>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: VISIT ENCOUNTER & QUEUEING FORM
          ========================================== */}
      <AnimatePresence>
        {isEncounterOpen && selectedPatient && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#2A758C]" />
                  <h3 className="text-base font-bold text-slate-900">Queue Patient Visit</h3>
                </div>
                <button onClick={() => setIsEncounterOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono font-bold">Patient Details</p>
                <p className="text-xs font-bold text-slate-800 mt-1">{selectedPatient.name}</p>
                <p className="text-[11px] font-mono text-[#2A758C] mt-0.5">{selectedPatient.hospitalNumber}</p>
              </div>

              <form onSubmit={handleEncounterSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Visit Consultation Type</label>
                  <select
                    value={encounterVisitType}
                    onChange={(e) => setEncounterVisitType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                  >
                    <option value="New Patient Consultation">New Patient Consultation</option>
                    <option value="Returning Patient Consultation">Returning Patient Consultation</option>
                    <option value="Antenatal Checkup">Antenatal Checkup</option>
                    <option value="Follow-up">Follow-up</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Destination Clinic Room</label>
                  <select
                    value={encounterClinic}
                    onChange={(e) => setEncounterClinic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800"
                  >
                    <option value="General OPD Out-Patient Clinic">General OPD Out-Patient Clinic</option>
                    <option value="Eye Clinic">Eye Clinic (Ophthalmology)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Priority Classification</label>
                  <select
                    value={encounterPriority}
                    onChange={(e) => setEncounterPriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                {encounterPriority !== 'Routine' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-[10px] font-bold text-rose-800 uppercase mb-1.5">Priority Escalation Reason (Required)</label>
                    <textarea
                      required
                      placeholder="Specify reasons for urgency (vitals threshold, labor, severe bleeding etc.)"
                      value={encounterReason}
                      onChange={(e) => setEncounterReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 h-20"
                    />
                  </motion.div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEncounterOpen(false)}
                    className="px-4.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isQueueing}
                    className="px-5 py-2 bg-[#A3D1E0] hover:bg-[#82bdcf] disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isQueueing && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isQueueing ? 'Sending...' : 'Confirm & Send to Queue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: RECORD SICKNESS-APPROPRIATE VITALS
          ========================================== */}
      <AnimatePresence>
        {isVitalsOpen && selectedQueueItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#2A758C]" />
                  <h3 className="text-base font-bold text-slate-900">Record Sickness/Age Vitals</h3>
                </div>
                <button onClick={() => setIsVitalsOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Patient Information */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                <p className="font-bold text-slate-800">{selectedQueueItem.patient_name}</p>
                <div className="flex justify-between text-slate-500 mt-1 font-mono text-[10px]">
                  <span>Hospital No: {selectedQueueItem.hospital_number}</span>
                  <span>Age: {getAge(selectedQueueItem.date_of_birth)} Years</span>
                  <span>Gender: {selectedQueueItem.gender}</span>
                </div>
                {/* Visual guidelines warning based on rules */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex gap-2 text-[10px] text-slate-600 leading-normal">
                  <Info className="h-4 w-4 text-[#2A758C] shrink-0" />
                  <span>
                    {getAge(selectedQueueItem.date_of_birth) < 12 ? (
                      <span className="font-bold text-[#2A758C]">PEDIATRIC PATIENT: Record TPRW. Blood Pressure is auto-bypassed.</span>
                    ) : selectedQueueItem.visit_type === 'Antenatal Checkup' ? (
                      <span className="font-bold text-pink-700">ANTENATAL CHECKUP: Basic Checkup only (BP & Weight).</span>
                    ) : (
                      <span className="font-bold text-emerald-700">ADULT PATIENT: Full TPRBPW record required.</span>
                    )}
                  </span>
                </div>
              </div>

              <form onSubmit={handleVitalsSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Blood Pressure - Only for Adults or Antenatal */}
                  {getAge(selectedQueueItem.date_of_birth) >= 12 && (
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Blood Pressure (mmHg)</label>
                      <input
                        type="text"
                        placeholder="120/80"
                        value={vitalsBP}
                        onChange={(e) => setVitalsBP(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-mono font-bold"
                      />
                    </div>
                  )}

                  {/* Temperature - Bypassed for Antenatal */}
                  {selectedQueueItem.visit_type !== 'Antenatal Checkup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="36.5"
                        value={vitalsTemp}
                        onChange={(e) => setVitalsTemp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* Pulse Rate - Bypassed for Antenatal */}
                  {selectedQueueItem.visit_type !== 'Antenatal Checkup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Pulse Rate (bpm)</label>
                      <input
                        type="number"
                        placeholder="72"
                        value={vitalsPulse}
                        onChange={(e) => setVitalsPulse(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* Respiratory Rate - Bypassed for Antenatal */}
                  {selectedQueueItem.visit_type !== 'Antenatal Checkup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Resp Rate (cpm)</label>
                      <input
                        type="number"
                        placeholder="16"
                        value={vitalsResp}
                        onChange={(e) => setVitalsResp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* SpO2 - Bypassed for Antenatal */}
                  {selectedQueueItem.visit_type !== 'Antenatal Checkup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">SpO2 Oxygen (%)</label>
                      <input
                        type="number"
                        placeholder="98"
                        value={vitalsSpo2}
                        onChange={(e) => setVitalsSpo2(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* Weight - Everyone needs weight */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="70"
                      value={vitalsWeight}
                      onChange={(e) => setVitalsWeight(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-mono"
                    />
                  </div>

                  {/* Height - Only for Non-Antenatal */}
                  {selectedQueueItem.visit_type !== 'Antenatal Checkup' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        placeholder="170"
                        value={vitalsHeight}
                        onChange={(e) => setVitalsHeight(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsVitalsOpen(false)}
                    className="px-4.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingVitals}
                    className="px-5 py-2 bg-[#A3D1E0] hover:bg-[#82bdcf] disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSavingVitals && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isSavingVitals ? 'Saving...' : 'Save Vitals & Send to Doc Queue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: ESCALATE PRIORITY WITH REASON
          ========================================== */}
      <AnimatePresence>
        {isEscalateOpen && selectedQueueItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Escalate Queue Priority</h3>
                <button onClick={() => setIsEscalateOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleEscalateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Priority Level</label>
                  <select
                    value={escalatePriority}
                    onChange={(e) => setEscalatePriority(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-bold"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Escalation Reason</label>
                  <textarea
                    required
                    placeholder="Provide detailed clinical reason for queue escalation..."
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 h-24"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEscalateOpen(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEscalating}
                    className="px-5 py-2 bg-[#A3D1E0] hover:bg-[#82bdcf] disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isEscalating && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isEscalating ? 'Escalating...' : 'Save & Escalate Queue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: CARD REPLACEMENT LOGGING
          ========================================== */}
      <AnimatePresence>
        {isReplacementOpen && selectedPatient && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-rose-600" />
                  <h3 className="text-base font-bold text-slate-900">Replace Lost Clinical Card</h3>
                </div>
                <button onClick={() => setIsReplacementOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Warning about medical history reset */}
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl flex gap-3 text-xs">
                <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">MANDATORY HISTORICAL DATA REFRESH</p>
                  <p className="mt-1 leading-relaxed">
                    By submitting a card replacement, all historical vitals, maternity details, and emergency logs will be deleted.
                    The patient's status will be set to <span className="font-bold">"History Refreshed"</span>. This is a strict safety audit procedure.
                  </p>
                </div>
              </div>

              <form onSubmit={handleReplacementSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Patient Name</label>
                  <input type="text" disabled value={selectedPatient.name} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-500" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Old Card Number</label>
                    <input type="text" disabled value={replacementOldCard} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-500 font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Card Number</label>
                    <input type="text" required value={replacementNewCard} onChange={e => setReplacementNewCard(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Last Office Seen Claimed</label>
                  <select value={replacementOffice} onChange={e => setReplacementOffice(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800">
                    <option value="Nursing Front-Desk">Nursing Front-Desk</option>
                    <option value="Doctor Office">Doctor Office</option>
                    <option value="Reception / Records">Reception / Records</option>
                    <option value="Billing / Cashier">Billing / Cashier</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Reason for Replacement</label>
                  <textarea required value={replacementReason} onChange={e => setReplacementReason(e.target.value)} placeholder="Lost, damaged, stolen card details..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 h-20" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsReplacementOpen(false)} className="px-4.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingReplacement}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSavingReplacement && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isSavingReplacement ? 'Approving...' : 'Approve & Reset History'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: FAMILY ACCOUNT DEPOSIT TOP-UP
          ========================================== */}
      <AnimatePresence>
        {isDepositOpen && selectedFamily && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Family Account Deposit</h3>
                <button onClick={() => setIsDepositOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Family Account Head</label>
                  <input type="text" disabled value={`${selectedFamily.name} Head`} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-500 font-bold" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Top-up Deposit Amount (₦)</label>
                  <input type="number" required placeholder="5000" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-mono font-black" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Transaction Remarks</label>
                  <input type="text" value={depositDescription} onChange={e => setDepositDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsDepositOpen(false)} className="px-4.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDeposit}
                    className="px-5 py-2 bg-[#A3D1E0] hover:bg-[#82bdcf] disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSavingDeposit && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isSavingDeposit ? 'Confirming...' : 'Confirm Deposit'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: CATALOGUE PRICE MODIFICATION
          ========================================== */}
      <AnimatePresence>
        {isPriceEditOpen && selectedPriceItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-xl space-y-6"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Modify Catalogue Price</h3>
                <button onClick={() => setIsPriceEditOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handlePriceEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Item Code / Name</label>
                  <input type="text" disabled value={`${selectedPriceItem.item_code} - ${selectedPriceItem.item_name}`} className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-500" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">New Standard Price (₦)</label>
                  <input type="number" required value={editPriceVal} onChange={e => setEditPriceVal(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold" />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsPriceEditOpen(false)} className="px-4.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingPrice}
                    className="px-5 py-2 bg-[#A3D1E0] hover:bg-[#82bdcf] disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSavingPrice && <Loader2 className="h-3 w-3 animate-spin" />}
                    {isSavingPrice ? 'Saving...' : 'Save New Price'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Patient Detailed Medical Record Modal */}
      <PatientDetailModal
        isOpen={!!selectedDetailPatient}
        onClose={() => setSelectedDetailPatient(null)}
        patient={selectedDetailPatient}
      />
    </div>
  );
}
