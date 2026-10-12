import { z } from 'zod';
import { TriageSeverity } from '@/types/database';

/**
 * Soundex generator for Filipino name deduplication (e.g., Dela Cruz, De la Cruz)
 */
export function generateSoundex(name: string): string {
  if (!name || name.trim().length === 0) return '0000';
  const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
  if (!clean) return '0000';

  const firstLetter = clean[0];
  const mappings: Record<string, string> = {
    B: '1', F: '1', P: '1', V: '1',
    C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2',
    D: '3', T: '3',
    L: '4',
    M: '5', N: '5',
    R: '6',
  };

  let code = firstLetter;
  let prevCode = mappings[firstLetter] || '0';

  for (let i = 1; i < clean.length; i++) {
    const current = mappings[clean[i]] || '0';
    if (current !== '0' && current !== prevCode) {
      code += current;
      prevCode = current;
    } else if (current === '0') {
      prevCode = '0';
    }
    if (code.length === 4) break;
  }

  return (code + '0000').slice(0, 4);
}

/**
 * Generates deduplication hash key for resident: Soundex(LastName) + FirstName(first 3) + DateOfBirth
 */
export function generateResidentDedupKey(lastName: string, firstName: string, dob: string): string {
  const soundexLast = generateSoundex(lastName);
  const cleanFirst = firstName.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  return `${soundexLast}-${cleanFirst}-${dob}`;
}

export const ResidentInputSchema = z.object({
  barangay: z.enum(['PALAQUIO', 'TABIOG', 'BABANGCAG']),
  purok: z.string().min(1, 'Purok/Sitio is required'),
  firstName: z.string().trim().min(1, 'First name is required'),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, 'Last name is required'),
  suffix: z.string().trim().optional(),
  alias: z.string().trim().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date of birth required (YYYY-MM-DD)'),
  biologicalSex: z.enum(['male', 'female', 'other']),
  civilStatus: z.enum(['single', 'married', 'widowed', 'separated', 'cohabiting']),
  contactNumber: z.string().trim().optional(),
  philhealthId: z.string().trim().optional(),
  isPregnant: z.boolean().default(false),
  householdNumber: z.string().trim().optional(),
});

export const VitalSignsInputSchema = z.object({
  residentId: z.string().uuid(),
  systolicBp: z.number().int().min(40, 'Systolic BP below physiological minimum (40 mmHg)').max(300, 'Systolic BP above physiological limit (300 mmHg)'),
  diastolicBp: z.number().int().min(30, 'Diastolic BP below physiological minimum (30 mmHg)').max(200, 'Diastolic BP above physiological limit (200 mmHg)'),
  heartRateBpm: z.number().int().min(30, 'Heart rate below physiological minimum (30 bpm)').max(250, 'Heart rate above physiological limit (250 bpm)'),
  respiratoryRateCpm: z.number().int().min(8, 'Respiratory rate below physiological minimum (8 cpm)').max(80, 'Respiratory rate above physiological limit (80 cpm)'),
  temperatureCelsius: z.number().min(30.0, 'Temperature below hypothermia limit (30.0 °C)').max(45.0, 'Temperature above hyperpyrexia limit (45.0 °C)'),
  weightKg: z.number().min(0.5, 'Weight must be at least 0.5 kg').max(300, 'Weight must be <= 300 kg'),
  heightCm: z.number().min(30, 'Height must be at least 30 cm').max(250, 'Height must be <= 250 cm'),
  notes: z.string().optional(),
});

export interface ClinicalEvaluation {
  severity: TriageSeverity;
  clinicalFlags: string[];
  referralRecommended: boolean;
  bmi: number;
  nutritionalStatus: string;
}

/**
 * Hemodynamic clinical evaluation according to Philippine Clinical Practice Guidelines for Hypertension
 */
export function evaluateHemodynamics(sbp: number, dbp: number): { severity: TriageSeverity; flags: string[]; referral: boolean } {
  if (sbp >= 180 || dbp >= 120) {
    return {
      severity: 'CRITICAL',
      flags: ['HYPERTENSIVE_CRISIS_EMERGENCY'],
      referral: true,
    };
  }
  if (sbp >= 140 || dbp >= 90) {
    return {
      severity: 'HIGH',
      flags: ['STAGE_2_HYPERTENSION'],
      referral: false,
    };
  }
  if (sbp >= 120 || dbp >= 80) {
    return {
      severity: 'ELEVATED',
      flags: ['PRE_HYPERTENSION'],
      referral: false,
    };
  }
  return {
    severity: 'NORMAL',
    flags: [],
    referral: false,
  };
}

/**
 * Evaluates comprehensive clinical vitals including hemodynamics, fever, and BMI
 */
export function evaluateVitals(input: {
  systolicBp: number;
  diastolicBp: number;
  temperatureCelsius: number;
  weightKg: number;
  heightCm: number;
}): ClinicalEvaluation {
  const hemo = evaluateHemodynamics(input.systolicBp, input.diastolicBp);
  const flags = [...hemo.flags];
  let severity = hemo.severity;
  let referral = hemo.referral;

  // Temperature screening (Febrile threshold >= 38.0 °C)
  if (input.temperatureCelsius >= 38.0) {
    flags.push('FEBRILE_ILLNESS_ALERT');
    if (severity === 'NORMAL') severity = 'ELEVATED';
  }

  // Auto-compute Body Mass Index (BMI = kg / m^2)
  const heightM = input.heightCm / 100;
  const bmi = Math.round((input.weightKg / (heightM * heightM)) * 10) / 10;

  // WHO Asia-Pacific BMI classification for adults
  let nutritionalStatus = 'Normal';
  if (bmi < 18.5) {
    nutritionalStatus = 'Underweight';
    flags.push('BMI_UNDERWEIGHT');
  } else if (bmi >= 23.0 && bmi < 25.0) {
    nutritionalStatus = 'Overweight';
  } else if (bmi >= 25.0 && bmi < 30.0) {
    nutritionalStatus = 'Obese Class I';
    flags.push('BMI_OBESE_1');
  } else if (bmi >= 30.0) {
    nutritionalStatus = 'Obese Class II';
    flags.push('BMI_OBESE_2');
  }

  return {
    severity,
    clinicalFlags: flags,
    referralRecommended: referral,
    bmi,
    nutritionalStatus,
  };
}

/**
 * Naegele's Rule calculation for Estimated Date of Delivery (EDD)
 * LMP + 1 year - 3 months + 7 days
 */
export function calculateNaegeleEDD(lmpDateString: string): string {
  const lmp = new Date(lmpDateString);
  if (isNaN(lmp.getTime())) throw new Error('Invalid LMP date string');

  const edd = new Date(lmp);
  edd.setFullYear(edd.getFullYear() + 1);
  edd.setMonth(edd.getMonth() - 3);
  edd.setDate(edd.getDate() + 7);

  return edd.toISOString().split('T')[0];
}

/**
 * Computes Gestational Age in completed weeks from LMP
 */
export function calculateGestationalAgeWeeks(lmpDateString: string, asOfDate: Date = new Date('2026-10-09T00:00:00Z')): number {
  const lmp = new Date(lmpDateString);
  const diffTime = asOfDate.getTime() - lmp.getTime();
  if (diffTime < 0) return 0;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
}
