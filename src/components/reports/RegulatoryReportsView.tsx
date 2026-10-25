'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  FileCheck2,
  Download,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  History,
  FileText,
  Search,
  Printer,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Layers,
  Award,
  Filter,
} from 'lucide-react';
import { exportApplicationsCsv, exportUndertakingsCsv, exportDocumentsCsv } from '@/lib/exportUtils';
import { generateElectronicCaseSummary } from '@/lib/workflowEngine';
import { AuditLogEntry } from '@/types';

interface ExtendedAuditEntry extends AuditLogEntry {
  applicationNumber: string;
  institutionName: string;
  region: string;
}

export function RegulatoryReportsView() {
  const { applications, evcSchedules, undertakings, documents } = useDashboard();

  const [activeTab, setActiveTab] = useState<'operational' | 'council_dossier'>('operational');
  const [selectedCaseAppId, setSelectedCaseAppId] = useState<string>(applications[0]?.id || '');
  const [generatedSummary, setGeneratedSummary] = useState<string>('');

  // Date range filters for CSV exports
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Handle server-side CSV export with date range
  const handleExportCsv = (type: 'applications' | 'undertakings' | 'documents') => {
    const params = new URLSearchParams({ type });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    window.location.href = `/api/reports/csv?${params.toString()}`;
  };

  // Regional Performance Scorecard
  const regions = ['Southern', 'Western', 'Northern', 'Eastern', 'South-West', 'Central'];
  const regionalMetrics = regions.map((reg) => {
    const regApps = applications.filter((a) => a.region === reg);
    const total = regApps.length;
    const approved = regApps.filter((a) => a.currentStage === 'APPROVED').length;
    const overdue = regApps.filter((a) => a.escalationLevel !== 'LEVEL_0_NORMAL').length;
    const avgDays = total > 0 ? Math.round(regApps.reduce((acc, a) => acc + a.daysPending, 0) / total) : 0;
    const complianceRate = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;

    return {
      region: reg,
      total,
      approved,
      overdue,
      avgDays,
      complianceRate,
    };
  });

  // Council report summaries
  const totalApps = applications.length;
  const approvedApps = applications.filter((a) => a.currentStage === 'APPROVED').length;
  const rejectedApps = applications.filter((a) => a.currentStage === 'REJECTED').length;
  const inProgressApps = totalApps - approvedApps - rejectedApps;
  const overdueApps = applications.filter((a) => a.escalationLevel !== 'LEVEL_0_NORMAL');

  // Route breakdown
  const routes = ['Only Scrutiny', 'Scrutiny + EVC', 'Only EVC', 'EVC + SAC/SHC', 'Full APH Cycle'];
  const routeBreakdown = routes.map((r) => ({
    route: r,
    total: applications.filter((a) => a.route === r).length,
    approved: applications.filter((a) => a.route === r && a.currentStage === 'APPROVED').length,
    inProgress: applications.filter((a) => a.route === r && a.currentStage !== 'APPROVED' && a.currentStage !== 'REJECTED').length,
    overdue: applications.filter((a) => a.route === r && a.escalationLevel !== 'LEVEL_0_NORMAL').length,
  }));

  // EVC metrics
  const totalEvc = evcSchedules.length;
  const completedEvc = evcSchedules.filter((e) => e.status === 'REPORT_RATIFIED' || e.status === 'VISIT_CONDUCTED').length;
  const pendingEvc = evcSchedules.filter((e) => e.status === 'PENDING_SCHEDULING' || e.status === 'PANEL_CONSTITUTED').length;
  const reportSubmittedEvc = evcSchedules.filter((e) => e.status === 'REPORT_SUBMITTED').length;

  // Undertakings metrics
  const totalUndertakings = undertakings.length;
  const verifiedUndertakings = undertakings.filter((u) => u.status === 'VERIFIED_COMPLIANT').length;
  const overdueUndertakings = undertakings.filter((u) => u.status === 'OVERDUE_ESCALATED').length;
  const pendingUndertakings = undertakings.filter((u) => u.status === 'PENDING_SUBMISSION').length;
  const resubmitUndertakings = undertakings.filter((u) => u.status === 'REJECTED_RESUBMIT').length;
  const undertakingsComplianceRate = totalUndertakings > 0 ? Math.round((verifiedUndertakings / totalUndertakings) * 100) : 100;

  // Document metrics (expiring in 90 days)
  const expiringSoonDocs = documents.filter((d) => d.status === 'EXPIRING_SOON_90D' || d.status === 'CRITICAL_30D');
  const expiredDocs = documents.filter((d) => d.status === 'EXPIRED');
  const validDocs = documents.filter((d) => d.status === 'ACTIVE_VALID');

  const handleGenerateSummary = () => {
    const targetApp = applications.find((a) => a.id === selectedCaseAppId);
    if (!targetApp) return;

    const relatedEvc = evcSchedules.find((e) => e.applicationId === targetApp.id);
    const relatedDoc = documents.find((d) => d.institutionPermanentId === targetApp.institutionPermanentId);

    const summaryText = generateElectronicCaseSummary(
      targetApp,
      relatedEvc
        ? {
            inspectionType: relatedEvc.inspectionType,
            status: relatedEvc.status,
            committeeMembers: relatedEvc.committeeMembers,
            deficienciesFound: relatedEvc.deficienciesFound,
            recommendedIntake: relatedEvc.recommendedIntake,
          }
        : undefined,
      relatedDoc
        ? {
            documentType: relatedDoc.documentType,
            status: relatedDoc.status,
            expiryDate: relatedDoc.expiryDate,
          }
        : undefined
    );

    setGeneratedSummary(summaryText);
  };

  const handleDownloadTxt = () => {
    if (!generatedSummary) return;
    const blob = new Blob([generatedSummary], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AICTE_Case_Summary_${selectedCaseAppId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Consolidated Digital Audit Vault
  const allAuditEntries: ExtendedAuditEntry[] = [];
  applications.forEach((a) => {
    a.auditTrail.forEach((log) => {
      allAuditEntries.push({
        ...log,
        applicationNumber: a.applicationNumber,
        institutionName: a.institutionName,
        region: a.region,
      });
    });
  });

  allAuditEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <div className="space-y-6">
      {/* Subtab Navigation & Print Trigger */}
      <div className="print:hidden p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('operational')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'operational'
                ? 'bg-[#032761] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Operational Reports &amp; Exports</span>
          </button>
          <button
            onClick={() => setActiveTab('council_dossier')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'council_dossier'
                ? 'bg-[#032761] text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Printable Council Dossier</span>
          </button>
        </div>

        {activeTab === 'council_dossier' && (
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm self-start md:self-auto"
          >
            <Printer className="w-4 h-4" />
            <span>Print Dossier (PDF)</span>
          </button>
        )}
      </div>

      {activeTab === 'operational' ? (
        <>
          {/* Header Banner & Date-Filtered CSV Export Toolbar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#032761] uppercase tracking-wider flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-blue-600" />
                  <span>Regulatory Reports &amp; Filtered CSV Extracts</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Export authenticated CSV datasets with optional date range filters, aligned with APH 2026-27 statutory requirements
                </p>
              </div>

              {/* Statutory Safeguard Badge */}
              <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-medium flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Statutory Extract Verified</span>
              </div>
            </div>

            {/* Date-Range Filter Controls */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span>Date Filters:</span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="csv-start-date" className="text-slate-500 font-medium text-[11px]">From:</label>
                  <input
                    id="csv-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-800"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="csv-end-date" className="text-slate-500 font-medium text-[11px]">To:</label>
                  <input
                    id="csv-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs text-slate-800"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleExportCsv('applications')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Export applications matching filter"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Applications CSV</span>
                </button>
                <button
                  onClick={() => handleExportCsv('undertakings')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Export undertakings matching filter"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Undertakings CSV</span>
                </button>
                <button
                  onClick={() => handleExportCsv('documents')}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                  title="Export land leases and NOCs matching filter"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Lease &amp; NOC CSV</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1. Regional Performance Scorecard */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-[#032761] uppercase tracking-wider">
              Region-Wise Processing Performance Scorecard
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#032761]/5 border-b border-slate-200 text-[#032761] uppercase tracking-wider font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-4">Regional Office</th>
                    <th className="py-2.5 px-3">Total Applications</th>
                    <th className="py-2.5 px-3">Ratified Approvals</th>
                    <th className="py-2.5 px-3">Escalated Overdue Cases</th>
                    <th className="py-2.5 px-3">Average Ageing</th>
                    <th className="py-2.5 px-4 text-right">SLA Compliance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {regionalMetrics.map((r) => (
                    <tr key={r.region} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{r.region} Region</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{r.total}</td>
                      <td className="py-2.5 px-3 text-emerald-700 font-semibold">{r.approved}</td>
                      <td className="py-2.5 px-3">
                        <span className={r.overdue > 0 ? 'text-red-700 font-bold' : 'text-slate-500'}>
                          {r.overdue} cases
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{r.avgDays} Days</td>
                      <td className="py-2.5 px-4 text-right">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            r.complianceRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.complianceRate}% On-Time
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. On-Demand Electronic Case Summary Compiler */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-[#032761] uppercase tracking-wider">
                  Official Electronic Case Summary Compiler
                </h3>
                <p className="text-[11px] text-slate-500">
                  Generate standardized electronic case summaries for statutory committee scrutiny and Executive Council ratification
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCaseAppId}
                  onChange={(e) => setSelectedCaseAppId(e.target.value)}
                  aria-label="Select application for case summary"
                  className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium text-xs"
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.applicationNumber} - {app.institutionName}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleGenerateSummary}
                  className="px-3.5 py-1.5 rounded-lg bg-[#032761] hover:bg-blue-900 text-white font-bold text-xs transition cursor-pointer"
                >
                  Generate Summary
                </button>
              </div>
            </div>

            {generatedSummary ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-700">Compiled Statutory Briefing:</span>
                  <button
                    onClick={handleDownloadTxt}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .TXT Brief</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto max-h-80 leading-relaxed whitespace-pre-wrap border border-slate-800">
                  {generatedSummary}
                </pre>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                Select an application above and click &quot;Generate Summary&quot; to compile the statutory briefing.
              </div>
            )}
          </div>

          {/* 3. Master Digital Audit Vault */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-600" />
              <h3 className="text-xs font-bold text-[#032761] uppercase tracking-wider">
                Consolidated Digital Audit Vault
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Chronological immutable audit log of application movements, deficiency notices, EVC appointments, and official remarks
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#032761]/5 border-b border-slate-200 text-[#032761] uppercase tracking-wider font-bold text-[10px] sticky top-0 bg-white">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Application</th>
                    <th className="py-2.5 px-3">Action Type</th>
                    <th className="py-2.5 px-3">Action Summary &amp; Remarks</th>
                    <th className="py-2.5 px-3">Acting Official</th>
                    <th className="py-2.5 px-3 text-right">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {allAuditEntries.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px] shrink-0">{log.timestamp}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        <div>{log.applicationNumber}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{log.institutionName}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold">
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-sm">
                        <div className="font-bold text-slate-800">{log.title}</div>
                        <p className="text-[11px] text-slate-600 truncate">{log.remarks}</p>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        <div className="font-semibold">{log.actorName}</div>
                        <div className="text-[10px] text-slate-400">{log.actorRole}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 text-[11px]">
                        {log.authorizedBy || 'System Engine'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* CONSOLIDATED PRINTABLE COUNCIL REPORT (DOSSIER) */
        <div id="council-print-dossier" className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none text-slate-900">
          {/* Statutory Header */}
          <div className="border-b-2 border-[#032761] pb-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-[#032761] flex items-center justify-center text-white font-bold text-xl tracking-wider shadow-sm">
                  AICTE
                </div>
                <div>
                  <h1 className="text-xl font-black text-[#032761] tracking-wide uppercase">
                    All India Council for Technical Education
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold">
                    Statutory Body under the Department of Higher Education, Ministry of Education, Govt. of India
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Nelson Mandela Marg, Vasant Kunj, New Delhi - 110070 | www.aicte-india.org
                  </p>
                </div>
              </div>
              <div className="text-right text-xs space-y-0.5">
                <div className="font-bold text-[#032761] uppercase tracking-wider">Statutory Council Dossier</div>
                <div className="font-mono text-[11px] text-slate-500">AY: 2026-2027</div>
                <div className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  OFFICIAL RECORD
                </span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#032761] bg-slate-100 py-1.5 rounded-lg border border-slate-200">
                Executive Council Consolidated Status &amp; Compliance Dossier (APH 2026-27)
              </h2>
            </div>
          </div>

          {/* Section 1: Executive KPI Snapshot */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Applications</div>
              <div className="text-2xl font-black text-[#032761]">{totalApps}</div>
              <div className="text-[10px] text-slate-500">{inProgressApps} in active workflow</div>
            </div>
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Ratified Approvals</div>
              <div className="text-2xl font-black text-emerald-700">{approvedApps}</div>
              <div className="text-[10px] text-emerald-600">Council ratified</div>
            </div>
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40">
              <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">EVC Inspections</div>
              <div className="text-2xl font-black text-blue-700">{completedEvc}/{totalEvc}</div>
              <div className="text-[10px] text-blue-600">{reportSubmittedEvc} awaiting ratification</div>
            </div>
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40">
              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Undertakings Rate</div>
              <div className="text-2xl font-black text-amber-700">{undertakingsComplianceRate}%</div>
              <div className="text-[10px] text-amber-600">{overdueUndertakings} overdue escalated</div>
            </div>
            <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/40">
              <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider">SLA Escalations</div>
              <div className="text-2xl font-black text-red-700">{overdueApps.length}</div>
              <div className="text-[10px] text-red-600">Requiring intervention</div>
            </div>
          </div>

          {/* Section 2: Application Breakdown by Route & Current Stage */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#032761] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <Layers className="w-4 h-4 text-blue-700" />
              <span>1. Applications Breakdown by Statutory Route &amp; Processing Disposition</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[#032761] font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Statutory Route</th>
                    <th className="py-2 px-3 text-center">Total Registered</th>
                    <th className="py-2 px-3 text-center">In Progress</th>
                    <th className="py-2 px-3 text-center">Ratified Approvals</th>
                    <th className="py-2 px-3 text-center">Overdue / Escalated</th>
                    <th className="py-2 px-3 text-right">Route Clearance Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routeBreakdown.map((rb) => {
                    const clearanceRate = rb.total > 0 ? Math.round((rb.approved / rb.total) * 100) : 0;
                    return (
                      <tr key={rb.route} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-800">{rb.route}</td>
                        <td className="py-2 px-3 text-center font-medium">{rb.total}</td>
                        <td className="py-2 px-3 text-center font-medium text-blue-700">{rb.inProgress}</td>
                        <td className="py-2 px-3 text-center font-semibold text-emerald-700">{rb.approved}</td>
                        <td className="py-2 px-3 text-center">
                          <span className={rb.overdue > 0 ? 'text-red-700 font-bold' : 'text-slate-400'}>
                            {rb.overdue}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-700">{clearanceRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3 & 4: EVC Inspection & Undertakings Compliance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EVC Status */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/30">
              <h3 className="text-xs font-bold text-[#032761] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                <Building2 className="w-4 h-4 text-blue-700" />
                <span>2. Expert Visit Committee (EVC) Physical / Hybrid Status</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Total Inspections Scheduled</span>
                  <span className="font-bold text-slate-800">{totalEvc}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Inspections Completed &amp; Ratified</span>
                  <span className="font-bold text-emerald-700">{completedEvc}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Reports Uploaded (Awaiting Ratification)</span>
                  <span className="font-bold text-blue-700">{reportSubmittedEvc}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Pending Scheduling / Panel Constitution</span>
                  <span className="font-bold text-amber-700">{pendingEvc}</span>
                </div>
              </div>
            </div>

            {/* Time-Bound Undertakings Status */}
            <div className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/30">
              <h3 className="text-xs font-bold text-[#032761] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>3. Time-Bound Undertakings Statutory Compliance</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Total Statutory Undertakings Monitored</span>
                  <span className="font-bold text-slate-800">{totalUndertakings}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Fully Complied &amp; Verified</span>
                  <span className="font-bold text-emerald-700">{verifiedUndertakings}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Resubmission Required (Deficient Proof)</span>
                  <span className="font-bold text-amber-700">{resubmitUndertakings}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-600">Overdue Escalated (Grace Period Expired)</span>
                  <span className="font-bold text-red-700">{overdueUndertakings}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: 30-Year Land Lease & NOC 90-Day Renewal Alert Matrix */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#032761] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>4. Mandatory 30-Year Land Lease &amp; State NOC 90-Day Expiry Radar</span>
            </h3>
            <div className="text-[11px] text-slate-600">
              Monitored: <strong className="text-slate-900">{documents.length}</strong> statutory documents | Valid: <strong className="text-emerald-700">{validDocs.length}</strong> | Expiring within 90 days: <strong className="text-amber-700">{expiringSoonDocs.length}</strong> | Expired: <strong className="text-red-700">{expiredDocs.length}</strong>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[#032761] font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Permanent ID</th>
                    <th className="py-2 px-3">Institution Name</th>
                    <th className="py-2 px-3">Region</th>
                    <th className="py-2 px-3">Document Type</th>
                    <th className="py-2 px-3">Expiry Date</th>
                    <th className="py-2 px-3">Compliance Status</th>
                    <th className="py-2 px-3 text-right">Notice Served</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.filter((d) => d.status !== 'ACTIVE_VALID').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-3 px-3 text-center text-slate-400">
                        All monitored land leases and statutory NOCs are currently active and valid.
                      </td>
                    </tr>
                  ) : (
                    documents
                      .filter((d) => d.status !== 'ACTIVE_VALID')
                      .map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-[11px] font-bold text-slate-800">{doc.institutionPermanentId}</td>
                          <td className="py-2 px-3 font-semibold text-slate-900">{doc.institutionName}</td>
                          <td className="py-2 px-3 text-slate-600">{doc.region}</td>
                          <td className="py-2 px-3 text-slate-700">{doc.documentType}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-700">{doc.expiryDate}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                doc.status === 'CRITICAL_30D' || doc.status === 'EXPIRED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-700">
                            {doc.escalationNoticeServed ? 'YES (SERVED)' : 'PENDING'}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6: Overdue Cases Requiring Statutory Council Intervention */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#032761] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              <span>5. Overdue Cases Requiring Executive Council Statutory Decision</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[#032761] font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Application No</th>
                    <th className="py-2 px-3">Institution Name</th>
                    <th className="py-2 px-3">Region</th>
                    <th className="py-2 px-3">Route</th>
                    <th className="py-2 px-3">Stage</th>
                    <th className="py-2 px-3">Pending Days</th>
                    <th className="py-2 px-3">Escalation Tier</th>
                    <th className="py-2 px-3 text-right">Statutory Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueApps.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-3 px-3 text-center text-slate-400">
                        Zero overdue cases. All active applications are processing within configured APH timelines.
                      </td>
                    </tr>
                  ) : (
                    overdueApps.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{app.applicationNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{app.institutionName}</td>
                        <td className="py-2 px-3 text-slate-600">{app.region}</td>
                        <td className="py-2 px-3 text-slate-700">{app.route}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-bold">
                            {app.currentStage}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-red-700 font-bold">{app.daysPending}d</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              app.escalationLevel === 'LEVEL_3_MEMBER_SECRETARY'
                                ? 'bg-red-700 text-white'
                                : app.escalationLevel === 'LEVEL_2_BUREAU'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {app.escalationLevel}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-800 text-[11px]">
                          {app.escalationLevel === 'LEVEL_3_MEMBER_SECRETARY'
                            ? 'Executive Council Hearing'
                            : app.escalationLevel === 'LEVEL_2_BUREAU'
                            ? 'Bureau Notice & Expedite'
                            : 'Regional Follow-Up'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 7: Region-Wise Processing Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#032761] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
              <Award className="w-4 h-4 text-blue-700" />
              <span>6. Regional Performance Scorecard &amp; Ageing Summary</span>
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-[#032761] font-bold text-[10px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Regional Office</th>
                    <th className="py-2 px-3 text-center">Total Volume</th>
                    <th className="py-2 px-3 text-center">Approvals</th>
                    <th className="py-2 px-3 text-center">Overdue Cases</th>
                    <th className="py-2 px-3 text-center">Average Ageing</th>
                    <th className="py-2 px-3 text-right">SLA On-Time Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regionalMetrics.map((r) => (
                    <tr key={r.region} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">{r.region} Region</td>
                      <td className="py-2 px-3 text-center font-semibold text-slate-800">{r.total}</td>
                      <td className="py-2 px-3 text-center text-emerald-700 font-semibold">{r.approved}</td>
                      <td className="py-2 px-3 text-center font-bold text-red-700">{r.overdue}</td>
                      <td className="py-2 px-3 text-center font-mono">{r.avgDays} Days</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">{r.complianceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 8: Statutory Regulatory Safeguard Clause */}
          <div className="p-4 rounded-xl border-2 border-amber-300 bg-amber-50/70 text-slate-900 space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-900 text-xs uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-amber-800" />
              <span>Statutory Regulatory Safeguard Clause (APH 2026-27 Mandate)</span>
            </div>
            <p className="text-[11px] text-amber-950 leading-relaxed text-justify">
              <strong>REGULATORY SAFEGUARD NOTE:</strong> In accordance with the AICTE Approval Process Handbook (APH 2026-27), automated workflow notifications, algorithmic compliance sweeps, and SLA escalation tracking are decision-support mechanisms to enforce statutory timelines. They shall <strong>not supplant</strong> the statutory appraisal, inspection, and quasi-judicial authority reserved for the Scrutiny Committee, Expert Visit Committee (EVC), Standing Appellate Committee (SAC), Standing Hearing Committee (SHC), and the sovereign determinations of the Executive Council under the All India Council for Technical Education Act, 1987. All approvals reflected in this dossier remain provisional until formal ratification by the Council.
            </p>
          </div>

          {/* Section 9: Official Signatures Block */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-8 text-center text-xs">
            <div className="space-y-10">
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                Regional Officer / Member Convener
                <div className="text-[10px] font-normal text-slate-500">AICTE Regional Office</div>
              </div>
            </div>
            <div className="space-y-10">
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                Adviser (Approval Bureau)
                <div className="text-[10px] font-normal text-slate-500">AICTE Headquarters, New Delhi</div>
              </div>
            </div>
            <div className="space-y-10">
              <div className="h-10"></div>
              <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-800">
                Member Secretary / Vice Chairman
                <div className="text-[10px] font-normal text-slate-500">AICTE Executive Council</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
