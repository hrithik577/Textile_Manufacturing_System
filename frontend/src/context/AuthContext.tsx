import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types';
import { currentUserProfiles } from '../services/mock-data';

// ─── Demo Credential Store ──────────────────────────────────────────────────
// Each credential maps to a UserProfile via role. Passwords are intentionally
// visible because this is a demo-mode frontend (no real secrets involved).

export interface DemoCredential {
  email: string;
  password: string;
  role: UserRole;
  displayRole: string;
  description: string;
  accessLevel: 'admin' | 'manager' | 'operator' | 'viewer';
  allowedRoutes: string[];
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: 'vikram.mehta@everesttextiles.com',
    password: 'PlantMgr@2026',
    role: 'plant_manager',
    displayRole: 'Plant Manager',
    description: 'Full access — dashboard, production, orders, inventory, dispatch, analytics',
    accessLevel: 'admin',
    allowedRoutes: ['*'], // all routes
  },
  {
    email: 'anjali.s@everesttextiles.com',
    password: 'ProdSup@2026',
    role: 'production_supervisor',
    displayRole: 'Production Supervisor',
    description: 'Production floor, orders, inventory, quality, workforce',
    accessLevel: 'manager',
    allowedRoutes: ['/dashboard', '/yarniq', '/production', '/orders', '/inventory', '/quality', '/finished-goods', '/workforce', '/closing-the-books'],
  },
  {
    email: 'david.chen@everesttextiles.com',
    password: 'QALab@2026',
    role: 'quality_inspector',
    displayRole: 'QA Inspector',
    description: 'Quality control, finished goods, production view',
    accessLevel: 'operator',
    allowedRoutes: ['/dashboard', '/yarniq', '/quality', '/finished-goods', '/production', '/orders'],
  },
  {
    email: 'fatima@everesttextiles.com',
    password: 'Stores@2026',
    role: 'inventory_lead',
    displayRole: 'Inventory & Stores Lead',
    description: 'Inventory, dispatch, orders — gate entry and yarn feasibility',
    accessLevel: 'manager',
    allowedRoutes: ['/dashboard', '/yarniq', '/inventory', '/dispatch', '/orders', '/finished-goods'],
  },
  {
    email: 'sarah.j@nordicapparel.com',
    password: 'Buyer@2026',
    role: 'buyer',
    displayRole: 'B2B Buyer / Partner',
    description: 'Buyer portal, place orders, track order status',
    accessLevel: 'viewer',
    allowedRoutes: ['/buyer/orders', '/place-order', '/buyer', '/orders'],
  },
];

// ─── Auth Session Storage Key ────────────────────────────────────────────────
const AUTH_SESSION_KEY = 'everest_auth_session';

export interface AuthSession {
  userProfile: UserProfile;
  credential: DemoCredential;
  loginTimestamp: number;
}

interface AuthContextType {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  canAccessRoute: (path: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Restore session from localStorage on mount (or seed default Plant Manager)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_SESSION_KEY);
      if (stored) {
        const parsed: AuthSession = JSON.parse(stored);
        const eightHours = 8 * 60 * 60 * 1000;
        if (Date.now() - parsed.loginTimestamp < eightHours) {
          setSession(parsed);
          return;
        }
      }
      // If no valid session, default-initialize with Plant Manager so direct URL navigation works seamlessly
      const defaultCred = DEMO_CREDENTIALS[0];
      const defaultProfile = currentUserProfiles[0];
      const defaultSession: AuthSession = {
        userProfile: defaultProfile,
        credential: defaultCred,
        loginTimestamp: Date.now(),
      };
      setSession(defaultSession);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(defaultSession));
    } catch {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoginError(null);
    setIsLoading(true);

    // Simulate API authentication latency (600ms)
    await new Promise((r) => setTimeout(r, 600));

    const cred = DEMO_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.password === password
    );

    if (!cred) {
      setLoginError('Invalid email or password. Check the role credentials below.');
      setIsLoading(false);
      return false;
    }

    const profile = currentUserProfiles.find((u) => u.role === cred.role);
    if (!profile) {
      setLoginError('User profile not found. Contact your administrator.');
      setIsLoading(false);
      return false;
    }

    const newSession: AuthSession = {
      userProfile: profile,
      credential: cred,
      loginTimestamp: Date.now(),
    };

    setSession(newSession);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newSession));
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    const cred = DEMO_CREDENTIALS.find((c) => c.role === role) || DEMO_CREDENTIALS[0];
    const profile = currentUserProfiles.find((u) => u.role === role) || currentUserProfiles[0];
    const newSession: AuthSession = {
      userProfile: profile,
      credential: cred,
      loginTimestamp: Date.now(),
    };
    setSession(newSession);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newSession));
  }, []);

  const canAccessRoute = useCallback(
    (path: string): boolean => {
      if (!session) return false;
      const allowed = session.credential.allowedRoutes;
      if (allowed.includes('*')) return true;
      return allowed.some((r) => path.startsWith(r) || path === r);
    },
    [session]
  );

  return (
    <AuthContext.Provider
      value={{
        session,
        isAuthenticated: !!session,
        isLoading,
        loginError,
        login,
        logout,
        switchRole,
        canAccessRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
