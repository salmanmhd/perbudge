import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/db";
import User from "@/lib/models/user";
import { ensureUserInDb } from "@/lib/actions/dashboard-data";

export async function GET() {
  try {
    const userObjectId = await ensureUserInDb();
    if (!userObjectId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(userObjectId).select("telegramChatId");

    return NextResponse.json({
      isLinked: Boolean(user?.telegramChatId),
      botUsername: process.env.TELEGRAM_BOT_USERNAME || "perbudge_bot",
    });
  } catch (error: any) {
    console.error("Failed to check telegram link status:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const userObjectId = await ensureUserInDb();
    if (!userObjectId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const token = "link_" + crypto.randomBytes(16).toString("hex");

    await User.findByIdAndUpdate(userObjectId, {
      telegramLinkToken: token,
    });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || "perbudge_bot";
    const url = `https://t.me/${botUsername}?start=${token}`;

    return NextResponse.json({
      url,
      isLinked: false,
    });
  } catch (error: any) {
    console.error("Failed to generate telegram link token:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const userObjectId = await ensureUserInDb();
    if (!userObjectId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    await User.findByIdAndUpdate(userObjectId, {
      $unset: { telegramChatId: 1, telegramLinkToken: 1 },
    });

    return NextResponse.json({
      success: true,
      isLinked: false,
    });
  } catch (error: any) {
    console.error("Failed to unlink telegram account:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
