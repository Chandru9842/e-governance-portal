import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Landmark, CheckCircle2, FileCheck2, Search, Sparkles } from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { GovernmentScheme } from '../types';
import {
  Card,
  StatCard,
  StatusBadge,
  Modal,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

const schemeApplySchema = z.object({
  landSurveyNo: z.string().min(3, 'Enter valid Patta / Survey number (e.g. SF-142/2A)'),
  aadhaarConsent: z.boolean().refine((val) => val === true, {
    message: 'You must consent to UIDAI e-KYC & Tamil Nilam verification',
  }),
  remarks: z.string().min(5, 'Briefly state the purpose or equipment specification'),
});

type SchemeApplyValues = z.infer<typeof schemeApplySchema>;

export const GovernmentSchemesPage: React.FC = () => {
  const {
    language,
    user,
    role,
    schemes,
    applyToScheme,
    updateSchemeStatus,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<GovernmentScheme | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SchemeApplyValues>({
    resolver: zodResolver(schemeApplySchema),
    defaultValues: {
      landSurveyNo: 'SF-142/2A',
      aadhaarConsent: true,
      remarks: 'Requesting sanction for 2026-27 Samba cultivation season.',
    },
  });

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const departments = [
    'All',
    'State Agriculture Dept',
    'Central Govt (PM-KISAN)',
    'Horticulture Dept',
    'Agri Engineering',
  ];

  const filteredSchemes = schemes.filter((s) => {
    const matchesDept = deptFilter === 'All' || s.department === deptFilter;
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.titleTa.includes(search) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const onSubmitApplication = (values: SchemeApplyValues) => {
    if (!selectedScheme) return;
    applyToScheme(selectedScheme.id, values.landSurveyNo, values.remarks);
    reset();
    setSelectedScheme(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {language === 'ta'
            ? 'மத்திய மற்றும் மாநில அரசு வேளாண் திட்டங்கள்'
            : 'Government Agricultural Welfare Schemes'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Single-window enrollment for Tamil Nadu State Agriculture, Horticulture, and Central PM-KISAN schemes
        </p>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Available Welfare Schemes"
          value={`${schemes.length} Active`}
          subtext="FY 2026-27 Kharif & Rabi Window"
          icon={<Landmark className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="Enrolled & Approved"
          value={`${schemes.filter((s) => s.applicationStatus === 'Approved').length} Schemes`}
          subtext="Direct Benefit Transfer Active"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Maximum Eligible Subsidy"
          value="₹1,68,000"
          subtext="Under PM-KUSUM Solar Pump Scheme"
          icon={<Sparkles className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="e-KYC & NPCI Status"
          value="Verified"
          subtext={`Aadhaar XXXX-${user.aadhaarLast4} Linked`}
          icon={<FileCheck2 className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Search & Department Filter */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by scheme name or code (e.g. KAVIADP, PMKSY, PM-KISAN)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {departments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setDeptFilter(dept)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                deptFilter === dept
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes List */}
      {filteredSchemes.length === 0 ? (
        <Card>
          <EmptyState
            title="No schemes match your filter"
            description="Reset department filters to view all eligible Tamil Nadu and Central agricultural schemes."
            actionLabel="Show All Schemes"
            onAction={() => {
              setDeptFilter('All');
              setSearch('');
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSchemes.map((scheme) => (
            <Card key={scheme.id}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-purple-700">{scheme.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>{scheme.department}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">Deadline: {scheme.deadline}</span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900">
                    {language === 'ta' ? scheme.titleTa : scheme.title}
                  </h2>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'ta' ? scheme.benefitSummaryTa : scheme.benefitSummary}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Eligibility:</span>
                    {scheme.eligibility.map((rule, i) => (
                      <span key={rule} className="inline-flex items-center gap-1.5">
                        {i > 0 && <span aria-hidden="true">·</span>}
                        <span>{rule}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                  <div className="text-left lg:text-right">
                    <p className="text-[11px] text-slate-500">Max Subsidy Benefit</p>
                    <p className="text-lg font-bold text-slate-900 tabular-nums">
                      ₹{scheme.maxSubsidyAmount.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {scheme.applicationStatus ? (
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={scheme.applicationStatus} />
                      {scheme.referenceNo && (
                        <span className="text-[11px] font-mono text-slate-500">
                          Ref: {scheme.referenceNo}
                        </span>
                      )}
                      {(role === 'Officer' || role === 'Admin') &&
                        scheme.applicationStatus !== 'Approved' && (
                          <button
                            type="button"
                            onClick={() => updateSchemeStatus(scheme.id, 'Approved')}
                            className="px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                          >
                            Officer Approve
                          </button>
                        )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedScheme(scheme)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {language === 'ta' ? 'இப்போது விண்ணப்பிக்கவும்' : 'Apply Online'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Scheme Online Application Modal */}
      <Modal
        isOpen={!!selectedScheme}
        onClose={() => setSelectedScheme(null)}
        title={selectedScheme ? selectedScheme.title : 'Apply to Scheme'}
        subtitle={`Applicant: ${user.name} (${user.farmerId})`}
      >
        {selectedScheme && (
          <form onSubmit={handleSubmit(onSubmitApplication)} className="space-y-4" noValidate>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Scheme Code:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {selectedScheme.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Maximum DBT Benefit:</span>
                <span className="font-bold text-[#0B4D2E] tabular-nums">
                  ₹{selectedScheme.maxSubsidyAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Credited Bank A/c:</span>
                <span className="font-mono text-slate-800">{user.accountMasked}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Land Survey / Sub-Division Number *
              </label>
              <input
                type="text"
                {...register('landSurveyNo')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.landSurveyNo && (
                <p className="text-[11px] text-red-600 mt-1">{errors.landSurveyNo.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Field / Requirement Remarks *
              </label>
              <textarea
                rows={3}
                {...register('remarks')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.remarks && (
                <p className="text-[11px] text-red-600 mt-1">{errors.remarks.message}</p>
              )}
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                {...register('aadhaarConsent')}
                className="mt-0.5 rounded border-slate-300 text-[#0B4D2E] focus:ring-[#0B4D2E]"
              />
              <span>
                I authorize the Department of Agriculture, Govt. of Tamil Nadu to verify my Patta/Chitta and Aadhaar e-KYC (XXXX-{user.aadhaarLast4}) for Direct Benefit Transfer.
              </span>
            </label>
            {errors.aadhaarConsent && (
              <p className="text-[11px] text-red-600">{errors.aadhaarConsent.message}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
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
                Submit Scheme Application
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
