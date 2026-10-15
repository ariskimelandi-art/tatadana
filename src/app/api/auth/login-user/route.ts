import { NextRequest, NextResponse } from "next/server";
import { findStoredUserByEmail, registerOrUpdateStoredUser } from "@/lib/storage/local-users";
import { getAdminClient } from "@/lib/supabase/admin";

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com").toLowerCase();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === ADMIN_EMAIL;

    // 1. If admin login
    if (isAdmin) {
      const adminUser = findStoredUserByEmail(cleanEmail) || registerOrUpdateStoredUser({
        email: cleanEmail,
        full_name: "Gening Kim (Superadmin)",
        password,
      });

      const response = NextResponse.json({
        ok: true,
        is_admin: true,
        approval_status: "approved",
        user: adminUser,
        message: "Login admin berhasil.",
      });

      // Set admin session cookie
      response.cookies.set("tatadana_admin_session", "authenticated", {
        path: "/",
        httpOnly: false,
        maxAge: 86400, // 24 hours
      });
      response.cookies.set("tatadana_user_email", cleanEmail, {
        path: "/",
        httpOnly: false,
        maxAge: 86400,
      });

      return response;
    }

    // 2. Regular user lookup
    let user = findStoredUserByEmail(cleanEmail);

    // If user not in local store, try Supabase or register as test
    if (!user) {
      user = registerOrUpdateStoredUser({
        email: cleanEmail,
        full_name: cleanEmail.split("@")[0],
        password,
      });
    }

    const isApproved = user.approval_status === "approved" || user.role === "admin";

    const response = NextResponse.json({
      ok: true,
      is_admin: false,
      approval_status: user.approval_status,
      is_approved: isApproved,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        approval_status: user.approval_status,
      },
    });

    // Clear admin cookie if logging in as regular user
    response.cookies.delete("tatadana_admin_session");
    response.cookies.set("tatadana_user_email", cleanEmail, {
      path: "/",
      httpOnly: false,
      maxAge: 86400,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Gagal masuk." },
      { status: 500 }
    );
  }
}
