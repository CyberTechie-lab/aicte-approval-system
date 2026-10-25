'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  BellRing,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock,
  Filter,
  Play,
  Calendar,
  Sparkles,
  Mail,
  Smartphone,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface NotificationLogItem {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  sentAt: string;
}

export function AlertsHub() {
  const {
    alerts,
    markAlertRead,
    setSelectedAppId,
    setActiveTab,
    runComplianceSweepNow,
    currentUser,
    currentRole,
  } = useDashboard();

  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'ALERTS' | 'NOTIFICATIONS'>('ALERTS');

  // Sweep Simulation State
  const [simulatedDate, setSimulatedDate] = useState('');
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepSummary, setSweepSummary] = useState<any | null>(null);

  // Notification Log State
  const [notificationLogs, setNotificationLogs] = useState<NotificationLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const canRunSweep = currentRole === 'SUPER_ADMIN' || currentRole === 'BUREAU_OFFICER';

  const fetchNotificationLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotificationLogs(data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch notification logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'NOTIFICATIONS') {
      fetchNotificationLogs();
    }
  }, [activeSubTab]);

  const handleRunSweep = async (customDate?: string) => {
    setIsSweeping(true);
    setSweepSummary(null);
    const dateToPass = customDate || (simulatedDate ? new Date(simulatedDate).toISOString() : undefined);
    const res = await runComplianceSweepNow(dateToPass);
    setIsSweeping(false);
    if (res.success && res.summary) {
      setSweepSummary(res.summary);
      if (activeSubTab === 'NOTIFICATIONS') {
        fetchNotificationLogs();
      }
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (unreadOnly && a.isRead) return false;
    return true;
  });

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#032761] uppercase tracking-wider flex items-center gap-2">
            <BellRing className="w-5 h-5 text-red-600" />
            <span>Multi-Tier Statutory Escalations &amp; Alert Engine</span>
          </h2>
          <p className="text-xs text-slate-500">
            Hierarchical escalation ladder: Level 1 (Regional Officer) &rarr; Level 2 (Bureau Adviser) &rarr; Level 3 (Member Secretary)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Subtabs: Alerts vs Notifications */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs">
            <button
              onClick={() => setActiveSubTab('ALERTS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeSubTab === 'ALERTS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Live Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveSubTab('NOTIFICATIONS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeSubTab === 'NOTIFICATIONS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Notification Logs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sweep Trigger & Simulation Console (Phase 3 Item 16) */}
      {canRunSweep && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#032761] to-blue-900 text-white shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h3 className="font-bold text-sm tracking-wide text-white uppercase">
                  Compliance Sweep Engine (Evaluation &amp; Cron Dispatch)
                </h3>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Evaluates real-time SLA ageing, triggers Level 1 &rarr; 2 &rarr; 3 escalations, recalculates 30-year lease radials, and delivers deduplicated notifications.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isSweeping}
                onClick={() => handleRunSweep()}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSweeping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span>Run Compliance Sweep Now</span>
              </button>
            </div>
          </div>

          {/* Date Simulation Bar for Judges Demo */}
          {isDemoMode && (
            <div className="pt-2 border-t border-blue-800/80 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-blue-200 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-300" />
                <span>Simulate Future Evaluation Date:</span>
              </span>

              <input
                type="date"
                value={simulatedDate}
                onChange={e => setSimulatedDate(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-700 text-white text-xs font-mono"
              />

              <button
                type="button"
                disabled={isSweeping || !simulatedDate}
                onClick={() => handleRunSweep(new Date(simulatedDate).toISOString())}
                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer disabled:opacity-40"
              >
                Trigger Simulated Sweep
              </button>

              <button
                type="button"
                disabled={isSweeping}
                onClick={() => {
                  const future = new Date(Date.now() + 30 * 86400000);
                  setSimulatedDate(future.toISOString().split('T')[0]);
                  handleRunSweep(future.toISOString());
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-800 hover:bg-blue-700 text-blue-100 font-medium text-[11px] cursor-pointer"
              >
                +30 Days Fast-Forward
              </button>

              <button
                type="button"
                disabled={isSweeping}
                onClick={() => {
                  const future = new Date(Date.now() + 90 * 86400000);
                  setSimulatedDate(future.toISOString().split('T')[0]);
                  handleRunSweep(future.toISOString());
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-800 hover:bg-blue-700 text-blue-100 font-medium text-[11px] cursor-pointer"
              >
                +90 Days Expiration Horizon
              </button>
            </div>
          )}

          {/* Sweep Results Display */}
          {sweepSummary && (
            <div className="mt-2 p-3 rounded-xl bg-blue-950/90 border border-blue-600/60 text-xs space-y-1.5 animate-fadeIn">
              <div className="font-bold text-amber-300 flex items-center justify-between">
                <span>Sweep Execution Completed &bull; Simulated Date: {new Date(sweepSummary.simulatedDate).toLocaleDateString('en-IN')}</span>
                <span className="font-mono text-[10px] text-blue-300">Deduplicated Dispatch</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center pt-1">
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-blue-200 block">Apps Escalated</span>
                  <span className="font-bold text-sm text-white">{sweepSummary.appsEscalated}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-blue-200 block">Docs Flagged</span>
                  <span className="font-bold text-sm text-amber-300">{sweepSummary.docsFlagged}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-blue-200 block">Undertakings Overdue</span>
                  <span className="font-bold text-sm text-rose-300">{sweepSummary.undertakingsOverdue}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-blue-200 block">EVC Delayed</span>
                  <span className="font-bold text-sm text-purple-300">{sweepSummary.evcDelayed}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <span className="text-[10px] text-blue-200 block">Deficiencies Expired</span>
                  <span className="font-bold text-sm text-red-400">{sweepSummary.deficienciesExpired}</span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30">
                  <span className="text-[10px] text-emerald-200 block">Alerts Dispatched</span>
                  <span className="font-bold text-sm text-emerald-300">{sweepSummary.alertsCreated}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Escalation Hierarchy Architecture Card */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xs space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
          Statutory APH Multi-Tier Escalation Protocol
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300">Tier 1: Regional Officer</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">1 - 7 Days Overdue</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Triggered when Scrutiny or EVC scheduling exceeds prescribed timeline. RO directed to resolve local bottlenecks.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-orange-300">Tier 2: Bureau Adviser HQ</span>
              <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-mono">8 - 14 Days Overdue</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Escalated to Head of Approval Bureau, Nelson Mandela Marg. May re-route application or summon Regional Officer.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-300">Tier 3: Member Secretary</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">&gt; 14 Days Critical</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Executive Council &amp; Statutory Appellate Authority. Quasi-judicial hearing order or emergency Council ratification.
            </p>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: LIVE ALERTS FEED */}
      {activeSubTab === 'ALERTS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Council Escalation Inward Register ({filteredAlerts.length})
            </span>
            <div className="flex items-center gap-2 text-xs">
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium / Reminders</option>
              </select>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={e => setUnreadOnly(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Unread Only</span>
              </label>
            </div>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No active alerts matching specified filter.
            </div>
          ) : (
            filteredAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                  alert.isRead ? 'bg-white border-slate-200' : 'bg-amber-50/60 border-amber-200 shadow-sm'
                }`}
              >
                <div className="space-y-1 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {alert.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Target: {alert.targetRole.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className={`font-bold text-sm ${alert.severity === 'CRITICAL' ? 'text-red-700' : 'text-slate-900'}`}>
                    {alert.title}
                  </h3>
                  <p className="text-slate-600 text-xs leading-relaxed">{alert.message}</p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Timestamp: {alert.timestamp} {alert.region && `| Region: ${alert.region}`}
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => {
                      markAlertRead(alert.id);
                      if (alert.relatedEntityId.startsWith('APP-') || alert.relatedEntityId.includes('AICTE-APP-')) {
                        setSelectedAppId(alert.relatedEntityId);
                      } else if (alert.type === 'EVC_DELAY') {
                        setActiveTab('evc');
                      } else if (alert.type === 'UNDERTAKING_OVERDUE') {
                        setActiveTab('undertakings');
                      } else if (alert.type === 'LEASE_EXPIRY') {
                        setActiveTab('documents');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#032761] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>Take Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {!alert.isRead && (
                    <button
                      onClick={() => markAlertRead(alert.id)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SUBTAB 2: NOTIFICATION DELIVERY LOG (Phase 4 Item 19) */}
      {activeSubTab === 'NOTIFICATIONS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Automated Statutory Email &amp; SMS Dispatch Trail
            </span>
            <button
              onClick={fetchNotificationLogs}
              className="text-xs text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#032761]/5 border-b border-slate-200 text-[#032761] uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-3">Recipient Address / Number</th>
                  <th className="py-3 px-3">Subject / Alert Header</th>
                  <th className="py-3 px-3">Delivery Status</th>
                  <th className="py-3 px-4 text-right">Dispatched Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {notificationLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {loadingLogs ? 'Loading notification delivery logs...' : 'No notifications dispatched yet.'}
                    </td>
                  </tr>
                ) : (
                  notificationLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                          log.channel === 'EMAIL' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {log.channel === 'EMAIL' ? <Mail className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                          {log.channel}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-medium text-slate-900">
                        {log.recipient}
                      </td>

                      <td className="py-3 px-3 max-w-sm">
                        <div className="font-semibold text-slate-900 truncate" title={log.subject}>
                          {log.subject}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate" title={log.body}>
                          {log.body}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.status === 'SENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.status === 'SENT' ? 'DELIVERED (SMTP)' : 'SIMULATED (MOCKED)'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400">
                        {log.sentAt}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
