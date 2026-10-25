import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { AuditLogEntry } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'BUREAU_OFFICER' &&
      !hasPermission(user, 'ALL_PERMISSIONS')
    ) {
      return NextResponse.json({ error: 'Permission denied: Audit trail restricted to Super Admin and Bureau Officers.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const actionType = searchParams.get('actionType');
    const entityType = searchParams.get('entityType');
    const exportCsv = searchParams.get('format') === 'csv';

    const where: any = {};
    if (actionType && actionType !== 'ALL') where.actionType = actionType;
    if (entityType && entityType !== 'ALL') where.entityType = entityType;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 200,
    });

    if (exportCsv) {
      const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action Type', 'Title', 'Remarks', 'Stage From', 'Stage To', 'IP', 'User Agent'];
      const rows = logs.map((l) => [
        l.timestamp.toISOString().replace('T', ' ').substring(0, 19),
        `"${l.actorName}"`,
        l.actorRole,
        l.actionType,
        `"${l.title.replace(/"/g, '""')}"`,
        `"${l.remarks.replace(/"/g, '""')}"`,
        l.stageFrom || '',
        l.stageTo || '',
        l.ip || '',
        `"${(l.userAgent || '').replace(/"/g, '""')}"`,
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="AICTE_Audit_Trail.csv"',
        },
      });
    }

    const formatted: AuditLogEntry[] = logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString().replace('T', ' ').substring(0, 19),
      actorName: l.actorName,
      actorRole: l.actorRole,
      actionType: l.actionType as any,
      applicationId: l.applicationId || undefined,
      entityType: l.entityType || undefined,
      entityId: l.entityId || undefined,
      stageFrom: l.stageFrom || undefined,
      stageTo: l.stageTo || undefined,
      title: l.title,
      remarks: l.remarks,
      authorizedBy: l.authorizedBy || undefined,
      ip: l.ip || undefined,
      userAgent: l.userAgent || undefined,
    }));

    return NextResponse.json({ auditLogs: formatted });
  } catch (err: any) {
    console.error('Error retrieving audit logs:', err);
    return NextResponse.json({ error: 'Failed to retrieve audit trail' }, { status: 500 });
  }
}
