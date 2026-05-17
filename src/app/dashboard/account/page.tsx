'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useAuth } from '@clerk/nextjs';
import DashboardLayout from '@/components/Layout';
import { apiFetch } from '@/lib/apiClient';

export default function AccountPage() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const [active, setActive] = useState<boolean | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress || '';

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;
    if (!user) return; // Clerk middleware protects this route
    (async () => {
      const token = await getToken();
      apiFetch<{ active: boolean }>('/subscriptions/me', {}, token)
        .then(r => setActive(r.active))
        .catch(() => setActive(false));
    })();
  }, [authLoaded, userLoaded, user, router, getToken]);

  async function startSubscription() {
    setLoading(true); setError('');
    try {
      const token = await getToken();
      const res = await apiFetch<{ checkout_url: string }>('/subscriptions/checkout-url', {}, token);
      window.location.href = res.checkout_url;
    } catch (e: any) { setError(e.message); setLoading(false); }
  }

  const initials = email ? email.substring(0, 2).toUpperCase() : '??';

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'4px 14px', borderRadius:'100px', marginBottom:'12px', background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#00ff88' }} />
            <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#00ff88' }}>Account Manager</span>
          </div>
          <h1 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:'6px' }}>Account & Subscription</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>Manage your profile and billing subscription.</p>
        </div>

        {error && (
          <div style={{ padding:'14px 18px', borderRadius:'12px', background:'rgba(255,94,122,0.08)', border:'1px solid rgba(255,94,122,0.2)', color:'#ff5e7a', fontSize:'0.875rem', marginBottom:'24px' }}>
            ⚠ {error}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px' }}>
          {/* Profile Card */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', padding:'28px' }}>
            <h2 style={{ fontSize:'0.875rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'20px' }}>Profile</h2>
            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'24px' }}>
              <div style={{
                width:'60px', height:'60px', borderRadius:'50%',
                background:'linear-gradient(135deg, #00ff88, #0ea5e9)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'1.2rem', fontWeight:800, color:'#000', flexShrink:0,
              }}>{initials}</div>
              <div>
                <p style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)', marginBottom:'3px' }}>{email || 'Loading...'}</p>
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Registered Trader</p>
              </div>
            </div>
            <div style={{ padding:'14px 16px', borderRadius:'10px', background:'var(--bg-base)', border:'1px solid var(--border-subtle)' }}>
              <p style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'4px' }}>Email Address</p>
              <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', fontWeight:500 }}>{email}</p>
            </div>
          </div>

          {/* Subscription Card */}
          <div style={{ background:'var(--bg-card)', border:`1px solid ${active ? 'rgba(0,255,136,0.25)' : 'var(--border-subtle)'}`, borderRadius:'16px', padding:'28px', position:'relative', overflow:'hidden' }}>
            {active && (
              <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(0,255,136,0.06)', filter:'blur(20px)' }} />
            )}
            <h2 style={{ fontSize:'0.875rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'20px' }}>Subscription</h2>

            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'12px', background: active ? 'rgba(0,255,136,0.1)' : 'rgba(74,90,122,0.2)', border:`1px solid ${active ? 'rgba(0,255,136,0.25)' : 'var(--border-subtle)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>
                {active ? '✅' : '🔒'}
              </div>
              <div>
                <p style={{ fontSize:'1.2rem', fontWeight:800, color: active ? '#00ff88' : 'var(--text-muted)', marginBottom:'2px' }}>
                  {active === null ? 'Checking...' : active ? 'Active' : 'Inactive'}
                </p>
                <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>
                  {active ? 'Full platform access enabled' : 'Upgrade to unlock all features'}
                </p>
              </div>
            </div>

            {active === false && (
              <button
                onClick={startSubscription}
                disabled={loading}
                style={{
                  width:'100%', padding:'13px', borderRadius:'10px', border:'none', cursor:'pointer',
                  background:'linear-gradient(135deg, #00d970, #00b860)',
                  color:'#000', fontWeight:700, fontSize:'0.875rem', transition:'all 0.2s',
                  opacity: loading ? 0.6 : 1, boxShadow:'0 4px 20px rgba(0,217,112,0.25)',
                }}
              >
                {loading ? 'Redirecting...' : '🚀 Unlock Full Access'}
              </button>
            )}

            {active && (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', borderRadius:'10px', background:'var(--bg-base)', border:'1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>AI Signal Access</span>
                  <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#00ff88' }}>✓ Enabled</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', borderRadius:'10px', background:'var(--bg-base)', border:'1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Auto-Execution</span>
                  <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#00ff88' }}>✓ Enabled</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', borderRadius:'10px', background:'var(--bg-base)', border:'1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Priority Support</span>
                  <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#00ff88' }}>✓ Enabled</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div style={{ marginTop:'20px', background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', padding:'24px' }}>
          <h3 style={{ fontWeight:700, fontSize:'0.875rem', marginBottom:'16px', color:'var(--text-secondary)' }}>Quick Actions</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
            {[
              { label:'Connect Broker', href:'/dashboard/brokers', color:'#0ea5e9', icon:'🔌' },
              { label:'View Signals', href:'/dashboard/trade-signals', color:'#00ff88', icon:'⚡' },
              { label:'Trade History', href:'/dashboard/trade-history', color:'#a855f7', icon:'📋' },
            ].map(({ label, href, color, icon }) => (
              <Link key={href} href={href} style={{
                display:'flex', alignItems:'center', gap:'10px', padding:'14px 16px', borderRadius:'10px',
                background:'var(--bg-base)', border:'1px solid var(--border-subtle)', textDecoration:'none',
                fontSize:'0.875rem', fontWeight:600, color:'var(--text-secondary)', transition:'all 0.15s',
              }}>
                <span>{icon}</span>
                <span>{label}</span>
                <svg style={{ marginLeft:'auto', color:'var(--text-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
