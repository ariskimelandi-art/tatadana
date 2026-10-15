-- ==============================================================================
-- TATADANA PRODUCTION DATABASE MIGRATION
-- Timezone: Asia/Jakarta (WIB)
-- Includes: Profiles, Wallets, Categories, Budgets, Transactions, Reminders,
--           AI Providers, AI Logs, Admin Audit Logs, Payments, Telegram Idempotency,
--           Export History, Phone Verifications, RLS, and Triggers.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_plan_type AS ENUM ('starter', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE wallet_type AS ENUM ('cash', 'bank', 'ewallet', 'investment');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM ('expense', 'income', 'transfer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT UNIQUE,
    phone_verified BOOLEAN DEFAULT false,
    telegram_chat_id BIGINT UNIQUE,
    telegram_username TEXT,
    telegram_bot_token TEXT,
    telegram_link_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    plan user_plan_type DEFAULT 'starter' NOT NULL,
    default_wallet_id UUID,
    role user_role_type DEFAULT 'user' NOT NULL,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')) NOT NULL,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    monthly_tx_count INT DEFAULT 0 NOT NULL,
    last_tx_month TEXT DEFAULT to_char(timezone('Asia/Jakarta', now()), 'YYYY-MM'),
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 4. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type wallet_type DEFAULT 'cash' NOT NULL,
    balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    color TEXT DEFAULT '#FF6B00' NOT NULL,
    icon TEXT DEFAULT 'wallet' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- Circular foreign key for default_wallet_id in profiles
DO $$ BEGIN
    ALTER TABLE public.profiles
    ADD CONSTRAINT fk_profiles_default_wallet
    FOREIGN KEY (default_wallet_id) REFERENCES public.wallets(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type transaction_type NOT NULL CHECK (type IN ('expense', 'income')),
    icon TEXT DEFAULT 'tag' NOT NULL,
    color TEXT DEFAULT '#FF6B00' NOT NULL,
    is_custom BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 6. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    monthly_limit NUMERIC(15, 2) NOT NULL,
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL CHECK (year >= 2024),
    alert_80_sent BOOLEAN DEFAULT false NOT NULL,
    alert_100_sent BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    CONSTRAINT unique_user_category_month_year UNIQUE (user_id, category_id, month, year)
);

-- 7. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    destination_wallet_id UUID REFERENCES public.wallets(id) ON DELETE RESTRICT,
    type transaction_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_date TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    receipt_image_url TEXT,
    receipt_items JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_receipt_parent BOOLEAN DEFAULT false NOT NULL,
    parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
    source TEXT DEFAULT 'web' CHECK (source IN ('web', 'telegram_text', 'telegram_receipt', 'telegram_voice')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 8. REMINDERS TABLE
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    frequency TEXT DEFAULT '1x' CHECK (frequency IN ('1x', '2x')) NOT NULL,
    time_1 TIME DEFAULT '20:00:00' NOT NULL,
    time_2 TIME DEFAULT '12:00:00' NOT NULL,
    custom_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 9. AI PROVIDERS TABLE
CREATE TABLE IF NOT EXISTS public.ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL CHECK (provider_name IN ('gemini', 'openai', 'deepseek')),
    model_name TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    is_default BOOLEAN DEFAULT false NOT NULL,
    priority INT DEFAULT 1 NOT NULL,
    failover_mode TEXT DEFAULT 'single' CHECK (failover_mode IN ('single', 'parallel')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 10. AI LOGS TABLE
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    feature TEXT NOT NULL CHECK (feature IN ('nlp_text', 'receipt_ocr', 'voice_transcribe', 'financial_advisor', 'category_recommendation')),
    input_snippet TEXT,
    output_snippet TEXT,
    prompt_tokens INT DEFAULT 0 NOT NULL,
    completion_tokens INT DEFAULT 0 NOT NULL,
    latency_ms INT DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error')) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 11. ADMIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 12. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id TEXT UNIQUE NOT NULL,
    plan user_plan_type NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('midtrans', 'manual_transfer')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'approved', 'rejected')) NOT NULL,
    proof_image_url TEXT,
    midtrans_snap_token TEXT,
    midtrans_response JSONB,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 13. TELEGRAM IDEMPOTENCY TABLE
CREATE TABLE IF NOT EXISTS public.telegram_idempotency (
    update_id BIGINT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    chat_id BIGINT,
    command TEXT,
    processed_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL,
    status TEXT DEFAULT 'processed' NOT NULL
);

-- 14. EXPORT HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'xlsx')),
    period_start DATE,
    period_end DATE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- 15. PHONE VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('Asia/Jakarta', now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat ON public.profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON public.ai_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.admin_audit_logs(admin_id, created_at DESC);

-- ==============================================================================
-- TRIGGERS & FUNCTIONS
-- ==============================================================================

-- 1. AUTO-UPDATE UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('Asia/Jakarta', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_payment_tx_updated_at BEFORE UPDATE ON public.payment_transactions FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER trg_ai_providers_updated_at BEFORE UPDATE ON public.ai_providers FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();

-- 2. AUTO INITIALIZE NEW USER (WALLETS, CATEGORIES, REMINDER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_wallet_id UUID;
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        avatar_url,
        phone_number,
        phone_verified,
        role,
        approval_status,
        plan
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'phone_number',
        COALESCE((NEW.raw_user_meta_data->>'phone_verified')::boolean, false),
        CASE
            WHEN LOWER(NEW.email) = 'geninggkimteaa@gmail.com' THEN 'admin'::public.user_role_type
            ELSE COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role_type, 'user'::public.user_role_type)
        END,
        CASE
            WHEN LOWER(NEW.email) = 'geninggkimteaa@gmail.com' THEN 'approved'
            ELSE 'pending'
        END,
        CASE
            WHEN LOWER(NEW.email) = 'geninggkimteaa@gmail.com' THEN 'pro'::public.user_plan_type
            ELSE 'starter'::public.user_plan_type
        END
    );

    -- Create Default Cash Wallet
    INSERT INTO public.wallets (
        user_id,
        name,
        type,
        balance,
        is_default,
        color,
        icon
    ) VALUES (
        NEW.id,
        'Dompet Utama (Cash)',
        'cash',
        0.00,
        true,
        '#FF6B00',
        'wallet'
    ) RETURNING id INTO new_wallet_id;

    -- Create Secondary Bank Wallet
    INSERT INTO public.wallets (
        user_id,
        name,
        type,
        balance,
        is_default,
        color,
        icon
    ) VALUES (
        NEW.id,
        'Rekening BCA',
        'bank',
        0.00,
        false,
        '#2563EB',
        'landmark'
    );

    -- Update Profile with Default Wallet ID
    UPDATE public.profiles
    SET default_wallet_id = new_wallet_id
    WHERE id = NEW.id;

    -- Insert Default Recommended Expense Categories
    INSERT INTO public.categories (user_id, name, type, icon, color, is_custom) VALUES
        (NEW.id, 'Makanan & Minuman', 'expense', '🍜', '#FF6B00', false),
        (NEW.id, 'Transportasi', 'expense', '🚗', '#3B82F6', false),
        (NEW.id, 'Hiburan', 'expense', '🎮', '#8B5CF6', false),
        (NEW.id, 'Tagihan & Utilitas', 'expense', '🏠', '#EF4444', false),
        (NEW.id, 'Kesehatan', 'expense', '💊', '#10B981', false),
        (NEW.id, 'Belanja', 'expense', '👕', '#EC4899', false),
        (NEW.id, 'Pendidikan', 'expense', '📚', '#F59E0B', false);

    -- Insert Default Income Categories
    INSERT INTO public.categories (user_id, name, type, icon, color, is_custom) VALUES
        (NEW.id, 'Gaji Pokok', 'income', '💰', '#10B981', false),
        (NEW.id, 'Freelance / Side Job', 'income', '💻', '#06B6D4', false),
        (NEW.id, 'Investasi & Bunga', 'income', '📈', '#6366F1', false);

    -- Insert Default Reminder settings
    INSERT INTO public.reminders (user_id, is_active, frequency, time_1, time_2)
    VALUES (NEW.id, true, '1x', '20:00:00', '12:00:00');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. SYNC WALLET BALANCES ON TRANSACTION INSERT/UPDATE/DELETE
CREATE OR REPLACE FUNCTION public.sync_wallet_balance()
RETURNS TRIGGER AS $$
DECLARE
    cur_month TEXT;
BEGIN
    cur_month := to_char(timezone('Asia/Jakarta', now()), 'YYYY-MM');

    -- TRANSACTION INSERT
    IF (TG_OP = 'INSERT') THEN
        -- Check and update monthly tx count
        UPDATE public.profiles
        SET
            monthly_tx_count = CASE
                WHEN last_tx_month = cur_month THEN monthly_tx_count + 1
                ELSE 1
            END,
            last_tx_month = cur_month
        WHERE id = NEW.user_id;

        -- Adjust wallet
        IF NEW.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' AND NEW.destination_wallet_id IS NOT NULL THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
            UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.destination_wallet_id;
        END IF;
        RETURN NEW;

    -- TRANSACTION DELETE
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' AND OLD.destination_wallet_id IS NOT NULL THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.destination_wallet_id;
        END IF;
        RETURN OLD;

    -- TRANSACTION UPDATE
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Revert old
        IF OLD.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' AND OLD.destination_wallet_id IS NOT NULL THEN
            UPDATE public.wallets SET balance = balance + OLD.amount WHERE id = OLD.wallet_id;
            UPDATE public.wallets SET balance = balance - OLD.amount WHERE id = OLD.destination_wallet_id;
        END IF;

        -- Apply new
        IF NEW.type = 'expense' THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' AND NEW.destination_wallet_id IS NOT NULL THEN
            UPDATE public.wallets SET balance = balance - NEW.amount WHERE id = NEW.wallet_id;
            UPDATE public.wallets SET balance = balance + NEW.amount WHERE id = NEW.destination_wallet_id;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_wallet_balance ON public.transactions;
CREATE TRIGGER trg_sync_wallet_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE PROCEDURE public.sync_wallet_balance();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Users can select/update own profile; admins can select all
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Wallets: user owns wallets; admins can view
CREATE POLICY "Users manage own wallets" ON public.wallets
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Categories: user owns categories
CREATE POLICY "Users manage own categories" ON public.categories
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL OR public.is_admin());

