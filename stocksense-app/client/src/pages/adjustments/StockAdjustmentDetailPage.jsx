import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ThumbsUp } from 'lucide-react';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AdjustmentStatusBadge from '../../components/adjustments/AdjustmentStatusBadge';

export default function StockAdjustmentDetailPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const [adjustment, setAdjustment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);

  const fetchAdjustment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/adjustments/${id}`);
      setAdjustment(res.data?.data || res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load adjustment');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdjustment(); }, [id]);

  const doAction = async (endpoint, body = {}) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.post(`/adjustments/${id}/${endpoint}`, body);
      await fetchAdjustment();
      setShowCancel(false);
    } catch (err) {
      setActionError(err.response?.data?.error?.message || `Failed to ${endpoint} adjustment`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16 text-gray-500 text-sm">Loading...</div>;
  if (error) return <div className="flex justify-center py-16 text-red-600 text-sm">{error}</div>;
  if (!adjustment) return null;

  const adj = adjustment;
  const canApprove = adj.status === 'DRAFT' && hasPermission('ADJUSTMENT.APPROVE');
  const canComplete = adj.status === 'APPROVED' && hasPermission('ADJUSTMENT.COMPLETE');
  const canCancel = ['DRAFT', 'APPROVED'].includes(adj.status) && hasPermission('ADJUSTMENT.CANCEL');
  const canEdit = adj.status === 'DRAFT' && hasPermission('ADJUSTMENT.UPDATE');

  const statusSteps = ['DRAFT', 'APPROVED', 'COMPLETED'];
  const currentStep = statusSteps.indexOf(adj.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/adjustments" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">{adj.reference}</h1>
            <AdjustmentStatusBadge status={adj.status} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Stock Adjustment</p>
        </div>
        {canEdit && (
          <Link
            to={`/adjustments/${id}/edit`}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Edit
          </Link>
        )}
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{actionError}</div>
      )}

      {/* Lifecycle bar */}
      {adj.status !== 'CANCELED' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-0">
            {statusSteps.map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    idx < currentStep ? 'bg-indigo-600 border-indigo-600 text-white'
                    : idx === currentStep ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {idx < currentStep ? '✓' : idx + 1}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${idx <= currentStep ? 'text-indigo-700' : 'text-gray-400'}`}>{step}</span>
                </div>
                {idx < statusSteps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 mb-5 rounded ${idx < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Warehouse', value: adj.warehouse_name || `WH #${adj.warehouse_id}` },
          { label: 'Location', value: adj.location_name || `Loc #${adj.location_id}` },
          { label: 'Reason', value: adj.reason?.replace(/_/g, ' ') },
          { label: 'Created By', value: adj.creator_first_name ? `${adj.creator_first_name} ${adj.creator_last_name}` : '—' },
          { label: 'Approved By', value: adj.approver_first_name ? `${adj.approver_first_name} ${adj.approver_last_name}` : '—' },
          { label: 'Created At', value: adj.created_at ? new Date(adj.created_at).toLocaleString() : '—' },
          { label: 'Approved At', value: adj.approved_at ? new Date(adj.approved_at).toLocaleString() : '—' },
          { label: 'Completed At', value: adj.completed_at ? new Date(adj.completed_at).toLocaleString() : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {adj.notes && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Notes</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{adj.notes}</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Products ({adj.items?.length || 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Product', 'SKU', 'Type', 'Quantity', 'Reason'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(adj.items || []).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-medium">{item.product_name || `Product #${item.product_id}`}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.product_sku || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.adjustment_type === 'INCREASE'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {item.adjustment_type === 'INCREASE' ? '▲ Increase' : '▼ Decrease'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-semibold">
                    <span className={item.adjustment_type === 'INCREASE' ? 'text-green-700' : 'text-red-700'}>
                      {item.adjustment_type === 'INCREASE' ? '+' : '-'}{Number(item.quantity).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.reason?.replace(/_/g, ' ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lifecycle actions */}
      {(canApprove || canComplete || canCancel) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {canApprove && (
              <button
                onClick={() => doAction('approve')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <ThumbsUp className="h-4 w-4" /> Approve
              </button>
            )}
            {canComplete && (
              <button
                onClick={() => doAction('complete')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" /> Complete & Apply Stock
              </button>
            )}
            {canCancel && !showCancel && (
              <button
                onClick={() => setShowCancel(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Cancel
              </button>
            )}
          </div>
          {showCancel && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
              <p className="text-sm font-medium text-red-800">Provide a cancellation reason (optional):</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400"
                placeholder="Reason for cancellation..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => doAction('cancel', { reason: cancelReason })}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Canceling...' : 'Confirm Cancel'}
                </button>
                <button
                  onClick={() => setShowCancel(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
