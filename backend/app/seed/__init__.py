"""Seed data runner — populates the database with departments, subjects, timetables, prompts, and demo users.

Data sources:
- Departments & subjects: InCloudHub/MEDHAS medhas-context.js
- Timetables: APY seed_data.py (CSE A-D sections)
- Prompt templates: InCloudHub/MEDHAS medhas-prompts.js
- Career paths: InCloudHub/MEDHAS medhas-context.js BRANCH_METADATA
"""

import json
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.auth.security import hash_pin
from app.models.user import User, UserRole
from app.models.attendance import Section, TimetableBlock
from app.models.content import Department, Subject, Curriculum, SubjectUnit, LearningResource
from app.models.prompt import PromptTemplate, CareerPath, RoadmapItem
from app.models.campus import CampusService
from app.config import settings

logger = logging.getLogger("seed")

# ===== DEPARTMENTS (from InCloudHub medhas-context.js BRANCH_METADATA) =====
DEPARTMENTS = [
    {"code": "CSE", "name": "Computer Science & Engineering", "icon": "💻", "category": "Computing & Software",
     "core_topics": json.dumps(["Data Structures", "Algorithms", "C Programming", "Operating Systems", "Web Development"]),
     "career_domains": json.dumps(["Software Engineering", "Full Stack Development", "Cloud Computing", "Cybersecurity", "Systems Architecture"])},
    {"code": "AIDS", "name": "AI & Data Science", "icon": "⚛️", "category": "Data Science & Intelligence",
     "core_topics": json.dumps(["Data Structures", "Python & C", "Applied Mathematics", "Linear Algebra", "Data Analytics"]),
     "career_domains": json.dumps(["Data Engineering", "Machine Learning", "Data Analysis", "AI Solutions", "Business Intelligence"])},
    {"code": "AIML", "name": "AI & Machine Learning", "icon": "🤖", "category": "Machine Intelligence",
     "core_topics": json.dumps(["Algorithms", "Python & C", "Linear Algebra", "Probability & Statistics", "Deep Learning Basics"]),
     "career_domains": json.dumps(["ML Engineering", "AI Research", "Computer Vision", "NLP", "Robotics Systems"])},
    {"code": "ECE", "name": "Electronics & Communication", "icon": "📡", "category": "Circuits & Signals",
     "core_topics": json.dumps(["BEEE", "Applied Physics", "C Programming", "Circuit Analysis", "Semiconductors"]),
     "career_domains": json.dumps(["Embedded Systems", "VLSI Design", "IoT & Hardware", "Signal Processing", "Wireless Communications"])},
    {"code": "IT", "name": "Information Technology", "icon": "🌐", "category": "Computing & Networks",
     "core_topics": json.dumps(["Programming in C", "Data Structures", "Mathematics", "Database Systems", "Networking"]),
     "career_domains": json.dumps(["Information Systems", "Web Services", "DevOps & Cloud", "Database Administration", "Network Engineering"])},
    {"code": "MECH", "name": "Mechanical Engineering", "icon": "⚙️", "category": "Mechanics & Manufacturing",
     "core_topics": json.dumps(["BCME", "Engineering Chemistry", "Physics", "Mathematics", "Engineering Mechanics"]),
     "career_domains": json.dumps(["CAD/CAM & Product Design", "Automotive Systems", "Thermodynamics & HVAC", "Robotics & Automation", "Manufacturing"])},
    {"code": "CIVIL", "name": "Civil Engineering", "icon": "🏗️", "category": "Structures & Infrastructure",
     "core_topics": json.dumps(["BCME", "Engineering Chemistry", "Mathematics", "Surveying", "Building Materials"]),
     "career_domains": json.dumps(["Structural Engineering", "Infrastructure", "Construction Management", "Surveying & GIS", "Environmental Engineering"])},
    {"code": "EEE", "name": "Electrical & Electronics", "icon": "⚡", "category": "Power & Energy Systems",
     "core_topics": json.dumps(["BEEE", "Applied Physics", "Mathematics", "Circuit Theory", "Electrical Machines"]),
     "career_domains": json.dumps(["Power Systems", "Renewable Energy", "Control Systems", "Automation", "Electric Vehicle Systems"])},
    {"code": "CSD", "name": "CS & Design", "icon": "🎨", "category": "Interactive Computing",
     "core_topics": json.dumps(["C Programming", "Data Structures", "Applied Physics", "Mathematics", "UI/UX Fundamentals"]),
     "career_domains": json.dumps(["Frontend Engineering", "Interactive Product Design", "HCI", "Game Development", "Creative Tech"])},
    {"code": "CSBS", "name": "CS & Business Systems", "icon": "💼", "category": "Enterprise Computing",
     "core_topics": json.dumps(["C Programming", "Mathematics", "Data Structures", "English & Business Comm", "Management Basics"]),
     "career_domains": json.dumps(["Enterprise Software", "FinTech", "Technical Consulting", "Product Management", "Business Analytics"])},
]

