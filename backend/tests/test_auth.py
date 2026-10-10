import pytest
from fastapi.testclient import TestClient


def test_login_success(client: TestClient, seeded_users):
    users, _, _ = seeded_users
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "manager@test.com", "password": "TestPass@2026"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "manager@test.com"
    assert data["user"]["role"] == "manager"


def test_login_invalid_password(client: TestClient, seeded_users):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "manager@test.com", "password": "WrongPassword123"},
    )
    assert response.status_code == 401
    assert response.json()["error_code"] == "UNAUTHENTICATED"


def test_unauthorized_access(client: TestClient):
    response = client.get("/api/v1/orders")
    assert response.status_code == 401


def test_role_forbidden_access(client: TestClient, auth_headers):
    # Buyer attempts to create raw material (restricted to inventory/manager/owner)
    response = client.post(
        "/api/v1/inventory/materials",
        headers=auth_headers["buyer1"],
        json={
            "material_code": "MAT-UNAUTH",
            "name": "Unauthorized Material",
            "material_type": "yarn",
            "unit": "kg",
            "reorder_threshold": 100,
        },
    )
    assert response.status_code == 403
    assert response.json()["error_code"] == "FORBIDDEN_ACCESS"


def test_auth_me(client: TestClient, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers["quality"])
    assert response.status_code == 200
    assert response.json()["email"] == "qual@test.com"
    assert response.json()["role"] == "quality"
