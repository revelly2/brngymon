"""Builds docs/paper/BHSMS_Capstone_Paper.docx in the format of the QueUA paper.

The QueUA .docx is opened as the template (styles, fonts, page setup), its body is cleared,
and the BHSMS paper is written in QueUA's section order from the survey sources in BRNGT.

Usage: python build_paper.py [BRNGT folder]
Needs: pip install python-docx; pdftotext (optional, for the acknowledgement and dedication)
"""
import sys, re, subprocess, shutil
from pathlib import Path
import docx
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else "Z:/Users/Admin/Desktop/BRNGT")
TEMPLATE = SRC / "QueUA_Full_Paper-w-from-mam-cris.docx"
OUT = Path(__file__).with_name("BHSMS_Capstone_Paper.docx")
BRGYS = ("Palaquio", "Tabiog", "Babangcag")
N_BRGY = {"Palaquio": 19, "Tabiog": 17, "Babangcag": 20}
AUTHORS = ("Katlyne Biendima", "Christian Angel Parado", "Ryan Justine Bisnan", "Dave Lester Bisnan", "Mark Bolanos")

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
    open_ended.append([[cell_text(tc) for tc in r._tr.tc_lst] for r in t.rows])

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

part1_items = [item_stats(P1, i)[0] for i in range(22)]
part2_items = [item_stats(P2, i)[0] for i in range(18)]
AREA_IDX = [range(0, 5), range(5, 10), range(10, 14), range(14, 18), range(18, 22)]
CRIT_IDX = [range(0, 6), range(6, 12), range(12, 18)]
area_m = [avg([part1_items[i] for i in idx]) for idx in AREA_IDX]
crit_m = [avg([part2_items[i] for i in idx]) for idx in CRIT_IDX]
P1_ALL, P2_ALL = avg(area_m), avg(crit_m)
N = sum(N_BRGY.values())
m1 = [f2(x) for x in part1_items]
m2 = [f2(x) for x in part2_items]

# ---------------------------------------------------------------- template: QueUA styles, empty body
d = docx.Document(TEMPLATE)
body = d.element.body
for el in list(body):
    if not el.tag.endswith("}sectPr"):
        body.remove(el)
for rid, rel in list(d.part.rels.items()):
    if any(k in rel.reltype for k in ("/image", "/hyperlink", "/comments", "/footer", "/header", "commentsExtended",
                                       "commentsIds", "commentsExtensible", "/people")):
        del d.part.rels[rid]
for ref in body.iter(qn("w:footerReference")):
    ref.getparent().remove(ref)

FONT = "Courier New"
GRID = next(s for s in d.styles if s.type == WD_STYLE_TYPE.TABLE and s.style_id == "TableGrid")

def boxed(t):
    # QueUA's TableGrid style draws no lines, so every data table gets explicit single borders
    tblPr = t._tbl.tblPr
    for old in tblPr.findall(qn("w:tblBorders")):
        tblPr.remove(old)
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        el = OxmlElement(f"w:{edge}")
        for k, v in (("val", "single"), ("sz", "6"), ("space", "0"), ("color", "000000")):
            el.set(qn(f"w:{k}"), v)
        borders.append(el)
    insert_before(tblPr, borders, ("shd", "tblLayout", "tblCellMar", "tblLook", "tblCaption", "tblDescription"))
normal = d.styles["Normal"]
normal.font.name = FONT
for attr in ("w:eastAsia", "w:cs"):
    normal.element.get_or_add_rPr().get_or_add_rFonts().set(qn(attr), FONT)

def caption_style(name):
    s = d.styles.add_style(name, WD_STYLE_TYPE.PARAGRAPH)
    s.base_style = normal
    s.font.name = FONT; s.font.bold = True; s.font.size = Pt(12)
    pf = s.paragraph_format
    pf.line_spacing = 1.08; pf.space_before = Pt(12); pf.space_after = Pt(4.8); pf.keep_with_next = True
for n in ("Table Caption", "Figure Caption", "Plate Caption"):
    caption_style(n)

SECT_ORDER_AFTER_PGNUM = ("cols", "formProt", "vAlign", "noEndnote", "titlePg", "textDirection", "bidi", "rtlGutter", "docGrid")
def insert_before(parent, el, names):
    for child in parent:
        if child.tag.split("}")[1] in names:
            child.addprevious(el); return
    parent.append(el)

def field(paragraph, instr, size=None):
    for tag, text in (("begin", None), (None, instr), ("separate", None), ("end", None)):
        r = paragraph.add_run()
        if size:
            r.font.size = Pt(size)
        if tag:
            el = OxmlElement("w:fldChar"); el.set(qn("w:fldCharType"), tag)
        else:
            el = OxmlElement("w:instrText"); el.set(qn("xml:space"), "preserve"); el.text = text
        r._r.append(el)

def setup_section(sec, top, bottom, roman):
    sec.page_width, sec.page_height = Inches(8.5), Inches(14)  # legal, as in QueUA
    sec.left_margin = sec.right_margin = Inches(1)
    sec.top_margin, sec.bottom_margin = Inches(top), Inches(bottom)
    sp = sec._sectPr
    for old in sp.findall(qn("w:pgNumType")):
        sp.remove(old)
    pg = OxmlElement("w:pgNumType")
    if roman:
        pg.set(qn("w:fmt"), "lowerRoman")
    else:
        pg.set(qn("w:fmt"), "decimal"); pg.set(qn("w:start"), "1")
    insert_before(sp, pg, SECT_ORDER_AFTER_PGNUM)
    sec.footer.is_linked_to_previous = False
    fp = sec.footer.paragraphs[0]
    fp.text = ""
    fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    field(fp, "PAGE")

# front matter: roman numerals, no number on the title page (QueUA section 1)
setup_section(d.sections[0], 1.02, 0.5, roman=True)
d.sections[0].different_first_page_header_footer = True
d.sections[0].first_page_footer.is_linked_to_previous = False


# ---------------------------------------------------------------- writing helpers (QueUA paragraph formats)
def runs(p, text, bold=False, italic=False, size=None):
    for part in re.split(r"(\*\*[^*]+\*\*)", text):
        if not part:
            continue
        r = p.add_run(part[2:-2] if part.startswith("**") else part)
        r.bold = bold or part.startswith("**")
        r.italic = italic
        if size:
            r.font.size = Pt(size)

def P(text="", indent=True, align="j", bold=False, italic=False, spacing=2.0, size=None, after=0, style=None):
    p = d.add_paragraph(style=style)
    pf = p.paragraph_format
    pf.line_spacing = spacing; pf.space_before = Pt(0); pf.space_after = Pt(after)
    if indent:
        pf.first_line_indent = Inches(0.5)
    p.alignment = {"j": WD_ALIGN_PARAGRAPH.JUSTIFY, "c": WD_ALIGN_PARAGRAPH.CENTER,
                   "r": WD_ALIGN_PARAGRAPH.RIGHT, "l": WD_ALIGN_PARAGRAPH.LEFT}[align]
    runs(p, text, bold, italic, size)
    return p

def heading(text, level, center=False, page_break=False, after=12):
    h = d.add_heading(text, level=level)
    pf = h.paragraph_format
    pf.space_before = Pt(0); pf.space_after = Pt(after); pf.line_spacing = 2.0 if level > 1 else 1.1
    pf.page_break_before = page_break
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER if center else WD_ALIGN_PARAGRAPH.LEFT
    return h

def front_title(text):
    heading(text, 1, center=True, page_break=True, after=12)

def chapter(num, title, title_as_heading4):
    heading(f"CHAPTER {num}", 1, center=True, page_break=True, after=0)
    if title_as_heading4:
        heading(title, 4, center=True, after=12)
    else:
        P(title, indent=False, align="c", bold=True, spacing=1.1, after=10)

H2 = lambda t: heading(t, 2)
H3 = lambda t: heading(t, 3)
H4 = lambda t: heading(t, 4, after=4)

def numbered(items, bold_label=False):
    for i, t in enumerate(items, 1):
        p = P(f"{i}. {t}", indent=False)
        p.paragraph_format.left_indent = Inches(0.5)
        p.paragraph_format.first_line_indent = Inches(-0.25)

COUNT = {"Table": 0, "Figure": 0, "Plate": 0}
CAPTIONS = {"Table": [], "Figure": [], "Plate": []}
def cap(kind, title):
    COUNT[kind] += 1
    CAPTIONS[kind].append(f"{kind} {COUNT[kind]}. {title}")
    p = d.add_paragraph(style=f"{kind} Caption")
    p.add_run(f"{kind} {COUNT[kind]}. {title}")
    if kind != "Table":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.keep_with_next = False
    return COUNT[kind]

def table(header, rows, widths=None, size=12, bold_last=False, bold_rows=()):
    t = d.add_table(rows=1, cols=len(header))
    t.style = GRID
    boxed(t)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(header):
        t.rows[0].cells[i].text = h
    for r in rows:
        cells = t.add_row().cells
        for i, v in enumerate(r):
            cells[i].text = str(v)
    if widths:
        # grid widths too: LibreOffice and WPS ignore per-cell widths and would split columns equally
        t.autofit = False
        for i, w in enumerate(widths):
            t.columns[i].width = Inches(w)
    for row in t.rows:
        cant = OxmlElement("w:cantSplit"); row._tr.get_or_add_trPr().append(cant)
    last = len(t.rows) - 1
    for ri, row in enumerate(t.rows):
        for ci, c in enumerate(row.cells):
            if widths:
                c.width = Inches(widths[ci])
            for p in c.paragraphs:
                pf = p.paragraph_format
                pf.line_spacing = 1.08; pf.space_after = Pt(0); pf.space_before = Pt(0)
                if ri == 0 or (ci > 0 and len(c.text) < 22):
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                for run in p.runs:
                    run.font.size = Pt(size)
                    run.bold = ri == 0 or (bold_last and ri == last) or ri in bold_rows
    spacer = d.add_paragraph(); spacer.paragraph_format.space_after = Pt(0)
    return t

