import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import api from '../../api/axios';

const emptyItem = () => ({ product_id: '', ordered_quantity: '1', unit_price: '0', tax_rate: '0', discount: '0' });

export default function PurchaseOrderCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: ''
  });

  const [items, setItems] = useState([emptyItem()]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/purchase-orders/master-data').then((res) => {
      const data = res.data?.data || res.data;
      setSuppliers(data.suppliers || []);
      setProducts(data.products || []);
    }).catch(() => {});
  }, []);

  const handleFormChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleItemChange = (index, key, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };

      // Auto-populate unit price from product if available
      if (key === 'product_id') {
        const prod = products.find((p) => String(p.id) === String(value));
        if (prod && prod.price) {
          next[index].unit_price = String(prod.price);
        }
      }
      return next;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  // Compute live order summary
  const subtotal = items.reduce((acc, item) => {
    const qty = parseFloat(item.ordered_quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    return acc + (qty * price);
  }, 0);

  const totalTax = items.reduce((acc, item) => {
    const qty = parseFloat(item.ordered_quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const taxRate = parseFloat(item.tax_rate) || 0;
    return acc + ((qty * price * taxRate) / 100);
  }, 0);

  const totalDiscount = items.reduce((acc, item) => {
    return acc + (parseFloat(item.discount) || 0);
  }, 0);

  const grandTotal = Math.max(0, subtotal + totalTax - totalDiscount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.supplier_id) {
      setError('Please select a supplier.');
      return;
    }
    if (items.some((item) => !item.product_id || !item.ordered_quantity || Number(item.ordered_quantity) <= 0)) {
      setError('All items must have a product and positive quantity.');
      return;
    }
    const productIds = items.map((i) => i.product_id);
    if (new Set(productIds).size !== productIds.length) {
      setError('Duplicate products are not allowed in the same purchase order.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        supplier_id: Number(form.supplier_id),
        order_date: form.order_date,
        expected_delivery_date: form.expected_delivery_date || null,
        notes: form.notes || null,
        items: items.map((item) => ({
          product_id: Number(item.product_id),
          ordered_quantity: Number(item.ordered_quantity),
          unit_price: Number(item.unit_price) || 0,
          tax_rate: Number(item.tax_rate) || 0,
          discount: Number(item.discount) || 0
        }))
      };
      const res = await api.post('/purchase-orders', payload);
      const created = res.data?.data?.id || res.data?.id;
      navigate(`/purchase-orders/${created}`);
    } catch (err) {
      const details = err.response?.data?.error?.details;
      setError(details ? details.join(', ') : (err.response?.data?.error?.message || 'Failed to create purchase order'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/purchase-orders" className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Purchase Order</h1>
          <p className="text-sm text-gray-500">Create a vendor order in DRAFT status</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Dates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Order Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier / Vendor *</label>
              <select
                value={form.supplier_id}
                onChange={(e) => handleFormChange('supplier_id', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
              <input
                type="date"
                value={form.order_date}
                onChange={(e) => handleFormChange('order_date', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</label>
              <input
                type="date"
                value={form.expected_delivery_date}
                onChange={(e) => handleFormChange('expected_delivery_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Terms</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleFormChange('notes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
              placeholder="Payment terms, delivery instructions..."
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Order Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Plus className="h-4 w-4" /> Add Product Line
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => {
              const qty = parseFloat(item.ordered_quantity) || 0;
              const price = parseFloat(item.unit_price) || 0;
              const tax = (qty * price * (parseFloat(item.tax_rate) || 0)) / 100;
              const disc = parseFloat(item.discount) || 0;
              const lineTotal = Math.max(0, (qty * price) + tax - disc);

              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select product</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Qty *</label>
                    <input
                      type="number" min="0.0001" step="any"
                      value={item.ordered_quantity}
                      onChange={(e) => handleItemChange(index, 'ordered_quantity', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="1"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price (₹) *</label>
                    <input
                      type="number" min="0" step="any"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      required
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tax %</label>
                    <input
                      type="number" min="0" max="100" step="any"
                      value={item.tax_rate}
                      onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Line Total</label>
                    <div className="px-2 py-1.5 bg-gray-100 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 truncate">
                      ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="col-span-6 sm:col-span-1 flex justify-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                        title="Remove product line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Financial Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax:</span>
                <span>+ ₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Discount:</span>
                  <span>- ₹{totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                <span>Grand Total:</span>
                <span className="text-indigo-700">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link to="/purchase-orders" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
