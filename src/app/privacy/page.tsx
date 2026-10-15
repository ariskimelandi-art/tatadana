import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Kebijakan Privasi — TataDana",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-zinc-800 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>
      <h1 className="text-3xl font-extrabold text-zinc-900">Kebijakan Privasi TataDana</h1>
      <p className="text-xs text-zinc-400">Terakhir diperbarui: 15 Oktober 2026</p>

      <section className="space-y-3 text-sm leading-relaxed text-zinc-600">
        <h2 className="text-lg font-bold text-zinc-900">1. Komitmen Privasi Data Pengguna</h2>
        <p>
          TataDana menghargai sepenuhnya privasi keuangan Anda. Semua data transaksi, saldo dompet, foto struk, dan rekaman suara hanya digunakan untuk menyajikan laporan dan analisis pribadi Anda. Kami tidak pernah dan tidak akan menjual data finansial Anda kepada pihak ketiga manapun.
        </p>

        <h2 className="text-lg font-bold text-zinc-900">2. Enkripsi dan Keamanan Basis Data</h2>
        <p>
          Data disimpan pada server Supabase Postgres dengan proteksi Row Level Security (RLS). Token API dan kredensial bot Telegram dienkripsi dengan algoritma AES-256. Setiap akses inspeksi oleh tim admin untuk keperluan support teknis dicatat secara permanen di audit logs demi transparansi.
        </p>

        <h2 className="text-lg font-bold text-zinc-900">3. Pemrosesan Data Melalui Telegram & AI</h2>
        <p>
          Pesan dan foto struk yang dikirimkan ke bot Telegram TataDana diproses secara aman melalui endpoint webhook berenkripsi HTTPS. Pemrosesan pemahaman bahasa alami (NLP) dan OCR dilakukan menggunakan provider AI terverifikasi dengan kebijakan data zero-retention untuk pelatihan model publik.
        </p>
      </section>
    </div>
  );
}
