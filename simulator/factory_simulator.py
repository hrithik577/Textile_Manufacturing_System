"""Master Virtual Factory Simulator orchestrator with controllable simulation clock."""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from simulator.config import DEFAULT_CONFIG, FactoryConfig
from simulator.event_generator import EventGenerator
from simulator.machine_simulator import MachineSimulator
from simulator.material_simulator import MaterialSimulator
from simulator.models import MachineState, SimEvent
from simulator.production_simulator import ProductionSimulator


class FactorySimulator:
    """High-level virtual factory orchestrator coordinating fleet, inventory, orders, and clock."""

    def __init__(
        self,
        config: Optional[FactoryConfig] = None,
        start_time: Optional[datetime] = None,
        random_seed: int = 42,
    ):
        self.config = config or DEFAULT_CONFIG
        self.clock = start_time or datetime(2026, 10, 10, 8, 0, 0)
        self.tick_minutes = self.config.simulation_tick_minutes
        
        self.event_generator = EventGenerator(prefix="SIM-EVT")
        self.machine_simulator = MachineSimulator(self.event_generator)
        self.material_simulator = MaterialSimulator(self.event_generator)
        self.production_simulator = ProductionSimulator(
            self.event_generator,
            self.machine_simulator,
            self.material_simulator,
            random_seed=random_seed,
        )

    def step(self, delta_minutes: Optional[float] = None) -> List[SimEvent]:
        """Advances the virtual factory clock by delta_minutes and executes one simulation step."""
        mins = delta_minutes if delta_minutes is not None else float(self.tick_minutes)
        self.clock += timedelta(minutes=mins)

        events_before_count = len(self.event_generator.get_events())

        # 1. Check incoming shipments
        self.material_simulator.process_incoming_deliveries(self.clock)

        # 2. Advance production orders
        self.production_simulator.advance_production(mins, self.clock)

        all_events = self.event_generator.get_events()
        return all_events[events_before_count:]

    def run_steps(self, num_steps: int) -> List[SimEvent]:
        """Runs the simulation for multiple sequential ticks."""
        new_events: List[SimEvent] = []
        for _ in range(num_steps):
            new_events.extend(self.step())
        return new_events

    def inject_breakdown(self, machine_id: str, reason: str = "simulated_motor_fault") -> bool:
        """Injects an unexpected machine breakdown at the current simulation time."""
        return self.machine_simulator.set_machine_state(
            machine_id,
            MachineState.BREAKDOWN,
            self.clock,
            reason=reason,
        )

    def repair_machine(self, machine_id: str) -> bool:
        """Restores a broken or maintenance machine to RUNNING or IDLE."""
        machine = self.machine_simulator.get_machine(machine_id)
        if not machine:
            return False

        target_state = MachineState.RUNNING if machine.assigned_order_id else MachineState.IDLE
        return self.machine_simulator.set_machine_state(
            machine_id,
            target_state,
            self.clock,
            reason="repair_completed",
        )

    def reassign_order(self, order_id: str, from_machine_id: str, to_machine_id: str) -> bool:
        """Reassigns an order from a broken/stalled machine to an alternative compatible machine."""
        order = self.production_simulator.get_order(order_id)
        to_machine = self.machine_simulator.get_machine(to_machine_id)
        from_machine = self.machine_simulator.get_machine(from_machine_id)

        if not order or not to_machine:
            return False

        # Remove from old machine
        if from_machine and from_machine.assigned_order_id == order_id:
            from_machine.assigned_order_id = None
            if from_machine.state == MachineState.RUNNING:
                self.machine_simulator.set_machine_state(
                    from_machine_id, MachineState.IDLE, self.clock, reason="order_reassigned"
                )

        # Remove old machine from order's assigned list
        if from_machine_id in order.assigned_machine_ids:
            order.assigned_machine_ids.remove(from_machine_id)

        # Assign to new machine
        order.assigned_machine_ids.append(to_machine_id)
        to_machine.assigned_order_id = order_id
        self.machine_simulator.set_machine_state(
            to_machine_id, MachineState.RUNNING, self.clock, reason="reassigned_work_started"
        )

        self.event_generator.create_event(
            event_type="order_reassigned",
            timestamp=self.clock,
            machine_id=to_machine_id,
            production_order_id=order_id,
            details={
                "from_machine_id": from_machine_id,
                "to_machine_id": to_machine_id,
            },
        )
        return True

    def inject_quality_spike(self, machine_id: str, multiplier: float = 4.0) -> None:
        """Increases defect probability on a specific machine to simulate tooling wear."""
        machine = self.machine_simulator.get_machine(machine_id)
        if machine:
            machine.defect_multiplier = multiplier

    def get_snapshot(self) -> Dict[str, Any]:
        """Provides a complete serializable state snapshot of the virtual factory."""
        return {
            "current_time": self.clock.isoformat(),
            "mill_name": self.config.mill_name,
            "source": self.config.data_source_label,
            "machines": [m.model_dump() for m in self.machine_simulator.machines.values()],
            "orders": [o.model_dump() for o in self.production_simulator.orders.values()],
            "inventory": [i.model_dump() for i in self.material_simulator.inventory.values()],
            "rolls": [r.model_dump() for r in self.production_simulator.rolls],
            "total_events": len(self.event_generator.get_events()),
        }
