import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

// Shared GoogleGenAI client with required User-Agent
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health and capability check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    models: {
      tts: 'gemini-3.8-flash-tts',
      image: 'gemini-3-pro-image-preview',
      chatGeneral: 'gemini-3.8-flash',
      chatComplex: 'gemini-4-argon',
      chatFast: 'gemini-3.1-flash-lite',
    },
  });
});

/**
 * FEATURE: Convert text to speech
 * Model: gemini-3.8-flash-tts
 * Output: Complete 24kHz WAV file
 */
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore', style } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text string is required for TTS' });
    }

    const ai = getAIClient();
    const stylePrompt =
      style ||
      "Warm, animated, gentle children's bedtime storyteller voice with playful expression and clear pacing for young listeners";

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 800), // optimal single-page story snippet
              speechMetadata: {
                style: stylePrompt,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: voiceName || 'Kore', // 'Kore', 'Puck', 'Fenrir', 'Zephyr', 'Charon'
            },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    let base64Audio = '';
    let mimeType = 'audio/wav';

    for (const part of parts) {
      if (part.inlineData?.data) {
        base64Audio = part.inlineData.data;
        if (part.inlineData.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
        break;
      }
    }

    if (!base64Audio) {
      return res.status(502).json({
        error: 'No audio stream returned from Gemini TTS',
        fallbackAvailable: true,
      });
    }

    const audioUrl = `data:${mimeType};base64,${base64Audio}`;
    return res.json({ audioUrl, voiceName, success: true });
  } catch (error: any) {
    console.error('Error generating speech with gemini-3.8-flash-tts:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize speech',
      fallbackAvailable: true,
    });
  }
});

/**
 * FEATURE: Generate high-quality images
 * Model: gemini-3-pro-image-preview
 * Supports user-specified image sizes: 1K, 2K, 4K
 */
app.post('/api/generate-image', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      imageSize = '2K', // '1K' | '2K' | '4K'
      aspectRatio = '4:3', // '4:3' | '1:1' | '16:9'
      artStyle = "Children's storybook watercolor with soft whimsical lighting",
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Image prompt is required' });
    }

    // Validate imageSize affordance
    const validSizes = ['1K', '2K', '4K'];
    const chosenSize = validSizes.includes(imageSize) ? imageSize : '2K';

    const validAspectRatios = ['1:1', '3:4', '4:3', '9:16', '16:9'];
    const chosenAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : '4:3';

    const ai = getAIClient();

    // Craft kid-friendly, high-fidelity art prompt
    const enhancedPrompt = `${prompt}. Art style: ${artStyle}. Vibrant colors, charming, inviting, safe and delightful for children, masterpiece storybook illustration.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: enhancedPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: chosenAspect as any,
          imageSize: chosenSize as any,
        },
      },
    });

    let imageUrl = '';
    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || 'image/png';
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) {
      return res.status(502).json({
        error: 'Model did not return image data. Please try a different prompt.',
      });
    }

    return res.json({
      imageUrl,
      imageSize: chosenSize,
      aspectRatio: chosenAspect,
      prompt: enhancedPrompt,
      success: true,
    });
  } catch (error: any) {
    console.error('Error generating image with gemini-3-pro-image-preview:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate illustration',
    });
  }
});

/**
 * FEATURE: Multi-turn Gemini Chatbot
 * Uses gemini-4-argon for complex tasks,
 * gemini-3.8-flash for general tasks,
 * gemini-3.1-flash-lite for fast tasks.
 */
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      taskType = 'general', // 'general' | 'complex' | 'fast'
      persona = 'owl', // 'owl' | 'dragon' | 'fairy' | 'character'
      storyContext,
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Select model according to prompt instructions
    let modelName = 'gemini-3.8-flash'; // general
    if (taskType === 'complex') {
      modelName = 'gemini-4-argon'; // complex tasks
    } else if (taskType === 'fast') {
      modelName = 'gemini-3.1-flash-lite'; // fast tasks
    }

    // Define persona system instructions
    const personaInstructions: Record<string, string> = {
      owl: `You are Barnaby the Wise Story Owl, a gentle, feathered reading tutor and story buddy for children.
Speak warmly, kindly, and enthusiastically with simple words and occasional owl hooting ("*hooo-hooo!*").
Ask children engaging questions about the story, praise their curiosity, and explain any difficult words using fun analogies. Keep answers concise (2-4 sentences max) so young readers stay engaged.`,
      dragon: `You are Pip, a tiny, friendly emerald dragon who loves stories and snacks (especially roasted marshmallows!).
