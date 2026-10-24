import { describe, expect, it } from 'vitest';
import { applyMove } from './applyMove';
import { roll } from './roll';
import { dieRng, scenario, turnPlayer } from './testSupport';

const finish = (color: 'red' | 'green' | 'yellow' | 'blue', tokenIndex: number) => ({
  type: 'moveToken' as const,
  color,
  tokenIndex,
});

describe('ranking and game end', () => {
  it('2 players: the first to finish ends the game and the other is ranked 2nd', () => {
    const state = scenario({ tokens: { red: [56, 56, 56, 55], green: [] }, die: 1 });
    const next = applyMove(state, finish('red', 3));
    expect(next.turn).toEqual({ phase: 'over' });
    expect(next.players.map((p) => p.rank)).toEqual([1, 2]);
    expect(next.events.at(-1)).toEqual({ type: 'gameOver', ranking: ['red', 'green'] });
  });

  it('3 players: the game continues after the first finish, and ends when two are ranked', () => {
    const afterFirst = applyMove(
      scenario({ tokens: { red: [56, 56, 56, 55], green: [], yellow: [] }, die: 1 }),
      finish('red', 3),
    );
    expect(afterFirst.turn).toEqual({ phase: 'roll', player: 'green', consecutiveSixes: 0 });
    expect(afterFirst.players[0]?.rank).toBe(1);

    const finished = applyMove(
      scenario({
        tokens: { red: [56, 56, 56, 56], green: [56, 56, 56, 55], yellow: [] },
        ranks: { red: 1 },
        player: 'green',
        die: 1,
      }),
      finish('green', 3),
    );
    expect(finished.turn).toEqual({ phase: 'over' });
    expect(finished.players.map((p) => [p.color, p.rank])).toEqual([
      ['red', 1],
      ['green', 2],
      ['yellow', 3],
    ]);
    expect(finished.events.at(-1)).toEqual({ type: 'gameOver', ranking: ['red', 'green', 'yellow'] });
  });

  it('4 players: the last seat is ranked 4th once three ranks are decided', () => {
    const next = applyMove(
      scenario({
        tokens: { red: [56, 56, 56, 56], green: [56, 56, 56, 56], yellow: [56, 56, 56, 55], blue: [] },
        ranks: { red: 1, green: 2 },
        player: 'yellow',
        die: 1,
      }),
      finish('yellow', 3),
    );
    expect(next.turn.phase).toBe('over');
    expect(next.players.map((p) => p.rank)).toEqual([1, 2, 3, 4]);
    expect(next.events).toContainEqual({ type: 'playerFinished', color: 'yellow', rank: 3 });
  });

  it('a ranked player gets no bonus roll even when finishing grants one', () => {
    const next = applyMove(
      scenario({ tokens: { red: [56, 56, 56, 55], green: [], yellow: [] }, die: 1 }),
      finish('red', 3),
    );
    expect(next.events.some((e) => e.type === 'extraRoll')).toBe(false);
    expect(turnPlayer(next)).toBe('green');
  });

  it('turns skip ranked players clockwise', () => {
    const base = scenario({
      tokens: { red: [56, 56, 56, 56], green: [], yellow: [], blue: [] },
      ranks: { red: 1 },
      phase: 'roll',
      player: 'yellow',
    });
    const toBlue = roll(base, dieRng(2));
    expect(turnPlayer(toBlue)).toBe('blue');
    const toGreen = roll(toBlue, dieRng(2));
    expect(turnPlayer(toGreen)).toBe('green');
  });
});
