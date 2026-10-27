import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  ThermometerSun,
  Sunrise,
  Sunset,
  AlertTriangle,
  LocateFixed,
  RefreshCw,
  Sprout,
  ShieldAlert,
  Umbrella,
  WifiOff,
  CheckCircle2,
  Gauge,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { usePortal } from '../context/PortalContext';
import { Card, LoadingSkeleton, ErrorState } from '../components/ui';

interface TNDistrictCoord {
  name: string;
  nameTa: string;
  lat: number;
  lon: number;
  normal30DayMm: number;
  alertType: 'heavy_rain' | 'cyclone' | 'heatwave';
  alertTitle: string;
  alertTitleTa: string;
  alertMessage: string;
  alertMessageTa: string;
}

const TN_DISTRICTS: TNDistrictCoord[] = [
  {
    name: 'Perambalur',
    nameTa: 'பெரம்பலூர்',
    lat: 11.2342,
    lon: 78.8807,
    normal30DayMm: 185,
    alertType: 'heavy_rain',
    alertTitle: 'Orange Alert — Heavy Northeast Monsoon Rainfall Expected',
    alertTitleTa: 'ஆரஞ்சு எச்சரிக்கை — வடகிழக்கு பருவமழை கனமழை வாய்ப்பு',
    alertMessage:
      'IMD Chennai warns of 55–85 mm rainfall over Perambalur & Ariyalur in the next 48 hours. Clear drainage bunds in Samba paddy and Chettikulam small onion plots.',
    alertMessageTa:
      'அடுத்த 48 மணி நேரத்தில் பெரம்பலூர் மற்றும் அரியலூரில் 55-85 மி.மீ மழை பெய்ய வாய்ப்புள்ளது. சம்பா நெல் மற்றும் சின்ன வெங்காய வயல்களில் வடிகால் வசதியை உறுதி செய்யவும்.',
  },
  {
    name: 'Thanjavur',
    nameTa: 'தஞ்சாவூர்',
    lat: 10.787,
    lon: 79.1378,
    normal30DayMm: 210,
    alertType: 'heavy_rain',
    alertTitle: 'Orange Alert — Cauvery Delta Intensive Rain Spell',
    alertTitleTa: 'ஆரஞ்சு எச்சரிக்கை — காவிரி டெல்டா கனமழை எச்சரிக்கை',
    alertMessage:
      'Heavy rain likely across Cauvery Delta blocks. Postpone top-dressing of Urea and provide propping support to mature banana plantations.',
    alertMessageTa:
      'காவிரி டெல்டா பகுதிகளில் கனமழை வாய்ப்பு. யூரியா மேலுரம் இடுவதைத் தவிர்த்து, வாழை மரங்களுக்கு முட்டுக் கொடுக்கவும்.',
  },
  {
    name: 'Coimbatore',
    nameTa: 'கோயம்புத்தூர்',
    lat: 11.0168,
    lon: 76.9558,
    normal30DayMm: 145,
    alertType: 'heavy_rain',
    alertTitle: 'Yellow Advisory — Moderate Showers & Gusty Surface Winds',
    alertTitleTa: 'மஞ்சள் எச்சரிக்கை — மிதமான மழை மற்றும் பலத்த காற்று',
    alertMessage:
      'Surface winds of 22–28 km/h expected along Western Ghats foothill blocks. Avoid pesticide spraying during afternoon gusty hours.',
    alertMessageTa:
      'மணிக்கு 22-28 கி.மீ வேகத்தில் காற்று வீசக்கூடும். மதிய வேளையில் பூச்சிக்கொல்லி தெளிப்பதைத் தவிர்க்கவும்.',
  },
  {
    name: 'Madurai',
    nameTa: 'மதுரை',
    lat: 9.9252,
    lon: 78.1198,
    normal30DayMm: 160,
    alertType: 'heatwave',
    alertTitle: 'High Daytime Heat & UV Evapotranspiration Advisory',
    alertTitleTa: 'அதிக பகல்நேர வெப்பம் மற்றும் புற ஊதா கதிர்வீச்சு எச்சரிக்கை',
    alertMessage:
      'Afternoon peak UV index reaches 8.5 with elevated soil moisture loss. Irrigate orchard and vegetable plots during early morning or evening hours.',
    alertMessageTa:
      'மதிய வேளையில் அதிக வெப்பம் நிலவும். தோட்டக்கலை மற்றும் காய்கறி பயிர்களுக்கு அதிகாலை அல்லது மாலை வேளையில் நீர் பாய்ச்சவும்.',
  },
  {
    name: 'Cuddalore',
    nameTa: 'கடலூர்',
    lat: 11.748,
    lon: 79.7714,
    normal30DayMm: 265,
    alertType: 'cyclone',
    alertTitle: 'Red Cyclone / Deep Depression Coastal Watch (Bay of Bengal)',
    alertTitleTa: 'சிவப்பு புயல் எச்சரிக்கை — வங்கக்கடல் காற்றழுத்த தாழ்வு மண்டலம்',
    alertMessage:
      'Squally winds 45–55 km/h and heavy coastal downpour forecast. Harvest mature coastal paddy plots immediately and secure farm machinery.',
    alertMessageTa:
      'கடலோரப் பகுதிகளில் 45-55 கி.மீ வேகத்தில் பலத்த காற்று மற்றும் கனமழை வாய்ப்பு. முதிர்ந்த நெற்கதிர்களை உடனடியாக அறுவடை செய்யவும்.',
  },
  {
    name: 'Salem',
    nameTa: 'சேலம்',
    lat: 11.6643,
    lon: 78.146,
    normal30DayMm: 155,
    alertType: 'heavy_rain',
    alertTitle: 'Yellow Alert — Isolated Thunderstorms & Lightning',
    alertTitleTa: 'மஞ்சள் எச்சரிக்கை — இடி மின்னலுடன் கூடிய மழை',
    alertMessage:
      'Isolated evening thundershowers forecast. Ensure proper earthing for solar pump controllers and store harvested tapioca/maize under tarpaulins.',
    alertMessageTa:
      'மாலை நேரங்களில் இடி மின்னலுடன் மழை பெய்ய வாய்ப்புள்ளது. அறுவடை செய்த மக்காச்சோளத்தை தார்பாய் கொண்டு மூடி பாதுகாக்கவும்.',
  },
  {
    name: 'Erode',
    nameTa: 'ஈரோடு',
    lat: 11.341,
    lon: 77.7172,
    normal30DayMm: 140,
    alertType: 'heatwave',
    alertTitle: 'High Daytime Temperature & Turmeric Curing Advisory',
    alertTitleTa: 'பகல்நேர வெப்பநிலை மற்றும் மஞ்சள் உலர்த்தும் ஆலோசனை',
    alertMessage:
      'Clear afternoon sunshine with UV index 7.8. Favorable for curing and drying boiled turmeric fingers on clean drying yards.',
    alertMessageTa:
      'வெயில் வானிலை நிலவுவதால் மஞ்சள் விரலிகளை உலர்த்த உகந்த நாள்.',
  },
  {
    name: 'Tirunelveli',
    nameTa: 'திருநெல்வேலி',
    lat: 8.7139,
    lon: 77.7567,
    normal30DayMm: 195,
    alertType: 'heavy_rain',
    alertTitle: 'Orange Alert — Tamirabarani Basin Monsoon Inflow',
    alertTitleTa: 'ஆரஞ்சு எச்சரிக்கை — தாமிரபரணி வடிநிலப் பகுதியில் கனமழை',
    alertMessage:
      'Steady monsoon showers across Papanasam and Manimuthar catchments. Regulate canal sluices for Pishanam paddy cultivation.',
    alertMessageTa:
      'தாமிரபரணி நீர்ப்பிடிப்பு பகுதிகளில் தொடர் மழை. பிசான பருவ நெல் வயல்களில் நீர் மட்டத்தை சீராக பராமரிக்கவும்.',
  },
  {
    name: 'Dindigul',
    nameTa: 'திண்டுக்கல்',
    lat: 10.3673,
    lon: 77.9803,
    normal30DayMm: 170,
    alertType: 'heavy_rain',
    alertTitle: 'Yellow Advisory — Oddanchatram Vegetable Belt Showers & Kodaikanal Chill',
    alertTitleTa: 'மஞ்சள் எச்சரிக்கை — மிதமான மழை மற்றும் குளிர் எச்சரிக்கை',
    alertMessage:
      'Moderate showers in plains and night-time chill (11°C) in upper hill blocks. Apply foliar potash to protect hill garlic and potato from cold stress.',
    alertMessageTa:
      'சமவெளிப் பகுதிகளில் மிதமான மழையும் மலைப்பகுதிகளில் இரவு குளிரும் நிலவும்.',
  },
  {
    name: 'Villupuram',
    nameTa: 'விழுப்புரம்',
    lat: 11.9401,
    lon: 79.4861,
    normal30DayMm: 235,
    alertType: 'cyclone',
    alertTitle: 'Red Coastal Cyclonic Trough Warning',
    alertTitleTa: 'சிவப்பு எச்சரிக்கை — கடலோர காற்றழுத்த தாழ்வு எச்சரிக்கை',
    alertMessage:
      'Intense rain bands moving inland from Puducherry–Villupuram coast. Drain excess water from groundnut and sugarcane fields immediately.',
    alertMessageTa:
      'கடலோரப் பகுதிகளில் பலத்த மழை வாய்ப்பு. நிலக்கடலை மற்றும் கரும்பு வயல்களில் தேங்கும் நீரை உடனடியாக வெளியேற்றவும்.',
  },
];

