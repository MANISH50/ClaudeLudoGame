import { BASE, TOKENS_PER_PLAYER } from './boardGeometry';
import type { Color } from './color';
import { sortClockwise } from './players';
import { resolveRules } from './rules';
import type { GameConfig, GameState, PlayerState } from './state';

export function createGame(config: GameConfig): GameState {
  if (config.colors.length < 2 || config.colors.length > 4) {
    throw new RangeError(`a game needs 2 to 4 players, got ${config.colors.length}`);
  }
  const colors: Color[] = sortClockwise(config.colors);
  if (colors.length !== config.colors.length) {
    throw new RangeError('player colours must be unique and known');
  }
  const first = colors[0];
  if (first === undefined) throw new RangeError('no players');

  const players: PlayerState[] = colors.map((color) => ({
    color,
    tokens: Array.from({ length: TOKENS_PER_PLAYER }, () => BASE),
    rank: null,
  }));
  return {
    rules: resolveRules(config.rules),
    players,
    turn: { phase: 'roll', player: first, consecutiveSixes: 0 },
    events: [{ type: 'turnStarted', color: first }],
  };
}
