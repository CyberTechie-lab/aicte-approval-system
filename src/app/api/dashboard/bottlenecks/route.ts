import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const where: any = {};
    if (user.role === 'REGIONAL_OFFICER' && user.region) {
      where.region = user.region;
    } else if (user.role === 'INSTITUTION_PRINCIPAL' && user.institutionPermanentId) {
      where.institutionPermanentId = user.institutionPermanentId;
    }

    const allApps = await prisma.approvalApplication.findMany({
      where,
    });

    const activeApps = allApps.filter((a) => a.currentStage !== 'APPROVED' && a.currentStage !== 'REJECTED');

    // 1. Pending count per assignedOfficer / committee
    const officerMap = new Map<string, number>();
    for (const app of activeApps) {
      const officer = app.assignedOfficer || 'Unassigned';
      officerMap.set(officer, (officerMap.get(officer) || 0) + 1);
    }
    const officerWorkload = Array.from(officerMap.entries()).map(([officer, count]) => ({
      officer,
      pendingCount: count,
    })).sort((a, b) => b.pendingCount - a.pendingCount);

    // 2. Average days per stage
    const stageDaysMap = new Map<string, { totalDays: number; count: number }>();
    for (const app of activeApps) {
      const entry = stageDaysMap.get(app.currentStage) || { totalDays: 0, count: 0 };
      entry.totalDays += app.daysPending;
      entry.count += 1;
      stageDaysMap.set(app.currentStage, entry);
    }
    const avgDaysPerStage = Array.from(stageDaysMap.entries()).map(([stage, { totalDays, count }]) => ({
      stage,
      avgDays: Math.round(totalDays / count),
      activeCount: count,
    }));

    // 3. Top 5 oldest pending cases
    const oldestCases = [...activeApps]
      .sort((a, b) => b.daysPending - a.daysPending)
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        applicationNumber: a.applicationNumber,
        institutionName: a.institutionName,
        region: a.region,
        currentStage: a.currentStage,
        daysPending: a.daysPending,
        escalationLevel: a.escalationLevel,
        slaDeadline: a.slaDeadline.toISOString().split('T')[0],
      }));

    // 4. Region-wise on-time vs overdue %
    const regionStatsMap = new Map<string, { onTime: number; overdue: number }>();
    for (const app of allApps) {
      const region = app.region;
      const stats = regionStatsMap.get(region) || { onTime: 0, overdue: 0 };
      if (app.escalationLevel === 'LEVEL_0_NORMAL') {
        stats.onTime += 1;
      } else {
        stats.overdue += 1;
      }
      regionStatsMap.set(region, stats);
    }
    const regionPerformance = Array.from(regionStatsMap.entries()).map(([region, { onTime, overdue }]) => {
      const total = onTime + overdue;
      return {
        region,
        onTimeCount: onTime,
        overdueCount: overdue,
        onTimePercent: total > 0 ? Math.round((onTime / total) * 100) : 100,
        overduePercent: total > 0 ? Math.round((overdue / total) * 100) : 0,
      };
    });

    return NextResponse.json({
      officerWorkload,
      avgDaysPerStage,
      oldestCases,
      regionPerformance,
    });
  } catch (err: any) {
    console.error('Error fetching dashboard bottlenecks:', err);
    return NextResponse.json({ error: 'Failed to retrieve bottleneck analytics' }, { status: 500 });
  }
}
