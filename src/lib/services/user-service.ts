import { UserRole, BarangayCode, SystemModuleId } from '@/types/database';
import { UserSession } from '@/lib/context/auth-context';
import { createClient } from '@/utils/supabase/client';
import { getDefaultModulesForRole } from '@/lib/constants/modules';

export interface SystemUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  barangay: BarangayCode;
  employeeId: string;
  contactNumber?: string;
  password?: string;
  status: 'ACTIVE' | 'INACTIVE';
  stationName: string;
  modules: SystemModuleId[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  role: UserRole;
  barangay: BarangayCode;
  employeeId: string;
  contactNumber?: string;
  password?: string;
  modules?: SystemModuleId[];
}

const USERS_STORAGE_KEY = 'bhsms_system_users_v1';

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    fullName: 'LGU System Administrator',
    email: 'admin.it@bucay.gov.ph',
    role: 'admin',
    barangay: 'PALAQUIO',
    employeeId: 'EMP-ADM-005',
    contactNumber: '0917-888-0001',
    password: 'admin123',
    status: 'ACTIVE',
    stationName: 'Bucay IT & Health Ops Center',
    modules: getDefaultModulesForRole('admin'),
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000010',
    fullName: 'BHW@bucay',
    email: 'bhw@bucay',
    role: 'bhw',
    barangay: 'PALAQUIO',
    employeeId: 'BHW-BUCAY-01',
    contactNumber: '0917-888-0010',
    password: 'admin123',
    status: 'ACTIVE',
    stationName: 'Barangay PALAQUIO Health Station',
    modules: ['resident_profiling', 'resident_intake', 'vitals_triage', 'immunization_epi'],
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000011',
    fullName: 'Kat',
    email: 'kat@nurse.bucay',
    role: 'bhw',
    barangay: 'PALAQUIO',
    employeeId: 'KAT1',
    contactNumber: '0917-888-0011',
    password: 'admin123',
    status: 'ACTIVE',
    stationName: 'Barangay PALAQUIO Health Station',
    modules: ['immunization_epi', 'referral_management', 'maternal_care', 'patient_chart'],
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
  },
];

export class UserService {
  private static inMemoryUsers: SystemUser[] | null = null;

  public static getUsers(): SystemUser[] {
    if (typeof window === 'undefined') {
      if (this.inMemoryUsers) return this.inMemoryUsers;
      this.inMemoryUsers = JSON.parse(JSON.stringify(INITIAL_SYSTEM_USERS));
      return this.inMemoryUsers!;
    }

    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (!stored) {
        const cloned = JSON.parse(JSON.stringify(INITIAL_SYSTEM_USERS));
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cloned));
        this.inMemoryUsers = cloned;
        return cloned;
      }
      const parsed: SystemUser[] = JSON.parse(stored);
      // Purge legacy mock accounts and Lagangilang operator from storage
      const mockEmpIds = ['EMP-MHO-003', 'EMP-RHM-002', 'EMP-BHW-001', 'EMP-LGU-004'];
      const filtered = parsed.filter(
        (u) =>
          !mockEmpIds.includes(u.employeeId?.toUpperCase()) &&
          !u.email?.toLowerCase().includes('lagangilang') &&
          !u.stationName?.toLowerCase().includes('lagangilang') &&
          !u.fullName?.toLowerCase().includes('lagangilang')
      );

      // Ensure the system default administrator account (admin.it@bucay.gov.ph) is always present
      for (const initialUser of INITIAL_SYSTEM_USERS) {
        if (!filtered.some((u) => u.email.toLowerCase() === initialUser.email.toLowerCase())) {
          filtered.push(initialUser);
        }
      }
      if (filtered.length !== parsed.length) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filtered));
      }
      this.inMemoryUsers = filtered;
      return filtered;
    } catch {
      if (this.inMemoryUsers) return this.inMemoryUsers;
      return INITIAL_SYSTEM_USERS;
    }
  }

  public static setAndPersistUsers(users: SystemUser[]): void {
    this.saveUsers(users);
  }

  public static async fetchUsers(): Promise<SystemUser[]> {
    if (typeof window === 'undefined') {
      return this.inMemoryUsers || INITIAL_SYSTEM_USERS;
    }

    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.users) && data.users.length > 0) {
          this.saveUsers(data.users);
          return data.users;
        }
      }
    } catch {
      // Offline fallback
    }

    return this.getUsers();
  }

  private static saveUsers(users: SystemUser[]): void {
    this.inMemoryUsers = users;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      } catch (err) {
        console.error('Failed to persist users in storage:', err);
      }
    }
  }

  public static async createUser(
    input: CreateUserInput,
    actor: UserSession
  ): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
    if (!actor || actor.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only System Administrators can provision user accounts.' };
    }

    const currentUsers = this.getUsers();
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanEmpId = input.employeeId.trim().toUpperCase();

    // Check uniqueness
    const exists = currentUsers.some(
      (u) => u.email.toLowerCase() === cleanEmail || u.employeeId.toUpperCase() === cleanEmpId
    );
    if (exists) {
      return { success: false, error: 'User with identical email address or Employee ID already exists in registry.' };
    }

    const now = new Date().toISOString();
    let newId = crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`;
    let syncedWithCloudAuth = false;

    // 1. Attempt to provision directly into Supabase auth.users & public.profiles via server API
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          user: {
            fullName: input.fullName.trim(),
            email: cleanEmail,
            role: input.role,
            barangay: input.barangay,
            employeeId: cleanEmpId,
            contactNumber: input.contactNumber?.trim() || null,
            password: input.password?.trim() || 'WelcomeBucay2026!',
            modules: input.modules && input.modules.length > 0 ? input.modules : getDefaultModulesForRole(input.role),
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user?.id) {
          newId = result.user.id;
          syncedWithCloudAuth = true;
        }
      }
    } catch {
      // Offline fallback: will save to local store
    }

    const newUser: SystemUser = {
      id: newId,
      fullName: input.fullName.trim(),
      email: cleanEmail,
      role: input.role,
      barangay: input.barangay,
      employeeId: cleanEmpId,
      contactNumber: input.contactNumber?.trim() || undefined,
      password: input.password?.trim() || undefined,
      status: 'ACTIVE',
      stationName: `Barangay ${input.barangay} Health Station`,
      modules: input.modules && input.modules.length > 0 ? input.modules : getDefaultModulesForRole(input.role),
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newUser, ...currentUsers];
    this.saveUsers(updated);

    // If not synced via admin API, attempt client-side sync if profile row can be upserted
    if (!syncedWithCloudAuth) {
      try {
        const supabase = createClient();
        await supabase.from('profiles').upsert({
          id: newUser.id,
          full_name: newUser.fullName,
          role: newUser.role,
          barangay: newUser.barangay,
          contact_number: newUser.contactNumber || null,
          modules: newUser.modules,
          created_at: newUser.createdAt,
          updated_at: newUser.updatedAt,
        });
      } catch {
        // Offline fallback
      }
    }

    return { success: true, user: newUser };
  }

  public static async syncUsersToSupabase(): Promise<{
    success: boolean;
    syncedCount?: number;
    requiresServiceRoleKey?: boolean;
    error?: string;
  }> {
    const users = this.getUsers();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_all',
          users,
        }),
      });

      const data = await response.json();
      return data;
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error communicating with server.',
      };
    }
  }

  public static generateSupabaseSyncSQL(customUsers?: SystemUser[]): string {
    const users = customUsers && customUsers.length > 0 ? customUsers : this.getUsers();

    let sql = `-- ==============================================================================
