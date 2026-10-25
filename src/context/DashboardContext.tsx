'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UserAccount,
  UserRole,
  RolePermission,
  ApprovalApplicationItem,
  EvcScheduleItem,
  TimeBoundUndertakingItem,
  DocumentValidityItem,
  AlertNotificationItem,
  AphTimelineConfig,
  ApprovalStage,
  EvcMember,
  SweepSummary,
} from '@/types';

export const DEFAULT_APH_CONFIG: AphTimelineConfig = {
  scrutinyMaxDays: 30,
  reScrutinyMaxDays: 15,
  evcInspectionMaxDays: 21,
  evcReportUploadMaxDays: 5,
  sacAppellateMaxDays: 15,
  deficiencyCurePeriodDays: 15,
  undertakingGracePeriodDays: 30,
  leaseAdvanceAlertDays: 90,
  escalationL1Days: 7,
  escalationL2Days: 14,
  slaWarningDays: 3,
};

interface DashboardContextType {
  currentUser: UserAccount | null;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  login: (user: UserAccount, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;

  hasPermission: (permission: RolePermission) => boolean;
  canAccessTab: (tabId: string) => boolean;

  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  regionFilter: string;
  setRegionFilter: (region: string) => void;
  stageFilter: string;
  setStageFilter: (stage: string) => void;
  routeFilter: string;
  setRouteFilter: (route: string) => void;
  escalationFilter: string;
  setEscalationFilter: (esc: string) => void;

  // Scoped Data
  applications: ApprovalApplicationItem[];
  evcSchedules: EvcScheduleItem[];
  undertakings: TimeBoundUndertakingItem[];
  documents: DocumentValidityItem[];
  alerts: AlertNotificationItem[];
  aphConfig: AphTimelineConfig;
  updateAphConfig: (newConfig: AphTimelineConfig) => Promise<{ success: boolean; message: string }>;

  // All applications (unfiltered by local search/filters)
  rawApplications: ApprovalApplicationItem[];

  // Selected modal
  selectedAppId: string | null;
  setSelectedAppId: (id: string | null) => void;
  selectedApplication: ApprovalApplicationItem | null;

  // Actions connecting to real backend API
  advanceStage: (appId: string, targetStage: ApprovalStage, remarks: string) => Promise<{ success: boolean; message: string }>;
  revertDeficiency: (appId: string, clause: string, description: string, category: string, cureDays?: number) => Promise<{ success: boolean; message: string }>;
  cureDeficiency: (appId: string, deficiencyId: string, responseNote: string, documentUrl?: string) => Promise<{ success: boolean; message: string }>;
  verifyDeficiencyCure: (appId: string, deficiencyId: string, accepted: boolean, remarks: string) => Promise<{ success: boolean; message: string }>;
  scheduleEvc: (appId: string, inspectionType: string, scheduledDate: string, members: EvcMember[]) => Promise<{ success: boolean; message: string }>;
  submitEvcReport: (evcId: string, deficienciesFound: boolean, summary: string, intake?: number, reportUrl?: string) => Promise<{ success: boolean; message: string }>;
  ratifyEvcReport: (evcId: string, approved: boolean, remarks: string) => Promise<{ success: boolean; message: string }>;
  submitUndertakingProof: (undertakingId: string, documentName: string, documentUrl?: string) => Promise<{ success: boolean; message: string }>;
  verifyUndertaking: (undertakingId: string, verified: boolean, remarks: string) => Promise<{ success: boolean; message: string }>;
  submitDocumentRenewal: (docId: string, newExpiryDate: string, renewalDocumentUrl?: string) => Promise<{ success: boolean; message: string }>;
  verifyDocumentRenewal: (docId: string, verified: boolean, remarks?: string) => Promise<{ success: boolean; message: string }>;
  markAlertRead: (alertId: string) => Promise<void>;
  runComplianceSweepNow: (simulatedDate?: string) => Promise<{ success: boolean; summary?: SweepSummary; message?: string }>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Phase 1 Item 1: currentUser starts as null so app always opens on the LoginPage
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('SUPER_ADMIN');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [routeFilter, setRouteFilter] = useState('ALL');
  const [escalationFilter, setEscalationFilter] = useState('ALL');

  // Master Data (fetched from server)
  const [rawApplications, setRawApplications] = useState<ApprovalApplicationItem[]>([]);
  const [rawEvcSchedules, setRawEvcSchedules] = useState<EvcScheduleItem[]>([]);
  const [rawUndertakings, setRawUndertakings] = useState<TimeBoundUndertakingItem[]>([]);
  const [rawDocuments, setRawDocuments] = useState<DocumentValidityItem[]>([]);
  const [rawAlerts, setRawAlerts] = useState<AlertNotificationItem[]>([]);
  const [aphConfig, setAphConfig] = useState<AphTimelineConfig>(DEFAULT_APH_CONFIG);

  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Fetch all live data from server APIs
  const refreshData = useCallback(async () => {
    try {
      const [appsRes, evcRes, undRes, docsRes, alertsRes, configRes] = await Promise.all([
        fetch('/api/applications'),
        fetch('/api/evc'),
        fetch('/api/undertakings'),
        fetch('/api/documents'),
        fetch('/api/alerts'),
        fetch('/api/config'),
      ]);

      if (appsRes.ok) {
        const data = await appsRes.json();
        setRawApplications(data.applications || []);
      }
      if (evcRes.ok) {
        const data = await evcRes.json();
        setRawEvcSchedules(data.evcSchedules || []);
      }
      if (undRes.ok) {
        const data = await undRes.json();
        setRawUndertakings(data.undertakings || []);
      }
      if (docsRes.ok) {
        const data = await docsRes.json();
        setRawDocuments(data.documents || []);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setRawAlerts(data.alerts || []);
      }
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.config) setAphConfig(data.config);
      }
    } catch (err) {
      console.error('Failed to refresh dashboard data:', err);
    }
  }, []);

  // Check authenticated session on initial mount
  useEffect(() => {
    async function initSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setCurrentUser(data.user);
            setCurrentRole(data.user.role);
          }
        }
      } catch (err) {
        console.error('Session init check failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, []);

  // Load data whenever user session changes
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  // Login via API (supports persona switch or credentials)
  const loginWithCredentials = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Authentication failed' };
      }

      setCurrentUser(data.user);
      setCurrentRole(data.user.role);

      if (data.user.role === 'INSTITUTION_PRINCIPAL') {
        setActiveTab('dashboard');
      } else if (data.user.role === 'EVC_CHAIR') {
        setActiveTab('evc');
      } else if (data.user.role === 'SCRUTINY_CONVENER') {
        setActiveTab('applications');
      } else {
        setActiveTab('dashboard');
      }

      await refreshData();
      return { success: true };
    } catch {
      return { success: false, message: 'Network error communicating with authentication service' };
    }
  };

  // Persona 1-click login: still passes through /api/auth/login with password123
  const login = async (user: UserAccount): Promise<{ success: boolean; message?: string }> => {
    return loginWithCredentials(user.email, 'password123');
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    setCurrentUser(null);
    setRawApplications([]);
    setRawEvcSchedules([]);
    setRawUndertakings([]);
    setRawDocuments([]);
    setRawAlerts([]);
    setActiveTab('dashboard');
  };

  // RBAC Permission Evaluator
  const hasPermission = (permission: RolePermission): boolean => {
    if (!currentUser) return false;
    if (currentUser.permissions.includes('ALL_PERMISSIONS')) return true;
    return currentUser.permissions.includes(permission);
  };

  // Tab Accessibility Matrix
  const canAccessTab = (tabId: string): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role;

    if (role === 'INSTITUTION_PRINCIPAL') {
      return tabId === 'dashboard';
    }

    switch (tabId) {
      case 'dashboard':
        return true;
      case 'applications':
        return ['SUPER_ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER', 'SCRUTINY_CONVENER', 'SAC_MEMBER'].includes(role);
      case 'evc':
        return ['SUPER_ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER', 'EVC_CHAIR'].includes(role);
      case 'undertakings':
        return ['SUPER_ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER'].includes(role);
      case 'documents':
        return ['SUPER_ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER'].includes(role);
      case 'alerts':
        return true;
      case 'config':
        return ['SUPER_ADMIN', 'BUREAU_OFFICER'].includes(role);
      case 'reports':
        return ['SUPER_ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER', 'SAC_MEMBER'].includes(role);
      case 'audit':
        return ['SUPER_ADMIN', 'BUREAU_OFFICER'].includes(role);
      default:
        return false;
    }
  };

  // Applications filtered by user UI search & filter selections
  const applications = rawApplications.filter((app) => {
    if (regionFilter !== 'ALL' && app.region !== regionFilter) return false;
    if (stageFilter !== 'ALL' && app.currentStage !== stageFilter) return false;
    if (routeFilter !== 'ALL' && app.route !== routeFilter) return false;
    if (escalationFilter !== 'ALL' && app.escalationLevel !== escalationFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = app.applicationNumber.toLowerCase().includes(q);
      const matchInst = app.institutionName.toLowerCase().includes(q);
      const matchPid = app.institutionPermanentId.toLowerCase().includes(q);
      const matchCity = app.city.toLowerCase().includes(q);
      if (!matchNumber && !matchInst && !matchPid && !matchCity) return false;
    }
    return true;
  });

  const selectedApplication = selectedAppId
    ? rawApplications.find((a) => a.id === selectedAppId || a.applicationNumber === selectedAppId) || null
    : null;

  // Actions calling Server API
  const advanceStage = async (appId: string, targetStage: ApprovalStage, remarks: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStage, remarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to advance stage' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const revertDeficiency = async (appId: string, clause: string, description: string, category: string, cureDays?: number) => {
    try {
      const res = await fetch(`/api/applications/${appId}/deficiencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clause, description, category, cureDays }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to issue deficiency notice' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const cureDeficiency = async (appId: string, deficiencyId: string, responseNote: string, documentUrl?: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/deficiencies/${deficiencyId}/cure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseNote, responseDocumentUrl: documentUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to submit cure' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const verifyDeficiencyCure = async (appId: string, deficiencyId: string, accepted: boolean, remarks: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}/deficiencies/${deficiencyId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted, remarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to verify cure' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const scheduleEvc = async (appId: string, inspectionType: string, scheduledDate: string, members: EvcMember[]) => {
    try {
      const res = await fetch('/api/evc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: appId,
          inspectionType,
          scheduledDate,
          committeeMembers: members,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to schedule EVC' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const submitEvcReport = async (evcId: string, deficienciesFound: boolean, summary: string, intake?: number, reportUrl?: string) => {
    try {
      const res = await fetch(`/api/evc/${evcId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deficienciesFound, summary, intake, reportDocumentUrl: reportUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to submit report' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const ratifyEvcReport = async (evcId: string, approved: boolean, remarks: string) => {
    try {
      const res = await fetch(`/api/evc/${evcId}/ratify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved, remarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to ratify report' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const submitUndertakingProof = async (undertakingId: string, documentName: string, documentUrl?: string) => {
    try {
      const res = await fetch(`/api/undertakings/${undertakingId}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentName, documentUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to submit undertaking proof' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const verifyUndertaking = async (undertakingId: string, verified: boolean, remarks: string) => {
    try {
      const res = await fetch(`/api/undertakings/${undertakingId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified, remarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to verify undertaking' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const submitDocumentRenewal = async (docId: string, newExpiryDate: string, renewalDocumentUrl?: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/renewal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newExpiryDate, renewalDocumentUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to submit renewal' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const verifyDocumentRenewal = async (docId: string, verified: boolean, remarks?: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified, remarks }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to verify document renewal' };
      }
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const markAlertRead = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: 'POST' });
      setRawAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a)));
    } catch {
      // Ignore
    }
  };

  const updateAphConfig = async (newConfig: AphTimelineConfig) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Failed to update SLA timelines' };
      }
      setAphConfig(newConfig);
      await refreshData();
      return { success: true, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  const runComplianceSweepNow = async (simulatedDate?: string) => {
    try {
      const res = await fetch('/api/cron/sweep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulatedDate }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Sweep failed' };
      }
      await refreshData();
      return { success: true, summary: data.summary, message: data.message };
    } catch {
      return { success: false, message: 'Server communication error' };
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        login,
        loginWithCredentials,
        logout,
        hasPermission,
        canAccessTab,
        activeTab,
        setActiveTab,
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
        applications,
        evcSchedules: rawEvcSchedules,
        undertakings: rawUndertakings,
        documents: rawDocuments,
        alerts: rawAlerts,
        aphConfig,
        updateAphConfig,
        rawApplications,
        selectedAppId,
        setSelectedAppId,
        selectedApplication,
        advanceStage,
        revertDeficiency,
        cureDeficiency,
        verifyDeficiencyCure,
        scheduleEvc,
        submitEvcReport,
        ratifyEvcReport,
        submitUndertakingProof,
        verifyUndertaking,
        submitDocumentRenewal,
        verifyDocumentRenewal,
        markAlertRead,
        runComplianceSweepNow,
        refreshData,
        isLoading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
