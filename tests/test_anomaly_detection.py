"""Tests for explainable anomaly detection."""

from datetime import datetime
from intelligence.anomaly_detector import AnomalyDetector
from simulator.event_generator import EventGenerator
from simulator.models import MachineState, ProcessType, VirtualMachine
from simulator.scenarios import scenario_b_machine_breakdown, scenario_d_quality_deterioration


def test_detect_breakdown_with_active_order():
    sim = scenario_b_machine_breakdown()
    sim.step(15)  # Let breakdown be registered in events

    detector = AnomalyDetector()
    findings = detector.detect_anomalies(
        list(sim.machine_simulator.machines.values()),
        sim.event_generator.get_events(),
        sim.clock,
    )

    crit_anomalies = [f for f in findings if f.anomaly_type == "active_order_on_broken_machine"]
    assert len(crit_anomalies) >= 1
    finding = crit_anomalies[0]
    assert finding.affected_entity_id == "M-LOOM-01"
    assert finding.severity == "critical"
    assert len(finding.supporting_event_ids) >= 1


def test_detect_high_defect_rate():
    sim = scenario_d_quality_deterioration()
    # Advance several steps to accumulate quality events
    sim.run_steps(8)

    detector = AnomalyDetector(warning_defect_threshold_percent=5.0)
    findings = detector.detect_anomalies(
        list(sim.machine_simulator.machines.values()),
        sim.event_generator.get_events(),
        sim.clock,
    )

    defect_findings = [f for f in findings if f.anomaly_type == "high_defect_rate"]
    assert len(defect_findings) >= 1
    assert defect_findings[0].affected_entity_id == "M-LOOM-01"
    assert len(defect_findings[0].supporting_event_ids) > 0
