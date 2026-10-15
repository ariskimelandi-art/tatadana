import { NextRequest, NextResponse } from "next/server";
import { registerOrUpdateStoredUser } from "@/lib/storage/local-users";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, phone, password } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json(
        { ok: false, error: "Nama dan email wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Save to persistent local store
    const storedUser = registerOrUpdateStoredUser({
      full_name: fullName.trim(),
      email: cleanEmail,
      phone_number: phone || "",
      password: password || "password123",
    });

    // 2. Also attempt saving to Supabase if configured
    try {
      const supabase = getAdminClient();
      await supabase.from("profiles").upsert({
        id: storedUser.id,
        email: cleanEmail,
        full_name: fullName.trim(),
        phone_number: phone || null,
        phone_verified: true,
        role: storedUser.role,
        approval_status: storedUser.approval_status,
        plan: storedUser.plan,
      });
    } catch (sbErr) {
      console.warn("Supabase background sync skipped in local mode:", sbErr);
    }

    return NextResponse.json({
      ok: true,
      user: {
        id: storedUser.id,
        full_name: storedUser.full_name,
        email: storedUser.email,
        approval_status: storedUser.approval_status,
        role: storedUser.role,
      },
      message: storedUser.role === "admin"
        ? "Akun Superadmin siap digunakan."
        : "Pendaftaran berhasil dicatat. Menunggu persetujuan Admin.",
    });
  } catch (error: any) {
    console.error("Register user error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Gagal mendaftarkan akun." },
      { status: 500 }
    );
  }
}
