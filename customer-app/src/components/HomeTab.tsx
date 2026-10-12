import React from 'react';
import { useCustomerApp } from '../context/CustomerAppContext';
import { ProductCard } from './ProductCard';
import {
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Flame,
  Award,
} from 'lucide-react';

export const HomeTab: React.FC = () => {
  const { products, setActiveTab, setSelectedCategoryFilter, searchQuery } = useCustomerApp();

  const filteredProducts = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.composition.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.weaveStructure.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const categories = [
    { label: 'Organic Cotton', key: 'Cotton', icon: '🌱', tag: '25% OFF' },
    { label: 'Raw Denim', key: 'Denim', icon: '👖', tag: 'TRENDING' },
    { label: 'Mulberry Silk', key: 'Silk', icon: '✨', tag: 'LUXURY' },
    { label: 'French Linen', key: 'Linen', icon: '🌾', tag: 'PREMIUM' },
    { label: 'Recycled Poly', key: 'Recycled Poly', icon: '♻️', tag: 'GRS CERT' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Super Mill Deal Hero Banner (Flipkart Style) */}
      <div className="mx-4 mt-3 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 border border-teal-500/40 p-5 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-sm space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold font-mono">
            <Flame className="w-3 h-3 text-amber-400" /> DIRECT MILL WHOLESALE SALE
          </div>
          <h2 className="text-lg font-bold font-display text-white leading-tight">
            Up to <span className="text-teal-400">30% Volume Discount</span> on Export Fabrics
          </h2>
          <p className="text-xs text-slate-300">
            Zero middlemen. Sourced directly from Rieter & Picanol looms with certified 4-point QA grading.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('custom-studio')}
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Custom Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
            >
              Browse All
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-teal-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Quick Category Bubbles */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            Explore Fabric Lines
          </h3>
          <button
            onClick={() => setActiveTab('categories')}
            className="text-xs text-teal-400 font-semibold flex items-center gap-0.5"
          >
            See All <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedCategoryFilter(cat.key);
                setActiveTab('categories');
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl shadow-sm group-hover:border-teal-500 transition-colors relative">
                <span>{cat.icon}</span>
                <span className="absolute -top-1.5 -right-1 px-1 py-0.2 rounded bg-teal-500 text-white text-[8px] font-mono font-bold">
                  {cat.tag}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white transition-colors">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Everest Assured Trust Strip */}
      <div className="mx-4 p-3 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="flex flex-col items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span className="text-[10px] font-bold text-white leading-tight">100% QA Certified</span>
          <span className="text-[9px] text-slate-400">4-Point Grade A</span>
        </div>
        <div className="flex flex-col items-center gap-1 border-x border-slate-800">
          <Truck className="w-4 h-4 text-teal-400" />
          <span className="text-[10px] font-bold text-white leading-tight">Fast Dispatch</span>
          <span className="text-[9px] text-slate-400">Direct Mill Staging</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Award className="w-4 h-4 text-teal-400" />
          <span className="text-[10px] font-bold text-white leading-tight">Swatch Guarantee</span>
          <span className="text-[9px] text-slate-400">Free Sample Swatches</span>
        </div>
      </div>

      {/* Main Fabric Feed Grid */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-display">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Wholesale Fabric Catalog'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {filteredProducts.length} certified fabric constructions available for bulk order
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};
