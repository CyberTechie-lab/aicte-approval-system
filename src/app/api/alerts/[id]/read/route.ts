import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

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
    const alert = await prisma.alertNotification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, alert });
  } catch (err: any) {
    console.error('Error marking alert as read:', err);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
