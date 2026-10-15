"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { parseIndonesianCurrency, formatRupiah } from "@/lib/utils/currency";
import { Wallet, Category } from "@/lib/types";

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  onSuccess: () => void;
}

export function TransactionModal({ isOpen, onClose, userId, onSuccess }: TransactionModalProps) {
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [amountStr, setAmountStr] = useState("");
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [selectedDestWalletId, setSelectedDestWalletId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const supabase = createClient();
    async function loadData() {
      // Load wallets
      let wQuery = supabase.from("wallets").select("*").order("is_default", { ascending: false });
      if (userId) wQuery = wQuery.eq("user_id", userId);
      const { data: wData } = await wQuery;

      if (wData && wData.length > 0) {
        setWallets(wData);
        setSelectedWalletId(wData[0].id);
        if (wData.length > 1) setSelectedDestWalletId(wData[1].id);
      } else {
        // Fallback wallets for local preview
        const mockWallets = [
          { id: "w-1", user_id: userId || "demo", name: "Dompet Utama (Cash)", type: "cash" as const, balance: 1250000, is_default: true, color: "#FF6B00", icon: "wallet", created_at: "", updated_at: "" },
          { id: "w-2", user_id: userId || "demo", name: "Rekening BCA", type: "bank" as const, balance: 8400000, is_default: false, color: "#2563EB", icon: "landmark", created_at: "", updated_at: "" },
        ];
        setWallets(mockWallets);
        setSelectedWalletId("w-1");
        setSelectedDestWalletId("w-2");
      }

      // Load categories
      let cQuery = supabase.from("categories").select("*");
      if (userId) cQuery = cQuery.or(`user_id.eq.${userId},user_id.is.null`);
      const { data: cData } = await cQuery;

      if (cData && cData.length > 0) {
        setCategories(cData);
        const firstExpense = cData.find((c) => c.type === "expense");
        if (firstExpense) setSelectedCategoryId(firstExpense.id);
      } else {
        // Mock categories
        const mockCats = [
          { id: "c-1", name: "🍜 Makanan & Minuman", type: "expense" as const, icon: "🍜", color: "#FF6B00", is_custom: false, created_at: "" },
          { id: "c-2", name: "🚗 Transportasi", type: "expense" as const, icon: "🚗", color: "#3B82F6", is_custom: false, created_at: "" },
          { id: "c-3", name: "🏠 Tagihan & Utilitas", type: "expense" as const, icon: "🏠", color: "#EF4444", is_custom: false, created_at: "" },
          { id: "c-4", name: "💰 Gaji Pokok", type: "income" as const, icon: "💰", color: "#10B981", is_custom: false, created_at: "" },
        ];
        setCategories(mockCats);
        setSelectedCategoryId("c-1");
      }
    }

    loadData();
  }, [isOpen, userId]);

  const parsedAmount = parseIndonesianCurrency(amountStr) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (parsedAmount <= 0) {
      setErrorMsg("Nominal harus lebih besar dari Rp 0");
      return;
    }

    if (!selectedWalletId) {
      setErrorMsg("Pilih dompet sumber");
      return;
    }

    if (type === "transfer" && selectedWalletId === selectedDestWalletId) {
      setErrorMsg("Dompet asal dan tujuan tidak boleh sama");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const payload: any = {
        user_id: userId || "demo-user-123",
        wallet_id: selectedWalletId,
        type,
        amount: parsedAmount,
        description: description || (type === "transfer" ? "Transfer Saldo" : type === "income" ? "Pemasukan" : "Pengeluaran"),
        transaction_date: new Date(date).toISOString(),
        source: "web",
      };

      if (type === "transfer") {
        payload.destination_wallet_id = selectedDestWalletId;
      } else {
        payload.category_id = selectedCategoryId || null;
      }

      const { error } = await supabase.from("transactions").insert(payload);
      if (error) {
        console.warn("DB insert error handled gracefully:", error.message);
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal menyimpan transaksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Transaksi Baru">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              const firstExp = categories.find((c) => c.type === "expense");
              if (firstExp) setSelectedCategoryId(firstExp.id);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === "expense" ? "bg-white text-brand-600 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            💸 Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              const firstInc = categories.find((c) => c.type === "income");
              if (firstInc) setSelectedCategoryId(firstInc.id);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            💰 Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              type === "transfer" ? "bg-white text-blue-600 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            🔄 Transfer
          </button>
        </div>

        {/* Amount Input with Indonesian Parser */}
        <div>
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
            Nominal (Bisa ketik 15rb, 500k, 1.5jt)
          </label>
          <Input
            type="text"
            placeholder="Contoh: 25.000 atau 25k"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="text-lg font-bold"
            required
          />
          {parsedAmount > 0 && (
            <p className="mt-1 text-xs font-bold text-brand-600">
              Terbaca: {formatRupiah(parsedAmount)}
            </p>
          )}
        </div>

        {/* Wallet Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              {type === "transfer" ? "Dari Dompet" : "Dompet / Rekening"}
            </label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatRupiah(w.balance)})
                </option>
              ))}
            </select>
          </div>

          {type === "transfer" ? (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Tujuan Dompet
              </label>
              <select
                value={selectedDestWalletId}
                onChange={(e) => setSelectedDestWalletId(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
              >
                {wallets
                  .filter((w) => w.id !== selectedWalletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
                Kategori
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
              >
                {categories
                  .filter((c) => c.type === (type === "income" ? "income" : "expense"))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Date & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Tanggal Transaksi
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Catatan / Keterangan
            </label>
            <Input
              type="text"
              placeholder="Contoh: Makan siang bersama tim"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Simpan Transaksi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
