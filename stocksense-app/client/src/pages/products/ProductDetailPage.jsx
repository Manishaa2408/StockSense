import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Edit, AlertTriangle, CheckCircle, Calendar, User, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/date';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/products/${id}`);
      setProduct(data.data);
    } catch (err) {
      toast.error('Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!product) return;
    const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/products/${product.id}/status`, { status: newStatus });
      toast.success(`Product ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      fetchProduct();
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center py-20">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!product) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Product Not Found</h2>
          <Button onClick={() => navigate('/products')} className="mt-4">Back to Products</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate('/products')} className="flex items-center text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-6">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
        </button>

        {/* Master Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                <Badge variant={product.status === 'ACTIVE' ? 'success' : 'error'}>
                  {product.status}
                </Badge>
              </div>
              <p className="font-mono text-sm font-semibold text-indigo-600 mt-1">SKU: {product.sku}</p>
            </div>

            {hasPermission('PRODUCT.UPDATE') && (
              <div className="flex gap-2">
                <Button 
                  variant={product.status === 'ACTIVE' ? 'danger' : 'secondary'} 
                  onClick={handleToggleStatus}
                >
                  {product.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Category</p>
              <p className="text-base font-semibold text-gray-900">{product.category_name || 'Uncategorized'}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Unit of Measure (UOM)</p>
              <p className="text-base font-semibold text-gray-900">{product.unit_name} ({product.unit_code})</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Reorder Level Threshold</p>
              <p className="text-base font-semibold text-gray-900 flex items-center gap-2">
                {product.reorder_level} {product.unit_code}
                {product.reorder_level > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" title="Reorder trigger active" />}
              </p>
            </div>
          </div>

          {product.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Description</p>
              <p className="text-gray-700 leading-relaxed text-sm bg-gray-50 p-4 rounded-lg">{product.description}</p>
            </div>
          )}
        </div>

        {/* Audit & System Information Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Audit Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span>Created By: <strong className="text-gray-900">{product.creator_name || 'System Admin'}</strong></span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>Created At: <strong className="text-gray-900">{formatDate(product.created_at)}</strong></span>
            </div>
            <div className="flex items-center text-gray-600">
              <User className="h-4 w-4 mr-2 text-gray-400" />
              <span>Last Updated By: <strong className="text-gray-900">{product.updater_name || product.creator_name || 'System Admin'}</strong></span>
            </div>
            <div className="flex items-center text-gray-600">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <span>Last Updated At: <strong className="text-gray-900">{formatDate(product.updated_at)}</strong></span>
            </div>
          </div>
        </div>

        {/* Module Responsibility Note */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700">
            <p className="font-semibold mb-1">Architecture Boundary Notice (Product vs Stock)</p>
            <p>
              Module 03 owns product master data definitions. Real-time stock quantities across multiple warehouse locations are managed independently in Module 06 (Inventory & Stock Management).
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
