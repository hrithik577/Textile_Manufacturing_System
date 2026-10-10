import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  ShoppingBag,
  Layers,
  ShieldCheck,
  Package,
  Truck,
  Users,
  AlertOctagon,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  DollarSign,
  Radar,
  LogIn,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}) => {
  const { alerts } = useApp();
  const criticalCount = alerts.filter((a) => a.type === 'danger').length;

  const mainNavItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'YarnIQ Engine', to: '/yarniq', icon: Radar, badge: 'AI Ready', badgeColor: 'vermilion', highlight: true },
    { name: 'Place B2B Order', to: '/place-order', icon: ShoppingBag, badge: 'Studio', badgeColor: 'vermilion' },
    { name: 'Production Floor', to: '/production', icon: Cpu, badge: 'Live 24' },
    { name: 'Customer Orders', to: '/orders', icon: Package },
    { name: 'Inventory Ledger', to: '/inventory', icon: Layers },
    { name: 'Quality Control', to: '/quality', icon: ShieldCheck },
    { name: 'Finished Goods', to: '/finished-goods', icon: Package },
    { name: 'Dispatch & Challans', to: '/dispatch', icon: Truck },
    { name: 'Workforce & Shifts', to: '/workforce', icon: Users },
  ];

  const intelligenceNavItems = [
    {
      name: 'Closing the Books',
      to: '/closing-the-books',
      icon: DollarSign,
      badge: 'Month-End',
      badgeColor: 'emerald',
      highlight: true,
    },
    {
      name: 'Rescue Engine',
      to: '/rescue-engine',
      icon: AlertOctagon,
      badge: criticalCount > 0 ? `${criticalCount} Action` : undefined,
      badgeColor: 'rose',
      highlight: true,
    },
    { name: 'Analytics & Yield', to: '/analytics', icon: BarChart3 },
    { name: 'Buyer Order Portal', to: '/buyer/orders', icon: Sparkles, badge: 'External' },
    { name: 'System Settings', to: '/settings', icon: Settings },
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-[var(--color-ink)] text-white border-r border-white/10 transition-all duration-300 ease-in-out lg:static',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 bg-black/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-8 h-8 bg-[var(--color-vermilion)] text-white shrink-0 font-black">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-xs font-black tracking-widest text-white font-mono uppercase truncate">
                  EVEREST <span className="text-[var(--color-vermilion)]">MILL OS</span>
                </h1>
                <p className="text-[9px] uppercase font-mono tracking-widest text-white/50">
                  CONTROL TOWER v2.4
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 text-white/50 hover:text-white transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Operations Section */}
          <div>
            {!collapsed && (
              <p className="px-3 text-[9px] font-bold font-mono uppercase tracking-widest text-white/40 mb-2">
                MILL OPERATIONS
              </p>
            )}
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all select-none',
                        isActive
                          ? 'bg-[var(--color-vermilion)] text-white font-black'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[9px] px-1.5 py-0.2 bg-black/40 text-white/80 font-mono uppercase font-bold">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Intelligence & Recovery Section */}
          <div>
            {!collapsed && (
              <p className="px-3 text-[9px] font-bold font-mono uppercase tracking-widest text-white/40 mb-2">
                RESCUE & INTELLIGENCE
              </p>
            )}
            <nav className="space-y-1">
              {intelligenceNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider transition-all select-none',
                        isActive
                          ? 'bg-[var(--color-vermilion)] text-white font-black'
                          : item.highlight
                          ? 'text-white/80 hover:text-white hover:bg-white/10'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      )
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <span className="truncate">
                        {item.name}
                      </span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className={clsx(
                          'ml-auto text-[9px] px-1.5 py-0.2 font-mono uppercase font-bold',
                          item.badgeColor === 'rose'
                            ? 'bg-[var(--color-vermilion)] text-white'
                            : 'bg-black/40 text-white/80'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-white/10 bg-black/40 space-y-2">
          <NavLink
            to="/login"
            onClick={closeMobile}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 px-3 py-2 text-xs font-mono uppercase font-bold tracking-wider transition-all select-none',
                isActive
                  ? 'bg-[var(--color-vermilion)] text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              )
            }
            title="Access Login & Role Switcher"
          >
            <LogIn className="w-3.5 h-3.5 shrink-0" />
            {!collapsed && (
              <div className="flex items-center justify-between w-full">
                <span>Switch Role</span>
                <span className="text-[8px] px-1.5 py-0.2 bg-black/50 text-white font-mono">
                  AUTH
                </span>
              </div>
            )}
          </NavLink>

          {!collapsed ? (
            <div className="p-2 bg-black/30 border border-white/10 text-[10px] font-mono text-white/60">
              <div className="flex items-center justify-between text-white font-bold mb-0.5">
                <span>NODE 2026-LIVE</span>
                <span className="w-2 h-2 bg-[var(--color-vermilion)]" />
              </div>
              <p className="text-[9px] text-white/40 uppercase">
                SWISS INDUSTRIAL OPERATING SYSTEM
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2 h-2 bg-[var(--color-vermilion)]" title="System Online" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
