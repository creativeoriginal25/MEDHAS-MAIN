"""
Vercel Python Serverless Runtime Entrypoint for MEDHAS Unified Platform.
Exports ASGI `app` and Mangum `handler`.
"""

import os
import sys
import traceback

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

# Ensure all possible module locations are in sys.path
for p in [CURRENT_DIR, BACKEND_DIR, ROOT_DIR, "/var/task", "/var/task/api", "/var/task/backend"]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

os.environ.setdefault("VERCEL", "1")

app = None
handler = None

try:
    from app.main import app
    from app.database import ensure_database_ready

    try:
        ensure_database_ready()
    except Exception as db_err:
        import logging
        logging.getLogger("api").warning(f"Database readiness warning: {db_err}")

    try:
        from mangum import Mangum
        handler = Mangum(app, lifespan="off")
    except Exception:
        handler = app

except Exception as init_err:
    err_trace = traceback.format_exc()
    import logging
    logging.getLogger("api").error(f"FATAL Lambda Initialization Error:\n{err_trace}")

    from fastapi import FastAPI
    from fastapi.responses import JSONResponse

    app = FastAPI()

    @app.api_route("/{path_name:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"])
    async def fallback_handler(path_name: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "MEDHAS Backend Startup Error",
                "detail": str(init_err),
                "traceback": err_trace.split("\n"),
            }
        )

    try:
        from mangum import Mangum
        handler = Mangum(app, lifespan="off")
    except Exception:
        handler = app
