'use client';

import React, { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { USER_ACCOUNTS } from '@/data/users';
import {
  Bell,
  Download,
  Shield,
  Clock,
  ChevronDown,
  Building2,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  LogOut,
  UserCheck,
  MapPin,
  Lock,
  Sparkles,
} from 'lucide-react';
import { exportApplicationsCsv, exportUndertakingsCsv, exportDocumentsCsv } from '@/lib/exportUtils';

export function Header() {
  const {
    currentUser,
    currentRole,
    login,
    logout,
    hasPermission,
    alerts,
    markAlertRead,
    applications,
    undertakings,
    documents,
    setActiveTab,
    setSelectedAppId,
  } = useDashboard();

  const [timeStr, setTimeStr] = useState<string>('');
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' IST'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadAlerts = alerts.filter(a => !a.isRead);

  return (
    <header className="sticky top-0 z-40 bg-[#032761] text-white shadow-md">
      {/* Tiranga Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-[#FFFFFF] to-[#138808]" />

      <div className="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Emblem */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 shadow-inner shrink-0">
            <span className="font-extrabold text-[#032761] text-xs tracking-tighter">AICTE</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wide text-white">AICTE APPROVAL AUTOMATION</span>
              <span className="hidden sm:inline-flex text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                APH 2026-27 Compliant
              </span>
              {isDemoMode && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
                  <Sparkles className="w-2.5 h-2.5" />
                  DEMO MODE
                </span>
              )}
            </div>
            <p className="text-xs text-blue-200 hidden md:block">
              Workflow Automation, Compliance Monitoring &amp; Alert Management System
            </p>
          </div>
        </div>

        {/* Live Clock & Right Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live IST Clock */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-xs font-mono text-blue-100 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>{timeStr || 'Loading clock...'}</span>
          </div>

          {/* CSV Reports Export Menu */}
          {hasPermission('EXPORT_REGULATORY_DATA') && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowExportMenu(!showExportMenu);
                  setShowAlertMenu(false);
                  setShowPersonaMenu(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-xs font-medium text-blue-100 border border-blue-700/50 transition cursor-pointer"
                title="Statutory CSV Exporters"
              >
                <Download className="w-3.5 h-3.5 text-blue-300" />
                <span className="hidden md:inline">Export CSV</span>
                <ChevronDown className="w-3 h-3 text-blue-300" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-slate-800 shadow-2xl border border-slate-200 py-2 z-50 text-xs">
                  <div className="px-3 py-1.5 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    Statutory Council Extracts
                  </div>
                  <button
                    onClick={() => {
                      exportApplicationsCsv(applications);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Master Applications Extract (CSV)</span>
                  </button>
                  <button
                    onClick={() => {
                      exportUndertakingsCsv(undertakings);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                    <span>Time-Bound Undertakings Registry (CSV)</span>
                  </button>
                  <button
                    onClick={() => {
                      exportDocumentsCsv(documents);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                    <span>30-Year Lease &amp; NOC Records (CSV)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Alert Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAlertMenu(!showAlertMenu);
                setShowExportMenu(false);
                setShowPersonaMenu(false);
              }}
              className="relative p-2 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 transition cursor-pointer"
              title="Alerts and Escalations"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#032761]">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {showAlertMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white text-slate-800 shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs uppercase tracking-wider">Statutory Alerts &amp; Escalations</span>
                  </div>
                  <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded font-mono font-semibold">
                    {unreadAlerts.length} Unread
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {alerts.map(a => (
                    <div
                      key={a.id}
                      onClick={() => {
                        markAlertRead(a.id);
                        if (a.relatedEntityId.startsWith('APP-')) {
                          setSelectedAppId(a.relatedEntityId);
                        } else if (a.type === 'EVC_DELAY') {
                          setActiveTab('evc');
                        } else if (a.type === 'UNDERTAKING_OVERDUE') {
                          setActiveTab('undertakings');
                        } else if (a.type === 'LEASE_EXPIRY') {
                          setActiveTab('documents');
                        }
                        setShowAlertMenu(false);
                      }}
                      className={`p-3 text-xs transition cursor-pointer ${
                        a.isRead ? 'bg-white hover:bg-slate-50' : 'bg-amber-50/70 hover:bg-amber-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-bold ${a.severity === 'CRITICAL' ? 'text-red-700' : 'text-slate-800'}`}>
                          {a.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">{a.timestamp.split(' ')[0]}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{a.message}</p>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => {
                      setActiveTab('alerts');
                      setShowAlertMenu(false);
                    }}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-900"
                  >
                    View All Escalations Console &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Session Profile & Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPersonaMenu(!showPersonaMenu);
                setShowAlertMenu(false);
                setShowExportMenu(false);
              }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg bg-blue-900/80 hover:bg-blue-800 border border-blue-600/50 text-xs font-medium text-white transition cursor-pointer"
            >
              <div className={`w-6 h-6 rounded-full ${currentUser?.avatarBg || 'bg-blue-700'} flex items-center justify-center text-white text-[10px] font-bold`}>
                {currentUser ? currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'AI'}
              </div>
              <div className="text-left hidden md:block">
                <div className="font-semibold leading-tight text-white line-clamp-1 max-w-[130px]">
                  {currentUser?.name || 'Sign In'}
                </div>
                <div className="text-[10px] text-blue-200 leading-none flex items-center gap-1">
                  <span>{currentUser?.role.replace(/_/g, ' ') || 'Select Role'}</span>
                  {currentUser?.region && <span className="text-[9px] text-emerald-300">({currentUser.region})</span>}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-blue-300" />
            </button>

            {showPersonaMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white text-slate-800 shadow-2xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Current AICTE Session</div>
                  <div className="font-bold text-slate-900 text-sm">{currentUser?.name}</div>
                  <div className="text-xs text-blue-700 font-medium">{currentUser?.designation}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{currentUser?.department}</div>
                  {currentUser?.region && (
                    <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{currentUser.region} Regional Jurisdiction</span>
                    </div>
                  )}
                </div>

                {isDemoMode && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-amber-700 bg-amber-50 flex items-center justify-between">
                      <span>Switch Persona (Demo Mode)</span>
                      <span className="font-mono text-[9px] bg-amber-200/80 px-1.5 py-0.2 rounded">SERVER LOGIN</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {USER_ACCOUNTS.map(user => (
                        <button
                          key={user.id}
                          onClick={async () => {
                            await login(user);
                            setShowPersonaMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 hover:bg-blue-50 flex items-start gap-2.5 transition ${
                            currentUser?.id === user.id ? 'bg-blue-50/80 border-l-4 border-blue-600' : ''
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full ${user.avatarBg} text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}>
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-slate-900 truncate">{user.name}</span>
                              <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {user.role.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{user.designation}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="p-2 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => {
                      logout();
                      setShowPersonaMenu(false);
                    }}
                    className="w-full py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
