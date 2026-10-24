import type { Color } from './color';

// Single source of board geometry. Nothing else may hard-code track indices.

export const TRACK_LENGTH = 52;
export const TOKENS_PER_PLAYER = 4;

export const BASE = -1;
export const LAST_TRACK_PROGRESS = 50;
export const HOME_PROGRESS: readonly number[] = [51, 52, 53, 54, 55, 56];
export const FINISHED = 56;

// Each colour's progress 0 is its own start square, spaced a quarter-lap apart.
export const START_INDEX: Readonly<Record<Color, number>> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

export const SAFE_TRACK_INDICES: readonly number[] = [0, 8, 13, 21, 26, 34, 39, 47];

const SAFE_SET: ReadonlySet<number> = new Set(SAFE_TRACK_INDICES);

export type SquareRef =
  | { readonly kind: 'base' }
  | { readonly kind: 'track'; readonly index: number; readonly safe: boolean; readonly start: boolean }
  | { readonly kind: 'home'; readonly step: number }
  | { readonly kind: 'finished' };

export function isSafeTrackIndex(index: number): boolean {
  return SAFE_SET.has(index);
}

// Caller must pass a track progress (0..50); home and base have no track square.
export function trackIndex(color: Color, progress: number): number {
  return (START_INDEX[color] + progress) % TRACK_LENGTH;
}

export function squareFor(color: Color, progress: number): SquareRef {
  if (progress === BASE) return { kind: 'base' };
  if (progress === FINISHED) return { kind: 'finished' };
  if (progress > LAST_TRACK_PROGRESS) return { kind: 'home', step: progress - LAST_TRACK_PROGRESS };
  const index = trackIndex(color, progress);
  return { kind: 'track', index, safe: isSafeTrackIndex(index), start: progress === 0 };
}

export function isOnTrack(progress: number): boolean {
  return progress >= 0 && progress <= LAST_TRACK_PROGRESS;
}

