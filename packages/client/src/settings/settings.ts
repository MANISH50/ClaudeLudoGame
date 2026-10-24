export type Theme = 'light' | 'dark';
export type Volume = 'low' | 'medium' | 'high';

export interface Settings {
  readonly theme: Theme;
  // Spec 4.10: when on, a sole legal move is played automatically. Off by default.
  readonly autoMove: boolean;
  // Sound effects are on by default; the header mute button flips this too.
  readonly sound: boolean;
  readonly volume: Volume;
}

const STORAGE_KEY = 'ludo.settings.v1';
const VOLUMES: readonly Volume[] = ['low', 'medium', 'high'];

export function defaultSettings(prefersDark: boolean): Settings {
  return { theme: prefersDark ? 'dark' : 'light', autoMove: false, sound: true, volume: 'medium' };
}

function isVolume(value: unknown): value is Volume {
  return typeof value === 'string' && (VOLUMES as readonly string[]).includes(value);
}

// Storage can be blocked (private mode, disabled cookies). Settings then fall back to defaults.
// Each field is checked on its own, so a blob written by an older version still loads.
export function loadSettings(prefersDark: boolean): Settings {
  const fallback = defaultSettings(prefersDark);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return fallback;
    const record = parsed as Record<string, unknown>;
    return {
      theme: record['theme'] === 'dark' || record['theme'] === 'light' ? record['theme'] : fallback.theme,
      autoMove: typeof record['autoMove'] === 'boolean' ? record['autoMove'] : fallback.autoMove,
      sound: typeof record['sound'] === 'boolean' ? record['sound'] : fallback.sound,
      volume: isVolume(record['volume']) ? record['volume'] : fallback.volume,
    };
  } catch {
    return fallback;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Not persisting is acceptable; the settings still apply for this visit.
  }
}
