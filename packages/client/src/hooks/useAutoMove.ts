import { useEffect } from 'react';
import type { GameRunner, RunnerSnapshot } from '../runner/GameRunner';

// Long enough for the player to see which token was the only choice.
const AUTO_MOVE_DELAY_MS = 450;

// Spec 4.10: with the setting on, a sole legal move is played for the human.
export function useAutoMove(runner: GameRunner, snapshot: RunnerSnapshot, enabled: boolean): void {
  useEffect(() => {
    if (!enabled || snapshot.state.turn.phase !== 'move' || snapshot.options.length !== 1) return;
    const only = snapshot.options[0];
    if (only === undefined) return;
    const timer = setTimeout(() => {
      runner.move(only.move);
    }, AUTO_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [runner, snapshot, enabled]);
}
