import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserCheck,
  ShieldCheck,
  MapPin,
  Landmark,
  Save,
  Award,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { Card, StatCard, LoadingSkeleton, ErrorState } from '../components/ui';

const profileSchema = z.object({
  name: z.string().min(3, 'Full name must be at least 3 characters'),
  phone: z
    .string()
    .min(10, 'Enter a valid 10-digit Indian mobile number')
    .max(16, 'Phone number is too long'),
  email: z.string().email('Enter a valid email address'),
  district: z.string().min(2, 'District is required'),
  taluk: z.string().min(2, 'Taluk is required'),
  village: z.string().min(2, 'Revenue village is required'),
  totalLandAcres: z
    .number({ message: 'Enter valid acreage' })
    .min(0.25, 'Minimum 0.25 acres')
    .max(100, 'Maximum 100 acres'),
  soilType: z.string().min(3, 'Soil classification is required'),
  irrigationSource: z.string().min(3, 'Primary irrigation source is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const {
    language,
    user,
    role,
    setRole,
    updateUserProfile,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone,
      email: user.email,
      district: user.district,
      taluk: user.taluk,
      village: user.village,
      totalLandAcres: user.totalLandAcres,
      soilType: user.soilType,
      irrigationSource: user.irrigationSource,
    },
  });

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const onSubmit = (values: ProfileFormValues) => {
    updateUserProfile(values);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {language === 'ta'
            ? 'எனது உழவர் அடையாள அட்டை மற்றும் நிலப் பதிவேடு'
            : 'My Farmer Profile & Digital Uzhavar Card'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Synchronized with Tamil Nilam (Patta / Chitta), UIDAI Aadhaar e-KYC, and NPCI Direct Benefit Transfer
        </p>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Unique Uzhavar ID"
          value={user.farmerId}
          subtext="GRAINS Tamil Nadu Verified"
          icon={<UserCheck className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Total Patta Holding"
          value={`${user.totalLandAcres.toFixed(2)} Acres`}
          subtext={`${user.village}, ${user.taluk}`}
          icon={<MapPin className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="NPCI DBT Bank Link"
          value={user.accountMasked}
          subtext={`IFSC: ${user.ifsc} · Active`}
          icon={<Landmark className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="PM-KISAN & e-KYC"
          value="e-KYC Active"
          subtext={`Aadhaar XXXX-${user.aadhaarLast4} Verified`}
          icon={<Award className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Digital Uzhavar Identity Card + RBAC Role Switcher */}
        <div className="space-y-6">
          <div className="rounded-xl bg-[#0B4D2E] text-white p-6 shadow-sm border border-emerald-700 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-white/15 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
                  Govt. of Tamil Nadu · Agrisnet
                </p>
                <h2 className="text-base font-bold mt-0.5">
                  {language === 'ta' ? user.nameTa : user.name}
                </h2>
                <p className="text-xs font-mono text-emerald-200 mt-0.5">{user.farmerId}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#1E8E4F] flex items-center justify-center font-bold text-base border border-white/20">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-emerald-200/80">Revenue Village:</span>
                <span className="font-medium">{user.village} ({user.taluk})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200/80">District:</span>
                <span className="font-medium">{user.district}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200/80">Soil Health Card:</span>
                <span className="font-medium">{user.soilType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200/80">DBT Bank Account:</span>
                <span className="font-mono">{user.accountMasked}</span>
              </div>
            </div>
          </div>

          <Card
            title="Role-Based Access Control (RBAC)"
            subtitle="Switch active portal persona to test Farmer, Agri Officer, and District Admin workflows"
          >
            <div className="space-y-3">
              {(['Farmer', 'Officer', 'Admin'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`w-full p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                    role === r
                      ? 'border-[#0B4D2E] bg-emerald-50/60 text-slate-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{r} Role</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {r === 'Farmer'
                        ? 'Apply for schemes, register crops, check mandi rates'
                        : r === 'Officer'
                        ? 'Inspect fields, approve/reject subsidies & grievances'
                        : 'Full district oversight & DBT sanction authority'}
                    </p>
                  </div>
                  <ShieldCheck
                    className={`w-4 h-4 shrink-0 ${
                      role === r ? 'text-[#0B4D2E]' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right 2 Columns: Editable Farmer & Land Registry Form (react-hook-form + zod) */}
        <div className="lg:col-span-2">
          <Card
            title="Edit Farmer Demographics & Landholding Registry"
            subtitle="Validated via Zod schema before committing to your e-Governance profile"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Farmer Full Name (as per Aadhaar) *
                  </label>
                  <input
                    type="text"
                    {...register('name')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aadhaar-Linked Mobile Number *
                  </label>
                  <input
                    type="text"
                    {...register('phone')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
                  />
                  {errors.phone && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                  />
                  {errors.email && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Patta Landholding (Acres) *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    {...register('totalLandAcres', { valueAsNumber: true })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
                  />
                  {errors.totalLandAcres && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {errors.totalLandAcres.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    District *
                  </label>
                  <input
                    type="text"
                    {...register('district')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                  />
                  {errors.district && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.district.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Taluk *
                  </label>
                  <input
                    type="text"
                    {...register('taluk')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                  />
                  {errors.taluk && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.taluk.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Revenue Village *
                  </label>
                  <input
                    type="text"
                    {...register('village')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                  />
                  {errors.village && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.village.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Soil Classification (Soil Health Card) *
                  </label>
                  <input
                    type="text"
                    {...register('soilType')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                  />
                  {errors.soilType && (
                    <p className="text-[11px] text-red-600 mt-1">{errors.soilType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Irrigation Source *
                  </label>
                  <input
                    type="text"
                    {...register('irrigationSource')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
                  />
                  {errors.irrigationSource && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {errors.irrigationSource.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-[11px] text-slate-500">
                  {isDirty ? 'Unsaved changes detected' : 'All profile records are up to date'}
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Farmer Profile</span>
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
