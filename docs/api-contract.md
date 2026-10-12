# Everest Textile OS — API Contract Specification

> **Version:** `1.0.0`  
> **Base URL:** `/api/v1`  
> **Interactive Swagger UI:** `http://localhost:8000/docs`  
> **OpenAPI JSON Schema:** `http://localhost:8000/openapi.json`  

---

## 1. General Conventions

- **Data format:** JSON request and response payloads.
- **Naming standard:** `snake_case` for all object keys and query parameters.
- **Timestamps:** ISO 8601 UTC formatted strings (`YYYY-MM-DDTHH:MM:SSZ`).
- **Dates:** ISO date strings (`YYYY-MM-DD`).
- **Units:** Explicitly declared in payload keys and fields (`m` for metres, `kg` for kilograms, `litres`, `units`).
- **Authentication:** Bearer token authorization header: `Authorization: Bearer <JWT_TOKEN>`.

---

## 2. Authentication & Roles (`/api/v1/auth`)

### Roles Matrix
- `owner`: Complete unrestricted factory access.
- `manager`: Plant management, order approvals, recovery plan authorizations.
- `production`: Machine telemetry, shift events, production orders.
- `quality`: 4-point fabric inspection, roll defect logging, quarantine dispositions.
- `inventory`: Goods receipt, stock reservations, lot adjustments.
- `dispatch`: Shipment packing, carrier assignment, dispatch confirmation.
- `finance`: Cost entries, customer invoices, payment recording.
- `buyer`: Multi-tenant portal access restricted strictly to their assigned `customer_id`.

