# StockSense — Database Design & Architecture

> **Project:** StockSense – Inventory Management System
> **Hackathon:** Odoo Hackathon
> **Document:** Database Architecture & Design Specification
> **Status:** Architecture Baseline
> **Version:** 1.0

---

# 1. Purpose

This document defines the database architecture, entities, relationships, constraints, ownership boundaries, transaction rules, migration strategy, and data-integrity principles for StockSense.

This document is the **single source of truth for the StockSense database design**.

All developers and AI coding assistants must follow this document when creating or modifying database-related code.

The database must support:

* Real-time inventory information
* Multiple warehouses
* Multiple storage locations
* Product and category management
* Incoming stock
* Outgoing stock
* Internal transfers
* Inventory adjustments
* Stock movement history
* Reordering and alerts
* User and role management
* Notifications
* Auditability
* Scalability
* Data integrity

---

# 2. Core Database Principles

StockSense follows these principles.

## 2.1 Single Logical Database Design

The project has one logical database architecture.

Developers may use separate local database instances during development.

```text
                 SHARED DATABASE SCHEMA
                         │
             ┌───────────┴───────────┐
             │                       │
       Friend's Local DB        Developer B DB
             │                       │
        Module 01              Module 08+
```

The physical databases may be different during development, but their schema must follow the same migrations and architecture.

---

# 3. Database Ownership Model

Database ownership follows business modules.

## Developer A — Foundation / Core Inventory

Primary ownership:

```text
users
roles
permissions
role_permissions
user_sessions
password_reset_otps

categories
units
products

warehouses
locations

stock

receipts
receipt_items
```

## Developer B — Inventory Operations

Primary ownership:

```text
deliveries
delivery_items

transfers
transfer_items

inventory_adjustments
adjustment_items

stock_movements

reorder_rules
alerts
notifications
activity_logs
```

## Shared Architectural Entities

The following entities require agreement from both developers:

```text
users
products
warehouses
locations
stock
stock_movements
```

These must not be independently redesigned by individual developers.

---

# 4. Module-to-Database Mapping

| Module                                | Database Responsibility                 |
| ------------------------------------- | --------------------------------------- |
| 01 Authentication & User Management   | Users, roles, permissions, sessions     |
| 02 Dashboard & Analytics              | Read/query layer over existing entities |
| 03 Product Management                 | Products                                |
| 04 Category & Unit Management         | Categories, units                       |
| 05 Warehouse & Location Management    | Warehouses, locations                   |
| 06 Inventory & Stock Management       | Stock                                   |
| 07 Receipt Management                 | Receipts, receipt items                 |
| 08 Delivery Order Management          | Deliveries, delivery items              |
| 09 Internal Transfer Management       | Transfers, transfer items               |
| 10 Inventory Adjustment Management    | Adjustments, adjustment items           |
| 11 Stock Ledger & Movement History    | Stock movements                         |
| 12 Search & Filter Management         | Query layer                             |
| 13 Alerts & Reordering                | Reorder rules, alerts                   |
| 14 Notification & Activity            | Notifications, activity logs            |
| 15 Profile & Settings                 | User/profile-related settings           |
| 16 API & Business Logic               | No independent database ownership       |
| 17 Data & Persistence                 | Shared database infrastructure          |
| 18 Validation, Error Handling & Audit | Shared integrity/audit mechanisms       |

---

# 5. High-Level Database Structure

```text
AUTHENTICATION
│
├── users
├── roles
├── permissions
├── role_permissions
├── user_sessions
└── password_reset_otps


MASTER DATA
│
├── categories
├── units
├── products
├── warehouses
└── locations


INVENTORY
│
├── stock
└── stock_movements


INBOUND
│
├── receipts
└── receipt_items


OUTBOUND
│
├── deliveries
└── delivery_items


TRANSFER
│
├── transfers
└── transfer_items


ADJUSTMENT
│
├── inventory_adjustments
└── adjustment_items


ALERTS
│
├── reorder_rules
└── alerts


COMMUNICATION
│
└── notifications


AUDIT
│
└── activity_logs
```

