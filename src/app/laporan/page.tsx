"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayoutWrapper } from "@/components/dashboard/DashboardLayoutWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/utils/currency";
import { formatDateTimeWIB } from "@/lib/utils/date-wib";
import { Transaction, Wallet, Category, ExportHistoryRecord } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowUpDown,
  Filter,
  History,
  Camera,
  Mic,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [exportHistory, setExportHistory] = useState<ExportHistoryRecord[]>([]);
  const [userId, setUserId] = useState<string>("demo-user-123");
  const [userPlan, setUserPlan] = useState<"starter" | "pro">("pro");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Sorting
  const [sortField, setSortField] = useState<"date" | "amount" | "category" | "wallet">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Expanded receipts
  const [expandedReceipts, setExpandedReceipts] = useState<Record<string, boolean>>({});

  // Loading & export statuses
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
        if (profile) setUserPlan(profile.plan);
      }

      // Load Wallets
      const { data: wData } = await supabase.from("wallets").select("*");
      if (wData) setWallets(wData);

      // Load Categories
      const { data: cData } = await supabase.from("categories").select("*");
      if (cData) setCategories(cData);

      // Load Transactions
      let query = supabase
        .from("transactions")
        .select("*, category:category_id(*), wallet:wallet_id(*)")
        .order("transaction_date", { ascending: false });

      const { data: tData } = await query;
      if (tData && tData.length > 0) {
        setTransactions(tData);
      } else {
        // High quality mock transactions for report testing
        setTransactions([
          {
            id: "tx-receipt-1",
            user_id: "demo",
            wallet_id: "w-2",
            type: "expense",
            amount: 285000,
            description: "Struk Hypermart Mall Grand Indonesia",
            transaction_date: new Date(Date.now() - 3600000 * 2).toISOString(),
            source: "telegram_receipt",
            is_receipt_parent: true,
            receipt_items: [
              { name: "Susu Segar UHT 1L", qty: 2, price: 21000, total: 42000 },
              { name: "Daging Sapi Slice 500g", qty: 1, price: 95000, total: 95000 },
              { name: "Buah Apel Fuji (kg)", qty: 1.5, price: 40000, total: 60000 },
              { name: "Tisu Wajah 250s", qty: 3, price: 16000, total: 48000 },
              { name: "Sabun Mandi Refill 450ml", qty: 1, price: 40000, total: 40000 },
            ],
            created_at: "",
            wallet: { id: "w-2", user_id: "demo", name: "Rekening BCA", type: "bank", balance: 8400000, is_default: false, color: "#2563EB", icon: "landmark", created_at: "", updated_at: "" },
            category: { id: "c-4", name: "Belanja Bulanan", type: "expense", icon: "👕", color: "#EC4899", is_custom: false, created_at: "" },
          },
          {
            id: "tx-2",
            user_id: "demo",
            wallet_id: "w-1",
            type: "expense",
            amount: 55000,
            description: "Kopi Kenangan & Roti Cokelat",
            transaction_date: new Date(Date.now() - 3600000 * 8).toISOString(),
            source: "telegram_voice",
            is_receipt_parent: false,
            created_at: "",
            wallet: { id: "w-1", user_id: "demo", name: "Dompet Utama (Cash)", type: "cash", balance: 1250000, is_default: true, color: "#FF6B00", icon: "wallet", created_at: "", updated_at: "" },
            category: { id: "c-1", name: "Makanan & Minuman", type: "expense", icon: "🍜", color: "#FF6B00", is_custom: false, created_at: "" },
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
          {
            id: "tx-4",
            user_id: "demo",
            wallet_id: "w-1",
            type: "expense",
            amount: 350000,
            description: "Tagihan Listrik PLN Pasca",
            transaction_date: new Date(Date.now() - 3600000 * 48).toISOString(),
            source: "web",
            is_receipt_parent: false,
            created_at: "",
            wallet: { id: "w-1", user_id: "demo", name: "Dompet Utama (Cash)", type: "cash", balance: 1250000, is_default: true, color: "#FF6B00", icon: "wallet", created_at: "", updated_at: "" },
            category: { id: "c-3", name: "Tagihan & Utilitas", type: "expense", icon: "🏠", color: "#EF4444", is_custom: false, created_at: "" },
          },
          {
            id: "tx-5",
            user_id: "demo",
            wallet_id: "w-2",
            type: "expense",
            amount: 150000,
            description: "Bensin Pertamax Mobil",
            transaction_date: new Date(Date.now() - 3600000 * 72).toISOString(),
            source: "telegram_text",
            is_receipt_parent: false,
            created_at: "",
            wallet: { id: "w-2", user_id: "demo", name: "Rekening BCA", type: "bank", balance: 8400000, is_default: false, color: "#2563EB", icon: "landmark", created_at: "", updated_at: "" },
            category: { id: "c-2", name: "Transportasi", type: "expense", icon: "🚗", color: "#3B82F6", is_custom: false, created_at: "" },
          },
        ]);
      }

      // Load Export History
      const { data: hData } = await supabase.from("export_history").select("*").order("created_at", { ascending: false });
      if (hData) setExportHistory(hData);
    }

    loadData();
  }, []);

  // Filter & Search Logic
  const filteredTransactions = transactions.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = (t.description || "").toLowerCase().includes(q);
      const matchCat = (t.category?.name || "").toLowerCase().includes(q);
      const matchWallet = (t.wallet?.name || "").toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchWallet) return false;
    }
    if (selectedWallet !== "all" && t.wallet_id !== selectedWallet) return false;
    if (selectedCategory !== "all" && t.category_id !== selectedCategory) return false;
    if (selectedType !== "all" && t.type !== selectedType) return false;
    if (startDate && new Date(t.transaction_date) < new Date(startDate)) return false;
    if (endDate && new Date(t.transaction_date) > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  // Sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let cmp = 0;
    if (sortField === "date") {
      cmp = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
    } else if (sortField === "amount") {
      cmp = Number(a.amount) - Number(b.amount);
    } else if (sortField === "category") {
      cmp = (a.category?.name || "").localeCompare(b.category?.name || "");
    } else if (sortField === "wallet") {
      cmp = (a.wallet?.name || "").localeCompare(b.wallet?.name || "");
    }
    return sortOrder === "asc" ? cmp : -cmp;
  });

  // Pagination
  const totalPages = Math.ceil(sortedTransactions.length / pageSize) || 1;
  const paginatedTransactions = sortedTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Summary Metrics
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryTotals: Record<string, number> = {};

  filteredTransactions.forEach((t) => {
    const amt = Number(t.amount);
    if (t.type === "income") totalIncome += amt;
    else if (t.type === "expense") {
      totalExpense += amt;
      const cName = t.category?.name || "Lainnya";
      categoryTotals[cName] = (categoryTotals[cName] || 0) + amt;
    }
  });

  const netCashflow = totalIncome - totalExpense;

  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }));

  const toggleSort = (field: "date" | "amount" | "category" | "wallet") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const toggleReceipt = (id: string) => {
    setExpandedReceipts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Export PDF Handler
  const handleExportPDF = async () => {
    if (userPlan === "starter") {
      alert("Fitur Export PDF lengkap hanya tersedia untuk pengguna Pro. Silakan upgrade ke Pro.");
      return;
    }

    setExportingPDF(true);
    try {
      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          startDate,
          endDate,
          categoryId: selectedCategory,
          walletId: selectedWallet,
          type: selectedType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal membuat PDF");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TataDana_Laporan_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      alert(e.message || "Export gagal");
    } finally {
      setExportingPDF(false);
    }
  };

  // Export Excel Handler
  const handleExportExcel = async () => {
    if (userPlan === "starter") {
      alert("Fitur Export Excel (.xlsx) hanya tersedia untuk pengguna Pro.");
      return;
    }

    setExportingExcel(true);
    try {
      const res = await fetch("/api/export/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          startDate,
          endDate,
          categoryId: selectedCategory,
          walletId: selectedWallet,
          type: selectedType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Gagal membuat file Excel");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `TataDana_Laporan_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      alert(e.message || "Export gagal");
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 pb-12">
        {/* Page Header & Export Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight flex items-center gap-2">
              <span>Laporan Keuangan</span>
              {userPlan === "pro" && (
                <Badge variant="orange" size="sm">
                  <Sparkles className="w-3 h-3 fill-brand-500 text-brand-500" /> Pro Unlimited Export
                </Badge>
              )}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tabel transaksi lengkap dengan rincian foto struk, pencarian instan, dan export on-demand.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={handleExportPDF}
              isLoading={exportingPDF}
              variant="outline"
              size="sm"
              className="text-xs font-bold border-brand-300 text-brand-700 hover:bg-brand-50"
            >
              <FileText className="w-4 h-4 text-brand-500" />
              <span>Export PDF</span>
            </Button>

            <Button
              onClick={handleExportExcel}
              isLoading={exportingExcel}
              variant="outline"
              size="sm"
              className="text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </Button>
          </div>
        </div>

        {/* Ringkasan Laporan Cards (Part 3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-l-4 border-l-emerald-500">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Pemasukan
            </span>
            <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">
              +{formatRupiah(totalIncome)}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1">Arus dana masuk periode ini</p>
          </Card>

          <Card className="p-5 border-l-4 border-l-red-500">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Total Pengeluaran
            </span>
            <h3 className="text-2xl font-extrabold text-red-600 mt-1">
              -{formatRupiah(totalExpense)}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1">Arus dana keluar periode ini</p>
          </Card>

          <Card className={`p-5 border-l-4 ${netCashflow >= 0 ? "border-l-brand-500" : "border-l-red-500"}`}>
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Net Cashflow
            </span>
            <h3 className={`text-2xl font-extrabold mt-1 ${netCashflow >= 0 ? "text-brand-600" : "text-red-600"}`}>
              {netCashflow >= 0 ? "+" : ""}{formatRupiah(netCashflow)}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1">Surplus / defisit kas bersih</p>
          </Card>
        </div>

        {/* Top 5 Categories Pill Bar */}
        {topCategories.length > 0 && (
          <Card className="p-4 bg-zinc-50/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                Top 5 Kategori Pengeluaran:
              </span>
              <span className="text-xs text-zinc-400">Total {formatRupiah(totalExpense)}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {topCategories.map((c, i) => (
                <div
                  key={c.name}
                  className="px-3 py-1.5 bg-white rounded-xl border border-zinc-200 text-xs font-medium flex items-center gap-2 shadow-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-[10px]">
                    {i + 1}
                  </span>
                  <span className="text-zinc-800">{c.name}</span>
                  <span className="font-bold text-zinc-900">{formatRupiah(c.amount)}</span>
                  <span className="text-brand-600 font-semibold text-[11px]">({Math.round(c.percentage)}%)</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Filter & Search Bar */}
        <Card className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Catatan */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Cari deskripsi, catatan, atau toko..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Wallet Filter */}
            <div>
              <select
                value={selectedWallet}
                onChange={(e) => {
                  setSelectedWallet(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-xs font-medium text-zinc-700 outline-none focus:border-brand-500"
              >
                <option value="all">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-xs font-medium text-zinc-700 outline-none focus:border-brand-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-surface-border bg-white px-3 py-2.5 text-xs font-medium text-zinc-700 outline-none focus:border-brand-500"
              >
                <option value="all">Semua Jenis</option>
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
          </div>

          {/* Date range filter */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-100 text-xs">
            <span className="font-semibold text-zinc-500">Rentang Tanggal:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-zinc-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-brand-500"
            />
            <span className="text-zinc-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-zinc-200 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-brand-500"
            />
            {(startDate || endDate || searchQuery || selectedWallet !== "all" || selectedCategory !== "all" || selectedType !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedWallet("all");
                  setSelectedCategory("all");
                  setSelectedType("all");
                  setStartDate("");
                  setEndDate("");
                  setCurrentPage(1);
                }}
                className="text-brand-600 hover:underline text-xs font-bold ml-auto"
              >
                Reset Filter
              </button>
            )}
          </div>
        </Card>

        {/* Detailed Transactions Table (Part 3) */}
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/90 border-b border-surface-border text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-zinc-900"
                    onClick={() => toggleSort("date")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Tanggal (WIB)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Deskripsi / Rincian</th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-zinc-900"
                    onClick={() => toggleSort("category")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kategori</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:text-zinc-900"
                    onClick={() => toggleSort("wallet")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Dompet</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:text-zinc-900"
                    onClick={() => toggleSort("amount")}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Nominal</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-400">
                      Tidak ada transaksi yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => {
                    const isIncome = tx.type === "income";
                    const isTransfer = tx.type === "transfer";
                    const isReceipt = tx.is_receipt_parent && tx.receipt_items && tx.receipt_items.length > 0;
                    const isExpanded = Boolean(expandedReceipts[tx.id]);

                    return (
                      <React.Fragment key={tx.id}>
                        <tr
                          className={`hover:bg-zinc-50/80 transition-colors ${
                            isExpanded ? "bg-orange-50/30" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-medium text-zinc-600 whitespace-nowrap">
                            {formatDateTimeWIB(tx.transaction_date)}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-zinc-900">
                                {tx.description || tx.category?.name || "Transaksi"}
                              </span>
                              {tx.source === "telegram_receipt" && (
                                <Badge variant="orange" size="sm">
                                  <Camera className="w-3 h-3" /> Struk
                                </Badge>
                              )}
                              {tx.source === "telegram_voice" && (
                                <Badge variant="purple" size="sm">
                                  <Mic className="w-3 h-3" /> Voice
                                </Badge>
                              )}
                              {isReceipt && (
                                <button
                                  onClick={() => toggleReceipt(tx.id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-md transition-colors"
                                >
                                  {tx.receipt_items?.length} item
                                  {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={isIncome ? "green" : isTransfer ? "blue" : "zinc"} size="sm">
                              {tx.category ? `${tx.category.icon} ${tx.category.name}` : isTransfer ? "🔄 Transfer" : "🏷️ Lainnya"}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-zinc-700 whitespace-nowrap">
                            👛 {tx.wallet?.name || "Dompet"}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span
                              className={`font-bold ${
                                isIncome ? "text-emerald-600" : isTransfer ? "text-blue-600" : "text-zinc-900"
                              }`}
                            >
                              {isIncome ? "+" : isTransfer ? "⇄ " : "-"}
                              {formatRupiah(tx.amount)}
                            </span>
                          </td>
                        </tr>

                        {/* Expandable Receipt Items Sub-Table (Part 3) */}
                        {isReceipt && isExpanded && (
                          <tr className="bg-orange-50/40">
                            <td colSpan={5} className="py-3 px-8">
                              <div className="bg-white rounded-xl border border-brand-200 p-4 shadow-xs">
                                <h4 className="text-xs font-bold text-zinc-900 mb-2 flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5 text-brand-500" />
                                  Rincian Item dari Struk:
                                </h4>
                                <div className="divide-y divide-zinc-100">
                                  {tx.receipt_items!.map((it, idx) => (
                                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        <span className="text-zinc-400 font-medium">{idx + 1}.</span>
                                        <span className="font-semibold text-zinc-800">{it.name}</span>
                                        <span className="text-zinc-400 text-[11px]">
                                          ({it.qty}x @ {formatRupiah(it.price)})
                                        </span>
                                      </div>
                                      <span className="font-bold text-zinc-900">{formatRupiah(it.total)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-surface-border flex items-center justify-between text-xs text-zinc-500">
            <span>
              Menampilkan {paginatedTransactions.length} dari {sortedTransactions.length} transaksi
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </Button>
              <span className="px-3 py-1 font-semibold text-zinc-800">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayoutWrapper>
  );
}
