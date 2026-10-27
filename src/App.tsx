/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PortalProvider } from './context/PortalContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { MyCropsPage } from './pages/MyCropsPage';
import { GovernmentSchemesPage } from './pages/GovernmentSchemesPage';
import { MarketPricesPage } from './pages/MarketPricesPage';
import { WeatherPage } from './pages/WeatherPage';
import { SubsidyLoanPage } from './pages/SubsidyLoanPage';
import { GrievancesPage } from './pages/GrievancesPage';
import { ProfilePage } from './pages/ProfilePage';

export default function App() {
  return (
    <PortalProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/crops" element={<MyCropsPage />} />
            <Route path="/schemes" element={<GovernmentSchemesPage />} />
            <Route path="/market-prices" element={<MarketPricesPage />} />
            <Route path="/weather" element={<WeatherPage />} />
            <Route path="/subsidy-loan" element={<SubsidyLoanPage />} />
            <Route path="/grievances" element={<GrievancesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </PortalProvider>
  );
}
