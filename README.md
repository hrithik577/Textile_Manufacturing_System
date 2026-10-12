# Everest Textile OS — Next-Generation Manufacturing Management Platform

Everest Textile OS replaces fragmented spreadsheets, paper production slips, and disconnected phone calls with a centralized, real-time textile manufacturing control tower and automated operations triage system.

This repository is maintained by a 3-member engineering team:
* **Member 1 (Frontend & Dashboard Lead)**: React Frontend, Dashboards, Rescue Engine UI, Charts, and Operational Tables.
* **Member 2 (Backend & Database Lead)**: FastAPI Backend, PostgreSQL Database, REST APIs, and Authentication.
* **Member 3 (Simulator & Rescue Lead)**: Virtual Factory Simulator, Operational Event Generation, Anomaly & Bottleneck Detection, Deadline Risk Forecasting, and the Everest Rescue Engine.

---

## 🏛️ Team Architecture & Responsibilities

| Team Member | Exclusive Domain & Ownership | Tech Stack |
| :--- | :--- | :--- |
| **Member 1** | Enterprise Dashboard, Machine Telemetry Grid, Rescue Engine UX, Quality & Dispatch Consoles, Component Design System, Client API Services | React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Recharts, Lucide Icons |
| **Member 2** | REST APIs, Authentication, PostgreSQL Database, Order Management, Material Inventory, Quality Audits, Shipment Dispatch, Costings | FastAPI, PostgreSQL, SQLAlchemy, Pydantic, Alembic |
| **Member 3** | Virtual Factory Simulator, Machine Event Telemetry Generation, Bottleneck Detection, Autonomous Heuristic Triage, Recovery Plan Optimizers | Python Simulator, Event Stream, Heuristic Engine |

---

## 🚀 Key Modules & Pages

1. **Owner's Control Tower (`/dashboard`):** Real-time factory KPI scorecard, planned vs. actual production curves, process output breakdown, defect distribution, and high-priority operational triage alerts.
2. **Production Floor (`/production`):** Live telemetry grid & table views across Spinning, Weaving, Dyeing, Finishing, and Inspection. Live speed (RPM), temperature, tension, OEE efficiency %, and immediate visual breakdown alerts.
3. **Customer Orders (`/orders`):** Multi-stage production stage progression timeline, material readiness audits, technical fabric specs, and unit profit margin breakdowns.
4. **Inventory & Supply Ledgers (`/inventory`):** Raw yarn, dyestuffs, chemicals, and greige fabric ledgers with low-stock alerts and immutable stock movement audit trails.
5. **Quality Control & Traceability (`/quality`):** 4-point inspection grading (Grade A / Export vs Grade B / Reject), defect Pareto, GSM checks, and 4-stage lot genealogy (Spinning → Weaving → Dyeing → Finishing).
6. **Finished Goods Warehouse (`/finished-goods`):** QA-certified fabric roll barcodes, rack/bay locations, gross export weights, and staging bays.
7. **Dispatch & Challans (`/dispatch`):** Strict roll eligibility validation (preventing dispatch of rejected/held rolls), carrier vehicle assignment, and official Delivery Challan & Gate Pass document generation.
8. **Workforce & Shifts (`/workforce`):** Morning, Evening, and Night shift scheduling, machine operator skill matrices, attendance, and operator efficiency ratings.
9. **Everest Rescue Engine™ (`/rescue-engine`):** Signature operational AI/heuristic triage hub. Detects machine stoppages, shade deviations, and yarn bottlenecks; diagnoses likely root causes; compares multi-factor recovery plans (Schedule Gain vs Cost vs Risk); and manages management sign-offs.
10. **Manufacturing Analytics (`/analytics`):** OEE benchmarks, First-Pass Yield (FPY), downtime Pareto analysis, and customer order profitability.
11. **Buyer Tracking Portal (`/buyer/orders`):** Dedicated, secure buyer portal for brand sourcing managers (e.g. Nordic Apparel Group) with certified lab test reports and carrier tracking.
12. **System Settings (`/settings`):** Factory tolerances (Delta E spectrophotometer limits, shrinkage limits), API connection gateway, and Virtual Factory simulation controls.

---

## 🔌 API Contracts & Gateway Integration

The frontend connects to Member 2's FastAPI service via `src/services/api-client.ts`:

- `GET /api/v1/machines` & `PATCH /api/v1/machines/:id/status`
- `GET /api/v1/orders` & `POST /api/v1/orders`
- `GET /api/v1/inventory` & `POST /api/v1/inventory/:id/adjust`
- `GET /api/v1/quality/inspections` & `POST /api/v1/quality/inspections`
- `GET /api/v1/dispatch/finished-goods` & `POST /api/v1/dispatch/create`
- `GET /api/v1/rescue-engine/issues` & `POST /api/v1/rescue-engine/issues/:id/approve-plan`

> **Automatic Fallback Mode:** If the backend service is offline or starting up, the frontend automatically falls back to typed domain fixtures and displays an explicit `SIMULATED` indicator to ensure continuous usability.

---

## 💻 Quickstart & Local Development

### Running the Frontend (Member 1)
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

The application will be available at `http://localhost:3000` (or `http://localhost:5173`).

### Running the Simulator & Rescue Engine (Member 3)
```bash
# Run Automated Tests
python3 -m pytest -v

# Run Live End-to-End Demonstration
python3 demo_rescue_flow.py

# Start Local API Server (Simulator Endpoints)
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Documentation & Payloads (Member 3)
- Architecture & REST API Contracts: `docs/intelligence-design.md`
- Member 1 Frontend Fixtures: `fixtures/`
