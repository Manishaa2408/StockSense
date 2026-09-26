import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ArrowLeftRight, AlertCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';

export default function StockTransferEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notDraft, setNotDraft] = useState(false);
  const [reference, setReference] = useState('');

  // Master Data
  const [masterData, setMasterData] = useState({ warehouses: [], locations: [], products: [] });

  // Form Fields
  const [sourceWarehouseId, setSourceWarehouseId] = useState('');
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');
  const [destinationLocationId, setDestinationLocationId] = useState('');
  const [notes, setNotes] = useState('');

  // Line items
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [metaRes, transferRes] = await Promise.all([
          api.get('/stock-transfers/meta/master-data'),
          api.get(`/stock-transfers/${id}`)
        ]);

        if (metaRes.data?.data) {
          setMasterData(metaRes.data.data);
        }

        const t = transferRes.data?.data;
        if (t) {
          if (t.status !== 'DRAFT') {
            setNotDraft(true);
            setLoading(false);
            return;
          }

          setReference(t.reference);
          setSourceWarehouseId(String(t.source_warehouse_id));
          setSourceLocationId(String(t.source_location_id));
          setDestinationWarehouseId(String(t.destination_warehouse_id));
          setDestinationLocationId(String(t.destination_location_id));
          setNotes(t.notes || '');

          if (t.items && t.items.length > 0) {
            setItems(
              t.items.map((i) => ({
                product_id: String(i.product_id),
                quantity: parseFloat(i.quantity)
              }))
            );
          } else {
            setItems([{ product_id: '', quantity: 1 }]);
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.error?.message || 'Failed to load transfer for editing');
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [id]);

  const sourceLocations = masterData.locations.filter(
    (l) => Number(l.warehouse_id) === Number(sourceWarehouseId)
  );

  const destinationLocations = masterData.locations.filter(
    (l) => Number(l.warehouse_id) === Number(destinationWarehouseId)
  );

  const handleProductChange = (index, productId) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], product_id: productId };
      return next;
    });
  };

  const handleQuantityChange = (index, value) => {
    const qty = parseFloat(value);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: isNaN(qty) ? '' : qty };
      return next;
    });
  };

  const handleAddLine = () => {
    setItems((prev) => [...prev, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveLine = (index) => {
    if (items.length <= 1) {
      toast.error('A transfer order must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const isSameFacility =
    Boolean(sourceWarehouseId) &&
    Boolean(destinationWarehouseId) &&
    Boolean(sourceLocationId) &&
    Boolean(destinationLocationId) &&
    Number(sourceWarehouseId) === Number(destinationWarehouseId) &&
    Number(sourceLocationId) === Number(destinationLocationId);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSameFacility) {
      toast.error('Source and destination locations cannot be the same.');
      return;
    }

    if (!sourceWarehouseId || !sourceLocationId) {
      toast.error('Please select both a source warehouse and location.');
      return;
    }

    if (!destinationWarehouseId || !destinationLocationId) {
      toast.error('Please select both a destination warehouse and location.');
      return;
    }

    // Validate duplicate products & valid quantities
    const seen = new Set();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) {
        toast.error(`Line ${i + 1}: Please select a product.`);
        return;
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        toast.error(`Line ${i + 1}: Quantity must be greater than zero.`);
        return;
      }
      if (seen.has(item.product_id)) {
        toast.error(`Line ${i + 1}: Duplicate product selected. Please consolidate quantities.`);
        return;
      }
      seen.add(item.product_id);
    }

    setSubmitting(true);
    try {
      const payload = {
        source_warehouse_id: parseInt(sourceWarehouseId, 10),
        source_location_id: parseInt(sourceLocationId, 10),
        destination_warehouse_id: parseInt(destinationWarehouseId, 10),
        destination_location_id: parseInt(destinationLocationId, 10),
        notes,
        items: items.map((i) => ({
          product_id: parseInt(i.product_id, 10),
          quantity: parseFloat(i.quantity)
        }))
      };

      await api.put(`/stock-transfers/${id}`, payload);
      toast.success(`Transfer ${reference} updated successfully`);
      navigate(`/stock-transfers/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update stock transfer');
    } finally {
      setSubmitting(false);
    }
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

  if (notDraft) {
    return (
      <AppLayout>
        <div className="max-w-xl mx-auto py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Transfer Cannot Be Edited</h2>
          <p className="text-sm text-gray-500 mt-2">
            Only stock transfers in <strong>DRAFT</strong> status can be edited. Transfers that are READY, IN TRANSIT, COMPLETED, or CANCELED are locked.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate(`/stock-transfers/${id}`)} icon={ArrowLeft}>
              View Transfer Detail
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/stock-transfers/${id}`)}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Transfer Details
          </button>
        </div>

        {/* Page Title */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ArrowLeftRight className="h-7 w-7 text-indigo-600" />
              Edit Stock Transfer: {reference}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Update routes, item quantities, or notes while this transfer is in DRAFT status.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Facility Route Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin Facility */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
                  Source Location (From)
                </h3>
              </div>

              <div>
                <Select
                  label="Source Warehouse *"
                  value={sourceWarehouseId}
                  onChange={(e) => setSourceWarehouseId(e.target.value)}
                  options={masterData.warehouses.map((w) => ({
                    value: String(w.id),
                    label: `${w.name} (${w.code})`
                  }))}
                />
              </div>

              <div>
                <Select
                  label="Source Location / Bin *"
                  value={sourceLocationId}
                  onChange={(e) => setSourceLocationId(e.target.value)}
                  options={sourceLocations.map((l) => ({
                    value: String(l.id),
                    label: `${l.name} (${l.code})`
                  }))}
                />
              </div>
            </div>

            {/* Destination Facility */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">
                  Destination Location (To)
                </h3>
              </div>

              <div>
                <Select
                  label="Destination Warehouse *"
                  value={destinationWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  options={masterData.warehouses.map((w) => ({
                    value: String(w.id),
                    label: `${w.name} (${w.code})`
                  }))}
                />
              </div>

              <div>
                <Select
                  label="Destination Location / Bin *"
                  value={destinationLocationId}
                  onChange={(e) => setDestinationLocationId(e.target.value)}
                  options={destinationLocations.map((l) => ({
                    value: String(l.id),
                    label: `${l.name} (${l.code})`
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Same Facility Warning */}
          {isSameFacility && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span>
                <strong>Invalid Route:</strong> The source location and destination location are identical. Stock transfers must move items between distinct locations.
              </span>
            </div>
          )}

          {/* Product Items Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-base">Transfer Line Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Plus}
                onClick={handleAddLine}
              >
                Add Product
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Product *
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                      Transfer Qty *
                    </th>
                    <th scope="col" className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                      Remove
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {items.map((line, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3">
                        <select
                          value={line.product_id}
                          onChange={(e) => handleProductChange(idx, e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        >
                          <option value="">-- Choose Product --</option>
                          {masterData.products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.sku} — {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0.0001"
                          step="any"
                          value={line.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Remove line"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Notes & Transfer Reason (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Seasonal rebalancing, store replenishment..."
              rows={3}
              className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/stock-transfers/${id}`)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={Save}
              loading={submitting}
              disabled={isSameFacility || submitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
