import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runComplianceSweep } from '@/lib/rulesEngine';
import { prisma } from '@/lib/prisma';

// Mock notifier
vi.mock('@/lib/notifier', () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
  sendSms: vi.fn().mockResolvedValue(true),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => {
  const alertStore = new Map<string, any>();

  return {
    prisma: {
      aphConfig: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'default',
          scrutinyMaxDays: 30,
          reScrutinyMaxDays: 15,
          evcInspectionMaxDays: 21,
          evcReportUploadMaxDays: 5,
          sacAppellateMaxDays: 15,
          deficiencyCurePeriodDays: 15,
          undertakingGracePeriodDays: 30,
          leaseAdvanceAlertDays: 90,
          escalationL1Days: 7,
          escalationL2Days: 14,
          slaWarningDays: 3,
        }),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([
          { email: 'ro.southern@aicte.gov.in', role: 'REGIONAL_OFFICER', region: 'Southern' },
          { email: 'bureau.approval@aicte.gov.in', role: 'BUREAU_OFFICER', region: null },
          { email: 'member.secretary@aicte.gov.in', role: 'SUPER_ADMIN', region: null },
        ]),
      },
      approvalApplication: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      documentValidity: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
      timeBoundUndertaking: {
        findMany: vi.fn(),
        update: vi.fn(),
      },
      evcSchedule: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      deficiency: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      alertNotification: {
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          return alertStore.get(where.dedupKey) || null;
        }),
        create: vi.fn().mockImplementation(async ({ data }) => {
          const alert = { id: `alert_${Math.random()}`, ...data };
          alertStore.set(data.dedupKey, alert);
          return alert;
        }),
      },
      __alertStore: alertStore,
    },
  };
});

