'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import DashboardLayout from '@/components/Layout';
import { apiFetch } from '@/lib/apiClient';

type Trade = {
  id: number;
  symbol: string;
  side: string;
  pnl: number | null;
  status: string;
  created_at: string;
};

type Metrics = {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  winners: number;
  losers: number;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
};

const Ring = ({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) => {
  const r = (size / 2) - 8;
  const circ = 2 * Math.PI * r;
  const fill = circ * (pct / 100);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
};

const MiniBar = ({ pnl, max }: { pnl: number; max: number }) => {
  const pct = max === 0 ? 0 : Math.min(100, (Math.abs(pnl) / max) * 100);
  return (
    <div style={{ height: '4px', background: 'var(--border-subtle)', borderRadius: '100px', width: '100%' }}>
      <div style={{ height: '100%', borderRadius: '100px', width: `${pct}%`, background: pnl >= 0 ? '#00ff88' : '#ff5e7a', transition: 'width 0.8s ease' }} />
    </div>
  );
};

export default function PerformancePage() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      const token = await getToken();
      if (!token) return; // Clerk middleware protects this route
      apiFetch<Trade[]>('/trades/', {}, token).then(data => {
        const closed = (data || []).filter(t => t.pnl != null);
        const pnls = closed.map(t => t.pnl as number);
        const winners = pnls.filter(p => p > 0);
        const losers = pnls.filter(p => p <= 0);
        setTrades(closed);
        setMetrics({
          totalPnl: pnls.reduce((a, b) => a + b, 0),
          winRate: closed.length ? (winners.length / closed.length) * 100 : 0,
          totalTrades: closed.length,
          winners: winners.length,
          losers: losers.length,
          bestTrade: winners.length ? Math.max(...winners) : 0,
          worstTrade: losers.length ? Math.min(...losers) : 0,
          avgWin: winners.length ? winners.reduce((a,b)=>a+b,0)/winners.length : 0,
          avgLoss: losers.length ? losers.reduce((a,b)=>a+b,0)/losers.length : 0,
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    })();
  }, [isLoaded, getToken]);

  const maxAbs = metrics ? Math.max(Math.abs(metrics.bestTrade), Math.abs(metrics.worstTrade)) : 1;

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1100px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'4px 14px', borderRadius:'100px', marginBottom:'12px', background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#0ea5e9' }} />
            <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#0ea5e9' }}>Analytics Engine</span>
          </div>
          <h1 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:'6px' }}>Performance</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>Closed-trade performance breakdown. All metrics computed in real-time.</p>
        </div>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px' }}>
            {[0,1,2,3].map(i => <div key={i} style={{ height:'130px', borderRadius:'16px', background:'var(--bg-card)', animation:'pulse 1.5s infinite' }} />)}
          </div>
        ) : !metrics || metrics.totalTrades === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)', background:'var(--bg-card)', borderRadius:'16px', border:'1px solid var(--border-subtle)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'12px' }}>📊</div>
            <p style={{ fontWeight:600, color:'var(--text-secondary)', marginBottom:'6px' }}>No closed trades yet</p>
            <p style={{ fontSize:'0.875rem' }}>Execute trades and close them to see your performance analytics here.</p>
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'24px' }}>
              {[
                { label:'Total P&L', value: `${metrics.totalPnl >= 0?'+':''}$${metrics.totalPnl.toFixed(2)}`, color: metrics.totalPnl >= 0 ? '#00ff88' : '#ff5e7a' },
                { label:'Win Rate', value:`${metrics.winRate.toFixed(1)}%`, color:'#0ea5e9' },
                { label:'Total Trades', value:`${metrics.totalTrades}`, color:'#a855f7' },
                { label:'Avg Win', value:`+$${metrics.avgWin.toFixed(2)}`, color:'#00ff88' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', padding:'22px 20px' }}>
                  <p style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'10px' }}>{label}</p>
                  <p style={{ fontSize:'1.7rem', fontWeight:800, color, letterSpacing:'-0.02em' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Win Rate Ring + Breakdown */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'24px' }}>
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', padding:'28px', display:'flex', alignItems:'center', gap:'28px' }}>
                <div style={{ position:'relative', flexShrink:0 }}>
                  <Ring pct={metrics.winRate} color="#00ff88" size={100} />
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                    <span style={{ fontSize:'1.2rem', fontWeight:800, color:'#00ff88' }}>{metrics.winRate.toFixed(0)}%</span>
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <h3 style={{ fontWeight:700, marginBottom:'16px', fontSize:'0.95rem' }}>Win / Loss Split</h3>
                  {[
                    { label:'Winners', val: metrics.winners, color:'#00ff88' },
                    { label:'Losers', val: metrics.losers, color:'#ff5e7a' },
                  ].map(r => (
                    <div key={r.label} style={{ marginBottom:'12px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                        <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{r.label}</span>
                        <span style={{ fontSize:'0.8rem', fontWeight:700, color:r.color }}>{r.val} trades</span>
                      </div>
                      <div style={{ height:'4px', background:'var(--border-subtle)', borderRadius:'100px' }}>
                        <div style={{ height:'100%', borderRadius:'100px', background:r.color, width:`${(r.val/metrics.totalTrades)*100}%`, transition:'width 0.8s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best / Worst */}
              <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', padding:'28px' }}>
                <h3 style={{ fontWeight:700, marginBottom:'20px', fontSize:'0.95rem' }}>Best & Worst Trades</h3>
                {[
                  { label:'Best Trade', value: metrics.bestTrade, color:'#00ff88' },
                  { label:'Worst Trade', value: metrics.worstTrade, color:'#ff5e7a' },
                  { label:'Avg Win', value: metrics.avgWin, color:'#0ea5e9' },
                  { label:'Avg Loss', value: metrics.avgLoss, color:'#f59e0b' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ marginBottom:'14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'5px' }}>
                      <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontSize:'0.8rem', fontWeight:700, color, fontFamily:'JetBrains Mono, monospace' }}>
                        {value >= 0?'+':''}${Math.abs(value).toFixed(2)}
                      </span>
                    </div>
                    <MiniBar pnl={value} max={maxAbs} />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent closed trades mini table */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', overflow:'hidden' }}>
              <div style={{ padding:'18px 24px', borderBottom:'1px solid var(--border-subtle)' }}>
                <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>Closed Trade Log</h3>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--border-subtle)' }}>
                      {['Symbol','Side','P&L','Date'].map(h => (
                        <th key={h} style={{ padding:'10px 20px', textAlign:'left', fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {trades.slice(0,10).map((t, i) => (
                      <tr key={t.id} style={{ borderBottom: i < Math.min(9, trades.length-1) ? '1px solid var(--border-subtle)' : 'none' }}>
                        <td style={{ padding:'12px 20px', fontWeight:600, color:'var(--text-primary)', fontSize:'0.875rem' }}>{t.symbol}</td>
                        <td style={{ padding:'12px 20px' }}>
                          <span style={{ padding:'2px 8px', borderRadius:'6px', fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', background: t.side==='buy'?'rgba(0,255,136,0.1)':'rgba(255,94,122,0.1)', color: t.side==='buy'?'#00ff88':'#ff5e7a', border:`1px solid ${t.side==='buy'?'rgba(0,255,136,0.2)':'rgba(255,94,122,0.2)'}` }}>{t.side}</span>
                        </td>
                        <td style={{ padding:'12px 20px', fontFamily:'JetBrains Mono, monospace', fontSize:'0.875rem', fontWeight:700, color:(t.pnl??0)>=0?'#00ff88':'#ff5e7a' }}>
                          {(t.pnl??0)>=0?'+':''}${Math.abs(t.pnl??0).toFixed(2)}
                        </td>
                        <td style={{ padding:'12px 20px', fontSize:'0.8rem', color:'var(--text-muted)' }}>
                          {new Date(t.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
