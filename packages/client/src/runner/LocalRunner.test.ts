import { describe, expect, it } from 'vitest';
import { COLORS, legalMoves, type Color, type GameState, type Move, type Rng } from '@ludo/engine';
import { LocalRunner } from './LocalRunner';
import type { Seat, RunnerSnapshot } from './GameRunner';
import type { Scheduler } from './scheduler';
import { BASE_PROGRESS } from './progress';

// Deterministic 32-bit generator so bot games replay exactly.
function seededRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Captures timers and fires them on demand, so the test controls the clock.
class FakeScheduler implements Scheduler {
  readonly delays: number[] = [];
  private nextId = 1;
  private readonly timers = new Map<number, () => void>();

  setTimeout(fn: () => void, ms: number): unknown {
    const id = this.nextId++;
    this.timers.set(id, fn);
    this.delays.push(ms);
    return id;
  }

  clearTimeout(handle: unknown): void {
    if (typeof handle === 'number') this.timers.delete(handle);
  }

  get pending(): number {
    return this.timers.size;
  }

  runNext(): boolean {
    const first = this.timers.entries().next();
    if (first.done) return false;
    const [id, fn] = first.value;
    this.timers.delete(id);
    fn();
    return true;
  }
}

function seat(color: Color, control: Seat['control']): Seat {
  return { color, name: color, control };
}

// Invariants the engine must keep, checked after every update the UI would see.
function assertValidState(state: GameState): void {
  for (const player of state.players) {
    expect(player.tokens).toHaveLength(4);
    for (const progress of player.tokens) {
      expect(progress).toBeGreaterThanOrEqual(BASE_PROGRESS);
      expect(progress).toBeLessThanOrEqual(56);
    }
  }
  const ranks = state.players.map((p) => p.rank).filter((r): r is number => r !== null);
  expect(new Set(ranks).size).toBe(ranks.length);
  if (state.turn.phase === 'over') {
    expect(state.players.every((p) => p.rank !== null)).toBe(true);
  }
}

function runBotGame(seed: number, seats: readonly Seat[]): { finalSnapshot: RunnerSnapshot; updates: number } {
  const scheduler = new FakeScheduler();
  const runner = new LocalRunner({ seats, rng: seededRng(seed), scheduler, thinkDelayMs: () => 600 });
  let updates = 0;
  runner.subscribe((snapshot) => {
    updates++;
    assertValidState(snapshot.state);
    expect(snapshot.state.events.length).toBeGreaterThan(0);
  });
  let guard = 0;
  while (runner.getSnapshot().state.turn.phase !== 'over') {
    if (++guard > 200_000) throw new Error('bot game did not finish');
    if (!scheduler.runNext()) throw new Error('bot game stalled with no timer pending');
  }
  runner.dispose();
  return { finalSnapshot: runner.getSnapshot(), updates };
}

describe('LocalRunner with bots', () => {
  it('finishes an all-bot game with valid state after every update', () => {
    for (const seed of [1, 7, 42]) {
      const seats = COLORS.map((color) => seat(color, { kind: 'bot', level: 'medium' }));
      const { finalSnapshot, updates } = runBotGame(seed, seats);
      expect(finalSnapshot.state.turn.phase).toBe('over');
      const ranked = finalSnapshot.state.players.map((p) => p.rank).sort();
      expect(ranked).toEqual([1, 2, 3, 4]);
      expect(updates).toBeGreaterThan(10);
    }
  });

  it('finishes a vs-bots game with easy bots', () => {
    const seats = [
      seat('red', { kind: 'human' }),
      seat('green', { kind: 'bot', level: 'easy' }),
      seat('yellow', { kind: 'bot', level: 'easy' }),
    ];
    const scheduler = new FakeScheduler();
    const runner = new LocalRunner({ seats, rng: seededRng(99), scheduler, thinkDelayMs: () => 600 });
    let guard = 0;
    while (runner.getSnapshot().state.turn.phase !== 'over') {
      if (++guard > 200_000) throw new Error('game did not finish');
      const snapshot = runner.getSnapshot();
      if (snapshot.canRoll) {
        runner.roll();
      } else if (snapshot.options.length > 0) {
        runner.move(snapshot.options[0]!.move);
      } else if (!scheduler.runNext()) {
        throw new Error('stalled');
      }
      assertValidState(runner.getSnapshot().state);
    }
    runner.dispose();
  });

  it('waits for the think delay before a bot acts, and the delay is 600 to 1200 ms by default', () => {
    const scheduler = new FakeScheduler();
    const seats = [seat('red', { kind: 'bot', level: 'easy' }), seat('green', { kind: 'human' })];
    const before = new LocalRunner({ seats, rng: seededRng(3), scheduler }).getSnapshot().state;
    expect(scheduler.delays).toHaveLength(1);
    const delay = scheduler.delays[0] ?? 0;
    expect(delay).toBeGreaterThanOrEqual(600);
    expect(delay).toBeLessThanOrEqual(1200);
    expect(before.turn.phase).toBe('roll');
  });
});

