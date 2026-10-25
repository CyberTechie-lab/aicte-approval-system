'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { AlertTriangle, Clock, ArrowRight, UserCheck, Flame } from 'lucide-react';

export function AnalyticsCharts() {
  const { applications, undertakings, documents, rawApplications, setSelectedAppId } = useDashboard();
  const [activeView, setActiveView] = useState<'OVERVIEW' | 'BOTTLENECKS'>('OVERVIEW');

  // 1. Regional Workload Breakdown
  const regionCounts: Record<string, { total: number; pending: number; overdue: number }> = {
    Southern: { total: 0, pending: 0, overdue: 0 },
    Western: { total: 0, pending: 0, overdue: 0 },
    Northern: { total: 0, pending: 0, overdue: 0 },
    Eastern: { total: 0, pending: 0, overdue: 0 },
    'South-West': { total: 0, pending: 0, overdue: 0 },
    Central: { total: 0, pending: 0, overdue: 0 },
  };

  applications.forEach(app => {
    const reg = regionCounts[app.region] ? app.region : 'Southern';
    regionCounts[reg].total += 1;
    if (app.currentStage !== 'APPROVED' && app.currentStage !== 'REJECTED') {
      regionCounts[reg].pending += 1;
    }
    if (app.escalationLevel !== 'LEVEL_0_NORMAL') {
      regionCounts[reg].overdue += 1;
    }
  });

  const regionalData = Object.entries(regionCounts).map(([region, counts]) => ({
    region,
    Total: counts.total,
    Pending: counts.pending,
    Escalated: counts.overdue,
  }));

  // 2. Stage Funnel Breakdown
  const stageCounts: Record<string, number> = {
    Scrutiny: 0,
    'EVC Queue': 0,
    'Appellate SAC': 0,
    'Deficiency Cure': 0,
    Approved: 0,
  };

  applications.forEach(app => {
    if (app.currentStage === 'SCRUTINY' || app.currentStage === 'RE_SCRUTINY') stageCounts['Scrutiny']++;
    else if (app.currentStage === 'EVC_SCHEDULED' || app.currentStage === 'EVC_COMPLETED') stageCounts['EVC Queue']++;
    else if (app.currentStage === 'SAC_SHC_REVIEW') stageCounts['Appellate SAC']++;
    else if (app.currentStage === 'REVERTED_DEFICIENCY') stageCounts['Deficiency Cure']++;
    else if (app.currentStage === 'APPROVED') stageCounts['Approved']++;
  });

  const stageData = Object.entries(stageCounts).map(([name, value]) => ({ name, value }));
  const STAGE_COLORS = ['#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#10B981'];

  // 3. Undertakings Health
  const undertakingCounts = {
    'Verified Compliant': undertakings.filter(u => u.status === 'VERIFIED_COMPLIANT').length,
    'Evidence Uploaded': undertakings.filter(u => u.status === 'SUBMITTED_PENDING_VERIFICATION').length,
    'Pending Submission': undertakings.filter(u => u.status === 'PENDING_SUBMISSION').length,
    'Overdue Default': undertakings.filter(u => u.status === 'OVERDUE_ESCALATED').length,
  };

  const undertakingData = Object.entries(undertakingCounts).map(([name, value]) => ({ name, value }));
  const UNDERTAKING_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#DC2626'];

  // 4. Document Validity Horizon
  const docCounts = {
    'Active & Valid': documents.filter(d => d.status === 'ACTIVE_VALID').length,
    'Expiring Soon (90D)': documents.filter(d => d.status === 'EXPIRING_SOON_90D').length,
    'Critical Radar (30D)': documents.filter(d => d.status === 'CRITICAL_30D').length,
    'Expired (Breach)': documents.filter(d => d.status === 'EXPIRED').length,
  };

  const docData = Object.entries(docCounts).map(([name, value]) => ({ name, value }));
  const DOC_COLORS = ['#10B981', '#F59E0B', '#F97316', '#DC2626'];

  // =========================================================================
  // Phase 5 Item 22: Bottleneck Analytics Calculations
  // =========================================================================
  const activeApps = applications.filter(a => a.currentStage !== 'APPROVED' && a.currentStage !== 'REJECTED');

  // a. Pending count per assignedOfficer
  const officerWorkloadMap = new Map<string, number>();
  activeApps.forEach(a => {
    const key = a.assignedOfficer.split('(')[0].trim();
    officerWorkloadMap.set(key, (officerWorkloadMap.get(key) || 0) + 1);
  });
  const officerWorkloadData = Array.from(officerWorkloadMap.entries())
    .map(([officer, count]) => ({ officer, Pending: count }))
    .sort((a, b) => b.Pending - a.Pending);

  // b. Average days per stage
  const stageAgeingMap = new Map<string, { totalDays: number; count: number }>();
  activeApps.forEach(a => {
    const entry = stageAgeingMap.get(a.currentStage) || { totalDays: 0, count: 0 };
    entry.totalDays += a.daysPending;
    entry.count += 1;
    stageAgeingMap.set(a.currentStage, entry);
  });
  const avgDaysPerStageData = Array.from(stageAgeingMap.entries()).map(([stage, { totalDays, count }]) => ({
    stage: stage.replace(/_/g, ' '),
    AvgDays: Math.round(totalDays / count),
    Cases: count,
  }));

  // c. Top 5 oldest pending cases
  const oldestCases = [...activeApps]
    .sort((a, b) => b.daysPending - a.daysPending)
    .slice(0, 5);

  // d. Region-wise On-Time vs Overdue percentage
  const regionPerformanceData = Object.entries(regionCounts)
    .filter(([_, counts]) => counts.total > 0)
    .map(([region, counts]) => {
      const onTime = Math.max(0, counts.total - counts.overdue);
      const onTimePct = Math.round((onTime / counts.total) * 100);
      const overduePct = Math.round((counts.overdue / counts.total) * 100);
      return {
        region,
        'On-Time %': onTimePct,
        'Overdue %': overduePct,
      };
    });

  return (
    <div className="space-y-4">
      {/* Switcher Tabs */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
          <button
            onClick={() => setActiveView('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              activeView === 'OVERVIEW' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Statutory Workload &amp; Funnel Radar
          </button>
          <button
            onClick={() => setActiveView('BOTTLENECKS')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeView === 'BOTTLENECKS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Bottleneck &amp; Officer Workload View</span>
          </button>
        </div>
      </div>

      {activeView === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Regional Workload Chart */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#032761]">
                  Regional Workload &amp; Escalation Distribution
                </h3>
                <p className="text-[11px] text-slate-500">
                  Comparative pending vs escalated volume across AICTE Regional Offices
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="region" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Total" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Escalated" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stage-Wise Processing Funnel */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#032761]">
                  Stage-Wise Processing Pipeline
                </h3>
                <p className="text-[11px] text-slate-500">
                  Applications actively distributed across statutory APH approval stages
                </p>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {stageData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Undertakings Health */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#032761]">
                  Time-Bound Undertakings Health
                </h3>
                <p className="text-[11px] text-slate-500">
                  Institutional fulfillment of conditional approval conditions (GPU, RPwD, FDR)
                </p>
              </div>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={undertakingData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {undertakingData.map((_, index) => (
                      <Cell key={`cell-und-${index}`} fill={UNDERTAKING_COLORS[index % UNDERTAKING_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Document Validity Sentinel */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#032761]">
                  Document &amp; 30-Year Lease Expiry Radar
                </h3>
                <p className="text-[11px] text-slate-500">
                  Surveillance of registered land deeds, Fire NOC, and structural stability certificates
                </p>
              </div>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={docData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {docData.map((_, index) => (
                      <Cell key={`cell-doc-${index}`} fill={DOC_COLORS[index % DOC_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BOTTLENECK & WORKLOAD BREAKDOWN (Phase 5 Item 22) */}
      {activeView === 'BOTTLENECKS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Officer Workload */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#032761]">
                  Workload per Assigned Officer
                </h3>
                <p className="text-[11px] text-slate-500">Active pending applications assigned per authority</p>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={officerWorkloadData} layout="vertical" margin={{ left: 20, right: 10, top: 10, bottom: 0 }}>
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="officer" type="category" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    <Bar dataKey="Pending" fill="#0284c7" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Average Days per Stage */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#032761]">
                  Average Ageing Days per Stage
                </h3>
                <p className="text-[11px] text-slate-500">Historical duration spent across active APH stages</p>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={avgDaysPerStageData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="stage" tick={{ fontSize: 9 }} interval={0} angle={-15} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    <Bar dataKey="AvgDays" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Region-wise On-Time vs Overdue % */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#032761]">
                  Regional Compliance Ratio (%)
                </h3>
                <p className="text-[11px] text-slate-500">On-Time vs SLA Overdue percentage by Region</p>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionPerformanceData} margin={{ left: -15, right: 10, top: 10, bottom: 0 }}>
                    <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="On-Time %" stackId="a" fill="#10b981" />
                    <Bar dataKey="Overdue %" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top 5 Oldest Pending Cases */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#032761] flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-red-600" />
                  <span>Top 5 Oldest Pending Cases Across Regions</span>
                </h3>
                <p className="text-[11px] text-slate-500">High-priority bottlenecks requiring immediate administrative intervention</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#032761]/5 border-b border-slate-200 text-[#032761] uppercase tracking-wider font-bold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Application No</th>
                    <th className="py-2.5 px-3">Institution Name</th>
                    <th className="py-2.5 px-3">Region</th>
                    <th className="py-2.5 px-3">Current Stage</th>
                    <th className="py-2.5 px-3">Ageing Days</th>
                    <th className="py-2.5 px-3">Escalation Tier</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {oldestCases.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{c.applicationNumber}</td>
                      <td className="py-2.5 px-3 font-medium">{c.institutionName}</td>
                      <td className="py-2.5 px-3">{c.region}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-800">
                          {c.currentStage}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-red-700">{c.daysPending} Days</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.escalationLevel === 'LEVEL_3_MEMBER_SECRETARY'
                            ? 'bg-rose-100 text-rose-800 animate-pulse'
                            : c.escalationLevel === 'LEVEL_2_BUREAU'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {c.escalationLevel.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedAppId(c.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#032761] hover:bg-blue-900 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-xs"
                        >
                          <span>Open Dossier</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
