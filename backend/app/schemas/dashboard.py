from typing import List, Optional, Dict
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    active_orders_count: int
    orders_in_production: int
    pending_dispatch_rolls: int
    active_alerts_count: int
    critical_alerts_count: int
    low_stock_items_count: int
    running_machines_count: int
    total_machines_count: int
    overall_oee_percentage: float
    today_production_output_m: float
    monthly_revenue_booked: float
    monthly_collected_cash: float
    active_workers_on_shift: int


class ProductionTrendPoint(BaseModel):
    date: str # YYYY-MM-DD
    target_meterage: float
    actual_meterage: float
    efficiency_pct: float
    scrap_meterage: float


class ProductionTrendResponse(BaseModel):
    trend_data: List[ProductionTrendPoint]
    total_actual_m: float
    total_target_m: float
    average_efficiency_pct: float
