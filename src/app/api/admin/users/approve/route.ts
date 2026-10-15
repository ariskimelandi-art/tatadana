import { NextRequest, NextResponse } from "next/server";
import { updateStoredUserApproval, findStoredUserById, findStoredUserByEmail } from "@/lib/storage/local-users";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { userId, action, adminEmail } = await req.json();

    if (!userId || !action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Parameter userId dan action ('approve' | 'reject') wajib diisi." },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // 1. Update in local persistent store
    const updatedLocalUser = updateStoredUserApproval(userId, newStatus);

    // 2. Also update in Supabase
    try {
      const supabase = getAdminClient();
      await supabase
        .from("profiles")
        .update({
          approval_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${userId},email.eq.${userId}`);

      // Audit log in Supabase
      await supabase.from("admin_audit_logs").insert({
        admin_id: "00000000-0000-0000-0000-000000000000",
        action: action === "approve" ? "approve_user_registration" : "reject_user_registration",
        target_user_id: userId,
        details: {
          admin_email: adminEmail || "geninggkimteaa@gmail.com",
          new_status: newStatus,
          timestamp_wib: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
        },
      });
    } catch {
      // Ignored in local dev fallback
    }

    const targetName = updatedLocalUser?.full_name || "Pengguna";

    return NextResponse.json({
      ok: true,
      message: action === "approve"
        ? `Akun ${targetName} (${updatedLocalUser?.email || userId}) berhasil disetujui! Pengguna kini dapat langsung mengakses dashboard.`
        : `Akun ${targetName} telah ditolak.`,
      user: updatedLocalUser || { id: userId, approval_status: newStatus },
    });
  } catch (error: any) {
    console.error("Approve user error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