def note(text):
    P(text, indent=False, align="l", spacing=1.08, size=11, after=8)

FIGDIR = Path(__file__).with_name("figures")
def image(name, label, width=6.5):
    if not (FIGDIR / name).exists():
        return placeholder(label)
    p = d.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6); p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(str(FIGDIR / name), width=Inches(width))

def placeholder(label):
    P(f"[{label}]", indent=False, align="c", italic=True, spacing=1.08, after=6)

LEGEND = [("5", "4.21–5.00", "Strongly Agree", "Very High"), ("4", "3.41–4.20", "Agree", "High"),
          ("3", "2.61–3.40", "Neutral", "Moderate"), ("2", "1.81–2.60", "Disagree", "Low"),
          ("1", "1.00–1.80", "Strongly Disagree", "Very Low")]
def legend():
    lg = heading("Legend:", 3, after=0); lg.paragraph_format.line_spacing = 1.08
    table(["Scale", "Range", "Descriptive Equivalence"], [[s, r, de] for s, r, _, de in LEGEND],
          widths=[0.8, 1.4, 2.2], size=11)

# ================================================================ TITLE PAGE (QueUA layout)
def title_line(text, after=12):
    P(text, indent=False, align="c", bold=True, spacing=1.1, after=after)
title_line("“BARANGAY HEALTH STATUS MONITORING SYSTEM”", after=36)
for a in AUTHORS:
    title_line(a)
P("", spacing=1.1, after=36)
for line in ("A Capstone Project Presented to", "The Faculty of the Department of Information Technology",
             "Abra State Institute of Sciences and Technology", "Main Campus, Lagangilang, Abra"):
    title_line(line)
P("", spacing=1.1, after=24)
for line in ("In Partial Fulfilment of the Requirements for the Degree",
             "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY"):
    title_line(line)
P("", spacing=1.1, after=24)
title_line("2026")

# ================================================================ APPROVAL SHEET
front_title("APPROVAL SHEET")
P("This capstone project titled “BARANGAY HEALTH STATUS MONITORING SYSTEM,” prepared and submitted by "
  "Katlyne Biendima, Christian Angel Parado, Ryan Justine Bisnan, Dave Lester Bisnan, and Mark Bolanos in "
  "partial fulfilment of the requirements for the degree Bachelor of Science in Information Technology, "
  "has been examined and passed on November 26, 2026.")

def sign_pair(a, b):
    t = d.add_table(rows=3, cols=2)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for col, (name, role) in enumerate((a, b)):
        for row, (txt, bold) in enumerate(((name, True), (role, False), ("Date Signed: ____________", False))):
            p = t.cell(row, col).paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = 1.08; p.paragraph_format.space_after = Pt(0)
            r = p.add_run(txt); r.bold = bold; r.font.size = Pt(11)
    P("", spacing=1.1, after=12)

def sign_one(name, role):
    for txt, b in ((name, True), (role, False), ("Date Signed: ____________", False)):
        P(txt, indent=False, align="c", bold=b, spacing=1.08, size=11)
    P("", spacing=1.1, after=12)

P("", spacing=1.1, after=12)
sign_pair(("CERLYN JOY B. DORO, MIT", "Adviser"), ("CANDYLYN A. ALUNDAY, MA", "English Critic"))
P("PANEL OF EXAMINERS", indent=False, align="c", bold=True, spacing=1.1, after=12)
sign_pair(("EXCEL PHILIP B. GUIDANG, DIT", "Member"), ("DIETRICH D. DAIT, BSCpE", "Member"))
sign_one("CARLITO T. MANGANTENG, MIT", "Chairman")
P("Accepted and approved in partial fulfilment of the requirements for the degree Bachelor of Science in "
  "Information Technology.")
P("", spacing=1.1, after=12)
sign_one("EXCEL PHILIP B. GUIDANG, DIT", "Program Head, BS Information Technology")
sign_pair(("CHRISTOPHER JOHN R. LLANDA, DIT", "Dean, College of Arts and Sciences"),
          ("PABLO B. BOSE JR., EdD", "Director, Research and Development"))

# ================================================================ ABSTRACT
front_title("ABSTRACT")
P(f"This capstone project designed, developed, and evaluated the Barangay Health Status Monitoring System "
  f"(BHSMS), a web-based platform that centralizes the health records of residents of Barangays Palaquio, "
  f"Tabiog, and Babangcag in the Municipality of Bucay, Abra, using a descriptive-developmental design and "
  f"the Prototype Model. A questionnaire answered by {N} barangay health workers, midwives, and other "
  f"authorized health personnel showed that the challenges of the manual, paper-based system were experienced "
  f"to a high extent (overall weighted mean of {f2(P1_ALL)}, Agree), led by the difficulty of organizing paper "
  f"records ({m1[0]}) and the time needed to retrieve them ({m1[1]}). In the open-ended answers, time-consuming "
  f"recording (30.36%), difficulty finding records (26.79%), and time-consuming report preparation (28.57%) "
  f"were cited most often. The system was built with Next.js, React, TypeScript, Tailwind CSS, and Supabase "
  f"(PostgreSQL), and saves data in the browser first so that a health station can keep working without an "
  f"internet connection. It provides resident registration with a Unique Patient Identifier and duplicate "
  f"detection, vital-sign triage that automatically classifies blood pressure, fever, and body mass index, "
  f"maternal care with high-risk flagging, child immunization tracking with a defaulter list, referral slips, "
  f"morbidity surveillance reports, and role-based access for five types of users. The same respondents "
  f"evaluated the system at an overall weighted mean of {f2(P2_ALL)} (Agree, Very Good): effectiveness "
  f"{f2(crit_m[0])}, efficiency {f2(crit_m[1])}, and user-friendliness {f2(crit_m[2])}. The study recommends "
  f"pilot adoption in the three barangays, SMS reminders for scheduled visits, and a before-and-after "
  f"measurement of recording and reporting time.", indent=False)
p = P("", indent=False, align="l")
runs(p, "Keywords: "); runs(p, "barangay health information system, health monitoring, offline-first web "
                              "application, triage, immunization tracking, Supabase", italic=True)

# ================================================================ ACKNOWLEDGEMENT & DEDICATION (from the capstone PDF)
CAP_TEXT = ""
if shutil.which("pdftotext") and (SRC / "revised capstone.pdf").exists():
    CAP_TEXT = subprocess.run(["pdftotext", "-layout", str(SRC / "revised capstone.pdf"), "-"],
                              capture_output=True).stdout.decode("cp1252", errors="replace")

def pdf_paragraphs(start_marker, end_marker):
    text = CAP_TEXT.replace("\r", "").replace("\x0c", "\n")
    part = re.split(rf"^\s*{start_marker}\s*$", text, maxsplit=1, flags=re.M)[1]
    part = re.split(rf"^\s*{end_marker}\s*$", part, maxsplit=1, flags=re.M)[0]
    paras, cur = [], []
    for line in part.splitlines():
        if not line.strip():
            if cur: paras.append(" ".join(cur)); cur = []
            continue
        if line.startswith("         ") and cur and not line.startswith(" " * 30):
            paras.append(" ".join(cur)); cur = []
        if line.startswith(" " * 30) or line.strip() in AUTHORS:  # signature line
            if cur: paras.append(" ".join(cur)); cur = []
            paras.append("SIG:" + line.strip()); continue
        cur.append(line.strip())
    if cur: paras.append(" ".join(cur))
    return paras

if CAP_TEXT:
    front_title("ACKNOWLEDGEMENT")
    for para in pdf_paragraphs("Acknowledgement", "Dedication"):
        if para.startswith("SIG:"):
            P(para[4:], indent=False, align="r", spacing=1.1)
        else:
            P(para.replace("were vital in ensuring", "were vital to ensuring"))
    front_title("DEDICATION")
    for para in pdf_paragraphs("Dedication", "CHAPTER I"):
        if para.startswith("SIG:"):
            P(para[4:], indent=False, align="r", bold=True, spacing=1.1, after=24)
        else:
            P(para)

# ================================================================ LISTS (Word fields over the caption styles)
LIST_SLOTS = []
for title, kind in (("LIST OF TABLES", "Table"), ("LIST OF FIGURES", "Figure"), ("LIST OF PLATES", "Plate")):
    front_title(title)
    LIST_SLOTS.append((kind, d.add_paragraph()))

def fill_lists():
    # TOC field per list; the cached result is the plain entry list, so it reads correctly even before
    # Word/WPS updates the field and adds the dot leaders and page numbers
    def fld(p, tag):
        el = OxmlElement("w:fldChar"); el.set(qn("w:fldCharType"), tag); p.add_run()._r.append(el)
    for kind, first in LIST_SLOTS:
        fld(first, "begin")
        it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve")
        it.text = f'TOC \\h \\z \\t "{kind} Caption,1"'
        first.add_run()._r.append(it)
        fld(first, "separate")
        prev = first
        for i, entry in enumerate(CAPTIONS[kind]):
            p = first if i == 0 else None
            if p is None:
                new = OxmlElement("w:p"); prev._p.addnext(new)
                from docx.text.paragraph import Paragraph
                p = Paragraph(new, prev._parent)
            p.paragraph_format.line_spacing = 1.5
            p.add_run(entry)
            prev = p
        fld(prev, "end")

# ---------------------------------------------------------------- chapters: arabic numbering from 1
setup_section(d.add_section(WD_SECTION.NEW_PAGE), 1.0, 1.0, roman=False)
d.sections[-1].different_first_page_header_footer = False