interface LiveWeatherState {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainfallProb: number;
  uvIndex: number;
  sunrise: string;
  sunset: string;
  conditionLabel: string;
  hourly24: { time: string; temp: number; rainProb: number }[];
  daily7: {
    date: string;
    dayLabel: string;
    tempMax: number;
    tempMin: number;
    rainProb: number;
    rainMm: number;
    windMax: number;
  }[];
  rainfall30Days: { day: string; actualMm: number; normalMm: number }[];
}

function buildFallbackWeatherState(district: TNDistrictCoord): LiveWeatherState {
  const baseTemp =
    district.name === 'Madurai' || district.name === 'Erode'
      ? 33
      : district.name === 'Coimbatore' || district.name === 'Dindigul'
      ? 28
      : 29;

  // 24-hour hourly chart data (all 24 hours)
  const hourly24 = Array.from({ length: 24 }, (_, hr) => {
    const label = `${String(hr).padStart(2, '0')}:00`;
    const curve = Math.sin(((hr - 6) / 24) * Math.PI * 2);
    const rainProb =
      district.alertType === 'cyclone'
        ? 75 + (hr % 4) * 5
        : hr >= 14 && hr <= 21
        ? 64
        : 24;
    return {
      time: label,
      temp: Math.round(baseTemp + curve * 3.8),
      rainProb,
    };
  });

  const dayNames = ['Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'];
  const daily7 = dayNames.map((d, idx) => ({
    date: `Oct ${27 + idx}`,
    dayLabel: idx === 0 ? 'Today' : d,
    tempMax: baseTemp + (idx % 2 === 0 ? 1 : -1),
    tempMin: baseTemp - 6,
    rainProb:
      district.alertType === 'cyclone'
        ? 88
        : idx === 2
        ? 85
        : idx === 1
        ? 65
        : 35,
    rainMm:
      district.alertType === 'cyclone'
        ? 68
        : idx === 2
        ? 54
        : idx === 1
        ? 22
        : 6,
    windMax: district.alertType === 'cyclone' ? 42 + idx * 2 : 14 + idx * 2,
  }));

  const dailyNormal = Number((district.normal30DayMm / 30).toFixed(1));
  const rainfall30Days = Array.from({ length: 30 }, (_, idx) => {
    const dayNum = idx + 1;
    const actual =
      idx === 14 || idx === 22
        ? Math.round(dailyNormal * 4.2)
        : idx % 4 === 0
        ? Math.round(dailyNormal * 1.8)
        : idx % 2 === 0
        ? Math.round(dailyNormal * 0.6)
        : 0;
    return {
      day: `D${dayNum}`,
      actualMm: actual,
      normalMm: Math.round(dailyNormal),
    };
  });

  return {
    temp: baseTemp,
    feelsLike: baseTemp + 3,
    humidity: district.alertType === 'heatwave' ? 62 : 78,
    windSpeed: district.alertType === 'cyclone' ? 38 : 15,
    rainfallProb: district.alertType === 'cyclone' ? 88 : 42,
    uvIndex: district.alertType === 'heatwave' ? 8.4 : 6.5,
    sunrise: '06:04 AM',
    sunset: '05:52 PM',
    conditionLabel:
      district.alertType === 'cyclone'
        ? 'Squally Rain · Cyclone Watch'
        : district.alertType === 'heatwave'
        ? 'Warm & Sunny · High UV'
        : 'Partly Cloudy · Monsoon Active',
    hourly24,
    daily7,
    rainfall30Days,
  };
}

