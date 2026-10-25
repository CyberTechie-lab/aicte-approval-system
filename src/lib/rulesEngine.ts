import { prisma } from './prisma';
import { calculateSlaStatus } from './workflowEngine';
import { sendEmail, sendSms } from './notifier';
import { UserRole } from '@/types';

export interface SweepSummary {
  sweepTimestamp: string;
  simulatedDate: string;
  appsEscalated: number;
  docsFlagged: number;
  undertakingsOverdue: number;
  evcDelayed: number;
  deficienciesExpired: number;
  alertsCreated: number;
}

export async function getAphConfig() {
  let config = await prisma.aphConfig.findUnique({
    where: { id: 'default' },
  });

  if (!config) {
    config = await prisma.aphConfig.create({
      data: {
        id: 'default',
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
      },
    });
  }
  return config;
}

export async function runComplianceSweep(now: Date = new Date()): Promise<SweepSummary> {
  const config = await getAphConfig();
  const summary: SweepSummary = {
    sweepTimestamp: new Date().toISOString(),
    simulatedDate: now.toISOString(),
    appsEscalated: 0,
    docsFlagged: 0,
    undertakingsOverdue: 0,
    evcDelayed: 0,
    deficienciesExpired: 0,
    alertsCreated: 0,
  };

  // Helper to safely dispatch alert and notification with deduplication
  const createAlertIfNew = async ({
    dedupKey,
    type,
    severity,
    title,
    message,
    relatedEntityId,
    targetRole,
    region,
    recipientEmail,
    recipientPhone,
  }: {
    dedupKey: string;
    type: 'SLA_WARNING' | 'ESCALATION' | 'EVC_DELAY' | 'UNDERTAKING_OVERDUE' | 'LEASE_EXPIRY' | 'DEFICIENCY_CURE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    relatedEntityId: string;
    targetRole: 'ALL' | UserRole;
    region?: string | null;
    recipientEmail?: string | null;
    recipientPhone?: string | null;
  }) => {
    const existing = await prisma.alertNotification.findUnique({
      where: { dedupKey },
    });
    if (existing) return;

    const alert = await prisma.alertNotification.create({
      data: {
        dedupKey,
        type,
        severity,
        title,
        message,
        timestamp: now,
        relatedEntityId,
        targetRole,
        region: region || null,
        isRead: false,
      },
    });
    summary.alertsCreated += 1;

    // Send notifications
    if (recipientEmail) {
      await sendEmail({
        to: recipientEmail,
        subject: `[AICTE REGULATORY SENTINEL] ${title}`,
        body: message,
        relatedAlertId: alert.id,
      });
    }
    if (recipientPhone) {
      await sendSms({
        to: recipientPhone,
        text: `AICTE Alert: ${title} - ${message.substring(0, 120)}...`,
        relatedAlertId: alert.id,
      });
    }
  };

  // Pre-load regional officers and bureau emails for dispatch
  const users = await prisma.user.findMany();
  const getRegionalOfficerEmail = (region: string) => {
    const ro = users.find(u => u.role === 'REGIONAL_OFFICER' && u.region?.toLowerCase() === region.toLowerCase());
    return ro?.email || 'ro.southern@aicte-india.org';
  };
  const bureauEmail = users.find(u => u.role === 'BUREAU_OFFICER')?.email || 'adviser.ab@aicte-india.org';
  const superAdminEmail = users.find(u => u.role === 'SUPER_ADMIN')?.email || 'member.secretary@aicte-india.org';

  // =========================================================================
  // a. APPLICATIONS: calculate daysPending, stage-specific SLA, and escalation
  // =========================================================================
  const applications = await prisma.approvalApplication.findMany({
    include: { institution: true },
  });

  for (const app of applications) {
    if (app.currentStage === 'APPROVED' || app.currentStage === 'REJECTED') {
      continue;
    }

    const appliedTime = new Date(app.appliedDate).getTime();
    const daysPending = Math.max(0, Math.floor((now.getTime() - appliedTime) / (1000 * 60 * 60 * 24)));

    // Calculate stage-specific SLA duration from config
    let stageMaxDays = config.scrutinyMaxDays;
    if (app.currentStage === 'RE_SCRUTINY') stageMaxDays = config.reScrutinyMaxDays;
    else if (app.currentStage === 'EVC_SCHEDULED') stageMaxDays = config.evcInspectionMaxDays;
    else if (app.currentStage === 'SAC_SHC_REVIEW') stageMaxDays = config.sacAppellateMaxDays;
    else if (app.currentStage === 'REVERTED_DEFICIENCY') stageMaxDays = config.deficiencyCurePeriodDays;

    // New Technical Institution applications get higher priority and tighter deadlines
    if (app.applicationType === 'New Technical Institution') {
      stageMaxDays = Math.max(7, Math.floor(stageMaxDays * 0.75));
    }

    const slaStatus = calculateSlaStatus(app.slaDeadline, app.appliedDate, now, {
      escalationL1Days: config.escalationL1Days,
      escalationL2Days: config.escalationL2Days,
    });

    const isEscalated = slaStatus.escalationLevel !== 'LEVEL_0_NORMAL';
    if (isEscalated && app.escalationLevel !== slaStatus.escalationLevel) {
      summary.appsEscalated += 1;
    }

    await prisma.approvalApplication.update({
      where: { id: app.id },
      data: {
        daysPending,
        escalationLevel: slaStatus.escalationLevel,
      },
    });

    // Check SLA approaching (within config.slaWarningDays)
    if (!slaStatus.isOverdue && slaStatus.daysRemaining > 0 && slaStatus.daysRemaining <= config.slaWarningDays) {
      await createAlertIfNew({
        dedupKey: `${app.id}_SLA_APPROACHING_${slaStatus.daysRemaining}D`,
        type: 'SLA_WARNING',
        severity: 'MEDIUM',
        title: `SLA Approaching: ${app.applicationNumber}`,
        message: `Application ${app.applicationNumber} (${app.institutionName}) in ${app.currentStage} has ${slaStatus.daysRemaining} day(s) remaining before statutory SLA breach.`,
        relatedEntityId: app.id,
        targetRole: 'REGIONAL_OFFICER',
        region: app.region,
        recipientEmail: getRegionalOfficerEmail(app.region),
      });
    }

    // Check SLA breach and escalating tiers
    if (slaStatus.isOverdue) {
      const overdueDays = Math.abs(slaStatus.daysRemaining);
      if (slaStatus.escalationLevel === 'LEVEL_1_RO') {
        await createAlertIfNew({
          dedupKey: `${app.id}_ESC_L1`,
          type: 'ESCALATION',
          severity: 'HIGH',
          title: `Level 1 Escalation: SLA Exceeded on ${app.applicationNumber}`,
          message: `Application ${app.applicationNumber} has exceeded statutory timeline by ${overdueDays} day(s). Escalated to Regional Officer (${app.region}).`,
          relatedEntityId: app.id,
          targetRole: 'REGIONAL_OFFICER',
          region: app.region,
          recipientEmail: getRegionalOfficerEmail(app.region),
        });
      } else if (slaStatus.escalationLevel === 'LEVEL_2_BUREAU') {
        await createAlertIfNew({
          dedupKey: `${app.id}_ESC_L2`,
          type: 'ESCALATION',
          severity: 'CRITICAL',
          title: `Level 2 Escalation: Overdue Application ${app.applicationNumber}`,
          message: `Application ${app.applicationNumber} overdue by ${overdueDays} day(s). Regional resolution timed out; escalated to Approval Bureau Adviser HQ.`,
          relatedEntityId: app.id,
          targetRole: 'BUREAU_OFFICER',
          recipientEmail: bureauEmail,
        });
      } else if (slaStatus.escalationLevel === 'LEVEL_3_MEMBER_SECRETARY') {
        await createAlertIfNew({
          dedupKey: `${app.id}_ESC_L3`,
          type: 'ESCALATION',
          severity: 'CRITICAL',
          title: `Level 3 Statutory Escalation: ${app.applicationNumber}`,
          message: `Application ${app.applicationNumber} overdue by ${overdueDays} day(s). Escalated directly to Member Secretary & Appellate Authority.`,
          relatedEntityId: app.id,
          targetRole: 'SUPER_ADMIN',
          recipientEmail: superAdminEmail,
        });
      }
    }
  }

  // =========================================================================
  // c. DOCUMENTS: calculate status from expiryDate & leaseAdvanceAlertDays
  // =========================================================================
  const documents = await prisma.documentValidity.findMany({
    include: { institution: true },
  });

  for (const doc of documents) {
    const expiryTime = new Date(doc.expiryDate).getTime();
    const diffDays = Math.ceil((expiryTime - now.getTime()) / (1000 * 60 * 60 * 24));

    let newStatus = doc.status;
    let escalationNotice = doc.escalationNoticeServed;

    if (diffDays > config.leaseAdvanceAlertDays) {
      newStatus = 'ACTIVE_VALID';
    } else if (diffDays > 30 && diffDays <= config.leaseAdvanceAlertDays) {
      newStatus = 'EXPIRING_SOON_90D';
    } else if (diffDays >= 0 && diffDays <= 30) {
      newStatus = 'CRITICAL_30D';
    } else {
      newStatus = 'EXPIRED';
      if (!doc.renewalDocumentUrl) {
        escalationNotice = true;
      }
    }

    if (newStatus !== doc.status || escalationNotice !== doc.escalationNoticeServed) {
      await prisma.documentValidity.update({
        where: { id: doc.id },
        data: {
          status: newStatus,
          escalationNoticeServed: escalationNotice,
        },
      });
      summary.docsFlagged += 1;
    }

    // Advance alert (within leaseAdvanceAlertDays)
    if (newStatus === 'EXPIRING_SOON_90D') {
      await createAlertIfNew({
        dedupKey: `${doc.id}_DOC_EXP_90D`,
        type: 'LEASE_EXPIRY',
        severity: 'MEDIUM',
        title: `Advance Document Expiry Notice: ${doc.documentType}`,
        message: `${doc.documentType} (No. ${doc.documentNumber}) for ${doc.institutionName} expires in ${diffDays} days (${new Date(doc.expiryDate).toLocaleDateString('en-IN')}). Prepare renewal documents.`,
        relatedEntityId: doc.id,
        targetRole: 'INSTITUTION_PRINCIPAL',
        region: doc.region,
        recipientEmail: doc.institution?.contactEmail,
      });
    }

    // Critical 30-day alert
    if (newStatus === 'CRITICAL_30D') {
      await createAlertIfNew({
        dedupKey: `${doc.id}_DOC_CRIT_30D`,
        type: 'LEASE_EXPIRY',
        severity: 'HIGH',
        title: `CRITICAL: Document Expiring in ${diffDays} Days`,
        message: `Statutory document ${doc.documentType} for ${doc.institutionName} will expire in ${diffDays} days. Immediate registered renewal submission required.`,
        relatedEntityId: doc.id,
        targetRole: 'INSTITUTION_PRINCIPAL',
        region: doc.region,
        recipientEmail: doc.institution?.contactEmail,
      });
    }

    // Expired alert & escalation
    if (newStatus === 'EXPIRED') {
      await createAlertIfNew({
        dedupKey: `${doc.id}_DOC_EXPIRED_BREACH`,
        type: 'LEASE_EXPIRY',
        severity: 'CRITICAL',
        title: `STATUTORY BREACH: Expired ${doc.documentType}`,
        message: `${doc.documentType} for ${doc.institutionName} expired on ${new Date(doc.expiryDate).toLocaleDateString('en-IN')}. Regulatory show-cause notice triggered.`,
        relatedEntityId: doc.id,
        targetRole: 'REGIONAL_OFFICER',
        region: doc.region,
        recipientEmail: getRegionalOfficerEmail(doc.region),
      });
    }
  }

  // =========================================================================
  // d. UNDERTAKINGS: PENDING_SUBMISSION past dueDate + grace -> OVERDUE_ESCALATED
  // =========================================================================
  const undertakings = await prisma.timeBoundUndertaking.findMany({
    include: { institution: true },
  });

  for (const und of undertakings) {
    if (und.status === 'VERIFIED_COMPLIANT') continue;

    const dueTime = new Date(und.dueDate).getTime();
    const graceMs = config.undertakingGracePeriodDays * 24 * 60 * 60 * 1000;
    const finalDeadline = dueTime + graceMs;

    const diffDays = Math.ceil((dueTime - now.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdueGrace = now.getTime() > finalDeadline;

    let updatedStatus = und.status;
    let escalationLevel = und.escalationLevel;

    if (isOverdueGrace && (und.status === 'PENDING_SUBMISSION' || und.status === 'REJECTED_RESUBMIT')) {
      updatedStatus = 'OVERDUE_ESCALATED';
      const daysOverdue = Math.floor((now.getTime() - finalDeadline) / (1000 * 60 * 60 * 24));
      if (daysOverdue <= config.escalationL1Days) {
        escalationLevel = 'LEVEL_1_RO';
      } else if (daysOverdue <= config.escalationL2Days) {
        escalationLevel = 'LEVEL_2_BUREAU';
      } else {
        escalationLevel = 'LEVEL_3_MEMBER_SECRETARY';
      }

      await prisma.timeBoundUndertaking.update({
        where: { id: und.id },
        data: {
          status: updatedStatus,
          escalationLevel,
        },
      });
      summary.undertakingsOverdue += 1;

      await createAlertIfNew({
        dedupKey: `${und.id}_UND_OVERDUE_${escalationLevel}`,
        type: 'UNDERTAKING_OVERDUE',
        severity: 'CRITICAL',
        title: `Overdue Undertaking: ${und.conditionTitle}`,
        message: `Time-bound undertaking "${und.conditionTitle}" for ${und.institutionName} is overdue beyond grace period (${daysOverdue} days overdue). Escalation: ${escalationLevel}.`,
        relatedEntityId: und.id,
        targetRole: escalationLevel === 'LEVEL_1_RO' ? 'REGIONAL_OFFICER' : escalationLevel === 'LEVEL_2_BUREAU' ? 'BUREAU_OFFICER' : 'SUPER_ADMIN',
        region: und.region,
        recipientEmail: escalationLevel === 'LEVEL_1_RO' ? getRegionalOfficerEmail(und.region) : escalationLevel === 'LEVEL_2_BUREAU' ? bureauEmail : superAdminEmail,
      });
    } else if (diffDays > 0 && diffDays <= config.slaWarningDays && und.status === 'PENDING_SUBMISSION') {
      // Approaching undertaking reminder
      await createAlertIfNew({
        dedupKey: `${und.id}_UND_APPROACHING_${diffDays}D`,
        type: 'UNDERTAKING_OVERDUE',
        severity: 'MEDIUM',
        title: `Upcoming Compliance Deadline: ${und.conditionTitle}`,
        message: `Undertaking requirement "${und.conditionTitle}" for ${und.institutionName} is due in ${diffDays} day(s). Upload verified documentary proof.`,
        relatedEntityId: und.id,
        targetRole: 'INSTITUTION_PRINCIPAL',
        region: und.region,
        recipientEmail: und.institution?.contactEmail,
      });
    }
  }

  // =========================================================================
  // e. EVC: track scheduling, inspection date, report upload max days
  // =========================================================================
  const evcSchedules = await prisma.evcSchedule.findMany({
    include: { application: true },
  });

  for (const evc of evcSchedules) {
    if (evc.status === 'REPORT_RATIFIED') continue;

    let delayReason: string | null = null;
    let triggerEscalation = false;

    // 1. PENDING_SCHEDULING older than evcInspectionMaxDays
    if (evc.status === 'PENDING_SCHEDULING') {
      const createdTime = new Date(evc.createdAt).getTime();
      const elapsed = Math.floor((now.getTime() - createdTime) / (1000 * 60 * 60 * 24));
      if (elapsed > config.evcInspectionMaxDays) {
        delayReason = `Panel not constituted within statutory timeline of ${config.evcInspectionMaxDays} days (Elapsed: ${elapsed} days).`;
        triggerEscalation = true;
      }
    }

    // 2. PANEL_CONSTITUTED past scheduledDate with no visit
    if (evc.status === 'PANEL_CONSTITUTED' && evc.scheduledDate) {
      const scheduledTime = new Date(evc.scheduledDate).getTime();
      if (now.getTime() > scheduledTime) {
        delayReason = `Scheduled inspection date (${new Date(evc.scheduledDate).toLocaleDateString('en-IN')}) has passed without verified visit conduction report.`;
        triggerEscalation = true;
      }
    }

    // 3. VISIT_CONDUCTED with no report within evcReportUploadMaxDays
    if (evc.status === 'VISIT_CONDUCTED' && evc.scheduledDate) {
      const visitTime = new Date(evc.scheduledDate).getTime();
      const reportDeadline = visitTime + config.evcReportUploadMaxDays * 24 * 60 * 60 * 1000;
      if (now.getTime() > reportDeadline) {
        const daysDelayed = Math.floor((now.getTime() - reportDeadline) / (1000 * 60 * 60 * 24));
        delayReason = `EVC inspection completed but report not uploaded within statutory ${config.evcReportUploadMaxDays} days (${daysDelayed} days overdue).`;
        triggerEscalation = true;
      }
    }

    if (triggerEscalation && (!evc.escalationTriggered || evc.delayReason !== delayReason)) {
      await prisma.evcSchedule.update({
        where: { id: evc.id },
        data: {
          escalationTriggered: true,
          delayReason,
        },
      });
      summary.evcDelayed += 1;

      await createAlertIfNew({
        dedupKey: `${evc.id}_EVC_DELAY`,
        type: 'EVC_DELAY',
        severity: 'HIGH',
        title: `EVC Inspection Delay: ${evc.applicationNumber}`,
        message: delayReason || `EVC workflow delayed for ${evc.institutionName}.`,
        relatedEntityId: evc.id,
        targetRole: 'REGIONAL_OFFICER',
        region: evc.region,
        recipientEmail: getRegionalOfficerEmail(evc.region),
      });
    }
  }

  // =========================================================================
  // f. DEFICIENCIES: PENDING_CURE past cureDeadline -> EXPIRED_UNRESOLVED
  // =========================================================================
  const deficiencies = await prisma.deficiency.findMany({
    where: { status: 'PENDING_CURE' },
    include: { application: true },
  });

  for (const def of deficiencies) {
    const deadlineTime = new Date(def.cureDeadline).getTime();
    if (now.getTime() > deadlineTime) {
      await prisma.deficiency.update({
        where: { id: def.id },
        data: { status: 'EXPIRED_UNRESOLVED' },
      });
      summary.deficienciesExpired += 1;

      await createAlertIfNew({
        dedupKey: `${def.id}_DEF_EXPIRED`,
        type: 'DEFICIENCY_CURE',
        severity: 'CRITICAL',
        title: `Deficiency Cure Window Expired: ${def.clause}`,
        message: `Statutory 15-day cure window for deficiency under clause ${def.clause} on application ${def.application?.applicationNumber} has expired without resolution.`,
        relatedEntityId: def.id,
        targetRole: 'REGIONAL_OFFICER',
        region: def.application?.region,
        recipientEmail: def.application?.region ? getRegionalOfficerEmail(def.application.region) : bureauEmail,
      });
    }
  }

  return summary;
}
