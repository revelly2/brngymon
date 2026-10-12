'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/context/auth-context';
import { Resident, MaternalRecord, AntenatalVisit } from '@/types/database';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { ClinicalService } from '@/lib/services/clinical-service';
import { calculateGestationalAgeWeeks, calculateNaegeleEDD } from '@/lib/validations/clinical';
import {
  Heart,
  Baby,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function MaternalHealthPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [maternalRecords, setMaternalRecords] = useState<MaternalRecord[]>([]);
  const [visits, setVisits] = useState<AntenatalVisit[]>([]);

  // Enrollment modal/form state
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [gravida, setGravida] = useState(1);
  const [para, setPara] = useState(0);
  const [fullTerm, setFullTerm] = useState(0);
  const [preterm, setPreterm] = useState(0);
  const [abortion, setAbortion] = useState(0);
  const [living, setLiving] = useState(0);
  const [lmp, setLmp] = useState('2025-09-01');

  useEffect(() => {
    const res = ResidentRegistryService.getResidents();
    setResidents(res);
    setMaternalRecords(ClinicalService.getMaternalRecords());
    setVisits(ClinicalService.getAntenatalVisits());
  }, []);

  const eligibleWomen = residents.filter(
    (r) => r.biological_sex === 'female' && (r.is_pregnant || !maternalRecords.some((m) => m.resident_id === r.id))
  );

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) return;

    const patient = residents.find((r) => r.id === selectedResidentId);
    const birthYear = patient ? parseInt(patient.date_of_birth.split('-')[0], 10) : 1995;
    const residentAge = Math.max(0, 2026 - birthYear);

    const enrolled = ClinicalService.enrollMaternalPatient({
      residentId: selectedResidentId,
      gravida,
      para,
      fullTerm,
      preterm,
      abortion,
      livingChildren: living,
      lmp,
      residentAge,
      recordedByUserId: user.id,
    });

    if (enrolled.success) {
      setMaternalRecords(ClinicalService.getMaternalRecords());
      setShowEnrollForm(false);
    }
  };

  const getPatient = (resId: string) => residents.find((r) => r.id === resId);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Baby className="w-5 h-5 text-pink-600" />
              <span>Maternal Health & Antenatal Care Pathways</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              4-visit DOH antenatal milestone monitoring, Naegele&apos;s EDD calculations, and high-risk pregnancy triage.
            </p>
          </div>

          <button
            onClick={() => setShowEnrollForm(!showEnrollForm)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-xs font-semibold text-white transition-colors shadow-xs shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showEnrollForm ? 'Close Enrollment' : 'Enroll Maternal Patient'}</span>
          </button>
        </div>

        {/* Enrollment Drawer / Form */}
        {showEnrollForm && (
          <form onSubmit={handleEnroll} className="bg-white border border-pink-200 rounded-xl p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold text-pink-700 uppercase tracking-wider">
              New Obstetric & Antenatal Intake (Naegele&apos;s Rule)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Pregnant Resident *</label>
                <select
                  required
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 shadow-2xs"
                >
                  <option value="">-- Choose female resident --</option>
                  {eligibleWomen.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.first_name} {w.last_name} ({w.upi}) • Brgy. {w.barangay}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Menstrual Period (LMP) *</label>
                <input
                  type="date"
                  required
                  value={lmp}
                  onChange={(e) => setLmp(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-pink-500 shadow-2xs"
                />
                {lmp && (
                  <span className="text-[11px] text-pink-700 font-medium block mt-1">
                    Projected EDD: <strong>{calculateNaegeleEDD(lmp)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Obstetric History (GP - TPAL) */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Gravida (G)</label>
                <input
                  type="number"
                  min="1"
                  value={gravida}
                  onChange={(e) => setGravida(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Para (P)</label>
                <input
                  type="number"
                  min="0"
                  value={para}
                  onChange={(e) => setPara(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Full-Term (T)</label>
                <input
                  type="number"
                  min="0"
                  value={fullTerm}
                  onChange={(e) => setFullTerm(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Preterm (P)</label>
                <input
                  type="number"
                  min="0"
                  value={preterm}
                  onChange={(e) => setPreterm(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Abortion (A)</label>
                <input
                  type="number"
                  min="0"
                  value={abortion}
                  onChange={(e) => setAbortion(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Living Children (L)</label>
                <input
                  type="number"
                  min="0"
                  value={living}
                  onChange={(e) => setLiving(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-900"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-xs font-semibold text-white shadow-xs"
              >
                Save Maternal Record
              </button>
            </div>
          </form>
        )}

        {/* Active Maternal Cohort Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enrolled Pregnant Mothers ({maternalRecords.length})
            </h2>
            <span className="text-xs text-pink-700 font-semibold">Target: 100% 4-Antenatal Visits</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {maternalRecords.map((m) => {
              const patient = getPatient(m.resident_id);
              const patientVisits = visits.filter((v) => v.maternal_record_id === m.id);
              const gaWeeks = calculateGestationalAgeWeeks(m.lmp);

              return (
                <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 hover:border-pink-300 transition-colors shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-base">
                          {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-pink-50 border border-pink-200 text-pink-700 font-semibold">
                          {patient?.upi}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Brgy. {patient?.barangay} • {patient?.purok}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block font-medium">Gestational Age</span>
                      <span className="text-sm font-bold text-emerald-700">{gaWeeks} Weeks</span>
                    </div>
                  </div>

                  {/* Obstetric Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Gravida / Para</span>
                      <span className="font-semibold text-slate-900">G{m.gravida} P{m.para}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">TPAL Profile</span>
                      <span className="font-semibold text-slate-900 font-mono">{m.full_term}-{m.preterm}-{m.abortion}-{m.living_children}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-medium">Expected Delivery</span>
                      <span className="font-semibold text-pink-700 font-mono">{m.edd}</span>
                    </div>
                  </div>

                  {/* High Risk Flags */}
                  {m.high_risk_flags.length > 0 ? (
                    <div className="p-2.5 rounded bg-rose-50 border border-rose-200 flex items-center space-x-2 text-rose-800 text-xs font-medium">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>High Risk: {m.high_risk_flags.join(', ')}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-700 bg-emerald-50/60 border border-emerald-200 rounded p-2 flex items-center space-x-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Standard low-risk pregnancy pathway</span>
                    </div>
                  )}

                  {/* 4-Visit Progress Tracker */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">Antenatal Milestone Progress</span>
                      <span className="text-pink-700 font-semibold">{patientVisits.length} / 4 Visits Logged</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((vNum) => {
                        const visitDone = patientVisits.some((v) => v.visit_number === vNum);
                        return (
                          <div
                            key={vNum}
                            className={`p-2 rounded text-center text-[10px] font-semibold border ${
                              visitDone
                                ? 'bg-pink-50 border-pink-300 text-pink-800'
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}
                          >
                            <span>Visit {vNum}</span>
                            <div className="text-[9px] font-normal mt-0.5">
                              {visitDone ? 'Completed' : 'Pending'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
