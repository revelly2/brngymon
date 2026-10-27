# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary Frontline Operators:** Barangay Health Workers (BHWs) conducting rapid community intake, demographic registry, and baseline vitals collection at rural Barangay Health Stations (Palaquio, Tabiog, Babangcag) under bandwidth-constrained conditions.
- **Clinical Providers:** Rural Health Midwives (RHMs / Nurses) and Municipal Health Officers (MHO Doctors) managing maternal and child health (MCH), antenatal tracking, Expanded Program on Immunization (EPI), and clinical referral triage.
- **System & Administrative Officers:** Municipal IT Administrators managing role-based access control (RBAC), Supabase Cloud Storage sync telemetry, and automated backup snapshots.
- **LGU Executive Viewers:** Barangay Captains and Municipal Health Executives reviewing read-only epidemiological surveillance and consolidated DOH reporting indicators.

## Product Purpose

The Barangay Health Status Monitoring System (BHSMS) is an offline-first, clinical-grade primary healthcare workstation designed for Philippine local government units (LGUs). It streamlines frontline community triage, secures patient health records under Republic Act No. 10173 (Data Privacy Act of 2012), and automates health reporting to eliminate manual paperwork bottlenecks between rural barangay health stations and municipal health offices.

## Positioning

Unlike generic electronic medical records (EMRs) or hospital information systems that assume continuous high-speed internet and desktop facilities, BHSMS is specifically architected for Philippine rural primary care stations: it pairs seamless offline-first local caching with bidirectional Supabase cloud synchronization, embeds Department of Health (DOH) Field Health Services Information System (FHSIS) data structures, and enforces role-based separation of duties directly aligned with LGU operational realities.

## Operating Context

- **Deployment Stations:** Barangay Palaquio BHS, Barangay Tabiog BHS / RHU, Barangay Babangcag BHS, and the Bucay Municipal Health Office (MHO).
- **Physical Environment:** Rural community health stations and mobile house-to-house outreach with intermittent power, low-spec laptop/tablet workstations, and cellular connectivity dead zones.
- **Regulatory Framework:** Republic Act No. 10173 (Data Privacy Act of 2012), Department of Health (DOH) FHSIS standards, PhilHealth Konsulta primary care benefit guidelines, and national Expanded Program on Immunization (EPI) schedules.

## Capabilities and Constraints

- **Offline-First Resilience:** Zero-latency demographic and vital record intake during complete internet outages; automatic queuing and batch sync to Supabase storage upon connectivity restoration.
- **Role-Based Access Control (RBAC):** Strict least-privilege partitioning (BHW intake, Midwife/Nurse clinical records, Doctor diagnosis/triage, LGU executive aggregate viewer, IT Admin system maintenance).
- **Audit Separation & Self-Protection:** Administrative operators are barred from modifying, deactivating, or deleting their own active operational records to preserve forensic accountability.
- **Storage Quota & Telemetry:** Real-time tracking of Supabase Cloud Storage consumption (1.00 GB tier) spanning system backups (`bhsms-backups`), clinical documents (`clinical-documents`), and DOH reports (`fhsis-reports`).
- **Data Privacy & Security:** Client-side input sanitization, Supabase Row-Level Security (RLS) policies, and encrypted local storage preventing plaintext leaks of Protected Health Information (PHI).

## Brand Commitments

- **Design Tone:** Authoritative, clinically calm, legible, and high-contrast suitable for varied lighting conditions in rural health stations.
- **Official Identity:** Republic of the Philippines, Municipality of Bucay, Rural Health Unit & Municipal Health Office official insignia.
- **Typography & Interaction:** Crisp system fonts, unambiguous vital sign thresholds (normal, elevated, hypertensive/critical), and large tap targets for touchscreen/field usability.

## Evidence on Hand

- **Product Specifications:** Complete system specifications documented in [docs/App_PRD.md](file:///z:/Users/Admin/Desktop/Barangay%20Health%20Monitoring/docs/App_PRD.md).
- **Agent Rules & Clinical Directives:** Dual-domain engineering and clinical informatics protocols defined in [AGENTS.md](file:///z:/Users/Admin/Desktop/Barangay%20Health%20Monitoring/AGENTS.md).
- **Database Migrations:** Schema definitions and self-healing migrations in [supabase/migrations/](file:///z:/Users/Admin/Desktop/Barangay%20Health%20Monitoring/supabase/migrations/).
- **Automated Validation Suite:** 28 passing end-to-end integration assertions in [tests/supabase_sync_auth_validation.test.ts](file:///z:/Users/Admin/Desktop/Barangay%20Health%20Monitoring/tests/supabase_sync_auth_validation.test.ts).

## Product Principles

1. **Zero-Block Intake in the Field:** Connectivity drops or cloud timeouts must never interrupt a BHW or midwife actively taking patient vitals or registering a resident.
2. **Clinical Safety Through Clear Thresholds:** Vitals outside standard DOH/WHO clinical ranges must immediately signal visual warnings with structured triage guidance.
3. **Strict Separation of Duties:** Clinical data, administrative privileges, and executive reporting are partitioned by design to comply with RA 10173.
4. **Predictable Cloud Resource Management:** Cloud storage sync operations must provide transparent byte-level telemetry and deterministic backup bundles.

## Accessibility & Inclusion

- High-contrast color scales for blood pressure and triage indicators (WCAG AAA contrast for critical clinical alerts).
- Multilingual and localized terminology adapted for Ilokano and Tagalog community health workflows where appropriate.
- Responsive mobile/tablet and low-resolution desktop support (minimum 1024x768 workstation viewport).
