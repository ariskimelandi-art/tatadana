"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Plus, Trash2, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { AIProviderName, FailoverMode } from "@/lib/types";

export default function AdminAIProvidersPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [providerName, setProviderName] = useState<AIProviderName>("gemini");
  const [modelName, setModelName] = useState("gemini-2.0-flash");
  const [apiKey, setApiKey] = useState("");
  const [priority, setPriority] = useState(1);
  const [failoverMode, setFailoverMode] = useState<FailoverMode>("parallel");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const res = await fetch("/api/admin/ai-providers");
      const data = await res.json();
      if (data.providers) {
        setProviders(data.providers);
      }
    } catch {
      // Fallback display
      setProviders([
        { id: "p-1", provider_name: "gemini", model_name: "gemini-2.0-flash", api_key_masked: "AIzaSy••••••••4aB1", priority: 1, failover_mode: "parallel", is_active: true },
        { id: "p-2", provider_name: "openai", model_name: "gpt-4o-mini", api_key_masked: "sk-proj••••••••9F32", priority: 2, failover_mode: "parallel", is_active: true },
        { id: "p-3", provider_name: "deepseek", model_name: "deepseek-chat", api_key_masked: "sk-••••••••bb21", priority: 3, failover_mode: "parallel", is_active: false },
      ]);
    }
  }

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");

    try {
      const res = await fetch("/api/admin/ai-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_name: providerName,
          model_name: modelName,
          api_key: apiKey,
          priority: Number(priority),
          failover_mode: failoverMode,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setStatusMsg("Provider AI berhasil ditambahkan & API Key terenkripsi aman.");
        setApiKey("");
        loadProviders();
      } else {
        setStatusMsg(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus provider ini?")) return;
    await fetch(`/api/admin/ai-providers?id=${id}`, { method: "DELETE" });
    setProviders((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Kelola API Provider AI</span>
          <Cpu className="w-5 h-5 text-brand-400" />
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          TataDana mendukung multi-provider (Gemini, OpenAI, DeepSeek). Mode paralel mengeksekusi failover otomatis jika provider utama timeout/down.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-brand-500/20 border border-brand-500/40 text-brand-300 rounded-xl text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Add Provider */}
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-brand-400" /> Tambah Provider AI
          </h3>

          <form onSubmit={handleAddProvider} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-zinc-400 font-semibold uppercase mb-1">Provider</label>
              <select
                value={providerName}
                onChange={(e) => {
                  const val = e.target.value as AIProviderName;
                  setProviderName(val);
                  setModelName(val === "gemini" ? "gemini-2.0-flash" : val === "openai" ? "gpt-4o-mini" : "deepseek-chat");
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-brand-500"
              >
                <option value="gemini">Google Gemini (Recommended Multimodal)</option>
                <option value="openai">OpenAI (GPT-4o & Whisper)</option>
                <option value="deepseek">DeepSeek (Chat & Reasoner)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold uppercase mb-1">Nama Model</label>
              <input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold uppercase mb-1">API Key</label>
              <input
                type="password"
                placeholder="Tempel API Key baru..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-brand-500 font-mono"
                required
              />
              <span className="text-[10px] text-zinc-500">Otomatis dienkripsi dengan AES-256 di database.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 font-semibold uppercase mb-1">Prioritas</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold uppercase mb-1">Mode Eksekusi</label>
                <select
                  value={failoverMode}
                  onChange={(e) => setFailoverMode(e.target.value as FailoverMode)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-brand-500"
                >
                  <option value="parallel">Paralel (Failover)</option>
                  <option value="single">Single (Tunggal)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-orange transition-all"
            >
              {loading ? "Menyimpan..." : "Simpan & Enkripsi Provider"}
            </button>
          </form>
        </div>

        {/* Providers Table */}
        <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Daftar Provider Terkonfigurasi</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </h3>

          <div className="divide-y divide-zinc-800/80">
            {providers.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-brand-400 uppercase">
                    {p.provider_name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white capitalize">{p.provider_name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                        {p.model_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className="font-mono text-zinc-500">{p.api_key_masked}</span>
                      <span>•</span>
                      <span>Prioritas: {p.priority}</span>
                      <span>•</span>
                      <span className="text-brand-400">Mode: {p.failover_mode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.is_active ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"}`}>
                    {p.is_active ? "Aktif" : "Nonaktif"}
                  </span>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
