// Test-only helpers. Not re-exported from index.ts.
import { BASE, FINISHED, LAST_TRACK_PROGRESS, TOKENS_PER_PLAYER, isSafeTrackIndex, trackIndex } from './boardGeometry';
import { COLORS, type Color } from './color';
import { resolveRules, type Rules } from './rules';
import { sortClockwise, allHome } from './players';
import type { Rng } from './rng';
import type { Die, GameState, PlayerState } from './state';

// Mid-point of the die's bucket, so floor(r * 6) + 1 yields exactly `value`.
export function dieRng(value: Die): Rng {
  return () => (value - 1 + 0.5) / 6;
}

export function sequenceRng(values: readonly Die[]): Rng {
  let i = 0;
  return () => {
    const value = values[i++];
    if (value === undefined) throw new Error('rng script exhausted');
    return (value - 1 + 0.5) / 6;
  };
}

// mulberry32: small, deterministic, and gives values in [0, 1).
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ScenarioOptions {
  readonly tokens: Partial<Record<Color, readonly number[]>>;
  readonly ranks?: Partial<Record<Color, number>>;
  readonly phase?: 'roll' | 'move';
  readonly player?: Color;
  readonly die?: Die;
  readonly consecutiveSixes?: number;
  readonly rules?: Partial<Rules>;
}

// Builds a state directly, bypassing createGame, so a single rule can be set up in isolation.
export function scenario(options: ScenarioOptions): GameState {
  const colors = sortClockwise(COLORS.filter((c) => options.tokens[c] !== undefined));
  const players: PlayerState[] = colors.map((color) => {
    const raw = options.tokens[color] ?? [];
    const tokens = Array.from({ length: TOKENS_PER_PLAYER }, (_, i) => raw[i] ?? BASE);
    return { color, tokens, rank: options.ranks?.[color] ?? null };
  });
  const player = options.player ?? colors[0];
  if (player === undefined) throw new Error('scenario needs at least one player');
  const consecutiveSixes = options.consecutiveSixes ?? 0;
  const turn =
    options.phase === 'roll'
      ? { phase: 'roll' as const, player, consecutiveSixes }
      : { phase: 'move' as const, player, die: options.die ?? 1, consecutiveSixes };
  return { rules: resolveRules(options.rules), players, turn, events: [] };
}

// Undefined-safe accessor: the turn union only carries a player while the game runs.
export function turnPlayer(state: GameState): Color | null {
  return state.turn.phase === 'over' ? null : state.turn.player;
}

// Throws on any invariant break. Used by the fuzz test after every step.
export function assertValidState(state: GameState): void {
  const n = state.players.length;
  if (n < 2 || n > 4) throw new Error(`bad player count ${n}`);

  const occupied = new Map<number, Set<Color>>();
  for (const p of state.players) {
    if (p.tokens.length !== TOKENS_PER_PLAYER) throw new Error(`${p.color} has ${p.tokens.length} tokens`);
    for (const progress of p.tokens) {
      if (!Number.isInteger(progress) || progress < BASE || progress > FINISHED) {
        throw new Error(`${p.color} progress out of range: ${progress}`);
      }
      if (progress >= 0 && progress <= LAST_TRACK_PROGRESS) {
        const index = trackIndex(p.color, progress);
        const set = occupied.get(index) ?? new Set<Color>();
        set.add(p.color);
        occupied.set(index, set);
      }
    }
    if (p.rank !== null && p.rank !== n && !allHome(p)) throw new Error(`${p.color} ranked without finishing`);
    if (p.rank === null && allHome(p)) throw new Error(`${p.color} is home but unranked`);
  }
  // Only safe squares may hold tokens of two colours at once.
  for (const [index, set] of occupied) {
    if (!isSafeTrackIndex(index) && set.size > 1) throw new Error(`mixed colours on unsafe square ${index}`);
  }

  const ranks = state.players.flatMap((p) => (p.rank === null ? [] : [p.rank]));
  const unique = new Set(ranks);
  if (unique.size !== ranks.length) throw new Error('duplicate rank');
  for (let r = 1; r <= ranks.length; r++) {
    if (!unique.has(r)) throw new Error(`rank ${r} missing`);
  }

  const unranked = state.players.filter((p) => p.rank === null).length;
  if (state.turn.phase === 'over') {
    if (unranked !== 0) throw new Error('game over with unranked players');
    return;
  }
  if (unranked < 2) throw new Error('game still running with fewer than two active players');

  const turnColor = turnPlayer(state);
  const active = state.players.find((p) => p.color === turnColor);
  if (active === undefined || active.rank !== null) throw new Error('turn belongs to a ranked player');
  // With the three-sixes rule on, a streak of three never survives into a stored state.
  if (state.rules.threeSixesForfeit && state.turn.consecutiveSixes > 2) {
    throw new Error('consecutive sixes exceeded the forfeit limit');
  }
}
