import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout,
  Landmark,
  TrendingUp,
  CloudSun,
  ArrowUpRight,
  PlusCircle,
  Droplets,
  FileWarning,
  ShieldAlert,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import {
  Card,
  StatCard,
  StatusBadge,
  Stepper,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

export const DashboardPage: React.FC = () => {
  const {
    language,
    t,
    user,
    role,
    crops,
    schemes,
    marketPrices,
    weatherForecast,
    subsidies,
    updateSubsidyStatus,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  const navigate = useNavigate();

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const totalCultivatedAcres = crops.reduce((acc, c) => acc + c.areaAcres, 0);
  const approvedSchemesCount = schemes.filter((s) => s.applicationStatus === 'Approved').length;
  const primaryMandi = marketPrices[0];
  const todayWeather = weatherForecast[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Farmer Context */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>{t('appSubtitle')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700 font-medium">{user.farmerId}</span>
            {role !== 'Farmer' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#0B4D2E] font-semibold">
                  Active View: {role} Portal Mode
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            {t('welcomeBack')} {language === 'ta' ? user.nameTa : user.name}
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {language === 'ta' ? user.villageTa : user.village}, {user.taluk} Taluk,{' '}
            {language === 'ta' ? user.districtTa : user.district} District · Soil:{' '}
            {user.soilType}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/crops')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t('registerNewCrop')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/subsidy-loan')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Droplets className="w-3.5 h-3.5 text-[#0B4D2E]" />
            <span>{t('applyMicroIrrigation')}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/grievances')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <FileWarning className="w-3.5 h-3.5 text-orange-600" />
            <span>{t('raiseGrievance')}</span>
          </button>
        </div>
      </div>

      {/* 4-Column Summary Grid (Green, Purple, Orange, Blue accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t('statCultivatedArea')}
          value={`${totalCultivatedAcres.toFixed(2)} Acres`}
          subtext={`${crops.length} Registered Plots in e-Adangal`}
          icon={<Sprout className="w-5 h-5" />}
          accentColor="green"
          onClick={() => navigate('/crops')}
        />
        <StatCard
          label={t('statActiveSchemes')}
          value={`${approvedSchemesCount} Approved`}
          subtext={`₹96,500 Total DBT Sanctioned`}
          icon={<Landmark className="w-5 h-5" />}
          accentColor="purple"
          onClick={() => navigate('/schemes')}
        />
        <StatCard
          label={t('statMandiPaddy')}
          value={`₹${primaryMandi.modalPrice.toLocaleString('en-IN')}/Qtl`}
          subtext={`+₹${primaryMandi.modalPrice - primaryMandi.previousModalPrice} vs Yesterday · ${primaryMandi.district}`}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="orange"
          onClick={() => navigate('/market-prices')}
        />
        <StatCard
          label={t('statWeatherAlert')}
          value={`${todayWeather.tempMax}°C / ${todayWeather.humidity}% RH`}
          subtext={`${todayWeather.condition} · Monsoon Alert Thu`}
          icon={<CloudSun className="w-5 h-5" />}
          accentColor="blue"
          onClick={() => navigate('/weather')}
        />
      </div>

      {/* Officer / Admin Role Guard Banner if switched */}
      {(role === 'Officer' || role === 'Admin') && (
        <div className="bg-emerald-950 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-700">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-emerald-200">
                {role} Verification Console Enabled
              </p>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                You have elevated privileges to approve or reject pending farmer subsidy applications and resolve grievance tickets directly below.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/subsidy-loan')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1E8E4F] hover:bg-emerald-500 text-white shrink-0 cursor-pointer"
          >
            Review Pending Queue
          </button>
        </div>
      )}

      {/* Main Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Active Subsidy & Loan Stepper + Registered Crops Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title={t('recentSubsidyTrack')}
            subtitle="Real-time status from Tamil Nadu GRAINS & PFMS Direct Benefit Transfer"
            action={
              <button
                type="button"
                onClick={() => navigate('/subsidy-loan')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D2E] hover:text-[#1E8E4F] cursor-pointer"
              >
                <span>{t('viewDetails')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="divide-y divide-slate-100">
              {subsidies.slice(0, 2).map((sub) => (
                <div key={sub.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-medium text-slate-700">
                          {sub.referenceNo}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{sub.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">Applied {sub.appliedDate}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mt-1">
                        {language === 'ta' ? sub.schemeNameTa : sub.schemeName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        ₹{sub.subsidyComponent.toLocaleString('en-IN')}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>

                  <Stepper
                    steps={[
                      '1. Online Filing',
                      '2. VAO / Adangal Check',
                      '3. Field Inspection',
                      '4. PFMS DBT Credit',
                    ]}
                    currentStep={sub.currentStep}
                    status={sub.status}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-slate-600">{sub.remarks}</p>
                    {(role === 'Officer' || role === 'Admin') && sub.status !== 'Approved' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateSubsidyStatus(
                              sub.id,
                              'Approved',
                              4,
                              `Sanctioned by ${role} via e-Governance Console.`
                            )
                          }
                          className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                        >
                          Approve DBT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Registered Crop Plots Summary Table */}
          <Card
            title={language === 'ta' ? 'பயிர் சாகுபடி விவரங்கள் (இ-அடங்கல்)' : 'Registered Crop Plots (Samba & Kuruvai)'}
            subtitle="Synchronized with Tamil Nilam Land Registry"
            noPadding
            action={
              <button
                type="button"
                onClick={() => navigate('/crops')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D2E] hover:text-[#1E8E4F] cursor-pointer"
              >
                <span>Manage Crops</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                    <th className="py-3 px-6">Crop & Variety</th>
                    <th className="py-3 px-4">Survey No.</th>
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4 text-right">Area (Acres)</th>
                    <th className="py-3 px-4">Growth Stage</th>
                    <th className="py-3 px-6 text-right">Est. Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {crops.map((crop) => (
                    <tr key={crop.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-slate-900">
                          {language === 'ta' ? crop.cropNameTa : crop.cropName}
                        </p>
                        <p className="text-[11px] text-slate-500">{crop.variety}</p>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{crop.surveyNumber}</td>
                      <td className="py-3.5 px-4 text-slate-600">{crop.season}</td>
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900">
                        {crop.areaAcres.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-medium">{crop.growthStage}</span>
                        <span className="text-slate-400 mx-1.5">·</span>
                        <span
                          className={
                            crop.healthStatus === 'Healthy'
                              ? 'text-[#1E8E4F] font-medium'
                              : 'text-orange-600 font-medium'
                          }
                        >
                          {crop.healthStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono tabular-nums text-slate-700">
                        {crop.expectedYieldQuintals} Qtl
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Regulated Market Snapshot + Agro-Met Advisory */}
        <div className="space-y-6">
          <Card
            title={language === 'ta' ? 'இன்றைய சந்தை நிலவரம்' : 'Live Regulated Mandi Rates'}
            subtitle="Prices per Quintal (100 kg)"
            action={
              <button
                type="button"
                onClick={() => navigate('/market-prices')}
                className="text-xs font-semibold text-orange-700 hover:text-orange-800 cursor-pointer"
              >
                All Mandis
              </button>
            }
          >
            <div className="divide-y divide-slate-100">
              {marketPrices.slice(0, 4).map((item) => {
                const diff = item.modalPrice - item.previousModalPrice;
                return (
                  <div
                    key={item.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {language === 'ta' ? item.commodityTa : item.commodity}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {language === 'ta' ? item.mandiNameTa : item.mandiName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-900 tabular-nums">
                        ₹{item.modalPrice.toLocaleString('en-IN')}
                      </p>
                      <p
                        className={`text-[11px] font-medium tabular-nums ${
                          diff > 0
                            ? 'text-[#1E8E4F]'
                            : diff < 0
                            ? 'text-red-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {diff > 0 ? `+₹${diff}` : diff < 0 ? `-₹${Math.abs(diff)}` : 'No change'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            title={t('upcomingAdvisories')}
            subtitle="TNAU Cauvery Delta Agro-Met Bulletin"
            action={
              <button
                type="button"
                onClick={() => navigate('/weather')}
                className="text-xs font-semibold text-sky-700 hover:text-sky-800 cursor-pointer"
              >
                5-Day Forecast
              </button>
            }
          >
            <div className="space-y-3">
              {weatherForecast.slice(0, 3).map((day) => (
                <div
                  key={day.date}
                  className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">
                      {language === 'ta' ? day.dayNameTa : day.dayName}
                    </span>
                    <span className="font-mono tabular-nums text-sky-700 font-medium">
                      {day.tempMax}°C · {day.rainfallMm}mm Rain
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'ta' ? day.advisoryTa : day.advisory}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
