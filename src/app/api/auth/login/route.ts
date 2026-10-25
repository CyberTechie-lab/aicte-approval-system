import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { LoginSchema } from '@/lib/validation';
import {
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  createSessionToken,
  setSessionCookie,
  logAuditEvent,
} from '@/lib/auth';
import { RolePermission, UserRole } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid login credentials format', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Account temporarily locked. Retry after ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.password) {
      recordFailedAttempt(email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password with bcrypt (supports bcrypt hash or direct password123 match during migration)
    const isMatch =
      user.password.startsWith('$2')
        ? await bcrypt.compare(password, user.password)
        : user.password === password;

    if (!isMatch) {
      recordFailedAttempt(email);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Login successful
    resetRateLimit(email);
    const token = await createSessionToken(user.id);
    await setSessionCookie(token);

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'LOGIN',
      title: 'Official SSO Login Established',
      remarks: `User authenticated successfully into ${user.department || user.role}.`,
      ip: clientIp,
      userAgent,
      entityType: 'AUTH',
      entityId: user.id,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      designation: user.designation,
      department: user.department,
      region: user.region || undefined,
      institutionPermanentId: user.institutionPermanentId || undefined,
      institutionName: user.institutionName || undefined,
      avatarBg: user.avatarBg || undefined,
      badgeBg: user.badgeBg || undefined,
      description: user.description || '',
      permissions: JSON.parse(user.permissions || '[]') as RolePermission[],
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal authentication error' }, { status: 500 });
  }
}
