import pytest
from fastapi.testclient import TestClient


def test_quality_inspection_and_genealogy(client: TestClient, auth_headers):
    # 1. Create a fabric roll
    roll_res = client.post(
        "/api/v1/rolls",
        headers=auth_headers["quality"],
        json={
            "roll_code": "ROL-TEST-Q1",
            "fabric_type": "Cotton Oxford 160 GSM",
            "length_m": 500.0,
            "weight_kg": 110.0,
            "width_inches": 58.0,
            "grade": "A",
            "current_status": "uninspected",
            "current_location": "Inspection Station 1",
        },
    )
    assert roll_res.status_code == 201
    roll_id = roll_res.json()["id"]

    # 2. Record Inspection: Pass with minimal points
    insp_res = client.post(
        "/api/v1/quality/inspections",
        headers=auth_headers["quality"],
        json={
            "roll_id": roll_id,
            "result": "pass",
            "defect_count": 2,
            "defect_details": [
                {"type": "slub", "points": 1, "count": 1, "meter": 45.0},
                {"type": "fly_yarn", "points": 1, "count": 1, "meter": 180.0},
            ],
            "disposition": "approved_for_dispatch",
        },
    )
    assert insp_res.status_code == 201
    assert insp_res.json()["result"] == "pass"

    # Verify roll status updated to PASS and Grade A
    roll_check = client.get(f"/api/v1/rolls/{roll_id}", headers=auth_headers["quality"])
    assert roll_check.json()["current_status"] == "pass"
    assert roll_check.json()["grade"] == "A"

    # 3. Check Roll Genealogy
    gen_res = client.get(f"/api/v1/rolls/{roll_id}/genealogy", headers=auth_headers["quality"])
    assert gen_res.status_code == 200
    gen_data = gen_res.json()
    assert gen_data["roll_code"] == "ROL-TEST-Q1"
    assert len(gen_data["inspections"]) == 1


def test_quality_rejection(client: TestClient, auth_headers):
    # Create roll and reject it
    roll_res = client.post(
        "/api/v1/rolls",
        headers=auth_headers["quality"],
        json={
            "roll_code": "ROL-TEST-REJECT",
            "fabric_type": "Silk Satin",
            "length_m": 300.0,
            "width_inches": 58.0,
        },
    )
    roll_id = roll_res.json()["id"]

    insp_res = client.post(
        "/api/v1/quality/inspections",
        headers=auth_headers["quality"],
        json={
            "roll_id": roll_id,
            "result": "reject",
            "defect_count": 20,
            "defect_details": [{"type": "major_color_bleed", "points": 4, "count": 5}],
            "disposition": "scrap_unrecoverable",
        },
    )
    assert insp_res.status_code == 201

    # Verify roll status is REJECTED and scrap
    roll_check = client.get(f"/api/v1/rolls/{roll_id}", headers=auth_headers["quality"])
    assert roll_check.json()["current_status"] == "rejected"
    assert roll_check.json()["grade"] == "scrap"
