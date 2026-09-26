from typing import Optional, List
from fastapi import APIRouter, Depends, Query, Path, status

from models.schemas import (
    SupplierCreate,
    SupplierUpdate,
    SupplierStatusUpdate,
    SupplierResponse,
    SupplierDetailResponse,
    SupplierListResponse,
    SupplierProductItem,
    SupplierProductCreate,
    SupplierProductUpdate,
    ProductLookupItem
)
from services.auth_service import get_current_role, check_permission
from services.supplier_service import SupplierService

router = APIRouter(prefix="/api/v1/suppliers", tags=["Suppliers & Vendors"])

@router.get("", response_model=SupplierListResponse)
def list_suppliers(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Records per page"),
    search: Optional[str] = Query(None, description="Search by code, name, contact, city"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE / INACTIVE / ALL)"),
    role: str = Depends(get_current_role)
):
    """Lists suppliers with pagination, search, and status filtering."""
    check_permission(role, "supplier.view")
    return SupplierService.list_suppliers(
        page=page,
        limit=limit,
        search=search,
        status_filter=status
    )

@router.get("/lookup/products", response_model=List[ProductLookupItem])
def lookup_products(
    search: Optional[str] = Query(None, description="Search product name or SKU"),
    role: str = Depends(get_current_role)
):
    """Provides product catalog list for associating with suppliers."""
    check_permission(role, "supplier.view")
    return SupplierService.get_products_lookup(search=search)

@router.get("/{supplier_id}", response_model=SupplierDetailResponse)
def get_supplier(
    supplier_id: int = Path(..., ge=1, description="Supplier ID"),
    role: str = Depends(get_current_role)
):
    """Fetches supplier details including associated products."""
    check_permission(role, "supplier.view")
    return SupplierService.get_supplier_by_id(supplier_id)

@router.post("", response_model=SupplierDetailResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    data: SupplierCreate,
    role: str = Depends(get_current_role)
):
    """Onboards a new supplier master record."""
    check_permission(role, "supplier.create")
    return SupplierService.create_supplier(data)

@router.put("/{supplier_id}", response_model=SupplierDetailResponse)
def update_supplier(
    supplier_id: int = Path(..., ge=1),
    data: SupplierUpdate = ...,
    role: str = Depends(get_current_role)
):
    """Modifies supplier information while protecting code uniqueness."""
    check_permission(role, "supplier.update")
    return SupplierService.update_supplier(supplier_id, data)

@router.patch("/{supplier_id}/status", response_model=SupplierDetailResponse)
def update_supplier_status(
    supplier_id: int = Path(..., ge=1),
    data: SupplierStatusUpdate = ...,
    role: str = Depends(get_current_role)
):
    """Activates or deactivates a supplier (soft lifecycle management)."""
    check_permission(role, "supplier.status_update")
    return SupplierService.update_status(supplier_id, data.status)

@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int = Path(..., ge=1),
    role: str = Depends(get_current_role)
):
    """Soft-deactivates supplier to preserve historical integrity."""
    check_permission(role, "supplier.delete")
    return SupplierService.delete_supplier(supplier_id)

# -------------------------------------------------------------
# Supplier ↔ Product Relationship Endpoints
# -------------------------------------------------------------

@router.get("/{supplier_id}/products", response_model=List[SupplierProductItem])
def get_supplier_products(
    supplier_id: int = Path(..., ge=1),
    role: str = Depends(get_current_role)
):
    """Lists products provided by this supplier."""
    check_permission(role, "supplier.view")
    return SupplierService.get_supplier_products(supplier_id)

@router.post("/{supplier_id}/products", status_code=status.HTTP_201_CREATED)
def add_supplier_product(
    supplier_id: int = Path(..., ge=1),
    data: SupplierProductCreate = ...,
    role: str = Depends(get_current_role)
):
    """Associates a catalog product with this supplier."""
    check_permission(role, "supplier.update")
    return SupplierService.add_supplier_product(supplier_id, data)

@router.put("/{supplier_id}/products/{product_id}")
def update_supplier_product(
    supplier_id: int = Path(..., ge=1),
    product_id: int = Path(..., ge=1),
    data: SupplierProductUpdate = ...,
    role: str = Depends(get_current_role)
):
    """Updates unit cost, lead time or primary designation for a supplier product."""
    check_permission(role, "supplier.update")
    return SupplierService.update_supplier_product(supplier_id, product_id, data)

@router.delete("/{supplier_id}/products/{product_id}")
def remove_supplier_product(
    supplier_id: int = Path(..., ge=1),
    product_id: int = Path(..., ge=1),
    role: str = Depends(get_current_role)
):
    """Unlinks a product from this supplier."""
    check_permission(role, "supplier.update")
    return SupplierService.remove_supplier_product(supplier_id, product_id)
