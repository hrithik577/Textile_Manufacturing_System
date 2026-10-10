"""Explainable anomaly detection across machine telemetry and production logs."""

from datetime import datetime
from typing import Dict, List
from intelligence.models import AnomalyFinding
from simulator.models import MachineState, SimEvent, VirtualMachine


class AnomalyDetector:
    """Detects operational abnormalities without opaque black-box models."""

    def __init__(self, warning_defect_threshold_percent: float = 5.0):
        self.defect_threshold = warning_defect_threshold_percent
        self._counter = 0

    def detect_anomalies(
        self,
        machines: List[VirtualMachine],
        recent_events: List[SimEvent],
        current_time: datetime,
    ) -> List[AnomalyFinding]:
        findings: List[AnomalyFinding] = []

        # 1. Check for broken machines with active orders assigned
        for m in machines:
            if m.state == MachineState.BREAKDOWN and m.assigned_order_id:
                breakdown_events = [
                    e.event_id for e in recent_events
                    if e.machine_id == m.machine_id and e.event_type == "machine_breakdown"
                ]
                self._counter += 1
                findings.append(
                    AnomalyFinding(
                        anomaly_id=f"ANOM-{self._counter:04d}",
                        anomaly_type="active_order_on_broken_machine",
                        affected_entity_type="machine",
                        affected_entity_id=m.machine_id,
                        observed_value=0.0,
                        expected_value=m.rate_per_hour,
                        threshold=m.rate_per_hour * 0.75,
                        severity="critical",
                        time_window="current_state",
                        supporting_event_ids=breakdown_events,
                        explanation=(
                            f"Machine {m.machine_id} ({m.name}) is in breakdown state ({m.downtime_reason}) "
                            f"while assigned to active order {m.assigned_order_id}. Production is completely stalled."
                        ),
                        timestamp=current_time,
                    )
                )

        # 2. Check for unexpected idle machine while order is queued
        for m in machines:
            if m.state == MachineState.IDLE and m.assigned_order_id:
                self._counter += 1
                findings.append(
                    AnomalyFinding(
                        anomaly_id=f"ANOM-{self._counter:04d}",
                        anomaly_type="unexpected_idle",
                        affected_entity_type="machine",
                        affected_entity_id=m.machine_id,
                        observed_value=0.0,
                        expected_value=m.rate_per_hour,
                        threshold=1.0,
                        severity="warning",
                        time_window="current_state",
                        supporting_event_ids=[],
                        explanation=(
                            f"Machine {m.machine_id} is idle despite having order {m.assigned_order_id} assigned. "
                            "Capacity is being lost."
                        ),
                        timestamp=current_time,
                    )
                )

        # 3. Defect rate anomalies from recent events
        defect_events_by_machine: Dict[str, List[SimEvent]] = {}
        output_events_by_machine: Dict[str, List[SimEvent]] = {}

        for e in recent_events:
            if not e.machine_id:
                continue
            if e.event_type == "quality_defect_detected":
                defect_events_by_machine.setdefault(e.machine_id, []).append(e)
            elif e.event_type == "production_output":
                output_events_by_machine.setdefault(e.machine_id, []).append(e)

        for mid, d_events in defect_events_by_machine.items():
            out_events = output_events_by_machine.get(mid, [])
            total_checks = len(d_events) + len(out_events)
            if total_checks >= 3:
                defect_rate = (len(d_events) / total_checks) * 100.0
                if defect_rate > self.defect_threshold:
                    self._counter += 1
                    findings.append(
                        AnomalyFinding(
                            anomaly_id=f"ANOM-{self._counter:04d}",
                            anomaly_type="high_defect_rate",
                            affected_entity_type="machine",
                            affected_entity_id=mid,
                            observed_value=round(defect_rate, 2),
                            expected_value=2.0,
                            threshold=self.defect_threshold,
                            severity="critical" if defect_rate > 15.0 else "warning",
                            time_window="recent_events_window",
                            supporting_event_ids=[e.event_id for e in d_events],
                            explanation=(
                                f"Machine {mid} observed defect frequency {round(defect_rate, 1)}% "
                                f"exceeds tolerance threshold ({self.defect_threshold}%)."
                            ),
                            timestamp=current_time,
                        )
                    )

        return findings
