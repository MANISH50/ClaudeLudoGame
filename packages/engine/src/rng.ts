import type { Die } from './state';

// Must return a value in [0, 1). Injected so the engine stays deterministic under test.
export type Rng = () => number;

export function rollDie(rng: Rng): Die {
  const r = rng();
  if (!(r >= 0 && r < 1)) throw new RangeError(`rng must return a value in [0, 1), got ${r}`);
  return (Math.floor(r * 6) + 1) as Die;
}
