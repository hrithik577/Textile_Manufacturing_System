"""Tests for stable event generation, unique IDs, and replay safety."""

from datetime import datetime
from simulator.event_generator import EventGenerator


def test_unique_and_stable_event_ids():
    gen = EventGenerator(prefix="SIM-EVT")
    now = datetime(2026, 10, 10, 9, 0, 0)

    e1 = gen.create_event("machine_started", now, machine_id="M-01", details={"speed": 100})
    e2 = gen.create_event("machine_stopped", now, machine_id="M-01", details={"speed": 0})

    assert e1 is not None
    assert e2 is not None
    assert e1.event_id == "SIM-EVT-00001"
    assert e2.event_id == "SIM-EVT-00002"
    assert e1.source == "simulator"
    assert e2.source == "simulator"


def test_idempotent_event_deduplication():
    """Verify identical events with identical fingerprints are deduplicated."""
    gen = EventGenerator(prefix="SIM-EVT")
    now = datetime(2026, 10, 10, 9, 0, 0)

    e1 = gen.create_event("machine_breakdown", now, machine_id="M-01", details={"fault": "motor"})
    # Replay identical event
    e2 = gen.create_event("machine_breakdown", now, machine_id="M-01", details={"fault": "motor"})

    assert e1 is not None
    assert e2 is None  # Deduplicated and suppressed

    all_events = gen.get_events()
    assert len(all_events) == 1
