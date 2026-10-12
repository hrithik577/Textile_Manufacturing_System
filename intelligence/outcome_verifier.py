"""Evidence-based outcome verification comparing subsequent events with recovery expectations."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from intelligence.data_access import BackendAdapter
from intelligence.models import RecoveryPlan, RecoveryPlanStatus
from simulator.models import SimEvent


class OutcomeVerifier:
    """Verifies whether an executed recovery plan actually resolved the abnormal condition."""

    def __init__(self, backend_adapter: BackendAdapter):
        self.backend = backend_adapter

    def verify_plan_outcome(
        self,
        plan_id: str,
        subsequent_events: List[SimEvent],
        order_produced_delta: float = 0.0,
    ) -> Dict[str, Any]:
        plan = self.backend.get_recovery_plan(plan_id)
        if not plan:
            return {"success": False, "error": f"Plan {plan_id} not found."}

        if plan.status not in (RecoveryPlanStatus.EXECUTED, RecoveryPlanStatus.VERIFIED, RecoveryPlanStatus.VERIFICATION_FAILED):
            return {
                "success": False,
                "error": f"Plan cannot be verified in current status '{plan.status.value}'. Must be 'executed'.",
            }

        # Check subsequent events for evidence of operational improvement
        output_events = [e for e in subsequent_events if e.event_type == "production_output"]
        breakdown_events = [e for e in subsequent_events if e.event_type == "machine_breakdown"]

        if not subsequent_events and order_produced_delta <= 0.0:
            result = "inconclusive"
            details = "No subsequent simulation events observed yet to assess recovery impact."

        elif order_produced_delta > 0.0 or len(output_events) > 0:
            total_produced_subsequent = sum(
                e.details.get("output_quantity", 0.0) for e in output_events
            ) + order_produced_delta

            result = "verified"
            details = (
                f"Recovery verified: Production successfully resumed. Observed {len(output_events)} "
                f"production output events and {round(total_produced_subsequent, 1)} units produced post-execution."
            )

        elif len(breakdown_events) > 0:
            result = "failed"
            details = (
                f"Verification failed: Machine experienced breakdown again post-execution. "
                f"Event IDs: {[e.event_id for e in breakdown_events]}."
            )

        else:
            result = "inconclusive"
            details = "Observed events do not yet show definitive throughput recovery."

        # Update the backend plan status
        self.backend.update_plan_verification(plan_id, result, details)

        return {
            "success": True,
            "plan_id": plan_id,
            "verification_result": result,
            "details": details,
            "subsequent_events_count": len(subsequent_events),
        }
