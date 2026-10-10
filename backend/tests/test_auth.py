from datetime import timedelta
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole


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


def test_missing_credentials_rejected(client: TestClient):
    response = client.get("/api/v1/orders")
    assert response.status_code == 401
    assert response.json()["error_code"] == "UNAUTHENTICATED"


def test_invalid_token_rejected(client: TestClient):
    response = client.get(
        "/api/v1/orders",
        headers={"Authorization": "Bearer invalid.token.signature"},
    )
    assert response.status_code == 401
    assert response.json()["error_code"] == "UNAUTHENTICATED"


def test_expired_token_rejected(client: TestClient, seeded_users):
    users, _, _ = seeded_users
    manager = users["manager"]
    expired_token = create_access_token(
        subject=manager.id,
        role=manager.role.value,
        email=manager.email,
        expires_delta=timedelta(minutes=-30),
    )
    response = client.get(
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert response.json()["error_code"] == "UNAUTHENTICATED"


def test_disabled_account_rejected(client: TestClient, db):
    pwd_hash = get_password_hash("TestPass@2026")
    disabled_user = User(
        email="disabled@test.com",
        name="Disabled User",
        password_hash=pwd_hash,
        role=UserRole.MANAGER,
        is_active=False,
    )
    db.add(disabled_user)
    db.commit()
    db.refresh(disabled_user)

    token = create_access_token(
        subject=disabled_user.id,
        role=disabled_user.role.value,
        email=disabled_user.email,
    )
    response = client.get(
        "/api/v1/orders",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403
    assert response.json()["error_code"] == "FORBIDDEN_ACCESS"


def test_insufficient_permissions_rejected(client: TestClient, auth_headers):
    # Buyer trying to create material in inventory
    response = client.post(
        "/api/v1/inventory/materials",
        headers=auth_headers["buyer1"],
        json={
            "material_code": "MAT-REJECT",
            "name": "Reject Material",
            "material_type": "yarn",
            "unit": "kg",
            "reorder_threshold": 100,
        },
    )
    assert response.status_code == 403
    assert response.json()["error_code"] == "FORBIDDEN_ACCESS"


# --- Simulator Endpoint Security Tests ---

def test_simulator_missing_secret_and_token_rejected(client: TestClient):
    payload = {
        "event_id": "SIM-REG-001",
        "machine_id": "M-001",
        "event_type": "output_update",
        "status": "running",
        "output_quantity": 10.5,
    }
    response = client.post("/api/v1/integrations/simulator/event", json=payload)
    assert response.status_code == 401
    assert response.json()["error_code"] == "UNAUTHENTICATED"


def test_simulator_incorrect_secret_rejected(client: TestClient):
    payload = {
        "event_id": "SIM-REG-002",
        "machine_id": "M-001",
        "event_type": "output_update",
        "status": "running",
        "output_quantity": 10.5,
    }
    response = client.post(
        "/api/v1/integrations/simulator/event",
        headers={"X-Simulator-Secret": "completely-wrong-secret-key-12345"},
        json=payload,
    )
    assert response.status_code == 401
    assert response.json()["error_code"] == "UNAUTHENTICATED"


def test_simulator_valid_secret_accepted(client: TestClient, seeded_users):
    payload = {
        "event_id": "SIM-REG-003",
        "machine_id": "M-001",
        "event_type": "output_update",
        "status": "running",
        "output_quantity": 15.0,
    }
    response = client.post(
        "/api/v1/integrations/simulator/event",
        headers={"X-Simulator-Secret": settings.SIMULATOR_SHARED_SECRET},
        json=payload,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["event_id"] == "SIM-REG-003"
    assert data["status"] == "processed"


def test_simulator_valid_authenticated_operator_accepted(client: TestClient, auth_headers):
    payload = {
        "event_id": "SIM-REG-004",
        "machine_id": "M-001",
        "event_type": "output_update",
        "status": "running",
        "output_quantity": 20.0,
    }
    response = client.post(
        "/api/v1/integrations/simulator/event",
        headers=auth_headers["production"],
        json=payload,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "processed"


def test_simulator_unauthorized_buyer_token_rejected(client: TestClient, auth_headers):
    payload = {
        "event_id": "SIM-REG-005",
        "machine_id": "M-001",
        "event_type": "output_update",
        "status": "running",
        "output_quantity": 5.0,
    }
    response = client.post(
        "/api/v1/integrations/simulator/event",
        headers=auth_headers["buyer1"],
        json=payload,
    )
    assert response.status_code == 403
    assert response.json()["error_code"] == "FORBIDDEN_ACCESS"


def test_production_configuration_safety():
    from app.core.config import Settings

    # 1. Reject DEBUG=True in production
    with pytest.raises(ValueError, match="DEBUG mode must be False in production"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=True,
            SECRET_KEY="a" * 32,
            SIMULATOR_SHARED_SECRET="b" * 16,
            DATABASE_URL="postgresql://user:pass@localhost:5432/db",
            BACKEND_CORS_ORIGINS=["http://localhost:3000"],
        )

    # 2. Reject weak / default SECRET_KEY in production
    with pytest.raises(ValueError, match="SECRET_KEY must be a non-default, strong key"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="short_key",
            SIMULATOR_SHARED_SECRET="b" * 16,
            DATABASE_URL="postgresql://user:pass@localhost:5432/db",
            BACKEND_CORS_ORIGINS=["http://localhost:3000"],
        )

    # 3. Reject weak simulator secret in production
    with pytest.raises(ValueError, match="SIMULATOR_SHARED_SECRET must be an explicit, strong secret"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="a" * 32,
            SIMULATOR_SHARED_SECRET="short",
            DATABASE_URL="postgresql://user:pass@localhost:5432/db",
            BACKEND_CORS_ORIGINS=["http://localhost:3000"],
        )

    # 4. Reject SQLite in production
    with pytest.raises(ValueError, match="SQLite is not supported in production"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="a" * 32,
            SIMULATOR_SHARED_SECRET="b" * 16,
            DATABASE_URL="sqlite:///./prod.db",
            BACKEND_CORS_ORIGINS=["http://localhost:3000"],
        )

    # 5. Reject wildcard CORS in production
    with pytest.raises(ValueError, match=r"Wildcard '\*' CORS origin is not permitted in production"):
        Settings(
            ENVIRONMENT="production",
            DEBUG=False,
            SECRET_KEY="a" * 32,
            SIMULATOR_SHARED_SECRET="b" * 16,
            DATABASE_URL="postgresql://user:pass@localhost:5432/db",
            BACKEND_CORS_ORIGINS=["*"],
        )

    # 6. Valid production configuration passes
    valid_prod = Settings(
        ENVIRONMENT="production",
        DEBUG=False,
        SECRET_KEY="a" * 32,
        SIMULATOR_SHARED_SECRET="b" * 16,
        DATABASE_URL="postgresql://user:pass@localhost:5432/db",
        BACKEND_CORS_ORIGINS=["https://factory.everesttextile.com"],
    )
    assert valid_prod.ENVIRONMENT == "production"
    assert valid_prod.DEBUG is False


