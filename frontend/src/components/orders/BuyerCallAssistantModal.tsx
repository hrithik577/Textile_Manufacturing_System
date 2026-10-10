import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PhoneCall,
  X,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Cpu,
  Package,
  Calendar,
  ExternalLink,
  Copy,
  MessageSquare,
  Mail,
  ArrowRight,
  Sparkles,
  MapPin,
  Activity,
  FileCheck,
} from 'lucide-react';
import { CustomerOrder, ProductionStage, OrderStatus } from '../../types';
import { mockOrders, mockMachines } from '../../services/mock-data';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

// Floor telemetry data mapped to orders
interface OrderFloorTelemetry {
  exactStageLabel: string;
  exactStageCategory: 'weaving' | 'dyeing' | 'quality' | 'ready_to_ship' | 'dispatched';
  physicalLocation: string;
  activeMachineCode: string;
  activeMachineName: string;
  operatorName: string;
  machineRpm?: number;
  temperatureC?: number;
  rollsInspectedCount: number;
  rollsPassedGradeA: number;
  warehouseRack: string;
  dispatchBay: string;
  carrierName: string;
  trackingNumber: string;
  vehicleNumber?: string;
  projectedMillDispatch: string;
  projectedBuyerDelivery: string;
  slaStatus: 'ahead_of_schedule' | 'on_track' | 'risk_delay';
  slaDaysVariance: number;
  telephonyScript: string;
}

