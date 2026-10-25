'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { InstitutionPortal } from '@/components/dashboard/InstitutionPortal';
import { QuickFilterBar } from '@/components/applications/QuickFilterBar';
import { ApplicationTable } from '@/components/applications/ApplicationTable';
import { ApplicationDetailModal } from '@/components/applications/ApplicationDetailModal';
import { EvcScheduleManager } from '@/components/evc/EvcScheduleManager';
import { UndertakingsDesk } from '@/components/compliance/UndertakingsDesk';
import { DocumentValidityMonitor } from '@/components/documents/DocumentValidityMonitor';
import { AlertsHub } from '@/components/alerts/AlertsHub';
import { AphRulesConfig } from '@/components/config/AphRulesConfig';
import { RegulatoryReportsView } from '@/components/reports/RegulatoryReportsView';
import { AuditTrailView } from '@/components/audit/AuditTrailView';
import { LoginPage } from '@/components/auth/LoginPage';
import { MapPin, ShieldCheck, Lock, Loader2 } from 'lucide-react';

export default function ApprovalDashboardPage() {
  const { currentUser, currentRole, activeTab, canAccessTab, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#032761] mx-auto" />
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Loading AICTE Statutory Portal Session...
          </p>
        </div>
      </div>
    );
  }

  // If unauthenticated, show AICTE SSO Login Gateway
  if (!currentUser) {
    return <LoginPage />;
  }

  // Institutional Principal Role Lock (Strict Single-Window Tenancy)
  if (currentRole === 'INSTITUTION_PRINCIPAL') {
    return (
      <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex flex-col">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
            <InstitutionPortal />
          </main>
        </div>
        <ApplicationDetailModal />
      </div>
    );
  }

  // Guard against forbidden tabs for specific roles
  const hasAccessToCurrentTab = canAccessTab(activeTab);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900 flex flex-col">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Regional Tenancy Notification Banner */}
          {currentUser.role === 'REGIONAL_OFFICER' && currentUser.region && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Regional Jurisdiction Active:</strong> You are viewing applications, EVC panels, and documents for the{' '}
                  <strong>{currentUser.region} Region</strong> ({currentUser.department}).
                </span>
              </div>
              <span className="font-bold text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded text-emerald-900">
                Isolated Regional Workspace
              </span>
            </div>
          )}

          {/* Scrutiny Convener Mode Banner */}
          {currentUser.role === 'SCRUTINY_CONVENER' && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>
                  <strong>Scrutiny Committee Convener Mode:</strong> Review clause-by-clause compliance and issue 15-day statutory deficiency notices.
                </span>
              </div>
              <span className="font-bold text-[10px] bg-purple-200/60 px-2 py-0.5 rounded text-purple-900">
                Committee Scrutiny Desk
              </span>
            </div>
          )}

          {/* Access Denied Warning */}
          {!hasAccessToCurrentTab && (
            <div className="p-6 rounded-2xl bg-white border border-rose-200 shadow-xs text-center space-y-2">
              <Lock className="w-8 h-8 text-rose-600 mx-auto" />
              <h3 className="font-bold text-slate-900 text-sm">Access Restricted under APH Regulations</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your authorized role (<strong>{currentRole.replace(/_/g, ' ')}</strong>) does not hold statutory permissions to access this module.
              </p>
            </div>
          )}

          {hasAccessToCurrentTab && (
            <>
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <KpiCards />
                  <AnalyticsCharts />

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-[#032761] uppercase tracking-wider">
                          Live APH Approval Applications Pipeline
                        </h2>
                        <p className="text-xs text-slate-500">
                          Real-time stage transitions, statutory cure notices, and regional pendency monitoring
                        </p>
                      </div>
                    </div>

                    <QuickFilterBar />
                    <ApplicationTable />
                  </div>
                </div>
              )}

              {activeTab === 'applications' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-[#032761]">Central Approval Applications Registry</h2>
                    <p className="text-xs text-slate-500">
                      Search, filter, and advance institutional applications across Scrutiny, EVC, SAC/SHC, and Final Approval
                    </p>
                  </div>
                  <QuickFilterBar />
                  <ApplicationTable />
                </div>
              )}

              {activeTab === 'evc' && (
                <div className="space-y-4">
                  <EvcScheduleManager />
                </div>
              )}

              {activeTab === 'undertakings' && (
                <div className="space-y-4">
                  <UndertakingsDesk />
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <DocumentValidityMonitor />
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-4">
                  <AlertsHub />
                </div>
              )}

              {activeTab === 'config' && (
                <div className="space-y-4">
                  <AphRulesConfig />
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <RegulatoryReportsView />
                </div>
              )}

              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <AuditTrailView />
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Application Dossier Modal */}
      <ApplicationDetailModal />
    </div>
  );
}
