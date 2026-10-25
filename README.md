# Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System
### Smart India Hackathon (SIH) Solution | AICTE Approval Process Handbook (APH 2026-27)

> **A Unified Digital Platform Automating End-to-End AICTE Approval Workflows, Committee Scheduling, Time-Bound Undertakings, 30-Year Lease Validity Sentinels, Multi-Tier Escalations, and Statutory Council Reports.**

---

## 🏛️ Executive Summary & Problem Statement Mapping

Under the statutory mandate of the **All India Council for Technical Education Act, 1987** and the **Approval Process Handbook (APH 2026-27)**, AICTE regulates technical education institutions across 7 Regional Offices. The approval cycle involves multi-stage routing, strict time-bound conditional undertakings, perpetual monitoring of registered 30-year land leases and annual statutory NOCs, and automated escalation ladders.

### 📋 Direct Mapping to SIH Problem Statement Requirements

| Section | SIH Requirement | Platform Screen & Implementation |
| :--- | :--- | :--- |
| **Section A** | **End-to-End Approval Workflow Engine** | `ApplicationsDesk`: 5 distinct statutory routes (`Only Scrutiny`, `Scrutiny + EVC`, `Only EVC`, `EVC + SAC/SHC`, `Full APH Cycle`), terminal state locking (`APPROVED`/`REJECTED`), and route-correct recovery (`RE_SCRUTINY` vs `EVC_SCHEDULED`). |
| **Section B** | **Deficiency Revert & 15-Day Cure Desk** | `ApplicationDetailModal`: Official deficiency issuance with clause tagging $\rightarrow$ Institution cure submission with PDF proof $\rightarrow$ Two-step verification desk (`CURED_PENDING_VERIFICATION` $\rightarrow$ `CURED_VERIFIED`). |
| **Section C** | **EVC Scheduling, Panel Constitution & Priority Queue** | `EvcScheduleManager`: Section C Awaiting EVC priority queue highlighting New Technical Institutions; committee role assignment; on-site report upload; separate official ratification modal (`REPORT_RATIFIED` $\rightarrow$ `EVC_COMPLETED`). |
| **Section D** | **Time-Bound Undertakings Monitoring** | `UndertakingsDesk`: Conditional approval tracking (GPU labs, RPwD ramps, PhD cadre ratios, FDRs) with grace-period logic and `REJECTED_RESUBMIT` status. |
| **Section E** | **30-Year Registered Lease & NOC Radar** | `DocumentValidityMonitor`: 4-tier horizon radar (`ACTIVE_VALID` $>90$d, `EXPIRING_SOON_90D`, `CRITICAL_30D`, `EXPIRED`) with automatic recalculation upon renewal verification or rejection. |
| **Section F** | **Multi-Tier Escalations & Automated Sentinel** | `AlertsHub` & `AnalyticsCharts`: Configurable SLA engine (`LEVEL_1_RO` $\rightarrow$ `LEVEL_2_BUREAU` $\rightarrow$ `LEVEL_3_MEMBER_SECRETARY`), deduplicated alerts, Nodemailer/Mock dispatch log, and bottleneck analytics. |
| **Executive** | **Statutory Reports & Audit Trail** | `RegulatoryReportsView` & `AuditTrailView`: Printable Consolidated Council Dossier (`window.print()`), date-filtered CSV extracts, and immutable append-only audit trail. |

---

## 🏗️ Technical Architecture

- **Framework:** Next.js 16.4.2 (App Router with Turbopack, React 19)
- **Database & ORM:** SQLite via Prisma 6.19.3
- **Authentication & Security:**
  - HTTP-only, secure, `SameSite=Lax` session cookie with signed JWT tokens (`jose` HS256).
  - Bcrypt password hashing (`bcryptjs` 12 salt rounds).
  - Server-side role-based access control (RBAC), regional tenancy isolation, and institutional ownership guards.
  - In-memory login rate limiter (5 attempts per 15 minutes per email).
  - Security headers enforced: Content Security Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, and Permissions-Policy.