export const BuyerCallAssistantModal: React.FC = () => {
  const { buyerCallModalOpen, setBuyerCallModalOpen, selectedCallOrderId, addToast } = useApp();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ord-100');
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Synchronize when opened with a specific order
  useEffect(() => {
    if (selectedCallOrderId) {
      setSelectedOrderId(selectedCallOrderId);
    }
  }, [selectedCallOrderId]);

  // Keyboard shortcut listener: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && buyerCallModalOpen) {
        setBuyerCallModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buyerCallModalOpen, setBuyerCallModalOpen]);

  // Available orders for lookup (combine local storage placed orders with mockOrders)
  const allOrders = useMemo(() => {
    try {
      const localStr = localStorage.getItem('everest_portal_placed_orders');
      if (localStr) {
        const localParsed: CustomerOrder[] = JSON.parse(localStr);
        return [...localParsed, ...mockOrders];
      }
    } catch {}
    return mockOrders;
  }, [buyerCallModalOpen]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (!query.trim()) return allOrders;
    const q = query.toLowerCase();
    return allOrders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerCompany.toLowerCase().includes(q) ||
        o.customerPo.toLowerCase().includes(q) ||
        o.fabricType.toLowerCase().includes(q)
    );
  }, [allOrders, query]);

  // Selected Order
  const activeOrder = useMemo(() => {
    return allOrders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || allOrders[0];
  }, [allOrders, selectedOrderId]);

  // Dynamic floor telemetry generation based on order status and stage
  const floorTelemetry = useMemo<OrderFloorTelemetry>(() => {
    if (!activeOrder) {
      return {
        exactStageLabel: 'Order Confirmed',
        exactStageCategory: 'weaving',
        physicalLocation: 'Floor Line 1',
        activeMachineCode: 'WEAVE-01',
        activeMachineName: 'Picanol Loom',
        operatorName: 'Floor Team',
        rollsInspectedCount: 0,
        rollsPassedGradeA: 0,
        warehouseRack: 'Rack FG-01',
        dispatchBay: 'Bay 1',
        carrierName: 'Standard Logistics',
        trackingNumber: 'TRK-9901',
        projectedMillDispatch: 'Pending',
        projectedBuyerDelivery: 'Pending',
        slaStatus: 'on_track',
        slaDaysVariance: 0,
        telephonyScript: 'Your order is confirmed and scheduled.',
      };
    }

    // Scene scenarios
    if (activeOrder.status === 'ready_to_dispatch' || activeOrder.currentStage === 'packing_storage') {
      return {
        exactStageLabel: 'Ready to Ship (Packed & Inspected)',
        exactStageCategory: 'ready_to_ship',
        physicalLocation: 'Finished Goods Warehouse Bay 2 · Rack FG-B2, Pallet P-14',
        activeMachineCode: 'PACK-01',
        activeMachineName: 'Automatic Roll Vacuum Shrink Pack Line',
        operatorName: 'Suresh Patel (Warehouse Dispatch Lead)',
        rollsInspectedCount: activeOrder.allocatedRollsCount || 24,
        rollsPassedGradeA: activeOrder.allocatedRollsCount || 24,
        warehouseRack: 'FG-B2 (Export Zone)',
        dispatchBay: 'Dispatch Bay #3 (Loading Gate)',
        carrierName: 'Maersk Line Integrated Logistics',
        trackingNumber: 'MSK-EU-99214482',
        vehicleNumber: 'KA-01-EQ-4421 (Scheduled)',
        projectedMillDispatch: 'Tomorrow at 14:00 IST',
        projectedBuyerDelivery: 'Oct 13, 2026 (3 Days Ahead of SLA)',
        slaStatus: 'ahead_of_schedule',
        slaDaysVariance: -3,
        telephonyScript: `Hi ${activeOrder.customerName}! Great news regarding your order ${activeOrder.orderNumber} (${activeOrder.customerPo}): All ${activeOrder.orderedQuantity.toLocaleString()} ${activeOrder.unit} of ${activeOrder.fabricType} are 100% finished weaving and have passed final 4-point QA inspection with 100% Grade A certification. All ${activeOrder.allocatedRollsCount || 24} rolls are packed, barcoded, and staged in Dispatch Bay 3. Your shipment is scheduled to depart tomorrow with ${activeOrder.customerCompany.includes('Nordic') ? 'Maersk Logistics' : 'our freight carrier'}, arriving on Oct 13, comfortably ahead of your ${activeOrder.deadlineDate} deadline!`,
      };
    }

    if (activeOrder.status === 'quality_hold' || activeOrder.currentStage === 'quality_inspection') {
      return {
        exactStageLabel: 'Being Checked (4-Point Quality Inspection)',
        exactStageCategory: 'quality',
        physicalLocation: 'QA Inspection Lab A · Rolling Inspection Frame INSP-02',
        activeMachineCode: 'INSP-02',
        activeMachineName: 'High-Speed Optical Fabric Inspection Frame',
        operatorName: 'David Chen (Senior QA Inspector)',
        machineRpm: 45, // inspection speed m/min
        rollsInspectedCount: 18,
        rollsPassedGradeA: 18,
        warehouseRack: 'Buffer Rack INSP-QA1',
        dispatchBay: 'Dispatch Bay #2',
        carrierName: 'FedEx Express Freight',
        trackingNumber: 'FDX-IN-7719002',
        projectedMillDispatch: 'Oct 19, 2026 at 11:00 IST',
        projectedBuyerDelivery: 'Oct 21, 2026',
        slaStatus: 'on_track',
        slaDaysVariance: -1,
        telephonyScript: `Hi ${activeOrder.customerName}! I'm looking at live inspection telemetry for ${activeOrder.orderNumber} right now: Your fabric is currently on Inspection Frame #INSP-02 in our QA Lab. We have already audited and certified 18 rolls (100% Grade A Pass) with a defect score well within tolerance. We are running the final color shade lab audit today. All inspection will be completed by tomorrow morning, and dispatch remains on track for Oct 19 to reach you by ${activeOrder.deadlineDate}.`,
      };
    }

    if (activeOrder.currentStage === 'dyeing_finishing') {
      return {
        exactStageLabel: 'In Dyeing & Finishing Process',
        exactStageCategory: 'dyeing',
        physicalLocation: 'Dyehouse Bay 1 · Jet Dyeing Machine #JD-02',
        activeMachineCode: 'DYE-02',
        activeMachineName: 'Thies High-Temp Eco-Soft Jet Dyeing Machine',
        operatorName: 'Mohan Lal (Master Dyer)',
        temperatureC: 130,
        rollsInspectedCount: 0,
        rollsPassedGradeA: 0,
        warehouseRack: 'Wet Processing Transit Bin #08',
        dispatchBay: 'Dispatch Bay #1',
        carrierName: 'DHL Global Logistics',
        trackingNumber: 'DHL-IND-884011',
        projectedMillDispatch: 'Oct 16, 2026 at 16:00 IST',
        projectedBuyerDelivery: 'Oct 18, 2026 (On Schedule)',
        slaStatus: 'on_track',
        slaDaysVariance: 0,
        telephonyScript: `Hi ${activeOrder.customerName}! Regarding ${activeOrder.orderNumber} (${activeOrder.fabricType}): Weaving is completely finished (100%), and your fabric is currently in Jet Dyeing Machine #JD-02 running at 130°C in our dyehouse. The color shade is being matched to Pantone ${activeOrder.pantoneCode || activeOrder.color}. Finishing and stenter heat-setting will complete in 36 hours, followed immediately by 4-point QA inspection. Everything is tracking smoothly for delivery on ${activeOrder.deadlineDate}.`,
      };
    }

    if (activeOrder.status === 'at_risk' || activeOrder.currentStage === 'fabric_weaving') {
      const isSlip = activeOrder.status === 'at_risk';
      return {
        exactStageLabel: 'Still Being Woven on the Looms',
        exactStageCategory: 'weaving',
        physicalLocation: 'Weaving Shed Line B · Air Jet Loom WEAVE-03',
        activeMachineCode: 'WEAVE-03',
        activeMachineName: 'Picanol OptiMax-i Rapier Loom (Width 220cm)',
        operatorName: 'Rajesh Kumar (Shift A Weaver)',
        machineRpm: 720,
        rollsInspectedCount: 4,
        rollsPassedGradeA: 4,
        warehouseRack: 'Greige Staging Rack GR-04',
        dispatchBay: 'Dispatch Bay #1',
        carrierName: 'Maersk Logistics',
        trackingNumber: 'Pending Loom Completion',
        projectedMillDispatch: isSlip ? 'Oct 19, 2026 (Rescue Plan Active)' : 'Oct 14, 2026',
        projectedBuyerDelivery: isSlip ? 'Oct 21, 2026' : 'Oct 15, 2026',
        slaStatus: isSlip ? 'risk_delay' : 'on_track',
        slaDaysVariance: isSlip ? 5 : 0,
        telephonyScript: `Hi ${activeOrder.customerName}! Your order ${activeOrder.orderNumber} (${activeOrder.customerPo}) is currently on Loom WEAVE-03 in our weaving shed running at 720 RPM. We have woven ${(activeOrder.completedQuantity || 3500).toLocaleString()} ${activeOrder.unit} so far. ${
          isSlip
            ? 'We detected a mechanical tension deviation on Loom #03 yesterday, but our engineering team has already deployed an automated rescue plan, splitting production across backup Loom WEAVE-04 to catch up speed. Your revised ship date is Oct 19.'
            : 'Weaving is on pace to conclude in 48 hours, after which it enters the dyeing cycle. We are completely on schedule for your target deadline.'
        }`,
      };
    }

    // Default / completed
    return {
      exactStageLabel: 'Dispatched & In Transit to Buyer',
      exactStageCategory: 'dispatched',
      physicalLocation: 'In Transit · Air / Sea Freight Logistics',
      activeMachineCode: 'DISP-GATE',
      activeMachineName: 'Export Shipping Terminal',
      operatorName: 'Logistics Desk',
      rollsInspectedCount: activeOrder.allocatedRollsCount || 20,
      rollsPassedGradeA: activeOrder.allocatedRollsCount || 20,
      warehouseRack: 'Dispatched',
      dispatchBay: 'Bay 3',
      carrierName: 'DHL Global Logistics',
      trackingNumber: 'DHL-EU-8840112',
      vehicleNumber: 'MH-04-AB-1234',
      projectedMillDispatch: 'Completed',
      projectedBuyerDelivery: 'Arriving Today',
      slaStatus: 'ahead_of_schedule',
      slaDaysVariance: -2,
      telephonyScript: `Hi ${activeOrder.customerName}! Your order ${activeOrder.orderNumber} has already departed our factory gates. It is currently in transit with DHL (Tracking # DHL-EU-8840112). All inspection certificates and packing lists have been uploaded to your Buyer Portal.`,
    };
  }, [activeOrder]);

  if (!buyerCallModalOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(floorTelemetry.telephonyScript);
    setCopiedScript(true);
    addToast({
      type: 'success',
      title: 'Verbal Telephony Script Copied',
      message: 'You can read this directly to the buyer on the phone.',
    });
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleCopyTrackingLink = () => {
    const link = `${window.location.origin}/buyer/orders?orderId=${activeOrder.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    addToast({
      type: 'info',
      title: 'Buyer Self-Service Tracking Link Copied',
      message: 'Link copied! Send to buyer via WhatsApp or email.',
    });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendWhatsAppUpdate = () => {
    addToast({
      type: 'success',
      title: '📱 WhatsApp Dispatch Notification Sent',
      message: `Instant status & ETA sent to ${activeOrder.customerName} (${activeOrder.customerEmail}).`,
    });
  };

  const handleSendEmailCert = () => {
    addToast({
      type: 'info',
      title: '📄 Lab QA Certificate Dispatched',
      message: `Inspection pass report & packing slip emailed to ${activeOrder.customerEmail}.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-teal-500/40 shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-display text-white tracking-tight">
                  Buyer Call Assistant · Live Floor Status Desk
                </h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-700">
                  Zero Floor Walk Required
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Answer buyer phone calls in seconds: whether fabric is still being woven, being checked, or ready to ship.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
              Esc to close
            </kbd>
            <button
              onClick={() => setBuyerCallModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOP SEARCH & RECENT CALLER QUICK-BAR */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/70 shrink-0 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Buyer Company (e.g. Nordic, Patagonia, Zara), PO #, Order ID (ORD-2026-084), or Fabric..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 focus:border-teal-500 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          {/* Quick-select pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-medium text-slate-400 shrink-0">Frequent Callers:</span>
            {allOrders.slice(0, 5).map((order) => {
              const isSelected = order.id === activeOrder.id;
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all border',
                    isSelected
                      ? 'bg-teal-600/30 text-teal-200 border-teal-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  )}
                >
                  <span className="font-semibold">{order.orderNumber}</span>
                  <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                    {order.customerCompany.split(' ')[0]}
                  </span>
                  {order.status === 'ready_to_dispatch' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  ) : order.status === 'at_risk' ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* THE 3 CORE QUESTIONS DIRECT ANSWER BANNER */}
          <div className={clsx(
            'p-5 rounded-2xl border transition-all',
            floorTelemetry.exactStageCategory === 'ready_to_ship'
              ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.15)]'
              : floorTelemetry.exactStageCategory === 'quality'
              ? 'bg-blue-950/30 border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.15)]'
              : floorTelemetry.exactStageCategory === 'dyeing'
              ? 'bg-purple-950/30 border-purple-500/50 shadow-[0_0_25px_rgba(168,85,247,0.15)]'
              : floorTelemetry.exactStageCategory === 'weaving'
              ? 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
              : 'bg-teal-950/30 border-teal-500/50'
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-current animate-ping opacity-75" />
                  <span className="text-[11px] font-mono uppercase tracking-wider font-bold">
                    EXACT LIVE STATUS FOR BUYER CALL
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-xs font-mono text-slate-300">
                    PO: <strong className="text-white">{activeOrder.customerPo}</strong>
                  </span>
                </div>

                <h3 className="text-2xl font-black font-display tracking-tight text-white flex items-center gap-3">
                  {floorTelemetry.exactStageCategory === 'ready_to_ship' && (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                  )}
                  {floorTelemetry.exactStageCategory === 'quality' && (
                    <ShieldCheck className="w-7 h-7 text-blue-400 shrink-0" />
                  )}
                  {floorTelemetry.exactStageCategory === 'dyeing' && (
                    <Sparkles className="w-7 h-7 text-purple-400 shrink-0" />
                  )}
                  {floorTelemetry.exactStageCategory === 'weaving' && (
                    <Layers className="w-7 h-7 text-amber-400 shrink-0" />
                  )}
                  {floorTelemetry.exactStageCategory === 'dispatched' && (
                    <Truck className="w-7 h-7 text-teal-400 shrink-0" />
                  )}
                  <span>{floorTelemetry.exactStageLabel}</span>
                </h3>

                <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Physical Mill Floor Location: <strong className="text-white font-medium">{floorTelemetry.physicalLocation}</strong></span>
                </p>
              </div>

              {/* Delivery ETA pill */}
              <div className="flex flex-col sm:items-end justify-center p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 shrink-0 min-w-[240px]">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span>Projected Delivery to Buyer:</span>
                </div>
                <div className="text-base font-bold font-mono text-teal-300 mt-0.5">
                  {floorTelemetry.projectedBuyerDelivery}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono mt-0.5">
                  {floorTelemetry.slaStatus === 'ahead_of_schedule' ? (
                    <span className="text-emerald-400 font-semibold">✓ Ahead of SLA Deadline</span>
                  ) : floorTelemetry.slaStatus === 'risk_delay' ? (
                    <span className="text-rose-400 font-semibold">⚠ Schedule Recovery Active</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">● On Track with SLA</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* VERBAL TELEPHONY PROMPT BOX ("SAY THIS TO THE BUYER RIGHT NOW") */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-teal-950/40 via-slate-900 to-slate-900 border border-teal-500/30 relative group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-teal-400" />
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-teal-300">
                  Spoken Script · Read Word-for-Word to Caller:
                </h4>
              </div>
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/40 text-teal-300 border border-teal-500/40 text-xs font-medium transition-all"
              >
                {copiedScript ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Verbal Script</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-sm text-slate-200 font-sans leading-relaxed italic bg-slate-950/60 p-3.5 rounded-lg border border-slate-800">
              "{floorTelemetry.telephonyScript}"
            </p>
          </div>

          {/* 3-COLUMN DETAIL CARD: 1. PHYSICAL FLOOR, 2. QUALITY & ROLLS, 3. DISPATCH & LOGISTICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. PHYSICAL FLOOR TELEMETRY */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                <Cpu className="w-4 h-4 text-teal-400" />
                <span>1. Mill Machine & Station</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Active Machine:</span>
                  <span className="font-semibold text-white font-mono text-sm">
                    {floorTelemetry.activeMachineCode}
                  </span>
                  <span className="text-[11px] text-slate-400 block truncate">
                    {floorTelemetry.activeMachineName}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Station Operator:</span>
                  <span className="font-medium text-slate-200">{floorTelemetry.operatorName}</span>
                </div>

                {floorTelemetry.machineRpm && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Loom Operating Speed:</span>
                    <span className="font-mono text-emerald-400 font-bold">{floorTelemetry.machineRpm} RPM</span>
                  </div>
                )}

                {floorTelemetry.temperatureC && (
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Dye Vessel Temp:</span>
                    <span className="font-mono text-purple-400 font-bold">{floorTelemetry.temperatureC} °C</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Weaving Progress:</span>
                    <span className="font-mono text-white font-bold">
                      {activeOrder.stageProgress?.fabric_weaving || 100}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full transition-all"
                      style={{ width: `${activeOrder.stageProgress?.fabric_weaving || 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. QUALITY, ROLLS & READINESS */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>2. Fabric Readiness & QA</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Quantity Breakdown:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-bold text-white font-mono">
                      {(activeOrder.completedQuantity || activeOrder.orderedQuantity).toLocaleString()}
                    </span>
                    <span className="text-slate-400">/ {activeOrder.orderedQuantity.toLocaleString()} {activeOrder.unit}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Inspected Rolls:</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {floorTelemetry.rollsInspectedCount} Rolls
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Grade A Pass Rate:</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">100% Pass</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Lab Specs & Tolerance:</span>
                  <span className="text-[11px] text-slate-300 block">
                    GSM: <strong className="text-white">{activeOrder.gsm}</strong> · Delta E: <strong className="text-white">&lt;0.5</strong>
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 block text-[11px]">Warehouse Staging:</span>
                  <span className="font-mono text-slate-200 text-xs font-semibold">
                    {floorTelemetry.warehouseRack}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. DISPATCH & DELIVERY SCHEDULE */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>3. Delivery & Freight ETA</span>
              </div>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Scheduled Mill Departure:</span>
                  <span className="font-semibold text-white font-mono text-sm">
                    {floorTelemetry.projectedMillDispatch}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Loading Gate: {floorTelemetry.dispatchBay}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Carrier & Logistics Partner:</span>
                  <span className="font-medium text-slate-200">{floorTelemetry.carrierName}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Tracking Reference:</span>
                  <span className="font-mono text-teal-300 font-semibold">{floorTelemetry.trackingNumber}</span>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Contract Deadline:</span>
                    <span className="font-mono text-white font-bold">{activeOrder.deadlineDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 mt-0.5">
                    <span>SLA Performance:</span>
                    <span className="font-semibold font-mono">
                      {floorTelemetry.slaDaysVariance < 0
                        ? `${Math.abs(floorTelemetry.slaDaysVariance)} Days Early`
                        : floorTelemetry.slaDaysVariance === 0
                        ? 'Exact On Time'
                        : `${floorTelemetry.slaDaysVariance} Days Behind`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* VISUAL ORDER MILESTONE PIPELINE (Whether it's being woven, checked, or shipped) */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-3">
              End-to-End Production & Delivery Pipeline:
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { stage: 'yarn_spinning', label: '1. Yarn & Warping', done: true, current: false },
                {
                  stage: 'fabric_weaving',
                  label: '2. Weaving on Loom',
                  done: (activeOrder.stageProgress?.fabric_weaving || 0) >= 100,
                  current: activeOrder.currentStage === 'fabric_weaving',
                },
                {
                  stage: 'dyeing_finishing',
                  label: '3. Dyeing & Finishing',
                  done: (activeOrder.stageProgress?.dyeing_finishing || 0) >= 100,
                  current: activeOrder.currentStage === 'dyeing_finishing',
                },
                {
                  stage: 'quality_inspection',
                  label: '4. Quality Check',
                  done: (activeOrder.stageProgress?.quality_inspection || 0) >= 100,
                  current: activeOrder.currentStage === 'quality_inspection',
                },
                {
                  stage: 'packing_storage',
                  label: '5. Ready to Ship',
                  done: activeOrder.status === 'ready_to_dispatch' || activeOrder.status === 'completed',
                  current: activeOrder.status === 'ready_to_dispatch' || activeOrder.currentStage === 'packing_storage',
                },
              ].map((step, idx) => (
                <div
                  key={step.stage}
                  className={clsx(
                    'p-2.5 rounded-lg border text-center transition-all',
                    step.current
                      ? 'bg-teal-950/60 border-teal-500 text-teal-200 shadow-sm shadow-teal-500/20'
                      : step.done
                      ? 'bg-slate-900 border-slate-700/80 text-slate-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  )}
                >
                  <div className="flex items-center justify-center mb-1">
                    {step.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : step.current ? (
                      <span className="flex h-3 w-3 rounded-full bg-teal-400 animate-pulse" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border border-slate-600" />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold block leading-tight">{step.label}</span>
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    {step.done ? '100% Done' : step.current ? 'ACTIVE NOW' : 'Scheduled'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* MODAL FOOTER WITH ONE-CLICK COMMUNICATIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto">
            <span>Customer: <strong className="text-white">{activeOrder.customerCompany}</strong></span>
            <span>·</span>
            <span>Email: <strong className="text-slate-300">{activeOrder.customerEmail}</strong></span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyTrackingLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
              title="Copy link for buyer to track order themselves online"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Buyer Link'}</span>
            </button>

            <button
              onClick={handleSendWhatsAppUpdate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>

            <button
              onClick={handleSendEmailCert}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 text-xs font-semibold transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email QA Cert</span>
            </button>

            <button
              onClick={() => {
                setBuyerCallModalOpen(false);
                navigate(`/orders?orderId=${activeOrder.id}`);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md shadow-teal-950/40 border border-teal-400/40 transition-all"
            >
              <span>Full Order Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
