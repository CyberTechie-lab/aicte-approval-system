import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { DocumentValidityItem } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const where: any = {};
    if (user.role === 'INSTITUTION_PRINCIPAL') {
      if (user.institutionPermanentId) where.institutionPermanentId = user.institutionPermanentId;
      else return NextResponse.json({ documents: [] });
    } else if (user.role === 'REGIONAL_OFFICER') {
      if (user.region) where.region = user.region;
    }

    const docs = await prisma.documentValidity.findMany({
      where,
      orderBy: { expiryDate: 'asc' },
    });

    const formatted: DocumentValidityItem[] = docs.map((doc) => ({
      id: doc.id,
      institutionPermanentId: doc.institutionPermanentId,
      institutionName: doc.institutionName,
      region: doc.region,
      documentType: doc.documentType as any,
      documentNumber: doc.documentNumber,
      issuingAuthority: doc.issuingAuthority,
      issuedDate: doc.issuedDate.toISOString().split('T')[0],
      expiryDate: doc.expiryDate.toISOString().split('T')[0],
      status: doc.status as any,
      documentUrl: doc.documentUrl,
      renewalDocumentUrl: doc.renewalDocumentUrl || undefined,
      renewalSubmittedDate: doc.renewalSubmittedDate ? doc.renewalSubmittedDate.toISOString().split('T')[0] : undefined,
      renewedExpiryDate: doc.renewedExpiryDate ? doc.renewedExpiryDate.toISOString().split('T')[0] : undefined,
      verifiedBy: doc.verifiedBy || undefined,
      verifiedAt: doc.verifiedAt ? doc.verifiedAt.toISOString() : undefined,
      verificationRemarks: doc.verificationRemarks || undefined,
      renewalStatus: doc.renewalStatus as any,
      escalationNoticeServed: doc.escalationNoticeServed,
    }));

    return NextResponse.json({ documents: formatted });
  } catch (err: any) {
    console.error('Error retrieving documents:', err);
    return NextResponse.json({ error: 'Failed to retrieve documents' }, { status: 500 });
  }
}
