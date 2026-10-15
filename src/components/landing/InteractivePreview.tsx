"use client";

import React, { useState } from "react";
import { Send, Camera, Mic, CheckCheck, Sparkles, LayoutDashboard, MessageSquare } from "lucide-react";
import { formatRupiah } from "@/lib/utils/currency";

export function LandingInteractivePreview() {
  const [activeTab, setActiveTab] = useState<"telegram" | "dashboard">("telegram");
  const [selectedExample, setSelectedExample] = useState<number>(0);

  const examples = [
    {
      userMessage: "beli bakso bakar 15rb",
      botReply: `📅 Rabu, 15 Okt 2026 — 14:35 WIB
💸 Pengeluaran tercatat!
├ Nominal : Rp 15.000
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 Dompet Utama (Cash)
├ Catatan : beli bakso bakar
└ Saldo : Rp 1.235.000

📊 Budget Makanan & Minuman bulan ini:
[████░░░░░░] 40% — sisa Rp 1.500.000
👍 Budget masih aman. Pertahankan disiplin keuanganmu!`,
    },
    {
      userMessage: "gajian 5jt",
      botReply: `📅 Rabu, 15 Okt 2026 — 10:15 WIB
💰 Pemasukan tercatat!
├ Nominal : Rp 5.000.000
├ Kategori : 💼 Pemasukan
├ Dompet : 👛 Rekening BCA
└ Saldo baru : Rp 13.400.000

💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`,
    },
    {
      userMessage: "[Kirim Foto Struk Supermarket 📸]",
      botReply: `📅 Rabu, 15 Okt 2026 — 19:20 WIB
🧾 Struk Berhasil Dicatat!
├ Merchant : Hypermart Grand Indonesia
├ Total : Rp 285.000
├ Dompet : 👛 Rekening BCA
└ Saldo Sisa : Rp 8.115.000

📦 Rincian Item:
• Susu Segar UHT 1L (2x) = Rp 42.000
• Daging Sapi Slice 500g (1x) = Rp 95.000
• Buah Apel Fuji (1.5x) = Rp 60.000
• Tisu Wajah (3x) = Rp 48.000
• ...dan 1 item lainnya (tersimpan di laporan web)`,
    },
    {
      userMessage: "🎙️ [Voice Note: 'kopi susu sama roti 35 ribu']",
      botReply: `📅 Rabu, 15 Okt 2026 — 16:05 WIB
🎙️ Transkrip: "kopi susu sama roti 35 ribu"
💸 Pengeluaran tercatat!
├ Nominal : Rp 35.000
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 Dompet Utama (Cash)
├ Catatan : kopi susu sama roti
└ Saldo : Rp 1.200.000`,
    },
  ];

  return (
    <section id="demo" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Interactive Live Simulator
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Coba Rasakan Sensasi Mencatat Tanpa Buka Form
          </h2>
          <p className="text-sm text-zinc-500">
            Klik contoh chat di bawah untuk melihat bagaimana bot AI TataDana memproses pesan secara instan.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 bg-zinc-100 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveTab("telegram")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "telegram"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <MessageSquare className="w-4 h-4 text-brand-500" />
              <span>Simulasi Bot Telegram</span>
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "dashboard"
                  ? "bg-white text-brand-600 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-brand-500" />
              <span>Preview Dashboard Web</span>
            </button>
          </div>
        </div>

        {/* TELEGRAM SIMULATOR VIEW */}
        {activeTab === "telegram" && (
          <div className="max-w-xl mx-auto bg-white rounded-3xl border border-surface-border shadow-2xl overflow-hidden">
            {/* Telegram Header */}
            <div className="bg-[#242A38] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center font-bold text-sm shadow-orange">
                  TD
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-none flex items-center gap-1.5">
                    <span>TataDana Bot</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </h4>
                  <span className="text-[10px] text-zinc-400">bot pencatat keuangan resmi</span>
                </div>
              </div>
              <span className="text-[11px] text-zinc-400 bg-zinc-800 px-2 py-1 rounded">Interactive</span>
            </div>

            {/* Quick Prompts Selector Buttons */}
            <div className="bg-zinc-50 border-b border-zinc-200 p-2.5 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] font-bold uppercase text-zinc-400 shrink-0 px-2">Pilih:</span>
              {["beli bakso 15rb", "gajian 5jt", "foto struk", "voice note"].map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedExample(idx)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg shrink-0 transition-all ${
                    selectedExample === idx
                      ? "bg-brand-500 text-white shadow-orange"
                      : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Chat Body */}
            <div className="p-4 sm:p-6 bg-[#EFEAE2]/30 min-h-[380px] flex flex-col justify-end space-y-4 font-sans">
              {/* User Outgoing Bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-white rounded-2xl rounded-tr-xs p-3.5 shadow-sm border border-zinc-200/60 text-xs text-zinc-900 font-medium">
                  {examples[selectedExample].userMessage}
                  <div className="text-[10px] text-zinc-400 text-right mt-1 flex items-center justify-end gap-1">
                    <span>14:35</span>
                    <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Bot Incoming Reply Bubble (with exact format from Part 4.4 / 4.5) */}
              <div className="flex justify-start">
                <div className="max-w-[92%] bg-white rounded-2xl rounded-tl-xs p-4 shadow-sm border border-brand-200 text-xs font-mono text-zinc-800 whitespace-pre-line leading-relaxed">
                  {examples[selectedExample].botReply}
                  <div className="text-[10px] text-zinc-400 text-right mt-2 font-sans">
                    14:35 • TataDana AI Engine
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Telegram Input Bar */}
            <div className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
              <Camera className="w-5 h-5 text-zinc-400 cursor-pointer hover:text-brand-500" />
              <Mic className="w-5 h-5 text-zinc-400 cursor-pointer hover:text-brand-500" />
              <input
                readOnly
                placeholder="Ketik pengeluaranmu (misal: bayar kos 1.5jt)..."
                className="flex-1 bg-zinc-100 rounded-full px-4 py-2 text-xs text-zinc-600 outline-none"
              />
              <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-orange cursor-pointer">
                <Send className="w-4 h-4 ml-0.5" />
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD PREVIEW VIEW */}
        {activeTab === "dashboard" && (
          <div className="bg-white rounded-3xl border border-surface-border shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-extrabold text-lg text-zinc-900">Dashboard TataDana Web</h3>
                <p className="text-xs text-zinc-400">Sinkronisasi real-time setiap kali chat Telegram masuk</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                🟢 Realtime Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-brand-200">
                <span className="text-[11px] font-bold uppercase text-zinc-500">Saldo Total</span>
                <p className="text-2xl font-extrabold text-zinc-900 mt-1">Rp 9.650.000</p>
              </div>
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <span className="text-[11px] font-bold uppercase text-zinc-500">Pemasukan Bulan Ini</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">+Rp 14.500.000</p>
              </div>
              <div className="p-4 bg-red-50/50 rounded-2xl border border-red-200">
                <span className="text-[11px] font-bold uppercase text-zinc-500">Pengeluaran Bulan Ini</span>
                <p className="text-2xl font-extrabold text-red-600 mt-1">-Rp 4.850.000</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
