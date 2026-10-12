"""Tests for the Virtual Factory Simulator."""

from datetime import datetime, timedelta
import pytest
from simulator.models import MachineState, OrderStatus
from simulator.scenarios import (
    build_base_factory,
    scenario_a_normal_production,
    scenario_b_machine_breakdown,
)


def test_deterministic_simulation_with_fixed_seed():
    """Verify that identical random seeds produce identical simulation trajectories."""
    sim1 = scenario_a_normal_production(random_seed=123)
    sim2 = scenario_a_normal_production(random_seed=123)

    events1 = sim1.run_steps(4)
    events2 = sim2.run_steps(4)

    assert len(events1) == len(events2)
    for e1, e2 in zip(events1, events2):
        assert e1.event_type == e2.event_type
        assert e1.details == e2.details


def test_no_production_output_during_breakdown():
    """Verify that a broken machine strictly produces 0 output."""
    sim = scenario_b_machine_breakdown(random_seed=42)
    order = sim.production_simulator.get_order("PO-NORM-101")
    initial_produced = order.produced_quantity

    # Run for 2 hours while broken
    events = sim.step(delta_minutes=120.0)

    # Machine must remain in breakdown and produced quantity must not advance
    broken_loom = sim.machine_simulator.get_machine("M-LOOM-01")
    assert broken_loom.state == MachineState.BREAKDOWN
    assert order.produced_quantity == initial_produced

    # Ensure no production_output events were emitted by the broken machine
    prod_events = [
        e for e in events
        if e.event_type == "production_output" and e.machine_id == "M-LOOM-01"
    ]
    assert len(prod_events) == 0


def test_non_negative_stock_and_output():
    """Verify inventory and production amounts never drop below 0."""
    sim = build_base_factory()
    mat = sim.material_simulator.get_material("MAT-YARN-COTTON-40S")
    initial_stock = mat.total_stock

    # Attempt to consume more than available
    consumed = sim.material_simulator.consume_material(
        "MAT-YARN-COTTON-40S", initial_stock + 9999.0, "PO-TEST", sim.clock
    )

    assert consumed == initial_stock
    assert mat.total_stock == 0.0
    assert mat.available_stock == 0.0


def test_fast_reassignment_restores_production():
    """Verify that reassigning work to an idle machine resumes production."""
    sim = scenario_b_machine_breakdown(random_seed=42)
    order = sim.production_simulator.get_order("PO-NORM-101")
    initial_produced = order.produced_quantity

    # Reassign from broken M-LOOM-01 to idle M-LOOM-02
    success = sim.reassign_order("PO-NORM-101", "M-LOOM-01", "M-LOOM-02")
    assert success is True

    # Advance 1 hour
    events = sim.step(delta_minutes=60.0)

    assert order.produced_quantity > initial_produced
    loom2 = sim.machine_simulator.get_machine("M-LOOM-02")
    assert loom2.state == MachineState.RUNNING
