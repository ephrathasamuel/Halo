/**
 * Validates a return path to prevent open redirects.
 * Accepts only internal paths that start with a single slash.
 * Rejects //, backslashes, and any scheme or host.
 * @param {string} value - The path to validate
 * @returns {string} A safe internal path, or '/' as fallback
 */
export function safeReturnPath(value) {
  if (typeof value !== 'string') return '/';
  const trimmed = value.trim();
  if (!trimmed) return '/';

  // Reject paths that don't start with /
  if (!trimmed.startsWith('/')) return '/';

  // Reject double slashes (protocol-relative URLs like //evil.com)
  if (trimmed.startsWith('//')) return '/';

  // Reject backslashes (Windows-style or escape attempts like /\evil.com)
  if (trimmed.includes('\\')) return '/';

  // Reject any scheme (e.g., javascript:, data:, https:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return '/';

  // Reject if URL constructor resolves to a different origin
  try {
    const url = new URL(trimmed, 'http://localhost');
    if (url.hostname !== 'localhost') return '/';
  } catch {
    return '/';
  }

  return trimmed;
}
