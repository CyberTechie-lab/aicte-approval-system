'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { History, Download, Filter, Search, ShieldCheck, RefreshCw, Loader2 } from 'lucide-react';
import { AuditLogEntry } from '@/types';

export function AuditTrailView() {
  const { currentUser, currentRole } = useDashboard();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const url = new URL('/api/audit', window.location.origin);
      if (actionFilter !== 'ALL') url.searchParams.set('actionType', actionFilter);
      if (entityFilter !== 'ALL') url.searchParams.set('entityType', entityFilter);
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, entityFilter]);

  const filteredLogs = logs.filter(log => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.title.toLowerCase().includes(q) ||
      log.remarks.toLowerCase().includes(q) ||
      log.actorName.toLowerCase().includes(q) ||
      (log.actorRole && log.actorRole.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#032761] uppercase tracking-wider flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Central Statutory Digital Audit Trail Vault</span>
          </h2>
          <p className="text-xs text-slate-500">
            Immutable, append-only chronological log of all administrative actions, stage shifts, deficiency cures, and EVC ratifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/audit?format=csv"
            download="AICTE_Central_Audit_Trail.csv"
            className="px-3.5 py-1.5 rounded-xl bg-[#032761] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full Audit CSV</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action title, remarks, or officer name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-slate-50"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="ALL">All Action Types</option>
            <option value="STAGE_TRANSITION">STAGE_TRANSITION</option>
            <option value="DEFICIENCY_REVERT">DEFICIENCY_REVERT</option>
            <option value="DEFICIENCY_CURE_SUBMITTED">DEFICIENCY_CURE_SUBMITTED</option>
            <option value="DEFICIENCY_CURE_VERIFIED">DEFICIENCY_CURE_VERIFIED</option>
            <option value="EVC_SCHEDULED">EVC_SCHEDULED</option>
            <option value="EVC_REPORT_SUBMITTED">EVC_REPORT_SUBMITTED</option>
            <option value="EVC_REPORT_RATIFIED">EVC_REPORT_RATIFIED</option>
            <option value="UNDERTAKING_VERIFIED">UNDERTAKING_VERIFIED</option>
            <option value="DOCUMENT_RENEWAL_VERIFIED">DOCUMENT_RENEWAL_VERIFIED</option>
            <option value="CONFIG_CHANGED">CONFIG_CHANGED</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
          </select>

          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-300 bg-white font-medium"
          >
            <option value="ALL">All Entities</option>
            <option value="APPLICATION">Application</option>
            <option value="DEFICIENCY">Deficiency</option>
            <option value="EVC">EVC Inspection</option>
            <option value="UNDERTAKING">Undertaking</option>
            <option value="DOCUMENT">Document</option>
            <option value="CONFIG">Config</option>
            <option value="AUTH">Auth Session</option>
          </select>

          <button
            onClick={fetchAuditLogs}
            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#032761]/5 border-b border-slate-200 text-[#032761] uppercase tracking-wider font-bold text-[10px]">
            <tr>
              <th className="py-3 px-4">Timestamp (IST)</th>
              <th className="py-3 px-3">Actor &amp; Authority</th>
              <th className="py-3 px-3">Action Type</th>
              <th className="py-3 px-4">Event Title &amp; Statutory Remarks</th>
              <th className="py-3 px-3">Stage Movement</th>
              <th className="py-3 px-4 text-right">IP / Agent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  {isLoading ? 'Loading immutable audit trail...' : 'No audit records matching filter.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{log.actorName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{log.actorRole}</div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px] whitespace-nowrap">
                      {log.actionType}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-md">
                    <div className="font-bold text-slate-900">{log.title}</div>
                    <p className="text-[11px] text-slate-600 line-clamp-2" title={log.remarks}>{log.remarks}</p>
                    {log.authorizedBy && (
                      <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                        Endorsed by: {log.authorizedBy}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {log.stageFrom && log.stageTo ? (
                      <div className="text-[10px] font-mono font-semibold text-blue-900">
                        <span>{log.stageFrom}</span>
                        <span className="text-slate-400 mx-1">&rarr;</span>
                        <span className="text-emerald-700">{log.stageTo}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px] italic">Direct Action</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {log.ip || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
