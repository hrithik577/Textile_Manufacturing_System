"""Everest Textile OS — End-to-End Closed-Loop Demonstration Script.

Demonstrates the complete operational intelligence lifecycle:
Simulate factory operations → Detect abnormal condition → Identify affected order
→ Diagnose likely causes → Compare recovery options → Request approval
→ Execute approved action → Verify outcome improvement.
"""

from datetime import datetime
import json
import time
from intelligence.anomaly_detector import AnomalyDetector
from intelligence.bottleneck_detector import BottleneckDetector
from intelligence.data_access import InMemoryBackendAdapter
from intelligence.deadline_predictor import DeadlinePredictor
from intelligence.material_risk import MaterialRiskAnalyzer
from intelligence.outcome_verifier import OutcomeVerifier
from intelligence.quality_risk import QualityRiskAnalyzer
from intelligence.recovery_executor import RecoveryExecutor
from intelligence.recovery_planner import RecoveryPlanner
from intelligence.root_cause_analyzer import RootCauseAnalyzer
from simulator.scenarios import scenario_a_normal_production


def print_banner(text: str) -> None:
    print("\n" + "=" * 80)
    print(f"  {text}")
    print("=" * 80)


def print_section(step_num: int, title: str) -> None:
    print(f"\n[STEP {step_num}] {title}")
    print("-" * 70)


