import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Package, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';

export default function ProductsListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [status, setStatus] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', sku: '', category_id: '', unit_id: '', reorder_level: 0, description: ''
  });
  const [errors, setErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (categoryId) params.append('category_id', categoryId);
      if (unitId) params.append('unit_id', unitId);
      if (status) params.append('status', status);

      const { data } = await api.get(`/products?${params.toString()}`);
      setProducts(data.data);
      if (data.meta) {
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.total);
      }
    } catch (err) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndUnits = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([
        api.get('/categories'),
        api.get('/units')
      ]);
      setCategories(catRes.data.data || []);
      setUnits(unitRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories/units:', err);
    }
  };

  useEffect(() => {
    fetchCategoriesAndUnits();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, search, categoryId, unitId, status]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', category_id: '', unit_id: '', reorder_level: 0, description: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      unit_id: product.unit_id,
      reorder_level: product.reorder_level,
      description: product.description || ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku?.trim()) newErrors.sku = 'SKU is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.unit_id) newErrors.unit_id = 'Unit of measure is required';
    if (formData.reorder_level < 0) newErrors.reorder_level = 'Reorder level cannot be negative';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitLoading(true);
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', formData);
        toast.success('Product created successfully');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/products/${product.id}/status`, { status: newStatus });
      toast.success(`Product ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product master data, SKUs, categories, and reorder levels</p>
        </div>
        {hasPermission('PRODUCT.CREATE') && (
          <Button icon={Plus} onClick={handleOpenAddModal}>Add Product</Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="sm:col-span-1">
          <Input 
            name="search" 
            placeholder="Search name or SKU..." 
            icon={Search} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div>
          <Select 
            name="categoryId" 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />
        </div>
        <div>
          <Select 
            name="unitId" 
            value={unitId} 
            onChange={(e) => setUnitId(e.target.value)}
            options={[
              { value: '', label: 'All Units' },
              ...units.map(u => ({ value: u.id, label: `${u.name} (${u.code})` }))
            ]}
          />
        </div>
        <div>
          <Select 
            name="status" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-indigo-600">{p.sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.category_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.unit_code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className="flex items-center gap-1.5">
                        {p.reorder_level}
                        {p.reorder_level > 0 && (
                          <AlertTriangle className="h-4 w-4 text-amber-500 inline" title="Reorder Threshold Configured" />
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={p.status === 'ACTIVE' ? 'success' : 'error'}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => navigate(`/products/${p.id}`)} className="text-indigo-600 hover:text-indigo-900" title="View Details">
                        <Eye className="h-5 w-5 inline" />
                      </button>
                      {hasPermission('PRODUCT.UPDATE') && (
                        <>
                          <button onClick={() => handleOpenEditModal(p)} className="text-gray-600 hover:text-gray-900" title="Edit Product">
                            <Edit className="h-5 w-5 inline" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(p)} 
                            className={p.status === 'ACTIVE' ? 'text-amber-600 hover:text-amber-900' : 'text-emerald-600 hover:text-emerald-900'}
                            title={p.status === 'ACTIVE' ? 'Deactivate Product' : 'Activate Product'}
                          >
                            {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
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
        {!loading && products.length > 0 && (
          <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Product Name" 
            name="name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            error={errors.name} 
            required 
          />
          <Input 
            label="SKU (Stock Keeping Unit)" 
            name="sku" 
            value={formData.sku} 
            onChange={(e) => setFormData({...formData, sku: e.target.value})} 
            error={errors.sku} 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Category" 
              name="category_id" 
              value={formData.category_id} 
              onChange={(e) => setFormData({...formData, category_id: e.target.value})} 
              error={errors.category_id} 
              options={categories.map(c => ({ value: c.id, label: c.name }))} 
              placeholder="Select category" 
              required 
            />
            <Select 
              label="Unit of Measure" 
              name="unit_id" 
              value={formData.unit_id} 
              onChange={(e) => setFormData({...formData, unit_id: e.target.value})} 
              error={errors.unit_id} 
              options={units.map(u => ({ value: u.id, label: `${u.name} (${u.code})` }))} 
              placeholder="Select UOM" 
              required 
            />
          </div>
          <Input 
            label="Reorder Level (Threshold)" 
            name="reorder_level" 
            type="number" 
            value={formData.reorder_level} 
            onChange={(e) => setFormData({...formData, reorder_level: parseInt(e.target.value, 10) || 0})} 
            error={errors.reorder_level} 
            required 
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detailed description of the product..."
            ></textarea>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" loading={submitLoading}>{editingProduct ? 'Update Product' : 'Create Product'}</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
