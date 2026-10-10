import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  Layers,
  FileText,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Flame,
  Percent,
  Cpu,
} from 'lucide-react';
import { Button } from '../components/common/Button';
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
  tagColor: string;
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
    tagColor: 'emerald',
  },
  {
    id: 'cotton-poplin',
    name: 'Cotton Poplin Shirting',
    category: 'Lightweight Woven',
    gsmDefault: 120,
    gsmRange: [90, 150],
    basePriceInr: 220.0,
    defaultWidth: 58,
    weaveTypes: ['Plain 1/1 Weave', 'High-Density Poplin'],
    description: 'Crisp, smooth luxury shirting fabric woven with 50s/60s combed compact yarn.',
    tag: 'Best Seller',
    tagColor: 'teal',
  },
  {
    id: 'poly-viscose-stretch',
    name: 'Poly-Viscose Stretch Twill',
    category: 'Performance Suiting',
    gsmDefault: 240,
    gsmRange: [200, 300],
    basePriceInr: 340.0,
    defaultWidth: 60,
    weaveTypes: ['2/2 Twill with Lycra', 'Satin Backed Twill'],
    description: 'Bi-stretch wrinkle-resistant formal suiting fabric engineered for comfort blazers and trousers.',
    tag: 'Stretch Tech',
    tagColor: 'blue',
  },
  {
    id: 'cotton-sateen-300tc',
    name: 'Cotton Sateen 300TC',
    category: 'Luxury Apparel & Linen',
    gsmDefault: 180,
    gsmRange: [140, 220],
    basePriceInr: 390.0,
    defaultWidth: 60,
    weaveTypes: ['4/1 Sateen', 'Stripe Satin Weave'],
    description: 'Ultra-soft silky sateen with natural luster for high-end boutique shirts and hospitality linen.',
    tag: 'Ultra Soft',
    tagColor: 'purple',
  },
  {
    id: 'bamboo-french-terry',
    name: 'Bamboo French Terry Knit',
    category: 'Luxury Knitwear',
    gsmDefault: 320,
    gsmRange: [260, 380],
    basePriceInr: 450.0,
    defaultWidth: 64,
    weaveTypes: ['Loopback Terry Knit', 'Brushed Fleece'],
    description: 'Breathable, antibacterial bamboo-cotton blend for premium hoodies and heavyweight loungewear.',
    tag: 'Eco-Luxury',
    tagColor: 'indigo',
  },
  {
    id: 'recycled-ripstop',
    name: 'Recycled Micro-Ripstop',
    category: 'Technical Outdoor',
    gsmDefault: 90,
    gsmRange: [70, 130],
    basePriceInr: 310.0,
    defaultWidth: 58,
    weaveTypes: ['Reinforced Cross-Grid Ripstop', 'Mini-Grid Weave'],
    description: 'Ultralight water-repellent recycled polyester fabric for packable outdoor windbreakers and accessories.',
    tag: 'Recycled Tech',
    tagColor: 'amber',
  },
];

const COLOR_PALETTE = [
  { name: 'Nordic Navy', hex: '#1B2A4A', pantone: 'PANTONE 19-4024 TCX' },
  { name: 'Optical White', hex: '#F8F9FA', pantone: 'PANTONE 11-0601 TCX' },
  { name: 'Charcoal Mist', hex: '#2E3440', pantone: 'PANTONE 19-3908 TCX' },
  { name: 'Sage Olive', hex: '#4A5D4E', pantone: 'PANTONE 18-0422 TCX' },
  { name: 'Terracotta Clay', hex: '#B7410E', pantone: 'PANTONE 18-1440 TCX' },
  { name: 'Deep Indigo', hex: '#1A237E', pantone: 'PANTONE 19-3950 TCX' },
  { name: 'Royal Emerald', hex: '#0B6623', pantone: 'PANTONE 18-5642 TCX' },
  { name: 'Sand Beige', hex: '#D2B48C', pantone: 'PANTONE 14-1118 TCX' },
];

