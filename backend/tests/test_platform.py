"""Comprehensive platform test suite."""

import pytest
from fastapi.testclient import TestClient
from app.main import app, on_startup
from app.database import SessionLocal
from app.models.user import User

client = TestClient(app)

@pytest.fixture(scope="session", autouse=True)
def setup_db():
    on_startup()
    yield

def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"

def test_auth_login_student():
    res = client.post("/api/auth/login", json={
        "register_number": "22B91A0501",
        "pin": "1234",
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert data["user"]["register_number"] == "22B91A0501"
    assert "student" in data["user"]["roles"]

def test_auth_invalid_pin():
    res = client.post("/api/auth/login", json={
        "register_number": "22B91A0501",
        "pin": "wrongpin",
    })
    assert res.status_code == 401

def test_auth_register_new_student():
    import uuid
    reg = f"TEST{uuid.uuid4().hex[:6].upper()}"
    res = client.post("/api/auth/register", json={
        "register_number": reg,
        "pin": "9999",
        "display_name": "Test Runner",
        "branch": "CSE",
        "section": "A",
        "academic_year": 3,
        "semester": 5,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["user"]["register_number"] == reg
    assert data["user"]["academic_year"] == 3
    assert data["user"]["current_semester"] == 5
    assert "token" in data

def test_get_profile():
    # Login as student
    login_res = client.post("/api/auth/login", json={
        "register_number": "22B91A0501",
        "pin": "1234",
    })
    token = login_res.json()["token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["register_number"] == "22B91A0501"

def test_attendance_today_and_dashboard():
    login_res = client.post("/api/auth/login", json={
        "register_number": "22B91A0501",
        "pin": "1234",
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get today
    today_res = client.get("/api/attendance/today", headers=headers)
    assert today_res.status_code == 200
    assert "blocks" in today_res.json()

    # Get dashboard
    dash_res = client.get("/api/attendance/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert "overall_percentage" in dash_data
    assert "bunkable_periods" in dash_data

def test_content_endpoints():
    # Departments
    dept_res = client.get("/api/content/departments")
    assert dept_res.status_code == 200
    depts = dept_res.json()
    assert len(depts) >= 10
    dept_codes = [d["code"] for d in depts]
    assert "CSE" in dept_codes
    assert "ECE" in dept_codes
    assert "AIDS" in dept_codes

    # Subjects
    subj_res = client.get("/api/content/subjects?department=CSE")
    assert subj_res.status_code == 200
    assert len(subj_res.json()) >= 1

    # Search
    search_res = client.get("/api/content/search?q=Mathematics")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert "subjects" in search_data
    assert len(search_data["subjects"]) >= 1

def test_grow_endpoints():
    login_res = client.post("/api/auth/login", json={
        "register_number": "22B91A0501",
        "pin": "1234",
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Prompts
    prompts_res = client.get("/api/grow/prompts")
    assert prompts_res.status_code == 200
    prompts = prompts_res.json()
    assert len(prompts) > 0

    # Career paths (authenticated)
    career_res = client.get("/api/grow/career-paths?department=CSE", headers=headers)
    assert career_res.status_code == 200
    assert len(career_res.json()) >= 1

def test_campus_services():
    res = client.get("/api/campus/services")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_admin_role_security():
    # Regular student token
    login_res = client.post("/api/auth/login", json={
        "register_number": "22B91A0501",
        "pin": "1234",
    })
    token = login_res.json()["token"]
    student_headers = {"Authorization": f"Bearer {token}"}

    # Student trying to reset PIN -> 403 Forbidden
    res = client.post("/api/admin/reset-pin", json={
        "target_register_number": "22B91A0501",
        "new_pin": "5678",
    }, headers=student_headers)
    assert res.status_code == 403

    # Admin login
    admin_login = client.post("/api/auth/login", json={
        "register_number": "ADMIN01",
        "pin": "admin123",
    })
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin accessing audit logs -> 200 OK
    audit_res = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert audit_res.status_code == 200
    assert isinstance(audit_res.json(), list)
