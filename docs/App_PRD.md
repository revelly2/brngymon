# Product Requirements Document (PRD)
## Barangay Health Status Monitoring System (BHSMS)

---

### 1. Executive Summary & Problem Analysis

Primary healthcare at the grassroots level serves as the frontline entry point for essential community services, including immunization, maternal care, and communicable/non-communicable disease prevention[cite: 54]. In pilot rural communities—specifically Barangay Palaquio, Barangay Tabiog, and Barangay Babangcag in Bucay, Abra—health service delivery relies heavily on paper logbooks and manual physical folders[cite: 52, 55].

#### 1.1 Clinical & Operational Challenges
* **Data Redundancy & Attrition:** Paper-based entries result in duplicated patient profiles across separate logbooks, physical degradation of historical cards, and prolonged retrieval times during high-volume triage[cite: 55].
* **Manpower Constraints:** Barangay Health Workers (BHWs) and Rural Health Midwives (RHMs) face high patient-to-worker ratios[cite: 56]. Manual documentation detracts from direct clinical observation and routine follow-ups for high-risk cohorts[cite: 56].
* **Delayed Risk Identification:** The absence of automated clinical thresholds delays the identification of critical cases, such as hypertensive crises, pediatric malnutrition, and high-risk pregnancies[cite: 56, 64].
* **Fragmented Reporting:** Generating summary statistics for local officials and municipal health offices requires manual cross-tallying, leading to reporting lags and compromised data accuracy[cite: 56, 60].

#### 1.2 Conceptual Framework (Input-Process-Output Model)
The system architecture directly operationalizes the Input-Process-Output (IPO) framework established in the baseline capstone study[cite: 57]:

```
+---------------------------------------------------------------------------------------+
|                                     INPUT                                             |
| • User Requirements: Workflows from BHWs, Midwives, and Barangay Officials[cite: 57, 59]   |
| • Clinical Data: Demographics, Vitals, Medical History, Immunizations, Assessments[cite: 57, 59] |
| • Infrastructure: Workstation/PC, Web Browser, Local Area Network, Node/Postgres Server[cite: 57, 59] |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                    PROCESS                                            |
| 1. Data Encoding & Validation (Strict TypeScript/Zod sanitization)[cite: 59]          |
| 2. Centralized Storage (Relational Database schema)[cite: 59]                         |
| 3. Data Processing & Risk Stratification (Vitals flagging, BMI, WHO Z-scores)[cite: 59]|
| 4. Health Status Monitoring (Cohort tracking: Children, Pregnant Women, Adults)[cite: 59]|
| 5. Report Generation & Analytics Engine (Statistical aggregation & dashboards)[cite: 59] |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                    OUTPUT                                             |
| • Centralized, searchable digital health records[cite: 59]                             |
| • Individual clinical summaries, demographic profiles, and statistical reports[cite: 59]|
| • Community risk-level insights (disease clusters, maternal/pediatric risks)[cite: 59]  |
| • Enhanced clinical decision support for primary care interventions[cite: 59]         |
+---------------------------------------------------------------------------------------+
```

#### 1.3 Alignment with Global Goals
* **SDG 3 (Good Health and Well-being):** Improves early detection of acute and chronic illnesses and tracks priority populations (pediatric, maternal, geriatric)[cite: 63].
* **SDG 9 (Industry, Innovation, and Infrastructure):** Modernizes rural barangay health infrastructure using robust digital systems[cite: 63].
* **SDG 11 (Sustainable Cities and Communities):** Strengthens local community resilience through timely local health intelligence[cite: 63].

---

### 2. Project Scope & Delimitations

To maintain engineering feasibility within the rural health center deployment profile, explicit operational boundaries are enforced[cite: 61]:

