import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import AppLayout from '../../layouts/AppLayout';

const MOVEMENT_TYPES = ['IN', 'OUT', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE', 'RETURN'];
const REFERENCE_TYPES = ['DELIVERY', 'TRANSFER', 'ADJUSTMENT'];

const TYPE_CONFIG = {
  IN:                  { label: 'IN',              color: 'bg-green-100 text-green-700' },
  OUT:                 { label: 'OUT',             color: 'bg-red-100 text-red-700' },
  TRANSFER_OUT:        { label: 'TRANSFER OUT',    color: 'bg-orange-100 text-orange-700' },
  TRANSFER_IN:         { label: 'TRANSFER IN',     color: 'bg-blue-100 text-blue-700' },
  ADJUSTMENT_INCREASE: { label: 'ADJ +',           color: 'bg-teal-100 text-teal-700' },
  ADJUSTMENT_DECREASE: { label: 'ADJ −',           color: 'bg-purple-100 text-purple-700' },
  RETURN:              { label: 'RETURN',           color: 'bg-yellow-100 text-yellow-700' }
};

export default function StockMovementsPage() {
  const [movements, setMovements] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    movement_type: '', reference_type: '', reference_number: '',
    from: '', to: '', page: 1, limit: 20
  });

  const fetchMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get(`/stock-movements?${params.toString()}`);
      const data = res.data?.data || res.data;
      setMovements(data.movements || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovements(); }, [filters]);

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  const handlePageChange = (newPage) => setFilters((prev) => ({ ...prev, page: newPage }));
  const resetFilters = () => setFilters({ movement_type: '', reference_type: '', reference_number: '', from: '', to: '', page: 1, limit: 20 });

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stock Movement History</h1>
        <p className="text-sm text-gray-500 mt-1">Immutable ledger of all inventory transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Reference number..."
              value={filters.reference_number}
              onChange={(e) => handleFilterChange('reference_number', e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filters.movement_type}
            onChange={(e) => handleFilterChange('movement_type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Movement Types</option>
            {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{TYPE_CONFIG[t]?.label || t}</option>)}
          </select>
          <select
            value={filters.reference_type}
            onChange={(e) => handleFilterChange('reference_type', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Sources</option>
            {REFERENCE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => handleFilterChange('from', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            title="From date"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => handleFilterChange('to', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            title="To date"
          />
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {!loading && !error && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="font-medium">{pagination.total.toLocaleString()} movements</span>
          <span className="text-gray-400">|</span>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Loading movements...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-600 text-sm">{error}</div>
        ) : movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <p className="text-sm">No stock movements found.</p>
            <p className="text-xs text-gray-400 mt-1">Movements are recorded when deliveries, transfers, and adjustments are completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Date', 'Product', 'Location', 'Type', 'Qty', 'Before', 'After', 'Reference', 'By'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {movements.map((mov) => {
                  const typeConf = TYPE_CONFIG[mov.movement_type] || { label: mov.movement_type, color: 'bg-gray-100 text-gray-600' };
                  const isPositive = ['IN', 'TRANSFER_IN', 'ADJUSTMENT_INCREASE', 'RETURN'].includes(mov.movement_type);
                  return (
                    <tr key={mov.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {mov.created_at ? new Date(mov.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{mov.product_name || `Product #${mov.product_id}`}</div>
                        {mov.product_sku && <div className="text-xs text-gray-400 font-mono">{mov.product_sku}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {mov.location_name || mov.source_location_name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeConf.color}`}>
                          {typeConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                          {isPositive ? '+' : '-'}{Number(mov.quantity).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {mov.stock_before !== null && mov.stock_before !== undefined ? Number(mov.stock_before).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {mov.stock_after !== null && mov.stock_after !== undefined ? Number(mov.stock_after).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-indigo-700">{mov.reference_number || '—'}</div>
                        {mov.reference_type && <div className="text-xs text-gray-400">{mov.reference_type}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {mov.performer_first_name ? `${mov.performer_first_name} ${mov.performer_last_name}` : '—'}
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
    </AppLayout>
  );
}
