export type UserRole = 'admin' | 'doctor' | 'nurse' | 'bhw' | 'lgu_viewer';
export type BiologicalSex = 'male' | 'female' | 'other';
export type BarangayCode = 'PALAQUIO' | 'TABIOG' | 'BABANGCAG';
export type TriageSeverity = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';
export type VaccineStatus = 'scheduled' | 'administered' | 'missed' | 'exempted';

export interface UserProfile {
  id: string; // references auth.users
  full_name: string;
  role: UserRole;
  barangay: BarangayCode;
  contact_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  barangay: BarangayCode;
  purok: string;
  household_number: string;
  head_resident_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resident {
  id: string;
  upi: string; // BHS-[BarangayCode]-[Year]-[Sequence]
  household_id?: string | null;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  suffix?: string | null;
  alias?: string | null;
  date_of_birth: string; // YYYY-MM-DD
  biological_sex: BiologicalSex;
  civil_status: 'single' | 'married' | 'widowed' | 'separated' | 'cohabiting';
  barangay: BarangayCode;
  purok: string;
  contact_number?: string | null;
  philhealth_id?: string | null;
  is_pregnant: boolean;
  soundex_key: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VitalSign {
  id: string;
  resident_id: string;
  recorded_by_user_id: string;
  systolic_bp: number;
  diastolic_bp: number;
  heart_rate_bpm: number;
  respiratory_rate_cpm: number;
  temperature_celsius: number;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  severity: TriageSeverity;
  clinical_flags: string[];
  referral_recommended: boolean;
  notes?: string | null;
  recorded_at: string;
}

export interface MaternalRecord {
  id: string;
  resident_id: string;
  gravida: number;
  para: number;
  full_term: number;
  preterm: number;
  abortion: number;
  living_children: number;
  lmp: string; // Last Menstrual Period
  edd: string; // Estimated Date of Delivery
  high_risk_flags: string[];
  is_active: boolean;
  recorded_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AntenatalVisit {
  id: string;
  maternal_record_id: string;
  visit_number: 1 | 2 | 3 | 4 | number;
  gestational_age_weeks: number;
  fundic_height_cm?: number | null;
  fetal_heart_tone_bpm?: number | null;
  iron_folic_acid_distributed: boolean;
  systolic_bp: number;
  diastolic_bp: number;
  weight_kg: number;
  recorded_by_user_id: string;
  visit_date: string;
  notes?: string | null;
  created_at?: string;
}

export interface ImmunizationRecord {
  id: string;
  resident_id: string;
  vaccine_code: string;
  dose_number: number;
  status: VaccineStatus;
  scheduled_date: string;
  administered_date?: string | null;
  batch_number?: string | null;
  administered_by_user_id?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  action_type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'LOGIN';
  table_name: string;
  record_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}
