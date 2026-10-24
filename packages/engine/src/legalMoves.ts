import { TOKENS_PER_PLAYER } from './boardGeometry';
import type { Move } from './move';
import type { MovePlan } from './movePlan';
import { planMove } from './movePlan';
import type { GameState } from './state';

// Shared by legalMoves and applyMove so the two can never disagree.
export function legalPlans(state: GameState): MovePlan[] {
  const turn = state.turn;
  if (turn.phase !== 'move') return [];
  const plans: MovePlan[] = [];
  for (let tokenIndex = 0; tokenIndex < TOKENS_PER_PLAYER; tokenIndex++) {
    const plan = planMove(state, turn.player, tokenIndex, turn.die);
    if (plan !== null) plans.push(plan);
  }
  // Must-capture narrows the list only when a capture exists; otherwise nothing changes.
  if (state.rules.mustCapture && plans.some((p) => p.capture !== null)) {
    return plans.filter((p) => p.capture !== null);
  }
  return plans;
}

export function legalMoves(state: GameState): Move[] {
  return legalPlans(state).map((p) => ({ type: 'moveToken', color: p.color, tokenIndex: p.tokenIndex }));
}
