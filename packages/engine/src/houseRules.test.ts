import { describe, expect, it } from 'vitest';
import { applyMove } from './applyMove';
import { DEFAULT_RULES } from './rules';
import { legalMoves } from './legalMoves';
import { scenario, turnPlayer } from './testSupport';

describe('house rule toggles', () => {
  it('defaults match Spec section 4 and its house-rule defaults', () => {
    expect(DEFAULT_RULES).toMatchObject({
      threeSixesForfeit: true,
      captureExtraRoll: true,
      exactFinish: true,
      homeExtraRoll: true,
      blocks: false,
      mustCapture: false,
      doubleSixRelease: false,
    });
  });

  it('home extra roll off: reaching the finish passes the turn', () => {
    const state = scenario({ tokens: { red: [54], green: [] }, die: 2, rules: { homeExtraRoll: false } });
    const next = applyMove(state, { type: 'moveToken', color: 'red', tokenIndex: 0 });
    expect(next.events.some((e) => e.type === 'extraRoll')).toBe(false);
    expect(turnPlayer(next)).toBe('green');
  });

  it('home extra roll on: a finish with a non-six die still grants the bonus', () => {
    const state = scenario({ tokens: { red: [54], green: [] }, die: 2 });
    const next = applyMove(state, { type: 'moveToken', color: 'red', tokenIndex: 0 });
    expect(next.events).toContainEqual({ type: 'extraRoll', color: 'red', reason: 'home' });
  });

  it('a six grants an extra roll even when every bonus toggle is off', () => {
    const state = scenario({
      tokens: { red: [10], green: [] },
      die: 6,
      rules: { captureExtraRoll: false, homeExtraRoll: false },
    });
    const next = applyMove(state, { type: 'moveToken', color: 'red', tokenIndex: 0 });
    expect(next.events).toContainEqual({ type: 'extraRoll', color: 'red', reason: 'six' });
  });

  it('exact finish off and on disagree only on overshooting moves', () => {
    // All four tokens sit at 52 so no base token can take the six instead.
    const tokens = { red: [52, 52, 52, 52], green: [] };
    const on = scenario({ tokens, die: 6 });
    const off = scenario({ tokens, die: 6, rules: { exactFinish: false } });
    expect(legalMoves(on)).toEqual([]);
    expect(legalMoves(off).map((m) => m.tokenIndex)).toEqual([0, 1, 2, 3]);
  });
});
