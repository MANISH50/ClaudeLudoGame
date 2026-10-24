import { COLORS, type Color } from '@ludo/engine';
import { BASE_PROGRESS } from '../runner/progress';
import type { Positions } from '../animation/types';
import { BASE_SLOTS, clusterOffset, pointFor, type Point } from './boardGeometry';

export interface PlacedToken {
  readonly color: Color;
  readonly tokenIndex: number;
  readonly progress: number;
  readonly x: number;
  readonly y: number;
}

// Places every drawn token. Tokens sharing a square are fanned into a small cluster.
export function placeTokens(positions: Positions, activeColors: readonly Color[]): PlacedToken[] {
  const raw: { color: Color; tokenIndex: number; progress: number; point: Point }[] = [];
  for (const color of COLORS) {
    if (!activeColors.includes(color)) continue;
    for (let tokenIndex = 0; tokenIndex < BASE_SLOTS; tokenIndex++) {
      const progress = positions[color]?.[tokenIndex] ?? BASE_PROGRESS;
      raw.push({ color, tokenIndex, progress, point: pointFor(color, progress, tokenIndex) });
    }
  }

  const counts = new Map<string, number>();
  for (const item of raw) {
    const key = squareKey(item.point);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const seen = new Map<string, number>();
  return raw.map((item) => {
    const key = squareKey(item.point);
    const slot = seen.get(key) ?? 0;
    seen.set(key, slot + 1);
    const offset = clusterOffset(slot, counts.get(key) ?? 1);
    return {
      color: item.color,
      tokenIndex: item.tokenIndex,
      progress: item.progress,
      x: item.point.x + offset.x,
      y: item.point.y + offset.y,
    };
  });
}

function squareKey(point: Point): string {
  return `${point.x},${point.y}`;
}
