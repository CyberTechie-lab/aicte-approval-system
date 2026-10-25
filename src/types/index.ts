export type UserRole =
  | 'SUPER_ADMIN'              // Member Secretary / Executive Council (Appellate authority)
  | 'BUREAU_OFFICER'           // Adviser / Director (Approval Bureau, Headquarters)
  | 'REGIONAL_OFFICER'         // Regional Officer (RO Southern, Western, Northern, etc.)
  | 'SCRUTINY_CONVENER'        // Head of Scrutiny / Re-Scrutiny Committee
  | 'EVC_CHAIR'                // Head of Expert Visit Committee (EVC Inspection)
  | 'SAC_MEMBER'               // Standing Appellate Committee (SAC/SHC)
  | 'INSTITUTION_PRINCIPAL';   // Principal / Director of Technical Institution

export type RolePermission =
  | 'ALL_PERMISSIONS'
  | 'VIEW_ALL_REGIONS'
  | 'VIEW_REGIONAL_ONLY'
  | 'VIEW_OWN_INSTITUTION_ONLY'
  | 'SCRUTINY_VERIFY'
  | 'ISSUE_DEFICIENCY_REVERT'
  | 'SUBMIT_DEFICIENCY_CURE'
  | 'SCHEDULE_EVC_PANEL'
  | 'SUBMIT_EVC_REPORT'
  | 'CONDUCT_SAC_HEARING'
  | 'VERIFY_UNDERTAKINGS'
  | 'SUBMIT_UNDERTAKING_PROOF'
  | 'VERIFY_LEASE_RENEWAL'
  | 'SUBMIT_LEASE_RENEWAL'
  | 'CONFIGURE_APH_SLAS'
  | 'GRANT_STATUTORY_APPROVAL'
  | 'OVERRIDE_ESCALATION'
  | 'EXPORT_REGULATORY_DATA';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  designation: string;
  department: string;
  region?: string;
  institutionPermanentId?: string;
  institutionName?: string;
  avatarBg?: string;
  badgeBg?: string;
  permissions: RolePermission[];
  description: string;
}

export type ApprovalRoute =
  | 'Only Scrutiny'
  | 'Scrutiny + EVC'
  | 'EVC + SAC/SHC'
  | 'Only EVC'
  | 'Full APH Cycle';

export type ApprovalStage =
  | 'SCRUTINY'
  | 'RE_SCRUTINY'
  | 'EVC_SCHEDULED'
  | 'EVC_COMPLETED'
  | 'SAC_SHC_REVIEW'
  | 'APPROVED'
  | 'REVERTED_DEFICIENCY'
  | 'REJECTED';

export type EscalationLevel =
  | 'LEVEL_0_NORMAL'
  | 'LEVEL_1_RO'
  | 'LEVEL_2_BUREAU'
  | 'LEVEL_3_MEMBER_SECRETARY';

export interface DeficiencyItem {
  id: string;
  applicationId: string;
  clause: string;
  description: string;
  category: 'Land & Building' | 'Faculty Cadre' | 'Laboratory Equipment' | 'Financial Soundness' | 'Statutory Approvals' | string;
  cureDeadline: string;
  status: 'PENDING_CURE' | 'CURED_PENDING_VERIFICATION' | 'CURED_VERIFIED' | 'EXPIRED_UNRESOLVED';
  institutionResponse?: string;
  responseDocumentUrl?: string;
  cureRemarks?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export type AuditActionType =
  | 'STAGE_TRANSITION'
  | 'DEFICIENCY_REVERT'
  | 'DEFICIENCY_CURE_SUBMITTED'
  | 'DEFICIENCY_CURE_VERIFIED'
  | 'EVC_ORDERED'
  | 'EVC_SCHEDULED'
  | 'EVC_REPORT_SUBMITTED'
  | 'EVC_REPORT_RATIFIED'
  | 'UNDERTAKING_VERIFIED'
  | 'UNDERTAKING_PROOF_SUBMITTED'
  | 'UNDERTAKING_REJECTED'
  | 'DOCUMENT_RENEWAL_SUBMITTED'
  | 'DOCUMENT_RENEWAL_VERIFIED'
  | 'DOCUMENT_RENEWAL_REJECTED'
  | 'ALERT_GENERATED'
  | 'ALERT_READ'
  | 'NOTIFICATION_SENT'
  | 'CONFIG_CHANGED'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CASE_CLOSED'
  | 'ESCALATION_TRIGGERED';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actionType: AuditActionType;
  applicationId?: string;
  entityType?: string;
  entityId?: string;
  stageFrom?: string;
  stageTo?: string;
  title: string;
  remarks: string;
  authorizedBy?: string;
  ip?: string;
  userAgent?: string;
}

