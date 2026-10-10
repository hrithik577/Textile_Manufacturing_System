"""
Everest Textile OS — Standard Industrial OEE Calculation Service
Defensible OEE = Availability × Performance × Quality (all factors ratios in [0, 1]).

Formulas:
- Availability = Run Time / Planned Production Time (non-overlapping downtime intervals merged).
- Performance = Actual Output (m) / Expected Output (m), where Expected = rated_speed_mpm × Run Time (min).
- Quality = First-Pass Good Output (m) / Total Inspected Output (m) (reworks & rejects excluded).
"""

from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.production import (
    Machine,
    MachineEvent,
    ProductionEvent,
    MachineStatus,
    DataSourceType,
)
from app.models.workforce import Shift
from app.models.quality import FabricRoll, QualityInspection, InspectionResult
from app.schemas.production import OEEMachineBreakdown, PlantOEEResponse


def to_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def merge_downtime_intervals(intervals: List[Tuple[datetime, datetime]]) -> float:
    """
    Merge overlapping or contiguous downtime intervals to prevent double-counting.
    Returns total downtime in minutes.
    """
    if not intervals:
        return 0.0

    # Filter out invalid intervals (start >= end)
    valid_intervals = [(to_utc(s), to_utc(e)) for s, e in intervals if to_utc(s) < to_utc(e)]
    if not valid_intervals:
        return 0.0

    # Sort intervals by start time
    sorted_intervals = sorted(valid_intervals, key=lambda x: x[0])

    merged: List[List[datetime]] = []
    for start, end in sorted_intervals:
        if not merged:
            merged.append([start, end])
        else:
            prev_start, prev_end = merged[-1]
            if start <= prev_end:
                # Overlap or contiguous: merge by extending end if needed
                merged[-1][1] = max(prev_end, end)
            else:
                merged.append([start, end])

    total_seconds = sum((m[1] - m[0]).total_seconds() for m in merged)
    return total_seconds / 60.0


