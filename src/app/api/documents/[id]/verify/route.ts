import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyRegionalJurisdiction, logAuditEvent } from '@/lib/auth';
import { VerifyDocumentRenewalSchema } from '@/lib/validation';
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

    if (!hasPermission(user, 'VERIFY_LEASE_RENEWAL') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: VERIFY_LEASE_RENEWAL required.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = VerifyDocumentRenewalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid verification payload', details: parsed.error.format() }, { status: 400 });
    }

    const { verified, remarks } = parsed.data;

    const doc = await prisma.documentValidity.findUnique({
      where: { id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document validity record not found' }, { status: 404 });
    }

    if (!verifyRegionalJurisdiction(user, doc.region)) {
      return NextResponse.json({ error: `Action restricted to ${user.region} Region jurisdiction.` }, { status: 403 });
    }

    const aphConfig = await getAphConfig();
    const now = new Date();
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    let updatedDoc;
    if (verified) {
      const newExpiry = doc.renewedExpiryDate || doc.expiryDate;
      updatedDoc = await prisma.documentValidity.update({
        where: { id: doc.id },
        data: {
          status: 'ACTIVE_VALID',
          expiryDate: newExpiry,
          renewalStatus: 'VERIFIED',
          verifiedAt: now,
          verifiedBy: user.name,
          verificationRemarks: remarks || 'Renewal verified and endorsed by Regional Office.',
          escalationNoticeServed: false,
        },
      });

      await logAuditEvent({
        actorName: user.name,
        actorRole: user.role,
        actionType: 'DOCUMENT_RENEWAL_VERIFIED',
        title: `Document Renewal Endorsed: ${doc.documentType}`,
        remarks: `Document validity extended to ${newExpiry.toISOString().split('T')[0]}. Remarks: ${remarks || 'Verified compliant.'}`,
        entityType: 'DOCUMENT',
        entityId: doc.id,
        authorizedBy: user.name,
        ip: clientIp,
        userAgent,
      });
    } else {
      // Phase 1 Item 8: Recalculate status from the real expiryDate (do NOT hard-code CRITICAL_30D!)
      const expiryTime = doc.expiryDate.getTime();
      const diffDays = Math.ceil((expiryTime - now.getTime()) / (1000 * 60 * 60 * 24));

      let recalculatedStatus = doc.status;
      if (diffDays > aphConfig.leaseAdvanceAlertDays) {
        recalculatedStatus = 'ACTIVE_VALID';
      } else if (diffDays > 30 && diffDays <= aphConfig.leaseAdvanceAlertDays) {
        recalculatedStatus = 'EXPIRING_SOON_90D';
      } else if (diffDays >= 0 && diffDays <= 30) {
        recalculatedStatus = 'CRITICAL_30D';
      } else {
        recalculatedStatus = 'EXPIRED';
      }

      updatedDoc = await prisma.documentValidity.update({
        where: { id: doc.id },
        data: {
          status: recalculatedStatus,
          renewalStatus: 'REJECTED',
          verifiedAt: now,
          verifiedBy: user.name,
          verificationRemarks: remarks || 'Document renewal rejected upon verification.',
        },
      });

      await logAuditEvent({
        actorName: user.name,
        actorRole: user.role,
        actionType: 'DOCUMENT_RENEWAL_REJECTED',
        title: `Document Renewal Rejected: ${doc.documentType}`,
        remarks: `Renewal rejected by ${user.name}: ${remarks || 'Incomplete registration details.'}. Status recalculated to ${recalculatedStatus}.`,
        entityType: 'DOCUMENT',
        entityId: doc.id,
        authorizedBy: user.name,
        ip: clientIp,
        userAgent,
      });
    }

    return NextResponse.json({
      success: true,
      message: verified
        ? `Document renewal endorsed. Status reset to ACTIVE_VALID.`
        : `Document renewal rejected. Status recalculated to ${updatedDoc.status}.`,
      document: updatedDoc,
    });
  } catch (err: any) {
    console.error('Error verifying document renewal:', err);
    return NextResponse.json({ error: 'Failed to verify document renewal' }, { status: 500 });
  }
}
