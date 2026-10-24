import { COLORS, isSafeTrackIndex, trackIndex, type Color } from '@ludo/engine';
import {
  centreTrianglePoints,
  homeCellPoints,
  quadrantRect,
  baseSlotPoints,
  trackRect,
  trackPoint,
  BOARD_SIZE,
  TRACK_SQUARES,
  type Point,
  type Rect,
} from './boardGeometry';
import { starPath } from './starPath';

function pointsAttr(points: readonly Point[]): string {
  return points.map((p) => `${p.x},${p.y}`).join(' ');
}

function rectProps(rect: Rect) {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

// Static board art. Derived entirely from boardGeometry and the engine's safe squares.
export function BoardBackground({ activeColors }: { readonly activeColors: readonly Color[] }) {
  const startIndices = COLORS.map((color) => ({ color, index: trackIndex(color, 0) }));
  return (
    <g className="board-art">
      <rect className="board-frame" x={0} y={0} width={BOARD_SIZE} height={BOARD_SIZE} rx={0.35} />

      {COLORS.map((color) => {
        const active = activeColors.includes(color);
        return (
          <g key={`quadrant-${color}`} className={`quadrant quadrant--${color}${active ? '' : ' is-inactive'}`}>
            <rect className="quadrant-fill" {...rectProps(quadrantRect(color))} rx={0.4} />
            {baseSlotPoints(color).map((p, i) => (
              <circle key={i} className="base-slot" cx={p.x} cy={p.y} r={0.62} />
            ))}
          </g>
        );
      })}

      {Array.from({ length: TRACK_SQUARES }, (_, index) => {
        const start = startIndices.find((s) => s.index === index);
        const safe = isSafeTrackIndex(index);
        const cls = ['track-tile', start ? `track-tile--start-${start.color}` : '', safe ? 'is-safe' : '']
          .filter(Boolean)
          .join(' ');
        return <rect key={`track-${index}`} className={cls} {...rectProps(trackRect(index))} />;
      })}

      {COLORS.map((color) => (
        <g key={`home-${color}`} className={`home-column home-column--${color}`}>
          {homeCellPoints(color).map((p, i) => (
            <rect key={i} className="home-tile" x={p.x - 0.5} y={p.y - 0.5} width={1} height={1} />
          ))}
        </g>
      ))}

      {COLORS.map((color) => (
        <polygon key={`centre-${color}`} className={`centre-triangle centre-triangle--${color}`} points={pointsAttr(centreTrianglePoints(color))} />
      ))}

      {Array.from({ length: TRACK_SQUARES }, (_, index) => {
        if (!isSafeTrackIndex(index)) return null;
        const p = trackPoint(index);
        return <path key={`star-${index}`} className="safe-star" d={starPath()} transform={`translate(${p.x} ${p.y})`} />;
      })}
    </g>
  );
}
