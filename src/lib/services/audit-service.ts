import { UserRole } from '@/types/database';

export type AuditRole = UserRole | 'system';
export type AuditStatus = 'SUCCESS' | 'WARNING' | 'ALERT';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: AuditRole;
  action: string;
  resource: string;
  ip: string;
  barangay: string;
  status: AuditStatus;
  details: string;
}

const AUDIT_STORAGE_KEY = 'bhsms_security_audit_logs_v1';

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '2026-10-17 14:02:15',
    actor: 'LGU System Administrator',
    role: 'admin',
    action: 'SUPABASE_CLOUD_SYNC',
    resource: 'bhsms-backups/snapshot_20261017.json',
    ip: '192.168.1.104',
    barangay: 'PALAQUIO',
    status: 'SUCCESS',
    details: 'Uploaded encrypted incremental disaster recovery backup. Cloud quota: 377.93 KB / 1.00 GB.',
  },
  {
    id: 'log-002',
    timestamp: '2026-10-17 13:45:30',
    actor: 'Dr. Arthur Alcantara, MHO',
    role: 'doctor',
    action: 'CLINICAL_CONSULTATION_SIGN',
    resource: 'RES-PAL-2026-0001 (Juan Dela Cruz)',
    ip: '192.168.1.108',
    barangay: 'BABANGCAG',
    status: 'SUCCESS',
    details: 'Diagnosed Essential Hypertension (Stage 2). Prescribed Amlodipine 5mg + Losartan 50mg.',
  },
  {
    id: 'log-003',
    timestamp: '2026-10-17 13:22:11',
    actor: 'Dr. Arthur Alcantara, MHO',
    role: 'doctor',
    action: 'HOSPITAL_REFERRAL_APPROVE',
    resource: 'BHSMS-RF1 / MAT-2026-0002',
    ip: '192.168.1.108',
    barangay: 'BABANGCAG',
    status: 'WARNING',
    details: 'Approved secondary hospital referral to Abra Provincial Hospital for severe preeclampsia management.',
  },
  {
    id: 'log-004',
    timestamp: '2026-10-17 12:58:04',
    actor: 'Corazon Valdez, RM (Midwife)',
    role: 'nurse',
    action: 'ANTENATAL_VISIT_RECORD',
    resource: 'MAT-2026-0002 (Maria Santos)',
    ip: '192.168.1.112',
    barangay: 'TABIOG',
    status: 'SUCCESS',
    details: 'Logged 3rd trimester antenatal visit #3. Fundic height: 31cm, FHT: 140 bpm, BP: 145/95 mmHg.',
  },
  {
    id: 'log-005',
    timestamp: '2026-10-17 12:35:48',
    actor: 'Corazon Valdez, RM (Midwife)',
    role: 'nurse',
    action: 'VACCINE_DOSE_ADMINISTERED',
    resource: 'EPI-PENT-003 (Mark Daniel Diaz)',
    ip: '192.168.1.112',
    barangay: 'TABIOG',
    status: 'SUCCESS',
    details: 'Administered Pentavalent-3 dose. Cold-chain storage temperature validated at 4.2°C.',
  },
  {
    id: 'log-006',
    timestamp: '2026-10-17 12:10:20',
    actor: 'Elena Bagani (BHW)',
    role: 'bhw',
    action: 'RESIDENT_PROFILE_CREATE',
    resource: 'BHS-PAL-2026-0008 (Baby Gabriel Balbin)',
    ip: '192.168.1.115',
    barangay: 'PALAQUIO',
    status: 'SUCCESS',
    details: 'Registered newborn infant in Purok 1. Initialized pediatric Expanded Program on Immunization card.',
  },
  {
    id: 'log-007',
    timestamp: '2026-10-17 11:42:19',
    actor: 'Elena Bagani (BHW)',
    role: 'bhw',
    action: 'VITALS_TRIAGE_SCREEN',
    resource: 'RES-PAL-2026-0003 (Esperanza Flores)',
    ip: '192.168.1.115',
    barangay: 'PALAQUIO',
    status: 'ALERT',
    details: 'Screened elderly female with BP 172/106 mmHg. Automated alert triggered for High Risk Triage.',
  },
  {
    id: 'log-008',
    timestamp: '2026-10-17 11:15:00',
    actor: 'Elena Bagani (BHW)',
    role: 'bhw',
    action: 'PEDIATRIC_OUTREACH_LOG',
    resource: 'EPI-DEF-004 (Chloe Balbin)',
    ip: '192.168.1.115',
    barangay: 'PALAQUIO',
    status: 'SUCCESS',
    details: 'Completed home visit in Purok 2. Mother counseled on overdue Pentavalent-2; scheduled Friday BHS visit.',
  },
  {
    id: 'log-009',
    timestamp: '2026-10-17 10:48:32',
    actor: 'Hon. Ramon Balbin (Brgy Captain)',
    role: 'lgu_viewer',
    action: 'SURVEILLANCE_DASHBOARD_ACCESS',
    resource: 'EPIDEMIOLOGY_AGGREGATE_VIEW',
    ip: '192.168.1.120',
    barangay: 'TABIOG',
    status: 'SUCCESS',
    details: 'Accessed aggregated disease surveillance indicators (Zero-PHI Mode enforced under RA 10173).',
  },
  {
    id: 'log-010',
    timestamp: '2026-10-17 10:20:15',
    actor: 'Hon. Ramon Balbin (Brgy Captain)',
    role: 'lgu_viewer',
    action: 'EXECUTIVE_BRIEF_EXPORT',
    resource: 'Bucay_Health_Status_Brief_2026.pdf',
    ip: '192.168.1.120',
    barangay: 'TABIOG',
    status: 'SUCCESS',
    details: 'Exported quarterly primary care utilization summary for Sangguniang Barangay legislative planning.',
  },
  {
    id: 'log-011',
    timestamp: '2026-10-17 09:30:00',
    actor: 'System Daemon',
    role: 'system',
    action: 'AUTOMATED_BACKUP_GENERATED',
    resource: 'SNAPSHOT_CLUSTER_ARCHIVE',
    ip: '127.0.0.1',
    barangay: 'MUNICIPAL',
    status: 'SUCCESS',
    details: 'Automated 12-hour offline snapshot archive created. SHA-256 integrity checksum validated.',
  },
  {
    id: 'log-012',
    timestamp: '2026-10-17 08:50:12',
    actor: 'LGU System Administrator',
    role: 'admin',
    action: 'RBAC_SECURITY_AUDIT',
    resource: 'MODULE_ENTITLEMENT_MATRIX',
    ip: '192.168.1.104',
    barangay: 'PALAQUIO',
    status: 'SUCCESS',
    details: 'Verified least-privilege partitioning for 5 active personnel accounts per RA 10173 standard.',
  },
];