- **Workflow & Rules Engine:**
  - `src/lib/workflowEngine.ts`: Deterministic finite-state machine with terminal stage protections and route-aware post-deficiency recovery.
  - `src/lib/rulesEngine.ts`: Automated `runComplianceSweep()` computing stage SLAs, document radar statuses, undertaking grace expirations, EVC delays, and alert deduplication via unique compound keys (`dedupKey`).
- **Autonomous Scheduling:**
  - `src/instrumentation.ts`: Executes compliance sweep on Next.js server boot and schedules 15-minute `node-cron` sweeps in development.
- **Auditing & Document Storage:**
  - Full append-only `AuditLog` capturing actor, role, timestamp, action type, stage movements, and IP/User-Agent.
  - Multi-part file upload endpoint (`/api/uploads`) with 10MB limit, MIME type whitelist (PDF/JPEG/PNG), and SHA-256 integrity validation.
- **Notifications:**
  - `src/lib/notifier.ts`: Nodemailer SMTP dispatcher with fallback to console logging and database recording in `NotificationLog`.

---

## 🚀 Setup & Local Execution

### 1. Environment Configuration
Create a `.env` file in the project root:
```env
AUTH_SECRET="your_strong_auth_jwt_secret_key_minimum_32_characters_long"
CRON_SECRET="your_cron_secret_token_for_scheduled_tasks"
NEXT_PUBLIC_DEMO_MODE=true
DATABASE_URL="file:./dev.db"
PORT=3001

# Optional SMTP Settings (defaults to console logging + database delivery log)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your_email@domain.com
# SMTP_PASS=your_email_password
# SMTP_FROM="AICTE Regulatory Sentinel <alerts@aicte-india.org>"
```

### 2. Database Push & Relative Timestamp Seed
The database uses dynamic relative timestamps (`now - X days`), ensuring test records and SLA calculations remain fresh regardless of when the application is evaluated.
```bash
cd /Users/shiyamsundars/Projects/aicte-approval-system

# Push Prisma schema to SQLite
npx prisma db push

# Run the dynamic relative seed script
npx tsx prisma/seed.ts
```

### 3. Start the Server
The application runs on port **3001** (leaving port 3000 free for Project 1):
```bash
npm run dev
```
Access the application at: **`http://localhost:3001`**

---

## 👥 Evaluation Personas & SSO Quick-Switcher

When `NEXT_PUBLIC_DEMO_MODE=true`, a **DEMO MODE** badge appears in the header with 1-click persona switching (all passwords default to `password123` via server-side `/api/auth/login`):

| Persona Name | Role | Designation & Department | Scope / Jurisdiction |
| :--- | :--- | :--- | :--- |
| **Prof. Rajive Kumar** | `SUPER_ADMIN` | Member Secretary | Universal nationwide access, Level 3 Council overrides |
| **Dr. Ramesh Unnikrishnan** | `BUREAU_OFFICER` | Adviser (Approval Bureau HQ) | All 7 Regional Offices, APH Rule & SLA configurations |
| **Dr. M. Sundararajan** | `REGIONAL_OFFICER` | Regional Officer (Southern) | Tamil Nadu & Puducherry; Scrutiny & EVC scheduling |
| **Dr. Sunita Deshmukh** | `REGIONAL_OFFICER` | Regional Officer (Western) | Maharashtra & Goa; Scrutiny & EVC scheduling |
| **Prof. Anand Vardhan** | `SCRUTINY_CONVENER` | Scrutiny Panel Convener | Clause Scrutiny & Deficiency Reverts |
| **Dr. K. Natarajan** | `EVC_CHAIR` | Chairman, EVC Committee | On-site inspections & report submissions |
| **Justice R. K. Sharma** | `SAC_MEMBER` | Member, Standing Appellate Committee | Quasi-judicial appeals & hearing disposals |
| **Dr. K. Subramanian** | `INSTITUTION_PRINCIPAL`| Principal, Sri Krishna College of Tech | Permanent ID `1-10029381`, cure & proof uploads |

