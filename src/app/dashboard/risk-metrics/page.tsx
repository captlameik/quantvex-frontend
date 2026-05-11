'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import DashboardLayout from '@/components/Layout';
import { apiFetch } from '@/lib/apiClient';

type Trade = { id: number; pnl: number | null; status: string; };

type Risk = {
  maxDrawdown: number;
  sharpe: number;
  winLossRatio: number;
  profitFactor: number;
  var95: number;
  avgRR: number;
};

function computeRisk(pnls: number[]): Risk {
  if (!pnls.length) return { maxDrawdown:0, sharpe:0, winLossRatio:0, profitFactor:0, var95:0, avgRR:0 };
  const wins = pnls.filter(p=>p>0);
  const losses = pnls.filter(p=>p<0);
  // Max drawdown
  let peak = 0, equity = 0, maxDD = 0;
  pnls.forEach(p => { equity += p; if (equity > peak) peak = equity; const dd = peak - equity; if (dd > maxDD) maxDD = dd; });
  // Sharpe (simple)
  const mean = pnls.reduce((a,b)=>a+b,0)/pnls.length;
  const std = Math.sqrt(pnls.reduce((a,b)=>a+(b-mean)**2,0)/pnls.length) || 1;
  const sharpe = (mean / std) * Math.sqrt(252);
  // Win/Loss ratio
  const avgWin = wins.length ? wins.reduce((a,b)=>a+b,0)/wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((a,b)=>a+b,0)/losses.length) : 0;
  const wlr = avgLoss ? avgWin/avgLoss : 0;
  // Profit factor
  const grossWin = wins.reduce((a,b)=>a+b,0);
  const grossLoss = Math.abs(losses.reduce((a,b)=>a+b,0));
  const pf = grossLoss ? grossWin/grossLoss : 0;
  // VaR 95%
  const sorted = [...pnls].sort((a,b)=>a-b);
  const var95 = sorted[Math.floor(sorted.length * 0.05)] || 0;
  return { maxDrawdown: maxDD, sharpe, winLossRatio: wlr, profitFactor: pf, var95, avgRR: wlr };
}

const GaugeCard = ({ label, value, display, color, subtext, max = 100 }: { label:string; value:number; display:string; color:string; subtext:string; max?:number }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', padding:'24px' }}>
      <p style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:'14px' }}>{label}</p>
      <p style={{ fontSize:'2rem', fontWeight:800, color, letterSpacing:'-0.03em', marginBottom:'12px' }}>{display}</p>
      <div style={{ height:'6px', background:'var(--border-subtle)', borderRadius:'100px', marginBottom:'8px' }}>
        <div style={{ height:'100%', borderRadius:'100px', width:`${pct}%`, background:`linear-gradient(90deg, ${color}, ${color}88)`, transition:'width 0.9s ease', boxShadow:`0 0 8px ${color}44` }} />
      </div>
      <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{subtext}</p>
    </div>
  );
};

export default function RiskMetricsPage() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const [risk, setRisk] = useState<Risk | null>(null);
  const [tradeCount, setTradeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      const token = await getToken();
      if (!token) { router.push('/sign-in'); return; }
      apiFetch<Trade[]>('/trades/', {}, token).then(data => {
        const closed = (data || []).filter(t => t.pnl != null);
        setTradeCount(closed.length);
        setRisk(computeRisk(closed.map(t => t.pnl as number)));
        setLoading(false);
      }).catch(() => setLoading(false));
    })();
  }, [router, isLoaded, getToken]);

  return (
    <DashboardLayout>
      <div style={{ maxWidth:'1100px' }}>
        <div style={{ marginBottom:'32px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'4px 14px', borderRadius:'100px', marginBottom:'12px', background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.2)' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#a855f7' }} />
            <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#a855f7' }}>Risk Engine</span>
          </div>
          <h1 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:'6px' }}>Risk Metrics</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>Statistical risk analysis computed from your closed trades. Metrics update in real-time.</p>
        </div>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
            {[0,1,2,3,4,5].map(i => <div key={i} style={{ height:'140px', borderRadius:'16px', background:'var(--bg-card)', animation:'pulse 1.5s infinite' }} />)}
          </div>
        ) : !risk || tradeCount === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', color:'var(--text-muted)', background:'var(--bg-card)', borderRadius:'16px', border:'1px solid var(--border-subtle)' }}>
            <div style={{ fontSize:'3rem', marginBottom:'12px' }}>🛡️</div>
            <p style={{ fontWeight:600, color:'var(--text-secondary)', marginBottom:'6px' }}>Insufficient data</p>
            <p style={{ fontSize:'0.875rem' }}>At least 1 closed trade is needed to compute risk metrics.</p>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px', marginBottom:'24px' }}>
              <GaugeCard label="Max Drawdown" value={risk.maxDrawdown} display={`-$${risk.maxDrawdown.toFixed(2)}`} color="#ff5e7a" subtext="Largest peak-to-trough decline" max={Math.max(risk.maxDrawdown, 1000)} />
              <GaugeCard label="Sharpe Ratio" value={risk.sharpe * 20} display={risk.sharpe.toFixed(2)} color={risk.sharpe > 1 ? '#00ff88' : risk.sharpe > 0 ? '#f59e0b' : '#ff5e7a'} subtext={risk.sharpe > 1 ? 'Excellent risk-adjusted return' : risk.sharpe > 0 ? 'Adequate' : 'Poor risk-adjusted return'} max={100} />
              <GaugeCard label="Win/Loss Ratio" value={risk.winLossRatio * 33} display={risk.winLossRatio.toFixed(2)} color="#0ea5e9" subtext="Avg win ÷ Avg loss" max={100} />
              <GaugeCard label="Profit Factor" value={Math.min(100, risk.profitFactor * 25)} display={risk.profitFactor.toFixed(2)} color={risk.profitFactor > 1.5 ? '#00ff88' : risk.profitFactor > 1 ? '#f59e0b' : '#ff5e7a'} subtext={risk.profitFactor > 1.5 ? 'Strong edge' : risk.profitFactor > 1 ? 'Marginal edge' : 'No edge'} max={100} />
              <GaugeCard label="VaR (95%)" value={Math.abs(risk.var95)} display={`$${risk.var95.toFixed(2)}`} color="#f59e0b" subtext="5th percentile of trade outcomes" max={Math.max(Math.abs(risk.var95), 100)} />
              <GaugeCard label="Closed Trades" value={100} display={String(tradeCount)} color="#a855f7" subtext="Total trades analyzed" max={100} />
            </div>

            {/* Risk legend */}
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', padding:'24px' }}>
              <h3 style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:'16px' }}>Risk Interpretation Guide</h3>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                {[
                  { metric:'Sharpe Ratio', good:'> 1.0', note:'Higher = better risk-adjusted returns' },
                  { metric:'Profit Factor', good:'> 1.5', note:'Gross profit ÷ gross loss' },
                  { metric:'Win/Loss Ratio', good:'> 1.5', note:'Avg winner size ÷ avg loser size' },
                ].map(({ metric, good, note }) => (
                  <div key={metric} style={{ padding:'14px', background:'var(--bg-base)', borderRadius:'10px', border:'1px solid var(--border-subtle)' }}>
                    <p style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'4px' }}>{metric}</p>
                    <p style={{ fontSize:'0.75rem', color:'#00ff88', fontWeight:600, marginBottom:'4px' }}>Target: {good}</p>
                    <p style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
