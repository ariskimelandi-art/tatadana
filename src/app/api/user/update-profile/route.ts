import { NextRequest, NextResponse } from "next/server";
import { getAllStoredUsers, saveStoredUsers, StoredUser } from "@/lib/storage/local-users";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { email, fullName, avatarUrl } = await req.json();

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email pengguna diperlukan." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Update in local persistent store
    const users = getAllStoredUsers();
    const idx = users.findIndex((u) => u.email?.toLowerCase() === cleanEmail);

    let updatedUser = null;
    if (idx >= 0) {
      users[idx] = {
        ...users[idx],
        full_name: fullName !== undefined ? fullName.trim() : users[idx].full_name,
        avatar_url: avatarUrl !== undefined ? avatarUrl : users[idx].avatar_url,
        updated_at: new Date().toISOString(),
      };
      saveStoredUsers(users);
      updatedUser = users[idx];
    } else {
      const newUser: StoredUser = {
        id: "usr-" + Date.now(),
        email: cleanEmail,
        full_name: fullName?.trim() || cleanEmail.split("@")[0],
        avatar_url: avatarUrl || null,
        phone_number: "6281234567890",
        phone_verified: true,
        telegram_chat_id: null,
        telegram_username: null,
        plan: "starter",
        role: "user",
        approval_status: "approved",
        currency: "IDR",
        monthly_tx_count: 0,
        last_tx_month: new Date().toISOString().slice(0, 7),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      users.push(newUser);
      saveStoredUsers(users);
      updatedUser = newUser;
    }

    // 2. Update in Supabase
    try {
      const supabase = getAdminClient();
      await supabase
        .from("profiles")
        .update({
          full_name: fullName?.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .ilike("email", cleanEmail);
    } catch {
      // Ignored in dev fallback
    }

    return NextResponse.json({
      ok: true,
      message: "Profil dan foto berhasil diperbarui!",
      user: updatedUser || { email: cleanEmail, full_name: fullName, avatar_url: avatarUrl },
    });
  } catch (error: any) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Gagal memperbarui profil." },
      { status: 500 }
    );
  }
}
