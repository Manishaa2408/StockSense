import csv
import io
import datetime
from typing import Optional, List, Dict, Any
from database.connection import fetch_all, fetch_one
from services.auth_service import get_role_context

class DashboardService:

    @staticmethod
    def get_summary_metrics(
        warehouse_id: Optional[int] = None,
        category_id: Optional[int] = None,
        role: str = "ADMIN"
    ) -> Dict[str, Any]:
        """Calculates core KPI metrics strictly adhering to database rules."""
        role_ctx = get_role_context(role)
        # Apply warehouse restriction if warehouse_staff
        effective_warehouse_id = warehouse_id or role_ctx.get("warehouse_restriction")

        # 1. Total Products
        prod_where = ["p.status = 'ACTIVE'"]
        prod_params = []
        if category_id:
            prod_where.append("p.category_id = ?")
            prod_params.append(category_id)
        
        prod_query = f"""
            SELECT COUNT(DISTINCT p.id) as total_products
            FROM products p
            WHERE {' AND '.join(prod_where)}
        """
        prod_res = fetch_one(prod_query, tuple(prod_params))
        total_products = prod_res["total_products"] if prod_res else 0

        # 2. Stock Quantities & Valuation
        stock_where = ["1=1"]
        stock_params = []
        if effective_warehouse_id:
            stock_where.append("l.warehouse_id = ?")
            stock_params.append(effective_warehouse_id)
        if category_id:
            stock_where.append("p.category_id = ?")
            stock_params.append(category_id)

        stock_query = f"""
            SELECT 
                COALESCE(SUM(s.quantity), 0) as total_stock,
                COALESCE(SUM(s.reserved_quantity), 0) as total_reserved,
                COALESCE(SUM(s.quantity - s.reserved_quantity), 0) as total_available,
                COALESCE(SUM(s.quantity * p.cost_price), 0.0) as total_valuation
            FROM stock s
            JOIN locations l ON s.location_id = l.id
            JOIN products p ON s.product_id = p.id
            WHERE {' AND '.join(stock_where)}
        """
        stock_res = fetch_one(stock_query, tuple(stock_params))
        total_stock_qty = stock_res["total_stock"] if stock_res else 0
        total_reserved_qty = stock_res["total_reserved"] if stock_res else 0
        total_available_qty = stock_res["total_available"] if stock_res else 0
        valuation = float(stock_res["total_valuation"]) if (stock_res and role_ctx["can_view_valuation"]) else 0.0

        # 3. Warehouses & Locations Count
        if effective_warehouse_id:
            total_warehouses = 1
            loc_res = fetch_one("SELECT COUNT(*) as count FROM locations WHERE warehouse_id = ? AND status = 'ACTIVE'", (effective_warehouse_id,))
            total_locations = loc_res["count"] if loc_res else 0
        else:
            wh_res = fetch_one("SELECT COUNT(*) as count FROM warehouses WHERE status = 'ACTIVE'")
            total_warehouses = wh_res["count"] if wh_res else 0
            loc_res = fetch_one("SELECT COUNT(*) as count FROM locations WHERE status = 'ACTIVE'")
            total_locations = loc_res["count"] if loc_res else 0

        # 4. Low Stock and Out of Stock counts
        # Aggregated at product level across the filtered scope
        product_stock_where = ["p.status = 'ACTIVE'"]
        product_stock_params = []
        if category_id:
            product_stock_where.append("p.category_id = ?")
            product_stock_params.append(category_id)

        location_filter_clause = ""
        if effective_warehouse_id:
            location_filter_clause = "AND l.warehouse_id = ?"
            product_stock_params.append(effective_warehouse_id)

        risk_query = f"""
            SELECT 
                p.id,
                p.reorder_level,
                COALESCE(SUM(s.quantity), 0) as current_qty
            FROM products p
            LEFT JOIN stock s ON p.id = s.product_id
            LEFT JOIN locations l ON s.location_id = l.id {location_filter_clause}
            WHERE {' AND '.join(product_stock_where)}
            GROUP BY p.id, p.reorder_level
        """
        all_product_stocks = fetch_all(risk_query, tuple(product_stock_params))
        
        out_of_stock_items = 0
        low_stock_items = 0
        for item in all_product_stocks:
            qty = item["current_qty"]
            reorder = item["reorder_level"]
            if qty <= 0:
                out_of_stock_items += 1
            elif qty <= reorder:
                low_stock_items += 1

        # 5. Pending Deliveries & Pending Receipts
        deliv_params = []
        deliv_where = ["status IN ('DRAFT', 'WAITING', 'READY')"]
        if effective_warehouse_id:
            deliv_where.append("source_warehouse_id = ?")
            deliv_params.append(effective_warehouse_id)
        deliv_res = fetch_one(f"SELECT COUNT(*) as count FROM deliveries WHERE {' AND '.join(deliv_where)}", tuple(deliv_params))
        pending_deliveries = deliv_res["count"] if deliv_res else 0

        rec_params = []
        rec_where = ["status IN ('DRAFT', 'WAITING', 'READY')"]
        if effective_warehouse_id:
            rec_where.append("warehouse_id = ?")
            rec_params.append(effective_warehouse_id)
        rec_res = fetch_one(f"SELECT COUNT(*) as count FROM receipts WHERE {' AND '.join(rec_where)}", tuple(rec_params))
        pending_receipts = rec_res["count"] if rec_res else 0

        return {
            "total_products": total_products,
            "total_stock_quantity": total_stock_qty,
            "total_available_quantity": total_available_qty,
            "total_reserved_quantity": total_reserved_qty,
            "total_warehouses": total_warehouses,
            "total_locations": total_locations,
            "low_stock_items": low_stock_items,
            "out_of_stock_items": out_of_stock_items,
            "pending_deliveries": pending_deliveries,
            "pending_receipts": pending_receipts,
            "total_stock_valuation": round(valuation, 2)
        }

    @staticmethod
    def get_inventory_overview(
        warehouse_id: Optional[int] = None,
        category_id: Optional[int] = None,
        role: str = "ADMIN"
    ) -> Dict[str, Any]:
        """Provides full breakdown of current inventory state."""
        summary = DashboardService.get_summary_metrics(warehouse_id, category_id, role)

        # Warehouse breakdown
        wh_where = ["w.status = 'ACTIVE'"]
        wh_params = []
        if warehouse_id:
            wh_where.append("w.id = ?")
            wh_params.append(warehouse_id)

        wh_query = f"""
            SELECT 
                w.id as warehouse_id,
                w.name as warehouse_name,
                w.code as warehouse_code,
                w.capacity,
                COALESCE(SUM(s.quantity), 0) as total_units,
                COUNT(DISTINCT s.product_id) as product_count,
                COALESCE(SUM(s.quantity * p.cost_price), 0.0) as valuation
            FROM warehouses w
            LEFT JOIN locations l ON w.id = l.warehouse_id
            LEFT JOIN stock s ON l.id = s.location_id
            LEFT JOIN products p ON s.product_id = p.id
            WHERE {' AND '.join(wh_where)}
            GROUP BY w.id, w.name, w.code, w.capacity
            ORDER BY total_units DESC
        """
        wh_rows = fetch_all(wh_query, tuple(wh_params))
        warehouse_breakdown = []
        for r in wh_rows:
            cap = r["capacity"] or 1
            units = r["total_units"]
            utilization = round((units / cap) * 100, 2) if cap > 0 else 0.0
            warehouse_breakdown.append({
                "warehouse_id": r["warehouse_id"],
                "warehouse_name": r["warehouse_name"],
                "warehouse_code": r["warehouse_code"],
                "capacity": cap,
                "total_units": units,
                "utilization_percentage": utilization,
                "product_count": r["product_count"],
                "valuation": round(float(r["valuation"]), 2)
            })

        # Location breakdown
        loc_where = ["l.status = 'ACTIVE'"]
        loc_params = []
        if warehouse_id:
            loc_where.append("l.warehouse_id = ?")
            loc_params.append(warehouse_id)

        loc_query = f"""
            SELECT 
                l.id as location_id,
                w.name as warehouse_name,
                l.name as location_name,
                l.code as location_code,
                l.location_type,
                COALESCE(SUM(s.quantity), 0) as total_units
            FROM locations l
            JOIN warehouses w ON l.warehouse_id = w.id
            LEFT JOIN stock s ON l.id = s.location_id
            WHERE {' AND '.join(loc_where)}
            GROUP BY l.id, w.name, l.name, l.code, l.location_type
            ORDER BY total_units DESC
            LIMIT 15
        """
        loc_rows = fetch_all(loc_query, tuple(loc_params))
        location_breakdown = [
            {
                "location_id": lr["location_id"],
                "warehouse_name": lr["warehouse_name"],
                "location_name": lr["location_name"],
                "location_code": lr["location_code"],
                "location_type": lr["location_type"],
                "total_units": lr["total_units"]
            }
            for lr in loc_rows
        ]

        return {
            "total_quantity": summary["total_stock_quantity"],
            "available_quantity": summary["total_available_quantity"],
            "reserved_quantity": summary["total_reserved_quantity"],
            "active_products_count": summary["total_products"],
            "low_stock_count": summary["low_stock_items"],
            "out_of_stock_count": summary["out_of_stock_items"],
            "warehouse_breakdown": warehouse_breakdown,
            "location_breakdown": location_breakdown
        }

    @staticmethod
    def get_stock_movements_analytics(
        period: str = "30d",
        warehouse_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Aggregates historical and current movement velocities."""
        now = datetime.datetime.utcnow()
        days_map = {"today": 1, "7d": 7, "30d": 30, "90d": 90}
        days = days_map.get(period.lower(), 30)

        period_start = (now - datetime.timedelta(days=days)).strftime("%Y-%m-%d 00:00:00")
        today_start = now.strftime("%Y-%m-%d 00:00:00")

        # Base conditions
        wh_clause = ""
        params_today = [today_start]
        params_period = [period_start]

        if warehouse_id:
            wh_clause = """
                AND (
                    (sm.source_location_id IN (SELECT id FROM locations WHERE warehouse_id = ?))
                    OR
                    (sm.destination_location_id IN (SELECT id FROM locations WHERE warehouse_id = ?))
                )
            """
            params_today.extend([warehouse_id, warehouse_id])
            params_period.extend([warehouse_id, warehouse_id])

        # Today's activity
        today_sql = f"""
            SELECT 
                movement_type,
                COALESCE(SUM(quantity), 0) as total_qty
            FROM stock_movements sm
            WHERE sm.created_at >= ? {wh_clause}
            GROUP BY movement_type
        """
        today_data = {r["movement_type"]: r["total_qty"] for r in fetch_all(today_sql, tuple(params_today))}
        t_receipts = today_data.get("RECEIPT", 0)
        t_deliveries = today_data.get("DELIVERY", 0)
        t_transfers = today_data.get("TRANSFER", 0)
        t_adjustments = today_data.get("ADJUSTMENT", 0)
        t_net = t_receipts - t_deliveries + t_adjustments

        # Period totals
        period_sql = f"""
            SELECT 
                movement_type,
                COALESCE(SUM(quantity), 0) as total_qty
            FROM stock_movements sm
            WHERE sm.created_at >= ? {wh_clause}
            GROUP BY movement_type
        """
        period_data = {r["movement_type"]: r["total_qty"] for r in fetch_all(period_sql, tuple(params_period))}
        p_receipts = period_data.get("RECEIPT", 0)
        p_deliveries = period_data.get("DELIVERY", 0)
        p_transfers = period_data.get("TRANSFER", 0)
        p_adjustments = period_data.get("ADJUSTMENT", 0)
        p_net = p_receipts - p_deliveries + p_adjustments

        # Daily timeline
        timeline_sql = f"""
            SELECT 
                SUBSTR(sm.created_at, 1, 10) as move_date,
                sm.movement_type,
                COALESCE(SUM(sm.quantity), 0) as qty
            FROM stock_movements sm
            WHERE sm.created_at >= ? {wh_clause}
            GROUP BY move_date, sm.movement_type
            ORDER BY move_date ASC
        """
        timeline_rows = fetch_all(timeline_sql, tuple(params_period))
        
        # Build map per date
        dates_dict: Dict[str, Dict[str, int]] = {}
        # Prepopulate date range so there are no missing date gaps
        for i in range(days):
            d_str = (now - datetime.timedelta(days=(days - 1 - i))).strftime("%Y-%m-%d")
            dates_dict[d_str] = {"receipts": 0, "deliveries": 0, "transfers": 0, "adjustments": 0}

        for r in timeline_rows:
            d = r["move_date"]
            mtype = r["movement_type"]
            q = r["qty"]
            if d not in dates_dict:
                dates_dict[d] = {"receipts": 0, "deliveries": 0, "transfers": 0, "adjustments": 0}
            if mtype == "RECEIPT":
                dates_dict[d]["receipts"] += q
            elif mtype == "DELIVERY":
                dates_dict[d]["deliveries"] += q
            elif mtype == "TRANSFER":
                dates_dict[d]["transfers"] += q
            elif mtype == "ADJUSTMENT":
                dates_dict[d]["adjustments"] += q

        timeline = []
        for date_key in sorted(dates_dict.keys()):
            item = dates_dict[date_key]
            net_change = item["receipts"] - item["deliveries"] + item["adjustments"]
            timeline.append({
                "date": date_key,
                "receipts": item["receipts"],
                "deliveries": item["deliveries"],
                "transfers": item["transfers"],
                "adjustments": item["adjustments"],
                "net_change": net_change
            })

        return {
            "today_receipts": t_receipts,
            "today_deliveries": t_deliveries,
            "today_transfers": t_transfers,
            "today_adjustments": t_adjustments,
            "today_net_movement": t_net,
            "period_receipts": p_receipts,
            "period_deliveries": p_deliveries,
            "period_transfers": p_transfers,
            "period_adjustments": p_adjustments,
            "period_net_movement": p_net,
            "timeline": timeline
        }

    @staticmethod
    def get_low_stock_risks(
        warehouse_id: Optional[int] = None,
        category_id: Optional[int] = None,
        status_filter: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Returns products under reorder threshold or zero stock."""
        where_clauses = ["p.status = 'ACTIVE'"]
        params = []

        if category_id:
            where_clauses.append("p.category_id = ?")
            params.append(category_id)

        location_clause = ""
        if warehouse_id:
            location_clause = "AND l.warehouse_id = ?"
            params.append(warehouse_id)

        sql = f"""
            SELECT 
                p.id as product_id,
                p.sku,
                p.name,
                c.name as category_name,
                u.code as unit_code,
                p.reorder_level,
                COALESCE(SUM(s.quantity), 0) as total_quantity,
                COALESCE(SUM(s.reserved_quantity), 0) as reserved_quantity,
                COALESCE(SUM(s.quantity - s.reserved_quantity), 0) as available_quantity
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN units u ON p.unit_id = u.id
            LEFT JOIN stock s ON p.id = s.product_id
            LEFT JOIN locations l ON s.location_id = l.id {location_clause}
            WHERE {' AND '.join(where_clauses)}
            GROUP BY p.id, p.sku, p.name, c.name, u.code, p.reorder_level
        """
        rows = fetch_all(sql, tuple(params))
        
        risks = []
        for r in rows:
            qty = r["total_quantity"]
            reorder = r["reorder_level"]
            
            if qty <= 0:
                item_status = "OUT_OF_STOCK"
            elif qty <= reorder:
                item_status = "LOW_STOCK"
            else:
                item_status = "HEALTHY"

            # Apply status filter if supplied
            if status_filter and status_filter.upper() != "ALL":
                if item_status != status_filter.upper():
                    continue
            else:
                # By default, return only risks (OUT_OF_STOCK or LOW_STOCK) unless ALL requested
                if item_status == "HEALTHY" and (not status_filter or status_filter.upper() != "ALL"):
                    continue

            shortage = max(0, reorder - qty)
            rec_order = max(shortage * 2, 50) if shortage > 0 else 0

            risks.append({
                "product_id": r["product_id"],
                "sku": r["sku"],
                "name": r["name"],
                "category_name": r["category_name"],
                "unit_code": r["unit_code"],
                "total_quantity": qty,
                "reserved_quantity": r["reserved_quantity"],
                "available_quantity": r["available_quantity"],
                "reorder_level": reorder,
                "status": item_status,
                "shortage": shortage,
                "recommended_order": rec_order
            })

        # Sort: OUT_OF_STOCK first, then by shortage descending
        risks.sort(key=lambda x: (0 if x["status"] == "OUT_OF_STOCK" else (1 if x["status"] == "LOW_STOCK" else 2), -x["shortage"]))
        return risks[offset:offset + limit]

    @staticmethod
    def get_recent_activity(
        warehouse_id: Optional[int] = None,
        role: str = "ADMIN",
        limit: int = 15
    ) -> List[Dict[str, Any]]:
        """Returns merged, formatted activity timeline."""
        # Query activity logs joined with users
        sql = """
            SELECT 
                a.id,
                u.name as user_name,
                a.action,
                a.entity_type,
                a.entity_id,
                a.description,
                a.metadata,
                a.created_at
            FROM activity_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT ?
        """
        rows = fetch_all(sql, (limit,))
        return [
            {
                "id": r["id"],
                "user_name": r["user_name"] or "System Automator",
                "action": r["action"],
                "entity_type": r["entity_type"],
                "entity_id": r["entity_id"],
                "description": r["description"],
                "metadata": r["metadata"],
                "created_at": r["created_at"]
            }
            for r in rows
        ]

    @staticmethod
    def get_category_metrics(
        warehouse_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Aggregates inventory units, count and valuation by category."""
        wh_where = ""
        params = []
        if warehouse_id:
            wh_where = "AND l.warehouse_id = ?"
            params.append(warehouse_id)

        sql = f"""
            SELECT 
                c.id as category_id,
                c.name as category_name,
                COUNT(DISTINCT p.id) as product_count,
                COALESCE(SUM(s.quantity), 0) as total_units,
                COALESCE(SUM(s.quantity * p.cost_price), 0.0) as valuation
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.status = 'ACTIVE'
            LEFT JOIN stock s ON p.id = s.product_id
            LEFT JOIN locations l ON s.location_id = l.id {wh_where}
            WHERE c.status = 'ACTIVE'
            GROUP BY c.id, c.name
            ORDER BY total_units DESC
        """
        rows = fetch_all(sql, tuple(params))
        total_units_all = sum(r["total_units"] for r in rows) or 1
        
        results = []
        for r in rows:
            units = r["total_units"]
            percentage = round((units / total_units_all) * 100, 2)
            results.append({
                "category_id": r["category_id"],
                "category_name": r["category_name"],
                "product_count": r["product_count"],
                "total_units": units,
                "valuation": round(float(r["valuation"]), 2),
                "percentage": percentage
            })
        return results

    @staticmethod
    def export_dashboard_csv(metric_type: str = "inventory", warehouse_id: Optional[int] = None) -> str:
        """Generates downloadable CSV data for export."""
        output = io.StringIO()
        writer = csv.writer(output)

        if metric_type == "movements":
            writer.writerow(["ID", "Product SKU", "Movement Type", "Reference Type", "Reference ID", "Quantity", "Source Location", "Destination Location", "Timestamp"])
            wh_clause = ""
            params = []
            if warehouse_id:
                wh_clause = "WHERE l1.warehouse_id = ? OR l2.warehouse_id = ?"
                params.extend([warehouse_id, warehouse_id])

            sql = f"""
                SELECT 
                    sm.id, p.sku, sm.movement_type, sm.reference_type, sm.reference_id, sm.quantity,
                    l1.code as src_loc, l2.code as dst_loc, sm.created_at
                FROM stock_movements sm
                JOIN products p ON sm.product_id = p.id
                LEFT JOIN locations l1 ON sm.source_location_id = l1.id
                LEFT JOIN locations l2 ON sm.destination_location_id = l2.id
                {wh_clause}
                ORDER BY sm.created_at DESC
                LIMIT 500
            """
            for row in fetch_all(sql, tuple(params)):
                writer.writerow([
                    row["id"], row["sku"], row["movement_type"], row["reference_type"],
                    row["reference_id"], row["quantity"], row["src_loc"] or "N/A",
                    row["dst_loc"] or "N/A", row["created_at"]
                ])
        else: # default inventory report
            writer.writerow(["SKU", "Product Name", "Category", "Current Stock", "Reserved Stock", "Available Stock", "Reorder Level", "Unit Cost", "Total Valuation", "Status"])
            risks = DashboardService.get_low_stock_risks(warehouse_id=warehouse_id, status_filter="ALL", limit=500)
            # Fetch cost prices
            prod_costs = {r["id"]: r["cost_price"] for r in fetch_all("SELECT id, cost_price FROM products")}
            for item in risks:
                cost = prod_costs.get(item["product_id"], 0.0)
                val = round(item["total_quantity"] * cost, 2)
                writer.writerow([
                    item["sku"], item["name"], item["category_name"],
                    item["total_quantity"], item["reserved_quantity"],
                    item["available_quantity"], item["reorder_level"],
                    cost, val, item["status"]
                ])

        return output.getvalue()
