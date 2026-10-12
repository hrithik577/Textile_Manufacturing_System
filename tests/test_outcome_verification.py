"""Tests for evidence-based recovery outcome verification."""

from intelligence.data_access import InMemoryBackendAdapter
from intelligence.models import RecoveryPlanStatus
from intelligence.outcome_verifier import OutcomeVerifier
from intelligence.recovery_executor import RecoveryExecutor
from intelligence.recovery_planner import RecoveryPlanner
from intelligence.root_cause_analyzer import RootCauseAnalyzer
from simulator.scenarios import scenario_b_machine_breakdown


def test_outcome_verification_verifies_on_production_resumption():
    sim = scenario_b_machine_breakdown()
    order = sim.production_simulator.get_order("PO-NORM-101")
    machines = list(sim.machine_simulator.machines.values())

    rca = RootCauseAnalyzer().analyze_order_issue(
        order, None, machines, [], [], [], sim.event_generator.get_events()
    )
    plan = RecoveryPlanner().plan_recovery(
        "ALT-TEST-004", order, rca, None, machines, [], [], sim.clock
    )

    adapter = InMemoryBackendAdapter()
    adapter.save_recovery_plan(plan)
    adapter.approve_recovery_plan(plan.plan_id, manager_id="MGR-HARSHA")

    executor = RecoveryExecutor(adapter)
    executor.execute_plan(
        plan.plan_id, "OPT-REASSIGN", authorized_by="MGR-HARSHA", simulator_instance=sim
    )

    # Inconclusive immediately with no subsequent events
    verifier = OutcomeVerifier(adapter)
    ver_init = verifier.verify_plan_outcome(plan.plan_id, subsequent_events=[], order_produced_delta=0.0)
    assert ver_init["verification_result"] == "inconclusive"

    # Advance simulation by 60 minutes so the newly assigned loom produces fabric
    subsequent_events = sim.step(delta_minutes=60.0)

    # Verify outcome
    ver_final = verifier.verify_plan_outcome(plan.plan_id, subsequent_events=subsequent_events)
    assert ver_final["verification_result"] == "verified"
    assert "production successfully resumed" in ver_final["details"].lower()

    # Plan in backend should now be marked VERIFIED
    updated_plan = adapter.get_recovery_plan(plan.plan_id)
    assert updated_plan.status == RecoveryPlanStatus.VERIFIED
