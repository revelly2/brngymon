'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';
import { evaluateVitals } from '@/lib/validations/clinical';
import { Resident, VitalSign, ImmunizationRecord } from '@/types/database';
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
  RefreshCw,
} from 'lucide-react';
import { BhwVectorAvatar } from '@/components/vectors/role-avatars';

export function BhwDashboard() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>(() => ResidentRegistryService.getResidents());
  const [vitals, setVitals] = useState<VitalSign[]>(() => ClinicalService.getVitals());
  const [immunizations, setImmunizations] = useState<ImmunizationRecord[]>(() => ClinicalService.getImmunizations());
  const [isSyncing, setIsSyncing] = useState(false);

  const syncLiveCloud = async () => {
    setIsSyncing(true);
    try {
      const [freshRes, freshVit, freshImm] = await Promise.all([
        ResidentRegistryService.fetchResidents(),
        ClinicalService.fetchVitals(),
        ClinicalService.fetchImmunizations(),
      ]);
      setResidents(freshRes);
      setVitals(freshVit);
      setImmunizations(freshImm);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncLiveCloud();
  }, []);

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

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) return;

    const res = residents.find((r) => r.id === selectedResidentId);
    const result = await ClinicalService.recordVitalsAsync({
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

    if (result.vitalsRecord) {
      setVitals((prev) => [result.vitalsRecord!, ...prev]);
    }

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
      <div className="futuristic-card accent-line-emerald p-6 lg:p-7 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 dark:from-slate-900 dark:via-slate-900/95 dark:to-emerald-950/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center space-x-4">
          <div className="shrink-0 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-800/95 border border-emerald-200/90 dark:border-emerald-800/80 shadow-md">
            <BhwVectorAvatar className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800 text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Frontline BHW Portal • Barangay {user.barangay} Health Station</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Barangay Health Worker Duty Station
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Welcome, <strong>{user.name}</strong>. Your frontline duties include resident profiling, duplicate check, vital signs screening, and pediatric immunization defaulter outreach in your assigned Puroks.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            href="/residents/register"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all flex items-center space-x-2 shadow-sm hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll New Resident</span>
          </Link>
          <Link
            href="/vitals"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center space-x-2 border border-slate-300 dark:border-slate-700 shadow-xs hover:shadow hover:-translate-y-0.5 cursor-pointer"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Record Patient Vitals</span>
          </Link>
        </div>
      </div>

      {/* BHW Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="futuristic-kpi">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">Enrolled Residents</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1 block tabular-nums">{barangayResidents.length}</span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 block">Assigned in {user.barangay}</span>
        </div>

        <div className="futuristic-kpi">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">Vitals Recorded</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-sky-700 dark:text-sky-400 mt-1 block tabular-nums">{brgyVitals.length}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">Encounter History</span>
        </div>

        <div className="futuristic-kpi">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">Defaulter Doses</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 block tabular-nums">{defaulters.length}</span>
          <span className="text-[11px] text-rose-700 dark:text-rose-400 flex items-center space-x-1 font-semibold mt-1">
            <span>Pending Home Visits</span>
          </span>
        </div>

        <div className="futuristic-kpi">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-semibold">Active Maternal</span>
          <span className="text-2xl sm:text-3xl font-extrabold text-pink-600 dark:text-pink-400 mt-1 block tabular-nums">
            {barangayResidents.filter((r) => r.is_pregnant).length}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">Enrolled in 4-Visit Care</span>
        </div>
      </div>

      {/* Frontline Triage Screening Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 futuristic-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <h2 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
              <HeartPulse className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>BHW Rapid Vitals & Hemodynamic Screener</span>
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Intake Desk</span>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/80 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Resident Patient</label>
            <select
              value={selectedResidentId}
              onChange={(e) => setSelectedResidentId(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                min="40"
                max="300"
                value={sbp}
                onChange={(e) => setSbp(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                min="30"
                max="200"
                value={dbp}
                onChange={(e) => setDbp(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Body Temp (°C)</label>
              <input
                type="number"
                step="0.1"
                min="30"
                max="45"
                value={temp}
                onChange={(e) => setTemp(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="300"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={() => { setSbp(118); setDbp(76); setTemp(36.6); }}
              className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Normal
            </button>
            <button
              type="button"
              onClick={() => { setSbp(135); setDbp(85); setTemp(38.2); }}
              className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-medium transition-colors cursor-pointer"
            >
              Pre-HTN + Fever
            </button>
            <button
              type="button"
              onClick={() => { setSbp(190); setDbp(125); setTemp(37.1); }}
              className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/80 font-semibold text-[11px] transition-colors cursor-pointer"
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

        <div className="lg:col-span-6 futuristic-card p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
              <h2 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
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
              <div className="p-3 bg-slate-50/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Calculated BMI</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">{evalResult.bmi}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block font-medium">Nutritional Status</span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">{evalResult.nutritionalStatus}</span>
                </div>
              </div>

              {evalResult.referralRecommended ? (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2.5 shadow-xs">
                  <AlertOctagon className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-rose-900 dark:text-rose-100">IMMEDIATE RHU / HOSPITAL REFERRAL MANDATED</span>
                    <span>Blood pressure is in Hypertensive Crisis. Alert Midwife or Municipal Doctor immediately.</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl flex items-center space-x-2 p-3 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Vitals within acceptable community monitoring limits.</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            BHW Role Privilege: Allowed to record biometrics and register residents. Restricted from altering medical diagnoses.
          </div>
        </div>
      </div>

      {/* Pediatric Immunization Defaulter Outreach Queue */}
      <div className="futuristic-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Syringe className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Purok Immunization Defaulter Follow-up Queue
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Barangay {user.barangay} • Field Outreach
          </span>
        </div>

        {defaulters.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="font-medium text-slate-700 dark:text-slate-300">All infant immunization schedules are up to date in Barangay {user.barangay}.</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">No pending outreach visits required today.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {defaulters.map((d) => (
              <div key={`${d.residentId}-${d.overdueVaccineCode}`} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{d.residentName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {d.purok}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                      {d.overdueVaccineName} Overdue
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Age: <span className="font-medium">{d.ageMonths} mos ({d.ageWeeks} wks)</span> • Overdue:{' '}
                    <strong className="text-rose-700 dark:text-rose-400">{d.weeksOverdue} weeks</strong>
                  </div>
                  {visitedInfants[d.residentId] && (
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center space-x-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{visitedInfants[d.residentId]}</span>
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLogHomeVisit(d.residentId)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs hover:shadow transition-all cursor-pointer"
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
      <div className="futuristic-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Assigned Residents Directory • Barangay {user.barangay}
            </h3>
          </div>
          <Link
            href="/residents"
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-semibold"
          >
            Open Full Directory &rarr;
          </Link>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {barangayResidents.map((r) => (
            <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{r.first_name} {r.last_name}</span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">{r.id}</span>
                  {r.is_pregnant && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-100 dark:bg-pink-950/80 text-pink-700 dark:text-pink-300 font-semibold">
                      Pregnant
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {r.purok} • PhilHealth: {r.philhealth_id || 'None'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedResidentId(r.id);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
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
