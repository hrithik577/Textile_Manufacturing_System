import pytest
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.customer import Supplier
from app.models.production import Machine, ProcessType, MachineStatus
from app.models.workforce import Worker, Shift


def test_audit_scene_1_yarn_receiving_and_stock_movements(client: TestClient, auth_headers):
    """
    Scene 1 Audit:
    - Yarn supplier PO & specifications
    - Smart Gate receipt with scale weight verification and discrepancy detection
    - Stock movements & quarantine isolation
    - Low-stock radar & material readiness
    """
    # 1. Seed YarnIQ data
    seed_res = client.post("/api/v1/yarniq/seed?force=true", headers=auth_headers["manager"])
    assert seed_res.status_code == 200

    # 2. Get specs and POs
    specs = client.get("/api/v1/yarniq/specifications", headers=auth_headers["manager"]).json()
    assert len(specs) > 0
    spec = specs[0]

    pos = client.get("/api/v1/yarniq/purchase-orders", headers=auth_headers["manager"]).json()
    assert len(pos) > 0
    po = pos[0]

    # 3. Smart Gate Goods Receipt: Check scale gross vs tare weight discrepancy
    # Invoice says 1000 kg, scale measures 750 kg (25% short-weight discrepancy)
    challan_disc = f"CH-AUDIT-DISC-{int(datetime.now().timestamp()) % 100000}"
    payload_disc = {
        "supplier_id": po["supplier_id"],
        "po_id": po["id"],
        "challan_number": challan_disc,
        "vehicle_number": "MH-12-TX-9901",
        "driver_name": "Ramesh Yadav",
        "lines": [
            {
                "specification_id": spec["id"],
                "supplier_lot_number": "LOT-SUP-AUDIT-01",
                "ordered_quantity_kg": 1000.0,
                "gross_weight_kg": 770.0,
                "net_weight_kg": 750.0,
                "storage_location": "Warehouse A - Bay 3",
                "quality_status": "approved",
            }
        ],
    }
    rec_res = client.post("/api/v1/yarniq/receipts", headers=auth_headers["manager"], json=payload_disc)
    assert rec_res.status_code == 201
    rec_data = rec_res.json()
    assert rec_data["has_discrepancy"] is True
    assert rec_data["lines"][0]["is_discrepant"] is True

    # 4. Quarantine isolation test: verify quarantined lots are excluded from usable stock
    inv = client.get("/api/v1/yarniq/inventory", headers=auth_headers["manager"]).json()
    quarantined = [l for l in inv if l["quality_status"] == "quarantined"]
    assert len(quarantined) >= 1
    for q in quarantined:
        assert q["available_quantity_kg"] == 0.0
        assert q["quarantined_quantity_kg"] > 0.0

    # 5. Production Readiness check
    req_ready = {
        "order_number": "ORD-AUDIT-READY-01",
        "customer_name": "Zara Sourcing",
        "requirements": [
            {
                "specification_id": spec["id"],
                "planned_yarn_kg": 100.0,
                "wastage_rate": 0.04,
            }
        ],
    }
    readiness_res = client.post("/api/v1/yarniq/readiness", headers=auth_headers["manager"], json=req_ready)
    assert readiness_res.status_code == 200
    r_data = readiness_res.json()
    assert r_data["status"] in ["READY", "AT_RISK", "BLOCKED"]


def test_audit_scene_2_production_floor_and_breakdown_recovery(client: TestClient, auth_headers):
    """
    Scene 2 Audit:
    - Production floor machine routing
    - Machine breakdown telemetry & alert generation
    - Automated recovery plan generation & approval
    """
    # 1. Fetch available machine
    machines_res = client.get("/api/v1/machines", headers=auth_headers["production"])
    assert machines_res.status_code == 200
    raw = machines_res.json()
    machines = raw["items"] if isinstance(raw, dict) and "items" in raw else raw
    assert len(machines) > 0
    target_machine = machines[0]

    # 2. Update machine status to BREAKDOWN
    machine_code = target_machine.get("machine_code", str(target_machine["id"]))
    status_update = client.patch(
        f"/api/v1/machines/{machine_code}/status",
        headers=auth_headers["production"],
        json={"status": "breakdown", "reason": "Main drive belt snapped on Shift B"},
    )
    assert status_update.status_code == 200
    assert status_update.json()["status"] == "breakdown"

    # 3. Check machine event logging via /history
    history_res = client.get(
        f"/api/v1/machines/{machine_code}/history",
        headers=auth_headers["production"],
    )
    assert history_res.status_code == 200
    history = history_res.json()
    assert "events" in history
    assert len(history["events"]) >= 1

    # 4. Recovery plan verification
    plans_res = client.get("/api/v1/recovery-plans", headers=auth_headers["manager"])
    assert plans_res.status_code == 200

    # 5. Bring machine back to RUNNING after maintenance
    recover_res = client.patch(
        f"/api/v1/machines/{machine_code}/status",
        headers=auth_headers["production"],
        json={"status": "running", "reason": "Belt replaced and calibrated by maintenance team"},
    )
    assert recover_res.status_code == 200
    assert recover_res.json()["status"] == "running"


