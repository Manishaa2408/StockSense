import React from 'react';
import { Package, Building2, ClipboardList, Truck, Info } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.first_name}!</h1>
        <p className="text-gray-500 mt-1">Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { title: 'Products', count: '—', icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-100' },
          { title: 'Warehouses', count: '—', icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { title: 'Pending Receipts', count: '—', icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-100' },
          { title: 'Pending Deliveries', count: '—', icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-start gap-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Info className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Dashboard Analytics</h3>
          <p className="text-gray-500 mt-1">Dashboard analytics will be available in Module 02.</p>
        </div>
      </div>
    </AppLayout>
  );
}
