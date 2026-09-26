import React, { useState, useEffect } from 'react';
import AppLayout from '../../layouts/AppLayout';
import api from '../../api/axios';
import { Users, Building, Plus, Pencil, Power, Search } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { toast } from 'react-hot-toast';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, [page, statusFilter, search]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      
      const { data } = await api.get('/api/v1/suppliers', { params });
      setSuppliers(data.data.rows || []);
      setTotalPages(data.data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        code: supplier.code || '',
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || ''
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        code: '',
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingSupplier) {
        await api.put(`/api/v1/suppliers/${editingSupplier.id}`, formData);
        toast.success('Supplier updated successfully');
      } else {
        await api.post('/api/v1/suppliers', formData);
        toast.success('Supplier created successfully');
      }
      handleCloseModal();
      fetchSuppliers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (supplier) => {
    try {
      const newStatus = supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/api/v1/suppliers/${supplier.id}/status`, { status: newStatus });
      toast.success('Status updated successfully');
      fetchSuppliers();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Supplier & Vendor Management</h1>
              <p className="text-sm text-gray-500">Manage your suppliers and their contact information</p>
            </div>
          </div>
          <Button onClick={() => handleOpenModal()}>
            <Plus className="h-5 w-5 mr-2" />
            Add Supplier
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search supplier code, name, contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Status' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' }
                ]}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center p-8">
                <Spinner size="lg" />
              </div>
            ) : suppliers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? 'Try adjusting your search filters' : 'Get started by adding a new supplier'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {supplier.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.contact_person || '-'}</div>
                        <div className="text-sm text-gray-500">{supplier.email || supplier.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={supplier.status === 'ACTIVE' ? 'success' : 'error'}>
                          {supplier.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(supplier)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Supplier"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(supplier)}
                            className={`${supplier.status === 'ACTIVE' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                            title={supplier.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {!loading && suppliers.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={setPage} 
              />
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Supplier Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            placeholder="e.g. SUP-001"
          />
          <Input
            label="Supplier Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Contact Person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingSupplier ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
