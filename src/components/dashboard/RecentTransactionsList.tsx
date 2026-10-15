import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatRupiah } from "@/lib/utils/currency";
import { formatDateTimeWIB } from "@/lib/utils/date-wib";
import { Transaction } from "@/lib/types";
import { ArrowUpRight, ArrowDownRight, RefreshCw, ChevronRight, Mic, Camera, MessageSquare } from "lucide-react";

export function RecentTransactionsList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <Card className="p-6">
        <CardHeader className="p-0 pb-4 mb-4 flex-row items-center justify-between">
          <CardTitle>10 Transaksi Terbaru</CardTitle>
        </CardHeader>
        <div className="py-8 text-center text-zinc-400 text-xs">
          Belum ada riwayat transaksi. Mulai catat lewat Telegram atau tombol di atas!
        </div>
      </Card>
    );
  }

  const renderSourceIcon = (source: string) => {
    switch (source) {
      case "telegram_receipt":
        return (
          <span title="Foto Struk Telegram">
            <Camera className="w-3 h-3 text-brand-600" />
          </span>
        );
      case "telegram_voice":
        return (
          <span title="Voice Note Telegram">
            <Mic className="w-3 h-3 text-purple-600" />
          </span>
        );
      case "telegram_text":
        return (
          <span title="Chat Telegram">
            <MessageSquare className="w-3 h-3 text-blue-600" />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4 mb-4 flex-row items-center justify-between">
        <div>
          <CardTitle>10 Transaksi Terbaru</CardTitle>
          <p className="text-xs text-zinc-400 mt-0.5">Catatan terkini dari web dan bot Telegram</p>
        </div>
        <Link
          href="/transaksi"
          className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
        >
          Lihat Semua <ChevronRight className="w-4 h-4" />
        </Link>
      </CardHeader>

      <div className="divide-y divide-zinc-100">
        {transactions.slice(0, 10).map((t) => {
          const isIncome = t.type === "income";
          const isTransfer = t.type === "transfer";

          return (
            <div key={t.id} className="py-3 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 border ${
                    isIncome
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : isTransfer
                      ? "bg-blue-50 border-blue-200 text-blue-600"
                      : "bg-orange-50 border-orange-200 text-brand-600"
                  }`}
                >
                  {isIncome ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : isTransfer ? (
                    <RefreshCw className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {t.description || t.category?.name || "Transaksi"}
                    </p>
                    {renderSourceIcon(t.source)}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                    <span>{formatDateTimeWIB(t.transaction_date)}</span>
                    <span>•</span>
                    <span className="font-medium text-zinc-600">{t.wallet?.name || "Dompet"}</span>
                    {t.category && (
                      <>
                        <span>•</span>
                        <span>{t.category.icon} {t.category.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-bold ${
                    isIncome ? "text-emerald-600" : isTransfer ? "text-blue-600" : "text-zinc-900"
                  }`}
                >
                  {isIncome ? "+" : isTransfer ? "⇄ " : "-"}
                  {formatRupiah(t.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
