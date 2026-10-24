import type { Move } from '@ludo/engine';
import type { MoveOption } from '../runner/GameRunner';
import { COLOR_LABEL } from '../game/colors';
import { tokenKey } from '../animation/types';

export interface MoveChoicesProps {
  readonly options: readonly MoveOption[];
  readonly hoverKey: string | null;
  readonly describeFrom: (move: Move) => string;
  readonly onMove: (move: Move) => void;
  readonly onHoverKey: (key: string | null) => void;
}

// Large touch targets for the same moves the board offers. This is the reliable path
// on a 360 px screen, where a token on the board is smaller than a finger.
export function MoveChoices({ options, hoverKey, describeFrom, onMove, onHoverKey }: MoveChoicesProps) {
  if (options.length === 0) return null;
  return (
    <section className="move-choices" aria-label="Legal moves">
      <h3 className="section-title">Your moves</h3>
      <ul className="move-list">
        {options.map((option) => {
          const { color, tokenIndex } = option.move;
          const key = tokenKey(color, tokenIndex);
          return (
            <li key={key}>
              <button
                type="button"
                className={`move-button${hoverKey === key ? ' is-hovered' : ''}`}
                onClick={() => onMove(option.move)}
                onPointerEnter={() => onHoverKey(key)}
                onPointerLeave={() => onHoverKey(null)}
                onFocus={() => onHoverKey(key)}
                onBlur={() => onHoverKey(null)}
              >
                <span className={`move-swatch move-swatch--${color}`} aria-hidden="true" />
                <span className="move-text">
                  Move {COLOR_LABEL[color]} token {tokenIndex + 1}
                  <span className="move-sub">
                    {describeFrom(option.move)}
                    {option.captures ? ', captures' : ''}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