describe('LocalRunner human actions', () => {
  it('rejects a roll and a move from a human whose turn it is not', () => {
    const scheduler = new FakeScheduler();
    const seats = [seat('red', { kind: 'bot', level: 'easy' }), seat('green', { kind: 'human' })];
    const runner = new LocalRunner({ seats, rng: seededRng(5), scheduler, thinkDelayMs: () => 600 });
    const before = runner.getSnapshot().state;

    const roll = runner.roll();
    expect(roll.ok).toBe(false);
    expect(runner.getSnapshot().state).toBe(before);

    const move: Move = { type: 'moveToken', color: 'green', tokenIndex: 0 };
    const result = runner.move(move);
    expect(result.ok).toBe(false);
    expect(runner.getSnapshot().state).toBe(before);
    runner.dispose();
  });

  it('lets the human roll on their own turn and rejects a bot colour moving', () => {
    const scheduler = new FakeScheduler();
    const seats = [seat('red', { kind: 'human' }), seat('green', { kind: 'bot', level: 'easy' })];
    const runner = new LocalRunner({ seats, rng: seededRng(11), scheduler, thinkDelayMs: () => 600 });
    expect(runner.getSnapshot().canRoll).toBe(true);
    expect(runner.roll().ok).toBe(true);
    const snapshot = runner.getSnapshot();
    expect(snapshot.canRoll).toBe(false);
    const botMove: Move = { type: 'moveToken', color: 'green', tokenIndex: 0 };
    expect(runner.move(botMove).ok).toBe(false);
    runner.dispose();
  });

  // Scripted dice: a six, then a one. The six brings one token out and grants a bonus roll;
  // the one then leaves only that token able to move.
  function scriptedRng(values: readonly number[]): Rng {
    let i = 0;
    return () => values[i++] ?? 0;
  }

  it('rejects an illegal move from the human without changing state', () => {
    const scheduler = new FakeScheduler();
    const seats = [seat('red', { kind: 'human' }), seat('green', { kind: 'bot', level: 'easy' })];
    const runner = new LocalRunner({ seats, rng: scriptedRng([0.99, 0]), scheduler, thinkDelayMs: () => 600 });
    expect(runner.roll().ok).toBe(true);
    expect(runner.move({ type: 'moveToken', color: 'red', tokenIndex: 0 }).ok).toBe(true);
    expect(runner.getSnapshot().canRoll).toBe(true);
    expect(runner.roll().ok).toBe(true);

    const snapshot = runner.getSnapshot();
    expect(snapshot.state.turn.phase).toBe('move');
    expect(legalMoves(snapshot.state).map((m) => m.tokenIndex)).toEqual([0]);
    const before = snapshot.state;
    expect(runner.move({ type: 'moveToken', color: 'red', tokenIndex: 1 }).ok).toBe(false);
    expect(runner.getSnapshot().state).toBe(before);
    runner.dispose();
  });

  it('describes each option with its engine destination', () => {
    const scheduler = new FakeScheduler();
    const seats = [seat('red', { kind: 'human' }), seat('green', { kind: 'bot', level: 'easy' })];
    const runner = new LocalRunner({ seats, rng: scriptedRng([0.99]), scheduler, thinkDelayMs: () => 600 });
    expect(runner.roll().ok).toBe(true);
    const snapshot = runner.getSnapshot();
    // All four tokens are in base and a six is rolled, so each one lands on the red start square.
    expect(snapshot.options).toHaveLength(4);
    for (const option of snapshot.options) {
      expect(option.move.color).toBe('red');
      expect(option.to).toBe(0);
      expect(option.captures).toBe(false);
    }
    runner.dispose();
  });
});
