import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Syarat & Ketentuan — TataDana",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-zinc-800 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
      </Link>
      <h1 className="text-3xl font-extrabold text-zinc-900">Syarat & Ketentuan Layanan</h1>
      <p className="text-xs text-zinc-400">Terakhir diperbarui: 15 Oktober 2026</p>

      <section className="space-y-3 text-sm leading-relaxed text-zinc-600">
        <h2 className="text-lg font-bold text-zinc-900">1. Ketentuan Umum</h2>
        <p>
          Dengan menggunakan TataDana (baik web app maupun bot Telegram), Anda menyetujui seluruh ketentuan ini. Layanan ini ditujukan untuk membantu pengelolaan keuangan personal dan bukan merupakan layanan konsultasi perbankan atau investasi berlisensi OJK.
        </p>

        <h2 className="text-lg font-bold text-zinc-900">2. Paket Langganan dan Kebijakan Kuota</h2>
        <p>
          Paket Starter dibatasi maksimal 50 transaksi per bulan kalender. Pengguna dapat melakukan upgrade ke paket Pro kapan saja untuk mendapatkan kuota tak terbatas, fitur scan foto struk OCR, dan export laporan PDF/Excel. Pembayaran diproses melalui payment gateway Midtrans atau transfer manual terverifikasi.
        </p>

        <h2 className="text-lg font-bold text-zinc-900">3. Penggunaan Bot Telegram</h2>
        <p>
          Pengguna bertanggung jawab menjaga keamanan akun Telegram masing-masing. Durasi rekaman suara (Voice Note) dibatasi maksimal 60 detik per pesan demi efisiensi pemrosesan sistem.
        </p>
      </section>
    </div>
  );
}
