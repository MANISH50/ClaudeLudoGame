import { COLORS, squareFor, type Color } from '@ludo/engine';

// The only file with board coordinates. Units are board cells on a 15 x 15 grid,
// so the SVG viewBox is simply 0 0 15 15 and stays crisp at any size.

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const BOARD_SIZE = 15;
export const BASE_SLOTS = 4;

const CENTRE: Point = { x: 7.5, y: 7.5 };

// The 52 common track squares, clockwise, as top-left cells (column, row). The
// array index is the engine's track index, so Red's start (index 0) is the top
// arm's left cell. Consecutive cells touch diagonally at the cross's inner corners.
const TRACK_CELLS: readonly (readonly [number, number])[] = [
  [6, 0], [7, 0], [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], [8, 9], [8, 10], [8, 11],
  [8, 12], [8, 13], [8, 14], [7, 14], [6, 14], [6, 13], [6, 12], [6, 11],
  [6, 10], [6, 9], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 5],
  [6, 4], [6, 3], [6, 2], [6, 1],
];

// Red's own parts. Every other colour is this geometry turned a quarter turn per seat.
const RED_HOME_CELLS: readonly Point[] = [1, 2, 3, 4, 5].map((row) => ({ x: 7.5, y: row + 0.5 }));
const RED_BASE_SLOTS: readonly Point[] = [
  { x: 1.5, y: 1.5 },
  { x: 4.5, y: 1.5 },
  { x: 1.5, y: 4.5 },
  { x: 4.5, y: 4.5 },
];
const RED_QUADRANT: Rect = { x: 0, y: 0, width: 6, height: 6 };
const RED_TRIANGLE: readonly Point[] = [
  { x: 6, y: 6 },
  { x: 9, y: 6 },
  CENTRE,
];

// Tokens that finish share the centre; these offsets keep up to four apart.
const FINISH_OFFSETS: readonly Point[] = [
  { x: -0.25, y: -0.25 },
  { x: 0.25, y: -0.25 },
  { x: -0.25, y: 0.25 },
  { x: 0.25, y: 0.25 },
];

const TRACK_POINTS: readonly Point[] = TRACK_CELLS.map(([column, row]) => ({ x: column + 0.5, y: row + 0.5 }));

function quarterTurnsFor(color: Color): number {
  return COLORS.indexOf(color);
}

// One clockwise quarter turn about the board centre, as the screen sees it (y points down).
function turn(point: Point, quarters: number): Point {
  let dx = point.x - CENTRE.x;
  let dy = point.y - CENTRE.y;
  for (let i = 0; i < quarters; i++) {
    const nextDx = -dy;
    dy = dx;
    dx = nextDx;
  }
  return { x: CENTRE.x + dx, y: CENTRE.y + dy };
}

function turnRect(rect: Rect, quarters: number): Rect {
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ].map((p) => turn(p, quarters));
  const xs = corners.map((p) => p.x);
  const ys = corners.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

function requireAt<T>(list: readonly T[], index: number, what: string): T {
  const item = list[index];
  if (item === undefined) throw new RangeError(`no ${what} at index ${index}`);
  return item;
}

// Track index is the engine's index. Coordinates are cell centres.
export function trackPoint(index: number): Point {
  return requireAt(TRACK_POINTS, index, 'track square');
}

// The top-left cell of a track square, for drawing the tile.
export function trackRect(index: number): Rect {
  const [column, row] = requireAt(TRACK_CELLS, index, 'track square');
  return { x: column, y: row, width: 1, height: 1 };
}

export function quadrantRect(color: Color): Rect {
  return turnRect(RED_QUADRANT, quarterTurnsFor(color));
}

export function baseSlotPoints(color: Color): Point[] {
  return RED_BASE_SLOTS.map((p) => turn(p, quarterTurnsFor(color)));
}

export function homeCellPoints(color: Color): Point[] {
  return RED_HOME_CELLS.map((p) => turn(p, quarterTurnsFor(color)));
}

export function centreTrianglePoints(color: Color): Point[] {
  return RED_TRIANGLE.map((p) => turn(p, quarterTurnsFor(color)));
}

// Where a token is drawn for a given progress. The engine's squareFor decides the
// square; this only maps that square to coordinates.
export function pointFor(color: Color, progress: number, tokenIndex: number): Point {
  const square = squareFor(color, progress);
  switch (square.kind) {
    case 'base':
      return requireAt(baseSlotPoints(color), tokenIndex, 'base slot');
    case 'track':
      return trackPoint(square.index);
    case 'home':
      return requireAt(homeCellPoints(color), square.step - 1, 'home cell');
    case 'finished': {
      const offset = requireAt(FINISH_OFFSETS, tokenIndex, 'finish spot');
      return { x: CENTRE.x + offset.x, y: CENTRE.y + offset.y };
    }
  }
}

// Tokens sharing one square fan out in a small 2x2 cluster instead of stacking.
export function clusterOffset(slot: number, count: number): Point {
  if (count <= 1) return { x: 0, y: 0 };
  const spread = 0.24;
  return { x: ((slot % 2) - 0.5) * spread * 2, y: (Math.floor(slot / 2) - 0.5) * spread * 2 };
}

export const TRACK_SQUARES = TRACK_CELLS.length;
