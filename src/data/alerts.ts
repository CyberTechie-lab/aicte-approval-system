import { AlertNotificationItem } from '@/types';

export const INITIAL_ALERTS: AlertNotificationItem[] = [
  {
    id: 'ALT-ESC-001',
    type: 'ESCALATION',
    severity: 'CRITICAL',
    title: 'Level 2 Bureau Escalation: Cure Period Breached',
    message: 'Apex Institute of Technology (APP/2026-27/NRO-3310) has not resolved Occupancy Certificate deficiency. Statutory 15-day cure notice expiring in 24 hours.',
    timestamp: '2026-10-24 11:00',
    relatedEntityId: 'APP-NRO-3310',
    targetRole: 'BUREAU_OFFICER',
    region: 'Northern',
    isRead: false,
    actionUrl: '/applications/APP-NRO-3310'
  },
  {
    id: 'ALT-LEASE-002',
    type: 'LEASE_EXPIRY',
    severity: 'HIGH',
    title: '30-Day Critical Sentinel: Registered Lease Expiry',
    message: 'Sri Krishna College of Technology (1-109723412) registered 30-year lease deed expires on 2026-11-20. Requisite renewal endorsement must be submitted.',
    timestamp: '2026-10-23 09:15',
    relatedEntityId: 'DOC-SKCT-01',
    targetRole: 'REGIONAL_OFFICER',
    region: 'Southern',
    isRead: false,
    actionUrl: '/documents'
  },
  {
    id: 'ALT-EVC-003',
    type: 'EVC_DELAY',
    severity: 'HIGH',
    title: 'EVC Scheduling Timeline Threshold Approaching',
    message: 'Pune Institute of Computer Tech (APP/2026-27/WRO-2041) EVC visit pending confirmation. Prescribed APH window for inspection is 21 days from Scrutiny.',
    timestamp: '2026-10-20 09:30',
    relatedEntityId: 'APP-WRO-2041',
    targetRole: 'REGIONAL_OFFICER',
    region: 'Western',
    isRead: false,
    actionUrl: '/evc'
  },
  {
    id: 'ALT-UND-004',
    type: 'UNDERTAKING_OVERDUE',
    severity: 'CRITICAL',
    title: 'Conditional Undertaking Default Notice',
    message: 'Apex Institute of Technology failed to submit RPwD Accessibility compliance evidence by stipulated deadline of 2026-10-10.',
    timestamp: '2026-10-15 14:00',
    relatedEntityId: 'UND-NRO-003',
    targetRole: 'SUPER_ADMIN',
    region: 'Northern',
    isRead: false,
    actionUrl: '/undertakings'
  },
  {
    id: 'ALT-SLA-005',
    type: 'SLA_WARNING',
    severity: 'MEDIUM',
    title: 'SLA Milestone Reminder: Scrutiny Queue',
    message: 'Sri Krishna College of Technology (APP/2026-27/SRO-1092) has been in Scrutiny stage for 24 days. Prescribed APH benchmark is 30 days.',
    timestamp: '2026-10-24 16:00',
    relatedEntityId: 'APP-SRO-1092',
    targetRole: 'SCRUTINY_CONVENER',
    region: 'Southern',
    isRead: true,
    actionUrl: '/applications/APP-SRO-1092'
  }
];
