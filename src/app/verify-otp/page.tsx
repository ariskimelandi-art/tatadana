"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "6281234567890";
  const userId = searchParams.get("userId") || "";

  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phone,
          otpCode: otpCode.trim(),
          userId,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setErrorMsg(data.error || "Kode OTP salah atau telah kadaluarsa");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal memverifikasi OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      alert(`Kode OTP baru telah dikirim ke +${phone} (Gunakan: 123456)`);
    } catch {
      alert("Gagal mengirim ulang OTP");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-surface-border shadow-soft p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-500 border border-brand-200 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            Verifikasi Nomor WhatsApp / HP
          </h2>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Masukkan kode OTP 6-digit yang kami kirimkan ke nomor:
          </p>
          <span className="font-bold text-sm text-zinc-800 font-mono block mt-0.5">
            +{phone}
          </span>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            [MODE TEST] Gunakan kode: 123456
          </span>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>Verifikasi Berhasil! Mengalihkan ke Dashboard...</span>
          </div>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                className="text-center font-mono text-2xl tracking-[0.5em] font-extrabold py-3"
                autoFocus
                required
              />
            </div>

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
              <span>Verifikasi & Masuk Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>
        )}

        <div className="text-xs text-zinc-400 flex items-center justify-between pt-2 border-t border-zinc-100">
          <button onClick={handleResend} className="font-semibold text-brand-600 hover:underline">
            Kirim Ulang Kode OTP
          </button>
          <Link href="/login" className="hover:underline">
            Ganti Nomor
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
