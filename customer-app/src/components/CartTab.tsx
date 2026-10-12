import React, { useState } from 'react';
import { useCustomerApp } from '../context/CustomerAppContext';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { clsx } from 'clsx';

export const CartTab: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotalMeters,
    cartSubtotal,
    cartGstAmount,
    cartGrandTotal,
    placeOrder,
    setActiveTab,
    deliveryPincode,
  } = useCustomerApp();

  const [customerName, setCustomerName] = useState('Singhal Garments Sourcing');
  const [customerPhone, setCustomerPhone] = useState('+91 98210 44551');
  const [deliveryAddress, setDeliveryAddress] = useState('Unit 402, Tirupur Garment Export Zone, Phase 1');
  const [gstNumber, setGstNumber] = useState('33AABCS1429M1Z5');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NetBanking' | '30-Day Mill Credit'>('UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-4 pb-20">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-base font-bold text-white font-display">Your Wholesale Cart is Empty</h2>
        <p className="text-xs text-slate-400 max-w-xs">
          Explore our certified organic cotton, raw denim, silk, and custom fabric lines.
        </p>
        <button
          onClick={() => setActiveTab('home')}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-colors"
        >
          Browse Fabric Catalog
        </button>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await placeOrder({
        customerName,
        customerPhone,
        deliveryAddress,
        cityStatePincode: `Tirupur, Tamil Nadu ${deliveryPincode}`,
        gstNumber,
        paymentMethod,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-24 pt-3 max-w-2xl mx-auto">
      <div>
        <h1 className="text-base font-bold font-display text-white">Wholesale Cart & Checkout</h1>
        <p className="text-xs text-slate-400">{cart.length} item(s) • Total {cartTotalMeters.toLocaleString()} meters</p>
      </div>

      {/* Cart Items List */}
      <div className="space-y-3">
        {cart.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span
                  className="w-4 h-4 rounded-full border border-slate-700 mt-0.5 shrink-0"
                  style={{ backgroundColor: item.selectedColor.hex }}
                />
                <div>
                  <h3 className="text-xs font-bold text-white leading-snug">{item.title}</h3>
                  <p className="text-[11px] text-teal-400 font-mono mt-0.5">
                    Color: {item.selectedColor.name} • {item.gsm} GSM
                  </p>
                  {item.isSampleOnly && (
                    <span className="inline-block mt-1 text-[9px] px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40">
                      Sample Swatch Book
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                title="Remove Item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Quantity Stepper & Price Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              {!item.isSampleOnly ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantityMeters - 100)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center border border-slate-700"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-mono font-bold text-white px-2">
                    {item.quantityMeters.toLocaleString()} m
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantityMeters + 100)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center border border-slate-700"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">1 Swatch Pack</span>
              )}

              <div className="text-right">
                <span className="text-sm font-bold font-mono text-white">
                  ₹{item.totalPrice.toLocaleString()}
                </span>
                {!item.isSampleOnly && (
                  <span className="text-[10px] text-slate-400 block font-mono">
                    (₹{item.unitPrice}/m)
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Checkout Form */}
      <form onSubmit={handleCheckout} className="space-y-4">
        {/* Delivery Details */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
          <h3 className="font-bold text-white uppercase font-mono text-[11px] flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-teal-400" /> Factory Delivery Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Company / Buyer Name *</span>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-1">Phone Number *</span>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <span className="text-[11px] text-slate-400 block mb-1">Factory / Warehouse Address *</span>
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <span className="text-[11px] text-slate-400 block mb-1">GSTIN Tax Identification (For Input Tax Credit)</span>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
          <h3 className="font-bold text-white uppercase font-mono text-[11px] flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-teal-400" /> B2B Payment Mode
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { key: 'UPI', label: 'Instant UPI (GooglePay / PhonePe)', sub: 'Zero fee' },
              { key: 'NetBanking', label: 'NEFT / RTGS / Corporate NetBanking', sub: 'Instant receipt' },
              { key: '30-Day Mill Credit', label: '30-Day Mill Credit Line', sub: 'Subject to KYC' },
            ].map((method) => {
              const isSelected = paymentMethod === method.key;
              return (
                <div
                  key={method.key}
                  onClick={() => setPaymentMethod(method.key as any)}
                  className={clsx(
                    'p-3 rounded-xl border cursor-pointer transition-all',
                    isSelected
                      ? 'bg-teal-950/40 border-teal-500 text-white font-bold ring-1 ring-teal-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  )}
                >
                  <span className="block text-xs leading-tight">{method.label}</span>
                  <span className="text-[10px] text-teal-400 font-mono block mt-1">{method.sub}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Fabric Value ({cartTotalMeters.toLocaleString()} meters):</span>
            <span className="font-mono font-semibold">₹{cartSubtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>GST (5% Textile Rate):</span>
            <span className="font-mono">₹{cartGstAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Mill Freight & Loading:</span>
            <span className="text-emerald-400 font-mono font-bold">FREE (Direct Staging)</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
            <span>Total Payable Amount:</span>
            <span className="font-mono text-teal-400">₹{cartGrandTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <span>Confirm & Place Wholesale Order (₹{cartGrandTotal.toLocaleString()})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
