import type { Color } from './color';
import type { GameEvent } from './events';
import { nextActiveColor } from './players';
import type { GameState } from './state';

// Hands the dice to the next unranked player clockwise. The consecutive-six count resets.
export function passTurn(state: GameState, mover: Color, events: readonly GameEvent[]): GameState {
  const next = nextActiveColor(state.players, mover);
  return {
    ...state,
    turn: { phase: 'roll', player: next, consecutiveSixes: 0 },
    events: [...events, { type: 'turnStarted', color: next }],
  };
}
