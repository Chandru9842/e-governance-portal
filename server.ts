import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Gemini AI Crop Advisory Endpoint
  app.post('/api/crop-advisory', async (req, res) => {
    try {
      const {
        cropName,
        variety,
        season,
        growthStage,
        healthStatus,
        irrigationType,
        areaAcres,
        weather,
        language,
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured on server',
          fallbackRequired: true,
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are a Senior Agronomist at Tamil Nadu Agricultural University (TNAU) advising a farmer in Perambalur, Tamil Nadu.
Provide specific, actionable agronomic advice for the following crop plot:
- Crop: ${cropName} (${variety})
- Season: ${season}
- Current Growth Stage: ${growthStage}
- Current Health Status: ${healthStatus}
- Irrigation Method: ${irrigationType}
- Plot Area: ${areaAcres} Acres
- Local Weather (Perambalur, TN): ${weather?.condition || 'Partly Cloudy'}, Max Temp ${weather?.tempMax || 29}°C, Humidity ${weather?.humidity || 74}%, Rainfall chance ${weather?.rainfallChancePct || 35}%, Wind ${weather?.windSpeedKmh || 14} km/h.
- Output Language preference: ${language === 'ta' ? 'Tamil (தமிழ்)' : 'English'}.

Return a JSON object containing:
1. summary: 1-2 sentence overall field assessment for the current growth stage and weather.
2. pestAlerts: Array of 2 specific pest/disease warnings relevant to this crop, stage, and humidity, with organic/TNAU-recommended control measures.
3. irrigationAdvice: Specific water management schedule based on the ${irrigationType} irrigation type and ${weather?.rainfallChancePct || 35}% rain forecast.
4. nutrientTip: Recommended fertilizer or foliar micronutrient application for the ${growthStage} stage.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              pestAlerts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              irrigationAdvice: { type: Type.STRING },
              nutrientTip: { type: Type.STRING },
            },
            required: ['summary', 'pestAlerts', 'irrigationAdvice', 'nutrientTip'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini model');
      }

      const parsed = JSON.parse(text);
      res.json({
        source: 'gemini',
        advisory: parsed,
      });
    } catch (error) {
      console.error('Gemini Crop Advisory error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate AI crop advisory',
        fallbackRequired: true,
      });
    }
  });

  // Gemini AI Market "Best Time to Sell" Insight Endpoint
  app.post('/api/market-insight', async (req, res) => {
    try {
      const {
        commodity,
        mandiName,
        district,
        modalPrice,
        mspPrice,
        timeframe,
        trendData,
        language,
      } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        res.status(503).json({
          error: 'GEMINI_API_KEY not configured on server',
          fallbackRequired: true,
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are an Agricultural Market Economist at Tamil Nadu State Agricultural Marketing Board advising a farmer in ${district}, Tamil Nadu.
Analyze the following mandi price trend and provide a "Best Time to Sell" recommendation:
- Commodity: ${commodity}
- Primary Market: ${mandiName} (${district})
- Current Modal Price: ₹${modalPrice}/Quintal
- Government MSP Floor Price: ${mspPrice ? `₹${mspPrice}/Quintal` : 'Market-driven (No statutory MSP)'}
- Selected Trend Window: ${timeframe}
- Recent Price Trend Points: ${JSON.stringify(trendData || [])}
- Output Language preference: ${language === 'ta' ? 'Tamil (தமிழ்)' : 'English'}.

Return a JSON object with:
1. recommendation: Actionable headline verdict (e.g., "Sell 60% Lot Now & Hold 40% for Mid-November Peak" or "Immediate Sale Recommended at Regulated Mandi").
2. bestWindow: Specific timeframe window to sell for maximum realization.
3. expectedPriceBand: Projected modal price range in ₹/Quintal over the next 2 weeks.
4. reasoning: 2 concise sentences explaining arrival pressure, moisture standards, MSP comparison, and festival/seasonal demand.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendation: { type: Type.STRING },
              bestWindow: { type: Type.STRING },
              expectedPriceBand: { type: Type.STRING },
              reasoning: { type: Type.STRING },
            },
            required: ['recommendation', 'bestWindow', 'expectedPriceBand', 'reasoning'],
          },
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini model');
      }

      res.json({
        source: 'gemini',
        insight: JSON.parse(text),
      });
    } catch (error) {
      console.error('Gemini Market Insight error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate AI market insight',
        fallbackRequired: true,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
