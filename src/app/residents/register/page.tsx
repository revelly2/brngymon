'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/context/auth-context';
import { BarangayCode, BiologicalSex } from '@/types/database';
import { ResidentRegistryService } from '@/lib/services/resident-service';
import { generateResidentDedupKey, generateSoundex } from '@/lib/validations/clinical';
import {
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Search,
} from 'lucide-react';
import Link from 'next/link';

export default function RegisterResidentPage() {
  const router = useRouter();
  const { user, canRegisterResidents } = useAuth();

  const [barangay, setBarangay] = useState<BarangayCode>(user.barangay);
  const [purok, setPurok] = useState('Purok 1');
  const [householdNumber, setHouseholdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [suffix, setSuffix] = useState('');
  const [alias, setAlias] = useState('');
  const [dob, setDob] = useState('1995-01-01');
  const [sex, setSex] = useState<BiologicalSex>('female');
  const [civilStatus, setCivilStatus] = useState<'single' | 'married' | 'widowed' | 'separated' | 'cohabiting'>('single');
  const [contactNumber, setContactNumber] = useState('');
  const [philhealthId, setPhilhealthId] = useState('');
  const [isPregnant, setIsPregnant] = useState(false);
  const [hasConsent, setHasConsent] = useState(true);

  const [dupResult, setDupResult] = useState<{ hasExactMatch: boolean; hasPhoneticMatch: boolean; matches: any[] }>({
    hasExactMatch: false,
    hasPhoneticMatch: false,
    matches: [],
  });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live deduplication check
  useEffect(() => {
    if (lastName.trim().length >= 2 && firstName.trim().length >= 1 && dob) {
      const result = ResidentRegistryService.checkForDuplicates(lastName, firstName, dob);
      setDupResult(result);
    } else {
      setDupResult({ hasExactMatch: false, hasPhoneticMatch: false, matches: [] });
    }
  }, [lastName, firstName, dob]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!canRegisterResidents) {
      setStatusMessage({
        type: 'error',
        text: 'Access Denied: Your current role does not have authorization to register residents.',
      });
      return;
    }

    if (!hasConsent) {
      setStatusMessage({
        type: 'error',
        text: 'Patient informed consent is legally required under the Data Privacy Act of 2012 before recording PHI.',
      });
      return;
    }

    const reg = ResidentRegistryService.registerResident({
      barangay,
      purok,
      householdNumber,
      firstName,
      middleName,
      lastName,
      suffix,
      alias,
      dateOfBirth: dob,
      biologicalSex: sex,
      civilStatus,
      contactNumber,
      philhealthId,
      isPregnant,
    });

    if (!reg.success) {
      setStatusMessage({
        type: 'error',
        text: reg.error || 'Failed to register resident.',
      });
    } else {
      setStatusMessage({
        type: 'success',
        text: `Resident enrolled successfully! Assigned UPI: ${reg.resident?.upi}`,
      });
      setTimeout(() => {
        router.push('/residents');
      }, 1500);
    }
  };

  const currentSoundex = lastName ? generateSoundex(lastName) : '----';
  const calculatedAge = dob ? 2026 - parseInt(dob.split('-')[0], 10) : null;

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/residents"
            className="inline-flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Resident Registry</span>
          </Link>
          <div className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>RA 10173 DPA Protected Form</span>
          </div>
        </div>

        {/* Header Banner */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-start justify-between shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Resident Demographic Intake & Profiling</span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Barangay Health Station intake form for pilot communities in Bucay, Abra.
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-500 dark:text-slate-400 block font-medium">Active Intake Officer</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{user.name}</span>
          </div>
        </div>

        {/* Live Deduplication Warning Banner */}
        {dupResult.hasExactMatch && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-900 dark:text-rose-200 flex items-start space-x-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-sm block text-rose-900 dark:text-rose-100">DUPLICATE PATIENT DETECTED (Soundex Match)</span>
              <p>
                A patient matching this Soundex phonetic hash and birthdate is already recorded in the system:
              </p>
              <ul className="list-disc pl-5 mt-1 font-mono text-rose-800 dark:text-rose-300">
                {dupResult.matches.map((m, idx) => (
                  <li key={idx}>
                    {m.first_name} {m.last_name} ({m.upi}) • Brgy. {m.barangay} • Born: {m.date_of_birth}
                  </li>
                ))}
              </ul>
              <p className="text-rose-700 dark:text-rose-400 pt-1 font-semibold">
                Please verify existing medical folders before creating a duplicate entry.
              </p>
            </div>
          </div>
        )}

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center space-x-2 shadow-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/80 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-900 dark:text-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* Intake Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-xs">
          {/* Section 1: Locality & Household */}
          <div>
            <h2 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-3">
              1. Residence & Household Identification
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Barangay</label>
                <select
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value as BarangayCode)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-2xs"
                >
                  <option value="PALAQUIO">Barangay Palaquio</option>
                  <option value="TABIOG">Barangay Tabiog</option>
                  <option value="BABANGCAG">Barangay Babangcag</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sitio / Purok</label>
                <input
                  type="text"
                  required
                  value={purok}
                  onChange={(e) => setPurok(e.target.value)}
                  placeholder="e.g. Purok 1, Sitio Riverside"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Household No. (Optional)</label>
                <input
                  type="text"
                  value={householdNumber}
                  onChange={(e) => setHouseholdNumber(e.target.value)}
                  placeholder="e.g. HH-2026-042"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal Demographics */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                2. Resident Personal Information
              </h2>
              {lastName && (
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  Phonetic Hash: <strong className="text-emerald-700 dark:text-emerald-400">{currentSoundex}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Maria"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. Santos"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Dela Cruz"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Suffix (Jr/Sr/III)</label>
                <input
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="e.g. Jr."
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
                {calculatedAge !== null && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block font-medium">
                    Calculated Age: <strong className="text-emerald-700 dark:text-emerald-400">{calculatedAge} years old</strong>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Biological Sex *</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value as BiologicalSex)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-2xs"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Civil Status</label>
                <select
                  value={civilStatus}
                  onChange={(e) => setCivilStatus(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 shadow-2xs"
                >
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                  <option value="cohabiting">Cohabiting / Common-Law</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Alias / Known As</label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. Mayang"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Health Insurance & Pregnancy Flag */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5">
            <h2 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-3">
              3. Identifiers & Clinical Categorization
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">PhilHealth ID No.</label>
                <input
                  type="text"
                  value={philhealthId}
                  onChange={(e) => setPhilhealthId(e.target.value)}
                  placeholder="XX-XXXXXXXXX-X"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Mobile Number</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="09XXXXXXXXX"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center pt-6">
                <label className="inline-flex items-center space-x-2 text-xs cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={isPregnant}
                    onChange={(e) => setIsPregnant(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">Currently Pregnant (Enrolls in Maternal Pathway)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section 4: DPA Consent Compliance */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
              <input
                type="checkbox"
                id="consentCheck"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="consentCheck" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer leading-relaxed">
                <strong className="text-slate-900 dark:text-slate-100 font-semibold">Informed Consent Documented (RA 10173):</strong> The resident or authorized guardian has provided informed consent for the collection and processing of health information for local primary care and epidemiological monitoring within the Barangay Health Station.
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-5 flex items-center justify-end space-x-3">
            <Link
              href="/residents"
              className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors border border-slate-300 dark:border-slate-700 shadow-2xs"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={dupResult.hasExactMatch}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-xs font-semibold text-white transition-colors flex items-center space-x-2 shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll Resident</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
