"""
Utility to sync / pull data from Turso Cloud Database into local SQLite (app.db).
"""

import os
import sys
import json
import socket
import ssl
import sqlite3
import logging
from typing import List, Dict, Any, Optional

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(SCRIPT_DIR)
LOCAL_DB_PATH = os.path.join(BACKEND_DIR, "app.db")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("turso-pull")


def get_turso_creds():
    # Load from .env if present
    env_path = os.path.join(BACKEND_DIR, ".env")
    turso_url = os.environ.get("TURSO_DATABASE_URL")
    turso_token = os.environ.get("TURSO_AUTH_TOKEN")

    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("\"'")
                if k == "TURSO_DATABASE_URL" and not turso_url:
                    turso_url = v
                elif k == "TURSO_AUTH_TOKEN" and not turso_token:
                    turso_token = v

    return turso_url, turso_token


def execute_turso_query(host: str, token: str, statements: List[str]) -> List[Dict[str, Any]]:
    payload = {
        "requests": [{"type": "execute", "stmt": {"sql": s}} for s in statements] + [{"type": "close"}]
    }
    body = json.dumps(payload).encode("utf-8")

    s = socket.create_connection((host, 443), timeout=15)
    ctx = ssl.create_default_context()
    ss = ctx.wrap_socket(s, server_hostname=host)
    ss.settimeout(15.0)

    req_headers = (
        f"POST /v2/pipeline HTTP/1.1\r\n"
        f"Host: {host}\r\n"
        f"Authorization: Bearer {token}\r\n"
        f"Content-Type: application/json\r\n"
        f"Content-Length: {len(body)}\r\n"
        f"Connection: close\r\n\r\n"
    ).encode("utf-8")

    ss.sendall(req_headers + body)

    data = b""
    while True:
        try:
            chunk = ss.recv(16384)
            if not chunk:
                break
            data += chunk
        except Exception:
            break
    ss.close()

    parts = data.split(b"\r\n\r\n", 1)
    if len(parts) < 2:
        raise RuntimeError(f"Unexpected response from Turso: {data[:200]}")

    body_data = json.loads(parts[1].decode("utf-8"))
    return body_data.get("results", [])


def parse_turso_cell(cell: Dict[str, Any]) -> Any:
    ctype = cell.get("type")
    val = cell.get("value")
    if ctype == "null":
        return None
    elif ctype == "integer":
        return int(val)
    elif ctype == "float":
        return float(val)
    elif ctype == "text":
        return str(val)
    elif ctype == "blob":
        return val
    return val


def sync_turso_to_local():
    turso_url, turso_token = get_turso_creds()
    if not turso_url or not turso_token:
        logger.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in environment or .env")
        sys.exit(1)

    host = turso_url.strip()
    if host.startswith("libsql://"):
        host = host[len("libsql://"):]
    elif host.startswith("https://"):
        host = host[len("https://"):]
    host = host.split("/")[0]

    logger.info(f"Connecting to Turso Cloud: {host}")

    # 1. Fetch all tables from Turso
    res = execute_turso_query(host, turso_token, ["SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"])
    if not res or res[0].get("type") != "ok":
        logger.error(f"Failed to query tables from Turso: {res}")
        sys.exit(1)

    tables = [row[0]["value"] for row in res[0]["response"]["result"]["rows"]]
    logger.info(f"Found {len(tables)} tables in Turso: {tables}")

    # 2. Connect to local SQLite
    logger.info(f"Connecting to local SQLite database: {LOCAL_DB_PATH}")
    local_conn = sqlite3.connect(LOCAL_DB_PATH)
    local_cur = local_conn.cursor()

    local_cur.execute("PRAGMA foreign_keys=OFF;")

    # 3. Pull data for each table
    total_rows = 0
    # Tables order to respect foreign key hierarchies if desired
    table_order = [
        "departments",
        "sections",
        "subjects",
        "curricula",
        "subject_units",
        "users",
        "user_roles",
        "timetable_blocks",
        "daily_logs",
        "prompt_templates",
        "career_paths",
        "roadmap_items",
        "campus_services",
        "service_catalog_items",
        "learning_resources",
        "login_sessions",
        "saved_resources",
        "notification_preferences",
        "revoked_tokens",
        "pin_reset_logs",
        "audit_logs",
    ]
    all_tables = [t for t in table_order if t in tables] + [t for t in tables if t not in table_order]

    for tbl in all_tables:
        table_res = execute_turso_query(host, turso_token, [f"SELECT * FROM {tbl};"])
        if not table_res or table_res[0].get("type") != "ok":
            logger.warning(f"Could not read table {tbl} from Turso, skipping.")
            continue

        exec_res = table_res[0]["response"]["result"]
        cols = [c["name"] for c in exec_res["cols"]]
        rows = exec_res["rows"]

        # Clear existing rows in local table
        local_cur.execute(f"DELETE FROM {tbl};")

        if rows:
            placeholders = ", ".join(["?"] * len(cols))
            col_names = ", ".join([f'"{c}"' for c in cols])
            sql_insert = f"INSERT INTO {tbl} ({col_names}) VALUES ({placeholders});"

            batch_data = []
            for r in rows:
                batch_data.append([parse_turso_cell(cell) for cell in r])

            local_cur.executemany(sql_insert, batch_data)
            logger.info(f"  ✓ {tbl}: synced {len(rows)} rows")
            total_rows += len(rows)
        else:
            logger.info(f"  - {tbl}: 0 rows")

    local_conn.commit()
    local_cur.execute("PRAGMA foreign_keys=ON;")
    local_conn.close()

    logger.info(f"Successfully synced {total_rows} total rows from Turso Cloud to local SQLite ({LOCAL_DB_PATH})!")


if __name__ == "__main__":
    sync_turso_to_local()
