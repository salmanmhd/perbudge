import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/user";
import { sendTelegramMessage } from "@/lib/telegram";
import { computeSpendingInsights, formatInsightsForTelegram } from "@/lib/spending-insights";
import { errorMessage } from "@/lib/errors";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily insights cron (15:30 UTC = 9 PM IST). Vercel Cron calls this with
 * `Authorization: Bearer ${CRON_SECRET}`. It messages every Telegram-linked user
 * who hasn't muted it, but only when there's something worth saying.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const users = await User.find({
    telegramChatId: { $exists: true, $ne: null },
    telegramDailyInsights: { $ne: false },
  })
    .select("_id telegramChatId")
    .lean();

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const u of users) {
    try {
      const insights = await computeSpendingInsights(u._id);
      // Only ping when there's a real signal: skip empty or "steady" days.
      const worth = insights.filter((i) => i.id !== "steady");
      if (worth.length === 0) {
        skipped++;
        continue;
      }
      const footer = "\n\nSend /insights off to mute these.";
      await sendTelegramMessage(
        u.telegramChatId!,
        formatInsightsForTelegram(worth, "Today's insights") + footer
      );
      sent++;
    } catch (e) {
      failures.push(`${u._id}: ${errorMessage(e, "failed")}`);
    }
  }

  return NextResponse.json({ ok: true, users: users.length, sent, skipped, failures });
}
