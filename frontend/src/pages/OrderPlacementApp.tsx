import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  Building,
  Flame,
  Sparkles,
  Cpu,
  Percent,
} from 'lucide-react';
import { ordersService, PortalOrderPayload } from '../services/orders';
import { PriorityLevel } from '../types';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

interface FabricOption {
  id: string;
  name: string;
  category: string;
  gsmDefault: number;
  gsmRange: [number, number];
  basePriceInr: number;
  defaultWidth: number;
  weaveTypes: string[];
  description: string;
  tag: string;
}

const FABRIC_CATALOG: FabricOption[] = [
  {
    id: 'org-cotton-twill',
    name: '100% Organic Cotton Twill',
    category: 'Woven Bottom-Weight',
    gsmDefault: 210,
    gsmRange: [180, 280],
    basePriceInr: 280.0,
    defaultWidth: 58,
    weaveTypes: ['2/1 Twill', '3/1 Heavy Twill', 'Broken Twill'],
    description: 'GOTS certified organic cotton for premium chinos, jackets, workwear, and sustainable apparel.',
    tag: 'GOTS Organic',
  },
  {
    id: 'poly-viscose-suit',
    name: 'Poly-Viscose Suiting (65/35)',
    category: 'Suiting & Uniforms',
    gsmDefault: 240,
    gsmRange: [200, 320],
    basePriceInr: 340.0,
    defaultWidth: 58,
    weaveTypes: ['Plain Weave', 'Micro Houndstooth', 'Herringbone'],
    description: 'High-drape anti-wrinkle poly-viscose blend designed for institutional uniforms and corporate formal suiting.',
    tag: 'Corporate Spec',
  },
  {
    id: 'combed-cotton-jersey',
    name: 'Combed Cotton Single Jersey',
    category: 'Knits & Essentials',
    gsmDefault: 180,
    gsmRange: [140, 220],
    basePriceInr: 220.0,
    defaultWidth: 60,
    weaveTypes: ['Single Jersey', 'Interlock Knit', '1x1 Rib'],
    description: 'Compact-spun ringspun combed cotton with super-soft bio-polishing for export t-shirts and luxury innerwear.',
    tag: 'Bio-Washed',
  },
  {
    id: 'indigo-denim',
    name: 'Ring-Spun Indigo Denim',
    category: 'Heavy Denim',
    gsmDefault: 380,
    gsmRange: [300, 460],
    basePriceInr: 410.0,
    defaultWidth: 56,
    weaveTypes: ['3/1 Right Hand Twill', 'Cross Hatch Denim', 'Selvedge'],
    description: 'Heavyweight rope-dyed pure indigo warp denim for high-abrasion jeanswear, jackets, and utility apparel.',
    tag: 'Rope-Dyed',
  },
  {
    id: 'linen-cotton-blend',
    name: 'Linen-Cotton Slub Canvas',
    category: 'Resort & Home Textile',
    gsmDefault: 195,
    gsmRange: [160, 260],
    basePriceInr: 395.0,
    defaultWidth: 54,
    weaveTypes: ['Plain Linen Weave', 'Panama Basket Weave'],
    description: 'Breathable French flax and long-staple Indian cotton blend offering signature natural slub texture and cooling.',
    tag: 'Natural Flax',
  },
  {
    id: 'cordura-ripstop',
    name: 'Industrial Ripstop Canvas',
    category: 'Technical & Heavy Duty',
    gsmDefault: 320,
    gsmRange: [260, 420],
    basePriceInr: 490.0,
    defaultWidth: 58,
    weaveTypes: ['Ripstop Grid 5x5', 'Dobby Reinforcement'],
    description: 'High-tenacity nylon-cotton ripstop with fluorocarbon water-repellent finish for tactical military and heavy workwear.',
    tag: 'Mil-Spec DWR',
  },
];

