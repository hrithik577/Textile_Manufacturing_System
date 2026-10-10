import pytest
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from app.models.user import User


def test_yarniq_seed_and_overview(client: TestClient, auth_headers):
    # Test seed endpoint
    res = client.post("/api/v1/yarniq/seed?force=true", headers=auth_headers["manager"])
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["specifications"] >= 5

    # Test overview metrics
    res_ov = client.get("/api/v1/yarniq/overview", headers=auth_headers["manager"])
    assert res_ov.status_code == 200
    ov = res_ov.json()
    assert ov["total_usable_stock_kg"] > 0
    assert ov["po_discrepancies_count"] >= 1
    assert ov["blocked_production_orders_count"] >= 1
    assert len(ov["stock_by_fiber"]) > 0
    assert len(ov["prioritized_actions"]) > 0


def test_smart_gate_receipt_and_discrepancy_detection(client: TestClient, auth_headers):
    # 1. Get specs and POs
    specs = client.get("/api/v1/yarniq/specifications", headers=auth_headers["manager"]).json()
    assert len(specs) > 0
    spec_id = specs[0]["id"]

    pos = client.get("/api/v1/yarniq/purchase-orders", headers=auth_headers["manager"]).json()
    po = pos[0]

    # 2. Record normal receipt without PO discrepancy (direct delivery or full PO receipt)
    challan_no = f"CH-TEST-{int(datetime.now().timestamp()) % 100000}"
    payload = {
        "supplier_id": po["supplier_id"],
        "po_id": None,
        "challan_number": challan_no,
        "vehicle_number": "GJ-01-AB-1234",
        "driver_name": "Kishan Lal",
        "lines": [
            {
                "specification_id": spec_id,
                "supplier_lot_number": "SUP-LOT-TEST-01",
                "ordered_quantity_kg": 500.0,
                "gross_weight_kg": 515.0,
                "net_weight_kg": 500.0,
                "storage_location": "Warehouse A - Bay 1",
                "quality_status": "approved",
            }
        ],
    }
    res_rec = client.post("/api/v1/yarniq/receipts", headers=auth_headers["manager"], json=payload)
    assert res_rec.status_code == 201
    rec_data = res_rec.json()
    assert rec_data["success"] is True
    assert rec_data["has_discrepancy"] is False
    assert len(rec_data["lines"]) == 1
    assert "LOT-2026-" in rec_data["lines"][0]["internal_lot_number"]

    # 3. Record discrepant receipt (ordered 1000kg, delivered 750kg -> 25% shortage!)
    challan_disc = f"CH-DISC-TEST-{int(spec_id)}"
    payload_disc = {
        "supplier_id": po["supplier_id"],
        "po_id": po["id"],
        "challan_number": challan_disc,
        "vehicle_number": "GJ-01-AB-9999",
        "driver_name": "Ramu Patel",
        "lines": [
            {
                "specification_id": spec_id,
                "supplier_lot_number": "SUP-LOT-SHORT-02",
                "ordered_quantity_kg": 1000.0,
                "gross_weight_kg": 770.0,
                "net_weight_kg": 750.0,
                "storage_location": "Warehouse A - Bay 2",
                "quality_status": "approved",
            }
        ],
    }
    res_disc = client.post("/api/v1/yarniq/receipts", headers=auth_headers["manager"], json=payload_disc)
    assert res_disc.status_code == 201
    disc_data = res_disc.json()
    assert disc_data["has_discrepancy"] is True
    assert disc_data["lines"][0]["is_discrepant"] is True
    assert disc_data["lines"][0]["discrepancy_kg"] < 0


def test_quarantined_lot_excluded_from_usable_stock(client: TestClient, auth_headers):
    # Check inventory
    lots = client.get("/api/v1/yarniq/inventory", headers=auth_headers["manager"]).json()
    quarantined = [l for l in lots if l["quality_status"] == "quarantined"]
    assert len(quarantined) >= 1
    # Quarantined lot must have 0 available quantity!
    for q_lot in quarantined:
        assert q_lot["available_quantity_kg"] == 0.0
        assert q_lot["quarantined_quantity_kg"] > 0.0