---

# 6. Core Entity Relationship Model

The central relationships are:

```text
users
  │
  ├──< receipts.created_by
  ├──< deliveries.created_by
  ├──< transfers.created_by
  ├──< inventory_adjustments.created_by
  ├──< stock_movements.performed_by
  └──< activity_logs.user_id


categories
  │
  └──< products


units
  │
  └──< products


warehouses
  │
  └──< locations
          │
          └──< stock


products
  │
  ├──< stock
  ├──< receipt_items
  ├──< delivery_items
  ├──< transfer_items
  ├──< adjustment_items
  └──< stock_movements


receipts
  │
  └──< receipt_items


deliveries
  │
  └──< delivery_items


transfers
  │
  └──< transfer_items


inventory_adjustments
  │
  └──< adjustment_items
```

---

# 7. Primary Key Strategy

Every main entity must have a unique primary key.

Recommended:

```text
id
```

The exact implementation may use:

* UUID
* auto-increment integer
* another framework-supported identifier

The project must choose **one strategy consistently**.

Do not mix identifier strategies without a documented reason.

---

# 8. Timestamp Strategy

Business entities should normally contain:

```text
created_at
updated_at
```

Transactional records may additionally contain domain-specific dates:

```text
scheduled_date
received_date
completed_at
```

All timestamps must use a consistent timezone strategy.

Recommended:

```text
Store timestamps in UTC.
Convert to local timezone only for presentation.
```

---

# 9. Authentication Database

## 9.1 `users`

```text
users
------------------------------------------------
id                  PK
name
email               UNIQUE
password_hash
role_id             FK → roles.id
status
email_verified_at
last_login_at
created_at
updated_at
```

### Status

Recommended values:

```text
ACTIVE
INACTIVE
SUSPENDED
```

Users should generally be deactivated rather than physically deleted when historical records reference them.

---

# 10. `roles`

```text
roles
------------------------------------------------
id                  PK
name                UNIQUE
description
created_at
updated_at
```

Example roles:

```text
ADMIN
INVENTORY_MANAGER
WAREHOUSE_STAFF
```

The final role names should follow the application's authorization design.

---

# 11. `permissions`

```text
permissions
------------------------------------------------
id                  PK
code                UNIQUE
name
description
created_at
updated_at
```

Examples:

```text
product.view
product.create
product.update

delivery.view
delivery.create
delivery.update
delivery.validate
delivery.cancel

inventory.view
inventory.adjust
```

---

# 12. `role_permissions`

Many-to-many relationship:

```text
role_permissions
------------------------------------------------
role_id             FK → roles.id
permission_id       FK → permissions.id
```

Recommended primary key:

```text
(role_id, permission_id)
```

This prevents duplicate permission assignments.

---

# 13. `user_sessions`

Used for session/token management where applicable.

```text
user_sessions
------------------------------------------------
id
user_id             FK → users.id
token_identifier
expires_at
created_at
revoked_at
```

Sensitive authentication tokens must never be stored in plaintext if the chosen authentication architecture requires hashing or token protection.

---

# 14. `password_reset_otps`

```text
password_reset_otps
------------------------------------------------
id
user_id             FK → users.id
otp_hash
expires_at
attempt_count
used_at
created_at
```

OTP values must not be stored as plaintext.

---

# 15. Category Management

## `categories`

```text
categories
------------------------------------------------
id                  PK
name                UNIQUE
description
status
created_at
updated_at
```

Possible status:

```text
ACTIVE
INACTIVE
```

Optional future hierarchy:

```text
parent_category_id FK → categories.id
```

This should only be introduced if hierarchical categories are actually required.

---

# 16. Unit Management

## `units`

```text
units
------------------------------------------------
id                  PK
name
code                UNIQUE
description
status
created_at
updated_at
```