---

## 🎯 Judges' Demo Walkthrough

### 1. Simulating Escalations & Future Dates (Phase 3 Feature)
1. Log in as **Prof. Rajive Kumar** (`SUPER_ADMIN`) or **Dr. Ramesh Unnikrishnan** (`BUREAU_OFFICER`).
2. Navigate to the **Alerts & Escalations Hub** in the sidebar.
3. In the **Statutory Compliance Sentinel** banner:
   - Click **"Run Compliance Sweep Now"** to run an immediate sweep.
   - Use the **Date Simulator** buttons: click **"+30 Days"** or **"+90 Days"** to project into the future.
   - Watch the sweep summary update: applications breach SLA limits, documents shift from `ACTIVE_VALID` $\rightarrow$ `EXPIRING_SOON_90D` $\rightarrow$ `CRITICAL_30D` $\rightarrow$ `EXPIRED`, and undertakings transition to `OVERDUE_ESCALATED`.
   - Inspect the **Notification Delivery Log** subtab to observe outbound emails and SMS alerts recorded by the sentinel.

### 2. Route-Correct Deficiency Cure & Two-Step Verification (Phase 1 & 2 Feature)
1. In the **Applications Processing Desk**, select an application in Scrutiny.
2. Click **"Revert for Deficiency"**, cite an APH clause (e.g. Clause 4.2.1), and submit.
3. Switch persona to **Dr. K. Subramanian** (`INSTITUTION_PRINCIPAL`). Notice the application is flagged under deficiency.
4. Click **"Submit Deficiency Cure"**, upload a PDF proof (handled by `/api/uploads`), and enter response remarks. The status transitions to **`CURED_PENDING_VERIFICATION`**.
5. Switch back to **Dr. M. Sundararajan** (`REGIONAL_OFFICER`). Open the application to find the **Deficiency Cure Verification Desk**:
   - If verified: status transitions to **`CURED_VERIFIED`**, advancing the application to **`RE_SCRUTINY`** (or **`EVC_SCHEDULED`** for EVC-only routes).
   - If rejected: status reverts to **`PENDING_CURE`** with official rejection remarks.

### 3. EVC Inspection & Official Ratification (Phase 1 & 5 Feature)
1. Navigate to **EVC Scheduling & Panel Manager**.
2. Notice the **Section C Awaiting EVC Priority Queue** highlighting New Technical Institutions with high urgency.
3. Schedule an EVC inspection with a 3-member expert panel.
4. Upload an inspection report with deficiency findings and recommended intake. The status changes to **`REPORT_SUBMITTED`**.
5. As Regional Officer / Bureau Adviser, click **"Ratify Inspection Report"** to review the findings and officially ratify the report. The application advances to **`EVC_COMPLETED`**.

### 4. Consolidated Executive Council Dossier & Filtered CSV Extracts (Phase 5 Feature)
1. Navigate to **Regulatory Reports & Scorecard**.
2. Set date-range filters (`startDate` and `endDate`) and click any CSV export button to download server-generated, tenancy-filtered CSV extracts.
3. Click the **"Printable Council Dossier"** subtab.
4. Review the comprehensive statutory dossier:
   - Executive KPI snapshot
   - Applications breakdown by route & stage
   - EVC inspection disposition
   - Time-bound undertakings compliance rate
   - 30-year land lease 90-day expiry matrix
   - Overdue cases requiring statutory Council intervention
   - Regional scorecard
   - Statutory Regulatory Safeguard clause
5. Click **"Print Dossier (PDF)"** to trigger `window.print()` with clean print stylesheets.

### 5. Bottleneck & Workload Analytics (Phase 5 Feature)
1. Navigate to the main **Executive Dashboard**.
2. Under Analytics, click the **"Bottlenecks & Workload View"** toggle.
3. Review:
   - Officer Workload Distribution (active cases per regional/bureau officer)
   - Average Processing Days per Statutory Stage
   - Regional SLA Compliance vs Overdue Case distribution
   - Top 5 Oldest Pending Cases requiring immediate clearance

