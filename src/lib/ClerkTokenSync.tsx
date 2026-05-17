'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

/**
 * Global Clerk-token synchroniser.
 *
 * Runs inside the root layout so it is active on *every* page — not just
 * dashboard routes.  On each mount and at a regular interval it fetches the
 * latest Clerk session token and stores it on `window.__clerk_token` so that
 * the plain-JS `apiClient.ts` helper (which cannot call React hooks) can
 * always attach a valid Bearer token to outgoing requests.
 *
 * The token is also refreshed immediately whenever Clerk's `getToken`
 * reference changes (e.g. after sign-in / sign-out).
 */
export default function ClerkTokenSync() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Nothing to do until Clerk has finished initialising.
    if (!isLoaded) return;

    let cancelled = false;

    async function sync() {
      try {
        if (isSignedIn) {
          const token = await getToken();
          if (!cancelled) {
            (window as any).__clerk_token = token;
          }
        } else {
          // User signed out — clear any stale token.
          (window as any).__clerk_token = null;
        }
      } catch {
        // Clerk not ready or session expired — clear token so apiClient
        // doesn't send a stale one.
        if (!cancelled) {
          (window as any).__clerk_token = null;
        }
      }
    }

    // Sync immediately on mount / auth-state change.
    sync();

    // Re-sync every 50 s — Clerk tokens expire after ~60 s.
    intervalRef.current = setInterval(sync, 50_000);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [getToken, isLoaded, isSignedIn]);

  return null; // renders nothing
}
