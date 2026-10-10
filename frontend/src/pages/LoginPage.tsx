import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS, DemoCredential } from '../context/AuthContext';

// ─── Role Badge Colors ───────────────────────────────────────────────────────
const ACCESS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  admin:    { bg: 'rgba(245,158,11,0.15)',  text: '#f59e0b', border: 'rgba(245,158,11,0.3)'  },
  manager:  { bg: 'rgba(99,102,241,0.15)',  text: '#818cf8', border: 'rgba(99,102,241,0.3)'  },
  operator: { bg: 'rgba(34,197,94,0.15)',   text: '#4ade80', border: 'rgba(34,197,94,0.3)'   },
  viewer:   { bg: 'rgba(148,163,184,0.12)', text: '#94a3b8', border: 'rgba(148,163,184,0.3)' },
};

export const LoginPage: React.FC = () => {
  const { login, loginError, isLoading, isAuthenticated, session } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [particles, setParticles] = useState<{ x: number; y: number; size: number; opacity: number; speed: number }[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && session) {
      const defaultRoute =
        session.credential.allowedRoutes.includes('*')
          ? '/dashboard'
          : session.credential.allowedRoutes[0] ?? '/dashboard';
      navigate(defaultRoute, { replace: true });
    }
  }, [isAuthenticated, session, navigate]);

  // Generate floating particles
  useEffect(() => {
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.3 + 0.1,
    }));
    setParticles(pts);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email.trim(), password);
    if (ok && session) {
      const route =
        session.credential.allowedRoutes.includes('*')
          ? '/dashboard'
          : session.credential.allowedRoutes[0] ?? '/dashboard';
      navigate(route, { replace: true });
    }
  };

  const fillCredential = (cred: DemoCredential) => {
    setEmail(cred.email);
    setPassword(cred.password);
  };

  return (
    <div style={styles.root}>
      {/* Animated Background */}
      <div style={styles.bgGradient} />
      <div style={styles.bgGrid} />

      {/* Floating Particles */}
      <div style={styles.particleContainer}>
        {particles.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: '50%',
              background: 'rgba(99,102,241,0.6)',
              opacity: p.opacity,
              animation: `float ${5 + p.speed * 10}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Layout: two columns on wide screens */}
      <div style={styles.layout}>

        {/* LEFT PANEL — Branding */}
        <div style={styles.leftPanel}>
          <div style={styles.brandContainer}>
            <div style={styles.logoIcon}>
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                <rect width="38" height="38" rx="10" fill="url(#lg1)" />
                <path d="M8 19 L19 8 L30 19 L19 30 Z" stroke="white" strokeWidth="2.5" fill="none" opacity="0.9"/>
                <circle cx="19" cy="19" r="4" fill="white" opacity="0.95"/>
                <defs>
                  <linearGradient id="lg1" x1="0" y1="0" x2="38" y2="38">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 style={styles.brandName}>Everest Textile OS</h1>
          </div>

          <div style={styles.heroText}>
            <h2 style={styles.heroHeading}>
              Manufacturing Intelligence<br/>
              <span style={styles.heroAccent}>at Every Level</span>
            </h2>
            <p style={styles.heroDesc}>
              A unified operations platform for plant managers, production supervisors,
              quality teams, logistics, and buyers — all in one secure workspace.
            </p>
          </div>

          {/* Stats Row */}
          <div style={styles.statsRow}>
            {[
              { label: 'Production Floors', value: '4' },
              { label: 'Live Machines', value: '24' },
              { label: 'Active Orders', value: '48' },
            ].map((s) => (
              <div key={s.label} style={styles.statCard}>
                <span style={styles.statValue}>{s.value}</span>
                <span style={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Role Cards for quick fill */}
          <div style={styles.roleSection}>
            <p style={styles.roleSectionLabel}>Quick Access — Select a Demo Role</p>
            <div style={styles.roleGrid}>
              {DEMO_CREDENTIALS.map((cred) => {
                const colors = ACCESS_COLORS[cred.accessLevel];
                const isActive = email === cred.email;
                return (
                  <button
                    key={cred.role}
                    onClick={() => fillCredential(cred)}
                    style={{
                      ...styles.roleCard,
                      borderColor: isActive ? colors.text : 'rgba(255,255,255,0.07)',
                      background: isActive ? colors.bg : 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ ...styles.roleBadge, background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                        {cred.accessLevel.toUpperCase()}
                      </span>
                      <span style={styles.roleTitle}>{cred.displayRole}</span>
                    </div>
                    <p style={styles.roleDesc}>{cred.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Login Form */}
        <div style={styles.rightPanel}>
          <div style={styles.formCard}>
            {/* Card header */}
            <div style={styles.formHeader}>
              <h3 style={styles.formTitle}>Sign In</h3>
              <p style={styles.formSubtitle}>Access your role-specific workspace</p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
              {/* Email field */}
              <div style={styles.fieldGroup}>
                <label htmlFor="login-email" style={styles.label}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <span style={styles.fieldIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M2 8l10 6 10-6"/>
                    </svg>
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="you@everesttextiles.com"
                    required
                    autoComplete="username"
                    style={{
                      ...styles.input,
                      borderColor: focused === 'email' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                      boxShadow: focused === 'email' ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password field */}
              <div style={styles.fieldGroup}>
                <label htmlFor="login-password" style={styles.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <span style={styles.fieldIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    style={{
                      ...styles.input,
                      paddingRight: '48px',
                      borderColor: focused === 'password' ? '#6366f1' : 'rgba(255,255,255,0.1)',
                      boxShadow: focused === 'password' ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    style={styles.eyeButton}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {loginError && (
                <div style={styles.errorBox}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span>{loginError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                style={{
                  ...styles.submitBtn,
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? (
                  <span style={styles.spinnerWrap}>
                    <span style={styles.spinner} />
                    Signing in…
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Sign In to Workspace
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div style={styles.cardFooter}>
              <div style={styles.securityBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Secured with role-based access control
              </div>
              <p style={styles.versionTag}>Everest Textile OS · v2.1.0</p>
            </div>
          </div>
        </div>

      </div>

      {/* Global CSS for animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes float {
          from { transform: translateY(0px) scale(1); }
          to { transform: translateY(-20px) scale(1.1); }
        }
        @keyframes spin360 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        #btn-login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(99,102,241,0.5) !important;
        }
        #btn-login-submit:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

// ─── Inline Styles ──────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#0a0b14',
    display: 'flex',
    alignItems: 'stretch',
    fontFamily: "'Inter', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgGradient: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(99,102,241,0.18) 0%, transparent 60%),' +
      'radial-gradient(ellipse 60% 80% at 80% 80%, rgba(139,92,246,0.12) 0%, transparent 55%)',
    pointerEvents: 'none',
  },
  bgGrid: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),' +
      'linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
    backgroundSize: '48px 48px',
    pointerEvents: 'none',
  },
  particleContainer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  },
  layout: {
    display: 'flex',
    width: '100%',
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1,
  },

  // ─── Left panel ────────────────────────────────────────────────────────────
  leftPanel: {
    flex: 1,
    padding: '48px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    overflowY: 'auto',
    borderRight: '1px solid rgba(255,255,255,0.05)',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logoIcon: {
    flexShrink: 0,
  },
  brandName: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#e2e8f0',
    letterSpacing: '-0.3px',
    margin: 0,
  },
  heroText: {
    maxWidth: '480px',
  },
  heroHeading: {
    fontSize: 'clamp(26px, 3vw, 38px)',
    fontWeight: 700,
    color: '#f1f5f9',
    lineHeight: 1.25,
    margin: '0 0 16px 0',
    letterSpacing: '-0.5px',
  },
  heroAccent: {
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroDesc: {
    fontSize: '15px',
    color: '#94a3b8',
    lineHeight: 1.6,
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
  },
  statCard: {
    flex: 1,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#818cf8',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: 500,
  },
  roleSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  },
  roleSectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: 0,
  },
  roleGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  roleCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px',
    padding: '12px 14px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.18s ease',
    color: 'inherit',
  },
  roleBadge: {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '2px 7px',
    borderRadius: '20px',
    flexShrink: 0,
  },
  roleTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  roleDesc: {
    fontSize: '11px',
    color: '#64748b',
    margin: 0,
    lineHeight: 1.4,
  },

  // ─── Right panel ───────────────────────────────────────────────────────────
  rightPanel: {
    width: '420px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 24px',
  },
  formCard: {
    width: '100%',
    background: 'rgba(15,17,30,0.95)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: '20px',
    padding: '36px',
    backdropFilter: 'blur(24px)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
  },
  formHeader: {
    marginBottom: '28px',
  },
  formTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#f1f5f9',
    margin: '0 0 6px 0',
    letterSpacing: '-0.4px',
  },
  formSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#94a3b8',
  },
  fieldIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 42px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    transition: 'color 0.15s',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    color: '#fca5a5',
  },
  submitBtn: {
    width: '100%',
    padding: '13px 20px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s',
    boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin360 0.7s linear infinite',
  },
  cardFooter: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'center',
  },
  securityBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#475569',
  },
  versionTag: {
    fontSize: '11px',
    color: '#334155',
    margin: 0,
  },
};
