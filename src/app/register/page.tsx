"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle2, ShieldCheck, Clock } from "lucide-react";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [occupation, setOccupation] = useState("Karyawan Swasta");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "62" + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith("62")) cleanPhone = "62" + cleanPhone;

    if (cleanPhone.length < 10) {
      setErrorMsg("Nomor HP / WhatsApp minimal 10 digit.");
      setLoading(false);
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();
    const supabase = createClient();

    try {
      // 1. Save user to persistent store
      const regRes = await fetch("/api/auth/register-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email: cleanEmail,
          phone: cleanPhone,
          password,
        }),
      });
      const regData = await regRes.json();
      if (!regData.ok) {
        throw new Error(regData.error || "Gagal mendaftarkan akun.");
      }

      // Save user identity in storage & cookies
      localStorage.setItem("tatadana_user_email", cleanEmail);
      localStorage.setItem("tatadana_user_name", fullName);
      document.cookie = `tatadana_user_email=${encodeURIComponent(cleanEmail)}; path=/; max-age=86400`;

      // Save to localStorage pending registrations for immediate sync with admin dashboard
      try {
        const storedPending = JSON.parse(localStorage.getItem("tatadana_pending_registrations") || "[]");
        const pendingEntry = {
          id: regData.user?.id || `usr-${Date.now()}`,
          full_name: fullName.trim(),
          email: cleanEmail,
          phone_number: cleanPhone,
          phone_verified: true,
          plan: "starter",
          role: "user",
          approval_status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const existingIdx = storedPending.findIndex((u: any) => u.email?.toLowerCase() === cleanEmail);
        if (existingIdx >= 0) {
          storedPending[existingIdx] = pendingEntry;
        } else {
          storedPending.unshift(pendingEntry);
        }
        localStorage.setItem("tatadana_pending_registrations", JSON.stringify(storedPending));
      } catch (e) {
        // ignore
      }

      // 2. Supabase Auth Sign Up (fallback-safe)
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: cleanPhone,
              phone_verified: true,
              approval_status: isAdmin ? "approved" : "pending",
              role: isAdmin ? "admin" : "user",
            },
          },
        });
      } catch (sbError) {
        console.warn("Supabase auth signUp note:", sbError);
      }

      // If registered as admin, route directly to admin dashboard
      if (isAdmin) {
        localStorage.setItem("tatadana_admin_session", "authenticated");
        document.cookie = "tatadana_admin_session=authenticated; path=/; max-age=86400";
        router.push("/admin/users");
        return;
      }

      // Clear admin session if testing normal user
      document.cookie = "tatadana_admin_session=; path=/; max-age=0";
      localStorage.removeItem("tatadana_admin_session");

      // Redirect immediately to Pending Approval Page (No OTP required)
      router.push(`/pending-approval?email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(fullName)}`);
    } catch (err: any) {
      setErrorMsg(err?.message || "Pendaftaran gagal. Silakan coba lagi.");
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
            <span>🚀 Buat Akun Baru TataDana</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Mulai Kendalikan Keuanganmu Hari Ini.
          </h2>
          <p className="text-sm opacity-90 leading-relaxed max-w-sm">
            Daftar sekarang untuk mulai mencatat keuangan semudah chat Telegram.
          </p>

          <div className="pt-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-200" />
              <span>Multi-Wallet: Bank BCA, Mandiri, Cash & E-Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-200" />
              <span>Laporan analitik instan dengan ekspor PDF & Excel</span>
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

      {/* Kanan (60%) — Form Register */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
              Daftar Akun TataDana
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500">
              Isi data Anda di bawah ini untuk mengajukan pembuatan akun.
            </p>
          </div>

          {/* Info Banner Persetujuan Admin */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>Proses Persetujuan:</strong> Setelah mendaftar, akun Anda akan ditinjau dan disetujui langsung oleh Admin (<span className="font-semibold text-brand-600">{ADMIN_EMAIL}</span>) sebelum dapat masuk ke dashboard.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Nama Lengkap"
              type="text"
              placeholder="Budi Pratama"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Nomor WhatsApp / HP
              </label>
              <Input
                type="tel"
                placeholder="081234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="Digunakan saat menghubungkan akun ke bot Telegram TataDana."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                Profesi / Gaya Hidup (Rekomendasi Kategori AI)
              </label>
              <select
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none focus:border-brand-500"
              >
                <option value="Karyawan Swasta">Karyawan Swasta</option>
                <option value="Freelancer & Kreator">Freelancer & Kreator</option>
                <option value="Mahasiswa / Pelajar">Mahasiswa / Pelajar</option>
                <option value="Wirausaha / UMKM">Wirausaha / UMKM</option>
              </select>
            </div>

            <Input
              label="Kata Sandi"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              minLength={6}
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
              className="w-full font-bold shadow-orange mt-2"
            >
              <span>Daftar Akun Baru</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="text-center text-xs text-zinc-500">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700 hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
