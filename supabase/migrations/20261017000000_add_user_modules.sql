-- ==============================================================================
-- Migration: Add Modular Permissions (modules) to User Profiles
-- Allows enabling and disabling specific clinical and administrative functions
-- on a per-user basis (Modular RBAC)
-- ==============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS modules TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.profiles.modules IS 'List of enabled system module identifiers for granular per-user access control';
