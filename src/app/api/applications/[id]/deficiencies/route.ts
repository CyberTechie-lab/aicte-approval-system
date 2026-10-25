import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyRegionalJurisdiction, logAuditEvent } from '@/lib/auth';
import { RevertDeficiencySchema } from '@/lib/validation';
import { getAphConfig } from '@/lib/rulesEngine';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!hasPermission(user, 'ISSUE_DEFICIENCY_REVERT') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: ISSUE_DEFICIENCY_REVERT required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = RevertDeficiencySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid deficiency revert parameters', details: parsed.error.format() }, { status: 400 });
    }

    const { clause, description, category, cureDays } = parsed.data;

    const app = await prisma.approvalApplication.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Phase 1 Item 5: Regional jurisdiction check
    if (!verifyRegionalJurisdiction(user, app.region)) {
      return NextResponse.json({ error: `Jurisdiction restricted to ${user.region} Region.` }, { status: 403 });
    }

    // Phase 1 Item 5: Reject revert if app is APPROVED or REJECTED
    if (app.currentStage === 'APPROVED' || app.currentStage === 'REJECTED') {
      return NextResponse.json(
        { error: `Cannot revert application in terminal state (${app.currentStage}).` },
        { status: 400 }
      );
    }

    // Phase 1 Item 5: Use aphConfig.deficiencyCurePeriodDays as default
    const aphConfig = await getAphConfig();
    const effectiveCureDays = cureDays ?? aphConfig.deficiencyCurePeriodDays;
    const cureDeadline = new Date(Date.now() + effectiveCureDays * 24 * 60 * 60 * 1000);

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    // Create deficiency record
    const deficiency = await prisma.deficiency.create({
      data: {
        applicationId: app.id,
        clause,
        description,
        category,
        cureDeadline,
        status: 'PENDING_CURE',
      },
    });

    // Update application stage to REVERTED_DEFICIENCY
    await prisma.approvalApplication.update({
      where: { id: app.id },
      data: { currentStage: 'REVERTED_DEFICIENCY' },
    });

    // Phase 1 Item 5: Log stageFrom as the real currentStage
    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'DEFICIENCY_REVERT',
      title: `Statutory Deficiency Notice Issued (Clause ${clause})`,
      remarks: `Reverted to institution with ${effectiveCureDays}-day cure window. Description: ${description}`,
      applicationId: app.id,
      entityType: 'APPLICATION',
      entityId: app.id,
      stageFrom: app.currentStage,
      stageTo: 'REVERTED_DEFICIENCY',
      authorizedBy: user.name,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Deficiency notice issued under Clause ${clause}. Application reverted for cure within ${effectiveCureDays} days.`,
      deficiency,
    });
  } catch (err: any) {
    console.error('Error reverting deficiency:', err);
    return NextResponse.json({ error: 'Failed to issue deficiency notice' }, { status: 500 });
  }
}
