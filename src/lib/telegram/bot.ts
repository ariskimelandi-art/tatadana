/**
 * Telegram Bot API client for TataDana
 */

const DEFAULT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

export class TelegramBot {
  private token: string;

  constructor(token?: string) {
    this.token = token || DEFAULT_TOKEN;
  }

  private getBaseUrl(): string {
    return `https://api.telegram.org/bot${this.token}`;
  }

  /**
   * Test Bot Token via /getMe endpoint
   */
  async getMe(): Promise<{ ok: boolean; result?: any; description?: string }> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/getMe`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, description: err?.message || "Koneksi ke Telegram gagal" };
    }
  }

  /**
   * Set public webhook endpoint
   */
  async setWebhook(webhookUrl: string): Promise<{ ok: boolean; result?: boolean; description?: string }> {
    try {
      const url = `${this.getBaseUrl()}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      return await res.json();
    } catch (err: any) {
      return { ok: false, description: err?.message || "Gagal mengatur webhook Telegram" };
    }
  }

  /**
   * Send text message to user/chat
   */
  async sendMessage(chatId: number | string, text: string, options?: { reply_to_message_id?: number; reply_markup?: any }): Promise<any> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: undefined, // Send plain formatted text with emoji
          reply_to_message_id: options?.reply_to_message_id,
          reply_markup: options?.reply_markup,
        }),
      });
      return await res.json();
    } catch (err) {
      console.error("Telegram sendMessage error:", err);
      return null;
    }
  }

  /**
   * Download a file (photo or voice note) given a file_id
   */
  async downloadFile(fileId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    try {
      // 1. Get file path from Telegram
      const fileInfoRes = await fetch(`${this.getBaseUrl()}/getFile?file_id=${fileId}`);
      const fileInfo = await fileInfoRes.json();
      if (!fileInfo.ok || !fileInfo.result?.file_path) {
        return null;
      }

      const filePath = fileInfo.result.file_path;
      const downloadUrl = `https://api.telegram.org/file/bot${this.token}/${filePath}`;

      // 2. Fetch binary buffer
      const bufferRes = await fetch(downloadUrl);
      const arrayBuffer = await bufferRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let mimeType = "application/octet-stream";
      if (filePath.endsWith(".oga") || filePath.endsWith(".ogg")) mimeType = "audio/ogg";
      else if (filePath.endsWith(".mp3")) mimeType = "audio/mpeg";
      else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) mimeType = "image/jpeg";
      else if (filePath.endsWith(".png")) mimeType = "image/png";

      return { buffer, mimeType };
    } catch (err) {
      console.error("Failed to download telegram file:", err);
      return null;
    }
  }
}
