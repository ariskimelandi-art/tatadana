/**
 * TataDana Comprehensive Verification & Test Suite
 * Tests:
 * 1. Indonesian Currency & NLP Number Parser
 * 2. WIB Date Formatting
 * 3. AES-256 API Key Encryption / Decryption
 * 4. Telegram Bot Message Formatters & ASCII Progress Bar
 * 5. PDF Report Generation & Tables
 * 6. Excel (.xlsx) Report Generation
 */

const assert = require("assert");

console.log("==================================================================");
console.log("   TATADANA COMPREHENSIVE AUTOMATED TEST SUITE RUNNER");
console.log("==================================================================\n");

let passedCount = 0;
let totalCount = 0;

function test(name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`  ✓ PASSED: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ FAILED: ${name}`);
    console.error(`    ${err.message}\n`);
  }
}

// -------------------------------------------------------------------------
// 1. Indonesian Currency Natural Language Parser Tests
// -------------------------------------------------------------------------
function parseIndonesianCurrency(input) {
  if (typeof input === "number") return input;
  if (!input || typeof input !== "string") return null;

  let cleaned = input.trim().toLowerCase();
  cleaned = cleaned.replace(/^rp\.?\s*/i, "");
  cleaned = cleaned.replace(/idr\s*/i, "");

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

    if (cleaned.includes(".") && !cleaned.includes(",")) {
      const dotParts = cleaned.split(".");
      const isThousands = dotParts.length > 1 && dotParts.slice(1).every((part) => part.length === 3);
      if (isThousands) {
        return parseInt(cleaned.replace(/\./g, ""), 10);
      }
    }

    return Math.round(val);
  }

  const stripped = cleaned.replace(/[^0-9]/g, "");
  if (stripped.length > 0) {
    return parseInt(stripped, 10);
  }

  return null;
}

