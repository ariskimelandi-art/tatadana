"use client";

import React, { useState, useEffect, useRef } from "react";
import { DashboardLayoutWrapper } from "@/components/dashboard/DashboardLayoutWrapper";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { ChatMessage, ChatQuickAction } from "@/lib/types";

const INITIAL_GREETING: ChatMessage = {
  id: "init-1",
  role: "assistant",
  content: `Halo! 👋 Gimana harinya? Yuk cek pengeluaran Anda hari ini!

🍽️ **Berapa total pengeluaran Anda hari ini?**
Tadi makan apa saja untuk siang atau malam ini? Ada jajan kopi, beli bensin, atau bayar parkir yang belum dicatat?

📊 **Status Pengeluaran Hari Ini:**
- Uang keluar hari ini: **Rp 45.000** *(Makan Siang Nasi Padang Rendang)*
- Batas aman harian Anda: **Rp 150.000/hari**
- Sisa kuota aman hari ini: **Rp 105.000** 🟢

Ceritakan apa saja yang Anda makan atau belanjakan hari ini, biar saya bantu hitung & evaluasi! 😊`,
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  quickActions: [
    { label: "🍜 Tadi Makan Siang 25rb", action: "makan_25" },
    { label: "☕ Jajan Kopi 20rb", action: "ngopi_20" },
    { label: "🚗 Beli Bensin 25rb", action: "bensin_25" },
    { label: "✨ Hari Ini Belum Keluar Uang", action: "belum_keluar" },
    { label: "📅 Rekap Pengeluaran Hari Ini", action: "pengeluaran_hari_ini" },
  ],
};

