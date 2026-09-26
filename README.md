
```markdown
# 📦 StockSense – Inventory & Warehouse Management System

> **Odoo Hackathon Project**

StockSense is a modular, real-time Inventory and Warehouse Management System designed to digitize and streamline stock-related operations within a business.

The system replaces manual registers, spreadsheets, and disconnected stock-tracking methods with a centralized platform for managing products, warehouses, inventory, receipts, purchase orders, deliveries, stock transfers, inventory adjustments, stock movements, suppliers, and audit logging.

StockSense is designed around **modularity, scalability, security, usability, performance, and reliable database design**.

---

## 🚀 Quick Start & Local Setup

### Prerequisites

- **Node.js** v18+
- **MySQL** 8.0+
- **npm** v9+

### 1. Database Setup

Create the MySQL database in your local MySQL instance:

```sql
CREATE DATABASE textiledb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup

```bash
cd stocksense-app/server
cp .env.example .env
# Configure DB_USER, DB_PASSWORD, and DB_NAME in .env
npm install
npm run migrate
npm run seed
npm run start
```

Server runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd stocksense-app/client
npm install
npm run dev
```

Client runs on `http://localhost:5173`

### Default Credentials

```
Admin Email:    admin@stocksense.com
Admin Password: Admin@123
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend Framework** | Node.js + Express.js |
| **Database** | MySQL 8.0 |
| **Query Builder / ORM** | Knex.js |
| **Authentication** | JWT (JSON Web Tokens) + bcryptjs |
| **Validation** | Joi |
| **Frontend Framework** | React 18 + Vite |
| **UI Components & Icons** | Tailwind CSS + Lucide Icons |
| **Notifications** | React Hot Toast |
| **HTTP Client** | Axios |

---

## 📁 Project Structure

```
StockSense/
└── stocksense-app/
    ├── server/                         # Express.js REST API
    │   ├── db/
    │   │   ├── migrations/             # Knex database migrations (000001 - 000028)
    │   │   └── seeds/                  # Database seed files
    │   └── src/
    │       ├── config/                 # Environment, DB & Mail setup
    │       ├── constants/              # Error codes & event constants
    │       ├── middleware/             # JWT auth, RBAC authorization, error handler
    │       ├── modules/                # Core Business Modules
    │       │   ├── auth/               # Login, JWT, OTP password reset & mail log fallback
    │       │   ├── users/              # User account management & status toggling
    │       │   ├── roles/              # Role & permission mapping
    │       │   ├── profile/            # User profile management
    │       │   ├── categories/         # Product category catalog
    │       │   ├── units/              # Units of measure (UOM)
    │       │   ├── products/           # Product catalog with SKU & reorder thresholds
    │       │   ├── warehouses/         # Warehouse management
    │       │   ├── locations/          # Storage locations linked to warehouses
    │       │   ├── inventory/          # Stock levels (total, reserved, available)
    │       │   ├── goodsReceipts/      # Stock receiving (GRN) & inventory increments
    │       │   ├── purchaseOrders/     # PO master data & stock receiving against PO
    │       │   ├── deliveries/         # Delivery orders & stock dispatch lifecycle
    │       │   ├── stockTransfers/     # Inter-location stock transfers
    │       │   ├── adjustments/        # Stock adjustments (increase/decrease)
    │       │   ├── stockMovements/     # Ledger of all stock movement events
    │       │   ├── suppliers/          # Supplier & vendor directory
    │       │   ├── dashboard/          # Real-time analytics, metrics & low-stock alerts
    │       │   ├── audit/              # System audit trail logs
    │       │   └── notifications/      # In-app user notifications
    │       └── utils/                  # ApiResponse, ApiError, logger, OTP helpers
    ├── client/                         # React 18 SPA
    │   └── src/
    │       ├── api/                    # Configured Axios instance (`/api/v1` base URL)
    │       ├── components/             # UI Components (Button, Input, Select, Modal, Badge, Pagination)
    │       ├── contexts/               # AuthContext & state providers
    │       ├── layouts/                # AppLayout navigation shell & headers
    │       ├── pages/                  # Feature pages (Dashboard, Products, Warehouses, GRNs, POs, Deliveries, etc.)
    │       └── routes/                 # Protected & public route guards
    └── README.md
