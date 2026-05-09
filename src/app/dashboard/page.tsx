'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import DashboardLayout from '@/components/Layout';
import { apiFetch, ApiError } from '@/lib/apiClient';

type DashboardStats = {
  subscriptionActive: boolean;
  subscriptionMode: string;
  strategyStatus: string;
  openSignals: number;
  openTrades: number;
  totalPnl: number;
};

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

type Trade = {
  id: number;
  symbol: string;
  side: string;
  entry_price: number;
  exit_price: number | null;
  pnl: number | null;
  status: string;
  broker: string;
  created_at: string;
};

type PerformanceStats = {
  total_trades: number;
  win_rate: number;
  total_pnl: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number;
  equity_curve: { date: string; equity: number; pnl: number }[];
  monthly_pnl: Record<string, number>;
};

const AI_WATCHLIST = [
  { symbol: 'BTCUSD', name: 'Bitcoin', status: 'scanning' },
  { symbol: 'ETHUSD', name: 'Ethereum', status: 'scanning' },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', status: 'scanning' },
  { symbol: 'XAUUSD', name: 'Gold', status: 'signal_ready' },
  { symbol: 'GBPUSD', name: 'British Pound', status: 'scanning' }
];

export default function DashboardOverview() {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [perf, setPerf] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChartSymbol, setSelectedChartSymbol] = useState('BINANCE:BTCUSD');
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const load = useCallback(async () => {
    if (!isLoaded) return;
    try {
      const token = await getToken();
      if (!token) { router.push('/sign-in'); return; }
      const [s, sig, tr, pf] = await Promise.all([
        apiFetch<DashboardStats>('/users/me/dashboard', {}, token).catch(() => null),
        apiFetch<Signal[]>('/signals/', {}, token).catch(() => []),
        apiFetch<Trade[]>('/trades/', {}, token).catch(() => []),
        apiFetch<PerformanceStats>('/stats/performance', {}, token).catch(() => null),
      ]);
      setStats(s);
      setSignals(Array.isArray(sig) ? sig.slice(0, 5) : []);
      setTrades(Array.isArray(tr) ? tr.slice(0, 5) : []);
      setPerf(pf);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 401) return;
    } finally {
      setLoading(false);
    }
  }, [router, isLoaded, getToken]);

  useEffect(() => { if (isLoaded) load(); }, [load, isLoaded]);

  const runAction = async (type: 'generate' | 'execute') => {
    setActionMsg(''); setActionErr(''); setActionLoading(type);
    try {
      if (type === 'generate') {
        const r = await apiFetch<any>('/signals/generate', { method: 'POST' });
        setActionMsg(`✅ Generated ${r?.signal_count || 0} AI signals.`);
      } else {
        const r = await apiFetch<any>('/trades/execute', { method: 'POST' });
        setActionMsg(r?.message || `✅ Executed ${r?.executed || 0} trades.`);
      }
      await load();
    } catch (e: any) {
      setActionErr(e.message || 'Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const isPositive = stats && stats.totalPnl >= 0;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
                {stats?.strategyStatus === 'Live' ? 'Engine Live' : 'Engine Standing By'}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">Trading Cockpit</h1>
            <p className="text-slate-400 text-sm">Monitor live market metrics, view AI probability signals, and govern execution.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => runAction('generate')}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-xl bg-white/5 py-2.5 px-5 text-sm font-semibold text-white ring-1 ring-white/10 transition-all hover:bg-white/10 hover:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'generate' ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></span>
              ) : '⚡'}
              Ping AI
            </button>
            <button
              onClick={() => runAction('execute')}
              disabled={!!actionLoading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-2.5 px-5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading === 'execute' ? (
                <span className="h-4 w-4 rounded-full border-2 border-slate-900/20 border-t-slate-900 animate-spin"></span>
              ) : '🚀'}
              Manual Execute
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {actionMsg && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 flex items-center gap-3 backdrop-blur-md">
            {actionMsg}
          </div>
        )}
        {actionErr && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-400 flex items-center gap-3 backdrop-blur-md">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {actionErr}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl border border-white/5 bg-slate-900/30 animate-pulse" />
            ))
          ) : (
            <>
              {/* Stat 1 */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:border-white/10">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl transition-all group-hover:bg-cyan-500/20"></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Subscription</h3>
                <p className="text-2xl font-bold tracking-tight text-white mb-1">
                  {stats?.subscriptionActive ? stats.subscriptionMode?.toUpperCase() : 'INACTIVE'}
                </p>
                <p className="text-xs text-slate-500 font-medium">Plan Status</p>
              </div>
              
              {/* Stat 2 */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:border-white/10">
                <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full blur-2xl transition-all ${stats?.strategyStatus === 'Live' ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-slate-500/10'}`}></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Engine Status</h3>
                <p className={`text-2xl font-bold tracking-tight mb-1 ${stats?.strategyStatus === 'Live' ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {stats?.strategyStatus ?? '—'}
                </p>
                <p className="text-xs text-slate-500 font-medium">Live Signal Scoring</p>
              </div>

              {/* Stat 3 */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:border-white/10">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20"></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Open Signals</h3>
                <p className="text-2xl font-bold tracking-tight text-blue-400 mb-1">
                  {stats?.openSignals ?? 0}
                </p>
                <p className="text-xs text-slate-500 font-medium">Pending Execution</p>
              </div>

              {/* Stat 4 */}
              <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl transition-all hover:bg-slate-900/60 hover:border-white/10">
                <div className={`absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full blur-2xl transition-all ${isPositive ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-rose-500/10 group-hover:bg-rose-500/20'}`}></div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Total P&L</h3>
                <p className={`text-2xl font-bold tracking-tight mb-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? '+' : ''}${(stats?.totalPnl ?? 0).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 font-medium">All Closed Trades</p>
              </div>
            </>
          )}
        </div>

        {/* Main Charts & Radar */}
        <div className="space-y-6 pb-10">
          
          {/* Market Chart */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-xl" style={{ height: 600 }}>
            <div className="flex flex-wrap items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
              <h3 className="font-semibold text-white">Live Market Analysis</h3>
              <div className="flex gap-2">
                {['BINANCE:BTCUSD', 'OANDA:EURUSD', 'OANDA:XAUUSD'].map((sym) => (
                  <button 
                    key={sym}
                    onClick={() => setSelectedChartSymbol(sym)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedChartSymbol === sym 
                        ? 'bg-white/10 text-white ring-1 ring-white/20 shadow-sm' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    {sym.split(':')[1]}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 relative bg-slate-950">
                <iframe
                  title="TradingView Realtime Chart"
                  src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_123&symbol=${selectedChartSymbol}&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=0f172a&studies=%5B%5D&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides=%7B%7D&overrides=%7B%7D&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=en`}
                  className="absolute inset-0 w-full h-full border-0"
                  allowFullScreen
                />
            </div>
          </div>

          {/* Performance Analytics */}
          {perf && perf.total_trades > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-xl">
              <div className="border-b border-white/5 bg-gradient-to-b from-indigo-500/5 to-transparent px-6 py-4">
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  📊 Live Performance Analytics
                  <span className="ml-2 text-xs text-slate-500 font-normal">{perf.total_trades} closed trades</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0 divide-x divide-white/5">
                {[
                  { label: 'Win Rate',       value: `${perf.win_rate.toFixed(1)}%`,                   color: perf.win_rate >= 50 ? 'text-emerald-400' : 'text-rose-400' },
                  { label: 'Total P&L',      value: `${perf.total_pnl >= 0 ? '+' : ''}$${perf.total_pnl.toFixed(2)}`, color: perf.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400' },
                  { label: 'Sharpe Ratio',   value: perf.sharpe_ratio != null ? perf.sharpe_ratio.toFixed(2) : '—', color: (perf.sharpe_ratio ?? 0) >= 1 ? 'text-emerald-400' : 'text-slate-300' },
                  { label: 'Max Drawdown',   value: `${perf.max_drawdown.toFixed(1)}%`,               color: perf.max_drawdown > 10 ? 'text-rose-400' : 'text-amber-400' },
                  { label: 'Profit Factor',  value: perf.profit_factor != null ? perf.profit_factor.toFixed(2) : '—', color: (perf.profit_factor ?? 0) >= 1 ? 'text-emerald-400' : 'text-rose-400' },
                  { label: 'Avg Win',        value: `$${perf.avg_win.toFixed(2)}`,                    color: 'text-emerald-400' },
                ].map((metric) => (
                  <div key={metric.label} className="flex flex-col items-center justify-center gap-1 p-5">
                    <span className={`text-2xl font-bold tracking-tight ${metric.color}`}>{metric.value}</span>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{metric.label}</span>
                  </div>
                ))}
              </div>
              {perf.equity_curve.length > 1 && (
                <div className="border-t border-white/5 px-6 py-4">
                  <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Equity Curve</div>
                  <div className="flex items-end gap-0.5 h-16">
                    {perf.equity_curve.slice(-60).map((pt, i, arr) => {
                      const min = Math.min(...arr.map(p => p.equity));
                      const max = Math.max(...arr.map(p => p.equity));
                      const range = max - min || 1;
                      const heightPct = ((pt.equity - min) / range) * 100;
                      return (
                        <div
                          key={i}
                          title={`$${pt.equity.toFixed(2)}`}
                          className={`flex-1 rounded-sm transition-all ${pt.pnl >= 0 ? 'bg-emerald-500/60' : 'bg-rose-500/60'}`}
                          style={{ height: `${Math.max(4, heightPct)}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Radar */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/5 bg-gradient-to-b from-emerald-500/5 to-transparent px-6 py-4">
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                AI Asset Radar
              </h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 p-5">
              {AI_WATCHLIST.map(asset => (
                <div key={asset.symbol} className="flex flex-col gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-white tracking-tight">{asset.symbol}</div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      asset.status === 'scanning' 
                        ? 'border-sky-500/20 bg-sky-500/10 text-sky-400' 
                        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                    }`}>
                      {asset.status === 'scanning' ? 'Scan' : 'Ready'}
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-500">{asset.name}</div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
