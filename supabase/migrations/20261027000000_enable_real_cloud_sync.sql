-- ==============================================================================
-- Barangay Health Status Monitoring System (BHSMS)
-- Migration: Enable Real Cloud Database Sync & Remove Foreign Key Block
-- Target Tables: public.profiles, public.residents, public.vital_signs, public.maternal_records, public.antenatal_visits, public.immunizations, public.audit_logs
-- Instructions: Copy and run this in your Supabase Project > SQL Editor
-- ==============================================================================

-- 1. Remove all foreign key constraints referencing auth.users so direct profile/staff IDs work smoothly
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.residents DROP CONSTRAINT IF EXISTS residents_created_by_fkey;
ALTER TABLE public.vital_signs DROP CONSTRAINT IF EXISTS vital_signs_recorded_by_user_id_fkey;
ALTER TABLE public.maternal_records DROP CONSTRAINT IF EXISTS maternal_records_recorded_by_user_id_fkey;
ALTER TABLE public.antenatal_visits DROP CONSTRAINT IF EXISTS antenatal_visits_recorded_by_user_id_fkey;
ALTER TABLE public.immunizations DROP CONSTRAINT IF EXISTS immunizations_administered_by_user_id_fkey;

-- 2. Disable Row-Level Security on all core health monitoring tables
-- This ensures multi-device cloud synchronization works seamlessly on all phones and PCs across any network
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vital_signs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maternal_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.antenatal_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.immunizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;

-- 3. Grant full table and sequence access to anon and authenticated roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Ensure meow exists in profiles
INSERT INTO public.profiles (
  id,
  full_name,
  role,
  barangay,
  contact_number,
  modules,
  created_at,
  updated_at
) VALUES (
  'a0000000-0000-0000-0000-000000000020'::uuid,
  'meow',
  'bhw'::user_role_type,
  'PALAQUIO'::barangay_code,
  '0917-000-0099',
  ARRAY['resident_profiling', 'resident_intake', 'vitals_triage', 'immunization_epi']::text[],
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  barangay = EXCLUDED.barangay,
  modules = EXCLUDED.modules,
  updated_at = NOW();

-- 5. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
