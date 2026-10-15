import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, otpCode, userId } = await req.json();

    if (!phoneNumber || !otpCode) {
      return NextResponse.json({ ok: false, error: "Nomor HP dan kode OTP wajib diisi" }, { status: 400 });
    }

    let cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

    const supabase = getAdminClient();

    // Check verification record
    const { data: record, error } = await supabase
      .from("phone_verifications")
      .select("*")
      .eq("phone_number", cleanPhone)
      .eq("otp_code", otpCode.trim())
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !record) {
      return NextResponse.json({ ok: false, error: "Kode OTP salah atau telah kadaluarsa" }, { status: 400 });
    }

    // Mark verified
    await supabase.from("phone_verifications").update({ verified: true }).eq("id", record.id);

    // If userId provided, update profile
    if (userId) {
      await supabase
        .from("profiles")
        .update({
          phone_number: cleanPhone,
          phone_verified: true,
        })
        .eq("id", userId);
    }

    return NextResponse.json({
      ok: true,
      message: "Nomor HP berhasil diverifikasi!",
      phoneNumber: cleanPhone,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
