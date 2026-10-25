'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  CalendarCheck2,
  Users,
  Building2,
  FileCheck2,
  Clock,
  AlertTriangle,
  Upload,
  Plus,
  CheckCircle2,
  ExternalLink,
  Lock,
  Sparkles,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';
import { EvcMember } from '@/types';

export function EvcScheduleManager() {
  const {
    evcSchedules,
    rawApplications,
    scheduleEvc,
    submitEvcReport,
    ratifyEvcReport,
    currentRole,
    hasPermission,
    currentUser,
    setSelectedAppId,
  } = useDashboard();

  const [selectedEvcId, setSelectedEvcId] = useState<string | null>(null);
  const [selectedAppForSchedule, setSelectedAppForSchedule] = useState<any | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showRatifyModal, setShowRatifyModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [uploadedReportUrl, setUploadedReportUrl] = useState<string | null>(null);

  // Scheduling Form State
  const [inspectionType, setInspectionType] = useState<'PHYSICAL_INSPECTION' | 'SURPRISE_INSPECTION' | 'VIRTUAL_VERIFICATION'>('PHYSICAL_INSPECTION');
  const [scheduledDate, setScheduledDate] = useState(new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]);
  const [chairName, setChairName] = useState('Dr. K. Natarajan');
  const [chairAffiliation, setChairAffiliation] = useState('NIT Trichy');
  const [nomineeName, setNomineeName] = useState('Prof. R. Meenakshi');
  const [nomineeAffiliation, setNomineeAffiliation] = useState('Anna University, Chennai');

  // Report Form State
  const [deficienciesFound, setDeficienciesFound] = useState(false);
  const [reportSummary, setReportSummary] = useState('Physical inspection conducted. Campus infrastructure and laboratory setups meet APH Chapter IV norms.');
  const [recommendedIntake, setRecommendedIntake] = useState(60);

  // Ratification State
  const [ratifyRemarks, setRatifyRemarks] = useState('EVC inspection findings verified and ratified compliant with statutory APH norms.');

  const activeEvc = evcSchedules.find(e => e.id === selectedEvcId);

  const canSchedule = hasPermission('SCHEDULE_EVC_PANEL') || hasPermission('ALL_PERMISSIONS');
  const canUploadReport = hasPermission('SUBMIT_EVC_REPORT') || hasPermission('ALL_PERMISSIONS') || currentRole === 'EVC_CHAIR';
  const canRatify = ['SUPER_ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER'].includes(currentRole) || hasPermission('GRANT_STATUTORY_APPROVAL');

  // Phase 5 Item 23: Clear "Awaiting EVC" queue
  // Applications that require an EVC, currently in EVC_SCHEDULED, sorted by priority, New Institution highlighted
  const priorityRank: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const awaitingEvcApps = rawApplications
    .filter(app => {
      if (app.currentStage !== 'EVC_SCHEDULED') return false;
      if (currentUser?.role === 'REGIONAL_OFFICER' && currentUser.region && app.region !== currentUser.region) return false;
      const existing = evcSchedules.find(e => e.applicationId === app.id);
      return !existing || existing.status === 'PENDING_SCHEDULING';
    })
    .sort((a, b) => {
      if (a.applicationType === 'New Technical Institution' && b.applicationType !== 'New Technical Institution') return -1;
      if (b.applicationType === 'New Technical Institution' && a.applicationType !== 'New Technical Institution') return 1;
      return (priorityRank[b.priority] || 1) - (priorityRank[a.priority] || 1);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReport(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'EVC');
      formData.append('entityId', activeEvc?.id || 'evc-temp');

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.fileUrl) {
        setUploadedReportUrl(data.fileUrl);
        setStatusMessage({ text: `EVC Report document "${file.name}" uploaded successfully.`, error: false });
      } else {
        setStatusMessage({ text: data.error || 'Failed to upload report document', error: true });
      }
    } catch {
      setStatusMessage({ text: 'Error uploading file', error: true });
    } finally {
      setUploadingReport(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAppId = selectedAppForSchedule?.id || activeEvc?.applicationId;
    if (!targetAppId) return;

    const members: EvcMember[] = [
      {
        name: chairName,
        designation: 'Inspection Chairman',
        affiliation: chairAffiliation,
        specialization: 'Core Discipline & Infrastructure',
        contact: 'chair@evc-aicte.org',
      },
      {
        name: nomineeName,
        designation: 'AICTE Council Nominee',
        affiliation: nomineeAffiliation,
        specialization: 'Regulatory Compliance',
        contact: 'nominee@evc-aicte.org',
      },
    ];

    setIsProcessing(true);
    const res = await scheduleEvc(targetAppId, inspectionType, scheduledDate, members);
    setIsProcessing(false);
    if (!res.success) {
      setStatusMessage({ text: res.message, error: true });
    } else {
      setStatusMessage({ text: res.message, error: false });
      setShowScheduleModal(false);
      setSelectedAppForSchedule(null);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvc) return;
    setIsProcessing(true);
    const res = await submitEvcReport(activeEvc.id, deficienciesFound, reportSummary, recommendedIntake, uploadedReportUrl || undefined);
    setIsProcessing(false);
    if (!res.success) {
      setStatusMessage({ text: res.message, error: true });
    } else {
      setStatusMessage({ text: res.message, error: false });
      setShowReportModal(false);
      setUploadedReportUrl(null);
    }
  };

  const handleRatifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvc) return;
    setIsProcessing(true);
    const res = await ratifyEvcReport(activeEvc.id, true, ratifyRemarks);
    setIsProcessing(false);
    if (!res.success) {
      setStatusMessage({ text: res.message, error: true });
    } else {
      setStatusMessage({ text: res.message, error: false });
      setShowRatifyModal(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#032761] uppercase tracking-wider flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-blue-600" />
            <span>Expert Visit Committee (EVC) Inspection Desk</span>
          </h2>
          <p className="text-xs text-slate-500">
            APH Chapter II on-site verification, surprise checks, panel appointments, and inspection report ratification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-200">
            {evcSchedules.filter(e => e.status !== 'REPORT_RATIFIED').length} Pending Inspections
          </span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
            statusMessage.error
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.error ? <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
        </div>
      )}

      {/* Phase 5 Item 23: Section C Priority Queue - Awaiting EVC Panel */}
      {awaitingEvcApps.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Priority Queue: Awaiting EVC Panel Constitution ({awaitingEvcApps.length} Applications)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
              Post-Scrutiny Mandated Queue
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {awaitingEvcApps.map(app => {
              const isNewInst = app.applicationType === 'New Technical Institution';
              return (
                <div
                  key={app.id}
                  className={`p-3 rounded-xl border bg-white shadow-xs flex items-center justify-between gap-3 ${
                    isNewInst ? 'border-purple-400 ring-2 ring-purple-100' : 'border-amber-200'
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">{app.applicationNumber}</span>
                      {isNewInst && (
                        <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 animate-pulse">
                          ★ New Technical Institution
                        </span>
                      )}
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        app.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {app.priority} Priority
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-700 truncate">{app.institutionName}</div>
                    <div className="text-[10px] text-slate-400">
                      {app.region} Region &bull; SLA Target: <span className="font-mono text-slate-600">{app.slaDeadline}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedAppId(app.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-[10px] font-semibold"
                      title="View Application Dossier"
                    >
                      Dossier
                    </button>

                    {canSchedule && (
                      <button
                        onClick={() => {
                          setSelectedAppForSchedule(app);
                          setShowScheduleModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#032761] hover:bg-blue-900 text-white font-bold text-xs shadow-xs cursor-pointer"
                      >
                        Constitute Panel
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inspection Panels Master Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Scheduled &amp; Conducted EVC Panels</span>
          <span className="text-[11px] text-slate-400 font-mono">{evcSchedules.length} Total Registered Panels</span>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#032761]/5 border-b border-slate-200 text-[#032761] uppercase tracking-wider font-bold text-[11px]">
            <tr>
              <th className="py-3 px-4">Application &amp; Institution</th>
              <th className="py-3 px-3">Inspection Mode</th>
              <th className="py-3 px-3">EVC Status</th>
              <th className="py-3 px-3">Inspection Date</th>
              <th className="py-3 px-3">Panel Composition</th>
              <th className="py-3 px-3">Report SLA</th>
              <th className="py-3 px-4 text-right">Statutory Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {evcSchedules.map(evc => (
              <tr key={evc.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-slate-900">{evc.applicationNumber}</div>
                  <div className="text-slate-600 font-medium">{evc.institutionName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">PID: {evc.institutionPermanentId} | {evc.region}</div>
                  {evc.escalationTriggered && (
                    <div className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{evc.delayReason || 'Inspection delayed past statutory SLA'}</span>
                    </div>
                  )}
                </td>

                <td className="py-3 px-3">
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 font-semibold text-[10px]">
                    {evc.inspectionType.replace(/_/g, ' ')}
                  </span>
                </td>

                <td className="py-3 px-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    evc.status === 'REPORT_RATIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : evc.status === 'REPORT_SUBMITTED'
                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                      : evc.status === 'PANEL_CONSTITUTED'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {evc.status.replace(/_/g, ' ')}
                  </span>
                </td>

                <td className="py-3 px-3 font-mono font-medium text-slate-800">
                  {evc.scheduledDate || <span className="text-slate-400 italic">Not set</span>}
                </td>

                <td className="py-3 px-3">
                  {evc.committeeMembers.length > 0 ? (
                    <div className="text-[11px]">
                      <strong className="text-slate-800">{evc.committeeMembers[0].name}</strong> (Chair)
                      <div className="text-[10px] text-slate-500">+{evc.committeeMembers.length - 1} Panel Members</div>
                    </div>
                  ) : (
                    <span className="text-amber-700 font-semibold text-[10px]">Panel pending appointment</span>
                  )}
                </td>

                <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                  {evc.slaReportDeadline}
                </td>

                <td className="py-3 px-4 text-right space-x-1.5">
                  {evc.status === 'PENDING_SCHEDULING' && canSchedule && (
                    <button
                      onClick={() => {
                        setSelectedEvcId(evc.id);
                        setShowScheduleModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Constitute Panel
                    </button>
                  )}

                  {evc.status === 'PANEL_CONSTITUTED' && canUploadReport && (
                    <button
                      onClick={() => {
                        setSelectedEvcId(evc.id);
                        setShowReportModal(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Upload EVC Report
                    </button>
                  )}

                  {evc.status === 'REPORT_SUBMITTED' && (
                    canRatify ? (
                      <button
                        onClick={() => {
                          setSelectedEvcId(evc.id);
                          setShowRatifyModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Ratify Report</span>
                      </button>
                    ) : (
                      <span className="text-purple-700 font-bold text-xs">Awaiting Ratification</span>
                    )
                  )}

                  {evc.status === 'REPORT_RATIFIED' && (
                    <span className="text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ratified &amp; Concluded
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Panel Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full space-y-4 border border-slate-200 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Constitute Expert Visit Committee (EVC)</h3>
                <p className="text-[11px] text-slate-500">Appoint 2-3 member expert panel pursuant to APH Chapter II</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Inspection Mode:</label>
                <select
                  value={inspectionType}
                  onChange={e => setInspectionType(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="PHYSICAL_INSPECTION">PHYSICAL_INSPECTION (Full Campus &amp; Labs Audit)</option>
                  <option value="SURPRISE_INSPECTION">SURPRISE_INSPECTION (Random Infrastructure &amp; Biometric Audit)</option>
                  <option value="VIRTUAL_VERIFICATION">VIRTUAL_VERIFICATION (Live Geo-Tagged Video Stream)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Scheduled Inspection Date:</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Inspection Chairman:</label>
                  <input
                    type="text"
                    value={chairName}
                    onChange={e => setChairName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Chair Affiliation:</label>
                  <input
                    type="text"
                    value={chairAffiliation}
                    onChange={e => setChairAffiliation(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">AICTE Council Nominee:</label>
                  <input
                    type="text"
                    value={nomineeName}
                    onChange={e => setNomineeName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nominee University:</label>
                  <input
                    type="text"
                    value={nomineeAffiliation}
                    onChange={e => setNomineeAffiliation(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-[#032761] hover:bg-blue-900 text-white font-bold"
                >
                  Issue Formal EVC Order &amp; Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Report Modal */}
      {showReportModal && activeEvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full space-y-4 border border-slate-200 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Upload Certified EVC Inspection Findings</h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Inspection Outcome:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="defFound"
                      checked={!deficienciesFound}
                      onChange={() => setDeficienciesFound(false)}
                    />
                    <span className="font-semibold text-emerald-700">Recommended (Clean / Norms Satisfied)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="defFound"
                      checked={deficienciesFound}
                      onChange={() => setDeficienciesFound(true)}
                    />
                    <span className="font-semibold text-rose-700">Deficiencies Observed</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Recommended Sanctioned Intake:</label>
                <input
                  type="number"
                  value={recommendedIntake}
                  onChange={e => setRecommendedIntake(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Panel Observations &amp; Verification Remarks:</label>
                <textarea
                  rows={3}
                  value={reportSummary}
                  onChange={e => setReportSummary(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  required
                />
              </div>

              {/* Real file upload (Phase 4 Item 21) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Certified Inspection Report (PDF/JPG/PNG):</label>
                <label className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{uploadedReportUrl ? 'Certified Report Attached ✓' : 'Select Official PDF Report (Max 10MB)'}</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadingReport && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || uploadingReport}
                  className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  Submit Report for Council Ratification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ratify Report Modal (Phase 1 Item 6) */}
      {showRatifyModal && activeEvc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full space-y-4 border border-slate-200 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Official Ratification of EVC Inspection Report</h3>
              <button onClick={() => setShowRatifyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleRatifySubmit} className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
                <div className="font-bold text-slate-900">{activeEvc.applicationNumber} &bull; {activeEvc.institutionName}</div>
                <div>Inspection Findings: <strong>{activeEvc.deficienciesFound ? 'Deficiencies Found' : 'Clean / Satisfactory'}</strong></div>
                <div>Recommended Intake: <strong>{activeEvc.recommendedIntake ?? 'Unchanged'} seats</strong></div>
                <div className="text-[11px] text-slate-500 italic mt-1">"{activeEvc.deficiencySummary}"</div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Official Council Ratification Remarks:</label>
                <textarea
                  rows={2}
                  value={ratifyRemarks}
                  onChange={e => setRatifyRemarks(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRatifyModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Ratify &amp; Advance to EVC_COMPLETED
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
