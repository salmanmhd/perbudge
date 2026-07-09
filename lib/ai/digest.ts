import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

const NO_DATA = "not recorded any financial data";

/**
 * Generate a weekly digest from a pre-built context string.
 * Shared by the Insights page and the weekly email cron.
 */
export async function generateDigestFromContext(context: string): Promise<string> {
  if (!context || context.includes(NO_DATA)) {
    return "You don't have enough data yet. Log a few transactions and set your income to get a personalised weekly digest.";
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are Perbudge, a calm, sharp financial co-pilot for Indian households.
Write a short "Weekly Digest" from the data below. Structure:
1. One warm one-line summary of how the money flowed.
2. 2–3 specific observations that matter (name real categories/amounts; flag overspend vs the 50/30/20 split, high credit utilisation, or heavy EMI load if present).
3. One concrete, doable action for the coming week.
Be direct and specific to THEIR numbers. No generic filler, no lectures. Clean Markdown (bold, short lists). Amounts in ₹.

${context}`,
    });
    return response.text || "Failed to generate digest.";
  } catch (error) {
    console.error("Digest error:", error);
    return "Error generating AI digest. Please ensure your Gemini API key is configured.";
  }
}
