import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, verifyRegionalJurisdiction, verifyInstitutionOwnership } from '@/lib/auth';
import { ApprovalApplicationItem, ApprovalRoute, ApprovalStage, EscalationLevel } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const app = await prisma.approvalApplication.findFirst({
      where: {
        OR: [{ id }, { applicationNumber: id }],
      },
      include: {
        deficiencies: { orderBy: { createdAt: 'desc' } },
        auditLogs: { orderBy: { timestamp: 'desc' } },
      },
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Tenancy Check
    if (!verifyInstitutionOwnership(user, app.institutionPermanentId)) {
      return NextResponse.json({ error: 'Unauthorized access to application outside your institution' }, { status: 403 });
    }
    if (!verifyRegionalJurisdiction(user, app.region)) {
      return NextResponse.json({ error: `Unauthorized: regional tenancy restricted to ${user.region}` }, { status: 403 });
    }

    const formatted: ApprovalApplicationItem = {
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
    };

    return NextResponse.json({ application: formatted });
  } catch (err: any) {
    console.error('Error retrieving application detail:', err);
    return NextResponse.json({ error: 'Failed to retrieve application detail' }, { status: 500 });
  }
}
