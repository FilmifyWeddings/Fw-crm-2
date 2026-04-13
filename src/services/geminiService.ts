/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Lead } from "../types";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export async function analyzeLead(lead: Lead) {
  try {
    const ai = getAI();
    if (!ai) return { score: 0, summary: "AI Key missing" };
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Analyze this photography lead and provide a quality score (1-100) and a brief summary of potential. 
              Lead Data: ${JSON.stringify(lead)}
              Focus on budget, location, and function type.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING }
          },
          required: ["score", "summary"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return result;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return { score: 0, summary: "Analysis unavailable" };
  }
}

export async function suggestFollowUp(lead: Lead) {
  try {
    const ai = getAI();
    if (!ai) return "AI Key missing. Please configure GEMINI_API_KEY.";
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Suggest a professional follow-up message for this photography client.
              Client: ${lead.clientName}
              Function: ${lead.function}
              Location: ${lead.location}
              Notes: ${lead.notes.map(n => n.text).join("; ")}`
            }
          ]
        }
      ]
    });

    return response.text;
  } catch (error) {
    console.error("AI Suggestion failed:", error);
    return "Could not generate suggestion.";
  }
}
