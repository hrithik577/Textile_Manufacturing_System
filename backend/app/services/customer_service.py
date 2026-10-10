from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException, ConflictException
from app.models.customer import Customer, Supplier
from app.schemas.customer import CustomerCreate, CustomerUpdate, SupplierCreate


def get_customers(db: Session, skip: int = 0, limit: int = 100) -> List[Customer]:
    return db.query(Customer).offset(skip).limit(limit).all()


def get_customer_by_id(db: Session, customer_id: int) -> Customer:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise NotFoundException("Customer", customer_id)
    return customer


def create_customer(db: Session, customer_in: CustomerCreate) -> Customer:
    existing = db.query(Customer).filter(Customer.code == customer_in.code).first()
    if existing:
        raise ConflictException(f"Customer with code '{customer_in.code}' already exists.")
    
    customer = Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def get_suppliers(db: Session, skip: int = 0, limit: int = 100) -> List[Supplier]:
    return db.query(Supplier).offset(skip).limit(limit).all()


def get_supplier_by_id(db: Session, supplier_id: int) -> Supplier:
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise NotFoundException("Supplier", supplier_id)
    return supplier


def create_supplier(db: Session, supplier_in: SupplierCreate) -> Supplier:
    existing = db.query(Supplier).filter(Supplier.code == supplier_in.code).first()
    if existing:
        raise ConflictException(f"Supplier with code '{supplier_in.code}' already exists.")
    
    supplier = Supplier(**supplier_in.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier
