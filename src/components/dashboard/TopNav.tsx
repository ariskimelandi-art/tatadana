"use client";

import React from "react";
import Link from "next/link";
import { Menu, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Profile } from "@/lib/types";

export interface TopNavProps {
  userProfile?: Profile | null;
  onOpenMobileSidebar: () => void;
  onOpenNewTransaction?: () => void;
}

export function TopNav({ userProfile, onOpenMobileSidebar, onOpenNewTransaction }: TopNavProps) {
  const isTelegramConnected = Boolean(userProfile?.telegram_chat_id);

  return (
    <header className="h-16 bg-white border-b border-surface-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-2 text-zinc-600 hover:text-zinc-900 md:hidden rounded-lg hover:bg-zinc-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-bold text-zinc-900 leading-none">
            Keuangan Pribadi
          </h1>
          <p className="text-[11px] text-zinc-400 mt-1 hidden sm:block">
            Semua data tersinkronisasi otomatis dengan Telegram Bot
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {/* Telegram Status Badge Pill */}
        <Link
          href="/settings?tab=telegram"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-surface-border bg-surface-light hover:bg-zinc-100 text-xs font-medium text-zinc-700 transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isTelegramConnected ? "bg-emerald-500 animate-pulse" : "bg-red-400"
            }`}
          />
          <Send className="w-3.5 h-3.5 text-zinc-500" />
          <span className="hidden sm:inline">
            {isTelegramConnected
              ? `@${userProfile?.telegram_username || "Telegram Aktif"}`
              : "Hubungkan Bot"}
          </span>
        </Link>

        {/* Quick New Transaction Modal Trigger */}
        {onOpenNewTransaction && (
          <Button onClick={onOpenNewTransaction} size="sm" variant="primary">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Catat Transaksi</span>
            <span className="sm:hidden">Catat</span>
          </Button>
        )}

        {/* User Profile Avatar Link */}
        <Link
          href="/settings?tab=profile"
          title="Pengaturan Profil"
          className="shrink-0 rounded-full hover:ring-2 hover:ring-brand-500 transition-all ml-1"
        >
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={userProfile.full_name || "Profil"}
              className="w-8 h-8 rounded-full object-cover border border-brand-300 shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs border border-brand-200">
              {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
        </Link>
      </div>
    </header>
  );
}
