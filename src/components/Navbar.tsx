'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Signals', href: '/dashboard/trade-signals' },
  { label: 'Trades', href: '/dashboard/trade-history' },
  { label: 'Pricing', href: '/pricing' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(5,10,18,0.90)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 24px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #00ff88, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>⚡</div>
          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            AIX<span className="gradient-text">Trader</span>
          </span>
        </Link>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? 'var(--neon-green)' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  background: active ? 'rgba(0,255,136,0.07)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <SignedIn>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon-green)', display: 'inline-block' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Active</span>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: { width: 32, height: 32 },
                },
              }}
            />
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.8125rem', color: 'var(--text-secondary)', textDecoration: 'none', border: '1px solid var(--border-default)' }}>Login</Link>
            <Link href="/sign-up" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8125rem' }}>Get Started</Link>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}