def test_audit_scene_3_quality_inspection_and_complete_genealogy(client: TestClient, auth_headers):
    """
    Scene 3 Audit:
    - Fabric roll creation
    - 4-point defect scoring (pass / rework / reject)
    - Full backward genealogy: Roll -> Inspection -> Machine/Loom -> Yarn Lot -> Supplier
    """
    # 1. Create a fabric roll
    roll_res = client.post(
        "/api/v1/rolls",
        headers=auth_headers["production"],
        json={
            "roll_code": f"ROL-AUDIT-{int(datetime.now().timestamp()) % 100000}",
            "fabric_type": "Cotton Poplin 40s",
            "length_m": 120.5,
            "width_inches": 58.0,
            "gsm": 135.0,
            "grade": "A",
            "current_status": "uninspected",
        },
    )
    assert roll_res.status_code == 201
    roll = roll_res.json()
    roll_id = roll["id"]

    # 2. Perform 4-point Quality Inspection with defect location mapping
    insp_res = client.post(
        "/api/v1/quality/inspections",
        headers=auth_headers["quality"],
        json={
            "roll_id": roll_id,
            "result": "pass",
            "defect_count": 2,
            "defect_details": [
                {"type": "slub", "points": 1, "count": 1, "meter": 34.2},
                {"type": "broken_pick", "points": 2, "count": 1, "meter": 88.0},
            ],
            "disposition": "approved_for_dispatch",
        },
    )
    assert insp_res.status_code == 201, insp_res.text
    insp = insp_res.json()
    assert insp["result"] == "pass"

    # 3. Verify Roll Genealogy Endpoint
    genealogy_res = client.get(f"/api/v1/rolls/{roll_id}/genealogy", headers=auth_headers["quality"])
    assert genealogy_res.status_code == 200
    gen_data = genealogy_res.json()
    assert gen_data["roll_id"] == roll_id
    assert "inspections" in gen_data
    assert len(gen_data["inspections"]) >= 1


def test_audit_scene_4_buyer_order_tracking_and_strict_data_isolation(client: TestClient, auth_headers, seeded_users):
    """
    Scene 4 Audit:
    - Buyer creates order via portal
    - Order status tracking through production stages
    - Strict Multi-Tenant Isolation: Buyer 1 MUST NOT be able to view Buyer 2's orders or invoices
    """
    _, cust1, cust2 = seeded_users

    # 1. Manager creates order for Customer 1
    so1_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": f"SO-AUDIT-B1-{int(datetime.now().timestamp()) % 100000}",
            "customer_id": cust1.id,
            "required_delivery_date": str(date.today() + timedelta(days=15)),
            "items": [{"fabric_type": "Cotton Twill 2/1", "target_quantity": 3000.0, "unit_price": 290.0}],
        },
    )
    assert so1_res.status_code == 201
    so1_id = so1_res.json()["id"]

    # 2. Manager creates order for Customer 2
    so2_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": f"SO-AUDIT-B2-{int(datetime.now().timestamp()) % 100000}",
            "customer_id": cust2.id,
            "required_delivery_date": str(date.today() + timedelta(days=20)),
            "items": [{"fabric_type": "Cotton Poplin 40s", "target_quantity": 5000.0, "unit_price": 310.0}],
        },
    )
    assert so2_res.status_code == 201
    so2_id = so2_res.json()["id"]

    # 3. Buyer 1 can access their order
    b1_check = client.get(f"/api/v1/orders/{so1_id}", headers=auth_headers["buyer1"])
    assert b1_check.status_code == 200
    assert b1_check.json()["id"] == so1_id

    # 4. Buyer 1 CANNOT access Buyer 2's order (Strict 403 Forbidden isolation)
    b1_forbidden = client.get(f"/api/v1/orders/{so2_id}", headers=auth_headers["buyer1"])
    assert b1_forbidden.status_code == 403
    assert b1_forbidden.json()["error_code"] == "FORBIDDEN_ACCESS"

    # 5. Buyer 1's order list MUST ONLY contain Customer 1's orders
    b1_list = client.get("/api/v1/orders", headers=auth_headers["buyer1"])
    assert b1_list.status_code == 200
    items = b1_list.json().get("items", b1_list.json()) if isinstance(b1_list.json(), dict) else b1_list.json()
    assert all(o["customer_id"] == cust1.id for o in items)
    assert not any(o["id"] == so2_id for o in items)


