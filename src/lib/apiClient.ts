const normalizeApiBase = (value: string) => value.replace(/\/+$/, '');

/**
 * Prefer NEXT_PUBLIC_API_URL. Default is same-origin `/api/v1` so it works
 * behind nginx (Docker) and with Next dev rewrites to the API — not bare
 * :8000, which is often unpublished in compose.
 */
const defaultApiBase = (() => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  }
  return '/api/v1';
})();

const API_BASE = defaultApiBase;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Get the Clerk session token for API calls.
 * Uses the global Clerk instance (injected by ClerkProvider).
 * Falls back to localStorage token for backward compatibility.
 */
async function getAuthToken(): Promise<string | null> {
  // Try Clerk first
  if (typeof window !== 'undefined' && (window as any).__clerk_frontend_api) {
    try {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        const token = await clerk.session.getToken();
        if (token) return token;
      }
    } catch {
      // Clerk not ready yet, fall through
    }
  }

  // Fallback: use the @clerk/nextjs useAuth hook's token stored globally
  // This is set by the ClerkAuthSync component
  if (typeof window !== 'undefined') {
    const clerkToken = (window as any).__clerk_token;
    if (clerkToken) return clerkToken;
  }

  // Legacy fallback for backward compatibility
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }

  return null;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Resolve token: explicit param > Clerk session > localStorage
  if (!token) {
    token = await getAuthToken();
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  let response: Response;

  try {
    response = await fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (error: any) {
    throw new ApiError(0, `Network error: ${error?.message ?? 'Unable to reach the API backend'}`);
  }

  if (response.status === 401) {
    // With Clerk, redirect to sign-in page instead of clearing localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token'); // cleanup legacy token
      window.location.href = '/sign-in';
    }
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (response.status === 402) {
    throw new ApiError(402, 'Active subscription required. Please upgrade your plan.');
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || body.message || detail;
    } catch {
      detail = await response.text().catch(() => detail);
    }
    throw new ApiError(response.status, detail);
  }

  // Handle empty responses (204, etc.)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null as T;
  }

  return response.json();
}
