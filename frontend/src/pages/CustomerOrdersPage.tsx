import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Plus,
  Filter,
  Clock,
  Calendar,
  Layers,
  ShieldCheck,
  Package,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  FileText,
  User,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { CustomerOrder, OrderStatus, PriorityLevel, ProductionStage } from '../types';
import { ordersService } from '../services/orders';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { LoadingState } from '../components/common/LoadingState';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

export const CustomerOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useApp();

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Selected Order for Drawer
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  // Create Order Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerCompany: '',
    customerEmail: '',
    customerPo: '',
    fabricType: '100% Combed Cotton Single Jersey',
    yarnSpecs: '30s Ne Combed Ring Spun Organic Cotton',
    gsm: 180,
    color: 'Pacific Blue',
    pantoneCode: 'PANTONE 18-4034 TCX',
    orderedQuantity: 10000,
    unit: 'meters' as 'meters' | 'yards' | 'kg',
    deadlineDate: '2026-11-20',
    priority: 'standard' as PriorityLevel,
    notes: '',
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersService.getOrders();
      setOrders(res.data);

      const orderIdParam = searchParams.get('orderId');
      if (orderIdParam) {
        const found = res.data.find((o) => o.id === orderIdParam || o.orderNumber === orderIdParam);
        if (found) setSelectedOrder(found);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerCompany.toLowerCase().includes(q) ||
        o.fabricType.toLowerCase().includes(q) ||
        o.color.toLowerCase().includes(q);

      const matchesStatus = selectedStatus === 'all' || o.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || o.priority === selectedPriority;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [orders, searchQuery, selectedStatus, selectedPriority]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerCompany || !formData.orderedQuantity) {
      addToast({
        type: 'danger',
        title: 'Validation Error',
        message: 'Please complete all required customer and quantity fields.',
      });
      return;
    }

    try {
      const res = await ordersService.createOrder(formData);
      setOrders((prev) => [res.data, ...prev]);
      setCreateModalOpen(false);
      addToast({
        type: 'success',
        title: 'Customer Order Created',
        message: `Order ${res.data.orderNumber} initialized with bill of materials.`,
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Failed to create order',
        message: err?.message,
      });
    }
  };

  const stageLabels: Record<ProductionStage, string> = {
    yarn_spinning: 'Yarn Spinning',
    fabric_weaving: 'Fabric Weaving',
    dyeing_finishing: 'Dyeing & Finishing',
    quality_inspection: 'Quality Inspection',
    packing_storage: 'Packing & Staging',
    dispatched: 'Dispatched',
  };

  if (loading) {
    return <LoadingState message="Loading customer order books and production progress..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Customer Manufacturing Orders
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Track multi-stage production milestones, material allocations, delivery schedules, and profitability.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setCreateModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Customer Order
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order # (ORD-2026-084), customer, company, fabric type or color..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="in_production">In Production</option>
            <option value="at_risk">At Risk</option>
            <option value="quality_hold">Quality Hold</option>
            <option value="ready_to_dispatch">Ready to Dispatch</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="standard">Standard</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Order Number & Customer</th>
                <th className="px-4 py-3">Fabric Construction</th>
                <th className="px-4 py-3">Color & GSM</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Production Stage</th>
                <th className="px-4 py-3">Deadline & ETA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Value & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredOrders.map((o) => {
                const isOverdue = new Date(o.estimatedCompletionDate) > new Date(o.deadlineDate);
                const percentCompleted = Math.round((o.completedQuantity / o.orderedQuantity) * 100);

                return (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-xs">{o.orderNumber}</span>
                        {o.priority === 'urgent' && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            URGENT
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-300 font-semibold">{o.customerCompany}</div>
                      <div className="text-[10px] text-slate-400">{o.customerPo}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-200 font-medium">{o.fabricType}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{o.yarnSpecs}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-200">{o.color}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{o.gsm} GSM</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-white">
                        {o.completedQuantity.toLocaleString()} / {o.orderedQuantity.toLocaleString()} {o.unit}
                      </div>
                      <div className="h-1.5 w-24 rounded-full bg-slate-800 mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-500"
                          style={{ width: `${percentCompleted}%` }}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-medium">
                        {stageLabels[o.currentStage]}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-300 font-mono text-[11px]">Due: {o.deadlineDate}</div>
                      <div
                        className={clsx(
                          'text-[10px] font-mono flex items-center gap-1',
                          isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'
                        )}
                      >
                        {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                        ETA: {o.estimatedCompletionDate}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} size="sm" />
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="font-mono font-bold text-white text-xs">
                        ${o.totalValueUsd.toLocaleString()}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(o)}>
                        Details
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Drawer */}
      <Drawer
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `${selectedOrder.orderNumber} — ${selectedOrder.customerCompany}` : ''}
        subtitle={selectedOrder ? `PO: ${selectedOrder.customerPo} | Placed: ${selectedOrder.orderDate}` : ''}
        width="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status & Priority Header */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  CURRENT ORDER STATUS
                </span>
                <StatusBadge status={selectedOrder.status} size="md" />
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">TOTAL CONTRACT VALUE</span>
                <span className="text-lg font-bold font-mono text-teal-400">
                  ${selectedOrder.totalValueUsd.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Production Progress Timeline Across Stages */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                Manufacturing Stage Progression
              </h4>
              <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                {(
                  [
                    'yarn_spinning',
                    'fabric_weaving',
                    'dyeing_finishing',
                    'quality_inspection',
                    'packing_storage',
                  ] as ProductionStage[]
                ).map((stage, idx) => {
                  const progress = selectedOrder.stageProgress[stage] || 0;
                  const isCurrent = selectedOrder.currentStage === stage;
                  const isDone = progress === 100;

                  return (
                    <div key={stage} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold',
                              isDone
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : isCurrent
                                ? 'bg-teal-500 text-white shadow-[0_0_10px_rgba(20,184,166,0.5)]'
                                : 'bg-slate-800 text-slate-400'
                            )}
                          >
                            {isDone ? '✓' : idx + 1}
                          </span>
                          <span
                            className={clsx(
                              'font-medium',
                              isCurrent ? 'text-teal-300 font-semibold' : 'text-slate-300'
                            )}
                          >
                            {stageLabels[stage]}
                          </span>
                        </div>
                        <span className="font-mono text-slate-400">{progress}%</span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={clsx(
                            'h-full rounded-full transition-all duration-500',
                            isDone ? 'bg-emerald-500' : isCurrent ? 'bg-teal-500' : 'bg-slate-600'
                          )}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Material Readiness */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                Material Readiness Audit
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">Yarn Stock Allocation</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {selectedOrder.materialReadiness.yarnStockPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-full" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-400">Dye / Chemical Recipe</span>
                    <span className="text-xs font-bold font-mono text-teal-400">
                      {selectedOrder.materialReadiness.dyesChemicalsPercent}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500" style={{ width: `${selectedOrder.materialReadiness.dyesChemicalsPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications Card */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                Technical Fabric Specification
              </h4>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Fabric Composition:</span>
                  <span className="font-medium text-white">{selectedOrder.fabricType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Yarn Count / Construction:</span>
                  <span className="font-mono text-white">{selectedOrder.yarnSpecs}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Target Weight:</span>
                  <span className="font-mono text-white">{selectedOrder.gsm} GSM</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Color / Shade:</span>
                  <span className="font-medium text-white">{selectedOrder.color}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Pantone Reference:</span>
                  <span className="font-mono text-teal-400">{selectedOrder.pantoneCode}</span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown & Profit Margin */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                Unit Cost & Margin Breakdown
              </h4>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Raw Materials (Yarn):</span>
                  <span className="font-mono">${selectedOrder.costBreakdown.rawMaterialCostUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Weaving Operations:</span>
                  <span className="font-mono">${selectedOrder.costBreakdown.weavingCostUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Dyeing & Chemistry:</span>
                  <span className="font-mono">${selectedOrder.costBreakdown.dyeingCostUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Finishing & QA:</span>
                  <span className="font-mono">${selectedOrder.costBreakdown.finishingCostUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Labor & Plant Overheads:</span>
                  <span className="font-mono">${selectedOrder.costBreakdown.laborOverheadsUsd.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white">
                  <span>Total Manufacturing Cost:</span>
                  <span className="font-mono">${selectedOrder.costBreakdown.totalCostUsd.toLocaleString()}</span>
                </div>
                <div className="pt-1 flex justify-between font-bold text-teal-400">
                  <span>Projected Gross Margin:</span>
                  <span className="font-mono">{selectedOrder.costBreakdown.projectedMarginPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Create Order Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Customer Manufacturing Order"
        subtitle="Initialize production specifications, target milestones, and bill of materials."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Customer / Contact Name *</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Customer Company *</label>
              <input
                type="text"
                required
                value={formData.customerCompany}
                onChange={(e) => setFormData({ ...formData, customerCompany: e.target.value })}
                placeholder="e.g. Nordic Apparel Group"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Customer PO Reference</label>
              <input
                type="text"
                value={formData.customerPo}
                onChange={(e) => setFormData({ ...formData, customerPo: e.target.value })}
                placeholder="e.g. PO-NOR-2026-99"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Customer Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="e.g. orders@client.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Fabric Type / Construction</label>
              <input
                type="text"
                value={formData.fabricType}
                onChange={(e) => setFormData({ ...formData, fabricType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Yarn Specifications</label>
              <input
                type="text"
                value={formData.yarnSpecs}
                onChange={(e) => setFormData({ ...formData, yarnSpecs: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Target GSM</label>
              <input
                type="number"
                value={formData.gsm}
                onChange={(e) => setFormData({ ...formData, gsm: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Color / Pantone Reference</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Ordered Quantity (Meters) *</label>
              <input
                type="number"
                required
                value={formData.orderedQuantity}
                onChange={(e) => setFormData({ ...formData, orderedQuantity: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Deadline Delivery Date *</label>
              <input
                type="date"
                required
                value={formData.deadlineDate}
                onChange={(e) => setFormData({ ...formData, deadlineDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Priority Level</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="standard">Standard</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit & Plan Production
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
