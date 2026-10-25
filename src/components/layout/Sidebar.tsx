'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  LayoutDashboard,
  FileText,
  CalendarCheck2,
  ClipboardList,
  ShieldAlert,
  Sliders,
  FileCheck2,
  Building,
  BellRing,
  HelpCircle,
  ShieldCheck,
  Lock,
  MapPin,
  History,
} from 'lucide-react';

export function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    currentUser,
    canAccessTab,
    alerts,
    applications,
    evcSchedules,
    undertakings,
    documents,
  } = useDashboard();

  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const pendingEvc = evcSchedules.filter(e => e.status === 'PENDING_SCHEDULING' || e.status === 'PANEL_CONSTITUTED').length;
  const pendingUndertakings = undertakings.filter(u => u.status !== 'VERIFIED_COMPLIANT').length;
  const expiringDocs = documents.filter(d => d.status === 'CRITICAL_30D' || d.status === 'EXPIRED').length;

  const allNavItems = [
    {
      id: 'dashboard',
      label: 'Integrated Dashboard',
      description: 'Pendency & Ageing Matrix',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'applications',
      label: 'Approval Processing',
      description: 'Routing, Scrutiny & Reverts',
      icon: FileText,
      badge: applications.length,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'evc',
      label: 'EVC Inspections Desk',
      description: 'Scheduling & Panel Reports',
      icon: CalendarCheck2,
      badge: pendingEvc > 0 ? pendingEvc : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'undertakings',
      label: 'Time-Bound Undertakings',
      description: 'Compliance & Proof Upload',
      icon: ClipboardList,
      badge: pendingUndertakings > 0 ? pendingUndertakings : null,
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'documents',
      label: 'Lease & Document Radar',
      description: '30-Yr Lease, Fire NOC Sentinels',
      icon: ShieldAlert,
      badge: expiringDocs > 0 ? expiringDocs : null,
      badgeColor: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'alerts',
      label: 'Alerts & Escalations',
      description: 'Multi-Tier RO/Bureau Ladder',
      icon: BellRing,
      badge: unreadAlerts > 0 ? unreadAlerts : null,
      badgeColor: 'bg-red-500 text-white',
    },
    {
      id: 'config',
      label: 'APH SLA & Rules Engine',
      description: 'Statutory Timelines Config',
      icon: Sliders,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Regulatory Reports & Audit',
      description: 'Case Summaries & Vault',
      icon: FileCheck2,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Central Audit Trail',
      description: 'Immutable Digital Vault',
      icon: History,
      badge: null,
    },
  ];

  // Filter based on strict RBAC access matrix
  const accessibleNavItems = allNavItems.filter(item => canAccessTab(item.id));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Role Pill Banner */}
      <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 space-y-1.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block">
              Active Authorized Role
            </span>
            <span className="text-xs font-bold text-white truncate block">
              {currentRole.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Regional / Institutional Tenancy Tag */}
        {currentUser?.region && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40 text-[10px] text-emerald-300 font-semibold">
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="truncate">{currentUser.region} Regional Jurisdiction</span>
          </div>
        )}

        {currentUser?.institutionName && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40 text-[10px] text-cyan-300 font-semibold">
            <Building className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{currentUser.institutionName}</span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {accessibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition group cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                  : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />
                <div className="truncate">
                  <div className="text-xs leading-snug truncate">{item.label}</div>
                  <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                    {item.description}
                  </div>
                </div>
              </div>
              {item.badge !== null && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    item.badgeColor || 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Statutory Safeguard Card */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
          <HelpCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Statutory Safeguard</span>
        </div>
        <p className="text-slate-400 text-[10px] leading-relaxed">
          In accordance with APH 2026-27, automated workflow alerts support regulatory oversight and shall not supplant statutory approvals reserved for competent authorities.
        </p>
      </div>
    </aside>
  );
}
