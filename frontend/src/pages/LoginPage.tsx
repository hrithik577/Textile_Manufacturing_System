import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS, DemoCredential } from '../context/AuthContext';

const ACCESS_LABELS: Record<string, string> = {
  admin: 'ADMIN',
  manager: 'MANAGER',
  operator: 'OPERATOR',
  viewer: 'VIEWER',
};

const ACCESS_ACCENT: Record<string, string> = {
  admin: '#F04424',
  manager: '#111111',
  operator: '#1a7a4a',
  viewer: '#6b7280',
};

export const LoginPage: React.FC = () => {
  const { login, loginError, isLoading, isAuthenticated, session, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email.trim(), password);
    if (ok) {
      navigate('/dashboard', { replace: true });
    }
  };

  const fillCredential = (cred: DemoCredential) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  const handleContinueDashboard = () => {
    if (session) {
      const defaultRoute =
        session.credential.allowedRoutes.includes('*')
          ? '/dashboard'
          : session.credential.allowedRoutes[0] ?? '/dashboard';
      navigate(defaultRoute);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif", background: '#F4F2ED' }}>

      {/* LEFT PANEL */}
      <div style={{ width: '52%', background: '#111111', display: 'flex', flexDirection: 'column', padding: '48px', gap: '36px', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', background: '#F04424', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 11 L11 3 L19 11 L11 19 Z" stroke="white" strokeWidth="2" fill="none" />
              <circle cx="11" cy="11" r="3" fill="white" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Everest Textile OS</div>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontFamily: 'monospace' }}>Manufacturing Control Tower · 2026</div>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', color: '#F04424', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '14px' }}>OPERATIONS INTELLIGENCE</div>
          <h1 style={{ fontSize: 'clamp(28px, 3.2vw, 42px)', fontWeight: 900, color: 'white', lineHeight: 1.05, margin: '0 0 16px 0', letterSpacing: '-1px', textTransform: 'uppercase' }}>
            MANUFACTURING<br />INTELLIGENCE<br /><span style={{ color: '#F04424' }}>AT EVERY LEVEL</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0, fontFamily: 'monospace' }}>
            One unified digital operating system replacing notebooks and phone calls across yarn gate entry, weaving floor, quality grading, buyer order desk, finished goods dispatch, and month-end P&L.
          </p>
        </div>

        {/* 6 Mill Operational Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.1)' }}>
          {[
            { label: 'Gate In Yarn', value: 'Scene 1' },
            { label: 'Floor Looms', value: '24 Units' },
            { label: '4-Point QC', value: '100% Roll' },
            { label: 'Buyer Desk', value: 'Zero Calls' },
            { label: 'Dispatch', value: 'GST Sync' },
            { label: 'Owner P&L', value: 'Real Yield' }
          ].map((s) => (
            <div key={s.label} style={{ background: '#111111', padding: '14px 12px' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', fontFamily: 'monospace' }}>{s.value}</div>
              <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontFamily: 'monospace', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick Access Demo Credential Cards */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontFamily: 'monospace' }}>
              Quick Access — Select Demo Role
            </div>
            <span style={{ fontSize: '9px', color: '#F04424', fontFamily: 'monospace' }}>Click to autofill</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'rgba(255,255,255,0.1)' }}>
            {DEMO_CREDENTIALS.map((cred) => {
              const isActive = email === cred.email;
              const accent = ACCESS_ACCENT[cred.accessLevel] || '#F04424';
              return (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => fillCredential(cred)}
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.08)' : '#111111',
                    border: 'none',
                    borderLeft: `3px solid ${isActive ? accent : 'transparent'}`,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <div style={{ flexShrink: 0, minWidth: '130px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '0.16em', color: accent, fontFamily: 'monospace', textTransform: 'uppercase', marginBottom: '2px' }}>
                      {ACCESS_LABELS[cred.accessLevel] || 'ROLE'}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{cred.displayRole}</div>
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', lineHeight: 1.3, flex: 1 }}>
                    {cred.description}
                  </div>
                  {isActive && <div style={{ width: '6px', height: '6px', background: accent, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', background: '#F4F2ED', position: 'relative' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Active Session Banner if already logged in */}
          {isAuthenticated && session && (
            <div style={{ background: '#111111', color: 'white', padding: '16px', marginBottom: '24px', borderLeft: '4px solid #F04424' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em', color: '#F04424', textTransform: 'uppercase', fontFamily: 'monospace' }}>
                  ACTIVE SESSION DETECTED
                </span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                  {session.credential.accessLevel.toUpperCase()}
                </span>
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace' }}>
                Signed in as <strong>{session.userProfile.name}</strong> ({session.credential.displayRole})
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleContinueDashboard}
                  style={{
                    flex: 1,
                    background: '#F04424',
                    border: 'none',
                    color: 'white',
                    padding: '8px 12px',
                    fontSize: '10px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  Enter Dashboard →
                </button>
                <button
                  type="button"
                  onClick={logout}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '8px 12px',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.2em', color: '#F04424', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '8px' }}>
              SECURE WORKSPACE ACCESS
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#111111', margin: '0 0 6px 0', letterSpacing: '-0.5px', textTransform: 'uppercase', lineHeight: 1.05 }}>
              SIGN IN
            </h2>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: 0, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
              Select a demo role on the left or enter credentials to sign in
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} autoComplete="off">
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em', color: '#111111', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '6px' }}>
                EMAIL ADDRESS
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@everesttextiles.com"
                required
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'white',
                  border: '1px solid #111111',
                  color: '#111111',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label htmlFor="login-password" style={{ display: 'block', fontSize: '9px', fontWeight: 800, letterSpacing: '0.18em', color: '#111111', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '6px' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '12px 46px 12px 14px',
                    background: 'white',
                    border: '1px solid #111111',
                    color: '#111111',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPass ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {loginError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(240,68,36,0.08)', border: '1px solid #F04424', padding: '10px 14px', fontSize: '11px', color: '#F04424', fontFamily: 'monospace' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {loginError}
              </div>
            )}

            <button
              id="btn-login-submit"
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: '#111111',
                border: 'none',
                color: 'white',
                fontSize: '11px',
                fontWeight: 900,
                fontFamily: 'monospace',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'background 0.15s',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ display: 'inline-block', width: '13px', height: '13px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin360 0.7s linear infinite' }} />
                  Signing In…
                </>
              ) : (
                <>
                  Sign In to Workspace
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #111111', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '9px', color: '#6b7280', fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Role-Based Access Control
              </span>
              <Link to="/dashboard" style={{ fontSize: '9px', color: '#F04424', fontFamily: 'monospace', textDecoration: 'none', fontWeight: 700 }}>
                Direct View →
              </Link>
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(0,0,0,0.3)', fontFamily: 'monospace' }}>
              Everest Textile OS · Swiss Industrial Editorial Design
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin360 { to { transform: rotate(360deg); } }
        #btn-login-submit:hover:not(:disabled) { background: #F04424 !important; }
      `}</style>
    </div>
  );
};
