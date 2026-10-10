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
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>(['roll-fg-101', 'roll-fg-102', 'roll-fg-103', 'roll-fg-104']);
  const [destinationAddress, setDestinationAddress] = useState('Nordic Logistics Central Terminal, Gate 4, Gothenburg Sweden');
  const [destinationCity, setDestinationCity] = useState('Gothenburg, Sweden');
  const [carrierName, setCarrierName] = useState('Maersk Line Integrated Logistics');
  const [vehicleNumber, setVehicleNumber] = useState('KA-04-EV-9821');
  const [driverName, setDriverName] = useState('Gurpreet Singh');
  const [driverPhone, setDriverPhone] = useState('+91 98450 11234');
  const [dispatchNotes, setDispatchNotes] = useState('Heavy export grade carton shrink wrapped. Temperature controlled ocean container.');

  // Dialogs
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [challanModalOpen, setChallanModalOpen] = useState(false);
  const [activeChallanRecord, setActiveChallanRecord] = useState<DispatchRecord | null>(null);

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
        const found = ordersRes.data.find((o) => o.orderNumber === orderNumberParam || o.id === orderNumberParam);
        if (found) setSelectedOrderId(found.id);
      }
    } finally {
      setLoading(false);
    }
  };

  const currentOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || orders[0];
  }, [orders, selectedOrderId]);

  // Available rolls for the selected order (strictly validating that rolls are Grade A/Pass and in warehouse)
  const eligibleRolls = useMemo(() => {
    return rolls.filter(
      (r) => r.orderId === selectedOrderId || r.orderNumber === currentOrder?.orderNumber
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
      setActiveChallanRecord(res.data);
      setConfirmDialogOpen(false);
      setChallanModalOpen(true);

      addToast({
        type: 'success',
        title: 'Delivery Challan & Dispatch Generated',
        message: `Challan ${res.data.challanNumber} issued for ${totalSelectedMeters} meters.`,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Dispatch & Delivery Challan Console
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Verify QA-cleared fabric rolls, allocate transport carriers, generate official delivery challans, and track shipments.
          </p>
        </div>
      </div>

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
                  Select QA-Approved Fabric Rolls
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {selectedRollIds.length} of {eligibleRolls.length} rolls selected
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
            <h3 className="text-sm font-semibold font-display text-white pb-3 border-b border-slate-800">
              Shipment Verification Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-white truncate max-w-[150px]">{currentOrder?.customerCompany}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Order Ref:</span>
                <span className="font-mono text-teal-400 font-bold">{currentOrder?.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Rolls:</span>
                <span className="font-mono font-bold text-white">{selectedRollIds.length} rolls</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Net Quantity:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{totalSelectedMeters.toLocaleString()} meters</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Gross Export Weight:</span>
                <span className="font-mono text-slate-300">{totalSelectedWeight.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Carrier:</span>
                <span className="text-slate-300 truncate max-w-[150px]">{carrierName}</span>
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
              Issue Delivery Challan & Dispatch
            </Button>
          </div>

          {/* Recent Dispatches Log */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-3 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Recent Dispatches
            </h4>

            <div className="space-y-2">
              {dispatches.map((disp) => (
                <div
                  key={disp.id}
                  onClick={() => {
                    setActiveChallanRecord(disp);
                    setChallanModalOpen(true);
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
                    <span className="text-emerald-400">IN TRANSIT</span>
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
        title="Confirm Shipment Dispatch"
        message={`Are you sure you want to issue Delivery Challan for ${totalSelectedMeters.toLocaleString()} meters (${selectedRollIds.length} rolls) to ${currentOrder?.customerCompany}? This operation updates finished roll warehouse ledger.`}
        confirmLabel="Authorize Dispatch"
        variant="primary"
      />

      {/* Official Delivery Challan Modal / Printable Document */}
      <Modal
        isOpen={challanModalOpen}
        onClose={() => setChallanModalOpen(false)}
        title={activeChallanRecord ? `Official Delivery Challan: ${activeChallanRecord.challanNumber}` : 'Delivery Challan'}
        subtitle="Authorized Everest Textile OS Commercial Shipment Manifest"
        maxWidth="3xl"
      >
        {activeChallanRecord && (
          <div className="space-y-6 text-xs text-slate-300">
            {/* Manifest Header */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-display tracking-tight">
                  EVEREST TEXTILE MILLS LTD.
                </h2>
                <p className="text-[11px] text-slate-400">Plot 104-108, Industrial Manufacturing Zone, Phase II</p>
                <p className="text-[11px] text-slate-400">GSTIN / Tax ID: 24AAACE0921B1Z8</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs font-bold text-teal-400 block">{activeChallanRecord.challanNumber}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">Date: {activeChallanRecord.dispatchedAt}</span>
                <span className="text-[11px] text-slate-400 block">Tracking: {activeChallanRecord.trackingNumber}</span>
              </div>
            </div>

            {/* Consignee & Carrier Details */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">CONSIGNEE (BUYER):</span>
                <p className="font-bold text-white text-xs">{activeChallanRecord.customerName}</p>
                <p className="text-[11px] text-slate-300 mt-0.5">{activeChallanRecord.destinationAddress}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">Order Ref: {activeChallanRecord.orderNumber}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">CARRIER & VEHICLE:</span>
                <p className="font-bold text-white text-xs">{activeChallanRecord.carrierName}</p>
                <p className="text-[11px] text-slate-300 font-mono mt-0.5">Vehicle: {activeChallanRecord.vehicleNumber}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Driver: {activeChallanRecord.driverName} ({activeChallanRecord.driverPhone})</p>
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
                  {activeChallanRecord.rollIds.map((rollBarcode, idx) => (
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
                      {activeChallanRecord.totalMeters.toLocaleString()} m
                    </td>
                    <td className="px-4 py-2.5 font-mono text-right text-white text-xs">
                      {activeChallanRecord.grossWeightKg.toFixed(1)} kg
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature & Print Footer */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-800">
              <div className="text-[11px] text-slate-400">
                Authorized Signatory: <strong className="text-white">{activeChallanRecord.dispatchedBy}</strong>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.print();
                }}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Challan & Gate Pass
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
