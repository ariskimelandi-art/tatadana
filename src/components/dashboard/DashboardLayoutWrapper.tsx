"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { TransactionModal } from "./TransactionModal";
import { ChatBotWidget } from "@/components/chat/ChatBotWidget";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

export function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check impersonation cookie
    const cookies = document.cookie.split(";").map((c) => c.trim());
    const impCookie = cookies.find((c) => c.startsWith("tatadana_impersonate_user_id="));
    if (impCookie) {
      setIsImpersonating(true);
    }

    // Load active profile from Supabase
    const supabase = createClient();
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com";
        const isAdmin = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        if (profile) {
          // If user is not admin and not approved yet, redirect to pending approval
          if (!isAdmin && profile.approval_status !== "approved" && profile.role !== "admin") {
            router.push(
              `/pending-approval?email=${encodeURIComponent(user.email || profile.email || "")}&name=${encodeURIComponent(profile.full_name || "")}`
            );
            return;
          }

          setUserProfile(profile);
          return;
        }
      }

      // Check stored user from localStorage/cookies
      const storedEmail = typeof window !== "undefined" ? localStorage.getItem("tatadana_user_email") || "" : "";
      const storedName = typeof window !== "undefined" ? localStorage.getItem("tatadana_user_name") || "" : "";

      if (storedEmail) {
        try {
          const res = await fetch(`/api/auth/approval-status?email=${encodeURIComponent(storedEmail)}`, {
            cache: "no-store",
          });
          const data = await res.json();
          if (data.ok) {
            if (data.is_approved) {
              setUserProfile({
                id: "usr-" + storedEmail,
                email: storedEmail,
                full_name: data.full_name || storedName || storedEmail.split("@")[0],
                avatar_url: data.avatar_url || (typeof window !== "undefined" ? localStorage.getItem("tatadana_user_avatar") : null),
                phone_number: "6281234567890",
                phone_verified: true,
                telegram_chat_id: null,
                telegram_username: null,
                plan: data.role === "admin" ? "pro" : "starter",
                role: data.role || "user",
                approval_status: "approved",
                currency: "IDR",
                monthly_tx_count: 0,
                last_tx_month: new Date().toISOString().slice(0, 7),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              return;
            } else {
              router.push(
                `/pending-approval?email=${encodeURIComponent(storedEmail)}&name=${encodeURIComponent(data.full_name || storedName)}`
              );
              return;
            }
          }
        } catch {
          // Fallback
        }
      }

      // Demo/Fallback user if browsing without Supabase auth configured
      const fallbackName = typeof window !== "undefined" ? localStorage.getItem("tatadana_user_name") : null;
      const fallbackAvatar = typeof window !== "undefined" ? localStorage.getItem("tatadana_user_avatar") : null;
      setUserProfile({
        id: "demo-user-123",
        email: "geninggkimteaa@gmail.com",
        full_name: fallbackName || "Gening Kim (Superadmin)",
        avatar_url: fallbackAvatar,
        phone_number: "6281234567890",
        phone_verified: true,
        telegram_chat_id: 12345678,
        telegram_username: "gening_admin",
        plan: "pro",
        role: "admin",
        approval_status: "approved",
        currency: "IDR",
        monthly_tx_count: 14,
        last_tx_month: "2026-10",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    loadUser();

    // Listen to profile updates from settings page
    const handleProfileUpdate = (e: any) => {
      const { fullName, avatarUrl } = e.detail || {};
      setUserProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          full_name: fullName !== undefined ? fullName : prev.full_name,
          avatar_url: avatarUrl !== undefined ? avatarUrl : prev.avatar_url,
        };
      });
    };
    if (typeof window !== "undefined") {
      window.addEventListener("tatadana_profile_updated", handleProfileUpdate);
    }

    // Listen to real-time transactions changes
    const channel = supabase
      .channel("realtime-transactions")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (typeof window !== "undefined") {
        window.removeEventListener("tatadana_profile_updated", handleProfileUpdate);
      }
    };
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleStopImpersonation = async () => {
    await fetch("/api/admin/impersonate", { method: "DELETE" });
    setIsImpersonating(false);
    window.location.href = "/admin";
  };

  return (
    <div className="flex h-screen bg-surface-light text-zinc-900 overflow-hidden font-sans">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Mode Impersonasi Admin Aktif: Anda sedang melihat tampilan sebagai pengguna ini.</span>
          </div>
          <button
            onClick={handleStopImpersonation}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
          >
            Hentikan Impersonasi
          </button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden md:block shrink-0 ${isImpersonating ? "mt-9" : ""}`}>
        <Sidebar userProfile={userProfile} onLogout={handleLogout} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50 w-72 bg-white h-full shadow-2xl">
            <Sidebar
              userProfile={userProfile}
              onLogout={handleLogout}
              closeMobile={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isImpersonating ? "mt-9" : ""}`}>
        <TopNav
          userProfile={userProfile}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onOpenNewTransaction={() => setTxModalOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Global Add Transaction Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        userId={userProfile?.id}
        onSuccess={() => {
          setTxModalOpen(false);
          router.refresh();
        }}
      />

      {/* Floating Chat Bot Widget */}
      <ChatBotWidget userProfile={userProfile} />
    </div>
  );
}
