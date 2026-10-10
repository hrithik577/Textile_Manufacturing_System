import pytest
from fastapi.testclient import TestClient


def test_production_order_and_machine_events(client: TestClient, auth_headers, seeded_users):
    _, cust1, _ = seeded_users

    # Create Sales Order
    so_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": "SO-PROD-TEST",
            "customer_id": cust1.id,
            "required_delivery_date": "2026-11-01",
            "items": [{"fabric_type": "Twill 240 GSM", "target_quantity": 3000.0, "unit_price": 5.0}],
        },
    )
    so_id = so_res.json()["id"]

    # Create Production Order
    po_res = client.post(
        "/api/v1/production/orders",
        headers=auth_headers["production"],
        json={
            "production_order_number": "PO-PROD-TEST-01",
            "sales_order_id": so_id,
            "target_quantity": 3000.0,
            "unit": "m",
        },
    )
    assert po_res.status_code == 201
    po_id = po_res.json()["id"]

    # Verify machines exist
    machines_res = client.get("/api/v1/machines", headers=auth_headers["production"])
    assert machines_res.status_code == 200
    machines_data = machines_res.json()
    assert "items" in machines_data
    assert len(machines_data["items"]) >= 1
    loom_code = machines_data["items"][0]["machine_code"]
    loom_id = machines_data["items"][0]["id"]

    # Record production event
    evt_id = "EVT-TEST-PROD-999"
    pe_res = client.post(
        "/api/v1/production/events",
        headers=auth_headers["production"],
        json={
            "event_id": evt_id,
            "production_order_id": po_id,
            "machine_id": loom_id,
            "event_type": "meterage_output",
            "quantity": 500.0,
            "unit": "m",
            "source": "simulator",
        },
    )
    assert pe_res.status_code == 201
    assert pe_res.json()["quantity"] == 500.0

    # Test idempotency: re-submitting exact same event_id
    pe_dup = client.post(
        "/api/v1/production/events",
        headers=auth_headers["production"],
        json={
            "event_id": evt_id,
            "production_order_id": po_id,
            "machine_id": loom_id,
            "event_type": "meterage_output",
            "quantity": 500.0,
            "unit": "m",
            "source": "simulator",
        },
    )
    assert pe_dup.status_code == 201 # Handled cleanly without doubling completed quantity

    # Verify PO completed quantity is 500.0 (not 1000.0)
    po_check = client.get(f"/api/v1/production/orders/{po_id}", headers=auth_headers["production"])
    assert po_check.json()["completed_quantity"] == 500.0
