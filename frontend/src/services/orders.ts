import { request } from './api-client';
import { CustomerOrder, OrderStatus, PriorityLevel } from '../types';
import { mockOrders } from './mock-data';

export interface PortalOrderPayload {
  customerCompany: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerPo?: string;
  deliveryDestination?: string;
  fabricType: string;
  gsm: number;
  widthInches: number;
  weaveType: string;
  color: string;
  pantoneCode?: string;
  finishType: string;
  orderedQuantity: number;
  unit?: 'meters' | 'yards' | 'kg';
  requiredDeliveryDate: string;
  priority: PriorityLevel;
  packagingPreference?: string;
  certifications?: string[];
  unitPriceInr: number;
  totalAmountInr: number;
  notes?: string;
}

// Global cross-tab and in-window broadcast channel
const BROADCAST_CHANNEL_NAME = 'everest_orders_sync';
let orderChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    orderChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('[OrdersService] BroadcastChannel not supported or restricted', e);
}

export function broadcastNewOrder(order: CustomerOrder) {
  // 1. BroadcastChannel for other open tabs
  try {
    if (orderChannel) {
      orderChannel.postMessage({ type: 'EVEREST_NEW_ORDER', order, timestamp: Date.now() });
    }
  } catch (err) {
    console.error('[OrdersService] Failed to post to BroadcastChannel', err);
  }

  // 2. Custom window event for current tab
  try {
    const customEvent = new CustomEvent('everest:new_order', {
      detail: { order, timestamp: Date.now() },
    });
    window.dispatchEvent(customEvent);
  } catch (err) {
    console.error('[OrdersService] Failed to dispatch custom event', err);
  }

  // 3. LocalStorage event key for fallback cross-tab notification
  try {
    localStorage.setItem(
      'everest_last_placed_order',
      JSON.stringify({ order, timestamp: Date.now() })
    );
  } catch (err) {
    console.error('[OrdersService] Failed to write to localStorage', err);
  }
}

