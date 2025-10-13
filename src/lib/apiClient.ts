// lib/apiClient.ts
import { getAccessToken } from './supabaseClient';
import type {
  DashboardData,
  AnalysisRequest,
  CreateAnalysisResponse,
  ProfileAnalysisRequest,
} from '../types/api';

/**
 * Server contract notes (from Elysia docs):
 * - Endpoints:
 *   POST /auth/signup
 *   GET  /api/user/dashboard
 *   POST /api/analysis-requests/
 *   GET  /api/analysis-requests/{requestId}
 *   POST /api/analysis-requests/profile
 * - Status values may be UPPERCASE on the wire: PENDING|PROCESSING|CACHED|COMPLETED|FAILED:contentReference[oaicite:1]{index=1}.
 *   We normalize to lowercase internally and accept both.
 */

// Base URL: use empty for Vite dev proxy, full URL for prod
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || 'https://zanalyzer.fly.dev';
const API_BASE_URL = RAW_BASE.endsWith('/') ? RAW_BASE.slice(0, -1) : RAW_BASE;

// ---------- Utilities ----------

/** Ensure we have a stable session id for server-side correlation */
function ensureSessionId(): string {
  let sid = sessionStorage.getItem('x-session-id');
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem('x-session-id', sid);
  }
  return sid;
}

