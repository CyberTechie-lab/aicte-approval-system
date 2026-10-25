import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { ApprovalApplicationItem, DeficiencyItem, AuditLogEntry, ApprovalRoute, ApprovalStage, EscalationLevel } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const regionQuery = searchParams.get('region');
    const stageQuery = searchParams.get('stage');
    const routeQuery = searchParams.get('route');
    const searchQuery = searchParams.get('search');

    const where: any = {};

    // Tenancy Enforcement
    if (user.role === 'INSTITUTION_PRINCIPAL') {
      if (!user.institutionPermanentId) {
        return NextResponse.json({ applications: [] });
      }
      where.institutionPermanentId = user.institutionPermanentId;
    } else if (user.role === 'REGIONAL_OFFICER' || user.role === 'SCRUTINY_CONVENER' || user.role === 'EVC_CHAIR') {
      if (user.region) {
        where.region = user.region;
      }
    } else if (regionQuery && regionQuery !== 'ALL') {
      where.region = regionQuery;
    }

    if (stageQuery && stageQuery !== 'ALL') {
      where.currentStage = stageQuery;
    }

    if (routeQuery && routeQuery !== 'ALL') {
      where.route = routeQuery;
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim();
      where.OR = [
        { applicationNumber: { contains: q } },
        { institutionName: { contains: q } },
        { institutionPermanentId: { contains: q } },
        { city: { contains: q } },
      ];
    }

    const apps = await prisma.approvalApplication.findMany({
      where,
      include: {
        deficiencies: {
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { appliedDate: 'desc' },
    });

    const formatted: ApprovalApplicationItem[] = apps.map((app) => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      institutionPermanentId: app.institutionPermanentId,
      institutionName: app.institutionName,
      region: app.region,
      state: app.state,
      city: app.city,
      applicationType: app.applicationType as any,
      academicYear: app.academicYear,
      appliedDate: app.appliedDate.toISOString().split('T')[0],
      route: app.route as ApprovalRoute,
      currentStage: app.currentStage as ApprovalStage,
      priority: app.priority as any,
      escalationLevel: app.escalationLevel as EscalationLevel,
      slaDeadline: app.slaDeadline.toISOString().split('T')[0],
      daysPending: app.daysPending,
      assignedOfficer: app.assignedOfficer,
      assignedCommittee: app.assignedCommittee || undefined,
      appliedIntake: app.appliedIntake,
      totalApprovedIntake: app.totalApprovedIntake,
      deficiencies: app.deficiencies.map((d) => ({
        id: d.id,
        applicationId: d.applicationId,
        clause: d.clause,
        description: d.description,
        category: d.category as any,
        cureDeadline: d.cureDeadline.toISOString().split('T')[0],
        status: d.status as any,
        institutionResponse: d.institutionResponse || undefined,
        responseDocumentUrl: d.responseDocumentUrl || undefined,
        cureRemarks: d.cureRemarks || undefined,
        verifiedAt: d.verifiedAt ? d.verifiedAt.toISOString() : undefined,
        verifiedBy: d.verifiedBy || undefined,
      })),
      auditTrail: app.auditLogs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString().replace('T', ' ').substring(0, 19),
        actorName: log.actorName,
        actorRole: log.actorRole,
        actionType: log.actionType as any,
        applicationId: log.applicationId || undefined,
        entityType: log.entityType || undefined,
        entityId: log.entityId || undefined,
        stageFrom: log.stageFrom || undefined,
        stageTo: log.stageTo || undefined,
        title: log.title,
        remarks: log.remarks,
        authorizedBy: log.authorizedBy || undefined,
        ip: log.ip || undefined,
        userAgent: log.userAgent || undefined,
      })),
    }));

    return NextResponse.json({ applications: formatted });
  } catch (err: any) {
    console.error('Error fetching applications:', err);
    return NextResponse.json({ error: 'Failed to retrieve applications' }, { status: 500 });
  }
}
