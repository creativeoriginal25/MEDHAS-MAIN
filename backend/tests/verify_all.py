"""Comprehensive platform verification runner for Students, Platform Admin, and Faculty Portal."""

import sys
import os
sys.path.insert(0, os.path.abspath("."))
import uuid
from fastapi.testclient import TestClient
from app.main import app, on_startup
from app.database import SessionLocal
from app.models.user import User

client = TestClient(app)

def run_tests():
    on_startup()
    print("Database initialized.")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    print("  [PASS] Health check")

    # 2. Student login
    res = client.post("/api/auth/login", json={"register_number": "22B91A0501", "pin": "1234"})
    assert res.status_code == 200, f"Student login failed: {res.status_code}"
    student_token = res.json()["token"]
    assert "student" in res.json()["user"]["roles"]
    print("  [PASS] Student login")

    # 3. Student auth/me
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    assert res.json()["register_number"] == "22B91A0501"
    print("  [PASS] Student auth/me profile")

    # 4. Student Attendance
    res = client.get("/api/attendance/today", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    res = client.get("/api/attendance/dashboard", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 200
    print("  [PASS] Student attendance endpoints")

    # 5. Student content / departments / subjects
    res = client.get("/api/content/departments")
    assert res.status_code == 200
    res = client.get("/api/content/subjects?department=CSE")
    assert res.status_code == 200
    print("  [PASS] Student content endpoints")

    # 6. Faculty logins (all 7 subjects)
    faculty_list = ["c", "maths", "physics", "chemistry", "english", "dt", "uhv"]
    for f in faculty_list:
        res = client.post("/api/auth/login", json={"register_number": f, "pin": "MEDHAS2026"})
        assert res.status_code == 200, f"Faculty login failed for {f}: {res.status_code}"
        token = res.json()["token"]
        assert "faculty_admin" in res.json()["user"]["roles"]
        prof = client.get("/api/faculty/profile", headers={"Authorization": f"Bearer {token}"})
        assert prof.status_code == 200
        pdata = prof.json()
        assert pdata["username"] == f
        assert "subject" in pdata
        assert "branch" in pdata
    print(f"  [PASS] All {len(faculty_list)} faculty subject logins & locked scopes")

    # 7. Faculty invalid password rejection
    res = client.post("/api/auth/login", json={"register_number": "maths", "pin": "WRONGPASS"})
    assert res.status_code == 401
    print("  [PASS] Faculty invalid password returns 401")

    # 8. Security: Student blocked from faculty endpoints
    res = client.get("/api/faculty/profile", headers={"Authorization": f"Bearer {student_token}"})
    assert res.status_code == 403
    print("  [PASS] Student accessing faculty profile returns 403")

    # 9. Security: Cross-subject upload tampering blocked
    c_login = client.post("/api/auth/login", json={"register_number": "c", "pin": "MEDHAS2026"}).json()
    c_token = c_login["token"]
    res = client.post(
        "/api/faculty/resources",
        headers={"Authorization": f"Bearer {c_token}"},
        json={
            "subject": "Linear Algebra & Calculus",  # tampering attempt
            "unit": "Unit 1",
            "title": "Hacked Math Notes",
            "link": "https://example.com/math",
            "branch": "CSE",
            "academic_year": 1,
            "semester": 1,
        }
    )
    assert res.status_code == 403
    print("  [PASS] Cross-subject upload tampering returns 403")

    # 10. Security: Cross-branch upload tampering blocked
    res = client.post(
        "/api/faculty/resources",
        headers={"Authorization": f"Bearer {c_token}"},
        json={
            "subject": "Computational Thinking and Problem Solving Using C",
            "unit": "Unit 1",
            "title": "Hacked ECE Notes",
            "link": "https://example.com/c",
            "branch": "MECH",  # tampering attempt
            "academic_year": 1,
            "semester": 1,
        }
    )
    assert res.status_code == 403
    print("  [PASS] Cross-branch upload tampering returns 403")

    # 11. Security: Student cannot register faculty reserved username
    res = client.post("/api/auth/register", json={
        "register_number": "maths",
        "pin": "0000",
        "display_name": "Impostor",
        "branch": "CSE",
        "section": "A",
        "academic_year": 1,
        "semester": 1,
    })
    assert res.status_code == 409
    print("  [PASS] Student registration cannot claim faculty username (409)")

    print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! (100% PASS)")

if __name__ == "__main__":
    run_tests()
