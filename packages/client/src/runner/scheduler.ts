// Injected so tests can run bot turns synchronously instead of waiting on real timers.
export interface Scheduler {
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(handle: unknown): void;
}

export const browserScheduler: Scheduler = {
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>),
};

// Spec 6: bots think 600-1200 ms so their moves are readable. This is UI pacing, not rules.
export function randomThinkDelayMs(): number {
  return 600 + Math.floor(Math.random() * 601);
}
