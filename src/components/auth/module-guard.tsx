'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/auth-context';
import { SystemModuleId } from '@/types/database';
import { getModuleDefinition } from '@/lib/constants/modules';
import { ShieldAlert, ArrowLeft, Lock, UserCheck } from 'lucide-react';

interface ModuleGuardProps {
  moduleId: SystemModuleId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ModuleGuard({ moduleId, children, fallback }: ModuleGuardProps) {
  const { hasModule, user } = useAuth();
  const allowed = hasModule(moduleId);

  if (allowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const moduleDef = getModuleDefinition(moduleId);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Access Scope Restricted
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white pt-1">
            {moduleDef?.label || 'Clinical Module'} Restricted
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Your active operator account (<strong>{user.name}</strong> • <span className="uppercase font-mono font-semibold">{user.role}</span>) does not currently have permissions enabled for this module.
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-left text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Republic Act No. 10173 Least-Privilege Policy:</span>
          </div>
          <p className="leading-normal">
            Access to confidential clinical records and specialized workflows is restricted to authorized personnel. If you require operational access to this module, contact the <strong>LGU System Administrator</strong> to grant clearance.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Station</span>
          </Link>

          {user.role === 'admin' && (
            <Link
              href="/users"
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Manage User Permissions</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
