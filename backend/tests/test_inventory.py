import pytest
from fastapi.testclient import TestClient


def test_inventory_lifecycle_and_ledger(client: TestClient, auth_headers):
    # 1. Create a raw material
    mat_res = client.post(
        "/api/v1/inventory/materials",
        headers=auth_headers["inventory"],
        json={
            "material_code": "MAT-T-001",
            "name": "Combed Cotton 40s",
            "material_type": "yarn",
            "unit": "kg",
            "reorder_threshold": 300.0,
            "safety_stock": 100.0,
            "standard_cost_per_unit": 4.50,
        },
    )
    assert mat_res.status_code == 201
    mat_id = mat_res.json()["id"]
    assert mat_res.json()["current_stock"] == 0.0

    # 2. Receive stock into lot
    receipt_res = client.post(
        "/api/v1/inventory/receipts",
        headers=auth_headers["inventory"],
        json={
            "material_id": mat_id,
            "lot_number": "LOT-T-001",
            "quantity": 1000.0,
            "unit": "kg",
            "unit_cost": 4.50,
            "storage_location": "Warehouse A",
        },
    )
    assert receipt_res.status_code == 201
    assert receipt_res.json()["movement_type"] == "receipt"
    assert receipt_res.json()["quantity"] == 1000.0

    # Verify material stock updated
    get_mat = client.get(f"/api/v1/inventory/materials/{mat_id}", headers=auth_headers["inventory"])
    assert get_mat.json()["current_stock"] == 1000.0

    # 3. Reserve stock
    resv_res = client.post(
        "/api/v1/inventory/reservations",
        headers=auth_headers["inventory"],
        json={
            "material_id": mat_id,
            "quantity": 400.0,
            "unit": "kg",
            "notes": "Reserved for PO 1",
        },
    )
    assert resv_res.status_code == 201
    assert resv_res.json()["movement_type"] == "reservation"

    # 4. Consume stock
    cons_res = client.post(
        "/api/v1/inventory/consumption",
        headers=auth_headers["production"],
        json={
            "material_id": mat_id,
            "quantity": 300.0,
            "unit": "kg",
            "process_name": "Weaving",
        },
    )
    assert cons_res.status_code == 201
    assert cons_res.json()["movement_type"] == "consumption"

    # Verify remaining stock: 1000 - 300 = 700
    get_mat2 = client.get(f"/api/v1/inventory/materials/{mat_id}", headers=auth_headers["inventory"])
    assert get_mat2.json()["current_stock"] == 700.0


def test_insufficient_stock_rejection(client: TestClient, auth_headers):
    # Create material with 100 kg
    mat_res = client.post(
        "/api/v1/inventory/materials",
        headers=auth_headers["inventory"],
        json={
            "material_code": "MAT-LOW-01",
            "name": "Silk Filament",
            "material_type": "yarn",
            "unit": "kg",
            "reorder_threshold": 50.0,
        },
    )
    mat_id = mat_res.json()["id"]

    client.post(
        "/api/v1/inventory/receipts",
        headers=auth_headers["inventory"],
        json={
            "material_id": mat_id,
            "lot_number": "LOT-SILK-01",
            "quantity": 100.0,
            "unit": "kg",
        },
    )

    # Attempt to consume 500 kg (only 100 available) -> 400 Bad Request
    cons_res = client.post(
        "/api/v1/inventory/consumption",
        headers=auth_headers["production"],
        json={
            "material_id": mat_id,
            "quantity": 500.0,
            "unit": "kg",
        },
    )
    assert cons_res.status_code == 400
    assert cons_res.json()["error_code"] == "INSUFFICIENT_STOCK"


def test_unit_mismatch_rejection(client: TestClient, auth_headers):
    mat_res = client.post(
        "/api/v1/inventory/materials",
        headers=auth_headers["inventory"],
        json={
            "material_code": "MAT-UNIT-TEST",
            "name": "Dye Aux",
            "material_type": "dye_chemical",
            "unit": "litres",
            "reorder_threshold": 50.0,
        },
    )
    mat_id = mat_res.json()["id"]

    # Attempt receipt in 'kg' instead of 'litres'
    receipt_res = client.post(
        "/api/v1/inventory/receipts",
        headers=auth_headers["inventory"],
        json={
            "material_id": mat_id,
            "lot_number": "LOT-WRONG-UNIT",
            "quantity": 50.0,
            "unit": "kg",
        },
    )
    assert receipt_res.status_code == 400
    assert receipt_res.json()["error_code"] == "UNIT_MISMATCH"
