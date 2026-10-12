'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';
import { calculateNaegeleEDD, calculateGestationalAgeWeeks } from '@/lib/validations/clinical';
import {
  Baby,
  Syringe,
  CalendarCheck,
  AlertTriangle,
  HeartPulse,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Search,
} from 'lucide-react';

export function MidwifeDashboard() {
  const { user } = useAuth();
  const residents = ResidentRegistryService.getResidents();
  const maternalRecords = ClinicalService.getMaternalRecords();
  const antenatalVisits = ClinicalService.getAntenatalVisits();
  const immunizations = ClinicalService.getImmunizations();

  // Local state for Quick EDD / Gestational Age Calculator
  const [testLmp, setTestLmp] = useState<string>('2025-08-15');
  const [calcEdd, setCalcEdd] = useState<string>(() => calculateNaegeleEDD('2025-08-15'));
  const [calcGaWeeks, setCalcGaWeeks] = useState<number>(() => calculateGestationalAgeWeeks('2025-08-15'));

  const handleLmpChange = (newVal: string) => {
    setTestLmp(newVal);
    if (newVal) {
      try {
        setCalcEdd(calculateNaegeleEDD(newVal));
        setCalcGaWeeks(calculateGestationalAgeWeeks(newVal));
      } catch {
        // invalid date format
      }
    }
  };

  // Filter maternal records for the current station/barangay
  const barangayMaternal = maternalRecords.filter((m) => {
    const res = residents.find((r) => r.id === m.resident_id);
    return res?.barangay === user.barangay;
  });

  // Calculate 4-visit compliance
  const compliantCount = barangayMaternal.filter((m) => {
    const visits = antenatalVisits.filter((v) => v.maternal_record_id === m.id);
    return visits.length >= 4;
  }).length;

  // High-risk pregnancies
  const highRiskCount = barangayMaternal.filter((m) => m.high_risk_flags.length > 0).length;

  // Pediatric defaulter outreach for station
  const barangayInfants = residents
    .filter((r) => {
      const birthYear = parseInt(r.date_of_birth.split('-')[0], 10);
      return 2026 - birthYear < 5 && r.barangay === user.barangay;
    })
    .map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      barangay: c.barangay,
      purok: c.purok,
      dateOfBirth: c.date_of_birth,
    }));
  const defaulters = ClinicalService.computeDefaulters(barangayInfants, immunizations);

  // State for interactive clinical encounters
  const [extraVisits, setExtraVisits] = useState<Record<string, number>>({});
  const [administeredVaccineKeys, setAdministeredVaccineKeys] = useState<Set<string>>(new Set());
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleRecordAntenatalVisit = (maternalId: string, residentName: string) => {
    setExtraVisits((prev) => ({
      ...prev,
      [maternalId]: (prev[maternalId] || 0) + 1,
    }));
    setSuccessToast(`Antenatal visit recorded for ${residentName}. Fundic height and fetal heart tone documented.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleAdministerVaccine = (key: string, childName: string, vaccineName: string) => {
    setAdministeredVaccineKeys((prev) => new Set([...prev, key]));
    setSuccessToast(`Dose administered: ${vaccineName} logged for ${childName}. Cold-chain batch recorded.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Active defaulters minus freshly administered doses
  const activeDefaulters = defaulters.filter(
    (d) => !administeredVaccineKeys.has(`${d.residentId}-${d.overdueVaccineCode}`)
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-50/90 via-white to-rose-50/70 border border-pink-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200 text-xs font-semibold">
            <Baby className="w-3.5 h-3.5" />
            <span>Maternal & Child Health (MCH) Desk • Barangay {user.barangay}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Public Health Midwife / Nurse Station</h1>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Welcome, <strong>{user.name}</strong>. Responsible for clinical antenatal tracking (DOH 4-Visit Standard), Naegele gestational age calculations, high-risk obstetric screening, and pediatric Expanded Program on Immunization (EPI) defaulter surveillance.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <Link
            href="/maternal"
            className="px-4 py-2.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-xs"
          >
            <Baby className="w-4 h-4" />
            <span>Enroll Prenatal Patient</span>
          </Link>
          <Link
            href="/immunizations"
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-2 border border-slate-300 shadow-2xs"
          >
            <Syringe className="w-4 h-4" />
            <span>Administer EPI Vaccine</span>
          </Link>
        </div>
      </div>

      {successToast && (
        <div className="p-3.5 bg-pink-50 border border-pink-200 rounded-xl text-pink-800 text-xs flex items-center space-x-2 font-medium shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-pink-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Midwife Clinical KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Pregnancies</span>
            <Baby className="w-4 h-4 text-pink-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{barangayMaternal.length}</div>
          <div className="text-[11px] text-pink-700 mt-1 font-medium">Under active monitoring</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">High-Risk Obstetric</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{highRiskCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Requires MD consultation</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">ANC 4-Visit Target</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">
            {barangayMaternal.length > 0
              ? `${Math.round(((compliantCount + Object.keys(extraVisits).length) / barangayMaternal.length) * 100)}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">On Track for PhilHealth Konsulta</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">EPI Defaulters</span>
            <Syringe className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{activeDefaulters.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending outreach doses</div>
        </div>
      </div>

      {/* Main Grid: Clinical Tools & Antenatal Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Naegele Calculator & Vaccine Cold-Chain */}
        <div className="lg:col-span-5 space-y-6">
          {/* Naegele Rule Gestational Age Calculator */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <CalendarCheck className="w-4 h-4 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">Naegele Obstetric Calculator</h3>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200 font-mono font-medium">
                LMP + 7d - 3mo + 1yr
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Last Menstrual Period (LMP)
              </label>
              <input
                type="date"
                value={testLmp}
                onChange={(e) => handleLmpChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs font-mono focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 shadow-2xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Estimated Delivery Date</div>
                <div className="text-base font-bold text-pink-700 font-mono mt-1">{calcEdd}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Full 40 Weeks</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-center">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Gestational Age</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-1">{calcGaWeeks} Wks</div>
                <div className="text-[10px] text-emerald-700 mt-0.5 font-semibold">
                  {calcGaWeeks < 13 ? 'Trimester 1' : calcGaWeeks < 27 ? 'Trimester 2' : 'Trimester 3'}
                </div>
              </div>
            </div>

            <div className="p-3 bg-pink-50/60 border border-pink-200/80 rounded-lg text-[11px] text-slate-700 space-y-1">
              <div className="font-semibold text-pink-800">DOH ANC Visit Cadence:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                <li>Visit 1: As early as possible in 1st Trimester (&lt; 14 weeks)</li>
                <li>Visit 2: 2nd Trimester (14-27 weeks)</li>
                <li>Visits 3 & 4: 3rd Trimester (28-40 weeks)</li>
              </ul>
            </div>
          </div>

          {/* Cold Chain Vaccine Storage Health */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 text-slate-900">
                <Syringe className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">BHS Vaccine Cold Chain Monitor</h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Optimal
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-600 font-medium">BHS Refrigerator Temp:</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">4.2°C (2°C - 8°C window)</span>
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              Vaccine potency assured for Pentavalent, OPV, and Measles-Rubella vials at Barangay {user.barangay} Health Station.
            </div>
          </div>

          {/* Quick Referral Sign-off */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2 text-slate-900">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Clinical Referral Abstract (BHSMS-RF1)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generate standardized 1-page clinical referral slips for patients requiring higher-level obstetrical management or physician consultation at the Municipal Health Office.
            </p>
            <Link
              href="/reports/referral"
              className="inline-flex items-center space-x-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <span>Open BHSMS-RF1 Referral Generator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Antenatal Line-List & EPI Defaulters */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Prenatal Patients Line-List */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Baby className="w-4 h-4 text-pink-600" />
                <h3 className="text-sm font-bold text-slate-900">Barangay {user.barangay} Antenatal Line-List</h3>
              </div>
              <Link
                href="/maternal"
                className="text-xs text-pink-700 hover:text-pink-800 transition-colors font-semibold"
              >
                View Full MCH Register &rarr;
              </Link>
            </div>

            {barangayMaternal.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No active antenatal records in Barangay {user.barangay}.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {barangayMaternal.map((m) => {
                  const res = residents.find((r) => r.id === m.resident_id);
                  const visits = antenatalVisits.filter((v) => v.maternal_record_id === m.id);
                  const totalVisits = visits.length + (extraVisits[m.id] || 0);
                  const ga = calculateGestationalAgeWeeks(m.lmp);
                  const resName = res ? `${res.first_name} ${res.last_name}` : 'Unknown Patient';

                  return (
                    <div key={m.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">
                            {resName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {res?.purok}
                          </span>
                          {m.high_risk_flags.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                              HIGH RISK
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-600">
                          EDD: <strong className="text-slate-800 font-mono">{m.edd}</strong> • Gestational Age: <strong>{ga} Wks</strong> (Gravida {m.gravida}, Para {m.para})
                        </div>
                        {m.high_risk_flags.length > 0 && (
                          <div className="text-[10px] text-rose-700 font-semibold">
                            Risk: {m.high_risk_flags.join(', ')}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-900 font-mono">
                            {totalVisits} / 4 Visits
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                              totalVisits >= 4
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {totalVisits >= 4 ? 'Target Met' : 'Follow-up Due'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRecordAntenatalVisit(m.id, resName)}
                          className="px-2.5 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                        >
                          Log Visit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pediatric EPI Defaulters Alert */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Syringe className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">Pediatric Immunization Defaulters ({activeDefaulters.length})</h3>
              </div>
              <Link
                href="/immunizations"
                className="text-xs text-rose-700 hover:text-rose-800 transition-colors font-semibold"
              >
                Log Administered Doses &rarr;
              </Link>
            </div>

            {activeDefaulters.length === 0 ? (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>All eligible infants in Barangay {user.barangay} are up to date on DOH EPI schedule.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {activeDefaulters.slice(0, 4).map((d) => {
                  const key = `${d.residentId}-${d.overdueVaccineCode}`;
                  return (
                    <div key={key} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{d.residentName}</div>
                        <div className="text-[11px] text-slate-600">
                          {d.purok} • Age: {d.ageMonths} months
                        </div>
                        <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                          Overdue Dose: {d.overdueVaccineName} ({d.weeksOverdue} wks overdue)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdministerVaccine(key, d.residentName, d.overdueVaccineName)}
                        className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition-colors shadow-2xs cursor-pointer"
                      >
                        Administer Dose
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
