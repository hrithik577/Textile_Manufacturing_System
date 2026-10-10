"""Virtual machine state management and rate calculations."""

from datetime import datetime
from typing import Dict, List, Optional
from simulator.event_generator import EventGenerator
from simulator.models import MachineState, ProcessType, VirtualMachine


class MachineSimulator:
    """Simulates fleet of textile machines with realistic constraints and state transitions."""

    def __init__(self, event_generator: EventGenerator):
        self.machines: Dict[str, VirtualMachine] = {}
        self.events = event_generator

    def register_machine(self, machine: VirtualMachine) -> None:
        """Register a machine in the virtual factory fleet."""
        self.machines[machine.machine_id] = machine

    def get_machine(self, machine_id: str) -> Optional[VirtualMachine]:
        return self.machines.get(machine_id)

    def get_machines_by_process(self, process_type: ProcessType) -> List[VirtualMachine]:
        return [m for m in self.machines.values() if m.process_type == process_type]

    def get_idle_machines_for_process(self, process_type: ProcessType) -> List[VirtualMachine]:
        return [
            m for m in self.machines.values()
            if m.process_type == process_type and m.state == MachineState.IDLE
        ]

    def set_machine_state(
        self,
        machine_id: str,
        target_state: MachineState,
        timestamp: datetime,
        reason: Optional[str] = None,
    ) -> bool:
        """Transitions a machine's state and generates appropriate operational events."""
        machine = self.machines.get(machine_id)
        if not machine:
            return False

        old_state = machine.state
        if old_state == target_state:
            return True

        machine.state = target_state
        machine.last_updated_at = timestamp
        machine.downtime_reason = reason if target_state in (MachineState.BREAKDOWN, MachineState.MAINTENANCE) else None

        # Emit typed event
        if target_state == MachineState.RUNNING:
            self.events.create_event(
                event_type="machine_started",
                timestamp=timestamp,
                machine_id=machine_id,
                production_order_id=machine.assigned_order_id,
                details={"previous_state": old_state.value, "reason": reason or "normal_dispatch"},
            )
        elif target_state == MachineState.BREAKDOWN:
            self.events.create_event(
                event_type="machine_breakdown",
                timestamp=timestamp,
                machine_id=machine_id,
                production_order_id=machine.assigned_order_id,
                details={
                    "previous_state": old_state.value,
                    "reason": reason or "simulated_mechanical_fault",
                    "severity": "critical",
                },
            )
        elif target_state == MachineState.MAINTENANCE:
            self.events.create_event(
                event_type="maintenance_started",
                timestamp=timestamp,
                machine_id=machine_id,
                production_order_id=machine.assigned_order_id,
                details={"reason": reason or "scheduled_preventive_maintenance"},
            )
        elif target_state == MachineState.IDLE:
            if old_state == MachineState.MAINTENANCE:
                self.events.create_event(
                    event_type="maintenance_completed",
                    timestamp=timestamp,
                    machine_id=machine_id,
                    details={"status": "nominal"},
                )
            else:
                self.events.create_event(
                    event_type="machine_stopped",
                    timestamp=timestamp,
                    machine_id=machine_id,
                    production_order_id=machine.assigned_order_id,
                    details={"previous_state": old_state.value, "reason": reason or "order_unassigned_or_completed"},
                )

        return True

    def assign_order(self, machine_id: str, order_id: str, timestamp: datetime) -> bool:
        """Assign an order to a machine, transitioning to RUNNING if machine is IDLE."""
        machine = self.machines.get(machine_id)
        if not machine or machine.state == MachineState.BREAKDOWN:
            return False

        machine.assigned_order_id = order_id
        if machine.state == MachineState.IDLE:
            self.set_machine_state(machine_id, MachineState.RUNNING, timestamp, reason="order_assigned")
        return True

    def calculate_potential_output(self, machine_id: str, delta_minutes: float) -> float:
        """Calculates valid production output. Strictly returns 0 if machine is not running."""
        machine = self.machines.get(machine_id)
        if not machine or machine.state != MachineState.RUNNING:
            return 0.0

        hours = delta_minutes / 60.0
        output = machine.rate_per_hour * hours * machine.efficiency
        return max(0.0, output)

    def record_tick_activity(self, machine_id: str, delta_minutes: float, actual_output: float) -> None:
        """Updates internal operational counters."""
        machine = self.machines.get(machine_id)
        if not machine:
            return

        if machine.state == MachineState.RUNNING:
            machine.total_operating_minutes += delta_minutes
            machine.accumulated_output += actual_output
        elif machine.state in (MachineState.BREAKDOWN, MachineState.MAINTENANCE):
            machine.total_downtime_minutes += delta_minutes
