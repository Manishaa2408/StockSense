from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class SummaryMetrics(BaseModel):
    total_products: int
    total_stock_quantity: int
    total_available_quantity: int
    total_reserved_quantity: int
    total_warehouses: int
    total_locations: int
    low_stock_items: int
    out_of_stock_items: int
    pending_deliveries: int
    pending_receipts: int
    total_stock_valuation: float

class WarehouseDistributionItem(BaseModel):
    warehouse_id: int
    warehouse_name: str
    warehouse_code: str
    capacity: int
    total_units: int
    utilization_percentage: float
    product_count: int
    valuation: float

class LocationDistributionItem(BaseModel):
    location_id: int
    warehouse_name: str
    location_name: str
    location_code: str
    location_type: str
    total_units: int

class InventoryOverview(BaseModel):
    total_quantity: int
    available_quantity: int
    reserved_quantity: int
    active_products_count: int
    low_stock_count: int
    out_of_stock_count: int
    warehouse_breakdown: List[WarehouseDistributionItem]
    location_breakdown: List[LocationDistributionItem]

class MovementTrendPoint(BaseModel):
    date: str
    receipts: int
    deliveries: int
    transfers: int
    adjustments: int
    net_change: int

class StockMovementOverview(BaseModel):
    today_receipts: int
    today_deliveries: int
    today_transfers: int
    today_adjustments: int
    today_net_movement: int
    period_receipts: int
    period_deliveries: int
    period_transfers: int
    period_adjustments: int
    period_net_movement: int
    timeline: List[MovementTrendPoint]

class LowStockRiskItem(BaseModel):
    product_id: int
    sku: str
    name: str
    category_name: str
    unit_code: str
    total_quantity: int
    reserved_quantity: int
    available_quantity: int
    reorder_level: int
    status: str # "OUT_OF_STOCK" or "LOW_STOCK"
    shortage: int
    recommended_order: int

class ActivityLogItem(BaseModel):
    id: int
    user_name: Optional[str]
    action: str
    entity_type: str
    entity_id: str
    description: str
    metadata: Optional[str]
    created_at: str

class CategoryMetricItem(BaseModel):
    category_id: int
    category_name: str
    product_count: int
    total_units: int
    valuation: float
    percentage: float

class FilterOption(BaseModel):
    id: Any
    label: str
    code: Optional[str] = None

class FilterOptionsResponse(BaseModel):
    warehouses: List[FilterOption]
    categories: List[FilterOption]
    statuses: List[FilterOption]

# ====================================================================
# Module 12: Supplier / Vendor Schemas
# ====================================================================

class SupplierBase(BaseModel):
    code: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    contact_person: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    tax_id: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class SupplierStatusUpdate(BaseModel):
    status: str

class SupplierResponse(SupplierBase):
    id: int
    created_at: str
    updated_at: str
    products_count: Optional[int] = 0

class SupplierProductItem(BaseModel):
    id: int
    supplier_id: int
    product_id: int
    sku: str
    name: str
    category_name: Optional[str] = None
    unit_code: Optional[str] = None
    supplier_sku: Optional[str] = None
    unit_cost: float
    lead_time_days: int
    is_primary: int
    created_at: str

class SupplierDetailResponse(SupplierResponse):
    products: List[SupplierProductItem] = []

class SupplierProductCreate(BaseModel):
    product_id: int
    supplier_sku: Optional[str] = None
    unit_cost: Optional[float] = 0.0
    lead_time_days: Optional[int] = 7
    is_primary: Optional[int] = 0

class SupplierProductUpdate(BaseModel):
    supplier_sku: Optional[str] = None
    unit_cost: Optional[float] = None
    lead_time_days: Optional[int] = None
    is_primary: Optional[int] = None

class SupplierListResponse(BaseModel):
    items: List[SupplierResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class ProductLookupItem(BaseModel):
    id: int
    sku: str
    name: str
    category_name: str
    unit_code: str
    cost_price: float
    unit_price: float
