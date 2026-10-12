from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.yarniq import (
    YarnSpecification,
    YarnPurchaseOrder,
    YarnGoodsReceipt,
    YarnLot,
    YarnStockLedgerEntry,
    YarnRecommendation,
    QualityStatus,
    POStatus,
    RecommendationStatus,
)
from app.schemas.yarniq import (
    YarnSpecificationRead,
    YarnPurchaseOrderRead,
    GoodsReceiptRead,
    GoodsReceiptCreate,
    YarnLotRead,
    ProductionReadinessRequest,
    ProductionReadinessResponse,
    StockoutRadarItem,
    CopilotQueryRequest,
    CopilotQueryResponse,
    RecommendationRead,
    RecommendationActionRequest,
    StockLedgerEntryRead,
    OverviewMetricsResponse,
)
from app.services.yarniq_service import (
    seed_yarniq_demo_data,
    get_overview_metrics,
    process_smart_gate_receipt,
    calculate_production_readiness,
    get_stockout_radar,
    ask_procurement_copilot,
    get_lot_traceability,
)
from app.core.exceptions import NotFoundException, TextileAppException

router = APIRouter(prefix="/yarniq", tags=["YarnIQ — Yarn Intelligence & Production Readiness Engine"])


@router.post("/seed", summary="Initialize or reset YarnIQ realistic demo scenario")
def seed_demo_data(
    force: bool = Query(False, description="Force reseed demo data"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Populates realistic demo data with suppliers, yarn specs, receipts, discrepancies, and production orders."""
    res = seed_yarniq_demo_data(db, force=force)
    return res


@router.get("/overview", response_model=OverviewMetricsResponse, summary="Get YarnIQ live overview metrics")
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns live KPI counts, inventory distribution, recent receipts, and action list."""
    # Ensure seed data exists
    seed_yarniq_demo_data(db, force=False)
    metrics = get_overview_metrics(db)
    return OverviewMetricsResponse(**metrics)


@router.get("/specifications", response_model=List[YarnSpecificationRead], summary="List yarn specification masters")
def list_specifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seed_yarniq_demo_data(db, force=False)
    specs = db.query(YarnSpecification).filter(YarnSpecification.is_active == True).all()
    return [YarnSpecificationRead.model_validate(s) for s in specs]


@router.get("/inventory", response_model=List[YarnLotRead], summary="Search and filter yarn inventory lots")
def list_inventory_lots(
    spec_id: Optional[int] = Query(None),
    quality_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seed_yarniq_demo_data(db, force=False)
    query = db.query(YarnLot).join(YarnSpecification)

    if spec_id:
        query = query.filter(YarnLot.specification_id == spec_id)
    if quality_status and quality_status != "all":
        query = query.filter(YarnLot.quality_status == QualityStatus(quality_status))

    lots = query.all()
    results = []
    for lot in lots:
        s = lot.specification
        supp = lot.supplier
        
        # Apply search filter if provided
        if search:
            q = search.lower()
            if (
                q not in lot.lot_number.lower()
                and q not in s.sku.lower()
                and q not in s.name.lower()
                and q not in s.color_name.lower()
                and q not in (supp.name.lower() if supp else "")
            ):
                continue

        results.append(
            YarnLotRead(
                id=lot.id,
                lot_number=lot.lot_number,
                specification_id=s.id,
                sku=s.sku,
                name=s.name,
                yarn_count=s.yarn_count,
                yarn_type=s.yarn_type,
                fibre_composition=s.fibre_composition,
                color_name=s.color_name,
                color_code=s.color_code,
                supplier_id=lot.supplier_id,
                supplier_name=supp.name if supp else "Supplier",
                physical_quantity_kg=lot.physical_quantity_kg,
                reserved_quantity_kg=lot.reserved_quantity_kg,
                available_quantity_kg=lot.available_quantity_kg,
                quarantined_quantity_kg=lot.quarantined_quantity_kg,
                quality_status=lot.quality_status,
                storage_location=lot.storage_location,
                received_date=lot.received_date,
                reorder_threshold_kg=s.reorder_threshold_kg,
                safety_stock_kg=s.safety_stock_kg,
                unit=s.unit,
            )
        )
    return results


@router.get("/purchase-orders", response_model=List[YarnPurchaseOrderRead], summary="List yarn purchase orders")
def list_purchase_orders(
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seed_yarniq_demo_data(db, force=False)
    query = db.query(YarnPurchaseOrder)
    if status_filter and status_filter != "all":
        query = query.filter(YarnPurchaseOrder.status == POStatus(status_filter))
    pos = query.order_by(YarnPurchaseOrder.expected_delivery_date.asc()).all()

    results = []
    for po in pos:
        lines_out = []
        for line in po.lines:
            s = line.specification
            lines_out.append({
                "id": line.id,
                "specification_id": s.id,
                "sku": s.sku,
                "yarn_name": s.name,
                "ordered_quantity_kg": line.ordered_quantity_kg,
                "received_quantity_kg": line.received_quantity_kg,
                "unit_price": line.unit_price,
                "tolerance_percent": line.tolerance_percent,
            })
        results.append(
            YarnPurchaseOrderRead(
                id=po.id,
                po_number=po.po_number,
                supplier_id=po.supplier_id,
                supplier_name=po.supplier.name if po.supplier else "Supplier",
                order_date=po.order_date,
                expected_delivery_date=po.expected_delivery_date,
                status=po.status,
                total_ordered_kg=po.total_ordered_kg,
                total_received_kg=po.total_received_kg,
                lines=lines_out,
            )
        )
    return results


@router.get("/receipts", response_model=List[GoodsReceiptRead], summary="List yarn goods receipts from gate")
def list_receipts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seed_yarniq_demo_data(db, force=False)
    receipts = db.query(YarnGoodsReceipt).order_by(YarnGoodsReceipt.receipt_timestamp.desc()).all()
    results = []
    for gr in receipts:
        lines_out = []
        for l in gr.lines:
            s = l.specification
            lines_out.append({
                "id": l.id,
                "specification_id": s.id,
                "sku": s.sku,
                "yarn_name": s.name,
                "supplier_lot_number": l.supplier_lot_number,
                "internal_lot_number": l.internal_lot_number,
                "ordered_quantity_kg": l.ordered_quantity_kg,
                "gross_weight_kg": l.gross_weight_kg,
                "net_weight_kg": l.net_weight_kg,
                "discrepancy_kg": l.discrepancy_kg,
                "is_discrepant": l.is_discrepant,
                "storage_location": l.storage_location,
                "quality_status": l.quality_status,
            })
        results.append(
            GoodsReceiptRead(
                id=gr.id,
                receipt_number=gr.receipt_number,
                po_id=gr.po_id,
                po_number=gr.purchase_order.po_number if gr.purchase_order else None,
                supplier_id=gr.supplier_id,
                supplier_name=gr.supplier.name if gr.supplier else "Supplier",
                challan_number=gr.challan_number,
                receipt_timestamp=gr.receipt_timestamp,
                vehicle_number=gr.vehicle_number,
                driver_name=gr.driver_name,
                total_gross_weight_kg=gr.total_gross_weight_kg,
                total_tare_weight_kg=gr.total_tare_weight_kg,
                total_net_weight_kg=gr.total_net_weight_kg,
                has_discrepancy=gr.has_discrepancy,
                discrepancy_details=gr.discrepancy_details,
                notes=gr.notes,
                lines=lines_out,
            )
        )
    return results


@router.post("/receipts", status_code=status.HTTP_201_CREATED, summary="Process Smart Gate yarn goods receipt")
def create_goods_receipt(
    payload: GoodsReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Processes arrival, compares against PO, detects discrepancies, generates lots and updates stock ledger."""
    res = process_smart_gate_receipt(db, payload.model_dump(), current_user)
    return res


@router.post("/readiness", response_model=ProductionReadinessResponse, summary="Production Readiness Engine — Signature Feature")
def evaluate_readiness(
    request: ProductionReadinessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Deterministic mathematical material readiness calculator (READY, AT RISK, BLOCKED with shortage in kg)."""
    seed_yarniq_demo_data(db, force=False)
    res = calculate_production_readiness(db, request.model_dump())
    return ProductionReadinessResponse(**res)


@router.get("/stockout-radar", response_model=List[StockoutRadarItem], summary="Get forward Stockout Radar projected shortage timelines")
def get_radar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns forward timeline projection taking into account stock, reservations, and PO arrivals."""
    seed_yarniq_demo_data(db, force=False)
    items = get_stockout_radar(db)
    return [StockoutRadarItem(**item) for item in items]


@router.post("/copilot", response_model=CopilotQueryResponse, summary="Ask Procurement Copilot operational questions")
def ask_copilot(
    request: CopilotQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Answers operational questions grounded in verified database lookups with evidence and suggested actions."""
    seed_yarniq_demo_data(db, force=False)
    ans = ask_procurement_copilot(
        db,
        query=request.query,
        context_order_id=request.context_order_id,
        context_sku=request.context_sku,
    )
    return CopilotQueryResponse(**ans)


@router.get("/recommendations", response_model=List[RecommendationRead], summary="List corrective action recommendations")
def list_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seed_yarniq_demo_data(db, force=False)
    recs = db.query(YarnRecommendation).order_by(YarnRecommendation.id.desc()).all()
    out = []
    for r in recs:
        out.append(
            RecommendationRead(
                id=r.id,
                recommendation_code=r.recommendation_code,
                target_production_order_id=r.target_production_order_id,
                target_order_number=r.production_order.production_order_number if r.production_order else None,
                specification_id=r.specification_id,
                sku=r.specification.sku if r.specification else None,
                title=r.title,
                problem_statement=r.problem_statement,
                proposed_action=r.proposed_action,
                expected_benefit=r.expected_benefit,
                risks_tradeoffs=r.risks_tradeoffs,
                shortage_resolved_kg=r.shortage_resolved_kg,
                status=r.status,
                priority=r.priority,
                evidence_data=r.evidence_data,
                created_at=r.created_at,
            )
        )
    return out


@router.post("/recommendations/{rec_id}/action", summary="Approve, reject, or execute corrective action proposal")
def handle_recommendation_action(
    rec_id: int,
    payload: RecommendationActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    rec = db.query(YarnRecommendation).filter(YarnRecommendation.id == rec_id).first()
    if not rec:
        raise NotFoundException("YarnRecommendation", str(rec_id))

    action_type = payload.action.lower()
    if action_type == "approve":
        rec.status = RecommendationStatus.APPROVED
        rec.approved_by_id = current_user.id
        msg = f"Recommendation {rec.recommendation_code} APPROVED. Transmitted to procurement queue."
    elif action_type == "reject":
        rec.status = RecommendationStatus.REJECTED
        msg = f"Recommendation {rec.recommendation_code} REJECTED."
    else:
        rec.status = RecommendationStatus.EXECUTED
        msg = f"Action {rec.recommendation_code} successfully executed."

    db.commit()
    return {"success": True, "message": msg, "new_status": rec.status.value}


@router.get("/traceability/{lot_identifier}", summary="Yarn DNA — forward and backward lot genealogy")
def get_traceability(
    lot_identifier: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Traces yarn lot to supplier, PO, delivery challan, test results, and all production orders consuming it."""
    seed_yarniq_demo_data(db, force=False)
    return get_lot_traceability(db, lot_identifier)


@router.get("/ledger", response_model=List[StockLedgerEntryRead], summary="Get immutable YarnIQ stock ledger")
def get_stock_ledger(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    seed_yarniq_demo_data(db, force=False)
    entries = db.query(YarnStockLedgerEntry).order_by(YarnStockLedgerEntry.timestamp.desc()).limit(50).all()
    results = []
    for e in entries:
        s = e.specification
        lot = e.lot
        results.append(
            StockLedgerEntryRead(
                id=e.id,
                entry_number=e.entry_number,
                specification_id=s.id,
                sku=s.sku,
                yarn_name=s.name,
                lot_number=lot.lot_number if lot else None,
                transaction_type=e.transaction_type,
                quantity_kg=e.quantity_kg,
                balance_after_kg=e.balance_after_kg,
                reference_type=e.reference_type,
                reference_id=e.reference_id,
                actor_name=e.actor.name if e.actor else "System",
                notes=e.notes,
                timestamp=e.timestamp,
            )
        )
    return results