def calculate_machine_oee(
    db: Session,
    machine: Machine,
    window_start: datetime,
    window_end: datetime,
    planned_minutes: Optional[float] = None,
) -> OEEMachineBreakdown:
    """
    Calculate standard OEE for a single machine within a reporting window.
    """
    window_start = to_utc(window_start)
    window_end = to_utc(window_end)
    missing_reasons: List[str] = []
    diagnostic: Optional[str] = None

    # 1. Planned Production Time
    # If not explicitly specified, calculate based on shift duration or window
    if planned_minutes is None:
        window_duration_minutes = (window_end - window_start).total_seconds() / 60.0
        # Standard shift duration is 480 min (8h) with 30 min break = 450 min
        planned_minutes = min(window_duration_minutes, 450.0)

    if planned_minutes <= 0.0:
        missing_reasons.append("Planned production time is 0 for this reporting window.")
        return OEEMachineBreakdown(
            machine_id=machine.id,
            machine_code=machine.machine_code,
            machine_name=machine.name,
            process_type=machine.process_type.value if hasattr(machine.process_type, "value") else str(machine.process_type),
            status=machine.status.value if hasattr(machine.status, "value") else str(machine.status),
            rated_speed_mpm=machine.rated_speed_mpm,
            planned_production_minutes=0.0,
            downtime_minutes=0.0,
            runtime_minutes=0.0,
            availability=None,
            actual_output_meters=0.0,
            expected_output_meters=0.0,
            performance=None,
            total_inspected_meters=0.0,
            first_pass_good_meters=0.0,
            quality=None,
            oee=None,
            oee_percentage=None,
            calculation_status="no_planned_time",
            missing_reasons=missing_reasons,
        )

    # 2. Availability (Run Time / Planned Time)
    # Collect recorded downtime events for this machine within the window
    events = (
        db.query(MachineEvent)
        .filter(
            MachineEvent.machine_id == machine.id,
            MachineEvent.start_time <= window_end,
            (MachineEvent.end_time >= window_start) | (MachineEvent.end_time.is_(None)),
        )
        .all()
    )

    downtime_intervals: List[Tuple[datetime, datetime]] = []
    downtime_types = {"downtime_start", "maintenance", "breakdown", "stopped"}

    for ev in events:
        is_downtime = (
            ev.event_type.lower() in downtime_types
            or ev.downtime_reason is not None
        )
        if is_downtime:
            ev_start = max(to_utc(ev.start_time), window_start)
            ev_end = min(to_utc(ev.end_time) or window_end, window_end)
            if ev_start < ev_end:
                downtime_intervals.append((ev_start, ev_end))

    downtime_minutes = merge_downtime_intervals(downtime_intervals)
    # Runtime cannot exceed planned time
    runtime_minutes = max(0.0, planned_minutes - downtime_minutes)
    availability = round(runtime_minutes / planned_minutes, 4)

    # 3. Performance (Actual Output / Expected Output for actual runtime)
    rated_speed = machine.rated_speed_mpm
    actual_output_m = 0.0
    expected_output_m = 0.0
    performance: Optional[float] = None

    if rated_speed is None or rated_speed <= 0.0:
        missing_reasons.append("Missing or invalid machine rated speed standard (rated_speed_mpm).")
    else:
        expected_output_m = round(rated_speed * runtime_minutes, 2)
        
        # Query discrete production events in window
        actual_output_events = (
            db.query(func.sum(ProductionEvent.quantity))
            .filter(
                ProductionEvent.machine_id == machine.id,
                ProductionEvent.event_timestamp >= window_start,
                ProductionEvent.event_timestamp <= window_end,
                ProductionEvent.unit == "m",
            )
            .scalar()
            or 0.0
        )
        
        if actual_output_events == 0.0 and machine.shift_output_m > 0 and (window_end >= datetime.now(timezone.utc) - timedelta(hours=24)):
            actual_output_m = float(machine.shift_output_m)
        else:
            actual_output_m = float(actual_output_events)

        if expected_output_m > 0.0:
            raw_perf = actual_output_m / expected_output_m
            performance = round(raw_perf, 4)
            if raw_perf > 1.0:
                diagnostic = f"Output ({actual_output_m:.1f}m) exceeds 100% rated speed ({expected_output_m:.1f}m) at {rated_speed} m/min."
        elif runtime_minutes == 0.0:
            performance = 0.0
        else:
            performance = 0.0

    # 4. Quality (First-Pass Good Output / Total Inspected Output)
    total_inspected_m = 0.0
    first_pass_good_m = 0.0
    quality: Optional[float] = None

    rolls_query = db.query(FabricRoll)
    if machine.active_production_order_id:
        rolls = rolls_query.filter(FabricRoll.production_order_id == machine.active_production_order_id).all()
    else:
        rolls = rolls_query.filter(
            FabricRoll.created_at >= window_start,
            FabricRoll.created_at <= window_end,
        ).all()

    for roll in rolls:
        if not roll.inspections:
            continue
        first_insp = min(roll.inspections, key=lambda x: x.inspection_date)
        total_inspected_m += roll.length_m
        # First-pass good requires result to be PASS on the first inspection
        if first_insp.result == InspectionResult.PASS:
            first_pass_good_m += roll.length_m

    if total_inspected_m > 0.0:
        quality = round(first_pass_good_m / total_inspected_m, 4)
    elif actual_output_m > 0.0:
        quality = None
        missing_reasons.append("Produced meterage pending quality inspection; uninspected rolls cannot be assumed passed.")
    else:
        quality = 1.0

    # 5. Composite OEE
    oee: Optional[float] = None
    oee_pct: Optional[float] = None
    calculation_status = "valid"

    if availability is not None and performance is not None and quality is not None:
        oee = round(availability * performance * quality, 4)
        oee_pct = round(oee * 100.0, 2)
    else:
        calculation_status = "insufficient_data"

    return OEEMachineBreakdown(
        machine_id=machine.id,
        machine_code=machine.machine_code,
        machine_name=machine.name,
        process_type=machine.process_type.value if hasattr(machine.process_type, "value") else str(machine.process_type),
        status=machine.status.value if hasattr(machine.status, "value") else str(machine.status),
        rated_speed_mpm=machine.rated_speed_mpm,
        planned_production_minutes=round(planned_minutes, 1),
        downtime_minutes=round(downtime_minutes, 1),
        runtime_minutes=round(runtime_minutes, 1),
        availability=availability,
        actual_output_meters=round(actual_output_m, 1),
        expected_output_meters=round(expected_output_m, 1),
        performance=performance,
        performance_diagnostic=diagnostic,
        total_inspected_meters=round(total_inspected_m, 1),
        first_pass_good_meters=round(first_pass_good_m, 1),
        quality=quality,
        oee=oee,
        oee_percentage=oee_pct,
        calculation_status=calculation_status,
        missing_reasons=missing_reasons,
    )


