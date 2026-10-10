"""Tests for process bottleneck detection and queue ranking."""

from intelligence.bottleneck_detector import BottleneckDetector
from simulator.scenarios import scenario_b_machine_breakdown


def test_bottleneck_ranking_under_breakdown():
    sim = scenario_b_machine_breakdown()

    detector = BottleneckDetector()
    findings = detector.detect_bottlenecks(
        list(sim.machine_simulator.machines.values()),
        list(sim.production_simulator.orders.values()),
    )

    assert len(findings) > 0
    # Top ranked bottleneck should be weaving because of the breakdown and pending queue
    top = findings[0]
    assert top.rank == 1
    assert top.process_type == "weaving"
    assert top.severity in ("critical", "high")
    assert "breakdown" in top.evidence_summary.lower()
