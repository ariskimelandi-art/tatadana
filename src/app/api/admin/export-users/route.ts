import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient();

    const { data: users, error } = await supabase
      .from("profiles")
      .select("id, full_name, phone_number, phone_verified, telegram_username, telegram_chat_id, plan, role, monthly_tx_count, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    if (format === "csv") {
      const headers = "ID,Nama,No HP,No HP Verified,Telegram Username,Telegram Chat ID,Plan,Role,Transaksi Bulan Ini,Tanggal Daftar\n";
      const rows = (users || [])
        .map((u) =>
          `"${u.id}","${u.full_name}","${u.phone_number || ""}","${u.phone_verified}","${u.telegram_username || ""}","${u.telegram_chat_id || ""}","${u.plan}","${u.role}","${u.monthly_tx_count}","${u.created_at}"`
        )
        .join("\n");

      return new NextResponse(headers + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="tatadana_users_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ ok: true, users: users || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
