import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Trash2, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';

export default function DeliveryCreatePage() {
  const navigate = useNavigate();

  const [masterData, setMasterData] = useState({ warehouses: [], locations: [], products: [] });
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');

  // Line items state
  // Each line: { id: tempId, product_id: '', requested_quantity: 1, available_stock: null, checking_stock: false }
  const [items, setItems] = useState([
    { id: 1, product_id: '', requested_quantity: 1, available_stock: null, checking_stock: false }
  ]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        setLoadingMaster(true);
        const { data } = await api.get('/deliveries/meta/master-data');
        if (data.data) {
          setMasterData(data.data);
          if (data.data.warehouses.length > 0) {
            setWarehouseId(String(data.data.warehouses[0].id));
          }
        }
      } catch (err) {
        toast.error('Failed to load master metadata');
      } finally {
        setLoadingMaster(false);
      }
    };
    fetchMaster();
  }, []);

  // Update default location when warehouse changes
  useEffect(() => {
    if (warehouseId) {
      const whLocations = masterData.locations.filter(l => l.warehouse_id === parseInt(warehouseId, 10));
      if (whLocations.length > 0) {
        setLocationId(String(whLocations[0].id));
      } else {
        setLocationId('');
      }
    }
  }, [warehouseId, masterData.locations]);

  // Fetch dynamic stock for items when locationId changes
  useEffect(() => {
    if (locationId) {
      items.forEach((item, index) => {
        if (item.product_id) {
          fetchStockForItem(index, item.product_id, locationId);
        }
      });
    }
  }, [locationId]);

  const fetchStockForItem = async (index, productId, locId) => {
    if (!productId || !locId) return;

    setItems(prev => {
      const copy = [...prev];
      if (copy[index]) copy[index].checking_stock = true;
      return copy;
    });

    try {
      const { data } = await api.get(`/deliveries/meta/stock?product_id=${productId}&location_id=${locId}`);
      setItems(prev => {
        const copy = [...prev];
        if (copy[index]) {
          copy[index].available_stock = data.data.available_quantity;
          copy[index].checking_stock = false;
        }
        return copy;
      });
    } catch {
      setItems(prev => {
        const copy = [...prev];
        if (copy[index]) copy[index].checking_stock = false;
        return copy;
      });
    }
  };

  const handleProductChange = (index, newProductId) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index].product_id = newProductId;
      copy[index].available_stock = null;
      return copy;
    });
    if (newProductId && locationId) {
      fetchStockForItem(index, newProductId, locationId);
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
      toast.error('Delivery must contain at least one item');
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
      formErrors.items = 'Please add at least one item with a valid product and quantity';
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

      const { data } = await api.post('/deliveries', payload);
      toast.success(`Delivery Order ${data.data.delivery.reference} created in DRAFT!`);
      navigate(`/deliveries/${data.data.delivery.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create delivery order');
    } finally {
      setSubmitting(false);
    }
  };

  const availableLocations = warehouseId
    ? masterData.locations.filter(l => l.warehouse_id === parseInt(warehouseId, 10))
    : [];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/deliveries')}
            icon={ArrowLeft}
          >
            Back to Deliveries
          </Button>
        </div>

        {/* Form Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Truck className="h-7 w-7 text-indigo-600" />
            New Delivery Order
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create an outbound delivery document. The order will be saved in DRAFT status. Stock remains unchanged until validation.
          </p>
        </div>

        {loadingMaster ? (
          <div className="py-20 flex justify-center items-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Facility Details Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-3">
                1. Outbound Facility & Scheduling
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Select
                    label="Source Warehouse *"
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Notes / Customer Instructions</label>
                <textarea
                  rows="2"
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="e.g., Deliver to Loading Dock 3, Attn: Logistics Dept"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">2. Products & Quantities</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Stock availability is dynamically verified from the source facility</p>
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
                {items.map((item, index) => {
                  const isStockInsufficient = item.available_stock !== null && parseFloat(item.requested_quantity) > item.available_stock;
                  return (
                    <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-4 items-start md:items-center">
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
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-medium text-gray-700">Available Stock:</span>
                          {item.checking_stock ? (
                            <span className="text-gray-400 flex items-center gap-1">
                              <Spinner size="sm" /> Checking
                            </span>
                          ) : item.available_stock !== null ? (
                            <span className={`font-semibold ${isStockInsufficient ? 'text-red-600' : 'text-emerald-600'}`}>
                              {item.available_stock} units
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          placeholder="Quantity"
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
                          title="Remove item line"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => navigate('/deliveries')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
              >
                Create Delivery Order (Draft)
              </Button>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
