import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { AlertNotificationItem } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const where: any = {};
    if (user.role === 'INSTITUTION_PRINCIPAL') {
      where.targetRole = { in: ['ALL', 'INSTITUTION_PRINCIPAL'] };
      if (user.region) {
        where.OR = [{ region: user.region }, { region: null }];
      }
    } else if (user.role === 'REGIONAL_OFFICER') {
      where.targetRole = { in: ['ALL', 'REGIONAL_OFFICER'] };
      if (user.region) {
        where.OR = [{ region: user.region }, { region: null }];
      }
    } else if (user.role === 'SCRUTINY_CONVENER' || user.role === 'EVC_CHAIR') {
      if (user.region) {
        where.OR = [{ region: user.region }, { region: null }];
      }
    }

    const alerts = await prisma.alertNotification.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const formatted: AlertNotificationItem[] = alerts.map((a) => ({
      id: a.id,
      dedupKey: a.dedupKey || undefined,
      type: a.type as any,
      severity: a.severity as any,
      title: a.title,
      message: a.message,
      timestamp: a.timestamp.toISOString().replace('T', ' ').substring(0, 19),
      relatedEntityId: a.relatedEntityId,
      targetRole: a.targetRole as any,
      region: a.region || undefined,
      isRead: a.isRead,
      actionUrl: a.actionUrl || undefined,
    }));

    return NextResponse.json({ alerts: formatted });
  } catch (err: any) {
    console.error('Error fetching alerts:', err);
    return NextResponse.json({ error: 'Failed to retrieve alerts' }, { status: 500 });
  }
}
