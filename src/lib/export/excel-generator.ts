import * as XLSX from "xlsx";
import { Transaction } from "@/lib/types";
import { formatDateTimeWIB } from "@/lib/utils/date-wib";

export interface ExcelReportOptions {
  userName: string;
  userEmail?: string;
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  transactions: Transaction[];
}

export function generateExcelReport(options: ExcelReportOptions): Buffer {
  const wb = XLSX.utils.book_new();

  // SHEET 1: RINGKASAN LAPORAN
  const summaryData = [
    ["TataDana - Laporan Keuangan Pribadi"],
    [],
    ["Nama Pengguna", options.userName],
    ["Periode", options.periodLabel],
    ["Waktu Export (WIB)", `${formatDateTimeWIB(new Date())} WIB`],
    [],
    ["METRIK UTAMA", "JUMLAH (IDR)"],
    ["Total Pemasukan", options.totalIncome],
    ["Total Pengeluaran", options.totalExpense],
    ["Net Cashflow", options.netCashflow],
    [],
    ["TOP KATEGORI PENGELUARAN", "TOTAL (IDR)", "PORSI (%)"],
    ...options.topCategories.map(c => [c.name, c.amount, `${Math.round(c.percentage)}%`]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  // SHEET 2: RINCIAN TRANSAKSI
  const txHeaders = [
    "Tanggal (WIB)",
    "Jenis",
    "Deskripsi / Catatan",
    "Kategori",
    "Dompet / Rekening",
    "Nominal (IDR)",
    "Sumber Input",
    "Rincian Struk Multi-Item",
  ];

  const txRows = options.transactions.map((t) => {
    let receiptDetails = "";
    if (t.is_receipt_parent && t.receipt_items && t.receipt_items.length > 0) {
      receiptDetails = t.receipt_items
        .map((it) => `${it.name} (${it.qty}x @ Rp${it.price}) = Rp${it.total}`)
        .join("; ");
    }

    return [
      formatDateTimeWIB(t.transaction_date),
      t.type === "expense" ? "Pengeluaran" : t.type === "income" ? "Pemasukan" : "Transfer",
      t.description || "-",
      t.category?.name || "-",
      t.wallet?.name || "-",
      Number(t.amount),
      t.source,
      receiptDetails,
    ];
  });

  const wsTx = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows]);
  
  // Column widths
  wsTx["!cols"] = [
    { wch: 20 },
    { wch: 14 },
    { wch: 35 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, wsTx, "Data Transaksi");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer;
}
