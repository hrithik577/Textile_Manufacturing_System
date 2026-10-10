"""Evaluation of raw material availability, stock shortages, and production impact."""

from datetime import datetime
from typing import Dict, List
from intelligence.models import MaterialRiskAssessment
from simulator.models import MaterialInventory, ProductionOrder, SimEvent


class MaterialRiskAnalyzer:
    """Analyzes raw material coverage, reserving status, and stock deficits."""

    def analyze_order_material_risks(
        self,
        orders: List[ProductionOrder],
        inventory: List[MaterialInventory],
        recent_events: List[SimEvent],
        current_time: datetime,
    ) -> List[MaterialRiskAssessment]:
        inv_map: Dict[str, MaterialInventory] = {m.material_id: m for m in inventory}
        shortage_events_by_order: Dict[str, List[str]] = {}
        for e in recent_events:
            if e.event_type == "material_shortage" and e.production_order_id:
                shortage_events_by_order.setdefault(e.production_order_id, []).append(e.event_id)

        assessments: List[MaterialRiskAssessment] = []

        for order in orders:
            if order.status.value in ("completed", "cancelled"):
                continue

            for mat_id, req_total in order.required_materials.items():
                inv_item = inv_map.get(mat_id)
                reserved = order.reserved_materials.get(mat_id, 0.0)

                # Remaining required material proportioned to remaining order quantity
                remaining_order_ratio = max(0.0, order.ordered_quantity - order.produced_quantity) / max(1.0, order.ordered_quantity)
                needed_now = req_total * remaining_order_ratio

                if not inv_item:
                    assessments.append(
                        MaterialRiskAssessment(
                            order_id=order.order_id,
                            material_id=mat_id,
                            material_name="Unknown Material",
                            required_quantity=round(needed_now, 2),
                            available_quantity=0.0,
                            reserved_quantity=round(reserved, 2),
                            incoming_quantity=0.0,
                            shortage_quantity=round(needed_now, 2),
                            unit="kg",
                            estimated_delay_hours=24.0,
                            risk_level="critical",
                            explanation=f"Required material '{mat_id}' is not found in factory inventory database.",
                            supporting_event_ids=shortage_events_by_order.get(order.order_id, []),
                        )
                    )
                    continue

                available = inv_item.available_stock
                # Incoming shipments arriving before order deadline
                incoming_valid = sum(
                    b.quantity for b in inv_item.incoming_batches
                    if b.status == "in_transit" and b.expected_arrival <= order.deadline
                )

                # Total reachable stock = available unreserved + reserved for this order + incoming before deadline
                total_reachable = available + reserved + incoming_valid

                if total_reachable < needed_now:
                    shortage = needed_now - total_reachable
                    shortage_ratio = shortage / max(1.0, needed_now)
                    risk_level = "critical" if shortage_ratio > 0.5 else ("high" if shortage_ratio > 0.2 else "medium")
                    delay_hours = round(shortage_ratio * 12.0, 1)

                    assessments.append(
                        MaterialRiskAssessment(
                            order_id=order.order_id,
                            material_id=mat_id,
                            material_name=inv_item.name,
                            required_quantity=round(needed_now, 2),
                            available_quantity=round(available, 2),
                            reserved_quantity=round(reserved, 2),
                            incoming_quantity=round(incoming_valid, 2),
                            shortage_quantity=round(shortage, 2),
                            unit=inv_item.unit,
                            estimated_delay_hours=delay_hours,
                            risk_level=risk_level,
                            explanation=(
                                f"Order requires {round(needed_now, 1)} {inv_item.unit} of {inv_item.name}, "
                                f"but unreserved available stock is only {round(available, 1)} {inv_item.unit}. "
                                f"Deficit of {round(shortage, 1)} {inv_item.unit} threatens deadline."
                            ),
                            supporting_event_ids=shortage_events_by_order.get(order.order_id, []),
                        )
                    )

        return assessments
