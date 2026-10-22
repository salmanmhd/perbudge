import { NextRequest, NextResponse } from "next/server";
import { setTelegramWebhook, getTelegramWebhookInfo } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (!configuredSecret || secret !== configuredSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const action = searchParams.get("action");
    if (action === "info") {
      const info = await getTelegramWebhookInfo();
      return NextResponse.json(info);
    }

    // Determine webhook URL
    const customUrl = searchParams.get("url");
    let webhookBase =
      customUrl ||
      process.env.NEXT_PUBLIC_APP_URL ||
      `${req.headers.get("x-forwarded-proto") || "https"}://${req.headers.get("host")}`;

    // Ensure it ends with /api/telegram/webhook
    const webhookUrl = webhookBase.endsWith("/api/telegram/webhook")
      ? webhookBase
      : `${webhookBase.replace(/\/$/, "")}/api/telegram/webhook`;

    const result = await setTelegramWebhook(webhookUrl, configuredSecret);

    return NextResponse.json({
      success: result.ok,
      webhookUrl,
      telegramResponse: result,
    });
  } catch (error: any) {
    console.error("Webhook setup error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to setup webhook" },
      { status: 500 }
    );
  }
}
