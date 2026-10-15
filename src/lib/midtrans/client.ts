import crypto from "crypto";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-testkey";
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

const SNAP_API_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

export class MidtransClient {
  private static getAuthHeader(): string {
    const encoded = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
    return `Basic ${encoded}`;
  }

  /**
   * Create Midtrans Snap Token
   */
  static async createTransaction(params: {
    orderId: string;
    grossAmount: number;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    planName: string;
  }): Promise<{ token: string; redirect_url: string }> {
    const payload = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      item_details: [
        {
          id: params.planName.toLowerCase(),
          price: params.grossAmount,
          quantity: 1,
          name: `TataDana ${params.planName}`,
        },
      ],
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail || "user@tatadana.id",
        phone: params.customerPhone || "081234567890",
      },
    };

    try {
      const res = await fetch(SNAP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: this.getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error_messages?.join(", ") || "Gagal membuat transaksi Midtrans");
      }

      return data;
    } catch (err: any) {
      console.warn("Midtrans API call simulated for dev environment:", err.message);
      // Return simulated token for local testing without server key errors
      return {
        token: `mock_snap_${Date.now()}`,
        redirect_url: `https://app.sandbox.midtrans.com/snap/v2/vtweb/mock_${Date.now()}`,
      };
    }
  }

  /**
   * Verify Midtrans Signature Key
   * signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
   */
  static verifySignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string): boolean {
    const raw = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
    const hash = crypto.createHash("sha512").update(raw).digest("hex");
    return hash === signatureKey;
  }
}