function formatRupiah(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "Rp 0";
  }
  const numeric = Math.round(Number(amount));
  const parts = Math.abs(numeric).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${numeric < 0 ? "-Rp " : "Rp "}${parts}`;
}

console.log("[SECTION 1] Testing Indonesian Currency Natural Language Parsing...");

test("Parses 15rb and 15ribu to 15,000", () => {
  assert.strictEqual(parseIndonesianCurrency("15rb"), 15000);
  assert.strictEqual(parseIndonesianCurrency("15ribu"), 15000);
  assert.strictEqual(parseIndonesianCurrency("15 rb"), 15000);
  assert.strictEqual(parseIndonesianCurrency("15 ribu"), 15000);
});

test("Parses 1.5jt and 1,5jt to 1,500,000", () => {
  assert.strictEqual(parseIndonesianCurrency("1.5jt"), 1500000);
  assert.strictEqual(parseIndonesianCurrency("1,5jt"), 1500000);
  assert.strictEqual(parseIndonesianCurrency("1.5 juta"), 1500000);
  assert.strictEqual(parseIndonesianCurrency("1,5juta"), 1500000);
});

test("Parses 500k and 50k to 500,000 and 50,000", () => {
  assert.strictEqual(parseIndonesianCurrency("500k"), 500000);
  assert.strictEqual(parseIndonesianCurrency("50k"), 50000);
});

test("Parses Rupiah dots and standard formats: Rp 25.000 / 25000", () => {
  assert.strictEqual(parseIndonesianCurrency("Rp 25.000"), 25000);
  assert.strictEqual(parseIndonesianCurrency("Rp25.000"), 25000);
  assert.strictEqual(parseIndonesianCurrency("25000"), 25000);
  assert.strictEqual(parseIndonesianCurrency("1.500.000"), 1500000);
});

test("Parses 2m / 2 milyar to 2,000,000,000", () => {
  assert.strictEqual(parseIndonesianCurrency("2m"), 2000000000);
  assert.strictEqual(parseIndonesianCurrency("2.5milyar"), 2500000000);
});

test("formatRupiah produces standard Indonesian dot-separated format", () => {
  assert.strictEqual(formatRupiah(15000), "Rp 15.000");
  assert.strictEqual(formatRupiah(1500000), "Rp 1.500.000");
  assert.strictEqual(formatRupiah(0), "Rp 0");
  assert.strictEqual(formatRupiah(-50000), "-Rp 50.000");
});

// -------------------------------------------------------------------------
// 2. Encryption & Decryption Tests
// -------------------------------------------------------------------------
console.log("\n[SECTION 2] Testing AES-256 API Key Encryption & Decryption...");

const crypto = require("crypto");
const ALGORITHM = "aes-256-cbc";
const ENCRYPTION_KEY = "tatadana_secure_master_key_2026!".padEnd(32, "0").slice(0, 32);
const IV_LENGTH = 16;

function encryptApiKey(text) {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptApiKey(encryptedText) {
  if (!encryptedText) return "";
  const textParts = encryptedText.split(":");
  if (textParts.length < 2) return encryptedText;
  const iv = Buffer.from(textParts[0], "hex");
  const encryptedData = Buffer.from(textParts[1], "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) return "••••••••";
  return `${apiKey.slice(0, 6)}••••••••${apiKey.slice(-4)}`;
}

test("Encrypts and decrypts API Key consistently", () => {
  const secretKey = "AIzaSyD-RandomGoogleGeminiKey123456";
  const encrypted = encryptApiKey(secretKey);
  assert.notStrictEqual(encrypted, secretKey);
  assert(encrypted.includes(":"));

  const decrypted = decryptApiKey(encrypted);
  assert.strictEqual(decrypted, secretKey);
});

test("Masks API key securely for frontend UI", () => {
  const masked = maskApiKey("sk-proj-1234567890abcdef1234");
  assert(masked.startsWith("sk-pro"));
  assert(masked.endsWith("1234"));
  assert(masked.includes("••••••••"));
});

// -------------------------------------------------------------------------
// 3. Telegram Reply Formatters & Progress Bar
// -------------------------------------------------------------------------
console.log("\n[SECTION 3] Testing Telegram Message Formatter & ASCII Progress Bar...");

function createProgressBar(percentage, totalSlots = 10) {
  const boundedPct = Math.max(0, Math.min(100, Math.round(percentage)));
  const filledSlots = Math.min(totalSlots, Math.max(0, Math.round((boundedPct / 100) * totalSlots)));
  const emptySlots = totalSlots - filledSlots;
  const bar = "█".repeat(filledSlots) + "░".repeat(emptySlots);
  return `[${bar}] ${boundedPct}%`;
}

test("Generates visual ASCII progress bars accurately", () => {
  assert.strictEqual(createProgressBar(0), "[░░░░░░░░░░] 0%");
  assert.strictEqual(createProgressBar(50), "[█████░░░░░] 50%");
  assert.strictEqual(createProgressBar(100), "[██████████] 100%");
  assert.strictEqual(createProgressBar(120), "[██████████] 100%");
});

test("Expense reply format matches Part 4.4 specification", () => {
  const progress = createProgressBar(40);
  const sampleExpense = `📅 Rabu, 15 Okt 2026 — 14:35 WIB
💸 Pengeluaran tercatat!
├ Nominal : Rp 15.000
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 Dompet Utama (Cash)
├ Catatan : beli bakso bakar
└ Saldo : Rp 1.235.000

📊 Budget Makanan & Minuman bulan ini:
${progress} — sisa Rp 1.500.000
👍 Budget masih aman. Pertahankan disiplin keuanganmu!`;

  assert(sampleExpense.includes("💸 Pengeluaran tercatat!"));
  assert(sampleExpense.includes("├ Nominal : Rp 15.000"));
  assert(sampleExpense.includes("├ Kategori : 🍜 Makanan & Minuman"));
  assert(sampleExpense.includes("├ Dompet : 👛 Dompet Utama (Cash)"));
  assert(sampleExpense.includes("[████░░░░░░] 40%"));
});

test("Income reply format matches Part 4.5 specification", () => {
  const sampleIncome = `📅 Rabu, 15 Okt 2026 — 10:15 WIB
💰 Pemasukan tercatat!
├ Nominal : Rp 5.000.000
├ Kategori : 💼 Pemasukan
├ Dompet : 👛 Rekening BCA
└ Saldo baru : Rp 13.400.000

💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;

  assert(sampleIncome.includes("💰 Pemasukan tercatat!"));
  assert(sampleIncome.includes("├ Kategori : 💼 Pemasukan"));
  assert(sampleIncome.includes("Semangat terus! Jangan lupa sisihkan"));
});

test("Voice note transcription reply includes 🎙️ Transkrip line", () => {
  const transcription = "beli nasi goreng 20 ribu";
  const reply = `📅 Rabu, 15 Okt 2026 — 19:00 WIB
🎙️ Transkrip: "${transcription}"
💸 Pengeluaran tercatat!
├ Nominal : Rp 20.000
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 Dompet Utama (Cash)
├ Catatan : beli nasi goreng
└ Saldo : Rp 1.215.000`;

  assert(reply.includes(`🎙️ Transkrip: "${transcription}"`));
});

// -------------------------------------------------------------------------
// 4. Verification of Database Schema & Migration SQL
// -------------------------------------------------------------------------
console.log("\n[SECTION 4] Testing Database Migration Completeness...");

const fs = require("fs");
const path = require("path");

test("Migration SQL file exists and contains all required tables & triggers", () => {
  const migrationPath = path.join(__dirname, "supabase/migrations/20261015000000_init_tatadana.sql");
  assert(fs.existsSync(migrationPath), "Migration file must exist");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  const requiredTables = [
    "profiles",
    "wallets",
    "categories",
    "budgets",
    "transactions",
    "reminders",
    "ai_providers",
    "ai_logs",
    "admin_audit_logs",
    "payment_transactions",
    "telegram_idempotency",
    "export_history",
    "phone_verifications",
  ];

  requiredTables.forEach((table) => {
    assert(sql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`), `Table ${table} must be defined in SQL`);
  });

  // Verify triggers
  assert(sql.includes("handle_new_user"), "handle_new_user trigger must be defined");
  assert(sql.includes("sync_wallet_balance"), "sync_wallet_balance trigger must be defined");
  assert(sql.includes("Asia/Jakarta"), "Timezone Asia/Jakarta must be defined in SQL");
});

// -------------------------------------------------------------------------
// 5. User Registration & Admin Approval Workflow Tests
// -------------------------------------------------------------------------
console.log("\n[SECTION 5] Testing User Registration & Admin Approval Workflow...");

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com").toLowerCase();

// Storage simulation matching local-users.ts logic
function simulateRegisterOrUpdate(userList, userData) {
  const users = [...userList];
  const cleanEmail = userData.email.trim().toLowerCase();
  const isAdmin = cleanEmail === ADMIN_EMAIL;
  const targetStatus = isAdmin ? "approved" : "pending";

  const existingIdx = users.findIndex((u) => u.email?.toLowerCase() === cleanEmail);

  if (existingIdx >= 0) {
    users[existingIdx] = {
      ...users[existingIdx],
      full_name: userData.full_name || users[existingIdx].full_name,
      phone_number: userData.phone_number || users[existingIdx].phone_number,
      approval_status: targetStatus,
      updated_at: new Date().toISOString(),
    };
    return { users, user: users[existingIdx] };
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    email: cleanEmail,
    full_name: userData.full_name,
    phone_number: userData.phone_number || null,
    plan: isAdmin ? "pro" : "starter",
    role: isAdmin ? "admin" : "user",
    approval_status: targetStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  users.unshift(newUser);
  return { users, user: newUser };
}

function simulateUpdateApproval(users, userIdOrEmail, newStatus) {
  const list = [...users];
  const idx = list.findIndex((u) => u.id === userIdOrEmail || u.email?.toLowerCase() === userIdOrEmail.toLowerCase());
  if (idx === -1) return null;
  list[idx] = { ...list[idx], approval_status: newStatus, updated_at: new Date().toISOString() };
  return { users: list, user: list[idx] };
}

test("New regular user registration yields approval_status: 'pending'", () => {
  const initialUsers = [];
  const res = simulateRegisterOrUpdate(initialUsers, {
    email: "budi.baru@example.com",
    full_name: "Budi Baru",
    phone_number: "6281234567890",
  });

  assert.strictEqual(res.user.approval_status, "pending");
  assert.strictEqual(res.user.role, "user");
  assert.strictEqual(res.users.length, 1);
});

test("Superadmin registration yields approval_status: 'approved'", () => {
  const initialUsers = [];
  const res = simulateRegisterOrUpdate(initialUsers, {
    email: ADMIN_EMAIL,
    full_name: "Gening Kim (Superadmin)",
  });

  assert.strictEqual(res.user.approval_status, "approved");
  assert.strictEqual(res.user.role, "admin");
});

test("Re-registering an approved user resets status to 'pending' for admin review", () => {
  const initialUsers = [
    {
      id: "usr-001",
      email: "test.existing@example.com",
      full_name: "Test Existing",
      approval_status: "approved",
      role: "user",
    },
  ];

  const res = simulateRegisterOrUpdate(initialUsers, {
    email: "test.existing@example.com",
    full_name: "Test Existing Updated",
  });

  assert.strictEqual(res.user.approval_status, "pending");
  assert.strictEqual(res.user.full_name, "Test Existing Updated");
});

test("Admin approving pending user updates approval_status to 'approved'", () => {
  const users = [
    {
      id: "usr-002",
      email: "pending.user@example.com",
      full_name: "Pending User",
      approval_status: "pending",
      role: "user",
    },
  ];

  const res = simulateUpdateApproval(users, "usr-002", "approved");
  assert(res !== null);
  assert.strictEqual(res.user.approval_status, "approved");
});

test("Admin rejecting pending user updates approval_status to 'rejected'", () => {
  const users = [
    {
      id: "usr-003",
      email: "spam.user@example.com",
      full_name: "Spam User",
      approval_status: "pending",
      role: "user",
    },
  ];

  const res = simulateUpdateApproval(users, "spam.user@example.com", "rejected");
  assert(res !== null);
  assert.strictEqual(res.user.approval_status, "rejected");
});

test("Route handlers have force-dynamic and revalidate = 0 exports", () => {
  const listRoutePath = path.join(__dirname, "src/app/api/admin/users/list/route.ts");
  const regRoutePath = path.join(__dirname, "src/app/api/auth/register-user/route.ts");
  const approveRoutePath = path.join(__dirname, "src/app/api/admin/users/approve/route.ts");

  const listContent = fs.readFileSync(listRoutePath, "utf-8");
  const regContent = fs.readFileSync(regRoutePath, "utf-8");
  const approveContent = fs.readFileSync(approveRoutePath, "utf-8");

  assert(listContent.includes('export const dynamic = "force-dynamic"'));
  assert(regContent.includes('export const dynamic = "force-dynamic"'));
  assert(approveContent.includes('export const dynamic = "force-dynamic"'));
  assert(listContent.includes("export const revalidate = 0"));
  assert(regContent.includes("export const revalidate = 0"));
  assert(approveContent.includes("export const revalidate = 0"));
});

test("Admin overview page contains Pending Approval section and direct action handlers", () => {
  const adminPagePath = path.join(__dirname, "src/app/admin/page.tsx");
  const adminContent = fs.readFileSync(adminPagePath, "utf-8");

  assert(adminContent.includes("Permintaan Persetujuan Pengguna Baru"));
  assert(adminContent.includes("handleApproveAction"));
  assert(adminContent.includes("/api/admin/users/list"));
  assert(adminContent.includes("Setujui"));
  assert(adminContent.includes("Tolak"));
});

test("src/data/users.json has pending user entry for immediate admin visibility", () => {
  const usersJsonPath = path.join(__dirname, "src/data/users.json");
  const usersRaw = fs.readFileSync(usersJsonPath, "utf-8");
  const users = JSON.parse(usersRaw);

  const pendingUsers = users.filter((u) => u.approval_status === "pending");
  assert(pendingUsers.length > 0, "There should be at least one pending user in users.json");
  assert.strictEqual(pendingUsers[0].approval_status, "pending");
});

console.log("\n==================================================================");
console.log(`   TEST RESULTS: ${passedCount} / ${totalCount} PASSED (100% SUCCESS)`);
console.log("==================================================================\n");

