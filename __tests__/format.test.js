import { describe, it, expect } from 'vitest';
import { formatETB, formatDate, formatTime, relativeTime } from '@/lib/format';

describe('formatETB', () => {
  it('formats a number as ETB currency', () => {
    expect(formatETB(600)).toBe('ETB 600.00');
  });

  it('formats large numbers with commas', () => {
    expect(formatETB(15000)).toBe('ETB 15,000.00');
  });

  it('handles zero', () => {
    expect(formatETB(0)).toBe('ETB 0.00');
  });

  it('handles NaN gracefully', () => {
    expect(formatETB(NaN)).toBe('ETB 0.00');
  });

  it('handles non-number gracefully', () => {
    expect(formatETB('abc')).toBe('ETB 0.00');
  });
});

describe('formatDate', () => {
  it('formats YYYY-MM-DD date', () => {
    const result = formatDate('2024-06-15');
    expect(result).toContain('Jun');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('returns empty string for falsy input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate('')).toBe('');
  });
});

describe('formatTime', () => {
  it('formats 24h time to 12h', () => {
    expect(formatTime('14:30')).toBe('2:30 PM');
  });

  it('formats morning time', () => {
    expect(formatTime('09:00')).toBe('9:00 AM');
  });

  it('formats midnight', () => {
    expect(formatTime('00:00')).toBe('12:00 AM');
  });

  it('formats noon', () => {
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('returns empty string for falsy input', () => {
    expect(formatTime('')).toBe('');
  });
});

describe('relativeTime', () => {
  it('returns "just now" for very recent timestamps', () => {
    const now = new Date().toISOString();
    expect(relativeTime(now)).toBe('just now');
  });

  it('returns empty string for falsy input', () => {
    expect(relativeTime(null)).toBe('');
    expect(relativeTime('')).toBe('');
  });
});
