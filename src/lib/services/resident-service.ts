import { BarangayCode, BiologicalSex, Resident } from '@/types/database';
import { generateResidentDedupKey, generateSoundex } from '@/lib/validations/clinical';

const BARANGAY_PREFIX_MAP: Record<BarangayCode, string> = {
  PALAQUIO: 'PAL',
  TABIOG: 'TAB',
  BABANGCAG: 'BAB',
};

// Initial verified mock records for Abra pilot communities
export const INITIAL_MOCK_RESIDENTS: Resident[] = [
  {
    id: '11111111-0001-4000-8000-000000000001',
    upi: 'BHS-PAL-2026-0001',
    household_id: 'h1',
    first_name: 'Maria',
    middle_name: 'Santos',
    last_name: 'Dela Cruz',
    date_of_birth: '1994-06-12',
    biological_sex: 'female',
    civil_status: 'married',
    barangay: 'PALAQUIO',
    purok: 'Purok 1 Centro',
    contact_number: '09171234567',
    philhealth_id: '12-345678901-2',
    is_pregnant: true,
    soundex_key: 'D426-MAR-1994-06-12',
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: '11111111-0002-4000-8000-000000000002',
    upi: 'BHS-TAB-2026-0002',
    household_id: 'h2',
    first_name: 'Rodrigo',
    middle_name: 'Bautista',
    last_name: 'Flores',
    date_of_birth: '1962-11-04',
    biological_sex: 'male',
    civil_status: 'married',
    barangay: 'TABIOG',
    purok: 'Sitio Riverside',
    contact_number: '09289876543',
    philhealth_id: '01-987654321-0',
    is_pregnant: false,
    soundex_key: 'F462-ROD-1962-11-04',
    created_at: new Date('2026-01-12').toISOString(),
    updated_at: new Date('2026-01-12').toISOString(),
  },
  {
    id: '11111111-0003-4000-8000-000000000003',
    upi: 'BHS-BAB-2026-0003',
    household_id: 'h3',
    first_name: 'Ethan',
    middle_name: 'Garcia',
    last_name: 'Ramos',
    date_of_birth: '2025-08-20',
    biological_sex: 'male',
    civil_status: 'single',
    barangay: 'BABANGCAG',
    purok: 'Purok 3 Hillside',
    contact_number: '09195551234',
    is_pregnant: false,
    soundex_key: 'R520-ETH-2025-08-20',
    created_at: new Date('2026-02-01').toISOString(),
    updated_at: new Date('2026-02-01').toISOString(),
  },
];

export interface RegistrationInput {
  barangay: BarangayCode;
  purok: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  alias?: string;
  dateOfBirth: string;
  biologicalSex: BiologicalSex;
  civilStatus: 'single' | 'married' | 'widowed' | 'separated' | 'cohabiting';
  contactNumber?: string;
  philhealthId?: string;
  isPregnant: boolean;
  householdNumber?: string;
}

export class ResidentRegistryService {
  private static STORAGE_KEY = 'bhms_residents_cache';
  private static serverCache: Resident[] = [...INITIAL_MOCK_RESIDENTS];

  public static getResidents(): Resident[] {
    if (typeof window === 'undefined') {
      return this.serverCache;
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(INITIAL_MOCK_RESIDENTS));
        return [...INITIAL_MOCK_RESIDENTS];
      }
      return JSON.parse(stored);
    } catch {
      return this.serverCache;
    }
  }

  public static saveResidents(residents: Resident[]) {
    this.serverCache = residents;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(residents));
      } catch (err) {
        console.error('Failed to write local offline resident cache', err);
      }
    }
  }

  /**
   * Generates next standardized UPI: BHS-[BARANGAY_CODE]-[YEAR]-[SEQUENCE]
   */
  public static generateUPI(barangay: BarangayCode, existingCount: number): string {
    const prefix = BARANGAY_PREFIX_MAP[barangay] || 'BRG';
    const year = new Date().getFullYear();
    const seq = String(existingCount + 1).padStart(4, '0');
    return `BHS-${prefix}-${year}-${seq}`;
  }

  /**
   * Checks for potential duplicate residents using Soundex deduplication key and exact matches
   */
  public static checkForDuplicates(
    lastName: string,
    firstName: string,
    dob: string,
    currentResidents?: Resident[]
  ): { hasExactMatch: boolean; hasPhoneticMatch: boolean; matches: Resident[] } {
    const list = currentResidents || this.getResidents();
    const inputDedupKey = generateResidentDedupKey(lastName, firstName, dob);
    const inputSoundex = generateSoundex(lastName);

    const matches: Resident[] = [];
    let hasExactMatch = false;
    let hasPhoneticMatch = false;

    for (const resident of list) {
      if (resident.soundex_key === inputDedupKey) {
        hasExactMatch = true;
        matches.push(resident);
      } else if (
        generateSoundex(resident.last_name) === inputSoundex &&
        resident.date_of_birth === dob
      ) {
        hasPhoneticMatch = true;
        matches.push(resident);
      }
    }

    return {
      hasExactMatch,
      hasPhoneticMatch,
      matches,
    };
  }

  /**
   * Registers a new resident with automated deduplication and UPI generation
   */
  public static registerResident(
    input: RegistrationInput,
    options?: { allowDuplicateOverride?: boolean; inMemoryList?: Resident[] }
  ): { success: boolean; resident?: Resident; error?: string; collision?: Resident } {
    const list = options?.inMemoryList || this.getResidents();

    // Deduplication check
    const dupCheck = this.checkForDuplicates(input.lastName, input.firstName, input.dateOfBirth, list);
    if (dupCheck.hasExactMatch && !options?.allowDuplicateOverride) {
      return {
        success: false,
        error: `Duplicate patient record detected: Existing patient ${dupCheck.matches[0].first_name} ${dupCheck.matches[0].last_name} (${dupCheck.matches[0].upi}) shares identical Soundex key and birthdate.`,
        collision: dupCheck.matches[0],
      };
    }

    const upi = this.generateUPI(input.barangay, list.length);
    const soundexKey = generateResidentDedupKey(input.lastName, input.firstName, input.dateOfBirth);

    const newResident: Resident = {
      id: crypto.randomUUID ? crypto.randomUUID() : `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      upi,
      first_name: input.firstName.trim(),
      middle_name: input.middleName?.trim() || null,
      last_name: input.lastName.trim(),
      suffix: input.suffix?.trim() || null,
      alias: input.alias?.trim() || null,
      dateOfBirth: input.dateOfBirth,
      date_of_birth: input.dateOfBirth,
      biological_sex: input.biologicalSex,
      civil_status: input.civilStatus,
      barangay: input.barangay,
      purok: input.purok.trim(),
      contact_number: input.contactNumber?.trim() || null,
      philhealth_id: input.philhealthId?.trim() || null,
      is_pregnant: input.isPregnant,
      soundex_key: soundexKey,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as unknown as Resident;

    const updated = [newResident, ...list];
    if (!options?.inMemoryList) {
      this.saveResidents(updated);
    } else {
      options.inMemoryList.unshift(newResident);
    }

    return {
      success: true,
      resident: newResident,
    };
  }
}
