"use server";

import { auth } from "@clerk/nextjs/server";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/user";

export async function getTelegramStatus(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  await connectToDatabase();
  const user = await User.findOne({ clerkId: userId }).select("telegramChatId").lean<{
    telegramChatId?: number;
  }>();

  return Boolean(user?.telegramChatId);
}

