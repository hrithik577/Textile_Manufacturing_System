import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { ToastContainer } from '../common/ToastContainer';
import { SearchModal } from '../common/SearchModal';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, Info } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDemoMode } = useApp();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden bg-slate-900/60">
        <TopNav onMobileMenuClick={() => setMobileOpen(true)} />

        {/* Global Demo Simulation Banner */}
        {isDemoMode && (
          <div className="bg-amber-950/40 border-b border-amber-800/60 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">
                SIMULATION ACTIVE:
              </span>
              <span className="text-slate-300 text-[11px]">
                Displaying virtual factory event stream and synthetic machine telemetry.
              </span>
            </div>
            <span className="text-[10px] font-mono text-amber-400/80 hidden sm:inline">
              Member 3 Simulator Engine Active
            </span>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <ToastContainer />
      <SearchModal />
    </div>
  );
};
