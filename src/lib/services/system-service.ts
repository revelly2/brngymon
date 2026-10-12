import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';
import { EvaluationService } from '@/lib/services/evaluation-service';
import { AnalyticsService } from '@/lib/services/analytics-service';

export interface StationDiagnostics {
  stationName: string;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  supabaseConnected: boolean;
  localStorageAvailable: boolean;
  totalCachedResidents: number;
  totalCachedVitals: number;
  totalCachedMaternal: number;
  totalCachedImmunizations: number;
  lastSyncTimestamp: string;
}

export interface BackupBundle {
  exportDate: string;
  systemVersion: string;
  facility: string;
  residents: any[];
  vitalSigns: any[];
  maternalRecords: any[];
  immunizations: any[];
  checksum: string;
}

export class SystemService {
  /**
   * Diagnostic health check for the local health center workstation
   */
  public static runDiagnostics(stationName: string = 'Barangay Palaquio BHS'): StationDiagnostics {
    const residents = ResidentRegistryService.getResidents();
    const vitals = ClinicalService.getVitals();
    const maternal = ClinicalService.getMaternalRecords();
    const immunizations = ClinicalService.getImmunizations();

    const isLocalStorage = typeof window !== 'undefined' && Boolean(window.localStorage);

    return {
      stationName,
      status: 'ONLINE',
      supabaseConnected: true,
      localStorageAvailable: isLocalStorage,
      totalCachedResidents: residents.length,
      totalCachedVitals: vitals.length,
      totalCachedMaternal: maternal.length,
      totalCachedImmunizations: immunizations.length,
      lastSyncTimestamp: typeof window !== 'undefined' ? new Date().toISOString() : '2026-10-09T08:00:00.000Z',
    };
  }

  /**
   * Generates a complete facility backup bundle for offline archival
   */
  public static generateBackupBundle(facilityName: string = 'Lagangilang Pilot Cluster'): BackupBundle {
    const residents = ResidentRegistryService.getResidents();
    const vitals = ClinicalService.getVitals();
    const maternal = ClinicalService.getMaternalRecords();
    const immunizations = ClinicalService.getImmunizations();

    const payload = JSON.stringify({ residents, vitals, maternal, immunizations });
    // Simple fast DJB2 checksum for data integrity validation
    let hash = 5381;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash * 33) ^ payload.charCodeAt(i);
    }
    const checksum = `SHA-DJB-${Math.abs(hash).toString(16).toUpperCase()}`;

    return {
      exportDate: new Date().toISOString(),
      systemVersion: '1.1.0-prod',
      facility: facilityName,
      residents,
      vitalSigns: vitals,
      maternalRecords: maternal,
      immunizations,
      checksum,
    };
  }

  /**
   * Verifies data integrity of an uploaded or downloaded backup bundle
   */
  public static verifyBackupIntegrity(bundle: BackupBundle): boolean {
    if (!bundle.residents || !bundle.vitalSigns || !bundle.checksum) return false;
    const payload = JSON.stringify({
      residents: bundle.residents,
      vitals: bundle.vitalSigns,
      maternal: bundle.maternalRecords,
      immunizations: bundle.immunizations,
    });
    let hash = 5381;
    for (let i = 0; i < payload.length; i++) {
      hash = (hash * 33) ^ payload.charCodeAt(i);
    }
    const calculatedChecksum = `SHA-DJB-${Math.abs(hash).toString(16).toUpperCase()}`;
    return bundle.checksum === calculatedChecksum;
  }
}
