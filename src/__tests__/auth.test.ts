import { describe, it, expect, beforeEach } from 'vitest';
import {
  hasPermission,
  verifyRegionalJurisdiction,
  verifyInstitutionOwnership,
  createSessionToken,
  verifySessionToken,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '@/lib/auth';
import { UserAccount } from '@/types';

describe('Auth & Security - Permissions, Tenancy & Rate Limiting', () => {
  const superAdminUser: UserAccount = {
    id: 'user_admin',
    name: 'Prof. Alok Roy',
    email: 'member.secretary@aicte.gov.in',
    role: 'SUPER_ADMIN',
    designation: 'Member Secretary',
    department: 'Executive Council',
    description: 'Supreme statutory administrator of AICTE Council',
    permissions: ['ALL_PERMISSIONS'],
  };

  const southernRoUser: UserAccount = {
    id: 'user_ro_south',
    name: 'Dr. C. Venkatesh',
    email: 'ro.southern@aicte.gov.in',
    role: 'REGIONAL_OFFICER',
    designation: 'Regional Officer & Director',
    department: 'Southern Regional Office',
    description: 'Regional regulatory authority for Southern Zone',
    region: 'Southern',
    permissions: [
      'SCRUTINY_VERIFY',
      'ISSUE_DEFICIENCY_REVERT',
      'SCHEDULE_EVC_PANEL',
      'VERIFY_UNDERTAKINGS',
      'VERIFY_LEASE_RENEWAL',
    ],
  };

  const bureauUser: UserAccount = {
    id: 'user_bureau',
    name: 'Dr. Ramesh Kumar',
    email: 'bureau.approval@aicte.gov.in',
    role: 'BUREAU_OFFICER',
    designation: 'Adviser (Approval Bureau)',
    department: 'Approval Bureau HQ',
    description: 'Central headquarters bureau officer',
    permissions: [
      'SCRUTINY_VERIFY',
      'ISSUE_DEFICIENCY_REVERT',
      'OVERRIDE_ESCALATION',
      'CONFIGURE_APH_SLAS',
      'EXPORT_REGULATORY_DATA',
    ],
  };

  const principalUser: UserAccount = {
    id: 'user_principal_1',
    name: 'Dr. M. Soundararajan',
    email: 'principal@psgtech.edu',
    role: 'INSTITUTION_PRINCIPAL',
    designation: 'Principal & Head of Institution',
    department: 'PSG College of Technology',
    description: 'Authorized representative for PSG College of Technology',
    institutionPermanentId: '1-10029381',
    institutionName: 'PSG College of Technology',
    region: 'Southern',
    permissions: [
      'VIEW_OWN_INSTITUTION_ONLY',
      'SUBMIT_DEFICIENCY_CURE',
      'SUBMIT_UNDERTAKING_PROOF',
      'SUBMIT_LEASE_RENEWAL',
    ],
  };

  describe('Permission Verification (hasPermission)', () => {
    it('SUPER_ADMIN with ALL_PERMISSIONS is authorized for every permission', () => {
      expect(hasPermission(superAdminUser, 'SCRUTINY_VERIFY')).toBe(true);
      expect(hasPermission(superAdminUser, 'CONFIGURE_APH_SLAS')).toBe(true);
      expect(hasPermission(superAdminUser, 'EXPORT_REGULATORY_DATA')).toBe(true);
      expect(hasPermission(superAdminUser, 'SUBMIT_DEFICIENCY_CURE')).toBe(true);
    });

    it('officials only have their assigned granular permissions', () => {
      expect(hasPermission(southernRoUser, 'SCRUTINY_VERIFY')).toBe(true);
      expect(hasPermission(southernRoUser, 'SCHEDULE_EVC_PANEL')).toBe(true);
      // RO does not have CONFIGURE_APH_SLAS
      expect(hasPermission(southernRoUser, 'CONFIGURE_APH_SLAS')).toBe(false);

      expect(hasPermission(bureauUser, 'CONFIGURE_APH_SLAS')).toBe(true);
      expect(hasPermission(bureauUser, 'OVERRIDE_ESCALATION')).toBe(true);
      // Bureau does not have SCHEDULE_EVC_PANEL in its specific list
      expect(hasPermission(bureauUser, 'SCHEDULE_EVC_PANEL')).toBe(false);
    });

    it('institution principal cannot perform administrative actions', () => {
      expect(hasPermission(principalUser, 'SUBMIT_DEFICIENCY_CURE')).toBe(true);
      expect(hasPermission(principalUser, 'SUBMIT_UNDERTAKING_PROOF')).toBe(true);
      expect(hasPermission(principalUser, 'SCRUTINY_VERIFY')).toBe(false);
      expect(hasPermission(principalUser, 'ISSUE_DEFICIENCY_REVERT')).toBe(false);
      expect(hasPermission(principalUser, 'CONFIGURE_APH_SLAS')).toBe(false);
    });
  });

  describe('Regional Tenancy Jurisdiction (verifyRegionalJurisdiction)', () => {
    it('SUPER_ADMIN and BUREAU_OFFICER have nationwide jurisdiction across all regions', () => {
      expect(verifyRegionalJurisdiction(superAdminUser, 'Southern')).toBe(true);
      expect(verifyRegionalJurisdiction(superAdminUser, 'Northern')).toBe(true);
      expect(verifyRegionalJurisdiction(superAdminUser, 'Western')).toBe(true);

      expect(verifyRegionalJurisdiction(bureauUser, 'Southern')).toBe(true);
      expect(verifyRegionalJurisdiction(bureauUser, 'Central')).toBe(true);
    });

    it('REGIONAL_OFFICER is restricted to their assigned geographic territory', () => {
      expect(verifyRegionalJurisdiction(southernRoUser, 'Southern')).toBe(true);
      expect(verifyRegionalJurisdiction(southernRoUser, 'southern')).toBe(true); // Case-insensitive
      expect(verifyRegionalJurisdiction(southernRoUser, 'Western')).toBe(false);
      expect(verifyRegionalJurisdiction(southernRoUser, 'Northern')).toBe(false);
      expect(verifyRegionalJurisdiction(southernRoUser, 'Eastern')).toBe(false);
    });
  });

  describe('Institutional Ownership Tenancy (verifyInstitutionOwnership)', () => {
    it('SUPER_ADMIN has universal access across all institutions', () => {
      expect(verifyInstitutionOwnership(superAdminUser, '1-10029381')).toBe(true);
      expect(verifyInstitutionOwnership(superAdminUser, '1-99999999')).toBe(true);
    });

    it('INSTITUTION_PRINCIPAL can only modify records belonging to their own permanentId', () => {
      expect(verifyInstitutionOwnership(principalUser, '1-10029381')).toBe(true);
      expect(verifyInstitutionOwnership(principalUser, '1-20048211')).toBe(false);
      expect(verifyInstitutionOwnership(principalUser, '1-84729104')).toBe(false);
    });
  });

  describe('JWT Session Tokens (createSessionToken & verifySessionToken)', () => {
    it('generates a signed JWT and verifies userId payload correctly', async () => {
      const token = await createSessionToken('user_test_123');
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const verified = await verifySessionToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe('user_test_123');
    });

    it('rejects forged or corrupted tokens', async () => {
      const verified = await verifySessionToken('invalid.malformed.jwt_token');
      expect(verified).toBeNull();
    });
  });

  describe('Login Rate Limiter (checkRateLimit & recordFailedAttempt)', () => {
    const testEmail = 'rate.test@aicte.gov.in';

    beforeEach(() => {
      resetRateLimit(testEmail);
    });

    it('permits initial attempts and tracks remaining quota', () => {
      const status = checkRateLimit(testEmail);
      expect(status.allowed).toBe(true);
      expect(status.remainingAttempts).toBe(5);
    });

    it('blocks access after 5 failed attempts within 15 minutes', () => {
      for (let i = 1; i <= 5; i++) {
        recordFailedAttempt(testEmail);
      }

      const blockedStatus = checkRateLimit(testEmail);
      expect(blockedStatus.allowed).toBe(false);
      expect(blockedStatus.remainingAttempts).toBe(0);
      expect(blockedStatus.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('resets rate limit immediately upon successful login', () => {
      for (let i = 1; i <= 5; i++) {
        recordFailedAttempt(testEmail);
      }
      expect(checkRateLimit(testEmail).allowed).toBe(false);

      resetRateLimit(testEmail);
      expect(checkRateLimit(testEmail).allowed).toBe(true);
      expect(checkRateLimit(testEmail).remainingAttempts).toBe(5);
    });
  });
});
