import math
import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status

from database.connection import fetch_all, fetch_one, execute_write
from models.schemas import SupplierCreate, SupplierUpdate, SupplierProductCreate, SupplierProductUpdate

class SupplierService:

    @staticmethod
    def list_suppliers(
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Lists suppliers with search, status filtering, product counts and pagination."""
        offset = (max(1, page) - 1) * limit
        where_clauses = ["1=1"]
        params = []

        if status_filter and status_filter.upper() != "ALL":
            where_clauses.append("s.status = ?")
            params.append(status_filter.upper())

        if search and search.strip():
            s_val = f"%{search.strip()}%"
            where_clauses.append("(s.code LIKE ? OR s.name LIKE ? OR s.contact_person LIKE ? OR s.city LIKE ? OR s.email LIKE ?)")
            params.extend([s_val, s_val, s_val, s_val, s_val])

        # 1. Total count
        count_sql = f"SELECT COUNT(*) as total FROM suppliers s WHERE {' AND '.join(where_clauses)}"
        total_res = fetch_one(count_sql, tuple(params))
        total = total_res["total"] if total_res else 0
        total_pages = math.ceil(total / limit) if total > 0 else 1

        # 2. Paginated rows with products_count
        query_sql = f"""
            SELECT 
                s.id, s.code, s.name, s.email, s.phone, s.contact_person,
                s.address_line1, s.address_line2, s.city, s.state, s.postal_code, s.country,
                s.tax_id, s.status, s.notes, s.created_at, s.updated_at,
                COUNT(sp.id) as products_count
            FROM suppliers s
            LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
            WHERE {' AND '.join(where_clauses)}
            GROUP BY s.id
            ORDER BY s.status ASC, s.name ASC
            LIMIT ? OFFSET ?
        """
        rows = fetch_all(query_sql, tuple(params + [limit, offset]))

        return {
            "items": rows,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }

    @staticmethod
    def get_supplier_by_id(supplier_id: int) -> Dict[str, Any]:
        """Fetches full supplier detail including associated products."""
        supplier = fetch_one("""
            SELECT 
                s.id, s.code, s.name, s.email, s.phone, s.contact_person,
                s.address_line1, s.address_line2, s.city, s.state, s.postal_code, s.country,
                s.tax_id, s.status, s.notes, s.created_at, s.updated_at,
                COUNT(sp.id) as products_count
            FROM suppliers s
            LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
            WHERE s.id = ?
            GROUP BY s.id
        """, (supplier_id,))

        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SUPPLIER_NOT_FOUND: Supplier ID {supplier_id} not found."
            )

        # Fetch associated products
        products_sql = """
            SELECT 
                sp.id, sp.supplier_id, sp.product_id,
                p.sku, p.name, c.name as category_name, u.code as unit_code,
                sp.supplier_sku, sp.unit_cost, sp.lead_time_days, sp.is_primary,
                sp.created_at
            FROM supplier_products sp
            JOIN products p ON sp.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE sp.supplier_id = ?
            ORDER BY sp.is_primary DESC, p.name ASC
        """
        products = fetch_all(products_sql, (supplier_id,))
        supplier["products"] = products
        return supplier

    @staticmethod
    def create_supplier(data: SupplierCreate) -> Dict[str, Any]:
        """Creates a new supplier after enforcing uniqueness and validation."""
        code = data.code.strip().upper()
        if not code or not data.name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier code and name are required."
            )

        # Rule 1: Supplier code must be unique
        existing = fetch_one("SELECT id FROM suppliers WHERE code = ?", (code,))
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"SUPPLIER_CODE_EXISTS: Supplier code '{code}' is already registered."
            )

        sql = """
            INSERT INTO suppliers (
                code, name, email, phone, contact_person, address_line1, address_line2,
                city, state, postal_code, country, tax_id, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            code,
            data.name.strip(),
            data.email.strip() if data.email else None,
            data.phone.strip() if data.phone else None,
            data.contact_person.strip() if data.contact_person else None,
            data.address_line1.strip() if data.address_line1 else None,
            data.address_line2.strip() if data.address_line2 else None,
            data.city.strip() if data.city else None,
            data.state.strip() if data.state else None,
            data.postal_code.strip() if data.postal_code else None,
            data.country.strip() if data.country else None,
            data.tax_id.strip() if data.tax_id else None,
            data.status or "ACTIVE",
            data.notes.strip() if data.notes else None
        )
        new_id = execute_write(sql, params)

        # Log activity
        execute_write("""
            INSERT INTO activity_logs (action, entity_type, entity_id, description, metadata)
            VALUES (?, ?, ?, ?, ?)
        """, (
            "SUPPLIER_CREATED",
            "Supplier",
            code,
            f"New supplier registered: {data.name.strip()} ({code})",
            f'{{"supplier_id": {new_id}, "contact": "{data.contact_person or ""}"}}'
        ))

        return SupplierService.get_supplier_by_id(new_id)

    @staticmethod
    def update_supplier(supplier_id: int, data: SupplierUpdate) -> Dict[str, Any]:
        """Updates supplier fields while protecting code uniqueness."""
        existing = fetch_one("SELECT id, code FROM suppliers WHERE id = ?", (supplier_id,))
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SUPPLIER_NOT_FOUND: Supplier ID {supplier_id} does not exist."
            )

        # If code is being modified, ensure it's not taken by another supplier
        if data.code:
            new_code = data.code.strip().upper()
            code_check = fetch_one("SELECT id FROM suppliers WHERE code = ? AND id != ?", (new_code, supplier_id))
            if code_check:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"SUPPLIER_CODE_EXISTS: Supplier code '{new_code}' is already assigned to another supplier."
                )
        else:
            new_code = existing["code"]

        updates = []
        params = []

        field_map = {
            "name": data.name,
            "email": data.email,
            "phone": data.phone,
            "contact_person": data.contact_person,
            "address_line1": data.address_line1,
            "address_line2": data.address_line2,
            "city": data.city,
            "state": data.state,
            "postal_code": data.postal_code,
            "country": data.country,
            "tax_id": data.tax_id,
            "status": data.status,
            "notes": data.notes
        }

        if data.code:
            updates.append("code = ?")
            params.append(new_code)

        for col, val in field_map.items():
            if val is not None:
                updates.append(f"{col} = ?")
                params.append(val.strip() if isinstance(val, str) else val)

        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(supplier_id)

        sql = f"UPDATE suppliers SET {', '.join(updates)} WHERE id = ?"
        execute_write(sql, tuple(params))

        return SupplierService.get_supplier_by_id(supplier_id)

    @staticmethod
    def update_status(supplier_id: int, new_status: str) -> Dict[str, Any]:
        """Toggles or sets supplier status (ACTIVE / INACTIVE)."""
        valid_status = new_status.strip().upper()
        if valid_status not in ["ACTIVE", "INACTIVE"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Status must be either 'ACTIVE' or 'INACTIVE'."
            )

        existing = fetch_one("SELECT id, code, name FROM suppliers WHERE id = ?", (supplier_id,))
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"SUPPLIER_NOT_FOUND: Supplier ID {supplier_id} not found."
            )

        execute_write("""
            UPDATE suppliers 
            SET status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (valid_status, supplier_id))

        # Log audit activity
        execute_write("""
            INSERT INTO activity_logs (action, entity_type, entity_id, description)
            VALUES (?, ?, ?, ?)
        """, (
            "SUPPLIER_STATUS_UPDATED",
            "Supplier",
            existing["code"],
            f"Supplier {existing['name']} ({existing['code']}) status set to {valid_status}"
        ))

        return SupplierService.get_supplier_by_id(supplier_id)

    @staticmethod
    def delete_supplier(supplier_id: int) -> Dict[str, str]:
        """Soft-deletes supplier to preserve historical audit trail (Rule 3)."""
        SupplierService.update_status(supplier_id, "INACTIVE")
        return {"message": f"Supplier {supplier_id} has been deactivated successfully."}

    # -------------------------------------------------------------
    # Supplier ↔ Product Relationship (Junction Management)
    # -------------------------------------------------------------

    @staticmethod
    def get_supplier_products(supplier_id: int) -> List[Dict[str, Any]]:
        """Returns products supplied by the specified vendor."""
        # Ensure supplier exists
        SupplierService.get_supplier_by_id(supplier_id)
        
        sql = """
            SELECT 
                sp.id, sp.supplier_id, sp.product_id,
                p.sku, p.name, c.name as category_name, u.code as unit_code,
                sp.supplier_sku, sp.unit_cost, sp.lead_time_days, sp.is_primary,
                sp.created_at
            FROM supplier_products sp
            JOIN products p ON sp.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE sp.supplier_id = ?
            ORDER BY sp.is_primary DESC, p.name ASC
        """
        return fetch_all(sql, (supplier_id,))

    @staticmethod
    def add_supplier_product(supplier_id: int, data: SupplierProductCreate) -> Dict[str, Any]:
        """Associates a catalog product with a supplier (Rule 4, 5, 6)."""
        supplier = fetch_one("SELECT id, status FROM suppliers WHERE id = ?", (supplier_id,))
        if not supplier:
            raise HTTPException(status_code=404, detail="SUPPLIER_NOT_FOUND")

        # Verify product exists in Module 03 catalog
        product = fetch_one("SELECT id, sku, name FROM products WHERE id = ?", (data.product_id,))
        if not product:
            raise HTTPException(status_code=404, detail="PRODUCT_NOT_FOUND: Product does not exist.")

        # Rule 5: Duplicate supplier-product relationships prohibited
        dup_check = fetch_one("""
            SELECT id FROM supplier_products 
            WHERE supplier_id = ? AND product_id = ?
        """, (supplier_id, data.product_id))
        if dup_check:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"SUPPLIER_PRODUCT_EXISTS: Supplier is already associated with product {product['sku']}."
            )

        # Rule 6: Primary supplier logic
        if data.is_primary == 1:
            # Unset primary flag for any other supplier providing this product
            execute_write("""
                UPDATE supplier_products 
                SET is_primary = 0 
                WHERE product_id = ?
            """, (data.product_id,))

        sql = """
            INSERT INTO supplier_products (
                supplier_id, product_id, supplier_sku, unit_cost, lead_time_days, is_primary
            ) VALUES (?, ?, ?, ?, ?, ?)
        """
        new_rel_id = execute_write(sql, (
            supplier_id,
            data.product_id,
            data.supplier_sku or product["sku"],
            data.unit_cost or 0.0,
            data.lead_time_days or 7,
            data.is_primary or 0
        ))

        return fetch_one("""
            SELECT 
                sp.id, sp.supplier_id, sp.product_id,
                p.sku, p.name, sp.supplier_sku, sp.unit_cost, sp.lead_time_days, sp.is_primary,
                sp.created_at
            FROM supplier_products sp
            JOIN products p ON sp.product_id = p.id
            WHERE sp.id = ?
        """, (new_rel_id,))

    @staticmethod
    def update_supplier_product(supplier_id: int, product_id: int, data: SupplierProductUpdate) -> Dict[str, Any]:
        """Updates pricing, lead time, or primary designation for a supplier product."""
        rel = fetch_one("""
            SELECT id FROM supplier_products 
            WHERE supplier_id = ? AND product_id = ?
        """, (supplier_id, product_id))
        if not rel:
            raise HTTPException(status_code=404, detail="SUPPLIER_PRODUCT_NOT_FOUND")

        updates = []
        params = []

        if data.supplier_sku is not None:
            updates.append("supplier_sku = ?")
            params.append(data.supplier_sku.strip())
        if data.unit_cost is not None:
            updates.append("unit_cost = ?")
            params.append(data.unit_cost)
        if data.lead_time_days is not None:
            updates.append("lead_time_days = ?")
            params.append(data.lead_time_days)
        if data.is_primary is not None:
            if data.is_primary == 1:
                # Unset other primary suppliers for this product
                execute_write("UPDATE supplier_products SET is_primary = 0 WHERE product_id = ?", (product_id,))
            updates.append("is_primary = ?")
            params.append(data.is_primary)

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.extend([supplier_id, product_id])
            sql = f"UPDATE supplier_products SET {', '.join(updates)} WHERE supplier_id = ? AND product_id = ?"
            execute_write(sql, tuple(params))

        return fetch_one("""
            SELECT 
                sp.id, sp.supplier_id, sp.product_id,
                p.sku, p.name, sp.supplier_sku, sp.unit_cost, sp.lead_time_days, sp.is_primary,
                sp.created_at
            FROM supplier_products sp
            JOIN products p ON sp.product_id = p.id
            WHERE sp.supplier_id = ? AND sp.product_id = ?
        """, (supplier_id, product_id))

    @staticmethod
    def remove_supplier_product(supplier_id: int, product_id: int) -> Dict[str, str]:
        """Unlinks a product from a supplier."""
        rel = fetch_one("SELECT id FROM supplier_products WHERE supplier_id = ? AND product_id = ?", (supplier_id, product_id))
        if not rel:
            raise HTTPException(status_code=404, detail="SUPPLIER_PRODUCT_NOT_FOUND")

        execute_write("DELETE FROM supplier_products WHERE supplier_id = ? AND product_id = ?", (supplier_id, product_id))
        return {"message": f"Product {product_id} unlinked from supplier {supplier_id}."}

    @staticmethod
    def get_products_lookup(search: Optional[str] = None) -> List[Dict[str, Any]]:
        """Provides list of products from Module 03 for linking to suppliers."""
        where = ["p.status = 'ACTIVE'"]
        params = []
        if search and search.strip():
            s = f"%{search.strip()}%"
            where.append("(p.sku LIKE ? OR p.name LIKE ?)")
            params.extend([s, s])

        sql = f"""
            SELECT 
                p.id, p.sku, p.name, c.name as category_name, u.code as unit_code,
                p.cost_price, p.unit_price
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE {' AND '.join(where)}
            ORDER BY p.name ASC
            LIMIT 100
        """
        return fetch_all(sql, tuple(params))
