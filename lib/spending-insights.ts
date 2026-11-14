/**
 * Rule-based spending insights, computed from the user's own transactions.
 * They're deterministic and need no AI call, so they're cheap enough for the
 * dashboard and for Telegram /insights.
 *
 * Not a "use server" module: it takes a userId, so it must not be client-callable.
 */
import type mongoose from "mongoose";
import connectToDatabase from "@/lib/db";
import Transaction from "@/lib/models/transaction";
import User from "@/lib/models/user";

export type InsightTone = "urgent" | "watch" | "good" | "info";
export type InsightKind =
  | "pace"
  | "category_up"
  | "category_down"
  | "budget_forecast"
  | "big_expense"
  | "weekend"
  | "habit"
  | "new_category"
  | "no_spend"
  | "income";

export interface SpendingInsight {
  id: string;
  kind: InsightKind;
  tone: InsightTone;
  title: string;
  detail: string;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const TONE_RANK: Record<InsightTone, number> = { urgent: 0, watch: 1, good: 2, info: 3 };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Shift a UTC instant into IST "wall clock" so getUTC* reads IST fields. */
const ist = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS);
/** IST midnight of the given IST y/m/d, returned as a real UTC instant. */
const istMidnight = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m, d) - IST_OFFSET_MS);

interface Tx {
  amount: number;
  category: string;
  type: string;
  note?: string;
  date: Date;
}

function sumByCategory(txs: Tx[]) {
  const map = new Map<string, { label: string; total: number }>();
  for (const t of txs) {
    const key = (t.category || "others").toLowerCase();
    const cur = map.get(key);
    if (cur) cur.total += t.amount;
    else map.set(key, { label: titleCase(t.category || "Others"), total: t.amount });
  }
  return map;
}