# ================================================================ CHAPTER I
chapter("I", "INTRODUCTION", title_as_heading4=False)
H2("BACKGROUND OF THE STUDY")
for t in [
    "In today’s rapidly evolving world, information technology plays a crucial role in improving efficiency, "
    "accessibility, and decision-making across various sectors, particularly in health care. The integration of "
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
    "In direct response to this gap, this study developed the Barangay Health Status Monitoring System (BHSMS), "
    "a centralized web-based platform for collecting, storing, and analyzing the health information of "
    "residents. The system enables health workers to register residents without duplicates, record vital signs "
    "that are automatically classified by severity, monitor pregnant women and children due for vaccination, "
    "generate referral slips and surveillance reports, and protect records through role-based access, while "
    "continuing to work offline and synchronizing to the cloud when a connection is available.",
]:
    P(t)

H2("CONCEPTUAL FRAMEWORK")
P("This study is guided by the Input–Process–Output (IPO) Model, which provides a clear and systematic "
  "representation of the research and development process. The IPO Model serves as the research paradigm by "
  "delineating the information and conditions that drive the study (Input), the methodological activities "
  "that transform those inputs (Process), and the outcomes that represent the study’s intended results (Output).")
P("The Input component encompasses the knowledge, software, and hardware requirements of the study. The "
  "knowledge requirements include the challenges of the current manual health monitoring system as reported by "
  "the respondents; the health programs that the system must support, namely the DOH Expanded Program on "
  "Immunization schedule, the four-visit antenatal care pathway, the Philippine clinical practice guidelines "
  "for hypertension (Ona et al., 2021), and the World "
  "Health Organization’s body mass index cut-offs for Asian populations (WHO Expert Consultation, 2004); the "
  "requirements of the Data Privacy Act of 2012; and the theories that guide the study.")
P("Two foundational theories anchor this study. The Technology Acceptance Model (Davis, 1989) holds that users "
  "adopt a system they find useful and easy to use, and it guided the design of screens that health workers "
  "with varied computer experience can learn quickly. ISO 9241-11 (International Organization for "
  "Standardization [ISO], 2018) defines usability in terms of effectiveness, efficiency, and user "
  "satisfaction, and it provides the criteria for evaluating the developed system. The software requirements "
  "are Next.js, React, TypeScript, Tailwind CSS, and Supabase, while the hardware requirements are a computer "
  "or laptop at each barangay health station, a web browser, and an internet connection for cloud "
  "synchronization.")
P(f"The Process component covers the needs assessment, conducted through a questionnaire answered by {N} "
  "respondents from the three barangays; the phases of the Prototype Model, namely requirements gathering, "
  "quick design, prototyping, testing, refinement, and deployment and evaluation; and the evaluation of the "
  "system by the same respondents, with the data analyzed through frequency, percentage, and weighted mean.")
P("The Output component is the Barangay Health Status Monitoring System, a web-based, offline-first platform "
  "for resident registration, vital-sign triage, maternal and child health monitoring, referrals, and "
  "surveillance reports, together with the evaluation report that documents its effectiveness, efficiency, "
  "and user-friendliness. The feedback arrow in Figure 1 indicates that the evaluation results inform the "
  "further refinement of the system.")

ipo = d.add_table(rows=2, cols=3); ipo.style = GRID; boxed(ipo); ipo.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (head, lines) in enumerate([
    ("INPUT", ["Knowledge requirements: challenges of the manual system; DOH EPI schedule; 4-visit ANC; "
               "PH hypertension CPG; WHO Asia-Pacific BMI cut-offs; RA 10173; TAM; ISO 9241-11",
               "Software: Next.js, React, TypeScript, Tailwind CSS, Supabase",
               "Hardware: computer or laptop, web browser, internet connection"]),
    ("PROCESS", [f"Needs assessment questionnaire (n = {N})",
                 "Prototype Model: requirements gathering, quick design, prototyping, testing, refinement, "
                 "deployment and evaluation",
                 "Analysis using frequency, percentage, and weighted mean"]),
    ("OUTPUT", ["Barangay Health Status Monitoring System (BHSMS)",
                "Evaluation of the system in terms of effectiveness, efficiency, and user-friendliness"]),
]):
    hp = ipo.cell(0, i).paragraphs[0]; hp.alignment = WD_ALIGN_PARAGRAPH.CENTER; hp.add_run(head).bold = True
    c = ipo.cell(1, i)
    for j, line in enumerate(lines):
        p = c.paragraphs[0] if j == 0 else c.add_paragraph()
        p.add_run("• " + line).font.size = Pt(10)
    for p in ipo.cell(0, i).paragraphs + c.paragraphs:
        p.paragraph_format.line_spacing = 1.08; p.paragraph_format.space_after = Pt(2)
P("Feedback: evaluation results inform the refinement of the system", indent=False, align="c", italic=True,
  spacing=1.08, size=10)
cap("Figure", "Research Paradigm (IPO Model)")

H2("STATEMENT OF THE PROBLEM")
P("The general problem of this study is: How can the development of a Barangay Health Status Monitoring "
  "System improve the recording, storage, and management of residents’ health data in Barangays Palaquio, "
  "Tabiog, and Babangcag? Specifically, the study seeks to answer the following questions:")
numbered([
    "What challenges are encountered in the current manual health monitoring system of the barangays in terms of "
    "health record management, monitoring of residents’ health, data accuracy and consistency, reporting and "
    "information retrieval, and efficiency and accessibility?",
    "What system design and features should be integrated into the Barangay Health Status Monitoring System, such "
    "as resident registration with duplicate detection, vital-sign triage, maternal and child health monitoring, "
    "referral slips, surveillance reports, and role-based access, to address these challenges?",
    "How do the users evaluate the developed system in terms of effectiveness, efficiency, and user-friendliness?",
])

H2("OBJECTIVES OF THE STUDY")
P("The general objective of this study is to design, develop, and evaluate a Barangay Health Status Monitoring "
  "System that centralizes and improves the management of the health data of barangay residents. "
  "Specifically, the study aims:")
numbered([
    "To identify and document the challenges of the current manual health monitoring system in terms of health "
    "record management, monitoring of residents’ health, data accuracy and consistency, reporting and "
    "information retrieval, and efficiency and accessibility.",
    "To design and develop the system as a web-based, offline-first application that provides resident "
    "registration with duplicate detection, vital-sign triage, maternal and child health monitoring, referral "
    "slips, surveillance reports, and role-based access control.",
    "To evaluate the developed system through a questionnaire, guided by ISO 9241-11, answered by the users in "
    "terms of effectiveness, efficiency, and user-friendliness.",
])

H2("SIGNIFICANCE OF THE STUDY")
P("The developed system addresses a critical gap in the health information management of the three barangays.")
for who, what in [
    ("For Barangay Health Workers (BHWs).", "It reduces their manual workload in registering residents and "
     "recording vital signs, and gives them a list of children who missed vaccinations for follow-up home "
     "visits, in line with SDG 3 (Good Health and Well-being)."),
    ("For Nurses and Midwives.", "It provides accurate and accessible patient data, flags high-risk pregnancies "
     "and abnormal vital signs automatically, and prepares referral slips, supporting timely interventions in "
     "maternal care and adult health monitoring."),
    ("For the Municipal Health Officer.", "It gives the physician a longitudinal medical chart for each resident "
     "and morbidity surveillance reports for the three barangays."),
    ("For Barangay Officials.", "It supports decision-making through reliable summary reports without exposing "
     "individual patient records, contributing to healthier communities in line with SDG 11 (Sustainable "
     "Cities and Communities)."),
    ("For the Residents.", "It supports better monitoring of children, pregnant women, and adults, earlier "
     "detection of conditions such as hypertension and fever, and more complete vaccination of children."),
    ("For Future Researchers.", "It contributes to the literature on offline-capable health information systems "
     "for rural communities and serves as a reference model for similar systems, supporting SDG 9 (Industry, "
     "Innovation and Infrastructure) (United Nations, 2023)."),
]:
    P(f"**{who}** {what}")

H2("DEFINITION OF TERMS")
for term, meaning in [
    ("Antenatal Care (ANC)", "The prenatal check-ups of a pregnant resident, tracked by the system across four visits."),
    ("Audit Trail", "The record kept by the system of who performed each action, on which record, and when, in compliance with RA 10173."),
    ("Barangay Health Status Monitoring System (BHSMS)", "The web-based system developed as the primary output of this study to collect, store, manage, and analyze the health data of barangay residents."),
    ("Body Mass Index (BMI)", "A measure of body weight relative to height (kg/m²), computed automatically by the system and classified using the WHO Asia-Pacific cut-offs."),
    ("Clinical Flag", "A label the system attaches to a vital-sign record when a reading crosses a threshold, such as Stage 2 Hypertension or Febrile Illness Alert."),
    ("Dashboard", "The home page of each user that summarizes the health data, alerts, and tasks relevant to the user’s role."),
    ("Defaulter", "A child who is older than the scheduled age of a vaccine but has not yet received it."),
    ("Expanded Program on Immunization (EPI)", "The DOH vaccination schedule for children from birth to twelve months that the system uses to track immunizations."),
    ("Health Record", "The digital file containing a resident’s personal information, vital signs, consultations, and program records."),
    ("ISO 9241-11", "An international standard that defines usability in terms of effectiveness, efficiency, and satisfaction (ISO, 2018)."),
    ("Module", "A functional part of the system, such as Vitals and Triage or Maternal Care, that the administrator can grant to or remove from a user."),
    ("Offline-First", "The design in which the system saves data in the browser of the workstation first, so that it keeps working without internet, and synchronizes to the cloud later."),
    ("Prototype Model", "The development approach in which an initial version of the system is built, tested with users, and improved based on their feedback."),
    ("Referral Slip (RF-1)", "The standardized form generated by the system to transfer a patient to the Municipal Health Office or a hospital."),
    ("Role-Based Access Control (RBAC)", "The security approach in which each user’s role and assigned modules determine the pages and actions available to the user."),
    ("Row-Level Security (RLS)", "A PostgreSQL feature, enabled through Supabase, that restricts which records each user may read or change (Supabase, 2026)."),
    ("Soundex", "A phonetic code used by the system to recognize names that sound alike, such as “Dela Cruz” and “De la Cruz,” and warn of possible duplicate registrations."),
    ("Triage Severity", "The level assigned by the system to a vital-sign record: Normal, Elevated, High, or Critical."),
    ("Unique Patient Identifier (UPI)", "The code assigned to every registered resident in the format BHS-[barangay]-[year]-[sequence]."),
]:
    P(f"**{term}.** {meaning}")

