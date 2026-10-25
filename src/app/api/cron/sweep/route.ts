import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, hasPermission } from '@/lib/auth';
import { runComplianceSweep } from '@/lib/rulesEngine';
import { SweepRequestSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const cronHeader = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET || 'aicte_cron_secret_aph_2026_token_secure';

    let isAuthorized = cronHeader === expectedSecret;

    if (!isAuthorized) {
      const user = await getSessionUser();
      if (user && (user.role === 'SUPER_ADMIN' || user.role === 'BUREAU_OFFICER' || hasPermission(user, 'OVERRIDE_ESCALATION'))) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Valid x-cron-secret header or Super Admin session required.' },
        { status: 401 }
      );
    }

    let simulatedDate: Date = new Date();
    try {
      const body = await req.json();
      const parsed = SweepRequestSchema.safeParse(body);
      if (parsed.success && parsed.data.simulatedDate) {
        simulatedDate = new Date(parsed.data.simulatedDate);
      }
    } catch {
      // Body is optional for standard cron sweeps
    }

    const summary = await runComplianceSweep(simulatedDate);

    return NextResponse.json({
      success: true,
      message: 'Compliance sweep executed successfully.',
      summary,
    });
  } catch (err: any) {
    console.error('Error running compliance sweep:', err);
    return NextResponse.json({ error: 'Failed to execute compliance sweep' }, { status: 500 });
  }
}
