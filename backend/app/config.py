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
    turso_database_url: Optional[str] = None
    turso_auth_token: Optional[str] = None

    # CORS
    allowed_origins: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
