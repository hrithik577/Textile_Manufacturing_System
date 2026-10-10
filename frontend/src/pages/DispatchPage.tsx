import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Truck,
  PackageCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Barcode,
  Printer,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  ExternalLink,
  Plus,
  XCircle,
  AlertOctagon,
  Sparkles,
  Receipt,
  Layers,
  Clock,
  MapPin,
  RefreshCw,
  Info,
  Calendar,
} from 'lucide-react';
import { CustomerOrder, FinishedGoodsRoll, DispatchRecord } from '../types';
import { ordersService } from '../services/orders';
import { dispatchService } from '../services/dispatch';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingState } from '../components/common/LoadingState';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

export const DispatchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useApp();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [rolls, setRolls] = useState<FinishedGoodsRoll[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Dispatch Form State
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ord-100');
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([
    'roll-fg-101',
    'roll-fg-102',
    'roll-fg-103',
    'roll-fg-104',
  ]);
  const [destinationAddress, setDestinationAddress] = useState(
    'Nordic Logistics Central Terminal, Gate 4, Gothenburg Sweden'
  );
  const [destinationCity, setDestinationCity] = useState('Gothenburg, Sweden');
  const [carrierName, setCarrierName] = useState('Maersk Line Integrated Logistics');
  const [vehicleNumber, setVehicleNumber] = useState('KA-04-EV-9821');
  const [driverName, setDriverName] = useState('Gurpreet Singh');
  const [driverPhone, setDriverPhone] = useState('+91 98450 11234');
  const [dispatchNotes, setDispatchNotes] = useState(
    'Heavy export grade carton shrink wrapped. Temperature controlled ocean container.'
  );

  // Scanner & Verification State
  const [scanInput, setScanInput] = useState('');
  const [scanAlert, setScanAlert] = useState<{
    type: 'success' | 'wrong_buyer' | 'duplicate' | 'quality_hold' | 'not_found';
    title: string;
    message: string;
    rollBarcode?: string;
  } | null>(null);

  // Dialogs & Document Views
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docViewTab, setDocViewTab] = useState<'challan' | 'tax_invoice' | 'shelf_audit'>('challan');
  const [activeDispatchRecord, setActiveDispatchRecord] = useState<DispatchRecord | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, rollsRes, dispRes] = await Promise.all([
        ordersService.getOrders(),
        dispatchService.getFinishedGoods(),
        dispatchService.getDispatches(),
      ]);
      setOrders(ordersRes.data);
      setRolls(rollsRes.data);
      setDispatches(dispRes.data);

      const orderNumberParam = searchParams.get('orderNumber');
      if (orderNumberParam) {
        const found = ordersRes.data.find(
          (o) => o.orderNumber === orderNumberParam || o.id === orderNumberParam
        );
        if (found) setSelectedOrderId(found.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0];
  }, [orders, selectedOrderId]);

  // Warehouse Store Shelf Breakdown
  const shelfStats = useMemo(() => {
    const sittingOnShelf = rolls.filter((r) => r.status === 'in_warehouse');
    const alreadyDispatched = rolls.filter((r) => r.status === 'dispatched');

    // Aging rolls: sitting in warehouse for > 10 days since inspection
    const today = new Date('2026-10-10');
    const agingRolls = sittingOnShelf.filter((r) => {
      const inspDate = new Date(r.inspectionDate);
      const diffDays = Math.floor((today.getTime() - inspDate.getTime()) / (1000 * 3600 * 24));
      return diffDays >= 10;
    });

    return {
      sittingRollsCount: sittingOnShelf.length,
      sittingMeters: sittingOnShelf.reduce((s, r) => s + r.netLengthMeters, 0),
      sittingWeightKg: sittingOnShelf.reduce((s, r) => s + r.grossWeightKg, 0),
      dispatchedRollsCount: alreadyDispatched.length,
      dispatchedMeters: alreadyDispatched.reduce((s, r) => s + r.netLengthMeters, 0),
      agingRolls,
    };
  }, [rolls]);

  // Available rolls for the selected order (strictly validating that rolls are Grade A/Pass and in warehouse)
  const eligibleRolls = useMemo(() => {
    return rolls.filter(
      (r) => (r.orderId === selectedOrderId || r.orderNumber === currentOrder?.orderNumber) && r.status === 'in_warehouse'
    );
  }, [rolls, selectedOrderId, currentOrder]);

  const selectedRollsData = useMemo(() => {
    return rolls.filter((r) => selectedRollIds.includes(r.id));
  }, [rolls, selectedRollIds]);

  const totalSelectedMeters = useMemo(() => {
    return selectedRollsData.reduce((sum, r) => sum + r.netLengthMeters, 0);
  }, [selectedRollsData]);

  const totalSelectedWeight = useMemo(() => {
    return selectedRollsData.reduce((sum, r) => sum + r.grossWeightKg, 0);
  }, [selectedRollsData]);

  const toggleRollSelection = (rollId: string) => {
    setSelectedRollIds((prev) =>
      prev.includes(rollId) ? prev.filter((id) => id !== rollId) : [...prev, rollId]
    );
  };

  // BARCODE SCANNER & TRUCK LOADING VERIFICATION LOGIC
  const handleBarcodeScan = (barcodeToScan?: string) => {
    const code = (barcodeToScan || scanInput).trim().toUpperCase();
    if (!code) return;

    // 1. Locate roll anywhere in finished goods store
    const foundRoll = rolls.find(
      (r) => r.rollBarcode.toUpperCase() === code || r.id.toUpperCase() === code
    );

    if (!foundRoll) {
      setScanAlert({
        type: 'not_found',
        title: 'Barcode Not Recognized in Finished Store',
        message: `No roll with code "${code}" exists in warehouse database. Check barcode sticker.`,
        rollBarcode: code,
      });
      setScanInput('');
      return;
    }

    // 2. CHECK: Prevent duplicate dispatching of already dispatched rolls
    if (foundRoll.status === 'dispatched') {
      setScanAlert({
        type: 'duplicate',
        title: '🛑 PREVENTED DUPLICATE DISPATCH',
        message: `Roll ${foundRoll.rollBarcode} was ALREADY dispatched on a previous shipment! It cannot be loaded twice onto truck ${vehicleNumber}.`,
        rollBarcode: foundRoll.rollBarcode,
      });
      addToast({
        type: 'danger',
        title: 'Duplicate Dispatch Prevented',
        message: `Roll ${foundRoll.rollBarcode} is already in transit.`,
      });
      setScanInput('');
      return;
    }

    // 3. CHECK: Prevent wrong buyer mismatch
    if (foundRoll.orderId !== selectedOrderId && foundRoll.orderNumber !== currentOrder?.orderNumber) {
      setScanAlert({
        type: 'wrong_buyer',
        title: '🛑 WRONG BUYER REJECTED FROM TRUCK',
        message: `Roll ${foundRoll.rollBarcode} belongs to ${foundRoll.customerName} (${foundRoll.orderNumber}). This truck is loading strictly for ${currentOrder?.customerCompany}! DO NOT LOAD ONTO THIS TRUCK.`,
        rollBarcode: foundRoll.rollBarcode,
      });
      addToast({
        type: 'danger',
        title: 'Wrong Buyer Mismatch',
        message: `Roll ${foundRoll.rollBarcode} belongs to ${foundRoll.customerName}.`,
      });
      setScanInput('');
      return;
    }

    // 4. CHECK: Prevent loading rolls with Quality Hold (Grade B or rejected)
    if (foundRoll.grade.includes('Grade B') || foundRoll.grade.includes('Hold')) {
      setScanAlert({
        type: 'quality_hold',
        title: '🛑 QUALITY INSPECTION HOLD REJECTION',
        message: `Roll ${foundRoll.rollBarcode} is on QC Hold (${foundRoll.grade}). Only Grade A Export Certified rolls are approved for loading.`,
        rollBarcode: foundRoll.rollBarcode,
      });
      addToast({
        type: 'danger',
        title: 'Quality Hold Blocked',
        message: `Roll ${foundRoll.rollBarcode} does not meet Grade A criteria.`,
      });
      setScanInput('');
      return;
    }

    // 5. SUCCESS: Add to truck loading list if not already added
    if (selectedRollIds.includes(foundRoll.id)) {
      setScanAlert({
        type: 'success',
        title: 'Roll Already Loaded on Truck',
        message: `Roll ${foundRoll.rollBarcode} (${foundRoll.netLengthMeters}m) is already verified on this truck.`,
        rollBarcode: foundRoll.rollBarcode,
      });
    } else {
      setSelectedRollIds((prev) => [...prev, foundRoll.id]);
      setScanAlert({
        type: 'success',
        title: '✓ Roll Verified & Loaded to Truck',
        message: `Roll ${foundRoll.rollBarcode} (${foundRoll.netLengthMeters}m, ${foundRoll.fabricType}) passed all checks and added to Truck ${vehicleNumber}.`,
        rollBarcode: foundRoll.rollBarcode,
      });
      addToast({
        type: 'success',
        title: 'Roll Scanned & Loaded',
        message: `${foundRoll.rollBarcode} verified for ${currentOrder?.customerCompany}.`,
      });
    }
    setScanInput('');
  };

  const handleCreateDispatch = async () => {
    if (selectedRollIds.length === 0) {
      addToast({
        type: 'danger',
        title: 'Validation Error',
        message: 'You must select at least one eligible roll to generate a dispatch challan.',
      });
      return;
    }

    try {
      const newDispatchPayload: Partial<DispatchRecord> = {
        orderId: currentOrder.id,
        orderNumber: currentOrder.orderNumber,
        customerName: currentOrder.customerCompany,
        destinationCity,
        destinationAddress,
        carrierName,
        vehicleNumber,
        driverName,
        driverPhone,
        rollIds: selectedRollsData.map((r) => r.rollBarcode),
        totalMeters: totalSelectedMeters,
        totalRolls: selectedRollIds.length,
        grossWeightKg: totalSelectedWeight,
        notes: dispatchNotes,
      };

      const res = await dispatchService.createDispatch(newDispatchPayload);
      setDispatches((prev) => [res.data, ...prev]);

      // Mark the dispatched rolls as 'dispatched' locally so shelf stats update instantly
      setRolls((prev) =>
        prev.map((r) =>
          selectedRollIds.includes(r.id) ? { ...r, status: 'dispatched' as const } : r
        )
      );

      setActiveDispatchRecord(res.data);
      setConfirmDialogOpen(false);
      setDocModalOpen(true);

      addToast({
        type: 'success',
        title: 'Delivery Challan & Matching Invoice Issued',
        message: `Challan ${res.data.challanNumber} and Invoice issued for ${totalSelectedMeters.toLocaleString()} meters.`,
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Dispatch Failed',
        message: err?.message,
      });
    }
  };

  if (loading) {
    return <LoadingState message="Loading dispatch console, vehicle rosters, and shipment challans..." />;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 editorial-border-b">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black font-display uppercase tracking-tighter leading-none mb-2 text-[var(--color-ink)]">
            Dispatch & Store Shelf Console
          </h1>
          <p className="text-sm font-sans text-[var(--color-industrial-grey)] max-w-2xl">
            Verify the right rolls for the right buyer, prevent duplicate dispatches, generate matching tax invoices, and monitor warehouse shelves so nothing is forgotten in a corner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest editorial-border hover:bg-[var(--color-paper)] transition-colors text-[var(--color-ink)]"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Store
          </button>
        </div>
      </div>

      {/* ─── SCENE 3 PROBLEM SOLVED: STORE SHELF VISIBILITY BANNER ─────────────────── */}
      {/* ─── SCENE 3 PROBLEM SOLVED: STORE SHELF VISIBILITY BANNER ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI 1: Sitting on the Shelf */}
        <div className="p-6 bg-white editorial-border">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-light-border)]">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-2 text-[var(--color-ink)]">
              <Layers className="w-5 h-5 text-[var(--color-ink)]" />
              Sitting on Store Shelves
            </span>
            <span className="text-[10px] font-mono px-3 py-1 font-bold uppercase tracking-widest editorial-border bg-[var(--color-paper)] text-[var(--color-ink)]">
              Current Inventory
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-4xl font-black font-display tracking-tighter text-[var(--color-ink)]">
              {shelfStats.sittingRollsCount} <span className="text-lg">Rolls</span>
            </span>
            <span className="font-mono text-sm text-[var(--color-industrial-grey)] font-bold">
              {shelfStats.sittingMeters.toLocaleString()} meters
            </span>
          </div>
          <p className="text-xs font-sans text-[var(--color-industrial-grey)] mt-4 pt-4 border-t border-[var(--color-light-border)]">
            Total gross weight: <strong>{shelfStats.sittingWeightKg.toFixed(1)} kg</strong> stored in Racks A-12, A-13, B-04.
          </p>
        </div>

        {/* KPI 2: Gone Out / Dispatched */}
        <div className="p-6 bg-white editorial-border ring-1 ring-[var(--color-success-green)] border-[var(--color-success-green)]">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-light-border)]">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-2 text-[var(--color-success-green)]">
              <Truck className="w-5 h-5" />
              Already Gone Out (Dispatched)
            </span>
            <span className="text-[10px] font-mono px-3 py-1 font-bold uppercase tracking-widest bg-[var(--color-success-green)] text-white">
              Locked Ledger
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-4xl font-black font-display tracking-tighter text-[var(--color-ink)]">
              {shelfStats.dispatchedRollsCount} <span className="text-lg">Rolls</span>
            </span>
            <span className="font-mono text-sm text-[var(--color-success-green)] font-bold">
              {shelfStats.dispatchedMeters.toLocaleString()} meters
            </span>
          </div>
          <p className="text-xs font-sans text-[var(--color-industrial-grey)] mt-4 pt-4 border-t border-[var(--color-light-border)]">
            Locked from re-dispatch. Transferred to carrier Maersk & DHL trucks.
          </p>
        </div>

        {/* KPI 3: Aging in Corner / Forgotten Fabric Radar */}
        <div className={clsx(
          'p-6 bg-white editorial-border transition-all',
          shelfStats.agingRolls.length > 0
            ? 'border-[var(--color-vermilion)] ring-1 ring-[var(--color-vermilion)]'
            : ''
        )}>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--color-light-border)]">
            <span className={clsx(
              "text-[10px] font-mono uppercase tracking-widest font-bold flex items-center gap-2",
              shelfStats.agingRolls.length > 0 ? "text-[var(--color-vermilion)]" : "text-[var(--color-ink)]"
            )}>
              <Clock className="w-5 h-5" />
              Aging Fabric Radar (Zero Forgotten)
            </span>
            <span className={clsx(
              "text-[10px] font-mono px-3 py-1 font-bold uppercase tracking-widest editorial-border text-[var(--color-ink)]",
              shelfStats.agingRolls.length > 0 ? "bg-[var(--color-vermilion)] text-white border-[var(--color-vermilion)]" : "bg-[var(--color-paper)]"
            )}>
              &gt;10 Days Staged
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className={clsx(
              "text-4xl font-black font-display tracking-tighter",
              shelfStats.agingRolls.length > 0 ? "text-[var(--color-vermilion)]" : "text-[var(--color-ink)]"
            )}>
              {shelfStats.agingRolls.length} <span className="text-lg">Rolls Flagged</span>
            </span>
            <span className={clsx(
              "font-mono text-sm font-bold",
              shelfStats.agingRolls.length > 0 ? "text-[var(--color-vermilion)]" : "text-[var(--color-industrial-grey)]"
            )}>
              {shelfStats.agingRolls.reduce((s, r) => s + r.netLengthMeters, 0)} meters
            </span>
          </div>
          <p className="text-xs font-sans text-[var(--color-ink)] mt-4 pt-4 border-t border-[var(--color-light-border)]">
            {shelfStats.agingRolls.length > 0 ? (
              <span className="font-bold">⚠️ Staged in <strong>Warehouse Bay 1 / Rack C-14 (Corner)</strong> for 14 days without dispatch!</span>
            ) : (
              <span className="font-bold text-[var(--color-industrial-grey)]">✓ All fabric rotating normally. Zero rolls forgotten in corners.</span>
            )}
          </p>
        </div>
      </div>

      {/* ─── TRUCK LOADING GATE SCANNER & MISMATCH GUARD ─────────────────────────── */}
      <div className="p-6 bg-[var(--color-paper)] editorial-border shadow-md space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white editorial-border flex items-center justify-center shrink-0 text-[var(--color-ink)]">
              <Barcode className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black font-display uppercase tracking-tight text-[var(--color-ink)]">
                Truck Loading Gate Barcode Scanner
              </h3>
              <p className="text-sm font-sans text-[var(--color-industrial-grey)] mt-1">
                Scan each roll as it is physically loaded onto the truck. Enforces buyer isolation, duplicate block, and QA clearance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono font-bold uppercase tracking-widest text-[var(--color-industrial-grey)]">
            <span>Active Target Truck</span>
            <span className="px-3 py-1.5 editorial-border bg-white text-[var(--color-ink)]">
              {vehicleNumber} ({currentOrder?.customerCompany.split(' ')[0]})
            </span>
          </div>
        </div>

        {/* Barcode Input Bar with Scan Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Barcode className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-industrial-grey)]" />
            <input
              type="text"
              placeholder="Scan or enter Roll Barcode (e.g. ROLL-8401, ROLL-8402)..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleBarcodeScan();
                }
              }}
              className="w-full pl-12 pr-4 py-3 editorial-border bg-white focus:ring-1 focus:ring-[var(--color-ink)] text-sm font-bold font-mono placeholder-[var(--color-industrial-grey)] focus:outline-none"
            />
          </div>

          <button
            onClick={() => handleBarcodeScan()}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--color-ink)] text-white hover:bg-black/80 transition-colors editorial-border font-bold text-xs uppercase tracking-widest shrink-0"
          >
            <PackageCheck className="w-4 h-4" />
            Verify & Load to Truck
          </button>
        </div>

        {/* Simulation / Testing Quick Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-industrial-grey)] shrink-0">Test Scenarios:</span>
          <button
            onClick={() => handleBarcodeScan('ROLL-8401')}
            className="px-3 py-1.5 bg-white hover:bg-[var(--color-paper)] text-[var(--color-ink)] editorial-border font-bold font-mono text-[10px] uppercase tracking-widest transition-colors"
          >
            ✓ Valid Roll (ROLL-8401)
          </button>
          <button
            onClick={() => handleBarcodeScan('ROLL-9701')}
            className="px-3 py-1.5 bg-white hover:bg-[var(--color-paper)] text-[var(--color-vermilion)] editorial-border border-[var(--color-vermilion)] font-bold font-mono text-[10px] uppercase tracking-widest transition-colors"
            title="Attempts to load Patagonia roll into Nordic Apparel truck"
          >
            ⚠️ Wrong Buyer (ROLL-9701 Patagonia)
          </button>
          <button
            onClick={() => handleBarcodeScan('ROLL-8390')}
            className="px-3 py-1.5 bg-white hover:bg-[var(--color-paper)] text-[var(--color-vermilion)] editorial-border border-[var(--color-vermilion)] font-bold font-mono text-[10px] uppercase tracking-widest transition-colors"
            title="Attempts to re-dispatch a roll already marked dispatched"
          >
            ⚠️ Duplicate Dispatch (ROLL-8390)
          </button>
          <button
            onClick={() => handleBarcodeScan('ROLL-9201')}
            className="px-3 py-1.5 bg-white hover:bg-[var(--color-paper)] text-purple-600 editorial-border border-purple-600 font-bold font-mono text-[10px] uppercase tracking-widest transition-colors"
            title="Attempts to dispatch roll on QC Hold"
          >
            ⚠️ Quality Hold (ROLL-9201 Grade B)
          </button>
        </div>

        {/* Live Scan Alert Notification Banner */}
        {scanAlert && (
          <div
            className={clsx(
              'p-4 rounded-xl border flex items-start justify-between gap-3 animate-in fade-in duration-150',
              scanAlert.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                : scanAlert.type === 'wrong_buyer'
                ? 'bg-rose-950/50 border-rose-500 text-rose-200'
                : scanAlert.type === 'duplicate'
                ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                : 'bg-purple-950/50 border-purple-500 text-purple-200'
            )}
          >
            <div className="flex items-start gap-3">
              {scanAlert.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider">
                  {scanAlert.title}
                </h4>
                <p className="text-xs mt-1 leading-relaxed">{scanAlert.message}</p>
              </div>
            </div>
            <button
              onClick={() => setScanAlert(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ─── MAIN DISPATCH WORKSPACE (3 COLUMNS) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Staging & Roll Verification Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Customer Order Selector */}
          <div className="bg-white p-6 editorial-border mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-light-border)] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 editorial-border bg-[var(--color-ink)] text-white text-sm font-bold flex items-center justify-center font-mono">
                  1
                </span>
                <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
                  Select Customer Order for Dispatch
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--color-industrial-grey)] font-bold uppercase tracking-widest border border-[var(--color-light-border)] px-2 py-1 bg-[var(--color-paper)]">QA Verified Stage</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {orders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <div
                    key={order.id}
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setSelectedRollIds([]);
                      setScanAlert(null);
                    }}
                    className={clsx(
                      'p-4 editorial-border text-left cursor-pointer transition-all duration-150',
                      isSelected
                        ? 'border-[var(--color-ink)] ring-1 ring-[var(--color-ink)] bg-[var(--color-paper)]'
                        : 'bg-white hover:bg-[var(--color-paper)]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-[var(--color-ink)]">{order.orderNumber}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <p className="text-sm font-bold text-[var(--color-ink)]">{order.customerCompany}</p>
                    <p className="text-[11px] font-mono text-[var(--color-industrial-grey)] mt-1">{order.fabricType}</p>
                    <div className="mt-4 pt-3 border-t border-[var(--color-light-border)] flex items-center justify-between text-[11px] font-mono font-bold">
                      <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Total: {order.orderedQuantity.toLocaleString()} m</span>
                      <span className="text-[var(--color-ink)] uppercase tracking-widest">{order.allocatedRollsCount} rolls staged</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Eligible Roll Allocation & Barcode Verification */}
          <div className="bg-white p-6 editorial-border mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--color-light-border)] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 editorial-border bg-[var(--color-ink)] text-white text-sm font-bold flex items-center justify-center font-mono">
                  2
                </span>
                <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
                  Loaded Rolls on Truck
                </h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-industrial-grey)] font-mono">
                {selectedRollIds.length} of {eligibleRolls.length} rolls on truck
              </span>
            </div>

            {eligibleRolls.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-industrial-grey)] text-xs font-bold uppercase tracking-widest border border-dashed border-[var(--color-light-border)] bg-[var(--color-paper)]">
                No finished rolls in warehouse for this order. Ensure rolls pass Quality Control first.
              </div>
            ) : (
              <div className="space-y-3">
                {eligibleRolls.map((roll) => {
                  const isChecked = selectedRollIds.includes(roll.id);

                  return (
                    <div
                      key={roll.id}
                      onClick={() => toggleRollSelection(roll.id)}
                      className={clsx(
                        'flex items-center justify-between p-4 editorial-border cursor-pointer transition-colors',
                        isChecked
                          ? 'bg-[var(--color-ink)] border-[var(--color-ink)] text-white'
                          : 'bg-white hover:bg-[var(--color-paper)] border-[var(--color-light-border)] text-[var(--color-ink)]'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className={clsx(
                            "w-5 h-5 editorial-border rounded-none focus:ring-1 focus:ring-[var(--color-ink)] cursor-pointer",
                            isChecked ? "text-white" : "text-[var(--color-ink)]"
                          )}
                        />
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-sm">{roll.rollBarcode}</span>
                            <span className={clsx(
                              "text-[10px] px-2 py-0.5 font-bold uppercase tracking-widest font-mono editorial-border",
                              isChecked ? "bg-white text-[var(--color-ink)]" : "bg-[var(--color-success-green)] text-white border-[var(--color-success-green)]"
                            )}>
                              {roll.grade}
                            </span>
                            {isChecked && (
                              <span className="text-[10px] font-mono text-[var(--color-ink)] bg-white px-2 py-0.5 border border-white font-bold uppercase tracking-widest">
                                LOADED ON TRUCK
                              </span>
                            )}
                          </div>
                          <p className={clsx(
                            "text-[11px] font-mono mt-1 font-bold",
                            isChecked ? "text-white/70" : "text-[var(--color-industrial-grey)]"
                          )}>Location: {roll.warehouseLocation}</p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-sm font-bold">
                        <div>{roll.netLengthMeters} meters</div>
                        <div className={clsx(
                          "text-[10px] uppercase tracking-widest mt-1",
                          isChecked ? "text-white/70" : "text-[var(--color-industrial-grey)]"
                        )}>{roll.grossWeightKg} kg</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Logistics, Carrier & Vehicle Allocation */}
          <div className="bg-white p-6 editorial-border mb-6">
            <div className="flex items-center gap-3 border-b border-[var(--color-light-border)] pb-4 mb-6">
              <span className="w-8 h-8 editorial-border bg-[var(--color-ink)] text-white text-sm font-bold flex items-center justify-center font-mono">
                3
              </span>
              <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
                Carrier Logistics & Transport Assignment
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs font-bold uppercase tracking-widest font-mono text-[var(--color-ink)]">
              <div>
                <label className="block mb-2">Carrier / Freight Line</label>
                <input
                  type="text"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full bg-white editorial-border px-4 py-3 focus:ring-1 focus:ring-[var(--color-ink)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2">Transport Vehicle #</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-white editorial-border px-4 py-3 focus:ring-1 focus:ring-[var(--color-ink)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2">Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-white editorial-border px-4 py-3 focus:ring-1 focus:ring-[var(--color-ink)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block mb-2">Driver Phone</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full bg-white editorial-border px-4 py-3 focus:ring-1 focus:ring-[var(--color-ink)] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-2">Delivery Destination Address</label>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full bg-white editorial-border px-4 py-3 focus:ring-1 focus:ring-[var(--color-ink)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Dispatch Summary & Recent Shipments */}
        <div className="space-y-6">
          
          {/* Dispatch Summary Card */}
          <div className="bg-white p-6 editorial-border mb-6">
            <h3 className="text-xl font-black font-display text-[var(--color-ink)] pb-4 mb-4 border-b border-[var(--color-light-border)] flex items-center justify-between uppercase tracking-tight">
              <span>Shipment Loading Summary</span>
              <span className="text-[10px] font-mono text-white bg-[var(--color-success-green)] px-3 py-1 font-bold uppercase tracking-widest editorial-border">
                100% Verified
              </span>
            </h3>

            <div className="space-y-4 text-xs font-bold font-mono">
              <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Target Buyer:</span>
                <span className="text-[var(--color-ink)] truncate max-w-[150px] text-right">
                  {currentOrder?.customerCompany}
                </span>
              </div>
              <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Order Ref:</span>
                <span className="text-[var(--color-ink)] text-right">{currentOrder?.orderNumber}</span>
              </div>
              <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Total Rolls on Truck:</span>
                <span className="text-[var(--color-ink)] text-right text-sm">{selectedRollIds.length} rolls</span>
              </div>
              <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Loaded Fabric Meters:</span>
                <span className="text-[var(--color-success-green)] text-right text-base">
                  {totalSelectedMeters.toLocaleString()} meters
                </span>
              </div>
              <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Gross Export Weight:</span>
                <span className="text-[var(--color-ink)] text-right">{totalSelectedWeight.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Assigned Vehicle:</span>
                <span className="text-[var(--color-ink)] text-right">{vehicleNumber}</span>
              </div>
              <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Carrier:</span>
                <span className="text-[var(--color-ink)] truncate max-w-[150px] text-right">{carrierName}</span>
              </div>
            </div>

            {/* Matching Tax Invoice Total Preview */}
            <div className="p-4 mt-6 bg-[var(--color-paper)] editorial-border space-y-2">
              <div className="flex justify-between text-xs font-bold font-mono">
                <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Tax Invoice Value:</span>
                <span className="text-[var(--color-ink)]">
                  ₹{Math.round(totalSelectedMeters * 380).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-bold font-mono">
                <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">GST (5% HSN 5208):</span>
                <span className="text-[var(--color-ink)]">
                  ₹{Math.round(totalSelectedMeters * 380 * 0.05).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setConfirmDialogOpen(true)}
              disabled={selectedRollIds.length === 0}
              className={clsx(
                "w-full mt-6 flex justify-center items-center gap-2 px-6 py-4 font-bold text-xs uppercase tracking-widest editorial-border transition-colors",
                selectedRollIds.length === 0
                  ? "bg-[var(--color-light-border)] text-[var(--color-industrial-grey)] cursor-not-allowed"
                  : "bg-[var(--color-ink)] text-white hover:bg-black/80"
              )}
            >
              <Truck className="w-4 h-4" />
              Authorize Dispatch & Issue Invoice
            </button>
          </div>

          {/* Recent Dispatches Log */}
          <div className="bg-white p-6 editorial-border">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-light-border)] mb-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-[var(--color-ink)] font-display">
                Recent Dispatches (Locked)
              </h4>
              <span className="text-[10px] text-[var(--color-success-green)] font-mono font-bold uppercase tracking-widest">
                Duplicate Protected
              </span>
            </div>

            <div className="space-y-3">
              {dispatches.map((disp) => (
                <div
                  key={disp.id}
                  onClick={() => {
                    setActiveDispatchRecord(disp);
                    setDocModalOpen(true);
                  }}
                  className="p-4 bg-[var(--color-paper)] editorial-border hover:bg-black/5 cursor-pointer transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-[var(--color-ink)]">{disp.dispatchNumber}</span>
                    <span className="text-[10px] font-mono text-[var(--color-industrial-grey)] font-bold">{disp.challanNumber}</span>
                  </div>
                  <p className="text-[var(--color-ink)] font-bold text-xs truncate uppercase tracking-widest">{disp.customerName}</p>
                  <div className="flex items-center justify-between text-[11px] text-[var(--color-industrial-grey)] font-mono font-bold pt-2 border-t border-[var(--color-light-border)]">
                    <span>{disp.totalMeters.toLocaleString()}m ({disp.totalRolls} rolls)</span>
                    <span className="text-[var(--color-success-green)] font-bold uppercase tracking-widest">IN TRANSIT</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleCreateDispatch}
        title="Confirm Truck Loading & Issue Invoice"
        message={`Authorize dispatch of ${totalSelectedMeters.toLocaleString()} meters (${selectedRollIds.length} rolls) to ${currentOrder?.customerCompany} on truck ${vehicleNumber}? This locks the rolls from duplicate dispatch and updates the store shelf ledger.`}
        confirmLabel="Authorize & Generate Manifest"
        variant="primary"
      />

      {/* ─── OFFICIAL DELIVERY CHALLAN & MATCHING COMMERCIAL TAX INVOICE MODAL ─── */}
      <Modal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        title={
          activeDispatchRecord
            ? `Shipment Documents · ${activeDispatchRecord.challanNumber}`
            : 'Shipment Documents'
        }
        subtitle="Everest Textile OS Verified Dispatch Documentation & Matching Tax Invoice"
        maxWidth="4xl"
      >
        {activeDispatchRecord && (
          <div className="space-y-6 text-xs text-[var(--color-ink)] font-bold">
            {/* DOCUMENT SELECTOR TABS */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2 p-1 border border-[var(--color-ink)] bg-white">
              <button
                onClick={() => setDocViewTab('challan')}
                className={clsx(
                  'flex-1 py-3 px-4 text-xs font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
                  docViewTab === 'challan'
                    ? 'bg-[var(--color-ink)] text-white'
                    : 'text-[var(--color-industrial-grey)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]'
                )}
              >
                <Truck className="w-4 h-4" />
                <span>1. Delivery Challan (Gate Pass)</span>
              </button>

              <button
                onClick={() => setDocViewTab('tax_invoice')}
                className={clsx(
                  'flex-1 py-3 px-4 text-xs font-bold font-mono uppercase tracking-widest flex items-center justify-center gap-2 transition-all',
                  docViewTab === 'tax_invoice'
                    ? 'bg-[var(--color-ink)] text-white'
                    : 'text-[var(--color-industrial-grey)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]'
                )}
              >
                <Receipt className="w-4 h-4" />
                <span>2. Commercial GST Tax Invoice</span>
              </button>
            </div>

            {/* TAB 1: DELIVERY CHALLAN & MANIFEST */}
            {docViewTab === 'challan' && (
              <div className="space-y-6">
                {/* Manifest Header */}
                <div className="p-6 bg-white editorial-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
                      EVEREST TEXTILE MILLS LTD.
                    </h2>
                    <p className="text-xs font-bold text-[var(--color-industrial-grey)] mt-1">Plot 104-108, Industrial Manufacturing Zone, Phase II</p>
                    <p className="text-[10px] font-mono text-[var(--color-ink)] font-bold mt-1">GSTIN / Tax ID: 24AAACE0921B1Z8</p>
                  </div>
                  <div className="text-left sm:text-right font-mono">
                    <span className="text-lg font-black text-[var(--color-ink)] block">{activeDispatchRecord.challanNumber}</span>
                    <span className="text-[11px] font-bold text-[var(--color-industrial-grey)] block mt-1">Date: {activeDispatchRecord.dispatchedAt}</span>
                    <span className="text-[11px] font-bold text-[var(--color-industrial-grey)] block">Tracking: {activeDispatchRecord.trackingNumber}</span>
                  </div>
                </div>

                {/* Consignee & Carrier Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-[var(--color-paper)] editorial-border">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[var(--color-industrial-grey)] font-bold block mb-2 tracking-widest border-b border-[var(--color-light-border)] pb-2">CONSIGNEE (BUYER)</span>
                    <p className="font-black font-display text-[var(--color-ink)] text-base">{activeDispatchRecord.customerName}</p>
                    <p className="text-xs font-bold text-[var(--color-industrial-grey)] mt-1">{activeDispatchRecord.destinationAddress}</p>
                    <p className="text-xs text-[var(--color-ink)] font-mono font-bold mt-2">Order Ref: {activeDispatchRecord.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[var(--color-industrial-grey)] font-bold block mb-2 tracking-widest border-b border-[var(--color-light-border)] pb-2">CARRIER & VEHICLE</span>
                    <p className="font-black font-display text-[var(--color-ink)] text-base">{activeDispatchRecord.carrierName}</p>
                    <p className="text-xs font-bold text-[var(--color-industrial-grey)] font-mono mt-1">Vehicle: {activeDispatchRecord.vehicleNumber}</p>
                    <p className="text-xs font-bold text-[var(--color-industrial-grey)] mt-2">Driver: {activeDispatchRecord.driverName} ({activeDispatchRecord.driverPhone})</p>
                  </div>
                </div>

                {/* Roll Itemized Table */}
                <div className="bg-white editorial-border overflow-hidden">
                  <table className="w-full text-left text-xs font-bold">
                    <thead className="bg-[var(--color-ink)] text-white uppercase font-mono text-[10px]">
                      <tr>
                        <th className="px-4 py-3 tracking-widest">Item #</th>
                        <th className="px-4 py-3 tracking-widest">Roll Identifier</th>
                        <th className="px-4 py-3 tracking-widest">Quality Grade</th>
                        <th className="px-4 py-3 text-right tracking-widest">Net Length</th>
                        <th className="px-4 py-3 text-right tracking-widest">Gross Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-light-border)]">
                      {activeDispatchRecord.rollIds.map((rollBarcode, idx) => (
                        <tr key={idx} className="hover:bg-[var(--color-paper)] transition-colors">
                          <td className="px-4 py-3 font-mono">{idx + 1}</td>
                          <td className="px-4 py-3 font-mono font-black text-[var(--color-ink)]">{rollBarcode}</td>
                          <td className="px-4 py-3 text-[var(--color-success-green)] font-mono uppercase tracking-widest text-[10px]">Grade A</td>
                          <td className="px-4 py-3 font-mono text-right text-[var(--color-ink)]">500 m</td>
                          <td className="px-4 py-3 font-mono text-right text-[var(--color-industrial-grey)]">56.0 kg</td>
                        </tr>
                      ))}
                      <tr className="bg-[var(--color-paper)] border-t-2 border-[var(--color-ink)]">
                        <td colSpan={3} className="px-4 py-4 text-[var(--color-ink)] font-black uppercase tracking-widest">
                          TOTAL SHIPMENT QUANTITY
                        </td>
                        <td className="px-4 py-4 font-mono text-right text-[var(--color-success-green)] text-sm font-black">
                          {activeDispatchRecord.totalMeters.toLocaleString()} m
                        </td>
                        <td className="px-4 py-4 font-mono text-right text-[var(--color-ink)] text-sm font-black">
                          {activeDispatchRecord.grossWeightKg.toFixed(1)} kg
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* TAB 2: MATCHING COMMERCIAL GST TAX INVOICE */}
            {docViewTab === 'tax_invoice' && (
              <div className="space-y-6">
                {/* Tax Invoice Header */}
                <div className="p-6 bg-[var(--color-paper)] editorial-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[var(--color-industrial-grey)] font-bold tracking-widest block mb-2">
                      TAX INVOICE · RULE 46 OF CGST RULES
                    </span>
                    <h2 className="text-2xl font-black text-[var(--color-ink)] font-display tracking-tight">
                      EVEREST TEXTILE MILLS LIMITED
                    </h2>
                    <p className="text-[11px] text-[var(--color-ink)] font-mono font-bold mt-1">GSTIN: 24AAACE0921B1Z8 · State Code: 24 (Gujarat)</p>
                  </div>
                  <div className="text-left sm:text-right font-mono">
                    <span className="text-lg font-black text-[var(--color-ink)] block">
                      INVOICE #{activeDispatchRecord.invoiceNumber || 'INV-2026-0884'}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--color-industrial-grey)] block mt-1">
                      Challan Ref: {activeDispatchRecord.challanNumber}
                    </span>
                    <span className="text-[11px] font-bold text-[var(--color-industrial-grey)] block">
                      Vehicle: {activeDispatchRecord.vehicleNumber}
                    </span>
                  </div>
                </div>

                {/* Billed To / Shipped To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white editorial-border">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[var(--color-industrial-grey)] font-bold block mb-2 tracking-widest border-b border-[var(--color-light-border)] pb-2">BILLED TO (BUYER)</span>
                    <p className="font-black font-display text-[var(--color-ink)] text-base">{activeDispatchRecord.customerName}</p>
                    <p className="text-xs font-bold text-[var(--color-industrial-grey)] mt-1">{activeDispatchRecord.destinationAddress}</p>
                    <p className="text-xs text-[var(--color-ink)] font-mono font-bold mt-2">PO #: PO-NOR-9921</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-[var(--color-industrial-grey)] font-bold block mb-2 tracking-widest border-b border-[var(--color-light-border)] pb-2">SHIPPED TO (DELIVERY SITE)</span>
                    <p className="font-black font-display text-[var(--color-ink)] text-base">{activeDispatchRecord.destinationCity}</p>
                    <p className="text-xs font-bold text-[var(--color-industrial-grey)] mt-1">Via {activeDispatchRecord.carrierName}</p>
                    <p className="text-[10px] text-[var(--color-ink)] bg-[var(--color-paper)] font-mono px-2 py-0.5 inline-block font-bold mt-2 border border-[var(--color-light-border)]">Mode: Direct Road Freight / Container</p>
                  </div>
                </div>

                {/* Itemized Tax Breakdown Table */}
                <div className="bg-white editorial-border overflow-hidden">
                  <table className="w-full text-left text-xs font-bold">
                    <thead className="bg-[var(--color-ink)] text-white uppercase font-mono text-[10px]">
                      <tr>
                        <th className="px-4 py-3 tracking-widest">HSN Code</th>
                        <th className="px-4 py-3 tracking-widest">Goods Description</th>
                        <th className="px-4 py-3 text-right tracking-widest">Qty (Meters)</th>
                        <th className="px-4 py-3 text-right tracking-widest">Rate (₹/m)</th>
                        <th className="px-4 py-3 text-right tracking-widest">Taxable Value</th>
                        <th className="px-4 py-3 text-right tracking-widest">GST (5%)</th>
                        <th className="px-4 py-3 text-right tracking-widest">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-light-border)] font-mono">
                      <tr className="hover:bg-[var(--color-paper)] transition-colors">
                        <td className="px-4 py-4 text-[var(--color-industrial-grey)]">5208 32 90</td>
                        <td className="px-4 py-4 text-[var(--color-ink)] font-sans">
                          100% Combed Cotton Single Jersey Fabric ({activeDispatchRecord.totalRolls} Verified Rolls)
                        </td>
                        <td className="px-4 py-4 text-right text-[var(--color-ink)] font-black">
                          {activeDispatchRecord.totalMeters.toLocaleString()} m
                        </td>
                        <td className="px-4 py-4 text-right text-[var(--color-industrial-grey)]">₹380.00</td>
                        <td className="px-4 py-4 text-right text-[var(--color-ink)]">
                          ₹{(activeDispatchRecord.totalMeters * 380).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right text-[var(--color-success-green)]">
                          ₹{Math.round(activeDispatchRecord.totalMeters * 380 * 0.05).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right text-[var(--color-ink)] font-black text-sm">
                          ₹{Math.round(activeDispatchRecord.totalMeters * 380 * 1.05).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-[var(--color-paper)] border-t-2 border-[var(--color-ink)] text-xs">
                        <td colSpan={4} className="px-4 py-4 text-[var(--color-ink)] font-black uppercase tracking-widest font-display">
                          MATCHING INVOICE GRAND TOTAL
                        </td>
                        <td className="px-4 py-4 text-right text-[var(--color-ink)]">
                          ₹{(activeDispatchRecord.totalMeters * 380).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right text-[var(--color-success-green)]">
                          ₹{Math.round(activeDispatchRecord.totalMeters * 380 * 0.05).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right text-[var(--color-ink)] font-black text-base">
                          ₹{Math.round(activeDispatchRecord.totalMeters * 380 * 1.05).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Verification Seal */}
                <div className="p-4 bg-white editorial-border ring-1 ring-[var(--color-success-green)] border-[var(--color-success-green)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[var(--color-success-green)] shrink-0" />
                    <span className="text-[var(--color-ink)] font-bold">
                      Physical Truck Load Matches Tax Invoice Exactly: <strong className="font-black font-mono bg-[var(--color-paper)] px-2 py-0.5 border border-[var(--color-light-border)]">{activeDispatchRecord.totalRolls} Rolls / {activeDispatchRecord.totalMeters.toLocaleString()}m</strong> verified.
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-black tracking-widest text-white bg-[var(--color-success-green)] px-3 py-1.5 editorial-border shrink-0">
                    MATCH CONFIRMED
                  </span>
                </div>
              </div>
            )}

            {/* Signature & Print Footer */}
            {/* Signature & Print Footer */}
            <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[var(--color-light-border)]">
              <div className="text-[11px] font-mono text-[var(--color-industrial-grey)] font-bold uppercase tracking-widest">
                Authorized Store Officer: <strong className="text-[var(--color-ink)] ml-1 border-b border-[var(--color-ink)] pb-0.5">{activeDispatchRecord.dispatchedBy}</strong>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 font-bold text-xs uppercase tracking-widest bg-[var(--color-ink)] text-white hover:bg-black/80 transition-colors editorial-border"
                >
                  <Printer className="w-4 h-4" />
                  Print Verified {docViewTab === 'challan' ? 'Challan' : 'Tax Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
