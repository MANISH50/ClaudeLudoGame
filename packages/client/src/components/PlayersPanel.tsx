import { squareFor, type Color, type GameState } from '@ludo/engine';
import type { Seat } from '../runner/GameRunner';
import { ColorGlyph, SHAPE_FOR } from './ColorGlyph';
import { COLOR_LABEL } from '../game/colors';
import { LEVEL_LABEL } from '../game/setup';

export interface PlayersPanelProps {
  readonly seats: readonly Seat[];
  readonly state: GameState;
}

// Tokens in the home column or finished both count as home for the at-a-glance tally.
function homeCount(color: Color, tokens: readonly number[]): number {
  return tokens.filter((progress) => {
    const kind = squareFor(color, progress).kind;
    return kind === 'home' || kind === 'finished';
  }).length;
}

const ORDINALS = ['1st', '2nd', '3rd', '4th'];

export function PlayersPanel({ seats, state }: PlayersPanelProps) {
  const activeColor = state.turn.phase === 'over' ? null : state.turn.player;
  return (
    <section className="players-panel" aria-labelledby="players-heading">
      <h2 id="players-heading" className="section-title">Players</h2>
      <ul className="player-list">
        {seats.map((seat) => {
          const player = state.players.find((p) => p.color === seat.color);
          const tokens = player?.tokens ?? [];
          const home = homeCount(seat.color, tokens);
          const rank = player?.rank ?? null;
          const isActive = activeColor === seat.color;
          const badge = seat.control.kind === 'human' ? 'Human' : `Bot · ${LEVEL_LABEL[seat.control.level]}`;
          return (
            <li key={seat.color} className={`player-card player-card--${seat.color}${isActive ? ' is-active' : ''}`}>
              <span className="player-glyph">
                <ColorGlyph shape={SHAPE_FOR[seat.color]} />
              </span>
              <span className="player-info">
                <span className="player-name">{seat.name}</span>
                <span className="player-meta">
                  {COLOR_LABEL[seat.color]} <span className={`badge badge--${seat.control.kind}`}>{badge}</span>
                </span>
              </span>
              <span className="player-home" aria-label={`${home} of ${tokens.length} tokens home`}>
                {home}/{tokens.length} home
              </span>
              {rank !== null && <span className="player-rank">{ORDINALS[rank - 1] ?? `${rank}th`}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