# ===== SUBJECTS (from InCloudHub medhas-context.js ALL_PROJECT_SUBJECTS) =====
SUBJECTS = [
    {"code": "BS101", "title": "Mathematics", "icon": "📐", "description": "Matrices, Eigenvalues, Differential Equations, Calculus & Vector Spaces."},
    {"code": "BS102", "title": "Applied Physics", "icon": "⚛️", "description": "Wave Optics, Interference, Lasers, Quantum Mechanics & Fiber Optics."},
    {"code": "BS103", "title": "Engineering Chemistry", "icon": "🧪", "description": "Polymers, Water Treatment, Electrochemistry, Corrosion & Modern Materials."},
    {"code": "ES101", "title": "C Programming", "icon": "💻", "description": "Algorithms, Control Structures, Arrays, Pointers, Structs & File I/O."},
    {"code": "ES102", "title": "Data Structures & Algorithms", "icon": "🌳", "description": "Linked Lists, Stacks, Queues, Binary Trees, Graph Traversals & Search Algorithms."},
    {"code": "ES103", "title": "BEEE", "icon": "⚡", "description": "Basic Electrical & Electronics: AC/DC Circuits, Transformers, Diodes & Transistors."},
    {"code": "HS101", "title": "Communicative English", "icon": "📖", "description": "Technical Vocabulary, Professional Grammar, Formal Emails & Report Writing."},
    {"code": "ES104", "title": "BCME", "icon": "🏗️", "description": "Basic Civil & Mechanical: Building Materials, Surveying, Thermodynamics & Engines."},
]

# Standard units for each subject (5 units each)
SUBJECT_UNITS = {
    "BS101": ["Matrices & Linear Algebra", "Differential Equations", "Multivariable Calculus", "Vector Calculus", "Laplace & Fourier Transforms"],
    "BS102": ["Wave Optics & Interference", "Lasers & Fiber Optics", "Quantum Mechanics", "Semiconductor Physics", "Electromagnetic Theory"],
    "BS103": ["Electrochemistry & Corrosion", "Polymers & Composites", "Water Technology", "Fuels & Combustion", "Engineering Materials"],
    "ES101": ["Introduction & Control Flow", "Arrays & Strings", "Functions & Recursion", "Pointers & Memory", "Structures & File Handling"],
    "ES102": ["Arrays & Linked Lists", "Stacks & Queues", "Trees & Binary Search Trees", "Graphs & Traversals", "Sorting & Searching Algorithms"],
    "ES103": ["DC Circuits & Network Theorems", "AC Circuits & Transformers", "Semiconductor Devices", "Digital Electronics Basics", "Electrical Machines Intro"],
    "HS101": ["Vocabulary & Grammar Review", "Reading & Comprehension", "Technical Writing", "Presentation Skills", "Professional Communication"],
    "ES104": ["Building Materials & Construction", "Surveying & Levelling", "Thermodynamics Basics", "IC Engines & Mechanisms", "Engineering Drawing Basics"],
}

