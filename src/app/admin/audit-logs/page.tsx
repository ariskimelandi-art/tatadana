"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, FileText, UserCheck, Eye, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTimeWIB } from "@/lib/utils/date-wib";

export default function AdminAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  async function loadAuditLogs() {
    const supabase = createClient();
    const { data } = await supabase
      .from("admin_audit_logs")
      .select("*, admin:admin_id(full_name), target_user:target_user_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data && data.length > 0) {
      setAuditLogs(data);
    } else {
      // Mock audit logs
      setAuditLogs([
        {
          id: "aud-1",
          admin_id: "adm-1",
          target_user_id: "u-1",
          action: "VIEW_USER_TRANSACTIONS",
          details: { reason: "Troubleshooting receipt OCR extraction discrepancy" },
          ip_address: "180.252.164.22",
          created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
          admin: { full_name: "Superadmin TataDana" },
          target_user: { full_name: "Budi Pratama" },
        },
        {
          id: "aud-2",
          admin_id: "adm-1",
          target_user_id: "u-2",
          action: "IMPERSONATE_USER",
          details: { target_name: "Siti Rahmawati" },
          ip_address: "180.252.164.22",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
          admin: { full_name: "Superadmin TataDana" },
          target_user: { full_name: "Siti Rahmawati" },
        },
        {
          id: "aud-3",
          admin_id: "adm-1",
          target_user_id: "u-1",
          action: "APPROVE_MANUAL_PAYMENT",
          details: { order_id: "TATADANA-MANUAL-PRO-1729001234", plan: "pro" },
          ip_address: "180.252.164.22",
          created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
          admin: { full_name: "Superadmin TataDana" },
          target_user: { full_name: "Budi Pratama" },
        },
      ]);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Log Audit Keamanan & Privasi Superadmin</span>
          <ShieldAlert className="w-5 h-5 text-amber-400" />
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Catatan tidak dapat dihapus untuk setiap kali admin mengakses data privasi pengguna atau melakukan impersonasi
        </p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] font-bold uppercase text-zinc-400">
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Admin Pelaksana</th>
                <th className="py-3 px-4">Aksi Dilakukan</th>
                <th className="py-3 px-4">Target Pengguna</th>
                <th className="py-3 px-4">Detail & Rincian</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-zinc-400 whitespace-nowrap">
                    {formatDateTimeWIB(log.created_at)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    {log.admin?.full_name || "Admin"}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-zinc-200">
                    {log.target_user?.full_name || "User ID: " + (log.target_user_id || "-")}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 max-w-sm truncate font-mono text-[11px]">
                    {JSON.stringify(log.details)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-500">
                    {log.ip_address || "127.0.0.1"}
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
