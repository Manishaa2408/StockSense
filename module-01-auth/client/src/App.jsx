import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicRoute from './routes/PublicRoute';
import ProtectedRoute from './routes/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import SignUpPage from './pages/auth/SignUpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

import DashboardPage from './pages/dashboard/DashboardPage';
import UsersListPage from './pages/users/UsersListPage';
import UserDetailPage from './pages/users/UserDetailPage';
import ProfilePage from './pages/profile/ProfilePage';
import ChangePasswordPage from './pages/profile/ChangePasswordPage';
import ProductsListPage from './pages/products/ProductsListPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import UnitsPage from './pages/units/UnitsPage';
import WarehousesListPage from './pages/warehouses/WarehousesListPage';
import WarehouseDetailPage from './pages/warehouses/WarehouseDetailPage';
import LocationsListPage from './pages/locations/LocationsListPage';
import DeliveriesListPage from './pages/deliveries/DeliveriesListPage';
import DeliveryCreatePage from './pages/deliveries/DeliveryCreatePage';
import DeliveryDetailPage from './pages/deliveries/DeliveryDetailPage';
import DeliveryEditPage from './pages/deliveries/DeliveryEditPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUpPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/verify-otp" element={<PublicRoute><VerifyOtpPage /></PublicRoute>} />
      <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute permission="PRODUCT.READ"><ProductsListPage /></ProtectedRoute>} />
      <Route path="/products/:id" element={<ProtectedRoute permission="PRODUCT.READ"><ProductDetailPage /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute permission="CATEGORY.READ"><CategoriesPage /></ProtectedRoute>} />
      <Route path="/units" element={<ProtectedRoute permission="CATEGORY.READ"><UnitsPage /></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute permission="WAREHOUSE.READ"><WarehousesListPage /></ProtectedRoute>} />
      <Route path="/warehouses/:id" element={<ProtectedRoute permission="WAREHOUSE.READ"><WarehouseDetailPage /></ProtectedRoute>} />
      <Route path="/locations" element={<ProtectedRoute permission="LOCATION.READ"><LocationsListPage /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute permission="DELIVERY.READ"><DeliveriesListPage /></ProtectedRoute>} />
      <Route path="/deliveries/new" element={<ProtectedRoute permission="DELIVERY.CREATE"><DeliveryCreatePage /></ProtectedRoute>} />
      <Route path="/deliveries/:id" element={<ProtectedRoute permission="DELIVERY.READ"><DeliveryDetailPage /></ProtectedRoute>} />
      <Route path="/deliveries/:id/edit" element={<ProtectedRoute permission="DELIVERY.UPDATE"><DeliveryEditPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute permission="USER.READ"><UsersListPage /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute permission="USER.READ"><UserDetailPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
