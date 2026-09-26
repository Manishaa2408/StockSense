import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../layouts/AppLayout';
import useAuth from '../../hooks/useAuth';
import api from '../../api/axios';
import { Package, Building2, ClipboardList, Truck, PackageCheck, AlertTriangle, ArrowLeftRight, Plus, Activity } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { toast } from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/v1/dashboard/stats');
      setStats(data.data);
    } catch (error) {
      toast.error('Failed to load dashboard statistics');
      // mock data for UI development if API fails
      setStats({
        totalProducts: 120,
        activeWarehouses: 5,
        pendingGoodsReceipts: 3,
        pendingDeliveries: 8,
        totalStockQuantity: 15400,
        lowStockAlerts: 12,
        pendingTransfers: 4,
        lowStockItems: [
          { id: 1, name: 'Widget A', sku: 'WGT-A', warehouse: 'Main Hub', location: 'A1', available: 10, reorderLevel: 20, status: 'LOW_STOCK' },
          { id: 2, name: 'Widget B', sku: 'WGT-B', warehouse: 'East Wing', location: 'B3', available: 0, reorderLevel: 5, status: 'OUT_OF_STOCK' },
        ],
        recentActivity: [
          { id: 1, title: 'Goods Receipt #1024 completed', time: '2 hours ago' },
          { id: 2, title: 'Delivery #5012 pending', time: '5 hours ago' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.first_name}!</h1>
          <p className="text-sm text-gray-500 mt-1">Here is what's happening with your inventory today.</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg flex items-center p-5">
            <div className="p-3 rounded-md bg-indigo-50 text-indigo-600">
              <Package className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Products</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats?.totalProducts || 0}</p>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg flex items-center p-5">
            <div className="p-3 rounded-md bg-green-50 text-green-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Active Warehouses</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats?.activeWarehouses || 0}</p>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg flex items-center p-5 relative">
            <div className="p-3 rounded-md bg-blue-50 text-blue-600">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Pending Goods Receipts</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats?.pendingGoodsReceipts || 0}</p>
            </div>
            {stats?.pendingGoodsReceipts > 0 && (
              <span className="absolute top-4 right-4 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg flex items-center p-5 relative">
            <div className="p-3 rounded-md bg-amber-50 text-amber-600">
              <Truck className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Pending Deliveries</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats?.pendingDeliveries || 0}</p>
            </div>
            {stats?.pendingDeliveries > 0 && (
              <span className="absolute top-4 right-4 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        {/* Secondary Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg flex items-center p-5">
            <div className="p-3 rounded-md bg-teal-50 text-teal-600">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Total Stock Quantity</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats?.totalStockQuantity || 0}</p>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg flex items-center p-5">
            <div className="p-3 rounded-md bg-red-50 text-red-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Low Stock Alerts</p>
              <p className={`mt-1 text-xl font-semibold ${stats?.lowStockAlerts > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {stats?.lowStockAlerts || 0}
              </p>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg flex items-center p-5">
            <div className="p-3 rounded-md bg-purple-50 text-purple-600">
              <ArrowLeftRight className="h-6 w-6" />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500 truncate">Pending Transfers</p>
              <p className="mt-1 text-xl font-semibold text-gray-900">{stats?.pendingTransfers || 0}</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  Low Stock Alerts
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {stats?.lowStockItems?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                          <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                          <th className="px-4 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder</th>
                          <th className="px-4 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {stats.lowStockItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-500">{item.sku}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{item.warehouse}</div>
                              <div className="text-sm text-gray-500">{item.location}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                              {item.available}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                              {item.reorderLevel}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <Badge variant={item.status === 'OUT_OF_STOCK' ? 'error' : 'warning'}>
                                {item.status.replace('_', ' ')}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <PackageCheck className="mx-auto h-12 w-12 text-green-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">All product inventory levels are healthy!</h3>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="px-4 py-5 sm:p-6 space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/deliveries/new')}
                >
                  <Truck className="h-5 w-5 mr-3 text-indigo-500" />
                  New Delivery Order
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/goods-receipts/new')}
                >
                  <ClipboardList className="h-5 w-5 mr-3 text-indigo-500" />
                  New Goods Receipt
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/products')}
                >
                  <Plus className="h-5 w-5 mr-3 text-indigo-500" />
                  Add Product
                </Button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {stats?.recentActivity?.length > 0 ? (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {stats.recentActivity.map((activity, activityIdx) => (
                        <li key={activity.id}>
                          <div className="relative pb-8">
                            {activityIdx !== stats.recentActivity.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center ring-8 ring-white">
                                  <Activity className="h-4 w-4 text-indigo-600" />
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-500">{activity.title}</p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  <time>{activity.time}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
