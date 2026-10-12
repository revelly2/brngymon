'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/context/auth-context';
import { BarangayCode } from '@/types/database';
import { AnalyticsService, BarangayHealthProfileReport } from '@/lib/services/analytics-service';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Users,
  Baby,
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  ShieldCheck,
} from 'lucide-react';

export default function AnalyticsDashboardPage() {
  const { user } = useAuth();
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayCode>(user.barangay);
  const [report, setReport] = useState<BarangayHealthProfileReport | null>(null);

  useEffect(() => {
    const data = AnalyticsService.generateBarangayProfile(selectedBarangay, 'March 2026');
    setReport(data);
  }, [selectedBarangay]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>Executive Health Analytics & Automated Reporting</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Purok-level morbidity surveillance, FIC vaccination coverage, and FHSIS-aligned statistical aggregation.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {/* Barangay Filter */}
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value as BarangayCode)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
            >
              <option value="PALAQUIO">Barangay Palaquio</option>
              <option value="TABIOG">Barangay Tabiog</option>
              <option value="BABANGCAG">Barangay Babangcag</option>
            </select>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-1.5 border border-slate-300 shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Profile</span>
            </button>

            <Link
              href="/reports/referral"
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Referral Slips</span>
            </Link>
          </div>
        </div>

        {report && (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-xs text-slate-500 block font-medium">Total Population</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">{report.totalPopulation}</span>
                <span className="text-[11px] text-emerald-700 font-medium">Residents in {report.barangay}</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-xs text-slate-500 block font-medium">FIC Coverage (Target: 95%)</span>
                <span className="text-2xl font-bold text-cyan-700 mt-1 block">
                  {report.pediatricMetrics.ficCoverageRate}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {report.pediatricMetrics.fullyImmunizedChildrenCount} / {report.pediatricMetrics.totalInfantsEligible} Fully Immunized
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-xs text-slate-500 block font-medium">Maternal 4-Visit Compliance</span>
                <span className="text-2xl font-bold text-pink-600 mt-1 block">
                  {report.maternalMetrics.fourVisitCoverageRate}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {report.maternalMetrics.totalActivePregnancies} Active Pregnancies
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                <span className="text-xs text-slate-500 block font-medium">Critical Triage Cases</span>
                <span className="text-2xl font-bold text-rose-600 mt-1 block">
                  {report.morbiditySurveillance.hypertensiveCrisisCount}
                </span>
                <span className="text-[11px] text-rose-700 font-medium">Mandated for Hospital Referral</span>
              </div>
            </div>

            {/* Purok-Segmented Health Profiles Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Monthly Purok Health Profile — Barangay {report.barangay}</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Official FHSIS aggregate table for Barangay Council and Municipal Health Office review.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold">
                  Period: {report.reportingPeriod}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="px-4 py-3">Purok / Sitio</th>
                      <th className="px-4 py-3 text-center">Total Residents</th>
                      <th className="px-4 py-3 text-center">Pregnant Cohort</th>
                      <th className="px-4 py-3 text-center">Pediatric (&lt;5)</th>
                      <th className="px-4 py-3 text-center">Senior Citizens</th>
                      <th className="px-4 py-3 text-center">Hypertension Cases</th>
                      <th className="px-4 py-3 text-center">Febrile Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {report.purokBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          No resident records registered in this barangay yet.
                        </td>
                      </tr>
                    ) : (
                      report.purokBreakdown.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {row.purok}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-800 font-mono font-medium">
                            {row.totalResidents}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium text-pink-600">
                            {row.pregnantCount}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium text-cyan-700">
                            {row.pediatricCount}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium text-amber-700">
                            {row.seniorCount}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium text-orange-600">
                            {row.hypertensiveCount}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-medium text-rose-600">
                            {row.febrileCount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Morbidity & Disease Surveillance Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chronic Non-Communicable Diseases */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Non-Communicable Diseases (NCD) Surveillance</span>
                </h3>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Hypertensive Crisis (&ge;180/120 mmHg)</span>
                    <span className="font-bold font-mono text-rose-600">{report.morbiditySurveillance.hypertensiveCrisisCount}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Stage 2 Hypertension (&ge;140/90 mmHg)</span>
                    <span className="font-bold font-mono text-orange-600">{report.morbiditySurveillance.stage2HypertensionCount}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Pre-Hypertension (120-139 / 80-89 mmHg)</span>
                    <span className="font-bold font-mono text-amber-600">Active Monitoring</span>
                  </div>
                </div>
              </div>

              {/* Communicable & Infectious Surveillance */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Communicable Disease & Outbreak Watch</span>
                </h3>

                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Febrile Illness Alert (&ge;38.0°C)</span>
                    <span className="font-bold font-mono text-amber-600">{report.morbiditySurveillance.febrileIllnessCount}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Suspected Dengue Symptoms</span>
                    <span className="font-bold font-mono text-rose-600">{report.morbiditySurveillance.suspectedDengueCount}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">Acute Respiratory Infection (ARI)</span>
                    <span className="font-bold font-mono text-slate-800">{report.morbiditySurveillance.acuteRespiratoryCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
