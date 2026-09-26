import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';

export default function GoodsReceiptEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    supplier_name: '',
    po_reference: '',
    warehouse_id: '',
    location_id: '',
    receipt_date: '',
    notes: ''
  });

  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [wRes, pRes, rRes] = await Promise.all([
          api.get('/warehouses?status=ACTIVE'),
          api.get('/products?status=ACTIVE&limit=1000'),
          api.get(`/goods-receipts/${id}`)
        ]);
        
        const wPayload = wRes.data.data || [];
        setWarehouses(Array.isArray(wPayload) ? wPayload : (wPayload.warehouses || []));

        const pPayload = pRes.data.data || [];
        setProducts(Array.isArray(pPayload) ? pPayload : (pPayload.products || []));

        const receipt = rRes.data.data;
        if (receipt.status !== 'DRAFT') {
          toast.error('Only draft receipts can be edited');
          navigate(`/goods-receipts/${id}`);
          return;
        }

        setFormData({
          supplier_name: receipt.supplier_name || '',
          po_reference: receipt.purchase_order_ref || receipt.po_reference || '',
          warehouse_id: receipt.warehouse_id || '',
          location_id: receipt.location_id || '',
          receipt_date: receipt.receipt_date ? receipt.receipt_date.split('T')[0] : '',
          notes: receipt.notes || ''
        });

        if (receipt.items && receipt.items.length > 0) {
          setItems(receipt.items.map(item => ({
            id: item.id,
            product_id: item.product_id,
            ordered_quantity: item.ordered_quantity,
            received_quantity: item.received_quantity,
            accepted_quantity: item.accepted_quantity,
            rejected_quantity: item.rejected_quantity,
            remarks: item.remarks || ''
          })));
        } else {
          setItems([{ product_id: '', ordered_quantity: 1, received_quantity: 1, accepted_quantity: 1, rejected_quantity: 0, remarks: '' }]);
        }

      } catch (err) {
        toast.error('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!formData.warehouse_id) {
        setLocations([]);
        return;
      }
      try {
        const { data } = await api.get(`/locations?warehouse_id=${formData.warehouse_id}&status=ACTIVE`);
        setLocations(data.data || []);
      } catch (err) {
        console.error('Failed to fetch locations');
      }
    };
    fetchLocations();
  }, [formData.warehouse_id]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    let val = value;
    if (['ordered_quantity', 'received_quantity', 'accepted_quantity', 'rejected_quantity'].includes(field)) {
      val = parseInt(value, 10) || 0;
    }
    
    newItems[index][field] = val;

    if (field === 'received_quantity') {
      newItems[index].accepted_quantity = val;
      newItems[index].rejected_quantity = 0;
    } else if (field === 'accepted_quantity') {
      newItems[index].rejected_quantity = Math.max(0, newItems[index].received_quantity - val);
    } else if (field === 'rejected_quantity') {
      newItems[index].accepted_quantity = Math.max(0, newItems[index].received_quantity - val);
    }

    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { product_id: '', ordered_quantity: 1, received_quantity: 1, accepted_quantity: 1, rejected_quantity: 0, remarks: '' }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.supplier_name) newErrors.supplier_name = 'Supplier Name is required';
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Warehouse is required';
    if (!formData.location_id) newErrors.location_id = 'Storage Location is required';
    if (!formData.receipt_date) newErrors.receipt_date = 'Receipt Date is required';

    if (items.length === 0) {
      toast.error('Add at least one product line');
      return;
    }

    const invalidItems = items.some(item => !item.product_id || item.received_quantity <= 0);
    if (invalidItems) {
      toast.error('Please ensure all items have a product selected and valid received quantities');
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        ...formData,
        items: items
      };
      await api.put(`/goods-receipts/${id}`, payload);
      toast.success('Goods Receipt updated successfully');
      navigate(`/goods-receipts/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update Goods Receipt');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64"><Spinner className="h-8 w-8 text-indigo-600" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <button onClick={() => navigate(`/goods-receipts/${id}`)} className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Receipt Details
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Goods Receipt (Draft)</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Supplier & Facility Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Supplier Name" 
              name="supplier_name"
              value={formData.supplier_name}
              onChange={(e) => setFormData({...formData, supplier_name: e.target.value})}
              error={errors.supplier_name}
              required
            />
            <Input 
              label="Purchase Order Ref (Optional)" 
              name="po_reference"
              placeholder="e.g. PO-10025"
              value={formData.po_reference}
              onChange={(e) => setFormData({...formData, po_reference: e.target.value})}
            />
            <Select 
              label="Warehouse" 
              name="warehouse_id"
              value={formData.warehouse_id}
              onChange={(e) => {
                setFormData({...formData, warehouse_id: e.target.value, location_id: ''});
              }}
              options={[{ value: '', label: 'Select Warehouse' }, ...warehouses.map(w => ({ value: w.id, label: w.name }))]}
              error={errors.warehouse_id}
              required
            />
            <Select 
              label="Storage Location" 
              name="location_id"
              value={formData.location_id}
              onChange={(e) => setFormData({...formData, location_id: e.target.value})}
              options={[{ value: '', label: 'Select Location' }, ...locations.map(l => ({ value: l.id, label: l.name }))]}
              disabled={!formData.warehouse_id}
              error={errors.location_id}
              required
            />
            <Input 
              label="Receipt Date" 
              name="receipt_date"
              type="date"
              value={formData.receipt_date}
              onChange={(e) => setFormData({...formData, receipt_date: e.target.value})}
              error={errors.receipt_date}
              required
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Order Remarks</label>
              <textarea
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any special remarks or delivery conditions..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Card 2: Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Received Items & Quantities</h2>
            <Button type="button" variant="outline" size="sm" icon={Plus} onClick={handleAddItem}>Add Product Line</Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ordered</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Received</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Accepted</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rejected</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3">
                      <Select 
                        value={item.product_id}
                        onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                        options={[{ value: '', label: 'Select Product' }, ...products.map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` }))]}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" min="0" value={item.ordered_quantity} onChange={(e) => handleItemChange(index, 'ordered_quantity', e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" min="1" value={item.received_quantity} onChange={(e) => handleItemChange(index, 'received_quantity', e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" min="0" max={item.received_quantity} value={item.accepted_quantity} onChange={(e) => handleItemChange(index, 'accepted_quantity', e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <Input type="number" min="0" max={item.received_quantity} value={item.rejected_quantity} onChange={(e) => handleItemChange(index, 'rejected_quantity', e.target.value)} />
                    </td>
                    <td className="px-4 py-3">
                      <Input placeholder="Line remarks..." value={item.remarks} onChange={(e) => handleItemChange(index, 'remarks', e.target.value)} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700" disabled={items.length === 1}>
                        <Trash2 className="h-5 w-5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button type="button" variant="outline" className="mr-3" onClick={() => navigate(`/goods-receipts/${id}`)}>Cancel</Button>
          <Button type="submit" loading={submitLoading}>Save Changes</Button>
        </div>
      </form>
    </AppLayout>
  );
}
