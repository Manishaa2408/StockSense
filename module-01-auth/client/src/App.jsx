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
      <Route path="/users" element={<ProtectedRoute permission="USER.READ"><UsersListPage /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute permission="USER.READ"><UserDetailPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
