'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/apiClient';
import Link from 'next/link';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('No verification token found in URL.');
      return;
    }

    async function verifyToken() {
      try {
        const data = await apiFetch<{ access_token: string }>('/auth/verify-email', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        
        // Success! Set token and redirect
        localStorage.setItem('token', data.access_token);
        setStatus('success');
        
        // Slight delay for UX
        setTimeout(() => {
          router.push('/dashboard/brokers');
        }, 1500);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message ?? 'Invalid or expired verification link.');
      }
    }

    verifyToken();
  }, [token, router]);

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: 20 }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 560, padding: 32, textAlign: 'center' }}>
        
        {status === 'loading' && (
          <div>
            <div style={{ margin: '0 auto 18px', width: 52, height: 52, borderRadius: 999, border: '2px solid var(--border-blue)', borderTopColor: 'var(--electric-blue)', animation: 'spin 1s linear infinite' }} />
            <span className="badge badge-blue" style={{ marginBottom: 10 }}>Verifying account</span>
            <h1 style={{ marginBottom: 6, fontSize: '1.6rem' }}>Securing your profile</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Please wait while we verify your email link...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              margin: '0 auto 16px',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(0,255,136,0.12)',
              border: '1px solid var(--border-green)',
              color: 'var(--neon-green)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 24,
              fontWeight: 700,
            }}>
              ✓
            </div>
            <span className="badge badge-green" style={{ marginBottom: 10 }}>Email verified</span>
            <h1 style={{ marginBottom: 8, fontSize: '1.6rem' }}>Account activated</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
              Redirecting you to broker setup so you can complete onboarding.
            </p>
            <Link href="/dashboard/brokers" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Continue Now
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              margin: '0 auto 16px',
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255,94,122,0.12)',
              border: '1px solid rgba(255,94,122,0.3)',
              color: '#ff5e7a',
              display: 'grid',
              placeItems: 'center',
              fontSize: 22,
              fontWeight: 700,
            }}>
              ×
            </div>
            <h1 style={{ marginBottom: 8, fontSize: '1.5rem' }}>Verification failed</h1>
            <p style={{ marginBottom: 20, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{errorMsg}</p>
            <Link
              href="/login"
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Return to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
