"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { getBudgetPlan } from "@/lib/actions/budget";
import { formatINR } from "@/lib/finance";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

export type CoachTone = "good" | "watch" | "urgent";

export interface BudgetTip {
  title: string;
  tone: CoachTone;
  detail: string;
  action: string;
}

export interface BudgetCoaching {
  success: boolean;
  /** Headline: is the user on pace to stay within income this month? */
  onTrack: boolean | null;
  tips: BudgetTip[];
  error?: string;
}

/**
 * Budget-specific coaching. Unlike the general insights, this is laser-focused
 * on the current month: pace vs. limits, which categories are about to blow the
 * budget, and concrete moves to finish the month within plan.
 */
export async function getBudgetCoaching(): Promise<BudgetCoaching> {
  const plan = await getBudgetPlan();

  if (plan.monthlyIncome <= 0) {
    return {
      success: true,
      onTrack: null,
      tips: [],
      error: "Set your monthly income to get budget coaching.",
    };
  }

  const daysLeft = plan.daysInMonth - plan.daysElapsed;
  const projectedSavings = plan.monthlyIncome - plan.projectedMonthEndSpend;
  const onTrack = plan.projectedMonthEndSpend <= plan.monthlyIncome;

  // Build a tight, numeric brief for the model.
  const lines: string[] = [];
  lines.push(`Monthly take-home income: ${formatINR(plan.monthlyIncome)}.`);
  lines.push(`Savings target: ${plan.savingsTargetPct}% of income.`);
  lines.push(
    `Day ${plan.daysElapsed} of ${plan.daysInMonth} (${daysLeft} days left).`
  );
  lines.push(`Spent so far this month: ${formatINR(plan.totalSpent)}.`);
  lines.push(
    `At the current daily pace, projected month-end spend: ${formatINR(
      plan.projectedMonthEndSpend
    )} → projected savings ${formatINR(projectedSavings)}.`
  );
  lines.push("");
  lines.push("50/30/20 buckets (spent / target this month):");
  for (const b of plan.buckets) {
    const val = b.bucket === "savings" ? plan.projectedSavings : b.spent;
    lines.push(
      `- ${b.bucket}: ${formatINR(Math.max(0, val))} / ${formatINR(b.targetAmount)}`
    );
  }
  if (plan.categoryBudgets.length) {
    lines.push("");
    lines.push("Category limits (spent / limit):");
    for (const cb of plan.categoryBudgets) {
      const pct = cb.limit > 0 ? Math.round((cb.spent / cb.limit) * 100) : 0;
      lines.push(`- ${cb.category}: ${formatINR(cb.spent)} / ${formatINR(cb.limit)} (${pct}%)`);
    }
  } else {
    lines.push("");
    lines.push("No per-category limits set yet.");
  }
  if (plan.financialGoals) {
    lines.push("");
    lines.push(`Their goals: ${plan.financialGoals}`);
  }

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are Perbudge's budget coach for an Indian household. Your ONLY job is to help them finish THIS month within their plan. Study the numbers and give 3–5 specific, doable tips. Prioritise categories/buckets that are pacing over their limit. When on track, reinforce it and suggest how to lock in the surplus. Ground every tip in their actual numbers. Be concrete about rupee amounts and days remaining — no generic advice.

Severity guide:
- "urgent": on pace to overspend a limit/income, or already over.
- "watch": pacing close to a limit; a small correction keeps them safe.
- "good": comfortably within plan — reinforce and channel the surplus.

${lines.join("\n")}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Short headline, 3–6 words." },
              tone: { type: Type.STRING, enum: ["good", "watch", "urgent"] },
              detail: { type: Type.STRING, description: "1–2 sentences with real numbers." },
              action: { type: Type.STRING, description: "One concrete move for the rest of the month." },
            },
            required: ["title", "tone", "detail", "action"],
          },
        },
      },
    });

    if (!response.text) return { success: false, onTrack, tips: [], error: "No response" };
    const tips = JSON.parse(response.text) as BudgetTip[];
    return { success: true, onTrack, tips };
  } catch (error: any) {
    console.error("getBudgetCoaching error:", error);
    return { success: false, onTrack, tips: [], error: "Could not generate coaching right now." };
  }
}
