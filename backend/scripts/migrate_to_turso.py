"""
Turso Cloud Database Migration & Sync Utility.

This script reads the local SQLite database (app.db or any-db.db)
and uploads the complete schema and all records directly to your Turso database.

Usage:
  python scripts/migrate_to_turso.py --turso-url="libsql://your-db.turso.io" --turso-token="your-auth-token"
  
Or set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in backend/.env and run:
  python scripts/migrate_to_turso.py
"""

import os
import sys
import sqlite3
import argparse
import logging
from typing import List, Dict, Any, Optional

try:
    import httpx
except ImportError:
    httpx = None

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "app.db")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("turso-sync")


def get_turso_pipeline_url(db_url: str) -> str:
    url = db_url.strip().strip("'\"")
    if url.startswith("libsql://"):
        url = "https://" + url[len("libsql://"):]
    elif not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    if not url.endswith("/v2/pipeline"):
        url = url.rstrip("/") + "/v2/pipeline"
    return url


def convert_val_to_turso_arg(val: Any) -> Dict[str, Any]:
    if val is None:
        return {"type": "null"}
    elif isinstance(val, int):
        return {"type": "integer", "value": str(val)}
    elif isinstance(val, float):
        return {"type": "float", "value": val}
    else:
        return {"type": "text", "value": str(val)}


def execute_turso_batch(pipeline_url: str, auth_token: str, statements: List[Dict[str, Any]]) -> bool:
    if not httpx:
        raise RuntimeError("httpx is required. Install via pip install httpx")

    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json",
    }

    # Disable FK checks within this pipeline connection context
    requests = [{
        "type": "execute",
        "stmt": {"sql": "PRAGMA foreign_keys=OFF", "args": []}
    }]
    for stmt in statements:
        sql = stmt["sql"]
        args = [convert_val_to_turso_arg(a) for a in stmt.get("args", [])]
        requests.append({
            "type": "execute",
            "stmt": {
                "sql": sql,
                "args": args
            }
        })
    requests.append({"type": "close"})

    with httpx.Client(timeout=30.0) as client:
        response = client.post(pipeline_url, json={"requests": requests}, headers=headers)
        if response.status_code != 200:
            logger.error(f"Turso API error ({response.status_code}): {response.text}")
            return False

        data = response.json()
        results = data.get("results", [])
        for res in results:
            if res.get("type") == "error":
                logger.error(f"Turso SQL execution error: {res.get('error', {}).get('message')}")
                return False
    return True


def sync_sqlite_to_turso(
    sqlite_path: str,
    turso_url: str,
    turso_token: str
) -> bool:
    if not os.path.exists(sqlite_path):
        logger.error(f"SQLite file not found: {sqlite_path}")
        return False

    pipeline_url = get_turso_pipeline_url(turso_url)
    logger.info(f"Target Turso Pipeline: {pipeline_url}")

    conn = sqlite3.connect(sqlite_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all tables
    cursor.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = cursor.fetchall()

    logger.info(f"Discovered {len(tables)} tables to migrate to Turso.")

    # Step 1: Create Schema
    logger.info("Step 1: Creating database schema on Turso...")
    schema_stmts = []
    for t in tables:
        t_name = t["name"]
        create_sql = t["sql"]
        if create_sql:
            # Clean up CREATE statement to IF NOT EXISTS
            if "CREATE TABLE IF NOT EXISTS" not in create_sql:
                create_sql = create_sql.replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS", 1)
            schema_stmts.append({"sql": create_sql, "args": []})

    if schema_stmts:
        ok = execute_turso_batch(pipeline_url, turso_token, schema_stmts)
        if not ok:
            logger.error("Failed to apply table schema on Turso.")
            return False
        logger.info("Turso schema initialized successfully!")

    # Step 2: Upload Data table by table in batches of 40 rows
    logger.info("Step 2: Transferring table rows to Turso...")

    # Disable foreign key checks during bulk import
    execute_turso_batch(pipeline_url, turso_token, [{"sql": "PRAGMA foreign_keys=OFF", "args": []}])

    total_records = 0

    # Desired order for foreign keys
    order_preference = [
        "departments", "sections", "users", "user_roles",
        "timetable_blocks", "daily_logs", "curricula", "subjects",
        "subject_units", "learning_resources", "campus_services",
        "career_paths", "roadmap_items", "prompt_templates"
    ]
    table_names = [t["name"] for t in tables]
    sorted_tables = [t for t in order_preference if t in table_names] + [t for t in table_names if t not in order_preference]

    for t_name in sorted_tables:
        cursor.execute(f"PRAGMA table_info({t_name})")
        cols = [c[1] for c in cursor.fetchall()]
        if not cols:
            continue

        cursor.execute(f"SELECT * FROM {t_name}")
        rows = cursor.fetchall()
        if not rows:
            logger.info(f"  - Table {t_name}: 0 rows (skipped)")
            continue

        logger.info(f"  - Table {t_name}: uploading {len(rows)} rows...")
        cols_str = ", ".join([f'"{c}"' for c in cols])
        placeholders = ", ".join(["?" for _ in cols])
        insert_sql = f'INSERT OR REPLACE INTO "{t_name}" ({cols_str}) VALUES ({placeholders})'

        batch = []
        for r in rows:
            args = [r[c] for c in cols]
            batch.append({"sql": insert_sql, "args": args})

            if len(batch) >= 40:
                if not execute_turso_batch(pipeline_url, turso_token, batch):
                    logger.error(f"Failed uploading batch for table {t_name}")
                    return False
                batch = []

        if batch:
            if not execute_turso_batch(pipeline_url, turso_token, batch):
                logger.error(f"Failed uploading final batch for table {t_name}")
                return False

        total_records += len(rows)
        logger.info(f"    ✓ {t_name} synchronized ({len(rows)} rows)")

    # Re-enable foreign key checks
    execute_turso_batch(pipeline_url, turso_token, [{"sql": "PRAGMA foreign_keys=ON", "args": []}])

    conn.close()
    logger.info("=" * 60)
    logger.info(f"TURSO DATABASE MIGRATION COMPLETE! Total rows transferred: {total_records}")
    logger.info("=" * 60)
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Upload SQLite database to Turso Cloud")
    parser.add_argument("--sqlite-path", default=DEFAULT_DB_PATH, help="Path to local SQLite file (default: backend/app.db)")
    parser.add_argument("--turso-url", default=os.environ.get("TURSO_DATABASE_URL", ""), help="Turso database URL")
    parser.add_argument("--turso-token", default=os.environ.get("TURSO_AUTH_TOKEN", ""), help="Turso auth token")
    args = parser.parse_args()

    t_url = args.turso_url.strip()
    t_token = args.turso_token.strip()

    if not t_url or not t_token:
        # Check backend/.env
        env_path = os.path.join(BACKEND_DIR, ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("TURSO_DATABASE_URL="):
                        t_url = line.split("=", 1)[1].strip().strip("'\"")
                    elif line.startswith("TURSO_AUTH_TOKEN="):
                        t_token = line.split("=", 1)[1].strip().strip("'\"")

    if not t_url or not t_token:
        print("\n[Notice] Please supply Turso credentials:")
        print("  python scripts/migrate_to_turso.py --turso-url=\"libsql://your-db.turso.io\" --turso-token=\"your-token\"\n")
        print("Or set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in backend/.env\n")
        sys.exit(1)

    sync_sqlite_to_turso(args.sqlite_path, t_url, t_token)
