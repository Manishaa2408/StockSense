import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PackageCheck, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

export default function InventoryListPage() {
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [stockStatus, setStockStatus] = useState('');

  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const fetchWarehouses = async () => {
    try {
      const { data } = await api.get('/warehouses?status=ACTIVE');
      setWarehouses(data.data || []);
    } catch (err) {
      console.error('Failed to fetch warehouses', err);
    }
  };

  const fetchLocations = async (wId) => {
    if (!wId) {
      setLocations([]);
      return;
    }
    try {
      const { data } = await api.get(`/locations?warehouse_id=${wId}`);
      setLocations(data.data || []);
    } catch (err) {
      console.error('Failed to fetch locations', err);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchLocations(warehouseId);
    setLocationId('');
  }, [warehouseId]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (warehouseId) params.append('warehouse_id', warehouseId);
      if (locationId) params.append('location_id', locationId);
      if (stockStatus) params.append('status', stockStatus);

      const { data } = await api.get(`/inventory?${params.toString()}`);
      setInventory(data.data || []);
      if (data.meta) {
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.total);
      }
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [page, search, warehouseId, locationId, stockStatus]);

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <PackageCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory & Stock Management</h1>
            <p className="text-sm text-gray-500 mt-1">View and track stock levels across all warehouses</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500">Total Stock Items</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-100">
          <p className="text-sm font-medium text-emerald-600 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> In Stock
          </p>
          <p className="text-2xl font-bold text-gray-900">{stats.inStock || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100">
          <p className="text-sm font-medium text-amber-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Low Stock
          </p>
          <p className="text-2xl font-bold text-gray-900">{stats.lowStock || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
          <p className="text-sm font-medium text-red-600 flex items-center gap-2">
            <XCircle className="h-4 w-4" /> Out of Stock
          </p>
          <p className="text-2xl font-bold text-gray-900">{stats.outOfStock || 0}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <Input 
            name="search" 
            placeholder="Search product name or SKU..." 
            icon={Search} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div>
          <Select 
            name="warehouseId" 
            value={warehouseId} 
            onChange={(e) => setWarehouseId(e.target.value)}
            options={[
              { value: '', label: 'All Warehouses' },
              ...warehouses.map(w => ({ value: w.id, label: w.name }))
            ]}
          />
        </div>
        <div>
          <Select 
            name="locationId" 
            value={locationId} 
            onChange={(e) => setLocationId(e.target.value)}
            options={[
              { value: '', label: 'All Locations' },
              ...locations.map(l => ({ value: l.id, label: l.name }))
            ]}
            disabled={!warehouseId}
          />
        </div>
        <div>
          <Select 
            name="stockStatus" 
            value={stockStatus} 
            onChange={(e) => setStockStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'IN_STOCK', label: 'In Stock' },
              { value: 'LOW_STOCK', label: 'Low Stock' },
              { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse / Location</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Qty</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <PackageCheck className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    No inventory records found
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/inventory/${item.product_id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                      <div className="text-sm text-indigo-600 font-mono">{item.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.warehouse_name}</div>
                      <div className="text-sm text-gray-500">{item.location_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">{item.total_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{item.reserved_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">{item.available_quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant={item.status === 'IN_STOCK' ? 'success' : item.status === 'LOW_STOCK' ? 'warning' : 'error'}>
                        {item.status?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/inventory/${item.product_id}`); }} className="text-indigo-600 hover:text-indigo-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && inventory.length > 0 && (
          <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
        )}
      </div>
    </AppLayout>
  );
}
