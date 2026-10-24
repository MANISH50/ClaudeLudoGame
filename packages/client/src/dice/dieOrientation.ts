import type { Die } from '@ludo/engine';

export interface Orientation {
  // Degrees about the X and Y axes, as CSS rotateX and rotateY take them.
  readonly x: number;
  readonly y: number;
}

// Rotation that turns each face to the viewer. Mirrors the face placement in the stylesheet.
const FACE_TO_VIEWER: Readonly<Record<Die, Orientation>> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: 0, y: -180 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 90, y: 0 },
};

export function faceOrientation(value: Die): Orientation {
  return FACE_TO_VIEWER[value];
}

// Each roll adds at least three full turns, always forward, so the die tumbles
// visibly and never unwinds back to a previous face.
export function spinTo(current: Orientation, value: Die): Orientation {
  const target = FACE_TO_VIEWER[value];
  return { x: settle(current.x, target.x), y: settle(current.y, target.y) };
}

function settle(current: number, target: number): number {
  const floor = current + 3 * 360;
  const turns = Math.ceil((floor - target) / 360);
  return target + turns * 360;
}
