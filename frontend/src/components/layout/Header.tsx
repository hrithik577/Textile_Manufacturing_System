import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  User,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  LogOut,
  LogIn,
  Settings,
  Shield,
  Layers,
  ChevronDown,
  X,
  Sparkles,
  PhoneCall,
  Activity,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { currentUserProfiles } from '../../services/mock-data';
import { UserRole } from '../../types';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const {
    alerts,
    dismissAlert,
    setSearchModalOpen,
    currentUser,
    setUserRole,
    openBuyerCallModal,
  } = useApp();
  const { logout, session, switchRole } = useAuth();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Ctrl+K / Cmd+K shortcut for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchModalOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { name: 'OVERVIEW', to: '/dashboard' },
    { name: 'PRODUCTION FLOOR', to: '/production' },
    { name: 'RESCUE ENGINE', to: '/rescue-engine' },
    { name: 'ORDERS', to: '/orders' },
    { name: 'INVENTORY', to: '/inventory' },
    { name: 'QUALITY', to: '/quality' },
    { name: 'DISPATCH', to: '/dispatch' },
    { name: 'CLOSING THE BOOKS', to: '/closing-the-books' },
    { name: 'YARNIQ', to: '/yarniq' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-paper)] editorial-border-b">
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Left: Wordmark & Navigation Links */}
        <div className="flex items-center gap-6 lg:gap-8 min-w-0">
          <NavLink
            to="/dashboard"
            className="font-display font-black text-lg tracking-tight uppercase shrink-0 flex items-center gap-2 text-[#111111]"
          >
            <span>EVEREST</span>
            <span className="bg-[#F04424] text-white px-1.5 py-0.5 text-xs font-mono tracking-widest font-bold">
              OS
            </span>
          </NavLink>

          <nav className="hidden xl:flex items-center gap-4 lg:gap-5 overflow-x-auto py-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'editorial-label hover:text-[var(--color-ink)] transition-colors whitespace-nowrap text-[11px]',
                    isActive && 'text-[var(--color-ink)] font-bold border-b-2 border-[var(--color-vermilion)] pb-1'
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Actions (Search, Notifications Bell, User Account Profile) */}
        <div className="flex items-center gap-2 sm:gap-3 text-[var(--color-ink)]">
          {/* 1. Quick Buyer Phone Lookup Trigger */}
          <button
            onClick={() => openBuyerCallModal()}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase bg-white border border-[#111111] hover:bg-[#111111] hover:text-white transition-colors cursor-pointer"
            title="Instant phone lookup when buyer calls"
          >
            <PhoneCall className="w-3 h-3 text-[#F04424]" />
            <span>BUYER CALL</span>
          </button>

          {/* 2. Search Button with Ctrl+K Tooltip */}
          <button
            onClick={() => setSearchModalOpen(true)}
            className="p-2 hover:bg-black/5 border border-transparent hover:border-[#111111] rounded-none transition-colors relative cursor-pointer"
            title="Universal Search (Ctrl+K)"
            aria-label="Universal Search"
          >
            <Search className="w-4 h-4 text-[#111111]" />
          </button>

          {/* 3. Operational Notifications Bell Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileOpen(false);
              }}
              className={clsx(
                'p-2 rounded-none transition-colors relative cursor-pointer',
                notificationsOpen
                  ? 'bg-[#111111] text-white'
                  : 'hover:bg-black/5 text-[#111111]'
              )}
              title="Operational Alerts & Telemetry"
              aria-label="Operational Notifications"
            >
              <Bell className="w-4 h-4" />
              {alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-vermilion)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-vermilion)]" />
                </span>
              )}
            </button>

            {/* Notifications Popover Panel */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-none bg-white border-2 border-[#111111] shadow-2xl p-4 z-50 text-[#111111] font-mono text-xs">
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#111111]">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-[#F04424]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">
                      OPERATIONAL ALERTS ({alerts.length})
                    </h4>
                  </div>
                  <span className="text-[9px] bg-[#111111] text-white px-2 py-0.5 uppercase font-bold tracking-widest">
                    LIVE STREAM
                  </span>
                </div>

                {/* Alerts List */}
                <div className="mt-3 max-h-80 overflow-y-auto space-y-2.5 pr-1 divide-y divide-[#E5E7EB]">
                  {alerts.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                      <p className="text-xs text-[#6B7280]">All production lines &amp; inventory lots nominal.</p>
                      <p className="text-[10px] text-[#9CA3AF]">Zero active alerts.</p>
                    </div>
                  ) : (
                    alerts.map((alert) => {
                      const isCritical = alert.type === 'danger' || alert.severity === 'critical';
                      const isWarning = alert.type === 'warning' || alert.severity === 'warning';
                      return (
                        <div key={alert.id} className="pt-2.5 first:pt-0 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {isCritical ? (
                                <AlertOctagon className="w-3.5 h-3.5 text-[#F04424] shrink-0" />
                              ) : isWarning ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              ) : (
                                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              )}
                              <span className="font-bold text-[#111111] text-xs uppercase leading-tight">
                                {alert.title}
                              </span>
                            </div>
                            <span className="text-[9px] text-[#6B7280] font-mono shrink-0">
                              {alert.timestamp}
                            </span>
                          </div>

                          <p className="text-[11px] text-[#4B5563] font-sans leading-relaxed">
                            {alert.message}
                          </p>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => {
                                setNotificationsOpen(false);
                                navigate(alert.actionUrl);
                              }}
                              className="text-[10px] font-bold text-[#F04424] hover:underline flex items-center gap-1 uppercase"
                            >
                              <span>{alert.actionLabel || 'Inspect'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => dismissAlert(alert.id)}
                              className="text-[10px] text-[#9CA3AF] hover:text-[#111111] uppercase hover:underline"
                            >
                              Acknowledge
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Panel Footer */}
                <div className="mt-3 pt-3 border-t border-[#111111] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/rescue-engine');
                    }}
                    className="text-[11px] font-black text-[#111111] hover:text-[#F04424] flex items-center gap-1.5 uppercase transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F04424]" />
                    <span>OPEN RESCUE ENGINE →</span>
                  </button>
                  <button
                    onClick={() => {
                      alerts.forEach((a) => dismissAlert(a.id));
                    }}
                    className="text-[10px] text-[#6B7280] hover:text-[#111111] uppercase"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. User Profile & Role Switcher Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationsOpen(false);
              }}
              className={clsx(
                'flex items-center gap-2 p-1.5 rounded-none border transition-colors cursor-pointer',
                profileOpen
                  ? 'border-[#111111] bg-[#111111] text-white'
                  : 'border-transparent hover:border-[#111111] hover:bg-black/5 text-[#111111]'
              )}
              title="User Account & Role"
              aria-label="User Account"
            >
              <div className="flex items-center justify-center w-6 h-6 bg-[#111111] text-white text-[10px] font-black font-mono">
                {currentUser?.avatarInitials || 'EM'}
              </div>
              <div className="hidden sm:block text-left min-w-0 pr-1">
                <p className="text-[11px] font-bold truncate font-mono uppercase leading-tight">
                  {currentUser?.name || 'Plant Manager'}
                </p>
                <p className="text-[9px] text-[#6B7280] truncate leading-tight capitalize font-mono">
                  {(currentUser?.role || 'manager').replace(/_/g, ' ')}
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-[#6B7280] hidden sm:block" />
            </button>

            {/* Profile Popover Panel */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-none bg-white border-2 border-[#111111] shadow-2xl p-4 z-50 text-[#111111] font-mono text-xs">
                {/* User Identity Card */}
                <div className="pb-3 mb-3 border-b border-[#111111]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-[#F04424] text-white px-1.5 py-0.5">
                      {session?.credential?.accessLevel?.toUpperCase() || 'ADMIN'} TIER
                    </span>
                    <span className="text-[9px] text-[#6B7280] font-mono">ID: {currentUser.id}</span>
                  </div>
                  <h4 className="text-sm font-black text-[#111111] uppercase truncate">
                    {currentUser.name}
                  </h4>
                  <p className="text-[11px] text-[#4B5563] font-sans truncate">{currentUser.email}</p>
                  <p className="text-[10px] font-bold text-[#F04424] uppercase mt-1">
                    {currentUser.department}
                  </p>
                </div>

                {/* Role Switcher Menu */}
                <div className="space-y-1 mb-3">
                  <p className="text-[9px] uppercase text-[#6B7280] font-black tracking-wider mb-1.5">
                    SWITCH ACTIVE ROLE:
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                    {currentUserProfiles.map((user) => {
                      const isSelected = currentUser.id === user.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            setUserRole(user.role);
                            switchRole(user.role);
                            setProfileOpen(false);
                          }}
                          className={clsx(
                            'w-full flex items-center justify-between p-2 text-xs text-left transition-colors border',
                            isSelected
                              ? 'bg-[#111111] text-white border-[#111111] font-black'
                              : 'bg-[#FBFBF9] hover:bg-[#F4F2ED] text-[#111111] border-[#E5E7EB]'
                          )}
                        >
                          <div className="truncate">
                            <span className="block font-bold capitalize truncate">
                              {user.role.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] opacity-75 block truncate font-sans">
                              {user.name}
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Navigation Links */}
                <div className="pt-2 border-t border-[#111111] space-y-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2 p-1.5 text-xs text-left text-[#4B5563] hover:text-[#111111] hover:bg-[#F4F2ED] transition-colors uppercase font-bold"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>System Settings &amp; Tolerances</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-2 p-1.5 text-xs text-left text-[#4B5563] hover:text-[#111111] hover:bg-[#F4F2ED] transition-colors uppercase font-bold"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[#F04424]" />
                    <span>Role Selection Portal</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 p-1.5 text-xs text-left text-[#F04424] hover:bg-[#F04424]/10 transition-colors uppercase font-black border-t border-dashed border-[#E5E7EB] mt-1 pt-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
