'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useAuth, SignOutButton } from '@clerk/nextjs';
import ClerkAuthSync from '@/components/ClerkAuthSync';
import { apiFetch } from '@/lib/apiClient';

// ─── Nav Links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Overview', href: '/dashboard', icon: '📊' },
  { label: 'Trade Signals', href: '/dashboard/trade-signals', icon: '⚡' },
  { label: 'Trade History', href: '/dashboard/trade-history', icon: '🕐' },
  { label: 'Performance', href: '/dashboard/performance', icon: '📈' },
  { label: 'Risk Metrics', href: '/dashboard/risk-metrics', icon: '🛡️' },
  { label: 'Brokers', href: '/dashboard/brokers', icon: '🔗' },
  { label: 'Account', href: '/dashboard/account', icon: '👤' },
];

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  // Sidebar data
  const [signals, setSignals] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [sidebarStats, setSidebarStats] = useState<{
    openSignals: number; totalPnl: number; strategyStatus: string; subscriptionActive: boolean;
  } | null>(null);

  const userEmail = user?.primaryEmailAddress?.emailAddress || '';

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    // Clerk middleware already protects /dashboard — do NOT redirect here.
    // If the user object is null the middleware will handle it server-side.
    if (!user) return;

    // Check admin status from Clerk public metadata
    if ((user.publicMetadata as any)?.is_admin) setIsAdmin(true);

    async function loadData() {
      try {
        const token = await getToken();
        if (!token) return; // token not ready yet — skip silently
        const [s, t, me] = await Promise.all([
          apiFetch<any[]>('/signals/', {}, token).catch(() => []),
          apiFetch<any[]>('/trades/', {}, token).catch(() => []),
          apiFetch<any>('/users/me', {}, token).catch(() => null),
        ]);
        const sigArr = Array.isArray(s) ? s : [];
        const tradeArr = Array.isArray(t) ? t : [];
        setSignals(sigArr.slice(0, 6));
        setTrades(tradeArr.slice(0, 6));
        const totalPnl = tradeArr
          .filter((tr: any) => tr.status === 'closed')
          .reduce((sum: number, tr: any) => sum + (tr.pnl ?? 0), 0);
        setSidebarStats({
          openSignals: sigArr.filter((sg: any) => !sg.executed).length,
          totalPnl,
          strategyStatus: 'Live',
          subscriptionActive: me?.subscription_active ?? false,
        });
      } catch {
        // API errors are handled by apiClient
      }
    }

    loadData();
  }, [router, user, userLoaded, authLoaded, getToken]);

  const initials = userEmail.substring(0, 2).toUpperCase() || 'AD';
  const LEFT_W = 220;
  const RIGHT_W = 280;

  // ── Shared sidebar card style ──
  const card = {
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(13,21,36,0.7)',
    overflow: 'hidden' as const,
    marginBottom: '10px',
  };
  const cardHeader = {
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '8px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
  };
  const cardBody = { padding: '8px' };
  const label = { fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: '#475569', margin: '0 0 3px 0' };
  const val = (color = '#fff') => ({ fontSize: '0.8rem', fontWeight: 800, color, margin: 0, lineHeight: 1 } as const);
  const itemRow = {
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const,
    borderRadius: '7px', border: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(255,255,255,0.02)', padding: '6px 8px', marginBottom: '5px',
  };
  const badge = (buy: boolean) => ({
    display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
    width: '22px', height: '22px', borderRadius: '5px', fontSize: '0.55rem', fontWeight: 700, flexShrink: 0 as const,
    border: buy ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(248,113,113,0.3)',
    background: buy ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
    color: buy ? '#34d399' : '#f87171',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <ClerkAuthSync />

      {/* ── Ambient orbs ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* ── LEFT SIDEBAR ── */}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30,
        width: `${LEFT_W}px`, display: 'flex', flexDirection: 'column',
        background: 'rgba(9,15,26,0.92)', borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none' }}>
            <img src="/logo.png" alt="AIXTrader" style={{ width: 30, height: 30, borderRadius: 8 }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.02em', color: '#fff' }}>
              AIX<span style={{ background: 'linear-gradient(90deg,#00ff88,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Trader</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', padding: '0 8px', marginBottom: '6px' }}>Main Menu</p>
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '8px 10px', borderRadius: '8px', marginBottom: '1px',
                textDecoration: 'none', fontSize: '0.8rem', fontWeight: active ? 600 : 400,
                transition: 'all 0.15s',
                color: active ? '#00ff88' : '#8fa0c0',
                background: active ? 'rgba(0,255,136,0.08)' : 'transparent',
                border: active ? '1px solid rgba(0,255,136,0.15)' : '1px solid transparent',
              }}>
                <span style={{ fontSize: '0.75rem' }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}

          {isAdmin && (
            <>
              <div style={{ margin: '14px 0 6px', borderTop: '1px solid rgba(255,255,255,0.05)' }} />
              <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155', padding: '0 8px', marginBottom: '6px' }}>System</p>
              <Link href="/admin" style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '8px 10px', borderRadius: '8px',
                textDecoration: 'none', fontSize: '0.8rem', fontWeight: pathname === '/admin' ? 600 : 400,
                color: pathname === '/admin' ? '#f59e0b' : '#8fa0c0',
                background: pathname === '/admin' ? 'rgba(245,158,11,0.08)' : 'transparent',
                border: pathname === '/admin' ? '1px solid rgba(245,158,11,0.15)' : '1px solid transparent',
                transition: 'all 0.15s',
              }}>
                <span style={{ fontSize: '0.75rem' }}>⚙️</span>
                Admin Console
              </Link>
            </>
          )}
        </nav>

        {/* User footer */}
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px', borderRadius: '10px',
            background: 'rgba(13,21,36,0.8)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#00ff88,#0ea5e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.65rem', fontWeight: 700, color: '#000',
            }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 600, color: '#f0f4ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{userEmail || 'Loading...'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88' }} />
                <span style={{ fontSize: '0.6rem', color: '#00ff88', fontWeight: 600 }}>Engine Online</span>
              </div>
            </div>
            <SignOutButton redirectUrl="/">
              <button title="Sign Out" style={{
                padding: '5px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent', cursor: 'pointer', color: '#4a5a7a', display: 'flex', flexShrink: 0,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        marginLeft: `${LEFT_W}px`,
        marginRight: `${RIGHT_W}px`,
        minHeight: '100vh',
        padding: '28px 28px',
        position: 'relative', zIndex: 10,
        overflowX: 'hidden',
      }}>
        {children}
      </main>

      {/* ── RIGHT SIDEBAR ── */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 30,
        width: `${RIGHT_W}px`,
        background: 'rgba(9,15,26,0.92)', borderLeft: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
        padding: '18px 12px',
        overflowY: 'auto',
      }}>

        {/* ── Stats ── */}
        <p style={{ fontSize: '0.55rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#334155', marginBottom: '8px', paddingLeft: '2px' }}>
          Live Overview
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
          <div style={{ background: 'rgba(14,165,233,0.07)', border: '1px solid rgba(14,165,233,0.14)', borderRadius: '9px', padding: '9px 10px' }}>
            <p style={label}>Subscription</p>
            <p style={val()}>{sidebarStats ? (sidebarStats.subscriptionActive ? 'ACTIVE' : 'INACTIVE') : '—'}</p>
          </div>
          <div style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.14)', borderRadius: '9px', padding: '9px 10px' }}>
            <p style={label}>Engine</p>
            <p style={val('#34d399')}>{sidebarStats?.strategyStatus ?? '—'}</p>
          </div>
          <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: '9px', padding: '9px 10px' }}>
            <p style={label}>Open Signals</p>
            <p style={val('#818cf8')}>{sidebarStats?.openSignals ?? '—'}</p>
          </div>
          <div style={{
            background: sidebarStats && sidebarStats.totalPnl < 0 ? 'rgba(248,113,113,0.07)' : 'rgba(52,211,153,0.07)',
            border: `1px solid ${sidebarStats && sidebarStats.totalPnl < 0 ? 'rgba(248,113,113,0.14)' : 'rgba(52,211,153,0.14)'}`,
            borderRadius: '9px', padding: '9px 10px',
          }}>
            <p style={label}>Total P&L</p>
            <p style={val(sidebarStats && sidebarStats.totalPnl < 0 ? '#f87171' : '#34d399')}>
              {sidebarStats ? `${sidebarStats.totalPnl >= 0 ? '+' : ''}$${Math.abs(sidebarStats.totalPnl).toFixed(2)}` : '—'}
            </p>
          </div>
        </div>

        {/* ── Recent Signals ── */}
        <div style={card}>
          <div style={cardHeader}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>Recent Signals</span>
            <Link href="/dashboard/trade-signals" style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#34d399', textDecoration: 'none' }}>View All</Link>
          </div>
          <div style={cardBody}>
            {!sidebarStats ? (
              [1,2,3].map(i => <div key={i} style={{ height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', marginBottom: '5px' }} />)
            ) : signals.length === 0 ? (
              <p style={{ fontSize: '0.6rem', color: '#475569', textAlign: 'center', padding: '12px 0', margin: 0 }}>No active signals</p>
            ) : signals.map(sig => (
              <div key={sig.id} style={itemRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={badge(sig.side === 'buy')}>{sig.side === 'buy' ? 'B' : 'S'}</div>
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>{sig.symbol}</p>
                    <p style={{ fontSize: '0.5rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>{sig.strategy_name}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff', margin: 0 }}>{Math.round(sig.confidence * 100)}%</p>
                  <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', color: sig.executed ? '#22c55e' : '#f59e0b' }}>{sig.executed ? 'Exec' : 'Wait'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live Trades ── */}
        <div style={card}>
          <div style={cardHeader}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>Live Trades</span>
            <Link href="/dashboard/trade-history" style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#22d3ee', textDecoration: 'none' }}>View All</Link>
          </div>
          <div style={cardBody}>
            {!sidebarStats ? (
              [1,2,3].map(i => <div key={i} style={{ height: '32px', borderRadius: '6px', background: 'rgba(255,255,255,0.04)', marginBottom: '5px' }} />)
            ) : trades.length === 0 ? (
              <p style={{ fontSize: '0.6rem', color: '#475569', textAlign: 'center', padding: '12px 0', margin: 0 }}>No active executions</p>
            ) : trades.map(t => (
              <div key={t.id} style={itemRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={badge(t.side === 'buy')}>{t.side === 'buy' ? 'B' : 'S'}</div>
                  <div>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>{t.symbol}</p>
                    <p style={{ fontSize: '0.5rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0 0' }}>{t.broker}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {t.pnl != null ? (
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace', color: t.pnl >= 0 ? '#34d399' : '#f87171', margin: 0 }}>
                      {t.pnl >= 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(2)}
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.6rem', fontWeight: 700, fontFamily: 'monospace', color: '#94a3b8', margin: 0 }}>{t.entry_price?.toFixed(4)}</p>
                  )}
                  <span style={{ fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase', color: t.status === 'open' ? '#38bdf8' : '#475569' }}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </aside>
    </div>
  );
}
