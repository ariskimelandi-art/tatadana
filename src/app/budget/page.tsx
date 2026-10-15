"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayoutWrapper } from "@/components/dashboard/DashboardLayoutWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatRupiah, parseIndonesianCurrency } from "@/lib/utils/currency";
import { Budget, Category } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Plus, PieChart, AlertTriangle, CheckCircle, Trash2, Edit2, Sparkles } from "lucide-react";

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [limitStr, setLimitStr] = useState("");
  const [userId, setUserId] = useState<string>("demo-user-123");
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    loadBudgets();
  }, []);

  async function loadBudgets() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);

    // Load categories
    const { data: cData } = await supabase.from("categories").select("*").eq("type", "expense");
    if (cData && cData.length > 0) {
      setCategories(cData);
      setSelectedCategoryId(cData[0].id);
    }

    // Load budgets
    let bQuery = supabase
      .from("budgets")
      .select("*, category:category_id(*)")
      .eq("month", currentMonth)
      .eq("year", currentYear);
    if (user) bQuery = bQuery.eq("user_id", user.id);
    const { data: bData } = await bQuery;

    // Load spent amounts for this month
    const monthStart = new Date(currentYear, currentMonth - 1, 1).toISOString();
    let tQuery = supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("type", "expense")
      .gte("transaction_date", monthStart);
    if (user) tQuery = tQuery.eq("user_id", user.id);
    const { data: tData } = await tQuery;

    const spentMap: Record<string, number> = {};
    (tData || []).forEach((t) => {
      if (t.category_id) {
        spentMap[t.category_id] = (spentMap[t.category_id] || 0) + Number(t.amount);
      }
    });

    if (bData && bData.length > 0) {
      const enriched = bData.map((b) => {
        const spent = spentMap[b.category_id] || 0;
        const limit = Number(b.monthly_limit);
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        return {
          ...b,
          spent,
          remaining: Math.max(0, limit - spent),
          percentage: pct,
        };
      });
      setBudgets(enriched);
    } else {
      // Mock budgets fallback
      setBudgets([
        {
          id: "b-1",
          user_id: "demo",
          category_id: "c-1",
          monthly_limit: 2500000,
          month: currentMonth,
          year: currentYear,
          alert_80_sent: false,
          alert_100_sent: false,
          spent: 1850000,
          remaining: 650000,
          percentage: 74,
          created_at: "",
          updated_at: "",
          category: { id: "c-1", name: "Makanan & Minuman", type: "expense", icon: "🍜", color: "#FF6B00", is_custom: false, created_at: "" },
        },
        {
          id: "b-2",
          user_id: "demo",
          category_id: "c-2",
          monthly_limit: 800000,
          month: currentMonth,
          year: currentYear,
          alert_80_sent: true,
          alert_100_sent: false,
          spent: 680000,
          remaining: 120000,
          percentage: 85,
          created_at: "",
          updated_at: "",
          category: { id: "c-2", name: "Transportasi", type: "expense", icon: "🚗", color: "#3B82F6", is_custom: false, created_at: "" },
        },
        {
          id: "b-3",
          user_id: "demo",
          category_id: "c-3",
          monthly_limit: 1000000,
          month: currentMonth,
          year: currentYear,
          alert_80_sent: true,
          alert_100_sent: true,
          spent: 1050000,
          remaining: 0,
          percentage: 105,
          created_at: "",
          updated_at: "",
          category: { id: "c-3", name: "Tagihan & Utilitas", type: "expense", icon: "🏠", color: "#EF4444", is_custom: false, created_at: "" },
        },
      ]);
    }
  }

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseIndonesianCurrency(limitStr) || 0;
    if (limitNum <= 0) {
      alert("Masukkan nominal limit budget yang valid");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    try {
      await supabase.from("budgets").upsert(
        {
          user_id: userId,
          category_id: selectedCategoryId,
          monthly_limit: limitNum,
          month: currentMonth,
          year: currentYear,
        },
        { onConflict: "user_id, category_id, month, year" }
      );
      setModalOpen(false);
      setLimitStr("");
      loadBudgets();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan budget");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Hapus budget kategori ini?")) return;
    const supabase = createClient();
    await supabase.from("budgets").delete().eq("id", id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const totalBudget = budgets.reduce((acc, curr) => acc + Number(curr.monthly_limit), 0);
  const totalSpent = budgets.reduce((acc, curr) => acc + (curr.spent || 0), 0);

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
              Target Budget Bulanan
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Notifikasi Telegram otomatis akan terkirim begitu pengeluaran mencapai 80% dan 100%
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            <span>Atur Budget Kategori</span>
          </Button>
        </div>

        {/* Global Budget Card */}
        <Card className="p-6 bg-gradient-to-r from-orange-500 to-brand-600 text-white shadow-orange">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider opacity-85">
                Total Budget Bulan Ini ({currentMonth}/{currentYear})
              </span>
              <h3 className="text-3xl font-extrabold mt-1">{formatRupiah(totalBudget)}</h3>
              <p className="text-xs opacity-90 mt-1">
                Terpakai: {formatRupiah(totalSpent)} ({totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%)
              </p>
            </div>
            <div className="text-left sm:text-right bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <span className="text-xs uppercase font-semibold opacity-80">Sisa Kuota</span>
              <p className="text-2xl font-bold mt-0.5">
                {formatRupiah(Math.max(0, totalBudget - totalSpent))}
              </p>
            </div>
          </div>
        </Card>

        {/* Budget Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => {
            const pct = Math.round(b.percentage || 0);
            const isDanger = pct >= 100;
            const isWarning = pct >= 80 && pct < 100;

            return (
              <Card key={b.id} hoverEffect className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{b.category?.icon || "🏷️"}</span>
                      <h4 className="font-bold text-sm text-zinc-900">{b.category?.name || "Kategori"}</h4>
                    </div>

                    {isDanger ? (
                      <Badge variant="red" size="sm">
                        <AlertTriangle className="w-3 h-3" /> Over 100%
                      </Badge>
                    ) : isWarning ? (
                      <Badge variant="orange" size="sm">
                        <AlertTriangle className="w-3 h-3" /> Waspada {pct}%
                      </Badge>
                    ) : (
                      <Badge variant="green" size="sm">
                        <CheckCircle className="w-3 h-3" /> Aman ({pct}%)
                      </Badge>
                    )}
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden my-3">
                    <div
                      style={{ width: `${Math.min(100, pct)}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDanger ? "bg-red-500" : isWarning ? "bg-brand-500" : "bg-emerald-500"
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-500 mt-2">
                    <span>Terpakai: <strong className="text-zinc-800">{formatRupiah(b.spent)}</strong></span>
                    <span>Batas: <strong className="text-zinc-800">{formatRupiah(b.monthly_limit)}</strong></span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    Sisa: <strong className={isDanger ? "text-red-500" : "text-emerald-600"}>{formatRupiah(b.remaining)}</strong>
                  </span>

                  <button
                    onClick={() => handleDeleteBudget(b.id)}
                    className="p-1 text-zinc-300 hover:text-red-500 transition-colors"
                    title="Hapus Budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal Add Budget */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Atur Budget Kategori">
        <form onSubmit={handleCreateBudget} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Pilih Kategori
            </label>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1">
              Batas Pengeluaran Bulanan (Bisa ketik 1jt, 2.5jt, dll)
            </label>
            <Input
              placeholder="Contoh: 1.500.000 atau 1.5jt"
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              required
            />
            {parseIndonesianCurrency(limitStr) ? (
              <p className="mt-1 text-xs font-bold text-brand-600">
                Terbaca: {formatRupiah(parseIndonesianCurrency(limitStr))}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Simpan Budget
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayoutWrapper>
  );
}
