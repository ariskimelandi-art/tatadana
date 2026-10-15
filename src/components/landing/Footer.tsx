import React from "react";
import Link from "next/link";
import { Send, Instagram, Twitter, Linkedin, Heart } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-white border-t border-surface-border text-zinc-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* 4 Kolom (Part 7) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Kolom 1: Logo + Tagline + Sosmed */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center font-bold text-white shadow-orange">
                TD
              </div>
              <span className="font-extrabold text-lg text-zinc-900 tracking-tight">
                Tata<span className="text-brand-500">Dana</span>
              </span>
            </Link>

            <p className="text-xs text-zinc-500 leading-relaxed">
              Catat keuangan semudah chat — langsung dari Telegram kamu.
            </p>

            <div className="flex items-center gap-3 pt-2 text-zinc-400">
              <a href="https://t.me/tatadana_bot" target="_blank" rel="noreferrer" className="hover:text-brand-500 transition-colors">
                <Send className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-brand-500 transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-brand-500 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-brand-500 transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Kolom 2: Produk */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
              Produk
            </h4>
            <ul className="space-y-2">
              <li><a href="#fitur" className="hover:text-brand-600 transition-colors">Bot Telegram AI</a></li>
              <li><a href="#fitur" className="hover:text-brand-600 transition-colors">Scan Struk OCR</a></li>
              <li><a href="#fitur" className="hover:text-brand-600 transition-colors">Laporan & Export</a></li>
              <li><a href="#fitur" className="hover:text-brand-600 transition-colors">AI Financial Advisor</a></li>
              <li><Link href="/dashboard" className="hover:text-brand-600 transition-colors">Dashboard Web</Link></li>
            </ul>
          </div>

          {/* Kolom 3: Perusahaan */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
              Perusahaan
            </h4>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-brand-600 transition-colors">Tentang TataDana</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Blog Literasi Finansial</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Karir</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Press Kit</a></li>
            </ul>
          </div>

          {/* Kolom 4: Legal & Kontak */}
          <div className="space-y-3">
            <h4 className="font-bold text-zinc-900 uppercase tracking-wider text-[11px]">
              Legal & Bantuan
            </h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="hover:text-brand-600 transition-colors">Kebijakan Privasi (/privacy)</Link></li>
              <li><Link href="/terms" className="hover:text-brand-600 transition-colors">Syarat & Ketentuan (/terms)</Link></li>
              <li><a href="mailto:support@tatadana.id" className="hover:text-brand-600 transition-colors">Hubungi Kami (Kontak)</a></li>
              <li><span className="text-zinc-400">Jakarta Selatan, Indonesia</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 mt-12 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} TataDana. Hak cipta dilindungi undang-undang.</p>
          <p className="flex items-center gap-1">
            Dibangun dengan <Heart className="w-3.5 h-3.5 text-brand-500 fill-brand-500" /> untuk literasi keuangan Indonesia
          </p>
        </div>
      </div>
    </footer>
  );
}
