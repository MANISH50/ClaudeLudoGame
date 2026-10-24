import { useCallback, useSyncExternalStore } from 'react';
import type { GameRunner, RunnerSnapshot } from '../runner/GameRunner';

// Re-renders on every runner update. The runner returns the same object until it changes.
export function useRunnerSnapshot(runner: GameRunner): RunnerSnapshot {
  const subscribe = useCallback((notify: () => void) => runner.subscribe(() => notify()), [runner]);
  const read = useCallback(() => runner.getSnapshot(), [runner]);
  return useSyncExternalStore(subscribe, read, read);
}
