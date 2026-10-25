'use client';

import React from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { Search, Filter, RotateCcw } from 'lucide-react';

export function QuickFilterBar() {
  const {
    searchQuery,
    setSearchQuery,
    regionFilter,
    setRegionFilter,
    stageFilter,
    setStageFilter,
    routeFilter,
    setRouteFilter,
    escalationFilter,
    setEscalationFilter,
  } = useDashboard();

  const resetFilters = () => {
    setSearchQuery('');
    setRegionFilter('ALL');
    setStageFilter('ALL');
    setRouteFilter('ALL');
    setEscalationFilter('ALL');
  };

  return (
    <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by Application No, Institute Name, PID or City..."
          className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
        />
      </div>

      {/* Select Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Region */}
        <select
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
          aria-label="Filter by AICTE Region"
          className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Regions</option>
          <option value="Southern">Southern Region</option>
          <option value="Western">Western Region</option>
          <option value="Northern">Northern Region</option>
          <option value="Eastern">Eastern Region</option>
          <option value="South-West">South-West Region</option>
          <option value="Central">Central Region</option>
        </select>

        {/* Stage */}
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          aria-label="Filter by Processing Stage"
          className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Stages</option>
          <option value="SCRUTINY">Scrutiny Stage</option>
          <option value="RE_SCRUTINY">Re-Scrutiny</option>
          <option value="EVC_SCHEDULED">EVC Scheduled</option>
          <option value="EVC_COMPLETED">EVC Completed</option>
          <option value="SAC_SHC_REVIEW">SAC / SHC Appellate</option>
          <option value="REVERTED_DEFICIENCY">Reverted (Deficiency)</option>
          <option value="APPROVED">Approved</option>
        </select>

        {/* Route */}
        <select
          value={routeFilter}
          onChange={e => setRouteFilter(e.target.value)}
          aria-label="Filter by Prescribed APH Route"
          className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All APH Routes</option>
          <option value="Only Scrutiny">Only Scrutiny</option>
          <option value="Scrutiny + EVC">Scrutiny + EVC</option>
          <option value="EVC + SAC/SHC">EVC + SAC/SHC</option>
          <option value="Only EVC">Only EVC</option>
          <option value="Full APH Cycle">Full APH Cycle</option>
        </select>

        {/* Escalation Tier */}
        <select
          value={escalationFilter}
          onChange={e => setEscalationFilter(e.target.value)}
          aria-label="Filter by Escalation Level"
          className="px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All Escalation Tiers</option>
          <option value="LEVEL_0_NORMAL">Normal (Within SLA)</option>
          <option value="LEVEL_1_RO">Level 1 (RO Escalation)</option>
          <option value="LEVEL_2_BUREAU">Level 2 (Bureau Escalation)</option>
          <option value="LEVEL_3_MEMBER_SECRETARY">Level 3 (Member Secretary)</option>
        </select>

        {/* Reset */}
        <button
          onClick={resetFilters}
          className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          title="Reset Filters"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
