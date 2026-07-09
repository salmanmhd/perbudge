"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { buildAiContext } from "@/lib/actions/finance-snapshot";
import { generateDigestFromContext } from "@/lib/ai/digest";
import { aiErrorMessage } from "@/lib/ai/errors";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

const NO_DATA = "not recorded any financial data";

export async function generateAiDigest() {
  const context = await buildAiContext();
  return generateDigestFromContext(context);
}

export async function chatWithAi(messageHistory: { role: string; content: string }[]) {
  const context = await buildAiContext();

  const systemPrompt = `You are Perbudge, a personal finance AI for an Indian user. You know their full financial picture below — income, spending, budgets, EMIs, credit cards, and money owed.

${context}

Rules:
- Answer using THEIR real numbers. Be specific and concise.
- When they ask "can I afford X" or "how do I save", reason from their income, fixed obligations (EMIs), and current spending.
- Give practical, India-aware guidance (UPI, credit-card cycles, EMIs). Never invent data you don't have.
- If asked something unrelated to their finances, gently steer back.
- Amounts in ₹. Keep replies tight and actionable.`;

  const formattedHistory = messageHistory.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const contents: any[] = [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [{ text: "Understood — I'm Perbudge, and I'll answer from your actual financial data." }],
      },
      ...formattedHistory,
    ];

    const response = await ai.models.generateContent({ model: MODEL, contents });
    return { success: true, text: response.text };
  } catch (error) {
    console.error("Chat error:", error);
    return { success: false, text: aiErrorMessage(error, "Sorry, I hit an error processing your query.") };
  }
}

export type IssueSeverity = "good" | "watch" | "urgent";
export interface FinancialIssue {
  title: string;
  severity: IssueSeverity;
  detail: string;
  action: string;
}

/**
 * Structured "find the issues" analysis for the Insights page.
 * Returns prioritised findings the UI can render with severity colours.
 */
export async function analyzeFinances(): Promise<{
  success: boolean;
  issues: FinancialIssue[];
  error?: string;
}> {
  const context = await buildAiContext();
  if (context.includes(NO_DATA)) {
    return { success: true, issues: [] };
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are a rigorous financial analyst for an Indian household. Study the data and surface the most important findings — real problems, risks, AND things going well. Prioritise by impact. 3 to 6 findings. Ground every finding in their actual numbers.

Severity guide:
- "urgent": active money leak or risk (overspending a bucket badly, credit utilisation >70%, EMI load >40% of income, negative projected savings).
- "watch": worth keeping an eye on (a category creeping up, utilisation 40–70%, savings below target).
- "good": a genuine positive worth reinforcing.

${context}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Short headline, 3–6 words." },
              severity: { type: Type.STRING, enum: ["good", "watch", "urgent"] },
              detail: { type: Type.STRING, description: "1–2 sentences with real numbers." },
              action: { type: Type.STRING, description: "One concrete next step." },
            },
            required: ["title", "severity", "detail", "action"],
          },
        },
      },
    });

    if (!response.text) return { success: false, issues: [], error: "No response" };
    const issues = JSON.parse(response.text) as FinancialIssue[];
    return { success: true, issues };
  } catch (error: any) {
    console.error("analyzeFinances error:", error);
    return { success: false, issues: [], error: aiErrorMessage(error, "Could not analyse finances right now.") };
  }
}
