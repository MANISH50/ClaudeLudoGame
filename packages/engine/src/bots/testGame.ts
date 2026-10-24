// Test-only: plays whole games with bots in every seat. Not re-exported from index.ts.
import { applyMove } from '../applyMove';
import type { Color } from '../color';
import { createGame } from '../createGame';
import { legalMoves } from '../legalMoves';
import type { Rules } from '../rules';
import { roll } from '../roll';
import type { GameState } from '../state';
import { seededRng } from '../testSupport';
import type { BotLevel } from './botLevel';
import { pickBotMove } from './pickBotMove';

// Generous bound: a random game should end well inside this. Hitting it means a stuck loop.
const MAX_STEPS = 50_000;

export interface PlayedGame {
  readonly final: GameState;
  readonly illegalPicks: number;
}

// Dice and bot choices use separate seeded streams, so one does not reshuffle the other.
export function playBotGame(
  colors: readonly Color[],
  levelOf: (color: Color) => BotLevel,
  seed: number,
  rules: Partial<Rules> = {},
): PlayedGame {
  const diceRng = seededRng(seed);
  const botRng = seededRng(seed + 0x9e3779b9);
  let state: GameState = createGame({ colors, rules });
  let illegalPicks = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    if (state.turn.phase === 'over') return { final: state, illegalPicks };
    if (state.turn.phase === 'roll') {
      state = roll(state, diceRng);
      continue;
    }
    const mover = state.turn.player;
    const legal = legalMoves(state);
    const pick = pickBotMove(state, levelOf(mover), botRng);
    if (!legal.some((m) => m.color === pick.color && m.tokenIndex === pick.tokenIndex)) illegalPicks++;
    state = applyMove(state, pick);
  }
  throw new Error(`bot game with seed ${seed} did not terminate in ${MAX_STEPS} steps`);
}

export function winnerOf(state: GameState): Color | null {
  return state.players.find((p) => p.rank === 1)?.color ?? null;
}
