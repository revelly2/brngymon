import {
  VitalSign,
  MaternalRecord,
  AntenatalVisit,
  ImmunizationRecord,
  TriageSeverity,
  VaccineStatus,
} from '@/types/database';
import {
  evaluateVitals,
  calculateNaegeleEDD,
  calculateGestationalAgeWeeks,
} from '@/lib/validations/clinical';

export interface VitalsInput {
  residentId: string;
  systolicBp: number;
  diastolicBp: number;
  heartRateBpm: number;
  respiratoryRateCpm: number;
  temperatureCelsius: number;
  weightKg: number;
  heightCm: number;
  recordedByUserId?: string;
  notes?: string;
}

export interface MaternalEnrollmentInput {
  residentId: string;
  gravida: number;
  para: number;
  fullTerm: number;
  preterm: number;
  abortion: number;
  livingChildren: number;
  lmp: string; // YYYY-MM-DD
  residentAge: number;
  recordedByUserId?: string;
}

export interface StandardDOHVaccine {
  code: string;
  name: string;
  targetAgeWeeks: number; // minimum age in weeks when due
  targetAgeMonths: number;
  description: string;
}

// Official Department of Health (DOH) Expanded Program on Immunization Schedule
export const DOH_EPI_SCHEDULE: StandardDOHVaccine[] = [
  { code: 'BCG', name: 'BCG Vaccine', targetAgeWeeks: 0, targetAgeMonths: 0, description: 'At birth (Tuberculosis protection)' },
  { code: 'HEP_B', name: 'Hepatitis B', targetAgeWeeks: 0, targetAgeMonths: 0, description: 'Within 24 hours of birth' },
  { code: 'PENTA_1', name: 'Pentavalent 1', targetAgeWeeks: 6, targetAgeMonths: 1.5, description: '6 Weeks (DTP-HepB-Hib)' },
  { code: 'OPV_1', name: 'Oral Polio 1', targetAgeWeeks: 6, targetAgeMonths: 1.5, description: '6 Weeks' },
  { code: 'PCV_1', name: 'Pneumococcal 1', targetAgeWeeks: 6, targetAgeMonths: 1.5, description: '6 Weeks' },
  { code: 'PENTA_2', name: 'Pentavalent 2', targetAgeWeeks: 10, targetAgeMonths: 2.5, description: '10 Weeks' },
  { code: 'OPV_2', name: 'Oral Polio 2', targetAgeWeeks: 10, targetAgeMonths: 2.5, description: '10 Weeks' },
  { code: 'PCV_2', name: 'Pneumococcal 2', targetAgeWeeks: 10, targetAgeMonths: 2.5, description: '10 Weeks' },
  { code: 'PENTA_3', name: 'Pentavalent 3', targetAgeWeeks: 14, targetAgeMonths: 3.5, description: '14 Weeks' },
  { code: 'OPV_3', name: 'Oral Polio 3', targetAgeWeeks: 14, targetAgeMonths: 3.5, description: '14 Weeks' },
  { code: 'IPV_1', name: 'Inactivated Polio', targetAgeWeeks: 14, targetAgeMonths: 3.5, description: '14 Weeks' },
  { code: 'PCV_3', name: 'Pneumococcal 3', targetAgeWeeks: 14, targetAgeMonths: 3.5, description: '14 Weeks' },
  { code: 'MCV_1', name: 'Measles-Rubella (MR)', targetAgeWeeks: 39, targetAgeMonths: 9, description: '9 Months' },
  { code: 'MCV_2', name: 'MMR Booster', targetAgeWeeks: 52, targetAgeMonths: 12, description: '12 Months' },
];

export interface DefaulterAlert {
  residentId: string;
  residentName: string;
  barangay: string;
  purok: string;
  ageWeeks: number;
  ageMonths: number;
  overdueVaccineCode: string;
  overdueVaccineName: string;
  targetDueWeeks: number;
  weeksOverdue: number;
}

