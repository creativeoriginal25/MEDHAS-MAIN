# MEDHAS: Turso Cloud Database & Vercel Deployment Guide

This document explains how your existing database (`any-db.db`) is structured, how it is synced into **MEDHAS**, how to connect **Turso Cloud SQLite**, and how to deploy the platform to **Vercel**.

---

## 1. Analysis of `any-db.db`

The provided `/Users/charan/SRKR-WEB-APP/any-db.db` database was analyzed and verified:
- **Total Users**: 92 registered students with active bcrypt PIN hashes (`$2b$12$...`) and baseline attendance figures.
- **Sections**: 9 academic sections across CSE (A, B, C, D, E), AIDS (B, D), AIML (A, B).
- **Timetable Blocks**: 120 period blocks covering Monday to Saturday with official SRKR semester subjects (`DBMS`, `DMGT`, `OOPJ`, `DLCO`, `DBMS LAB`, `OOPJ LAB`, `PP LAB`, `ES`, `UHV-2`).
- **Daily Attendance Logs**: 935 real student attendance logs (Present, Absent, Holiday) spanning August to October 2026.
- **Audit & Token Tables**: Pin reset logs, session tracking, DPDP consent tracking.

### Data Migration Status
All 92 users, 9 sections (expanded to 22 sections for Year 1–4 coverage), 120 timetable blocks, and all 935 daily attendance logs have been migrated into `college-platform-unified/backend/app.db`.

To re-run or sync at any time:
```bash
cd college-platform-unified/backend
source .venv/bin/activate
python scripts/migrate_from_anydb.py
```

---

## 2. Connecting Turso Cloud SQLite (`libsql`)

[Turso](https://turso.tech) is an edge-replicated, SQLite-compatible cloud database powered by libSQL.

### Step 2.1: Create your Turso Database
1. Go to [https://turso.tech](https://turso.tech) and log in (or install the Turso CLI: `brew install tursodatabase/tap/turso`).
2. Create a database:
   ```bash
   turso db create medhas-db
   ```
   *(Or click "Create Database" in the Turso web dashboard).*
3. Obtain your database URL:
   ```bash
   turso db show medhas-db --url
   # Example: libsql://medhas-db-yourorg.turso.io
   ```
4. Create an authentication token:
   ```bash
   turso db tokens create medhas-db
   # Example: eyJhbGciOiJFZERTQ...
   ```

### Step 2.2: Upload all existing data into Turso
Run the automated migration tool with your Turso credentials:
```bash
cd college-platform-unified/backend
source .venv/bin/activate

python scripts/migrate_to_turso.py \
  --turso-url="libsql://medhas-db-yourorg.turso.io" \
  --turso-token="your-turso-token"
```

The script will:
1. Create all 15 tables and indexes on Turso.
2. Push all departments, sections, 104 users, timetable blocks, and 937 attendance records in keep-alive HTTP pipeline batches.
3. Validate row counts and confirm database readiness.

### Step 2.3: Configure the Backend for Turso
Add these two variables to `college-platform-unified/backend/.env`:
```ini
TURSO_DATABASE_URL="libsql://medhas-db-yourorg.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
```

The backend automatically detects these variables and routes all queries through Turso Cloud using `sqlalchemy-libsql` and Turso's `/v2/pipeline` protocol. If these variables are omitted, it runs locally on SQLite (`app.db`).

---

## 3. Vercel Deployment

The project is configured for seamless deployment to Vercel in two modes:

### Mode A: Monorepo Deployment (Recommended)
Deploy both the React frontend and FastAPI backend in a single Vercel project:

1. Import the repository in [Vercel](https://vercel.com).
2. Set the **Root Directory** to `college-platform-unified/`.
3. In **Environment Variables**, add:
   - `TURSO_DATABASE_URL`: `libsql://medhas-db-yourorg.turso.io`
   - `TURSO_AUTH_TOKEN`: `your-turso-token`
   - `JWT_SECRET_KEY`: `your-production-jwt-secret-string`
4. Deploy! Vercel will:
   - Build the frontend static assets (`apps/web` -> `dist/`)
   - Package `api/index.py` using `@vercel/python` and Mangum ASGI adapter
   - Route `/api/*` to the serverless backend and `/*` to the React single page app.

### Mode B: Standalone Frontend Deployment
If hosting the backend on Render, Railway, or Fly.io:
1. Set the Vercel **Root Directory** to `college-platform-unified/apps/web`.
2. Add environment variable:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com`
3. Vercel deploys using `apps/web/vercel.json` with SPA routing and asset caching.

---

## 4. Mobile Layout & Year Mapping Verification

- **1:1 Mobile Layout from APY**:
  - Automatically activates on mobile viewports (`< 768px`) with no border gutters.
  - Floating, blurred bottom navigation bar (`--surface` at 95% opacity with safe-area insets).
  - Tap targets with minimum 42px touch height and `touch-action: manipulation`.
  - Input font-size set to 16px to prevent iOS Safari auto-zoom.
- **PIN Authentication & Password Visibility**:
  - Numeric keypad triggering (`inputMode="numeric"`, `pattern="[0-9]*"`).
  - Interactive "Show PIN / Hide PIN" toggle with eye icons for clarity.
  - Strict bcrypt hashing and DPDP Act 2023 compliance.
- **Academic Year Mappings**:
  - Year 1 (Freshman) -> Semesters 1 & 2
  - Year 2 (Sophomore) -> Semesters 3 & 4
  - Year 3 (Pre-Final) -> Semesters 5 & 6
  - Year 4 (Final Year) -> Semesters 7 & 8
  - Auto-detection from register numbers (e.g. `25B91A...` -> Year 1, `24B91A...` -> Year 2, `23B91A...` -> Year 3, `22B91A...` -> Year 4).
  - Auto-detection of branch codes (`05` -> CSE, `44` -> AIDS, `42` -> AIML, `04` -> ECE, `12` -> IT, `03` -> MECH, `01` -> CIVIL, `02` -> EEE).
  - All sections A, B, C, D, and E available.
