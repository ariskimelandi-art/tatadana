import { GoogleGenAI } from "@google/genai";
import { ParsedTransactionResult, ReceiptItem } from "@/lib/types";
import { parseIndonesianCurrency } from "@/lib/utils/currency";
import { UserFinancialContext } from "@/lib/financial-context";

export class GeminiService {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.0-flash") {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  /**
   * Parse natural language Indonesian transaction into structured JSON
   */
  async parseTransaction(
    text: string,
    existingCategories: string[] = []
  ): Promise<ParsedTransactionResult> {
    const prompt = `Anda adalah asisten AI TataDana untuk manajemen keuangan pribadi Indonesia.
Tugas Anda adalah mengekstrak data transaksi keuangan dari pesan pengguna berikut:
"${text}"

Daftar kategori yang sudah ada di akun pengguna: ${JSON.stringify(existingCategories)}

PANDUAN EKSTRAKSI NOMINAL BAHASA INDONESIA:
- "15rb", "15 ribu", "15k" = 15000
- "1.5jt", "1,5jt", "1.5 juta", "1,5 juta" = 1500000
- "500k" = 500000
- "25.000" / "25000" = 25000
- "2m", "2 miliar" = 2000000000

PANDUAN JENIS TRANSAKSI:
- "pengeluaran" (contoh: beli bakso, bayar kos, ngopi, belanja, bensin, tiket)
- "pemasukan" (contoh: gajian, transferan dari bos, cashback, dividen, freelance)
- "transfer" (contoh: transfer dari BCA ke GoPay, pindah saldo)

Berikan respon HANYA dalam format JSON valid tanpa markdown backticks:
{
  "jenis": "pengeluaran" | "pemasukan" | "transfer",
  "nominal": number (harus angka positif integer, 0 jika gagal),
  "kategori": string (pilih yang paling cocok dari daftar kategori pengguna atau buat kategori ringkas dengan emoji),
  "catatan": string (deskripsi singkat barang/keperluan),
  "nama_wallet": string | null (jika user menyebut wallet asal, misal BCA/Cash/GoPay),
  "tujuan_wallet": string | null (jika jenis transfer, sebutkan wallet tujuan),
  "is_ambiguous": boolean (true jika teks tidak jelas/bukan transaksi keuangan),
  "error_reason": string | null (alasan jika is_ambiguous = true)
}`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text?.trim() || "{}";
      const cleanedJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanedJson) as ParsedTransactionResult;

      // Verification with custom parser if nominal was 0 or missing
      if (!parsed.nominal || parsed.nominal === 0) {
        const fallbackNominal = parseIndonesianCurrency(text);
        if (fallbackNominal) {
          parsed.nominal = fallbackNominal;
          parsed.is_ambiguous = false;
        }
      }