* **In Scope:**
  * Web-based deployment optimized for local desktop and workstation browsers within the Barangay Health Station (BHS)[cite: 61, 66].
  * Centralized intake and record management for three priority populations: Children, Pregnant Women, and Adults[cite: 61, 62].
  * Vital sign logging with automated clinical threshold calculation and risk-level categorization[cite: 61, 64, 65].
  * Longitudinal Expanded Program on Immunization (EPI) tracking for pediatric cohorts[cite: 61, 66].
  * Maternal health and antenatal visit monitoring[cite: 61, 62].
  * Disease tracking and real-time analytical dashboard generation for local administrative decision-making[cite: 61, 63, 64].
* **Explicit Delimitations:**
  * **No Direct National Integration:** The system will operate as an independent facility-level system and will not interface directly with central DOH national servers or PhilHealth claim portals in this phase[cite: 61].
  * **No Native Mobile App:** Interface access is restricted to responsive web browsers on center workstations[cite: 61, 66].
  * **No Automated Telephony/SMS:** Outbound SMS alert gateways are excluded; appointment follow-ups remain driven by BHW community visits[cite: 61].
  * **No Autonomous Diagnostic AI:** The platform enforces deterministic, rules-based clinical decision support (e.g., standard clinical triage brackets, WHO growth charts) rather than probabilistic machine learning or autonomous diagnostic models[cite: 61].

---

### 3. User Personas & Clinical Access Control

| Role | Operational Context | Primary Responsibilities | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Barangay Health Worker (BHW)**[cite: 62] | Frontline intake at BHS; varying digital literacy. | Resident profiling, vitals acquisition, height/weight measurement, logging routine follow-ups[cite: 57, 62]. | Read/Write: Patient profiles, vitals forms, vaccination logs. Restricted from deleting records or altering clinical diagnoses. |
| **Rural Health Midwife (RHM)**[cite: 62] | Licensed primary care supervisor overseeing maternal/child health. | Antenatal checkups, vaccine administration, triage escalation, diagnostic validation[cite: 62]. | Full Clinical Read/Write: Maternal records, EPI records, clinical consult notes, referral generation. |
| **Barangay Official / Health Committee**[cite: 62] | Barangay Captain / Health Kagawad. | Resource allocation, program planning, evaluating health trends across Puroks[cite: 62]. | Read-Only: Aggregated statistical dashboards, anonymized demographic reports, epidemiologic summaries[cite: 63]. |
| **System Administrator**[cite: 57] | LGU IT Officer. | User provisioning, role-based permissions, system audit log inspection, data backups[cite: 57, 64]. | Full Administrative Access: System configuration, security management, database utilities. |

---

### 4. Functional Requirements & Clinical Modules

#### Module 1: Resident Registration & Demographic Profiling
* **Unique Patient Identifier (UPI):** Automated internal UUID and formatted Barangay Health ID (`BHS-[BarangayCode]-[Year]-[Sequence]`).
* **Demographic Registry:** Complete name, alias, date of birth, biological sex, civil status, sitio/purok residence (e.g., Palaquio, Tabiog, Babangcag), household head linkage, and contact numbers[cite: 55, 57].
* **Deduplication Validation:** Validation check querying `Soundex(LastName) + FirstName + DateOfBirth` prior to record creation to prevent logbook-style record duplication[cite: 55].

#### Module 2: Vitals Intake & Clinical Risk Stratification
* **Biometric Capture:**
  * Systolic & Diastolic Blood Pressure (mmHg)[cite: 64].
  * Pulse Rate (bpm), Respiratory Rate (cpm), Body Temperature (°C)[cite: 64].
  * Height (cm) and Weight (kg) with auto-computed Body Mass Index (BMI).
* **Clinical Decision Support Flags:**
  * *Adult Hemodynamics:*
    * Normal: SBP < 120 and DBP < 80 mmHg.
    * Elevated/Pre-hypertensive: SBP 120–139 or DBP 80–89 mmHg (Yellow Flag).
    * Hypertensive (Stage 1/2): SBP ≥ 140 or DBP ≥ 90 mmHg (Orange Flag).
    * Hypertensive Crisis/Emergency: SBP ≥ 180 or DBP ≥ 120 mmHg (Immediate Red Critical Alert).
  * *Pediatric Growth Monitoring:*
    * Automated calculation of Nutritional Status based on WHO Growth Standards: Normal, Underweight, Severely Underweight, Wasted, or Stunted.
  * *Febrile Illness Alert:* Core temperature ≥ 38.0 °C flags mandatory communicable disease screening (e.g., dengue, respiratory tract infection).

