import { describe, expect, it } from 'vitest';
import { createGame } from '../createGame';
import { IllegalActionError } from '../errors';
import { legalMoves } from '../legalMoves';
import type { Move } from '../move';
import type { Rng } from '../rng';
import { scenario, seededRng } from '../testSupport';
import type { GameState } from '../state';
import type { BotLevel } from './botLevel';
import { pickBotMove } from './pickBotMove';

// Many seeds, so a priority test cannot pass only because of one lucky tie-break.
const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

function tokensPickedAcrossSeeds(state: GameState, level: BotLevel): number[] {
  return SEEDS.map((seed) => pickBotMove(state, level, seededRng(seed)).tokenIndex);
}

describe('pickBotMove contract', () => {
  it('throws IllegalActionError outside the move phase', () => {
    const state = createGame({ colors: ['red', 'green'] });
    expect(() => pickBotMove(state, 'easy', seededRng(1))).toThrow(IllegalActionError);
    expect(() => pickBotMove(state, 'medium', seededRng(1))).toThrow(IllegalActionError);
  });

  it('returns a member of legalMoves for both levels', () => {
    const state = scenario({ tokens: { red: [10, 20, -1, -1], blue: [5] }, phase: 'move', player: 'red', die: 3 });
    const legal: Move[] = legalMoves(state);
    for (const level of ['easy', 'medium'] as const) {
      for (const seed of SEEDS) {
        expect(legal).toContainEqual(pickBotMove(state, level, seededRng(seed)));
      }
    }
  });

  it('is deterministic for a given state and rng stream', () => {
    const state = scenario({ tokens: { red: [10, 20, -1, -1], blue: [5] }, phase: 'move', player: 'red', die: 3 });
    expect(pickBotMove(state, 'medium', seededRng(7))).toEqual(pickBotMove(state, 'medium', seededRng(7)));
  });
});

describe('Medium priorities (Spec 6)', () => {
  it('prefers finishing a token over other legal moves', () => {
    // Token 0 at progress 50 + six = 56 (home). Alternatives: advance token 1, or release a token.
    const state = scenario({ tokens: { red: [50, 10, -1, -1], blue: [] }, phase: 'move', player: 'red', die: 6 });
    expect(tokensPickedAcrossSeeds(state, 'medium').every((t) => t === 0)).toBe(true);
  });

  it('prefers a capture over a non-capture', () => {
    // Red token 0 moving 3 lands on track 3, where blue's token sits (blue progress 16).
    // Red token 1 moving 3 lands on an empty square.
    const state = scenario({ tokens: { red: [0, 20, -1, -1], blue: [16] }, phase: 'move', player: 'red', die: 3 });
    expect(tokensPickedAcrossSeeds(state, 'medium').every((t) => t === 0)).toBe(true);
  });

  it('prefers leaving base on a six over advancing a token', () => {
    // Token 1 at progress 30 would move to track 36; the bot should bring a base token out instead.
    // Any of the three base tokens is an equal choice, so the test allows all of them but not token 1.
    const state = scenario({ tokens: { red: [-1, 30, -1, -1], blue: [] }, phase: 'move', player: 'red', die: 6 });
    const baseTokens = [0, 2, 3];
    expect(tokensPickedAcrossSeeds(state, 'medium').every((t) => baseTokens.includes(t))).toBe(true);
  });

  it('breaks exact ties with rng rather than always taking the first token', () => {
    // Two identical-progress tokens give identical scores, so the choice depends only on rng.
    const state = scenario({ tokens: { red: [20, 20, -1, -1], blue: [] }, phase: 'move', player: 'red', die: 2 });
    expect(new Set(tokensPickedAcrossSeeds(state, 'medium'))).toEqual(new Set([0, 1]));
  });
});

describe('Easy', () => {
  it('draws roughly uniformly from legal moves', () => {
    const state = scenario({ tokens: { red: [10, 20, -1, -1], blue: [] }, phase: 'move', player: 'red', die: 4 });
    const counts = new Map<number, number>();
    const rng: Rng = seededRng(99);
    for (let i = 0; i < 2000; i++) {
      const t = pickBotMove(state, 'easy', rng).tokenIndex;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual([0, 1]);
    for (const c of counts.values()) expect(c).toBeGreaterThan(800);
  });
});
