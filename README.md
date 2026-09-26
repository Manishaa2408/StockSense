# 📦 StockSense – Inventory Management System

> Odoo Hackathon Project

StockSense is a modular Inventory Management System designed to digitize and streamline stock-related operations within a business.

The system aims to replace manual registers, Excel sheets, and scattered stock-tracking methods with a centralized, real-time and easy-to-use inventory management platform.

---

## 🎯 Problem Statement

Businesses often manage inventory using manual registers, spreadsheets, and disconnected tracking methods. This can lead to:

- Inaccurate stock information
- Difficulty tracking stock movements
- Delays in updating inventory
- Lack of visibility across warehouses and locations
- Difficulty identifying low-stock items
- Poor traceability of inventory adjustments

StockSense addresses these challenges by providing a centralized system for managing products, stock movements, warehouses, receipts, deliveries, transfers and adjustments.

---

## 👥 Target Users

### Inventory Managers
- Manage incoming and outgoing stock
- Monitor inventory levels
- Manage products and warehouses
- Track stock movements
- Monitor low-stock items

### Warehouse Staff
- Receive incoming goods
- Process outgoing deliveries
- Perform internal stock transfers
- Perform physical stock counts
- Record stock adjustments

---

# 🚀 Key Features

## 🔐 Authentication

- User registration and login
- Role-based access
- OTP-based password reset
- Redirect to Inventory Dashboard after login

---

## 📊 Inventory Dashboard

The dashboard provides an overview of current inventory operations.

### Dashboard KPIs

- Total Products in Stock
- Low Stock Items
- Out of Stock Items
- Pending Receipts
- Pending Deliveries
- Scheduled Internal Transfers

### Dynamic Filters

Users can filter inventory information by:

- Document Type
  - Receipts
  - Deliveries
  - Internal Transfers
  - Adjustments
- Status
  - Draft
  - Waiting
  - Ready
  - Done
  - Canceled
- Warehouse / Location
- Product Category

---

# 📦 Product Management

StockSense provides centralized product management.

Each product can contain:

- Product Name
- SKU / Product Code
- Category
- Unit of Measure
- Initial Stock
- Reorder Level

Additional functionality includes:

- Product creation
- Product updates
- SKU-based search
- Stock availability by location
- Product categorization
- Reordering rules

---

# 📥 Receipts – Incoming Stock

Receipts are used when products arrive from vendors.

### Workflow

```text
Create Receipt
      ↓
Select Supplier
      ↓
Select Products
      ↓
Enter Received Quantity
      ↓
Validate
      ↓
Stock Increases
      ↓
Stock Ledger Updated
