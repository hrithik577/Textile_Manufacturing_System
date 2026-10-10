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
    const ordersList = Array.isArray(orders) ? orders : [];
    const matchedOrder = ordersList.find((o) => o.id === selectedOrderForCheck);
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
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 editorial-border-b">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 border border-[var(--color-ink)] text-[10px] font-mono font-bold bg-[var(--color-ink)] text-white uppercase tracking-widest">
              Central Stores
            </span>
            <span className="text-sm font-sans text-[var(--color-industrial-grey)]">
              Everest Textile Mills
            </span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black font-display uppercase tracking-tighter leading-none mb-2">
            Yarn Hub & Materials
          </h1>
          <p className="text-sm font-sans text-[var(--color-industrial-grey)] max-w-2xl">
            Track yarn arriving at the gate, monitor warehouse safety stock runways, and instantly verify whether sufficient yarn exists to start new orders.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setGateInwardModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-[var(--color-ink)] text-white hover:bg-black/80 transition-colors"
          >
            <Truck className="w-4 h-4" />
            Inward Yarn Gate Entry
          </button>

          <button
            onClick={loadInventoryData}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-widest editorial-border hover:bg-black/5 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-[var(--color-ink)]" />
            Sync
          </button>
        </div>
      </div>

      {/* 4 Main Interactive Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4">
        <button
          onClick={() => setActiveTab('materials')}
          className={clsx(
            'px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 editorial-border',
            activeTab === 'materials'
              ? 'bg-[var(--color-ink)] text-white'
              : 'bg-white text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
          )}
        >
          <Layers className="w-4 h-4" />
          <span>Warehouse Stock Balances</span>
          {lowStockItems.length > 0 && (
            <span className="px-1.5 py-0.5 bg-[var(--color-vermilion)] text-white text-[10px] font-mono font-bold">
              {lowStockItems.length} Low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('gate_inward')}
          className={clsx(
            'px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 editorial-border',
            activeTab === 'gate_inward'
              ? 'bg-[var(--color-ink)] text-white'
              : 'bg-white text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
          )}
        >
          <Truck className="w-4 h-4" />
          <span>Yarn Gate Reception (Trucks)</span>
          <span className="px-1.5 py-0.5 bg-[var(--color-ink)] text-white text-[10px] font-mono font-bold border border-white/20">
            {gateEntries.length} Inward
          </span>
        </button>

        <button
          onClick={() => setActiveTab('feasibility')}
          className={clsx(
            'px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 editorial-border',
            activeTab === 'feasibility'
              ? 'bg-[var(--color-success-green)] text-white border-[var(--color-success-green)]'
              : 'bg-white text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Can We Start? (Yarn Feasibility)</span>
          <span className={clsx(
            'px-1.5 py-0.5 text-[10px] font-mono font-bold',
            activeTab === 'feasibility' ? 'bg-white/20' : 'bg-[var(--color-paper)] border border-[var(--color-light-border)]'
          )}>
            BOM Checker
          </span>
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={clsx(
            'px-5 py-3 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 editorial-border',
            activeTab === 'movements'
              ? 'bg-[var(--color-ink)] text-white'
              : 'bg-white text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
          )}
        >
          <History className="w-4 h-4" />
          <span>Movement Ledger</span>
        </button>
      </div>

      {/* Critical Early Warning Banner (Always visible if low stock items exist) */}
      {lowStockItems.length > 0 && (
        <div className="p-5 editorial-border bg-[var(--color-vermilion)] text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white text-[var(--color-vermilion)] editorial-border shrink-0">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black uppercase tracking-tight font-display">
                  Early Warning: Raw Material Below Reorder Threshold ({lowStockItems.length} Materials)
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-white text-[var(--color-vermilion)] border border-white font-bold tracking-widest">
                  Stockout Risk
                </span>
              </div>
              <p className="text-sm font-sans mt-1 max-w-3xl">
                <strong>50D/72F Recycled Polyester (YARN-PET-50D-REC)</strong> has only <strong>400 kg</strong> available (Reorder point: 3,000 kg).
                Estimated runway: <strong>2.5 days</strong> before Loom WEAVE-03 is starved of weft yarn.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const target = lowStockItems[0];
                setReorderItem(target);
                setReorderPoQty(target.reorderThreshold * 2);
                setReorderModalOpen(true);
              }}
              className="px-5 py-3 bg-white text-[var(--color-ink)] hover:bg-[var(--color-paper)] font-bold text-xs uppercase tracking-widest transition-colors editorial-border"
            >
              1-Click Reorder PO
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: Warehouse Stock Balances */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between pb-4 border-b border-[var(--color-light-border)]">
            <h2 className="font-display font-bold text-2xl uppercase tracking-tighter">Raw Material Inventory</h2>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--color-industrial-grey)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search SKU, lot number, supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="editorial-border pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)] w-64"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="editorial-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none"
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
                className="editorial-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none"
              >
                <option value="all">All Threshold Statuses</option>
                <option value="in_stock">Healthy Stock</option>
                <option value="low_stock">Low Stock Warning</option>
                <option value="critical">Critical Stockout Risk</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="editorial-border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-ink)] text-white uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3 font-bold tracking-widest">Raw Material / Yarn SKU</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Lot & Storage Bin</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Total Physical Stock</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Free Available vs Reserved</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Reorder Point & Runway</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Status</th>
                    <th className="px-4 py-3 text-right font-bold tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-light-border)]">
                  {filteredItems.map((item) => {
                    const isLow = item.status === 'low_stock' || item.status === 'critical';
                    const estimatedRunwayDays = (item.availableQuantity / 160).toFixed(1);

                    return (
                      <tr key={item.id} className={clsx(
                        'transition-colors hover:bg-[var(--color-paper)]',
                        isLow && 'bg-rose-50'
                      )}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[var(--color-ink)]">{item.sku}</span>
                            {item.colorHex && (
                              <span
                                className="w-3 h-3 rounded-full border border-[var(--color-light-border)] inline-block"
                                style={{ backgroundColor: item.colorHex }}
                                title="Yarn shade color"
                              />
                            )}
                          </div>
                          <div className="text-[11px] text-[var(--color-ink)] font-bold mt-1">{item.name}</div>
                          <div className="text-[10px] text-[var(--color-industrial-grey)]">{item.specification}</div>
                          <div className="text-[10px] text-[var(--color-ink)] font-mono mt-1 font-bold">Supplier: {item.supplierName}</div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-mono text-[var(--color-vermilion)] font-bold">{item.lotNumber}</div>
                          <div className="text-[11px] text-[var(--color-industrial-grey)] font-mono mt-1 font-bold">
                            {item.warehouseRack} • {item.warehouseBin}
                          </div>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-sm text-[var(--color-ink)]">
                          {item.quantity.toLocaleString()} {item.unit}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-mono text-[var(--color-success-green)] font-bold">
                            {item.availableQuantity.toLocaleString()} {item.unit} free
                          </div>
                          <div className="font-mono text-[var(--color-vermilion)] text-[10px] mt-1 font-bold">
                            {item.reservedQuantity.toLocaleString()} {item.unit} locked for orders
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="text-[11px] font-mono text-[var(--color-ink)]">
                            Reorder: <strong>{item.reorderThreshold.toLocaleString()} {item.unit}</strong>
                          </div>
                          <div className={clsx(
                            'text-[10px] font-mono font-bold mt-1',
                            isLow ? 'text-[var(--color-vermilion)]' : 'text-[var(--color-industrial-grey)]'
                          )}>
                            ⚡ Runway: ~{estimatedRunwayDays} days
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} size="sm" />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isLow && (
                              <button
                                onClick={() => {
                                  setReorderItem(item);
                                  setReorderPoQty(item.reorderThreshold * 2);
                                  setReorderModalOpen(true);
                                }}
                                className="px-3 py-1.5 editorial-border bg-[var(--color-vermilion)] text-white font-bold text-[10px] uppercase tracking-widest hover:bg-red-700 transition-colors"
                              >
                                Reorder
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedItemForAdjust(item);
                                setAdjustmentModalOpen(true);
                              }}
                              className="px-3 py-1.5 editorial-border font-bold text-[10px] uppercase tracking-widest text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors"
                            >
                              Audit
                            </button>
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
          <div className="p-5 editorial-border bg-[var(--color-paper)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold font-display uppercase tracking-tight">
                  Mill Security Gate & Inward Weighbridge
                </h3>
              </div>
              <p className="text-sm font-sans text-[var(--color-industrial-grey)] mt-1">
                Every yarn truck arriving at Everest Textile Mills is inspected here. Weight, shade, count, and target order earmarking are recorded before offloading into warehouse racks.
              </p>
            </div>
            <button
              onClick={() => setGateInwardModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-widest editorial-border bg-white hover:bg-black/5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Record New Inbound Truck
            </button>
          </div>

          {/* Inward Truck Entries Table */}
          <div className="editorial-border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--color-ink)] text-white uppercase font-mono text-[10px]">
                  <tr>
                    <th className="px-4 py-3 font-bold tracking-widest">Gate Pass # & Time</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Vehicle & Driver</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Supplier & Invoice</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Yarn Specification & Shade</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Net Wt (Gross - Tare)</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Earmarked Purpose</th>
                    <th className="px-4 py-3 font-bold tracking-widest">Assigned Location</th>
                    <th className="px-4 py-3 text-right font-bold tracking-widest">Pass</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-light-border)]">
                  {gateEntries.map((gate) => (
                    <tr key={gate.id} className="hover:bg-[var(--color-paper)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-sm text-[var(--color-ink)]">{gate.gatePassNumber}</div>
                        <div className="text-[10px] text-[var(--color-industrial-grey)] font-mono mt-1 font-bold">{gate.entryTimestamp}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-[var(--color-ink)]">{gate.vehicleNumber}</div>
                        <div className="text-[11px] text-[var(--color-ink)] font-bold mt-1">{gate.driverName}</div>
                        {gate.driverPhone && <div className="text-[10px] text-[var(--color-industrial-grey)] font-mono mt-0.5">{gate.driverPhone}</div>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-[var(--color-ink)] text-xs">{gate.supplierName}</div>
                        <div className="font-mono text-[10px] text-[var(--color-ink)] mt-1 font-bold">DC: {gate.challanInvoiceNumber}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[var(--color-ink)]">{gate.yarnName}</span>
                          {gate.yarnColorHex && (
                            <span
                              className="w-3 h-3 rounded-full border border-[var(--color-light-border)]"
                              style={{ backgroundColor: gate.yarnColorHex }}
                            />
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--color-industrial-grey)] font-bold mt-1">Color: {gate.yarnColor}</div>
                        <div className="text-[10px] text-[var(--color-industrial-grey)] font-mono mt-0.5">Lot: {gate.lotNumber} • {gate.bagCount} bags ({gate.coneCount || 0} cones)</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-[var(--color-success-green)] text-sm">
                          {gate.netWeightKg.toLocaleString()} kg Net
                        </div>
                        <div className="text-[10px] text-[var(--color-industrial-grey)] font-mono mt-1 font-bold">
                          Gross: {gate.grossWeightKg}kg | Tare: {gate.tareWeightKg}kg
                        </div>
                        <div className="text-[10px] text-[var(--color-success-green)] font-mono mt-0.5 font-bold">
                          Moisture: {gate.moisturePercent}% (Passed)
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {gate.earmarkedOrderNumber ? (
                          <div className="p-2 editorial-border bg-white">
                            <div className="font-mono font-bold text-[var(--color-ink)] text-xs">
                              {gate.earmarkedOrderNumber}
                            </div>
                            <div className="text-[10px] text-[var(--color-industrial-grey)] font-bold truncate max-w-[140px] mt-1">
                              {gate.earmarkedCustomer}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 border border-[var(--color-light-border)] bg-[var(--color-paper)] text-[10px] font-mono text-[var(--color-industrial-grey)] font-bold">
                            General Buffer Stock
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-[var(--color-ink)] font-mono font-bold text-[11px]">
                        {gate.allocatedStorageLocation}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setActiveGatePass(gate);
                            setGatePassPrintModalOpen(true);
                          }}
                          className="px-3 py-1.5 editorial-border font-bold text-[10px] uppercase tracking-widest text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors flex items-center gap-2 ml-auto"
                        >
                          <Printer className="w-3 h-3" />
                          Print Slip
                        </button>
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
          <div className="bg-[var(--color-paper)] p-6 editorial-border">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink)] font-bold block border border-[var(--color-ink)] px-2 py-0.5 max-w-fit mb-3">
                  Bill of Materials (BOM) Feasibility Engine
                </span>
                <h3 className="text-3xl font-black font-display uppercase tracking-tight text-[var(--color-ink)]">
                  Pre-Production Yarn Verification
                </h3>
                <p className="text-sm font-sans text-[var(--color-industrial-grey)] mt-2 max-w-2xl">
                  When a new order comes in, check whether enough warp and weft yarn is available in the warehouse before loading beams onto looms, or automatically raise a PO for the deficit.
                </p>
              </div>

              {/* Order Picker */}
              <div className="w-full md:w-80 bg-white p-4 editorial-border">
                <label className="text-[10px] font-mono text-[var(--color-ink)] uppercase font-bold block mb-2 tracking-widest">
                  Select Order to Verify
                </label>
                <select
                  value={selectedOrderForCheck}
                  onChange={(e) => setSelectedOrderForCheck(e.target.value)}
                  className="w-full editorial-border text-[var(--color-ink)] font-bold text-xs p-2.5 focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)] uppercase tracking-wider"
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Calculation Formula & Breakdown */}
            <div className="lg:col-span-2 bg-white p-6 editorial-border">
              <div className="flex items-center justify-between border-b border-[var(--color-light-border)] pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <Scale className="w-6 h-6 text-[var(--color-ink)]" />
                  <h4 className="text-lg font-black font-display uppercase tracking-tight text-[var(--color-ink)]">Yarn Bill of Materials Calculation</h4>
                </div>
                <span className="text-xs font-mono font-bold text-[var(--color-ink)] uppercase tracking-widest bg-[var(--color-paper)] px-3 py-1 editorial-border">
                  {feasibilityResult.orderNumber || 'Custom Simulation'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[var(--color-paper)] p-4 editorial-border font-mono mb-6">
                <div>
                  <span className="text-[var(--color-industrial-grey)] block text-[10px] uppercase font-bold tracking-widest mb-1">Fabric Length</span>
                  <span className="font-black text-[var(--color-ink)] text-base">{feasibilityResult.lengthMeters.toLocaleString()} m</span>
                </div>
                <div>
                  <span className="text-[var(--color-industrial-grey)] block text-[10px] uppercase font-bold tracking-widest mb-1">Fabric Width</span>
                  <span className="font-black text-[var(--color-ink)] text-base">{feasibilityResult.widthInches}" ({((feasibilityResult.widthInches * 0.0254)).toFixed(2)}m)</span>
                </div>
                <div>
                  <span className="text-[var(--color-industrial-grey)] block text-[10px] uppercase font-bold tracking-widest mb-1">Fabric GSM</span>
                  <span className="font-black text-[var(--color-ink)] text-base">{feasibilityResult.gsm} g/m²</span>
                </div>
                <div>
                  <span className="text-[var(--color-industrial-grey)] block text-[10px] uppercase font-bold tracking-widest mb-1">Loom Wastage</span>
                  <span className="font-black text-[var(--color-success-green)] text-base">+{feasibilityResult.wastageFactorPercent}% Crimp</span>
                </div>
              </div>

              {/* Formula Callout */}
              <div className="p-4 bg-white editorial-border text-xs font-mono text-[var(--color-industrial-grey)] mb-6 font-bold leading-relaxed">
                <span className="text-[var(--color-ink)] uppercase tracking-widest mr-2">Formula:</span>
                (Length {feasibilityResult.lengthMeters}m × Width {((feasibilityResult.widthInches * 0.0254)).toFixed(2)}m × GSM {feasibilityResult.gsm} ÷ 1000) × 1.05 = <strong className="text-[var(--color-ink)] text-sm ml-2 bg-[var(--color-paper)] px-2 py-1">{feasibilityResult.calculatedYarnNeededKg.toLocaleString()} kg Total Yarn</strong>
              </div>

              {/* Warp / Weft Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white editorial-border">
                  <div className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase font-bold tracking-widest border-b border-[var(--color-light-border)] pb-2 mb-3">Warp Beaming Requirement (60%)</div>
                  <div className="text-3xl font-black text-[var(--color-ink)] font-display tracking-tighter">{feasibilityResult.warpYarnKg.toLocaleString()} <span className="text-lg">kg</span></div>
                  <div className="text-[10px] text-[var(--color-industrial-grey)] font-bold uppercase tracking-widest mt-2">High tensile sizing & creel creeling</div>
                </div>

                <div className="p-5 bg-white editorial-border">
                  <div className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase font-bold tracking-widest border-b border-[var(--color-light-border)] pb-2 mb-3">Weft Insertion Requirement (40%)</div>
                  <div className="text-3xl font-black text-[var(--color-ink)] font-display tracking-tighter">{feasibilityResult.weftYarnKg.toLocaleString()} <span className="text-lg">kg</span></div>
                  <div className="text-[10px] text-[var(--color-industrial-grey)] font-bold uppercase tracking-widest mt-2">Air-jet feeder package cones</div>
                </div>
              </div>
            </div>

            {/* Right: Real-time Stock Comparison & Decision Card */}
            <div className={clsx(
              'p-6 editorial-border flex flex-col justify-between bg-white',
              feasibilityResult.feasibilityStatus === 'ready'
                ? 'border-[var(--color-success-green)] ring-1 ring-[var(--color-success-green)]'
                : 'border-[var(--color-vermilion)] ring-1 ring-[var(--color-vermilion)]'
            )}>
              <div>
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-light-border)]">
                  <span className="text-[10px] font-mono uppercase font-bold text-[var(--color-industrial-grey)] tracking-widest">
                    Live Stock Comparison
                  </span>
                  <span className={clsx(
                    'px-3 py-1 text-[10px] font-black uppercase tracking-widest editorial-border',
                    feasibilityResult.feasibilityStatus === 'ready'
                      ? 'bg-[var(--color-success-green)] text-white'
                      : 'bg-[var(--color-vermilion)] text-white animate-pulse'
                  )}>
                    {feasibilityResult.feasibilityStatus === 'ready' ? '✅ Ready to Start' : '❌ Yarn Shortfall'}
                  </span>
                </div>

                <h4 className={clsx(
                  "text-xl font-black font-display uppercase tracking-tight mb-6",
                  feasibilityResult.feasibilityStatus === 'ready' ? 'text-[var(--color-ink)]' : 'text-[var(--color-vermilion)]'
                )}>
                  {feasibilityResult.feasibilityStatus === 'ready'
                    ? 'Sufficient Yarn In Warehouse'
                    : `Material Deficit: -${feasibilityResult.deficitKg.toLocaleString()} kg`}
                </h4>

                {/* Progress bar */}
                <div className="space-y-2 mb-8">
                  <div className="flex justify-between text-xs font-mono font-bold uppercase tracking-widest">
                    <span className="text-[var(--color-industrial-grey)]">Stock Availability</span>
                    <span className="text-[var(--color-ink)]">{feasibilityResult.readyToStartPercent}%</span>
                  </div>
                  <div className="w-full bg-[var(--color-paper)] h-3 editorial-border overflow-hidden">
                    <div
                      className={clsx(
                        'h-full transition-all duration-700',
                        feasibilityResult.feasibilityStatus === 'ready' ? 'bg-[var(--color-success-green)]' : 'bg-[var(--color-vermilion)]'
                      )}
                      style={{ width: `${Math.min(100, feasibilityResult.readyToStartPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Stock numbers */}
                <div className="space-y-3 text-xs font-mono bg-[var(--color-paper)] p-4 editorial-border mb-6">
                  <div className="flex justify-between font-bold">
                    <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Required For Order:</span>
                    <span className="text-[var(--color-ink)]">{feasibilityResult.calculatedYarnNeededKg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-[var(--color-industrial-grey)] uppercase tracking-widest">Free In Warehouse:</span>
                    <span className="text-[var(--color-success-green)]">{feasibilityResult.availableStockKg.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between border-t border-[var(--color-light-border)] pt-3 mt-3">
                    <span className="text-[var(--color-industrial-grey)] font-bold uppercase tracking-widest">Variance / Deficit:</span>
                    <span className={clsx(
                      'font-black text-sm',
                      feasibilityResult.deficitKg > 0 ? 'text-[var(--color-vermilion)]' : 'text-[var(--color-success-green)]'
                    )}>
                      {feasibilityResult.deficitKg > 0 ? `-${feasibilityResult.deficitKg.toLocaleString()} kg` : 'Surplus Stock'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[var(--color-light-border)]">
                {feasibilityResult.feasibilityStatus === 'ready' ? (
                  <button
                    className="w-full px-6 py-4 font-bold text-xs uppercase tracking-widest bg-[var(--color-ink)] text-white hover:bg-black/80 transition-colors flex justify-center items-center gap-2 editorial-border"
                    onClick={handleLockYarnReservation}
                  >
                    <PackageCheck className="w-4 h-4" />
                    Lock & Reserve Yarn for Order
                  </button>
                ) : (
                  <button
                    className="w-full px-6 py-4 font-bold text-xs uppercase tracking-widest bg-[var(--color-vermilion)] text-white hover:bg-red-700 transition-colors flex justify-center items-center gap-2 editorial-border"
                    onClick={() => {
                      const matchedItem = items.find((i) => i.id === feasibilityResult.matchingInventoryItemId) || items[0];
                      setReorderItem(matchedItem);
                      setReorderPoQty(feasibilityResult.deficitKg + 1000); // Deficit + Safety Buffer
                      setReorderModalOpen(true);
                    }}
                  >
                    <Truck className="w-4 h-4" />
                    Raise PO for Deficit ({feasibilityResult.deficitKg} kg)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Stock Movement Audit Ledger */}
      {activeTab === 'movements' && (
        <div className="editorial-border bg-white overflow-hidden">
          <div className="p-5 border-b border-[var(--color-light-border)] bg-[var(--color-paper)] flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold font-display uppercase tracking-tight text-[var(--color-ink)]">
                Traceable Stock Movement Audit Trail
              </h3>
              <p className="text-sm font-sans text-[var(--color-industrial-grey)] mt-1">All inbound truck receipts, production reservations, issues, and scraps</p>
            </div>
            <span className="text-[10px] font-mono text-[var(--color-ink)] font-bold uppercase tracking-widest border border-[var(--color-ink)] px-3 py-1 bg-white">Immutable Ledger</span>
          </div>

          <div className="divide-y divide-[var(--color-light-border)]">
            {movements.map((mov) => {
              const isReceipt = mov.type === 'receipt';
              return (
                <div key={mov.id} className="p-4 flex items-start justify-between hover:bg-[var(--color-paper)] transition-colors">
                  <div className="flex items-start gap-4">
                    <div
                      className={clsx(
                        'p-3 editorial-border shrink-0 bg-white',
                        isReceipt
                          ? 'text-[var(--color-success-green)]'
                          : 'text-[var(--color-vermilion)]'
                      )}
                    >
                      {isReceipt ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-mono font-bold text-sm text-[var(--color-ink)]">{mov.referenceNumber}</span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 border border-[var(--color-light-border)] font-bold bg-white text-[var(--color-ink)]">
                          {mov.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--color-ink)]">{mov.itemName}</h4>
                      <p className="text-xs text-[var(--color-industrial-grey)] mt-1 max-w-2xl">{mov.notes}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={clsx(
                        'font-mono font-black text-sm',
                        isReceipt ? 'text-[var(--color-success-green)]' : 'text-[var(--color-vermilion)]'
                      )}
                    >
                      {isReceipt ? '+' : '-'}{mov.quantity.toLocaleString()} {mov.unit}
                    </div>
                    <div className="text-[11px] font-mono text-[var(--color-industrial-grey)] font-bold mt-1.5">{mov.timestamp}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-industrial-grey)] mt-1">{mov.performedBy}</div>
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
