'use client';

import React, { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  Building2,
  FileText,
  AlertTriangle,
  Upload,
  CheckCircle2,
  Clock,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Send,
} from 'lucide-react';

export function InstitutionPortal() {
  const {
    currentUser,
    applications,
    undertakings,
    documents,
    cureDeficiency,
    submitUndertakingProof,
    submitDocumentRenewal,
    setSelectedAppId,
  } = useDashboard();

  // Institution matching PID
  const myPid = currentUser?.institutionPermanentId || '1-109723412';
  const myApps = applications.filter(a => a.institutionPermanentId === myPid);
  const myUndertakings = undertakings.filter(u => u.institutionPermanentId === myPid);
  const myDocs = documents.filter(d => d.institutionPermanentId === myPid);

  const [cureText, setCureText] = useState<{ [defId: string]: string }>({});
  const [renewalDate, setRenewalDate] = useState<{ [docId: string]: string }>({});

  return (
    <div className="space-y-6">
      {/* Institution Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#032761] to-[#00529b] text-white shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-400/20 text-blue-200 border border-blue-400/30">
                Technical Institution Single-Window Desk
              </span>
              <span className="text-xs text-blue-200">PID: {myPid}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {currentUser?.institutionName || 'Sri Krishna College of Technology'}
            </h1>
            <p className="text-xs text-blue-100 max-w-2xl">
              Official Institutional Compliance Dashboard. Submit deficiency cures within the statutory 15-day window, fulfill conditional undertakings, and monitor lease validities.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <span className="text-[10px] uppercase font-semibold text-blue-200 block">Active Applications</span>
              <span className="text-xl font-extrabold text-white">{myApps.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 text-center">
              <span className="text-[10px] uppercase font-semibold text-blue-200 block">Pending Cures</span>
              <span className="text-xl font-extrabold text-amber-300">
                {myApps.reduce((acc, a) => acc + a.deficiencies.filter(d => d.status === 'PENDING_CURE').length, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Active Applications & Progression Stage */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#032761] uppercase tracking-wider">
              Submitted AICTE Approval Applications
            </h2>
            <p className="text-xs text-slate-500">
              Live progression stage, assigned committee, and prescribed SLA targets
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {myApps.map(app => (
            <div key={app.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{app.applicationNumber}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {app.applicationType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Prescribed Route: <strong className="text-slate-700">{app.route}</strong> | Applied Intake: {app.appliedIntake} seats
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Stage: {app.currentStage.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => setSelectedAppId(app.id)}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-[#032761] text-white hover:bg-blue-900 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Dossier</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Deficiencies Cure Section */}
              {app.deficiencies.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Statutory Deficiency Notice Active (APH 15-Day Cure Window)</span>
                  </div>

                  {app.deficiencies.map(def => (
                    <div key={def.id} className="p-3 rounded-lg bg-white border border-amber-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {def.clause} - {def.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          def.status === 'CURED_VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {def.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-slate-600">{def.description}</p>
                      <div className="text-[11px] text-slate-500">
                        Cure Deadline: <strong className="text-red-700 font-mono">{def.cureDeadline}</strong>
                      </div>

                      {def.status === 'PENDING_CURE' ? (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            Institutional Compliance Explanation &amp; Evidence:
                          </label>
                          <textarea
                            rows={2}
                            value={cureText[def.id] || ''}
                            onChange={e => setCureText({ ...cureText, [def.id]: e.target.value })}
                            placeholder="Detail rectify action taken (e.g. Registered lease endorsement attached with Sub-Registrar seal)..."
                            className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                          />
                          <button
                            onClick={() => {
                              const note = cureText[def.id] || 'Registered copy submitted for re-scrutiny.';
                              cureDeficiency(app.id, def.id, note);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Documentary Cure to Scrutiny Panel</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 rounded bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Cure response submitted: &quot;{def.institutionResponse}&quot;</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Time-Bound Undertakings */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#032761] uppercase tracking-wider">
            Time-Bound Conditional Undertakings
          </h2>
          <p className="text-xs text-slate-500">
            Mandatory commitments imposed during approval (e.g. GPU Lab, Accessibility, Cadre)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {myUndertakings.map(und => (
            <div key={und.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{und.conditionTitle}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  und.status === 'VERIFIED_COMPLIANT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {und.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{und.prescribedCondition}</p>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Imposed: {und.imposedDate}</span>
                <span>Due: <strong className="text-red-700">{und.dueDate}</strong></span>
              </div>

              {und.status !== 'VERIFIED_COMPLIANT' && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      submitUndertakingProof(und.id, `${und.id}_Proof_Submitted.pdf`);
                    }}
                    className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Signed Compliance Evidence &amp; Geotagged Proof</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Document Validity Radar */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#032761] uppercase tracking-wider">
            Institutional Document &amp; 30-Year Lease Status
          </h2>
          <p className="text-xs text-slate-500">
            Registered land deed, Fire Safety NOC, and structural stability certifications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {myDocs.map(doc => (
            <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{doc.documentType.replace(/_/g, ' ')}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  doc.status === 'ACTIVE_VALID' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                }`}>
                  {doc.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="text-[11px] text-slate-600">Doc No: {doc.documentNumber}</div>
              <div className="text-[11px] text-slate-600">Authority: {doc.issuingAuthority}</div>
              <div className="text-[11px] text-slate-500 font-bold">
                Expiry Date: <span className="text-red-700">{doc.expiryDate}</span>
              </div>

              {doc.status !== 'ACTIVE_VALID' && (
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={renewalDate[doc.id] || ''}
                      onChange={e => setRenewalDate({ ...renewalDate, [doc.id]: e.target.value })}
                      className="text-xs p-1.5 rounded border border-slate-300 bg-white"
                    />
                    <button
                      onClick={() => {
                        const newExp = renewalDate[doc.id] || '2030-12-31';
                        submitDocumentRenewal(doc.id, newExp);
                      }}
                      className="px-2.5 py-1.5 rounded bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Submit Renewal</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
