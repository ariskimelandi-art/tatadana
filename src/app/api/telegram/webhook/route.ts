import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { TelegramBot } from "@/lib/telegram/bot";
import { AIRouter } from "@/lib/ai/router";
import {
  formatExpenseReply,
  formatIncomeReply,
  formatTransferReply,
  formatAdvisorReply,
  formatLimitReachedReply,
  formatProOnlyReceiptReply,
  formatHelpReply,
  createProgressBar,
} from "@/lib/telegram/formatter";
import { formatRupiah } from "@/lib/utils/currency";

export const maxDuration = 60; // Allow sufficient time for AI transcription/OCR if needed

export async function POST(req: NextRequest) {
  const supabase = getAdminClient();
  const bot = new TelegramBot();

  try {
    const body = await req.json();
    const updateId = body.update_id;

    if (!updateId) {
      return NextResponse.json({ ok: false, error: "Missing update_id" }, { status: 400 });
    }

    // 1. IDEMPOTENCY CHECK (WAJIB - mencegah duplikasi akibat retry Telegram)
    const { data: existingIdempotency } = await supabase
      .from("telegram_idempotency")
      .select("update_id")
      .eq("update_id", updateId)
      .maybeSingle();

    if (existingIdempotency) {
      return NextResponse.json({ ok: true, message: "Duplicate update_id ignored" });
    }

    // Record idempotency immediately
    await supabase.from("telegram_idempotency").insert({
      update_id: updateId,
      chat_id: body.message?.chat?.id || null,
      command: body.message?.text?.slice(0, 50) || "non-text",
      status: "processing",
    });

    const message = body.message;
    if (!message) {
      return NextResponse.json({ ok: true, message: "No message payload" });
    }

    const chatId = message.chat.id;
    const text: string = (message.text || "").trim();
    const fromUsername = message.from?.username || "";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tatadana.id";

    // 2. USER LOOKUP OR LINKING
    let { data: profile } = await supabase
      .from("profiles")
      .select("*, default_wallet:default_wallet_id(*)")
      .eq("telegram_chat_id", chatId)
      .maybeSingle();

    // Handle /start with deep link token e.g. "/start link_abc123"
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const token = parts[1]?.trim();

      if (token) {
        // Find user by link token
        const { data: foundProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("telegram_link_token", token)
          .maybeSingle();

        if (foundProfile) {
          await supabase
            .from("profiles")
            .update({
              telegram_chat_id: chatId,
              telegram_username: fromUsername,
            })
            .eq("id", foundProfile.id);

          await bot.sendMessage(
            chatId,
            `🎉 Berhasil terhubung!\n\nHalo ${foundProfile.full_name}, akun TataDana kamu sekarang resmi tersambung dengan Telegram ini.\n\nKamu sudah bisa langsung mencatat pengeluaran atau pemasukan, contoh:\n• "beli sate 25rb"\n• "gajian 5jt"\n• Atau kirim Voice Note!\n\nKetik /bantuan untuk melihat semua perintah.`
          );
          return NextResponse.json({ ok: true });
        }
      }
    }

    // Handle Contact Sharing for phone verification & linking
    if (message.contact && message.contact.phone_number) {
      let rawPhone = message.contact.phone_number.replace(/\D/g, "");
      if (rawPhone.startsWith("0")) rawPhone = "62" + rawPhone.slice(1);
      if (!rawPhone.startsWith("62")) rawPhone = "62" + rawPhone;

      const { data: phoneUser } = await supabase
        .from("profiles")
        .select("*")
        .eq("phone_number", rawPhone)
        .maybeSingle();

      if (phoneUser) {
        await supabase
          .from("profiles")
          .update({
            telegram_chat_id: chatId,
            telegram_username: fromUsername,
            phone_verified: true,
          })
          .eq("id", phoneUser.id);

        await bot.sendMessage(
          chatId,
          `✅ Kontak Terverifikasi!\nHalo ${phoneUser.full_name}, nomor HP Anda berhasil dicocokkan dan akun TataDana Anda kini aktif di bot ini.\n\nSilakan coba catat transaksi pertamamu sekarang! 🚀`
        );
        return NextResponse.json({ ok: true });
      }
    }

    // If profile is not found, user is not linked yet
    if (!profile) {
      const linkMsg = `👋 Halo! Akun Telegram kamu belum terhubung dengan akun TataDana.\n\nUntuk menghubungkan:\n1. Buka dashboard di: ${appUrl}/settings\n2. Buka tab Telegram Bot & klik tombol hubungkan\n3. Atau bagikan kontak nomor HP Anda yang terdaftar via tombol di bawah.`;
      
      await bot.sendMessage(chatId, linkMsg, {
        reply_markup: {
          keyboard: [
            [{ text: "📱 Bagikan Kontak untuk Verifikasi", request_contact: true }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      });
      return NextResponse.json({ ok: true });
    }

    // 3. BOT COMMANDS HANDLING (Part 4.6)
    const normalizedText = text.toLowerCase();
    
    if (normalizedText === "/bantuan" || normalizedText === "/help") {
      await bot.sendMessage(chatId, formatHelpReply("TataDana"));
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === "/saldo") {
      const { data: wallets } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", profile.id)
        .order("is_default", { ascending: false });

      if (!wallets || wallets.length === 0) {
        await bot.sendMessage(chatId, "👛 Belum ada dompet tercatat di akunmu.");
        return NextResponse.json({ ok: true });
      }

      let totalSaldo = 0;
      let reply = `👛 Saldo Dompet TataDana:\n\n`;
      wallets.forEach((w) => {
        totalSaldo += Number(w.balance);
        reply += `${w.is_default ? "⭐ " : "• "}${w.name}: ${formatRupiah(w.balance)}\n`;
      });
      reply += `\n━━━━━━━━━━━━━━━\n💰 Total Kekayaan: ${formatRupiah(totalSaldo)}`;
      await bot.sendMessage(chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === "/hari ini" || normalizedText === "/hari_ini") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: txs } = await supabase
        .from("transactions")
        .select("*, category:category_id(*)")
        .eq("user_id", profile.id)
        .gte("transaction_date", todayStart.toISOString());

      let totalIn = 0;
      let totalOut = 0;
      let txList = "";

      (txs || []).forEach((t) => {
        if (t.type === "expense") {
          totalOut += Number(t.amount);
          txList += `🔴 -${formatRupiah(t.amount)} (${t.category?.name || "Lainnya"}) - ${t.description || ""}\n`;
        } else if (t.type === "income") {
          totalIn += Number(t.amount);
          txList += `🟢 +${formatRupiah(t.amount)} (${t.category?.name || "Pemasukan"}) - ${t.description || ""}\n`;
        }
      });

      let reply = `📊 Rekap Transaksi Hari Ini:\n\n${txList || "Belum ada transaksi hari ini.\n"}\n━━━━━━━━━━━━━━━\n🟢 Total Masuk: ${formatRupiah(totalIn)}\n🔴 Total Keluar: ${formatRupiah(totalOut)}\n⚖️ Net: ${formatRupiah(totalIn - totalOut)}`;
      await bot.sendMessage(chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === "/minggu ini" || normalizedText === "/minggu_ini") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: txs } = await supabase
        .from("transactions")
        .select("*, category:category_id(*)")
        .eq("user_id", profile.id)
        .gte("transaction_date", sevenDaysAgo.toISOString())
        .order("transaction_date", { ascending: false });

      let totalIn = 0;
      let totalOut = 0;
      const recentTxs: string[] = [];

      (txs || []).forEach((t, idx) => {
        if (t.type === "expense") {
          totalOut += Number(t.amount);
          if (idx < 5) recentTxs.push(`🔴 -${formatRupiah(t.amount)} (${t.category?.name || "Lainnya"}) - ${t.description || ""}`);
        } else if (t.type === "income") {
          totalIn += Number(t.amount);
          if (idx < 5) recentTxs.push(`🟢 +${formatRupiah(t.amount)} (${t.category?.name || "Pemasukan"}) - ${t.description || ""}`);
        }
      });

      let reply = `📅 Rekap 7 Hari Terakhir:\n\n` +
        `🟢 Total Pemasukan: ${formatRupiah(totalIn)}\n` +
        `🔴 Total Pengeluaran: ${formatRupiah(totalOut)}\n` +
        `⚖️ Net Cashflow: ${formatRupiah(totalIn - totalOut)}\n\n` +
        `📝 Transaksi Terbaru:\n${recentTxs.length > 0 ? recentTxs.join("\n") : "Tidak ada transaksi dalam 7 hari terakhir."}\n\n` +
        `📊 Buka ${appUrl}/laporan untuk laporan lengkap.`;

      await bot.sendMessage(chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === "/bulan ini" || normalizedText === "/bulan_ini") {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: txs } = await supabase
        .from("transactions")
        .select("*, category:category_id(*)")
        .eq("user_id", profile.id)
        .gte("transaction_date", monthStart);

      let totalIn = 0;
      let totalOut = 0;
      const catMap: Record<string, { name: string; icon: string; amount: number }> = {};

      (txs || []).forEach((t) => {
        if (t.type === "expense") {
          totalOut += Number(t.amount);
          const cName = t.category?.name || "Lainnya";
          const cIcon = t.category?.icon || "🏷️";
          if (!catMap[cName]) catMap[cName] = { name: cName, icon: cIcon, amount: 0 };
          catMap[cName].amount += Number(t.amount);
        } else if (t.type === "income") {
          totalIn += Number(t.amount);
        }
      });

      const sortedCats = Object.values(catMap).sort((a, b) => b.amount - a.amount).slice(0, 5);
      let catBreakdown = "";
      sortedCats.forEach((c) => {
        const pct = totalOut > 0 ? Math.round((c.amount / totalOut) * 100) : 0;
        catBreakdown += `${c.icon} ${c.name}: ${formatRupiah(c.amount)} (${pct}%)\n`;
      });

      let reply = `🗓️ Rekap Bulan Ini (${now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}):\n\n` +
        `🟢 Total Pemasukan: ${formatRupiah(totalIn)}\n` +
        `🔴 Total Pengeluaran: ${formatRupiah(totalOut)}\n` +
        `⚖️ Selisih (Net): ${formatRupiah(totalIn - totalOut)}\n\n` +
        `🏆 Top Pengeluaran per Kategori:\n${catBreakdown || "Belum ada pengeluaran bulan ini.\n"}\n` +
        `🎯 Cek detail budget dengan /budget`;

      await bot.sendMessage(chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === "/budget") {
      const now = new Date();
      const curMonth = now.getMonth() + 1;
      const curYear = now.getFullYear();

      const { data: budgets } = await supabase
        .from("budgets")
        .select("*, category:category_id(*)")
        .eq("user_id", profile.id)
        .eq("month", curMonth)
        .eq("year", curYear);

      if (!budgets || budgets.length === 0) {
        await bot.sendMessage(chatId, `🎯 Belum ada budget yang diatur bulan ini.\nAtur budget bulananmu di dashboard web: ${appUrl}/budget`);
        return NextResponse.json({ ok: true });
      }

      // Calculate spending per category
      const monthStart = new Date(curYear, curMonth - 1, 1).toISOString();
      const { data: monthlyTxs } = await supabase
        .from("transactions")
        .select("category_id, amount")
        .eq("user_id", profile.id)
        .eq("type", "expense")
        .gte("transaction_date", monthStart);

      const spendingMap: Record<string, number> = {};
      (monthlyTxs || []).forEach(tx => {
        if (tx.category_id) {
          spendingMap[tx.category_id] = (spendingMap[tx.category_id] || 0) + Number(tx.amount);
        }
      });

      let reply = `🎯 Status Budget Bulan Ini:\n\n`;
      budgets.forEach(b => {
        const spent = spendingMap[b.category_id] || 0;
        const limit = Number(b.monthly_limit);
        const pct = limit > 0 ? (spent / limit) * 100 : 0;
        const remaining = Math.max(0, limit - spent);
        const bar = createProgressBar(pct, 8);

        reply += `${b.category?.icon || "🏷️"} ${b.category?.name || "Kategori"}\n`;
        reply += `${bar} ${formatRupiah(spent)} / ${formatRupiah(limit)} (sisa ${formatRupiah(remaining)})\n\n`;
      });

      await bot.sendMessage(chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (normalizedText === "/sheet") {
      await bot.sendMessage(
        chatId,
        `📊 Akses Laporan & Dashboard TataDana kamu di:\n${appUrl}/laporan\n\nKamu bisa filter tanggal, lihat rincian struk, dan download file PDF / Excel on-demand!`
      );
      return NextResponse.json({ ok: true });
    }

    // 4. PLAN LIMIT CHECK (Part 4.9)
    if (profile.plan === "starter") {
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      let count = profile.monthly_tx_count;
      if (profile.last_tx_month !== currentMonthStr) {
        count = 0;
      }

      if (count >= 50) {
        await bot.sendMessage(chatId, formatLimitReachedReply(`${appUrl}/settings?tab=subscription`));
        return NextResponse.json({ ok: true });
      }
    }

    // 5. PHOTO RECEIPT OCR (Part 4.2 - Pro Only)
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      if (profile.plan === "starter") {
        await bot.sendMessage(chatId, formatProOnlyReceiptReply(`${appUrl}/settings?tab=subscription`));
        return NextResponse.json({ ok: true });
      }

      // Pro User: Process photo
      await bot.sendMessage(chatId, "🔍 Menganalisis foto struk dengan AI Vision...");

      const highestPhoto = message.photo[message.photo.length - 1];
      const downloaded = await bot.downloadFile(highestPhoto.file_id);

      if (!downloaded) {
        await bot.sendMessage(chatId, "❌ Gagal mengunduh foto struk dari Telegram. Silakan coba kirim ulang.");
        return NextResponse.json({ ok: true });
      }

      const ocrResult = await AIRouter.ocrReceipt(downloaded.buffer, downloaded.mimeType, profile.id);
      
      // Default wallet
      const { data: defaultWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", profile.id)
        .order("is_default", { ascending: false })
        .limit(1)
        .single();

      if (!defaultWallet) {
        await bot.sendMessage(chatId, "⚠️ Belum ada dompet aktif di akun Anda. Buat dompet dulu di dashboard.");
        return NextResponse.json({ ok: true });
      }

      // Find or assign Belanja/Makanan category
      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", profile.id)
        .ilike("name", "%belanja%")
        .maybeSingle();

      const { data: insertedTx } = await supabase
        .from("transactions")
        .insert({
          user_id: profile.id,
          wallet_id: defaultWallet.id,
          category_id: cat?.id || null,
          type: "expense",
          amount: ocrResult.total,
          description: `Struk belanja di ${ocrResult.merchant}`,
          receipt_items: ocrResult.items || [],
          is_receipt_parent: true,
          source: "telegram_receipt",
        })
        .select()
        .single();

      const newBalance = Number(defaultWallet.balance) - Number(ocrResult.total);

      let itemsSummary = "";
      (ocrResult.items || []).slice(0, 5).forEach((item) => {
        itemsSummary += `• ${item.name} (${item.qty}x) = ${formatRupiah(item.total)}\n`;
      });
      if ((ocrResult.items || []).length > 5) {
        itemsSummary += `• ...dan ${ocrResult.items.length - 5} item lainnya (lihat di dashboard)\n`;
      }

      const reply = `🧾 Struk Berhasil Dicatat!\n` +
        `├ Merchant : ${ocrResult.merchant}\n` +
        `├ Total : ${formatRupiah(ocrResult.total)}\n` +
        `├ Dompet : 👛 ${defaultWallet.name}\n` +
        `└ Saldo Sisa : ${formatRupiah(newBalance)}\n\n` +
        `📦 Rincian Item:\n${itemsSummary}\n` +
        `📊 Buka ${appUrl}/laporan untuk melihat detail lengkap struk ini.`;

      await bot.sendMessage(chatId, reply);
      return NextResponse.json({ ok: true });
    }

    // 6. VOICE NOTE / AUDIO PROCESSING (Part 4.3)
    let processingText = text;
    let voiceTranscription: string | undefined = undefined;

    if (message.voice || message.audio) {
      const voiceObj = message.voice || message.audio;
      if (voiceObj.duration && voiceObj.duration > 60) {
        await bot.sendMessage(chatId, "⏳ Rekaman suara maksimal 60 detik ya. Silakan kirim voice note yang lebih singkat.");
        return NextResponse.json({ ok: true });
      }

      await bot.sendMessage(chatId, "🎙️ Mendengarkan voice note...");
      const downloaded = await bot.downloadFile(voiceObj.file_id);
      if (downloaded) {
        voiceTranscription = await AIRouter.transcribeVoice(downloaded.buffer, downloaded.mimeType, profile.id);
        processingText = voiceTranscription;
      } else {
        await bot.sendMessage(chatId, "❌ Gagal memproses rekaman suara. Silakan coba lagi atau ketik secara manual.");
        return NextResponse.json({ ok: true });
      }
    }

    if (!processingText || processingText.trim().length === 0) {
      return NextResponse.json({ ok: true });
    }

    // 7. PARSE TRANSACTION VIA AI ROUTER (Part 4.1)
    const { data: userCategories } = await supabase
      .from("categories")
      .select("id, name, icon")
      .or(`user_id.eq.${profile.id},user_id.is.null`);

    const categoryNames = (userCategories || []).map((c) => c.name);
    const parsed = await AIRouter.parseTransaction(processingText, categoryNames, profile.id);

    if (parsed.is_ambiguous || !parsed.nominal || parsed.nominal <= 0) {
      await bot.sendMessage(
        chatId,
        `⚠️ Maaf, saya belum paham transaksi tersebut.\n\nContoh yang bisa saya catat:\n• "beli soto ayam 20rb"\n• "kopi susu 18k"\n• "gajian 5.5jt"\n• "bayar listrik 250rb"\n\nAtau ketik /bantuan untuk petunjuk lengkap.`
      );
      return NextResponse.json({ ok: true });
    }

    // 8. RESOLVE WALLETS
    const { data: userWallets } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", profile.id)
      .order("is_default", { ascending: false });

    if (!userWallets || userWallets.length === 0) {
      await bot.sendMessage(chatId, "⚠️ Anda belum memiliki dompet. Silakan login ke dashboard untuk menyiapkan dompet.");
      return NextResponse.json({ ok: true });
    }

    let sourceWallet = userWallets[0];
    if (parsed.nama_wallet) {
      const matched = userWallets.find((w) => w.name.toLowerCase().includes(parsed.nama_wallet!.toLowerCase()));
      if (matched) sourceWallet = matched;
    }

    // Resolve Category
    let targetCategory = (userCategories || []).find((c) => 
      c.name.toLowerCase().includes((parsed.kategori || "").toLowerCase())
    );

    if (!targetCategory && parsed.kategori) {
      // Auto-create category if missing
      const { data: newCat } = await supabase
        .from("categories")
        .insert({
          user_id: profile.id,
          name: parsed.kategori,
          type: parsed.jenis === "pemasukan" ? "income" : "expense",
          icon: parsed.jenis === "pemasukan" ? "💰" : "🏷️",
          is_custom: true,
        })
        .select()
        .single();
      targetCategory = newCat || undefined;
    }

    // 9. HANDLE TRANSFER OR INCOME OR EXPENSE
    if (parsed.jenis === "transfer") {
      let destWallet = userWallets.find((w) => w.id !== sourceWallet.id);
      if (parsed.tujuan_wallet) {
        const foundDest = userWallets.find((w) => w.name.toLowerCase().includes(parsed.tujuan_wallet!.toLowerCase()) && w.id !== sourceWallet.id);
        if (foundDest) destWallet = foundDest;
      }

      if (!destWallet) {
        await bot.sendMessage(chatId, "⚠️ Transfer gagal: dompet tujuan tidak ditemukan atau Anda hanya punya 1 dompet.");
        return NextResponse.json({ ok: true });
      }

      await supabase.from("transactions").insert({
        user_id: profile.id,
        wallet_id: sourceWallet.id,
        destination_wallet_id: destWallet.id,
        type: "transfer",
        amount: parsed.nominal,
        description: parsed.catatan || `Transfer dari ${sourceWallet.name} ke ${destWallet.name}`,
        source: voiceTranscription ? "telegram_voice" : "telegram_text",
      });

      const reply = formatTransferReply({
        amount: parsed.nominal,
        fromWalletName: sourceWallet.name,
        fromWalletBalance: Number(sourceWallet.balance) - parsed.nominal,
        toWalletName: destWallet.name,
        toWalletBalance: Number(destWallet.balance) + parsed.nominal,
        transcription: voiceTranscription,
      });

      await bot.sendMessage(chatId, reply);
      return NextResponse.json({ ok: true });
    }

    if (parsed.jenis === "pemasukan") {
      await supabase.from("transactions").insert({
        user_id: profile.id,
        wallet_id: sourceWallet.id,
        category_id: targetCategory?.id || null,
        type: "income",
        amount: parsed.nominal,
        description: parsed.catatan || "Pemasukan",
        source: voiceTranscription ? "telegram_voice" : "telegram_text",
      });

      const newBal = Number(sourceWallet.balance) + parsed.nominal;
      const reply = formatIncomeReply({
        amount: parsed.nominal,
        walletName: sourceWallet.name,
        newBalance: newBal,
        note: parsed.catatan,
        transcription: voiceTranscription,
      });

      await bot.sendMessage(chatId, reply);
      return NextResponse.json({ ok: true });
    }

    // Expense Case:
    await supabase.from("transactions").insert({
      user_id: profile.id,
      wallet_id: sourceWallet.id,
      category_id: targetCategory?.id || null,
      type: "expense",
      amount: parsed.nominal,
      description: parsed.catatan || "Pengeluaran",
      source: voiceTranscription ? "telegram_voice" : "telegram_text",
    });

    const newBalance = Number(sourceWallet.balance) - parsed.nominal;

    // Check Category Budget for current month
    let budgetInfo = null;
    if (targetCategory) {
      const now = new Date();
      const curMonth = now.getMonth() + 1;
      const curYear = now.getFullYear();

      const { data: budget } = await supabase
        .from("budgets")
        .select("*")
        .eq("user_id", profile.id)
        .eq("category_id", targetCategory.id)
        .eq("month", curMonth)
        .eq("year", curYear)
        .maybeSingle();

      if (budget) {
        const monthStart = new Date(curYear, curMonth - 1, 1).toISOString();
        const { data: catTxs } = await supabase
          .from("transactions")
          .select("amount")
          .eq("user_id", profile.id)
          .eq("category_id", targetCategory.id)
          .eq("type", "expense")
          .gte("transaction_date", monthStart);

        const totalSpent = (catTxs || []).reduce((acc, curr) => acc + Number(curr.amount), 0);
        const limit = Number(budget.monthly_limit);
        const pct = limit > 0 ? (totalSpent / limit) * 100 : 0;
        const remaining = Math.max(0, limit - totalSpent);

        budgetInfo = {
          limit,
          spent: totalSpent,
          remaining,
          percentage: pct,
        };

        // Automatic Budget Threshold Alerts (Part 3)
        if (pct >= 100 && !budget.alert_100_sent) {
          const alert100Msg = `🚨 PERINGATAN BUDGET 100%!\n\n` +
            `Pengeluaran untuk kategori ${targetCategory?.icon || "🏷️"} ${targetCategory?.name} telah mencapai ${Math.round(pct)}% dari limit bulanan!\n\n` +
            `🎯 Limit: ${formatRupiah(limit)}\n` +
            `💸 Terpakai: ${formatRupiah(totalSpent)}\n\n` +
            `⚠️ Anda telah melebihi budget bulanan untuk kategori ini. Harap rem pengeluaran agar rencana finansial tetap aman! 💪`;
          await bot.sendMessage(chatId, alert100Msg);
          await supabase
            .from("budgets")
            .update({ alert_100_sent: true, alert_80_sent: true })
            .eq("id", budget.id);
        } else if (pct >= 80 && !budget.alert_80_sent) {
          const alert80Msg = `⚠️ PERINGATAN BUDGET 80%!\n\n` +
            `Pengeluaran untuk kategori ${targetCategory?.icon || "🏷️"} ${targetCategory?.name} sudah mencapai ${Math.round(pct)}% dari limit bulanan.\n\n` +
            `🎯 Limit: ${formatRupiah(limit)}\n` +
            `💸 Terpakai: ${formatRupiah(totalSpent)}\n` +
            `💰 Sisa Budget: ${formatRupiah(remaining)}\n\n` +
            `Yuk lebih cermat dalam beberapa hari ke depan! 🎯`;
          await bot.sendMessage(chatId, alert80Msg);
          await supabase
            .from("budgets")
            .update({ alert_80_sent: true })
            .eq("id", budget.id);
        }
      }
    }

    const reply = formatExpenseReply({
      amount: parsed.nominal,
      categoryName: targetCategory?.name || parsed.kategori || "Pengeluaran",
      categoryIcon: targetCategory?.icon || "🏷️",
      walletName: sourceWallet.name,
      note: parsed.catatan || processingText,
      newBalance,
      budget: budgetInfo,
      transcription: voiceTranscription,
    });

    await bot.sendMessage(chatId, reply);

    // 10. AI FINANCIAL ADVISOR TRIGGER (Part 4.7 - Pro Feature)
    if (profile.plan === "pro") {
      let trigger = false;
      let reason = "";

      if (budgetInfo && budgetInfo.percentage >= 80) {
        trigger = true;
        reason = `Pengeluaran kategori ${targetCategory?.name} sudah mencapai ${Math.round(budgetInfo.percentage)}% dari limit budget bulan ini.`;
      } else if (budgetInfo && parsed.nominal >= budgetInfo.limit * 0.2) {
        trigger = true;
        reason = `Pengeluaran ini memakan lebih dari 20% total budget kategori dalam satu transaksi.`;
      }

      if (trigger) {
        const advice = await AIRouter.getFinancialAdvice({
          userName: profile.full_name,
          triggerReason: reason,
          recentTransactionsSummary: `Transaksi baru: ${parsed.catatan} seharga ${formatRupiah(parsed.nominal)}`,
          budgetStatus: budgetInfo ? `${Math.round(budgetInfo.percentage)}% terpakai` : "Normal",
          userId: profile.id,
        });

        const advisorMsg = formatAdvisorReply(profile.full_name, advice.analysis, advice.actionableTip);
        await bot.sendMessage(chatId, advisorMsg);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}
