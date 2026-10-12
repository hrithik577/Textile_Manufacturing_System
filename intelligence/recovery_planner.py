"""The Everest Rescue Engine — multi-option recovery planner with feasibility checks."""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from intelligence.models import (
    DeadlineRiskAssessment,
    MaterialRiskAssessment,
    QualityRiskAssessment,
    RecoveryOption,
    RecoveryPlan,
    RecoveryPlanStatus,
    RootCauseAnalysis,
)
from intelligence.scoring import OptionScorer, ScoringWeights
from simulator.models import MachineState, ProcessType, ProductionOrder, VirtualMachine


class RecoveryPlanner:
    """Generates and ranks feasible recovery plans for operational disruptions."""

    def __init__(self, scorer: Optional[OptionScorer] = None):
        self.scorer = scorer or OptionScorer()
        self._plan_counter = 0

    def plan_recovery(
        self,
        alert_id: str,
        order: ProductionOrder,
        root_cause: RootCauseAnalysis,
        deadline_risk: Optional[DeadlineRiskAssessment],
        machines: List[VirtualMachine],
        material_risks: List[MaterialRiskAssessment],
        quality_risks: List[QualityRiskAssessment],
        current_time: datetime,
    ) -> RecoveryPlan:
        self._plan_counter += 1
        plan_id = f"RP-{self._plan_counter:04d}"

        options: List[RecoveryOption] = []
        evidence: List[Dict[str, Any]] = []

        machine_map = {m.machine_id: m for m in machines}
        assigned_m = [machine_map[mid] for mid in order.assigned_machine_ids if mid in machine_map]
        broken_m = [m for m in assigned_m if m.state == MachineState.BREAKDOWN]

        # Evidence collection
        if broken_m:
            for bm in broken_m:
                evidence.append({
                    "type": "machine_breakdown",
                    "description": f"Assigned machine {bm.machine_id} is broken down.",
                    "details": {"downtime_reason": bm.downtime_reason},
                })
        for mr in material_risks:
            if mr.order_id == order.order_id:
                evidence.append({
                    "type": "material_shortage",
                    "description": f"Deficit of {mr.shortage_quantity} {mr.unit} in {mr.material_name}.",
                    "details": {"material_id": mr.material_id},
                })

        # --- A. Machine Breakdown Recovery Options ---
        if broken_m:
            broken_machine = broken_m[0]

            # Find compatible idle machines for the same process
            compatible_idle = [
                m for m in machines
                if m.process_type == broken_machine.process_type
                and m.state == MachineState.IDLE
                and m.machine_id != broken_machine.machine_id
            ]

            # Option 1: Fast Reassignment to an idle compatible machine
            if compatible_idle:
                target_alt = compatible_idle[0]
                options.append(
                    RecoveryOption(
                        option_id="OPT-REASSIGN",
                        title=f"Reassign Order to Idle Machine ({target_alt.machine_id})",
                        description=(
                            f"Immediately transfer remaining weave job from broken {broken_machine.machine_id} "
                            f"to available idle loom {target_alt.machine_id} ({target_alt.name})."
                        ),
                        category="reassign",
                        action_type="reassign_machine",
                        action_parameters={
                            "order_id": order.order_id,
                            "from_machine_id": broken_machine.machine_id,
                            "to_machine_id": target_alt.machine_id,
                        },
                        feasible=True,
                        estimated_delay_reduction_minutes=180.0,
                        estimated_new_completion=current_time + timedelta(hours=14),
                        estimated_additional_cost=50.0,  # Minor setup cost
                        quality_and_safety_risk="low",
                        impact_on_other_orders="none",
                        assumptions=[
                            f"Machine {target_alt.machine_id} warp beam compatibility is confirmed",
                            "Setup changeover requires 20 minutes",
                        ],
                    )
                )
            else:
                options.append(
                    RecoveryOption(
                        option_id="OPT-REASSIGN",
                        title="Reassign Order to Alternative Machine",
                        description="Attempt to reassign order to another loom in the weaving shed.",
                        category="reassign",
                        action_type="reassign_machine",
                        action_parameters={"order_id": order.order_id},
                        feasible=False,
                        infeasibility_reason="No idle compatible machines of process type 'weaving' are currently available.",
                        assumptions=["Requires waiting for another machine to complete its run"],
                    )
                )

            # Option 2: Expedited Technical Repair
            options.append(
                RecoveryOption(
                    option_id="OPT-REPAIR",
                    title=f"Expedited Technical Repair on {broken_machine.machine_id}",
                    description=(
                        f"Deploy emergency maintenance technicians to replace drive motor bearings on {broken_machine.machine_id}."
                    ),
                    category="repair",
                    action_type="execute_repair",
                    action_parameters={"machine_id": broken_machine.machine_id},
                    feasible=True,
                    estimated_delay_reduction_minutes=90.0,
                    estimated_new_completion=current_time + timedelta(hours=17),
                    estimated_additional_cost=300.0,  # Spare parts + expedited labor
                    quality_and_safety_risk="low",
                    impact_on_other_orders="none",
                    assumptions=[
                        "Replacement drive bearings are available in maintenance spare store",
                        "Technician intervention takes 2.5 hours",
                    ],
                )
            )

            # Option 3: Authorize Overtime Weekend Shift
            options.append(
                RecoveryOption(
                    option_id="OPT-OVERTIME",
                    title="Authorize Overtime Weekend Shift",
                    description="Run an extra 4-hour overtime shift after repair to compress schedule backlog.",
                    category="overtime",
                    action_type="authorize_overtime",
                    action_parameters={"hours": 4, "order_id": order.order_id},
                    feasible=True,
                    estimated_delay_reduction_minutes=240.0,
                    estimated_new_completion=current_time + timedelta(hours=12),
                    estimated_additional_cost=450.0,  # Overtime operator wages
                    quality_and_safety_risk="medium",
                    impact_on_other_orders="none",
                    assumptions=["Operator shift union agreement allows overtime hours"],
                )
            )

        # --- B. Material Shortage Recovery Options ---
        order_mat_shortage = next((mr for mr in material_risks if mr.order_id == order.order_id), None)
        if order_mat_shortage:
            options.append(
                RecoveryOption(
                    option_id="OPT-EXPEDITE-DELIVERY",
                    title=f"Expedite In-Transit Supplier Shipment of {order_mat_shortage.material_name}",
                    description=(
                        f"Contact logistics partner to expedite delivery of in-transit batch to clear shortage of "
                        f"{order_mat_shortage.shortage_quantity} {order_mat_shortage.unit}."
                    ),
                    category="expedite",
                    action_type="expedite_shipment",
                    action_parameters={"material_id": order_mat_shortage.material_id},
                    feasible=True,
                    estimated_delay_reduction_minutes=150.0,
                    estimated_additional_cost=200.0,
                    quality_and_safety_risk="low",
                    assumptions=["Supplier courier can expedite delivery by 3 hours"],
                )
            )
            options.append(
                RecoveryOption(
                    option_id="OPT-RESCHEDULE",
                    title="Reschedule Production and Weave Secondary Order",
                    description="Pause this order temporarily until delivery arrives and utilize loom capacity for another waiting order.",
                    category="reschedule",
                    action_type="reschedule_order",
                    action_parameters={"order_id": order.order_id},
                    feasible=True,
                    estimated_delay_reduction_minutes=0.0,
                    estimated_additional_cost=0.0,
                    quality_and_safety_risk="low",
                    assumptions=["Customer agrees to a 6-hour delivery extension"],
                )
            )

        # --- C. Quality Deterioration Recovery Options ---
        order_qual = next((qr for qr in quality_risks if order.order_id in qr.affected_order_ids), None)
        if order_qual:
            options.append(
                RecoveryOption(
                    option_id="OPT-HOLD-QUARANTINE",
                    title="Hold & Quarantine Suspect Rolls for 100% Re-inspection",
                    description=(
                        f"Place {len(order_qual.suspect_roll_ids)} suspect roll(s) on formal quality hold. "
                        "Prevent any unverified dispatch."
                    ),
                    category="quarantine_inspect",
                    action_type="hold_rolls",
                    action_parameters={
                        "roll_ids": order_qual.suspect_roll_ids,
                        "machine_id": order_qual.machine_id,
                    },
                    feasible=True,
                    estimated_delay_reduction_minutes=60.0,
                    estimated_additional_cost=100.0,
                    quality_and_safety_risk="low",
                    assumptions=["4-point manual inspection table is staffed"],
                )
            )

        # Rank all options using transparent multi-criteria scoring
        ranked_options = self.scorer.rank_options(options)

        # Select the best feasible option
        best_feasible = next((opt for opt in ranked_options if opt.feasible), None)
        recommended_id = best_feasible.option_id if best_feasible else (ranked_options[0].option_id if ranked_options else None)

        problem_stmt = root_cause.problem_statement if root_cause else f"Disruption detected on order {order.order_id}"

        return RecoveryPlan(
            plan_id=plan_id,
            alert_id=alert_id,
            problem_statement=problem_stmt,
            status=RecoveryPlanStatus.AWAITING_APPROVAL,
            evidence=evidence,
            options=ranked_options,
            recommended_option_id=recommended_id,
            approval_required=True,
        )
