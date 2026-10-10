"""
Comprehensive Tests for Standard OEE and Credential / Seeding Security
Covers:
1. Seed Script Safety & Idempotency (Password hash preservation, role preservation, deactivated status preservation)
2. Production Configuration Rejection of Unsafe Demo Settings
3. User Registration RBAC & Privilege Escalation Prevention
4. Standard OEE Calculation (Availability, Performance, Quality, Overlapping Downtime Merging, Rework Exclusion, Plant Aggregation)
5. Insufficient Data Diagnostics (No planned time, no runtime, missing standards, missing quality records)
6. System Mode API (Live Factory vs Demo Factory, Demo Reset & Seed)
"""

from datetime import datetime, timedelta, timezone
import pytest
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, UserRole
from app.models.production import Machine, MachineEvent, ProductionEvent, MachineStatus, ProcessType, DataSourceType, ProductionOrder
from app.models.quality import FabricRoll, QualityInspection, InspectionResult, RollStatus, RollGrade
from app.services.oee_service import (
    merge_downtime_intervals,
    calculate_machine_oee,
    calculate_plant_oee,
)
from app.db.seed import seed_database


def test_seed_idempotency_preserves_passwords_and_roles(db: Session):
    """Verify that re-running the seed script never overwrites passwords, roles, or re-activates disabled users."""
    test_email = "custom_manager@everest.com"
    initial_user = db.query(User).filter(User.email == test_email).first()
    if initial_user:
        db.delete(initial_user)
        db.commit()

    # Create user with a specific custom password hash and deactivated state
    custom_hash = get_password_hash("MySecretCustomPassword#2026")
    user = User(
        email=test_email,
        name="Custom Manager",
        password_hash=custom_hash,
        role=UserRole.MANAGER,
        is_active=False, # Disabled account
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    orig_hash = user.password_hash
    orig_role = user.role
    orig_active = user.is_active

    # Re-run database seeding
    seed_database(db)

    # Check user state after seeding
    refreshed_user = db.query(User).filter(User.email == test_email).first()
    assert refreshed_user is not None
    assert refreshed_user.password_hash == orig_hash
    assert refreshed_user.role == orig_role
    assert refreshed_user.is_active == orig_active, "Deactivated account was silently re-enabled!"
    assert verify_password("MySecretCustomPassword#2026", refreshed_user.password_hash)


def test_production_rejects_demo_seed_when_disallowed(monkeypatch, db: Session):
    """Verify that seed_database raises RuntimeError if executed in production without explicit permission."""
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ALLOW_DEMO_SEED", False)

    with pytest.raises(RuntimeError, match="Demo database seeding is disabled in production"):
        seed_database(db)


def test_user_registration_privilege_escalation_prevented(client: TestClient, seeded_users, auth_headers):
    """Test that an unauthenticated user or normal manager cannot create an Owner account."""
    # Attempt unauthenticated registration when system already has users
    res_unauth = client.post(
        "/api/v1/auth/register",
        json={
            "email": "hacker@test.com",
            "name": "Hacker",
            "password": "Password123!",
            "role": "owner",
            "is_active": True,
        },
    )
    assert res_unauth.status_code == 401, f"Unauthenticated registration should fail: {res_unauth.text}"

    # Manager attempting to create an Owner account must be rejected
    res_owner_attempt = client.post(
        "/api/v1/auth/register",
        json={
            "email": "escalated_owner@test.com",
            "name": "Escalated Owner",
            "password": "Password123!",
            "role": "owner",
            "is_active": True,
        },
        headers=auth_headers["manager"],
    )
    assert res_owner_attempt.status_code == 403, "Manager was able to create Owner account!"


def test_merge_overlapping_downtime_intervals():
    """Verify downtime interval merging prevents double-counting."""
    base = datetime(2026, 10, 10, 8, 0, 0, tzinfo=timezone.utc)
    
    # Overlapping intervals:
    # 08:00 - 08:30 (30 min)
    # 08:15 - 08:45 (30 min) -> together spans 08:00 - 08:45 (45 min, not 60 min!)
    # 09:00 - 09:20 (20 min) -> separate
    intervals = [
        (base, base + timedelta(minutes=30)),
        (base + timedelta(minutes=15), base + timedelta(minutes=45)),
        (base + timedelta(minutes=60), base + timedelta(minutes=80)),
    ]
    total_minutes = merge_downtime_intervals(intervals)
    assert total_minutes == 65.0, f"Expected 65.0 minutes, got {total_minutes}"

    # Reversed interval (invalid start >= end) ignored
    invalid_intervals = [
        (base + timedelta(minutes=30), base),
    ]
    assert merge_downtime_intervals(invalid_intervals) == 0.0


def test_standard_oee_perfect_shift(db: Session):
    """Test standard OEE with 100% Availability, 100% Performance, and 100% Quality."""
    now = datetime.now(timezone.utc)
    start_t = now - timedelta(hours=8)
    end_t = now

    po = ProductionOrder(
        production_order_number="PO-TEST-PERFECT-01",
        target_quantity=1000.0,
        unit="m",
    )
    db.add(po)
    db.flush()

    machine = Machine(
        machine_code="TEST-PERFECT-01",
        name="Perfect Loom",
        process_type=ProcessType.WEAVING,
        status=MachineStatus.RUNNING,
        active_production_order_id=po.id,
        rated_speed_mpm=1.6, # 1.6 meters per minute
        shift_output_m=768.0, # 480 min * 1.6 m/min = 768.0 meters
        data_source=DataSourceType.MANUAL,
    )
    db.add(machine)
    db.flush()

    # Add passing roll inspected in this shift
    roll = FabricRoll(
        roll_code="ROLL-PERFECT-01",
        production_order_id=po.id,
        fabric_type="Cotton Poplin",
        length_m=768.0,
        current_status=RollStatus.PASS,
        grade=RollGrade.GRADE_A,
    )
    db.add(roll)
    db.flush()

    insp = QualityInspection(
        roll_id=roll.id,
        inspection_date=start_t + timedelta(hours=4),
        result=InspectionResult.PASS,
        defect_count=0,
    )
    db.add(insp)
    db.commit()

    # 480 planned minutes, 0 downtime -> runtime = 480.0
    res = calculate_machine_oee(db, machine, start_t, end_t, planned_minutes=480.0)
    assert res.calculation_status == "valid"
    assert res.availability == 1.0
    assert res.performance == 1.0 # 768.0 / (1.6 * 480.0) = 1.0
    assert res.quality == 1.0 # 768 / 768 = 1.0
    assert res.oee == 1.0
    assert res.oee_percentage == 100.0


def test_standard_oee_shift_with_downtime_and_speed_loss(db: Session):
    """Test standard OEE with recorded downtime and speed degradation."""
    now = datetime.now(timezone.utc)
    start_t = now - timedelta(hours=8)
    end_t = now

    po = ProductionOrder(
        production_order_number="PO-TEST-DOWNTIME-02",
        target_quantity=1000.0,
        unit="m",
    )
    db.add(po)
    db.flush()

    machine = Machine(
        machine_code="TEST-DOWNTIME-02",
        name="Downtime Loom",
        process_type=ProcessType.WEAVING,
        status=MachineStatus.RUNNING,
        active_production_order_id=po.id,
        rated_speed_mpm=2.0, # 2.0 m/min
        shift_output_m=600.0,
        data_source=DataSourceType.MANUAL,
    )
    db.add(machine)
    db.flush()

    # Record 120 minutes of downtime (08:00 to 10:00)
    ev = MachineEvent(
        event_id="test-dt-ev-1",
        machine_id=machine.id,
        event_type="downtime_start",
        start_time=start_t,
        end_time=start_t + timedelta(minutes=120),
        downtime_reason="Motor belt inspection",
    )
    db.add(ev)

    # Add passing roll inspected in this shift
    roll = FabricRoll(
        roll_code="ROLL-DOWNTIME-01",
        production_order_id=po.id,
        fabric_type="Cotton Poplin",
        length_m=600.0,
        current_status=RollStatus.PASS,
        grade=RollGrade.GRADE_A,
    )
    db.add(roll)
    db.flush()

    insp = QualityInspection(
        roll_id=roll.id,
        inspection_date=start_t + timedelta(hours=6),
        result=InspectionResult.PASS,
        defect_count=1,
    )
    db.add(insp)
    db.commit()

    # Planned: 480 min. Downtime: 120 min. Runtime: 360 min.
    # Availability = 360 / 480 = 0.75
    # Expected output = 2.0 m/min * 360 min = 720.0 meters.
    # Actual output = 600.0 meters.
    # Performance = 600 / 720 = 0.8333
    # Quality = 1.0 (no defects)
    # Expected OEE = 0.75 * 0.8333 * 1.0 = 0.625
    res = calculate_machine_oee(db, machine, start_t, end_t, planned_minutes=480.0)
    assert res.availability == 0.75
    assert res.downtime_minutes == 120.0
    assert res.runtime_minutes == 360.0
    assert res.performance == 0.8333
    assert res.quality == 1.0
    assert res.oee == 0.625
    assert res.oee_percentage == 62.5


def test_standard_oee_rework_exclusion_from_first_pass(db: Session):
    """Test that rolls requiring rework are strictly excluded from First-Pass Good Output."""
    now = datetime.now(timezone.utc)
    start_t = now - timedelta(hours=8)
    end_t = now

    order = ProductionOrder(
        production_order_number="PO-TEST-REWORK-01",
        target_quantity=2000.0,
        unit="m",
    )
    db.add(order)
    db.flush()

    machine = Machine(
        machine_code="TEST-REWORK-LOOM",
        name="Rework Test Loom",
        process_type=ProcessType.WEAVING,
        status=MachineStatus.RUNNING,
        active_production_order_id=order.id,
        rated_speed_mpm=1.0,
        shift_output_m=480.0,
        data_source=DataSourceType.MANUAL,
    )
    db.add(machine)
    db.flush()

    # Create 2 rolls of 200m each (Total = 400m)
    # Roll 1: First inspection = PASS (200m good)
    roll1 = FabricRoll(
        roll_code="ROLL-QC-PASS",
        production_order_id=order.id,
        fabric_type="Cotton Twill",
        length_m=200.0,
        current_status=RollStatus.PASS,
        grade=RollGrade.GRADE_A,
    )
    db.add(roll1)
    db.flush()

    insp1 = QualityInspection(
        roll_id=roll1.id,
        inspection_date=start_t + timedelta(hours=2),
        result=InspectionResult.PASS,
        defect_count=1,
    )
    db.add(insp1)

    # Roll 2: First inspection = REWORK, then later re-inspected to PASS
    # CRITICAL DOMAIN RULE: Must NOT count as First-Pass Good!
    roll2 = FabricRoll(
        roll_code="ROLL-QC-REWORK",
        production_order_id=order.id,
        fabric_type="Cotton Twill",
        length_m=200.0,
        current_status=RollStatus.PASS,
        grade=RollGrade.GRADE_A,
    )
    db.add(roll2)
    db.flush()

    # 1st inspection failed with REWORK
    insp2_initial = QualityInspection(
        roll_id=roll2.id,
        inspection_date=start_t + timedelta(hours=3),
        result=InspectionResult.REWORK,
        defect_count=8,
    )
    db.add(insp2_initial)

    # 2nd inspection passed after mending
    insp2_recheck = QualityInspection(
        roll_id=roll2.id,
        inspection_date=start_t + timedelta(hours=5),
        result=InspectionResult.PASS,
        defect_count=2,
    )
    db.add(insp2_recheck)
    db.commit()

    # Total inspected = 400m. First-pass good = 200m (roll1 only!).
    # First-pass Quality = 200 / 400 = 0.50 (50%).
    res = calculate_machine_oee(db, machine, start_t, end_t, planned_minutes=480.0)
    assert res.total_inspected_meters == 400.0
    assert res.first_pass_good_meters == 200.0
    assert res.quality == 0.50, f"Expected 0.50 first-pass quality, got {res.quality}"


def test_standard_oee_insufficient_data_diagnostics(db: Session):
    """Test that missing machine standards or zero planned time returns insufficient_data rather than inventing numbers."""
    now = datetime.now(timezone.utc)
    start_t = now - timedelta(hours=8)
    end_t = now

    # Machine with no rated speed configured (explicit None)
    machine_no_std = Machine(
        machine_code="TEST-NO-STANDARD",
        name="Standardless Machine",
        process_type=ProcessType.WEAVING,
        status=MachineStatus.RUNNING,
        rated_speed_mpm=None, # Missing standard
        shift_output_m=300.0,
        data_source=DataSourceType.MANUAL,
    )
    db.add(machine_no_std)
    db.commit()

    res = calculate_machine_oee(db, machine_no_std, start_t, end_t, planned_minutes=480.0)
    assert res.calculation_status == "insufficient_data"
    assert res.performance is None
    assert any("rated speed" in r.lower() for r in res.missing_reasons)

    # Machine with 0 planned production time
    res_no_time = calculate_machine_oee(db, machine_no_std, start_t, end_t, planned_minutes=0.0)
    assert res_no_time.calculation_status == "no_planned_time"
    assert res_no_time.availability is None


def test_plant_oee_aggregation_endpoint(client: TestClient, seeded_users, auth_headers):
    """Test GET /api/v1/production/oee returns valid plant aggregation response."""
    res = client.get("/api/v1/production/oee", headers=auth_headers["manager"])
    assert res.status_code == 200
    data = res.json()
    assert "availability" in data
    assert "performance" in data
    assert "quality" in data
    assert "oee" in data
    assert "machine_breakdowns" in data
    assert "data_completeness_pct" in data


def test_system_mode_and_demo_seed_reset_endpoints(client: TestClient, seeded_users, auth_headers):
    """Test GET /system/mode, POST /system/demo-seed and POST /system/demo-reset."""
    # System mode check
    res_mode = client.get("/api/v1/system/mode")
    assert res_mode.status_code == 200
    data = res_mode.json()
    assert "mode" in data
    assert "is_demo" in data
    assert "counts" in data

    # Reset demo transactions
    res_reset = client.post("/api/v1/system/demo-reset", headers=auth_headers["owner"])
    assert res_reset.status_code == 200
    assert res_reset.json()["mode"] == "live"

    # Verify mode is now live
    res_mode2 = client.get("/api/v1/system/mode")
    assert res_mode2.json()["mode"] == "live"
    assert res_mode2.json()["counts"]["sales_orders"] == 0

    # Demo seed repopulates cleanly
    res_seed = client.post("/api/v1/system/demo-seed", headers=auth_headers["owner"])
    assert res_seed.status_code == 200
    assert res_seed.json()["mode"] == "demo"
