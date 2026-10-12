import { SystemService } from '../src/lib/services/system-service';
import { ResidentRegistryService } from '../src/lib/services/resident-service';
import { ClinicalService } from '../src/lib/services/clinical-service';
import { AnalyticsService } from '../src/lib/services/analytics-service';

function runPhase6ValidationTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 6 FINAL DEPLOYMENT & OPERATIONALIZATION VALIDATION');
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

  // 1. Workstation Diagnostics & Operational Health Check
  console.log('--- 1. Workstation Diagnostic Verification ---');
  const diagnostics = SystemService.runDiagnostics('Barangay Palaquio BHS');
  assert(diagnostics.status === 'ONLINE', 'Workstation diagnostic status is ONLINE');
  assert(diagnostics.supabaseConnected === true, 'Supabase BaaS connection verified');
  assert(diagnostics.totalCachedResidents >= 3, 'Baseline resident profiles cached and ready for offline use');
  assert(diagnostics.totalCachedVitals >= 2, 'Clinical vitals cached locally');
  assert(diagnostics.totalCachedMaternal >= 1, 'Maternal antenatal cohort cached locally');
  assert(diagnostics.totalCachedImmunizations >= 3, 'Pediatric EPI records cached locally');

  // 2. Data Archival, Backup Generation & Integrity Verification
  console.log('\n--- 2. Facility Backup Bundle & Cryptographic Checksum ---');
  const backup = SystemService.generateBackupBundle('Barangay Tabiog BHS');
  assert(backup.systemVersion === '1.1.0-prod', 'Backup bundle version stamped with production release');
  assert(backup.facility === 'Barangay Tabiog BHS', 'Facility identity mapped to archive');
  assert(Boolean(backup.checksum), `Valid integrity checksum generated: ${backup.checksum}`);

  // Integrity validation on untampered bundle
  const isOriginalValid = SystemService.verifyBackupIntegrity(backup);
  assert(isOriginalValid === true, 'Untampered backup passes integrity checksum validation');

  // Tamper detection: modifying data must invalidate checksum
  const tamperedBackup = {
    ...backup,
    residents: [...backup.residents, { id: 'fake-tampered-id', upi: 'FAKE-UPI' }],
  };
  const isTamperedValid = SystemService.verifyBackupIntegrity(tamperedBackup);
  assert(isTamperedValid === false, 'Tampered backup bundle correctly rejected by checksum validator');

  // 3. End-to-End System Operationalization Check
  console.log('\n--- 3. End-to-End Primary Care Operationalization Workflow ---');

  // Step A: Intake new resident in Babangcag
  const intake = ResidentRegistryService.registerResident({
    barangay: 'BABANGCAG',
    purok: 'Purok 1 Proper',
    firstName: 'Amalia',
    lastName: 'Santos',
    dateOfBirth: '1996-04-18',
    biologicalSex: 'female',
    civilStatus: 'married',
    isPregnant: true,
  });
  assert(intake.success === true, 'Step A: Patient enrolled with valid UPI');
  const patientId = intake.resident!.id;

  // Step B: Record vitals encounter with stage 2 hypertension
  const vitalsEncounter = ClinicalService.recordVitals({
    residentId: patientId,
    systolicBp: 155,
    diastolicBp: 98,
    heartRateBpm: 84,
    respiratoryRateCpm: 18,
    temperatureCelsius: 37.1,
    weightKg: 64,
    heightCm: 158,
    notes: 'BHW intake checkup. Reports slight dizziness.',
  });
  assert(vitalsEncounter.success === true, 'Step B: Vitals recorded successfully');
  assert(vitalsEncounter.evaluation.severity === 'HIGH', 'Triage correctly flagged Stage 2 Hypertension');

  // Step C: Enroll in Maternal Health Pathway
  const maternalEncounter = ClinicalService.enrollMaternalPatient({
    residentId: patientId,
    gravida: 2,
    para: 1,
    fullTerm: 1,
    preterm: 0,
    abortion: 0,
    livingChildren: 1,
    lmp: '2025-11-01',
    residentAge: 30,
  });
  assert(maternalEncounter.success === true, 'Step C: Enrolled in Maternal Care pathway');
  assert(maternalEncounter.record.edd === '2026-08-08', 'EDD calculated accurately via Naegele rule');

  // Step D: Generate Clinical Referral Slip
  const referral = AnalyticsService.generateReferralSlip(patientId, vitalsEncounter.vitalsRecord?.id);
  assert(referral !== null, 'Step D: 1-Page clinical referral abstract synthesized');
  assert(referral?.vitalSigns.systolicBp === 155, 'Referral abstract captures recorded blood pressure');

  console.log(`\n====================================================`);
  console.log(`🏆 ALL ${passed}/${total} PHASE 6 OPERATIONALIZATION TESTS PASSED!`);
  console.log(`====================================================\n`);
}

runPhase6ValidationTests();
