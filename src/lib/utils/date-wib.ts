/**
 * Utilities for formatting dates and times in Asia/Jakarta (WIB) timezone.
 */

const WIB_TIMEZONE = "Asia/Jakarta";

export const INDONESIAN_DAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const INDONESIAN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Returns current timestamp in ISO format converted from WIB
 */
export function nowInWIB(): Date {
  const now = new Date();
  return now;
}

/**
 * Format date for Telegram reply header:
 * e.g. "Rabu, 15 Okt 2026 — 14:35 WIB"
 */
export function formatTelegramReplyDate(dateInput: Date | string | number = new Date()): string {
  const d = new Date(dateInput);
  
  // Format day name, date, month, year, time in Asia/Jakarta
  const dayName = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    timeZone: WIB_TIMEZONE,
  }).format(d);

  const day = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    timeZone: WIB_TIMEZONE,
  }).format(d);

  const month = new Intl.DateTimeFormat("id-ID", {
    month: "short",
    timeZone: WIB_TIMEZONE,
  }).format(d);

  const year = new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    timeZone: WIB_TIMEZONE,
  }).format(d);

  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: WIB_TIMEZONE,
  }).format(d).replace(".", ":");

  return `${dayName}, ${day} ${month} ${year} — ${time} WIB`;
}

/**
 * Format simple date for table display:
 * e.g. "15 Okt 2026, 14:35"
 */
export function formatDateTimeWIB(dateInput: Date | string | number): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: WIB_TIMEZONE,
  }).format(d).replace(".", ":");
}

/**
 * Format date only:
 * e.g. "15 Oktober 2026"
 */
export function formatDateOnlyWIB(dateInput: Date | string | number): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WIB_TIMEZONE,
  }).format(d);
}

/**
 * Returns month and year in Indonesian e.g. "Oktober 2026"
 */
export function formatMonthYearWIB(dateInput: Date | string | number = new Date()): string {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: WIB_TIMEZONE,
  }).format(d);
}
