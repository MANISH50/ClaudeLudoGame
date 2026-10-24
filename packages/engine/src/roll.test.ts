import { describe, expect, it } from 'vitest';
import { applyMove } from './applyMove';
import { createGame } from './createGame';
import { IllegalActionError } from './errors';
import { legalMoves } from './legalMoves';
import { roll } from './roll';
import { dieRng, scenario } from './testSupport';

describe('roll: leaving base', () => {
  it('a six brings a token out of base onto its start square and grants an extra roll', () => {
    const start = scenario({ tokens: { red: [], green: [] }, phase: 'roll', player: 'red' });
    const rolled = roll(start, dieRng(6));
    expect(rolled.turn).toEqual({ phase: 'move', player: 'red', die: 6, consecutiveSixes: 1 });
    expect(legalMoves(rolled)).toHaveLength(4);

    const after = applyMove(rolled, { type: 'moveToken', color: 'red', tokenIndex: 2 });
    expect(after.players[0]?.tokens).toEqual([-1, -1, 0, -1]);
    expect(after.turn).toEqual({ phase: 'roll', player: 'red', consecutiveSixes: 1 });
    expect(after.events).toContainEqual({ type: 'extraRoll', color: 'red', reason: 'six' });
  });

  it('a non-six with every token in base passes the turn', () => {
    const start = scenario({ tokens: { red: [], green: [] }, phase: 'roll', player: 'red' });
    const passed = roll(start, dieRng(5));
    expect(passed.turn).toEqual({ phase: 'roll', player: 'green', consecutiveSixes: 0 });
    expect(passed.events).toEqual([
      { type: 'rolled', color: 'red', value: 5 },
      { type: 'passed', color: 'red', reason: 'no-legal-move' },
      { type: 'turnStarted', color: 'green' },
    ]);
  });
});

describe('roll: turn order', () => {
  it('passes clockwise through all four seats when nothing can move', () => {
    let state = createGame({ colors: ['yellow', 'red', 'blue', 'green'] });
    const order: string[] = [];
    for (let i = 0; i < 4; i++) {
      order.push(state.turn.phase === 'roll' ? state.turn.player : '?');
      state = roll(state, dieRng(2));
    }
    expect(order).toEqual(['red', 'green', 'yellow', 'blue']);
  });

  it('refuses to roll while a move is pending', () => {
    const pending = scenario({ tokens: { red: [5] }, phase: 'move', die: 3 });
    expect(() => roll(pending, dieRng(4))).toThrow(IllegalActionError);
  });
});

describe('roll: three sixes', () => {
  it('forfeits the third consecutive six even when a move exists', () => {
    const start = scenario({ tokens: { red: [10], green: [] }, phase: 'roll', player: 'red', consecutiveSixes: 2 });
    const forfeited = roll(start, dieRng(6));
    expect(forfeited.players[0]?.tokens).toEqual([10, -1, -1, -1]);
    expect(forfeited.turn).toEqual({ phase: 'roll', player: 'green', consecutiveSixes: 0 });
    expect(forfeited.events).toContainEqual({ type: 'forfeited', color: 'red', reason: 'three-sixes' });
  });

  it('plays the third six normally when the toggle is off', () => {
    const start = scenario({
      tokens: { red: [10], green: [] },
      phase: 'roll',
      player: 'red',
      consecutiveSixes: 2,
      rules: { threeSixesForfeit: false },
    });
    const rolled = roll(start, dieRng(6));
    expect(rolled.turn).toMatchObject({ phase: 'move', player: 'red', die: 6, consecutiveSixes: 3 });
  });

  it('resets the streak after a non-six', () => {
    const start = scenario({ tokens: { red: [10], green: [] }, phase: 'roll', player: 'red', consecutiveSixes: 2 });
    const ok = roll(start, dieRng(3));
    expect(ok.turn).toMatchObject({ phase: 'move', die: 3, consecutiveSixes: 0 });
  });

  it('counts sixes across the bonus roll chain', () => {
    const start = scenario({ tokens: { red: [10], green: [] }, phase: 'roll', player: 'red' });
    const first = roll(start, dieRng(6));
    expect(first.turn).toMatchObject({ consecutiveSixes: 1 });
    const moved = applyMove(first, { type: 'moveToken', color: 'red', tokenIndex: 0 });
    const second = roll(moved, dieRng(6));
    expect(second.turn).toMatchObject({ phase: 'move', consecutiveSixes: 2 });
  });
});

describe('roll: no legal move auto-pass (Spec 4.9)', () => {
  it('passes the turn even after a six when nothing can move', () => {
    // Exact finish on: a token at 53 cannot use a six (would overshoot 56).
    const start = scenario({ tokens: { red: [53, 53, 53, 53], green: [] }, phase: 'roll', player: 'red' });
    const passed = roll(start, dieRng(6));
    expect(passed.turn).toEqual({ phase: 'roll', player: 'green', consecutiveSixes: 0 });
    expect(passed.events.map((e) => e.type)).toEqual(['rolled', 'passed', 'turnStarted']);
  });
});

describe('roll: double-six release (house rule)', () => {
  it('releases one base token on the second consecutive six', () => {
    const start = scenario({
      tokens: { red: [-1, -1, -1, 5], green: [] },
      phase: 'roll',
      player: 'red',
      rules: { doubleSixRelease: true },
    });
    const first = roll(start, dieRng(6));
    const moved = applyMove(first, { type: 'moveToken', color: 'red', tokenIndex: 3 });
    expect(moved.players[0]?.tokens).toEqual([-1, -1, -1, 11]);

    const second = roll(moved, dieRng(6));
    expect(second.players[0]?.tokens).toEqual([0, -1, -1, 11]);
    expect(second.events).toContainEqual({ type: 'released', color: 'red', tokenIndex: 0 });
    expect(second.turn).toMatchObject({ phase: 'move', consecutiveSixes: 2 });
  });

  it('does nothing on the second six when the toggle is off', () => {
    const start = scenario({
      tokens: { red: [-1, -1, -1, 11], green: [] },
      phase: 'roll',
      player: 'red',
      consecutiveSixes: 1,
    });
    const rolled = roll(start, dieRng(6));
    expect(rolled.players[0]?.tokens).toEqual([-1, -1, -1, 11]);
    expect(rolled.events.some((e) => e.type === 'released')).toBe(false);
  });

  it('is skipped when an opponent blockade sits on the start square (blocks on)', () => {
    // Green progress 39 is track 0, which is Red's start square.
    const start = scenario({
      tokens: { red: [-1, -1, -1, 5], green: [39, 39] },
      phase: 'roll',
      player: 'red',
      consecutiveSixes: 1,
      rules: { doubleSixRelease: true, blocks: true },
    });
    const rolled = roll(start, dieRng(6));
    expect(rolled.players[0]?.tokens).toEqual([-1, -1, -1, 5]);
    expect(rolled.events.some((e) => e.type === 'released')).toBe(false);
  });
});
