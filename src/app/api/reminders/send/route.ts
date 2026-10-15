import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { TelegramBot } from "@/lib/telegram/bot";
import { formatDailyReminderReply } from "@/lib/telegram/formatter";

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    const bot = new TelegramBot();

    // Query all active reminders where profile has telegram_chat_id
    const { data: reminders, error } = await supabase
      .from("reminders")
      .select("*, profile:user_id(id, full_name, telegram_chat_id)")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    let sentCount = 0;
    for (const rem of reminders || []) {
      const chatId = rem.profile?.telegram_chat_id;
      if (chatId) {
        const messageText = formatDailyReminderReply(rem.custom_message);
        await bot.sendMessage(chatId, messageText);
        sentCount++;
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Berhasil mengirim reminder harian ke ${sentCount} pengguna.`,
      sentCount,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
