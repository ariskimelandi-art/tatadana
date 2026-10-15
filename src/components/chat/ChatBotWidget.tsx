"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bot,
  X,
  Send,
  Maximize2,
  Trash2,
  Sparkles,
  ChevronDown,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Profile, ChatMessage, ChatQuickAction } from "@/lib/types";

interface ChatBotWidgetProps {
  userProfile?: Profile | null;
}

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-1",
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

export function ChatBotWidget({ userProfile }: ChatBotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("tatadana_chat_history");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowNotificationBadge(false);
    }
  }, [messages, isOpen]);

  // Persist history
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("tatadana_chat_history", JSON.stringify(messages));
      } catch {}
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

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
          userId: userProfile?.id,
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
      setMessages([DEFAULT_WELCOME_MESSAGE]);
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

  // Simple Markdown-like formatter for bold & list
  const formatContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      // Bold replacement
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
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed text-zinc-700">
            {renderedLine}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={idx} className="text-xs leading-relaxed text-zinc-700 mt-1 pl-1">
            {renderedLine}
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs leading-relaxed text-zinc-700">
          {renderedLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Tooltip speech bubble */}
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white px-3.5 py-2 rounded-full shadow-lg border border-surface-border text-xs font-semibold text-zinc-700 cursor-pointer hover:bg-zinc-50 transition-all animate-bounce"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>Tanya DanaBot AI</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 text-white shadow-xl hover:shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all group"
            title="Buka Chat Bot TataDana"
          >
            <Bot className="w-6 h-6 transition-transform group-hover:rotate-6" />
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
      )}

      {/* FLOATING CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[560px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-surface-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* HEADER */}
          <div className="bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3.5 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold border border-white/30">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border border-brand-600 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight leading-none">DanaBot AI</h3>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold">
                    TataDana
                  </span>
                </div>
                <p className="text-[11px] text-brand-100 mt-0.5 leading-none">
                  Asisten Finansial Pribadi
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href="/chat"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Buka Halaman Penuh"
              >
                <Maximize2 className="w-4 h-4" />
              </Link>
              <button
                onClick={handleClearHistory}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Hapus Percakapan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Tutup Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"} space-y-1`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                      isUser
                        ? "bg-gradient-to-tr from-brand-600 to-brand-500 text-white rounded-br-none"
                        : "bg-white text-zinc-800 border border-surface-border rounded-bl-none space-y-1"
                    }`}
                  >
                    {isUser ? (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="space-y-1">{formatContent(msg.content)}</div>
                    )}
                  </div>

                  {/* Quick Action Suggestion Chips */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 max-w-[90%]">
                      {msg.quickActions.map((qa, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleQuickAction(qa)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-brand-50 text-zinc-700 hover:text-brand-600 border border-surface-border hover:border-brand-200 text-[11px] font-medium shadow-xs transition-colors"
                        >
                          <span>{qa.label}</span>
                          <ArrowRight className="w-3 h-3 text-brand-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-zinc-400 px-1">{msg.timestamp}</span>
                </div>
              );
            })}

            {/* TYPING INDICATOR */}
            {isLoading && (
              <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-2xl rounded-bl-none border border-surface-border w-fit shadow-xs">
                <Bot className="w-3.5 h-3.5 text-brand-500 animate-pulse" />
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
                </div>
                <span className="text-[11px] text-zinc-400 ml-1">DanaBot sedang berpikir...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <div className="p-3 bg-white border-t border-surface-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Tanyakan apa saja seputar keuangan..."
                disabled={isLoading}
                className="flex-1 rounded-xl border border-surface-border bg-surface-light px-3.5 py-2.5 text-xs text-zinc-900 outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all shrink-0"
                title="Kirim pesan"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-center text-zinc-400 mt-2">
              Didukung oleh AI Advisor TataDana • Respons cerdas & solutif
            </p>
          </div>
        </div>
      )}
    </>
  );
}
