import React from "react";
import { Star } from "lucide-react";

export function LandingTestimonialsSection() {
  // TODO: ganti dengan testimoni asli setelah fase beta user selesai
  const dummyTestimonials = [
    {
      name: "Rizky Ramadhan",
      role: "Software Engineer, Jakarta",
      quote:
        "Dulu selalu malas buka aplikasi budgeting karena form-nya banyak banget. Sejak pakai TataDana, habis bayar kopi tinggal ketik 'kopi 25rb' di Telegram langsung kecatat. Akhir bulan akhirnya punya tabungan!",
      rating: 5,
    },
    {
      name: "Nadia Putri",
      role: "Freelance Designer, Bandung",
      quote:
        "Fitur foto struk-nya gokil banget! Belanja bulanan di minimarket yang item-nya belasan langsung ke-split otomatis. Nggak perlu input manual satu per satu.",
      rating: 5,
    },
    {
      name: "Bagas Wicaksono",
      role: "Mahasiswa Semester Akhir, Yogyakarta",
      quote:
        "Sebagai anak kos dengan uang bulanan pas-pasan, alert 80% budget beneran jadi penyelamat hidup sebelum tanggal 20. Sangat direkomendasikan!",
      rating: 5,
    },
    {
      name: "Devi Anggraini",
      role: "Content Creator, Surabaya",
      quote:
        "AI Financial Advisor-nya berasa kayak punya akuntan pribadi. Begitu jajan boba keseringan, bot langsung ingetin dengan sopan dan kasih tips hemat.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Kisah Nyata Pengguna
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Cerita Mereka yang Bebas dari Stres Tanggal Tua
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            // TODO: ganti dengan testimoni asli
          </p>
        </div>

        {/* Masonry Grid (Part 7) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {dummyTestimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white border border-surface-border shadow-soft flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-zinc-600 leading-relaxed italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-900">{t.name}</h4>
                <p className="text-[10px] text-zinc-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
