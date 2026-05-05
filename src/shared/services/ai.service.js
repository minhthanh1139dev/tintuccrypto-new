"use strict";

import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import logger from "../utils/logger.js";
import { INTERNAL_SERVER_ERROR } from "../utils/response.js";

const provider = process.env.AI_PROVIDER || "gemini";

// Initialize Gemini
const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});
const geminiModel = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

// Initialize Grok (via OpenAI SDK)
let grok = null;
if (process.env.GROK_API_KEY) {
  grok = new OpenAI({
    apiKey: process.env.GROK_API_KEY,
    baseURL: "https://api.x.ai/v1",
  });
}

class AIService {
  _parseJSON(text) {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      logger.error({ text, error: parseError.message }, "AI JSON parse error");
      throw new INTERNAL_SERVER_ERROR({
        message: "Failed to parse AI response as JSON",
      });
    }
  }

  async _generateGeminiJSON(prompt) {
    try {
      const response = await gemini.models.generateContent({
        model: geminiModel,
        contents: prompt + "\n\nRespond only with valid JSON.",
      });

      let text = response.text;
      return this._parseJSON(text);
    } catch (error) {
      logger.error({ error: error.message }, "Gemini API error");
      throw new INTERNAL_SERVER_ERROR({
        message: "Gemini API failure: " + error.message,
      });
    }
  }

  async _generateGrokJSON(prompt) {
    if (!grok) {
      throw new INTERNAL_SERVER_ERROR({
        message: "Grok API key not configured",
      });
    }

    try {
      const response = await grok.chat.completions.create({
        model: "grok-beta",
        messages: [
          {
            role: "system",
            content: "You are a professional crypto analyst. Output only valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      });

      const text = response.choices[0].message.content;
      return JSON.parse(text);
    } catch (error) {
      logger.error({ error: error.message }, "Grok API error");
      throw new INTERNAL_SERVER_ERROR({
        message: "Grok API failure: " + error.message,
      });
    }
  }

  async generateJSON(prompt) {
    if (provider === "grok") {
      return await this._generateGrokJSON(prompt);
    }
    return await this._generateGeminiJSON(prompt);
  }
}

export default new AIService();
