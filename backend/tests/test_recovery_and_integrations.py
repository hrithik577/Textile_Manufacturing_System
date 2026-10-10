import pytest
from fastapi.testclient import TestClient


def test_simulator_telemetry_and_alert_generation(client: TestClient, auth_headers, seeded_users):
    # Ingest simulator event with breakdown
    event_payload = {
        "event_id": "SIM-EVT-TEST-001",
        "machine_id": "M-001",
        "event_type": "breakdown",
        "status": "breakdown",
        "downtime_reason": "Warp yarn tension failure",
        "source": "simulator",
        "output_quantity": 0.0,
    }

    res = client.post(
        "/api/v1/integrations/simulator/event",
        headers={"X-Simulator-Secret": "simulator-dev-secret-key-2026"},
        json=event_payload,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "processed"
    assert data["alert_generated"] is not None
    alert_id = data["alert_generated"]["alert_id"]

    # Test idempotency: re-send same event_id -> duplicate_skipped
    dup_res = client.post(
        "/api/v1/integrations/simulator/event",
        headers={"X-Simulator-Secret": "simulator-dev-secret-key-2026"},
        json=event_payload,
    )
    assert dup_res.status_code == 200
    assert dup_res.json()["status"] == "duplicate_skipped"

    # Test recovery plan proposal from AI Engine
    plan_res = client.post(
        "/api/v1/integrations/intelligence/recommendations",
        headers={"X-Simulator-Secret": "simulator-dev-secret-key-2026"},
        json={
            "alert_id": alert_id,
            "title": "Automated Tensioner Reset Proposal",
            "description": "Reset tension actuators and re-thread warp line.",
            "affected_entity_type": "machine",
            "affected_entity_id": "M-001",
            "proposed_actions": [{"type": "dispatch_maintenance_team", "machine_code": "M-001"}],
            "expected_outcome": "Restores loom within 15 minutes",
            "risk_assessment": "low",
        },
    )
    assert plan_res.status_code == 201
    plan_data = plan_res.json()
    plan_id = plan_data["id"]
    assert plan_data["approval_status"] == "pending"
    assert plan_data["execution_status"] == "not_started"

    # Enforce Rule 9: Attempting to execute unapproved plan -> 400 Bad Request
    unapproved_exec = client.post(
        f"/api/v1/recovery-plans/{plan_id}/execute",
        headers=auth_headers["manager"],
        json={},
    )
    assert unapproved_exec.status_code == 400
    assert unapproved_exec.json()["error_code"] == "UNAPPROVED_RECOVERY_PLAN"

    # Approve plan as Manager
    approve_res = client.post(
        f"/api/v1/recovery-plans/{plan_id}/approve",
        headers=auth_headers["manager"],
        json={"approved": True},
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["approval_status"] == "approved"

    # Execute approved plan
    exec_res = client.post(
        f"/api/v1/recovery-plans/{plan_id}/execute",
        headers=auth_headers["manager"],
        json={"notes": "Technician dispatched to loom M-001"},
    )
    assert exec_res.status_code == 200
    assert exec_res.json()["execution_status"] == "completed"
