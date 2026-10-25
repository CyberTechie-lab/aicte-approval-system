import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hasPermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!hasPermission(user, 'EXPORT_REGULATORY_DATA') && !hasPermission(user, 'ALL_PERMISSIONS')) {
      return NextResponse.json({ error: 'Permission denied: EXPORT_REGULATORY_DATA required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'applications';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const regionFilter: any = {};
    if (user.role === 'REGIONAL_OFFICER' && user.region) {
      regionFilter.region = user.region;
    } else if (user.role === 'INSTITUTION_PRINCIPAL' && user.institutionPermanentId) {
      regionFilter.institutionPermanentId = user.institutionPermanentId;
    }

    let csvContent = '';
    let filename = `AICTE_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'applications') {
      const where: any = { ...regionFilter };
      if (startDate || endDate) {
        where.appliedDate = {};
        if (startDate) where.appliedDate.gte = new Date(startDate);
        if (endDate) where.appliedDate.lte = new Date(endDate);
      }

      const apps = await prisma.approvalApplication.findMany({
        where,
        orderBy: { appliedDate: 'desc' },
      });

      const headers = [
        'Application Number',
        'Permanent ID',
        'Institution Name',
        'Region',
        'State',
        'Application Type',
        'Route',
        'Current Stage',
        'Applied Date',
        'SLA Deadline',
        'Days Pending',
        'Escalation Level',
        'Applied Intake',
        'Approved Intake',
      ];

      const rows = apps.map((a) => [
        a.applicationNumber,
        a.institutionPermanentId,
        `"${a.institutionName.replace(/"/g, '""')}"`,
        a.region,
        a.state,
        `"${a.applicationType}"`,
        `"${a.route}"`,
        a.currentStage,
        a.appliedDate.toISOString().split('T')[0],
        a.slaDeadline.toISOString().split('T')[0],
        a.daysPending,
        a.escalationLevel,
        a.appliedIntake,
        a.totalApprovedIntake,
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'undertakings') {
      const where: any = { ...regionFilter };
      if (startDate || endDate) {
        where.dueDate = {};
        if (startDate) where.dueDate.gte = new Date(startDate);
        if (endDate) where.dueDate.lte = new Date(endDate);
      }

      const undertakings = await prisma.timeBoundUndertaking.findMany({
        where,
        orderBy: { dueDate: 'asc' },
      });

      const headers = [
        'Application No',
        'Permanent ID',
        'Institution Name',
        'Region',
        'Category',
        'Condition Title',
        'Imposed Date',
        'Due Date',
        'Status',
        'Escalation Level',
        'Verified By',
      ];

      const rows = undertakings.map((u) => [
        u.applicationNumber,
        u.institutionPermanentId,
        `"${u.institutionName.replace(/"/g, '""')}"`,
        u.region,
        u.category,
        `"${u.conditionTitle.replace(/"/g, '""')}"`,
        u.imposedDate.toISOString().split('T')[0],
        u.dueDate.toISOString().split('T')[0],
        u.status,
        u.escalationLevel,
        u.verifiedBy || 'Pending',
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'documents') {
      const where: any = { ...regionFilter };
      if (startDate || endDate) {
        where.expiryDate = {};
        if (startDate) where.expiryDate.gte = new Date(startDate);
        if (endDate) where.expiryDate.lte = new Date(endDate);
      }

      const docs = await prisma.documentValidity.findMany({
        where,
        orderBy: { expiryDate: 'asc' },
      });

      const headers = [
        'Permanent ID',
        'Institution Name',
        'Region',
        'Document Type',
        'Document Number',
        'Issuing Authority',
        'Issued Date',
        'Expiry Date',
        'Status',
        'Renewal Status',
        'Notice Served',
      ];

      const rows = docs.map((d) => [
        d.institutionPermanentId,
        `"${d.institutionName.replace(/"/g, '""')}"`,
        d.region,
        d.documentType,
        d.documentNumber,
        `"${d.issuingAuthority}"`,
        d.issuedDate.toISOString().split('T')[0],
        d.expiryDate.toISOString().split('T')[0],
        d.status,
        d.renewalStatus || 'None',
        d.escalationNoticeServed ? 'YES' : 'NO',
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      return NextResponse.json({ error: 'Invalid report type requested' }, { status: 400 });
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('Error exporting CSV:', err);
    return NextResponse.json({ error: 'Failed to generate CSV export' }, { status: 500 });
  }
}
