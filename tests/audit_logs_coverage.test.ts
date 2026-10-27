import { AuditService, INITIAL_AUDIT_LOGS, AuditRole } from '../src/lib/services/audit-service';

function runAuditTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPREHENSIVE AUDIT TRAIL LOGGING TEST');
  console.log('================================================================\n');

  // 1. Verify Baseline Seed Logs
  const baselineLogs = AuditService.getLogs();
  console.log(`[TEST 1] Initial audit logs count: ${baselineLogs.length}`);
  if (baselineLogs.length < 12) {
    throw new Error(`Expected at least 12 baseline audit records, found ${baselineLogs.length}`);
  }
  console.log('✅ [PASS] Baseline audit logs properly initialized');

  // 2. Verify Persona Coverage across all 6 roles
  const rolesFound = new Set<AuditRole>(baselineLogs.map((l) => l.role));
  const expectedRoles: AuditRole[] = ['doctor', 'nurse', 'bhw', 'lgu_viewer', 'admin', 'system'];

  for (const role of expectedRoles) {
    if (!rolesFound.has(role)) {
      throw new Error(`Audit log is missing entries for expected role: ${role}`);
    }
    const count = baselineLogs.filter((l) => l.role === role).length;
    console.log(`✅ [PASS] Persona role "${role}" has ${count} registered audit record(s)`);
  }

  // 3. Verify RA 10173 Section 20 Core Forensic Fields
  const sampleLog = baselineLogs[0];
  const requiredFields = ['id', 'timestamp', 'actor', 'role', 'action', 'resource', 'ip', 'barangay', 'status', 'details'];
  for (const field of requiredFields) {
    if (!(field in sampleLog)) {
      throw new Error(`Audit log entry missing mandatory forensic field: ${field}`);
    }
  }
  console.log('✅ [PASS] RA 10173 Section 20 mandatory forensic fields verified on log entries');

  // 4. Test Dynamic Logging
  const customEntry = AuditService.logAction({
    actor: 'Dr. Arthur Alcantara, MHO',
    role: 'doctor',
    action: 'TEST_EMERGENCY_TELECONSULT',
    resource: 'RES-TAB-2026-9999',
    barangay: 'BABANGCAG',
    status: 'WARNING',
    details: 'Urgent teleconsultation triage initiated for hypertensive crisis.',
  });

  if (customEntry.actor !== 'Dr. Arthur Alcantara, MHO' || customEntry.status !== 'WARNING') {
    throw new Error('Dynamic audit log action failed to produce expected entry');
  }

  const updatedLogs = AuditService.getLogs();
  if (updatedLogs[0].id !== customEntry.id) {
    throw new Error('Newly created audit entry is not at the top of the logs');
  }
  console.log('✅ [PASS] Dynamic logAction successfully appends to audit trail with descending timestamp ordering');

  // 5. Test Reset to Defaults
  AuditService.resetToDefaults();
  const resetLogs = AuditService.getLogs();
  if (resetLogs.length !== INITIAL_AUDIT_LOGS.length) {
    throw new Error('resetToDefaults did not restore baseline audit records');
  }
  console.log('✅ [PASS] resetToDefaults restores baseline seed records');

  console.log('\n================================================================');
  console.log('🏆 ALL AUDIT TRAIL LOGGING TESTS PASSED (100% PERSONA COVERAGE)');
  console.log('================================================================\n');
}

runAuditTests();
