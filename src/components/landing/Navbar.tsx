"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-zinc-100" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-orange">
            <span className="font-extrabold text-xl tracking-tighter">TD</span>
          </div>
          <span className="font-extrabold text-2xl text-zinc-900 tracking-tight">
            Tata<span className="text-brand-500">Dana</span>
          </span>
        </Link>

        {/* Navigation Menu */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-600">
          <a href="#fitur" className="hover:text-brand-600 transition-colors">
            Fitur
          </a>
          <a href="#harga" className="hover:text-brand-600 transition-colors">
            Harga
          </a>
          <a href="#faq" className="hover:text-brand-600 transition-colors">
            FAQ
          </a>
        </div>

        {/* Auth CTA Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-semibold text-zinc-700">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="primary" size="sm" className="font-bold shadow-orange">
              Coba Gratis
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
