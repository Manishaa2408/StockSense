import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';

export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
