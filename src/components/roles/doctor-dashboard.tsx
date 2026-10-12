'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';
import {
  Stethoscope,
  AlertOctagon,
  HeartPulse,
  Activity,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  ClipboardList,
} from 'lucide-react';

export function DoctorDashboard() {
  const { user } = useAuth();
  const residents = ResidentRegistryService.getResidents();
  const vitals = ClinicalService.getVitals();
  const maternalRecords = ClinicalService.getMaternalRecords();

  // Consultation disposition simulator
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [clinicalImpression, setClinicalImpression] = useState<string>('Essential Hypertension (Stage 2)');
  const [prescriptionPlan, setPrescriptionPlan] = useState<string>('Amlodipine 5mg tab 1x daily OD morning, Losartan 50mg tab 1x daily OD evening. Low salt, low fat diet.');
  const [dispositionSubmitted, setDispositionSubmitted] = useState<boolean>(false);

  // Cross-Barangay Priority Triage Queue
  const triageQueue = vitals
    .map((v) => {
      const res = residents.find((r) => r.id === v.resident_id);
      return {
        ...v,
        resident: res,
      };
    })
    .filter((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH' || v.referral_recommended)
    .sort((a, b) => {
      if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
      if (b.severity === 'CRITICAL' && a.severity !== 'CRITICAL') return 1;
      return new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime();
    });

  const criticalCount = triageQueue.filter((q) => q.severity === 'CRITICAL').length;
  const highCount = triageQueue.filter((q) => q.severity === 'HIGH').length;
  const maternalRiskCount = maternalRecords.filter((m) => m.high_risk_flags.length > 0).length;

  const handleSaveConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    setDispositionSubmitted(true);
    setTimeout(() => {
      setDispositionSubmitted(false);
      setSelectedPatientId('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-sky-50/70 border border-blue-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold">
            <Building className="w-3.5 h-3.5" />
            <span>Rural Health Unit • Municipal Health Officer (MHO) Portal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">MHO Physician Clinical Command Center</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Welcome, <strong>Dr. {user.name}</strong>. Oversight for primary care clinical consultations, urgent hypertensive/febrile escalation queues, maternal high-risk reviews, and secondary hospital referrals (Abra Provincial Hospital).
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            href="/vitals"
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-xs"
          >
            <Activity className="w-4 h-4" />
            <span>Review Full Vitals Stream</span>
          </Link>
          <Link
            href="/reports/referral"
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-2 border border-slate-300 shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            <span>Sign Hospital Referral</span>
          </Link>
        </div>
      </div>

      {/* Physician Clinical KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Critical Triage Alerts</span>
            <AlertOctagon className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{criticalCount}</div>
          <div className="text-[11px] text-rose-700 mt-1 font-medium">Immediate MD intervention</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">High Risk Consults</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{highCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending clinical review</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">High-Risk Obstetric</span>
            <HeartPulse className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-bold text-pink-700">{maternalRiskCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">MCH co-management</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Cross-Brgy Coverage</span>
            <Building className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">3 Stations</div>
          <div className="text-[11px] text-blue-700 mt-1 font-medium">Palaquio • Tabiog • Babangcag</div>
        </div>
      </div>

      {/* Main Grid: Live Escalation Queue & Clinical Disposition Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Urgent Triage Escalation Queue */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Urgent Clinical Escalation Queue</h3>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono font-medium">
              Live RHU Intake Stream
            </span>
          </div>

          {triageQueue.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No critical or high-risk patients currently waiting in triage queue.
            </div>
          ) : (
            <div className="space-y-3">
              {triageQueue.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    item.severity === 'CRITICAL'
                      ? 'bg-rose-50/60 border-rose-200 text-slate-800'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          {item.resident
                            ? `${item.resident.first_name} ${item.resident.last_name}`
                            : 'Unknown Resident'}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 shadow-2xs">
                          {item.resident?.barangay} • {item.resident?.purok}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.severity === 'CRITICAL'
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-amber-600 text-white'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-slate-600 space-x-3 pt-1">
                        <span>
                          BP: <strong className="text-slate-900">{item.systolic_bp}/{item.diastolic_bp} mmHg</strong>
                        </span>
                        <span>
                          HR: <strong className="text-slate-900">{item.heart_rate_bpm} bpm</strong>
                        </span>
                        <span>
                          Temp: <strong className="text-slate-900">{item.temperature_celsius}°C</strong>
                        </span>
                        <span>
                          BMI: <strong className="text-slate-900">{item.bmi}</strong>
                        </span>
                      </div>

                      {item.clinical_flags.length > 0 && (
                        <div className="text-[11px] text-rose-700 font-semibold pt-1">
                          Alerts: {item.clinical_flags.join(' • ')}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPatientId(item.resident_id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors shrink-0 shadow-xs"
                    >
                      Consult
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clinical Consult Disposition & Prescription Plan */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Physician Clinical Consultation</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">DOH / PhilHealth Konsulta</span>
          </div>

          {dispositionSubmitted && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Consultation notes & prescription successfully signed and logged into patient history.</span>
            </div>
          )}

          <form onSubmit={handleSaveConsultation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient from Queue</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              >
                <option value="">-- Choose patient for evaluation --</option>
                {triageQueue.map((q) => (
                  <option key={q.id} value={q.resident_id}>
                    {q.resident ? `${q.resident.first_name} ${q.resident.last_name} (${q.severity} - ${q.systolic_bp}/${q.diastolic_bp})` : q.resident_id}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatientId && (() => {
              const activePatient = triageQueue.find((q) => q.resident_id === selectedPatientId);
              if (!activePatient) return null;
              return (
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>{activePatient.resident?.first_name} {activePatient.resident?.last_name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-blue-800 border border-blue-200">
                      {activePatient.resident?.barangay} • {activePatient.resident?.purok}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-700 flex flex-wrap gap-2 pt-0.5">
                    <span>BP: <strong className="text-slate-900">{activePatient.systolic_bp}/{activePatient.diastolic_bp}</strong></span>
                    <span>HR: <strong className="text-slate-900">{activePatient.heart_rate_bpm} bpm</strong></span>
                    <span>Temp: <strong className="text-slate-900">{activePatient.temperature_celsius}°C</strong></span>
                    <span>BMI: <strong className="text-slate-900">{activePatient.bmi}</strong></span>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Diagnosis / Impression (ICD-10 Primary Care)
              </label>
              <input
                type="text"
                value={clinicalImpression}
                onChange={(e) => setClinicalImpression(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
                placeholder="e.g. Essential Hypertension, Acute Bronchitis, Dengue Warning Signs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Prescription & Management Plan (PhilHealth Konsulta)
                </label>
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setPrescriptionPlan('Amlodipine 5mg tab 1x daily OD morning (30 days). Losartan 50mg tab 1x daily OD evening (30 days). Low salt diet, return BP check in 7 days.')}
                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer"
                  >
                    + HTN Protocol
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrescriptionPlan('Paracetamol 500mg tab 1 tab every 4 hours PRN for fever >= 38.0C. Oral Rehydration Salts 1 sachet in 1L boiled water. Dengue advisory issued.')}
                    className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer"
                  >
                    + Fever/ORS
                  </button>
                </div>
              </div>
              <textarea
                rows={3}
                value={prescriptionPlan}
                onChange={(e) => setPrescriptionPlan(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs font-mono"
                placeholder="Specify drug names, dosages, frequencies, lifestyle instructions, and return follow-up dates..."
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <Link
                href="/reports/referral"
                className="text-xs text-blue-700 hover:text-blue-800 font-semibold flex items-center space-x-1"
              >
                <span>Secondary Transfer Form &rarr;</span>
              </Link>

              <button
                type="submit"
                disabled={!selectedPatientId}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Sign & Save Disposition
              </button>
            </div>
          </form>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">RHU Triage Protocol Reminder:</div>
            <div>
              • <strong>Stage 2 HTN (BP &ge; 140/90):</strong> Initiate oral antihypertensive + lifestyle counseling.
            </div>
            <div>
              • <strong>Hypertensive Crisis (BP &ge; 180/120):</strong> Assess for end-organ damage (chest pain, shortness of breath, neurological deficits). If present, arrange emergency ambulance transfer.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
