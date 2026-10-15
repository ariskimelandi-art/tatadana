import { NextRequest, NextResponse } from "next/server";
import { getAllStoredUsers, saveStoredUsers, registerOrUpdateStoredUser, StoredUser } from "@/lib/storage/local-users";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const localUsers = getAllStoredUsers();

    // Optionally merge with Supabase profiles if available
    try {
      const supabase = getAdminClient();
      const { data: sbProfiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (sbProfiles && sbProfiles.length > 0) {
        const localEmailMap = new Map(localUsers.map((u) => [u.email?.toLowerCase(), u]));
        for (const sp of sbProfiles) {
          const email = sp.email?.toLowerCase();
          if (email && !localEmailMap.has(email)) {
            localUsers.push(sp);
          } else if (email && localEmailMap.has(email)) {
            // Keep approval_status in sync
            const local = localEmailMap.get(email);
            if (local && sp.approval_status && sp.approval_status !== local.approval_status) {
              local.approval_status = sp.approval_status;
            }
          }
        }
      }
    } catch {
      // Ignore in local dev
    }

    const res = NextResponse.json({
      ok: true,
      users: localUsers,
    });

    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Gagal memuat data pengguna" },
      { status: 500 }
    );
  }
}

// Client synchronization endpoint: if client has pending users from registration, sync them
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const incomingUsers: any[] = Array.isArray(body.users) ? body.users : body.user ? [body.user] : [];

    for (const u of incomingUsers) {
      if (u.email) {
        registerOrUpdateStoredUser({
          id: u.id,
          email: u.email,
          full_name: u.full_name || u.name || u.email.split("@")[0],
          phone_number: u.phone_number || u.phone || "",
        });
      }
    }

    return NextResponse.json({
      ok: true,
      users: getAllStoredUsers(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
