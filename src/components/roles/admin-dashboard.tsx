'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { SystemService, StationDiagnostics, BackupBundle } from '@/lib/services/system-service';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Database,
  Users,
  HardDrive,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  MonitorCheck,
  Lock,
  FileCode,
} from 'lucide-react';

export function AdminDashboard() {
  const { user } = useAuth();
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
  const [activeTab, setActiveTab] = useState<'audit' | 'users' | 'storage'>('audit');

  React.useEffect(() => {
    setDiag(SystemService.runDiagnostics());
  }, []);

  // Simulated Audit Logs complying with RA 10173 Sec 20
  const [auditLogs] = useState([
    {
      id: 'log-001',
      timestamp: '2026-10-09 08:20:14',
      actor: 'Admin User',
      action: 'WORKSTATION_DIAGNOSTIC_RUN',
      resource: 'SYSTEM_HEALTH',
      status: 'SUCCESS',
      ip: '192.168.1.104',
    },
    {
      id: 'log-002',
      timestamp: '2026-10-09 08:14:02',
      actor: 'Dr. Evelyn Santos',
      action: 'CLINICAL_CONSULTATION_SIGN',
      resource: 'BHS-PAL-2026-0001',
      status: 'SUCCESS',
      ip: '192.168.1.108',
    },
    {
      id: 'log-003',
      timestamp: '2026-10-09 08:02:45',
      actor: 'Maria Santos, RM',
      action: 'ANTENATAL_VISIT_CREATE',
      resource: 'MAT-2026-0002',
      status: 'SUCCESS',
      ip: '192.168.1.112',
    },
    {
      id: 'log-004',
      timestamp: '2026-10-09 07:55:10',
      actor: 'Juanita Dela Cruz, BHW',
      action: 'RESIDENT_PROFILE_CREATE',
      resource: 'BHS-PAL-2026-0004',
      status: 'SUCCESS',
      ip: '192.168.1.115',
    },
    {
      id: 'log-005',
      timestamp: '2026-10-09 07:40:00',
      actor: 'System Daemon',
      action: 'AUTOMATED_BACKUP_GENERATED',
      resource: 'SNAPSHOT_ARCHIVE',
      status: 'SUCCESS',
      ip: '127.0.0.1',
    },
  ]);

  // System Users List
  const systemUsers = [
    { name: 'System Administrator', email: 'admin@bhsms.lagangilang.gov.ph', role: 'admin', barangay: 'PALAQUIO', status: 'Active' },
    { name: 'Dr. Evelyn Santos, MD', email: 'mho@lagangilang.gov.ph', role: 'doctor', barangay: 'RHU Main', status: 'Active' },
    { name: 'Maria Santos, RM', email: 'midwife.palaquio@lagangilang.gov.ph', role: 'nurse', barangay: 'PALAQUIO', status: 'Active' },
    { name: 'Juanita Dela Cruz', email: 'bhw.palaquio@lagangilang.gov.ph', role: 'bhw', barangay: 'PALAQUIO', status: 'Active' },
    { name: 'Hon. Mayor / ABC President', email: 'lgu.exec@lagangilang.gov.ph', role: 'lgu_viewer', barangay: 'Municipal Wide', status: 'Active' },
  ];

  const handleRefreshDiagnostics = () => {
    setDiag(SystemService.runDiagnostics());
  };

  const handleExportBackup = () => {
    setIsExporting(true);
    setTimeout(() => {
      const bundle = SystemService.generateBackupBundle('Lagangilang Health Stations Cluster');
      setBackupBundle(bundle);
      setIsExporting(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-100 via-white to-emerald-50/70 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Infrastructure & Security • Central Administrative Console</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">LGU System Administrator Command Center</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Welcome, <strong>{user.name}</strong>. Complete oversight over system audit logs (RA 10173 Section 20), workstation offline caches, database synchronization, and role-based access control (RBAC).
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefreshDiagnostics}
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-2 border border-slate-300 shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Run Diagnostics</span>
          </button>
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isExporting}
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating...' : 'Export JSON Backup'}</span>
          </button>
        </div>
      </div>

      {/* Admin Infrastructure KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Workstation Status</span>
            <Server className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{diag.status}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Supabase Client Connected</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Local Storage Cache</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{diag.totalCachedResidents} Recs</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Zero-Latency Fast Buffer</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Audit Compliance</span>
            <Lock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">RA 10173</div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">Immutable Trail Active</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active RBAC Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{systemUsers.length} Roles</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Least-Privilege Scoped</div>
        </div>
      </div>

      {/* Backup Bundle Confirmation Banner */}
      {backupBundle && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
              <span>Offline Backup Generated Successfully</span>
            </div>
            <div className="text-slate-600">
              Facility: <strong>{backupBundle.facility}</strong> • Records: {backupBundle.residents.length} residents, {backupBundle.vitalSigns.length} vitals, {backupBundle.maternalRecords.length} maternal records.
            </div>
            <div className="font-mono text-[11px] text-emerald-800">
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

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-xs font-bold transition-colors ${
            activeTab === 'audit'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Security Audit Logs (RA 10173)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-xs font-bold transition-colors ${
            activeTab === 'users'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Role-Based Access Control (RBAC)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('storage')}
          className={`pb-3 text-xs font-bold transition-colors ${
            activeTab === 'storage'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Workstation Cache & Diagnostics
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Immutable Security Audit Logs</h3>
            <span className="text-[11px] text-slate-500 font-mono">DPA 2012 Sec. 20</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-700 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Actor / User</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                  <th className="py-2.5 px-3 font-semibold">Target Resource</th>
                  <th className="py-2.5 px-3 font-semibold">IP Address</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-500">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{log.actor}</td>
                    <td className="py-2.5 px-3 font-mono text-emerald-700">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono">{log.resource}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{log.ip}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">System Authorized Operators & Access Scopes</h3>
            <span className="text-[11px] text-slate-500 font-mono">5 Authorized Users</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemUsers.map((u) => (
              <div key={u.email} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
                <div>
                  <div className="text-xs font-bold text-slate-900">{u.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                  <div className="text-[10px] text-emerald-700 font-mono mt-1 font-medium">
                    Station: {u.barangay}
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-700 uppercase font-semibold">
                    {u.role}
                  </span>
                  <div className="text-[10px] text-emerald-700 mt-1 font-semibold">{u.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Workstation Diagnostics & Local Caching</h3>
            <Link
              href="/operations"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
            >
              Advanced Operations Console &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 font-medium">Total Residents Cached</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{diag.totalCachedResidents}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 font-medium">Vitals Encounters</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{diag.totalCachedVitals}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 font-medium">Maternal Records</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{diag.totalCachedMaternal}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="text-slate-500 font-medium">Immunization Doses</div>
              <div className="text-lg font-bold text-slate-900 mt-1">{diag.totalCachedImmunizations}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
