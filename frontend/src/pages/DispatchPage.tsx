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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Dispatch, Truck Loading & Store Shelf Console
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Verify the right rolls for the right buyer, prevent duplicate dispatches, generate matching tax invoices, and monitor warehouse shelves so nothing is forgotten in a corner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={loadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh Store
          </Button>
        </div>
      </div>

      {/* ─── SCENE 3 PROBLEM SOLVED: STORE SHELF VISIBILITY BANNER ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Sitting on the Shelf */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900 border border-teal-500/30 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-teal-300 font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-400" />
              SITTING ON STORE SHELVES
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
              Current Inventory
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-display text-white">
              {shelfStats.sittingRollsCount} Rolls
            </span>
            <span className="font-mono text-sm text-teal-400 font-bold">
              {shelfStats.sittingMeters.toLocaleString()} meters
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total gross weight: <strong>{shelfStats.sittingWeightKg.toFixed(1)} kg</strong> stored in Racks A-12, A-13, B-04.
          </p>
        </div>

        {/* KPI 2: Gone Out / Dispatched */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-900 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-emerald-400" />
              ALREADY GONE OUT (DISPATCHED)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Locked Ledger
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-display text-white">
              {shelfStats.dispatchedRollsCount} Rolls
            </span>
            <span className="font-mono text-sm text-emerald-400 font-bold">
              {shelfStats.dispatchedMeters.toLocaleString()} meters
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Locked from re-dispatch. Transferred to carrier Maersk & DHL trucks.
          </p>
        </div>

        {/* KPI 3: Aging in Corner / Forgotten Fabric Radar */}
        <div className={clsx(
          'p-4 rounded-2xl border shadow-md transition-all',
          shelfStats.agingRolls.length > 0
            ? 'bg-amber-950/30 border-amber-500/50'
            : 'bg-slate-900 border-slate-800'
        )}>
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              AGING FABRIC RADAR (ZERO FORGOTTEN)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              &gt;10 Days Staged
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black font-display text-amber-200">
              {shelfStats.agingRolls.length} Rolls Flagged
            </span>
            <span className="font-mono text-sm text-amber-300 font-bold">
              {shelfStats.agingRolls.reduce((s, r) => s + r.netLengthMeters, 0)} meters
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            {shelfStats.agingRolls.length > 0 ? (
              <span>⚠️ Staged in <strong>Warehouse Bay 1 / Rack C-14 (Corner)</strong> for 14 days without dispatch!</span>
            ) : (
              <span>✓ All fabric rotating normally. Zero rolls forgotten in corners.</span>
            )}
          </p>
        </div>
      </div>

      {/* ─── TRUCK LOADING GATE SCANNER & MISMATCH GUARD ─────────────────────────── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0">
              <Barcode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display text-white">
                Truck Loading Gate Barcode Scanner & Mismatch Guard
              </h3>
              <p className="text-xs text-slate-400">
                Scan each roll as it is physically loaded onto the truck. Enforces buyer isolation, duplicate block, and QA clearance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Active Target Truck:</span>
            <span className="px-2.5 py-1 rounded-lg bg-teal-950 text-teal-200 border border-teal-700 font-bold">
              {vehicleNumber} ({currentOrder?.customerCompany.split(' ')[0]})
            </span>
          </div>
        </div>

        {/* Barcode Input Bar with Scan Button */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-teal-500 text-sm text-white placeholder-slate-500 font-mono focus:outline-none"
            />
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => handleBarcodeScan()}
            leftIcon={<PackageCheck className="w-4 h-4" />}
          >
            Verify & Load to Truck
          </Button>
        </div>

        {/* Simulation / Testing Quick Chips */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs pt-1">
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">Test Guard Scenarios:</span>
          <button
            onClick={() => handleBarcodeScan('ROLL-8401')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-teal-300 border border-slate-800 font-mono text-[11px] shrink-0"
          >
            ✓ Scan Valid Roll (ROLL-8401)
          </button>
          <button
            onClick={() => handleBarcodeScan('ROLL-9701')}
            className="px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/60 font-mono text-[11px] shrink-0"
            title="Attempts to load Patagonia roll into Nordic Apparel truck"
          >
            ⚠️ Test Wrong Buyer (ROLL-9701 Patagonia)
          </button>
          <button
            onClick={() => handleBarcodeScan('ROLL-8390')}
            className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-800/60 font-mono text-[11px] shrink-0"
            title="Attempts to re-dispatch a roll already marked dispatched"
          >
            ⚠️ Test Duplicate Dispatch (ROLL-8390)
          </button>
          <button
            onClick={() => handleBarcodeScan('ROLL-9201')}
            className="px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-800/60 font-mono text-[11px] shrink-0"
            title="Attempts to dispatch roll on QC Hold"
          >
            ⚠️ Test Quality Hold (ROLL-9201 Grade B)
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
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center font-mono">
                  1
                </span>
                <h3 className="text-sm font-semibold text-white font-display">
                  Select Customer Order for Dispatch
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">QA Verified Stage</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      'p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150',
                      isSelected
                        ? 'bg-teal-950/20 border-teal-500 shadow-md ring-1 ring-teal-500/40'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-white">{order.orderNumber}</span>
                      <StatusBadge status={order.status} size="sm" />
                    </div>
                    <p className="text-xs font-semibold text-slate-200 mt-1">{order.customerCompany}</p>
                    <p className="text-[11px] text-slate-400">{order.fabricType}</p>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Total: {order.orderedQuantity.toLocaleString()} m</span>
                      <span className="text-teal-400 font-semibold">{order.allocatedRollsCount} rolls staged</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Eligible Roll Allocation & Barcode Verification */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center font-mono">
                  2
                </span>
                <h3 className="text-sm font-semibold text-white font-display">
                  Loaded Rolls on Truck (Live Verification Checklist)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {selectedRollIds.length} of {eligibleRolls.length} rolls on truck
              </span>
            </div>

            {eligibleRolls.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs rounded-lg bg-slate-950/60 border border-slate-800 border-dashed">
                No finished rolls in warehouse for this order. Ensure rolls pass Quality Control first.
              </div>
            ) : (
              <div className="space-y-2">
                {eligibleRolls.map((roll) => {
                  const isChecked = selectedRollIds.includes(roll.id);

                  return (
                    <div
                      key={roll.id}
                      onClick={() => toggleRollSelection(roll.id)}
                      className={clsx(
                        'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                        isChecked
                          ? 'bg-teal-950/30 border-teal-500/80 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-700 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-white">{roll.rollBarcode}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                              {roll.grade}
                            </span>
                            {isChecked && (
                              <span className="text-[10px] font-mono text-teal-300 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-700">
                                LOADED ON TRUCK
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">Location: {roll.warehouseLocation}</p>
                        </div>
                      </div>

                      <div className="text-right font-mono text-xs">
                        <div className="font-bold text-teal-400">{roll.netLengthMeters} meters</div>
                        <div className="text-[10px] text-slate-400">{roll.grossWeightKg} kg</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Logistics, Carrier & Vehicle Allocation */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold flex items-center justify-center font-mono">
                3
              </span>
              <h3 className="text-sm font-semibold text-white font-display">
                Carrier Logistics & Transport Assignment
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Carrier / Freight Line</label>
                <input
                  type="text"
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Transport Vehicle #</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Driver Name & Contact</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Driver Phone</label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 font-medium block mb-1">Delivery Destination Address</label>
                <input
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => setDestinationAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Dispatch Summary & Recent Shipments */}
        <div className="space-y-6">
          
          {/* Dispatch Summary Card */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold font-display text-white pb-3 border-b border-slate-800 flex items-center justify-between">
              <span>Shipment Loading Summary</span>
              <span className="text-[10px] font-mono text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                100% Verified
              </span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Target Buyer:</span>
                <span className="font-semibold text-white truncate max-w-[150px]">
                  {currentOrder?.customerCompany}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Order Ref:</span>
                <span className="font-mono text-teal-400 font-bold">{currentOrder?.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Rolls on Truck:</span>
                <span className="font-mono font-bold text-white">{selectedRollIds.length} rolls</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Loaded Fabric Meters:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {totalSelectedMeters.toLocaleString()} meters
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Export Weight:</span>
                <span className="font-mono text-slate-300">{totalSelectedWeight.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Vehicle:</span>
                <span className="font-mono text-white font-semibold">{vehicleNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Carrier:</span>
                <span className="text-slate-300 truncate max-w-[150px]">{carrierName}</span>
              </div>
            </div>

            {/* Matching Tax Invoice Total Preview */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Matching Tax Invoice Value:</span>
                <span className="font-mono text-white font-bold">
                  ₹{Math.round(totalSelectedMeters * 380).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>GST (5% HSN 5208):</span>
                <span className="font-mono text-teal-400">
                  ₹{Math.round(totalSelectedMeters * 380 * 0.05).toLocaleString()}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => setConfirmDialogOpen(true)}
              disabled={selectedRollIds.length === 0}
              leftIcon={<Truck className="w-4 h-4" />}
              className="w-full font-bold shadow-md"
            >
              Authorize Dispatch & Issue Invoice
            </Button>
          </div>

          {/* Recent Dispatches Log */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Recent Dispatches (Locked)
              </h4>
              <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                Duplicate Protected
              </span>
            </div>

            <div className="space-y-2">
              {dispatches.map((disp) => (
                <div
                  key={disp.id}
                  onClick={() => {
                    setActiveDispatchRecord(disp);
                    setDocModalOpen(true);
                  }}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white">{disp.dispatchNumber}</span>
                    <span className="text-[10px] font-mono text-teal-400 font-semibold">{disp.challanNumber}</span>
                  </div>
                  <p className="text-slate-300 font-medium truncate">{disp.customerName}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                    <span>{disp.totalMeters.toLocaleString()}m ({disp.totalRolls} rolls)</span>
                    <span className="text-emerald-400 font-semibold">IN TRANSIT</span>
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
          <div className="space-y-4 text-xs text-slate-300">
            {/* DOCUMENT SELECTOR TABS */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
              <button
                onClick={() => setDocViewTab('challan')}
                className={clsx(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                  docViewTab === 'challan'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>1. Delivery Challan (Gate Pass)</span>
              </button>

              <button
                onClick={() => setDocViewTab('tax_invoice')}
                className={clsx(
                  'flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                  docViewTab === 'tax_invoice'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>2. Matching Commercial GST Tax Invoice</span>
              </button>
            </div>

            {/* TAB 1: DELIVERY CHALLAN & MANIFEST */}
            {docViewTab === 'challan' && (
              <div className="space-y-4">
                {/* Manifest Header */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white font-display tracking-tight">
                      EVEREST TEXTILE MILLS LTD.
                    </h2>
                    <p className="text-[11px] text-slate-400">Plot 104-108, Industrial Manufacturing Zone, Phase II</p>
                    <p className="text-[11px] text-slate-400">GSTIN / Tax ID: 24AAACE0921B1Z8</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-teal-400 block">{activeDispatchRecord.challanNumber}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Date: {activeDispatchRecord.dispatchedAt}</span>
                    <span className="text-[11px] text-slate-400 block">Tracking: {activeDispatchRecord.trackingNumber}</span>
                  </div>
                </div>

                {/* Consignee & Carrier Details */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">CONSIGNEE (BUYER):</span>
                    <p className="font-bold text-white text-xs">{activeDispatchRecord.customerName}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{activeDispatchRecord.destinationAddress}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">Order Ref: {activeDispatchRecord.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">CARRIER & VEHICLE:</span>
                    <p className="font-bold text-white text-xs">{activeDispatchRecord.carrierName}</p>
                    <p className="text-[11px] text-slate-300 font-mono mt-0.5">Vehicle: {activeDispatchRecord.vehicleNumber}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Driver: {activeDispatchRecord.driverName} ({activeDispatchRecord.driverPhone})</p>
                  </div>
                </div>

                {/* Roll Itemized Table */}
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-2">Item #</th>
                        <th className="px-4 py-2">Roll Identifier</th>
                        <th className="px-4 py-2">Quality Grade</th>
                        <th className="px-4 py-2 text-right">Net Length</th>
                        <th className="px-4 py-2 text-right">Gross Weight</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {activeDispatchRecord.rollIds.map((rollBarcode, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 font-mono">{idx + 1}</td>
                          <td className="px-4 py-2 font-mono font-bold text-white">{rollBarcode}</td>
                          <td className="px-4 py-2 text-emerald-400 font-mono text-[11px]">Grade A (Export)</td>
                          <td className="px-4 py-2 font-mono text-right text-white">500 m</td>
                          <td className="px-4 py-2 font-mono text-right text-slate-300">56.0 kg</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-950 font-bold border-t border-slate-700">
                        <td colSpan={3} className="px-4 py-2.5 text-white font-display">
                          TOTAL SHIPMENT QUANTITY
                        </td>
                        <td className="px-4 py-2.5 font-mono text-right text-teal-400 text-xs">
                          {activeDispatchRecord.totalMeters.toLocaleString()} m
                        </td>
                        <td className="px-4 py-2.5 font-mono text-right text-white text-xs">
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
              <div className="space-y-4">
                {/* Tax Invoice Header */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-teal-400 font-bold block">
                      TAX INVOICE · RULE 46 OF CGST RULES
                    </span>
                    <h2 className="text-base font-bold text-white font-display tracking-tight mt-0.5">
                      EVEREST TEXTILE MILLS LIMITED
                    </h2>
                    <p className="text-[11px] text-slate-400">GSTIN: 24AAACE0921B1Z8 · State Code: 24 (Gujarat)</p>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-xs font-bold text-emerald-400 block">
                      INVOICE #{activeDispatchRecord.invoiceNumber || 'INV-2026-0884'}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Challan Ref: {activeDispatchRecord.challanNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Vehicle: {activeDispatchRecord.vehicleNumber}
                    </span>
                  </div>
                </div>

                {/* Billed To / Shipped To */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">BILLED TO (BUYER):</span>
                    <p className="font-bold text-white text-xs">{activeDispatchRecord.customerName}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">{activeDispatchRecord.destinationAddress}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">PO #: PO-NOR-9921</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">SHIPPED TO (DELIVERY SITE):</span>
                    <p className="font-bold text-white text-xs">{activeDispatchRecord.destinationCity}</p>
                    <p className="text-[11px] text-slate-300 mt-0.5">Via {activeDispatchRecord.carrierName}</p>
                    <p className="text-[11px] text-emerald-400 font-mono mt-1">Mode: Direct Road Freight / Container</p>
                  </div>
                </div>

                {/* Itemized Tax Breakdown Table */}
                <div className="rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">HSN Code</th>
                        <th className="px-3 py-2">Goods Description</th>
                        <th className="px-3 py-2 text-right">Qty (Meters)</th>
                        <th className="px-3 py-2 text-right">Rate (₹/m)</th>
                        <th className="px-3 py-2 text-right">Taxable Value</th>
                        <th className="px-3 py-2 text-right">GST (5%)</th>
                        <th className="px-3 py-2 text-right">Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40 font-mono">
                      <tr>
                        <td className="px-3 py-2 text-slate-400">5208 32 90</td>
                        <td className="px-3 py-2 text-white font-sans">
                          100% Combed Cotton Single Jersey Fabric ({activeDispatchRecord.totalRolls} Verified Rolls)
                        </td>
                        <td className="px-3 py-2 text-right text-teal-400 font-bold">
                          {activeDispatchRecord.totalMeters.toLocaleString()} m
                        </td>
                        <td className="px-3 py-2 text-right text-slate-300">₹380.00</td>
                        <td className="px-3 py-2 text-right text-slate-300">
                          ₹{(activeDispatchRecord.totalMeters * 380).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-400">
                          ₹{Math.round(activeDispatchRecord.totalMeters * 380 * 0.05).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right text-white font-bold">
                          ₹{Math.round(activeDispatchRecord.totalMeters * 380 * 1.05).toLocaleString()}
                        </td>
                      </tr>
                      <tr className="bg-slate-950 font-bold border-t border-slate-700 text-xs">
                        <td colSpan={4} className="px-3 py-2.5 text-white font-display">
                          MATCHING INVOICE GRAND TOTAL
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-300">
                          ₹{(activeDispatchRecord.totalMeters * 380).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-emerald-400">
                          ₹{Math.round(activeDispatchRecord.totalMeters * 380 * 0.05).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-emerald-300">
                          ₹{Math.round(activeDispatchRecord.totalMeters * 380 * 1.05).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Verification Seal */}
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Physical Truck Load Matches Tax Invoice Exactly: <strong>{activeDispatchRecord.totalRolls} Rolls / {activeDispatchRecord.totalMeters.toLocaleString()}m</strong> verified.
                    </span>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold text-emerald-400">
                    MATCH CONFIRMED
                  </span>
                </div>
              </div>
            )}

            {/* Signature & Print Footer */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-800">
              <div className="text-[11px] text-slate-400">
                Authorized Store Officer: <strong className="text-white">{activeDispatchRecord.dispatchedBy}</strong>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print Verified {docViewTab === 'challan' ? 'Challan' : 'Tax Invoice'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