#### Module 3: Maternal Health & Antenatal Monitoring
* **Obstetric Profile:** Gravida, Para, Full-term, Preterm, Abortion, Living children (GPAL / TPAL format).
* **Gestational Age Calculator:** Auto-calculates Estimated Date of Delivery (EDD) and current Gestational Age (weeks) using Naegele’s Rule from the Last Menstrual Period (LMP).
* **Trimester Care Pathways:**
  * Mandatory 4-visit antenatal milestone tracking.
  * Micronutrient supplementation logs (Iron + Folic Acid distribution).
  * High-risk pregnancy flagging: Age < 18 or > 35, multiparity (≥ 5), persistent elevated BP, or history of pre-eclampsia.

#### Module 4: Child Health & Immunization (EPI) Registry
* **Vaccination Lifecycle Tracking:** Tracks standard Expanded Program on Immunization schedules[cite: 66]:
  * At Birth: BCG, Hepatitis B.
  * 6, 10, 14 Weeks: Pentavalent (DTP-HepB-Hib), Oral Polio Vaccine (OPV).
  * 9 & 12 Months: Measles-Rubella (MR), Measles-Mumps-Rubella (MMR).
* **Defaulter Tracking Engine:** Automatically generates a line-list of infants who have missed vaccine doses based on elapsed chronological age, enabling targeted BHW community outreach[cite: 61, 62].

#### Module 5: Adult Health & Disease Surveillance
* **Chronic Disease Monitoring:** Longitudinal tracking for adult lifestyle diseases, specifically Hypertension and Type 2 Diabetes Mellitus[cite: 62, 64].
* **Infectious Disease Surveillance:** Weekly aggregation and incident logging for reportable conditions (e.g., Acute Respiratory Infections, Acute Gastroenteritis, Suspected Dengue, Tuberculosis symptoms)[cite: 64].
* **Follow-up Scheduler:** Flags patients overdue for maintenance blood pressure checks or chronic care assessments.

#### Module 6: Executive Dashboard & Automated Reporting Engine
* **Visual Analytical Dashboard:** Real-time summary visualizations depicting total registered residents, active pregnancies, fully immunized children (FIC), and prevalence of communicable vs. non-communicable diseases[cite: 63, 64].
* **Automated Report Generation:**
  * *Individual Health Summary:* Printable one-page clinical abstract for hospital or RHU referral[cite: 59].
  * *Monthly Barangay Health Profiles:* Statistical tables segmented by Purok for Barangay Council review[cite: 59, 62].
  * *Quarterly Morbidity & Coverage Tally:* Formatted aggregate reports reducing manual documentation overhead[cite: 59, 62].

---

### 5. Technical Architecture & Implementation Specifications

To modernize the stack beyond legacy procedural scripting while respecting the web-based constraints[cite: 46, 61], the system is architected as an end-to-end TypeScript application:

```
[ Client Layer (React 18 + TS) ]
        │  • UI: Tailwind CSS + Accessible Components (Radix UI)
        │  • State: TanStack Query (Server State) + React Hook Form + Zod
        │  • Role-Guarded UI Router
        │
   HTTPS REST API (JSON Payloads)
        │
        ▼
[ Application Layer (Node.js LTS / Express + TS) ]
        │  • Express Router & Zod Payload Validation Middleware
        │  • RBAC & Session/JWT Authentication Middleware
        │  • Triage & Clinical Decision Support Service
        │  • Reporting & Statistical Aggregation Service
        │
   Data Access```markdown
# Product Requirements Document (PRD)
## Barangay Health Status Monitoring System (BHSMS)

---

### 1. Executive Summary & Problem Analysis

