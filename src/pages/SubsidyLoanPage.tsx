import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  HandCoins,
  Plus,
  CheckCircle2,
  Clock,
  Landmark,
  Calculator,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import {
  Card,
  StatCard,
  StatusBadge,
  Stepper,
  Modal,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

const subsidyFormSchema = z.object({
  schemeName: z.string().min(4, 'Enter or select a valid subsidy/loan program name'),
  category: z.enum([
    'Micro Irrigation',
    'Farm Machinery',
    'Seed Subsidy',
    'Kisan Credit Card Loan',
    'Solar Pump',
  ]),
  amountRequested: z
    .number({ message: 'Enter valid project cost / loan amount' })
    .min(2000, 'Minimum ₹2,000 required')
    .max(500000, 'Maximum ₹5,00,000 online self-sanction limit'),
  bankAccount: z.string().min(5, 'Bank account reference is required'),
  remarks: z.string().min(5, 'Provide land survey number and vendor quotation details'),
});

type SubsidyFormValues = z.infer<typeof subsidyFormSchema>;

export const SubsidyLoanPage: React.FC = () => {
  const {
    language,
    user,
    role,
    subsidies,
    addSubsidyApplication,
    updateSubsidyStatus,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kccLoanPrincipal, setKccLoanPrincipal] = useState<number>(100000);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubsidyFormValues>({
    resolver: zodResolver(subsidyFormSchema),
    defaultValues: {
      schemeName: 'PM-KUSUM 7.5 HP Solar Submersible Pump Subsidy',
      category: 'Solar Pump',
      amountRequested: 145000,
      bankAccount: user.accountMasked,
      remarks: 'Survey No. SF-144/1B · Quotation from TEDA Empanelled Vendor.',
    },
  });

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const totalApprovedAmount = subsidies
    .filter((s) => s.status === 'Approved')
    .reduce((acc, s) => acc + s.subsidyComponent, 0);

  const totalPendingAmount = subsidies
    .filter((s) => s.status === 'Pending' || s.status === 'Under Review')
    .reduce((acc, s) => acc + s.subsidyComponent, 0);

  const onSubmit = (values: SubsidyFormValues) => {
    const subsidyRatio =
      values.category === 'Micro Irrigation'
        ? 1.0
        : values.category === 'Solar Pump'
        ? 0.7
        : values.category === 'Farm Machinery'
        ? 0.5
        : 0.07;
    addSubsidyApplication({
      ...values,
      schemeNameTa: values.schemeName,
      subsidyComponent: Math.round(values.amountRequested * subsidyRatio),
    });
    reset();
    setIsModalOpen(false);
  };

  // KCC Interest Subvention Math: 7% base rate - 3% prompt repayment incentive - 4% TN PACCS waiver = 0% interest for timely repayment up to ₹3L
  const standardInterestSaved = Math.round(kccLoanPrincipal * 0.07);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta'
              ? 'மானியம் மற்றும் பயிர் கடன் கண்காணிப்பு'
              : 'Subsidy DBT Tracker & Kisan Credit Card (KCC) Loans'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track multi-stage field verification, PFMS Direct Benefit Transfers, and 0%-interest PACCS crop loans
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Subsidy / KCC Application</span>
        </button>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total DBT Subsidy Credited"
          value={`₹${totalApprovedAmount.toLocaleString('en-IN')}`}
          subtext="Credited to Indian Bank XXXX-4910"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="In-Pipeline Subsidy Claims"
          value={`₹${totalPendingAmount.toLocaleString('en-IN')}`}
          subtext="Under Block / District Verification"
          icon={<Clock className="w-5 h-5" />}
          accentColor="blue"
        />
        <StatCard
          label="Active KCC Crop Limit"
          value="₹1,25,000"
          subtext="0% Interest at PACCS Orathanadu"
          icon={<Landmark className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="Annual Interest Saved"
          value={`₹${standardInterestSaved.toLocaleString('en-IN')}`}
          subtext="100% Interest Subvention Active"
          icon={<HandCoins className="w-5 h-5" />}
          accentColor="orange"
        />
      </div>

      {/* Multi-Stage Subsidy & Loan Application Tracker */}
      <Card
        title="Active Subsidy & Loan Applications (4-Stage Verification Pipeline)"
        subtitle={
          role !== 'Farmer'
            ? `Viewing as ${role} — Click Approve or Reject on pending records to test RBAC workflow`
            : 'Real-time updates from Block Agricultural Officer & Public Financial Management System (PFMS)'
        }
      >
        <div className="divide-y divide-slate-100">
          {subsidies.map((sub) => (
            <div key={sub.id} className="py-5 first:pt-0 last:pb-0 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono font-semibold text-slate-800">
                      {sub.referenceNo}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{sub.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">Filed: {sub.appliedDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>Bank: {sub.bankAccount}</span>
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 mt-1">
                    {language === 'ta' ? sub.schemeNameTa : sub.schemeName}
                  </h2>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">Sanctioned Subsidy</p>
                    <p className="text-sm font-bold text-slate-900 tabular-nums">
                      ₹{sub.subsidyComponent.toLocaleString('en-IN')}{' '}
                      <span className="text-[11px] font-normal text-slate-500">
                        (of ₹{sub.amountRequested.toLocaleString('en-IN')})
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={sub.status} />
                </div>
              </div>

              <Stepper
                steps={[
                  '1. Online Filing',
                  '2. VAO e-Adangal Check',
                  '3. Field Inspection',
                  '4. PFMS DBT Credit',
                ]}
                currentStep={sub.currentStep}
                status={sub.status}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="text-xs text-slate-600">{sub.remarks}</p>

                {/* Role-Based Officer / Admin Controls */}
                {(role === 'Officer' || role === 'Admin') && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        updateSubsidyStatus(
                          sub.id,
                          'Under Review',
                          3,
                          `Field inspection logged by ${role}.`
                        )
                      }
                      className="px-2.5 py-1 rounded text-xs font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 cursor-pointer"
                    >
                      Mark Inspected
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSubsidyStatus(
                          sub.id,
                          'Approved',
                          4,
                          `Approved for PFMS DBT release by ${role}.`
                        )
                      }
                      className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      Approve DBT
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSubsidyStatus(
                          sub.id,
                          'Rejected',
                          sub.currentStep,
                          `Returned by ${role}: Survey sub-division mismatch.`
                        )
                      }
                      className="px-2.5 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Interactive PACCS Kisan Credit Card (KCC) Subvention Calculator */}
      <Card
        title="Tamil Nadu Co-operative Bank (PACCS) KCC Interest Subvention Calculator"
        subtitle="Short-term crop loans up to ₹3,00,000 carry 0% effective interest for farmers repaying within 12 months"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Crop Loan Amount Required:</span>
              <span className="font-mono text-sm text-[#0B4D2E] font-bold tabular-nums">
                ₹{kccLoanPrincipal.toLocaleString('en-IN')}
              </span>
            </label>
            <input
              type="range"
              min={25000}
              max={300000}
              step={5000}
              value={kccLoanPrincipal}
              onChange={(e) => setKccLoanPrincipal(Number(e.target.value))}
              className="w-full accent-[#0B4D2E] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
              <span>₹25,000</span>
              <span>₹1,50,000</span>
              <span>₹3,00,000</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Standard Crop Loan Interest (7%):</span>
              <span className="font-mono tabular-nums text-slate-800">
                ₹{standardInterestSaved.toLocaleString('en-IN')} / yr
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Govt. of Tamil Nadu & NABARD Waiver:</span>
              <span className="font-mono tabular-nums text-[#1E8E4F] font-semibold">
                -₹{standardInterestSaved.toLocaleString('en-IN')} (100%)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0B4D2E] text-white flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-200">Net Payable by Farmer (12 Mos)</p>
              <p className="text-xl font-bold tabular-nums mt-0.5">
                ₹{kccLoanPrincipal.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-emerald-200 mt-0.5">Effective Interest: 0.00% p.a.</p>
            </div>
            <Calculator className="w-7 h-7 text-emerald-300 shrink-0" />
          </div>
        </div>
      </Card>

      {/* New Subsidy / Loan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="File New Subsidy or KCC Loan Application"
        subtitle="Direct integration with Tamil Nadu GRAINS & District Central Co-operative Bank"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subsidy / Loan Category *
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
            >
              <option value="Solar Pump">PM-KUSUM Solar Pump (70% Subsidy)</option>
              <option value="Micro Irrigation">PMKSY Automated Drip / Sprinkler (100% SF/MF)</option>
              <option value="Farm Machinery">SMAM Power Tiller / Rotavator (50% Subsidy)</option>
              <option value="Seed Subsidy">Certified Paddy / Pulse Seed Subsidy (50%)</option>
              <option value="Kisan Credit Card Loan">PACCS Kisan Credit Card 0% Crop Loan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Program / Equipment Title *
            </label>
            <input
              type="text"
              {...register('schemeName')}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
            />
            {errors.schemeName && (
              <p className="text-[11px] text-red-600 mt-1">{errors.schemeName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Invoice / Loan Amount (₹) *
              </label>
              <input
                type="number"
                {...register('amountRequested', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.amountRequested && (
                <p className="text-[11px] text-red-600 mt-1">{errors.amountRequested.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                DBT Linked Bank Account *
              </label>
              <input
                type="text"
                {...register('bankAccount')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.bankAccount && (
                <p className="text-[11px] text-red-600 mt-1">{errors.bankAccount.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Land Survey No. & Quotation Details *
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

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
      </Modal>
    </div>
  );
};
