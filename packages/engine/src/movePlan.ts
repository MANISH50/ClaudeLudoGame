import { BASE, FINISHED, LAST_TRACK_PROGRESS, isSafeTrackIndex, trackIndex } from './boardGeometry';
import type { Color } from './color';
import { hasOpponentBlockade, tokensOnTrack, type TokenRef } from './occupancy';
import { findPlayer } from './players';
import type { GameState, Die } from './state';

export interface Capture {
  readonly square: number;
  readonly victims: readonly TokenRef[];
}

export interface MovePlan {
  readonly color: Color;
  readonly tokenIndex: number;
  readonly from: number;
  readonly to: number;
  readonly capture: Capture | null;
}

// Returns null when the token cannot legally use this die. Does not consider
// must-capture; that is a property of the whole move list, not of one token.
export function planMove(state: GameState, color: Color, tokenIndex: number, die: Die): MovePlan | null {
  const from = findPlayer(state.players, color).tokens[tokenIndex];
  if (from === undefined || from === FINISHED) return null;

  let to: number;
  if (from === BASE) {
    if (die !== 6) return null;
    to = 0;
  } else {
    const raw = from + die;
    if (raw > FINISHED && state.rules.exactFinish) return null;
    to = Math.min(raw, FINISHED);
  }

  // Blockades stop passage as well as landing, so every track square from the
  // first step up to the landing square (or the end of the track) is checked.
  if (state.rules.blocks) {
    const last = Math.min(to, LAST_TRACK_PROGRESS);
    for (let q = Math.max(from + 1, 0); q <= last; q++) {
      if (hasOpponentBlockade(state.players, trackIndex(color, q), color)) return null;
    }
  }

  let capture: Capture | null = null;
  if (to <= LAST_TRACK_PROGRESS) {
    const square = trackIndex(color, to);
    // Safe squares are shared peacefully; landing there captures nothing (Spec 4.7).
    if (!isSafeTrackIndex(square)) {
      const victims = tokensOnTrack(state.players, square).filter((t) => t.color !== color);
      if (victims.length > 0) capture = { square, victims };
    }
  }

  return { color, tokenIndex, from, to, capture };
}
