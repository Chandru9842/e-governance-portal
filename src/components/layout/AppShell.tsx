import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Landmark,
  TrendingUp,
  CloudSun,
  HandCoins,
  MessageSquareWarning,
  UserCheck,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  X,
  Globe,
  ShieldCheck,
  CheckCheck,
  RefreshCw,
  AlertOctagon,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Clock,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { UserRole } from '../../types';
import { ToastContainer, Modal } from '../ui';

interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ReactNode;
}

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    language,
    setLanguage,
    t,
    user,
    role,
    setRole,
    isAuthenticated,
    loginWithOtp,
    logout,
    isLogoutModalOpen,
    setIsLogoutModalOpen,
    inactivityTimeoutMins,
    isInactivityWarningOpen,
    setIsInactivityWarningOpen,
    sessionStartedAt,
    notifications,
    markAllNotificationsRead,
    markNotificationRead,
    triggerLoadingDemo,
    hasError,
    setHasError,
    showToast,
  } = usePortal();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Login Screen States
  const [authStep, setAuthStep] = useState<'credentials' | 'otp'>('credentials');
  const [mobileInput, setMobileInput] = useState('9443268105');
  const [aadhaarInput, setAadhaarInput] = useState('629140837842');
  const [showRawAadhaar, setShowRawAadhaar] = useState(false);
  const [loginRole, setLoginRole] = useState<UserRole>(role);
  const [consentChecked, setConsentChecked] = useState(true);
  const [otpDigits, setOtpDigits] = useState<string[]>(['4', '8', '2', '9', '1', '0']);
  const [authError, setAuthError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  // Inactivity Warning Countdown (15 seconds once warning modal opens)
  const [inactivityCountdown, setInactivityCountdown] = useState(15);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real Inactivity Auto-Logout Listener
  useEffect(() => {
    if (!isAuthenticated) return;
    const timeoutMs = inactivityTimeoutMins * 60 * 1000;
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setInactivityCountdown(15);
        setIsInactivityWarningOpen(true);
      }, timeoutMs);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetIdleTimer));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((ev) => window.removeEventListener(ev, resetIdleTimer));
    };
  }, [isAuthenticated, inactivityTimeoutMins, setIsInactivityWarningOpen]);

  // Countdown when Inactivity Warning Modal is Open
  useEffect(() => {
    if (!isInactivityWarningOpen || !isAuthenticated) return;
    setInactivityCountdown(15);

    const interval = setInterval(() => {
      setInactivityCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          logout('Auto-Logged Out Due to Session Inactivity');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isInactivityWarningOpen, isAuthenticated, logout]);

  // OTP Resend Countdown
  useEffect(() => {
    if (authStep !== 'otp' || resendTimer <= 0) return;
    const tId = setInterval(() => {
      setResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(tId);
  }, [authStep, resendTimer]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems: NavItem[] = [
    {
      path: '/',
      labelKey: 'navDashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      path: '/crops',
      labelKey: 'navMyCrops',
      icon: <Sprout className="w-4 h-4 shrink-0" />,
    },
    {
      path: '/schemes',
      labelKey: 'navSchemes',
      icon: <Landmark className="w-4 h-4 shrink-0" />,
    },
    {
      path: '/market-prices',
      labelKey: 'navMarketPrices',
      icon: <TrendingUp className="w-4 h-4 shrink-0" />,
    },
    {
      path: '/weather',
      labelKey: 'navWeather',
      icon: <CloudSun className="w-4 h-4 shrink-0" />,
    },
    {
      path: '/subsidy-loan',
      labelKey: 'navSubsidyLoan',
      icon: <HandCoins className="w-4 h-4 shrink-0" />,
    },
    {
      path: '/grievances',
      labelKey: 'navGrievances',
      icon: <MessageSquareWarning className="w-4 h-4 shrink-0" />,
    },
    {
      path: '/profile',
      labelKey: 'navProfile',
      icon: <UserCheck className="w-4 h-4 shrink-0" />,
    },
    {
      path: '/admin',
      labelKey: 'navAdmin',
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
    },
  ];

  // Open Logout Confirmation Modal
  const handleRequestLogout = () => {
    setProfileOpen(false);
    setSidebarOpen(false);
    setIsLogoutModalOpen(true);
  };

  // Format Masked Aadhaar for UI display
  const formattedMaskedAadhaar = (() => {
    const digits = aadhaarInput.replace(/\D/g, '').slice(0, 12);
    if (!digits) return '';
    if (showRawAadhaar) {
      return digits.replace(/(\d{4})(?=\d)/g, '$1-');
    }
    if (digits.length <= 8) return 'XXXX-XXXX';
    return `XXXX-XXXX-${digits.slice(8)}`;
  })();

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = mobileInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setAuthError('Please enter a valid 10-digit Aadhaar-linked mobile number.');
      return;
    }
    if (!consentChecked) {
      setAuthError('Please accept the e-Governance Data Protection Consent to proceed.');
      return;
    }
    setAuthError('');
    setOtpDigits(['4', '8', '2', '9', '1', '0']);
    setResendTimer(30);
    setAuthStep('otp');
    showToast(
      'OTP Sent via TNeGA SMS Gateway',
      `6-digit OTP 482910 dispatched to +91 ${cleanPhone.slice(0, 2)}XXXXXX${cleanPhone.slice(8)}`
    );
  };

  const handleVerifyOtpAndLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otpDigits.join('');
    if (entered.length !== 6) {
      setAuthError('Please enter all 6 digits of your OTP.');
      return;
    }
    const cleanAadhaar = aadhaarInput.replace(/\D/g, '');
    const last4 = cleanAadhaar.length >= 4 ? cleanAadhaar.slice(-4) : user.aadhaarLast4;
    setAuthError('');
    setAuthStep('credentials');
    loginWithOtp(mobileInput.replace(/\D/g, ''), last4, loginRole);
  };

  // ==========================================================================
  // RENDER FULL-SCREEN AUTHENTICATION GATEWAY WHEN LOGGED OUT
  // ==========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#073620] flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
        {/* Top Bar on Login Screen */}
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between z-10">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 rounded-xl bg-[#1E8E4F] flex items-center justify-center border border-emerald-400/30 shadow-sm">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold leading-tight">{t('appName')}</h1>
              <p className="text-[11px] text-emerald-200/80">
                Tamil Nadu e-Governance Agency (TNeGA) · Agrisnet Unified Sign-On
              </p>
            </div>
          </div>

          <div className="flex items-center bg-[#0B4D2E] p-1 rounded-lg border border-white/15">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                language === 'en' ? 'bg-[#1E8E4F] text-white' : 'text-emerald-100'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                language === 'ta' ? 'bg-[#1E8E4F] text-white' : 'text-emerald-100'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Center Authentication Card */}
        <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-8">
          <div className="bg-[#0B4D2E] text-white p-6 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 text-[11px] font-semibold border border-emerald-400/30">
              <Lock className="w-3 h-3" />
              <span>256-Bit Encrypted e-Uzhavar Gateway</span>
            </div>
            <h2 className="text-lg font-bold">
              {language === 'ta'
                ? 'உழவர் போர்டல் பாதுகாப்பான உள்நுழைவு'
                : 'Digital Farmer Portal Sign-In'}
            </h2>
            <p className="text-xs text-emerald-100/85">
              Authenticate via Aadhaar-linked Mobile OTP & optional Virtual ID
            </p>
          </div>

          <div className="p-6">
            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {authError}
              </div>
            )}

            {authStep === 'credentials' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                {/* Mobile Number Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Mobile Number (10 Digits) *
                  </label>
                  <div className="flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-[#0B4D2E]">
                    <span className="px-3 py-2 bg-slate-100 text-xs font-mono font-semibold text-slate-600 border-r border-slate-300 flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={mobileInput}
                      onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="9443268105"
                      className="w-full px-3 py-2 text-xs font-mono tabular-nums focus:outline-none"
                    />
                  </div>
                </div>

                {/* Optional Aadhaar-style ID Field (Masked) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Aadhaar / Uzhavar Virtual ID (Optional · Masked)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowRawAadhaar((prev) => !prev)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0B4D2E] hover:underline cursor-pointer"
                    >
                      {showRawAadhaar ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Mask ID
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Reveal
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={showRawAadhaar ? aadhaarInput : formattedMaskedAadhaar}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setAadhaarInput(raw);
                      }}
                      placeholder="XXXX-XXXX-7842"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E] tracking-wider"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      UIDAI Vault Masked
                    </span>
                  </div>
                </div>

                {/* Portal Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Select Login Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Farmer', 'Officer', 'Admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setLoginRole(r)}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                          loginRole === r
                            ? 'bg-[#0B4D2E] text-white border-[#0B4D2E]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consent Notice */}
                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 accent-[#0B4D2E]"
                  />
                  <span>
                    I consent to the use of my masked Aadhaar/Uzhavar ID and mobile number for
                    OTP authentication and Tamil Nilam / PFMS DBT verification in accordance with
                    the Digital Personal Data Protection (DPDP) Act.
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-bold bg-[#0B4D2E] hover:bg-[#1E8E4F] text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Send 6-Digit OTP to +91 {mobileInput}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndLogin} className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-emerald-950">Mock SMS OTP Received: 482910</p>
                    <p className="text-[11px] text-emerald-800">
                      Sent to +91 {mobileInput} · Valid for 10 mins
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpDigits(['4', '8', '2', '9', '1', '0'])}
                    className="px-2.5 py-1 rounded bg-[#0B4D2E] text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Auto-Fill
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Enter 6-Digit Verification OTP
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const next = [...otpDigits];
                          next[idx] = val;
                          setOtpDigits(next);
                        }}
                        className="w-full h-11 text-center text-base font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E] bg-slate-50"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthStep('credentials')}
                    className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                  >
                    ← Change Mobile Number
                  </button>
                  <button
                    type="button"
                    disabled={resendTimer > 0}
                    onClick={() => {
                      setResendTimer(30);
                      showToast('OTP Resent', 'New OTP 482910 sent via SMS.');
                    }}
                    className="font-semibold text-[#0B4D2E] disabled:text-slate-400 cursor-pointer"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP Now'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg text-xs font-bold bg-[#0B4D2E] hover:bg-[#1E8E4F] text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify OTP & Access Portal</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center text-xs text-emerald-200/75 z-10">
          "{t('tagline')}" · Secured by Tamil Nadu State Data Centre (TNSDC)
        </div>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-slate-900">
      {/* Top Header (#0B4D2E) */}
      <header className="sticky top-0 z-40 h-16 bg-[#0B4D2E] text-white border-b border-white/10 px-4 lg:px-6 flex items-center justify-between gap-4 shadow-xs">
        {/* Left Zone: Mobile Toggle + Logo & App Name */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="lg:hidden p-2 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <NavLink
            to="/"
            className="flex items-center gap-3 min-w-0 focus-visible:outline-2 focus-visible:outline-white rounded-lg"
          >
            <div className="w-9 h-9 rounded-lg bg-[#1E8E4F] flex items-center justify-center shadow-inner shrink-0 border border-emerald-400/30">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap truncate">
              {t('appName')}
            </span>
          </NavLink>
        </div>

        {/* Right Zone: Language Switcher (English / தமிழ்), Notification Bell with Unread Badge, Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Switcher (English / தமிழ்) */}
          <div
            role="group"
            aria-label="Language switcher"
            className="flex items-center bg-[#073620] p-1 rounded-lg border border-white/15"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-300 ml-1.5 mr-1 hidden sm:inline shrink-0" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                language === 'en'
                  ? 'bg-[#1E8E4F] text-white shadow-xs'
                  : 'text-emerald-100/80 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                language === 'ta'
                  ? 'bg-[#1E8E4F] text-white shadow-xs'
                  : 'text-emerald-100/80 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* Notification Bell with Unread Badge */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setProfileOpen(false);
              }}
              aria-label={`Notifications (${unreadCount} unread)`}
              className="relative p-2 rounded-lg bg-[#073620] hover:bg-white/15 text-emerald-50 border border-white/15 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums border border-[#0B4D2E]">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-800">
                    {language === 'ta' ? 'அறிவிப்புகள்' : 'Portal Notifications'} ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#0B4D2E] hover:text-[#1E8E4F] cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'அனைத்தையும் படித்ததாகக் குறி' : 'Mark all read'}</span>
                    </button>
                  )}
                </div>
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => markNotificationRead(item.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                        !item.read ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900">
                          {language === 'ta' ? item.titleTa : item.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {language === 'ta' ? item.messageTa : item.message}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
                          {item.timestamp}
                        </p>
                      </div>
                      {!item.read && (
                        <span className="text-[10px] font-semibold text-[#1E8E4F] shrink-0">
                          NEW
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown (Name + "Farmer" role) */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileOpen((prev) => !prev);
                setNotifOpen(false);
              }}
              className="flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-lg bg-[#073620] hover:bg-white/15 border border-white/15 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#1E8E4F] text-white text-xs font-bold flex items-center justify-center shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block text-left min-w-0">
                <p className="text-xs font-semibold text-white leading-none truncate max-w-[140px]">
                  {language === 'ta' ? user.nameTa : user.name}
                </p>
                <p className="text-[11px] text-emerald-200 mt-0.5 leading-none">
                  {role === 'Farmer'
                    ? t('roleFarmer')
                    : role === 'Officer'
                    ? t('roleOfficer')
                    : t('roleAdmin')}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <p className="text-xs font-semibold text-slate-900">
                    {language === 'ta' ? user.nameTa : user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    {user.farmerId} · {language === 'ta' ? user.districtTa : user.district}
                  </p>
                </div>

                {/* Role-Based Guard Switcher (Farmer, Officer, Admin) */}
                <div className="p-3 border-b border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B4D2E]" />
                    <span>{t('switchRoleLabel')} (RBAC Guard)</span>
                  </p>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg">
                    {(['Farmer', 'Officer', 'Admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-1 px-2 rounded-md text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          role === r
                            ? 'bg-[#0B4D2E] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* UI Resilience & Session Testing Controls */}
                <div className="p-3 border-b border-slate-100 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-500">
                    State & Session Controls
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        triggerLoadingDemo();
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Skeleton</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        setHasError(!hasError);
                      }}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        hasError
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 hover:bg-red-100 text-red-700'
                      }`}
                    >
                      <AlertOctagon className="w-3 h-3" />
                      <span>{hasError ? 'Clear Error' : 'Error State'}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      setIsInactivityWarningOpen(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Test Inactivity Auto-Logout</span>
                  </button>
                </div>

                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-slate-500" />
                    <span>{t('navProfile')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('navLogout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body Wrapper: Left Sidebar + Main Content Area */}
      <div className="flex-1 flex relative">
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden"
            aria-hidden="true"
          />
        )}

        {/* Left Sidebar (Dark Green #0B4D2E, Collapsible on Mobile) */}
        <aside
          aria-label="Primary Sidebar Navigation"
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0B4D2E] text-white flex flex-col justify-between border-r border-white/10 transition-transform duration-200 ease-out shrink-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 space-y-1 overflow-y-auto">
            <div className="px-3 py-2 mb-2 border-b border-white/10">
              <p className="text-[11px] text-emerald-200/80 font-medium">
                {t('farmerIdLabel')}: <span className="text-white font-mono">{user.farmerId}</span>
              </p>
              <p className="text-[11px] text-emerald-200/80 mt-0.5">
                {language === 'ta' ? user.villageTa : user.village} ·{' '}
                {language === 'ta' ? user.districtTa : user.district}
              </p>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-[#1E8E4F] text-white font-semibold shadow-xs'
                        : 'text-emerald-100/85 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  {item.icon}
                  <span className="truncate">{t(item.labelKey)}</span>
                </NavLink>
              ))}

              {/* Logout Item in Sidebar */}
              <button
                type="button"
                onClick={handleRequestLogout}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-emerald-100/85 hover:bg-red-500/20 hover:text-red-200 transition-colors cursor-pointer mt-2"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="truncate">{t('navLogout')}</span>
              </button>
            </nav>
          </div>

          {/* Sidebar Footer Tagline: "Better Farmers, Brighter Future" */}
          <div className="p-4 m-3 rounded-xl bg-[#073620] border border-white/10">
            <p className="text-xs font-semibold text-emerald-300 leading-snug">
              "{t('tagline')}"
            </p>
            <p className="text-[11px] text-emerald-100/70 mt-1">
              Tamil Nadu e-Governance Agency · Agrisnet v2.4
            </p>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* ====================================================================
          LOGOUT CONFIRMATION MODAL
      ==================================================================== */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title={language === 'ta' ? 'வெளியேறுவதை உறுதிப்படுத்தவும்' : 'Confirm Portal Sign-Out'}
        subtitle="Your encrypted e-Governance session and DBT tokens will be locked until your next OTP login"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Authenticated Farmer:</span>
              <span className="font-bold text-slate-900">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Uzhavar ID & Role:</span>
              <span className="font-mono font-semibold text-[#0B4D2E]">
                {user.farmerId} ({role})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Session Started:</span>
              <span className="font-mono text-slate-700">{sessionStartedAt}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to sign out of the Digital Farmer e-Governance Portal? You will
            be taken to the Mobile + OTP Authentication screen.
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Stay Signed In
            </button>
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Confirm & Logout</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ====================================================================
          AUTO-LOGOUT ON INACTIVITY WARNING MODAL
      ==================================================================== */}
      <Modal
        isOpen={isInactivityWarningOpen}
        onClose={() => setIsInactivityWarningOpen(false)}
        title="Session Inactivity Security Warning"
        subtitle="Automatic sign-out protection for public e-Sevai & shared kiosk terminals"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-amber-500 text-white font-mono font-bold text-base flex items-center justify-center shrink-0 tabular-nums">
              {inactivityCountdown}s
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-950">
                Your session will auto-logout in {inactivityCountdown} seconds due to inactivity.
              </p>
              <p className="text-amber-800">
                Configured timeout: {inactivityTimeoutMins} minutes. Click "Extend Session" to stay
                logged in.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => logout('Auto-Logged Out Due to Inactivity')}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer"
            >
              Logout Now
            </button>
            <button
              type="button"
              onClick={() => {
                setIsInactivityWarningOpen(false);
                showToast('Session Extended', 'Your e-Governance session timer has been reset.');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Extend Active Session</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Global Toast Notification Layer */}
      <ToastContainer />
    </div>
  );
};
