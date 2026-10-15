import { getAdminClient } from "@/lib/supabase/admin";

export interface UserFinancialContext {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  monthlyBudget: number;
  remainingBudget: number;
  savingsRate: number; // Percentage, e.g. 66.5
  todayExpense: number;
  dailyBudgetLimit: number;
  todayTransactions: Array<{
    type: "income" | "expense" | "transfer";
    amount: number;
    description: string;
    category?: string;
    time?: string;
  }>;
  topCategories: Array<{
    name: string;
    amount: number;
    percentage: number;
    icon?: string;
    color?: string;
  }>;
  recentTransactions: Array<{
    type: "income" | "expense" | "transfer";
    amount: number;
    description: string;
    category?: string;
    date: string;
  }>;
  wallets: Array<{
    name: string;
    type: string;
    balance: number;
  }>;
}

const DEFAULT_MOCK_CONTEXT: UserFinancialContext = {
  totalBalance: 9650000,
  totalIncome: 14500000,
  totalExpense: 4850000,
  netSavings: 9650000,
  monthlyBudget: 15000000,
  remainingBudget: 10150000,
  savingsRate: 66.5,
  todayExpense: 45000,
  dailyBudgetLimit: 150000,
  todayTransactions: [
    {
      type: "expense",
      amount: 45000,
      description: "Makan Siang Nasi Padang Rendang",
      category: "🍜 Makanan & Minuman",
      time: "12:30 WIB",
    },
  ],
  topCategories: [
    { name: "Makanan & Minuman", amount: 1850000, percentage: 38.1, icon: "🍜", color: "#FF6B00" },
    { name: "Tagihan & Utilitas", amount: 950000, percentage: 19.6, icon: "🏠", color: "#EF4444" },
    { name: "Belanja Kebutuhan", amount: 800000, percentage: 16.5, icon: "👕", color: "#EC4899" },
    { name: "Transportasi", amount: 650000, percentage: 13.4, icon: "🚗", color: "#3B82F6" },
    { name: "Hiburan & Hobi", amount: 600000, percentage: 12.4, icon: "🎮", color: "#8B5CF6" },
  ],
  recentTransactions: [
    {
      type: "expense",
      amount: 45000,
      description: "Makan Siang Nasi Padang Rendang",
      category: "🍜 Makanan & Minuman",
      date: "Hari ini, 12:30 WIB",
    },
    {
      type: "expense",
      amount: 285000,
      description: "Belanja Supermarket Hypermart",
      category: "👕 Belanja Kebutuhan",
      date: "Kemarin, 19:15 WIB",
    },
    {
      type: "income",
      amount: 14500000,
      description: "Gaji Pokok Oktober 2026",
      category: "💰 Gaji Pokok",
      date: "25 Okt 2026",
    },
    {
      type: "expense",
      amount: 50000,
      description: "Bensin Motor Pertamax",
      category: "🚗 Transportasi",
      date: "24 Okt 2026",
    },
    {
      type: "expense",
      amount: 350000,
      description: "Tagihan WiFi Indihome",
      category: "🏠 Tagihan & Utilitas",
      date: "20 Okt 2026",
    },
  ],
  wallets: [
    { name: "Rekening BCA", type: "bank", balance: 8400000 },
    { name: "Dompet Utama (Cash)", type: "cash", balance: 1250000 },
  ],
};

export async function getUserFinancialContext(userId?: string): Promise<UserFinancialContext> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (supabaseUrl.includes("your-supabase-project") || !supabaseUrl) {
    return DEFAULT_MOCK_CONTEXT;
  }

  try {
    const supabase = getAdminClient();

    // 1. Wallets
    let wQuery = supabase.from("wallets").select("*");
    if (userId) wQuery = wQuery.eq("user_id", userId);
    const { data: wData } = await wQuery;

    let wallets = DEFAULT_MOCK_CONTEXT.wallets;
    let totalBalance = DEFAULT_MOCK_CONTEXT.totalBalance;

    if (wData && wData.length > 0) {
      wallets = wData.map((w) => ({
        name: w.name,
        type: w.type,
        balance: Number(w.balance || 0),
      }));
      totalBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);
    }

    // 2. Transactions
    let tQuery = supabase
      .from("transactions")
      .select("*, category:category_id(*), wallet:wallet_id(*)")
      .order("transaction_date", { ascending: false });
    if (userId) tQuery = tQuery.eq("user_id", userId);
    const { data: tData } = await tQuery;

    if (!tData || tData.length === 0) {
      return {
        ...DEFAULT_MOCK_CONTEXT,
        totalBalance,
        wallets,
      };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let todayExpense = 0;
    const todayTransactions: UserFinancialContext["todayTransactions"] = [];
    const catMap: Record<string, { amount: number; color: string; icon: string }> = {};

    const todayStr = new Date().toISOString().slice(0, 10);

    tData.forEach((tx) => {
      const amt = Number(tx.amount || 0);
      const txDateStr = tx.transaction_date ? new Date(tx.transaction_date).toISOString().slice(0, 10) : "";

      if (tx.type === "income") {
        totalIncome += amt;
      } else if (tx.type === "expense") {
        totalExpense += amt;

        if (txDateStr === todayStr) {
          todayExpense += amt;
          todayTransactions.push({
            type: "expense",
            amount: amt,
            description: tx.description || "Pengeluaran",
            category: tx.category?.name || "Lainnya",
            time: new Date(tx.transaction_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
          });
        }

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

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 1000) / 10 : 0;
    const monthlyBudget = 15000000;
    const remainingBudget = Math.max(0, monthlyBudget - totalExpense);
    const dailyBudgetLimit = Math.round(monthlyBudget / 30); // ~Rp 500.000 or custom

    // Top categories
    const topCategories = Object.entries(catMap)
      .map(([name, item]) => ({
        name,
        amount: item.amount,
        percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 1000) / 10 : 0,
        color: item.color,
        icon: item.icon,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Recent transactions
    const recentTransactions = tData.slice(0, 5).map((tx) => ({
      type: tx.type,
      amount: Number(tx.amount),
      description: tx.description || (tx.type === "income" ? "Pemasukan" : "Pengeluaran"),
      category: tx.category?.name || "Lainnya",
      date: new Date(tx.transaction_date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }));

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      netSavings,
      monthlyBudget,
      remainingBudget,
      savingsRate,
      todayExpense: todayExpense > 0 ? todayExpense : DEFAULT_MOCK_CONTEXT.todayExpense,
      dailyBudgetLimit: 150000,
      todayTransactions: todayTransactions.length > 0 ? todayTransactions : DEFAULT_MOCK_CONTEXT.todayTransactions,
      topCategories: topCategories.length > 0 ? topCategories : DEFAULT_MOCK_CONTEXT.topCategories,
      recentTransactions: recentTransactions.length > 0 ? recentTransactions : DEFAULT_MOCK_CONTEXT.recentTransactions,
      wallets,
    };
  } catch (err) {
    console.warn("Failed to load user financial context:", err);
    return DEFAULT_MOCK_CONTEXT;
  }
}
