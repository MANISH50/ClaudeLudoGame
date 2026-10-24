import { describe, expect, it } from 'vitest';
import { applyMove } from './applyMove';
import { IllegalActionError } from './errors';
import { legalMoves } from './legalMoves';
import { scenario, turnPlayer } from './testSupport';

const move = (color: 'red' | 'green', tokenIndex: number) => ({ type: 'moveToken' as const, color, tokenIndex });

describe('movement along the track', () => {
  it('advances a token by the die value', () => {
    const state = scenario({ tokens: { red: [10] }, die: 3 });
    const next = applyMove(state, move('red', 0));
    expect(next.players[0]?.tokens).toEqual([13, -1, -1, -1]);
    expect(next.events[0]).toEqual({ type: 'moved', color: 'red', tokenIndex: 0, from: 10, to: 13 });
  });

  it('lets two of the same colour share a square', () => {
    const state = scenario({ tokens: { red: [7, 7] }, die: 3 });
    const next = applyMove(state, move('red', 0));
    expect(next.players[0]?.tokens).toEqual([10, 7, -1, -1]);
    expect(next.events.some((e) => e.type === 'captured')).toBe(false);
  });

  it('rejects a move for a token that is not legal with the current die', () => {
    const state = scenario({ tokens: { red: [-1] }, die: 3 });
    expect(legalMoves(state)).toEqual([]);
    expect(() => applyMove(state, move('red', 0))).toThrow(IllegalActionError);
  });

  it('rejects applyMove during the roll phase', () => {
    const state = scenario({ tokens: { red: [10] }, phase: 'roll' });
    expect(() => applyMove(state, move('red', 0))).toThrow(IllegalActionError);
  });

  it('rejects a move for a colour that is not on turn', () => {
    const state = scenario({ tokens: { red: [10], green: [10] }, die: 3, player: 'red' });
    expect(() => applyMove(state, move('green', 0))).toThrow(IllegalActionError);
  });
});

describe('leaving base', () => {
  it('only a six can leave base', () => {
    for (const die of [1, 2, 3, 4, 5] as const) {
      expect(legalMoves(scenario({ tokens: { red: [] }, die }))).toEqual([]);
    }
    expect(legalMoves(scenario({ tokens: { red: [] }, die: 6 }))).toHaveLength(4);
  });

  it('places the token on its own start square (progress 0)', () => {
    const next = applyMove(scenario({ tokens: { green: [] }, die: 6, player: 'green' }), move('green', 1));
    expect(next.players[0]?.tokens[1]).toBe(0);
  });
});

describe('exact finish (toggle on by default)', () => {
  it('requires the exact roll to reach the final square', () => {
    const state = scenario({ tokens: { red: [53] }, die: 3 });
    expect(legalMoves(state)).toHaveLength(1);
    const next = applyMove(state, move('red', 0));
    expect(next.players[0]?.tokens[0]).toBe(56);
  });

  it('makes an overshooting roll illegal', () => {
    const state = scenario({ tokens: { red: [53] }, die: 4 });
    expect(legalMoves(state)).toEqual([]);
  });
});

describe('exact finish off (Spec 4.8)', () => {
  it('lets an overshooting token stop at the finish square', () => {
    // Base tokens could take a six, so all four sit at 53 to isolate the overshoot.
    const state = scenario({ tokens: { red: [53, 53, 53, 53], green: [] }, die: 6, rules: { exactFinish: false } });
    expect(legalMoves(state)).toHaveLength(4);
    const next = applyMove(state, move('red', 0));
    expect(next.players[0]?.tokens[0]).toBe(56);
  });
});

describe('reaching home', () => {
  it('reaching the finish grants an extra roll (toggle on by default)', () => {
    const state = scenario({ tokens: { red: [54], green: [] }, die: 2 });
    const next = applyMove(state, move('red', 0));
    expect(next.events).toContainEqual({ type: 'reachedHome', color: 'red', tokenIndex: 0 });
    expect(next.events).toContainEqual({ type: 'extraRoll', color: 'red', reason: 'home' });
    expect(next.turn).toEqual({ phase: 'roll', player: 'red', consecutiveSixes: 0 });
  });

  it('entering the home column alone is not a home bonus', () => {
    const state = scenario({ tokens: { red: [50], green: [] }, die: 2 });
    const next = applyMove(state, move('red', 0));
    expect(next.events.some((e) => e.type === 'extraRoll')).toBe(false);
    expect(next.turn.phase).toBe('roll');
    expect(turnPlayer(next)).toBe('green');
  });
});
