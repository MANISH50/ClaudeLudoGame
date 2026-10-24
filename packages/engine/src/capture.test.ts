import { describe, expect, it } from 'vitest';
import { applyMove } from './applyMove';
import { legalMoves } from './legalMoves';
import { scenario, turnPlayer } from './testSupport';

const move = (color: 'red' | 'green', tokenIndex: number) => ({ type: 'moveToken' as const, color, tokenIndex });

// Green progress 49 sits on track 10 (13 + 49 = 62, mod 52). Red progress 7 + 3 lands on track 10.
describe('capture', () => {
  it('sends a single opponent token back to base and grants an extra roll', () => {
    const state = scenario({ tokens: { red: [7], green: [49] }, die: 3 });
    const next = applyMove(state, move('red', 0));
    expect(next.players[1]?.tokens[0]).toBe(-1);
    expect(next.players[0]?.tokens[0]).toBe(10);
    expect(next.events).toContainEqual({
      type: 'captured',
      victim: 'green',
      victimTokenIndex: 0,
      by: 'red',
      square: 10,
    });
    expect(next.events).toContainEqual({ type: 'extraRoll', color: 'red', reason: 'capture' });
    expect(next.turn).toEqual({ phase: 'roll', player: 'red', consecutiveSixes: 0 });
  });

  it('does not grant an extra roll for a capture when the toggle is off', () => {
    const state = scenario({ tokens: { red: [7], green: [49] }, die: 3, rules: { captureExtraRoll: false } });
    const next = applyMove(state, move('red', 0));
    expect(next.players[1]?.tokens[0]).toBe(-1);
    expect(next.events.some((e) => e.type === 'extraRoll')).toBe(false);
    expect(turnPlayer(next)).toBe('green');
  });

  it('passing over an opponent does not capture it', () => {
    // Green progress 45 is track 6, which red passes on the way to safe track 8.
    const state = scenario({ tokens: { red: [4], green: [45] }, die: 4 });
    const next = applyMove(state, move('red', 0));
    expect(next.players[1]?.tokens[0]).toBe(45);
    expect(next.events.some((e) => e.type === 'captured')).toBe(false);
  });
});

describe('safe squares', () => {
  // Green progress 47 is track 8, a star square.
  it('an opponent cannot be captured on a safe square', () => {
    const state = scenario({ tokens: { red: [5], green: [47] }, die: 3 });
    const next = applyMove(state, move('red', 0));
    expect(next.players[1]?.tokens[0]).toBe(47);
    expect(next.players[0]?.tokens[0]).toBe(8);
    expect(next.events.some((e) => e.type === 'captured')).toBe(false);
    expect(turnPlayer(next)).toBe('green');
  });

  // Green progress 0 is track 13, Green's own start square.
  it('any colours may share a safe square and neither is captured', () => {
    const state = scenario({ tokens: { red: [10], green: [0] }, die: 3 });
    const next = applyMove(state, move('red', 0));
    expect(next.players[0]?.tokens[0]).toBe(13);
    expect(next.players[1]?.tokens[0]).toBe(0);
    expect(next.events.some((e) => e.type === 'captured')).toBe(false);
  });

  it('a token can leave base onto its start square even when an opponent is there', () => {
    const state = scenario({ tokens: { red: [], green: [39] }, die: 6, player: 'red' });
    // Track 0 is red's start; green progress 39 sits there.
    expect(legalMoves(state)).toHaveLength(4);
    const next = applyMove(state, move('red', 0));
    expect(next.players[1]?.tokens[0]).toBe(39);
  });
});

describe('blocks (house rule, default off)', () => {
  it('off: landing on a non-safe square with two opponents captures both', () => {
    const state = scenario({ tokens: { red: [7], green: [49, 49] }, die: 3 });
    const next = applyMove(state, move('red', 0));
    expect(next.players[1]?.tokens.slice(0, 2)).toEqual([-1, -1]);
    expect(next.events.filter((e) => e.type === 'captured')).toHaveLength(2);
  });

  it('on: two same-colour tokens cannot be landed on', () => {
    const state = scenario({ tokens: { red: [7], green: [49, 49] }, die: 3, rules: { blocks: true } });
    expect(legalMoves(state)).toEqual([]);
  });

  it('on: two same-colour tokens cannot be passed', () => {
    // Every red token sits at 5 so no base token can take the six instead.
    const state = scenario({ tokens: { red: [5, 5, 5, 5], green: [49, 49] }, die: 6, rules: { blocks: true } });
    expect(legalMoves(state)).toEqual([]);
  });

  it('on: a single opponent is still capturable', () => {
    const state = scenario({ tokens: { red: [7], green: [49, 0] }, die: 3, rules: { blocks: true } });
    const next = applyMove(state, move('red', 0));
    expect(next.players[1]?.tokens[0]).toBe(-1);
    expect(next.players[1]?.tokens[1]).toBe(0);
  });

  it('on: a blockade on the start square stops leaving base', () => {
    // Green progress 39 is track 0, red's start square.
    const state = scenario({ tokens: { red: [], green: [39, 39] }, die: 6, player: 'red', rules: { blocks: true } });
    expect(legalMoves(state)).toEqual([]);
  });

  it('on: own colour never blocks itself', () => {
    const state = scenario({ tokens: { red: [7, 7], green: [] }, die: 3, rules: { blocks: true } });
    expect(legalMoves(state)).toHaveLength(2);
  });
});

describe('must capture (house rule, default off)', () => {
  it('when a capture exists, only capturing moves are legal', () => {
    // Red token 0 captures green at track 10; token 1 has no capture.
    const state = scenario({ tokens: { red: [7, 20], green: [49] }, die: 3, rules: { mustCapture: true } });
    expect(legalMoves(state)).toEqual([move('red', 0)]);
  });

  it('when no capture exists, all normal moves stay legal', () => {
    const state = scenario({ tokens: { red: [7, 20], green: [] }, die: 3, rules: { mustCapture: true } });
    expect(legalMoves(state)).toHaveLength(2);
  });

  it('off: the non-capturing move is still legal alongside the capture', () => {
    const state = scenario({ tokens: { red: [7, 20], green: [49] }, die: 3 });
    expect(legalMoves(state)).toHaveLength(2);
  });
});
