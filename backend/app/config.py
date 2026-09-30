"""Application configuration loaded from environment variables."""

import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./app.db"

    # JWT
    jwt_secret_key: str = "dev-only-change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_seconds: int = 60 * 60 * 24 * 180  # 180 days (semester)

    # Admin bootstrap
    initial_admin_register: str = "25B91A05D8"

    # Optional Turso
    turso_database_url: Optional[str] = os.environ.get("TURSO_DATABASE_URL", "libsql://medhas-nextgen-labs.aws-ap-south-1.turso.io")
    turso_auth_token: Optional[str] = os.environ.get("TURSO_AUTH_TOKEN", "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTA3ODU5MDcsImlkIjoiMDFhMGYyZDgtZmYwMS03NjM1LTkyZDItZjVlY2JkZDRkMDE2Iiwia2lkIjoiSzBzc1VnOXhvRVJHZXZCSUhVZ3VxMGNuMzAwUXJoTnFHSDlPVnlzMUhJYyIsInJpZCI6IjMwMGU5ZDg1LTBlOGEtNGM1NS05M2U0LWE2MDJlZmYwNTFiYiJ9.tLzpk2nZ-17vCVGCsSWSAnAQNixKDct1Km3-V9qr5bxCdhsI1mAa5AVwsJTG-9nJbbzHaL6Hni2BgaLc3GlrCg")

    # CORS
    allowed_origins: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
