'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import { useTheme } from '@/lib/context/theme-context';
import { UserRole, SystemModuleId } from '@/types/database';
import { getDefaultModulesForRole } from '@/lib/constants/modules';
import { useAdminTab, AdminTab } from '@/lib/context/admin-tab-context';
import {
  HeartPulse,
  Users,
  UserPlus,
  Activity,
  Baby,
  Syringe,
  BarChart3,
  MonitorCheck,
  Menu,
  X,
  ChevronDown,
  Stethoscope,
  AlertOctagon,
  Building,
  ShieldCheck,
  FileSpreadsheet,
  LogOut,
  LogIn,
  Sun,
  Moon,
  Home,
  CheckCircle2,
  Sparkles,
  Cloud,
  HardDrive,
} from 'lucide-react';

interface RoleBranchItem {
  id?: string;
  tabId?: AdminTab;
  href?: string;
  label: string;
  icon: React.ElementType;
  badgeText: string;
  moduleId?: SystemModuleId;
  isSpecial?: boolean;
}

function getRoleBranchModules(
  role: UserRole,
  hasModule: (moduleId: SystemModuleId) => boolean,
  hasSpecialChartAccess: boolean
): RoleBranchItem[] {
  if (role === 'admin') {
    return [
      {
        tabId: 'cloud_sync',
        label: 'Cloud Sync & Storage',
        icon: Cloud,
        badgeText: 'Live Sync',
      },
      {
        tabId: 'audit',
        label: 'Security Audit Logs (RA 10173)',
        icon: ShieldCheck,
        badgeText: 'Audit',
      },
      {
        tabId: 'users',
        label: 'Access Control (RBAC)',
        icon: Users,
        badgeText: 'Personnel',
      },
      {
        tabId: 'storage',
        label: 'Workstation Cache & Diag',
        icon: HardDrive,
        badgeText: 'Offline',
      },
    ];
  }

  const items: RoleBranchItem[] = [];

  if (role === 'nurse') {
    if (hasModule('maternal_care')) {
      items.push({
        href: '/maternal',
        label: 'Maternal Care (ANC)',
        icon: Baby,
        badgeText: 'ANC',
        moduleId: 'maternal_care',
      });
    }
    if (hasModule('immunization_epi')) {
      items.push({
        href: '/immunizations',
        label: 'Child EPI & Cold Chain',
        icon: Syringe,
        badgeText: 'EPI',
        moduleId: 'immunization_epi',
      });
    }
    if (hasModule('referral_management')) {
      items.push({
        href: '/reports/referral',
        label: 'Referral Slips (RF-1)',
        icon: FileSpreadsheet,
        badgeText: 'RF-1',
        moduleId: 'referral_management',
      });
    }
    if (hasModule('vitals_triage')) {
      items.push({
        href: '/vitals',
        label: 'Hemodynamic Screener',
        icon: HeartPulse,
        badgeText: 'Vitals',
        moduleId: 'vitals_triage',
      });
    }
    if (hasModule('resident_profiling')) {
      items.push({
        href: '/residents',
        label: hasSpecialChartAccess ? 'Patient Medical Charts' : 'Resident Profiling',
        icon: hasSpecialChartAccess ? Stethoscope : Users,
        badgeText: hasSpecialChartAccess ? 'Charts' : 'Census',
        moduleId: 'resident_profiling',
        isSpecial: hasSpecialChartAccess,
      });
    }
    if (hasModule('resident_intake')) {
      items.push({
        href: '/residents/register',
        label: 'New Patient Intake',
        icon: UserPlus,
        badgeText: 'Intake',
        moduleId: 'resident_intake',
      });
    }
  } else if (role === 'doctor') {
    if (hasModule('vitals_triage')) {
      items.push({
        href: '/vitals',
        label: 'Urgent Triage Queue',
        icon: AlertOctagon,
        badgeText: 'Triage',
        moduleId: 'vitals_triage',
      });
    }
    if (hasModule('resident_profiling') || hasModule('patient_chart')) {
      items.push({
        href: '/residents',
        label: 'Patient Medical Charts',
        icon: Stethoscope,
        badgeText: 'Charts',
        moduleId: 'resident_profiling',
      });
    }
    if (hasModule('maternal_care')) {
      items.push({
        href: '/maternal',
        label: 'Maternal Care (High-Risk)',
        icon: Baby,
        badgeText: 'ANC',
        moduleId: 'maternal_care',
      });
    }
    if (hasModule('immunization_epi')) {
      items.push({
        href: '/immunizations',
        label: 'Child EPI Vaccines',
        icon: Syringe,
        badgeText: 'EPI',
        moduleId: 'immunization_epi',
      });
    }
    if (hasModule('referral_management')) {
      items.push({
        href: '/reports/referral',
        label: 'Referral Transfers (RF-1)',
        icon: FileSpreadsheet,
        badgeText: 'RF-1',
        moduleId: 'referral_management',
      });
    }
    if (hasModule('analytics_surveillance')) {
      items.push({
        href: '/analytics',
        label: 'Morbidity Surveillance',
        icon: BarChart3,
        badgeText: 'Surveillance',
        moduleId: 'analytics_surveillance',
      });
    }
  } else if (role === 'bhw') {
    if (hasModule('resident_profiling')) {
      items.push({
        href: '/residents',
        label: hasSpecialChartAccess ? 'Patient Medical Charts' : 'Resident Profiling',
        icon: hasSpecialChartAccess ? Stethoscope : Users,
        badgeText: hasSpecialChartAccess ? 'Charts' : 'Census',
        moduleId: 'resident_profiling',
        isSpecial: hasSpecialChartAccess,
      });
    }
    if (hasModule('resident_intake')) {
      items.push({
        href: '/residents/register',
        label: 'New Patient Intake',
        icon: UserPlus,
        badgeText: 'Intake',
        moduleId: 'resident_intake',
      });
    }
    if (hasModule('vitals_triage')) {
      items.push({
        href: '/vitals',
        label: 'Hemodynamic Screener',
        icon: HeartPulse,
        badgeText: 'Vitals',
        moduleId: 'vitals_triage',
      });
    }
    if (hasModule('immunization_epi')) {
      items.push({
        href: '/immunizations',
        label: 'Child EPI Outreach',
        icon: Syringe,
        badgeText: 'EPI',
        moduleId: 'immunization_epi',
      });
    }
  } else if (role === 'lgu_viewer') {
    if (hasModule('analytics_surveillance')) {
      items.push({
        href: '/analytics',
        label: 'Morbidity Surveillance',
        icon: BarChart3,
        badgeText: 'Surveillance',
        moduleId: 'analytics_surveillance',
      });
    }
    if (hasModule('system_operations')) {
      items.push({
        href: '/operations',
        label: 'Station Diagnostics & Backup',
        icon: MonitorCheck,
        badgeText: 'Diagnostics',
        moduleId: 'system_operations',
      });
    }
  }

  // Fallback: If user has extra modules assigned outside defaults, append them
  const existingModules = new Set(items.map((i) => i.moduleId).filter(Boolean));
  const fallbackCatalog: Record<SystemModuleId, Omit<RoleBranchItem, 'moduleId'>> = {
    resident_profiling: { href: '/residents', label: 'Resident Profiling', icon: Users, badgeText: 'Census' },
    resident_intake: { href: '/residents/register', label: 'New Patient Intake', icon: UserPlus, badgeText: 'Intake' },
    vitals_triage: { href: '/vitals', label: 'Hemodynamic Screener', icon: HeartPulse, badgeText: 'Vitals' },
    patient_chart: { href: '/residents', label: 'Patient Medical Charts', icon: Stethoscope, badgeText: 'Charts' },
    maternal_care: { href: '/maternal', label: 'Maternal Care (ANC)', icon: Baby, badgeText: 'ANC' },
    immunization_epi: { href: '/immunizations', label: 'Child EPI & Cold Chain', icon: Syringe, badgeText: 'EPI' },
    referral_management: { href: '/reports/referral', label: 'Referral Slips (RF-1)', icon: FileSpreadsheet, badgeText: 'RF-1' },
    analytics_surveillance: { href: '/analytics', label: 'Morbidity Surveillance', icon: BarChart3, badgeText: 'Surveillance' },
    system_operations: { href: '/operations', label: 'Station Diagnostics & Backup', icon: MonitorCheck, badgeText: 'Diagnostics' },
    user_management: { href: '/users', label: 'User Accounts & RBAC', icon: ShieldCheck, badgeText: 'RBAC' },
    evaluation_uat: { href: '/evaluation', label: 'System Evaluation', icon: MonitorCheck, badgeText: 'UAT' },
  };

  (Object.keys(fallbackCatalog) as SystemModuleId[]).forEach((modId) => {
    if (modId !== 'evaluation_uat' && !existingModules.has(modId) && hasModule(modId)) {
      items.push({
        ...fallbackCatalog[modId],
        moduleId: modId,
      });
    }
  });

  return items;
}

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
  moduleId?: SystemModuleId;
  isSpecial?: boolean;
}

