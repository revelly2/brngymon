'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';
import { AnalyticsService } from '@/lib/services/analytics-service';
import { BarangayCode } from '@/types/database';
import {
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Users,
  Baby,
  Syringe,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export function LguDashboard() {
  const { user } = useAuth();
  const [selectedBrgy, setSelectedBrgy] = useState<BarangayCode | 'ALL'>('ALL');

  const residents = ResidentRegistryService.getResidents();
  const vitals = ClinicalService.getVitals();
  const maternalRecords = ClinicalService.getMaternalRecords();
  const immunizations = ClinicalService.getImmunizations();

  // Filter based on selected barangay
  const filteredResidents =
    selectedBrgy === 'ALL' ? residents : residents.filter((r) => r.barangay === selectedBrgy);

  const totalPop = filteredResidents.length;
  const seniorCount = filteredResidents.filter((r) => {
    const birthYear = parseInt(r.date_of_birth.split('-')[0], 10);
    return 2026 - birthYear >= 60;
  }).length;

  const pediatricCount = filteredResidents.filter((r) => {
    const birthYear = parseInt(r.date_of_birth.split('-')[0], 10);
    return 2026 - birthYear < 5;
  }).length;

  const pregnantCount = filteredResidents.filter((r) => r.is_pregnant).length;

  // Morbidity aggregates (de-identified)
  const resIds = new Set(filteredResidents.map((r) => r.id));
  const filteredVitals = vitals.filter((v) => resIds.has(v.resident_id));

  const hypertensiveCount = filteredVitals.filter(
    (v) => v.systolic_bp >= 140 || v.diastolic_bp >= 90
  ).length;

  const febrileCount = filteredVitals.filter((v) => v.temperature_celsius >= 38.0).length;

  // Purok summary calculation
  const purokCounts: Record<string, number> = {};
  filteredResidents.forEach((r) => {
    const key = `${r.barangay} - ${r.purok}`;
    purokCounts[key] = (purokCounts[key] || 0) + 1;
  });

  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportBrief = () => {
    setExportNotice('Executive Brief Generated: Bucay_Health_Status_Brief_2026.pdf (RA 10173 Zero-PHI Compliant)');
    setTimeout(() => setExportNotice(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="futuristic-card accent-line-amber p-6 lg:p-7 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 dark:from-slate-900 dark:via-slate-900/95 dark:to-amber-950/20 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
            <Building className="w-3.5 h-3.5" />
            <span>Municipal Local Government Unit • Executive Policy Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            LGU Public Health Surveillance & Governance
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Welcome, <strong>Hon. {user.name}</strong>. Aggregated, de-identified population health metrics for legislative planning, healthcare budget allocation, and epidemic monitoring across Bucay pilot barangays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs">
            <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Jurisdiction:</span>
            <select
              value={selectedBrgy}
              onChange={(e) => setSelectedBrgy(e.target.value as BarangayCode | 'ALL')}
              className="bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded px-2 py-1 border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="ALL">All Pilot Barangays (3)</option>
              <option value="PALAQUIO">Barangay Palaquio</option>
              <option value="TABIOG">Barangay Tabiog</option>
              <option value="BABANGCAG">Barangay Babangcag</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportBrief}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition-all flex items-center space-x-2 shadow-sm hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Export Executive Brief</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-300 text-xs flex items-center space-x-2 font-medium shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* RA 10173 DPA Compliance Notice */}
      <div className="futuristic-card p-4 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center space-x-2.5">
          <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong className="text-slate-900 dark:text-slate-100">Republic Act No. 10173 (Data Privacy Act of 2012) Enforced:</strong> Individual clinical charts and patient identifiable records are de-identified. All displayed figures represent aggregated epidemiological surveillance.
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold shrink-0 hidden sm:inline-block">
          ZERO-PHI MODE
        </span>
      </div>

      {/* Aggregate Population & Health Coverage KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="futuristic-kpi">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Profiled Population</span>
            <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">{totalPop}</div>
          <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-1 font-semibold">
            {selectedBrgy === 'ALL' ? 'Across 3 Pilot Barangays' : `Barangay ${selectedBrgy}`}
          </div>
        </div>

        <div className="futuristic-kpi">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Hypertension Rate</span>
            <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-400 tabular-nums">
            {filteredVitals.length > 0 ? `${Math.round((hypertensiveCount / filteredVitals.length) * 100)}%` : '0%'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{hypertensiveCount} screened elevated</div>
        </div>

        <div className="futuristic-kpi">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Active Pregnancies</span>
            <Baby className="w-4 h-4 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-pink-700 dark:text-pink-400 tabular-nums">{pregnantCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">DOH ANC program enrolled</div>
        </div>

        <div className="futuristic-kpi">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Febrile Watch</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400 tabular-nums">{febrileCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Dengue / Acute viral watch</div>
        </div>
      </div>

      {/* Main Grid: Purok Density & Program Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Purok-Level Demographics Distribution */}
        <div className="lg:col-span-7 futuristic-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Purok Population Density & Profiling</h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono font-medium">BHW Survey Coverage</span>
          </div>

          <div className="space-y-3">
            {Object.entries(purokCounts).map(([purokKey, count]) => {
              const pct = totalPop > 0 ? Math.round((count / totalPop) * 100) : 0;
              return (
                <div key={purokKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{purokKey}</span>
                    <span className="text-slate-600 dark:text-slate-400 font-mono">
                      {count} residents ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Pediatric Cohort (&lt;5 yrs): <strong className="text-slate-900 dark:text-slate-100">{pediatricCount}</strong></span>
            <span>Senior Citizens (&ge;60 yrs): <strong className="text-slate-900 dark:text-slate-100">{seniorCount}</strong></span>
          </div>
        </div>

        {/* LGU Health Policy Insights & Recommendations */}
        <div className="lg:col-span-5 futuristic-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Municipal Health Policy Recommendations</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="font-semibold text-emerald-800 dark:text-emerald-300">1. Chronic Disease Maintenance Buffer</div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Hypertension screening shows {hypertensiveCount} residents in Stage 1/2. Recommend procuring adequate buffer stocks of Amlodipine 5mg and Losartan 50mg for the RHU pharmacy.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="font-semibold text-pink-800 dark:text-pink-300">2. Maternal Nutrition & Micronutrient Support</div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {pregnantCount} active pregnancies enrolled. Ensure uninterrupted municipal provision of Ferrous Sulfate + Folic Acid and Calcium carbonate supplements to prevent maternal anemia and preeclampsia.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="font-semibold text-blue-800 dark:text-blue-300">3. BHW Field Workstation Enhancement</div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Pilot system operates with zero-latency local caching. Recommend sustaining budget for portable digital sphygmomanometers and thermal infant scales.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/analytics"
              className="w-full py-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center space-x-2 border border-slate-300 dark:border-slate-700 shadow-2xs"
            >
              <span>Explore Full Statistical Charts</span>
              <BarChart3 className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