# Academic registry: branch -> year -> semester -> subject codes (from medhas-context.js ACADEMIC_REGISTRY)
CURRICULUM_MAP = {
    "CSE":  {1: {1: ["BS101", "BS102", "ES101", "HS101"], 2: ["ES102", "BS103", "ES103", "ES104"]}},
    "IT":   {1: {1: ["BS101", "BS102", "ES101", "HS101"], 2: ["ES102", "BS103", "ES103", "ES104"]}},
    "AIDS": {1: {1: ["BS101", "BS102", "ES101", "HS101"], 2: ["ES102", "BS103", "ES103", "ES104"]}},
    "AIML": {1: {1: ["BS101", "BS102", "ES101", "HS101"], 2: ["ES102", "BS103", "ES103", "ES104"]}},
    "CSD":  {1: {1: ["BS101", "BS102", "ES101", "HS101"], 2: ["ES102", "BS103", "ES103", "ES104"]}},
    "CSBS": {1: {1: ["BS101", "BS102", "ES101", "HS101"], 2: ["ES102", "BS103", "ES103", "ES104"]}},
    "ECE":  {1: {1: ["BS101", "BS102", "ES101", "ES103"], 2: ["ES102", "BS103", "HS101", "ES104"]}},
    "EEE":  {1: {1: ["BS101", "BS102", "ES101", "ES103"], 2: ["ES102", "BS103", "HS101", "ES104"]}},
    "MECH": {1: {1: ["BS101", "BS103", "ES101", "ES104"], 2: ["BS102", "HS101", "ES103", "ES102"]}},
    "CIVIL":{1: {1: ["BS101", "BS103", "ES101", "ES104"], 2: ["BS102", "HS101", "ES103", "ES102"]}},
}

# ===== TIMETABLES (from APY seed_data.py — CSE sections A-D) =====
TIMETABLE_SECTIONS = [
    {"branch": "CSE", "section_label": "A", "effective_from": "2026-07-20", "blocks": [
        {"weekday": 1, "order_index": 1, "subject": "DBMS LAB", "periods": 4},
        {"weekday": 1, "order_index": 2, "subject": "DMGT", "periods": 2},
        {"weekday": 2, "order_index": 1, "subject": "OOPJ", "periods": 2},
        {"weekday": 2, "order_index": 2, "subject": "DLCO", "periods": 2},
        {"weekday": 2, "order_index": 3, "subject": "PP LAB", "periods": 4},
        {"weekday": 3, "order_index": 1, "subject": "UHV-2", "periods": 2},
        {"weekday": 3, "order_index": 2, "subject": "OOPJ", "periods": 2},
        {"weekday": 3, "order_index": 3, "subject": "OOPJ LAB", "periods": 4},
        {"weekday": 4, "order_index": 1, "subject": "DLCO", "periods": 2},
        {"weekday": 4, "order_index": 2, "subject": "DBMS", "periods": 2},
        {"weekday": 4, "order_index": 3, "subject": "UHV-2", "periods": 2},
        {"weekday": 5, "order_index": 1, "subject": "DMGT", "periods": 2},
        {"weekday": 5, "order_index": 2, "subject": "DBMS", "periods": 2},
        {"weekday": 5, "order_index": 3, "subject": "ES", "periods": 2},
    ]},
    {"branch": "CSE", "section_label": "B", "effective_from": "2026-07-20", "blocks": [
        {"weekday": 1, "order_index": 1, "subject": "DMGT", "periods": 2},
        {"weekday": 1, "order_index": 2, "subject": "DBMS", "periods": 2},
        {"weekday": 1, "order_index": 3, "subject": "ES", "periods": 2},
        {"weekday": 2, "order_index": 1, "subject": "UHV-2", "periods": 2},
        {"weekday": 2, "order_index": 2, "subject": "DLCO", "periods": 2},
        {"weekday": 2, "order_index": 3, "subject": "DBMS LAB", "periods": 4},
        {"weekday": 3, "order_index": 1, "subject": "PP LAB", "periods": 4},
        {"weekday": 3, "order_index": 2, "subject": "OOPJ", "periods": 2},
        {"weekday": 4, "order_index": 1, "subject": "OOPJ", "periods": 2},
        {"weekday": 4, "order_index": 2, "subject": "DMGT", "periods": 2},
        {"weekday": 5, "order_index": 1, "subject": "DLCO", "periods": 2},
        {"weekday": 5, "order_index": 2, "subject": "DBMS", "periods": 2},
        {"weekday": 5, "order_index": 3, "subject": "UHV-2", "periods": 2},
        {"weekday": 6, "order_index": 1, "subject": "OOPJ LAB", "periods": 4},
    ]},
]