Examples:

```text
PCS
KG
L
BOX
M
```

---

# 17. Product Management

## `products`

```text
products
------------------------------------------------
id                  PK
sku                 UNIQUE
name
description
category_id         FK → categories.id
unit_id             FK → units.id
reorder_level
status
created_at
updated_at
```

### Important Rules

`sku` must be unique.

Product creation belongs to Module 03.

Other modules must reference the product rather than creating duplicate product records.

---

# 18. Warehouse Management

## `warehouses`

```text
warehouses
------------------------------------------------
id                  PK
name
code                UNIQUE
address
status
created_at
updated_at
```

Possible status:

```text
ACTIVE
INACTIVE
```

---

# 19. Location Management

## `locations`

```text
locations
------------------------------------------------
id                  PK
warehouse_id        FK → warehouses.id
name
code
location_type
status
created_at
updated_at
```

Recommended constraint:

```text
UNIQUE(warehouse_id, code)
```

This allows:

```text
Warehouse A / Rack A1
Warehouse B / Rack A1
```

but prevents duplicate location codes within the same warehouse.

---

# 20. ⭐ Stock Management

`stock` is one of the most important entities in StockSense.

## `stock`

```text
stock
------------------------------------------------
id
product_id          FK → products.id
location_id         FK → locations.id
quantity
reserved_quantity
created_at
updated_at
```

Recommended constraint:

```text
UNIQUE(product_id, location_id)
```

This means one product has one current stock record for a particular location.

---

# 21. Available Stock

Conceptually:

```text
available_quantity
=
quantity - reserved_quantity
```

Avoid storing redundant derived values unless there is a clear performance requirement.

If `available_quantity` is stored physically, every stock transaction must update it atomically with `quantity`.

---

# 22. Stock Integrity Rules

The application must ensure:

```text
quantity >= 0
reserved_quantity >= 0
reserved_quantity <= quantity
```

unless a documented future business rule explicitly allows another behavior.

---

# 23. ⭐ Stock Movement History

## `stock_movements`

This table represents inventory history.

```text
stock_movements
------------------------------------------------
id
product_id                  FK → products.id
source_location_id         FK → locations.id NULL
destination_location_id    FK → locations.id NULL
quantity
movement_type
reference_type
reference_id
performed_by                FK → users.id
created_at
```

---

# 24. Movement Types

Recommended:

```text
RECEIPT
DELIVERY
TRANSFER
ADJUSTMENT
```

Additional movement types must be explicitly documented before implementation.

---

# 25. Why Stock and Stock Movement Are Separate

`stock` represents:

> Current inventory state.

`stock_movements` represents:

> Historical inventory events.

Example:

```text
Current Stock
-------------
Laptop = 73
```

Movement history:

```text
+100 RECEIPT
-20  DELIVERY
-5   ADJUSTMENT
-2   DELIVERY
```

This provides traceability.

---

# 26. Reference Linking

A stock movement should identify the transaction that generated it.

Example:

```text
reference_type = DELIVERY
reference_id   = 101
```

This allows:

```text
Stock Movement
      ↓
Delivery #101
      ↓
Delivery Items
```

The same pattern applies to:

```text
RECEIPT
TRANSFER
ADJUSTMENT
```

---

# 27. Receipt Management

## `receipts`

```text
receipts
------------------------------------------------
id
reference               UNIQUE
warehouse_id            FK → warehouses.id
location_id             FK → locations.id
status
received_date
notes
created_by              FK → users.id
updated_by              FK → users.id
created_at
updated_at
```

---

# 28. `receipt_items`

```text
receipt_items
------------------------------------------------
id
receipt_id              FK → receipts.id
product_id              FK → products.id
quantity
created_at
updated_at
```

Relationship:

```text
Receipt
   │
   └──< Receipt Items
```

When a receipt is completed:

```text
Receipt
   ↓
Increase Stock
   ↓
Create Stock Movement
```

The stock update and movement creation must be atomic.

