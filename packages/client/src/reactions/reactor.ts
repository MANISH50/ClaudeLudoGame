import type { Color } from '@ludo/engine';
import type { RunnerSnapshot } from '../runner/GameRunner';

// Until online seats exist, a human reaction is attributed to one seat on this device:
// the player whose turn it is when that seat is human, else the first human seat.
export function reactorColor(snapshot: RunnerSnapshot): Color | null {
  const turn = snapshot.state.turn;
  const isHuman = (color: Color) => snapshot.seats.some((s) => s.color === color && s.control.kind === 'human');
  if (turn.phase !== 'over' && isHuman(turn.player)) return turn.player;
  return snapshot.seats.find((s) => s.control.kind === 'human')?.color ?? null;
}
