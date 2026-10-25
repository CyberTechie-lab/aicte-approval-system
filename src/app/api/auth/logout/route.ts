import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, clearSessionCookie, logAuditEvent } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (user) {
      const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
      await logAuditEvent({
        actorName: user.name,
        actorRole: user.role,
        actionType: 'LOGOUT',
        title: 'Session Terminated',
        remarks: 'User logged out of the portal.',
        ip: clientIp,
        entityType: 'AUTH',
        entityId: user.id,
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Internal logout error' }, { status: 500 });
  }
}
