import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Store,
  Scale,
  Calculator,
  ArrowUpDown,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import {
  Card,
  StatCard,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

export const MarketPricesPage: React.FC = () => {
  const { language, marketPrices, isLoading, hasError, setHasError } = usePortal();
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'modalPrice' | 'arrivalTonnes'>('modalPrice');
  const [selectedCommodityId, setSelectedCommodityId] = useState(marketPrices[0]?.id || 'mkt-301');
  const [quantityQuintals, setQuantityQuintals] = useState<number>(25);

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const districts = ['All', 'Thanjavur', 'Erode', 'Chennai', 'Dindigul', 'Villupuram', 'Coimbatore'];

  const filteredPrices = marketPrices
    .filter((item) => {
      const matchesDistrict = districtFilter === 'All' || item.district === districtFilter;
      const matchesSearch =
        item.commodity.toLowerCase().includes(search.toLowerCase()) ||
        item.commodityTa.includes(search) ||
        item.mandiName.toLowerCase().includes(search.toLowerCase());
      return matchesDistrict && matchesSearch;
    })
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const selectedMarketItem =
    marketPrices.find((m) => m.id === selectedCommodityId) || marketPrices[0];
  const estimatedProceeds = selectedMarketItem
    ? selectedMarketItem.modalPrice * (Number.isNaN(quantityQuintals) ? 0 : quantityQuintals)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          {language === 'ta'
            ? 'தினசரி ஒழுங்குமுறை விற்பனைக்கூடம் மற்றும் உழவர் சந்தை விலைகள்'
            : 'Daily Regulated Market (Mandi) & Uzhavar Sandhai Prices'}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live AGMARKNET & Tamil Nadu State Agricultural Marketing Board modal rates (per Quintal / 100 kg)
        </p>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Thanjavur Paddy (Ponni)"
          value="₹2,465 / Qtl"
          subtext="+₹75 (+3.1%) vs Yesterday"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="Erode GI Turmeric"
          value="₹14,820 / Qtl"
          subtext="+₹470 (+3.3%) Strong Export Demand"
          icon={<Store className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Total Daily Mandi Arrivals"
          value="1,999 Tonnes"
          subtext="Across 7 Monitored TN Market Yards"
          icon={<Scale className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="TNCSC MSP Paddy Floor"
          value="₹2,450 / Qtl"
          subtext="Includes ₹130 State Incentive Bonus"
          icon={<Calculator className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Interactive Farmer Harvest Revenue Estimator */}
      <Card
        title={
          language === 'ta'
            ? 'விளைபொருள் விற்பனை வருவாய் கணிப்பான்'
            : 'Mandi Lot Proceeds & MSP Estimator'
        }
        subtitle="Calculate expected net realization at today's regulated market modal price (0% commission at TN Regulated Markets)"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Commodity & Mandi
            </label>
            <select
              value={selectedCommodityId}
              onChange={(e) => setSelectedCommodityId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0B4D2E]"
            >
              {marketPrices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.commodity} — {item.mandiName} (₹{item.modalPrice}/Qtl)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lot Quantity (in Quintals · 1 Qtl = 100 kg)
            </label>
            <input
              type="number"
              min={1}
              max={5000}
              value={quantityQuintals}
              onChange={(e) => setQuantityQuintals(Math.max(0, Number(e.target.value)))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0B4D2E]"
            />
          </div>

          <div className="p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-emerald-900">Estimated e-NAM Payout</p>
              <p className="text-lg font-bold text-[#0B4D2E] tabular-nums">
                ₹{estimatedProceeds.toLocaleString('en-IN')}
              </p>
            </div>
            <span className="text-[11px] text-emerald-800 font-mono">
              @ ₹{selectedMarketItem?.modalPrice}/Qtl
            </span>
          </div>
        </div>
      </Card>

      {/* Mandi Table with District Filter & Sort */}
      <Card noPadding>
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commodity or market yard (e.g. Ponni, Turmeric, Oddanchatram)..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              {districts.map((dist) => (
                <button
                  key={dist}
                  type="button"
                  onClick={() => setDistrictFilter(dist)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    districtFilter === dist
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {dist}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setSortBy((prev) => (prev === 'modalPrice' ? 'arrivalTonnes' : 'modalPrice'))
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort: {sortBy === 'modalPrice' ? 'Modal Price' : 'Arrival Volume'}</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredPrices.length === 0 ? (
            <EmptyState
              title="No mandi price records found"
              description="Clear district or search filters to view all Tamil Nadu regulated market rates."
              actionLabel="Reset Filters"
              onAction={() => {
                setDistrictFilter('All');
                setSearch('');
              }}
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-6">Commodity & Grade</th>
                  <th className="py-3 px-4">Regulated Market (Mandi)</th>
                  <th className="py-3 px-4 text-right">Min (₹/Qtl)</th>
                  <th className="py-3 px-4 text-right">Max (₹/Qtl)</th>
                  <th className="py-3 px-4 text-right">Modal Price</th>
                  <th className="py-3 px-4 text-right">24h Change</th>
                  <th className="py-3 px-6 text-right">Arrival (MT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPrices.map((item) => {
                  const delta = item.modalPrice - item.previousModalPrice;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-slate-900">
                          {language === 'ta' ? item.commodityTa : item.commodity}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.variety}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-800">
                          {language === 'ta' ? item.mandiNameTa : item.mandiName}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.district} · {item.updatedAt}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                        ₹{item.minPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600">
                        ₹{item.maxPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900">
                        ₹{item.modalPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums">
                        <span
                          className={`inline-flex items-center justify-end gap-1 font-semibold ${
                            delta > 0
                              ? 'text-[#1E8E4F]'
                              : delta < 0
                              ? 'text-red-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {delta > 0 && <TrendingUp className="w-3.5 h-3.5" />}
                          {delta < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                          {delta > 0 ? `+₹${delta}` : delta < 0 ? `-₹${Math.abs(delta)}` : '0'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono tabular-nums text-slate-700">
                        {item.arrivalTonnes} MT
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};
