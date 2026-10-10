"""Explainable completion forecasting and customer deadline risk assessment."""

from datetime import datetime, timedelta
from typing import Dict, List
from intelligence.models import DeadlineRiskAssessment
from simulator.models import MachineState, ProductionOrder, VirtualMachine


class DeadlinePredictor:
    """Calculates realistic completion times and classifies deadline slippage risks."""

    def predict_deadlines(
        self,
        orders: List[ProductionOrder],
        machines: List[VirtualMachine],
        current_time: datetime,
    ) -> List[DeadlineRiskAssessment]:
        machine_map: Dict[str, VirtualMachine] = {m.machine_id: m for m in machines}
        assessments: List[DeadlineRiskAssessment] = []

        for order in orders:
            if order.status.value in ("completed", "cancelled"):
                continue

            remaining_qty = max(0.0, order.ordered_quantity - order.produced_quantity)
            factors: List[str] = []
            assumptions: List[str] = [
                "Assuming nominal operational efficiency across remaining stages",
                "Assuming no further unpredicted mechanical breakdowns",
            ]

            # Find assigned machines
            assigned_m = [
                machine_map[mid] for mid in order.assigned_machine_ids
                if mid in machine_map
            ]

            has_breakdown = any(m.state == MachineState.BREAKDOWN for m in assigned_m)

            # Available active rate
            active_rates = [
                m.rate_per_hour * m.efficiency for m in assigned_m
                if m.state == MachineState.RUNNING
            ]
            effective_rate = sum(active_rates) if active_rates else 0.0

            if has_breakdown:
                factors.append("Assigned production machine is currently in BREAKDOWN state (0 output/hr)")

            if effective_rate <= 0.0:
                # If no active rate, estimate based on nominal rate of assigned machines or default
                nominal_rate = sum(m.rate_per_hour * m.efficiency for m in assigned_m) if assigned_m else 45.0
                # Stalled! Time required cannot proceed until resolved
                # Add a 6-hour repair delay penalty to the projection
                repair_overhead_hours = 6.0 if has_breakdown else 2.0
                needed_prod_hours = remaining_qty / max(1.0, nominal_rate)
                total_hours_needed = repair_overhead_hours + needed_prod_hours
                assumptions.append(f"Included estimated repair/reassignment duration of {repair_overhead_hours} hours")
            else:
                total_hours_needed = remaining_qty / effective_rate
                factors.append(f"Operating at active throughput of {round(effective_rate, 1)} {order.unit}/hr")

            estimated_completion = current_time + timedelta(hours=total_hours_needed)
            time_until_deadline = (order.deadline - current_time).total_seconds() / 3600.0

            lateness_hours = max(0.0, total_hours_needed - time_until_deadline)

            # Categorize risk
            if lateness_hours > 4.0 or (has_breakdown and time_until_deadline < 12.0) or (has_breakdown and lateness_hours > 0.0):
                risk_cat = "critical"
            elif lateness_hours > 0.0 or (has_breakdown and time_until_deadline < total_hours_needed * 1.5):
                risk_cat = "high"
            elif time_until_deadline < total_hours_needed * 1.25:
                risk_cat = "medium"
            else:
                risk_cat = "low"

            factors.append(
                f"Remaining quantity: {round(remaining_qty, 1)} {order.unit}; "
                f"Projected hours to finish: {round(total_hours_needed, 1)}h; "
                f"Available buffer before deadline: {round(time_until_deadline, 1)}h"
            )

            assessments.append(
                DeadlineRiskAssessment(
                    order_id=order.order_id,
                    customer_name=order.customer_name,
                    deadline=order.deadline,
                    estimated_completion=estimated_completion,
                    estimated_lateness_hours=round(lateness_hours, 1),
                    risk_category=risk_cat,
                    contributing_factors=factors,
                    assumptions=assumptions,
                    confidence_level="qualified_estimate" if not has_breakdown else "high_risk_projection",
                )
            )

        return assessments
