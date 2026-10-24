import type { Die as DieValue } from '@ludo/engine';
import type { RunnerSnapshot, Seat } from '../runner/GameRunner';
import { Die } from '../dice/Die';

export interface TurnPanelProps {
  readonly snapshot: RunnerSnapshot;
  readonly lastRoll: { readonly value: DieValue; readonly id: number } | null;
  readonly onRoll: () => void;
}

function seatFor(snapshot: RunnerSnapshot): Seat | undefined {
  const turn = snapshot.state.turn;
  if (turn.phase === 'over') return undefined;
  return snapshot.seats.find((s) => s.color === turn.player);
}

// The "Your turn" label is the main turn cue. Bots get a "thinking" line instead.
export function TurnPanel({ snapshot, lastRoll, onRoll }: TurnPanelProps) {
  const turn = snapshot.state.turn;
  const seat = seatFor(snapshot);
  const over = turn.phase === 'over';
  const humanTurn = !over && seat?.control.kind === 'human';

  let heading: string;
  let hint: string;
  if (over) {
    heading = 'Game over';
    hint = 'See the final ranking.';
  } else if (humanTurn) {
    heading = 'Your turn';
    if (turn.phase === 'roll') {
      hint = 'Roll the dice to start your turn.';
    } else if (snapshot.options.length > 1) {
      hint = 'Choose a token to move. Tab moves between tokens, Enter moves.';
    } else {
      hint = 'Move your token.';
    }
  } else {
    heading = 'Bot is thinking';
    hint = 'Its move comes after a short pause.';
  }

  const dieValue: DieValue = turn.phase === 'move' ? turn.die : (lastRoll?.value ?? 1);

  return (
    <section className="turn-panel" aria-labelledby="turn-heading">
      <div className="turn-heading-row">
        <h2 id="turn-heading" className={`turn-heading${humanTurn ? ' is-human' : ''}`}>
          {heading}
        </h2>
        {seat !== undefined && !over && (
          <span className={`turn-colour turn-colour--${seat.color}`}>{seat.name}</span>
        )}
      </div>
      <p className="turn-hint">{hint}</p>
      <div className="turn-controls">
        <div className="die-holder">
          <Die value={dieValue} rollId={lastRoll?.id ?? 0} />
        </div>
        <button type="button" className="btn btn-primary roll-button" onClick={onRoll} disabled={!snapshot.canRoll}>
          Roll the dice
        </button>
      </div>
    </section>
  );
}
