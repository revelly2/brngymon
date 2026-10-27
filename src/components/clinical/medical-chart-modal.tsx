'use client';

import React, { useState } from 'react';
import { Resident, VitalSign } from '@/types/database';
import { ClinicalService, ClinicalEncounter } from '@/lib/services/clinical-service';
import { useAuth } from '@/lib/context/auth-context';
import {
  Stethoscope,
  X,
  HeartPulse,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  User,
  ShieldCheck,
  Building,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';

interface MedicalChartModalProps {
  resident: Resident | null;
  onClose: () => void;
}

export function MedicalChartModal({ resident, onClose }: MedicalChartModalProps) {
  const { user, hasModule } = useAuth();
  const [activeTab, setActiveTab] = useState<'encounters' | 'vitals' | 'new_encounter'>('encounters');

  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalImpression, setClinicalImpression] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!resident) return null;

  const residentVitals = ClinicalService.getVitals().filter((v) => v.resident_id === resident.id);
  const encounters = ClinicalService.getEncounters(resident.id);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const parts = dob.split('-');
    const birthYear = parseInt(parts[0], 10);
    return Math.max(0, 2026 - birthYear);
  };
  const age = calculateAge(resident.date_of_birth);

  const handleSaveEncounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalImpression.trim()) return;

    ClinicalService.addEncounter({
      residentId: resident.id,
      encounterDate: new Date().toISOString(),
      providerName: user.name,
      providerRole: user.role,
      chiefComplaint: chiefComplaint.trim() || 'Routine Clinic Consultation',
      clinicalImpression: clinicalImpression.trim(),
      treatmentPlan: treatmentPlan.trim() || 'Health lifestyle counseling and hydration.',
    });

    setSaveSuccess(true);
    setChiefComplaint('');
    setClinicalImpression('');
    setTreatmentPlan('');
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('encounters');
    }, 1500);
  };

  const isNurseSpecialAccess = user.role === 'nurse' && hasModule('patient_chart');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-blue-50/60 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 shadow-2xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {resident.first_name} {resident.middle_name ? `${resident.middle_name} ` : ''}
                  {resident.last_name} {resident.suffix || ''}
                </h2>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {resident.upi}
                </span>
                {isNurseSpecialAccess && (
                  <span className="inline-flex items-center space-x-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Special Nurse Clearance</span>
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                <span>{age} yrs old ({resident.biological_sex})</span>
                <span>•</span>
                <span>Brgy. {resident.barangay}, {resident.purok}</span>
                <span>•</span>
                <span className="font-mono">PhilHealth: {resident.philhealth_id || 'Not enrolled'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('encounters')}
            className={`py-3 font-semibold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'encounters'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Consultation History ({encounters.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`py-3 font-semibold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'vitals'
                ? 'border-blue-600 text-blue-700 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Hemodynamic Vitals Log ({residentVitals.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('new_encounter')}
            className={`py-3 font-semibold transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'new_encounter'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Record New Encounter</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: Encounters History */}
          {activeTab === 'encounters' && (
            <div className="space-y-3">
              {encounters.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <span>No consultation encounters documented yet for this resident.</span>
                </div>
              ) : (
                encounters.map((enc) => (
                  <div
                    key={enc.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {enc.providerName}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {enc.providerRole}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-slate-400 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{enc.encounterDate.replace('T', ' ').slice(0, 16)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Chief Complaint
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5">{enc.chiefComplaint}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40">
                      <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
                        Clinical Diagnosis / Impression (ICD-10)
                      </span>
                      <p className="text-slate-900 dark:text-slate-100 font-medium mt-0.5">
                        {enc.clinicalImpression}
                      </p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Management & Prescription Plan (PhilHealth Konsulta)
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-mono mt-0.5 whitespace-pre-line leading-relaxed">
                        {enc.treatmentPlan}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Vitals History */}
          {activeTab === 'vitals' && (
            <div className="space-y-3">
              {residentVitals.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                  <HeartPulse className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <span>No vital signs records logged for this resident.</span>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2.5">Date & Time</th>
                        <th className="px-3 py-2.5">BP (mmHg)</th>
                        <th className="px-3 py-2.5">HR / RR</th>
                        <th className="px-3 py-2.5">Temp</th>
                        <th className="px-3 py-2.5">BMI</th>
                        <th className="px-3 py-2.5">Triage Severity</th>
                        <th className="px-3 py-2.5">Clinical Alerts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {residentVitals.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                            {v.recorded_at.replace('T', ' ').slice(0, 16)}
                          </td>
                          <td className="px-3 py-2.5 font-bold font-mono text-slate-900 dark:text-white">
                            {v.systolic_bp}/{v.diastolic_bp}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                            {v.heart_rate_bpm} bpm / {v.respiratory_rate_cpm} cpm
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                            {v.temperature_celsius}°C
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                            {v.bmi}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                                v.severity === 'CRITICAL'
                                  ? 'bg-rose-600 text-white animate-pulse'
                                  : v.severity === 'HIGH'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              }`}
                            >
                              {v.severity}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-rose-700 dark:text-rose-400 font-semibold">
                            {v.clinical_flags.length > 0 ? v.clinical_flags.join(', ') : 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: New Encounter Form */}
          {activeTab === 'new_encounter' && (
            <form onSubmit={handleSaveEncounter} className="space-y-4 text-xs">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center space-x-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Clinical encounter successfully committed to patient longitudinal chart.</span>
                </div>
              )}

              {/* Attributing Officer Banner */}
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300">
                    Documenting Healthcare Provider: <strong>{user.name}</strong> ({user.role.toUpperCase()})
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">RA 10173 Audit Logged</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chief Complaint / Encounter Reason
                </label>
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="e.g. Headache, epigastric pain, routine antenatal follow-up, immunization review"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Clinical Diagnosis / Impression (ICD-10 Primary Care) *
                  </label>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setClinicalImpression('Essential Hypertension (Stage 2)')}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      + HTN
                    </button>
                    <button
                      type="button"
                      onClick={() => setClinicalImpression('Upper Respiratory Tract Infection (URTI) with Low-Grade Fever')}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      + URTI
                    </button>
                    <button
                      type="button"
                      onClick={() => setClinicalImpression('Intrauterine Pregnancy, Routine ANC Monitoring')}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      + Prenatal
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={clinicalImpression}
                  onChange={(e) => setClinicalImpression(e.target.value)}
                  placeholder="Specify primary clinical diagnosis or syndromic presentation"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Management Plan & Prescriptions (PhilHealth Konsulta)
                </label>
                <textarea
                  rows={3}
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  placeholder="Medication names, dosage, frequency, dietary modifications, follow-up schedule..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('encounters')}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  Sign & Save to Medical Chart
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Building className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Municipality of Bucay • RHU Clinical Informatics System</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            Close Chart
          </button>
        </div>
      </div>
    </div>
  );
}
