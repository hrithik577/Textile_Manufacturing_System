import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types';

export interface DemoCredential {
  email: string;
  role: UserRole;
  displayRole: string;
  description: string;
  accessLevel: 'admin' | 'manager' | 'operator' | 'viewer';
  allowedRoutes: string[];
}

// ─── Documented Role Profiles for Mill Operations ────────────────────────
export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: 'manager@everest.com',
    role: 'manager',
    displayRole: 'Plant Operations Manager',
    description: 'Full plant oversight — dashboard, production floor, orders, inventory, dispatch',
    accessLevel: 'admin',
    allowedRoutes: ['*'],
  },
  {
    email: 'production@everest.com',
    role: 'production',
    displayRole: 'Production Supervisor',
    description: 'Floor looms, batch runs, shifts, workforce attendance',
    accessLevel: 'manager',
    allowedRoutes: ['/dashboard', '/yarniq', '/production', '/orders', '/inventory', '/quality', '/finished-goods', '/workforce', '/rescue-engine'],
  },
  {
    email: 'quality@everest.com',
    role: 'quality',
    displayRole: 'QA & Inspection Lead',
    description: 'Fabric inspection, 4-point defect grading, roll genealogy',
    accessLevel: 'operator',
    allowedRoutes: ['/dashboard', '/yarniq', '/quality', '/finished-goods', '/production', '/orders', '/rescue-engine'],
  },
  {
    email: 'inventory@everest.com',
    role: 'inventory',
    displayRole: 'Stores & Yarn Inventory Lead',
    description: 'Yarn gate receipts, warehouse bins, stock movements',
    accessLevel: 'manager',
    allowedRoutes: ['/dashboard', '/yarniq', '/inventory', '/dispatch', '/orders', '/finished-goods', '/rescue-engine'],
  },
  {
    email: 'dispatch@everest.com',
    role: 'dispatch',
    displayRole: 'Dispatch & Logistics Lead',
    description: 'Delivery challans, packaging, duplicate dispatch prevention',
    accessLevel: 'operator',
    allowedRoutes: ['/dashboard', '/dispatch', '/finished-goods', '/orders'],
  },
  {
    email: 'finance@everest.com',
    role: 'finance',
    displayRole: 'Finance & Controller',
    description: 'Financial close, month-end P&L reconciliation, order cost absorption',
    accessLevel: 'admin',
    allowedRoutes: ['/dashboard', '/closing-the-books', '/orders', '/inventory', '/workforce', '/analytics', '/rescue-engine'],
  },
  {
    email: 'buyer@nordic.com',
    role: 'buyer',
    displayRole: 'Nordic Apparel Partner',
    description: 'Buyer portal, purchase order placement, real-time dispatch tracking',
    accessLevel: 'viewer',
    allowedRoutes: ['/buyer/orders', '/place-order', '/buyer'],
  },
  {
    email: 'owner@everest.com',
    role: 'owner',
    displayRole: 'Mill Executive / Owner',
    description: 'Executive control tower, audit logs, financials, full system permissions',
    accessLevel: 'admin',
    allowedRoutes: ['*'],
  },
];

const AUTH_SESSION_KEY = 'everest_auth_session';
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:8000/api/v1';

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

