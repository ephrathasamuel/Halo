/**
 * Format a number as Ethiopian Birr.
 * @param {number} amount
 * @returns {string}
 */
export function formatETB(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return 'ETB 0.00';
  return `ETB ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format a date string (YYYY-MM-DD) for display.
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00+03:00');
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Addis_Ababa',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a time string (HH:mm) for display.
 * @param {string} timeStr
 * @returns {string}
 */
export function formatTime(timeStr) {
  if (!timeStr) return '';
  try {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  } catch {
    return timeStr;
  }
}

/**
 * Return a relative time string (e.g., "2 days ago").
 * @param {string} isoString - ISO timestamp
 * @returns {string}
 */
export function relativeTime(isoString) {
  if (!isoString) return '';
  try {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(isoString.slice(0, 10));
  } catch {
    return '';
  }
}
