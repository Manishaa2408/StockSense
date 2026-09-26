# StockSense — Module 08 Implementation Task

You are implementing **Module 08 — Delivery Order Management** of the StockSense inventory management system.

Before writing any code, inspect the entire existing repository and understand its current architecture.

## Required documents

Read these documents first:

```text
docs/architecture/DATABASE_DESIGN.md
docs/modules/MODULE_08_DELIVERY_ORDER_MANAGEMENT.md
```

These documents define the database architecture and Module 08 requirements.

Do not contradict them unless an existing implemented architecture makes a change necessary. If a conflict exists, explain it before modifying the architecture.

---

# 1. First Task — Repository Analysis

Before implementing anything, inspect:

* Project structure
* Frontend framework
* Backend framework
* Database
* ORM/database library
* Existing migrations
* Authentication
* Authorization
* API conventions
* Error handling
* Validation approach
* Service/repository architecture
* Existing shared entities
* Existing UI components
* Existing styling/design system
* Existing tests

Do not generate code during this analysis phase.

Provide a concise implementation plan based on the actual repository.

---

# 2. Module Boundary

You are implementing ONLY:

```text
Module 08
Delivery Order Management
```

Module 08 owns:

```text
Delivery
DeliveryItem
Delivery lifecycle
Delivery validation
Delivery processing
Delivery permissions
Delivery APIs
Delivery UI
```

Do NOT implement independent versions of:

```text
Users
Products
Categories
Units
Warehouses
Locations
Stock
Stock Movements
Authentication
Global Dashboard
```

These belong to other modules.

---

# 3. Critical Rule About Missing Dependencies

Some dependent modules may not yet be fully implemented.

If an entity/service required by Module 08 already exists:

> Reuse it.

If it does not exist yet:

> Do NOT create a duplicate competing implementation.

Instead create a clean interface/service contract where appropriate.

For example:

```text
DeliveryService
      ↓
InventoryService
      ↓
Stock
```

and:

```text
DeliveryService
      ↓
StockMovementService
```

The final implementation of those services may be completed by their respective modules later.

---

# 4. Database

Follow:

```text
docs/architecture/DATABASE_DESIGN.md
```

Module 08 primarily owns:

```text
deliveries
delivery_items
```

Expected conceptual structure:

```text
deliveries
--------------------------------
id
reference
source_warehouse_id
source_location_id
status
scheduled_date
notes
created_by
updated_by
created_at
updated_at
```

and:

```text
delivery_items
--------------------------------
id
delivery_id
product_id
requested_quantity
processed_quantity
created_at
updated_at
```

Use the repository's existing database conventions.

Do not create duplicate product, warehouse, location, stock, or user tables.

Create migrations using the project's existing migration system.

---

# 5. Delivery Lifecycle

Implement:

```text
DRAFT
   ↓
READY
   ↓
DONE
```

and:

```text
DRAFT → CANCELED
READY → CANCELED
```

Rules:

### DRAFT

Editable.

Stock unchanged.

### READY

Prepared for processing.

Stock unchanged.

### DONE

Stock has been deducted.

Stock movement has been created.

Delivery is immutable.

### CANCELED

No stock change.

Delivery is immutable.

---

# 6. API Requirements

Implement the repository's established API style.

Conceptually:

```http
POST   /api/deliveries
GET    /api/deliveries
GET    /api/deliveries/{id}
PUT/PATCH /api/deliveries/{id}
POST   /api/deliveries/{id}/validate
POST   /api/deliveries/{id}/cancel
```

Do not blindly use these exact paths if the existing project follows another established convention.

Follow the existing API naming and response format.

---

# 7. Create Delivery

Creation must support:

```text
source warehouse
source location
scheduled date
notes
items
```

Each item contains:

```text
product
quantity
```

Backend validation must verify:

* User is authenticated.
* User has permission.
* Warehouse exists.
* Location exists.
* Location belongs to warehouse.
* Product exists.
* Product is usable.
* Quantity is greater than zero.
* Duplicate product lines are handled according to the defined business rule.
* Required fields are present.
* Scheduled date follows project rules.

---

# 8. Validate Delivery

The most important operation is:

```http
POST /api/deliveries/{id}/validate
```

The operation must:

```text
Authenticate
     ↓
Authorize
     ↓
Load Delivery
     ↓
Check Status
     ↓
Validate Items
     ↓
Check Stock
     ↓
Begin DB Transaction
     ↓
Decrease Stock
     ↓
Create Stock Movement
     ↓
Mark Delivery DONE
     ↓
Commit
```

If any step fails:

```text
ROLLBACK
```

There must never be a state where:

```text
Stock decreased
but Delivery is not DONE
```

or:

```text
Delivery is DONE
but Stock was not decreased
```

---

# 9. Stock Validation

Before deduction:

```text
requested_quantity <= available_quantity
```

must be true.

Never allow negative stock under the current requirements.

Do not directly manipulate stock from the controller.

Use the project's service/business layer.

Conceptually:

```text
DeliveryController
       ↓
DeliveryService
       ↓
InventoryService
       ↓
Stock
```

