import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyInstitutionOwnership, logAuditEvent } from '@/lib/auth';
import { CureDeficiencySchema } from '@/lib/validation';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; defId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id, defId } = await params;
    const body = await req.json();
    const parsed = CureDeficiencySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid deficiency cure submission', details: parsed.error.format() }, { status: 400 });
    }

    const { responseNote, responseDocumentUrl } = parsed.data;

    const app = await prisma.approvalApplication.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Ownership check (Phase 1 Item 9)
    if (!verifyInstitutionOwnership(user, app.institutionPermanentId)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the applicant institution may submit deficiency cure responses.' },
        { status: 403 }
      );
    }

    if (!hasPermission(user, 'SUBMIT_DEFICIENCY_CURE') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: SUBMIT_DEFICIENCY_CURE required.' }, { status: 403 });
    }

    const def = await prisma.deficiency.findUnique({
      where: { id: defId },
    });

    if (!def || def.applicationId !== app.id) {
      return NextResponse.json({ error: 'Deficiency record not found on this application' }, { status: 404 });
    }

    // Phase 1 Item 4: Institution submit -> CURED_PENDING_VERIFICATION (not immediately verified!)
    const updated = await prisma.deficiency.update({
      where: { id: defId },
      data: {
        status: 'CURED_PENDING_VERIFICATION',
        institutionResponse: responseNote,
        responseDocumentUrl: responseDocumentUrl || def.responseDocumentUrl,
      },
    });

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'DEFICIENCY_CURE_SUBMITTED',
      title: `Deficiency Cure Submitted: Clause ${def.clause}`,
      remarks: `Institutional cure response submitted. Pending scrutiny committee verification. Note: ${responseNote.substring(0, 100)}`,
      applicationId: app.id,
      entityType: 'DEFICIENCY',
      entityId: def.id,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Deficiency cure submitted successfully. Status updated to CURED_PENDING_VERIFICATION.',
      deficiency: updated,
    });
  } catch (err: any) {
    console.error('Error submitting deficiency cure:', err);
    return NextResponse.json({ error: 'Failed to submit deficiency cure' }, { status: 500 });
  }
}
