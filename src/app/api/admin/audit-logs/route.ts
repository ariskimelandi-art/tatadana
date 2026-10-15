import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { adminId, targetUserId, reason } = await req.json();

    if (!adminId || !targetUserId) {
      return NextResponse.json({ ok: false, error: "adminId dan targetUserId wajib diisi" }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Verify admin privileges
    const { data: adminUser } = await supabase.from("profiles").select("role").eq("id", adminId).single();
    if (adminUser?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Akses ditolak" }, { status: 403 });
    }

    // 1. Log audit record
    await supabase.from("admin_audit_logs").insert({
      admin_id: adminId,
      target_user_id: targetUserId,
      action: "VIEW_USER_TRANSACTIONS",
      details: { reason: reason || "Troubleshooting & Customer Support" },
      ip_address: req.headers.get("x-forwarded-for") || "127.0.0.1",
    });

    // 2. Fetch target user's transactions
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*, category:category_id(*), wallet:wallet_id(*)")
      .eq("user_id", targetUserId)
      .order("transaction_date", { ascending: false });

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    return NextResponse.json({
      ok: true,
      profile: targetProfile,
      transactions: transactions || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
