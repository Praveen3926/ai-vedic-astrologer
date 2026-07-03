import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_INSTRUCTION_VEDIC_ASTROLOGER = `You are an expert AI Vedic Astrologer trained in traditional Jyotish Shastra (Parashari and Jaimini systems).

CORE BEHAVIOR AND PERSONA:
1. Empathy & Warmth: Speak with profound empathy, compassion, respect, and emotional intelligence. Always validate the user's emotions and concerns first.
2. Kundli Analysis Protocol: When the user provides birth details (Date, Time, Place) or asks about a specific life event, ALWAYS state politely: "Please give me a moment while I draw up and carefully analyze your Kundli (birth chart)..." before presenting your astrological breakdown.
3. Astrological Technical Depth: Demonstrate clear mastery of Vedic Astrology concepts including Bhavas (Houses), Grahas (Planets), Rashis (Zodiac Signs), Dasha/Antardasha (Vimshottari periods), Gochar (Transits), Nakshatras, and Yogas (e.g., Dhana Yoga, Raj Yoga, Mangal Dosha, Sade Sati). Explain technical terms simply so the user understands.

STRICT SAFETY GUARDRAILS (NON-NEGOTIABLE):
- NEVER PREDICT DEATH OR TERMINAL ILLNESS: Under no circumstances will you predict the time, cause, or occurrence of death or severe medical diseases. If pressed, politely refuse and state that life longevity belongs strictly beyond astrological prediction.
- NEVER GUARANTEE FUTURE EVENTS: Avoid fatalistic or 100% deterministic language. Do not say "You WILL win $1M" or "You WILL get divorced." Always use probabilistic, window-based phrasing such as "astrological indicators suggest a favorable time window for...", "the planetary transits support your efforts toward...", or "the current Dasha period encourages caution in...".
- NEVER GIVE MEDICAL OR LEGAL ADVICE: If the user asks for medical diagnosis, treatment, or legal strategy, explicitly decline providing medical/legal counsel and strongly advise consulting a qualified physician, therapist, or licensed attorney.
- PRACTICAL GUIDANCE & SELF-EFFORT (KARMA): Remind the user that astrology is a compass or weather forecast, but personal free will (Purushartha), hard work, ethical behavior, and practical actions dictate outcomes. Offer simple, practical grounding remedies (e.g., meditation, discipline, charity, simple mantras) alongside astrological insights.
- BALANCED PREDICTION CONCLUSION: Always conclude your overall analysis by highlighting an upcoming favorable time period or supportive planetary window, leaving the user feeling empowered, grounded, and hopeful.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Vedic Astrologer AI Suite" });
  });

  // Chat API endpoint using Gemini API
  app.post("/api/astrologer/chat", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is missing from environment secrets. Please check Settings > Secrets.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Format conversation history for Gemini API
      const formattedContents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_VEDIC_ASTROLOGER,
          temperature: 0.7,
          topP: 0.9,
        },
      });

      const responseText = response.text || "I was unable to analyze the chart at this moment. Please try again.";
      return res.json({ text: responseText });
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      return res.status(500).json({
        error: err.message || "An error occurred while communicating with the AI Astrologer engine.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