---

# 29. Delivery Management

## `deliveries`

This belongs to Module 08.

```text
deliveries
------------------------------------------------
id
reference               UNIQUE
source_warehouse_id     FK → warehouses.id
source_location_id      FK → locations.id
status
scheduled_date
notes
created_by              FK → users.id
updated_by              FK → users.id
created_at
updated_at
```

---

# 30. `delivery_items`

```text
delivery_items
------------------------------------------------
id
delivery_id             FK → deliveries.id
product_id              FK → products.id
requested_quantity
processed_quantity
created_at
updated_at
```

---

# 31. Delivery Transaction Rule

A completed delivery must perform:

```text
Validate Delivery
       ↓
Check Stock
       ↓
Decrease Stock
       ↓
Create Stock Movement
       ↓
Mark Delivery DONE
```

These operations must be executed within a database transaction.

---

# 32. Delivery Stock Rule

For every delivery item:

```text
requested_quantity <= available_stock
```

must be true before stock is deducted.

Example:

```text
Stock = 10
Delivery = 7

Allowed
Result = 3
```

But:

```text
Stock = 10
Delivery = 15

Rejected
```

Stock must not become negative.

---

# 33. Internal Transfers

## `transfers`

```text
transfers
------------------------------------------------
id
reference
source_warehouse_id
source_location_id
destination_warehouse_id
destination_location_id
status
scheduled_date
notes
created_by
updated_by
created_at
updated_at
```

---

# 34. `transfer_items`

```text
transfer_items
------------------------------------------------
id
transfer_id
product_id
quantity
created_at
updated_at
```

A completed transfer produces:

```text
Source Location
      ↓
    -10

Destination Location
      ↓
    +10
```

The operation must be atomic.

---

# 35. Inventory Adjustments

## `inventory_adjustments`

```text
inventory_adjustments
------------------------------------------------
id
reference
warehouse_id
location_id
status
reason
notes
created_by
approved_by
created_at
updated_at
```

---

# 36. `adjustment_items`

```text
adjustment_items
------------------------------------------------
id
adjustment_id
product_id
system_quantity
counted_quantity
difference
reason
```

Example:

```text
System Quantity: 73
Physical Count: 70
Difference: -3
```

This provides a much stronger audit trail than simply overwriting stock.

---

# 37. Reordering

## `reorder_rules`

```text
reorder_rules
------------------------------------------------
id
product_id
location_id
minimum_quantity
reorder_quantity
status
created_at
updated_at
```

The rule can be evaluated against current stock.

```text
Current Stock < Minimum Quantity
             ↓
       Reorder Required
```

---

# 38. Alerts

## `alerts`

```text
alerts
------------------------------------------------
id
alert_type
product_id
location_id
severity
message
status
created_at
resolved_at
```

Possible alert type:

```text
LOW_STOCK
OUT_OF_STOCK
REORDER_REQUIRED
```

---

# 39. Notifications

## `notifications`

```text
notifications
------------------------------------------------
id
user_id
type
title
message
is_read
created_at
read_at
```

Notifications reference users rather than duplicating user information.

---

# 40. Activity Logs

## `activity_logs`

Activity logs are different from stock movements.

### Stock Movement

Represents:

```text
Inventory changed.
```

### Activity Log

Represents:

```text
A user performed an application action.
```

## Structure

```text
activity_logs
------------------------------------------------
id
user_id
action
entity_type
entity_id
description
metadata
created_at
```

Example:

```text
User: John
Action: DELIVERY_VALIDATED
Entity: Delivery
Entity ID: 101
```

---

# 41. Database Constraints

The database must enforce integrity wherever possible.

## Unique Constraints

```text
users.email

roles.name

permissions.code

categories.name

units.code

products.sku

warehouses.code

deliveries.reference

receipts.reference

transfers.reference
```

## Composite Constraints

```text
stock(product_id, location_id)

locations(warehouse_id, code)
```

---

