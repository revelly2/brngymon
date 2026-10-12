'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { UserRole } from '@/types/database';
import {
  HeartPulse,
  Users,
  UserPlus,
  Activity,
  Baby,
  Syringe,
  BarChart3,
  ClipboardCheck,
  MonitorCheck,
  Menu,
  X,
  ChevronDown,
  Stethoscope,
  AlertOctagon,
  Building,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

function getInitials(name: string): string {
  const clean = name.replace(/^(Dr\.|Hon\.)\s*/i, '').replace(/\(.*?\)/g, '').replace(/,/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || 'US').toUpperCase();
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const ROLE_NAV_CONFIG: Record<UserRole, { title: string; links: NavItem[] }> = {
  bhw: {
    title: 'BHW Frontline Station',
    links: [
      { href: '/', label: 'BHW Duty Station', icon: Activity },
      { href: '/residents', label: 'Resident Profiling', icon: Users },
      { href: '/residents/register', label: 'New Intake', icon: UserPlus },
      { href: '/vitals', label: 'Hemodynamic Screener', icon: HeartPulse },
      { href: '/immunizations', label: 'Immunization Defaulters', icon: Syringe },
    ],
  },
  nurse: {
    title: 'Midwife & Nurse Desk',
    links: [
      { href: '/', label: 'Midwife Station', icon: Baby },
      { href: '/maternal', label: 'Maternal Care (ANC)', icon: Baby },
      { href: '/immunizations', label: 'Child EPI & Cold Chain', icon: Syringe },
      { href: '/residents', label: 'MCH Patient Records', icon: Users },
      { href: '/vitals', label: 'Clinical Vitals', icon: HeartPulse },
      { href: '/reports/referral', label: 'Referral Slips (RF-1)', icon: FileSpreadsheet },
    ],
  },
  doctor: {
    title: 'MHO Physician Command',
    links: [
      { href: '/', label: 'Clinical Command Desk', icon: Stethoscope },
      { href: '/vitals', label: 'Urgent Triage Queue', icon: AlertOctagon },
      { href: '/residents', label: 'Patient Medical Charts', icon: Users },
      { href: '/reports/referral', label: 'Hospital Referrals', icon: FileSpreadsheet },
      { href: '/analytics', label: 'Morbidity Surveillance', icon: BarChart3 },
    ],
  },
  lgu_viewer: {
    title: 'LGU Executive Governance',
    links: [
      { href: '/', label: 'Executive Health Overview', icon: Building },
      { href: '/analytics', label: 'FHSIS Morbidity Profiles', icon: BarChart3 },
      { href: '/operations', label: 'Station Readiness & Assets', icon: MonitorCheck },
    ],
  },
  admin: {
    title: 'System Administration',
    links: [
      { href: '/', label: 'Admin Console', icon: ShieldCheck },
      { href: '/operations', label: 'Workstation Diagnostics & Backup', icon: MonitorCheck },
      { href: '/evaluation', label: 'UAT & System Evaluation', icon: ClipboardCheck },
      { href: '/analytics', label: 'Municipal Analytics', icon: BarChart3 },
      { href: '/residents', label: 'Master Patient Registry', icon: Users },
    ],
  },
};

const ROLE_BADGE_STYLES: Record<UserRole, { badge: string; avatar: string; border: string }> = {
  bhw: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    avatar: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    border: 'focus:border-emerald-600 focus:ring-emerald-600',
  },
  nurse: {
    badge: 'bg-pink-50 text-pink-800 border-pink-200',
    avatar: 'bg-pink-100 border-pink-300 text-pink-800',
    border: 'focus:border-pink-600 focus:ring-pink-600',
  },
  doctor: {
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
    avatar: 'bg-blue-100 border-blue-300 text-blue-800',
    border: 'focus:border-blue-600 focus:ring-blue-600',
  },
  lgu_viewer: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    avatar: 'bg-amber-100 border-amber-300 text-amber-800',
    border: 'focus:border-amber-600 focus:ring-amber-600',
  },
  admin: {
    badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    avatar: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    border: 'focus:border-indigo-600 focus:ring-indigo-600',
  },
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, setRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentRoleNav = ROLE_NAV_CONFIG[user.role] || ROLE_NAV_CONFIG.bhw;
  const currentStyles = ROLE_BADGE_STYLES[user.role] || ROLE_BADGE_STYLES.bhw;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header - Pinned at top */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200/90 shadow-2xs">
        {/* Tier 1: System, Station Context & User Identity */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Branding & Pilot Station */}
            <Link href="/" className="flex items-center space-x-3 group shrink-0">
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors shadow-2xs">
                <HeartPulse className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base text-slate-900 tracking-tight">BHSMS</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Abra Pilot
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Lagangilang Health Network</span>
              </div>
            </Link>

            {/* Right: Station Status, User Identity Pill & Role Switcher */}
            <div className="flex items-center space-x-3 shrink-0">
              {/* Online Sync Indicator */}
              <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200/70 text-[11px] text-emerald-700 font-medium shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>RHU Sync Active</span>
              </div>

              {/* User Identity Capsule with Role Styling */}
              <div className="hidden sm:flex items-center space-x-2.5 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 shrink-0 shadow-2xs">
                <div className={`w-8 h-8 rounded-full border font-bold text-xs flex items-center justify-center shrink-0 ${currentStyles.avatar}`}>
                  {getInitials(user.name)}
                </div>
                <div className="flex flex-col text-left shrink-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-900 whitespace-nowrap leading-tight">
                      {user.name}
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full border ${currentStyles.badge}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono font-medium whitespace-nowrap leading-tight mt-0.5">
                    Barangay {user.barangay}
                  </div>
                </div>
              </div>

              {/* Role Switcher Select */}
              <div className="relative shrink-0">
                <select
                  value={user.role}
                  aria-label="Active Clinical / Administrative Role"
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className={`bg-white border border-slate-300 text-xs font-medium rounded-lg pl-3 pr-8 py-2 text-slate-800 focus:outline-none focus:ring-1 shadow-2xs cursor-pointer appearance-none ${currentStyles.border}`}
                >
                  <option value="bhw">BHW (Intake Staff)</option>
                  <option value="nurse">Midwife / Nurse</option>
                  <option value="doctor">MHO Physician</option>
                  <option value="lgu_viewer">LGU Official (Read Only)</option>
                  <option value="admin">System Admin</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Dedicated Role-Specific Module Navigation Bar */}
        <div className="border-t border-slate-200/70 bg-slate-50/60 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="h-11 flex items-center justify-between overflow-x-auto no-scrollbar">
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mr-2 shrink-0">
                  {currentRoleNav.title}
                </span>

                {currentRoleNav.links.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                        isActive
                          ? 'bg-white text-emerald-800 border border-emerald-300/80 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
              {currentRoleNav.title}
            </div>
            {currentRoleNav.links.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-emerald-600" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p>Republic of the Philippines • Department of Health (DOH) & RA 10173 DPA Compliant</p>
      </footer>
    </div>
  );
}
