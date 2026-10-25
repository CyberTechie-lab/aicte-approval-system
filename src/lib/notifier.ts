import nodemailer from 'nodemailer';
import { prisma } from './prisma';

interface NotificationResult {
  success: boolean;
  channel: 'EMAIL' | 'SMS';
  recipient: string;
  subject: string;
  status: 'SENT' | 'FAILED' | 'MOCKED';
}

function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

export async function sendEmail({
  to,
  subject,
  body,
  relatedAlertId,
}: {
  to: string;
  subject: string;
  body: string;
  relatedAlertId?: string;
}): Promise<NotificationResult> {
  const transporter = getMailTransporter();
  let status: 'SENT' | 'FAILED' | 'MOCKED' = 'MOCKED';

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'AICTE Regulatory Sentinel <alerts@aicte-india.org>',
        to,
        subject,
        text: body,
      });
      status = 'SENT';
    } catch (err) {
      console.error('SMTP send error:', err);
      status = 'FAILED';
    }
  } else {
    console.log(`[NOTIFIER MOCK EMAIL] To: ${to} | Subject: ${subject}\nBody: ${body.substring(0, 100)}...`);
  }

  try {
    await prisma.notificationLog.create({
      data: {
        channel: 'EMAIL',
        recipient: to,
        subject,
        body,
        status,
        relatedAlertId: relatedAlertId || null,
      },
    });
  } catch (err) {
    console.error('Failed to log email notification:', err);
  }

  return { success: status !== 'FAILED', channel: 'EMAIL', recipient: to, subject, status };
}

export async function sendSms({
  to,
  text,
  relatedAlertId,
}: {
  to: string;
  text: string;
  relatedAlertId?: string;
}): Promise<NotificationResult> {
  // SMS Gateway integration stub (e.g. NIC SMS Gateway / C-DAC)
  const status: 'SENT' | 'FAILED' | 'MOCKED' = 'MOCKED';
  console.log(`[NOTIFIER MOCK SMS] To: ${to} | Message: ${text}`);

  try {
    await prisma.notificationLog.create({
      data: {
        channel: 'SMS',
        recipient: to,
        subject: 'AICTE Alert SMS',
        body: text,
        status,
        relatedAlertId: relatedAlertId || null,
      },
    });
  } catch (err) {
    console.error('Failed to log SMS notification:', err);
  }

  return { success: true, channel: 'SMS', recipient: to, subject: 'AICTE Alert SMS', status };
}
