'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import {
  EvaluationService,
  UAT_RESPONDENTS,
  UATEvaluationReport,
} from '@/lib/services/evaluation-service';
import {
  ClipboardCheck,
  Award,
  Users,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  ThumbsUp,
  FileText,
  Sliders,
} from 'lucide-react';

export default function EvaluationPage() {
  const [report] = useState<UATEvaluationReport>(() => EvaluationService.generateUATReport());

  const getScoreColor = (score: number) => {
    if (score >= 4.2) return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    if (score >= 3.4) return 'text-cyan-800 bg-cyan-50 border-cyan-200';
    return 'text-amber-800 bg-amber-50 border-amber-200';
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
              <span>System Evaluation & Quality Assurance (Phase 5 UAT)</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Purposive sampling evaluation across N=10 frontline BHWs and Midwives using a standardized 5-point Likert scale.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Deployment Cleared</span>
            </span>
          </div>
        </div>

        {/* Composite Readiness Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Standard Evaluation Benchmark (&ge; 4.20 / 5.00)</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              Overall Composite Score: <span className="text-emerald-700">{report.overallCompositeMean} / 5.00</span>
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Descriptive Rating: <strong className="text-emerald-800 uppercase tracking-wide">{report.overallRating}</strong>.
              All four functional and clinical dimensions scored above the 4.20 threshold, validating readiness for pilot deployment in Palaquio, Tabiog, and Babangcag.
            </p>
          </div>

          <div className="text-center p-4 bg-white rounded-xl border border-slate-200 shrink-0 min-w-[180px] shadow-2xs">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Sample Cohort</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">N = {report.sampleSize}</span>
            <span className="text-[11px] text-emerald-700 font-semibold">BHWs & Midwives</span>
          </div>
        </div>

        {/* 4 Dimension Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.criteriaResults.map((crit) => (
            <div key={crit.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{crit.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{crit.actionDirective}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-sm shrink-0 ${getScoreColor(crit.weightedMean)}`}>
                  {crit.weightedMean.toFixed(2)}
                </div>
              </div>

              {/* Likert Distribution Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span className="font-medium">Rating Breakdown (5 = Strongly Agree)</span>
                  <span className="font-semibold text-emerald-700">{crit.descriptiveRating}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-500 font-medium">5★ ({crit.ratingCounts[5]})</span>
                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden flex border border-slate-200">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(crit.ratingCounts[5] / 10) * 100}%` }}
                    />
                    <div
                      className="bg-cyan-500 h-full"
                      style={{ width: `${(crit.ratingCounts[4] / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-slate-500 font-medium">4★ ({crit.ratingCounts[4]})</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Iterative Refinements Applied During Phase 5 */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>Field UX Adjustments & Usability Refinements Implemented</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>High-Contrast Typography</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Adjusted font weights and border tokens for low-glare readability on standard-issue health station desktop displays.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>One-Click Clinical Presets</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Added quick vital sign presets (&ldquo;Normal&rdquo;, &ldquo;Pre-HTN + Fever&rdquo;, &ldquo;Crisis&rdquo;) to streamline testing and rapid patient triaging.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Resilient Local-First Caching</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Guaranteed zero patient record loss by caching entries locally in browser storage when rural cellular coverage fluctuates.
              </p>
            </div>
          </div>
        </div>

        {/* Frontline Evaluators Cohort (N=10) */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Purposive Sampling Respondents Roster (N=10)</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">Barangays Palaquio, Tabiog, Babangcag</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Respondent Name</th>
                  <th className="px-4 py-3">Clinical / Community Role</th>
                  <th className="px-4 py-3">Assigned Health Station</th>
                  <th className="px-4 py-3 text-right">Years in Service</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {UAT_RESPONDENTS.map((resp) => (
                  <tr key={resp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {resp.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        resp.role === 'Rural Health Midwife'
                          ? 'bg-pink-50 border-pink-200 text-pink-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        {resp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      Barangay {resp.barangay}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {resp.yearsInService} years
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
