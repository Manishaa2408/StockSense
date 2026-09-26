import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.dashboard_service import DashboardService
from services.auth_service import get_role_context

def test_services():
    print("1. Testing Summary Metrics (All)...")
    summary = DashboardService.get_summary_metrics()
    print("   Total Products:", summary["total_products"])
    print("   Total Stock Qty:", summary["total_stock_quantity"])
    print("   Total Available Qty:", summary["total_available_quantity"])
    print("   Total Reserved Qty:", summary["total_reserved_quantity"])
    print("   Warehouses:", summary["total_warehouses"])
    print("   Locations:", summary["total_locations"])
    print("   Low Stock Items:", summary["low_stock_items"])
    print("   Out of Stock Items:", summary["out_of_stock_items"])
    print("   Pending Deliveries:", summary["pending_deliveries"])
    print("   Pending Receipts:", summary["pending_receipts"])
    print("   Valuation ($):", summary["total_stock_valuation"])
    
    assert summary["total_products"] >= 25, "Expected at least 25 products"
    assert summary["total_stock_quantity"] > 0
    assert summary["total_available_quantity"] + summary["total_reserved_quantity"] == summary["total_stock_quantity"]
    assert summary["total_warehouses"] == 3
    assert summary["out_of_stock_items"] >= 1
    assert summary["low_stock_items"] >= 1
    print("   [PASS] Summary metrics valid.")

    print("\n2. Testing Filtered Summary (Dallas Warehouse WH-DAL, id=1)...")
    dal_summary = DashboardService.get_summary_metrics(warehouse_id=1)
    print("   Dallas Stock Qty:", dal_summary["total_stock_quantity"])
    print("   Dallas Locations:", dal_summary["total_locations"])
    assert dal_summary["total_stock_quantity"] < summary["total_stock_quantity"]
    assert dal_summary["total_warehouses"] == 1
    print("   [PASS] Dallas warehouse filter works.")

    print("\n3. Testing Inventory Overview...")
    overview = DashboardService.get_inventory_overview()
    print("   Warehouses Breakdown Count:", len(overview["warehouse_breakdown"]))
    print("   Top Location:", overview["location_breakdown"][0]["location_name"], "Units:", overview["location_breakdown"][0]["total_units"])
    assert len(overview["warehouse_breakdown"]) == 3
    assert len(overview["location_breakdown"]) > 0
    print("   [PASS] Inventory overview valid.")

    print("\n4. Testing Stock Movements Velocity & 30-Day Timeline...")
    movements = DashboardService.get_stock_movements_analytics(period="30d")
    print("   Period Receipts:", movements["period_receipts"])
    print("   Period Deliveries:", movements["period_deliveries"])
    print("   Period Transfers:", movements["period_transfers"])
    print("   Period Adjustments:", movements["period_adjustments"])
    print("   Net Movement:", movements["period_net_movement"])
    print("   Timeline data points:", len(movements["timeline"]))
    assert len(movements["timeline"]) == 30
    assert movements["period_receipts"] > 0
    assert movements["period_deliveries"] > 0
    print("   [PASS] Stock movements velocity & timeline valid.")

    print("\n5. Testing Low-Stock & Out-of-Stock Risks...")
    risks = DashboardService.get_low_stock_risks(status_filter="ALL")
    print(f"   Found {len(risks)} products in risk evaluation.")
    out_of_stock = [r for r in risks if r["status"] == "OUT_OF_STOCK"]
    low_stock = [r for r in risks if r["status"] == "LOW_STOCK"]
    print(f"   Out of stock count: {len(out_of_stock)} (e.g. {out_of_stock[0]['sku']})")
    print(f"   Low stock count: {len(low_stock)} (e.g. {low_stock[0]['sku']}, shortage: {low_stock[0]['shortage']})")
    assert len(out_of_stock) >= 1
    assert len(low_stock) >= 1
    print("   [PASS] Risk items correctly classified.")

    print("\n6. Testing Activity Logs...")
    activity = DashboardService.get_recent_activity(limit=10)
    print(f"   Retrieved {len(activity)} activity logs.")
    print("   Latest event:", activity[0]["action"], "-", activity[0]["description"])
    assert len(activity) > 0
    print("   [PASS] Activity logs valid.")

    print("\n7. Testing Category Metrics...")
    cat_metrics = DashboardService.get_category_metrics()
    print(f"   Retrieved {len(cat_metrics)} categories.")
    for c in cat_metrics:
        print(f"   - {c['category_name']}: {c['total_units']} units ({c['percentage']}%), ${c['valuation']:,.2f}")
    assert len(cat_metrics) == 5
    print("   [PASS] Category analytics valid.")

    print("\n8. Testing Role Permissions Context...")
    admin_ctx = get_role_context("ADMIN")
    mgr_ctx = get_role_context("INVENTORY_MANAGER")
    staff_ctx = get_role_context("WAREHOUSE_STAFF")
    assert admin_ctx["can_view_valuation"] is True
    assert admin_ctx["can_view_audit_logs"] is True
    assert mgr_ctx["can_view_valuation"] is True
    assert staff_ctx["can_view_valuation"] is False
    assert staff_ctx["warehouse_restriction"] == 1
    print("   [PASS] Role permissions context verified.")

    print("\n9. Testing CSV Export...")
    csv_inv = DashboardService.export_dashboard_csv(metric_type="inventory")
    csv_mov = DashboardService.export_dashboard_csv(metric_type="movements")
    assert "SKU,Product Name" in csv_inv
    assert "Product SKU,Movement Type" in csv_mov
    print("   [PASS] CSV export generation verified.")

    # ---------------------------------------------------------
    # SUPPLIER / VENDOR MANAGEMENT TESTS
    # ---------------------------------------------------------
    from services.supplier_service import SupplierService
    from models.schemas import SupplierCreate, SupplierUpdate, SupplierProductCreate

    print("\n10. Testing Supplier Directory - List & Pagination...")
    sup_list = SupplierService.list_suppliers(page=1, limit=5)
    print(f"   Total suppliers: {sup_list['total']}, Page: {sup_list['page']}/{sup_list['total_pages']}, Returned: {len(sup_list['items'])}")
    assert sup_list["total"] >= 7
    assert len(sup_list["items"]) == 5
    print("   [PASS] Supplier listing and pagination valid.")

    print("\n11. Testing Supplier Search & Status Filtering...")
    search_res = SupplierService.list_suppliers(search="Apex")
    assert search_res["total"] >= 1
    assert "Apex" in search_res["items"][0]["name"]

    inactive_res = SupplierService.list_suppliers(status_filter="INACTIVE")
    assert inactive_res["total"] >= 1
    assert inactive_res["items"][0]["status"] == "INACTIVE"
    print("   [PASS] Search and status filtering work as expected.")

    print("\n12. Testing Supplier Details & Associated Products...")
    sup1 = SupplierService.get_supplier_by_id(1) # Apex
    print(f"   Supplier: {sup1['name']} ({sup1['code']}), Linked Products: {len(sup1['products'])}")
    assert len(sup1["products"]) >= 3
    assert sup1["products"][0]["supplier_sku"] is not None
    print("   [PASS] Supplier detail & associated products valid.")

    print("\n13. Testing Create Supplier & Uniqueness Validation...")
    from database.connection import execute_write
    execute_write("DELETE FROM suppliers WHERE code = 'SUP-TEST-99'")

    new_sup_data = SupplierCreate(
        code="SUP-TEST-99",
        name="Quantum Core Components",
        email="contact@quantumcore.com",
        phone="+1-555-0199",
        contact_person="Dr. Emmett Brown",
        city="Hill Valley",
        state="CA",
        country="USA"
    )
    created_sup = SupplierService.create_supplier(new_sup_data)
    assert created_sup["code"] == "SUP-TEST-99"
    assert created_sup["status"] == "ACTIVE"
    print(f"   Created supplier ID {created_sup['id']}: {created_sup['name']}")

    # Test duplicate code rejection
    try:
        SupplierService.create_supplier(new_sup_data)
        assert False, "Should have raised conflict on duplicate supplier code"
    except Exception as e:
        assert "SUPPLIER_CODE_EXISTS" in str(e.detail)
        print("   [PASS] Duplicate supplier code correctly rejected with 409 Conflict.")

    print("\n14. Testing Supplier Status Toggle (Activate/Deactivate)...")
    deactivated = SupplierService.update_status(created_sup["id"], "INACTIVE")
    assert deactivated["status"] == "INACTIVE"
    reactivated = SupplierService.update_status(created_sup["id"], "ACTIVE")
    assert reactivated["status"] == "ACTIVE"
    print("   [PASS] Supplier status lifecycle verified.")

    print("\n15. Testing Supplier <-> Product Association (Junction)...")
    # Link Product 6 (CAT6A Spool) to our test supplier
    link_data = SupplierProductCreate(
        product_id=6,
        supplier_sku="QNTM-CAT6-PRO",
        unit_cost=58.0,
        lead_time_days=6,
        is_primary=0
    )
    added_rel = SupplierService.add_supplier_product(created_sup["id"], link_data)
    assert added_rel["supplier_sku"] == "QNTM-CAT6-PRO"
    assert added_rel["unit_cost"] == 58.0

    # Test duplicate association rejection (Rule 5)
    try:
        SupplierService.add_supplier_product(created_sup["id"], link_data)
        assert False, "Should have rejected duplicate supplier product"
    except Exception as e:
        assert "SUPPLIER_PRODUCT_EXISTS" in str(e.detail)
        print("   [PASS] Duplicate supplier-product link rejected with 409 Conflict.")

    # Unlink product
    unlink_res = SupplierService.remove_supplier_product(created_sup["id"], 6)
    print("   [PASS] Unlinked product:", unlink_res["message"])

    # Clean up test supplier (soft-delete)
    SupplierService.delete_supplier(created_sup["id"])
    print("   [PASS] Soft-deleted test supplier.")

    print("\n" + "="*60)
    print("ALL INVENTORY & SUPPLIER MANAGEMENT SERVICES VERIFIED!")
    print("="*60)

if __name__ == "__main__":
    test_services()
