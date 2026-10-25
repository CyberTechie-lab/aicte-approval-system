import { ApprovalApplicationItem, TimeBoundUndertakingItem, DocumentValidityItem } from '@/types';

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportApplicationsCsv(applications: ApprovalApplicationItem[]) {
  const headers = [
    'Application Number',
    'Permanent ID',
    'Institution Name',
    'Region',
    'State',
    'Application Type',
    'Route',
    'Current Stage',
    'Priority',
    'Escalation Level',
    'Days Pending',
    'SLA Deadline',
    'Applied Intake',
    'Approved Intake',
    'Deficiencies Count'
  ];

  const rows = applications.map(app => [
    `"${app.applicationNumber}"`,
    `"${app.institutionPermanentId}"`,
    `"${app.institutionName.replace(/"/g, '""')}"`,
    `"${app.region}"`,
    `"${app.state}"`,
    `"${app.applicationType}"`,
    `"${app.route}"`,
    `"${app.currentStage}"`,
    `"${app.priority}"`,
    `"${app.escalationLevel}"`,
    app.daysPending,
    `"${app.slaDeadline}"`,
    app.appliedIntake,
    app.totalApprovedIntake,
    app.deficiencies.length
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCsv(csv, `AICTE_Applications_Summary_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportUndertakingsCsv(undertakings: TimeBoundUndertakingItem[]) {
  const headers = [
    'Undertaking ID',
    'Application Number',
    'Permanent ID',
    'Institution Name',
    'Region',
    'Category',
    'Condition Title',
    'Due Date',
    'Status',
    'Escalation Tier'
  ];

  const rows = undertakings.map(u => [
    `"${u.id}"`,
    `"${u.applicationNumber}"`,
    `"${u.institutionPermanentId}"`,
    `"${u.institutionName.replace(/"/g, '""')}"`,
    `"${u.region}"`,
    `"${u.category}"`,
    `"${u.conditionTitle.replace(/"/g, '""')}"`,
    `"${u.dueDate}"`,
    `"${u.status}"`,
    `"${u.escalationLevel}"`
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCsv(csv, `AICTE_Undertakings_Compliance_${new Date().toISOString().split('T')[0]}.csv`);
}

export function exportDocumentsCsv(documents: DocumentValidityItem[]) {
  const headers = [
    'Document ID',
    'Permanent ID',
    'Institution Name',
    'Region',
    'Document Type',
    'Document Number',
    'Issuing Authority',
    'Expiry Date',
    'Status',
    'Escalation Notice'
  ];

  const rows = documents.map(d => [
    `"${d.id}"`,
    `"${d.institutionPermanentId}"`,
    `"${d.institutionName.replace(/"/g, '""')}"`,
    `"${d.region}"`,
    `"${d.documentType}"`,
    `"${d.documentNumber}"`,
    `"${d.issuingAuthority.replace(/"/g, '""')}"`,
    `"${d.expiryDate}"`,
    `"${d.status}"`,
    d.escalationNoticeServed ? 'YES' : 'NO'
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadCsv(csv, `AICTE_Document_Lease_Registry_${new Date().toISOString().split('T')[0]}.csv`);
}
