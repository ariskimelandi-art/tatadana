/**
 * Format number to Indonesian Rupiah representation
 * Example: formatRupiah(15000) => "Rp 15.000"
 */
export function formatRupiah(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "Rp 0";
  }
  const numeric = Math.round(Number(amount));
  const parts = Math.abs(numeric).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${numeric < 0 ? "-Rp " : "Rp "}${parts}`;
}

/**
 * Parses colloquial Indonesian currency strings into a valid numeric float/integer.
 * Handles:
 * - "15rb", "15 rb", "15ribu", "15 ribu" => 15000
 * - "1.5jt", "1,5jt", "1.5 jt", "1,5 juta" => 1500000
 * - "500k", "500 k" => 500000
 * - "2m", "2 milyar", "2,5m" => 2000000000 / 2500000000
 * - "Rp 25.000", "Rp. 50,000", "25000" => 25000 / 50000
 */
export function parseIndonesianCurrency(input: string | number): number | null {
  if (typeof input === "number") return input;
  if (!input || typeof input !== "string") return null;

  let cleaned = input.trim().toLowerCase();

  // Strip common prefixes
  cleaned = cleaned.replace(/^rp\.?\s*/i, "");
  cleaned = cleaned.replace(/idr\s*/i, "");

  // Match pattern: numbers with optional decimals followed by multiplier suffix
  // e.g. "1.5jt", "1,5 jt", "15rb", "500k", "2milyar"
  const multiplierRegex = /^([0-9]+(?:[.,][0-9]+)?)\s*(rb|ribu|k|jt|juta|m|milyar|miliar)?$/i;
  const match = cleaned.match(multiplierRegex);

  if (match) {
    const rawNumberStr = match[1].replace(",", ".");
    const val = parseFloat(rawNumberStr);
    const suffix = (match[2] || "").toLowerCase();

    if (isNaN(val)) return null;

    if (suffix === "rb" || suffix === "ribu" || suffix === "k") {
      return Math.round(val * 1000);
    }
    if (suffix === "jt" || suffix === "juta") {
      return Math.round(val * 1000000);
    }
    if (suffix === "m" || suffix === "milyar" || suffix === "miliar") {
      return Math.round(val * 1000000000);
    }

    // Standard number without suffix
    // Check if it was formatted like "25.000" or "1.500.000" (dot as thousands separator)
    if (cleaned.includes(".") && !cleaned.includes(",")) {
      const dotParts = cleaned.split(".");
      // If each following part is 3 digits, it's a thousands separator
      const isThousands = dotParts.length > 1 && dotParts.slice(1).every(part => part.length === 3);
      if (isThousands) {
        return parseInt(cleaned.replace(/\./g, ""), 10);
      }
    }

    return Math.round(val);
  }

  // Fallback: strip all non-digits except comma/period
  const stripped = cleaned.replace(/[^0-9]/g, "");
  if (stripped.length > 0) {
    return parseInt(stripped, 10);
  }

  return null;
}
