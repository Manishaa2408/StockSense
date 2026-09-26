import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Edit, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

export default function GoodsReceiptDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/goods-receipts/${id}`);
      setReceipt(data.data);
    } catch (err) {
      toast.error('Failed to fetch goods receipt details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [id]);

  const handleAction = async (actionEndpoint) => {
    try {
      setActionLoading(true);
      await api.post(`/goods-receipts/${id}/${actionEndpoint}`);
      toast.success(`Goods Receipt updated successfully`);
      if (actionEndpoint === 'confirm') setConfirmModalOpen(false);
      fetchReceipt();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64"><Spinner className="h-8 w-8 text-indigo-600" /></div>
      </AppLayout>
    );
  }

  if (!receipt) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Goods Receipt not found.</p>
          <button onClick={() => navigate('/goods-receipts')} className="mt-4 text-indigo-600 hover:underline">Go back to list</button>
        </div>
      </AppLayout>
    );
  }

  const steps = ['DRAFT', 'RECEIVED', 'CONFIRMED'];
  const currentStepIndex = steps.indexOf(receipt.status) >= 0 ? steps.indexOf(receipt.status) : 2;

  return (
    <AppLayout>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button onClick={() => navigate('/goods-receipts')} className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Goods Receipts
        </button>

        <div className="flex flex-wrap gap-2">
          {receipt.status === 'DRAFT' && hasPermission('RECEIPT.UPDATE') && (
            <>
              <Button variant="outline" icon={Edit} onClick={() => navigate(`/goods-receipts/${id}/edit`)}>Edit Draft</Button>
              <Button variant="secondary" onClick={() => handleAction('receive')}>Mark as Received</Button>
              <Button icon={CheckCircle} onClick={() => setConfirmModalOpen(true)}>Confirm & Increase Stock</Button>
              <Button variant="danger" icon={XCircle} onClick={() => handleAction('cancel')}>Cancel Receipt</Button>
            </>
          )}
          {receipt.status === 'RECEIVED' && hasPermission('RECEIPT.UPDATE') && (
            <>
              <Button icon={CheckCircle} onClick={() => setConfirmModalOpen(true)}>Confirm & Increase Stock</Button>
              <Button variant="danger" icon={XCircle} onClick={() => handleAction('cancel')}>Cancel Receipt</Button>
            </>
          )}
          {(receipt.status === 'CONFIRMED' || receipt.status === 'CANCELED') && (
            <Badge variant={receipt.status === 'CONFIRMED' ? 'success' : 'error'} className="px-4 py-2 text-sm">
              Status: {receipt.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Document Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <ClipboardCheck className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{receipt.receipt_number || receipt.reference_number}</h1>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-gray-500">Supplier: <strong className="text-gray-900">{receipt.supplier_name}</strong></span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">PO Ref: <strong className="text-gray-900">{receipt.purchase_order_ref || receipt.po_reference || 'N/A'}</strong></span>
            </div>
          </div>
        </div>
        <div>
          <Badge variant={
            receipt.status === 'CONFIRMED' ? 'success' : 
            receipt.status === 'CANCELED' ? 'error' : 
            receipt.status === 'DRAFT' ? 'warning' : 'neutral'
          } className="text-sm px-3 py-1">
            {receipt.status}
          </Badge>
        </div>
      </div>

      {/* Stepper */}
      {receipt.status !== 'CANCELED' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index <= currentStepIndex ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${index <= currentStepIndex ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {step}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${index < currentStepIndex ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <p className="text-sm text-gray-500 mb-1">Warehouse</p>
          <p className="font-medium text-gray-900">{receipt.warehouse_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Location</p>
          <p className="font-medium text-gray-900">{receipt.location_name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Receipt Date</p>
          <p className="font-medium text-gray-900">{new Date(receipt.receipt_date).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-1">Created By</p>
          <p className="font-medium text-gray-900">{receipt.creator_name}</p>
        </div>
        {receipt.notes && (
          <div className="sm:col-span-2 lg:col-span-4 mt-2">
            <p className="text-sm text-gray-500 mb-1">Notes / Remarks</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100">{receipt.notes}</p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Received Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product & SKU</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ordered</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accepted</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rejected</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Line Remarks</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(receipt.items || []).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                    <div className="text-xs text-indigo-600 font-mono">{item.product_sku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{item.ordered_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">{item.received_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-emerald-600">{item.accepted_quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-600">{item.rejected_quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.remarks || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} title="Confirm Goods Receipt">
        <div className="p-4">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
            <p className="text-sm text-amber-700">
              <strong>Warning:</strong> Confirming this receipt will permanently increase warehouse inventory stock for the accepted quantities and record official stock movements. This action cannot be reversed.
            </p>
          </div>
          <p className="text-gray-700 mb-6">Are you sure you want to confirm GRN <span className="font-bold">{receipt.receipt_number || receipt.reference_number}</span>?</p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setConfirmModalOpen(false)}>Cancel</Button>
            <Button onClick={() => handleAction('confirm')} loading={actionLoading}>Yes, Confirm & Increase Stock</Button>
          </div>
        </div>
      </Modal>

    </AppLayout>
  );
}
