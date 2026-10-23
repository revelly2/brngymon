"""Builds docs/paper/BHSMS_Capstone_Paper.docx from the survey sources in BRNGT.

Usage: python build_paper.py [BRNGT folder]
Needs: pip install python-docx
"""
import sys, re
from pathlib import Path
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "Z:/Users/Admin/Desktop/BRNGT")
OUT = Path(__file__).with_name("BHSMS_Capstone_Paper.docx")
BRGYS = ("Palaquio", "Tabiog", "Babangcag")
N_BRGY = {"Palaquio": 19, "Tabiog": 17, "Babangcag": 20}

# ---------------------------------------------------------------- survey data
def cell_text(tc):
    return "".join(x.text for x in tc.iter() if x.tag.endswith("}t")).strip()

def likert_rows(table):
    out = []
    for r in table.rows:
        cells = [cell_text(tc) for tc in r._tr.tc_lst]
        if len(cells) == 6 and cells[0].rstrip(".").isdigit():
            out.append([int(c) if c.isdigit() else 0 for c in cells[1:]])
    return out

survey = docx.Document(SRC / "SURVEY.docx")
# SURVEY.docx table order: Palaquio I/II, Babangcag I/II, Tabiog I/II
TABLES = {"Palaquio": (0, 1), "Babangcag": (2, 3), "Tabiog": (4, 5)}
P1 = {b: likert_rows(survey.tables[i]) for b, (i, _) in TABLES.items()}
P2 = {b: likert_rows(survey.tables[j]) for b, (_, j) in TABLES.items()}
assert all(len(P1[b]) == 22 and len(P2[b]) == 18 for b in BRGYS)

def wm(f):
    # shortcut: mean over the answers actually tallied; a few source rows do not sum to the barangay's n
    return sum(x * w for x, w in zip(f, (5, 4, 3, 2, 1))) / sum(f)

def item_stats(part, i):
    comb = [sum(part[b][i][k] for b in BRGYS) for k in range(5)]
    return wm(comb), {b: wm(part[b][i]) for b in BRGYS}

def avg(xs):
    return sum(xs) / len(xs)

open_ended = []
for t in docx.Document(SRC / "SENTENCE PART.docx").tables:
    rows = [[cell_text(tc) for tc in r._tr.tc_lst] for r in t.rows]
    open_ended.append(rows)

qdoc = docx.Document(SRC / "Questionnaire on the Challenges Encountered in the Current Manual.docx")
def q_items(table):
    groups, cur = [], None
    for r in table.rows:
        first = cell_text(r._tr.tc_lst[0])
        if re.match(r"^[A-E]\.", first):
            cur = [first, []]; groups.append(cur)
        elif first:
            cur[1].append(first)
    return groups
Q1 = q_items(qdoc.tables[0])  # 5 areas, 22 statements
Q2 = q_items(qdoc.tables[2])  # 3 criteria, 18 statements
assert sum(len(g[1]) for g in Q1) == 22 and sum(len(g[1]) for g in Q2) == 18

SCALE = [(4.21, "Strongly Agree", "Very High", "Excellent"), (3.41, "Agree", "High", "Very Good"),
         (2.61, "Neutral", "Moderate", "Good"), (1.81, "Disagree", "Low", "Fair"),
         (1.00, "Strongly Disagree", "Very Low", "Poor")]
def rate(m):
    m = round(m, 2)
    return next(s for s in SCALE if m >= s[0])

def f2(x):
    return f"{x:.2f}"

# ---------------------------------------------------------------- document helpers
d = docx.Document()
sec = d.sections[0]
sec.page_width, sec.page_height = Inches(8.5), Inches(11)
sec.left_margin = Inches(1.5)
sec.right_margin = sec.top_margin = sec.bottom_margin = Inches(1)

FONT = "Times New Roman"
st = d.styles["Normal"]
st.font.name = FONT; st.font.size = Pt(12)
st.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
st.paragraph_format.line_spacing = 2.0
st.paragraph_format.space_after = Pt(0)
for name, size in (("Heading 1", 12), ("Heading 2", 12), ("Heading 3", 12)):
    h = d.styles[name]
    h.font.name = FONT; h.font.size = Pt(size); h.font.bold = True
    h.font.color.rgb = RGBColor(0, 0, 0); h.font.italic = False
    h.element.rPr.rFonts.set(qn("w:eastAsia"), FONT)
    h.paragraph_format.space_before = Pt(12); h.paragraph_format.space_after = Pt(6)
    h.paragraph_format.line_spacing = 1.0
d.styles["Heading 1"].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER

def field(paragraph, instr):
    r = paragraph.add_run()
    for tag, text in (("begin", None), (None, instr), ("separate", None), ("end", None)):
        if tag:
            el = OxmlElement("w:fldChar"); el.set(qn("w:fldCharType"), tag)
        else:
            el = OxmlElement("w:instrText"); el.set(qn("xml:space"), "preserve"); el.text = text
        r._r.append(el)

fp = sec.footer.paragraphs[0]
fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
field(fp, "PAGE")

def page_break():
    d.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

def P(text="", indent=True, align=None, bold=False, italic=False, spacing=None, size=None):
    p = d.add_paragraph()
    if indent:
        p.paragraph_format.first_line_indent = Inches(0.5)
    if align == "c":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif align == "r":
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    elif align == "j" or align is None:
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if spacing:
        p.paragraph_format.line_spacing = spacing
    for part in re.split(r"(\*\*[^*]+\*\*)", text):
        if not part:
            continue
        run = p.add_run(part[2:-2] if part.startswith("**") else part)
        run.bold = bold or part.startswith("**")
        run.italic = italic
        if size:
            run.font.size = Pt(size)
    return p

def H1(text, sub=None):
    page_break()
    d.add_heading(text, level=1)
    if sub:
        h = d.add_heading(sub, level=1)
        h.paragraph_format.space_before = Pt(0)

def H2(text):
    d.add_heading(text, level=2)

def H3(text):
    d.add_heading(text, level=3)

def numbered(items):
    for i, t in enumerate(items, 1):
        p = P(f"{i}. {t}", indent=False)
        p.paragraph_format.left_indent = Inches(0.5)
        p.paragraph_format.first_line_indent = Inches(-0.25)

def caption(text):
    p = P(text, indent=False, align="l", bold=True, spacing=1.0)
    p.paragraph_format.space_before = Pt(12); p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True

def table(header, rows, widths=None, size=11, bold_last=False):
    t = d.add_table(rows=1, cols=len(header))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(header):
        t.rows[0].cells[i].text = h
    for r in rows:
        cells = t.add_row().cells
        for i, v in enumerate(r):
            cells[i].text = str(v)
    for ri, row in enumerate(t.rows):
        for ci, c in enumerate(row.cells):
            if widths:
                c.width = Inches(widths[ci])
            for p in c.paragraphs:
                p.paragraph_format.line_spacing = 1.0
                p.paragraph_format.first_line_indent = Inches(0)
                if ci > 0 and len(c.text) < 20:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.font.size = Pt(size)
                    run.bold = ri == 0 or (bold_last and ri == len(t.rows) - 1)
    d.add_paragraph().paragraph_format.line_spacing = 1.0
    return t

def placeholder(label):
    p = P(f"[{label}]", indent=False, align="c", italic=True, spacing=1.0)
    p.paragraph_format.space_before = Pt(12)

def figure(label, note):
    placeholder(f"Insert {label} here — {note}")
    caption(label)

LEGEND = [("5", "4.21–5.00", "Strongly Agree", "Very High"), ("4", "3.41–4.20", "Agree", "High"),
          ("3", "2.61–3.40", "Neutral", "Moderate"), ("2", "1.81–2.60", "Disagree", "Low"),
          ("1", "1.00–1.80", "Strongly Disagree", "Very Low")]

# ================================================================ TITLE PAGE
for line, bold in (("BARANGAY HEALTH STATUS MONITORING SYSTEM", True), ("", False),
                   ("A Capstone Project Presented to", False),
                   ("The Faculty of the Department of Information Technology", False),
                   ("Abra State Institute of Sciences and Technology", False),
                   ("Main Campus, Lagangilang, Abra", False), ("", False),
                   ("In Partial Fulfillment", False), ("of the Requirements for the Degree", False),
                   ("BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY", True), ("", False),
                   ("Katlyne Biendima", False), ("Christian Angel Parado", False),
                   ("Ryan Justine Bisnan", False), ("Dave Lester Bisnan", False), ("Mark Bolanos", False),
                   ("", False), ("APRIL 2026", True)):
    P(line, indent=False, align="c", bold=bold)

# ================================================================ APPROVAL SHEET
page_break()
P("APPROVAL SHEET", indent=False, align="c", bold=True)
P("This capstone project titled “BARANGAY HEALTH STATUS MONITORING SYSTEM,” prepared and submitted by "
  "Katlyne Biendima, Christian Angel Parado, Ryan Justine Bisnan, Dave Lester Bisnan, and Mark Bolanos in "
  "partial fulfillment of the requirements for the degree Bachelor of Science in Information Technology, "
  "has been examined and passed on November 26, 2026.")

