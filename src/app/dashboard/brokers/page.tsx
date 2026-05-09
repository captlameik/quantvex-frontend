'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/Layout';
import { apiFetch } from '@/lib/apiClient';

interface Broker {
  id: number;
  broker_name: string;
  account_id: string | null;
  is_active: boolean;
  created_at: string;
}

const BROKER_LOGOS: Record<string, string> = {
  exness: '💹', binance: '🟡', bybit: '🔶', kucoin: '🟢', kraken: '🐙', oanda: '🏦', mt4: '📊', mt5: '📈',
};

const LabelInput = ({ label, type = 'text', value, onChange, placeholder, hint }: { label:string; type?:string; value:string; onChange:(v:string)=>void; placeholder:string; hint?:string }) => (
  <div>
    <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'6px' }}>{label}</label>
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{
      width:'100%', padding:'11px 14px', borderRadius:'10px',
      background:'var(--bg-base)', border:'1px solid var(--border-subtle)',
      color:'var(--text-primary)', fontSize:'0.875rem', outline:'none',
      fontFamily: type==='password' ? 'inherit' : 'JetBrains Mono, monospace',
      transition:'border-color 0.15s',
    }}
    onFocus={e => (e.target as HTMLInputElement).style.borderColor='var(--neon-green)'}
    onBlur={e => (e.target as HTMLInputElement).style.borderColor='var(--border-subtle)'}
    />
    {hint && <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'5px' }}>{hint}</p>}
  </div>
);

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [subMode, setSubMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [brokerName, setBrokerName] = useState('exness');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accountId, setAccountId] = useState('');

  const isMt4Mt5 = ['exness', 'mt4', 'mt5'].includes(brokerName);

  const fetchData = async () => {
    const token = localStorage.getItem('token') ?? '';
    try {
      const [brokerData, subData] = await Promise.all([
        apiFetch<Broker[]>('/brokers', {}, token),
        apiFetch<{ mode: string }>('/users/me/subscription', {}, token).catch(() => ({ mode: 'signal' }))
      ]);
      setBrokers(brokerData || []);
      setSubMode(subData?.mode || 'signal');
    } catch (err: any) { setError(err.message || 'Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true); setError(''); setSuccess('');
    const token = localStorage.getItem('token') ?? '';
    try {
      await apiFetch('/brokers', { method:'POST', body: JSON.stringify({ broker_name:brokerName, api_key:apiKey, api_secret:apiSecret, account_id:accountId, is_active:true }) }, token);
      setApiKey(''); setApiSecret(''); setAccountId('');
      setSuccess('Broker connected successfully!');
      await fetchData();
    } catch (err: any) { setError(err.message || 'Failed to add broker'); }
    finally { setSubmitLoading(false); }
  };

  const handleRemoveBroker = async (id: number) => {
    if (!confirm('Remove this broker connection?')) return;
    const token = localStorage.getItem('token') ?? '';
    try { await apiFetch(`/brokers/${id}`, { method:'DELETE' }, token); setBrokers(brokers.filter(b=>b.id!==id)); }
    catch (err: any) { setError(err.message || 'Failed to remove broker'); }
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth:'1000px' }}>
        {/* Header */}
        <div style={{ marginBottom:'32px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'4px 14px', borderRadius:'100px', marginBottom:'12px', background:'rgba(14,165,233,0.08)', border:'1px solid rgba(14,165,233,0.2)' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#0ea5e9' }} />
            <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#0ea5e9' }}>Execution Layer</span>
          </div>
          <h1 style={{ fontSize:'2rem', fontWeight:800, letterSpacing:'-0.03em', marginBottom:'6px' }}>Broker Connections</h1>
          <p style={{ fontSize:'0.875rem', color:'var(--text-muted)' }}>Securely link your exchange API keys. All credentials are encrypted before storage.</p>
        </div>

        {subMode === 'signal' && (
          <div style={{ marginBottom:'24px', padding:'16px', borderRadius:'12px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', color:'#f59e0b', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'10px' }}>
            <span>⚠️</span>
            <p>Your current plan only includes <b>Signals</b>. Upgrade to <b>Elite</b> to enable Auto-Execution on these brokers.</p>
          </div>
        )}

        {error && (
          <div style={{ padding:'14px 18px', borderRadius:'12px', background:'rgba(255,94,122,0.08)', border:'1px solid rgba(255,94,122,0.2)', color:'#ff5e7a', fontSize:'0.875rem', marginBottom:'20px' }}>⚠ {error}</div>
        )}
        {success && (
          <div style={{ padding:'14px 18px', borderRadius:'12px', background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)', color:'#00ff88', fontSize:'0.875rem', marginBottom:'20px' }}>✓ {success}</div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
          {/* Connected Brokers */}
          <div>
            <h2 style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--text-muted)', marginBottom:'16px' }}>
              Active Connections ({brokers.length})
            </h2>
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {[0,1].map(i=><div key={i} style={{ height:'90px', borderRadius:'14px', background:'var(--bg-card)', animation:'pulse 1.5s infinite' }} />)}
              </div>
            ) : brokers.length === 0 ? (
              <div style={{ padding:'40px 20px', textAlign:'center', background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', color:'var(--text-muted)' }}>
                <div style={{ fontSize:'2.5rem', marginBottom:'10px', opacity:0.5 }}>🔌</div>
                <p style={{ fontWeight:600, color:'var(--text-secondary)', marginBottom:'4px' }}>No brokers connected</p>
                <p style={{ fontSize:'0.8rem' }}>Link an exchange to enable automated trading.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {brokers.map(broker => (
                  <div key={broker.id} style={{ background:'var(--bg-card)', border:'1px solid rgba(0,255,136,0.15)', borderRadius:'14px', padding:'18px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem' }}>
                          {BROKER_LOGOS[broker.broker_name] || '🔗'}
                        </div>
                        <div>
                          <p style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)', textTransform:'capitalize' }}>{broker.broker_name}</p>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'2px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                              <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#00ff88' }} />
                              <span style={{ fontSize:'0.7rem', color:'#00ff88', fontWeight:600 }}>Connected</span>
                            </div>
                            {subMode === 'auto' && broker.is_active && (
                              <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'2px 6px', borderRadius:'4px', background:'rgba(14,165,233,0.1)', border:'1px solid rgba(14,165,233,0.2)' }}>
                                <span style={{ fontSize:'0.65rem', color:'#0ea5e9', fontWeight:700, textTransform:'uppercase' }}>Auto-Trade Ready</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveBroker(broker.id)}
                        style={{ padding:'6px 12px', borderRadius:'8px', background:'rgba(255,94,122,0.08)', border:'1px solid rgba(255,94,122,0.2)', color:'#ff5e7a', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}
                      >
                        Unlink
                      </button>
                    </div>
                    {broker.account_id && (
                      <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>ID: <span style={{ fontFamily:'JetBrains Mono, monospace', color:'var(--text-secondary)' }}>{broker.account_id}</span></p>
                    )}
                    <p style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:'4px' }}>Added {new Date(broker.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Broker Form */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-subtle)', borderRadius:'16px', overflow:'hidden' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)', marginBottom:'3px' }}>Link New Exchange</h2>
              <p style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Keys are AES-256 encrypted in the database.</p>
            </div>
            <form onSubmit={handleAddBroker} style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:'6px' }}>Exchange / Broker</label>
                <select
                  value={brokerName}
                  onChange={e => setBrokerName(e.target.value)}
                  style={{ width:'100%', padding:'11px 14px', borderRadius:'10px', background:'var(--bg-base)', border:'1px solid var(--border-subtle)', color:'var(--text-primary)', fontSize:'0.875rem', outline:'none' }}
                >
                  <optgroup label="Retail Forex">
                    <option value="exness">Exness (MT4/MT5)</option>
                    <option value="mt4">Generic MT4</option>
                    <option value="mt5">Generic MT5</option>
                    <option value="oanda">Oanda (v20 REST)</option>
                  </optgroup>
                  <optgroup label="Crypto (CCXT)">
                    <option value="binance">Binance</option>
                    <option value="bybit">Bybit</option>
                    <option value="kucoin">KuCoin</option>
                    <option value="kraken">Kraken</option>
                  </optgroup>
                </select>
              </div>

              <LabelInput
                label={isMt4Mt5 ? 'Account Login (Number)' : 'API Key'}
                value={apiKey}
                onChange={setApiKey}
                placeholder={isMt4Mt5 ? 'e.g. 10834012' : 'Paste your API key here'}
              />
              <LabelInput
                label={isMt4Mt5 ? 'Trader Password' : 'API Secret'}
                type="password"
                value={apiSecret}
                onChange={setApiSecret}
                placeholder={isMt4Mt5 ? 'Your MT4/MT5 password' : 'Paste your API secret here'}
                hint={isMt4Mt5 ? '' : 'Required for Binance, Bybit, KuCoin, etc. Oanda only uses a token.'}
              />
              {(brokerName === 'oanda' || isMt4Mt5) && (
                <LabelInput
                  label={isMt4Mt5 ? 'Server Name' : 'Oanda Account ID'}
                  value={accountId}
                  onChange={setAccountId}
                  placeholder={isMt4Mt5 ? 'e.g. Exness-MT5-Real9' : 'e.g. 101-001-XXXXXXX-001'}
                />
              )}

              <button
                type="submit"
                disabled={submitLoading || !apiKey}
                style={{
                  padding:'13px', borderRadius:'10px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'0.875rem',
                  background:'linear-gradient(135deg, #00ff88, #0ea5e9)',
                  color:'#000', opacity: (submitLoading || !apiKey) ? 0.5 : 1, transition:'all 0.2s',
                  boxShadow: (!submitLoading && apiKey) ? '0 4px 20px rgba(0,255,136,0.25)' : 'none',
                }}
              >
                {submitLoading ? '⏳ Linking...' : '🔌 Link Exchange Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
