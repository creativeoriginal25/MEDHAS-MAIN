# SRKR Unified College Student Platform

A modern, fast, secure, mobile-friendly college student portal combining the best of **APY** (Attendance Per Year) and **InCloudHub / MEDHAS** (Academic Registry, Learning Hub, AI Study Tools, Career Development & Campus Services).

Built as a single unified system in `/Users/charan/SRKR-WEB-APP/college-platform-unified/` without modifying the original source folders.

---

## 🚀 Key Highlights & Architecture

### 1. Technology Stack
- **Backend**: Python 3.11+ with **FastAPI**, **SQLAlchemy 2.0**, and **Pydantic v2**.
- **Database**: SQLite (WAL mode) and **Turso Cloud SQLite (`libsql`)** support via `sqlalchemy-libsql` and HTTP pipeline.
- **Frontend**: **React 18** with **Vite**, **TypeScript**, **Lucide Icons**, and authentic **APY Parchment Ledger Design Tokens**.
- **Mobile-Native UX**: 1:1 mobile layout matching APY on Android, safe-area insets, floating bottom tab bar, and zero touch delay.
- **Deployment**: 100% **Vercel deployment ready** (Monorepo `@vercel/python` serverless + `@vercel/static-build` or standalone Vite SPA).

---

## 🛡️ Security & Architecture Upgrades

| Source Insecurity / Limitation | Replaced In Unified Platform |
| :--- | :--- |
| InCloudHub `sessionStorage` client-side 30-min timeout | **HMAC-SHA256 JWT** sessions with server-side revocation |
| InCloudHub admin password in HTML source (`admin.html`) | **Database-driven Role-Based Access Control** (`user_roles` table) |
| InCloudHub Google Sheets / Apps Script backend | **FastAPI endpoints** backed by indexed SQL database |
| InCloudHub flat `notes.json` with open delete endpoints | **Authenticated & authorized** content management APIs |
| APY hardcoded client admin list in `api.js` | **Server-side role verification** (`require_role()` dependency) |
| APY environment variable admin whitelist | **Relational roles** with security audit trail (`audit_logs`) |

---

## 📦 Features Unified

### 1. Student Identity & Authentication
- Register number + PIN login (`22B91A0501` + `1234`).
- Student registration with Department & Section assignment.
- PBKDF2/bcrypt secure PIN hashing.
- IP + Account level brute-force rate limiting.
- Student profile with baseline attendance carry-over.

### 2. Attendance Suite (From APY)
- **Mark Today**: Fast, optimistic single-click attendance toggling (`present`, `absent`, `holiday`).
- **Edit Window Enforcement**: Server-side validation enforcing marking within `today ± 7 days`.
- **Period Weighting**: Strict weighting (e.g. 4 periods for Labs, 2 periods for Lectures).
- **75% Calculator**: Live calculation of overall attendance percentage, safe-to-bunk periods, or consecutive periods required to hit 75%.
- **Weekly Timetable**: Day-by-day class schedule with period counts.
- **Multi-day Bunk Simulator**: What-if interactive forecast projecting attendance impact over 7, 14, or 21 days.

### 3. Academic Registry & Notes Hub (From InCloudHub)
- **10 Engineering Departments**: CSE, AIDS, AIML, ECE, IT, MECH, CIVIL, EEE, CSD, CSBS with metadata.
- **First-Year Core Subjects**: BS101 (Maths), BS102 (Applied Physics), BS103 (Engg Chemistry), ES101 (C Prog), ES102 (Data Structures), ES103 (BEEE), HS101 (Communicative English), ES104 (BCME).
- **Unit 1–5 Tabs**: Unit-level syllabus and notes breakdown.
- **Debounced Search**: Live search across subjects, notes, and topics.
- **Bookmarks**: Save notes to a personal bookmarks drawer.

### 4. Growth Hub — AI Study Engine & Career (From MEDHAS)
- **AI Prompt Engine**: 19+ curated prompt templates across 8 categories (Study & Academics, Code Debugging, Engineering Research, Presentations, LinkedIn Profile, Networking, etc.).
- **Interactive Prompt Customizer**: Fill in parameters (e.g., topic, difficulty, code snippet) to dynamically generate tailor-made prompts with 1-click clipboard copy.
- **Career Pathways**: 50 department-specific career tracks with required industry skills.
- **4-Year Roadmap**: Semester 1 to Semester 8 milestones covering academics, Git, hackathons, internships, and capstone placements.

