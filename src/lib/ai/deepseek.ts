import OpenAI from "openai";
import { ParsedTransactionResult } from "@/lib/types";
import { parseIndonesianCurrency } from "@/lib/utils/currency";

export class DeepSeekService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string = "deepseek-chat") {
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });
    this.model = model;
  }

  async parseTransaction(
    text: string,
    existingCategories: string[] = []
  ): Promise<ParsedTransactionResult> {
    const prompt = `Anda adalah asisten AI TataDana untuk manajemen keuangan pribadi Indonesia.
Ekstrak transaksi keuangan dari: "${text}"
Kategori user: ${JSON.stringify(existingCategories)}

Nominal Indonesia:
- 15rb/15ribu = 15000, 1.5jt = 1500000, 500k = 500000

Format JSON:
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
}
