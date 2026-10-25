import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyInstitutionOwnership, logAuditEvent } from '@/lib/auth';
import { SubmitDocumentRenewalSchema } from '@/lib/validation';

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
    const parsed = SubmitDocumentRenewalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid document renewal payload', details: parsed.error.format() }, { status: 400 });
    }

    const { newExpiryDate, renewalDocumentUrl } = parsed.data;

    const doc = await prisma.documentValidity.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document validity record not found' }, { status: 404 });
    }

    // Ownership check (Phase 1 Item 9)
    if (!verifyInstitutionOwnership(user, doc.institutionPermanentId)) {
      return NextResponse.json(
        { error: 'Unauthorized: Only the institution owning this document may submit renewals.' },
        { status: 403 }
      );
    }

    if (!hasPermission(user, 'SUBMIT_LEASE_RENEWAL') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: SUBMIT_LEASE_RENEWAL required.' }, { status: 403 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    const updated = await prisma.documentValidity.update({
      where: { id: doc.id },
      data: {
        renewalSubmittedDate: new Date(),
        renewedExpiryDate: new Date(newExpiryDate),
        renewalDocumentUrl: renewalDocumentUrl || doc.renewalDocumentUrl,
        renewalStatus: 'PENDING',
      },
    });

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'DOCUMENT_RENEWAL_SUBMITTED',
      title: `Document Renewal Submitted: ${doc.documentType}`,
      remarks: `Renewal submitted with proposed expiry ${newExpiryDate}. Awaiting Regional verification.`,
      entityType: 'DOCUMENT',
      entityId: doc.id,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Document renewal submitted successfully. Awaiting regional officer verification.',
      document: updated,
    });
  } catch (err: any) {
    console.error('Error submitting document renewal:', err);
    return NextResponse.json({ error: 'Failed to submit document renewal' }, { status: 500 });
  }
}
