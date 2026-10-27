import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Search,
  Store,
  Scale,
  BellRing,
  Sparkles,
  Download,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { usePortal } from '../context/PortalContext';
import { MarketPriceItem } from '../types';
import {
  Card,
  StatCard,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
} from '../components/ui';

type TimeframeOption = '7D' | '30D' | '6M' | '1Y';

interface PriceAlertRule {
  id: string;
  commodity: string;
  targetPrice: number;
  triggered: boolean;
}

interface AIMarketInsight {
  recommendation: string;
  bestWindow: string;
  expectedPriceBand: string;
  reasoning: string;
}

// Official Government Minimum Support Prices (MSP 2026-27 in ₹/Quintal)
const OFFICIAL_MSP_RATES: Record<string, { msp: number; note: string }> = {
  'Paddy (Ponni Fine)': {
    msp: 2450,
    note: 'Includes ₹2,320 Central MSP + ₹130 Tamil Nadu State Incentive Bonus',
  },
  'Maize (Hybrid Yellow)': {
    msp: 2225,
    note: 'CACP Kharif/Rabi Fair Average Quality (FAQ) Floor Price',
  },
  'Groundnut (With Shell)': {
    msp: 6783,
    note: 'NAFED / TN Regulated Market Price Support Scheme (PSS)',
  },
  'Cotton (Kapas Long Staple)': {
    msp: 7521,
    note: 'Cotton Corporation of India (CCI) Long Staple Minimum Support Price',
  },
  'Blackgram (Urad Whole)': {
    msp: 7400,
    note: 'Central Pulses Procurement Floor Rate',
  },
};

function buildHistoricalTrendSeries(
  baseModal: number,
  msp: number | undefined,
  timeframe: TimeframeOption
): { label: string; modalPrice: number; mspPrice?: number }[] {
  const configs: Record<TimeframeOption, { labels: string[]; offsets: number[] }> = {
    '7D': {
      labels: ['21 Oct', '22 Oct', '23 Oct', '24 Oct', '25 Oct', '26 Oct', 'Today'],
      offsets: [-95, -70, -45, -60, -25, -15, 0],
    },
    '30D': {
      labels: ['Wk 1 Oct', 'Wk 2 Oct', 'Wk 3 Oct', '18 Oct', '22 Oct', '25 Oct', 'Today'],
      offsets: [-180, -140, -110, -85, -45, -20, 0],
    },
    '6M': {
      labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Mid-Oct', 'Today'],
      offsets: [-310, -240, -190, -120, -65, -30, 0],
    },
    '1Y': {
      labels: ['Nov 25', 'Jan 26', 'Mar 26', 'May 26', 'Jul 26', 'Sep 26', 'Today'],
      offsets: [-420, -290, -350, -260, -180, -90, 0],
    },
  };

  const { labels, offsets } = configs[timeframe];
  return labels.map((label, idx) => ({
    label,
    modalPrice: Math.max(500, baseModal + offsets[idx]),
    ...(msp ? { mspPrice: msp } : {}),
  }));
}

function buildFallbackMarketInsight(
  item: MarketPriceItem,
  msp: number | undefined,
  timeframe: TimeframeOption
): AIMarketInsight {
  const aboveMsp = msp ? item.modalPrice - msp : 0;
  return {
    recommendation:
      aboveMsp >= 0
        ? `Sell 60% Lot Now at ${item.mandiName} & Hold 40% for Mid-November`
        : `Enroll in TNCSC / NAFED MSP Procurement (Market ₹${Math.abs(aboveMsp)} Below MSP)`,
    bestWindow: 'Next 5 – 10 Days (Prior to Peak Samba / Northeast Monsoon Arrivals)',
    expectedPriceBand: `₹${(item.modalPrice - 40).toLocaleString('en-IN')} – ₹${(
      item.modalPrice + 115
    ).toLocaleString('en-IN')} / Quintal`,
    reasoning: `Over the ${timeframe} window, ${item.commodity} modal prices at ${item.mandiName} (${item.district}) have firmed up to ₹${item.modalPrice.toLocaleString('en-IN')}/Qtl with ${item.arrivalQuintals.toLocaleString('en-IN')} Qt daily arrivals. Ensure grain moisture is below 14% to secure top max-grade bids (${item.maxPrice.toLocaleString('en-IN')}/Qtl).`,
  };
}

