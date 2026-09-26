import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Check,
  Edit,
  AlertTriangle,
  PackageCheck,
  ShieldCheck,
  Building2,
  Calendar,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import DeliveryStatusBadge from '../../components/deliveries/DeliveryStatusBadge';
import { formatDate } from '../../utils/date';

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [delivery, setDelivery] = useState(null);
  const [masterData, setMasterData] = useState({ warehouses: [], locations: [], products: [] });
  const [loading, setLoading] = useState(true);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [validateModalOpen, setValidateModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchDelivery = async () => {
    try {
      setLoading(true);
      const [delRes, metaRes] = await Promise.all([
        api.get(`/deliveries/${id}`),
        api.get('/deliveries/meta/master-data')
      ]);

      setDelivery(delRes.data.data.delivery);
      if (metaRes.data?.data) {
        setMasterData(metaRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load delivery details');
      navigate('/deliveries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivery();
  }, [id]);

  const handleMarkReady = async () => {
    try {
      setActionLoading(true);
      await api.post(`/deliveries/${id}/ready`);
      toast.success('Delivery marked as READY for processing');
      fetchDelivery();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to mark delivery as READY');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    try {
      setActionLoading(true);
      const { data } = await api.post(`/deliveries/${id}/validate`);
      toast.success('Delivery successfully validated! Stock deducted and movement recorded.');
      setValidateModalOpen(false);
      fetchDelivery();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to validate delivery');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await api.post(`/deliveries/${id}/cancel`, { reason: cancelReason });
      toast.success('Delivery canceled successfully');
      setCancelModalOpen(false);
      fetchDelivery();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to cancel delivery');
    } finally {
      setActionLoading(false);
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

  const getProductInfo = (productId) => {
    const p = masterData.products.find(pr => pr.id === productId);
    return p ? { name: p.name, sku: p.sku } : { name: `Product #${productId}`, sku: '—' };
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

  if (!delivery) return null;

  const isDraft = delivery.status === 'DRAFT';
  const isReady = delivery.status === 'READY';
  const isDone = delivery.status === 'DONE';
  const isCanceled = delivery.status === 'CANCELED';

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/deliveries')}
              icon={ArrowLeft}
            >
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{delivery.reference}</h1>
                <DeliveryStatusBadge status={delivery.status} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Created on {formatDate(delivery.created_at)}</p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {isDraft && hasPermission('DELIVERY.UPDATE') && (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/deliveries/${id}/edit`)}
                  icon={Edit}
                  disabled={actionLoading}
                >
                  Edit Order
                </Button>
                <Button
                  variant="primary"
                  onClick={handleMarkReady}
                  loading={actionLoading}
                  icon={Check}
                >
                  Mark as Ready
                </Button>
              </>
            )}

            {isReady && hasPermission('DELIVERY.VALIDATE') && (
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 text-white"
                onClick={() => setValidateModalOpen(true)}
                icon={PackageCheck}
                disabled={actionLoading}
              >
                Validate & Dispatch Outbound
              </Button>
            )}

            {(isDraft || isReady) && hasPermission('DELIVERY.UPDATE') && (
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => setCancelModalOpen(true)}
                icon={XCircle}
                disabled={actionLoading}
              >
                Cancel Delivery
              </Button>
            )}
          </div>
        </div>

        {/* Lifecycle Visual Progress */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {/* Step 1: Draft */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                isDraft ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                isReady || isDone ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {isReady || isDone ? <Check className="w-5 h-5" /> : '1'}
              </div>
              <span className={`text-xs mt-2 font-medium ${isDraft ? 'text-indigo-600' : 'text-gray-600'}`}>
                Draft (Editable)
              </span>
            </div>

            <div className={`h-1 flex-1 mx-2 ${isReady || isDone ? 'bg-emerald-500' : 'bg-gray-200'}`} />

            {/* Step 2: Ready */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                isReady ? 'bg-amber-500 text-white ring-4 ring-amber-100' :
                isDone ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {isDone ? <Check className="w-5 h-5" /> : '2'}
              </div>
              <span className={`text-xs mt-2 font-medium ${isReady ? 'text-amber-600' : 'text-gray-600'}`}>
                Ready to Process
              </span>
            </div>

            <div className={`h-1 flex-1 mx-2 ${isDone ? 'bg-emerald-500' : 'bg-gray-200'}`} />

            {/* Step 3: Done */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                isDone ? 'bg-emerald-600 text-white ring-4 ring-emerald-100' :
                isCanceled ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {isDone ? <Check className="w-5 h-5" /> : isCanceled ? <XCircle className="w-5 h-5" /> : '3'}
              </div>
              <span className={`text-xs mt-2 font-medium ${
                isDone ? 'text-emerald-600' : isCanceled ? 'text-red-600' : 'text-gray-600'
              }`}>
                {isCanceled ? 'Canceled' : 'Done (Dispatched)'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Banners */}
        {isDone && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800">
            <ShieldCheck className="h-6 w-6 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Delivery Order Completed & Dispatched</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Physical inventory was decremented and an immutable stock movement record was generated. This order is immutable.
              </p>
            </div>
          </div>
        )}

        {isCanceled && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800">
            <XCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Delivery Order Canceled</p>
              <p className="text-xs text-red-700 mt-0.5">
                No stock was deducted. Canceled orders cannot be reopened or edited.
              </p>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Facility Info Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Source Facility
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Warehouse:</span>
                <span className="font-medium text-gray-900">{getWarehouseName(delivery.source_warehouse_id)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Location:</span>
                <span className="font-medium text-gray-900">{getLocationName(delivery.source_location_id)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Scheduled Date:</span>
                <span className="font-medium text-gray-900">{delivery.scheduled_date ? formatDate(delivery.scheduled_date) : 'Not specified'}</span>
              </div>
              <div className="py-1">
                <span className="text-gray-500 block mb-1">Notes / Instructions:</span>
                <p className="text-gray-700 bg-gray-50 p-2.5 rounded-lg text-xs italic">
                  {delivery.notes || 'No notes provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Audit Info Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Audit & Traceability
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Created By:</span>
                <span className="font-medium text-gray-900">{delivery.creator_name || 'System'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Created At:</span>
                <span className="font-medium text-gray-900">{formatDate(delivery.created_at)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Last Updated By:</span>
                <span className="font-medium text-gray-900">{delivery.updater_name || '—'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Last Updated At:</span>
                <span className="font-medium text-gray-900">{formatDate(delivery.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Delivery Line Items</h2>
            <span className="text-xs text-gray-500 font-medium">
              {delivery.items?.length || 0} product line{delivery.items?.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium">
                <tr>
                  <th className="px-6 py-3.5">Product Name</th>
                  <th className="px-6 py-3.5">SKU</th>
                  <th className="px-6 py-3.5 text-right">Requested Quantity</th>
                  <th className="px-6 py-3.5 text-right">Processed Quantity</th>
                  <th className="px-6 py-3.5 text-right">Line Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {delivery.items?.map((item) => {
                  const product = getProductInfo(item.product_id);
                  const isLineDone = isDone || parseFloat(item.processed_quantity) > 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {parseFloat(item.requested_quantity).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-indigo-600">
                        {parseFloat(item.processed_quantity || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isLineDone ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="w-4 h-4" /> Dispatched
                          </span>
                        ) : isCanceled ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                            <XCircle className="w-4 h-4" /> Canceled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <Clock className="w-4 h-4" /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Validation Confirmation Modal */}
        <Modal
          isOpen={validateModalOpen}
          onClose={() => setValidateModalOpen(false)}
          title={`Validate & Dispatch Delivery ${delivery.reference}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Irreversible Inventory Action</p>
                <p className="text-xs text-amber-700 mt-1">
                  Validating this order will atomically deduct the items from warehouse stock and record a permanent stock movement. Once marked DONE, this delivery cannot be undone or canceled.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to complete and dispatch Delivery Order <strong>{delivery.reference}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setValidateModalOpen(false)}
                disabled={actionLoading}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
                loading={actionLoading}
                onClick={handleValidate}
              >
                Confirm & Validate Stock
              </Button>
            </div>
          </div>
        </Modal>

        {/* Cancel Modal */}
        <Modal
          isOpen={cancelModalOpen}
          onClose={() => setCancelModalOpen(false)}
          title={`Cancel Delivery ${delivery.reference}`}
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this delivery order? Canceled delivery orders cannot be validated or reopened.
            </p>
            <Input
              label="Cancellation Reason (optional)"
              placeholder="e.g., Customer requested change, order duplicated"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="outline"
                onClick={() => setCancelModalOpen(false)}
                disabled={actionLoading}
              >
                Go Back
              </Button>
              <Button
                variant="danger"
                loading={actionLoading}
                onClick={handleCancel}
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