### 5. Campus Services & NutriDelight Cafeteria
- **NutriDelight Cafeteria Catalog**: Menu browsing with vegetarian/non-vegetarian tags, categories (Breakfast, Snacks, Lunch, Beverages), and live pricing (display only, no payment mock).
- **College Services**: Directory and contact helplines for Examination Cell, Library, Health Clinic, Transport, and Training & Placement.

### 6. Administrative Suite
- **Role-Based Controls**: Supports `student`, `attendance_admin`, `content_editor`, `campus_operator`, and `platform_admin`.
- **Emergency PIN Reset**: Authorized administrators can reset forgotten student PINs.
- **Role Assignment**: Platform Admins can assign or revoke administrative privileges.
- **Audit Logs**: Full audit trail recording timestamps, actions, actors, and targets.

---

## 🏃 Local Setup & Running Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm 9+

### 1. Backend Setup & Run

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run migrations & launch server (runs at http://127.0.0.1:8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The database (`app.db`) will automatically initialize and seed on first launch!

### 2. Frontend Setup & Run

```bash
cd apps/web

# Install dependencies
npm install

# Start Vite dev server (runs at http://127.0.0.1:5173)
npm run dev -- --host 127.0.0.1 --port 5173
```

Now open **http://127.0.0.1:5173** in your browser!

### 3. Run Automated Tests

```bash
cd backend
source .venv/bin/activate
PYTHONPATH=. pytest -v
```

All 10 integration tests will execute and pass!

---

## 🔑 Demo Test Accounts

The platform comes pre-seeded with ready-to-test accounts (also available via 1-click "Quick Demo Fill" buttons on the Login page):

| Role | Register Number | PIN | Capabilities |
| :--- | :--- | :--- | :--- |
| **Demo Student** | `22B91A0501` | `1234` | Mark attendance, view 75% calculator, browse notes, use AI prompts, simulate bunks |
| **Demo Student 2** | `25B91A0501` | `1234` | Regular student profile in CSE Section A |
| **Platform Admin** | `ADMIN01` | `admin123` | Full access: PIN reset, role assignment, audit logs, content management |
| **Admin Student** | `25B91A05D8` | `1234` | Combined student & administrator account |

---

## 📁 Project Structure

```
college-platform-unified/
├── README.md                          # Project documentation
├── .env.example                       # Environment template
├── .gitignore                         # Git ignore rules
│
├── backend/                           # FastAPI Python backend
│   ├── app/
│   │   ├── main.py                    # App factory, CORS, router mounting
│   │   ├── config.py                  # Pydantic settings
│   │   ├── database.py                # SQLAlchemy engine & session factory
│   │   ├── auth/                      # JWT, PBKDF2/bcrypt, rate limits
│   │   ├── models/                    # SQLAlchemy models (User, Attendance, Content, etc.)
│   │   ├── schemas/                   # Pydantic schemas
│   │   ├── routers/                   # API routers (auth, attendance, content, grow, campus, admin)
│   │   ├── services/                  # Business logic (bunk calculator, forecast engine)
│   │   ├── seed/                      # Database seed scripts
│   │   └── utils/                     # Timezone utilities (IST)
│   ├── tests/
│   │   └── test_platform.py           # Integration test suite (10/10 passing)
│   └── requirements.txt
│
└── apps/
    └── web/                           # Vite + React 18 + TypeScript frontend
        ├── index.html                 # HTML shell with Google Fonts
        ├── vite.config.ts             # Vite proxy configuration
        ├── package.json
        └── src/
            ├── api/                   # Typed API client
            ├── contexts/              # AuthContext & role hooks
            ├── components/
            │   ├── layout/            # HeaderNav (Desktop) & BottomNav (Mobile)
            │   └── attendance/        # TodayTab, DashboardTab, TimetableTab, ForecastTab
            ├── pages/                 # Login, Home, Attendance, Learn, Grow, Campus, Profile, Admin
            ├── styles/                # Glassmorphic design tokens & responsive CSS
            └── types/                 # TypeScript interfaces
```
