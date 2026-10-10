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
    { name: 'YarnIQ Engine', to: '/yarniq', icon: Radar, badge: 'AI Ready', badgeColor: 'indigo', highlight: true },
    { name: 'Place B2B Order', to: '/place-order', icon: ShoppingBag, badge: 'Studio', badgeColor: 'teal' },
    { name: 'Production Floor', to: '/production', icon: Cpu, badge: 'Live Grid' },
    { name: 'Customer Orders', to: '/orders', icon: Package },
    { name: 'Inventory', to: '/inventory', icon: Layers },
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
      badge: 'Month-End P&L',
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
    { name: 'Buyer Tracking Portal', to: '/buyer/orders', icon: Sparkles, badge: 'External' },
    { name: 'System Settings', to: '/settings', icon: Settings },
  ];

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-slate-950 border-r border-slate-800 transition-all duration-300 ease-in-out lg:static',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 shrink-0 shadow-[0_0_15px_rgba(20,184,166,0.2)]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold tracking-tight text-white font-display truncate">
                  EVEREST <span className="text-teal-400">TEXTILE OS</span>
                </h1>
                <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                  Operations Control
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
              <p className="px-3 text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400 mb-2">
                Factory Operations
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
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative',
                        isActive
                          ? 'bg-teal-600/15 text-teal-300 border border-teal-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                      )
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
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
              <p className="px-3 text-[10px] font-semibold font-mono uppercase tracking-wider text-slate-400 mb-2">
                Rescue & Intelligence
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
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group relative',
                        item.highlight && !isActive && 'bg-rose-950/20 text-rose-300 border border-rose-900/40 hover:bg-rose-950/40',
                        isActive
                          ? 'bg-teal-600/15 text-teal-300 border border-teal-500/30 shadow-sm'
                          : !item.highlight && 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
                      )
                    }
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon
                      className={clsx(
                        'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                        item.highlight && 'text-rose-400'
                      )}
                    />
                    {!collapsed && (
                      <span className={clsx('truncate', item.highlight && 'font-semibold')}>
                        {item.name}
                      </span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className={clsx(
                          'ml-auto text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold',
                          item.badgeColor === 'rose'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
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
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80">
          {!collapsed ? (
            <div className="rounded-lg bg-slate-900/80 border border-slate-800 p-2.5 text-[11px] text-slate-400">
              <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
                <span>Everest Node v2.4</span>
                <span className="w-2 h-2 rounded-full bg-teal-400" />
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Industrial Textile Control Tower
              </p>
            </div>
          ) : (
            <div className="flex justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400" title="System Online" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
