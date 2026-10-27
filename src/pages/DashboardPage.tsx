import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Landmark,
  TrendingUp,
  CloudSun,
  CloudRain,
  Sun,
  Droplets,
  Wind,
  MapPin,
  ArrowRight,
  FileText,
  MessageSquareWarning,
  ShieldAlert,
  Calendar,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { GovernmentScheme } from '../types';
import {
  Card,
  StatCard,
  StatusBadge,
  Modal,
  ErrorState,
} from '../components/ui';

// Custom SVG Paddy-Field Illustration for the Welcome Banner
const PaddyFieldIllustration: React.FC = () => (
  <svg
    viewBox="0 0 320 130"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-56 sm:w-64 md:w-72 h-auto select-none shrink-0"
    aria-hidden="true"
  >
    {/* Warm Rising Sun */}
    <circle cx="245" cy="42" r="24" fill="#FDE047" fillOpacity="0.88" />
    <circle cx="245" cy="42" r="32" fill="#FEF08A" fillOpacity="0.25" />

    {/* Distant Hills */}
    <path
      d="M0 95 Q70 55 150 85 T320 75 L320 130 L0 130 Z"
      fill="#15803D"
      fillOpacity="0.45"
    />

    {/* Midground Lush Paddy Terraces */}
    <path
      d="M0 105 Q95 75 195 98 T320 90 L320 130 L0 130 Z"
      fill="#1E8E4F"
    />
    <path
      d="M0 116 Q120 96 240 112 T320 106 L320 130 L0 130 Z"
      fill="#0B4D2E"
    />

    {/* Irrigated Paddy Furrow Lines */}
    <path
      d="M25 118 Q110 102 210 115"
      stroke="#86EFAC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.5"
    />
    <path
      d="M65 125 Q160 112 285 122"
      stroke="#86EFAC"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeOpacity="0.4"
    />

    {/* Golden & Green Paddy Stalks */}
    {[38, 72, 108, 146, 184, 222, 262, 294].map((x, idx) => (
      <g key={x} transform={`translate(${x}, ${idx % 2 === 0 ? 64 : 70})`}>
        {/* Main Stem */}
        <path
          d="M10 48 Q10 24 16 6"
          stroke="#BBF7D0"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Left Leaf */}
        <path
          d="M10 38 Q2 24 0 14"
          stroke="#4ADE80"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Right Leaf */}
        <path
          d="M11 32 Q20 20 23 11"
          stroke="#4ADE80"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        {/* Golden Ear of Paddy Grains */}
        <ellipse cx="16" cy="6" rx="2.5" ry="4.5" transform="rotate(20 16 6)" fill="#FACC15" />
        <ellipse cx="13" cy="11" rx="2.2" ry="4" transform="rotate(15 13 11)" fill="#FDE047" />
        <ellipse cx="18" cy="12" rx="2.2" ry="4" transform="rotate(25 18 12)" fill="#FACC15" />
      </g>
    ))}
  </svg>
);