```

---

## 🧩 Implemented Business Modules

All 18 functional modules have been fully implemented across backend APIs, database schemas/migrations, and frontend React pages:

1. **Authentication & User Management (Module 01)**:
   - JWT authentication, secure password hashing, role-based authorization (RBAC).
   - OTP request & verification for forgot password flow with console/logger fallbacks.
   - User creation, edit, profile management, and account activation/deactivation.

2. **Dashboard & Analytics (Module 02)**:
   - Real-time inventory overview cards (Total Products, Active Warehouses, Pending Goods Receipts, Pending Deliveries).
   - Low-stock alert table with instant threshold monitoring.
   - Recent activity timeline tracking stock movement events.

3. **Product Catalog Management (Module 03)**:
   - SKU auto-formatting, product master data, reorder level settings, active/inactive toggles.
   - Paginated searching, filtering by name, SKU, category, or status.

4. **Category & Unit Management (Module 04)**:
   - Product categories and Units of Measure (UOM) management.

5. **Warehouse & Location Management (Module 05)**:
   - Multi-warehouse setup with code, name, and address.
   - Bin/Aisle/Rack storage location management linked to parent warehouses.

6. **Inventory & Stock Management (Module 06)**:
   - Real-time tracking of total quantity, reserved quantity, and net available stock.
   - Automated stock status calculation (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`).

7. **Stock Receiving / Goods Receipt (Module 07)**:
   - GRN creation with supplier, PO reference, warehouse, location, and item breakdown.
   - Status workflow (`DRAFT` → `RECEIVED` → `CONFIRMED` / `CANCELED`).
   - Confirmation automatically increments inventory stock and logs `RECEIPT` stock movement.

8. **Delivery Order Management (Module 08)**:
   - Delivery order lifecycle (`DRAFT` → `READY` → `PICKED` → `SHIPPED` → `DELIVERED`).
   - Stock reservation upon creation and automatic stock deduction upon dispatch.

9. **Purchase Orders (Module 09)**:
   - Purchase order creation with supplier dropdown, product lines, and pricing.
   - Stock receiving against purchase orders updating inventory records and stock movements.

10. **Stock Transfer Management (Module 10)**:
    - Internal stock transfers between storage locations with origin/destination tracking.

11. **Stock Adjustment Management (Module 11)**:
    - Stock quantity adjustments (increase/decrease) with documented reason codes.

12. **Supplier & Vendor Management (Module 12)**:
    - Supplier directory with code, contact person, email, phone, and address.

13. **Stock Movements & Audit Logging (Module 13 & 18)**:
    - Immutable stock movement ledger recording all IN/OUT/TRANSFER/ADJUSTMENT events.
    - System activity audit logs (`/api/v1/audit-logs`) tracking user operations.

---

## 📡 Comprehensive API Reference

### 🔐 Authentication & Profile (`/api/v1/auth`, `/api/v1/profile`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user account |
| POST | `/api/v1/auth/login` | Authenticate user & get JWT |
| POST | `/api/v1/auth/logout` | Revoke session |
| GET | `/api/v1/auth/me` | Get active user profile & permissions |
| POST | `/api/v1/auth/password/forgot` | Generate & log/send password reset OTP |
| POST | `/api/v1/auth/password/verify-otp` | Validate 6-digit reset OTP |
| POST | `/api/v1/auth/password/reset` | Set new password with verified OTP |
| GET | `/api/v1/profile` | View profile details |
| PUT | `/api/v1/profile` | Update profile information |
| PATCH | `/api/v1/profile/password` | Update current password |

### 👥 Users & Roles (`/api/v1/users`, `/api/v1/roles`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (paginated, search, filter) |
| GET | `/api/v1/users/:id` | Get user details and assigned permissions |
| POST | `/api/v1/users` | Create new user account |
| PUT | `/api/v1/users/:id` | Update user details |
| PATCH | `/api/v1/users/:id/status` | Toggle user status (ACTIVE / INACTIVE) |
| PATCH | `/api/v1/users/:id/role` | Update user assigned role |
| GET | `/api/v1/roles` | List system roles & permissions |
| GET | `/api/v1/roles/:id` | Get role permissions details |

