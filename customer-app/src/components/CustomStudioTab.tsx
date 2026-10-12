import React, { useState } from 'react';
import { useCustomerApp } from '../context/CustomerAppContext';
import {
  Sparkles,
  Zap,
  Sliders,
  DollarSign,
  CheckCircle2,
  Cpu,
  Layers,
  ShoppingBag,
} from 'lucide-react';
import { clsx } from 'clsx';

export const CustomStudioTab: React.FC = () => {
  const { addToCart, setActiveTab } = useCustomerApp();

  const [fiberBase, setFiberBase] = useState('100% GOTS Organic Cotton');
  const [weavePattern, setWeavePattern] = useState('Single Jersey Knit');
  const [customGsm, setCustomGsm] = useState(180);
  const [customColorName, setCustomColorName] = useState('Custom Coral Pantone');
  const [customHex, setCustomHex] = useState('#f87171');
  const [customPantone, setCustomPantone] = useState('PANTONE 16-1546 TCX');
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>(['Enzyme Bio-Wash', 'Sanforized Anti-Shrink']);
  const [customMeters, setCustomMeters] = useState(1000);

  const basePriceMap: Record<string, number> = {
    '100% GOTS Organic Cotton': 150,
    'Pure Normandy Linen': 340,
    '3/1 Selvedge Denim': 220,
    'Mulberry Silk 6A': 820,
    'Recycled Poly Ripstop': 175,
  };

  const finishesList = [
    { name: 'Enzyme Bio-Wash', cost: 12, desc: 'Ultra smooth peach hand-feel' },
    { name: 'Sanforized Anti-Shrink', cost: 8, desc: 'Zero shrinkage guarantee (<2%)' },
    { name: 'PFC-Free DWR Waterproof', cost: 24, desc: 'Lotus leaf water repellent' },
    { name: 'Silver Ion Anti-Bacterial', cost: 16, desc: 'Odor-free freshness coating' },
  ];

  const toggleFinish = (name: string) => {
    setSelectedFinishes((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    );
  };

  // Calculate live quotation
  const baseCost = basePriceMap[fiberBase] || 150;
  const finishCost = selectedFinishes.reduce((sum, f) => {
    const found = finishesList.find((item) => item.name === f);
    return sum + (found ? found.cost : 0);
  }, 0);
  const gsmMultiplier = customGsm / 180;
  const unitPricePerMeter = Math.round((baseCost * gsmMultiplier + finishCost) * 0.95);
  const totalCost = unitPricePerMeter * customMeters;

  const handleOrderCustomFabric = () => {
    addToCart({
      productId: `custom-${Date.now()}`,
      title: `Bespoke Mill Fabric: ${fiberBase} (${weavePattern})`,
      fabricType: `${weavePattern} • ${selectedFinishes.join(', ')}`,
      selectedColor: {
        name: customColorName,
        hex: customHex,
        pantone: customPantone,
      },
      gsm: customGsm,
      isSampleOnly: false,
      quantityMeters: customMeters,
      unitPrice: unitPricePerMeter,
      sampleSwatchIncluded: true,
    });
    setActiveTab('cart');
  };

  return (
    <div className="space-y-6 px-4 pb-24 pt-3 max-w-2xl mx-auto">
      {/* Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 border border-teal-500/40 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-mono font-bold">
          <Sparkles className="w-3 h-3 text-teal-400" /> BESPOKE MILL CONFIGURATOR
        </div>
        <h1 className="text-lg font-bold font-display text-white">
          Custom Fabric Studio & Instant Quotation
        </h1>
        <p className="text-xs text-slate-300 leading-relaxed">
          Design your proprietary fabric construction. Select fiber base, custom GSM weight, Pantone dye recipe, and specialty finishes with direct mill loom dispatch.
        </p>
      </div>

      {/* Step 1: Select Fiber Base */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <label className="text-xs font-bold uppercase font-mono text-slate-300 block">
          1. Select Raw Fiber Base
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {Object.keys(basePriceMap).map((fiber) => (
            <button
              key={fiber}
              onClick={() => setFiberBase(fiber)}
              className={clsx(
                'p-3 rounded-xl border text-left transition-all',
                fiberBase === fiber
                  ? 'bg-teal-950/30 border-teal-500 font-bold text-white shadow-sm ring-1 ring-teal-500/50'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              <div className="flex justify-between">
                <span>{fiber}</span>
                <span className="font-mono text-teal-400">~₹{basePriceMap[fiber]}/m</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Weave Structure & GSM Weight */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <label className="text-xs font-bold uppercase font-mono text-slate-300 block">
          2. Weave Structure & GSM Target
        </label>

        <div>
          <span className="text-[11px] text-slate-400 block mb-1.5">Weave Construction:</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {['Single Jersey Knit', '2/1 Left Hand Twill', '3/1 Selvedge Denim', 'Plain Weave Slub', 'Charmeuse Satin', 'Ripstop 5mm Grid'].map(
              (weave) => (
                <button
                  key={weave}
                  onClick={() => setWeavePattern(weave)}
                  className={clsx(
                    'p-2 rounded-lg border text-center transition-colors',
                    weavePattern === weave
                      ? 'bg-teal-500 text-slate-950 font-bold border-teal-500'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  )}
                >
                  {weave}
                </button>
              )
            )}
          </div>
        </div>

        {/* GSM Slider */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="flex justify-between text-xs">
            <span className="text-slate-300 font-medium">Fabric Weight (GSM):</span>
            <span className="font-mono font-bold text-teal-400 text-sm">{customGsm} GSM</span>
          </div>
          <input
            type="range"
            min="90"
            max="450"
            step="10"
            value={customGsm}
            onChange={(e) => setCustomGsm(Number(e.target.value))}
            className="w-full accent-teal-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>90 GSM (Sheer)</span>
            <span>180 GSM (Standard)</span>
            <span>450 GSM (Heavy)</span>
          </div>
        </div>
      </div>

      {/* Step 3: Pantone Color Matching */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <label className="text-xs font-bold uppercase font-mono text-slate-300 block">
          3. Custom Dye Shade & Pantone Formulation
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Color Shade Name:</span>
            <input
              type="text"
              value={customColorName}
              onChange={(e) => setCustomColorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Pantone TCX Code:</span>
            <input
              type="text"
              value={customPantone}
              onChange={(e) => setCustomPantone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Color Swatch Preview:</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customHex}
                onChange={(e) => setCustomHex(e.target.value)}
                className="w-10 h-9 rounded-lg bg-transparent cursor-pointer border border-slate-700 p-0.5"
              />
              <span className="font-mono text-xs text-slate-300">{customHex.toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Specialty Finishes */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <label className="text-xs font-bold uppercase font-mono text-slate-300 block">
          4. Specialty Stenter Chemical Finishes
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {finishesList.map((finish) => {
            const isChecked = selectedFinishes.includes(finish.name);
            return (
              <div
                key={finish.name}
                onClick={() => toggleFinish(finish.name)}
                className={clsx(
                  'p-3 rounded-xl border cursor-pointer transition-colors',
                  isChecked
                    ? 'bg-teal-950/30 border-teal-500 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                )}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{finish.name}</span>
                  <span className="text-teal-400 font-mono">+₹{finish.cost}/m</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{finish.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 5: Quantity & Live Quotation Box */}
      <div className="p-5 rounded-2xl bg-slate-950 border border-teal-500/50 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-mono text-teal-400 font-bold">LIVE MILL PRICE ESTIMATION</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-white">₹{unitPricePerMeter}</span>
              <span className="text-xs text-slate-400">/meter</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400">ESTIMATED TOTAL</span>
            <span className="text-xl font-bold font-mono text-emerald-400 block">₹{totalCost.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <label className="text-slate-300 font-medium block">Order Quantity (Minimum 500 meters):</label>
          <input
            type="number"
            step="100"
            min="500"
            value={customMeters}
            onChange={(e) => setCustomMeters(Math.max(500, Number(e.target.value)))}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-bold font-mono text-white focus:outline-none focus:border-teal-500"
          />
        </div>

        <button
          onClick={handleOrderCustomFabric}
          className="w-full py-3.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Dispatch Custom Batch to Cart (₹{totalCost.toLocaleString()})</span>
        </button>
      </div>
    </div>
  );
};
