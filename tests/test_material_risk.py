"""Tests for material shortage detection and inventory risk evaluation."""

from intelligence.material_risk import MaterialRiskAnalyzer
from simulator.scenarios import scenario_c_material_shortage


def test_detect_material_shortage():
    sim = scenario_c_material_shortage()
    # Step simulation to trigger shortage checks
    sim.step(15)

    analyzer = MaterialRiskAnalyzer()
    risks = analyzer.analyze_order_material_risks(
        list(sim.production_simulator.orders.values()),
        list(sim.material_simulator.inventory.values()),
        sim.event_generator.get_events(),
        sim.clock,
    )

    assert len(risks) >= 1
    shortage_risk = next((r for r in risks if r.material_id == "MAT-YARN-COTTON-40S"), None)
    assert shortage_risk is not None
    assert shortage_risk.shortage_quantity > 0.0
    assert shortage_risk.risk_level in ("high", "critical")
    assert "deficit" in shortage_risk.explanation.lower()
