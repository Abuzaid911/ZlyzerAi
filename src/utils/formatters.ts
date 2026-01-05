// utils/formatters.ts

/**
 * Format a date for display in the UI
 */
export function formatDate(d?: Date | string): string {
  if (!d) return '—';
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(d);
  }
}

/**
 * Format a number with commas
 */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Build a display label for a TikTok profile handle
 */
export function buildProfileLabel(handle: string | null | undefined): string {
  if (!handle) return 'Unknown profile';
  const normalized = handle.startsWith('@') ? handle : `@${handle}`;
  return normalized;
}

/**
 * Build a TikTok profile link from a handle
 */
export function buildProfileLink(handle: string | null | undefined): string {
  if (!handle) return 'https://tiktok.com';
  // If it's already a full URL, return it
  if (handle.startsWith('http://') || handle.startsWith('https://')) {
    return handle;
  }
  const normalized = handle.startsWith('@') ? handle.slice(1) : handle;
  return `https://www.tiktok.com/@${normalized}`;
}
