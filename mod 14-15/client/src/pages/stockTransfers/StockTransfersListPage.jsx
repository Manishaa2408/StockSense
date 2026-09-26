import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, ArrowLeftRight, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import TransferStatusBadge from '../../components/stockTransfers/TransferStatusBadge';
import { formatDate } from '../../utils/date';

export default function StockTransfersListPage() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Master Data
  const [masterData, setMasterData] = useState({ warehouses: [], locations: [], products: [] });

  // Cancel Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [targetTransfer, setTargetTransfer] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const fetchMasterData = async () => {
    try {
      const { data } = await api.get('/stock-transfers/meta/master-data');
      if (data && data.data) {
        setMasterData(data.data);
      }
    } catch (err) {
      console.error('Failed to load master data:', err);
    }
  };

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (sourceWarehouseId) params.append('source_warehouse_id', sourceWarehouseId);
      if (destinationWarehouseId) params.append('destination_warehouse_id', destinationWarehouseId);
      if (fromDate) params.append('date_from', fromDate);
      if (toDate) params.append('date_to', toDate);

      const { data } = await api.get(`/stock-transfers?${params.toString()}`);
      if (data && data.data) {
        setTransfers(data.data.transfers || []);
        setTotalPages(data.data.pagination?.totalPages || 1);
        setTotalItems(data.data.pagination?.total || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to fetch stock transfers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [page, status, sourceWarehouseId, destinationWarehouseId, fromDate, toDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransfers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setSourceWarehouseId('');
    setDestinationWarehouseId('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const openCancelModal = (transfer) => {
    setTargetTransfer(transfer);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!targetTransfer) return;
    setCancelLoading(true);
    try {
      await api.post(`/stock-transfers/${targetTransfer.id}/cancel`, {
        reason: cancelReason || 'Canceled by user'
      });
      toast.success(`Transfer ${targetTransfer.reference} canceled`);
      setCancelModalOpen(false);
      setTargetTransfer(null);
      fetchTransfers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel transfer');
    } finally {
      setCancelLoading(false);
    }
  };

  const getWarehouseName = (id) => {
    const wh = masterData.warehouses.find((w) => Number(w.id) === Number(id));
    return wh ? wh.name : `Warehouse #${id}`;
  };

  const getLocationName = (id) => {
    const loc = masterData.locations.find((l) => Number(l.id) === Number(id));
    return loc ? `${loc.name} (${loc.code})` : `Location #${id}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="h-7 w-7 text-indigo-600" />
              Stock Transfers
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Transfer inventory between warehouses and storage locations with atomic stock tracking.
            </p>
          </div>
          {hasPermission('TRANSFER.CREATE') && (
            <Button
              onClick={() => navigate('/stock-transfers/new')}
              icon={Plus}
            >
              New Stock Transfer
            </Button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Search reference or notes..."
                icon={Search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'READY', label: 'Ready' },
                  { value: 'IN_TRANSIT', label: 'In Transit' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'CANCELED', label: 'Canceled' }
                ]}
              />
            </div>
            <div>
              <Select
                value={sourceWarehouseId}
                onChange={(e) => { setSourceWarehouseId(e.target.value); setPage(1); }}
                options={[
                  { value: '', label: 'All Source Warehouses' },
                  ...masterData.warehouses.map((w) => ({ value: String(w.id), label: `From: ${w.name}` }))
                ]}
              />
            </div>
            <div>
              <Select
                value={destinationWarehouseId}
                onChange={(e) => { setDestinationWarehouseId(e.target.value); setPage(1); }}
                options={[
                  { value: '', label: 'All Dest Warehouses' },
                  ...masterData.warehouses.map((w) => ({ value: String(w.id), label: `To: ${w.name}` }))
                ]}
              />
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">Date Range:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg text-gray-700 focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg text-gray-700 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={handleResetFilters}
              >
                Reset
              </Button>
              <Button
                size="sm"
                icon={Search}
                onClick={handleSearchSubmit}
              >
                Search
              </Button>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Spinner size="lg" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="py-16 text-center">
              <ArrowLeftRight className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No stock transfers found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                {search || status || sourceWarehouseId || destinationWarehouseId || fromDate || toDate
                  ? 'Try adjusting your search criteria or reset filters to view all records.'
                  : 'Get started by creating your first internal stock transfer.'}
              </p>
              {hasPermission('TRANSFER.CREATE') && (
                <div className="mt-5">
                  <Button onClick={() => navigate('/stock-transfers/new')} icon={Plus}>
                    Create Stock Transfer
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Origin (From)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Destination (To)
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/stock-transfers/${t.id}`}
                          className="font-semibold text-indigo-600 hover:text-indigo-900"
                        >
                          {t.reference}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{getWarehouseName(t.source_warehouse_id)}</div>
                        <div className="text-xs text-gray-500">{getLocationName(t.source_location_id)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{getWarehouseName(t.destination_warehouse_id)}</div>
                        <div className="text-xs text-gray-500">{getLocationName(t.destination_location_id)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {t.items_count || 0} items ({t.total_quantity || 0} units)
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TransferStatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {t.creator_first_name} {t.creator_last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => navigate(`/stock-transfers/${t.id}`)}
                        >
                          View
                        </Button>
                        {t.status === 'DRAFT' && hasPermission('TRANSFER.UPDATE') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={Edit}
                            onClick={() => navigate(`/stock-transfers/${t.id}/edit`)}
                          >
                            Edit
                          </Button>
                        )}
                        {(t.status === 'DRAFT' || t.status === 'READY') && hasPermission('TRANSFER.UPDATE') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            icon={XCircle}
                            onClick={() => openCancelModal(t)}
                          >
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && transfers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>

        {/* Cancel Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title={`Cancel Stock Transfer: ${targetTransfer?.reference}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this stock transfer? Once canceled, this transfer cannot be processed or reactivated.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Transfer request superseded, incorrect facility selected..."
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelLoading}
              >
                Keep Transfer
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
                loading={cancelLoading}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
