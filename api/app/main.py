"""College Platform Unified — FastAPI Application."""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import create_all_tables
from app.models import *  # noqa: F401, F403 — register all models
from app.routers.auth import router as auth_router
from app.routers.attendance import router as attendance_router
from app.routers.content import router as content_router
from app.routers.prompts import router as prompts_router
from app.routers.campus import router as campus_router
from app.routers.admin import router as admin_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

app = FastAPI(
    title="College Platform Unified API",
    description="Unified student platform combining attendance tracking, learning resources, AI tools, career development, and campus services.",
    version="1.0.0",
)

# CORS Configuration — supports localhost dev + Capacitor mobile
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "capacitor://localhost",
    "ionic://localhost",
    "https://localhost",
    "http://localhost",
]
if settings.allowed_origins:
    for o in settings.allowed_origins.split(","):
        origin = o.strip()
        if origin and origin not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security headers middleware
from fastapi import Request

@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {type(exc).__name__}"},
    )


# Include all routers under both /api prefix and root to support all Vercel routing modes
routers = [auth_router, attendance_router, content_router, prompts_router, campus_router, admin_router]
for r in routers:
    app.include_router(r, prefix="/api")
    app.include_router(r)


@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "app": "College Platform Unified"}


# Startup: create tables and seed data
@app.on_event("startup")
def on_startup():
    logger.info("Creating database tables...")
    create_all_tables()
    logger.info("Running seed data...")
    try:
        from app.seed import seed_database
        seed_database()
    except Exception as e:
        logger.warning(f"Seed notice: {e}")
    logger.info("Application started successfully.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
