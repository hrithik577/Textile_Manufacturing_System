import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/common/ToastContainer';

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

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Main App Layout */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="production" element={<ProductionFloorPage />} />
            <Route path="orders" element={<CustomerOrdersPage />} />
            <Route path="place-order" element={<OrderPlacementApp />} />
            <Route path="order-studio" element={<Navigate to="/place-order" replace />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="quality" element={<QualityControlPage />} />
            <Route path="finished-goods" element={<FinishedGoodsPage />} />
            <Route path="dispatch" element={<DispatchPage />} />
            <Route path="rescue-engine" element={<RescueEnginePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="buyer/orders" element={<BuyerPortalPage />} />
            <Route path="buyer/place-order" element={<Navigate to="/place-order" replace />} />
            <Route path="buyer" element={<Navigate to="/buyer/orders" replace />} />
            <Route path="workforce" element={<WorkforcePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
