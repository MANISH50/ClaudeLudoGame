import { describe, expect, it } from 'vitest';
import {
  BASE,
  FINISHED,
  HOME_PROGRESS,
  SAFE_TRACK_INDICES,
  START_INDEX,
  TRACK_LENGTH,
  isSafeTrackIndex,
  squareFor,
  trackIndex,
} from './boardGeometry';
import { COLORS } from './color';

// Snapshot-style checks: the expected values are literal so any geometry edit is a visible diff.
describe('boardGeometry snapshot', () => {
  it('pins start indices and safe squares', () => {
    expect(START_INDEX).toEqual({ red: 0, green: 13, yellow: 26, blue: 39 });
    expect(SAFE_TRACK_INDICES).toEqual([0, 8, 13, 21, 26, 34, 39, 47]);
  });

  it('marks exactly the eight safe squares across all 52 track squares', () => {
    const safe = Array.from({ length: TRACK_LENGTH }, (_, i) => i).filter(isSafeTrackIndex);
    expect(safe).toEqual([0, 8, 13, 21, 26, 34, 39, 47]);
  });

  it('places the four stars 8 steps after each start square', () => {
    for (const color of COLORS) {
      expect(isSafeTrackIndex(trackIndex(color, 0))).toBe(true);
      expect(isSafeTrackIndex(trackIndex(color, 8))).toBe(true);
    }
  });

  it('gives each colour a 51-square lap that skips exactly one square before its start', () => {
    const skipped: Record<string, number> = {};
    for (const color of COLORS) {
      const visited = new Set<number>();
      for (let progress = 0; progress <= 50; progress++) visited.add(trackIndex(color, progress));
      expect(visited.size).toBe(51);
      const missing = Array.from({ length: TRACK_LENGTH }, (_, i) => i).filter((i) => !visited.has(i));
      expect(missing).toHaveLength(1);
      skipped[color] = missing[0] ?? -1;
    }
    expect(skipped).toEqual({ red: 51, green: 12, yellow: 25, blue: 38 });
  });

  it('maps representative squares for every colour', () => {
    expect(squareFor('red', 0)).toEqual({ kind: 'track', index: 0, safe: true, start: true });
    expect(squareFor('red', 50)).toEqual({ kind: 'track', index: 50, safe: false, start: false });
    expect(squareFor('green', 0)).toEqual({ kind: 'track', index: 13, safe: true, start: true });
    expect(squareFor('green', 50)).toEqual({ kind: 'track', index: 11, safe: false, start: false });
    expect(squareFor('yellow', 0)).toEqual({ kind: 'track', index: 26, safe: true, start: true });
    expect(squareFor('yellow', 50)).toEqual({ kind: 'track', index: 24, safe: false, start: false });
    expect(squareFor('blue', 0)).toEqual({ kind: 'track', index: 39, safe: true, start: true });
    expect(squareFor('blue', 50)).toEqual({ kind: 'track', index: 37, safe: false, start: false });
  });

  it('describes base and finished without a track square', () => {
    expect(squareFor('red', BASE)).toEqual({ kind: 'base' });
    expect(squareFor('red', FINISHED)).toEqual({ kind: 'finished' });
  });

  it('pins the home column path for every colour (progress 51..55 then finish)', () => {
    expect(HOME_PROGRESS).toEqual([51, 52, 53, 54, 55, 56]);
    for (const color of COLORS) {
      const steps = HOME_PROGRESS.slice(0, 5).map((p) => squareFor(color, p));
      expect(steps).toEqual([
        { kind: 'home', step: 1 },
        { kind: 'home', step: 2 },
        { kind: 'home', step: 3 },
        { kind: 'home', step: 4 },
        { kind: 'home', step: 5 },
      ]);
      expect(squareFor(color, FINISHED)).toEqual({ kind: 'finished' });
    }
  });
});
