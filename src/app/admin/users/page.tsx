"use client";

import React, { useState, useEffect } from "react";
import { Users, Eye, UserCheck, ShieldAlert, X, Download, Search, Check, Ban, Clock, ShieldCheck } from "lucide-react";
import { Profile, Transaction, ApprovalStatus } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/currency";
import { formatDateTimeWIB } from "@/lib/utils/date-wib";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [tabFilter, setTabFilter] = useState<"all" | "pending" | "approved">("all");
  const [selectedUserForAudit, setSelectedUserForAudit] = useState<Profile | null>(null);
  const [inspectedTransactions, setInspectedTransactions] = useState<Transaction[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [adminId, setAdminId] = useState<string>("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch("/api/admin/users/list");
      const data = await res.json();
      if (data.ok && Array.isArray(data.users) && data.users.length > 0) {
        setUsers(data.users);
        return;
      }
    } catch (e) {
      console.warn("Could not load /api/admin/users/list:", e);
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setAdminId(user.id);

    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setUsers(data);
    }
  }

  // Handle Approve or Reject
  const handleApproveAction = async (targetUser: Profile, action: "approve" | "reject") => {
    setActionLoadingId(targetUser.id);
    setFeedbackMsg(null);

    try {
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUser.id,
          action,
          adminEmail: ADMIN_EMAIL,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUser.id
              ? { ...u, approval_status: action === "approve" ? "approved" : "rejected" }
              : u
          )
        );
        setFeedbackMsg({
          text: action === "approve"
            ? `✅ Akun ${targetUser.full_name} (${targetUser.email || targetUser.phone_number}) berhasil disetujui! Pengguna kini dapat mengakses dashboard.`
            : `❌ Permohonan akun ${targetUser.full_name} telah ditolak.`,
          type: "success",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      setFeedbackMsg({
        text: `Gagal memperbarui status: ${e.message}`,
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 1-Click Impersonation (Part 10)
  const handleImpersonate = async (targetUserId: string) => {
    if (!confirm("Masuk ke mode impersonasi pengguna ini?")) return;

    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          targetUserId,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        window.location.href = "/dashboard";
      } else {
        alert(data.error || "Gagal impersonasi");
      }
    } catch (e: any) {
      alert(e.message || "Error saat impersonasi");
    }
  };

  // Inspect User Transactions with Privacy Audit Logging (Part 10)
  const handleInspectTransactions = async (user: Profile) => {
    setSelectedUserForAudit(user);
    setAuditLoading(true);

    try {
      const res = await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId,
          targetUserId: user.id,
          reason: "Customer support troubleshooting & data inspection",
        }),
      });

      const supabase = createClient();
      const { data: txs } = await supabase
        .from("transactions")
        .select("*, category:category_id(*), wallet:wallet_id(*)")
        .eq("user_id", user.id)
        .order("transaction_date", { ascending: false })
        .limit(20);

      setInspectedTransactions(txs || []);
    } catch {
      setInspectedTransactions([]);
    } finally {
      setAuditLoading(false);
    }
  };

  // Filter logic
  const pendingCount = users.filter((u) => u.approval_status === "pending").length;

  const filtered = users.filter((u) => {
    const matchesSearch =
      (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.phone_number || "").includes(search) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.telegram_username || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (tabFilter === "pending") {
      return u.approval_status === "pending";
    }
    if (tabFilter === "approved") {
      return u.approval_status === "approved" || u.role === "admin";
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Superadmin: {ADMIN_EMAIL}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Persetujuan & Manajemen Pengguna
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Setujui atau tolak pendaftaran akun baru, kelola hak akses, status Telegram bot, dan audit data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, email, HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-brand-500 outline-none w-64"
            />
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setTabFilter("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            tabFilter === "all"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          Semua Pengguna ({users.length})
        </button>

        <button
          onClick={() => setTabFilter("pending")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            tabFilter === "pending"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu Persetujuan</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-900 text-[10px] font-extrabold ml-1">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setTabFilter("approved")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            tabFilter === "approved"
              ? "bg-zinc-800 text-white"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900"
          }`}
        >
          Sudah Disetujui ({users.filter((u) => u.approval_status === "approved" || u.role === "admin").length})
        </button>
      </div>

      {/* User Table */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-850/80 uppercase tracking-wider text-[11px] text-zinc-400 border-b border-zinc-850">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Kontak / WhatsApp</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Bot Telegram</th>
                <th className="py-3 px-4">Paket</th>
                <th className="py-3 px-4">Persetujuan Admin</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    Tidak ada data pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isUserAdmin = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() || u.role === "admin";
                  const isPending = !isUserAdmin && u.approval_status === "pending";
                  const isApproved = isUserAdmin || u.approval_status === "approved";
                  const isRejected = !isUserAdmin && u.approval_status === "rejected";

                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5">
                            {u.full_name}
                            {isUserAdmin && (
                              <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 text-[9px] font-bold">
                                SUPERADMIN
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-normal">{u.email || "-"}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 text-zinc-400">
                        +{u.phone_number || "-"}
                        {u.phone_verified && (
                          <span className="ml-1.5 text-emerald-400 font-bold" title="Nomor Terverifikasi">
                            ✓
                          </span>
                        )}
                      </td>

                      {/* Approval Status Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase flex items-center gap-1 w-fit ${
                            isApproved
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : isRejected
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                          }`}
                        >
                          {isApproved ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Disetujui</span>
                            </>
                          ) : isRejected ? (
                            <>
                              <Ban className="w-3 h-3" />
                              <span>Ditolak</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>Menunggu</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Telegram */}
                      <td className="py-3.5 px-4">
                        {u.telegram_chat_id ? (
                          <span className="text-emerald-400 font-medium">
                            🟢 @{u.telegram_username || "Tersambung"}
                          </span>
                        ) : (
                          <span className="text-zinc-500">Belum terhubung</span>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            u.plan === "pro"
                              ? "bg-brand-500/20 text-brand-400 border border-brand-500/30"
                              : "bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          {u.plan}
                        </span>
                      </td>

                      {/* Approve / Reject Actions */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={actionLoadingId === u.id}
                              onClick={() => handleApproveAction(u, "approve")}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-sm"
                            >
                              <Check className="w-3 h-3" />
                              <span>Setujui</span>
                            </button>
                            <button
                              disabled={actionLoadingId === u.id}
                              onClick={() => handleApproveAction(u, "reject")}
                              className="px-2 py-1 rounded-md bg-red-950/80 hover:bg-red-900 text-red-300 font-medium text-[11px] flex items-center gap-1 transition-all"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : isApproved ? (
                          <span className="text-[11px] text-zinc-500">Akses Aktif</span>
                        ) : (
                          <button
                            onClick={() => handleApproveAction(u, "approve")}
                            className="text-[11px] text-amber-400 hover:underline"
                          >
                            Setujui Ulang
                          </button>
                        )}
                      </td>

                      {/* Extra Admin Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInspectTransactions(u)}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Lihat transaksi pengguna (Audit Aktif)"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>Inspeksi</span>
                          </button>

                          <button
                            onClick={() => handleImpersonate(u.id)}
                            className="px-2.5 py-1 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 border border-brand-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Masuk sebagai user ini"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Impersonasi</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Transaction Inspection Modal */}
      {selectedUserForAudit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Inspeksi Transaksi: {selectedUserForAudit.full_name}</span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Aksi inspeksi ini dicatat ke <strong>admin_audit_logs</strong> demi kepatuhan privasi pengguna.
                </p>
              </div>
              <button
                onClick={() => setSelectedUserForAudit(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {auditLoading ? (
                <div className="text-center py-10 text-zinc-400 text-xs">Memuat data transaksi...</div>
              ) : inspectedTransactions.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-xs">
                  Pengguna ini belum memiliki riwayat transaksi.
                </div>
              ) : (
                <div className="space-y-2">
                  {inspectedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{tx.description || tx.category?.name || "Transaksi"}</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {formatDateTimeWIB(tx.transaction_date)} • 👛 {tx.wallet?.name || "Dompet"} • {tx.source}
                        </p>
                      </div>
                      <span
                        className={`font-extrabold ${
                          tx.type === "income" ? "text-emerald-400" : "text-zinc-200"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatRupiah(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
