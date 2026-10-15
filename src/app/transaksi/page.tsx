"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayoutWrapper } from "@/components/dashboard/DashboardLayoutWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { formatRupiah } from "@/lib/utils/currency";
import { formatDateTimeWIB } from "@/lib/utils/date-wib";
import { Transaction } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Plus, Search, Trash2, Camera, Mic, MessageSquare, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<"all" | "expense" | "income" | "transfer">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [userId, setUserId] = useState<string>("demo-user-123");

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);

    let query = supabase
      .from("transactions")
      .select("*, category:category_id(*), wallet:wallet_id(*)")
      .order("transaction_date", { ascending: false });

    if (user) query = query.eq("user_id", user.id);
    const { data } = await query;

    if (data && data.length > 0) {
      setTransactions(data);
    } else {
      // Mock transactions fallback
      setTransactions([
        {
          id: "tx-1",
          user_id: "demo",
          wallet_id: "w-1",
          type: "expense",
          amount: 45000,
          description: "Makan Siang Nasi Padang Rendang",
          transaction_date: new Date().toISOString(),
          source: "telegram_text",
          is_receipt_parent: false,
          created_at: "",
          wallet: { id: "w-1", user_id: "demo", name: "Dompet Utama (Cash)", type: "cash", balance: 1250000, is_default: true, color: "#FF6B00", icon: "wallet", created_at: "", updated_at: "" },
          category: { id: "c-1", name: "Makanan & Minuman", type: "expense", icon: "🍜", color: "#FF6B00", is_custom: false, created_at: "" },
        },
        {
          id: "tx-2",
          user_id: "demo",
          wallet_id: "w-2",
          type: "expense",
          amount: 285000,
          description: "Belanja Supermarket Hypermart",
          transaction_date: new Date(Date.now() - 3600000 * 5).toISOString(),
          source: "telegram_receipt",
          is_receipt_parent: true,
          created_at: "",
          wallet: { id: "w-2", user_id: "demo", name: "Rekening BCA", type: "bank", balance: 8400000, is_default: false, color: "#2563EB", icon: "landmark", created_at: "", updated_at: "" },
          category: { id: "c-4", name: "Belanja Bulanan", type: "expense", icon: "👕", color: "#EC4899", is_custom: false, created_at: "" },
        },
        {
          id: "tx-3",
          user_id: "demo",
          wallet_id: "w-2",
          type: "income",
          amount: 14500000,
          description: "Gaji Pokok Oktober 2026",
          transaction_date: new Date(Date.now() - 3600000 * 24).toISOString(),
          source: "telegram_text",
          is_receipt_parent: false,
          created_at: "",
          wallet: { id: "w-2", user_id: "demo", name: "Rekening BCA", type: "bank", balance: 8400000, is_default: false, color: "#2563EB", icon: "landmark", created_at: "", updated_at: "" },
          category: { id: "c-inc", name: "Gaji Pokok", type: "income", icon: "💰", color: "#10B981", is_custom: false, created_at: "" },
        },
      ]);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const filtered = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (t.description || "").toLowerCase().includes(q) ||
        (t.category?.name || "").toLowerCase().includes(q) ||
        (t.wallet?.name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
              Daftar Transaksi
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Semua pemasukan, pengeluaran, dan transfer yang tercatat
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </Button>
        </div>

        {/* Filter bar */}
        <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Cari transaksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto bg-zinc-100 p-1 rounded-xl">
            {(["all", "expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  filterType === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {t === "all" ? "Semua" : t === "expense" ? "Pengeluaran" : t === "income" ? "Pemasukan" : "Transfer"}
              </button>
            ))}
          </div>
        </Card>

        {/* Transactions List */}
        <Card className="p-0 overflow-hidden divide-y divide-zinc-100">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-xs">
              Tidak ada transaksi yang cocok.
            </div>
          ) : (
            filtered.map((tx) => {
              const isIncome = tx.type === "income";
              const isTransfer = tx.type === "transfer";

              return (
                <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isIncome
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : isTransfer
                          ? "bg-blue-50 border-blue-200 text-blue-600"
                          : "bg-orange-50 border-orange-200 text-brand-600"
                      }`}
                    >
                      {isIncome ? <ArrowUpRight className="w-5 h-5" /> : isTransfer ? <RefreshCw className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-zinc-900 truncate">
                          {tx.description || tx.category?.name || "Transaksi"}
                        </p>
                        {tx.source === "telegram_receipt" && (
                          <Badge variant="orange" size="sm"><Camera className="w-3 h-3" /> Struk</Badge>
                        )}
                        {tx.source === "telegram_voice" && (
                          <Badge variant="purple" size="sm"><Mic className="w-3 h-3" /> Voice</Badge>
                        )}
                        {tx.source === "telegram_text" && (
                          <Badge variant="blue" size="sm"><MessageSquare className="w-3 h-3" /> Bot</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                        <span>{formatDateTimeWIB(tx.transaction_date)}</span>
                        <span>•</span>
                        <span className="font-medium text-zinc-600">👛 {tx.wallet?.name || "Dompet"}</span>
                        {tx.category && (
                          <>
                            <span>•</span>
                            <span>{tx.category.icon} {tx.category.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`text-base font-extrabold ${
                        isIncome ? "text-emerald-600" : isTransfer ? "text-blue-600" : "text-zinc-900"
                      }`}
                    >
                      {isIncome ? "+" : isTransfer ? "⇄ " : "-"}
                      {formatRupiah(tx.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={userId}
        onSuccess={() => {
          setModalOpen(false);
          loadTransactions();
        }}
      />
    </DashboardLayoutWrapper>
  );
}
