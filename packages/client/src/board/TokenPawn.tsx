import type { Color } from '@ludo/engine';
import { ShapeElements, SHAPE_FOR } from '../components/ColorGlyph';

// Glyph sits well inside the pawn body; the shape set is drawn for a -1..1 box.
const GLYPH_SCALE = 0.5;

export interface TokenPawnProps {
  readonly color: Color;
  readonly tokenIndex: number;
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly movable: boolean;
  // Changes each time the token is captured, so the pop animation replays.
  readonly popCount: number;
  readonly onActivate: () => void;
  readonly onHover: (hovering: boolean) => void;
}

// Glossy pawn with a colour-blind-safe shape. Movable pawns are real controls:
// focusable, announced by name, and driven by Enter or Space.
export function TokenPawn({ color, tokenIndex, x, y, label, movable, popCount, onActivate, onHover }: TokenPawnProps) {
  const gradientId = `ludo-token-${color}`;
  return (
    <g
      className={`token token--${color}${movable ? ' token--movable' : ''}`}
      style={{ transform: `translate(${x}px, ${y}px)` }}
      role={movable ? 'button' : 'img'}
      aria-label={label}
      tabIndex={movable ? 0 : -1}
      data-testid={`token-${color}-${tokenIndex}`}
      data-movable={movable ? 'true' : undefined}
      onClick={movable ? onActivate : undefined}
      onKeyDown={
        movable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onActivate();
              }
            }
          : undefined
      }
      onFocus={movable ? () => onHover(true) : undefined}
      onBlur={movable ? () => onHover(false) : undefined}
      onPointerEnter={movable ? () => onHover(true) : undefined}
      onPointerLeave={movable ? () => onHover(false) : undefined}
    >
      <circle className="token-hit" r={0.5} />
      <circle className="token-focus-ring" r={0.5} />
      <g key={popCount} className={popCount > 0 ? 'token-pop' : undefined}>
        <circle className="token-shadow" cx={0.04} cy={0.07} r={0.36} />
        <circle className="token-body" r={0.36} fill={`url(#${gradientId})`} />
        <g transform={`scale(${GLYPH_SCALE})`}>
          <ShapeElements shape={SHAPE_FOR[color]} className="token-glyph" />
        </g>
      </g>
    </g>
  );
}
