import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyRegionalJurisdiction, logAuditEvent } from '@/lib/auth';
import { RatifyEvcReportSchema } from '@/lib/validation';
import { canTransitionStage } from '@/lib/workflowEngine';
import { ApprovalRoute, ApprovalStage } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // RO, Bureau Officer or Super Admin can ratify EVC reports
    const isAuthorizedRole = ['SUPER_ADMIN', 'BUREAU_OFFICER', 'REGIONAL_OFFICER'].includes(user.role);
    if (!isAuthorizedRole && !hasPermission(user, 'GRANT_STATUTORY_APPROVAL')) {
      return NextResponse.json({ error: 'Permission denied: Only Regional Officers or Bureau Advisers can ratify EVC reports.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = RatifyEvcReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid ratification parameters', details: parsed.error.format() }, { status: 400 });
    }

    const { approved, remarks } = parsed.data;

    const evc = await prisma.evcSchedule.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!evc) {
      return NextResponse.json({ error: 'EVC schedule record not found' }, { status: 404 });
    }

    if (!verifyRegionalJurisdiction(user, evc.region)) {
      return NextResponse.json({ error: `Action restricted to ${user.region} Region jurisdiction.` }, { status: 403 });
    }

    if (evc.status !== 'REPORT_SUBMITTED') {
      return NextResponse.json(
        { error: `Cannot ratify: EVC report is currently in "${evc.status}" status (expected "REPORT_SUBMITTED").` },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    if (!approved) {
      // Ratification rejected -> return report for clarifications
      const updated = await prisma.evcSchedule.update({
        where: { id: evc.id },
        data: {
          status: 'PANEL_CONSTITUTED',
          delayReason: `EVC report rejected during official scrutiny: ${remarks}`,
        },
      });

      await logAuditEvent({
        actorName: user.name,
        actorRole: user.role,
        actionType: 'EVC_REPORT_RATIFIED',
        title: `EVC Report Rejected: ${evc.applicationNumber}`,
        remarks: `Report rejected by ${user.name}: ${remarks}. Returned for panel clarification.`,
        applicationId: evc.applicationId,
        entityType: 'EVC',
        entityId: evc.id,
        authorizedBy: user.name,
        ip: clientIp,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        message: 'EVC report rejected and returned for panel clarification.',
        evcSchedule: updated,
      });
    }

    // Verify stage transition to EVC_COMPLETED
    const transitionCheck = canTransitionStage(
      evc.application.route as ApprovalRoute,
      evc.application.currentStage as ApprovalStage,
      'EVC_COMPLETED'
    );

    if (!transitionCheck.allowed) {
      return NextResponse.json(
        { error: transitionCheck.reason || 'Workflow transition to EVC_COMPLETED failed.' },
        { status: 400 }
      );
    }

    // Set status to REPORT_RATIFIED and advance application
    const updatedEvc = await prisma.evcSchedule.update({
      where: { id: evc.id },
      data: { status: 'REPORT_RATIFIED' },
    });

    await prisma.approvalApplication.update({
      where: { id: evc.applicationId },
      data: {
        currentStage: 'EVC_COMPLETED',
        totalApprovedIntake: evc.recommendedIntake !== null ? evc.recommendedIntake : evc.application.totalApprovedIntake,
      },
    });

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'EVC_REPORT_RATIFIED',
      title: `EVC Report Ratified: Stage Advanced to EVC_COMPLETED`,
      remarks: `Official ratification by ${user.name}: ${remarks}. Application advanced to EVC_COMPLETED.`,
      applicationId: evc.applicationId,
      entityType: 'EVC',
      entityId: evc.id,
      stageFrom: evc.application.currentStage,
      stageTo: 'EVC_COMPLETED',
      authorizedBy: user.name,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'EVC report ratified successfully. Application advanced to EVC_COMPLETED.',
      evcSchedule: updatedEvc,
    });
  } catch (err: any) {
    console.error('Error ratifying EVC report:', err);
    return NextResponse.json({ error: 'Failed to ratify EVC report' }, { status: 500 });
  }
}
