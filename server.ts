import 'dotenv/config';
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json({ limit: '2mb' }));

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Simple in-memory caches so repeated ghost lines and songs play with zero delay
const ttsCache = new Map<string, string>();
let cachedVictorySong: {
  title: string;
  subtitle: string;
  lyrics: Array<{ timeSec: number; hindi: string; hinglish: string }>;
  vocalAudioBase64?: string;
} | null = null;

/**
 * POST /api/story
 * Generates a fresh 3-chapter 1984 Indian Haveli horror backstory explaining WHY the curse happened.
 */
app.post('/api/story', async (_req, res) => {
  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents:
        'Create a chilling 3-chapter opening backstory for the 3D Indian survival horror game "MOKSHA: The Last Ritual" set in an abandoned 1984 North Indian haveli. Explain clearly WHY this tragedy happened (a young bride in a dark maroon saree with silver payal was betrayed and locked inside on her wedding night in October 1984, leaving her sacred havan unfinished) and WHY the player has entered tonight (only by finding 4 sacred items — Brass Kalash, Red Chunri, Glowing Brass Diya, and Havan Samagri — and offering them at the courtyard Havan Kund can her restless spirit finally attain Moksha). Write atmospheric, easy-to-read Hinglish narration (short vivid paragraphs, 2-3 sentences per chapter) plus a short haunting Hindi quote per chapter.',
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are a master Indian horror storyteller crafting gripping, cinematic Hinglish game lore that is clear, emotional, eerie, and concise.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Story title, e.g., 14 October 1984: The Unfinished Havan' },
            year: { type: Type.STRING, description: 'Year/date stamp like OCTOBER 1984' },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING, description: 'Short chapter title' },
                  hindiQuote: { type: Type.STRING, description: 'Short evocative Hindi line in Devanagari' },
                  narration: { type: Type.STRING, description: '2-3 vivid sentences in clear Hinglish explaining what happened' },
                  moodCue: { type: Type.STRING, description: 'Short 2-3 word atmosphere label' },
                },
                required: ['heading', 'hindiQuote', 'narration', 'moodCue'],
              },
            },
          },
          required: ['title', 'year', 'chapters'],
        },
      },
    });

    const raw = (response.text ?? '').trim();
    if (!raw) {
      return res.status(502).json({ error: 'Gemini returned an empty story response.' });
    }
    const parsed = JSON.parse(raw);
    return res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate AI backstory.';
    console.error('[/api/story] Error:', message);
    return res.status(500).json({ error: message });
  }
});

/**
 * POST /api/tts
 * Generates chilling horror narration, terrifying ghost voices, or panicked player whispers
 * using Gemini 3.8 Flash TTS Voice Design (unary audio/wav output).
 */
