'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/context/auth-context';
import { SystemService, StationDiagnostics, BackupBundle } from '@/lib/services/system-service';
import { SupabaseSyncService, SupabaseStorageMetrics } from '@/lib/services/supabase-sync-service';
import {
  MonitorCheck,
  Download,
  BookOpen,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  FileCheck,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Database,
  Cloud,
  CloudUpload,
} from 'lucide-react';

export default function OperationsPage() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<StationDiagnostics | null>(null);
  const [backupDownloaded, setBackupDownloaded] = useState<boolean>(false);
  const [storageMetrics, setStorageMetrics] = useState<SupabaseStorageMetrics>(() => SupabaseSyncService.getDefaultMetrics());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [integrityStatus, setIntegrityStatus] = useState<string | null>(null);

  useEffect(() => {
    setDiagnostics(SystemService.runDiagnostics(`Barangay ${user.barangay} Health Station`));
    setStorageMetrics(SupabaseSyncService.getStorageMetrics());
  }, [user.barangay]);

  const handleDownloadBackup = () => {
    const bundle = SystemService.generateBackupBundle(`Bucay - Brgy ${user.barangay}`);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BHSMS_BACKUP_${user.barangay}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setBackupDownloaded(true);
    const valid = SystemService.verifyBackupIntegrity(bundle);
    setIntegrityStatus(valid ? `Integrity Verified: ${bundle.checksum}` : 'Checksum verification failure');
    setTimeout(() => setBackupDownloaded(false), 5000);
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await SupabaseSyncService.syncEverything(user);
      setStorageMetrics(SupabaseSyncService.getStorageMetrics());
      setSyncFeedback(res.message);
      setDiagnostics(SystemService.runDiagnostics(`Barangay ${user.barangay} Health Station`));
      setTimeout(() => setSyncFeedback(null), 8000);
    } catch {
      setSyncFeedback('Error during Supabase synchronization');
    } finally {
      setIsSyncing(false);
    }
  };

  const SOP_STEPS = [
    {
      step: '01',
      title: 'Morning Patient Intake & Soundex Lookup',
      desc: 'Verify if resident has an existing health record using Name or Soundex search. If new, enroll with DPA informed consent.',
    },
    {
      step: '02',
      title: 'Biometric Capture & Automated Triage',
      desc: 'Record BP, heart rate, temperature, height, and weight. System instantly flags hypertensive crisis or febrile states.',
    },
    {
      step: '03',
      title: 'Maternal Milestones & Antenatal Visits',
      desc: 'Log antenatal checkup details for active pregnant cohort. Distribute Iron + Folic Acid and verify Naegele projected EDD.',
    },
    {
      step: '04',
      title: 'Pediatric EPI Outreach Round Review',
      desc: 'Consult the automated Defaulter Line-List to identify infants overdue for vaccines. Schedule BHW Purok home visits.',
    },
    {
      step: '05',
      title: 'Daily Archive & Local Station Backup',
      desc: 'Export daily workstation backup bundle to encrypted USB stick for off-site disaster recovery compliance.',
    },
  ];

  const TRANSITION_WEEKS = [
    {
      week: 'Week 1',
      phase: 'Dual Entry (Paper Baseline)',
      desc: 'Health workers maintain standard paper logbooks while parallel encoding patient demographics into BHSMS.',
    },
    {
      week: 'Week 2',
      phase: 'Parallel Clinical Triage',
      desc: 'BHWs use the automated triage calculator; midwife cross-verifies hemodynamic flags against manual readings.',
    },
    {
      week: 'Week 3',
      phase: 'Digital-First Operations',
      desc: 'Workstations become primary point of entry. Paper ledger reduced to summary tally cross-check only.',
    },
    {
      week: 'Week 4',
      phase: 'Full Operational Hand-Off',
      desc: 'Transition complete. Monthly Barangay Health Profiles submitted to MHO directly via automated FHSIS exports.',
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <MonitorCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Facility Operations & Operationalization (Phase 6)</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Station readiness checklist, standard operating procedures, and 4-week paperless transition protocols for Abra pilot health stations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={handleSyncToSupabase}
              disabled={isSyncing}
              className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-xs disabled:opacity-50"
            >
              <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Everything to Supabase'}</span>
            </button>
            <button
              onClick={handleDownloadBackup}
              className="px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-2 border border-slate-300 dark:border-slate-700 shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Facility Backup</span>
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/80 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          </div>
        )}

        {backupDownloaded && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/80 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Facility backup successfully exported and saved to local station downloads.</span>
            </div>
            {integrityStatus && (
              <span className="font-mono text-[11px] bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                {integrityStatus}
              </span>
            )}
          </div>
        )}

        {/* Workstation Diagnostics Banner */}
        {diagnostics && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Workstation Station</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 block">{diagnostics.stationName}</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center space-x-1 mt-0.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Operating Normally</span>
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Database Connectivity</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 block">Supabase BaaS</span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">PostgreSQL 16 + RLS Active</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Offline Local Cache</span>
              <span className="text-base font-bold text-cyan-700 dark:text-cyan-400 mt-1 block">
                {diagnostics.totalCachedResidents} Residents Cached
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Local-First Storage Online</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs" suppressHydrationWarning>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Supabase Cloud Storage</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1 block">
                {SupabaseSyncService.formatBytes(storageMetrics.totalConsumedBytes)}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                {storageMetrics.percentageUsed.toFixed(3)}% of 1 GB Allocated
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Clinical Records Cached</span>
              <span className="text-base font-bold text-pink-600 dark:text-pink-400 mt-1 block">
                {diagnostics.totalCachedVitals + diagnostics.totalCachedMaternal + diagnostics.totalCachedImmunizations} Records
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Vitals, Maternal, &amp; EPI</span>
            </div>
          </div>
        )}

        {/* 4-Week Parallel Transition Protocol */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>4-Week Paper Logbook to Digital Transition Protocol</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pilot Health Center Implementation Guideline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRANSITION_WEEKS.map((tw, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2 relative shadow-2xs">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
                  {tw.week}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 pt-1">{tw.phase}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{tw.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Standard Operating Procedures (SOP) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Health Center Daily Standard Operating Procedures (SOP)</span>
          </h2>

          <div className="space-y-3">
            {SOP_STEPS.map((sop) => (
              <div key={sop.step} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start space-x-4 shadow-2xs">
                <span className="font-mono text-base font-black text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  {sop.step}
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">{sop.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{sop.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Governance & Legal Compliance */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-6 flex items-start space-x-4 text-xs text-slate-700 dark:text-slate-300 shadow-xs">
          <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1" />
          <div className="space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">
              Data Privacy Act of 2012 (Republic Act No. 10173) Compliance Notice
            </span>
            <p className="leading-relaxed text-slate-600 dark:text-slate-400">
              This workstation operates under the health data governance mandate of the Municipal Health Office of Bucay, Abra. All electronic health records, Protected Health Information (PHI), and biometric encounters are strictly confidential and protected by Row-Level Security. Unauthorized disclosure or export of patient-identifiable data is prohibited.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
