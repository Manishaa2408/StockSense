import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Eye, Truck, Edit, XCircle, CheckCircle2, RotateCcw } from 'lucide-react';
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
import DeliveryStatusBadge from '../../components/deliveries/DeliveryStatusBadge';
import { formatDate } from '../../utils/date';

export default function DeliveriesListPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [masterData, setMasterData] = useState({ warehouses: [], locations: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Cancel Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [targetDelivery, setTargetDelivery] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const fetchMasterData = async () => {
    try {
      const { data } = await api.get('/deliveries/meta/master-data');
      if (data.data) {
        setMasterData(data.data);
      }
    } catch (err) {
      console.error('Failed to load master metadata', err);
    }
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (warehouseId) params.append('warehouse_id', warehouseId);
      if (locationId) params.append('location_id', locationId);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const { data } = await api.get(`/deliveries?${params.toString()}`);
      if (data.data) {
        setDeliveries(data.data.deliveries || []);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1);
          setTotalItems(data.data.pagination.total || 0);
        }
      }
    } catch (err) {
      toast.error('Failed to fetch delivery orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchDeliveries();
  }, [page, search, status, warehouseId, locationId, fromDate, toDate]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setWarehouseId('');
    setLocationId('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  const handleOpenCancel = (delivery) => {
    setTargetDelivery(delivery);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!targetDelivery) return;
    try {
      setCancelLoading(true);
      await api.post(`/deliveries/${targetDelivery.id}/cancel`, { reason: cancelReason });
      toast.success(`Delivery ${targetDelivery.reference} canceled`);
      setCancelModalOpen(false);
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel delivery');
    } finally {
      setCancelLoading(false);
    }
  };

  const getWarehouseName = (whId) => {
    const wh = masterData.warehouses.find(w => w.id === whId);
    return wh ? `${wh.name} (${wh.code})` : `Warehouse #${whId}`;
  };

  const getLocationName = (locId) => {
    const loc = masterData.locations.find(l => l.id === locId);
    return loc ? `${loc.name} (${loc.code})` : `Location #${locId}`;
  };

  const filteredLocations = warehouseId
    ? masterData.locations.filter(l => l.warehouse_id === parseInt(warehouseId, 10))
    : masterData.locations;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-7 w-7 text-indigo-600" />
              Delivery Orders
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage outbound shipments, packing verification, and stock dispatches
            </p>
          </div>
          {hasPermission('DELIVERY.CREATE') && (
            <Button
              onClick={() => navigate('/deliveries/new')}
              icon={Plus}
            >
              Create Delivery Order
            </Button>
          )}
        </div>

        {/* Filters Card */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                label="Search"
                placeholder="Search reference or notes..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={Search}
              />
            </div>
            <div>
              <Select
                label="Status"
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'READY', label: 'Ready' },
                  { value: 'DONE', label: 'Done' },
                  { value: 'CANCELED', label: 'Canceled' }
                ]}
              />
            </div>
            <div>
              <Select
                label="Warehouse"
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setLocationId('');
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All Warehouses' },
                  ...masterData.warehouses.map(w => ({ value: w.id, label: `${w.name} (${w.code})` }))
                ]}
              />
            </div>
            <div>
              <Select
                label="Location"
                value={locationId}
                onChange={(e) => { setLocationId(e.target.value); setPage(1); }}
                options={[
                  { value: '', label: 'All Locations' },
                  ...filteredLocations.map(l => ({ value: l.id, label: `${l.name} (${l.code})` }))
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100 items-end">
            <div>
              <Input
                type="date"
                label="Scheduled From"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <Input
                type="date"
                label="Scheduled To"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              />
            </div>
            <div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResetFilters}
                icon={RotateCcw}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <Spinner size="lg" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-900">No delivery orders found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or create a new delivery order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium">
                  <tr>
                    <th className="px-6 py-3.5">Reference</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Source Facility</th>
                    <th className="px-6 py-3.5">Scheduled Date</th>
                    <th className="px-6 py-3.5">Items</th>
                    <th className="px-6 py-3.5">Created By</th>
                    <th className="px-6 py-3.5">Created At</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-indigo-600">
                        <Link to={`/deliveries/${delivery.id}`} className="hover:underline">
                          {delivery.reference}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <DeliveryStatusBadge status={delivery.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{getWarehouseName(delivery.source_warehouse_id)}</div>
                        <div className="text-xs text-gray-500">{getLocationName(delivery.source_location_id)}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {delivery.scheduled_date ? formatDate(delivery.scheduled_date) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {delivery.item_count || 0} line{delivery.item_count === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {delivery.creator_name || 'System User'}
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs">
                        {formatDate(delivery.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/deliveries/${delivery.id}`)}
                          icon={Eye}
                        >
                          View
                        </Button>
                        {delivery.status === 'DRAFT' && hasPermission('DELIVERY.UPDATE') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/deliveries/${delivery.id}/edit`)}
                            icon={Edit}
                          >
                            Edit
                          </Button>
                        )}
                        {(delivery.status === 'DRAFT' || delivery.status === 'READY') && hasPermission('DELIVERY.UPDATE') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleOpenCancel(delivery)}
                            icon={XCircle}
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
          {!loading && deliveries.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>

        {/* Cancel Confirmation Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title={`Cancel Delivery ${targetDelivery?.reference}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this delivery order? This action cannot be undone. Canceled orders cannot be validated or reopened.
            </p>
            <Input
              label="Reason for cancellation (optional)"
              placeholder="e.g., Customer requested cancellation, duplicate order"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelLoading}
              >
                Go Back
              </Button>
              <Button
                variant="danger"
                loading={cancelLoading}
                onClick={handleConfirmCancel}
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
