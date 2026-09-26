import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle,
  Truck,
  Edit,
  XCircle,
  Calendar,
  User,
  MapPin,
  Check,
  AlertTriangle,
  Play
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import TransferStatusBadge from '../../components/stockTransfers/TransferStatusBadge';
import { formatDate } from '../../utils/date';

export default function StockTransferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [transfer, setTransfer] = useState(null);
  const [masterData, setMasterData] = useState({ warehouses: [], locations: [], products: [] });
  const [loading, setLoading] = useState(true);

  // Action Loading States
  const [actionLoading, setActionLoading] = useState(false);

  // Complete Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);

  // Cancel Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchTransfer = async () => {
    try {
      const { data } = await api.get(`/stock-transfers/${id}`);
      if (data && data.data) {
        setTransfer(data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to load stock transfer');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchMasterData();
    fetchTransfer();
  }, [id]);

  const handleMarkReady = async () => {
    setActionLoading(true);
    try {
      await api.post(`/stock-transfers/${id}/ready`);
      toast.success('Transfer marked as READY');
      fetchTransfer();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to mark transfer as ready');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartTransfer = async () => {
    setActionLoading(true);
    try {
      await api.post(`/stock-transfers/${id}/start`);
      toast.success('Transfer started and marked IN_TRANSIT');
      fetchTransfer();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to start transfer');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmComplete = async () => {
    setActionLoading(true);
    try {
      await api.post(`/stock-transfers/${id}/complete`);
      toast.success('Transfer completed! Stock atomically transferred and logged.');
      setCompleteModalOpen(false);
      fetchTransfer();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Validation failed. Check stock availability.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    setActionLoading(true);
    try {
      await api.post(`/stock-transfers/${id}/cancel`, {
        reason: cancelReason || 'Canceled by user'
      });
      toast.success('Stock transfer canceled successfully');
      setCancelModalOpen(false);
      fetchTransfer();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel transfer');
    } finally {
      setActionLoading(false);
    }
  };

  const getWarehouseName = (wId) => {
    const wh = masterData.warehouses.find((w) => Number(w.id) === Number(wId));
    return wh ? `${wh.name} (${wh.code})` : `Warehouse #${wId}`;
  };

  const getLocationName = (lId) => {
    const loc = masterData.locations.find((l) => Number(l.id) === Number(lId));
    return loc ? `${loc.name} (${loc.code})` : `Location #${lId}`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 flex justify-center items-center">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!transfer) {
    return (
      <AppLayout>
        <div className="py-16 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Transfer Not Found</h3>
          <p className="text-sm text-gray-500 mt-1">The requested stock transfer does not exist.</p>
          <div className="mt-5">
            <Button onClick={() => navigate('/stock-transfers')} icon={ArrowLeft}>
              Back to Transfers
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isDraft = transfer.status === 'DRAFT';
  const isReady = transfer.status === 'READY';
  const isInTransit = transfer.status === 'IN_TRANSIT';
  const isCompleted = transfer.status === 'COMPLETED';
  const isCanceled = transfer.status === 'CANCELED';

  const steps = [
    { label: 'Draft', key: 'DRAFT' },
    { label: 'Ready', key: 'READY' },
    { label: 'In Transit', key: 'IN_TRANSIT' },
    { label: 'Completed', key: 'COMPLETED' }
  ];

  const getStepIndex = (st) => {
    switch (st) {
      case 'DRAFT': return 0;
      case 'READY': return 1;
      case 'IN_TRANSIT': return 2;
      case 'COMPLETED': return 3;
      default: return -1;
    }
  };

  const currentStepIdx = getStepIndex(transfer.status);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/stock-transfers')}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Stock Transfers
          </button>
        </div>

        {/* Top Header Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{transfer.reference}</h1>
                <TransferStatusBadge status={transfer.status} className="text-sm px-3 py-1" />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Internal Inventory Transfer Order • Created on {formatDate(transfer.created_at)}
              </p>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {isDraft && hasPermission('TRANSFER.UPDATE') && (
                <>
                  <Button
                    variant="outline"
                    icon={Edit}
                    onClick={() => navigate(`/stock-transfers/${transfer.id}/edit`)}
                    disabled={actionLoading}
                  >
                    Edit
                  </Button>
                  <Button
                    icon={Check}
                    onClick={handleMarkReady}
                    loading={actionLoading}
                  >
                    Mark Ready
                  </Button>
                  <Button
                    variant="danger"
                    icon={XCircle}
                    onClick={() => { setCancelReason(''); setCancelModalOpen(true); }}
                    disabled={actionLoading}
                  >
                    Cancel
                  </Button>
                </>
              )}

              {isReady && (
                <>
                  {hasPermission('TRANSFER.VALIDATE') && (
                    <Button
                      icon={Play}
                      onClick={handleStartTransfer}
                      loading={actionLoading}
                    >
                      Start Transfer (In Transit)
                    </Button>
                  )}
                  {hasPermission('TRANSFER.UPDATE') && (
                    <Button
                      variant="danger"
                      icon={XCircle}
                      onClick={() => { setCancelReason(''); setCancelModalOpen(true); }}
                      disabled={actionLoading}
                    >
                      Cancel
                    </Button>
                  )}
                </>
              )}

              {isInTransit && hasPermission('TRANSFER.VALIDATE') && (
                <Button
                  icon={CheckCircle}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setCompleteModalOpen(true)}
                  disabled={actionLoading}
                >
                  Complete Transfer
                </Button>
              )}
            </div>
          </div>

          {/* Visual Lifecycle Stepper */}
          {!isCanceled ? (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-4 gap-2 relative">
                {steps.map((st, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = currentStepIdx === idx;
                  return (
                    <div key={st.key} className="flex flex-col items-center text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${
                          isDone
                            ? 'bg-indigo-600 text-white shadow'
                            : 'bg-gray-100 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}
                      >
                        {isDone ? <Check className="h-4 w-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isDone ? 'text-indigo-900' : 'text-gray-400'
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900">Transfer Canceled</p>
                <p className="text-xs text-red-700 mt-0.5">
                  This transfer was canceled and will not affect inventory levels.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Facility Route Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin Facility */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
                Source Facility (Origin)
              </h3>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase">Warehouse</span>
              <p className="text-base font-semibold text-gray-900 mt-0.5">
                {getWarehouseName(transfer.source_warehouse_id)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase">Location / Bin</span>
              <p className="text-sm text-gray-700 mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                {getLocationName(transfer.source_location_id)}
              </p>
            </div>
          </div>

          {/* Destination Facility */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
                Destination Facility
              </h3>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase">Warehouse</span>
              <p className="text-base font-semibold text-gray-900 mt-0.5">
                {getWarehouseName(transfer.destination_warehouse_id)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-400 uppercase">Location / Bin</span>
              <p className="text-sm text-gray-700 mt-0.5 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                {getLocationName(transfer.destination_location_id)}
              </p>
            </div>
          </div>
        </div>

        {/* Transfer Items Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Transfer Items ({transfer.items?.length || 0})</h3>
            <span className="text-xs text-gray-500">
              Total quantity:{' '}
              <strong className="text-gray-900">
                {transfer.items?.reduce((sum, itm) => sum + parseFloat(itm.quantity || 0), 0) || 0}
              </strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product SKU
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Transfer Quantity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transfer.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">
                      {item.product_sku || `SKU-${item.product_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.product_name || `Product #${item.product_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Details & Notes Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
            Audit Trail & Notes
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Created By</span>
              <p className="font-medium text-gray-800 flex items-center gap-1.5 mt-0.5">
                <User className="h-4 w-4 text-gray-400" />
                {transfer.creator_first_name} {transfer.creator_last_name}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Created Timestamp</span>
              <p className="font-medium text-gray-800 flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                {formatDate(transfer.created_at)}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Completed By</span>
              <p className="font-medium text-gray-800 flex items-center gap-1.5 mt-0.5">
                <User className="h-4 w-4 text-gray-400" />
                {transfer.completer_first_name
                  ? `${transfer.completer_first_name} ${transfer.completer_last_name}`
                  : '—'}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Completed Timestamp</span>
              <p className="font-medium text-gray-800 flex items-center gap-1.5 mt-0.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                {transfer.completed_at ? formatDate(transfer.completed_at) : '—'}
              </p>
            </div>
          </div>

          {transfer.notes && (
            <div className="pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400 block">Notes:</span>
              <p className="text-sm text-gray-700 whitespace-pre-line mt-1 bg-gray-50 p-3 rounded-lg border border-gray-200">
                {transfer.notes}
              </p>
            </div>
          )}
        </div>

        {/* Complete Modal */}
        <Modal
          isOpen={completeModalOpen}
          onClose={() => setCompleteModalOpen(false)}
          title={`Complete Stock Transfer: ${transfer.reference}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">
              <strong>Atomic Inventory Update:</strong>
              <ul className="list-disc list-inside mt-1 text-xs space-y-1">
                <li>Deducts item quantities from source location ({getLocationName(transfer.source_location_id)})</li>
                <li>Increments item quantities at destination location ({getLocationName(transfer.destination_location_id)})</li>
                <li>Writes paired stock movement records (TRANSFER_OUT and TRANSFER_IN)</li>
                <li>Marks transfer as COMPLETED (immutable)</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure physical goods have arrived at the destination and you want to execute this stock transfer?
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setCompleteModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                icon={CheckCircle}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleConfirmComplete}
                loading={actionLoading}
              >
                Execute Stock Transfer
              </Button>
            </div>
          </div>
        </Modal>

        {/* Cancel Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title={`Cancel Transfer: ${transfer.reference}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this transfer? This action is permanent.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for cancellation (optional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Transfer no longer required, route changed..."
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-1 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={actionLoading}
              >
                Keep Transfer
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
                loading={actionLoading}
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
