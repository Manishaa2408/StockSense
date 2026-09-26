import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, Plus, Trash2, ArrowLeft, AlertCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';

export default function DeliveryEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [delivery, setDelivery] = useState(null);
  const [masterData, setMasterData] = useState({ warehouses: [], locations: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [delRes, metaRes] = await Promise.all([
          api.get(`/deliveries/${id}`),
          api.get('/deliveries/meta/master-data')
        ]);

        const del = delRes.data.data.delivery;
        if (del.status !== 'DRAFT') {
          toast.error(`Cannot edit delivery in ${del.status} status. Only DRAFT orders are editable.`);
          navigate(`/deliveries/${id}`);
          return;
        }

        setDelivery(del);
        setWarehouseId(String(del.source_warehouse_id));
        setLocationId(String(del.source_location_id));
        setScheduledDate(del.scheduled_date ? del.scheduled_date.substring(0, 10) : '');
        setNotes(del.notes || '');

        if (metaRes.data?.data) {
          setMasterData(metaRes.data.data);
        }

        if (del.items && del.items.length > 0) {
          setItems(del.items.map(it => ({
            id: it.id,
            product_id: String(it.product_id),
            requested_quantity: parseFloat(it.requested_quantity),
            available_stock: null,
            checking_stock: false
          })));
        } else {
          setItems([{ id: 1, product_id: '', requested_quantity: 1, available_stock: null, checking_stock: false }]);
        }
      } catch (err) {
        toast.error('Failed to load delivery for editing');
        navigate('/deliveries');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleProductChange = async (index, newProductId) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].product_id = newProductId;
      copy[index].available_stock = null;
      return copy;
    });

    if (newProductId && locationId) {
      try {
        const { data } = await api.get(`/deliveries/meta/stock?product_id=${newProductId}&location_id=${locationId}`);
        setItems(prev => {
          const copy = [...prev];
          if (copy[index]) {
            copy[index].available_stock = data.data.available_quantity;
          }
          return copy;
        });
      } catch {}
    }
  };

  const handleQuantityChange = (index, qty) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].requested_quantity = qty;
      return copy;
    });
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now(), product_id: '', requested_quantity: 1, available_stock: null, checking_stock: false }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error('Delivery must contain at least one product item');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formErrors = {};
    if (!warehouseId) formErrors.warehouseId = 'Source warehouse is required';
    if (!locationId) formErrors.locationId = 'Source location is required';

    const validItems = items.filter(it => it.product_id && parseFloat(it.requested_quantity) > 0);
    if (validItems.length === 0) {
      formErrors.items = 'Please add at least one product line with valid quantity';
    }

    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        source_warehouse_id: parseInt(warehouseId, 10),
        source_location_id: parseInt(locationId, 10),
        scheduled_date: scheduledDate || null,
        notes: notes.trim() || null,
        items: validItems.map(it => ({
          product_id: parseInt(it.product_id, 10),
          requested_quantity: parseFloat(it.requested_quantity)
        }))
      };

      await api.put(`/deliveries/${id}`, payload);
      toast.success(`Delivery ${delivery.reference} updated successfully`);
      navigate(`/deliveries/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update delivery');
    } finally {
      setSubmitting(false);
    }
  };

  const availableLocations = warehouseId
    ? masterData.locations.filter(l => l.warehouse_id === parseInt(warehouseId, 10))
    : [];

  if (loading) {
    return (
      <AppLayout>
        <div className="py-24 flex justify-center items-center">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/deliveries/${id}`)}
            icon={ArrowLeft}
          >
            Cancel & Return
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-7 w-7 text-indigo-600" />
            Edit Delivery {delivery?.reference}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Modify warehouse, storage location, and requested products while the order remains in DRAFT.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
              Facility & Dispatch Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Select
                  label="Source Warehouse *"
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value);
                    setLocationId('');
                  }}
                  error={errors.warehouseId}
                  options={masterData.warehouses.map(w => ({
                    value: w.id,
                    label: `${w.name} (${w.code})`
                  }))}
                />
              </div>
              <div>
                <Select
                  label="Source Storage Location *"
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  error={errors.locationId}
                  options={availableLocations.map(l => ({
                    value: l.id,
                    label: `${l.name} (${l.code})`
                  }))}
                />
              </div>
              <div>
                <Input
                  type="date"
                  label="Scheduled Dispatch Date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Instructions</label>
              <textarea
                rows="2"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Products & Quantities</h2>
                <p className="text-xs text-gray-500 mt-0.5">Line items can be updated, added, or removed in DRAFT status</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                icon={Plus}
              >
                Add Product Line
              </Button>
            </div>

            {errors.items && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {errors.items}
              </div>
            )}

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={item.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 w-full">
                    <Select
                      label={`Product #${index + 1}`}
                      value={item.product_id}
                      onChange={(e) => handleProductChange(index, e.target.value)}
                      options={[
                        { value: '', label: 'Select a product...' },
                        ...masterData.products.map(p => ({
                          value: p.id,
                          label: `${p.name} [SKU: ${p.sku}]`
                        }))
                      ]}
                    />
                  </div>

                  <div className="w-full md:w-44">
                    <Input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      label="Quantity"
                      value={item.requested_quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                    />
                  </div>

                  <div className="pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleRemoveItem(index)}
                      icon={Trash2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate(`/deliveries/${id}`)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={submitting}
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
