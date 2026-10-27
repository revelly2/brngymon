import { PRESET_ACCOUNTS, ALL_EMPLOYEES } from '../src/lib/context/auth-context';
import { SupabaseSyncService } from '../src/lib/services/supabase-sync-service';
import { ResidentRegistryService } from '../src/lib/services/resident-service';
import { ClinicalService } from '../src/lib/services/clinical-service';
import { UserService } from '../src/lib/services/user-service';

function runAuthAndStorageSyncTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING EMPLOYEE AUTH & SUPABASE STORAGE SYNC VALIDATION');
  console.log('================================================================\n');

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

  // --- 1. Employee Personas & RBAC Validation ---
  console.log('--- 1. Employee Personas & Station Role Mapping ---');
  assert(ALL_EMPLOYEES.length === 5, 'Exactly 5 authorized employee personas configured per PRD Sec. 3');

  const bhw = PRESET_ACCOUNTS.bhw;
  assert(bhw.role === 'bhw' && bhw.barangay === 'PALAQUIO', 'BHW Elena Bagani mapped to Barangay Palaquio BHS');
  assert(bhw.employeeId === 'EMP-BHW-001', 'BHW has unique employee ID EMP-BHW-001');

  const midwife = PRESET_ACCOUNTS.nurse;
  assert(midwife.role === 'nurse' && midwife.barangay === 'TABIOG', 'Midwife Corazon Valdez mapped to Barangay Tabiog');

  const doctor = PRESET_ACCOUNTS.doctor;
  assert(doctor.role === 'doctor' && doctor.barangay === 'BABANGCAG', 'MHO Physician Dr. Arthur Alcantara mapped to Babangcag/MHO');

  const admin = PRESET_ACCOUNTS.admin;
  assert(admin.role === 'admin' && admin.employeeId === 'EMP-ADM-005', 'System Admin correctly provisioned with admin privileges');
  assert(admin.email === 'admin.it@bucay.gov.ph', 'Admin user email verified as admin.it@bucay.gov.ph');

  const lgu = PRESET_ACCOUNTS.lgu_viewer;
  assert(lgu.role === 'lgu_viewer', 'Barangay Captain configured with read-only LGU executive viewer role');

  // --- 2. Supabase Storage Consumption Metrics ---
  console.log('\n--- 2. Supabase Storage Consumption Calculation ---');
  const metrics = SupabaseSyncService.getStorageMetrics();

  assert(metrics.totalConsumedBytes > 0, `Initial storage consumed measured: ${metrics.totalConsumedBytes} bytes`);
  assert(metrics.totalQuotaBytes === 1024 * 1024 * 1024, 'Quota configured to 1.00 GB (1,073,741,824 bytes)');
  assert(metrics.buckets.length === 3, 'Three dedicated Supabase storage buckets provisioned (backups, clinical-docs, fhsis-reports)');

  const backupBucket = metrics.buckets.find((b) => b.id === 'bhsms-backups');
  assert(Boolean(backupBucket && backupBucket.files.length >= 2), 'bhsms-backups bucket contains initial JSON recovery archives');

  const formattedSize = SupabaseSyncService.formatBytes(metrics.totalConsumedBytes);
  assert(formattedSize.includes('KB') || formattedSize.includes('Bytes'), `Storage formatting verified: ${formattedSize}`);

  // --- 3. Sync Everything to Supabase Engine ---
  console.log('\n--- 3. Sync Everything Engine & Storage Calculation ---');
  const initialBytes = metrics.totalConsumedBytes;

  SupabaseSyncService.syncEverything(admin).then((syncResult) => {
    assert(syncResult.success === true, 'Sync Everything executed successfully');
    assert(syncResult.syncedResidents >= 0, `Synced ${syncResult.syncedResidents} residents into cloud payload`);
    assert(syncResult.syncedVitals >= 0, `Synced ${syncResult.syncedVitals} vitals records into cloud payload`);
    assert(syncResult.storageBytesAdded > 0, `Payload byte size calculated: +${syncResult.storageBytesAdded} bytes`);
    assert(syncResult.generatedFileName.includes('bhsms_cloud_sync_palaquio'), `Generated snapshot filename: ${syncResult.generatedFileName}`);

    // Verify storage metrics updated
    const postSyncMetrics = SupabaseSyncService.getStorageMetrics();
    assert(
      postSyncMetrics.totalConsumedBytes > initialBytes,
      `Storage consumed increased from ${initialBytes} to ${postSyncMetrics.totalConsumedBytes} bytes`
    );

    const updatedBackupBucket = postSyncMetrics.buckets.find((b) => b.id === 'bhsms-backups');
    const hasNewFile = updatedBackupBucket?.files.some((f) => f.name === syncResult.generatedFileName);
    assert(Boolean(hasNewFile), 'Newly uploaded sync archive registered in bhsms-backups bucket file list');

    // --- 4. Self-View & Self-Edit Prevention (RA 10173 Audit Principle) ---
    console.log('\n--- 4. Self-View & Self-Edit Security Restrictions ---');
    const allUsers = UserService.getUsers();
    const adminUser = allUsers.find((u) => u.role === 'admin')!;
    assert(Boolean(adminUser), 'Admin user located in system users registry');

    // Verify isSameUser identity matching
    const isSelfDetected = UserService.isSameUser(adminUser, admin);
    assert(isSelfDetected === true, 'UserService.isSameUser correctly identifies active administrative session');

    // Verify filter excludes self
    const filteredForAdmin = allUsers.filter((u) => !UserService.isSameUser(u, admin));
    assert(
      !filteredForAdmin.some((u) => u.email === admin.email),
      'Active administrator is excluded from visible personnel list (cannot see self)'
    );
    assert(
      filteredForAdmin.length === allUsers.length - 1,
      `Personnel list reduced from ${allUsers.length} to ${filteredForAdmin.length} items`
    );

    // Verify self-update is blocked
    return UserService.updateUser(adminUser.id, { fullName: 'Hacked Name' }, admin).then((updateRes) => {
      assert(updateRes.success === false, 'Self-edit rejected by UserService.updateUser');
      assert(
        Boolean(updateRes.error?.includes('Security constraint')),
        `Expected security constraint error returned: "${updateRes.error}"`
      );

      // Verify self-toggle is blocked
      return UserService.toggleUserStatus(adminUser.id, admin);
    }).then((toggleRes) => {
      assert(toggleRes.success === false, 'Self-deactivation rejected by UserService.toggleUserStatus');

      // Verify self-delete is blocked
      return UserService.deleteUser(adminUser.id, admin);
    }).then((deleteRes) => {
      assert(deleteRes.success === false, 'Self-deletion rejected by UserService.deleteUser');

      console.log('\n================================================================');
      console.log(`🏆 ALL ${passed}/${total} AUTH, STORAGE, & RBAC SECURITY TESTS PASSED!`);
      console.log('================================================================\n');
    });
  }).catch((err) => {
    console.error('Sync Everything test error:', err);
    process.exit(1);
  });
}

runAuthAndStorageSyncTests();
