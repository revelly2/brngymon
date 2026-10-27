import { SYSTEM_MODULES, getDefaultModulesForRole, getModuleDefinition } from '../src/lib/constants/modules';
import { UserService, INITIAL_SYSTEM_USERS } from '../src/lib/services/user-service';
import { ClinicalService } from '../src/lib/services/clinical-service';
import { UserSession } from '../src/lib/context/auth-context';
import { SystemModuleId } from '../src/types/database';

async function runModularPermissionsTests() {
  console.log('--- RUNNING MODULAR PERMISSIONS & USER MANAGEMENT VALIDATION TESTS ---\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
    }
  }

  // 1. Module Registry & Catalog Verification
  assert(SYSTEM_MODULES.length === 10, 'System defines exactly 10 functional modules');
  const chartModule = getModuleDefinition('patient_chart');
  assert(!!chartModule && chartModule.category === 'clinical', 'patient_chart is registered under clinical category');
  assert(Boolean(chartModule?.defaultRoles.includes('doctor')), 'patient_chart default role includes doctor');
  assert(!chartModule?.defaultRoles.includes('nurse'), 'patient_chart is not default for nurse (requires delegation)');

  // 2. Default Role Matrix
  const bhwDefaults = getDefaultModulesForRole('bhw');
  assert(bhwDefaults.includes('resident_profiling'), 'BHW default includes resident_profiling');
  assert(bhwDefaults.includes('resident_intake'), 'BHW default includes resident_intake');
  assert(bhwDefaults.includes('vitals_triage'), 'BHW default includes vitals_triage');
  assert(!bhwDefaults.includes('patient_chart'), 'BHW default excludes patient_chart');

  const nurseDefaults = getDefaultModulesForRole('nurse');
  assert(nurseDefaults.includes('maternal_care'), 'Nurse default includes maternal_care');
  assert(nurseDefaults.includes('immunization_epi'), 'Nurse default includes immunization_epi');
  assert(nurseDefaults.includes('referral_management'), 'Nurse default includes referral_management');
  assert(!nurseDefaults.includes('patient_chart'), 'Nurse default excludes patient_chart by default');

  const adminDefaults = getDefaultModulesForRole('admin');
  assert(adminDefaults.length === 10, 'Admin role default contains all 10 modules');

  // 3. UserService Users Retrieval & Module Integrity
  const users = UserService.getUsers();
  assert(users.length >= 1, 'UserService loads initial operators');
  const adminUser = users.find((u) => u.role === 'admin');
  assert(!!adminUser && adminUser.modules.length === 10, 'Admin operator has full module suite');

  // 4. Special Delegation: Grant Nurse access to Medical Patient Chart
  const adminSession: UserSession = {
    id: adminUser?.id || 'admin-test',
    email: 'admin.it@bucay.gov.ph',
    name: 'Admin IT',
    role: 'admin',
    barangay: 'PALAQUIO',
    modules: adminDefaults,
  };

  let nurseUser = users.find((u) => u.role === 'nurse');
  if (!nurseUser) {
    const created = await UserService.createUser(
      {
        fullName: 'Corazon Valdez, RM (Midwife)',
        email: 'midwife.rhus@bucay.gov.ph',
        role: 'nurse',
        barangay: 'TABIOG',
        employeeId: 'EMP-NURSE-001',
      },
      adminSession
    );
    nurseUser = created.user || UserService.getUsers().find((u) => u.role === 'nurse');
  }
  assert(!!nurseUser, 'Found nurse user in registry');
  if (nurseUser) {
    assert(!UserService.hasUserModule(nurseUser, 'patient_chart'), 'Nurse initially does not have patient_chart');

    // Grant patient_chart
    const updatedModules: SystemModuleId[] = [...nurseUser.modules, 'patient_chart'];
    UserService.updateUser(
      nurseUser.id,
      { modules: updatedModules },
      adminSession
    );

    // Synchronous or returned object check
    const refreshedNurse = UserService.getUsers().find((u) => u.id === nurseUser.id);
    assert(
      !!refreshedNurse && UserService.hasUserModule(refreshedNurse, 'patient_chart'),
      'Nurse successfully granted elevated special clearance for patient_chart'
    );
  }

  // 5. Clinical Encounter & Medical Chart Documentation
  const encounter = ClinicalService.addEncounter({
    residentId: 'r-001',
    encounterDate: new Date().toISOString(),
    providerName: 'Corazon Valdez, RM (Midwife)',
    providerRole: 'nurse',
    chiefComplaint: 'Headache & maternal triage follow-up',
    clinicalImpression: 'Gestational Hypertension (Mild)',
    treatmentPlan: 'Bed rest on left lateral position, close BP surveillance at BHS.',
  });

  assert(!!encounter.id, 'Clinical encounter successfully saved with UUID');
  const encountersForR1 = ClinicalService.getEncounters('r-001');
  assert(encountersForR1.some((e) => e.id === encounter.id), 'Encounter retrieved by residentId from patient chart');

  console.log(`\nTests Completed: ${passed}/${total} passed.`);
  if (passed !== total) {
    process.exit(1);
  }
}

runModularPermissionsTests();
