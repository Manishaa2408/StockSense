import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  LogOut, 
  Menu,
  X,
  Package,
  FolderTree,
  Ruler,
  Truck,
  Building2,
  MapPin,
  ArrowLeftRight,
  ClipboardEdit,
  Activity
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Badge from '../components/ui/Badge';

export default function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ...(hasPermission('PRODUCT.READ') ? [{ name: 'Products', to: '/products', icon: Package }] : []),
    ...(hasPermission('CATEGORY.READ') ? [
      { name: 'Categories', to: '/categories', icon: FolderTree },
      { name: 'Units of Measure', to: '/units', icon: Ruler }
    ] : []),
    ...(hasPermission('WAREHOUSE.READ') ? [{ name: 'Warehouses', to: '/warehouses', icon: Building2 }] : []),
    ...(hasPermission('LOCATION.READ') ? [{ name: 'Locations', to: '/locations', icon: MapPin }] : []),
    ...(hasPermission('DELIVERY.READ') ? [{ name: 'Delivery Orders', to: '/deliveries', icon: Truck }] : []),
    ...(hasPermission('TRANSFER.READ') ? [{ name: 'Stock Transfers', to: '/stock-transfers', icon: ArrowLeftRight }] : []),
    ...(hasPermission('ADJUSTMENT.READ') ? [{ name: 'Stock Adjustments', to: '/adjustments', icon: ClipboardEdit }] : []),
    ...(hasPermission('LEDGER.READ') ? [{ name: 'Movement History', to: '/stock-movements', icon: Activity }] : []),
    ...(hasPermission('USER.READ') ? [{ name: 'Users', to: '/users', icon: Users }] : []),
    { name: 'Profile', to: '/profile', icon: UserCircle },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Package className="h-8 w-8 text-indigo-600 mr-2" />
          <span className="text-xl font-bold text-gray-900">StockSense</span>
          <button className="ml-auto lg:hidden" onClick={toggleSidebar}>
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) => `
                flex items-center px-3 py-2.5 text-sm font-medium rounded-lg
                ${isActive 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
              onClick={() => setIsSidebarOpen(false)}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={logout}
            className="flex w-full items-center px-3 py-2.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64 w-full">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 fixed w-full lg:w-[calc(100%-16rem)] z-30">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-900"
            onClick={toggleSidebar}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex-1 flex justify-end items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                <Badge variant="neutral">{user?.role_name || user?.Role?.name || 'User'}</Badge>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold"
              >
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-16 w-full max-w-7xl mx-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
