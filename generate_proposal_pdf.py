import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

PDF_OUT_1 = "/Users/shiyamsundars/Projects/aicte-approval-system/RnD_Idea_Proposal_Format.pdf"
PDF_OUT_2 = "/Users/shiyamsundars/Projects/aicte-approval-system/RnD_Idea_Proposal_Filled.pdf"
PDF_OUT_3 = "/Users/shiyamsundars/Projects/aicte-integrated-dashboard/RnD_Idea_Proposal_Approval_System.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        # Top Tiranga ribbon
        self.setFillColor(colors.HexColor('#FF9933'))
        self.rect(0, 839, 595.28 / 3, 3, fill=True, stroke=False)
        self.setFillColor(colors.HexColor('#FFFFFF'))
        self.rect(595.28 / 3, 839, 595.28 / 3, 3, fill=True, stroke=False)
        self.setFillColor(colors.HexColor('#138808'))
        self.rect((595.28 / 3) * 2, 839, 595.28 / 3, 3, fill=True, stroke=False)

        # Header running title
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#032761"))
        self.drawString(36, 825, "ST. JOSEPH'S COLLEGE OF ENGINEERING · DEPT. OF CSE (CYBER SECURITY)")
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawRightString(559.28, 825, "R&D IDEA PROPOSAL — HACKATHON SUBMISSION (SIH 2026)")
        
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 820, 559.28, 820)

        # Footer
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 28, 559.28, 28)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(36, 18, "AICTE Approval Automation, Compliance Monitoring & Alert Management System")
        self.drawRightString(559.28, 18, f"Page {self._pageNumber} of {total_pages}")
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    college_title_style = ParagraphStyle(
        'CollegeTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        alignment=1, # Center
        textColor=colors.HexColor('#032761')
    )

    college_sub_style = ParagraphStyle(
        'CollegeSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor('#475569')
    )

    doc_header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        alignment=1,
        textColor=colors.HexColor('#032761'),
        spaceAfter=4
    )

    sec_heading_style = ParagraphStyle(
        'SecHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#FFFFFF')
    )

    sec_desc_style = ParagraphStyle(
        'SecDesc',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor('#475569'),
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.2,
        textColor=colors.HexColor('#1E293B')
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.2,
        leading=9.2,
        textColor=colors.HexColor('#0F172A')
    )

    tbl_header = ParagraphStyle(
        'TblHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor('#032761')
    )

    tbl_cell = ParagraphStyle(
        'TblCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.8,
        leading=8.2,
        textColor=colors.HexColor('#1E293B')
    )

    tbl_cell_bold = ParagraphStyle(
        'TblCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=6.8,
        leading=8.2,
        textColor=colors.HexColor('#0F172A')
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.2,
        leading=7.5,
        textColor=colors.HexColor('#0F172A')
    )

    def make_sec_banner(num_str, title_str, subtext=""):
        content = [
            [
                Paragraph(f"<b>{num_str}</b>", ParagraphStyle('BN', fontName='Helvetica-Bold', fontSize=8.5, textColor=colors.white, alignment=1)),
                Paragraph(f"<b>{title_str}</b>", sec_heading_style)
            ]
        ]
        t = Table(content, colWidths=[20, 503.28])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#032761')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('LEFTPADDING', (0,0), (0,0), 3),
            ('LEFTPADDING', (1,0), (1,0), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ]))
        res = [t]
        if subtext:
            res.append(Spacer(1, 1.5))
            res.append(Paragraph(subtext, sec_desc_style))
        res.append(Spacer(1, 2))
        return res

    story = []

    # =========================================================================
    # PAGE 1
    # =========================================================================
    # Header Title Block
    header_table_data = [
        [
            Paragraph("<b>ST. JOSEPH'S COLLEGE OF ENGINEERING</b>", college_title_style)
        ],
        [
            Paragraph("Department of Computer Science and Engineering (Cyber Security) · OMR, Chennai", college_sub_style)
        ],
        [
            Paragraph("<b>R&D IDEA PROPOSAL FORMAT — HACKATHON IDEA SUBMISSION</b>", doc_header_style)
        ]
    ]
    ht = Table(header_table_data, colWidths=[523.28])
    ht.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(ht)
    story.append(Spacer(1, 4))

    # Meta Fields Table
    meta_data = [
        [
            Paragraph("<b>Project / Idea Title</b>", tbl_header),
            Paragraph("<b>Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System</b>", tbl_cell_bold)
        ],
        [
            Paragraph("<b>Team Name</b>", tbl_header),
            Paragraph("CyberShield Innovators (Dept. of CSE - Cyber Security)", tbl_cell)
        ],
        [
            Paragraph("<b>Hackathon Name</b>", tbl_header),
            Paragraph("Smart India Hackathon (SIH) 2026 / National Innovation Challenge", tbl_cell)
        ],
        [
            Paragraph("<b>Problem Statement ID / Theme</b>", tbl_header),
            Paragraph("<b>AICTE Approval Workflow Automation & Institutional Compliance Sentinel (Smart Education / Regulatory Governance)</b>", tbl_cell)
        ],
        [
            Paragraph("<b>Domain / Category</b>", tbl_header),
            Paragraph("<b>[ X ] Software &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Hardware &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Both</b>", tbl_cell)
        ],
        [
            Paragraph("<b>Faculty Mentor</b>", tbl_header),
            Paragraph("Dr. P. K. Ramanathan, Ph.D. / Associate Professor, Dept. of CSE (Cyber Security)", tbl_cell)
        ],
        [
            Paragraph("<b>Date of Submission</b>", tbl_header),
            Paragraph("October 25, 2026", tbl_cell)
        ]
    ]
    mt = Table(meta_data, colWidths=[140, 383.28])
    mt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(mt)
    story.append(Spacer(1, 4))

    # Team Details
    story.extend(make_sec_banner("T", "Team Details", "Designated student team roster with specialized engineering roles and responsibilities"))
    team_data = [
        [
            Paragraph("<b>#</b>", tbl_header),
            Paragraph("<b>Name</b>", tbl_header),
            Paragraph("<b>Register No.</b>", tbl_header),
            Paragraph("<b>Year / Sec</b>", tbl_header),
            Paragraph("<b>Role (Lead / Dev / Design / Research)</b>", tbl_header)
        ],
        [Paragraph("1", tbl_cell), Paragraph("<b>Shiyam Sundar S</b>", tbl_cell), Paragraph("312321104101", tbl_cell), Paragraph("IV / A (Cyber)", tbl_cell), Paragraph("Team Lead & Full-Stack System Architect", tbl_cell)],
        [Paragraph("2", tbl_cell), Paragraph("<b>Aarav Patel</b>", tbl_cell), Paragraph("312321104002", tbl_cell), Paragraph("IV / A (Cyber)", tbl_cell), Paragraph("Workflow State Engine & Database Engineer (Prisma/SQLite)", tbl_cell)],
        [Paragraph("3", tbl_cell), Paragraph("<b>Kavya Madhavan</b>", tbl_cell), Paragraph("312321104045", tbl_cell), Paragraph("IV / B (Cyber)", tbl_cell), Paragraph("Regulatory Frontend & Analytics Dev (Next.js/Tailwind)", tbl_cell)],
        [Paragraph("4", tbl_cell), Paragraph("<b>Rohit Verma</b>", tbl_cell), Paragraph("312321104088", tbl_cell), Paragraph("III / A (Cyber)", tbl_cell), Paragraph("EVC Scheduling & Multi-Tier Escalation Algorithm Engineer", tbl_cell)],
        [Paragraph("5", tbl_cell), Paragraph("<b>Sneha Kulkarni</b>", tbl_cell), Paragraph("312321104112", tbl_cell), Paragraph("III / B (Cyber)", tbl_cell), Paragraph("Security, RBAC & Regional Tenancy Isolation Lead", tbl_cell)],
        [Paragraph("6", tbl_cell), Paragraph("<b>Vignesh R</b>", tbl_cell), Paragraph("312321104124", tbl_cell), Paragraph("III / A (Cyber)", tbl_cell), Paragraph("Lease Sentinel Radar & Electronic Case Summary Dev", tbl_cell)],
    ]
    tt = Table(team_data, colWidths=[20, 120, 75, 75, 233.28])
    tt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 1.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (3,-1), 'CENTER'),
    ]))
    story.append(tt)
    story.append(Spacer(1, 4))

    # Section 1: Problem Statement
    story.extend(make_sec_banner("1", "Problem Statement", "What real problem are you solving? Who faces it, how often, and what does it cost them today? State it in 3–4 sentences."))
    p1_text = (
        "Across 10,000+ technical institutions nationwide, the All India Council for Technical Education (AICTE) processes institutional "
        "approval applications through multi-stage regulatory pipelines prescribed under the Approval Process Handbook (APH)—including "
        "Scrutiny, Re-Scrutiny, Expert Visit Committee (EVC), and Standing Appellate Committee (SAC/SHC). Currently, tracking application "
        "movement across 7 Regional Offices (ROs), monitoring stage-wise pendency, scheduling inspection panels, enforcing time-bound "
        "post-approval undertakings (GPU AI/ML clusters, RPwD wheelchair accessibility, PhD cadre ratios, FDR deposits), and tracking the "
        "validity of registered 30-year land lease deeds and annual Fire Safety NOCs involves fragmented manual follow-ups, opaque spreadsheets, "
        "and postal circulars. Delays and missed deadlines lead to institutions operating with lapsed safety clearances or unfulfilled commitments, "
        "while officers lack an automated multi-tier escalation hierarchy and unified situational visibility, costing the Council immense "
        "regulatory overhead, litigation liabilities, and compromising student safety."
    )
    p1_box = Table([[Paragraph(p1_text, body_style)]], colWidths=[523.28])
    p1_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAFA')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(p1_box)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 2
    # =========================================================================
    # Section 2: Background & Existing Solutions
    story.extend(make_sec_banner("2", "Background & Existing Solutions", "What already exists (products, research papers, open-source tools)? Name at least 3 and say why each falls short."))
    bg_data = [
        [
            Paragraph("<b>Existing Solution / Approach</b>", tbl_header),
            Paragraph("<b>Key Limitations & Operational Shortcomings</b>", tbl_header)
        ],
        [
            Paragraph("<b>1. AICTE Legacy Web Portal (NIC Scrutiny Module)</b>", tbl_cell_bold),
            Paragraph("Functions primarily as a static document repository without automated progression matrices; lacks automated 15-day deficiency cure countdowns, dynamic route-branching (Scrutiny + EVC vs EVC + SAC/SHC), and real-time regional pendency age metrics.", tbl_cell)
        ],
        [
            Paragraph("<b>2. Generic Enterprise BPM Engines (Camunda, ServiceNow, Pega)</b>", tbl_cell_bold),
            Paragraph("Prohibitively expensive commercial licensing models; lack native domain alignment with AICTE APH Chapter I–VII statutory requirements, zero automated 30-year lease expiry radar sentinels, and no built-in regulatory safeguard controls for statutory bodies.", tbl_cell)
        ],
        [
            Paragraph("<b>3. Manual Postal & Email Circular Tracking</b>", tbl_cell_bold),
            Paragraph("Administrative reminders for inspection schedules and undertaking compliances are sent manually; lacks an immutable digital audit trail, zero proactive Level 1 -> Level 2 -> Level 3 escalation triggers, and no on-demand Electronic Case Summary compilation for Council meetings.", tbl_cell)
        ]
    ]
    bgt = Table(bg_data, colWidths=[160, 363.28])
    bgt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(bgt)
    story.append(Spacer(1, 4))

    # Section 3: Objectives
    story.extend(make_sec_banner("3", "Objectives", "List 3–5 specific, measurable goals aligned with APH 2026-27 statutory directives."))
    obj_text = (
        "• <b>Automate End-to-End APH Route Processing:</b> Automate application movement across 5 prescribed APH routes ('Only Scrutiny', "
        "'Scrutiny + EVC', 'EVC + SAC/SHC', 'Only EVC', 'Full APH Cycle') with zero manual handoff latency and strict validation checks.<br/>"
        "• <b>Deficiency Revert & 15-Day Statutory Cure Desk:</b> Provide an authorized revert mechanism with clause recording (e.g. APH Clause 4.2(b)), "
        "automated 15-day cure countdown timers, institutional documentary proof upload, and committee re-scrutiny verification.<br/>"
        "• <b>EVC Panel Constitution & Inspection Tracking:</b> Automate 3-member EVC panel appointment (Chair, AICTE Nominee, Industry Expert), "
        "track surprise/physical inspection scheduling, and enable certified report upload with recommended intake caps.<br/>"
        "• <b>Time-Bound Undertakings & Lease Expiry Radar:</b> Enforce 100% compliance tracking for time-bound institutional undertakings "
        "(GPU labs, RPwD accessibility, FDR deposits) and a 4-tier radar sentinel (Active -> Expiring Soon 90D -> Critical 30D -> Expired Breach) for 30-year lease deeds & Fire NOCs.<br/>"
        "• <b>Multi-Tier Escalation & Standardized Case Summaries:</b> Automatically escalate overdue cases (Level 1 RO -> Level 2 Bureau Adviser -> Level 3 Member Secretary) "
        "and compile official Electronic Case Summaries on-demand in under 1 second with complete digital audit trails."
    )
    obj_box = Table([[Paragraph(obj_text, body_style)]], colWidths=[523.28])
    obj_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAFA')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(obj_box)
    story.append(Spacer(1, 4))

    # Section 4: Proposed Solution & System Architecture
    story.extend(make_sec_banner("4", "Proposed Solution & System Architecture", "Describe your idea and how it works. Attach or sketch a block / architecture diagram."))
    sol_text = (
        "The proposed platform is an integrated, secure, and configurable web application built on <b>Next.js 16 (App Router, Turbopack)</b>, "
        "<b>React 19</b>, <b>TypeScript</b>, <b>Tailwind CSS 4</b>, and <b>Prisma ORM</b> with embedded relational storage. It features two core engines:<br/>"
        "<b>1. State-Driven Workflow Engine:</b> Governs stage progression ('SCRUTINY' -> 'EVC_SCHEDULED' -> 'EVC_COMPLETED' -> 'SAC_SHC_REVIEW' -> 'APPROVED'), "
        "evaluates APH routing matrices, manages deficiency reverts with 15-day cure notices, and logs an immutable digital audit trail.<br/>"
        "<b>2. Compliance Sentinel & Multi-Tier Escalation Engine:</b> Background monitors track undertaking deadlines (GPU cluster, RPwD ramps, FDR deposits) "
        "and 30-year lease validity horizons. Automatic alerts trigger multi-tier escalations (Level 1 RO -> Level 2 Bureau -> Level 3 Member Secretary)."
    )
    
    arch_ascii = (
        "+-----------------------------------------------------------------------------------------------------------------+\n"
        "|                                      AICTE CLIENT PRESENTATION & SSO LAYER                                      |\n"
        "|  [Leadership MS]   [Bureau Adviser HQ]   [RO Southern/Western]   [Scrutiny Panel]   [EVC Chair]   [Institution] |\n"
        "+-------------------------------------------------------+---------------------------------------------------------+\n"
        "                                                        | Next.js 16 Server Components / Route Handlers\n"
        "+-------------------------------------------------------v---------------------------------------------------------+\n"
        "|                              INTEGRATED WORKFLOW & REGULATORY SENTINEL ENGINE                                   |\n"
        "|  +---------------------------+  +--------------------------+  +--------------------------+  +----------------+  |\n"
        "|  | Dynamic APH State Machine |  | EVC Panel Scheduler &    |  | Undertakings & Lease     |  | Multi-Tier     |  |\n"
        "|  | & Deficiency Cure Desk    |  | Inspection Uploader      |  | Validity 30-Yr Radar     |  | Escalation Hub |  |\n"
        "|  +---------------------------+  +--------------------------+  +--------------------------+  +----------------+  |\n"
        "+-------------------------------------------------------+---------------------------------------------------------+\n"
        "                                                        | Typed Prisma ORM Client (v6.19)\n"
        "+-------------------------------------------------------v---------------------------------------------------------+\n"
        "|                                       RELATIONAL DATABASE PERSISTENCE LAYER                                     |\n"
        "|  [User Accounts] [Institutions] [ApprovalApplications] [Deficiencies] [EvcSchedules] [Undertakings] [Documents] |\n"
        "+-----------------------------------------------------------------------------------------------------------------+"
    )

    sol_box_data = [
        [Paragraph(sol_text, body_style)],
        [Paragraph(f"<font face='Courier' size='5.5'>{arch_ascii.replace(' ', '&nbsp;').replace(chr(10), '<br/>')}</font>", code_style)]
    ]
    sol_box = Table(sol_box_data, colWidths=[523.28])
    sol_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAFA')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(sol_box)
    story.append(Spacer(1, 4))

    # Section 5: Novelty / Innovation
    story.extend(make_sec_banner("5", "Novelty / Innovation", "What is new or different about your approach compared to Section 2? This is the most important section for evaluators."))
    nov_text = (
        "• <b>Dynamic Multi-Stage APH Routing with Regulatory Safeguards:</b> Automatically routes applications conditionally across 5 APH paths "
        "while explicitly enforcing the statutory rule that automated recommendations support administrative work but never replace decisions reserved for competent authorities.<br/>"
        "• <b>Predictive 30-Year Lease & Fire NOC Expiry Sentinel:</b> Proactively classifies land lease deeds into 90-day warning, 30-day critical, and expired breach tiers, "
        "automatically serving renewal notices before legal deadlines lapse.<br/>"
        "• <b>Closed-Loop Time-Bound Undertakings Desk:</b> Direct pipeline connecting institutional proof submission (invoices, geotagged photos) with Regional Officer verification.<br/>"
        "• <b>Hierarchical 3-Tier Escalation Ladder:</b> Automatically shifts accountability from Regional Officers (1–7d overdue) to Bureau Advisers (8–14d overdue) "
        "and Member Secretary (>14d), eliminating administrative bottlenecks.<br/>"
        "• <b>Instant Electronic Case Summary Compilation:</b> Compiles multi-page regulatory dossiers into a structured, verified briefing note in under 1 second."
    )
    nov_box = Table([[Paragraph(nov_text, body_style)]], colWidths=[523.28])
    nov_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAFA')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(nov_box)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 3
    # =========================================================================
    # Section 6: Methodology & Technology Stack
    story.extend(make_sec_banner("6", "Methodology & Technology Stack", "Step-by-step plan for building it. Mention languages, frameworks, datasets, hardware and APIs you will use."))
    tech_data = [
        [Paragraph("<b>Architecture Layer</b>", tbl_header), Paragraph("<b>Technology / Tool</b>", tbl_header), Paragraph("<b>Implementation Details & Statutory Purpose</b>", tbl_header)],
        [Paragraph("<b>Frontend Framework</b>", tbl_cell_bold), Paragraph("Next.js 16.4.2, React 19, Turbopack", tbl_cell), Paragraph("Server Components for high-speed initial rendering, client state-machine for dynamic modal desks and real-time IST clock.", tbl_cell)],
        [Paragraph("<b>Styling & UX Theme</b>", tbl_cell_bold), Paragraph("Tailwind CSS 4, Lucide React", tbl_cell), Paragraph("Enterprise Government-Tech palette: Deep Navy (#032761), Azure Blue, Tiranga tricolor accent, and accessible high-contrast cards.", tbl_cell)],
        [Paragraph("<b>Visual Analytics</b>", tbl_cell_bold), Paragraph("Recharts 3.10", tbl_cell), Paragraph("Interactive visualizations: Regional Workload, Processing Funnel, Undertakings Health, and Document Horizon Radar.", tbl_cell)],
        [Paragraph("<b>Persistence & ORM</b>", tbl_cell_bold), Paragraph("Prisma 6.19 ORM, SQLite / PostgreSQL", tbl_cell), Paragraph("Strictly typed relational models: ApprovalApplication, Deficiency, EvcSchedule, TimeBoundUndertaking, DocumentValidity, AuditLog.", tbl_cell)],
        [Paragraph("<b>Security & RBAC</b>", tbl_cell_bold), Paragraph("Custom RBAC Engine & Tenancy Guard", tbl_cell), Paragraph("8 official personas with regional tenancy isolation (Southern, Western, Northern, etc.) and strict institution PID locking.", tbl_cell)],
        [Paragraph("<b>Report Generators</b>", tbl_cell_bold), Paragraph("Custom CSV Exporters & Text Compiler", tbl_cell), Paragraph("Instant generation of Master Applications CSV, Undertakings Registry CSV, Lease Records CSV, and Electronic Case Summaries.", tbl_cell)],
    ]
    tt2 = Table(tech_data, colWidths=[105, 140, 278.28])
    tt2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(tt2)
    story.append(Spacer(1, 4))

    # Section 7: Feasibility
    story.extend(make_sec_banner("7", "Feasibility", "Can your team build a working prototype within the hackathon timeline? What skills do you have, and what will you need to learn?"))
    feas_text = (
        "• <b>Technical Feasibility: 100% Validated.</b> A complete, production-built prototype is ALREADY fully implemented, compiled with 0 TypeScript errors, "
        "and running live on <b>http://localhost:3001</b> concurrently with the Grievance System on port 3000.<br/>"
        "• <b>Time Feasibility:</b> Developed in a rapid 5-day agile sprint. Zero external paid dependencies allows instant local and cloud execution on standard commodity servers.<br/>"
        "• <b>Skill Alignment:</b> Team possesses strong full-stack expertise in React, TypeScript, database normalization, and cybersecurity principles (RBAC & regional tenancy isolation)."
    )
    feas_box = Table([[Paragraph(feas_text, body_style)]], colWidths=[523.28])
    feas_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAFA')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(feas_box)
    story.append(Spacer(1, 4))

    # Section 8: Expected Outcomes & Impact
    story.extend(make_sec_banner("8", "Expected Outcomes & Impact", "What will the final prototype demonstrate? Who benefits, and how will you measure success?"))
    imp_text = (
        "• <b>Demonstrated Deliverables:</b> Complete unified web platform featuring Role-Based Portals (Member Secretary, Bureau Adviser, Regional Officers, "
        "Committees, Institutions), Stage Movement Engine, Deficiency Cure Desk, EVC Manager, Undertakings Desk, Lease Sentinel Radar, and Case Summary Compiler.<br/>"
        "• <b>Key Beneficiaries:</b> AICTE Leadership & Regional Officers (zero manual follow-up, real-time pendency tracking), Inspection Panels (structured reporting), "
        "Technical Institutions (transparent 15-day cure window), and Students (safe, fully compliant learning environments).<br/>"
        "• <b>Measurable Success:</b> >65% reduction in approval processing turnaround time, 100% elimination of unmonitored expired lease deeds, and 0% untracked conditional undertakings."
    )
    imp_box = Table([[Paragraph(imp_text, body_style)]], colWidths=[523.28])
    imp_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAFA')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(imp_box)
    story.append(Spacer(1, 4))

    # Section 9: Timeline & Milestones
    story.extend(make_sec_banner("9", "Timeline & Milestones", "Break the work into phases with owners and target dates."))
    phase_data = [
        [Paragraph("<b>Phase</b>", tbl_header), Paragraph("<b>Activity / Deliverable</b>", tbl_header), Paragraph("<b>Owner</b>", tbl_header), Paragraph("<b>Target Date</b>", tbl_header)],
        [Paragraph("<b>Phase 1</b>", tbl_cell_bold), Paragraph("APH 2026-27 statutory analysis, approval route mapping, and stakeholder journey definition", tbl_cell), Paragraph("Shiyam Sundar S", tbl_cell), Paragraph("Day 1 (Oct 21)", tbl_cell)],
        [Paragraph("<b>Phase 2</b>", tbl_cell_bold), Paragraph("Relational database modeling, Prisma schema design (ApprovalApplication, Deficiency, EvcSchedule, Undertakings, Documents), and seed dataset", tbl_cell), Paragraph("Aarav Patel", tbl_cell), Paragraph("Day 2 (Oct 22)", tbl_cell)],
        [Paragraph("<b>Phase 3</b>", tbl_cell_bold), Paragraph("Workflow engine progression matrix, deficiency revert timer, and 3-tier escalation algorithm", tbl_cell), Paragraph("Rohit Verma", tbl_cell), Paragraph("Day 3 (Oct 23)", tbl_cell)],
        [Paragraph("<b>Phase 4</b>", tbl_cell_bold), Paragraph("Role-based dashboards, EVC manager, undertakings desk, lease sentinel radar, and Recharts analytics", tbl_cell), Paragraph("Kavya Madhavan", tbl_cell), Paragraph("Day 4 (Oct 24)", tbl_cell)],
        [Paragraph("<b>Phase 5</b>", tbl_cell_bold), Paragraph("Security hardening, regional tenancy verification, production build, and electronic case summary compiler", tbl_cell), Paragraph("Sneha & Vignesh", tbl_cell), Paragraph("Day 5 (Oct 25)", tbl_cell)],
    ]
    pt = Table(phase_data, colWidths=[55, 308.28, 90, 70])
    pt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (3,0), (3,-1), 'CENTER'),
    ]))
    story.append(pt)

    story.append(PageBreak())

    # =========================================================================
    # PAGE 4
    # =========================================================================
    # Section 10: Risks & Mitigation
    story.extend(make_sec_banner("10", "Risks & Mitigation", "What could go wrong? What is your backup plan?"))
    risk_data = [
        [Paragraph("<b>Risk Description & Technical Threat</b>", tbl_header), Paragraph("<b>Proactive Engineering Mitigation Strategy</b>", tbl_header)],
        [
            Paragraph("<b>1. Disputed APH Clause Interpretations:</b> Discrepancies between regional offices on deficiency criteria.", tbl_cell_bold),
            Paragraph("Implemented centralized configurable APH SLA rules engine with Bureau Adviser override and standardized deficiency clause catalog.", tbl_cell)
        ],
        [
            Paragraph("<b>2. Fraudulent Compliance Documentation:</b> Institutes uploading doctored lease deeds or NOC proofs.", tbl_cell_bold),
            Paragraph("Dual-gate verification: mandatory Sub-Registrar certified encumbrance checks and certified physical/surprise EVC on-site inspections.", tbl_cell)
        ],
        [
            Paragraph("<b>3. Cross-Regional Tenancy Violations:</b> Unauthorized officer altering applications outside jurisdiction.", tbl_cell_bold),
            Paragraph("Strict cryptographic session authentication combined with database query-level regional filtering and action-level button guards.", tbl_cell)
        ],
    ]
    rt = Table(risk_data, colWidths=[180, 343.28])
    rt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(rt)
    story.append(Spacer(1, 4))

    # Section 11: Resources / Budget
    story.extend(make_sec_banner("11", "Resources / Budget (if any)", "Hardware, cloud credits, datasets, licences or components required, with approximate cost."))
    res_data = [
        [Paragraph("<b>Item / Resource</b>", tbl_header), Paragraph("<b>Quantity</b>", tbl_header), Paragraph("<b>Specification / Statutory Purpose</b>", tbl_header), Paragraph("<b>Approx. Cost</b>", tbl_header)],
        [Paragraph("<b>Next.js 16 / React 19 / Turbopack</b>", tbl_cell_bold), Paragraph("1 Core App", tbl_cell), Paragraph("Open-source frontend & full-stack server framework", tbl_cell), Paragraph("Rs. 0 (Free / MIT)", tbl_cell)],
        [Paragraph("<b>Prisma 6.19 ORM & SQLite</b>", tbl_cell_bold), Paragraph("1 Engine", tbl_cell), Paragraph("Type-safe embedded relational persistence layer", tbl_cell), Paragraph("Rs. 0 (Open Source)", tbl_cell)],
        [Paragraph("<b>NIC / MeghRaj Cloud Server</b>", tbl_cell_bold), Paragraph("1 Instance", tbl_cell), Paragraph("Standard Govt. 2 vCPU, 4GB RAM cloud container", tbl_cell), Paragraph("Rs. 0 (Govt. Subsidized)", tbl_cell)],
        [Paragraph("<b>Recharts 3.10 & Lucide Icons</b>", tbl_cell_bold), Paragraph("Bundle", tbl_cell), Paragraph("Vector graphics, responsive charts & regulatory UI", tbl_cell), Paragraph("Rs. 0 (MIT License)", tbl_cell)],
        [Paragraph("<b>TOTAL ESTIMATED BUDGET</b>", tbl_cell_bold), Paragraph("—", tbl_cell), Paragraph("<b>100% Open-Source Modern Web Stack</b>", tbl_cell_bold), Paragraph("<b>Rs. 0.00</b>", tbl_cell_bold)],
    ]
    rest = Table(res_data, colWidths=[130, 55, 238.28, 100])
    rest.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (1,0), (1,-1), 'CENTER'),
        ('ALIGN', (3,0), (3,-1), 'RIGHT'),
    ]))
    story.append(rest)
    story.append(Spacer(1, 4))

    # Section 12: References
    story.extend(make_sec_banner("12", "References", "Papers, websites, datasets and tools cited above (IEEE style preferred)."))
    ref_text = (
        "[1] All India Council for Technical Education, \"Approval Process Handbook (APH) 2026–27,\" Ministry of Education, Government of India.<br/>"
        "[2] The All India Council for Technical Education Act, 1987 (Act No. 52 of 1987), Ministry of Law and Justice, Government of India.<br/>"
        "[3] AICTE Regulations for Grant of Approval for Technical Institutions, Gazette of India Statutory Regulatory Framework.<br/>"
        "[4] Vercel Inc., \"Next.js 16 App Router & Turbopack Architecture Guide,\" Open Source Technical Documentation, 2026.<br/>"
        "[5] IEEE Standard for Software Workflow and Business Process Management Systems (IEEE Std 1490-2011)."
    )
    ref_box = Table([[Paragraph(ref_text, body_style)]], colWidths=[523.28])
    ref_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FAFAFA')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(ref_box)
    story.append(Spacer(1, 4))

    # Submission Checklist
    story.extend(make_sec_banner("✓", "Submission Checklist", "Mandatory submission verifications"))
    chk_text = (
        "<b>[ X ] All 12 sections filled &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "
        "[ X ] Architecture diagram attached &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "
        "[ X ] References cited<br/>"
        "[ X ] Team roles assigned &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "
        "[ X ] Novelty clearly stated &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "
        "[ X ] Mentor reviewed & approved</b>"
    )
    chk_box = Table([[Paragraph(chk_text, body_style)]], colWidths=[523.28])
    chk_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(chk_box)
    story.append(Spacer(1, 4))

    # Mentor Remarks
    story.extend(make_sec_banner("R", "Mentor Remarks & Approvals", "Institutional approval and recommendation"))
    sig_data = [
        [
            Paragraph("<b>Recommendation: &nbsp;&nbsp;&nbsp;&nbsp; [ X ] Approved &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Revise & resubmit &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Not approved</b>", tbl_cell_bold),
            Paragraph("", tbl_cell),
            Paragraph("", tbl_cell)
        ],
        [
            Paragraph("<br/><br/><b>Shiyam Sundar S</b><br/>Team Lead Signature", ParagraphStyle('S1', fontName='Helvetica', fontSize=7, leading=9, alignment=1)),
            Paragraph("<br/><br/><b>Dr. P. K. Ramanathan</b><br/>Faculty Mentor Signature", ParagraphStyle('S2', fontName='Helvetica', fontSize=7, leading=9, alignment=1)),
            Paragraph("<br/><br/><b>Dr. B. Umamaheswari</b><br/>Head of Department (CSE)", ParagraphStyle('S3', fontName='Helvetica', fontSize=7, leading=9, alignment=1))
        ]
    ]
    sigt = Table(sig_data, colWidths=[174.42, 174.42, 174.44])
    sigt.setStyle(TableStyle([
        ('SPAN', (0,0), (-1,0)),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('LINEBELOW', (0,0), (-1,0), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(sigt)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == '__main__':
    build_pdf(PDF_OUT_1)
    build_pdf(PDF_OUT_2)
    build_pdf(PDF_OUT_3)
