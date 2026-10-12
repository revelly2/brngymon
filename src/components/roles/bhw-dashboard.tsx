'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';
import { evaluateVitals } from '@/lib/validations/clinical';
import {
  UserPlus,
  Stethoscope,
  Users,
  Syringe,
  AlertOctagon,
  HeartPulse,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
} from 'lucide-react';

export function BhwDashboard() {
  const { user } = useAuth();
  const residents = ResidentRegistryService.getResidents();
  const vitals = ClinicalService.getVitals();
  const immunizations = ClinicalService.getImmunizations();

  // BHW Quick Triage Simulator State
  const [sbp, setSbp] = useState<number>(120);
  const [dbp, setDbp] = useState<number>(80);
  const [temp, setTemp] = useState<number>(36.8);
  const [weight, setWeight] = useState<number>(62);
  const [height, setHeight] = useState<number>(165);

  const evalResult = evaluateVitals({
    systolicBp: sbp,
    diastolicBp: dbp,
    temperatureCelsius: temp,
    weightKg: weight,
    heightCm: height,
  });

  const barangayResidents = residents.filter((r) => r.barangay === user.barangay);
  const brgyVitals = vitals.filter((v) => {
    const res = residents.find((r) => r.id === v.resident_id);
    return res?.barangay === user.barangay;
  });

  // Calculate defaulter count for BHW's assigned barangay
  const brgyInfants = barangayResidents
    .filter((r) => {
      const birthYear = parseInt(r.date_of_birth.split('-')[0], 10);
      return 2026 - birthYear < 5;
    })
    .map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      barangay: c.barangay,
      purok: c.purok,
      dateOfBirth: c.date_of_birth,
    }));
  const defaulters = ClinicalService.computeDefaulters(brgyInfants, immunizations);

  // State for recording vitals to patient
  const [selectedResidentId, setSelectedResidentId] = useState<string>(
    barangayResidents[0]?.id || ''
  );
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Outreach tracker state for home visits
  const [visitedInfants, setVisitedInfants] = useState<Record<string, string>>({});

  const handleRecordVitals = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) return;

    const res = residents.find((r) => r.id === selectedResidentId);
    ClinicalService.recordVitals({
      residentId: selectedResidentId,
      systolicBp: sbp,
      diastolicBp: dbp,
      temperatureCelsius: temp,
      heartRateBpm: 78,
      respiratoryRateCpm: 18,
      weightKg: weight,
      heightCm: height,
      notes: `BHW Rapid Screener: ${evalResult.severity} (${evalResult.nutritionalStatus})`,
    });

    setSaveSuccessMsg(
      `Vitals logged for ${res?.first_name} ${res?.last_name}. Triage Tag: ${evalResult.severity}`
    );
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleLogHomeVisit = (infantId: string) => {
    setVisitedInfants((prev) => ({
      ...prev,
      [infantId]: 'Mother Counseled • Scheduled at BHS on Friday',
    }));
  };

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-300/60 text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5" />
            <span>Frontline BHW Portal • Barangay {user.barangay} Health Station</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Barangay Health Worker Duty Station</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Welcome, <strong>{user.name}</strong>. Your frontline duties include resident profiling, duplicate check, vital signs screening, and pediatric immunization defaulter outreach in your assigned Puroks.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            href="/residents/register"
            className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Resident</span>
          </Link>
          <Link
            href="/vitals"
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-2 border border-slate-300 shadow-2xs"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Record Patient Vitals</span>
          </Link>
        </div>
      </div>

      {/* BHW Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Enrolled Residents</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{barangayResidents.length}</span>
          <span className="text-[11px] text-emerald-700 font-medium">Assigned in {user.barangay}</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Vitals Recorded</span>
          <span className="text-2xl font-bold text-sky-700 mt-1 block">{brgyVitals.length}</span>
          <span className="text-[11px] text-slate-500 font-medium">Encounter History</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Vaccine Defaulter Doses</span>
          <span className="text-2xl font-bold text-rose-600 mt-1 block">{defaulters.length}</span>
          <span className="text-[11px] text-rose-700 flex items-center space-x-1 font-medium">
            <span>Pending Home Visits</span>
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Active Maternal Cases</span>
          <span className="text-2xl font-bold text-pink-600 mt-1 block">
            {barangayResidents.filter((r) => r.is_pregnant).length}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Enrolled in 4-Visit Care</span>
        </div>
      </div>

      {/* Frontline Triage Screening Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-2">
              <HeartPulse className="w-4 h-4 text-emerald-600" />
              <span>BHW Rapid Vitals & Hemodynamic Screener</span>
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">Intake Desk</span>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Resident Patient</label>
            <select
              value={selectedResidentId}
              onChange={(e) => setSelectedResidentId(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            >
              {barangayResidents.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.first_name} {r.last_name} ({r.purok} • UPI: {r.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                min="40"
                max="300"
                value={sbp}
                onChange={(e) => setSbp(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                min="30"
                max="200"
                value={dbp}
                onChange={(e) => setDbp(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Body Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="45"
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="300"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={() => { setSbp(118); setDbp(76); setTemp(36.6); }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => { setSbp(135); setDbp(85); setTemp(38.2); }}
              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Pre-HTN + Fever
            </button>
            <button
              type="button"
              onClick={() => { setSbp(190); setDbp(125); setTemp(37.1); }}
              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              Crisis (&ge;180/120)
            </button>
          </div>

          <button
            type="button"
            onClick={handleRecordVitals}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save & Log Vitals to Patient Record</span>
          </button>
        </div>

        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Automated Triage Result</span>
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                evalResult.severity === 'CRITICAL' ? 'bg-rose-600 text-white animate-pulse' :
                evalResult.severity === 'HIGH' ? 'bg-amber-600 text-white' :
                evalResult.severity === 'ELEVATED' ? 'bg-yellow-400 text-slate-900' : 'bg-emerald-600 text-white'
              }`}>
                {evalResult.severity}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block font-medium">Calculated BMI</span>
                  <span className="text-base font-bold text-slate-900">{evalResult.bmi}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block font-medium">Nutritional Status</span>
                  <span className="text-xs font-semibold text-emerald-700">{evalResult.nutritionalStatus}</span>
                </div>
              </div>

              {evalResult.referralRecommended ? (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-900">IMMEDIATE RHU / HOSPITAL REFERRAL MANDATED</span>
                    <span>Blood pressure is in Hypertensive Crisis. Alert Midwife or Municipal Doctor immediately.</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-emerald-800 bg-emerald-50/60 border border-emerald-200/80 rounded-lg flex items-center space-x-2 p-2.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Vitals within acceptable community monitoring limits.</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
            BHW Role Privilege: Allowed to record biometrics and register residents. Restricted from altering medical diagnoses.
          </div>
        </div>
      </div>

      {/* Pediatric Immunization Defaulter Outreach Queue */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Syringe className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Purok Immunization Defaulter Follow-up Queue
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Barangay {user.barangay} • Field Outreach
          </span>
        </div>

        {defaulters.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-slate-700">All infant immunization schedules are up to date in Barangay {user.barangay}.</p>
            <p className="text-[11px] text-slate-400 mt-1">No pending outreach visits required today.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {defaulters.map((d) => (
              <div key={`${d.residentId}-${d.overdueVaccineCode}`} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900">{d.residentName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {d.purok}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                      {d.overdueVaccineName} Overdue
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Age: <span className="font-medium">{d.ageMonths} mos ({d.ageWeeks} wks)</span> • Overdue:{' '}
                    <strong className="text-rose-700">{d.weeksOverdue} weeks</strong>
                  </div>
                  {visitedInfants[d.residentId] && (
                    <div className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{visitedInfants[d.residentId]}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLogHomeVisit(d.residentId)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    Log Home Visit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assigned Barangay Residents Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Assigned Residents Directory • Barangay {user.barangay}
            </h3>
          </div>
          <Link
            href="/residents"
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            Open Full Directory &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {barangayResidents.map((r) => (
            <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900">{r.first_name} {r.last_name}</span>
                  <span className="font-mono text-[10px] text-slate-500">{r.id}</span>
                  {r.is_pregnant && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-100 text-pink-700 font-semibold">
                      Pregnant
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {r.purok} • PhilHealth: {r.philhealth_id || 'None'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedResidentId(r.id);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Screen Vitals
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
