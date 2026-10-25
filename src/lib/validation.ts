import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Valid institutional email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const AdvanceStageSchema = z.object({
  targetStage: z.enum([
    'SCRUTINY',
    'RE_SCRUTINY',
    'EVC_SCHEDULED',
    'EVC_COMPLETED',
    'SAC_SHC_REVIEW',
    'APPROVED',
    'REVERTED_DEFICIENCY',
    'REJECTED',
  ]),
  remarks: z.string().min(2, 'Stage transition remarks are required').max(1000),
});

export const RevertDeficiencySchema = z.object({
  clause: z.string().min(1, 'APH statutory clause is required').max(100),
  description: z.string().min(5, 'Deficiency description is required').max(2000),
  category: z.string().min(1, 'Category is required').max(100),
  cureDays: z.number().int().min(1).max(90).optional(),
});

export const CureDeficiencySchema = z.object({
  responseNote: z.string().min(5, 'Institutional cure explanation is required').max(2000),
  responseDocumentUrl: z.string().optional(),
});

export const VerifyDeficiencyCureSchema = z.object({
  accepted: z.boolean(),
  remarks: z.string().min(2, 'Verification remarks are required').max(1000),
});

export const ScheduleEvcSchema = z.object({
  applicationId: z.string().uuid(),
  inspectionType: z.enum(['PHYSICAL_INSPECTION', 'SURPRISE_INSPECTION', 'VIRTUAL_VERIFICATION']),
  scheduledDate: z.string().min(1, 'Scheduled inspection date is required'),
  committeeMembers: z.array(
    z.object({
      name: z.string().min(2),
      designation: z.string().min(2),
      affiliation: z.string().min(2),
      specialization: z.string().min(2),
      contact: z.string().min(5),
    })
  ).min(1, 'At least 1 committee member is required'),
});

export const SubmitEvcReportSchema = z.object({
  deficienciesFound: z.boolean(),
  summary: z.string().min(5, 'Executive inspection summary is required').max(3000),
  intake: z.number().int().min(0).max(10000).optional(),
  reportDocumentUrl: z.string().optional(),
});

export const RatifyEvcReportSchema = z.object({
  approved: z.boolean(),
  remarks: z.string().min(2, 'Official ratification remarks are required').max(1000),
});

export const SubmitUndertakingProofSchema = z.object({
  documentName: z.string().min(2, 'Evidence document name/description is required').max(255),
  documentUrl: z.string().optional(),
});

export const VerifyUndertakingSchema = z.object({
  verified: z.boolean(),
  remarks: z.string().min(2, 'Verification remarks are required').max(1000),
});

export const SubmitDocumentRenewalSchema = z.object({
  newExpiryDate: z.string().min(1, 'New validity expiry date is required'),
  renewalDocumentUrl: z.string().optional(),
});

export const VerifyDocumentRenewalSchema = z.object({
  verified: z.boolean(),
  remarks: z.string().optional(),
});

export const UpdateAphConfigSchema = z.object({
  scrutinyMaxDays: z.number().int().min(1).max(365),
  reScrutinyMaxDays: z.number().int().min(1).max(365),
  evcInspectionMaxDays: z.number().int().min(1).max(365),
  evcReportUploadMaxDays: z.number().int().min(1).max(60),
  sacAppellateMaxDays: z.number().int().min(1).max(180),
  deficiencyCurePeriodDays: z.number().int().min(1).max(90),
  undertakingGracePeriodDays: z.number().int().min(1).max(180),
  leaseAdvanceAlertDays: z.number().int().min(1).max(365),
  escalationL1Days: z.number().int().min(1).max(60),
  escalationL2Days: z.number().int().min(1).max(120),
  slaWarningDays: z.number().int().min(1).max(30),
});

export const SweepRequestSchema = z.object({
  simulatedDate: z.string().optional(),
});
