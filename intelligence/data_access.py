"""Data access adapter isolating the Intelligence Engine from backend HTTP / DB details.

Provides an InMemoryBackendAdapter for local simulation and testing,
and an HttpBackendAdapter connecting to Member 2's FastAPI service.
"""

from abc import ABC, abstractmethod
from datetime import datetime
import logging
import os
from typing import Any, Dict, List, Optional
import requests
from intelligence.models import RecoveryPlan, RecoveryPlanStatus
from simulator.models import FabricRoll, MaterialInventory, ProductionOrder, SimEvent, VirtualMachine

logger = logging.getLogger(__name__)


class BackendAdapter(ABC):
    """Abstract interface defining the contract with Member 2's backend."""

    @abstractmethod
    def get_machines(self) -> List[VirtualMachine]:
        pass

    @abstractmethod
    def get_orders(self) -> List[ProductionOrder]:
        pass

    @abstractmethod
    def get_materials(self) -> List[MaterialInventory]:
        pass

    @abstractmethod
    def get_rolls(self) -> List[FabricRoll]:
        pass

    @abstractmethod
    def post_event(self, event: SimEvent) -> bool:
        pass

    @abstractmethod
    def post_alert(self, alert_payload: Dict[str, Any]) -> str:
        pass

    @abstractmethod
    def save_recovery_plan(self, plan: RecoveryPlan) -> bool:
        pass

    @abstractmethod
    def get_recovery_plan(self, plan_id: str) -> Optional[RecoveryPlan]:
        pass

    @abstractmethod
    def approve_recovery_plan(self, plan_id: str, manager_id: str) -> bool:
        pass

    @abstractmethod
    def execute_recovery_plan(self, plan_id: str, option_id: str, idempotency_key: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def update_plan_verification(self, plan_id: str, result: str, details: str) -> bool:
        pass


class InMemoryBackendAdapter(BackendAdapter):
    """In-memory backend fixture for deterministic local testing and standalone demos.
    
    Explicitly labelled as a simulated adapter.
    """

    def __init__(self):
        self.adapter_mode = "in_memory_simulation_fixture"
        self.machines: Dict[str, VirtualMachine] = {}
        self.orders: Dict[str, ProductionOrder] = {}
        self.materials: Dict[str, MaterialInventory] = {}
        self.rolls: List[FabricRoll] = []
        self.events: List[SimEvent] = []
        self.alerts: List[Dict[str, Any]] = []
        self.recovery_plans: Dict[str, RecoveryPlan] = {}
        self.executed_idempotency_keys: set = set()

    def sync_from_simulator(self, simulator_instance) -> None:
        """Populates internal stores directly from a FactorySimulator instance."""
        self.machines = dict(simulator_instance.machine_simulator.machines)
        self.orders = dict(simulator_instance.production_simulator.orders)
        self.materials = dict(simulator_instance.material_simulator.inventory)
        self.rolls = list(simulator_instance.production_simulator.rolls)
        self.events = simulator_instance.event_generator.get_events()

    def get_machines(self) -> List[VirtualMachine]:
        return list(self.machines.values())

    def get_orders(self) -> List[ProductionOrder]:
        return list(self.orders.values())

    def get_materials(self) -> List[MaterialInventory]:
        return list(self.materials.values())

    def get_rolls(self) -> List[FabricRoll]:
        return list(self.rolls)

    def post_event(self, event: SimEvent) -> bool:
        self.events.append(event)
        return True

    def post_alert(self, alert_payload: Dict[str, Any]) -> str:
        alert_id = f"ALT-{len(self.alerts) + 1:04d}"
        alert_payload["alert_id"] = alert_id
        alert_payload["created_at"] = datetime.now().isoformat()
        self.alerts.append(alert_payload)
        return alert_id

    def save_recovery_plan(self, plan: RecoveryPlan) -> bool:
        self.recovery_plans[plan.plan_id] = plan
        return True

    def get_recovery_plan(self, plan_id: str) -> Optional[RecoveryPlan]:
        return self.recovery_plans.get(plan_id)

    def approve_recovery_plan(self, plan_id: str, manager_id: str) -> bool:
        plan = self.recovery_plans.get(plan_id)
        if not plan:
            return False
        plan.status = RecoveryPlanStatus.APPROVED
        plan.approved_by = manager_id
        plan.approved_at = datetime.now()
        return True

    def execute_recovery_plan(self, plan_id: str, option_id: str, idempotency_key: str) -> Dict[str, Any]:
        plan = self.recovery_plans.get(plan_id)
        if not plan:
            return {"success": False, "error": f"Plan {plan_id} not found"}

        if idempotency_key in self.executed_idempotency_keys:
            return {
                "success": True,
                "status": "already_executed",
                "message": f"Idempotency key {idempotency_key} already processed.",
            }

        if plan.status != RecoveryPlanStatus.APPROVED:
            return {
                "success": False,
                "error": f"Cannot execute plan in status '{plan.status.value}'. Must be 'approved'.",
            }

        selected_opt = next((o for o in plan.options if o.option_id == option_id), None)
        if not selected_opt:
            return {"success": False, "error": f"Option {option_id} not found in plan."}

        if not selected_opt.feasible:
            return {
                "success": False,
                "error": f"Option {option_id} is marked infeasible: {selected_opt.infeasibility_reason}",
            }

        self.executed_idempotency_keys.add(idempotency_key)
        plan.status = RecoveryPlanStatus.EXECUTED
        plan.idempotency_key = idempotency_key
        plan.executed_action = {
            "option_id": option_id,
            "action_type": selected_opt.action_type,
            "parameters": selected_opt.action_parameters,
        }
        plan.executed_at = datetime.now()

        return {
            "success": True,
            "status": "executed",
            "action_type": selected_opt.action_type,
            "parameters": selected_opt.action_parameters,
        }

    def update_plan_verification(self, plan_id: str, result: str, details: str) -> bool:
        plan = self.recovery_plans.get(plan_id)
        if not plan:
            return False
        plan.verification_result = result
        plan.verification_details = details
        plan.status = (
            RecoveryPlanStatus.VERIFIED if result == "verified" else RecoveryPlanStatus.VERIFICATION_FAILED
        )
        return True


class HttpBackendAdapter(BackendAdapter):
    """HTTP client communicating with Member 2's FastAPI service."""

    def __init__(self, base_url: Optional[str] = None, timeout: float = 5.0):
        self.base_url = (base_url or os.getenv("EVEREST_API_BASE_URL", "http://localhost:8000")).rstrip("/")
        self.timeout = timeout
        self.session = requests.Session()

    def get_machines(self) -> List[VirtualMachine]:
        resp = self.session.get(f"{self.base_url}/api/v1/machines", timeout=self.timeout)
        resp.raise_for_status()
        return [VirtualMachine(**m) for m in resp.json()]

    def get_orders(self) -> List[ProductionOrder]:
        resp = self.session.get(f"{self.base_url}/api/v1/production/orders", timeout=self.timeout)
        resp.raise_for_status()
        return [ProductionOrder(**o) for o in resp.json()]

    def get_materials(self) -> List[MaterialInventory]:
        resp = self.session.get(f"{self.base_url}/api/v1/inventory/materials", timeout=self.timeout)
        resp.raise_for_status()
        return [MaterialInventory(**m) for m in resp.json()]

    def get_rolls(self) -> List[FabricRoll]:
        resp = self.session.get(f"{self.base_url}/api/v1/quality/rolls", timeout=self.timeout)
        resp.raise_for_status()
        return [FabricRoll(**r) for r in resp.json()]

    def post_event(self, event: SimEvent) -> bool:
        resp = self.session.post(
            f"{self.base_url}/api/v1/production/events",
            json=event.model_dump(mode="json"),
            timeout=self.timeout,
        )
        return resp.status_code in (200, 201, 202)

    def post_alert(self, alert_payload: Dict[str, Any]) -> str:
        resp = self.session.post(
            f"{self.base_url}/api/v1/alerts",
            json=alert_payload,
            timeout=self.timeout,
        )
        resp.raise_for_status()
        return resp.json().get("alert_id", "ALT-UNKNOWN")

    def save_recovery_plan(self, plan: RecoveryPlan) -> bool:
        resp = self.session.post(
            f"{self.base_url}/api/v1/recovery-plans",
            json=plan.model_dump(mode="json"),
            timeout=self.timeout,
        )
        return resp.status_code in (200, 201)

    def get_recovery_plan(self, plan_id: str) -> Optional[RecoveryPlan]:
        resp = self.session.get(f"{self.base_url}/api/v1/recovery-plans/{plan_id}", timeout=self.timeout)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return RecoveryPlan(**resp.json())

    def approve_recovery_plan(self, plan_id: str, manager_id: str) -> bool:
        resp = self.session.post(
            f"{self.base_url}/api/v1/recovery-plans/{plan_id}/approve",
            json={"manager_id": manager_id},
            timeout=self.timeout,
        )
        return resp.status_code == 200

    def execute_recovery_plan(self, plan_id: str, option_id: str, idempotency_key: str) -> Dict[str, Any]:
        resp = self.session.post(
            f"{self.base_url}/api/v1/recovery-plans/{plan_id}/execute",
            json={"option_id": option_id, "idempotency_key": idempotency_key},
            timeout=self.timeout,
        )
        return resp.json()

    def update_plan_verification(self, plan_id: str, result: str, details: str) -> bool:
        resp = self.session.patch(
            f"{self.base_url}/api/v1/recovery-plans/{plan_id}/verification",
            json={"verification_result": result, "verification_details": details},
            timeout=self.timeout,
        )
        return resp.status_code == 200