### 📊 Dashboard & Audit (`/api/v1/dashboard`, `/api/v1/audit-logs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard/stats` | Fetch real-time system metrics, low-stock alerts & recent activities |
| GET | `/api/v1/audit-logs` | Fetch system audit history logs |
| GET | `/api/v1/audit-logs/meta` | Fetch audit log metadata & event filters |

### 📦 Products, Categories & Units (`/api/v1/products`, `/api/v1/categories`, `/api/v1/units`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products` | List products with pagination, search, category & unit filters |
| GET | `/api/v1/products/:id` | Get single product details |
| POST | `/api/v1/products` | Create new product |
| PUT | `/api/v1/products/:id` | Update product details |
| PATCH | `/api/v1/products/:id/status` | Toggle product status |
| GET | `/api/v1/categories` | List categories |
| POST | `/api/v1/categories` | Create category |
| GET | `/api/v1/units` | List units of measure |
| POST | `/api/v1/units` | Create unit of measure |

### 🏬 Warehouses & Locations (`/api/v1/warehouses`, `/api/v1/locations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/warehouses` | List warehouses |
| GET | `/api/v1/warehouses/:id` | Get warehouse details and location count |
| POST | `/api/v1/warehouses` | Create warehouse |
| PUT | `/api/v1/warehouses/:id` | Update warehouse details |
| PATCH | `/api/v1/warehouses/:id/status` | Toggle warehouse status |
| GET | `/api/v1/locations` | List storage locations |
| POST | `/api/v1/locations` | Create location linked to a warehouse |

### 📦 Inventory & Stock (`/api/v1/inventory`, `/api/v1/stock-movements`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/inventory` | List stock levels with pagination & status filters |
| GET | `/api/v1/inventory/summary` | Get aggregated stock summary metrics |
| GET | `/api/v1/inventory/:id` | Get stock level details |
| POST | `/api/v1/inventory/increase` | Manually increase stock at location |
| POST | `/api/v1/inventory/decrease` | Manually decrease stock at location |
| GET | `/api/v1/stock-movements` | Query immutable stock movement ledger |

### 🚚 Receipts, POs & Deliveries (`/api/v1/goods-receipts`, `/api/v1/purchase-orders`, `/api/v1/deliveries`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/goods-receipts` | List Goods Receipts (GRN) |
| POST | `/api/v1/goods-receipts` | Create new GRN draft |
| GET | `/api/v1/goods-receipts/:id` | Get GRN details & item lines |
| POST | `/api/v1/goods-receipts/:id/confirm` | Confirm GRN & increment stock |
| POST | `/api/v1/goods-receipts/:id/cancel` | Cancel GRN draft |
| GET | `/api/v1/purchase-orders` | List purchase orders |
| GET | `/api/v1/purchase-orders/master-data` | Fetch suppliers & products for PO creation |
| POST | `/api/v1/purchase-orders` | Create purchase order |
| GET | `/api/v1/deliveries` | List delivery orders |
| POST | `/api/v1/deliveries` | Create delivery order & reserve stock |
| POST | `/api/v1/deliveries/:id/ship` | Ship delivery order & deduct stock |

### 🤝 Suppliers & Transfers (`/api/v1/suppliers`, `/api/v1/stock-transfers`, `/api/v1/adjustments`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/suppliers` | List suppliers & vendors |
| POST | `/api/v1/suppliers` | Create new supplier |
| PUT | `/api/v1/suppliers/:id` | Update supplier details |
| PATCH | `/api/v1/suppliers/:id/status` | Toggle supplier active status |
| GET | `/api/v1/stock-transfers` | List inter-location stock transfers |
| POST | `/api/v1/stock-transfers` | Execute stock transfer |
| GET | `/api/v1/adjustments` | List inventory adjustments |
| POST | `/api/v1/adjustments` | Perform inventory quantity adjustment |
```
