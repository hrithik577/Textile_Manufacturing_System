"""Rule-based root cause analysis linking events, machines, orders, and materials."""

from typing import Any, Dict, List, Optional
from intelligence.models import (
    AnomalyFinding,
    BottleneckFinding,
    DeadlineRiskAssessment,
    MaterialRiskAssessment,
    QualityRiskAssessment,
    RootCauseAnalysis,
)
from simulator.models import MachineState, ProductionOrder, SimEvent, VirtualMachine


class RootCauseAnalyzer:
    """Diagnoses underlying operational disruptions with strict evidence traceability."""

    def __init__(self):
        self._counter = 0

    def analyze_order_issue(
        self,
        order: ProductionOrder,
        deadline_risk: Optional[DeadlineRiskAssessment],
        machines: List[VirtualMachine],
        material_risks: List[MaterialRiskAssessment],
        quality_risks: List[QualityRiskAssessment],
        bottlenecks: List[BottleneckFinding],
        recent_events: List[SimEvent],
    ) -> RootCauseAnalysis:
        self._counter += 1
        analysis_id = f"RCA-{self._counter:04d}"
        machine_map = {m.machine_id: m for m in machines}

        observed_facts: List[str] = []
        inferred_causes: List[Dict[str, Any]] = []
        assumptions: List[str] = []
        missing_info: List[str] = []

        # 1. Investigate Machine Stoppages
        assigned_machines = [machine_map[mid] for mid in order.assigned_machine_ids if mid in machine_map]
        broken_machines = [m for m in assigned_machines if m.state == MachineState.BREAKDOWN]

        if broken_machines:
            for bm in broken_machines:
                bm_events = [
                    e.event_id for e in recent_events
                    if e.machine_id == bm.machine_id and e.event_type == "machine_breakdown"
                ]
                observed_facts.append(
                    f"Assigned machine {bm.machine_id} is in BREAKDOWN state (Reason: {bm.downtime_reason or 'unspecified'})."
                )
                inferred_causes.append({
                    "cause": "Mechanical or Electrical Equipment Failure",
                    "probability_score_or_heuristic": 0.95,
                    "evidence_event_ids": bm_events,
                    "explanation": (
                        f"Machine {bm.machine_id} completely halted production for order {order.order_id}. "
                        "Zero meters are currently being produced while the order was scheduled to run."
                    ),
                })
        else:
            observed_facts.append("All currently assigned machines are not in breakdown state.")

        # 2. Investigate Raw Material Deficits
        order_mat_risks = [mr for mr in material_risks if mr.order_id == order.order_id]
        if order_mat_risks:
            for mr in order_mat_risks:
                observed_facts.append(
                    f"Material shortage detected: {mr.material_name} has deficit of {mr.shortage_quantity} {mr.unit}."
                )
                inferred_causes.append({
                    "cause": "Supply Chain / Raw Material Depletion",
                    "probability_score_or_heuristic": 0.85,
                    "evidence_event_ids": mr.supporting_event_ids,
                    "explanation": (
                        f"Insufficient available unreserved stock of {mr.material_name}. "
                        "Work cannot proceed at full pace without raw stock."
                    ),
                })

        # 3. Investigate Quality Defects
        order_qual_risks = [qr for qr in quality_risks if order.order_id in qr.affected_order_ids]
        if order_qual_risks:
            for qr in order_qual_risks:
                observed_facts.append(
                    f"Quality alert on machine {qr.machine_id}: defect rate {qr.observed_defect_rate_percent}% "
                    f"exceeds baseline ({qr.baseline_defect_rate_percent}%)."
                )
                inferred_causes.append({
                    "cause": "Process Instability or Tooling Wear",
                    "probability_score_or_heuristic": 0.80,
                    "evidence_event_ids": qr.supporting_event_ids,
                    "explanation": (
                        f"Elevated fabric defect frequency requires roll quarantine and prevents dispatch."
                    ),
                })

        # 4. Investigate Stage Bottlenecks
        top_bottleneck = bottlenecks[0] if bottlenecks else None
        if top_bottleneck and top_bottleneck.severity in ("high", "critical"):
            if top_bottleneck.process_type == order.current_stage:
                inferred_causes.append({
                    "cause": "Process Stage Capacity Constraint",
                    "probability_score_or_heuristic": 0.70,
                    "evidence_event_ids": [],
                    "explanation": (
                        f"Current stage '{top_bottleneck.stage_name}' is the top factory bottleneck "
                        f"with {top_bottleneck.queue_units} units queued ahead of it."
                    ),
                })

        # Assumptions and missing info
        if broken_machines:
            assumptions.append("Maintenance crew dispatch time is estimated at 30 to 60 minutes.")
            missing_info.append("Exact technical repair duration estimate from physical maintenance lead.")
        if order_mat_risks:
            missing_info.append("Supplier delivery confirmation for emergency yarn replenishment.")

        # Recommended investigation
        investigations: List[str] = []
        if broken_machines:
            investigations.append("Inspect failed machine motor/drive and evaluate alternative machine capacity.")
        if order_mat_risks:
            investigations.append("Review stock reallocations from lower-priority orders and check incoming shipment ETA.")
        if order_qual_risks:
            investigations.append("Audit 4-point inspection logs and quarantine suspect rolls.")

        return RootCauseAnalysis(
            analysis_id=analysis_id,
            problem_statement=f"Order {order.order_id} ({order.customer_name}) at risk of missing delivery deadline.",
            affected_order_id=order.order_id,
            observed_facts=observed_facts,
            inferred_causes=inferred_causes,
            assumptions=assumptions,
            missing_information=missing_info,
            recommended_investigation="; ".join(investigations) or "Perform standard operational audit.",
        )
