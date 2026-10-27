import {
  VitalSign,
  MaternalRecord,
  AntenatalVisit,
  ImmunizationRecord,
  UserRole,
} from '@/types/database';

export interface ClinicalEncounter {
  id: string;
  residentId: string;
  encounterDate: string;
  providerName: string;
  providerRole: UserRole;
  chiefComplaint: string;
  clinicalImpression: string;
  treatmentPlan: string;
  createdAt: string;
}

export const INITIAL_ENCOUNTERS: ClinicalEncounter[] = [];
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

// Production clinical dataset initializers (empty default states)
export const INITIAL_VITALS: VitalSign[] = [];
export const INITIAL_MATERNAL_RECORDS: MaternalRecord[] = [];
export const INITIAL_ANTENATAL_VISITS: AntenatalVisit[] = [];
export const INITIAL_IMMUNIZATIONS: ImmunizationRecord[] = [];

export class ClinicalService {
  private static VITALS_KEY = 'bhms_vitals_cache';
  private static MATERNAL_KEY = 'bhms_maternal_cache';
  private static VISITS_KEY = 'bhms_visits_cache';
  private static IMMUNIZATION_KEY = 'bhms_immunization_cache';

  private static serverVitals: VitalSign[] = [];
  private static serverMaternal: MaternalRecord[] = [];
  private static serverVisits: AntenatalVisit[] = [];
  private static serverImmunizations: ImmunizationRecord[] = [];

  // --- VITALS ENCOUNTER METHODS ---
  public static getVitals(): VitalSign[] {
    if (typeof window === 'undefined') return this.serverVitals;
    try {
      const stored = localStorage.getItem(this.VITALS_KEY);
      if (!stored) {
        localStorage.setItem(this.VITALS_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: VitalSign[] = JSON.parse(stored);
      // Filter out legacy mock data
      const mockIds = ['vit-001', 'vit-002'];
      const cleaned = parsed.filter((v) => !mockIds.includes(v.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(this.VITALS_KEY, JSON.stringify(cleaned));
      }
      this.serverVitals = cleaned;
      return cleaned;
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
        localStorage.setItem(this.MATERNAL_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: MaternalRecord[] = JSON.parse(stored);
      const mockIds = ['mat-001'];
      const cleaned = parsed.filter((m) => !mockIds.includes(m.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(this.MATERNAL_KEY, JSON.stringify(cleaned));
      }
      this.serverMaternal = cleaned;
      return cleaned;
    } catch {
      return this.serverMaternal;
    }
  }

  public static getAntenatalVisits(): AntenatalVisit[] {
    if (typeof window === 'undefined') return this.serverVisits;
    try {
      const stored = localStorage.getItem(this.VISITS_KEY);
      if (!stored) {
        localStorage.setItem(this.VISITS_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: AntenatalVisit[] = JSON.parse(stored);
      const mockIds = ['anv-001', 'anv-002'];
      const cleaned = parsed.filter((v) => !mockIds.includes(v.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(this.VISITS_KEY, JSON.stringify(cleaned));
      }
      this.serverVisits = cleaned;
      return cleaned;
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
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(this.IMMUNIZATION_KEY);
      if (!stored) {
        localStorage.setItem(this.IMMUNIZATION_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: ImmunizationRecord[] = JSON.parse(stored);
      const mockIds = ['imm-001', 'imm-002', 'imm-003'];
      const cleaned = parsed.filter((i) => !mockIds.includes(i.id));
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(this.IMMUNIZATION_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
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

  // --- CLINICAL ENCOUNTERS & MEDICAL CHART HISTORY ---
  private static ENCOUNTERS_KEY = 'bhsms_clinical_encounters_v1';
  private static inMemoryEncounters: ClinicalEncounter[] | null = null;

  public static getEncounters(residentId?: string): ClinicalEncounter[] {
    let all: ClinicalEncounter[] = [];
    if (typeof window === 'undefined') {
      all = this.inMemoryEncounters || [];
    } else {
      try {
        const stored = localStorage.getItem(this.ENCOUNTERS_KEY);
        if (!stored) {
          localStorage.setItem(this.ENCOUNTERS_KEY, JSON.stringify([]));
          all = [];
        } else {
          const parsed: ClinicalEncounter[] = JSON.parse(stored);
          const mockIds = ['enc-001', 'enc-002'];
          const cleaned = parsed.filter((e) => !mockIds.includes(e.id));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem(this.ENCOUNTERS_KEY, JSON.stringify(cleaned));
          }
          all = cleaned;
        }
      } catch {
        all = [];
      }
    }

    if (residentId) {
      return all.filter((e) => e.residentId === residentId);
    }
    return all;
  }

  public static addEncounter(input: Omit<ClinicalEncounter, 'id' | 'createdAt'>): ClinicalEncounter {
    const current = this.getEncounters();
    const newRecord: ClinicalEncounter = {
      ...input,
      id: crypto.randomUUID ? crypto.randomUUID() : `enc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newRecord, ...current];
    this.inMemoryEncounters = updated;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.ENCOUNTERS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save clinical encounter:', err);
      }
    }
    return newRecord;
  }
}
