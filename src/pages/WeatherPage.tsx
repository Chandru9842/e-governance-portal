import React, { useState } from 'react';
import {
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  ThermometerSun,
  Compass,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { Card, StatCard, LoadingSkeleton, ErrorState } from '../components/ui';

export const WeatherPage: React.FC = () => {
  const { language, weatherForecast, isLoading, hasError, setHasError } = usePortal();
  const [selectedZone, setSelectedZone] = useState<'Cauvery Delta (Thanjavur)' | 'Western Zone (Coimbatore)' | 'Southern Zone (Madurai)'>('Cauvery Delta (Thanjavur)');

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const today = weatherForecast[0];
  const fiveDayRainfall = weatherForecast.reduce((sum, d) => sum + d.rainfallMm, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {language === 'ta'
              ? 'மாவட்ட வானிலை முன்னறிவிப்பு மற்றும் வேளாண் ஆலோசனை'
              : 'Agro-Meteorological Forecast & Crop Advisories'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Regional Meteorological Centre (Chennai) & Tamil Nadu Agricultural University (TNAU) Bulletin
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg overflow-x-auto">
          {(
            [
              'Cauvery Delta (Thanjavur)',
              'Western Zone (Coimbatore)',
              'Southern Zone (Madurai)',
            ] as const
          ).map((zone) => (
            <button
              key={zone}
              type="button"
              onClick={() => setSelectedZone(zone)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                selectedZone === zone
                  ? 'bg-[#0B4D2E] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>
      </div>

      {/* 4-Column Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Temperature"
          value={`${today.tempMax}°C / ${today.tempMin}°C`}
          subtext={`${today.condition} · ${selectedZone.split(' ')[0]} Zone`}
          icon={<ThermometerSun className="w-5 h-5" />}
          accentColor="blue"
        />
        <StatCard
          label="5-Day Cumulative Rain"
          value={`${fiveDayRainfall} mm`}
          subtext="Northeast Monsoon Active Surge"
          icon={<CloudRain className="w-5 h-5" />}
          accentColor="green"
        />
        <StatCard
          label="Relative Humidity"
          value={`${today.humidity}% RH`}
          subtext="High Leaf-Wetness Index in Paddy"
          icon={<Droplets className="w-5 h-5" />}
          accentColor="purple"
        />
        <StatCard
          label="Surface Wind Velocity"
          value={`${today.windSpeedKmh} km/h NE`}
          subtext="Safe for Morning Foliar Spraying"
          icon={<Wind className="w-5 h-5" />}
          accentColor="orange"
        />
      </div>

      {/* 5-Day Forecast Cards */}
      <Card
        title={language === 'ta' ? '5-நாள் வானிலை மற்றும் பயிர் பாதுகாப்பு அட்டவணை' : `5-Day Block-Level Weather & Crop Operations Matrix — ${selectedZone}`}
        subtitle="Plan fertilizer top-dressing, pesticide application, and harvesting windows safely"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {weatherForecast.map((day) => {
            const isRainy = day.rainfallMm >= 20;
            return (
              <div
                key={day.date}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-4 ${
                  isRainy
                    ? 'bg-sky-50/60 border-sky-200'
                    : 'bg-slate-50/70 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {language === 'ta' ? day.dayNameTa : day.dayName}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {day.date.slice(5)}
                    </span>
                  </div>

                  <div className="my-3 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-slate-900 tabular-nums">
                        {day.tempMax}°C
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        Low {day.tempMin}°C
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-sky-600">
                      {day.condition === 'Sunny' ? (
                        <Sun className="w-5 h-5 text-amber-500" />
                      ) : day.rainfallMm > 0 ? (
                        <CloudRain className="w-5 h-5 text-sky-600" />
                      ) : (
                        <CloudSun className="w-5 h-5 text-sky-600" />
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1 border-t border-slate-200/70 pt-2.5 tabular-nums">
                    <div className="flex justify-between">
                      <span>Rainfall:</span>
                      <span className="font-semibold text-slate-900">{day.rainfallMm} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Humidity:</span>
                      <span className="font-semibold text-slate-900">{day.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wind:</span>
                      <span className="font-semibold text-slate-900">{day.windSpeedKmh} km/h</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-700 leading-relaxed border-t border-slate-200/70 pt-2.5">
                  {language === 'ta' ? day.advisoryTa : day.advisory}
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reservoir & Canal Discharge Telemetry */}
      <Card
        title="Cauvery Basin Reservoir Storage & Irrigation Release Status"
        subtitle="Daily Water Resources Department (WRD) Engineering Bulletin"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Mettur Dam (Stanley Reservoir)</span>
              <Compass className="w-4 h-4 text-[#0B4D2E]" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              114.80 ft <span className="text-xs font-normal text-slate-500">/ 120.00 ft FRL</span>
            </p>
            <p className="text-xs text-slate-600 tabular-nums">
              Inflow: 18,400 cusecs · Delta Canal Discharge: 12,000 cusecs
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Grand Anicut (Kallanai)</span>
              <Compass className="w-4 h-4 text-sky-700" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              9,850 cusecs <span className="text-xs font-normal text-slate-500">Released</span>
            </p>
            <p className="text-xs text-slate-600 tabular-nums">
              Cauvery: 4,600 · Vennaru: 3,800 · GA Canal: 1,450 cusecs
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900">Bhavanisagar Dam</span>
              <Compass className="w-4 h-4 text-purple-700" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              98.20 ft <span className="text-xs font-normal text-slate-500">/ 105.00 ft FRL</span>
            </p>
            <p className="text-xs text-slate-600 tabular-nums">
              Lower Bhavani Project (LBP) Canal: 2,100 cusecs active
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
