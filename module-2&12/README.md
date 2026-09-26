# StockSense — Inventory Analytics & Supplier Management

> **Project:** StockSense – Inventory Management System  
> **Hackathon:** Odoo Hackathon  
> **Core Systems:** Real-Time Dashboard & Analytics • Supplier & Vendor Master Management  
> **Specification:** Single source of truth defined in `DATABASE_DESIGN.md`

---

## 📌 Executive Summary

StockSense provides a centralized operational command center and vendor master directory. Rather than requiring users to navigate multiple disparate screens across Products, Warehouses, Stock, Deliveries, Receipts, and Ledger, this system aggregates real-time data into a high-performance, decision-support analytics suite alongside a complete vendor lifecycle management workflow.

### Key Architectural Rule
> **Dashboard analytics acts strictly as a read/analytics query layer over the inventory database. It never mutates or owns underlying inventory truth.**  
> - Current stock is maintained by core inventory balances.
> - Deliveries and receipts maintain inbound/outbound transactions.
> - Stock movements & ledger record historical events.
> - Supplier management owns vendor master data and product catalog associations.

---

## 🏗️ Architecture & Features

### 1. High-Level Inventory KPIs
* **Total Products**: Count of active SKUs registered in the catalog.
* **Total Stock Quantity**: Physical units on hand across all facilities.
* **Total Available Quantity**: Physical units uncommitted and free for sales dispatches (`quantity - reserved_quantity`).
* **Total Reserved Quantity**: Units locked for staged deliveries.
* **Total Facilities**: Active warehouses and storage locations.
* **Low Stock Warning**: Products currently at or below their reorder threshold point.
* **Out of Stock Critical**: Products with zero available units.
* **Pending Deliveries**: Dispatches in `DRAFT`, `WAITING`, or `READY` status.
* **Pending Receipts**: Inbound supplier shipments awaiting check-in.
* **Total Stock Valuation**: Asset value of on-hand inventory computed as `quantity * cost_price` (accessible to Admin and Inventory Manager roles).

### 2. Live Inventory Overview
Answers *"What is the current inventory situation?"* with visual progress meters showing available vs reserved ratios, active SKU count, and top high-density storage locations (Racks, Pallet zones, Cold storage).

### 3. Warehouse Analytics & Capacity Utilization
* Multi-facility stock distribution across Dallas Central Hub, Pacific Gateway Hub, and Eastern Fulfilment Depot.
* Dynamic capacity utilization meters tracking unit fill rate against max capacity.
* SKU density and regional asset valuation.

### 4. Stock Movement Velocity & Historical Trends
* Summary metrics: Today's Receipts (+), Deliveries (-), Transfers, Adjustments, and Net Stock Velocity.
* Interactive 30-day timeline visualization comparing inbound flow against customer dispatches with hover inspection tooltips.
* Timeframe filtering: Today, 7 Days, 30 Days, 3 Months.

### 5. Low-Stock & Inventory Risk Section
* Real-time risk table identifying stock-outs and items below reorder threshold.
* Shortage calculation and automated replenishment order recommendation.
* Quick-action "Order Reorder" simulation with status toast notifications.

### 6. Recent Operational Activity Feed
* Merged timeline feed of system events (`activity_logs` + `stock_movements`).
* Actor identification, event timestamps, action category tags, and reference links (e.g. `DO-2026-1020`, `GR-2026-0871`, `TR-2026-0045`).

### 7. Role-Based Access Control
* **ADMIN**: Enterprise-wide view, full warehouse selection, valuation metrics, and audit log inspection.
* **INVENTORY_MANAGER**: Stock overview, movement velocity, low-stock reorder thresholds, and category asset distribution.
* **WAREHOUSE_STAFF**: Filtered specifically to assigned facility (Dallas Central Hub), restricted from financial valuations, focused on operational dispatches and receipts.

### 8. Global Filtering & Database-Level Performance
* Dropdown filters for Warehouse, Product Category, Stock Level Status (All / Low / Out / Healthy), and Timeframe.
* Conforms to **Rule 48** of `DATABASE_DESIGN.md`: all filtering is executed as parameterized SQL queries at the database layer rather than downloading unindexed records to the client.
* Export feature: Downloadable CSV reports for Inventory Valuation and Movement Ledger.

