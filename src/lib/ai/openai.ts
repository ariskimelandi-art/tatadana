import OpenAI from "openai";
import { ParsedTransactionResult, ReceiptItem } from "@/lib/types";
import { parseIndonesianCurrency } from "@/lib/utils/currency";

export class OpenAIService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async parseTransaction(
    text: string,
    existingCategories: string[] = []
  ): Promise<ParsedTransactionResult> {
    const prompt = `Anda adalah asisten AI TataDana untuk manajemen keuangan pribadi Indonesia.
Tugas Anda mengekstrak transaksi keuangan dari: "${text}"
Daftar kategori pengguna: ${JSON.stringify(existingCategories)}

PANDUAN NOMINAL INDONESIA:
- "15rb", "15 ribu", "15k" = 15000
- "1.5jt", "1,5jt", "1.5 juta" = 1500000
- "500k" = 500000
- "25.000" = 25000

Format JSON respon:
{
  "jenis": "pengeluaran" | "pemasukan" | "transfer",
  "nominal": number,
  "kategori": string,
  "catatan": string,
  "nama_wallet": string | null,
  "tujuan_wallet": string | null,
  "is_ambiguous": boolean,
  "error_reason": string | null
}`;

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    if (!parsed.nominal || parsed.nominal === 0) {
      const fallback = parseIndonesianCurrency(text);
      if (fallback) {
        parsed.nominal = fallback;
        parsed.is_ambiguous = false;
      }
    }
    return parsed;
  }

  async ocrReceipt(imageBuffer: Buffer): Promise<{
    merchant: string;
    date: string;
    total: number;
    items: ReceiptItem[];
  }> {
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;
    const prompt = `Ekstrak data struk belanja Indonesia ke JSON:
{
  "merchant": "Nama Merchant",
  "date": "YYYY-MM-DD",
  "total": 125000,
  "items": [
    {
      "name": "Item A",
      "qty": 1,
      "price": 25000,
      "total": 25000,
      "category_suggestion": "🍜 Makanan"
    }
  ]
}`;

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: base64Image } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0]?.message?.content || "{}");
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    const file = new File([new Uint8Array(audioBuffer)], "audio.ogg", { type: "audio/ogg" });
    const transcription = await this.client.audio.transcriptions.create({
      file,
      model: "whisper-1",
      language: "id",
    });
    return transcription.text;
  }

  async generateChat(
    message: string,
    history: Array<{ role: string; content: string }> = []
  ): Promise<string> {
    const messages: any[] = [
      {
        role: "system",
        content: `Anda adalah DanaBot, asisten AI resmi dari platform keuangan TataDana Indonesia.
Tugas Anda adalah membantu pengguna mengelola uang dengan cerdas, menjawab pertanyaan seputar keuangan (budgeting, tips hemat, alokasi 50/30/20, dana darurat, investasi pemula, hutang/paylater), serta memandu cara menggunakan aplikasi TataDana (catat transaksi, scan struk foto, buat budget, ekspor laporan excel/pdf, telegram bot, upgrade Pro).
Gunakan Bahasa Indonesia yang ramah, sopan, jelas, dan santun dengan format Markdown.`,
      },
      ...history.slice(-6).map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  }
}

