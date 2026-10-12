'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/context/auth-context';
import { Resident, ImmunizationRecord } from '@/types/database';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import {
  ClinicalService,
  DOH_EPI_SCHEDULE,
  DefaulterAlert,
} from '@/lib/services/clinical-service';
import {
  ShieldAlert,
  Syringe,
  CheckCircle2,
  Clock,
  Baby,
  AlertTriangle,
  UserCheck,
  Calendar,
  Search,
} from 'lucide-react';

export default function ImmunizationsPage() {
  const { user } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [immunizations, setImmunizations] = useState<ImmunizationRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'defaulters' | 'roster'>('defaulters');
  const [defaulters, setDefaulters] = useState<DefaulterAlert[]>([]);

  useEffect(() => {
    const allResidents = ResidentRegistryService.getResidents();
    setResidents(allResidents);
    const immRecords = ClinicalService.getImmunizations();
    setImmunizations(immRecords);

    // Filter pediatric cohort (< 5 years old)
    const pediatricCohort = allResidents
      .filter((r) => {
        const birthYear = parseInt(r.date_of_birth.split('-')[0], 10);
        return 2026 - birthYear < 5;
      })
      .map((child) => ({
        id: child.id,
        name: `${child.first_name} ${child.last_name}`,
        barangay: child.barangay,
        purok: child.purok,
        dateOfBirth: child.date_of_birth,
      }));

    const overdueList = ClinicalService.computeDefaulters(pediatricCohort, immRecords);
    setDefaulters(overdueList);
  }, []);

  const pediatricResidents = residents.filter((r) => {
    const birthYear = parseInt(r.date_of_birth.split('-')[0], 10);
    return 2026 - birthYear < 5;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Syringe className="w-5 h-5 text-cyan-600" />
              <span>Expanded Program on Immunization (EPI) Registry</span>
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Longitudinal infant vaccination tracking with automated chronological defaulter detection for BHW outreach.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-3 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-slate-500 block text-[10px] uppercase font-medium">Pediatric Cohort</span>
              <span className="text-cyan-700 font-bold text-base">{pediatricResidents.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-center">
              <span className="text-rose-700 block text-[10px] uppercase font-medium">Defaulter Doses</span>
              <span className="text-rose-700 font-bold text-base">{defaulters.length}</span>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('defaulters')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'defaulters'
                ? 'border-rose-600 text-rose-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Defaulter Line-List (Overdue Vaccines)</span>
            <span className="px-1.5 py-0.5 rounded-full bg-rose-100 border border-rose-200 text-[10px] text-rose-800 font-bold">
              {defaulters.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-3 border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'roster'
                ? 'border-cyan-600 text-cyan-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Baby className="w-4 h-4" />
            <span>Child Immunization Roster ({pediatricResidents.length})</span>
          </button>
        </div>

        {/* Tab 1: Defaulter Line-List Engine */}
        {activeTab === 'defaulters' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-900 text-xs shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-sm text-rose-900">Automated Defaulter Outreach Line-List</span>
                <p className="mt-0.5 text-rose-700 leading-relaxed">
                  The following infants have exceeded their chronological due date for standard EPI vaccines. Barangay Health Workers should conduct home visits in these Puroks to reschedule administration.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="px-4 py-3">Infant Name</th>
                      <th className="px-4 py-3">Barangay / Purok</th>
                      <th className="px-4 py-3">Chronological Age</th>
                      <th className="px-4 py-3">Missed Vaccine Dose</th>
                      <th className="px-4 py-3">Scheduled Target</th>
                      <th className="px-4 py-3">Delay Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {defaulters.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-emerald-700">
                          <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                          <span className="font-semibold">All registered infants are 100% up to date with the DOH EPI schedule!</span>
                        </td>
                      </tr>
                    ) : (
                      defaulters.map((d, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {d.residentName}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div className="font-medium text-slate-900">{d.barangay}</div>
                            <span className="text-[11px] text-slate-500">{d.purok}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <span className="font-mono font-medium">{d.ageWeeks} weeks</span>
                            <span className="text-[11px] text-slate-500 block font-medium">({d.ageMonths} mos)</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded font-mono font-semibold bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                              {d.overdueVaccineCode} - {d.overdueVaccineName}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono">
                            Due at {d.targetDueWeeks} wks
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-800">
                              {d.weeksOverdue} Weeks Overdue
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Child Roster & Full Vaccine Cards */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pediatricResidents.map((child) => {
                const childRecords = immunizations.filter((im) => im.resident_id === child.id);
                const birthYear = parseInt(child.date_of_birth.split('-')[0], 10);
                const ageYrs = 2026 - birthYear;

                return (
                  <div key={child.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-base">
                          {child.first_name} {child.last_name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          {child.barangay} • {child.purok} • Born: {child.date_of_birth}
                        </div>
                      </div>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 font-semibold">
                        {child.upi}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Administered Vaccines ({childRecords.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {childRecords.map((rec) => (
                          <span
                            key={rec.id}
                            className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-1 font-semibold"
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{rec.vaccine_code}</span>
                          </span>
                        ))}
                        {childRecords.length === 0 && (
                          <span className="text-xs text-slate-400">No vaccines recorded yet.</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
