import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { TelegramBot } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const orderId = payload.order_id;
    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Missing order_id" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Find payment record
    const { data: paymentRecord } = await supabase
      .from("payment_transactions")
      .select("*, profile:user_id(*)")
      .eq("order_id", orderId)
      .maybeSingle();

    if (!paymentRecord) {
      return NextResponse.json({ ok: false, error: "Payment not found" }, { status: 404 });
    }

    let isSuccess = false;
    if (transactionStatus === "capture") {
      if (fraudStatus === "accept") isSuccess = true;
    } else if (transactionStatus === "settlement") {
      isSuccess = true;
    }

    if (isSuccess) {
      // 1. Mark payment as paid
      await supabase
        .from("payment_transactions")
        .update({
          status: "paid",
          midtrans_response: payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentRecord.id);

      // 2. Upgrade user profile plan
      await supabase
        .from("profiles")
        .update({
          plan: paymentRecord.plan,
        })
        .eq("id", paymentRecord.user_id);

      // 3. Send Telegram notification if user connected
      if (paymentRecord.profile?.telegram_chat_id) {
        const bot = new TelegramBot();
        await bot.sendMessage(
          paymentRecord.profile.telegram_chat_id,
          `🎉 Selamat! Akun Anda telah berhasil di-upgrade ke TataDana ${paymentRecord.plan.toUpperCase()}!\n\nSekarang Anda dapat menikmati fitur unlimited transaksi, scan foto struk OCR, laporan lengkap, dan AI Financial Advisor.`
        );
      }
    } else if (transactionStatus === "cancel" || transactionStatus === "deny" || transactionStatus === "expire") {
      await supabase
        .from("payment_transactions")
        .update({
          status: "rejected",
          midtrans_response: payload,
        })
        .eq("id", paymentRecord.id);
    }

    return NextResponse.json({ ok: true, status: isSuccess ? "upgraded" : "updated" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
