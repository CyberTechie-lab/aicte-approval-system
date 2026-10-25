import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyRegionalJurisdiction, logAuditEvent } from '@/lib/auth';
import { VerifyDeficiencyCureSchema } from '@/lib/validation';
import { getRoutePostDeficiencyStage } from '@/lib/workflowEngine';
import { ApprovalRoute } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; defId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Permission check: SCRUTINY_VERIFY or ISSUE_DEFICIENCY_REVERT
    if (
      !hasPermission(user, 'SCRUTINY_VERIFY') &&
      !hasPermission(user, 'ISSUE_DEFICIENCY_REVERT') &&
      !hasPermission(user, 'ALL_PERMISSIONS')
    ) {
      return NextResponse.json(
        { error: 'Permission denied: SCRUTINY_VERIFY or ISSUE_DEFICIENCY_REVERT required.' },
        { status: 403 }
      );
    }

    const { id, defId } = await params;
    const body = await req.json();
    const parsed = VerifyDeficiencyCureSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid verification parameters', details: parsed.error.format() }, { status: 400 });
    }

    const { accepted, remarks } = parsed.data;

    const app = await prisma.approvalApplication.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
      include: { deficiencies: true },
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Regional jurisdiction check
    if (!verifyRegionalJurisdiction(user, app.region)) {
      return NextResponse.json({ error: `Action restricted to ${user.region} Region jurisdiction.` }, { status: 403 });
    }

    const def = await prisma.deficiency.findUnique({
      where: { id: defId },
    });

    if (!def || def.applicationId !== app.id) {
      return NextResponse.json({ error: 'Deficiency record not found on this application' }, { status: 404 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    let updatedDef;
    if (accepted) {
      updatedDef = await prisma.deficiency.update({
        where: { id: defId },
        data: {
          status: 'CURED_VERIFIED',
          cureRemarks: remarks,
          verifiedAt: new Date(),
          verifiedBy: user.name,
        },
      });
    } else {
      updatedDef = await prisma.deficiency.update({
        where: { id: defId },
        data: {
          status: 'PENDING_CURE',
          cureRemarks: `Cure Rejected: ${remarks}`,
          verifiedAt: new Date(),
          verifiedBy: user.name,
        },
      });
    }

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'DEFICIENCY_CURE_VERIFIED',
      title: `Deficiency Cure ${accepted ? 'Verified & Accepted' : 'Rejected'} (Clause ${def.clause})`,
      remarks: `Verification by ${user.name}: ${remarks}`,
      applicationId: app.id,
      entityType: 'DEFICIENCY',
      entityId: def.id,
      authorizedBy: user.name,
      ip: clientIp,
      userAgent,
    });

    // Check if ALL deficiencies are now CURED_VERIFIED
    const allDefs = await prisma.deficiency.findMany({
      where: { applicationId: app.id },
    });

    const allCured = allDefs.length > 0 && allDefs.every((d) => d.status === 'CURED_VERIFIED');
    let advancedStage: string | null = null;

    if (allCured && app.currentStage === 'REVERTED_DEFICIENCY') {
      const targetStage = getRoutePostDeficiencyStage(app.route as ApprovalRoute);
      await prisma.approvalApplication.update({
        where: { id: app.id },
        data: { currentStage: targetStage },
      });
      advancedStage = targetStage;

      await logAuditEvent({
        actorName: 'AICTE Workflow Sentinel',
        actorRole: 'SYSTEM',
        actionType: 'STAGE_TRANSITION',
        title: `All Deficiencies Resolved: Stage Advanced to ${targetStage}`,
        remarks: `All ${allDefs.length} deficiency notices verified compliant. Resumed route ${app.route} at ${targetStage}.`,
        applicationId: app.id,
        entityType: 'APPLICATION',
        entityId: app.id,
        stageFrom: 'REVERTED_DEFICIENCY',
        stageTo: targetStage,
        authorizedBy: user.name,
        ip: clientIp,
        userAgent,
      });
    }

    return NextResponse.json({
      success: true,
      message: accepted
        ? `Deficiency clause ${def.clause} verified as CURED_VERIFIED.${advancedStage ? ` All deficiencies resolved: application advanced to ${advancedStage}.` : ''}`
        : `Deficiency cure rejected and returned to PENDING_CURE for re-submission.`,
      deficiency: updatedDef,
      applicationAdvancedTo: advancedStage,
    });
  } catch (err: any) {
    console.error('Error verifying deficiency cure:', err);
    return NextResponse.json({ error: 'Failed to verify deficiency cure' }, { status: 500 });
  }
}