describe('Rules Engine - runComplianceSweep', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  beforeEach(() => {
    vi.clearAllMocks();
    (prisma as any).__alertStore.clear();
  });

  describe('Document Status Boundary Evaluations', () => {
    it('accurately evaluates status transitions across 91d, 90d, 31d, 30d, 0d, and -1d boundaries', async () => {
      // Helper to generate date offset in days from now
      const daysFromNow = (days: number) => {
        const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return d.toISOString();
      };

      const mockDocs = [
        {
          id: 'doc_91',
          documentType: 'LAND_LEASE_DEED_30YR',
          documentNumber: 'LLD-91',
          institutionPermanentId: 'INST-01',
          institutionName: 'Apex Institute',
          region: 'Southern',
          expiryDate: daysFromNow(91),
          status: 'EXPIRING_SOON_90D', // Currently incorrect in DB, sweep should fix to ACTIVE_VALID
          renewalDocumentUrl: null,
          escalationNoticeServed: false,
          institution: { contactEmail: 'apex@example.edu' },
        },
        {
          id: 'doc_90',
          documentType: 'LAND_LEASE_DEED_30YR',
          documentNumber: 'LLD-90',
          institutionPermanentId: 'INST-01',
          institutionName: 'Apex Institute',
          region: 'Southern',
          expiryDate: daysFromNow(90),
          status: 'ACTIVE_VALID',
          renewalDocumentUrl: null,
          escalationNoticeServed: false,
          institution: { contactEmail: 'apex@example.edu' },
        },
        {
          id: 'doc_31',
          documentType: 'STATE_GOVT_NOC',
          documentNumber: 'NOC-31',
          institutionPermanentId: 'INST-01',
          institutionName: 'Apex Institute',
          region: 'Southern',
          expiryDate: daysFromNow(31),
          status: 'ACTIVE_VALID',
          renewalDocumentUrl: null,
          escalationNoticeServed: false,
          institution: { contactEmail: 'apex@example.edu' },
        },
        {
          id: 'doc_30',
          documentType: 'AFFILIATING_UNIVERSITY_NOC',
          documentNumber: 'AU-30',
          institutionPermanentId: 'INST-01',
          institutionName: 'Apex Institute',
          region: 'Southern',
          expiryDate: daysFromNow(30),
          status: 'EXPIRING_SOON_90D',
          renewalDocumentUrl: null,
          escalationNoticeServed: false,
          institution: { contactEmail: 'apex@example.edu' },
        },
        {
          id: 'doc_0',
          documentType: 'BUILDING_STABILITY_CERTIFICATE',
          documentNumber: 'BSC-0',
          institutionPermanentId: 'INST-01',
          institutionName: 'Apex Institute',
          region: 'Southern',
          expiryDate: daysFromNow(0),
          status: 'EXPIRING_SOON_90D',
          renewalDocumentUrl: null,
          escalationNoticeServed: false,
          institution: { contactEmail: 'apex@example.edu' },
        },
        {
          id: 'doc_neg1',
          documentType: 'LAND_LEASE_DEED_30YR',
          documentNumber: 'LLD-NEG1',
          institutionPermanentId: 'INST-01',
          institutionName: 'Apex Institute',
          region: 'Southern',
          expiryDate: daysFromNow(-1),
          status: 'CRITICAL_30D',
          renewalDocumentUrl: null,
          escalationNoticeServed: false,
          institution: { contactEmail: 'apex@example.edu' },
        },
      ];

      vi.mocked(prisma.documentValidity.findMany).mockResolvedValue(mockDocs as any);
      vi.mocked(prisma.timeBoundUndertaking.findMany).mockResolvedValue([]);

      const summary = await runComplianceSweep(now);

      // Verify updates called with exact expected statuses
      expect(prisma.documentValidity.update).toHaveBeenCalledWith({
        where: { id: 'doc_91' },
        data: { status: 'ACTIVE_VALID', escalationNoticeServed: false },
      });

      expect(prisma.documentValidity.update).toHaveBeenCalledWith({
        where: { id: 'doc_90' },
        data: { status: 'EXPIRING_SOON_90D', escalationNoticeServed: false },
      });

      expect(prisma.documentValidity.update).toHaveBeenCalledWith({
        where: { id: 'doc_31' },
        data: { status: 'EXPIRING_SOON_90D', escalationNoticeServed: false },
      });

      expect(prisma.documentValidity.update).toHaveBeenCalledWith({
        where: { id: 'doc_30' },
        data: { status: 'CRITICAL_30D', escalationNoticeServed: false },
      });

      expect(prisma.documentValidity.update).toHaveBeenCalledWith({
        where: { id: 'doc_0' },
        data: { status: 'CRITICAL_30D', escalationNoticeServed: false },
      });

      expect(prisma.documentValidity.update).toHaveBeenCalledWith({
        where: { id: 'doc_neg1' },
        data: { status: 'EXPIRED', escalationNoticeServed: true },
      });

      expect(summary.docsFlagged).toBe(6);
    });
  });

  describe('Undertaking Overdue past Grace Period', () => {
    it('escalates to OVERDUE_ESCALATED only when past dueDate + gracePeriodDays', async () => {
      const mockUndertakings = [
        {
          id: 'und_inside_grace',
          conditionTitle: 'Fire Safety NOC Renewal',
          institutionPermanentId: 'INST-01',
          institutionName: 'Apex Institute',
          region: 'Southern',
          // Due date 10 days ago, grace period is 30 days -> still inside grace (20 days remaining)
          dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING_SUBMISSION',
          escalationLevel: 'LEVEL_0_NORMAL',
          institution: { contactEmail: 'apex@example.edu' },
        },
        {
          id: 'und_past_grace',
          conditionTitle: 'Faculty Cadre Ratio Rectification',
          institutionPermanentId: 'INST-01',
          institutionName: 'Apex Institute',
          region: 'Southern',
          // Due date 35 days ago, grace period is 30 days -> 5 days past grace
          dueDate: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING_SUBMISSION',
          escalationLevel: 'LEVEL_0_NORMAL',
          institution: { contactEmail: 'apex@example.edu' },
        },
      ];

      vi.mocked(prisma.documentValidity.findMany).mockResolvedValue([]);
      vi.mocked(prisma.timeBoundUndertaking.findMany).mockResolvedValue(mockUndertakings as any);

      const summary = await runComplianceSweep(now);

      // und_inside_grace must NOT be escalated
      expect(prisma.timeBoundUndertaking.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'und_inside_grace' },
        })
      );

      // und_past_grace MUST be escalated to OVERDUE_ESCALATED with LEVEL_1_RO (5 days overdue <= 7)
      expect(prisma.timeBoundUndertaking.update).toHaveBeenCalledWith({
        where: { id: 'und_past_grace' },
        data: {
          status: 'OVERDUE_ESCALATED',
          escalationLevel: 'LEVEL_1_RO',
        },
      });

      expect(summary.undertakingsOverdue).toBe(1);
    });
  });

  describe('Alert Deduplication', () => {
    it('running the sweep twice produces no duplicate alerts', async () => {
      const mockDoc = {
        id: 'doc_dup_test',
        documentType: 'LAND_LEASE_DEED_30YR',
        documentNumber: 'LLD-DUP',
        institutionPermanentId: 'INST-01',
        institutionName: 'Apex Institute',
        region: 'Southern',
        expiryDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days -> CRITICAL_30D
        status: 'ACTIVE_VALID',
        renewalDocumentUrl: null,
        escalationNoticeServed: false,
        institution: { contactEmail: 'apex@example.edu' },
      };

      vi.mocked(prisma.documentValidity.findMany).mockResolvedValue([mockDoc as any]);
      vi.mocked(prisma.timeBoundUndertaking.findMany).mockResolvedValue([]);

      // First sweep run
      const summary1 = await runComplianceSweep(now);
      expect(summary1.alertsCreated).toBe(1);

      // Update mock to reflect the new status
      mockDoc.status = 'CRITICAL_30D';

      // Second sweep run with exact same now timestamp
      const summary2 = await runComplianceSweep(now);
      expect(summary2.alertsCreated).toBe(0);

      // Total create calls in alertNotification should remain 1
      expect(prisma.alertNotification.create).toHaveBeenCalledTimes(1);
    });
  });
});
