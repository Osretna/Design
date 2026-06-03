import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable Cross-Origin Resource Sharing (CORS) for external frontend deployments (like Vercel)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

// Increase payload sizes as we will be processing base64 image data
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Initialize GoogleGenAI client lazily to handle missing key gracefully
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is not defined in environments. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ----------------------
// BACKEND API ENDPOINTS
// ----------------------

// 1. Text-to-Image Proxy Block
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, aspectRatio } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required for image generation" });
    }

    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio || "1:1",
        },
      },
    });

    let base64Image = null;
    let descriptionText = "";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
      } else if (part.text) {
        descriptionText += part.text;
      }
    }

    if (!base64Image) {
      // Sometimes it is first part or the only part - search deeper
      const fallbacks = response.candidates?.[0]?.content?.parts || [];
      if (fallbacks.length > 0 && fallbacks[0].inlineData) {
        base64Image = fallbacks[0].inlineData.data;
      }
    }

    if (!base64Image) {
      throw new Error("No image was returned by the generation model.");
    }

    res.json({
      success: true,
      imageUrl: `data:image/png;base64,${base64Image}`,
      description: descriptionText,
    });
  } catch (err: any) {
    console.error("Image generation error:", err);
    res.status(500).json({ error: err.message || "Failed to generate image" });
  }
});

// 2. Video Step 1: Start (POST /api/generate-video)
app.post("/api/generate-video", async (req, res) => {
  try {
    const { prompt, imageBytes, mimeType, aspectRatio } = req.body;
    
    // We can generate video even from prompt only, but supporting starting image
    const ai = getAIClient();
    const cleanPrompt = prompt || "A fascinating video transformation";

    let payload: any = {
      model: "veo-3.1-lite-generate-preview",
      prompt: cleanPrompt,
      config: {
        numberOfVideos: 1,
        resolution: "1080p", 
        aspectRatio: aspectRatio || "16:9",
      }
    };

    if (imageBytes) {
      const cleanBytes = imageBytes.includes(",") ? imageBytes.split(",")[1] : imageBytes;
      payload.image = {
        imageBytes: cleanBytes,
        mimeType: mimeType || "image/png",
      };
    }

    const operation = await ai.models.generateVideos(payload);
    res.json({ operationName: operation.name });
  } catch (err: any) {
    console.error("Video creation initiate error:", err);
    res.status(500).json({ error: err.message || "Failed to initialize video generation" });
  }
});

// 3. Video Step 2: Poll (POST /api/video-status)
app.post("/api/video-status", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "operationName is required for polling status" });
    }

    const ai = getAIClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    res.json({ done: updated.done, error: updated.error || null });
  } catch (err: any) {
    console.error("Video status polling error:", err);
    res.status(500).json({ error: err.message || "Failed to check video status" });
  }
});

// 4. Video Step 3: Stream/Download (GET/POST /api/video-download)
app.post("/api/video-download", async (req, res) => {
  try {
    const { operationName } = req.body;
    if (!operationName) {
      return res.status(400).json({ error: "operationName is required to request video file" });
    }

    const ai = getAIClient();
    const op = new GenerateVideosOperation();
    op.name = operationName;

    const updated = await ai.operations.getVideosOperation({ operation: op });
    const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

    if (!uri) {
      return res.status(404).json({ error: "Video download URI is not available yet." });
    }

    const apiKey = process.env.GEMINI_API_KEY || "";
    const response = await fetch(uri, {
      headers: { "x-goog-api-key": apiKey },
    });

    if (!response.ok) {
      throw new Error(`Failed to download video from Google cloud: ${response.statusText}`);
    }

    res.setHeader("Content-Type", "video/mp4");
    
    // Pump stream to client
    const body = response.body;
    if (body) {
      const reader = body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err: any) {
    console.error("Video downloading proxy error:", err);
    res.status(500).json({ error: err.message || "Failed to download generated video" });
  }
});

// 5. Text-To-Speech API Proxy
app.post("/api/text-to-speech", async (req, res) => {
  try {
    const { text, language, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required to perform synthesis" });
    }

    const ai = getAIClient();
    
    const isArabic = (language === "ar") || /[\u0600-\u06FF]/.test(text);
    const speakerPrompt = isArabic
      ? `You are an expert Arabic voice-over artist. Please read the following Arabic text aloud with standard, highly professional, crystal-clear Modern Standard Arabic (Fusha) pronunciation, natural cadence, and accurate phrasing. Do not translate. Only repeat/read this exact Arabic text:\n\n${text}`
      : `You are an expert English voice-over artist. Please read the following text aloud with highly professional, crystal-clear pronunciation and natural cadence. Only repeat/read this exact text:\n\n${text}`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: speakerPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No synthesized audio data was returned from Gemini speech model.");
    }

    res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType: "audio/wav",
    });
  } catch (err: any) {
    console.error("Gemini Text-to-Speech synthesis error:", err);
    res.status(500).json({ error: err.message || "Failed to synthesize text. Fallback to client speech is recommended." });
  }
});

// ----------------------
// VITE DEV & CLIENT FLOWS
// ----------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Live application running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