def test_production_readiness_engine_deterministic(client: TestClient, auth_headers):
    specs = client.get("/api/v1/yarniq/specifications", headers=auth_headers["manager"]).json()
    ecru_spec = next(s for s in specs if s["sku"] == "YRN-COT-30S-ECR")
    navy_spec = next(s for s in specs if s["sku"] == "YRN-COT-40S-NVY")

    # Case 1: READY order (small requirement well within ecru stock)
    req_ready = {
        "order_number": "TEST-READY-01",
        "customer_name": "Nordic Apparel",
        "requirements": [
            {
                "specification_id": ecru_spec["id"],
                "planned_yarn_kg": 500.0,
                "wastage_rate": 0.04,
            }
        ],
    }
    res_ready = client.post("/api/v1/yarniq/readiness", headers=auth_headers["manager"], json=req_ready)
    assert res_ready.status_code == 200
    ready_data = res_ready.json()
    assert ready_data["status"] == "READY"
    assert ready_data["total_shortage_kg"] == 0.0
    assert ready_data["overall_score_percent"] == 100.0

    # Case 2: BLOCKED order (large requirement for navy yarn which has deficit)
    req_blocked = {
        "order_number": "TEST-BLOCKED-02",
        "customer_name": "Patagonia Outdoor",
        "requirements": [
            {
                "specification_id": navy_spec["id"],
                "planned_yarn_kg": 1500.0,
                "wastage_rate": 0.05,
            }
        ],
    }
    res_blocked = client.post("/api/v1/yarniq/readiness", headers=auth_headers["manager"], json=req_blocked)
    assert res_blocked.status_code == 200
    blocked_data = res_blocked.json()
    assert blocked_data["status"] in ["BLOCKED", "AT_RISK"]
    assert blocked_data["total_shortage_kg"] > 0.0
    assert len(blocked_data["material_breakdowns"]) == 1
    assert blocked_data["material_breakdowns"][0]["is_fulfilled"] is False


def test_procurement_copilot_operational_queries(client: TestClient, auth_headers):
    # Test query 1
    q1 = {"query": "Can we start order PO-PROD-2026-03 tomorrow?"}
    res1 = client.post("/api/v1/yarniq/copilot", headers=auth_headers["manager"], json=q1)
    assert res1.status_code == 200
    d1 = res1.json()
    assert len(d1["evidence"]) > 0
    assert len(d1["recommended_actions"]) > 0

    # Test query 2
    q2 = {"query": "Why is Order PO-PROD-2026-03 blocked?"}
    res2 = client.post("/api/v1/yarniq/copilot", headers=auth_headers["manager"], json=q2)
    assert res2.status_code == 200
    d2 = res2.json()
    assert "shortage" in d2["answer"].lower() or "blocked" in d2["answer"].lower()

    # Test query 3
    q3 = {"query": "Which material should we reorder first?"}
    res3 = client.post("/api/v1/yarniq/copilot", headers=auth_headers["manager"], json=q3)
    assert res3.status_code == 200
    d3 = res3.json()
    assert len(d3["recommended_actions"]) > 0


def test_stockout_radar_and_lot_traceability(client: TestClient, auth_headers):
    # 1. Stockout Radar
    res_radar = client.get("/api/v1/yarniq/stockout-radar", headers=auth_headers["manager"])
    assert res_radar.status_code == 200
    radar = res_radar.json()
    assert len(radar) >= 4
    for item in radar:
        assert len(item["timeline"]) == 15
        assert "current_physical_kg" in item

    # 2. Lot Traceability (Yarn DNA)
    lots = client.get("/api/v1/yarniq/inventory", headers=auth_headers["manager"]).json()
    lot_code = lots[0]["lot_number"]

    res_trace = client.get(f"/api/v1/yarniq/traceability/{lot_code}", headers=auth_headers["manager"])
    assert res_trace.status_code == 200
    trace = res_trace.json()
    assert trace["lot_number"] == lot_code
    assert "backward_lineage" in trace
    assert "audit_timeline" in trace
    assert trace["backward_lineage"]["supplier_name"] != ""
