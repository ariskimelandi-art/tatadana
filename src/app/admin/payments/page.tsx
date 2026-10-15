"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Check, X, ExternalLink } from "lucide-react";
import { PaymentTransaction } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils/currency";
import { formatDateTimeWIB } from "@/lib/utils/date-wib";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<string>("");

  useEffect(() => {
    loadPayments();
  }, []);

  async function loadPayments() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setAdminId(user.id);

    const { data } = await supabase
      .from("payment_transactions")
      .select("*, profile:user_id(*)")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setPayments(data);
    } else {
      // Mock payments fallback
      setPayments([
        {
          id: "pay-1",
          user_id: "u-1",
          order_id: "TATADANA-MANUAL-PRO-1729001234",
          plan: "pro",
          amount: 99000,
          payment_method: "manual_transfer",
          status: "pending",
          proof_image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          updated_at: new Date().toISOString(),
          profile: { full_name: "Budi Pratama", phone_number: "6281234567890", id: "u-1", plan: "starter" } as any,
        },
        {
          id: "pay-2",
          user_id: "u-2",
          order_id: "TATADANA-PRO-1728904567",
          plan: "pro",
          amount: 99000,
          payment_method: "midtrans",
          status: "paid",
          created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
          updated_at: new Date().toISOString(),
          profile: { full_name: "Siti Rahmawati", phone_number: "6285712345678", id: "u-2", plan: "pro" } as any,
        },
      ]);
    }
  }

  const handleAction = async (paymentId: string, action: "approve" | "reject") => {
    setLoadingId(paymentId);
    try {
      const res = await fetch("/api/admin/approve-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          adminId,
          action,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setPayments((prev) =>
          prev.map((p) =>
            p.id === paymentId ? { ...p, status: action === "approve" ? "approved" : "rejected" } : p
          )
        );
      } else {
        alert(data.error || "Gagal memproses");
      }
    } catch (e: any) {
      alert(e.message || "Error saat approval");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Persetujuan Pembayaran & Transaksi</span>
          <CreditCard className="w-5 h-5 text-brand-400" />
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Approve atau reject bukti transfer bank manual untuk aktivasi paket Pro pengguna
        </p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold uppercase text-zinc-400">
                <th className="py-3 px-4">Order ID & Tanggal</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Paket & Nominal</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Bukti Transfer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-mono font-bold text-white">{p.order_id}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{formatDateTimeWIB(p.created_at)}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {p.profile?.full_name || "User"}
                    <span className="block text-[11px] text-zinc-500 font-normal">
                      +{p.profile?.phone_number || "-"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-white">{formatRupiah(p.amount)}</span>
                    <span className="block text-[11px] text-brand-400 font-semibold uppercase">{p.plan}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase text-[10px] font-semibold">
                      {p.payment_method === "manual_transfer" ? "Bank Transfer" : "Midtrans"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {p.proof_image_url ? (
                      <a
                        href={p.proof_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Lihat Bukti</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === "paid" || p.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : p.status === "pending"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {p.status === "pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={loadingId === p.id}
                          onClick={() => handleAction(p.id, "approve")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          disabled={loadingId === p.id}
                          onClick={() => handleAction(p.id, "reject")}
                          className="px-2 py-1 bg-zinc-800 hover:bg-red-600/40 text-zinc-400 hover:text-red-300 rounded-lg font-bold transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-zinc-600 text-[11px]">Selesai</span>
                    )}
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
