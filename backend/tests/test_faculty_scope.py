"""Faculty Security & Scoping Test Suite.

Verifies:
- Subject-based faculty authentication with MEDHAS2026 (hashed, never plain)
- Subject scope resolution and locking (maths, physics, chemistry, c, english, dt, uhv)
- Cross-branch rejection (403)
- Cross-subject rejection (403)
- Unauthorized student access to faculty routes (403)
- Registration protection against claiming faculty accounts (409)
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app, on_startup

client = TestClient(app)


def setup_db():
    on_startup()


FACULTY_TEST_ACCOUNTS = [
    ("c", "CSE", "Computational Thinking and Problem Solving Using C", "cse-ctps-c"),
    ("maths", "CSE", "Linear Algebra & Calculus", "cse-lac"),
    ("physics", "ECE", "Applied Physics", "ece-physics"),
    ("chemistry", "CSE", "Applied Chemistry for Engineering Technologies", "cse-acet"),
    ("english", "CSE", "English for Technical Communication", "cse-etc"),
    ("dt", "CSE", "Design Thinking and Innovation", "cse-dti"),
    ("uhv", "CSE", "Universal Human Values-II", "cse-uhv"),
]


def test_faculty_logins_and_locked_scopes():
    """Verify each faculty username authenticates with MEDHAS2026 and receives locked scope."""
    for username, branch, subject_name, subject_id in FACULTY_TEST_ACCOUNTS:
        # 1. Login
        res = client.post("/api/auth/login", json={
            "register_number": username,
            "pin": "MEDHAS2026",
        })
        assert res.status_code == 200, f"Login failed for {username}: {res.text}"
        data = res.json()
        assert "token" in data
        assert "faculty_admin" in data["user"]["roles"]
        token = data["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Get profile scope
        prof_res = client.get("/api/faculty/profile", headers=headers)
        assert prof_res.status_code == 200, f"Profile failed for {username}: {prof_res.text}"
        prof = prof_res.json()
        assert prof["branch"] == branch
        assert prof["subject"] == subject_name
        assert prof["subjectId"] == subject_id
        assert prof["year"] == 1
        assert prof["semester"] == 1


def test_faculty_invalid_password():
    """Verify wrong password fails with 401."""
    res = client.post("/api/auth/login", json={
        "register_number": "maths",
        "pin": "WRONG_PASSWORD",
    })
    assert res.status_code == 401


def test_cross_branch_upload_tampering_rejected():
    """Verify that a CSE faculty cannot upload to ECE branch (403 Forbidden)."""
    login_res = client.post("/api/auth/login", json={
        "register_number": "c",
        "pin": "MEDHAS2026",
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt cross-branch tampering
    res = client.post("/api/faculty/resources", json={
        "unit": "Unit 1",
        "title": "Malicious Upload",
        "branch": "ECE",  # Tampered branch
        "link": "https://example.com/notes.pdf",
    }, headers=headers)
    assert res.status_code == 403
    assert "Malicious or invalid branch" in res.json()["detail"]


def test_cross_subject_upload_tampering_rejected():
    """Verify that a CTPS-C faculty cannot upload to LAC subject (403 Forbidden)."""
    login_res = client.post("/api/auth/login", json={
        "register_number": "c",
        "pin": "MEDHAS2026",
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt cross-subject tampering
    res = client.post("/api/faculty/resources", json={
        "unit": "Unit 1",
        "title": "Malicious Upload",
        "branch": "CSE",
        "subjectId": "cse-lac",  # Tampered subject
        "link": "https://example.com/notes.pdf",
    }, headers=headers)
    assert res.status_code == 403
    assert "Invalid subject payload" in res.json()["detail"]


def test_student_cannot_access_faculty_endpoints():
    """Verify that a regular student cannot access faculty profile or resources (403 Forbidden)."""
    login_res = client.post("/api/auth/login", json={
        "register_number": "22B91A0501",
        "pin": "1234",
    })
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Access faculty profile
    res = client.get("/api/faculty/profile", headers=headers)
    assert res.status_code == 403

    # Access faculty upload
    res = client.post("/api/faculty/resources", json={
        "unit": "Unit 1",
        "title": "Unauthorized",
        "link": "https://example.com/test",
    }, headers=headers)
    assert res.status_code == 403


def test_cannot_register_faculty_accounts():
    """Verify student registration rejects faculty usernames (409 Conflict)."""
    res = client.post("/api/auth/register", json={
        "register_number": "physics",
        "pin": "1234",
        "display_name": "Imposter",
        "branch": "ECE",
        "section": "A",
    })
    assert res.status_code == 409


if __name__ == "__main__":
    on_startup()
    print("Running test_faculty_logins_and_locked_scopes...")
    test_faculty_logins_and_locked_scopes()
    print("  [PASS] Passed")

    print("Running test_faculty_invalid_password...")
    test_faculty_invalid_password()
    print("  [PASS] Passed")

    print("Running test_cross_branch_upload_tampering_rejected...")
    test_cross_branch_upload_tampering_rejected()
    print("  [PASS] Passed")

    print("Running test_cross_subject_upload_tampering_rejected...")
    test_cross_subject_upload_tampering_rejected()
    print("  [PASS] Passed")

    print("Running test_student_cannot_access_faculty_endpoints...")
    test_student_cannot_access_faculty_endpoints()
    print("  [PASS] Passed")

    print("Running test_cannot_register_faculty_accounts...")
    test_cannot_register_faculty_accounts()
    print("  [PASS] Passed")

    print("\nALL FACULTY SECURITY TESTS PASSED! (100% OK)")
