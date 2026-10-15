"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayoutWrapper } from "@/components/dashboard/DashboardLayoutWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/utils/currency";
import { Profile, Category, ReminderSetting } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  Send,
  Bell,
  Tags,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
  Zap,
  Clock,
  Shield,
  Upload,
  Camera,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "telegram";
  const [activeTab, setActiveTab] = useState<"profile" | "telegram" | "reminder" | "categories" | "subscription">(
    initialTab as any
  );

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [reminder, setReminder] = useState<ReminderSetting>({
    id: "rem-1",
    user_id: "demo",
    is_active: true,
    frequency: "1x",
    time_1: "20:00:00",
    time_2: "12:00:00",
    custom_message: "",
    updated_at: "",
  });

  // Telegram test state (Part 5)
  const [botToken, setBotToken] = useState("");
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "connected" | "failed">("idle");
  const [testResult, setTestResult] = useState<{ message?: string; bot?: any; error?: string } | null>(null);

  // New Category state
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏷️");
  const [newCatType, setNewCatType] = useState<"expense" | "income">("expense");
  const [newCatColor, setNewCatColor] = useState("#FF6B00");
  const [recommendingCats, setRecommendingCats] = useState(false);

  // Payment states
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [manualProofUrl, setManualProofUrl] = useState("");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let currentEmail = "";
    let currentFullName = "";
    let currentAvatarUrl: string | null = null;

    if (user) {
      const { data: pData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (pData) {
        setProfile(pData);
        currentEmail = pData.email || user.email || "";
        currentFullName = pData.full_name || "";
        currentAvatarUrl = pData.avatar_url || null;
        if (pData.telegram_bot_token) setBotToken(pData.telegram_bot_token);
        if (pData.telegram_chat_id) setTestStatus("connected");
      }

      const { data: rData } = await supabase.from("reminders").select("*").eq("user_id", user.id).maybeSingle();
      if (rData) setReminder(rData);

      const { data: cData } = await supabase.from("categories").select("*").or(`user_id.eq.${user.id},user_id.is.null`);
      if (cData) setCategories(cData);
    } else {
      // Local / Demo profile fallback
      const storedEmail = typeof window !== "undefined" ? localStorage.getItem("tatadana_user_email") || "" : "";
      const storedName = typeof window !== "undefined" ? localStorage.getItem("tatadana_user_name") || "" : "";
      const storedAvatar = typeof window !== "undefined" ? localStorage.getItem("tatadana_user_avatar") || null : null;

      currentEmail = storedEmail || "geninggkimteaa@gmail.com";
      currentFullName = storedName || "Gening Kim (Superadmin)";
      currentAvatarUrl = storedAvatar;

      if (storedEmail) {
        try {
          const res = await fetch(`/api/auth/approval-status?email=${encodeURIComponent(storedEmail)}`);
          const data = await res.json();
          if (data.ok) {
            currentFullName = data.full_name || currentFullName;
            if (data.avatar_url) currentAvatarUrl = data.avatar_url;
          }
        } catch {}
      }

      setProfile({
        id: "demo-user-123",
        email: currentEmail,
        full_name: currentFullName,
        avatar_url: currentAvatarUrl,
        phone_number: "6281234567890",
        phone_verified: true,
        telegram_chat_id: 12345678,
        telegram_username: "gening_admin",
        telegram_link_token: "link_9a8b7c6d5e4f3a2b",
        plan: "pro",
        role: "admin",
        approval_status: "approved",
        currency: "IDR",
        monthly_tx_count: 18,
        last_tx_month: "2026-10",
        created_at: "",
        updated_at: "",
      });
      setTestStatus("connected");
      setCategories([
        { id: "c-1", name: "Makanan & Minuman", type: "expense", icon: "🍜", color: "#FF6B00", is_custom: false, created_at: "" },
        { id: "c-2", name: "Transportasi", type: "expense", icon: "🚗", color: "#3B82F6", is_custom: false, created_at: "" },
        { id: "c-3", name: "Tagihan & Utilitas", type: "expense", icon: "🏠", color: "#EF4444", is_custom: false, created_at: "" },
        { id: "c-4", name: "Belanja", type: "expense", icon: "👕", color: "#EC4899", is_custom: false, created_at: "" },
        { id: "c-5", name: "Gaji Pokok", type: "income", icon: "💰", color: "#10B981", is_custom: false, created_at: "" },
      ]);
    }

    setProfileName(currentFullName);
    setAvatarUrl(currentAvatarUrl);
  }

  // Profile Photo & Info Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert("Ukuran foto maksimal 3MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileSuccessMsg("");

    const targetEmail =
      profile?.email ||
      (typeof window !== "undefined" ? localStorage.getItem("tatadana_user_email") : "") ||
      "geninggkimteaa@gmail.com";

    try {
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          fullName: profileName.trim(),
          avatarUrl: avatarUrl,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        if (typeof window !== "undefined") {
          localStorage.setItem("tatadana_user_name", profileName.trim());
          if (avatarUrl) {
            localStorage.setItem("tatadana_user_avatar", avatarUrl);
          } else {
            localStorage.removeItem("tatadana_user_avatar");
          }
          window.dispatchEvent(
            new CustomEvent("tatadana_profile_updated", {
              detail: { fullName: profileName.trim(), avatarUrl: avatarUrl },
            })
          );
        }

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                full_name: profileName.trim(),
                avatar_url: avatarUrl,
              }
            : null
        );

        setProfileSuccessMsg("Profil dan foto berhasil diperbarui!");
        setTimeout(() => setProfileSuccessMsg(""), 4000);
      } else {
        alert(data.error || "Gagal menyimpan perubahan profil.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Telegram Test Koneksi Handler (Part 5)
  const handleTestConnection = async () => {
    if (!botToken.trim()) {
      alert("Masukkan token bot Telegram terlebih dahulu");
      return;
    }

    setTestStatus("testing");
    setTestResult(null);

    try {
      const res = await fetch("/api/telegram/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: botToken.trim(),
          userId: profile?.id,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setTestStatus("connected");
        setTestResult(data);
      } else {
        setTestStatus("failed");
        setTestResult({ error: data.error || "Token bot tidak valid" });
      }
    } catch (err: any) {
      setTestStatus("failed");
      setTestResult({ error: err?.message || "Koneksi gagal" });
    }
  };

  // AI Category Recommendation (Part 3)
  const handleRecommendCategories = async () => {
    setRecommendingCats(true);
    try {
      const res = await fetch("/api/ai/recommend-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupation: "Karyawan & Freelancer",
          monthlyIncomeRange: "Rp6.000.000 - Rp12.000.000",
          livingSituation: "Tinggal mandiri",
          userId: profile?.id,
        }),
      });
      const data = await res.json();
      if (data.categories) {
        setCategories((prev) => [...prev, ...data.categories]);
      }
    } catch (e) {
      alert("Gagal memuat rekomendasi kategori AI");
    } finally {
      setRecommendingCats(false);
    }
  };

  // Add custom category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const supabase = createClient();
    const newCat = {
      user_id: profile?.id,
      name: newCatName,
      type: newCatType,
      icon: newCatIcon || "🏷️",
      color: newCatColor,
      is_custom: true,
    };

    const { data } = await supabase.from("categories").insert(newCat).select().single();
    if (data) {
      setCategories((prev) => [...prev, data]);
    } else {
      setCategories((prev) => [...prev, { ...newCat, id: `cat-${Date.now()}`, created_at: "" }]);
    }

    setNewCatName("");
  };

  // Midtrans Payment Handler
  const handleUpgradeMidtrans = async () => {
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payments/create-midtrans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile?.id,
          plan: "pro",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPaymentSuccessMsg("Transaksi Midtrans berhasil disiapkan!");
        // Simulate instant demo upgrade if in dev environment
        if (data.token.startsWith("mock_")) {
          const supabase = createClient();
          await supabase.from("profiles").update({ plan: "pro" }).eq("id", profile?.id);
          setProfile((prev) => (prev ? { ...prev, plan: "pro" } : null));
          setPaymentSuccessMsg("🎉 Akun berhasil di-upgrade ke Pro!");
        }
      }
    } catch (e: any) {
      alert(e.message || "Gagal membuka pembayaran");
    } finally {
      setPaymentLoading(false);
    }
  };

  // Manual Transfer Submission
  const handleManualTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/payments/manual-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile?.id,
          plan: "pro",
          proofImageUrl: manualProofUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setPaymentSuccessMsg("Bukti transfer berhasil dikirim. Menunggu verifikasi admin.");
      }
    } catch (e: any) {
      alert(e.message || "Gagal mengirim bukti transfer");
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Berhasil disalin ke clipboard!");
  };

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 pb-12">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
            Pengaturan Akun & Integrasi
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Konfigurasi profil, bot Telegram, reminder harian, dan paket langganan
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 border-b border-surface-border overflow-x-auto pb-px">
          {[
            { id: "profile", label: "Profil", icon: User },
            { id: "telegram", label: "Telegram Bot", icon: Send },
            { id: "reminder", label: "Reminder", icon: Bell },
            { id: "categories", label: "Kategori", icon: Tags },
            { id: "subscription", label: "Langganan", icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? "border-brand-500 text-brand-600 bg-brand-50/50"
                    : "border-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-brand-500" : "text-zinc-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROFIL */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 md:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Data Pribadi & Foto Profil</CardTitle>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Perbarui nama lengkap dan foto profil akun TataDana Anda
                  </p>
                </div>
                {profileSuccessMsg && (
                  <Badge variant="green" size="md">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {profileSuccessMsg}
                  </Badge>
                )}
              </div>

              {/* Upload Foto Profil Section */}
              <div className="p-4 bg-surface-light rounded-2xl border border-surface-border space-y-4">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Foto Profil
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {/* Avatar Preview */}
                  <div className="relative group shrink-0">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Preview Foto Profil"
                        className="w-20 h-20 rounded-full object-cover border-2 border-brand-500 shadow-md ring-4 ring-brand-50"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-700 text-2xl font-bold flex items-center justify-center border-2 border-brand-300 ring-4 ring-brand-50">
                        {profileName ? profileName.charAt(0).toUpperCase() : profile?.full_name?.charAt(0) || "U"}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-md transition-all border-2 border-white"
                      title="Ganti foto dari file"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Action Buttons for Avatar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Unggah Foto
                      </Button>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Mendukung format JPG, PNG, atau WebP (maks. 3MB).
                    </p>
                  </div>
                </div>

                {/* Preset Avatars Selection */}
                <div className="pt-3 border-t border-zinc-200/60">
                  <p className="text-xs font-medium text-zinc-600 mb-2">
                    Atau pilih avatar default:
                  </p>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((preset, index) => {
                      const isSelected = avatarUrl === preset;
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`relative rounded-full transition-transform hover:scale-105 shrink-0 ${
                            isSelected
                              ? "ring-2 ring-brand-500 ring-offset-2 scale-105"
                              : "opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={preset}
                            alt={`Preset Avatar ${index + 1}`}
                            className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Input Nama & Kontak */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full rounded-xl border border-surface-border bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Email Akun
                  </label>
                  <input
                    type="email"
                    value={profile?.email || (typeof window !== "undefined" ? localStorage.getItem("tatadana_user_email") : "") || "geninggkimteaa@gmail.com"}
                    disabled
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Email ini diverifikasi dan disetujui oleh Administrator.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Nomor WhatsApp / HP (Terverifikasi)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input defaultValue={`+${profile?.phone_number || "6281234567890"}`} disabled />
                    {profile?.phone_verified && (
                      <Badge variant="green" size="md">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Mata Uang Utama
                  </label>
                  <select
                    defaultValue="IDR"
                    className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none"
                  >
                    <option value="IDR">IDR (Rp) — Rupiah Indonesia</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Perubahan akan langsung terlihat di navigasi dan sidebar.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="gap-2"
                >
                  {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </Card>

            {/* Right Card: Live Preview Card */}
            <Card className="p-6 text-center space-y-4 h-fit">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Kartu Profil Pengguna
              </div>
              <div className="relative mx-auto w-24 h-24">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profileName || profile?.full_name || "Foto Profil"}
                    className="w-24 h-24 rounded-full object-cover border-4 border-brand-500 shadow-md ring-4 ring-brand-50"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-brand-100 text-brand-700 text-3xl font-extrabold flex items-center justify-center border-4 border-brand-200 ring-4 ring-brand-50">
                    {profileName ? profileName.charAt(0).toUpperCase() : profile?.full_name?.charAt(0) || "U"}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div>
                <h4 className="font-extrabold text-base text-zinc-900 truncate px-2">
                  {profileName || profile?.full_name || "Pengguna TataDana"}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  {profile?.email || (typeof window !== "undefined" ? localStorage.getItem("tatadana_user_email") : "") || "geninggkimteaa@gmail.com"}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  +{profile?.phone_number || "6281234567890"}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Badge
                  variant={profile?.plan === "pro" ? "orange" : "zinc"}
                  size="md"
                  className="mx-auto"
                >
                  Paket: {profile?.plan ? profile.plan.toUpperCase() : "STARTER"}
                </Badge>
                <div className="text-[11px] text-zinc-500 bg-zinc-50 py-2 px-3 rounded-xl border border-zinc-100">
                  Status Akun: <span className="font-bold text-emerald-600">Aktif & Disetujui</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: TELEGRAM BOT (Part 5 Requirements) */}
        {activeTab === "telegram" && (
          <div className="space-y-6">
            {/* Connection Status Banner */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-zinc-900">Status Koneksi Telegram Bot</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Satu bot dipakai bersama, atau gunakan bot pribadi Anda dari @BotFather.
                    </p>
                  </div>
                </div>

                {/* Status Badge (Part 5) */}
                <div>
                  {testStatus === "testing" ? (
                    <Badge variant="orange" size="md">
                      ⏳ Testing...
                    </Badge>
                  ) : testStatus === "connected" ? (
                    <Badge variant="green" size="md">
                      🟢 Terhubung (@{profile?.telegram_username || "tatadana_bot"})
                    </Badge>
                  ) : testStatus === "failed" ? (
                    <Badge variant="red" size="md">
                      🔴 Tidak terhubung
                    </Badge>
                  ) : (
                    <Badge variant="zinc" size="md">
                      Belum dicek
                    </Badge>
                  )}
                </div>
              </div>

              {testResult?.error && (
                <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{testResult.error}</span>
                </div>
              )}

              {testResult?.message && (
                <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{testResult.message}</span>
                </div>
              )}
            </Card>

            {/* Step-by-Step Guide & Token Setup (Part 5) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* BotFather Guide */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-zinc-900">Panduan Step-by-Step @BotFather</span>
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                </div>
                <div className="space-y-3 text-xs text-zinc-600">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <p>
                      Buka aplikasi Telegram dan cari <strong className="text-brand-600">@BotFather</strong> (bot resmi centang biru).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <p>
                      Kirim perintah <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-800">/newbot</code> lalu ikuti instruksi untuk memberi nama bot Anda.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <p>
                      Pilih username bot yang berakhiran <code className="bg-zinc-100 px-1 py-0.5 rounded font-mono text-zinc-800">_bot</code> (contoh: <span className="font-mono">keuangan_budi_bot</span>).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold shrink-0 mt-0.5">
                      4
                    </span>
                    <p>
                      Salin kode HTTP API Token (panjang sekitar 45 karakter) lalu tempel pada form di sebelah kanan.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Token Input & Test Form */}
              <Card className="p-6 space-y-4">
                <CardTitle>Input Token Bot & Verifikasi</CardTitle>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    HTTP API Token Telegram
                  </label>
                  <Input
                    placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    type="password"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Token akan dienkripsi dengan standar AES-256 sebelum disimpan ke database.
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    onClick={handleTestConnection}
                    isLoading={testStatus === "testing"}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    Test Koneksi & Aktifkan Webhook
                  </Button>
                </div>

                {/* Deep Link Quick Connector */}
                <div className="mt-4 pt-4 border-t border-zinc-100">
                  <span className="text-xs font-semibold text-zinc-500">Tautan Cepat Telegram Anda:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      readOnly
                      value={`https://t.me/tatadana_bot?start=${profile?.telegram_link_token || "link_token"}`}
                      className="text-xs bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 flex-1 font-mono text-zinc-700"
                    />
                    <Button
                      onClick={() =>
                        copyToClipboard(`https://t.me/tatadana_bot?start=${profile?.telegram_link_token || "link_token"}`)
                      }
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: REMINDER (Part 3 & Part 4.8) */}
        {activeTab === "reminder" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 space-y-5">
              <CardTitle>Konfigurasi Pengingat Keuangan</CardTitle>
              <div className="flex items-center justify-between p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900">Aktifkan Reminder Otomatis</h4>
                  <p className="text-[11px] text-zinc-500">Kirim reminder via bot Telegram</p>
                </div>
                <input
                  type="checkbox"
                  checked={reminder.is_active}
                  onChange={(e) => setReminder({ ...reminder, is_active: e.target.checked })}
                  className="w-5 h-5 accent-brand-500 rounded cursor-pointer"
                />
              </div>

              {/* Frequency Picker (1x / 2x sehari) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Frekuensi Harian (Maksimal 2x / Hari Sesuai Kebijakan)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReminder({ ...reminder, frequency: "1x" })}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      reminder.frequency === "1x"
                        ? "border-brand-500 bg-brand-50 text-brand-700 shadow-xs"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    1x Sehari (Malam)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminder({ ...reminder, frequency: "2x" })}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      reminder.frequency === "2x"
                        ? "border-brand-500 bg-brand-50 text-brand-700 shadow-xs"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    2x Sehari (Siang & Malam)
                  </button>
                </div>
              </div>

              {/* Time Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                    Jam Reminder 1 (WIB)
                  </label>
                  <input
                    type="time"
                    value={reminder.time_1}
                    onChange={(e) => setReminder({ ...reminder, time_1: e.target.value })}
                    className="w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>

                {reminder.frequency === "2x" && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Jam Reminder 2 (WIB)
                    </label>
                    <input
                      type="time"
                      value={reminder.time_2}
                      onChange={(e) => setReminder({ ...reminder, time_2: e.target.value })}
                      className="w-full rounded-xl border border-surface-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 flex justify-end">
                <Button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.from("reminders").upsert({
                      user_id: profile?.id,
                      is_active: reminder.is_active,
                      frequency: reminder.frequency,
                      time_1: reminder.time_1,
                      time_2: reminder.time_2,
                    });
                    alert("Pengaturan reminder berhasil disimpan!");
                  }}
                  variant="primary"
                  size="sm"
                >
                  Simpan Pengaturan
                </Button>
              </div>
            </Card>

            {/* Live Reminder Message Preview (Part 4.8) */}
            <Card className="p-6 space-y-3 bg-gradient-to-br from-zinc-50 to-orange-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Preview Pesan Reminder Bot Telegram
              </span>
              <div className="bg-white rounded-2xl p-5 border border-brand-200/80 shadow-soft font-mono text-xs whitespace-pre-line text-zinc-800 leading-relaxed">
                ⏰ Reminder Keuangan!{"\n"}
                Jangan lupa catat pengeluaran hari ini ya 📝{"\n"}
                Pencatatan rutin = keuangan lebih terkontrol 💪{"\n"}
                Ketik transaksimu sekarang!
              </div>
              <p className="text-[11px] text-zinc-400">
                Pesan ini otomatis dikirimkan langsung ke chat Telegram Anda pada pukul{" "}
                <strong className="text-zinc-700">{reminder.time_1} WIB</strong>
                {reminder.frequency === "2x" && ` dan ${reminder.time_2} WIB`}.
              </p>
            </Card>
          </div>
        )}

        {/* TAB 4: KATEGORI */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 space-y-4">
              <CardTitle>Tambah Kategori Custom</CardTitle>
              <form onSubmit={handleAddCategory} className="space-y-3">
                <Input
                  label="Nama Kategori"
                  placeholder="Contoh: Belanja Online, Kopi, Kucing"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Emoji
                    </label>
                    <input
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="w-full border rounded-xl px-3 py-2 text-center text-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                      Jenis
                    </label>
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as any)}
                      className="w-full border rounded-xl px-2.5 py-2 text-xs outline-none"
                    >
                      <option value="expense">Pengeluaran</option>
                      <option value="income">Pemasukan</option>
                    </select>
                  </div>
                </div>

                <Button type="submit" variant="primary" size="sm" className="w-full">
                  Tambah Kategori
                </Button>
              </form>

              {/* AI Category Recommendation Trigger (Part 3) */}
              <div className="pt-4 border-t border-zinc-100">
                <Button
                  onClick={handleRecommendCategories}
                  isLoading={recommendingCats}
                  variant="outline"
                  size="sm"
                  className="w-full border-brand-300 text-brand-700 hover:bg-brand-50"
                >
                  <Sparkles className="w-4 h-4 text-brand-500" />
                  <span>Rekomendasikan Kategori via AI</span>
                </Button>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2 space-y-4">
              <CardTitle>Daftar Kategori Aktif ({categories.length})</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-1">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{c.icon}</span>
                      <div>
                        <span className="font-bold text-zinc-900 block">{c.name}</span>
                        <span className="text-[10px] uppercase font-semibold text-zinc-400">
                          {c.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      </div>
                    </div>
                    {c.is_custom && (
                      <Badge variant="orange" size="sm">
                        Custom
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* TAB 5: LANGGANAN (Part 6) */}
        {activeTab === "subscription" && (
          <div className="space-y-6">
            {paymentSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Starter Plan Card */}
              <Card className={`p-6 flex flex-col justify-between ${profile?.plan === "starter" ? "ring-2 ring-zinc-400" : ""}`}>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-zinc-900">Starter</h3>
                    {profile?.plan === "starter" && <Badge variant="zinc">Paket Aktif</Badge>}
                  </div>
                  <p className="text-2xl font-extrabold text-zinc-900 mb-4">
                    Rp49.000 <span className="text-xs font-medium text-zinc-400">/ bulan</span>
                  </p>
                  <ul className="space-y-2.5 text-xs text-zinc-600 mb-6">
                    <li className="flex items-center gap-2">✓ Catat transaksi via teks Telegram</li>
                    <li className="flex items-center gap-2">✓ Dashboard web lengkap</li>
                    <li className="flex items-center gap-2">✓ Maksimal 50 transaksi / bulan</li>
                    <li className="flex items-center gap-2">✓ Maksimal 3 wallet & 5 kategori budget</li>
                    <li className="flex items-center gap-2 text-zinc-400 line-through">✗ Input foto struk OCR AI</li>
                    <li className="flex items-center gap-2 text-zinc-400 line-through">✗ AI Financial Advisor</li>
                    <li className="flex items-center gap-2 text-zinc-400 line-through">✗ Export laporan lengkap PDF/Excel</li>
                  </ul>
                </div>
              </Card>

              {/* Pro Plan Card */}
              <Card className="p-6 flex flex-col justify-between border-2 border-brand-500 shadow-orange relative overflow-hidden bg-gradient-to-b from-orange-50/30 to-white">
                <div className="absolute top-3 right-3">
                  <Badge variant="orange" size="md">
                    ⭐ PALING HEMAT
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Pro Lifetime</h3>
                  <p className="text-3xl font-extrabold text-brand-600 my-2">
                    Rp99.000 <span className="text-xs font-medium text-zinc-500">Sekali Bayar Seumur Hidup</span>
                  </p>
                  <ul className="space-y-2.5 text-xs text-zinc-700 mb-6">
                    <li className="flex items-center gap-2 font-bold text-brand-800">
                      ✓ Semua fitur Starter tanpa batas
                    </li>
                    <li className="flex items-center gap-2 font-medium">✓ Unlimited transaksi, wallet, dan kategori</li>
                    <li className="flex items-center gap-2 font-medium">✓ Input via foto struk dengan AI OCR otomatis</li>
                    <li className="flex items-center gap-2 font-medium">✓ Export unlimited laporan ke PDF dan Excel (.xlsx)</li>
                    <li className="flex items-center gap-2 font-medium">✓ AI Financial Advisor aktif</li>
                    <li className="flex items-center gap-2 font-medium">✓ Reminder custom & prioritas support</li>
                  </ul>
                </div>

                {profile?.plan === "pro" ? (
                  <Badge variant="green" size="md" className="py-2 justify-center font-bold">
                    ✓ Akun Pro Lifetime Aktif
                  </Badge>
                ) : (
                  <div className="space-y-3">
                    <Button
                      onClick={handleUpgradeMidtrans}
                      isLoading={paymentLoading}
                      variant="primary"
                      size="md"
                      className="w-full text-sm font-bold shadow-orange"
                    >
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Bayar Otomatis via Midtrans (Rp99rb)</span>
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* Manual Transfer Option Form */}
            {profile?.plan !== "pro" && (
              <Card className="p-6 space-y-4">
                <CardTitle>Opsi Pembayaran Manual Bank Transfer</CardTitle>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1.5 text-zinc-700">
                  <p><strong>Bank BCA:</strong> 873-091-2345 a.n PT TataDana Solusi Indonesia</p>
                  <p><strong>Bank Mandiri:</strong> 137-00-1928374-1 a.n PT TataDana Solusi Indonesia</p>
                  <p className="text-zinc-500 text-[11px] pt-1">
                    Setelah transfer nominal Rp99.000, cantumkan tautan bukti transfer Anda di bawah untuk diverifikasi admin dalam 1x24 jam.
                  </p>
                </div>

                <form onSubmit={handleManualTransfer} className="space-y-3">
                  <Input
                    placeholder="URL bukti transfer (misal: link Google Drive atau Supabase Storage)"
                    value={manualProofUrl}
                    onChange={(e) => setManualProofUrl(e.target.value)}
                    required
                  />
                  <Button type="submit" isLoading={paymentLoading} variant="outline" size="sm">
                    <Upload className="w-4 h-4" />
                    <span>Kirim Bukti Pembayaran Manual</span>
                  </Button>
                </form>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
