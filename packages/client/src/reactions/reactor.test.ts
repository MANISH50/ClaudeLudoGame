import { describe, expect, it } from 'vitest';
import { createGame } from '@ludo/engine';
import type { RunnerSnapshot, Seat } from '../runner/GameRunner';
import { reactorColor } from './reactor';

function snapshotWith(seats: Seat[]): RunnerSnapshot {
  const state = createGame({ colors: seats.map((s) => s.color) });
  return { state, seats, canRoll: false, options: [] };
}

// Red rolls first in a new game (seats are sorted clockwise from Red).
describe('reactorColor', () => {
  it('attributes to the current seat when it is human', () => {
    const seats: Seat[] = [
      { color: 'red', name: 'A', control: { kind: 'human' } },
      { color: 'green', name: 'B', control: { kind: 'human' } },
    ];
    expect(reactorColor(snapshotWith(seats))).toBe('red');
  });

  it('falls back to the first human seat when the current seat is a bot', () => {
    const seats: Seat[] = [
      { color: 'red', name: 'Bot', control: { kind: 'bot', level: 'easy' } },
      { color: 'green', name: 'You', control: { kind: 'human' } },
    ];
    expect(reactorColor(snapshotWith(seats))).toBe('green');
  });

  it('returns null when every seat is a bot', () => {
    const seats: Seat[] = [
      { color: 'red', name: 'Bot A', control: { kind: 'bot', level: 'easy' } },
      { color: 'green', name: 'Bot B', control: { kind: 'bot', level: 'easy' } },
    ];
    expect(reactorColor(snapshotWith(seats))).toBeNull();
  });
});