      return parsed;
    } catch (err: any) {
      console.error("Gemini parseTransaction error:", err);
      // Fallback with heuristic parser
      const nominal = parseIndonesianCurrency(text);
      if (nominal) {
        const isIncome = /gaji|pemasukan|terima|dapat|transferan|bonus|freelance/i.test(text);
        return {
          jenis: isIncome ? "pemasukan" : "pengeluaran",
          nominal,
          kategori: isIncome ? "💰 Pemasukan" : "🍜 Makanan & Minuman",
          catatan: text,
          is_ambiguous: false,
        };
      }
      return {
        jenis: "pengeluaran",
        nominal: 0,
        kategori: "Lainnya",
        catatan: text,
        is_ambiguous: true,
        error_reason: "Gagal memproses pesan secara otomatis",
      };
    }
  }

  /**
   * Multimodal Receipt OCR: Extracts items, total amount, merchant, and date
   */
  async ocrReceipt(imageBuffer: Buffer, mimeType: string = "image/jpeg"): Promise<{
    merchant: string;
    date: string;
    total: number;
    items: ReceiptItem[];
  }> {
    const prompt = `Anda adalah asisten OCR struk belanja TataDana Indonesia.
Analisis gambar struk pembayaran ini secara teliti dan ekstrak:
1. Nama toko/merchant/kasir
2. Tanggal transaksi
3. Total pembayaran keseluruhan (rupiah)
4. Daftar semua item barang yang dibeli beserta kuantitas, harga satuan, total harga, dan rekomendasi kategori (misal: "🍜 Makanan", "👕 Belanja", "💊 Kesehatan").

Kembalikan HANYA format JSON valid berikut:
{
  "merchant": "Nama Merchant",
  "date": "YYYY-MM-DD",
  "total": 125000,
  "items": [
    {
      "name": "Nama Item",
      "qty": 1,
      "price": 25000,
      "total": 25000,
      "category_suggestion": "🍜 Makanan"
    }
  ]
}`;

    const base64Data = imageBuffer.toString("base64");
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "{}";
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }

  /**
   * Multimodal Audio Speech-to-Text: Transcribes voice notes (.oga/.mp3)
   */
  async transcribeAudio(audioBuffer: Buffer, mimeType: string = "audio/ogg"): Promise<string> {
    const prompt = "Transkripkan rekaman suara berbahasa Indonesia ini secara verbatim dan akurat ke dalam teks. Fokus pada kata-kata transaksi keuangan seperti nominal, nama barang, dan dompet. Kembalikan hanya teks transkripsinya.";

    const base64Data = audioBuffer.toString("base64");
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
          ],
        },
      ],
    });

    return response.text?.trim() || "";
  }

  /**
   * AI Financial Advisor analysis (Pro Feature)
   */
  async generateFinancialAdvice(params: {
    userName: string;
    triggerReason: string;
    recentTransactionsSummary: string;
    budgetStatus: string;
  }): Promise<{ analysis: string; actionableTip: string }> {
    const prompt = `Anda adalah AI Financial Advisor pribadi TataDana yang ramah, empati, dan bijak dalam literasi keuangan Indonesia.
Nama Pengguna: ${params.userName}
Trigger: ${params.triggerReason}
Ringkasan Keuangan: ${params.recentTransactionsSummary}
Status Budget: ${params.budgetStatus}

Berikan analisa personal yang tidak kaku dan 1 saran spesifik yang actionable untuk menjaga cashflow pengguna.
Format JSON:
{
  "analysis": "Analisa ramah 2-3 kalimat menyapa pengguna",
  "actionableTip": "1 tips spesifik yang bisa langsung dilakukan hari ini"
}`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "{}";
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }

  /**
   * Recommend initial categories during onboarding based on user persona
   */
  async recommendCategories(profileInfo: {
    occupation: string;
    monthlyIncomeRange: string;
    livingSituation: string;
  }): Promise<Array<{ name: string; type: 'expense' | 'income'; icon: string; color: string }>> {
    const prompt = `Pengguna baru TataDana mengisi onboarding:
- Pekerjaan: ${profileInfo.occupation}
- Rentang Pendapatan: ${profileInfo.monthlyIncomeRange}
- Status tempat tinggal / gaya hidup: ${profileInfo.livingSituation}

Rekomendasikan 8-10 kategori keuangan Indonesia yang sangat relevan dan personal untuk pengguna ini (campuran pemasukan dan pengeluaran).
Kembalikan format JSON:
[
  { "name": "🍜 Makanan Harian", "type": "expense", "icon": "🍜", "color": "#FF6B00" },
  { "name": "💰 Gaji Pokok", "type": "income", "icon": "💰", "color": "#10B981" }
]`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "[]";
    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }

  /**
   * Conversational chat interaction with DanaBot
   */
  async generateChat(
    message: string,
    history: Array<{ role: string; content: string }> = [],
    financialContext?: UserFinancialContext
  ): Promise<string> {
    const formattedHistory = history
      .slice(-6)
      .map((h) => `${h.role === "assistant" ? "DanaBot" : "User"}: ${h.content}`)
      .join("\n");

    const contextSnippet = financialContext
      ? `DATA KEUANGAN PENGGUNA SAAT INI (GUNAKAN DATA INI SECARA AKURAT UNTUK MENJAWAB):
- Total Saldo di Seluruh Dompet: Rp ${financialContext.totalBalance.toLocaleString("id-ID")}
- Total Pemasukan Bulan Ini: Rp ${financialContext.totalIncome.toLocaleString("id-ID")}
- Total Pengeluaran Bulan Ini: Rp ${financialContext.totalExpense.toLocaleString("id-ID")}
- Net Surplus Tabungan: Rp ${financialContext.netSavings.toLocaleString("id-ID")} (Tingkat Tabungan: ${financialContext.savingsRate}%)
- Sisa Anggaran Bulanan: Rp ${financialContext.remainingBudget.toLocaleString("id-ID")} dari total limit Rp ${financialContext.monthlyBudget.toLocaleString("id-ID")}
- Kategori Pengeluaran Terbesar:
  ${financialContext.topCategories.map((c) => `* ${c.name}: Rp ${c.amount.toLocaleString("id-ID")} (${c.percentage}%)`).join("\n  ")}
- Transaksi Terakhir yang Tercatat:
  ${financialContext.recentTransactions.map((t) => `* [${t.type === "income" ? "Pemasukan" : "Pengeluaran"}] ${t.description} - Rp ${t.amount.toLocaleString("id-ID")} (${t.date})`).join("\n  ")}
- Rincian Saldo Rekening/Dompet:
  ${financialContext.wallets.map((w) => `* ${w.name}: Rp ${w.balance.toLocaleString("id-ID")}`).join("\n  ")}`
      : "";

    const prompt = `Anda adalah DanaBot, asisten AI resmi dari platform keuangan TataDana Indonesia.
Tugas Anda adalah membahas dan menjawab pertanyaan pengguna tentang pemasukan, pengeluaran, saldo, dan perencanaan keuangan mereka.
Selalu gunakan data keuangan nyata pengguna di bawah ini untuk menjawab pertanyaan mereka secara akurat.

${contextSnippet}

Gunakan Bahasa Indonesia yang ramah, santun, jelas, dan solutif.
Gunakan pemformatan Markdown (teks tebal, bullet points, emoji) agar pesan rapi dan enak dibaca.

Riwayat percakapan sebelumnya:
${formattedHistory || "(Belum ada percakapan sebelumnya)"}

Pertanyaan pengguna:
"${message}"

Berikan jawaban yang menanggapi langsung pertanyaan di atas dengan mengacu pada angka keuangan pengguna:`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text?.trim() || "";
  }
}

