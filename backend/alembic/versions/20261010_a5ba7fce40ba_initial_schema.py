"""initial_schema

Revision ID: a5ba7fce40ba
Revises: 
Create Date: 2026-10-10 10:27:10.237053

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5ba7fce40ba'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category', sa.Enum('PRODUCTION_DELAY', 'QUALITY_DEFECT_SPIKE', 'MACHINE_BREAKDOWN', 'INVENTORY_SHORTAGE', 'COST_OVERRUN', name='alert_category'), nullable=False),
        sa.Column('severity', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', name='alert_severity'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('entity_type', sa.String(length=64), nullable=True),
        sa.Column('entity_id', sa.String(length=64), nullable=True),
        sa.Column('status', sa.Enum('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED', name='alert_status'), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('alerts', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_alerts_category'), ['category'], unique=False)
        batch_op.create_index(batch_op.f('ix_alerts_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_alerts_severity'), ['severity'], unique=False)
        batch_op.create_index(batch_op.f('ix_alerts_status'), ['status'], unique=False)

    op.create_table('customers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('contact_person', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=64), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('tax_id', sa.String(length=64), nullable=True),
        sa.Column('payment_terms_days', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('customers', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_customers_code'), ['code'], unique=True)
        batch_op.create_index(batch_op.f('ix_customers_email'), ['email'], unique=False)
        batch_op.create_index(batch_op.f('ix_customers_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_customers_name'), ['name'], unique=False)

    op.create_table('materials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('material_code', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('material_type', sa.Enum('YARN', 'DYE_CHEMICAL', 'GREIGE_FABRIC', 'FINISHED_FABRIC', 'PACKAGING', name='material_type'), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=False),
        sa.Column('reorder_threshold', sa.Float(), nullable=False),
        sa.Column('current_stock', sa.Float(), nullable=False),
        sa.Column('safety_stock', sa.Float(), nullable=False),
        sa.Column('standard_cost_per_unit', sa.Float(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('materials', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_materials_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_materials_material_code'), ['material_code'], unique=True)
        batch_op.create_index(batch_op.f('ix_materials_material_type'), ['material_type'], unique=False)
        batch_op.create_index(batch_op.f('ix_materials_name'), ['name'], unique=False)

    op.create_table('shifts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('shift_name', sa.String(length=64), nullable=False),
        sa.Column('start_time', sa.String(length=10), nullable=False),
        sa.Column('end_time', sa.String(length=10), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('shift_name')
    )
    with op.batch_alter_table('shifts', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_shifts_id'), ['id'], unique=False)

    op.create_table('suppliers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('contact_person', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=64), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('payment_terms_days', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('suppliers', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_suppliers_code'), ['code'], unique=True)
        batch_op.create_index(batch_op.f('ix_suppliers_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_suppliers_name'), ['name'], unique=False)

    op.create_table('yarn_specifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sku', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('yarn_count', sa.String(length=64), nullable=False),
        sa.Column('yarn_type', sa.String(length=100), nullable=False),
        sa.Column('fibre_composition', sa.String(length=150), nullable=False),
        sa.Column('color_name', sa.String(length=100), nullable=False),
        sa.Column('color_code', sa.String(length=50), nullable=False),
        sa.Column('unit', sa.String(length=20), nullable=False),
        sa.Column('standard_cost_per_kg', sa.Float(), nullable=False),
        sa.Column('reorder_threshold_kg', sa.Float(), nullable=False),
        sa.Column('safety_stock_kg', sa.Float(), nullable=False),
        sa.Column('lead_time_days', sa.Integer(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_specifications', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_specifications_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_specifications_name'), ['name'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_specifications_sku'), ['sku'], unique=True)

    op.create_table('material_lots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lot_number', sa.String(length=64), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=True),
        sa.Column('received_quantity', sa.Float(), nullable=False),
        sa.Column('available_quantity', sa.Float(), nullable=False),
        sa.Column('reserved_quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=False),
        sa.Column('received_date', sa.Date(), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('unit_cost', sa.Float(), nullable=False),
        sa.Column('storage_location', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('material_lots', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_material_lots_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_material_lots_lot_number'), ['lot_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_material_lots_material_id'), ['material_id'], unique=False)

    op.create_table('sales_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_number', sa.String(length=64), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('order_date', sa.Date(), nullable=False),
        sa.Column('required_delivery_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'READY_FOR_DISPATCH', 'PARTIALLY_DISPATCHED', 'COMPLETED', 'CANCELLED', name='order_status'), nullable=False),
        sa.Column('priority', sa.Enum('LOW', 'NORMAL', 'HIGH', 'URGENT', name='order_priority'), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('sales_orders', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_sales_orders_customer_id'), ['customer_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_sales_orders_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_sales_orders_order_number'), ['order_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_sales_orders_status'), ['status'], unique=False)

    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.Enum('OWNER', 'MANAGER', 'PRODUCTION', 'QUALITY', 'INVENTORY', 'DISPATCH', 'FINANCE', 'BUYER', name='user_role'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)
        batch_op.create_index(batch_op.f('ix_users_id'), ['id'], unique=False)

    op.create_table('workers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('employee_code', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=64), nullable=False),
        sa.Column('department', sa.String(length=64), nullable=False),
        sa.Column('shift_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['shift_id'], ['shifts.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('workers', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_workers_employee_code'), ['employee_code'], unique=True)
        batch_op.create_index(batch_op.f('ix_workers_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_workers_name'), ['name'], unique=False)

    op.create_table('yarn_purchase_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('po_number', sa.String(length=64), nullable=False),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('order_date', sa.Date(), nullable=False),
        sa.Column('expected_delivery_date', sa.Date(), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', name='po_status'), nullable=False),
        sa.Column('total_ordered_kg', sa.Float(), nullable=False),
        sa.Column('total_received_kg', sa.Float(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_purchase_orders', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_purchase_orders_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_purchase_orders_po_number'), ['po_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_yarn_purchase_orders_status'), ['status'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_purchase_orders_supplier_id'), ['supplier_id'], unique=False)

    op.create_table('attendance_records',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('worker_id', sa.Integer(), nullable=False),
        sa.Column('shift_id', sa.Integer(), nullable=True),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('check_in', sa.DateTime(timezone=True), nullable=True),
        sa.Column('check_out', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['shift_id'], ['shifts.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['worker_id'], ['workers.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('attendance_records', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_attendance_records_date'), ['date'], unique=False)
        batch_op.create_index(batch_op.f('ix_attendance_records_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_attendance_records_worker_id'), ['worker_id'], unique=False)

    op.create_table('inventory_movements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('material_id', sa.Integer(), nullable=False),
        sa.Column('lot_id', sa.Integer(), nullable=True),
        sa.Column('movement_type', sa.Enum('RECEIPT', 'RESERVATION', 'CONSUMPTION', 'RELEASE', 'ADJUSTMENT', 'TRANSFER', name='movement_type'), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=False),
        sa.Column('source_location', sa.String(length=100), nullable=True),
        sa.Column('destination_location', sa.String(length=100), nullable=True),
        sa.Column('reference_type', sa.String(length=64), nullable=True),
        sa.Column('reference_id', sa.String(length=64), nullable=True),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('movement_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['lot_id'], ['material_lots.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('inventory_movements', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_inventory_movements_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_inventory_movements_lot_id'), ['lot_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_inventory_movements_material_id'), ['material_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_inventory_movements_movement_type'), ['movement_type'], unique=False)

    op.create_table('invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_number', sa.String(length=64), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('sales_order_id', sa.Integer(), nullable=True),
        sa.Column('total_amount', sa.Float(), nullable=False),
        sa.Column('paid_amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', name='invoice_status'), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['sales_order_id'], ['sales_orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('invoices', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_invoices_customer_id'), ['customer_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_invoices_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_invoices_invoice_number'), ['invoice_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_invoices_sales_order_id'), ['sales_order_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_invoices_status'), ['status'], unique=False)

    op.create_table('production_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('production_order_number', sa.String(length=64), nullable=False),
        sa.Column('sales_order_id', sa.Integer(), nullable=True),
        sa.Column('target_quantity', sa.Float(), nullable=False),
        sa.Column('completed_quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED', name='production_status'), nullable=False),
        sa.Column('planned_start_date', sa.Date(), nullable=True),
        sa.Column('planned_end_date', sa.Date(), nullable=True),
        sa.Column('actual_start_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('actual_end_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['sales_order_id'], ['sales_orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('production_orders', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_production_orders_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_production_orders_production_order_number'), ['production_order_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_production_orders_sales_order_id'), ['sales_order_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_production_orders_status'), ['status'], unique=False)

    op.create_table('recovery_plans',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('alert_id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('affected_entity_type', sa.String(length=64), nullable=False),
        sa.Column('affected_entity_id', sa.String(length=64), nullable=False),
        sa.Column('proposed_actions', sa.JSON(), nullable=False),
        sa.Column('expected_outcome', sa.Text(), nullable=False),
        sa.Column('estimated_delay_reduction_hours', sa.Float(), nullable=True),
        sa.Column('estimated_cost_impact', sa.Float(), nullable=True),
        sa.Column('risk_assessment', sa.String(length=255), nullable=False),
        sa.Column('approval_status', sa.Enum('PENDING', 'APPROVED', 'REJECTED', name='approval_status'), nullable=False),
        sa.Column('approved_by_id', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('execution_status', sa.Enum('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', name='execution_status'), nullable=False),
        sa.Column('execution_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['alert_id'], ['alerts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('recovery_plans', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_recovery_plans_alert_id'), ['alert_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_recovery_plans_approval_status'), ['approval_status'], unique=False)
        batch_op.create_index(batch_op.f('ix_recovery_plans_execution_status'), ['execution_status'], unique=False)
        batch_op.create_index(batch_op.f('ix_recovery_plans_id'), ['id'], unique=False)

    op.create_table('sales_order_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sales_order_id', sa.Integer(), nullable=False),
        sa.Column('fabric_type', sa.String(length=255), nullable=False),
        sa.Column('color_code', sa.String(length=64), nullable=True),
        sa.Column('gsm', sa.Integer(), nullable=True),
        sa.Column('width_inches', sa.Float(), nullable=True),
        sa.Column('target_quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('total_price', sa.Float(), nullable=False),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['sales_order_id'], ['sales_orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('sales_order_items', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_sales_order_items_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_sales_order_items_sales_order_id'), ['sales_order_id'], unique=False)

    op.create_table('shipments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('shipment_number', sa.String(length=64), nullable=False),
        sa.Column('sales_order_id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Enum('DRAFT', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', name='shipment_status'), nullable=False),
        sa.Column('dispatch_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('tracking_reference', sa.String(length=128), nullable=True),
        sa.Column('carrier', sa.String(length=128), nullable=True),
        sa.Column('vehicle_number', sa.String(length=64), nullable=True),
        sa.Column('destination_address', sa.String(length=500), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['customer_id'], ['customers.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['sales_order_id'], ['sales_orders.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('shipments', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_shipments_customer_id'), ['customer_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_shipments_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_shipments_sales_order_id'), ['sales_order_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_shipments_shipment_number'), ['shipment_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_shipments_status'), ['status'], unique=False)

    op.create_table('yarn_audit_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(length=100), nullable=False),
        sa.Column('entity_name', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.String(length=100), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_audit_events', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_audit_events_entity_id'), ['entity_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_audit_events_entity_name'), ['entity_name'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_audit_events_event_type'), ['event_type'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_audit_events_id'), ['id'], unique=False)

    op.create_table('yarn_goods_receipts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('receipt_number', sa.String(length=64), nullable=False),
        sa.Column('po_id', sa.Integer(), nullable=True),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('challan_number', sa.String(length=100), nullable=False),
        sa.Column('receipt_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('vehicle_number', sa.String(length=64), nullable=True),
        sa.Column('driver_name', sa.String(length=100), nullable=True),
        sa.Column('received_by_id', sa.Integer(), nullable=True),
        sa.Column('total_gross_weight_kg', sa.Float(), nullable=False),
        sa.Column('total_tare_weight_kg', sa.Float(), nullable=False),
        sa.Column('total_net_weight_kg', sa.Float(), nullable=False),
        sa.Column('has_discrepancy', sa.Boolean(), nullable=False),
        sa.Column('discrepancy_details', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['po_id'], ['yarn_purchase_orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['received_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_goods_receipts', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_goods_receipts_challan_number'), ['challan_number'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_goods_receipts_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_goods_receipts_po_id'), ['po_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_goods_receipts_receipt_number'), ['receipt_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_yarn_goods_receipts_supplier_id'), ['supplier_id'], unique=False)

    op.create_table('yarn_po_lines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('po_id', sa.Integer(), nullable=False),
        sa.Column('specification_id', sa.Integer(), nullable=False),
        sa.Column('ordered_quantity_kg', sa.Float(), nullable=False),
        sa.Column('received_quantity_kg', sa.Float(), nullable=False),
        sa.Column('unit_price', sa.Float(), nullable=False),
        sa.Column('tolerance_percent', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['po_id'], ['yarn_purchase_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['specification_id'], ['yarn_specifications.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_po_lines', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_po_lines_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_po_lines_po_id'), ['po_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_po_lines_specification_id'), ['specification_id'], unique=False)

    op.create_table('cost_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category', sa.Enum('RAW_MATERIAL', 'ELECTRICITY', 'LABOR', 'DYE_CHEMICAL', 'OVERHEAD', 'MAINTENANCE', name='cost_category'), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('currency', sa.String(length=10), nullable=False),
        sa.Column('sales_order_id', sa.Integer(), nullable=True),
        sa.Column('production_order_id', sa.Integer(), nullable=True),
        sa.Column('entry_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['sales_order_id'], ['sales_orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('cost_entries', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_cost_entries_category'), ['category'], unique=False)
        batch_op.create_index(batch_op.f('ix_cost_entries_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_cost_entries_production_order_id'), ['production_order_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_cost_entries_sales_order_id'), ['sales_order_id'], unique=False)

    op.create_table('fabric_rolls',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('roll_code', sa.String(length=64), nullable=False),
        sa.Column('production_order_id', sa.Integer(), nullable=True),
        sa.Column('sales_order_id', sa.Integer(), nullable=True),
        sa.Column('fabric_type', sa.String(length=255), nullable=False),
        sa.Column('length_m', sa.Float(), nullable=False),
        sa.Column('weight_kg', sa.Float(), nullable=True),
        sa.Column('width_inches', sa.Float(), nullable=True),
        sa.Column('gsm', sa.Integer(), nullable=True),
        sa.Column('grade', sa.Enum('GRADE_A', 'GRADE_B', 'GRADE_C', 'SCRAP', name='roll_grade'), nullable=False),
        sa.Column('current_status', sa.Enum('UNINSPECTED', 'PASS', 'HOLD', 'REWORK', 'REJECTED', 'ALLOCATED_FOR_DISPATCH', 'DISPATCHED', name='roll_status'), nullable=False),
        sa.Column('current_location', sa.String(length=100), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['sales_order_id'], ['sales_orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('fabric_rolls', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_fabric_rolls_current_status'), ['current_status'], unique=False)
        batch_op.create_index(batch_op.f('ix_fabric_rolls_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_fabric_rolls_production_order_id'), ['production_order_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_fabric_rolls_roll_code'), ['roll_code'], unique=True)
        batch_op.create_index(batch_op.f('ix_fabric_rolls_sales_order_id'), ['sales_order_id'], unique=False)

    op.create_table('machines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('machine_code', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('process_type', sa.Enum('SPINNING', 'WEAVING', 'DYEING', 'FINISHING', 'PRINTING', 'CUTTING', 'STITCHING', 'PACKAGING', name='process_type'), nullable=False),
        sa.Column('status', sa.Enum('IDLE', 'RUNNING', 'STOPPED', 'MAINTENANCE', 'BREAKDOWN', name='machine_status'), nullable=False),
        sa.Column('active_production_order_id', sa.Integer(), nullable=True),
        sa.Column('current_speed_rpm', sa.Float(), nullable=True),
        sa.Column('shift_output_m', sa.Float(), nullable=False),
        sa.Column('downtime_reason', sa.String(length=255), nullable=True),
        sa.Column('data_source', sa.Enum('SIMULATOR', 'MANUAL', 'SENSOR', name='data_source_type'), nullable=False),
        sa.Column('last_heartbeat', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['active_production_order_id'], ['production_orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('machines', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_machines_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_machines_machine_code'), ['machine_code'], unique=True)
        batch_op.create_index(batch_op.f('ix_machines_status'), ['status'], unique=False)

    op.create_table('payments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('invoice_id', sa.Integer(), nullable=False),
        sa.Column('amount', sa.Float(), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.Enum('BANK_TRANSFER', 'CREDIT_LETTER', 'CHEQUE', 'CASH', name='payment_method'), nullable=False),
        sa.Column('reference_number', sa.String(length=128), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('payments', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_payments_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_payments_invoice_id'), ['invoice_id'], unique=False)

    op.create_table('yarn_goods_receipt_lines',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('receipt_id', sa.Integer(), nullable=False),
        sa.Column('specification_id', sa.Integer(), nullable=False),
        sa.Column('supplier_lot_number', sa.String(length=100), nullable=False),
        sa.Column('internal_lot_number', sa.String(length=100), nullable=False),
        sa.Column('ordered_quantity_kg', sa.Float(), nullable=False),
        sa.Column('gross_weight_kg', sa.Float(), nullable=False),
        sa.Column('net_weight_kg', sa.Float(), nullable=False),
        sa.Column('discrepancy_kg', sa.Float(), nullable=False),
        sa.Column('is_discrepant', sa.Boolean(), nullable=False),
        sa.Column('storage_location', sa.String(length=100), nullable=False),
        sa.Column('intended_production_order_id', sa.Integer(), nullable=True),
        sa.Column('quality_status', sa.Enum('PENDING', 'APPROVED', 'QUARANTINED', 'REJECTED', name='yarn_quality_status'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['intended_production_order_id'], ['production_orders.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['receipt_id'], ['yarn_goods_receipts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['specification_id'], ['yarn_specifications.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_goods_receipt_lines', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_goods_receipt_lines_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_goods_receipt_lines_internal_lot_number'), ['internal_lot_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_yarn_goods_receipt_lines_receipt_id'), ['receipt_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_goods_receipt_lines_specification_id'), ['specification_id'], unique=False)

    op.create_table('yarn_recommendations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recommendation_code', sa.String(length=64), nullable=False),
        sa.Column('target_production_order_id', sa.Integer(), nullable=True),
        sa.Column('specification_id', sa.Integer(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('problem_statement', sa.Text(), nullable=False),
        sa.Column('proposed_action', sa.String(length=255), nullable=False),
        sa.Column('expected_benefit', sa.Text(), nullable=False),
        sa.Column('risks_tradeoffs', sa.Text(), nullable=False),
        sa.Column('shortage_resolved_kg', sa.Float(), nullable=False),
        sa.Column('status', sa.Enum('PROPOSED', 'APPROVED', 'REJECTED', 'EXECUTED', name='recommendation_status'), nullable=False),
        sa.Column('priority', sa.String(length=30), nullable=False),
        sa.Column('evidence_data', sa.JSON(), nullable=True),
        sa.Column('approved_by_id', sa.Integer(), nullable=True),
        sa.Column('approved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['approved_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['specification_id'], ['yarn_specifications.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['target_production_order_id'], ['production_orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_recommendations', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_recommendations_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_recommendations_recommendation_code'), ['recommendation_code'], unique=True)

    op.create_table('machine_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.String(length=128), nullable=False),
        sa.Column('machine_id', sa.Integer(), nullable=False),
        sa.Column('production_order_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('downtime_reason', sa.String(length=255), nullable=True),
        sa.Column('data_source', sa.Enum('SIMULATOR', 'MANUAL', 'SENSOR', name='data_source_type_me'), nullable=False),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('machine_events', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_machine_events_event_id'), ['event_id'], unique=True)
        batch_op.create_index(batch_op.f('ix_machine_events_event_type'), ['event_type'], unique=False)
        batch_op.create_index(batch_op.f('ix_machine_events_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_machine_events_machine_id'), ['machine_id'], unique=False)

    op.create_table('production_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.String(length=128), nullable=False),
        sa.Column('production_order_id', sa.Integer(), nullable=False),
        sa.Column('machine_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=False),
        sa.Column('event_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('source', sa.Enum('SIMULATOR', 'MANUAL', 'SENSOR', name='data_source_type_pe'), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('production_events', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_production_events_event_id'), ['event_id'], unique=True)
        batch_op.create_index(batch_op.f('ix_production_events_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_production_events_production_order_id'), ['production_order_id'], unique=False)

    op.create_table('production_operations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('production_order_id', sa.Integer(), nullable=False),
        sa.Column('process_name', sa.String(length=100), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('machine_id', sa.Integer(), nullable=True),
        sa.Column('planned_quantity', sa.Float(), nullable=False),
        sa.Column('actual_quantity', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['machine_id'], ['machines.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('production_operations', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_production_operations_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_production_operations_production_order_id'), ['production_order_id'], unique=False)

    op.create_table('quality_inspections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('roll_id', sa.Integer(), nullable=False),
        sa.Column('inspector_id', sa.Integer(), nullable=True),
        sa.Column('inspection_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('result', sa.Enum('PASS', 'REWORK', 'HOLD', 'REJECT', name='inspection_result'), nullable=False),
        sa.Column('defect_count', sa.Integer(), nullable=False),
        sa.Column('defect_details', sa.JSON(), nullable=True),
        sa.Column('disposition', sa.String(length=255), nullable=False),
        sa.Column('points_per_100_sqm', sa.Float(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['inspector_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['roll_id'], ['fabric_rolls.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('quality_inspections', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_quality_inspections_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_quality_inspections_result'), ['result'], unique=False)
        batch_op.create_index(batch_op.f('ix_quality_inspections_roll_id'), ['roll_id'], unique=False)

    op.create_table('shipment_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('shipment_id', sa.Integer(), nullable=False),
        sa.Column('roll_id', sa.Integer(), nullable=False),
        sa.Column('dispatched_quantity', sa.Float(), nullable=False),
        sa.Column('unit', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['roll_id'], ['fabric_rolls.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['shipment_id'], ['shipments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('shipment_items', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_shipment_items_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_shipment_items_roll_id'), ['roll_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_shipment_items_shipment_id'), ['shipment_id'], unique=False)

    op.create_table('yarn_lots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('lot_number', sa.String(length=100), nullable=False),
        sa.Column('specification_id', sa.Integer(), nullable=False),
        sa.Column('receipt_line_id', sa.Integer(), nullable=True),
        sa.Column('supplier_id', sa.Integer(), nullable=False),
        sa.Column('physical_quantity_kg', sa.Float(), nullable=False),
        sa.Column('reserved_quantity_kg', sa.Float(), nullable=False),
        sa.Column('available_quantity_kg', sa.Float(), nullable=False),
        sa.Column('quarantined_quantity_kg', sa.Float(), nullable=False),
        sa.Column('quality_status', sa.Enum('PENDING', 'APPROVED', 'QUARANTINED', 'REJECTED', name='yarn_lot_quality_status'), nullable=False),
        sa.Column('storage_location', sa.String(length=100), nullable=False),
        sa.Column('received_date', sa.Date(), nullable=False),
        sa.Column('inspection_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['receipt_line_id'], ['yarn_goods_receipt_lines.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['specification_id'], ['yarn_specifications.id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['supplier_id'], ['suppliers.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_lots', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_lots_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_lots_lot_number'), ['lot_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_yarn_lots_quality_status'), ['quality_status'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_lots_specification_id'), ['specification_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_lots_supplier_id'), ['supplier_id'], unique=False)

    op.create_table('yarn_reservations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('reservation_number', sa.String(length=64), nullable=False),
        sa.Column('production_order_id', sa.Integer(), nullable=False),
        sa.Column('specification_id', sa.Integer(), nullable=False),
        sa.Column('lot_id', sa.Integer(), nullable=True),
        sa.Column('reserved_quantity_kg', sa.Float(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('reserved_by_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['lot_id'], ['yarn_lots.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['production_order_id'], ['production_orders.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reserved_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['specification_id'], ['yarn_specifications.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_reservations', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_reservations_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_reservations_lot_id'), ['lot_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_reservations_production_order_id'), ['production_order_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_reservations_reservation_number'), ['reservation_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_yarn_reservations_specification_id'), ['specification_id'], unique=False)

    op.create_table('yarn_stock_ledger_entries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entry_number', sa.String(length=64), nullable=False),
        sa.Column('specification_id', sa.Integer(), nullable=False),
        sa.Column('lot_id', sa.Integer(), nullable=True),
        sa.Column('transaction_type', sa.Enum('GOODS_RECEIPT', 'QUALITY_HOLD', 'QUALITY_RELEASE', 'RESERVATION', 'RESERVATION_RELEASE', 'MATERIAL_ISSUE', 'CONSUMPTION', 'ADJUSTMENT', 'RETURN_REVERSAL', name='yarn_transaction_type'), nullable=False),
        sa.Column('quantity_kg', sa.Float(), nullable=False),
        sa.Column('balance_after_kg', sa.Float(), nullable=False),
        sa.Column('reference_type', sa.String(length=64), nullable=False),
        sa.Column('reference_id', sa.String(length=100), nullable=False),
        sa.Column('actor_id', sa.Integer(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['actor_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['lot_id'], ['yarn_lots.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['specification_id'], ['yarn_specifications.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    with op.batch_alter_table('yarn_stock_ledger_entries', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_yarn_stock_ledger_entries_entry_number'), ['entry_number'], unique=True)
        batch_op.create_index(batch_op.f('ix_yarn_stock_ledger_entries_id'), ['id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_stock_ledger_entries_lot_id'), ['lot_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_stock_ledger_entries_specification_id'), ['specification_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_yarn_stock_ledger_entries_transaction_type'), ['transaction_type'], unique=False)



def downgrade() -> None:
    op.drop_table('yarn_stock_ledger_entries')
    op.drop_table('yarn_reservations')
    op.drop_table('yarn_lots')
    op.drop_table('shipment_items')
    op.drop_table('quality_inspections')
    op.drop_table('production_operations')
    op.drop_table('production_events')
    op.drop_table('machine_events')
    op.drop_table('yarn_recommendations')
    op.drop_table('yarn_goods_receipt_lines')
    op.drop_table('payments')
    op.drop_table('machines')
    op.drop_table('fabric_rolls')
    op.drop_table('cost_entries')
    op.drop_table('yarn_po_lines')
    op.drop_table('yarn_goods_receipts')
    op.drop_table('yarn_audit_events')
    op.drop_table('shipments')
    op.drop_table('sales_order_items')
    op.drop_table('recovery_plans')
    op.drop_table('production_orders')
    op.drop_table('invoices')
    op.drop_table('inventory_movements')
    op.drop_table('attendance_records')
    op.drop_table('yarn_purchase_orders')
    op.drop_table('workers')
    op.drop_table('users')
    op.drop_table('sales_orders')
    op.drop_table('material_lots')
    op.drop_table('yarn_specifications')
    op.drop_table('suppliers')
    op.drop_table('shifts')
    op.drop_table('materials')
    op.drop_table('customers')
    op.drop_table('alerts')
