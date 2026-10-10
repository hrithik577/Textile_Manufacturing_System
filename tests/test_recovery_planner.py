"""Tests for multi-option recovery generation and feasibility evaluation."""

from intelligence.deadline_predictor import DeadlinePredictor
from intelligence.models import RecoveryPlanStatus
from intelligence.recovery_planner import RecoveryPlanner
from intelligence.root_cause_analyzer import RootCauseAnalyzer
from simulator.scenarios import scenario_b_machine_breakdown


def test_recovery_planner_generates_feasible_alternatives():
    sim = scenario_b_machine_breakdown()
    order = sim.production_simulator.get_order("PO-NORM-101")
    machines = list(sim.machine_simulator.machines.values())

    rca = RootCauseAnalyzer().analyze_order_issue(
        order=order,
        deadline_risk=None,
        machines=machines,
        material_risks=[],
        quality_risks=[],
        bottlenecks=[],
        recent_events=sim.event_generator.get_events(),
    )

    planner = RecoveryPlanner()
    plan = planner.plan_recovery(
        alert_id="ALT-TEST-001",
        order=order,
        root_cause=rca,
        deadline_risk=None,
        machines=machines,
        material_risks=[],
        quality_risks=[],
        current_time=sim.clock,
    )

    assert plan.status == RecoveryPlanStatus.AWAITING_APPROVAL
    assert plan.approval_required is True
    assert len(plan.options) >= 3

    # Check that feasible options have positive scores and detailed breakdowns
    feasible_options = [o for o in plan.options if o.feasible]
    assert len(feasible_options) >= 2

    top_opt = feasible_options[0]
    assert top_opt.score > 0.0
    assert "delivery_impact" in top_opt.score_breakdown
    assert "cost_efficiency" in top_opt.score_breakdown
    assert "feasibility" in top_opt.score_breakdown
    assert "operational_risk" in top_opt.score_breakdown
