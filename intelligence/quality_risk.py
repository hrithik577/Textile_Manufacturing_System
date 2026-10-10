"""Quality drift evaluation, suspect roll flagging, and quarantine safety rules."""

from typing import Dict, List
from intelligence.models import QualityRiskAssessment
from simulator.models import FabricRoll, SimEvent, VirtualMachine


class QualityRiskAnalyzer:
    """Monitors defect trends and enforces strict quarantine holds for suspect fabric rolls."""

    def __init__(self, baseline_defect_rate_percent: float = 2.5):
        self.baseline = baseline_defect_rate_percent

    def evaluate_quality_risks(
        self,
        machines: List[VirtualMachine],
        rolls: List[FabricRoll],
        recent_events: List[SimEvent],
    ) -> List[QualityRiskAssessment]:
        assessments: List[QualityRiskAssessment] = []

        # Find quarantined or rejected rolls
        rolls_by_machine: Dict[str, List[FabricRoll]] = {}
        for r in rolls:
            rolls_by_machine.setdefault(r.machine_id, []).append(r)

        # Defect events by machine
        defect_events_by_machine: Dict[str, List[SimEvent]] = {}
        for e in recent_events:
            if e.event_type == "quality_defect_detected" and e.machine_id:
                defect_events_by_machine.setdefault(e.machine_id, []).append(e)

        for m in machines:
            m_rolls = rolls_by_machine.get(m.machine_id, [])
            d_events = defect_events_by_machine.get(m.machine_id, [])

            if not m_rolls and not d_events:
                continue

            suspect_rolls = [r.roll_id for r in m_rolls if r.defect_count >= 3 or r.grade in ("C", "Reject")]
            total_rolls = max(1, len(m_rolls))
            defect_roll_ratio = (len(suspect_rolls) / total_rolls) * 100.0

            if defect_roll_ratio > self.baseline or len(d_events) >= 2:
                risk_level = "critical" if defect_roll_ratio > 30.0 or len(suspect_rolls) >= 3 else "high"
                recommendations = [
                    f"Quarantine all {len(suspect_rolls)} suspect roll(s) from machine {m.machine_id} immediately",
                    "Do NOT release suspect or quarantined rolls for customer dispatch",
                    f"Perform mechanical alignment and tension check on {m.name} ({m.process_type.value})",
                    "Increase inspection frequency to 100% full-width scanning for next 500 meters",
                ]

                affected_orders = list({r.order_id for r in m_rolls if r.roll_id in suspect_rolls})

                assessments.append(
                    QualityRiskAssessment(
                        machine_id=m.machine_id,
                        process_type=m.process_type.value,
                        observed_defect_rate_percent=round(defect_roll_ratio, 2),
                        baseline_defect_rate_percent=self.baseline,
                        affected_order_ids=affected_orders,
                        suspect_roll_ids=suspect_rolls,
                        quarantine_required=len(suspect_rolls) > 0,
                        risk_level=risk_level,
                        recommendations=recommendations,
                        supporting_event_ids=[e.event_id for e in d_events],
                    )
                )

        return assessments
