'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/context/auth-context';
import { Resident, BarangayCode } from '@/types/database';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  HeartPulse,
  Baby,
  Calendar,
  MapPin,
  FileText,
  BadgeCheck,
  Stethoscope,
} from 'lucide-react';
import { MedicalChartModal } from '@/components/clinical/medical-chart-modal';

export default function ResidentsDirectoryPage() {
  const { user, canRegisterResidents, hasModule } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState<string>('ALL');
  const [filterPregnant, setFilterPregnant] = useState(false);
  const [chartResident, setChartResident] = useState<Resident | null>(null);

  useEffect(() => {
    setResidents(ResidentRegistryService.getResidents());
  }, []);

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const parts = dob.split('-');
    const birthYear = parseInt(parts[0], 10);
    return Math.max(0, 2026 - birthYear);
  };

  const filtered = residents.filter((r) => {
    const fullName = `${r.first_name} ${r.middle_name || ''} ${r.last_name}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      fullName.includes(query) ||
      r.upi.toLowerCase().includes(query) ||
      (r.philhealth_id && r.philhealth_id.toLowerCase().includes(query)) ||
      r.purok.toLowerCase().includes(query);

    const matchesBarangay = selectedBarangay === 'ALL' || r.barangay === selectedBarangay;
    const matchesPregnant = !filterPregnant || r.is_pregnant;

    return matchesSearch && matchesBarangay && matchesPregnant;
  });

  // Demographics aggregates
  const totalCount = residents.length;
  const pregnantCount = residents.filter((r) => r.is_pregnant).length;
  const pediatricCount = residents.filter((r) => calculateAge(r.date_of_birth) < 5).length;
  const seniorCount = residents.filter((r) => calculateAge(r.date_of_birth) >= 60).length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Barangay Resident Registry</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Centralized demographic profiling and longitudinal tracking for Abra pilot health centers.
            </p>
          </div>

          {canRegisterResidents && (
            <Link
              href="/residents/register"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-xs shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Patient Intake</span>
            </Link>
          )}
        </div>

        {/* Aggregated Demographics KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Registered Residents</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">{totalCount}</span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Across 3 Pilot Barangays</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Active Maternal Cohort</span>
            <span className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-1 block">{pregnantCount}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Enrolled in 4-Visit Pathway</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Pediatric Cohort (&lt; 5 yrs)</span>
            <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mt-1 block">{pediatricCount}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">EPI Immunization Cohort</span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Senior Citizens (&ge; 60 yrs)</span>
            <span className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1 block">{seniorCount}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">NCD & Chronic Care Group</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, UPI, or Purok..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Pilot Barangays</option>
                <option value="PALAQUIO">Barangay Palaquio</option>
                <option value="TABIOG">Barangay Tabiog</option>
                <option value="BABANGCAG">Barangay Babangcag</option>
              </select>
            </div>

            <label className="inline-flex items-center space-x-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={filterPregnant}
                onChange={(e) => setFilterPregnant(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Maternal Only</span>
            </label>
          </div>
        </div>

        {/* Resident Registry Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="px-4 py-3">Patient UPI</th>
                  <th className="px-4 py-3">Resident Name</th>
                  <th className="px-4 py-3">Age / Sex</th>
                  <th className="px-4 py-3">Barangay / Purok</th>
                  <th className="px-4 py-3">Clinical Cohorts</th>
                  <th className="px-4 py-3">PhilHealth ID</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      No matching resident profiles found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((resident) => {
                    const age = calculateAge(resident.date_of_birth);
                    const isSenior = age >= 60;
                    const isPediatric = age < 5;

                    return (
                      <tr key={resident.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                            {resident.upi}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {resident.first_name} {resident.middle_name ? `${resident.middle_name} ` : ''}
                            {resident.last_name}
                            {resident.suffix ? ` ${resident.suffix}` : ''}
                          </div>
                          {resident.alias && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Alias: &quot;{resident.alias}&quot;</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          <div>{age} yrs old</div>
                          <span className="text-[11px] capitalize text-slate-500 dark:text-slate-400">{resident.biological_sex}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{resident.barangay}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{resident.purok}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {resident.is_pregnant && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300">
                                Pregnant
                              </span>
                            )}
                            {isPediatric && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300">
                                Infant/Child
                              </span>
                            )}
                            {isSenior && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                                Senior
                              </span>
                            )}
                            {!resident.is_pregnant && !isPediatric && !isSenior && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                General Adult
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {resident.philhealth_id || <span className="text-slate-400 dark:text-slate-500">None</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {hasModule('patient_chart') && (
                              <button
                                type="button"
                                onClick={() => setChartResident(resident)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium transition-colors cursor-pointer"
                              >
                                <Stethoscope className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Chart</span>
                              </button>
                            )}
                            <Link
                              href="/"
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium transition-colors"
                            >
                              <HeartPulse className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Triage</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Longitudinal Medical Chart Modal */}
        <MedicalChartModal
          resident={chartResident}
          onClose={() => setChartResident(null)}
        />
      </div>
    </AppShell>
  );
}
