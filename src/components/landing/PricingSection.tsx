"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Check, X, Zap } from "lucide-react";

export function LandingPricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "lifetime">("lifetime");

  return (
    <section id="harga" className="py-24 bg-zinc-50/70 border-y border-zinc-200/60 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Investasi Finansial Terbaik
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            Pilih Paket yang Cocok untuk Kebutuhanmu
          </h2>
          <p className="text-sm text-zinc-500">
            Mulai kontrol pengeluaran harianmu tanpa biaya tersembunyi.
          </p>

          {/* Toggle Bulanan / Sekali Bayar (Part 7) */}
          <div className="pt-4 flex items-center justify-center">
            <div className="inline-flex items-center p-1 bg-zinc-200/70 rounded-full">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${
                  billingCycle === "monthly"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Langganan Bulanan
              </button>
              <button
                onClick={() => setBillingCycle("lifetime")}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${
                  billingCycle === "lifetime"
                    ? "bg-brand-500 text-white shadow-orange"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <span>Sekali Bayar Seumur Hidup</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full">Hemat 90%</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2 Kolom Pricing (Starter | Pro) (Part 7) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="p-8 rounded-3xl bg-white border border-surface-border shadow-soft flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">Starter</h3>
                <Badge variant="zinc">Dasar</Badge>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900">Rp 49.000</span>
                <span className="text-xs text-zinc-400 font-medium">/ bulan</span>
              </div>

              <p className="text-xs text-zinc-500">
                Pilihan pas untuk karyawan dan mahasiswa yang ingin mulai mencatat pengeluaran harian via chat Telegram.
              </p>

              <div className="pt-4 border-t border-zinc-100 space-y-3 text-xs text-zinc-600">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Catat transaksi via teks Telegram</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dashboard web lengkap</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Maksimal 50 transaksi / bulan</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Maksimal 3 wallet & 5 kategori budget</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Laporan ringkasan bulanan standar</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-400 line-through">
                  <X className="w-4 h-4 text-zinc-300 shrink-0" />
                  <span>Input via foto struk AI OCR</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-400 line-through">
                  <X className="w-4 h-4 text-zinc-300 shrink-0" />
                  <span>AI Financial Advisor</span>
                </div>
                <div className="flex items-center gap-2.5 text-zinc-400 line-through">
                  <X className="w-4 h-4 text-zinc-300 shrink-0" />
                  <span>Export laporan ke PDF & Excel (.xlsx)</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/register">
                <Button variant="outline" size="lg" className="w-full font-bold">
                  Pilih Starter
                </Button>
              </Link>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-orange-50/50 to-white border-2 border-brand-500 shadow-orange flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-brand-500 text-white text-[11px] font-extrabold rounded-full uppercase tracking-wider shadow-sm">
                Rekomendasi
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">Pro Lifetime</h3>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-brand-600">Rp 99.000</span>
                <span className="text-xs text-zinc-600 font-semibold">
                  {billingCycle === "lifetime" ? "Sekali Bayar Seumur Hidup" : "/ bulan"}
                </span>
              </div>

              <p className="text-xs text-zinc-600">
                Fitur lengkap tanpa batas untuk kendali finansial total. Nikmati asisten AI pribadi dan scan struk instan.
              </p>

              <div className="pt-4 border-t border-brand-200/60 space-y-3 text-xs text-zinc-800">
                <div className="flex items-center gap-2.5 font-bold text-brand-800">
                  <Check className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Semua fitur paket Starter</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium">
                  <Check className="w-4 h-4 text-brand-500 shrink-0" />
                  <span><strong>Unlimited transaksi</strong> per bulan</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium">
                  <Check className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Unlimited wallet & kategori custom</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium">
                  <Check className="w-4 h-4 text-brand-500 shrink-0" />
                  <span><strong>Input foto struk AI OCR</strong> (otomatis breakdown item)</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium">
                  <Check className="w-4 h-4 text-brand-500 shrink-0" />
                  <span><strong>Export unlimited ke PDF & Excel (.xlsx)</strong></span>
                </div>
                <div className="flex items-center gap-2.5 font-medium">
                  <Check className="w-4 h-4 text-brand-500 shrink-0" />
                  <span><strong>AI Financial Advisor</strong> aktif</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium">
                  <Check className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Pengingat harian custom (1x / 2x sehari)</span>
                </div>
                <div className="flex items-center gap-2.5 font-medium">
                  <Check className="w-4 h-4 text-brand-500 shrink-0" />
                  <span>Prioritas support teknis</span>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link href="/register">
                <Button variant="primary" size="lg" className="w-full font-bold shadow-orange text-base">
                  <Zap className="w-4 h-4 fill-white mr-1" />
                  Dapatkan Akses Pro Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