# ===== PROMPT TEMPLATES (from InCloudHub medhas-prompts.js — key templates) =====
PROMPT_TEMPLATES = [
    # Study & Academics
    {"category": "study", "task_id": "concept", "name": "Understand a Concept", "icon": "📚",
     "description": "Break down an engineering topic with intuitive analogies, mathematical rigor, and step-by-step logic.",
     "personalize_fields": json.dumps([
         {"id": "topic", "label": "Specific Topic", "placeholder": "e.g. Linked Lists, Wave Optics, Norton Theorem"},
         {"id": "difficulty", "label": "What is tripping you up?", "placeholder": "e.g. Memory pointer manipulation"}
     ])},
    {"category": "study", "task_id": "explain", "name": "Explain Difficult Topic", "icon": "📚",
     "description": "Translate dense textbook theory into crisp, intuitive engineering intuition.",
     "personalize_fields": json.dumps([
         {"id": "topic", "label": "Topic or Theorem", "placeholder": "e.g. Carnot Cycle, Eigenvalues"},
         {"id": "textbookSnippet", "label": "Confusing Paragraph", "placeholder": "Paste textbook definition..."}
     ])},
    {"category": "study", "task_id": "summarize", "name": "Summarize Unit Notes", "icon": "📚",
     "description": "Distill comprehensive lecture notes into clean, high-yield cheat sheets.",
     "personalize_fields": json.dumps([
         {"id": "unit", "label": "Unit / Module Name", "placeholder": "e.g. Unit 3: Dynamic Memory Allocation"},
         {"id": "notesContent", "label": "Notes Snippet", "placeholder": "Paste key topics..."}
     ])},
    {"category": "study", "task_id": "exam", "name": "Prepare Exam Questions & Solutions", "icon": "📚",
     "description": "Generate high-probability semester exam questions with stepwise marking rubrics.",
     "personalize_fields": json.dumps([
         {"id": "subject", "label": "Subject", "placeholder": "e.g. Mathematics, C Programming"},
         {"id": "unit", "label": "Unit Focus", "placeholder": "e.g. Unit 1 & 2"}
     ])},
    {"category": "study", "task_id": "studyplan", "name": "Create Agile Study Plan", "icon": "📚",
     "description": "Design a realistic revision roadmap calibrated to your upcoming exam timeline.",
     "personalize_fields": json.dumps([
         {"id": "daysLeft", "label": "Days Remaining", "placeholder": "e.g. 5 days, 2 weeks"},
         {"id": "weakAreas", "label": "Weakest Topics", "placeholder": "e.g. Trees and graphs"}
     ])},
    # Code & Algorithms
    {"category": "code", "task_id": "debug", "name": "Debug Code & Fix Errors", "icon": "💻",
     "description": "Identify logical flaws, segmentation faults, and memory leaks with exact line fixes.",
     "personalize_fields": json.dumps([
         {"id": "userCode", "label": "Source Code", "placeholder": "Paste your code here..."},
         {"id": "errorMsg", "label": "Error Message", "placeholder": "Paste compiler error..."}
     ])},
    {"category": "code", "task_id": "explain_code", "name": "Line-by-Line Code Breakdown", "icon": "💻",
     "description": "Deconstruct complex algorithm implementations with pointer diagrams and state transitions.",
     "personalize_fields": json.dumps([
         {"id": "codeSnippet", "label": "Code to Explain", "placeholder": "Paste code snippet..."},
         {"id": "focusArea", "label": "Focus Area", "placeholder": "e.g. Recursion stack frames"}
     ])},
    {"category": "code", "task_id": "dryrun", "name": "Dry-Run Algorithm Tracing", "icon": "💻",
     "description": "Produce a meticulous variable execution trace table step-by-step for lab exams.",
     "personalize_fields": json.dumps([
         {"id": "algorithm", "label": "Algorithm", "placeholder": "e.g. Binary Search, QuickSort"},
         {"id": "sampleInput", "label": "Sample Input", "placeholder": "e.g. Array: [14, 3, 27, 8, 1]"}
     ])},
    # Research
    {"category": "research", "task_id": "explore", "name": "Explore Emerging Directions", "icon": "🔬",
     "description": "Find non-trivial research questions and modern paradigms in your branch.",
     "personalize_fields": json.dumps([
         {"id": "domain", "label": "Domain / Topic", "placeholder": "e.g. Edge AI, Smart Grids"}
     ])},
    # Writing
    {"category": "write", "task_id": "report", "name": "Engineering Lab Report", "icon": "✍️",
     "description": "Generate formal, academically rigorous project report sections.",
     "personalize_fields": json.dumps([
         {"id": "projectTitle", "label": "Project Title", "placeholder": "e.g. Dijkstra Algorithm for Campus Navigation"}
     ])},
    # Presentations
    {"category": "present", "task_id": "slides", "name": "Create Slide Deck Outline", "icon": "🎤",
     "description": "Structure a high-impact seminar presentation with visual diagram recommendations.",
     "personalize_fields": json.dumps([
         {"id": "topic", "label": "Presentation Topic", "placeholder": "e.g. Quantum Cryptography"}
     ])},
    {"category": "present", "task_id": "viva_prep", "name": "Anticipate Viva Questions", "icon": "🎤",
     "description": "Simulate tough questions from strict external examiners with foolproof responses.",
     "personalize_fields": json.dumps([
         {"id": "labSubject", "label": "Lab Subject", "placeholder": "e.g. C Data Structures Lab"}
     ])},
    # Career - Profile
    {"category": "career_profile", "task_id": "headline", "name": "Create LinkedIn Headline", "icon": "👤",
     "description": "Generate 5 distinct headline formulas reflecting genuine technical focus.",
     "personalize_fields": json.dumps([
         {"id": "careerDirection", "label": "Career Direction", "placeholder": "e.g. Software Systems"},
         {"id": "currentSkills", "label": "Current Skills", "placeholder": "e.g. C Programming, Git"},
     ])},
    {"category": "career_profile", "task_id": "about", "name": "Write About Section", "icon": "👤",
     "description": "Draft 3 narrative variations with zero corporate fluff.",
     "personalize_fields": json.dumps([
         {"id": "whyEngineering", "label": "Why you chose this branch", "placeholder": "e.g. Problem solving"},
         {"id": "tangibleProjects", "label": "A project you built", "placeholder": "e.g. Banking CLI in C"},
     ])},
    {"category": "career_profile", "task_id": "project", "name": "Describe My Project", "icon": "👤",
     "description": "Structure project bullets using Google XYZ formula.",
     "personalize_fields": json.dumps([
         {"id": "projectName", "label": "Project Name", "placeholder": "e.g. Student Record CLI"},
         {"id": "techUsed", "label": "Tech Stack", "placeholder": "e.g. C, File Handling"},
         {"id": "problemSolved", "label": "What it does", "placeholder": "e.g. Automates grade calculations"},
     ])},
    # Career - Content
    {"category": "career_content", "task_id": "first_post", "name": "My First LinkedIn Post", "icon": "🚀",
     "description": "Introduce yourself to the professional engineering community.",
     "personalize_fields": json.dumps([
         {"id": "reasonForPosting", "label": "Why posting", "placeholder": "e.g. Documenting my journey"},
         {"id": "currentFocus", "label": "Current focus", "placeholder": "e.g. Programming fundamentals"},
     ])},
    {"category": "career_content", "task_id": "showcase_project", "name": "Showcase a Project", "icon": "🚀",
     "description": "Announce a newly built project with architecture breakdown.",
     "personalize_fields": json.dumps([
         {"id": "projectTitle", "label": "Project Name", "placeholder": "e.g. Attendance Tracker in C"},
         {"id": "techHighlights", "label": "Technical highlight", "placeholder": "e.g. Modular C architecture"},
     ])},
    # Career - Networking
    {"category": "career_networking", "task_id": "alumnus", "name": "Message an Alumnus", "icon": "🤝",
     "description": "Reach out to college alumni working in your target industry.",
     "personalize_fields": json.dumps([
         {"id": "alumniCompany", "label": "Alumni Company & Role", "placeholder": "e.g. Engineer at Microsoft"},
         {"id": "specificQuestion", "label": "Specific question", "placeholder": "e.g. Skills to master in Year 1"},
     ])},
    {"category": "career_networking", "task_id": "intro", "name": "Professional Introduction", "icon": "🤝",
     "description": "Craft a crisp 2-minute professional introduction for career fairs.",
     "personalize_fields": json.dumps([
         {"id": "primaryInterest", "label": "Primary Interest", "placeholder": "e.g. High-performance algorithms"},
     ])},
]