Primary healthcare at the grassroots level serves as the frontline entry point for essential community services, including immunization, maternal care, and communicable/non-communicable disease prevention[cite: 54]. In pilot rural communities—specifically Barangay Palaquio, Barangay Tabiog, and Barangay Babangcag in Bucay, Abra—health service delivery relies heavily on paper logbooks and manual physical folders[cite: 52, 55].

#### 1.1 Clinical & Operational Challenges
* **Data Redundancy & Attrition:** Paper-based entries result in duplicated patient profiles across separate logbooks, physical degradation of historical cards, and prolonged retrieval times during high-volume triage[cite: 55].
* **Manpower Constraints:** Barangay Health Workers (BHWs) and Rural Health Midwives (RHMs) face high patient-to-worker ratios[cite: 56]. Manual documentation detracts from direct clinical observation and routine follow-ups for high-risk cohorts[cite: 56].
* **Delayed Risk Identification:** The absence of automated clinical thresholds delays the identification of critical cases, such as hypertensive crises, pediatric malnutrition, and high-risk pregnancies[cite: 56, 64].
* **Fragmented Reporting:** Generating summary statistics for local officials and municipal health offices requires manual cross-tallying, leading to reporting lags and compromised data accuracy[cite: 56, 60].

#### 1.2 Conceptual Framework (Input-Process-Output Model)
The system architecture directly operationalizes the Input-Process-Output (IPO) framework established in the baseline capstone study[cite: 57]:

```
+---------------------------------------------------------------------------------------+
|                                     INPUT                                             |
| • User Requirements: Workflows from BHWs, Midwives, and Barangay Officials[cite: 57, 59]   |
| • Clinical Data: Demographics, Vitals, Medical History, Immunizations, Assessments[cite: 57, 59] |
| • Infrastructure: Workstation/PC, Web Browser, Local Area Network, Node/Postgres Server[cite: 57, 59] |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                    PROCESS                                            |
| 1. Data Encoding & Validation (Strict TypeScript/Zod sanitization)[cite: 59]          |
| 2. Centralized Storage (Relational Database schema)[cite: 59]                         |
| 3. Data Processing & Risk Stratification (Vitals flagging, BMI, WHO Z-scores)[cite: 59]|
| 4. Health Status Monitoring (Cohort tracking: Children, Pregnant Women, Adults)[cite: 59]|
| 5. Report Generation & Analytics Engine (Statistical aggregation & dashboards)[cite: 59] |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                                    OUTPUT                                             |
| • Centralized, searchable digital health records[cite: 59]                             |
| • Individual clinical summaries, demographic profiles, and statistical reports[cite: 59]|
| • Community risk-level insights (disease clusters, maternal/pediatric risks)[cite: 59]  |
| • Enhanced clinical decision support for primary care interventions[cite: 59]         |
+---------------------------------------------------------------------------------------+
```

#### 1.3 Alignment with Global Goals
* **SDG 3 (Good Health and Well-being):** Improves early detection of acute and chronic illnesses and tracks priority populations (pediatric, maternal, geriatric)[cite: 63].
* **SDG 9 (Industry, Innovation, and Infrastructure):** Modernizes rural barangay health infrastructure using robust digital systems[cite: 63].
* **SDG 11 (Sustainable Cities and Communities):** Strengthens local community resilience through timely local health intelligence[cite: 63].

---

### 2. Project Scope & Delimitations

To maintain engineering feasibility within the rural health center deployment profile, explicit operational boundaries are enforced[cite: 61]:

* **In Scope:**
  * Web-based deployment optimized for local desktop and workstation browsers within the Barangay Health Station (BHS)[cite: 61, 66].
  * Centralized intake and record management for three priority populations: Children, Pregnant Women, and Adults[cite: 61, 62].
  * Vital sign logging with automated clinical threshold calculation and risk-level categorization[cite: 61, 64, 65].
  * Longitudinal Expanded Program on Immunization (EPI) tracking for pediatric cohorts[cite: 61, 66].
  * Maternal health and antenatal visit monitoring[cite: 61, 62].
  * Disease tracking and real-time analytical dashboard generation for local administrative decision-making[cite: 61, 63, 64].
