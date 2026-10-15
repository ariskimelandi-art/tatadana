import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Sparkles } from "lucide-react";

export function LandingFinalCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-tr from-brand-600 via-orange-500 to-amber-500 p-8 sm:p-14 text-center text-white shadow-orange relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mulai Kendalikan Uangmu Sekarang</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Mulai Kendalikan Keuanganmu Hari Ini
          </h2>

          <p className="text-sm sm:text-base opacity-90 leading-relaxed">
            Bergabunglah dengan ribuan pekerja dan mahasiswa yang tidak lagi cemas menghadapi tanggal tua.
            Catat pengeluaran semudah kirim chat di Telegram.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-white text-brand-600 hover:bg-zinc-100 font-extrabold text-base shadow-lg">
                <span>Daftar Gratis Sekarang</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
