import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, logAuditEvent } from '@/lib/auth';
import { UpdateAphConfigSchema } from '@/lib/validation';
import { getAphConfig } from '@/lib/rulesEngine';

export async function GET() {
  try {
    const config = await getAphConfig();
    return NextResponse.json({
      config: {
        scrutinyMaxDays: config.scrutinyMaxDays,
        reScrutinyMaxDays: config.reScrutinyMaxDays,
        evcInspectionMaxDays: config.evcInspectionMaxDays,
        evcReportUploadMaxDays: config.evcReportUploadMaxDays,
        sacAppellateMaxDays: config.sacAppellateMaxDays,
        deficiencyCurePeriodDays: config.deficiencyCurePeriodDays,
        undertakingGracePeriodDays: config.undertakingGracePeriodDays,
        leaseAdvanceAlertDays: config.leaseAdvanceAlertDays,
        escalationL1Days: config.escalationL1Days,
        escalationL2Days: config.escalationL2Days,
        slaWarningDays: config.slaWarningDays,
      },
    });
  } catch (err: any) {
    console.error('Error retrieving APH config:', err);
    return NextResponse.json({ error: 'Failed to retrieve configuration' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!hasPermission(user, 'CONFIGURE_APH_SLAS') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: Only Bureau Officers or Super Admin can modify statutory SLAs.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateAphConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid configuration payload', details: parsed.error.format() }, { status: 400 });
    }

    const updated = await prisma.aphConfig.upsert({
      where: { id: 'default' },
      update: parsed.data,
      create: { id: 'default', ...parsed.data },
    });

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'CONFIG_CHANGED',
      title: 'Statutory APH SLA Timelines Updated',
      remarks: `Updated regulatory parameters: Scrutiny=${parsed.data.scrutinyMaxDays}d, EVC=${parsed.data.evcInspectionMaxDays}d, Cure=${parsed.data.deficiencyCurePeriodDays}d, Grace=${parsed.data.undertakingGracePeriodDays}d.`,
      entityType: 'CONFIG',
      entityId: 'default',
      authorizedBy: user.name,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Statutory APH timelines updated successfully.',
      config: updated,
    });
  } catch (err: any) {
    console.error('Error updating APH config:', err);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