def run_demo():
    print_banner("EVEREST TEXTILE OS — VIRTUAL FACTORY & RESCUE ENGINE DEMO")
    print("Starting closed-loop demonstration of autonomous detection & recovery...")

    # ---------------------------------------------------------
    # STEP 1: Healthy Factory Simulation
    # ---------------------------------------------------------
    print_section(1, "Initialize Healthy Factory & Normal Production")
    sim = scenario_a_normal_production(random_seed=42)
    adapter = InMemoryBackendAdapter()
    adapter.sync_from_simulator(sim)

    order = sim.production_simulator.get_order("PO-NORM-101")
    initial_produced = order.produced_quantity
    print(f"Factory: {sim.config.mill_name}")
    print(f"Order: {order.order_id} ({order.customer_name}) | Target: {order.ordered_quantity}m | Initial: {initial_produced}m")
    print(f"Assigned Machine: {order.assigned_machine_ids[0]} (Toyota Air-Jet Loom 1)")

    # Advance 30 mins normally
    normal_events = sim.step(delta_minutes=30.0)
    print(f"Simulation progressed 30 mins. Produced: {order.produced_quantity}m (+{round(order.produced_quantity - initial_produced, 1)}m)")
    print(f"Emitted {len(normal_events)} normal operational events (source: '{sim.config.data_source_label}').")

    # ---------------------------------------------------------
    # STEP 2: Inject Simulated Machine Breakdown
    # ---------------------------------------------------------
    print_section(2, "Inject Unplanned Machine Breakdown")
    broken_machine_id = "M-LOOM-01"
    sim.inject_breakdown(broken_machine_id, reason="main_drive_motor_bearing_failure")
    breakdown_events = sim.step(delta_minutes=15.0)
    print(f"CRITICAL DISRUPTION: {broken_machine_id} suffered 'main_drive_motor_bearing_failure'!")
    print(f"Machine state is now: {sim.machine_simulator.get_machine(broken_machine_id).state.value.upper()}")
    print(f"Recent events: {[e.event_type for e in breakdown_events]}")

    # ---------------------------------------------------------
    # STEP 3: Anomaly & Bottleneck Detection
    # ---------------------------------------------------------
    print_section(3, "Anomaly & Bottleneck Detection Engine")
    detector = AnomalyDetector()
    all_events = sim.event_generator.get_events()
    machines = list(sim.machine_simulator.machines.values())

    anomalies = detector.detect_anomalies(machines, all_events, sim.clock)
    print(f"Detected {len(anomalies)} active anomaly findings:")
    for a in anomalies:
        print(f"  • [{a.severity.upper()}] {a.anomaly_type} on {a.affected_entity_id}: {a.explanation}")
        print(f"    Evidence Event IDs: {a.supporting_event_ids}")

    bottlenecks = BottleneckDetector().detect_bottlenecks(machines, list(sim.production_simulator.orders.values()))
    top_bn = bottlenecks[0]
    print(f"\nTop Factory Bottleneck: {top_bn.stage_name} (Rank #{top_bn.rank})")
    print(f"  • Severity: {top_bn.severity.upper()} | Evidence: {top_bn.evidence_summary}")

    # ---------------------------------------------------------
    # STEP 4: Deadline Risk Forecasting
    # ---------------------------------------------------------
    print_section(4, "Order Completion & Deadline Risk Projection")
    deadline_predictor = DeadlinePredictor()
    deadline_risks = deadline_predictor.predict_deadlines(
        list(sim.production_simulator.orders.values()), machines, sim.clock
    )
    order_risk = next((r for r in deadline_risks if r.order_id == order.order_id), None)
    print(f"Order {order.order_id} Deadline: {order_risk.deadline.isoformat()}")
    print(f"Projected Completion: {order_risk.estimated_completion.isoformat()}")
    print(f"Projected Lateness: {order_risk.estimated_lateness_hours} hours")
    print(f"Risk Category: {order_risk.risk_category.upper()}")
    print("Contributing Factors:")
    for f in order_risk.contributing_factors:
        print(f"  - {f}")
    print("Disclosed Assumptions:")
    for asm in order_risk.assumptions:
        print(f"  * {asm}")

    # ---------------------------------------------------------
    # STEP 5: Root-Cause Analysis
    # ---------------------------------------------------------
    print_section(5, "Evidence-Based Root-Cause Analysis")
    material_risks = MaterialRiskAnalyzer().analyze_order_material_risks(
        list(sim.production_simulator.orders.values()),
        list(sim.material_simulator.inventory.values()),
        all_events,
        sim.clock,
    )
    quality_risks = QualityRiskAnalyzer().evaluate_quality_risks(
        machines, sim.production_simulator.rolls, all_events
    )

    rca = RootCauseAnalyzer().analyze_order_issue(
        order=order,
        deadline_risk=order_risk,
        machines=machines,
        material_risks=material_risks,
        quality_risks=quality_risks,
        bottlenecks=bottlenecks,
        recent_events=all_events,
    )
    print(f"Problem: {rca.problem_statement}")
    print("Observed Facts:")
    for fact in rca.observed_facts:
        print(f"  ✓ {fact}")
    print("Inferred Root Causes:")
    for cause in rca.inferred_causes:
        print(f"  ? {cause['cause']} (Score: {cause['probability_score_or_heuristic']})")
        print(f"    Details: {cause['explanation']}")
    print(f"Recommended Investigation: {rca.recommended_investigation}")

    # ---------------------------------------------------------
    # STEP 6: Everest Rescue Engine — Recovery Options
    # ---------------------------------------------------------
    print_section(6, "Everest Rescue Engine — Multi-Option Planning & Scoring")
    planner = RecoveryPlanner()
    alert_id = "ALT-001"
    plan = planner.plan_recovery(
        alert_id=alert_id,
        order=order,
        root_cause=rca,
        deadline_risk=order_risk,
        machines=machines,
        material_risks=material_risks,
        quality_risks=quality_risks,
        current_time=sim.clock,
    )

    adapter.save_recovery_plan(plan)
    print(f"Generated Recovery Plan ID: {plan.plan_id} (Status: {plan.status.value.upper()})")
    print(f"Recommended Option: {plan.recommended_option_id}")
    print("\nEvaluated Recovery Alternatives:")
    for opt in plan.options:
        feasibility_tag = "FEASIBLE" if opt.feasible else f"INFEASIBLE ({opt.infeasibility_reason})"
        print(f"\n  [{opt.option_id}] {opt.title} — Status: {feasibility_tag}")
        print(f"    Category: {opt.category} | Additional Cost: ${opt.estimated_additional_cost or 0.0}")
        print(f"    Delay Reduction: {opt.estimated_delay_reduction_minutes or 0.0} mins | Risk: {opt.quality_and_safety_risk}")
        print(f"    Composite Score: {opt.score}/100.0 (Breakdown: {opt.score_breakdown})")

    # ---------------------------------------------------------
    # STEP 7: Manager Approval Gate
    # ---------------------------------------------------------
    print_section(7, "Manager Approval & Safety Gate")
    executor = RecoveryExecutor(adapter)

    # Demonstrate safety rejection before approval
    unapproved_exec = executor.execute_plan(plan.plan_id, plan.recommended_option_id, authorized_by="OPERATOR")
    print(f"Safety Check (Prior to Approval): Success={unapproved_exec['success']}")
    print(f"System Message: {unapproved_exec.get('error')}")

    # Authorized manager approval
    manager_id = "MGR-HARSHA-JAGGI"
    print(f"\nSubmitting Manager Approval via User '{manager_id}'...")
    adapter.approve_recovery_plan(plan.plan_id, manager_id=manager_id)
    approved_plan = adapter.get_recovery_plan(plan.plan_id)
    print(f"Plan Status is now: {approved_plan.status.value.upper()} (Approved by: {approved_plan.approved_by})")

    # ---------------------------------------------------------
    # STEP 8: Safe Action Execution with Idempotency
    # ---------------------------------------------------------
    print_section(8, "Execute Approved Recovery Action")
    exec_res = executor.execute_plan(
        plan.plan_id,
        plan.recommended_option_id,
        authorized_by=manager_id,
        idempotency_key="DEMO-RESCUE-IDEM-001",
        simulator_instance=sim,
    )
    print(f"Execution Result: Success={exec_res['success']} | Status={exec_res['status']}")
    print(f"Dispatched Action: {exec_res['execution_details']}")

    # Check simulator machine states
    reassigned_loom = sim.machine_simulator.get_machine("M-LOOM-02")
    print(f"Machine M-LOOM-02 State: {reassigned_loom.state.value.upper()} (Assigned Order: {reassigned_loom.assigned_order_id})")

    # ---------------------------------------------------------
    # STEP 9: Simulation Advances (Post-Recovery Ticks)
    # ---------------------------------------------------------
    print_section(9, "Simulate Post-Recovery Operations")
    prod_before_recovery = order.produced_quantity
    print(f"Order quantity before post-recovery ticks: {prod_before_recovery}m")

    # Step simulator by 60 minutes
    subsequent_events = sim.step(delta_minutes=60.0)
    prod_after_recovery = order.produced_quantity
    produced_delta = prod_after_recovery - prod_before_recovery
    print(f"Simulation advanced 60 minutes.")
    print(f"Order produced quantity after recovery: {prod_after_recovery}m (+{round(produced_delta, 1)}m)")
    print(f"Subsequent events generated: {len(subsequent_events)}")

    # ---------------------------------------------------------
    # STEP 10: Evidence-Based Outcome Verification
    # ---------------------------------------------------------
    print_section(10, "Evidence-Based Outcome Verification")
    verifier = OutcomeVerifier(adapter)
    verification = verifier.verify_plan_outcome(
        plan.plan_id, subsequent_events=subsequent_events, order_produced_delta=produced_delta
    )
    final_plan = adapter.get_recovery_plan(plan.plan_id)

    print(f"Final Verification Result: {verification['verification_result'].upper()}")
    print(f"Verification Details: {verification['details']}")
    print(f"Plan Lifecycle Status: {final_plan.status.value.upper()}")

    print_banner("CLOSED-LOOP RECOVERY WORKFLOW COMPLETE & VERIFIED!")


if __name__ == "__main__":
    run_demo()
