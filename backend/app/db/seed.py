"""
Everest Textile OS — Demonstration Database Seeder
Populates a realistic, internally consistent textile mill environment:
- Users & Roles (Owner, Manager, Production, Quality, Dispatch, Finance, Buyer)
- Customers (Nordic Apparel, Apex Sportswear, Luxe Fashion) & Suppliers (SilkRoute Yarns, Dyestuff Global)
- Raw Materials (Cotton Yarn Ne 30s, Poly-Cotton Blend, Reactive Dyes, Packaging Cartons)
- Authoritative Inventory Lots & Stock Movement Ledgers
- Sales Orders with Line Items (Draft, Confirmed, In Production, Dispatched)
- Production Orders & Operations (Warping, Weaving, Dyeing, Inspection)
- Weaving Looms & Dyeing Machines with Live Telemetry State
- Machine Events (Simulator Provenance) & Production Output Logs
- Workforce Shifts, Employee Roster & Attendance Logs
- Fabric Rolls with 4-Point System Quality Inspections (Pass, Hold, Rework, Reject)
- Dispatches & Shipments with Idempotency Tracking
- Cost Entries, Customer Invoices & Recorded Payments
- System Alerts & AI-Powered Recovery Plans
"""

import sys
from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.customer import Customer, Supplier
from app.models.order import SalesOrder, SalesOrderItem, OrderStatus, OrderPriority
from app.models.inventory import (
    Material,
    MaterialLot,
    InventoryMovement,
    MaterialType,
    MovementType,
)
from app.models.production import (
    ProductionOrder,
    ProductionOperation,
    Machine,
    MachineEvent,
    ProductionEvent,
    ProductionStatus,
    MachineStatus,
    ProcessType,
    DataSourceType,
)
from app.models.workforce import Shift, Worker, AttendanceRecord
from app.models.quality import (
    FabricRoll,
    QualityInspection,
    RollStatus,
    InspectionResult,
    RollGrade,
)
from app.models.dispatch import Shipment, ShipmentItem, ShipmentStatus
from app.models.finance import (
    CostEntry,
    Invoice,
    Payment,
    CostCategory,
    InvoiceStatus,
    PaymentMethod,
)
from app.models.alert import (
    Alert,
    RecoveryPlan,
    AlertCategory,
    AlertSeverity,
    AlertStatus,
    ApprovalStatus,
    ExecutionStatus,
)
from app.core.config import settings