# ================================================================ CHAPTER II
chapter("II", "METHODOLOGY", title_as_heading4=True)
P("This chapter presents the research methodology employed in the design, development, and evaluation of the "
  "Barangay Health Status Monitoring System. The methodology integrates descriptive research techniques with "
  "an iterative, user-centered system development approach.")

H2("RESEARCH DESIGN")
P("This study adopts a descriptive-developmental research design. The descriptive component systematically "
  "documents the challenges of the current manual health monitoring system through a structured "
  "questionnaire answered by the health personnel of the three barangays. The developmental component "
  "encompasses the planning, design, construction, and evaluation of the web-based system that serves as a "
  "practical solution to these challenges. The development process is governed by the Prototype Model, "
  "ensuring iterative progress toward a validated final product.")

H3("Population and Sampling")
P(f"The study employed purposive sampling in selecting the respondents. This non-probability sampling technique "
  f"was appropriate because the researchers needed participants who were directly involved in the health "
  f"services of their barangay and in the recording and monitoring of residents’ health data. A total of {N} "
  f"respondents participated: {N_BRGY['Palaquio']} from Barangay Palaquio, {N_BRGY['Tabiog']} from Barangay "
  f"Tabiog, and {N_BRGY['Babangcag']} from Barangay Babangcag, as presented in Table 1. They consisted of "
  f"barangay health workers, midwives, and other authorized health personnel, who answered both the "
  f"questionnaire on the challenges of the manual system and the evaluation of the developed system.")
cap("Table", "Distribution of Respondents by Barangay")
table(["Barangay", "Number of Respondents (n)", "Percentage (%)"],
      [[b, N_BRGY[b], f"{N_BRGY[b] / N * 100:.2f}"] for b in BRGYS] + [["Total", N, "100.00"]],
      widths=[2.2, 2.4, 1.8], bold_last=True)
cap("Table", "Inclusion and Exclusion Criteria for Respondents")
table(["Respondent Group", "Inclusion", "Exclusion"], [[
    "Barangay health personnel",
    "1. Barangay health workers, midwives, and other authorized personnel directly involved in the barangay’s "
    "health services.\n2. Personnel with experience in the current manual health records.\n3. Personnel willing "
    "to participate who gave informed consent and completed the questionnaire.",
    "1. Personnel not involved in the barangay’s health services.\n2. Personnel who declined to participate.\n"
    "3. Respondents who submitted substantially incomplete questionnaires.",
]], widths=[1.4, 2.6, 2.4], size=11)
P("The inclusion and exclusion criteria presented in Table 2 were established to ensure that the respondents "
  "had relevant experience and could provide meaningful information for the study. Their responses provided "
  "the basis for identifying the challenges of the manual system and for evaluating the functionality, "
  "efficiency, and usability of the developed system.")

H2("SOFTWARE DEVELOPMENT LIFE CYCLE")
P("The development of the system follows the Prototype Model, an iterative methodology in which a working "
  "version of the system is built, shown to the users, and refined based on their feedback. Each cycle "
  "produced a working version that was reviewed before the next one began, as illustrated in Figure 2.")
image("figure2_prototype.png", "Insert the Prototype Development Cycle diagram")
cap("Figure", "Prototype Development Cycle")
for phase, text in [
    ("Phase 1: Requirements Gathering.", f"The researchers identified the existing problems in the barangays’ "
     f"health monitoring process through the questionnaire answered by {N} respondents, interviews with health "
     f"workers and midwives, and a review of the logbooks and forms used at the health stations. The required "
     f"functions were defined: resident registration without duplicates, vital-sign recording with automatic "
     f"classification, maternal and immunization tracking, referrals, reports, and access control."),
    ("Phase 2: Quick Design.", "The architecture (Figure 3), the triage workflow (Figure 4), the database "
     "(Figure 5), the user roles, and the screen layouts were designed. The system was organized into ten "
     "modules grouped into frontline intake, clinical care, and governance, and each role was assigned a default "
     "set of modules."),
    ("Phase 3: Prototyping.", "Working versions of the system were built in increments: the database schema and "
     "resident registry; the vital-sign screener and triage rules; maternal care and immunization tracking; "
     "referrals and surveillance reports; and finally user management, the audit trail, and cloud "
     "synchronization."),
    ("Phase 4: Testing.", "Each increment was checked with automated validation scripts covering the clinical "
     "rules, module permissions, the audit trail, and synchronization, together with static type checking and "
     "linting. The prototype was then walked through with the health workers to check its functionality and "
     "usability."),
    ("Phase 5: Refinement.", "Feedback from the users was used to correct errors and improve the screens, for "
     "example by showing the triage result while the vital signs are being typed and by adding a duplicate "
     "warning during registration."),
    ("Phase 6: Deployment and Evaluation.", "The finalized system was installed at the barangay health "
     "stations, the users were oriented, and the evaluation questionnaire was administered after trial use. "
     "After deployment, the system is maintained through user feedback, regular cloud backups, and updates."),
]:
    P(phase, indent=False, bold=True)
    P(text)

H2("DEVELOPMENT TOOLS AND TECHNOLOGIES")
P("The system was developed using tools selected for offline operation, security, and access from any "
  "computer at the health station, as listed in Table 3.")
cap("Table", "Development Tools and Technologies")
table(["Tool / Technology", "Purpose"], [
    ["Next.js 16 (App Router)", "Full-stack React framework for the pages, routing, and server routes of the system (Vercel, 2026)."],
    ["React 19 and TypeScript 5", "Component-based user interface with static type checking."],
    ["Tailwind CSS 4", "Responsive styling for desktop and laptop screens at the health stations."],
    ["Supabase (PostgreSQL)", "Cloud database of residents, vital signs, maternal records, immunizations, and audit logs, protected by Row-Level Security (Supabase, 2026)."],
    ["Supabase Auth and Storage", "User sign-in and session management; storage of the synchronized backup files."],
    ["Browser localStorage", "Offline-first storage of records on the workstation."],
    ["Zod", "Validation schemas for resident and vital-sign data."],
    ["Lucide React", "Interface icons."],
    ["ESLint and tsx", "Static code analysis and execution of the automated validation scripts."],
    ["Git and GitHub", "Version control and team collaboration."],
    ["Visual Studio Code", "Primary integrated development environment (IDE)."],
], widths=[2.0, 4.4])

H2("SCOPE AND DELIMITATION OF THE STUDY")
P("This study covers the design, development, and evaluation of the Barangay Health Status Monitoring System "
  "for the barangay health stations of Palaquio, Tabiog, and Babangcag in the Municipality of Bucay, Abra. The "
  "system covers ten modules: resident registry, new patient intake, vital signs and triage, the medical "
  "patient chart, maternal care and antenatal care (ANC) tracking, child immunization (EPI) tracking, referral "
  "slips, morbidity surveillance analytics, workstation diagnostics and cloud synchronization, and user "
  "account management.")
P("The users of the system are barangay health workers (BHWs), nurses and midwives, the municipal health "
  "officer (doctor), barangay officials who view summary reports only, and the system administrator. Each user "
  "is given the modules appropriate to his or her role, and the administrator may grant or remove modules for "
  "individual users. The system runs in a web browser and stores data on the workstation first, so that the "
  "health station can continue working without an internet connection, and it synchronizes the data to a "
  "Supabase cloud database when a connection is available.")
P("The study does not include integration with national health information systems of the Department of "
  "Health, a native mobile application, SMS or push notifications, or advanced analytics such as predictive "
  "modeling and AI-based diagnosis. The system automatically classifies blood pressure, temperature, and body "
  "mass index; heart rate and respiratory rate are recorded but left to the judgment of the attending health "
  "worker, and oxygen saturation is not recorded. The system supports, but does not replace, the clinical "
  f"judgment of health personnel. The needs assessment and the evaluation were limited to {N} respondents "
  "from the three barangays, IT specialists did not take part in the evaluation, and actual recording and "
  "reporting times were not measured before and after deployment.")

H2("DATA GATHERING PROCEDURES")
P("The data gathering followed a systematic seven-stage procedure:")
numbered([
    "**Approval:** Secured permission from the barangay officials and the health personnel of Barangays Palaquio, Tabiog, and Babangcag to conduct the study.",
    "**Instrument Preparation and Validation:** Prepared the questionnaire and submitted it to the adviser for content validation.",
    "**Needs Assessment:** Conducted interviews with barangay health workers and midwives and administered Part I of the questionnaire to document the challenges of the current manual system.",
    "**System Development:** Translated the identified requirements into the system through the phases of the Prototype Model.",
    "**Trial Use:** Oriented the respondents on the use of the system and allowed them to use it during a trial period.",
    "**Evaluation:** Administered the evaluation part of the questionnaire to the same respondents.",
    "**Data Processing:** Encoded, tallied, and analyzed the responses using the statistical tools described below.",
])

H2("DATA GATHERING INSTRUMENTS")
P("A researcher-made questionnaire (Appendix A) was used. Part I, on the challenges encountered in the current "
  "manual barangay health monitoring system, contains 22 statements rated on a five-point Likert scale "
  "(Likert, 1932) and grouped into five areas: health record management (5 statements), monitoring of "
  "residents’ health (5), data accuracy and consistency (4), reporting and information retrieval (4), and "
  "efficiency and accessibility (4). Part II contains four open-ended questions on the most common problems "
  "in recording and updating health information, in retrieving and monitoring records, in preparing and "
  "submitting reports, and in tracking residents who need follow-up services.")
