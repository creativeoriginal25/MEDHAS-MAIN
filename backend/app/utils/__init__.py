"""IST timezone utility — from APY."""
from datetime import date, datetime

try:
    from zoneinfo import ZoneInfo
    IST = ZoneInfo("Asia/Kolkata")
except Exception:
    IST = None


def get_today_ist() -> date:
    """Get today's date in IST timezone."""
    if IST:
        return datetime.now(IST).date()
    return date.today()
