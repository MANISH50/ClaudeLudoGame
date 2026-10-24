import type { Color } from '@ludo/engine';

// Token progress as currently drawn. It lags the engine state while steps play out.
export type Positions = Readonly<Partial<Record<Color, readonly number[]>>>;

export function tokenKey(color: Color, tokenIndex: number): string {
  return `${color}-${tokenIndex}`;
}
