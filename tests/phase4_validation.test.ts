import { AnalyticsService } from '../src/lib/services/analytics-service';
import { Resident, VitalSign, MaternalRecord, ImmunizationRecord } from '../src/types/database';

function runPhase4ValidationTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 4 ANALYTICS & REPORTING VALIDATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // 1. Milestone Gate: Cross-Validation of Purok Tallies Against Ground-Truth Dataset
  console.log('--- 1. Controlled Dataset Cross-Validation (100% Precision Gate) ---');

  const testResidents: Resident[] = [
    // Purok 1: 3 residents (1 pregnant, 1 infant, 1 senior)
    {
      id: 'res-p1-1',
      upi: 'BHS-PAL-2026-0001',
      first_name: 'Rosa',
      last_name: 'Magno',
      date_of_birth: '1998-04-10', // 28 yrs
      biological_sex: 'female',
      civil_status: 'married',
      barangay: 'PALAQUIO',
      purok: 'Purok 1',
      is_pregnant: true,
      soundex_key: 'M250-ROS-1998-04-10',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'res-p1-2',
      upi: 'BHS-PAL-2026-0002',
      first_name: 'Leo',
      last_name: 'Magno',
      date_of_birth: '2025-06-15', // Infant (~9 mos)
      biological_sex: 'male',
      civil_status: 'single',
      barangay: 'PALAQUIO',
      purok: 'Purok 1',
      is_pregnant: false,
      soundex_key: 'M250-LEO-2025-06-15',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'res-p1-3',
      upi: 'BHS-PAL-2026-0003',
      first_name: 'Vicente',
      last_name: 'Magno',
      date_of_birth: '1955-08-20', // 71 yrs (senior)
      biological_sex: 'male',
      civil_status: 'widowed',
      barangay: 'PALAQUIO',
      purok: 'Purok 1',
      is_pregnant: false,
      soundex_key: 'M250-VIC-1955-08-20',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },

    // Purok 2: 4 residents (1 senior, 1 infant, 0 pregnant)
    {
      id: 'res-p2-1',
      upi: 'BHS-PAL-2026-0004',
      first_name: 'Arturo',
      last_name: 'Dela Cruz',
      date_of_birth: '1950-02-12', // 76 yrs (senior)
      biological_sex: 'male',
      civil_status: 'married',
      barangay: 'PALAQUIO',
      purok: 'Purok 2',
      is_pregnant: false,
      soundex_key: 'D426-ART-1950-02-12',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'res-p2-2',
      upi: 'BHS-PAL-2026-0005',
      first_name: 'Elena',
      last_name: 'Dela Cruz',
      date_of_birth: '1980-03-22', // 46 yrs
      biological_sex: 'female',
      civil_status: 'married',
      barangay: 'PALAQUIO',
      purok: 'Purok 2',
      is_pregnant: false,
      soundex_key: 'D426-ELE-1980-03-22',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'res-p2-3',
      upi: 'BHS-PAL-2026-0006',
      first_name: 'Baby Grace',
      last_name: 'Dela Cruz',
      date_of_birth: '2025-01-10', // Infant (~14 mos)
      biological_sex: 'female',
      civil_status: 'single',
      barangay: 'PALAQUIO',
      purok: 'Purok 2',
      is_pregnant: false,
      soundex_key: 'D426-BAB-2025-01-10',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'res-p2-4',
      upi: 'BHS-PAL-2026-0007',
      first_name: 'Joel',
      last_name: 'Dela Cruz',
      date_of_birth: '1982-10-15', // 44 yrs
      biological_sex: 'male',
      civil_status: 'married',
      barangay: 'PALAQUIO',
      purok: 'Purok 2',
      is_pregnant: false,
      soundex_key: 'D426-JOE-1982-10-15',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },

    // Purok 3: 3 residents (1 pregnant, 0 infant, 0 senior)
    {
      id: 'res-p3-1',
      upi: 'BHS-PAL-2026-0008',
      first_name: 'Maricel',
      last_name: 'Ramos',
      date_of_birth: '2000-11-05', // 26 yrs
      biological_sex: 'female',
      civil_status: 'married',
      barangay: 'PALAQUIO',
      purok: 'Purok 3',
      is_pregnant: true,
      soundex_key: 'R520-MAR-2000-11-05',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'res-p3-2',
      upi: 'BHS-PAL-2026-0009',
      first_name: 'Dennis',
      last_name: 'Ramos',
      date_of_birth: '1998-09-14', // 28 yrs
      biological_sex: 'male',
      civil_status: 'married',
      barangay: 'PALAQUIO',
      purok: 'Purok 3',
      is_pregnant: false,
      soundex_key: 'R520-DEN-1998-09-14',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'res-p3-3',
      upi: 'BHS-PAL-2026-0010',
      first_name: 'Garry',
      last_name: 'Santos',
      date_of_birth: '1995-07-02', // 31 yrs
      biological_sex: 'male',
      civil_status: 'single',
      barangay: 'PALAQUIO',
      purok: 'Purok 3',
      is_pregnant: false,
      soundex_key: 'S532-GAR-1995-07-02',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ];

  const testVitals: VitalSign[] = [
    // Vicente (Purok 1) is Hypertensive Crisis
    {
      id: 'v-1',
      resident_id: 'res-p1-3',
      recorded_by_user_id: 'usr-1',
      systolic_bp: 184,
      diastolic_bp: 120,
      heart_rate_bpm: 88,
      respiratory_rate_cpm: 20,
      temperature_celsius: 36.8,
      weight_kg: 68,
      height_cm: 162,
      bmi: 25.9,
      severity: 'CRITICAL',
      clinical_flags: ['HYPERTENSIVE_CRISIS_EMERGENCY'],
      referral_recommended: true,
      recorded_at: '2026-03-01',
    },
    // Arturo (Purok 2) is Stage 2 Hypertensive
    {
      id: 'v-2',
      resident_id: 'res-p2-1',
      recorded_by_user_id: 'usr-1',
      systolic_bp: 150,
      diastolic_bp: 95,
      heart_rate_bpm: 80,
      respiratory_rate_cpm: 18,
      temperature_celsius: 36.5,
      weight_kg: 70,
      height_cm: 165,
      bmi: 25.7,
      severity: 'HIGH',
      clinical_flags: ['STAGE_2_HYPERTENSION'],
      referral_recommended: false,
      recorded_at: '2026-03-02',
    },
    // Dennis (Purok 3) is Febrile (38.5 C)
    {
      id: 'v-3',
      resident_id: 'res-p3-2',
      recorded_by_user_id: 'usr-1',
      systolic_bp: 120,
      diastolic_bp: 80,
      heart_rate_bpm: 90,
      respiratory_rate_cpm: 20,
      temperature_celsius: 38.5,
      weight_kg: 65,
      height_cm: 170,
      bmi: 22.5,
      severity: 'ELEVATED',
      clinical_flags: ['FEBRILE_ILLNESS_ALERT'],
      referral_recommended: false,
      notes: 'Suspected acute respiratory infection',
      recorded_at: '2026-03-03',
    },
  ];

  // Immunizations: Leo (Purok 1) is Fully Immunized (FIC), Baby Grace (Purok 2) is missing MCV_1
  const FIC_CODES = ['BCG', 'HEP_B', 'PENTA_1', 'PENTA_2', 'PENTA_3', 'OPV_1', 'OPV_2', 'OPV_3', 'MCV_1'];
  const testImmunizations: ImmunizationRecord[] = [
    // Leo: all 9 doses
    ...FIC_CODES.map((code, idx) => ({
      id: `imm-leo-${idx}`,
      resident_id: 'res-p1-2',
      vaccine_code: code,
      dose_number: 1,
      status: 'administered' as const,
      scheduled_date: '2025-06-15',
      administered_date: '2025-06-15',
      created_at: '2025-06-15',
    })),
    // Baby Grace: only BCG & HepB
    {
      id: 'imm-grace-1',
      resident_id: 'res-p2-3',
      vaccine_code: 'BCG',
      dose_number: 1,
      status: 'administered' as const,
      scheduled_date: '2025-01-10',
      administered_date: '2025-01-10',
      created_at: '2025-01-10',
    },
    {
      id: 'imm-grace-2',
      resident_id: 'res-p2-3',
      vaccine_code: 'HEP_B',
      dose_number: 1,
      status: 'administered' as const,
      scheduled_date: '2025-01-10',
      administered_date: '2025-01-10',
      created_at: '2025-01-10',
    },
  ];

  const profile = AnalyticsService.generateBarangayProfile('PALAQUIO', 'March 2026', {
    residents: testResidents,
    vitals: testVitals,
    maternal: [],
    immunizations: testImmunizations,
  });

  // Verify Total Population
  assert(profile.totalPopulation === 10, 'Total population aggregated to exactly 10 residents (100% precision)');

  // Verify Purok 1 stats
  const p1 = profile.purokBreakdown.find((p) => p.purok === 'Purok 1');
  assert(p1 !== undefined, 'Purok 1 segment found in summary');
  assert(p1?.totalResidents === 3, 'Purok 1 count matches expected 3 residents');
  assert(p1?.pregnantCount === 1, 'Purok 1 pregnant count matches expected 1');
  assert(p1?.pediatricCount === 1, 'Purok 1 infant count matches expected 1');
  assert(p1?.seniorCount === 1, 'Purok 1 senior count matches expected 1');
  assert(p1?.hypertensiveCount === 1, 'Purok 1 hypertensive case matches expected 1');

  // Verify Purok 2 stats
  const p2 = profile.purokBreakdown.find((p) => p.purok === 'Purok 2');
  assert(p2?.totalResidents === 4, 'Purok 2 count matches expected 4 residents');
  assert(p2?.pregnantCount === 0, 'Purok 2 pregnant count matches expected 0');
  assert(p2?.seniorCount === 1, 'Purok 2 senior count matches expected 1');
  assert(p2?.hypertensiveCount === 1, 'Purok 2 hypertensive count matches expected 1');

  // Verify Purok 3 stats
  const p3 = profile.purokBreakdown.find((p) => p.purok === 'Purok 3');
  assert(p3?.totalResidents === 3, 'Purok 3 count matches expected 3 residents');
  assert(p3?.pregnantCount === 1, 'Purok 3 pregnant count matches expected 1');
  assert(p3?.febrileCount === 1, 'Purok 3 febrile count matches expected 1');

  // Verify Fully Immunized Children (FIC) calculation
  console.log('\n--- 2. Fully Immunized Children (FIC) Aggregation ---');
  assert(profile.pediatricMetrics.totalInfantsEligible === 2, 'Total eligible infants in cohort is exactly 2');
  assert(profile.pediatricMetrics.fullyImmunizedChildrenCount === 1, 'Exactly 1 child (Leo) meets 100% FIC criteria');
  assert(profile.pediatricMetrics.ficCoverageRate === 50, 'FIC coverage rate correctly computed to 50%');

  // Verify Morbidity Surveillance Tallies
  console.log('\n--- 3. Morbidity Surveillance Tallies ---');
  assert(profile.morbiditySurveillance.hypertensiveCrisisCount === 1, 'Exactly 1 hypertensive crisis case logged');
  assert(profile.morbiditySurveillance.stage2HypertensionCount === 1, 'Exactly 1 Stage 2 hypertension case logged');
  assert(profile.morbiditySurveillance.febrileIllnessCount === 1, 'Exactly 1 febrile illness case logged');
  assert(profile.morbiditySurveillance.acuteRespiratoryCount === 1, 'Acute respiratory infection categorized accurately');

  // Verify Printable Clinical Referral Abstract Generation
  console.log('\n--- 4. Clinical Referral Abstract Compilation ---');
  const referral = AnalyticsService.generateReferralSlip(
    'res-p1-3',
    'v-1',
    'Elena Bagani (BHW)',
    { residents: testResidents, vitals: testVitals }
  );
  assert(referral !== null, 'Referral abstract generated successfully');
  assert(referral?.patientUpi === 'BHS-PAL-2026-0003', 'Patient UPI mapped correctly to abstract');
  assert(referral?.triageSeverity === 'CRITICAL', 'Triage severity flagged as CRITICAL on referral');
  assert(
    referral?.primaryReasonForReferral.includes('EMERGENCY: Hypertensive Crisis') === true,
    'Urgent emergency crisis statement synthesized into referral reason'
  );
  assert(referral?.referringOfficer === 'Elena Bagani (BHW)', 'Duty officer signature line compiled');

  console.log(`\n====================================================`);
  console.log(`🏆 ALL ${passed}/${total} PHASE 4 ANALYTICS & REPORTING TESTS PASSED!`);
  console.log(`====================================================\n`);
}

runPhase4ValidationTests();
