import { IllegalActionError } from '../errors';
import { legalMoves } from '../legalMoves';
import type { Move } from '../move';
import type { Rng } from '../rng';
import type { GameState } from '../state';
import type { BotLevel } from './botLevel';
import { scoreMove } from './scoreMove';

// Pure given state and rng. The caller owns the RNG stream, so replays are exact.
export function pickBotMove(state: GameState, level: BotLevel, rng: Rng): Move {
  if (state.turn.phase !== 'move') throw new IllegalActionError('bot cannot move: no move is pending');
  const moves = legalMoves(state);
  if (moves.length === 0) throw new IllegalActionError('bot cannot move: no legal move');
  return pickOne(candidatesFor(state, level, moves), rng);
}

function candidatesFor(state: GameState, level: BotLevel, moves: readonly Move[]): readonly Move[] {
  switch (level) {
    case 'easy':
      return moves;
    case 'medium':
      return bestScoring(state, moves);
  }
}

// Ties are kept, not resolved by list order, so Medium does not always play the same token.
function bestScoring(state: GameState, moves: readonly Move[]): readonly Move[] {
  let best = Number.NEGATIVE_INFINITY;
  let top: Move[] = [];
  for (const move of moves) {
    const score = scoreMove(state, move);
    if (score > best) {
      best = score;
      top = [move];
    } else if (score === best) {
      top.push(move);
    }
  }
  return top;
}

function pickOne(options: readonly Move[], rng: Rng): Move {
  const index = Math.min(options.length - 1, Math.floor(rng() * options.length));
  const pick = options[index];
  if (pick === undefined) throw new IllegalActionError('bot cannot move: empty candidate list');
  return pick;
}
