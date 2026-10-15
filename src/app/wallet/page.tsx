"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayoutWrapper } from "@/components/dashboard/DashboardLayoutWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatRupiah, parseIndonesianCurrency } from "@/lib/utils/currency";
import { Wallet, WalletType } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Plus, Wallet as WalletIcon, Landmark, Smartphone, Star, ArrowRightLeft, Trash2 } from "lucide-react";

export default function WalletPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  // New Wallet form
  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState<WalletType>("bank");
  const [initialBalanceStr, setInitialBalanceStr] = useState("");
  const [walletColor, setWalletColor] = useState("#FF6B00");

  // Transfer form
  const [fromWalletId, setFromWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [transferAmountStr, setTransferAmountStr] = useState("");

  const [userId, setUserId] = useState<string>("demo-user-123");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  async function loadWallets() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);

    let query = supabase.from("wallets").select("*").order("is_default", { ascending: false });
    if (user) query = query.eq("user_id", user.id);
    const { data } = await query;

    if (data && data.length > 0) {
      setWallets(data);
      setFromWalletId(data[0].id);
      if (data.length > 1) setToWalletId(data[1].id);
    } else {
      // Mock wallets fallback
      const mock = [
        { id: "w-1", user_id: "demo", name: "Dompet Utama (Cash)", type: "cash" as const, balance: 1250000, is_default: true, color: "#FF6B00", icon: "wallet", created_at: "", updated_at: "" },
        { id: "w-2", user_id: "demo", name: "Rekening BCA", type: "bank" as const, balance: 8400000, is_default: false, color: "#2563EB", icon: "landmark", created_at: "", updated_at: "" },
        { id: "w-3", user_id: "demo", name: "GoPay Pribadi", type: "ewallet" as const, balance: 450000, is_default: false, color: "#06B6D4", icon: "smartphone", created_at: "", updated_at: "" },
      ];
      setWallets(mock);
      setFromWalletId("w-1");
      setToWalletId("w-2");
    }
  }

  const handleSetDefault = async (walletId: string) => {
    const supabase = createClient();
    // Update all to false, then this to true
    await supabase.from("wallets").update({ is_default: false }).eq("user_id", userId);
    await supabase.from("wallets").update({ is_default: true }).eq("id", walletId);
    await supabase.from("profiles").update({ default_wallet_id: walletId }).eq("id", userId);

    setWallets((prev) =>
      prev.map((w) => ({
        ...w,
        is_default: w.id === walletId,
      }))
    );
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const initBal = parseIndonesianCurrency(initialBalanceStr) || 0;
    setLoading(true);

    try {
      const supabase = createClient();
      await supabase.from("wallets").insert({
        user_id: userId,
        name: walletName,
        type: walletType,
        balance: initBal,
        color: walletColor,
        is_default: wallets.length === 0,
      });

      setModalOpen(false);
      setWalletName("");
      setInitialBalanceStr("");
      loadWallets();
    } catch (err: any) {
      alert(err.message || "Gagal membuat dompet");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseIndonesianCurrency(transferAmountStr) || 0;
    if (amount <= 0 || fromWalletId === toWalletId) {
      alert("Pilih dompet yang berbeda dan isi nominal transfer valid");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.from("transactions").insert({
        user_id: userId,
        wallet_id: fromWalletId,
        destination_wallet_id: toWalletId,
        type: "transfer",
        amount,
        description: "Transfer Antar Dompet",
        source: "web",
      });

      setTransferModalOpen(false);
      setTransferAmountStr("");
      loadWallets();
    } catch (err: any) {
      alert(err.message || "Transfer gagal");
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = wallets.reduce((acc, curr) => acc + Number(curr.balance), 0);

  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case "bank":
        return <Landmark className="w-5 h-5" />;
      case "ewallet":
        return <Smartphone className="w-5 h-5" />;
      default:
        return <WalletIcon className="w-5 h-5" />;
    }
  };

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
              Manajemen Dompet & Rekening
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Kelola saldo kas, rekening bank, dan e-wallet. Tentukan 1 dompet default untuk Telegram.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button onClick={() => setTransferModalOpen(true)} variant="outline" size="sm">
              <ArrowRightLeft className="w-4 h-4 text-zinc-600" />
              <span>Transfer Saldo</span>
            </Button>
            <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
              <Plus className="w-4 h-4" />
              <span>Tambah Dompet</span>
            </Button>
          </div>
        </div>

        {/* Total Wealth Banner */}
        <Card className="p-6 bg-white border border-surface-border">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Total Saldo Seluruh Dompet
          </span>
          <h3 className="text-3xl font-extrabold text-zinc-900 mt-1">
            {formatRupiah(totalBalance)}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Terdiri dari {wallets.length} sumber dana aktif.
          </p>
        </Card>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {wallets.map((w) => (
            <Card key={w.id} hoverEffect className="p-5 flex flex-col justify-between relative overflow-hidden">
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: w.color || "#FF6B00" }}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: w.color || "#FF6B00" }}
                    >
                      {getWalletIcon(w.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900">{w.name}</h4>
                      <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                        {w.type}
                      </span>
                    </div>
                  </div>

                  {w.is_default && (
                    <Badge variant="orange" size="sm">
                      <Star className="w-3 h-3 fill-brand-500" /> Default Bot
                    </Badge>
                  )}
                </div>

                <div className="my-2">
                  <span className="text-xs text-zinc-400 font-medium">Saldo Tersedia:</span>
                  <p className="text-2xl font-extrabold text-zinc-900 mt-0.5">
                    {formatRupiah(w.balance)}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
                {!w.is_default ? (
                  <button
                    onClick={() => handleSetDefault(w.id)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                  >
                    Jadikan Default Telegram
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    ✓ Dompet Utama
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Add Wallet */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Dompet Baru">
        <form onSubmit={handleCreateWallet} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Nama Dompet
            </label>
            <Input
              placeholder="Contoh: Rekening Mandiri, GoPay, Cash Harian"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Jenis Dompet
              </label>
              <select
                value={walletType}
                onChange={(e) => setWalletType(e.target.value as WalletType)}
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-brand-500 outline-none"
              >
                <option value="cash">Uang Tunai (Cash)</option>
                <option value="bank">Rekening Bank</option>
                <option value="ewallet">E-Wallet (GoPay/OVO/Dana)</option>
                <option value="investment">Investasi / Reksadana</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Warna Aksen
              </label>
              <div className="flex items-center gap-2 pt-1">
                {["#FF6B00", "#2563EB", "#10B981", "#8B5CF6", "#EF4444", "#EC4899"].map((color) => (
                  <button
                    type="button"
                    key={color}
                    onClick={() => setWalletColor(color)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      walletColor === color ? "scale-125 ring-2 ring-zinc-400" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Saldo Awal
            </label>
            <Input
              placeholder="Contoh: 500.000 atau 500k"
              value={initialBalanceStr}
              onChange={(e) => setInitialBalanceStr(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Simpan Dompet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Transfer Saldo */}
      <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Transfer Antar Dompet">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Dari Dompet
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none focus:border-brand-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Tujuan Dompet
              </label>
              <select
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none focus:border-brand-500"
              >
                {wallets
                  .filter((w) => w.id !== fromWalletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Nominal Transfer
            </label>
            <Input
              placeholder="Contoh: 100.000 atau 100k"
              value={transferAmountStr}
              onChange={(e) => setTransferAmountStr(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <Button type="button" variant="ghost" onClick={() => setTransferModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Kirim Transfer
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayoutWrapper>
  );
}
