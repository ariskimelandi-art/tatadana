import React from "react";
import { Send, FileText, Bot, CheckCircle2, Sparkles, Camera, Mic } from "lucide-react";

export function LandingFeaturesSection() {
  const features = [
    {
      badge: "Fitur Utama #1",
      title: "Catat via Telegram — Teks, Voice Note, & Foto Struk",
      description:
        "Cukup ketik natural seperti 'beli bakso 15rb' atau 'gajian 5jt'. AI TataDana langsung mengekstrak nominal, kategori, dan wallet secara akurat. Pengguna Pro bahkan bisa langsung foto struk belanjaan supermarket untuk dicatat rincian per item!",
      bulletPoints: [
        "Mendukung bahasa gaul & singkatan angka: 15rb, 500k, 1.5jt",
        "Kirim Voice Note rekaman suara hingga 60 detik",
        "AI Vision OCR otomatis ekstrak item dan merchant dari foto struk",
        "Idempotency anti-duplikat transaksi akibat gangguan sinyal",
      ],
      icon: Send,
      reverse: false,
    },
    {
      badge: "Fitur Utama #2",
      title: "Laporan Native & Export Otomatis PDF / Excel",
      description:
        "Semua transaksi dari Telegram langsung terakumulasi rapi di dashboard web TataDana secara real-time tanpa perlu refresh manual. Generate laporan keuangan pribadi on-demand ke format PDF resmi atau spreadsheet Excel.",
      bulletPoints: [
        "Tabel lengkap dengan pagination dan sortable per kolom",
        "Rincian foto struk multi-item dapat di-expand",
        "Filter pintar rentang tanggal, kategori, dan dompet",
        "Tersimpan di Supabase Storage privat dengan link unduh aman",
      ],
      icon: FileText,
      reverse: true,
    },
    {
      badge: "Fitur Utama #3",
      title: "AI Financial Advisor Pribadi (Fitur Pro)",
      description:
        "Bukan sekadar pencatat pasif. AI Advisor TataDana aktif menganalisis kebiasaan finansialmu dan langsung memberi teguran serta solusi praktis saat ada anomali atau pengeluaran impulsif.",
      bulletPoints: [
        "Peringatan dini saat pengeluaran kategori melonjak >50%",
        "Alert otomatis saat total pengeluaran menyentuh >80% dari gaji",
        "Saran spesifik dan actionable dalam bahasa Indonesia ramah",
        "Bekerja otomatis di latar belakang tanpa perintah rumit",
      ],
      icon: Bot,
      reverse: false,
    },
  ];

  return (
    <section id="fitur" className="py-24 px-4 sm:px-6 lg:px-8 bg-zinc-50/50">
      <div className="max-w-6xl mx-auto space-y-24">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${
                f.reverse ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Content Side */}
              <div className="flex-1 space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
                  <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                  {f.badge}
                </span>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-snug">
                  {f.title}
                </h3>

                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed">
                  {f.description}
                </p>

                <ul className="space-y-2.5 pt-2">
                  {f.bulletPoints.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Graphic Mockup Side */}
              <div className="flex-1 w-full">
                <div className="p-8 rounded-3xl bg-white border border-surface-border shadow-soft flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200 text-brand-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-base text-zinc-900 mb-1">{f.title.split("—")[0]}</h4>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    Infrastruktur terintegrasi langsung dengan Supabase Postgres dan Telegram Bot API.
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
