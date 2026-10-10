# Everest Textile OS

**Everest Textile OS** is an intelligent digital manufacturing management platform designed for Everest Textile Mills.

This repository is maintained by a 3-member engineering team:
* **Member 1**: React Frontend, Dashboards, Rescue Engine UI, Charts, and Operational Tables.
* **Member 2**: FastAPI Backend, PostgreSQL Database, REST APIs, and Authentication.
* **Member 3 (This Subsystem)**: Virtual Factory Simulator, Operational Event Generation, Anomaly & Bottleneck Detection, Deadline Risk Forecasting, and the Everest Rescue Engine.

---

## Subsystems

### 1. Virtual Factory Simulator (`simulator/`)
- Step-based, deterministic simulation clock.
- Configurable stages: Raw Material Prep, Spinning, Weaving, Dyeing/Finishing, Inspection, Roll Creation.
- Machine states: `running`, `idle`, `setup`, `breakdown`, `maintenance`.
- 5 Pre-built scenarios (Scenarios A through E).
- All events explicitly labeled `"source": "simulator"`.

### 2. Intelligence & Recovery Engine (`intelligence/`)
- Explainable anomaly detection with supporting event IDs.
- Bottleneck detection ranking WIP queues vs active capacity.
- Raw material shortage analysis and quality drift monitoring.
- Explainable deadline risk forecasting.
- Evidence-based root-cause analysis (distinguishing observed facts from inferred causes).
- **The Everest Rescue Engine**: Multi-option recovery planning with transparent multi-criteria scoring (delivery, feasibility, cost, risk).
- Manager approval safety gate (`awaiting_approval` -> `approved` -> `executing` -> `verified`).
- Evidence-based post-action outcome verification.

---

## Quickstart

### Run Automated Tests
```bash
python3 -m pytest -v
```

### Run Live End-to-End Demonstration
```bash
python3 demo_rescue_flow.py
```

### Documentation & Payloads
- Architecture & REST API Contracts: [`docs/intelligence-design.md`](file:///Users/harshajaggi/odoo%20final%20round/Textile_Manufacturing_System/docs/intelligence-design.md)
- Member 1 Frontend Fixtures: [`fixtures/`](file:///Users/harshajaggi/odoo%20final%20round/Textile_Manufacturing_System/fixtures/)
