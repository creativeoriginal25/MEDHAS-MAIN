"""Attendance business logic — bunk calculator, forecast engine from APY."""

import math
from datetime import timedelta
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.attendance import DailyLog, TimetableBlock
from app.models.user import User
from app.utils import get_today_ist


def calculate_bunk_stats(attended: int, total: int) -> dict:
    """Calculate 75% threshold stats — adapted from APY attendance_routes.py."""
    if total == 0:
        return {
            "percentage": 0.0,
            "is_below_threshold": False,
            "safe_to_miss": 0,
            "must_attend_next": 0,
        }

    pct = round((attended / total) * 100, 2)
    is_below = pct < 75.0

    if pct >= 75.0:
        safe = math.floor((attended / 0.75) - total)
        return {
            "percentage": pct,
            "is_below_threshold": False,
            "safe_to_miss": max(0, safe),
            "must_attend_next": 0,
        }
    else:
        must = math.ceil((0.75 * total - attended) / 0.25)
        return {
            "percentage": pct,
            "is_below_threshold": True,
            "safe_to_miss": 0,
            "must_attend_next": max(0, must),
        }


def get_user_dashboard(user: User, db: Session) -> dict:
    """Calculate overall and subject-wise attendance dashboard."""
    section_id = user.section_id
    if not section_id:
        stats = calculate_bunk_stats(0, 0)
        return {
            "overall": stats,
            "overall_percentage": 0.0,
            "bunkable_periods": 0,
            "needed_for_75": 0,
            "status": "safe",
            "subjects": [],
            "total_attended": 0,
            "total_periods": 0,
        }

    # Get all blocks for user's section
    blocks = db.query(TimetableBlock).filter(TimetableBlock.section_id == section_id).all()
    block_map = {b.id: b for b in blocks}

    # Get all logs for user
    logs = db.query(DailyLog).filter(DailyLog.user_id == user.id).all()

    # Calculate per-subject stats with period weighting
    subject_data = {}
    for log in logs:
        block = block_map.get(log.block_id)
        if not block:
            continue
        subj = block.subject
        if subj not in subject_data:
            subject_data[subj] = {"attended": 0, "total": 0}

        periods = block.periods
        subject_data[subj]["total"] += periods
        if log.status == "present":
            subject_data[subj]["attended"] += periods

    # Add baseline
    total_attended = user.baseline_attended or 0
    total_periods = user.baseline_total or 0

    subjects = []
    for subj, data in sorted(subject_data.items()):
        total_attended += data["attended"]
        total_periods += data["total"]
        sub_stats = calculate_bunk_stats(data["attended"], data["total"])
        subjects.append({
            "subject": subj,
            "attended": data["attended"],
            "total": data["total"],
            "percentage": sub_stats["percentage"],
            "status": "critical" if sub_stats["is_below_threshold"] else "safe",
            "stats": sub_stats,
        })

    overall_stats = calculate_bunk_stats(total_attended, total_periods)

    return {
        "overall": overall_stats,
        "overall_percentage": overall_stats["percentage"],
        "bunkable_periods": overall_stats["safe_to_miss"],
        "needed_for_75": overall_stats["must_attend_next"],
        "status": "critical" if overall_stats["is_below_threshold"] else "safe",
        "subjects": subjects,
        "total_attended": total_attended,
        "total_periods": total_periods,
    }


def validate_edit_window(
    log_date_str: str,
    baseline_date_str: Optional[str] = None,
) -> None:
    """Enforce server-side edit window: today ± 7 days, and after baseline date."""
    from datetime import datetime
    from fastapi import HTTPException, status

    try:
        log_date = datetime.strptime(log_date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD.")

    today = get_today_ist()
    min_date = today - timedelta(days=7)
    max_date = today + timedelta(days=7)

    if log_date < min_date or log_date > max_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Edit window violation: date must be between {min_date} and {max_date}.",
        )

    if baseline_date_str:
        try:
            b_date = datetime.strptime(baseline_date_str, "%Y-%m-%d").date()
            if log_date <= b_date:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Date {log_date_str} is locked (before baseline cutoff {baseline_date_str}).",
                )
        except ValueError:
            pass


def get_forecast(user: User, db: Session, days: int = 7) -> list:
    """Generate attendance forecast for next N days."""
    today = get_today_ist()
    section_id = user.section_id
    if not section_id:
        return []

    blocks = db.query(TimetableBlock).filter(TimetableBlock.section_id == section_id).all()

    # Current totals
    dashboard = get_user_dashboard(user, db)
    current_attended = dashboard["total_attended"]
    current_total = dashboard["total_periods"]

    forecast = []
    for i in range(1, days + 1):
        forecast_date = today + timedelta(days=i)
        weekday = forecast_date.isoweekday()  # 1=Mon..7=Sun
        # Map to our weekday format (1=Mon..6=Sat, 0=Sun)
        day_weekday = weekday if weekday < 7 else 0

        day_blocks = [b for b in blocks if b.weekday == day_weekday]
        if not day_blocks:
            continue

        day_periods = sum(b.periods for b in day_blocks)

        # If attend all
        attend_all = calculate_bunk_stats(
            current_attended + day_periods, current_total + day_periods
        )
        # If miss all
        miss_all = calculate_bunk_stats(current_attended, current_total + day_periods)

        forecast.append({
            "date": forecast_date.isoformat(),
            "weekday": day_weekday,
            "blocks": [
                {"id": b.id, "subject": b.subject, "periods": b.periods, "order_index": b.order_index}
                for b in sorted(day_blocks, key=lambda x: x.order_index)
            ],
            "total_periods": day_periods,
            "if_attend_all": attend_all,
            "if_miss_all": miss_all,
        })

    return forecast