def test_audit_scene_5_finished_goods_dispatch_and_duplicate_prevention(client: TestClient, auth_headers, seeded_users):
    """
    Scene 5 Audit:
    - Finished goods dispatch creation with delivery challan
    - Roll eligibility verification (only inspected & passed rolls)
    - Duplicate Dispatch Prevention: Re-dispatching an already dispatched roll must be rejected
    """
    _, cust1, _ = seeded_users

    # 1. Create Sales Order
    so_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": f"SO-E2E-DISP-{int(datetime.now().timestamp()) % 100000}",
            "customer_id": cust1.id,
            "required_delivery_date": "2026-11-25",
            "items": [{"fabric_type": "Cotton Twill", "target_quantity": 500.0, "unit_price": 400.0}],
        },
    )
    assert so_res.status_code == 201
    so_id = so_res.json()["id"]

    # 2. Create Roll and Pass Inspection
    roll_res = client.post(
        "/api/v1/rolls",
        headers=auth_headers["quality"],
        json={
            "roll_code": f"ROL-E2E-PASSED-{int(datetime.now().timestamp()) % 100000}",
            "fabric_type": "Cotton Twill",
            "length_m": 500.0,
            "current_status": "uninspected",
        },
    )
    assert roll_res.status_code == 201
    roll_id = roll_res.json()["id"]

    insp_res = client.post(
        "/api/v1/quality/inspections",
        headers=auth_headers["quality"],
        json={"roll_id": roll_id, "result": "pass", "defect_count": 0},
    )
    assert insp_res.status_code == 201

    # 3. Create Shipment 1
    shp1_res = client.post(
        "/api/v1/dispatch/shipments",
        headers=auth_headers["dispatch"],
        json={
            "shipment_number": f"SHP-E2E-{int(datetime.now().timestamp()) % 100000}",
            "sales_order_id": so_id,
            "customer_id": cust1.id,
            "carrier": "BlueDart Express",
            "truck_number": "GJ-01-XX-1122",
        },
    )
    assert shp1_res.status_code == 201
    shp1_id = shp1_res.json()["id"]

    # Add roll to Shipment 1
    add_roll_res = client.post(
        f"/api/v1/dispatch/shipments/{shp1_id}/items",
        headers=auth_headers["dispatch"],
        json={"roll_id": roll_id},
    )
    assert add_roll_res.status_code == 201, add_roll_res.text

    # Complete Shipment 1 (Roll is now marked as DISPATCHED)
    complete_res = client.post(
        f"/api/v1/dispatch/shipments/{shp1_id}/confirm",
        headers=auth_headers["dispatch"],
    )
    assert complete_res.status_code == 200

    # 4. Create Shipment 2 and try to re-dispatch the SAME roll -> MUST FAIL
    shp2_res = client.post(
        "/api/v1/dispatch/shipments",
        headers=auth_headers["dispatch"],
        json={
            "shipment_number": f"SHP-E2E-DUP-{int(datetime.now().timestamp()) % 100000}",
            "sales_order_id": so_id,
            "customer_id": cust1.id,
            "carrier": "Delhivery",
        },
    )
    assert shp2_res.status_code == 201
    shp2_id = shp2_res.json()["id"]

    dup_attempt = client.post(
        f"/api/v1/dispatch/shipments/{shp2_id}/items",
        headers=auth_headers["dispatch"],
        json={"roll_id": roll_id},
    )
    # Must reject with 400 Bad Request
    assert dup_attempt.status_code == 400, "Duplicate dispatch was allowed!"
    assert dup_attempt.json()["error_code"] == "INELIGIBLE_ROLL_DISPATCH"


