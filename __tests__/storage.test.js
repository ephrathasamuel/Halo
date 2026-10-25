import { describe, it, expect, beforeEach } from 'vitest';
import { readStorage } from '@/lib/storage/readStorage';
import { writeStorage } from '@/lib/storage/writeStorage';
import { STORAGE_KEYS } from '@/lib/storage/keys';

describe('readStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns fallback when key is missing', () => {
    const result = readStorage('nonexistent', []);
    expect(result.data).toEqual([]);
    expect(result.recovered).toBe(false);
  });

  it('reads stored JSON correctly', () => {
    localStorage.setItem('test_key', JSON.stringify({ foo: 'bar' }));
    const result = readStorage('test_key', null);
    expect(result.data).toEqual({ foo: 'bar' });
    expect(result.recovered).toBe(false);
  });

  it('recovers from malformed JSON without crashing', () => {
    localStorage.setItem('bad_key', '{not valid json!!!');
    const result = readStorage('bad_key', []);
    expect(result.data).toEqual([]);
    expect(result.recovered).toBe(true);
  });

  it('removes corrupted key on recovery', () => {
    localStorage.setItem('bad_key2', 'corrupt');
    readStorage('bad_key2', null);
    expect(localStorage.getItem('bad_key2')).toBeNull();
  });
});

describe('writeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes and reads back correctly', () => {
    const result = writeStorage('write_test', { hello: 'world' });
    expect(result.ok).toBe(true);
    const read = readStorage('write_test', null);
    expect(read.data).toEqual({ hello: 'world' });
  });

  it('writes to sessionStorage when specified', () => {
    const result = writeStorage('session_test', 'value', 'session');
    expect(result.ok).toBe(true);
    const raw = sessionStorage.getItem('session_test');
    expect(JSON.parse(raw)).toBe('value');
  });
});

describe('Storage keys', () => {
  it('all keys start with halo_ and end with _v1', () => {
    for (const [name, key] of Object.entries(STORAGE_KEYS)) {
      expect(key).toMatch(/^halo_.*_v1$/);
    }
  });
});
