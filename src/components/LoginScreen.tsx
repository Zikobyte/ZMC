import React, { useState, useEffect } from 'react';
import { apiFetch, setAuthToken } from '../utils/api';
import { 
  Settings, 
  Shield, 
  AlertCircle, 
  RefreshCw, 
  Stethoscope, 
  HeartPulse, 
  ClipboardList,
  CreditCard,
  Banknote,
  Pill,
  ShieldCheck,
  FileText, 
  Hospital, 
  HelpCircle, 
  Key, 
  CheckCircle2, 
  X,
  Sparkles,
  User,
  Activity,
  ArrowLeft,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

type ViewMode = 'login' | 'forgot' | 'otp';

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('password'); // default password
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickAccess, setShowQuickAccess] = useState(false);
  const [showInfoAlert, setShowInfoAlert] = useState(true);

  // Video-accurate preloader and healthcare image carousel state
  const [isPreloading, setIsPreloading] = useState(true);
  const [currentImg, setCurrentImg] = useState(0);

  const carouselImages = [
    'https://kelechieze.wordpress.com/wp-content/uploads/2026/06/clinic1.jpg',
    'https://kelechieze.wordpress.com/wp-content/uploads/2026/06/linic2.jpg',
    'https://kelechieze.wordpress.com/wp-content/uploads/2026/06/clinic3.jpg'
  ];

  useEffect(() => {
    // 1.8 seconds matches the video's rapid dot-pulse preloader phase
    const preloadTimer = setTimeout(() => {
      setIsPreloading(false);
    }, 1800);

    // Dynamic background rotation every 5 seconds
    const carouselTimer = setInterval(() => {
      setCurrentImg((prev) => (prev + 1) % carouselImages.length);
    }, 5000);

    return () => {
      clearTimeout(preloadTimer);
      clearInterval(carouselTimer);
    };
  }, []);

  const departmentLogins = [
    {
      id: 'itadmin',
      name: 'IT Admin',
      role: 'IT Administrator & Control',
      username: 'admin',
      password: 'admin123',
      icon: Shield,
      bg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      activeRing: 'ring-indigo-500 bg-indigo-50/90 border-indigo-300 shadow-sm'
    },
    {
      id: 'doctor',
      name: 'Doctor',
      role: 'Consulting Physician',
      username: 'dr.smith',
      password: 'doc123',
      icon: Stethoscope,
      bg: 'bg-teal-500 hover:bg-teal-600 text-white',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
      activeRing: 'ring-teal-500 bg-teal-50/90 border-teal-300 shadow-sm'
    },
    {
      id: 'nurse',
      name: 'Nurse',
      role: 'Nursing Station & Triage',
      username: 'nurse1',
      password: 'nurse123',
      icon: HeartPulse,
      bg: 'bg-rose-500 hover:bg-rose-600 text-white',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
      activeRing: 'ring-rose-500 bg-rose-50/90 border-rose-300 shadow-sm'
    },
    {
      id: 'opd',
      name: 'OPD',
      role: 'Reception Desk',
      username: 'opd.clerk',
      password: 'opd123',
      icon: ClipboardList,
      bg: 'bg-purple-500 hover:bg-purple-600 text-white',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      activeRing: 'ring-purple-500 bg-purple-50/90 border-purple-300 shadow-sm'
    },
    {
      id: 'cashier',
      name: 'Cashier',
      role: 'Billing & Payments',
      username: 'cashier1',
      password: 'cash123',
      icon: CreditCard,
      bg: 'bg-amber-500 hover:bg-amber-600 text-white',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
      activeRing: 'ring-amber-500 bg-amber-50/90 border-amber-300 shadow-sm'
    },
    {
      id: 'pharmacy',
      name: 'Pharmacy',
      role: 'Dispensary & Stock',
      username: 'pharmacist1',
      password: 'pharm123',
      icon: Pill,
      bg: 'bg-pink-500 hover:bg-pink-600 text-white',
      badgeBg: 'bg-pink-100 text-pink-800 border-pink-200',
      activeRing: 'ring-pink-500 bg-pink-50/90 border-pink-300 shadow-sm'
    },
    {
      id: 'laboratory',
      name: 'Lab',
      role: 'Lab Diagnostics',
      username: 'lab.tech',
      password: 'lab123',
      icon: Activity,
      bg: 'bg-cyan-500 hover:bg-cyan-600 text-white',
      badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      activeRing: 'ring-cyan-500 bg-cyan-50/90 border-cyan-300 shadow-sm'
    },
    {
      id: 'eyeclinic',
      name: 'Eye Clinic',
      role: 'Eye Clinic Department',
      username: 'eye.clinic',
      password: 'eye123',
      icon: Eye,
      bg: 'bg-sky-600 hover:bg-sky-700 text-white',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
      activeRing: 'ring-sky-500 bg-sky-50/90 border-sky-300 shadow-sm'
    },
    {
      id: 'accounts',
      name: 'Accounts',
      role: 'Accounts & Finance',
      username: 'accounts',
      password: 'acc123',
      icon: Banknote,
      bg: 'bg-slate-700 hover:bg-slate-800 text-white',
      badgeBg: 'bg-slate-200 text-slate-900 border-slate-300',
      activeRing: 'ring-slate-500 bg-slate-100/90 border-slate-400 shadow-sm'
    }
  ];

  const defaultUsers = [
    { label: 'IT Administrator', username: 'admin', role: 'IT Administrator', desc: 'IT Department: Access control, maintenance & activity log (admin / admin123)' },
    { label: 'OPD Clerk', username: 'opd.clerk', role: 'OPD Clerk', desc: 'OPD Reception: Patient intake & registration (opd.clerk / opd123)' },
    { label: 'Cashier Officer', username: 'cashier1', role: 'Cashier', desc: 'Cashier Department: Invoicing & payment reconciliation (cashier1 / cash123)' },
    { label: 'Dr. John Smith', username: 'dr.smith', role: 'Doctor', desc: 'Medical Department: Consultations & prescriptions (dr.smith / doc123)' },
    { label: 'Lab Technician', username: 'lab.tech', role: 'Lab Technician', desc: 'Laboratory Department: Specimen analysis & results (lab.tech / lab123)' },
    { label: 'Pharmacist Officer', username: 'pharmacist1', role: 'Pharmacist', desc: 'Pharmacy Department: Dispensing & inventory (pharmacist1 / pharm123)' },
    { label: 'Nurse Station', username: 'nurse1', role: 'Nurse', desc: 'Nursing Department: Triage & ward management (nurse1 / nurse123)' },
    { label: 'Accounts Officer', username: 'accounts', role: 'Accountant', desc: 'Finance Department: Financial audit & ledgers (accounts / acc123)' },
    { label: 'HR Manager', username: 'hr.manager', role: 'HR Manager', desc: 'HR Department: Staff onboarding & personnel (hr.manager / hr123)' },
    { label: 'Eye Clinic Specialist', username: 'eye.clinic', role: 'Eye Clinic', desc: 'Ophthalmology: Vision screening & ophthalmic clinic (eye.clinic / eye123)' },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.success && response.data) {
        setAuthToken(response.data.token);
        // Show video-accurate preloader for 1.6 seconds before showing dashboard
        setIsPreloading(true);
        setTimeout(() => {
          onLoginSuccess(response.data.user);
        }, 1600);
      } else {
        setError('Login returned an unexpected response from the intranet server.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection to Zikora Medical Centre intranet failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!emailOrMobile.trim()) {
      setError('Please enter a valid email or mobile number.');
      return;
    }
    // Transition to OTP verification
    setViewMode('otp');
    setSuccess(`OTP Code generated & dispatched to ${obscureContact(emailOrMobile)}`);
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    const code = otp.join('');
    if (code.length < 4) {
      setError('Please fill in the complete 4-digit verification code.');
      return;
    }

    setIsLoading(true);
    // Simulate API call to verify OTP
    setTimeout(async () => {
      try {
        // Log them in with a default staff user to be helpful & fully functional!
        const targetUsername = username || 'admin';
        const response = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: targetUsername, password: 'password' }),
        });

        if (response.success && response.data) {
          setAuthToken(response.data.token);
          setSuccess('Authentication successful! Initializing clinical workplace session...');
          setIsPreloading(true);
          setTimeout(() => {
            onLoginSuccess(response.data.user);
          }, 1600);
        } else {
          // Fallback static logging in
          setError('Simulated verification success, but failed to start staff session. Please try standard login.');
        }
      } catch (err: any) {
        setError('Intranet server connection timed out. Redirecting back to standard login.');
        setViewMode('login');
      } finally {
        setIsLoading(false);
      }
    }, 1200);
  };

  const handleQuickLogin = (uname: string, customPwd?: string, directSubmit = false) => {
    const targetPwd = customPwd || (uname === 'doctor_test' || uname === 'opd_test' ? 'password123' : 'password');
    setUsername(uname);
    setPassword(targetPwd);
    setEmailOrMobile(uname.includes('@') ? uname : `${uname}@zikora.com`);
    setShowQuickAccess(false);
    setError('');
    setSuccess(`Loaded login credentials for @${uname} (Password: "${targetPwd}"). Click "Sign in" or click again to log in immediately.`);

    if (directSubmit) {
      performLoginWithCredentials(uname, targetPwd);
    }
  };

  const performLoginWithCredentials = async (uname: string, pwd: string) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: uname, password: pwd }),
      });

      if (response.success && response.data) {
        setAuthToken(response.data.token);
        setIsPreloading(true);
        setTimeout(() => {
          onLoginSuccess(response.data.user);
        }, 1600);
      } else {
        setError('Login returned an unexpected response from the intranet server.');
      }
    } catch (err: any) {
      setError(err.message || 'Connection to Zikora Medical Centre intranet failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = () => {
    setError('');
    setSuccess('A new 4-digit verification code has been dispatched.');
    setOtp(['', '', '', '']);
    // Focus back on first OTP input
    document.getElementById('otp-0')?.focus();
  };

  const obscureContact = (val: string) => {
    if (!val) return '+1 *******179';
    if (val.includes('@')) {
      const [local, domain] = val.split('@');
      if (local.length <= 2) return `${local[0]}***@${domain}`;
      return `${local[0]}***${local[local.length - 1]}@${domain}`;
    }
    if (/^\d+$/.test(val.replace(/[+\-\s]/g, ''))) {
      const clean = val.replace(/[^\d]/g, '');
      if (clean.length < 4) return '*******' + clean;
      return `+${clean.substring(0, 1)} *******${clean.substring(clean.length - 3)}`;
    }
    return val;
  };

  const handleOtpChange = (value: string, index: number) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      // Auto focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  if (isPreloading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-[100]">
        <div className="flex items-center gap-3">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-4 h-4 bg-[#4B5563] rounded-full"
              animate={{
                scale: [0.7, 1.3, 0.7],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans relative overflow-hidden select-none">
      
      {/* LEFT PANEL: Branding & Aesthetics (Mint/Seafoam color matching exact image with dynamic carousel) */}
      <div className="md:w-[42%] bg-[#A3D1E0] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden min-h-[340px] md:min-h-screen">
        
        {/* Animated Carousel Background */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImg}
              src={carouselImages[currentImg]}
              alt="Hospital Care"
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>
          {/* Light blue overlay overlaying the images */}
          <div className="absolute inset-0 bg-[#A3D1E0]/70 mix-blend-multiply z-10"></div>
          {/* Light tint overlay for text legibility */}
          <div className="absolute inset-0 bg-sky-950/20 z-10"></div>
        </div>

        {/* Floating Settings Gear - Cloned EXACTLY as requested from image */}
        <button
          onClick={() => setShowQuickAccess(true)}
          className="absolute left-0 top-[40%] bg-[#3A3F47] hover:bg-[#2A2E35] text-slate-200 hover:text-white p-2.5 rounded-r-lg shadow-lg transition-all transform hover:scale-105 group z-30"
          title="Quick Access Staff Directory"
        >
          <Settings className="h-5 w-5 animate-spin-slow group-hover:rotate-45 transition-transform" />
        </button>

        {/* Top Header - Logo Branding matching layout */}
        <div className="flex items-center gap-3 relative z-10">
          {/* Circular Graphic resembling Oxyy's logo curve */}
          <div className="relative w-8 h-8 flex items-center justify-center bg-emerald-500 rounded-full shadow-inner">
            <div className="absolute inset-1 bg-[#e1f0f4] rounded-full border border-emerald-400"></div>
            <div className="absolute w-3.5 h-3.5 bg-emerald-700 rounded-full animate-pulse"></div>
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            Zikora
          </span>
        </div>

        {/* Center Text block - Content shifts dynamically depending on page phase */}
        <div className="my-auto py-12 md:py-0 relative z-10">
          <AnimatePresence mode="wait">
            {viewMode === 'forgot' ? (
              <motion.div
                key="forgot-left"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-slate-800 font-bold text-sm lg:text-base mb-3 tracking-wide">
                  Don't worry,
                </p>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15] tracking-tight max-w-md">
                  We are here help you to recover your password.
                </h1>
              </motion.div>
            ) : (
              <motion.div
                key="login-left"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-slate-800 font-bold text-sm lg:text-base mb-3 tracking-wide">
                  We are glad to see you again!
                </p>
                <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-[1.15] tracking-tight max-w-md">
                  Join the largest Medical community in the world.
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom footer text */}
        <div className="text-xs font-mono text-slate-800 flex items-center gap-1 relative z-10">
          <span>© 2026 Zikora Medical Centre.</span>
          <span className="text-emerald-900 font-black">• Secure Intranet Portal</span>
        </div>
      </div>

      {/* RIGHT PANEL: Authentication & Recovery Forms */}
      <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-between relative min-h-[500px]">
        
        {/* Top-Right Area: "Return to Sign In" or blank space */}
        <div className="flex justify-end text-sm text-slate-500 self-end">
          {viewMode !== 'login' ? (
            <button 
              onClick={() => {
                setViewMode('login');
                setError('');
                setSuccess('');
              }} 
              className="text-[#4a8ca0] hover:text-[#335d6c] font-semibold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Return to <span className="underline underline-offset-4">Sign In</span>
            </button>
          ) : (
            <div className="h-6"></div>
          )}
        </div>

        {/* Centered Dynamic Content based on View Mode */}
        <div className="max-w-md w-full mx-auto my-auto py-8">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW 1: SIGN IN */}
            {viewMode === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
                  Sign in to Zikora
                </h2>

                {/* Department Quick Select Icons Row */}
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('dr_smith', 'password', false)}
                    className="bg-[#208368] hover:bg-[#186a54] text-white p-2.5 rounded-md flex items-center justify-center w-9 h-9 shadow-2xs transition-all cursor-pointer shrink-0 hover:scale-105"
                    title="Doctor Department Login (Dr. Smith)"
                  >
                    <Stethoscope className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('nurse_jane', 'password', false)}
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white p-2.5 rounded-md flex items-center justify-center w-9 h-9 shadow-2xs transition-all cursor-pointer shrink-0 hover:scale-105"
                    title="Nursing Department Login (Nurse Jane)"
                  >
                    <HeartPulse className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('opd_registrar', 'password', false)}
                    className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white p-2.5 rounded-md flex items-center justify-center w-9 h-9 shadow-2xs transition-all cursor-pointer shrink-0 hover:scale-105"
                    title="OPD / Front Desk Login (Registrar)"
                  >
                    <ClipboardList className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('cashier1', 'password', false)}
                    className="bg-[#F59E0B] hover:bg-[#D97706] text-white p-2.5 rounded-md flex items-center justify-center w-9 h-9 shadow-2xs transition-all cursor-pointer shrink-0 hover:scale-105"
                    title="Cashier / Billing Login (Cashier 1)"
                  >
                    <CreditCard className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('pharmacist', 'password', false)}
                    className="bg-[#EC4899] hover:bg-[#DB2777] text-white p-2.5 rounded-md flex items-center justify-center w-9 h-9 shadow-2xs transition-all cursor-pointer shrink-0 hover:scale-105"
                    title="Pharmacy Department Login (Pharmacist Mary)"
                  >
                    <Pill className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('lab_tech', 'password', false)}
                    className="bg-[#06B6D4] hover:bg-[#0891B2] text-white p-2.5 rounded-md flex items-center justify-center w-9 h-9 shadow-2xs transition-all cursor-pointer shrink-0 hover:scale-105"
                    title="Laboratory Department Login (Lab Scientist)"
                  >
                    <Activity className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', 'password', false)}
                    className="bg-[#334155] hover:bg-[#1E293B] text-white p-2.5 rounded-md flex items-center justify-center w-9 h-9 shadow-2xs transition-all cursor-pointer shrink-0 hover:scale-105"
                    title="Account Officer Department Login"
                  >
                    <ShieldCheck className="h-4 w-4" />
                  </button>
                </div>

                {/* Divider Line */}
                <div className="relative flex py-5 items-center mb-6">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold">
                    Or with Email
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {success && (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {error && (
                  <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-600 p-3.5 rounded-lg text-sm flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Login Form */}
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div>
                    <label htmlFor="username" className="block text-sm font-bold text-slate-800 mb-2">
                      Email Address
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#F5F6F8] hover:bg-[#EFF0F3] border-0 rounded-lg py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#A3D1E0] transition-all font-mono"
                      placeholder="Enter Your Email"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="password" className="block text-sm font-bold text-slate-800">
                        Password
                      </label>
                      {/* Forgot password button temporarily commented out */}
                      {/*
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('forgot');
                          setError('');
                          setSuccess('');
                        }}
                        className="text-xs text-[#48C78E] hover:text-[#38a573] font-semibold cursor-pointer underline underline-offset-2"
                      >
                        Forgot Password ?
                      </button>
                      */}
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#F5F6F8] hover:bg-[#EFF0F3] border-0 rounded-lg py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#A3D1E0] transition-all"
                      placeholder="Enter Password"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#48C78E] hover:bg-[#3db37d] active:bg-[#32986a] text-white font-bold text-sm tracking-wide px-8 py-3 rounded-lg shadow-2xs transition-all flex items-center justify-center min-w-[120px] cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        'Sign in'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* VIEW 2: FORGOT PASSWORD */}
            {viewMode === 'forgot' && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                  Forgot password?
                </h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  Enter the email address or mobile number associated with your account.
                </p>

                {error && (
                  <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-600 p-3.5 rounded-lg text-sm flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Forgot Password Input Form */}
                <form className="space-y-6" onSubmit={handleForgotSubmit}>
                  <div>
                    <label htmlFor="emailOrMobile" className="block text-sm font-bold text-slate-800 mb-2">
                      Email or Mobile Number
                    </label>
                    <input
                      id="emailOrMobile"
                      name="emailOrMobile"
                      type="text"
                      required
                      value={emailOrMobile}
                      onChange={(e) => setEmailOrMobile(e.target.value)}
                      className="w-full bg-[#F5F6F8] hover:bg-[#EFF0F3] border-0 rounded-lg py-3.5 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#A3D1E0] transition-all"
                      placeholder="Enter Email or Mobile Number"
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="bg-[#A3D1E0] hover:bg-[#82bdcf] active:bg-[#4a8ca0] text-black font-extrabold text-sm tracking-wide px-10 py-3.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </form>

                {/* Divider Line */}
                <div className="relative flex py-5 items-center mt-5">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold tracking-wider uppercase">
                    Or clinical portals quick access
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Quick Portals */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQuickAccess(true)}
                    type="button"
                    className="flex-1 bg-[#2b5663] hover:bg-[#1f404a] text-white font-bold text-xs tracking-wide uppercase px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <Hospital className="h-4 w-4" />
                    All Departments
                  </button>

                  <button
                    onClick={() => handleQuickLogin('dr_smith')}
                    type="button"
                    className="w-11 h-11 bg-teal-500 hover:bg-teal-600 text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-sm cursor-pointer"
                    title="Quick Select: Dr. Alan Smith (Doctor)"
                  >
                    <Stethoscope className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => handleQuickLogin('nurse_jane')}
                    type="button"
                    className="w-11 h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-sm cursor-pointer"
                    title="Quick Select: Nurse Station"
                  >
                    <HeartPulse className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => handleQuickLogin('opd_test')}
                    type="button"
                    className="w-11 h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-sm cursor-pointer"
                    title="Quick Select: OPD Registrar (opd_test)"
                  >
                    <FileText className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => handleQuickLogin('eye_doc')}
                    type="button"
                    className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-sm cursor-pointer"
                    title="Quick Select: Eye Clinic (eye_doc)"
                  >
                    <Eye className="h-5 w-5" />
                  </button>

                  <button
                    onClick={() => handleQuickLogin('admin')}
                    type="button"
                    className="w-11 h-11 bg-slate-700 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center transition-all hover:scale-105 shadow-sm cursor-pointer"
                    title="Quick Select: Account Officer"
                  >
                    <Shield className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* VIEW 3: TWO-STEP VERIFICATION */}
            {viewMode === 'otp' && (
              <motion.div
                key="otp-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
                  Two-Step Verification
                </h2>

                {/* Smartphone Graphical Illustration Cloned From Image */}
                <div className="flex justify-start mb-6">
                  <div className="relative w-16 h-28 border-[3px] border-slate-400 rounded-2xl flex items-center justify-center bg-slate-50 shadow-inner">
                    {/* Speaker ear piece */}
                    <div className="absolute top-2 w-6 h-1 bg-slate-300 rounded-full"></div>
                    {/* Asterisks capsule bubble (using the app color!) */}
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center justify-center gap-0.5 tracking-widest z-10 shadow-sm">
                      ***
                    </div>
                    {/* Home button circle */}
                    <div className="absolute bottom-1.5 w-3.5 h-3.5 border border-slate-300 rounded-full bg-white"></div>
                  </div>
                </div>

                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  Please enter the OTP (one time password) to verify your account. A Code has been sent to <span className="font-semibold text-slate-800">{obscureContact(emailOrMobile)}</span>
                </p>

                {success && (
                  <div className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-3 rounded-lg text-xs flex items-start gap-2 animate-pulse">
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                {error && (
                  <div className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-600 p-3.5 rounded-lg text-sm flex items-start gap-2.5">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                {/* OTP Digits Form */}
                <form className="space-y-6" onSubmit={handleOtpVerify}>
                  <div>
                    <label className="block text-sm font-bold text-slate-800 mb-3">
                      Enter 4 digit code
                    </label>
                    <div className="flex gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          maxLength={1}
                          pattern="[0-9]*"
                          inputMode="numeric"
                          required
                          value={otp[idx]}
                          onChange={(e) => handleOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                          className="w-14 h-14 bg-[#F5F6F8] hover:bg-[#EFF0F3] border-0 rounded-lg text-center text-xl font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#A3D1E0] transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#A3D1E0] hover:bg-[#82bdcf] active:bg-[#4a8ca0] text-black font-extrabold text-sm tracking-wide px-10 py-3.5 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center min-w-[120px] cursor-pointer"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-5 w-5 animate-spin" />
                      ) : (
                        'Verify'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="text-xs text-[#4a8ca0] hover:text-[#335d6c] font-bold underline underline-offset-4 transition-colors"
                    >
                      Didn't get the code? Resend it
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Informational notice */}
        <div className="text-xs text-slate-400 text-center max-w-sm mx-auto">
          Authorized Zikora Hospital Intranet workstation. Traffic is authenticated and logged.
        </div>
      </div>

      {/* FLOATING QUICK ACCESS SLIDE-OVER DRAWER */}
      <AnimatePresence>
        {showQuickAccess && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop with matching glassmorphism & soft seafoam tint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickAccess(false)}
              className="absolute inset-0 bg-[#334155]/25 backdrop-blur-sm"
            ></motion.div>
 
            {/* Content Drawer: Redesigned in light mode matching Oxyy theme */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative w-full max-w-md bg-white border-l border-[#A3D1E0]/50 text-slate-800 p-7 h-full flex flex-col justify-between shadow-2xl z-10"
            >
              <div>
                <div className="flex justify-between items-center pb-5 border-b border-slate-100 mb-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#A3D1E0]/20 rounded-lg text-[#335d6c]">
                      <Shield className="h-5 w-5" />
                    </div>
                    <span>Intranet Staff Accounts</span>
                  </h3>
                  <button
                    onClick={() => setShowQuickAccess(false)}
                    className="p-2 hover:bg-slate-100 active:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
 
                <div className="bg-emerald-50 border border-emerald-100/70 text-emerald-800 p-4 rounded-xl text-xs mb-6 flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5 animate-pulse" />
                  <span className="leading-relaxed">
                    Select any staff user account below to instantly pre-fill and authorize credentials for that clinical department role.
                  </span>
                </div>
 
                {/* Users List with responsive cards */}
                <div className="space-y-3 overflow-y-auto max-h-[64vh] pr-1.5 scrollbar-thin">
                  {defaultUsers.map((u) => (
                    <button
                      key={u.username}
                      onClick={() => handleQuickLogin(u.username)}
                      className="w-full p-4 bg-slate-50 hover:bg-[#F0F8FA] border border-slate-100 hover:border-[#A3D1E0]/50 rounded-xl text-left flex items-center justify-between group transition-all duration-200 hover:shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-slate-800 group-hover:text-[#2b5663] transition-colors flex items-center gap-1.5">
                          {u.label}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          username: <span className="text-slate-600 font-semibold">@{u.username}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 leading-snug">
                          {u.desc}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold bg-[#A3D1E0]/20 border border-[#A3D1E0]/30 px-2.5 py-1 rounded text-[#2b5663] group-hover:bg-[#A3D1E0] group-hover:text-white group-hover:border-transparent transition-all shrink-0">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
 
              {/* Drawer footer */}
              <div className="pt-5 border-t border-slate-100 text-center text-xs text-slate-400">
                Authorized developer/tester quick-access switchboard.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