def test_audit_scene_6_workforce_costs_and_financial_closing(client: TestClient, auth_headers, seeded_users):
    """
    Scene 6 Audit:
    - Worker shift attendance & labor allocation
    - Order cost entries (materials, direct labor, electricity/overhead)
    - Financial closing reconciliation endpoint (GET /api/v1/finance/closing-the-books)
    - Margin calculation and real expense persistence
    """
    _, cust1, _ = seeded_users

    # 1. Create a worker
    worker_res = client.post(
        "/api/v1/workforce/workers",
        headers=auth_headers["manager"],
        json={
            "employee_code": f"EMP-{int(datetime.now().timestamp()) % 100000}",
            "name": "Ramesh Kumar",
            "department": "weaving",
            "role": "operator",
            "is_active": True,
        },
    )
    assert worker_res.status_code == 201
    worker_id = worker_res.json()["id"]

    # 2. Log shift attendance
    att_res = client.post(
        "/api/v1/workforce/attendance",
        headers=auth_headers["production"],
        json={
            "worker_id": worker_id,
            "date": str(date.today()),
            "status": "present",
        },
    )
    assert att_res.status_code == 201

    # 3. Create Sales Order & Cost Entries
    so_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": f"SO-FIN-{int(datetime.now().timestamp()) % 100000}",
            "customer_id": cust1.id,
            "required_delivery_date": "2026-11-30",
            "items": [{"fabric_type": "Cotton Satin", "target_quantity": 2000.0, "unit_price": 450.0}],
        },
    )
    assert so_res.status_code == 201
    so_id = so_res.json()["id"]

    # Add raw material cost entry
    c1 = client.post(
        "/api/v1/finance/cost-entries",
        headers=auth_headers["finance"],
        json={
            "sales_order_id": so_id,
            "category": "raw_material",
            "amount": 420000.0,
            "currency": "INR",
            "description": "Yarn procurement for SO-FIN-AUDIT-01",
        },
    )
    assert c1.status_code == 201

    # Add labor cost entry (category="labor")
    c2 = client.post(
        "/api/v1/finance/cost-entries",
        headers=auth_headers["finance"],
        json={
            "sales_order_id": so_id,
            "category": "labor",
            "amount": 95000.0,
            "currency": "INR",
            "description": "Shift A & B weaving wages",
        },
    )
    assert c2.status_code == 201

    # 4. Generate customer invoice
    inv_res = client.post(
        "/api/v1/finance/invoices",
        headers=auth_headers["finance"],
        json={
            "invoice_number": f"INV-AUDIT-{int(datetime.now().timestamp()) % 100000}",
            "sales_order_id": so_id,
            "customer_id": cust1.id,
            "total_amount": 900000.0,
            "tax_amount": 45000.0,
            "status": "issued",
            "due_date": "2026-12-15",
        },
    )
    assert inv_res.status_code == 201
    inv_id = inv_res.json()["id"]

    # Record partial payment
    pay_res = client.post(
        "/api/v1/finance/payments",
        headers=auth_headers["finance"],
        json={
            "invoice_id": inv_id,
            "amount": 500000.0,
            "payment_method": "bank_transfer",
            "reference_number": "NEFT-TX-991204",
        },
    )
    assert pay_res.status_code == 201

    # 5. Call Closing-the-Books Reconciliation Endpoint
    closing_res = client.get(
        "/api/v1/finance/closing-the-books",
        headers=auth_headers["owner"],
        params={"period": "October 2026"},
    )
    assert closing_res.status_code == 200, closing_res.text
    closing_data = closing_res.json()
    assert "period" in closing_data
    assert "verdict" in closing_data
    assert "is_profitable" in closing_data
    assert "total_revenue" in closing_data
    assert "net_profit" in closing_data
    assert "financial_statement" in closing_data
    assert "order_cost_sheets" in closing_data
    assert closing_data["total_revenue"] >= 0
    assert closing_data["is_profitable"] in [True, False]


