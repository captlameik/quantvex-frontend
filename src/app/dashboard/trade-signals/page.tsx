'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import DashboardLayout from '@/components/Layout';
import { apiFetch, ApiError } from '@/lib/apiClient';

type Signal = {
  id: number;
  symbol: string;
  side: string;
  confidence: number;
  price: number;
  stop_loss: number | null;
  take_profit: number | null;
  strategy_name: string;
  executed: boolean;
  created_at: string;
};

// Reusable TradingView Technical Analysis Widget
const TAWidget = ({ symbol }: { symbol: string }) => {
  const config = {
    interval: "15m",
    width: "100%",
    isTransparent: true,
    height: "100%",
    symbol: symbol,
    showIntervalTabs: true,
    displayMode: "single",
    colorTheme: "dark"
  };
  const src = `https://s.tradingview.com/embed-widget/technical-analysis/?locale=en#${encodeURIComponent(JSON.stringify(config))}`;
  
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 shadow-xl backdrop-blur-xl" style={{ height: '420px' }}>
      <iframe 
        scrolling="no" 
        allowTransparency 
        frameBorder="0" 
        src={src} 
        style={{ width: '100%', height: '100%', border: 'none' }}
      ></iframe>
    </div>
  );
};

export default function TradeSignalsPage() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!isLoaded) return;
    try {
      const token = await getToken();
      if (!token) return; // Clerk middleware protects this route
      const data = await apiFetch<Signal[]>('/signals/?limit=50', {}, token).catch(e => {
        if (e instanceof ApiError && e.status === 402) {
           router.push('/pricing');
           return [];
        }
        throw e;
      });
      setSignals(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErr('Connection to the God System failed. Signals cannot be loaded right now.');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, getToken]);

  useEffect(() => { if (isLoaded) load(); }, [load, isLoaded]);

  const generate = async () => {
    setGenerating(true); setMsg(''); setErr('');
    try {
      const token = await getToken();
      const r = await apiFetch<any>('/signals/generate', { method: 'POST' }, token);
      setMsg(`AI Intelligence routing complete: ${r?.signal_count || 0} signals generated.`);
      await load();
    } catch (e: any) {
      if (e.status === 0 || e.message?.includes('Network error')) {
        setErr('Cannot reach the API backend. Please ensure all services are running (docker compose up).');
      } else if (e.status === 404) {
        setErr('API backend is unreachable (HTTP 404). Please start the backend services and try again.');
      } else if (e.status === 402) {
        setErr('Active subscription required to generate signals. Please upgrade your plan.');
      } else {
        setErr(`Engine error: ${e.message}`);
      }
    } finally {
      setGenerating(false);
    }
  };

  const formatPrice = (p: number | null) => p !== null ? p.toFixed(5) : '—';
  const formatTime = (ts: string) => {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return '—'; }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
              <span className="text-xs font-bold tracking-widest text-sky-400 uppercase">Live Intelligence Hub</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Trade Signals</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Cross-reference GOD System v6 active predictions with live market technical analyzations. 
              Gauges compute dozens of oscillators and moving averages in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-slate-900/60 px-4 py-2 border border-white/5 backdrop-blur-md">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cached</span>
               <span className="text-lg font-black text-white">{signals.length}</span>
            </div>
            <button
              onClick={generate}
              disabled={generating}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 px-6 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <span className="h-4 w-4 rounded-full border-2 border-slate-900/20 border-t-slate-900 animate-spin"></span>
              ) : '⚡'}
              {generating ? 'Calculating Routes...' : 'Generate Intelligence'}
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {msg && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 flex items-center gap-3 backdrop-blur-md">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {msg}
          </div>
        )}
        {err && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-400 flex items-center gap-3 backdrop-blur-md">
             <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {err}
          </div>
        )}

        {/* Global Market Analysis Meters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <TAWidget symbol="BINANCE:BTCUSD" />
          <TAWidget symbol="OANDA:EURUSD" />
          <TAWidget symbol="OANDA:XAUUSD" />
        </div>

        {/* AI Signal Feed Table */}
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 shadow-2xl xl:col-span-2 backdrop-blur-xl relative">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl"></div>
          
          <div className="flex flex-wrap items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-5 relative z-10">
             <h3 className="font-bold text-white flex items-center gap-3">
               <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                 📡
               </span>
               Live Application Signal Feed
             </h3>
             <span className="text-xs font-semibold text-slate-400 bg-slate-950/50 px-3 py-1 rounded-full border border-white/5">
                Last 50 Computations
             </span>
          </div>

          <div className="p-0 relative z-10 overflow-x-auto">
            {loading ? (
               <div className="flex flex-col gap-2 p-6">
                 {[...Array(6)].map((_, i) => <div key={i} className="h-12 w-full rounded-xl bg-slate-800/50 animate-pulse border border-white/5"></div>)}
               </div>
            ) : signals.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/50 text-3xl mb-4 border border-white/5">
                    ⚙️
                  </div>
                  <p className="text-base font-semibold text-white mb-1">Engine is Idle</p>
                  <p className="text-sm text-slate-400">Press "Generate Intelligence" to compute market inefficiencies.</p>
               </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300 min-w-[900px]">
                <thead className="bg-slate-950/40 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Symbol</th>
                    <th className="px-6 py-4">Direction</th>
                    <th className="px-6 py-4">Probability</th>
                    <th className="px-6 py-4">Entry Vector</th>
                    <th className="px-6 py-4">Stop Loss</th>
                    <th className="px-6 py-4">Take Profit</th>
                    <th className="px-6 py-4">Model Logic</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {signals.map(sig => (
                    <tr key={sig.id} className="group transition-colors hover:bg-white/[0.03]">
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white tracking-tight">{sig.symbol}</span>
                          <span className="text-[10px] font-mono text-slate-500">{formatTime(sig.created_at)}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 font-semibold">
                         <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs uppercase tracking-widest ${
                           sig.side === 'buy' 
                             ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                             : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                         }`}>
                           {sig.side}
                         </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                sig.confidence >= 0.7 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : 
                                sig.confidence >= 0.5 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 
                                'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                              }`} 
                              style={{ width: `${sig.confidence * 100}%` }} 
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-300">
                            {Math.round(sig.confidence * 100)}%
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono font-medium text-slate-300">
                        {formatPrice(sig.price)}
                      </td>

                      <td className="px-6 py-4 font-mono font-medium text-rose-400">
                        {sig.stop_loss !== null ? formatPrice(sig.stop_loss) : '--'}
                      </td>

                      <td className="px-6 py-4 font-mono font-medium text-emerald-400">
                        {sig.take_profit !== null ? formatPrice(sig.take_profit) : '--'}
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          {sig.strategy_name}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {sig.executed ? (
                           <span className="flex w-fit items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                             <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                             Executed
                           </span>
                        ) : (
                           <span className="flex w-fit items-center gap-1.5 rounded-md bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                             <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                             Pending
                           </span>
                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
