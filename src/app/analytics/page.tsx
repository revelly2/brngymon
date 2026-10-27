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
  HeartPulse,
  Award,
  Stethoscope,
  Droplets,
  Calendar,
  Layers,
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
        {/* Executive Header Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-6 sm:p-7 shadow-xs">
          {/* Subtle luminous background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-teal-500/5 dark:bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Executive Health Informatics • Bucay Municipal Health Office</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center space-x-3">
                <span className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-700/50">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <span>Barangay Health Surveillance & Analytics</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Purok-level morbidity surveillance, Fully Immunized Child (FIC) tracking, maternal antenatal care (4-ANC) compliance, and DOH FHSIS-aligned statistical aggregation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
              {/* Barangay Filter */}
              <div className="relative">
                <select
                  value={selectedBarangay}
                  onChange={(e) => setSelectedBarangay(e.target.value as BarangayCode)}
                  aria-label="Filter analytics by barangay"
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                >
                  <option value="PALAQUIO">Barangay Palaquio (Zone 1)</option>
                  <option value="TABIOG">Barangay Tabiog (Zone 2)</option>
                  <option value="BABANGCAG">Barangay Babangcag (Zone 3)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1.5 border border-slate-300 dark:border-slate-700 shadow-2xs"
              >
                <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Print Profile</span>
              </button>

              <Link
                href="/reports/referral"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-xs group"
              >
                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Referral Registry</span>
              </Link>
            </div>
          </div>
        </div>

        {report && (
          <>
            {/* KPI Summary Cards with Rich Metrics & Micro-Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Population */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-emerald-300 dark:hover:border-emerald-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Residents
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {report.totalPopulation}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Individuals</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                    <span>Barangay {report.barangay}</span>
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono">3 Puroks</span>
                </div>
              </div>

              {/* Card 2: FIC Coverage Rate with Meter */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-cyan-300 dark:hover:border-cyan-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    FIC Coverage Rate
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center">
                    <Baby className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">
                    {report.pediatricMetrics.ficCoverageRate}%
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                    DOH Goal: 95%
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(report.pediatricMetrics.ficCoverageRate, 100)}%` }}
                  />
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {report.pediatricMetrics.fullyImmunizedChildrenCount} of {report.pediatricMetrics.totalInfantsEligible} Infants
                  </span>
                  <span className="font-semibold text-cyan-700 dark:text-cyan-400">
                    {report.pediatricMetrics.ficCoverageRate >= 95 ? 'Target Met' : 'Under Target'}
                  </span>
                </div>
              </div>

              {/* Card 3: Maternal 4-Visit Compliance */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-pink-300 dark:hover:border-pink-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Maternal 4-ANC
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 flex items-center justify-center">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-pink-600 dark:text-pink-400 font-mono tracking-tight">
                    {report.maternalMetrics.fourVisitCoverageRate}%
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                    DOH Standard
                  </span>
                </div>
                {/* Visual Progress Bar */}
                <div className="mt-2.5 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(report.maternalMetrics.fourVisitCoverageRate, 100)}%` }}
                  />
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    {report.maternalMetrics.totalActivePregnancies} Active Pregnancies
                  </span>
                  <span className="font-semibold text-pink-600 dark:text-pink-400">
                    {report.maternalMetrics.completed4VisitsCount} Completed 4-ANC
                  </span>
                </div>
              </div>

              {/* Card 4: Critical Triage Escalations */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition-all hover:border-rose-300 dark:hover:border-rose-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Urgent Triage Cases
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight">
                    {report.morbiditySurveillance.hypertensiveCrisisCount}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Emergency Ref
                  </span>
                </div>
                <div className="mt-2.5 flex items-center space-x-1.5 text-xs text-rose-700 dark:text-rose-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                  <span>Mandated RHU / Hospital Transfer</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Stage 2 Hypertension:</span>
                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                    {report.morbiditySurveillance.stage2HypertensionCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Purok-Segmented Health Profiles Table */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Monthly Purok Demographics & Morbidity Profile — Barangay {report.barangay}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    Consolidated primary care census for Barangay Council, Midwife station review, and Municipal Health Office reporting.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 font-semibold flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Period: {report.reportingPeriod}</span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Purok / Sitio</th>
                      <th className="px-4 py-3.5 text-center">Total Residents</th>
                      <th className="px-4 py-3.5 text-center">Pregnant Cohort</th>
                      <th className="px-4 py-3.5 text-center">Pediatric (&lt;5)</th>
                      <th className="px-4 py-3.5 text-center">Senior Citizens</th>
                      <th className="px-4 py-3.5 text-center">Hypertension Alerts</th>
                      <th className="px-4 py-3.5 text-center">Febrile Cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {report.purokBreakdown.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                          No resident records registered in this barangay yet.
                        </td>
                      </tr>
                    ) : (
                      report.purokBreakdown.map((row, idx) => (
                        <tr
                          key={idx}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                            <span>{row.purok}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center text-slate-800 dark:text-slate-200 font-mono font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                              {row.totalResidents}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-medium text-pink-600 dark:text-pink-400">
                            {row.pregnantCount}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-medium text-cyan-700 dark:text-cyan-400">
                            {row.pediatricCount}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-medium text-amber-700 dark:text-amber-400">
                            {row.seniorCount}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-medium text-orange-600 dark:text-orange-400">
                            {row.hypertensiveCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 font-bold">
                                {row.hypertensiveCount}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center font-mono font-medium text-rose-600 dark:text-rose-400">
                            {row.febrileCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold">
                                {row.febrileCount}
                              </span>
                            ) : (
                              '0'
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {/* Table Total Summary Footer */}
                  {report.purokBreakdown.length > 0 && (
                    <tfoot className="bg-slate-50/90 dark:bg-slate-800/90 border-t-2 border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                      <tr>
                        <td className="px-5 py-3">Total Barangay Census</td>
                        <td className="px-4 py-3 text-center font-mono">{report.totalPopulation}</td>
                        <td className="px-4 py-3 text-center font-mono text-pink-600 dark:text-pink-400">
                          {report.maternalMetrics.totalActivePregnancies}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-cyan-600 dark:text-cyan-400">
                          {report.pediatricMetrics.totalInfantsEligible}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-amber-600 dark:text-amber-400">
                          {report.purokBreakdown.reduce((sum, p) => sum + p.seniorCount, 0)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-orange-600 dark:text-orange-400">
                          {report.morbiditySurveillance.stage2HypertensionCount + report.morbiditySurveillance.hypertensiveCrisisCount}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-rose-600 dark:text-rose-400">
                          {report.morbiditySurveillance.febrileIllnessCount}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* Morbidity & Disease Surveillance Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Chronic Non-Communicable Diseases (NCD) */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Non-Communicable Diseases (NCD) Surveillance</span>
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    PhilHealth Konsulta
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <span>Hypertensive Crisis (&ge;180/120 mmHg)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Critical Red Flag • Immediate Hospital Transport</span>
                    </div>
                    <span className="font-bold font-mono text-base text-rose-600 dark:text-rose-400">
                      {report.morbiditySurveillance.hypertensiveCrisisCount}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                        <span>Stage 2 Hypertension (&ge;140/90 mmHg)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Doctor Pharmacotherapy & Lifestyle Intervention</span>
                    </div>
                    <span className="font-bold font-mono text-base text-orange-600 dark:text-orange-400">
                      {report.morbiditySurveillance.stage2HypertensionCount}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Pre-Hypertension (120-139 / 80-89 mmHg)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">BHW Monthly Home BP Monitoring</span>
                    </div>
                    <span className="font-bold font-mono text-xs text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800">
                      Active Watch
                    </span>
                  </div>
                </div>
              </div>

              {/* Communicable & Infectious Surveillance */}
              <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Communicable Disease & Outbreak Watch</span>
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    PIDSR Early Warning
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Febrile Illness Alert (&ge;38.0°C)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Screening for Acute Infection or Malaria</span>
                    </div>
                    <span className="font-bold font-mono text-base text-amber-600 dark:text-amber-400">
                      {report.morbiditySurveillance.febrileIllnessCount}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <span>Suspected Dengue Symptoms</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">NS1 / Tourniquet Test referral protocol</span>
                    </div>
                    <span className="font-bold font-mono text-base text-rose-600 dark:text-rose-400">
                      {report.morbiditySurveillance.suspectedDengueCount}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                        <span>Acute Respiratory Infection (ARI)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Community TB-DOTS & Cough triage screening</span>
                    </div>
                    <span className="font-bold font-mono text-base text-slate-800 dark:text-slate-200">
                      {report.morbiditySurveillance.acuteRespiratoryCount}
                    </span>
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
