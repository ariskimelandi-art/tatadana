import { parseIndonesianCurrency } from "@/lib/utils/currency";
import { ChatQuickAction } from "@/lib/types";
import { UserFinancialContext } from "@/lib/financial-context";

export interface KnowledgeResponse {
  content: string;
  quickActions?: ChatQuickAction[];
}

export function generateKnowledgeResponse(
  userMessage: string,
  context?: UserFinancialContext
): KnowledgeResponse {
  const query = userMessage.trim().toLowerCase();

  // Use provided context or standard default
  const ctx: UserFinancialContext = context || {
    totalBalance: 9650000,
    totalIncome: 14500000,
    totalExpense: 4850000,
    netSavings: 9650000,
    monthlyBudget: 15000000,
    remainingBudget: 10150000,
    savingsRate: 66.5,
    todayExpense: 45000,
    dailyBudgetLimit: 150000,
    todayTransactions: [
      {
        type: "expense",
        amount: 45000,
        description: "Makan Siang Nasi Padang Rendang",
        category: "🍜 Makanan & Minuman",
        time: "12:30 WIB",
      },
    ],
    topCategories: [
      { name: "Makanan & Minuman", amount: 1850000, percentage: 38.1, icon: "🍜" },
      { name: "Tagihan & Utilitas", amount: 950000, percentage: 19.6, icon: "🏠" },
      { name: "Belanja Kebutuhan", amount: 800000, percentage: 16.5, icon: "👕" },
      { name: "Transportasi", amount: 650000, percentage: 13.4, icon: "🚗" },
      { name: "Hiburan & Hobi", amount: 600000, percentage: 12.4, icon: "🎮" },
    ],
    recentTransactions: [
      { type: "expense", amount: 45000, description: "Makan Siang Nasi Padang Rendang", category: "🍜 Makanan & Minuman", date: "Hari ini, 12:30 WIB" },
      { type: "expense", amount: 285000, description: "Belanja Supermarket Hypermart", category: "👕 Belanja Kebutuhan", date: "Kemarin, 19:15 WIB" },
      { type: "income", amount: 14500000, description: "Gaji Pokok Oktober 2026", category: "💰 Gaji Pokok", date: "25 Okt 2026" },
      { type: "expense", amount: 50000, description: "Bensin Motor Pertamax", category: "🚗 Transportasi", date: "24 Okt 2026" },
      { type: "expense", amount: 350000, description: "Tagihan WiFi Indihome", category: "🏠 Tagihan & Utilitas", date: "20 Okt 2026" },
    ],
    wallets: [
      { name: "Rekening BCA", type: "bank", balance: 8400000 },
      { name: "Dompet Utama (Cash)", type: "cash", balance: 1250000 },
    ],
  };

  const topCategoryStr = ctx.topCategories[0]
    ? `${ctx.topCategories[0].name} (Rp ${ctx.topCategories[0].amount.toLocaleString("id-ID")})`
    : "Makanan & Minuman";

  const remainingDaily = Math.max(0, ctx.dailyBudgetLimit - ctx.todayExpense);

  // =========================================================================
  // 1. USER MENGAKU BELUM KELUAR UANG / NO-SPEND DAY
  // =========================================================================
  if (/belum keluar uang|belum jajan|belum beli apa|belum ada pengeluaran|0 rupiah|nol rupiah|belum makan|puasa/i.test(query)) {
    return {
      content: `Wah luar biasa! 🏆 **Hari Ini Anda Belum Mengeluarkan Uang Sama Sekali (No-Spend Day)!**

Menahan pengeluaran harian dan tidak jajan impulsif adalah salah satu kunci paling ampuh agar saldo tabungan Anda cepat bertambah.

📊 **Status Harian Anda:**
- Pengeluaran hari ini: **Rp 0**
- Batas aman harian Anda: **Rp ${ctx.dailyBudgetLimit.toLocaleString("id-ID")}/hari**
- Saldo aktif tetap aman: **Rp ${ctx.totalBalance.toLocaleString("id-ID")}**

Nanti kalau Anda makan malam atau ada kebutuhan mendesak, langsung kabari saya ya biar kita rekap bareng! 👍`,
      quickActions: [
        { label: "🍜 Tadi Makan Malam 25rb", action: "makan_malam_25" },
        { label: "☕ Jajan Kopi 20rb", action: "ngopi_20" },
        { label: "📉 Cek Pengeluaran Bulan Ini", action: "cek_pengeluaran" },
      ],
    };
  }

  // =========================================================================
  // 2. USER MENJAWAB MAKAN APA / PENGELUARAN MAKAN & JAJAN HARI INI
  // =========================================================================
  const isMealOrDailySpend =
    /makan|sarapan|lunch|dinner|ngopi|kopi|jajan|bensin|snack|bakso|mie|ayam|nasi|soto|sate|martabak|geprek|seblak|gofood|grabfood|shopeefood/i.test(
      query
    );

  if (isMealOrDailySpend) {
    let nominal = 0;
    const allMatches = Array.from(query.matchAll(/(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)/gi));
    if (allMatches.length > 0) {
      allMatches.forEach((match) => {
        const val = parseFloat(match[1].replace(",", "."));
        const unit = match[2].toLowerCase();
        if (unit.startsWith("jt") || unit.startsWith("juta")) nominal += Math.round(val * 1000000);
        else if (unit.startsWith("rb") || unit.startsWith("ribu") || unit === "k")
          nominal += Math.round(val * 1000);
      });
    } else {
      const directNum = query.match(/\b([1-9]\d{2,6})\b/);
      if (directNum) nominal = parseInt(directNum[1], 10);
    }

    if (nominal > 0) {
      const newTodayExpense = ctx.todayExpense + nominal;
      const isUnderBudget = newTodayExpense <= ctx.dailyBudgetLimit;
      const sisaHarian = Math.max(0, ctx.dailyBudgetLimit - newTodayExpense);

      return {
        content: `Wah mantap, menu yang nikmat! 🍽️

Saya hitungkan pengeluaran Anda untuk **"${userMessage}"**:
- 💸 **Nominal:** **Rp ${nominal.toLocaleString("id-ID")}**
- 📊 **Total Pengeluaran Hari Ini Jadi:** **Rp ${newTodayExpense.toLocaleString("id-ID")}** *(sebelumnya Rp ${ctx.todayExpense.toLocaleString("id-ID")})*
- 🎯 **Target Batas Harian:** **Rp ${ctx.dailyBudgetLimit.toLocaleString("id-ID")}/hari**
- 🛡️ **Status Hari Ini:** ${
          isUnderBudget
            ? `🟢 **Sangat Aman!** Masih ada sisa kuota **Rp ${sisaHarian.toLocaleString("id-ID")}** untuk jajan atau makan malam.`
            : `🟡 **Perhatian:** Hari ini pengeluaran Anda sedikit melampaui target harian Rp ${ctx.dailyBudgetLimit.toLocaleString(
                "id-ID"
              )}. Besok coba bawa bekal atau pilih menu hemat ya!`
        }

Tadi selain makan ini, apakah ada pengeluaran lain hari ini? Misalnya beli bensin, bayar parkir, atau ngopi?`,
        quickActions: [
          { label: "➕ Simpan Transaksi Ini", href: "/transaksi" },
          { label: "☕ Ada Jajan Kopi 20rb", action: "ngopi_20" },
          { label: "🚗 Ada Beli Bensin 25rb", action: "bensin_25" },
          { label: "✅ Sudah Cukup Hari Ini", action: "sudah_cukup" },
        ],
      };
    } else {
      // User mentions what they ate without mentioning price
      return {
        content: `Kelihatannya enak banget tuh! 🍲

Ngomong-ngomong, tadi **habis berapa rupiah** untuk menu tersebut? 
Berapa total yang Anda keluarkan hari ini untuk makan dan jajan?

Ketik saja misalnya: *"makan tadi 25rb"* atau *"habis 30 ribu"*, biar langsung saya hitungkan apakah masih masuk batas aman harian Anda (**Rp ${ctx.dailyBudgetLimit.toLocaleString(
          "id-ID"
        )}/hari**)!`,
        quickActions: [
          { label: "🍜 Tadi Habis 25rb", action: "makan_25" },
          { label: "🍛 Tadi Habis 35rb", action: "makan_35" },
          { label: "🥤 Ditraktir Teman (Gratis)", action: "ditraktir" },
        ],
      };
    }
  }

  // =========================================================================
  // 3. USER MENANYAKAN PENGELUARAN HARI INI / REKAP HARI INI
  // =========================================================================
  if (/hari ini|harian|pengeluaran hari ini|rekap hari ini|keluar berapa hari ini|tadi keluar berapa/i.test(query)) {
    const todayList = ctx.todayTransactions
      .map(
        (t, idx) =>
          `${idx + 1}. **${t.description}**: Rp ${t.amount.toLocaleString("id-ID")} (${t.time || "Hari ini"})`
      )
      .join("\n");

    return {
      content: `📅 **Rekap Pengeluaran Anda Hari Ini:**

- 💸 **Total Uang Keluar Hari Ini:** **Rp ${ctx.todayExpense.toLocaleString("id-ID")}**
- 🎯 **Batas Aman Harian:** **Rp ${ctx.dailyBudgetLimit.toLocaleString("id-ID")}/hari**
- 🟢 **Sisa Kuota Harian:** **Rp ${remainingDaily.toLocaleString("id-ID")}**

📌 **Transaksi yang Tercatat Hari Ini:**
${todayList || "- Belum ada transaksi yang tercatat hari ini"}

🍽️ **Pertanyaan DanaBot untuk Anda:**
Bagaimana dengan makan siang atau makan malam hari ini? Tadi makan apa saja dan berapa biayanya? Ada jajan kopi atau bayar bensin juga?`,
      quickActions: [
        { label: "🍜 Tadi Makan Siang 25rb", action: "makan_25" },
        { label: "☕ Jajan Kopi 20rb", action: "ngopi_20" },
        { label: "🚗 Beli Bensin 25rb", action: "bensin_25" },
        { label: "✨ Belum Keluar Uang Sama Sekali", action: "belum_keluar" },
      ],
    };
  }

  // =========================================================================
  // 4. GREETINGS & PROACTIVE DAILY EXPENSE INQUIRY (WHEN OPENING CHATBOT)
  // =========================================================================
  if (/^(halo|hai|hi|hey|helo|assalamu|pagi|siang|sore|malam|ping|p\b)/i.test(query)) {
    return {
      content: `Halo! 👋 Gimana harinya? Yuk kita cek pengeluaran hari ini!

🍽️ **Berapa total pengeluaran Anda hari ini?**
Tadi makan apa saja untuk siang atau malam ini? Ada jajan kopi, beli bensin, atau bayar parkir yang belum dicatat?

📊 **Catatan Pengeluaran Hari Ini:**
- Uang keluar hari ini: **Rp ${ctx.todayExpense.toLocaleString("id-ID")}** *(Makan Siang Nasi Padang Rendang)*
- Batas aman harian Anda: **Rp ${ctx.dailyBudgetLimit.toLocaleString("id-ID")}/hari**
- Sisa kuota aman hari ini: **Rp ${remainingDaily.toLocaleString("id-ID")}** 🟢

Ceritakan apa saja yang sudah Anda belanjakan hari ini, biar saya bantu rekapkan dan evaluasi! 😊`,
      quickActions: [
        { label: "🍜 Tadi Makan Siang 25rb", action: "makan_25" },
        { label: "☕ Jajan Kopi 20rb", action: "ngopi_20" },
        { label: "🚗 Beli Bensin 25rb", action: "bensin_25" },
        { label: "✨ Hari Ini Belum Keluar Uang", action: "belum_keluar" },
      ],
    };
  }

  // =========================================================================
  // 5. EVALUASI / CASHFLOW / APAKAH SAYA BOROS
  // =========================================================================
  if (
    /evaluasi|apakah.*boros|boroskah|apakah.*sehat|kondisi keuangan|cashflow|kesehatan keuangan|analisis.*keuangan|analisa.*keuangan/i.test(
      query
    )
  ) {
    const isHealthy = ctx.totalExpense < ctx.totalIncome * 0.7;

    return {
      content: `⚖️ **Check-Up Kesehatan Keuangan Anda:**

- 💰 **Pemasukan Bulan Ini:** Rp ${ctx.totalIncome.toLocaleString("id-ID")}
- 💸 **Total Pengeluaran:** Rp ${ctx.totalExpense.toLocaleString("id-ID")}
- 📅 **Rata-rata Pengeluaran per Hari:** ~Rp ${Math.round(ctx.totalExpense / 25).toLocaleString("id-ID")}/hari
- 📈 **Net Cashflow (Surplus):** **+Rp ${ctx.netSavings.toLocaleString("id-ID")}**
- 🛡️ **Rasio Tabungan:** **${ctx.savingsRate}%** (Kategori: ${
        isHealthy ? "🟢 SANGAT SEHAT" : "🟡 PERLU PERHATIAN"
      })

📋 **Diagnosa Pengeluaran Harian:**
Pengeluaran harian Anda rata-rata sangat terkendali. Hari ini Anda mengeluarkan **Rp ${ctx.todayExpense.toLocaleString(
        "id-ID"
      )}**, masih di bawah batas aman harian Rp ${ctx.dailyBudgetLimit.toLocaleString("id-ID")}. Pertahankan pola makan dan jajan hemat ini!`,
      quickActions: [
        { label: "📅 Rekap Pengeluaran Hari Ini", action: "pengeluaran_hari_ini" },
        { label: "📊 Lihat Laporan Keuangan", href: "/laporan" },
      ],
    };
  }

  // =========================================================================
  // 6. PEMASUKAN USER (USER INCOME INQUIRY)
  // =========================================================================
  if (/pemasukan|uang masuk|income|penghasilan saya|gaji saya berapa|total pemasukan/i.test(query)) {
    return {
      content: `📊 **Laporan Pemasukan Anda Bulan Ini:**

- 💰 **Total Pemasukan:** **Rp ${ctx.totalIncome.toLocaleString("id-ID")}**
- 📈 **Status Arus Kas:** **Surplus Rp ${ctx.netSavings.toLocaleString("id-ID")}** setelah dikurangi pengeluaran.
- 🎯 **Tingkat Tabungan (Savings Rate):** **${ctx.savingsRate}%** dari total pemasukan Anda berhasil diselamatkan sebagai tabungan/investasi!

💡 **Analisis Harian:**
Dari pemasukan ini, jatah pengeluaran aman Anda per hari adalah sekitar **Rp ${ctx.dailyBudgetLimit.toLocaleString(
        "id-ID"
      )}/hari**. Hari ini Anda baru menggunakan **Rp ${ctx.todayExpense.toLocaleString("id-ID")}**, sangat hemat!`,
      quickActions: [
        { label: "📅 Cek Pengeluaran Hari Ini", action: "pengeluaran_hari_ini" },
        { label: "📉 Cek Pengeluaran Bulan Ini", action: "cek_pengeluaran" },
        { label: "💳 Cek Saldo Dompet", action: "cek_saldo" },
      ],
    };
  }

  // =========================================================================
  // 7. PENGELUARAN USER BULANAN
  // =========================================================================
  if (/pengeluaran|uang keluar|biaya|habis berapa|total pengeluaran|belanja berapa/i.test(query)) {
    const categoryLines = ctx.topCategories
      .map(
        (c, idx) =>
          `${idx + 1}. **${c.name}:** Rp ${c.amount.toLocaleString("id-ID")} (${c.percentage}%)`
      )
      .join("\n");

    return {
      content: `📉 **Rincian Pengeluaran Anda:**

- 📅 **Hari Ini:** **Rp ${ctx.todayExpense.toLocaleString("id-ID")}** *(Batas aman: Rp ${ctx.dailyBudgetLimit.toLocaleString(
        "id-ID"
      )})*
- 💸 **Total Bulan Ini:** **Rp ${ctx.totalExpense.toLocaleString("id-ID")}**
- 🎯 **Sisa Budget Bulanan:** **Rp ${ctx.remainingBudget.toLocaleString("id-ID")}** dari total limit Rp ${ctx.monthlyBudget.toLocaleString("id-ID")}.

📌 **Kategori Pengeluaran Terbesar Anda:**
${categoryLines}

Tadi Anda sudah makan siang atau jajan kopi? Berapa biayanya? Biar saya bantu update catatan hari ini!`,
      quickActions: [
        { label: "🍜 Tadi Makan Siang 25rb", action: "makan_25" },
        { label: "☕ Jajan Kopi 20rb", action: "ngopi_20" },
        { label: "🎯 Atur Limit di Menu Budget", href: "/budget" },
      ],
    };
  }

  // =========================================================================
  // 8. SALDO & DOMPET (USER BALANCE & WALLETS)
  // =========================================================================
  if (/saldo|sisa uang|uang saya|kas|balance|isi dompet|rekening|sisa saldo/i.test(query)) {
    const walletLines = ctx.wallets
      .map((w) => `- 🏦 **${w.name}:** Rp ${w.balance.toLocaleString("id-ID")}`)
      .join("\n");

    return {
      content: `💳 **Ringkasan Saldo & Dompet Anda:**

- 💎 **Total Saldo Aktif:** **Rp ${ctx.totalBalance.toLocaleString("id-ID")}**

📌 **Rincian Saldo per Rekening / Dompet:**
${walletLines}

💡 **Tips Harian:**
Dengan pengeluaran hari ini sebesar **Rp ${ctx.todayExpense.toLocaleString("id-ID")}**, saldo kas Anda masih sangat tebal dan terjaga dengan baik!`,
      quickActions: [
        { label: "💼 Kelola di Menu Wallet", href: "/wallet" },
        { label: "📅 Rekap Hari Ini", action: "pengeluaran_hari_ini" },
      ],
    };
  }

  // =========================================================================
  // 9. RIWAYAT TRANSAKSI TERAKHIR
  // =========================================================================
  if (/transaksi terakhir|riwayat transaksi|terakhir beli apa|daftar transaksi|riwayat/i.test(query)) {
    const txList = ctx.recentTransactions
      .map(
        (t, idx) =>
          `${idx + 1}. **[${t.type === "income" ? "🟢 Pemasukan" : "🔴 Pengeluaran"}]** ${
            t.description
          }\n   Nominal: **Rp ${t.amount.toLocaleString("id-ID")}** (${t.category || "-"}) • ${
            t.date
          }`
      )
      .join("\n\n");

    return {
      content: `📝 **5 Transaksi Terakhir yang Tercatat:**\n\n${txList}\n\nAda transaksi lain hari ini yang belum dicatat? Misalnya makan, bensin, atau ngopi?`,
      quickActions: [
        { label: "🍜 Tadi Makan Siang 25rb", action: "makan_25" },
        { label: "➕ Tambah Transaksi", href: "/transaksi" },
      ],
    };
  }

  // =========================================================================
  // 10. DEFAULT CONTEXTUAL RESPONSE
  // =========================================================================
  return {
    content: `Pertanyaan yang bagus mengenai **"${userMessage}"**!

Terkait pengeluaran hari ini:
- 🍽️ **Pengeluaran Hari Ini:** **Rp ${ctx.todayExpense.toLocaleString("id-ID")}**
- 🎯 **Batas Harian Aman:** Rp ${ctx.dailyBudgetLimit.toLocaleString("id-ID")}/hari
- 🟢 **Sisa Kuota Harian:** Rp ${remainingDaily.toLocaleString("id-ID")}

Tadi Anda sudah makan siang atau makan malam? Habis berapa rupiah hari ini untuk makan atau jajan? Ceritakan ke saya ya!`,
    quickActions: [
      { label: "🍜 Tadi Makan Siang 25rb", action: "makan_25" },
      { label: "☕ Jajan Kopi 20rb", action: "ngopi_20" },
      { label: "🚗 Beli Bensin 25rb", action: "bensin_25" },
      { label: "📅 Rekap Pengeluaran Hari Ini", action: "pengeluaran_hari_ini" },
    ],
  };
}
