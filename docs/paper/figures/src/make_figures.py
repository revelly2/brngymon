"""Writes the SVG/HTML sources of Figures 2, 4 and 5; shoot.mjs renders them to PNG."""
from pathlib import Path
from html import escape

OUT = Path(__file__).parent
FONT = "Arial, Helvetica, sans-serif"
ARROW = ('<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" '
         'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#111"/></marker></defs>')

def page(name, w, h, body):
    svg = (f'<svg id="fig" xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
           f'font-family="{FONT}" font-size="16" fill="#111">{ARROW}'
           f'<rect width="{w}" height="{h}" fill="#fff"/>{body}</svg>')
    (OUT / f"{name}.html").write_text(f'<!doctype html><meta charset="utf-8"><body style="margin:0">{svg}', "utf-8")

def text(x, y, lines, size=16, bold=False, anchor="middle"):
    lines = lines if isinstance(lines, list) else [lines]
    y0 = y - (len(lines) - 1) * size * 0.6
    w = ' font-weight="bold"' if bold else ""
    return "".join(f'<text x="{x}" y="{y0 + i * size * 1.2:.1f}" font-size="{size}" text-anchor="{anchor}" '
                   f'dominant-baseline="middle"{w}>{escape(t)}</text>' for i, t in enumerate(lines))

def box(x, y, w, h, lines, fill="#fff", bold=False, rx=8):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="#111" stroke-width="1.6"/>'
            + text(x + w / 2, y + h / 2, lines, bold=bold))

def diamond(cx, cy, w, h, lines):
    pts = f"{cx},{cy - h / 2} {cx + w / 2},{cy} {cx},{cy + h / 2} {cx - w / 2},{cy}"
    return f'<polygon points="{pts}" fill="#f3f3f3" stroke="#111" stroke-width="1.6"/>' + text(cx, cy, lines, size=15)

def line(*pts, arrow=True, dash=False):
    d = " ".join(f"{x},{y}" for x, y in pts)
    m = ' marker-end="url(#a)"' if arrow else ""
    s = ' stroke-dasharray="6 4"' if dash else ""
    return f'<polyline points="{d}" fill="none" stroke="#111" stroke-width="1.6"{m}{s}/>'

def label(x, y, t):
    return text(x, y, t, size=14, bold=True)

# ---------------------------------------------------------------- Figure 2: Prototype development cycle
b = ""
steps = [("Requirements", "Gathering"), ("Quick", "Design"), ("Prototyping",), ("Testing with", "Users")]
for i, s in enumerate(steps):
    b += box(20 + i * 200, 60, 160, 70, list(s))
    if i:
        b += line((20 + i * 200 - 40, 95), (20 + i * 200, 95))
b += line((780, 95), (830, 95))
b += diamond(900, 95, 140, 110, ["Accepted", "by users?"])
b += line((970, 95), (1010, 95)) + label(990, 80, "Yes")
b += box(1010, 60, 170, 70, ["Deployment and", "Evaluation"], fill="#e8e8e8", bold=True)
b += line((900, 150), (900, 270)) + label(918, 205, "No")
b += box(820, 270, 160, 70, ["Refinement"])
b += line((820, 305), (500, 305), (500, 130))
b += text(660, 325, "user feedback is applied to the next prototype", size=14)
page("figure2_prototype", 1200, 370, b)

# ---------------------------------------------------------------- Figure 4: vital-sign triage workflow
b = ""
C, R = 300, 710  # centre column, result column
b += box(C - 130, 20, 260, 50, "Select resident", fill="#e8e8e8", bold=True)
b += line((C, 70), (C, 100))
b += box(C - 170, 100, 340, 60, ["Enter SBP, DBP, heart rate, resp. rate,", "temperature, weight, height"])
b += line((C, 160), (C, 185))
decisions = [(230, ["SBP ≥ 180 or", "DBP ≥ 120?"], ["CRITICAL: Hypertensive crisis", "Referral required"], "#f4cccc"),
             (350, ["SBP ≥ 140 or", "DBP ≥ 90?"], ["HIGH:", "Stage 2 hypertension"], "#fde3cf"),
             (470, ["SBP ≥ 120 or", "DBP ≥ 80?"], ["ELEVATED:", "Pre-hypertension"], "#fff2cc")]
for cy, q, res, fill in decisions:
    b += diamond(C, cy, 260, 90, q)
    b += line((C + 130, cy), (R - 150, cy)) + label(C + 160, cy - 12, "Yes")
    b += box(R - 150, cy - 30, 300, 60, res, fill=fill)
    b += line((R + 150, cy), (890, cy), arrow=False)
    if cy < 470:
        b += line((C, cy + 45), (C, cy + 75)) + label(C + 20, cy + 60, "No")
