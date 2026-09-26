import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, RefreshCw, ShoppingCart } from 'lucide-react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import POStatusBadge from '../../components/purchaseOrders/POStatusBadge';

const STATUSES = ['DRAFT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELED'];

export default function PurchaseOrdersListPage() {
  const { hasPermission } = useAuth();

  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: '', supplier_id: '', po_number: '', search: '', from: '', to: '', page: 1, limit: 10
  });

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get(`/purchase-orders?${params.toString()}`);
      const data = res.data?.data || res.data;
      setOrders(data.purchase_orders || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/suppliers').then((res) => {
      setSuppliers(res.data?.data || res.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchOrders(); }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const resetFilters = () => {
    setFilters({ status: '', supplier_id: '', po_number: '', search: '', from: '', to: '', page: 1, limit: 10 });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor procurement and receiving lifecycle</p>
        </div>
        {hasPermission('PURCHASE_ORDER.CREATE') && (
          <Link
            to="/purchase-orders/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New Purchase Order
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="PO Number or search..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filters.supplier_id}
            onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500"
              title="Order date from"
            />
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Loading purchase orders...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-600 text-sm">{error}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <ShoppingCart className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm">No purchase orders found.</p>
            {hasPermission('PURCHASE_ORDER.CREATE') && (
              <Link to="/purchase-orders/new" className="mt-3 text-sm text-indigo-600 hover:underline">
                Create the first purchase order
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['PO Number', 'Supplier', 'Order Date', 'Expected Delivery', 'Items', 'Received', 'Total Amount', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((po) => {
                  const percentReceived = po.total_ordered > 0
                    ? Math.round((po.total_received / po.total_ordered) * 100)
                    : 0;
                  return (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-medium text-indigo-700">{po.po_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{po.supplier_name || `Supplier #${po.supplier_id}`}</td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{po.items_count ?? 0} lines</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">{po.total_received}/{po.total_ordered}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${percentReceived >= 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                              style={{ width: `${Math.min(100, percentReceived)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        ₹{Number(po.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3"><POStatusBadge status={po.status} /></td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/purchase-orders/${po.id}`}
                          className="text-indigo-600 hover:underline text-xs font-medium"
                        >
                          View
                        </Link>
                        {po.status === 'DRAFT' && hasPermission('PURCHASE_ORDER.UPDATE') && (
                          <Link to={`/purchase-orders/${po.id}/edit`} className="ml-3 text-gray-600 hover:underline text-xs">
                            Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {((filters.page - 1) * filters.limit) + 1}–{Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={filters.page <= 1}
                onClick={() => handlePageChange(filters.page - 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={filters.page >= pagination.totalPages}
                onClick={() => handlePageChange(filters.page + 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
