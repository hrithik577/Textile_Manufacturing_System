import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search, Bell, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { setSearchModalOpen } = useApp();

  const navItems = [
    { name: 'OVERVIEW', to: '/dashboard' },
    { name: 'PRODUCTION FLOOR', to: '/production' },
    { name: 'RESCUE ENGINE', to: '/rescue-engine' },
    { name: 'ORDERS', to: '/orders' },
    { name: 'INVENTORY', to: '/inventory' },
    { name: 'YARNIQ', to: '/yarniq' },
    { name: 'ANALYTICS', to: '/analytics' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-paper)] editorial-border-b">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left: Wordmark & Nav */}
        <div className="flex items-center gap-10">
          <NavLink to="/dashboard" className="font-display font-bold text-xl tracking-tight uppercase">
            Everest <span className="text-[var(--color-vermilion)]">OS</span>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-6 pt-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'editorial-label hover:text-[var(--color-ink)] transition-colors',
                    isActive && 'text-[var(--color-ink)] font-bold border-b-2 border-[var(--color-vermilion)] pb-1'
                  )
                }
              >
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4 text-[var(--color-ink)]">
          <button onClick={() => setSearchModalOpen(true)} className="p-2 hover:bg-black/5 rounded transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-black/5 rounded relative transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[var(--color-vermilion)] rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-black/5 rounded transition-colors">
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
