import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { TelegramBot } from "@/lib/telegram/bot";
import { encryptApiKey, decryptApiKey } from "@/lib/utils/encryption";

export async function POST(req: NextRequest) {
  try {
    const { token, userId } = await req.json();

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: "Token bot tidak boleh kosong" },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();
    const bot = new TelegramBot(cleanToken);

    // 1. Call GET /getMe
    const getMeRes = await bot.getMe();
    if (!getMeRes.ok) {
      return NextResponse.json({
        ok: false,
        error: getMeRes.description || "Token bot tidak valid atau tidak dikenali oleh Telegram API",
      });
    }

    const botInfo = getMeRes.result;
    const botUsername = botInfo.username;

    // 2. Check token uniqueness in database
    const supabase = getAdminClient();
    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, telegram_bot_token")
      .not("telegram_bot_token", "is", null);

    if (existingProfiles && existingProfiles.length > 0) {
      const isTaken = existingProfiles.some((p) => {
        if (p.id === userId) return false;
        if (!p.telegram_bot_token) return false;
        // Check both plain and decrypted match
        return p.telegram_bot_token === cleanToken || decryptApiKey(p.telegram_bot_token) === cleanToken;
      });

      if (isTaken) {
        return NextResponse.json({
          ok: false,
          error: "Token ini sudah digunakan oleh akun lain. Satu bot hanya bisa ditautkan ke satu akun.",
        });
      }
    }

    // 3. Set Webhook automatically to ensure messages route into TataDana
    const baseUrl = process.env.WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    let webhookResult = null;
    if (baseUrl) {
      const webhookUrl = `${baseUrl.replace(/\/$/, "")}/api/telegram/webhook`;
      webhookResult = await bot.setWebhook(webhookUrl);
    }

    // 4. Save encrypted token to user profile if userId provided
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          telegram_bot_token: encryptApiKey(cleanToken),
          telegram_username: botUsername,
        })
        .eq("id", userId);
    }

    return NextResponse.json({
      ok: true,
      bot: {
        id: botInfo.id,
        first_name: botInfo.first_name,
        username: botUsername,
      },
      webhook: webhookResult,
      message: `🟢 Bot @${botUsername} berhasil terhubung! Webhook aktif.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Terjadi kesalahan saat memeriksa token bot" },
      { status: 500 }
    );
  }
}
