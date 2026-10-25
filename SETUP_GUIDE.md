# 🚀 AICTE Approval System - Quick Setup & Run Guide

This guide will help you install, configure, and run the **Integrated AICTE Approval Workflow Automation & Compliance Monitoring System** on your local machine in under 5 minutes.

---

## 📋 System Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.18.0 or higher (Node 20+ recommended)
  - Verify with: `node -v`
- **npm**: v9 or higher
  - Verify with: `npm -v`
- **Git** (optional, if cloning via repo)

---

## ⚡ 5-Step Quickstart

### Step 1: Open the Project Directory
```bash
cd aicte-approval-system
```

---

### Step 2: Configure Environment Variables (`.env`)
Create a file named `.env` in the root folder (or copy from `.env.example`):

```bash
cp .env.example .env
```

Your `.env` should look like this:
```env
AUTH_SECRET="aicte_super_secret_jwt_key_2026_aph_secure_token_phrase_min_32_chars"
CRON_SECRET="aicte_cron_sentinel_secret_key_2026_secure"
NEXT_PUBLIC_DEMO_MODE=true
DATABASE_URL="file:./dev.db"
PORT=3001
```

> **Note:**
> - `PORT=3001` allows this project to run concurrently without colliding if you or your teammate are running another dashboard on port `3000`.
> - `NEXT_PUBLIC_DEMO_MODE=true` enables the 1-click evaluation persona switcher in the header for easy testing.

---

### Step 3: Install Dependencies
Install all required packages (using `--legacy-peer-deps` to handle Next.js 16 peer dependencies):

```bash
npm install --legacy-peer-deps
```

---

### Step 4: Initialize the SQLite Database & Seed Data
Push the Prisma schema to generate the local SQLite database and populate it with relative date demo records:

```bash
# 1. Push schema and generate Prisma client
npx prisma db push

# 2. Run the dynamic seed script
npx tsx prisma/seed.ts
```

*(You will see a green confirmation that demo users, applications, EVC panels, undertakings, land leases, and initial compliance sweeps have been successfully seeded).*

---

### Step 5: Start the Application

#### Development Mode:
```bash
npm run dev
```

#### Production Mode (Optional):
```bash
npm run build
npm start
```

Open your browser and navigate to:
👉 **`http://localhost:3001`**

---

## 🔑 Login & Demo Personas

When `NEXT_PUBLIC_DEMO_MODE=true`, you can either click any persona button on the **LoginPage** or use the **quick-switcher dropdown** in the top navigation bar.

All passwords are: **`password123`**

| Role | Persona Name | Email | Jurisdiction / Access |
| :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Prof. Rajive Kumar | `member.secretary@aicte.gov.in` | Member Secretary, Universal Nationwide Access, Council Overrides |
| **`BUREAU_OFFICER`** | Dr. Ramesh Unnikrishnan | `bureau.approval@aicte.gov.in` | Approval Bureau HQ, SLA & Timeline Configurator |
| **`REGIONAL_OFFICER`** | Dr. M. Sundararajan | `ro.southern@aicte.gov.in` | Southern Region (TN & Puducherry), Scrutiny & EVC Manager |
| **`REGIONAL_OFFICER`** | Dr. Sunita Deshmukh | `ro.western@aicte.gov.in` | Western Region (Maharashtra & Goa) |
| **`SCRUTINY_CONVENER`** | Prof. Anand Vardhan | `scrutiny.convener@aicte.gov.in` | Clause Scrutiny & Deficiency Reverts |
| **`EVC_CHAIR`** | Dr. K. Natarajan | `evc.chair@aicte.gov.in` | Expert Visit Committee, On-Site Inspection & Report Submission |
| **`SAC_MEMBER`** | Justice R. K. Sharma | `sac.appellate@aicte.gov.in` | Standing Appellate Committee, Quasi-Judicial Hearings |
| **`INSTITUTION_PRINCIPAL`** | Dr. K. Subramanian | `principal@psgtech.edu` | PSG College of Technology (`1-10029381`), Proof Uploads |

---

## 🎯 What to Demo & Test (Judge Highlights)

1. **Compliance Sweep & Date Simulator (SLA Escalations):**
   - Log in as **Member Secretary** or **Bureau Officer**.
   - Go to **Alerts & Escalations Hub** in the sidebar.
   - Click **"Run Compliance Sweep Now"** to run an immediate regulatory check.
   - Click the **"+30 Days"** or **"+90 Days"** simulation buttons to watch cases age in real-time, escalating through Level 1 (RO), Level 2 (Bureau), and Level 3 (Council), while document lease validities turn into critical notices.
   - Check the **Notification Delivery Log** subtab to see outbound email & SMS alerts logged by the sentinel.

2. **Route-Correct Deficiency Revert & Cure Flow:**
   - Log in as **Regional Officer** or **Scrutiny Convener**.
   - Open an application and click **"Revert for Deficiency"** with an APH clause citation.
   - Switch persona to **Institution Principal** (`principal@psgtech.edu`).
   - Open the application, upload a PDF proof (handled by the real file upload system), and click **"Submit Cure"** $\rightarrow$ status becomes `CURED_PENDING_VERIFICATION`.
   - Switch back to **Regional Officer** $\rightarrow$ verify/ratify the cure $\rightarrow$ application correctly resumes at `RE_SCRUTINY` (or `EVC_SCHEDULED` for EVC-only routes).

3. **EVC Priority Queue & Report Ratification:**
   - Go to **EVC Scheduling & Panel Manager**.
   - Section C priority queue highlights **New Technical Institutions**.
   - Schedule an inspection, upload a report $\rightarrow$ status becomes `REPORT_SUBMITTED`.
   - Click **"Ratify Inspection Report"** as Regional Officer $\rightarrow$ ratifies report and advances application to `EVC_COMPLETED`.

4. **Printable Executive Council Dossier:**
   - Go to **Regulatory Reports & Scorecard**.
   - Click the **"Printable Council Dossier"** subtab.
   - Review the complete statutory briefing: KPI snapshot, route breakdown, 30-year lease expiry matrix, overdue cases, regional scorecard, and statutory safeguard clause.
   - Click **"Print Dossier (PDF)"** to trigger a clean A4 print preview.

5. **Bottleneck & Workload Analytics:**
   - On the main **Executive Dashboard**, toggle to **"Bottlenecks & Workload View"** to inspect officer workload distribution, average stage ageing, and oldest pending cases.

6. **Audit Trail Vault:**
   - Go to **Audit Trail Vault** in the sidebar to view forensic records, filter by action type, or export full audit logs as JSON/CSV.

---

## 🧪 Running Automated Unit Tests

The project includes 31 unit tests covering workflow transitions, terminal state locking, SLA thresholds, sweep boundaries, alert deduplication, and role permissions.

```bash
npm test
```

Expected output:
```
 ✓ src/__tests__/workflowEngine.test.ts (16 tests)
 ✓ src/__tests__/rulesEngine.test.ts (3 tests)
 ✓ src/__tests__/auth.test.ts (12 tests)
 Test Files  3 passed (3)
      Tests  31 passed (31)
```

---

## 🛠️ Common Troubleshooting

- **Port in use?**
  - If port `3001` is already in use, change `PORT=3002` in `.env` and run `npm run dev -- -p 3002`.
- **Database reset needed?**
  - To wipe and re-seed clean data anytime:
    ```bash
    npx prisma db push --force-reset
    npx tsx prisma/seed.ts
    ```
- **Typecheck test:**
  - Verify with zero TypeScript errors:
    ```bash
    npx tsc --noEmit
    ```
