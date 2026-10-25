'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  FileText,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Calendar,
} from 'lucide-react';

export function ApplicationTable() {
  const {
    applications,
    searchQuery,
    regionFilter,
    stageFilter,
    routeFilter,
    escalationFilter,
    setSelectedAppId,
  } = useDashboard();

  // Filter application list
  const filteredApps = applications.filter(app => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        app.applicationNumber.toLowerCase().includes(q) ||
        app.institutionName.toLowerCase().includes(q) ||
        app.institutionPermanentId.toLowerCase().includes(q) ||
        app.city.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Region
    if (regionFilter !== 'ALL' && app.region !== regionFilter) return false;

    // Stage
    if (stageFilter !== 'ALL' && app.currentStage !== stageFilter) return false;

    // Route
    if (routeFilter !== 'ALL' && app.route !== routeFilter) return false;

    // Escalation
    if (escalationFilter !== 'ALL' && app.escalationLevel !== escalationFilter) return false;

    return true;
  });

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'SCRUTINY':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'RE_SCRUTINY':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'EVC_SCHEDULED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'EVC_COMPLETED':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'SAC_SHC_REVIEW':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REVERTED_DEFICIENCY':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
      case 'REJECTED':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getEscalationBadge = (esc: string) => {
    switch (esc) {
      case 'LEVEL_1_RO':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Level 1: RO</span>;
      case 'LEVEL_2_BUREAU':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-900 border border-orange-300">Level 2: Bureau</span>;
      case 'LEVEL_3_MEMBER_SECRETARY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-900 border border-red-300 animate-pulse">Level 3: MS</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">Normal</span>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-[#032761]/5 border-b border-slate-200 text-[#032761] uppercase tracking-wider font-bold text-[11px]">
          <tr>
            <th className="py-3 px-4">Application Details</th>
            <th className="py-3 px-4">Institution &amp; Region</th>
            <th className="py-3 px-3">APH Route</th>
            <th className="py-3 px-3">Processing Stage</th>
            <th className="py-3 px-3">SLA &amp; Ageing</th>
            <th className="py-3 px-3">Escalation Tier</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {filteredApps.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-10 text-slate-400">
                No approval applications match the specified criteria.
              </td>
            </tr>
          ) : (
            filteredApps.map(app => (
              <tr
                key={app.id}
                className="hover:bg-blue-50/50 transition cursor-pointer"
                onClick={() => setSelectedAppId(app.id)}
              >
                {/* Application Details */}
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{app.applicationNumber}</div>
                  <div className="text-[11px] text-slate-500">{app.applicationType}</div>
                  <div className="text-[10px] text-blue-700 font-medium">AY {app.academicYear} | Intake: +{app.appliedIntake}</div>
                </td>

                {/* Institution & Region */}
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900 truncate max-w-[220px]" title={app.institutionName}>
                    {app.institutionName}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">PID: {app.institutionPermanentId}</div>
                  <div className="text-[10px] text-slate-400">
                    {app.region} Region ({app.city}, {app.state})
                  </div>
                </td>

                {/* APH Route */}
                <td className="py-3 px-3">
                  <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    {app.route}
                  </span>
                </td>

                {/* Stage */}
                <td className="py-3 px-3">
                  <div className="space-y-1">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] uppercase font-bold border ${getStageBadge(app.currentStage)}`}>
                      {app.currentStage.replace(/_/g, ' ')}
                    </span>
                    {app.deficiencies.length > 0 && (
                      <div className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{app.deficiencies.filter(d => d.status === 'PENDING_CURE').length} Pending Cure</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* SLA & Ageing */}
                <td className="py-3 px-3">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-xs">
                      {app.daysPending} days pending
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Due: {app.slaDeadline}</span>
                    </div>
                  </div>
                </td>

                {/* Escalation Tier */}
                <td className="py-3 px-3">
                  {getEscalationBadge(app.escalationLevel)}
                </td>

                {/* Action */}
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedAppId(app.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#032761] text-white hover:bg-blue-900 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>Process</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
