import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
  try {
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ success: false, error: 'Database client unavailable' }, { status: 500 });
    }

    const { data: maternal, error: matErr } = await adminClient
      .from('maternal_records')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: visits, error: visErr } = await adminClient
      .from('antenatal_visits')
      .select('*')
      .order('visit_date', { ascending: false });

    if (matErr) {
      return NextResponse.json({ success: false, error: matErr.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      records: maternal || [],
      visits: visits || [],
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch maternal records' },
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
      type = 'enrollment',
      residentId,
      gravida,
      para,
      fullTerm,
      preterm,
      abortion,
      livingChildren,
      lmp,
      edd,
      highRiskFlags,
      // Visit fields:
      maternalRecordId,
      visitNumber,
      gestationalAgeWeeks,
      fundicHeightCm,
      fetalHeartToneBpm,
      ironFolicAcidDistributed,
      systolicBp,
      diastolicBp,
      weightKg,
      notes,
    } = body;

    if (type === 'enrollment') {
      if (!residentId || !lmp) {
        return NextResponse.json({ success: false, error: 'Missing residentId or lmp' }, { status: 400 });
      }

      const payload = {
        resident_id: residentId,
        gravida: Number(gravida || 1),
        para: Number(para || 0),
        full_term: Number(fullTerm || 0),
        preterm: Number(preterm || 0),
        abortion: Number(abortion || 0),
        living_children: Number(livingChildren || 0),
        lmp,
        edd: edd || lmp,
        high_risk_flags: Array.isArray(highRiskFlags) ? highRiskFlags : [],
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await adminClient
        .from('maternal_records')
        .insert(payload)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, record: data });
    } else {
      // Visit entry
      if (!maternalRecordId) {
        return NextResponse.json({ success: false, error: 'Missing maternalRecordId' }, { status: 400 });
      }

      const visitPayload = {
        maternal_record_id: maternalRecordId,
        visit_number: Number(visitNumber || 1),
        gestational_age_weeks: Number(gestationalAgeWeeks || 0),
        fundic_height_cm: fundicHeightCm ? Number(fundicHeightCm) : null,
        fetal_heart_tone_bpm: fetalHeartToneBpm ? Number(fetalHeartToneBpm) : null,
        iron_folic_acid_distributed: Boolean(ironFolicAcidDistributed),
        systolic_bp: Number(systolicBp || 120),
        diastolic_bp: Number(diastolicBp || 80),
        weight_kg: Number(weightKg || 60),
        notes: notes || null,
        visit_date: new Date().toISOString().split('T')[0],
      };

      const { data, error } = await adminClient
        .from('antenatal_visits')
        .insert(visitPayload)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, visit: data });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error saving maternal record' },
      { status: 500 }
    );
  }
}
