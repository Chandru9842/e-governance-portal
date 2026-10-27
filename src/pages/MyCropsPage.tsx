import React, { useState, useEffect, useCallback } from 'react';
import {
  Sprout,
  Plus,
  Search,
  Trash2,
  Edit3,
  LayoutGrid,
  List,
  Calendar,
  Droplets,
  MapPin,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Bug,
  FileText,
  RefreshCw,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { usePortal } from '../context/PortalContext';
import { CropRecord, CropSeason } from '../types';
import {
  Card,
  StatCard,
  Stepper,
  Modal,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

interface AIAdvisoryData {
  summary: string;
  pestAlerts: string[];
  irrigationAdvice: string;
  nutrientTip: string;
}

const GROWTH_STAGES: CropRecord['growthStage'][] = [
  'Seedling',
  'Vegetative',
  'Flowering',
  'Grain Filling',
  'Harvest Ready',
];

const LAND_PARCELS = [
  { survey: 'SF-142/2A', label: 'SF-142/2A · Arumbavur North (3.00 Acres Alluvial)' },
  { survey: 'SF-144/1B', label: 'SF-144/1B · Veppanthattai Road (1.75 Acres Red Loam)' },
  { survey: 'SF-145/3', label: 'SF-145/3 · Check Dam Bund (1.25 Acres Clay Loam)' },
  { survey: 'SF-142/2B', label: 'SF-142/2B · Eastern Borewell Plot (0.50 Acres)' },
  { survey: 'SF-150/1A', label: 'SF-150/1A · Perambalur Tank Fed (2.00 Acres)' },
];

function buildDeterministicFallbackAdvisory(crop: CropRecord): AIAdvisoryData {
  return {
    summary: `${crop.cropName} (${crop.variety}) is currently in the ${crop.growthStage} stage across ${crop.areaAcres} acres (${crop.surveyNumber}). With 74% relative humidity and 35% rain probability in Perambalur, maintain clean field drainage and monitor canopy micro-climate.`,
    pestAlerts: [
      `High humidity alert for ${crop.cropName}: Inspect lower leaves every 48 hours for foliar sucking pests or early stem borer / armyworm egg masses; install 5 pheromone traps per acre.`,
      `Apply prophylactic Neem Seed Kernel Extract (NSKE 5%) or Pseudomonas fluorescens @ 10g/Litre during clear morning hours.`,
    ],
    irrigationAdvice: `Using ${crop.irrigationType} irrigation: With light evening showers forecast in Perambalur, reduce irrigation volume by 30% for the next 72 hours and avoid standing water deeper than 2.5 cm.`,
    nutrientTip: `For the ${crop.growthStage} stage, apply TNAU crop-specific micronutrient foliar spray (0.5% Zinc Sulphate + 1% Urea) to maximize grain/bulb filling and prevent flower drop.`,
  };
}

export const MyCropsPage: React.FC = () => {
  const {
    language,
    crops,
    addCrop,
    updateCrop,
    deleteCrop,
    addCropInputLog,
    addCropNote,
    weatherForecast,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  // View Mode: Card vs Table toggle
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [search, setSearch] = useState('');
  const [seasonFilter, setSeasonFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Detail View state
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);

  // Multi-step Add Crop Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addStep, setAddStep] = useState<number>(1);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newCropForm, setNewCropForm] = useState<{
    cropType: CropRecord['cropType'];
    cropName: string;
    variety: string;
    season: CropSeason;
    surveyNumber: string;
    areaAcres: string;
    irrigationType: CropRecord['irrigationType'];
    sowingDate: string;
    expectedHarvestDate: string;
    expectedYieldQuintals: string;
  }>({
    cropType: 'Cereals & Millets',
    cropName: '',
    variety: '',
    season: 'Kharif',
    surveyNumber: 'SF-142/2A',
    areaAcres: '2.0',
    irrigationType: 'Drip',
    sowingDate: '2026-10-15',
    expectedHarvestDate: '2027-02-15',
    expectedYieldQuintals: '48',
  });

  // Edit Crop Modal state
  const [editingCrop, setEditingCrop] = useState<CropRecord | null>(null);
  const [editError, setEditError] = useState('');

  // Delete Confirmation Modal state
  const [deletingCrop, setDeletingCrop] = useState<CropRecord | null>(null);

  // Input Log form state (inside Detail View)
  const [logType, setLogType] = useState<'Fertilizer' | 'Pesticide' | 'Water'>('Fertilizer');
  const [logItemName, setLogItemName] = useState('');
  const [logQuantity, setLogQuantity] = useState('');
  const [logCost, setLogCost] = useState('');
  const [logDate, setLogDate] = useState('2026-10-26');
  const [logError, setLogError] = useState('');

  // Note input state (inside Detail View)
  const [noteText, setNoteText] = useState('');

  // AI Advisory state
  const [aiAdvisory, setAiAdvisory] = useState<AIAdvisoryData | null>(null);
  const [aiSource, setAiSource] = useState<'gemini' | 'fallback'>('fallback');
  const [aiLoading, setAiLoading] = useState(false);

  const selectedCrop = crops.find((c) => c.id === selectedCropId) || null;
  const todayWeather = weatherForecast[0];

  const fetchCropAdvisory = useCallback(
    async (crop: CropRecord) => {
      setAiLoading(true);
      try {
        const res = await fetch('/api/crop-advisory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cropName: crop.cropName,
            variety: crop.variety,
            season: crop.season,
            growthStage: crop.growthStage,
            healthStatus: crop.healthStatus,
            irrigationType: crop.irrigationType,
            areaAcres: crop.areaAcres,
            weather: todayWeather,
            language,
          }),
        });
        if (!res.ok) {
          throw new Error('Using TNAU Agronomic Fallback Advisory');
        }
        const data = await res.json();
        if (data?.advisory) {
          setAiAdvisory(data.advisory);
          setAiSource('gemini');
        } else {
          throw new Error('Fallback');
        }
      } catch {
        setAiAdvisory(buildDeterministicFallbackAdvisory(crop));
        setAiSource('fallback');
      } finally {
        setAiLoading(false);
      }
    },
    [language, todayWeather]
  );

  useEffect(() => {
    if (selectedCrop) {
      fetchCropAdvisory(selectedCrop);
    }
  }, [selectedCrop, fetchCropAdvisory]);

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const filteredCrops = crops.filter((c) => {
    const matchesSearch =
      c.cropName.toLowerCase().includes(search.toLowerCase()) ||
      c.cropNameTa.includes(search) ||
      c.variety.toLowerCase().includes(search.toLowerCase()) ||
      c.surveyNumber.toLowerCase().includes(search.toLowerCase());
    const matchesSeason = seasonFilter === 'All' || c.season === seasonFilter;
    const matchesStatus = statusFilter === 'All' || c.healthStatus === statusFilter;
    return matchesSearch && matchesSeason && matchesStatus;
  });

  // Multi-step validation logic
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!newCropForm.cropName.trim() || newCropForm.cropName.trim().length < 2) {
      errs.cropName = 'Crop name is required (min 2 characters)';
    }
    if (!newCropForm.variety.trim() || newCropForm.variety.trim().length < 2) {
      errs.variety = 'Certified variety name is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    const area = parseFloat(newCropForm.areaAcres);
    const yieldQtl = parseFloat(newCropForm.expectedYieldQuintals);
    if (!newCropForm.surveyNumber.trim()) {
      errs.surveyNumber = 'Select a valid land survey number';
    }
    if (Number.isNaN(area) || area < 0.1 || area > 50) {
      errs.areaAcres = 'Enter valid land area between 0.10 and 50.00 acres';
    }
    if (!newCropForm.sowingDate) {
      errs.sowingDate = 'Sowing date is required';
    }
    if (!newCropForm.expectedHarvestDate) {
      errs.expectedHarvestDate = 'Expected harvest date is required';
    } else if (newCropForm.expectedHarvestDate <= newCropForm.sowingDate) {
      errs.expectedHarvestDate = 'Harvest date must be after sowing date';
    }
    if (Number.isNaN(yieldQtl) || yieldQtl <= 0) {
      errs.expectedYieldQuintals = 'Enter expected yield in quintals';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateCrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;
    addCrop({
      cropType: newCropForm.cropType,
      cropName: newCropForm.cropName.trim(),
      cropNameTa: newCropForm.cropName.trim(),
      variety: newCropForm.variety.trim(),
      season: newCropForm.season,
      surveyNumber: newCropForm.surveyNumber,
      areaAcres: parseFloat(newCropForm.areaAcres),
      irrigationType: newCropForm.irrigationType,
      sowingDate: newCropForm.sowingDate,
      expectedHarvestDate: newCropForm.expectedHarvestDate,
      expectedYieldQuintals: parseFloat(newCropForm.expectedYieldQuintals),
      growthStage: 'Seedling',
      healthStatus: 'Healthy',
    });
    setIsAddModalOpen(false);
    setAddStep(1);
    setNewCropForm({
      cropType: 'Cereals & Millets',
      cropName: '',
      variety: '',
      season: 'Kharif',
      surveyNumber: 'SF-142/2A',
      areaAcres: '2.0',
      irrigationType: 'Drip',
      sowingDate: '2026-10-15',
      expectedHarvestDate: '2027-02-15',
      expectedYieldQuintals: '48',
    });
  };

  const handleSaveEditCrop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrop) return;
    if (!editingCrop.cropName.trim() || !editingCrop.variety.trim() || editingCrop.areaAcres <= 0) {
      setEditError('Please fill all required fields with valid values.');
      return;
    }
    updateCrop(editingCrop.id, editingCrop);
    setEditingCrop(null);
    setEditError('');
  };

  const handleAddInputLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop) return;
    const costNum = parseFloat(logCost);
    if (!logItemName.trim() || !logQuantity.trim() || Number.isNaN(costNum) || costNum < 0) {
      setLogError('Enter input description, quantity, and valid cost (₹).');
      return;
    }
    addCropInputLog(selectedCrop.id, {
      date: logDate,
      type: logType,
      itemName: logItemName.trim(),
      quantity: logQuantity.trim(),
      cost: costNum,
    });
    setLogItemName('');
    setLogQuantity('');
    setLogCost('');
    setLogError('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop || !noteText.trim()) return;
    addCropNote(selectedCrop.id, noteText.trim());
    setNoteText('');
  };

  // ============================================================================
  // CROP DETAIL VIEW (Timeline, Input Log, Recharts Expense vs Income, Notes, AI Advisory)
  // ============================================================================
  if (selectedCrop) {
    const currentStageIdx = GROWTH_STAGES.indexOf(selectedCrop.growthStage);
    const totalInputCost = selectedCrop.inputLogs.reduce((s, l) => s + l.cost, 0);

    return (
      <div className="space-y-6">
        {/* Top Back Bar & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedCropId(null)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to My Crops</span>
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono font-semibold text-[#0B4D2E]">
                  {selectedCrop.surveyNumber}
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedCrop.season} Season</span>
                <span aria-hidden="true">·</span>
                <span>{selectedCrop.irrigationType} Irrigation</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                {language === 'ta' ? selectedCrop.cropNameTa : selectedCrop.cropName} —{' '}
                <span className="text-slate-600 font-medium">{selectedCrop.variety}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingCrop(selectedCrop)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Crop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeletingCrop(selectedCrop)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* 1. Growth-Stage Interactive Timeline */}
        <Card
          title="Crop Growth-Stage Timeline"
          subtitle={`Sown on ${selectedCrop.sowingDate} · Expected Harvest: ${selectedCrop.expectedHarvestDate} · Click any stage to update field progress`}
        >
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {GROWTH_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIdx;
              const isCurrent = index === currentStageIdx;
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => updateCrop(selectedCrop.id, { growthStage: stage })}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[#0B4D2E] bg-emerald-50/70 ring-2 ring-[#0B4D2E]/15'
                      : isCompleted
                      ? 'border-emerald-200 bg-white'
                      : 'border-slate-200 bg-slate-50/60 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      STAGE 0{index + 1}
                    </span>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-[#1E8E4F]" />}
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-[#0B4D2E]">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-900 mt-1.5">{stage}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 2. Gemini AI Crop Advisory Panel (with Disclaimer & Fallback) */}
        <Card
          title="Gemini AI Crop-Specific Agronomic Advisory"
          subtitle={`Tailored for ${selectedCrop.cropName} (${selectedCrop.growthStage}) & Perambalur Weather (${todayWeather.tempMax}°C, ${todayWeather.humidity}% RH)`}
          action={
            <button
              type="button"
              onClick={() => fetchCropAdvisory(selectedCrop)}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              <span>{aiLoading ? 'Analyzing...' : 'Refresh AI Tips'}</span>
            </button>
          }
        >
          {aiLoading ? (
            <div className="space-y-3 animate-pulse py-2">
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="h-24 bg-slate-100 rounded-xl" />
                <div className="h-24 bg-slate-100 rounded-xl" />
                <div className="h-24 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ) : (
            aiAdvisory && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#0B4D2E] shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-800 leading-relaxed">
                    <span className="font-semibold text-[#0B4D2E]">
                      Field Condition Assessment ({aiSource === 'gemini' ? 'Live Gemini AI' : 'TNAU Expert Fallback'}):{' '}
                    </span>
                    {aiAdvisory.summary}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-2">
                    <p className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                      <Bug className="w-4 h-4 text-orange-600" />
                      <span>Pest & Disease Alerts</span>
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
                      {aiAdvisory.pestAlerts.map((alert, i) => (
                        <li key={i}>{alert}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-2">
                    <p className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-sky-600" />
                      <span>Irrigation Schedule Advice</span>
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {aiAdvisory.irrigationAdvice}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-2">
                    <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-purple-600" />
                      <span>Stage Nutrient Prescription</span>
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {aiAdvisory.nutrientTip}
                    </p>
                  </div>
                </div>

                {/* Mandatory Disclaimer */}
                <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
                  <strong>Agronomic Disclaimer:</strong> AI-generated crop advisories are for informational decision support based on regional weather and crop stage. Always verify chemical pesticide dosages with your local Block Agricultural Officer or TNAU Krishi Vigyan Kendra (KVK) before field spraying.
                </p>
              </div>
            )
          )}
        </Card>

        {/* 3. Recharts Expense vs Expected-Income Chart + Notes Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card
              title="Cumulative Expense vs. Expected Income Projection (₹)"
              subtitle={`Area: ${selectedCrop.areaAcres} Acres · Projected Yield: ${selectedCrop.expectedYieldQuintals} Quintals`}
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedCrop.financialProjection}
                    margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [
                        `₹${Number(value).toLocaleString('en-IN')}`,
                        '',
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="expense"
                      name="Cumulative Input Expense (₹)"
                      fill="#EA580C"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="expectedIncome"
                      name="Expected Crop Value / Revenue (₹)"
                      fill="#1E8E4F"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Field Notes Diary */}
          <Card
            title="Field Inspection & Crop Notes"
            subtitle="Record observations for VAO / Crop Insurance"
          >
            <form onSubmit={handleAddNote} className="space-y-2.5 mb-4">
              <textarea
                rows={2}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a field observation or harvest note..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#0B4D2E]"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
              >
                Add Field Note
              </button>
            </form>

            <div className="space-y-2.5 max-h-48 overflow-y-auto divide-y divide-slate-100">
              {selectedCrop.notes.map((n, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 text-xs text-slate-700 leading-relaxed flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#0B4D2E] shrink-0 mt-0.5" />
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* 4. Input Log (Fertilizer, Pesticide, Water) */}
        <Card
          title="Crop Input Log (Fertilizer, Pesticide & Irrigation Water)"
          subtitle={`Total Logged Input Cost: ₹${totalInputCost.toLocaleString('en-IN')}`}
        >
          <form
            onSubmit={handleAddInputLog}
            className="grid grid-cols-1 sm:grid-cols-5 gap-3 pb-5 mb-5 border-b border-slate-100 items-end"
          >
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Input Type
              </label>
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value as 'Fertilizer' | 'Pesticide' | 'Water')}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                <option value="Fertilizer">Fertilizer</option>
                <option value="Pesticide">Pesticide</option>
                <option value="Water">Water / Irrigation</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Input / Application Details *
              </label>
              <input
                type="text"
                value={logItemName}
                onChange={(e) => setLogItemName(e.target.value)}
                placeholder="e.g. Neem Coated Urea, Drip Cycle, Pseudomonas"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Quantity & Cost (₹) *
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={logQuantity}
                  onChange={(e) => setLogQuantity(e.target.value)}
                  placeholder="50 kg"
                  className="w-1/2 px-2.5 py-2 text-xs rounded-lg border border-slate-300"
                />
                <input
                  type="number"
                  value={logCost}
                  onChange={(e) => setLogCost(e.target.value)}
                  placeholder="₹ Cost"
                  className="w-1/2 px-2.5 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
              >
                + Log Input
              </button>
            </div>
          </form>
          {logError && <p className="text-xs text-red-600 mb-3">{logError}</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Input Category</th>
                  <th className="py-2.5 px-4">Material / Schedule Description</th>
                  <th className="py-2.5 px-4">Dosage / Quantity</th>
                  <th className="py-2.5 px-4 text-right">Expense (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {selectedCrop.inputLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 tabular-nums text-slate-600">{log.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.type}</td>
                    <td className="py-3 px-4 text-slate-900">
                      <p className="font-medium">{log.itemName}</p>
                      {log.notes && <p className="text-[11px] text-slate-500">{log.notes}</p>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{log.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                      ₹{log.cost.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // MAIN CROP LIST VIEW (Card & Table Toggle, Filters, Search, Add/Edit/Delete)
  // ============================================================================
  const totalArea = crops.reduce((sum, c) => sum + c.areaAcres, 0);
  const totalYield = crops.reduce((sum, c) => sum + c.expectedYieldQuintals, 0);
  const healthyCount = crops.filter((c) => c.healthStatus === 'Healthy').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta'
              ? 'எனது பயிர்கள் மற்றும் இ-அடங்கல் பதிவேடு'
              : 'My Crops & Field Management'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track crop growth stages, fertilizer/water logs, expense projections, and Gemini AI crop advisories
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Card vs Table View Toggle */}
          <div
            role="group"
            aria-label="Toggle view mode"
            className="flex items-center bg-white p-1 rounded-lg border border-slate-200"
          >
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-[#0B4D2E] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#0B4D2E] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setAddStep(1);
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Crop</span>
          </button>
        </div>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Cultivated Area"
          value={`${totalArea.toFixed(2)} Acres`}
          subtext={`${crops.length} Active Plots in e-Adangal`}
          icon={<Sprout className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Healthy Standing Plots"
          value={`${healthyCount} / ${crops.length}`}
          subtext="Monitored via TNAU & AI Advisory"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="Expected Season Output"
          value={`${totalYield} Quintals`}
          subtext="Eligible for Regulated Mandi / DPC"
          icon={<Calendar className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="Precision Drip Plots"
          value={`${crops.filter((c) => c.irrigationType === 'Drip').length} Plots`}
          subtext="Water-Use Efficiency > 85%"
          icon={<Droplets className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Search & Season / Health Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by crop name, variety, or survey number..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Season Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {['All', 'Kharif', 'Rabi', 'Summer'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeasonFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  seasonFilter === s
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s === 'All' ? 'All Seasons' : s}
              </button>
            ))}
          </div>

          {/* Health Status Filter */}
          <select
            aria-label="Filter by health status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
          >
            <option value="All">All Health Status</option>
            <option value="Healthy">Healthy</option>
            <option value="Needs Attention">Needs Attention</option>
            <option value="Pest Alert">Pest Alert</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {filteredCrops.length === 0 ? (
        <Card>
          <EmptyState
            title="No matching crops found"
            description="Reset your season/status filters or add a new crop plot using the multi-step registration form."
            actionLabel="Reset Filters"
            onAction={() => {
              setSearch('');
              setSeasonFilter('All');
              setStatusFilter('All');
            }}
          />
        </Card>
      ) : viewMode === 'card' ? (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCrops.map((crop) => (
            <Card key={crop.id} className="flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold text-[#0B4D2E]">
                        {crop.surveyNumber}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{crop.season} Season</span>
                      <span aria-hidden="true">·</span>
                      <span>{crop.irrigationType}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {language === 'ta' ? crop.cropNameTa : crop.cropName}
                    </h2>
                    <p className="text-xs text-slate-500">{crop.variety}</p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border shrink-0 ${
                      crop.healthStatus === 'Healthy'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : crop.healthStatus === 'Needs Attention'
                        ? 'bg-orange-50 text-orange-800 border-orange-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    {crop.healthStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <div>
                    <p className="text-[11px] text-slate-500">Land Area</p>
                    <p className="font-bold text-slate-900 tabular-nums mt-0.5">
                      {crop.areaAcres.toFixed(2)} Acres
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Growth Stage</p>
                    <p className="font-bold text-[#0B4D2E] mt-0.5">{crop.growthStage}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Sowing Date</p>
                    <p className="font-semibold text-slate-800 tabular-nums mt-0.5">
                      {crop.sowingDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">Est. Harvest</p>
                    <p className="font-semibold text-slate-800 tabular-nums mt-0.5">
                      {crop.expectedHarvestDate}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCropId(crop.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Crop Detail & AI Advisory</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingCrop(crop)}
                    aria-label={`Edit ${crop.cropName}`}
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingCrop(crop)}
                    aria-label={`Delete ${crop.cropName}`}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3.5 px-5">Crop Name & Variety</th>
                  <th className="py-3.5 px-4">Survey No.</th>
                  <th className="py-3.5 px-4 text-right">Area (Acres)</th>
                  <th className="py-3.5 px-4">Sowing Date</th>
                  <th className="py-3.5 px-4">Expected Harvest</th>
                  <th className="py-3.5 px-4">Growth Stage</th>
                  <th className="py-3.5 px-4">Health Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCrops.map((crop) => (
                  <tr key={crop.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <p className="font-semibold text-slate-900">
                        {language === 'ta' ? crop.cropNameTa : crop.cropName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {crop.variety} · {crop.season}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {crop.surveyNumber}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold tabular-nums text-slate-900">
                      {crop.areaAcres.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums text-slate-600">{crop.sowingDate}</td>
                    <td className="py-3.5 px-4 tabular-nums text-slate-600">
                      {crop.expectedHarvestDate}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#0B4D2E]">{crop.growthStage}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                          crop.healthStatus === 'Healthy'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-orange-50 text-orange-800 border-orange-200'
                        }`}
                      >
                        {crop.healthStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedCropId(crop.id)}
                          className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCrop(crop)}
                          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 cursor-pointer"
                          aria-label="Edit crop"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingCrop(crop)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-50 cursor-pointer"
                          aria-label="Delete crop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MULTI-STEP "ADD CROP" MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Crop Plot (3-Step Registration)"
        subtitle="Synchronized with Tamil Nilam Land Registry & Seasonal e-Adangal"
        maxWidthClass="max-w-xl"
      >
        <div className="space-y-5">
          <Stepper
            steps={['1. Crop & Season', '2. Land & Irrigation', '3. Review & Save']}
            currentStep={addStep}
          />

          {addStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Crop Category / Type *
                </label>
                <select
                  value={newCropForm.cropType}
                  onChange={(e) =>
                    setNewCropForm((prev) => ({
                      ...prev,
                      cropType: e.target.value as CropRecord['cropType'],
                    }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Cereals & Millets">Cereals & Millets (Paddy, Maize, Ragi)</option>
                  <option value="Pulses">Pulses (Blackgram, Greengram, Redgram)</option>
                  <option value="Horticulture">Horticulture (Small Onion, Banana, Tomato)</option>
                  <option value="Oilseeds">Oilseeds (Groundnut, Gingelly, Sunflower)</option>
                  <option value="Commercial / Cash Crop">
                    Commercial / Cash Crop (Cotton, Sugarcane, Turmeric)
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Crop Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paddy (Ponni), Groundnut"
                    value={newCropForm.cropName}
                    onChange={(e) =>
                      setNewCropForm((prev) => ({ ...prev, cropName: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                  {formErrors.cropName && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.cropName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seed Variety *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ADT-43 Certified, CO-86032"
                    value={newCropForm.variety}
                    onChange={(e) =>
                      setNewCropForm((prev) => ({ ...prev, variety: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                  />
                  {formErrors.variety && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.variety}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cropping Season (Kharif / Rabi / Summer) *
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['Kharif', 'Rabi', 'Summer'] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setNewCropForm((prev) => ({ ...prev, season: sec }))}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        newCropForm.season === sec
                          ? 'bg-[#0B4D2E] text-white border-[#0B4D2E]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setAddStep(2);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                >
                  Next: Land & Irrigation →
                </button>
              </div>
            </div>
          )}

          {addStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Registered Land Parcel (Patta / Survey No.) *
                </label>
                <select
                  value={newCropForm.surveyNumber}
                  onChange={(e) =>
                    setNewCropForm((prev) => ({ ...prev, surveyNumber: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                >
                  {LAND_PARCELS.map((p) => (
                    <option key={p.survey} value={p.survey}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cultivated Area (Acres) *
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={newCropForm.areaAcres}
                    onChange={(e) =>
                      setNewCropForm((prev) => ({ ...prev, areaAcres: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
                  />
                  {formErrors.areaAcres && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.areaAcres}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Irrigation Type *
                  </label>
                  <select
                    value={newCropForm.irrigationType}
                    onChange={(e) =>
                      setNewCropForm((prev) => ({
                        ...prev,
                        irrigationType: e.target.value as CropRecord['irrigationType'],
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Drip">Drip Irrigation</option>
                    <option value="Canal">Canal Irrigation</option>
                    <option value="Borewell">Solar / EB Borewell</option>
                    <option value="Rainfed">Rainfed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sowing Date *
                  </label>
                  <input
                    type="date"
                    value={newCropForm.sowingDate}
                    onChange={(e) =>
                      setNewCropForm((prev) => ({ ...prev, sowingDate: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
                  />
                  {formErrors.sowingDate && (
                    <p className="text-[11px] text-red-600 mt-1">{formErrors.sowingDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Harvest *
                  </label>
                  <input
                    type="date"
                    value={newCropForm.expectedHarvestDate}
                    onChange={(e) =>
                      setNewCropForm((prev) => ({
                        ...prev,
                        expectedHarvestDate: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
                  />
                  {formErrors.expectedHarvestDate && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {formErrors.expectedHarvestDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Est. Yield (Quintals) *
                  </label>
                  <input
                    type="number"
                    value={newCropForm.expectedYieldQuintals}
                    onChange={(e) =>
                      setNewCropForm((prev) => ({
                        ...prev,
                        expectedYieldQuintals: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
                  />
                  {formErrors.expectedYieldQuintals && (
                    <p className="text-[11px] text-red-600 mt-1">
                      {formErrors.expectedYieldQuintals}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddStep(1)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setAddStep(3);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                >
                  Next: Review Summary →
                </button>
              </div>
            </div>
          )}

          {addStep === 3 && (
            <form onSubmit={handleCreateCrop} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Crop & Type:</span>
                  <span className="font-bold text-slate-900">
                    {newCropForm.cropName} ({newCropForm.cropType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Certified Variety:</span>
                  <span className="font-semibold text-slate-800">{newCropForm.variety}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Season:</span>
                  <span className="font-semibold text-slate-800">{newCropForm.season}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Land Parcel & Area:</span>
                  <span className="font-mono font-semibold text-[#0B4D2E]">
                    {newCropForm.surveyNumber} · {newCropForm.areaAcres} Acres
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Irrigation & Sowing:</span>
                  <span className="tabular-nums text-slate-800">
                    {newCropForm.irrigationType} · Sown {newCropForm.sowingDate}
                  </span>
                </div>
              </div>

              <div className="flex justify-between gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddStep(2)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  ← Edit Details
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
                >
                  Confirm & Register Crop
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* EDIT CROP MODAL */}
      <Modal
        isOpen={!!editingCrop}
        onClose={() => {
          setEditingCrop(null);
          setEditError('');
        }}
        title="Edit Crop Record"
        subtitle={editingCrop ? `Survey No: ${editingCrop.surveyNumber}` : ''}
      >
        {editingCrop && (
          <form onSubmit={handleSaveEditCrop} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Crop Name *
                </label>
                <input
                  type="text"
                  value={editingCrop.cropName}
                  onChange={(e) =>
                    setEditingCrop({ ...editingCrop, cropName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seed Variety *
                </label>
                <input
                  type="text"
                  value={editingCrop.variety}
                  onChange={(e) =>
                    setEditingCrop({ ...editingCrop, variety: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Area (Acres) *
                </label>
                <input
                  type="number"
                  step="0.25"
                  value={editingCrop.areaAcres}
                  onChange={(e) =>
                    setEditingCrop({
                      ...editingCrop,
                      areaAcres: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Growth Stage
                </label>
                <select
                  value={editingCrop.growthStage}
                  onChange={(e) =>
                    setEditingCrop({
                      ...editingCrop,
                      growthStage: e.target.value as CropRecord['growthStage'],
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  {GROWTH_STAGES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Health Status
                </label>
                <select
                  value={editingCrop.healthStatus}
                  onChange={(e) =>
                    setEditingCrop({
                      ...editingCrop,
                      healthStatus: e.target.value as CropRecord['healthStatus'],
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="Pest Alert">Pest Alert</option>
                </select>
              </div>
            </div>

            {editError && <p className="text-xs text-red-600">{editError}</p>}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingCrop(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingCrop}
        onClose={() => setDeletingCrop(null)}
        title="Confirm Crop Removal"
        subtitle="This action will remove the plot from your active seasonal list"
      >
        {deletingCrop && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <p className="font-semibold">
                  Are you sure you want to delete {deletingCrop.cropName} ({deletingCrop.surveyNumber})?
                </p>
                <p className="mt-1 text-red-700">
                  All associated fertilizer/water logs and yield projections for this plot will be removed.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCrop(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCrop(deletingCrop.id);
                  if (selectedCropId === deletingCrop.id) {
                    setSelectedCropId(null);
                  }
                  setDeletingCrop(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
