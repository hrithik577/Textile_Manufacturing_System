import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole, OperationalAlert } from '../types';
import { currentUserProfiles, mockOperationalAlerts } from '../services/mock-data';

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  message?: string;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(currentUserProfiles[0]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('everest_force_demo') !== 'false';
  });
  const [alerts, setAlerts] = useState<OperationalAlert[]>(mockOperationalAlerts);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

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

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

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
