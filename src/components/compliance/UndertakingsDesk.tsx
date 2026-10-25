'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  FileCheck2,
  Building2,
  ShieldCheck,
  X,
  ExternalLink,
  Lock,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { exportUndertakingsCsv } from '@/lib/exportUtils';

export function UndertakingsDesk() {
  const {
    undertakings,
    verifyUndertaking,
    submitUndertakingProof,
    currentRole,
    hasPermission,
    currentUser,
  } = useDashboard();

  const [selectedUndertakingId, setSelectedUndertakingId] = useState<string | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verificationRemarks, setVerificationRemarks] = useState('Satisfactory compliance verified against statutory APH Chapter IV norms.');
  const [statusMessage, setStatusMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingUndId, setUploadingUndId] = useState<string | null>(null);

  const activeUndertaking = undertakings.find(u => u.id === selectedUndertakingId);
  const canVerify = hasPermission('VERIFY_UNDERTAKINGS') || hasPermission('ALL_PERMISSIONS');

  const handleFileUploadAndSubmit = async (undertakingId: string, file: File) => {
    setUploadingUndId(undertakingId);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'UNDERTAKING');
      formData.append('entityId', undertakingId);

      const uploadRes = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        setStatusMessage({ text: uploadData.error || 'Failed to upload documentary evidence', error: true });
        setUploadingUndId(null);
        return;
      }

      // Submit proof using real file name and server URL
      const proofRes = await submitUndertakingProof(undertakingId, file.name, uploadData.fileUrl);
      if (!proofRes.success) {
        setStatusMessage({ text: proofRes.message, error: true });
      } else {
        setStatusMessage({ text: `Compliance proof "${file.name}" uploaded and submitted successfully.`, error: false });
      }
    } catch {
      setStatusMessage({ text: 'Error uploading compliance document', error: true });
    } finally {
      setUploadingUndId(null);
    }
  };

  const handleVerify = async (verified: boolean) => {
    if (!activeUndertaking) return;
    setIsProcessing(true);
    const res = await verifyUndertaking(activeUndertaking.id, verified, verificationRemarks);
    setIsProcessing(false);
    if (!res.success) {
      setStatusMessage({ text: res.message, error: true });
    } else {
      setStatusMessage({ text: res.message, error: false });
      setShowVerifyModal(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#032761] uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-purple-600" />
            <span>Time-Bound Undertakings &amp; Compliance Monitoring Desk</span>
          </h2>
          <p className="text-xs text-slate-500">
            Automated monitoring of approvals granted subject to time-bound undertakings (GPU labs, RPwD accessibility, Cadre ratios, FDR deposits)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportUndertakingsCsv(undertakings)}
            className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-xs transition cursor-pointer"
          >
            Export Compliance Registry
          </button>
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

      {/* Undertakings Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#032761]/5 border-b border-slate-200 text-[#032761] uppercase tracking-wider font-bold text-[11px]">
            <tr>
              <th className="py-3 px-4">Undertaking &amp; Institution</th>
              <th className="py-3 px-3">Prescribed Condition</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Due Date</th>
              <th className="py-3 px-3">Compliance Status</th>
              <th className="py-3 px-3">Evidence Submitted</th>
              <th className="py-3 px-4 text-right">RO Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {undertakings.map(und => {
              const canUploadProof =
                (currentUser?.role === 'SUPER_ADMIN' ||
                  (currentUser?.role === 'INSTITUTION_PRINCIPAL' && currentUser.institutionPermanentId === und.institutionPermanentId)) &&
                hasPermission('SUBMIT_UNDERTAKING_PROOF');

              return (
                <tr key={und.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{und.conditionTitle}</div>
                    <div className="text-slate-600 font-medium">{und.institutionName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">App: {und.applicationNumber} | {und.region}</div>
                  </td>

                  <td className="py-3 px-3 max-w-xs">
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed" title={und.prescribedCondition}>
                      {und.prescribedCondition}
                    </p>
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                      {und.category.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-slate-900">{und.dueDate}</div>
                    <div className="text-[10px] text-slate-400">Imposed: {und.imposedDate}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      und.status === 'VERIFIED_COMPLIANT'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : und.status === 'SUBMITTED_PENDING_VERIFICATION'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : und.status === 'REJECTED_RESUBMIT'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : und.status === 'OVERDUE_ESCALATED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200 font-extrabold animate-pulse'
                        : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {und.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {und.evidenceDocumentName ? (
                      <div className="space-y-1">
                        <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                          <FileCheck2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          {und.evidenceDocumentUrl ? (
                            <a
                              href={und.evidenceDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline hover:text-blue-900 truncate max-w-[130px]"
                              title={und.evidenceDocumentName}
                            >
                              {und.evidenceDocumentName}
                            </a>
                          ) : (
                            <span className="truncate max-w-[130px]" title={und.evidenceDocumentName}>
                              {und.evidenceDocumentName}
                            </span>
                          )}
                        </div>

                        {/* Re-submit proof option if rejected */}
                        {und.status === 'REJECTED_RESUBMIT' && canUploadProof && (
                          <label className="text-amber-700 hover:text-amber-900 font-bold text-[10px] flex items-center gap-1 cursor-pointer">
                            <RotateCcw className="w-3 h-3" />
                            <span>Re-Upload Proof</span>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={e => e.target.files?.[0] && handleFileUploadAndSubmit(und.id, e.target.files[0])}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    ) : canUploadProof ? (
                      <label className="text-purple-700 hover:text-purple-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer">
                        {uploadingUndId === und.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload Proof (PDF/JPG)</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={e => e.target.files?.[0] && handleFileUploadAndSubmit(und.id, e.target.files[0])}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <span className="text-slate-400 text-[10px] italic">Awaiting Institution Upload</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {und.status === 'VERIFIED_COMPLIANT' ? (
                      <span className="text-emerald-700 font-bold text-xs inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verified Compliant
                      </span>
                    ) : canVerify ? (
                      <button
                        onClick={() => {
                          setSelectedUndertakingId(und.id);
                          setShowVerifyModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#032761] hover:bg-blue-900 text-white font-bold text-xs cursor-pointer transition shadow-xs"
                      >
                        Verify Proof
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[10px] italic flex items-center justify-end gap-1">
                        <Lock className="w-3 h-3" />
                        Requires RO Review
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Verify Modal */}
      {showVerifyModal && activeUndertaking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full space-y-4 border border-slate-200 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Verify Institutional Undertaking Evidence</h3>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="font-bold text-slate-900 text-xs">{activeUndertaking.conditionTitle}</div>
              <p className="text-slate-600 text-[11px]">{activeUndertaking.prescribedCondition}</p>
              <div className="text-[11px] text-slate-500">
                Institution: <strong>{activeUndertaking.institutionName}</strong> (Due: {activeUndertaking.dueDate})
              </div>
              {activeUndertaking.evidenceDocumentName && (
                <div className="text-[11px] text-blue-700 font-medium">
                  Documentary Evidence: <strong>{activeUndertaking.evidenceDocumentName}</strong>
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Regional Officer Inspection &amp; Scrutiny Findings:
              </label>
              <textarea
                rows={3}
                value={verificationRemarks}
                onChange={e => setVerificationRemarks(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                required
              />
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleVerify(false)}
                className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold"
              >
                Reject Evidence (Resubmit / Escalate)
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleVerify(true)}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirm Compliance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
