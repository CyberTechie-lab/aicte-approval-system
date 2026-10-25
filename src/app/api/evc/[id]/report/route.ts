import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyRegionalJurisdiction, logAuditEvent } from '@/lib/auth';
import { SubmitEvcReportSchema } from '@/lib/validation';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!hasPermission(user, 'SUBMIT_EVC_REPORT') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: SUBMIT_EVC_REPORT required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = SubmitEvcReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid report payload', details: parsed.error.format() }, { status: 400 });
    }

    const { deficienciesFound, summary, intake, reportDocumentUrl } = parsed.data;

    const evc = await prisma.evcSchedule.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!evc) {
      return NextResponse.json({ error: 'EVC schedule record not found' }, { status: 404 });
    }

    // Phase 1 Item 6: Only allow when the application is currently EVC_SCHEDULED
    if (evc.application.currentStage !== 'EVC_SCHEDULED') {
      return NextResponse.json(
        { error: `EVC report submission blocked: Application is in stage "${evc.application.currentStage}", expected "EVC_SCHEDULED".` },
        { status: 400 }
      );
    }

    if (!verifyRegionalJurisdiction(user, evc.region)) {
      return NextResponse.json({ error: `Action restricted to ${user.region} Region jurisdiction.` }, { status: 403 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    // Phase 1 Item 6: Set status to REPORT_SUBMITTED (not REPORT_RATIFIED yet)
    const updated = await prisma.evcSchedule.update({
      where: { id: evc.id },
      data: {
        status: 'REPORT_SUBMITTED',
        deficienciesFound,
        deficiencySummary: summary,
        recommendedIntake: intake ?? null,
        reportDocumentUrl: reportDocumentUrl || evc.reportDocumentUrl,
        reportSubmittedDate: new Date(),
      },
    });

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'EVC_REPORT_SUBMITTED',
      title: `EVC Inspection Report Submitted: ${evc.applicationNumber}`,
      remarks: `Report submitted by ${user.name}. Deficiencies: ${deficienciesFound ? 'YES' : 'NO'}. Intake Recommended: ${intake ?? 'Unchanged'}.`,
      applicationId: evc.applicationId,
      entityType: 'EVC',
      entityId: evc.id,
      authorizedBy: user.name,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'EVC inspection report submitted successfully and awaits statutory ratification.',
      evcSchedule: updated,
    });
  } catch (err: any) {
    console.error('Error submitting EVC report:', err);
    return NextResponse.json({ error: 'Failed to submit EVC report' }, { status: 500 });
  }
}
