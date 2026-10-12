import { ClinicalService, DOH_EPI_SCHEDULE } from '../src/lib/services/clinical-service';
import { VitalSign, MaternalRecord, ImmunizationRecord } from '../src/types/database';

function runPhase3ValidationTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 3 CLINICAL VITALS & PROGRAM TRACKING VALIDATION');
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

  // 1. Milestone Gate Check: Hypertensive Crisis Flagging & Referral
  console.log('--- 1. Hypertensive Crisis Detection & Encounter Persistence ---');
  const inMemoryVitals: VitalSign[] = [];

  const crisisVitals = ClinicalService.recordVitals(
    {
      residentId: 'res-htn-001',
      systolicBp: 195,
      diastolicBp: 125,
      heartRateBpm: 102,
      respiratoryRateCpm: 24,
      temperatureCelsius: 37.2,
      weightKg: 78,
      heightCm: 165,
      notes: 'Severe occipital headache and visual blurring',
    },
    { inMemoryList: inMemoryVitals }
  );

  assert(crisisVitals.success === true, 'Encounter recorded successfully');
  assert(crisisVitals.evaluation.severity === 'CRITICAL', 'Vitals SBP 195 / DBP 125 flagged as CRITICAL triage');
  assert(
    crisisVitals.evaluation.clinicalFlags.includes('HYPERTENSIVE_CRISIS_EMERGENCY'),
    'Clinical flag HYPERTENSIVE_CRISIS_EMERGENCY present'
  );
  assert(crisisVitals.evaluation.referralRecommended === true, 'referralRecommended is strictly TRUE');
  assert(inMemoryVitals.length === 1, 'Encounter persisted to patient history log');

  // 2. Maternal High-Risk Pregnancy Stratification & Naegele EDD
  console.log('\n--- 2. Maternal Obstetric Stratification & Naegele EDD ---');
  const inMemoryMaternal: MaternalRecord[] = [];

  // Case A: Adolescent pregnancy (age 16)
  const adolescentPregnancy = ClinicalService.enrollMaternalPatient(
    {
      residentId: 'res-mat-teen',
      gravida: 1,
      para: 0,
      fullTerm: 0,
      preterm: 0,
      abortion: 0,
      livingChildren: 0,
      lmp: '2025-10-01',
      residentAge: 16,
    },
    { inMemoryList: inMemoryMaternal }
  );

  assert(adolescentPregnancy.record.edd === '2026-07-08', 'Naegele Rule: LMP 2025-10-01 computes EDD 2026-07-08');
  assert(
    adolescentPregnancy.record.high_risk_flags.includes('ADOLESCENT_PREGNANCY'),
    'Adolescent mother (<18 yrs) flagged as High Risk'
  );

  // Case B: Advanced Maternal Age (age 38) + Grand Multiparity (Para 5)
  const highRiskMother = ClinicalService.enrollMaternalPatient(
    {
      residentId: 'res-mat-senior',
      gravida: 6,
      para: 5,
      fullTerm: 5,
      preterm: 0,
      abortion: 0,
      livingChildren: 5,
      lmp: '2025-11-15',
      residentAge: 38,
    },
    { inMemoryList: inMemoryMaternal }
  );

  assert(
    highRiskMother.record.high_risk_flags.includes('ADVANCED_MATERNAL_AGE'),
    'Mother age 38 flagged with ADVANCED_MATERNAL_AGE'
  );
  assert(
    highRiskMother.record.high_risk_flags.includes('GRAND_MULTIPARITY'),
    'Para 5 flagged with GRAND_MULTIPARITY'
  );

  // 3. Milestone Gate Check: Pediatric EPI Defaulter Engine
  console.log('\n--- 3. Pediatric EPI Defaulter Engine Calculations ---');

  const testInfants = [
    {
      id: 'infant-8wks',
      name: 'Baby Liam',
      barangay: 'Palaquio',
      purok: 'Purok 1',
      dateOfBirth: '2026-01-16', // ~8 weeks old on 2026-03-14
    },
    {
      id: 'infant-16wks',
      name: 'Baby Sophia',
      barangay: 'Tabiog',
      purok: 'Sitio Riverside',
      dateOfBirth: '2025-11-22', // ~16 weeks old on 2026-03-14
    },
    {
      id: 'infant-14mos',
      name: 'Baby Lucas',
      barangay: 'Babangcag',
      purok: 'Purok 3',
      dateOfBirth: '2025-01-14', // ~14 months old on 2026-03-14
    },
    {
      id: 'infant-fic',
      name: 'Baby Clara (FIC Up-To-Date)',
      barangay: 'Palaquio',
      purok: 'Purok 2',
      dateOfBirth: '2026-02-28', // 2 weeks old (only BCG & HepB due)
    },
  ];

  // Records for Baby Clara (received BCG & Hep B at birth)
  const mockVaccines: ImmunizationRecord[] = [
    {
      id: 'imm-c1',
      resident_id: 'infant-fic',
      vaccine_code: 'BCG',
      dose_number: 1,
      status: 'administered',
      scheduled_date: '2026-02-28',
      administered_date: '2026-02-28',
      created_at: '2026-02-28',
    },
    {
      id: 'imm-c2',
      resident_id: 'infant-fic',
      vaccine_code: 'HEP_B',
      dose_number: 1,
      status: 'administered',
      scheduled_date: '2026-02-28',
      administered_date: '2026-02-28',
      created_at: '2026-02-28',
    },
  ];

  const referenceDate = new Date('2026-03-14T00:00:00Z');
  const defaulterList = ClinicalService.computeDefaulters(testInfants, mockVaccines, referenceDate);

  // A: Baby Liam (8 weeks old) should be flagged for 6-week vaccines (PENTA_1, OPV_1, PCV_1)
  const liamOverdue = defaulterList.filter((d) => d.residentId === 'infant-8wks');
  const liamCodes = liamOverdue.map((d) => d.overdueVaccineCode);
  assert(liamCodes.includes('PENTA_1'), '8-week-old Baby Liam flagged for missed Pentavalent 1 (due at 6 wks)');
  assert(liamCodes.includes('OPV_1'), '8-week-old Baby Liam flagged for missed OPV 1 (due at 6 wks)');
  assert(liamCodes.includes('PCV_1'), '8-week-old Baby Liam flagged for missed PCV 1 (due at 6 wks)');

  // B: Baby Lucas (14 months old) should be flagged for 9-month (MCV_1) and 12-month (MCV_2) doses
  const lucasOverdue = defaulterList.filter((d) => d.residentId === 'infant-14mos');
  const lucasCodes = lucasOverdue.map((d) => d.overdueVaccineCode);
  assert(lucasCodes.includes('MCV_1'), '14-month-old Baby Lucas flagged for missed Measles-Rubella (due at 9 mos)');
  assert(lucasCodes.includes('MCV_2'), '14-month-old Baby Lucas flagged for missed MMR Booster (due at 12 mos)');

  // C: Baby Clara (2 weeks old, received birth vaccines) should have 0 defaulter alerts
  const claraOverdue = defaulterList.filter((d) => d.residentId === 'infant-fic');
  assert(claraOverdue.length === 0, 'Fully compliant 2-week-old Baby Clara has 0 defaulter alerts');

  console.log(`\n====================================================`);
  console.log(`🏆 ALL ${passed}/${total} PHASE 3 CLINICAL & PROGRAM TESTS PASSED!`);
  console.log(`====================================================\n`);
}

runPhase3ValidationTests();
