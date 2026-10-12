'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, BarangayCode } from '@/types/database';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  barangay: BarangayCode;
}

const PRESET_ACCOUNTS: Record<UserRole, UserSession> = {
  bhw: {
    id: 'usr-bhw-palaquio',
    email: 'bhw.palaquio@lagangilang.gov.ph',
    name: 'Elena Bagani (BHW)',
    role: 'bhw',
    barangay: 'PALAQUIO',
  },
  nurse: {
    id: 'usr-nurse-lagangilang',
    email: 'midwife.rhus@lagangilang.gov.ph',
    name: 'Corazon Valdez, RM (Midwife)',
    role: 'nurse',
    barangay: 'TABIOG',
  },
  doctor: {
    id: 'usr-mho-doctor',
    email: 'mho.doctor@lagangilang.gov.ph',
    name: 'Dr. Arthur Alcantara, MHO',
    role: 'doctor',
    barangay: 'BABANGCAG',
  },
  admin: {
    id: 'usr-lgu-admin',
    email: 'admin.it@lagangilang.gov.ph',
    name: 'LGU System Administrator',
    role: 'admin',
    barangay: 'PALAQUIO',
  },
  lgu_viewer: {
    id: 'usr-brgy-captain',
    email: 'captain.tabiog@lagangilang.gov.ph',
    name: 'Hon. Ramon Balbin (Brgy Captain)',
    role: 'lgu_viewer',
    barangay: 'TABIOG',
  },
};

interface AuthContextType {
  user: UserSession;
  setRole: (role: UserRole) => void;
  canEditClinicalData: boolean;
  canRegisterResidents: boolean;
  canViewReportsOnly: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('bhw');
  const [user, setUser] = useState<UserSession>(PRESET_ACCOUNTS.bhw);

  useEffect(() => {
    setUser(PRESET_ACCOUNTS[currentRole]);
  }, [currentRole]);

  const canEditClinicalData = ['doctor', 'nurse'].includes(user.role);
  const canRegisterResidents = ['admin', 'doctor', 'nurse', 'bhw'].includes(user.role);
  const canViewReportsOnly = user.role === 'lgu_viewer';

  return (
    <AuthContext.Provider
      value={{
        user,
        setRole: setCurrentRole,
        canEditClinicalData,
        canRegisterResidents,
        canViewReportsOnly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
