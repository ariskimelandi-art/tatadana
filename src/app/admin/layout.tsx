"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Cpu, 
  Users, 
  CreditCard, 
  Activity, 
  ArrowLeft, 
  FileText, 
  Lock, 
  LogOut, 
  KeyRound 
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check admin session from cookies and localStorage
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const adminSessionCookie = cookies.find((c) => c.startsWith("tatadana_admin_session="));
    const userEmailCookie = cookies.find((c) => c.startsWith("tatadana_user_email="));
    const currentEmail = userEmailCookie ? decodeURIComponent(userEmailCookie.split("=")[1]) : "";

    const localAdminSession = localStorage.getItem("tatadana_admin_session");
    const localUserEmail = localStorage.getItem("tatadana_user_email");

    const isAuthenticated = 
      (adminSessionCookie && adminSessionCookie.includes("authenticated")) ||
      localAdminSession === "authenticated" ||
      currentEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
      localUserEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    setIsAdminAuthenticated(!!isAuthenticated);
  }, []);

  const handleAdminLogout = () => {
    // Clear cookies
    document.cookie = "tatadana_admin_session=; path=/; max-age=0";
    document.cookie = "tatadana_user_email=; path=/; max-age=0";
    localStorage.removeItem("tatadana_admin_session");
    localStorage.removeItem("tatadana_user_email");

    router.push("/login");
  };

  // Loading state
  if (isAdminAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 font-sans text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span>Memverifikasi hak akses Superadmin...</span>
        </div>
      </div>
    );
  }

  // Not authenticated as admin -> Show Access Restricted Screen
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-between font-sans p-6">
        <header className="flex items-center justify-between max-w-5xl mx-auto w-full py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500 font-extrabold flex items-center justify-center text-white text-base shadow-orange">
              TD
            </div>
            <span className="font-extrabold text-xl tracking-tight">TataDana Admin Panel</span>
          </div>
          <Link href="/login" className="text-xs text-zinc-400 hover:text-white transition-colors">
            Masuk Akun Lain →
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center py-12">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30">
                Akses Dibatasi
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Login Admin Diperlukan
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Panel ini khusus untuk Superadmin. Anda harus masuk terlebih dahulu menggunakan email admin:
              </p>
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-brand-400 font-mono text-xs font-bold inline-block">
                {ADMIN_EMAIL}
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <Button
                onClick={() => router.push(`/login?email=${encodeURIComponent(ADMIN_EMAIL)}&role=admin`)}
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-orange flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk sebagai Admin Sekarang</span>
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="outline"
                size="md"
                className="w-full text-zinc-400 hover:text-white border-zinc-800 text-xs"
              >
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-zinc-600 py-4">
          © {new Date().getFullYear()} TataDana · Otentikasi Khusus Superadmin ({ADMIN_EMAIL})
        </footer>
      </div>
    );
  }

  // Admin Authenticated -> Render Full Admin Dashboard
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex flex-col font-sans">
      {/* Admin Top Header */}
      <header className="h-16 bg-zinc-950 border-b border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white shadow-orange">
            TD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white">TataDana Superadmin</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                PROD
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">Pusat Kendali Sistem & Audit Privasi</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Active Admin Identity Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-400 text-[11px]">Admin:</span>
            <span className="font-bold text-brand-400">{ADMIN_EMAIL}</span>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lihat Tampilan User</span>
          </Link>

          {/* Admin Logout Button */}
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800/50 text-xs font-bold transition-colors"
            title="Keluar dari sesi Admin"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Admin</span>
          </button>
        </div>
      </header>

      {/* Admin Navigation Subbar */}
      <div className="bg-zinc-950/60 border-b border-zinc-800/80 px-6 overflow-x-auto flex items-center gap-2 py-2">
        {[
          { href: "/admin", label: "Overview", icon: ShieldCheck },
          { href: "/admin/users", label: "Persetujuan Pengguna & Audit", icon: Users },
          { href: "/admin/ai-providers", label: "Kelola Provider AI", icon: Cpu },
          { href: "/admin/payments", label: "Persetujuan Pembayaran", icon: CreditCard },
          { href: "/admin/ai-logs", label: "Log Pemanggilan AI", icon: Activity },
          { href: "/admin/audit-logs", label: "Log Audit Admin", icon: FileText },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors whitespace-nowrap"
            >
              <Icon className="w-4 h-4 text-brand-400" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Content Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
