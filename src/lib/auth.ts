import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './prisma';
import { UserAccount, RolePermission, UserRole, AuditActionType } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || 'aicte_super_secret_jwt_key_2026_aph_secure_token_phrase_min_32_chars'
);

const SESSION_COOKIE_NAME = 'aicte_session';

// In-memory rate limiter: 5 attempts per 15 minutes per email
interface RateLimitRecord {
  attempts: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(email: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const key = email.trim().toLowerCase();
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(key, { attempts: 0, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, remainingAttempts: 5 };
  }

  if (record.attempts >= 5) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  return { allowed: true, remainingAttempts: 5 - record.attempts };
}

export function recordFailedAttempt(email: string) {
  const key = email.trim().toLowerCase();
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || record.resetAt <= now) {
    rateLimitMap.set(key, { attempts: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    record.attempts += 1;
  }
}

export function resetRateLimit(email: string) {
  rateLimitMap.delete(email.trim().toLowerCase());
}

export async function createSessionToken(userId: string): Promise<string> {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.userId || typeof payload.userId !== 'string') return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<UserAccount | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) return null;

    return {
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
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export function hasPermission(user: UserAccount, permission: RolePermission): boolean {
  if (user.permissions.includes('ALL_PERMISSIONS')) return true;
  return user.permissions.includes(permission);
}

export function verifyRegionalJurisdiction(user: UserAccount, targetRegion: string): boolean {
  if (user.role === 'SUPER_ADMIN' || user.role === 'BUREAU_OFFICER' || user.role === 'SAC_MEMBER') {
    return true;
  }
  if (!user.region) return true;
  return user.region.toLowerCase() === targetRegion.toLowerCase();
}

export function verifyInstitutionOwnership(user: UserAccount, targetPermanentId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.role === 'INSTITUTION_PRINCIPAL') {
    return user.institutionPermanentId === targetPermanentId;
  }
  return true;
}

export async function logAuditEvent({
  actorName,
  actorRole,
  actionType,
  title,
  remarks,
  applicationId,
  entityType,
  entityId,
  stageFrom,
  stageTo,
  authorizedBy,
  ip,
  userAgent,
}: {
  actorName: string;
  actorRole: string;
  actionType: AuditActionType;
  title: string;
  remarks: string;
  applicationId?: string;
  entityType?: string;
  entityId?: string;
  stageFrom?: string;
  stageTo?: string;
  authorizedBy?: string;
  ip?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorName,
        actorRole,
        actionType,
        title,
        remarks,
        applicationId: applicationId || null,
        entityType: entityType || (applicationId ? 'APPLICATION' : null),
        entityId: entityId || applicationId || null,
        stageFrom: stageFrom || null,
        stageTo: stageTo || null,
        authorizedBy: authorizedBy || null,
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
  }
}
