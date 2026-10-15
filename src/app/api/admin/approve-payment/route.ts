import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { TelegramBot } from "@/lib/telegram/bot";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, adminId, action } = await req.json(); // action: 'approve' | 'reject'

    if (!paymentId || !action) {
      return NextResponse.json({ ok: false, error: "paymentId dan action wajib diisi" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Verify admin
    if (adminId) {
      const { data: adminUser } = await supabase.from("profiles").select("role").eq("id", adminId).single();
      if (adminUser?.role !== "admin") {
        return NextResponse.json({ ok: false, error: "Akses ditolak: Hanya admin yang berwenang" }, { status: 403 });
      }
    }

    const { data: payment, error: pError } = await supabase
      .from("payment_transactions")
      .select("*, profile:user_id(*)")
      .eq("id", paymentId)
      .single();

    if (pError || !payment) {
      return NextResponse.json({ ok: false, error: "Pembayaran tidak ditemukan" }, { status: 404 });
    }

    if (action === "approve") {
      // 1. Update payment status to approved
      await supabase
        .from("payment_transactions")
        .update({
          status: "approved",
          approved_by: adminId || null,
          approved_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      // 2. Upgrade user profile plan
      await supabase
        .from("profiles")
        .update({
          plan: payment.plan,
        })
        .eq("id", payment.user_id);

      // 3. Log to audit logs
      await supabase.from("admin_audit_logs").insert({
        admin_id: adminId || null,
        target_user_id: payment.user_id,
        action: "APPROVE_MANUAL_PAYMENT",
        details: { payment_id: paymentId, order_id: payment.order_id, plan: payment.plan },
      });

      // 4. Send Telegram notification if user linked
      if (payment.profile?.telegram_chat_id) {
        const bot = new TelegramBot();
        await bot.sendMessage(
          payment.profile.telegram_chat_id,
          `🎉 Pembayaran Anda telah disetujui oleh admin!\n\nAkun Anda resmi di-upgrade ke paket ${payment.plan.toUpperCase()}. Nikmati seluruh fitur premium TataDana!`
        );
      }

      return NextResponse.json({ ok: true, message: `Pembayaran ${payment.order_id} berhasil disetujui.` });
    } else {
      // Reject
      await supabase
        .from("payment_transactions")
        .update({
          status: "rejected",
          approved_by: adminId || null,
          approved_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      await supabase.from("admin_audit_logs").insert({
        admin_id: adminId || null,
        target_user_id: payment.user_id,
        action: "REJECT_MANUAL_PAYMENT",
        details: { payment_id: paymentId, order_id: payment.order_id },
      });

      return NextResponse.json({ ok: true, message: `Pembayaran ${payment.order_id} ditolak.` });
    }
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
