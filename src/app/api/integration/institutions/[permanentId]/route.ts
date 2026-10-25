import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ permanentId: string }> }
) {
  try {
    const { permanentId } = await params;
    const institution = await prisma.institution.findUnique({
      where: { permanentId },
      include: {
        applications: {
          select: {
            applicationNumber: true,
            academicYear: true,
            applicationType: true,
            route: true,
            currentStage: true,
            appliedIntake: true,
            totalApprovedIntake: true,
            escalationLevel: true,
            appliedDate: true,
            slaDeadline: true,
          },
        },
        documents: {
          select: {
            documentType: true,
            documentNumber: true,
            status: true,
            expiryDate: true,
          },
        },
        undertakings: {
          select: {
            conditionTitle: true,
            dueDate: true,
            status: true,
          },
        },
      },
    });

    if (!institution) {
      return NextResponse.json(
        { error: `Institution with Permanent ID "${permanentId}" not found in AICTE Central Repository.` },
        { status: 404 }
      );
    }

    const payload = {
      source: 'AICTE Central Portal Integration Gateway (APH 2026-27)',
      timestamp: new Date().toISOString(),
      institution: {
        permanentId: institution.permanentId,
        name: institution.name,
        region: institution.region,
        state: institution.state,
        city: institution.city,
        address: institution.address,
        principalName: institution.principalName,
        contactEmail: institution.contactEmail,
        contactPhone: institution.contactPhone,
        instituteType: institution.instituteType,
        eoaAcademicYear: institution.eoaAcademicYear,
        complianceRating: institution.complianceRating,
        totalApprovedIntake: institution.totalApprovedIntake,
        currentApprovalStatus: institution.currentApprovalStatus,
      },
      approvalApplications: institution.applications,
      statutoryDocuments: institution.documents,
      undertakingsRegistry: institution.undertakings,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    console.error('Integration API error:', err);
    return NextResponse.json({ error: 'Internal integration gateway error' }, { status: 500 });
  }
}
