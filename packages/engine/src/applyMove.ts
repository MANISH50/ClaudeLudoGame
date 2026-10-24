import { BASE, FINISHED } from './boardGeometry';
import type { Color } from './color';
import { IllegalActionError } from './errors';
import type { ExtraRollReason, GameEvent } from './events';
import { legalPlans } from './legalMoves';
import type { Move } from './move';
import type { Rules } from './rules';
import { allHome, findPlayer, rankedCount, setRank, setToken } from './players';
import type { Die, GameState, PlayerState } from './state';
import { passTurn } from './turnFlow';

export function applyMove(state: GameState, move: Move): GameState {
  const turn = state.turn;
  if (turn.phase !== 'move') throw new IllegalActionError('no move is pending');
  const plan = legalPlans(state).find((p) => p.color === move.color && p.tokenIndex === move.tokenIndex);
  if (plan === undefined) {
    throw new IllegalActionError(`move is not legal: ${move.color} token ${move.tokenIndex}`);
  }
  const mover = plan.color;

  const events: GameEvent[] = [
    { type: 'moved', color: mover, tokenIndex: plan.tokenIndex, from: plan.from, to: plan.to },
  ];
  let players = setToken(state.players, mover, plan.tokenIndex, plan.to);

  if (plan.capture !== null) {
    for (const victim of plan.capture.victims) {
      players = setToken(players, victim.color, victim.tokenIndex, BASE);
      events.push({
        type: 'captured',
        victim: victim.color,
        victimTokenIndex: victim.tokenIndex,
        by: mover,
        square: plan.capture.square,
      });
    }
  }

  const reachedHome = plan.to === FINISHED;
  if (reachedHome) events.push({ type: 'reachedHome', color: mover, tokenIndex: plan.tokenIndex });

  const moverState = findPlayer(players, mover);
  if (allHome(moverState) && moverState.rank === null) {
    const rank = rankedCount(players) + 1;
    players = setRank(players, mover, rank);
    events.push({ type: 'playerFinished', color: mover, rank });
  }

  // The game ends once N-1 ranks are decided; the last unranked player is ranked last.
  const unranked = players.filter((p) => p.rank === null);
  if (unranked.length <= 1) {
    for (const p of unranked) players = setRank(players, p.color, players.length);
    events.push({ type: 'gameOver', ranking: rankingOf(players) });
    return { ...state, players, turn: { phase: 'over' }, events };
  }

  const reason = extraRollReason(state.rules, turn.die, plan.capture !== null, reachedHome);
  if (reason !== null && findPlayer(players, mover).rank === null) {
    events.push({ type: 'extraRoll', color: mover, reason });
    return {
      ...state,
      players,
      turn: { phase: 'roll', player: mover, consecutiveSixes: turn.consecutiveSixes },
      events,
    };
  }
  return passTurn({ ...state, players }, mover, events);
}

// Spec 4.6 and 4.8: six, capture, and reaching home each grant one extra roll; they do not stack.
function extraRollReason(
  rules: Rules,
  die: Die,
  captured: boolean,
  reachedHome: boolean,
): ExtraRollReason | null {
  if (die === 6) return 'six';
  if (captured && rules.captureExtraRoll) return 'capture';
  if (reachedHome && rules.homeExtraRoll) return 'home';
  return null;
}

function rankingOf(players: readonly PlayerState[]): Color[] {
  return players
    .filter((p): p is PlayerState & { rank: number } => p.rank !== null)
    .sort((a, b) => a.rank - b.rank)
    .map((p) => p.color);
}