const FINISH_OPTIONS = [
  { id: 'standard', name: 'Standard Bio-Wash & Calendering', surcharge: 0 },
  { id: 'enzyme-silicone', name: 'Enzyme Softener + Peach Skin Finish', surcharge: 15 },
  { id: 'water-repellent', name: 'PFC-Free DWR Water Repellent', surcharge: 28 },
  { id: 'antimicrobial', name: 'Silver-Ion Antimicrobial & Anti-Odor', surcharge: 22 },
  { id: 'flame-retardant', name: 'Eco-Flame Retardant Coating', surcharge: 35 },
];

const PRESET_BUYERS = [
  {
    company: 'Nordic Apparel Corp',
    name: 'Sarah Jenkins',
    email: 'sarah.j@nordicapparel.com',
    phone: '+46 8 123 4567',
    destination: 'Port of Gothenburg, Sweden',
    po: 'PO-NOR-2026-991',
  },
  {
    company: 'Patagonia Outdoor Gear',
    name: 'Marcus Vance',
    email: 'marcus.v@patagonia-sourcing.com',
    phone: '+1 415 555 0192',
    destination: 'Port of Los Angeles, USA',
    po: 'PO-PAT-8819',
  },
  {
    company: 'Apex Textiles & Retail',
    name: 'Rahul Singhania',
    email: 'rahul.s@apextextiles.in',
    phone: '+91 98200 44122',
    destination: 'JNPT Nhava Sheva, Mumbai',
    po: 'PO-APEX-4412',
  },
];

