-- ==============================================================================
-- Barangay Health Status Monitoring System (BHSMS)
-- Migration: Synchronize Personnel & Purge Unauthorized Accounts
-- Target Tables: auth.users, auth.identities, public.profiles
-- Run this in your Supabase Project > SQL Editor (project ref: jvvpuzqgwqzqdzmojxlu)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Ensure Enums exist
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('admin', 'doctor', 'nurse', 'bhw', 'lgu_viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE barangay_code AS ENUM ('PALAQUIO', 'TABIOG', 'BABANGCAG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Ensure public.profiles table & columns exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role_type NOT NULL DEFAULT 'bhw',
  barangay barangay_code NOT NULL DEFAULT 'PALAQUIO',
  contact_number TEXT,
  modules TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS modules TEXT[] DEFAULT '{}';

-- Enable Row Level Security
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

-- 3. Execute Synchronization & Purge
DO $$
DECLARE
  v_uid UUID;
BEGIN

  -- ----------------------------------------------------------------------------
  -- Step A: Purge Lagangilang Account (admin.it@lagangilang.gov.ph)
  -- ----------------------------------------------------------------------------
  DELETE FROM auth.users WHERE email = 'admin.it@lagangilang.gov.ph';
  DELETE FROM public.profiles WHERE full_name ILIKE '%lagangilang%' OR contact_number = 'admin.it@lagangilang.gov.ph';


  -- ----------------------------------------------------------------------------
  -- Step B: Synchronize Operator LGU BUCAY (bhsbucay@bucay.gov.com / ADMINBUCAY)
  -- ----------------------------------------------------------------------------
  SELECT id INTO v_uid FROM auth.users WHERE email = 'bhsbucay@bucay.gov.com' LIMIT 1;

  IF v_uid IS NULL THEN
    v_uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'bhsbucay@bucay.gov.com', crypt('admin123', gen_salt('bf')), NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "LGU BUCAY", "role": "admin", "barangay": "PALAQUIO", "employee_id": "ADMINBUCAY"}'::jsonb,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      encrypted_password = EXCLUDED.encrypted_password,
      email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = NOW();

    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_uid, v_uid::text, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'bhsbucay@bucay.gov.com'),
      'email', NOW(), NOW(), NOW()
    ) ON CONFLICT (provider_id, provider) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = NOW();
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = crypt('admin123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = '{"full_name": "LGU BUCAY", "role": "admin", "barangay": "PALAQUIO", "employee_id": "ADMINBUCAY"}'::jsonb,
      updated_at = NOW()
    WHERE id = v_uid;
  END IF;

  INSERT INTO public.profiles (id, full_name, role, barangay, contact_number, modules, created_at, updated_at)
  VALUES (
    v_uid, 'LGU BUCAY', 'admin'::user_role_type, 'PALAQUIO'::barangay_code,
    '0917-888-0002', ARRAY['hospital_referrals', 'epidemiology_analytics', 'operations_backup', 'user_management']::text[],
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name, role = EXCLUDED.role, barangay = EXCLUDED.barangay,
    contact_number = EXCLUDED.contact_number, modules = EXCLUDED.modules, updated_at = NOW();


  -- ----------------------------------------------------------------------------
  -- Step C: Synchronize Default LGU Administrator (admin.it@bucay.gov.ph)
  -- ----------------------------------------------------------------------------
  SELECT id INTO v_uid 
  FROM auth.users 
  WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid 
     OR email = 'admin.it@bucay.gov.ph' 
  LIMIT 1;

  IF v_uid IS NOT NULL THEN
    -- If already exists by either ID or email, safely update without violating primary key
    UPDATE auth.users
    SET
      email = 'admin.it@bucay.gov.ph',
      encrypted_password = crypt('admin123', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = '{"full_name": "LGU IT Administrator", "role": "admin", "barangay": "PALAQUIO", "employee_id": "EMP-ADM-001"}'::jsonb,
      updated_at = NOW()
    WHERE id = v_uid;
  ELSE
    v_uid := 'a0000000-0000-0000-0000-000000000001'::uuid;
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'admin.it@bucay.gov.ph', crypt('admin123', gen_salt('bf')), NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "LGU IT Administrator", "role": "admin", "barangay": "PALAQUIO", "employee_id": "EMP-ADM-001"}'::jsonb,
      NOW(), NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      encrypted_password = EXCLUDED.encrypted_password,
      email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = NOW();

    INSERT INTO auth.identities (
      id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      v_uid, v_uid::text, v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', 'admin.it@bucay.gov.ph'),
      'email', NOW(), NOW(), NOW()
    ) ON CONFLICT (provider_id, provider) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = NOW();
  END IF;

  INSERT INTO public.profiles (id, full_name, role, barangay, contact_number, modules, created_at, updated_at)
  VALUES (
    v_uid, 'LGU IT Administrator', 'admin'::user_role_type, 'PALAQUIO'::barangay_code,
    '0917-888-0001', ARRAY['hospital_referrals', 'epidemiology_analytics', 'operations_backup', 'user_management']::text[],
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name, role = EXCLUDED.role, barangay = EXCLUDED.barangay,
    contact_number = EXCLUDED.contact_number, modules = EXCLUDED.modules, updated_at = NOW();

END $$;
