import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sprout, Plus, Search, Trash2, Calendar, Droplets, MapPin } from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import {
  Card,
  StatCard,
  Modal,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

const cropSchema = z.object({
  cropName: z.string().min(2, 'Crop name is required (min 2 characters)'),
  variety: z.string().min(2, 'Seed variety is required'),
  season: z.enum(['Kuruvai', 'Samba', 'Navarai', 'Thaladi']),
  areaAcres: z
    .number({ message: 'Enter valid acreage' })
    .min(0.1, 'Minimum 0.10 acres required')
    .max(50, 'Maximum 50 acres per single plot'),
  surveyNumber: z
    .string()
    .regex(/^[A-Za-z0-9-/]+$/, 'Enter valid Survey / Sub-division No (e.g. SF-148/2A)'),
  sowingDate: z.string().min(1, 'Sowing date is required'),
  expectedHarvestDate: z.string().min(1, 'Expected harvest date is required'),
  irrigationType: z.enum(['Canal', 'Borewell', 'Drip', 'Rainfed']),
  expectedYieldQuintals: z
    .number({ message: 'Enter estimated yield' })
    .min(1, 'Estimated yield must be at least 1 quintal'),
});

type CropFormValues = z.infer<typeof cropSchema>;

export const MyCropsPage: React.FC = () => {
  const { language, crops, addCrop, deleteCrop, isLoading, hasError, setHasError } = usePortal();
  const [search, setSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CropFormValues>({
    resolver: zodResolver(cropSchema),
    defaultValues: {
      cropName: '',
      variety: '',
      season: 'Samba',
      areaAcres: 1.5,
      surveyNumber: 'SF-150/1A',
      sowingDate: '2026-10-15',
      expectedHarvestDate: '2027-02-20',
      irrigationType: 'Canal',
      expectedYieldQuintals: 36,
    },
  });

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const filteredCrops = crops.filter((c) => {
    const matchesSearch =
      c.cropName.toLowerCase().includes(search.toLowerCase()) ||
      c.cropNameTa.includes(search) ||
      c.surveyNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.variety.toLowerCase().includes(search.toLowerCase());
    const matchesSeason = seasonFilter === 'All' || c.season === seasonFilter;
    return matchesSearch && matchesSeason;
  });

  const totalArea = crops.reduce((sum, c) => sum + c.areaAcres, 0);
  const totalYield = crops.reduce((sum, c) => sum + c.expectedYieldQuintals, 0);
  const dripPlots = crops.filter((c) => c.irrigationType === 'Drip').length;

  const onSubmit = (data: CropFormValues) => {
    addCrop({
      ...data,
      cropNameTa: data.cropName,
      growthStage: 'Seedling',
      healthStatus: 'Healthy',
    });
    reset();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta' ? 'எனது பயிர்கள் மற்றும் இ-அடங்கல் பதிவேடு' : 'My Crops & e-Adangal Registry'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage seasonal crop cultivation plots, survey numbers, and yield projections
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ta' ? 'புதிய பயிர் பதிவு செய்க' : 'Register New Crop Plot'}</span>
        </button>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cultivated Land"
          value={`${totalArea.toFixed(2)} Acres`}
          subtext="Out of 6.50 Acres Patta Holding"
          icon={<Sprout className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Registered Survey Plots"
          value={`${crops.length} Plots`}
          subtext="Verified by Village Admin Officer"
          icon={<MapPin className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="Projected Harvest Output"
          value={`${totalYield} Quintals`}
          subtext="Eligible for TNCSC DPC Procurement"
          icon={<Calendar className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="Micro-Irrigation Coverage"
          value={`${dripPlots} Drip Plots`}
          subtext="PMKSY Water Saving Certified"
          icon={<Droplets className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by crop name, seed variety, or survey number..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {['All', 'Samba', 'Kuruvai', 'Navarai', 'Thaladi'].map((season) => (
              <button
                key={season}
                type="button"
                onClick={() => setSeasonFilter(season)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  seasonFilter === season
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {season === 'All' ? 'All Seasons' : `${season} Season`}
              </button>
            ))}
          </div>
        </div>

        {/* Crop Records Table */}
        <div className="mt-6 overflow-x-auto">
          {filteredCrops.length === 0 ? (
            <EmptyState
              title="No matching crop plots found"
              description="Try clearing your search filter or register a new seasonal crop plot in your e-Adangal profile."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch('');
                setSeasonFilter('All');
              }}
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50/70">
                  <th className="py-3 px-4">Crop & Certified Variety</th>
                  <th className="py-3 px-4">Survey No.</th>
                  <th className="py-3 px-4">Season & Irrigation</th>
                  <th className="py-3 px-4 text-right">Area (Acres)</th>
                  <th className="py-3 px-4">Sowing → Harvest</th>
                  <th className="py-3 px-4">Stage & Health</th>
                  <th className="py-3 px-4 text-right">Est. Yield</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCrops.map((crop) => (
                  <tr key={crop.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-900">
                        {language === 'ta' ? crop.cropNameTa : crop.cropName}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{crop.variety}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                      {crop.surveyNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span>{crop.season}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span>{crop.irrigationType}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900">
                      {crop.areaAcres.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-slate-600">
                      {crop.sowingDate} <span className="text-slate-400">to</span>{' '}
                      {crop.expectedHarvestDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800">{crop.growthStage}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
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
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-800">
                      {crop.expectedYieldQuintals} Qtl
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => deleteCrop(crop.id)}
                        aria-label={`Remove ${crop.cropName}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add Crop Modal with react-hook-form + zod */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Crop in e-Adangal"
        subtitle="Validated against Tamil Nilam Patta & Sub-division Survey Records"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Crop Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Paddy (CO-51), Groundnut"
                {...register('cropName')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.cropName && (
                <p className="text-[11px] text-red-600 mt-1">{errors.cropName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Certified Seed Variety *
              </label>
              <input
                type="text"
                placeholder="e.g. TNAU Certified Breeder Seed"
                {...register('variety')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.variety && (
                <p className="text-[11px] text-red-600 mt-1">{errors.variety.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Agricultural Season *
              </label>
              <select
                {...register('season')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E] bg-white"
              >
                <option value="Samba">Samba (Aug - Jan)</option>
                <option value="Kuruvai">Kuruvai (Jun - Sep)</option>
                <option value="Navarai">Navarai (Dec - Mar)</option>
                <option value="Thaladi">Thaladi (Oct - Feb)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Survey / Sub-Division No. *
              </label>
              <input
                type="text"
                {...register('surveyNumber')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.surveyNumber && (
                <p className="text-[11px] text-red-600 mt-1">{errors.surveyNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cultivated Area (Acres) *
              </label>
              <input
                type="number"
                step="0.25"
                {...register('areaAcres', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.areaAcres && (
                <p className="text-[11px] text-red-600 mt-1">{errors.areaAcres.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sowing Date *
              </label>
              <input
                type="date"
                {...register('sowingDate')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.sowingDate && (
                <p className="text-[11px] text-red-600 mt-1">{errors.sowingDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Harvest Date *
              </label>
              <input
                type="date"
                {...register('expectedHarvestDate')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.expectedHarvestDate && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.expectedHarvestDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Irrigation Source *
              </label>
              <select
                {...register('irrigationType')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E] bg-white"
              >
                <option value="Canal">Cauvery Canal Irrigation</option>
                <option value="Drip">Automated Drip System</option>
                <option value="Borewell">Solar / EB Borewell</option>
                <option value="Rainfed">Rainfed Plot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Yield (Quintals) *
              </label>
              <input
                type="number"
                {...register('expectedYieldQuintals', { valueAsNumber: true })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
              />
              {errors.expectedYieldQuintals && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.expectedYieldQuintals.message}
                </p>
              )}
            </div>
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
              Save Crop Plot
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
