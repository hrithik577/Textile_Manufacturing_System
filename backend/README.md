# Everest Textile OS — Backend & API

Enterprise-grade Backend, Database Architecture, and REST API foundation for the **Everest Textile OS** manufacturing platform.

---

## 1. Prerequisites

- **Python:** 3.12 or compatible version (Python 3.12 - 3.14).
- **Database:** PostgreSQL 15+ (or SQLite for local zero-dependency testing).
- **Docker & Docker Compose:** Optional for containerized local PostgreSQL setup.

---

## 2. Quickstart Setup Guide

### Step A: Virtual Environment Setup

**Windows PowerShell:**
```powershell
# From repository root
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

---

### Step B: Install Dependencies

```bash
pip install -r backend/requirements.txt
```

---

### Step C: Environment Configuration

Copy `.env.example` to `.env`:

```powershell
cp backend/.env.example backend/.env
```

Key environment variables:
```env
PROJECT_NAME="Everest Textile OS"
API_V1_STR="/api/v1"
ENVIRONMENT="development"
DEBUG=true
SECRET_KEY="everest_textile_secret_key_change_in_production_2026_super_secure"

# Database Configuration:
# PostgreSQL (Production / Docker): postgresql+psycopg2://postgres:postgrespassword@localhost:5432/everest_textile_db
# SQLite (Local instant dev / test): sqlite:///./everest_textile.db
DATABASE_URL="sqlite:///./everest_textile.db"

# CORS for Member 1 Frontend
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]

