import type { Color } from './color';
import type { GameEvent } from './events';
import type { Rules } from './rules';

export type Die = 1 | 2 | 3 | 4 | 5 | 6;

// Progress per token lives in `tokens`, indexed 0..3. See boardGeometry for the encoding.
export interface PlayerState {
  readonly color: Color;
  readonly tokens: readonly number[];
  // 1 = first to finish. Null until the player is ranked.
  readonly rank: number | null;
}

export type TurnState =
  | { readonly phase: 'roll'; readonly player: Color; readonly consecutiveSixes: number }
  | { readonly phase: 'move'; readonly player: Color; readonly die: Die; readonly consecutiveSixes: number }
  | { readonly phase: 'over' };

export interface GameState {
  readonly rules: Rules;
  // Clockwise order, which is also turn order.
  readonly players: readonly PlayerState[];
  readonly turn: TurnState;
  // Events produced by the most recent createGame/roll/applyMove call.
  // Kept on the state so the public signatures match Spec section 5.
  readonly events: readonly GameEvent[];
}

export interface GameConfig {
  readonly colors: readonly Color[];
  readonly rules?: Partial<Rules>;
}
