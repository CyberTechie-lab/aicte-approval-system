'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  FileText,
  Clock,
  Calendar,
  AlertOctagon,
  ClipboardCheck,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

export function KpiCards() {
  const { applications, evcSchedules, undertakings, documents, alerts, setActiveTab, setStageFilter, setEscalationFilter } = useDashboard();

  const totalApps = applications.length;
  const scrutinyCount = applications.filter(a => a.currentStage === 'SCRUTINY' || a.currentStage === 'RE_SCRUTINY').length;
  const evcScheduledCount = applications.filter(a => a.currentStage === 'EVC_SCHEDULED' || a.currentStage === 'EVC_COMPLETED').length;
  const deficiencyCount = applications.filter(a => a.currentStage === 'REVERTED_DEFICIENCY').length;
  const overdueEscalations = applications.filter(a => a.escalationLevel !== 'LEVEL_0_NORMAL').length;
  const pendingUndertakings = undertakings.filter(u => u.status !== 'VERIFIED_COMPLIANT').length;
  const criticalDocs = documents.filter(d => d.status === 'CRITICAL_30D' || d.status === 'EXPIRED').length;

  const cards = [
    {
      title: 'Active Applications',
      value: totalApps,
      subtitle: 'Across 7 Regional Offices',
      icon: FileText,
      color: 'bg-blue-500/10 text-blue-700 border-blue-200',
      action: () => {
        setStageFilter('ALL');
        setActiveTab('applications');
      },
    },
    {
      title: 'Under Scrutiny',
      value: scrutinyCount,
      subtitle: 'Clause-by-clause verification',
      icon: Clock,
      color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
      action: () => {
        setStageFilter('SCRUTINY');
        setActiveTab('applications');
      },
    },
    {
      title: 'EVC Inspections Queue',
      value: evcScheduledCount,
      subtitle: 'Panels & site inspections',
      icon: Calendar,
      color: 'bg-amber-500/10 text-amber-700 border-amber-200',
      action: () => setActiveTab('evc'),
    },
    {
      title: 'Deficiency Reverts',
      value: deficiencyCount,
      subtitle: '15-Day statutory cure notices',
      icon: AlertOctagon,
      color: 'bg-rose-500/10 text-rose-700 border-rose-200',
      action: () => {
        setStageFilter('REVERTED_DEFICIENCY');
        setActiveTab('applications');
      },
    },
    {
      title: 'Active Undertakings',
      value: pendingUndertakings,
      subtitle: 'Time-bound compliance tracking',
      icon: ClipboardCheck,
      color: 'bg-purple-500/10 text-purple-700 border-purple-200',
      action: () => setActiveTab('undertakings'),
    },
    {
      title: 'Lease & NOC Sentinels',
      value: criticalDocs,
      subtitle: '< 30 Days or Expired Deeds',
      icon: ShieldAlert,
      color: 'bg-red-500/10 text-red-700 border-red-200',
      action: () => setActiveTab('documents'),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, idx) => {
        const Icon = c.icon;
        return (
          <div
            key={idx}
            onClick={c.action}
            className={`p-3.5 sm:p-4 rounded-2xl bg-white border shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between group ${c.color.split(' ')[2] || 'border-slate-200'}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase truncate">
                {c.title}
              </span>
              <div className={`p-1.5 rounded-lg ${c.color.split(' ')[0]} ${c.color.split(' ')[1]}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {c.value}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{c.subtitle}</div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:text-blue-800 transition pt-1 border-t border-slate-100">
              <span>View details</span>
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