const SUGGESTED_TOPICS = [
  {
    category: "Pengeluaran & Makan Hari Ini",
    items: [
      { label: "Berapa total pengeluaran saya hari ini?", prompt: "Berapa total pengeluaran saya hari ini?" },
      { label: "Tadi makan siang soto 25rb", prompt: "Tadi makan siang soto 25rb" },
      { label: "Tadi jajan kopi 20rb & bensin 25rb", prompt: "Tadi jajan kopi 20rb sama beli bensin 25rb" },
      { label: "Hari ini belum keluar uang sama sekali", prompt: "Hari ini saya belum keluar uang sama sekali" },
    ],
  },
  {
    category: "Pemasukan & Pengeluaran Bulanan",
    items: [
      { label: "Berapa total pengeluaran saya bulan ini?", prompt: "Berapa total pengeluaran saya bulan ini dan untuk apa saja?" },
      { label: "Berapa total pemasukan & saldo saya?", prompt: "Berapa total pemasukan dan sisa saldo di dompet saya saat ini?" },
      { label: "Kategori apa yang paling banyak menyerap uang?", prompt: "Apa kategori pengeluaran terbesar saya bulan ini?" },
      { label: "Tampilkan 5 transaksi terakhir saya", prompt: "Tampilkan 5 transaksi terakhir saya" },
    ],
  },
  {
    category: "Evaluasi & Perencanaan",
    items: [
      { label: "Apakah pengeluaran saya bulan ini boros?", prompt: "Evaluasi keuangan saya, apakah pengeluaran saya bulan ini boros atau sehat?" },
      { label: "Berapa dana darurat ideal untuk saya?", prompt: "Berapa dana darurat ideal berdasarkan pengeluaran riil saya?" },
      { label: "Simulasi alokasi gaji 50/30/20", prompt: "Jelaskan cara menerapkan metode budget 50/30/20 untuk penghasilan saya." },
    ],
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tatadana_chat_history");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [INITIAL_GREETING];
  });
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tatadana_chat_history", JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        const botMsg: ChatMessage = {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          quickActions: data.quickActions,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: "bot-" + Date.now(),
          role: "assistant",
          content: data.error || "Maaf, terjadi kendala saat memproses jawaban. Silakan coba lagi.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        role: "assistant",
        content: "Koneksi terganggu. Pastikan koneksi internet Anda stabil lalu tanyakan kembali.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Hapus seluruh riwayat percakapan dengan DanaBot?")) {
      setMessages([INITIAL_GREETING]);
      if (typeof window !== "undefined") {
        localStorage.removeItem("tatadana_chat_history");
      }
    }
  };

  const handleQuickAction = (qa: ChatQuickAction) => {
    if (qa.href) {
      window.location.href = qa.href;
      return;
    }
    if (qa.action === "makan_25") {
      handleSendMessage("Tadi siang makan 25rb");
    } else if (qa.action === "ngopi_20") {
      handleSendMessage("Tadi jajan kopi 20rb");
    } else if (qa.action === "bensin_25") {
      handleSendMessage("Tadi beli bensin 25rb");
    } else if (qa.action === "belum_keluar") {
      handleSendMessage("Hari ini saya belum keluar uang sama sekali");
    } else if (qa.action === "pengeluaran_hari_ini") {
      handleSendMessage("Berapa total pengeluaran saya hari ini?");
    } else if (qa.action === "makan_35") {
      handleSendMessage("Tadi makan habis 35rb");
    } else if (qa.action === "ditraktir") {
      handleSendMessage("Tadi makan gratis ditraktir teman");
    } else if (qa.action === "sudah_cukup") {
      handleSendMessage("Sudah cukup, tidak ada pengeluaran lain hari ini");
    } else if (qa.action === "cek_pengeluaran") {
      handleSendMessage("Berapa total pengeluaran saya bulan ini dan untuk apa saja?");
    } else if (qa.action === "cek_pemasukan") {
      handleSendMessage("Berapa total pemasukan saya bulan ini?");
    } else if (qa.action === "kategori_terbesar") {
      handleSendMessage("Apa kategori pengeluaran terbesar saya bulan ini?");
    } else if (qa.action === "evaluasi_keuangan") {
      handleSendMessage("Evaluasi keuangan saya, apakah pengeluaran saya bulan ini boros atau sehat?");
    } else if (qa.action === "riwayat_transaksi") {
      handleSendMessage("Tampilkan 5 transaksi terakhir saya");
    } else if (qa.action === "cek_saldo") {
      handleSendMessage("Berapa total saldo aktif di dompet saya saat ini?");
    } else if (qa.action === "tips_gaji") {
      handleSendMessage("Bagaimana tips mengatur gaji bulanan yang efektif?");
    } else if (qa.action === "budget_503020") {
      handleSendMessage("Jelaskan cara menerapkan metode budget 50/30/20.");
    } else if (qa.action === "dana_darurat") {
      handleSendMessage("Berapa dana darurat ideal untuk saya?");
    } else if (qa.action === "tips_hemat") {
      handleSendMessage("Berikan tips hemat dan menabung anti-boncos.");
    } else if (qa.action === "fitur_aplikasi") {
      handleSendMessage("Apa saja fitur unggulan di aplikasi TataDana?");
    } else if (qa.label) {
      handleSendMessage(qa.label);
    }
  };

  // Formatter for markdown-like syntax
  const formatContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-bold text-zinc-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm leading-relaxed text-zinc-700">
            {renderedLine}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={idx} className="text-sm leading-relaxed text-zinc-700 mt-1 pl-1">
            {renderedLine}
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm leading-relaxed text-zinc-700">
          {renderedLine}
        </p>
      );
    });
  };

  return (
    <DashboardLayoutWrapper>
      <div className="space-y-6 pb-12">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Tanya DanaBot AI
              </h2>
              <Badge variant="orange" size="sm">
                <Sparkles className="w-3 h-3 mr-1" /> AI Advisor
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Konsultasi keuangan cerdas, tips budgeting, dan panduan penggunaan TataDana secara interaktif
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="gap-1.5 text-zinc-600 hover:text-red-600"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Bersihkan Percakapan
            </Button>
          </div>
        </div>

        {/* MAIN CHAT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* LEFT SIDEBAR: TOPIC SUGGESTIONS */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand-500" />
                <h4 className="font-bold text-xs text-zinc-800 uppercase tracking-wider">
                  Topik Populer
                </h4>
              </div>

              <div className="space-y-4">
                {SUGGESTED_TOPICS.map((sec, sIdx) => (
                  <div key={sIdx} className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      {sec.category}
                    </p>
                    <div className="space-y-1">
                      {sec.items.map((item, iIdx) => (
                        <button
                          key={iIdx}
                          onClick={() => handleSendMessage(item.prompt)}
                          className="w-full text-left p-2 rounded-xl text-xs text-zinc-700 hover:text-brand-600 hover:bg-brand-50 transition-all border border-transparent hover:border-brand-200 block"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-tr from-brand-50 to-orange-50 border-brand-200 space-y-2">
              <div className="flex items-center gap-2 text-brand-700 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <span>Selalu Siap Membantu</span>
              </div>
              <p className="text-[11px] text-brand-900/80 leading-relaxed">
                DanaBot dirancang untuk selalu merespons pertanyaan Anda dengan saran yang praktis, santun, dan sesuai prinsip keuangan Indonesia.
              </p>
            </Card>
          </div>

          {/* RIGHT: CHAT CANVAS */}
          <Card className="lg:col-span-3 flex flex-col h-[650px] shadow-sm overflow-hidden p-0 border border-surface-border">
            {/* Top Bar inside Card */}
            <div className="px-5 py-3 border-b border-surface-border bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center font-bold shadow-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 leading-none">
                    DanaBot Financial Assistant
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1 leading-none">
                    ● Aktif & Siap Menanggapi
                  </p>
                </div>
              </div>

              <Badge variant="zinc" size="sm">
                Versi 2.0 AI
              </Badge>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-surface-light">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        isUser
                          ? "bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-br-none"
                          : "bg-white text-zinc-800 border border-surface-border rounded-bl-none space-y-1.5"
                      }`}
                    >
                      {isUser ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="space-y-1.5">{formatContent(msg.content)}</div>
                      )}
                    </div>

                    {/* Quick action suggestion buttons */}
                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 max-w-[90%]">
                        {msg.quickActions.map((qa, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleQuickAction(qa)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-brand-50 text-zinc-700 hover:text-brand-600 border border-surface-border hover:border-brand-300 text-xs font-semibold shadow-xs transition-colors"
                          >
                            <span>{qa.label}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-brand-500" />
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[11px] text-zinc-400 px-1">{msg.timestamp}</span>
                  </div>
                );
              })}

              {/* Typing state */}
              {isLoading && (
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-surface-border w-fit shadow-xs">
                  <Bot className="w-4 h-4 text-brand-500 animate-pulse" />
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-brand-500 rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-xs text-zinc-500 ml-1">DanaBot sedang memproses jawaban...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-white border-t border-surface-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2.5"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ketik pertanyaan keuangan Anda atau tanyakan panduan TataDana..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-surface-border bg-surface-light px-4 py-3 text-sm text-zinc-900 outline-none focus:border-brand-500 focus:bg-white transition-all font-medium"
                />
                <Button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  variant="primary"
                  size="md"
                  className="gap-2 shrink-0 px-5"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim</span>
                </Button>
              </form>
              <div className="flex items-center justify-between mt-2.5 px-1">
                <span className="text-[11px] text-zinc-400">
                  💡 Tips: Tekan <strong>Enter</strong> untuk mengirim pesan langsung
                </span>
                <span className="text-[11px] text-zinc-400">
                  TataDana AI Financial Intelligence
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
