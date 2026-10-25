import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyInstitutionOwnership, logAuditEvent } from '@/lib/auth';
import { SubmitUndertakingProofSchema } from '@/lib/validation';

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
    const parsed = SubmitUndertakingProofSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid undertaking proof payload', details: parsed.error.format() }, { status: 400 });
    }

    const { documentName, documentUrl } = parsed.data;

    const undertaking = await prisma.timeBoundUndertaking.findUnique({
      where: { id },
    });

    if (!undertaking) {
      return NextResponse.json({ error: 'Undertaking record not found' }, { status: 404 });
    }

    // Ownership check (Phase 1 Item 9)
    if (!verifyInstitutionOwnership(user, undertaking.institutionPermanentId)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the institution holding the undertaking can upload compliance proof.' },
        { status: 403 }
      );
    }

    if (!hasPermission(user, 'SUBMIT_UNDERTAKING_PROOF') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: SUBMIT_UNDERTAKING_PROOF required.' }, { status: 403 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    const updated = await prisma.timeBoundUndertaking.update({
      where: { id: undertaking.id },
      data: {
        status: 'SUBMITTED_PENDING_VERIFICATION',
        evidenceDocumentName: documentName,
        evidenceDocumentUrl: documentUrl || undertaking.evidenceDocumentUrl,
        submittedAt: new Date(),
      },
    });

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'UNDERTAKING_PROOF_SUBMITTED',
      title: `Undertaking Evidence Uploaded: ${undertaking.conditionTitle}`,
      remarks: `Institutional proof document "${documentName}" submitted. Pending Regional Officer verification.`,
      applicationId: undertaking.applicationId,
      entityType: 'UNDERTAKING',
      entityId: undertaking.id,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Compliance evidence submitted successfully. Awaiting regional verification.',
      undertaking: updated,
    });
  } catch (err: any) {
    console.error('Error submitting undertaking proof:', err);
    return NextResponse.json({ error: 'Failed to submit undertaking proof' }, { status: 500 });
  }
}
