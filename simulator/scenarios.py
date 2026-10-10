"""Repeatable, seed-deterministic industrial scenarios for Everest Textile OS."""

from datetime import datetime, timedelta
from typing import Tuple
from simulator.config import FactoryConfig
from simulator.factory_simulator import FactorySimulator
from simulator.models import (
    MachineState,
    MaterialBatch,
    MaterialInventory,
    OrderPriority,
    OrderStatus,
    ProcessType,
    ProductionOrder,
    VirtualMachine,
)


def build_base_factory(random_seed: int = 42) -> FactorySimulator:
    """Instantiates a standard factory layout with spinning, weaving, dyeing, and inspection units."""
    start_time = datetime(2026, 10, 10, 8, 0, 0)
    sim = FactorySimulator(start_time=start_time, random_seed=random_seed)

    # 1. Setup Virtual Machinery fleet
    machines = [
        VirtualMachine(
            machine_id="M-SPIN-01",
            name="Rieter Ring Spinning Frame 1",
            process_type=ProcessType.SPINNING,
            state=MachineState.RUNNING,
            rate_per_hour=60.0,
            output_unit="kg",
            efficiency=0.92,
            last_updated_at=start_time,
        ),
        VirtualMachine(
            machine_id="M-LOOM-01",
            name="Toyota JAT810 Air-Jet Loom 1",
            process_type=ProcessType.WEAVING,
            state=MachineState.RUNNING,
            rate_per_hour=50.0,
            output_unit="meters",
            efficiency=0.95,
            last_updated_at=start_time,
        ),
        VirtualMachine(
            machine_id="M-LOOM-02",
            name="Toyota JAT810 Air-Jet Loom 2",
            process_type=ProcessType.WEAVING,
            state=MachineState.IDLE,
            rate_per_hour=50.0,
            output_unit="meters",
            efficiency=0.95,
            last_updated_at=start_time,
        ),
        VirtualMachine(
            machine_id="M-DYE-01",
            name="Thies Soft-TRD Jet Dyeing Vessel",
            process_type=ProcessType.DYEING_FINISHING,
            state=MachineState.RUNNING,
            rate_per_hour=75.0,
            output_unit="meters",
            efficiency=0.90,
            last_updated_at=start_time,
        ),
        VirtualMachine(
            machine_id="M-INSP-01",
            name="Uster Fabric 4-Point Inspection Line",
            process_type=ProcessType.INSPECTION,
            state=MachineState.RUNNING,
            rate_per_hour=100.0,
            output_unit="meters",
            efficiency=0.98,
            last_updated_at=start_time,
        ),
    ]
    for m in machines:
        sim.machine_simulator.register_machine(m)

    # 2. Setup Raw Material Inventory
    materials = [
        MaterialInventory(
            material_id="MAT-YARN-COTTON-40S",
            name="Ne 40/1 Combed Cotton Warp Yarn",
            unit="kg",
            total_stock=2500.0,
            reserved_stock=500.0,
            incoming_batches=[
                MaterialBatch(
                    batch_id="BATCH-IN-901",
                    material_id="MAT-YARN-COTTON-40S",
                    quantity=1000.0,
                    expected_arrival=start_time + timedelta(hours=6),
                    status="in_transit",
                )
            ],
        ),
        MaterialInventory(
            material_id="MAT-DYE-REACTIVE-BLUE",
            name="Reactive Navy Blue Dye RGB-01",
            unit="kg",
            total_stock=350.0,
            reserved_stock=50.0,
        ),
        MaterialInventory(
            material_id="MAT-POLYESTER-150D",
            name="150 Denier Texturized Polyester Weft",
            unit="kg",
            total_stock=1800.0,
            reserved_stock=200.0,
        ),
    ]
    for mat in materials:
        sim.material_simulator.register_material(mat)

    return sim


def scenario_a_normal_production(random_seed: int = 42) -> FactorySimulator:
    """Scenario A: Normal production with balanced capacity and adequate stock."""
    sim = build_base_factory(random_seed=random_seed)

    order = ProductionOrder(
        order_id="PO-NORM-101",
        customer_name="Nordic Apparel Group",
        fabric_type="Cotton Twill 220 GSM",
        ordered_quantity=1000.0,
        produced_quantity=150.0,
        unit="meters",
        stages_required=["raw_material_prep", "weaving", "dyeing_finishing", "inspection"],
        current_stage="weaving",
        deadline=sim.clock + timedelta(hours=24),
        created_at=sim.clock - timedelta(hours=3),
        status=OrderStatus.IN_PROGRESS,
        priority=OrderPriority.NORMAL,
        required_materials={"MAT-YARN-COTTON-40S": 250.0},
        reserved_materials={"MAT-YARN-COTTON-40S": 250.0},
        assigned_machine_ids=["M-LOOM-01"],
    )
    sim.production_simulator.register_order(order)
    sim.machine_simulator.assign_order("M-LOOM-01", order.order_id, sim.clock)
    return sim


