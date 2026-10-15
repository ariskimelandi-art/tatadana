"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/utils/currency";

export interface MonthlyBarData {
  monthLabel: string; // e.g. "Mei", "Jun", "Jul", "Agu", "Sep", "Okt"
  income: number;
  expense: number;
}

export function MonthlyBarChart({ data }: { data: MonthlyBarData[] }) {
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyBarData | null>(null);

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    1000000 // Minimum scale
  );

  return (
    <Card className="h-full flex flex-col p-6">
      <CardHeader className="p-0 pb-4 mb-4 flex-row items-center justify-between">
        <div>
          <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
          <p className="text-xs text-zinc-400 mt-0.5">Tren arus kas 6 bulan terakhir</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-zinc-600 font-medium">Masuk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-500" />
            <span className="text-zinc-600 font-medium">Keluar</span>
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 flex flex-col justify-end pt-4">
        {/* Hover detail tooltip bar */}
        <div className="h-6 mb-2 text-center text-xs">
          {hoveredMonth ? (
            <span className="font-semibold text-zinc-800 bg-zinc-100 px-3 py-1 rounded-full">
              {hoveredMonth.monthLabel}: Masuk {formatRupiah(hoveredMonth.income)} | Keluar {formatRupiah(hoveredMonth.expense)}
            </span>
          ) : (
            <span className="text-zinc-400">Arahkan kursor pada batang grafik untuk rincian</span>
          )}
        </div>

        {/* Bars Container */}
        <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 border-b border-zinc-200 pb-2">
          {data.map((item) => {
            const incomeHeight = Math.max(4, Math.round((item.income / maxVal) * 100));
            const expenseHeight = Math.max(4, Math.round((item.expense / maxVal) * 100));

            return (
              <div
                key={item.monthLabel}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredMonth(item)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                <div className="w-full flex items-end justify-center gap-1 h-36">
                  {/* Income Bar */}
                  <div
                    style={{ height: `${incomeHeight}%` }}
                    className="w-1/2 max-w-[18px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all duration-300"
                  />
                  {/* Expense Bar */}
                  <div
                    style={{ height: `${expenseHeight}%` }}
                    className="w-1/2 max-w-[18px] bg-brand-500 hover:bg-brand-600 rounded-t-md transition-all duration-300"
                  />
                </div>
                <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-900 transition-colors">
                  {item.monthLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
