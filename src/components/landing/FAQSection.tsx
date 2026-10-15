"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function LandingFAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Apakah bisa pakai foto struk di paket Starter?",
      a: "Fitur ekstraksi foto struk menggunakan AI Vision OCR dirancang khusus untuk paket Pro. Di paket Starter, Anda tetap dapat mencatat pengeluaran secara cepat melalui pesan teks chat natural (misal: 'beli bensin 50rb') atau voice note di bot Telegram.",
    },
    {
      q: "Bagaimana keamanan data transaksi saya di TataDana?",
      a: "Keamanan dan privasi adalah prioritas nomor satu kami. Seluruh database disimpan di Postgres Supabase terlindungi enkripsi standar bank dan Row Level Security (RLS) ketat. Kunci API dan token bot dienkripsi dengan standar AES-256. Setiap kali ada inspeksi transaksi untuk keperluan support teknis, sistem wajib mencatat audit log permanen.",
    },
    {
      q: "Bagaimana cara menghubungkan akun saya dengan Telegram Bot?",
      a: "Sangat mudah! Setelah membuat akun di web TataDana, Anda cukup membuka halaman Settings > Telegram Bot, klik tombol tautan /start atau bagikan kontak nomor telepon Anda yang terdaftar ke bot. Akun akan langsung terhubung dalam hitungan detik.",
    },
    {
      q: "Apakah bot Telegram bisa memahami singkatan bahasa Indonesia?",
      a: "Ya, 100%! Bot TataDana ditenagai model LLM yang dioptimalkan khusus untuk format bahasa percakapan Indonesia. Anda bisa mengetik '15rb', '15ribu', '1.5jt', '500k', maupun '25.000', dan bot akan mencatat nominalnya dengan tepat.",
    },
    {
      q: "Bisa membuat lebih dari satu dompet (multi-wallet)?",
      a: "Tentu saja. Anda bisa membuat dompet untuk Uang Tunai (Cash), Rekening Bank (BCA, Mandiri, BRI, dll), maupun E-Wallet (GoPay, OVO, ShopeePay, Dana). Anda juga bisa menetapkan satu dompet utama sebagai default pencatatan dari Telegram.",
    },
    {
      q: "Bagaimana cara kerja fitur AI Financial Advisor?",
      a: "AI Advisor bekerja proaktif menganalisis arus kas bulanan Anda. Bot akan otomatis mengirimkan analisa personal dan tips actionable jika pengeluaran kategori melonjak >50% dari minggu lalu, atau jika pengeluaran sudah memakan >80% total pemasukan Anda.",
    },
    {
      q: "Metode pembayaran apa saja yang diterima untuk upgrade?",
      a: "Kami bekerja sama dengan Midtrans untuk mendukung pembayaran otomatis via QRIS (GoPay, Dana, ShopeePay), Virtual Account BCA/Mandiri/BRI, dan kartu kredit. Kami juga menyediakan opsi transfer manual dengan verifikasi admin.",
    },
  ];

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Pertanyaan yang Sering Diajukan
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            FAQ Seputar TataDana
          </h2>
          <p className="text-sm text-zinc-500">
            Segala hal yang perlu kamu ketahui tentang integrasi bot dan fitur pencatatan kami.
          </p>
        </div>

        {/* 7 FAQ Accordions (Part 7) */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-surface-border bg-white overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-zinc-900 hover:text-brand-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-brand-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
