import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient


def test_create_and_get_order(client: TestClient, auth_headers, seeded_users):
    _, cust1, _ = seeded_users
    delivery = date.today() + timedelta(days=15)
    
    # Manager creates an order for Customer 1
    create_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": "SO-TEST-001",
            "customer_id": cust1.id,
            "order_date": str(date.today()),
            "required_delivery_date": str(delivery),
            "priority": "high",
            "currency": "INR",
            "items": [
                {
                    "fabric_type": "Cotton Poplin 120 GSM",
                    "color_code": "WHITE-01",
                    "target_quantity": 2000.0,
                    "unit": "m",
                    "unit_price": 4.50,
                },
                {
                    "fabric_type": "Cotton Twill 210 GSM",
                    "color_code": "NAVY-02",
                    "target_quantity": 1000.0,
                    "unit": "m",
                    "unit_price": 5.00,
                },
            ],
        },
    )
    assert create_res.status_code == 201
    order_data = create_res.json()
    assert order_data["order_number"] == "SO-TEST-001"
    # Total calculation: (2000 * 4.50) + (1000 * 5.00) = 9000 + 5000 = 14000.0
    assert order_data["total_amount"] == 14000.0
    assert len(order_data["items"]) == 2
    order_id = order_data["id"]

    # Retrieve order
    get_res = client.get(f"/api/v1/orders/{order_id}", headers=auth_headers["manager"])
    assert get_res.status_code == 200
    assert get_res.json()["order_number"] == "SO-TEST-001"


def test_buyer_isolation(client: TestClient, auth_headers, seeded_users):
    _, cust1, cust2 = seeded_users
    
    # Create order for Customer 1
    so1_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": "SO-BUYER-1",
            "customer_id": cust1.id,
            "required_delivery_date": str(date.today() + timedelta(days=10)),
            "items": [{"fabric_type": "Test Fabric A", "target_quantity": 500.0, "unit_price": 10.0}],
        },
    )
    so1_id = so1_res.json()["id"]

    # Create order for Customer 2
    so2_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": "SO-BUYER-2",
            "customer_id": cust2.id,
            "required_delivery_date": str(date.today() + timedelta(days=10)),
            "items": [{"fabric_type": "Test Fabric B", "target_quantity": 500.0, "unit_price": 10.0}],
        },
    )
    so2_id = so2_res.json()["id"]

    # Buyer 1 lists orders -> should ONLY see Customer 1's order
    b1_list = client.get("/api/v1/orders", headers=auth_headers["buyer1"])
    assert b1_list.status_code == 200
    b1_orders = b1_list.json()["items"]
    assert all(o["customer_id"] == cust1.id for o in b1_orders)
    assert any(o["id"] == so1_id for o in b1_orders)
    assert not any(o["id"] == so2_id for o in b1_orders)

    # Buyer 1 attempts direct access to Buyer 2's order -> 403 Forbidden
    b1_direct = client.get(f"/api/v1/orders/{so2_id}", headers=auth_headers["buyer1"])
    assert b1_direct.status_code == 403
    assert b1_direct.json()["error_code"] == "FORBIDDEN_ACCESS"


def test_order_timeline_and_cost_summary(client: TestClient, auth_headers, seeded_users):
    _, cust1, _ = seeded_users
    
    so_res = client.post(
        "/api/v1/orders",
        headers=auth_headers["manager"],
        json={
            "order_number": "SO-TIMELINE-01",
            "customer_id": cust1.id,
            "required_delivery_date": str(date.today() + timedelta(days=10)),
            "items": [{"fabric_type": "Denim 14oz", "target_quantity": 1000.0, "unit_price": 8.0}],
        },
    )
    order_id = so_res.json()["id"]

    # Check timeline
    timeline_res = client.get(f"/api/v1/orders/{order_id}/timeline", headers=auth_headers["manager"])
    assert timeline_res.status_code == 200
    t_data = timeline_res.json()
    assert t_data["order_id"] == order_id
    assert len(t_data["timeline"]) >= 1

    # Check cost summary as manager -> 200
    cost_res = client.get(f"/api/v1/orders/{order_id}/cost-summary", headers=auth_headers["manager"])
    assert cost_res.status_code == 200
    assert cost_res.json()["agreed_order_value"] == 8000.0

    # Check cost summary as buyer -> 403 Forbidden (confidential factory data)
    buyer_cost = client.get(f"/api/v1/orders/{order_id}/cost-summary", headers=auth_headers["buyer1"])
    assert buyer_cost.status_code == 403


def test_portal_order_placement(client: TestClient):
    delivery = date.today() + timedelta(days=20)
    res = client.post(
        "/api/v1/orders/place",
        json={
            "customer_company": "Patagonia Sourcing Ltd",
            "customer_name": "Sarah Jenkins",
            "customer_email": "sarah.j@patagonia-demo.com",
            "customer_phone": "+1-415-555-0199",
            "customer_po": "PO-PAT-2026-99",
            "delivery_destination": "Port of Los Angeles, USA",
            "required_delivery_date": str(delivery),
            "priority": "urgent",
            "currency": "INR",
            "items": [
                {
                    "fabric_type": "100% Organic Cotton Twill 210 GSM",
                    "color_code": "NAVY-01",
                    "gsm": 210,
                    "width_inches": 58.0,
                    "target_quantity": 4000.0,
                    "unit": "m",
                    "unit_price": 280.0,
                }
            ],
        },
    )
    assert res.status_code == 201
    data = res.json()
    assert data["order_number"].startswith("SO-2026-")
    assert data["total_amount"] == 1120000.0
    assert data["currency"] == "INR"
    assert data["status"] == "confirmed"
