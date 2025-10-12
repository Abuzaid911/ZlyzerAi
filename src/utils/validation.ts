// Validation utilities

/**
 * Validates if a URL is a valid TikTok URL
 */
export function isValidTikTokUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      (parsed.hostname === 'www.tiktok.com' ||
        parsed.hostname === 'tiktok.com' ||
        parsed.hostname === 'vm.tiktok.com')
    );
  } catch {
    return false;
  }
}

/**
 * Basic sanitization for text content to prevent XSS
 * For production, consider using DOMPurify library
 */
export function sanitizeText(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validates and normalizes a TikTok handle
 */
export function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@/, '');
}