const ROLE_TITLES: Record<UserRole, { title: string; homeLabel: string; homeIcon: React.ElementType }> = {
  bhw: { title: 'BHW Frontline Station', homeLabel: 'BHW Duty Station', homeIcon: Activity },
  nurse: { title: 'Midwife & Nurse Desk', homeLabel: 'Midwife Station', homeIcon: Baby },
  doctor: { title: 'MHO Physician Command', homeLabel: 'Clinical Command Desk', homeIcon: Stethoscope },
  lgu_viewer: { title: 'LGU Executive Governance', homeLabel: 'Executive Overview', homeIcon: Building },
  admin: { title: 'System Administration', homeLabel: 'Admin Console', homeIcon: ShieldCheck },
};

const ROLE_BADGE_STYLES: Record<UserRole, { badge: string; avatar: string; border: string }> = {
  bhw: {
    badge: 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    avatar: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300',
    border: 'focus:border-emerald-600 focus:ring-emerald-600',
  },
  nurse: {
    badge: 'bg-pink-50 dark:bg-pink-950/80 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    avatar: 'bg-pink-100 dark:bg-pink-950/60 border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-300',
    border: 'focus:border-pink-600 focus:ring-pink-600',
  },
  doctor: {
    badge: 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    avatar: 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300',
    border: 'focus:border-blue-600 focus:ring-blue-600',
  },
  lgu_viewer: {
    badge: 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    avatar: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300',
    border: 'focus:border-amber-600 focus:ring-amber-600',
  },
  admin: {
    badge: 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    avatar: 'bg-indigo-100 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-300',
    border: 'focus:border-indigo-600 focus:ring-indigo-600',
  },
};


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, hasModule } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { activeAdminTab, setActiveAdminTab } = useAdminTab();

  const handleAdminBranchClick = (tabId: AdminTab) => {
    setActiveAdminTab(tabId);
    if (pathname !== '/') {
      router.push(`/?tab=${tabId}`);
    }
  };

  const roleMeta = ROLE_TITLES[user.role] || ROLE_TITLES.bhw;
  const currentStyles = ROLE_BADGE_STYLES[user.role] || ROLE_BADGE_STYLES.bhw;

  const defaultRoleModules = getDefaultModulesForRole(user.role);
  const hasSpecialChartAccess = user.role !== 'doctor' && user.role !== 'admin' && hasModule('patient_chart');

  // Dynamic navigation links generated based on active user modules
  const allPotentialLinks: NavItem[] = [
    { href: '/', label: roleMeta.homeLabel, icon: roleMeta.homeIcon },
    {
      href: '/residents',
      label: hasModule('patient_chart') ? 'Patient Medical Charts' : 'Resident Profiling',
      icon: hasModule('patient_chart') ? Stethoscope : Users,
      moduleId: 'resident_profiling',
      isSpecial: hasSpecialChartAccess,
    },
    { href: '/residents/register', label: 'New Patient Intake', icon: UserPlus, moduleId: 'resident_intake' },
    {
      href: '/vitals',
      label: user.role === 'doctor' ? 'Urgent Triage Queue' : 'Hemodynamic Screener',
      icon: user.role === 'doctor' ? AlertOctagon : HeartPulse,
      moduleId: 'vitals_triage',
    },
    { href: '/maternal', label: 'Maternal Care (ANC)', icon: Baby, moduleId: 'maternal_care' },
    { href: '/immunizations', label: 'Child EPI & Cold Chain', icon: Syringe, moduleId: 'immunization_epi' },
    { href: '/reports/referral', label: 'Referral Slips (RF-1)', icon: FileSpreadsheet, moduleId: 'referral_management' },
    { href: '/analytics', label: 'Morbidity Surveillance', icon: BarChart3, moduleId: 'analytics_surveillance' },
    { href: '/operations', label: 'Station Diagnostics & Backup', icon: MonitorCheck, moduleId: 'system_operations' },
    { href: '/users', label: 'User Accounts & RBAC', icon: ShieldCheck, moduleId: 'user_management' },
  ];

  const roleBranchItems = getRoleBranchModules(user.role, hasModule, hasSpecialChartAccess);

  // For non-admin roles, all their active modules are compiled directly under their station header (item.href === '/')
  // For admin, we retain the admin console header + the full municipal workflows below
  const currentNavLinks = user.role === 'admin'
    ? allPotentialLinks.filter((item) => {
        if (!item.moduleId) return true;
        return hasModule(item.moduleId);
      })
    : allPotentialLinks.filter((item) => item.href === '/');

  const currentActiveLink =
    roleBranchItems.find((b) => b.href === pathname) ||
    allPotentialLinks.find((l) => l.href === pathname);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* ============================================================ */}
      {/* 1. DESKTOP DOCKED SIDEBAR (FIXED LEFT NAVIGATION)             */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col w-64 xl:w-72 fixed inset-y-0 left-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors duration-200">
        {/* Luminous Top Gradient Accent */}
        <div className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 w-full shrink-0" />

        {/* Sidebar Brand Header */}
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-11 h-11 rounded-full border border-emerald-300 dark:border-emerald-600 bg-white dark:bg-slate-800 shadow-2xs group-hover:scale-105 transition-transform overflow-hidden flex items-center justify-center p-0.5 shrink-0">
              <Image
                src="/bucay-logo.png"
                alt="Municipality of Bucay Seal"
                width={40}
                height={40}
                className="object-contain rounded-full"
                priority
              />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">BHSMS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Pilot
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">Municipality of Bucay</span>
            </div>
          </Link>

          {/* Sync Status Badge */}
          <div className="mt-3 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>RHU Sync Active</span>
            </div>
            <span className="font-mono text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-bold">ONLINE</span>
          </div>
        </div>

        {/* Sidebar Module Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 no-scrollbar">
          {/* Main Role Module Navigation */}
          <div className="space-y-1.5">
            <div className="px-3 pb-1 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              <span>{roleMeta.title}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>

            <nav className="space-y-1">
              {currentNavLinks.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <React.Fragment key={item.href}>
                    {index === 1 && user.role === 'admin' && (
                      <div className="pt-3 pb-1 px-3 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-800 my-2">
                        <span>Municipal Workflows</span>
                      </div>
                    )}
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-l-4 border-emerald-600 dark:border-emerald-400 font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.isSpecial && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0 ml-1">
                          Special
                        </span>
                      )}
                    </Link>

                    {/* Branch out Role Modules under Station Link on Sidebar */}
                    {item.href === '/' && roleBranchItems.length > 0 && (
                      <div className="my-1.5 ml-4 pl-3.5 border-l-2 border-emerald-500/40 dark:border-emerald-500/30 space-y-1">
                        {roleBranchItems.map((branch) => {
                          const BranchIcon = branch.icon;

                          // 1. Admin Tab Dossiers
                          if (branch.tabId) {
                            const isBranchActive = pathname === '/' && activeAdminTab === branch.tabId;
                            return (
                              <button
                                key={branch.tabId}
                                type="button"
                                onClick={() => handleAdminBranchClick(branch.tabId!)}
                                className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all group/branch ${
                                  isBranchActive
                                    ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                      isBranchActive ? 'bg-emerald-500 scale-125' : 'bg-slate-400 dark:bg-slate-500 group-hover/branch:bg-emerald-400'
                                    }`}
                                  />
                                  <BranchIcon
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isBranchActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-400'
                                    }`}
                                  />
                                  <span className="truncate">{branch.label}</span>
                                </div>
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                                    isBranchActive
                                      ? 'bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 border-emerald-400/50 font-bold'
                                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {branch.badgeText}
                                </span>
                              </button>
                            );
                          }

                          // 2. Role Module Direct Links
                          const isBranchActive = pathname === branch.href;
                          return (
                            <Link
                              key={branch.href}
                              href={branch.href!}
                              className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all group/branch ${
                                isBranchActive
                                  ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700 shadow-2xs'
                                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                    isBranchActive ? 'bg-emerald-500 scale-125 ring-2 ring-emerald-400/40' : 'bg-slate-400 dark:bg-slate-500 group-hover/branch:bg-emerald-400'
                                  }`}
                                />
                                <BranchIcon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isBranchActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-400'
                                  }`}
                                />
                                <span className="truncate">{branch.label}</span>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0 ml-1">
                                {branch.isSpecial && (
                                  <span className="text-[8px] uppercase font-bold px-1 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Special
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                                    isBranchActive
                                      ? 'bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 border-emerald-400/50 font-bold'
                                      : 'bg-slate-100 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {branch.badgeText}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Active Operator Capsule & Controls */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 shrink-0 space-y-3">
          {/* Operator Identity Card */}
          <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
            <div className={`w-9 h-9 rounded-full border font-bold text-xs flex items-center justify-center shrink-0 ${currentStyles.avatar}`}>
              {getInitials(user.name)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user.name}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                <span className={`uppercase font-bold px-1.5 py-0.2 rounded text-[9px] border ${currentStyles.badge}`}>
                  {user.role}
                </span>
                <span>• Brgy. {user.barangay}</span>
              </div>
              {hasSpecialChartAccess && (
                <div className="mt-1 inline-flex items-center space-x-1 text-[9px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                  <Sparkles className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                  <span>Special Clearance: Medical Chart</span>
                </div>
              )}
            </div>
          </div>

          {/* Station Deployment Status */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{user.stationName || `Barangay ${user.barangay} BHS`}</span>
            </div>
            {user.employeeId && (
              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 shrink-0 pl-1">
                {user.employeeId}
              </span>
            )}
          </div>

          {/* Controls: Theme Toggle & Session Auth */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Day Shift Mode' : 'Switch to Night Shift Mode'}
              className="flex-1 py-2 px-3 rounded-xl border transition-all duration-200 flex items-center justify-center text-xs font-semibold shadow-2xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-400"
              aria-label="Toggle Night Mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 mr-1.5" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600 mr-1.5" />
              )}
              <span className="font-mono text-[11px]">{theme === 'dark' ? 'Night Shift' : 'Day Shift'}</span>
            </button>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                title="Sign out of duty station"
                className="p-2 text-slate-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/login"
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shrink-0"
                title="Employee Login"
              >
                <LogIn className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Regulatory Accreditation */}
          <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono text-center">
            DOH FHSIS & PhilHealth • RA 10173
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. MOBILE SLIDE-OUT DRAWER                                   */}
      {/* ============================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[80vw] bg-white dark:bg-slate-900 h-full flex flex-col z-10 shadow-2xl border-r border-slate-200 dark:border-slate-800">
            {/* Top Bar with Close Button */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Image
                  src="/bucay-logo.png"
                  alt="Bucay Official Seal"
                  width={32}
                  height={32}
                  className="object-contain rounded-full border border-slate-200 dark:border-slate-700"
                />
                <span className="font-bold text-sm text-slate-900 dark:text-white">BHSMS Bucay</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-3 py-1">
                {roleMeta.title}
              </div>
              {currentNavLinks.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <React.Fragment key={item.href}>
                    {index === 1 && user.role === 'admin' && (
                      <div className="pt-2 pb-1 px-3 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800 my-1">
                        <span>Municipal Workflows</span>
                      </div>
                    )}
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border-l-4 border-emerald-500'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{item.label}</span>
                      </div>
                      {item.isSpecial && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Special
                        </span>
                      )}
                    </Link>

                    {/* Mobile Branch for Role Modules */}
                    {item.href === '/' && roleBranchItems.length > 0 && (
                      <div className="my-1.5 ml-4 pl-3.5 border-l-2 border-emerald-500/40 dark:border-emerald-500/30 space-y-1">
                        {roleBranchItems.map((branch) => {
                          const BranchIcon = branch.icon;

                          if (branch.tabId) {
                            const isBranchActive = pathname === '/' && activeAdminTab === branch.tabId;
                            return (
                              <button
                                key={branch.tabId}
                                type="button"
                                onClick={() => {
                                  handleAdminBranchClick(branch.tabId!);
                                  setMobileMenuOpen(false);
                                }}
                                className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                                  isBranchActive
                                    ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isBranchActive ? 'bg-emerald-500' : 'bg-slate-400'
                                  }`} />
                                  <BranchIcon className={`w-3.5 h-3.5 shrink-0 ${
                                    isBranchActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                  }`} />
                                  <span className="truncate">{branch.label}</span>
                                </div>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                  {branch.badgeText}
                                </span>
                              </button>
                            );
                          }

                          const isBranchActive = pathname === branch.href;
                          return (
                            <Link
                              key={branch.href}
                              href={branch.href!}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-colors ${
                                isBranchActive
                                  ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700'
                                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isBranchActive ? 'bg-emerald-500' : 'bg-slate-400'
                                }`} />
                                <BranchIcon className={`w-3.5 h-3.5 shrink-0 ${
                                  isBranchActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                                }`} />
                                <span className="truncate">{branch.label}</span>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {branch.badgeText}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-amber-400"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                <span>{theme === 'dark' ? 'Night Shift Mode' : 'Day Shift Mode'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. MAIN WORKSPACE AREA (OFFSET FOR DESKTOP SIDEBAR)          */}
      {/* ============================================================ */}
      <div className="md:pl-64 xl:pl-72 flex flex-col min-h-screen transition-all duration-200">
        {/* Top Slim Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between shadow-2xs transition-colors">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              aria-label="Open Mobile Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Current Module Title */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <span>{currentActiveLink?.label || roleMeta.title}</span>
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                Barangay {user.barangay} Health Station
              </span>
            </div>
          </div>

          {/* Quick Header Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Status Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Bucay Central Mesh</span>
            </div>

            {/* Quick Night Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Day Shift Mode' : 'Switch to Night Shift Mode'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              aria-label="Toggle Night Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-none">
          {children}
        </main>

        {/* Municipal Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 sm:px-6 text-xs text-slate-500 dark:text-slate-400 transition-colors">
          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center space-x-2.5">
              <Image
                src="/bucay-logo.png"
                alt="Bucay Official Seal"
                width={20}
                height={20}
                className="object-contain rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Republic of the Philippines • Municipality of Bucay BHSMS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              DOH FHSIS-2026 & PhilHealth Konsulta • RA 10173 Certified
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
