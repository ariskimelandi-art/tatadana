import React from "react";
import { Card } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/utils/currency";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface StatsCardProps {
  title: string;
  amount: number;
  type: "balance" | "income" | "expense" | "budget";
  subtext?: string;
  trendPercentage?: number;
}

export function StatsCard({ title, amount, type, subtext, trendPercentage }: StatsCardProps) {
  const icons = {
    balance: <Wallet className="w-5 h-5 text-brand-600" />,
    income: <ArrowUpRight className="w-5 h-5 text-emerald-600" />,
    expense: <ArrowDownRight className="w-5 h-5 text-red-600" />,
    budget: <Sparkles className="w-5 h-5 text-amber-600" />,
  };

  const bgIcons = {
    balance: "bg-brand-50 border-brand-200",
    income: "bg-emerald-50 border-emerald-200",
    expense: "bg-red-50 border-red-200",
    budget: "bg-amber-50 border-amber-200",
  };

  return (
    <Card hoverEffect className="relative overflow-hidden p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn("w-9 h-9 rounded-xl border flex items-center justify-center shadow-xs", bgIcons[type])}>
          {icons[type]}
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">
          {formatRupiah(amount)}
        </h2>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-zinc-400">
        <span>{subtext || "Bulan Berjalan"}</span>
        {trendPercentage !== undefined && (
          <span
            className={cn(
              "font-semibold flex items-center gap-0.5",
              trendPercentage >= 0 ? "text-emerald-600" : "text-red-500"
            )}
          >
            {trendPercentage >= 0 ? "+" : ""}
            {trendPercentage}% vs bln lalu
          </span>
        )}
      </div>
    </Card>
  );
}
