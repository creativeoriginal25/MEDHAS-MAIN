"""Attendance router — mark, dashboard, forecast, timetable blocks."""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.attendance import DailyLog, TimetableBlock, Section
from app.schemas.attendance import MarkAttendanceRequest, AttendanceSaveResponse
from app.services import validate_edit_window, get_user_dashboard, get_forecast, calculate_bunk_stats
from app.utils import get_today_ist

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/mark", response_model=AttendanceSaveResponse)
def mark_attendance(
    req: MarkAttendanceRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark attendance for a given date — batch save in single transaction."""
    validate_edit_window(req.log_date, user.baseline_date)

    if not user.section_id:
        raise HTTPException(status_code=400, detail="No section assigned. Please set up your timetable first.")

    # Validate all block_ids belong to user's section
    section_blocks = db.query(TimetableBlock.id).filter(
        TimetableBlock.section_id == user.section_id
    ).all()
    valid_block_ids = {b.id for b in section_blocks}

    updated = 0
    for entry in req.entries:
        if entry.block_id not in valid_block_ids:
            continue

        existing = db.query(DailyLog).filter(
            and_(
                DailyLog.user_id == user.id,
                DailyLog.log_date == req.log_date,
                DailyLog.block_id == entry.block_id,
            )
        ).first()

        if entry.status == "unmarked":
            if existing:
                db.delete(existing)
                updated += 1
            continue

        if existing:
            existing.status = entry.status
            existing.notes = entry.notes
            existing.updated_at = datetime.utcnow()
        else:
            log = DailyLog(
                user_id=user.id,
                log_date=req.log_date,
                block_id=entry.block_id,
                status=entry.status,
                notes=entry.notes,
            )
            db.add(log)
        updated += 1

    db.commit()
    summary = get_user_dashboard(user, db)
    return AttendanceSaveResponse(success=True, updated_count=updated, summary=summary)


@router.get("/today")
def get_today_attendance(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get today's timetable blocks with attendance status."""
    today = get_today_ist()
    weekday = today.isoweekday()  # 1=Mon..7=Sun
    day_weekday = weekday if weekday < 7 else 0

    if not user.section_id:
        return {"date": today.isoformat(), "weekday": day_weekday, "blocks": []}

    blocks = db.query(TimetableBlock).filter(
        and_(
            TimetableBlock.section_id == user.section_id,
            TimetableBlock.weekday == day_weekday,
        )
    ).order_by(TimetableBlock.order_index).all()

    # Get existing logs for today
    logs = db.query(DailyLog).filter(
        and_(
            DailyLog.user_id == user.id,
            DailyLog.log_date == today.isoformat(),
        )
    ).all()
    log_map = {l.block_id: l for l in logs}

    result_blocks = []
    for block in blocks:
        log = log_map.get(block.id)
        result_blocks.append({
            "block_id": block.id,
            "subject": block.subject,
            "periods": block.periods,
            "order_index": block.order_index,
            "status": log.status if log else "unmarked",
            "notes": log.notes if log else None,
        })

    return {"date": today.isoformat(), "weekday": day_weekday, "blocks": result_blocks}


@router.get("/date/{log_date}")
def get_date_attendance(
    log_date: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get attendance for a specific date."""
    try:
        dt = datetime.strptime(log_date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format.")

    weekday = dt.isoweekday()
    day_weekday = weekday if weekday < 7 else 0

    if not user.section_id:
        return {"date": log_date, "weekday": day_weekday, "blocks": []}

    blocks = db.query(TimetableBlock).filter(
        and_(
            TimetableBlock.section_id == user.section_id,
            TimetableBlock.weekday == day_weekday,
        )
    ).order_by(TimetableBlock.order_index).all()

    logs = db.query(DailyLog).filter(
        and_(DailyLog.user_id == user.id, DailyLog.log_date == log_date)
    ).all()
    log_map = {l.block_id: l for l in logs}

    result = []
    for block in blocks:
        log = log_map.get(block.id)
        result.append({
            "block_id": block.id,
            "subject": block.subject,
            "periods": block.periods,
            "order_index": block.order_index,
            "status": log.status if log else "unmarked",
            "notes": log.notes if log else None,
        })

    return {"date": log_date, "weekday": day_weekday, "blocks": result}


@router.get("/summary")
def get_attendance_summary(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get APY-compatible summary format with overall and mapped subjects dictionary."""
    dash = get_user_dashboard(user, db)
    subj_map = {}
    for s in dash.get("subjects", []):
        subj_map[s["subject"]] = {
            "attended": s["attended"],
            "total": s["total"],
            "percentage": s["percentage"],
            "safe_to_miss": s["stats"]["safe_to_miss"],
            "must_attend_next": s["stats"]["must_attend_next"],
            "is_below_threshold": s["stats"]["is_below_threshold"],
        }
    return {
        "overall": dash["overall"],
        "subjects": subj_map,
        "total_attended": dash["total_attended"],
        "total_periods": dash["total_periods"],
    }


@router.get("/dashboard")
def get_dashboard(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full attendance dashboard with overall and subject-wise stats."""
    return get_user_dashboard(user, db)


@router.get("/forecast")
def get_attendance_forecast(
    days: Optional[int] = Query(default=None),
    target_date: Optional[str] = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get attendance forecast for next N days or single-day FAT projection."""
    if target_date:
        from datetime import datetime
        try:
            t_date = datetime.strptime(target_date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid target_date format. Expected YYYY-MM-DD.")

        weekday = t_date.isoweekday()
        day_weekday = weekday if weekday < 7 else 0  # 0=Sunday
        day_names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

        if day_weekday == 0:
            return {
                "target_date": target_date,
                "weekday": 0,
                "day_name": "Sunday",
                "is_holiday": True,
                "blocks": [],
                "message": "Sunday is a fixed holiday.",
            }

        dash = get_user_dashboard(user, db)
        current_overall_att = dash["total_attended"]
        current_overall_tot = dash["total_periods"]
        current_overall_pct = dash["overall_percentage"]

        blocks = db.query(TimetableBlock).filter(
            TimetableBlock.section_id == user.section_id,
            TimetableBlock.weekday == day_weekday,
        ).order_by(TimetableBlock.order_index).all()

        subj_map = {s["subject"]: s for s in dash.get("subjects", [])}
        forecast_blocks = []
        for b in blocks:
            s_data = subj_map.get(b.subject, {"attended": 0, "total": 0, "percentage": 0.0})
            s_att = s_data["attended"]
            s_tot = s_data["total"]

            p = b.periods
            subj_if_present = round(((s_att + p) / (s_tot + p)) * 100, 2) if (s_tot + p) > 0 else 0.0
            subj_if_absent = round((s_att / (s_tot + p)) * 100, 2) if (s_tot + p) > 0 else 0.0

            overall_if_present = round(((current_overall_att + p) / (current_overall_tot + p)) * 100, 2) if (current_overall_tot + p) > 0 else 0.0
            overall_if_absent = round((current_overall_att / (current_overall_tot + p)) * 100, 2) if (current_overall_tot + p) > 0 else 0.0

            forecast_blocks.append({
                "block_id": b.id,
                "subject": b.subject,
                "periods": b.periods,
                "order_index": b.order_index,
                "current_subject_pct": s_data.get("percentage", 0.0),
                "subject_if_present": subj_if_present,
                "subject_if_absent": subj_if_absent,
                "current_overall_pct": current_overall_pct,
                "overall_if_present": overall_if_present,
                "overall_if_absent": overall_if_absent,
            })

        return {
            "target_date": target_date,
            "weekday": day_weekday,
            "day_name": day_names[day_weekday],
            "is_holiday": False,
            "blocks": forecast_blocks,
        }

    return get_forecast(user, db, days or 7)


@router.get("/target-calculator")
def calculate_attendance_target(
    target_percentage: float = Query(75.0, ge=1.0, le=100.0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Simulate consecutive periods & calendar date required to reach any target percentage."""
    import math
    from datetime import timedelta
    dash = get_user_dashboard(user, db)
    att = dash["total_attended"]
    tot = dash["total_periods"]
    current_pct = dash["overall_percentage"]
    p = target_percentage / 100.0

    if tot == 0:
        return {
            "target_percentage": target_percentage,
            "current_percentage": 0.0,
            "status": "above_target",
            "periods_needed": 0,
            "safe_to_miss": 0,
            "projected_date": None,
            "message": "No attendance logged yet.",
        }

    if current_pct >= target_percentage:
        safe_bunks = math.floor((att / p) - tot) if p > 0 else 0
        return {
            "target_percentage": target_percentage,
            "current_percentage": current_pct,
            "status": "above_target",
            "periods_needed": 0,
            "safe_to_miss": max(0, safe_bunks),
            "projected_date": None,
            "message": f"Currently at {current_pct}%, safely above {target_percentage}%. You can safely miss {max(0, safe_bunks)} periods.",
        }
    else:
        needed = math.ceil((p * tot - att) / (1.0 - p))
        needed = max(1, needed)

        # Timetable distribution
        blocks = db.query(TimetableBlock).filter(
            TimetableBlock.section_id == (user.section_id or 1)
        ).all()

        weekday_periods = {}
        for b in blocks:
            weekday_periods[b.weekday] = weekday_periods.get(b.weekday, 0) + b.periods

        accumulated = 0
        check_date = get_today_ist()
        projected_date = None

        for _ in range(120):
            check_date += timedelta(days=1)
            w = check_date.isoweekday()
            db_weekday = w if w < 7 else 0
            if db_weekday == 0:
                continue
            day_periods = weekday_periods.get(db_weekday, 0)
            if day_periods > 0:
                accumulated += day_periods
                if accumulated >= needed:
                    projected_date = check_date.isoformat()
                    break

        return {
            "target_percentage": target_percentage,
            "current_percentage": current_pct,
            "status": "below_target",
            "periods_needed": needed,
            "safe_to_miss": 0,
            "projected_date": projected_date,
            "message": f"Must attend next {needed} consecutive periods to reach {target_percentage}%.",
        }


@router.put("/sections/{section_id}/timetable")
def update_section_timetable(
    section_id: int,
    payload: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update timetable blocks for a section."""
    blocks_data = payload.get("blocks", [])
    # Replace existing blocks
    db.query(TimetableBlock).filter(TimetableBlock.section_id == section_id).delete()
    for b in blocks_data:
        new_block = TimetableBlock(
            section_id=section_id,
            weekday=b["weekday"],
            order_index=b.get("order_index", 1),
            subject=b["subject"],
            periods=b.get("periods", 1),
        )
        db.add(new_block)
    db.commit()
    return {"success": True, "message": "Timetable updated successfully"}


@router.get("/timetable")
def get_timetable(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get full weekly timetable for user's section."""
    if not user.section_id:
        return {"section": None, "blocks": {}}

    section = db.query(Section).filter(Section.id == user.section_id).first()
    blocks = db.query(TimetableBlock).filter(
        TimetableBlock.section_id == user.section_id
    ).order_by(TimetableBlock.weekday, TimetableBlock.order_index).all()

    # Group by weekday
    by_day = {}
    for b in blocks:
        day = str(b.weekday)
        if day not in by_day:
            by_day[day] = []
        by_day[day].append({
            "id": b.id,
            "subject": b.subject,
            "periods": b.periods,
            "order_index": b.order_index,
        })

    return {
        "section": {
            "id": section.id,
            "branch": section.branch,
            "label": section.section_label,
            "effective_from": section.effective_from,
        } if section else None,
        "blocks": by_day,
    }


@router.get("/logs")
def get_daily_logs(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all daily logs for user, optionally filtered by date range."""
    from datetime import timedelta
    today = get_today_ist()
    s_date = start_date or (today - timedelta(days=30)).isoformat()
    e_date = end_date or (today + timedelta(days=7)).isoformat()

    logs = db.query(DailyLog).join(TimetableBlock, DailyLog.block_id == TimetableBlock.id).filter(
        DailyLog.user_id == user.id,
        DailyLog.log_date.between(s_date, e_date),
    ).order_by(DailyLog.log_date, TimetableBlock.order_index).all()

    logs_by_date = {}
    rows = []
    for l in logs:
        item = {
            "id": l.id,
            "log_date": l.log_date,
            "block_id": l.block_id,
            "status": l.status,
            "notes": l.notes or "",
            "subject": l.block.subject if l.block else "",
            "periods": l.block.periods if l.block else 1,
            "weekday": l.block.weekday if l.block else 0,
            "order_index": l.block.order_index if l.block else 0,
        }
        rows.append(item)
        if l.log_date not in logs_by_date:
            logs_by_date[l.log_date] = []
        logs_by_date[l.log_date].append(item)

    return {
        "start_date": s_date,
        "end_date": e_date,
        "logs": rows,
        "logs_by_date": logs_by_date,
    }


@router.get("/sections")
def get_sections(db: Session = Depends(get_db)):
    """List available timetable sections."""
    sections = db.query(Section).all()
    return {
        "sections": [
            {
                "id": s.id,
                "branch": s.branch,
                "section_label": s.section_label,
                "effective_from": s.effective_from,
            }
            for s in sections
        ]
    }


@router.get("/sections/{section_id}/timetable")
def get_section_timetable(section_id: int, db: Session = Depends(get_db)):
    """Get full timetable for a specific section."""
    blocks = db.query(TimetableBlock).filter(
        TimetableBlock.section_id == section_id
    ).order_by(TimetableBlock.weekday, TimetableBlock.order_index).all()

    by_day = {}
    for b in blocks:
        day = b.weekday
        if day not in by_day:
            by_day[day] = []
        by_day[day].append({
            "id": b.id,
            "weekday": b.weekday,
            "order_index": b.order_index,
            "subject": b.subject,
            "periods": b.periods,
        })
    return {"timetable_by_day": by_day}


@router.get("/export")
def export_csv(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Export attendance ledger as CSV."""
    import csv
    import io
    from fastapi.responses import Response

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Block Index", "Subject", "Periods", "Status", "Notes"])

    logs = db.query(DailyLog).join(TimetableBlock, DailyLog.block_id == TimetableBlock.id).filter(
        DailyLog.user_id == user.id
    ).order_by(DailyLog.log_date, TimetableBlock.order_index).all()

    for l in logs:
        writer.writerow([
            l.log_date,
            l.block.order_index if l.block else "",
            l.block.subject if l.block else "",
            l.block.periods if l.block else "",
            l.status,
            l.notes or "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=attendance_{user.register_number}.csv"}
    )