### 9. Supplier & Vendor Management
* **Master Records**: Comprehensive supplier directory with code, name, tax ID, primary contact, email, phone, full address, and operational notes.
* **Supplier-Product Association**: Normalized junction mapping (`supplier_products`) tracking vendor-specific SKUs, unit costs, delivery lead time (days), and primary vendor flags.
* **Soft Lifecycle**: Preserves historical transactions by setting inactive status (`ACTIVE -> INACTIVE`) rather than hard deleting records.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start Backend API Server
```powershell
cd "c:\Users\madhu\OneDrive\Desktop\oodo module-2\backend"
python main.py
```
* Backend runs at: `http://127.0.0.1:8000`
* Interactive OpenAPI / Swagger Documentation: `http://127.0.0.1:8000/docs`
* Re-seed database at any time: `python database/seed_data.py`

### 2. Start Frontend Dashboard
```powershell
cd "c:\Users\madhu\OneDrive\Desktop\oodo module-2\frontend"
npm run dev
```
* Frontend runs at: `http://localhost:5173`

---

## 📡 REST API Specification

### Dashboard & Analytics Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard/summary` | High-level KPI metrics & inventory asset valuation |
| `GET` | `/api/v1/dashboard/inventory` | Live inventory overview, available/reserved breakdown |
| `GET` | `/api/v1/dashboard/warehouses` | Warehouse stock distribution, capacity utilization |
| `GET` | `/api/v1/dashboard/movements` | Stock velocity, daily inbound/outbound timeline |
| `GET` | `/api/v1/dashboard/low-stock` | Critical stock-out risks & reorder recommendations |
| `GET` | `/api/v1/dashboard/activity` | Recent activity log audit trail |
| `GET` | `/api/v1/dashboard/categories` | Inventory share and valuation by product category |
| `GET` | `/api/v1/dashboard/role-context` | Current user permissions and warehouse restrictions |
| `GET` | `/api/v1/dashboard/export` | Downloadable CSV report (inventory or movements) |
| `GET` | `/api/v1/filters/options` | Dropdown options for warehouses, categories, statuses |

### Supplier / Vendor Management Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/suppliers` | Paginated supplier list with search and status filter |
| `GET` | `/api/v1/suppliers/{id}` | Detailed supplier profile + associated products list |
| `POST` | `/api/v1/suppliers` | Register new supplier (code uniqueness enforced) |
| `PUT` | `/api/v1/suppliers/{id}` | Modify supplier details |
| `PATCH` | `/api/v1/suppliers/{id}/status` | Activate or deactivate supplier (soft lifecycle) |
| `DELETE` | `/api/v1/suppliers/{id}` | Soft deactivation of supplier |
| `GET` | `/api/v1/suppliers/{id}/products` | List catalog products supplied by vendor |
| `POST` | `/api/v1/suppliers/{id}/products` | Link catalog product with vendor SKU & cost |
| `PUT` | `/api/v1/suppliers/{id}/products/{pid}` | Update cost, lead time, or primary supplier flag |
| `DELETE` | `/api/v1/suppliers/{id}/products/{pid}` | Unlink catalog product from vendor |
| `GET` | `/api/v1/suppliers/lookup/products` | Active catalog products for association dropdowns |

---

## 🗄️ Database Architecture Compliance

The SQLite database (`backend/stocksense.db`) is structured according to the baseline in `DATABASE_DESIGN.md`:
* Master Data: `categories`, `units`, `products`, `warehouses`, `locations`, `suppliers`, `supplier_products`
* Inventory: `stock`, `stock_movements` (with unique `(product_id, location_id)`)
* Inbound & Outbound: `receipts`, `receipt_items`, `deliveries`, `delivery_items`
* Operations: `transfers`, `transfer_items`, `inventory_adjustments`, `adjustment_items`
* Risk & Governance: `reorder_rules`, `alerts`, `notifications`, `activity_logs`
* Security: `users`, `roles`, `permissions`, `role_permissions`, `user_sessions`
