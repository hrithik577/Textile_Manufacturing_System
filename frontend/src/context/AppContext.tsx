import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole, OperationalAlert, CustomerOrder } from '../types';
import { currentUserProfiles, mockOperationalAlerts } from '../services/mock-data';

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface AppContextType {
  currentUser: UserProfile;
  setUserRole: (role: UserRole) => void;
  isDemoMode: boolean;
  toggleDemoMode: () => void;
  alerts: OperationalAlert[];
  dismissAlert: (id: string) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (open: boolean) => void;
  resetSimulatedData: () => void;
  lastOrderEvent: { order: CustomerOrder; timestamp: number } | null;
  notifyNewOrder: (order: CustomerOrder) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Web Audio API notification chime generator (clean subtle pleasant chime)
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28); // D6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.12);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.6);
  } catch (e) {
    // Audio might be blocked by autoplay policies until first user click
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(currentUserProfiles[0]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('everest_force_demo') !== 'false';
  });
  const [alerts, setAlerts] = useState<OperationalAlert[]>(mockOperationalAlerts);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [lastOrderEvent, setLastOrderEvent] = useState<{ order: CustomerOrder; timestamp: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('everest_force_demo', isDemoMode ? 'true' : 'false');
  }, [isDemoMode]);

  const setUserRole = (role: UserRole) => {
    const user = currentUserProfiles.find((u) => u.role === role) || currentUserProfiles[0];
    setCurrentUser(user);
    addToast({
      type: 'info',
      title: `Switched Role to ${user.name}`,
      message: `Active view configured for: ${user.department}`,
    });
  };

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      addToast({
        type: next ? 'warning' : 'info',
        title: next ? 'Virtual Factory Simulation Active' : 'Live API Connection Active',
        message: next
          ? 'Displaying simulated telemetry and sample orders.'
          : 'Connecting to backend service on port 8000.',
      });
      return next;
    });
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const resetSimulatedData = () => {
    setAlerts(mockOperationalAlerts);
    addToast({
      type: 'success',
      title: 'Demo Data Reset',
      message: 'Simulated machines, orders, and quality logs reinitialized.',
    });
  };

  const notifyNewOrder = useCallback((order: CustomerOrder) => {
    setLastOrderEvent({ order, timestamp: Date.now() });
    playNotificationChime();

    // 1. Toast Notification with quick link
    addToast({
      type: 'success',
      title: `🔔 New Order Received: ${order.orderNumber}`,
      message: `${order.customerCompany} placed ${order.orderedQuantity.toLocaleString()}m (${order.fabricType}) for ₹${order.totalValueUsd.toLocaleString()}`,
      actionUrl: `/orders?orderId=${order.id}`,
      actionLabel: 'View in Orders',
    });

    // 2. Add high-priority alert to top-nav bell
    const newAlert: OperationalAlert = {
      id: `alert-order-${Date.now()}`,
      type: 'info',
      title: `New B2B Order: ${order.orderNumber}`,
      message: `Received ${order.orderedQuantity.toLocaleString()}m order from ${order.customerCompany}. Bill of materials initialized.`,
      entityType: 'order',
      entityId: order.id,
      timestamp: 'Just now',
      actionUrl: `/orders?orderId=${order.id}`,
      actionLabel: 'Inspect Order',
    };

    setAlerts((prev) => [newAlert, ...prev]);
  }, [addToast]);

  // Real-time synchronization listeners (BroadcastChannel, CustomEvent, localStorage)
  useEffect(() => {
    // A. BroadcastChannel for cross-tab messages
    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('everest_orders_sync');
        channel.onmessage = (event) => {
          if (event.data && event.data.type === 'EVEREST_NEW_ORDER' && event.data.order) {
            notifyNewOrder(event.data.order);
          }
        };
      }
    } catch (e) {
      console.warn('[AppContext] BroadcastChannel setup skipped', e);
    }

    // B. Custom window event listener
    const handleCustomOrderEvent = (event: Event) => {
      const customEv = event as CustomEvent;
      if (customEv.detail && customEv.detail.order) {
        notifyNewOrder(customEv.detail.order);
      }
    };
    window.addEventListener('everest:new_order', handleCustomOrderEvent);

    // C. Storage event for cross-tab fallback
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'everest_last_placed_order' && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          if (parsed && parsed.order && parsed.timestamp > Date.now() - 10000) {
            notifyNewOrder(parsed.order);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('everest:new_order', handleCustomOrderEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [notifyNewOrder]);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setUserRole,
        isDemoMode,
        toggleDemoMode,
        alerts,
        dismissAlert,
        toasts,
        addToast,
        removeToast,
        searchModalOpen,
        setSearchModalOpen,
        resetSimulatedData,
        lastOrderEvent,
        notifyNewOrder,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
