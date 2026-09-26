import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AdjustmentStatusBadge from '../../components/adjustments/AdjustmentStatusBadge';

const STATUSES = ['DRAFT', 'APPROVED', 'COMPLETED', 'CANCELED'];
const REASONS = ['DAMAGED', 'LOST', 'FOUND', 'EXPIRED', 'COUNT_CORRECTION', 'DATA_ENTRY_ERROR', 'RECONCILIATION', 'OTHER'];

export default function StockAdjustmentsListPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [adjustments, setAdjustments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: '', reason: '', reference: '', from: '', to: '', page: 1, limit: 10
  });

  const fetchAdjustments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get(`/adjustments?${params.toString()}`);
      const data = res.data?.data || res.data;
      setAdjustments(data.adjustments || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdjustments(); }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Adjustments</h1>
          <p className="text-sm text-gray-500 mt-1">Manual inventory corrections</p>
        </div>
        {hasPermission('ADJUSTMENT.CREATE') && (
          <Link
            to="/adjustments/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> New Adjustment
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
              placeholder="Reference..."
              value={filters.reference}
              onChange={(e) => handleFilterChange('reference', e.target.value)}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.reason}
            onChange={(e) => handleFilterChange('reason', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Reasons</option>
            {REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500"
              title="From date"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500"
              title="To date"
            />
          </div>
          <button
            onClick={() => setFilters({ status: '', reason: '', reference: '', from: '', to: '', page: 1, limit: 10 })}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Loading adjustments...</div>
        ) : error ? (
          <div className="flex items-center justify-center py-16 text-red-600 text-sm">{error}</div>
        ) : adjustments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <p className="text-sm">No adjustments found.</p>
            {hasPermission('ADJUSTMENT.CREATE') && (
              <Link to="/adjustments/new" className="mt-3 text-sm text-indigo-600 hover:underline">Create the first adjustment</Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Reference', 'Warehouse', 'Location', 'Status', 'Reason', 'Items', 'Created By', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-medium text-indigo-700">{adj.reference}</td>
                    <td className="px-4 py-3 text-gray-700">{adj.warehouse_name || `WH #${adj.warehouse_id}`}</td>
                    <td className="px-4 py-3 text-gray-700">{adj.location_name || `Loc #${adj.location_id}`}</td>
                    <td className="px-4 py-3"><AdjustmentStatusBadge status={adj.status} /></td>
                    <td className="px-4 py-3 text-gray-600">{adj.reason?.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{adj.items_count ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {adj.creator_first_name ? `${adj.creator_first_name} ${adj.creator_last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {adj.created_at ? new Date(adj.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/adjustments/${adj.id}`}
                        className="text-indigo-600 hover:underline text-xs font-medium"
                      >
                        View
                      </Link>
                      {adj.status === 'DRAFT' && hasPermission('ADJUSTMENT.UPDATE') && (
                        <Link to={`/adjustments/${adj.id}/edit`} className="ml-3 text-gray-600 hover:underline text-xs">
                          Edit
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
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
