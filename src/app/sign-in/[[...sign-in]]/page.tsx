'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'var(--gradient-bg)',
      }} />
      <div style={{
        position: 'fixed', top: '-10%', left: '10%', width: '60vw', height: '60vw',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(14,165,233,0.04) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '10%', width: '50vw', height: '50vw',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(0,255,136,0.04) 0%, transparent 70%)',
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,10,18,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #00ff88, #0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800,
            }}>⚡</div>
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              AIX<span className="gradient-text">Trader</span>
            </span>
          </Link>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            New to the platform?{' '}
            <Link href="/sign-up" style={{ color: 'var(--neon-green)', textDecoration: 'none', fontWeight: 600 }}>
              Create Account
            </Link>
          </p>
        </div>
      </header>

      {/* Main */}
      <main style={{ flex: 1, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div className="hero-grid" style={{ maxWidth: 980, width: '100%' }}>
          {/* Left promo column */}
          <div className="fade-in-up" style={{ padding: '0 16px' }}>
            <span className="badge badge-green" style={{ marginBottom: 20 }}>
              <span className="pulse-dot" /> Secure account access
            </span>
            <h1 style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
              fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16,
            }}>
              Welcome back to<br />
              <span className="gradient-text">AIX Trader command center</span>
            </h1>
            <p style={{
              fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 36,
            }}>
              Continue where you left off: monitor live signals, tune risk controls, and manage execution from one operating dashboard.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--neon-green)' }}>2FA-ready</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Security</p>
              </div>
              <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--electric-blue)' }}>Realtime</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signal Stream</p>
              </div>
            </div>
          </div>

          {/* Clerk Sign-In widget */}
          <div className="fade-in-up delay-200" style={{ display: 'flex', justifyContent: 'center' }}>
            <SignIn
              appearance={{
                elements: {
                  rootBox: { width: '100%', maxWidth: 440 },
                  card: {
                    background: 'rgba(13, 21, 36, 0.85)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(0,255,136,0.12)',
                    borderRadius: '16px',
                    boxShadow: '0 0 40px rgba(0,255,136,0.06)',
                  },
                  headerTitle: { color: '#f0f4ff' },
                  headerSubtitle: { color: '#8fa0c0' },
                  formFieldLabel: { color: '#8fa0c0' },
                  formFieldInput: {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f0f4ff',
                    borderRadius: '10px',
                  },
                  formButtonPrimary: {
                    background: 'linear-gradient(135deg, #00ff88, #0ea5e9)',
                    color: '#050a12',
                    fontWeight: 700,
                    borderRadius: '10px',
                  },
                  footerActionLink: { color: '#00ff88' },
                  identityPreviewEditButton: { color: '#00ff88' },
                  socialButtonsBlockButton: {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#f0f4ff',
                    borderRadius: '10px',
                  },
                },
              }}
              routing="path"
              path="/sign-in"
              signUpUrl="/sign-up"
              fallbackRedirectUrl="/dashboard"
            />
          </div>
        </div>
      </main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Secure trading access. Keep credentials private and unique.
          </span>
        </div>
      </footer>
    </div>
  );
}
