---
name: Barangay Health Status Monitoring System (BHSMS)
description: Clinical-grade primary healthcare workstation and epidemiological surveillance platform for Philippine LGUs
colors:
  primary: "#059669"
  primary-hover: "#047857"
  primary-surface: "#ecfdf5"
  neutral-bg: "#f8fafc"
  neutral-subtle: "#f1f5f9"
  neutral-surface: "#ffffff"
  neutral-border: "#e2e8f0"
  neutral-outline: "#cbd5e1"
  neutral-soft: "#94a3b8"
  neutral-text: "#0f172a"
  neutral-muted: "#64748b"
  role-bhw: "#059669"
  role-nurse: "#db2777"
  role-doctor: "#2563eb"
  role-admin: "#4f46e5"
  role-lgu: "#d97706"
  status-critical: "#dc2626"
  status-warning: "#d97706"
  status-success: "#16a34a"
typography:
  display:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, Courier New, monospace"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.02em"
  micro:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  nano:
    fontFamily: "Geist Sans, Arial, Helvetica, sans-serif"
    fontSize: "0.5625rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.03em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-surface:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.xl}"
    padding: "20px"
---

# Design System: Barangay Health Status Monitoring System (BHSMS)

## Overview

**Creative North Star: "The Clinical Sentinel"**

The Barangay Health Status Monitoring System (BHSMS) interface is designed as a high-precision, low-cognitive-load clinical monitoring station tailored for rural Philippine health facilities. Guided by the philosophy of **Pragmatic Clinical Modernism**, the interface pairs calm slate foundations with authoritative medical emerald accents and sharp, role-delineated visual hierarchy.

The design eliminates decorative bloat, saturated gradient distractions, and unnecessary animation. Instead, it prioritizes daylight readability, fast scanning of critical physiological parameters, and rapid touch/keyboard data entry across low-spec field hardware. Every visual element serves an operational purpose: identifying operator station scopes, flagging vital sign abnormalities, or tracking offline synchronization health.

**Key Characteristics:**
- **Calm, High-Contrast Palette:** Slate-50 canvases with crisp Slate-900 typography and subtle Slate-200 structural borders.
- **Role-Coded Micro-Affordances:** Distinct, pastel-grounded color coding for each official persona (BHW: Emerald, Midwife: Pink, Doctor: Blue, Admin: Indigo, LGU Viewer: Amber).
- **Telemetry & Density:** Monospace readouts for clinical measurements, timestamps, PhilHealth IDs, and byte-level storage metrics.
- **Restrained Tactile Elevation:** Flat-to-tonal layering with ambient micro-shadows (`shadow-2xs` / `shadow-xs`) preserving optical clarity under high-glare field lighting.

## Colors

The palette is engineered around public health vitality, clinical authority, and clear triage signals.

### Primary
- **Deep Pine & Medical Emerald** (`#059669` / `#047857`): The system anchor representing public health vitality and healing. Used for primary navigation states, primary action triggers, confirmed sync telemetry, and verified health records.
- **Emerald Mist Surface** (`#ecfdf5`): Soft backdrop for active states, positive diagnostic outcomes, and BHW persona elements.

### Secondary
- **Clinical Diagnostic Blue** (`#2563eb`): Reserved for MHO physician triage queues, clinical consultation notes, and hospital referral slips.
- **Maternal Health Rose** (`#db2777`): Dedicated to Rural Health Midwife workflows, antenatal care (ANC) cards, and EPI child tracking.

### Tertiary & Governance
- **LGU Governance Amber** (`#d97706`): Used for municipal executive analytics, warning banners, and storage threshold cautions.
- **Administrative Indigo** (`#4f46e5`): Assigned to IT console diagnostic panels, RBAC user provisioning, and audit log controls.

### Neutral
- **Workstation Slate-50** (`#f8fafc`): Canvas background minimizing optical eye fatigue during extended clinical intake shifts.
- **Card Surface Pure White** (`#ffffff`): High-clarity elevated container surface for tables, medical records, and diagnostic cards.
- **Border Outline Slate-200** (`#e2e8f0`): 1px structural framing defining information boundaries without visual heaviness.
- **Primary Ink Slate-900** (`#0f172a`): High-legibility text meeting WCAG AAA contrast for patient names and vital values.
- **Clinical Muted Slate-500** (`#64748b`): Descriptive labels, timestamps, and secondary operational telemetry.

