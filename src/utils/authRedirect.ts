// utils/authRedirect.ts
const STORAGE_KEY = 'postAuthRedirect';

interface LocationShape {
  pathname?: string;
  search?: string;
  hash?: string;
}

/**
 * Build a full path (pathname + search + hash) from the given location parts.
 * Falls back to browser location when not provided.
 */
export function buildRedirectPath(parts?: LocationShape): string {
  if (typeof window === 'undefined') {
    return parts?.pathname ?? '/';
  }

  const { pathname, search, hash } = parts ?? window.location;
  const safePath = pathname ?? window.location.pathname ?? '/';
  const safeSearch = search ?? window.location.search ?? '';
  const safeHash = hash ?? window.location.hash ?? '';

  return `${safePath}${safeSearch}${safeHash}`;
}

/**
 * Persist the full redirect destination for use after OAuth.
 */
export function savePostAuthRedirect(path?: string) {
  if (typeof window === 'undefined') return;
  try {
    const value = path ?? buildRedirectPath();
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch (err) {
    console.error('Failed to persist post-auth redirect', err);
  }
}

/**
 * Read the stored redirect destination without removing it.
 */
export function peekPostAuthRedirect(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to read post-auth redirect', err);
    return null;
  }
}

/**
 * Remove any stored redirect destination.
 */
export function clearPostAuthRedirect() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear post-auth redirect', err);
  }
}

/**
 * Retrieve and clear the stored redirect destination, falling back when missing.
 */
export function consumePostAuthRedirect(fallback = '/'): string {
  const stored = peekPostAuthRedirect();
  clearPostAuthRedirect();
  return stored ?? fallback;
}

