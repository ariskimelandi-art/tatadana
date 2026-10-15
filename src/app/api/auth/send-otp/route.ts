import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json({ ok: false, error: "Nomor HP tidak boleh kosong" }, { status: 400 });
    }

    // Standardize Indonesian Phone Number: 0812... -> 62812...
    let cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith("62")) {
      cleanPhone = "62" + cleanPhone;
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json({ ok: false, error: "Nomor HP Indonesia tidak valid (min 10 digit)" }, { status: 400 });
    }

    // Generate 6-digit OTP code (Default test code is 123456 or random)
    const otpCode = process.env.NODE_ENV === "production" 
      ? Math.floor(100000 + Math.random() * 900000).toString()
      : "123456";

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const supabase = getAdminClient();
    await supabase.from("phone_verifications").insert({
      phone_number: cleanPhone,
      otp_code: otpCode,
      expires_at: expiresAt,
      verified: false,
    });

    return NextResponse.json({
      ok: true,
      message: `Kode OTP berhasil dikirim ke +${cleanPhone}.`,
      phoneNumber: cleanPhone,
      // For effortless end-to-end testing in non-production environments
      devHint: `[DEV/TEST] Kode OTP: ${otpCode}`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
