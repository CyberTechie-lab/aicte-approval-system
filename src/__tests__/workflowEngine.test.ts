import { describe, it, expect } from 'vitest';
import {
  canTransitionStage,
  getRoutePostDeficiencyStage,
  calculateSlaStatus,
} from '@/lib/workflowEngine';
import { ApprovalRoute, ApprovalStage } from '@/types';

describe('Workflow Engine - Stage Transitions', () => {
  const allRoutes: ApprovalRoute[] = [
    'Only Scrutiny',
    'Scrutiny + EVC',
    'Only EVC',
    'EVC + SAC/SHC',
    'Full APH Cycle',
  ];

  describe('Terminal Stages (APPROVED & REJECTED)', () => {
    const targetStages: ApprovalStage[] = [
      'SCRUTINY',
      'RE_SCRUTINY',
      'EVC_SCHEDULED',
      'EVC_COMPLETED',
      'SAC_SHC_REVIEW',
      'REVERTED_DEFICIENCY',
      'REJECTED',
      'APPROVED',
    ];

    it('blocks every transition out of APPROVED across all routes', () => {
      allRoutes.forEach((route) => {
        targetStages.forEach((target) => {
          if (target === 'APPROVED') {
            expect(canTransitionStage(route, 'APPROVED', target).allowed).toBe(true);
          } else {
            const res = canTransitionStage(route, 'APPROVED', target);
            expect(res.allowed).toBe(false);
            expect(res.reason).toContain('terminal state (APPROVED)');
          }
        });
      });
    });

    it('blocks every transition out of REJECTED across all routes', () => {
      allRoutes.forEach((route) => {
        targetStages.forEach((target) => {
          if (target === 'REJECTED') {
            expect(canTransitionStage(route, 'REJECTED', target).allowed).toBe(true);
          } else {
            const res = canTransitionStage(route, 'REJECTED', target);
            expect(res.allowed).toBe(false);
            expect(res.reason).toContain('terminal state (REJECTED)');
          }
        });
      });
    });
  });

  describe('Route-Specific Progression Paths', () => {
    it('"Only Scrutiny" progresses SCRUTINY/RE_SCRUTINY -> APPROVED', () => {
      expect(canTransitionStage('Only Scrutiny', 'SCRUTINY', 'APPROVED').allowed).toBe(true);
      expect(canTransitionStage('Only Scrutiny', 'RE_SCRUTINY', 'APPROVED').allowed).toBe(true);
      expect(canTransitionStage('Only Scrutiny', 'SCRUTINY', 'EVC_SCHEDULED').allowed).toBe(false);
    });

    it('"Scrutiny + EVC" progresses SCRUTINY -> EVC_SCHEDULED -> EVC_COMPLETED -> APPROVED', () => {
      expect(canTransitionStage('Scrutiny + EVC', 'SCRUTINY', 'EVC_SCHEDULED').allowed).toBe(true);
      expect(canTransitionStage('Scrutiny + EVC', 'RE_SCRUTINY', 'EVC_SCHEDULED').allowed).toBe(true);
      expect(canTransitionStage('Scrutiny + EVC', 'EVC_SCHEDULED', 'EVC_COMPLETED').allowed).toBe(true);
      expect(canTransitionStage('Scrutiny + EVC', 'EVC_COMPLETED', 'APPROVED').allowed).toBe(true);
      expect(canTransitionStage('Scrutiny + EVC', 'SCRUTINY', 'APPROVED').allowed).toBe(false);
    });

    it('"Only EVC" progresses EVC_SCHEDULED -> EVC_COMPLETED -> APPROVED', () => {
      expect(canTransitionStage('Only EVC', 'EVC_SCHEDULED', 'EVC_COMPLETED').allowed).toBe(true);
      expect(canTransitionStage('Only EVC', 'EVC_COMPLETED', 'APPROVED').allowed).toBe(true);
      expect(canTransitionStage('Only EVC', 'EVC_SCHEDULED', 'SAC_SHC_REVIEW').allowed).toBe(false);
    });

    it('"EVC + SAC/SHC" progresses EVC_SCHEDULED -> EVC_COMPLETED -> SAC_SHC_REVIEW -> APPROVED', () => {
      expect(canTransitionStage('EVC + SAC/SHC', 'EVC_SCHEDULED', 'EVC_COMPLETED').allowed).toBe(true);
      expect(canTransitionStage('EVC + SAC/SHC', 'EVC_COMPLETED', 'SAC_SHC_REVIEW').allowed).toBe(true);
      expect(canTransitionStage('EVC + SAC/SHC', 'SAC_SHC_REVIEW', 'APPROVED').allowed).toBe(true);
      expect(canTransitionStage('EVC + SAC/SHC', 'EVC_COMPLETED', 'APPROVED').allowed).toBe(false);
    });

    it('"Full APH Cycle" progresses through all regulatory stages', () => {
      expect(canTransitionStage('Full APH Cycle', 'SCRUTINY', 'EVC_SCHEDULED').allowed).toBe(true);
      expect(canTransitionStage('Full APH Cycle', 'RE_SCRUTINY', 'EVC_SCHEDULED').allowed).toBe(true);
      expect(canTransitionStage('Full APH Cycle', 'EVC_SCHEDULED', 'EVC_COMPLETED').allowed).toBe(true);
      expect(canTransitionStage('Full APH Cycle', 'EVC_COMPLETED', 'SAC_SHC_REVIEW').allowed).toBe(true);
      expect(canTransitionStage('Full APH Cycle', 'SAC_SHC_REVIEW', 'APPROVED').allowed).toBe(true);
    });
  });

  describe('Deficiency Returns per Route', () => {
    it('returns RE_SCRUTINY for routes with scrutiny', () => {
      expect(getRoutePostDeficiencyStage('Only Scrutiny')).toBe('RE_SCRUTINY');
      expect(getRoutePostDeficiencyStage('Scrutiny + EVC')).toBe('RE_SCRUTINY');
      expect(getRoutePostDeficiencyStage('Full APH Cycle')).toBe('RE_SCRUTINY');
    });

    it('returns EVC_SCHEDULED for routes without scrutiny', () => {
      expect(getRoutePostDeficiencyStage('Only EVC')).toBe('EVC_SCHEDULED');
      expect(getRoutePostDeficiencyStage('EVC + SAC/SHC')).toBe('EVC_SCHEDULED');
    });

    it('validates transition out of REVERTED_DEFICIENCY strictly per route', () => {
      // Scrutiny routes must move to RE_SCRUTINY
      expect(canTransitionStage('Only Scrutiny', 'REVERTED_DEFICIENCY', 'RE_SCRUTINY').allowed).toBe(true);
      expect(canTransitionStage('Only Scrutiny', 'REVERTED_DEFICIENCY', 'EVC_SCHEDULED').allowed).toBe(false);

      expect(canTransitionStage('Scrutiny + EVC', 'REVERTED_DEFICIENCY', 'RE_SCRUTINY').allowed).toBe(true);
      expect(canTransitionStage('Scrutiny + EVC', 'REVERTED_DEFICIENCY', 'EVC_SCHEDULED').allowed).toBe(false);

      // EVC routes must move to EVC_SCHEDULED
      expect(canTransitionStage('Only EVC', 'REVERTED_DEFICIENCY', 'EVC_SCHEDULED').allowed).toBe(true);
      expect(canTransitionStage('Only EVC', 'REVERTED_DEFICIENCY', 'RE_SCRUTINY').allowed).toBe(false);

      expect(canTransitionStage('EVC + SAC/SHC', 'REVERTED_DEFICIENCY', 'EVC_SCHEDULED').allowed).toBe(true);
      expect(canTransitionStage('EVC + SAC/SHC', 'REVERTED_DEFICIENCY', 'RE_SCRUTINY').allowed).toBe(false);
    });
  });
});

