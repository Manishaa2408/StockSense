from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Response, status
from fastapi.responses import PlainTextResponse

from models.schemas import (
    SummaryMetrics,
    InventoryOverview,
    StockMovementOverview,
    LowStockRiskItem,
    ActivityLogItem,
    CategoryMetricItem,
    WarehouseDistributionItem
)
from services.auth_service import get_current_role, get_role_context
from services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard & Analytics"])

@router.get("/summary", response_model=SummaryMetrics)
def get_summary(
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    role: str = Depends(get_current_role)
):
    """Retrieve high-level inventory KPIs."""
    return DashboardService.get_summary_metrics(
        warehouse_id=warehouse_id,
        category_id=category_id,
        role=role
    )

@router.get("/inventory", response_model=InventoryOverview)
def get_inventory(
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    role: str = Depends(get_current_role)
):
    """Answers 'What is the current inventory situation?' across warehouses and locations."""
    return DashboardService.get_inventory_overview(
        warehouse_id=warehouse_id,
        category_id=category_id,
        role=role
    )

@router.get("/warehouses", response_model=List[WarehouseDistributionItem])
def get_warehouses(
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID"),
    role: str = Depends(get_current_role)
):
    """Stock distribution and utilization rates by warehouse."""
    overview = DashboardService.get_inventory_overview(
        warehouse_id=warehouse_id,
        role=role
    )
    return overview["warehouse_breakdown"]

@router.get("/movements", response_model=StockMovementOverview)
def get_movements(
    period: str = Query("30d", description="Time period: today, 7d, 30d, 90d"),
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID")
):
    """Stock movement velocities and historical trendline."""
    return DashboardService.get_stock_movements_analytics(
        period=period,
        warehouse_id=warehouse_id
    )

@router.get("/low-stock", response_model=List[LowStockRiskItem])
def get_low_stock(
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    status: Optional[str] = Query(None, description="Filter status: OUT_OF_STOCK, LOW_STOCK, HEALTHY, ALL"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """Critical low-stock and out-of-stock items requiring replenishment."""
    return DashboardService.get_low_stock_risks(
        warehouse_id=warehouse_id,
        category_id=category_id,
        status_filter=status,
        limit=limit,
        offset=offset
    )

@router.get("/activity", response_model=List[ActivityLogItem])
def get_activity(
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID"),
    limit: int = Query(15, ge=1, le=50),
    role: str = Depends(get_current_role)
):
    """Recent operational events, delivery dispatches, receipts and adjustments."""
    return DashboardService.get_recent_activity(
        warehouse_id=warehouse_id,
        role=role,
        limit=limit
    )

@router.get("/categories", response_model=List[CategoryMetricItem])
def get_categories(
    warehouse_id: Optional[int] = Query(None, description="Filter by warehouse ID")
):
    """Stock units, count, and valuation broken down by product category."""
    return DashboardService.get_category_metrics(warehouse_id=warehouse_id)

@router.get("/role-context")
def get_user_role_context(role: str = Depends(get_current_role)):
    """Returns permissions and context for the active role."""
    return get_role_context(role)

@router.get("/export")
def export_csv(
    type: str = Query("inventory", pattern="^(inventory|movements)$"),
    warehouse_id: Optional[int] = Query(None)
):
    """Export dashboard data to downloadable CSV."""
    csv_data = DashboardService.export_dashboard_csv(
        metric_type=type,
        warehouse_id=warehouse_id
    )
    filename = f"stocksense_{type}_report.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
