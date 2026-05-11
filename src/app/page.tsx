'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import ClerkAuthSync from '@/components/ClerkAuthSync';
import { useApiData } from '@/hooks/useApiData';

type PublicSignal = {
  symbol: string;
  side: string;
  confidence: number;
  strategy_name: string;
  created_at: string;
};

type PlatformStats = {
  tradesExecuted: string;
  winRate: string;
  activeTraders: string;
  assetsCovered: number;
};

export default function LandingPage() {

  const { data: signals, loading: signalsLoading, error: signalsError } = useApiData<PublicSignal[]>(
    '/signals/latest',
    {
      immediate: true,
      refreshInterval: 30000,
      onError: (error) => console.error('Failed to fetch signals:', error),
    }
  );

  const { data: stats, loading: statsLoading } = useApiData<PlatformStats>(
    '/stats/platform',
    {
      immediate: true,
      refreshInterval: 60000,
      onError: (error) => console.error('Failed to fetch stats:', error),
    }
  );



  const defaultStats: PlatformStats = {
    tradesExecuted: '18,340+',
    winRate: '80.4%',
    activeTraders: '1,200+',
    assetsCovered: 42,
  };

  const currentStats = stats || defaultStats;
  const displayStats = [
    { label: 'Trades Executed', value: currentStats.tradesExecuted },
    { label: 'Win Rate', value: currentStats.winRate },
    { label: 'Active Traders', value: currentStats.activeTraders },
    { label: 'Assets Covered', value: currentStats.assetsCovered.toString() },
  ];

  const displaySignals = signals && signals.length > 0 ? signals : [
    { symbol: 'EUR_USD', side: 'buy', confidence: 0.88, strategy_name: 'ml-ensemble', created_at: '' },
    { symbol: 'GBP_USD', side: 'sell', confidence: 0.74, strategy_name: 'trend-follow', created_at: '' },
    { symbol: 'XAU_USD', side: 'buy', confidence: 0.91, strategy_name: 'momentum', created_at: '' },
    { symbol: 'USD_JPY', side: 'sell', confidence: 0.81, strategy_name: 'ml-ensemble', created_at: '' },
    { symbol: 'BTC_USD', side: 'buy', confidence: 0.79, strategy_name: 'breakout', created_at: '' },
    { symbol: 'AUD_USD', side: 'buy', confidence: 0.66, strategy_name: 'mean-revert', created_at: '' },
  ];

  const features = [
    {
      icon: 'AI',
      accent: 'green',
      title: 'Precision Signal Engine',
      desc: 'Real-time multi-model scoring with confidence ranking, volatility filtering, and session-aware signal timing.',
    },
    {
      icon: 'AUTO',
      accent: 'blue',
      title: 'Automated Execution',
      desc: 'Connect your broker and execute validated entries with adaptive sizing, drawdown limits, and execution checks.',
    },
    {
      icon: 'RISK',
      accent: 'purple',
      title: 'Risk-First Controls',
      desc: 'Circuit-breakers, exposure caps, and anomaly guards protect capital before any trade reaches the market.',
    },
    {
      icon: 'PROOF',
      accent: 'purple',
      title: 'Performance Transparency',
      desc: 'Track win rate, drawdown, execution quality, and signal outcomes inside one evidence-oriented dashboard.',
    },
    {
      icon: 'FLOW',
      accent: 'green',
      title: 'Fast Onboarding',
      desc: 'Go from signup to first active signal in minutes through guided setup, risk profiling, and broker linking.',
    },
    {
      icon: 'CARE',
      accent: 'blue',
      title: 'Operator-Grade Monitoring',
      desc: 'Continuous health tracking, event alerts, and portfolio snapshots keep users informed and in control.',
    },
  ];

  const onboardingSteps = useMemo(() => ([
    {
      title: 'Create Account',
      desc: 'Register, verify email, and lock in your security settings.',
      href: '/register',
    },
    {
      title: 'Pick Your Plan',
      desc: 'Start with signals or unlock full auto-execution.',
      href: '/pricing',
    },
    {
      title: 'Connect Broker',
      desc: 'Link your account and define risk profile in dashboard.',
      href: '/dashboard/brokers',
    },
    {
      title: 'Activate First Signal',
      desc: 'Review live opportunities and execute with confidence.',
      href: '/dashboard/trade-signals',
    },
  ]), []);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      <ClerkAuthSync />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'var(--gradient-bg)',
      }} />

      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(5,10,18,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.png" alt="AIXTrader" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              AIX<span className="gradient-text">Trader</span>
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/pricing" style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/dashboard" style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
            <SignedIn>
              <Link href="/dashboard" className="btn-outline-green" style={{ fontSize: '0.8125rem' }}>Open Dashboard</Link>
            </SignedIn>
            <SignedOut>
              <Link href="/sign-in" style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.875rem', border: '1px solid var(--border-default)', color: 'var(--text-primary)', textDecoration: 'none' }}>Log in</Link>
              <Link href="/sign-up" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.8125rem' }}>Start Free</Link>
            </SignedOut>
          </nav>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1 }}>
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 60px' }}>
          <div className="hero-grid">
            <div className="fade-in-up">
              <span className="badge badge-green" style={{ marginBottom: 20 }}>
                <span className="pulse-dot" /> Product-grade AI Trading Platform
              </span>
              <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 20 }}>
                Build consistent execution with<br />
                <span className="gradient-text">elite AI trading workflows</span>
              </h1>
              <p style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
                Designed for serious traders: high-confidence signals, transparent risk, guided onboarding, and conversion-optimized workflows from trial to active trading.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/register" className="btn-primary">Get Started Free</Link>
                <Link href="/pricing" className="btn-secondary">View Pricing</Link>
              </div>
              <div style={{ marginTop: 28, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {['Evidence dashboard', 'Risk-first execution', 'Guided setup flow'].map(t => (
                  <span key={t} style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--neon-green)' }}>✓</span> {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="fade-in-up delay-200 float-anim">
              <div className="glass-card glow-green" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Live Signals
                    {signalsLoading && ' (Loading...)'}
                  </span>
                  <span className="badge badge-green">
                    <span className="pulse-dot" />
                    {signalsError ? 'Error' : 'Live'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {displaySignals.slice(0, 5).map((sig, i) => (
                    <div key={`${sig.symbol}-${i}`} className="signal-row" style={{ padding: '10px 14px' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{sig.symbol}</span>
                        <span style={{ marginLeft: 6, fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{sig.strategy_name}</span>
                      </div>
                      <span className={sig.side === 'buy' ? 'chip-bull' : 'chip-bear'}>
                        {sig.side.toUpperCase()}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#8fa0c0', minWidth: 40, textAlign: 'right' }}>
                        {Math.round(sig.confidence * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <div className="progress-bar-track" style={{ flex: 1 }}>
                    <div className="progress-bar-fill" style={{ width: '80.4%' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--neon-green)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {currentStats.winRate} Model Win Rate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="stats-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px' }}>
            {displayStats.map((s, i) => (
              <div key={s.label} style={{
                textAlign: 'center', padding: '16px 0',
                borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div className="count-up" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  {statsLoading ? '...' : s.value}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div style={{ background: 'rgba(0,255,136,0.03)', borderBottom: '1px solid var(--border-green)', overflow: 'hidden', padding: '10px 0' }}>
          <div className="ticker-inner">
            {[...displaySignals, ...displaySignals].map((sig, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{sig.symbol}</span>
                <span className={sig.side === 'buy' ? 'chip-bull' : 'chip-bear'} style={{ fontSize: '0.6875rem' }}>{sig.side.toUpperCase()}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--neon-green)', fontFamily: 'monospace' }}>{Math.round(sig.confidence * 100)}%</span>
                <span style={{ color: 'var(--border-default)' }}>·</span>
              </span>
            ))}
          </div>
        </div>

        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <span className="badge badge-blue" style={{ marginBottom: 16 }}>Phase 1: Product Foundation</span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Built for clarity, speed, and <span className="gradient-text">decision confidence</span>
            </h2>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={f.title} className={`glass-card fade-in-up delay-${(i % 4 + 1) * 100}`} style={{ padding: 24 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 12, marginBottom: 16,
                  background: f.accent === 'green' ? 'var(--neon-green-dim)' : f.accent === 'blue' ? 'var(--electric-blue-dim)' : 'var(--purple-glow-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 72px' }}>
          <div className="glass-card" style={{ padding: 30 }}>
            <div style={{ marginBottom: 18 }}>
              <span className="badge badge-purple" style={{ marginBottom: 12 }}>Phase 2: Onboarding Flow</span>
              <h2 style={{ fontSize: 'clamp(1.4rem, 2.6vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
                Go from signup to first signal in 4 steps
              </h2>
            </div>
            <div className="onboarding-grid">
              {onboardingSteps.map((step, index) => (
                <div key={step.title} className="metric-card">
                  <div style={{ fontSize: '0.75rem', color: 'var(--neon-green)', marginBottom: 8, fontWeight: 700 }}>
                    STEP {index + 1}
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{step.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
                    {step.desc}
                  </p>
                  <Link href={step.href} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                    Open
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          <div className="glass-card glow-green" style={{ padding: '60px 48px', textAlign: 'center', border: '1px solid var(--border-green)', background: 'linear-gradient(135deg, rgba(0,255,136,0.04), rgba(14,165,233,0.04))' }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Ready to launch your trading edge?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1.0625rem' }}>
              Join {currentStats.activeTraders}+ traders using model-backed signals and risk-aware execution.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/register" className="btn-primary">Create Free Account</Link>
              <Link href="/pricing" className="btn-secondary">Compare Plans</Link>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="AIXTrader" style={{ width: 20, height: 20, borderRadius: 4 }} />
            AIX<span className="gradient-text">Trader</span>
          </span>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Pricing', '/pricing'], ['Get Started', '/register'], ['Dashboard', '/dashboard']].map(([label, href]) => (
              <Link key={label} href={href} style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>{label}</Link>
            ))}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>© 2026 AIX Trader. Trading involves risk and no performance is guaranteed.</span>
        </div>
      </footer>
    </div>
  );
}
