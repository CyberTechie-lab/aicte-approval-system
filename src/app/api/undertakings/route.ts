import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { TimeBoundUndertakingItem, EscalationLevel } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const where: any = {};
    if (user.role === 'INSTITUTION_PRINCIPAL') {
      if (user.institutionPermanentId) where.institutionPermanentId = user.institutionPermanentId;
      else return NextResponse.json({ undertakings: [] });
    } else if (user.role === 'REGIONAL_OFFICER') {
      if (user.region) where.region = user.region;
    }

    const list = await prisma.timeBoundUndertaking.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });

    const formatted: TimeBoundUndertakingItem[] = list.map((item) => ({
      id: item.id,
      applicationId: item.applicationId,
      applicationNumber: item.applicationNumber,
      institutionPermanentId: item.institutionPermanentId,
      institutionName: item.institutionName,
      region: item.region,
      category: item.category as any,
      conditionTitle: item.conditionTitle,
      prescribedCondition: item.prescribedCondition,
      imposedDate: item.imposedDate.toISOString().split('T')[0],
      dueDate: item.dueDate.toISOString().split('T')[0],
      status: item.status as any,
      evidenceDocumentName: item.evidenceDocumentName || undefined,
      evidenceDocumentUrl: item.evidenceDocumentUrl || undefined,
      submittedAt: item.submittedAt ? item.submittedAt.toISOString() : undefined,
      verifiedAt: item.verifiedAt ? item.verifiedAt.toISOString() : undefined,
      verifiedBy: item.verifiedBy || undefined,
      verificationRemarks: item.verificationRemarks || undefined,
      escalationLevel: item.escalationLevel as EscalationLevel,
    }));

    return NextResponse.json({ undertakings: formatted });
  } catch (err: any) {
    console.error('Error retrieving undertakings:', err);
    return NextResponse.json({ error: 'Failed to retrieve undertakings' }, { status: 500 });
  }
}
