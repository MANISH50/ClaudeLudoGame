import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defaultSettings, loadSettings, saveSettings } from './settings';

// Node has no localStorage, so the tests provide the smallest stand-in loadSettings needs.
const store = new Map<string, string>();

beforeEach(() => {
  store.clear();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
  };
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

const KEY = 'ludo.settings.v1';

describe('settings', () => {
  it('defaults to sound on at medium volume', () => {
    expect(defaultSettings(false)).toEqual({ theme: 'light', autoMove: false, sound: true, volume: 'medium' });
    expect(loadSettings(true).theme).toBe('dark');
  });

  it('loads an old stored blob without sound or volume using the defaults', () => {
    store.set(KEY, JSON.stringify({ theme: 'dark', autoMove: true }));
    expect(loadSettings(false)).toEqual({ theme: 'dark', autoMove: true, sound: true, volume: 'medium' });
  });

  it('keeps valid stored sound and volume values', () => {
    store.set(KEY, JSON.stringify({ theme: 'light', autoMove: false, sound: false, volume: 'high' }));
    expect(loadSettings(false)).toEqual({ theme: 'light', autoMove: false, sound: false, volume: 'high' });
  });

  it('validates each field on its own', () => {
    store.set(KEY, JSON.stringify({ theme: 'light', sound: 'no', volume: 'deafening', autoMove: true }));
    expect(loadSettings(false)).toEqual({ theme: 'light', autoMove: true, sound: true, volume: 'medium' });
  });

  it('falls back to defaults when the stored text is not JSON', () => {
    store.set(KEY, '{not json');
    expect(loadSettings(false)).toEqual(defaultSettings(false));
  });

  it('round-trips through saveSettings', () => {
    const saved = { theme: 'dark' as const, autoMove: false, sound: false, volume: 'low' as const };
    saveSettings(saved);
    expect(loadSettings(false)).toEqual(saved);
  });
});