export const ordersService = {
  async getOrders(): Promise<{ data: CustomerOrder[]; isSimulated: boolean }> {
    // Merge any locally stored placed orders with mock data
    const localPlacedOrdersStr = localStorage.getItem('everest_portal_placed_orders');
    let localPlacedOrders: CustomerOrder[] = [];
    if (localPlacedOrdersStr) {
      try {
        localPlacedOrders = JSON.parse(localPlacedOrdersStr);
      } catch {
        localPlacedOrders = [];
      }
    }

    const mergedMock = [...localPlacedOrders, ...mockOrders];
    const res = await request<any>('/orders', { method: 'GET' }, mergedMock);
    
    // Check if response is raw array or Paginated response with items
    const rawList = Array.isArray(res.data) 
      ? res.data 
      : (res.data?.items && Array.isArray(res.data.items) ? res.data.items : mergedMock);

    // Map backend SalesOrderRead format to frontend CustomerOrder if needed
    const mapped: CustomerOrder[] = rawList.map((o: any) => {
      if (o.orderNumber && o.stageProgress) {
        return o as CustomerOrder;
      }
      return {
        id: `ord-${o.id}`,
        orderNumber: o.order_number || o.orderNumber || `ORD-2026-${o.id}`,
        customerName: o.customer?.name || o.customerName || 'Direct Client',
        customerEmail: o.customer?.email || o.customerEmail || 'buyer@example.com',
        customerCompany: o.customer?.name || o.customerCompany || 'Commercial Partner',
        customerPo: o.notes || o.customerPo || `PO-${o.id}`,
        fabricType: o.items?.[0]?.fabric_type || o.fabricType || 'Cotton Poplin 40s',
        yarnSpecs: o.items?.[0]?.yarn_spec || o.yarnSpecs || '40s Combed Cotton Ring Spun',
        gsm: o.items?.[0]?.gsm || o.gsm || 135,
        color: o.items?.[0]?.color || o.color || 'Royal Blue',
        pantoneCode: o.pantoneCode || 'PANTONE 19-3952 TCX',
        orderedQuantity: o.items?.[0]?.quantity || o.orderedQuantity || 5000,
        completedQuantity: o.status === 'completed' ? (o.items?.[0]?.quantity || 5000) : Math.round((o.items?.[0]?.quantity || 5000) * 0.65),
        allocatedRollsCount: 4,
        unit: 'meters',
        status: o.status === 'in_production' ? 'in_production' : o.status === 'completed' ? 'completed' : o.status === 'ready_for_dispatch' ? 'ready_for_dispatch' : 'confirmed',
        currentStage: o.status === 'completed' ? 'dispatched' : o.status === 'ready_for_dispatch' ? 'packing_storage' : 'fabric_weaving',
        stageProgress: {
          yarn_spinning: 100,
          fabric_weaving: o.status === 'completed' ? 100 : 75,
          dyeing_finishing: o.status === 'completed' ? 100 : 40,
          quality_inspection: o.status === 'completed' ? 100 : 0,
          packing_storage: o.status === 'completed' ? 100 : 0,
          dispatched: o.status === 'completed' ? 100 : 0,
        },
        priority: o.priority || 'normal',
        requiredDeliveryDate: o.required_delivery_date || '2026-10-25',
        unitPriceInr: o.items?.[0]?.unit_price || 370,
        totalAmountInr: o.total_amount || 1850000,
        orderDate: o.order_date || '2026-10-01',
      } as CustomerOrder;
    });

    return { data: mapped, isSimulated: res.isSimulated };
  },

  async getOrderById(id: string): Promise<{ data: CustomerOrder | null; isSimulated: boolean }> {
    const localPlacedOrdersStr = localStorage.getItem('everest_portal_placed_orders');
    let localPlacedOrders: CustomerOrder[] = [];
    if (localPlacedOrdersStr) {
      try {
        localPlacedOrders = JSON.parse(localPlacedOrdersStr);
      } catch {
        localPlacedOrders = [];
      }
    }
    const all = [...localPlacedOrders, ...mockOrders];
    const fallback = all.find((o) => o.id === id || o.orderNumber === id) || null;
    return request<CustomerOrder | null>(`/orders/${id}`, { method: 'GET' }, fallback);
  },

  async createOrder(order: Partial<CustomerOrder>): Promise<{ data: CustomerOrder; isSimulated: boolean }> {
    const newOrder: CustomerOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: order.customerName || 'New Client',
      customerEmail: order.customerEmail || 'client@example.com',
      customerCompany: order.customerCompany || 'Textile Client Ltd',
      customerPo: order.customerPo || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      fabricType: order.fabricType || 'Cotton Poplin 40s',
      yarnSpecs: order.yarnSpecs || '40s Combed Cotton Ring Spun',
      gsm: order.gsm || 135,
      color: order.color || 'Optical White',
      pantoneCode: order.pantoneCode || 'PANTONE 11-0601 TCX',
      orderedQuantity: order.orderedQuantity || 5000,
      completedQuantity: 0,
      allocatedRollsCount: 0,
      unit: order.unit || 'meters',
      status: 'in_production',
      currentStage: 'yarn_spinning',
      stageProgress: {
        yarn_spinning: 10,
        fabric_weaving: 0,
        dyeing_finishing: 0,
        quality_inspection: 0,
        packing_storage: 0,
        dispatched: 0,
      },
      orderDate: new Date().toISOString().split('T')[0],
      deadlineDate: order.deadlineDate || '2026-11-15',
      estimatedCompletionDate: order.deadlineDate || '2026-11-12',
      priority: order.priority || 'standard',
      totalValueUsd: (order.orderedQuantity || 5000) * 280.0,
      costBreakdown: {
        rawMaterialCostUsd: (order.orderedQuantity || 5000) * 140.0,
        weavingCostUsd: (order.orderedQuantity || 5000) * 55.0,
        dyeingCostUsd: (order.orderedQuantity || 5000) * 40.0,
        finishingCostUsd: (order.orderedQuantity || 5000) * 25.0,
        laborOverheadsUsd: (order.orderedQuantity || 5000) * 15.0,
        totalCostUsd: (order.orderedQuantity || 5000) * 275.0,
        projectedMarginPercent: 18.2,
      },
      materialReadiness: {
        yarnStockPercent: 100,
        dyesChemicalsPercent: 100,
        isReady: true,
      },
      notes: order.notes || '',
    };

    const res = await request<CustomerOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }, newOrder);

    broadcastNewOrder(res.data);
    return res;
  },

  async placePortalOrder(payload: PortalOrderPayload): Promise<{ data: CustomerOrder; isSimulated: boolean }> {
    const orderNumber = `SO-2026-${Math.floor(100 + Math.random() * 900)}`;
    const unitPrice = payload.unitPriceInr || 280.0;
    const totalValue = payload.totalAmountInr || payload.orderedQuantity * unitPrice;

    const newCustomerOrder: CustomerOrder = {
      id: `ord-portal-${Date.now()}`,
      orderNumber,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerCompany: payload.customerCompany,
      customerPo: payload.customerPo || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      fabricType: `${payload.fabricType} (${payload.gsm} GSM, ${payload.widthInches}")`,
      yarnSpecs: `${payload.weaveType} • Finish: ${payload.finishType}`,
      gsm: payload.gsm,
      color: payload.color,
      pantoneCode: payload.pantoneCode || 'PANTONE 19-4024 TCX',
      orderedQuantity: payload.orderedQuantity,
      completedQuantity: 0,
      allocatedRollsCount: 0,
      unit: payload.unit || 'meters',
      status: 'in_production',
      currentStage: 'yarn_spinning',
      stageProgress: {
        yarn_spinning: 20,
        fabric_weaving: 0,
        dyeing_finishing: 0,
        quality_inspection: 0,
        packing_storage: 0,
        dispatched: 0,
      },
      orderDate: new Date().toISOString().split('T')[0],
      deadlineDate: payload.requiredDeliveryDate,
      estimatedCompletionDate: payload.requiredDeliveryDate,
      priority: payload.priority || 'standard',
      totalValueUsd: totalValue,
      costBreakdown: {
        rawMaterialCostUsd: totalValue * 0.52,
        weavingCostUsd: totalValue * 0.18,
        dyeingCostUsd: totalValue * 0.12,
        finishingCostUsd: totalValue * 0.08,
        laborOverheadsUsd: totalValue * 0.04,
        totalCostUsd: totalValue * 0.85,
        projectedMarginPercent: 15.0,
      },
      materialReadiness: {
        yarnStockPercent: 100,
        dyesChemicalsPercent: 100,
        isReady: true,
      },
      notes: `Buyer Portal Order • Destination: ${payload.deliveryDestination || 'Global Port'} • Certs: ${(payload.certifications || []).join(', ')} • Notes: ${payload.notes || 'None'}`,
    };

    // Save to local cache for instant retrieval across pages
    try {
      const existing = localStorage.getItem('everest_portal_placed_orders');
      const list: CustomerOrder[] = existing ? JSON.parse(existing) : [];
      list.unshift(newCustomerOrder);
      localStorage.setItem('everest_portal_placed_orders', JSON.stringify(list.slice(0, 50)));
    } catch (e) {
      console.error('[OrdersService] Error caching portal order', e);
    }

    const backendPayload = {
      customer_company: payload.customerCompany,
      customer_name: payload.customerName,
      customer_email: payload.customerEmail,
      customer_phone: payload.customerPhone || '',
      customer_po: payload.customerPo || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      delivery_destination: payload.deliveryDestination || '',
      required_delivery_date: payload.requiredDeliveryDate,
      priority: payload.priority === 'urgent' ? 'urgent' : payload.priority === 'high' ? 'high' : 'normal',
      currency: 'INR',
      notes: payload.notes || '',
      items: [
        {
          fabric_type: `${payload.fabricType} ${payload.gsm} GSM`,
          color_code: payload.color,
          gsm: payload.gsm,
          width_inches: payload.widthInches,
          target_quantity: payload.orderedQuantity,
          unit: payload.unit || 'm',
          unit_price: unitPrice,
          notes: `Weave: ${payload.weaveType} | Finish: ${payload.finishType}`,
        },
      ],
    };

    const res = await request<any>('/orders/place', {
      method: 'POST',
      body: JSON.stringify(backendPayload),
    }, newCustomerOrder);

    const resultOrder = res.isSimulated ? newCustomerOrder : {
      ...newCustomerOrder,
      id: String(res.data?.id || newCustomerOrder.id),
      orderNumber: res.data?.order_number || newCustomerOrder.orderNumber,
      totalValueUsd: res.data?.total_amount || totalValue,
    };

    // Broadcast live event to all tabs and app listeners
    broadcastNewOrder(resultOrder);

    return { data: resultOrder, isSimulated: res.isSimulated };
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<{ success: boolean; isSimulated: boolean }> {
    const res = await request<{ success: boolean }>(
      `/orders/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      { success: true }
    );
    return { success: res.data.success, isSimulated: res.isSimulated };
  },
};