export const WeatherPage: React.FC = () => {
  const { language, showToast, isLoading, hasError, setHasError } = usePortal();

  const [selectedDistrict, setSelectedDistrict] = useState<TNDistrictCoord>(TN_DISTRICTS[0]);
  const [customCoords, setCustomCoords] = useState<{
    lat: number;
    lon: number;
    label: string;
  } | null>(null);
  const [weatherData, setWeatherData] = useState<LiveWeatherState>(() =>
    buildFallbackWeatherState(TN_DISTRICTS[0])
  );
  const [apiStatus, setApiStatus] = useState<'live' | 'offline-fallback' | 'loading'>('loading');
  const [forceOfflineMode, setForceOfflineMode] = useState<boolean>(false);
  const [overrideAlertType, setOverrideAlertType] = useState<
    TNDistrictCoord['alertType'] | null
  >(null);

  const fetchOpenMeteoWeather = useCallback(
    async (
      lat: number,
      lon: number,
      fallbackDistrict: TNDistrictCoord,
      simulateOffline: boolean
    ) => {
      if (simulateOffline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setWeatherData(buildFallbackWeatherState(fallbackDistrict));
        setApiStatus('offline-fallback');
        return;
      }

      setApiStatus('loading');
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,uv_index&hourly=temperature_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&past_days=30&forecast_days=7&timezone=auto`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
        const json = await res.json();

        const current = json.current || {};
        const daily = json.daily || {};
        const hourly = json.hourly || {};

        // With past_days=30 and forecast_days=7, daily.time has 37 entries.
        const totalDailyLen = daily.time?.length || 0;
        const forecastStartIdx = Math.max(0, totalDailyLen - 7);

        // 7-Day Forecast Cards
        const daily7 = (daily.time || [])
          .slice(forecastStartIdx, forecastStartIdx + 7)
          .map((dateStr: string, idx: number) => {
            const i = forecastStartIdx + idx;
            const dObj = new Date(dateStr);
            const dayLabel =
              idx === 0
                ? 'Today'
                : dObj.toLocaleDateString('en-US', { weekday: 'short' });
            return {
              date: dateStr.slice(5),
              dayLabel,
              tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 30),
              tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 23),
              rainProb: Math.round(daily.precipitation_probability_max?.[i] ?? 35),
              rainMm: Math.round(daily.precipitation_sum?.[i] ?? 5),
              windMax: Math.round(daily.wind_speed_10m_max?.[i] ?? 14),
            };
          });

        // 24-Hour Hourly Chart (from today's 00:00 to 23:00)
        const hourlyStartIdx = Math.max(0, forecastStartIdx * 24);
        const hourly24 = (hourly.time || [])
          .slice(hourlyStartIdx, hourlyStartIdx + 24)
          .map((tStr: string, idx: number) => {
            const realIdx = hourlyStartIdx + idx;
            return {
              time: tStr.split('T')[1]?.slice(0, 5) || `${String(idx).padStart(2, '0')}:00`,
              temp: Math.round(hourly.temperature_2m?.[realIdx] ?? 28),
              rainProb: Math.round(hourly.precipitation_probability?.[realIdx] ?? 30),
            };
          });

        // Last 30 Days Rainfall History vs Normal
        const dailyNormal = Math.round(fallbackDistrict.normal30DayMm / 30);
        const rainfall30Days = (daily.time || [])
          .slice(Math.max(0, forecastStartIdx - 30), forecastStartIdx)
          .map((dateStr: string, idx: number) => {
            const actual = Math.round(daily.precipitation_sum?.[idx] ?? 4);
            return {
              day: dateStr.slice(5),
              actualMm: actual,
              normalMm: dailyNormal,
            };
          });

        const sunriseRaw = daily.sunrise?.[forecastStartIdx] || '2026-10-27T06:04';
        const sunsetRaw = daily.sunset?.[forecastStartIdx] || '2026-10-27T17:52';

        setWeatherData({
          temp: Math.round(current.temperature_2m ?? 29),
          feelsLike: Math.round(current.apparent_temperature ?? 32),
          humidity: Math.round(current.relative_humidity_2m ?? 74),
          windSpeed: Math.round(current.wind_speed_10m ?? 14),
          rainfallProb: daily7[0]?.rainProb ?? 35,
          uvIndex: Number(
            (current.uv_index ?? daily.uv_index_max?.[forecastStartIdx] ?? 6.5).toFixed(1)
          ),
          sunrise: `${sunriseRaw.split('T')[1]?.slice(0, 5) || '06:04'} AM`,
          sunset: `${sunsetRaw.split('T')[1]?.slice(0, 5) || '17:52'} PM`,
          conditionLabel:
            (daily7[0]?.rainProb ?? 0) >= 60
              ? 'Rain Showers Likely · Open-Meteo'
              : 'Partly Cloudy · Open-Meteo Live',
          hourly24:
            hourly24.length > 0
              ? hourly24
              : buildFallbackWeatherState(fallbackDistrict).hourly24,
          daily7:
            daily7.length > 0 ? daily7 : buildFallbackWeatherState(fallbackDistrict).daily7,
          rainfall30Days:
            rainfall30Days.length > 0
              ? rainfall30Days
              : buildFallbackWeatherState(fallbackDistrict).rainfall30Days,
        });
        setApiStatus('live');
      } catch {
        setWeatherData(buildFallbackWeatherState(fallbackDistrict));
        setApiStatus('offline-fallback');
      }
    },
    []
  );

  useEffect(() => {
    const lat = customCoords ? customCoords.lat : selectedDistrict.lat;
    const lon = customCoords ? customCoords.lon : selectedDistrict.lon;
    fetchOpenMeteoWeather(lat, lon, selectedDistrict, forceOfflineMode);
  }, [selectedDistrict, customCoords, forceOfflineMode, fetchOpenMeteoWeather]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      showToast(
        'Geolocation Unavailable',
        'Your browser does not support GPS geolocation. Using Perambalur district coordinates.',
        'warning'
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCustomCoords({
          lat: Number(latitude.toFixed(4)),
          lon: Number(longitude.toFixed(4)),
          label: `My GPS (${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E)`,
        });
        showToast(
          'GPS Coordinates Locked',
          `Fetching live Open-Meteo weather for ${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`
        );
      },
      () => {
        setCustomCoords({
          lat: 11.2342,
          lon: 78.8807,
          label: 'Perambalur GPS Fallback (11.23°N, 78.88°E)',
        });
        showToast(
          'Location Permission Blocked in Preview',
          'Switched to Perambalur Block GPS coordinates (11.23°N, 78.88°E).',
          'info'
        );
      },
      { timeout: 6000 }
    );
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (hasError) return <ErrorState onRetry={() => setHasError(false)} />;

  const activeAlertCategory = overrideAlertType || selectedDistrict.alertType;

  // Severity Alert Banner styling based on alertType
  const severityStyles: Record<
    TNDistrictCoord['alertType'],
    {
      bg: string;
      border: string;
      badge: string;
      text: string;
      label: string;
    }
  > = {
    cyclone: {
      bg: 'bg-red-950 text-white',
      border: 'border-red-700',
      badge: 'bg-red-600 text-white',
      text: 'text-red-100',
      label: 'RED SEVERITY · CYCLONE WATCH',
    },
    heavy_rain: {
      bg: 'bg-amber-950 text-white',
      border: 'border-amber-700',
      badge: 'bg-orange-500 text-white',
      text: 'text-amber-100',
      label: 'ORANGE SEVERITY · HEAVY RAIN ALERT',
    },
    heatwave: {
      bg: 'bg-orange-950 text-white',
      border: 'border-orange-700',
      badge: 'bg-amber-400 text-slate-950',
      text: 'text-orange-100',
      label: 'YELLOW SEVERITY · HEATWAVE & HIGH UV',
    },
  };

  const activeAlertStyle = severityStyles[activeAlertCategory];

  // Agri-Specific Decision Rules derived from current weather
  const sprayingSuitable = weatherData.windSpeed < 18 && weatherData.rainfallProb < 50;
  const total30DayActual = weatherData.rainfall30Days.reduce((s, r) => s + r.actualMm, 0);
  const total30DayNormal = weatherData.rainfall30Days.reduce((s, r) => s + r.normalMm, 0);
  const rainfallDeparturePct =
    total30DayNormal > 0
      ? Math.round(((total30DayActual - total30DayNormal) / total30DayNormal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header + Tamil Nadu District Selector + Use My Location + Offline Resilience Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Open-Meteo Agro-Meteorological Service (No API Key Required)</span>
            <span aria-hidden="true">·</span>
            {apiStatus === 'live' ? (
              <span className="inline-flex items-center gap-1 font-semibold text-[#1E8E4F]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Live Open-Meteo Telemetry</span>
              </span>
            ) : apiStatus === 'loading' ? (
              <span className="font-semibold text-sky-700">Fetching Live Forecast...</span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-orange-700">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline Resilience Fallback Active</span>
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">
            {language === 'ta'
              ? 'வானிலை தகவல் மற்றும் வேளாண் வானிலை ஆலோசனை'
              : 'Weather Information & Agricultural Advisories'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tamil Nadu District Selector */}
          <select
            aria-label="Select Tamil Nadu District"
            value={selectedDistrict.name}
            onChange={(e) => {
              const found =
                TN_DISTRICTS.find((d) => d.name === e.target.value) || TN_DISTRICTS[0];
              setCustomCoords(null);
              setOverrideAlertType(null);
              setSelectedDistrict(found);
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:border-[#0B4D2E]"
          >
            {TN_DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                {language === 'ta' ? `${d.nameTa} (${d.name})` : `${d.name}, Tamil Nadu`}
              </option>
            ))}
          </select>

          {/* Use My Location Button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#0B4D2E] text-white hover:bg-[#1E8E4F] transition-colors cursor-pointer whitespace-nowrap"
          >
            <LocateFixed className="w-3.5 h-3.5" />
            <span>Use My Location</span>
          </button>

          {/* Offline Fallback Mode Test Toggle */}
          <button
            type="button"
            onClick={() => setForceOfflineMode((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              forceOfflineMode
                ? 'bg-orange-600 text-white border-orange-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>{forceOfflineMode ? 'Restore Live API' : 'Test Offline Mode'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() =>
              fetchOpenMeteoWeather(
                customCoords ? customCoords.lat : selectedDistrict.lat,
                customCoords ? customCoords.lon : selectedDistrict.lon,
                selectedDistrict,
                forceOfflineMode
              )
            }
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
            aria-label="Refresh weather data"
          >
            <RefreshCw className={`w-4 h-4 ${apiStatus === 'loading' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Severe-Weather Alert Banner (Heavy Rain, Cyclone, Heatwave) with Severity Colours */}
      <div
        className={`rounded-xl p-4 sm:p-5 border ${activeAlertStyle.bg} ${activeAlertStyle.border} flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs`}
      >
        <div className="flex items-start gap-3.5">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${activeAlertStyle.badge}`}
              >
                {activeAlertStyle.label}
              </span>
              <h2 className="text-xs sm:text-sm font-bold">
                {language === 'ta' ? selectedDistrict.alertTitleTa : selectedDistrict.alertTitle}
              </h2>
            </div>
            <p className={`text-xs mt-1 leading-relaxed ${activeAlertStyle.text}`}>
              {language === 'ta'
                ? selectedDistrict.alertMessageTa
                : selectedDistrict.alertMessage}
            </p>
          </div>
        </div>

        {/* Severity Preview Switcher so user can inspect Heavy Rain, Cyclone, and Heatwave colour states */}
        <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
          {(
            [
              { type: 'heavy_rain', label: 'Heavy Rain' },
              { type: 'cyclone', label: 'Cyclone' },
              { type: 'heatwave', label: 'Heatwave' },
            ] as const
          ).map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => setOverrideAlertType(item.type)}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                activeAlertCategory === item.type
                  ? 'bg-white text-slate-900'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Conditions: Temperature, Feels-Like, Humidity, Wind, Rainfall Probability, UV Index, Sunrise/Sunset */}
      <Card
        title={`Current Conditions — ${
          customCoords ? customCoords.label : `${selectedDistrict.name}, Tamil Nadu`
        }`}
        subtitle={`Latitude ${
          customCoords ? customCoords.lat : selectedDistrict.lat
        }°N, Longitude ${customCoords ? customCoords.lon : selectedDistrict.lon}°E · ${
          weatherData.conditionLabel
        }`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* 1. Temperature */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-1">
            <div className="flex items-center justify-between text-sky-700">
              <span className="text-[11px] font-semibold">Temperature</span>
              <ThermometerSun className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">{weatherData.temp}°C</p>
            <p className="text-[11px] text-slate-500">Ambient Air</p>
          </div>

          {/* 2. Feels-Like */}
          <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-1">
            <div className="flex items-center justify-between text-orange-700">
              <span className="text-[11px] font-semibold">Feels-Like</span>
              <Sun className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {weatherData.feelsLike}°C
            </p>
            <p className="text-[11px] text-slate-500">Heat Index</p>
          </div>

          {/* 3. Humidity */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
            <div className="flex items-center justify-between text-[#0B4D2E]">
              <span className="text-[11px] font-semibold">Humidity</span>
              <Droplets className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {weatherData.humidity}%
            </p>
            <p className="text-[11px] text-slate-500">Relative RH</p>
          </div>

          {/* 4. Wind Speed */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="flex items-center justify-between text-slate-700">
              <span className="text-[11px] font-semibold">Wind Speed</span>
              <Wind className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {weatherData.windSpeed} <span className="text-xs font-normal">km/h</span>
            </p>
            <p className="text-[11px] text-slate-500">10m Surface</p>
          </div>

          {/* 5. Rainfall Probability */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-1">
            <div className="flex items-center justify-between text-sky-700">
              <span className="text-[11px] font-semibold">Rainfall Prob.</span>
              <CloudRain className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {weatherData.rainfallProb}%
            </p>
            <p className="text-[11px] text-slate-500">Precip Chance</p>
          </div>

          {/* 6. UV Index */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-1">
            <div className="flex items-center justify-between text-purple-700">
              <span className="text-[11px] font-semibold">UV Index</span>
              <Gauge className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">{weatherData.uvIndex}</p>
            <p className="text-[11px] text-slate-500">
              {weatherData.uvIndex >= 7 ? 'High Solar UV' : 'Moderate UV'}
            </p>
          </div>

          {/* 7. Sunrise / Sunset */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[11px] font-semibold">Sun Window</span>
              <Sunrise className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 tabular-nums">
              ↑ {weatherData.sunrise}
            </p>
            <p className="text-xs font-semibold text-slate-600 tabular-nums flex items-center gap-1">
              <Sunset className="w-3 h-3 text-orange-600" />
              <span>↓ {weatherData.sunset}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Agri-Specific Advisories: Spraying Suitability, Irrigation Recommendation, Sowing Window, Frost/Heat Stress Warnings */}
      <Card
        title="Agri-Specific Field Operations Advisories"
        subtitle={`Real-time agronomic guidance for ${selectedDistrict.name} derived from wind speed, rainfall probability & thermal stress`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Spraying Suitability */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">1. Spraying Suitability</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  sprayingSuitable
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {sprayingSuitable ? 'Suitable Now' : 'Not Recommended'}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {sprayingSuitable
                ? `Surface wind is ${weatherData.windSpeed} km/h (< 18 km/h drift limit) and rain chance is ${weatherData.rainfallProb}%. Safe for morning foliar nutrient or neem oil spraying.`
                : `High rain probability (${weatherData.rainfallProb}%) or gusty wind (${weatherData.windSpeed} km/h). Delay pesticide/herbicide spraying to prevent chemical wash-off and drift.`}
            </p>
          </div>

          {/* 2. Irrigation Recommendation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">2. Irrigation Recommendation</span>
              <Umbrella className="w-4 h-4 text-sky-600 shrink-0" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {weatherData.rainfallProb >= 50
                ? 'Suspend canal and borewell irrigation for the next 48 hours. Keep drainage bunds clear in Samba paddy and Chettikulam onion beds.'
                : 'Maintain 2.5 cm shallow wetting in Paddy and run drip fertigation for 90 minutes during early morning hours to minimize evaporation.'}
            </p>
          </div>

          {/* 3. Sowing Window */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">3. Sowing Window</span>
              <Sprout className="w-4 h-4 text-[#1E8E4F] shrink-0" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Topsoil moisture ({weatherData.humidity}% RH) is favorable for Rabi pulse broadcasting (Blackgram VBN-8) and raised-bed Small Onion bulb planting. Treat seeds with Trichoderma viride @ 4g/kg before sowing.
            </p>
          </div>

          {/* 4. Frost / Heat Stress Warnings */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900">4. Frost / Heat Stress Warning</span>
              <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0" />
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {weatherData.feelsLike >= 34 || weatherData.uvIndex >= 7.5
                ? `High Heat & UV Alert (Feels like ${weatherData.feelsLike}°C, UV ${weatherData.uvIndex}): Apply 0.5% Potassium Chloride foliar spray or organic mulching to prevent flower drop.`
                : selectedDistrict.name === 'Dindigul'
                ? 'Night-time chill expected in high-elevation blocks (11–13°C). Provide light evening mist irrigation to protect hill vegetables from cold injury.'
                : `No frost or extreme heat stress detected (${weatherData.temp}°C). Monitor high night humidity (${weatherData.humidity}%) for paddy leaf blast.`}
            </p>
          </div>
        </div>
      </Card>

      {/* 7-Day Forecast Cards */}
      <Card
        title={`7-Day Extended Forecast — ${selectedDistrict.name}, Tamil Nadu`}
        subtitle="Daily Max/Min temperature, rainfall probability (%), expected precipitation (mm), and peak wind speed"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {weatherData.daily7.map((day) => {
            const isHeavyRain = day.rainProb >= 65;
            return (
              <div
                key={day.date}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                  isHeavyRain
                    ? 'bg-sky-50/70 border-sky-200'
                    : 'bg-slate-50/70 border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{day.dayLabel}</span>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      {day.date}
                    </span>
                  </div>

                  <div className="my-3 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900 tabular-nums">
                        {day.tempMax}°C
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        Low {day.tempMin}°C
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center">
                      {day.rainProb >= 60 ? (
                        <CloudRain className="w-5 h-5 text-sky-600" />
                      ) : day.rainProb >= 30 ? (
                        <CloudSun className="w-5 h-5 text-sky-600" />
                      ) : (
                        <Sun className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200/70 tabular-nums">
                  <div className="flex justify-between">
                    <span>Rain Prob:</span>
                    <span className="font-semibold text-sky-700">{day.rainProb}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rainfall:</span>
                    <span className="font-semibold text-slate-900">{day.rainMm} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wind:</span>
                    <span className="font-semibold text-slate-800">{day.windMax} km/h</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Row: 24-Hour Hourly Chart + Rainfall History Chart (Last 30 Days vs Normal) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 24-Hour Hourly Temperature & Rainfall Probability Chart */}
        <Card
          title="24-Hour Hourly Forecast Chart"
          subtitle="Hourly temperature (°C) and rainfall probability (%) across the next 24 hours"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weatherData.hourly24}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="temp"
                  name="Temperature (°C)"
                  stroke="#EA580C"
                  fill="#FFEDD5"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="rainProb"
                  name="Rain Probability (%)"
                  stroke="#0284C7"
                  fill="#E0F2FE"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Rainfall History Chart (Last 30 Days Actual vs Normal) */}
        <Card
          title="Rainfall History (Last 30 Days vs. Normal)"
          subtitle={`30-Day Cumulative: ${total30DayActual} mm Actual vs. ${total30DayNormal} mm Normal (${
            rainfallDeparturePct >= 0 ? `+${rainfallDeparturePct}%` : `${rainfallDeparturePct}%`
          } Departure)`}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weatherData.rainfall30Days}
                margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={2} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${val}mm`}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="actualMm"
                  name="Actual Rainfall (mm)"
                  fill="#0284C7"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="normalMm"
                  name="Historical Normal (mm)"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
