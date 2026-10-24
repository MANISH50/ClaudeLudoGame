import { describe, expect, it } from 'vitest';
import { applyMove } from './applyMove';
import { createGame } from './createGame';
import { isSafeTrackIndex } from './boardGeometry';
import type { Color } from './color';
import type { GameEvent } from './events';
import { legalMoves } from './legalMoves';
import type { Rules } from './rules';
import { roll } from './roll';
import { assertValidState, seededRng } from './testSupport';

// The lib setup has no DOM or Node typings. Only the timer global is needed, and it exists in every runtime.
declare function setTimeout(callback: () => void, ms?: number): unknown;
import type { GameState } from './state';

// Spec section 9 requires 10,000 random games. Each config test stays well under its timeout.
const TOTAL_GAMES = 10_000;
// Yield to the event loop periodically so the vitest worker can answer its RPC calls.
const YIELD_EVERY_GAMES = 25;
// Generous bound: a random game should end well inside this. Hitting it means a stuck loop.
const MAX_STEPS = 50_000;

const ALL_ON: Rules = {
  threeSixesForfeit: true,
  captureExtraRoll: true,
  exactFinish: true,
  homeExtraRoll: true,
  blocks: true,
  mustCapture: true,
  doubleSixRelease: true,
};

const STANDARD_OFF: Rules = {
  threeSixesForfeit: false,
  captureExtraRoll: false,
  exactFinish: false,
  homeExtraRoll: false,
  blocks: false,
  mustCapture: false,
  doubleSixRelease: false,
};

const RULE_SETS: readonly Partial<Rules>[] = [{}, ALL_ON, STANDARD_OFF, { blocks: true, mustCapture: true }];
const PLAYER_COUNTS = [2, 3, 4] as const;
const COLOUR_ORDER: readonly Color[] = ['red', 'green', 'yellow', 'blue'];

interface Tally {
  captures: number;
  forfeits: number;
  releases: number;
  extraRolls: number;
}

// Sanity counts: if the random play never reaches these rules, the fuzz proves less than it claims.
function playGame(seat: number, seed: number, tally: Tally): void {
  const playerCount = PLAYER_COUNTS[seat % PLAYER_COUNTS.length] ?? 2;
  const rules = RULE_SETS[Math.floor(seat / PLAYER_COUNTS.length) % RULE_SETS.length] ?? {};
  let state: GameState = createGame({ colors: COLOUR_ORDER.slice(0, playerCount), rules });
  const rng = seededRng(seed);

  for (let step = 0; step < MAX_STEPS; step++) {
    assertValidState(state);
    if (state.turn.phase === 'over') return;

    if (state.turn.phase === 'roll') {
      state = roll(state, rng);
    } else {
      const moves = legalMoves(state);
      const pick = moves[Math.floor(rng() * moves.length)];
      if (pick === undefined) throw new Error('move phase reached with no legal move');
      state = applyMove(state, pick);
    }
    for (const event of state.events) tallyEvent(event, tally);
  }
  throw new Error(`game with seed ${seed} did not terminate in ${MAX_STEPS} steps`);
}

function tallyEvent(event: GameEvent, tally: Tally): void {
  switch (event.type) {
    case 'captured':
      // The engine must never capture on a safe square (Spec 4.7), and never capture your own colour.
      if (isSafeTrackIndex(event.square)) throw new Error(`capture on safe square ${event.square}`);
      if (event.victim === event.by) throw new Error('a token captured its own colour');
      tally.captures++;
      return;
    case 'forfeited':
      tally.forfeits++;
      return;
    case 'released':
      tally.releases++;
      return;
    case 'extraRoll':
      tally.extraRolls++;
      return;
    default:
      return;
  }
}

// One test per configuration keeps each synchronous block short enough for the worker RPC.
const CONFIGS = PLAYER_COUNTS.length * RULE_SETS.length;
// Spread the total evenly; the first (TOTAL % CONFIGS) configs take one extra game.
const gamesFor = (seat: number): number => Math.floor(TOTAL_GAMES / CONFIGS) + (seat < TOTAL_GAMES % CONFIGS ? 1 : 0);

describe('fuzz: seeded random games', () => {
  for (let seat = 0; seat < CONFIGS; seat++) {
    it(
      `config ${seat}: ${gamesFor(seat)} games terminate with valid state at every step`,
      async () => {
        const tally: Tally = { captures: 0, forfeits: 0, releases: 0, extraRolls: 0 };
        for (let g = 0; g < gamesFor(seat); g++) {
          // Seeds are unique across configs so no two games replay the same dice.
          playGame(seat, seat * 1000 + g + 1, tally);
          if (g % YIELD_EVERY_GAMES === 0) await new Promise<void>((resolve) => setTimeout(() => resolve(), 0));
        }
        // Coverage sanity: random play must actually reach the rules being fuzzed.
        expect(tally.extraRolls).toBeGreaterThan(0);
        expect(tally.captures + tally.forfeits + tally.releases).toBeGreaterThan(0);
      },
      120_000,
    );
  }
});
