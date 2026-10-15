import React from "react";
import { DashboardLayoutWrapper } from "@/components/dashboard/DashboardLayoutWrapper";

export const metadata = {
  title: "Dashboard — TataDana",
  description: "Kelola keuangan pribadi Anda langsung dari Telegram dan web.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
