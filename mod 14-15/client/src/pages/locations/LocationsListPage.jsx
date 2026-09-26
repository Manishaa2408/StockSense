import React, { useState, useEffect } from 'react';
import AppLayout from '../../layouts/AppLayout';
import { MapPin, Search, Plus, Edit2, Power } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

export default function LocationsListPage() {
  const { hasPermission } = useAuth();
  
  const [locations, setLocations] = useState([]);
  const [activeWarehouses, setActiveWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalItems: 0 });
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    warehouse_id: '',
    name: '',
    code: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchActiveWarehouses();
  }, []);

  useEffect(() => {
    fetchLocations(1);
  }, [searchTerm, warehouseFilter, statusFilter]);

  const fetchActiveWarehouses = async () => {
    try {
      const { data: res } = await api.get('/warehouses', { params: { status: 'ACTIVE', limit: 100 } });
      setActiveWarehouses(res.data?.warehouses || res.data || []);
    } catch (error) {
      toast.error('Failed to load warehouses');
    }
  };

  const fetchLocations = async (page = 1) => {
    try {
      setLoading(true);
      const { data: res } = await api.get('/locations', {
        params: {
          page,
          limit: pagination.limit,
          search: searchTerm,
          warehouse_id: warehouseFilter || undefined,
          status: statusFilter || undefined
        }
      });
      setLocations(res.data?.locations || res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (error) {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    fetchLocations(newPage);
  };

  const openAddModal = () => {
    setEditingLocation(null);
    setFormData({ warehouse_id: '', name: '', code: '', description: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (location) => {
    setEditingLocation(location);
    setFormData({
      warehouse_id: location.warehouse_id,
      name: location.name,
      code: location.code,
      description: location.description || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.warehouse_id) errors.warehouse_id = 'Warehouse is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.code.trim()) errors.code = 'Code is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      if (editingLocation) {
        await api.put(`/locations/${editingLocation.id}`, formData);
        toast.success('Location updated successfully');
      } else {
        await api.post('/locations', formData);
        toast.success('Location created successfully');
      }
      setIsModalOpen(false);
      fetchLocations(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (location) => {
    try {
      await api.patch(`/locations/${location.id}/status`);
      toast.success(`Location ${location.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully`);
      fetchLocations(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  const warehouseOptions = activeWarehouses.map(w => ({
    value: w.id,
    label: `${w.name} (${w.code})`
  }));

  return (
    <AppLayout>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <MapPin className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Storage Locations</h1>
            <p className="text-sm text-gray-500">Manage bins, racks, and aisles</p>
          </div>
        </div>
        
        {hasPermission('LOCATION.CREATE') && (
          <Button onClick={openAddModal} icon={Plus}>
            Add Location
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              options={[
                { value: '', label: 'All Warehouses' },
                ...warehouseOptions
              ]}
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' }
              ]}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Spinner size="lg" className="mx-auto" />
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <MapPin className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900">No locations found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Try adjusting your filters or create a new location.
                    </p>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.Warehouse ? `${location.Warehouse.name} (${location.Warehouse.code})` : '-'}
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
                            onClick={() => openEditModal(location)}
                            title="Edit"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm"
                            icon={Power}
                            className={location.status === 'ACTIVE' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                            onClick={() => handleToggleStatus(location)}
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
        
        {!loading && locations.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Pagination 
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLocation ? 'Edit Location' : 'Add Location'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Warehouse"
            value={formData.warehouse_id}
            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
            options={[
              { value: '', label: 'Select Warehouse' },
              ...warehouseOptions
            ]}
            error={formErrors.warehouse_id}
            disabled={!!editingLocation} // Usually don't change warehouse after creation
          />
          
          <Input
            label="Location Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            placeholder="e.g. Aisle 1 - Rack A"
          />
          
          <Input
            label="Location Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            error={formErrors.code}
            placeholder="e.g. A1-RA"
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
            >
              {editingLocation ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
    </AppLayout>
  );
}
