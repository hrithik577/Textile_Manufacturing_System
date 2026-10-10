"""Safety-enforced execution engine requiring manager authorization and idempotency."""

from datetime import datetime
import hashlib
from typing import Any, Dict, Optional
from intelligence.data_access import BackendAdapter
from intelligence.models import RecoveryPlan, RecoveryPlanStatus


class RecoveryExecutor:
    """Executes authorized recovery actions safely with strict idempotency and audit trails."""

    def __init__(self, backend_adapter: BackendAdapter):
        self.backend = backend_adapter

    def execute_plan(
        self,
        plan_id: str,
        option_id: str,
        authorized_by: str,
        idempotency_key: Optional[str] = None,
        simulator_instance: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """Dispatches an approved recovery option to backend or simulation environment."""
        plan = self.backend.get_recovery_plan(plan_id)
        if not plan:
            return {"success": False, "error": f"Recovery plan {plan_id} not found."}

        # 1. Idempotency key check: If already executed with this key, return idempotent response
        effective_key = idempotency_key or hashlib.sha256(
            f"{plan_id}:{option_id}:{authorized_by}".encode("utf-8")
        ).hexdigest()[:16]

        if plan.idempotency_key == effective_key and plan.status == RecoveryPlanStatus.EXECUTED:
            return {
                "success": True,
                "status": "already_executed",
                "message": f"Action with idempotency key '{effective_key}' was already executed.",
            }

        # 2. Approval safety gate
        if plan.status != RecoveryPlanStatus.APPROVED:
            return {
                "success": False,
                "error": (
                    f"Execution rejected: Plan {plan_id} has status '{plan.status.value}'. "
                    "Safety policy strictly requires 'approved' status before execution."
                ),
            }

        # 3. Locate selected option
        selected_option = next((opt for opt in plan.options if opt.option_id == option_id), None)
        if not selected_option:
            return {"success": False, "error": f"Option {option_id} does not exist in plan {plan_id}."}

        if not selected_option.feasible:
            return {
                "success": False,
                "error": f"Cannot execute infeasible option: {selected_option.infeasibility_reason}",
            }

        # 4. Dispatch action execution
        action_type = selected_option.action_type
        params = selected_option.action_parameters
        execution_details: Dict[str, Any] = {"action_type": action_type, "parameters": params}

        if action_type == "reassign_machine" and simulator_instance:
            order_id = params.get("order_id")
            from_m = params.get("from_machine_id")
            to_m = params.get("to_machine_id")
            ok = simulator_instance.reassign_order(order_id, from_m, to_m)
            execution_details["simulator_reassigned"] = ok

        elif action_type == "execute_repair" and simulator_instance:
            m_id = params.get("machine_id")
            ok = simulator_instance.repair_machine(m_id)
            execution_details["simulator_repaired"] = ok

        elif action_type in ("authorize_overtime", "expedite_shipment", "reschedule_order"):
            # Administrative actions that require human supervisor or vendor confirmation
            execution_details["execution_mode"] = "manager_authorization_logged"
            execution_details["action_dispatched"] = True

        # 5. Record execution on backend
        backend_result = self.backend.execute_recovery_plan(plan_id, option_id, effective_key)

        return {
            "success": True,
            "plan_id": plan_id,
            "option_id": option_id,
            "status": "executed",
            "authorized_by": authorized_by,
            "idempotency_key": effective_key,
            "execution_details": execution_details,
            "backend_response": backend_result,
        }
