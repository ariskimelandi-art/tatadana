import { NextRequest, NextResponse } from "next/server";
import { getAllStoredUsers } from "@/lib/storage/local-users";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const localUsers = getAllStoredUsers();

    // Optionally merge with Supabase profiles if available
    try {
      const supabase = getAdminClient();
      const { data: sbProfiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (sbProfiles && sbProfiles.length > 0) {
        // Merge without duplicating
        const localEmails = new Set(localUsers.map((u) => u.email?.toLowerCase()));
        for (const sp of sbProfiles) {
          if (sp.email && !localEmails.has(sp.email.toLowerCase())) {
            localUsers.push(sp);
          }
        }
      }
    } catch {
      // Ignore in local dev
    }

    return NextResponse.json({
      ok: true,
      users: localUsers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Gagal memuat data pengguna" },
      { status: 500 }
    );
  }
}
