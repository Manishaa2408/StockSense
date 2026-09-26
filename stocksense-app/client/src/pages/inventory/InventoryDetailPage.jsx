import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, Building2, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AppLayout from '../../layouts/AppLayout';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

export default function InventoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [productData, setProductData] = useState(null);
  const [stockDetails, setStockDetails] = useState([]);

  useEffect(() => {
    const fetchInventoryDetail = async () => {
      try {
        setLoading(true);
        // Fetch product and aggregated stock details
        const { data } = await api.get(`/inventory/product/${id}`);
        setProductData(data.product);
        setStockDetails(data.stock_details || []);
      } catch (err) {
        toast.error('Failed to fetch inventory details');
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryDetail();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner className="h-8 w-8 text-indigo-600" />
        </div>
      </AppLayout>
    );
  }

  if (!productData) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Product inventory details not found.</p>
          <button onClick={() => navigate('/inventory')} className="mt-4 text-indigo-600 hover:underline">
            Go back to Inventory
          </button>
        </div>
      </AppLayout>
    );
  }

  const totalSystemQty = stockDetails.reduce((sum, item) => sum + (item.total_quantity || 0), 0);
  const totalReserved = stockDetails.reduce((sum, item) => sum + (item.reserved_quantity || 0), 0);
  const netAvailable = stockDetails.reduce((sum, item) => sum + (item.available_quantity || 0), 0);
  
  let globalStatus = 'IN_STOCK';
  if (totalSystemQty === 0) globalStatus = 'OUT_OF_STOCK';
  else if (totalSystemQty <= (productData.reorder_level || 0)) globalStatus = 'LOW_STOCK';

  return (
    <AppLayout>
      <div className="mb-6">
        <button 
          onClick={() => navigate('/inventory')} 
          className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Inventory
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{productData.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="neutral" className="font-mono">{productData.sku}</Badge>
            <Badge variant="neutral">{productData.category_name}</Badge>
            <Badge variant={globalStatus === 'IN_STOCK' ? 'success' : globalStatus === 'LOW_STOCK' ? 'warning' : 'error'}>
              {globalStatus.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Base Unit of Measure</p>
          <p className="text-lg font-semibold text-gray-900">{productData.unit_code}</p>
        </div>
      </div>

      {/* Master Stock Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Total System Quantity</p>
          <p className="text-3xl font-bold text-gray-900">{totalSystemQty}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Reserved Quantity</p>
          <p className="text-3xl font-bold text-gray-500">{totalReserved}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-indigo-100 bg-indigo-50/30">
          <p className="text-sm font-medium text-indigo-700 mb-1">Net Available Quantity</p>
          <p className="text-3xl font-bold text-indigo-700">{netAvailable}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-medium text-gray-500 mb-1">Reorder Threshold Level</p>
          <p className="text-3xl font-bold text-gray-900">{productData.reorder_level || 0}</p>
        </div>
      </div>

      {/* Warehouse & Location Breakdowns */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">Stock Breakdown by Location</h3>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage Location</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Quantity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockDetails.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    No stock details available across any location.
                  </td>
                </tr>
              ) : (
                stockDetails.map((detail, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{detail.warehouse_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-500">{detail.location_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                      {detail.available_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {detail.reserved_quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-semibold">
                      {detail.total_quantity}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Note on stock movement traceability:</strong> This aggregated view represents the current state of stock. Every change in stock quantity (receipt, dispatch, transfer) is recorded in the system's ledger to ensure full traceability and accountability.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
