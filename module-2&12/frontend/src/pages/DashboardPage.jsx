import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, 
  Boxes, 
  Warehouse, 
  MapPin, 
  AlertTriangle, 
  XCircle, 
  Truck, 
  DownloadCloud, 
  DollarSign,
  TrendingUp,
  RotateCw,
  AlertCircle
} from 'lucide-react';

import Header from '../components/Header';
import FilterBar from '../components/FilterBar';
import StatCard from '../components/StatCard';
import InventoryOverview from '../components/InventoryOverview';
import WarehouseAnalytics from '../components/WarehouseAnalytics';
import StockMovementChart from '../components/StockMovementChart';
import StockCategoryChart from '../components/StockCategoryChart';
import LowStockTable from '../components/LowStockTable';
import RecentActivityFeed from '../components/RecentActivityFeed';
import SupplierList from '../components/SupplierList';
import { api } from '../services/api';

export default function DashboardPage() {
  // State: Navigation Tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // State: Role & Context
  const [role, setRole] = useState('ADMIN');
  const [roleContext, setRoleContext] = useState(null);

  // State: Global Filters
  const [filterOptions, setFilterOptions] = useState({ warehouses: [], categories: [], statuses: [] });
  const [filters, setFilters] = useState({
    warehouse_id: null,
    category_id: null,
    status: 'ALL',
    period: '30d',
    search: ''
  });

  // State: Live Refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);

  // State: Dashboard Datasets
  const [summary, setSummary] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [movements, setMovements] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activities, setActivities] = useState([]);

  // Load Filter Options once on mount
  useEffect(() => {
    api.getFilterOptions()
      .then(res => setFilterOptions(res))
      .catch(err => console.error("Error loading filter options:", err));
  }, []);

  // Update role context whenever role changes
  useEffect(() => {
    api.getRoleContext(role)
      .then(ctx => {
        setRoleContext(ctx);
        // If role has warehouse restriction, update warehouse_id filter automatically
        if (ctx.warehouse_restriction) {
          setFilters(prev => ({ ...prev, warehouse_id: ctx.warehouse_restriction }));
        }
      })
      .catch(err => console.error("Error loading role context:", err));
  }, [role]);

  // Main Data Fetcher
  const loadDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const warehouseParam = filters.warehouse_id;
      const categoryParam = filters.category_id;
      const periodParam = filters.period || '30d';

      // Parallel API calls
      const [
        summaryRes,
        inventoryRes,
        warehousesRes,
        movementsRes,
        lowStockRes,
        categoriesRes,
        activitiesRes
      ] = await Promise.all([
        api.getSummary(role, { warehouse_id: warehouseParam, category_id: categoryParam }),
        api.getInventory(role, { warehouse_id: warehouseParam, category_id: categoryParam }),
        api.getWarehouses(role, warehouseParam),
        api.getMovements(periodParam, warehouseParam),
        api.getLowStock({
          warehouse_id: warehouseParam,
          category_id: categoryParam,
          status: filters.status
        }),
        api.getCategories(warehouseParam),
        api.getActivity(role, warehouseParam, 12)
      ]);

      setSummary(summaryRes);
      setInventory(inventoryRes);
      setWarehouses(warehousesRes);
      setMovements(movementsRes);
      setLowStockItems(lowStockRes);
      setCategories(categoriesRes);
      setActivities(activitiesRes);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to fetch dashboard analytics.");
    } finally {
      setIsRefreshing(false);
    }
  }, [role, filters.warehouse_id, filters.category_id, filters.period, filters.status]);

  // Trigger fetch when relevant dependencies change
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh interval (30 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDashboardData]);

  // Filter change handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    const defaultWarehouse = roleContext?.warehouse_restriction || null;
    setFilters({
      warehouse_id: defaultWarehouse,
      category_id: null,
      status: 'ALL',
      period: '30d',
      search: ''
    });
  };

  // Client-side search filtering on low-stock items if search term is active
  const filteredLowStockItems = (lowStockItems || []).filter(item => {
    if (!filters.search) return true;
    const s = filters.search.toLowerCase();
    return (item.name || '').toLowerCase().includes(s) || (item.sku || '').toLowerCase().includes(s);
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '1.25rem 1.5rem 3rem 1.5rem' }}>
      
      {/* 1. Master Header with Role Switcher & Clock */}
      <Header
        role={role}
        onRoleChange={setRole}
        roleContext={roleContext}
        onRefresh={loadDashboardData}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'suppliers' ? (
        <SupplierList role={role} roleContext={roleContext} />
      ) : (
        <>
          {/* 2. Global Filter Bar */}
          <FilterBar
            filterOptions={filterOptions}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
            roleContext={roleContext}
          />

      {/* Error alert if any */}
      {error && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.15)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          borderRadius: '8px', 
          padding: '0.85rem 1.25rem', 
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#f87171'
        }}>
          <AlertCircle size={20} />
          <div>
            <strong>Error loading analytics:</strong> {error}. Ensure backend is running at http://127.0.0.1:8000.
          </div>
        </div>
      )}

      {/* 3. Section 1 — High-Level Inventory KPI Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          
          <StatCard
            title="Total Products"
            value={summary.total_products.toLocaleString()}
            subtitle="Registered SKU items"
            icon={Package}
            badgeText="Active"
            badgeType="info"
            accentColor="#6366f1"
          />

          <StatCard
            title="Total Stock Units"
            value={summary.total_stock_quantity.toLocaleString()}
            subtitle={`${summary.total_available_quantity.toLocaleString()} available`}
            icon={Boxes}
            badgeText="In Stock"
            badgeType="success"
            accentColor="#10b981"
          />

          <StatCard
            title="Facilities & Sites"
            value={`${summary.total_warehouses} Hubs`}
            subtitle={`${summary.total_locations} Active locations`}
            icon={Warehouse}
            badgeText="Operational"
            badgeType="neutral"
            accentColor="#3b82f6"
          />

          <StatCard
            title="Low Stock Items"
            value={summary.low_stock_items}
            subtitle="Under reorder point"
            icon={AlertTriangle}
            badgeText="Risk Warning"
            badgeType="warning"
            accentColor="#f59e0b"
          />

          <StatCard
            title="Out of Stock"
            value={summary.out_of_stock_items}
            subtitle="Zero physical stock"
            icon={XCircle}
            badgeText="Critical"
            badgeType="critical"
            accentColor="#ef4444"
          />

          <StatCard
            title="Pending Deliveries"
            value={summary.pending_deliveries}
            subtitle="Outgoing shipments"
            icon={Truck}
            badgeText="Scheduled"
            badgeType="info"
            accentColor="#0ea5e9"
          />

          <StatCard
            title="Pending Receipts"
            value={summary.pending_receipts}
            subtitle="Inbound vendor orders"
            icon={DownloadCloud}
            badgeText="Awaiting"
            badgeType="neutral"
            accentColor="#8b5cf6"
          />

          {roleContext?.can_view_valuation && (
            <StatCard
              title="Total Stock Valuation"
              value={`$${summary.total_stock_valuation.toLocaleString()}`}
              subtitle="Asset inventory value"
              icon={DollarSign}
              badgeText="Asset"
              badgeType="success"
              accentColor="#34d399"
            />
          )}

        </div>
      )}

      {/* 4. Section 2 — Inventory Situation Overview */}
      <InventoryOverview overview={inventory} roleContext={roleContext} />

      {/* 5. Section 4 & 5 — Stock Movement Velocity & Timeline Chart */}
      <StockMovementChart 
        movementData={movements} 
        selectedPeriod={filters.period}
        onPeriodChange={p => handleFilterChange('period', p)}
      />

      {/* 6. Section 3 & 9 — Warehouse Analytics & Category Share (2-column layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <WarehouseAnalytics warehouses={warehouses} roleContext={roleContext} />
        <StockCategoryChart categories={categories} roleContext={roleContext} />
      </div>

      {/* 7. Section 6 — Low Stock & Inventory Risk Action Table */}
      <LowStockTable 
        lowStockItems={filteredLowStockItems}
        currentStatusFilter={filters.status}
        onStatusFilterChange={st => handleFilterChange('status', st)}
      />

      {/* 8. Section 7 — Recent Operational Activity Feed (Only visible to roles with permission) */}
      {roleContext?.can_view_audit_logs !== false && (
        <RecentActivityFeed activities={activities} />
      )}
        </>
      )}

      {/* Footer Info */}
      <footer style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
        StockSense Inventory Management System • Enterprise Platform
      </footer>

    </div>
  );
}
