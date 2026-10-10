import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Search,
  Bell,
  Cpu,
  ShoppingBag,
  ChevronDown,
  User,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { clsx } from 'clsx';
import { DataSourceBadge } from '../common/DataSourceBadge';
import { currentUserProfiles } from '../../services/mock-data';
import { UserRole } from '../../types';

interface TopNavProps {
  onMobileMenuClick: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ onMobileMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    setUserRole,
    isDemoMode,
    toggleDemoMode,
    alerts,
    dismissAlert,
    setSearchModalOpen,
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Generate breadcrumb info
  const pathnames = location.pathname.split('/').filter((x) => x);
  const pageTitleMap: Record<string, { title: string; subtitle: string }> = {
    dashboard: { title: "Factory Overview", subtitle: "Real-time production, capacity, defect telemetry & delivery SLAs" },
    production: { title: "Production Floor", subtitle: "Live machine monitoring, speed, tension, uptime & shift output" },
    orders: { title: "Customer Orders", subtitle: "Searchable orders, multi-stage production progress & cost margins" },
    inventory: { title: "Inventory Management", subtitle: "Raw yarn, dyes, chemicals, greige & warehouse movements" },
    quality: { title: "Quality Control & Traceability", subtitle: "Automated inspection queue, defect Pareto, GSM audits & pass certification" },
    'finished-goods': { title: "Finished Goods Warehouse", subtitle: "Inspected export-ready fabric rolls & rack allocation" },
    dispatch: { title: "Dispatch & Challan Console", subtitle: "Eligible roll verification, vehicle assignment & shipment generation" },
    workforce: { title: "Workforce & Shifts", subtitle: "Shift rosters, machine operator assignments & operator efficiency ratings" },
    'rescue-engine': { title: "Everest Rescue Engine", subtitle: "Operational AI triage, root-cause diagnostics & recovery plan approval" },
    analytics: { title: "Manufacturing Analytics", subtitle: "OEE utilization, First-Pass Yield (FPY), downtime Pareto & unit profitability" },
    settings: { title: "System Configuration", subtitle: "Factory tolerances, API endpoints & simulation parameters" },
    buyer: { title: "Buyer Order Portal", subtitle: "Direct customer tracking, certified test reports & dispatch tracking" },
    'place-order': { title: "B2B Order Placement Studio", subtitle: "Configure fabric batches, calculate transparent pricing in ₹ (INR) & dispatch to mill" },
  };

  const currentKey = pathnames[0] || 'dashboard';
  const pageInfo = pageTitleMap[currentKey] || {
    title: currentKey.charAt(0).toUpperCase() + currentKey.slice(1),
    subtitle: 'Textile Operations Hub',
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md">
      {/* Left: Mobile Menu + Breadcrumbs & Title */}
      <div className="flex items-center gap-4 min-w-0">
        <button
          onClick={onMobileMenuClick}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-slate-400 hover:text-slate-300">Everest OS</span>
            <span>/</span>
            <span className="text-teal-400 font-medium capitalize font-display">
              {currentKey}
            </span>
          </div>
          <h2 className="text-base font-bold text-white font-display truncate">
            {pageInfo.title}
          </h2>
        </div>
      </div>

      {/* Right: Search, Demo Mode Toggle, Notifications, Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar Trigger */}
        <button
          onClick={() => setSearchModalOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Search orders, looms, lots...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
            Ctrl+K
          </kbd>
        </button>

        {/* Place Order Studio Quick Action */}
        <Link
          to="/place-order"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-md shadow-teal-950/40 border border-teal-500/50 hover:scale-105 duration-150"
          title="Open Buyer B2B Order Placement Studio"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Place Order</span>
        </Link>

        {/* Demo Mode / Live Badge & Switch */}
        <div className="flex items-center gap-2">
          <DataSourceBadge source={isDemoMode ? 'SIMULATED' : 'LIVE'} />
          <button
            onClick={toggleDemoMode}
            className={clsx(
              'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
              isDemoMode
                ? 'bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-950/70'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-950/70'
            )}
            title="Toggle between Virtual Factory Simulation mode and Live Backend API"
          >
            <RefreshCw className="w-3 h-3 text-current" />
            <span className="text-[11px]">{isDemoMode ? 'Sim Mode' : 'Live API'}</span>
          </button>
        </div>

        {/* Notifications Bell & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                      Operational Alerts ({alerts.length})
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400">Everest Telemetry Stream</span>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No active operational alerts.</p>
                  ) : (
                    alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 text-xs space-y-1.5 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-semibold text-white font-display text-[11px] leading-tight">
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                            {alert.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{alert.message}</p>
                        <div className="pt-1 flex items-center justify-between">
                          <button
                            onClick={() => {
                              setNotificationsOpen(false);
                              navigate(alert.actionUrl);
                            }}
                            className="text-[11px] font-medium text-teal-400 hover:text-teal-300 flex items-center gap-1"
                          >
                            <span>{alert.actionLabel}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="text-[10px] text-slate-400 hover:text-slate-300"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Role Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors border border-slate-800 bg-slate-950/60"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-teal-600/30 border border-teal-500/50 text-teal-300 text-xs font-bold font-mono">
              {currentUser.avatarInitials}
            </div>
            <div className="hidden sm:block text-left min-w-0 pr-1">
              <p className="text-xs font-semibold text-white truncate font-display leading-tight">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate leading-tight capitalize">
                {currentUser.role.replace(/_/g, ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-3 z-40 animate-in fade-in zoom-in-95 duration-150">
                <div className="pb-2.5 mb-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white font-display">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-teal-400 font-mono mt-0.5">{currentUser.department}</p>
                </div>

                <p className="text-[10px] font-mono uppercase text-slate-400 px-1 mb-1.5">
                  Switch Active Role:
                </p>
                <div className="space-y-1">
                  {currentUserProfiles.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setUserRole(user.role);
                        setProfileOpen(false);
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-colors',
                        currentUser.id === user.id
                          ? 'bg-teal-600/20 text-teal-300 font-semibold border border-teal-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      )}
                    >
                      <div className="truncate">
                        <span className="block capitalize truncate">{user.role.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{user.name}</span>
                      </div>
                      {currentUser.id === user.id && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
