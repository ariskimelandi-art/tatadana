import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Transaction } from "@/lib/types";
import { formatRupiah } from "@/lib/utils/currency";
import { formatDateTimeWIB, formatDateOnlyWIB } from "@/lib/utils/date-wib";

export interface PDFReportOptions {
  userName: string;
  userEmail?: string;
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  topCategories: Array<{ name: string; amount: number; percentage: number }>;
  transactions: Transaction[];
}

export function generatePDFReport(options: PDFReportOptions): Uint8Array {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. BRAND HEADER (Orange Accent Bar)
  doc.setFillColor(255, 107, 0); // TataDana Orange #FF6B00
  doc.rect(0, 0, pageWidth, 18, "F");

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("TataDana — Laporan Keuangan Pribadi", 14, 12);

  // 2. METADATA SECTION
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text(`Nama: ${options.userName}`, 14, 26);
  doc.text(`Periode: ${options.periodLabel}`, 14, 32);
  doc.text(`Dicetak pada: ${formatDateTimeWIB(new Date())} WIB`, pageWidth - 14, 32, { align: "right" });

  // 3. STATS SUMMARY BOXES
  // Box 1: Pemasukan
  doc.setFillColor(240, 253, 244); // light green
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(14, 38, 56, 22, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text("Total Pemasukan", 18, 44);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatRupiah(options.totalIncome), 18, 53);

  // Box 2: Pengeluaran
  doc.setFillColor(254, 242, 242); // light red
  doc.setDrawColor(239, 68, 68);
  doc.roundedRect(77, 38, 56, 22, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(153, 27, 27);
  doc.text("Total Pengeluaran", 81, 44);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatRupiah(options.totalExpense), 81, 53);

  // Box 3: Net Cashflow
  const isNetPositive = options.netCashflow >= 0;
  if (isNetPositive) {
    doc.setFillColor(255, 247, 237);
  } else {
    doc.setFillColor(254, 242, 242);
  }
  doc.setDrawColor(255, 107, 0);
  doc.roundedRect(140, 38, 56, 22, 2, 2, "FD");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  if (isNetPositive) {
    doc.setTextColor(194, 65, 12);
  } else {
    doc.setTextColor(153, 27, 27);
  }
  doc.text("Net Cashflow", 144, 44);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(formatRupiah(options.netCashflow), 144, 53);

  // 4. TOP 5 CATEGORIES BREAKDOWN
  let currentY = 68;
  if (options.topCategories.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Top Kategori Pengeluaran", 14, currentY);

    const categoryRows = options.topCategories.map((c, idx) => [
      `${idx + 1}. ${c.name}`,
      formatRupiah(c.amount),
      `${Math.round(c.percentage)}%`,
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [["Kategori", "Total Pengeluaran", "Porsi"]],
      body: categoryRows,
      theme: "striped",
      headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 50, halign: "right" },
        2: { cellWidth: 40, halign: "right" },
      },
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 5. TRANSACTIONS TABLE
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text("Daftar Riwayat Transaksi", 14, currentY);

  const tableBody: any[] = [];
  options.transactions.forEach((tx) => {
    const isIncome = tx.type === "income";
    const isTransfer = tx.type === "transfer";
    const dateFormatted = formatDateTimeWIB(tx.transaction_date);

    let deskripsi = tx.description || "-";
    if (tx.is_receipt_parent && tx.receipt_items && tx.receipt_items.length > 0) {
      const itemsDetail = tx.receipt_items
        .map((it) => `  • ${it.name} (${it.qty}x @ ${formatRupiah(it.price)})`)
        .join("\n");
      deskripsi += `\nRincian Item:\n${itemsDetail}`;
    }

    tableBody.push([
      dateFormatted,
      isIncome ? "Pemasukan" : isTransfer ? "Transfer" : "Pengeluaran",
      deskripsi,
      tx.category?.name || "-",
      tx.wallet?.name || "-",
      isIncome ? formatRupiah(tx.amount) : "-",
      tx.type === "expense" ? formatRupiah(tx.amount) : "-",
    ]);
  });

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Tanggal", "Jenis", "Deskripsi / Rincian", "Kategori", "Dompet", "Masuk", "Keluar"]],
    body: tableBody,
    theme: "grid",
    headStyles: { fillColor: [255, 107, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    styles: { fontSize: 7.5, cellPadding: 2.5, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 20 },
      2: { cellWidth: 55 },
      3: { cellWidth: 24 },
      4: { cellWidth: 22 },
      5: { cellWidth: 21, halign: "right", textColor: [22, 101, 52] },
      6: { cellWidth: 21, halign: "right", textColor: [185, 28, 28] },
    },
  });

  // Footer page numbering
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `TataDana — Catat keuangan semudah chat Telegram | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 7,
      { align: "center" }
    );
  }

  return doc.output("arraybuffer") as unknown as Uint8Array;
}
