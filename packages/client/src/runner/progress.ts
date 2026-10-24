import { squareFor, type Color } from '@ludo/engine';

// The engine keeps BASE private, so the client mirrors it here. A test checks it
// against squareFor so the two cannot drift apart silently.
export const BASE_PROGRESS = -1;

export function isAtBase(color: Color, progress: number): boolean {
  return squareFor(color, progress).kind === 'base';
}
