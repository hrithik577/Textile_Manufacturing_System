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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white editorial-border text-[var(--color-ink)] overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-light-border)] bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 editorial-border flex items-center justify-center bg-[var(--color-paper)] text-[var(--color-ink)] shrink-0">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black font-display uppercase tracking-tight">
                  Buyer Call Assistant
                </h2>
                <span className="text-[10px] font-bold font-mono uppercase px-2 py-1 bg-[var(--color-ink)] text-white editorial-border tracking-widest">
                  Live Floor Status Desk
                </span>
              </div>
              <p className="text-[10px] font-bold font-mono uppercase text-[var(--color-industrial-grey)] tracking-widest mt-1">
                Answer buyer phone calls in seconds. Zero floor walk required.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <kbd className="hidden sm:inline-block px-2 py-1 bg-[var(--color-paper)] text-[10px] font-bold font-mono uppercase text-[var(--color-industrial-grey)] tracking-widest editorial-border">
              Esc to close
            </kbd>
            <button
              onClick={() => setBuyerCallModalOpen(false)}
              className="p-2 text-[var(--color-ink)] hover:bg-[var(--color-paper)] transition-colors editorial-border"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TOP SEARCH & RECENT CALLER QUICK-BAR */}
        <div className="p-4 border-b border-[var(--color-light-border)] bg-[var(--color-paper)] shrink-0 space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-industrial-grey)]" />
            <input
              type="text"
              placeholder="SEARCH BY BUYER COMPANY, PO #, ORDER ID, OR FABRIC..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[var(--color-light-border)] focus:border-[var(--color-ink)] text-xs font-bold font-mono text-[var(--color-ink)] placeholder:text-[var(--color-industrial-grey)] uppercase tracking-widest focus:outline-none transition-colors editorial-border"
              autoFocus
            />
          </div>

          {/* Quick-select pills */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <span className="text-[10px] font-bold font-mono uppercase text-[var(--color-industrial-grey)] tracking-widest shrink-0">Frequent Callers:</span>
            {allOrders.slice(0, 5).map((order) => {
              const isSelected = order.id === activeOrder.id;
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={clsx(
                    'px-3 py-1.5 text-[10px] font-bold font-mono uppercase tracking-widest shrink-0 flex items-center gap-2 transition-all editorial-border',
                    isSelected
                      ? 'bg-[var(--color-ink)] text-white'
                      : 'bg-white text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
                  )}
                >
                  <span className={clsx("w-2 h-2 border border-current", order.status === 'ready_to_dispatch' ? 'bg-[var(--color-success-green)]' : order.status === 'at_risk' ? 'bg-[var(--color-vermilion)]' : 'bg-transparent')} />
                  <span>{order.orderNumber}</span>
                  <span className="opacity-75">
                    {order.customerCompany.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* THE 3 CORE QUESTIONS DIRECT ANSWER BANNER */}
          <div className={clsx(
            'p-6 bg-white editorial-border flex flex-col md:flex-row md:items-start justify-between gap-6 transition-all',
            floorTelemetry.exactStageCategory === 'ready_to_ship'
              ? 'ring-2 ring-[var(--color-success-green)]'
              : floorTelemetry.exactStageCategory === 'weaving' && activeOrder.status === 'at_risk'
              ? 'ring-2 ring-[var(--color-vermilion)]'
              : ''
          )}>
            <div>
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--color-light-border)] text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--color-industrial-grey)]">
                <span className="flex h-3 w-3 border border-[var(--color-vermilion)] bg-[var(--color-vermilion)] animate-pulse" />
                <span>EXACT LIVE STATUS</span>
                <span>·</span>
                <span>PO: <strong className="text-[var(--color-ink)]">{activeOrder.customerPo}</strong></span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-black font-display text-[var(--color-ink)] uppercase tracking-tight flex items-center gap-4">
                {floorTelemetry.exactStageCategory === 'ready_to_ship' && (
                  <CheckCircle2 className="w-8 h-8 text-[var(--color-success-green)] shrink-0" />
                )}
                {floorTelemetry.exactStageCategory === 'quality' && (
                  <ShieldCheck className="w-8 h-8 text-[var(--color-ink)] shrink-0" />
                )}
                {floorTelemetry.exactStageCategory === 'dyeing' && (
                  <Sparkles className="w-8 h-8 text-[var(--color-ink)] shrink-0" />
                )}
                {floorTelemetry.exactStageCategory === 'weaving' && (
                  <Layers className="w-8 h-8 text-[var(--color-ink)] shrink-0" />
                )}
                {floorTelemetry.exactStageCategory === 'dispatched' && (
                  <Truck className="w-8 h-8 text-[var(--color-success-green)] shrink-0" />
                )}
                <span>{floorTelemetry.exactStageLabel}</span>
              </h3>

              <p className="text-xs font-bold font-mono uppercase tracking-widest text-[var(--color-industrial-grey)] mt-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--color-ink)] shrink-0" />
                <span>Location: <strong className="text-[var(--color-ink)]">{floorTelemetry.physicalLocation}</strong></span>
              </p>
            </div>

            {/* Delivery ETA pill */}
            <div className="flex flex-col p-4 bg-[var(--color-paper)] editorial-border min-w-[280px]">
              <div className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--color-industrial-grey)] mb-2 pb-2 border-b border-[var(--color-light-border)]">
                <Calendar className="w-4 h-4 text-[var(--color-ink)]" />
                <span>Projected Delivery:</span>
              </div>
              <div className="text-xl font-black font-display text-[var(--color-ink)] uppercase tracking-tight">
                {floorTelemetry.projectedBuyerDelivery}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold font-mono uppercase tracking-widest mt-4">
                {floorTelemetry.slaStatus === 'ahead_of_schedule' ? (
                  <span className="text-[var(--color-success-green)] bg-white px-2 py-1 editorial-border">✓ Ahead of SLA</span>
                ) : floorTelemetry.slaStatus === 'risk_delay' ? (
                  <span className="text-[var(--color-vermilion)] bg-white px-2 py-1 editorial-border">⚠ Schedule Recovery Active</span>
                ) : (
                  <span className="text-[var(--color-ink)] bg-white px-2 py-1 editorial-border">● On Track</span>
                )}
              </div>
            </div>
          </div>iv>
          </div>

          {/* VERBAL TELEPHONY PROMPT BOX ("SAY THIS TO THE BUYER RIGHT NOW") */}
          <div className="p-6 bg-white editorial-border">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-light-border)]">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 bg-[var(--color-ink)]" />
                <h4 className="text-sm font-black font-display uppercase tracking-tight text-[var(--color-ink)]">
                  Spoken Script (Read to Caller)
                </h4>
              </div>
              <button
                onClick={handleCopyScript}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-paper)] text-[var(--color-ink)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--color-ink)] hover:text-white transition-colors editorial-border"
              >
                {copiedScript ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-base font-bold font-mono text-[var(--color-ink)] uppercase tracking-widest leading-relaxed bg-[var(--color-paper)] p-6 editorial-border border-dashed">
              "{floorTelemetry.telephonyScript}"
            </p>
          </div>

          {/* 3-COLUMN DETAIL CARD: 1. PHYSICAL FLOOR, 2. QUALITY & ROLLS, 3. DISPATCH & LOGISTICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* 1. PHYSICAL FLOOR TELEMETRY */}
            <div className="p-6 bg-white editorial-border space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-light-border)] text-sm font-black text-[var(--color-ink)] uppercase font-display tracking-tight">
                <Cpu className="w-5 h-5 text-[var(--color-ink)]" />
                <span>1. Machine & Station</span>
              </div>
              <div className="space-y-4 text-xs font-bold font-mono uppercase tracking-widest text-[var(--color-ink)]">
                <div>
                  <span className="text-[var(--color-industrial-grey)] block mb-1">Active Machine:</span>
                  <span className="text-sm font-black block">{floorTelemetry.activeMachineCode}</span>
                  <span className="text-[10px] text-[var(--color-industrial-grey)] block truncate">
                    {floorTelemetry.activeMachineName}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--color-industrial-grey)] block mb-1">Operator:</span>
                  <span>{floorTelemetry.operatorName}</span>
                </div>

                {floorTelemetry.machineRpm && (
                  <div className="flex items-center justify-between border-t border-dashed border-[var(--color-light-border)] pt-4">
                    <span className="text-[var(--color-industrial-grey)]">Loom Speed:</span>
                    <span className="font-black">{floorTelemetry.machineRpm} RPM</span>
                  </div>
                )}

                {floorTelemetry.temperatureC && (
                  <div className="flex items-center justify-between border-t border-dashed border-[var(--color-light-border)] pt-4">
                    <span className="text-[var(--color-industrial-grey)]">Dye Temp:</span>
                    <span className="font-black">{floorTelemetry.temperatureC} °C</span>
                  </div>
                )}

                <div className="pt-4 border-t border-[var(--color-light-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--color-industrial-grey)]">Progress:</span>
                    <span className="font-black">
                      {activeOrder.stageProgress?.fabric_weaving || 100}%
                    </span>
                  </div>
                  <div className="w-full h-2 border border-[var(--color-ink)] bg-[var(--color-paper)]">
                    <div
                      className="h-full bg-[var(--color-ink)] transition-all"
                      style={{ width: `${activeOrder.stageProgress?.fabric_weaving || 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. QUALITY, ROLLS & READINESS */}
            <div className="p-6 bg-white editorial-border space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-light-border)] text-sm font-black text-[var(--color-ink)] uppercase font-display tracking-tight">
                <ShieldCheck className="w-5 h-5 text-[var(--color-ink)]" />
                <span>2. QA & Readiness</span>
              </div>
              <div className="space-y-4 text-xs font-bold font-mono uppercase tracking-widest text-[var(--color-ink)]">
                <div>
                  <span className="text-[var(--color-industrial-grey)] block mb-1">Quantity Breakdown:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black">
                      {(activeOrder.completedQuantity || activeOrder.orderedQuantity).toLocaleString()}
                    </span>
                    <span className="text-[var(--color-industrial-grey)]">/ {activeOrder.orderedQuantity.toLocaleString()} {activeOrder.unit}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="p-3 bg-[var(--color-paper)] editorial-border">
                    <span className="text-[10px] text-[var(--color-industrial-grey)] block mb-1">Rolls:</span>
                    <span className="text-sm font-black">{floorTelemetry.rollsInspectedCount}</span>
                  </div>
                  <div className="p-3 bg-[var(--color-paper)] editorial-border">
                    <span className="text-[10px] text-[var(--color-industrial-grey)] block mb-1">Grade A:</span>
                    <span className="text-sm font-black text-[var(--color-success-green)]">100%</span>
                  </div>
                </div>

                <div>
                  <span className="text-[var(--color-industrial-grey)] block mb-1">Lab Specs:</span>
                  <span>
                    GSM: {activeOrder.gsm} · ∆E: &lt;0.5
                  </span>
                </div>

                <div className="pt-4 border-t border-[var(--color-light-border)]">
                  <span className="text-[var(--color-industrial-grey)] block mb-1">Staging:</span>
                  <span className="font-black">
                    {floorTelemetry.warehouseRack}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. DISPATCH & DELIVERY SCHEDULE */}
            <div className="p-6 bg-white editorial-border space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-light-border)] text-sm font-black text-[var(--color-ink)] uppercase font-display tracking-tight">
                <Truck className="w-5 h-5 text-[var(--color-ink)]" />
                <span>3. Freight ETA</span>
              </div>
              <div className="space-y-4 text-xs font-bold font-mono uppercase tracking-widest text-[var(--color-ink)]">
                <div>
                  <span className="text-[var(--color-industrial-grey)] block mb-1">Mill Departure:</span>
                  <span className="text-sm font-black block">{floorTelemetry.projectedMillDispatch}</span>
                  <span className="text-[10px] text-[var(--color-industrial-grey)] block mt-1">
                    Gate: {floorTelemetry.dispatchBay}
                  </span>
                </div>

                <div>
                  <span className="text-[var(--color-industrial-grey)] block mb-1">Carrier:</span>
                  <span>{floorTelemetry.carrierName}</span>
                </div>

                <div>
                  <span className="text-[var(--color-industrial-grey)] block mb-1">Tracking:</span>
                  <span className="font-black">{floorTelemetry.trackingNumber}</span>
                </div>

                <div className="pt-4 border-t border-[var(--color-light-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--color-industrial-grey)]">Deadline:</span>
                    <span className="font-black">{activeOrder.deadlineDate}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-dashed border-[var(--color-light-border)]">
                    <span className="text-[var(--color-industrial-grey)]">SLA Perf:</span>
                    <span className={clsx("font-black", floorTelemetry.slaDaysVariance < 0 ? 'text-[var(--color-success-green)]' : floorTelemetry.slaDaysVariance === 0 ? 'text-[var(--color-ink)]' : 'text-[var(--color-vermilion)]')}>
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
          <div className="p-6 bg-[var(--color-paper)] editorial-border">
            <h4 className="text-xs font-black font-display uppercase tracking-tight text-[var(--color-ink)] mb-6 pb-2 border-b border-[var(--color-light-border)]">
              End-to-End Production Pipeline
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[
                { stage: 'yarn_spinning', label: '1. Yarn', done: true, current: false },
                {
                  stage: 'fabric_weaving',
                  label: '2. Weaving',
                  done: (activeOrder.stageProgress?.fabric_weaving || 0) >= 100,
                  current: activeOrder.currentStage === 'fabric_weaving',
                },
                {
                  stage: 'dyeing_finishing',
                  label: '3. Dyeing',
                  done: (activeOrder.stageProgress?.dyeing_finishing || 0) >= 100,
                  current: activeOrder.currentStage === 'dyeing_finishing',
                },
                {
                  stage: 'quality_inspection',
                  label: '4. Quality',
                  done: (activeOrder.stageProgress?.quality_inspection || 0) >= 100,
                  current: activeOrder.currentStage === 'quality_inspection',
                },
                {
                  stage: 'packing_storage',
                  label: '5. Ship',
                  done: activeOrder.status === 'ready_to_dispatch' || activeOrder.status === 'completed',
                  current: activeOrder.status === 'ready_to_dispatch' || activeOrder.currentStage === 'packing_storage',
                },
              ].map((step, idx) => (
                <div
                  key={step.stage}
                  className={clsx(
                    'p-4 bg-white editorial-border text-center transition-all',
                    step.current
                      ? 'ring-2 ring-[var(--color-ink)]'
                      : step.done
                      ? 'opacity-75'
                      : 'opacity-50'
                  )}
                >
                  <div className="flex items-center justify-center mb-2">
                    {step.done ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--color-ink)]" />
                    ) : step.current ? (
                      <span className="w-4 h-4 bg-[var(--color-ink)] border border-[var(--color-ink)] animate-pulse" />
                    ) : (
                      <span className="w-4 h-4 border border-[var(--color-industrial-grey)]" />
                    )}
                  </div>
                  <span className="text-[11px] font-black font-display uppercase tracking-tight block">{step.label}</span>
                  <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--color-industrial-grey)] block mt-2 pt-2 border-t border-[var(--color-light-border)]">
                    {step.done ? 'Done' : step.current ? 'Active' : 'Wait'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* MODAL FOOTER WITH ONE-CLICK COMMUNICATIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 border-t border-[var(--color-light-border)] bg-white shrink-0">
          <div className="flex items-center gap-4 text-[10px] font-bold font-mono uppercase tracking-widest text-[var(--color-industrial-grey)] w-full sm:w-auto">
            <span>Customer: <strong className="text-[var(--color-ink)]">{activeOrder.customerCompany}</strong></span>
            <span className="hidden sm:inline">·</span>
            <span>Email: <strong className="text-[var(--color-ink)]">{activeOrder.customerEmail}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyTrackingLink}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-[var(--color-ink)] text-[10px] font-bold font-mono uppercase tracking-widest editorial-border hover:bg-[var(--color-paper)] transition-colors"
              title="Copy link for buyer to track order themselves online"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleSendWhatsAppUpdate}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-success-green)] text-white text-[10px] font-bold font-mono uppercase tracking-widest editorial-border hover:bg-green-700 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleSendEmailCert}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-[var(--color-ink)] text-[10px] font-bold font-mono uppercase tracking-widest editorial-border hover:bg-[var(--color-paper)] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email QA</span>
            </button>

            <button
              onClick={() => {
                setBuyerCallModalOpen(false);
                navigate(`/orders?orderId=${activeOrder.id}`);
              }}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-[var(--color-ink)] text-white text-[10px] font-bold font-mono uppercase tracking-widest editorial-border hover:bg-black/80 transition-colors"
            >
              <span>Full Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
