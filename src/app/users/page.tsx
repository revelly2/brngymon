'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { ModuleGuard } from '@/components/auth/module-guard';
import { UserManagementPanel } from '@/components/users/user-management-panel';

export default function UsersManagementPage() {
  return (
    <AppShell>
      <ModuleGuard moduleId="user_management">
        <UserManagementPanel />
      </ModuleGuard>
    </AppShell>
  );
}