/** Normalize endpoint path and base URL without double slashes */
function buildUrl(endpoint: string): string {
  if (!API_BASE_URL) {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${path}`;
}

/** Read response body safely (JSON if possible, otherwise text) */
async function readBodySafe(res: Response): Promise<any> {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  try {
    const text = await res.text();
    return text || null;
  } catch {
    return null;
  }
}

export class ApiHttpError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.data = data;
  }
}

/** Abort with timeout; returns a composed signal that also reflects caller's aborts */
function withTimeout(signal: AbortSignal | undefined, ms?: number) {
  if (!ms) return { signal };
  const internal = new AbortController();
  const onAbort = () => internal.abort();

  let timer: number | undefined;
  if (ms) timer = window.setTimeout(() => internal.abort(), ms);

  if (signal) {
    if (signal.aborted) internal.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  const composed = new AbortController();
  const cleanup = () => {
    if (typeof timer !== 'undefined') clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  };

  internal.signal.addEventListener('abort', () => {
    composed.abort();
    cleanup();
  });

  return { signal: composed.signal };
}

/** Small helper: add header only if defined */
function addIfDefined<T extends HeadersInit>(headers: T, key: string, value?: string | null) {
  if (value) (headers as Record<string, string>)[key] = value;
  return headers;
}

// ---------- Fetch core ----------

/**
 * Unified fetch wrapper with automatic auth injection & better errors
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const token = await getAccessToken().catch(() => null);
  const sessionId = ensureSessionId();

  const { timeoutMs, signal, headers: hdrs, ...rest } = options;
  const { signal: effectiveSignal } = withTimeout(signal || undefined, timeoutMs);

  // Only set JSON content-type when there is a body (avoids odd server behavior on GET)
  const headers: HeadersInit = { ...(hdrs || {}) };
  if (rest.body && !('Content-Type' in (hdrs || {}))) {
    (headers as any)['Content-Type'] = 'application/json';
  }

  addIfDefined(headers, 'Authorization', token ? `Bearer ${token}` : null);
  addIfDefined(headers, 'x-session-id', sessionId);

  let res: Response;
  try {
    res = await fetch(buildUrl(endpoint), {
      ...rest,
      headers,
      signal: effectiveSignal,
    });
  } catch (e: any) {
    // Network / CORS / timeout
    throw new ApiHttpError(e?.message || 'Network error', 0, { cause: e });
  }

  // Handle 304 (if you decide to send If-None-Match elsewhere)
  if (res.status === 304) {
    return { _notModified: true } as T;
  }

  const body = await readBodySafe(res);

  if (!res.ok) {
    // Handle 401 Unauthorized - session may be invalid/expired
    if (res.status === 401) {
      console.warn('⚠️ 401 Unauthorized - checking session validity...');
      
      // Dynamically import to avoid circular dependencies
      const { supabase } = await import('./supabaseClient');
      
      // Force a fresh session check
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('🔓 Invalid/expired session detected, signing out...');
        
        // Force sign out to clean up stale state
        await supabase.auth.signOut();
        
        // Clear any local storage that might be stale
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('signed_up_') || 
              key.startsWith('auth_') || 
              key === 'postAuthRedirect') {
            sessionStorage.removeItem(key);
          }
        });
        
        // The onAuthStateChange listener will update UI automatically
        console.log('✅ Stale session cleared, UI will update');
      } else {
        console.log('✅ Session is valid, 401 was from API server');
      }
    }
    
    // Prefer explicit server error payloads
    const message =
      (body && typeof body === 'object' && 'error' in (body as any) && (body as any).error) ||
      (typeof body === 'string' && body) ||
      res.statusText ||
      `API Error: ${res.status}`;
    throw new ApiHttpError(String(message), res.status, body);
  }

  return body as T;
}

// ---------- Status typing & helpers ----------

export type AnalysisStatusUpper = 'PENDING' | 'PROCESSING' | 'CACHED' | 'COMPLETED' | 'FAILED';
export type AnalysisStatusLower = Lowercase<AnalysisStatusUpper>;
export type AnalysisStatus = AnalysisStatusUpper | AnalysisStatusLower;

const toLowerStatus = (s?: string): AnalysisStatusLower | undefined =>
  s ? (s.toLowerCase() as AnalysisStatusLower) : undefined;

const isFinalStatus = (s?: string): boolean => {
  const st = toLowerStatus(s);
  return st === 'completed' || st === 'failed' || st === 'cached';
};

// ---------- Public API ----------

/**
 * POST /auth/signup
 * 200: "User already exists..." | 201: "User signed up successfully" | 401/500 per docs:contentReference[oaicite:2]{index=2}.
 */
export async function authSignup(): Promise<string> {
  return apiFetch<string>('/auth/signup', { method: 'POST', timeoutMs: 20_000 });
}

/**
 * GET /api/user/dashboard
 * Returns quotas and recent requests per docs:contentReference[oaicite:3]{index=3}.
 */
export async function getDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>('/api/user/dashboard', { method: 'GET', timeoutMs: 20_000 });
}

/**
 * POST /api/analysis-requests/ — create a new analysis
 * 200 (cached): { message:"Analysis already exists", status:"cached", ... }
 * 202 (queued): { status:"queued", queuePosition?, estimatedWait }:contentReference[oaicite:4]{index=4}.
 */
export async function createAnalysis(
  videoUrl: string,
  customPrompt?: string,
  options?: { signal?: AbortSignal }
): Promise<CreateAnalysisResponse> {
  return apiFetch<CreateAnalysisResponse>('/api/analysis-requests/', {
    method: 'POST',
    body: JSON.stringify({
      videoUrl,
      ...(customPrompt && { customPrompt }),
    }),
    timeoutMs: 30_000,
    signal: options?.signal,
  });
}

/**
 * GET /api/analysis-requests/{requestId}
 * Returns request with `status` and (when complete) a `result` (single video)
 * or `profileResult` (batch) per docs:contentReference[oaicite:5]{index=5}.
 */
export async function getAnalysis(
  requestId: string,
  options?: { signal?: AbortSignal }
): Promise<AnalysisRequest> {
  return apiFetch<AnalysisRequest>(`/api/analysis-requests/${requestId}`, {
    method: 'GET',
    timeoutMs: 20_000,
    signal: options?.signal,
  });
}

/**
 * POST /api/analysis-requests/profile — create a profile analysis (queued 202):contentReference[oaicite:6]{index=6}.
 */
export async function createProfileAnalysis(
  profileHandle: string,
  customPrompt?: string,
  options?: { signal?: AbortSignal }
): Promise<CreateAnalysisResponse> {
  return apiFetch<CreateAnalysisResponse>('/api/analysis-requests/profile', {
    method: 'POST',
    body: JSON.stringify({
      username: profileHandle.startsWith('@') ? profileHandle.slice(1) : profileHandle,
      ...(customPrompt && { customPrompt }),
    }),
    timeoutMs: 30_000,
    signal: options?.signal,
  });
}

/**
 * GET /api/analysis-requests/{requestId}
 * Alias so profile polling can reuse the shared analysis endpoint.
 */
export async function getProfileAnalysis(
  requestId: string,
  options?: { signal?: AbortSignal }
): Promise<ProfileAnalysisRequest> {
  // Profile jobs are returned from the shared analysis endpoint.
  const analysis = await getAnalysis(requestId, options);
  return analysis as ProfileAnalysisRequest;
}

/**
 * Optional: poll until analysis is completed/failed/cached or timeout.
 * Usage:
 *   const final = await pollAnalysis(id, { intervalMs: 1000, timeoutMs: 120000 });
 */
export async function pollAnalysis(
  requestId: string,
  opts: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}
): Promise<AnalysisRequest> {
  const { intervalMs = 1000, timeoutMs = 120000, signal } = opts;
  const start = Date.now();

  const sleep = (ms: number, s?: AbortSignal) =>
    new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      if (s) {
        if (s.aborted) {
          clearTimeout(t);
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        s.addEventListener(
          'abort',
          () => {
            clearTimeout(t);
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true }
        );
      }
    });

  let current = await getAnalysis(requestId, { signal });
  if (isFinalStatus(current?.status)) return current;

  while (Date.now() - start < timeoutMs) {
    await sleep(intervalMs, signal);
    current = await getAnalysis(requestId, { signal });
    if (isFinalStatus(current?.status)) return current;
  }

  return current; // last known state (may still be non-final)
}

// ---------- Optional niceties (opt-in) ----------

/**
 * Conditional GET using ETag (if your backend returns ETag for request resources).
 * Returns `{ notModified: true }` when server replies 304.
 */
export async function getAnalysisConditional(
  requestId: string,
  etag: string,
  options?: { signal?: AbortSignal }
): Promise<{ notModified: boolean; data?: AnalysisRequest; etag?: string }> {
  const res = await fetch(buildUrl(`/api/analysis-requests/${requestId}`), {
    method: 'GET',
    headers: {
      'If-None-Match': etag,
      ...(await (async () => {
        const token = await getAccessToken().catch(() => null);
        const h: Record<string, string> = {};
        addIfDefined(h, 'Authorization', token ? `Bearer ${token}` : null);
        addIfDefined(h, 'x-session-id', ensureSessionId());
        return h;
      })()),
    },
    signal: options?.signal,
  }).catch((e) => {
    throw new ApiHttpError(e?.message || 'Network error', 0, { cause: e });
  });

  if (res.status === 304) return { notModified: true };

  const body = await readBodySafe(res);
  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && 'error' in (body as any) && (body as any).error) ||
      (typeof body === 'string' && body) ||
      res.statusText ||
      `API Error: ${res.status}`;
    throw new ApiHttpError(String(message), res.status, body);
  }

  return {
    notModified: false,
    data: body as AnalysisRequest,
    etag: res.headers.get('etag') || undefined,
  };
}
