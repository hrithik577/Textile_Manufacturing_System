import React from 'react';
import { FabricProduct } from '../types';
import { useCustomerApp } from '../context/CustomerAppContext';
import { Star, ShieldCheck, Check, Sparkles, Layers } from 'lucide-react';
import { clsx } from 'clsx';

export const ProductCard: React.FC<{ product: FabricProduct }> = ({ product }) => {
  const { setSelectedProduct, addToCart } = useCustomerApp();

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      className="rounded-2xl bg-slate-900 border border-slate-800/80 overflow-hidden shadow-sm hover:border-teal-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
    >
      {/* Product Image Header with Tags */}
      <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Category & Best Seller Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isBestSeller && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-md">
              BESTSELLER
            </span>
          )}
          {product.isTrending && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500 text-white shadow-md">
              TRENDING
            </span>
          )}
        </div>

        {/* Assured Mill Tag */}
        {product.isAssured && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-900/90 text-teal-300 border border-teal-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md backdrop-blur-sm">
            <ShieldCheck className="w-3 h-3 text-teal-400" />
            <span>Assured</span>
          </div>
        )}

        {/* GSM & Width overlay tag */}
        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 backdrop-blur-sm">
          {product.gsm} GSM • {product.widthInches}"
        </div>
      </div>

      {/* Product Details Body */}
      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <h3 className="text-xs font-bold text-white font-display line-clamp-2 leading-snug group-hover:text-teal-300 transition-colors">
            {product.title}
          </h3>

          {/* Rating & Yarn Count */}
          <div className="flex items-center gap-2 mt-1.5 text-[11px]">
            <span className="inline-flex items-center gap-0.5 font-bold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
              {product.rating} <Star className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
            </span>
            <span className="text-slate-400 truncate text-[10px] font-mono">
              {product.yarnCount.split(' ')[0]}
            </span>
          </div>

          {/* Available Colors Dot Swatches */}
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] text-slate-500 font-mono">Colors:</span>
            <div className="flex items-center gap-1">
              {product.colors.slice(0, 4).map((c, idx) => (
                <span
                  key={idx}
                  className="w-3 h-3 rounded-full border border-slate-700 shrink-0"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[9px] font-mono text-slate-400">+{product.colors.length - 4}</span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Order CTA (Flipkart Style) */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold font-mono text-white tracking-tight">
              ₹{product.basePricePerMeter}
            </span>
            <span className="text-xs text-slate-400">/meter</span>
            <span className="text-[11px] text-slate-400 line-through font-mono">
              ₹{product.mrpPerMeter}
            </span>
            <span className="text-[11px] font-bold text-emerald-400">
              {product.discountPercent}% off
            </span>
          </div>

          <div className="text-[10px] text-slate-400 font-mono">
            MOQ: {product.moqMeters} meters • Swatch ₹{product.samplePrice}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart({
                  productId: product.id,
                  title: `${product.title} (Swatch Sample)`,
                  fabricType: product.weaveStructure,
                  selectedColor: product.colors[0],
                  gsm: product.gsm,
                  isSampleOnly: true,
                  quantityMeters: 1,
                  unitPrice: product.samplePrice,
                  sampleSwatchIncluded: true,
                });
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors border border-slate-700 text-center"
            >
              Get Sample
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedProduct(product);
              }}
              className="px-2 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold transition-colors shadow-sm text-center"
            >
              Order Bulk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
