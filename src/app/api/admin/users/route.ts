import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { SystemUser } from '@/lib/services/user-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, user, users } = body;

    const adminClient = createAdminClient();

    if (!adminClient) {
      return NextResponse.json({
        success: false,
        requiresServiceRoleKey: true,
        error: 'SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local. Add your Supabase Service Role Secret Key to automatically sync users directly to Supabase Authentication.',
      });
    }

    if (action === 'create' && user) {
      const email = user.email.trim().toLowerCase();
      const password = user.password?.trim() || 'WelcomeBucay2026!';

      // List existing users to check if already present in auth.users
      const { data: existingAuthUsers, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) {
        return NextResponse.json({ success: false, error: listError.message }, { status: 500 });
      }

      let authUser = existingAuthUsers?.users?.find(
        (u) => u.email?.toLowerCase() === email
      );

      if (!authUser) {
        // Create user in auth.users with confirmed email
        const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: user.fullName,
            role: user.role,
            barangay: user.barangay,
            employee_id: user.employeeId,
          },
        });

        if (createError) {
          return NextResponse.json({ success: false, error: createError.message }, { status: 400 });
        }
        authUser = createData.user;
      }

      const assignedId = authUser.id;

      // Upsert profile into public.profiles
      const { error: profileError } = await adminClient.from('profiles').upsert({
        id: assignedId,
        full_name: user.fullName,
        role: user.role,
        barangay: user.barangay,
        contact_number: user.contactNumber || null,
        modules: user.modules || [],
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        return NextResponse.json({ success: false, error: profileError.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        synced: true,
        user: {
          ...user,
          id: assignedId,
        },
      });
    }

    if (action === 'sync_all' && Array.isArray(users)) {
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
