from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.models.production import (
    Machine,
    ProductionOrder,
    MachineEvent,
    ProductionEvent,
    MachineStatus,
    DataSourceType,
)
from app.models.alert import (
    Alert,
    AlertCategory,
    AlertSeverity,
    AlertStatus,
)
from app.schemas.simulator import (
    SimulatorEventPayload,
    SimulatorBatchPayload,
    SimulatorIngestionResult,
    SimulatorIngestionResponse,
)


def ingest_simulator_event(db: Session, event_payload: SimulatorEventPayload) -> SimulatorIngestionResult:
    """Ingest, validate, persist, and trigger operational side-effects for a simulator telemetry event."""
    # 1. Idempotency Check
    existing_machine_event = db.query(MachineEvent).filter(MachineEvent.event_id == event_payload.event_id).first()
    existing_prod_event = db.query(ProductionEvent).filter(ProductionEvent.event_id == event_payload.event_id).first()
    
    if existing_machine_event or existing_prod_event:
        return SimulatorIngestionResult(
            event_id=event_payload.event_id,
            status="duplicate_skipped",
            message="Event with this ID has already been ingested. Skipped idempotently.",
        )

    # 2. Locate Machine
    machine = None
    if event_payload.machine_id.isdigit():
        machine = db.query(Machine).filter(Machine.id == int(event_payload.machine_id)).first()
    if not machine:
        machine = db.query(Machine).filter(Machine.machine_code == event_payload.machine_id).first()
        
    if not machine:
        return SimulatorIngestionResult(
            event_id=event_payload.event_id,
            status="error",
            message=f"Machine with ID/Code '{event_payload.machine_id}' was not found in factory registry.",
        )

    # 3. Locate Linked Production Order if provided
    po = None
    if event_payload.production_order_id:
        if event_payload.production_order_id.isdigit():
            po = db.query(ProductionOrder).filter(ProductionOrder.id == int(event_payload.production_order_id)).first()
        if not po:
            po = db.query(ProductionOrder).filter(ProductionOrder.production_order_number == event_payload.production_order_id).first()

    # 4. Update Machine State
    now = datetime.now(timezone.utc)
    machine.last_heartbeat = event_payload.timestamp or now
    
    # Process Status and Speed
    if event_payload.status:
        st = event_payload.status.lower()
        if st in [s.value for s in MachineStatus]:
            machine.status = MachineStatus(st)
        elif st == "breakdown":
            machine.status = MachineStatus.BREAKDOWN
        elif st == "down" or st == "stopped":
            machine.status = MachineStatus.STOPPED

    if event_payload.current_speed_rpm is not None:
        machine.current_speed_rpm = event_payload.current_speed_rpm
        
    if event_payload.downtime_reason:
        machine.downtime_reason = event_payload.downtime_reason
    elif machine.status == MachineStatus.RUNNING:
        machine.downtime_reason = None

    if po:
        machine.active_production_order_id = po.id

    # 5. Persist Machine Event
    m_event = MachineEvent(
        event_id=event_payload.event_id,
        machine_id=machine.id,
        production_order_id=po.id if po else machine.active_production_order_id,
        event_type=event_payload.event_type,
        start_time=event_payload.timestamp or now,
        downtime_reason=event_payload.downtime_reason,
        data_source=DataSourceType.SIMULATOR,
        details=event_payload.details,
    )
    db.add(m_event)

    # 6. Process Output Quantity
    prod_event = None
    if event_payload.output_quantity and event_payload.output_quantity > 0:
        machine.shift_output_m += event_payload.output_quantity
        
        if po:
            po.completed_quantity += event_payload.output_quantity
            prod_event_id = f"PE-{event_payload.event_id}"
            prod_event = ProductionEvent(
                event_id=prod_event_id,
                production_order_id=po.id,
                machine_id=machine.id,
                event_type="meterage_output",
                quantity=event_payload.output_quantity,
                unit=event_payload.unit or "m",
                event_timestamp=event_payload.timestamp or now,
                source=DataSourceType.SIMULATOR,
            )
            db.add(prod_event)

    # 7. Automated Operational Alerts Rule Engine
    alert_info = None
    if machine.status == MachineStatus.BREAKDOWN or (event_payload.downtime_reason and "breakdown" in event_payload.downtime_reason.lower()):
        alert = Alert(
            category=AlertCategory.MACHINE_BREAKDOWN,
            severity=AlertSeverity.HIGH,
            title=f"Machine Breakdown: {machine.name} ({machine.machine_code})",
            description=f"Automated alert from simulator telemetry. Machine stopped: {event_payload.downtime_reason or 'Unexpected stoppage'}.",
            entity_type="machine",
            entity_id=machine.machine_code,
            status=AlertStatus.ACTIVE,
        )
        db.add(alert)
        db.flush()
        alert_info = {"alert_id": alert.id, "title": alert.title, "severity": alert.severity.value}

    db.commit()

    return SimulatorIngestionResult(
        event_id=event_payload.event_id,
        status="processed",
        message=f"Event ingested successfully for {machine.machine_code}.",
        machine_state={
            "machine_code": machine.machine_code,
            "status": machine.status.value,
            "shift_output_m": machine.shift_output_m,
            "speed_rpm": machine.current_speed_rpm,
            "last_heartbeat": str(machine.last_heartbeat),
        },
        alert_generated=alert_info,
    )


def ingest_simulator_batch(db: Session, batch: SimulatorBatchPayload) -> SimulatorIngestionResponse:
    results = []
    processed = 0
    skipped = 0
    errors = 0
    
    for event in batch.events:
        res = ingest_simulator_event(db, event)
        results.append(res)
        if res.status == "processed":
            processed += 1
        elif res.status == "duplicate_skipped":
            skipped += 1
        else:
            errors += 1
            
    return SimulatorIngestionResponse(
        total_received=len(batch.events),
        processed_count=processed,
        duplicates_skipped=skipped,
        errors_count=errors,
        results=results,
    )
