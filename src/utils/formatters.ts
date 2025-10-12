// Formatting utilities

/**
 * Format a date value for display
 */
export function formatDate(value?: Date | string | null): string {
  if (!value) return '—';
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

/**
 * Build a display label for a TikTok profile
 */
export function buildProfileLabel(handleOrUrl: string | null | undefined): string {
  if (!handleOrUrl) return 'Profile';
  if (typeof handleOrUrl !== 'string') return 'Profile';
  if (handleOrUrl.startsWith('@')) return handleOrUrl;
  const match = handleOrUrl.match(/@([\w.-]+)/);
  if (match?.[1]) return `@${match[1]}`;
  const stripped = handleOrUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');
  return stripped || 'Profile';
}

/**
 * Build a link URL for a TikTok profile
 */
export function buildProfileLink(handleOrUrl: string | null | undefined): string {
  if (!handleOrUrl) return '#';
  if (typeof handleOrUrl !== 'string') return '#';
  if (handleOrUrl.includes('://')) return handleOrUrl;
  const normalized = handleOrUrl.startsWith('@') ? handleOrUrl.slice(1) : handleOrUrl;
  return `https://www.tiktok.com/@${normalized}`;
}

