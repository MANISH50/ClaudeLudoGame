import { useEffect, useRef } from 'react';
import type { GameRunner, Seat } from '../runner/GameRunner';
import { useRunnerSnapshot } from '../hooks/useRunnerSnapshot';
import { ColorGlyph, SHAPE_FOR } from '../components/ColorGlyph';

export interface ResultScreenProps {
  readonly runner: GameRunner;
  readonly onPlayAgain: () => void;
  readonly onChangeMode: () => void;
}

const ORDINALS = ['1st', '2nd', '3rd', '4th'];

// Focus moves to the heading on arrival, so screen readers announce the result.
export function ResultScreen({ runner, onPlayAgain, onChangeMode }: ResultScreenProps) {
  const snapshot = useRunnerSnapshot(runner);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const ranked = snapshot.state.players
    .filter((p) => p.rank !== null)
    .slice()
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
  const seatFor = (color: Seat['color']): Seat | undefined => snapshot.seats.find((s) => s.color === color);
  const winner = ranked[0];
  const winnerSeat = winner === undefined ? undefined : seatFor(winner.color);

  return (
    <section className="result" aria-labelledby="result-heading">
      <h1 id="result-heading" className="result-title" tabIndex={-1} ref={headingRef}>
        {winnerSeat === undefined ? 'Game over' : `${winnerSeat.name} wins!`}
      </h1>
      <ol className="ranking">
        {ranked.map((player, index) => {
          const seat = seatFor(player.color);
          return (
            <li key={player.color} className={`ranking-row ranking-row--${player.color}`}>
              <span className="ranking-place">{ORDINALS[index] ?? `${index + 1}th`}</span>
              <span className="ranking-glyph">
                <ColorGlyph shape={SHAPE_FOR[player.color]} />
              </span>
              <span className="ranking-name">{seat?.name ?? player.color}</span>
              <span className="ranking-badge">{seat?.control.kind === 'human' ? 'Human' : 'Bot'}</span>
            </li>
          );
        })}
      </ol>
      <div className="result-actions">
        <button type="button" className="btn btn-primary" onClick={onPlayAgain}>
          Play again
        </button>
        <button type="button" className="btn btn-ghost" onClick={onChangeMode}>
          Change mode
        </button>
      </div>
    </section>
  );
}
