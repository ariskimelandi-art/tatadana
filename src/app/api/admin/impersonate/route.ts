import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { adminId, targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ ok: false, error: "targetUserId wajib diisi" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Verify admin
    if (adminId) {
      const { data: admin } = await supabase.from("profiles").select("role").eq("id", adminId).single();
      if (admin?.role !== "admin") {
        return NextResponse.json({ ok: false, error: "Hanya admin yang boleh melakukan impersonasi" }, { status: 403 });
      }
    }

    const { data: targetProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (error || !targetProfile) {
      return NextResponse.json({ ok: false, error: "User tidak ditemukan" }, { status: 404 });
    }

    // Log impersonation action in audit logs
    await supabase.from("admin_audit_logs").insert({
      admin_id: adminId || null,
      target_user_id: targetUserId,
      action: "IMPERSONATE_USER",
      details: { target_name: targetProfile.full_name },
      ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    const response = NextResponse.json({
      ok: true,
      message: `Impersonasi sebagai ${targetProfile.full_name} aktif.`,
      targetProfile,
    });

    // Set impersonation cookie
    response.cookies.set("tatadana_impersonate_user_id", targetUserId, {
      path: "/",
      httpOnly: false,
      maxAge: 3600, // 1 hour
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true, message: "Impersonasi dihentikan." });
  response.cookies.delete("tatadana_impersonate_user_id");
  return response;
}
