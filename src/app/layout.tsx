import './globals.css';
import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://quantvex.dev'),
  title: {
    default: 'Quantvex — AI-Powered Trading Signals & Automation',
    template: '%s | Quantvex',
  },
  description:
    'High-confidence AI trading signals, automated execution, and risk-first controls. Join 1,200+ traders using model-backed workflows.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Quantvex',
    title: 'Quantvex — AI-Powered Trading Signals & Automation',
    description:
      'High-confidence AI trading signals, automated execution, and risk-first controls.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Quantvex — AI-Powered Trading Signals & Automation',
    description:
      'High-confidence AI trading signals, automated execution, and risk-first controls.',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#00ff88',
          colorBackground: '#0d1524',
          colorInputBackground: 'rgba(255,255,255,0.04)',
          colorInputText: '#f0f4ff',
        },
      }}
    >
      <html lang="en">
        <body className="bg-slate-950 text-slate-50">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
