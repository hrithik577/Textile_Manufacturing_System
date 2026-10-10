"""Step-based textile production scheduling, defect generation, and roll creation."""

from datetime import datetime, timedelta
import random
from typing import Dict, List, Optional
from simulator.event_generator import EventGenerator
from simulator.machine_simulator import MachineSimulator
from simulator.material_simulator import MaterialSimulator
from simulator.models import (
    FabricRoll,
    MachineState,
    OrderPriority,
    OrderStatus,
    ProductionOrder,
)


class ProductionSimulator:
    """Simulates production runs, material coupling, defect occurrence, and roll batching."""

    def __init__(
        self,
        event_generator: EventGenerator,
        machine_simulator: MachineSimulator,
        material_simulator: MaterialSimulator,
        random_seed: int = 42,
    ):
        self.events = event_generator
        self.machines = machine_simulator
        self.materials = material_simulator
        self.orders: Dict[str, ProductionOrder] = {}
        self.rolls: List[FabricRoll] = []
        self._rng = random.Random(random_seed)
        self._roll_counter = 0

    def register_order(self, order: ProductionOrder) -> None:
        self.orders[order.order_id] = order

    def get_order(self, order_id: str) -> Optional[ProductionOrder]:
        return self.orders.get(order_id)

    def advance_production(self, delta_minutes: float, current_time: datetime) -> None:
        """Executes one simulation interval across all active orders and machines."""
        for order in self.orders.values():
            if order.status not in (OrderStatus.IN_PROGRESS, OrderStatus.AT_RISK):
                continue

            # Determine machines working on this order
            assigned_machines = [
                self.machines.get_machine(mid) for mid in order.assigned_machine_ids
                if self.machines.get_machine(mid) is not None
            ]

            if not assigned_machines:
                continue

            for machine in assigned_machines:
                if machine.state != MachineState.RUNNING:
                    # Constraint: A machine cannot produce while broken, idle, or in maintenance
                    self.machines.record_tick_activity(machine.machine_id, delta_minutes, 0.0)
                    continue

                potential_output = self.machines.calculate_potential_output(machine.machine_id, delta_minutes)
                if potential_output <= 0.0:
                    continue

                # Material constraint check
                # Rule of thumb: 0.25 kg yarn per meter of fabric
                yarn_ratio = 0.25
                yarn_needed = potential_output * yarn_ratio
                primary_yarn_mat_id = next(iter(order.required_materials.keys()), None)

                actual_output = potential_output
                if primary_yarn_mat_id:
                    consumed = self.materials.consume_material(
                        primary_yarn_mat_id, yarn_needed, order.order_id, current_time
                    )
                    if consumed < yarn_needed:
                        # Production constrained by available material
                        actual_output = consumed / yarn_ratio if yarn_ratio > 0 else 0.0

                if actual_output <= 0.0:
                    continue

                # Advance production quantity
                remaining_qty = max(0.0, order.ordered_quantity - order.produced_quantity)
                produced_this_step = min(actual_output, remaining_qty)
                order.produced_quantity += produced_this_step

                # Record activity on machine
                self.machines.record_tick_activity(machine.machine_id, delta_minutes, produced_this_step)

                # Emit production output event
                self.events.create_event(
                    event_type="production_output",
                    timestamp=current_time,
                    machine_id=machine.machine_id,
                    production_order_id=order.order_id,
                    details={
                        "output_quantity": round(produced_this_step, 2),
                        "total_produced": round(order.produced_quantity, 2),
                        "ordered_quantity": order.ordered_quantity,
                        "unit": order.unit,
                    },
                )

                # Defect and roll creation simulation (every 100 meters threshold)
                base_defect_prob = 0.03 * machine.defect_multiplier
                has_defect = self._rng.random() < base_defect_prob
                if has_defect:
                    defect_count = self._rng.randint(1, 6)
                    self.events.create_event(
                        event_type="quality_defect_detected",
                        timestamp=current_time,
                        machine_id=machine.machine_id,
                        production_order_id=order.order_id,
                        details={
                            "defect_count": defect_count,
                            "process_type": machine.process_type.value,
                            "severity": "high" if defect_count > 3 else "medium",
                        },
                    )

                # Check if roll milestone reached
                completed_rolls_count = len([r for r in self.rolls if r.order_id == order.order_id])
                expected_rolls = int(order.produced_quantity // 100.0)
                if expected_rolls > completed_rolls_count:
                    self._roll_counter += 1
                    roll_defect_count = self._rng.randint(0, 5) if has_defect else self._rng.randint(0, 1)
                    is_quarantine = roll_defect_count >= 4
                    roll = FabricRoll(
                        roll_id=f"ROLL-{self._roll_counter:04d}",
                        order_id=order.order_id,
                        machine_id=machine.machine_id,
                        length_meters=100.0,
                        defect_count=roll_defect_count,
                        grade="Reject" if is_quarantine else ("B" if roll_defect_count > 1 else "A"),
                        status="quarantine" if is_quarantine else "dispatch_ready",
                        created_at=current_time,
                        source="simulator",
                    )
                    self.rolls.append(roll)
                    self.events.create_event(
                        event_type="roll_created",
                        timestamp=current_time,
                        machine_id=machine.machine_id,
                        production_order_id=order.order_id,
                        details={
                            "roll_id": roll.roll_id,
                            "grade": roll.grade,
                            "status": roll.status,
                            "defects": roll.defect_count,
                        },
                    )

                # Check order completion
                if order.produced_quantity >= order.ordered_quantity:
                    order.status = OrderStatus.COMPLETED
                    self.machines.set_machine_state(
                        machine.machine_id,
                        MachineState.IDLE,
                        current_time,
                        reason="order_completed",
                    )
                    self.events.create_event(
                        event_type="order_completed",
                        timestamp=current_time,
                        production_order_id=order.order_id,
                        details={
                            "ordered_quantity": order.ordered_quantity,
                            "final_produced": order.produced_quantity,
                        },
                    )
                    break