def sign_pair(a, b):
    t = d.add_table(rows=3, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col, (name, role) in enumerate((a, b)):
        for row, (txt, bold) in enumerate(((name, True), (role, False), ("Date Signed: ____________", False))):
            p = t.cell(row, col).paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = 1.0
            run = p.add_run(txt); run.bold = bold
    d.add_paragraph()

sign_pair(("CERLYN JOY B. DORO, MIT", "Adviser"), ("CANDYLYN A. ALUNDAY, MA", "English Critic"))
P("PANEL OF EXAMINERS", indent=False, align="c", bold=True)
sign_pair(("EXCEL PHILIP B. GUIDANG, DIT", "Member"), ("DIETRICH D. DAIT, BSCpE", "Member"))
for txt, b in (("CARLITO T. MANGANTENG, MIT", True), ("Chairman", False), ("Date Signed: ____________", False)):
    P(txt, indent=False, align="c", bold=b, spacing=1.0)
d.add_paragraph()
P("Accepted and approved in partial fulfillment of the requirements for the degree Bachelor of Science in "
  "Information Technology.")
for txt, b in (("EXCEL PHILIP B. GUIDANG, DIT", True), ("Program Head, BS Information Technology", False),
               ("Date Signed: ____________", False)):
    P(txt, indent=False, align="c", bold=b, spacing=1.0)
d.add_paragraph()
sign_pair(("CHRISTOPHER JOHN R. LLANDA, DIT", "Dean, College of Arts and Sciences"),
          ("PABLO B. BOSE JR., EdD", "Director, Research and Development"))

# ================================================================ ABSTRACT
part1_items = [item_stats(P1, i)[0] for i in range(22)]
part2_items = [item_stats(P2, i)[0] for i in range(18)]
AREA_IDX = [range(0, 5), range(5, 10), range(10, 14), range(14, 18), range(18, 22)]
CRIT_IDX = [range(0, 6), range(6, 12), range(12, 18)]
area_m = [avg([part1_items[i] for i in idx]) for idx in AREA_IDX]
crit_m = [avg([part2_items[i] for i in idx]) for idx in CRIT_IDX]
P1_ALL, P2_ALL = avg(area_m), avg(crit_m)
N = sum(N_BRGY.values())

d.add_heading("ABSTRACT", level=1).paragraph_format.page_break_before = True
P(f"This capstone project designed, developed, and evaluated the Barangay Health Status Monitoring System "
  f"(BHSMS), a web-based platform that centralizes the health records of residents of Barangays Palaquio, "
  f"Tabiog, and Babangcag in the Municipality of Bucay, Abra. The study followed a descriptive-developmental "
  f"design and the Prototype Model. A questionnaire answered by {N} barangay health workers, midwives, and "
  f"other authorized health personnel showed that the challenges of the manual, paper-based system were "
  f"experienced to a high extent (overall weighted mean of {f2(P1_ALL)}, Agree), led by the difficulty of "
  f"organizing paper records ({f2(part1_items[0])}) and the time needed to retrieve them "
  f"({f2(part1_items[1])}). In the open-ended answers, time-consuming recording (30.36%), difficulty finding "
  f"records (26.79%), and time-consuming report preparation (28.57%) were cited most often. The system was "
  f"built with Next.js, React, TypeScript, Tailwind CSS, and Supabase (PostgreSQL), and saves data in the "
  f"browser first so that a health station can keep working without an internet connection. It provides "
  f"resident registration with a Unique Patient Identifier and duplicate detection, vital-sign triage that "
  f"automatically classifies blood pressure, fever, and body mass index, maternal care with high-risk "
  f"flagging, child immunization tracking with a defaulter list, referral slips, morbidity surveillance "
  f"reports, and role-based access for five types of users. The same respondents evaluated the system at "
  f"an overall weighted mean of {f2(P2_ALL)} (Agree, Very Good): effectiveness {f2(crit_m[0])}, efficiency "
  f"{f2(crit_m[1])}, and user-friendliness {f2(crit_m[2])}. The study recommends pilot adoption in the three "
  f"barangays, SMS reminders for scheduled visits, and a before-and-after measurement of recording and "
  f"reporting time.")
P("Keywords: barangay health information system, health monitoring, offline-first web application, "
  "triage, immunization tracking, Supabase", indent=False, italic=True)

# ================================================================ ACKNOWLEDGEMENT & DEDICATION (from the capstone PDF)
import subprocess, shutil
AUTHORS = ("Katlyne Biendima", "Christian Angel Parado", "Ryan Justine Bisnan", "Dave Lester Bisnan", "Mark Bolanos")
CAP_TEXT = ""
if shutil.which("pdftotext") and (SRC / "revised capstone.pdf").exists():
    CAP_TEXT = subprocess.run(["pdftotext", "-layout", str(SRC / "revised capstone.pdf"), "-"],
                              capture_output=True).stdout.decode("cp1252", errors="replace")
def pdf_paragraphs(start_marker, end_marker):
    text = CAP_TEXT
    text = text.replace("\r", "").replace("\x0c", "\n")
    body = re.split(rf"^\s*{start_marker}\s*$", text, maxsplit=1, flags=re.M)[1]
    body = re.split(rf"^\s*{end_marker}\s*$", body, maxsplit=1, flags=re.M)[0]
    paras, cur = [], []
    for line in body.splitlines():
        if not line.strip():
            if cur: paras.append(" ".join(cur)); cur = []
            continue
        if line.startswith("         ") and cur and not line.startswith("          " * 3):
            paras.append(" ".join(cur)); cur = []
        if line.startswith(" " * 30) or line.strip() in AUTHORS:  # signature line
            if cur: paras.append(" ".join(cur)); cur = []
            paras.append("SIG:" + line.strip()); continue
        cur.append(line.strip())
    if cur: paras.append(" ".join(cur))
    return paras

if CAP_TEXT:
    d.add_heading("ACKNOWLEDGEMENT", level=1).paragraph_format.page_break_before = True
    for para in pdf_paragraphs("Acknowledgement", "Dedication"):
        if para.startswith("SIG:"):
            P(para[4:], indent=False, align="r", spacing=1.0)
        else:
            P(para.replace("were vital in ensuring", "were vital to ensuring"))
    d.add_heading("DEDICATION", level=1).paragraph_format.page_break_before = True
    for para in pdf_paragraphs("Dedication", "CHAPTER I"):
        if para.startswith("SIG:"):
            P(para[4:], indent=False, align="r", bold=True); d.add_paragraph()
        else:
            P(para)

# ================================================================ TABLE OF CONTENTS / LISTS
d.add_heading("TABLE OF CONTENTS", level=1).paragraph_format.page_break_before = True
P("(Right-click and choose Update Field to refresh page numbers.)", indent=False, italic=True, spacing=1.0, size=10)
field(d.add_paragraph(), 'TOC \\o "1-2" \\h \\z \\u')

TABLES_LIST = [
    "Table 1. Distribution of Respondents by Barangay",
    "Table 2. Development Tools and Technologies",
    "Table 3. Five-Point Likert Scale and Interpretation",
    "Table 4. Challenges in Health Record Management",
    "Table 5. Challenges in Monitoring of Residents’ Health",
    "Table 6. Challenges in Data Accuracy and Consistency",
    "Table 7. Challenges in Reporting and Information Retrieval",
    "Table 8. Challenges in Efficiency and Accessibility",
    "Table 9. Summary of the Challenges in the Current Manual System",
    "Table 10. Common Problems in Recording and Updating Health Information",
    "Table 11. Difficulties in Retrieving and Monitoring Health Records",
    "Table 12. Challenges in Preparing and Submitting Health Reports",
    "Table 13. Problems in Tracking Residents Who Need Follow-Up Services",
    "Table 14. Challenges Identified and the Corresponding Features of the BHSMS",
    "Table 15. Clinical Thresholds Applied by the System",
    "Table 16. User Roles and Default Module Access",
    "Table 17. Evaluation of the System in Terms of Effectiveness",
    "Table 18. Evaluation of the System in Terms of Efficiency",
    "Table 19. Evaluation of the System in Terms of User-Friendliness",
    "Table 20. Summary of the Evaluation by Criterion and Barangay",
]
FIGURES_LIST = [
    "Figure 1. Research Paradigm (IPO Model)",
    "Figure 2. Prototype Development Cycle",
    "Figure 3. System Architecture of the BHSMS",
    "Figure 4. Vital-Sign Triage Workflow",
    "Figure 5. Entity-Relationship Diagram of the BHSMS",
]
PLATES = [
    "Plate 1. Sign-In Page", "Plate 2. Role-Based Dashboard", "Plate 3. Resident Registry",
    "Plate 4. New Patient Intake with Duplicate Warning", "Plate 5. Hemodynamic Screener and Triage",
    "Plate 6. Medical Patient Chart", "Plate 7. Maternal Care and ANC Tracking",
    "Plate 8. Child EPI and Defaulter List", "Plate 9. Referral Slip (RF-1)",
    "Plate 10. FHSIS Morbidity Surveillance", "Plate 11. Workstation Diagnostics and Sync",
    "Plate 12. User Accounts and Module Permissions",
]
for title, items in (("LIST OF TABLES", TABLES_LIST), ("LIST OF FIGURES", FIGURES_LIST), ("LIST OF PLATES", PLATES)):
    d.add_heading(title, level=1).paragraph_format.page_break_before = True
    for it in items:
        P(it, indent=False, align="l", spacing=1.5)

# ================================================================ CHAPTER I
H1("CHAPTER I", "INTRODUCTION")
H2("Background of the Study")
for t in [
    "In today’s rapidly evolving world, information technology plays a crucial role in improving efficiency, "
    "accessibility, and decision-making across various sectors, particularly in healthcare. The integration of "
    "digital systems into health services has transformed the way patient information is collected, stored, "
    "and analyzed. Globally, health information systems have been shown to improve data accuracy, accessibility, "
    "and efficiency by enabling timely monitoring and informed decision-making. According to the World Health "
    "Organization (2021), digital health technologies contribute to better health outcomes through improved "
    "data management and access to information.",
    "In recent years, the demand for digital health solutions has increased, especially in local communities "
    "where access to efficient health services remains limited. Modern systems use centralized databases and "
    "data analytics to help health providers monitor patient conditions and identify health risks. These "
    "developments highlight the importance of moving from traditional manual systems to automated, "
    "technology-driven solutions.",
    "In the Philippines, the Department of Health (DOH) continues to promote digital health initiatives to "
    "improve health service delivery at the barangay level. Barangays serve as the frontline providers of "
    "essential health services such as immunization, maternal care, and disease prevention. However, many "
    "barangays still rely on paper-based systems to manage health records. As emphasized by Altura et al. "
    "(2023), this reliance on manual processes limits efficiency and highlights the need for a centralized "
    "digital platform to improve health service delivery.",
    "Manual record-keeping presents several challenges, including data redundancy, loss of records, and delays "
    "in retrieving important information. Batoon et al. (2022) explained that these inefficiencies reduce the "
    "productivity of health workers and hinder the delivery of timely and accurate health services. As a result, "
    "health providers may struggle to monitor patient conditions and respond to health concerns promptly.",
    "To address these challenges, digital health systems have been developed to improve the accessibility and "
    "efficiency of health services. Garcia et al. (2021) demonstrated that mobile and web-based applications can "
    "improve patient monitoring, medical record management, and communication between health providers and "
    "residents. Their study showed that such systems can bridge the gap between communities and health centers, "
    "particularly in rural areas where access to health services is limited.",
    "Despite these advancements, Barangays Palaquio, Tabiog, and Babangcag in the Municipality of Bucay, Abra, "
    "continue to rely on traditional methods of managing health information. Records are kept in logbooks and "
    "physical files, making them prone to errors, duplication, and damage. Retrieving information is "
    "time-consuming, especially when handling large volumes of records, which slows the delivery of health services.",
    "Another challenge faced by barangay health stations is the limited number of health workers and resources. "
    "With few personnel, continuous monitoring of residents becomes difficult, particularly for those who need "
    "regular health assessment, such as pregnant women, young children who must complete their vaccinations, and "
    "adults with high blood pressure. This limitation can lead to delayed detection of illnesses and reduced "
    "quality of care. Internet connectivity in these rural barangays is also intermittent, so any digital "
    "solution must continue to work when the connection is lost.",
    "Furthermore, the absence of a centralized system results in fragmented health records and difficulty in "
    "generating accurate reports. Without up-to-date data, health providers cannot effectively track health "
    "trends or identify high-risk individuals in the community. Communication also remains a concern, as "
    "traditional methods such as face-to-face interaction and printed materials may not be sufficient for timely "
    "information dissemination. Sumaylo (2013) noted that such approaches can lead to delays and gaps in "
    "delivering important health information to residents. Paper records are also difficult to protect from "
    "unauthorized access, even though the Data Privacy Act of 2012 requires that personal and health "
    "information be kept confidential (Republic of the Philippines, 2012).",
    "Given these challenges, there is a clear need for a comprehensive and integrated system to improve the "
    "management of health data in the barangays. This study therefore developed the Barangay Health Status "
    "Monitoring System (BHSMS), a centralized web-based platform for collecting, storing, and analyzing the "
    "health information of residents. The system enables health workers to register residents without "
    "duplicates, record vital signs that are automatically classified by severity, monitor pregnant women and "
    "children due for vaccination, generate referral slips and surveillance reports, and protect records "
    "through role-based access, while continuing to work offline and synchronizing to the cloud when a "
    "connection is available.",
]:
    P(t)

H2("Conceptual Framework")
P("This study is guided by the Input–Process–Output (IPO) Model, which illustrates how the requirements and "
  "resources of the study are transformed into the Barangay Health Status Monitoring System and its evaluation "
  "results (Figure 1).")
P("The Input component consists of the knowledge, software, and hardware requirements of the study. The "
  "knowledge requirements include the challenges of the current manual health monitoring system as reported by "
  "the respondents; the health programs that the system must support, namely the DOH Expanded Program on "
  "Immunization schedule, the four-visit antenatal care pathway, the Philippine clinical practice guidelines "
  "for hypertension (Philippine Heart Association–Philippine Society of Hypertension, 2020), and the World "
  "Health Organization’s body mass index cut-offs for Asian populations (WHO Expert Consultation, 2004); and "
  "the requirements of the Data Privacy Act of 2012. The design is also guided by the Technology Acceptance "
  "Model, which holds that users adopt a system they find useful and easy to use (Davis, 1989), and by ISO "
  "9241-11, which defines usability in terms of effectiveness, efficiency, and user satisfaction "
  "(International Organization for Standardization [ISO], 2018). The software requirements are Next.js, "
  "React, TypeScript, Tailwind CSS, and Supabase, while the hardware requirements are a computer or laptop at "
  "each barangay health station, a web browser, and an internet connection for cloud synchronization.")
P("The Process component covers the needs assessment conducted through a questionnaire answered by "
  f"{N} respondents from the three barangays; the phases of the Prototype Model, namely requirements "
  "gathering, quick design, prototyping, testing, refinement, and deployment and evaluation; and the "
  "evaluation of the developed system by the same respondents, with the data analyzed through frequency, "
  "percentage, and weighted mean.")
P("The Output component is the Barangay Health Status Monitoring System, a web-based, offline-first "
  "platform for resident registration, vital-sign triage, maternal and child health monitoring, referrals, "
  "and surveillance reports, together with the evaluation report that documents its effectiveness, "
  "efficiency, and user-friendliness. The feedback loop indicates that the evaluation results inform the "
  "further refinement of the system.")

ipo = d.add_table(rows=2, cols=3); ipo.style = "Table Grid"; ipo.alignment = WD_TABLE_ALIGNMENT.CENTER
ipo_text = [
    ("INPUT", ["Knowledge requirements: challenges of the manual system; DOH EPI schedule; 4-visit ANC; "
               "PH hypertension CPG; WHO Asia-Pacific BMI cut-offs; RA 10173",
               "Software: Next.js, React, TypeScript, Tailwind CSS, Supabase",
               "Hardware: computer or laptop, web browser, internet connection"]),
    ("PROCESS", ["Needs assessment questionnaire (n = 56)",
                 "Prototype Model: requirements gathering, quick design, prototyping, testing, refinement, "
                 "deployment and evaluation",
                 "Evaluation using frequency, percentage, and weighted mean"]),
    ("OUTPUT", ["Barangay Health Status Monitoring System (BHSMS)",
                "Evaluation of the system in terms of effectiveness, efficiency, and user-friendliness"]),
]
for i, (head, lines) in enumerate(ipo_text):
    hp = ipo.cell(0, i).paragraphs[0]; hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    hp.add_run(head).bold = True
    c = ipo.cell(1, i); c.paragraphs[0].text = ""
    for j, line in enumerate(lines):
        p = c.paragraphs[0] if j == 0 else c.add_paragraph()
        p.add_run("• " + line).font.size = Pt(10)
    for p in ipo.cell(0, i).paragraphs + c.paragraphs:
        p.paragraph_format.line_spacing = 1.0; p.paragraph_format.first_line_indent = Inches(0)
P("Feedback: evaluation results inform the refinement of the system", indent=False, align="c", italic=True, spacing=1.0, size=10)
caption("Figure 1. Research Paradigm (IPO Model)")

H2("Statement of the Problem")
P("The barangay health stations of Palaquio, Tabiog, and Babangcag face challenges in managing and monitoring "
  "health data because they lack a computerized and centralized system. Manual processes lead to "
  "inefficiencies such as data redundancy, difficulty in retrieving records, and delays in reporting health "
  "information. This study aimed to develop a Barangay Health Status Monitoring System to address these "
  "challenges. Specifically, it sought to answer the following questions:")
numbered([
    "What challenges are encountered in the current manual health monitoring system of the barangays in terms of "
    "health record management, monitoring of residents’ health, data accuracy and consistency, reporting and "
    "information retrieval, and efficiency and accessibility?",
    "What system design and features should be integrated into the Barangay Health Status Monitoring System to "
    "improve the recording, storage, and management of residents’ health data?",
    "How do the users evaluate the developed system in terms of effectiveness, efficiency, and user-friendliness?",
])

H2("Objectives of the Study")
P("The general objective of this study is to develop a Barangay Health Status Monitoring System that "
  "centralizes and improves the management of the health data of barangay residents. Specifically, the study "
  "aims:")
numbered([
    "To identify and analyze the challenges encountered in the current manual health monitoring system in terms "
    "of health record management, monitoring of residents’ health, data accuracy and consistency, reporting and "
    "information retrieval, and efficiency and accessibility.",
    "To design and develop a web-based system that improves the recording, storage, and management of "
    "residents’ health data through resident registration, vital-sign triage, maternal and child health "
    "monitoring, referrals, surveillance reports, and role-based access control.",
    "To determine the effectiveness, efficiency, and user-friendliness of the developed system based on user "
    "evaluation.",
])

H2("Scope and Delimitation")
P("This study covers the design, development, and evaluation of the Barangay Health Status Monitoring System "
  "for the barangay health stations of Palaquio, Tabiog, and Babangcag in the Municipality of Bucay, Abra. The "
  "system is organized into ten modules: resident registry, new patient intake, vital signs and triage, the "
  "medical patient chart, maternal care and antenatal care (ANC) tracking, child immunization (EPI) tracking, "
  "referral slips, morbidity surveillance analytics, workstation diagnostics and cloud synchronization, and "
  "user account management.")
P("The users of the system are barangay health workers (BHWs), nurses and midwives, the municipal health "
  "officer (doctor), barangay officials who view summary reports only, and the system administrator. Each "
  "user is given the modules appropriate to his or her role, and the administrator may grant or remove "
  "modules for individual users. The system runs in a web browser and stores data on the workstation first, "
  "so that the health station can continue working without an internet connection, and it synchronizes the "
  "data to a Supabase cloud database when a connection is available.")
P("The study does not include integration with national health information systems of the Department of "
  "Health, a native mobile application, SMS or push notifications, or advanced analytics such as predictive "
  "modeling and AI-based diagnosis. The system automatically classifies blood pressure, temperature, and body "
  "mass index; heart rate and respiratory rate are recorded but are left to the judgment of the attending "
  "health worker, and oxygen saturation is not recorded. The system supports, but does not replace, the "
  "clinical judgment of health personnel. The needs assessment and the evaluation were limited to "
  f"{N} respondents from the three barangays, and actual recording and reporting times were not measured "
  "before and after deployment.")

H2("Significance of the Study")
P("This study will benefit the following:", indent=False)
for who, what in [
    ("Barangay Health Workers (BHWs).", "The system reduces their manual workload in registering residents and "
     "recording vital signs, and gives them a list of children who missed vaccinations for follow-up home visits."),
    ("Nurses and Midwives.", "The system provides accurate and accessible patient data, flags high-risk "
     "pregnancies and abnormal vital signs automatically, and prepares referral slips, supporting timely "
     "interventions in maternal care and adult health monitoring."),
    ("Municipal Health Officer.", "The system gives the physician a longitudinal medical chart for each resident "
     "and morbidity surveillance reports for the three barangays."),
    ("Barangay Officials.", "The system supports decision-making through reliable summary reports, enabling "
     "better planning of health programs without exposing individual patient records."),
    ("Residents (Children, Pregnant Women, and Adults).", "The system supports better health monitoring, earlier "
     "detection of conditions such as hypertension and fever, and more complete vaccination of children."),
    ("Future Researchers.", "This study serves as a reference for the development of similar offline-capable "
     "health information systems for rural communities."),
]:
    P(f"**{who}** {what}")

H3("Sustainable Development Goals (SDGs)")
P("This study supports the following Sustainable Development Goals of the United Nations (2023):")
for goal, what in [
    ("SDG 3: Good Health and Well-being.", "The system promotes better health services by improving the "
     "monitoring of children, pregnant women, and adults and the tracking of illnesses."),
    ("SDG 9: Industry, Innovation, and Infrastructure.", "The system contributes to innovation by providing a "
     "web-based platform that strengthens digital health infrastructure in rural barangays."),
    ("SDG 11: Sustainable Cities and Communities.", "The system helps build healthier communities through "
     "improved local health management."),
]:
    P(f"**{goal}** {what}")

H2("Definition of Terms")
for term, meaning in [
    ("Antenatal Care (ANC)", "the prenatal check-ups of a pregnant resident, tracked by the system across four visits."),
    ("Audit Trail", "the record kept by the system of who performed each action, on which record, and when, in compliance with RA 10173."),
    ("Barangay Health Status Monitoring System (BHSMS)", "the web-based system developed in this study to collect, store, manage, and analyze the health data of barangay residents."),
    ("Body Mass Index (BMI)", "a measure of body weight relative to height (kg/m²), computed automatically by the system and classified using the WHO Asia-Pacific cut-offs."),
    ("Clinical Flag", "a label the system attaches to a vital-sign record when a reading crosses a threshold, such as Stage 2 Hypertension or Febrile Illness Alert."),
    ("Dashboard", "the home page of each user that summarizes the health data, alerts, and tasks relevant to the user’s role."),
    ("Data Privacy", "the protection of residents’ personal and health information by restricting access to authorized users only."),
    ("Defaulter", "a child who is older than the scheduled age of a vaccine but has not yet received it."),
    ("Expanded Program on Immunization (EPI)", "the DOH vaccination schedule for children from birth to twelve months that the system uses to track immunizations."),
    ("Health Record", "the digital file containing a resident’s personal information, vital signs, consultations, and program records."),
    ("Module", "a functional part of the system, such as Vitals and Triage or Maternal Care, that can be granted to or removed from a user."),
    ("Offline-First", "the design in which the system saves data in the browser of the workstation first, so that it keeps working without internet, and synchronizes to the cloud later."),
    ("Prototype Model", "the development approach in which an initial version of the system is built, tested with users, and improved based on their feedback."),
    ("Referral Slip (RF-1)", "the standardized form generated by the system to transfer a patient to the Municipal Health Office or a hospital."),
    ("Resident", "a person living in the barangay whose health information is recorded and monitored in the system."),
    ("Role-Based Access Control (RBAC)", "the security approach in which each user’s role and assigned modules determine the pages and actions available to the user."),
    ("Row-Level Security (RLS)", "a database feature that restricts which records each user may read or change (Supabase, 2026)."),
    ("Soundex", "a phonetic code used by the system to recognize names that sound alike, such as “Dela Cruz” and “De la Cruz,” and warn of possible duplicate registrations."),
    ("Supabase", "the cloud platform that provides the PostgreSQL database, authentication, and file storage used by the system."),
    ("System User", "an authorized barangay health worker, nurse, midwife, doctor, barangay official, or administrator who uses the system."),
    ("Triage Severity", "the level assigned by the system to a vital-sign record: Normal, Elevated, High, or Critical."),
    ("Unique Patient Identifier (UPI)", "the code assigned to every registered resident in the format BHS-[barangay]-[year]-[sequence]."),
    ("Weighted Mean", "the average of the Likert-scale ratings given by the respondents, used to interpret their level of agreement."),
]:
    P(f"**{term}** – In this study, it refers to {meaning}")

# ================================================================ CHAPTER II
H1("CHAPTER II", "METHODOLOGY")
P("This chapter presents the research methodology used in the study. It describes the research design, the "
  "respondents and sampling technique, the system development approach, the development tools, and the "
  "procedures and instruments used in gathering and analyzing the data.")

H2("Research Design")
P("The study used a descriptive-developmental research design. It is descriptive because it identifies and "
  "analyzes the challenges encountered in the current manual health monitoring system of the barangays through "
  "a structured questionnaire. It is developmental because it involves the design, development, and evaluation "
  "of the Barangay Health Status Monitoring System as a practical solution to these challenges. The "
  "development followed the Prototype Model, ensuring a structured process from requirements gathering to "
  "deployment and evaluation.")

H2("Population and Sampling")
P(f"The study used purposive sampling. Respondents were selected because of their direct involvement in the "
  f"health services of their barangay and in the recording and monitoring of residents’ health data. A total of "
  f"{N} respondents participated: {N_BRGY['Palaquio']} from Barangay Palaquio, {N_BRGY['Tabiog']} from "
  f"Barangay Tabiog, and {N_BRGY['Babangcag']} from Barangay Babangcag, as shown in Table 1. They consisted of "
  f"barangay health workers, midwives, and other authorized health personnel who answered both the "
  f"questionnaire on the challenges of the manual system and the evaluation of the developed system.")
caption("Table 1. Distribution of Respondents by Barangay")
table(["Barangay", "Number of Respondents (n)", "Percentage (%)"],
      [[b, N_BRGY[b], f"{N_BRGY[b] / N * 100:.2f}"] for b in BRGYS] + [["Total", N, "100.00"]],
      widths=[2.2, 2.0, 1.6], bold_last=True)
P("Respondents were included if they were directly involved in the barangay’s health services, had experience "
  "with the current manual records, were willing to participate, and gave their informed consent. Those who "
  "declined to participate or returned substantially incomplete questionnaires were excluded.")

H2("System Development Approach")
P("The system was developed using the Prototype Model, which allows iterative development through continuous "
  "user feedback (Figure 2). Each cycle produced a working version of the system that was shown to the users, "
  "and their feedback was used to refine the next version.")
figure("Figure 2. Prototype Development Cycle", "use the prototype cycle diagram from the original manuscript")
for phase, text in [
    ("Requirements Gathering.", f"The researchers identified the existing problems in the barangays’ health "
     f"monitoring process through the questionnaire answered by {N} respondents, interviews with health "
     f"workers and midwives, and a review of the logbooks and forms used at the health stations. The required "
     f"functions were defined: resident registration without duplicates, vital-sign recording with automatic "
     f"classification, maternal and immunization tracking, referrals, reports, and access control."),
    ("Quick Design.", "The architecture, the database structure, the user roles, and the screen layouts were "
     "designed. The system was organized into ten modules grouped into frontline intake, clinical care, and "
     "governance, and each role was assigned a default set of modules."),
    ("Prototyping.", "Working versions of the system were built in increments: the database schema and "
     "resident registry; the vital-sign screener and triage rules; maternal care and immunization tracking; "
     "referrals and surveillance reports; and finally user management, the audit trail, and cloud "
     "synchronization."),
    ("Testing.", "Each increment was checked with automated validation scripts covering the clinical rules, "
     "module permissions, the audit trail, and synchronization, together with static type checking and "
     "linting. The prototype was then walked through with the health workers to check its functionality and "
     "usability."),
    ("Refinement.", "Feedback from the users was used to correct errors and improve the screens, for example "
     "by showing the triage result while the vital signs are being typed and by adding a duplicate warning "
     "during registration."),
    ("Deployment and Evaluation.", "The finalized system was installed at the barangay health stations, the "
     "users were oriented, and the evaluation questionnaire was administered after trial use. After "
     "deployment, the system is maintained through user feedback, regular cloud backups, and updates."),
]:
    P(f"**{phase}** {text}")

H2("Development Tools and Technologies")
P("The system was developed using the tools and technologies listed in Table 2.")
caption("Table 2. Development Tools and Technologies")
table(["Tool / Technology", "Purpose"], [
    ["Next.js 16 (App Router)", "Full-stack React framework for the pages, routing, and server routes of the system (Vercel, 2026)"],
    ["React 19 and TypeScript 5", "Component-based user interface with static type checking"],
    ["Tailwind CSS 4", "Responsive styling for desktop and laptop screens at the health stations"],
    ["Supabase (PostgreSQL)", "Cloud database of residents, vital signs, maternal records, immunizations, and audit logs, protected by Row-Level Security (Supabase, 2026)"],
    ["Supabase Auth and Storage", "User sign-in and session management; storage of the synchronized backup files"],
    ["Browser localStorage", "Offline-first storage of records on the workstation"],
    ["Zod", "Validation schemas for resident and vital-sign data"],
    ["Lucide React", "Interface icons"],
    ["ESLint and tsx", "Static code analysis and execution of the automated validation scripts"],
    ["Git and GitHub", "Version control and team collaboration"],
    ["Visual Studio Code", "Integrated development environment (IDE)"],
], widths=[2.0, 4.0])

H2("Data Gathering Procedure")
P("The researchers followed these steps in gathering data:", indent=False)
numbered([
    "Secured permission from the barangay officials and the health personnel of Barangays Palaquio, Tabiog, and Babangcag to conduct the study.",
    "Prepared the questionnaire and submitted it to the adviser for content validation.",
    "Conducted interviews with barangay health workers and midwives and administered Part I of the questionnaire to identify the challenges of the current manual system.",
    "Developed the system through the phases of the Prototype Model, based on the gathered requirements.",
    "Oriented the respondents on the use of the system and allowed them to use it during a trial period.",
    "Administered the evaluation part of the questionnaire to the same respondents.",
    "Tallied, analyzed, and interpreted the collected data using the statistical tools described below.",
])

H2("Data Gathering Instrument")
P("The researchers used a researcher-made questionnaire (Appendix A) composed of two parts. The first part, "
  "the Questionnaire on the Challenges Encountered in the Current Manual Barangay Health Monitoring System, "
  "contains 22 statements rated on a five-point Likert scale (Likert, 1932) and grouped into five areas: health "
  "record management (5 statements), monitoring of residents’ health (5), data accuracy and consistency (4), "
  "reporting and information retrieval (4), and efficiency and accessibility (4). It ends with four open-ended "
  "questions on the most common problems in recording and updating health information, in retrieving and "
  "monitoring records, in preparing and submitting reports, and in tracking residents who need follow-up services.")
P("The second part, the Evaluation of the Barangay Health Status Monitoring System, contains 18 statements "
  "rated on the same scale and grouped into three criteria: effectiveness (6 statements), efficiency (6), and "
  "user-friendliness (6). These criteria follow the ISO 9241-11 view of usability as effectiveness, "
  "efficiency, and satisfaction (ISO, 2018). Interviews with health workers and midwives supplemented the "
  "questionnaire in identifying the system requirements.")

H2("Data Analysis")
P("Frequency and percentage were used to analyze the answers to the open-ended questions, computed as "
  "P = (f / N) × 100, where f is the frequency of a response and N is the total number of responses. Similar "
  "answers were coded, counted, and ranked (Braun & Clarke, 2006).")
P("The weighted mean was used for the Likert-scale items, computed as WM = Σ(f × w) / N, where f is the "
  "number of respondents who chose a scale value, w is the scale value, and N is the number of respondents. "
  "The weighted means were interpreted using the scale in Table 3. For the challenges of the manual system, the "
  "descriptive equivalent expresses the extent of the challenge; for the evaluation of the system, it "
  "expresses the quality of the system.")
caption("Table 3. Five-Point Likert Scale and Interpretation")
table(["Scale", "Range", "Descriptive Rating", "Extent of Challenge", "System Evaluation"],
      [[s, r, dr, de, q] for (s, r, dr, de), q in zip(LEGEND, ["Excellent", "Very Good", "Good", "Fair", "Poor"])],
      widths=[0.6, 1.0, 1.5, 1.4, 1.4])

# ================================================================ CHAPTER III
H1("CHAPTER III", "RESULTS AND DISCUSSION")
P("This chapter presents the findings of the study according to the three problems stated in Chapter I: the "
  "challenges encountered in the current manual health monitoring system, the design and features of the "
  "developed system, and the users’ evaluation of the system.")

H2("Problem 1. What challenges are encountered in the current manual health monitoring system?")
P(f"Part I of the questionnaire was answered by {N} respondents from the three barangays. Tables 4 to 8 present "
  "the combined weighted mean of each statement, and Table 9 summarizes the five areas by barangay.")

def item_table(num, title, group, idx, kind=1):
    caption(f"Table {num}. {title}")
    rows = []
    vals = part1_items if kind == 1 else part2_items
    for k, i in enumerate(idx):
        r = rate(vals[i])
        rows.append([f"{k + 1}. {group[k]}", f2(vals[i]), r[1], r[2] if kind == 1 else r[3]])
    m = avg([vals[i] for i in idx]); r = rate(m)
    rows.append(["Submean", f2(m), r[1], r[2] if kind == 1 else r[3]])
    table(["Indicator", "WM", "Descriptive Rating", "Interpretation"], rows, widths=[3.6, 0.6, 1.0, 0.9], bold_last=True)
    P(f"n = {N}.", indent=False, spacing=1.0, size=10)

AREA_TITLES = ["Challenges in Health Record Management", "Challenges in Monitoring of Residents’ Health",
               "Challenges in Data Accuracy and Consistency", "Challenges in Reporting and Information Retrieval",
               "Challenges in Efficiency and Accessibility"]
m1 = [f2(x) for x in part1_items]
AREA_TEXT = [
    [f"Table 4 shows that the respondents agreed that managing health records on paper is a challenge, with a "
     f"submean of {f2(area_m[0])} (Agree, High). This is the highest-rated of the five areas. The difficulty of "
     f"organizing and maintaining paper-based documents obtained the highest mean of the whole questionnaire, "
     f"{m1[0]} (Strongly Agree, Very High), followed by the time needed to retrieve residents’ records, {m1[1]} "
     f"(Strongly Agree). Maintaining accurate and up-to-date records ({m1[4]}), the effort of updating "
     f"information ({m1[3]}), and records that are misplaced, lost, or damaged ({m1[2]}) were all rated Agree.",
     "These findings agree with Batoon et al. (2022) and Altura et al. (2023), who found that paper-based "
     "records in barangay health centers cause redundancy, loss, and slow retrieval. They point to the need for "
     "a central, searchable record for every resident, which the system provides through the resident registry "
     "and the Unique Patient Identifier."],
    [f"As shown in Table 5, the respondents agreed that monitoring residents’ health with manual records is "
     f"challenging, with a submean of {f2(area_m[1])} (Agree, High). Identifying residents who require "
     f"follow-up consultations obtained the highest mean in this area ({m1[7]}), followed by monitoring the "
     f"health status of residents ({m1[5]}) and tracking residents with recurring illnesses ({m1[6]}). Keeping "
     f"track of scheduled check-ups ({m1[9]}) and monitoring vaccination records ({m1[8]}) were rated lower but "
     f"still Agree.",
     "Because paper records are not organized by risk, health workers cannot easily see which residents need "
     "attention. This supports automatic flagging of abnormal vital signs and high-risk pregnancies and an "
     "automatically computed list of children who missed their vaccinations."],
    [f"Table 6 shows a submean of {f2(area_m[2])} (Agree, High) for data accuracy and consistency. The "
     f"respondents agreed most that manual recording increases the possibility of errors ({m1[10]}) and that "
     f"duplicate records may occur ({m1[11]}). Incomplete information ({m1[12]}) and the time needed to compare "
     f"information across documents ({m1[13]}) obtained the lowest means of the questionnaire, although both "
     f"remain at the Agree level.",
     "These results support validation of required fields, automatic computation of values such as body mass "
     "index and expected date of delivery, and a duplicate check during registration, so that the same resident "
     "is not recorded twice under slightly different spellings."],
    [f"For reporting and information retrieval, Table 7 shows a submean of {f2(area_m[3])} (Agree, High). "
     f"Accessing historical health information for decision-making obtained the highest mean ({m1[17]}), "
     f"followed by generating updated statistics ({m1[16]}), preparing health reports for the barangay or "
     f"municipal health office ({m1[14]}), and consolidating data from different records ({m1[15]}).",
     "Reports that must be compiled by hand from several logbooks take time and invite computation errors. "
     "Automatically generated summaries drawn from a single database address this problem directly."],
    [f"Table 8 shows a submean of {f2(area_m[4])} (Agree, High) for efficiency and accessibility. Protecting "
     f"paper-based records from unauthorized access obtained a mean of {m1[21]}, the only statement on which all "
     f"{N} respondents chose Agree. Sharing health information among authorized personnel ({m1[20]}), the time "
     f"and paperwork of manual monitoring ({m1[18]}), and managing a large volume of records ({m1[19]}) followed.",
     "The concern about unauthorized access is significant because health records are sensitive personal "
     "information under the Data Privacy Act of 2012 (Republic of the Philippines, 2012). A digital system must "
     "therefore restrict each user to the records his or her role requires and keep a record of who accessed them."],
]
for k in range(5):
    item_table(4 + k, AREA_TITLES[k], Q1[k][1], AREA_IDX[k])
    for t in AREA_TEXT[k]:
        P(t)

caption("Table 9. Summary of the Challenges in the Current Manual System")
rows = []
order = sorted(range(5), key=lambda k: -area_m[k])
for k in order:
    per = [avg([item_stats(P1, i)[1][b] for i in AREA_IDX[k]]) for b in BRGYS]
    r = rate(area_m[k])
    rows.append([Q1[k][0][3:].strip()] + [f2(x) for x in per] + [f2(area_m[k]), r[2]])
brgy_all1 = [avg([avg([item_stats(P1, i)[1][b] for i in idx]) for idx in AREA_IDX]) for b in BRGYS]
rows.append(["Overall"] + [f2(x) for x in brgy_all1] + [f2(P1_ALL), rate(P1_ALL)[2]])
table(["Area", "Palaquio", "Tabiog", "Babangcag", "Overall", "Interpretation"], rows,
      widths=[2.2, 0.8, 0.8, 0.9, 0.7, 1.0], bold_last=True)
P(f"Table 9 summarizes the challenges of the manual health monitoring system. The overall weighted mean of "
  f"{f2(P1_ALL)} (Agree) shows that the respondents experience these challenges to a high extent. Health record "
  f"management ranked first ({f2(area_m[0])}), followed by monitoring of residents’ health ({f2(area_m[1])}), "
  f"reporting and information retrieval ({f2(area_m[3])}), efficiency and accessibility ({f2(area_m[4])}), and "
  f"data accuracy and consistency ({f2(area_m[2])}). The three barangays gave similar ratings: Babangcag "
  f"{f2(brgy_all1[2])}, Palaquio {f2(brgy_all1[0])}, and Tabiog {f2(brgy_all1[1])}, all within the Agree range. "
  f"The challenges are therefore common to the three health stations rather than specific to one of them.")
P("The respondents answered four open-ended questions that let them describe the problems in their own words. "
  "Their answers were coded and tallied by barangay in Tables 10 to 13.")

OE_TITLES = ["Common Problems in Recording and Updating Health Information",
             "Difficulties in Retrieving and Monitoring Health Records",
             "Challenges in Preparing and Submitting Health Reports",
             "Problems in Tracking Residents Who Need Follow-Up Services"]
OE_TEXT = [
    "Table 10 shows that time-consuming recording was the most common problem in recording and updating health "
    "information (30.36%), followed by lost or misplaced records (19.64%) and incomplete information (17.86%). "
    "Inaccurate information and difficulty updating records were each cited by 16.07%. These answers confirm the "
    "high ratings for health record management in Table 4.",
    "As shown in Table 11, difficulty finding records was the most frequent problem in retrieving and monitoring "
    "health records (26.79%), followed by disorganized files and time-consuming monitoring (19.64% each), missing "
    "or incomplete records (17.86%), and difficulty tracking a resident’s health history (16.07%).",
    "Table 12 shows that time-consuming report preparation was the main challenge in preparing and submitting "
    "reports (28.57%), followed by incomplete data (19.64%), errors in manual computation and difficulty compiling "
    "statistics (17.86% each), and delayed report submission (16.07%).",
    "Table 13 shows that residents forgetting their appointments was the most common problem in tracking "
    "follow-up services (25.00%), followed by difficulty contacting residents (21.43%), lack of reminders "
    "(19.64%), missed vaccination schedules (17.86%), and difficulty monitoring follow-ups (16.07%). These "
    "problems involve communication with residents, which the system supports through follow-up lists for "
    "home visits but does not fully solve, since SMS reminders are outside its scope.",
]
for k in range(4):
    caption(f"Table {10 + k}. {OE_TITLES[k]}")
    hdr = ["Common Problem", "Palaquio", "Tabiog", "Babangcag", "Total", "%"]
    # SENTENCE PART columns: Barangay 1 = Palaquio (19), 2 = Tabiog (17), 3 = Babangcag (20)
    rows = [r[:6] for r in open_ended[k][1:]]
    table(hdr, rows, widths=[2.4, 0.8, 0.7, 0.9, 0.6, 0.8], bold_last=True)
    P(OE_TEXT[k])
P("Overall, the findings for Problem 1 show that the manual health monitoring system of the three barangays "
  "has four interrelated weaknesses: records are slow to write, find, and update; residents who need attention "
  "are not readily identified; reports must be compiled by hand; and paper records cannot be protected "
  "reliably from unauthorized access.")

H2("Problem 2. What system design and features should be integrated into the Barangay Health Status Monitoring System?")
P("Guided by the findings of Problem 1, the researchers designed and developed the Barangay Health Status "
  "Monitoring System following the IPO framework and the Prototype Model described in Chapter II. Table 14 "
  "traces each identified challenge to the feature that addresses it. The subsections that follow present the "
  "architecture, the clinical rules, the database, the user roles, and each module with its screen.")
caption("Table 14. Challenges Identified and the Corresponding Features of the BHSMS")
table(["Challenge Identified (Problem 1)", "BHSMS Feature (Problem 2)"], [
    [f"Paper records are difficult to organize ({m1[0]}); recording is time-consuming (30.36%)",
     "Electronic registration of every resident with a Unique Patient Identifier; vital signs, consultations, and program records stored under one resident profile"],
    [f"Retrieving records takes time ({m1[1]}); records are difficult to find (26.79%)",
     "Resident registry with search by name or UPI and filters by barangay and purok; medical chart showing the resident’s full history"],
    [f"Duplicate records may occur ({m1[11]}); errors in manual recording ({m1[10]})",
     "Soundex-based duplicate warning during registration; required fields and automatic computation of BMI, expected date of delivery, and gestational age"],
    [f"Difficulty identifying residents who need follow-up ({m1[7]}) and monitoring health status ({m1[5]})",
     "Automatic triage of vital signs into Normal, Elevated, High, or Critical with clinical flags; high-risk pregnancy flags; mandatory referral recommendation for hypertensive crisis"],
    [f"Monitoring vaccination records is difficult ({m1[8]}); missed vaccination schedules (17.86%)",
     "Child EPI module following the DOH schedule, with a defaulter list showing the overdue vaccine, weeks overdue, and purok for home visits"],
    [f"Report preparation is time-consuming ({m1[14]}; 28.57%); compiling statistics is difficult ({m1[16]})",
     "FHSIS morbidity surveillance profile per barangay generated automatically, with ANC coverage and fully immunized child rate; referral slip (RF-1) generated from the record"],
    [f"Protecting paper records from unauthorized access ({m1[21]})",
     "Role-based access with per-user modules, Row-Level Security in the database, and an audit trail of every action (RA 10173)"],
    ["Records lost or damaged (19.64%); unreliable connectivity in rural barangays",
     "Offline-first storage on the workstation and synchronization of a backup to the Supabase cloud when a connection is available"],
], widths=[2.6, 3.4])

H3("a. System Architecture")
P("The BHSMS is a web-based application organized into four layers, as shown in Figure 3. The pages layer, "
  "built with Next.js and React, contains the screens of the system; before any page is shown, a module guard "
  "checks that the signed-in user has been granted that module. The services layer holds the clinical rules "
  "and data operations, such as the evaluation of vital signs and the computation of immunization defaulters. "
  "The workstation layer stores every record in the browser’s local storage first, so a health station can "
  "keep working when the internet connection is lost. The cloud layer is Supabase, which provides user "
  "authentication, the PostgreSQL database protected by Row-Level Security, and file storage. When the "
  "administrator runs synchronization, the local records are bundled into a backup file uploaded to the cloud, "
  "and resident and user records are written to their database tables; if the upload fails, the data remain "
  "on the workstation until the next synchronization.")
caption("Figure 3. System Architecture of the BHSMS")
arch = d.add_table(rows=2, cols=4); arch.style = "Table Grid"; arch.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (head, body) in enumerate([
    ("1. Pages", "Next.js App Router: residents, vitals, maternal, immunizations, referral, analytics, operations, users"),
    ("2. Services", "ClinicalService, AnalyticsService, evaluateVitals(), SupabaseSyncService"),
    ("3. Workstation", "Browser localStorage cache (offline-first)"),
    ("4. Cloud", "Supabase: Auth, PostgreSQL with RLS, audit logs, backup storage"),
]):
    hp = arch.cell(0, i).paragraphs[0]; hp.add_run(head).bold = True; hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    bp = arch.cell(1, i).paragraphs[0]; bp.add_run(body).font.size = Pt(10)
    for p in (hp, bp):
        p.paragraph_format.line_spacing = 1.0; p.paragraph_format.first_line_indent = Inches(0)
P("Module guard (role-based access) → Pages → Services → Workstation cache ⇄ Cloud", indent=False, align="c", italic=True, spacing=1.0, size=10)

H3("b. Clinical Rules and the Vital-Sign Triage Workflow")
P("Figure 4 shows the workflow of a vital-sign encounter. The health worker selects a resident and enters the "
  "systolic and diastolic blood pressure, heart rate, respiratory rate, temperature, weight, and height. As the "
  "values are typed, the system evaluates them and shows the severity, the clinical flags, the body mass index, "
  "and whether a referral is recommended. When the encounter is saved, the system evaluates the values again, "
  "adds the resident, the user, and the time, and stores the record. Table 15 lists the thresholds applied. "
  "Blood pressure sets the base severity using the Philippine clinical practice guidelines for hypertension, "
  "with whichever of the systolic or diastolic value falls in the higher band deciding the result. A fever "
  "raises a Normal severity to Elevated, and only a hypertensive crisis makes a referral mandatory. The "
  "accepted ranges of each reading are enforced by the database to reject impossible values.")
figure("Figure 4. Vital-Sign Triage Workflow", "Select resident → Enter 7 readings → Live evaluation → Save → Stored offline → Synced to cloud")
caption("Table 15. Clinical Thresholds Applied by the System")
table(["Measure", "Threshold", "Classification / Flag", "Severity"], [
    ["Blood pressure", "Below 120/80 mmHg", "Normal", "Normal"],
    ["Blood pressure", "SBP 120–139 or DBP 80–89", "Pre-hypertension", "Elevated"],
    ["Blood pressure", "SBP 140–179 or DBP 90–119", "Stage 2 hypertension", "High"],
    ["Blood pressure", "SBP ≥ 180 or DBP ≥ 120", "Hypertensive crisis; referral required", "Critical"],
    ["Temperature", "≥ 38.0 °C", "Febrile illness alert", "At least Elevated"],
    ["BMI (WHO Asia-Pacific)", "< 18.5 / 18.5–22.9 / 23.0–24.9", "Underweight (flagged) / Normal / Overweight", "—"],
    ["BMI (WHO Asia-Pacific)", "25.0–29.9 / ≥ 30.0", "Obese Class I / Obese Class II (flagged)", "—"],
    ["Maternal age", "Under 18 / 35 and over", "Adolescent pregnancy / Advanced maternal age", "High-risk flag"],
    ["Parity", "Gravida or para ≥ 5", "Grand multiparity", "High-risk flag"],
], widths=[1.3, 1.6, 2.2, 0.9], size=10)

H3("c. Database Design")
P("Figure 5 presents the entity-relationship diagram of the database. The profiles table stores each user’s "
  "name, role, barangay, and assigned modules. The households and residents tables store the census of each "
  "barangay; every resident has a Unique Patient Identifier and a Soundex key for duplicate detection. The "
  "vital_signs table stores each encounter with its severity, clinical flags, and referral recommendation. The "
  "maternal_records and antenatal_visits tables store each pregnancy and its four ANC visits, and the "
  "immunizations table stores each vaccine dose of a child. The disease_surveillance_reports table stores case "
  "counts per epidemiological week, and the audit_logs table records every action for compliance with the Data "
  "Privacy Act. Every table is protected by Row-Level Security policies that restrict reading and writing by role.")
figure("Figure 5. Entity-Relationship Diagram of the BHSMS", "profiles, households, residents, vital_signs, maternal_records, antenatal_visits, immunizations, disease_surveillance_reports, audit_logs")

H3("d. User Roles and Access")
P("Access to the system is governed by role-based access control, summarized in Table 16. Each role receives a "
  "default set of modules, and the administrator may grant or remove modules for an individual user; for "
  "example, a nurse may be given access to the medical patient chart. Barangay officials see summary reports "
  "only and never individual patient records.")
caption("Table 16. User Roles and Default Module Access")
table(["Role", "Default Modules"], [
    ["Barangay Health Worker (BHW)", "Resident Registry, New Patient Intake, Vitals and Triage, Child EPI"],
    ["Nurse / Midwife", "Resident Registry, New Patient Intake, Vitals and Triage, Maternal Care, Child EPI, Hospital Referrals"],
    ["Doctor (Municipal Health Officer)", "Resident Registry, Vitals and Triage, Medical Patient Chart, Maternal Care, Child EPI, Hospital Referrals, Epidemiology Analytics"],
    ["Barangay Official (LGU Viewer)", "Epidemiology Analytics, Operations and Backup (summary data only)"],
    ["System Administrator", "All ten modules, including User Management"],
], widths=[2.0, 4.0])

MODULES = [
    ("e. Sign-In and Role-Based Dashboard", "Users sign in with their employee ID or e-mail address and password "
     "(Plate 1). Each user then sees a dashboard designed for his or her role (Plate 2): a BHW sees registration "
     "and vaccination tasks, a midwife sees pregnancies and triage alerts, the doctor sees clinical summaries, a "
     "barangay official sees community health indicators, and the administrator sees the status of the "
     "workstation and of cloud synchronization.", [0, 1]),
    ("f. Resident Registry and New Patient Intake", "The resident registry (Plate 3) lists every registered "
     "resident with a search by name or UPI and filters by barangay and purok. On the New Patient Intake page "
     "(Plate 4), the health worker enters the resident’s name, date of birth, sex, civil status, barangay, purok, "
     "contact number, PhilHealth ID, and pregnancy status. As the name and birth date are typed, the system "
     "computes a match key from the Soundex code of the surname, the first three letters of the first name, and "
     "the date of birth, and warns if a resident with the same key already exists. Saving the record issues the "
     "resident’s Unique Patient Identifier.", [2, 3]),
    ("g. Hemodynamic Screener and Triage", "The vitals page (Plate 5) records the seven readings and displays "
     "the triage result as they are typed, using the rules in Table 15. The severity is shown as a colored "
     "badge, and the history of the resident’s previous readings is listed below the form.", [4]),
    ("h. Medical Patient Chart", "The medical chart (Plate 6) opens from the resident registry and shows the "
     "resident’s consultation history, past vital signs, and a form for recording a new encounter with the "
     "physician’s impression and plan. It is available to the doctor and the administrator, and to nurses "
     "granted this module.", [5]),
    ("i. Maternal Care and ANC Tracking", "The maternal care page (Plate 7) enrolls a pregnant resident with her "
     "obstetric history (gravida, para, full-term, preterm, abortions, and living children) and last menstrual "
     "period. The system computes the expected date of delivery using Naegele’s rule (LMP + 1 year − 3 months + 7 "
     "days) and the gestational age, flags high-risk pregnancies (Table 15), and tracks four ANC visits with "
     "blood pressure, weight, fundic height, fetal heart tone, and iron-folic acid supplementation.", [6]),
    ("j. Child EPI and Defaulter Tracking", "The immunization page (Plate 8) follows the DOH Expanded Program on "
     "Immunization schedule of fourteen doses from birth to twelve months: BCG and hepatitis B at birth; "
     "pentavalent, oral polio, and pneumococcal vaccines at 6, 10, and 14 weeks, with inactivated polio at 14 "
     "weeks; measles-rubella at 9 months; and MMR at 12 months. The system compares each child’s age in weeks "
     "with this schedule and lists every child who is past the target age of a dose not yet given, with the "
     "number of weeks overdue and the purok, so that BHWs can conduct home visits.", [7]),
    ("k. Referral Slip (RF-1)", "The referral page (Plate 9) generates a standardized referral slip for a "
     "patient transferred to the Municipal Health Office or a hospital, with the patient’s details, latest vital "
     "signs, and clinical flags. The reason is filled in automatically for a hypertensive crisis or a pregnant "
     "patient and entered by the health worker otherwise.", [8]),
    ("l. FHSIS Morbidity Surveillance", "The analytics page (Plate 10) generates a health profile of each "
     "barangay: the population by purok; counts of hypertensive crisis, stage 2 hypertension, febrile illness, "
     "suspected dengue (fever with “dengue” or “petechiae” in the notes), and acute respiratory infection (other "
     "febrile cases); the number of active pregnancies and the four-visit ANC coverage; and the fully immunized "
     "child rate, defined as children who received all nine core vaccines. This replaces the manual "
     "compilation of reports reported by the respondents.", [9]),
    ("m. Workstation Diagnostics and Synchronization", "The operations page (Plate 11) shows the records stored "
     "on the workstation, the storage used, and the connection status, and lets the administrator synchronize "
     "the data to the cloud and export a backup.", [10]),
    ("n. User Accounts and Module Permissions", "The user management page (Plate 12) lets the administrator "
     "create accounts, assign one of the five roles, and grant or remove individual modules for each user.", [11]),
]
for head, text, plates in MODULES:
    H3(head)
    P(text)
    for k in plates:
        placeholder(f"Insert screenshot — {PLATES[k]}")
        caption(PLATES[k])

H3("o. Summary of Security and Data-Integrity Measures")
P("Beyond the module-specific measures described above, the system incorporates several system-wide "
  "safeguards: a module guard that hides every page a user has not been granted; Row-Level Security policies "
  "on every database table; range checks in the database that reject impossible vital-sign values; duplicate "
  "detection during registration; an audit trail that records the actor, action, record, and time of every "
  "change; and offline storage with cloud backup that protects records from loss. These measures address the "
  "respondents’ concern about protecting health records from unauthorized access and support compliance with "
  "the Data Privacy Act of 2012.")
P("Taken together, the features presented in this section answer Problem 2 by translating the manual, "
  "logbook-based health monitoring practices identified under Problem 1 into a centralized, offline-capable, "
  "and secure digital system.")

H2("Problem 3. How do the users evaluate the developed system in terms of effectiveness, efficiency, and user-friendliness?")
P(f"After the trial use, the same {N} respondents evaluated the system using the second part of the "
  "questionnaire. Tables 17 to 19 present the combined weighted mean of each statement, and Table 20 "
  "summarizes the three criteria by barangay.")
m2 = [f2(x) for x in part2_items]
CRIT_TITLES = ["Evaluation of the System in Terms of Effectiveness", "Evaluation of the System in Terms of Efficiency",
               "Evaluation of the System in Terms of User-Friendliness"]
CRIT_TEXT = [
    [f"Table 17 shows that the respondents agreed that the system is effective, with a submean of "
     f"{f2(crit_m[0])} (Agree, Very Good). They rated most highly that the system allows users to retrieve "
     f"residents’ records correctly ({m2[1]}), records health information accurately ({m2[0]}), and helps monitor "
     f"the health status of residents ({m2[2]}). Reducing errors and duplicate records obtained {m2[5]}.",
     f"The lowest-rated statements were that the system generates accurate and relevant health reports "
     f"({m2[4]}) and helps track residents who require follow-up services ({m2[3]}), on which several "
     f"respondents chose Neutral. These functions depend on records accumulating over time: surveillance "
     f"reports and follow-up lists become more useful as more encounters are entered, which a short trial "
     f"period cannot fully show."],
    [f"As shown in Table 18, the respondents agreed that the system is efficient, with a submean of "
     f"{f2(crit_m[1])} (Agree, Very Good). Making it easier to update residents’ health information and reducing "
     f"the paperwork of health monitoring obtained the highest means of the whole evaluation, {m2[8]} each. "
     f"Reducing the time needed to record information ({m2[6]}), simplifying report preparation ({m2[9]}), and "
     f"completing tasks with less effort ({m2[11]}) followed.",
     f"Retrieving health records quickly obtained the lowest mean in this area ({m2[7]}). Since retrieval was "
     f"also one of the main problems of the manual system, this result suggests that users need more familiarity "
     f"with the search and filter functions of the registry, which can be addressed in the orientation of users."],
    [f"Table 19 shows that the respondents agreed that the system is user-friendly, with a submean of "
     f"{f2(crit_m[2])} (Agree, Very Good), the highest of the three criteria. Clear instructions or feedback when "
     f"performing tasks, ease of navigation between features, and an understandable layout each obtained "
     f"{m2[15]}, followed by ease of learning ({m2[14]}). A clear interface and understandable menus and buttons "
     f"each obtained {m2[12]}.",
     "These results suggest that health workers with varied levels of computer experience could learn and use "
     "the system, which, according to the Technology Acceptance Model, supports its acceptance and continued use "
     "(Davis, 1989)."],
]
for k in range(3):
    item_table(17 + k, CRIT_TITLES[k], Q2[k][1], CRIT_IDX[k], kind=2)
    for t in CRIT_TEXT[k]:
        P(t)

caption("Table 20. Summary of the Evaluation by Criterion and Barangay")
rows = []
brgy_crit = []
for k in range(3):
    per = [avg([item_stats(P2, i)[1][b] for i in CRIT_IDX[k]]) for b in BRGYS]
    brgy_crit.append(per)
    rows.append([Q2[k][0][3:].strip()] + [f2(x) for x in per] + [f2(crit_m[k]), rate(crit_m[k])[3]])
brgy_all2 = [avg([brgy_crit[k][j] for k in range(3)]) for j in range(3)]
rows.append(["Overall"] + [f2(x) for x in brgy_all2] + [f2(P2_ALL), rate(P2_ALL)[3]])
table(["Criterion", "Palaquio", "Tabiog", "Babangcag", "Overall", "Interpretation"], rows,
      widths=[1.8, 0.8, 0.8, 0.9, 0.7, 1.2], bold_last=True)
P(f"Table 20 summarizes the evaluation. The respondents rated the system at an overall weighted mean of "
  f"{f2(P2_ALL)}, interpreted as Agree and Very Good. User-friendliness obtained the highest mean "
  f"({f2(crit_m[2])}), followed by efficiency ({f2(crit_m[1])}) and effectiveness ({f2(crit_m[0])}). By barangay, "
  f"Palaquio gave the highest rating ({f2(brgy_all2[0])}, Very Good), with effectiveness rated "
  f"{f2(brgy_crit[0][0])} ({rate(brgy_crit[0][0])[3]}), followed by Babangcag ({f2(brgy_all2[2])}) and Tabiog "
  f"({f2(brgy_all2[1])}). No respondent rated any statement Disagree or Strongly Disagree. These results "
  f"indicate that the users regard the system as effective, efficient, and easy to use, directly answering "
  f"Problem 3.")

# ================================================================ CHAPTER IV
H1("CHAPTER IV", "CONCLUSIONS AND RECOMMENDATIONS")
H2("Conclusions")
P("This study was conducted to develop the Barangay Health Status Monitoring System in order to address the "
  "challenges of the manual health monitoring system of Barangays Palaquio, Tabiog, and Babangcag. Based on the "
  "findings presented in Chapter III, the following conclusions are drawn.")
numbered([
    f"On the challenges of the manual system, the respondents experience them to a high extent (overall "
    f"weighted mean of {f2(P1_ALL)}, Agree), most strongly in health record management ({f2(area_m[0])}), where "
    f"the difficulty of organizing paper records was rated Strongly Agree ({m1[0]}). Their most common problems "
    f"are time-consuming recording (30.36%), difficulty finding records (26.79%), time-consuming report "
    f"preparation (28.57%), and residents forgetting appointments (25.00%). The manual system is weak in four "
    f"respects: records are slow to write, find, and update; residents who need attention are not readily "
    f"identified; reports must be compiled by hand; and paper records are hard to protect.",
    "On the design and development of the system, the Barangay Health Status Monitoring System was successfully "
    "built as an offline-first web application using Next.js, React, TypeScript, Tailwind CSS, and Supabase, "
    "following the IPO framework and the Prototype Model. It answers each identified challenge through resident "
    "registration with a Unique Patient Identifier and duplicate detection, automatic triage of vital signs based "
    "on Philippine and WHO guidelines, maternal care with high-risk flags, immunization tracking with a defaulter "
    "list, referral slips, automatically generated surveillance reports, and role-based access with an audit trail.",
    f"On the evaluation of the system, the respondents rated it at an overall weighted mean of {f2(P2_ALL)} "
    f"(Agree, Very Good): user-friendliness {f2(crit_m[2])}, efficiency {f2(crit_m[1])}, and effectiveness "
    f"{f2(crit_m[0])}. The lowest-rated items concern report accuracy and follow-up tracking, functions whose "
    f"value grows as records accumulate.",
])
P("Taken together, these findings show that the general objective of the study was achieved within its scope. "
  "The conclusions should be read with its limitations in mind: the respondents came from three barangays, the "
  "trial period was short, the system was not evaluated by IT specialists, and actual recording and reporting "
  "times were not measured before and after deployment.")

H2("Recommendations")
P("Based on the conclusions, the following recommendations are offered.")
for head, text in [
    ("a. For the Barangay Health Stations and the Municipal Health Office.",
     "Adopt the system through a pilot implementation in the three barangays alongside the existing logbooks, "
     "encode the existing paper records of priority residents (pregnant women, children under one year, and "
     "adults with hypertension), conduct hands-on orientation for all users with emphasis on searching and "
     "filtering records, and designate a system administrator to manage accounts and perform regular "
     "synchronization and backups."),
    ("b. For System Enhancement and Future Development.",
     "Add SMS reminders for scheduled check-ups, ANC visits, and vaccinations, which address the most common "
     "follow-up problem reported by the respondents; add automatic flags for abnormal heart rate and respiratory "
     "rate and a field for oxygen saturation; synchronize vital signs and program records to their own cloud "
     "tables rather than only to the backup file; develop an installable mobile version for house-to-house "
     "visits; and explore integration with the reporting systems of the Department of Health."),
    ("c. For Future Researchers.",
     "Measure the actual effect of the system by comparing recording, retrieval, and report-preparation times "
     "before and after implementation; include IT specialists in the evaluation to assess security, "
     "maintainability, and performance; and replicate the study in other barangays of Bucay with a larger "
     "and more varied group of respondents."),
    ("d. For Continuous Evaluation and Improvement.",
     "Review the surveillance reports every quarter to identify health trends and unvaccinated children, "
     "re-evaluate the system after a full year of use, and conduct periodic security reviews to ensure that "
     "residents’ health information remains protected as the number of users grows."),
]:
    P(f"**{head}** {text}")

# ================================================================ REFERENCES
d.add_heading("REFERENCES", level=1).paragraph_format.page_break_before = True
REFS = [
    "Altura, K. A. P., Madjalis, H. E. C., Sungahid, M. D. G., Serrano, E. A., & Rodriguez, R. L. (2023). Development of a web-based barangay health information system for Barangay 69, Tondo, Manila.",
    "Batoon, J. A., Benitez, A. B., Cajucom, K. Z., Dalusung, M. J. M., Faustino, S. J. D., Galvez, I. N. D., & Mercado, L. J. L. (2022). Public health record management system (PHRMS) for Barangay Sto. Rosario, Paombong, Bulacan.",
    "Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. Qualitative Research in Psychology, 3(2), 77–101. https://doi.org/10.1191/1478088706qp063oa",
    "Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319–340. https://doi.org/10.2307/249008",
    "Department of Health. (n.d.). eHealth and digital health initiatives in the Philippines. https://www.doh.gov.ph",
    "Garcia, M. R. Q., Jimenez, K. L. D., Simacon, R. R. O., Vito, M. C. C., & Yabut, E. R. (2021). B-Health: A framework for mobile and web application for barangay health center in the Municipality of Laguna. In 2021 1st International Conference in Information and Computing Research (iCORE).",
    "International Organization for Standardization. (2018). ISO 9241-11:2018 Ergonomics of human-system interaction — Part 11: Usability: Definitions and concepts. https://www.iso.org/standard/63500.html",
    "Likert, R. (1932). A technique for the measurement of attitudes. Archives of Psychology, 22(140), 1–55.",
    "Philippine Heart Association–Philippine Society of Hypertension. (2020). 2020 clinical practice guidelines for the management of hypertension in the Philippines.",
    "Republic of the Philippines. (2012). Republic Act No. 10173: Data Privacy Act of 2012. https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html",
    "Sumaylo, D. J. F. (2013). Information delivery in the provision of barangay health services in Barangay Dawis, Digos City, Philippines.",
    "Supabase. (2026). Row level security. Supabase Docs. https://supabase.com/docs/guides/database/postgres/row-level-security",
    "United Nations. (2023). Sustainable development goals. https://sdgs.un.org/goals",
    "Vercel. (2026). Next.js documentation. https://nextjs.org/docs",
    "WHO Expert Consultation. (2004). Appropriate body-mass index for Asian populations and its implications for policy and intervention strategies. The Lancet, 363(9403), 157–163. https://doi.org/10.1016/S0140-6736(03)15268-3",
    "World Health Organization. (2021). Global strategy on digital health 2020–2025. https://www.who.int/publications/i/item/9789240020924",
]
for ref in REFS:
    p = P(ref, indent=False, align="l", spacing=1.0)
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.first_line_indent = Inches(-0.5)
    p.paragraph_format.space_after = Pt(12)

# ================================================================ APPENDIX A (from the questionnaire file, not the PDF)
d.add_heading("APPENDIX A", level=1).paragraph_format.page_break_before = True
P("QUESTIONNAIRE ON THE CHALLENGES ENCOUNTERED IN THE CURRENT MANUAL BARANGAY HEALTH MONITORING SYSTEM",
  indent=False, align="c", bold=True, spacing=1.0)
P("Purpose: This questionnaire aims to identify the challenges encountered by barangay health workers and other "
  "authorized personnel in managing health records and monitoring the health status of residents using the "
  "current manual system.", spacing=1.0)
P("Scale: 5 – Strongly Agree   4 – Agree   3 – Neutral   2 – Disagree   1 – Strongly Disagree",
  indent=False, spacing=1.0)

def instrument(groups):
    rows = []
    for head, items in groups:
        rows.append([head, "", "", "", "", ""])
        rows += [[f"{i}. {s}", "", "", "", "", ""] for i, s in enumerate(items, 1)]
    t = table(["Statement", "5", "4", "3", "2", "1"], rows, widths=[4.0, 0.4, 0.4, 0.4, 0.4, 0.4], size=10)
    for r in t.rows[1:]:
        if re.match(r"^[A-E]\.", r.cells[0].text):
            for run in r.cells[0].paragraphs[0].runs:
                run.bold = True

P("Part I. Challenges in the Current Manual Health Monitoring System", indent=False, bold=True, spacing=1.0)
instrument(Q1)
P("Part II. Open-Ended Questions. Please answer briefly based on your experience.", indent=False, bold=True, spacing=1.0)
for i, q in enumerate([
    "What are the most common problems you encounter when recording and updating residents’ health information?",
    "What difficulties do you experience when retrieving and monitoring residents’ health records?",
    "What challenges do you encounter when preparing and submitting barangay health reports?",
    "What problems arise when tracking residents who need follow-up consultations, vaccinations, or other health services?",
], 1):
    P(f"{i}. {q}", indent=False, spacing=1.0)
    P("_" * 70, indent=False, spacing=1.5)
P("Part III. Evaluation of the Barangay Health Status Monitoring System", indent=False, bold=True, spacing=1.0)
P("Instructions: Please evaluate the developed Barangay Health Status Monitoring System based on your experience "
  "in using it. Put a check mark (✓) in the column that corresponds to your level of agreement with each statement.",
  spacing=1.0)
instrument(Q2)

d.save(OUT)
print(f"wrote {OUT}")
print(f"Part I overall {P1_ALL:.2f}, areas {[round(x, 2) for x in area_m]}")
print(f"Part II overall {P2_ALL:.2f}, criteria {[round(x, 2) for x in crit_m]}")
