import React from 'react';
import { useCustomerApp } from '../context/CustomerAppContext';
import { ProductCard } from './ProductCard';
import { Layers, Filter, Check } from 'lucide-react';
import { clsx } from 'clsx';

export const CategoriesTab: React.FC = () => {
  const { products, selectedCategoryFilter, setSelectedCategoryFilter } = useCustomerApp();

  const categories = ['All', 'Cotton', 'Denim', 'Silk', 'Linen', 'Recycled Poly'];

  const filtered = selectedCategoryFilter === 'All'
    ? products
    : products.filter((p) => p.category === selectedCategoryFilter);

  return (
    <div className="space-y-4 px-4 pb-20 pt-3">
      <div>
        <h1 className="text-base font-bold font-display text-white">Fabric Categories</h1>
        <p className="text-xs text-slate-400">Filter by raw fiber, weave construction, and GSM weight</p>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        {categories.map((cat) => {
          const isSelected = selectedCategoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border',
                isSelected
                  ? 'bg-teal-500 text-slate-950 border-teal-500 shadow-sm'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