describe('Workflow Engine - SLA Calculations', () => {
  const baseNow = new Date('2026-06-15T12:00:00Z');
  const appliedDate = new Date('2026-06-01T12:00:00Z');

  it('calculates inside SLA deadline correctly', () => {
    // 5 days remaining in SLA
    const deadline = new Date('2026-06-20T12:00:00Z');
    const result = calculateSlaStatus(deadline, appliedDate, baseNow);

    expect(result.isOverdue).toBe(false);
    expect(result.daysRemaining).toBe(5);
    expect(result.daysElapsed).toBe(14);
    expect(result.escalationLevel).toBe('LEVEL_0_NORMAL');
  });

  it('calculates exactly on SLA deadline date as not overdue', () => {
    const deadline = new Date('2026-06-15T12:00:00Z');
    const result = calculateSlaStatus(deadline, appliedDate, baseNow);

    expect(result.isOverdue).toBe(false);
    expect(result.escalationLevel).toBe('LEVEL_0_NORMAL');
  });

  it('escalates to LEVEL_1_RO for 1 to 7 days past deadline', () => {
    // 1 day past deadline
    const d1 = new Date('2026-06-14T12:00:00Z');
    const res1 = calculateSlaStatus(d1, appliedDate, baseNow);
    expect(res1.isOverdue).toBe(true);
    expect(res1.escalationLevel).toBe('LEVEL_1_RO');

    // 7 days past deadline
    const d7 = new Date('2026-06-08T12:00:00Z');
    const res7 = calculateSlaStatus(d7, appliedDate, baseNow);
    expect(res7.isOverdue).toBe(true);
    expect(res7.escalationLevel).toBe('LEVEL_1_RO');
  });

  it('escalates to LEVEL_2_BUREAU for 8 to 14 days past deadline', () => {
    // 8 days past deadline
    const d8 = new Date('2026-06-07T12:00:00Z');
    const res8 = calculateSlaStatus(d8, appliedDate, baseNow);
    expect(res8.isOverdue).toBe(true);
    expect(res8.escalationLevel).toBe('LEVEL_2_BUREAU');

    // 14 days past deadline
    const d14 = new Date('2026-06-01T12:00:00Z');
    const res14 = calculateSlaStatus(d14, appliedDate, baseNow);
    expect(res14.isOverdue).toBe(true);
    expect(res14.escalationLevel).toBe('LEVEL_2_BUREAU');
  });

  it('escalates to LEVEL_3_MEMBER_SECRETARY for 15+ days past deadline', () => {
    const d15 = new Date('2026-05-31T12:00:00Z');
    const res15 = calculateSlaStatus(d15, appliedDate, baseNow);
    expect(res15.isOverdue).toBe(true);
    expect(res15.escalationLevel).toBe('LEVEL_3_MEMBER_SECRETARY');
  });

  it('respects custom escalation thresholds from AphConfig', () => {
    const customConfig = { escalationL1Days: 3, escalationL2Days: 6 };

    // 3 days overdue -> still within L1
    const d3 = new Date('2026-06-12T12:00:00Z');
    expect(calculateSlaStatus(d3, appliedDate, baseNow, customConfig).escalationLevel).toBe('LEVEL_1_RO');

    // 4 days overdue -> L2 under custom thresholds
    const d4 = new Date('2026-06-11T12:00:00Z');
    expect(calculateSlaStatus(d4, appliedDate, baseNow, customConfig).escalationLevel).toBe('LEVEL_2_BUREAU');

    // 7 days overdue -> L3 under custom thresholds
    const d7 = new Date('2026-06-08T12:00:00Z');
    expect(calculateSlaStatus(d7, appliedDate, baseNow, customConfig).escalationLevel).toBe('LEVEL_3_MEMBER_SECRETARY');
  });
});
