"""Rate limiting — adapted from APY auth.py."""

import time
from typing import Dict, Optional
from fastapi import HTTPException, status


# Failed PIN attempts by register_number
LOGIN_FAILURES: Dict[str, dict] = {}
MAX_FAILED_LOGIN_ATTEMPTS = 5
FAILED_WINDOW_SECONDS = 900  # 15 minutes
ACCOUNT_LOCKOUT_SECONDS = 600  # 10 minutes

# IP-based rate limiting on login
IP_LOGIN_REQUESTS: Dict[str, list] = {}
MAX_IP_LOGIN_PER_MINUTE = 20
IP_LOGIN_WINDOW_SECONDS = 60

# Admin PIN reset rate limiting
ADMIN_RESET_REQUESTS: Dict[str, list] = {}
MAX_ADMIN_RESET_PER_WINDOW = 10
ADMIN_RESET_WINDOW_SECONDS = 300  # 5 minutes


def check_login_rate_limit(register_number: str, client_ip: Optional[str] = None):
    """Check both IP-level and account-level rate limits before login attempt."""
    now = time.time()
    reg = register_number.strip().upper()

    # IP-level rate limiting
    if client_ip:
        ip_attempts = IP_LOGIN_REQUESTS.get(client_ip, [])
        recent = [t for t in ip_attempts if now - t < IP_LOGIN_WINDOW_SECONDS]
        IP_LOGIN_REQUESTS[client_ip] = recent
        if len(recent) >= MAX_IP_LOGIN_PER_MINUTE:
            wait = int(IP_LOGIN_WINDOW_SECONDS - (now - recent[0]))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts from your IP. Please wait {max(1, wait)} seconds.",
            )

    # Account lockout on 5 failed attempts
    record = LOGIN_FAILURES.get(reg, {"attempts": [], "locked_until": None})
    locked_until = record.get("locked_until")
    if locked_until and now < locked_until:
        cooldown = int(locked_until - now)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account {reg} is temporarily locked. Please wait {max(1, cooldown)} seconds.",
        )


def record_failed_attempt(register_number: str, client_ip: Optional[str] = None):
    """Record a failed login attempt for rate limiting."""
    now = time.time()
    reg = register_number.strip().upper()

    if client_ip:
        ip_attempts = IP_LOGIN_REQUESTS.get(client_ip, [])
        ip_attempts.append(now)
        IP_LOGIN_REQUESTS[client_ip] = ip_attempts

    record = LOGIN_FAILURES.get(reg, {"attempts": [], "locked_until": None})
    recent = [t for t in record["attempts"] if now - t < FAILED_WINDOW_SECONDS]
    recent.append(now)
    record["attempts"] = recent

    if len(recent) >= MAX_FAILED_LOGIN_ATTEMPTS:
        record["locked_until"] = now + ACCOUNT_LOCKOUT_SECONDS
        record["attempts"] = []

    LOGIN_FAILURES[reg] = record


def clear_rate_limit(register_number: str):
    """Clear rate limit on successful login."""
    reg = register_number.strip().upper()
    LOGIN_FAILURES.pop(reg, None)


def check_admin_reset_rate_limit(admin_reg: str, client_ip: Optional[str] = None):
    """Rate limit admin PIN reset operations."""
    now = time.time()
    adm = admin_reg.strip().upper()

    attempts = ADMIN_RESET_REQUESTS.get(adm, [])
    recent = [t for t in attempts if now - t < ADMIN_RESET_WINDOW_SECONDS]
    if len(recent) >= MAX_ADMIN_RESET_PER_WINDOW:
        wait = int(ADMIN_RESET_WINDOW_SECONDS - (now - recent[0]))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded for admin resets. Wait {max(1, wait)} seconds.",
        )
    recent.append(now)
    ADMIN_RESET_REQUESTS[adm] = recent
