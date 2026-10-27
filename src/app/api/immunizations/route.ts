import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const { data, error } = await adminClient
      .from('immunizations')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, immunizations: data || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch immunizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const {
      residentId,
      vaccineCode,
      doseNumber,
      status,
      scheduledDate,
      administeredDate,
      batchNumber,
      notes,
    } = body;

    if (!residentId || !vaccineCode) {
      return NextResponse.json({ success: false, error: 'Missing residentId or vaccineCode' }, { status: 400 });
    }

    const payload = {
      resident_id: residentId,
      vaccine_code: vaccineCode,
      dose_number: Number(doseNumber || 1),
      status: status || 'scheduled',
      scheduled_date: scheduledDate || new Date().toISOString().split('T')[0],
      administered_date: administeredDate || null,
      batch_number: batchNumber || null,
      notes: notes || null,
    };

    const { data, error } = await adminClient
      .from('immunizations')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, immunization: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error recording immunization' },
      { status: 500 }
    );
  }
}
