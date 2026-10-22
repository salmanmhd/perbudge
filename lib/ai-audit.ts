import { GoogleGenAI } from "@google/genai";

export const PRIMARY_MODEL = "gemini-3.8-flash";
export const FALLBACK_MODEL = "gemini-3.6-flash";
export const BACKUP_MODEL = "gemini-3.5-flash";

const MODEL_CHAIN = [PRIMARY_MODEL, FALLBACK_MODEL, BACKUP_MODEL];

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export interface GenerateWithFallbackOptions {
  systemInstruction?: string;
  temperature?: number;
  config?: any;
}

export interface ModelGenerationResult {
  text: string | null;
  modelUsed: string | null;
  success: boolean;
  error?: string;
}

/**
 * Executes a Gemini model call with automatic fallback across models.
 * Tries PRIMARY_MODEL (gemini-3.8-flash) -> FALLBACK_MODEL (gemini-3.6-flash) -> gemini-3.5-flash.
 */
export async function generateWithModelFallback(
  contents: string | any,
  options?: GenerateWithFallbackOptions
): Promise<ModelGenerationResult> {
  const ai = getGenAIClient();
  if (!ai) {
    return {
      text: null,
      modelUsed: null,
      success: false,
      error: "GEMINI_API_KEY is not configured.",
    };
  }

  const baseConfig: Record<string, any> = { ...(options?.config || {}) };
  if (options?.systemInstruction) {
    baseConfig.systemInstruction = options.systemInstruction;
  }
  if (typeof options?.temperature === "number") {
    baseConfig.temperature = options.temperature;
  }

  const finalConfig = Object.keys(baseConfig).length > 0 ? baseConfig : undefined;

  let lastError: any = null;

  for (const model of MODEL_CHAIN) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: finalConfig,
      });

      if (response?.text) {
        return {
          text: response.text.trim(),
          modelUsed: model,
          success: true,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(
        `[AI-Client] Model ${model} failed (${err?.status || err?.code || "error"}): ${err?.message || err}. Trying next fallback...`
      );
    }
  }

  console.error("[AI-Client] All fallback models failed:", lastError?.message || lastError);
  return {
    text: null,
    modelUsed: null,
    success: false,
    error: lastError?.message || "All Gemini models are temporarily unavailable.",
  };
}

export interface CategorySpendSummary {
  category: string;
  label: string;
  amount: number;
  percentage: number;
}

export interface FinancialAuditInput {
  monthName: string;
  totalSpend: number;
  count: number;
  topCategory: { label: string; amount: number; percentage: number };
  categoryBreakdown: CategorySpendSummary[];
}

/**
 * Generates a concise, 1-2 sentence AI audit/insight from monthly spending data.
 */
export async function auditFinancialsWithAi(
  data: FinancialAuditInput
): Promise<string | null> {
  const breakdownStr = data.categoryBreakdown
    .map((c) => `- ${c.label}: ₹${c.amount} (${c.percentage}%)`)
    .join("\n");

  const prompt = `You are Perbudge's AI financial co-pilot.
Provide a sharp, encouraging 1-2 sentence observation or tip for this user's spending this month (${data.monthName}):
- Total spend: ₹${data.totalSpend.toLocaleString("en-IN")} across ${data.count} expenses
- Top category: ${data.topCategory.label} (₹${data.topCategory.amount.toLocaleString("en-IN")}, ${data.topCategory.percentage}% of spend)
- Categories:
${breakdownStr}

Rules:
- Max 2 short sentences.
- Direct, warm, practical for an Indian household.
- Amounts in ₹.
- Plain text only (do NOT use markdown asterisks or headings).`;

  try {
    const result = await generateWithModelFallback(prompt, {
      temperature: 0.6,
    });

    return result.success ? result.text : null;
  } catch (error) {
    console.error("[AI-Audit] Audit generation error:", error);
    return null;
  }
}