const STANDARD_COLORS = [
  { name: 'Raw Greige (Unbleached)', hex: '#D8D2C5', pantone: '11-0601 TCX' },
  { name: 'Bleached Optic White', hex: '#FFFFFF', pantone: '11-0602 TCX' },
  { name: 'Everest Ink Black', hex: '#111111', pantone: '19-4008 TCX' },
  { name: 'Deep Royal Navy', hex: '#002B49', pantone: '19-3921 TCX' },
  { name: 'Industrial Slate Grey', hex: '#53565A', pantone: '18-4005 TCX' },
  { name: 'Forest Olive Drab', hex: '#4B5320', pantone: '18-0527 TCX' },
  { name: 'Desert Khaki Camel', hex: '#C19A6B', pantone: '16-1326 TCX' },
  { name: 'Vermilion Red', hex: '#F04424', pantone: '18-1662 TCX' },
];

const VOLUME_TIERS = [
  { minMeters: 500, discountPct: 0, label: 'Pilot Batch (< 1,500m)' },
  { minMeters: 1500, discountPct: 5, label: 'Standard Run (1,500m+)' },
  { minMeters: 3000, discountPct: 9, label: 'Commercial Lot (3,000m+)' },
  { minMeters: 5000, discountPct: 14, label: 'Bulk Mill Contract (5,000m+)' },
];

