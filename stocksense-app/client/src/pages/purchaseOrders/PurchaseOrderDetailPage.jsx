import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, PackageCheck, Truck, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import POStatusBadge from '../../components/purchaseOrders/POStatusBadge';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Receive Goods Modal State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [receiveForm, setReceiveForm] = useState({ warehouse_id: '', location_id: '', notes: '' });
  const [receiveItems, setReceiveItems] = useState({});

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchPO = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/purchase-orders/${id}`);
      const data = res.data?.data || res.data;
      setPo(data);

      // Pre-fill receive items with remaining quantities
      const initialRcv = {};
      (data.items || []).forEach((item) => {
        initialRcv[item.product_id] = item.remaining_quantity || 0;
      });
      setReceiveItems(initialRcv);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPO();
    api.get('/purchase-orders/master-data').then((res) => {
      const data = res.data?.data || res.data;
      setWarehouses(data.warehouses || []);
      setLocations(data.locations || []);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (receiveForm.warehouse_id) {
      setFilteredLocations(locations.filter((l) => String(l.warehouse_id) === String(receiveForm.warehouse_id)));
      setReceiveForm((prev) => ({ ...prev, location_id: '' }));
    } else {
      setFilteredLocations([]);
    }
  }, [receiveForm.warehouse_id, locations]);

  const doConfirm = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.post(`/purchase-orders/${id}/confirm`);
      await fetchPO();
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to confirm purchase order');
    } finally {
      setActionLoading(false);
    }
  };

  const doCancel = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.post(`/purchase-orders/${id}/cancel`, { reason: cancelReason });
      setShowCancelModal(false);
      await fetchPO();
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to cancel purchase order');
    } finally {
      setActionLoading(false);
    }
  };

  const doReceiveGoods = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    const itemsToReceive = Object.entries(receiveItems)
      .map(([prodId, qty]) => ({
        product_id: Number(prodId),
        received_quantity: Number(qty)
      }))
      .filter((i) => i.received_quantity > 0);

    if (itemsToReceive.length === 0) {
      setActionError('Please specify quantity > 0 for at least one item to receive.');
      setActionLoading(false);
      return;
    }

    try {
      await api.post(`/purchase-orders/${id}/receive`, {
        warehouse_id: Number(receiveForm.warehouse_id),
        location_id: Number(receiveForm.location_id),
        notes: receiveForm.notes || null,
        items: itemsToReceive
      });
      setShowReceiveModal(false);
      await fetchPO();
    } catch (err) {
      setActionError(err.response?.data?.error?.message || 'Failed to record goods receipt');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16 text-gray-500 text-sm">Loading purchase order...</div>;
  if (error) return <div className="flex justify-center py-16 text-red-600 text-sm">{error}</div>;
  if (!po) return null;

  const canConfirm = po.status === 'DRAFT' && hasPermission('PURCHASE_ORDER.CONFIRM');
  const canReceive = ['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(po.status) && hasPermission('PURCHASE_ORDER.UPDATE');
  const canCancel = ['DRAFT', 'CONFIRMED'].includes(po.status) && hasPermission('PURCHASE_ORDER.CANCEL');
  const canEdit = po.status === 'DRAFT' && hasPermission('PURCHASE_ORDER.UPDATE');

  const totalOrdered = (po.items || []).reduce((acc, i) => acc + Number(i.ordered_quantity || 0), 0);
  const totalReceived = (po.items || []).reduce((acc, i) => acc + Number(i.received_quantity || 0), 0);
  const percentComplete = totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/purchase-orders" className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{po.po_number}</h1>
              <POStatusBadge status={po.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1">Purchase Order</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Link
              to={`/purchase-orders/${id}/edit`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium"
            >
              Edit Order
            </Link>
          )}
          {canConfirm && (
            <button
              onClick={doConfirm}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" /> Confirm Order
            </button>
          )}
          {canReceive && (
            <button
              onClick={() => setShowReceiveModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              <PackageCheck className="h-4 w-4" /> Receive Goods
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{actionError}</div>
      )}

      {/* Progress & Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Receiving Progress</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              {totalReceived} of {totalOrdered} units received ({percentComplete}%)
            </p>
          </div>
          <span className="text-sm font-semibold text-indigo-600">{percentComplete}% Complete</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${percentComplete >= 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
            style={{ width: `${Math.min(100, percentComplete)}%` }}
          />
        </div>
      </div>

      {/* Vendor & Order Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supplier Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-semibold text-gray-800">Supplier Information</h2>
            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{po.supplier_code}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-base">{po.supplier_name}</p>
            {po.supplier_contact_person && <p className="text-sm text-gray-600">Contact: {po.supplier_contact_person}</p>}
            {po.supplier_email && <p className="text-sm text-gray-600">Email: {po.supplier_email}</p>}
            {po.supplier_phone && <p className="text-sm text-gray-600">Phone: {po.supplier_phone}</p>}
          </div>
        </div>

        {/* Order Meta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-3">
          <div className="border-b pb-3">
            <h2 className="font-semibold text-gray-800">Order Dates & Personnel</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-medium">Order Date</p>
              <p className="font-medium text-gray-900">{po.order_date ? new Date(po.order_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Expected Delivery</p>
              <p className="font-medium text-gray-900">{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Created By</p>
              <p className="font-medium text-gray-900">{po.creator_first_name ? `${po.creator_first_name} ${po.creator_last_name}` : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Confirmed By</p>
              <p className="font-medium text-gray-900">{po.confirmer_first_name ? `${po.confirmer_first_name} ${po.confirmer_last_name}` : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {po.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Notes / Terms</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{po.notes}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Products Ordered ({po.items?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Product', 'SKU', 'Ordered', 'Received', 'Remaining', 'Unit Price', 'Tax %', 'Line Total'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(po.items || []).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.product_name || `Product #${item.product_id}`}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.product_sku || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{Number(item.ordered_quantity).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-700 font-semibold">{Number(item.received_quantity).toLocaleString()}</td>
                  <td className="px-4 py-3 font-semibold">
                    <span className={item.remaining_quantity > 0 ? 'text-orange-600' : 'text-gray-400'}>
                      {Number(item.remaining_quantity).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">₹{Number(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-gray-500">{Number(item.tax_rate)}%</td>
                  <td className="px-4 py-3 font-bold text-gray-900">₹{Number(item.line_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Order Financial Totals */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-medium">₹{Number(po.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax:</span>
              <span className="font-medium">+ ₹{Number(po.tax).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {Number(po.discount) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount:</span>
                <span className="font-medium">- ₹{Number(po.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-200">
              <span>Grand Total:</span>
              <span className="text-indigo-700">₹{Number(po.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receive Goods Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Receive Goods (Inbound)</h3>
                <p className="text-xs text-gray-500">Record stock receipt against PO {po.po_number}</p>
              </div>
              <button onClick={() => setShowReceiveModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={doReceiveGoods} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Destination Warehouse *</label>
                  <select
                    value={receiveForm.warehouse_id}
                    onChange={(e) => setReceiveForm((prev) => ({ ...prev, warehouse_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map((wh) => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Destination Location *</label>
                  <select
                    value={receiveForm.location_id}
                    onChange={(e) => setReceiveForm((prev) => ({ ...prev, location_id: e.target.value }))}
                    required
                    disabled={!receiveForm.warehouse_id}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  >
                    <option value="">Select location</option>
                    {filteredLocations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Items Receiving Input */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Quantity to Receive</label>
                <div className="border rounded-lg overflow-hidden divide-y divide-gray-100">
                  {(po.items || []).map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-xs text-gray-500">
                          Ordered: {item.ordered_quantity} | Received: {item.received_quantity} | Remaining: {item.remaining_quantity}
                        </p>
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          min="0"
                          max={item.remaining_quantity}
                          step="any"
                          value={receiveItems[item.product_id] ?? ''}
                          onChange={(e) => setReceiveItems((prev) => ({ ...prev, [item.product_id]: e.target.value }))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Receipt Notes</label>
                <input
                  type="text"
                  value={receiveForm.notes}
                  onChange={(e) => setReceiveForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Delivery Challan #DC-9921, inspected and verified"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !receiveForm.warehouse_id || !receiveForm.location_id}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Receiving...' : 'Confirm Receipt & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Cancel Purchase Order</h3>
            <p className="text-sm text-gray-500">Are you sure you want to cancel PO {po.po_number}? This action cannot be undone.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400"
              placeholder="Reason for cancellation..."
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={doCancel}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Canceling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
