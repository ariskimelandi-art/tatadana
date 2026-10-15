import { NextRequest, NextResponse } from "next/server";
import { GeminiService } from "@/lib/ai/gemini";
import { decryptApiKey } from "@/lib/utils/encryption";
import { getAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { occupation, monthlyIncomeRange, livingSituation, userId } = await req.json();

    let categories: Array<{ name: string; type: "expense" | "income"; icon: string; color: string }> = [];

    // Try AI if available
    try {
      const apiKey = process.env.GEMINI_API_KEY || "";
      if (apiKey) {
        const gemini = new GeminiService(apiKey);
        categories = await gemini.recommendCategories({
          occupation: occupation || "Karyawan Swasta",
          monthlyIncomeRange: monthlyIncomeRange || "Rp5.000.000 - Rp10.000.000",
          livingSituation: livingSituation || "Ngekos sendiri di kota besar",
        });
      }
    } catch (e) {
      console.warn("AI category recommendation fallback:", e);
    }

    // High quality tailored fallback based on occupation
    if (!categories || categories.length === 0) {
      if (/freelance|desainer|programmer|kreator/i.test(occupation || "")) {
        categories = [
          { name: "🍜 Makanan & Ngopi", type: "expense", icon: "☕", color: "#FF6B00" },
          { name: "💻 Software & Tools", type: "expense", icon: "💻", color: "#6366F1" },
          { name: "🚗 Transport Ojol", type: "expense", icon: "🛵", color: "#10B981" },
          { name: "🏠 Sewa Tempat & Wifi", type: "expense", icon: "🏠", color: "#EF4444" },
          { name: "👕 Belanja & Hobi", type: "expense", icon: "👕", color: "#EC4899" },
          { name: "💊 Suplemen & Sehat", type: "expense", icon: "💊", color: "#06B6D4" },
          { name: "💰 Pendapatan Klien", type: "income", icon: "💰", color: "#10B981" },
          { name: "📈 Passive Income", type: "income", icon: "📈", color: "#8B5CF6" },
        ];
      } else if (/mahasiswa|pelajar/i.test(occupation || "")) {
        categories = [
          { name: "🍜 Makan Warteg & Kantin", type: "expense", icon: "🍜", color: "#FF6B00" },
          { name: "📚 Buku & Fotokopi", type: "expense", icon: "📚", color: "#3B82F6" },
          { name: "🏠 Uang Kos & Listrik", type: "expense", icon: "🏠", color: "#EF4444" },
          { name: "🎮 Nongkrong & Game", type: "expense", icon: "🎮", color: "#8B5CF6" },
          { name: "🚗 Bensin & Motor", type: "expense", icon: "🚗", color: "#F59E0B" },
          { name: "💰 Kiriman Orang Tua", type: "income", icon: "💰", color: "#10B981" },
          { name: "💼 Kerja Part-time", type: "income", icon: "💼", color: "#06B6D4" },
        ];
      } else {
        // Karyawan default
        categories = [
          { name: "🍜 Makanan & Minuman", type: "expense", icon: "🍜", color: "#FF6B00" },
          { name: "🚗 Transportasi & Bensin", type: "expense", icon: "🚗", color: "#3B82F6" },
          { name: "🏠 Tagihan & Utilitas", type: "expense", icon: "🏠", color: "#EF4444" },
          { name: "👕 Belanja & Kebutuhan", type: "expense", icon: "👕", color: "#EC4899" },
          { name: "🎮 Hiburan & Liburan", type: "expense", icon: "🎮", color: "#8B5CF6" },
          { name: "💊 Kesehatan & Asuransi", type: "expense", icon: "💊", color: "#10B981" },
          { name: "📚 Edukasi & Kursus", type: "expense", icon: "📚", color: "#F59E0B" },
          { name: "💰 Gaji Bulanan", type: "income", icon: "💰", color: "#10B981" },
          { name: "📈 Bonus & Investasi", type: "income", icon: "📈", color: "#6366F1" },
        ];
      }
    }

    // If userId provided, optionally insert into categories table
    if (userId) {
      const supabase = getAdminClient();
      for (const cat of categories) {
        await supabase.from("categories").insert({
          user_id: userId,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          is_custom: true,
        });
      }
    }

    return NextResponse.json({ ok: true, categories });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
