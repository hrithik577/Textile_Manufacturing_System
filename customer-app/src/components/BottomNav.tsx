import React from 'react';
import { useCustomerApp } from '../context/CustomerAppContext';
import {
  Home,
  Grid,
  Sparkles,
  Package,
  ShoppingCart,
  LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItemDef {
  id: 'home' | 'categories' | 'custom-studio' | 'orders' | 'cart';
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, cart, orders } = useCustomerApp();

  const cartCount = cart.length;
  const activeOrdersCount = orders.filter((o) => o.productionStage !== 'Delivered').length;

  const navItems: NavItemDef[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'custom-studio', label: 'Custom Mill', icon: Sparkles, highlight: true },
    { id: 'orders', label: 'My Orders', icon: Package, badge: activeOrdersCount > 0 ? activeOrdersCount : undefined },
    { id: 'cart', label: 'Cart', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : undefined },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg safe-bottom">
      <div className="grid grid-cols-5 h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={clsx(
                'flex flex-col items-center justify-center relative py-1 transition-colors group',
                isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="relative">
                <Icon
                  className={clsx(
                    'w-5 h-5 transition-transform group-active:scale-90',
                    item.highlight && !isActive && 'text-teal-400',
                    isActive && 'scale-110'
                  )}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] rounded-full bg-teal-500 text-white text-[9px] font-bold font-mono flex items-center justify-center px-0.5 shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-teal-400 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