P("Part III, the evaluation of the Barangay Health Status Monitoring System, contains 18 statements rated "
  "from 1 (Strongly Disagree) to 5 (Strongly Agree) and grouped into three criteria: effectiveness (6 "
  "statements), efficiency (6), and user-friendliness (6). These criteria follow the ISO 9241-11 view of "
  "usability as effectiveness, efficiency, and satisfaction (ISO, 2018). Interviews with health workers and "
  "midwives supplemented the questionnaire in identifying the system requirements.")

H2("DATA ANALYSIS")
P("Frequency and percentage were used to describe the answers to the open-ended questions, where the "
  "percentage is computed as P = (f / N) × 100, with f as the frequency of a response and N as the total "
  "number of responses.")
P("The weighted mean was used for the Likert-scale items, computed as WM = Σ(f × w) / N, where w is the scale "
  "value of each response. Means were interpreted using the scale in Table 4: the first descriptive "
  "equivalence expresses the extent of a challenge in Part I, and the second expresses the quality of the "
  "system in Part III.")
cap("Table", "Five-Point Likert Scale and Interpretation")
table(["Scale", "Range", "Descriptive Rating", "Descriptive Equivalence"],
      [[s, r, dr, f"{de} / {q}"] for (s, r, dr, de), q in zip(LEGEND, ["Excellent", "Very Good", "Good", "Fair", "Poor"])],
      widths=[0.8, 1.3, 1.9, 2.4])
P("The answers to the open-ended questions were examined through thematic analysis (Braun & Clarke, 2006): "
  "similar answers were coded, counted, ranked, and grouped. Synthesizing the descriptive statistics with "
  "these themes allowed the researchers to connect each identified challenge to a specific feature of the "
  "system and to interpret the evaluation results in context.")

# ================================================================ CHAPTER III
chapter("III", "RESULTS AND DISCUSSION", title_as_heading4=True)
P("This chapter presents the findings of the study based on the identified problems and objectives. It "
  "includes the analysis of the challenges of the current manual health monitoring system, the design and "
  "development of the Barangay Health Status Monitoring System, and the evaluation of the system in terms of "
  "effectiveness, efficiency, and user-friendliness.")

H3("Problem 1. What challenges are encountered in the current manual health monitoring system?")

def item_table(title, group, idx, kind=1):
    num = cap("Table", title)
    vals = part1_items if kind == 1 else part2_items
    rows = []
    for k, i in enumerate(idx):
        r = rate(vals[i])
        rows.append([f"{k + 1}. {group[k]}", f2(vals[i]), r[2] if kind == 1 else r[3]])
    m = avg([vals[i] for i in idx]); r = rate(m)
    rows.append(["Submean" if kind == 1 else "Overall Weighted Mean", f2(m), r[2] if kind == 1 else r[3]])
    table(["Indicator", "Mean" if kind == 1 else "WM", "Descriptive Equivalence" if kind == 1 else "DE"], rows,
          widths=[4.3, 0.8, 1.3], size=11, bold_last=True)
    if kind == 1:
        legend()
    else:
        note(f"n = {N}.")
    return num

AREA_TITLES = ["Challenges in Health Record Management", "Challenges in Monitoring of Residents’ Health",
               "Challenges in Data Accuracy and Consistency", "Challenges in Reporting and Information Retrieval",
               "Challenges in Efficiency and Accessibility"]
def area_text(k, t):
    return [
        [f"Table {t} presents the respondents’ assessment of health record management under the manual system. "
         f"The submean of {f2(area_m[0])}, interpreted as High, is the highest of the five areas. The difficulty "
         f"of organizing and maintaining paper-based documents obtained the highest mean of the whole "
         f"questionnaire, {m1[0]} (Very High), followed by the time needed to retrieve residents’ records, "
         f"{m1[1]} (Very High). Maintaining accurate and up-to-date records ({m1[4]}), the effort of updating "
         f"information ({m1[3]}), and records that are misplaced, lost, or damaged ({m1[2]}) were rated High.",
         "These findings agree with Batoon et al. (2022) and Altura et al. (2023), who found that paper-based "
         "records in barangay health centers cause redundancy, loss, and slow retrieval. The findings suggest "
         "the need for a central, searchable record for every resident, which the system provides through the "
         "resident registry and the Unique Patient Identifier."],
        [f"Table {t} presents the respondents’ assessment of the monitoring of residents’ health. The submean of "
         f"{f2(area_m[1])}, interpreted as High, suggests that health workers find it difficult to follow up "
         f"residents using manual records. Identifying residents who require follow-up consultations obtained "
         f"the highest mean in this area ({m1[7]}), followed by monitoring the health status of residents "
         f"({m1[5]}) and tracking residents with recurring illnesses ({m1[6]}). Keeping track of scheduled "
         f"check-ups ({m1[9]}) and monitoring vaccination records ({m1[8]}) were rated lower but still High.",
         "Because paper records are not organized by risk, health workers cannot easily see which residents "
         "need attention. The findings suggest that the system could support monitoring through automatic "
         "flagging of abnormal vital signs and high-risk pregnancies and an automatically computed list of "
         "children who missed their vaccinations."],
        [f"Table {t} presents the respondents’ assessment of data accuracy and consistency. The submean of "
         f"{f2(area_m[2])} is interpreted as High. The respondents agreed most that manual recording increases "
         f"the possibility of errors ({m1[10]}) and that duplicate records may occur ({m1[11]}). Incomplete "
         f"information ({m1[12]}) and the time needed to compare information across documents ({m1[13]}) "
         f"obtained the lowest means of the questionnaire, although both remain High.",
         "These results support validation of required fields, automatic computation of values such as body "
         "mass index and expected date of delivery, and a duplicate check during registration, so that the "
         "same resident is not recorded twice under slightly different spellings."],
        [f"Table {t} presents the respondents’ assessment of reporting and information retrieval. The submean of "
         f"{f2(area_m[3])} is interpreted as High. Accessing historical health information for decision-making "
         f"obtained the highest mean ({m1[17]}), followed by generating updated statistics ({m1[16]}), "
         f"preparing health reports for the barangay or municipal health office ({m1[14]}), and consolidating "
         f"data from different records ({m1[15]}).",
         "Reports that must be compiled by hand from several logbooks take time and invite computation errors. "
         "Automatically generated summaries drawn from a single database could address this problem directly."],
        [f"Table {t} presents the respondents’ assessment of efficiency and accessibility. The submean of "
         f"{f2(area_m[4])} is interpreted as High. Protecting paper-based records from unauthorized access "
         f"obtained a mean of {m1[21]}, the only statement on which all {N} respondents chose Agree. Sharing "
         f"health information among authorized personnel ({m1[20]}), the time and paperwork of manual "
         f"monitoring ({m1[18]}), and managing a large volume of records ({m1[19]}) followed.",
         "The concern about unauthorized access is significant because health records are sensitive personal "
         "information under the Data Privacy Act of 2012 (Republic of the Philippines, 2012). A digital system "
         "must therefore restrict each user to the records his or her role requires and keep a record of who "
         "accessed them."],
    ][k]

first_area = COUNT["Table"] + 1
for k in range(5):
    t = item_table(AREA_TITLES[k], Q1[k][1], AREA_IDX[k])
    for para in area_text(k, t):
        P(para)

sum_num = cap("Table", "Summary of the Challenges in the Current Manual System")
rows = []
for k in sorted(range(5), key=lambda k: -area_m[k]):
    per = [avg([item_stats(P1, i)[1][b] for i in AREA_IDX[k]]) for b in BRGYS]
    rows.append([Q1[k][0][3:].strip()] + [f2(x) for x in per] + [f2(area_m[k]), rate(area_m[k])[2]])
brgy_all1 = [avg([avg([item_stats(P1, i)[1][b] for i in idx]) for idx in AREA_IDX]) for b in BRGYS]
rows.append(["Overall"] + [f2(x) for x in brgy_all1] + [f2(P1_ALL), rate(P1_ALL)[2]])
table(["Area", "Palaquio", "Tabiog", "Babangcag", "Mean", "DE"], rows,
      widths=[2.4, 0.9, 0.8, 0.9, 0.7, 0.8], size=11, bold_last=True)
P(f"Table {sum_num} summarizes the respondents’ assessment of the current manual health monitoring system. "
  f"The overall mean of {f2(P1_ALL)}, interpreted as High, suggests that the challenges are experienced to a "
  f"high extent. Health record management obtained the highest mean ({f2(area_m[0])}), followed by monitoring "
  f"of residents’ health ({f2(area_m[1])}), reporting and information retrieval ({f2(area_m[3])}), efficiency "
  f"and accessibility ({f2(area_m[4])}), and data accuracy and consistency ({f2(area_m[2])}).")
P(f"The three barangays gave similar ratings: Babangcag {f2(brgy_all1[2])}, Palaquio {f2(brgy_all1[0])}, and "
  f"Tabiog {f2(brgy_all1[1])}, all interpreted as High. The challenges are therefore common to the three "
  f"health stations rather than specific to one of them, which provides a basis for developing one system "
  f"for all three.")
P("Additionally, four open-ended questions gave the respondents the opportunity to describe the problems in "
  "their own words. Their answers were coded and tallied by barangay.")

