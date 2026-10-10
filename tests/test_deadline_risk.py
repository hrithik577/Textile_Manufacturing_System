"""Tests for completion forecasting and deadline risk prediction."""

from intelligence.deadline_predictor import DeadlinePredictor
from simulator.scenarios import scenario_a_normal_production, scenario_b_machine_breakdown


def test_normal_production_low_deadline_risk():
    sim = scenario_a_normal_production()
    predictor = DeadlinePredictor()

    risks = predictor.predict_deadlines(
        list(sim.production_simulator.orders.values()),
        list(sim.machine_simulator.machines.values()),
        sim.clock,
    )

    assert len(risks) == 1
    r = risks[0]
    assert r.risk_category in ("low", "medium")
    assert r.estimated_lateness_hours == 0.0
    assert len(r.assumptions) >= 2


def test_breakdown_induces_critical_deadline_risk():
    sim = scenario_b_machine_breakdown()
    predictor = DeadlinePredictor()

    risks = predictor.predict_deadlines(
        list(sim.production_simulator.orders.values()),
        list(sim.machine_simulator.machines.values()),
        sim.clock,
    )

    assert len(risks) == 1
    r = risks[0]
    assert r.risk_category in ("high", "critical")
    assert any("breakdown" in f.lower() for f in r.contributing_factors)
