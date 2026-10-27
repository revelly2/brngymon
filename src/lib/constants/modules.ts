import { SystemModuleId, UserRole } from '@/types/database';
import {
  Users,
  UserPlus,
  HeartPulse,
  Stethoscope,
  Baby,
  Syringe,
  FileSpreadsheet,
  BarChart3,
  MonitorCheck,
  ShieldCheck,
} from 'lucide-react';
import React from 'react';

export type ModuleCategory = 'frontline' | 'clinical' | 'governance';

export interface ModuleDefinition {
  id: SystemModuleId;
  label: string;
  shortLabel: string;
  description: string;
  clinicalPurpose: string;
  category: ModuleCategory;
  href: string;
  icon: React.ElementType;
  defaultRoles: UserRole[];
}

export const SYSTEM_MODULES: ModuleDefinition[] = [
  // Frontline & Community Intake
  {
    id: 'resident_profiling',
    label: 'Resident Profiling & Master List',
    shortLabel: 'Resident Registry',
    description: 'Centralized demographic database, longitudinal health profiles, and soundex deduplication.',
    clinicalPurpose: 'Primary census and identification of community members for local health delivery.',
    category: 'frontline',
    href: '/residents',
    icon: Users,
    defaultRoles: ['bhw', 'nurse', 'doctor', 'admin'],
  },
  {
    id: 'resident_intake',
    label: 'New Patient Intake Registration',
    shortLabel: 'New Intake',
    description: 'Encode new resident demographics, household assignment, PhilHealth credentials, and baseline risk factors.',
    clinicalPurpose: 'Frontline registration to establish UPI (Unique Patient Identifier).',
    category: 'frontline',
    href: '/residents/register',
    icon: UserPlus,
    defaultRoles: ['bhw', 'nurse', 'admin'],
  },
  {
    id: 'vitals_triage',
    label: 'Hemodynamic Screener & Triage',
    shortLabel: 'Vitals & Triage',
    description: 'Record Blood Pressure, Heart Rate, Respiratory Rate, Temperature, BMI with automated hypertension and febrile flags.',
    clinicalPurpose: 'Point-of-care vital signs capture with automated severity stratification.',
    category: 'frontline',
    href: '/vitals',
    icon: HeartPulse,
    defaultRoles: ['bhw', 'nurse', 'doctor', 'admin'],
  },

  // Clinical & Specialized Care
  {
    id: 'patient_chart',
    label: 'Medical Patient Chart & Clinical Notes',
    shortLabel: 'Medical Chart',
    description: 'Longitudinal clinical encounter history, physician/nursing consultation notes, ICD-10 impressions, and prescription management.',
    clinicalPurpose: 'Confidential diagnostic, treatment disposition, and clinical progress documentation (DOH / PhilHealth Konsulta).',
    category: 'clinical',
    href: '/residents',
    icon: Stethoscope,
    defaultRoles: ['doctor', 'admin'], // Nurses can be granted this special elevated permission
  },
  {
    id: 'maternal_care',
    label: 'Maternal Care & ANC Cohorts',
    shortLabel: 'Maternal Care',
    description: 'Prenatal care tracking across 4-visit ANC pathway, high-risk obstetric flagging, and birth outcome recording.',
    clinicalPurpose: 'Reduce maternal and perinatal mortality through timely prenatal surveillance.',
    category: 'clinical',
    href: '/maternal',
    icon: Baby,
    defaultRoles: ['nurse', 'doctor', 'admin'],
  },
  {
    id: 'immunization_epi',
    label: 'Child EPI & Cold Chain Tracking',
    shortLabel: 'Child EPI',
    description: 'Expanded Program on Immunization schedule (BCG, Penta, OPV, IPV, Measles), cold chain adherence, and defaulter tracking.',
    clinicalPurpose: 'Prevention of vaccine-preventable pediatric illnesses and community immunity.',
    category: 'clinical',
    href: '/immunizations',
    icon: Syringe,
    defaultRoles: ['bhw', 'nurse', 'doctor', 'admin'],
  },
  {
    id: 'referral_management',
    label: 'Referral Slips (RF-1) Transfers',
    shortLabel: 'Hospital Referrals',
    description: 'Standardized two-way clinical referral slips to Municipal Health Office or Abra Provincial Hospital.',
    clinicalPurpose: 'Safe clinical escalation and continuity of care for critical/high-risk patients.',
    category: 'clinical',
    href: '/reports/referral',
    icon: FileSpreadsheet,
    defaultRoles: ['nurse', 'doctor', 'admin'],
  },

  // Governance & Administration
  {
    id: 'analytics_surveillance',
    label: 'FHSIS Morbidity Surveillance',
    shortLabel: 'Epidemiology Analytics',
    description: 'Aggregated morbidity curves, top disease conditions, PhilHealth Konsulta reporting, and catchment analytics.',
    clinicalPurpose: 'Evidence-based municipal health planning and outbreak response.',
    category: 'governance',
    href: '/analytics',
    icon: BarChart3,
    defaultRoles: ['doctor', 'lgu_viewer', 'admin'],
  },
  {
    id: 'system_operations',
    label: 'Workstation Diagnostics & Sync',
    shortLabel: 'Operations & Backup',
    description: 'Local storage cache status, cloud Supabase synchronization, offline backup bundling, and terminal diagnostics.',
    clinicalPurpose: 'Guarantees operational continuity in offline rural connectivity environments.',
    category: 'governance',
    href: '/operations',
    icon: MonitorCheck,
    defaultRoles: ['lgu_viewer', 'admin'],
  },
  {
    id: 'user_management',
    label: 'User Accounts & Modular RBAC',
    shortLabel: 'User Management',
    description: 'Provision personnel accounts, configure granular modular permissions per user, and manage station scopes.',
    clinicalPurpose: 'Security governance and least-privilege compliance under Republic Act No. 10173.',
    category: 'governance',
    href: '/users',
    icon: ShieldCheck,
    defaultRoles: ['admin'],
  },
];

export const CATEGORY_LABELS: Record<ModuleCategory, { label: string; description: string }> = {
  frontline: {
    label: 'Frontline & Community Intake',
    description: 'Community census, demographic profiling, and frontline hemodynamic triage screener.',
  },
  clinical: {
    label: 'Clinical & Specialized Care',
    description: 'Confidential medical charts, maternal-child health, cold chain immunizations, and referral transfers.',
  },
  governance: {
    label: 'Governance & Administration',
    description: 'Epidemiological surveillance, user permissions management, workstation offline backups, and system audits.',
  },
};

/**
 * Returns the default module IDs allocated to a given role template
 */
export function getDefaultModulesForRole(role: UserRole): SystemModuleId[] {
  return SYSTEM_MODULES.filter((m) => m.defaultRoles.includes(role)).map((m) => m.id);
}

/**
 * Returns the full module definition object by ID
 */
export function getModuleDefinition(moduleId: SystemModuleId): ModuleDefinition | undefined {
  return SYSTEM_MODULES.find((m) => m.id === moduleId);
}