OE = [
    ("On Common Problems in Recording and Updating Health Information",
     "Common Problems in Recording and Updating Health Information",
     lambda t: f"Table {t} presents the most common problems in recording and updating residents’ health "
     f"information. Time-consuming recording ranked first (30.36%), followed by lost or misplaced records "
     f"(19.64%) and incomplete information (17.86%). Inaccurate information and difficulty updating records "
     f"were each cited by 16.07%. These answers confirm the high ratings for health record management in Table "
     f"{first_area}."),
    ("On Difficulties in Retrieving and Monitoring Health Records",
     "Difficulties in Retrieving and Monitoring Health Records",
     lambda t: f"Table {t} presents the difficulties in retrieving and monitoring health records. Difficulty "
     f"finding records ranked first (26.79%), followed by disorganized files and time-consuming monitoring "
     f"(19.64% each), missing or incomplete records (17.86%), and difficulty tracking a resident’s health "
     f"history (16.07%). These findings indicate that the location of records, rather than their content, is "
     f"the main obstacle."),
    ("On Challenges in Preparing and Submitting Health Reports",
     "Challenges in Preparing and Submitting Health Reports",
     lambda t: f"Table {t} presents the challenges in preparing and submitting barangay health reports. "
     f"Time-consuming report preparation ranked first (28.57%), followed by incomplete data (19.64%), errors in "
     f"manual computation and difficulty compiling statistics (17.86% each), and delayed report submission "
     f"(16.07%)."),
    ("On Problems in Tracking Residents Who Need Follow-Up Services",
     "Problems in Tracking Residents Who Need Follow-Up Services",
     lambda t: f"Table {t} presents the problems in tracking residents who need follow-up consultations, "
     f"vaccinations, or other health services. Residents forgetting their appointments ranked first (25.00%), "
     f"followed by difficulty contacting residents (21.43%), lack of reminders (19.64%), missed vaccination "
     f"schedules (17.86%), and difficulty monitoring follow-ups (16.07%). These problems involve communication "
     f"with residents, which the system supports through follow-up lists for home visits but does not fully "
     f"solve, since SMS reminders are outside its scope."),
]
for k, (head, title, text) in enumerate(OE):
    H4(head)
    t = cap("Table", title)
    # SENTENCE PART columns: Barangay 1 = Palaquio (19), 2 = Tabiog (17), 3 = Babangcag (20)
    table(["Common Problem", "Palaquio", "Tabiog", "Babangcag", "Total", "%"],
          [r[:6] for r in open_ended[k][1:]], widths=[2.4, 0.9, 0.8, 0.9, 0.7, 0.9], size=11, bold_last=True)
    P(text(t))
P("Overall, the findings for Problem 1 show that the manual health monitoring system of the three barangays "
  "suffers from four interrelated weaknesses: records are slow to write, find, and update; residents who need "
  "attention are not readily identified; reports must be compiled by hand; and paper records cannot be "
  "protected reliably from unauthorized access.")

H3("Problem 2. What system design and features should be integrated into the Barangay Health Status Monitoring System?")
trace_num = COUNT["Table"] + 1
thr_num, roles_num = trace_num + 1, trace_num + 2
P(f"Guided directly by the findings of Problem 1, the researchers designed and developed the Barangay Health "
  f"Status Monitoring System following the Input–Process–Output framework and the Prototype Model described in "
  f"Chapter II. Table {trace_num} traces each identified challenge to the feature that addresses it. The "
  f"subsections that follow present the architecture, the clinical rules, the database, the user roles, and "
  f"each module of the system with its corresponding screen. The screens shown in the plates contain fictional "
  f"sample residents entered for demonstration, not actual patient records.")
cap("Table", "Challenges Identified and the Corresponding Features of the BHSMS")
table(["Challenge Identified (Problem 1)", "BHSMS Feature (Problem 2)"], [
    [f"Paper records are difficult to organize ({m1[0]}); recording is time-consuming (30.36%)",
     "Electronic registration of every resident with a Unique Patient Identifier; vital signs, consultations, and program records stored under one resident profile"],
    [f"Retrieving records takes time ({m1[1]}); records are difficult to find (26.79%)",
     "Resident registry with search by name or UPI and filters by barangay and purok; medical chart showing the resident’s full history"],
    [f"Duplicate records may occur ({m1[11]}); errors in manual recording ({m1[10]})",
     "Soundex-based duplicate warning during registration; automatic computation of BMI, expected date of delivery, and gestational age"],
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
], widths=[2.8, 3.6], size=11)

H4("a. System Architecture")
P("The BHSMS is a web-based application organized into four layers, as shown in Figure 3. The pages layer, "
  "built with Next.js and React in TypeScript, contains the screens of the system; before any page is shown, a "
  "module guard checks that the signed-in user has been granted that module. The services layer holds the "
  "clinical rules and data operations, such as the evaluation of vital signs and the computation of "
  "immunization defaulters. The workstation layer stores every record in the browser’s local storage first, so "
  "a health station can keep working when the internet connection is lost. The cloud layer is Supabase, which "
  "provides user authentication, the PostgreSQL database protected by Row-Level Security, and file storage. "
  "When the administrator runs synchronization, the local records are bundled into a backup file uploaded to "
  "the cloud, and resident and user records are written to their database tables; if the upload fails, the "
  "data remain on the workstation until the next synchronization.")
arch = d.add_table(rows=2, cols=4); arch.style = GRID; boxed(arch); arch.alignment = WD_TABLE_ALIGNMENT.CENTER
for i, (head, text) in enumerate([
    ("1. Pages", "Next.js App Router: residents, vitals, maternal, immunizations, referral, analytics, operations, users"),
    ("2. Services", "ClinicalService, AnalyticsService, evaluateVitals(), SupabaseSyncService"),
    ("3. Workstation", "Browser localStorage cache (offline-first)"),
    ("4. Cloud", "Supabase: Auth, PostgreSQL with RLS, audit logs, backup storage"),
]):
    hp = arch.cell(0, i).paragraphs[0]; hp.add_run(head).bold = True; hp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    bp = arch.cell(1, i).paragraphs[0]; bp.add_run(text).font.size = Pt(10)
    for p in (hp, bp):
        p.paragraph_format.line_spacing = 1.08; p.paragraph_format.space_after = Pt(2)
P("Module guard (role-based access) → Pages → Services → Workstation cache ⇄ Cloud", indent=False, align="c",
  italic=True, spacing=1.08, size=10)
cap("Figure", "System Architecture of the BHSMS")

H4("b. Clinical Rules and the Vital-Sign Triage Workflow")
P(f"Figure 4 shows the workflow of a vital-sign encounter. The health worker selects a resident and enters the "
  f"systolic and diastolic blood pressure, heart rate, respiratory rate, temperature, weight, and height. As "
  f"the values are typed, the system evaluates them and shows the severity, the clinical flags, the body mass "
  f"index, and whether a referral is recommended. When the encounter is saved, the system evaluates the values "
  f"again, adds the resident, the user, and the time, and stores the record. Table {thr_num} lists the "
  f"thresholds applied. Blood pressure sets the base severity using the Philippine clinical practice "
  f"guidelines for hypertension, with whichever of the systolic or diastolic value falls in the higher band "
  f"deciding the result. A fever raises a Normal severity to Elevated, and only a hypertensive crisis makes a "
  f"referral mandatory. The accepted ranges of each reading are enforced by the database to reject impossible "
  f"values.")
image("figure4_triage.png", "Insert the triage workflow diagram", width=5.0)
cap("Figure", "Vital-Sign Triage Workflow")
cap("Table", "Clinical Thresholds Applied by the System")
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
], widths=[1.4, 1.7, 2.3, 1.0], size=10)

H4("c. Database Design")
P("Figure 5 presents the entity-relationship diagram. The profiles table stores each user’s name, role, "
  "barangay, and assigned modules. The households and residents tables store the census of each barangay; "
  "every resident has a Unique Patient Identifier and a Soundex key for duplicate detection. The vital_signs "
  "table stores each encounter with its severity, clinical flags, and referral recommendation. The "
  "maternal_records and antenatal_visits tables store each pregnancy and its four ANC visits, and the "
  "immunizations table stores each vaccine dose of a child. The disease_surveillance_reports table stores case "
  "counts per epidemiological week, and the audit_logs table records every action for compliance with the Data "
  "Privacy Act of 2012. Every table is protected by Row-Level Security policies that restrict reading and "
  "writing by role.")
image("figure5_erd.png", "Insert the ERD")
cap("Figure", "Entity-Relationship Diagram of the BHSMS")

H4("d. User Roles and Access")
P(f"Access to the system is governed by role-based access control, summarized in Table {roles_num}. Each role "
  f"receives a default set of modules, and the administrator may grant or remove modules for an individual "
  f"user; for example, a nurse may be given access to the medical patient chart. The module is checked both by "
  f"the page and by the database, so hiding a menu item is never the only safeguard. Barangay officials see "
  f"summary reports only and never individual patient records.")
cap("Table", "User Roles and Default Module Access")
table(["Role", "Default Modules"], [
    ["Barangay Health Worker (BHW)", "Resident Registry, New Patient Intake, Vitals and Triage, Child EPI"],
    ["Nurse / Midwife", "Resident Registry, New Patient Intake, Vitals and Triage, Maternal Care, Child EPI, Hospital Referrals"],
    ["Doctor (Municipal Health Officer)", "Resident Registry, Vitals and Triage, Medical Patient Chart, Maternal Care, Child EPI, Hospital Referrals, Epidemiology Analytics"],
    ["Barangay Official (LGU Viewer)", "Epidemiology Analytics, Operations and Backup (summary data only)"],
    ["System Administrator", "All ten modules, including User Management"],
], widths=[2.2, 4.2], size=11)

