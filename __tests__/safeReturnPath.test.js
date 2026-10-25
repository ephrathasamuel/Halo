import { describe, it, expect } from 'vitest';
import { safeReturnPath } from '@/lib/safeReturnPath';

describe('safeReturnPath', () => {
  it('accepts a valid internal path like /cars', () => {
    expect(safeReturnPath('/cars')).toBe('/cars');
  });

  it('accepts a valid internal path like /dashboard', () => {
    expect(safeReturnPath('/dashboard')).toBe('/dashboard');
  });

  it('accepts a nested path like /bookings/123', () => {
    expect(safeReturnPath('/bookings/123')).toBe('/bookings/123');
  });

  it('accepts a path with query params', () => {
    expect(safeReturnPath('/browse?type=studio')).toBe('/browse?type=studio');
  });

  it('rejects protocol-relative URL //evil.com', () => {
    expect(safeReturnPath('//evil.com')).toBe('/');
  });

  it('rejects https://example.com', () => {
    expect(safeReturnPath('https://example.com')).toBe('/');
  });

  it('rejects http://example.com', () => {
    expect(safeReturnPath('http://example.com')).toBe('/');
  });

  it('rejects backslash path /\\evil.com', () => {
    expect(safeReturnPath('/\\evil.com')).toBe('/');
  });

  it('rejects javascript: scheme', () => {
    expect(safeReturnPath('javascript:alert(1)')).toBe('/');
  });

  it('rejects data: scheme', () => {
    expect(safeReturnPath('data:text/html,<h1>hi</h1>')).toBe('/');
  });

  it('returns / for empty string', () => {
    expect(safeReturnPath('')).toBe('/');
  });

  it('returns / for null', () => {
    expect(safeReturnPath(null)).toBe('/');
  });

  it('returns / for undefined', () => {
    expect(safeReturnPath(undefined)).toBe('/');
  });

  it('returns / for non-string input', () => {
    expect(safeReturnPath(42)).toBe('/');
  });

  it('rejects bare domain', () => {
    expect(safeReturnPath('evil.com')).toBe('/');
  });
});
