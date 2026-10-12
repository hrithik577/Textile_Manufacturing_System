import React from 'react';
import { useCustomerApp } from '../context/CustomerAppContext';
import {
  Search,
  MapPin,
  ShoppingCart,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  X,
} from 'lucide-react';

export const MobileHeader: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    deliveryPincode,
    setDeliveryPincode,
    cart,
    setActiveTab,
  } = useCustomerApp();

  const totalCartCount = cart.length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md safe-top">
      {/* Top Row: Logo & Delivery Location & Cart */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          {/* Logo icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/40 shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white font-display">
                EVEREST <span className="text-teal-400">BAZAAR</span>
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/40">
                PLUS
              </span>
            </div>
            {/* Delivery address row */}
            <div
              onClick={() => {
                const pin = prompt('Enter Delivery Pincode:', deliveryPincode);
                if (pin && pin.length === 6) setDeliveryPincode(pin);
              }}
              className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer hover:text-teal-300 transition-colors"
            >
              <MapPin className="w-2.5 h-2.5 text-teal-400" />
              <span>Deliver to {deliveryPincode}</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Right action icons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('custom-studio')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-950/80 text-teal-300 border border-teal-700/80 text-[11px] font-semibold hover:bg-teal-900 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-teal-400" />
            <span>Mill Studio</span>
          </button>

          {/* Cart Icon with badge */}
          <button
            onClick={() => setActiveTab('cart')}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalCartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-teal-500 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-md animate-bounce">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Input Bar (Flipkart Style) */}
      <div className="px-4 pb-2.5">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organic cotton, raw denim, silk, linen, GSM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