def seed_database(db: Session):
    is_prod = settings.ENVIRONMENT.lower() in ("production", "prod")
    if is_prod and not settings.ALLOW_DEMO_SEED:
        raise RuntimeError(
            "Security Violation: Demo database seeding is disabled in production environments. "
            "To bootstrap production, set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD."
        )

    print("[SEED] Initializing Everest Textile OS database seeding...")
    
    today = date.today()
    now = datetime.now(timezone.utc)

    # 0. SECURE ONE-TIME ADMIN BOOTSTRAP (Controlled via ENV)
    if settings.ADMIN_BOOTSTRAP_EMAIL and settings.ADMIN_BOOTSTRAP_PASSWORD:
        bootstrap_admin = db.query(User).filter(User.email == settings.ADMIN_BOOTSTRAP_EMAIL.lower()).first()
        if not bootstrap_admin:
            bootstrap_admin = User(
                email=settings.ADMIN_BOOTSTRAP_EMAIL.lower(),
                name="System Administrator (Bootstrap)",
                password_hash=get_password_hash(settings.ADMIN_BOOTSTRAP_PASSWORD),
                role=UserRole.OWNER,
                is_active=True,
                customer_id=None,
            )
            db.add(bootstrap_admin)
            db.flush()

    demo_password_hash = get_password_hash("Everest@2026!")

    # -------------------------------------------------------------
    # 1. CUSTOMERS & SUPPLIERS
    # -------------------------------------------------------------
    c_nordic = db.query(Customer).filter(Customer.code == "CUST-001").first()
    if not c_nordic:
        c_nordic = Customer(
            code="CUST-001",
            name="Nordic Apparel Group",
            contact_person="Frederik Lindqvist",
            email="frederik@nordicapparel.se",
            phone="+46 8 123 4567",
            address="Hamngatan 15, Stockholm, Sweden",
            tax_id="SE556012345601",
            payment_terms_days=30,
            is_active=True,
        )
        db.add(c_nordic)
        
    c_apex = db.query(Customer).filter(Customer.code == "CUST-002").first()
    if not c_apex:
        c_apex = Customer(
            code="CUST-002",
            name="Apex Activewear Inc",
            contact_person="Marcus Vance",
            email="m.vance@apexactive.com",
            phone="+1 503 555 0192",
            address="900 SW 5th Ave, Portland, OR, USA",
            tax_id="US93-8472910",
            payment_terms_days=45,
            is_active=True,
        )
        db.add(c_apex)
        
    c_luxe = db.query(Customer).filter(Customer.code == "CUST-003").first()
    if not c_luxe:
        c_luxe = Customer(
            code="CUST-003",
            name="Luxe Milan Fabrics",
            contact_person="Elena Rossi",
            email="elena@luxemilan.it",
            phone="+39 02 8765 4321",
            address="Via Montenapoleone 8, Milan, Italy",
            tax_id="IT09876543210",
            payment_terms_days=30,
            is_active=True,
        )
        db.add(c_luxe)

    s_silk = db.query(Supplier).filter(Supplier.code == "SUP-001").first()
    if not s_silk:
        s_silk = Supplier(
            code="SUP-001",
            name="SilkRoute Cotton Mills",
            category="Cotton Yarn",
            contact_person="Arjun Mehta",
            email="sales@silkroutecotton.in",
            phone="+91 22 2490 1122",
            address="Industrial Zone B, Ahmedabad, India",
            payment_terms_days=30,
            is_active=True,
        )
        db.add(s_silk)

    s_dyes = db.query(Supplier).filter(Supplier.code == "SUP-002").first()
    if not s_dyes:
        s_dyes = Supplier(
            code="SUP-002",
            name="Dyestuff Chemicals Global",
            category="Dyes & Auxiliary",
            contact_person="Hans Weber",
            email="order@dyestuff-global.de",
            phone="+49 69 7584 920",
            address="Chemiepark 4, Ludwigshafen, Germany",
            payment_terms_days=30,
            is_active=True,
        )
        db.add(s_dyes)

    db.flush()

    # -------------------------------------------------------------
    # 2. USERS & ROLES
    # -------------------------------------------------------------
    users_to_seed = [
        ("owner@everest.com", "Rohan Singhania", UserRole.OWNER, None),
        ("manager@everest.com", "Vikram Patel", UserRole.MANAGER, None),
        ("production@everest.com", "Aarav Sharma", UserRole.PRODUCTION, None),
        ("quality@everest.com", "Priya Nair", UserRole.QUALITY, None),
        ("inventory@everest.com", "Sanjay Verma", UserRole.INVENTORY, None),
        ("dispatch@everest.com", "Deepak Joshi", UserRole.DISPATCH, None),
        ("finance@everest.com", "Meera Kulkarni", UserRole.FINANCE, None),
        ("buyer@nordic.com", "Frederik Lindqvist", UserRole.BUYER, c_nordic.id),
        ("buyer@apex.com", "Marcus Vance", UserRole.BUYER, c_apex.id),
    ]

    for email, name, role, cust_id in users_to_seed:
        existing_user = db.query(User).filter(User.email == email).first()
        if not existing_user:
            u = User(
                email=email,
                name=name,
                password_hash=demo_password_hash,
                role=role,
                is_active=True,
                customer_id=cust_id,
            )
            db.add(u)

    db.flush()
    admin_user = db.query(User).filter(User.email == "manager@everest.com").first()

    # -------------------------------------------------------------
    # 3. WORKFORCE & SHIFTS
    # -------------------------------------------------------------
    shifts_data = [
        ("Morning Shift (A)", "06:00", "14:00"),
        ("Evening Shift (B)", "14:00", "22:00"),
        ("Night Shift (C)", "22:00", "06:00"),
    ]
    created_shifts = []
    for s_name, st, et in shifts_data:
        shift_obj = db.query(Shift).filter(Shift.shift_name == s_name).first()
        if not shift_obj:
            shift_obj = Shift(shift_name=s_name, start_time=st, end_time=et)
            db.add(shift_obj)
            db.flush()
        created_shifts.append(shift_obj)

    workers_data = [
        ("EMP-0101", "Kishore Kumar", "Weaving Master", "weaving", created_shifts[0].id),
        ("EMP-0102", "Manoj Tiwari", "Loom Operator", "weaving", created_shifts[0].id),
        ("EMP-0103", "Anil Yadav", "Loom Operator", "weaving", created_shifts[0].id),
        ("EMP-0104", "Sunil Gujjar", "Quality Inspector", "quality", created_shifts[0].id),
        ("EMP-0201", "Gopal Das", "Loom Operator", "weaving", created_shifts[1].id),
        ("EMP-0202", "Ramesh Rao", "Dyeing Technician", "dyeing", created_shifts[1].id),
    ]
    for e_code, e_name, e_role, dept, s_id in workers_data:
        w_obj = db.query(Worker).filter(Worker.employee_code == e_code).first()
        if not w_obj:
            w_obj = Worker(
                employee_code=e_code,
                name=e_name,
                role=e_role,
                department=dept,
                shift_id=s_id,
                is_active=True,
            )
            db.add(w_obj)
            db.flush()
            # Seed attendance for today
            att = AttendanceRecord(
                worker_id=w_obj.id,
                shift_id=s_id,
                date=today,
                check_in=now - timedelta(hours=4),
                status="present",
            )
            db.add(att)

    # -------------------------------------------------------------
    # 4. RAW MATERIALS & INVENTORY LEDGER
    # -------------------------------------------------------------
    materials_data = [
        ("MAT-YRN-001", "100% Combed Cotton Yarn 30s", MaterialType.YARN, "kg", 500.0, 200.0, 3.80, "Premium organic ring spun cotton yarn"),
        ("MAT-YRN-002", "Poly-Viscose Blended Yarn 2/40s", MaterialType.YARN, "kg", 400.0, 150.0, 4.20, "High tenacity suiting yarn"),
        ("MAT-DYE-001", "Reactive Blue 19 Navy Dye", MaterialType.DYE_CHEMICAL, "kg", 100.0, 30.0, 18.50, "High fastness reactive dye for cotton"),
        ("MAT-DYE-002", "Acetic Acid 98% Technical", MaterialType.DYE_CHEMICAL, "litres", 200.0, 50.0, 1.40, "pH regulator for dye bath"),
        ("MAT-PKG-001", "Heavy Duty Roll Poly-Tubing", MaterialType.PACKAGING, "m", 1000.0, 300.0, 0.45, "Moisture barrier roll wrap film"),
        ("MAT-YRN-003", "Modal Spun Yarn 40s (Low Stock Demo)", MaterialType.YARN, "kg", 300.0, 100.0, 5.10, "Soft sustainable modal yarn - below reorder"),
    ]
    created_materials = {}
    for code, name, m_type, unit, reorder, safety, cost, desc in materials_data:
        mat = db.query(Material).filter(Material.material_code == code).first()
        if not mat:
            mat = Material(
                material_code=code,
                name=name,
                material_type=m_type,
                unit=unit,
                reorder_threshold=reorder,
                safety_stock=safety,
                standard_cost_per_unit=cost,
                description=desc,
                current_stock=0.0,
            )
            db.add(mat)
            db.flush()
        created_materials[code] = mat

    # Seed Lots and Inventory Receipts
    lots_seed_data = [
        ("MAT-YRN-001", "LOT-YRN-2026-01", s_silk.id, 2500.0, 2500.0, 3.80),
        ("MAT-YRN-002", "LOT-YRN-2026-02", s_silk.id, 1800.0, 1800.0, 4.20),
        ("MAT-DYE-001", "LOT-DYE-2026-01", s_dyes.id, 450.0, 450.0, 18.50),
        ("MAT-DYE-002", "LOT-DYE-2026-02", s_dyes.id, 800.0, 800.0, 1.40),
        ("MAT-PKG-001", "LOT-PKG-2026-01", None, 3000.0, 3000.0, 0.45),
        ("MAT-YRN-003", "LOT-YRN-2026-03", s_silk.id, 150.0, 150.0, 5.10), # Will be below threshold (150 < 300)
    ]

    for mat_code, lot_no, supp_id, rec_qty, avail_qty, u_cost in lots_seed_data:
        mat_obj = created_materials[mat_code]
        lot_obj = db.query(MaterialLot).filter(MaterialLot.lot_number == lot_no).first()
        if not lot_obj:
            lot_obj = MaterialLot(
                lot_number=lot_no,
                material_id=mat_obj.id,
                supplier_id=supp_id,
                received_quantity=rec_qty,
                available_quantity=avail_qty,
                reserved_quantity=0.0,
                unit=mat_obj.unit,
                received_date=today - timedelta(days=14),
                unit_cost=u_cost,
                storage_location="Warehouse A",
            )
            db.add(lot_obj)
            db.flush()
            mat_obj.current_stock += avail_qty

            mvm = InventoryMovement(
                material_id=mat_obj.id,
                lot_id=lot_obj.id,
                movement_type=MovementType.RECEIPT,
                quantity=rec_qty,
                unit=mat_obj.unit,
                source_location="Supplier Goods In",
                destination_location="Warehouse A",
                reference_type="purchase_order",
                reference_id=f"PO-{lot_no}",
                actor_id=admin_user.id if admin_user else None,
                notes=f"Initial demo lot receipt for {mat_obj.name}",
                movement_timestamp=now - timedelta(days=14),
            )
            db.add(mvm)

    # -------------------------------------------------------------
    # 5. SALES ORDERS & ITEMS
    # -------------------------------------------------------------
    so_nordic = db.query(SalesOrder).filter(SalesOrder.order_number == "SO-2026-001").first()
    if not so_nordic:
        so_nordic = SalesOrder(
            order_number="SO-2026-001",
            customer_id=c_nordic.id,
            order_date=today - timedelta(days=10),
            required_delivery_date=today + timedelta(days=12),
            status=OrderStatus.IN_PRODUCTION,
            priority=OrderPriority.HIGH,
            currency="INR",
            total_amount=18500.0,
            notes="Eco-twill cotton batch for Stockholm Spring collection",
            items=[
                SalesOrderItem(
                    fabric_type="100% Organic Cotton Twill 210 GSM",
                    color_code="NAVY-19",
                    gsm=210,
                    width_inches=58.0,
                    target_quantity=5000.0,
                    unit="m",
                    unit_price=3.70,
                    total_price=18500.0,
                )
            ],
        )
        db.add(so_nordic)

    so_apex = db.query(SalesOrder).filter(SalesOrder.order_number == "SO-2026-002").first()
    if not so_apex:
        so_apex = SalesOrder(
            order_number="SO-2026-002",
            customer_id=c_apex.id,
            order_date=today - timedelta(days=15),
            required_delivery_date=today - timedelta(days=1), # Completed demo
            status=OrderStatus.COMPLETED,
            priority=OrderPriority.NORMAL,
            currency="INR",
            total_amount=14250.0,
            notes="Poly-Viscose performance stretch suiting",
            items=[
                SalesOrderItem(
                    fabric_type="Poly-Viscose Stretch Twill",
                    color_code="CHARCOAL-02",
                    gsm=240,
                    width_inches=60.0,
                    target_quantity=3000.0,
                    unit="m",
                    unit_price=4.75,
                    total_price=14250.0,
                )
            ],
        )
        db.add(so_apex)

    so_luxe = db.query(SalesOrder).filter(SalesOrder.order_number == "SO-2026-003").first()
    if not so_luxe:
        so_luxe = SalesOrder(
            order_number="SO-2026-003",
            customer_id=c_luxe.id,
            order_date=today - timedelta(days=3),
            required_delivery_date=today + timedelta(days=20),
            status=OrderStatus.CONFIRMED,
            priority=OrderPriority.URGENT,
            currency="INR",
            total_amount=24000.0,
            notes="Luxe Milan high-thread sateen weave",
            items=[
                SalesOrderItem(
                    fabric_type="Cotton Sateen 300TC",
                    color_code="OPTICAL-WHITE",
                    gsm=180,
                    width_inches=58.0,
                    target_quantity=4000.0,
                    unit="m",
                    unit_price=6.00,
                    total_price=24000.0,
                )
            ],
        )
        db.add(so_luxe)

    db.flush()

    # -------------------------------------------------------------
    # 6. MACHINES (LOOMS & DYEING)
    # -------------------------------------------------------------
    machines_data = [
        ("M-001", "Airjet Loom 01 (Tsudakoma)", ProcessType.WEAVING, MachineStatus.RUNNING, 850.0, 1.6, 1450.0, None),
        ("M-002", "Airjet Loom 02 (Tsudakoma)", ProcessType.WEAVING, MachineStatus.RUNNING, 820.0, 1.6, 1380.0, None),
        ("M-003", "Rapier Loom 03 (Picanol)", ProcessType.WEAVING, MachineStatus.BREAKDOWN, 0.0, 1.4, 420.0, "Weft feeder motor electrical fault"),
        ("M-004", "Rapier Loom 04 (Picanol)", ProcessType.WEAVING, MachineStatus.IDLE, 0.0, 1.4, 0.0, None),
        ("M-005", "Soft Flow Jet Dyeing 01 (Fongs)", ProcessType.DYEING, MachineStatus.RUNNING, 250.0, 2.5, 800.0, None),
        ("M-006", "Stenter Finishing Frame 01 (Brueckner)", ProcessType.FINISHING, MachineStatus.RUNNING, 110.0, 5.0, 2200.0, None),
    ]

    created_machines = {}
    for code, name, p_type, status, speed, rated_mpm, output, reason in machines_data:
        mach = db.query(Machine).filter(Machine.machine_code == code).first()
        if not mach:
            mach = Machine(
                machine_code=code,
                name=name,
                process_type=p_type,
                status=status,
                current_speed_rpm=speed,
                rated_speed_mpm=rated_mpm,
                shift_output_m=output,
                downtime_reason=reason,
                data_source=DataSourceType.SIMULATOR,
                last_heartbeat=now - timedelta(minutes=2),
            )
            db.add(mach)
            db.flush()
        else:
            if mach.rated_speed_mpm is None:
                mach.rated_speed_mpm = rated_mpm
        created_machines[code] = mach

    # -------------------------------------------------------------
    # 7. PRODUCTION ORDERS & OPERATIONS
    # -------------------------------------------------------------
    po_nordic = db.query(ProductionOrder).filter(ProductionOrder.production_order_number == "PO-2026-001").first()
    if not po_nordic:
        po_nordic = ProductionOrder(
            production_order_number="PO-2026-001",
            sales_order_id=so_nordic.id,
            target_quantity=5000.0,
            completed_quantity=3200.0,
            unit="m",
            status=ProductionStatus.IN_PROGRESS,
            planned_start_date=today - timedelta(days=8),
            planned_end_date=today + timedelta(days=6),
            actual_start_date=now - timedelta(days=8),
            notes="Active weaving on Loom M-001 & M-002",
            operations=[
                ProductionOperation(process_name="Warping & Sizing", sequence=1, machine_id=created_machines["M-001"].id, planned_quantity=5000.0, actual_quantity=5000.0, status="completed"),
                ProductionOperation(process_name="Weaving", sequence=2, machine_id=created_machines["M-001"].id, planned_quantity=5000.0, actual_quantity=3200.0, status="in_progress"),
                ProductionOperation(process_name="Dyeing & Finishing", sequence=3, machine_id=created_machines["M-005"].id, planned_quantity=5000.0, actual_quantity=1800.0, status="in_progress"),
            ],
        )
        db.add(po_nordic)
        db.flush()
        created_machines["M-001"].active_production_order_id = po_nordic.id
        created_machines["M-002"].active_production_order_id = po_nordic.id

    po_apex = db.query(ProductionOrder).filter(ProductionOrder.production_order_number == "PO-2026-002").first()
    if not po_apex:
        po_apex = ProductionOrder(
            production_order_number="PO-2026-002",
            sales_order_id=so_apex.id,
            target_quantity=3000.0,
            completed_quantity=3000.0,
            unit="m",
            status=ProductionStatus.COMPLETED,
            planned_start_date=today - timedelta(days=14),
            planned_end_date=today - timedelta(days=3),
            actual_start_date=now - timedelta(days=14),
            actual_end_date=now - timedelta(days=3),
            notes="Completed batch for Apex Activewear",
        )
        db.add(po_apex)
        db.flush()

    # Machine Events (Simulator telemetry provenance)
    sample_events = [
        ("EVT-SIM-001", created_machines["M-001"].id, po_nordic.id, "running", now - timedelta(hours=6), None, None, {"speed_rpm": 850, "loom_efficiency": 94.2}),
        ("EVT-SIM-002", created_machines["M-002"].id, po_nordic.id, "running", now - timedelta(hours=6), None, None, {"speed_rpm": 820, "loom_efficiency": 91.8}),
        ("EVT-SIM-003", created_machines["M-003"].id, po_nordic.id, "downtime_start", now - timedelta(hours=3), None, "Weft feeder motor electrical fault", {"error_code": "ERR_ELEC_042"}),
    ]
    for e_id, m_id, po_id, e_type, st, et, reason, details in sample_events:
        existing_evt = db.query(MachineEvent).filter(MachineEvent.event_id == e_id).first()
        if not existing_evt:
            evt = MachineEvent(
                event_id=e_id,
                machine_id=m_id,
                production_order_id=po_id,
                event_type=e_type,
                start_time=st,
                end_time=et,
                downtime_reason=reason,
                data_source=DataSourceType.SIMULATOR,
                details=details,
            )
            db.add(evt)

    # -------------------------------------------------------------
    # 8. FABRIC ROLLS, INSPECTIONS & 4-POINT GRADING
    # -------------------------------------------------------------
    rolls_data = [
        ("ROL-2026-001", po_nordic.id, so_nordic.id, "100% Organic Cotton Twill", 500.0, 105.0, RollGrade.GRADE_A, RollStatus.PASS, "Finished Goods Bay A", [
            (InspectionResult.PASS, 2, [{"type": "slub", "points": 1, "meter": 120.0}, {"type": "thick_end", "points": 1, "meter": 340.0}], "approved_for_dispatch", 1.2)
        ]),
        ("ROL-2026-002", po_nordic.id, so_nordic.id, "100% Organic Cotton Twill", 500.0, 104.5, RollGrade.GRADE_A, RollStatus.PASS, "Finished Goods Bay A", [
            (InspectionResult.PASS, 1, [{"type": "oil_spot", "points": 2, "meter": 42.0}], "approved_for_dispatch", 0.9)
        ]),
        ("ROL-2026-003", po_nordic.id, so_nordic.id, "100% Organic Cotton Twill", 480.0, 101.0, RollGrade.GRADE_B, RollStatus.HOLD, "Quality Quarantine", [
            (InspectionResult.HOLD, 8, [{"type": "mispick", "points": 4, "meter": 80.0}, {"type": "warp_float", "points": 4, "meter": 81.0}], "quarantined_for_re-check", 22.4)
        ]),
        ("ROL-2026-004", po_nordic.id, so_nordic.id, "100% Organic Cotton Twill", 500.0, 105.0, RollGrade.SCRAP, RollStatus.REJECTED, "Scrap Yard", [
            (InspectionResult.REJECT, 15, [{"type": "shading_defect", "points": 4, "meter": 10.0}], "scrap_writeoff", 45.0)
        ]),
        ("ROL-2026-005", po_apex.id, so_apex.id, "Poly-Viscose Stretch Twill", 600.0, 144.0, RollGrade.GRADE_A, RollStatus.DISPATCHED, "In Transit (DHL)", [
            (InspectionResult.PASS, 0, [], "approved_for_dispatch", 0.0)
        ]),
        ("ROL-2026-006", po_apex.id, so_apex.id, "Poly-Viscose Stretch Twill", 600.0, 144.2, RollGrade.GRADE_A, RollStatus.DISPATCHED, "In Transit (DHL)", [
            (InspectionResult.PASS, 1, [{"type": "knot", "points": 1, "meter": 210.0}], "approved_for_dispatch", 0.5)
        ]),
    ]

    created_rolls = {}
    for r_code, po_id, so_id, f_type, length, weight, grade, status, loc, inspections in rolls_data:
        roll_obj = db.query(FabricRoll).filter(FabricRoll.roll_code == r_code).first()
        if not roll_obj:
            roll_obj = FabricRoll(
                roll_code=r_code,
                production_order_id=po_id,
                sales_order_id=so_id,
                fabric_type=f_type,
                length_m=length,
                weight_kg=weight,
                width_inches=58.0,
                gsm=210,
                grade=grade,
                current_status=status,
                current_location=loc,
            )
            db.add(roll_obj)
            db.flush()

            for ins_res, d_count, d_details, disp, pts in inspections:
                insp = QualityInspection(
                    roll_id=roll_obj.id,
                    inspector_id=admin_user.id if admin_user else None,
                    inspection_date=now - timedelta(days=2),
                    result=ins_res,
                    defect_count=d_count,
                    defect_details=d_details,
                    disposition=disp,
                    points_per_100_sqm=pts,
                    notes="4-Point ASTM D5430 inspection standard",
                )
                db.add(insp)
        created_rolls[r_code] = roll_obj

    # -------------------------------------------------------------
    # 9. DISPATCH & SHIPMENTS
    # -------------------------------------------------------------
    shp_apex = db.query(Shipment).filter(Shipment.shipment_number == "SHP-2026-001").first()
    if not shp_apex:
        shp_apex = Shipment(
            shipment_number="SHP-2026-001",
            sales_order_id=so_apex.id,
            customer_id=c_apex.id,
            status=ShipmentStatus.DISPATCHED,
            dispatch_date=now - timedelta(days=1),
            tracking_reference="TRK-DHL-9082341",
            carrier="DHL Express Worldwide",
            vehicle_number="OR-5829-TR",
            destination_address="900 SW 5th Ave, Portland, OR, USA",
            notes="Fully cleared batch for Apex Activewear",
            items=[
                ShipmentItem(roll_id=created_rolls["ROL-2026-005"].id, dispatched_quantity=600.0, unit="m"),
                ShipmentItem(roll_id=created_rolls["ROL-2026-006"].id, dispatched_quantity=600.0, unit="m"),
            ],
        )
        db.add(shp_apex)

    # -------------------------------------------------------------
    # 10. FINANCIAL RECORDS (COSTS, INVOICES, PAYMENTS)
    # -------------------------------------------------------------
    costs_to_seed = [
        (CostCategory.RAW_MATERIAL, 9500.0, so_nordic.id, po_nordic.id, "2500 kg Combed Cotton Yarn"),
        (CostCategory.DYE_CHEMICAL, 1850.0, so_nordic.id, po_nordic.id, "Reactive dye and salt additives"),
        (CostCategory.ELECTRICITY, 1200.0, so_nordic.id, po_nordic.id, "Weaving shed power consumption"),
        (CostCategory.LABOR, 1400.0, so_nordic.id, po_nordic.id, "Weaving operators and master salary allocation"),
        (CostCategory.RAW_MATERIAL, 7560.0, so_apex.id, po_apex.id, "1800 kg Poly-Viscose Yarn"),
        (CostCategory.LABOR, 950.0, so_apex.id, po_apex.id, "Loom operations shift labor"),
    ]
    for cat, amt, so_id, po_id, desc in costs_to_seed:
        c_entry = CostEntry(
            category=cat,
            amount=amt,
            currency="INR",
            sales_order_id=so_id,
            production_order_id=po_id,
            description=desc,
            entry_timestamp=now - timedelta(days=5),
        )
        db.add(c_entry)

    inv_apex = db.query(Invoice).filter(Invoice.invoice_number == "INV-2026-001").first()
    if not inv_apex:
        inv_apex = Invoice(
            invoice_number="INV-2026-001",
            customer_id=c_apex.id,
            sales_order_id=so_apex.id,
            total_amount=14250.0,
            paid_amount=14250.0,
            currency="INR",
            status=InvoiceStatus.PAID,
            issue_date=today - timedelta(days=5),
            due_date=today + timedelta(days=25),
            notes="Net 30 commercial invoice",
            payments=[
                Payment(
                    amount=14250.0,
                    payment_date=today - timedelta(days=1),
                    payment_method=PaymentMethod.BANK_TRANSFER,
                    reference_number="WIRE-APEX-99201",
                    notes="Full advance balance received via Citibank",
                )
            ],
        )
        db.add(inv_apex)

    inv_nordic = db.query(Invoice).filter(Invoice.invoice_number == "INV-2026-002").first()
    if not inv_nordic:
        inv_nordic = Invoice(
            invoice_number="INV-2026-002",
            customer_id=c_nordic.id,
            sales_order_id=so_nordic.id,
            total_amount=18500.0,
            paid_amount=9250.0,
            currency="INR",
            status=InvoiceStatus.PARTIALLY_PAID,
            issue_date=today - timedelta(days=3),
            due_date=today + timedelta(days=27),
            notes="50% advance deposit invoice",
            payments=[
                Payment(
                    amount=9250.0,
                    payment_date=today - timedelta(days=2),
                    payment_method=PaymentMethod.BANK_TRANSFER,
                    reference_number="WIRE-NORDIC-55102",
                    notes="50% deposit received",
                )
            ],
        )
        db.add(inv_nordic)

    # MACHINE BREAKDOWN ALERT — Rapier Loom 03
    alert_breakdown = db.query(Alert).filter(Alert.title.contains("Machine Breakdown: Rapier Loom 03")).first()
    if not alert_breakdown:
        alert_breakdown = Alert(
            category=AlertCategory.MACHINE_BREAKDOWN,
            severity=AlertSeverity.CRITICAL,
            title="Machine Breakdown: Rapier Loom 03 (M-003) — Critical SLA Risk",
            description="Weft feeder motor electrical fault (error code ERR-ELEC-042) detected during Shift B. Loom stopped at 3,200m of 5,000m target. Delivery SLA for SO-2026-001 now at risk (+5.2 day estimated delay).",
            entity_type="machine",
            entity_id="M-003",
            status=AlertStatus.ACTIVE,
        )
        db.add(alert_breakdown)
        db.flush()
    else:
        alert_breakdown.severity = AlertSeverity.CRITICAL
        alert_breakdown.title = "Machine Breakdown: Rapier Loom 03 (M-003) — Critical SLA Risk"
        alert_breakdown.description = "Weft feeder motor electrical fault (error code ERR-ELEC-042) detected during Shift B. Loom stopped at 3,200m of 5,000m target. Delivery SLA for SO-2026-001 now at risk (+5.2 day estimated delay)."
        db.flush()

    existing_plans = db.query(RecoveryPlan).filter(RecoveryPlan.alert_id == alert_breakdown.id).all()
    plan_titles = {p.title for p in existing_plans}

    if "Reallocate PO-2026-001 to High-Speed Airjet Loom M-004 + Overtime Shift" not in plan_titles:
        plan_1 = RecoveryPlan(
            alert_id=alert_breakdown.id,
            title="Reallocate PO-2026-001 to High-Speed Airjet Loom M-004 + Overtime Shift",
            description="Transfer active warp beam from Loom M-003 to Toyota JAT810 Airjet (M-004) and authorize 4-hour overtime shift to recover 1,800m deficit.",
            affected_entity_type="machine",
            affected_entity_id="M-003",
            proposed_actions=[
                {"type": "transfer_warp_beam", "description": "Unload warp beam from M-003, inspect reed alignment, mount on M-004"},
                {"type": "authorize_overtime", "description": "Authorize 4-hour Weekend Overtime for Weaving Shift B (Senior Operator: Manoj Gupta)"},
                {"type": "reallocate_production_order", "description": "Re-assign PO-2026-001 to M-004 upon completion of current batch on M-004"},
            ],
            expected_outcome="Recovers delivery schedule completely. ETA: 2026-10-16 vs. SLA deadline 2026-10-17. Net cost: ₹1,450 (vs. ₹4,800 penalty for SLA breach).",
            estimated_delay_reduction_hours=108.0,  # 4.5 days
            estimated_cost_impact=1450.0,
            risk_assessment="low;pros:Full schedule recovery (ETA meets deadline)|Airjet produces higher pick uniformity on 50D filament|Lower total cost than penalty|cons:2-hour delay on secondary order (3-day buffer available)|approvals:Plant Manager|Production Supervisor",
            approval_status=ApprovalStatus.PENDING,
            execution_status=ExecutionStatus.NOT_STARTED,
        )
        db.add(plan_1)

    if "Emergency Servo Replacement + 24/7 Double Crew on Loom M-003" not in plan_titles:
        plan_2 = RecoveryPlan(
            alert_id=alert_breakdown.id,
            title="Emergency Servo Replacement + 24/7 Double Crew on Loom M-003",
            description="Dispatch emergency maintenance team to swap inverter module (SKU #DRV-PIC-400) from spare inventory and run continuous double-shift operations on Loom M-003.",
            affected_entity_type="machine",
            affected_entity_id="M-003",
            proposed_actions=[
                {"type": "issue_spare_parts", "description": "Issue replacement inverter module SKU #DRV-PIC-400 from maintenance warehouse"},
                {"type": "schedule_maintenance", "description": "Complete installation and 2-hour stress test by 14:00 PM today"},
                {"type": "run_double_shift", "description": "Run continuous 24-hour double crew on Loom M-003 after repair"},
            ],
            expected_outcome="Restores Loom M-003 to service and maintains production velocity. Estimated 3-day delay recovery. Loom M-003 restored to active fleet.",
            estimated_delay_reduction_hours=72.0,  # 3 days
            estimated_cost_impact=2800.0,
            risk_assessment="medium;pros:No disruption to other orders|Restores M-003 to active fleet|cons:Higher maintenance cost (₹2,800)|1-day residual risk if recalibration takes longer|approvals:Plant Manager",
            approval_status=ApprovalStatus.PENDING,
            execution_status=ExecutionStatus.NOT_STARTED,
        )
        db.add(plan_2)

    if "Split Batch: Ship 5,000m via Express Airfreight + Ship Balance by Sea" not in plan_titles:
        plan_3 = RecoveryPlan(
            alert_id=alert_breakdown.id,
            title="Split Batch: Ship 5,000m via Express Airfreight + Ship Balance by Sea",
            description="Negotiate partial delivery with Nordic Apparel buyer to satisfy immediate garment factory production line.",
            affected_entity_type="machine",
            affected_entity_id="M-003",
            proposed_actions=[
                {"type": "negotiate_partial_delivery", "description": "Contact Nordic Apparel sourcing manager for split shipment approval"},
                {"type": "expedite_finishing", "description": "Expedite finishing on first 5,000m batch available in warehouse"},
                {"type": "book_airfreight", "description": "Book DHL Express airfreight pallet for 2026-10-14 departure"},
            ],
            expected_outcome="Guarantees Nordic Apparel garment factory does not starve. Balance quantity delivered on regular schedule.",
            estimated_delay_reduction_hours=0.0,
            estimated_cost_impact=3900.0,
            risk_assessment="high;pros:Garment line not disrupted|Allows normal maintenance schedule|cons:Highest airfreight cost (₹3,900)|Requires buyer written consent|approvals:Plant Manager|Buyer Contact",
            approval_status=ApprovalStatus.PENDING,
            execution_status=ExecutionStatus.NOT_STARTED,
        )
        db.add(plan_3)

    # DYE SHADE VARIANCE ALERT — Quality Hold
    alert_dye = db.query(Alert).filter(Alert.title.contains("Dye Shade Variance")).first()
    if not alert_dye:
        alert_dye = Alert(
            category=AlertCategory.QUALITY_DEFECT_SPIKE,
            severity=AlertSeverity.HIGH,
            title="Dye Shade Variance Alert — Batch #DB-841 on Quality Hold",
            description="Spectrophotometer measured Delta E = 1.45 (tolerance: ≤ 0.8). 4,500m of Organic Cotton Oxford placed on Quality Hold. Center-to-selvedge shade variation detected, likely due to dye liquor pump pressure fluctuation during 90°C fixation ramp.",
            entity_type="machine",
            entity_id="M-005",
            status=AlertStatus.ACTIVE,
        )
        db.add(alert_dye)
        db.flush()

        plan_dye_1 = RecoveryPlan(
            alert_id=alert_dye.id,
            title="Mild Reductive Leveling Bath + Top-up Dyeing in DYE Vessel",
            description="Apply non-destructive specialty leveling agent (1.5 g/L Leveler SF at 80°C) to harmonize selvedge-to-center shade delta. Lab trial shows Delta E reduced to 0.48.",
            affected_entity_type="machine",
            affected_entity_id="M-005",
            proposed_actions=[
                {"type": "lab_test", "description": "Confirm lab beaker test pass with QA Lead — target Delta E < 0.8"},
                {"type": "chemical_treatment", "description": "Load 4,500m into Dyeing Vessel for 90-minute leveling cycle at 80°C"},
                {"type": "re_inspect", "description": "Re-inspect roll spectrophotometer reading and release for finishing"},
            ],
            expected_outcome="Saves 100% of fabric batch with zero scrap. Ready for finishing within 18 hours. Net cost ₹650 chemicals.",
            estimated_delay_reduction_hours=36.0,
            estimated_cost_impact=650.0,
            risk_assessment="low;pros:Lowest cost recovery (₹650 chemicals)|Saves 100% of fabric — zero scrap|Ready for finishing in 18 hours|cons:Occupies dyeing vessel for 3 hours|approvals:Quality Lead|Plant Manager",
            approval_status=ApprovalStatus.PENDING,
            execution_status=ExecutionStatus.NOT_STARTED,
        )
        db.add(plan_dye_1)

    # INVENTORY SHORTAGE ALERT
    alert_stock = db.query(Alert).filter(Alert.title.contains("Low Stock: Modal Spun Yarn")).first()
    if not alert_stock:
        alert_stock = Alert(
            category=AlertCategory.INVENTORY_SHORTAGE,
            severity=AlertSeverity.MEDIUM,
            title="Low Stock Warning: Modal Spun Yarn 40s",
            description="Current stock (150 kg) is below reorder threshold (300 kg). At current consumption rate of 35 kg/day, safety buffer depletes in 4.3 days. PO-2026-003 production start is at risk.",
            entity_type="material",
            entity_id="MAT-YRN-003",
            status=AlertStatus.ACTIVE,
        )
        db.add(alert_stock)
        db.flush()

        plan_stock_1 = RecoveryPlan(
            alert_id=alert_stock.id,
            title="Emergency Purchase Order to SilkRoute Yarns + Express Courier",
            description="Issue emergency PO to primary supplier SilkRoute Yarns for 500 kg Modal 40s at spot rate, with DHL Express delivery (3-day lead time).",
            affected_entity_type="material",
            affected_entity_id="MAT-YRN-003",
            proposed_actions=[
                {"type": "issue_emergency_po", "description": "Issue Emergency PO #EP-2026-012 to SilkRoute Yarns for 500 kg Modal Spun Yarn 40s"},
                {"type": "arrange_courier", "description": "Arrange DHL Express courier for 3-day delivery (vs. standard 7-day)"},
                {"type": "reschedule_po", "description": "Reschedule PO-2026-003 start by 2 days to accommodate delivery timeline"},
            ],
            expected_outcome="Stock replenished before critical shortage. Production PO-2026-003 delayed by only 2 days vs. 7-day stoppage. Net cost premium: ₹1,200.",
            estimated_delay_reduction_hours=120.0,
            estimated_cost_impact=1200.0,
            risk_assessment="low;pros:Fastest stock replenishment (3-day vs 7-day standard)|Minimizes production delay|cons:Express courier premium (₹1,200)|Spot rate 8% higher than contract rate|approvals:Plant Manager|Finance",
            approval_status=ApprovalStatus.PENDING,
            execution_status=ExecutionStatus.NOT_STARTED,
        )
        db.add(plan_stock_1)

    # ADDITIONAL NORDIC APPAREL SHIPMENT (for dispatch records page)
    shp_nordic = db.query(Shipment).filter(Shipment.shipment_number == "SHP-2026-002").first()
    if not shp_nordic and "ROL-2026-001" in created_rolls and "ROL-2026-002" in created_rolls:
        shp_nordic = Shipment(
            shipment_number="SHP-2026-002",
            sales_order_id=so_nordic.id,
            customer_id=c_nordic.id,
            status=ShipmentStatus.IN_TRANSIT,
            dispatch_date=now - timedelta(hours=6),
            tracking_reference="TRK-MSK-EU-99214482",
            carrier="Maersk Line Integrated Logistics",
            vehicle_number="KA-04-EV-9821",
            destination_address="Nordic Apparel Logistics Hub, Frihamnen Gate 4, 417 55 Goteborg, Sweden",
            notes="High-priority ocean container. Temperature controlled. ETA: 2026-10-20.",
            items=[
                ShipmentItem(roll_id=created_rolls["ROL-2026-001"].id, dispatched_quantity=500.0, unit="m"),
                ShipmentItem(roll_id=created_rolls["ROL-2026-002"].id, dispatched_quantity=500.0, unit="m"),
            ],
        )
        db.add(shp_nordic)

    db.commit()
    print("[SUCCESS] Everest Textile OS database seeded successfully with realistic demonstration factory data!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
