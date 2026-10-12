import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/auth-context';

export const metadata: Metadata = {
  title: 'Barangay Health Status Monitoring System (BHSMS)',
  description: 'Primary Healthcare Information Management and Triage System for Rural Health Centers in Abra',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased light">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
