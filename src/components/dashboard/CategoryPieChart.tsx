"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/utils/currency";

export interface CategoryExpense {
  name: string;
  amount: number;
  color: string;
  icon: string;
}

export function CategoryPieChart({ data }: { data: CategoryExpense[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, curr) => acc + curr.amount, 0);

  if (total === 0 || data.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-2">
            📊
          </div>
          <p className="text-xs text-zinc-500 font-medium">Belum ada data pengeluaran di periode ini</p>
        </div>
      </Card>
    );
  }

  // Calculate SVG Pie Segments
  let cumulativePercent = 0;
  const segments = data.map((item, index) => {
    const percent = item.amount / total;
    const startAngle = cumulativePercent * 2 * Math.PI;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 2 * Math.PI;

    // Outer & inner radius for donut chart
    const radius = 80;
    const innerRadius = 50;
    const cx = 100;
    const cy = 100;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const x3 = cx + innerRadius * Math.cos(endAngle);
    const y3 = cy + innerRadius * Math.sin(endAngle);
    const x4 = cx + innerRadius * Math.cos(startAngle);
    const y4 = cy + innerRadius * Math.sin(startAngle);

    const largeArcFlag = percent > 0.5 ? 1 : 0;

    const pathData = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
      Z
    `;

    return {
      ...item,
      pathData,
      percent: Math.round(percent * 100),
      index,
    };
  });

  const activeItem = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <Card className="h-full flex flex-col p-6">
      <CardHeader className="p-0 pb-4 mb-4">
        <div>
          <CardTitle>Pengeluaran per Kategori</CardTitle>
          <p className="text-xs text-zinc-400 mt-0.5">Proporsi pos pengeluaran bulanan</p>
        </div>
      </CardHeader>

      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* SVG Donut */}
        <div className="relative w-48 h-48 shrink-0">
          <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
            {segments.map((s, i) => (
              <path
                key={s.name}
                d={s.pathData}
                fill={s.color || "#FF6B00"}
                className={`transition-all duration-200 cursor-pointer ${
                  hoveredIndex === i ? "opacity-100 scale-105 origin-center" : "opacity-90 hover:opacity-100"
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              {activeItem ? activeItem.name : "Total Keluar"}
            </span>
            <span className="text-sm font-extrabold text-zinc-900">
              {formatRupiah(activeItem ? activeItem.amount : total)}
            </span>
            {activeItem && (
              <span className="text-[10px] font-semibold text-brand-600">
                {Math.round((activeItem.amount / total) * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2 max-h-48 overflow-y-auto pr-1">
          {data.map((cat, idx) => {
            const pct = Math.round((cat.amount / total) * 100);
            return (
              <div
                key={cat.name}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  hoveredIndex === idx ? "bg-orange-50/80 font-semibold" : "hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color || "#FF6B00" }}
                  />
                  <span className="truncate text-zinc-700">
                    {cat.icon} {cat.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-zinc-900">{formatRupiah(cat.amount)}</span>
                  <span className="text-zinc-400 ml-1.5 text-[11px]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
