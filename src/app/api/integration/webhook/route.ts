import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAuditEvent } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.INTEGRATION_API_KEY || 'aicte_central_api_key_2026';

    if (apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized: Invalid or missing x-api-key header.' }, { status: 401 });
    }

    const body = await req.json();
    const { eventType, applicationNumber, remarks } = body;

    if (!eventType || !applicationNumber) {
      return NextResponse.json({ error: 'Missing required fields: eventType, applicationNumber.' }, { status: 400 });
    }

    const app = await prisma.approvalApplication.findUnique({
      where: { applicationNumber },
    });

    if (!app) {
      return NextResponse.json({ error: `Application ${applicationNumber} not found.` }, { status: 404 });
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    await logAuditEvent({
      actorName: 'AICTE Central Portal Webhook',
      actorRole: 'EXTERNAL_INTEGRATION',
      actionType: 'STAGE_TRANSITION',
      title: `Central Webhook Event: ${eventType}`,
      remarks: remarks || `External status sync received for ${applicationNumber}.`,
      applicationId: app.id,
      entityType: 'APPLICATION',
      entityId: app.id,
      ip: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: `Webhook event "${eventType}" processed successfully for application ${applicationNumber}.`,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Failed to process webhook event' }, { status: 500 });
  }
}
