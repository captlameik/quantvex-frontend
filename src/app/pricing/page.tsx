'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/apiClient';

const PLANS = [
  {
    id: 'signal',
    name: 'Signal Plan',
    price: '$49',
    period: '/mo',
    badge: null,
    accent: 'blue',
    features: [
      '✓ All AI trading signals',
      '✓ 6+ currency pairs & metals',
      '✓ Confidence score & risk levels',
      '✓ Stop loss & take profit levels',
      '✓ Telegram alerts',
      '✓ Signal dashboard access',
      '✗ Auto execution',
      '✗ Broker connection',
    ],
    cta: 'Start Signal Plan',
  },
  {
    id: 'auto',
    name: 'Auto Trading Plan',
    price: '$149',
    period: '/mo',
    badge: 'Most Popular',
    accent: 'green',
    features: [
      '✓ Everything in Signal Plan',
      '✓ Auto trade execution',
      '✓ Oanda broker integration',
      '✓ AI position sizing',
      '✓ Drawdown circuit breakers',
      '✓ Volatility-adaptive TP/SL',
      '✓ Multi-ticket scale-in entries',
      '✓ Priority support',
    ],
    cta: 'Start Auto Plan',
  },
];

const PAYMENT_METHODS = [
  { id: 'credit_card', label: '💳 Credit Card', desc: 'Visa, Mastercard — via Stripe' },
  { id: 'telebirr', label: '📱 Telebirr', desc: 'Ethiopian mobile payment' },
  { id: 'cbe_birr', label: '🏦 CBE Birr', desc: 'Commercial Bank of Ethiopia' },
  { id: 'mpesa', label: '🟢 M-Pesa', desc: 'East Africa mobile money' },
];

