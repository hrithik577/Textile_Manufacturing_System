from typing import List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.schemas.customer import (
    CustomerRead,
    CustomerCreate,
    SupplierRead,
    SupplierCreate,
)
from app.services.customer_service import (
    get_customers,
    get_customer_by_id,
    create_customer,
    get_suppliers,
    get_supplier_by_id,
    create_supplier,
)

router = APIRouter(tags=["Customers & Suppliers"])


@router.get("/customers", response_model=List[CustomerRead], summary="List customers")
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_customers(db, skip=skip, limit=limit)


@router.post("/customers", response_model=CustomerRead, status_code=status.HTTP_201_CREATED, summary="Create customer")
def add_customer(
    customer_in: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE])),
):
    return create_customer(db, customer_in)


@router.get("/customers/{customer_id}", response_model=CustomerRead, summary="Get customer by ID")
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_customer_by_id(db, customer_id)


@router.get("/suppliers", response_model=List[SupplierRead], summary="List suppliers")
def list_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return get_suppliers(db, skip=skip, limit=limit)


@router.post("/suppliers", response_model=SupplierRead, status_code=status.HTTP_201_CREATED, summary="Create supplier")
def add_supplier(
    supplier_in: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY])),
):
    return create_supplier(db, supplier_in)