// Initial mock clinical data
export const INITIAL_VITALS: VitalSign[] = [
  {
    id: 'vit-001',
    resident_id: '11111111-0002-4000-8000-000000000002', // Rodrigo Flores
    recorded_by_user_id: 'usr-bhw-palaquio',
    systolic_bp: 185,
    diastolic_bp: 122,
    heart_rate_bpm: 96,
    respiratory_rate_cpm: 22,
    temperature_celsius: 37.0,
    weight_kg: 72,
    height_cm: 168,
    bmi: 25.5,
    severity: 'CRITICAL',
    clinical_flags: ['HYPERTENSIVE_CRISIS_EMERGENCY', 'BMI_OBESE_1'],
    referral_recommended: true,
    notes: 'Urgent referral needed. Patient reported severe occipital headache.',
    recorded_at: new Date('2026-03-01T08:30:00Z').toISOString(),
  },
  {
    id: 'vit-002',
    resident_id: '11111111-0001-4000-8000-000000000001', // Maria Dela Cruz
    recorded_by_user_id: 'usr-nurse-lagangilang',
    systolic_bp: 116,
    diastolic_bp: 74,
    heart_rate_bpm: 78,
    respiratory_rate_cpm: 18,
    temperature_celsius: 36.6,
    weight_kg: 58,
    height_cm: 155,
    bmi: 24.1,
    severity: 'NORMAL',
    clinical_flags: [],
    referral_recommended: false,
    notes: 'Routine antenatal checkup. Fetal movement felt.',
    recorded_at: new Date('2026-03-05T09:15:00Z').toISOString(),
  },
];

export const INITIAL_MATERNAL_RECORDS: MaternalRecord[] = [
  {
    id: 'mat-001',
    resident_id: '11111111-0001-4000-8000-000000000001', // Maria Dela Cruz
    gravida: 2,
    para: 1,
    full_term: 1,
    preterm: 0,
    abortion: 0,
    living_children: 1,
    lmp: '2025-08-15',
    edd: '2026-05-22',
    high_risk_flags: [],
    is_active: true,
    recorded_by_user_id: 'usr-nurse-lagangilang',
    created_at: new Date('2025-09-01').toISOString(),
    updated_at: new Date('2026-03-05').toISOString(),
  },
];

export const INITIAL_ANTENATAL_VISITS: AntenatalVisit[] = [
  {
    id: 'anv-001',
    maternal_record_id: 'mat-001',
    visit_number: 1,
    gestational_age_weeks: 10,
    fundic_height_cm: 12,
    fetal_heart_tone_bpm: 145,
    iron_folic_acid_distributed: true,
    systolic_bp: 110,
    diastolic_bp: 70,
    weight_kg: 55,
    notes: '1st trimester intake completed. Micronutrients supplied.',
    recorded_by_user_id: 'usr-nurse-lagangilang',
    visit_date: '2025-10-24',
    created_at: new Date('2025-10-24').toISOString(),
  },
  {
    id: 'anv-002',
    maternal_record_id: 'mat-001',
    visit_number: 2,
    gestational_age_weeks: 20,
    fundic_height_cm: 19,
    fetal_heart_tone_bpm: 150,
    iron_folic_acid_distributed: true,
    systolic_bp: 114,
    diastolic_bp: 72,
    weight_kg: 56.5,
    notes: '2nd trimester ultrasound review normal.',
    recorded_by_user_id: 'usr-nurse-lagangilang',
    visit_date: '2026-01-05',
    created_at: new Date('2026-01-05').toISOString(),
  },
];

export const INITIAL_IMMUNIZATIONS: ImmunizationRecord[] = [
  {
    id: 'imm-001',
    resident_id: '11111111-0003-4000-8000-000000000003', // Ethan Ramos (Born 2025-08-20)
    vaccine_code: 'BCG',
    dose_number: 1,
    status: 'administered',
    scheduled_date: '2025-08-20',
    administered_date: '2025-08-20',
    batch_number: 'BCG-2025-09',
    administered_by_user_id: 'usr-nurse-lagangilang',
    notes: 'Administered at delivery center',
    created_at: new Date('2025-08-20').toISOString(),
  },
  {
    id: 'imm-002',
    resident_id: '11111111-0003-4000-8000-000000000003',
    vaccine_code: 'HEP_B',
    dose_number: 1,
    status: 'administered',
    scheduled_date: '2025-08-20',
    administered_date: '2025-08-20',
    batch_number: 'HEPB-881',
    administered_by_user_id: 'usr-nurse-lagangilang',
    created_at: new Date('2025-08-20').toISOString(),
  },
  {
    id: 'imm-003',
    resident_id: '11111111-0003-4000-8000-000000000003',
    vaccine_code: 'PENTA_1',
    dose_number: 1,
    status: 'administered',
    scheduled_date: '2025-10-01',
    administered_date: '2025-10-02',
    batch_number: 'PEN-554',
    administered_by_user_id: 'usr-nurse-lagangilang',
    created_at: new Date('2025-10-02').toISOString(),
  },
];

