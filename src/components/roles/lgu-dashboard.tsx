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
    setExportNotice('Executive Brief Generated: Lagangilang_Health_Status_Brief_2026.pdf (RA 10173 Zero-PHI Compliant)');
    setTimeout(() => setExportNotice(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-orange-50/70 border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold">
            <Building className="w-3.5 h-3.5" />
            <span>Municipal Local Government Unit • Executive Policy Portal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">LGU Public Health Surveillance & Governance</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Welcome, <strong>Hon. {user.name}</strong>. Aggregated, de-identified population health metrics for legislative planning, healthcare budget allocation, and epidemic monitoring across Lagangilang pilot barangays.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-slate-300 shadow-2xs">
            <span className="text-xs text-slate-600 font-semibold">Jurisdiction:</span>
            <select
              value={selectedBrgy}
              onChange={(e) => setSelectedBrgy(e.target.value as BarangayCode | 'ALL')}
              className="bg-slate-50 text-slate-800 text-xs font-semibold rounded px-2 py-1 border border-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
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
            className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-xs cursor-pointer"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Export Executive Brief</span>
          </button>
        </div>
      </div>

      {exportNotice && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center space-x-2 font-medium shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* RA 10173 DPA Compliance Notice */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs text-slate-600 shadow-xs">
        <div className="flex items-center space-x-2.5">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong className="text-slate-900">Republic Act No. 10173 (Data Privacy Act of 2012) Enforced:</strong> Individual clinical charts and patient identifiable records are de-identified. All displayed figures represent aggregated epidemiological surveillance.
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold shrink-0 hidden sm:inline-block">
          ZERO-PHI MODE
        </span>
      </div>

      {/* Aggregate Population & Health Coverage KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Profiled Population</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalPop}</div>
          <div className="text-[11px] text-purple-700 mt-1 font-medium">
            {selectedBrgy === 'ALL' ? 'Across 3 Pilot Barangays' : `Barangay ${selectedBrgy}`}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Hypertension Prevalence</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {filteredVitals.length > 0 ? `${Math.round((hypertensiveCount / filteredVitals.length) * 100)}%` : '0%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{hypertensiveCount} screened elevated</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Pregnancies</span>
            <Baby className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-bold text-pink-700">{pregnantCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">DOH ANC program enrolled</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Febrile Cluster Watch</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{febrileCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Dengue / Acute viral surveillance</div>
        </div>
      </div>

      {/* Main Grid: Purok Density & Program Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Purok-Level Demographics Distribution */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900">Purok Population Density & Profiling</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono font-medium">BHW Survey Coverage</span>
          </div>

          <div className="space-y-3">
            {Object.entries(purokCounts).map(([purokKey, count]) => {
              const pct = totalPop > 0 ? Math.round((count / totalPop) * 100) : 0;
              return (
                <div key={purokKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{purokKey}</span>
                    <span className="text-slate-600 font-mono">
                      {count} residents ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <span>Pediatric Cohort (&lt;5 yrs): <strong className="text-slate-900">{pediatricCount}</strong></span>
            <span>Senior Citizens (&ge;60 yrs): <strong className="text-slate-900">{seniorCount}</strong></span>
          </div>
        </div>

        {/* LGU Health Policy Insights & Recommendations */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Municipal Health Policy Recommendations</h3>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="font-semibold text-emerald-800">1. Chronic Disease Maintenance Buffer</div>
              <p className="text-slate-600 leading-relaxed">
                Hypertension screening shows {hypertensiveCount} residents in Stage 1/2. Recommend procuring adequate buffer stocks of Amlodipine 5mg and Losartan 50mg for the RHU pharmacy.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="font-semibold text-pink-800">2. Maternal Nutrition & Micronutrient Support</div>
              <p className="text-slate-600 leading-relaxed">
                {pregnantCount} active pregnancies enrolled. Ensure uninterrupted municipal provision of Ferrous Sulfate + Folic Acid and Calcium carbonate supplements to prevent maternal anemia and preeclampsia.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <div className="font-semibold text-blue-800">3. BHW Field Workstation Enhancement</div>
              <p className="text-slate-600 leading-relaxed">
                Pilot system operates with zero-latency local caching. Recommend sustaining budget for portable digital sphygmomanometers and thermal infant scales.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/analytics"
              className="w-full py-2.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center space-x-2 border border-slate-300 shadow-2xs"
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
