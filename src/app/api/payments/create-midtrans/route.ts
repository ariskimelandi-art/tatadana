import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { MidtransClient } from "@/lib/midtrans/client";

export async function POST(req: NextRequest) {
  try {
    const { userId, plan } = await req.json();

    if (!userId || !plan) {
      return NextResponse.json({ ok: false, error: "userId dan plan wajib diisi" }, { status: 400 });
    }

    const price = plan === "pro" ? 99000 : 49000;
    const orderId = `TATADANA-${plan.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const supabase = getAdminClient();
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (!profile) {
      return NextResponse.json({ ok: false, error: "Profil tidak ditemukan" }, { status: 404 });
    }

    const snap = await MidtransClient.createTransaction({
      orderId,
      grossAmount: price,
      customerName: profile.full_name,
      customerPhone: profile.phone_number || undefined,
      planName: plan === "pro" ? "Pro (Sekali Bayar)" : "Starter (Bulanan)",
    });

    // Save record
    await supabase.from("payment_transactions").insert({
      user_id: userId,
      order_id: orderId,
      plan,
      amount: price,
      payment_method: "midtrans",
      status: "pending",
      midtrans_snap_token: snap.token,
    });

    return NextResponse.json({
      ok: true,
      token: snap.token,
      redirect_url: snap.redirect_url,
      order_id: orderId,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