export class ClinicalService {
  private static VITALS_KEY = 'bhms_vitals_cache';
  private static MATERNAL_KEY = 'bhms_maternal_cache';
  private static VISITS_KEY = 'bhms_visits_cache';
  private static IMMUNIZATION_KEY = 'bhms_immunization_cache';

  private static serverVitals: VitalSign[] = [...INITIAL_VITALS];
  private static serverMaternal: MaternalRecord[] = [...INITIAL_MATERNAL_RECORDS];
  private static serverVisits: AntenatalVisit[] = [...INITIAL_ANTENATAL_VISITS];
  private static serverImmunizations: ImmunizationRecord[] = [...INITIAL_IMMUNIZATIONS];

  // --- VITALS ENCOUNTER METHODS ---
  public static getVitals(): VitalSign[] {
    if (typeof window === 'undefined') return this.serverVitals;
    try {
      const stored = localStorage.getItem(this.VITALS_KEY);
      if (!stored) {
        localStorage.setItem(this.VITALS_KEY, JSON.stringify(INITIAL_VITALS));
        return [...INITIAL_VITALS];
      }
      return JSON.parse(stored);
    } catch {
      return this.serverVitals;
    }
  }

  public static recordVitals(
    input: VitalsInput,
    options?: { inMemoryList?: VitalSign[] }
  ): { success: boolean; vitalsRecord?: VitalSign; evaluation: ReturnType<typeof evaluateVitals> } {
    const evalResult = evaluateVitals({
      systolicBp: input.systolicBp,
      diastolicBp: input.diastolicBp,
      temperatureCelsius: input.temperatureCelsius,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
    });

    const record: VitalSign = {
      id: crypto.randomUUID ? crypto.randomUUID() : `vit-${Date.now()}`,
      resident_id: input.residentId,
      recorded_by_user_id: input.recordedByUserId || 'usr-system',
      systolic_bp: input.systolicBp,
      diastolic_bp: input.diastolicBp,
      heart_rate_bpm: input.heartRateBpm,
      respiratory_rate_cpm: input.respiratoryRateCpm,
      temperature_celsius: input.temperatureCelsius,
      weight_kg: input.weightKg,
      height_cm: input.heightCm,
      bmi: evalResult.bmi,
      severity: evalResult.severity,
      clinical_flags: evalResult.clinicalFlags,
      referral_recommended: evalResult.referralRecommended,
      notes: input.notes || null,
      recorded_at: new Date().toISOString(),
    };

    if (options?.inMemoryList) {
      options.inMemoryList.unshift(record);
    } else {
      this.serverVitals.unshift(record);
      const current = this.getVitals();
      const updated = [record, ...current];
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.VITALS_KEY, JSON.stringify(updated));
      }
    }

    return {
      success: true,
      vitalsRecord: record,
      evaluation: evalResult,
    };
  }

  // --- MATERNAL TRACKER METHODS ---
  public static getMaternalRecords(): MaternalRecord[] {
    if (typeof window === 'undefined') return this.serverMaternal;
    try {
      const stored = localStorage.getItem(this.MATERNAL_KEY);
      if (!stored) {
        localStorage.setItem(this.MATERNAL_KEY, JSON.stringify(INITIAL_MATERNAL_RECORDS));
        return [...INITIAL_MATERNAL_RECORDS];
      }
      return JSON.parse(stored);
    } catch {
      return this.serverMaternal;
    }
  }

  public static getAntenatalVisits(): AntenatalVisit[] {
    if (typeof window === 'undefined') return this.serverVisits;
    try {
      const stored = localStorage.getItem(this.VISITS_KEY);
      if (!stored) {
        localStorage.setItem(this.VISITS_KEY, JSON.stringify(INITIAL_ANTENATAL_VISITS));
        return [...INITIAL_ANTENATAL_VISITS];
      }
      return JSON.parse(stored);
    } catch {
      return this.serverVisits;
    }
  }

  public static enrollMaternalPatient(
    input: MaternalEnrollmentInput,
    options?: { inMemoryList?: MaternalRecord[] }
  ): { success: boolean; record: MaternalRecord } {
    const edd = calculateNaegeleEDD(input.lmp);
    const highRiskFlags: string[] = [];

    // Clinical high risk evaluation:
    if (input.residentAge < 18) highRiskFlags.push('ADOLESCENT_PREGNANCY');
    if (input.residentAge >= 35) highRiskFlags.push('ADVANCED_MATERNAL_AGE');
    if (input.para >= 5 || input.gravida >= 5) highRiskFlags.push('GRAND_MULTIPARITY');

    const record: MaternalRecord = {
      id: crypto.randomUUID ? crypto.randomUUID() : `mat-${Date.now()}`,
      resident_id: input.residentId,
      gravida: input.gravida,
      para: input.para,
      full_term: input.fullTerm,
      preterm: input.preterm,
      abortion: input.abortion,
      living_children: input.livingChildren,
      lmp: input.lmp,
      edd,
      high_risk_flags: highRiskFlags,
      is_active: true,
      recorded_by_user_id: input.recordedByUserId || 'usr-system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (options?.inMemoryList) {
      options.inMemoryList.unshift(record);
    } else {
      this.serverMaternal.unshift(record);
      const current = this.getMaternalRecords();
      const updated = [record, ...current];
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.MATERNAL_KEY, JSON.stringify(updated));
      }
    }

    return { success: true, record };
  }

  // --- PEDIATRIC EPI IMMUNIZATION & DEFAULTER ENGINE ---
  public static getImmunizations(): ImmunizationRecord[] {
    if (typeof window === 'undefined') return [...INITIAL_IMMUNIZATIONS];
    try {
      const stored = localStorage.getItem(this.IMMUNIZATION_KEY);
      if (!stored) {
        localStorage.setItem(this.IMMUNIZATION_KEY, JSON.stringify(INITIAL_IMMUNIZATIONS));
        return [...INITIAL_IMMUNIZATIONS];
      }
      return JSON.parse(stored);
    } catch {
      return [...INITIAL_IMMUNIZATIONS];
    }
  }

  /**
   * Computes missing/overdue vaccines for an infant based on chronological age.
   * Returns line-list of defaulters for targeted BHW community outreach.
   */
  public static computeDefaulters(
    infants: Array<{ id: string; name: string; barangay: string; purok: string; dateOfBirth: string }>,
    records?: ImmunizationRecord[],
    asOfDate: Date = new Date('2026-10-09T00:00:00Z')
  ): DefaulterAlert[] {
    const immunizations = records || this.getImmunizations();
    const defaulters: DefaulterAlert[] = [];

    for (const child of infants) {
      const birth = new Date(child.dateOfBirth);
      const diffTime = asOfDate.getTime() - birth.getTime();
      const ageDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const ageWeeks = Math.floor(ageDays / 7);
      const ageMonths = Math.floor(ageDays / 30.4375);

      // Child's administered vaccines
      const administeredCodes = new Set(
        immunizations
          .filter((rec) => rec.resident_id === child.id && rec.status === 'administered')
          .map((rec) => rec.vaccine_code)
      );

      for (const vaccine of DOH_EPI_SCHEDULE) {
        // If child is older than the target schedule and has not received the dose:
        if (ageWeeks > vaccine.targetAgeWeeks && !administeredCodes.has(vaccine.code)) {
          defaulters.push({
            residentId: child.id,
            residentName: child.name,
            barangay: child.barangay,
            purok: child.purok,
            ageWeeks,
            ageMonths,
            overdueVaccineCode: vaccine.code,
            overdueVaccineName: vaccine.name,
            targetDueWeeks: vaccine.targetAgeWeeks,
            weeksOverdue: ageWeeks - vaccine.targetAgeWeeks,
          });
        }
      }
    }

    return defaulters;
  }
}
