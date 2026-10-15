import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { encryptApiKey, maskApiKey } from "@/lib/utils/encryption";

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("ai_providers")
      .select("*")
      .order("priority", { ascending: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // Mask the encrypted keys before sending to UI for security
    const sanitized = (data || []).map((p) => ({
      ...p,
      api_key_masked: maskApiKey(p.api_key_encrypted),
    }));

    return NextResponse.json({ ok: true, providers: sanitized });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { provider_name, model_name, api_key, is_active, is_default, priority, failover_mode } = await req.json();

    if (!provider_name || !api_key) {
      return NextResponse.json({ ok: false, error: "Provider name dan API key wajib diisi" }, { status: 400 });
    }

    const encryptedKey = encryptApiKey(api_key);
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from("ai_providers")
      .insert({
        provider_name,
        model_name: model_name || (provider_name === "gemini" ? "gemini-2.0-flash" : provider_name === "openai" ? "gpt-4o-mini" : "deepseek-chat"),
        api_key_encrypted: encryptedKey,
        is_active: is_active ?? true,
        is_default: is_default ?? false,
        priority: priority ?? 1,
        failover_mode: failover_mode ?? "parallel",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, provider: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, error: "ID provider wajib disertakan" }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase.from("ai_providers").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: "Provider AI berhasil dihapus" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
