import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyRegionalJurisdiction, logAuditEvent } from '@/lib/auth';
import { VerifyUndertakingSchema } from '@/lib/validation';
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

    if (!hasPermission(user, 'VERIFY_UNDERTAKINGS') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: VERIFY_UNDERTAKINGS required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = VerifyUndertakingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid verification payload', details: parsed.error.format() }, { status: 400 });
    }

    const { verified, remarks } = parsed.data;

    const undertaking = await prisma.timeBoundUndertaking.findUnique({
      where: { id },
    });

    if (!undertaking) {
      return NextResponse.json({ error: 'Undertaking record not found' }, { status: 404 });
    }

    if (!verifyRegionalJurisdiction(user, undertaking.region)) {
      return NextResponse.json({ error: `Action restricted to ${user.region} Region jurisdiction.` }, { status: 403 });
    }

    const aphConfig = await getAphConfig();
    const now = new Date();
    const finalGraceDeadline = new Date(
      undertaking.dueDate.getTime() + aphConfig.undertakingGracePeriodDays * 24 * 60 * 60 * 1000
    );

    let newStatus: string;
    if (verified) {
      newStatus = 'VERIFIED_COMPLIANT';
    } else {
      // Phase 1 Item 7:
      // Rejection: do not set OVERDUE_ESCALATED unless today > dueDate + gracePeriodDays
      if (now.getTime() > finalGraceDeadline.getTime()) {
        newStatus = 'OVERDUE_ESCALATED';
      } else {
        newStatus = 'REJECTED_RESUBMIT';
      }
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    const updated = await prisma.timeBoundUndertaking.update({
      where: { id: undertaking.id },
      data: {
        status: newStatus,
        verificationRemarks: remarks,
        verifiedAt: now,
        verifiedBy: user.name,
      },
    });

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: verified ? 'UNDERTAKING_VERIFIED' : 'UNDERTAKING_REJECTED',
      title: `Undertaking Compliance ${verified ? 'Verified' : 'Rejected'}: ${undertaking.conditionTitle}`,
      remarks: `Verification by ${user.name}: ${remarks}. New Status: ${newStatus}`,
      applicationId: undertaking.applicationId,
      entityType: 'UNDERTAKING',
      entityId: undertaking.id,
      authorizedBy: user.name,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: verified
        ? `Undertaking "${undertaking.conditionTitle}" verified as compliant.`
        : `Undertaking evidence rejected. Status set to ${newStatus}.`,
      undertaking: updated,
    });
  } catch (err: any) {
    console.error('Error verifying undertaking:', err);
    return NextResponse.json({ error: 'Failed to verify undertaking' }, { status: 500 });
  }
}
