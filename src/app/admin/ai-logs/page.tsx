"use client";

import React, { useState, useEffect } from "react";
import { Activity, Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import { AILogEntry } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatDateTimeWIB } from "@/lib/utils/date-wib";

export default function AdminAILogsPage() {
  const [logs, setLogs] = useState<AILogEntry[]>([]);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    const supabase = createClient();
    const { data } = await supabase
      .from("ai_logs")
      .select("*, profile:user_id(full_name, phone_number)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      setLogs(data);
    } else {
      // Mock logs fallback
      setLogs([
        {
          id: "log-1",
          user_id: "u-1",
          provider: "gemini",
          feature: "nlp_text",
          input_snippet: "beli bakso bakar 15rb",
          output_snippet: '{"jenis":"pengeluaran","nominal":15000,"kategori":"Makanan"}',
          prompt_tokens: 65,
          completion_tokens: 28,
          latency_ms: 412,
          status: "success",
          created_at: new Date(Date.now() - 60000 * 5).toISOString(),
        },
        {
          id: "log-2",
          user_id: "u-1",
          provider: "gemini",
          feature: "receipt_ocr",
          input_snippet: "[Image Binary 2.4MB]",
          output_snippet: "Merchant: Hypermart, Total: 285000, Items: 5",
          prompt_tokens: 420,
          completion_tokens: 180,
          latency_ms: 1240,
          status: "success",
          created_at: new Date(Date.now() - 60000 * 45).toISOString(),
        },
        {
          id: "log-3",
          user_id: "u-2",
          provider: "gemini",
          feature: "voice_transcribe",
          input_snippet: "[Audio Binary 42s]",
          output_snippet: "Kopi Kenangan dan roti cokelat 55 ribu",
          prompt_tokens: 120,
          completion_tokens: 35,
          latency_ms: 880,
          status: "success",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ]);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Log Pemanggilan AI (Cost & Performance Monitoring)</span>
          <Activity className="w-5 h-5 text-brand-400" />
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Audit jejak pemanggilan token, latensi respon milidetik, provider, dan status error
        </p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold uppercase text-zinc-400">
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Provider & Fitur</th>
                <th className="py-3 px-4">Snippet Input</th>
                <th className="py-3 px-4">Snippet Output</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4">Latensi</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                    {formatDateTimeWIB(log.created_at)}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-white capitalize">{log.provider}</span>
                    <span className="block text-[10px] font-mono text-brand-400">{log.feature}</span>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-zinc-300">
                    {log.input_snippet || "-"}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-zinc-400 font-mono text-[11px]">
                    {log.output_snippet || "-"}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-300">
                    {log.prompt_tokens + log.completion_tokens} tok
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className={log.latency_ms > 2000 ? "text-amber-400" : "text-emerald-400"}>
                      {log.latency_ms} ms
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        log.status === "success"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