# 42. Foreign Key Strategy

Foreign keys must be used for relationships between core entities.

Examples:

```text
products.category_id
        ↓
categories.id
```

```text
products.unit_id
        ↓
units.id
```

```text
locations.warehouse_id
        ↓
warehouses.id
```

```text
stock.product_id
        ↓
products.id
```

```text
stock.location_id
        ↓
locations.id
```

```text
delivery_items.delivery_id
        ↓
deliveries.id
```

```text
delivery_items.product_id
        ↓
products.id
```

---

# 43. Delete Strategy

Avoid cascading deletes on historical transactional data without a clear reason.

For example:

```text
User
 ↓
Delivery
 ↓
Stock Movement
```

Deleting a user must not destroy the historical delivery.

Prefer:

```text
User → INACTIVE
```

rather than deleting the record.

Similarly, completed transactional records should generally be retained.

---

# 44. Transaction Management

Inventory-changing operations must use database transactions.

Examples:

```text
Receipt completion
Delivery completion
Transfer completion
Inventory adjustment completion
```

### Example

```text
BEGIN TRANSACTION

Check stock

Update stock

Create stock movement

Update transaction status

COMMIT
```

If any operation fails:

```text
ROLLBACK
```

---

# 45. Concurrency Control

Inventory is susceptible to race conditions.

Example:

```text
Stock = 10

User A → Delivery 8
User B → Delivery 7
```

The system must not allow both transactions to consume the same stock.

The stock check and deduction must be protected using an appropriate database transaction and concurrency mechanism supported by the selected database/backend.

The final invariant must remain:

```text
Stock >= 0
```

---

# 46. Indexing Strategy

Indexes should support frequent lookup and filtering operations.

Recommended initial indexes:

```text
users(email)

products(sku)

warehouses(code)

locations(warehouse_id)

stock(product_id)
stock(location_id)

deliveries(reference)
deliveries(status)
deliveries(source_location_id)
deliveries(scheduled_date)

receipts(reference)
receipts(status)

stock_movements(product_id)
stock_movements(created_at)
stock_movements(reference_id)
```

Do not create indexes on every column.

Indexes should be based on actual query patterns.

---

# 47. Pagination

Large collections must not be loaded completely.

Examples:

```text
Products
Deliveries
Receipts
Transfers
Stock Movements
Activity Logs
Notifications
```

APIs should support pagination.

Example:

```text
?page=1&limit=20
```

The exact pagination strategy can be adapted to the backend framework.

---

# 48. Search and Filtering

Filtering should happen at the database/query level.

Avoid:

```text
Database
   ↓
Fetch 10,000 records
   ↓
Frontend JavaScript filters them
```

Prefer:

```text
Frontend Filter
      ↓
API Query
      ↓
Database
      ↓
Filtered Result
```

This supports performance and scalability.

---

# 49. Data Validation

Validation must happen at multiple levels.

## Frontend

Provides immediate user feedback.

## Backend

Enforces business rules.

## Database

Enforces structural integrity.

Example:

```text
Frontend:
Quantity > 0

Backend:
Quantity > 0

Database:
Appropriate NOT NULL / CHECK constraints where supported
```

Frontend validation must never be treated as the only protection.

---

# 50. Security Principles

The database layer must follow:

```text
Least privilege
Parameterized queries / ORM
No raw user input in SQL
Password hashing
Sensitive token protection
Restricted database credentials
No database credentials in source code
No secrets committed to Git
```

Use environment variables for credentials.

Example:

```text
DATABASE_URL
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

Never commit actual credentials.

---

# 51. Environment Separation

Development environments should be separate from production.

Recommended:

```text
.env.development
.env.test
.env.production
```

Actual secret files should not be committed.

Use:

```text
.env.example
```

to document required variables.

---

# 52. Migration Strategy

All schema changes must be represented as migrations.

Example:

```text
database/
└── migrations/
    ├── 001_create_users
    ├── 002_create_roles
    ├── 003_create_permissions
    ├── 004_create_categories
    ├── 005_create_units
    ├── 006_create_products
    ├── 007_create_warehouses
    ├── 008_create_locations
    ├── 009_create_stock
    ├── 010_create_receipts
    ├── 011_create_receipt_items
    ├── 012_create_deliveries
    ├── 013_create_delivery_items
    └── ...
