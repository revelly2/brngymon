import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { SystemUser, INITIAL_SYSTEM_USERS } from '@/lib/services/user-service';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    if (adminClient) {
      const { data: profiles, error } = await adminClient
        .from('profiles')
        .select('*');
      if (!error && profiles && profiles.length > 0) {
        const mappedUsers: SystemUser[] = profiles.map((p) => {
          const matchingSeed = INITIAL_SYSTEM_USERS.find(
            (u) => u.id === p.id || u.fullName.toLowerCase() === p.full_name.toLowerCase()
          );
          const hasEmailInContact = p.contact_number && p.contact_number.includes('@');
          const email = hasEmailInContact
            ? p.contact_number
            : (matchingSeed?.email || `${p.full_name.toLowerCase().replace(/[^a-z0-9]/g, '')}@bucay.gov.ph`);

          return {
            id: p.id,
            fullName: p.full_name,
            email,
            role: p.role,
            barangay: p.barangay,
            employeeId: matchingSeed?.employeeId || p.id.slice(0, 8).toUpperCase(),
            contactNumber: hasEmailInContact ? undefined : (p.contact_number || undefined),
            password: matchingSeed?.password || 'admin123',
            status: 'ACTIVE' as const,
            stationName: `Barangay ${p.barangay} Health Station`,
            modules: p.modules && p.modules.length > 0 ? p.modules : ['resident_profiling', 'resident_intake', 'vitals_triage', 'immunization_epi'],
            createdAt: p.created_at || new Date().toISOString(),
            updatedAt: p.updated_at || new Date().toISOString(),
          };
        });
        return NextResponse.json({ success: true, source: 'supabase', users: mappedUsers, profiles });
      }
    }
    return NextResponse.json({ success: true, source: 'local', users: INITIAL_SYSTEM_USERS });
  } catch {
    return NextResponse.json({ success: true, source: 'local', users: INITIAL_SYSTEM_USERS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, user, users } = body;

    const adminClient = createAdminClient();

    if (action === 'create' && user) {
      const email = user.email.trim().toLowerCase();
      const password = user.password?.trim() || 'WelcomeBucay2026!';
      const assignedId = user.id || crypto.randomUUID();

      if (adminClient) {
        // Upsert directly into Supabase public.profiles
        await adminClient.from('profiles').upsert({
          id: assignedId,
          full_name: user.fullName,
          role: user.role,
          barangay: user.barangay,
          contact_number: user.contactNumber || null,
          modules: user.modules || [],
          updated_at: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        user: {
          ...user,
          id: assignedId,
        },
      });
    }

    if (action === 'sync_all' && Array.isArray(users)) {
      if (!adminClient) {
        return NextResponse.json({
          success: true,
          syncedCount: users.length,
          totalCount: users.length,
          localOnly: true,
        });
      }
      const results: { email: string; success: boolean; error?: string }[] = [];
      const { data: existingAuthUsers } = await adminClient.auth.admin.listUsers();
      const existingList = existingAuthUsers?.users || [];

      for (const item of users as SystemUser[]) {
        try {
          const email = item.email.trim().toLowerCase();
          const password = item.password?.trim() || 'WelcomeBucay2026!';

          let targetAuthUser = existingList.find((u) => u.email?.toLowerCase() === email);

          if (!targetAuthUser) {
            const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
              email,
              password,
              email_confirm: true,
              user_metadata: {
                full_name: item.fullName,
                role: item.role,
                barangay: item.barangay,
                employee_id: item.employeeId,
              },
            });

            if (createErr) {
              results.push({ email, success: false, error: createErr.message });
              continue;
            }
            targetAuthUser = created.user;
          }

          const { error: pErr } = await adminClient.from('profiles').upsert({
            id: targetAuthUser.id,
            full_name: item.fullName,
            role: item.role,
            barangay: item.barangay,
            contact_number: item.contactNumber || null,
            modules: item.modules || [],
            updated_at: new Date().toISOString(),
          });

          if (pErr) {
            results.push({ email, success: false, error: pErr.message });
          } else {
            results.push({ email, success: true });
          }
        } catch (err: unknown) {
          results.push({
            email: item.email,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown sync error',
          });
        }
      }

      return NextResponse.json({
        success: true,
        syncedCount: results.filter((r) => r.success).length,
        totalCount: users.length,
        details: results,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error during user sync' },
      { status: 500 }
    );
  }
}
