import type { Metadata } from 'next';
import './globals.css';
import { DashboardProvider } from '@/context/DashboardContext';

export const metadata: Metadata = {
  title: 'AICTE Approval Automation & Compliance Sentinel',
  description: 'Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System (APH 2026-27)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f4f7fb] text-slate-900 antialiased font-sans">
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </body>
    </html>
  );
}
