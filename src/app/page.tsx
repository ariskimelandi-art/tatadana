import React from "react";
import { LandingNavbar } from "@/components/landing/Navbar";
import { LandingHero } from "@/components/landing/Hero";
import { LandingProblemSection } from "@/components/landing/ProblemSection";
import { LandingInteractivePreview } from "@/components/landing/InteractivePreview";
import { LandingFeaturesSection } from "@/components/landing/FeaturesSection";
import { LandingTestimonialsSection } from "@/components/landing/TestimonialsSection";
import { LandingPricingSection } from "@/components/landing/PricingSection";
import { LandingFAQSection } from "@/components/landing/FAQSection";
import { LandingFinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/Footer";

export const metadata = {
  title: "TataDana — Catat Keuangan Semudah Chat Langsung dari Telegram",
  description:
    "TataDana adalah aplikasi manajemen keuangan pribadi Indonesia yang terintegrasi dengan Telegram Bot. Catat pemasukan, pengeluaran, dan scan struk langsung dari chat.",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-brand-500 selection:text-white flex flex-col font-sans">
      {/* 1. Navbar (Part 7) */}
      <LandingNavbar />

      <main className="flex-1">
        {/* 2-6. Hero Section (Pre-headline, H1, Subheadline, Video placeholder, CTAs) */}
        <LandingHero />

        {/* 7-8. Bullet points masalah user & Solusi transition */}
        <LandingProblemSection />

        {/* 9. Interactive Dashboard Preview & Bot Telegram Simulator */}
        <LandingInteractivePreview />

        {/* 10. Fitur Section (3 alternating layout) */}
        <LandingFeaturesSection />

        {/* 11. Testimoni (Masonry grid) */}
        <LandingTestimonialsSection />

        {/* 12. Pricing Section (Toggle bulanan/sekali bayar, 2 kolom) */}
        <LandingPricingSection />

        {/* 13. FAQ (Minimal 7 pertanyaan relevan) */}
        <LandingFAQSection />

        {/* 14. Final CTA (Background gradient orange) */}
        <LandingFinalCTA />
      </main>

      {/* 15. Footer (4 kolom) */}
      <LandingFooter />
    </div>
  );
}
