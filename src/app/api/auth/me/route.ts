import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated session' }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Session retrieval error:', err);
    return NextResponse.json({ error: 'Internal session error' }, { status: 500 });
  }
}