export interface EvcMember {
  name: string;
  designation: string;
  affiliation: string;
  specialization: string;
  contact: string;
}

export interface EvcScheduleItem {
  id: string;
  applicationId: string;
  applicationNumber: string;
  institutionPermanentId: string;
  institutionName: string;
  region: string;
  inspectionType: 'PHYSICAL_INSPECTION' | 'SURPRISE_INSPECTION' | 'VIRTUAL_VERIFICATION';
  status: 'PENDING_SCHEDULING' | 'PANEL_CONSTITUTED' | 'VISIT_CONDUCTED' | 'REPORT_SUBMITTED' | 'REPORT_RATIFIED';
  scheduledDate?: string;
  slaReportDeadline: string;
  committeeMembers: EvcMember[];
  reportSubmittedDate?: string;
  deficienciesFound: boolean;
  deficiencySummary?: string;
  recommendedIntake?: number;
  reportDocumentUrl?: string;
  escalationTriggered: boolean;
  delayReason?: string;
}

export interface TimeBoundUndertakingItem {
  id: string;
  applicationId: string;
  applicationNumber: string;
  institutionPermanentId: string;
  institutionName: string;
  region: string;
  category: 'INFRASTRUCTURE_UPGRADE' | 'FACULTY_CADRE_RATIO' | 'LAB_EQUIPMENT' | 'ACCESSIBILITY_RPWD' | 'ENDOWMENT_FUND' | string;
  conditionTitle: string;
  prescribedCondition: string;
  imposedDate: string;
  dueDate: string;
  status: 'PENDING_SUBMISSION' | 'SUBMITTED_PENDING_VERIFICATION' | 'VERIFIED_COMPLIANT' | 'REJECTED_RESUBMIT' | 'OVERDUE_ESCALATED';
  evidenceDocumentName?: string;
  evidenceDocumentUrl?: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verificationRemarks?: string;
  escalationLevel: EscalationLevel;
}

export interface DocumentValidityItem {
  id: string;
  institutionPermanentId: string;
  institutionName: string;
  region: string;
  documentType: 'LAND_LEASE_DEED' | 'FIRE_SAFETY_NOC' | 'OCCUPANCY_CERTIFICATE' | 'BUILDING_STABILITY' | 'POLLUTION_CLEARANCE' | string;
  documentNumber: string;
  issuingAuthority: string;
  issuedDate: string;
  expiryDate: string;
  status: 'ACTIVE_VALID' | 'EXPIRING_SOON_90D' | 'CRITICAL_30D' | 'EXPIRED';
  documentUrl: string;
  renewalDocumentUrl?: string;
  renewalSubmittedDate?: string;
  renewedExpiryDate?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationRemarks?: string;
  renewalStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  escalationNoticeServed: boolean;
}

export interface AlertNotificationItem {
  id: string;
  dedupKey?: string;
  type: 'SLA_WARNING' | 'ESCALATION' | 'EVC_DELAY' | 'UNDERTAKING_OVERDUE' | 'LEASE_EXPIRY' | 'DEFICIENCY_CURE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  timestamp: string;
  relatedEntityId: string;
  targetRole: 'ALL' | UserRole;
  region?: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface ApprovalApplicationItem {
  id: string;
  applicationNumber: string;
  institutionPermanentId: string;
  institutionName: string;
  region: string;
  state: string;
  city: string;
  applicationType: 'Extension of Approval (EoA)' | 'New Technical Institution' | 'Increase in Intake' | 'New Course Introduction' | 'Closure of Program';
  academicYear: string;
  appliedDate: string;
  route: ApprovalRoute;
  currentStage: ApprovalStage;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  escalationLevel: EscalationLevel;
  slaDeadline: string;
  daysPending: number;
  assignedOfficer: string;
  assignedCommittee?: string;
  appliedIntake: number;
  totalApprovedIntake: number;
  deficiencies: DeficiencyItem[];
  auditTrail: AuditLogEntry[];
}

export interface AphTimelineConfig {
  scrutinyMaxDays: number;
  reScrutinyMaxDays: number;
  evcInspectionMaxDays: number;
  evcReportUploadMaxDays: number;
  sacAppellateMaxDays: number;
  deficiencyCurePeriodDays: number;
  undertakingGracePeriodDays: number;
  leaseAdvanceAlertDays: number;
  escalationL1Days: number;
  escalationL2Days: number;
  slaWarningDays: number;
}

export interface SweepSummary {
  appsEvaluated: number;
  appsEscalated: number;
  docsFlagged: number;
  undertakingsOverdue: number;
  evcDelayed: number;
  deficienciesExpired: number;
  alertsCreated: number;
}
