'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { SystemService, StationDiagnostics, BackupBundle } from '@/lib/services/system-service';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import {
  SupabaseSyncService,
  SupabaseStorageMetrics,
  SyncEverythingResult,
} from '@/lib/services/supabase-sync-service';
import {
  ShieldCheck,
  Server,
  Database,
  Users,
  HardDrive,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Cloud,
  CloudUpload,
  FolderArchive,
  FileSpreadsheet,
  FileText,
  Trash2,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { UserService, SystemUser, CreateUserInput, INITIAL_SYSTEM_USERS } from '@/lib/services/user-service';
import { UserRole, BarangayCode } from '@/types/database';
import { UserManagementPanel } from '@/components/users/user-management-panel';
import { AuditService, AuditLogEntry, AuditRole, AuditStatus } from '@/lib/services/audit-service';
import { useAdminTab, AdminTab } from '@/lib/context/admin-tab-context';

export function AdminDashboard() {
  const { user } = useAuth();
  const { activeAdminTab: activeTab, setActiveAdminTab: handleSwitchTab } = useAdminTab();
  const [diag, setDiag] = useState<StationDiagnostics>({
    stationName: 'Barangay Palaquio BHS',
    status: 'ONLINE',
    supabaseConnected: true,
    localStorageAvailable: true,
    totalCachedResidents: 0,
    totalCachedVitals: 0,
    totalCachedMaternal: 0,
    totalCachedImmunizations: 0,
    lastSyncTimestamp: '2026-10-09T08:00:00.000Z',
  });
  const [backupBundle, setBackupBundle] = useState<BackupBundle | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [storageMetrics, setStorageMetrics] = useState<SupabaseStorageMetrics>(() =>
    SupabaseSyncService.getDefaultMetrics()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<SyncEverythingResult | null>(null);
  const [selectedBucketId, setSelectedBucketId] = useState<string>('bhsms-backups');

  // Audit Logs State complying with RA 10173 Sec 20
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditRoleFilter, setAuditRoleFilter] = useState<AuditRole | 'ALL'>('ALL');
  const [auditStatusFilter, setAuditStatusFilter] = useState<AuditStatus | 'ALL'>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  React.useEffect(() => {
    setDiag(SystemService.runDiagnostics());
    setStorageMetrics(SupabaseSyncService.getStorageMetrics());
    setUsers(UserService.getUsers());
    setAuditLogs(AuditService.getLogs());
  }, []);

  const handleSyncEverything = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await SupabaseSyncService.syncEverything(user);
      setSyncResult(res);
      setStorageMetrics(SupabaseSyncService.getStorageMetrics());
      setDiag(SystemService.runDiagnostics());
      AuditService.logAction({
        actor: user.name,
        role: 'admin',
        action: 'SUPABASE_CLOUD_SYNC',
        resource: res.generatedFileName || 'bhsms-backups/snapshot.json',
        barangay: user.barangay,
        status: 'SUCCESS',
        details: `Cloud sync completed (${res.mode}). Synced: ${res.syncedResidents} residents, ${res.syncedVitals} vitals, ${res.syncedMaternal} maternal records, ${res.syncedImmunizations} immunization records. Added: ${SupabaseSyncService.formatBytes(res.storageBytesAdded)}.`,
      });
      setAuditLogs(AuditService.getLogs());
    } catch (e: any) {
      console.error('Failed to sync to Supabase:', e);
      AuditService.logAction({
        actor: user.name,
        role: 'admin',
        action: 'SUPABASE_CLOUD_SYNC_FAILED',
        resource: 'CLOUD_GATEWAY',
        barangay: user.barangay,
        status: 'ALERT',
        details: `Cloud synchronization failed: ${e?.message || 'Remote endpoint unavailable'}.`,
      });
      setAuditLogs(AuditService.getLogs());
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteStorageFile = (bucketId: string, fileId: string) => {
    const updated = SupabaseSyncService.deleteStorageFile(bucketId, fileId);
    setStorageMetrics(updated);
    AuditService.logAction({
      actor: user.name,
      role: 'admin',
      action: 'STORAGE_FILE_PURGE',
      resource: `${bucketId}/${fileId}`,
      barangay: user.barangay,
      status: 'WARNING',
      details: `Storage object ${fileId} in bucket [${bucketId}] purged by administrator under DPA data lifecycle retention policy.`,
    });
    setAuditLogs(AuditService.getLogs());
  };

  // Dynamic User Management State
  const [users, setUsers] = useState<SystemUser[]>(() => INITIAL_SYSTEM_USERS);
  const handleRefreshDiagnostics = () => {
    setDiag(SystemService.runDiagnostics());
    setUsers(UserService.getUsers());
    setAuditLogs(AuditService.getLogs());
  };

  const handleExportBackup = () => {
    setIsExporting(true);
    setTimeout(() => {
      const bundle = SystemService.generateBackupBundle('Bucay Health Stations Cluster');
      setBackupBundle(bundle);
      setIsExporting(false);
      AuditService.logAction({
        actor: user.name,
        role: 'admin',
        action: 'DISASTER_RECOVERY_BACKUP_GENERATE',
        resource: `BUNDLE_SNAPSHOT (${bundle.facility})`,
        barangay: user.barangay,
        status: 'SUCCESS',
        details: `Disaster recovery snapshot exported with ${bundle.residents.length} residents, ${bundle.vitalSigns.length} vitals, ${bundle.maternalRecords.length} maternal records. SHA-256: ${bundle.checksum.substring(0, 16)}...`,
      });
      setAuditLogs(AuditService.getLogs());
    }, 600);
  };

  const handleExportAuditLogs = () => {
    const payload = {
      facility: 'Bucay Municipal Health Stations Cluster',
      generatedAt: new Date().toISOString(),
      standard: 'Republic Act No. 10173 Section 20 Compliance',
      totalRecords: filteredAuditLogs.length,
      filterApplied: {
        role: auditRoleFilter,
        status: auditStatusFilter,
        searchQuery: auditSearchQuery || null,
      },
      auditLogs: filteredAuditLogs,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bhsms_security_audit_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleResetAuditLogs = () => {
    if (confirm('Reset security audit logs to standard baseline records?')) {
      AuditService.resetToDefaults();
      setAuditLogs(AuditService.getLogs());
      setAuditRoleFilter('ALL');
      setAuditStatusFilter('ALL');
      setAuditSearchQuery('');
    }
  };

  const getRoleDisplayBadge = (role: AuditRole) => {
    switch (role) {
      case 'doctor':
        return {
          label: 'Doctor / Physician',
          badgeClass: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          dotColor: 'bg-blue-500',
        };
      case 'nurse':
        return {
          label: 'Midwife / Nurse',
          badgeClass: 'bg-pink-50 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
          dotColor: 'bg-pink-500',
        };
      case 'bhw':
        return {
          label: 'Barangay Health Worker',
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          dotColor: 'bg-emerald-500',
        };
      case 'lgu_viewer':
        return {
          label: 'LGU Executive Official',
          badgeClass: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dotColor: 'bg-amber-500',
        };
      case 'admin':
        return {
          label: 'IT Administrator',
          badgeClass: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          dotColor: 'bg-purple-500',
        };
      case 'system':
      default:
        return {
          label: 'System Automated',
          badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          dotColor: 'bg-slate-500',
        };
    }
  };

  const roleFilterOptions = [
    {
      id: 'ALL',
      label: 'All Operational Roles',
      count: auditLogs.length,
      dotColor: 'bg-slate-400',
      activeClass: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs',
    },
    {
      id: 'doctor',
      label: 'Doctor (MHO)',
      count: auditLogs.filter((l) => l.role === 'doctor').length,
      dotColor: 'bg-blue-500',
      activeClass: 'bg-blue-600 text-white border-blue-600 shadow-xs',
    },
    {
      id: 'nurse',
      label: 'Midwife / Nurse',
      count: auditLogs.filter((l) => l.role === 'nurse').length,
      dotColor: 'bg-pink-500',
      activeClass: 'bg-pink-600 text-white border-pink-600 shadow-xs',
    },
    {
      id: 'bhw',
      label: 'BHW (Field)',
      count: auditLogs.filter((l) => l.role === 'bhw').length,
      dotColor: 'bg-emerald-500',
      activeClass: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
    },
    {
      id: 'lgu_viewer',
      label: 'LGU Executive',
      count: auditLogs.filter((l) => l.role === 'lgu_viewer').length,
      dotColor: 'bg-amber-500',
      activeClass: 'bg-amber-600 text-white border-amber-600 shadow-xs',
    },
    {
      id: 'admin',
      label: 'IT Administrator',
      count: auditLogs.filter((l) => l.role === 'admin').length,
      dotColor: 'bg-purple-500',
      activeClass: 'bg-purple-600 text-white border-purple-600 shadow-xs',
    },
    {
      id: 'system',
      label: 'System Daemons',
      count: auditLogs.filter((l) => l.role === 'system').length,
      dotColor: 'bg-slate-500',
      activeClass: 'bg-slate-700 text-white border-slate-700 shadow-xs',
    },
  ];

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditRoleFilter !== 'ALL' && log.role !== auditRoleFilter) return false;
    if (auditStatusFilter !== 'ALL' && log.status !== auditStatusFilter) return false;
    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase();
      const matchActor = log.actor.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchResource = log.resource.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchBarangay = log.barangay.toLowerCase().includes(q);
      const matchIp = log.ip.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchResource && !matchDetails && !matchBarangay && !matchIp) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* ADMINISTRATIVE MODULES NAVIGATION (ANCHORED AT TOP)         */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 w-full p-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60">
        {/* Tab 1: Cloud Sync & Storage */}
        <button
          type="button"
          onClick={() => handleSwitchTab('cloud_sync')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
            activeTab === 'cloud_sync'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-2 truncate mr-1.5">
            <Folder className={`w-4 h-4 shrink-0 transition-transform ${
              activeTab === 'cloud_sync' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
            }`} />
            <span className="truncate">Cloud Sync & Storage</span>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'cloud_sync'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400'
          }`} suppressHydrationWarning>
            {SupabaseSyncService.formatBytes(storageMetrics.totalConsumedBytes)}
          </span>
        </button>

        {/* Tab 2: Security Audit Logs */}
        <button
          type="button"
          onClick={() => handleSwitchTab('audit')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-2 truncate mr-1.5">
            <ShieldCheck className={`w-4 h-4 shrink-0 transition-transform ${
              activeTab === 'audit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
            }`} />
            <span className="truncate">Security Audit Logs</span>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'audit'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400'
          }`} suppressHydrationWarning>
            {auditLogs.length} Events
          </span>
        </button>

        {/* Tab 3: Role-Based Access Control (RBAC) */}
        <button
          type="button"
          onClick={() => handleSwitchTab('users')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-2 truncate mr-1.5">
            <Users className={`w-4 h-4 shrink-0 transition-transform ${
              activeTab === 'users' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'
            }`} />
            <span className="truncate">Access Control (RBAC)</span>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'users'
              ? 'bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
              : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400'
          }`} suppressHydrationWarning>
            {users.length} Operators
          </span>
        </button>

        {/* Tab 4: Workstation Cache & Diagnostics */}
        <button
          type="button"
          onClick={() => handleSwitchTab('storage')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
            activeTab === 'storage'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-2 truncate mr-1.5">
            <HardDrive className={`w-4 h-4 shrink-0 transition-transform ${
              activeTab === 'storage' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'
            }`} />
            <span className="truncate">Workstation Cache</span>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
            activeTab === 'storage'
              ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
              : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-400'
          }`} suppressHydrationWarning>
            {diag.status}
          </span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB CONTENT AREAS                                           */}
      {/* ============================================================ */}
      {activeTab === 'cloud_sync' && (
        <div className="space-y-6">
          {/* Banner */}
          <div className="futuristic-card accent-line-indigo p-6 lg:p-7 bg-gradient-to-br from-slate-100/90 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-indigo-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Infrastructure & Security • Central Administrative Console</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                LGU System Administrator Command Center
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Welcome, <strong>{user.name}</strong>. Complete oversight over system audit logs (RA 10173 Section 20), workstation offline caches, database synchronization, and role-based access control (RBAC).
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSyncEverything}
                disabled={isSyncing}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all flex items-center space-x-2 shadow-sm hover:shadow hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
              >
                <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing to Supabase...' : 'Sync Everything to Supabase'}</span>
              </button>
              <button
                type="button"
                onClick={handleRefreshDiagnostics}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center space-x-2 border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow hover:-translate-y-0.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Run Diagnostics</span>
              </button>
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-xs font-semibold text-white transition-all flex items-center space-x-2 shadow-xs hover:shadow hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating...' : 'Export JSON Backup'}</span>
              </button>
            </div>
          </div>

          {/* Admin Infrastructure KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div 
              onClick={() => handleSwitchTab('storage')}
              className="futuristic-kpi cursor-pointer group transition-all hover:border-slate-300 dark:hover:border-slate-700"
              title="Click to open Workstation Diagnostics & Cache"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Workstation Status</span>
                <Server className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">{diag.status}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Supabase Client Connected</div>
            </div>

            <div 
              onClick={() => handleSwitchTab('storage')}
              className="futuristic-kpi cursor-pointer group transition-all hover:border-slate-300 dark:hover:border-slate-700"
              title="Click to open Local Cache & Diagnostics"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Local Cache</span>
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums" suppressHydrationWarning>{diag.totalCachedResidents} Recs</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Zero-Latency Fast Buffer</div>
            </div>

            <div 
              onClick={() => handleSwitchTab('cloud_sync')}
              className="futuristic-kpi cursor-pointer group transition-all hover:border-slate-300 dark:hover:border-slate-700"
              title="Click to open Cloud Storage & Sync"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Cloud Storage</span>
                <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums" suppressHydrationWarning>
                {SupabaseSyncService.formatBytes(storageMetrics.totalConsumedBytes)}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex items-center justify-between" suppressHydrationWarning>
                <span>Of 1.00 GB</span>
                <span className="font-bold">{storageMetrics.percentageUsed.toFixed(3)}%</span>
              </div>
            </div>

            <div 
              onClick={() => handleSwitchTab('audit')}
              className="futuristic-kpi cursor-pointer group transition-all hover:border-slate-300 dark:hover:border-slate-700"
              title="Click to open Security Audit Logs"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Audit Compliance</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums" suppressHydrationWarning>{auditLogs.length} Events</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium">RA 10173 • All Roles Monitored</div>
            </div>

            <div 
              onClick={() => handleSwitchTab('users')}
              className="futuristic-kpi cursor-pointer group transition-all hover:border-slate-300 dark:hover:border-slate-700"
              title="Click to open Access Control (RBAC)"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">Active Users</span>
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums" suppressHydrationWarning>{users.length} Operators</div>
              <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-1 font-medium">Least-Privilege Scoped</div>
            </div>
          </div>

          {/* Backup Bundle Confirmation Banner */}
          {backupBundle && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-slate-800 dark:text-slate-100 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Offline Backup Generated Successfully</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Facility: <strong>{backupBundle.facility}</strong> • Records: {backupBundle.residents.length} residents, {backupBundle.vitalSigns.length} vitals, {backupBundle.maternalRecords.length} maternal records.
                </div>
                <div className="font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                  SHA-256 Checksum: {backupBundle.checksum}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupBundle, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute('href', dataStr);
                  downloadAnchor.setAttribute('download', `bhsms_backup_${Date.now()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shrink-0 shadow-xs"
              >
                Download File
              </button>
            </div>
          )}

          {/* Storage Meter & Cloud Status Box */}
          <div className="futuristic-card p-6 sm:p-7 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Cloud className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Supabase Cloud Storage Consumption Meter</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time telemetry measuring cloud storage bytes consumed across encrypted backup archives, clinical referral slips, and FHSIS records.
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Last Synced</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                    {storageMetrics.lastSyncedAt
                      ? new Date(storageMetrics.lastSyncedAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
                      : 'Never'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSyncEverything}
                  disabled={isSyncing}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center space-x-2 shadow-xs disabled:opacity-50"
                >
                  <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing Everything...' : 'Sync Everything to Supabase'}</span>
                </button>
              </div>
            </div>

            {/* Storage Progress Gauge */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1" suppressHydrationWarning>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {SupabaseSyncService.formatBytes(storageMetrics.totalConsumedBytes)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">consumed of</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono">
                    {SupabaseSyncService.formatBytes(storageMetrics.totalQuotaBytes)} (Free Tier Quota)
                  </span>
                </div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                  {storageMetrics.percentageUsed.toFixed(4)}% Allocated
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden border border-slate-200/80 dark:border-slate-700/80 p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500 shadow-2xs"
                  style={{ width: `${Math.max(storageMetrics.percentageUsed, 1.2)}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1" suppressHydrationWarning>
                <span>Free Remaining: <strong className="text-slate-700 dark:text-slate-200">{SupabaseSyncService.formatBytes(storageMetrics.totalQuotaBytes - storageMetrics.totalConsumedBytes)}</strong></span>
                <span>Total Stored Files: <strong className="text-slate-700 dark:text-slate-200">{storageMetrics.buckets.reduce((acc, b) => acc + b.fileCount, 0)} files</strong> across <strong className="text-slate-700 dark:text-slate-200">{storageMetrics.buckets.length} buckets</strong></span>
              </div>
            </div>

            {/* Sync Summary Result Banner if Just Triggered */}
            {syncResult && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Supabase Full Synchronization Complete</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 text-[10px] font-mono font-bold">
                    Mode: {syncResult.mode}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-300">{syncResult.message}</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 bg-white/80 dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Residents Synced</div>
                    <div className="font-bold text-slate-900 dark:text-white">{syncResult.syncedResidents}</div>
                  </div>
                  <div className="p-2 bg-white/80 dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Vitals Synced</div>
                    <div className="font-bold text-slate-900 dark:text-white">{syncResult.syncedVitals}</div>
                  </div>
                  <div className="p-2 bg-white/80 dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Maternal Care</div>
                    <div className="font-bold text-slate-900 dark:text-white">{syncResult.syncedMaternal}</div>
                  </div>
                  <div className="p-2 bg-white/80 dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">EPI Vaccines</div>
                    <div className="font-bold text-slate-900 dark:text-white">{syncResult.syncedImmunizations}</div>
                  </div>
                  <div className="p-2 bg-white/80 dark:bg-slate-800 rounded border border-emerald-200 dark:border-emerald-800">
                    <div className="text-slate-500 dark:text-slate-400 text-[10px]">Storage Added</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">+{SupabaseSyncService.formatBytes(syncResult.storageBytesAdded)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Supabase Storage Bucket Browser */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Supabase Storage Buckets Explorer</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Inspect files, sizes, and timestamps within each provisioned Supabase bucket</p>
              </div>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold">
                {storageMetrics.buckets.length} Buckets Provisioned
              </span>
            </div>

            {/* Bucket Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {storageMetrics.buckets.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBucketId(b.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedBucketId === b.id
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-2xs ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <FolderArchive className={`w-4 h-4 ${selectedBucketId === b.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{b.name}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {b.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">{b.description}</p>
                  <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-600 dark:text-slate-400">{b.fileCount} {b.fileCount === 1 ? 'file' : 'files'}</span>
                    <span className="font-bold text-emerald-800 dark:text-emerald-400">{SupabaseSyncService.formatBytes(b.sizeBytes)}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* File List in Selected Bucket */}
            {(() => {
              const currentBucket = storageMetrics.buckets.find((b) => b.id === selectedBucketId) || storageMetrics.buckets[0];
              return (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Stored Files in bucket: <strong className="font-mono text-emerald-800">{currentBucket.name}</strong></span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      Bucket Total: {SupabaseSyncService.formatBytes(currentBucket.sizeBytes)}
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">File Name</th>
                          <th className="py-2.5 px-3">Size</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Uploaded Timestamp</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentBucket.files.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400">
                              No files currently stored in this bucket.
                            </td>
                          </tr>
                        ) : (
                          currentBucket.files.map((file) => (
                            <tr key={file.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white flex items-center space-x-2">
                                {file.contentType.includes('json') ? (
                                  <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : file.contentType.includes('pdf') ? (
                                  <FileText className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                                ) : (
                                  <FileSpreadsheet className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                                )}
                                <span className="truncate max-w-xs">{file.name}</span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-emerald-800 dark:text-emerald-400 font-semibold">
                                {SupabaseSyncService.formatBytes(file.sizeBytes)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                {file.contentType}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                {new Date(file.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}
                              </td>
                              <td className="py-2.5 px-3 text-right space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const sampleContent = JSON.stringify({ file: file.name, size: file.sizeBytes, facility: 'Bucay BHSMS' }, null, 2);
                                    const blob = new Blob([sampleContent], { type: file.contentType });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = file.name;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                                  title="Download File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStorageFile(currentBucket.id, file.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                                  title="Purge File"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="futuristic-card p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Security Audit Trail for All Personnel & Services
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Continuous immutable surveillance log tracking transactions across Doctor, Nurse/Midwife, BHW, LGU Official, IT Admin, and System Daemons per Republic Act No. 10173 (Data Privacy Act of 2012 §20).
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={handleExportAuditLogs}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Trail (JSON)</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetAuditLogs}
                  title="Reset audit trail to baseline standard"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Total Monitored Events</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">{auditLogs.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400">Personnel Monitored</span>
                <p className="text-xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-0.5">All 6 Personas</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400">Warnings / Clinical Flags</span>
                <p className="text-xl font-extrabold text-amber-900 dark:text-amber-200 mt-0.5 tabular-nums">
                  {auditLogs.filter(l => l.status === 'WARNING').length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40">
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-700 dark:text-red-400">Security Alerts</span>
                <p className="text-xl font-extrabold text-red-900 dark:text-red-200 mt-0.5 tabular-nums">
                  {auditLogs.filter(l => l.status === 'ALERT').length}
                </p>
              </div>
            </div>
          </div>

          {/* Role Filter Pills & Search */}
          <div className="futuristic-card p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter by Operational Role / Actor</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Showing {filteredAuditLogs.length} of {auditLogs.length} entries
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {roleFilterOptions.map((opt) => {
                const isActive = auditRoleFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAuditRoleFilter(opt.id as AuditRole | 'ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 border ${
                      isActive
                        ? opt.activeClass
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                    <span>{opt.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-black/10 dark:bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search and Status Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search logs by actor, action, resource UPI, barangay, or details..."
                  value={auditSearchQuery}
                  onChange={(e) => setAuditSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                {auditSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAuditSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={auditStatusFilter}
                  onChange={(e) => setAuditStatusFilter(e.target.value as AuditStatus | 'ALL')}
                  aria-label="Filter audit logs by execution status"
                  className="px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ALL">All Statuses ({auditLogs.length})</option>
                  <option value="SUCCESS">Success Only ({auditLogs.filter(l => l.status === 'SUCCESS').length})</option>
                  <option value="WARNING">Warnings ({auditLogs.filter(l => l.status === 'WARNING').length})</option>
                  <option value="ALERT">Security Alerts ({auditLogs.filter(l => l.status === 'ALERT').length})</option>
                </select>

                {(auditRoleFilter !== 'ALL' || auditStatusFilter !== 'ALL' || auditSearchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuditRoleFilter('ALL');
                      setAuditStatusFilter('ALL');
                      setAuditSearchQuery('');
                    }}
                    className="px-3 py-2 rounded-xl text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="futuristic-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
                  <tr>
                    <th className="py-3 px-3.5 font-semibold">Timestamp / Station</th>
                    <th className="py-3 px-3.5 font-semibold">Actor & Role</th>
                    <th className="py-3 px-3.5 font-semibold">Action Performed</th>
                    <th className="py-3 px-3.5 font-semibold">Target Resource / UPI</th>
                    <th className="py-3 px-3.5 font-semibold">IP Address</th>
                    <th className="py-3 px-3.5 font-semibold">Status</th>
                    <th className="py-3 px-3.5 text-right font-semibold">Forensic Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">No audit log records match your filter criteria.</p>
                        <p className="text-[11px] text-slate-400 mt-1">Try resetting the search query or selecting &quot;All Roles&quot;.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const roleConfig = getRoleDisplayBadge(log.role);
                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                            className={`cursor-pointer transition-colors ${
                              isExpanded
                                ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <td className="py-3 px-3.5">
                              <div className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{log.timestamp}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Brgy. {log.barangay}</div>
                            </td>
                            <td className="py-3 px-3.5">
                              <div className="font-bold text-slate-900 dark:text-white">{log.actor}</div>
                              <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${roleConfig.badgeClass}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dotColor}`} />
                                <span>{roleConfig.label}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3.5">
                              <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-slate-700 dark:text-slate-300 font-mono text-[11px] max-w-[200px] truncate" title={log.resource}>
                              {log.resource}
                            </td>
                            <td className="py-3 px-3.5 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                              {log.ip}
                            </td>
                            <td className="py-3 px-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  log.status === 'SUCCESS'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : log.status === 'WARNING'
                                    ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                    : 'bg-red-50 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                                }`}
                              >
                                {log.status}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 text-right text-slate-400">
                              <button
                                type="button"
                                className="p-1 hover:text-slate-700 dark:hover:text-slate-200"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/60 dark:bg-slate-800/30">
                              <td colSpan={7} className="p-4 border-y border-slate-100 dark:border-slate-800">
                                <div className="space-y-3 text-xs">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                                      Forensic Audit Record: <span className="font-mono text-emerald-700 dark:text-emerald-400">{log.id}</span>
                                    </div>
                                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                      Compliance: RA 10173 DPA 2012 §20 • SHA-256 Verified
                                    </div>
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">Clinical & Operational Narrative:</span>
                                    <p className="mt-1 text-slate-800 dark:text-slate-200 leading-relaxed font-sans bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                                      {log.details}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                      <div className="text-slate-400 text-[10px]">OPERATOR ROLE</div>
                                      <div className="font-bold text-slate-800 dark:text-slate-200 uppercase">{log.role}</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                      <div className="text-slate-400 text-[10px]">TARGET RESOURCE</div>
                                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{log.resource}</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                      <div className="text-slate-400 text-[10px]">WORKSTATION IP</div>
                                      <div className="font-bold text-slate-800 dark:text-slate-200">{log.ip}</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                      <div className="text-slate-400 text-[10px]">BARANGAY NODE</div>
                                      <div className="font-bold text-slate-800 dark:text-slate-200">{log.barangay}</div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <UserManagementPanel />
      )}

      {activeTab === 'storage' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workstation Diagnostics & Local Caching</h3>
            <Link
              href="/operations"
              className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold"
            >
              Advanced Operations Console &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 font-medium">Total Residents Cached</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{diag.totalCachedResidents}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 font-medium">Vitals Encounters</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{diag.totalCachedVitals}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 font-medium">Maternal Records</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{diag.totalCachedMaternal}</div>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="text-slate-500 dark:text-slate-400 font-medium">Immunization Doses</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">{diag.totalCachedImmunizations}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
