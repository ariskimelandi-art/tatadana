"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  LogOut, 
  RefreshCw, 
  KeyRound, 
  ShieldCheck
} from "lucide-react";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com";

function PendingApprovalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const nameParam = searchParams.get("name") || "";

  const [email, setEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isRejected, setIsRejected] = useState(false);

  useEffect(() => {
    // 1. Resolve email and name from query params or localStorage
    const savedEmail = emailParam || localStorage.getItem("tatadana_user_email") || "";
    const savedName = nameParam || localStorage.getItem("tatadana_user_name") || "";
    setEmail(savedEmail);
    setUserName(savedName);

    // 2. Check approval status
    async function checkStatus(targetEmail: string) {
      if (!targetEmail) return;
      try {
        const res = await fetch(`/api/auth/approval-status?email=${encodeURIComponent(targetEmail)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data.ok) {
          if (data.full_name) setUserName(data.full_name);
          if (data.is_approved) {
            setIsApproved(true);
            setStatusMessage("🎉 Selamat! Akun Anda telah disetujui oleh Admin. Mengalihkan ke dashboard...");
            setTimeout(() => router.push("/dashboard"), 1500);
          } else if (data.status === "rejected") {
            setIsRejected(true);
          }
        }
      } catch {
        // Fallback
      }
    }

    if (savedEmail) {
      checkStatus(savedEmail);
    }
  }, [emailParam, nameParam, router]);

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);

    const queryEmail = email || localStorage.getItem("tatadana_user_email") || "";

    try {
      const res = await fetch(`/api/auth/approval-status?email=${encodeURIComponent(queryEmail)}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.ok && data.is_approved) {
        setIsApproved(true);
        setStatusMessage("🎉 Selamat! Akun Anda telah disetujui oleh Admin. Mengalihkan ke dashboard...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else if (data.status === "rejected") {
        setIsRejected(true);
        setStatusMessage("❌ Permohonan akun Anda telah ditolak oleh Admin.");
      } else {
        setStatusMessage("⏳ Status saat ini: Menunggu persetujuan Admin. Admin akan segera memverifikasi akun Anda.");
      }
    } catch {
      setStatusMessage("Gagal memeriksa status. Silakan coba lagi beberapa saat lagi.");
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "tatadana_user_email=; path=/; max-age=0";
    document.cookie = "tatadana_admin_session=; path=/; max-age=0";
    localStorage.removeItem("tatadana_user_email");
    localStorage.removeItem("tatadana_user_name");
    localStorage.removeItem("tatadana_admin_session");

    router.push("/login");
  };

  const handleSwitchToAdmin = () => {
    // Clear user session & redirect to admin login
    document.cookie = "tatadana_user_email=; path=/; max-age=0";
    localStorage.removeItem("tatadana_user_email");
    localStorage.removeItem("tatadana_user_name");

    router.push(`/login?admin=1&email=${encodeURIComponent(ADMIN_EMAIL)}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="py-6 px-6 sm:px-12 bg-white border-b border-zinc-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-orange-500 text-white font-extrabold flex items-center justify-center text-xl shadow-md">
            TD
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-zinc-900">TataDana</span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-zinc-500 hover:text-red-600 flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          <Card className="p-8 sm:p-10 text-center shadow-xl border-zinc-200/80 bg-white rounded-2xl relative overflow-hidden">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-brand-500 to-orange-500" />

            {/* Icon Status */}
            <div className="mx-auto w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center text-amber-500 mb-6 relative">
              {isApproved ? (
                <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
              ) : isRejected ? (
                <ShieldAlert className="w-10 h-10 text-red-500" />
              ) : (
                <>
                  <Clock className="w-10 h-10 animate-pulse" />
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
                    !
                  </span>
                </>
              )}
            </div>

            <div className="space-y-2 mb-6">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                {isApproved ? "✅ Terverifikasi" : isRejected ? "❌ Ditolak" : "⏳ Menunggu Persetujuan"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                {isApproved
                  ? "Akun Anda Telah Disetujui!"
                  : isRejected
                  ? "Pendaftaran Akun Ditolak"
                  : "Menunggu Persetujuan Admin"}
              </h1>
              <p className="text-sm text-zinc-600 max-w-md mx-auto leading-relaxed">
                {isApproved
                  ? "Selamat! Akun Anda kini aktif dan siap digunakan."
                  : isRejected
                  ? "Mohon maaf, permintaan pendaftaran akun Anda tidak disetujui oleh admin."
                  : "Setelah memasukkan email & sandi, akun Anda harus disetujui terlebih dahulu oleh Admin sebelum dapat mengakses dashboard."}
              </p>
            </div>

            {/* Information Box */}
            <div className="bg-zinc-50 border border-zinc-200/70 rounded-xl p-4 text-left space-y-3 mb-6 text-xs text-zinc-700">
              <div className="flex items-center justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500">Nama Pendaftar:</span>
                <span className="font-bold text-zinc-900">{userName || "Pengguna Baru"}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500">Email Akun:</span>
                <span className="font-bold text-zinc-900">{email || "Belum terdeteksi"}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500">Admin Penyetuju:</span>
                <span className="font-bold text-brand-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {ADMIN_EMAIL}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-500">Status Akses:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
                  isApproved 
                    ? "bg-emerald-100 text-emerald-700" 
                    : isRejected 
                    ? "bg-red-100 text-red-700" 
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {isApproved ? "Disetujui" : isRejected ? "Ditolak" : "Pending Review"}
                </span>
              </div>
            </div>

            {/* Feedback alert */}
            {statusMessage && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold mb-6 transition-all ${
                isApproved 
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700" 
                  : isRejected 
                  ? "bg-red-50 border border-red-200 text-red-700" 
                  : "bg-amber-50 border border-amber-200 text-amber-800"
              }`}>
                {statusMessage}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {isApproved ? (
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="primary"
                  size="lg"
                  className="w-full font-bold shadow-orange flex items-center justify-center gap-2"
                >
                  <span>Buka Dashboard Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCheckStatus}
                  variant="primary"
                  size="lg"
                  isLoading={checking}
                  className="w-full font-bold shadow-orange flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
                  <span>Cek Status Persetujuan</span>
                </Button>
              )}

              {/* 1-Device Testing Shortcut to Admin */}
              <button
                type="button"
                onClick={handleSwitchToAdmin}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 text-brand-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-brand-600" />
                <span>Masuk sebagai Admin ({ADMIN_EMAIL}) untuk Menyetujui</span>
              </button>

              <Button
                onClick={handleLogout}
                variant="outline"
                size="md"
                className="w-full text-zinc-600 text-xs font-semibold"
              >
                Ganti Akun / Masuk Ulang
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} TataDana · Sistem Persetujuan Terpusat Admin ({ADMIN_EMAIL})
      </footer>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    }>
      <PendingApprovalContent />
    </Suspense>
  );
}
