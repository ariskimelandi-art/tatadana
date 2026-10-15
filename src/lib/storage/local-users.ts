import fs from "fs";
import path from "path";
import os from "os";
import { Profile, ApprovalStatus } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");
const TMP_DATA_FILE = path.join(os.tmpdir(), "tatadana_users.json");

const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "geninggkimteaa@gmail.com").toLowerCase();

export interface StoredUser extends Profile {
  password_hash?: string;
}

// Global in-memory cache to persist across serverless invocations in the same container
declare global {
  // eslint-disable-next-line no-var
  var __tatadana_users__: StoredUser[] | undefined;
}

// Initial seed data if file doesn't exist
const DEFAULT_USERS: StoredUser[] = [
  {
    id: "admin-gening-001",
    email: ADMIN_EMAIL,
    full_name: "Gening Kim (Superadmin)",
    phone_number: "6281234567890",
    phone_verified: true,
    telegram_chat_id: 11223344,
    telegram_username: "gening_kim",
    plan: "pro",
    role: "admin",
    approval_status: "approved",
    currency: "IDR",
    monthly_tx_count: 5,
    last_tx_month: "2026-10",
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date().toISOString(),
    password_hash: "admin123",
  },
];

function loadUsersFromFile(): StoredUser[] {
  // 1. Try reading from TMP_DATA_FILE first (which has any runtime updates)
  if (fs.existsSync(TMP_DATA_FILE)) {
    try {
      const raw = fs.readFileSync(TMP_DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("Could not read TMP_DATA_FILE:", e);
    }
  }

  // 2. Try reading from DATA_FILE (src/data/users.json)
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn("Could not read DATA_FILE:", e);
    }
  }

  return DEFAULT_USERS;
}

export function getAllStoredUsers(): StoredUser[] {
  if (globalThis.__tatadana_users__ && globalThis.__tatadana_users__.length > 0) {
    return globalThis.__tatadana_users__;
  }

  const loaded = loadUsersFromFile();
  globalThis.__tatadana_users__ = loaded;
  return loaded;
}

export function saveStoredUsers(users: StoredUser[]) {
  // Always update global in-memory state
  globalThis.__tatadana_users__ = users;

  // 1. Always attempt saving to TMP_DATA_FILE (always writable on both Vercel & local OS)
  try {
    fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not write TMP_DATA_FILE:", e);
  }

  // 2. Attempt saving to src/data/users.json (works in local dev, may fail on read-only Vercel)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (e) {
    // Read-only filesystem on Vercel is expected; TMP_DATA_FILE and memory cache cover it
  }
}

export function findStoredUserByEmail(email: string): StoredUser | undefined {
  if (!email) return undefined;
  const users = getAllStoredUsers();
  return users.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
}

export function findStoredUserById(id: string): StoredUser | undefined {
  const users = getAllStoredUsers();
  return users.find((u) => u.id === id);
}

export function registerOrUpdateStoredUser(userData: {
  id?: string;
  email: string;
  full_name: string;
  phone_number?: string;
  password?: string;
}): StoredUser {
  const users = [...getAllStoredUsers()];
  const cleanEmail = userData.email.trim().toLowerCase();
  const isAdmin = cleanEmail === ADMIN_EMAIL;
  const targetStatus: ApprovalStatus = isAdmin ? "approved" : "pending";

  const existingIdx = users.findIndex((u) => u.email?.toLowerCase() === cleanEmail);

  if (existingIdx >= 0) {
    // Update existing user: reset approval_status to 'pending' if regular user
    users[existingIdx] = {
      ...users[existingIdx],
      full_name: userData.full_name || users[existingIdx].full_name,
      phone_number: userData.phone_number || users[existingIdx].phone_number,
      approval_status: targetStatus,
      updated_at: new Date().toISOString(),
      password_hash: userData.password || users[existingIdx].password_hash,
    };
    saveStoredUsers(users);
    return users[existingIdx];
  }

  // Create new user
  const newUser: StoredUser = {
    id: userData.id || `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: cleanEmail,
    full_name: userData.full_name,
    phone_number: userData.phone_number || null,
    phone_verified: true,
    telegram_chat_id: null,
    telegram_username: null,
    plan: isAdmin ? "pro" : "starter",
    role: isAdmin ? "admin" : "user",
    approval_status: targetStatus,
    currency: "IDR",
    monthly_tx_count: 0,
    last_tx_month: new Date().toISOString().slice(0, 7),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    password_hash: userData.password || "password123",
  };

  users.unshift(newUser);
  saveStoredUsers(users);
  return newUser;
}

export function updateStoredUserApproval(userId: string, status: ApprovalStatus): StoredUser | null {
  const users = [...getAllStoredUsers()];
  const idx = users.findIndex((u) => u.id === userId || u.email?.toLowerCase() === userId.toLowerCase());
  if (idx === -1) return null;

  users[idx] = {
    ...users[idx],
    approval_status: status,
    updated_at: new Date().toISOString(),
  };

  saveStoredUsers(users);
  return users[idx];
}

export function getPendingStoredUsers(): StoredUser[] {
  return getAllStoredUsers().filter(
    (u) => u.approval_status === "pending" && u.role !== "admin"
  );
}
