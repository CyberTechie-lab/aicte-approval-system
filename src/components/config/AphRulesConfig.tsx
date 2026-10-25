'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard, DEFAULT_APH_CONFIG } from '@/context/DashboardContext';
import {
  Sliders,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Clock,
  Calendar,
  AlertTriangle,
  Lock,
  Flame,
  Loader2,
} from 'lucide-react';
import { AphTimelineConfig } from '@/types';

export function AphRulesConfig() {
  const { aphConfig, updateAphConfig, currentRole, hasPermission } = useDashboard();

  const [formConfig, setFormConfig] = useState<AphTimelineConfig>(aphConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormConfig(aphConfig);
  }, [aphConfig]);

  const canEdit = hasPermission('CONFIGURE_APH_SLAS') || hasPermission('ALL_PERMISSIONS');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    const res = await updateAphConfig(formConfig);
    setIsSaving(false);
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleReset = async () => {
    if (!canEdit) return;
    setFormConfig(DEFAULT_APH_CONFIG);
    setIsSaving(true);
    await updateAphConfig(DEFAULT_APH_CONFIG);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#032761] uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Approval Process Handbook (APH) Statutory Rules &amp; SLA Engine</span>
          </h2>
          <p className="text-xs text-slate-500">
            Configure statutory processing ceilings, inspection deadlines, deficiency cure windows, and document expiry sentinels
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset APH Standard</span>
            </button>
          </div>
        )}
      </div>

      {!canEdit && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Read-Only Administrative View: Modifying statutory APH rules and timelines requires Approval Bureau Adviser or Member Secretary authority.
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 font-bold text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>APH Statutory SLA timelines successfully updated and re-indexed across all pending applications.</span>
        </div>
      )}

      {/* Rules Config Form */}
      <form onSubmit={handleSubmit} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Scrutiny Max Days */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Scrutiny Ceiling</label>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Maximum days for committee clause-by-clause scrutiny of fresh applications.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.scrutinyMaxDays}
                onChange={e => setFormConfig({ ...formConfig, scrutinyMaxDays: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={7}
                max={60}
              />
              <span className="text-slate-600 font-medium">Days (APH Ch. I)</span>
            </div>
          </div>

          {/* Re-Scrutiny Days */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Re-Scrutiny Period</label>
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Prescribed days to re-verify documentary proofs submitted post deficiency cure.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.reScrutinyMaxDays}
                onChange={e => setFormConfig({ ...formConfig, reScrutinyMaxDays: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={5}
                max={30}
              />
              <span className="text-slate-600 font-medium">Days</span>
            </div>
          </div>

          {/* EVC Inspection Days */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">EVC Inspection Target</label>
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Days allowed from scrutiny completion to conducting on-site physical visit.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.evcInspectionMaxDays}
                onChange={e => setFormConfig({ ...formConfig, evcInspectionMaxDays: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={7}
                max={45}
              />
              <span className="text-slate-600 font-medium">Days (APH Ch. II)</span>
            </div>
          </div>

          {/* EVC Report Upload Ceiling */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">EVC Report Upload</label>
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Mandatory ceiling for EVC Chairman to upload signed report with photographs.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.evcReportUploadMaxDays}
                onChange={e => setFormConfig({ ...formConfig, evcReportUploadMaxDays: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={1}
                max={15}
              />
              <span className="text-slate-600 font-medium">Days post-visit</span>
            </div>
          </div>

          {/* Deficiency Cure Grace Period */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Statutory Cure Window</label>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Mandatory time given to technical institutions to cure flagged deficiencies.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.deficiencyCurePeriodDays}
                onChange={e => setFormConfig({ ...formConfig, deficiencyCurePeriodDays: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={7}
                max={30}
              />
              <span className="text-slate-600 font-medium">Days (APH Ch. VII)</span>
            </div>
          </div>

          {/* SAC Appellate Hearing Disposal */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Appellate Disposal (SAC)</label>
              <Clock className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Days allowed for Standing Appellate Committee to hear institutional appeal.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.sacAppellateMaxDays}
                onChange={e => setFormConfig({ ...formConfig, sacAppellateMaxDays: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={7}
                max={30}
              />
              <span className="text-slate-600 font-medium">Days</span>
            </div>
          </div>

          {/* Undertakings Grace Period */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Undertaking Grace Days</label>
              <Clock className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Grace window before an unfulfilled undertaking triggers Council Show Cause.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.undertakingGracePeriodDays}
                onChange={e => setFormConfig({ ...formConfig, undertakingGracePeriodDays: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={15}
                max={60}
              />
              <span className="text-slate-600 font-medium">Days</span>
            </div>
          </div>

          {/* Lease Radar Advance Horizon */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Lease Radar Horizon</label>
              <Calendar className="w-3.5 h-3.5 text-red-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Advance warning window for expiring 30-year registered lease deeds.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.leaseAdvanceAlertDays}
                onChange={e => setFormConfig({ ...formConfig, leaseAdvanceAlertDays: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={30}
                max={180}
              />
              <span className="text-slate-600 font-medium">Days in Advance</span>
            </div>
          </div>

          {/* Level 1 RO Escalation Threshold (Phase 3 Item 15b) */}
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Level 1 RO Escalation</label>
              <Flame className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Overdue days ceiling before application is escalated to Regional Officer.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.escalationL1Days}
                onChange={e => setFormConfig({ ...formConfig, escalationL1Days: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={1}
                max={30}
              />
              <span className="text-slate-600 font-medium">Days Overdue</span>
            </div>
          </div>

          {/* Level 2 Bureau Escalation Threshold (Phase 3 Item 15b) */}
          <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">Level 2 Bureau Escalation</label>
              <Flame className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Overdue days ceiling before regional case escalates to Bureau Adviser HQ.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.escalationL2Days}
                onChange={e => setFormConfig({ ...formConfig, escalationL2Days: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={7}
                max={60}
              />
              <span className="text-slate-600 font-medium">Days Overdue</span>
            </div>
          </div>

          {/* SLA Approaching Warning Days (Phase 3 Item 15b) */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 text-xs">SLA Approaching Warning</label>
              <Clock className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-[10px] text-slate-500">
              Days prior to SLA breach to trigger advance warning reminder alert.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                disabled={!canEdit}
                value={formConfig.slaWarningDays}
                onChange={e => setFormConfig({ ...formConfig, slaWarningDays: Number(e.target.value) })}
                className="w-20 p-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-500"
                min={1}
                max={15}
              />
              <span className="text-slate-600 font-medium">Days in Advance</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
          <span className="text-slate-500 text-[11px]">
            Statutory Rule Authority: <strong>AICTE Approval Bureau, Headquarters, New Delhi</strong>
          </span>

          {canEdit && (
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-[#032761] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              <span>Save &amp; Apply APH Statutory SLAs</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
