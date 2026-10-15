import { NextRequest, NextResponse } from "next/server";
import { TelegramBot } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  try {
    const { token, url } = await req.json();
    const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = url || `${(process.env.WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")}/api/telegram/webhook`;

    if (!botToken) {
      return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN belum diset" }, { status: 400 });
    }

    if (!webhookUrl || !webhookUrl.startsWith("https://")) {
      return NextResponse.json({ ok: false, error: "Webhook URL harus berawalan HTTPS yang valid" }, { status: 400 });
    }

    const bot = new TelegramBot(botToken);
    const result = await bot.setWebhook(webhookUrl);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