* **Explicit Delimitations:**
  * **No Direct National Integration:** The system will operate as an independent facility-level system and will not interface directly with central DOH national servers or PhilHealth claim portals in this phase[cite: 61].
  * **No Native Mobile App:** Interface access is restricted to responsive web browsers on center workstations[cite: 61, 66].
  * **No Automated Telephony/SMS:** Outbound SMS alert gateways are excluded; appointment follow-ups remain driven by BHW community visits[cite: 61].
  * **No Autonomous Diagnostic AI:** The platform enforces deterministic, rules-based clinical decision support (e.g., standard clinical triage brackets, WHO growth charts) rather than probabilistic machine learning or autonomous diagnostic models[cite: 61].

---

### 3. User Personas & Clinical Access Control

| Role | Operational Context | Primary Responsibilities | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Barangay Health Worker (BHW)**[cite: 62] | Frontline intake at BHS; varying digital literacy. | Resident profiling, vitals acquisition, height/weight measurement, logging routine follow-ups[cite: 57, 62]. | Read/Write: Patient profiles, vitals forms, vaccination logs. Restricted from deleting records or altering clinical diagnoses. |
| **Rural Health Midwife (RHM)**[cite: 62] | Licensed primary care supervisor overseeing maternal/child health. | Antenatal checkups, vaccine administration, triage escalation, diagnostic validation[cite: 62]. | Full Clinical Read/Write: Maternal records, EPI records, clinical consult notes, referral generation. |
| **Barangay Official / Health Committee**[cite: 62] | Barangay Captain / Health Kagawad. | Resource allocation, program planning, evaluating health trends across Puroks[cite: 62]. | Read-Only: Aggregated statistical dashboards, anonymized demographic reports, epidemiologic summaries[cite: 63]. |
| **System Administrator**[cite: 57] | LGU IT Officer. | User provisioning, role-based permissions, system audit log inspection, data backups[cite: 57, 64]. | Full Administrative Access: System configuration, security management, database utilities. |

---

### 4. Functional Requirements & Clinical Modules

#### Module 1: Resident Registration & Demographic Profiling
* **Unique Patient Identifier (UPI):** Automated internal UUID and formatted Barangay Health ID (`BHS-[BarangayCode]-[Year]-[Sequence]`).
* **Demographic Registry:** Complete name, alias, date of birth, biological sex, civil status, sitio/purok residence (e.g., Palaquio, Tabiog, Babangcag), household head linkage, and contact numbers[cite: 55, 57].
* **Deduplication Validation:** Validation check querying `Soundex(LastName) + FirstName + DateOfBirth` prior to record creation to prevent logbook-style record duplication[cite: 55].

#### Module 2: Vitals Intake & Clinical Risk Stratification
* **Biometric Capture:**
  * Systolic & Diastolic Blood Pressure (mmHg)[cite: 64].
  * Pulse Rate (bpm), Respiratory Rate (cpm), Body Temperature (°C)[cite: 64].
  * Height (cm) and Weight (kg) with auto-computed Body Mass Index (BMI).
* **Clinical Decision Support Flags:**
  * *Adult Hemodynamics:*
    * Normal: SBP < 120 and DBP < 80 mmHg.
    * Elevated/Pre-hypertensive: SBP 120–139 or DBP 80–89 mmHg (Yellow Flag).
    * Hypertensive (Stage 1/2): SBP >= 140 or DBP >= 90 mmHg (Orange Flag).
    * Hypertensive Crisis/Emergency: SBP >= 180 or DBP >= 120 mmHg (Immediate Red Critical Alert).
  * *Pediatric Growth Monitoring:*
    * Automated calculation of Nutritional Status based on WHO Growth Standards: Normal, Underweight, Severely Underweight, Wasted, or Stunted.
  * *Febrile Illness Alert:* Core temperature >= 38.0 °C flags mandatory communicable disease screening (e.g., dengue, acute respiratory infection).

