import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const logs = await prisma.notificationLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      notifications: logs.map((l) => ({
        id: l.id,
        channel: l.channel,
        recipient: l.recipient,
        subject: l.subject,
        body: l.body,
        status: l.status,
        sentAt: l.sentAt.toISOString().replace('T', ' ').substring(0, 19),
        relatedAlertId: l.relatedAlertId,
      })),
    });
  } catch (err: any) {
    console.error('Error fetching notification logs:', err);
    return NextResponse.json({ error: 'Failed to retrieve notification logs' }, { status: 500 });
  }
}
