import React from "react";
import { AlertCircle, HelpCircle, CalendarX2, ArrowDown } from "lucide-react";

export function LandingProblemSection() {
  const problems = [
    {
      quote: "Buka aplikasi keuangan? Nanti dulu deh...",
      description: "Aplikasi ribet dengan puluhan menu dan form panjang bikin malas mencatat setiap habis beli sesuatu.",
      icon: AlertCircle,
      accent: "text-amber-500",
      bg: "bg-amber-50 border-amber-200",
    },
    {
      quote: "Kok uangnya habis ya? Padahal kayak tidak beli apa-apa",
      description: "Kopi harian, parkir, jajan sore, dan belanja receh bocor halus tanpa disadari dan tak pernah tercatat.",
      icon: HelpCircle,
      accent: "text-red-500",
      bg: "bg-red-50 border-red-200",
    },
    {
      quote: "Udah niat bikin budget, tapi seminggu lupa",
      description: "Budget bulanan yang tidak pernah dipantau secara real-time sama saja seperti tidak ada budget.",
      icon: CalendarX2,
      accent: "text-purple-500",
      bg: "bg-purple-50 border-purple-200",
    },
  ];

  return (
    <section className="py-20 bg-zinc-50/70 border-y border-zinc-200/60 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Realita Pengelolaan Uang di Indonesia
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Pernahkah Kamu Mengalami Ini Setiap Tanggal Tua?
          </h2>
        </div>

        {/* 3 Problem Cards (Part 7) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {problems.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-surface-border shadow-soft flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl ${p.bg} border flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${p.accent}`} />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 mb-2 leading-snug">
                    &ldquo;{p.quote}&rdquo;
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                    {p.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Solution Transition Banner (Part 7) */}
        <div className="pt-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 text-brand-500 mx-auto">
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-zinc-800">
            Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
          </h3>
          <div className="inline-block">
            <span className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-brand-500 to-amber-500 bg-clip-text text-transparent tracking-tight">
              Introducing TataDana
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
