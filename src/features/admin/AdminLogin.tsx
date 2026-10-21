import React, { useState } from 'react';
import { useData } from '../../lib/dataContext.tsx';
import { Camera, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { SeoHead } from '../../components/SeoHead.tsx';

export const AdminLogin: React.FC = () => {
  const { loginAdmin, isLoading } = useData();
  const [email, setEmail] = useState('admin@wrishu.com');
  const [password, setPassword] = useState('wrishu2026');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await loginAdmin(email, password);
    if (!res.success) {
      setError(res.error || 'Authentication failed');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <SeoHead title="Admin Login - Wrishu Photography" noIndex={true} />

      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#141414',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '6px',
          padding: '40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <img
              src="/wrishu-logo.png"
              alt="Wrishu Photography"
              style={{ height: '42px', objectFit: 'contain', margin: '0 auto 10px', display: 'block' }}
            />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.8rem', color: 'var(--color-gold)' }}>
              PORTFOLIO ADMIN
            </span>
          </div>
          <h2 style={{ fontSize: '1.2rem', color: '#EEE', fontWeight: 600 }}>Portfolio Control Center</h2>
          <p style={{ color: '#888', fontSize: '0.82rem', marginTop: '6px' }}>
            Protected by Row Level Security and role-based authorization.
          </p>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              color: '#f87171',
              padding: '10px 14px',
              borderRadius: '4px',
              fontSize: '0.82rem',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Administrator Email
            </label>
            <input
              type="email"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label style={{ fontSize: '0.78rem', color: '#AAA', display: 'block', marginBottom: '6px' }}>
              Password
            </label>
            <input
              type="password"
              className="form-input"
              style={{ textAlign: 'left' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-gold"
            style={{ width: '100%', padding: '14px' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Lock size={15} />
                <span>SIGN IN TO DASHBOARD</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', borderTop: '1px solid #222', paddingTop: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#666' }}>
            Pre-loaded demo credentials for preview: <code>admin@wrishu.com</code>
          </p>
        </div>
      </div>
    </div>
  );
};
