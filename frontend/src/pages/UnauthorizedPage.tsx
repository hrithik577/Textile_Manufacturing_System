import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0b14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        gap: '20px',
        padding: '32px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'rgba(239,68,68,0.12)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
        </svg>
      </div>

      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#f1f5f9', margin: '0 0 10px' }}>
          Access Restricted
        </h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
          Your role <strong style={{ color: '#94a3b8' }}>({session?.credential.displayRole ?? 'Unknown'})</strong> does not
          have permission to view this page. Contact your plant manager for access.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          id="btn-go-back"
          onClick={() => navigate(-1)}
          style={{
            padding: '11px 24px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Go Back
        </button>
        <button
          id="btn-goto-dashboard"
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '11px 24px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Dashboard
        </button>
      </div>

      <button
        id="btn-logout-unauthorized"
        onClick={logout}
        style={{
          background: 'none',
          border: 'none',
          color: '#475569',
          fontSize: '13px',
          cursor: 'pointer',
          textDecoration: 'underline',
        }}
      >
        Sign in as a different role
      </button>
    </div>
  );
};
