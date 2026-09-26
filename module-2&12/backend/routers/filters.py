from fastapi import APIRouter
from database.connection import fetch_all
from models.schemas import FilterOptionsResponse, FilterOption

router = APIRouter(prefix="/api/v1/filters", tags=["Filters & Dropdowns"])

@router.get("/options", response_model=FilterOptionsResponse)
def get_filter_options():
    """Provides dropdown options for global dashboard filters."""
    warehouses_db = fetch_all("SELECT id, name, code FROM warehouses WHERE status = 'ACTIVE' ORDER BY name")
    categories_db = fetch_all("SELECT id, name FROM categories WHERE status = 'ACTIVE' ORDER BY name")

    warehouses = [FilterOption(id=w["id"], label=w["name"], code=w["code"]) for w in warehouses_db]
    categories = [FilterOption(id=c["id"], label=c["name"]) for c in categories_db]
    statuses = [
        FilterOption(id="ALL", label="All Inventory Levels"),
        FilterOption(id="LOW_STOCK", label="Low Stock Warning"),
        FilterOption(id="OUT_OF_STOCK", label="Out of Stock Critical"),
        FilterOption(id="HEALTHY", label="Healthy Stock")
    ]

    return FilterOptionsResponse(
        warehouses=warehouses,
        categories=categories,
        statuses=statuses
    )
