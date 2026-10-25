import {
  ApprovalRoute,
  ApprovalStage,
  EscalationLevel,
  ApprovalApplicationItem,
  DeficiencyItem,
  EvcMember,
  AuditLogEntry,
} from '@/types';

/**
 * Checks if moving from `fromStage` to `toStage` is permitted under the specified Approval Route
 */
export function canTransitionStage(
  route: ApprovalRoute,
  fromStage: ApprovalStage,
  toStage: ApprovalStage
): { allowed: boolean; reason?: string } {
  if (fromStage === toStage) return { allowed: true };

  // Rule 3a: APPROVED and REJECTED are terminal. Block every transition out of them, including to REJECTED or REVERTED_DEFICIENCY.
  if (fromStage === 'APPROVED' || fromStage === 'REJECTED') {
    return {
      allowed: false,
      reason: `Application is in terminal state (${fromStage}) and cannot transition to any other stage.`,
    };
  }

  // Common administrative rejections & deficiency reverts are allowed from non-terminal states
  if (toStage === 'REJECTED') {
    return { allowed: true };
  }
  if (toStage === 'REVERTED_DEFICIENCY') {
    return { allowed: true };
  }

  // Rule 3b: Moving back after a deficiency must respect the route:
  // - "Only Scrutiny", "Scrutiny + EVC", "Full APH Cycle" -> RE_SCRUTINY
  // - "Only EVC", "EVC + SAC/SHC" -> EVC_SCHEDULED (these routes have no scrutiny stage)
  if (fromStage === 'REVERTED_DEFICIENCY') {
    if (route === 'Only EVC' || route === 'EVC + SAC/SHC') {
      if (toStage === 'EVC_SCHEDULED') return { allowed: true };
      return {
        allowed: false,
        reason: `Route "${route}" has no scrutiny stage; deficiency recovery must resume at EVC_SCHEDULED.`,
      };
    } else {
      if (toStage === 'RE_SCRUTINY') return { allowed: true };
      return {
        allowed: false,
        reason: `Route "${route}" requires re-evaluation at RE_SCRUTINY after deficiency resolution.`,
      };
    }
  }

  // Rule 3c: Add RE_SCRUTINY as a valid source wherever SCRUTINY is
  switch (route) {
    case 'Only Scrutiny': {
      if (fromStage === 'SCRUTINY' || fromStage === 'RE_SCRUTINY') {
        if (toStage === 'APPROVED') return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Route "Only Scrutiny" progresses directly from Scrutiny/Re-Scrutiny to Approval or Deficiency Revert.',
      };
    }

    case 'Scrutiny + EVC': {
      if (fromStage === 'SCRUTINY' || fromStage === 'RE_SCRUTINY') {
        if (toStage === 'EVC_SCHEDULED') return { allowed: true };
      }
      if (fromStage === 'EVC_SCHEDULED' && toStage === 'EVC_COMPLETED') return { allowed: true };
      if (fromStage === 'EVC_COMPLETED' && toStage === 'APPROVED') return { allowed: true };
      return {
        allowed: false,
        reason: 'Route "Scrutiny + EVC" requires Scrutiny/Re-Scrutiny -> EVC Schedule -> EVC Completed -> Approval.',
      };
    }

    case 'Only EVC': {
      if (fromStage === 'EVC_SCHEDULED' && toStage === 'EVC_COMPLETED') return { allowed: true };
      if (fromStage === 'EVC_COMPLETED' && toStage === 'APPROVED') return { allowed: true };
      return {
        allowed: false,
        reason: 'Route "Only EVC" requires EVC Scheduled -> EVC Completed -> Approval.',
      };
    }

    case 'EVC + SAC/SHC': {
      if (fromStage === 'EVC_SCHEDULED' && toStage === 'EVC_COMPLETED') return { allowed: true };
      if (fromStage === 'EVC_COMPLETED' && toStage === 'SAC_SHC_REVIEW') return { allowed: true };
      if (fromStage === 'SAC_SHC_REVIEW' && toStage === 'APPROVED') return { allowed: true };
      return {
        allowed: false,
        reason: 'Route "EVC + SAC/SHC" routes through Appellate Standing Committee review before approval.',
      };
    }

    case 'Full APH Cycle': {
      if (fromStage === 'SCRUTINY' || fromStage === 'RE_SCRUTINY') {
        if (toStage === 'EVC_SCHEDULED') return { allowed: true };
      }
      if (fromStage === 'EVC_SCHEDULED' && toStage === 'EVC_COMPLETED') return { allowed: true };
      if (fromStage === 'EVC_COMPLETED' && toStage === 'SAC_SHC_REVIEW') return { allowed: true };
      if (fromStage === 'SAC_SHC_REVIEW' && toStage === 'APPROVED') return { allowed: true };
      return {
        allowed: false,
        reason: 'Route "Full APH Cycle" requires Scrutiny/Re-Scrutiny -> EVC -> SAC/SHC -> Approval.',
      };
    }

    default:
      return { allowed: true };
  }
}

/**
 * Returns the correct next stage after deficiency cures are verified for a given route
 */
export function getRoutePostDeficiencyStage(route: ApprovalRoute): ApprovalStage {
  if (route === 'Only EVC' || route === 'EVC + SAC/SHC') {
    return 'EVC_SCHEDULED';
  }
  return 'RE_SCRUTINY';
}

/**
 * Calculates days pending and escalation tier based on SLA target
 */
