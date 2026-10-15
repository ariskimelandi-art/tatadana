import React from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Send, Wallet, PieChart } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Profile } from "@/lib/types";

export interface OnboardingChecklistProps {
  userProfile?: Profile | null;
  walletCount?: number;
  budgetCount?: number;
}

export function OnboardingChecklist({
  userProfile,
  walletCount = 0,
  budgetCount = 0,
}: OnboardingChecklistProps) {
  const isTelegramDone = Boolean(userProfile?.telegram_chat_id);
  const isWalletDone = walletCount > 0;
  const isBudgetDone = budgetCount > 0;

  const totalDone = (isTelegramDone ? 1 : 0) + (isWalletDone ? 1 : 0) + (isBudgetDone ? 1 : 0);

  if (totalDone === 3) return null; // Hide once all 3 steps completed

  return (
    <Card className="bg-gradient-to-r from-orange-50/70 via-white to-amber-50/50 border-brand-200/80 mb-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700 mb-1.5">
            🚀 Mulai Cepat TataDana
          </span>
          <h3 className="text-base font-bold text-zinc-900">
            Selesaikan 3 Langkah Awal Ini ({totalDone}/3 Selesai)
          </h3>
          <p className="text-xs text-zinc-500">
            Hubungkan bot Telegram dan atur keuangan Anda dalam kurang dari 2 menit.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Step 1: Telegram */}
        <Link
          href="/settings?tab=telegram"
          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
            isTelegramDone
              ? "bg-white/80 border-emerald-200 text-zinc-700"
              : "bg-white border-brand-200 hover:border-brand-400 hover:shadow-xs text-zinc-900"
          }`}
        >
          {isTelegramDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold flex items-center justify-between">
              <span>Hubungkan Telegram</span>
              <Send className="w-3.5 h-3.5 text-brand-500" />
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {isTelegramDone ? "Sudah terhubung aktif" : "Koneksikan bot untuk catat via chat"}
            </p>
          </div>
        </Link>

        {/* Step 2: Set Wallet */}
        <Link
          href="/wallet"
          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
            isWalletDone
              ? "bg-white/80 border-emerald-200 text-zinc-700"
              : "bg-white border-brand-200 hover:border-brand-400 hover:shadow-xs text-zinc-900"
          }`}
        >
          {isWalletDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold flex items-center justify-between">
              <span>Atur Dompet Utama</span>
              <Wallet className="w-3.5 h-3.5 text-brand-500" />
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {isWalletDone ? `${walletCount} dompet siap digunakan` : "Tambah rekening atau e-wallet"}
            </p>
          </div>
        </Link>

        {/* Step 3: Set Budget */}
        <Link
          href="/budget"
          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
            isBudgetDone
              ? "bg-white/80 border-emerald-200 text-zinc-700"
              : "bg-white border-brand-200 hover:border-brand-400 hover:shadow-xs text-zinc-900"
          }`}
        >
          {isBudgetDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold flex items-center justify-between">
              <span>Tentukan Budget</span>
              <PieChart className="w-3.5 h-3.5 text-brand-500" />
            </h4>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {isBudgetDone ? `${budgetCount} budget aktif dipantau` : "Batas pengeluaran per kategori"}
            </p>
          </div>
        </Link>
      </div>
    </Card>
  );
}
