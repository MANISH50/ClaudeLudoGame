import { COLORS, type Color } from './color';
import { isOnTrack, trackIndex } from './boardGeometry';
import type { PlayerState } from './state';

export interface TokenRef {
  readonly color: Color;
  readonly tokenIndex: number;
}

export function tokensOnTrack(players: readonly PlayerState[], index: number): TokenRef[] {
  const found: TokenRef[] = [];
  for (const player of players) {
    player.tokens.forEach((progress, tokenIndex) => {
      if (isOnTrack(progress) && trackIndex(player.color, progress) === index) {
        found.push({ color: player.color, tokenIndex });
      }
    });
  }
  return found;
}

// Two or more same-colour tokens of one colour on a square form a blockade for everyone else.
export function hasOpponentBlockade(players: readonly PlayerState[], index: number, mover: Color): boolean {
  const occupants = tokensOnTrack(players, index);
  return COLORS.some(
    (c) => c !== mover && occupants.filter((o) => o.color === c).length >= 2,
  );
}
