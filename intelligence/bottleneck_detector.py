"""Throughput bottleneck ranking and constraint identification."""

from typing import Dict, List
from intelligence.models import BottleneckFinding
from simulator.models import MachineState, ProcessType, ProductionOrder, VirtualMachine


class BottleneckDetector:
    """Evaluates factory-wide work-in-progress, capacity constraints, and starvation risks."""

    def detect_bottlenecks(
        self,
        machines: List[VirtualMachine],
        orders: List[ProductionOrder],
    ) -> List[BottleneckFinding]:
        # Group machines and capacity by process type
        process_machines: Dict[str, List[VirtualMachine]] = {}
        for m in machines:
            process_machines.setdefault(m.process_type.value, []).append(m)

        # Calculate pending work (WIP queue) by process stage
        stage_queue: Dict[str, float] = {}
        for o in orders:
            if o.status.value in ("in_progress", "pending", "at_risk"):
                remaining = max(0.0, o.ordered_quantity - o.produced_quantity)
                stage_queue[o.current_stage] = stage_queue.get(o.current_stage, 0.0) + remaining

        candidates: List[BottleneckFinding] = []

        for p_type, m_list in process_machines.items():
            total_nominal_capacity = sum(m.rate_per_hour for m in m_list)
            active_machines = [m for m in m_list if m.state == MachineState.RUNNING]
            broken_machines = [m for m in m_list if m.state == MachineState.BREAKDOWN]
            
            actual_available_capacity = sum(m.rate_per_hour * m.efficiency for m in active_machines)
            queue = stage_queue.get(p_type, 0.0)

            # Compute hours required to clear queue at current active capacity
            effective_capacity = max(1.0, actual_available_capacity)
            clearing_hours = queue / effective_capacity

            is_broken = len(broken_machines) > 0
            has_queue = queue > 0.0

            # Evidence aggregation
            evidence_points: List[str] = []
            if is_broken:
                evidence_points.append(f"{len(broken_machines)} machine(s) in breakdown: {', '.join(m.machine_id for m in broken_machines)}")
            if queue > 0:
                evidence_points.append(f"WIP queue of {round(queue, 1)} units awaiting processing")
            if actual_available_capacity < total_nominal_capacity:
                evidence_points.append(
                    f"Operating at {round((actual_available_capacity / max(1.0, total_nominal_capacity)) * 100, 1)}% of nominal capacity"
                )

            # Severity heuristic
            if is_broken and has_queue:
                severity = "critical"
            elif clearing_hours > 8.0:
                severity = "high"
            elif queue > 0:
                severity = "medium"
            else:
                severity = "low"

            candidates.append(
                BottleneckFinding(
                    stage_name=p_type.replace("_", " ").title(),
                    process_type=p_type,
                    rank=1,  # Will be adjusted after sorting
                    candidate_machine_ids=[m.machine_id for m in m_list],
                    queue_units=round(queue, 2),
                    capacity_utilization_percent=round(
                        (len(active_machines) / max(1, len(m_list))) * 100.0, 1
                    ),
                    actual_output_rate=round(actual_available_capacity, 2),
                    starvation_risk=False,
                    blockage_risk=is_broken,
                    evidence_summary="; ".join(evidence_points) or "Normal throughput balance",
                    severity=severity,
                )
            )

        # Rank candidates: highest queue-to-capacity strain & broken states first
        severity_weight = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        candidates.sort(
            key=lambda b: (severity_weight.get(b.severity, 0), b.queue_units),
            reverse=True,
        )

        for i, finding in enumerate(candidates, start=1):
            finding.rank = i

        return candidates
