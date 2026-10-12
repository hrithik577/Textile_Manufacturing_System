"""Tests for recovery execution safety gates and idempotency protection."""

from intelligence.data_access import InMemoryBackendAdapter
from intelligence.models import RecoveryPlan, RecoveryPlanStatus
from intelligence.recovery_executor import RecoveryExecutor
from intelligence.recovery_planner import RecoveryPlanner
from intelligence.root_cause_analyzer import RootCauseAnalyzer
from simulator.scenarios import scenario_b_machine_breakdown


def test_cannot_execute_unapproved_plan():
    """Verify that unapproved plans are strictly rejected by the execution engine."""
    sim = scenario_b_machine_breakdown()
    order = sim.production_simulator.get_order("PO-NORM-101")
    machines = list(sim.machine_simulator.machines.values())

    rca = RootCauseAnalyzer().analyze_order_issue(
        order, None, machines, [], [], [], sim.event_generator.get_events()
    )
    plan = RecoveryPlanner().plan_recovery(
        "ALT-TEST-002", order, rca, None, machines, [], [], sim.clock
    )

    adapter = InMemoryBackendAdapter()
    adapter.save_recovery_plan(plan)

    executor = RecoveryExecutor(adapter)
    # Attempt to execute while still in awaiting_approval status
    result = executor.execute_plan(plan.plan_id, "OPT-REASSIGN", authorized_by="OPERATOR-1")

    assert result["success"] is False
    assert "safety policy strictly requires 'approved' status" in result["error"].lower()


def test_idempotent_execution_protection():
    """Verify that executing with the same idempotency key does not duplicate execution."""
    sim = scenario_b_machine_breakdown()
    order = sim.production_simulator.get_order("PO-NORM-101")
    machines = list(sim.machine_simulator.machines.values())

    rca = RootCauseAnalyzer().analyze_order_issue(
        order, None, machines, [], [], [], sim.event_generator.get_events()
    )
    plan = RecoveryPlanner().plan_recovery(
        "ALT-TEST-003", order, rca, None, machines, [], [], sim.clock
    )

    adapter = InMemoryBackendAdapter()
    adapter.save_recovery_plan(plan)

    # Manager approves
    approved = adapter.approve_recovery_plan(plan.plan_id, manager_id="MGR-HARSHA")
    assert approved is True

    executor = RecoveryExecutor(adapter)
    key = "IDEM-KEY-9999"

    # First execution
    res1 = executor.execute_plan(
        plan.plan_id, "OPT-REASSIGN", authorized_by="MGR-HARSHA", idempotency_key=key, simulator_instance=sim
    )
    assert res1["success"] is True
    assert res1["status"] == "executed"

    # Second execution with same key
    res2 = executor.execute_plan(
        plan.plan_id, "OPT-REASSIGN", authorized_by="MGR-HARSHA", idempotency_key=key, simulator_instance=sim
    )
    assert res2["success"] is True
    assert res2["status"] == "already_executed"
