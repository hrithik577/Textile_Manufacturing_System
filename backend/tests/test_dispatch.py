import pytest
from fastapi.testclient import TestClient


def test_dispatch_ineligible_roll_prevention(client: TestClient, auth_headers, seeded_users):
    _, cust1, _ = seeded_users

    # Create Sales Order
    so_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": "SO-DISP-01",
            "customer_id": cust1.id,
            "required_delivery_date": "2026-11-15",
            "items": [{"fabric_type": "Cotton Twill", "target_quantity": 1000.0, "unit_price": 5.0}],
        },
    )
    so_id = so_res.json()["id"]

    # 1. Create a roll that is uninspected
    roll_uninspected = client.post(
        "/api/v1/rolls",
        headers=auth_headers["quality"],
        json={
            "roll_code": "ROL-DISP-UNINSP",
            "fabric_type": "Cotton Twill",
            "length_m": 500.0,
            "current_status": "uninspected",
        },
    ).json()

    # 2. Create a roll and reject it
    roll_rejected = client.post(
        "/api/v1/rolls",
        headers=auth_headers["quality"],
        json={
            "roll_code": "ROL-DISP-REJ",
            "fabric_type": "Cotton Twill",
            "length_m": 500.0,
        },
    ).json()
    client.post(
        "/api/v1/quality/inspections",
        headers=auth_headers["quality"],
        json={"roll_id": roll_rejected["id"], "result": "reject", "defect_count": 10},
    )

    # 3. Create Shipment
    shp_res = client.post(
        "/api/v1/dispatch/shipments",
        headers=auth_headers["dispatch"],
        json={
            "shipment_number": "SHP-DISP-TEST-01",
            "sales_order_id": so_id,
            "customer_id": cust1.id,
            "carrier": "DHL Express",
        },
    )
    assert shp_res.status_code == 201
    shp_id = shp_res.json()["id"]

    # Attempt to add uninspected roll -> 400 Bad Request
    add_uninsp = client.post(
        f"/api/v1/dispatch/shipments/{shp_id}/items",
        headers=auth_headers["dispatch"],
        json={"roll_id": roll_uninspected["id"]},
    )
    assert add_uninsp.status_code == 400
    assert add_uninsp.json()["error_code"] == "INELIGIBLE_ROLL_DISPATCH"

    # Attempt to add rejected roll -> 400 Bad Request
    add_rej = client.post(
        f"/api/v1/dispatch/shipments/{shp_id}/items",
        headers=auth_headers["dispatch"],
        json={"roll_id": roll_rejected["id"]},
    )
    assert add_rej.status_code == 400
    assert add_rej.json()["error_code"] == "INELIGIBLE_ROLL_DISPATCH"


def test_successful_dispatch_and_duplicate_prevention(client: TestClient, auth_headers, seeded_users):
    _, cust1, _ = seeded_users

    so_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": "SO-DISP-02",
            "customer_id": cust1.id,
            "required_delivery_date": "2026-11-20",
            "items": [{"fabric_type": "Twill", "target_quantity": 500.0, "unit_price": 5.0}],
        },
    )
    so_id = so_res.json()["id"]

    # Create and inspect roll to PASS
    roll_pass = client.post(
        "/api/v1/rolls",
        headers=auth_headers["quality"],
        json={"roll_code": "ROL-PASS-001", "fabric_type": "Twill", "length_m": 500.0},
    ).json()
    client.post(
        "/api/v1/quality/inspections",
        headers=auth_headers["quality"],
        json={"roll_id": roll_pass["id"], "result": "pass", "defect_count": 0},
    )

    # Create Shipment 1
    shp1 = client.post(
        "/api/v1/dispatch/shipments",
        headers=auth_headers["dispatch"],
        json={"shipment_number": "SHP-SUCCESS-01", "sales_order_id": so_id, "customer_id": cust1.id},
    ).json()

    # Add eligible roll
    add_item = client.post(
        f"/api/v1/dispatch/shipments/{shp1['id']}/items",
        headers=auth_headers["dispatch"],
        json={"roll_id": roll_pass["id"]},
    )
    assert add_item.status_code == 201

    # Confirm dispatch (Atomic)
    confirm_res = client.post(
        f"/api/v1/dispatch/shipments/{shp1['id']}/confirm",
        headers=auth_headers["dispatch"],
    )
    assert confirm_res.status_code == 200
    c_data = confirm_res.json()
    assert c_data["status"] == "dispatched"
    assert "tracking_reference" in c_data

    # Verify roll status is now DISPATCHED
    roll_check = client.get(f"/api/v1/rolls/{roll_pass['id']}", headers=auth_headers["quality"]).json()
    assert roll_check["current_status"] == "dispatched"

    # Create Shipment 2 and attempt to double-dispatch the same roll
    shp2 = client.post(
        "/api/v1/dispatch/shipments",
        headers=auth_headers["dispatch"],
        json={"shipment_number": "SHP-DUPLICATE-02", "sales_order_id": so_id, "customer_id": cust1.id},
    ).json()

    dup_add = client.post(
        f"/api/v1/dispatch/shipments/{shp2['id']}/items",
        headers=auth_headers["dispatch"],
        json={"roll_id": roll_pass["id"]},
    )
    assert dup_add.status_code == 400
    assert dup_add.json()["error_code"] in ["INELIGIBLE_ROLL_DISPATCH", "DUPLICATE_ROLL_DISPATCH"]
