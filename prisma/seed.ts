import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { USER_ACCOUNTS } from '../src/data/users';
import { runComplianceSweep, getAphConfig } from '../src/lib/rulesEngine';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding AICTE Approval Workflow Database (APH 2026-27 Dynamic Seed)...');

  // 1. Clean existing records in referential order
  await prisma.notificationLog.deleteMany();
  await prisma.uploadedFile.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.deficiency.deleteMany();
  await prisma.evcSchedule.deleteMany();
  await prisma.timeBoundUndertaking.deleteMany();
  await prisma.documentValidity.deleteMany();
  await prisma.alertNotification.deleteMany();
  await prisma.approvalApplication.deleteMany();
  await prisma.institution.deleteMany();
  await prisma.user.deleteMany();
  await prisma.aphConfig.deleteMany();

  console.log('Cleared database tables.');

  // 2. Seed Default Statutory APH SLA Configuration
  await getAphConfig();
  console.log('Seeded default APH SLA configuration.');

  // 3. Seed Users with Bcrypt Hashed Passwords
  const hashedPassword = bcrypt.hashSync('password123', 10);
  for (const user of USER_ACCOUNTS) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email.toLowerCase(),
        password: hashedPassword,
        name: user.name,
        role: user.role,
        designation: user.designation,
        department: user.department,
        region: user.region || null,
        institutionPermanentId: user.institutionPermanentId || null,
        institutionName: user.institutionName || null,
        avatarBg: user.avatarBg || null,
        badgeBg: user.badgeBg || null,
        description: user.description || null,
        permissions: JSON.stringify(user.permissions),
      },
    });
  }
  console.log(`Seeded ${USER_ACCOUNTS.length} users with secure bcrypt hashes.`);

  // 4. Seed Institutions
  const sampleInstitutions = [
    {
      permanentId: '1-109723412',
      name: 'Sri Krishna College of Technology',
      region: 'Southern',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      address: 'Kovaipudur, Coimbatore, Tamil Nadu 641042',
      principalName: 'Dr. K. Subramanian',
      contactEmail: 'principal@skct.edu.in',
      contactPhone: '+91 422 260 4567',
      instituteType: 'Autonomous Private Technical Institute',
      currentApprovalStatus: 'Approved',
      totalApprovedIntake: 1320,
    },
    {
      permanentId: '1-209843211',
      name: 'PSG Institute of Advanced Technology',
      region: 'Southern',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      address: 'Avinashi Road, Peelamedu, Coimbatore 641004',
      principalName: 'Dr. P. Radhakrishnan',
      contactEmail: 'contact@psgiat.edu.in',
      contactPhone: '+91 422 434 4000',
      instituteType: 'Private Self-Financing',
      currentApprovalStatus: 'Approved',
      totalApprovedIntake: 960,
    },
    {
      permanentId: '1-309112233',
      name: 'Veermata Jijabai Technological Institute (VJTI)',
      region: 'Western',
      state: 'Maharashtra',
      city: 'Mumbai',
      address: 'H R Mahajani Marg, Matunga, Mumbai 400019',
      principalName: 'Dr. Sachin Deshmukh',
      contactEmail: 'director@vjti.ac.in',
      contactPhone: '+91 22 2419 8101',
      instituteType: 'Government Aided Autonomous Institute',
      currentApprovalStatus: 'Approved',
      totalApprovedIntake: 1080,
    },
    {
      permanentId: '1-409988776',
      name: 'Pune Institute of Computer Technology',
      region: 'Western',
      state: 'Maharashtra',
      city: 'Pune',
      address: 'Survey No. 27, Dhankawadi, Pune 411043',
      principalName: 'Dr. P. T. Kulkarni',
      contactEmail: 'principal@pict.edu',
      contactPhone: '+91 20 2437 1101',
      instituteType: 'Private Engineering College',
      currentApprovalStatus: 'Approved',
      totalApprovedIntake: 780,
    },
    {
      permanentId: '1-509334455',
      name: 'Delhi Technological University (North Campus)',
      region: 'Northern',
      state: 'Delhi',
      city: 'New Delhi',
      address: 'Shahbad Daulatpur, Bawana Road, Delhi 110042',
      principalName: 'Prof. Pradeep Kumar',
      contactEmail: 'vc@dtu.ac.in',
      contactPhone: '+91 11 2787 1018',
      instituteType: 'State University Affiliate',
      currentApprovalStatus: 'Approved',
      totalApprovedIntake: 1800,
    },
    {
      permanentId: '1-609556677',
      name: 'Heritage Institute of Technology',
      region: 'Eastern',
      state: 'West Bengal',
      city: 'Kolkata',
      address: 'Chowbaga Road, Anandapur, Kolkata 700107',
      principalName: 'Dr. B. Sengupta',
      contactEmail: 'admin@heritageit.edu',
      contactPhone: '+91 33 6627 0600',
      instituteType: 'Autonomous Institute',
      currentApprovalStatus: 'Approved',
      totalApprovedIntake: 840,
    },
  ];

  for (const inst of sampleInstitutions) {
    await prisma.institution.create({
      data: {
        permanentId: inst.permanentId,
        name: inst.name,
        aliases: JSON.stringify([inst.name]),
        region: inst.region,
        state: inst.state,
        city: inst.city,
        address: inst.address,
        principalName: inst.principalName,
        contactEmail: inst.contactEmail,
        contactPhone: inst.contactPhone,
        instituteType: inst.instituteType,
        currentApprovalStatus: inst.currentApprovalStatus,
        eoaAcademicYear: '2026-27',
        complianceRating: 4.3,
        totalApprovedIntake: inst.totalApprovedIntake,
      },
    });
  }
  console.log(`Seeded ${sampleInstitutions.length} technical institutions.`);

  // 5. Seed Applications with Relative Timestamps
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const sampleApps = [
    {
      applicationNumber: 'AICTE-APP-2026-SRO-001',
      institutionPermanentId: '1-109723412',
      institutionName: 'Sri Krishna College of Technology',
      region: 'Southern',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      applicationType: 'Extension of Approval (EoA)',
      appliedOffsetDays: 38, // Applied 38 days ago
      slaDurationDays: 30,   // SLA was 30 days -> overdue by 8 days -> Level 2
      route: 'Scrutiny + EVC',
      currentStage: 'EVC_SCHEDULED',
      priority: 'HIGH',
      assignedOfficer: 'Dr. M. Sundararajan (RO Southern)',
      appliedIntake: 1380,
      totalApprovedIntake: 1320,
    },
    {
      applicationNumber: 'AICTE-APP-2026-SRO-002',
      institutionPermanentId: '1-209843211',
      institutionName: 'PSG Institute of Advanced Technology',
      region: 'Southern',
      state: 'Tamil Nadu',
      city: 'Coimbatore',
      applicationType: 'Increase in Intake',
      appliedOffsetDays: 12, // Applied 12 days ago
      slaDurationDays: 30,   // Within SLA
      route: 'Only Scrutiny',
      currentStage: 'SCRUTINY',
      priority: 'MEDIUM',
      assignedOfficer: 'Prof. Anand Vardhan (Convener)',
      appliedIntake: 1080,
      totalApprovedIntake: 960,
    },
    {
      applicationNumber: 'AICTE-APP-2026-WRO-003',
      institutionPermanentId: '1-309112233',
      institutionName: 'Veermata Jijabai Technological Institute (VJTI)',
      region: 'Western',
      state: 'Maharashtra',
      city: 'Mumbai',
      applicationType: 'New Course Introduction',
      appliedOffsetDays: 48, // Applied 48 days ago
      slaDurationDays: 30,   // Overdue by 18 days -> Level 3 Member Secretary
      route: 'Full APH Cycle',
      currentStage: 'REVERTED_DEFICIENCY',
      priority: 'CRITICAL',
      assignedOfficer: 'Dr. Sunita Deshmukh (RO Western)',
      appliedIntake: 1200,
      totalApprovedIntake: 1080,
    },
    {
      applicationNumber: 'AICTE-APP-2026-WRO-004',
      institutionPermanentId: '1-409988776',
      institutionName: 'Pune Institute of Computer Technology',
      region: 'Western',
      state: 'Maharashtra',
      city: 'Pune',
      applicationType: 'Extension of Approval (EoA)',
      appliedOffsetDays: 8,
      slaDurationDays: 30,
      route: 'Only Scrutiny',
      currentStage: 'APPROVED',
      priority: 'LOW',
      assignedOfficer: 'Dr. Sunita Deshmukh (RO Western)',
      appliedIntake: 780,
      totalApprovedIntake: 780,
    },
    {
      applicationNumber: 'AICTE-APP-2026-NRO-005',
      institutionPermanentId: '1-509334455',
      institutionName: 'Delhi Technological University (North Campus)',
      region: 'Northern',
      state: 'Delhi',
      city: 'New Delhi',
      applicationType: 'New Technical Institution',
      appliedOffsetDays: 22,
      slaDurationDays: 25, // Approaching SLA warning (3 days remaining)
      route: 'EVC + SAC/SHC',
      currentStage: 'EVC_SCHEDULED',
      priority: 'HIGH',
      assignedOfficer: 'Dr. Ramesh Unnikrishnan (Adviser AB)',
      appliedIntake: 1800,
      totalApprovedIntake: 0,
    },
    {
      applicationNumber: 'AICTE-APP-2026-ERO-006',
      institutionPermanentId: '1-609556677',
      institutionName: 'Heritage Institute of Technology',
      region: 'Eastern',
      state: 'West Bengal',
      city: 'Kolkata',
      applicationType: 'Extension of Approval (EoA)',
      appliedOffsetDays: 14,
      slaDurationDays: 30,
      route: 'Only EVC',
      currentStage: 'EVC_SCHEDULED',
      priority: 'MEDIUM',
      assignedOfficer: 'Approval Bureau Inspection Cell',
      appliedIntake: 900,
      totalApprovedIntake: 840,
    },
  ];

  for (const app of sampleApps) {
    const appliedDate = new Date(now.getTime() - app.appliedOffsetDays * dayMs);
    const slaDeadline = new Date(appliedDate.getTime() + app.slaDurationDays * dayMs);

    const createdApp = await prisma.approvalApplication.create({
      data: {
        applicationNumber: app.applicationNumber,
        institutionPermanentId: app.institutionPermanentId,
        institutionName: app.institutionName,
        region: app.region,
        state: app.state,
        city: app.city,
        applicationType: app.applicationType,
        academicYear: '2026-27',
        appliedDate,
        route: app.route,
        currentStage: app.currentStage,
        priority: app.priority,
        slaDeadline,
        daysPending: 0, // Sweep will compute
        assignedOfficer: app.assignedOfficer,
        appliedIntake: app.appliedIntake,
        totalApprovedIntake: app.totalApprovedIntake,
      },
    });

    // Add Audit Log
    await prisma.auditLog.create({
      data: {
        applicationId: createdApp.id,
        timestamp: appliedDate,
        actorName: 'AICTE Central Inward Desk',
        actorRole: 'SYSTEM',
        actionType: 'STAGE_TRANSITION',
        stageFrom: 'SUBMITTED',
        stageTo: app.currentStage,
        title: `Application Registered for AY 2026-27`,
        remarks: `Routed via ${app.route} under statutory APH guidelines.`,
      },
    });

    // Add Deficiencies for app 003 (VJTI) and app 001 (SKCT)
    if (app.applicationNumber === 'AICTE-APP-2026-WRO-003') {
      await prisma.deficiency.create({
        data: {
          applicationId: createdApp.id,
          clause: 'Clause 4.2(b)',
          description: 'Faculty Cadre Ratio deficient in AI & Data Science wing. Cadre ratio is 1:24 against mandatory 1:15.',
          category: 'Faculty Cadre',
          cureDeadline: new Date(now.getTime() - 2 * dayMs), // Expired 2 days ago!
          status: 'PENDING_CURE',
        },
      });
    }

    if (app.applicationNumber === 'AICTE-APP-2026-SRO-001') {
      await prisma.deficiency.create({
        data: {
          applicationId: createdApp.id,
          clause: 'Clause 7.1(a)',
          description: 'Barrier-free tactile paving and RPwD ramp specifications required in new Academic Block 4.',
          category: 'Land & Building',
          cureDeadline: new Date(now.getTime() + 6 * dayMs), // 6 days remaining
          status: 'CURED_PENDING_VERIFICATION',
          institutionResponse: 'Tactile paving and ramp constructed with 1:12 gradient. Photographic evidence and PWD architect endorsement attached.',
        },
      });
    }
  }
  console.log(`Seeded ${sampleApps.length} applications with dynamic relative dates.`);

  // 6. Seed EVC Schedules
  const app001 = await prisma.approvalApplication.findUnique({ where: { applicationNumber: 'AICTE-APP-2026-SRO-001' } });
  const app005 = await prisma.approvalApplication.findUnique({ where: { applicationNumber: 'AICTE-APP-2026-NRO-005' } });

  if (app001) {
    await prisma.evcSchedule.create({
      data: {
        applicationId: app001.id,
        applicationNumber: app001.applicationNumber,
        institutionPermanentId: app001.institutionPermanentId,
        institutionName: app001.institutionName,
        region: app001.region,
        inspectionType: 'PHYSICAL_INSPECTION',
        status: 'PANEL_CONSTITUTED',
        scheduledDate: new Date(now.getTime() + 4 * dayMs),
        slaReportDeadline: new Date(now.getTime() + 9 * dayMs),
        committeeMembersJson: JSON.stringify([
          { name: 'Dr. K. Natarajan', designation: 'Chairman', affiliation: 'NIT Trichy', specialization: 'Computer Engineering', contact: 'natarajan@nitt.edu' },
          { name: 'Prof. R. Meenakshi', designation: 'AICTE Nominee', affiliation: 'Anna University', specialization: 'Information Technology', contact: 'meenakshi@annauniv.edu' },
          { name: 'Er. V. Sundaram', designation: 'Industry Expert', affiliation: 'L&T Infotech', specialization: 'Cyber Security', contact: 'sundaram.v@lnt.com' },
        ]),
      },
    });
  }

  if (app005) {
    await prisma.evcSchedule.create({
      data: {
        applicationId: app005.id,
        applicationNumber: app005.applicationNumber,
        institutionPermanentId: app005.institutionPermanentId,
        institutionName: app005.institutionName,
        region: app005.region,
        inspectionType: 'SURPRISE_INSPECTION',
        status: 'PENDING_SCHEDULING',
        scheduledDate: null,
        slaReportDeadline: new Date(now.getTime() + 12 * dayMs),
        committeeMembersJson: '[]',
      },
    });
  }
  console.log('Seeded EVC schedules.');

  // 7. Seed Time-Bound Undertakings with Relative Dates
  if (app001) {
    // Active undertaking pending submission
    await prisma.timeBoundUndertaking.create({
      data: {
        applicationId: app001.id,
        applicationNumber: app001.applicationNumber,
        institutionPermanentId: app001.institutionPermanentId,
        institutionName: app001.institutionName,
        region: app001.region,
        category: 'INFRASTRUCTURE_UPGRADE',
        conditionTitle: 'Dedicated High-Performance AI/GPU Cluster (8x NVIDIA H100)',
        prescribedCondition: 'Commission dedicated GPU compute server for newly approved M.Tech AI & Data Science research lab within 90 days of EoA grant.',
        imposedDate: new Date(now.getTime() - 40 * dayMs),
        dueDate: new Date(now.getTime() + 15 * dayMs),
        status: 'PENDING_SUBMISSION',
      },
    });

    // Overdue undertaking past grace period
    await prisma.timeBoundUndertaking.create({
      data: {
        applicationId: app001.id,
        applicationNumber: app001.applicationNumber,
        institutionPermanentId: app001.institutionPermanentId,
        institutionName: app001.institutionName,
        region: app001.region,
        category: 'ENDOWMENT_FUND',
        conditionTitle: 'Joint FDR Fixed Deposit of ₹35 Lakhs with AICTE',
        prescribedCondition: 'Deposit statutory joint fixed deposit with Member Secretary AICTE in nationalized bank.',
        imposedDate: new Date(now.getTime() - 95 * dayMs),
        dueDate: new Date(now.getTime() - 45 * dayMs), // Due 45 days ago (past 30d grace)
        status: 'PENDING_SUBMISSION',
      },
    });
  }
  console.log('Seeded time-bound undertakings.');

  // 8. Seed Document Validity Records with Relative Dates
  const sampleDocs = [
    {
      institutionPermanentId: '1-109723412',
      institutionName: 'Sri Krishna College of Technology',
      region: 'Southern',
      documentType: 'LAND_LEASE_DEED',
      documentNumber: 'TN-CBE-REG-2004-9871',
      issuingAuthority: 'Sub-Registrar Office, Coimbatore South',
      issuedDate: new Date(now.getTime() - 365 * 25 * dayMs),
      expiryOffsetDays: 120, // Expiring in 120 days -> ACTIVE_VALID (>90d)
      documentUrl: '/uploads/sample_lease_deed.pdf',
    },
    {
      institutionPermanentId: '1-109723412',
      institutionName: 'Sri Krishna College of Technology',
      region: 'Southern',
      documentType: 'FIRE_SAFETY_NOC',
      documentNumber: 'TN-FS-CBE-2025-1142',
      issuingAuthority: 'Tamil Nadu Fire and Rescue Services Department',
      issuedDate: new Date(now.getTime() - 340 * dayMs),
      expiryOffsetDays: 25, // Expiring in 25 days -> CRITICAL_30D!
      documentUrl: '/uploads/sample_fire_noc.pdf',
    },
    {
      institutionPermanentId: '1-309112233',
      institutionName: 'Veermata Jijabai Technological Institute (VJTI)',
      region: 'Western',
      documentType: 'LAND_LEASE_DEED',
      documentNumber: 'MH-MUM-REG-1996-4412',
      issuingAuthority: 'Registrar of Assurances, Mumbai City',
      issuedDate: new Date(now.getTime() - 365 * 30 * dayMs),
      expiryOffsetDays: -12, // Expired 12 days ago -> EXPIRED BREACH!
      documentUrl: '/uploads/sample_mumbai_lease.pdf',
    },
    {
      institutionPermanentId: '1-409988776',
      institutionName: 'Pune Institute of Computer Technology',
      region: 'Western',
      documentType: 'BUILDING_STABILITY',
      documentNumber: 'MH-PUN-PWD-2024-8871',
      issuingAuthority: 'Public Works Department (PWD) Executive Engineer',
      issuedDate: new Date(now.getTime() - 300 * dayMs),
      expiryOffsetDays: 75, // Expiring in 75 days -> EXPIRING_SOON_90D!
      documentUrl: '/uploads/sample_building_cert.pdf',
    },
  ];

  for (const doc of sampleDocs) {
    const expiryDate = new Date(now.getTime() + doc.expiryOffsetDays * dayMs);
    await prisma.documentValidity.create({
      data: {
        institutionPermanentId: doc.institutionPermanentId,
        institutionName: doc.institutionName,
        region: doc.region,
        documentType: doc.documentType,
        documentNumber: doc.documentNumber,
        issuingAuthority: doc.issuingAuthority,
        issuedDate: doc.issuedDate,
        expiryDate,
        status: 'ACTIVE_VALID', // Sweep will compute real status
        documentUrl: doc.documentUrl,
        escalationNoticeServed: false,
      },
    });
  }
  console.log('Seeded document validity records.');

  // 9. Execute Immediate Regulatory Compliance Sweep
  console.log('Executing initial automated compliance sweep to compute live statuses and alerts...');
  const summary = await runComplianceSweep(now);
  console.log('Compliance Sweep Results:', summary);

  console.log('AICTE Approval Workflow Database Seeded & Normalized Successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