# Member 3 Simulator Shared Secret
SIMULATOR_SHARED_SECRET="simulator-dev-secret-key-2026"
```

---

### Step D: Database Startup (Docker Compose - Optional)

To spin up a local PostgreSQL 16 instance via Docker:
```bash
cd backend
docker compose up -d db
```

---

### Step E: Database Migrations (Alembic)

Run the latest database schema migrations:

**Windows PowerShell:**
```powershell
cd backend
$env:PYTHONPATH="."
alembic upgrade head
```

**Linux / macOS:**
```bash
cd backend
PYTHONPATH=. alembic upgrade head
```

---

### Step F: Seed Demo Factory Data

Populate realistic demo records including users, customers, suppliers, raw material lots, active production orders, loom machines, 4-point quality inspections, dispatches, invoices, and AI recovery plans:

**Windows PowerShell:**
```powershell
cd backend
$env:PYTHONPATH="."
python -m app.db.seed
```

**Linux / macOS:**
```bash
cd backend
PYTHONPATH=. python3 -m app.db.seed
```

---

### Step G: Start FastAPI Server

```powershell
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI JSON Contract:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)
- **Health Check:** [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

---

## 3. Seeded Demo Accounts (Password: `Everest@2026!`)

| Role | Email | Permissions / Scope |
|---|---|---|
| **Owner** | `owner@everest.com` | Full unrestricted access |
| **Plant Manager** | `manager@everest.com` | Production orders, scheduling, recovery plan approvals |
| **Production** | `production@everest.com` | Machine telemetry, production events, operations |
| **Quality Inspector** | `quality@everest.com` | 4-Point ASTM defect inspections, roll grading |
| **Inventory Manager**| `inventory@everest.com`| Raw materials, lots, stock movements, ledger adjustments |
| **Dispatch Lead** | `dispatch@everest.com` | Shipments, carrier packing, dispatch confirmations |
| **Finance Officer** | `finance@everest.com` | Cost entries, invoices, payment tracking, profitability |
| **Buyer (Nordic)** | `buyer@nordic.com` | Multi-tenant buyer portal (Customer 1 orders & shipments) |
| **Buyer (Apex)** | `buyer@apex.com` | Multi-tenant buyer portal (Customer 2 orders & shipments) |

---

## 4. Running Automated Tests

Execute the automated test suite covering authentication, RBAC, inventory ledger integrity, unit consistency, machine event idempotency, quality inspections, dispatch safeguards, and recovery plans:

```powershell
cd backend
pytest -v
```

---

## 5. Team Integration Guides

### For Member 1 (React Frontend Lead)
1. Point your API client to `http://localhost:8000/api/v1`.
2. Configure `VITE_API_BASE_URL=http://localhost:8000/api/v1` in frontend `.env`.
3. Review the complete contract in [`docs/api-contract.md`](../docs/api-contract.md).
4. All machine list endpoints (`GET /api/v1/machines`) return standardized `machine_id`, `process`, `status`, `shift_output_m`, and `data_source` keys matching the agreed UI specifications.

### For Member 3 (Virtual Factory Simulator & Intelligence Lead)
1. **Telemetry Ingestion:** Send simulated sensor/telemetry payloads to `POST /api/v1/integrations/simulator/event` or batch bursts to `POST /api/v1/integrations/simulator/batch`.
2. **Authentication:** Include header `X-Simulator-Secret: simulator-dev-secret-key-2026` or Bearer JWT token.
3. **Idempotency:** Include a unique `event_id` with each telemetry payload. Duplicate events are safely skipped without double-counting meterage.
4. **Automated Alerts:** Machine breakdown and stoppage events automatically generate active system alerts.
5. **AI Rescue Context:** Call `GET /api/v1/integrations/intelligence/context` to retrieve real-time order deadlines, machine bottleneck statuses, and stock deficits.
6. **Recovery Plans:** Submit proposed mitigation strategies to `POST /api/v1/integrations/intelligence/recommendations`.

---

## 6. Architecture & Non-Negotiable Business Rules

```text
backend/
├── app/
│   ├── main.py                    # FastAPI entrypoint, CORS, lifespan, global exception handlers
│   ├── core/
│   │   ├── config.py              # Pydantic settings & environment configuration
│   │   ├── security.py            # Bcrypt hashing & PyJWT token handling
│   │   ├── dependencies.py        # RBAC, tenant isolation & auth dependencies
│   │   └── exceptions.py          # Domain exceptions & error codes
│   ├── api/
│   │   └── v1/
│   │       ├── router.py          # API router aggregation
│   │       └── endpoints/         # Modular endpoint routers
│   ├── models/                    # SQLAlchemy 2.0 ORM models
│   ├── schemas/                   # Pydantic v2 validation & response schemas
│   ├── services/                  # Authoritative business logic & transactional rules
│   ├── db/
│   │   ├── base.py                # Base declarative model & timestamp mixins
│   │   ├── session.py             # Database engine & session generator
│   │   └── seed.py                # Repeatable & idempotent demo factory seed script
│   └── integrations/
│       ├── simulator.py           # Ingestion adapter for Virtual Factory Simulator
│       └── intelligence.py        # Factory context & recovery plan adapter
├── alembic/                       # Alembic schema versioning & migrations
├── tests/                         # Pytest test suite with isolated fixtures
├── Dockerfile                     # Containerized production deployment
├── docker-compose.yml             # Local PostgreSQL 16 service
├── requirements.txt               # Pinned backend dependencies
├── alembic.ini                    # Alembic configuration
└── README.md                      # Backend operations guide
```

### Enforced Business Rules
1. **Authoritative Inventory Movement Ledger:** Stock quantities are calculated from immutable `inventory_movements` records. Negative stock is rejected at the service layer.
2. **Unit Consistency:** Mismatching units (e.g. `litres` vs `kg`) are strictly rejected.
3. **Quality & Dispatch Eligibility:** Ineligible rolls (`uninspected`, `hold`, `rework`, `rejected`) are prevented from being added to or confirmed in shipments.
4. **Duplicate Dispatch Prevention:** The same fabric roll cannot be dispatched twice.
5. **Multi-Tenant Buyer Isolation:** Users with the `buyer` role can only access their assigned customer orders, shipments, and payment documents. Internal costs, production logs, and competitor records are strictly hidden.
6. **Recovery Plan Human-in-the-Loop:** Proposing an AI recovery plan does NOT automatically execute it. Explicit manager authorization (`/approve`) is required before executing operational mitigations (`/execute`).
