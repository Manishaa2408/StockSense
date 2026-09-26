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
import SuppliersPage from './pages/suppliers/SuppliersPage';
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
import StockTransfersListPage from './pages/stockTransfers/StockTransfersListPage';
import StockTransferCreatePage from './pages/stockTransfers/StockTransferCreatePage';
import StockTransferDetailPage from './pages/stockTransfers/StockTransferDetailPage';
import StockTransferEditPage from './pages/stockTransfers/StockTransferEditPage';
import StockAdjustmentsListPage from './pages/adjustments/StockAdjustmentsListPage';
import StockAdjustmentCreatePage from './pages/adjustments/StockAdjustmentCreatePage';
import StockAdjustmentDetailPage from './pages/adjustments/StockAdjustmentDetailPage';
import StockAdjustmentEditPage from './pages/adjustments/StockAdjustmentEditPage';
import StockMovementsPage from './pages/stockMovements/StockMovementsPage';

import InventoryListPage from './pages/inventory/InventoryListPage';
import InventoryDetailPage from './pages/inventory/InventoryDetailPage';
import GoodsReceiptsListPage from './pages/goodsReceipts/GoodsReceiptsListPage';
import GoodsReceiptCreatePage from './pages/goodsReceipts/GoodsReceiptCreatePage';
import GoodsReceiptDetailPage from './pages/goodsReceipts/GoodsReceiptDetailPage';
import GoodsReceiptEditPage from './pages/goodsReceipts/GoodsReceiptEditPage';

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
      <Route path="/stock-transfers" element={<ProtectedRoute permission="TRANSFER.READ"><StockTransfersListPage /></ProtectedRoute>} />
      <Route path="/stock-transfers/new" element={<ProtectedRoute permission="TRANSFER.CREATE"><StockTransferCreatePage /></ProtectedRoute>} />
      <Route path="/stock-transfers/:id" element={<ProtectedRoute permission="TRANSFER.READ"><StockTransferDetailPage /></ProtectedRoute>} />
      <Route path="/stock-transfers/:id/edit" element={<ProtectedRoute permission="TRANSFER.UPDATE"><StockTransferEditPage /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute permission="PRODUCT.READ"><InventoryListPage /></ProtectedRoute>} />
      <Route path="/inventory/:id" element={<ProtectedRoute permission="PRODUCT.READ"><InventoryDetailPage /></ProtectedRoute>} />
      
      <Route path="/goods-receipts" element={<ProtectedRoute permission="RECEIPT.READ"><GoodsReceiptsListPage /></ProtectedRoute>} />
      <Route path="/goods-receipts/new" element={<ProtectedRoute permission="RECEIPT.CREATE"><GoodsReceiptCreatePage /></ProtectedRoute>} />
      <Route path="/goods-receipts/:id" element={<ProtectedRoute permission="RECEIPT.READ"><GoodsReceiptDetailPage /></ProtectedRoute>} />
      <Route path="/goods-receipts/:id/edit" element={<ProtectedRoute permission="RECEIPT.UPDATE"><GoodsReceiptEditPage /></ProtectedRoute>} />

      <Route path="/adjustments" element={<ProtectedRoute permission="ADJUSTMENT.READ"><StockAdjustmentsListPage /></ProtectedRoute>} />
      <Route path="/adjustments/new" element={<ProtectedRoute permission="ADJUSTMENT.CREATE"><StockAdjustmentCreatePage /></ProtectedRoute>} />
      <Route path="/adjustments/:id" element={<ProtectedRoute permission="ADJUSTMENT.READ"><StockAdjustmentDetailPage /></ProtectedRoute>} />
      <Route path="/adjustments/:id/edit" element={<ProtectedRoute permission="ADJUSTMENT.UPDATE"><StockAdjustmentEditPage /></ProtectedRoute>} />
      <Route path="/stock-movements" element={<ProtectedRoute permission="LEDGER.READ"><StockMovementsPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute permission="USER.READ"><UsersListPage /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute permission="USER.READ"><UserDetailPage /></ProtectedRoute>} />
      <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/profile/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
