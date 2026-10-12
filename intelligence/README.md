# Everest Textile OS — Intelligence & Recovery Engine

The **Intelligence & Recovery Engine** (The *Everest Rescue Engine*) provides explainable decision intelligence for textile manufacturing operations.

It detects disruptions, predicts deadline slippage, conducts root-cause analysis, generates feasible recovery alternatives, enforces manager authorization gates, and verifies subsequent recovery outcomes.

---

## 1. Engine Modules

| Module | Purpose |
| :--- | :--- |
| `anomaly_detector.py` | Detects operational abnormalities (stoppages, low rates, defect spikes). |
| `bottleneck_detector.py` | Ranks process stages by queue and throughput capacity. |
| `material_risk.py` | Audits raw material coverage, allocations, and stock shortages. |
| `quality_risk.py` | Flags quality drift, quarantines suspect rolls, prevents unauthorized dispatch. |
| `deadline_predictor.py` | Forecasts order completion time and calculates lateness risk. |
| `root_cause_analyzer.py` | Connects telemetry to orders and machines to explain why issues occur. |
| `scoring.py` | Transparent multi-criteria scoring (delivery, feasibility, cost, risk). |
| `recovery_planner.py` | Generates multiple feasible recovery options (reassign, repair, overtime, reschedule). |
| `recovery_executor.py` | Dispatches actions only after explicit manager approval with idempotency keys. |
| `outcome_verifier.py` | Evaluates subsequent events to confirm situation improvement. |
| `data_access.py` | Pluggable backend adapter (`InMemoryBackendAdapter` & `HttpBackendAdapter`). |

---

## 2. Safety Lifecycle

Consequential actions require human authorization:
```
detected → analyzed → proposed → awaiting_approval → approved → executing → verified
```
Terminal exception states:
- `rejected`, `failed`, `cancelled`, `verification_failed`

---

## 3. Usage Example

```python
from intelligence import (
    AnomalyDetector,
    DeadlinePredictor,
    InMemoryBackendAdapter,
    OutcomeVerifier,
    RecoveryExecutor,
    RecoveryPlanner,
    RootCauseAnalyzer,
)
from simulator import scenario_b_machine_breakdown

# 1. Setup simulation
sim = scenario_b_machine_breakdown(random_seed=42)
sim.step(15)  # Stoppage occurs

# 2. Detect & Diagnose
detector = AnomalyDetector()
anomalies = detector.detect_anomalies(
    list(sim.machine_simulator.machines.values()),
    sim.event_generator.get_events(),
    sim.clock
)

# 3. Plan Recovery
planner = RecoveryPlanner()
order = sim.production_simulator.get_order("PO-NORM-101")
rca = RootCauseAnalyzer().analyze_order_issue(
    order, None, list(sim.machine_simulator.machines.values()), [], [], [], sim.event_generator.get_events()
)
plan = planner.plan_recovery("ALT-0001", order, rca, None, list(sim.machine_simulator.machines.values()), [], [], sim.clock)

# 4. Approve & Execute
adapter = InMemoryBackendAdapter()
adapter.save_recovery_plan(plan)
adapter.approve_recovery_plan(plan.plan_id, manager_id="MGR-HARSHA")

executor = RecoveryExecutor(adapter)
res = executor.execute_plan(plan.plan_id, "OPT-REASSIGN", authorized_by="MGR-HARSHA", simulator_instance=sim)

# 5. Subsequent steps & Verification
subsequent_events = sim.step(30)
verification = OutcomeVerifier(adapter).verify_plan_outcome(plan.plan_id, subsequent_events)
print("Verification result:", verification["verification_result"])
```
