'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import DashboardLayout from '@/components/Layout';
import { apiFetch } from '@/lib/apiClient';

type Trade = {
  id: number;
  symbol: string;
  side: string;
  quantity: number;
  entry_price: number;
  exit_price?: number | null;
  pnl?: number | null;
  status: string;
  error_message?: string | null;
  created_at: string;
};

export default function TradeHistoryPage() {
  const { getToken, isLoaded } = useAuth();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    (async () => {
      const token = await getToken();
      apiFetch<Trade[]>('/trades/', {}, token)
        .then(data => {
          setTrades(data || []);
          setIsLoading(false);
        })
        .catch(e => {
          setError(e.message);
          setIsLoading(false);
        });
    })();
  }, [isLoaded, getToken]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
            Trade History
          </h1>
          <p className="text-sm text-slate-400">
            A comprehensive record of all executed signals and AI-driven market maneuvers.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400 shadow-lg shadow-rose-500/10 backdrop-blur-md">
            <span className="font-semibold">Sync Status:</span> {error}
          </div>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-cyan-500/5 to-purple-500/5 pointer-events-none" />
          
          <div className="relative w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm text-slate-300">
              <thead className="border-b border-white/5 bg-slate-800/40 text-xs font-semibold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-5">Opened</th>
                  <th className="px-6 py-5">Symbol</th>
                  <th className="px-6 py-5">Side</th>
                  <th className="px-6 py-5">Size</th>
                  <th className="px-6 py-5">Entry</th>
                  <th className="px-6 py-5">Exit</th>
                  <th className="px-6 py-5 text-right">PnL</th>
                  <th className="px-6 py-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-slate-800/10">
                      <td className="px-6 py-5"><div className="h-4 w-24 rounded bg-slate-700/40"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-16 rounded bg-slate-700/40"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-12 rounded bg-slate-700/40"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-12 rounded bg-slate-700/40"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-16 rounded bg-slate-700/40"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-16 rounded bg-slate-700/40"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-16 rounded bg-slate-700/40 ml-auto"></div></td>
                      <td className="px-6 py-5"><div className="h-4 w-16 rounded bg-slate-700/40 mx-auto"></div></td>
                    </tr>
                  ))
                ) : trades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        <p>No trades match the current filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  trades.map(t => (
                    <tr 
                      key={t.id} 
                      className="group transition-all duration-300 hover:bg-white/[0.03]"
                    >
                      <td className="px-6 py-5 text-slate-400">
                        {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-5 font-medium text-slate-200">{t.symbol}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          t.side.toLowerCase() === 'buy' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${t.side.toLowerCase() === 'buy' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                          {t.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 font-medium">{t.quantity}</td>
                      <td className="px-6 py-5 font-mono text-xs">{t.entry_price.toFixed(5)}</td>
                      <td className="px-6 py-5 text-slate-400 font-mono text-xs">
                        {t.exit_price != null ? t.exit_price.toFixed(5) : '—'}
                      </td>
                      <td className="px-6 py-5 text-right font-medium">
                        {t.pnl != null ? (
                          <span className={`font-mono text-sm tracking-tight ${t.pnl > 0 ? 'text-emerald-400' : t.pnl < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                            {t.pnl > 0 ? '+' : ''}${Math.abs(t.pnl).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center relative group/tooltip">
                        <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                          t.status.toLowerCase() === 'open'
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                            : t.status.toLowerCase() === 'closed'
                            ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            : t.status.toLowerCase() === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-help'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                        
                        {t.status.toLowerCase() === 'failed' && t.error_message && (
                          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 transition-all duration-200 z-50">
                            <div className="w-64 rounded-lg border border-rose-500/20 bg-slate-900/95 p-3 text-left text-xs text-rose-300 shadow-xl backdrop-blur-xl">
                              <span className="mb-1 block font-semibold text-rose-200">Execution Blocked</span>
                              {t.error_message}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