export class AuditService {
  private static inMemoryLogs: AuditLogEntry[] | null = null;

  public static getLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') {
      if (this.inMemoryLogs) return this.inMemoryLogs;
      this.inMemoryLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
      return this.inMemoryLogs!;
    }

    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
        return INITIAL_AUDIT_LOGS;
      }
      return JSON.parse(raw) as AuditLogEntry[];
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  public static logAction(input: {
    actor: string;
    role: AuditRole;
    action: string;
    resource: string;
    ip?: string;
    barangay?: string;
    status?: AuditStatus;
    details?: string;
  }): AuditLogEntry {
    const logs = this.getLogs();
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(',', '');

    const newEntry: AuditLogEntry = {
      id: `log-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: formattedTimestamp,
      actor: input.actor,
      role: input.role,
      action: input.action.toUpperCase(),
      resource: input.resource,
      ip: input.ip || '192.168.1.' + Math.floor(100 + Math.random() * 50),
      barangay: input.barangay || 'PALAQUIO',
      status: input.status || 'SUCCESS',
      details: input.details || `Operation executed by ${input.actor} (${input.role.toUpperCase()})`,
    };

    const updated = [newEntry, ...logs];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated.slice(0, 150)));
      } catch {
        // quota exceeded fallback
      }
    }
    this.inMemoryLogs = updated;
    return newEntry;
  }

  public static resetToDefaults(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    this.inMemoryLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
  }
}