export const OrderPlacementApp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useApp();

  const [step, setStep] = useState<number>(1);
  const [selectedFabric, setSelectedFabric] = useState<FabricOption>(FABRIC_CATALOG[0]);
  const [gsm, setGsm] = useState<number>(FABRIC_CATALOG[0].gsmDefault);
  const [selectedWeave, setSelectedWeave] = useState<string>(FABRIC_CATALOG[0].weaveTypes[0]);
  const [colorName, setColorName] = useState<string>(STANDARD_COLORS[2].name);
  const [colorHex, setColorHex] = useState<string>(STANDARD_COLORS[2].hex);
  const [pantoneRef, setPantoneRef] = useState<string>(STANDARD_COLORS[2].pantone);
  const [meters, setMeters] = useState<number>(1500);
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [specialFinishes, setSpecialFinishes] = useState<string[]>(['Sanforized Preshrunk']);

  // Step 2: Buyer Details
  const [buyerName, setBuyerName] = useState<string>('Sarah Jenkins');
  const [companyName, setCompanyName] = useState<string>('Nordic Apparel Co.');
  const [buyerEmail, setBuyerEmail] = useState<string>('procurement@nordicapparel.com');
  const [buyerPhone, setBuyerPhone] = useState<string>('+45 32 88 41 90');
  const [shippingAddress, setShippingAddress] = useState<string>(
    'Harbor Hub Warehouse 4B, 2150 Nordhavn, Copenhagen, Denmark'
  );
  const [targetDeliveryDate, setTargetDeliveryDate] = useState<string>(
    new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState<string>('');

  // Step 3 / 4 state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string | null>(null);

  const selectFabric = (fab: FabricOption) => {
    setSelectedFabric(fab);
    setGsm(fab.gsmDefault);
    setSelectedWeave(fab.weaveTypes[0]);
  };

  const currentTier = useMemo(() => {
    const sorted = [...VOLUME_TIERS].sort((a, b) => b.minMeters - a.minMeters);
    return sorted.find((t) => meters >= t.minMeters) || VOLUME_TIERS[0];
  }, [meters]);

  const priceCalc = useMemo(() => {
    const base = selectedFabric.basePriceInr;
    const gsmDiff = gsm - selectedFabric.gsmDefault;
    const gsmMultiplier = 1 + (gsmDiff / selectedFabric.gsmDefault) * 0.35;
    const priorityMultiplier = priority === 'urgent' ? 1.15 : priority === 'high' ? 1.08 : 1.0;
    const finishCostPerMtr = specialFinishes.length * 12.0;

    const unitBase = base * gsmMultiplier * priorityMultiplier + finishCostPerMtr;
    const discountAmount = unitBase * (currentTier.discountPct / 100);
    const netUnitRate = Math.round((unitBase - discountAmount) * 100) / 100;
    const subtotal = Math.round(netUnitRate * meters);
    const gstRate = 0.05; // 5% GST for Indian Textile
    const gstAmount = Math.round(subtotal * gstRate);
    const totalAmount = subtotal + gstAmount;

    const estimatedYarnKg = Math.round((meters * selectedFabric.defaultWidth * 0.0254 * (gsm / 1000) * 1.06) * 10) / 10;
    const estimatedLeadDays = priority === 'urgent' ? 12 : priority === 'high' ? 16 : 21;

    return {
      netUnitRate,
      subtotal,
      gstAmount,
      totalAmount,
      estimatedYarnKg,
      estimatedLeadDays,
      discountPct: currentTier.discountPct,
    };
  }, [selectedFabric, gsm, priority, specialFinishes, meters, currentTier]);

  const toggleFinish = (finish: string) => {
    setSpecialFinishes((prev) =>
      prev.includes(finish) ? prev.filter((f) => f !== finish) : [...prev, finish]
    );
  };

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    try {
      const payload: PortalOrderPayload = {
        buyer_name: buyerName,
        company_name: companyName,
        buyer_email: buyerEmail,
        buyer_phone: buyerPhone,
        shipping_address: shippingAddress,
        fabric_type: selectedFabric.name,
        weave_type: selectedWeave,
        color_name: colorName,
        color_hex: colorHex,
        pantone_ref: pantoneRef,
        gsm: gsm,
        width_inches: selectedFabric.defaultWidth,
        quantity_meters: meters,
        priority: priority,
        target_delivery_date: targetDeliveryDate,
        special_finishes: specialFinishes,
        unit_price_inr: priceCalc.netUnitRate,
        notes: notes,
      };

      const result = await ordersService.createPortalOrder(payload);
      setCreatedOrderNumber(result.order_number);
      setStep(4);
      addToast({
        type: 'success',
        title: 'B2B Order Synced to Everest OS',
        message: `Order #${result.order_number} has entered Yarn Feasibility Queue & Loom Scheduling.`,
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Order Placement Error',
        message: err.message || 'Failed to submit order. Please check inputs and retry.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-sans pb-16">

      {/* ─── Top Industrial Header ─────────────────────────────────────── */}
      <div className="bg-[var(--color-ink)] text-white px-6 py-5 editorial-border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--color-vermilion)] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-widest uppercase font-mono text-white">
                B2B ORDER PLACEMENT STUDIO
              </h1>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-[var(--color-vermilion)] text-white font-bold">
                LIVE MILL SYNC
              </span>
            </div>
            <p className="text-[10px] font-mono text-white/50 tracking-wider uppercase mt-0.5">
              Everest Textile Mills · Direct Loom Capacity Reservation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/orders"
            className="px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase border border-white/20 text-white/70 hover:text-white hover:border-white transition-colors"
          >
            ← Operations Orders
          </Link>
          <Link
            to="/buyer/orders"
            className="px-3 py-1.5 text-[10px] font-mono tracking-widest uppercase bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-[var(--color-vermilion)]" />
            Buyer Portal
          </Link>
        </div>
      </div>

      {/* ─── Step Indicator (Editorial 4-Tile Grid) ────────────────────── */}
      <div className="grid grid-cols-4 gap-px bg-[var(--color-light-border)] editorial-border-b text-xs font-mono">
        {[
          { num: 1, label: '01 / FABRIC & SPEC' },
          { num: 2, label: '02 / BUYER & LOGISTICS' },
          { num: 3, label: '03 / AUDIT & CONFIRM' },
          { num: 4, label: '04 / DISPATCH ACK' },
        ].map((s) => {
          const isActive = step === s.num;
          const isDone = step > s.num;
          return (
            <div
              key={s.num}
              onClick={() => step < 4 && s.num < step && setStep(s.num)}
              className={clsx(
                'p-3 flex items-center justify-between select-none transition-colors',
                isActive
                  ? 'bg-[var(--color-ink)] text-white border-b-2 border-[var(--color-vermilion)] font-bold'
                  : isDone
                  ? 'bg-white text-[var(--color-ink)] cursor-pointer hover:bg-[var(--color-paper)]'
                  : 'bg-white/60 text-[var(--color-muted-text)] cursor-not-allowed'
              )}
            >
              <span className="tracking-widest uppercase">{s.label}</span>
              {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success-green)] shrink-0" />}
            </div>
          );
        })}
      </div>

      {/* ─── Main Content Layout ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {step < 4 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Column: Form Content */}
            <div className="lg:col-span-8 space-y-6">

              {/* ──────────────── STEP 1: FABRIC CONFIG ──────────────── */}
              {step === 1 && (
                <div className="space-y-6">

                  {/* Section: Fabric Selection */}
                  <div className="bg-white editorial-border">
                    <div className="p-4 bg-[var(--color-paper)] editorial-border-b flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--color-muted-text)]">
                        FABRIC BASE CATALOG
                      </span>
                      <span className="text-[10px] font-mono text-[var(--color-vermilion)] font-bold">
                        6 MILL CERTIFIED BASES
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-light-border)]">
                      {FABRIC_CATALOG.map((fab) => {
                        const isSelected = selectedFabric.id === fab.id;
                        return (
                          <div
                            key={fab.id}
                            onClick={() => selectFabric(fab)}
                            className={clsx(
                              'p-4 cursor-pointer transition-colors text-left select-none',
                              isSelected
                                ? 'bg-[var(--color-ink)] text-white'
                                : 'bg-white hover:bg-[var(--color-paper)] text-[var(--color-ink)]'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div>
                                <span
                                  className={clsx(
                                    'text-[8px] font-mono uppercase px-1.5 py-0.5 tracking-wider font-bold',
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-[var(--color-ink)] text-white'
                                  )}
                                >
                                  {fab.tag}
                                </span>
                                <h3 className="text-xs font-bold font-mono uppercase mt-1">
                                  {fab.name}
                                </h3>
                              </div>
                              <span
                                className={clsx(
                                  'text-xs font-mono font-bold shrink-0',
                                  isSelected ? 'text-[var(--color-vermilion)]' : 'text-[var(--color-ink)]'
                                )}
                              >
                                ₹{fab.basePriceInr}/m
                              </span>
                            </div>
                            <p
                              className={clsx(
                                'text-[11px] leading-relaxed mb-3 line-clamp-2',
                                isSelected ? 'text-white/60' : 'text-[var(--color-muted-text)]'
                              )}
                            >
                              {fab.description}
                            </p>
                            <div
                              className={clsx(
                                'text-[9px] font-mono tracking-wider pt-2 border-t flex justify-between',
                                isSelected ? 'border-white/10 text-white/40' : 'border-[var(--color-light-border)] text-[var(--color-muted-text)]'
                              )}
                            >
                              <span>GSM: {fab.gsmDefault}</span>
                              <span>WIDTH: {fab.defaultWidth}"</span>
                              <span>WEAVES: {fab.weaveTypes.length}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section: Weight (GSM) & Weave Pattern */}
                  <div className="bg-white editorial-border p-5 space-y-5">
                    <div className="flex items-center justify-between pb-3 editorial-border-b">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--color-muted-text)]">
                        FABRIC WEIGHT (GSM) & WEAVE SPECIFICATION
                      </span>
                      <span className="text-xs font-mono font-bold text-[var(--color-ink)]">
                        CURRENT: {gsm} GSM · {selectedWeave}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* GSM Slider */}
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-2">
                          <label className="font-bold uppercase tracking-wider text-[10px]">
                            GSM Density Target
                          </label>
                          <span className="font-bold text-[var(--color-vermilion)]">{gsm} g/m²</span>
                        </div>
                        <input
                          type="range"
                          min={selectedFabric.gsmRange[0]}
                          max={selectedFabric.gsmRange[1]}
                          step={5}
                          value={gsm}
                          onChange={(e) => setGsm(Number(e.target.value))}
                          className="w-full accent-[var(--color-vermilion)] cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] font-mono text-[var(--color-muted-text)] mt-1">
                          <span>Min: {selectedFabric.gsmRange[0]} GSM</span>
                          <span>Default: {selectedFabric.gsmDefault} GSM</span>
                          <span>Max: {selectedFabric.gsmRange[1]} GSM</span>
                        </div>
                      </div>

                      {/* Weave Type */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                          Loom Weave Construction
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                          {selectedFabric.weaveTypes.map((weave) => (
                            <button
                              key={weave}
                              type="button"
                              onClick={() => setSelectedWeave(weave)}
                              className={clsx(
                                'px-3 py-2 text-xs font-mono text-left transition-colors flex items-center justify-between',
                                selectedWeave === weave
                                  ? 'bg-[var(--color-ink)] text-white font-bold'
                                  : 'bg-[var(--color-paper)] hover:bg-black/5 text-[var(--color-ink)] editorial-border'
                              )}
                            >
                              <span>{weave}</span>
                              {selectedWeave === weave && <Check className="w-3.5 h-3.5 text-[var(--color-vermilion)]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Color & Dyeing */}
                  <div className="bg-white editorial-border p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 editorial-border-b">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--color-muted-text)]">
                        SHADE & DYEING SPECIFICATION
                      </span>
                      <span className="text-xs font-mono font-bold">
                        {colorName} ({pantoneRef})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {STANDARD_COLORS.map((col) => {
                        const isChosen = colorName === col.name;
                        return (
                          <div
                            key={col.name}
                            onClick={() => {
                              setColorName(col.name);
                              setColorHex(col.hex);
                              setPantoneRef(col.pantone);
                            }}
                            className={clsx(
                              'p-2.5 cursor-pointer editorial-border flex items-center gap-2.5 select-none transition-colors',
                              isChosen
                                ? 'bg-[var(--color-ink)] text-white'
                                : 'bg-white hover:bg-[var(--color-paper)] text-[var(--color-ink)]'
                            )}
                          >
                            <div
                              className="w-5 h-5 shrink-0 border border-black/20"
                              style={{ backgroundColor: col.hex }}
                            />
                            <div className="min-w-0">
                              <p className="text-[10px] font-mono font-bold truncate leading-tight">
                                {col.name.split(' ')[0]}
                              </p>
                              <p
                                className={clsx(
                                  'text-[8px] font-mono truncate',
                                  isChosen ? 'text-white/50' : 'text-[var(--color-muted-text)]'
                                )}
                              >
                                {col.pantone}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section: Meters & Volume Discount */}
                  <div className="bg-white editorial-border p-5 space-y-5">
                    <div className="flex items-center justify-between pb-3 editorial-border-b">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--color-muted-text)]">
                        ORDER QUANTITY & TIER PRICING
                      </span>
                      <span className="text-xs font-mono font-bold text-[var(--color-vermilion)]">
                        {currentTier.discountPct > 0
                          ? `${currentTier.discountPct}% VOLUME DISCOUNT ACTIVE`
                          : 'PILOT BATCH RATE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                          Meters Required (Min 500m)
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min={500}
                            step={100}
                            value={meters}
                            onChange={(e) => setMeters(Math.max(500, Number(e.target.value)))}
                            className="w-full px-3 py-2.5 text-base font-mono font-bold bg-white editorial-border outline-none focus:border-[var(--color-ink)]"
                          />
                          <span className="px-3 py-2.5 bg-[var(--color-ink)] text-white text-xs font-mono font-bold uppercase shrink-0">
                            METERS
                          </span>
                        </div>
                      </div>

                      {/* Priority selector */}
                      <div>
                        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                          Production Priority Queue
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { id: 'medium', label: 'STANDARD', note: '21 Days' },
                            { id: 'high', label: 'PRIORITY', note: '16 Days (+8%)' },
                            { id: 'urgent', label: 'CRITICAL', note: '12 Days (+15%)' },
                          ].map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setPriority(p.id as PriorityLevel)}
                              className={clsx(
                                'p-2 text-center transition-colors',
                                priority === p.id
                                  ? 'bg-[var(--color-vermilion)] text-white font-bold'
                                  : 'bg-[var(--color-paper)] hover:bg-black/5 text-[var(--color-ink)] editorial-border'
                              )}
                            >
                              <div className="text-[10px] font-mono">{p.label}</div>
                              <div className="text-[8px] font-mono opacity-80 mt-0.5">{p.note}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Special Finishes Checkboxes */}
                    <div className="pt-3 border-t border-[var(--color-light-border)]">
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                        Technical Finishes (+₹12/m each)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Sanforized Preshrunk',
                          'Bio-Enzyme Polishing',
                          'Water-Repellent DWR',
                          'Anti-Microbial Silver',
                          'Flame-Retardant FR',
                        ].map((finish) => {
                          const hasIt = specialFinishes.includes(finish);
                          return (
                            <button
                              key={finish}
                              type="button"
                              onClick={() => toggleFinish(finish)}
                              className={clsx(
                                'px-3 py-1.5 text-xs font-mono tracking-wider transition-colors select-none',
                                hasIt
                                  ? 'bg-[var(--color-ink)] text-white font-bold'
                                  : 'bg-[var(--color-paper)] text-[var(--color-ink)] editorial-border hover:bg-black/5'
                              )}
                            >
                              {hasIt ? '✓ ' : '+ '} {finish}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Step 1 Continue button */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-6 py-3.5 bg-[var(--color-ink)] hover:bg-[var(--color-vermilion)] text-white text-xs font-mono font-bold tracking-widest uppercase transition-colors flex items-center gap-2"
                    >
                      <span>Proceed to Buyer & Delivery</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ──────────────── STEP 2: BUYER & DELIVERY ────────────── */}
              {step === 2 && (
                <div className="bg-white editorial-border p-6 space-y-6">
                  <div className="flex items-center justify-between pb-3 editorial-border-b">
                    <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--color-muted-text)]">
                      BUYER ENTITY & LOGISTICS DESTINATION
                    </span>
                    <span className="text-xs font-mono font-bold text-[var(--color-vermilion)]">
                      STAGE 02 / 03
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                        Buyer Representative Name *
                      </label>
                      <input
                        type="text"
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-paper)] editorial-border text-xs font-mono outline-none focus:border-[var(--color-ink)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                        Company / Purchasing Entity *
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-paper)] editorial-border text-xs font-mono outline-none focus:border-[var(--color-ink)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                        Official Procurement Email *
                      </label>
                      <input
                        type="email"
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-paper)] editorial-border text-xs font-mono outline-none focus:border-[var(--color-ink)]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                        Phone / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-paper)] editorial-border text-xs font-mono outline-none focus:border-[var(--color-ink)]"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                      Warehouse Delivery Address / Port *
                    </label>
                    <textarea
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--color-paper)] editorial-border text-xs font-mono outline-none focus:border-[var(--color-ink)] resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                        Target Delivery Date (SLA)
                      </label>
                      <input
                        type="date"
                        value={targetDeliveryDate}
                        onChange={(e) => setTargetDeliveryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-paper)] editorial-border text-xs font-mono outline-none focus:border-[var(--color-ink)]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                        Special Packaging / Labelling Instructions
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Export vacuum-seal, double polybag, barcode stickers"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-paper)] editorial-border text-xs font-mono outline-none focus:border-[var(--color-ink)]"
                      />
                    </div>
                  </div>

                  {/* Nav buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-[var(--color-light-border)]">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 text-xs font-mono tracking-widest uppercase bg-[var(--color-paper)] editorial-border hover:bg-black/5 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back to Specs
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-3 bg-[var(--color-ink)] hover:bg-[var(--color-vermilion)] text-white text-xs font-mono font-bold tracking-widest uppercase transition-colors flex items-center gap-2"
                    >
                      <span>Review Final Mill Quote</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ──────────────── STEP 3: REVIEW & CONFIRM ───────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="bg-white editorial-border p-6 space-y-6">
                    <div className="flex items-center justify-between pb-3 editorial-border-b">
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--color-muted-text)]">
                        COMMERCIAL ORDER CONTRACT SPECIFICATION
                      </span>
                      <span className="text-xs font-mono font-bold text-[var(--color-vermilion)]">
                        READY FOR TRANSMISSION
                      </span>
                    </div>

                    {/* 2x2 recap grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[var(--color-light-border)] text-xs font-mono">
                      <div className="bg-white p-4 space-y-2">
                        <div className="text-[9px] font-bold text-[var(--color-muted-text)] uppercase">
                          FABRIC & FINISH
                        </div>
                        <div className="font-bold text-sm">{selectedFabric.name}</div>
                        <div className="text-[11px] text-[var(--color-muted-text)]">
                          {gsm} GSM · {selectedWeave} · {selectedFabric.defaultWidth}" Width
                        </div>
                        <div className="text-[11px] text-[var(--color-vermilion)] font-bold">
                          {colorName} ({pantoneRef})
                        </div>
                        <div className="text-[10px] pt-1">
                          Finishes: {specialFinishes.join(', ') || 'Standard Sanforized'}
                        </div>
                      </div>

                      <div className="bg-white p-4 space-y-2">
                        <div className="text-[9px] font-bold text-[var(--color-muted-text)] uppercase">
                          BUYER & DESTINATION
                        </div>
                        <div className="font-bold text-sm">{companyName}</div>
                        <div className="text-[11px] text-[var(--color-muted-text)]">
                          Contact: {buyerName} · {buyerPhone}
                        </div>
                        <div className="text-[11px] text-[var(--color-muted-text)] truncate">
                          {buyerEmail}
                        </div>
                        <div className="text-[10px] pt-1 line-clamp-2">
                          Address: {shippingAddress}
                        </div>
                      </div>

                      <div className="bg-white p-4 space-y-2">
                        <div className="text-[9px] font-bold text-[var(--color-muted-text)] uppercase">
                          BATCH VOLUME & YARN DEMAND
                        </div>
                        <div className="text-lg font-black">{meters.toLocaleString()} METERS</div>
                        <div className="text-[11px] text-[var(--color-muted-text)]">
                          Estimated Raw Yarn Needed: <strong>{priceCalc.estimatedYarnKg} kg</strong>
                        </div>
                        <div className="text-[11px] text-[var(--color-muted-text)]">
                          Lead Time SLA: <strong>{priceCalc.estimatedLeadDays} Days</strong>
                        </div>
                      </div>

                      <div className="bg-white p-4 space-y-2">
                        <div className="text-[9px] font-bold text-[var(--color-muted-text)] uppercase">
                          COMMERCIAL VALUE (INR)
                        </div>
                        <div className="text-lg font-black text-[var(--color-vermilion)]">
                          ₹{priceCalc.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[var(--color-muted-text)]">
                          Net Rate: ₹{priceCalc.netUnitRate}/m (incl. {priceCalc.discountPct}% volume discount)
                        </div>
                        <div className="text-[10px] text-[var(--color-muted-text)]">
                          GST 5%: ₹{priceCalc.gstAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Final Action buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--color-light-border)]">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 text-xs font-mono tracking-widest uppercase bg-[var(--color-paper)] editorial-border hover:bg-black/5 flex items-center gap-1.5"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Modify Info
                      </button>

                      <button
                        type="button"
                        onClick={handleCreateOrder}
                        disabled={isSubmitting}
                        className={clsx(
                          'px-8 py-4 bg-[var(--color-vermilion)] hover:bg-[var(--color-ink)] text-white text-xs font-mono font-black tracking-widest uppercase transition-all shadow-lg flex items-center gap-2',
                          isSubmitting && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            <span>TRANSMITTING TO MILL OS...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>AUTHORIZE & DISPATCH TO MILL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Right Column: Sticky Live Commercial Quote Panel */}
            <div className="lg:col-span-4">
              <div className="sticky top-20 bg-white editorial-border">
                <div className="p-4 bg-[var(--color-ink)] text-white flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase">
                    LIVE COMMERCIAL QUOTE
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[var(--color-vermilion)] text-white font-bold">
                    ₹ INR
                  </span>
                </div>

                <div className="p-5 space-y-4 text-xs font-mono">
                  <div className="flex justify-between pb-2 border-b border-[var(--color-light-border)]">
                    <span className="text-[var(--color-muted-text)]">Base Fabric Rate</span>
                    <span className="font-bold">₹{selectedFabric.basePriceInr.toFixed(2)}/m</span>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-[var(--color-light-border)]">
                    <span className="text-[var(--color-muted-text)]">GSM & Weave Adjustment</span>
                    <span className="font-bold">
                      {gsm !== selectedFabric.gsmDefault ? `${gsm - selectedFabric.gsmDefault > 0 ? '+' : ''}${gsm - selectedFabric.gsmDefault} GSM` : 'Nominal'}
                    </span>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-[var(--color-light-border)]">
                    <span className="text-[var(--color-muted-text)]">Finishes ({specialFinishes.length})</span>
                    <span className="font-bold">+₹{(specialFinishes.length * 12).toFixed(2)}/m</span>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-[var(--color-light-border)]">
                    <span className="text-[var(--color-muted-text)]">Volume Discount</span>
                    <span className="font-bold text-[var(--color-vermilion)]">
                      -{priceCalc.discountPct}%
                    </span>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-[var(--color-light-border)]">
                    <span className="text-[var(--color-muted-text)]">Net Unit Price</span>
                    <span className="font-bold text-sm">₹{priceCalc.netUnitRate.toFixed(2)}/m</span>
                  </div>

                  <div className="flex justify-between pb-2 border-b border-[var(--color-light-border)]">
                    <span className="text-[var(--color-muted-text)]">Batch Meterage</span>
                    <span className="font-bold">{meters.toLocaleString()} m</span>
                  </div>

                  {/* Subtotal & GST */}
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between text-[var(--color-muted-text)]">
                      <span>Subtotal</span>
                      <span>₹{priceCalc.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[var(--color-muted-text)]">
                      <span>Textile GST (5%)</span>
                      <span>₹{priceCalc.gstAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t-2 border-[var(--color-ink)] text-sm font-black">
                      <span>TOTAL PAYABLE</span>
                      <span className="text-[var(--color-vermilion)]">
                        ₹{priceCalc.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Mill Telemetry badges */}
                  <div className="p-3 bg-[var(--color-paper)] editorial-border text-[10px] space-y-1.5 mt-4">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--color-ink)]">
                      <Cpu className="w-3.5 h-3.5 text-[var(--color-vermilion)]" />
                      <span>EVEREST MILL TELEMETRY</span>
                    </div>
                    <p className="text-[var(--color-muted-text)] leading-tight">
                      Yarn Feasibility: Auto-checked against 850kg raw warehouse lot stock.
                    </p>
                    <div className="flex justify-between text-[9px] pt-1 border-t border-[var(--color-light-border)] font-bold">
                      <span>EST. LEAD: {priceCalc.estimatedLeadDays} DAYS</span>
                      <span>FPY TARGET: 96.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ──────────────── STEP 4: ORDER CONFIRMED ───────────────── */
          <div className="max-w-2xl mx-auto bg-white editorial-border p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-[var(--color-ink)] text-[var(--color-vermilion)] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-[var(--color-vermilion)] mb-1">
                CONTRACT TRANSMISSION SUCCESSFUL
              </div>
              <h2 className="text-2xl font-black font-mono uppercase text-[var(--color-ink)]">
                ORDER #{createdOrderNumber || 'EVR-ORD-2026'}
              </h2>
              <p className="text-xs font-mono text-[var(--color-muted-text)] mt-2 max-w-md mx-auto">
                Your order has been ingested into the Everest Textile OS database. Automatic yarn reservation and loom allocation are now active.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--color-light-border)] text-left text-xs font-mono">
              <div className="bg-[var(--color-paper)] p-3">
                <span className="text-[8px] font-bold text-[var(--color-muted-text)] block">FABRIC</span>
                <span className="font-bold truncate block">{selectedFabric.name}</span>
              </div>
              <div className="bg-[var(--color-paper)] p-3">
                <span className="text-[8px] font-bold text-[var(--color-muted-text)] block">METERS</span>
                <span className="font-bold block">{meters.toLocaleString()} m</span>
              </div>
              <div className="bg-[var(--color-paper)] p-3">
                <span className="text-[8px] font-bold text-[var(--color-muted-text)] block">STATUS</span>
                <span className="font-bold text-[var(--color-vermilion)] block">PENDING_YARN</span>
              </div>
              <div className="bg-[var(--color-paper)] p-3">
                <span className="text-[8px] font-bold text-[var(--color-muted-text)] block">TARGET SLA</span>
                <span className="font-bold block">{targetDeliveryDate}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/orders"
                className="w-full sm:w-auto px-6 py-3 bg-[var(--color-ink)] text-white text-xs font-mono font-bold tracking-widest uppercase hover:bg-[var(--color-vermilion)] transition-colors"
              >
                Track in Customer Orders Console →
              </Link>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setCreatedOrderNumber(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[var(--color-paper)] editorial-border text-xs font-mono font-bold tracking-widest uppercase hover:bg-black/5"
              >
                Configure Another Order
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default OrderPlacementApp;
