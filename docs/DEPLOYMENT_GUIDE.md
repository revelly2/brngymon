# Barangay Health Status Monitoring System (BHSMS)
## Phase 6 Facility Deployment & Operationalization Guide
**Target Pilot Deployments:** Barangay Palaquio, Barangay Tabiog, and Barangay Babangcag (Municipality of Bucay, Abra)  
**System Version:** 1.1.0 Production Release  
**BaaS / Database:** Supabase (PostgreSQL 16 with Row-Level Security)  

---

### 1. Workstation & Environmental Prerequisites

* **Hardware Profile:** Standard-issue LGU desktop or laptop PC (Minimum 4 GB RAM, Dual-core CPU, 128 GB Storage).
* **Operating System:** Windows 10/11 or Ubuntu LTS.
* **Web Browser:** Google Chrome, Microsoft Edge, or Mozilla Firefox (latest stable release).
* **Network Connectivity:** Compatible with offline-first operations. Cellular/LAN connectivity required only during periodic Supabase cloud synchronization.

---

### 2. Installation & Server Initialization

#### 2.1 Clone & Install Dependencies
```bash
git clone <repository_url> "Barangay Health Monitoring"
cd "Barangay Health Monitoring"
npm install
```

#### 2.2 Configure Environment Variables
Verify `.env.local` exists in the project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://jvvpuzqgwqzqdzmojxlu.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_eoSqhfZtQA8jUnKr3XJQag_SRLYK1tr
```

#### 2.3 Execute Database Migrations
Run the SQL migration in the Supabase SQL editor:
* File: `supabase/migrations/20261009000000_phase1_initial_schema.sql`
* This creates the 9 required tables, custom enums, Soundex indices, and Row-Level Security policies.

#### 2.4 Launch Local Workstation Server
To launch the production server:
```bash
npm run build
npm start
```
The workstation interface is accessible locally at `http://localhost:3000`.

---

### 3. Daily Standard Operating Procedures (SOP) for BHWs & Midwives

1. **Morning Resident Intake:**
   * Before writing into physical cards, search the patient in the **Resident Registry** (`/residents`) using Surname or UPI.
   * If not registered, navigate to **New Intake** (`/residents/register`). Ensure informed consent under RA 10173 is acknowledged.
2. **Clinical Biometric Acquisition & Triage:**
   * Record blood pressure, heart rate, temperature, weight, and height in the **Vitals Log** (`/vitals`).
   * If blood pressure meets $\text{SBP} \ge 180$ or $\text{DBP} \ge 120\text{ mmHg}$, the system raises an immediate `CRITICAL` alert. Print the **1-Page Clinical Referral Abstract** (`/reports/referral`) and direct the patient to the RHU or District Hospital.
3. **Maternal Care Pathways:**
   * For pregnant mothers, enter LMP in **Maternal Care** (`/maternal`) to auto-compute the Estimated Date of Delivery via Naegele’s Rule.
   * Complete the 4-visit antenatal checklist and record micronutrient distribution (Iron + Folic Acid).
4. **Pediatric EPI Immunization Defaulter Outreach:**
   * Review the **Child EPI** (`/immunizations`) Defaulter Line-List every Monday morning.
   * Conduct targeted community visits in respective Puroks for infants overdue for vaccines.
5. **End-of-Day Backup & Data Governance:**
   * Access **Operations** (`/operations`) and click **Export Facility Backup** to save an encrypted daily backup bundle.

---

### 4. 4-Week Parallel Logbook Transition Protocol

| Timeline | Operational Phase | Health Worker Directives |
| :--- | :--- | :--- |
| **Week 1** | **Dual Entry (Paper Primary)** | Retain standard paper logbook entries. BHW encodes identical demographic profiles into BHSMS at the end of each clinic day. |
| **Week 2** | **Parallel Clinical Triage** | BHW uses the BHSMS triage simulator to compute hemodynamic risk and BMI. Rural Health Midwife validates flagged cases against manual calculations. |
| **Week 3** | **Digital-First Operations** | BHSMS workstation becomes the primary intake point. Paper logbooks serve only as a secondary confirmation tally. |
| **Week 4** | **Paperless Operations & MHO Submission** | Monthly Barangay Health Profile and FHSIS morbidity statistics generated directly from the **Analytics Dashboard** (`/analytics`) for Barangay Council and MHO submission. |

---

### 5. Automated Test Suite Execution

To execute the complete regression test suite across all 6 project phases:
```bash
npx tsx tests/phase1_validation.test.ts
npx tsx tests/phase2_validation.test.ts
npx tsx tests/phase3_validation.test.ts
npx tsx tests/phase4_validation.test.ts
npx tsx tests/phase5_validation.test.ts
npx tsx tests/phase6_validation.test.ts
```
Expected result: **141/141 Passing Tests**.
