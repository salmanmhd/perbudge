"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/user";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";
import {
  computeSnapshotForUser,
  formatSnapshotContext,
} from "@/lib/actions/finance-snapshot";
import { generateDigestFromContext } from "@/lib/ai/digest";
import { renderWeeklyReportEmail } from "@/lib/email/weekly-report";
import { sendEmail } from "@/lib/email/send";

/** Send a weekly report to the current user right now (test / on-demand). */
export async function sendTestReport() {
  const userObjectId = await ensureUserInDb();
  const { userId } = await auth();
  if (!userObjectId || !userId) return { success: false, error: "Unauthorized" };

  const user: any = await User.findOne({ clerkId: userId }).lean();
  if (!user?.email) return { success: false, error: "No email on file." };

  const snapshot = await computeSnapshotForUser(userObjectId as any, user);
  if (snapshot.recentCount === 0) {
    return { success: false, error: "Log some transactions first." };
  }

  const context = formatSnapshotContext(snapshot);
  const digest = await generateDigestFromContext(context);
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://perbudge.app";
  const { subject, html } = renderWeeklyReportEmail(snapshot, digest, url);

  const result = await sendEmail({ to: user.email, subject, html });
  if (result.skipped) {
    return {
      success: false,
      error: "Email isn't configured yet (set RESEND_API_KEY).",
    };
  }
  if (!result.success) return { success: false, error: result.error };
  return { success: true, email: user.email };
}

export async function setWeeklyReportEnabled(enabled: boolean) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };
  await connectToDatabase();
  await User.updateOne({ clerkId: userId }, { $set: { weeklyReportEnabled: enabled } });
  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getWeeklyReportEnabled(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return true;
  await connectToDatabase();
  const user: any = await User.findOne({ clerkId: userId }).lean();
  return user?.weeklyReportEnabled ?? true;
}
