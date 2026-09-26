import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import AppLayout from '../../layouts/AppLayout';

const REASONS = ['DAMAGED', 'LOST', 'FOUND', 'EXPIRED', 'COUNT_CORRECTION', 'DATA_ENTRY_ERROR', 'RECONCILIATION', 'OTHER'];
const ITEM_REASONS = ['DAMAGED', 'LOST', 'FOUND', 'EXPIRED', 'COUNT_CORRECTION', 'DATA_ENTRY_ERROR', 'OTHER'];

const emptyItem = () => ({ product_id: '', quantity: '', adjustment_type: 'DECREASE', reason: '' });

export default function StockAdjustmentCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ warehouse_id: '', location_id: '', reason: 'DAMAGED', notes: '' });
  const [items, setItems] = useState([emptyItem()]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/adjustments/master-data').then((res) => {
      const data = res.data?.data || res.data;
      setWarehouses(data.warehouses || []);
      setLocations(data.locations || []);
      setProducts(data.products || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.warehouse_id) {
      setFilteredLocations(locations.filter((l) => String(l.warehouse_id) === String(form.warehouse_id)));
      setForm((prev) => ({ ...prev, location_id: '' }));
    } else {
      setFilteredLocations([]);
    }
  }, [form.warehouse_id, locations]);

  const handleFormChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleItemChange = (index, key, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.warehouse_id || !form.location_id) {
      setError('Please select a warehouse and location.');
      return;
    }
    if (items.some((item) => !item.product_id || !item.quantity || Number(item.quantity) <= 0)) {
      setError('All items must have a product and positive quantity.');
      return;
    }
    const productIds = items.map((i) => i.product_id);
    if (new Set(productIds).size !== productIds.length) {
      setError('Duplicate products are not allowed. Consolidate into one item.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        warehouse_id: Number(form.warehouse_id),
        location_id: Number(form.location_id),
        reason: form.reason,
        notes: form.notes || null,
        items: items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          adjustment_type: item.adjustment_type,
          reason: item.reason || null
        }))
      };
      const res = await api.post('/adjustments', payload);
      const created = res.data?.data?.id || res.data?.id;
      navigate(`/adjustments/${created}`);
    } catch (err) {
      const details = err.response?.data?.error?.details;
      setError(details ? details.join(', ') : (err.response?.data?.error?.message || 'Failed to create adjustment'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/adjustments" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Stock Adjustment</h1>
          <p className="text-sm text-gray-500">Will be created as DRAFT</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Location */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
              <select
                value={form.warehouse_id}
                onChange={(e) => handleFormChange('warehouse_id', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select warehouse</option>
                {warehouses.map((wh) => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <select
                value={form.location_id}
                onChange={(e) => handleFormChange('location_id', e.target.value)}
                required
                disabled={!form.warehouse_id}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                <option value="">Select location</option>
                {filteredLocations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <select
                value={form.reason}
                onChange={(e) => handleFormChange('reason', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Products</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="h-4 w-4" /> Add Product
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
                  <select
                    value={item.product_id}
                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select product</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                  <select
                    value={item.adjustment_type}
                    onChange={(e) => handleItemChange(index, 'adjustment_type', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DECREASE">Decrease (−)</option>
                    <option value="INCREASE">Increase (+)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Qty *</label>
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item Reason</label>
                  <select
                    value={item.reason}
                    onChange={(e) => handleItemChange(index, 'reason', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">—</option>
                    {ITEM_REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link to="/adjustments" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Adjustment'}
          </button>
        </div>
      </form>
    </div>
    </AppLayout>
  );
}
