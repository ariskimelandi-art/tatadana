"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Clock, KeyRound } from "lucide-react";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const roleParam = searchParams.get("role");
    const adminParam = searchParams.get("admin");

    if (adminParam === "1" || roleParam === "admin" || emailParam?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setIsAdminMode(true);
      setEmail(ADMIN_EMAIL);
    } else if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    try {
      // 1. Call login-user API
      const loginRes = await fetch("/api/auth/login-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const loginData = await loginRes.json();

      if (!loginData.ok) {
        throw new Error(loginData.error || "Gagal masuk. Periksa kembali email dan kata sandi.");
      }

      // If logging in as admin
      if (loginData.is_admin || isAdmin) {
        localStorage.setItem("tatadana_admin_session", "authenticated");
        localStorage.setItem("tatadana_user_email", cleanEmail);
        document.cookie = "tatadana_admin_session=authenticated; path=/; max-age=86400";
        document.cookie = `tatadana_user_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=86400`;
        router.push("/admin/users");
        return;
      }

      // If logging in as regular user
      localStorage.removeItem("tatadana_admin_session");
      document.cookie = "tatadana_admin_session=; path=/; max-age=0";
      localStorage.setItem("tatadana_user_email", cleanEmail);
      localStorage.setItem("tatadana_user_name", loginData.user?.full_name || cleanEmail.split("@")[0]);
      document.cookie = `tatadana_user_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=86400`;

      if (loginData.is_approved || loginData.approval_status === "approved") {
        router.push("/dashboard");
      } else if (loginData.approval_status === "rejected") {
        setErrorMsg("Mohon maaf, permohonan akun Anda telah ditolak oleh Admin.");
      } else {
        // Account pending approval
        router.push(
          `/pending-approval?email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(loginData.user?.full_name || cleanEmail.split("@")[0])}`
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-brand-500 selection:text-white">
      {/* Kiri (40%) — Branding Panel (Part 8) */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-tr from-brand-700 via-brand-600 to-orange-500 p-12 flex-col justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white text-brand-600 font-extrabold flex items-center justify-center text-xl shadow-lg">
              TD
            </div>
            <span className="font-extrabold text-2xl tracking-tight">TataDana</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm">
            <span>✨ Sistem Keamanan & Persetujuan Admin</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Keuanganmu. Terkontrol.
          </h2>
          <p className="text-sm opacity-90 leading-relaxed max-w-sm">
            Pantau arus kas, sisa budget bulanan, dan struk belanjaanmu langsung dari genggaman tanpa repot buka aplikasi.
          </p>

          <div className="pt-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-200" />
              <span>Terhubung langsung dengan bot Telegram 24/7</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-200" />
              <span>AI Multimodal: parsing teks, voice note & struk</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-200" />
              <span>Persetujuan terpusat oleh Admin ({ADMIN_EMAIL})</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-orange-200">
          © {new Date().getFullYear()} TataDana. Hak cipta dilindungi.
        </div>
      </div>

      {/* Kanan (60%) — Form Login */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              {isAdminMode ? "Login Superadmin" : "Selamat Datang Kembali"}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              {isAdminMode
                ? "Masuk dengan akun admin untuk meninjau dan menyetujui pengguna."
                : "Masukkan email dan kata sandi Anda untuk masuk ke TataDana."}
            </p>
          </div>

          {/* Admin Mode Banner if triggered */}
          {isAdminMode ? (
            <div className="p-3.5 bg-brand-50 border border-brand-200 rounded-xl flex items-start gap-2.5 text-xs text-brand-900">
              <KeyRound className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">Mode Login Superadmin Aktif</p>
                <p className="text-[11px] text-brand-700 mt-0.5">
                  Anda login sebagai pengelola akun: <strong>{ADMIN_EMAIL}</strong>
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="leading-relaxed">
                <strong>Info Akses:</strong> Akun baru harus disetujui terlebih dahulu oleh Admin (<span className="font-semibold text-brand-600">{ADMIN_EMAIL}</span>) sebelum dapat mengakses dashboard.
              </p>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Kata Sandi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              required
            />

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={loading}
              className="w-full font-bold shadow-orange"
            >
              <span>{isAdminMode ? "Masuk ke Panel Admin" : "Masuk ke TataDana"}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="flex flex-col gap-2 pt-2 text-center text-xs text-zinc-500">
            <div>
              Belum punya akun?{" "}
              <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
                Daftar akun baru di sini
              </Link>
            </div>

            {!isAdminMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(true);
                  setEmail(ADMIN_EMAIL);
                }}
                className="text-[11px] text-zinc-400 hover:text-zinc-700 flex items-center justify-center gap-1 transition-colors"
              >
                <KeyRound className="w-3 h-3 text-brand-500" />
                <span>Masuk sebagai Admin ({ADMIN_EMAIL})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(false);
                  setEmail("");
                }}
                className="text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                ← Kembali ke Login Pengguna Biasa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