# ===== DEMO USERS (development only) =====
DEMO_USERS = [
    {"register_number": "25B91A05D8", "pin": "1234", "display_name": "Demo Admin", "branch": "CSE", "section": "A",
     "roles": ["student", "platform_admin", "attendance_admin", "content_editor"]},
    {"register_number": "25B91A0501", "pin": "1234", "display_name": "Demo Student", "branch": "CSE", "section": "A",
     "roles": ["student"]},
    {"register_number": "22B91A0501", "pin": "1234", "display_name": "Demo Student 22", "branch": "CSE", "section": "A",
     "roles": ["student"]},
    {"register_number": "ADMIN01", "pin": "admin123", "display_name": "Platform Administrator", "branch": "CSE", "section": "A",
     "roles": ["student", "platform_admin", "attendance_admin", "content_editor"]},
]

# ===== CAMPUS SERVICES =====
CAMPUS_SERVICES = [
    {"name": "College Website", "description": "Official college website and portal", "category": "link", "icon": "🌐"},
    {"name": "Library", "description": "Digital and physical library resources", "category": "facility", "icon": "📚"},
    {"name": "Examination Cell", "description": "Exam schedules, results, and revaluation", "category": "info", "icon": "📋"},
    {"name": "Training & Placement", "description": "Placement drives, training programs, and career fairs", "category": "info", "icon": "🎯"},
    {"name": "Cafeteria", "description": "Campus cafeteria menu and services", "category": "cafeteria", "icon": "☕"},
]


