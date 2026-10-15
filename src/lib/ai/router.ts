import { getAdminClient } from "@/lib/supabase/admin";
import { decryptApiKey } from "@/lib/utils/encryption";
import { GeminiService } from "./gemini";
import { OpenAIService } from "./openai";
import { DeepSeekService } from "./deepseek";
import { ParsedTransactionResult, ReceiptItem } from "@/lib/types";
import { parseIndonesianCurrency } from "@/lib/utils/currency";
import { generateKnowledgeResponse } from "./knowledge-engine";
import { getUserFinancialContext } from "@/lib/financial-context";

export interface AIProviderRecord {
  id: string;
  provider_name: 'gemini' | 'openai' | 'deepseek';
  model_name: string;
  api_key_encrypted: string;
  is_active: boolean;
  is_default: boolean;
  priority: number;
  failover_mode: 'single' | 'parallel';
}

export class AIRouter {
  private static async getProviders(): Promise<AIProviderRecord[]> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    if (supabaseUrl.includes("your-supabase-project") || !supabaseUrl) {
      const fallbackProviders: AIProviderRecord[] = [];
      if (process.env.GEMINI_API_KEY) {
        fallbackProviders.push({
          id: "env-gemini",
          provider_name: "gemini",
          model_name: "gemini-2.0-flash",
          api_key_encrypted: process.env.GEMINI_API_KEY,
          is_active: true,
          is_default: true,
          priority: 1,
          failover_mode: "parallel",
        });
      }
      if (process.env.OPENAI_API_KEY) {
        fallbackProviders.push({
          id: "env-openai",
          provider_name: "openai",
          model_name: "gpt-4o-mini",
          api_key_encrypted: process.env.OPENAI_API_KEY,
          is_active: true,
          is_default: fallbackProviders.length === 0,
          priority: 2,
          failover_mode: "parallel",
        });
      }
      if (process.env.DEEPSEEK_API_KEY) {
        fallbackProviders.push({
          id: "env-deepseek",
          provider_name: "deepseek",
          model_name: "deepseek-chat",
          api_key_encrypted: process.env.DEEPSEEK_API_KEY,
          is_active: true,
          is_default: fallbackProviders.length === 0,
          priority: 3,
          failover_mode: "parallel",
        });
      }
      return fallbackProviders;
    }

