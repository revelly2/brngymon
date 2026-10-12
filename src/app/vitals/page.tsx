'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/context/auth-context';
import { Resident, VitalSign } from '@/types/database';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';
import { evaluateVitals } from '@/lib/validations/clinical';
import {
  HeartPulse,
  Activity,
  AlertOctagon,
  CheckCircle2,
  Stethoscope,
  Clock,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

export default function VitalsPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<VitalSign[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');

  // Form fields
  const [sbp, setSbp] = useState<number>(120);
  const [dbp, setDbp] = useState<number>(80);
  const [hr, setHr] = useState<number>(75);
  const [rr, setRr] = useState<number>(18);
  const [temp, setTemp] = useState<number>(36.7);
  const [weight, setWeight] = useState<number>(60);
  const [height, setHeight] = useState<number>(160);
  const [notes, setNotes] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    const resList = ResidentRegistryService.getResidents();
    setResidents(resList);
    if (resList.length > 0) {
      setSelectedResidentId(resList[0].id);
    }
    setVitalsHistory(ClinicalService.getVitals());
  }, []);

  const liveEval = evaluateVitals({
    systolicBp: sbp,
    diastolicBp: dbp,
    temperatureCelsius: temp,
    weightKg: weight,
    heightCm: height,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) return;

    const res = ClinicalService.recordVitals({
      residentId: selectedResidentId,
      systolicBp: sbp,
      diastolicBp: dbp,
      heartRateBpm: hr,
      respiratoryRateCpm: rr,
      temperatureCelsius: temp,
      weightKg: weight,
      heightCm: height,
      recordedByUserId: user.id,
      notes,
    });

    if (res.success) {
      setVitalsHistory(ClinicalService.getVitals());
      setSubmitSuccess(`Vitals encounter logged with severity: ${res.evaluation.severity}`);
      setTimeout(() => setSubmitSuccess(null), 3000);
      setNotes('');
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-600 text-white animate-pulse';
      case 'HIGH':
        return 'bg-amber-600 text-white';
      case 'ELEVATED':
        return 'bg-yellow-400 text-slate-900';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  const selectedResident = residents.find((r) => r.id === selectedResidentId);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              <span>Clinical Vitals Intake & Triage Assessment</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Field biometric capture with automated Philippine CPG hemodynamic stratification and febrile illness alerts.
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-500 block font-medium">Duty Clinician / BHW</span>
            <span className="font-semibold text-emerald-700">{user.name}</span>
          </div>
        </div>

        {submitSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 shadow-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{submitSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Intake Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                1. Patient Selection & Biometrics
              </h2>
              {selectedResident && (
                <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                  {selectedResident.upi}
                </span>
              )}
            </div>

            {/* Resident Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Patient *</label>
              <select
                value={selectedResidentId}
                onChange={(e) => setSelectedResidentId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
              >
                {residents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.first_name} {r.last_name} ({r.upi}) • Brgy. {r.barangay} - {r.purok}
                  </option>
                ))}
              </select>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  min="40"
                  max="300"
                  required
                  value={sbp}
                  onChange={(e) => setSbp(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  min="30"
                  max="200"
                  required
                  value={dbp}
                  onChange={(e) => setDbp(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pulse / Heart Rate (bpm)</label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  required
                  value={hr}
                  onChange={(e) => setHr(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Respiratory Rate (cpm)</label>
                <input
                  type="number"
                  min="8"
                  max="80"
                  required
                  value={rr}
                  onChange={(e) => setRr(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Core Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  required
                  value={temp}
                  onChange={(e) => setTemp(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="300"
                  required
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div className="col-span-2 sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  min="30"
                  max="250"
                  required
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Notes & Symptoms</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Chief complaint, reported dizziness, cough duration, etc."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-xs"
              >
                <HeartPulse className="w-4 h-4" />
                <span>Log Clinical Vitals</span>
              </button>
            </div>
          </form>

          {/* Real-Time Clinical Decision Support Output */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5 shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  2. Decision Support Assessment
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${getSeverityBadge(liveEval.severity)}`}>
                  {liveEval.severity}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block font-medium">Body Mass Index (BMI)</span>
                    <span className="text-lg font-bold text-slate-900">{liveEval.bmi}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block font-medium">Nutritional Status</span>
                    <span className="font-semibold text-emerald-700">{liveEval.nutritionalStatus}</span>
                  </div>
                </div>

                {liveEval.referralRecommended ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                    <div className="flex items-center space-x-2 font-bold text-xs text-rose-800">
                      <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>CRITICAL TRIAGE: MANDATORY REFERRAL</span>
                    </div>
                    <p className="text-xs text-rose-800 leading-relaxed">
                      Blood pressure ({sbp}/{dbp} mmHg) indicates a Hypertensive Crisis. Immediate medical evaluation at the Rural Health Unit or Municipal District Hospital is required.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80 text-xs text-emerald-800 flex items-center space-x-2 font-medium">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No critical triage escalation indicated.</span>
                  </div>
                )}

                {liveEval.clinicalFlags.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Identified Risk Flags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {liveEval.clinicalFlags.map((flag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-50 border border-rose-200 text-rose-700 font-semibold"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
              Validated against Philippine Clinical Practice Guidelines for Hypertension and WHO Asia-Pacific Standards.
            </div>
          </div>
        </div>

        {/* Recent Encounter History Log */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Recent Vitals Encounters History</span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{vitalsHistory.length} Recorded Visits</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Patient UPI</th>
                  <th className="px-4 py-3">BP (mmHg)</th>
                  <th className="px-4 py-3">HR / RR</th>
                  <th className="px-4 py-3">Temp (°C)</th>
                  <th className="px-4 py-3">BMI</th>
                  <th className="px-4 py-3">Triage Severity</th>
                  <th className="px-4 py-3">Clinical Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vitalsHistory.map((v) => {
                  const res = residents.find((r) => r.id === v.resident_id);
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono">
                        {new Date(v.recorded_at).toLocaleDateString()} {new Date(v.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-emerald-800 font-semibold">{res?.upi || v.resident_id.slice(0, 8)}</span>
                        {res && <div className="text-[11px] text-slate-900 font-medium">{res.first_name} {res.last_name}</div>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {v.systolic_bp} / {v.diastolic_bp}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {v.heart_rate_bpm} bpm • {v.respiratory_rate_cpm} cpm
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {v.temperature_celsius}°C
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {v.bmi}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getSeverityBadge(v.severity)}`}>
                          {v.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {v.clinical_flags.length > 0 ? (
                            v.clinical_flags.map((f, i) => (
                              <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                                {f}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-[11px] font-medium">Normal</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