def seed_database():
    """Seed the database with initial data. Idempotent — skips if data exists."""
    db = SessionLocal()
    try:
        # If departments exist, still ensure demo users exist
        if db.query(Department).count() > 0:
            dept_map = {d.code: d.id for d in db.query(Department).all()}
            section_map = {(s.branch, s.section_label): s.id for s in db.query(Section).all()}
            for u_data in DEMO_USERS:
                existing = db.query(User).filter(User.register_number == u_data["register_number"]).first()
                if not existing:
                    s_id = section_map.get((u_data["branch"], u_data["section"]))
                    d_id = dept_map.get(u_data["branch"])
                    new_u = User(
                        register_number=u_data["register_number"],
                        pin_hash=hash_pin(u_data["pin"]),
                        display_name=u_data["display_name"],
                        department_id=d_id,
                        section_id=s_id,
                    )
                    db.add(new_u)
                    db.flush()
                    for r in u_data["roles"]:
                        db.add(UserRole(user_id=new_u.id, role=r))
            db.commit()
            logger.info("Ensured demo users exist.")
            return

        logger.info("Seeding database...")

        # 1. Departments
        dept_map = {}
        for d in DEPARTMENTS:
            dept = Department(**d)
            db.add(dept)
            db.flush()
            dept_map[d["code"]] = dept.id
        logger.info(f"  Seeded {len(DEPARTMENTS)} departments")

        # 2. Subjects
        subj_map = {}
        for s in SUBJECTS:
            subj = Subject(**s)
            db.add(subj)
            db.flush()
            subj_map[s["code"]] = subj.id
        logger.info(f"  Seeded {len(SUBJECTS)} subjects")

        # 3. Subject Units
        unit_count = 0
        for code, unit_titles in SUBJECT_UNITS.items():
            subject_id = subj_map.get(code)
            if not subject_id:
                continue
            for i, title in enumerate(unit_titles, 1):
                db.add(SubjectUnit(subject_id=subject_id, unit_number=i, title=title))
                unit_count += 1
        logger.info(f"  Seeded {unit_count} subject units")

        # 4. Curriculum mappings
        curr_count = 0
        for branch, years in CURRICULUM_MAP.items():
            dept_id = dept_map.get(branch)
            if not dept_id:
                continue
            for year, semesters in years.items():
                for sem, codes in semesters.items():
                    for code in codes:
                        subj_id = subj_map.get(code)
                        if subj_id:
                            db.add(Curriculum(
                                department_id=dept_id, academic_year=year,
                                semester=sem, subject_id=subj_id,
                            ))
                            curr_count += 1
        logger.info(f"  Seeded {curr_count} curriculum entries")

        # 5. Timetable sections & blocks
        section_map = {}
        for sec_data in TIMETABLE_SECTIONS:
            dept_id = dept_map.get(sec_data["branch"])
            section = Section(
                department_id=dept_id,
                branch=sec_data["branch"],
                section_label=sec_data["section_label"],
                effective_from=sec_data["effective_from"],
            )
            db.add(section)
            db.flush()
            section_map[(sec_data["branch"], sec_data["section_label"])] = section.id

            for block_data in sec_data["blocks"]:
                db.add(TimetableBlock(section_id=section.id, **block_data))
        logger.info(f"  Seeded {len(TIMETABLE_SECTIONS)} sections with timetable blocks")

        # 6. Prompt templates
        for pt in PROMPT_TEMPLATES:
            db.add(PromptTemplate(**pt))
        logger.info(f"  Seeded {len(PROMPT_TEMPLATES)} prompt templates")

        # 7. Career paths (from department career_domains)
        cp_count = 0
        for d in DEPARTMENTS:
            dept_id = dept_map.get(d["code"])
            domains = json.loads(d["career_domains"])
            for i, domain in enumerate(domains):
                db.add(CareerPath(
                    department_id=dept_id, title=domain,
                    description=f"Career path in {domain} for {d['name']} graduates.",
                    display_order=i,
                ))
                cp_count += 1
        logger.info(f"  Seeded {cp_count} career paths")

        # 8. Roadmap items (sample first-year milestones)
        for d_code in ["CSE", "ECE", "MECH"]:
            dept_id = dept_map.get(d_code)
            if not dept_id:
                continue
            milestones = [
                {"type": "academic", "title": "Master Core Fundamentals", "desc": "Build strong foundation in mathematics, physics, and programming.", "order": 1},
                {"type": "skill", "title": "Learn Version Control", "desc": "Set up Git, create GitHub profile, push your first project.", "order": 2},
                {"type": "project", "title": "Build First Mini-Project", "desc": "Create a functional project using C or Python to solve a real problem.", "order": 3},
                {"type": "career", "title": "Create Professional Profile", "desc": "Set up LinkedIn, write an authentic headline and about section.", "order": 4},
            ]
            for m in milestones:
                db.add(RoadmapItem(
                    department_id=dept_id, academic_year=1, semester=1,
                    milestone_type=m["type"], title=m["title"],
                    description=m["desc"], display_order=m["order"],
                ))

        # 9. Campus services
        for cs in CAMPUS_SERVICES:
            db.add(CampusService(**cs))
        logger.info(f"  Seeded {len(CAMPUS_SERVICES)} campus services")

        # 10. Demo users (DEV-ONLY)
        for u_data in DEMO_USERS:
            section_id = section_map.get((u_data["branch"], u_data["section"]))
            dept_id = dept_map.get(u_data["branch"])
            user = User(
                register_number=u_data["register_number"],
                pin_hash=hash_pin(u_data["pin"]),
                display_name=u_data["display_name"],
                department_id=dept_id,
                section_id=section_id,
            )
            db.add(user)
            db.flush()
            for role in u_data["roles"]:
                db.add(UserRole(user_id=user.id, role=role))
        logger.info(f"  Seeded {len(DEMO_USERS)} demo users (DEV-ONLY)")

        db.commit()
        logger.info("Database seeding complete!")

    except Exception as e:
        db.rollback()
        logger.error(f"Seed error: {e}")
        raise
    finally:
        db.close()
