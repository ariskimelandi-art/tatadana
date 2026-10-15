# TataDana Engineering & Architecture Standards

## 1. Core Identity & Language Standards
- **App Language**: 100% Indonesian for all UI copy, bot replies, error toasts, and push notifications.
- **Timezone**: Strictly `Asia/Jakarta` (WIB, UTC+7). Database default timestamps, date conversions, and bot notifications must always format in WIB.
- **Color Identity**: Modern Fintech Orange (`#FF6B00`) on crisp light/white backgrounds (`#FFFFFF`, `#F8FAFC`, `#F1F5F9`). Avoid dark mode as the default experience.

## 2. Telegram Bot Integration
- **Shared Bot Architecture**: Single shared Telegram Bot across all users. Users are matched by `telegram_chat_id`, deep-link `telegram_link_token`, or verified Indonesian phone number (`phone_number`).
- **Idempotency**: All webhook requests must verify `update_id` in `telegram_idempotency` before any transaction processing to prevent duplicate records from Telegram retries.
- **Encryption**: Telegram bot tokens and third-party AI provider API keys must always be stored encrypted using AES-256 (`encryptApiKey`) in PostgreSQL.
- **Natural Language Parsing**: Never use naive regex for transaction parsing. All natural language text and transcribed audio must be routed to LLM with structured output (`{ jenis, nominal, kategori, catatan, is_ambiguous }`).
- **Plan Enforcement**: Starter tier is capped at 50 transactions/month and cannot use receipt OCR. Never silently drop requests; always return friendly Indonesian guidance with upgrade links.

## 3. Database & Security Standards (Supabase)
- **RLS (Row Level Security)**: Enabled on all tables. Regular users access only their own rows (`auth.uid() = user_id`).
- **Admin Access**: Administrative operations (audit logs, AI provider management, impersonation, payment approvals) use the Service Role Admin client (`getAdminClient()`).
- **Wallet Balance Automation**: PostgreSQL trigger `sync_wallet_balance()` updates wallet balances atomically upon insert, update, or deletion of transactions.
