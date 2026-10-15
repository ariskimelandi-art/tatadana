-- ==============================================================================
-- TATADANA MIGRATION: USER APPROVAL SYSTEM (BY SUPERADMIN geninggkimteaa@gmail.com)
-- ==============================================================================

-- 1. Tambah kolom email dan approval_status ke tabel profiles
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')) NOT NULL;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 2. Pastikan akun admin geninggkimteaa@gmail.com otomatis disetujui & superadmin
UPDATE public.profiles
SET 
    role = 'admin',
    approval_status = 'approved',
    plan = 'pro'
WHERE LOWER(email) = 'geninggkimteaa@gmail.com';

-- 3. Perbarui trigger handle_new_user() agar user baru default 'pending' & admin langsung 'approved'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_wallet_id UUID;
    is_superadmin BOOLEAN;
BEGIN
    is_superadmin := (LOWER(NEW.email) = 'geninggkimteaa@gmail.com');

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
        CASE WHEN is_superadmin THEN 'admin'::public.user_role_type ELSE 'user'::public.user_role_type END,
        CASE WHEN is_superadmin THEN 'approved' ELSE 'pending' END,
        CASE WHEN is_superadmin THEN 'pro'::public.user_plan_type ELSE 'starter'::public.user_plan_type END
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        approval_status = CASE WHEN is_superadmin THEN 'approved' ELSE public.profiles.approval_status END,
        role = CASE WHEN is_superadmin THEN 'admin'::public.user_role_type ELSE public.profiles.role END;

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
    VALUES (NEW.id, true, '1x', '20:00:00', '12:00:00')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
