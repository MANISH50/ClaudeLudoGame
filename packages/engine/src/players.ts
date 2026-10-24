import { COLORS, type Color } from './color';
import { FINISHED, TOKENS_PER_PLAYER } from './boardGeometry';
import type { PlayerState } from './state';

export function findPlayer(players: readonly PlayerState[], color: Color): PlayerState {
  const player = players.find((p) => p.color === color);
  if (player === undefined) throw new Error(`unknown colour ${color}`);
  return player;
}

export function setToken(
  players: readonly PlayerState[],
  color: Color,
  tokenIndex: number,
  progress: number,
): PlayerState[] {
  return players.map((p) => {
    if (p.color !== color) return p;
    return { ...p, tokens: p.tokens.map((t, i) => (i === tokenIndex ? progress : t)) };
  });
}

export function setRank(players: readonly PlayerState[], color: Color, rank: number): PlayerState[] {
  return players.map((p) => (p.color === color ? { ...p, rank } : p));
}

export function allHome(player: PlayerState): boolean {
  return player.tokens.length === TOKENS_PER_PLAYER && player.tokens.every((t) => t === FINISHED);
}

export function rankedCount(players: readonly PlayerState[]): number {
  return players.filter((p) => p.rank !== null).length;
}

// Next player clockwise after `after` who has not been ranked yet.
export function nextActiveColor(players: readonly PlayerState[], after: Color): Color {
  const start = players.findIndex((p) => p.color === after);
  for (let step = 1; step <= players.length; step++) {
    const candidate = players[(start + step) % players.length];
    if (candidate !== undefined && candidate.rank === null) return candidate.color;
  }
  throw new Error('no active player remains');
}

// Keeps seating order aligned with the clockwise COLORS constant.
export function sortClockwise(colors: readonly Color[]): Color[] {
  return COLORS.filter((c) => colors.includes(c));
}
