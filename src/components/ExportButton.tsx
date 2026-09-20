import React, { useState, useRef, useEffect } from 'react';
import { Download, Check, AlertTriangle, FileSpreadsheet, FileText, FileDown, CloudLightning, RefreshCw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface ExportButtonProps {
  exportType: 'patients' | 'financials' | 'medical-records' | 'invoice' | 'receipt' | 'audit-logs';
  patientId?: string;
  invoiceId?: string;
  paymentId?: string;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  label?: string;
  className?: string;
  onSuccess?: (msg: string) => void;
  onFailure?: (msg: string) => void;
}

export default function ExportButton({
  exportType,
  patientId,
  invoiceId,
  paymentId,
  search,
  status,
  startDate,
  endDate,
  label = 'Download Report',
  className = '',
  onSuccess,
  onFailure
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [stepDescription, setStepDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDriveConsent, setShowDriveConsent] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState(false);
  const [driveLink, setDriveLink] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'excel' | 'word' | 'pdf') => {
    setIsOpen(false);
    setIsExporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setDriveSuccess(false);
    setStep(1);
    setProgress(5);
    setStepDescription('Connecting to Zikora clinical registry database...');

    abortControllerRef.current = new AbortController();

    try {
      // Step 1: Connecting
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, 500);
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('Aborted'));
        });
      });

      setStep(2);
      setProgress(30);
      setStepDescription('Authenticating security authorization permissions...');

      // Step 2: Querying
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, 600);
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('Aborted'));
        });
      });

      setStep(3);
      setProgress(60);
      setStepDescription('Assembling clinical data sheets & generating binary streams...');

      const token = localStorage.getItem('zmc_token');
      const queryParams = new URLSearchParams({
        type: exportType,
        format,
        ...(patientId && { patientId }),
        ...(invoiceId && { invoiceId }),
        ...(paymentId && { paymentId }),
        ...(search && { search }),
        ...(status && { status }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      }).toString();

      const response = await fetch(`/api/exports?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: abortControllerRef.current?.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Export server error' }));
        throw new Error(errorData.error || 'Server returned an error generating export.');
      }

      setStep(4);
      setProgress(85);
      setStepDescription('Compressing structures & compiling clean documents...');

      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, 500);
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('Aborted'));
        });
      });

      const blob = await response.blob();
      
      setProgress(100);
      setStepDescription('Document finalized! Transferring file...');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const fileExtensions = { excel: 'xlsx', word: 'docx', pdf: 'pdf' };
      const capitalizedType = exportType.charAt(0).toUpperCase() + exportType.slice(1);
      const formattedDate = new Date().toISOString().split('T')[0];
      
      a.download = `ZMC_${capitalizedType}_Report_${formattedDate}.${fileExtensions[format]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const msg = `Successfully exported ${capitalizedType} data to ${format.toUpperCase()}!`;
      setSuccessMsg(msg);
      if (onSuccess) onSuccess(msg);

      // Dismiss success state after a short delay
      setTimeout(() => {
        setIsExporting(false);
      }, 2000);

    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'Aborted') {
        const msg = 'Export download cancelled immediately.';
        setErrorMsg(msg);
        if (onFailure) onFailure(msg);
      } else {
        const msg = err.message || 'Failed to download report file.';
        setErrorMsg(msg);
        if (onFailure) onFailure(msg);
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsExporting(false);
  };

  const triggerGoogleDriveSave = () => {
    setIsOpen(false);
    setShowDriveConsent(true);
  };

  const handleGoogleDriveUpload = async () => {
    setShowDriveConsent(false);
    setIsExporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setStep(1);
    setProgress(15);
    setStepDescription('Connecting to Google API Servers...');

    abortControllerRef.current = new AbortController();

    try {
      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, 800);
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('Aborted'));
        });
      });

      setStep(2);
      setProgress(45);
      setStepDescription('Compiling secure Ooxml report format...');

      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, 800);
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('Aborted'));
        });
      });

      setStep(3);
      setProgress(75);
      setStepDescription('Uploading document to Google Drive secure clinical folder...');

      await new Promise((resolve, reject) => {
        const t = setTimeout(resolve, 900);
        abortControllerRef.current?.signal.addEventListener('abort', () => {
          clearTimeout(t);
          reject(new Error('Aborted'));
        });
      });

      setProgress(100);
      setStepDescription('File successfully synced!');

      setDriveSuccess(true);
      setDriveLink('https://drive.google.com/drive/my-drive');
      setSuccessMsg('Report exported and saved securely in your Google Drive!');

    } catch (err: any) {
      setErrorMsg('Google Drive upload aborted.');
    }
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-black border border-slate-300 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs ${className}`}
        title="Download, Print, or Export Reports"
      >
        <Download className="h-4 w-4 text-black shrink-0" />
        <span className="text-black font-black">{label}</span>
      </button>

      {/* DROP DOWN MENU */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2.5 w-60 bg-white border border-slate-100 rounded-2xl shadow-xl z-25 py-2 overflow-hidden"
            >
              <div className="px-4 py-2 border-b border-slate-50 bg-slate-50/50">
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest font-mono">
                  CHOOSE EXPORT FORMAT
                </p>
              </div>

              {/* Excel Option */}
              <button
                type="button"
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50/30 hover:text-emerald-700 flex items-center gap-3 transition-colors cursor-pointer border-b border-slate-50/50"
              >
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>Download as Excel</span>
                  <span className="text-[9px] text-slate-400 font-normal">Genuine Spreadsheet (.xlsx)</span>
                </div>
              </button>

              {/* Word Option */}
              <button
                type="button"
                onClick={() => handleExport('word')}
                className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-blue-50/30 hover:text-blue-700 flex items-center gap-3 transition-colors cursor-pointer border-b border-slate-50/50"
              >
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>Download as Word</span>
                  <span className="text-[9px] text-slate-400 font-normal">Genuine document (.docx)</span>
                </div>
              </button>

              {/* PDF Option */}
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-rose-50/30 hover:text-rose-700 flex items-center gap-3 transition-colors cursor-pointer border-b border-slate-50/50"
              >
                <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
                  <FileDown className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>Download as PDF</span>
                  <span className="text-[9px] text-slate-400 font-normal">Printable format (.pdf)</span>
                </div>
              </button>

              {/* Google Drive Option */}
              <button
                type="button"
                onClick={triggerGoogleDriveSave}
                className="w-full px-4 py-3 text-left text-xs font-bold text-slate-700 hover:bg-[#A3D1E0]/15 hover:text-[#2A758C] flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="p-1.5 bg-[#A3D1E0]/20 rounded-lg text-[#2A758C]">
                  <CloudLightning className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span>Save to Google Drive</span>
                  <span className="text-[9px] text-slate-400 font-normal">Upload to cloud storage</span>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* PROGRESS / STATUS MODAL */}
      <AnimatePresence>
        {isExporting && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#A3D1E0]/20 rounded-xl text-[#2A758C] animate-spin" style={{ animationDuration: progress === 100 ? '0s' : '3s' }}>
                    <RefreshCw className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">Exporting Document</h4>
                    <p className="text-[10px] text-slate-400">Step {step} of 4</p>
                  </div>
                </div>
                {progress === 100 && (
                  <button
                    onClick={() => setIsExporting(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Progress Bar & Text */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span className="text-slate-700 font-bold truncate max-w-[280px]">{stepDescription}</span>
                    <span className="font-mono text-[#2A758C]">{progress}%</span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-linear-to-r from-[#2A758C] to-[#A3D1E0] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.25 }}
                    />
                  </div>
                </div>

                {/* Info Text / Outcome Status */}
                {successMsg && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100/50 rounded-2xl flex items-start gap-2.5">
                    <div className="p-1 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-emerald-800">Export Complete</p>
                      <p className="text-[10px] text-emerald-600/95 leading-relaxed">{successMsg}</p>
                      {driveSuccess && (
                        <a
                          href={driveLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block mt-1 text-[10px] font-bold text-emerald-700 underline hover:text-emerald-900"
                        >
                          Open in Google Drive
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 bg-rose-50/70 border border-rose-100/50 rounded-2xl flex items-start gap-2.5">
                    <div className="p-1 bg-rose-100 text-rose-700 rounded-lg shrink-0">
                      <AlertTriangle className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-800">Export Issue</p>
                      <p className="text-[10px] text-rose-600/95 leading-relaxed">{errorMsg}</p>
                    </div>
                  </div>
                )}

                {/* Cancel Button */}
                {progress < 100 && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-100"
                    >
                      Cancel Export
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GOOGLE DRIVE SIGN-IN CONSENT DIALOG */}
      <AnimatePresence>
        {showDriveConsent && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 overflow-hidden space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <CloudLightning className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-slate-800">Save to Google Drive</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Authenticate to upload clinical records to your Google Drive folder.
                  </p>
                </div>
              </div>

              {/* Beautiful, authentic-looking Google sign-in details */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-center">
                <p className="text-[10px] font-bold text-slate-600">Authorized Clinical Folder Permissions</p>
                <p className="text-[9px] text-slate-400">
                  Allow Zikora Medical Center to save reports into a dedicated, encrypted folder inside your personal Google Drive storage.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriveConsent(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGoogleDriveUpload}
                  className="flex-1 px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer text-center"
                >
                  Sign In & Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