// Dashboard-specific Skeleton Loader matching all 8 sections
const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
    {/* 1. Welcome Banner Skeleton */}
    <div className="h-36 rounded-xl bg-emerald-900/20 border border-slate-200/80 p-6 flex items-center justify-between">
      <div className="space-y-3">
        <div className="h-4 w-36 bg-slate-300 rounded" />
        <div className="h-7 w-72 bg-slate-300 rounded" />
        <div className="h-4 w-56 bg-slate-200 rounded" />
      </div>
      <div className="hidden sm:block h-24 w-56 bg-slate-200 rounded-lg" />
    </div>

    {/* 2. Four Stat Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-32 bg-white rounded-xl border border-slate-200/80 p-5 flex flex-col justify-between"
        >
          <div className="h-3 w-28 bg-slate-200 rounded" />
          <div className="h-7 w-32 bg-slate-200 rounded" />
          <div className="h-3 w-full bg-slate-100 rounded" />
        </div>
      ))}
    </div>

    {/* 3 & 4. Weather Widget + Market Prices Table Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="h-80 bg-white rounded-xl border border-slate-200/80 p-6 space-y-4">
        <div className="h-5 w-40 bg-slate-200 rounded" />
        <div className="h-24 w-full bg-slate-100 rounded-xl" />
        <div className="h-28 w-full bg-slate-100 rounded-xl" />
      </div>
      <div className="lg:col-span-2 h-80 bg-white rounded-xl border border-slate-200/80 p-6 space-y-3">
        <div className="h-5 w-48 bg-slate-200 rounded" />
        {[1, 2, 3, 4, 5].map((r) => (
          <div key={r} className="h-10 w-full bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const {
    language,
    user,
    role,
    crops,
    schemes,
    applyToScheme,
    marketPrices,
    weatherForecast,
    importantUpdates,
    subsidies,
    updateSubsidyStatus,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  const navigate = useNavigate();
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);
  const [surveyInput, setSurveyInput] = useState('SF-142/2A');
  const [remarksInput, setRemarksInput] = useState(
    'Applying online via Digital Farmer Dashboard for 2026-27 Samba season.'
  );

  if (isLoading) return <DashboardSkeleton />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const primaryMandi = marketPrices[0];
  const todayWeather = weatherForecast[0];
  const top5MarketPrices = marketPrices.slice(0, 5);
  const latestSchemes = schemes.slice(0, 4);

  const handleQuickApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheme) return;
    applyToScheme(selectedScheme.id, surveyInput, remarksInput);
    setSelectedScheme(null);
  };

  return (
    <div className="space-y-6">
      {role !== 'Farmer' && (
        <div className="rounded-xl bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-emerald-500/30">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-emerald-300">
                Active Persona: {role} Governance Mode
              </p>
              <p className="text-slate-300">
                Access the dedicated Admin & Officer Command Dashboard for district heat maps, scheme CRUD, user RBAC, and audit logs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shrink-0 cursor-pointer"
          >
            <span>Open {role} Command Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Welcome Banner: "Welcome, {farmerName}!" with tagline "Together for a prosperous agriculture" and paddy-field illustration */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#0B4D2E] via-[#12643C] to-[#1E8E4F] text-white p-6 sm:px-8 sm:py-6 shadow-sm border border-emerald-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl z-10">
          <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-200 font-medium">
            <span>{user.farmerId}</span>
            <span aria-hidden="true">·</span>
            <span>
              {language === 'ta' ? user.villageTa : user.village},{' '}
              {language === 'ta' ? user.districtTa : 'Perambalur, Tamil Nadu'}
            </span>
            {role !== 'Farmer' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-300 font-semibold">Role Mode: {role}</span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {language === 'ta'
              ? `நல்வரவு, ${user.nameTa}!`
              : `Welcome, ${user.name}!`}
          </h1>

          <p className="text-sm sm:text-base text-emerald-100 font-medium">
            {language === 'ta'
              ? 'வளமான விவசாயத்திற்காக ஒன்றிணைவோம்'
              : 'Together for a prosperous agriculture'}
          </p>
        </div>

        {/* Paddy-Field Illustration */}
        <div className="self-end md:self-center -mb-6 md:-my-4 z-10">
          <PaddyFieldIllustration />
        </div>
      </section>

      {/* 2. Four Stat Cards (My Crops count, Government Schemes count, today's key market price in ₹/Quintal, current temperature) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={language === 'ta' ? 'எனது பயிர்கள்' : 'My Crops'}
          value={`${crops.length} Crops`}
          subtext={`${crops.reduce((sum, c) => sum + c.areaAcres, 0).toFixed(2)} Acres Registered`}
          icon={<Sprout className="w-5 h-5" />}
          accentColor="green"
          viewLabel={language === 'ta' ? 'காண்க' : 'View'}
          onClick={() => navigate('/crops')}
        />
        <StatCard
          label={language === 'ta' ? 'அரசுத் திட்டங்கள்' : 'Government Schemes'}
          value={`${schemes.length} Schemes`}
          subtext={`${schemes.filter((s) => s.applicationStatus === 'Approved').length} Approved · Apply Online`}
          icon={<Landmark className="w-5 h-5" />}
          accentColor="purple"
          viewLabel={language === 'ta' ? 'காண்க' : 'View'}
          onClick={() => navigate('/schemes')}
        />
        <StatCard
          label={language === 'ta' ? 'இன்றைய சந்தை விலை' : "Today's Key Market Price"}
          value={`₹${primaryMandi.modalPrice.toLocaleString('en-IN')}/Quintal`}
          subtext={`${primaryMandi.commodity} · ▲ +₹${primaryMandi.modalPrice - primaryMandi.previousModalPrice}`}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="orange"
          viewLabel={language === 'ta' ? 'காண்க' : 'View'}
          onClick={() => navigate('/market-prices')}
        />
        <StatCard
          label={language === 'ta' ? 'தற்போதைய வெப்பநிலை' : 'Current Temperature'}
          value={`${todayWeather.tempMax}°C`}
          subtext={`${todayWeather.condition} · Perambalur, TN`}
          icon={<CloudSun className="w-5 h-5" />}
          accentColor="blue"
          viewLabel={language === 'ta' ? 'காண்க' : 'View'}
          onClick={() => navigate('/weather')}
        />
      </div>

      {/* Officer / Admin RBAC Banner when active */}
      {(role === 'Officer' || role === 'Admin') && (
        <div className="bg-emerald-950 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-200">
                {role} Verification Mode Active
              </p>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                You can directly approve farmer applications in the Recent Applications table below or inspect full records in Subsidy & Loan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/subsidy-loan')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[#1E8E4F] hover:bg-emerald-500 text-white shrink-0 cursor-pointer"
          >
            Open Verification Queue
          </button>
        </div>
      )}

      {/* 8. Quick Actions Bar: Apply Scheme, Check Market Price, Weather Forecast, File Complaint */}
      <Card
        title={language === 'ta' ? 'விரைவு செயல்பாடுகள்' : 'Quick Actions'}
        subtitle={
          language === 'ta'
            ? 'முக்கிய உழவர் இ-கவர்னன்ஸ் சேவைகளை உடனடியாக அணுகவும்'
            : 'Direct one-click access to essential farmer e-Governance services'
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            type="button"
            onClick={() => navigate('/schemes')}
            className="group p-4 rounded-xl border border-purple-200/80 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-300 transition-all text-left flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {language === 'ta' ? 'திட்டத்திற்கு விண்ணப்பிக்க' : 'Apply Scheme'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">PMKSY, KAVIADP & Subsidies</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/market-prices')}
            className="group p-4 rounded-xl border border-orange-200/80 bg-orange-50/40 hover:bg-orange-50 hover:border-orange-300 transition-all text-left flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {language === 'ta' ? 'சந்தை விலை பார்க்க' : 'Check Market Price'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">Live Regulated Mandi Rates</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-orange-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/weather')}
            className="group p-4 rounded-xl border border-sky-200/80 bg-sky-50/40 hover:bg-sky-50 hover:border-sky-300 transition-all text-left flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                <CloudSun className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {language === 'ta' ? 'வானிலை முன்னறிவிப்பு' : 'Weather Forecast'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">Perambalur 5-Day Advisory</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-sky-700 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/grievances')}
            className="group p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left flex items-center justify-between gap-3 cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#0B4D2E] text-white flex items-center justify-center shrink-0">
                <MessageSquareWarning className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {language === 'ta' ? 'புகார் பதிவு செய்க' : 'File Complaint'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">Grievance & DPC Helpdesk</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#0B4D2E] group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>
        </div>
      </Card>

      {/* Row: 3. Weather Widget (Perambalur, Tamil Nadu) + 4. Market Prices Table (Top 5 Rows) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* 3. Weather Widget */}
        <Card
          title={language === 'ta' ? 'வானிலை தகவல்' : 'Weather Information'}
          subtitle="Perambalur, Tamil Nadu"
          action={
            <button
              type="button"
              onClick={() => navigate('/weather')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
          className="flex flex-col justify-between"
        >
          <div className="space-y-4">
            {/* Location & Primary Temperature Display */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-600 to-sky-800 text-white space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs text-sky-100">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-sky-200 shrink-0" />
                  <span>
                    {language === 'ta' ? 'பெரம்பலூர், தமிழ்நாடு' : 'Perambalur, Tamil Nadu'}
                  </span>
                </span>
                <span className="font-mono text-[11px]">{todayWeather.dayName}</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold tabular-nums tracking-tight">
                    {todayWeather.tempMax}°C
                  </p>
                  <p className="text-xs text-sky-100 mt-0.5">
                    {todayWeather.condition} · Low {todayWeather.tempMin}°C
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                  <CloudSun className="w-7 h-7 text-amber-300" />
                </div>
              </div>

              {/* Rainfall %, Humidity %, Wind Speed */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15 text-xs">
                <div>
                  <p className="text-[11px] text-sky-200 flex items-center gap-1">
                    <CloudRain className="w-3 h-3" />
                    <span>Rainfall</span>
                  </p>
                  <p className="font-bold tabular-nums mt-0.5">
                    {todayWeather.rainfallChancePct}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-sky-200 flex items-center gap-1">
                    <Droplets className="w-3 h-3" />
                    <span>Humidity</span>
                  </p>
                  <p className="font-bold tabular-nums mt-0.5">{todayWeather.humidity}%</p>
                </div>
                <div>
                  <p className="text-[11px] text-sky-200 flex items-center gap-1">
                    <Wind className="w-3 h-3" />
                    <span>Wind</span>
                  </p>
                  <p className="font-bold tabular-nums mt-0.5">
                    {todayWeather.windSpeedKmh} km/h
                  </p>
                </div>
              </div>
            </div>

            {/* Upcoming 4-Day Mini Forecast Strip */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">
                {language === 'ta' ? 'அடுத்த 4 நாட்கள் முன்னறிவிப்பு' : 'Upcoming 4-Day Forecast'}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {weatherForecast.slice(1, 5).map((day) => (
                  <div
                    key={day.date}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-center space-y-1"
                  >
                    <p className="text-[11px] font-semibold text-slate-700 truncate">
                      {day.dayName.slice(0, 3)}
                    </p>
                    <div className="flex justify-center text-sky-600">
                      {day.condition === 'Sunny' ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : day.rainfallChancePct >= 50 ? (
                        <CloudRain className="w-4 h-4 text-sky-600" />
                      ) : (
                        <CloudSun className="w-4 h-4 text-sky-600" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900 tabular-nums">
                      {day.tempMax}°C
                    </p>
                    <p className="text-[10px] text-sky-700 font-medium tabular-nums">
                      {day.rainfallChancePct}% Rain
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Agro-Advisory Note */}
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/70 leading-relaxed">
              <span className="font-semibold text-slate-800">Advisory: </span>
              {language === 'ta' ? todayWeather.advisoryTa : todayWeather.advisory}
            </p>
          </div>
        </Card>

        {/* 4. Market Prices Table (Commodity, Market, Price ₹/Quintal with green ▲ change, Arrival in Qt), top 5 rows */}
        <div className="lg:col-span-2">
          <Card
            title={language === 'ta' ? 'சந்தை விலைகள் (முதல் 5)' : 'Market Prices'}
            subtitle="Live Regulated Market Modal Rates · Top 5 Commodities"
            noPadding
            action={
              <button
                type="button"
                onClick={() => navigate('/market-prices')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 hover:text-orange-900 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
            className="h-full"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                    <th className="py-3.5 px-6">Commodity</th>
                    <th className="py-3.5 px-4">Market</th>
                    <th className="py-3.5 px-4 text-right">Price (₹/Quintal)</th>
                    <th className="py-3.5 px-6 text-right">Arrival (Qt)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {top5MarketPrices.map((item) => {
                    const change = item.modalPrice - item.previousModalPrice;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-slate-900">
                            {language === 'ta' ? item.commodityTa : item.commodity}
                          </p>
                          <p className="text-[11px] text-slate-500">{item.variety}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-slate-800">
                            {language === 'ta' ? item.mandiNameTa : item.mandiName}
                          </p>
                          <p className="text-[11px] text-slate-400">{item.district}</p>
                        </td>
                        <td className="py-4 px-4 text-right tabular-nums">
                          <span className="font-bold text-slate-900 font-mono">
                            ₹{item.modalPrice.toLocaleString('en-IN')}
                          </span>
                          <span className="ml-2 inline-flex items-center text-[11px] font-semibold text-[#1E8E4F]">
                            ▲ +₹{Math.abs(change)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono tabular-nums text-slate-700 font-medium">
                          {item.arrivalQuintals.toLocaleString('en-IN')} Qt
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Row: 5. Latest Government Schemes List + 7. Important Updates Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5. Latest Government Schemes List with Apply / View buttons */}
        <div className="lg:col-span-2">
          <Card
            title={language === 'ta' ? 'சமீபத்திய அரசுத் திட்டங்கள்' : 'Latest Government Schemes'}
            subtitle="Direct Benefit Transfer & Agricultural Mechanization Subsidies"
            action={
              <button
                type="button"
                onClick={() => navigate('/schemes')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="divide-y divide-slate-100">
              {latestSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      <span className="font-mono font-semibold text-purple-700">{scheme.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{scheme.department}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Max Benefit: ₹{scheme.maxSubsidyAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {language === 'ta' ? scheme.titleTa : scheme.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {language === 'ta' ? scheme.benefitSummaryTa : scheme.benefitSummary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate('/schemes')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View</span>
                    </button>

                    {scheme.applicationStatus ? (
                      <StatusBadge status={scheme.applicationStatus} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedScheme(scheme)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Apply</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 7. Important Updates Feed with Dates */}
        <Card
          title={language === 'ta' ? 'முக்கிய அறிவிப்புகள்' : 'Important Updates'}
          subtitle="Official Announcements & Deadlines"
          action={
            <button
              type="button"
              onClick={() => navigate('/schemes')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D2E] hover:text-[#1E8E4F] cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          }
        >
          <div className="divide-y divide-slate-100">
            {importantUpdates.map((upd) => (
              <div key={upd.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums text-slate-600 font-medium">
                    <Calendar className="w-3 h-3 text-[#0B4D2E]" />
                    <span>{upd.date}</span>
                  </span>
                  <span className="font-semibold text-[#1E8E4F]">{upd.category}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(upd.linkPath)}
                  className="text-left group cursor-pointer block"
                >
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-[#0B4D2E] transition-colors">
                    {language === 'ta' ? upd.titleTa : upd.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {language === 'ta' ? upd.summaryTa : upd.summary}
                  </p>
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 6. My Recent Applications Table with Status Badges */}
      <Card
        title={language === 'ta' ? 'எனது சமீபத்திய விண்ணப்பங்கள்' : 'My Recent Applications'}
        subtitle="Track real-time approval status for your submitted scheme, subsidy, and loan applications"
        noPadding
        action={
          <button
            type="button"
            onClick={() => navigate('/subsidy-loan')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D2E] hover:text-[#1E8E4F] cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                <th className="py-3.5 px-6">Application ID</th>
                <th className="py-3.5 px-4">Scheme / Subsidy Program</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Applied Date</th>
                <th className="py-3.5 px-4 text-right">Sanction Amount</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {subsidies.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-semibold text-slate-800">
                    {app.referenceNo}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-900">
                      {language === 'ta' ? app.schemeNameTa : app.schemeName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate max-w-md">{app.remarks}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{app.category}</td>
                  <td className="py-3.5 px-4 tabular-nums text-slate-600">{app.appliedDate}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                    ₹{app.subsidyComponent.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <StatusBadge status={app.status} />
                      {(role === 'Officer' || role === 'Admin') && app.status !== 'Approved' && (
                        <button
                          type="button"
                          onClick={() =>
                            updateSubsidyStatus(
                              app.id,
                              'Approved',
                              4,
                              `Approved by ${role} from Dashboard.`
                            )
                          }
                          title="Approve Application"
                          className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Scheme Apply Modal directly from Dashboard */}
      <Modal
        isOpen={!!selectedScheme}
        onClose={() => setSelectedScheme(null)}
        title={selectedScheme ? selectedScheme.title : 'Apply to Scheme'}
        subtitle={`Applicant: ${user.name} (${user.farmerId} · Perambalur)`}
      >
        {selectedScheme && (
          <form onSubmit={handleQuickApplySubmit} className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Scheme Code:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedScheme.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Max Subsidy Benefit:</span>
                <span className="font-bold text-[#0B4D2E] tabular-nums">
                  ₹{selectedScheme.maxSubsidyAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Land Survey / Sub-Division No. *
              </label>
              <input
                type="text"
                required
                value={surveyInput}
                onChange={(e) => setSurveyInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-[#0B4D2E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Application Remarks *
              </label>
              <textarea
                rows={3}
                required
                value={remarksInput}
                onChange={(e) => setRemarksInput(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedScheme(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
              >
                Submit Application
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
