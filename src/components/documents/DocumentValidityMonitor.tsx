'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  ShieldAlert,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Upload,
  ExternalLink,
  Lock,
  Loader2,
  XCircle,
} from 'lucide-react';
import { exportDocumentsCsv } from '@/lib/exportUtils';

export function DocumentValidityMonitor() {
  const {
    documents,
    submitDocumentRenewal,
    verifyDocumentRenewal,
    currentRole,
    hasPermission,
    currentUser,
  } = useDashboard();

  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [renewalDate, setRenewalDate] = useState('2031-11-20');
  const [renewalRemarks, setRenewalRemarks] = useState('Registered lease deed endorsed with Sub-Registrar seal.');
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadedRenewalUrl, setUploadedRenewalUrl] = useState<string | null>(null);

  const activeDoc = documents.find(d => d.id === selectedDocId);
  const canVerify = hasPermission('VERIFY_LEASE_RENEWAL') || hasPermission('ALL_PERMISSIONS');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeDoc) return;

    setUploadingDocId(activeDoc.id);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'DOCUMENT');
      formData.append('entityId', activeDoc.id);

      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.fileUrl) {
        setUploadedRenewalUrl(data.fileUrl);
        setStatusMessage({ text: `Renewal proof document "${file.name}" uploaded successfully.`, error: false });
      } else {
        setStatusMessage({ text: data.error || 'Failed to upload renewal document', error: true });
      }
    } catch {
      setStatusMessage({ text: 'Error uploading file', error: true });
    } finally {
      setUploadingDocId(null);
    }
  };

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc) return;
    setIsProcessing(true);
    const res = await submitDocumentRenewal(activeDoc.id, renewalDate, uploadedRenewalUrl || undefined);
    setIsProcessing(false);
    if (!res.success) {
      setStatusMessage({ text: res.message, error: true });
    } else {
      setStatusMessage({ text: res.message, error: false });
      setShowRenewalModal(false);
      setUploadedRenewalUrl(null);
    }
  };

  const handleVerifyRenewal = async (docId: string, verified: boolean) => {
    setIsProcessing(true);
    const res = await verifyDocumentRenewal(docId, verified, renewalRemarks);
    setIsProcessing(false);
    if (!res.success) {
      setStatusMessage({ text: res.message, error: true });
    } else {
      setStatusMessage({ text: res.message, error: false });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE_VALID':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'EXPIRING_SOON_90D':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CRITICAL_30D':
        return 'bg-rose-100 text-rose-800 border-rose-200 font-extrabold animate-pulse';
      case 'EXPIRED':
        return 'bg-red-600 text-white font-extrabold';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#032761] uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>Lease &amp; Statutory Document Validity Sentinel Radar</span>
          </h2>
          <p className="text-xs text-slate-500">
            Surveillance of 30-year registered land lease deeds, annual Fire Safety NOCs, and structural stability certifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportDocumentsCsv(documents)}
            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 font-bold text-xs transition cursor-pointer"
          >
            Export Lease &amp; Document Registry
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

      {/* Documents Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#032761]/5 border-b border-slate-200 text-[#032761] uppercase tracking-wider font-bold text-[11px]">
            <tr>
              <th className="py-3 px-4">Document &amp; Institution</th>
              <th className="py-3 px-3">Registration No.</th>
              <th className="py-3 px-3">Issuing Authority</th>
              <th className="py-3 px-3">Expiry Horizon</th>
              <th className="py-3 px-3">Radar Status</th>
              <th className="py-3 px-3">Renewal Status</th>
              <th className="py-3 px-4 text-right">Statutory Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {documents.map(doc => {
              const canUploadRenewal =
                (currentUser?.role === 'SUPER_ADMIN' ||
                  (currentUser?.role === 'INSTITUTION_PRINCIPAL' && currentUser.institutionPermanentId === doc.institutionPermanentId)) &&
                hasPermission('SUBMIT_LEASE_RENEWAL');

              return (
                <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{doc.documentType.replace(/_/g, ' ')}</div>
                    <div className="text-slate-600 font-medium">{doc.institutionName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">PID: {doc.institutionPermanentId} | {doc.region}</div>
                  </td>

                  <td className="py-3 px-3 font-mono font-medium text-slate-800">
                    {doc.documentNumber}
                  </td>

                  <td className="py-3 px-3 max-w-xs">
                    <span className="text-[11px] text-slate-600 line-clamp-2" title={doc.issuingAuthority}>
                      {doc.issuingAuthority}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-mono font-bold text-slate-900">{doc.expiryDate}</div>
                    <div className="text-[10px] text-slate-400">Issued: {doc.issuedDate}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] border ${getStatusBadge(doc.status)}`}>
                      {doc.status.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    {doc.renewalSubmittedDate ? (
                      <div className="space-y-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.renewalStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.renewalStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {doc.renewalStatus || 'PENDING'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Target: {doc.renewedExpiryDate || 'Pending'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">None Submitted</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right space-x-1.5">
                    {doc.renewalSubmittedDate && doc.renewalStatus !== 'VERIFIED' && canVerify ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleVerifyRenewal(doc.id, false)}
                          disabled={isProcessing}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-60"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerifyRenewal(doc.id, true)}
                          disabled={isProcessing}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs disabled:opacity-60"
                        >
                          Endorse
                        </button>
                      </div>
                    ) : canUploadRenewal ? (
                      <button
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setShowRenewalModal(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition shadow-xs"
                      >
                        Submit Renewal
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[10px] italic">Monitored</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Renewal Submission Modal */}
      {showRenewalModal && activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-lg w-full space-y-4 border border-slate-200 text-xs shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Submit Statutory Document Renewal</h3>
              <button onClick={() => setShowRenewalModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700">
              <div className="font-bold text-slate-900">{activeDoc.documentType.replace(/_/g, ' ')} &bull; {activeDoc.institutionName}</div>
              <div>Current Expiry: <strong className="text-red-700">{activeDoc.expiryDate}</strong></div>
              <div className="text-[10px] text-slate-500">Document No: {activeDoc.documentNumber}</div>
            </div>

            <form onSubmit={handleRenewalSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">New Validity Expiry Date:</label>
                <input
                  type="date"
                  value={renewalDate}
                  onChange={e => setRenewalDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs bg-white"
                  required
                />
              </div>

              {/* Real File Upload (Phase 4 Item 21) */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Upload Endorsed / Registered Document (PDF/JPG):</label>
                <label className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-slate-700 font-medium">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-red-600" />
                    <span>{uploadedRenewalUrl ? 'Renewal Document Attached ✓' : 'Select Registered PDF/Image'}</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadingDocId && <Loader2 className="w-4 h-4 animate-spin text-red-600" />}
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  Submit for Regional Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
