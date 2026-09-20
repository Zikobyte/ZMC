import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface IdentityVerificationFormProps {
  idType: string;
  setIdType: (val: string) => void;
  idNumber: string;
  setIdNumber: (val: string) => void;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  dob: string;
  setDob: (val: string) => void;
  onVerifiedStatusChange: (isVerified: boolean) => void;
  isVerified: boolean;
  onNameAutoPopulate?: (fullName: string) => void;
}

export default function IdentityVerificationForm({
  idType,
  setIdType,
  idNumber,
  setIdNumber,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  dob,
  setDob,
  onVerifiedStatusChange,
  isVerified,
  onNameAutoPopulate
}: IdentityVerificationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Determine regex and character limits based on ID Type
  const getIdConstraints = (type: string) => {
    switch (type) {
      case 'NIN':
        return {
          placeholder: 'Enter 11-digit National Identification Number',
          maxLength: 11,
          pattern: /^\d{11}$/,
          helpText: 'Requires exactly 11 numeric digits.'
        };
      case 'BVN':
        return {
          placeholder: 'Enter 11-digit Bank Verification Number',
          maxLength: 11,
          pattern: /^\d{11}$/,
          helpText: 'Requires exactly 11 numeric digits.'
        };
      case 'DL':
        return {
          placeholder: 'Enter Driver\'s License number (e.g. ABC123456789)',
          maxLength: 12,
          pattern: /^[A-Z0-9]{10,12}$/i,
          helpText: '10 to 12 alphanumeric characters.'
        };
      case 'Passport':
        return {
          placeholder: 'Enter International Passport Number (e.g. A12345678)',
          maxLength: 9,
          pattern: /^[A-Z0-9]{8,9}$/i,
          helpText: '8 or 9 alphanumeric characters.'
        };
      case 'PVC':
        return {
          placeholder: 'Enter 19-digit Permanent Voter\'s Card number',
          maxLength: 19,
          pattern: /^[A-Z0-9]{18,19}$/i,
          helpText: '18 or 19 alphanumeric characters.'
        };
      default:
        return {
          placeholder: 'Please choose an ID Type first',
          maxLength: 30,
          pattern: /^.*$/,
          helpText: ''
        };
    }
  };

  const constraints = getIdConstraints(idType);

  // Trigger verification check when length matches expectations
  useEffect(() => {
    if (!idType || !idNumber) {
      onVerifiedStatusChange(false);
      setSuccess(false);
      setError(null);
      return;
    }

    const cleanNum = idNumber.trim();
    const isLengthValid = cleanNum.length === constraints.maxLength || 
      (idType === 'DL' && cleanNum.length >= 10 && cleanNum.length <= 12) ||
      (idType === 'Passport' && cleanNum.length >= 8 && cleanNum.length <= 9);

    if (isLengthValid) {
      const runVerification = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        onVerifiedStatusChange(false);

        try {
          const token = localStorage.getItem('zmc_token');
          const response = await fetch('/api/verify-identity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ id_type: idType, id_number: cleanNum })
          });

          const result = await response.json();

          if (response.ok && result.status === 'success') {
            setFirstName(result.first_name);
            setLastName(result.last_name);
            setDob(result.dob);
            setSuccess(true);
            onVerifiedStatusChange(true);
            if (onNameAutoPopulate) {
              onNameAutoPopulate(`${result.first_name} ${result.last_name}`);
            }
          } else {
            setError(result.error || 'Identity verification failed. ID details not found.');
            onVerifiedStatusChange(false);
          }
        } catch (err: any) {
          setError('Identity API provider timeout/offline. Please try again.');
          onVerifiedStatusChange(false);
        } finally {
          setLoading(false);
        }
      };

      runVerification();
    } else {
      // Clear populated data if they backspace or change number
      setSuccess(false);
      onVerifiedStatusChange(false);
      setError(null);
    }
  }, [idNumber, idType]);

  const handleIdTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIdType(e.target.value);
    setIdNumber('');
    setFirstName('');
    setLastName('');
    setDob('');
    setSuccess(false);
    onVerifiedStatusChange(false);
    setError(null);
  };

  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (idType === 'NIN' || idType === 'BVN') {
      val = val.replace(/\D/g, ''); // enforce numeric only
    }
    setIdNumber(val.slice(0, constraints.maxLength));
  };

  const handleReset = () => {
    setIdNumber('');
    setFirstName('');
    setLastName('');
    setDob('');
    setSuccess(false);
    onVerifiedStatusChange(false);
    setError(null);
  };

  return (
    <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100/80">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#2A758C]" />
          <span className="text-xs font-bold text-slate-700 font-mono tracking-wider">
            NIGERIAN INTRA-ID BIOMETRIC VERIFICATION
          </span>
        </div>
        {success && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] text-[#2A758C] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="h-2.5 w-2.5" /> Re-Verify
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ID Type Dropdown */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Select Nigerian ID Document
          </label>
          <select
            value={idType}
            onChange={handleIdTypeChange}
            className="w-full bg-white border border-slate-100 rounded-xl p-2.5 text-xs text-slate-800 font-medium outline-hidden focus:ring-1 focus:ring-[#A3D1E0] transition-all"
          >
            <option value="">-- Choose ID Document --</option>
            <option value="NIN">National Identification Number (NIN)</option>
            <option value="BVN">Bank Verification Number (BVN)</option>
            <option value="DL">Driver's License (DL)</option>
            <option value="Passport">International Passport</option>
            <option value="PVC">Permanent Voter's Card (PVC)</option>
          </select>
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            ID / Document Number
          </label>
          <div className="relative">
            <input
              type="text"
              disabled={!idType || success}
              value={idNumber}
              onChange={handleIdNumberChange}
              placeholder={constraints.placeholder}
              className={`w-full bg-white border border-slate-100 rounded-xl p-2.5 pr-8 text-xs text-slate-800 font-mono outline-hidden focus:ring-1 focus:ring-[#A3D1E0] transition-all ${
                !idType ? 'bg-slate-50 cursor-not-allowed text-slate-400' : ''
              } ${success ? 'bg-emerald-50/20 border-emerald-200 text-emerald-800' : ''}`}
            />
            {loading && (
              <div className="absolute right-3 top-3 text-[#2A758C]">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          {idType && !success && !loading && (
            <p className="text-[10px] text-slate-400 mt-1 font-medium italic">
              {constraints.helpText}
            </p>
          )}
        </div>
      </div>

      {/* Dynamic Loading/Success/Error states */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="p-3 bg-[#A3D1E0]/10 border border-[#A3D1E0]/20 rounded-xl flex items-center gap-2.5 text-[#2A758C]"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            <p className="text-[11px] font-bold">Querying official intranet biometric registry provider database...</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-emerald-800"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <p className="text-[11px] font-bold">Identity verified successfully! Clinical profile data auto-populated.</p>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2.5 text-rose-800"
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            <p className="text-[11px] font-bold">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disabled / Populate Read-Only Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Verified First Name
          </label>
          <input
            type="text"
            readOnly
            disabled
            placeholder="Auto-populated"
            value={firstName}
            className="w-full bg-slate-100/70 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-500 font-bold cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Verified Last Name
          </label>
          <input
            type="text"
            readOnly
            disabled
            placeholder="Auto-populated"
            value={lastName}
            className="w-full bg-slate-100/70 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-500 font-bold cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Verified Date of Birth
          </label>
          <input
            type="text"
            readOnly
            disabled
            placeholder="Auto-populated"
            value={dob}
            className="w-full bg-slate-100/70 border border-slate-100 rounded-xl p-2.5 text-xs text-slate-500 font-bold cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
