import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission, verifyRegionalJurisdiction, logAuditEvent } from '@/lib/auth';
import { ScheduleEvcSchema } from '@/lib/validation';
import { EvcScheduleItem, EvcMember } from '@/types';
import { getAphConfig } from '@/lib/rulesEngine';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const where: any = {};
    if (user.role === 'REGIONAL_OFFICER' || user.role === 'EVC_CHAIR') {
      if (user.region) where.region = user.region;
    } else if (user.role === 'INSTITUTION_PRINCIPAL') {
      if (user.institutionPermanentId) where.institutionPermanentId = user.institutionPermanentId;
      else return NextResponse.json({ evcSchedules: [] });
    }

    const schedules = await prisma.evcSchedule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const formatted: EvcScheduleItem[] = schedules.map((item) => ({
      id: item.id,
      applicationId: item.applicationId,
      applicationNumber: item.applicationNumber,
      institutionPermanentId: item.institutionPermanentId,
      institutionName: item.institutionName,
      region: item.region,
      inspectionType: item.inspectionType as any,
      status: item.status as any,
      scheduledDate: item.scheduledDate ? item.scheduledDate.toISOString().split('T')[0] : undefined,
      slaReportDeadline: item.slaReportDeadline.toISOString().split('T')[0],
      committeeMembers: JSON.parse(item.committeeMembersJson || '[]') as EvcMember[],
      reportSubmittedDate: item.reportSubmittedDate ? item.reportSubmittedDate.toISOString().split('T')[0] : undefined,
      deficienciesFound: item.deficienciesFound,
      deficiencySummary: item.deficiencySummary || undefined,
      recommendedIntake: item.recommendedIntake !== null ? item.recommendedIntake : undefined,
      reportDocumentUrl: item.reportDocumentUrl || undefined,
      escalationTriggered: item.escalationTriggered,
      delayReason: item.delayReason || undefined,
    }));

    return NextResponse.json({ evcSchedules: formatted });
  } catch (err: any) {
    console.error('Error retrieving EVC schedules:', err);
    return NextResponse.json({ error: 'Failed to retrieve EVC schedules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!hasPermission(user, 'SCHEDULE_EVC_PANEL') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: SCHEDULE_EVC_PANEL required.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = ScheduleEvcSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid EVC schedule payload', details: parsed.error.format() }, { status: 400 });
    }

    const { applicationId, inspectionType, scheduledDate, committeeMembers } = parsed.data;

    const app = await prisma.approvalApplication.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!verifyRegionalJurisdiction(user, app.region)) {
      return NextResponse.json({ error: `Action restricted to ${user.region} Region jurisdiction.` }, { status: 403 });
    }

    const aphConfig = await getAphConfig();
    const scheduledDateTime = new Date(scheduledDate);
    const slaReportDeadline = new Date(
      scheduledDateTime.getTime() + aphConfig.evcReportUploadMaxDays * 24 * 60 * 60 * 1000
    );

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser';

    // Create or update EVC schedule
    const evc = await prisma.evcSchedule.create({
      data: {
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        institutionPermanentId: app.institutionPermanentId,
        institutionName: app.institutionName,
        region: app.region,
        inspectionType,
        status: 'PANEL_CONSTITUTED',
        scheduledDate: scheduledDateTime,
        slaReportDeadline,
        committeeMembersJson: JSON.stringify(committeeMembers),
      },
    });

    // Advance app stage to EVC_SCHEDULED if not already there
    if (app.currentStage !== 'EVC_SCHEDULED') {
      await prisma.approvalApplication.update({
        where: { id: app.id },
        data: { currentStage: 'EVC_SCHEDULED' },
      });
    }

    await logAuditEvent({
      actorName: user.name,
      actorRole: user.role,
      actionType: 'EVC_SCHEDULED',
      title: `EVC Inspection Panel Constituted: ${app.applicationNumber}`,
      remarks: `${inspectionType} scheduled for ${scheduledDate} with ${committeeMembers.length} expert panel members.`,
      applicationId: app.id,
      entityType: 'EVC',
      entityId: evc.id,
      authorizedBy: user.name,
      ip: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: `Expert Visit Committee successfully scheduled for ${app.applicationNumber}.`,
      evcSchedule: evc,
    });
  } catch (err: any) {
    console.error('Error scheduling EVC panel:', err);
    return NextResponse.json({ error: 'Failed to schedule EVC panel' }, { status: 500 });
  }
}