#### Module 3: Maternal Health & Antenatal Monitoring
* **Obstetric Profile:** Gravida, Para, Full-term, Preterm, Abortion, Living children (GPAL / TPAL format).
* **Gestational Age Calculator:** Auto-calculates Estimated Date of Delivery (EDD) and current Gestational Age (weeks) using Naegele’s Rule from the Last Menstrual Period (LMP).
* **Trimester Care Pathways:**
  * Mandatory 4-visit antenatal milestone tracking.
  * Micronutrient supplementation logs (Iron + Folic Acid distribution).
  * High-risk pregnancy flagging: Age < 18 or > 35, multiparity (>= 5), persistent elevated BP, or history of pre-eclampsia.

#### Module 4: Child Health & Immunization (EPI) Registry
* **Vaccination Lifecycle Tracking:** Tracks standard Expanded Program on Immunization schedules[cite: 66]:
  * At Birth: BCG, Hepatitis B.
  * 6, 10, 14 Weeks: Pentavalent (DTP-HepB-Hib), Oral Polio Vaccine (OPV).
  * 9 & 12 Months: Measles-Rubella (MR), Measles-Mumps-Rubella (MMR).
* **Defaulter Tracking Engine:** Automatically generates a line-list of infants who have missed vaccine doses based on elapsed chronological age, enabling targeted BHW community outreach[cite: 61, 62].

#### Module 5: Adult Health & Disease Surveillance
* **Chronic Disease Monitoring:** Longitudinal tracking for adult lifestyle diseases, specifically Hypertension and Type 2 Diabetes Mellitus[cite: 62, 64].
* **Infectious Disease Surveillance:** Weekly aggregation and incident logging for reportable conditions (e.g., Acute Respiratory Infections, Acute Gastroenteritis, Suspected Dengue, Tuberculosis symptoms)[cite: 64].
* **Follow-up Scheduler:** Flags patients overdue for maintenance blood pressure checks or chronic care assessments.

#### Module 6: Executive Dashboard & Automated Reporting Engine
* **Visual Analytical Dashboard:** Real-time summary visualizations depicting total registered residents, active pregnancies, fully immunized children (FIC), and prevalence of communicable vs. non-communicable diseases[cite: 63, 64].
* **Automated Report Generation:**
  * *Individual Health Summary:* Printable one-page clinical abstract for hospital or RHU referral[cite: 59].
  * *Monthly Barangay Health Profiles:* Statistical tables segmented by Purok for Barangay Council review[cite: 59, 62].
  * *Quarterly Morbidity & Coverage Tally:* Formatted aggregate reports reducing manual documentation overhead[cite: 59, 62].

---

### 5. Technical Architecture & Implementation Specifications

```
[ Client Layer (React 18 + TS) ]
        │  • UI: Tailwind CSS + Accessible Components (Radix UI)
        │  • State: TanStack Query (Server State) + React Hook Form + Zod
        │  • Role-Guarded UI Router
        │
   HTTPS REST API (JSON Payloads)
        │
        ▼
[ Application Layer (Node.js LTS / Express + TS) ]
        │  • Express Router & Zod Payload Validation Middleware
        │  • RBAC & Session/JWT Authentication Middleware
        │  • Triage & Clinical Decision Support Service
        │  • Reporting & Statistical Aggregation Service
        │
   Data Access Layer (Prisma ORM / Type-Safe SQL)
        │
        ▼
[ Data Layer (PostgreSQL 16) ]
           • Relational Constraints, Indexed Demographics
           • Immutable Audit Trail Logs
```

#### 5.1 Frontend Architecture
* **Core Framework:** React 18+ with TypeScript in strict mode.
* **Component System:** Tailwind CSS for design efficiency, configured with high-contrast UI tokens to ensure readability on standard-issue health center displays.
* **Client Validation:** `React Hook Form` integrated with `Zod` schemas, preventing form submission if vital signs fall outside physiologically plausible limits (e.g., rejecting systolic pressure > 300 or < 40 mmHg).

