'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type AdminTab = 'cloud_sync' | 'audit' | 'users' | 'storage';

interface AdminTabContextType {
  activeAdminTab: AdminTab;
  setActiveAdminTab: (tab: AdminTab) => void;
}

const AdminTabContext = createContext<AdminTabContextType | undefined>(undefined);

export function AdminTabProvider({ children }: { children: React.ReactNode }) {
  const [activeAdminTab, setActiveAdminTabState] = useState<AdminTab>('cloud_sync');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as AdminTab | null;
      if (tabParam && ['cloud_sync', 'audit', 'users', 'storage'].includes(tabParam)) {
        setActiveAdminTabState(tabParam);
      }
    }
  }, []);

  const setActiveAdminTab = (tab: AdminTab) => {
    setActiveAdminTabState(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  };

  return (
    <AdminTabContext.Provider value={{ activeAdminTab, setActiveAdminTab }}>
      {children}
    </AdminTabContext.Provider>
  );
}

export function useAdminTab() {
  const context = useContext(AdminTabContext);
  if (!context) {
    throw new Error('useAdminTab must be used within an AdminTabProvider');
  }
  return context;
}
