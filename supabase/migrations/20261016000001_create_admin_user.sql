-- ==============================================================================
-- Barangay Health Status Monitoring System (BHSMS)
-- Migration: Create Default LGU System Administrator User & User Profiles Schema
-- Self-contained: Ensures required enums and public.profiles table exist first.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM ENUMS (Safe idempotency)
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('admin', 'doctor', 'nurse', 'bhw', 'lgu_viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE barangay_code AS ENUM ('PALAQUIO', 'TABIOG', 'BABANGCAG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. USER PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role_type NOT NULL DEFAULT 'bhw',
  barangay barangay_code NOT NULL DEFAULT 'PALAQUIO',
  contact_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view and manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. PROVISION DEFAULT LGU SYSTEM ADMINISTRATOR USER
DO $$
DECLARE
  admin_uid UUID := 'a0000000-0000-0000-0000-000000000001';
  admin_email TEXT := 'admin.it@bucay.gov.ph';
  admin_password TEXT := 'admin123';
BEGIN
  -- Insert into auth.users if not already existing
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = admin_uid OR email = admin_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "LGU System Administrator", "role": "admin", "barangay": "PALAQUIO", "employee_id": "EMP-ADM-005"}'::jsonb,
      NOW(),
      NOW()
    );
  ELSE
    -- Update existing user credentials if needed
    UPDATE auth.users
    SET
      encrypted_password = crypt(admin_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = '{"full_name": "LGU System Administrator", "role": "admin", "barangay": "PALAQUIO", "employee_id": "EMP-ADM-005"}'::jsonb,
      updated_at = NOW()
    WHERE email = admin_email OR id = admin_uid;
  END IF;

  -- Upsert into public.profiles
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    barangay,
    contact_number,
    created_at,
    updated_at
  ) VALUES (
    admin_uid,
    'LGU System Administrator',
    'admin'::user_role_type,
    'PALAQUIO'::barangay_code,
    '0917-888-0001',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    barangay = EXCLUDED.barangay,
    contact_number = EXCLUDED.contact_number,
    updated_at = NOW();

END $$;
