import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyRegionalJurisdiction, logAuditEvent } from '@/lib/auth';
import { canTransitionStage } from '@/lib/workflowEngine';
import { AdvanceStageSchema } from '@/lib/validation';
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

    const { id } = await params;
    const body = await req.json();
    const parsed = AdvanceStageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid stage progression parameters', details: parsed.error.format() }, { status: 400 });
    }

    const { targetStage, remarks } = parsed.data;

    const app = await prisma.approvalApplication.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
      include: { deficiencies: true },
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Regional Tenancy Guard
    if (!verifyRegionalJurisdiction(user, app.region)) {
      return NextResponse.json(
        { error: `Regulatory Action Blocked: You do not have jurisdiction over the ${app.region} Region.` },
        { status: 403 }
      );
    }

    // RBAC Permission Guard
    if (targetStage === 'APPROVED') {
      if (!hasPermission(user, 'GRANT_STATUTORY_APPROVAL')) {
        return NextResponse.json({ error: 'Statutory approval authority reserved for Member Secretary or Approval Bureau.' }, { status: 403 });
      }
    } else if (targetStage === 'EVC_SCHEDULED') {
      if (!hasPermission(user, 'SCHEDULE_EVC_PANEL')) {
        return NextResponse.json({ error: 'Permission required to schedule Expert Visit Committee.' }, { status: 403 });
      }
    } else {
      if (!hasPermission(user, 'SCRUTINY_VERIFY') && !hasPermission(user, 'GRANT_STATUTORY_APPROVAL')) {
        return NextResponse.json({ error: 'Statutory scrutiny verification permission required.' }, { status: 403 });
      }
    }

    // Workflow Engine Stage Transition Matrix Check
    const transitionCheck = canTransitionStage(
      app.route as ApprovalRoute,
      app.currentStage as ApprovalStage,
      targetStage as ApprovalStage
    );

    if (!transitionCheck.allowed) {
      return NextResponse.json(
        { error: transitionCheck.reason || `Transition from ${app.currentStage} to ${targetStage} is not permitted under route "${app.route}".` },
        { status: 400 }
      );
    }

    // Deficiency Blocking Guard: Cannot approve or advance if pending or unverified deficiencies exist
    const unresolvedDeficiencies = app.deficiencies.filter(
      (d) => d.status === 'PENDING_CURE' || d.status === 'CURED_PENDING_VERIFICATION' || d.status === 'EXPIRED_UNRESOLVED'
    );
    if (unresolvedDeficiencies.length > 0 && targetStage === 'APPROVED') {
      return NextResponse.json(
        { error: `Cannot grant statutory approval: ${unresolvedDeficiencies.length} unresolved deficiency notices pending resolution.` },
        { status: 400 }
      );
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    // Execute transition
    const updated = await prisma.approvalApplication.update({
      where: { id: app.id },
      data: {
        currentStage: targetStage,
        totalApprovedIntake: targetStage === 'APPROVED' ? app.appliedIntake : app.totalApprovedIntake,
      },
    });

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'STAGE_TRANSITION',
      title: `Stage Advanced: ${app.currentStage} → ${targetStage}`,
      remarks: remarks || `Progressed under APH route ${app.route}.`,
      applicationId: app.id,
      entityType: 'APPLICATION',
      entityId: app.id,
      stageFrom: app.currentStage,
      stageTo: targetStage,
      authorizedBy: user.name,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Application successfully transitioned to ${targetStage}.`,
      application: updated,
    });
  } catch (err: any) {
    console.error('Error advancing stage:', err);
    return NextResponse.json({ error: 'Failed to advance application stage' }, { status: 500 });
  }
}
