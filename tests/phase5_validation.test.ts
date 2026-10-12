import {
  EvaluationService,
  UAT_RESPONDENTS,
  LikertCriterion,
} from '../src/lib/services/evaluation-service';

function runPhase5ValidationTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 5 FIELD USER EVALUATION & UAT VALIDATION');
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

  // 1. Respondent Representation (Purposive Sampling N=10)
  console.log('--- 1. Purposive Sampling Respondent Representation ---');
  assert(UAT_RESPONDENTS.length === 10, 'Sample size N equals exactly 10 primary respondents');

  const barangaysRepresented = new Set(UAT_RESPONDENTS.map((r) => r.barangay));
  assert(barangaysRepresented.has('Palaquio'), 'Barangay Palaquio health workers represented');
  assert(barangaysRepresented.has('Tabiog'), 'Barangay Tabiog health workers represented');
  assert(barangaysRepresented.has('Babangcag'), 'Barangay Babangcag health workers represented');

  const rolesRepresented = new Set(UAT_RESPONDENTS.map((r) => r.role));
  assert(rolesRepresented.has('BHW'), 'Frontline Barangay Health Workers (BHW) included');
  assert(rolesRepresented.has('Rural Health Midwife'), 'Rural Health Midwives (RHM) included');

  // 2. Weighted Mean Mathematical Precision
  console.log('\n--- 2. Weighted Mean Calculation Formula Verification ---');
  // Sample: 6 respondents gave 5, 4 respondents gave 4 -> (6*5 + 4*4) / 10 = (30 + 16) / 10 = 4.60
  const sampleCalc = EvaluationService.calculateWeightedMean([5, 5, 5, 5, 5, 5, 4, 4, 4, 4]);
  assert(sampleCalc.weightedMean === 4.6, 'Weighted mean accurately computed to 4.60 via mathematical formula');
  assert(sampleCalc.counts[5] === 6, 'Count of 5-star ratings is exactly 6');
  assert(sampleCalc.counts[4] === 4, 'Count of 4-star ratings is exactly 4');

  // 3. Likert Scale Interpretation Thresholds (PRD Table 8.2)
  console.log('\n--- 3. Likert Scoring Thresholds & Directive Classification ---');
  const veryGood = EvaluationService.classifyScore(4.5);
  assert(
    veryGood.rating === 'Very Good' &&
    veryGood.action.includes('clear for full facility deployment'),
    'Score 4.50 classified as "Very Good" (Clear for full facility deployment)'
  );

  const good = EvaluationService.classifyScore(3.8);
  assert(good.rating === 'Good', 'Score 3.80 classified as "Good" (Acceptable baseline)');

  const moderate = EvaluationService.classifyScore(3.0);
  assert(moderate.rating === 'Moderate', 'Score 3.00 classified as "Moderate" (Requires refinement)');

  const poor = EvaluationService.classifyScore(2.2);
  assert(poor.rating === 'Poor', 'Score 2.20 classified as "Poor" (Fails acceptance gate)');

  const veryPoor = EvaluationService.classifyScore(1.4);
  assert(veryPoor.rating === 'Very Poor', 'Score 1.40 classified as "Very Poor" (Critical escalation)');

  // 4. Milestone Gate: Full UAT Report Generation & Operational Readiness
  console.log('\n--- 4. Full UAT Composite Score Verification ---');
  const report = EvaluationService.generateUATReport();

  assert(report.sampleSize === 10, 'Report sample size reflects N=10');
  assert(report.criteriaResults.length === 4, 'Report evaluates all 4 mandated criteria');

  // Effectiveness check
  const eff = report.criteriaResults.find((c) => c.id === 'effectiveness');
  assert(eff !== undefined && eff.weightedMean >= 4.2, 'Effectiveness & Functionality meets >= 4.20 threshold');

  // Efficiency check
  const timeEff = report.criteriaResults.find((c) => c.id === 'efficiency');
  assert(timeEff !== undefined && timeEff.weightedMean >= 4.2, 'Efficiency & Time Savings meets >= 4.20 threshold');

  // Usability check
  const usb = report.criteriaResults.find((c) => c.id === 'usability');
  assert(usb !== undefined && usb.weightedMean >= 4.2, 'User-Friendliness meets >= 4.20 threshold');

  // Reliability check
  const rel = report.criteriaResults.find((c) => c.id === 'reliability');
  assert(rel !== undefined && rel.weightedMean >= 4.2, 'Reliability & Clinical Safety meets >= 4.20 threshold');

  // Overall Composite
  assert(
    report.overallCompositeMean >= 4.2,
    `Overall Composite Mean (${report.overallCompositeMean}) qualifies as >= 4.20 "Very Good"`
  );
  assert(report.operationalReadiness === true, 'System operationalReadiness flagged as TRUE');

  console.log(`\n====================================================`);
  console.log(`🏆 ALL ${passed}/${total} PHASE 5 FIELD EVALUATION TESTS PASSED!`);
  console.log(`====================================================\n`);
}

runPhase5ValidationTests();
