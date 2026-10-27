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

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

export class AuditService {
  private static inMemoryLogs: AuditLogEntry[] | null = null;

  public static getLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') {
      if (this.inMemoryLogs) return this.inMemoryLogs;
      this.inMemoryLogs = [];
      return this.inMemoryLogs;
    }

    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      const parsed: AuditLogEntry[] = JSON.parse(raw);
      // Clean out legacy mock entries
      const cleaned = parsed.filter(
        (log) =>
          !log.id.startsWith('log-0') &&
          !log.actor.includes('Elena Bagani') &&
          !log.actor.includes('Corazon Valdez') &&
          !log.actor.includes('Dr. Arthur') &&
          !log.details?.includes('Maria Santos') &&
          !log.details?.includes('Juan Dela Cruz')
      );
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(cleaned));
      }
      return cleaned;
    } catch {
      return [];
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
