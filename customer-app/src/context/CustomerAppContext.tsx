import React, { createContext, useContext, useState, useEffect } from 'react';
import { FabricProduct, CartItem, CustomerOrderRecord } from '../types';
import { mockCatalogProducts, mockCustomerOrders } from '../data/catalog';
import confetti from 'canvas-confetti';

interface CustomerAppContextType {
  activeTab: 'home' | 'categories' | 'custom-studio' | 'orders' | 'cart';
  setActiveTab: (tab: 'home' | 'categories' | 'custom-studio' | 'orders' | 'cart') => void;
  products: FabricProduct[];
  selectedProduct: FabricProduct | null;
  setSelectedProduct: (p: FabricProduct | null) => void;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'totalPrice'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotalMeters: number;
  cartSubtotal: number;
  cartGstAmount: number;
  cartGrandTotal: number;
  orders: CustomerOrderRecord[];
  placeOrder: (orderData: Partial<CustomerOrderRecord>) => Promise<CustomerOrderRecord>;
  selectedOrderForTrack: CustomerOrderRecord | null;
  setSelectedOrderForTrack: (order: CustomerOrderRecord | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategoryFilter: string;
  setSelectedCategoryFilter: (cat: string) => void;
  deliveryPincode: string;
  setDeliveryPincode: (pin: string) => void;
  activeToast: { title: string; message?: string; type?: 'success' | 'info' | 'warning' } | null;
  showToast: (toast: { title: string; message?: string; type?: 'success' | 'info' | 'warning' }) => void;
}

const CustomerAppContext = createContext<CustomerAppContextType | undefined>(undefined);

export const CustomerAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'categories' | 'custom-studio' | 'orders' | 'cart'>('home');
  const [products] = useState<FabricProduct[]>(mockCatalogProducts);
  const [selectedProduct, setSelectedProduct] = useState<FabricProduct | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('everest_customer_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [orders, setOrders] = useState<CustomerOrderRecord[]>(() => {
    const saved = localStorage.getItem('everest_customer_orders');
    return saved ? JSON.parse(saved) : mockCustomerOrders;
  });
  const [selectedOrderForTrack, setSelectedOrderForTrack] = useState<CustomerOrderRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [deliveryPincode, setDeliveryPincode] = useState('400001');
  const [activeToast, setActiveToast] = useState<{ title: string; message?: string; type?: 'success' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    localStorage.setItem('everest_customer_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('everest_customer_orders', JSON.stringify(orders));
  }, [orders]);

  const showToast = (toast: { title: string; message?: string; type?: 'success' | 'info' | 'warning' }) => {
    setActiveToast(toast);
    setTimeout(() => setActiveToast(null), 3500);
  };

  const addToCart = (item: Omit<CartItem, 'id' | 'totalPrice'>) => {
    const id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const totalPrice = item.isSampleOnly ? item.unitPrice : item.quantityMeters * item.unitPrice;

    setCart((prev) => {
      // Check if duplicate
      const existingIdx = prev.findIndex(
        (ci) => ci.productId === item.productId && ci.selectedColor.name === item.selectedColor.name && ci.isSampleOnly === item.isSampleOnly
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantityMeters + item.quantityMeters;
        updated[existingIdx].quantityMeters = newQty;
        updated[existingIdx].totalPrice = updated[existingIdx].isSampleOnly ? updated[existingIdx].unitPrice : newQty * updated[existingIdx].unitPrice;
        return updated;
      }
      return [...prev, { ...item, id, totalPrice }];
    });

    showToast({
      title: item.isSampleOnly ? 'Swatch Sample Added' : 'Bulk Fabric Added to Cart',
      message: `${item.title} (${item.selectedColor.name})`,
      type: 'success',
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    showToast({
      title: 'Item Removed from Cart',
      type: 'info',
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantityMeters: qty,
              totalPrice: item.isSampleOnly ? item.unitPrice : qty * item.unitPrice,
            }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const cartTotalMeters = cart.reduce((sum, item) => (item.isSampleOnly ? sum : sum + item.quantityMeters), 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const cartGstAmount = Math.round(cartSubtotal * 0.05); // 5% GST on textiles
  const cartGrandTotal = cartSubtotal + cartGstAmount;

  const placeOrder = async (orderData: Partial<CustomerOrderRecord>): Promise<CustomerOrderRecord> => {
    const newOrder: CustomerOrderRecord = {
      id: `ord-cust-${Date.now()}`,
      orderNumber: `EVR-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      placedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      customerName: orderData.customerName || 'Customer Client',
      customerPhone: orderData.customerPhone || '+91 98000 11223',
      deliveryAddress: orderData.deliveryAddress || 'Warehouse Dock 4, Industrial Area',
      cityStatePincode: orderData.cityStatePincode || `Mumbai, Maharashtra ${deliveryPincode}`,
      gstNumber: orderData.gstNumber,
      items: [...cart],
      subtotal: cartSubtotal,
      gstAmount: cartGstAmount,
      shippingFee: 0,
      totalAmount: cartGrandTotal,
      paymentMethod: orderData.paymentMethod || 'UPI',
      paymentStatus: 'Paid',
      productionStage: 'Order Confirmed',
      stageProgressPercent: 15,
      estimatedDeliveryDate: '17 Oct 2026 (7 Days)',
      assignedLoomMachine: 'Picanol OmniPlus-i Airjet Loom #1',
      carrierTrackingNumber: `EVR-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      carrierName: 'Everest Direct Logistics Fleet',
      qualityCertificateNumber: `CERT-QA-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setSelectedOrderForTrack(newOrder);
    setActiveTab('orders');

    // Trigger celebratory confetti like Flipkart order success
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0d9488', '#14b8a6', '#f59e0b', '#3b82f6', '#10b981'],
      });
    } catch (_) {}

    showToast({
      title: `🎉 Order Placed: ${newOrder.orderNumber}`,
      message: 'Direct manufacturing work order dispatched to mill loom sheds.',
      type: 'success',
    });

    return newOrder;
  };

  return (
    <CustomerAppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        products,
        selectedProduct,
        setSelectedProduct,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotalMeters,
        cartSubtotal,
        cartGstAmount,
        cartGrandTotal,
        orders,
        placeOrder,
        selectedOrderForTrack,
        setSelectedOrderForTrack,
        searchQuery,
        setSearchQuery,
        selectedCategoryFilter,
        setSelectedCategoryFilter,
        deliveryPincode,
        setDeliveryPincode,
        activeToast,
        showToast,
      }}
    >
      {children}
    </CustomerAppContext.Provider>
  );
};

export const useCustomerApp = () => {
  const context = useContext(CustomerAppContext);
  if (!context) {
    throw new Error('useCustomerApp must be used within a CustomerAppProvider');
  }
  return context;
};
