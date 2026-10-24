import { describe, expect, it } from 'vitest';
import { COLORS, squareFor, trackIndex } from '@ludo/engine';
import {
  BASE_SLOTS,
  BOARD_SIZE,
  TRACK_SQUARES,
  baseSlotPoints,
  centreTrianglePoints,
  clusterOffset,
  homeCellPoints,
  pointFor,
  quadrantRect,
  trackPoint,
  trackRect,
  type Point,
} from './boardGeometry';
import { BASE_PROGRESS } from '../runner/progress';

const key = (p: Point) => `${p.x},${p.y}`;

function allTrackPoints(): Point[] {
  return Array.from({ length: TRACK_SQUARES }, (_, i) => trackPoint(i));
}

describe('board geometry', () => {
  it('has 52 track squares, each with coordinates and no duplicates', () => {
    expect(TRACK_SQUARES).toBe(52);
    const points = allTrackPoints();
    expect(points).toHaveLength(52);
    for (const p of points) {
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
    expect(new Set(points.map(key)).size).toBe(52);
  });

  it('keeps every track square on the board', () => {
    for (const p of allTrackPoints()) {
      expect(p.x).toBeGreaterThan(0);
      expect(p.x).toBeLessThan(BOARD_SIZE);
      expect(p.y).toBeGreaterThan(0);
      expect(p.y).toBeLessThan(BOARD_SIZE);
    }
  });

  it('links consecutive track squares by one step, diagonals allowed at the corners', () => {
    for (let i = 0; i < TRACK_SQUARES; i++) {
      const a = trackRect(i);
      const b = trackRect((i + 1) % TRACK_SQUARES);
      const step = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
      expect(step, `square ${i} to ${(i + 1) % TRACK_SQUARES}`).toBe(1);
    }
  });

  it('keeps home columns and centre triangles off the track', () => {
    const track = new Set(allTrackPoints().map(key));
    for (const color of COLORS) {
      for (const p of homeCellPoints(color)) {
        expect(track.has(key(p)), `${color} home cell ${key(p)}`).toBe(false);
      }
      expect(homeCellPoints(color)).toHaveLength(5);
    }
  });

  it('places each colour quadrant in its own corner, four distinct 6 x 6 quadrants', () => {
    const corners = COLORS.map((color) => {
      const rect = quadrantRect(color);
      expect(rect.width).toBe(6);
      expect(rect.height).toBe(6);
      return `${rect.x},${rect.y}`;
    });
    expect(new Set(corners)).toEqual(new Set(['0,0', '9,0', '9,9', '0,9']));
  });

  it('gives each colour four base slots inside its own quadrant', () => {
    for (const color of COLORS) {
      const rect = quadrantRect(color);
      const slots = baseSlotPoints(color);
      expect(slots).toHaveLength(BASE_SLOTS);
      expect(new Set(slots.map(key)).size).toBe(BASE_SLOTS);
      for (const p of slots) {
        expect(p.x).toBeGreaterThan(rect.x);
        expect(p.x).toBeLessThan(rect.x + rect.width);
        expect(p.y).toBeGreaterThan(rect.y);
        expect(p.y).toBeLessThan(rect.y + rect.height);
      }
    }
  });

  it('keeps the centre triangles inside the centre 3 x 3 square', () => {
    for (const color of COLORS) {
      for (const p of centreTrianglePoints(color)) {
        expect(p.x).toBeGreaterThanOrEqual(6);
        expect(p.x).toBeLessThanOrEqual(9);
        expect(p.y).toBeGreaterThanOrEqual(6);
        expect(p.y).toBeLessThanOrEqual(9);
      }
    }
  });

  it('maps every progress value for every colour to a point, using the engine squares', () => {
    for (const color of COLORS) {
      for (let progress = BASE_PROGRESS; progress <= 56; progress++) {
        for (let tokenIndex = 0; tokenIndex < BASE_SLOTS; tokenIndex++) {
          const p = pointFor(color, progress, tokenIndex);
          expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        }
      }
      for (let progress = 0; progress <= 50; progress++) {
        const square = squareFor(color, progress);
        if (square.kind !== 'track') throw new Error('expected a track square');
        expect(pointFor(color, progress, 0)).toEqual(trackPoint(trackIndex(color, progress)));
      }
    }
  });

  it('starts each colour a quarter lap (13 squares) after the previous one', () => {
    COLORS.forEach((color, quarter) => {
      expect(trackIndex(color, 0)).toBe(quarter * 13);
      expect(pointFor(color, 0, 0)).toEqual(trackPoint(quarter * 13));
    });
  });

  it('agrees with the engine on where base is', () => {
    expect(squareFor('red', BASE_PROGRESS).kind).toBe('base');
  });

  it('fans tokens sharing a square into distinct offsets', () => {
    const offsets = [0, 1, 2, 3].map((slot) => clusterOffset(slot, 4));
    expect(new Set(offsets.map(key)).size).toBe(4);
    expect(clusterOffset(0, 1)).toEqual({ x: 0, y: 0 });
  });

  it('rejects an out-of-range track index instead of drawing at undefined', () => {
    expect(() => trackPoint(52)).toThrow(RangeError);
  });
});
