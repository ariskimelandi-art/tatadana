import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { userId, plan, proofImageUrl } = await req.json();

    if (!userId || !plan) {
      return NextResponse.json({ ok: false, error: "userId dan plan harus disertakan" }, { status: 400 });
    }

    const price = plan === "pro" ? 99000 : 49000;
    const orderId = `TATADANA-MANUAL-${plan.toUpperCase()}-${Date.now()}`;

    const supabase = getAdminClient();

    const { data, error } = await supabase.from("payment_transactions").insert({
      user_id: userId,
      order_id: orderId,
      plan,
      amount: price,
      payment_method: "manual_transfer",
      status: "pending",
      proof_image_url: proofImageUrl || "/mock-proof.jpg",
    }).select().single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Bukti transfer berhasil dikirim. Menunggu verifikasi admin (maksimal 1x24 jam).",
      payment: data,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
