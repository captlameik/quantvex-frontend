'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

/**
 * Syncs the Clerk session token into a global variable so that
 * the apiClient can use it without requiring React hooks.
 * Mount this component inside any layout that needs API access.
 */
export default function ClerkAuthSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const token = await getToken();
        if (!cancelled) {
          (window as any).__clerk_token = token;
        }
      } catch {
        // Clerk not ready or user not signed in
      }
    }

    sync();

    // Re-sync every 50 seconds (Clerk tokens expire in ~60s)
    const interval = setInterval(sync, 50_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [getToken]);

  return null; // renders nothing
}