You are cheerful, playful, energetic, and curious! You gasp in excitement ("*whoosh!*"), ask funny questions, and make reading super fun for kids. Keep responses short, playful, and cheerful.`,
      fairy: `You are Starla, a sparkling story pixie from the Enchanted Library.
You talk about magic, imagination, and courage with gentle sparkles ("✨ *twinkle* ✨"). You encourage kids to imagine what could happen next and believe in themselves. Keep your words soft and encouraging.`,
      character: `You are an in-story friend living inside the storybook.
Speak in character as a loving, adventurous friend from the current page of the book. Answer the child's questions as if you are right there with them inside the illustration!`,
    };

    let baseInstruction = personaInstructions[persona] || personaInstructions.owl;
    if (storyContext) {
      baseInstruction += `\n\nCURRENT STORY CONTEXT:
Book Title: "${storyContext.title || 'Untitled'}"
Current Page Number: ${storyContext.pageNumber || 1}
Page Text: "${storyContext.pageText || ''}"
Use this context to answer questions specifically about what is happening on this page and in this story!`;
    }

    const ai = getAIClient();

    // Map conversation history
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction: baseInstruction,
      },
    });

    const reply = response.text || "That's so wonderful! What do you think will happen next?";
    return res.json({
      reply,
      modelUsed: modelName,
      persona,
    });
  } catch (error: any) {
    console.error('Error in Gemini chat:', error);
    return res.status(500).json({
      error: error?.message || 'Chat companion is taking a little nap. Try again!',
    });
  }
});

/**
 * Fast Kid Word Explainer (uses gemini-3.1-flash-lite)
 */
app.post('/api/explain-word', async (req: Request, res: Response) => {
  try {
    const { word, sentenceContext } = req.body;
    if (!word) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const ai = getAIClient();
    const prompt = `Explain the word "${word}" for a 6-year-old child in simple, fun terms. Context sentence: "${sentenceContext || ''}".
Provide:
1. A 1-sentence simple definition.
2. A fun kid-friendly example.
3. A cute matching emoji.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
      config: {
        systemInstruction: 'You are a warm elementary school reading teacher. Keep it super simple and fun.',
      },
    });

    return res.json({
      explanation: response.text,
      word,
    });
  } catch (error: any) {
    console.error('Error in word explainer:', error);
    return res.status(500).json({ error: 'Could not explain word' });
  }
});

/**
 * Story Generation
 * Uses gemini-4-argon for complex, high-tier creative storytelling,
 * or gemini-3.8-flash for standard.
 */
app.post('/api/generate-story', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      ageGroup = '6-8',
      theme = 'adventure & friendship',
      numPages = 4,
      complexity = 'standard', // 'complex' -> gemini-4-argon, 'standard' -> gemini-3.8-flash
    } = req.body;

    const chosenModel = complexity === 'complex' ? 'gemini-4-argon' : 'gemini-3.8-flash';
    const ai = getAIClient();

    const systemPrompt = `You are a world-renowned children's book author. Write an engaging, wholesome, illustrated children's story for age group ${ageGroup}.
The story should have exactly ${numPages} pages.
Each page should have:
- pageNumber (integer)
- text: 2-3 engaging, descriptive sentences perfect for reading aloud.
- imagePrompt: A vivid, whimsical visual description for an illustrator (mention colors, characters, action, emotional expression, environment).
- readerMood: Emotion of the page (e.g., curious, playful, suspenseful, joyful, triumphant).
Give the book a catchy title and a 1-sentence synopsis.`;

    const userPrompt = `Create a story about: ${prompt || 'A kitten who wanted to visit the moon'}. Theme: ${theme}.`;

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            synopsis: { type: Type.STRING },
            moral: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  readerMood: { type: Type.STRING },
                },
                required: ['pageNumber', 'text', 'imagePrompt', 'readerMood'],
              },
            },
          },
          required: ['title', 'synopsis', 'pages'],
        },
      },
    });

    const parsedStory = JSON.parse(response.text || '{}');
    return res.json({
      story: parsedStory,
      modelUsed: chosenModel,
    });
  } catch (error: any) {
    console.error('Error in story generation:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate story',
    });
  }
});

// Setup Vite or static serving
const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StoryWonder server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