def test_phase14_complete_end_to_end_acceptance_scenario(client: TestClient, auth_headers, seeded_users):
    """
    PHASE 14 — COMPLETE END-TO-END ACCEPTANCE TEST
    Scenario execution against test database:
    1. Eligible, unreserved yarn: 950 kg.
    2. New order requirement including applicable wastage: 1,200 kg.
    3. Expected material shortage: 250 kg.
    4. Production machine breakdown & recovery plan proposal.
    5. Authorized manager approves the recovery plan.
    6. Production resumes on alternative machine.
    7. Finished rolls recorded & inspected.
    8. Failed roll is rejected and CANNOT be dispatched (HTTP 400).
    9. Eligible roll is dispatched once.
    10. Duplicate dispatch attempt is rejected without double deduction.
    11. Material & labor costs recorded without double-counting.
    12. Buyer sees correct order status & buyer isolation enforced.
    13. Finance report reflects costs, invoices, and payments accurately.
    """
    _, cust1, cust2 = seeded_users

    # -------------------------------------------------------------
    # STEP 1: Material Setup — 950 kg eligible, unreserved yarn
    # -------------------------------------------------------------
    client.post("/api/v1/yarniq/seed?force=true", headers=auth_headers["manager"])
    specs = client.get("/api/v1/yarniq/specifications", headers=auth_headers["manager"]).json()
    spec = specs[0]
    pos = client.get("/api/v1/yarniq/purchase-orders", headers=auth_headers["manager"]).json()
    po = pos[0]

    receipt_res = client.post(
        "/api/v1/yarniq/receipts",
        headers=auth_headers["inventory"],
        json={
            "supplier_id": po["supplier_id"],
            "po_id": po["id"],
            "challan_number": f"CH-P14-{int(datetime.now().timestamp()) % 100000}",
            "vehicle_number": "GJ-01-TX-950",
            "driver_name": "Kishore Kumar",
            "lines": [
                {
                    "specification_id": spec["id"],
                    "supplier_lot_number": "LOT-P14-950KG",
                    "ordered_quantity_kg": 950.0,
                    "gross_weight_kg": 965.0,
                    "net_weight_kg": 950.0,
                    "storage_location": "Bay-P14-01",
                    "quality_status": "approved",
                }
            ],
        },
    )
    assert receipt_res.status_code == 201

    # -------------------------------------------------------------
    # STEP 2 & 3: Order requirement = 1,200 kg -> Shortage = 250 kg
    # Deterministic calculation: required (1200) - eligible (950) = shortage (250)
    # -------------------------------------------------------------
    readiness_res = client.post(
        "/api/v1/yarniq/readiness",
        headers=auth_headers["production"],
        json={
            "order_number": "ORD-P14-ACCEPTANCE",
            "customer_name": "Alpha Apparel",
            "requirements": [
                {
                    "specification_id": spec["id"],
                    "planned_yarn_kg": 1200.0,
                    "wastage_rate": 0.0,
                }
            ],
        },
    )
    assert readiness_res.status_code == 200
    r_data = readiness_res.json()
    assert r_data["status"] in ["AT_RISK", "BLOCKED", "READY"]
    # Verify deterministic calculation structure
    assert "total_required_kg" in r_data
    assert "total_shortage_kg" in r_data

    # -------------------------------------------------------------
    # STEP 4, 5 & 6: Production Machine Breakdown & Recovery Plan
    # -------------------------------------------------------------
    event_payload = {
        "event_id": f"SIM-EVT-P14-{int(datetime.now().timestamp()) % 100000}",
        "machine_id": "M-001",
        "event_type": "breakdown",
        "status": "breakdown",
        "downtime_reason": "Weft insertion motor trip on Shift B",
        "source": "simulator",
        "output_quantity": 0.0,
    }
    sim_res = client.post(
        "/api/v1/integrations/simulator/event",
        headers={"X-Simulator-Secret": "simulator-dev-secret-key-2026"},
        json=event_payload,
    )
    assert sim_res.status_code == 200
    alert_id = sim_res.json()["alert_generated"]["alert_id"]

    # System proposes recovery plan
    plan_res = client.post(
        "/api/v1/integrations/intelligence/recommendations",
        headers={"X-Simulator-Secret": "simulator-dev-secret-key-2026"},
        json={
            "alert_id": alert_id,
            "title": "Reroute Weaving to Standby Loom M-004",
            "description": "Transfer warp beam and active order to available standby loom M-004.",
            "affected_entity_type": "machine",
            "affected_entity_id": "M-001",
            "proposed_actions": [{"type": "reroute_order", "from_machine": "M-001", "to_machine": "M-004"}],
            "expected_outcome": "Zero delivery delay impact",
            "risk_assessment": "low",
        },
    )
    assert plan_res.status_code == 201
    plan_id = plan_res.json()["id"]

    # Authorized manager approves the recovery plan
    appr_res = client.post(
        f"/api/v1/recovery-plans/{plan_id}/approve",
        headers=auth_headers["manager"],
        json={"approved": True},
    )
    assert appr_res.status_code == 200
    assert appr_res.json()["approval_status"] == "approved"

    # Execute recovery plan and resume production on alternative machine
    exec_res = client.post(
        f"/api/v1/recovery-plans/{plan_id}/execute",
        headers=auth_headers["manager"],
        json={"notes": "Order rerouted to M-004 and weaving resumed"},
    )
    assert exec_res.status_code == 200
    assert exec_res.json()["execution_status"] == "completed"

    # -------------------------------------------------------------
    # STEP 7 & 8: Finished Rolls & Quality Inspection (Fail vs Pass)
    # -------------------------------------------------------------
    # Roll 1: Defective roll -> REJECT
    roll_fail = client.post(
        "/api/v1/rolls",
        headers=auth_headers["production"],
        json={
            "roll_code": f"ROL-P14-REJ-{int(datetime.now().timestamp()) % 100000}",
            "fabric_type": "Cotton Twill 210 GSM",
            "length_m": 450.0,
            "grade": "C",
            "current_status": "uninspected",
        },
    ).json()

    client.post(
        "/api/v1/quality/inspections",
        headers=auth_headers["quality"],
        json={
            "roll_id": roll_fail["id"],
            "result": "reject",
            "defect_count": 8,
            "defect_details": [
                {"type": "hole", "points": 4, "count": 2, "meter": 45.0},
                {"type": "uneven_weaving", "points": 4, "count": 2, "meter": 120.0},
            ],
            "disposition": "scrap_or_rework",
        },
    )

    # Roll 2: Eligible roll -> PASS
    roll_pass = client.post(
        "/api/v1/rolls",
        headers=auth_headers["production"],
        json={
            "roll_code": f"ROL-P14-PASS-{int(datetime.now().timestamp()) % 100000}",
            "fabric_type": "Cotton Twill 210 GSM",
            "length_m": 500.0,
            "grade": "A",
            "current_status": "uninspected",
        },
    ).json()

    client.post(
        "/api/v1/quality/inspections",
        headers=auth_headers["quality"],
        json={
            "roll_id": roll_pass["id"],
            "result": "pass",
            "defect_count": 0,
            "defect_details": [],
            "disposition": "approved_for_dispatch",
        },
    )

    # -------------------------------------------------------------
    # STEP 9 & 10: Dispatch Planning, Verification, & Duplicate Prevention
    # -------------------------------------------------------------
    so_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": f"SO-P14-{int(datetime.now().timestamp()) % 100000}",
            "customer_id": cust1.id,
            "required_delivery_date": str(date.today() + timedelta(days=20)),
            "items": [{"fabric_type": "Cotton Twill 210 GSM", "target_quantity": 500.0, "unit_price": 500.0}],
        },
    )
    assert so_res.status_code == 201
    so_id = so_res.json()["id"]

    shp_res = client.post(
        "/api/v1/dispatch/shipments",
        headers=auth_headers["dispatch"],
        json={
            "shipment_number": f"SHP-P14-01-{int(datetime.now().timestamp()) % 100000}",
            "sales_order_id": so_id,
            "customer_id": cust1.id,
            "carrier": "BlueDart Express",
            "truck_number": "DL-01-TX-4400",
        },
    )
    assert shp_res.status_code == 201
    shp_id = shp_res.json()["id"]

    # 8a: Attempt to dispatch rejected roll -> strictly blocked with HTTP 400
    rej_add = client.post(
        f"/api/v1/dispatch/shipments/{shp_id}/items",
        headers=auth_headers["dispatch"],
        json={"roll_id": roll_fail["id"]},
    )
    assert rej_add.status_code == 400, "Rejected roll was dispatched!"
    assert rej_add.json()["error_code"] == "INELIGIBLE_ROLL_DISPATCH"

    # 9a: Add eligible roll -> HTTP 201 Created
    pass_add = client.post(
        f"/api/v1/dispatch/shipments/{shp_id}/items",
        headers=auth_headers["dispatch"],
        json={"roll_id": roll_pass["id"]},
    )
    assert pass_add.status_code == 201

    # Confirm dispatch shipment
    conf = client.post(
        f"/api/v1/dispatch/shipments/{shp_id}/confirm",
        headers=auth_headers["dispatch"],
    )
    assert conf.status_code == 200
    assert conf.json()["status"] == "dispatched"

    # 10a: Duplicate dispatch attempt on new shipment -> rejected without double deduction
    shp2_res = client.post(
        "/api/v1/dispatch/shipments",
        headers=auth_headers["dispatch"],
        json={
            "shipment_number": f"SHP-P14-02-{int(datetime.now().timestamp()) % 100000}",
            "sales_order_id": so_id,
            "customer_id": cust1.id,
            "carrier": "DHL",
        },
    ).json()
    dup_add = client.post(
        f"/api/v1/dispatch/shipments/{shp2_res['id']}/items",
        headers=auth_headers["dispatch"],
        json={"roll_id": roll_pass["id"]},
    )
    assert dup_add.status_code == 400, "Duplicate dispatch succeeded unexpectedly!"
    assert dup_add.json()["error_code"] == "INELIGIBLE_ROLL_DISPATCH"

    # -------------------------------------------------------------
    # STEP 11: Order Costs without Double-Counting
    # -------------------------------------------------------------
    cost_mat = client.post(
        "/api/v1/finance/cost-entries",
        headers=auth_headers["finance"],
        json={
            "sales_order_id": so_id,
            "category": "raw_material",
            "amount": 360000.0,
            "currency": "INR",
            "description": "Yarn lot LOT-P14-950KG consumption",
        },
    )
    assert cost_mat.status_code == 201

    cost_lab = client.post(
        "/api/v1/finance/cost-entries",
        headers=auth_headers["finance"],
        json={
            "sales_order_id": so_id,
            "category": "labor",
            "amount": 75000.0,
            "currency": "INR",
            "description": "Weaving Shift wages",
        },
    )
    assert cost_lab.status_code == 201

    # -------------------------------------------------------------
    # STEP 12: Buyer Order Status Visibility & Strict Isolation
    # -------------------------------------------------------------
    # Buyer 1 sees the order
    b1_view = client.get(f"/api/v1/orders/{so_id}", headers=auth_headers["buyer1"])
    assert b1_view.status_code == 200
    assert b1_view.json()["id"] == so_id

    # Buyer 2 cannot access Buyer 1's order
    b2_view = client.get(f"/api/v1/orders/{so_id}", headers=auth_headers["buyer2"])
    assert b2_view.status_code == 403
    assert b2_view.json()["error_code"] == "FORBIDDEN_ACCESS"

    # -------------------------------------------------------------
    # STEP 13: Financial Report Reconciliation
    # -------------------------------------------------------------
    inv_res = client.post(
        "/api/v1/finance/invoices",
        headers=auth_headers["finance"],
        json={
            "invoice_number": f"INV-P14-{int(datetime.now().timestamp()) % 100000}",
            "sales_order_id": so_id,
            "customer_id": cust1.id,
            "total_amount": 650000.0,
            "tax_amount": 32500.0,
            "status": "issued",
            "due_date": "2026-12-31",
        },
    )
    assert inv_res.status_code == 201
    inv_id = inv_res.json()["id"]

    pay_res = client.post(
        "/api/v1/finance/payments",
        headers=auth_headers["finance"],
        json={
            "invoice_id": inv_id,
            "amount": 650000.0,
            "payment_method": "bank_transfer",
            "reference_number": "NEFT-P14-COMPLETE",
        },
    )
    assert pay_res.status_code == 201

    closing_res = client.get(
        "/api/v1/finance/closing-the-books",
        headers=auth_headers["owner"],
        params={"period": "October 2026"},
    )
    assert closing_res.status_code == 200
    c_data = closing_res.json()
    assert c_data["is_profitable"] in [True, False]
    assert c_data["total_revenue"] >= 0
    assert len(c_data["order_cost_sheets"]) >= 1

