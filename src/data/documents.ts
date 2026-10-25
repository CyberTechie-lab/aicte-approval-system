import { DocumentValidityItem } from '@/types';

export const INITIAL_DOCUMENTS: DocumentValidityItem[] = [
  {
    id: 'DOC-SKCT-01',
    institutionPermanentId: '1-109723412',
    institutionName: 'Sri Krishna College of Technology',
    region: 'Southern',
    documentType: 'LAND_LEASE_DEED',
    documentNumber: 'TN-CBE-SUBREG/2012/Book1/Vol89',
    issuingAuthority: 'Sub-Registrar Office, Madukkarai, Coimbatore',
    issuedDate: '2012-04-15',
    expiryDate: '2026-11-20', // Critical: Expiring in ~26 days
    status: 'CRITICAL_30D',
    documentUrl: '/docs/compliance/SKCT_Lease_Deed_2012.pdf',
    escalationNoticeServed: true
  },
  {
    id: 'DOC-SKCT-02',
    institutionPermanentId: '1-109723412',
    institutionName: 'Sri Krishna College of Technology',
    region: 'Southern',
    documentType: 'FIRE_SAFETY_NOC',
    documentNumber: 'TN-DFRS-CBE/NOC/2025-412',
    issuingAuthority: 'Department of Fire & Rescue Services, Tamil Nadu',
    issuedDate: '2025-11-10',
    expiryDate: '2026-11-10',
    status: 'CRITICAL_30D',
    documentUrl: '/docs/compliance/SKCT_Fire_NOC_2025.pdf',
    renewalDocumentUrl: '/docs/compliance/SKCT_Fire_NOC_Renewal_Draft_2026.pdf',
    renewalSubmittedDate: '2026-10-22',
    escalationNoticeServed: false
  },
  {
    id: 'DOC-PICT-03',
    institutionPermanentId: '1-209384911',
    institutionName: 'Pune Institute of Computer Technology',
    region: 'Western',
    documentType: 'BUILDING_STABILITY',
    documentNumber: 'PWD-MH-PUNE/STRUC/2021/89',
    issuingAuthority: 'Public Works Department (PWD), Pune Division',
    issuedDate: '2021-12-15',
    expiryDate: '2026-12-31', // Expiring in ~65 days
    status: 'EXPIRING_SOON_90D',
    documentUrl: '/docs/compliance/PICT_Structural_Stability.pdf',
    escalationNoticeServed: false
  },
  {
    id: 'DOC-APEX-04',
    institutionPermanentId: '1-3324512341',
    institutionName: 'Apex Institute of Technology & Engineering',
    region: 'Northern',
    documentType: 'FIRE_SAFETY_NOC',
    documentNumber: 'UPFS-GBN-NOC/2024/908',
    issuingAuthority: 'Chief Fire Officer, Gautam Buddha Nagar, Noida',
    issuedDate: '2024-09-30',
    expiryDate: '2026-09-30', // Expired
    status: 'EXPIRED',
    documentUrl: '/docs/compliance/Apex_Expired_Fire_NOC.pdf',
    escalationNoticeServed: true
  },
  {
    id: 'DOC-KIIT-05',
    institutionPermanentId: '1-419823019',
    institutionName: 'Kalinga Institute of Industrial Technology',
    region: 'Eastern',
    documentType: 'LAND_LEASE_DEED',
    documentNumber: 'OR-BBSR-FREEHOLD/1998/T-409',
    issuingAuthority: 'Bhubaneswar Development Authority (BDA)',
    issuedDate: '1998-05-20',
    expiryDate: '2097-05-20', // Long term valid
    status: 'ACTIVE_VALID',
    documentUrl: '/docs/compliance/KIIT_BDA_Freehold_Deed.pdf',
    escalationNoticeServed: false
  }
];
