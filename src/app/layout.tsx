import './globals.css';
import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

export const metadata = {
  title: 'AI Trading SaaS',
  description: 'AI-powered trading signals and automation.',
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