export const OrderPlacementApp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast, notifyNewOrder } = useApp();

  const isStandalone = searchParams.get('standalone') === 'true';

  // Wizard Step: 1 = Fabric & Specs, 2 = Quantity & Schedule, 3 = Buyer Details, 4 = Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedFabric, setSelectedFabric] = useState<FabricOption>(FABRIC_CATALOG[0]);
  const [customGsm, setCustomGsm] = useState<number>(FABRIC_CATALOG[0].gsmDefault);
  const [widthInches, setWidthInches] = useState<number>(58);
  const [weaveType, setWeaveType] = useState<string>(FABRIC_CATALOG[0].weaveTypes[0]);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [customColorHex, setCustomColorHex] = useState('');
  const [selectedFinish, setSelectedFinish] = useState(FINISH_OPTIONS[0]);

  // Volume & Logistics
  const [quantityMeters, setQuantityMeters] = useState<number>(5000);
  const [deliveryDate, setDeliveryDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 21);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<PriorityLevel>('standard');
  const [packagingPreference, setPackagingPreference] = useState('100m Export Rolls with Poly-Wrap');
  const [certifications, setCertifications] = useState<string[]>(['GOTS Organic', 'OEKO-TEX Standard 100']);

  // Buyer Info
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerPo, setBuyerPo] = useState('');
  const [destination, setDestination] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState('');

  // Submission State & Result
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderResult, setPlacedOrderResult] = useState<any>(null);

  // Live Price Calculation in INR
  const priceCalculations = useMemo(() => {
    const baseRate = selectedFabric.basePriceInr;
    const finishSurcharge = selectedFinish.surcharge;
    const prioritySurcharge = priority === 'urgent' ? 45 : priority === 'high' ? 25 : 0;

    const grossUnitRate = baseRate + finishSurcharge + prioritySurcharge;

    // Volume tier discount
    let discountPercent = 0;
    if (quantityMeters >= 30000) discountPercent = 15;
    else if (quantityMeters >= 15000) discountPercent = 10;
    else if (quantityMeters >= 5000) discountPercent = 5;

    const discountAmountPerMeter = (grossUnitRate * discountPercent) / 100;
    const netUnitRate = grossUnitRate - discountAmountPerMeter;

    const subtotal = netUnitRate * quantityMeters;
    const gstAmount = subtotal * 0.12; // 12% GST on technical textiles
    const grandTotal = subtotal + gstAmount;

    return {
      baseRate,
      finishSurcharge,
      prioritySurcharge,
      grossUnitRate,
      discountPercent,
      discountAmountPerMeter,
      netUnitRate: Math.round(netUnitRate * 100) / 100,
      subtotal: Math.round(subtotal),
      gstAmount: Math.round(gstAmount),
      grandTotal: Math.round(grandTotal),
    };
  }, [selectedFabric, selectedFinish, priority, quantityMeters]);

  const handleSelectFabric = (fabric: FabricOption) => {
    setSelectedFabric(fabric);
    setCustomGsm(fabric.gsmDefault);
    setWidthInches(fabric.defaultWidth);
    setWeaveType(fabric.weaveTypes[0]);
  };

  const handleApplyPresetBuyer = (preset: typeof PRESET_BUYERS[0]) => {
    setBuyerCompany(preset.company);
    setBuyerName(preset.name);
    setBuyerEmail(preset.email);
    setBuyerPhone(preset.phone);
    setDestination(preset.destination);
    setBuyerPo(preset.po);
  };

  const toggleCertification = (cert: string) => {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerCompany.trim() || !buyerName.trim() || !buyerEmail.trim()) {
      addToast({
        type: 'warning',
        title: 'Missing Required Buyer Details',
        message: 'Please provide Company Name, Contact Name, and Email to confirm your order.',
      });
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: PortalOrderPayload = {
        customerCompany: buyerCompany.trim(),
        customerName: buyerName.trim(),
        customerEmail: buyerEmail.trim(),
        customerPhone: buyerPhone.trim(),
        customerPo: buyerPo.trim() || `PO-DIR-${Math.floor(1000 + Math.random() * 9000)}`,
        deliveryDestination: destination.trim() || 'Factory Warehouse Port',
        fabricType: selectedFabric.name,
        gsm: customGsm,
        widthInches: widthInches,
        weaveType: weaveType,
        color: customColorHex ? `Custom (${customColorHex})` : selectedColor.name,
        pantoneCode: customColorHex ? `HEX-${customColorHex}` : selectedColor.pantone,
        finishType: selectedFinish.name,
        orderedQuantity: quantityMeters,
        unit: 'meters',
        requiredDeliveryDate: deliveryDate,
        priority: priority,
        packagingPreference: packagingPreference,
        certifications: certifications,
        unitPriceInr: priceCalculations.netUnitRate,
        totalAmountInr: priceCalculations.grandTotal,
        notes: technicalNotes,
      };

      const res = await ordersService.placePortalOrder(payload);

      setPlacedOrderResult(res.data);
      setCurrentStep(4);

      // Trigger instant real-time notifications in main app context
      notifyNewOrder(res.data);

      addToast({
        type: 'success',
        title: 'Order Placed & Live Synchronized!',
        message: `Order ${res.data.orderNumber} dispatched to Everest Textile OS factory floor.`,
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Failed to Place Order',
        message: err?.message || 'Server error communicating with backend.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewOrder = () => {
    setPlacedOrderResult(null);
    setCurrentStep(1);
    setQuantityMeters(5000);
    setBuyerPo('');
    setTechnicalNotes('');
  };

  return (
    <div className={clsx('space-y-6 max-w-7xl mx-auto', isStandalone && 'p-4 sm:p-8 min-h-screen bg-slate-950 text-slate-100')}>
      {/* App Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(20,184,166,0.25)]">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold font-display text-white tracking-tight">
                Everest B2B Order Placement Studio
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 animate-pulse">
                Live Mill Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure custom fabric batches, receive instant transparent quotes in ₹ (INR), and trigger live factory scheduling.
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {!isStandalone && (
            <a
              href="/place-order?standalone=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
              title="Open buyer app in a separate browser window to test cross-tab real-time sync"
            >
              <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
              <span>Open in Separate Tab</span>
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Factory Dashboard
          </Button>
        </div>
      </div>

      {/* Progress Steps Header */}
      {currentStep < 4 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { step: 1, label: '1. Fabric & Specifications', desc: 'Weave, GSM & Colorway' },
            { step: 2, label: '2. Volume & Delivery', desc: 'Meters, Packing & SLA' },
            { step: 3, label: '3. Buyer & Company', desc: 'Shipping, PO & Billing' },
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isCompleted = currentStep > s.step;

            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step)}
                className={clsx(
                  'p-3 sm:p-4 rounded-xl border text-left transition-all duration-200 relative overflow-hidden',
                  isActive
                    ? 'bg-slate-900 border-teal-500 shadow-md ring-1 ring-teal-500/30'
                    : isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/40 text-slate-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={clsx('text-xs font-bold font-display', isActive ? 'text-teal-400' : isCompleted ? 'text-emerald-400' : 'text-slate-400')}>
                    {s.label}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-1 hidden sm:block">{s.desc}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Form Content */}
      <form onSubmit={handleFormSubmit}>
        {/* STEP 1: Fabric Selection & Visual Specs */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Fabric Catalog Cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  Select Base Fabric Grade & Construction
                </h3>
                <span className="text-xs text-slate-400 font-mono">6 Mill-Certified Base Recipes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FABRIC_CATALOG.map((fabric) => {
                  const isSelected = selectedFabric.id === fabric.id;

                  return (
                    <div
                      key={fabric.id}
                      onClick={() => handleSelectFabric(fabric)}
                      className={clsx(
                        'p-5 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative flex flex-col justify-between group',
                        isSelected
                          ? 'bg-slate-900 border-teal-500 shadow-xl ring-2 ring-teal-500/30 -translate-y-0.5'
                          : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={clsx(
                            'text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border',
                            fabric.tagColor === 'emerald' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                            fabric.tagColor === 'teal' ? 'bg-teal-950 text-teal-300 border-teal-800' :
                            fabric.tagColor === 'blue' ? 'bg-blue-950 text-blue-300 border-blue-800' :
                            fabric.tagColor === 'purple' ? 'bg-purple-950 text-purple-300 border-purple-800' :
                            fabric.tagColor === 'indigo' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                            'bg-amber-950 text-amber-300 border-amber-800'
                          )}>
                            {fabric.tag}
                          </span>
                          <span className="text-xs font-mono font-bold text-teal-400">
                            ₹{fabric.basePriceInr}/m
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white font-display mt-1">
                          {fabric.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{fabric.category}</p>

                        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                          {fabric.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                        <span>Range: {fabric.gsmRange[0]}–{fabric.gsmRange[1]} GSM</span>
                        <span className="text-teal-400 font-semibold group-hover:underline">Select ›</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Technical Spec & Weave Configurator */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-md">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Cpu className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white font-display">
                  Custom Technical Parameters for {selectedFabric.name}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* GSM Slider */}
                <div>
                  <div className="flex justify-between items-center text-xs font-mono mb-2">
                    <label className="text-slate-300 font-semibold">Target GSM (Weight)</label>
                    <span className="text-teal-400 font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {customGsm} GSM
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedFabric.gsmRange[0]}
                    max={selectedFabric.gsmRange[1]}
                    value={customGsm}
                    onChange={(e) => setCustomGsm(Number(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                    <span>{selectedFabric.gsmRange[0]} (Light)</span>
                    <span>{selectedFabric.gsmRange[1]} (Heavy)</span>
                  </div>
                </div>

                {/* Width Selector */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold block mb-2">
                    Finished Fabric Width
                  </label>
                  <select
                    value={widthInches}
                    onChange={(e) => setWidthInches(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value={44}>44 inches (Standard Shirting)</option>
                    <option value={58}>58 inches (Export Apparel Standard)</option>
                    <option value={60}>60 inches (Suiting & Trousers)</option>
                    <option value={64}>64 inches (Wide Tubular / Linen)</option>
                  </select>
                </div>

                {/* Weave Pattern */}
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold block mb-2">
                    Loom Weave Construction
                  </label>
                  <select
                    value={weaveType}
                    onChange={(e) => setWeaveType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                  >
                    {selectedFabric.weaveTypes.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Colorway & Pantone Palette */}
              <div className="pt-4 border-t border-slate-800">
                <label className="text-xs font-mono text-slate-300 font-semibold block mb-3">
                  Colorway & Pantone Standard
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {COLOR_PALETTE.map((c) => {
                    const isColSelected = selectedColor.name === c.name && !customColorHex;

                    return (
                      <button
                        type="button"
                        key={c.name}
                        onClick={() => {
                          setSelectedColor(c);
                          setCustomColorHex('');
                        }}
                        className={clsx(
                          'p-3 rounded-xl border text-left flex flex-col items-center gap-2 transition-all',
                          isColSelected
                            ? 'bg-slate-950 border-teal-500 ring-2 ring-teal-500/40'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-full border border-slate-700 shadow-inner"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="text-center">
                          <span className="text-[11px] font-semibold text-white block leading-tight">
                            {c.name}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5 truncate max-w-[80px]">
                            {c.pantone.split(' ')[1]}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Specialty Chemistry & Finishes */}
              <div className="pt-4 border-t border-slate-800">
                <label className="text-xs font-mono text-slate-300 font-semibold block mb-3">
                  Specialty Wet Finishing & Chemical Treatment
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {FINISH_OPTIONS.map((finish) => {
                    const isSelected = selectedFinish.id === finish.id;

                    return (
                      <div
                        key={finish.id}
                        onClick={() => setSelectedFinish(finish)}
                        className={clsx(
                          'p-3.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all',
                          isSelected
                            ? 'bg-slate-950 border-teal-500 text-white font-medium'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-950'
                        )}
                      >
                        <span>{finish.name}</span>
                        <span className="font-mono text-teal-400 text-[11px]">
                          {finish.surcharge > 0 ? `+₹${finish.surcharge}/m` : 'Included'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={() => setCurrentStep(2)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Proceed to Volume & Delivery SLA
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Quantity, Timeline & Packaging */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Inputs */}
              <div className="lg:col-span-2 space-y-6">
                {/* Batch Quantity Configurator */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-teal-400" />
                      <h3 className="text-sm font-bold text-white font-display">
                        Batch Quantity & Mill Tier Discounts
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {priceCalculations.discountPercent > 0
                        ? `${priceCalculations.discountPercent}% Tier Discount Applied`
                        : 'Standard Volume'}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-300 font-semibold block mb-2">
                      Order Quantity (Meters)
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min={500}
                        max={100000}
                        step={500}
                        value={quantityMeters}
                        onChange={(e) => setQuantityMeters(Math.max(500, Number(e.target.value)))}
                        className="w-44 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-base font-mono font-bold text-white focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-xs text-slate-400">
                        ≈ {(quantityMeters / 100).toFixed(0)} Standard Export Fabric Rolls (100m/roll)
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[1000, 3000, 5000, 10000, 20000, 50000].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQuantityMeters(q)}
                          className={clsx(
                            'px-3 py-1 rounded-lg text-xs font-mono border transition-colors',
                            quantityMeters === q
                              ? 'bg-teal-600 text-white border-teal-500'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          )}
                        >
                          {q.toLocaleString()} m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tier Progress */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Volume Tier Status</span>
                      <span className="text-white font-bold">{quantityMeters.toLocaleString()} / 30,000 m max tier</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${Math.min(100, (quantityMeters / 30000) * 100)}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-4 text-[10px] font-mono text-slate-400 pt-1 text-center">
                      <span>0% (&lt;5k)</span>
                      <span>5% (5k+)</span>
                      <span>10% (15k+)</span>
                      <span>15% (30k+)</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Date & Priority SLA */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <h3 className="text-sm font-bold text-white font-display">
                      Production Lead-Time & Priority Queue
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-mono text-slate-300 font-semibold block mb-2">
                        Target Delivery Date at Destination Port *
                      </label>
                      <input
                        type="date"
                        value={deliveryDate}
                        onChange={(e) => setDeliveryDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-mono text-slate-300 font-semibold block mb-2">
                        Production Dispatch Priority
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'standard', label: 'Standard', desc: '18-24 Days' },
                          { id: 'high', label: 'Priority', desc: '10-14 Days (+₹25/m)' },
                          { id: 'urgent', label: 'Rush Overtime', desc: '5-7 Days (+₹45/m)' },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPriority(p.id as PriorityLevel)}
                            className={clsx(
                              'p-2.5 rounded-xl border text-center transition-all',
                              priority === p.id
                                ? 'bg-teal-950 border-teal-500 text-teal-300 font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            )}
                          >
                            <span className="text-xs block font-bold">{p.label}</span>
                            <span className="text-[10px] block opacity-80 mt-0.5">{p.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Packaging & Accreditations */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    <h3 className="text-sm font-bold text-white font-display">
                      Packaging & Mill Certifications
                    </h3>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-300 font-semibold block mb-2">
                      Roll Packaging Standard
                    </label>
                    <select
                      value={packagingPreference}
                      onChange={(e) => setPackagingPreference(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-teal-500"
                    >
                      <option>100m Export Rolls with Poly-Wrap & Barcode Labels</option>
                      <option>200m Jumbo Rolls for Automatic Garment Cutters</option>
                      <option>Vacuum Moisture Barrier Sealing (Ocean Freight Heavy)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-mono text-slate-300 font-semibold block mb-2">
                      Accreditation Test Certificates Included:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['GOTS Organic', 'OEKO-TEX Standard 100', 'ZDHC Level 3', 'BCI Cotton'].map((cert) => {
                        const checked = certifications.includes(cert);
                        return (
                          <button
                            type="button"
                            key={cert}
                            onClick={() => toggleCertification(cert)}
                            className={clsx(
                              'p-2.5 rounded-xl border text-xs font-mono text-left flex items-center justify-between transition-all',
                              checked
                                ? 'bg-slate-950 border-emerald-500 text-emerald-300'
                                : 'bg-slate-950/60 border-slate-800 text-slate-400'
                            )}
                          >
                            <span>{cert}</span>
                            {checked && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Live Live Price Matrix */}
              <div className="space-y-4">
                <div className="sticky top-20 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-teal-500/40 shadow-xl space-y-4">
                  <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white font-display">
                      Live Transparent Quote (₹ INR)
                    </h3>
                    <span className="text-[10px] font-mono uppercase bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800">
                      Real-Time
                    </span>
                  </div>

                  {/* Summary items */}
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span>Fabric:</span>
                      <span className="font-semibold text-white truncate max-w-[150px]">{selectedFabric.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantity:</span>
                      <span className="font-mono font-bold text-white">{quantityMeters.toLocaleString()} meters</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Fabric Rate:</span>
                      <span className="font-mono text-white">₹{priceCalculations.baseRate.toFixed(2)}/m</span>
                    </div>
                    {priceCalculations.finishSurcharge > 0 && (
                      <div className="flex justify-between text-teal-300">
                        <span>Finish Surcharge:</span>
                        <span className="font-mono">+₹{priceCalculations.finishSurcharge.toFixed(2)}/m</span>
                      </div>
                    )}
                    {priceCalculations.prioritySurcharge > 0 && (
                      <div className="flex justify-between text-amber-300">
                        <span>Priority Dispatch Fee:</span>
                        <span className="font-mono">+₹{priceCalculations.prioritySurcharge.toFixed(2)}/m</span>
                      </div>
                    )}
                    {priceCalculations.discountPercent > 0 && (
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Volume Discount ({priceCalculations.discountPercent}%):</span>
                        <span className="font-mono">-₹{priceCalculations.discountAmountPerMeter.toFixed(2)}/m</span>
                      </div>
                    )}
                  </div>

                  {/* Price Totals */}
                  <div className="pt-4 border-t border-slate-800 space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Net Unit Rate:</span>
                      <span className="font-bold text-white text-sm">₹{priceCalculations.netUnitRate.toFixed(2)} / meter</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal (Excl. Tax):</span>
                      <span>₹{priceCalculations.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>GST (12% Textile):</span>
                      <span>₹{priceCalculations.gstAmount.toLocaleString()}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
                      <span className="text-xs uppercase font-bold text-white">Contract Total:</span>
                      <span className="text-xl font-bold text-teal-400">
                        ₹{priceCalculations.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="w-full mt-4"
                    onClick={() => setCurrentStep(3)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Enter Buyer Info & Confirm
                  </Button>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(1)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Fabric Studio
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setCurrentStep(3)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Buyer Details
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Buyer & Company Information */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Fast Demo Quick Fills */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white font-display block">
                  Quick-Fill Verified Demo Accounts:
                </span>
                <span className="text-[11px] text-slate-400">
                  Select a certified buyer profile to populate commercial fields instantly.
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_BUYERS.map((preset) => (
                  <button
                    key={preset.company}
                    type="button"
                    onClick={() => handleApplyPresetBuyer(preset)}
                    className="px-3 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-teal-300 transition-colors"
                  >
                    {preset.company}
                  </button>
                ))}
              </div>
            </div>

            {/* Buyer Form Fields */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Building className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white font-display">
                  Client Organization & Shipping Logistics
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold block mb-1.5">
                    Buyer Company / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nordic Apparel Corp"
                    value={buyerCompany}
                    onChange={(e) => setBuyerCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold block mb-1.5">
                    Authorized Sourcing Representative *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold block mb-1.5">
                    Official Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sarah.j@nordicapparel.com"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold block mb-1.5">
                    Contact Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. +46 8 123 4567"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold block mb-1.5">
                    Buyer Purchase Order (PO) Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PO-NOR-2026-9921"
                    value={buyerPo}
                    onChange={(e) => setBuyerPo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 font-semibold block mb-1.5">
                    Destination Port / Garment Factory Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Port of Gothenburg, Sweden / Nhava Sheva Mumbai"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 font-semibold block mb-1.5">
                  Special Weaving / Dyeing Instructions or Lab Dip Approvals
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Match lab dip shade #02; enforce Delta E < 0.6 on spectrophotometer."
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            {/* Final Order Review Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/50 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-teal-400 font-bold">READY TO SUBMIT:</span>
                <h4 className="text-lg font-bold text-white font-display mt-0.5">
                  {quantityMeters.toLocaleString()}m of {selectedFabric.name} ({customGsm} GSM)
                </h4>
                <p className="text-xs text-slate-300 font-mono mt-1">
                  Color: {selectedColor.name} | Deliver by: {deliveryDate} | PO: {buyerPo || 'Auto-generated'}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs uppercase font-mono text-slate-400 block">FINAL CONTRACT TOTAL:</span>
                <span className="text-2xl font-bold font-mono text-teal-400">
                  ₹{priceCalculations.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(2)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back to Volume & Delivery
              </Button>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
                className="font-bold px-8 shadow-lg shadow-teal-500/20"
              >
                Confirm & Dispatch Order to Mill
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Order Confirmation & Live Mill Link */}
        {currentStep === 4 && placedOrderResult && (
          <div className="p-8 rounded-3xl bg-slate-900 border border-teal-500/60 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/50 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(20,184,166,0.35)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase text-teal-400 font-bold tracking-widest block mb-1">
                ORDER OFFICIALLY CONFIRMED & DISPATCHED TO MILL
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white tracking-tight">
                Sales Order ID: {placedOrderResult.orderNumber}
              </h2>
              <p className="text-xs text-slate-300 mt-2 max-w-xl mx-auto">
                Your order has been written to the Everest Textile OS database and broadcast in real-time to the factory floor operations dashboard.
              </p>
            </div>

            {/* Order Recap Matrix */}
            <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Buyer Organization:</span>
                <span className="text-white font-bold text-sm">{placedOrderResult.customerCompany}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Order Contract Value:</span>
                <span className="text-teal-400 font-bold text-sm">₹{placedOrderResult.totalValueUsd?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Fabric Specification:</span>
                <span className="text-white">{placedOrderResult.fabricType}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Target Delivery:</span>
                <span className="text-emerald-400 font-bold">{placedOrderResult.deadlineDate}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => navigate(`/orders?orderId=${placedOrderResult.id}`)}
                leftIcon={<ShoppingBag className="w-4 h-4" />}
              >
                View Live in Main Orders Page
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => navigate('/buyer/orders')}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Open Buyer Tracking Portal
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleResetForNewOrder}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Place Another Fabric Batch
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