def calculate_plant_oee(
    db: Session,
    start_dt: Optional[datetime] = None,
    end_dt: Optional[datetime] = None,
) -> PlantOEEResponse:
    """
    Calculate aggregate plant-wide OEE across all machines.
    Aggregates compatible production and time totals defensibly.
    """
    now = datetime.now(timezone.utc)
    if not end_dt:
        end_dt = now
    if not start_dt:
        start_dt = end_dt - timedelta(hours=8)

    machines = db.query(Machine).order_by(Machine.machine_code.asc()).all()

    if not machines:
        return PlantOEEResponse(
            reporting_window_start=start_dt,
            reporting_window_end=end_dt,
            data_freshness=now,
            data_completeness_pct=0.0,
            data_mode="live",
            total_planned_minutes=0.0,
            total_runtime_minutes=0.0,
            total_downtime_minutes=0.0,
            availability=None,
            total_actual_meters=0.0,
            total_expected_meters=0.0,
            performance=None,
            total_inspected_meters=0.0,
            total_first_pass_good_meters=0.0,
            quality=None,
            oee=None,
            oee_percentage=None,
            calculation_status="insufficient_data",
            missing_reasons=["No production equipment registered in factory configuration."],
            machine_breakdowns=[],
        )

    breakdowns: List[OEEMachineBreakdown] = []
    tot_planned = 0.0
    tot_runtime = 0.0
    tot_downtime = 0.0
    tot_actual_m = 0.0
    tot_expected_m = 0.0
    tot_inspected_m = 0.0
    tot_first_pass_m = 0.0

    has_simulator_data = False
    valid_count = 0
    all_missing_reasons: List[str] = []

    for m in machines:
        if m.data_source == DataSourceType.SIMULATOR:
            has_simulator_data = True
        mb = calculate_machine_oee(db, m, start_dt, end_dt)
        breakdowns.append(mb)

        tot_planned += mb.planned_production_minutes
        tot_runtime += mb.runtime_minutes
        tot_downtime += mb.downtime_minutes
        tot_actual_m += mb.actual_output_meters
        tot_expected_m += mb.expected_output_meters
        tot_inspected_m += mb.total_inspected_meters
        tot_first_pass_m += mb.first_pass_good_meters

        if mb.calculation_status == "valid":
            valid_count += 1
        else:
            for r in mb.missing_reasons:
                if r not in all_missing_reasons:
                    all_missing_reasons.append(f"{m.machine_code}: {r}")

    # Plant-wide aggregate ratios
    plant_avail: Optional[float] = None
    if tot_planned > 0.0:
        plant_avail = round(tot_runtime / tot_planned, 4)

    plant_perf: Optional[float] = None
    if tot_expected_m > 0.0:
        plant_perf = round(tot_actual_m / tot_expected_m, 4)
    elif tot_runtime == 0.0 and tot_planned > 0.0:
        plant_perf = 0.0

    plant_quality: Optional[float] = None
    if tot_inspected_m > 0.0:
        plant_quality = round(tot_first_pass_m / tot_inspected_m, 4)
    elif tot_actual_m == 0.0:
        plant_quality = 1.0

    plant_oee: Optional[float] = None
    plant_oee_pct: Optional[float] = None
    overall_status = "valid"

    if plant_avail is not None and plant_perf is not None and plant_quality is not None:
        plant_oee = round(plant_avail * plant_perf * plant_quality, 4)
        plant_oee_pct = round(plant_oee * 100.0, 2)
    else:
        overall_status = "insufficient_data"

    data_completeness = round((valid_count / len(machines)) * 100.0, 1)

    return PlantOEEResponse(
        reporting_window_start=start_dt,
        reporting_window_end=end_dt,
        data_freshness=now,
        data_completeness_pct=data_completeness,
        data_mode="demo" if has_simulator_data else "live",
        total_planned_minutes=round(tot_planned, 1),
        total_runtime_minutes=round(tot_runtime, 1),
        total_downtime_minutes=round(tot_downtime, 1),
        availability=plant_avail,
        total_actual_meters=round(tot_actual_m, 1),
        total_expected_meters=round(tot_expected_m, 1),
        performance=plant_perf,
        total_inspected_meters=round(tot_inspected_m, 1),
        total_first_pass_good_meters=round(tot_first_pass_m, 1),
        quality=plant_quality,
        oee=plant_oee,
        oee_percentage=plant_oee_pct,
        calculation_status=overall_status,
        missing_reasons=all_missing_reasons,
        machine_breakdowns=breakdowns,
    )
