'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { useAuth } from '@/lib/context/auth-context';
import { BhwDashboard } from '@/components/roles/bhw-dashboard';
import { MidwifeDashboard } from '@/components/roles/midwife-dashboard';
import { DoctorDashboard } from '@/components/roles/doctor-dashboard';
import { LguDashboard } from '@/components/roles/lgu-dashboard';
import { AdminDashboard } from '@/components/roles/admin-dashboard';

export default function Home() {
  const { user } = useAuth();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Dynamic Role Dashboard Rendering */}
        {user.role === 'bhw' && <BhwDashboard />}
        {user.role === 'nurse' && <MidwifeDashboard />}
        {user.role === 'doctor' && <DoctorDashboard />}
        {user.role === 'lgu_viewer' && <LguDashboard />}
        {user.role === 'admin' && <AdminDashboard />}
      </div>
    </AppShell>
  );
}