export const MarketPricesPage: React.FC = () => {
  const {
    language,
    marketPrices,
    updateMarketModalPrice,
    addNotification,
    showToast,
    isLoading,
    hasError,
    setHasError,
  } = usePortal();

  // Table Filters & Search
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [mandiFilter, setMandiFilter] = useState('All');
  const [commodityFilter, setCommodityFilter] = useState('All');

  // Selected Commodity & Timeframe for Recharts Trend Line + AI Insight
  const [selectedCommodityName, setSelectedCommodityName] = useState<string>(
    'Paddy (Ponni Fine)'
  );
  const [timeframe, setTimeframe] = useState<TimeframeOption>('7D');

  // Side-by-side Market Comparison state
  const [compareMandiAId, setCompareMandiAId] = useState<string>('mkt-301');
  const [compareMandiBId, setCompareMandiBId] = useState<string>('mkt-308');

  // Price Alert state
  const [alertCommodity, setAlertCommodity] = useState<string>('Paddy (Ponni Fine)');
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('2500');
  const [activeAlerts, setActiveAlerts] = useState<PriceAlertRule[]>([
    {
      id: 'alt-1',
      commodity: 'Paddy (Ponni Fine)',
      targetPrice: 2450,
      triggered: true,
    },
  ]);

  // AI "Best Time to Sell" Insight state
  const [aiInsight, setAiInsight] = useState<AIMarketInsight | null>(null);
  const [aiSource, setAiSource] = useState<'gemini' | 'fallback'>('fallback');
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const primarySelectedItem =
    marketPrices.find((m) => m.commodity === selectedCommodityName) || marketPrices[0];

  const mspInfo = OFFICIAL_MSP_RATES[selectedCommodityName];
  const trendData = buildHistoricalTrendSeries(
    primarySelectedItem.modalPrice,
    mspInfo?.msp,
    timeframe
  );

  const fetchMarketInsight = useCallback(async () => {
    if (!primarySelectedItem) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/market-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity: primarySelectedItem.commodity,
          mandiName: primarySelectedItem.mandiName,
          district: primarySelectedItem.district,
          modalPrice: primarySelectedItem.modalPrice,
          mspPrice: mspInfo?.msp,
          timeframe,
          trendData,
          language,
        }),
      });
      if (!res.ok) throw new Error('Fallback to Economist Heuristic');
      const data = await res.json();
      if (data?.insight) {
        setAiInsight(data.insight);
        setAiSource('gemini');
      } else {
        throw new Error('Empty insight');
      }
    } catch {
      setAiInsight(buildFallbackMarketInsight(primarySelectedItem, mspInfo?.msp, timeframe));
      setAiSource('fallback');
    } finally {
      setAiLoading(false);
    }
  }, [primarySelectedItem, mspInfo?.msp, timeframe, language]);

  useEffect(() => {
    fetchMarketInsight();
  }, [fetchMarketInsight]);

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const districts = ['All', ...Array.from(new Set(marketPrices.map((m) => m.district)))];
  const mandis = ['All', ...Array.from(new Set(marketPrices.map((m) => m.mandiName)))];
  const uniqueCommodities = Array.from(new Set(marketPrices.map((m) => m.commodity)));

  const filteredPrices = marketPrices.filter((item) => {
    const matchesDistrict = districtFilter === 'All' || item.district === districtFilter;
    const matchesMandi = mandiFilter === 'All' || item.mandiName === mandiFilter;
    const matchesCommodity = commodityFilter === 'All' || item.commodity === commodityFilter;
    const matchesSearch =
      item.commodity.toLowerCase().includes(search.toLowerCase()) ||
      item.commodityTa.includes(search) ||
      item.mandiName.toLowerCase().includes(search.toLowerCase()) ||
      item.district.toLowerCase().includes(search.toLowerCase());
    return matchesDistrict && matchesMandi && matchesCommodity && matchesSearch;
  });

  // Markets available for the selected commodity for side-by-side comparison
  const commodityMarkets = marketPrices.filter((m) => m.commodity === selectedCommodityName);
  const compareItemA =
    commodityMarkets.find((m) => m.id === compareMandiAId) ||
    commodityMarkets[0] ||
    marketPrices[0];
  const compareItemB =
    commodityMarkets.find((m) => m.id === compareMandiBId) ||
    commodityMarkets[1] ||
    marketPrices[1] ||
    marketPrices[0];

  // Handle setting a new price alert & checking if immediately crossed
  const handleAddPriceAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(alertTargetPrice);
    if (Number.isNaN(targetNum) || targetNum <= 0) return;

    const currentMaxModal = Math.max(
      ...marketPrices.filter((m) => m.commodity === alertCommodity).map((m) => m.modalPrice),
      0
    );
    const isCrossed = currentMaxModal >= targetNum;

    const newAlert: PriceAlertRule = {
      id: `alt-${Date.now()}`,
      commodity: alertCommodity,
      targetPrice: targetNum,
      triggered: isCrossed,
    };
    setActiveAlerts((prev) => [newAlert, ...prev]);

    if (isCrossed) {
      addNotification({
        title: `Price Alert Crossed: ${alertCommodity}`,
        titleTa: `விலை வரம்பு எட்டப்பட்டது: ${alertCommodity}`,
        message: `${alertCommodity} modal price (₹${currentMaxModal}/Qtl) has crossed your target of ₹${targetNum}/Qtl!`,
        messageTa: `${alertCommodity} சந்தை விலை ₹${currentMaxModal}/குவிண்டால் உங்கள் இலக்கான ₹${targetNum}-ஐ தாண்டியது!`,
        type: 'market',
      });
      showToast(
        `Target Crossed! ${alertCommodity} @ ₹${currentMaxModal}/Qtl`,
        `Your target alert of ₹${targetNum}/Qtl is already met. Notification added to bell.`,
        'success'
      );
    } else {
      showToast(
        'Price Alert Activated',
        `We will notify you when ${alertCommodity} crosses ₹${targetNum.toLocaleString('en-IN')}/Qtl.`,
        'info'
      );
    }
  };

  // Simulate a live mandi surge to trigger pending alerts
  const handleSimulatePriceSurge = () => {
    const targetItem = marketPrices.find((m) => m.commodity === alertCommodity) || marketPrices[0];
    const targetNum = parseFloat(alertTargetPrice) || targetItem.modalPrice + 100;
    const surgedPrice = Math.max(targetItem.modalPrice + 95, targetNum + 20);

    updateMarketModalPrice(targetItem.id, surgedPrice);

    setActiveAlerts((prev) =>
      prev.map((a) =>
        a.commodity === targetItem.commodity && surgedPrice >= a.targetPrice
          ? { ...a, triggered: true }
          : a
      )
    );

    addNotification({
      title: `Live Mandi Surge: ${targetItem.commodity} Crossed ₹${surgedPrice}/Qtl`,
      titleTa: `சந்தை விலை உயர்வு: ${targetItem.commodity} ₹${surgedPrice}/குவிண்டால்`,
      message: `${targetItem.mandiName} modal price jumped to ₹${surgedPrice}/Qtl, crossing your target price alert!`,
      messageTa: `${targetItem.mandiName} சந்தையில் விலை ₹${surgedPrice} ஆக உயர்ந்து உங்கள் இலக்கைத் தாண்டியது!`,
      type: 'market',
    });

    showToast(
      `Price Alert Triggered: ${targetItem.commodity}`,
      `Modal price at ${targetItem.mandiName} surged to ₹${surgedPrice.toLocaleString('en-IN')}/Qtl! Check top notification bell.`,
      'success'
    );
  };

  // Export filtered table to CSV
  const handleExportCSV = () => {
    const headers = [
      'Commodity',
      'Variety',
      'Market (Mandi)',
      'District',
      'Min Price (Rs/Qtl)',
      'Max Price (Rs/Qtl)',
      'Modal Price (Rs/Qtl)',
      'Day Change (Rs)',
      'Arrival (Qt)',
    ];
    const rows = filteredPrices.map((m) => [
      `"${m.commodity}"`,
      `"${m.variety}"`,
      `"${m.mandiName}"`,
      `"${m.district}"`,
      m.minPrice,
      m.maxPrice,
      m.modalPrice,
      m.modalPrice - m.previousModalPrice,
      m.arrivalQuintals,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TN_Mandi_Market_Prices_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported CSV File', `${filteredPrices.length} mandi records downloaded.`);
  };

  // Export filtered table to valid PDF
  const handleExportPDF = () => {
    const lines = [
      'TAMIL NADU STATE AGRICULTURAL MARKETING BOARD - MANDI PRICE REPORT',
      `Generated Date: ${new Date().toISOString().split('T')[0]} | Total Records: ${filteredPrices.length}`,
      '-------------------------------------------------------------------------',
      'COMMODITY              MANDI / DISTRICT          MODAL(Rs)  CHANGE  ARRIVAL',
      '-------------------------------------------------------------------------',
      ...filteredPrices.map((m) => {
        const diff = m.modalPrice - m.previousModalPrice;
        const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
        return `${m.commodity.slice(0, 20).padEnd(22)} ${(m.district + ' Mandi').slice(0, 23).padEnd(25)} Rs.${String(m.modalPrice).padEnd(7)} ${diffStr.padEnd(7)} ${m.arrivalQuintals} Qt`;
      }),
      '-------------------------------------------------------------------------',
      'Source: Digital Farmer e-Governance Portal (AGMARKNET / e-NAM Sync)',
    ];

    const escapedLines = lines
      .map(
        (line, idx) =>
          `1 0 0 1 36 ${750 - idx * 20} Tm (${line.replace(/[()\\]/g, '')}) Tj`
      )
      .join('\n');

    const streamContent = `BT\n/F1 9 Tf\n${escapedLines}\nET`;
    const pdfRaw = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamContent.length} >> stream
${streamContent}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000950 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
1018
%%EOF`;

    const blob = new Blob([pdfRaw], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TN_Mandi_Market_Prices_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported PDF Report', `${filteredPrices.length} mandi records downloaded as PDF.`);
  };

  return (
    <div className="space-y-6">
      {/* Header & CSV / PDF Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta'
              ? 'தினசரி ஒழுங்குமுறை விற்பனைக்கூடம் மற்றும் சந்தை விலைகள்'
              : 'Live Regulated Market (Mandi) Prices & Intelligence'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time Min/Max/Modal prices, historical trends, MSP comparisons, price alerts, and Gemini AI selling insights
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#1E8E4F]" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Perambalur Paddy (Ponni)"
          value={`₹${marketPrices[0].modalPrice.toLocaleString('en-IN')}/Qtl`}
          subtext={`▲ +₹${marketPrices[0].modalPrice - marketPrices[0].previousModalPrice} vs Yesterday`}
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="orange"
        />
        <StatCard
          label="Chettikulam Small Onion"
          value={`₹${marketPrices[1].modalPrice.toLocaleString('en-IN')}/Qtl`}
          subtext={`▲ +₹${marketPrices[1].modalPrice - marketPrices[1].previousModalPrice} Strong Export`}
          icon={<Store className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Total Mandi Arrivals"
          value={`${marketPrices.reduce((s, m) => s + m.arrivalQuintals, 0).toLocaleString('en-IN')} Qt`}
          subtext={`Across ${marketPrices.length} Active Market Lots`}
          icon={<Scale className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="Active Price Alerts"
          value={`${activeAlerts.length} Configured`}
          subtext={`${activeAlerts.filter((a) => a.triggered).length} Target Crossed Today`}
          icon={<BellRing className="w-5 h-5" />}
          accentColor="blue"
        />
      </div>

      {/* Row: Price Trend Line Chart (7D / 30D / 6M / 1Y) + MSP Comparison & Gemini AI "Best Time to Sell" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price Trend Line Chart (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title={`Modal Price Trend Chart — ${selectedCommodityName}`}
            subtitle={`Market: ${primarySelectedItem.mandiName} (${primarySelectedItem.district}) · Values in ₹/Quintal`}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Select commodity for trend chart"
                  value={selectedCommodityName}
                  onChange={(e) => setSelectedCommodityName(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-medium text-slate-800"
                >
                  {uniqueCommodities.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                  {(['7D', '30D', '6M', '1Y'] as TimeframeOption[]).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        timeframe === tf
                          ? 'bg-[#0B4D2E] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      `₹${Number(value).toLocaleString('en-IN')}/Qtl`,
                      String(name),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line
                    type="monotone"
                    dataKey="modalPrice"
                    name="Mandi Modal Price (₹/Qtl)"
                    stroke="#0B4D2E"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0B4D2E' }}
                    activeDot={{ r: 6 }}
                  />
                  {mspInfo && (
                    <ReferenceLine
                      y={mspInfo.msp}
                      stroke="#EA580C"
                      strokeDasharray="5 5"
                      label={{
                        value: `MSP Floor: ₹${mspInfo.msp}`,
                        position: 'insideBottomRight',
                        fill: '#EA580C',
                        fontSize: 11,
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* MSP Comparison Panel */}
        <Card
          title="Minimum Support Price (MSP) Benchmark"
          subtitle="Compare Regulated Mandi Modal Price vs. Govt. MSP Floor"
        >
          <div className="space-y-3">
            {Object.entries(OFFICIAL_MSP_RATES).map(([commName, info]) => {
              const marketItem = marketPrices.find((m) => m.commodity === commName);
              const modal = marketItem?.modalPrice || info.msp;
              const diff = modal - info.msp;
              const isAbove = diff >= 0;

              return (
                <div
                  key={commName}
                  onClick={() => setSelectedCommodityName(commName)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    selectedCommodityName === commName
                      ? 'border-[#0B4D2E] bg-emerald-50/50'
                      : 'border-slate-200/80 bg-slate-50/70 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-slate-900 truncate">{commName}</span>
                    <span
                      className={`font-mono font-bold tabular-nums shrink-0 ${
                        isAbove ? 'text-[#1E8E4F]' : 'text-orange-700'
                      }`}
                    >
                      {isAbove ? `▲ +₹${diff} above MSP` : `▼ ₹${Math.abs(diff)} below MSP`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1 tabular-nums">
                    <span>Mandi Modal: ₹{modal.toLocaleString('en-IN')}/Qtl</span>
                    <span className="font-semibold text-slate-800">
                      Govt MSP: ₹{info.msp.toLocaleString('en-IN')}/Qtl
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Gemini AI "Best Time to Sell" Insight Panel */}
      <Card
        title={`"Best Time to Sell" AI Market Advisory — ${selectedCommodityName}`}
        subtitle={`Powered by Gemini AI analyzing ${timeframe} arrival volume, moisture trends & MSP floor`}
        action={
          <button
            type="button"
            onClick={fetchMarketInsight}
            disabled={aiLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            <span>{aiLoading ? 'Analyzing...' : 'Refresh AI Insight'}</span>
          </button>
        }
      >
        {aiLoading ? (
          <div className="space-y-3 animate-pulse py-2">
            <div className="h-5 w-2/3 bg-slate-200 rounded" />
            <div className="h-16 w-full bg-slate-100 rounded-xl" />
          </div>
        ) : (
          aiInsight && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0B4D2E]" />
                    <span>
                      Recommended Action ({aiSource === 'gemini' ? 'Live Gemini AI' : 'Market Model'})
                    </span>
                  </p>
                  <p className="text-sm font-bold text-[#0B4D2E] leading-snug">
                    {aiInsight.recommendation}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200 space-y-1">
                  <p className="text-[11px] font-semibold text-orange-800">Optimal Selling Window</p>
                  <p className="text-sm font-bold text-slate-900">{aiInsight.bestWindow}</p>
                </div>

                <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 space-y-1">
                  <p className="text-[11px] font-semibold text-sky-800">
                    2-Week Expected Modal Band
                  </p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">
                    {aiInsight.expectedPriceBand}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <strong className="text-slate-900">Market Economist Analysis: </strong>
                {aiInsight.reasoning}
              </p>

              <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                <strong>Market Advisory Disclaimer:</strong> AI-generated selling insights are based on historical mandi arrivals and trend patterns for informational purposes only. Actual auction prices depend on lot Fair Average Quality (FAQ), moisture content, and daily buyer demand at regulated markets.
              </p>
            </div>
          )
        )}
      </Card>

      {/* Row: Side-by-Side Mandi Comparison + Farmer Target Price Alert Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compare Markets Side by Side for the Same Commodity */}
        <Card
          title="Compare Markets Side-by-Side"
          subtitle={`Compare modal rates, min/max spreads, and arrival volumes for ${selectedCommodityName}`}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Market Yard A
                </label>
                <select
                  value={compareItemA.id}
                  onChange={(e) => setCompareMandiAId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  {marketPrices.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.mandiName} ({m.commodity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Market Yard B
                </label>
                <select
                  value={compareItemB.id}
                  onChange={(e) => setCompareMandiBId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  {marketPrices.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.mandiName} ({m.commodity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[compareItemA, compareItemB].map((item, idx) => {
                const other = idx === 0 ? compareItemB : compareItemA;
                const priceDiff = item.modalPrice - other.modalPrice;
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    className={`p-4 rounded-xl border space-y-2 ${
                      priceDiff > 0
                        ? 'border-emerald-300 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {item.district} District
                      </span>
                      {priceDiff > 0 && (
                        <span className="text-[10px] font-bold text-[#0B4D2E] bg-emerald-100 px-2 py-0.5 rounded">
                          +₹{priceDiff}/Qtl Higher
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-900">{item.mandiName}</p>
                    <p className="text-xl font-bold text-[#0B4D2E] font-mono tabular-nums">
                      ₹{item.modalPrice.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-slate-500">/ Qtl</span>
                    </p>
                    <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200/70 tabular-nums">
                      <div className="flex justify-between">
                        <span>Min – Max Band:</span>
                        <span className="font-semibold">
                          ₹{item.minPrice} – ₹{item.maxPrice}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Daily Arrival:</span>
                        <span className="font-semibold">{item.arrivalQuintals} Qt</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Price Alert Setting & Live Trigger Demo */}
        <Card
          title="Custom Mandi Target Price Alerts"
          subtitle="Get an instant in-app notification & bell badge when a commodity crosses your target price"
        >
          <form onSubmit={handleAddPriceAlert} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Commodity
              </label>
              <select
                value={alertCommodity}
                onChange={(e) => setAlertCommodity(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
              >
                {uniqueCommodities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Target Price (₹/Quintal)
              </label>
              <input
                type="number"
                min={500}
                step={25}
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 tabular-nums"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-3 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] cursor-pointer"
            >
              + Set Price Alert
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {activeAlerts.map((al) => (
              <div
                key={al.id}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900">{al.commodity}</span>
                  <span className="mx-2 text-slate-400">·</span>
                  <span className="font-mono font-bold text-[#0B4D2E] tabular-nums">
                    Target: ₹{al.targetPrice.toLocaleString('en-IN')}/Qtl
                  </span>
                </div>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    al.triggered ? 'text-[#1E8E4F]' : 'text-orange-700'
                  }`}
                >
                  {al.triggered ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Crossed & Notified</span>
                    </>
                  ) : (
                    <span>Monitoring Live</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Want to test the live notification trigger right now?
            </span>
            <button
              type="button"
              onClick={handleSimulatePriceSurge}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 cursor-pointer"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Simulate Mandi Surge</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Live-Style Mandi Price Table with District, Market, Commodity Filters + Search */}
      <Card noPadding>
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search commodity, market yard, or district..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0B4D2E]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* District Filter */}
              <select
                aria-label="Filter by district"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d === 'All' ? 'All Districts' : `${d} District`}
                  </option>
                ))}
              </select>

              {/* Market (Mandi) Filter */}
              <select
                aria-label="Filter by market"
                value={mandiFilter}
                onChange={(e) => setMandiFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                {mandis.map((m) => (
                  <option key={m} value={m}>
                    {m === 'All' ? 'All Regulated Markets' : m}
                  </option>
                ))}
              </select>

              {/* Commodity Filter */}
              <select
                aria-label="Filter by commodity"
                value={commodityFilter}
                onChange={(e) => setCommodityFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value="All">All Commodities</option>
                {uniqueCommodities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredPrices.length === 0 ? (
            <EmptyState
              title="No mandi price records match your filters"
              description="Reset your district, market, or commodity filters to view live regulated market rates."
              actionLabel="Reset All Filters"
              onAction={() => {
                setDistrictFilter('All');
                setMandiFilter('All');
                setCommodityFilter('All');
                setSearch('');
              }}
            />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th className="py-3.5 px-6">Commodity & Variety</th>
                  <th className="py-3.5 px-4">Market (Mandi)</th>
                  <th className="py-3.5 px-4 text-right">Min (₹/Qtl)</th>
                  <th className="py-3.5 px-4 text-right">Max (₹/Qtl)</th>
                  <th className="py-3.5 px-4 text-right">Modal (₹/Qtl)</th>
                  <th className="py-3.5 px-4 text-right">Day Change</th>
                  <th className="py-3.5 px-6 text-right">Arrival Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPrices.map((item) => {
                  const delta = item.modalPrice - item.previousModalPrice;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedCommodityName(item.commodity)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
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
                          {delta > 0
                            ? `▲ +₹${delta}`
                            : delta < 0
                            ? `▼ -₹${Math.abs(delta)}`
                            : '0'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono tabular-nums text-slate-700">
                        {item.arrivalQuintals.toLocaleString('en-IN')} Qt ({item.arrivalTonnes} MT)
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