app.post('/api/tts', async (req, res) => {
  try {
    const { text, persona = 'ghost', cacheKey } = req.body as {
      text?: string;
      persona?: 'narrator' | 'ghost' | 'ghost_peaceful' | 'player';
      cacheKey?: string;
    };

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Missing text for TTS generation.' });
    }

    const key = cacheKey ? `${persona}:${cacheKey}` : `${persona}:${text.trim()}`;
    const existing = ttsCache.get(key);
    if (existing) {
      return res.json({ audioBase64: existing, mimeType: 'audio/wav', cached: true });
    }

    const ai = getGeminiClient();

    let voiceName: 'Kore' | 'Charon' | 'Fenrir' | 'Zephyr' | 'Puck' = 'Kore';
    let style = 'Eerie haunting Indian female spirit whisper, raspy, slow, chilling pauses';
    let formattedText = text.trim();

    if (persona === 'narrator') {
      voiceName = 'Charon';
      style = 'Deep, atmospheric Indian horror documentary narrator, slow deliberate cadence, mysterious and solemn, speaking Hinglish naturally';
      formattedText = `<breath> ${formattedText}`;
    } else if (persona === 'ghost') {
      voiceName = 'Kore';
      style = 'Terrifying spectral Indian female ghost in Hindi, hollow raspy eerie whisper mixed with sudden chilling intensity, slow creepy drawl, haunting breathiness';
      formattedText = `<breath> ${formattedText}`;
    } else if (persona === 'ghost_peaceful') {
      voiceName = 'Zephyr';
      style = 'Ethereal, emotional, hauntingly soulful Indian female spirit singing softly in Hindi, gentle melancholic lullaby turning into serene warmth and peace';
    } else if (persona === 'player') {
      voiceName = 'Puck';
      style = 'Frightened young Indian explorer whispering anxiously in Hinglish, trembling quiet voice, breathless fear';
      formattedText = `<gasp> ${formattedText}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: formattedText,
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(502).json({ error: 'TTS model returned no audio data.' });
    }

    // Keep cache bounded to 40 entries
    if (ttsCache.size > 40) {
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) ttsCache.delete(firstKey);
    }
    ttsCache.set(key, base64Audio);

    return res.json({ audioBase64: base64Audio, mimeType: 'audio/wav', cached: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to synthesize voice audio.';
    console.error('[/api/tts] Error:', message);
    return res.status(500).json({ error: message });
  }
});

/**
 * POST /api/victory-song
 * Generates original soulful Indian ghost-redemption song ("Moksha Geet") lyrics + ethereal female vocal track.
 */
app.post('/api/victory-song', async (_req, res) => {
  try {
    if (cachedVictorySong) {
      return res.json(cachedVictorySong);
    }

    const ai = getGeminiClient();

    // 1. Compose poetic Hindi/Hinglish ghost liberation song lyrics
    const lyricsRes = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents:
        'Write an original, hauntingly beautiful 4-line Indian ghost liberation song ("Moksha Geet") for the victory ending of the horror game "MOKSHA: The Last Ritual". The spirit of the 1984 haveli bride in a maroon saree finally hears her silver payal fall silent as the Havan Kund fire grants her eternal peace. Return exactly 4 poetic couplet lines with timestamps at 0, 7, 14, and 21 seconds, each having Devanagari Hindi and Hinglish text.',
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction:
          'You are an evocative Indian film lyricist blending haunting folk lullaby imagery (payal, aangan, havan, jyot, raat, shanti) with emotional release.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            lyrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeSec: { type: Type.NUMBER },
                  hindi: { type: Type.STRING },
                  hinglish: { type: Type.STRING },
                },
                required: ['timeSec', 'hindi', 'hinglish'],
              },
            },
          },
          required: ['title', 'subtitle', 'lyrics'],
        },
      },
    });

    const parsed = JSON.parse((lyricsRes.text ?? '{}').trim()) as {
      title: string;
      subtitle: string;
      lyrics: Array<{ timeSec: number; hindi: string; hinglish: string }>;
    };

    const lyrics = Array.isArray(parsed.lyrics) && parsed.lyrics.length > 0 ? parsed.lyrics : [];
    const combinedHindi = lyrics.map((l) => l.hindi).join(' ... ');

    // 2. Render ethereal ghostly-turned-serene Hindi vocal rendition using gemini-3.8-flash-tts
    let vocalAudioBase64: string | undefined;
    if (combinedHindi) {
      try {
        const vocalRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `<breath> ${combinedHindi}`,
                  speechMetadata: {
                    style:
                      'Hauntingly soulful Indian female ghost singing a slow, poetic melodic lullaby in Hindi with soft reverb-like breathiness, starting melancholic and ending warm and peaceful',
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Zephyr' },
              },
            },
          },
        });
        vocalAudioBase64 = vocalRes.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      } catch (vocalErr) {
        console.warn('[/api/victory-song] Vocal TTS error:', vocalErr);
      }
    }

    cachedVictorySong = {
      title: parsed.title || 'Moksha Geet — Aakhiri Shanti',
      subtitle: parsed.subtitle || 'Original Haveli Theme',
      lyrics,
      vocalAudioBase64,
    };

    return res.json(cachedVictorySong);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to compose victory ghost song.';
    console.error('[/api/victory-song] Error:', message);
    return res.status(500).json({ error: message });
  }
});

async function startServer() {
  const httpServer = http.createServer(app);

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const hmrDisabled = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: hmrDisabled ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MOKSHA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
