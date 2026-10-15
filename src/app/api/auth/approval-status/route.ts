import { NextRequest, NextResponse } from "next/server";
import { findStoredUserByEmail, findStoredUserById } from "@/lib/storage/local-users";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");

    if (!email && !userId) {
      return NextResponse.json(
        { ok: false, error: "Email atau userId diperlukan" },
        { status: 400 }
      );
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com").toLowerCase();

    // Check if checking admin
    if (cleanEmail === ADMIN_EMAIL) {
      const adminStored = findStoredUserByEmail(cleanEmail);
      return NextResponse.json({
        ok: true,
        status: "approved",
        is_approved: true,
        role: "admin",
        email: cleanEmail,
        full_name: adminStored?.full_name || "Gening Kim (Superadmin)",
        avatar_url: adminStored?.avatar_url || null,
      });
    }

    // 1. Check local persistent store
    const localUser = cleanEmail
      ? findStoredUserByEmail(cleanEmail)
      : userId
      ? findStoredUserById(userId)
      : null;

    if (localUser) {
      const isApproved = localUser.approval_status === "approved" || localUser.role === "admin";
      return NextResponse.json({
        ok: true,
        status: localUser.approval_status,
        is_approved: isApproved,
        role: localUser.role,
        full_name: localUser.full_name,
        email: localUser.email,
        avatar_url: localUser.avatar_url || null,
      });
    }

    // 2. Fallback to Supabase if exists
    try {
      const supabase = getAdminClient();
      let query = supabase.from("profiles").select("id, email, full_name, role, approval_status, avatar_url");
      if (userId) query = query.eq("id", userId);
      else if (cleanEmail) query = query.ilike("email", cleanEmail);

      const { data: profile } = await query.maybeSingle();
      if (profile) {
        const isApproved = profile.approval_status === "approved" || profile.role === "admin";
        return NextResponse.json({
          ok: true,
          status: profile.approval_status,
          is_approved: isApproved,
          role: profile.role,
          full_name: profile.full_name,
          email: profile.email,
          avatar_url: profile.avatar_url || null,
        });
      }
    } catch {
      // Ignored
    }

    // If not found anywhere yet, default to pending
    return NextResponse.json({
      ok: true,
      status: "pending",
      is_approved: false,
      email: cleanEmail,
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Internal error" }, { status: 500 });
  }
}
