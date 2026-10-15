import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Play, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative pt-10 pb-20 overflow-hidden text-center px-4 sm:px-6 lg:px-8">
      {/* Decorative Orange Glow in Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-400/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Pre-headline badge (Part 7) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs sm:text-sm font-bold shadow-xs">
          <span>✨ Catat keuangan langsung dari Telegram</span>
        </div>

        {/* Headline H1 (Part 7) */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.15]">
          Gaji habis sebelum akhir bulan?{" "}
          <span className="bg-gradient-to-r from-brand-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
            Sudah saatnya kamu tahu
          </span>{" "}
          ke mana uangmu pergi.
        </h1>

        {/* Sub-headline (Part 7) */}
        <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus.
        </p>

        {/* CTA Buttons (Part 7) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full sm:w-auto font-bold shadow-orange text-base px-8">
              Mulai Gratis Sekarang
            </Button>
          </Link>

          <a href="#demo" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto font-bold text-zinc-700 text-base">
              <span>Lihat cara kerjanya</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </div>

        <div className="pt-2 flex items-center justify-center gap-6 text-xs text-zinc-400 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Bebas Ribet
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-brand-500" /> Terkoneksi Instan ke Bot
          </span>
        </div>

        {/* Hero Section Video Placeholder (Part 7) */}
        <div className="pt-8 max-w-3xl mx-auto">
          {/* TODO: ganti dengan video asli */}
          <div className="relative aspect-video rounded-3xl bg-zinc-900 border-4 border-white shadow-2xl overflow-hidden flex flex-col items-center justify-center group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-950/80 via-zinc-900/60 to-brand-900/40" />

            <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
              <div className="w-16 h-16 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-orange group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-white ml-1" />
              </div>
              <div>
                <span className="text-white font-bold text-lg block">
                  Demo Cara Kerja TataDana Bot (1 Menit)
                </span>
                <span className="text-xs text-zinc-300 font-medium">
                  Lihat kemudahan ketik pesan natural & scan struk langsung di Telegram
                </span>
              </div>
            </div>
            {/* Note badge */}
            <span className="absolute bottom-3 right-4 text-[10px] text-zinc-400 font-mono">
              // TODO: ganti dengan video asli
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
