import { describe, expect, it } from 'vitest';
import { createGame } from './createGame';
import { DEFAULT_RULES } from './rules';

describe('createGame', () => {
  it('seats players clockwise regardless of input order', () => {
    const game = createGame({ colors: ['blue', 'red', 'yellow'] });
    expect(game.players.map((p) => p.color)).toEqual(['red', 'yellow', 'blue']);
  });

  it('starts every token in base, unranked, with Red-first roll phase', () => {
    const game = createGame({ colors: ['red', 'green'] });
    expect(game.players).toEqual([
      { color: 'red', tokens: [-1, -1, -1, -1], rank: null },
      { color: 'green', tokens: [-1, -1, -1, -1], rank: null },
    ]);
    expect(game.turn).toEqual({ phase: 'roll', player: 'red', consecutiveSixes: 0 });
    expect(game.events).toEqual([{ type: 'turnStarted', color: 'red' }]);
  });

  it('uses the Spec default toggles when no rules are given', () => {
    const game = createGame({ colors: ['red', 'green'] });
    expect(game.rules).toEqual(DEFAULT_RULES);
    expect(DEFAULT_RULES).toEqual({
      threeSixesForfeit: true,
      captureExtraRoll: true,
      exactFinish: true,
      homeExtraRoll: true,
      blocks: false,
      mustCapture: false,
      doubleSixRelease: false,
    });
  });

  it('applies partial rule overrides on top of the defaults', () => {
    const game = createGame({ colors: ['red', 'green'], rules: { blocks: true, exactFinish: false } });
    expect(game.rules.blocks).toBe(true);
    expect(game.rules.exactFinish).toBe(false);
    expect(game.rules.threeSixesForfeit).toBe(true);
  });

  it('rejects fewer than 2 or more than 4 players', () => {
    expect(() => createGame({ colors: ['red'] })).toThrow(RangeError);
    expect(() => createGame({ colors: [] })).toThrow(RangeError);
    expect(() => createGame({ colors: ['red', 'green', 'yellow', 'blue', 'red'] })).toThrow(RangeError);
  });

  it('rejects duplicate colours', () => {
    expect(() => createGame({ colors: ['red', 'red'] })).toThrow(RangeError);
  });
});
