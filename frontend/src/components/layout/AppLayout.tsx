import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';
import { SearchModal } from '../common/SearchModal';
import { BuyerCallAssistantModal } from '../orders/BuyerCallAssistantModal';
import { useApp } from '../../context/AppContext';

export const AppLayout: React.FC = () => {
  const { isDemoMode } = useApp();

  return (
    <div className="flex flex-col h-screen bg-[var(--color-paper)] text-[var(--color-ink)] overflow-hidden font-sans">
      <Header />

      {/* Global Demo Simulation Banner */}
      {isDemoMode && (
        <div className="bg-[var(--color-vermilion)]/10 border-b border-[var(--color-vermilion)]/20 px-6 py-1.5 flex items-center justify-between text-xs text-[var(--color-ink)]">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[var(--color-vermilion)] animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[10px] font-mono">
              SIMULATION ACTIVE:
            </span>
            <span className="text-[var(--color-industrial-grey)] text-[11px]">
              Displaying virtual factory event stream and synthetic machine telemetry.
            </span>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Global Modals & Overlays */}
      <ToastContainer />
      <SearchModal />
      <BuyerCallAssistantModal />
    </div>
  );
};

