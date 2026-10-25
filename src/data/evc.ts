import { EvcScheduleItem } from '@/types';

export const INITIAL_EVC_SCHEDULES: EvcScheduleItem[] = [
  {
    id: 'EVC-2041-01',
    applicationId: 'APP-WRO-2041',
    applicationNumber: 'APP/2026-27/WRO-2041',
    institutionPermanentId: '1-209384911',
    institutionName: 'Pune Institute of Computer Technology',
    region: 'Western',
    inspectionType: 'PHYSICAL_INSPECTION',
    status: 'PANEL_CONSTITUTED',
    scheduledDate: '2026-10-29',
    slaReportDeadline: '2026-11-03',
    committeeMembers: [
      {
        name: 'Dr. K. Natarajan',
        designation: 'Professor & Dean (Inspection Chair)',
        affiliation: 'Anna University, Chennai',
        specialization: 'Cyber Security & Distributed Systems',
        contact: 'k.natarajan@annauniv.edu'
      },
      {
        name: 'Prof. Meena R. Kulkarni',
        designation: 'Senior Professor (AICTE Nominee)',
        affiliation: 'COEP Technological University, Pune',
        specialization: 'Computer Systems Architecture',
        contact: 'mrk.comp@coep.ac.in'
      },
      {
        name: 'Er. Sandeep B. Patil',
        designation: 'Chief Architect (Industry Expert)',
        affiliation: 'Tata Consultancy Services',
        specialization: 'Embedded Systems & AI IoT',
        contact: 'sandeep.patil@tcs.com'
      }
    ],
    deficienciesFound: false,
    recommendedIntake: 60,
    escalationTriggered: false
  },
  {
    id: 'EVC-6411-02',
    applicationId: 'APP-CRO-6411',
    applicationNumber: 'APP/2026-27/CRO-6411',
    institutionPermanentId: '1-641920481',
    institutionName: 'Bhopal Institute of Technology & Science',
    region: 'Central',
    inspectionType: 'SURPRISE_INSPECTION',
    status: 'REPORT_SUBMITTED',
    scheduledDate: '2026-10-21',
    slaReportDeadline: '2026-10-26',
    committeeMembers: [
      {
        name: 'Prof. D. K. Agrawal',
        designation: 'Head of Mechanical Engineering',
        affiliation: 'MANIT Bhopal',
        specialization: 'Thermal & Mechatronics',
        contact: 'dkagrawal@manit.ac.in'
      },
      {
        name: 'Dr. Sunita V. Rao',
        designation: 'Associate Professor',
        affiliation: 'IIT Indore',
        specialization: 'Electrical & Power Systems',
        contact: 'svrao@iiti.ac.in'
      }
    ],
    reportSubmittedDate: '2026-10-22',
    deficienciesFound: false,
    recommendedIntake: 420,
    reportDocumentUrl: '/docs/evc/EVC_CRO_6411_Final_Report.pdf',
    escalationTriggered: false
  },
  {
    id: 'EVC-1092-03',
    applicationId: 'APP-SRO-1092',
    applicationNumber: 'APP/2026-27/SRO-1092',
    institutionPermanentId: '1-109723412',
    institutionName: 'Sri Krishna College of Technology',
    region: 'Southern',
    inspectionType: 'PHYSICAL_INSPECTION',
    status: 'PENDING_SCHEDULING',
    slaReportDeadline: '2026-11-15',
    committeeMembers: [],
    deficienciesFound: false,
    escalationTriggered: false
  }
];
