import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Edit2, Power, MapPin, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [warehouse, setWarehouse] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Warehouse Edit Modal
  const [isEditWarehouseModalOpen, setIsEditWarehouseModalOpen] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: '', code: '', address: '', description: '' });
  const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);
  const [warehouseFormErrors, setWarehouseFormErrors] = useState({});

  // Location Modal
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({ name: '', code: '', description: '' });
  const [locationSubmitting, setLocationSubmitting] = useState(false);
  const [locationFormErrors, setLocationFormErrors] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [warehouseRes, locationsRes] = await Promise.all([
        api.get(`/warehouses/${id}`),
        api.get(`/locations?warehouse_id=${id}`)
      ]);
      setWarehouse(warehouseRes.data?.warehouse || warehouseRes.data);
      setLocations(locationsRes.data?.locations || locationsRes.data || []);
    } catch (error) {
      toast.error('Failed to load warehouse details');
      navigate('/warehouses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Warehouse Actions
  const openEditWarehouseModal = () => {
    setWarehouseForm({
      name: warehouse.name,
      code: warehouse.code,
      address: warehouse.address || '',
      description: warehouse.description || ''
    });
    setWarehouseFormErrors({});
    setIsEditWarehouseModalOpen(true);
  };

  const handleUpdateWarehouse = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!warehouseForm.name.trim()) errors.name = 'Name is required';
    if (!warehouseForm.code.trim()) errors.code = 'Code is required';
    setWarehouseFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setWarehouseSubmitting(true);
      await api.put(`/warehouses/${id}`, warehouseForm);
      toast.success('Warehouse updated successfully');
      setIsEditWarehouseModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update warehouse');
    } finally {
      setWarehouseSubmitting(false);
    }
  };

  const handleToggleWarehouseStatus = async () => {
    try {
      await api.patch(`/warehouses/${id}/status`);
      toast.success(`Warehouse ${warehouse.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  // Location Actions
  const openAddLocationModal = () => {
    setEditingLocation(null);
    setLocationForm({ name: '', code: '', description: '' });
    setLocationFormErrors({});
    setIsLocationModalOpen(true);
  };

  const openEditLocationModal = (location) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name,
      code: location.code,
      description: location.description || ''
    });
    setLocationFormErrors({});
    setIsLocationModalOpen(true);
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!locationForm.name.trim()) errors.name = 'Name is required';
    if (!locationForm.code.trim()) errors.code = 'Code is required';
    setLocationFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setLocationSubmitting(true);
      if (editingLocation) {
        await api.put(`/locations/${editingLocation.id}`, locationForm);
        toast.success('Location updated successfully');
      } else {
        await api.post('/locations', { ...locationForm, warehouse_id: id });
        toast.success('Location created successfully');
      }
      setIsLocationModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save location');
    } finally {
      setLocationSubmitting(false);
    }
  };

  const handleToggleLocationStatus = async (location) => {
    try {
      await api.patch(`/locations/${location.id}/status`);
      toast.success(`Location ${location.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle location status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!warehouse) return null;

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/warehouses')}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Warehouses
        </button>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Building2 className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{warehouse.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                  {warehouse.code}
                </span>
                <Badge variant={warehouse.status === 'ACTIVE' ? 'success' : 'error'}>
                  {warehouse.status}
                </Badge>
              </div>
            </div>
          </div>
          
          {hasPermission('WAREHOUSE.UPDATE') && (
            <div className="flex gap-2">
              <Button variant="outline" icon={Edit2} onClick={openEditWarehouseModal}>
                Edit Warehouse
              </Button>
              <Button
                variant={warehouse.status === 'ACTIVE' ? 'danger' : 'primary'}
                icon={Power}
                onClick={handleToggleWarehouseStatus}
              >
                {warehouse.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Details</h3>
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-medium text-gray-500">Address</span>
                <span className="block mt-1 text-sm text-gray-900">{warehouse.address || 'No address provided'}</span>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-500">Description</span>
                <span className="block mt-1 text-sm text-gray-900">{warehouse.description || 'No description provided'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total Locations</span>
              <span className="text-2xl font-bold text-gray-900">{locations.length}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-500">Active Locations</span>
              <span className="text-lg font-medium text-green-600">
                {locations.filter(l => l.status === 'ACTIVE').length}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                Locations
              </h3>
              {hasPermission('LOCATION.CREATE') && (
                <Button size="sm" icon={Plus} onClick={openAddLocationModal}>
                  Add Location
                </Button>
              )}
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {locations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500">
                        No locations found for this warehouse.
                      </td>
                    </tr>
                  ) : (
                    locations.map((location) => (
                      <tr key={location.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {location.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {location.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">
                          {location.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={location.status === 'ACTIVE' ? 'success' : 'error'}>
                            {location.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {hasPermission('LOCATION.UPDATE') && (
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                icon={Edit2}
                                onClick={() => openEditLocationModal(location)}
                                title="Edit"
                              />
                              <Button 
                                variant="ghost" 
                                size="sm"
                                icon={Power}
                                className={location.status === 'ACTIVE' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                                onClick={() => handleToggleLocationStatus(location)}
                                title={location.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Warehouse Modal */}
      <Modal
        isOpen={isEditWarehouseModalOpen}
        onClose={() => setIsEditWarehouseModalOpen(false)}
        title="Edit Warehouse"
      >
        <form onSubmit={handleUpdateWarehouse} className="space-y-4">
          <Input
            label="Warehouse Name"
            value={warehouseForm.name}
            onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
            error={warehouseFormErrors.name}
          />
          <Input
            label="Warehouse Code"
            value={warehouseForm.code}
            onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value.toUpperCase() })}
            error={warehouseFormErrors.code}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={3}
              value={warehouseForm.address}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={3}
              value={warehouseForm.description}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setIsEditWarehouseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={warehouseSubmitting}>
              Update Warehouse
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add/Edit Location Modal */}
      <Modal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title={editingLocation ? 'Edit Location' : 'Add Location'}
      >
        <form onSubmit={handleSaveLocation} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Warehouse</label>
            <input
              type="text"
              disabled
              value={`${warehouse.name} (${warehouse.code})`}
              className="w-full rounded-md border-gray-300 bg-gray-50 shadow-sm sm:text-sm p-2 border"
            />
          </div>
          <Input
            label="Location Name"
            value={locationForm.name}
            onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
            error={locationFormErrors.name}
            placeholder="e.g. Aisle 1 - Rack A"
          />
          <Input
            label="Location Code"
            value={locationForm.code}
            onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value.toUpperCase() })}
            error={locationFormErrors.code}
            placeholder="e.g. A1-RA"
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={3}
              value={locationForm.description}
              onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
              placeholder="Optional details..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => setIsLocationModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={locationSubmitting}>
              {editingLocation ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