## Typography

BHSMS uses a dual-font structure: a clean geometric sans-serif for UI labels and clinical records, paired with a tabular monospace font for physiological vitals and legal identifiers.

- **Display & Headlines (`Geist Sans`, 20px–28px, Bold):** Station titles, critical triage headers, and operational metric summaries.
- **Section Titles (`Geist Sans`, 14px–16px, Semi-Bold):** Panel headings, card titles, and modal headers.
- **Body & Data Grid (`Geist Sans`, 12px–13px, Regular/Medium):** Patient demographic entries, table cells, form inputs, and clinical instructions.
- **Telemetry & Vitals (`Geist Mono`, 11px–12px, Semi-Bold):** Blood pressure readings, heart rates, PhilHealth/National ID numbers, storage byte counts, and ISO-8601 timestamps.

## Layout

- **Desktop & Workstation (≥ 1024px):** Max container width `max-w-7xl` with persistent top navigation header, role indicator pill, and responsive 2-column or 4-column KPI metric grids.
- **Mobile & Field Outreach (< 1024px):** Single-column stacked layout with collapsible mobile menu, sticky action bars, and edge-to-edge touch targets.
- **Rhythm & Grid:** 4px baseline grid with standard 12px to 16px internal padding on cards and 16px to 24px vertical section spacing.

## Elevation & Depth

- **Tonal Layering:** The design rejects heavy drop shadows in favor of subtle border articulation (`border border-slate-200`) on white cards against the `#f8fafc` canvas.
- **Micro-Shadows:** Ambient `shadow-2xs` (`0 1px 2px 0 rgb(0 0 0 / 0.03)`) for stat cards and `shadow-xs` for interactive modals.
- **Modal Overlays:** `bg-slate-900/50 backdrop-blur-xs` creating high-focus isolation for intake workflows without disorienting operators.

## Shapes

- **Card Containers:** `rounded-2xl` (16px–24px) providing soft, approachable contours for clinical workstations.
- **Inputs & Action Buttons:** `rounded-lg` (8px–12px) balancing compact density with comfortable click/tap bounding boxes.
- **Status & Role Badges:** `rounded-full` pills with 1px border framing (`px-2 py-0.5 text-[10px] font-bold uppercase`).

## Components

### Buttons
- **Primary Action (`button-primary`):** Emerald-600 background, white text, subtle hover darkening to Emerald-700, and `ring-2 ring-emerald-500/20` focus ring.
- **Administrative Action:** Purple/Indigo-700 background for RBAC provisioning and system configuration.
- **Destructive Action:** Red-50 background with Red-700 text, shifting to solid Red-600 on modal confirmation.
- **Ghost & Secondary:** Transparent background, Slate-600 text, hover to Slate-100 with Slate-300 border.

### Metric & Stat Cards
- Pure white container with 1px Slate-200 border, upper label in Slate-500, primary figure in 24px bold Slate-900, accompanied by a right-aligned rounded icon container.

### Clinical & Status Badges
- Standardized pill badges combining 50-tint backgrounds, 200-tint borders, and 800-tint text for optimal legibility.
- Critical Triage: Red-50 / Red-200 border / Red-800 text.
- Normal/Active: Emerald-50 / Emerald-200 border / Emerald-800 text.
- Pending/Offline: Amber-50 / Amber-200 border / Amber-800 text.

## Do's and Don'ts

### Do's
- **DO** use `Geist Mono` or monospace numerals for all vital signs, blood pressure values, timestamps, and storage quotas.
- **DO** maintain strict role-based color conventions across all screens so operators instantly know which role scope is active.
- **DO** provide immediate local offline feedback when performing CRUD operations before syncing to Supabase.
- **DO** preserve high-contrast text ratios (minimum 4.5:1 for body copy, 7:1 for critical vital thresholds).

### Don'ts
- **DON'T** use saturated decorative gradients or floating glassmorphic elements that impede legibility under harsh clinic lights.
- **DON'T** allow administrators to view, edit, or delete their own active operator credentials in the RBAC personnel directory.
- **DON'T** display unformatted byte numbers or raw error stack traces to frontline healthcare workers.
- **DON'T** bury critical triage warnings behind dropdown menus or secondary tabs.
