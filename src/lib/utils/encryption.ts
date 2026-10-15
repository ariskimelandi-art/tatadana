import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = (process.env.APP_ENCRYPTION_KEY || "tatadana_secure_master_key_2026!").padEnd(32, "0").slice(0, 32);
const IV_LENGTH = 16;

/**
 * Encrypt a plain string (such as an API key) with AES-256-CBC
 */
export function encryptApiKey(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypt an encrypted API key
 */
export function decryptApiKey(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const textParts = encryptedText.split(":");
    if (textParts.length < 2) return encryptedText; // If stored plain previously

    const iv = Buffer.from(textParts[0], "hex");
    const encryptedData = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Failed to decrypt API key:", error);
    return "";
  }
}

/**
 * Mask an API key for safe display in UI e.g. "AIzaSy...4aB1"
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return "••••••••";
  return `${apiKey.slice(0, 6)}••••••••${apiKey.slice(-4)}`;
}
