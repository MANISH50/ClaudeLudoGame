import type { Color, Move } from '@ludo/engine';
import type { MoveOption } from '../runner/GameRunner';
import type { Positions } from '../animation/types';
import { tokenKey } from '../animation/types';
import { TokenPawn } from './TokenPawn';
import { BoardBackground } from './BoardBackground';
import { placeTokens } from './placeTokens';
import { BOARD_SIZE, pointFor } from './boardGeometry';
import { describeProgress } from '../game/tokenText';
import { COLOR_LABEL } from '../game/colors';
import { BoardDefs } from './BoardDefs';

export interface BoardProps {
  readonly positions: Positions;
  readonly pops: Readonly<Record<string, number>>;
  readonly activeColors: readonly Color[];
  readonly turnColor: Color | null;
  readonly options: readonly MoveOption[];
  readonly hoverKey: string | null;
  readonly onMove: (move: Move) => void;
  readonly onHoverKey: (key: string | null) => void;
}

// Pure view. Positions come from the animation hook; legal moves come from the runner.
export function Board(props: BoardProps) {
  const { positions, pops, activeColors, turnColor, options, hoverKey, onMove, onHoverKey } = props;
  const optionByKey = new Map(options.map((o) => [tokenKey(o.move.color, o.move.tokenIndex), o]));
  const placed = placeTokens(positions, activeColors);
  const hovered = hoverKey === null ? undefined : optionByKey.get(hoverKey);
  const destination = hovered === undefined ? null : pointFor(hovered.move.color, hovered.to, hovered.move.tokenIndex);

  return (
    <svg
      className="board-svg"
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      role="group"
      aria-label="Ludo board"
      data-turn={turnColor ?? 'none'}
    >
      <BoardDefs />
      <BoardBackground activeColors={activeColors} />
      {destination !== null && <circle className="destination" cx={destination.x} cy={destination.y} r={0.42} />}
      <g className="tokens">
        {placed.map((token) => {
          const key = tokenKey(token.color, token.tokenIndex);
          const option = optionByKey.get(key);
          const label = option === undefined
            ? `${COLOR_LABEL[token.color]} token ${token.tokenIndex + 1}, ${describeProgress(token.color, token.progress)}`
            : `Move ${COLOR_LABEL[token.color]} token ${token.tokenIndex + 1}, ${describeProgress(token.color, token.progress)}${option.captures ? ', captures a token' : ''}`;
          return (
            <TokenPawn
              key={key}
              color={token.color}
              tokenIndex={token.tokenIndex}
              x={token.x}
              y={token.y}
              label={label}
              movable={option !== undefined}
              popCount={pops[key] ?? 0}
              onActivate={() => {
                if (option !== undefined) onMove(option.move);
              }}
              onHover={(hovering) => onHoverKey(hovering ? key : null)}
            />
          );
        })}
      </g>
    </svg>
  );
}
