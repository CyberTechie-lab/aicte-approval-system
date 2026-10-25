'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  X,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Send,
  Download,
  ShieldCheck,
  AlertOctagon,
  History,
  FileCheck2,
  Lock,
  Upload,
  Check,
  XCircle,
  Loader2,
} from 'lucide-react';
import { generateElectronicCaseSummary } from '@/lib/workflowEngine';
import { ApprovalStage } from '@/types';

export function ApplicationDetailModal() {
  const {
    selectedApplication,
    setSelectedAppId,
    advanceStage,
    revertDeficiency,
    cureDeficiency,
    verifyDeficiencyCure,
    evcSchedules,
    documents,
    currentRole,
    currentUser,
    hasPermission,
    aphConfig,
  } = useDashboard();

  const [transitionStage, setTransitionStage] = useState<ApprovalStage>('EVC_SCHEDULED');
  const [transitionRemarks, setTransitionRemarks] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Deficiency Revert form state
  const [showRevertForm, setShowRevertForm] = useState(false);
  const [defClause, setDefClause] = useState('APH Clause 4.2(b)');
  const [defCategory, setDefCategory] = useState<string>('Land & Building');
  const [defDesc, setDefDesc] = useState('');
  const [cureDays, setCureDays] = useState(aphConfig.deficiencyCurePeriodDays || 15);

  // Deficiency Cure & Verification interactive states
  const [cureResponseText, setCureResponseText] = useState<{ [defId: string]: string }>({});
  const [verifyRemarksText, setVerifyRemarksText] = useState<{ [defId: string]: string }>({});
  const [uploadingDefId, setUploadingDefId] = useState<string | null>(null);
  const [uploadedDocUrls, setUploadedDocUrls] = useState<{ [defId: string]: string }>({});

  if (!selectedApplication) return null;

  const app = selectedApplication;
  const relatedEvc = evcSchedules.find(e => e.applicationId === app.id);
  const relatedDoc = documents.find(d => d.institutionPermanentId === app.institutionPermanentId);

  // Regional Tenancy Check
  const isOutOfJurisdiction = currentUser?.role === 'REGIONAL_OFFICER' && currentUser.region && app.region !== currentUser.region;
  const isApplicantInstitution = currentUser?.role === 'INSTITUTION_PRINCIPAL' && currentUser.institutionPermanentId === app.institutionPermanentId;

  const handleAdvance = async (targetStage: ApprovalStage) => {
    setStatusMessage(null);
    setIsProcessing(true);
    const res = await advanceStage(app.id, targetStage, transitionRemarks);
    setIsProcessing(false);
    if (!res.success) {
      setStatusMessage({ text: res.message, error: true });
    } else {
      setStatusMessage({ text: res.message, error: false });
      setTransitionRemarks('');
    }
  };

  const handleIssueRevert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!defDesc.trim()) return;
    setIsProcessing(true);
    const res = await revertDeficiency(app.id, defClause, defDesc, defCategory, cureDays);
    setIsProcessing(false);
    if (!res.success) {
      setStatusMessage({ text: res.message, error: true });
    } else {
      setShowRevertForm(false);
      setDefDesc('');
      setStatusMessage({ text: res.message, error: false });
    }
  };

  const handleFileUpload = async (defId: string, file: File) => {
    setUploadingDefId(defId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'DEFICIENCY');
      formData.append('entityId', defId);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.fileUrl) {
        setUploadedDocUrls(prev => ({ ...prev, [defId]: data.fileUrl }));
        setStatusMessage({ text: `File "${file.name}" uploaded successfully (SHA-256 verified).`, error: false });
      } else {
        setStatusMessage({ text: data.error || 'File upload failed', error: true });
      }
    } catch {
      setStatusMessage({ text: 'Error uploading file to server', error: true });
    } finally {
      setUploadingDefId(null);
    }
  };

  const handleCureSubmit = async (defId: string) => {
    const note = cureResponseText[defId] || '';
    if (!note.trim()) {
      setStatusMessage({ text: 'Please provide an explanatory response for the cure.', error: true });
      return;
    }
    setIsProcessing(true);
    const docUrl = uploadedDocUrls[defId];
    const res = await cureDeficiency(app.id, defId, note, docUrl);
    setIsProcessing(false);
    if (res.success) {
      setStatusMessage({ text: res.message, error: false });
      setCureResponseText(prev => ({ ...prev, [defId]: '' }));
    } else {
      setStatusMessage({ text: res.message, error: true });
    }
  };

  const handleVerifyCure = async (defId: string, accepted: boolean) => {
    const remarks = verifyRemarksText[defId] || (accepted ? 'Verified compliant upon scrutiny' : 'Deficiency evidence insufficient');
    setIsProcessing(true);
    const res = await verifyDeficiencyCure(app.id, defId, accepted, remarks);
    setIsProcessing(false);
    if (res.success) {
      setStatusMessage({ text: res.message, error: false });
      setVerifyRemarksText(prev => ({ ...prev, [defId]: '' }));
    } else {
      setStatusMessage({ text: res.message, error: true });
    }
  };

  const downloadCaseSummary = () => {
    const summaryText = generateElectronicCaseSummary(
      app,
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

    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AICTE_Case_Summary_${app.applicationNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#032761] text-white p-4 sm:p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-800 text-blue-200 border border-blue-700">
                AY {app.academicYear}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-emerald-300">
                {app.route}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{app.applicationNumber}</span>
              <span className="text-xs font-normal text-blue-200 hidden sm:inline">&bull; {app.institutionName}</span>
            </h2>
            <p className="text-xs text-blue-200">
              {app.applicationType} &bull; {app.city}, {app.state} ({app.region} Region) &bull; Permanent ID: {app.institutionPermanentId}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={downloadCaseSummary}
              className="px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
              title="Download Certified AICTE Electronic Case Summary"
            >
              <Download className="w-3.5 h-3.5 text-blue-300" />
              <span className="hidden sm:inline">Case Summary</span>
            </button>
            <button
              onClick={() => setSelectedAppId(null)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-800 text-xs">
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
              statusMessage.error ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <div className="flex items-center gap-2">
                {statusMessage.error ? <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
              <button onClick={() => setStatusMessage(null)} className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer">Dismiss</button>
            </div>
          )}

          {/* Out of Regional Jurisdiction Warning */}
          {isOutOfJurisdiction && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Regional Read-Only View:</strong> You are authorized for <strong>{currentUser?.region} Region</strong>. This application belongs to the <strong>{app.region} Region</strong>. Stage mutations and revert decisions are restricted.
              </span>
            </div>
          )}

          {/* Visual Stage Tracker */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>STATUTORY APPROVAL PROGRESSION</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-100 text-[#032761]">
                Current Stage: {app.currentStage.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 pt-2 text-[10px] text-center font-bold">
              {[
                { stage: 'SCRUTINY', label: '1. Scrutiny' },
                { stage: 'RE_SCRUTINY', label: '2. Re-Scrutiny' },
                { stage: 'EVC_SCHEDULED', label: '3. EVC Sched' },
                { stage: 'EVC_COMPLETED', label: '4. EVC Done' },
                { stage: 'SAC_SHC_REVIEW', label: '5. SAC Hearing' },
                { stage: 'APPROVED', label: '6. Approved' },
                { stage: 'REVERTED_DEFICIENCY', label: 'Deficiency' },
              ].map(st => {
                const isCurrent = app.currentStage === st.stage;
                const isTerminal = app.currentStage === 'APPROVED';
                return (
                  <div
                    key={st.stage}
                    className={`py-2 px-1 rounded-xl border transition ${
                      isCurrent
                        ? 'bg-[#032761] text-white border-[#032761] shadow-xs'
                        : isTerminal
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    {st.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Applied vs Sanctioned</span>
              <span className="text-base font-black text-slate-900">{app.appliedIntake} / {app.totalApprovedIntake}</span>
              <span className="text-[10px] text-slate-500 block">Approved Intake</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">SLA Target Date</span>
              <span className="text-xs font-bold text-slate-900 block">{app.slaDeadline}</span>
              <span className="text-[10px] text-red-600 font-semibold block">{app.daysPending} Days Ageing</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Assigned Authority</span>
              <span className="text-xs font-bold text-slate-900 truncate block">{app.assignedOfficer}</span>
              <span className="text-[10px] text-blue-700 font-medium truncate block">{app.assignedCommittee || 'Standard Desk'}</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Escalation Tier</span>
              <span className={`text-xs font-bold block ${app.escalationLevel === 'LEVEL_0_NORMAL' ? 'text-slate-700' : 'text-red-700'}`}>
                {app.escalationLevel.replace(/_/g, ' ')}
              </span>
              <span className="text-[10px] text-slate-400 block">APH Priority: {app.priority}</span>
            </div>
          </div>

          {/* Deficiencies & Revert Management Desk */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Statutory Deficiencies &amp; Cure Desk</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Deficiencies recorded under APH clauses with statutory cure window and verification workflow
                </p>
              </div>

              {hasPermission('ISSUE_DEFICIENCY_REVERT') && !isOutOfJurisdiction && app.currentStage !== 'APPROVED' && app.currentStage !== 'REJECTED' && (
                <button
                  onClick={() => setShowRevertForm(!showRevertForm)}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
                >
                  {showRevertForm ? 'Cancel Notice' : '+ Issue Deficiency Revert'}
                </button>
              )}
            </div>

            {/* Revert Deficiency Form */}
            {showRevertForm && (
              <form onSubmit={handleIssueRevert} className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3">
                <div className="font-bold text-rose-900 text-xs">
                  Issue Formal APH Deficiency Revert Notice ({cureDays}-Day Statutory Window)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">APH Clause:</label>
                    <input
                      type="text"
                      value={defClause}
                      onChange={e => setDefClause(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Category:</label>
                    <select
                      value={defCategory}
                      onChange={e => setDefCategory(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Land & Building">Land &amp; Building</option>
                      <option value="Faculty Cadre">Faculty Cadre</option>
                      <option value="Laboratory Equipment">Laboratory Equipment</option>
                      <option value="Financial Soundness">Financial Soundness</option>
                      <option value="Statutory Approvals">Statutory Approvals</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Cure Period (Days):</label>
                    <input
                      type="number"
                      value={cureDays}
                      onChange={e => setCureDays(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                      min={7}
                      max={30}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Specific Deficiency Observations:</label>
                  <textarea
                    rows={2}
                    value={defDesc}
                    onChange={e => setDefDesc(e.target.value)}
                    placeholder="Describe specific missing documentation or non-compliance..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Issue Deficiency Revert to Institution</span>
                  </button>
                </div>
              </form>
            )}

            {/* List of Deficiencies with Verification Console */}
            {app.deficiencies.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-50 text-slate-500 text-center">
                No active deficiencies recorded for this application.
              </div>
            ) : (
              <div className="space-y-3">
                {app.deficiencies.map(def => {
                  const canVerify = (hasPermission('SCRUTINY_VERIFY') || hasPermission('ISSUE_DEFICIENCY_REVERT')) && !isOutOfJurisdiction;
                  const canSubmitCure = isApplicantInstitution && (def.status === 'PENDING_CURE' || def.status === 'EXPIRED_UNRESOLVED');

                  return (
                    <div key={def.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">
                          {def.clause} &bull; <span className="text-slate-600">{def.category}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          def.status === 'CURED_VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : def.status === 'CURED_PENDING_VERIFICATION'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : def.status === 'EXPIRED_UNRESOLVED'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {def.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="text-slate-700 text-xs leading-relaxed">{def.description}</p>
                      
                      <div className="text-[11px] text-slate-500 flex flex-wrap justify-between items-center gap-2 pt-1 border-t border-slate-200/60">
                        <span>Cure Target Date: <strong className="text-rose-700">{def.cureDeadline}</strong></span>
                        {def.verifiedBy && (
                          <span className="text-[10px] text-emerald-700 font-medium">Verified by: {def.verifiedBy}</span>
                        )}
                      </div>

                      {/* Institutional response and document link if already submitted */}
                      {def.institutionResponse && (
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-[11px] space-y-1">
                          <div className="font-semibold text-blue-900 flex items-center justify-between">
                            <span>Institutional Explanation:</span>
                            {def.responseDocumentUrl && (
                              <a
                                href={def.responseDocumentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1 text-[10px]"
                              >
                                <FileText className="w-3 h-3" />
                                <span>View Evidence</span>
                              </a>
                            )}
                          </div>
                          <p>{def.institutionResponse}</p>
                          {def.cureRemarks && (
                            <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 italic">
                              Scrutiny Notes: {def.cureRemarks}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Institution Cure Submission Desk (Phase 1 Item 4) */}
                      {canSubmitCure && (
                        <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 space-y-2 mt-2">
                          <span className="text-xs font-bold text-blue-900 block">Submit Institutional Deficiency Cure</span>
                          <textarea
                            rows={2}
                            placeholder="Detail compliance actions taken to resolve this statutory deficiency..."
                            value={cureResponseText[def.id] || ''}
                            onChange={e => setCureResponseText({ ...cureResponseText, [def.id]: e.target.value })}
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                          />
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 cursor-pointer text-[11px] text-slate-700 font-medium">
                              <Upload className="w-3.5 h-3.5 text-blue-600" />
                              <span>{uploadedDocUrls[def.id] ? 'Evidence Attached ✓' : 'Upload Proof (PDF/JPG)'}</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e => e.target.files?.[0] && handleFileUpload(def.id, e.target.files[0])}
                                className="hidden"
                              />
                            </label>

                            <button
                              type="button"
                              disabled={isProcessing || uploadingDefId === def.id}
                              onClick={() => handleCureSubmit(def.id)}
                              className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {uploadingDefId === def.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              <span>Submit Cure for Scrutiny Verification</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Official Verification Controls (Phase 1 Item 4) */}
                      {canVerify && (def.status === 'CURED_PENDING_VERIFICATION' || def.status === 'PENDING_CURE') && (
                        <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 space-y-2 mt-2">
                          <span className="text-xs font-bold text-amber-900 block">
                            Scrutiny Committee Verification Desk (Clause {def.clause})
                          </span>
                          <input
                            type="text"
                            placeholder="Official verification findings / scrutiny remarks..."
                            value={verifyRemarksText[def.id] || ''}
                            onChange={e => setVerifyRemarksText({ ...verifyRemarksText, [def.id]: e.target.value })}
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleVerifyCure(def.id, false)}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject &amp; Re-Cure</span>
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleVerifyCure(def.id, true)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept &amp; Endorse (CURED_VERIFIED)</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stage Progression & Action Console */}
          {!isOutOfJurisdiction && app.currentStage !== 'APPROVED' && app.currentStage !== 'REJECTED' && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#032761]" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Regulatory Action &amp; Stage Transition Console
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Advance application along the prescribed APH route: <strong>{app.route}</strong>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Stage Progression:</label>
                  <select
                    value={transitionStage}
                    onChange={e => setTransitionStage(e.target.value as ApprovalStage)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="SCRUTINY">SCRUTINY (Scrutiny Committee)</option>
                    <option value="RE_SCRUTINY">RE_SCRUTINY (Post-Cure Verification)</option>
                    <option value="EVC_SCHEDULED">EVC_SCHEDULED (Constitute Panel)</option>
                    <option value="EVC_COMPLETED">EVC_COMPLETED (Inspection Concluded)</option>
                    <option value="SAC_SHC_REVIEW">SAC_SHC_REVIEW (Appellate Hearing)</option>
                    <option value="APPROVED">APPROVED (Grant Statutory Approval)</option>
                    <option value="REJECTED">REJECTED (Statutory Rejection)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Official Remarks / Recommendation:</label>
                  <input
                    type="text"
                    value={transitionRemarks}
                    onChange={e => setTransitionRemarks(e.target.value)}
                    placeholder="Record formal administrative findings..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  Logged As: <strong className="text-slate-800">{currentUser?.name}</strong> ({currentRole.replace(/_/g, ' ')})
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdvance(transitionStage)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-lg bg-[#032761] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
                  >
                    <span>Advance Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {hasPermission('GRANT_STATUTORY_APPROVAL') && (
                    <button
                      onClick={() => handleAdvance('APPROVED')}
                      disabled={isProcessing}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Grant Final Approval</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Digital Audit Trail */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-600" />
              <span>Digital Audit &amp; Movement Trail ({app.auditTrail.length} Records)</span>
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {app.auditTrail.map((trail, idx) => (
                <div key={trail.id || idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">{trail.title}</span>
                    <span className="font-mono text-[10px] text-slate-400">{trail.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{trail.remarks}</p>
                  <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-200/50">
                    <span>Officer: <strong>{trail.actorName}</strong> ({trail.actorRole})</span>
                    {trail.authorizedBy && <span>Auth: {trail.authorizedBy}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
