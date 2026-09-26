import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, FolderTree, ArrowRight } from 'lucide-react';
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', parent_id: '' });
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const { hasPermission } = useAuth();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const { data } = await api.get(`/categories?${params.toString()}`);
      setCategories(data.data || []);
    } catch (err) {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search, statusFilter]);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '', parent_id: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      parent_id: cat.parent_id || ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrors({ name: 'Category name is required' });
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', payload);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/categories/${cat.id}/status`, { status: newStatus });
      toast.success(`Category ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change status');
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-sm text-gray-500 mt-1">Organize products into hierarchical categories & classifications</p>
        </div>
        {hasPermission('CATEGORY.CREATE') && (
          <Button icon={Plus} onClick={handleOpenAddModal}>Add Category</Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Input 
            name="search" 
            placeholder="Search category name..." 
            icon={Search} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
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

      {/* Categories Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <FolderTree className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    No categories found
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      <span className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-indigo-600" />
                        {c.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {c.parent_name ? (
                        <span className="inline-flex items-center text-xs font-medium text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                          <ArrowRight className="h-3 w-3 mr-1 text-indigo-500" />
                          {c.parent_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Top Level</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{c.description || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'error'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {hasPermission('CATEGORY.UPDATE') && (
                        <>
                          <button onClick={() => handleOpenEditModal(c)} className="text-indigo-600 hover:text-indigo-900" title="Edit Category">
                            <Edit className="h-5 w-5 inline" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(c)} 
                            className={c.status === 'ACTIVE' ? 'text-amber-600 hover:text-amber-900 text-xs font-semibold' : 'text-emerald-600 hover:text-emerald-900 text-xs font-semibold'}
                          >
                            {c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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

      {/* Add / Edit Category Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCategory ? 'Edit Category' : 'Add Category'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Category Name" 
            name="name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            error={errors.name} 
            placeholder="e.g. Laptops, Office Supplies"
            required 
          />
          <Select 
            label="Parent Category (Optional)" 
            name="parent_id" 
            value={formData.parent_id} 
            onChange={(e) => setFormData({...formData, parent_id: e.target.value})} 
            options={[
              { value: '', label: 'None (Top Level Category)' },
              ...categories
                .filter(c => !editingCategory || c.id !== editingCategory.id) // exclude self
                .map(c => ({ value: c.id, label: c.name }))
            ]} 
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Brief description of products under this category..."
            ></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" loading={submitLoading}>{editingCategory ? 'Update Category' : 'Create Category'}</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
