import { BASE, START_INDEX } from './boardGeometry';
import type { Color } from './color';
import type { GameEvent } from './events';
import { IllegalActionError } from './errors';
import { legalPlans } from './legalMoves';
import { hasOpponentBlockade } from './occupancy';
import { findPlayer, setToken } from './players';
import type { GameState, PlayerState } from './state';
import { rollDie, type Rng } from './rng';
import { passTurn } from './turnFlow';

export function roll(state: GameState, rng: Rng): GameState {
  const turn = state.turn;
  if (turn.phase !== 'roll') throw new IllegalActionError('dice are not due');
  const player = turn.player;
  const value = rollDie(rng);
  const sixes = value === 6 ? turn.consecutiveSixes + 1 : 0;
  const events: GameEvent[] = [{ type: 'rolled', color: player, value }];

  // Third six is forfeited even when moves exist (Spec 4.4); the roll is still shown.
  if (value === 6 && state.rules.threeSixesForfeit && sixes >= 3) {
    events.push({ type: 'forfeited', color: player, reason: 'three-sixes' });
    return passTurn(state, player, events);
  }

  let players: readonly PlayerState[] = state.players;
  // Double-six release: the second consecutive six brings one token out of base
  // before the normal move choice. Skipped if an opponent blockade sits on the start.
  if (value === 6 && state.rules.doubleSixRelease && sixes === 2) {
    const released = releaseOneFromBase(state, player);
    if (released !== null) {
      players = released.players;
      events.push({ type: 'released', color: player, tokenIndex: released.tokenIndex });
    }
  }

  const pending: GameState = {
    ...state,
    players,
    turn: { phase: 'move', player, die: value, consecutiveSixes: sixes },
    events,
  };
  // Spec 4.9: no legal move passes the turn, even after a six.
  if (legalPlans(pending).length === 0) {
    events.push({ type: 'passed', color: player, reason: 'no-legal-move' });
    return passTurn(pending, player, events);
  }
  return pending;
}

function releaseOneFromBase(
  state: GameState,
  color: Color,
): { players: readonly PlayerState[]; tokenIndex: number } | null {
  const tokenIndex = findPlayer(state.players, color).tokens.indexOf(BASE);
  if (tokenIndex < 0) return null;
  const start = START_INDEX[color];
  if (state.rules.blocks && hasOpponentBlockade(state.players, start, color)) return null;
  return { players: setToken(state.players, color, tokenIndex, 0), tokenIndex };
}
