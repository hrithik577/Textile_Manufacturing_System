import pytest
from datetime import date, datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.models.finance import Invoice, Payment, CostEntry, CostCategory, InvoiceStatus, PaymentMethod
from app.models.customer import Customer


def test_auth_me_and_session_rejection(client: TestClient, auth_headers):
    # Valid authenticated session returns correct identity
    res = client.get("/api/v1/auth/me", headers=auth_headers["manager"])
    assert res.status_code == 200
    user_data = res.json()
    assert user_data["email"] == "manager@test.com"
    assert user_data["role"] == "manager"

    # Missing credentials fails securely
    res_no_auth = client.get("/api/v1/auth/me")
    assert res_no_auth.status_code == 401

    # Fake token fails securely
    res_bad_token = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer fake.jwt.token"})
    assert res_bad_token.status_code == 401


def test_financial_close_role_authorization(client: TestClient, auth_headers):
    # Authorized roles (Owner, Manager, Finance) can access Financial Close
    res_owner = client.get("/api/v1/finance/closing-the-books?period=October+2026", headers=auth_headers["owner"])
    assert res_owner.status_code == 200

    res_manager = client.get("/api/v1/finance/closing-the-books?period=October+2026", headers=auth_headers["manager"])
    assert res_manager.status_code == 200

    res_finance = client.get("/api/v1/finance/closing-the-books?period=October+2026", headers=auth_headers["finance"])
    assert res_finance.status_code == 200

    # Unauthorized roles (Buyer, Production, Quality, Inventory, Dispatch) are rejected with 403
    res_buyer = client.get("/api/v1/finance/closing-the-books?period=October+2026", headers=auth_headers["buyer1"])
    assert res_buyer.status_code == 403

    res_prod = client.get("/api/v1/finance/closing-the-books?period=October+2026", headers=auth_headers["production"])
    assert res_prod.status_code == 403

    res_qa = client.get("/api/v1/finance/closing-the-books?period=October+2026", headers=auth_headers["quality"])
    assert res_qa.status_code == 403


def test_financial_close_period_filtering_and_honest_empty_state(client: TestClient, auth_headers):
    # An unrecorded historical period should return 0 revenue and an honest empty state, not fabricated profits
    res = client.get(
        "/api/v1/finance/closing-the-books",
        params={"period": "January 2023"},
        headers=auth_headers["owner"],
    )
    assert res.status_code == 200
    data = res.json()
    assert data["period"] == "January 2023"
    assert data["total_revenue"] == 0.0
    assert data["total_expenses"] == 0.0
    assert data["net_profit"] == 0.0
    assert data["is_profitable"] is False
    assert "NO FINANCIAL ACTIVITY RECORDED" in data["verdict"].upper()


def test_payment_safety_validation_and_deduplication(client: TestClient, auth_headers, db: Session):
    # Setup test customer and invoice
    cust = db.query(Customer).first()
    invoice = Invoice(
        invoice_number="INV-SAFE-TEST-001",
        customer_id=cust.id,
        total_amount=50000.0,
        paid_amount=0.0,
        currency="INR",
        status=InvoiceStatus.ISSUED,
        issue_date=date.today(),
        due_date=date.today() + timedelta(days=30),
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)

    # 1. Negative amount must be rejected
    res_neg = client.post(
        "/api/v1/finance/payments",
        headers=auth_headers["finance"],
        json={
            "invoice_id": invoice.id,
            "amount": -500.0,
            "payment_method": "bank_transfer",
            "reference_number": "REF-NEG-001",
        },
    )
    assert res_neg.status_code in (409, 422)

    # 2. Overpayment beyond total must be rejected
    res_over = client.post(
        "/api/v1/finance/payments",
        headers=auth_headers["finance"],
        json={
            "invoice_id": invoice.id,
            "amount": 60000.0,
            "payment_method": "bank_transfer",
            "reference_number": "REF-OVER-001",
        },
    )
    assert res_over.status_code == 409
    assert "exceeds remaining unpaid balance" in res_over.json()["message"]

    # 3. Legitimate partial payment succeeds
    res_partial = client.post(
        "/api/v1/finance/payments",
        headers=auth_headers["finance"],
        json={
            "invoice_id": invoice.id,
            "amount": 20000.0,
            "payment_method": "bank_transfer",
            "reference_number": "REF-UNIQUE-001",
        },
    )
    assert res_partial.status_code == 201

    # Verify invoice status is partially_paid
    db.refresh(invoice)
    assert float(invoice.paid_amount) == 20000.0
    assert invoice.status == InvoiceStatus.PARTIALLY_PAID

    # 4. Duplicate payment reference must be rejected
    res_dup = client.post(
        "/api/v1/finance/payments",
        headers=auth_headers["finance"],
        json={
            "invoice_id": invoice.id,
            "amount": 10000.0,
            "payment_method": "bank_transfer",
            "reference_number": "REF-UNIQUE-001",
        },
    )
    assert res_dup.status_code == 409
    assert "Duplicate payment submission" in res_dup.json()["message"]


def test_dashboard_truthful_metrics_without_fallbacks(client: TestClient, auth_headers):
    res = client.get("/api/v1/dashboard/summary", headers=auth_headers["manager"])
    assert res.status_code == 200
    data = res.json()
    assert "overall_oee_percentage" in data
    assert "today_production_output_m" in data
    assert "active_workers_on_shift" in data
    assert isinstance(data["active_workers_on_shift"], int)
    assert data["active_workers_on_shift"] >= 0

    # Trend endpoint
    res_trend = client.get("/api/v1/dashboard/production-trend?days=7", headers=auth_headers["manager"])
    assert res_trend.status_code == 200
    trend_data = res_trend.json()
    assert len(trend_data["trend_data"]) == 7