-- Barangay Health Status Monitoring System (BHSMS)
-- Script: Sync All System Users to Supabase Authentication & Database
-- Target Tables: auth.users, auth.identities, public.profiles
-- Instructions: Paste and RUN this query inside your Supabase Project > SQL Editor
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE user_role_type AS ENUM ('admin', 'doctor', 'nurse', 'bhw', 'lgu_viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE barangay_code AS ENUM ('PALAQUIO', 'TABIOG', 'BABANGCAG');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS modules TEXT[] DEFAULT '{}';

DO $$
DECLARE
  v_uid UUID;
BEGIN
`;

    for (const u of users) {
      const cleanEmail = u.email.trim().toLowerCase().replace(/'/g, "''");
      const cleanName = u.fullName.trim().replace(/'/g, "''");
      const cleanEmpId = u.employeeId.trim().toUpperCase().replace(/'/g, "''");
      const cleanPassword = (u.password?.trim() || 'WelcomeBucay2026!').replace(/'/g, "''");
      const contactVal = u.contactNumber ? `'${u.contactNumber.trim().replace(/'/g, "''")}'` : 'NULL';
      const roleVal = u.role;
      const brgyVal = u.barangay;
      const modulesArr = (u.modules && u.modules.length > 0 ? u.modules : getDefaultModulesForRole(u.role))
        .map((m) => `'${m}'`)
        .join(', ');

      // Use a stable UUID if already valid uuid format, otherwise gen_random_uuid()
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(u.id);
      const uuidExpr = isUuid ? `'${u.id}'::uuid` : 'gen_random_uuid()';

      sql += `
  -- -------------------------------------------------------------
  -- Operator: ${cleanName} (${cleanEmail} / ${cleanEmpId})
  -- -------------------------------------------------------------
  SELECT id INTO v_uid FROM auth.users WHERE email = '${cleanEmail}' ${isUuid ? `OR id = '${u.id}'::uuid` : ''} LIMIT 1;

  IF v_uid IS NULL THEN
    v_uid := ${uuidExpr};
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
      v_uid,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      '${cleanEmail}',
      crypt('${cleanPassword}', gen_salt('bf')),
      NOW(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('full_name', '${cleanName}', 'role', '${roleVal}', 'barangay', '${brgyVal}', 'employee_id', '${cleanEmpId}'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      encrypted_password = EXCLUDED.encrypted_password,
      email_confirmed_at = COALESCE(auth.users.email_confirmed_at, NOW()),
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = NOW();

    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      v_uid,
      v_uid::text,
      v_uid,
      jsonb_build_object('sub', v_uid::text, 'email', '${cleanEmail}'),
      'email',
      NOW(),
      NOW(),
      NOW()
    ) ON CONFLICT (provider_id, provider) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = NOW();
  ELSE
    UPDATE auth.users
    SET
      email = '${cleanEmail}',
      encrypted_password = crypt('${cleanPassword}', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = jsonb_build_object('full_name', '${cleanName}', 'role', '${roleVal}', 'barangay', '${brgyVal}', 'employee_id', '${cleanEmpId}'),
      updated_at = NOW()
    WHERE id = v_uid;
  END IF;

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
    v_uid,
    '${cleanName}',
    '${roleVal}'::user_role_type,
    '${brgyVal}'::barangay_code,
    ${contactVal},
    ARRAY[${modulesArr}]::text[],
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    barangay = EXCLUDED.barangay,
    contact_number = EXCLUDED.contact_number,
    modules = EXCLUDED.modules,
    updated_at = NOW();
`;
    }

    sql += `
END $$;
`;
    return sql;
  }


  public static isSameUser(target: Pick<SystemUser, 'id' | 'email' | 'employeeId'>, actor: UserSession): boolean {
    if (!target || !actor) return false;
    if (target.id === actor.id) return true;
    if (target.email && actor.email && target.email.toLowerCase() === actor.email.toLowerCase()) return true;
    if (target.employeeId && actor.employeeId && target.employeeId.toUpperCase() === actor.employeeId.toUpperCase()) return true;
    return false;
  }

  public static async updateUser(
    id: string,
    updates: Partial<Pick<SystemUser, 'fullName' | 'role' | 'barangay' | 'contactNumber' | 'status' | 'modules'>>,
    actor: UserSession
  ): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
    if (!actor || actor.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only System Administrators can modify user accounts.' };
    }

    const currentUsers = this.getUsers();
    const index = currentUsers.findIndex((u) => u.id === id);
    if (index === -1) {
      return { success: false, error: 'User account not found.' };
    }

    const existing = currentUsers[index];
    const isModifyingIdentityOrRole =
      updates.fullName !== undefined ||
      updates.role !== undefined ||
      updates.barangay !== undefined ||
      updates.status !== undefined;

    if (this.isSameUser(existing, actor) && isModifyingIdentityOrRole) {
      return { success: false, error: 'Security constraint: You cannot modify or edit your own active operator account.' };
    }

    const updatedUser: SystemUser = {
      ...existing,
      ...updates,
      stationName: updates.barangay ? `Barangay ${updates.barangay} Health Station` : existing.stationName,
      updatedAt: new Date().toISOString(),
    };

    currentUsers[index] = updatedUser;
    this.saveUsers(currentUsers);

    // Try sync with Supabase
    try {
      const supabase = createClient();
      await supabase.from('profiles').update({
        full_name: updatedUser.fullName,
        role: updatedUser.role,
        barangay: updatedUser.barangay,
        contact_number: updatedUser.contactNumber || null,
        modules: updatedUser.modules,
        updated_at: updatedUser.updatedAt,
      }).eq('id', id);
    } catch {}

    return { success: true, user: updatedUser };
  }

  public static async updateUserModules(
    id: string,
    modules: SystemModuleId[],
    actor: UserSession
  ): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
    return this.updateUser(id, { modules }, actor);
  }

  public static hasUserModule(user: { modules?: SystemModuleId[]; role?: UserRole }, moduleId: SystemModuleId): boolean {
    if (!user) return false;
    if (user.modules && Array.isArray(user.modules)) {
      return user.modules.includes(moduleId);
    }
    if (user.role) {
      return getDefaultModulesForRole(user.role).includes(moduleId);
    }
    return false;
  }

  public static async toggleUserStatus(
    id: string,
    actor: UserSession
  ): Promise<{ success: boolean; user?: SystemUser; error?: string }> {
    if (!actor || actor.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Only System Administrators can alter account operational status.' };
    }

    const currentUsers = this.getUsers();
    const target = currentUsers.find((u) => u.id === id);
    if (!target) {
      return { success: false, error: 'User account not found.' };
    }

    if (this.isSameUser(target, actor)) {
      return { success: false, error: 'Security constraint: Cannot deactivate your own active administrative session.' };
    }

    const newStatus: 'ACTIVE' | 'INACTIVE' = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    return this.updateUser(id, { status: newStatus }, actor);
  }

  public static async deleteUser(
    id: string,
    actor: UserSession
  ): Promise<{ success: boolean; error?: string }> {
    if (!actor || actor.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Administrative role required to delete operators.' };
    }

    const currentUsers = this.getUsers();
    const target = currentUsers.find((u) => u.id === id);
    if (!target) {
      return { success: false, error: 'User account not found.' };
    }

    if (this.isSameUser(target, actor)) {
      return { success: false, error: 'Security constraint: Cannot delete your own active administrative account.' };
    }

    const filtered = currentUsers.filter((u) => u.id !== id);
    this.saveUsers(filtered);

    try {
      const supabase = createClient();
      await supabase.from('profiles').delete().eq('id', id);
    } catch {}

    return { success: true };
  }
}