#### 5.2 Backend Architecture
* **Runtime & Framework:** Node.js (v20+ LTS) running Express or NestJS with modular TypeScript services.
* **Security & Auth:** Secure HTTP-only cookies containing signed JWTs. Role-Based Access Control (RBAC) enforced on every API route via a specialized middleware guard (`requireRole(['ADMIN', 'MIDWIFE', 'BHW'])`).
* **Database & Persistence:** PostgreSQL 16 managed via Prisma ORM for type-safe schema migrations.

#### 5.3 Core TypeScript Schemas & Data Models

```typescript
import { z } from 'zod';

export const ResidentSchema = z.object({
  id: z.string().uuid(),
  barangayId: z.enum(['PALAQUIO', 'TABIOG', 'BABANGCAG']),
  purok: z.string().min(1),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  biologicalSex: z.enum(['MALE', 'FEMALE']),
  isPregnant: z.boolean().default(false),
  householdHeadId: z.string().uuid().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const VitalSignsSchema = z.object({
  id: z.string().uuid(),
  residentId: z.string().uuid(),
  recordedByUserId: z.string().uuid(),
  systolicBp: z.number().int().min(40).max(300),
  diastolicBp: z.number().int().min(30).max(200),
  heartRateBpm: z.number().int().min(30).max(250),
  respiratoryRateCpm: z.number().int().min(8).max(80),
  temperatureCelsius: z.number().min(30.0).max(45.0),
  weightKg: z.number().positive().max(300),
  heightCm: z.number().positive().max(250),
  recordedAt: z.date(),
});

export type TriageSeverity = 'NORMAL' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface ClinicalEvaluation {
  severity: TriageSeverity;
  clinicalFlags: string[];
  referralRecommended: boolean;
}

export function evaluateHemodynamics(sbp: number, dbp: number): ClinicalEvaluation {
  if (sbp >= 180 || dbp >= 120) {
    return {
      severity: 'CRITICAL',
      clinicalFlags: ['HYPERTENSIVE_CRISIS_EMERGENCY'],
      referralRecommended: true,
    };
  }
  if (sbp >= 140 || dbp >= 90) {
    return {
      severity: 'HIGH',
      clinicalFlags: ['STAGE_2_HYPERTENSION'],
      referralRecommended: false,
    };
  }
  if (sbp >= 120 || dbp >= 80) {
    return {
      severity: 'ELEVATED',
      clinicalFlags: ['PRE_HYPERTENSION'],
      referralRecommended: false,
    };
  }
  return {
    severity: 'NORMAL',
    clinicalFlags: [],
    referralRecommended: false,
  };
}
```

---

### 6. Data Privacy, Compliance & Security

Adhering strictly to Republic Act No. 10173 (Philippine Data Privacy Act of 2012) and primary health informatics governance[cite: 64]:

* **Data Minimization:** Only demographic and biometric data relevant to official primary care tracking is captured[cite: 57].
* **Consent Mechanisms:** The resident profiling module requires explicit documentation of informed consent (signed or witnessed physical consent cross-referenced in system metadata).
* **Access Control:** System partitions views so that non-clinical administrators (e.g., Barangay Officials) only see de-identified statistical aggregates, preventing unauthorized disclosure of individual health statuses[cite: 64].
* **Audit Logging:** Every query, creation, update, or export involving Protected Health Information (PHI) writes an immutable record to an `AuditLog` table containing `timestamp`, `userId`, `actionType`, and `recordId`[cite: 64].

---

### 7. SDLC Methodology & Phased Implementation (Prototype Model)

Following the academic guide, development utilizes the iterative **Prototype Model** across 6 operational phases[cite: 68, 70]:

```
  [1. Requirements Gathering]
               │
               ▼
       [2. Quick Design]
               │
               ▼
      [3. Build Prototype] <───────────┐
               │                       │ (Iterative
               ▼                       │  Refinement)
      [4. User Evaluation]             │
               │                       │
               ▼                       │
      [5. Refine Prototype] ───────────┘
               │
               ▼
   [6. Implement and Deploy]
```

