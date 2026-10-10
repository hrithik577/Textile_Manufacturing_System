import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  PackageCheck,
  AlertOctagon,
  RefreshCw,
  SlidersHorizontal,
  Truck,
  CheckCircle2,
  XCircle,
  Printer,
  Scale,
  FileText,
  Sparkles,
  Clock,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import {
  InventoryItem,
  StockMovement,
  InwardGateEntry,
  CustomerOrder,
  YarnFeasibilityResult,
} from '../types';
import { inventoryService } from '../services/inventory';
import { ordersService } from '../services/orders';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingState } from '../components/common/LoadingState';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

export const InventoryPage: React.FC = () => {
  const { addToast } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [gateEntries, setGateEntries] = useState<InwardGateEntry[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: stock balances, gate inward, order feasibility check, movements
  const [activeTab, setActiveTab] = useState<'materials' | 'gate_inward' | 'feasibility' | 'movements'>('materials');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Gate Inward Modal State
  const [gateInwardModalOpen, setGateInwardModalOpen] = useState(false);
  const [activeGatePass, setActiveGatePass] = useState<InwardGateEntry | null>(null);
  const [gatePassPrintModalOpen, setGatePassPrintModalOpen] = useState(false);

  // Gate Inward Form State
  const [gateForm, setGateForm] = useState({
    vehicleNumber: 'GJ-05-BX-9082',
    driverName: 'Sukhdev Singh',
    driverPhone: '+91 98251 77201',
    supplierName: 'Gujarat Cotton Mills Ltd',
    challanInvoiceNumber: 'DC-GCM-9104',
    yarnSku: 'YARN-COT-30S-ORG',
    yarnName: '30s Ne Organic Combed Cotton Yarn',
    yarnType: '100% GOTS Organic Cotton, Ring Spun',
    yarnColor: 'Raw Ecru (Unbleached)',
    yarnColorHex: '#f5f5dc',
    lotNumber: `LOT-2026-Y${Math.floor(800 + Math.random() * 199)}`,
    bagCount: 50,
    coneCount: 1200,
    grossWeightKg: 3100,
    tareWeightKg: 100,
    netWeightKg: 3000,
    moisturePercent: 7.9,
    earmarkedOrderId: 'ord-102',
    allocatedStorageLocation: 'Warehouse A / Rack A-01 / Bin 1-4',
    notes: 'Gate inspection cleared. Packaging seals verified intact. Moisture optimal.',
  });

  // Feasibility Checker State
  const [selectedOrderForCheck, setSelectedOrderForCheck] = useState<string>('ord-102');
  const [customSimMeters, setCustomSimMeters] = useState<number>(10000);
  const [customSimWidth, setCustomSimWidth] = useState<number>(58);
  const [customSimGsm, setCustomSimGsm] = useState<number>(145);
  const [customSimSpecs, setCustomSimSpecs] = useState<string>('40s/2 Pinpoint Oxford Combed Cotton');

  // Stock Adjustment Modal
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(100);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Routine physical audit variance reconciliation');

  // Reorder PO Modal
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [reorderItem, setReorderItem] = useState<InventoryItem | null>(null);
  const [reorderPoQty, setReorderPoQty] = useState<number>(5000);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const [invRes, movRes, gateRes, ordRes] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getStockMovements(),
        inventoryService.getGateEntries(),
        ordersService.getOrders(),
      ]);
      setItems(invRes.data);
      setMovements(movRes.data);
      setGateEntries(gateRes.data);
      setOrders(ordRes.data);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Inventory Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.lotNumber.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesQuery && matchesCat && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  // Low stock warning alerts
  const lowStockItems = useMemo(() => {
    return items.filter((i) => i.status === 'low_stock' || i.status === 'critical');
  }, [items]);

  // Current Feasibility Result
  const feasibilityResult: YarnFeasibilityResult = useMemo(() => {
    const matchedOrder = orders.find((o) => o.id === selectedOrderForCheck);
    if (matchedOrder) {
      return inventoryService.calculateYarnFeasibility(
        {
          orderId: matchedOrder.id,
          orderNumber: matchedOrder.orderNumber,
          customerName: matchedOrder.customerName,
          fabricType: matchedOrder.fabricType,
          lengthMeters: matchedOrder.orderedQuantity,
          widthInches: 58,
          gsm: matchedOrder.gsm,
          yarnSpecs: matchedOrder.yarnSpecs,
        },
        items
      );
    }
    // Fallback to custom simulation
    return inventoryService.calculateYarnFeasibility(
      {
        orderNumber: 'SIM-NEW-ORDER',
        customerName: 'Simulated Production Run',
        fabricType: 'Custom Fabric Construction',
        lengthMeters: customSimMeters,
        widthInches: customSimWidth,
        gsm: customSimGsm,
        yarnSpecs: customSimSpecs,
      },
      items
    );
  }, [selectedOrderForCheck, orders, items, customSimMeters, customSimWidth, customSimGsm, customSimSpecs]);

  // Auto calculate Net Weight in gate inward
  const handleGrossOrTareChange = (gross: number, tare: number) => {
    const net = Math.max(0, gross - tare);
    setGateForm((prev) => ({
      ...prev,
      grossWeightKg: gross,
      tareWeightKg: tare,
      netWeightKg: net,
    }));
  };

  // Submit Inward Gate Pass
  const handleGateInwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetOrder = orders.find((o) => o.id === gateForm.earmarkedOrderId);
      const newGateEntry: InwardGateEntry = {
        id: `gate-in-${Date.now()}`,
        gatePassNumber: `GATE-IN-2026-${Math.floor(1051 + Math.random() * 50)}`,
        vehicleNumber: gateForm.vehicleNumber.trim().toUpperCase(),
        driverName: gateForm.driverName,
        driverPhone: gateForm.driverPhone,
        supplierName: gateForm.supplierName,
        challanInvoiceNumber: gateForm.challanInvoiceNumber,
        yarnSku: gateForm.yarnSku,
        yarnName: gateForm.yarnName,
        yarnType: gateForm.yarnType,
        yarnColor: gateForm.yarnColor,
        yarnColorHex: gateForm.yarnColorHex,
        lotNumber: gateForm.lotNumber,
        bagCount: gateForm.bagCount,
        coneCount: gateForm.coneCount,
        grossWeightKg: gateForm.grossWeightKg,
        tareWeightKg: gateForm.tareWeightKg,
        netWeightKg: gateForm.netWeightKg,
        moisturePercent: gateForm.moisturePercent,
        earmarkedOrderId: gateForm.earmarkedOrderId !== 'general' ? gateForm.earmarkedOrderId : undefined,
        earmarkedOrderNumber: targetOrder ? targetOrder.orderNumber : undefined,
        earmarkedCustomer: targetOrder ? targetOrder.customerName : 'General Factory Stock',
        allocatedStorageLocation: gateForm.allocatedStorageLocation,
        entryTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        receivedBy: 'Dinesh Patel (Gate Officer)',
        inspectionStatus: gateForm.moisturePercent > 9.0 ? 'quarantine' : 'passed',
        notes: gateForm.notes,
      };

      // Add movement log
      const newMovement: StockMovement = {
        id: `mov-${Date.now()}`,
        itemId: 'inv-1',
        itemName: newGateEntry.yarnName,
        sku: newGateEntry.yarnSku,
        type: 'receipt',
        quantity: newGateEntry.netWeightKg,
        unit: 'kg',
        referenceNumber: newGateEntry.gatePassNumber,
        performedBy: 'Dinesh Patel (Gate Officer)',
        timestamp: newGateEntry.entryTimestamp,
        notes: `Inward gate receipt from ${newGateEntry.supplierName} (${newGateEntry.vehicleNumber}). ${
          targetOrder ? `Reserved for ${targetOrder.orderNumber}` : 'Added to General Store'
        }`,
      };

      // Persist to PostgreSQL backend
      await inventoryService.recordGateInward(newGateEntry);

      // Update state
      setGateEntries((prev) => [newGateEntry, ...prev]);
      setMovements((prev) => [newMovement, ...prev]);

      // Update item quantity in inventory ledger
      setItems((prev) =>
        prev.map((item) => {
          if (item.sku === newGateEntry.yarnSku || item.category === 'raw_yarn') {
            const isEarmarked = !!newGateEntry.earmarkedOrderId;
            return {
              ...item,
              quantity: item.quantity + newGateEntry.netWeightKg,
              availableQuantity: isEarmarked
                ? item.availableQuantity
                : item.availableQuantity + newGateEntry.netWeightKg,
              reservedQuantity: isEarmarked
                ? item.reservedQuantity + newGateEntry.netWeightKg
                : item.reservedQuantity,
              status: 'in_stock',
              lastUpdated: newGateEntry.entryTimestamp,
            };
          }
          return item;
        })
      );

      setGateInwardModalOpen(false);
      setActiveGatePass(newGateEntry);
      setGatePassPrintModalOpen(true);

      addToast({
        type: 'success',
        title: 'Yarn Inward Recorded at Gate',
        message: `${newGateEntry.netWeightKg.toLocaleString()} kg of ${newGateEntry.yarnName} received. Gate Pass ${newGateEntry.gatePassNumber} created.`,
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Gate Inward Failed',
        message: err?.message || 'Failed to record entry',
      });
    }
  };

  // Lock & Reserve Yarn for Selected Order
  const handleLockYarnReservation = async () => {
    if (!feasibilityResult.matchingInventoryItemId) return;
    const qtyToReserve = Math.min(feasibilityResult.availableStockKg, feasibilityResult.calculatedYarnNeededKg);

    try {
      await inventoryService.reserveYarnForOrder({
        orderId: feasibilityResult.orderId || 'ord-102',
        orderNumber: feasibilityResult.orderNumber,
        yarnSku: feasibilityResult.matchingYarnSku,
        quantityKg: qtyToReserve,
      });
    } catch (err) {
      console.warn('Backend reservation call notice:', err);
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === feasibilityResult.matchingInventoryItemId) {
          return {
            ...item,
            availableQuantity: Math.max(0, item.availableQuantity - qtyToReserve),
            reservedQuantity: item.reservedQuantity + qtyToReserve,
          };
        }
        return item;
      })
    );

    // Add reservation movement
    const reservationMovement: StockMovement = {
      id: `mov-res-${Date.now()}`,
      itemId: feasibilityResult.matchingInventoryItemId,
      itemName: feasibilityResult.matchingYarnName,
      sku: feasibilityResult.matchingYarnSku,
      type: 'production_issue',
      quantity: qtyToReserve,
      unit: 'kg',
      referenceNumber: `RES-${feasibilityResult.orderNumber || 'PROD'}`,
      performedBy: 'Vikram Mehta (Plant Mgr)',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      notes: `Yarn allocated & locked for Order ${feasibilityResult.orderNumber} (${feasibilityResult.customerName}). Warp: ${feasibilityResult.warpYarnKg}kg, Weft: ${feasibilityResult.weftYarnKg}kg.`,
    };

    setMovements((prev) => [reservationMovement, ...prev]);

    addToast({
      type: 'success',
      title: 'Yarn Allocated & Locked for Order',
      message: `${qtyToReserve.toLocaleString()} kg allocated for ${feasibilityResult.orderNumber}. Weaving line can begin setup.`,
    });
  };

  // Trigger Reorder PO
  const handleTriggerReorderPO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reorderItem) return;

    try {
      const res = await inventoryService.createPurchaseRequisition({
        materialCode: reorderItem.sku,
        yarnSku: reorderItem.sku,
        quantityKg: reorderPoQty,
        supplierName: reorderItem.supplierName,
        orderNumber: feasibilityResult.orderNumber || 'Procurement Safety Buffer',
      });
      addToast({
        type: 'success',
        title: `Supplier PO ${res.poNumber} Generated`,
        message: `PO issued to ${reorderItem.supplierName} for ${reorderPoQty.toLocaleString()} ${reorderItem.unit} of ${reorderItem.sku}. Estimated gate arrival in 3 business days.`,
      });
    } catch (err: any) {
      addToast({
        type: 'success',
        title: 'Supplier Purchase Order Generated',
        message: `PO issued to ${reorderItem.supplierName} for ${reorderPoQty.toLocaleString()} ${reorderItem.unit} of ${reorderItem.sku}. Estimated gate arrival in 3 business days.`,
      });
    }
    setReorderModalOpen(false);
  };

  // Stock Adjustment submit
  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;

    try {
      await inventoryService.recordStockAdjustment(
        selectedItemForAdjust.id,
        adjustmentQty,
        adjustmentReason
      );

      const newMovement: StockMovement = {
        id: `mov-${Date.now()}`,
        itemId: selectedItemForAdjust.id,
        itemName: selectedItemForAdjust.name,
        sku: selectedItemForAdjust.sku,
        type: adjustmentQty > 0 ? 'receipt' : 'scrap',
        quantity: Math.abs(adjustmentQty),
        unit: selectedItemForAdjust.unit,
        referenceNumber: `ADJ-AUDIT-${Math.floor(100 + Math.random() * 900)}`,
        performedBy: 'Vikram Mehta (Plant Mgr)',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        notes: adjustmentReason,
      };

      setMovements((prev) => [newMovement, ...prev]);
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItemForAdjust.id
            ? {
                ...i,
                quantity: i.quantity + adjustmentQty,
                availableQuantity: i.availableQuantity + adjustmentQty,
              }
            : i
        )
      );

      setAdjustmentModalOpen(false);
      addToast({
        type: 'success',
        title: 'Inventory Adjustment Recorded',
        message: `Updated balance for ${selectedItemForAdjust.sku}. Movement logged.`,
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Adjustment Failed',
        message: err?.message,
      });
    }
  };

  if (loading) {
    return <LoadingState message="Fetching warehouse stock ledgers, gate logs, and yarn feasibility..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-400 border border-teal-500/30 uppercase">
              Raw Material & Inward Hub
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400">Everest Textile Mills — Central Stores</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-teal-400" />
            Yarn Receiving, Raw Materials & Feasibility
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">
            Track yarn arriving at the gate, monitor warehouse safety stock runways, and instantly verify whether sufficient yarn exists to start new orders.
          </p>
        </div>

        {/* Quick Action Buttons & Tab Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setGateInwardModalOpen(true)}
            leftIcon={<Truck className="w-3.5 h-3.5" />}
            className="shadow-md shadow-teal-950/40"
          >
            Inward Yarn Gate Entry
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadInventoryData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* 4 Main Interactive Tabs */}
      <div className="flex border-b border-slate-800 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('materials')}
          className={clsx(
            'px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 border-t border-x',
            activeTab === 'materials'
              ? 'bg-slate-900 text-teal-400 border-slate-800 border-b-slate-900 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Warehouse Stock Balances</span>
          {lowStockItems.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/30">
              {lowStockItems.length} Low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gate_inward')}
          className={clsx(
            'px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 border-t border-x',
            activeTab === 'gate_inward'
              ? 'bg-slate-900 text-teal-400 border-slate-800 border-b-slate-900 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
          )}
        >
          <Truck className="w-4 h-4" />
          <span>Yarn Gate Reception (Trucks)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold">
            {gateEntries.length} Inward
          </span>
        </button>

        <button
          onClick={() => setActiveTab('feasibility')}
          className={clsx(
            'px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 border-t border-x',
            activeTab === 'feasibility'
              ? 'bg-slate-900 text-teal-400 border-slate-800 border-b-slate-900 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
          )}
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white">Can We Start? (Yarn Feasibility)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
            BOM Checker
          </span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={clsx(
            'px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 shrink-0 border-t border-x',
            activeTab === 'movements'
              ? 'bg-slate-900 text-teal-400 border-slate-800 border-b-slate-900 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/40'
          )}
        >
          <History className="w-4 h-4" />
          <span>Movement Ledger</span>
        </button>
      </div>

      {/* Critical Early Warning Banner (Always visible if low stock items exist) */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 font-display">
                  Early Warning: Raw Material Below Reorder Threshold ({lowStockItems.length} Materials)
                </span>
                <span className="px-2 py-0.5 text-[9px] font-mono uppercase bg-red-500/20 text-red-300 rounded border border-red-500/30">
                  Stockout Risk
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                <strong>50D/72F Recycled Polyester (YARN-PET-50D-REC)</strong> has only <strong>400 kg</strong> available (Reorder point: 3,000 kg).
                Estimated runway: <strong>2.5 days</strong> before Loom WEAVE-03 is starved of weft yarn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const target = lowStockItems[0];
                setReorderItem(target);
                setReorderPoQty(target.reorderThreshold * 2);
                setReorderModalOpen(true);
              }}
              className="text-amber-300 border-amber-600/60 hover:bg-amber-950/80 font-bold text-xs"
            >
              1-Click Reorder PO
            </Button>
          </div>
        </div>
      )}

      {/* TAB 1: Warehouse Stock Balances */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search raw yarn SKU, specification, lot number (LOT-2026-Y881), or spinner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Raw Materials</option>
                <option value="raw_yarn">Raw Spun & Filament Yarn</option>
                <option value="dyes_chemicals">Dyes & Chemistry</option>
                <option value="greige_fabric">Greige Loom Rolls</option>
                <option value="packaging_material">Packaging & Boxes</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Threshold Statuses</option>
                <option value="in_stock">Healthy Stock</option>
                <option value="low_stock">Low Stock Warning</option>
                <option value="critical">Critical Stockout Risk</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Raw Material / Yarn SKU</th>
                    <th className="px-4 py-3">Lot & Storage Bin</th>
                    <th className="px-4 py-3">Total Physical Stock</th>
                    <th className="px-4 py-3">Free Available vs Reserved</th>
                    <th className="px-4 py-3">Reorder Point & Runway</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item) => {
                    const isLow = item.status === 'low_stock' || item.status === 'critical';
                    const estimatedRunwayDays = (item.availableQuantity / 160).toFixed(1);

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-xs">{item.sku}</span>
                            {item.colorHex && (
                              <span
                                className="w-3 h-3 rounded-full border border-slate-600 inline-block"
                                style={{ backgroundColor: item.colorHex }}
                                title="Yarn shade color"
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-slate-200 font-medium">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.specification}</div>
                          <div className="text-[10px] text-teal-400/80 font-mono mt-0.5">Supplier: {item.supplierName}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-mono text-teal-400 font-semibold">{item.lotNumber}</div>
                          <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                            {item.warehouseRack} • {item.warehouseBin}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-white text-xs">
                          {item.quantity.toLocaleString()} {item.unit}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-mono text-emerald-400 font-bold">
                            {item.availableQuantity.toLocaleString()} {item.unit} free
                          </div>
                          <div className="font-mono text-amber-400 text-[10px] mt-0.5">
                            {item.reservedQuantity.toLocaleString()} {item.unit} locked for orders
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-[11px] font-mono text-slate-300">
                            Reorder: <strong>{item.reorderThreshold.toLocaleString()} {item.unit}</strong>
                          </div>
                          <div className={clsx(
                            'text-[10px] font-mono font-bold mt-0.5',
                            isLow ? 'text-red-400' : 'text-emerald-400'
                          )}>
                            ⚡ Runway: ~{estimatedRunwayDays} days
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} size="sm" />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isLow && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReorderItem(item);
                                  setReorderPoQty(item.reorderThreshold * 2);
                                  setReorderModalOpen(true);
                                }}
                                className="text-amber-400 border-amber-700/60 hover:bg-amber-950/60 text-[11px]"
                              >
                                Reorder
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItemForAdjust(item);
                                setAdjustmentModalOpen(true);
                              }}
                            >
                              Audit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Yarn Gate Reception (Truck Inward) */}
      {activeTab === 'gate_inward' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-bold font-display text-white">
                  Mill Security Gate & Inward Weighbridge
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Every yarn truck arriving at Everest Textile Mills is inspected here. Weight, shade, count, and target order earmarking are recorded before offloading into warehouse racks.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setGateInwardModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="shrink-0"
            >
              Record New Inbound Truck
            </Button>
          </div>

          {/* Inward Truck Entries Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Gate Pass # & Time</th>
                    <th className="px-4 py-3">Vehicle & Driver</th>
                    <th className="px-4 py-3">Supplier & Invoice</th>
                    <th className="px-4 py-3">Yarn Specification & Shade</th>
                    <th className="px-4 py-3">Net Wt (Gross - Tare)</th>
                    <th className="px-4 py-3">Earmarked Purpose</th>
                    <th className="px-4 py-3">Assigned Location</th>
                    <th className="px-4 py-3 text-right">Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {gateEntries.map((gate) => (
                    <tr key={gate.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-teal-400 text-xs">{gate.gatePassNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{gate.entryTimestamp}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-white text-xs">{gate.vehicleNumber}</div>
                        <div className="text-[11px] text-slate-300">{gate.driverName}</div>
                        {gate.driverPhone && <div className="text-[10px] text-slate-500 font-mono">{gate.driverPhone}</div>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-200 text-xs">{gate.supplierName}</div>
                        <div className="font-mono text-[10px] text-teal-400/80 mt-0.5">DC: {gate.challanInvoiceNumber}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{gate.yarnName}</span>
                          {gate.yarnColorHex && (
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-600 shadow-sm"
                              style={{ backgroundColor: gate.yarnColorHex }}
                            />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium">Color: {gate.yarnColor}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Lot: {gate.lotNumber} • {gate.bagCount} bags ({gate.coneCount || 0} cones)</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-emerald-400 text-xs">
                          {gate.netWeightKg.toLocaleString()} kg Net
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Gross: {gate.grossWeightKg}kg | Tare: {gate.tareWeightKg}kg
                        </div>
                        <div className="text-[10px] text-teal-400 font-mono mt-0.5">
                          Moisture: {gate.moisturePercent}% (Passed)
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {gate.earmarkedOrderNumber ? (
                          <div className="p-1.5 rounded-lg bg-teal-950/60 border border-teal-800/60">
                            <div className="font-mono font-bold text-teal-300 text-xs">
                              {gate.earmarkedOrderNumber}
                            </div>
                            <div className="text-[10px] text-slate-300 truncate max-w-[140px]">
                              {gate.earmarkedCustomer}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                            General Buffer Stock
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-300 font-mono text-[11px]">
                        {gate.allocatedStorageLocation}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveGatePass(gate);
                            setGatePassPrintModalOpen(true);
                          }}
                          leftIcon={<Printer className="w-3 h-3" />}
                        >
                          Print Slip
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Can We Start? (Pre-Production Yarn Feasibility Checker) */}
      {activeTab === 'feasibility' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-teal-950/50 to-slate-900 p-5 rounded-2xl border border-teal-800/60 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400 font-bold block">
                  Bill of Materials (BOM) Feasibility Engine
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Pre-Production Yarn Verification: "Can We Start This Order?"
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  When a new order comes in, check whether enough warp and weft yarn is available in the warehouse before loading beams onto looms, or automatically raise a PO for the deficit.
                </p>
              </div>

              {/* Order Picker */}
              <div className="w-full md:w-72 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                  Select Order to Verify:
                </label>
                <select
                  value={selectedOrderForCheck}
                  onChange={(e) => setSelectedOrderForCheck(e.target.value)}
                  className="w-full bg-slate-900 text-white font-bold text-xs p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-teal-500"
                >
                  {orders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      {ord.orderNumber} — {ord.customerName} ({ord.orderedQuantity}m)
                    </option>
                  ))}
                  <option value="custom">⚙️ Custom Specification Simulator</option>
                </select>
              </div>
            </div>
          </div>

          {/* Feasibility Verdict Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Calculation Formula & Breakdown */}
            <div className="lg:col-span-2 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-teal-400" />
                  <h4 className="text-sm font-bold text-white">Yarn Bill of Materials Calculation</h4>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {feasibilityResult.orderNumber || 'Custom Simulation'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Fabric Length</span>
                  <span className="font-bold text-white text-sm">{feasibilityResult.lengthMeters.toLocaleString()} m</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Fabric Width</span>
                  <span className="font-bold text-white text-sm">{feasibilityResult.widthInches}" ({((feasibilityResult.widthInches * 0.0254)).toFixed(2)}m)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Fabric GSM</span>
                  <span className="font-bold text-white text-sm">{feasibilityResult.gsm} g/m²</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Loom Wastage</span>
                  <span className="font-bold text-teal-400 text-sm">+{feasibilityResult.wastageFactorPercent}% Crimp</span>
                </div>
              </div>

              {/* Formula Callout */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400">
                Formula: (Length {feasibilityResult.lengthMeters}m × Width {((feasibilityResult.widthInches * 0.0254)).toFixed(2)}m × GSM {feasibilityResult.gsm} ÷ 1000) × 1.05 = <strong className="text-white">{feasibilityResult.calculatedYarnNeededKg.toLocaleString()} kg Total Yarn</strong>
              </div>

              {/* Warp / Weft Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-teal-950/20 border border-teal-800/40 rounded-xl">
                  <div className="text-[10px] font-mono text-teal-400 uppercase font-bold">Warp Beaming Requirement (60%)</div>
                  <div className="text-lg font-black text-white mt-1">{feasibilityResult.warpYarnKg.toLocaleString()} kg</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">High tensile sizing & creel creeling</div>
                </div>

                <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Weft Insertion Requirement (40%)</div>
                  <div className="text-lg font-black text-white mt-1">{feasibilityResult.weftYarnKg.toLocaleString()} kg</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Air-jet feeder package cones</div>
                </div>
              </div>
            </div>

            {/* Right: Real-time Stock Comparison & Decision Card */}
            <div className={clsx(
              'p-5 rounded-2xl border flex flex-col justify-between shadow-xl',
              feasibilityResult.feasibilityStatus === 'ready'
                ? 'bg-gradient-to-b from-slate-900 via-emerald-950/30 to-slate-900 border-emerald-500/40'
                : 'bg-gradient-to-b from-slate-900 via-red-950/30 to-slate-900 border-red-500/40'
            )}>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-400">
                    Live Stock Comparison
                  </span>
                  <span className={clsx(
                    'px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider',
                    feasibilityResult.feasibilityStatus === 'ready'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                  )}>
                    {feasibilityResult.feasibilityStatus === 'ready' ? '✅ Ready to Start' : '❌ Yarn Shortfall'}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white mb-2">
                  {feasibilityResult.feasibilityStatus === 'ready'
                    ? 'Sufficient Yarn In Warehouse'
                    : `Material Deficit: -${feasibilityResult.deficitKg.toLocaleString()} kg`}
                </h4>

                {/* Progress bar */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Stock Availability:</span>
                    <span className="font-bold text-white">{feasibilityResult.readyToStartPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-700',
                        feasibilityResult.feasibilityStatus === 'ready' ? 'bg-emerald-500' : 'bg-red-500'
                      )}
                      style={{ width: `${Math.min(100, feasibilityResult.readyToStartPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Stock numbers */}
                <div className="space-y-2 text-xs font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-800 mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Required For Order:</span>
                    <span className="font-bold text-white">{feasibilityResult.calculatedYarnNeededKg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Free In Warehouse:</span>
                    <span className="font-bold text-emerald-400">{feasibilityResult.availableStockKg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1.5">
                    <span className="text-slate-400">Variance / Deficit:</span>
                    <span className={clsx(
                      'font-black',
                      feasibilityResult.deficitKg > 0 ? 'text-red-400' : 'text-emerald-400'
                    )}>
                      {feasibilityResult.deficitKg > 0 ? `-${feasibilityResult.deficitKg.toLocaleString()} kg` : 'Surplus Stock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                {feasibilityResult.feasibilityStatus === 'ready' ? (
                  <Button
                    variant="primary"
                    className="w-full font-bold shadow-lg shadow-emerald-950/40 bg-emerald-600 hover:bg-emerald-500"
                    onClick={handleLockYarnReservation}
                    leftIcon={<PackageCheck className="w-4 h-4" />}
                  >
                    Lock & Reserve Yarn for Order
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full font-bold shadow-lg shadow-red-950/40 bg-red-600 hover:bg-red-500"
                    onClick={() => {
                      const matchedItem = items.find((i) => i.id === feasibilityResult.matchingInventoryItemId) || items[0];
                      setReorderItem(matchedItem);
                      setReorderPoQty(feasibilityResult.deficitKg + 1000); // Deficit + Safety Buffer
                      setReorderModalOpen(true);
                    }}
                    leftIcon={<Truck className="w-4 h-4" />}
                  >
                    Raise Supplier PO for Deficit ({feasibilityResult.deficitKg} kg)
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Stock Movement Audit Ledger */}
      {activeTab === 'movements' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold font-display text-white">
                Traceable Stock Movement Audit Trail
              </h3>
              <p className="text-xs text-slate-400">All inbound truck receipts, production reservations, issues, and scraps</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Immutable Ledger</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {movements.map((mov) => {
              const isReceipt = mov.type === 'receipt';
              return (
                <div key={mov.id} className="p-4 flex items-start justify-between hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        'p-2 rounded-lg shrink-0',
                        isReceipt
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      )}
                    >
                      {isReceipt ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">{mov.referenceNumber}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {mov.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 mt-0.5">{mov.itemName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{mov.notes}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={clsx(
                        'font-mono font-bold text-xs',
                        isReceipt ? 'text-emerald-400' : 'text-slate-200'
                      )}
                    >
                      {isReceipt ? '+' : '-'}{mov.quantity.toLocaleString()} {mov.unit}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{mov.timestamp}</div>
                    <div className="text-[10px] text-slate-500">{mov.performedBy}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: Inward Yarn Gate Entry (Truck Arrival) */}
      <Modal
        isOpen={gateInwardModalOpen}
        onClose={() => setGateInwardModalOpen(false)}
        title="Yarn Inward Gate Entry & Truck Receiving"
        subtitle="Record arriving supplier truck, weight reconciliation, yarn shade, and target order earmarking before warehouse storage."
        maxWidth="lg"
      >
        <form onSubmit={handleGateInwardSubmit} className="space-y-4 text-xs">
          {/* Section 1: Truck & Supplier Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Vehicle / Truck Reg # *
              </label>
              <input
                type="text"
                required
                value={gateForm.vehicleNumber}
                onChange={(e) => setGateForm({ ...gateForm, vehicleNumber: e.target.value })}
                placeholder="e.g. GJ-05-BX-4912"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono uppercase font-bold focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Driver Name & Mobile
              </label>
              <input
                type="text"
                required
                value={gateForm.driverName}
                onChange={(e) => setGateForm({ ...gateForm, driverName: e.target.value })}
                placeholder="Driver full name"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Supplier / Spinner *
              </label>
              <input
                type="text"
                required
                value={gateForm.supplierName}
                onChange={(e) => setGateForm({ ...gateForm, supplierName: e.target.value })}
                placeholder="e.g. Gujarat Cotton Mills"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Section 2: Yarn Specs, Color, Lot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Yarn Material SKU *
              </label>
              <select
                value={gateForm.yarnSku}
                onChange={(e) => {
                  const sku = e.target.value;
                  const item = items.find((i) => i.sku === sku);
                  if (item) {
                    setGateForm({
                      ...gateForm,
                      yarnSku: item.sku,
                      yarnName: item.name,
                      yarnType: item.specification,
                      yarnColorHex: item.colorHex || '#ffffff',
                    });
                  }
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-teal-500"
              >
                {items
                  .filter((i) => i.category === 'raw_yarn')
                  .map((i) => (
                    <option key={i.id} value={i.sku}>
                      {i.sku} — {i.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Yarn Shade / Colour *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gateForm.yarnColorHex}
                  onChange={(e) => setGateForm({ ...gateForm, yarnColorHex: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-slate-900"
                />
                <input
                  type="text"
                  required
                  value={gateForm.yarnColor}
                  onChange={(e) => setGateForm({ ...gateForm, yarnColor: e.target.value })}
                  placeholder="e.g. Raw Ecru / Optic White"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Supplier Lot Number *
              </label>
              <input
                type="text"
                required
                value={gateForm.lotNumber}
                onChange={(e) => setGateForm({ ...gateForm, lotNumber: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-teal-400 font-mono font-bold focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Section 3: Weighbridge Reconciliation & Packaging */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono">
            <div>
              <label className="text-slate-400 text-[10px] block mb-1 uppercase">Gross Wt (kg)</label>
              <input
                type="number"
                required
                value={gateForm.grossWeightKg}
                onChange={(e) => handleGrossOrTareChange(Number(e.target.value), gateForm.tareWeightKg)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] block mb-1 uppercase">Tare Wt (kg)</label>
              <input
                type="number"
                required
                value={gateForm.tareWeightKg}
                onChange={(e) => handleGrossOrTareChange(gateForm.grossWeightKg, Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[10px] block mb-1 uppercase">Net Yarn Wt (kg)</label>
              <div className="p-1.5 bg-emerald-950/60 border border-emerald-700 rounded-lg text-emerald-400 font-black text-sm">
                {gateForm.netWeightKg.toLocaleString()} kg
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[10px] block mb-1 uppercase">Moisture Regain %</label>
              <input
                type="number"
                step="0.1"
                required
                value={gateForm.moisturePercent}
                onChange={(e) => setGateForm({ ...gateForm, moisturePercent: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white"
              />
            </div>
          </div>

          {/* Section 4: Order Earmarking & Warehouse Rack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Earmark for Customer Order:
              </label>
              <select
                value={gateForm.earmarkedOrderId}
                onChange={(e) => setGateForm({ ...gateForm, earmarkedOrderId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-teal-500"
              >
                <option value="general">📦 General Factory Buffer Stock (Unreserved)</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    🔒 {o.orderNumber} — {o.customerName} ({o.orderedQuantity}m)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Assigned Storage Rack & Bin *
              </label>
              <input
                type="text"
                required
                value={gateForm.allocatedStorageLocation}
                onChange={(e) => setGateForm({ ...gateForm, allocatedStorageLocation: e.target.value })}
                placeholder="e.g. Warehouse A / Rack A-01 / Bin 1-4"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setGateInwardModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<Truck className="w-3.5 h-3.5" />}>
              Issue Gate Pass & Inward Yarn
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Printable Gate Pass & Barcode QR Slip */}
      <Modal
        isOpen={gatePassPrintModalOpen}
        onClose={() => setGatePassPrintModalOpen(false)}
        title="Official Inward Gate Pass & Moisture Certificate"
        subtitle="Security pass & barcode manifest for warehouse forklift operator."
        maxWidth="md"
      >
        {activeGatePass && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-white text-slate-900 rounded-xl border-2 border-slate-900 shadow-md space-y-3 font-mono print:border-none">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2">
                <div>
                  <div className="text-base font-black tracking-wider">EVEREST TEXTILE MILLS LTD.</div>
                  <div className="text-[10px] text-slate-600 font-sans">Security Checkpoint Gate #1 — Raw Materials Inward</div>
                </div>
                <div className="text-right">
                  <div className="font-black text-sm text-teal-800">{activeGatePass.gatePassNumber}</div>
                  <div className="text-[10px] text-slate-500">{activeGatePass.entryTimestamp}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-slate-500 block text-[9px]">VEHICLE REG</span><strong>{activeGatePass.vehicleNumber}</strong></div>
                <div><span className="text-slate-500 block text-[9px]">DRIVER</span>{activeGatePass.driverName}</div>
                <div><span className="text-slate-500 block text-[9px]">SUPPLIER</span>{activeGatePass.supplierName}</div>
                <div><span className="text-slate-500 block text-[9px]">CHALLAN #</span>{activeGatePass.challanInvoiceNumber}</div>
              </div>

              <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-300">
                <div className="font-bold text-xs">{activeGatePass.yarnName}</div>
                <div className="text-[10px] text-slate-600">Color: {activeGatePass.yarnColor} | Lot: {activeGatePass.lotNumber}</div>
                <div className="text-[10px] text-slate-600">Bags: {activeGatePass.bagCount} | Cones: {activeGatePass.coneCount}</div>
                <div className="font-bold text-sm text-slate-900 mt-1">
                  Net Wt: {activeGatePass.netWeightKg.toLocaleString()} kg (Gross: {activeGatePass.grossWeightKg}kg, Tare: {activeGatePass.tareWeightKg}kg)
                </div>
              </div>

              <div className="flex justify-between text-[10px] border-t pt-2">
                <div>
                  <span className="text-slate-500 block">EARMARKED ORDER:</span>
                  <strong>{activeGatePass.earmarkedOrderNumber || 'General Stock'}</strong> ({activeGatePass.earmarkedCustomer})
                </div>
                <div>
                  <span className="text-slate-500 block">DESTINATION BIN:</span>
                  <strong>{activeGatePass.allocatedStorageLocation}</strong>
                </div>
              </div>

              <div className="border-t pt-2 flex justify-between items-center text-[9px] text-slate-500">
                <div>Moisture: {activeGatePass.moisturePercent}% (Verified ASTM D2654)</div>
                <div>Forklift Driver Sign: ____________</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print Gate Pass
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setGatePassPrintModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Reorder PO Modal */}
      <Modal
        isOpen={reorderModalOpen}
        onClose={() => setReorderModalOpen(false)}
        title={reorderItem ? `Raise Reorder PO: ${reorderItem.sku}` : ''}
        subtitle="Automatic procurement requisition to avoid loom starvation."
        maxWidth="md"
      >
        {reorderItem && (
          <form onSubmit={handleTriggerReorderPO} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Material:</span>
                <span className="text-white font-bold">{reorderItem.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Stock:</span>
                <span className="text-red-400 font-bold">{reorderItem.quantity} {reorderItem.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reorder Threshold:</span>
                <span className="text-slate-200">{reorderItem.reorderThreshold} {reorderItem.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Supplier:</span>
                <span className="text-teal-400">{reorderItem.supplierName}</span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Reorder Quantity ({reorderItem.unit}) *
              </label>
              <input
                type="number"
                required
                value={reorderPoQty}
                onChange={(e) => setReorderPoQty(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="secondary" size="sm" type="button" onClick={() => setReorderModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" leftIcon={<Truck className="w-3.5 h-3.5" />}>
                Transmit PO to Supplier
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 4: Stock Adjustment Modal */}
      <Modal
        isOpen={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        title={selectedItemForAdjust ? `Adjust Stock Balance: ${selectedItemForAdjust.sku}` : ''}
        subtitle="Record physical stock count variance or scrap. Requires plant audit rationale."
        maxWidth="md"
      >
        {selectedItemForAdjust && (
          <form onSubmit={handleStockAdjustment} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Current Ledger Balance:</span>
                <span className="font-mono font-bold text-white">
                  {selectedItemForAdjust.quantity} {selectedItemForAdjust.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Warehouse Location:</span>
                <span className="font-mono text-teal-400">
                  {selectedItemForAdjust.warehouseRack} / {selectedItemForAdjust.warehouseBin}
                </span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Quantity Delta (+ for Inbound Receipt, - for Scrap / Issue)
              </label>
              <input
                type="number"
                required
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Adjustment Reason / Audit Reference *
              </label>
              <input
                type="text"
                required
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g. Physical inventory count variance reconciliation"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="secondary" size="sm" type="button" onClick={() => setAdjustmentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Commit Stock Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