```

The actual filenames depend on the selected framework.

---

# 53. Migration Rules

Every database structure change must:

1. Have a migration.
2. Be committed to Git.
3. Be reversible where the framework supports safe rollback.
4. Avoid silently changing production data.
5. Be tested locally.
6. Be documented when it changes a shared entity.

---

# 54. Local Development Database

Each developer can have their own database.

Example:

```text
Friend:
stocksense_dev_friend

Developer B:
stocksense_dev_you
```

Both are generated from the same migrations.

Therefore:

```text
Git Repository
      ↓
Migrations
      ↓
Friend DB
      +
Developer B DB
```

---

# 55. Shared Database vs Shared Schema

The team should distinguish:

### Shared database design

YES.

### Shared database server during development

Not required.

### Shared database instance

Not recommended for independent development.

### Shared migration files

YES.

### Shared entity contracts

YES.

---

# 56. Module Development Rule

A module must not create another version of an entity owned by another module.

For example, Module 08 must NOT create:

```text
delivery_products
delivery_stock
delivery_locations
```

to replace the shared entities.

Instead:

```text
delivery_items.product_id
        ↓
products.id
```

and:

```text
delivery.source_location_id
        ↓
locations.id
```

and:

```text
delivery processing
        ↓
stock
```

---

# 57. Shared Entity Modification Rule

If a developer needs to change a shared entity such as:

```text
products
stock
locations
stock_movements
users
```

they must:

1. Explain why the change is required.
2. Update the database design documentation.
3. Update the migration.
4. Notify the other developer.
5. Test dependent modules.

Do not silently modify shared structures.

---

# 58. Stock Ownership Boundary

Module 06 owns the **current stock management behavior**.

Module 11 owns the **stock movement/ledger behavior**.

Module 08 consumes both.

Therefore:

```text
Module 08
   │
   ├── uses Stock Service
   │
   └── creates Stock Movement
```

It should not directly manipulate database tables from controller/UI code.

---

# 59. Business Logic Boundary

Recommended architecture:

```text
Controller / API
       ↓
Service / Business Logic
       ↓
Repository / ORM
       ↓
Database
```

Example:

```text
POST /deliveries/{id}/validate
          ↓
DeliveryController
          ↓
DeliveryService
          ↓
InventoryService
          ↓
Stock Repository
          ↓
Database
```

This keeps database logic separate from HTTP/UI logic.

---

# 60. Dashboard Database Strategy

The dashboard does not need a separate duplicate database.

Module 02 should query existing entities.

Examples:

```text
Total Products
      ↓
products

Low Stock
      ↓
stock + products

Pending Deliveries
      ↓
deliveries

Pending Receipts
      ↓
receipts

Recent Movements
      ↓
stock_movements
```

Avoid storing duplicate dashboard numbers unless there is a demonstrated performance requirement.

---

# 61. Auditability

For every important inventory operation, the system should be able to answer:

```text
What happened?
Which product?
Which location?
How much?
When?
Who performed it?
Which transaction caused it?
```

This is achieved through:

```text
Transaction
+
Stock Movement
+
User
+
Timestamp
+
Reference
```

---

# 62. Example: Complete Delivery Trace

Suppose:

```text
Product:
Laptop

Location:
Warehouse A / Rack 01

Current Stock:
50
```

User creates:

```text
Delivery:
DO-000123
Quantity:
5
```

After completion:

```text
stock
quantity = 45
```

and:

```text
stock_movements