b += line((C, 515), (C, 545)) + label(C + 20, 530, "No")
b += box(C - 130, 545, 260, 50, "NORMAL", fill="#d9ead3", bold=True)
b += line((890, 230), (890, 630), (C, 630), arrow=False)
b += line((C, 595), (C, 655))
b += diamond(C, 700, 260, 90, ["Temperature", "≥ 38.0 °C?"])
b += line((C + 130, 700), (R - 150, 700)) + label(C + 160, 688, "Yes")
b += box(R - 150, 670, 300, 60, ["Add Febrile illness alert;", "NORMAL becomes ELEVATED"], fill="#fde3cf")
b += line((R, 730), (R, 820), (C + 130, 820))
b += line((C, 745), (C, 790)) + label(C + 20, 768, "No")
b += box(C - 170, 790, 340, 60, ["Compute BMI = kg / m² and classify", "(WHO Asia-Pacific cut-offs)"])
b += line((C, 850), (C, 880))
b += box(C - 170, 880, 340, 60, ["Show severity, flags, and BMI", "live; health worker saves"])
b += line((C, 940), (C, 970))
b += box(C - 170, 970, 340, 50, "Store on workstation (offline)")
b += line((C, 1020), (C, 1050))
b += box(C - 170, 1050, 340, 50, "Sync to Supabase when online", fill="#e8e8e8", bold=True)
page("figure4_triage", 920, 1120, b)

# ---------------------------------------------------------------- Figure 5: entity-relationship diagram
TABLES = {
    "households": (30, 30, ["PK id", "barangay", "purok", "household_number", "FK head_resident_id"]),
    "residents": (420, 30, ["PK id", "upi", "FK household_id", "first_name, middle_name, last_name", "date_of_birth",
                            "biological_sex, civil_status", "barangay, purok", "philhealth_id", "is_pregnant",
                            "soundex_key", "FK created_by"]),
    "vital_signs": (810, 30, ["PK id", "FK resident_id", "FK recorded_by_user_id", "systolic_bp, diastolic_bp",
                              "heart_rate_bpm", "respiratory_rate_cpm", "temperature_celsius", "weight_kg, height_cm",
                              "bmi", "severity", "clinical_flags", "referral_recommended", "recorded_at"]),
    "profiles": (30, 300, ["PK id", "full_name", "role", "barangay", "modules"]),
    "immunizations": (420, 400, ["PK id", "FK resident_id", "vaccine_code", "dose_number", "status",
                                 "administered_date"]),
    "maternal_records": (810, 430, ["PK id", "FK resident_id", "gravida, para", "lmp, edd", "high_risk_flags",
                                    "is_active"]),
    "audit_logs": (30, 520, ["PK id", "FK actor_user_id", "action_type", "table_name", "record_id", "created_at"]),
    "disease_surveillance_reports": (420, 650, ["PK id", "barangay", "disease_category", "case_count",
                                                "epi_week, epi_year", "FK reported_by"]),
    "antenatal_visits": (810, 690, ["PK id", "FK maternal_record_id", "visit_number", "gestational_age_weeks",
                                    "fundic_height_cm", "fetal_heart_tone_bpm", "systolic_bp, diastolic_bp"]),
}
W, HEAD, ROW = 330, 34, 21
def tbl_h(cols):
    return HEAD + len(cols) * ROW + 10
b = ""
for name, (x, y, cols) in TABLES.items():
    h = tbl_h(cols)
    b += f'<rect x="{x}" y="{y}" width="{W}" height="{h}" fill="#fff" stroke="#111" stroke-width="1.6"/>'
    b += f'<rect x="{x}" y="{y}" width="{W}" height="{HEAD}" fill="#e8e8e8" stroke="#111" stroke-width="1.6"/>'
    b += text(x + W / 2, y + HEAD / 2, name, bold=True)
    for i, c in enumerate(cols):
        key = c[:3] if c[:3] in ("PK ", "FK ") else ""
        b += text(x + 12, y + HEAD + 14 + i * ROW, (key and f"{key.strip()}  ") + c[len(key):], size=14, anchor="start")
def rel(pts, lx, ly):
    return line(*pts) + text(lx, ly, "1 → N", size=13, bold=True)
b += rel([(360, 100), (420, 100)], 390, 88)                                   # households → residents
b += rel([(750, 110), (810, 110)], 780, 98)                                   # residents → vital_signs
b += rel([(585, 30 + tbl_h(TABLES["residents"][2])), (585, 400)], 615, 360)    # residents → immunizations
b += rel([(750, 260), (780, 260), (780, 520), (810, 520)], 800, 390)           # residents → maternal_records
b += rel([(975, 430 + tbl_h(TABLES["maternal_records"][2])), (975, 690)], 1005, 660)  # maternal → antenatal
b += rel([(360, 380), (395, 380), (395, 290), (420, 290)], 380, 398)           # profiles → residents.created_by
b += rel([(195, 300 + tbl_h(TABLES["profiles"][2])), (195, 520)], 225, 490)    # profiles → audit_logs
b += text(30, 905, "PK = primary key · FK = foreign key · 1 → N = one-to-many · vital_signs.recorded_by_user_id and "
          "disease_surveillance_reports.reported_by also reference profiles.", size=13, anchor="start")
page("figure5_erd", 1170, 925, b)
print("wrote figure sources to", OUT)
