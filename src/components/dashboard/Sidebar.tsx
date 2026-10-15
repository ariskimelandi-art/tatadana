"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  FileBarChart2,
  PieChart,
  Wallet,
  Settings,
  ShieldCheck,
  LogOut,
  Zap,
  Bot,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { Profile } from "@/lib/types";

export interface SidebarProps {
  userProfile?: Profile | null;
  onLogout?: () => void;
  closeMobile?: () => void;
}

export function Sidebar({ userProfile, onLogout, closeMobile }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Beranda", href: "/dashboard", icon: LayoutDashboard },
    { name: "Transaksi", href: "/transaksi", icon: Receipt },
    { name: "Laporan", href: "/laporan", icon: FileBarChart2 },
    { name: "Budget", href: "/budget", icon: PieChart },
    { name: "Wallet", href: "/wallet", icon: Wallet },
    { name: "Tanya AI (Chat)", href: "/chat", icon: Bot, isAi: true },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const isAdmin = userProfile?.role === "admin";
  const isPro = userProfile?.plan === "pro";

  return (
    <aside className="w-64 bg-white border-r border-surface-border flex flex-col h-full select-none">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-100">
        <Link
          href="/dashboard"
          onClick={closeMobile}
          className="flex items-center gap-2.5 font-bold text-xl text-zinc-900 group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-orange">
            <span className="font-extrabold text-lg tracking-tighter">TD</span>
          </div>
          <span className="tracking-tight">
            Tata<span className="text-brand-500">Dana</span>
          </span>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-3.5 space-y-1 overflow-y-auto">
        <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Menu Utama
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeMobile}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-brand-50 text-brand-600 font-semibold shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-brand-500" : "text-zinc-400 group-hover:text-zinc-600"
                  )}
                />
                <span>{item.name}</span>
              </div>
              {item.isAi && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-brand-500 to-amber-500 text-white tracking-wider shadow-xs">
                  AI
                </span>
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-zinc-100">
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-600">
              Administrasi
            </div>
            <Link
              href="/admin"
              onClick={closeMobile}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                pathname.startsWith("/admin")
                  ? "bg-brand-50 text-brand-600 font-semibold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              )}
            >
              <ShieldCheck className="w-5 h-5 text-brand-500" />
              <span>Admin Panel</span>
            </Link>
          </div>
        )}
      </div>

      {/* Plan Card Banner */}
      {!isPro && (
        <div className="px-4 py-3 mx-3 mb-4 rounded-xl bg-gradient-to-br from-brand-50 to-orange-100/50 border border-brand-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-brand-800">TataDana Pro</span>
            <Badge variant="orange" size="sm">
              <Zap className="w-3 h-3 fill-brand-500 text-brand-500" /> Rp99rb
            </Badge>
          </div>
          <p className="text-[11px] text-brand-900/80 leading-relaxed mb-2.5">
            Scan foto struk tanpa batas & AI Advisor pribadi seumur hidup.
          </p>
          <Link
            href="/settings?tab=subscription"
            onClick={closeMobile}
            className="block w-full py-1.5 text-center text-xs font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-lg shadow-sm transition-all"
          >
            Upgrade ke Pro
          </Link>
        </div>
      )}

      {/* User Profile Footer */}
      <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt={userProfile.full_name || "Foto Profil"}
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-brand-300 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0 border border-brand-200">
              {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900 truncate">
              {userProfile?.full_name || "Pengguna TataDana"}
            </p>
            <div className="flex items-center gap-1.5">
              <Badge variant={isPro ? "orange" : "zinc"} size="sm">
                {isPro ? "PRO" : "STARTER"}
              </Badge>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Keluar"
          className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
