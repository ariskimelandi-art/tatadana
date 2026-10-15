import { formatTelegramReplyDate } from "@/lib/utils/date-wib";
import { formatRupiah } from "@/lib/utils/currency";

/**
 * Creates visual ASCII progress bar using █ and ░
 * e.g. [████░░░░░░] 40%
 */
export function createProgressBar(percentage: number, totalSlots: number = 10): string {
  const boundedPct = Math.max(0, Math.min(100, Math.round(percentage)));
  const filledSlots = Math.min(totalSlots, Math.max(0, Math.round((boundedPct / 100) * totalSlots)));
  const emptySlots = totalSlots - filledSlots;
  const bar = "█".repeat(filledSlots) + "░".repeat(emptySlots);
  return `[${bar}] ${boundedPct}%`;
}

/**
 * Format reply message for Expense (Part 4.4)
 */
export function formatExpenseReply(params: {
  amount: number;
  categoryName: string;
  categoryIcon?: string;
  walletName: string;
  note: string;
  newBalance: number;
  budget?: {
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
  } | null;
  transcription?: string;
}): string {
  const dateStr = formatTelegramReplyDate();
  const icon = params.categoryIcon || "🏷️";
  
  let msg = `📅 ${dateStr}\n`;
  if (params.transcription) {
    msg += `🎙️ Transkrip: "${params.transcription}"\n`;
  }
  msg += `💸 Pengeluaran tercatat!\n`;
  msg += `├ Nominal : ${formatRupiah(params.amount)}\n`;
  msg += `├ Kategori : ${icon} ${params.categoryName}\n`;
  msg += `├ Dompet : 👛 ${params.walletName}\n`;
  msg += `├ Catatan : ${params.note}\n`;
  msg += `└ Saldo : ${formatRupiah(params.newBalance)}\n`;

  if (params.budget && params.budget.limit > 0) {
    const bar = createProgressBar(params.budget.percentage);
    msg += `\n📊 Budget ${params.categoryName} bulan ini:\n`;
    msg += `${bar} — sisa ${formatRupiah(params.budget.remaining)}\n`;

    if (params.budget.percentage >= 100) {
      msg += `⚠️ Perhatian: Budget kategori ini sudah habis terpakai! Rem pengeluaranmu ya.`;
    } else if (params.budget.percentage >= 80) {
      msg += `⚠️ Peringatan: Budget sudah mencapai ${Math.round(params.budget.percentage)}%! Jaga pengeluaran sampai akhir bulan.`;
    } else {
      msg += `👍 Budget masih aman. Pertahankan disiplin keuanganmu!`;
    }
  }

  return msg;
}

/**
 * Format reply message for Income (Part 4.5)
 */
export function formatIncomeReply(params: {
  amount: number;
  walletName: string;
  newBalance: number;
  note?: string;
  transcription?: string;
}): string {
  const dateStr = formatTelegramReplyDate();

  let msg = `📅 ${dateStr}\n`;
  if (params.transcription) {
    msg += `🎙️ Transkrip: "${params.transcription}"\n`;
  }
  msg += `💰 Pemasukan tercatat!\n`;
  msg += `├ Nominal : ${formatRupiah(params.amount)}\n`;
  msg += `├ Kategori : 💼 Pemasukan\n`;
  msg += `├ Dompet : 👛 ${params.walletName}\n`;
  msg += `└ Saldo baru : ${formatRupiah(params.newBalance)}\n\n`;
  msg += `💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;

  return msg;
}

/**
 * Format reply message for Transfer
 */
export function formatTransferReply(params: {
  amount: number;
  fromWalletName: string;
  fromWalletBalance: number;
  toWalletName: string;
  toWalletBalance: number;
  transcription?: string;
}): string {
  const dateStr = formatTelegramReplyDate();

  let msg = `📅 ${dateStr}\n`;
  if (params.transcription) {
    msg += `🎙️ Transkrip: "${params.transcription}"\n`;
  }
  msg += `🔄 Transfer Antar Dompet Berhasil!\n`;
  msg += `├ Nominal : ${formatRupiah(params.amount)}\n`;
  msg += `├ Dari : 👛 ${params.fromWalletName} (${formatRupiah(params.fromWalletBalance)})\n`;
  msg += `└ Menuju : 👛 ${params.toWalletName} (${formatRupiah(params.toWalletBalance)})\n`;

  return msg;
}

/**
 * Format AI Financial Advisor message (Part 4.7)
 */
export function formatAdvisorReply(userName: string, analysis: string, tip: string): string {
  return `🤖 Financial Advisor
Hei ${userName}! ${analysis}

💡 Saran: ${tip}`;
}

/**
 * Format Daily Reminder message (Part 4.8)
 */
export function formatDailyReminderReply(customMessage?: string | null): string {
  if (customMessage && customMessage.trim().length > 0) {
    return customMessage;
  }
  return `⏰ Reminder Keuangan!
Jangan lupa catat pengeluaran hari ini ya 📝
Pencatatan rutin = keuangan lebih terkontrol 💪
Ketik transaksimu sekarang!`;
}

/**
 * Format Starter Plan Limit Reached message (Part 4.9)
 */
export function formatLimitReachedReply(upgradeUrl: string): string {
  return `⚠️ Batas Kuota Tercapai!
Akun Anda berada di paket Starter dengan batas 50 transaksi per bulan.

Kuota bulan ini sudah habis. Untuk mencatat tanpa batas dan menikmati fitur Pro seperti scan struk foto & AI Financial Advisor, yuk upgrade ke Pro!

🚀 Upgrade ke Pro hanya Rp99.000 sekali bayar:
${upgradeUrl}`;
}

/**
 * Format Pro Only Feature message (Part 4.2)
 */
export function formatProOnlyReceiptReply(upgradeUrl: string): string {
  return `📸 Fitur Scan Struk Khusus Pro!
Fitur ekstraksi foto struk otomatis dengan AI Vision hanya tersedia untuk pengguna paket Pro TataDana.

Nikmati pencatatan instan tanpa ketik, unlimited transaksi, laporan PDF/Excel, dan AI Advisor seumur hidup!

⭐ Upgrade ke Pro (Rp99.000 Sekali Bayar):
${upgradeUrl}`;
}

/**
 * Format Help Command response (Part 4.6)
 */
export function formatHelpReply(botName: string = "TataDana"): string {
  return `👋 Selamat datang di ${botName}!
Aplikasi pencatat keuangan semudah chat Telegram.

📝 CARA MENCATAT:
• Pengeluaran: "beli nasi padang 25rb"
• Pemasukan: "gajian 6jt"
• Nominal fleksibel: 15rb, 500k, 1.5jt, 25.000
• Voice Note: Kirim rekaman suara durasi < 60 detik!
• Foto Struk (Paket Pro): Kirim foto struk belanjaanmu

📌 DAFTAR PERINTAH (COMMANDS):
/saldo — Cek saldo semua dompet
/hari_ini — Rekap transaksi hari ini
/minggu_ini — Rekap transaksi 7 hari terakhir
/bulan_ini — Rekap & breakdown bulan ini
/budget — Status & sisa budget kategori
/sheet — Link dashboard & export laporan
/bantuan — Panduan penggunaan ini`;
}