---

# 10. Stock Movement

A completed delivery must generate a stock movement.

Conceptually:

```text
movement_type = DELIVERY
reference_type = DELIVERY
reference_id = delivery.id
performed_by = current_user.id
```

Use the existing stock movement implementation if it exists.

If Module 11 is not implemented yet, create the cleanest compatible integration boundary rather than building a second ledger system.

---

# 11. Concurrency

Protect against two users consuming the same stock simultaneously.

Example:

```text
Stock = 10

Delivery A = 8
Delivery B = 7
```

The database must not allow both to succeed and produce invalid stock.

The stock check and deduction must be performed atomically using the database/concurrency mechanisms appropriate to the existing stack.

Also protect against duplicate validation requests.

For example:

```text
Two requests
     ↓
validate same delivery
     ↓
Only one successful completion
     ↓
Only one stock deduction
     ↓
Only one stock movement
```

---

# 12. Authorization

Reuse Module 01 authentication/authorization.

Expected permissions include:

```text
delivery.view
delivery.create
delivery.update
delivery.validate
delivery.cancel
```

Do not create a second authentication system.

---

# 13. Frontend

Implement a clean responsive UI consistent with the existing StockSense design.

Required screens:

```text
Delivery List
Create Delivery
Delivery Details
Edit Delivery
```

The UI must support:

* Search
* Pagination
* Status filtering
* Warehouse filtering
* Location filtering
* Date filtering
* Delivery status display
* Appropriate actions based on status

Do not use static JSON as the final data source.

All inventory/product/stock information must come through the backend/API.

---

# 14. Dynamic Stock

When creating a delivery, available stock must be obtained dynamically.

Do not hardcode:

```text
Available Stock = 100
```

The UI should obtain current information from the backend.

Frontend values are informational only.

The backend must perform the authoritative stock validation.

---

# 15. Error Handling

Follow the project's existing error response structure.

Errors should be meaningful and safe.

Examples:

```text
DELIVERY_NOT_FOUND
INVALID_STATUS
INVALID_PRODUCT
INVALID_LOCATION
INVALID_QUANTITY
INSUFFICIENT_STOCK
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
```

Never expose raw SQL/database errors to users.

---

# 16. Testing

Implement tests appropriate to the existing project.

At minimum cover:

```text
Create valid delivery
Reject invalid quantity
Reject missing product
Reject invalid location
Reject invalid warehouse/location relationship
Update DRAFT delivery
Reject update of DONE delivery
Cancel DRAFT
Cancel READY
Validate valid delivery
Reject insufficient stock
Prevent negative stock
Prevent duplicate validation
Verify stock movement creation
Verify transaction rollback
Verify authorization
Verify pagination/filtering
```

The most important integration test is:

```text
Delivery
   ↓
Inventory
   ↓
Stock
   ↓
Stock Movement
```

---

# 17. Code Quality

Follow existing project conventions.

Prioritize:

```text
Modularity
Maintainability
Security
Database integrity
Performance
Testability
Readability
```

Avoid:

* Massive controllers
* Business logic in UI components
* Business logic directly inside route handlers
* Duplicate models
* Duplicate services
* Hardcoded inventory data
* Unnecessary dependencies
* Unnecessary abstractions
* Copy-pasted AI code without understanding it

---

# 18. Git Safety

Keep changes limited to Module 08 and genuinely required integration contracts.

Do not modify unrelated modules simply to make implementation easier.

Before completing:

```text
Check changed files
Check migrations
Run tests
Run lint/type checks if available
Verify no secrets were added
Verify no unnecessary dependencies were added
Verify no duplicate models were created
```

Then provide a summary of:

```text
Files created
Files modified
Database migrations
APIs added
Services added
Tests added
Dependencies/integration contracts
Known limitations
```

---

# 19. Important Constraint

If the repository does not yet contain a dependency required by Module 08, do not silently invent its architecture.

For example, if `InventoryService` does not yet exist:

Explain:

```text
Required dependency:
InventoryService

Current state:
Not implemented

Proposed contract:
decreaseStock(productId, locationId, quantity)

Reason:
Module 08 needs a stable integration boundary without taking ownership of Module 06.
```

Then implement only the minimum compatible contract necessary, without duplicating Module 06.

---

# 20. Final Goal

The final result should be a production-quality Module 08 that fits into the existing StockSense architecture.

The end-to-end flow must be:

```text
Login
  ↓
Delivery List
  ↓
Create Delivery
  ↓
Select Warehouse
  ↓
Select Location
  ↓
Select Product
  ↓
Fetch Current Stock
  ↓
Enter Quantity
  ↓
Validate
  ↓
Create DRAFT
  ↓
READY
  ↓
Validate Delivery
  ↓
Check Permission
  ↓
Check Stock
  ↓
Atomic Transaction
  ├── Decrease Stock
  ├── Create Stock Movement
  └── Mark DONE
  ↓
Updated Inventory
  ↓
Updated Delivery History
```

Start by analyzing the repository and reporting the implementation plan.

**Do not begin by generating the entire module blindly.**