MODULES = [
    ("e. Sign-In and Role-Based Dashboard", "Users sign in with their employee ID or e-mail address and password "
     "(Plate 1). Each user then sees a dashboard designed for his or her role (Plate 2): a BHW sees registration "
     "and vaccination tasks, a midwife sees pregnancies and triage alerts, the doctor sees clinical summaries, a "
     "barangay official sees community health indicators, and the administrator sees the status of the "
     "workstation and of cloud synchronization.", ["Sign-In Page", "Role-Based Dashboard"]),
    ("f. Resident Registry and New Patient Intake", "The resident registry (Plate 3) lists every registered "
     "resident with a search by name or UPI and filters by barangay and purok. On the New Patient Intake page "
     "(Plate 4), the health worker enters the resident’s name, date of birth, sex, civil status, barangay, purok, "
     "contact number, PhilHealth ID, and pregnancy status. As the name and birth date are typed, the system "
     "computes a match key from the Soundex code of the surname, the first three letters of the first name, and "
     "the date of birth, and warns if a resident with the same key already exists. Saving the record issues the "
     "resident’s Unique Patient Identifier. This answers the most common problems cited by the respondents, "
     "time-consuming recording and difficulty finding records.",
     ["Resident Registry", "New Patient Intake with Duplicate Warning"]),
    ("g. Hemodynamic Screener and Triage", f"The vitals page (Plate 5) records the seven readings and displays "
     f"the triage result as they are typed, using the rules in Table {thr_num}. The severity is shown as a "
     f"colored badge, and the history of the resident’s previous readings is listed below the form.",
     ["Hemodynamic Screener and Triage"]),
    ("h. Medical Patient Chart", "The medical chart (Plate 6) opens from the resident registry and shows the "
     "resident’s consultation history, past vital signs, and a form for recording a new encounter with the "
     "physician’s impression and plan. It is available to the doctor and the administrator, and to nurses "
     "granted this module.", ["Medical Patient Chart"]),
    ("i. Maternal Care and ANC Tracking", f"The maternal care page (Plate 7) enrolls a pregnant resident with "
     f"her obstetric history (gravida, para, full-term, preterm, abortions, and living children) and last "
     f"menstrual period. The system computes the expected date of delivery using Naegele’s rule (LMP + 1 year − "
     f"3 months + 7 days) and the gestational age, flags high-risk pregnancies (Table {thr_num}), and tracks four "
     f"ANC visits with blood pressure, weight, fundic height, fetal heart tone, and iron-folic acid "
     f"supplementation.", ["Maternal Care and ANC Tracking"]),
    ("j. Child EPI and Defaulter Tracking", "The immunization page (Plate 8) follows the DOH Expanded Program on "
     "Immunization schedule of fourteen doses from birth to twelve months: BCG and hepatitis B at birth; "
     "pentavalent, oral polio, and pneumococcal vaccines at 6, 10, and 14 weeks, with inactivated polio at 14 "
     "weeks; measles-rubella at 9 months; and MMR at 12 months. The system compares each child’s age in weeks "
     "with this schedule and lists every child who is past the target age of a dose not yet given, with the "
     "number of weeks overdue and the purok, so that BHWs can conduct home visits.",
     ["Child EPI and Defaulter List"]),
    ("k. Referral Slip (RF-1)", "The referral page (Plate 9) generates a standardized referral slip for a "
     "patient transferred to the Municipal Health Office or a hospital, with the patient’s details, latest vital "
     "signs, and clinical flags. The reason is filled in automatically for a hypertensive crisis or a pregnant "
     "patient and entered by the health worker otherwise.", ["Referral Slip (RF-1)"]),
    ("l. FHSIS Morbidity Surveillance", "The analytics page (Plate 10) generates a health profile of each "
     "barangay: the population by purok; counts of hypertensive crisis, stage 2 hypertension, febrile illness, "
     "suspected dengue (fever with “dengue” or “petechiae” in the notes), and acute respiratory infection (other "
     "febrile cases); the number of active pregnancies and the four-visit ANC coverage; and the fully immunized "
     "child rate, defined as children who received all nine core vaccines. This replaces the manual compilation "
     "of reports that most respondents identified as time-consuming.", ["FHSIS Morbidity Surveillance"]),
    ("m. Workstation Diagnostics and Synchronization", "The operations page (Plate 11) shows the records stored "
     "on the workstation, the storage used, and the connection status, and lets the administrator synchronize "
     "the data to the cloud and export a backup.", ["Workstation Diagnostics and Sync"]),
    ("n. User Accounts and Module Permissions", "The user management page (Plate 12) lets the administrator "
     "create accounts, assign one of the five roles, and grant or remove individual modules for each user.",
     ["User Accounts and Module Permissions"]),
]
PLATE_FILES = sorted(f.name for f in FIGDIR.glob("plate*.png")) + [""] * 12
for head, text, plates in MODULES:
    H4(head)
    P(text)
    for title in plates:
        image(PLATE_FILES[COUNT["Plate"]], f"Insert screenshot — {title}")
        cap("Plate", title)

H4("o. Summary of Security and Data-Integrity Measures")
P("Beyond the module-specific measures described above, the system incorporates several system-wide "
  "safeguards: a module guard that hides every page a user has not been granted; Row-Level Security policies on "
  "every database table; range checks in the database that reject impossible vital-sign values; duplicate "
  "detection during registration; an audit trail that records the actor, action, record, and time of every "
  "change; and offline storage with cloud backup that protects records from loss. These measures collectively "
  "protect the confidentiality and integrity of residents’ health data in line with the Data Privacy Act of 2012.")
P("Taken together, the features presented in this section answer Problem 2 by translating the manual, "
  "logbook-based health monitoring practices identified under Problem 1 into a centralized, offline-capable, "
  "and secure digital system.")

H3("Problem 3. How do the users evaluate the developed system in terms of effectiveness, efficiency, and user-friendliness?")
eval_first = COUNT["Table"] + 1
P(f"Data for this problem were gathered through Part III of the questionnaire (Appendix A). After the trial "
  f"period, the same {N} respondents who answered the needs assessment evaluated the system. Each statement "
  f"was rated on a five-point scale, and its weighted mean was interpreted using the system-evaluation column "
  f"of Table 4. Tables {eval_first} to {eval_first + 2} present the results by criterion, and Table "
  f"{eval_first + 3} summarizes them by barangay.")

CRIT = [
    ("On Effectiveness", "Evaluation of the System in Terms of Effectiveness", lambda t: [
        f"As shown in Table {t}, the respondents rated the effectiveness of the system with a weighted mean of "
        f"{f2(crit_m[0])}, interpreted as Agree and Very Good. They rated most highly that the system allows "
        f"users to retrieve residents’ records correctly ({m2[1]}), records health information accurately "
        f"({m2[0]}), and helps monitor the health status of residents ({m2[2]}). Reducing errors and duplicate "
        f"records obtained {m2[5]}, which directly answers the duplication problem raised in Problem 1.",
        f"The lowest-rated statements were that the system generates accurate and relevant health reports "
        f"({m2[4]}) and helps track residents who require follow-up services ({m2[3]}), on which several "
        f"respondents chose Neutral. These functions depend on records accumulating over time: surveillance "
        f"reports and follow-up lists become more useful as more encounters are entered, which a short trial "
        f"period cannot fully show."]),
    ("On Efficiency", "Evaluation of the System in Terms of Efficiency", lambda t: [
        f"Table {t} shows that the respondents rated the efficiency of the system with a weighted mean of "
        f"{f2(crit_m[1])} (Very Good). Making it easier to update residents’ health information and reducing the "
        f"paperwork of health monitoring obtained the highest means of the whole evaluation, {m2[8]} each. "
        f"Reducing the time needed to record information ({m2[6]}), simplifying report preparation ({m2[9]}), "
        f"and completing tasks with less effort ({m2[11]}) followed.",
        f"Retrieving health records quickly obtained the lowest mean in this criterion ({m2[7]}). Since retrieval "
        f"was also one of the main problems of the manual system, this result suggests that users need more "
        f"familiarity with the search and filter functions of the registry, which can be addressed in the "
        f"orientation of users."]),
    ("On User-Friendliness", "Evaluation of the System in Terms of User-Friendliness", lambda t: [
        f"As shown in Table {t}, the respondents rated the user-friendliness of the system with a weighted mean "
        f"of {f2(crit_m[2])} (Very Good), the highest of the three criteria. Clear instructions or feedback when "
        f"performing tasks, ease of navigation between features, and an understandable layout each obtained "
        f"{m2[15]}, followed by ease of learning ({m2[14]}). A clear interface and understandable menus and "
        f"buttons each obtained {m2[12]}.",
        "These results suggest that health workers with varied levels of computer experience could learn and "
        "use the system, which, according to the Technology Acceptance Model, supports its acceptance and "
        "continued use (Davis, 1989)."]),
]
for k, (head, title, text) in enumerate(CRIT):
    P(head, indent=False, bold=False)
    t = item_table(title, Q2[k][1], CRIT_IDX[k], kind=2)
    for para in text(t):
        P(para)

P("Summary of the Evaluation", indent=False)
s_num = cap("Table", "Summary of the Evaluation by Criterion and Barangay")
rows, brgy_crit = [], []
for k in range(3):
    per = [avg([item_stats(P2, i)[1][b] for i in CRIT_IDX[k]]) for b in BRGYS]
    brgy_crit.append(per)
    rows.append([Q2[k][0][3:].strip()] + [f2(x) for x in per] + [f2(crit_m[k]), rate(crit_m[k])[3]])
brgy_all2 = [avg([brgy_crit[k][j] for k in range(3)]) for j in range(3)]
rows.append(["Overall"] + [f2(x) for x in brgy_all2] + [f2(P2_ALL), rate(P2_ALL)[3]])
table(["Criterion", "Palaquio", "Tabiog", "Babangcag", "WM", "DE"], rows,
      widths=[2.0, 0.9, 0.8, 0.9, 0.7, 1.1], size=11, bold_last=True)
P(f"Table {s_num} summarizes the evaluation. The respondents rated the system within the Agree range, with an "
  f"overall weighted mean of {f2(P2_ALL)}, interpreted as Very Good. User-friendliness obtained the highest "
  f"mean ({f2(crit_m[2])}), followed by efficiency ({f2(crit_m[1])}) and effectiveness ({f2(crit_m[0])}). By "
  f"barangay, Palaquio gave the highest rating ({f2(brgy_all2[0])}), with effectiveness rated "
  f"{f2(brgy_crit[0][0])} ({rate(brgy_crit[0][0])[3]}), followed by Babangcag ({f2(brgy_all2[2])}) and Tabiog "
  f"({f2(brgy_all2[1])}). No respondent rated any statement Disagree or Strongly Disagree. These results "
  f"indicate that the users regard the system as effective, efficient, and easy to use, directly answering "
  f"Problem 3.")

