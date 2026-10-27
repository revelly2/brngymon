import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { generateResidentDedupKey, generateSoundex } from '@/lib/validations/clinical';
import { BarangayCode, BiologicalSex } from '@/types/database';

const BARANGAY_PREFIX_MAP: Record<BarangayCode, string> = {
  PALAQUIO: 'PAL',
  TABIOG: 'TAB',
  BABANGCAG: 'BAB',
};

export async function GET() {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const { data, error } = await adminClient
      .from('residents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, residents: data || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch residents' },
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
      barangay,
      purok,
      firstName,
      middleName,
      lastName,
      suffix,
      alias,
      dateOfBirth,
      biologicalSex,
      civilStatus,
      contactNumber,
      philhealthId,
      isPregnant,
    } = body;

    if (!firstName || !lastName || !dateOfBirth || !barangay || !purok) {
      return NextResponse.json({ success: false, error: 'Missing required resident demographic fields' }, { status: 400 });
    }

    // Soundex deduplication key
    const soundexKey = generateResidentDedupKey(lastName, firstName, dateOfBirth);

    // Check count for UPI generation
    const { count } = await adminClient
      .from('residents')
      .select('*', { count: 'exact', head: true })
      .eq('barangay', barangay);

    const prefix = BARANGAY_PREFIX_MAP[barangay as BarangayCode] || 'BRG';
    const year = new Date().getFullYear();
    const seq = String((count || 0) + 1).padStart(4, '0');
    const upi = `BHS-${prefix}-${year}-${seq}`;

    // Normalize biological_sex to lowercase for Postgres enum gender_type ('female' | 'male')
    const normalizedSex = (biologicalSex || 'female').toLowerCase();

    const insertPayload = {
      upi,
      first_name: firstName.trim(),
      middle_name: middleName?.trim() || null,
      last_name: lastName.trim(),
      suffix: suffix?.trim() || null,
      alias: alias?.trim() || null,
      date_of_birth: dateOfBirth,
      biological_sex: normalizedSex,
      civil_status: civilStatus || 'single',
      barangay,
      purok: purok.trim(),
      contact_number: contactNumber?.trim() || null,
      philhealth_id: philhealthId?.trim() || null,
      is_pregnant: Boolean(isPregnant),
      soundex_key: soundexKey,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await adminClient
      .from('residents')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, resident: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error registering resident' },
      { status: 500 }
    );
  }
}
