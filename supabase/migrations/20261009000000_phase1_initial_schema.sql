-- ==============================================================================
-- Barangay Health Status Monitoring System (BHSMS)
-- Phase 1: Relational Schema & Row-Level Security
-- Targeted Barangays: Palaquio, Tabiog, Babangcag (Lagangilang, Abra)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('admin', 'doctor', 'nurse', 'bhw', 'lgu_viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE barangay_code AS ENUM ('PALAQUIO', 'TABIOG', 'BABANGCAG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE triage_severity AS ENUM ('NORMAL', 'ELEVATED', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vaccine_status AS ENUM ('scheduled', 'administered', 'missed', 'exempted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. USER PROFILES (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role_type NOT NULL DEFAULT 'bhw',
  barangay barangay_code NOT NULL DEFAULT 'PALAQUIO',
  contact_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. HOUSEHOLDS
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay barangay_code NOT NULL,
  purok TEXT NOT NULL,
  household_number TEXT NOT NULL,
  head_resident_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (barangay, purok, household_number)
);

-- 5. RESIDENTS REGISTRY (Deduplication & UPI)
CREATE SEQUENCE IF NOT EXISTS resident_upi_seq START 1000;

CREATE TABLE IF NOT EXISTS public.residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi TEXT UNIQUE NOT NULL,
  household_id UUID REFERENCES public.households(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  suffix TEXT,
  alias TEXT,
  date_of_birth DATE NOT NULL,
  biological_sex gender_type NOT NULL,
  civil_status TEXT NOT NULL DEFAULT 'single',
  barangay barangay_code NOT NULL,
  purok TEXT NOT NULL,
  contact_number TEXT,
  philhealth_id TEXT,
  is_pregnant BOOLEAN NOT NULL DEFAULT false,
  soundex_key TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_residents_soundex ON public.residents(soundex_key);
CREATE INDEX IF NOT EXISTS idx_residents_barangay_purok ON public.residents(barangay, purok);
CREATE INDEX IF NOT EXISTS idx_residents_dob ON public.residents(date_of_birth);

-- 6. VITAL SIGNS & CLINICAL TRIAGE
CREATE TABLE IF NOT EXISTS public.vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  recorded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  systolic_bp INT NOT NULL CHECK (systolic_bp BETWEEN 40 AND 300),
  diastolic_bp INT NOT NULL CHECK (diastolic_bp BETWEEN 30 AND 200),
  heart_rate_bpm INT NOT NULL CHECK (heart_rate_bpm BETWEEN 30 AND 250),
  respiratory_rate_cpm INT NOT NULL CHECK (respiratory_rate_cpm BETWEEN 8 AND 80),
  temperature_celsius NUMERIC(4, 1) NOT NULL CHECK (temperature_celsius BETWEEN 30.0 AND 45.0),
  weight_kg NUMERIC(5, 2) NOT NULL CHECK (weight_kg > 0.4 AND weight_kg <= 300),
  height_cm NUMERIC(5, 2) NOT NULL CHECK (height_cm >= 30 AND height_cm <= 250),
  bmi NUMERIC(4, 1) NOT NULL,
  severity triage_severity NOT NULL DEFAULT 'NORMAL',
  clinical_flags TEXT[] NOT NULL DEFAULT '{}',
  referral_recommended BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vital_signs_resident ON public.vital_signs(resident_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_severity ON public.vital_signs(severity);
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_at ON public.vital_signs(recorded_at DESC);

-- 7. MATERNAL HEALTH RECORDS
CREATE TABLE IF NOT EXISTS public.maternal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  gravida INT NOT NULL DEFAULT 1,
  para INT NOT NULL DEFAULT 0,
  full_term INT NOT NULL DEFAULT 0,
  preterm INT NOT NULL DEFAULT 0,
  abortion INT NOT NULL DEFAULT 0,
  living_children INT NOT NULL DEFAULT 0,
  lmp DATE NOT NULL,
  edd DATE NOT NULL,
  high_risk_flags TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  recorded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.antenatal_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maternal_record_id UUID NOT NULL REFERENCES public.maternal_records(id) ON DELETE CASCADE,
  visit_number INT NOT NULL CHECK (visit_number >= 1),
  gestational_age_weeks INT NOT NULL CHECK (gestational_age_weeks >= 0),
  fundic_height_cm NUMERIC(4, 1),
  fetal_heart_tone_bpm INT,
  iron_folic_acid_distributed BOOLEAN NOT NULL DEFAULT false,
  systolic_bp INT NOT NULL,
  diastolic_bp INT NOT NULL,
  weight_kg NUMERIC(5, 2) NOT NULL,
  notes TEXT,
  recorded_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PEDIATRIC IMMUNIZATION (EPI)
CREATE TABLE IF NOT EXISTS public.immunizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID NOT NULL REFERENCES public.residents(id) ON DELETE CASCADE,
  vaccine_code TEXT NOT NULL,
  dose_number INT NOT NULL DEFAULT 1,
  status vaccine_status NOT NULL DEFAULT 'scheduled',
  scheduled_date DATE NOT NULL,
  administered_date DATE,
  batch_number TEXT,
  administered_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_immunizations_resident ON public.immunizations(resident_id);
CREATE INDEX IF NOT EXISTS idx_immunizations_defaulters ON public.immunizations(status, scheduled_date);

-- 9. DISEASE SURVEILLANCE LOGS
CREATE TABLE IF NOT EXISTS public.disease_surveillance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay barangay_code NOT NULL,
  disease_category TEXT NOT NULL, -- e.g., 'ARI', 'AGE', 'SUSPECTED_DENGUE', 'TUBERCULOSIS'
  case_count INT NOT NULL DEFAULT 1,
  epi_week INT NOT NULL CHECK (epi_week BETWEEN 1 AND 53),
  epi_year INT NOT NULL,
  notes TEXT,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. IMMUTABLE AUDIT LOGS (RA 10173 Compliance)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 11. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.antenatal_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immunizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_surveillance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper to fetch user role safely
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role_type
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- PROFILES Policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can view and manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- RESIDENTS Policies
CREATE POLICY "Clinical staff and BHWs can read residents"
  ON public.residents FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'doctor', 'nurse', 'bhw'));

CREATE POLICY "Staff can insert residents"
  ON public.residents FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('admin', 'doctor', 'nurse', 'bhw'));

CREATE POLICY "Staff can update residents"
  ON public.residents FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'doctor', 'nurse', 'bhw'))
  WITH CHECK (public.get_current_user_role() IN ('admin', 'doctor', 'nurse', 'bhw'));

-- VITALS Policies
CREATE POLICY "Clinical staff and BHWs can view vitals"
  ON public.vital_signs FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() IN ('admin', 'doctor', 'nurse', 'bhw'));

CREATE POLICY "Staff can insert vitals"
  ON public.vital_signs FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() IN ('admin', 'doctor', 'nurse', 'bhw'));

-- AUDIT LOGS Policy: Append-only for system, Admins can inspect
CREATE POLICY "Staff can insert audit log records"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'admin');
