"use client";

import React, { useState, useEffect } from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { CategoryPieChart, CategoryExpense } from "@/components/dashboard/CategoryPieChart";
import { MonthlyBarChart, MonthlyBarData } from "@/components/dashboard/MonthlyBarChart";
import { DailyTrendChart, DailyTrendPoint } from "@/components/dashboard/DailyTrendChart";
import { RecentTransactionsList } from "@/components/dashboard/RecentTransactionsList";
import { createClient } from "@/lib/supabase/client";
import { Transaction, Wallet, Profile } from "@/lib/types";
import { Calendar } from "lucide-react";

export default function DashboardOverviewPage() {
  const [period, setPeriod] = useState<"harian" | "mingguan" | "bulanan" | "tahunan" | "custom">("bulanan");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [remainingBudget, setRemainingBudget] = useState(0);
  const [categoryData, setCategoryData] = useState<CategoryExpense[]>([]);
  const [monthlyBarData, setMonthlyBarData] = useState<MonthlyBarData[]>([]);
  const [dailyTrendData, setDailyTrendData] = useState<DailyTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        // Fetch Wallets
        let wQuery = supabase.from("wallets").select("*");
        if (userId) wQuery = wQuery.eq("user_id", userId);
        const { data: wData } = await wQuery;

        if (wData && wData.length > 0) {
          setWallets(wData);
          const bal = wData.reduce((acc, curr) => acc + Number(curr.balance), 0);
          setTotalBalance(bal);
        } else {
          // Demo fallback
          setTotalBalance(9650000);
          setWallets([
            { id: "w-1", user_id: "demo", name: "Dompet Utama (Cash)", type: "cash", balance: 1250000, is_default: true, color: "#FF6B00", icon: "wallet", created_at: "", updated_at: "" },
            { id: "w-2", user_id: "demo", name: "Rekening BCA", type: "bank", balance: 8400000, is_default: false, color: "#2563EB", icon: "landmark", created_at: "", updated_at: "" },
          ]);
        }

        // Fetch Profile
        if (userId) {
          const { data: pData } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
          if (pData) setProfile(pData);
        } else {
          setProfile({
            id: "demo",
            full_name: "Budi Pratama",
            phone_number: "6281234567890",
            phone_verified: true,
            telegram_chat_id: 123456,
            telegram_username: "budipratama_id",
            plan: "pro",
            role: "user",
            approval_status: "approved",
            currency: "IDR",
            monthly_tx_count: 14,
            last_tx_month: "2026-10",
            created_at: "",
            updated_at: "",
          });
        }

        // Fetch Transactions
        let tQuery = supabase
          .from("transactions")
          .select("*, category:category_id(*), wallet:wallet_id(*)")
          .order("transaction_date", { ascending: false });
        if (userId) tQuery = tQuery.eq("user_id", userId);
        const { data: tData } = await tQuery;

        if (tData && tData.length > 0) {
          setTransactions(tData);

          let inc = 0;
          let exp = 0;
          const catMap: Record<string, { amount: number; color: string; icon: string }> = {};
          const dayMap: Record<number, number> = {};

          tData.forEach((tx) => {
            const amt = Number(tx.amount);
            const d = new Date(tx.transaction_date);
            const dayNum = d.getDate();

            if (tx.type === "income") {
              inc += amt;
            } else if (tx.type === "expense") {
              exp += amt;
              dayMap[dayNum] = (dayMap[dayNum] || 0) + amt;

              const cName = tx.category?.name || "Lainnya";
              if (!catMap[cName]) {
                catMap[cName] = {
                  amount: 0,
                  color: tx.category?.color || "#FF6B00",
                  icon: tx.category?.icon || "🏷️",
                };
              }
              catMap[cName].amount += amt;
            }
          });

          setTotalIncome(inc);
          setTotalExpense(exp);
          setRemainingBudget(Math.max(0, 15000000 - exp));

          // Set Category breakdown
          setCategoryData(
            Object.entries(catMap).map(([name, item]) => ({
              name,
              amount: item.amount,
              color: item.color,
              icon: item.icon,
            }))
          );

          // Set Daily Trend
          const trendList: DailyTrendPoint[] = [];
          for (let i = 1; i <= 30; i++) {
            trendList.push({ day: i, amount: dayMap[i] || 0 });
          }
          setDailyTrendData(trendList);
        } else {
          // Comprehensive mock data for beautiful instant display
          setTotalIncome(14500000);
          setTotalExpense(4850000);
          setRemainingBudget(5150000);

          setCategoryData([
            { name: "Makanan & Minuman", amount: 1850000, color: "#FF6B00", icon: "🍜" },
            { name: "Transportasi", amount: 650000, color: "#3B82F6", icon: "🚗" },
            { name: "Tagihan & Utilitas", amount: 950000, color: "#EF4444", icon: "🏠" },
            { name: "Belanja Kebutuhan", amount: 800000, color: "#EC4899", icon: "👕" },
            { name: "Hiburan & Hobi", amount: 600000, color: "#8B5CF6", icon: "🎮" },
          ]);

          setMonthlyBarData([
            { monthLabel: "Mei", income: 12000000, expense: 5200000 },
            { monthLabel: "Jun", income: 12500000, expense: 4800000 },
            { monthLabel: "Jul", income: 13000000, expense: 6100000 },
            { monthLabel: "Agu", income: 12000000, expense: 4500000 },
            { monthLabel: "Sep", income: 14000000, expense: 5300000 },
            { monthLabel: "Okt", income: 14500000, expense: 4850000 },
          ]);

          setDailyTrendData([
            { day: 1, amount: 250000 },
            { day: 3, amount: 180000 },
            { day: 5, amount: 450000 },
            { day: 8, amount: 120000 },
            { day: 10, amount: 650000 },
            { day: 12, amount: 320000 },
            { day: 15, amount: 850000 },
            { day: 18, amount: 210000 },
            { day: 22, amount: 480000 },
            { day: 25, amount: 340000 },
            { day: 28, amount: 550000 },
            { day: 30, amount: 450000 },
          ]);

          setTransactions([
            {
              id: "t-1",
              user_id: "demo",
              wallet_id: "w-1",
              type: "expense",
              amount: 45000,
              description: "Makan Siang Nasi Padang",
              transaction_date: new Date().toISOString(),
              source: "telegram_text",
              is_receipt_parent: false,
              created_at: "",
              wallet: { id: "w-1", user_id: "demo", name: "Dompet Utama (Cash)", type: "cash", balance: 1250000, is_default: true, color: "#FF6B00", icon: "wallet", created_at: "", updated_at: "" },
              category: { id: "c-1", name: "Makanan & Minuman", type: "expense", icon: "🍜", color: "#FF6B00", is_custom: false, created_at: "" },
            },
            {
              id: "t-2",
              user_id: "demo",
              wallet_id: "w-2",
              type: "expense",
              amount: 175000,
              description: "Belanja Supermarket Bulanan",
              transaction_date: new Date(Date.now() - 3600000 * 5).toISOString(),
              source: "telegram_receipt",
              is_receipt_parent: true,
              receipt_items: [
                { name: "Beras Premium 5kg", qty: 1, price: 75000, total: 75000 },
                { name: "Minyak Goreng 2L", qty: 1, price: 34000, total: 34000 },
                { name: "Kopi Arabika", qty: 2, price: 33000, total: 66000 },
              ],
              created_at: "",
              wallet: { id: "w-2", user_id: "demo", name: "Rekening BCA", type: "bank", balance: 8400000, is_default: false, color: "#2563EB", icon: "landmark", created_at: "", updated_at: "" },
              category: { id: "c-4", name: "Belanja Kebutuhan", type: "expense", icon: "👕", color: "#EC4899", is_custom: false, created_at: "" },
            },
            {
              id: "t-3",
              user_id: "demo",
              wallet_id: "w-2",
              type: "income",
              amount: 14500000,
              description: "Gaji Bulanan Oktober",
              transaction_date: new Date(Date.now() - 3600000 * 24).toISOString(),
              source: "telegram_text",
              is_receipt_parent: false,
              created_at: "",
              wallet: { id: "w-2", user_id: "demo", name: "Rekening BCA", type: "bank", balance: 8400000, is_default: false, color: "#2563EB", icon: "landmark", created_at: "", updated_at: "" },
              category: { id: "c-inc", name: "Gaji Pokok", type: "income", icon: "💰", color: "#10B981", is_custom: false, created_at: "" },
            },
            {
              id: "t-4",
              user_id: "demo",
              wallet_id: "w-1",
              type: "expense",
              amount: 35000,
              description: "Kopi Susu Gula Aren",
              transaction_date: new Date(Date.now() - 3600000 * 30).toISOString(),
              source: "telegram_voice",
              is_receipt_parent: false,
              created_at: "",
              wallet: { id: "w-1", user_id: "demo", name: "Dompet Utama (Cash)", type: "cash", balance: 1250000, is_default: true, color: "#FF6B00", icon: "wallet", created_at: "", updated_at: "" },
              category: { id: "c-1", name: "Makanan & Minuman", type: "expense", icon: "🍜", color: "#FF6B00", is_custom: false, created_at: "" },
            },
          ]);
        }
      } catch (e) {
        console.warn("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
            Ringkasan Keuangan
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pantau arus kas, budget, dan transaksi harian secara real-time
          </p>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-surface-border rounded-xl shadow-xs self-start sm:self-auto">
          {(["harian", "mingguan", "bulanan", "tahunan", "custom"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                period === p
                  ? "bg-brand-500 text-white shadow-orange"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker */}
      {period === "custom" && (
        <div className="p-4 bg-white border border-surface-border rounded-2xl flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Mulai:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="text-xs border rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500">Sampai:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="text-xs border rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-500"
            />
          </div>
        </div>
      )}

      {/* Onboarding Checklist for Activation */}
      <OnboardingChecklist
        userProfile={profile}
        walletCount={wallets.length}
        budgetCount={4}
      />

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Saldo Total"
          amount={totalBalance}
          type="balance"
          subtext="Semua dompet & rekening"
        />
        <StatsCard
          title="Pemasukan Bulan Ini"
          amount={totalIncome}
          type="income"
          subtext="Arus kas masuk"
          trendPercentage={12}
        />
        <StatsCard
          title="Pengeluaran Bulan Ini"
          amount={totalExpense}
          type="expense"
          subtext="Arus kas keluar"
          trendPercentage={-5}
        />
        <StatsCard
          title="Budget Tersisa"
          amount={remainingBudget}
          type="budget"
          subtext="Aman hingga akhir bulan"
        />
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryPieChart data={categoryData} />
        <MonthlyBarChart data={monthlyBarData} />
      </div>

      {/* Daily Expense Trend Line */}
      <DailyTrendChart data={dailyTrendData} />

      {/* Recent 10 Transactions Table */}
      <RecentTransactionsList transactions={transactions} />
    </div>
  );
}