export async function computeSpendingInsights(
  userObjectId: mongoose.Types.ObjectId | string,
  now: Date = new Date()
): Promise<SpendingInsight[]> {
  await connectToDatabase();

  const n = ist(now);
  const y = n.getUTCFullYear();
  const m = n.getUTCMonth();
  const dayOfMonth = n.getUTCDate();
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

  const thisStart = istMidnight(y, m, 1);
  const lastStart = istMidnight(y, m - 1, 1);
  const twoAgoStart = istMidnight(y, m - 2, 1);
  const daysInLastMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  // Same point in last month, so the comparison is like-for-like.
  const lastSamePoint = istMidnight(y, m - 1, Math.min(dayOfMonth, daysInLastMonth) + 1);

  const [rows, user] = await Promise.all([
    Transaction.find({
      userId: userObjectId,
      type: { $in: ["expense", "income"] },
      date: { $gte: twoAgoStart, $lte: now },
    })
      .select("amount category type note date")
      .lean(),
    User.findById(userObjectId).select("categoryBudgets").lean(),
  ]);

  const txs: Tx[] = rows.map((r) => ({
    amount: r.amount || 0,
    category: r.category,
    type: r.type,
    note: r.note,
    date: new Date(r.date),
  }));

  const expenses = txs.filter((t) => t.type === "expense");
  const thisMonth = expenses.filter((t) => t.date >= thisStart);
  const lastMonthAll = expenses.filter((t) => t.date >= lastStart && t.date < thisStart);
  const lastMonthToDate = lastMonthAll.filter((t) => t.date < lastSamePoint);
  const twoAgo = expenses.filter((t) => t.date >= twoAgoStart && t.date < lastStart);

  const out: SpendingInsight[] = [];
  if (thisMonth.length === 0 && lastMonthAll.length === 0) return out;

  const thisTotal = thisMonth.reduce((s, t) => s + t.amount, 0);
  const lastTotal = lastMonthAll.reduce((s, t) => s + t.amount, 0);
  const lastToDateTotal = lastMonthToDate.reduce((s, t) => s + t.amount, 0);

  // 1. Month pace: projected total vs last month.
  if (dayOfMonth >= 5 && thisTotal > 0 && lastTotal > 0) {
    const projected = (thisTotal / dayOfMonth) * daysInMonth;
    const diffPct = Math.round(((projected - lastTotal) / lastTotal) * 100);
    if (Math.abs(diffPct) >= 10) {
      const up = diffPct > 0;
      out.push({
        id: "pace",
        kind: "pace",
        tone: up ? (diffPct >= 25 ? "urgent" : "watch") : "good",
        title: up
          ? `On pace to spend ${diffPct}% more than last month`
          : `On pace to spend ${-diffPct}% less than last month`,
        detail: `Projected ${inr(projected)} vs ${inr(lastTotal)} last month.`,
      });
    }
  }

  // 2. Category changes vs the same point last month.
  const thisCats = sumByCategory(thisMonth);
  const lastCats = sumByCategory(lastMonthToDate);
  const changes: SpendingInsight[] = [];
  for (const [key, cur] of thisCats) {
    const prev = lastCats.get(key)?.total ?? 0;
    if (prev <= 0) continue;
    const delta = cur.total - prev;
    const pct = Math.round((delta / prev) * 100);
    if (Math.abs(delta) < 500 || Math.abs(pct) < 30) continue;
    changes.push({
      id: `cat-${key}`,
      kind: delta > 0 ? "category_up" : "category_down",
      tone: delta > 0 ? (pct >= 75 ? "urgent" : "watch") : "good",
      title: `${cur.label} ${delta > 0 ? "up" : "down"} ${Math.abs(pct)}%`,
      detail: `${inr(cur.total)} so far vs ${inr(prev)} by this date last month.`,
    });
  }
  changes.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]);
  out.push(...changes.slice(0, 3));

  // 3. Budget forecast: which category will break its limit, and roughly when.
  for (const b of user?.categoryBudgets ?? []) {
    if (!b.limit || b.limit <= 0 || dayOfMonth < 3) continue;
    const spent = thisCats.get(b.category.toLowerCase())?.total ?? 0;
    if (spent <= 0) continue;
    const label = titleCase(b.category);
    if (spent >= b.limit) {
      out.push({
        id: `budget-${b.category}`,
        kind: "budget_forecast",
        tone: "urgent",
        title: `${label} budget used up`,
        detail: `${inr(spent)} spent of ${inr(b.limit)}, ${inr(spent - b.limit)} over.`,
      });
      continue;
    }
    const perDay = spent / dayOfMonth;
    const projected = perDay * daysInMonth;
    if (projected > b.limit) {
      const breakDay = Math.min(daysInMonth, Math.ceil(b.limit / perDay));
      out.push({
        id: `budget-${b.category}`,
        kind: "budget_forecast",
        tone: "watch",
        title: `${label} will cross budget around the ${ordinal(breakDay)}`,
        detail: `At this pace ${inr(projected)} vs a ${inr(b.limit)} limit.`,
      });
    }
  }

  // 4. Biggest single expense this month.
  if (thisMonth.length >= 3) {
    const big = thisMonth.reduce((a, b) => (b.amount > a.amount ? b : a));
    const share = thisTotal > 0 ? Math.round((big.amount / thisTotal) * 100) : 0;
    if (share >= 20) {
      out.push({
        id: "big",
        kind: "big_expense",
        tone: "info",
        title: `One expense is ${share}% of this month's spend`,
        detail: `${inr(big.amount)} on ${titleCase(big.note || big.category)} (${titleCase(big.category)}).`,
      });
    }
  }

  // 5. Weekend vs weekday daily average (last ~60 days).
  const recent = expenses.filter((t) => t.date >= new Date(now.getTime() - 60 * DAY_MS));
  if (recent.length >= 10) {
    let wkEnd = 0;
    let wkDay = 0;
    for (const t of recent) {
      const dow = ist(t.date).getUTCDay();
      if (dow === 0 || dow === 6) wkEnd += t.amount;
      else wkDay += t.amount;
    }
    // About 60 days: roughly 17 weekend days and 43 weekdays.
    const endAvg = wkEnd / 17;
    const dayAvg = wkDay / 43;
    if (dayAvg > 0 && endAvg / dayAvg >= 1.5) {
      out.push({
        id: "weekend",
        kind: "weekend",
        tone: "info",
        title: `Weekends cost ${(endAvg / dayAvg).toFixed(1)}× more`,
        detail: `${inr(endAvg)}/day on weekends vs ${inr(dayAvg)}/day on weekdays.`,
      });
    }
  }

  // 6. Repeated small habit (same note, 4+ times this month).
  const habits = new Map<string, { label: string; count: number; total: number }>();
  for (const t of thisMonth) {
    const k = (t.note || "").trim().toLowerCase();
    if (!k || k.length < 3) continue;
    const h = habits.get(k) ?? { label: titleCase(t.note!.trim()), count: 0, total: 0 };
    h.count += 1;
    h.total += t.amount;
    habits.set(k, h);
  }
  const topHabit = [...habits.values()]
    .filter((h) => h.count >= 4)
    .sort((a, b) => b.total - a.total)[0];
  if (topHabit) {
    const monthly = (topHabit.total / dayOfMonth) * daysInMonth;
    out.push({
      id: "habit",
      kind: "habit",
      tone: "info",
      title: `${topHabit.label} ×${topHabit.count} this month`,
      detail: `${inr(topHabit.total)} so far, about ${inr(monthly * 12)} a year at this rate.`,
    });
  }

  // 7. New category this month (none in the previous two months).
  const seenBefore = new Set(
    [...lastMonthAll, ...twoAgo].map((t) => (t.category || "").toLowerCase())
  );
  const fresh = [...thisCats.entries()].filter(
    ([k, v]) => !seenBefore.has(k) && v.total >= 500
  );
  if (fresh.length && (lastMonthAll.length || twoAgo.length)) {
    const [, v] = fresh.sort((a, b) => b[1].total - a[1].total)[0];
    out.push({
      id: "new-cat",
      kind: "new_category",
      tone: "info",
      title: `New spending in ${v.label}`,
      detail: `${inr(v.total)} this month, with nothing in the previous two months.`,
    });
  }

  // 8. No-spend days so far this month.
  if (dayOfMonth >= 7) {
    const spendDays = new Set(thisMonth.map((t) => ist(t.date).getUTCDate()));
    const noSpend = dayOfMonth - spendDays.size;
    if (noSpend >= 3) {
      out.push({
        id: "no-spend",
        kind: "no_spend",
        tone: "good",
        title: `${noSpend} no-spend days this month`,
        detail: `You spent nothing on ${noSpend} of ${dayOfMonth} days.`,
      });
    }
  }

  // 9. Income vs last month (only once enough of the month has passed).
  const incThis = txs.filter((t) => t.type === "income" && t.date >= thisStart);
  const incLast = txs.filter(
    (t) => t.type === "income" && t.date >= lastStart && t.date < thisStart
  );
  const incThisTotal = incThis.reduce((s, t) => s + t.amount, 0);
  const incLastTotal = incLast.reduce((s, t) => s + t.amount, 0);
  if (dayOfMonth >= 25 && incLastTotal > 0) {
    const pct = Math.round(((incThisTotal - incLastTotal) / incLastTotal) * 100);
    if (Math.abs(pct) >= 15) {
      out.push({
        id: "income",
        kind: "income",
        tone: pct > 0 ? "good" : "watch",
        title: `Income ${pct > 0 ? "up" : "down"} ${Math.abs(pct)}% vs last month`,
        detail: `${inr(incThisTotal)} vs ${inr(incLastTotal)}.`,
      });
    }
  }

  // Overall vs same point last month, used as a fallback when nothing else fired.
  if (out.length === 0 && lastToDateTotal > 0 && thisTotal > 0) {
    out.push({
      id: "steady",
      kind: "pace",
      tone: "good",
      title: "Spending is steady",
      detail: `${inr(thisTotal)} so far vs ${inr(lastToDateTotal)} by this date last month.`,
    });
  }

  return out.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone]);
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const TONE_EMOJI: Record<InsightTone, string> = {
  urgent: "🚨",
  watch: "⚠️",
  good: "✅",
  info: "💡",
};

/** Plain-text Telegram message (no parse_mode, so no escaping needed). */
export function formatInsightsForTelegram(
  insights: SpendingInsight[],
  heading = "Today's insights"
): string {
  if (insights.length === 0) {
    return `📈 ${heading}\n\nNothing notable yet. Keep logging and insights will show up here.`;
  }
  const lines = insights
    .slice(0, 5)
    .map((i) => `${TONE_EMOJI[i.tone]} ${i.title}\n   ${i.detail}`);
  return `📈 ${heading}\n\n${lines.join("\n\n")}`;
}