export default function PricingPage() {
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [loading, setLoading] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [freeMode, setFreeMode] = useState(false);
  const [freeModeLoading, setFreeModeLoading] = useState(true);

  const valueChecklist = useMemo(() => ([
    'Guided onboarding to first signal',
    'Risk-aware AI execution controls',
    'Performance visibility and audit logs',
    'Flexible plan upgrade and cancellation',
  ]), []);

  // Check if platform is in free mode
  useEffect(() => {
    apiFetch<{ free_mode: boolean }>('/stats/free-mode', {})
      .then(res => { setFreeMode(res?.free_mode ?? false); })
      .catch(() => { setFreeMode(false); })
      .finally(() => setFreeModeLoading(false));
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (freeMode) {
      window.location.href = '/sign-up';
      return;
    }

    setMessage(''); setError(''); setLoading(planId);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      window.location.href = `/register?plan=${planId}`;
      return;
    }

    try {
      if (selectedMethod === 'credit_card') {
        const data = await apiFetch<{ checkout_url: string }>(
          `/subscriptions/checkout-url?mode=${planId}`, {}, token
        );
        if (data?.checkout_url) {
          window.location.href = data.checkout_url;
        }
      } else {
        const data = await apiFetch<{ success: boolean; message: string }>(
          '/payments/pay',
          {
            method: 'POST',
            body: JSON.stringify({
              method: selectedMethod,
              plan: planId,
              amount: planId === 'signal' ? 49 : 149,
              currency: 'USD',
            }),
          },
          token
        );
        setMessage(data?.message || 'Payment initiated. Check your provider.');
      }
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 400 && e.message.includes('not configured')) {
        setError('Stripe is not configured yet. Contact support to set up payments.');
      } else {
        setError(e.message || 'Failed to start checkout. Please try again.');
      }
    } finally {
      setLoading('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '0 24px' }}>
      <div style={{ background: 'var(--gradient-bg)', position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5,10,18,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)', padding: '0 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: '1rem', textDecoration: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="AIXTrader" style={{ width: 28, height: 28, borderRadius: 6 }} />
            AIX<span className="gradient-text">Trader</span>
          </Link>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href="/sign-in" style={{ padding: '7px 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none', border: '1px solid var(--border-default)', borderRadius: 8 }}>Login</Link>
            <Link href="/dashboard" style={{ padding: '7px 14px', fontSize: '0.8125rem', color: 'var(--text-primary)', textDecoration: 'none', background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: '1px solid var(--border-default)' }}>Dashboard</Link>
          </div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1, maxWidth: 1080, margin: '0 auto', padding: '64px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-green" style={{ marginBottom: 16 }}>Phase 2: Plan Selection</span>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Choose your <span className="gradient-text">activation path</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: 480, margin: '0 auto' }}>
            {freeMode
              ? '🎉 The platform is currently FREE for all users. Sign up and get full access!'
              : 'Start with signal intelligence or unlock full automated execution.'}
          </p>
        </div>

        {/* Free Mode Banner */}
        {freeMode && !freeModeLoading && (
          <div style={{
            padding: '20px 28px', borderRadius: '16px', marginBottom: '32px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(14,165,233,0.08))',
            border: '1px solid rgba(0,255,136,0.3)',
          }}>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#00ff88', marginBottom: '6px' }}>
              🎊 FREE ACCESS ENABLED
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              All plans are currently free. Create an account to start trading with AI-powered signals immediately.
            </p>
          </div>
        )}

        <div className="hero-grid" style={{ alignItems: 'start', gap: 24, marginBottom: 32 }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={`glass-card ${plan.badge ? 'pricing-popular glow-green' : ''}`}
              style={{ padding: 28, position: 'relative' }}
            >
              <span className={`badge badge-${plan.accent}`} style={{ marginBottom: 16 }}>{plan.name}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                {freeMode ? (
                  <>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#00ff88' }}>FREE</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'line-through', marginLeft: '8px' }}>{plan.price}{plan.period}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em', color: plan.accent === 'green' ? 'var(--neon-green)' : 'var(--electric-blue)' }}>{plan.price}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{plan.period}</span>
                  </>
                )}
              </div>
              <ul style={{ listStyle: 'none', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} style={{
                    fontSize: '0.875rem',
                    color: f.startsWith('✓') ? 'var(--text-secondary)' : 'var(--text-muted)',
                    display: 'flex', gap: 8,
                  }}>
                    <span style={{ color: f.startsWith('✓') ? 'var(--neon-green)' : 'var(--text-muted)', flexShrink: 0 }}>
                      {freeMode && f.startsWith('✗') ? '✓' : f[0]}
                    </span>
                    {f.slice(2)}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={!!loading}
                className={plan.accent === 'green' ? 'btn-primary' : 'btn-secondary'}
                style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading === plan.id ? 'Redirecting…' : freeMode ? 'Get Started Free' : plan.cta}
              </button>
              <p style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {freeMode ? 'No credit card required.' : 'No lock-in contract. Upgrade or downgrade any time.'}
              </p>
            </div>
          ))}
        </div>

        {!freeMode && (
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Payment Methods</p>
            <div className="features-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  style={{
                    padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${selectedMethod === m.id ? 'var(--neon-green)' : 'var(--border-default)'}`,
                    background: selectedMethod === m.id ? 'rgba(0,255,136,0.06)' : 'var(--bg-card)',
                    color: selectedMethod === m.id ? 'var(--neon-green)' : 'var(--text-secondary)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.8125rem', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            What you get before first live trade
          </p>
          <div className="features-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {valueChecklist.map((item) => (
              <div key={item} className="metric-card" style={{ padding: 16 }}>
                <span style={{ color: 'var(--neon-green)', marginRight: 8 }}>✓</span>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {message && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(0,255,136,0.07)', border: '1px solid var(--border-green)', color: 'var(--neon-green)', fontSize: '0.875rem', marginBottom: 16 }}>{message}</div>}
        {error && <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(255,94,122,0.07)', border: '1px solid rgba(255,94,122,0.2)', color: '#ff5e7a', fontSize: '0.875rem', marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginTop: 32 }}>
          {['🔒 SSL Secured', '✅ Cancel Anytime', '🌍 Global Access', '⚡ Instant Activation'].map(t => (
            <span key={t} style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{t}</span>
          ))}
        </div>
      </main>
    </div>
  );
}