product = Laptop
source_location = Rack 01
quantity = 5
movement_type = DELIVERY
reference_type = DELIVERY
reference_id = DO-000123
performed_by = User 42
```

Now the system can trace:

```text
Current Stock
      ↓
Stock Movement
      ↓
Delivery
      ↓
Delivery Item
      ↓
Product
      ↓
User
```

---

# 63. Example: Complete Receipt Trace

Before:

```text
Stock = 20
```

Receipt:

```text
GR-000050
Quantity = 30
```

After:

```text
Stock = 50
```

Movement:

```text
+30
RECEIPT
reference = GR-000050
```

---

# 64. Example: Complete Transfer Trace

Before:

```text
Rack A = 50
Rack B = 20
```

Transfer:

```text
TR-000010
Quantity = 10
```

After:

```text
Rack A = 40
Rack B = 30
```

Movement:

```text
source = Rack A
destination = Rack B
quantity = 10
movement_type = TRANSFER
reference = TR-000010
```

The entire operation is atomic.

---

# 65. Example: Adjustment Trace

Before:

```text
System = 50
Physical Count = 47
```

Adjustment:

```text
difference = -3
```

After:

```text
Stock = 47
```

Movement:

```text
movement_type = ADJUSTMENT
quantity = 3
reference = ADJUSTMENT-0001
```

The adjustment record retains the original system quantity and physical count.

---

# 66. Database Normalization

The schema should avoid unnecessary duplication.

For example, do not store:

```text
delivery_items.product_name
delivery_items.product_sku
```

if those values can be retrieved from:

```text
delivery_items.product_id
        ↓
products
```

This keeps the database normalized and prevents inconsistent duplicated values.

Denormalization should only be introduced for a demonstrated performance reason.

---

# 67. Performance Principles

The database implementation should:

* Use appropriate indexes.
* Use pagination.
* Avoid N+1 queries.
* Query only required records.
* Use transactions for inventory operations.
* Avoid unnecessary duplicate data.
* Avoid loading entire tables into application memory.
* Use efficient joins and filtering.
* Monitor slow queries if the application grows.

---

# 68. Backup and Recovery

For the final deployment environment, database backup strategy should include:

```text
Regular backups
Backup verification
Recovery procedure
```

During hackathon development, local database data may be disposable because the schema can be recreated through migrations and seed data.

---

# 69. Seed Data

Development seed data may be used for:

```text
Admin user
Test users
Sample categories
Sample units
Sample products
Sample warehouses
Sample locations
```

Seed data is for development/testing only.

It must not replace the application's real database functionality.

---

# 70. Static JSON Restriction

Static JSON may be used only for:

```text
Initial prototyping
Mock UI development
Temporary testing
```

It must not be the final source of inventory data.

Final application data must come from the database/API.

---

# 71. AI Coding Rules

Any AI coding assistant working on StockSense must follow these rules:

```text
1. Read DATABASE_DESIGN.md first.

2. Do not create duplicate shared entities.

3. Do not redesign Product, Stock, Warehouse,
   Location, User or Stock Movement independently.

4. Follow existing migrations.

5. Add migrations for schema changes.

6. Do not modify shared entities without coordination.

7. Use the existing ORM/database abstraction.

8. Keep database operations out of frontend code.

9. Use transactions for inventory-changing operations.

10. Do not use static JSON as the final data source.

11. Do not hardcode credentials.

12. Do not blindly introduce a new database technology.

13. Explain database changes before implementing them.

14. Keep module boundaries intact.

15. Run tests after database changes.
```

---

# 72. Git Database Workflow

Database changes are version controlled.

Example:

```text
Developer A
    │
    ├── Create migration
    ├── Test migration
    ├── Commit
    └── Push
          ↓
        GitHub
          ↓
Developer B
    │
    ├── Pull
    ├── Run migrations
    └── Local DB updated
```

---

# 73. Branch Strategy

Recommended:

```text
main
  │
  └── develop
       │
       ├── feature/module-01-auth
       ├── feature/module-03-products
       ├── feature/module-08-delivery
       └── feature/module-09-transfer
