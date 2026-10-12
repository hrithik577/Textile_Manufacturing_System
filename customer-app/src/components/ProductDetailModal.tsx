import React, { useState } from 'react';
import { useCustomerApp } from '../context/CustomerAppContext';
import {
  X,
  Star,
  ShieldCheck,
  Check,
  Layers,
  Sparkles,
  Info,
  Truck,
  FileCheck,
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';

export const ProductDetailModal: React.FC = () => {
  const { selectedProduct, setSelectedProduct, addToCart, setActiveTab } = useCustomerApp();

  const product = selectedProduct;
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [orderQuantity, setOrderQuantity] = useState(product?.moqMeters || 500);

  if (!product) return null;

  const activeColor = product.colors[selectedColorIdx] || product.colors[0];

  // Calculate tiered price based on quantity
  const getCalculatedUnitPrice = (qty: number) => {
    for (const tier of product.tieredPricing) {
      if (qty >= tier.minMeters && qty <= tier.maxMeters) {
        return tier.pricePerMeter;
      }
    }
    return product.tieredPricing[product.tieredPricing.length - 1].pricePerMeter;
  };

  const currentUnitPrice = getCalculatedUnitPrice(orderQuantity);
  const estimatedTotal = orderQuantity * currentUnitPrice;

  const handleAddBulk = () => {
    addToCart({
      productId: product.id,
      title: product.title,
      fabricType: product.weaveStructure,
      selectedColor: activeColor,
      gsm: product.gsm,
      isSampleOnly: false,
      quantityMeters: orderQuantity,
      unitPrice: currentUnitPrice,
      sampleSwatchIncluded: true,
    });
    setSelectedProduct(null);
    setActiveTab('cart');
  };

  const handleAddSample = () => {
    addToCart({
      productId: product.id,
      title: `${product.title} (Swatch Book)`,
      fabricType: product.weaveStructure,
      selectedColor: activeColor,
      gsm: product.gsm,
      isSampleOnly: true,
      quantityMeters: 1,
      unitPrice: product.samplePrice,
      sampleSwatchIncluded: true,
    });
    setSelectedProduct(null);
    setActiveTab('cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      <div
        className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] text-slate-100 overflow-hidden animate-in slide-in-from-bottom duration-200"
      >
        {/* Sticky Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-teal-400 uppercase">{product.sku}</span>
            {product.isAssured && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-400" /> Everest Assured
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedProduct(null)}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Main Image & Tagline */}
          <div className="relative aspect-[16/9] rounded-2xl bg-slate-950 overflow-hidden border border-slate-800">
            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-white backdrop-blur-sm">
              {product.gsm} GSM • {product.widthInches}" Open Width
            </div>
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-white font-display leading-tight">
              {product.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">{product.tagline}</p>

            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                {product.rating} <Star className="w-3 h-3 fill-emerald-400 text-emerald-400" />
              </span>
              <span className="text-slate-400">({product.reviewsCount} verified reviews)</span>
              <span className="text-teal-400 font-mono text-[11px]">Direct Mill Dispatch</span>
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 uppercase font-mono text-[11px]">
                Select Color: <strong className="text-white">{activeColor.name}</strong>
              </span>
              <span className="text-teal-400 font-mono text-[11px]">Pantone {activeColor.pantone}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {product.colors.map((color, idx) => {
                const isSelected = selectedColorIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedColorIdx(idx)}
                    className={clsx(
                      'flex items-center gap-2 p-2 rounded-xl border text-left transition-all',
                      isSelected
                        ? 'bg-teal-950/30 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    )}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-slate-700 shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-white block truncate">{color.name}</span>
                      <span className="text-[9px] text-slate-400 font-mono block">{color.stockMeters.toLocaleString()}m avail</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wholesale Tiered Pricing Matrix */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase font-mono text-slate-400">
                Bulk Volume Wholesale Pricing Matrix
              </h3>
              <span className="text-[10px] text-teal-400 font-mono font-semibold">Tiered Savings</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {product.tieredPricing.map((tier, idx) => {
                const isCurrentTier = orderQuantity >= tier.minMeters && orderQuantity <= tier.maxMeters;
                return (
                  <div
                    key={idx}
                    onClick={() => setOrderQuantity(tier.minMeters)}
                    className={clsx(
                      'p-2.5 rounded-lg border text-center cursor-pointer transition-colors',
                      isCurrentTier
                        ? 'bg-teal-950/40 border-teal-500 text-teal-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    )}
                  >
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {tier.minMeters} - {tier.maxMeters}m
                    </span>
                    <span className="text-sm font-bold font-mono text-white block mt-0.5">
                      ₹{tier.pricePerMeter}
                      <span className="text-[10px] font-normal text-slate-400">/m</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bulk Quantity Stepper */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">Order Quantity (Meters)</span>
              <span className="text-teal-400 font-mono font-semibold">
                Unit Price: ₹{currentUnitPrice}/m
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setOrderQuantity((prev) => Math.max(product.moqMeters, prev - 100))}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-colors border border-slate-700"
              >
                <Minus className="w-4 h-4" />
              </button>

              <input
                type="number"
                step="50"
                min={product.moqMeters}
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(Math.max(product.moqMeters, Number(e.target.value)))}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-center text-base font-bold font-mono text-white focus:outline-none focus:border-teal-500"
              />

              <button
                onClick={() => setOrderQuantity((prev) => prev + 100)}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center transition-colors border border-slate-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-between text-xs pt-1 text-slate-400 font-mono">
              <span>MOQ: {product.moqMeters} meters</span>
              <span className="text-white font-bold">Estimated Total: ₹{estimatedTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Technical Specs Table */}
          <div>
            <h3 className="text-xs font-bold uppercase font-mono text-slate-400 mb-2">
              Mill Technical Specifications
            </h3>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Yarn Count:</span>
                <span className="font-mono text-white">{product.yarnCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Weave Structure:</span>
                <span className="text-white">{product.weaveStructure}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Composition:</span>
                <span className="text-white">{product.composition}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Certifications:</span>
                <span className="text-emerald-400 font-semibold">{product.certifications.join(', ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center gap-3">
          <button
            onClick={handleAddSample}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors text-center"
          >
            Order Swatch (₹{product.samplePrice})
          </button>
          <button
            onClick={handleAddBulk}
            className="flex-[2] py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors shadow-lg text-center flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add {orderQuantity}m Bulk to Cart (₹{estimatedTotal.toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
