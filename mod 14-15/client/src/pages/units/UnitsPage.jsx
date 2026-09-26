import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Ruler } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

export default function UnitsPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', unit_type: 'Count', description: '' });
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const { hasPermission } = useAuth();

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (typeFilter) params.append('unit_type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const { data } = await api.get(`/units?${params.toString()}`);
      setUnits(data.data || []);
    } catch (err) {
      toast.error('Failed to fetch units of measure');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [search, typeFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingUnit(null);
    setFormData({ name: '', code: '', unit_type: 'Count', description: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      code: unit.code,
      unit_type: unit.unit_type || 'Count',
      description: unit.description || ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Unit name is required';
    if (!formData.code?.trim()) newErrors.code = 'Symbol/Code is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        unit_type: formData.unit_type,
        description: formData.description.trim() || null
      };

      if (editingUnit) {
        await api.put(`/units/${editingUnit.id}`, payload);
        toast.success('Unit of measure updated successfully');
      } else {
        await api.post('/units', payload);
        toast.success('Unit of measure created successfully');
      }
      setIsModalOpen(false);
      fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (unit) => {
    const newStatus = unit.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/units/${unit.id}/status`, { status: newStatus });
      toast.success(`Unit ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      fetchUnits();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change status');
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Units of Measure (UOM)</h1>
          <p className="text-sm text-gray-500 mt-1">Standardized units used across inventory tracking & transactions</p>
        </div>
        {hasPermission('CATEGORY.CREATE') && (
          <Button icon={Plus} onClick={handleOpenAddModal}>Add Unit</Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <Input 
            name="search" 
            placeholder="Search unit name or symbol..." 
            icon={Search} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div>
          <Select 
            name="typeFilter" 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'All Unit Types' },
              { value: 'Count', label: 'Count (pcs, box)' },
              { value: 'Weight', label: 'Weight (kg, g)' },
              { value: 'Volume', label: 'Volume (L, mL)' },
              { value: 'Length', label: 'Length (m, cm)' },
              { value: 'Packaging', label: 'Packaging' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </div>
        <div>
          <Select 
            name="statusFilter" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      {/* Units Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol / Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <Ruler className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    No units of measure found
                  </td>
                </tr>
              ) : (
                units.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-indigo-600">{u.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                        {u.unit_type || 'Count'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{u.description || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {hasPermission('CATEGORY.UPDATE') && (
                        <>
                          <button onClick={() => handleOpenEditModal(u)} className="text-indigo-600 hover:text-indigo-900" title="Edit Unit">
                            <Edit className="h-5 w-5 inline" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(u)} 
                            className={u.status === 'ACTIVE' ? 'text-amber-600 hover:text-amber-900 text-xs font-semibold' : 'text-emerald-600 hover:text-emerald-900 text-xs font-semibold'}
                          >
                            {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Unit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUnit ? 'Edit Unit of Measure' : 'Add Unit of Measure'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Unit Name" 
            name="name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            error={errors.name} 
            placeholder="e.g. Kilograms, Pieces, Liters"
            required 
          />
          <Input 
            label="Symbol / Code" 
            name="code" 
            value={formData.code} 
            onChange={(e) => setFormData({...formData, code: e.target.value})} 
            error={errors.code} 
            placeholder="e.g. kg, pcs, L, box"
            required 
          />
          <Select 
            label="Unit Type" 
            name="unit_type" 
            value={formData.unit_type} 
            onChange={(e) => setFormData({...formData, unit_type: e.target.value})} 
            options={[
              { value: 'Count', label: 'Count (pieces, boxes)' },
              { value: 'Weight', label: 'Weight (kg, g, lbs)' },
              { value: 'Volume', label: 'Volume (L, mL, gal)' },
              { value: 'Length', label: 'Length (m, cm, ft)' },
              { value: 'Packaging', label: 'Packaging' },
              { value: 'Other', label: 'Other' },
            ]} 
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detailed description of unit usage..."
            ></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" loading={submitLoading}>{editingUnit ? 'Update Unit' : 'Create Unit'}</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
