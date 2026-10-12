# Technical Requirements Document (TRD)
**Project Name:** Barangay Health Monitoring System (BHMS)  
**Database & BaaS:** Supabase (PostgreSQL + Auth + Storage + Realtime)  
**Status:** Approved Architecture Draft  
**Version:** 1.1.0  

---

## 1. Executive Summary & Architecture Overview

The **Barangay Health Monitoring System (BHMS)** is a web-based healthcare management platform designed for Barangay Health Centers (BHC). The system leverages **Supabase** as its backend-as-a-service (BaaS) and database foundation, combining managed PostgreSQL, built-in Authentication, Row-Level Security (RLS), Supabase Storage for document/asset hosting, and Realtime subscriptions for clinical alert synchronization.

### 1.1 Technology Stack
* **Frontend:** Next.js (App Router) or React + Vite (PWA-enabled for mobile/tablet use in field visits).
* **Database & BaaS:** Supabase
  * **Database:** Managed PostgreSQL (v15+) with extensions (`pgcrypto`, `uuid-ossp`).
  * **Authentication:** Supabase Auth (JWT-based, with custom claims/app metadata).
  * **Authorization:** PostgreSQL Row-Level Security (RLS) policies.
  * **File Storage:** Supabase Storage (S3-compatible, private buckets with signed URLs).
  * **Serverless Logic:** Supabase Edge Functions (Deno / TypeScript) for scheduled cron jobs and sensitive operations.
  * **Realtime:** Supabase Realtime (Postgres CDC) for critical disease alerts and triage queue updates.

---

## 2. User Roles & Access Control (RBAC via Supabase)

Roles are managed using a dedicated `user_roles` relation or custom user claims in Supabase Auth, strictly enforced by PostgreSQL RLS.

| Role | Permissions & RLS Scope |
| :--- | :--- |
| **System Admin** | Global administrative access; manages users, audit trails, and system backups. |
| **Municipal Doctor / Nurse** | Full read/write access to patient clinical records, prescriptions, and cross-barangay consultations. |
| **Barangay Health Worker (BHW)** | Read/write access to assigned household profiling, vital sign capture, and maternal/child health forms. |
| **Barangay Captain / LGU Official** | Read-only access to aggregated statistical views and anonymized epidemiological reporting. |

---

## 3. Database Schema & Supabase Configuration

### 3.1 Custom Types & Enums
```sql
CREATE TYPE user_role_type AS ENUM ('admin', 'doctor', 'nurse', 'bhw', 'lgu_viewer');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE vaccine_status AS ENUM ('scheduled', 'administered', 'missed', 'exempted');