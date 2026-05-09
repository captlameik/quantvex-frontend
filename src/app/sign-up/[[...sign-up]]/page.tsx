'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      padding: '36px 20px',
    }}>
      <div style={{ background: 'var(--gradient-bg)', position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <div className="hero-grid" style={{ position: 'relative', zIndex: 1, maxWidth: 980, margin: '0 auto', alignItems: 'start' }}>
        {/* Left promo column */}
        <div style={{ paddingTop: 24 }}>
          <span className="badge badge-blue" style={{ marginBottom: 16 }}>Phase 2: Onboarding</span>
          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', marginBottom: 12, lineHeight: 1.15 }}>
            Create your account and<br />
            <span className="gradient-text">activate your first strategy</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 520, marginBottom: 24 }}>
            Signup, verify your identity, pick a plan, connect your broker, and start receiving live opportunities.
          </p>
          <div className="metric-card" style={{ maxWidth: 520 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--neon-green)', marginBottom: 10, fontWeight: 700 }}>
              WHY CLERK AUTH
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Social logins (Google, GitHub, etc.)',
                'Built-in MFA & device management',
                'Secure session handling',
                'Webhook-synced user profiles',
              ].map(item => (
                <span key={item} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--neon-green)' }}>✓</span> {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Clerk Sign-Up widget */}
        <div className="fade-in-up delay-200" style={{ display: 'flex', justifyContent: 'center' }}>
          <SignUp
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
                socialButtonsBlockButton: {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f0f4ff',
                  borderRadius: '10px',
                },
              },
            }}
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>

      <footer style={{ marginTop: 40, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/sign-in" style={{ color: 'var(--electric-blue)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </p>
      </footer>
    </div>
  );
}
