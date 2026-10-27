'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { useTheme } from '@/lib/context/theme-context';
import { BarangayCode } from '@/types/database';
import { MedicalTeamVector } from '@/components/vectors/medical-team-vector';
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Sun,
  Moon,
  Stethoscope,
  Baby,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [selectedBarangay, setSelectedBarangay] = useState<BarangayCode>('PALAQUIO');
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your Employee ID or official government email');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your security password or station PIN');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await login({
        email: identifier.trim(),
        employeeId: identifier.trim(),
        password: password.trim(),
        barangay: selectedBarangay,
      });
      if (res.success) {
        router.push('/');
      } else {
        setErrorMessage(res.error || 'Invalid employee credentials. Please verify your official account.');
      }
    } catch {
      setErrorMessage('Authentication error occurred. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      {/* Top Government Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-full border-2 border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-800 shadow-xs overflow-hidden flex items-center justify-center p-0.5 shrink-0">
            <Image
              src="/bucay-logo.png"
              alt="Municipality of Bucay Official Seal"
              width={42}
              height={42}
              className="object-contain rounded-full"
              priority
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                BHSMS
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                Municipality of Bucay • DOH
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Barangay Health Status Monitoring System • Abra Pilot
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Night Mode Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Day Shift Mode' : 'Switch to Night Shift Mode'}
            className="p-2 rounded-xl border transition-all duration-200 flex items-center justify-center text-xs font-semibold shadow-2xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-400"
            aria-label="Toggle Night Mode Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
            <span className="hidden sm:inline ml-1.5 text-[11px] font-mono">
              {theme === 'dark' ? 'Night Shift' : 'Day Shift'}
            </span>
          </button>

          <div className="hidden md:flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>RA 10173 DPA Compliant</span>
          </div>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="max-w-6xl mx-auto w-full my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Medical Team Vector & Operational Showcase */}
        <section className="lg:col-span-7 flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Rural Health Unit Primary Care Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Community Health Informatics & Triage Station
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
              Empowering frontline Barangay Health Workers, Public Health Midwives, and Municipal Doctors with
              real-time vitals triage, maternal-infant tracking, and offline-first health record synchronization.
            </p>
          </div>

          {/* Pure SVG Vector Illustration Card */}
          <div className="futuristic-card accent-line-emerald p-6 sm:p-7 overflow-hidden bg-gradient-to-br from-emerald-50/60 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/20">
            <MedicalTeamVector className="w-full h-auto max-h-[320px] mx-auto drop-shadow-sm" />

            {/* Triad Duty Station Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 pt-5 border-t border-slate-200/70 dark:border-slate-800 text-xs">
              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/40 shadow-2xs">
                <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-blue-900 dark:text-blue-300 text-[11px]">MHO Physician</div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-400">Clinical Triage & Rx</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-pink-50/80 dark:bg-pink-950/40 border border-pink-200/70 dark:border-pink-900/40 shadow-2xs">
                <Baby className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0" />
                <div>
                  <div className="font-bold text-pink-900 dark:text-pink-300 text-[11px]">Midwife & Nurse</div>
                  <div className="text-[10px] text-pink-700 dark:text-pink-400">MCH & EPI Vaccines</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/40 shadow-2xs">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 text-[11px]">Frontline BHW</div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Purok Vitals & Intake</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Authentication Duty Card */}
        <section className="lg:col-span-5 futuristic-card p-6 sm:p-8 space-y-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Official Duty Station Authentication</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Health Personnel Sign-in
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your official municipal credentials to authenticate your duty station.
            </p>
          </div>

          {/* Error Notification */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-start space-x-2.5 text-red-800 dark:text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Official Credentials Form */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Barangay Health Station / Deployment Zone
              </label>
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value as BarangayCode)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="PALAQUIO">Barangay Palaquio BHS (Pilot Zone 1)</option>
                <option value="TABIOG">Barangay Tabiog BHS / RHU (Pilot Zone 2)</option>
                <option value="BABANGCAG">Barangay Babangcag BHS (Pilot Zone 3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Employee ID or Government Email
              </label>
              <input
                type="text"
                placeholder="e.g. EMP-001 or official email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Security Password / Station PIN
              </label>
              <input
                type="password"
                placeholder="Enter security password or station PIN"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Official Credentials...' : 'Authenticate & Open Station Desk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security & Regulatory Footer Note */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start space-x-2 text-[10.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>RA 10173 DPA Protected:</strong> Access to patient Protected Health Information (PHI) is
              strictly audited. All station timestamps are recorded.
            </p>
          </div>
        </section>
      </main>

      {/* Municipal Footer */}
      <footer className="max-w-6xl mx-auto w-full text-center text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-2">
        <Image
          src="/bucay-logo.png"
          alt="Bucay Official Seal"
          width={18}
          height={18}
          className="object-contain rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        />
        <p>Republic of the Philippines • Province of Abra • Municipality of Bucay • Rural Health Unit (RHU)</p>
      </footer>
    </div>
  );
}
