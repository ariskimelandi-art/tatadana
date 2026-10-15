"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatRupiah } from "@/lib/utils/currency";

export interface DailyTrendPoint {
  day: number;
  amount: number;
}

export function DailyTrendChart({ data }: { data: DailyTrendPoint[] }) {
  const [hoveredPoint, setHoveredPoint] = useState<DailyTrendPoint | null>(null);

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <CardHeader className="p-0 pb-4 mb-2">
          <CardTitle>Tren Pengeluaran Harian</CardTitle>
        </CardHeader>
        <p className="text-xs text-zinc-400">Belum ada pengeluaran harian bulan ini.</p>
      </Card>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.amount), 50000);
  const width = 600;
  const height = 150;
  const padding = 20;

  // Generate SVG path points
  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (d.amount / maxVal) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1]?.x} ${height - padding} L ${points[0]?.x} ${height - padding} Z`;

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-2 mb-2 flex-row items-center justify-between">
        <div>
          <CardTitle>Tren Pengeluaran Harian</CardTitle>
          <p className="text-xs text-zinc-400 mt-0.5">Aktivitas pengeluaran tanggal demi tanggal</p>
        </div>
        {hoveredPoint && (
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Tgl {hoveredPoint.day}: {formatRupiah(hoveredPoint.amount)}
          </span>
        )}
      </CardHeader>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
          <defs>
            <linearGradient id="brandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area Fill */}
          <path d={areaD} fill="url(#brandGradient)" />

          {/* Line Stroke */}
          <path d={pathD} fill="none" stroke="#FF6B00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Points */}
          {points.map((p) => (
            <circle
              key={p.day}
              cx={p.x}
              cy={p.y}
              r={hoveredPoint?.day === p.day ? 5 : 3}
              fill="#FFFFFF"
              stroke="#FF6B00"
              strokeWidth="2"
              className="cursor-pointer transition-all hover:scale-150"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            />
          ))}
        </svg>
      </div>

      <div className="flex justify-between text-[11px] text-zinc-400 px-2 mt-1">
        <span>Tgl 1</span>
        <span>Tgl 15</span>
        <span>Akhir Bulan</span>
      </div>
    </Card>
  );
}
