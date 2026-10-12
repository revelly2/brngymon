import {
  evaluateHemodynamics,
  evaluateVitals,
  calculateNaegeleEDD,
  calculateGestationalAgeWeeks,
  generateSoundex,
  generateResidentDedupKey,
  VitalSignsInputSchema,
} from '../src/lib/validations/clinical';

function runPhase1ClinicalTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 1 CLINICAL & TECHNICAL VALIDATION');
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

  // 1. Hemodynamic Stratification Tests
  console.log('--- 1. Hemodynamic Triage Stratification ---');
  const normal = evaluateHemodynamics(115, 75);
  assert(normal.severity === 'NORMAL' && !normal.referral, 'Normal BP (115/75) classified as NORMAL, referral=false');

  const elevated = evaluateHemodynamics(125, 82);
  assert(elevated.severity === 'ELEVATED' && elevated.flags.includes('PRE_HYPERTENSION'), 'Pre-hypertension (125/82) classified as ELEVATED');

  const stage2 = evaluateHemodynamics(145, 95);
  assert(stage2.severity === 'HIGH' && stage2.flags.includes('STAGE_2_HYPERTENSION'), 'Stage 2 Hypertension (145/95) classified as HIGH');

  const crisis = evaluateHemodynamics(190, 125);
  assert(
    crisis.severity === 'CRITICAL' &&
    crisis.flags.includes('HYPERTENSIVE_CRISIS_EMERGENCY') &&
    crisis.referral === true,
    'Hypertensive Crisis (190/125) triggers CRITICAL alert and mandatory referral'
  );

  // 2. Comprehensive Vitals & Febrile Screen
  console.log('\n--- 2. Comprehensive Vitals & BMI Evaluation ---');
  const vitalsEval = evaluateVitals({
    systolicBp: 130,
    diastolicBp: 85,
    temperatureCelsius: 38.6,
    weightKg: 70,
    heightCm: 160,
  });
  assert(vitalsEval.clinicalFlags.includes('FEBRILE_ILLNESS_ALERT'), 'Temperature 38.6°C triggers FEBRILE_ILLNESS_ALERT');
  assert(vitalsEval.bmi === 27.3, 'Height 160cm, Weight 70kg yields BMI 27.3');
  assert(vitalsEval.nutritionalStatus === 'Obese Class I', 'BMI 27.3 classified as Obese Class I (WHO Asia-Pacific)');

  // 3. Naegele\'s Rule & Obstetric Calculations
  console.log('\n--- 3. Obstetric Calculations (Naegele Rule) ---');
  const edd = calculateNaegeleEDD('2026-01-10');
  assert(edd === '2026-10-17', 'LMP 2026-01-10 correctly projects EDD to 2026-10-17 (+1 yr, -3 mos, +7 days)');

  const gaWeeks = calculateGestationalAgeWeeks('2026-01-10', new Date('2026-03-14'));
  assert(gaWeeks === 9, 'GA elapsed weeks from 2026-01-10 to 2026-03-14 is 9 weeks');

  // 4. Deduplication & Soundex Hashing
  console.log('\n--- 4. Soundex Deduplication Tests ---');
  const soundex1 = generateSoundex('Cruz');
  const soundex2 = generateSoundex('Krus');
  assert(soundex1 === 'C620', 'Soundex for "Cruz" generated correctly');
  
  const dedupKey1 = generateResidentDedupKey('Dela Cruz', 'Juan', '1990-05-15');
  const dedupKey2 = generateResidentDedupKey('DELA CRUZ', 'JUAN', '1990-05-15');
  assert(dedupKey1 === dedupKey2, 'Case-insensitive deduplication key matches for identical resident');

  // 5. Physiological Boundary Rejections (Zod)
  console.log('\n--- 5. Physiological Limits Schema Validation ---');
  const invalidBpResult = VitalSignsInputSchema.safeParse({
    residentId: '00000000-0000-0000-0000-000000000000',
    systolicBp: 350, // Above limit 300
    diastolicBp: 80,
    heartRateBpm: 75,
    respiratoryRateCpm: 18,
    temperatureCelsius: 36.8,
    weightKg: 65,
    heightCm: 165,
  });
  assert(!invalidBpResult.success, 'Physiologically impossible SBP (350 mmHg) correctly rejected by schema');

  console.log(`\n====================================================`);
  console.log(`🏆 ALL ${passed}/${total} PHASE 1 CLINICAL & TECHNICAL TESTS PASSED!`);
  console.log(`====================================================\n`);
}

runPhase1ClinicalTests();