export function calculateSlaStatus(
  slaDeadlineStr: string | Date,
  appliedDateStr: string | Date,
  now: Date = new Date(),
  config?: { escalationL1Days?: number; escalationL2Days?: number }
): {
  isOverdue: boolean;
  daysRemaining: number;
  daysElapsed: number;
  escalationLevel: EscalationLevel;
} {
  const deadline = new Date(slaDeadlineStr);
  const applied = new Date(appliedDateStr);

  const diffMs = deadline.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, Math.floor((now.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24)));

  const isOverdue = daysRemaining < 0;
  let escalationLevel: EscalationLevel = 'LEVEL_0_NORMAL';

  const l1Days = config?.escalationL1Days ?? 7;
  const l2Days = config?.escalationL2Days ?? 14;

  if (isOverdue) {
    const overdueDays = Math.abs(daysRemaining);
    if (overdueDays <= l1Days) {
      escalationLevel = 'LEVEL_1_RO';
    } else if (overdueDays <= l2Days) {
      escalationLevel = 'LEVEL_2_BUREAU';
    } else {
      escalationLevel = 'LEVEL_3_MEMBER_SECRETARY';
    }
  }

  return { isOverdue, daysRemaining, daysElapsed, escalationLevel };
}

/**
 * Generates official AICTE Electronic Case Summary
 */
export function generateElectronicCaseSummary(
  app: ApprovalApplicationItem,
  evc?: { inspectionType: string; status: string; committeeMembers: EvcMember[]; deficienciesFound: boolean; recommendedIntake?: number },
  leaseStatus?: { documentType: string; status: string; expiryDate: string }
): string {
  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  return `================================================================================
ALL INDIA COUNCIL FOR TECHNICAL EDUCATION (AICTE)
STATUTORY APPROVAL PROCESS HANDBOOK (APH) - ELECTRONIC CASE SUMMARY
================================================================================
Generated On: ${generatedAt}
Application No : ${app.applicationNumber}
Permanent ID   : ${app.institutionPermanentId}
Institution    : ${app.institutionName}
Region / State : ${app.region} Region (${app.state}, ${app.city})
Application For: ${app.applicationType} (AY ${app.academicYear})
Prescribed Route: ${app.route}
Current Stage  : ${app.currentStage}
Applied Intake : ${app.appliedIntake} seats | Total Sanctioned: ${app.totalApprovedIntake}
SLA Target Date: ${app.slaDeadline} (Ageing: ${app.daysPending} days)
Assigned Body  : ${app.assignedOfficer}
Escalation Tier: ${app.escalationLevel}

--------------------------------------------------------------------------------
1. SCRUTINY & DEFICIENCY ANALYSIS
--------------------------------------------------------------------------------
Total Deficiencies Recorded: ${app.deficiencies.length}
${app.deficiencies.length === 0 ? 'No scrutiny deficiencies recorded. Institutional submission verified compliant.' : app.deficiencies.map((d: DeficiencyItem, idx: number) => `
  [${idx + 1}] Clause: ${d.clause} (${d.category})
      Description : ${d.description}
      Cure Target : ${d.cureDeadline}
      Status      : ${d.status}
      Remarks     : ${d.institutionResponse || 'Awaiting institutional cure submission'}
      Cure Notes  : ${d.cureRemarks || 'N/A'}
`).join('')}

--------------------------------------------------------------------------------
2. EXPERT VISIT COMMITTEE (EVC) SUMMARY
--------------------------------------------------------------------------------
${evc ? `Inspection Mode : ${evc.inspectionType}
EVC Status      : ${evc.status}
Deficiencies    : ${evc.deficienciesFound ? 'DEFICIENCIES OBSERVED' : 'CLEARED / SATISFACTORY'}
Recommended Cap : ${evc.recommendedIntake !== undefined ? `${evc.recommendedIntake} seats` : 'Not evaluated'}
Panel Members   :
${evc.committeeMembers.map((m: EvcMember) => `  * ${m.name} - ${m.designation} (${m.affiliation})`).join('\n')}` : 'EVC inspection not mandated or yet to be scheduled for this stage.'}

--------------------------------------------------------------------------------
3. LAND LEASE & STATUTORY DOCUMENT VALIDITY
--------------------------------------------------------------------------------
${leaseStatus ? `Document Type   : ${leaseStatus.documentType}
Validity Status : ${leaseStatus.status}
Expiry Date     : ${leaseStatus.expiryDate}
Verification    : ${leaseStatus.status === 'EXPIRED' ? 'CRITICAL BREACH - ACTION REQUIRED' : 'COMPLIANT'}` : 'Document records verified in Central Registry.'}

--------------------------------------------------------------------------------
4. STATUTORY AUDIT & ESCALATION TRAIL
--------------------------------------------------------------------------------
${app.auditTrail.map((trail: AuditLogEntry) => `[${trail.timestamp}] ${trail.actionType} by ${trail.actorName} (${trail.actorRole})
  Title  : ${trail.title}
  Remarks: ${trail.remarks}
  AuthBy : ${trail.authorizedBy || 'System'}`).join('\n\n')}

================================================================================
REGULATORY SAFEGUARD NOTE:
This electronic case summary is automatically compiled from authorized AICTE
records to support decision-making. Pursuant to AICTE Regulations, automated
recommendations shall not supersede statutory verification or decisions
reserved for the Competent Authority.
================================================================================`;
}