-- Budgets: user owns budgets
CREATE POLICY "Users manage own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Transactions: user owns transactions; admins can select for troubleshooting
CREATE POLICY "Users manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Reminders: user owns reminders
CREATE POLICY "Users manage own reminders" ON public.reminders
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- AI Providers: Only Admins can manage
CREATE POLICY "Admin manage ai providers" ON public.ai_providers
    FOR ALL USING (public.is_admin());

-- AI Logs: Users can view own logs; admins can view all
CREATE POLICY "AI logs visibility" ON public.ai_logs
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Admin Audit Logs: Admins only
CREATE POLICY "Admin audit logs visibility" ON public.admin_audit_logs
    FOR ALL USING (public.is_admin());

-- Payments: Users view own payments; admins manage all
CREATE POLICY "User view own payments" ON public.payment_transactions
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "User insert own payments" ON public.payment_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin update payments" ON public.payment_transactions
    FOR UPDATE USING (public.is_admin());

-- Export history: user owns
CREATE POLICY "Users manage export history" ON public.export_history
    FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Phone verifications: public can insert and select for verification check
CREATE POLICY "Public insert phone verification" ON public.phone_verifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public select phone verification" ON public.phone_verifications
    FOR SELECT USING (true);

CREATE POLICY "Public update phone verification" ON public.phone_verifications
    FOR UPDATE USING (true);
