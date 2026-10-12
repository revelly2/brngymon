import { ResidentRegistryService, RegistrationInput } from '../src/lib/services/resident-service';
import { BarangayCode, BiologicalSex, Resident } from '../src/types/database';

function runPhase2ValidationTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 2 CORE INFRASTRUCTURE & REGISTRY VALIDATION');
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

  // Use an isolated in-memory registry list for deterministic testing
  const mockRegistry: Resident[] = [];

  // 1. Milestone Gate: Register 20 mock residents without collisions
  console.log('--- 1. Registering 20 Distinct Residents Across Pilot Barangays ---');

  const sampleResidents: Array<{
    barangay: BarangayCode;
    purok: string;
    first: string;
    last: string;
    dob: string;
    sex: BiologicalSex;
    pregnant?: boolean;
  }> = [
    { barangay: 'PALAQUIO', purok: 'Purok 1 Centro', first: 'Juan', last: 'Dela Cruz', dob: '1985-03-12', sex: 'male' },
    { barangay: 'PALAQUIO', purok: 'Purok 1 Centro', first: 'Juana', last: 'Dela Cruz', dob: '1987-07-22', sex: 'female', pregnant: true },
    { barangay: 'PALAQUIO', purok: 'Purok 2 North', first: 'Carlos', last: 'Mendoza', dob: '1960-01-15', sex: 'male' },
    { barangay: 'PALAQUIO', purok: 'Purok 2 North', first: 'Esperanza', last: 'Mendoza', dob: '1964-09-30', sex: 'female' },
    { barangay: 'PALAQUIO', purok: 'Purok 3 Riverside', first: 'Lucas', last: 'Bautista', dob: '2024-11-10', sex: 'male' },
    { barangay: 'PALAQUIO', purok: 'Purok 3 Riverside', first: 'Angelica', last: 'Aquino', dob: '1998-05-18', sex: 'female', pregnant: true },
    { barangay: 'PALAQUIO', purok: 'Purok 4 Hillside', first: 'Roberto', last: 'Pascual', dob: '1952-12-05', sex: 'male' },

    { barangay: 'TABIOG', purok: 'Sitio Centro', first: 'Mateo', last: 'Flores', dob: '1990-04-14', sex: 'male' },
    { barangay: 'TABIOG', purok: 'Sitio Centro', first: 'Lourdes', last: 'Flores', dob: '1992-08-25', sex: 'female' },
    { barangay: 'TABIOG', purok: 'Sitio Riverside', first: 'Benigno', last: 'Alvarez', dob: '1975-02-19', sex: 'male' },
    { barangay: 'TABIOG', purok: 'Sitio Riverside', first: 'Corazon', last: 'Alvarez', dob: '1978-06-11', sex: 'female' },
    { barangay: 'TABIOG', purok: 'Sitio Mountain', first: 'Gabriel', last: 'Santos', dob: '2025-01-08', sex: 'male' },
    { barangay: 'TABIOG', purok: 'Sitio Mountain', first: 'Jasmine', last: 'Villanueva', dob: '2001-10-02', sex: 'female', pregnant: true },
    { barangay: 'TABIOG', purok: 'Sitio Centro', first: 'Danilo', last: 'Reyes', dob: '1958-03-21', sex: 'male' },

    { barangay: 'BABANGCAG', purok: 'Purok 1 Proper', first: 'Felipe', last: 'Garcia', dob: '1982-11-15', sex: 'male' },
    { barangay: 'BABANGCAG', purok: 'Purok 1 Proper', first: 'Teresa', last: 'Garcia', dob: '1984-04-09', sex: 'female' },
    { barangay: 'BABANGCAG', purok: 'Purok 2 Valley', first: 'Miguel', last: 'Soriano', dob: '2023-08-14', sex: 'male' },
    { barangay: 'BABANGCAG', purok: 'Purok 2 Valley', first: 'Clara', last: 'Soriano', dob: '1999-12-03', sex: 'female' },
    { barangay: 'BABANGCAG', purok: 'Purok 3 Uplands', first: 'Armando', last: 'Tolentino', dob: '1949-07-04', sex: 'male' },
    { barangay: 'BABANGCAG', purok: 'Purok 3 Uplands', first: 'Leonora', last: 'Tolentino', dob: '1953-09-17', sex: 'female' },
  ];

  sampleResidents.forEach((res, index) => {
    const input: RegistrationInput = {
      barangay: res.barangay,
      purok: res.purok,
      firstName: res.first,
      lastName: res.last,
      dateOfBirth: res.dob,
      biologicalSex: res.sex,
      civilStatus: 'married',
      isPregnant: res.pregnant || false,
    };

    const reg = ResidentRegistryService.registerResident(input, { inMemoryList: mockRegistry });
    assert(reg.success === true, `Enrolled Resident #${index + 1}: ${res.first} ${res.last} (${res.barangay})`);
    assert(Boolean(reg.resident?.upi), `Resident #${index + 1} assigned valid UPI: ${reg.resident?.upi}`);
  });

  assert(mockRegistry.length === 20, 'Milestone Gate Check: Exactly 20 residents registered in memory registry');

  // 2. UPI Format Validation
  console.log('\n--- 2. UPI Format & Sequence Validation ---');
  const upiRegex = /^BHS-(PAL|TAB|BAB)-\d{4}-\d{4}$/;
  const allUpisValid = mockRegistry.every((r) => upiRegex.test(r.upi));
  assert(allUpisValid, 'All 20 registered residents have valid formatted UPI (BHS-[BAR]-[YEAR]-[SEQ])');

  // 3. Soundex Deduplication Collision Detection
  console.log('\n--- 3. Deduplication Engine (Soundex Collision Prevention) ---');
  
  // Try registering exact duplicate of Resident #1: Juan Dela Cruz (1985-03-12)
  const duplicateAttempt: RegistrationInput = {
    barangay: 'PALAQUIO',
    purok: 'Purok 1 Centro',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    dateOfBirth: '1985-03-12',
    biologicalSex: 'male',
    civilStatus: 'married',
    isPregnant: false,
  };

  const dupResult = ResidentRegistryService.registerResident(duplicateAttempt, { inMemoryList: mockRegistry });
  assert(dupResult.success === false, 'Duplicate enrollment blocked by deduplication validation');
  assert(
    dupResult.error?.includes('Duplicate patient record detected') === true,
    'Appropriate duplicate warning message returned to BHW'
  );

  // Try registering phonetic duplicate variation with spacing: "De la Cruz" with same DOB
  const phoneticDupCheck = ResidentRegistryService.checkForDuplicates('De la Cruz', 'Juan', '1985-03-12', mockRegistry);
  assert(phoneticDupCheck.hasExactMatch || phoneticDupCheck.hasPhoneticMatch, 'Phonetic variant "De la Cruz" flagged as potential collision');

  // 4. Age and Cohort Stratification Verification
  console.log('\n--- 4. Demographic Cohort Stratification ---');
  const pregnantResidents = mockRegistry.filter((r) => r.is_pregnant);
  assert(pregnantResidents.length === 3, 'Exactly 3 maternal cohort members identified');

  const infants = mockRegistry.filter((r) => {
    const diff = Date.now() - new Date(r.date_of_birth).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970) < 5;
  });
  assert(infants.length === 3, 'Exactly 3 pediatric EPI cohort members identified (<5 yrs)');

  const seniors = mockRegistry.filter((r) => {
    const diff = Date.now() - new Date(r.date_of_birth).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970) >= 60;
  });
  assert(seniors.length === 6, 'Exactly 6 geriatric chronic care cohort members identified (>=60 yrs)');

  console.log(`\n====================================================`);
  console.log(`🏆 ALL ${passed}/${total} PHASE 2 CORE INFRASTRUCTURE TESTS PASSED!`);
  console.log(`====================================================\n`);
}

runPhase2ValidationTests();
