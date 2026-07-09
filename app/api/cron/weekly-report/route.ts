import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/user";
import {
  computeSnapshotForUser,
  formatSnapshotContext,
} from "@/lib/actions/finance-snapshot";
import { generateDigestFromContext } from "@/lib/ai/digest";
import { renderWeeklyReportEmail } from "@/lib/email/weekly-report";
import { sendEmail } from "@/lib/email/send";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function appUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    req.nextUrl.origin ||
    "https://perbudge.app"
  );
}

/**
 * Weekly report cron. Vercel Cron calls this with
 * `Authorization: Bearer ${CRON_SECRET}`. Iterates opted-in users,
 * builds each one's AI digest, and emails the report.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const users = await User.find({ weeklyReportEnabled: { $ne: false } }).lean();
  const url = appUrl(req);

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of users as any[]) {
    try {
      const snapshot = await computeSnapshotForUser(user._id, user);
      if (snapshot.recentCount === 0) {
        skipped++;
        continue;
      }
      const context = formatSnapshotContext(snapshot);
      const digest = await generateDigestFromContext(context);
      const { subject, html } = renderWeeklyReportEmail(snapshot, digest, url);
      const result = await sendEmail({ to: user.email, subject, html });
      if (result.success) sent++;
      else {
        skipped++;
        if (!result.skipped && result.error) errors.push(`${user.email}: ${result.error}`);
      }
    } catch (e: any) {
      errors.push(`${user.email}: ${e?.message || "failed"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    totalUsers: users.length,
    sent,
    skipped,
    errors: errors.slice(0, 20),
  });
}
