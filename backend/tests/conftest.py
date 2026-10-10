import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.security import get_password_hash, create_access_token
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User, UserRole
from app.models.customer import Customer, Supplier
from app.models.inventory import Material, MaterialLot, MaterialType
from app.models.production import Machine, ProcessType, MachineStatus, DataSourceType

# Create isolated in-memory test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def seeded_users(db: Session):
    pwd_hash = get_password_hash("TestPass@2026")
    
    # Create customers for buyer isolation tests
    cust1 = Customer(code="CUST-T1", name="Alpha Apparel", email="alpha@buyer.com", payment_terms_days=30)
    cust2 = Customer(code="CUST-T2", name="Beta Fashion", email="beta@buyer.com", payment_terms_days=30)
    db.add_all([cust1, cust2])
    db.flush()

    users = {
        "owner": User(email="owner@test.com", name="Owner Test", password_hash=pwd_hash, role=UserRole.OWNER),
        "manager": User(email="manager@test.com", name="Manager Test", password_hash=pwd_hash, role=UserRole.MANAGER),
        "production": User(email="prod@test.com", name="Prod Test", password_hash=pwd_hash, role=UserRole.PRODUCTION),
        "quality": User(email="qual@test.com", name="Quality Test", password_hash=pwd_hash, role=UserRole.QUALITY),
        "inventory": User(email="inv@test.com", name="Inventory Test", password_hash=pwd_hash, role=UserRole.INVENTORY),
        "dispatch": User(email="disp@test.com", name="Dispatch Test", password_hash=pwd_hash, role=UserRole.DISPATCH),
        "finance": User(email="fin@test.com", name="Finance Test", password_hash=pwd_hash, role=UserRole.FINANCE),
        "buyer1": User(email="buyer1@test.com", name="Buyer Alpha", password_hash=pwd_hash, role=UserRole.BUYER, customer_id=cust1.id),
        "buyer2": User(email="buyer2@test.com", name="Buyer Beta", password_hash=pwd_hash, role=UserRole.BUYER, customer_id=cust2.id),
    }
    db.add_all(users.values())
    db.commit()
    # Seed standard test machines
    m1 = Machine(machine_code="M-001", name="Airjet Loom 01", process_type=ProcessType.WEAVING, status=MachineStatus.RUNNING)
    m2 = Machine(machine_code="M-002", name="Airjet Loom 02", process_type=ProcessType.WEAVING, status=MachineStatus.RUNNING)
    m3 = Machine(machine_code="M-003", name="Rapier Loom 03", process_type=ProcessType.WEAVING, status=MachineStatus.BREAKDOWN)
    m4 = Machine(machine_code="M-004", name="Rapier Loom 04", process_type=ProcessType.WEAVING, status=MachineStatus.IDLE)
    db.add_all([m1, m2, m3, m4])
    db.commit()

    for u in users.values():
        db.refresh(u)
        
    return users, cust1, cust2


@pytest.fixture
def auth_headers(seeded_users):
    users, cust1, cust2 = seeded_users
    headers = {}
    for role_key, user in users.items():
        token = create_access_token(
            subject=user.id,
            role=user.role.value,
            email=user.email,
            customer_id=user.customer_id,
        )
        headers[role_key] = {"Authorization": f"Bearer {token}"}
    return headers
