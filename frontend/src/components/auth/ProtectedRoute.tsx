import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, checks that the user can access this specific path */
  requiredPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPath }) => {
  const { isAuthenticated, isLoading, canAccessRoute } = useAuth();
  const location = useLocation();

  // While restoring session from localStorage, show nothing (prevents flash)
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0a0b14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid rgba(99,102,241,0.2)',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spin360 0.7s linear infinite',
          }}
        />
        <style>{`@keyframes spin360 { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Route-level access check
  const pathToCheck = requiredPath ?? location.pathname;
  if (!canAccessRoute(pathToCheck)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