#### Phase 1: Requirements Validation & Data Modeling
* Conduct technical and clinical workflow walkthroughs with BHWs and Midwives[cite: 69, 73].
* Finalize normalized relational database schema (Patients, Households, Vitals, Vaccines, Encounters).
* Define system boundaries and baseline clinical range parameters[cite: 69].

#### Phase 2: Core Infrastructure & Patient Registry Prototype
* Scaffold Node.js TypeScript API and React Single-Page Application.
* Implement authentication, RBAC, and demographic intake forms.
* Setup automated deduplication logic.
* *Milestone Gate:* BHW can register 20 mock residents without record collisions or validation bypasses.

#### Phase 3: Clinical Vitals & Program Tracking Prototype
* Implement vitals intake forms with automated BMI and hemodynamic calculation.
* Build the Maternal Health module (EDD calculation via Naegele’s Rule, 4-visit checklist).
* Build the Pediatric EPI tracker with immunization scheduling logic[cite: 66].
* *Milestone Gate:* System accurately flags hypertensive crisis states and computes missing vaccine schedules based on infant age.

#### Phase 4: Analytics Dashboard & Automated Reporting Engine
* Develop visualization views for morbidity trends and program coverage[cite: 63].
* Implement server-side report compilation producing standard individual and summary sheets[cite: 59].
* *Milestone Gate:* Generated summary reports match manual paper tallies across test datasets with 100% precision.

#### Phase 5: Field User Evaluation & Iterative Refinement
* Deploy prototype workstations at the test barangays (Palaquio, Tabiog, Babangcag)[cite: 55].
* Execute structured User Acceptance Testing (UAT) with designated end users[cite: 69].
* Apply UI/UX adjustments based on frontline feedback (e.g., optimizing font sizing, simplifying input tab orders)[cite: 70].

#### Phase 6: Final Deployment & System Operationalization
* Install stable builds on local health center computers[cite: 70].
* Conduct operational training for BHWs and Midwives[cite: 70].
* Transition legacy logbook entry workflows to parallel digital monitoring[cite: 70].

---

### 8. System Evaluation & Quality Assurance Metrics

To ensure alignment with the evaluation criteria in the reference study, the deployed system will be evaluated using a **Purposive Sampling** strategy with **N = 10 primary respondents** composed of Barangay Health Workers and Midwives[cite: 72]:

#### 8.1 Evaluation Criteria
1. **Effectiveness & Functionality:** Verification that all core modules (registration, vitals, EPI, maternal tracking, reports) operate reliably without software crashes or calculation faults[cite: 60, 69].
2. **Efficiency:** Measurable reduction in time required to encode patient vitals and compile monthly reports compared to the manual paper baseline[cite: 60, 64].
3. **User-Friendliness (Usability):** Ease of navigation, readability, and task completion by workers with minimal prior computer experience[cite: 60, 69].
4. **Reliability & Accuracy:** Correctness of stored records, persistence of data across sessions, and accuracy of automated clinical indicator flags[cite: 65, 69].

#### 8.2 Quantitative Scoring & Interpretation Matrix
User evaluation feedback will be captured via a structured 5-point Likert scale instrument[cite: 73, 74]:

$$\text{Weighted Mean} = \frac{\sum (\text{Scale Score} \times \text{Response Count})}{\text{Total Respondents}}$$

The resulting composite means will be classified using the paper's standardized scoring thresholds[cite: 74]:

| Mean Range | Descriptive Rating[cite: 74] | Clinical & Engineering Action |
| :--- | :--- | :--- |
| **4.20 - 5.00** | **Very Good**[cite: 74] | System meets operational standard; clear for full facility deployment. |
| **3.40 - 4.19** | **Good**[cite: 74] | Acceptable baseline; prioritize minor UI/UX adjustments during sprint cycles. |
| **2.60 - 3.39** | **Moderate**[cite: 74] | Requires focused workflow refinements before signing off on deployment. |
| **1.80 - 2.59** | **Poor**[cite: 74] | Module fails acceptance gate; requires structural redesign and re-testing. |
| **1.00 - 1.79** | **Very Poor**[cite: 74] | Immediate critical escalation; core software architecture requires overhaul. |
```