def scenario_b_machine_breakdown(random_seed: int = 42) -> FactorySimulator:
    """Scenario B: Loom breakdown causing immediate stoppage and deadline risk."""
    sim = scenario_a_normal_production(random_seed=random_seed)
    # Inject breakdown on active loom M-LOOM-01
    sim.inject_breakdown("M-LOOM-01", reason="main_drive_motor_bearing_failure")
    return sim


def scenario_c_material_shortage(random_seed: int = 42) -> FactorySimulator:
    """Scenario C: Production order with acute raw material stock deficit."""
    sim = build_base_factory(random_seed=random_seed)

    # Exhaust available stock and clear incoming batches to create acute shortage
    mat = sim.material_simulator.get_material("MAT-YARN-COTTON-40S")
    if mat:
        mat.total_stock = 30.0  # severely depleted
        mat.reserved_stock = 25.0
        mat.incoming_batches = []

    order = ProductionOrder(
        order_id="PO-MAT-301",
        customer_name="Global FastFashion Ltd",
        fabric_type="Poplin Shirting 110 GSM",
        ordered_quantity=2000.0,
        produced_quantity=0.0,
        unit="meters",
        stages_required=["weaving", "inspection"],
        current_stage="weaving",
        deadline=sim.clock + timedelta(hours=10),
        created_at=sim.clock - timedelta(hours=1),
        status=OrderStatus.IN_PROGRESS,
        priority=OrderPriority.HIGH,
        required_materials={"MAT-YARN-COTTON-40S": 500.0},
        reserved_materials={"MAT-YARN-COTTON-40S": 5.0},
        assigned_machine_ids=["M-LOOM-01"],
    )
    sim.production_simulator.register_order(order)
    sim.machine_simulator.assign_order("M-LOOM-01", order.order_id, sim.clock)
    return sim


def scenario_d_quality_deterioration(random_seed: int = 42) -> FactorySimulator:
    """Scenario D: Tooling wear causing severe defect spikes and quarantined rolls."""
    sim = scenario_a_normal_production(random_seed=random_seed)
    # Increase defect multiplier on active loom to 5x
    sim.inject_quality_spike("M-LOOM-01", multiplier=5.0)
    return sim


def scenario_e_urgent_customer_order(random_seed: int = 42) -> FactorySimulator:
    """Scenario E: Rush order with very short delivery window needing rapid prioritization."""
    sim = build_base_factory(random_seed=random_seed)

    # Existing loaded order on M-LOOM-01
    existing_order = ProductionOrder(
        order_id="PO-BASE-001",
        customer_name="Standard Fabrics Co",
        fabric_type="Canvas 300 GSM",
        ordered_quantity=1500.0,
        produced_quantity=200.0,
        unit="meters",
        deadline=sim.clock + timedelta(hours=48),
        created_at=sim.clock - timedelta(hours=4),
        status=OrderStatus.IN_PROGRESS,
        priority=OrderPriority.NORMAL,
        required_materials={"MAT-YARN-COTTON-40S": 375.0},
        reserved_materials={"MAT-YARN-COTTON-40S": 375.0},
        assigned_machine_ids=["M-LOOM-01"],
    )
    sim.production_simulator.register_order(existing_order)
    sim.machine_simulator.assign_order("M-LOOM-01", existing_order.order_id, sim.clock)

    # Urgent order with tight deadline (4 hours for 300 meters)
    rush_order = ProductionOrder(
        order_id="PO-RUSH-999",
        customer_name="Premier Haute Couture",
        fabric_type="Luxury Sateen 250 GSM",
        ordered_quantity=300.0,
        produced_quantity=0.0,
        unit="meters",
        stages_required=["weaving", "inspection"],
        current_stage="weaving",
        deadline=sim.clock + timedelta(hours=5),
        created_at=sim.clock,
        status=OrderStatus.PENDING,
        priority=OrderPriority.URGENT,
        required_materials={"MAT-YARN-COTTON-40S": 75.0},
        reserved_materials={"MAT-YARN-COTTON-40S": 75.0},
        assigned_machine_ids=[],
    )
    sim.production_simulator.register_order(rush_order)
    return sim


def load_scenario(scenario_name: str, random_seed: int = 42) -> FactorySimulator:
    """Helper to select scenario by name."""
    scenarios = {
        "scenario_a": scenario_a_normal_production,
        "scenario_b": scenario_b_machine_breakdown,
        "scenario_c": scenario_c_material_shortage,
        "scenario_d": scenario_d_quality_deterioration,
        "scenario_e": scenario_e_urgent_customer_order,
    }
    key = scenario_name.lower().replace("-", "_").replace(" ", "_")
    func = scenarios.get(key)
    if not func:
        raise ValueError(f"Unknown scenario: {scenario_name}. Options: {list(scenarios.keys())}")
    return func(random_seed=random_seed)
