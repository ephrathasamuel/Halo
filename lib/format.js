/**
 * Format a number as Ethiopian Birr.
 * @param {number} amount
 * @returns {string}
 */
export function formatETB(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return 'ETB 0.00';
  return `ETB ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Currencies that have no minor unit (no cents). */
const ZERO_DECIMAL = new Set(['RWF', 'UGX']);

/**
 * Amount with its currency code and two decimals, e.g. "KES 2,500.00".
 * @param {number} amount
 * @param {string} [currency='ETB'] ISO 4217 code
 * @returns {string}
 */
export function formatMoney(amount, currency = 'ETB') {
  const value = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const digits = ZERO_DECIMAL.has(currency) ? 0 : 2;
  return `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

/**
 * Compact price for cards and headings: no decimals when the amount is whole.
 * formatPrice(2500) -> "ETB 2,500", formatPrice(99.5, 'KES') -> "KES 99.50"
 * @param {number} amount
 * @param {string} [currency='ETB'] ISO 4217 code
 * @returns {string}
 */
export function formatPrice(amount, currency = 'ETB') {
  if (typeof amount !== 'number' || isNaN(amount)) return `${currency} 0`;
  const whole = Number.isInteger(amount) || ZERO_DECIMAL.has(currency);
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

/** Display names for each kind of listing. */
export const LISTING_TYPE_LABELS = {
  studio: 'Studio',
  equipment: 'Equipment',
  service: 'Event filming',
  sale: 'For sale',
};

/**
 * Opening hours as a readable range, e.g. "8:00 AM to 8:00 PM".
 * @param {{ open?: string, close?: string } | undefined} hours
 * @returns {string}
 */
export function formatHours(hours) {
  if (!hours?.open || !hours?.close) return '';
  return `${formatTime(hours.open)} to ${formatTime(hours.close)}`;
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
