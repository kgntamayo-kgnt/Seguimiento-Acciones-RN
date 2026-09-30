import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

app.post('/api/gemini', async (req, res) => {
  try {
    const { contents, systemInstruction, generationConfig } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server',
      });
    }

    const config = {};
    if (systemInstruction?.parts?.[0]?.text) {
      config.systemInstruction = systemInstruction.parts[0].text;
    }
    if (generationConfig?.responseMimeType) {
      config.responseMimeType = generationConfig.responseMimeType;
    }
    if (generationConfig?.responseSchema) {
      config.responseSchema = generationConfig.responseSchema;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: config,
    });

    res.json({
      candidates: [
        {
          content: {
            parts: [
              {
                text: response.text || '',
              },
            ],
          },
        },
      ],
    });
  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: error.message || 'Error processing request' });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
