import { NextRequest, NextResponse } from "next/server";
import { AIRouter } from "@/lib/ai/router";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history, userId } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { ok: false, error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const result = await AIRouter.chat({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      userId,
    });

    return NextResponse.json({
      ok: true,
      message: result.content,
      quickActions: result.quickActions || [],
    });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Gagal memproses pesan chat.",
      },
      { status: 500 }
    );
  }
}