# ================================================================ CHAPTER IV
chapter("IV", "CONCLUSIONS AND RECOMMENDATIONS", title_as_heading4=False)
H2("CONCLUSIONS")
P("This study was conducted to develop the Barangay Health Status Monitoring System in order to address the "
  "challenges of the manual health monitoring system of Barangays Palaquio, Tabiog, and Babangcag. Based on "
  "the findings presented in Chapter III, and guided by the three specific objectives of the study, the "
  "following conclusions are drawn.")
numbered([
    f"On the challenges of the manual system, the respondents experience them to a high extent (overall mean of "
    f"{f2(P1_ALL)}), most strongly in health record management ({f2(area_m[0])}), where the difficulty of "
    f"organizing paper records was rated Very High ({m1[0]}). Their most common problems are time-consuming "
    f"recording (30.36%), difficulty finding records (26.79%), time-consuming report preparation (28.57%), and "
    f"residents forgetting appointments (25.00%). The manual system is therefore weak in four respects: records "
    f"are slow to write, find, and update; residents who need attention are not readily identified; reports "
    f"must be compiled by hand; and paper records are hard to protect.",
    "On the design and development of the system, the Barangay Health Status Monitoring System was successfully "
    "built as an offline-first web application using Next.js, React, TypeScript, Tailwind CSS, and Supabase, "
    "following the IPO framework and the Prototype Model. It answers each identified challenge through resident "
    "registration with a Unique Patient Identifier and duplicate detection, automatic triage of vital signs "
    "based on Philippine and WHO guidelines, maternal care with high-risk flags, immunization tracking with a "
    "defaulter list, referral slips, automatically generated surveillance reports, and role-based access with "
    "an audit trail.",
    f"On the evaluation of the system, the respondents rated it at an overall weighted mean of {f2(P2_ALL)}, "
    f"interpreted as Agree and described as Very Good: user-friendliness {f2(crit_m[2])}, efficiency "
    f"{f2(crit_m[1])}, and effectiveness {f2(crit_m[0])}. The lowest individual items concern report accuracy "
    f"and follow-up tracking, functions whose value grows as records accumulate.",
])
P("Taken together, these findings show that the general objective of the study was achieved within its scope. "
  "The conclusions should be read with the study’s limitations in mind: the respondents came from three "
  "barangays, the trial period was short, IT specialists did not evaluate the system, and actual recording and "
  "reporting times were not measured before and after deployment.")

H2("RECOMMENDATIONS")
P("Based on the conclusions drawn from this study, the following recommendations are offered.")
for head, text in [
    ("a. For the Barangay Health Stations and the Municipal Health Office",
     "It is recommended that the barangay health stations adopt the system through a pilot implementation "
     "alongside the existing logbooks, encode the existing paper records of priority residents (pregnant women, "
     "children under one year, and adults with hypertension), conduct hands-on orientation for all users with "
     "emphasis on searching and filtering records, and designate a system administrator to manage accounts and "
     "perform regular synchronization and backups."),
    ("b. For System Enhancement and Future Development",
     "Future developers are encouraged to add SMS reminders for scheduled check-ups, ANC visits, and "
     "vaccinations, which address the most common follow-up problem reported by the respondents; automatic "
     "flags for abnormal heart rate and respiratory rate and a field for oxygen saturation; synchronization of "
     "vital signs and program records to their own cloud tables rather than only to the backup file; an "
     "installable mobile version for house-to-house visits; and integration with the reporting systems of the "
     "Department of Health."),
    ("c. For Future Researchers",
     "Future researchers are encouraged to measure the actual effect of the system by comparing recording, "
     "retrieval, and report-preparation times before and after implementation; to include IT specialists in the "
     "evaluation to assess security, maintainability, and performance; and to replicate the study in other "
     "barangays of Bucay with a larger and more varied group of respondents."),
    ("d. For Continuous Evaluation and Improvement",
     "It is recommended that the surveillance reports be reviewed every quarter to identify health trends and "
     "unvaccinated children, that the system be re-evaluated after a full year of use, and that periodic "
     "security reviews ensure that residents’ health information remains protected as the number of users grows."),
]:
    H4(head)
    P(text)

# ================================================================ REFERENCES
heading("REFERENCES", 1, center=True, page_break=True, after=6)
for ref in [
    "Altura, K. A. P., Madjalis, H. E. C., Sungahid, M. D. G., Serrano, E. A., & Rodriguez, R. L. (2023). Development of a web-based barangay health information system for Barangay 69, Tondo, Manila.",
    "Batoon, J. A., Benitez, A. B., Cajucom, K. Z., Dalusung, M. J. M., Faustino, S. J. D., Galvez, I. N. D., & Mercado, L. J. L. (2022). Public health record management system (PHRMS) for Barangay Sto. Rosario, Paombong, Bulacan.",
    "Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. Qualitative Research in Psychology, 3(2), 77–101. https://doi.org/10.1191/1478088706qp063oa",
    "Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. MIS Quarterly, 13(3), 319–340. https://doi.org/10.2307/249008",
    "Department of Health. (n.d.). eHealth and digital health initiatives in the Philippines. https://www.doh.gov.ph",
    "Garcia, M. R. Q., Jimenez, K. L. D., Simacon, R. R. O., Vito, M. C. C., & Yabut, E. R. (2021). B-Health: A framework for mobile and web application for barangay health center in the Municipality of Laguna. In 2021 1st International Conference in Information and Computing Research (iCORE).",
    "International Organization for Standardization. (2018). ISO 9241-11:2018 Ergonomics of human-system interaction — Part 11: Usability: Definitions and concepts. https://www.iso.org/standard/63500.html",
    "Likert, R. (1932). A technique for the measurement of attitudes. Archives of Psychology, 22(140), 1–55.",
    "Ona, D. I. D., Jimeno, C. A., Jasul, G. V., Jr., et al. (2021). Executive summary of the 2020 clinical practice guidelines for the management of hypertension in the Philippines. The Journal of Clinical Hypertension, 23(9), 1637–1650. https://doi.org/10.1111/jch.14335",
    "Republic of the Philippines. (2012). Republic Act No. 10173: Data Privacy Act of 2012. https://lawphil.net/statutes/repacts/ra2012/ra_10173_2012.html",
    "Sumaylo, D. J. F. (2013). Information delivery in the provision of barangay health services in Barangay Dawis, Digos City, Philippines.",
    "Supabase. (2026). Row level security. Supabase Docs. https://supabase.com/docs/guides/database/postgres/row-level-security",
    "United Nations. (2023). Sustainable development goals. https://sdgs.un.org/goals",
    "Vercel. (2026). Next.js documentation. https://nextjs.org/docs",
    "WHO Expert Consultation. (2004). Appropriate body-mass index for Asian populations and its implications for policy and intervention strategies. The Lancet, 363(9403), 157–163. https://doi.org/10.1016/S0140-6736(03)15268-3",
    "World Health Organization. (2021). Global strategy on digital health 2020–2025. https://www.who.int/publications/i/item/9789240020924",
]:
    p = P(ref, indent=False, align="l", spacing=1.0, after=10.6)
    p.paragraph_format.left_indent = Inches(0.5)
    p.paragraph_format.first_line_indent = Inches(-0.5)

# ================================================================ APPENDIX A (from the questionnaire file, not the PDF)
heading("APPENDIX A", 1, center=True, page_break=True, after=6)
heading("QUESTIONNAIRE ON THE CHALLENGES ENCOUNTERED IN THE CURRENT MANUAL BARANGAY HEALTH MONITORING SYSTEM",
        4, center=True, after=6).paragraph_format.line_spacing = 1.1
P("Dear Respondent: This questionnaire aims to identify the challenges encountered by barangay health workers "
  "and other authorized personnel in managing health records and monitoring the health status of residents "
  "using the current manual system. Your answers will be used only for this study and will be kept "
  "confidential.", indent=False, spacing=1.1, after=8)
P("Please check the column that corresponds to your answer: 5 – Strongly Agree (SA), 4 – Agree (A), 3 – "
  "Neutral (N), 2 – Disagree (D), 1 – Strongly Disagree (SD).", indent=False, spacing=1.1, after=8)

def instrument(groups):
    for head, items in groups:
        H4(head)
        table(["No.", "Statement", "SA 5", "A 4", "N 3", "D 2", "SD 1"],
              [[f"{head[0]}{i}", s, "", "", "", "", ""] for i, s in enumerate(items, 1)],
              widths=[0.5, 3.4, 0.5, 0.5, 0.5, 0.5, 0.5], size=11)

heading("Part I. Challenges in the Current Manual Health Monitoring System", 4, after=4)
instrument(Q1)
heading("Part II. Open-Ended Questions", 4, after=4)
P("Please answer briefly based on your experience.", indent=False, spacing=1.1, after=6)
for i, q in enumerate([
    "What are the most common problems you encounter when recording and updating residents’ health information?",
    "What difficulties do you experience when retrieving and monitoring residents’ health records?",
    "What challenges do you encounter when preparing and submitting barangay health reports?",
    "What problems arise when tracking residents who need follow-up consultations, vaccinations, or other health services?",
], 1):
    P(f"{i}. {q}", indent=False, spacing=1.1, after=4)
    P("_" * 60, indent=False, spacing=1.5, after=8)
heading("Part III. Evaluation of the Barangay Health Status Monitoring System", 4, after=4)
P("Instructions: Please evaluate the developed Barangay Health Status Monitoring System based on your "
  "experience in using it. Put a check mark (✓) in the column that corresponds to your level of agreement "
  "with each statement.", indent=False, spacing=1.1, after=8)
instrument(Q2)

fill_lists()
d.save(OUT)
print(f"wrote {OUT}")
print(f"tables {COUNT['Table']}, figures {COUNT['Figure']}, plates {COUNT['Plate']}")
print(f"Part I overall {P1_ALL:.2f}, areas {[round(x, 2) for x in area_m]}")
print(f"Part II overall {P2_ALL:.2f}, criteria {[round(x, 2) for x in crit_m]}")
