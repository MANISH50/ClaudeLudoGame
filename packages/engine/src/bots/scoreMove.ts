import { applyMove } from '../applyMove';
import { BASE, LAST_TRACK_PROGRESS, isSafeTrackIndex, trackIndex } from '../boardGeometry';
import type { GameEvent } from '../events';
import type { Move } from '../move';
import type { GameState } from '../state';

type MovedEvent = Extract<GameEvent, { type: 'moved' }>;

// Tiers are spaced wider than any progress value (0..56), so a lower tier can never
// outscore a higher one. Progress only breaks ties inside a tier ("advance the furthest").
const WEIGHT = {
  finish: 1_000_000,
  capture: 100_000,
  leaveBase: 10_000,
  safe: 1_000,
} as const;

// Scores by reading the events of a simulated move, so the bot uses the engine's own
// verdict on captures and finishes rather than re-deriving rules.
export function scoreMove(state: GameState, move: Move): number {
  const events = applyMove(state, move).events;
  const moved = events.find(
    (e): e is MovedEvent => e.type === 'moved' && e.color === move.color && e.tokenIndex === move.tokenIndex,
  );
  if (moved === undefined) throw new Error('applyMove produced no moved event for a legal move');

  let score = moved.to;
  const finished = events.some(
    (e) => e.type === 'reachedHome' && e.color === move.color && e.tokenIndex === move.tokenIndex,
  );
  if (finished) score += WEIGHT.finish;
  if (events.some((e) => e.type === 'captured' && e.by === move.color)) score += WEIGHT.capture;
  // Leaving base is read from the from-square: applyMove never emits 'released' (only the double-six roll does).
  if (moved.from === BASE) score += WEIGHT.leaveBase;
  if (moved.to >= 0 && moved.to <= LAST_TRACK_PROGRESS && isSafeTrackIndex(trackIndex(move.color, moved.to))) {
    score += WEIGHT.safe;
  }
  return score;
}