### 6. Append-Only Audit Trail (Phase 4 Feature)
1. Navigate to **Audit Trail Vault** in the sidebar.
2. Filter events by Action Type (`STAGE_ADVANCE`, `DEFICIENCY_REVERT`, `EVC_REPORT_RATIFIED`, etc.) or Entity Type.
3. Click **"Export Audit CSV"** or **"Export Audit JSON"** to download complete forensic records.

---

## 🌐 External Integration APIs (Section F)

External e-Governance portals, university affiliation systems, and High Court tracking networks integrate via dedicated endpoints:

### 1. Institutional Status Query
```http
GET /api/integration/institutions/{permanentId}
```
**Response:**
```json
{
  "permanentId": "1-10029381",
  "institutionName": "PSG College of Technology",
  "region": "Southern",
  "activeApplication": {
    "applicationNumber": "AICTE-2026-SRO-1002",
    "route": "Scrutiny + EVC",
    "currentStage": "EVC_COMPLETED",
    "daysPending": 12,
    "escalationLevel": "LEVEL_0_NORMAL"
  },
  "complianceSummary": {
    "undertakingsCompliant": 2,
    "undertakingsOverdue": 0,
    "documentsExpired": 0,
    "documentsExpiringSoon": 1
  }
}
```

### 2. External Webhook Dispatcher
```http
POST /api/integration/webhook
Content-Type: application/json

{
  "eventType": "COURT_STAY_ORDER",
  "permanentId": "1-10029381",
  "referenceNumber": "WP-29381-2026",
  "remarks": "Interim stay granted on intake reduction pending writ disposal."
}
```

---

## 🧪 Vitest Unit Test Suite

The test suite thoroughly covers workflow transitions, terminal state locking, SLA escalation calculations, compliance sweep boundaries, alert deduplication, and RBAC permissions.

```bash
# Run all unit tests
npm test
```

### Test Coverage Summary:
- **`src/__tests__/workflowEngine.test.ts` (16 tests):**
  - Blocks all transitions out of terminal `APPROVED` and `REJECTED` stages across all routes.
  - Verifies progression paths across all 5 APH routes.
  - Route-correct deficiency recovery (`RE_SCRUTINY` vs `EVC_SCHEDULED`).
  - SLA status calculations across 0, 1, 7, 8, 14, and 15+ overdue days, including custom AphConfig thresholds.
- **`src/__tests__/rulesEngine.test.ts` (3 tests):**
  - Document status boundaries at 91d, 90d, 31d, 30d, 0d, and -1d.
  - Undertaking overdue escalation only after `dueDate + gracePeriodDays`.
  - Alert deduplication: executing sequential sweeps produces zero duplicate alerts.
- **`src/__tests__/auth.test.ts` (12 tests):**
  - Role permissions matrix (`ALL_PERMISSIONS` vs granular roles).
  - Regional tenancy restrictions (e.g. Southern RO blocked from Western).
  - Institutional ownership tenancy (Principal restricted to own permanentId).
  - JWT session token generation and signature verification.
  - Login rate limiter (blocks on 6th failed attempt within 15-minute window, resets upon success).

---

## ⚖️ Statutory Regulatory Safeguard

> **REGULATORY SAFEGUARD NOTE (APH 2026-27):**  
> In accordance with the AICTE Approval Process Handbook (APH 2026-27), automated workflow notifications, algorithmic compliance sweeps, and SLA escalation tracking are decision-support mechanisms to enforce statutory timelines. They shall **not supplant** the statutory appraisal, inspection, and quasi-judicial authority reserved for the Scrutiny Committee, Expert Visit Committee (EVC), Standing Appellate Committee (SAC), Standing Hearing Committee (SHC), and the sovereign determinations of the Executive Council under the All India Council for Technical Education Act, 1987.
# aicte-approval-system
# aicte-approval-system