```

Database migrations must live inside the feature branch that introduces them.

---

# 74. Current Development State

At the beginning of parallel development:

## Developer A

Working on:

```text
Module 01
Authentication & User Management
```

Primary tables:

```text
users
roles
permissions
role_permissions
user_sessions
password_reset_otps
```

## Developer B

Working on:

```text
Module 08
Delivery Order Management
```

Primary tables:

```text
deliveries
delivery_items
```

## Shared contracts already agreed

```text
users
products
warehouses
locations
stock
stock_movements
```

The latter entities may be implemented incrementally as their owning modules are developed.

---

# 75. Current Module 08 Dependency

Module 08 depends conceptually on:

```text
users
products
warehouses
locations
stock
```

and produces:

```text
stock_movements
```

Dependency flow:

```text
Authentication
      ↓
User
      ↓
Delivery
      │
      ├── Product
      ├── Warehouse
      └── Location
              │
              ▼
             Stock
              │
              ▼
       Stock Movement
```

Module 08 must not duplicate these entities.

---

# 76. Definition of a Good Database Design

The StockSense database should satisfy:

```text
[✓] Clear relationships
[✓] Normalized core data
[✓] Strong foreign-key integrity
[✓] Appropriate unique constraints
[✓] Transactional inventory updates
[✓] Traceable stock movements
[✓] User accountability
[✓] Scalable module boundaries
[✓] Migration-based schema management
[✓] Secure credential handling
[✓] Efficient query patterns
[✓] Minimal data duplication
[✓] Support for multiple warehouses
[✓] Support for multiple locations
[✓] Support for real-time inventory
[✓] Support for future modules
```

---

# 77. Final Architecture

The final conceptual architecture is:

```text
                         STOCKSENSE
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   AUTHENTICATION        MASTER DATA          INVENTORY
        │                    │                    │
     Users              Products              Stock
     Roles              Categories               │
     Permissions        Units                    │
                           │                     ▼
                     Warehouses          Stock Movements
                           │
                       Locations
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                      TRANSACTIONS
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
       Receipts           Deliveries        Transfers
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                       Adjustments
                             │
                             ▼
                      ALERTS / NOTIFICATIONS
                             │
                             ▼
                       ACTIVITY / AUDIT
```

---

# 78. Final Database Rule

The most important rule in StockSense is:

> **Current inventory state must never be treated as the only source of truth for inventory history.**

The system must maintain:

```text
CURRENT STATE
     +
TRANSACTION
     +
STOCK MOVEMENT
     +
USER
     +
TIMESTAMP
```

This allows StockSense to answer both:

> "How much stock do we have now?"

and:

> "Why is the stock at this quantity?"

---

# 79. Database Architecture Freeze

For the current hackathon phase, the following architecture is considered the baseline:

```text
AUTH
    users
    roles
    permissions
    role_permissions
    user_sessions
    password_reset_otps

MASTER DATA
    categories
    units
    products
    warehouses
    locations

INVENTORY
    stock
    stock_movements

INBOUND
    receipts
    receipt_items

OUTBOUND
    deliveries
    delivery_items

TRANSFER
    transfers
    transfer_items

ADJUSTMENT
    inventory_adjustments
    adjustment_items

ALERTS
    reorder_rules
    alerts

COMMUNICATION
    notifications

AUDIT
    activity_logs
```

Any future database change should be evaluated against this architecture before implementation.

---

# 80. Team Agreement

Both developers agree to:

```text
1. Use this document as the database source of truth.

2. Use the same migration history.

3. Use separate local databases during development.

4. Never create duplicate shared entities.

5. Coordinate changes to shared entities.

6. Use transactions for inventory-changing operations.

7. Preserve historical inventory records.

8. Keep database credentials out of Git.

9. Validate at frontend, backend and database levels.

10. Prioritize data integrity over convenience.
```

**End of Database Architecture Specification**