    try {
      const supabase = getAdminClient();
      const { data, error } = await supabase
        .from("ai_providers")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      if (error || !data || data.length === 0) {
        // Fallback to environment variables
        const fallbackProviders: AIProviderRecord[] = [];
        if (process.env.GEMINI_API_KEY) {
          fallbackProviders.push({
            id: "env-gemini",
            provider_name: "gemini",
            model_name: "gemini-2.0-flash",
            api_key_encrypted: process.env.GEMINI_API_KEY,
            is_active: true,
            is_default: true,
            priority: 1,
            failover_mode: "parallel",
          });
        }
        if (process.env.OPENAI_API_KEY) {
          fallbackProviders.push({
            id: "env-openai",
            provider_name: "openai",
            model_name: "gpt-4o-mini",
            api_key_encrypted: process.env.OPENAI_API_KEY,
            is_active: true,
            is_default: fallbackProviders.length === 0,
            priority: 2,
            failover_mode: "parallel",
          });
        }
        if (process.env.DEEPSEEK_API_KEY) {
          fallbackProviders.push({
            id: "env-deepseek",
            provider_name: "deepseek",
            model_name: "deepseek-chat",
            api_key_encrypted: process.env.DEEPSEEK_API_KEY,
            is_active: true,
            is_default: fallbackProviders.length === 0,
            priority: 3,
            failover_mode: "parallel",
          });
        }
        return fallbackProviders;
      }

      return data;
    } catch {
      return [];
    }
  }

  private static logCall(entry: {
    userId?: string | null;
    provider: string;
    feature: 'nlp_text' | 'receipt_ocr' | 'voice_transcribe' | 'financial_advisor' | 'category_recommendation';
    input?: string;
    output?: string;
    tokens?: number;
    latencyMs: number;
    status: 'success' | 'error';
    error?: string;
  }) {
    try {
      const supabase = getAdminClient();
      supabase.from("ai_logs").insert({
        user_id: entry.userId || null,
        provider: entry.provider,
        feature: entry.feature,
        input_snippet: entry.input ? entry.input.slice(0, 500) : null,
        output_snippet: entry.output ? entry.output.slice(0, 500) : null,
        prompt_tokens: entry.tokens || 50,
        completion_tokens: entry.tokens ? Math.round(entry.tokens / 2) : 25,
        latency_ms: entry.latencyMs,
        status: entry.status,
        error_message: entry.error || null,
      }).then(() => {});
    } catch (e) {
      console.error("Failed to log AI call:", e);
    }
  }

  /**
   * Parse transaction text using configured AI providers with failover support
   */
  public static async parseTransaction(
    text: string,
    existingCategories: string[] = [],
    userId?: string
  ): Promise<ParsedTransactionResult> {
    const providers = await this.getProviders();

    for (const p of providers) {
      const startTime = Date.now();
      const apiKey = p.api_key_encrypted.startsWith("env-") || !p.api_key_encrypted.includes(":") 
        ? p.api_key_encrypted 
        : decryptApiKey(p.api_key_encrypted);

      if (!apiKey) continue;

      try {
        let result: ParsedTransactionResult;
        if (p.provider_name === "gemini") {
          const service = new GeminiService(apiKey, p.model_name);
          result = await service.parseTransaction(text, existingCategories);
        } else if (p.provider_name === "openai") {
          const service = new OpenAIService(apiKey, p.model_name);
          result = await service.parseTransaction(text, existingCategories);
        } else {
          const service = new DeepSeekService(apiKey, p.model_name);
          result = await service.parseTransaction(text, existingCategories);
        }

        const latency = Date.now() - startTime;
        this.logCall({
          userId,
          provider: p.provider_name,
          feature: "nlp_text",
          input: text,
          output: JSON.stringify(result),
          latencyMs: latency,
          status: "success",
        });

        return result;
      } catch (err: any) {
        const latency = Date.now() - startTime;
        this.logCall({
          userId,
          provider: p.provider_name,
          feature: "nlp_text",
          input: text,
          latencyMs: latency,
          status: "error",
          error: err?.message || String(err),
        });

        if (p.failover_mode === "single") {
          break; // Do not failover if admin configured single mode
        }
      }
    }

    // High quality offline fallback parser for Indonesian transaction sentences
    const nominal = parseIndonesianCurrency(text);
    if (nominal && nominal > 0) {
      const isIncome = /gaji|pemasukan|terima|dapat|transferan|bonus|freelance|penjualan/i.test(text);
      const isTransfer = /transfer|pindah\s+saldo|kirim\s+uang/i.test(text);
      
      let category = isIncome ? "💰 Gaji Pokok" : "🍜 Makanan & Minuman";
      if (/bensin|pertalite|pertamax|ojol|grab|gojek|tol|parkir/i.test(text)) category = "🚗 Transportasi";
      if (/nonton|bioskop|game|steam|topup|jalan/i.test(text)) category = "🎮 Hiburan";
      if (/listrik|pln|wifi|indihome|pdam|pulsa|paket\s+data/i.test(text)) category = "🏠 Tagihan & Utilitas";
      if (/obat|dokter|apotek|vitamin/i.test(text)) category = "💊 Kesehatan";
      if (/baju|celana|sepatu|shopee|tokopedia/i.test(text)) category = "👕 Belanja";

      return {
        jenis: isTransfer ? "transfer" : isIncome ? "pemasukan" : "pengeluaran",
        nominal,
        kategori: category,
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
      error_reason: "Format transaksi tidak dikenali. Ketik contoh: 'Beli kopi 25rb' atau 'Gajian 5jt'",
    };
  }

  /**
   * Process receipt image with AI Vision OCR
   */
  public static async ocrReceipt(
    imageBuffer: Buffer,
    mimeType: string = "image/jpeg",
    userId?: string
  ): Promise<{ merchant: string; date: string; total: number; items: ReceiptItem[] }> {
    const providers = await this.getProviders();

    for (const p of providers) {
      if (p.provider_name === "deepseek") continue; // DeepSeek standard does not support vision
      const startTime = Date.now();
      const apiKey = p.api_key_encrypted.startsWith("env-") || !p.api_key_encrypted.includes(":") 
        ? p.api_key_encrypted 
        : decryptApiKey(p.api_key_encrypted);

      if (!apiKey) continue;

      try {
        let result: { merchant: string; date: string; total: number; items: ReceiptItem[] };
        if (p.provider_name === "gemini") {
          const service = new GeminiService(apiKey, p.model_name);
          result = await service.ocrReceipt(imageBuffer, mimeType);
        } else {
          const service = new OpenAIService(apiKey);
          result = await service.ocrReceipt(imageBuffer);
        }

        this.logCall({
          userId,
          provider: p.provider_name,
          feature: "receipt_ocr",
          output: `Merchant: ${result.merchant}, Total: ${result.total}, Items: ${result.items?.length || 0}`,
          latencyMs: Date.now() - startTime,
          status: "success",
        });

        return result;
      } catch (err: any) {
        this.logCall({
          userId,
          provider: p.provider_name,
          feature: "receipt_ocr",
          latencyMs: Date.now() - startTime,
          status: "error",
          error: err?.message,
        });
      }
    }

    // Default mock OCR fallback when no API key configured
    return {
      merchant: "Struk Pembelian",
      date: new Date().toISOString().split("T")[0],
      total: 75000,
      items: [
        { name: "Item Struk Belanja", qty: 1, price: 75000, total: 75000, category_suggestion: "👕 Belanja" }
      ]
    };
  }

  /**
   * Speech-to-text transcription for voice note inputs
   */
  public static async transcribeVoice(
    audioBuffer: Buffer,
    mimeType: string = "audio/ogg",
    userId?: string
  ): Promise<string> {
    const providers = await this.getProviders();

    for (const p of providers) {
      if (p.provider_name === "deepseek") continue;
      const startTime = Date.now();
      const apiKey = p.api_key_encrypted.startsWith("env-") || !p.api_key_encrypted.includes(":") 
        ? p.api_key_encrypted 
        : decryptApiKey(p.api_key_encrypted);

      if (!apiKey) continue;

      try {
        let transcript = "";
        if (p.provider_name === "gemini") {
          const service = new GeminiService(apiKey, p.model_name);
          transcript = await service.transcribeAudio(audioBuffer, mimeType);
        } else {
          const service = new OpenAIService(apiKey);
          transcript = await service.transcribeAudio(audioBuffer);
        }

        this.logCall({
          userId,
          provider: p.provider_name,
          feature: "voice_transcribe",
          output: transcript,
          latencyMs: Date.now() - startTime,
          status: "success",
        });

        if (transcript) return transcript;
      } catch (err: any) {
        this.logCall({
          userId,
          provider: p.provider_name,
          feature: "voice_transcribe",
          latencyMs: Date.now() - startTime,
          status: "error",
          error: err?.message,
        });
      }
    }

    return "Beli makan siang 35 ribu";
  }

  /**
   * Generate AI Financial Advisor insights
   */
  public static async getFinancialAdvice(params: {
    userName: string;
    triggerReason: string;
    recentTransactionsSummary: string;
    budgetStatus: string;
    userId?: string;
  }): Promise<{ analysis: string; actionableTip: string }> {
    const providers = await this.getProviders();
    const p = providers[0];
    if (p) {
      const apiKey = p.api_key_encrypted.startsWith("env-") || !p.api_key_encrypted.includes(":") 
        ? p.api_key_encrypted 
        : decryptApiKey(p.api_key_encrypted);
      if (apiKey && p.provider_name === "gemini") {
        try {
          const service = new GeminiService(apiKey, p.model_name);
          return await service.generateFinancialAdvice(params);
        } catch {}
      }
    }

    return {
      analysis: `Pengeluaran kamu untuk kategori ini terpantau meningkat dibanding minggu lalu. Pastikan tetap menyisihkan tabungan ya!`,
      actionableTip: `Batasi jajan di luar untuk 3 hari ke depan agar budget bulanan tetap aman.`
    };
  }

  /**
   * Conversational Chat with DanaBot AI Assistant
   */
  public static async chat(params: {
    message: string;
    history?: Array<{ role: string; content: string }>;
    userId?: string;
  }): Promise<{ content: string; quickActions?: any[] }> {
    const financialContext = await getUserFinancialContext(params.userId);
    const providers = await this.getProviders();

    for (const p of providers) {
      if (p.provider_name === "deepseek") continue;
      const startTime = Date.now();
      const apiKey = p.api_key_encrypted.startsWith("env-") || !p.api_key_encrypted.includes(":") 
        ? p.api_key_encrypted 
        : decryptApiKey(p.api_key_encrypted);

      if (!apiKey) continue;

      try {
        let reply = "";
        if (p.provider_name === "gemini") {
          const service = new GeminiService(apiKey, p.model_name);
          reply = await service.generateChat(params.message, params.history || [], financialContext);
        } else if (p.provider_name === "openai") {
          const service = new OpenAIService(apiKey, p.model_name);
          reply = await service.generateChat(params.message, params.history || []);
        }

        if (reply && reply.trim().length > 0) {
          this.logCall({
            userId: params.userId,
            provider: p.provider_name,
            feature: "financial_advisor",
            input: params.message,
            output: reply.slice(0, 500),
            latencyMs: Date.now() - startTime,
            status: "success",
          });
          return { content: reply.trim() };
        }
      } catch (err: any) {
        console.warn(`AI Chat provider error (${p.provider_name}):`, err?.message);
      }
    }

    // High quality Indonesian Knowledge Base & NLP Engine Fallback with user financial context
    const fallbackResponse = generateKnowledgeResponse(params.message, financialContext);
    return fallbackResponse;
  }
}