function resolveRolePermissions(role: string): { accessLevel: 'admin' | 'manager' | 'operator' | 'viewer'; allowedRoutes: string[] } {
  const normRole = role.toLowerCase();
  if (normRole === 'owner' || normRole === 'manager' || normRole === 'plant_manager') {
    return { accessLevel: 'admin', allowedRoutes: ['*'] };
  }
  if (normRole === 'finance') {
    return {
      accessLevel: 'admin',
      allowedRoutes: ['/dashboard', '/closing-the-books', '/orders', '/inventory', '/workforce', '/analytics', '/rescue-engine'],
    };
  }
  if (normRole === 'production' || normRole === 'production_supervisor') {
    return {
      accessLevel: 'manager',
      allowedRoutes: ['/dashboard', '/yarniq', '/production', '/orders', '/inventory', '/quality', '/finished-goods', '/workforce', '/rescue-engine'],
    };
  }
  if (normRole === 'quality' || normRole === 'quality_inspector') {
    return {
      accessLevel: 'operator',
      allowedRoutes: ['/dashboard', '/yarniq', '/quality', '/finished-goods', '/production', '/orders', '/rescue-engine'],
    };
  }
  if (normRole === 'inventory' || normRole === 'inventory_lead') {
    return {
      accessLevel: 'manager',
      allowedRoutes: ['/dashboard', '/yarniq', '/inventory', '/dispatch', '/orders', '/finished-goods', '/rescue-engine'],
    };
  }
  if (normRole === 'dispatch') {
    return {
      accessLevel: 'operator',
      allowedRoutes: ['/dashboard', '/dispatch', '/finished-goods', '/orders'],
    };
  }
  if (normRole === 'buyer') {
    return {
      accessLevel: 'viewer',
      allowedRoutes: ['/buyer/orders', '/place-order', '/buyer'],
    };
  }
  return { accessLevel: 'viewer', allowedRoutes: ['/dashboard'] };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Validate session against real backend identity on mount
  useEffect(() => {
    let isMounted = true;

    async function restoreAuthSession() {
      try {
        const token = localStorage.getItem('everest_auth_token');
        if (!token) {
          if (isMounted) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        // Verify token with backend /api/v1/auth/me
        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (res.ok) {
          const user = await res.json();
          const { accessLevel, allowedRoutes } = resolveRolePermissions(user.role);
          const matchedCred = DEMO_CREDENTIALS.find((c) => c.email.toLowerCase() === user.email.toLowerCase());

          const userProfile: UserProfile = {
            id: String(user.id),
            name: user.name,
            email: user.email,
            role: user.role as UserRole,
            department: user.role.toUpperCase(),
            avatarInitials: user.name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase(),
          };

          const activeSession: AuthSession = {
            userProfile,
            credential: matchedCred || {
              email: user.email,
              role: user.role as UserRole,
              displayRole: user.role.toUpperCase(),
              description: `Authenticated as ${user.role}`,
              accessLevel,
              allowedRoutes,
            },
            loginTimestamp: Date.now(),
          };

          if (isMounted) {
            setSession(activeSession);
            localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(activeSession));
          }
        } else {
          // Token is invalid, expired, or account disabled
          localStorage.removeItem('everest_auth_token');
          localStorage.removeItem(AUTH_SESSION_KEY);
          if (isMounted) setSession(null);
        }
      } catch (err) {
        // Network failure while verifying token — if cached session exists, retain temporarily or prompt login
        const stored = localStorage.getItem(AUTH_SESSION_KEY);
        if (stored) {
          try {
            const parsed: AuthSession = JSON.parse(stored);
            if (Date.now() - parsed.loginTimestamp < 8 * 60 * 60 * 1000) {
              if (isMounted) setSession(parsed);
              return;
            }
          } catch {
            localStorage.removeItem(AUTH_SESSION_KEY);
          }
        }
        if (isMounted) setSession(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreAuthSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoginError(null);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        const msg = err?.detail || 'Invalid email or password.';
        setLoginError(msg);
        setIsLoading(false);
        return false;
      }

      const data = await res.json();
      if (!data.access_token || !data.user) {
        setLoginError('Authentication response missing access credentials.');
        setIsLoading(false);
        return false;
      }

      localStorage.setItem('everest_auth_token', data.access_token);

      const user = data.user;
      const { accessLevel, allowedRoutes } = resolveRolePermissions(user.role);
      const matchedCred = DEMO_CREDENTIALS.find((c) => c.email.toLowerCase() === user.email.toLowerCase());

      const userProfile: UserProfile = {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        department: user.role.toUpperCase(),
        avatarInitials: user.name
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase(),
      };

      const newSession: AuthSession = {
        userProfile,
        credential: matchedCred || {
          email: user.email,
          role: user.role as UserRole,
          displayRole: user.role.toUpperCase(),
          description: `Authenticated as ${user.role}`,
          accessLevel,
          allowedRoutes,
        },
        loginTimestamp: Date.now(),
      };

      setSession(newSession);
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(newSession));
      setIsLoading(false);
      return true;
    } catch (err: any) {
      setLoginError(`Unable to reach authentication server: ${err.message || 'Network error'}`);
      setIsLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    const token = localStorage.getItem('everest_auth_token');
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setSession(null);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem('everest_auth_token');
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    // Role switching in demo/development only updates local display context
    // Real permissions remain governed by the backend token
    const cred = DEMO_CREDENTIALS.find((c) => c.role === role) || DEMO_CREDENTIALS[0];
    const { accessLevel, allowedRoutes } = resolveRolePermissions(role);
    const updatedSession: AuthSession = {
      userProfile: {
        id: '1',
        name: cred.displayRole,
        email: cred.email,
        role,
        department: role.toUpperCase(),
        avatarInitials: cred.displayRole.slice(0, 2).toUpperCase(),
      },
      credential: {
        ...cred,
        accessLevel,
        allowedRoutes,
      },
      loginTimestamp: Date.now(),
    };
    setSession(updatedSession);
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updatedSession));
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
