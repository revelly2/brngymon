import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/context/auth-context';
import { ThemeProvider } from '@/lib/context/theme-context';
import { AdminTabProvider } from '@/lib/context/admin-tab-context';

export const metadata: Metadata = {
  title: 'Barangay Health Status Monitoring System (BHSMS)',
  description: 'Primary Healthcare Information Management and Triage System for Rural Health Centers in Abra',
  icons: {
    icon: '/bucay-logo.png',
    apple: '/bucay-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
        <ThemeProvider>
          <AuthProvider>
            <AdminTabProvider>{children}</AdminTabProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
