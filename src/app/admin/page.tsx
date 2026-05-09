'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/Layout';
import { apiFetch } from '@/lib/apiClient';

type AdminStats = {
  active_subscriptions: number;
  open_trades: number;
  estimated_mrr: number;
  engine_health: string;
  failure_rate: number;
  last_signal_at: string | null;
};

type AuditLog = {
  id: number;
  event_type: string;
  severity: string;
  message: string;
  created_at: string;
};

type User = {
  id: number;
  email: string;
  is_active: boolean;
  is_admin: boolean;
};

const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) => (
  <div style={{
    background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px',
    padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.2s',
  }}>
    <div style={{
      position: 'absolute', top: '-20px', right: '-20px', width: '80px', height: '80px',
      borderRadius: '50%', background: `${color}18`, filter: 'blur(20px)',
    }} />
    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>{label}</p>
    <p style={{ fontSize: '2rem', fontWeight: 800, color: color, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 500 }}>{sub}</p>}
  </div>
);

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : '';

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch<AdminStats>('/admin/stats', {}, token).catch(() => null),
      apiFetch<User[]>('/admin/users', {}, token).catch(() => []),
      apiFetch<AuditLog[]>('/admin/audit-logs', {}, token).catch(() => []),
    ]).then(([s, u, l]) => {
      if (s) setStats(s);
      setUsers(u || []);
      setLogs(l || []);
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, [token]);

  async function toggleUserActive(u: User) {
    try {
      const path = u.is_active ? `/admin/users/${u.id}/deactivate` : `/admin/users/${u.id}/activate`;
      await apiFetch(path, { method: 'POST' }, token);
      setUsers(prev => prev.map(p => (p.id === u.id ? { ...p, is_active: !u.is_active } : p)));
    } catch (e: any) { setError(e.message); }
  }

  async function handleHalt() {
    try {
      await apiFetch('/admin/halt', { method: 'POST' }, token);
      setStats(prev => prev ? { ...prev, engine_health: 'HALTED' } : null);
    } catch (e: any) { setError(e.message); }
  }

  async function handleResume() {
    try {
      await apiFetch('/admin/resume', { method: 'POST' }, token);
      setStats(prev => prev ? { ...prev, engine_health: 'HEALTHY' } : null);
    } catch (e: any) { setError(e.message); }
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '4px 14px', borderRadius: '100px', marginBottom: '12px',
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f59e0b' }}>Admin Access</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '6px' }}>Admin Console</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Platform overview, user management, and system health.</p>
        </div>

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(255,94,122,0.08)', border: '1px solid rgba(255,94,122,0.2)', color: '#ff5e7a', fontSize: '0.875rem', marginBottom: '24px' }}>
            ⚠ {error}
          </div>
        )}

        {/* Stats & Health */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>
            {[0,1,2].map(i => <div key={i} style={{ height: '120px', borderRadius: '16px', background: 'var(--bg-card)', animation: 'pulse 1.5s infinite' }} />)}
          </div>
        ) : stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '32px' }}>
            <StatCard label="Active Subscriptions" value={stats.active_subscriptions} sub="Paid users" color="#00ff88" />
            <StatCard label="Engine Vital Signs" value={stats.engine_health} sub={`Last Signal: ${stats.last_signal_at ? new Date(stats.last_signal_at).toLocaleTimeString() : 'Never'}`} color={stats.engine_health === 'HEALTHY' ? '#00ff88' : '#ff5e7a'} />
            <StatCard label="Execution Health" value={`${stats.failure_rate}%`} sub="Failure Rate (24h)" color={stats.failure_rate < 5 ? '#00ff88' : '#f59e0b'} />
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '40px' }}>
          {/* Audit Logs */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>System Audit Log</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>Real-time engine transparency</p>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody style={{ fontSize: '0.8125rem' }}>
                  {logs.length === 0 ? (
                    <tr><td style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No audit events recorded</td></tr>
                  ) : logs.map((log, idx) => (
                    <tr key={log.id} style={{ borderBottom: idx < logs.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <td style={{ padding: '12px 20px', verticalAlign: 'top' }}>
                        <span style={{ 
                          fontSize: '0.65rem', fontWeight: 700, 
                          color: log.severity === 'CRITICAL' ? '#ff5e7a' : log.severity === 'WARNING' ? '#f59e0b' : '#4a5a7a' 
                        }}>
                          {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{log.event_type}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', lineHeight: 1.4 }}>{log.message}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="glass-card" style={{ padding: '24px' }}>
             <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>System Controls</h2>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  onClick={handleHalt}
                  className="btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center', color: '#ff5e7a', borderColor: 'rgba(255,94,122,0.2)' }}
                >
                  Trigger Emergency Halt
                </button>
                <button 
                  onClick={handleResume}
                  className="btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center', color: '#00ff88', borderColor: 'rgba(0,255,136,0.2)' }}
                >
                  Resume Signal Flow
                </button>
                <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Clear System Cache</button>
                <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>Force Model Retrain</button>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '8px 0' }} />
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}>
                   <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#00ff88', marginBottom: '4px' }}>ESTIMATED MRR</p>
                   <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>${stats?.estimated_mrr.toFixed(0) || '0'}</p>
                </div>
             </div>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>User Registry</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{users.length} accounts registered</p>
            </div>
            <div style={{ padding: '6px 14px', borderRadius: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {users.filter(u => u.is_active).length} active
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['User', 'Role', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: h === 'Action' ? 'right' : 'left', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No users found</td></tr>
                ) : users.map((u, idx) => (
                  <tr key={u.id} style={{ borderBottom: idx < users.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                          background: u.is_admin ? 'rgba(245,158,11,0.15)' : 'rgba(0,255,136,0.10)',
                          border: `1px solid ${u.is_admin ? 'rgba(245,158,11,0.3)' : 'rgba(0,255,136,0.2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.7rem', fontWeight: 700, color: u.is_admin ? '#f59e0b' : '#00ff88',
                        }}>
                          {u.email.substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>{u.email}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        background: u.is_admin ? 'rgba(245,158,11,0.1)' : 'rgba(14,165,233,0.1)',
                        color: u.is_admin ? '#f59e0b' : '#0ea5e9',
                        border: `1px solid ${u.is_admin ? 'rgba(245,158,11,0.2)' : 'rgba(14,165,233,0.2)'}`,
                      }}>
                        {u.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.is_active ? '#00ff88' : '#4a5a7a', display: 'inline-block' }} />
                        <span style={{ fontSize: '0.8rem', color: u.is_active ? '#00ff88' : 'var(--text-muted)', fontWeight: 600 }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => toggleUserActive(u)}
                        style={{
                          padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                          background: u.is_active ? 'rgba(255,94,122,0.08)' : 'rgba(0,255,136,0.08)',
                          color: u.is_active ? '#ff5e7a' : '#00ff88',
                          border: `1px solid ${u.is_active ? 'rgba(255,94,122,0.2)' : 'rgba(0,255,136,0.2)'}`,
                        }}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