### Endpoints
* `POST /api/v1/auth/login`
  - **Request:** `{"email": "manager@everest.com", "password": "<account_password>"}`
  - **Response (200):**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
      "token_type": "bearer",
      "user": {
        "id": 2,
        "email": "manager@everest.com",
        "name": "Vikram Patel",
        "role": "manager",
        "is_active": true,
        "customer_id": null
      }
    }
    ```
* `GET /api/v1/auth/me`
* `POST /api/v1/auth/logout`

---

## 3. Executive Dashboard (`/api/v1/dashboard`)

* `GET /api/v1/dashboard/summary`
  - **Response (200):**
    ```json
    {
      "active_orders_count": 8,
      "orders_in_production": 4,
      "pending_dispatch_rolls": 12,
      "active_alerts_count": 2,
      "critical_alerts_count": 1,
      "low_stock_items_count": 1,
      "running_machines_count": 4,
      "total_machines_count": 6,
      "overall_oee_percentage": 78.4,
      "today_production_output_m": 4250.0,
      "monthly_revenue_booked": 56750.00,
      "monthly_collected_cash": 23500.00,
      "active_workers_on_shift": 12
    }
    ```
* `GET /api/v1/dashboard/production-trend?days=7`
* `GET /api/v1/dashboard/alerts`

---

## 4. Sales Orders & Traceability (`/api/v1/orders`)

* `GET /api/v1/orders`
  - **Query Params:** `status`, `priority`, `customer_id`, `page` (default 1), `page_size` (default 50)
* `POST /api/v1/orders`
  - **Request Body:**
    ```json
    {
      "order_number": "SO-2026-004",
      "customer_id": 1,
      "required_delivery_date": "2026-11-15",
      "priority": "high",
      "currency": "INR",
      "items": [
        {
          "fabric_type": "100% Organic Cotton Twill 210 GSM",
          "color_code": "NAVY-19",
          "gsm": 210,
          "width_inches": 58.0,
          "target_quantity": 5000.0,
          "unit": "m",
          "unit_price": 3.70
        }
      ]
    }
    ```
* `POST /api/v1/orders/place`
  - **Description:** Buyer / Client Portal direct order placement. Automatically associates/creates client account, calculates totals, and creates sales order with line items in `INR`.
  - **Request Body:**
    ```json
    {
      "customer_company": "Patagonia Sourcing Ltd",
      "customer_name": "Sarah Jenkins",
      "customer_email": "sarah.j@patagonia-demo.com",
      "customer_phone": "+1-415-555-0199",
      "customer_po": "PO-PAT-2026-99",
      "delivery_destination": "Port of Los Angeles, USA",
      "required_delivery_date": "2026-11-20",
      "priority": "urgent",
      "currency": "INR",
      "notes": "Fast track export run with GOTS certification",
      "items": [
        {
          "fabric_type": "100% Organic Cotton Twill 210 GSM",
          "color_code": "Nordic Navy",
          "gsm": 210,
          "width_inches": 58.0,
          "target_quantity": 4000.0,
          "unit": "m",
          "unit_price": 280.0,
          "notes": "Weave: 2/1 Twill | Finish: Enzyme Softener"
        }
      ]
    }
    ```
* `GET /api/v1/orders/{order_id}`
* `PATCH /api/v1/orders/{order_id}`
* `GET /api/v1/orders/{order_id}/timeline`
  - Returns complete milestone lifecycle: order placed -> weaving scheduled -> inspections passed -> packed -> dispatched with tracking code.
* `GET /api/v1/orders/{order_id}/cost-summary`
  - Financial breakdown: agreed order value vs raw materials, electricity, labor, overheads, and calculated gross profit margin. *(Restricted from buyer role)*.

---

## 5. Authoritative Inventory Ledger (`/api/v1/inventory`)

> **Non-Negotiable Rules Enforced:**
> 1. Frontend stock values are never trusted. All totals are calculated transactionally.
> 2. No negative stock balances permitted.
> 3. Strict unit mismatch validation.

* `GET /api/v1/inventory/materials`
* `POST /api/v1/inventory/materials`
* `GET /api/v1/inventory/materials/{material_id}`
* `GET /api/v1/inventory/movements`
* `POST /api/v1/inventory/receipts`
  - **Request:** `{"material_id": 1, "supplier_id": 1, "lot_number": "LOT-2026-X", "quantity": 1000.0, "unit": "kg", "unit_cost": 3.80}`
* `POST /api/v1/inventory/reservations`
* `POST /api/v1/inventory/consumption`
* `POST /api/v1/inventory/adjustments`
* `GET /api/v1/inventory/low-stock`

---

## 6. Production & Live Machine Telemetry (`/api/v1/machines`, `/api/v1/production`)

* `GET /api/v1/machines`
  - **Response (200):**
    ```json
    {
      "items": [
        {
          "id": 1,
          "machine_id": "M-001",
          "machine_code": "M-001",
          "name": "Airjet Loom 01 (Tsudakoma)",
          "process": "weaving",
          "process_type": "weaving",
          "status": "running",
          "current_order_id": "PO-2026-001",
          "shift_output_m": 1450.0,
          "current_speed_rpm": 850.0,
          "downtime_reason": null,
          "data_source": "simulator",
          "last_heartbeat": "2026-10-10T08:30:00Z",
          "last_updated": "2026-10-10T08:30:00Z"
        }
      ],
      "total": 6
    }
    ```
* `GET /api/v1/machines/{machine_id}/history`
* `POST /api/v1/machines/{machine_id}/events`
* `GET /api/v1/production/orders`
* `POST /api/v1/production/orders`
* `GET /api/v1/production/events`
* `POST /api/v1/production/events`

---

## 7. Quality Control & Fabric Roll Genealogy (`/api/v1/quality`, `/api/v1/rolls`)

* `GET /api/v1/rolls`
* `POST /api/v1/rolls`
* `GET /api/v1/rolls/{roll_id}`
* `GET /api/v1/rolls/{roll_id}/genealogy`
  - Returns complete parentage: Customer Order -> Production Order -> Weaving Loom -> Roll Inspection History -> Dispatch Shipment.
* `POST /api/v1/quality/inspections`
  - **Request Body (4-Point ASTM D5430 Defect Logging):**
    ```json
    {
      "roll_id": 1,
      "result": "pass",
      "defect_count": 2,
      "defect_details": [
        {"type": "slub", "points": 1, "meter": 120.0, "count": 1},
        {"type": "thick_end", "points": 1, "meter": 340.0, "count": 1}
      ],
      "disposition": "approved_for_dispatch"
    }
    ```

---

## 8. Finished Goods & Dispatch Safeguards (`/api/v1/dispatch`)

> **Non-Negotiable Safeguards Enforced:**
> 1. Ineligible rolls (`uninspected`, `hold`, `rework`, `rejected`) are blocked from dispatch.
> 2. Duplicate dispatch protection prevents the same roll from being dispatched multiple times.
> 3. Confirmation is atomic: updates rolls to `dispatched`, locks shipment, and updates sales order progress.

* `GET /api/v1/dispatch/shipments`
* `POST /api/v1/dispatch/shipments`
* `POST /api/v1/dispatch/shipments/{shipment_id}/items`
* `POST /api/v1/dispatch/shipments/{shipment_id}/confirm`
  - **Response (200):**
    ```json
    {
      "shipment_id": 1,
      "shipment_number": "SHP-2026-001",
      "status": "dispatched",
      "dispatch_date": "2026-10-10T09:15:00Z",
      "tracking_reference": "TRK-DHL-9082341",
      "dispatched_rolls_count": 4,
      "total_meterage": 2400.0,
      "message": "Shipment successfully dispatched with 4 verified fabric rolls."
    }
    ```

---

## 9. Rescue Engine & Recovery Plans (`/api/v1/alerts`, `/api/v1/recovery-plans`)

> **Rule 9 Enforced:** Proposing a recovery plan does NOT automatically execute it. Authorization is required.

* `GET /api/v1/alerts`
* `PATCH /api/v1/alerts/{alert_id}`
* `GET /api/v1/recovery-plans`
* `POST /api/v1/recovery-plans/{plan_id}/approve`
  - **Request:** `{"approved": true}`
* `POST /api/v1/recovery-plans/{plan_id}/execute`
  - Executes authorized operational mitigation (e.g., loom rerouting, maintenance team dispatch, safety stock reallocation).

---

## 10. Member 3 Integration Interface (`/api/v1/integrations`)

### Simulator Telemetry Ingestion
* `POST /api/v1/integrations/simulator/event`
* `POST /api/v1/integrations/simulator/batch`
  - **Headers:** `X-Simulator-Secret: simulator-dev-secret-key-2026` or Bearer Token.
  - **Idempotency:** Stable `event_id` ensures telemetry duplicates are skipped safely without double-counting meterage.
  - **Automated Alerts:** Stoppages and breakdowns automatically trigger system alerts.

### Intelligence Engine Contract
* `GET /api/v1/integrations/intelligence/context`
  - Returns real-time factory context (active orders, bottleneck machines, stock deficits, active alerts) for optimization models.
* `POST /api/v1/integrations/intelligence/recommendations`
  - Ingests structured recovery proposals from AI models for manager review.
