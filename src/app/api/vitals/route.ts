import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const { data, error } = await adminClient
      .from('vital_signs')
      .select('*')
      .order('recorded_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, vitals: data || [] });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch vitals' },
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
      systolicBp,
      diastolicBp,
      heartRateBpm,
      respiratoryRateCpm,
      temperatureCelsius,
      weightKg,
      heightCm,
      bmi,
      severity,
      clinicalFlags,
      referralRecommended,
      notes,
      recordedByUserId,
    } = body;

    if (!residentId || !systolicBp || !diastolicBp) {
      return NextResponse.json({ success: false, error: 'Missing required vitals parameters' }, { status: 400 });
    }

    const payload = {
      resident_id: residentId,
      systolic_bp: Number(systolicBp),
      diastolic_bp: Number(diastolicBp),
      heart_rate_bpm: Number(heartRateBpm || 75),
      respiratory_rate_cpm: Number(respiratoryRateCpm || 18),
      temperature_celsius: Number(temperatureCelsius || 36.5),
      weight_kg: Number(weightKg || 60),
      height_cm: Number(heightCm || 160),
      bmi: Number(bmi || 22),
      severity: severity || 'NORMAL',
      clinical_flags: Array.isArray(clinicalFlags) ? clinicalFlags : [],
      referral_recommended: Boolean(referralRecommended),
      notes: notes || null,
      recorded_by_user_id: recordedByUserId && recordedByUserId.length === 36 ? recordedByUserId : null,
      recorded_at: new Date().toISOString(),
    };

    const { data, error } = await adminClient
      .from('vital_signs')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, vitalsRecord: data });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error saving vitals' },
      { status: 500 }
    );
  }
}
