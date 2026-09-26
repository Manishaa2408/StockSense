import React from 'react';
import { Package, BarChart3, Truck } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-800 to-indigo-600 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Package className="w-10 h-10" />
            <h1 className="text-4xl font-bold">StockSense</h1>
          </div>
          <p className="text-xl text-indigo-200 mb-12 max-w-md">
            Inventory & Warehouse Management System
          </p>

          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500/30 p-3 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Real-time Tracking</h3>
                <p className="text-indigo-200">Monitor your inventory levels instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500/30 p-3 rounded-lg">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Smart Analytics</h3>
                <p className="text-indigo-200">Make data-driven decisions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-indigo-500/30 p-3 rounded-lg">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Efficient Routing</h3>
                <p className="text-indigo-200">Optimize warehouse operations</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-full bg-indigo-900 blur-3xl"></div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 lg:bg-white relative">
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-indigo-600">
          <Package className="w-8 h-8" />
          <span className="text-2xl font-bold">StockSense</span>
        </div>
        <div className="mx-auto w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
