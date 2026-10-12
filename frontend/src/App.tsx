import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/common/ToastContainer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductionFloorPage } from './pages/ProductionFloorPage';
import { CustomerOrdersPage } from './pages/CustomerOrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { QualityControlPage } from './pages/QualityControlPage';
import { FinishedGoodsPage } from './pages/FinishedGoodsPage';
import { DispatchPage } from './pages/DispatchPage';
import { RescueEnginePage } from './pages/RescueEnginePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { BuyerPortalPage } from './pages/BuyerPortalPage';
import { WorkforcePage } from './pages/WorkforcePage';
import { SettingsPage } from './pages/SettingsPage';
import { OrderPlacementApp } from './pages/OrderPlacementApp';
import { ClosingTheBooksPage } from './pages/ClosingTheBooksPage';
import { YarnIQPage } from './pages/YarnIQPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* ─── Public routes ─────────────────────────────────────────── */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* ─── Protected App Shell ───────────────────────────────────── */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Default redirect to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* All roles with '*' or '/dashboard' in their allowedRoutes */}
              <Route path="dashboard" element={<ProtectedRoute requiredPath="/dashboard"><DashboardPage /></ProtectedRoute>} />

              {/* Operations routes */}
              <Route path="yarniq" element={<ProtectedRoute requiredPath="/yarniq"><YarnIQPage /></ProtectedRoute>} />
              <Route path="production" element={<ProtectedRoute requiredPath="/production"><ProductionFloorPage /></ProtectedRoute>} />
              <Route path="orders" element={<ProtectedRoute requiredPath="/orders"><CustomerOrdersPage /></ProtectedRoute>} />
              <Route path="place-order" element={<ProtectedRoute requiredPath="/place-order"><OrderPlacementApp /></ProtectedRoute>} />
              <Route path="order-studio" element={<Navigate to="/place-order" replace />} />
              <Route path="inventory" element={<ProtectedRoute requiredPath="/inventory"><InventoryPage /></ProtectedRoute>} />
              <Route path="quality" element={<ProtectedRoute requiredPath="/quality"><QualityControlPage /></ProtectedRoute>} />
              <Route path="finished-goods" element={<ProtectedRoute requiredPath="/finished-goods"><FinishedGoodsPage /></ProtectedRoute>} />
              <Route path="dispatch" element={<ProtectedRoute requiredPath="/dispatch"><DispatchPage /></ProtectedRoute>} />

              {/* Plant Manager routes */}
              <Route path="rescue-engine" element={<ProtectedRoute requiredPath="/rescue-engine"><RescueEnginePage /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute requiredPath="/analytics"><AnalyticsPage /></ProtectedRoute>} />
              <Route path="workforce" element={<ProtectedRoute requiredPath="/workforce"><WorkforcePage /></ProtectedRoute>} />
              <Route path="closing-the-books" element={<ProtectedRoute requiredPath="/closing-the-books"><ClosingTheBooksPage /></ProtectedRoute>} />
              <Route path="owner-pnl" element={<Navigate to="/closing-the-books" replace />} />
              <Route path="settings" element={<ProtectedRoute requiredPath="/settings"><SettingsPage /></ProtectedRoute>} />

              {/* Buyer routes */}
              <Route path="buyer/orders" element={<ProtectedRoute requiredPath="/buyer/orders"><BuyerPortalPage /></ProtectedRoute>} />
              <Route path="buyer/place-order" element={<Navigate to="/place-order" replace />} />
              <Route path="buyer" element={<Navigate to="/buyer/orders" replace />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
