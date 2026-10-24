export type Theme = 'light' | 'dark';

export interface Settings {
  readonly theme: Theme;
  // Spec 4.10: when on, a sole legal move is played automatically. Off by default.
  readonly autoMove: boolean;
}

const STORAGE_KEY = 'ludo.settings.v1';

export function defaultSettings(prefersDark: boolean): Settings {
  return { theme: prefersDark ? 'dark' : 'light', autoMove: false };
}

// Storage can be blocked (private mode, disabled cookies). Settings then fall back to defaults.
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
