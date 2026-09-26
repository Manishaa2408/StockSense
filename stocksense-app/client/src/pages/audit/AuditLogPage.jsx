import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  Calendar, 
  User, 
  Layers, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Inbox,
  RotateCcw
} from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import AuditActionBadge from '../../components/audit/AuditActionBadge';
import AuditDetailModal from '../../components/audit/AuditDetailModal';
import auditApi from '../../api/audit.api';
import toast from 'react-hot-toast';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState({ modules: [], actions: [], actors: [] });

  // Filter states
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal state
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch filter metadata on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await auditApi.getAuditMetadata();
        if (res?.success && res?.data) {
          setMetadata(res.data);
        }
      } catch (err) {
        // non-blocking
      }
    };
    fetchMeta();
  }, []);

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
        module: selectedModule || undefined,
        action: selectedAction || undefined,
        userId: selectedUserId || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined
      };

      const res = await auditApi.getAuditLogs(params);
      if (res?.success && res?.data) {
        setLogs(res.data.items || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
      }
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, selectedModule, selectedAction, selectedUserId, dateFrom, dateTo]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedModule('');
    setSelectedAction('');
    setSelectedUserId('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleViewDetail = (log) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Audit Trail & Activity Log</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Immutable Ledger
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Append-only audit trail capturing system mutations, actor identity, state diffs, and network context.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAuditLogs}
              className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
          {/* Top row: search & primary filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search description, entity ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Module dropdown */}
            <div>
              <select
                value={selectedModule}
                onChange={(e) => { setSelectedModule(e.target.value); setPage(1); }}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Modules</option>
                {(metadata.modules || []).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Action dropdown */}
            <div>
              <select
                value={selectedAction}
                onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Actions</option>
                {(metadata.actions || []).map((a) => (
                  <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            {/* User dropdown */}
            <div>
              <select
                value={selectedUserId}
                onChange={(e) => { setSelectedUserId(e.target.value); setPage(1); }}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Users / Actors</option>
                {(metadata.actors || []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bottom row: date range and reset */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date:
              </span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="py-1 px-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                title="From Date"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="py-1 px-2.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                title="To Date"
              />
            </div>

            {(search || selectedModule || selectedAction || selectedUserId || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400 space-y-4">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading audit ledger...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No audit records found</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1">
                There are no activity logs matching your current filter parameters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/80 text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">Date & Time</th>
                    <th scope="col" className="px-4 py-3.5">User</th>
                    <th scope="col" className="px-4 py-3.5">Module</th>
                    <th scope="col" className="px-4 py-3.5">Action</th>
                    <th scope="col" className="px-4 py-3.5">Entity</th>
                    <th scope="col" className="px-4 py-3.5">Description</th>
                    <th scope="col" className="px-4 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr 
                      key={log.id} 
                      onClick={() => handleViewDetail(log)}
                      className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-mono">
                        {formatDate(log.created_at)}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-gray-900 text-xs truncate max-w-[140px]">
                          {log.user_first_name ? `${log.user_first_name} ${log.user_last_name || ''}` : 'System'}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[140px]">
                          {log.user_email || '—'}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap font-medium text-xs text-gray-800">
                        {log.module}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <AuditActionBadge action={log.action} />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span className="font-semibold text-gray-800">{log.entity_type}</span>
                        {log.entity_id && (
                          <span className="ml-1 text-gray-500 font-mono">#{log.entity_id}</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-700 max-w-xs truncate" title={log.description}>
                        {log.description}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(log);
                          }}
                          className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-900 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          View Diff
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {!loading && totalPages > 1 && (
            <div className="bg-gray-50/50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Showing <span className="font-semibold text-gray-700">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-gray-700">{Math.min(page * limit, totalCount)}</span> of{' '}
                <span className="font-semibold text-gray-700">{totalCount}</span> entries
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-gray-700 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audit Detail Modal */}
        <AuditDetailModal
          log={selectedLog}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
        />
      </div>
    </AppLayout>
  );
}
