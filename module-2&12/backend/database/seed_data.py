import os
import sys
import datetime
import random
try:
    from database.connection import get_db, init_db
except ImportError:
    from connection import get_db, init_db

def seed_database():
    print("[Seed] Initializing database schema...")
    init_db(force=True)

    with get_db() as conn:
        cursor = conn.cursor()

        # -------------------------------------------------------------
        # 1. Roles & Permissions
        # -------------------------------------------------------------
        print("[Seed] Creating roles and permissions...")
        roles = [
            ("ADMIN", "System Administrator with full access to inventory, analytics, operations and users"),
            ("INVENTORY_MANAGER", "Manages inventory velocity, stock levels, reordering and stock adjustments"),
            ("WAREHOUSE_STAFF", "Executes warehouse-specific receipts, dispatches and transfers")
        ]
        cursor.executemany("INSERT INTO roles (name, description) VALUES (?, ?)", roles)

        permissions = [
            ("product.view", "View products", "Ability to see product catalog"),
            ("product.create", "Create products", "Ability to add new products"),
            ("product.update", "Update products", "Ability to modify products"),
            ("delivery.view", "View deliveries", "Ability to see delivery orders"),
            ("delivery.create", "Create delivery", "Ability to initiate deliveries"),
            ("delivery.validate", "Validate delivery", "Ability to process deliveries"),
            ("receipt.view", "View receipts", "Ability to view incoming shipments"),
            ("receipt.create", "Create receipt", "Ability to create incoming receipts"),
            ("receipt.validate", "Validate receipt", "Ability to receive stock"),
            ("inventory.view", "View inventory", "View current stock levels"),
            ("inventory.adjust", "Adjust inventory", "Perform physical stock counts"),
            ("dashboard.view", "View dashboard", "Access analytics dashboard"),
            ("dashboard.export", "Export analytics", "Download reports and data"),
            ("supplier.view", "View suppliers", "Ability to view supplier directory"),
            ("supplier.create", "Create supplier", "Ability to onboard new suppliers"),
            ("supplier.update", "Update supplier", "Ability to modify supplier details"),
            ("supplier.delete", "Delete supplier", "Ability to deactivate suppliers"),
            ("supplier.status_update", "Update supplier status", "Ability to activate or deactivate suppliers")
        ]
        cursor.executemany("INSERT INTO permissions (code, name, description) VALUES (?, ?, ?)", permissions)

        # Role Permissions
        # ADMIN gets all (1 to 18)
        for perm_id in range(1, len(permissions) + 1):
            cursor.execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (1, ?)", (perm_id,))
        # INVENTORY_MANAGER gets view + adjust + dashboard + supplier view/create/update/status
        for perm_id in [1, 4, 7, 10, 11, 12, 13, 14, 15, 16, 18]:
            cursor.execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (2, ?)", (perm_id,))
        # WAREHOUSE_STAFF gets operations view & validate + supplier view
        for perm_id in [1, 4, 6, 7, 9, 10, 12, 14]:
            cursor.execute("INSERT INTO role_permissions (role_id, permission_id) VALUES (3, ?)", (perm_id,))

        # -------------------------------------------------------------
        # 2. Users
        # -------------------------------------------------------------
        print("[Seed] Creating users...")
        now = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        users = [
            ("John Carter", "john.carter@stocksense.io", "pbkdf2:sha256:admin", 1, "ACTIVE", now, now),
            ("Elena Rostova", "elena.rostova@stocksense.io", "pbkdf2:sha256:manager", 2, "ACTIVE", now, now),
            ("Marcus Vance", "marcus.vance@stocksense.io", "pbkdf2:sha256:staff", 3, "ACTIVE", now, now)
        ]
        cursor.executemany("""
            INSERT INTO users (name, email, password_hash, role_id, status, email_verified_at, last_login_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, users)

        # -------------------------------------------------------------
        # 3. Categories & Units
        # -------------------------------------------------------------
        print("[Seed] Creating categories and units...")
        categories = [
            ("Electronics & Peripherals", "Microcontrollers, sensors, communication modules, and cables"),
            ("Industrial Hardware", "Valves, actuators, bearings, fasteners, and pneumatic cylinders"),
            ("Packaging Materials", "Carton boxes, stretch wrap, anti-static cushioning, and labels"),
            ("Raw Materials", "Alloys, aluminum sheets, copper rods, and polymer resin pellets"),
            ("Safety & Precision Tools", "PPE gear, digital calipers, multimeters, and soldering stations")
        ]
        cursor.executemany("INSERT INTO categories (name, description) VALUES (?, ?)", categories)

        units = [
            ("Pieces", "PCS", "Discrete countable individual units"),
            ("Kilograms", "KG", "Weight measurement in metric kilograms"),
            ("Boxes", "BOX", "Standard pack or carton lot"),
            ("Liters", "L", "Liquid volume metric measure"),
            ("Meters", "M", "Linear length metric measure")
        ]
        cursor.executemany("INSERT INTO units (name, code, description) VALUES (?, ?, ?)", units)

        # -------------------------------------------------------------
        # 4. Warehouses & Locations
        # -------------------------------------------------------------
        print("[Seed] Creating warehouses and locations...")
        warehouses = [
            ("Dallas Central Hub", "WH-DAL", "100 Industrial Pkwy, Dallas, TX 75201", 160000),
            ("Pacific Gateway Hub", "WH-SFO", "450 Harbor Blvd, South San Francisco, CA 94080", 95000),
            ("Eastern Fulfilment Depot", "WH-NYC", "820 Gateway Ave, Newark, NJ 07102", 120000)
        ]
        cursor.executemany("INSERT INTO warehouses (name, code, address, capacity) VALUES (?, ?, ?, ?)", warehouses)

        # Locations for WH-DAL (id: 1)
        # Locations for WH-SFO (id: 2)
        # Locations for WH-NYC (id: 3)
        locations = [
            # DAL (1-5)
            (1, "Main Rack A1", "DAL-RACK-A1", "STORAGE"),
            (1, "Main Rack A2", "DAL-RACK-A2", "STORAGE"),
            (1, "Bulk Pallet Zone", "DAL-BULK-01", "PALLET"),
            (1, "Inbound Receiving Dock", "DAL-IN-DOCK", "INBOUND"),
            (1, "Outbound Staging Bay", "DAL-OUT-BAY", "OUTBOUND"),
            # SFO (6-10)
            (2, "High Bay Rack B1", "SFO-RACK-B1", "STORAGE"),
            (2, "High Bay Rack B2", "SFO-RACK-B2", "STORAGE"),
            (2, "Climate Controlled Zone", "SFO-COLD-01", "STORAGE"),
            (2, "Inbound Receiving Dock", "SFO-IN-DOCK", "INBOUND"),
            (2, "Outbound Staging Bay", "SFO-OUT-BAY", "OUTBOUND"),
            # NYC (11-15)
            (3, "Mezzanine Rack C1", "NYC-RACK-C1", "STORAGE"),
            (3, "Mezzanine Rack C2", "NYC-RACK-C2", "STORAGE"),
            (3, "Floor Bulk Storage", "NYC-BULK-01", "PALLET"),
            (3, "Inbound Receiving Dock", "NYC-IN-DOCK", "INBOUND"),
            (3, "Outbound Staging Bay", "NYC-OUT-BAY", "OUTBOUND"),
        ]
        cursor.executemany("INSERT INTO locations (warehouse_id, name, code, location_type) VALUES (?, ?, ?, ?)", locations)

        # -------------------------------------------------------------
        # 5. Products
        # -------------------------------------------------------------
        print("[Seed] Creating products...")
        # (sku, name, desc, category_id, unit_id, unit_price, cost_price, reorder_level)
        products_data = [
            ("SKU-ELEC-001", "Microcontroller Board v4", "High-performance ARM Cortex IoT controller", 1, 1, 45.0, 26.50, 60),
            ("SKU-ELEC-002", "Industrial Sensor Hub", "Multi-protocol environmental and telemetry sensor", 1, 1, 145.0, 92.00, 30),
            ("SKU-ELEC-003", "Thermal Inspection Camera", "Compact IR thermal imaging sensor with PoE", 1, 1, 680.0, 430.00, 15),
            ("SKU-ELEC-004", "Gigabit Managed Switch 24P", "Layer 2+ enterprise DIN-rail network switch", 1, 1, 195.0, 115.00, 20),
            ("SKU-ELEC-005", "LiFePO4 Battery Pack 48V", "Lithium iron phosphate high-density energy pack", 1, 1, 290.0, 175.00, 35),
            ("SKU-ELEC-006", "CAT6A Shielded Spool 305m", "Heavy duty industrial shielded copper ethernet spool", 1, 3, 120.0, 72.00, 25),
            ("SKU-ELEC-007", "High-Gain Wi-Fi Antenna 5GHz", "Directional weatherproof long-range transceiver", 1, 1, 28.0, 14.00, 50), # Will be OUT OF STOCK
            
            ("SKU-HARD-001", "Hydraulic Solenoid Valve 1/2\"", "High-pressure rated proportional directional valve", 2, 1, 135.0, 78.00, 40),
            ("SKU-HARD-002", "Pneumatic Dual-Action Cylinder", "ISO standard 50mm bore industrial stroke cylinder", 2, 1, 85.0, 50.00, 45),
            ("SKU-HARD-003", "Precision Ball Bearing 6205-2RS", "Chrome steel deep groove sealed ball bearing", 2, 1, 15.0, 7.20, 200),
            ("SKU-HARD-004", "High Pressure Flange DN100", "Forged stainless steel ANSI class 150 weld flange", 2, 1, 62.0, 36.00, 30),
            ("SKU-HARD-005", "Titanium Hex Bolts M8 (Box 100)", "Corrosion-resistant grade 5 titanium fasteners", 2, 3, 34.0, 19.50, 70),
            ("SKU-HARD-006", "Precision Brass Needle Valve", "Micro-metering needle valve for pneumatic control", 2, 1, 68.0, 41.00, 30), # Will be LOW STOCK
            
            ("SKU-PACK-001", "Corrugated Shipping Box 40x30", "Double wall heavy duty export shipping container", 3, 3, 3.20, 1.40, 500),
            ("SKU-PACK-002", "Anti-Static Bubble Roll 100m", "Pink ESD cushioning wrap 500mm wide", 3, 3, 42.0, 24.00, 50),
            ("SKU-PACK-003", "Thermal Barcode Labels (1000/roll)", "Direct thermal 4x6 inch synthetic shipping labels", 3, 3, 16.0, 9.00, 100),
            ("SKU-PACK-004", "Industrial Stretch Wrap 500mm", "Cast blown 23 micron cast machine stretch film", 3, 3, 28.0, 15.50, 65),
            
            ("SKU-RAW-001", "Electrolytic Copper Rod 20mm x 2m", "High purity C11000 solid copper conductive bar", 4, 2, 34.0, 21.00, 120),
            ("SKU-RAW-002", "Aerospace Aluminum Sheet 6061 5mm", "Tempered structural alloy plate 1200x2400mm", 4, 2, 23.50, 13.80, 150),
            ("SKU-RAW-003", "Polymer Resin Pellets Grade A", "Virgin polypropylene blow-molding pellets", 4, 2, 8.20, 4.50, 600),
            ("SKU-RAW-004", "Structural Steel Tubing 50x50", "Cold drawn seamless carbon square hollow section", 4, 5, 29.0, 16.00, 90),
            
            ("SKU-TOOL-001", "Kevlar Cut-Proof Gloves (Box 12)", "ANSI Level 5 nitrile palm dipped work gloves", 5, 3, 22.0, 11.50, 80),
            ("SKU-TOOL-002", "Digital Vernier Caliper 150mm", "Stainless steel IP54 waterproof measuring tool", 5, 1, 56.0, 31.00, 25),
            ("SKU-TOOL-003", "Industrial Safety Helmet ANSI", "Vented impact protection with 6-point suspension", 5, 1, 32.0, 16.00, 50),
            ("SKU-TOOL-004", "ESD-Safe Digital Soldering Station", "75W closed-loop temperature controlled station", 5, 1, 240.0, 150.00, 15),
            ("SKU-TOOL-005", "Laser Distance Meter 60m", "High precision handheld laser rangefinder", 5, 1, 98.0, 58.00, 20)
        ]
        cursor.executemany("""
            INSERT INTO products (sku, name, description, category_id, unit_id, unit_price, cost_price, reorder_level)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, products_data)

        # -------------------------------------------------------------
        # 6. Current Stock Distribution (Multiple Warehouses & Locations)
        # -------------------------------------------------------------
        print("[Seed] Populating stock records...")
        # Storage locations:
        # DAL: loc 1 (DAL-RACK-A1), loc 2 (DAL-RACK-A2), loc 3 (DAL-BULK-01)
        # SFO: loc 6 (SFO-RACK-B1), loc 7 (SFO-RACK-B2), loc 8 (SFO-COLD-01)
        # NYC: loc 11 (NYC-RACK-C1), loc 12 (NYC-RACK-C2), loc 13 (NYC-BULK-01)
        
        # Product 7 (SKU-ELEC-007) is OUT OF STOCK (quantity: 0)
        # Product 13 (SKU-HARD-006) is LOW STOCK (quantity: 4, reorder_level: 30)
        # Product 14 (SKU-PACK-001) is LOW STOCK (quantity: 80, reorder_level: 500)
        
        stock_entries = [
            # Product 1: Microcontroller (Dallas & SFO)
            (1, 1, 140, 20),
            (1, 6, 85, 15),
            # Product 2: Sensor Hub (Dallas & NYC)
            (2, 1, 45, 10),
            (2, 11, 60, 5),
            # Product 3: Thermal Camera (SFO & NYC)
            (3, 8, 18, 2),
            (3, 11, 12, 0),
            # Product 4: Switch 24p (Dallas & SFO)
            (4, 2, 38, 4),
            (4, 7, 24, 0),
            # Product 5: LiFePO4 Battery (SFO & Dallas)
            (5, 8, 70, 15),
            (5, 3, 50, 10),
            # Product 6: CAT6A Spool (Dallas & NYC)
            (6, 3, 90, 12),
            (6, 13, 65, 8),
            # Product 7: High-Gain Antenna -> OUT OF STOCK!
            (7, 1, 0, 0),
            (7, 6, 0, 0),
            # Product 8: Hydraulic Solenoid (Dallas & NYC)
            (8, 2, 85, 10),
            (8, 12, 70, 5),
            # Product 9: Pneumatic Cylinder (Dallas & SFO)
            (9, 2, 110, 15),
            (9, 6, 95, 20),
            # Product 10: Precision Ball Bearing (All 3)
            (10, 3, 420, 50),
            (10, 7, 310, 30),
            (10, 13, 380, 40),
            # Product 11: High Pressure Flange (Dallas & NYC)
            (11, 2, 55, 8),
            (11, 12, 45, 5),
            # Product 12: Titanium Hex Bolts (All 3)
            (12, 1, 160, 25),
            (12, 6, 130, 20),
            (12, 11, 145, 15),
            # Product 13: Brass Needle Valve -> LOW STOCK! (Total 4, reorder_level 30)
            (13, 2, 4, 1),
            # Product 14: Corrugated Box -> LOW STOCK! (Total 80 across locs, reorder 500)
            (14, 3, 50, 20),
            (14, 13, 30, 10),
            # Product 15: Anti-Static Bubble (SFO & NYC)
            (15, 7, 110, 15),
            (15, 11, 95, 10),
            # Product 16: Thermal Barcode Labels (All 3)
            (16, 1, 240, 30),
            (16, 6, 180, 20),
            (16, 11, 210, 25),
            # Product 17: Stretch Wrap (Dallas & NYC)
            (17, 3, 150, 20),
            (17, 13, 130, 15),
            # Product 18: Copper Rod (Dallas & SFO)
            (18, 3, 320, 40),
            (18, 7, 280, 30),
            # Product 19: Aerospace Aluminum (All 3)
            (19, 3, 450, 60),
            (19, 8, 380, 40),
            (19, 13, 410, 50),
            # Product 20: Polymer Resin (Dallas & NYC)
            (20, 3, 1250, 150),
            (20, 13, 980, 120),
            # Product 21: Steel Tubing (Dallas & SFO)
            (21, 3, 220, 30),
            (21, 7, 190, 25),
            # Product 22: Kevlar Gloves (All 3)
            (22, 1, 190, 25),
            (22, 6, 160, 20),
            (22, 11, 175, 15),
            # Product 23: Digital Caliper (Dallas & SFO)
            (23, 2, 42, 5),
            (23, 6, 35, 4),
            # Product 24: Safety Helmet (All 3)
            (24, 1, 110, 15),
            (24, 6, 85, 10),
            (24, 11, 95, 10),
            # Product 25: Soldering Station (Dallas & SFO)
            (25, 2, 28, 3),
            (25, 7, 22, 2),
            # Product 26: Laser Meter (SFO & NYC)
            (26, 6, 40, 5),
            (26, 11, 36, 4)
        ]
        cursor.executemany("INSERT INTO stock (product_id, location_id, quantity, reserved_quantity) VALUES (?, ?, ?, ?)", stock_entries)

        # -------------------------------------------------------------
        # 7. Reorder Rules & Alerts
        # -------------------------------------------------------------
        print("[Seed] Creating reorder rules and alerts...")
        reorder_rules = [
            (7, 1, 50, 150),   # Wi-Fi antenna
            (13, 2, 30, 100),  # Brass Needle valve
            (14, 3, 500, 1000), # Corrugated Box
            (1, 1, 60, 200),
            (2, 1, 30, 80),
            (5, 8, 35, 100)
        ]
        cursor.executemany("INSERT INTO reorder_rules (product_id, location_id, minimum_quantity, reorder_quantity) VALUES (?, ?, ?, ?)", reorder_rules)

        alerts = [
            ("OUT_OF_STOCK", 7, 1, "CRITICAL", "Product SKU-ELEC-007 (High-Gain Wi-Fi Antenna 5GHz) has reached 0 units available across all locations.", "OPEN"),
            ("LOW_STOCK", 13, 2, "HIGH", "Product SKU-HARD-006 (Precision Brass Needle Valve) stock level (4 units) is below reorder threshold (30 units).", "OPEN"),
            ("LOW_STOCK", 14, 3, "HIGH", "Product SKU-PACK-001 (Corrugated Shipping Box 40x30) stock level (80 units) is below threshold (500 units).", "OPEN"),
            ("REORDER_REQUIRED", 1, 1, "MEDIUM", "Auto-reorder generated for SKU-ELEC-001 at Dallas Hub.", "ACKNOWLEDGED")
        ]
        cursor.executemany("INSERT INTO alerts (alert_type, product_id, location_id, severity, message, status) VALUES (?, ?, ?, ?, ?, ?)", alerts)

        # -------------------------------------------------------------
        # 8. Historical Stock Movements (over past 30 days)
        # -------------------------------------------------------------
        print("[Seed] Generating 30 days of historical stock movements...")
        base_date = datetime.datetime.utcnow() - datetime.timedelta(days=29)
        
        movements = []
        # Day by day movement pattern
        for day in range(30):
            current_day = base_date + datetime.timedelta(days=day)
            date_str = current_day.strftime("%Y-%m-%d %H:%M:%S")

            # 2 to 4 receipts per day
            for r in range(random.randint(2, 4)):
                p_id = random.randint(1, 26)
                if p_id == 7: # keep antenna 0
                    p_id = 8
                dest_loc = random.choice([1, 2, 3, 6, 7, 8, 11, 12, 13])
                qty = random.choice([25, 50, 75, 100, 150, 200])
                ref_num = f"GR-2026-{(day * 10) + r + 1:04d}"
                movements.append((p_id, None, dest_loc, qty, "RECEIPT", "RECEIPT", ref_num, random.choice([1, 2, 3]), date_str))

            # 2 to 5 deliveries per day
            for d in range(random.randint(2, 5)):
                p_id = random.randint(1, 26)
                if p_id == 7:
                    p_id = 10
                src_loc = random.choice([1, 2, 3, 6, 7, 8, 11, 12, 13])
                qty = random.choice([15, 30, 45, 60, 80])
                ref_num = f"DO-2026-{(day * 10) + d + 1:04d}"
                movements.append((p_id, src_loc, None, qty, "DELIVERY", "DELIVERY", ref_num, random.choice([1, 2, 3]), date_str))

            # 1 to 2 transfers every few days
            if day % 2 == 0:
                p_id = random.randint(1, 26)
                src_loc = random.choice([1, 2, 6, 7, 11, 12])
                dest_loc = random.choice([3, 8, 13])
                qty = random.choice([10, 20, 25, 40])
                ref_num = f"TR-2026-{(day * 5) + 1:04d}"
                movements.append((p_id, src_loc, dest_loc, qty, "TRANSFER", "TRANSFER", ref_num, 2, date_str))

            # Occasional adjustment
            if day % 5 == 0:
                p_id = random.randint(1, 26)
                loc = random.choice([1, 2, 6, 7, 11, 12])
                qty = random.choice([2, 5, 8])
                ref_num = f"ADJ-2026-{(day * 2) + 1:04d}"
                movements.append((p_id, None, loc, qty, "ADJUSTMENT", "ADJUSTMENT", ref_num, 1, date_str))

        cursor.executemany("""
            INSERT INTO stock_movements (
                product_id, source_location_id, destination_location_id,
                quantity, movement_type, reference_type, reference_id,
                performed_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, movements)

        # -------------------------------------------------------------
        # 9. Receipts & Deliveries (for Pending Counts & KPI Cards)
        # -------------------------------------------------------------
        print("[Seed] Creating receipts and deliveries with statuses...")
        # Receipts
        receipts = [
            ("GR-2026-0870", 1, 4, "DONE", (datetime.datetime.utcnow() - datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"), "Received PO-4402 on dock", 2, 2),
            ("GR-2026-0871", 1, 4, "READY", datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"), "Inbound container awaiting inspection", 2, 2),
            ("GR-2026-0872", 2, 9, "WAITING", (datetime.datetime.utcnow() + datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"), "Supplier shipment en route from customs", 2, 2),
            ("GR-2026-0873", 3, 14, "WAITING", (datetime.datetime.utcnow() + datetime.timedelta(days=2)).strftime("%Y-%m-%d %H:%M:%S"), "East coast replenishment order", 2, 2),
            ("GR-2026-0874", 2, 9, "DRAFT", datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"), "Draft purchase order incoming", 2, 2)
        ]
        cursor.executemany("""
            INSERT INTO receipts (reference, warehouse_id, location_id, status, received_date, notes, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, receipts)

        # Deliveries
        deliveries = [
            ("DO-2026-1020", 1, 5, "DONE", (datetime.datetime.utcnow() - datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"), "Shipped to Apex Manufacturing", 3, 3),
            ("DO-2026-1021", 1, 5, "READY", datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"), "Staged for carrier pickup at Bay 3", 3, 3),
            ("DO-2026-1022", 2, 10, "WAITING", (datetime.datetime.utcnow() + datetime.timedelta(hours=6)).strftime("%Y-%m-%d %H:%M:%S"), "Awaiting final batch packing", 3, 3),
            ("DO-2026-1023", 3, 15, "WAITING", (datetime.datetime.utcnow() + datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S"), "Scheduled dispatch for Northeast regional store", 3, 3),
            ("DO-2026-1024", 1, 5, "DRAFT", datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"), "Customer sales order SO-9912 pending pick list", 3, 3)
        ]
        cursor.executemany("""
            INSERT INTO deliveries (reference, source_warehouse_id, source_location_id, status, scheduled_date, notes, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, deliveries)

        # -------------------------------------------------------------
        # 10. Activity Logs (Audit Trail)
        # -------------------------------------------------------------
        print("[Seed] Creating recent activity logs...")
        activities = [
            (1, "DELIVERY_COMPLETED", "Delivery", "DO-2026-1020", "Delivery DO-2026-1020 completed and dispatched from Bay 5", '{"carrier":"FedEx Freight","units":120}', (datetime.datetime.utcnow() - datetime.timedelta(minutes=15)).strftime("%Y-%m-%d %H:%M:%S")),
            (2, "RECEIPT_CREATED", "Receipt", "GR-2026-0871", "Inbound receipt GR-2026-0871 created for 250 units", '{"vendor":"Nordic Sensor Corp"}', (datetime.datetime.utcnow() - datetime.timedelta(minutes=45)).strftime("%Y-%m-%d %H:%M:%S")),
            (1, "STOCK_ADJUSTED", "InventoryAdjustment", "ADJ-2026-0012", "Stock physical count verified for SKU-HARD-006 (Difference: -3 units)", '{"reason":"Cycle count shrinkage"}', (datetime.datetime.utcnow() - datetime.timedelta(hours=2)).strftime("%Y-%m-%d %H:%M:%S")),
            (3, "TRANSFER_COMPLETED", "Transfer", "TR-2026-0045", "Transfer TR-2026-0045 completed from Dallas Rack A1 to Bulk Zone", '{"units":40}', (datetime.datetime.utcnow() - datetime.timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S")),
            (1, "PRODUCT_CREATED", "Product", "SKU-TOOL-005", "New product registered: Laser Distance Meter 60m", '{"category":"Safety & Precision Tools"}', (datetime.datetime.utcnow() - datetime.timedelta(hours=5)).strftime("%Y-%m-%d %H:%M:%S")),
            (2, "ALERT_TRIGGERED", "Alert", "ALT-0091", "Low stock alert triggered for SKU-HARD-006 (Brass Needle Valve)", '{"severity":"HIGH"}', (datetime.datetime.utcnow() - datetime.timedelta(hours=7)).strftime("%Y-%m-%d %H:%M:%S")),
            (1, "USER_LOGIN", "User", "USR-001", "Administrator John Carter logged in from Dallas corporate terminal", '{"ip":"192.168.1.100"}', (datetime.datetime.utcnow() - datetime.timedelta(hours=8)).strftime("%Y-%m-%d %H:%M:%S"))
        ]
        cursor.executemany("""
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, metadata, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, activities)

        # Notifications
        notifications = [
            (1, "WARNING", "Stock Depletion Alert", "SKU-ELEC-007 is completely out of stock across all warehouses.", 0),
            (2, "INFO", "Inbound Shipment Arrival", "Shipment GR-2026-0871 is now staged at Dallas Receiving Dock.", 0),
            (3, "ACTION_REQUIRED", "Delivery Staged", "Delivery DO-2026-1021 requires final dispatch scan.", 0)
        ]
        cursor.executemany("INSERT INTO notifications (user_id, type, title, message, is_read) VALUES (?, ?, ?, ?, ?)", notifications)

        # -------------------------------------------------------------
        # 11. Suppliers & Supplier-Product Associations (Module 12)
        # -------------------------------------------------------------
        print("[Seed] Creating suppliers and vendor catalogs...")
        suppliers = [
            ("SUP-ELEC-01", "Apex Semiconductor Ltd", "sales@apexsemi.com", "+1-408-555-0199", "David Lin", "102 Silicon Valley Blvd", "Suite 400", "San Jose", "CA", "95134", "USA", "US-EIN-9430291", "ACTIVE", "Tier 1 provider of high-speed processors, IoT controllers and managed switches"),
            ("SUP-ELEC-02", "Nordic Telemetry Corp", "support@nordictelemetry.se", "+46-8-123-4567", "Astrid Lindqvist", "Klarabergsviadukten 70", "", "Stockholm", "", "11164", "Sweden", "SE-5560123456", "ACTIVE", "Specialized IR thermal imaging sensors and high-gain wireless antennas"),
            ("SUP-IND-01", "Rhine Precision Hydraulics", "orders@rhine-hydraulics.de", "+49-711-893-000", "Hans Richter", "Industriestrasse 14", "Gebäude B", "Stuttgart", "BW", "70565", "Germany", "DE-811234567", "ACTIVE", "High-pressure industrial valves, cylinders and precision fluid controls"),
            ("SUP-IND-02", "Delta Heavy Fasteners Inc", "quotes@deltafasteners.com", "+1-312-555-8821", "Marcus Brody", "455 Michigan Ave", "Fl 8", "Chicago", "IL", "60611", "USA", "US-EIN-3628190", "ACTIVE", "Certified titanium bolts, hex fittings, flanges and heavy industrial bearings"),
            ("SUP-PACK-01", "PackPro Packaging Solutions", "sales@packpro.io", "+1-214-555-4920", "Rachel Green", "880 Logistics Way", "", "Dallas", "TX", "75247", "USA", "US-EIN-7529104", "ACTIVE", "Corrugated export shipping containers, anti-static cushioning, and labels"),
            ("SUP-RAW-01", "Falcon Alloy & Metals", "trade@falconmetals.ca", "+1-416-555-7310", "Jean-Luc Picard", "200 Bay St", "Suite 1200", "Toronto", "ON", "M5J 2J2", "Canada", "CA-BN-84729104", "ACTIVE", "Direct mill provider of copper bars, 6061 aerospace aluminum and structural tubing"),
            ("SUP-OLD-01", "Old Legacy Distributing", "info@oldlegacy.net", "+1-206-555-9011", "Walter White", "12 Desert Rd", "", "Seattle", "WA", "98101", "USA", "US-EIN-9102938", "INACTIVE", "Decommissioned legacy distributor retained for historical records")
        ]
        cursor.executemany("""
            INSERT INTO suppliers (
                code, name, email, phone, contact_person, address_line1, address_line2,
                city, state, postal_code, country, tax_id, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, suppliers)

        print("[Seed] Linking supplier products (Module 03 integration)...")
        supplier_products = [
            # Apex Semiconductor (id 1)
            (1, 1, "APX-MCU-4", 24.50, 10, 1),
            (1, 2, "APX-SNSR-HUB", 88.00, 14, 1),
            (1, 4, "APX-SW-24G", 108.00, 12, 1),
            (1, 5, "APX-BAT-48V", 168.00, 15, 1),
            # Nordic Telemetry (id 2)
            (2, 3, "NOR-THM-680", 415.00, 21, 1),
            (2, 7, "NOR-WIFI-5G", 13.50, 14, 1),
            # Rhine Precision Hydraulics (id 3)
            (3, 8, "RHI-VLV-50", 74.00, 15, 1),
            (3, 9, "RHI-CYL-50", 48.50, 10, 1),
            (3, 13, "RHI-NDL-BRS", 39.00, 8, 1),
            # Delta Heavy Fasteners (id 4)
            (4, 10, "DLT-BRG-6205", 6.80, 5, 1),
            (4, 11, "DLT-FLG-100", 34.50, 7, 1),
            (4, 12, "DLT-BLT-M8", 18.50, 4, 1),
            # PackPro Packaging (id 5)
            (5, 14, "PK-BX-4030", 1.35, 3, 1),
            (5, 15, "PK-BBL-100", 23.00, 4, 1),
            (5, 16, "PK-LBL-4x6", 8.75, 3, 1),
            (5, 17, "PK-STR-500", 15.00, 2, 1),
            # Falcon Alloy & Metals (id 6)
            (6, 18, "FAL-CPR-20", 20.50, 12, 1),
            (6, 19, "FAL-ALU-6061", 13.20, 14, 1),
            (6, 20, "FAL-RSN-PP", 4.30, 7, 1),
            (6, 21, "FAL-TUB-50", 15.50, 10, 1),
        ]
        cursor.executemany("""
            INSERT INTO supplier_products (
                supplier_id, product_id, supplier_sku, unit_cost, lead_time_days, is_primary
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, supplier_products)

    print("[Seed] Successfully seeded StockSense database with comprehensive test and operational data!")

if __name__ == "__main__":
    seed_database()
