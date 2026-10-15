import fs from "fs";
import path from "path";

// Load .env.local manually
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let val = match[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("=== SUPABASE CONNECTION TESTER ===");
console.log("URL:", supabaseUrl || "(Not set)");
console.log("Anon Key:", anonKey ? `${anonKey.slice(0, 15)}...` : "(Not set)");
console.log("Service Key:", serviceKey ? `${serviceKey.slice(0, 15)}...` : "(Not set)");

if (!supabaseUrl || supabaseUrl.includes("your-supabase-project") || supabaseUrl.includes("dummy")) {
  console.log("\n⚠️ Supabase URL masih dummy / belum diisi dengan project asli.");
  console.log("Silakan buat project di https://supabase.com dan masukkan URL serta API Keys ke .env.local.");
  process.exit(0);
}

try {
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (res.status === 200 || res.status === 404 || res.status === 401) {
    console.log(`\nResponse status: ${res.status}`);
    if (res.status === 200) {
      console.log("✅ BERHASIL TERHUBUNG KE SUPABASE!");
    } else if (res.status === 401) {
      console.log("❌ Kunci API (Anon Key) tidak valid atau salah.");
    } else {
      console.log("✅ Server Supabase merespons.");
    }
  }
} catch (err) {
  console.error("❌ Gagal menghubungi URL Supabase:", err.message);
}
