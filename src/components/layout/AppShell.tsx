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
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { UserRole } from '../../types';
import { ToastContainer } from '../ui';

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
  ];

  const handleLogout = () => {
    setProfileOpen(false);
    showToast(
      language === 'ta' ? 'வெற்றிகரமாக வெளியேறினீர்கள்' : 'Session Signed Out Safely',
      language === 'ta'
        ? 'உழவர் போர்டல் அமர்வு பாதுகாப்பாக முடிந்தது.'
        : 'Your e-Governance session token was refreshed for demo preview.',
      'info'
    );
    navigate('/');
  };

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

                {/* UI Resilience Testing Controls (Skeleton & Error States) */}
                <div className="p-3 border-b border-slate-100 space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-500">
                    State Verification Controls
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
                    onClick={handleLogout}
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

              {/* Logout Item in Sidebar as specified */}
              <button
                type="button"
                onClick={handleLogout}
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

      {/* Global Toast Notification Layer */}
      <ToastContainer />
    </div>
  );
};
